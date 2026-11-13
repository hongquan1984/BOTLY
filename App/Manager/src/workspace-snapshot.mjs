import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const execFileAsync = promisify(execFile);
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
const sensitive = /(^|\/)(secrets?|credentials?|\.aws|\.ssh|\.docker|\.codex)(\/|$)|(^|\/)\.env(?:\.|$)|(^|\/)(?:auth\.json|\.npmrc|\.pypirc|\.netrc|id_rsa|id_ed25519)(\/|$)|\.(?:pem|p12|pfx|key)$/i;

export function normalizeAllowedFile(relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.startsWith('/') || /^[A-Za-z]:/.test(relative)) throw Error(`Invalid relative file path: ${relative}`);
  const parts = relative.split('/');
  if (parts.some(part => !part || part === '.' || part === '..') || sensitive.test(relative)) throw Error(`Unsafe or sensitive path rejected: ${relative}`);
  return parts.join('/');
}

function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`));
}

export async function resolveSafeFile(root, relative, adapters = {}) {
  const resolved = await resolveSafePath(root, relative, adapters);
  if (!resolved.exists) throw Error(`Allowed source file missing: ${relative}`);
  return resolved;
}

export async function resolveSafePath(root, relative, adapters = {}) {
  relative = normalizeAllowedFile(relative);
  const lstat = adapters.lstat || fs.lstat;
  const realpath = adapters.realpath || fs.realpath;
  const canonicalRoot = await realpath(root);
  let cursor = canonicalRoot;
  const parts = relative.split('/');
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    cursor = path.join(cursor, part);
    let info;
    try { info = await lstat(cursor); } catch (error) {
      if (error.code === 'ENOENT' && index === parts.length - 1) return { root: canonicalRoot, target: cursor, relative, exists: false };
      if (error.code === 'ENOENT') throw Error(`Allowed parent directory missing: ${relative}`);
      throw error;
    }
    if (info.isSymbolicLink() || info.isReparsePoint?.()) throw Error(`Symlink/junction rejected: ${relative}`);
    const canonicalCursor = await realpath(cursor);
    if (!inside(canonicalRoot, canonicalCursor)) throw Error(`Path escapes source root: ${relative}`);
  }
  const finalStat = await lstat(cursor);
  if (!finalStat.isFile()) throw Error(`Allowed path is not a regular file: ${relative}`);
  return { root: canonicalRoot, target: cursor, relative, exists: true };
}

async function gitMetadata(root, relative) {
  try {
    const tracked = await execFileAsync('git', ['-C', root, 'ls-files', '--error-unmatch', '--', relative], { encoding: 'utf8', windowsHide: true });
    const status = await execFileAsync('git', ['-C', root, 'status', '--short', '--untracked-files=all', '--', relative], { encoding: 'utf8', windowsHide: true });
    return { sourceStatus: 'tracked', gitStatus: status.stdout.trim() || 'clean' };
  } catch (error) {
    if (error.code !== 1 && error.code !== 'ENOENT' && !/not a git repository/i.test(error.stderr || '')) throw error;
    try {
      const status = await execFileAsync('git', ['-C', root, 'status', '--short', '--untracked-files=all', '--', relative], { encoding: 'utf8', windowsHide: true });
      const line = status.stdout.trim();
      if (line.startsWith('!!')) return { sourceStatus: 'untracked', gitStatus: 'ignored' };
      return { sourceStatus: 'untracked', gitStatus: line || 'untracked' };
    } catch (statusError) {
      if (statusError.code === 'ENOENT' || /not a git repository/i.test(statusError.stderr || '')) return { sourceStatus: 'untracked', gitStatus: 'not-a-git-repository' };
      throw statusError;
    }
  }
}

async function walkFiles(root, current = root, output = []) {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isSymbolicLink()) throw Error(`Snapshot contains a symlink: ${path.relative(root, full)}`);
    if (entry.isDirectory()) await walkFiles(root, full, output);
    else if (entry.isFile()) output.push(path.relative(root, full).split(path.sep).join('/'));
    else throw Error(`Snapshot contains a non-regular entry: ${path.relative(root, full)}`);
  }
  return output;
}

export async function inspectSnapshot(snapshotRoot, manifest) {
  const present = manifest.files.filter(file => file.workspaceExists !== false);
  const allowed = new Set(present.map(file => file.path));
  const actual = await walkFiles(snapshotRoot);
  const payloadFiles = actual.filter(file => file !== '.manager/snapshot-manifest.json');
  const extra = payloadFiles.filter(file => !allowed.has(file));
  const missing = [...allowed].filter(file => !payloadFiles.includes(file));
  if (extra.length || missing.length) throw Error(`Snapshot inventory mismatch; extra=${extra.join(',')}; missing=${missing.join(',')}`);
  for (const file of manifest.files) {
    if (file.workspaceExists === false) continue;
    const target = await resolveSafeFile(snapshotRoot, file.path);
    const bytes = await fs.readFile(target.target);
    const actualHash = sha256(bytes);
    if (actualHash !== file.workspaceSha256) throw Error(`Snapshot checksum mismatch: ${file.path}`);
  }
  return { files: payloadFiles.sort(), sha256: sha256(Buffer.from(JSON.stringify(manifest))) };
}

export async function createTaskSnapshot({ projectRoot, snapshotRoot, taskId, allowedFiles, expectedHashes }) {
  if (!/^HC-[A-Z0-9-]{3,}$/.test(taskId || '')) throw Error('Invalid task ID');
  if (!Array.isArray(allowedFiles) || !allowedFiles.length) throw Error('Snapshot requires an explicit file allowlist');
  const normalized = allowedFiles.map(normalizeAllowedFile);
  if (new Set(normalized).size !== normalized.length) throw Error('Duplicate allowlist paths');
  if (!expectedHashes || normalized.some(file => expectedHashes[file] !== null && !/^[A-Fa-f0-9]{64}$/.test(expectedHashes[file] || ''))) throw Error('Explicit SHA-256 or explicit null (approved absent-file baseline) is required for every allowed file');
  const canonicalProject = await fs.realpath(projectRoot);
  const finalRoot = path.resolve(snapshotRoot);
  if (await fs.stat(finalRoot).then(() => true, () => false)) throw Error(`Snapshot destination already exists: ${finalRoot}`);
  await fs.mkdir(finalRoot, { recursive: true });
  const records = [];
  const baselineContents = new Map();
  try {
    for (const relative of normalized) {
      const source = await resolveSafePath(canonicalProject, relative);
      if (!source.exists && expectedHashes[relative] !== null) throw Error(`Source file is missing but approved baseline is not absent: ${relative}`);
      if (source.exists && expectedHashes[relative] === null) throw Error(`Source file exists but approved baseline declares it absent: ${relative}`);
      const preBytes = source.exists ? await fs.readFile(source.target) : null;
      baselineContents.set(relative, preBytes === null ? null : Buffer.from(preBytes));
      const preHash = preBytes === null ? null : sha256(preBytes);
      const expected = expectedHashes[relative] === null ? null : expectedHashes[relative].toUpperCase();
      if (preHash !== expected) throw Error(`Source checksum differs from approved baseline: ${relative}`);
      const output = path.resolve(finalRoot, ...relative.split('/'));
      if (!inside(finalRoot, output)) throw Error(`Snapshot output escaped: ${relative}`);
      let copiedHash = null;
      await fs.mkdir(path.dirname(output), { recursive: true });
      if (preBytes !== null) {
        await fs.writeFile(output, preBytes, { flag: 'wx' });
        copiedHash = sha256(await fs.readFile(output));
      }
      if (copiedHash !== preHash) throw Error(`Snapshot copy checksum mismatch: ${relative}`);
      const git = await gitMetadata(canonicalProject, relative);
      records.push({ path: relative, exists: source.exists, workspaceExists: source.exists, sha256: preHash, workspaceSha256: copiedHash, bytes: preBytes?.length || 0, ...git });
    }
    for (const record of records) {
      const source = await resolveSafePath(canonicalProject, record.path);
      const currentHash = source.exists ? sha256(await fs.readFile(source.target)) : null;
      if (source.exists !== record.exists || currentHash !== record.sha256) throw Error(`Source changed during snapshot creation: ${record.path}`);
    }
    const manifest = { version: 1, taskId, createdAt: new Date().toISOString(), files: records };
    await fs.mkdir(path.join(finalRoot, '.manager'), { recursive: true });
    await fs.writeFile(path.join(finalRoot, '.manager', 'snapshot-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    await inspectSnapshot(finalRoot, manifest);
    return { root: finalRoot, manifest, baselineContents };
  } catch (error) {
    error.snapshotRoot = finalRoot;
    error.snapshotStatus = 'INCOMPLETE_PRESERVED_FOR_INSPECTION';
    throw error;
  }
}

export async function verifySourceBaseline(projectRoot, manifest) {
  const canonicalProject = await fs.realpath(projectRoot);
  const results = [];
  for (const entry of manifest.files) {
    const source = await resolveSafePath(canonicalProject, entry.path);
    const current = source.exists ? sha256(await fs.readFile(source.target)) : null;
    results.push({ path: entry.path, expectedExists: entry.exists !== false, currentExists: source.exists, expectedSha256: entry.sha256, currentSha256: current, matches: source.exists === (entry.exists !== false) && current === entry.sha256 });
  }
  return { matches: results.every(result => result.matches), files: results };
}

export async function applyPatchToSnapshot({ snapshotRoot, manifest, patches, allowlist = manifest.files.map(file => file.path) }) {
  await inspectSnapshot(snapshotRoot, manifest);
  if (!Array.isArray(patches) || !patches.length) throw Error('Patch list is empty');
  const paths = patches.map(patch => normalizeAllowedFile(patch?.path));
  if (new Set(paths).size !== paths.length || paths.some(file => !allowlist.includes(file))) throw Error('Patch contains duplicate or unauthorized path');
  const planned = [];
  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i];
    const record = manifest.files.find(file => file.path === paths[i]);
    const deleting = patch.delete === true;
    const patchBase = typeof patch.baseSha256 === 'string' ? patch.baseSha256.toUpperCase() : patch.baseSha256;
    if (!record || (deleting ? typeof patch.content !== 'undefined' : typeof patch.content !== 'string') || patchBase !== record.workspaceSha256) throw Error(`Patch precondition mismatch: ${paths[i]}`);
    if (deleting && record.workspaceExists === false) throw Error(`Cannot delete an absent snapshot path: ${paths[i]}`);
    const target = await resolveSafePath(snapshotRoot, paths[i]);
    const current = target.exists ? await fs.readFile(target.target) : null;
    if (target.exists !== (record.workspaceExists !== false) || (current === null ? null : sha256(current)) !== record.workspaceSha256) throw Error(`Snapshot changed before patch: ${paths[i]}`);
    const nextBytes = deleting ? null : Buffer.from(patch.content, 'utf8');
    planned.push({ target: target.target, record, patch, before: current, beforeHash: record.workspaceSha256, beforeExists: target.exists, nextBytes, nextHash: nextBytes === null ? null : sha256(nextBytes), nextExists: nextBytes !== null });
  }
  const applied = [];
  try {
    for (const item of planned) {
      const current = await fs.lstat(item.target).then(async stat => stat.isFile() ? fs.readFile(item.target) : Promise.reject(Error(`Unsafe snapshot target: ${item.record.path}`)), error => error.code === 'ENOENT' ? null : Promise.reject(error));
      if ((current !== null) !== item.beforeExists || (current === null ? null : sha256(current)) !== item.beforeHash) throw Error(`Snapshot changed during patch transaction: ${item.record.path}`);
      if (item.nextExists) {
        const stage = `${item.target}.${crypto.randomUUID()}.stage`;
        await fs.writeFile(stage, item.nextBytes, { flag: 'wx' });
        try { await fs.rename(stage, item.target); } catch (error) { await fs.rm(stage, { force: true }); throw error; }
      } else await fs.unlink(item.target);
      item.record.workspaceExists = item.nextExists;
      item.record.workspaceSha256 = item.nextHash;
      item.record.bytes = item.nextBytes?.length || 0;
      applied.push(item);
    }
  } catch (error) {
    for (const item of applied.reverse()) {
      try {
        const current = await fs.lstat(item.target).then(stat => stat.isFile() ? fs.readFile(item.target) : null, error => error.code === 'ENOENT' ? null : Promise.reject(error));
        const currentMatchesPost = (current !== null) === item.nextExists && (current === null ? null : sha256(current)) === item.nextHash;
        if (currentMatchesPost) {
          if (item.beforeExists) {
            const restore = `${item.target}.${crypto.randomUUID()}.restore`;
            await fs.writeFile(restore, item.before, { flag: 'wx' });
            await fs.rename(restore, item.target);
          } else if (current !== null) await fs.unlink(item.target);
          item.record.workspaceExists = item.beforeExists;
          item.record.workspaceSha256 = item.beforeHash;
          item.record.bytes = item.before?.length || 0;
        }
      } catch {}
    }
    throw error;
  }
  await fs.writeFile(path.join(snapshotRoot, '.manager', 'snapshot-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await inspectSnapshot(snapshotRoot, manifest);
  return planned.map(item => ({ path: item.record.path, sha256: item.nextHash }));
}

export async function changedSnapshotFiles(snapshotRoot, initialManifest, finalManifest) {
  const initial = new Map(initialManifest.files.map(file => [file.path, file.sha256]));
  const finalPaths = new Set(finalManifest.files.map(file => file.path));
  if (initial.size !== finalPaths.size || [...initial.keys()].some(file => !finalPaths.has(file))) throw Error('Snapshot manifest file inventory changed');
  await inspectSnapshot(snapshotRoot, finalManifest);
  const initialRecords = new Map(initialManifest.files.map(file => [file.path, file]));
  return finalManifest.files.filter(file => {
    const before = initialRecords.get(file.path);
    return (before.exists !== false) !== (file.workspaceExists !== false) || before.sha256 !== file.workspaceSha256;
  }).map(file => file.path).sort();
}
