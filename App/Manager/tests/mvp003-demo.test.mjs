import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMvp003Demo } from '../src/mvp003-demo.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('MVP-003 fixture runner persists task history and automatically assigns the dependent task', async () => {
  const roles = [];
  const codex = async request => {
    roles.push(request.role);
    if (request.role === 'manager' && (request.prompt.startsWith('Choose exactly one') || request.prompt.startsWith('HC-901 has been accepted'))) {
      const queue = JSON.parse(request.prompt.slice(request.prompt.indexOf('QUEUE: ') + 7).split('\n')[0]);
      const chosen = queue[0];
      return { data: { decision: 'SELECT_TASK', taskId: chosen.taskId, reasoning: 'Synthetic fixture selection', feedback: [], dimensions: { functional: 'NOT_APPLICABLE', visual: 'NOT_APPLICABLE', data: 'NOT_APPLICABLE', localization: 'NOT_APPLICABLE', security: 'NOT_APPLICABLE', aiIntegration: 'NOT_APPLICABLE' }, nextTask: { ...chosen, status: 'READY' }, approvalRequest: null }, eventTypes: [] };
    }
    if (request.role === 'developer') {
      const item = JSON.parse(request.prompt.slice(request.prompt.lastIndexOf('Workspace file contents: ') + 'Workspace file contents: '.length));
      const pathName = item[0].path;
      const taskId = pathName.includes('901') ? 'HC-901' : 'HC-902';
      const content = taskId === 'HC-901'
        ? "export function toSlug(value) { return value.normalize('NFKC').toLowerCase().replace(/&/g, ' and ').replace(/[^\\p{L}\\p{N}]+/gu, '-').replace(/^-|-$/g, ''); }\n"
        : "export function formatDuration(minutes) { if (!Number.isInteger(minutes) || minutes < 0) throw new TypeError('minutes must be a non-negative integer'); return `${minutes} minute${minutes === 1 ? '' : 's'}`; }\n";
      return { data: { taskId, attempt: 1, summary: 'Synthetic test fixture patch', patches: [{ path: pathName, baseSha256: item[0].sha256, content }], limitations: [] }, eventTypes: [] };
    }
    const taskId = request.prompt.includes('HC-901') && !request.prompt.includes('HC-902') ? 'HC-901' : 'HC-902';
    return { data: { decision: 'PASS', taskId, reasoning: 'Synthetic review fixture', feedback: [], dimensions: { functional: 'PASS', visual: 'NOT_APPLICABLE', data: 'NOT_APPLICABLE', localization: 'NOT_APPLICABLE', security: 'PASS', aiIntegration: 'NOT_APPLICABLE' }, nextTask: null, approvalRequest: null }, eventTypes: [] };
  };
  const dockerTests = async ({ tests }) => tests.map(testPath => ({ command: `fixture docker ${testPath}`, result: 'PASS', exitCode: 0, output: 'MOCK ONLY' }));
  const result = await runMvp003Demo({ config: { developer: { model: 'fixture', reasoningEffort: 'medium' }, manager: { model: 'fixture', reasoningEffort: 'high' } }, codex, dockerTests, maxRealAiCalls: 12, timeoutMs: 1000 });
  try {
    assert.equal(result.status, 'DEMO_PASS');
    assert.deepEqual(result.queue.map(task => task.status), ['PASS', 'PASS']);
    assert.ok(result.history.some(item => item.event === 'AUTOMATIC_NEXT_TASK_ASSIGNED' && item.taskId === 'HC-902'));
    assert.equal(roles.filter(role => role === 'manager').length, 4);
    const saved = JSON.parse(await fs.readFile(result.statePath, 'utf8'));
    assert.equal(saved.status, 'DEMO_PASS');
    assert.ok(saved.history.some(item => item.event === 'AUTOMATIC_NEXT_TASK_ASSIGNED'));
  } finally {
    const reportsRoot = path.resolve(ROOT, 'reports', 'MVP_003');
    const target = path.resolve(result.reportRoot);
    assert.ok(target.startsWith(`${reportsRoot}${path.sep}`));
    await fs.rm(target, { recursive: true, force: true });
  }
});
