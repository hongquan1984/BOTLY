import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { atomicJson } from './state-store.mjs';
import { changedSnapshotFiles, inspectSnapshot, resolveSafePath, verifySourceBaseline, normalizeAllowedFile } from './workspace-snapshot.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const absentHash = null;

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

function equalImage(existsA, hashA, existsB, hashB) {
  return existsA === existsB && (existsA ? hashA === hashB : hashA === null && hashB === null);
}

function expectedFullDiff(relative, original, replacement) {
  const oldText = (original || Buffer.alloc(0)).toString('utf8');
  const newText = (replacement || Buffer.alloc(0)).toString('utf8');
  return `--- a/${relative}\n+++ b/${relative}\n@@ full-file replacement @@\n${oldText.split(/(?<=\n)/).map(line => `-${line}`).join('')}${newText.split(/(?<=\n)/).map(line => `+${line}`).join('')}`;
}

function diffPaths(diffByPath) {
  const paths = [];
  for (const [key, diff] of Object.entries(diffByPath || {})) {
    normalizeAllowedFile(key);
    const header = typeof diff === 'string' ? diff.match(/^\+\+\+ b\/(.+)$/m)?.[1]?.replaceAll('\\', '/') : null;
    if (!header || header !== key) throw Error(`Diff header does not match approved path: ${key}`);
    paths.push(key);
  }
  return paths.sort();
}

async function resolveDirectoryNoLinks(directory) {
  const absolute = path.resolve(directory);
  const parsed = path.parse(absolute);
  let cursor = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink() || stat.isReparsePoint?.()) throw Error(`Symlink/junction in Apply Gate directory: ${cursor}`);
    if (!stat.isDirectory()) throw Error(`Apply Gate path component is not a directory: ${cursor}`);
  }
  return fs.realpath(absolute);
}

function approvalDigest(plan) {
  const payload = {
    taskId: plan.taskId,
    planId: plan.planId,
    approvedFiles: plan.approvedFiles,
    operations: plan.operations.map(({ path: file, preconditionExists, preconditionSha256, replacementExists, replacementSha256, diffSha256 }) => ({ path: file, preconditionExists, preconditionSha256, replacementExists, replacementSha256, diffSha256 }))
  };
  return hash(Buffer.from(JSON.stringify(payload)));
}

/** Creates a non-mutating plan after independently comparing both manifests and exact file bytes. */
export async function prepareApplyPlan({ projectRoot, snapshotRoot, initialManifest, finalManifest, allowlist, managerDecision, tests, diffByPath, runId }) {
  const approved = [...new Set((allowlist || []).map(normalizeAllowedFile))].sort();
  if (!approved.length || approved.some(file => !initialManifest.files.some(entry => entry.path === file))) throw Error('Apply Gate allowlist is invalid or not part of the captured snapshot');
  if (managerDecision?.decision !== 'PASS' || managerDecision.taskId !== initialManifest.taskId) throw Error('Apply Gate requires an independent Manager PASS for this task');
  if (!Array.isArray(tests) || tests.length === 0 || tests.some(test => test.result !== 'PASS' || test.exitCode !== 0)) throw Error('Apply Gate requires passing test evidence');
  await inspectSnapshot(snapshotRoot, finalManifest);
  const changed = await changedSnapshotFiles(snapshotRoot, initialManifest, finalManifest);
  if (changed.length === 0) throw Error('Apply Gate refuses an empty change set');
  if (changed.some(file => !approved.includes(file))) throw Error(`Actual snapshot changes exceed allowlist: ${changed.filter(file => !approved.includes(file)).join(', ')}`);
  const actualDiffPaths = diffPaths(diffByPath);
  if (JSON.stringify(actualDiffPaths) !== JSON.stringify(changed)) throw Error('Independent diff path inventory does not match actual snapshot changes');
  const baseline = await verifySourceBaseline(projectRoot, initialManifest);
  if (!baseline.matches) return { status: 'BLOCKED_SOURCE_CHANGED', taskId: initialManifest.taskId, baseline, plan: null, applyOccurred: false };

  const initialByPath = new Map(initialManifest.files.map(file => [file.path, file]));
  const finalByPath = new Map(finalManifest.files.map(file => [file.path, file]));
  const operations = [];
  for (const relative of changed) {
    const source = await resolveSafePath(projectRoot, relative);
    const original = source.exists ? await fs.readFile(source.target) : null;
    const snapshot = await resolveSafePath(snapshotRoot, relative);
    const replacement = snapshot.exists ? await fs.readFile(snapshot.target) : null;
    const beforeSha256 = original === null ? absentHash : hash(original);
    const replacementSha256 = replacement === null ? absentHash : hash(replacement);
    const beforeExists = source.exists;
    const replacementExists = snapshot.exists;
    if (!equalImage(beforeExists, beforeSha256, initialByPath.get(relative).exists !== false, initialByPath.get(relative).sha256)) throw Error(`Apply Gate original precondition mismatch: ${relative}`);
    if (!equalImage(replacementExists, replacementSha256, finalByPath.get(relative).workspaceExists !== false, finalByPath.get(relative).workspaceSha256)) throw Error(`Apply Gate replacement precondition mismatch: ${relative}`);
    if (diffByPath[relative] !== expectedFullDiff(relative, original, replacement)) throw Error(`Independent diff content does not match exact source and replacement bytes: ${relative}`);
    operations.push({
      path: relative,
      preconditionExists: beforeExists,
      preconditionSha256: beforeSha256,
      replacementExists,
      replacementSha256,
      diffSha256: hash(Buffer.from(diffByPath[relative], 'utf8')),
      backupRequired: beforeExists,
      recoveryRule: 'Restore only if the current image still matches this operation’s replacement image; preserve any unrelated image.'
    });
  }
  const plan = {
    version: 2,
    status: 'VERIFIED_READY_TO_APPLY',
    taskId: initialManifest.taskId,
    planId: String(runId || crypto.randomUUID()),
    approvedFiles: approved,
    operations,
    managerReview: { decision: managerDecision.decision, taskId: managerDecision.taskId },
    tests: tests.map(test => ({ command: test.command, result: test.result, exitCode: test.exitCode, artifact: test.artifact || null })),
    ownerApprovalRequired: true,
    applyOccurred: false,
    note: 'Plan only. Applying requires explicit Owner approval bound to planDigest, fresh baseline checks, and the trusted Apply Gate executor.'
  };
  plan.planDigest = approvalDigest(plan);
  return plan;
}

async function readImage(root, relative) {
  const resolved = await resolveSafePath(root, relative);
  return resolved.exists ? { exists: true, bytes: await fs.readFile(resolved.target), path: resolved.target } : { exists: false, bytes: null, path: resolved.target };
}

async function writeReplacement(target, bytes) {
  if (bytes === null) {
    await fs.unlink(target);
    return;
  }
  const stage = `${target}.${crypto.randomUUID()}.stage`;
  await fs.writeFile(stage, bytes, { flag: 'wx' });
  try { await fs.rename(stage, target); }
  catch (error) { await fs.rm(stage, { force: true }); throw error; }
}

async function writeBackupManifest(manifestPath, manifest) {
  await atomicJson(manifestPath, manifest);
}

async function rollbackUsingManifest({ projectRoot, manifestPath, manifest }) {
  const conflicts = [];
  for (const operation of [...manifest.operations].reverse()) {
    const current = await readImage(projectRoot, operation.path);
    const currentHash = current.exists ? hash(current.bytes) : null;
    const isPreimage = equalImage(current.exists, currentHash, operation.preconditionExists, operation.preconditionSha256);
    if (isPreimage) {
      operation.recoveryStatus = 'ALREADY_PREIMAGE';
      continue;
    }
    const isPostimage = equalImage(current.exists, currentHash, operation.replacementExists, operation.replacementSha256);
    if (!isPostimage) {
      operation.recoveryStatus = 'CONFLICT_PRESERVED';
      conflicts.push(operation.path);
      continue;
    }
    let backupBytes = null;
    if (operation.preconditionExists) {
      const backup = await resolveSafePath(manifest.backupRoot, operation.path);
      if (!backup.exists) throw Error(`Recovery backup is missing: ${operation.path}`);
      backupBytes = await fs.readFile(backup.target);
      if (hash(backupBytes) !== operation.preconditionSha256) throw Error(`Recovery backup checksum mismatch: ${operation.path}`);
    }
    const safeTarget = await resolveSafePath(projectRoot, operation.path);
    if (safeTarget.exists !== operation.replacementExists || (safeTarget.exists ? hash(await fs.readFile(safeTarget.target)) : null) !== operation.replacementSha256) {
      operation.recoveryStatus = 'CONFLICT_PRESERVED';
      conflicts.push(operation.path);
      continue;
    }
    if (operation.preconditionExists) await writeReplacement(safeTarget.target, backupBytes);
    else if (safeTarget.exists) await fs.unlink(safeTarget.target);
    const verified = await readImage(projectRoot, operation.path);
    const restoredHash = verified.exists ? hash(verified.bytes) : null;
    if (!equalImage(verified.exists, restoredHash, operation.preconditionExists, operation.preconditionSha256)) throw Error(`Rollback verification failed: ${operation.path}`);
    operation.recoveryStatus = 'RESTORED_AND_VERIFIED';
  }
  for (const operation of manifest.operations) {
    if (!operation.stagePath) continue;
    const stage = await resolveSafePath(projectRoot, operation.stagePath).catch(() => null);
    if (!stage?.exists) continue;
    const bytes = await fs.readFile(stage.target);
    if (hash(bytes) === operation.replacementSha256) await fs.unlink(stage.target);
    else {
      operation.recoveryStatus = 'STAGE_CONFLICT_PRESERVED';
      conflicts.push(operation.path);
    }
  }
  manifest.status = conflicts.length ? 'RECOVERY_CONFLICT' : 'ROLLED_BACK';
  manifest.conflicts = conflicts;
  manifest.recoveredAt = new Date().toISOString();
  await writeBackupManifest(manifestPath, manifest);
  return { status: manifest.status, conflicts, recoveryManifest: manifestPath };
}

/** Executes only an approved plan. AI output never supplies commands or destination roots. */
export async function executeApplyPlan({ projectRoot, snapshotRoot, plan, backupRoot, ownerApproval, onOperationApplied, testOnlyFaultAfter }) {
  if (plan?.status !== 'VERIFIED_READY_TO_APPLY' || plan.applyOccurred !== false || plan.ownerApprovalRequired !== true) throw Error('Apply Gate refuses an invalid or already applied plan');
  if (plan.planDigest !== approvalDigest(plan)) throw Error('Apply plan digest is invalid');
  if (ownerApproval?.approved !== true || ownerApproval.taskId !== plan.taskId || ownerApproval.planDigest !== plan.planDigest || ownerApproval.approvalSource !== 'explicit-owner') throw Error('Explicit Owner approval bound to the exact plan is required');
  if (!Array.isArray(plan.approvedFiles) || !plan.approvedFiles.length || !Array.isArray(plan.operations) || !plan.operations.length) throw Error('Apply plan inventory is empty');
  const approved = new Set(plan.approvedFiles.map(normalizeAllowedFile));
  if (approved.size !== plan.approvedFiles.length || plan.operations.some(operation => !approved.has(normalizeAllowedFile(operation.path)))) throw Error('Apply operations exceed strict allowlist');
  const projectCanonical = await resolveDirectoryNoLinks(projectRoot);
  const snapshotCanonical = await resolveDirectoryNoLinks(snapshotRoot);
  await fs.mkdir(backupRoot, { recursive: true });
  const backupCanonical = await resolveDirectoryNoLinks(backupRoot);
  if (inside(projectCanonical, backupCanonical) || inside(backupCanonical, projectCanonical) || inside(snapshotCanonical, backupCanonical) || inside(backupCanonical, snapshotCanonical)) throw Error('Backup root must be separate from project and task snapshot roots');
  const baseline = await verifySourceBaseline(projectCanonical, { files: plan.operations.map(operation => ({ path: operation.path, exists: operation.preconditionExists, sha256: operation.preconditionSha256 })) });
  if (!baseline.matches) return { status: 'BLOCKED_SOURCE_CHANGED', baseline, applyOccurred: false };

  const runDir = path.join(backupCanonical, `${String(plan.planId).replace(/[^A-Za-z0-9._-]/g, '_')}-${crypto.randomUUID()}`);
  await fs.mkdir(runDir, { recursive: false });
  const recoveryManifestPath = path.join(runDir, 'recovery-manifest.json');
  const operations = [];
  for (const operation of plan.operations) {
    const relative = normalizeAllowedFile(operation.path);
    const source = await readImage(projectCanonical, relative);
    const proposed = await readImage(snapshotCanonical, relative);
    const sourceHash = source.exists ? hash(source.bytes) : null;
    const proposedHash = proposed.exists ? hash(proposed.bytes) : null;
    if (!equalImage(source.exists, sourceHash, operation.preconditionExists, operation.preconditionSha256)) return { status: 'BLOCKED_SOURCE_CHANGED', path: relative, applyOccurred: false };
    if (!equalImage(proposed.exists, proposedHash, operation.replacementExists, operation.replacementSha256)) throw Error(`Snapshot replacement changed after review: ${relative}`);
    if (source.exists && operation.backupRequired) {
      const backupPath = path.resolve(runDir, ...relative.split('/'));
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, source.bytes, { flag: 'wx' });
      if (hash(await fs.readFile(backupPath)) !== operation.preconditionSha256) throw Error(`Backup checksum validation failed: ${relative}`);
    }
    const stagePath = operation.replacementExists
      ? `${relative.split('/').slice(0, -1).concat(`${relative.split('/').at(-1)}.${crypto.randomUUID()}.apply-stage`).join('/')}`
      : null;
    operations.push({ ...operation, backupPath: operation.preconditionExists ? path.relative(runDir, path.resolve(runDir, ...relative.split('/'))).split(path.sep).join('/') : null, stagePath, status: 'PREPARED' });
  }
  const recoveryManifest = { version: 1, taskId: plan.taskId, planId: plan.planId, planDigest: plan.planDigest, approvalSource: ownerApproval.approvalSource, projectRoot: projectCanonical, backupRoot: runDir, approvedFiles: plan.approvedFiles, status: 'PREPARED', createdAt: new Date().toISOString(), operations };
  await writeBackupManifest(recoveryManifestPath, recoveryManifest);

  const lockPath = path.join(backupCanonical, '.apply-gate.lock');
  let lock;
  try { lock = await fs.open(lockPath, 'wx'); }
  catch (error) { throw Error(error.code === 'EEXIST' ? 'Another Apply Gate transaction is active' : `Could not acquire Apply Gate lock: ${error.message}`); }
  const staged = new Map();
  try {
    recoveryManifest.status = 'APPLYING';
    await writeBackupManifest(recoveryManifestPath, recoveryManifest);
    for (const operation of operations) {
      if (!operation.replacementExists) continue;
      const snap = await readImage(snapshotCanonical, operation.path);
      const source = await resolveSafePath(projectCanonical, operation.path);
      if (source.exists && !(await fs.lstat(source.target).then(stat => stat.isFile()))) throw Error(`Unsafe Apply Gate target: ${operation.path}`);
      const stagePath = path.resolve(projectCanonical, ...operation.stagePath.split('/'));
      if (!inside(projectCanonical, stagePath)) throw Error(`Apply stage escaped project root: ${operation.path}`);
      await fs.writeFile(stagePath, snap.bytes, { flag: 'wx' });
      if (hash(await fs.readFile(stagePath)) !== operation.replacementSha256) throw Error(`Staged replacement checksum mismatch: ${operation.path}`);
      staged.set(operation.path, stagePath);
      await writeBackupManifest(recoveryManifestPath, recoveryManifest);
    }
    let appliedCount = 0;
    for (let index = 0; index < operations.length; index++) {
      const operation = operations[index];
      const current = await readImage(projectCanonical, operation.path);
      const currentHash = current.exists ? hash(current.bytes) : null;
      if (!equalImage(current.exists, currentHash, operation.preconditionExists, operation.preconditionSha256)) throw Error(`Source changed during Apply Gate transaction: ${operation.path}`);
      const safeTarget = await resolveSafePath(projectCanonical, operation.path);
      const immediate = await readImage(projectCanonical, operation.path);
      if (!equalImage(immediate.exists, immediate.exists ? hash(immediate.bytes) : null, operation.preconditionExists, operation.preconditionSha256)) throw Error(`Source changed immediately before replacement: ${operation.path}`);
      if (operation.replacementExists) await fs.rename(staged.get(operation.path), safeTarget.target);
      else await fs.unlink(safeTarget.target);
      const after = await readImage(projectCanonical, operation.path);
      const afterHash = after.exists ? hash(after.bytes) : null;
      if (!equalImage(after.exists, afterHash, operation.replacementExists, operation.replacementSha256)) throw Error(`Apply checksum verification failed: ${operation.path}`);
      operation.status = 'APPLIED_AND_VERIFIED';
      recoveryManifest.appliedCount = ++appliedCount;
      await writeBackupManifest(recoveryManifestPath, recoveryManifest);
      if (onOperationApplied) await onOperationApplied({ index, operation: structuredClone(operation), recoveryManifestPath });
      if (Number.isInteger(testOnlyFaultAfter) && appliedCount === testOnlyFaultAfter) {
        const interruption = Error('Synthetic Apply Gate interruption requested by test harness');
        interruption.code = 'SYNTHETIC_INTERRUPTION';
        throw interruption;
      }
    }
    recoveryManifest.status = 'APPLIED_AND_VERIFIED';
    recoveryManifest.completedAt = new Date().toISOString();
    await writeBackupManifest(recoveryManifestPath, recoveryManifest);
    return { status: 'APPLIED_AND_VERIFIED', taskId: plan.taskId, applyOccurred: true, operations: operations.map(({ path: file, preconditionExists, preconditionSha256, replacementExists, replacementSha256 }) => ({ path: file, preconditionExists, preconditionSha256, replacementExists, replacementSha256 })), recoveryManifest: recoveryManifestPath, backupRoot: runDir };
  } catch (error) {
    for (const stage of staged.values()) await fs.rm(stage, { force: true }).catch(() => {});
    if (error.code === 'SYNTHETIC_INTERRUPTION') {
      recoveryManifest.status = 'INTERRUPTED';
      recoveryManifest.interruption = 'Synthetic test-only process interruption';
      await writeBackupManifest(recoveryManifestPath, recoveryManifest);
      return { status: 'INTERRUPTED_RECOVERY_REQUIRED', taskId: plan.taskId, applyOccurred: true, recoveryManifest: recoveryManifestPath };
    }
    const rollback = await rollbackUsingManifest({ projectRoot: projectCanonical, manifestPath: recoveryManifestPath, manifest: recoveryManifest });
    if (rollback.status === 'RECOVERY_CONFLICT') throw Error(`Apply failed (${error.message}) and rollback found independent changes: ${rollback.conflicts.join(', ')}; recovery manifest: ${recoveryManifestPath}`);
    throw Error(`Apply failed and rollback was verified (${error.message}); recovery manifest: ${recoveryManifestPath}`);
  } finally {
    await lock?.close().catch(() => {});
    await fs.rm(lockPath, { force: true }).catch(() => {});
  }
}

/** Reconciles an interrupted transaction. It restores only exact postimages and preserves conflicts. */
export async function recoverInterruptedApply({ projectRoot, recoveryManifestPath }) {
  const projectCanonical = await resolveDirectoryNoLinks(projectRoot);
  const manifest = JSON.parse(await fs.readFile(recoveryManifestPath, 'utf8'));
  if (!['PREPARED', 'APPLYING', 'INTERRUPTED', 'RECOVERY_CONFLICT'].includes(manifest.status)) throw Error(`Recovery is not valid for manifest status ${manifest.status}`);
  if (manifest.projectRoot !== projectCanonical) throw Error('Recovery project root differs from the captured canonical root');
  const expectedRoot = await resolveDirectoryNoLinks(manifest.backupRoot);
  const manifestCanonical = await fs.realpath(recoveryManifestPath);
  if (path.dirname(manifestCanonical) !== expectedRoot) throw Error('Recovery manifest is not directly inside its recorded backup root');
  if (inside(projectCanonical, expectedRoot) || inside(expectedRoot, projectCanonical)) throw Error('Recovery backup root overlaps the project root');
  if (!Array.isArray(manifest.approvedFiles) || !Array.isArray(manifest.operations) || !manifest.operations.length) throw Error('Recovery manifest has no valid approved operation inventory');
  const approved = new Set(manifest.approvedFiles.map(normalizeAllowedFile));
  const operationPaths = manifest.operations.map(operation => normalizeAllowedFile(operation.path));
  if (new Set(operationPaths).size !== operationPaths.length || operationPaths.some(file => !approved.has(file))) throw Error('Recovery operations exceed strict approved file inventory');
  for (const operation of manifest.operations) {
    const validHash = value => typeof value === 'string' && /^[A-F0-9]{64}$/.test(value);
    if (typeof operation.preconditionExists !== 'boolean' || typeof operation.replacementExists !== 'boolean' || (operation.preconditionExists ? !validHash(operation.preconditionSha256) : operation.preconditionSha256 !== null) || (operation.replacementExists ? !validHash(operation.replacementSha256) : operation.replacementSha256 !== null)) throw Error(`Recovery image metadata is invalid: ${operation.path}`);
  }
  return rollbackUsingManifest({ projectRoot: projectCanonical, manifestPath: manifestCanonical, manifest });
}
