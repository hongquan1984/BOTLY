import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { acquireLock, atomicJson } from './state-store.mjs';
import { runCodex } from './developer-adapter.mjs';
import { validDecision } from './report-reader.mjs';
import { runSnapshotWorkflow, runSnapshotTests } from './snapshot-workflow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = value => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();

function makeTask({ taskId, title, objective, source, test, dependencies = [], acceptanceCriteria }) {
  const sourcePath = `src/${taskId.toLowerCase()}.mjs`;
  const testPath = `test/${taskId.toLowerCase()}.test.mjs`;
  return {
    taskId, title, objective, sourcePath, testPath, source, test,
    task: {
      taskId, title, objective, priority: 'P1',
      sourceRequirements: [`Synthetic acceptance fixture for ${taskId}`], dependencies,
      allowedScope: [sourcePath], deliverables: ['Structured source patch', 'Passing Docker test evidence'],
      acceptanceCriteria, requiredTests: [testPath], visualEvidence: [], retryCount: 0,
      status: 'PENDING', previousReviewFeedback: [], ownerApprovalRequired: false, projectFinalAudit: false
    }
  };
}

const taskSpecs = [
  makeTask({
    taskId: 'HC-901', title: 'Synthetic Unicode slug behavior',
    objective: 'Implement toSlug(value): return a lowercase, hyphen-separated slug; normalize compatibility characters, preserve Unicode letters and digits, map ampersand to the word and, collapse separators, and return an empty string for blank input.',
    source: 'export function toSlug(value) { return value; }\n',
    test: `import test from 'node:test';
import assert from 'node:assert/strict';
import { toSlug } from '../src/hc-901.mjs';
test('normalizes basic text', () => assert.equal(toSlug('Hello World'), 'hello-world'));
test('maps ampersand and collapses separators', () => assert.equal(toSlug('A & B---C'), 'a-and-b-c'));
test('preserves Unicode letters', () => assert.equal(toSlug('Crème brûlée'), 'crème-brûlée'));
test('normalizes compatibility characters', () => assert.equal(toSlug('Ｆｏｏ Bar'), 'foo-bar'));
test('blank input becomes empty', () => assert.equal(toSlug('  \t '), ''));
`,
    acceptanceCriteria: [
      'toSlug("Hello World") returns "hello-world".',
      'Convert ampersand to the word and; collapse repeated separators to one hyphen.',
      'Preserve Unicode letters and digits after NFKC normalization.',
      'Blank input returns an empty string.',
      'The focused test passes without network access.'
    ]
  }),
  makeTask({
    taskId: 'HC-902', title: 'Synthetic duration label behavior',
    objective: 'Implement formatDuration(minutes) as a deterministic formatter for non-negative integer minutes. Use singular "minute" only for 1 and plural "minutes" for all other accepted values; reject invalid values with a TypeError.',
    source: 'export function formatDuration(minutes) { return String(minutes); }\n',
    test: `import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from '../src/hc-902.mjs';
test('formats singular and plural minutes', () => {
  assert.equal(formatDuration(1), '1 minute');
  assert.equal(formatDuration(0), '0 minutes');
  assert.equal(formatDuration(15), '15 minutes');
});
test('rejects negative, fractional and nonnumeric input', () => {
  for (const value of [-1, 1.5, '15', NaN]) assert.throws(() => formatDuration(value), TypeError);
});
`,
    dependencies: ['HC-901'],
    acceptanceCriteria: [
      'Use singular minute only for exactly 1; use minutes for zero and all other accepted integer values.',
      'Reject negative, fractional, string, and non-finite input with TypeError.',
      'The focused test passes without network access.'
    ]
  })
];

export async function runMvp003Demo({ config, logger = console.log, codex = runCodex, dockerTests = runSnapshotTests, maxRealAiCalls = 12, timeoutMs = 180000 } = {}) {
  const release = await acquireLock(ROOT);
  const runId = new Date().toISOString().replaceAll(':', '-');
  const reportRoot = path.join(ROOT, 'reports', 'MVP_003', runId);
  const runRoot = path.join(reportRoot, 'runs');
  const statePath = path.join(reportRoot, 'demo-state.json');
  const state = {
    runId, mode: 'REAL_CODEX_SYNTHETIC_SNAPSHOT_ONLY', status: 'INITIALIZING',
    realAiCalls: 0, maxRealAiCalls, currentTaskId: null, nextTaskId: null,
    queue: taskSpecs.map(spec => ({ ...spec.task })), history: [], callHistory: [],
    startedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  const save = async () => { state.updatedAt = new Date().toISOString(); await atomicJson(statePath, state); };
  const invokeAI = async options => {
    if (state.realAiCalls >= maxRealAiCalls) throw Error(`Real AI call limit reached (${maxRealAiCalls})`);
    state.realAiCalls++;
    const call = { number: state.realAiCalls, role: options.role, status: 'RUNNING', startedAt: new Date().toISOString() };
    state.callHistory.push(call);
    await save();
    try {
      const result = await codex({
        config: { ...config, manager: { ...config.manager, sandbox: 'read-only' }, developer: { ...config.developer, sandbox: 'read-only' } },
        ...options, root: options.root || runRoot,
        runDir: path.join(reportRoot, 'ai', `${String(call.number).padStart(2, '0')}-${options.role}`),
        timeoutMs, ephemeral: true, structuredOnly: true, logger
      });
      call.status = 'COMPLETED';
      call.eventTypes = result.eventTypes || [];
      call.blockedToolEvents = result.blockedToolEvents || [];
      call.completedAt = new Date().toISOString();
      await save();
      return result.data;
    } catch (error) {
      call.status = 'FAILED';
      call.error = error.message;
      call.completedAt = new Date().toISOString();
      await save();
      throw error;
    }
  };

  try {
    await fs.mkdir(path.dirname(reportRoot), { recursive: true });
    await fs.mkdir(reportRoot, { recursive: false });
    await fs.mkdir(runRoot, { recursive: true });
    await save();
    const managerSchema = path.join(ROOT, 'schemas', 'manager-decision.schema.json');
    state.status = 'RUNNING';
    const available = state.queue.filter(task => task.status === 'PENDING' && task.dependencies.every(id => state.queue.find(candidate => candidate.taskId === id)?.status === 'PASS'));
    const selection = await invokeAI({ role: 'manager', schemaFile: managerSchema, prompt: `Choose exactly one dependency-ready task from the supplied synthetic-only queue. Do not invent, rewrite, or skip tasks. Return a complete Manager decision JSON with decision SELECT_TASK, taskId equal to nextTask.taskId, nextTask copied exactly with status READY, all dimensions NOT_APPLICABLE, approvalRequest null.\nQUEUE: ${JSON.stringify(available)}` });
    if (!validDecision(selection) || selection.decision !== 'SELECT_TASK' || selection.taskId !== selection.nextTask?.taskId || !available.some(task => task.taskId === selection.taskId)) throw Error('Manager selected an invalid, unavailable, or out-of-queue task');
    const selected = state.queue.find(task => task.taskId === selection.taskId);
    selected.status = 'IN_PROGRESS';
    state.currentTaskId = selected.taskId;
    state.history.push({ event: 'MANAGER_ASSIGNED', taskId: selected.taskId, realAI: true, at: new Date().toISOString() });
    await save();

    while (selected.status !== 'PASS') {
      const spec = taskSpecs.find(candidate => candidate.taskId === selected.taskId);
      const projectRoot = path.join(reportRoot, 'synthetic-input', selected.taskId);
      await fs.mkdir(path.join(projectRoot, 'src'), { recursive: true });
      await fs.mkdir(path.join(projectRoot, 'test'), { recursive: true });
      await fs.writeFile(path.join(projectRoot, spec.sourcePath), spec.source, { flag: 'wx' });
      await fs.writeFile(path.join(projectRoot, spec.testPath), spec.test, { flag: 'wx' });
      const allowedFiles = [spec.sourcePath, spec.testPath];
      const expectedHashes = {
        [spec.sourcePath]: digest(Buffer.from(spec.source)),
        [spec.testPath]: digest(Buffer.from(spec.test))
      };
      const result = await runSnapshotWorkflow({
        config, projectRoot, task: {
          ...selected, objective: spec.objective, allowedFiles, editableFiles: [spec.sourcePath],
          requiredTests: [spec.testPath], acceptanceCriteria: spec.acceptanceCriteria,
          testTimeoutMs: 90000
        },
        runRoot, expectedHashes, codex: invokeAI, maxAttempts: 2, timeoutMs,
        dockerTests,
        onState: async progress => {
          selected.status = progress.status === 'REWORK' ? 'REWORK' : 'IN_PROGRESS';
          selected.retryCount = Math.max(selected.retryCount, progress.attempt - 1);
          state.history.push({ event: 'ATTEMPT_REVIEWED', taskId: selected.taskId, attempt: progress.attempt, decision: progress.status, reportPath: progress.reportPath, at: new Date().toISOString() });
          await save();
        }
      });
      await atomicJson(path.join(reportRoot, `${selected.taskId}-workflow-result.json`), result);
      if (result.status !== 'VERIFIED_READY_TO_APPLY') throw Error(`${selected.taskId} did not reach VERIFIED_READY_TO_APPLY (status=${result.status})`);
      if (result.applyPlan.applyOccurred !== false || result.applyPlan.ownerApprovalRequired !== true) throw Error('Plan-only Apply Gate invariant failed');
      selected.status = 'PASS';
      state.history.push({ event: 'MANAGER_PASS', taskId: selected.taskId, attempts: result.attempts.length, realAI: true, at: new Date().toISOString() });
      state.currentTaskId = null;
      const next = state.queue.find(task => task.status === 'PENDING' && task.dependencies.every(id => state.queue.find(candidate => candidate.taskId === id)?.status === 'PASS'));
      state.nextTaskId = next?.taskId || null;
      await save();
      if (!next) break;

      const nextSelection = await invokeAI({ role: 'manager', schemaFile: managerSchema, prompt: `HC-901 has been accepted. Select exactly one dependency-ready next task from this synthetic-only queue; choose HC-902 now if it is ready. Do not invent, rewrite, or skip tasks. Return a complete Manager decision JSON: SELECT_TASK, matching taskId and nextTask copied exactly with status READY, dimensions NOT_APPLICABLE, approvalRequest null.\nQUEUE: ${JSON.stringify(state.queue.filter(task => task.status === 'PENDING' && task.dependencies.every(id => state.queue.find(candidate => candidate.taskId === id)?.status === 'PASS')))}\nLAST_VERIFIED_RESULT: ${JSON.stringify({ taskId: selected.taskId, status: selected.status, resultPath: path.join(reportRoot, `${selected.taskId}-workflow-result.json`) })}` });
      const newlyAvailable = state.queue.filter(task => task.status === 'PENDING' && task.dependencies.every(id => state.queue.find(candidate => candidate.taskId === id)?.status === 'PASS'));
      if (!validDecision(nextSelection) || nextSelection.decision !== 'SELECT_TASK' || nextSelection.taskId !== nextSelection.nextTask?.taskId || !newlyAvailable.some(task => task.taskId === nextSelection.taskId)) throw Error('Manager failed automatic next-task selection or selected an invalid task');
      const nextTask = state.queue.find(task => task.taskId === nextSelection.taskId);
      nextTask.status = 'IN_PROGRESS';
      state.currentTaskId = nextTask.taskId;
      state.nextTaskId = null;
      state.history.push({ event: 'AUTOMATIC_NEXT_TASK_ASSIGNED', taskId: nextTask.taskId, afterTaskId: selected.taskId, realAI: true, at: new Date().toISOString() });
      await save();
      state.currentTaskId = nextTask.taskId;
      // The next iteration operates on the selected queue entry; task selection is bounded to two items.
      return await runSecondTask({ nextTask, state, save, reportRoot, runRoot, config, invokeAI, dockerTests, timeoutMs });
    }
    state.status = 'DEMO_PASS';
    state.completedAt = new Date().toISOString();
    await save();
    return { status: state.status, statePath, reportRoot, realAiCalls: state.realAiCalls, queue: state.queue.map(task => ({ taskId: task.taskId, status: task.status, retryCount: task.retryCount })), history: state.history };
  } catch (error) {
    state.status = 'BLOCKED';
    state.blocker = error.message;
    state.completedAt = new Date().toISOString();
    await save();
    throw Object.assign(error, { reportRoot, statePath, realAiCalls: state.realAiCalls });
  } finally {
    await release();
  }
}

/** Real-AI, same-task adversarial review probe. It exposes a deliberately incomplete Developer brief; the authoritative Manager acceptance criteria remain complete. */
export async function runMvp003ReworkProbe({ config, logger = console.log, codex = runCodex, dockerTests = runSnapshotTests, timeoutMs = 180000 } = {}) {
  const release = await acquireLock(ROOT);
  const spec = taskSpecs[0];
  const runId = new Date().toISOString().replaceAll(':', '-');
  const reportRoot = path.join(ROOT, 'reports', 'MVP_003_REWORK', runId);
  const projectRoot = path.join(reportRoot, 'synthetic-input', spec.taskId);
  const statePath = path.join(reportRoot, 'rework-state.json');
  const state = { runId, mode: 'REAL_CODEX_SYNTHETIC_REWORK_PROBE', status: 'INITIALIZING', taskId: spec.taskId, realAiCalls: 0, maxRealAiCalls: 4, callHistory: [], attemptHistory: [], startedAt: new Date().toISOString() };
  const save = async () => { state.updatedAt = new Date().toISOString(); await atomicJson(statePath, state); };
  const invokeAI = async options => {
    if (state.realAiCalls >= state.maxRealAiCalls) throw Error('Rework probe reached its four-call limit');
    const call = { role: options.role, number: ++state.realAiCalls, status: 'RUNNING', startedAt: new Date().toISOString() };
    state.callHistory.push(call);
    await save();
    try {
      const result = await codex({ config: { ...config, manager: { ...config.manager, sandbox: 'read-only' }, developer: { ...config.developer, sandbox: 'read-only' } }, ...options, root: options.root || projectRoot, runDir: path.join(reportRoot, 'ai', `${call.number}-${options.role}`), timeoutMs, ephemeral: true, structuredOnly: true, logger });
      call.status = 'COMPLETED';
      call.eventTypes = result.eventTypes || [];
      call.blockedToolEvents = result.blockedToolEvents || [];
      call.completedAt = new Date().toISOString();
      await save();
      return result.data;
    } catch (error) {
      call.status = 'FAILED';
      call.error = error.message;
      call.completedAt = new Date().toISOString();
      await save();
      throw error;
    }
  };

  try {
    await fs.mkdir(path.join(projectRoot, 'src'), { recursive: true });
    await fs.mkdir(path.join(projectRoot, 'test'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, spec.sourcePath), spec.source, { flag: 'wx' });
    await fs.writeFile(path.join(projectRoot, spec.testPath), spec.test, { flag: 'wx' });
    const expectedHashes = { [spec.sourcePath]: digest(Buffer.from(spec.source)), [spec.testPath]: digest(Buffer.from(spec.test)) };
    state.status = 'RUNNING';
    await save();
    const task = {
      ...spec.task, objective: spec.objective, allowedFiles: [spec.sourcePath, spec.testPath], editableFiles: [spec.sourcePath],
      requiredTests: [spec.testPath], acceptanceCriteria: spec.acceptanceCriteria,
      developerBrief: 'Implement a basic ASCII-only lowercase URL slug. Replace spaces and punctuation with single hyphens and trim edge hyphens.',
      developerAcceptanceCriteria: ['Basic ASCII lowercase words are separated by one hyphen.', 'The focused test passes without network access.'],
      testTimeoutMs: 90000
    };
    const result = await runSnapshotWorkflow({
      config, projectRoot, task, runRoot: path.join(reportRoot, 'runs'), expectedHashes,
      codex: invokeAI, dockerTests, maxAttempts: 2, timeoutMs,
      onState: async progress => {
        state.attemptHistory.push({ ...progress, decisionSource: 'real-manager-ai' });
        await save();
      }
    });
    const first = result.attempts[0];
    const second = result.attempts[1];
    const reworkVerified = first?.managerAiDecision?.decision === 'REWORK' && first.tests.some(item => item.result === 'FAIL' && item.exitCode !== 0) && first.managerAiDecision.feedback?.length > 0;
    const passVerified = second?.managerAiDecision?.decision === 'PASS' && second.tests.length > 0 && second.tests.every(item => item.result === 'PASS' && item.exitCode === 0) && result.status === 'VERIFIED_READY_TO_APPLY';
    state.workflowResult = result;
    state.reworkVerified = reworkVerified;
    state.passVerified = passVerified;
    state.status = reworkVerified && passVerified ? 'REWORK_PASS' : 'REWORK_PROBE_INCOMPLETE';
    state.completedAt = new Date().toISOString();
    await save();
    await atomicJson(path.join(reportRoot, 'rework-verdict.json'), { status: state.status, taskId: spec.taskId, reworkVerified, passVerified, firstManagerAiDecision: first?.managerAiDecision || null, secondManagerAiDecision: second?.managerAiDecision || null, applyOccurred: result.applyOccurred === true || result.applyPlan?.applyOccurred === true });
    return { status: state.status, statePath, reportRoot, realAiCalls: state.realAiCalls, reworkVerified, passVerified, attempts: result.attempts.map(attempt => ({ attempt: attempt.attempt, developer: 'REAL_AI', managerAiDecision: attempt.managerAiDecision?.decision, tests: attempt.tests.map(item => item.result) })) };
  } catch (error) {
    state.status = 'BLOCKED';
    state.blocker = error.message;
    state.completedAt = new Date().toISOString();
    await save();
    throw Object.assign(error, { reportRoot, statePath, realAiCalls: state.realAiCalls });
  } finally {
    await release();
  }
}

async function runSecondTask({ nextTask, state, save, reportRoot, runRoot, config, invokeAI, dockerTests, timeoutMs }) {
  const spec = taskSpecs.find(candidate => candidate.taskId === nextTask.taskId);
  const projectRoot = path.join(reportRoot, 'synthetic-input', nextTask.taskId);
  await fs.mkdir(path.join(projectRoot, 'src'), { recursive: true });
  await fs.mkdir(path.join(projectRoot, 'test'), { recursive: true });
  await fs.writeFile(path.join(projectRoot, spec.sourcePath), spec.source, { flag: 'wx' });
  await fs.writeFile(path.join(projectRoot, spec.testPath), spec.test, { flag: 'wx' });
  const result = await runSnapshotWorkflow({
    config, projectRoot, task: { ...nextTask, objective: spec.objective, allowedFiles: [spec.sourcePath, spec.testPath], editableFiles: [spec.sourcePath], requiredTests: [spec.testPath], acceptanceCriteria: spec.acceptanceCriteria, testTimeoutMs: 90000 },
    runRoot, expectedHashes: { [spec.sourcePath]: digest(Buffer.from(spec.source)), [spec.testPath]: digest(Buffer.from(spec.test)) },
    codex: invokeAI, dockerTests, maxAttempts: 2, timeoutMs,
    onState: async progress => {
      nextTask.status = progress.status === 'REWORK' ? 'REWORK' : 'IN_PROGRESS';
      nextTask.retryCount = Math.max(nextTask.retryCount, progress.attempt - 1);
      state.history.push({ event: 'ATTEMPT_REVIEWED', taskId: nextTask.taskId, attempt: progress.attempt, decision: progress.status, reportPath: progress.reportPath, at: new Date().toISOString() });
      await save();
    }
  });
  await atomicJson(path.join(reportRoot, `${nextTask.taskId}-workflow-result.json`), result);
  if (result.status !== 'VERIFIED_READY_TO_APPLY' || result.applyPlan.applyOccurred !== false) throw Error(`${nextTask.taskId} failed plan-only acceptance: ${result.status}`);
  nextTask.status = 'PASS';
  state.currentTaskId = null;
  state.nextTaskId = null;
  state.history.push({ event: 'MANAGER_PASS', taskId: nextTask.taskId, attempts: result.attempts.length, realAI: true, at: new Date().toISOString() });
  state.status = 'DEMO_PASS';
  state.completedAt = new Date().toISOString();
  await save();
  return { status: state.status, statePath: path.join(reportRoot, 'demo-state.json'), reportRoot, realAiCalls: state.realAiCalls, queue: state.queue.map(task => ({ taskId: task.taskId, status: task.status, retryCount: task.retryCount })), history: state.history };
}
