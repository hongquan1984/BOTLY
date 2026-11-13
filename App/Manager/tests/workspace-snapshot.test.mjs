import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  createTaskSnapshot, applyPatchToSnapshot, verifySourceBaseline, inspectSnapshot,
  resolveSafeFile, normalizeAllowedFile
} from '../src/workspace-snapshot.mjs';
import { prepareApplyPlan } from '../src/apply-gate.mjs';
import { runSnapshotWorkflow } from '../src/snapshot-workflow.mjs';
import { buildArgs } from '../src/developer-adapter.mjs';

const hash = value => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();

test('structured-only Codex adapter ignores user tool configuration and disables host tool features', () => {
  const args = buildArgs({ codexEntrypoint: 'codex.js', developer: { model: 'gpt-6.1-sol', sandbox: 'read-only', reasoningEffort: 'medium' } }, 'developer', 'schema.json', 'out.json', 'synthetic-workspace', [], { ephemeral: true, structuredOnly: true });
  assert.ok(args.includes('--ignore-user-config'));
  for (const feature of ['shell_tool', 'computer_use', 'browser_use', 'apps', 'plugins', 'code_mode_host', 'view_image']) assert.ok(args.some((arg, index) => arg === '--disable' && args[index + 1] === feature));
  assert.ok(args.includes('--sandbox') && args[args.indexOf('--sandbox') + 1] === 'read-only');
  assert.ok(!args.some(arg => arg.includes('dangerously')));
});
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hc-mgr-fixture-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, 'project');
  await fs.mkdir(path.join(project, 'src'), { recursive: true });
  await fs.mkdir(path.join(project, 'tests'), { recursive: true });
  const content = 'export const value = 1;\n';
  const testContent = "if ((await import('../src/value.mjs')).value !== 2) process.exit(1);\n";
  await fs.writeFile(path.join(project, 'src/value.mjs'), content);
  await fs.writeFile(path.join(project, 'tests/check.mjs'), testContent);
  return { root, project, content, testContent };
}

test('snapshot includes untracked allowlisted files and hashes exact bytes', async t => {
  const f = await fixture(t);
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'snap'), taskId: 'HC-SNAP-001', allowedFiles: ['src/value.mjs', 'tests/check.mjs'], expectedHashes: { 'src/value.mjs': hash(f.content), 'tests/check.mjs': hash(f.testContent) } });
  assert.deepEqual(snapshot.manifest.files.map(x => x.sourceStatus), ['untracked', 'untracked']);
  assert.equal((await fs.readFile(path.join(snapshot.root, 'src/value.mjs'), 'utf8')), f.content);
  assert.equal((await inspectSnapshot(snapshot.root, snapshot.manifest)).files.length, 2);
});

test('manifest identifies tracked files and rejects secret/environment paths', async t => {
  const f = await fixture(t);
  execFileSync('git', ['init', '-q'], { cwd: f.project });
  execFileSync('git', ['config', 'user.name', 'Synthetic Fixture'], { cwd: f.project });
  execFileSync('git', ['config', 'user.email', 'fixture@example.invalid'], { cwd: f.project });
  execFileSync('git', ['add', 'src/value.mjs'], { cwd: f.project });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: f.project });
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'tracked-snap'), taskId: 'HC-SNAP-008', allowedFiles: ['src/value.mjs'], expectedHashes: { 'src/value.mjs': hash(f.content) } });
  assert.equal(snapshot.manifest.files[0].sourceStatus, 'tracked');
  for (const forbidden of ['.env.local', 'secrets/key.json', '.aws/credentials', 'auth.json', 'keys/private.pem']) assert.throws(() => normalizeAllowedFile(forbidden), /rejected/i);
});

test('changed expected hash fails closed without accepting new baseline', async t => {
  const f = await fixture(t);
  await assert.rejects(createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'snap'), taskId: 'HC-SNAP-002', allowedFiles: ['src/value.mjs'], expectedHashes: { 'src/value.mjs': '0'.repeat(64) } }), /differs from approved baseline/);
  assert.equal(await fs.readFile(path.join(f.project, 'src/value.mjs'), 'utf8'), f.content);
});

test('symlink or reparse path is rejected before it can escape source root', async t => {
  const f = await fixture(t);
  const link = path.join(f.project, 'src/value.mjs');
  await assert.rejects(resolveSafeFile(f.project, 'src/value.mjs', {
    lstat: async target => target === link ? { isSymbolicLink: () => true, isFile: () => false } : fs.lstat(target),
    realpath: target => fs.realpath(target)
  }), /Symlink\/junction rejected/);
});

test('patch outside allowlist and traversal are rejected', async t => {
  const f = await fixture(t);
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'snap'), taskId: 'HC-SNAP-003', allowedFiles: ['src/value.mjs'], expectedHashes: { 'src/value.mjs': hash(f.content) } });
  await assert.rejects(applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: snapshot.manifest, patches: [{ path: '../outside', baseSha256: hash(f.content), content: 'x' }] }), /rejected/);
  await assert.rejects(applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: snapshot.manifest, patches: [{ path: 'tests/check.mjs', baseSha256: hash(f.content), content: 'x' }] }), /unauthorized/);
});

test('patch changes only snapshot, detects unexpected inventory, and source checksum remains unchanged', async t => {
  const f = await fixture(t);
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'snap'), taskId: 'HC-SNAP-004', allowedFiles: ['src/value.mjs'], expectedHashes: { 'src/value.mjs': hash(f.content) } });
  await applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: snapshot.manifest, patches: [{ path: 'src/value.mjs', baseSha256: hash(f.content), content: 'export const value = 2;\n' }] });
  assert.equal(await fs.readFile(path.join(f.project, 'src/value.mjs'), 'utf8'), f.content);
  assert.equal((await verifySourceBaseline(f.project, snapshot.manifest)).matches, true);
  await fs.writeFile(path.join(snapshot.root, 'unauthorized.txt'), 'unexpected');
  await assert.rejects(inspectSnapshot(snapshot.root, JSON.parse(await fs.readFile(path.join(snapshot.root, '.manager/snapshot-manifest.json'), 'utf8'))), /inventory mismatch/);
});

test('source change after snapshot is reported and Apply Gate returns blocked without writing', async t => {
  const f = await fixture(t);
  const snapshot = await createTaskSnapshot({ projectRoot: f.project, snapshotRoot: path.join(f.root, 'snap'), taskId: 'HC-SNAP-005', allowedFiles: ['src/value.mjs'], expectedHashes: { 'src/value.mjs': hash(f.content) } });
  const initialManifest = structuredClone(snapshot.manifest);
  await applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: snapshot.manifest, patches: [{ path: 'src/value.mjs', baseSha256: hash(f.content), content: 'export const value = 2;\n' }] });
  const finalManifest = JSON.parse(await fs.readFile(path.join(snapshot.root, '.manager/snapshot-manifest.json'), 'utf8'));
  const diff = { 'src/value.mjs': '--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ replacement @@\n' };
  await fs.writeFile(path.join(f.project, 'src/value.mjs'), 'concurrent independent edit\n');
  const plan = await prepareApplyPlan({ projectRoot: f.project, snapshotRoot: snapshot.root, initialManifest, finalManifest, allowlist: ['src/value.mjs'], managerDecision: { decision: 'PASS', taskId: 'HC-SNAP-005' }, tests: [{ result: 'PASS', exitCode: 0, command: 'fixture' }], diffByPath: diff, runId: 'synthetic' });
  assert.equal(plan.status, 'BLOCKED_SOURCE_CHANGED');
  assert.equal(await fs.readFile(path.join(f.project, 'src/value.mjs'), 'utf8'), 'concurrent independent edit\n');
});

test('synthetic Manager → Developer patch → Docker evidence → Manager review prepares but never applies', async t => {
  const f = await fixture(t);
  const original = hash(f.content);
  const result = await runSnapshotWorkflow({
    projectRoot: f.project, runRoot: path.join(f.root, 'runs'), config: { developer: { model: 'fixture', reasoningEffort: 'medium' }, manager: { model: 'fixture', reasoningEffort: 'high' } },
    task: { taskId: 'HC-SNAP-006', objective: 'fixture only', allowedFiles: ['src/value.mjs'], editableFiles: ['src/value.mjs'], requiredTests: ['tests/check.mjs'], acceptanceCriteria: ['value equals 2'], mockPatches: [[{ path: 'src/value.mjs', baseSha256: original, content: 'export const value = 2;\n' }]], mockTestResults: [{ command: 'synthetic fixture', result: 'PASS', exitCode: 0 }], mockManagerDecisions: [{ decision: 'PASS', taskId: 'HC-SNAP-006', feedback: [] }] },
    expectedHashes: { 'src/value.mjs': original }, dockerTests: async () => [{ command: 'mock docker', result: 'PASS', exitCode: 0 }]
  });
  assert.equal(result.status, 'VERIFIED_READY_TO_APPLY');
  assert.equal(result.applyPlan.applyOccurred, false);
  assert.equal(result.applyPlan.ownerApprovalRequired, true);
  assert.equal(await fs.readFile(path.join(f.project, 'src/value.mjs'), 'utf8'), f.content);
});

test('Manager REWORK is preserved and no apply plan is produced', async t => {
  const f = await fixture(t);
  const result = await runSnapshotWorkflow({
    projectRoot: f.project, runRoot: path.join(f.root, 'runs'), config: {},
    task: { taskId: 'HC-SNAP-007', objective: 'fixture only', allowedFiles: ['src/value.mjs'], editableFiles: ['src/value.mjs'], requiredTests: ['tests/check.mjs'], mockPatches: [[{ path: 'src/value.mjs', baseSha256: hash(f.content), content: 'export const value = 2;\n' }]], mockTestResults: [{ command: 'fixture', result: 'PASS', exitCode: 0 }], mockManagerDecisions: [{ decision: 'REWORK', taskId: 'HC-SNAP-007', feedback: ['Synthetic rejection fixture'] }]
    }, expectedHashes: { 'src/value.mjs': hash(f.content) }, maxAttempts: 1
  });
  assert.equal(result.status, 'REWORK_LIMIT');
  assert.equal(result.attempts[0].managerDecision.decision, 'REWORK');
  assert.equal(result.applyOccurred, false);
});

test('interrupted Developer call leaves durable attempt phase and snapshot for manual reconciliation', async t => {
  const f = await fixture(t);
  const runRoot = path.join(f.root, 'runs');
  await assert.rejects(runSnapshotWorkflow({
    projectRoot: f.project, runRoot, config: { developer: { model: 'fixture', reasoningEffort: 'medium' } },
    task: { taskId: 'HC-SNAP-009', objective: 'interruption fixture', allowedFiles: ['src/value.mjs'], editableFiles: ['src/value.mjs'], requiredTests: ['tests/check.mjs'] },
    expectedHashes: { 'src/value.mjs': hash(f.content) }, codex: async () => { throw Error('synthetic process interruption'); }
  }), /synthetic process interruption/);
  const state = JSON.parse(await fs.readFile(path.join(runRoot, 'HC-SNAP-009', 'workflow-state.json'), 'utf8'));
  assert.equal(state.status, 'IN_PROGRESS');
  assert.equal(state.phase, 'DEVELOPER_RUNNING');
  assert.equal(state.currentAttempt, 1);
  await fs.access(path.join(state.snapshotRoot, '.manager', 'snapshot-manifest.json'));
});
