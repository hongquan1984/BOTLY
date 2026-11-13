import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runCodex } from './developer-adapter.mjs';
import { validDecision } from './report-reader.mjs';
import { atomicJson } from './state-store.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TASKS = [
  {
    taskId: 'HC-901', title: 'Synthetic greeting behavior', objective: 'Change greet(name) to return exactly `Hello, ${name}!`.',
    allowed: ['src/greeting.mjs'], test: 'test/greeting.test.mjs', acceptance: ['greet("Ada") returns "Hello, Ada!"'],
    initial: 'export function greet(name) { return `Hi ${name}`; }\n',
    testSource: `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { greet } from '../src/greeting.mjs';\ntest('greet returns the required greeting', () => assert.equal(greet('Ada'), 'Hello, Ada!'));\n`
  },
  {
    taskId: 'HC-902', title: 'Synthetic farewell behavior', objective: 'Change farewell(name) to return exactly `Goodbye, ${name}!`.',
    allowed: ['src/farewell.mjs'], test: 'test/farewell.test.mjs', acceptance: ['farewell("Ada") returns "Goodbye, Ada!"'],
    initial: 'export function farewell(name) { return `Bye ${name}`; }\n',
    testSource: `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { farewell } from '../src/farewell.mjs';\ntest('farewell returns the required message', () => assert.equal(farewell('Ada'), 'Goodbye, Ada!'));\n`
  }
];

const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const dimensions = value => ({ functional: value, visual: 'NOT_APPLICABLE', data: 'NOT_APPLICABLE', localization: 'NOT_APPLICABLE', security: 'PASS', aiIntegration: 'NOT_APPLICABLE' });
const taskRecord = t => ({
  taskId: t.taskId, title: t.title, objective: t.objective, priority: 'P1',
  sourceRequirements: [`synthetic/${t.test}`], dependencies: [], allowedScope: t.allowed,
  deliverables: ['One source patch', 'Passing isolated Node test'], acceptanceCriteria: t.acceptance,
  requiredTests: [`node --test ${t.test}`], visualEvidence: [], retryCount: 0,
  status: 'PENDING', previousReviewFeedback: [], ownerApprovalRequired: false, projectFinalAudit: false
});

async function safeTarget(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.startsWith('/') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw Error(`Unsafe patch path: ${relative}`);
  const target = path.resolve(root, ...relative.split('/'));
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error(`Patch escaped workspace: ${relative}`);
  let cursor = path.resolve(root);
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    try { if ((await fs.lstat(cursor)).isSymbolicLink()) throw Error(`Symlink path rejected: ${relative}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

export async function applyScopedPatch({ root, allowlist, patches, baselineHashes, applied = new Set() }) {
  if (!Array.isArray(patches) || !patches.length) throw Error('Patch list is empty');
  const normalized = patches.map(p => p?.path);
  if (new Set(normalized).size !== normalized.length) throw Error('Duplicate paths in patch list');
  if (normalized.some(p => !allowlist.includes(p))) throw Error('Patch contains a path outside the strict allowlist');
  const prepared = [];
  for (const patch of patches) {
    if (typeof patch.content !== 'string') throw Error('Patch content must be a string');
    const target = await safeTarget(root, patch.path);
    const before = await fs.readFile(target, 'utf8');
    if (digest(before) !== baselineHashes[patch.path]) throw Error(`Baseline checksum mismatch: ${patch.path}`);
    const patchDigest = digest(`${patch.path}\0${baselineHashes[patch.path]}\0${patch.content}`);
    if (applied.has(patchDigest)) throw Error(`Duplicate patch result refused: ${patch.path}`);
    prepared.push({ target, patch, patchDigest });
  }
  for (const { target, patch, patchDigest } of prepared) {
    const temp = `${target}.${crypto.randomUUID()}.stage`;
    await fs.writeFile(temp, patch.content, { encoding: 'utf8', flag: 'wx' });
    try { await fs.rename(temp, target); } catch (error) { await fs.rm(temp, { force: true }); throw error; }
    applied.add(patchDigest);
  }
  return prepared.map(x => ({ path: x.patch.path, sha256: digest(x.patch.content), patchDigest: x.patchDigest }));
}

async function dockerTest(workspace, testFile, timeoutMs = 120000) {
  const args = [
    'run', '--rm', '--network', 'none', '--read-only', '--user', '65534:65534',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--pids-limit', '64',
    '--memory', '512m', '--cpus', '1', '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=16m',
    '--mount', `type=bind,source=${workspace},target=/workspace,readonly`, '--workdir', '/workspace',
    'node:24-bookworm-slim', '--test', testFile
  ];
  return await new Promise((resolve, reject) => {
    const child = spawn('docker', args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
    child.stdout.on('data', b => { stdout = (stdout + b.toString()).slice(-12000); });
    child.stderr.on('data', b => { stderr = (stderr + b.toString()).slice(-12000); });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ command: `docker ${args.join(' ')}`, exitCode: code, signal, timedOut, passed: code === 0 && !timedOut, stdout, stderr });
    });
  });
}

async function actualDiff(workspace, baselineRoot, relative) {
  const original = await safeTarget(baselineRoot, relative);
  const current = await safeTarget(workspace, relative);
  try {
    const { stdout, stderr } = await execFileAsync('git', ['diff', '--no-index', '--', original, current], { encoding: 'utf8', windowsHide: true, maxBuffer: 1_000_000 });
    return stdout || stderr;
  } catch (error) {
    if (error.code === 1) return error.stdout || error.stderr;
    throw error;
  }
}

function callTask(managerTask) {
  return { ...managerTask, status: 'READY' };
}

export async function runMvpDemo({ config, logger = console.log, codex = runCodex, docker = dockerTest } = {}) {
  const runId = new Date().toISOString().replaceAll(':', '-');
  const reportRoot = path.join(ROOT, 'reports', 'MVP_DEMO', runId);
  const workspace = path.join(ROOT, 'workspaces', 'mvp-demo', runId);
  const baselineRoot = path.join(workspace, '.baseline');
  const sourceRoot = path.join(workspace, 'src');
  const testRoot = path.join(workspace, 'test');
  const reportFile = path.join(reportRoot, 'demo-state.json');
  const state = { runId, mode: 'REAL_CODEX_SYNTHETIC_ONLY', status: 'INITIALIZING', realAiCalls: 0, queue: TASKS.map(taskRecord), history: [], currentTaskId: null, nextTaskId: null };
  await fs.mkdir(reportRoot, { recursive: true });
  await fs.mkdir(sourceRoot, { recursive: true });
  await fs.mkdir(testRoot, { recursive: true });
  await fs.mkdir(path.join(baselineRoot, 'src'), { recursive: true });
  await fs.mkdir(path.join(baselineRoot, 'test'), { recursive: true });
  for (const t of TASKS) {
    const sourcePath = t.allowed[0];
    const source = t.initial;
    await fs.writeFile(path.join(workspace, sourcePath), source, 'utf8');
    await fs.writeFile(path.join(workspace, t.test), t.testSource, 'utf8');
    await fs.writeFile(path.join(baselineRoot, sourcePath), source, 'utf8');
    await fs.writeFile(path.join(baselineRoot, t.test), t.testSource, 'utf8');
  }
  const save = async () => atomicJson(reportFile, state);
  const runDir = path.join(reportRoot, 'ai');
  const ai = async ({ role, prompt, schema }) => {
    state.realAiCalls++;
    await save();
    const result = await codex({
      config: { ...config, manager: { ...config.manager, sandbox: 'read-only' }, developer: { ...config.developer, sandbox: 'read-only' } },
      role, prompt, root: workspace, runDir: path.join(runDir, `${String(state.realAiCalls).padStart(2, '0')}-${role}`),
      timeoutMs: 180000, schemaFile: schema, ephemeral: true, logger
    });
    return result.data;
  };
  const managerSchema = path.join(ROOT, 'schemas', 'manager-decision.schema.json');
  const patchSchema = path.join(ROOT, 'schemas', 'mvp-patch.schema.json');
  const appliedDigests = new Set();
  try {
    state.status = 'RUNNING';
    for (let taskIndex = 0; taskIndex < TASKS.length; taskIndex++) {
      const available = state.queue.filter(t => ['PENDING', 'READY'].includes(t.status));
      const selection = await ai({ role: 'manager', schema: managerSchema, prompt: `Select exactly one next task from this synthetic queue, in dependency order. Return a complete Manager decision JSON. Do not invent tasks. Use SELECT_TASK, taskId matching nextTask.taskId, nextTask copied exactly with status READY, all six dimensions NOT_APPLICABLE, and no approval.\nQUEUE: ${JSON.stringify(available)}` });
      if (!validDecision(selection) || selection.decision !== 'SELECT_TASK' || selection.taskId !== selection.nextTask?.taskId || !available.some(t => t.taskId === selection.taskId)) throw Error('Manager returned an invalid or out-of-queue task selection');
      const task = state.queue.find(t => t.taskId === selection.taskId);
      const spec = TASKS.find(t => t.taskId === task.taskId);
      state.currentTaskId = task.taskId;
      task.status = 'IN_PROGRESS';
      state.history.push({ event: 'MANAGER_ASSIGNED', taskId: task.taskId, ai: 'REAL' });
      await save();

      const target = await safeTarget(workspace, spec.allowed[0]);
      const current = await fs.readFile(target, 'utf8');
      const beforeHash = digest(current);
      const taskPrompt = `You are Developer for a synthetic-only MVP. You may inspect only the synthetic source and test text included here. Do not use tools or modify files; return a complete replacement patch as structured JSON.\nTASK: ${JSON.stringify(task)}\nCURRENT SOURCE (${spec.allowed[0]}):\n${current}\nTEST (${spec.test}):\n${spec.testSource}\nReturn taskId ${task.taskId}, one patch for ${spec.allowed[0]}, and no other paths. The host applies the proposal after path and checksum validation.`;
      const proposal = await ai({ role: 'developer', schema: patchSchema, prompt: taskPrompt });
      if (proposal?.taskId !== task.taskId || !Array.isArray(proposal.patches) || proposal.patches.some(p => !spec.allowed.includes(p.path))) throw Error(`Developer proposal invalid or outside task allowlist: ${task.taskId}`);
      const applied = await applyScopedPatch({ root: workspace, allowlist: spec.allowed, patches: proposal.patches, baselineHashes: { [spec.allowed[0]]: beforeHash }, applied: appliedDigests });
      let testResult = await docker(workspace, spec.test);
      let devReport = { taskId: task.taskId, attempt: 1, status: 'READY_FOR_REVIEW', summary: proposal.summary, changedFiles: applied.map(x => x.path), developerLimitations: proposal.limitations, testEvidence: { runner: 'MVP orchestrator using Docker', ...testResult }, origin: 'REAL_CODEX_STRUCTURED_PATCH' };
      await atomicJson(path.join(reportRoot, `${task.taskId}-attempt-1-developer-result.json`), devReport);
      await atomicJson(path.join(reportRoot, `${task.taskId}-attempt-1-test.json`), testResult);
      let fixture = null;
      if (task.taskId === 'HC-901') {
        const passSource = await fs.readFile(target, 'utf8');
        const faulty = passSource.replace('Hello, ', 'Hola, ');
        if (faulty === passSource) throw Error('Could not create the labeled deterministic REWORK fixture');
        const fixtureHash = digest(passSource);
        const fixtureApply = await applyScopedPatch({ root: workspace, allowlist: spec.allowed, patches: [{ path: spec.allowed[0], content: faulty }], baselineHashes: { [spec.allowed[0]]: fixtureHash }, applied: appliedDigests });
        fixture = { label: 'INTENTIONAL_REWORK_FIXTURE', purpose: 'Exercise real rejection using a deliberately incorrect source replacement in synthetic workspace only.', changed: fixtureApply };
        testResult = await docker(workspace, spec.test);
        if (testResult.passed) throw Error('Rework fixture unexpectedly passed its test');
        await atomicJson(path.join(reportRoot, `${task.taskId}-rework-fixture-test.json`), testResult);
        await atomicJson(path.join(reportRoot, `${task.taskId}-rework-fixture.json`), fixture);
      }
      const diff = await actualDiff(workspace, baselineRoot, spec.allowed[0]);
      await fs.writeFile(path.join(reportRoot, `${task.taskId}-${fixture ? 'rework' : 'initial'}-actual-diff.patch`), diff, 'utf8');
      const reviewPrompt = `You are the independent Manager reviewer. Decide from the actual diff and captured test evidence below, not the Developer claim. The project is synthetic. Return a complete decision JSON for task ${task.taskId}. If test failed, you must return REWORK and precise corrective feedback. PASS is allowed only if the acceptance criterion is met and test exit code is 0.\nTASK: ${JSON.stringify(task)}\nACTUAL GIT DIFF:\n${diff}\nTEST EVIDENCE:\n${JSON.stringify(testResult)}\nFIXTURE: ${JSON.stringify(fixture)}\nDIMENSIONS: functional verdict; visual/data/localization/aiIntegration NOT_APPLICABLE; security PASS only if path allowlist respected.`;
      let review = await ai({ role: 'manager', schema: managerSchema, prompt: reviewPrompt });
      if (!validDecision(review) || review.taskId !== task.taskId) throw Error(`Manager review response invalid for ${task.taskId}`);
      if (!testResult.passed && review.decision === 'PASS') throw Error(`Manager incorrectly accepted failing test for ${task.taskId}`);
      if (fixture) {
        if (review.decision !== 'REWORK' || !review.feedback.length) throw Error('Manager failed to reject the marked rework fixture with actionable feedback');
        state.history.push({ event: 'MANAGER_REWORK', taskId: task.taskId, fixture: fixture.label, feedback: review.feedback, ai: 'REAL' });
        task.status = 'REWORK';
        task.retryCount = 1;
        task.previousReviewFeedback = review.feedback;
        await atomicJson(path.join(reportRoot, `${task.taskId}-rework-review.json`), review);
        await save();
        const retryBefore = await fs.readFile(target, 'utf8');
        const retryPrompt = `You are Developer correcting ${task.taskId}. Use only this synthetic source/test. Fix the actual failed requirement and feedback. Return a complete replacement patch JSON only; do not edit files or use tools.\nTASK: ${JSON.stringify(task)}\nFEEDBACK: ${JSON.stringify(review.feedback)}\nCURRENT SOURCE: ${retryBefore}\nTEST: ${spec.testSource}\nALLOWED PATH: ${spec.allowed[0]}`;
        const retryProposal = await ai({ role: 'developer', schema: patchSchema, prompt: retryPrompt });
        if (retryProposal?.taskId !== task.taskId || retryProposal.patches?.some(p => !spec.allowed.includes(p.path))) throw Error('Developer rework proposal failed validation');
        const retryApplied = await applyScopedPatch({ root: workspace, allowlist: spec.allowed, patches: retryProposal.patches, baselineHashes: { [spec.allowed[0]]: digest(retryBefore) }, applied: appliedDigests });
        testResult = await docker(workspace, spec.test);
        if (!testResult.passed) throw Error(`Developer rework did not pass its isolated test: ${testResult.stderr}`);
        const retryDiff = await actualDiff(workspace, baselineRoot, spec.allowed[0]);
        devReport = { taskId: task.taskId, attempt: 2, status: 'READY_FOR_REVIEW', summary: retryProposal.summary, changedFiles: retryApplied.map(x => x.path), developerLimitations: retryProposal.limitations, testEvidence: { runner: 'MVP orchestrator using Docker', ...testResult }, origin: 'REAL_CODEX_REWORK_PATCH' };
        await atomicJson(path.join(reportRoot, `${task.taskId}-attempt-2-developer-result.json`), devReport);
        await atomicJson(path.join(reportRoot, `${task.taskId}-attempt-2-test.json`), testResult);
        await fs.writeFile(path.join(reportRoot, `${task.taskId}-accepted-actual-diff.patch`), retryDiff, 'utf8');
        await atomicJson(path.join(reportRoot, `${task.taskId}-developer-result.json`), devReport);
        review = await ai({ role: 'manager', schema: managerSchema, prompt: `Independently review the corrected diff and passing test. Accept only if actual evidence meets the criterion. Return a complete decision JSON for ${task.taskId}; PASS requires test pass and exact behavior.\nTASK: ${JSON.stringify(task)}\nACTUAL GIT DIFF:\n${retryDiff}\nTEST EVIDENCE:\n${JSON.stringify(testResult)}\nPREVIOUS FEEDBACK: ${JSON.stringify(task.previousReviewFeedback)}` });
        if (!validDecision(review) || review.taskId !== task.taskId || review.decision !== 'PASS' || !testResult.passed) throw Error('Manager did not accept the corrected task using passing evidence');
        await atomicJson(path.join(reportRoot, `${task.taskId}-accepted-review.json`), review);
        state.history.push({ event: 'MANAGER_PASS_AFTER_REWORK', taskId: task.taskId, ai: 'REAL', testPassed: true });
      } else {
        if (!testResult.passed || review.decision !== 'PASS') throw Error(`Task ${task.taskId} failed its independent acceptance review`);
        await atomicJson(path.join(reportRoot, `${task.taskId}-accepted-review.json`), review);
        state.history.push({ event: 'MANAGER_PASS', taskId: task.taskId, ai: 'REAL', testPassed: true });
      }
      task.status = 'PASS';
      task.retryCount = task.taskId === 'HC-901' ? 1 : 0;
      task.previousReviewFeedback = task.taskId === 'HC-901' ? task.previousReviewFeedback : [];
      state.currentTaskId = null;
      state.nextTaskId = state.queue.find(t => t.status === 'PENDING')?.taskId || null;
      await save();
    }
    state.status = 'DEMO_PASS';
    state.nextTaskId = null;
    await save();
    return { status: state.status, reportFile, workspace, realAiCalls: state.realAiCalls, tasks: state.queue.map(t => ({ taskId: t.taskId, status: t.status, retryCount: t.retryCount })), history: state.history };
  } catch (error) {
    state.status = 'BLOCKED';
    state.blocker = error.message;
    await save();
    throw Object.assign(error, { reportFile, workspace, realAiCalls: state.realAiCalls });
  }
}
