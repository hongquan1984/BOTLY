import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createTaskSnapshot, applyPatchToSnapshot } from '../src/workspace-snapshot.mjs';
import { prepareApplyPlan, executeApplyPlan, recoverInterruptedApply } from '../src/apply-gate.mjs';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const diff = (name, before, after) => `--- a/${name}\n+++ b/${name}\n@@ full-file replacement @@\n${(before || Buffer.alloc(0)).toString('utf8').split(/(?<=\n)/).map(line => `-${line}`).join('')}${(after || Buffer.alloc(0)).toString('utf8').split(/(?<=\n)/).map(line => `+${line}`).join('')}`;

async function fixture(t, files = { 'src/keep.txt': 'before\n', 'src/remove.txt': 'remove me\n' }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hc-apply-fixture-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, 'project');
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(project, ...relative.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  return { root, project, snapshotRoot: path.join(root, 'snapshot'), backupRoot: path.join(root, 'backups'), files };
}

async function planFor(t, f, { changed = { 'src/keep.txt': 'after\n', 'src/add.txt': 'added\n', 'src/remove.txt': null }, managerDecision = 'PASS', applyAllowlist } = {}) {
  const allowlist = [...new Set([...Object.keys(f.files), ...Object.keys(changed)])].sort();
  const expectedHashes = Object.fromEntries(allowlist.map(file => [file, Object.hasOwn(f.files, file) ? sha(Buffer.from(f.files[file])) : null]));
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: f.snapshotRoot, taskId: 'HC-APPLY-001', allowedFiles: allowlist, expectedHashes });
  const patches = Object.entries(changed).map(([file, content]) => ({ path: file, baseSha256: expectedHashes[file], ...(content === null ? { delete: true } : { content }) }));
  await applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: snapshot.manifest, patches, allowlist });
  const finalManifest = JSON.parse(await fs.readFile(path.join(snapshot.root, '.manager', 'snapshot-manifest.json'), 'utf8'));
  const diffByPath = Object.fromEntries(Object.entries(changed).map(([file, content]) => [file, diff(file, Object.hasOwn(f.files, file) ? Buffer.from(f.files[file]) : null, content === null ? null : Buffer.from(content))]));
  const prepared = await prepareApplyPlan({ projectRoot: f.project, snapshotRoot: snapshot.root, initialManifest: snapshot.manifest, finalManifest, allowlist: applyAllowlist || allowlist, managerDecision: { decision: managerDecision, taskId: 'HC-APPLY-001' }, tests: [{ command: 'synthetic fixture assertion', result: 'PASS', exitCode: 0 }], diffByPath, runId: 'HC-APPLY-001' });
  return { ...f, snapshot, finalManifest, prepared, allowlist };
}

const approvalFor = plan => ({ approved: true, taskId: plan.taskId, planDigest: plan.planDigest, approvalSource: 'explicit-owner' });

test('fixture Apply Gate requires exact Owner approval; applies modified, added and deleted files with verified backups', async t => {
  const p = await planFor(t, await fixture(t));
  assert.equal(p.prepared.status, 'VERIFIED_READY_TO_APPLY');
  await assert.rejects(executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot }), /Explicit Owner approval/);
  const result = await executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared) });
  assert.equal(result.status, 'APPLIED_AND_VERIFIED');
  assert.equal(await fs.readFile(path.join(p.project, 'src/keep.txt'), 'utf8'), 'after\n');
  assert.equal(await fs.readFile(path.join(p.project, 'src/add.txt'), 'utf8'), 'added\n');
  await assert.rejects(fs.access(path.join(p.project, 'src/remove.txt')));
  assert.equal(await fs.readFile(path.join(result.backupRoot, 'src/keep.txt'), 'utf8'), 'before\n');
  assert.equal(await fs.readFile(path.join(result.backupRoot, 'src/remove.txt'), 'utf8'), 'remove me\n');
  assert.equal(JSON.parse(await fs.readFile(result.recoveryManifest, 'utf8')).status, 'APPLIED_AND_VERIFIED');
  const duplicate = await executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared) });
  assert.equal(duplicate.status, 'BLOCKED_SOURCE_CHANGED');
  assert.equal(duplicate.applyOccurred, false);
});

test('fixture Apply Gate interruption is recoverable and rollback verifies exact preimages', async t => {
  const p = await planFor(t, await fixture(t));
  const result = await executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared), testOnlyFaultAfter: 1 });
  assert.equal(result.status, 'INTERRUPTED_RECOVERY_REQUIRED');
  const recovery = await recoverInterruptedApply({ projectRoot: p.project, recoveryManifestPath: result.recoveryManifest });
  assert.equal(recovery.status, 'ROLLED_BACK');
  assert.equal(await fs.readFile(path.join(p.project, 'src/keep.txt'), 'utf8'), 'before\n');
  assert.equal(await fs.readFile(path.join(p.project, 'src/remove.txt'), 'utf8'), 'remove me\n');
  await assert.rejects(fs.access(path.join(p.project, 'src/add.txt')));
  assert.equal(JSON.parse(await fs.readFile(result.recoveryManifest, 'utf8')).status, 'ROLLED_BACK');
});

test('concurrent original change fails closed and preserves unrelated edit during rollback', async t => {
  const p = await planFor(t, await fixture(t));
  await assert.rejects(executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared), onOperationApplied: async ({ index }) => {
    if (index === 0) await fs.writeFile(path.join(p.project, 'src/remove.txt'), 'independent concurrent edit\n');
  } }), /independent changes/);
  assert.equal(await fs.readFile(path.join(p.project, 'src/keep.txt'), 'utf8'), 'before\n');
  assert.equal(await fs.readFile(path.join(p.project, 'src/remove.txt'), 'utf8'), 'independent concurrent edit\n');
});

test('Manager rejection creates no applicable plan', async t => {
  await assert.rejects(planFor(t, await fixture(t), { managerDecision: 'REWORK' }), /independent Manager PASS/);
});

test('unauthorized modified and added files are rejected by the prepared allowlist', async t => {
  const source = await fixture(t);
  await assert.rejects(planFor(t, source, { applyAllowlist: ['src/keep.txt'] }), /exceed allowlist/);
  assert.equal(await fs.readFile(path.join(source.project, 'src/keep.txt'), 'utf8'), 'before\n');
  assert.equal(await fs.readFile(path.join(source.project, 'src/remove.txt'), 'utf8'), 'remove me\n');
});

test('allowlist, digest, symlink and missing baseline preconditions fail closed', async t => {
  const p = await planFor(t, await fixture(t));
  const tampered = structuredClone(p.prepared);
  tampered.approvedFiles.push('outside.txt');
  await assert.rejects(executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: tampered, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared) }), /digest|plan|approval/i);
  const symlinkProject = path.join(p.root, 'linked-project');
  try { await fs.symlink(p.project, symlinkProject, 'dir'); }
  catch (error) { if (error.code === 'EPERM' || error.code === 'EACCES') { t.skip('Windows account cannot create symlink fixture without ACL/privilege change'); return; } throw error; }
  await assert.rejects(executeApplyPlan({ projectRoot: symlinkProject, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared) }), /Symlink|junction/);
  await fs.rm(path.join(p.project, 'src/keep.txt'));
  const blocked = await executeApplyPlan({ projectRoot: p.project, snapshotRoot: p.snapshot.root, plan: p.prepared, backupRoot: p.backupRoot, ownerApproval: approvalFor(p.prepared) });
  assert.equal(blocked.status, 'BLOCKED_SOURCE_CHANGED');
  assert.equal(blocked.applyOccurred, false);
});
