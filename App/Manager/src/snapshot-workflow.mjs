import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createTaskSnapshot, applyPatchToSnapshot, inspectSnapshot, verifySourceBaseline, changedSnapshotFiles } from './workspace-snapshot.mjs';
import { prepareApplyPlan } from './apply-gate.mjs';
import { runCodex } from './developer-adapter.mjs';
import { atomicJson } from './state-store.mjs';

const sha = value => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
const safeName = value => String(value).replace(/[^A-Za-z0-9._-]/g, '_');

function fullFileDiff(relative, before, after) {
  const oldText = (before || Buffer.alloc(0)).toString('utf8');
  const newText = (after || Buffer.alloc(0)).toString('utf8');
  return `--- a/${relative}\n+++ b/${relative}\n@@ full-file replacement @@\n${oldText.split(/(?<=\n)/).map(line => `-${line}`).join('')}${newText.split(/(?<=\n)/).map(line => `+${line}`).join('')}`;
}

export async function runSnapshotTests({ dockerCommand = 'docker', snapshotRoot, tests, timeoutMs = 120000, spawnImpl = spawn }) {
  if (!Array.isArray(tests) || tests.length === 0) throw Error('At least one pre-approved test path is required');
  const root = path.resolve(snapshotRoot);
  const results = [];
  for (const testPath of tests) {
    if (typeof testPath !== 'string' || testPath.startsWith('/') || testPath.includes('..') || testPath.includes('\\')) throw Error(`Unsafe test path: ${testPath}`);
    const target = path.resolve(root, testPath);
    if (!target.startsWith(`${root}${path.sep}`)) throw Error(`Test path escapes workspace: ${testPath}`);
    const args = [
      'run', '--rm', '--network', 'none', '--read-only', '--user', '65534:65534',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--pids-limit', '64',
      '--memory', '512m', '--cpus', '1', '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=16m',
      '--mount', `type=bind,source=${root},target=/workspace,readonly`, '--workdir', '/workspace',
      'node:24-bookworm-slim', 'node', testPath
    ];
    const result = await new Promise(resolve => {
      let output = '';
      let timedOut = false;
      const child = spawnImpl(dockerCommand, args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
      child.stdout.on('data', chunk => { output += chunk.toString(); });
      child.stderr.on('data', chunk => { output += chunk.toString(); });
      child.on('error', error => { clearTimeout(timer); resolve({ command: `docker ${args.join(' ')}`, result: 'FAIL', exitCode: null, timedOut, error: error.message, output }); });
      child.on('close', code => { clearTimeout(timer); resolve({ command: `docker ${args.join(' ')}`, result: code === 0 && !timedOut ? 'PASS' : 'FAIL', exitCode: code, timedOut, output: output.slice(-8000) }); });
    });
    results.push(result);
  }
  return results;
}

/** Runs only against an explicit source snapshot. It never applies changes to projectRoot. */
export async function runSnapshotWorkflow({
  config, projectRoot, task, runRoot, expectedHashes, codex = runCodex,
  dockerTests = runSnapshotTests, maxAttempts = 3, timeoutMs = 90 * 60 * 1000,
  onState = async () => {}
}) {
  if (!task?.taskId || !Array.isArray(task.allowedFiles) || !Array.isArray(task.editableFiles) || !Array.isArray(task.requiredTests)) throw Error('Task must provide ID, file allowlists, and fixed test paths');
  if (task.editableFiles.some(file => !task.allowedFiles.includes(file))) throw Error('Editable file is outside snapshot allowlist');
  const directory = path.resolve(runRoot, safeName(task.taskId));
  await fs.mkdir(path.dirname(directory), { recursive: true });
  const snapshot = await createTaskSnapshot({ projectRoot, snapshotRoot: path.join(directory, 'workspace'), taskId: task.taskId, allowedFiles: task.allowedFiles, expectedHashes });
  const initial = structuredClone(snapshot.manifest);
  let currentManifest = snapshot.manifest;
  let previousFeedback = [];
  const attempts = [];
  const workflowStatePath = path.join(directory, 'workflow-state.json');
  const workflowState = { version: 1, taskId: task.taskId, status: 'IN_PROGRESS', phase: 'SNAPSHOT_READY', currentAttempt: 0, snapshotRoot: snapshot.root, initialManifest: initial, attemptHistory: [], updatedAt: new Date().toISOString() };
  const persist = async () => { workflowState.updatedAt = new Date().toISOString(); await atomicJson(workflowStatePath, workflowState); };
  await persist();
  const readContext = async () => Promise.all(task.editableFiles.map(async relative => {
    const target = path.join(snapshot.root, ...relative.split('/'));
    const exists = await fs.lstat(target).then(() => true, error => error.code === 'ENOENT' ? false : Promise.reject(error));
    if (!exists) return { path: relative, content: null, sha256: null };
    const content = await fs.readFile(target, 'utf8');
    return { path: relative, content: content.slice(0, 30000), sha256: sha(Buffer.from(content)) };
  }));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    workflowState.currentAttempt = attempt;
    workflowState.phase = 'DEVELOPER_RUNNING';
    await persist();
    const baseline = await verifySourceBaseline(projectRoot, initial);
    if (!baseline.matches) return { status: 'BLOCKED_SOURCE_CHANGED', taskId: task.taskId, attempts, baseline, applyOccurred: false };
    const reportPath = path.join(directory, `developer-attempt-${attempt}.json`);
    const developerTask = { taskId: task.taskId, objective: task.developerBrief || task.objective, allowedFiles: task.editableFiles, acceptanceCriteria: task.developerAcceptanceCriteria || task.acceptanceCriteria || [], requiredTests: task.requiredTests };
    let response;
    if (task.mockPatches?.[attempt - 1]) response = { data: { taskId: task.taskId, attempt, summary: 'Synthetic fixture patch', patches: task.mockPatches[attempt - 1], limitations: [] } };
    else {
      const developerConfig = { ...config, developer: { ...config.developer, sandbox: 'read-only' } };
      response = await codex({ config: developerConfig, role: 'developer', prompt: `Return one JSON object conforming to the supplied schema. Set taskId to ${task.taskId}, attempt to ${attempt}, include a concise summary and limitations array, and provide structured patches only. Do not call tools, execute commands, or edit files. Use only the supplied source contents and task requirements. Every patch must use the exact relative path and matching baseSha256.\nTask: ${JSON.stringify(developerTask)}\nPrior review feedback: ${JSON.stringify(previousFeedback)}\nWorkspace file contents: ${JSON.stringify(await readContext())}`, root: snapshot.root, runDir: path.join(directory, `attempt-${attempt}`), timeoutMs, schemaFile: path.resolve('schemas/workspace-patch.schema.json'), ephemeral: true, structuredOnly: true });
    }
    const output = response?.data ?? response;
    if (output.taskId !== task.taskId || output.attempt !== attempt) throw Error('Developer structured result task ID/attempt mismatch');
    workflowState.phase = 'DEVELOPER_RESULT_RECEIVED';
    workflowState.lastDeveloperResult = output;
    await atomicJson(path.join(directory, `developer-attempt-${attempt}.json`), output);
    await persist();
    if (output.patches.some(patch => !task.editableFiles.includes(patch.path))) throw Error('Developer patch exceeds editable-file allowlist');
    await applyPatchToSnapshot({ snapshotRoot: snapshot.root, manifest: currentManifest, patches: output.patches, allowlist: task.editableFiles });
    currentManifest = JSON.parse(await fs.readFile(path.join(snapshot.root, '.manager', 'snapshot-manifest.json'), 'utf8'));
    const finalManifest = currentManifest;
    const changed = await changedSnapshotFiles(snapshot.root, initial, finalManifest);
    workflowState.phase = 'DOCKER_TESTING';
    workflowState.changedFiles = changed;
    await persist();
    const tests = task.mockTestResults || await dockerTests({ snapshotRoot: snapshot.root, tests: task.requiredTests, timeoutMs: task.testTimeoutMs || 120000 });
    await atomicJson(path.join(directory, `test-evidence-attempt-${attempt}.json`), tests);
    const testPass = tests.length > 0 && tests.every(test => test.result === 'PASS' && test.exitCode === 0);
    const diffByPath = {};
    for (const relative of changed) {
      const currentPath = path.join(snapshot.root, ...relative.split('/'));
      const after = await fs.lstat(currentPath).then(() => fs.readFile(currentPath), error => error.code === 'ENOENT' ? null : Promise.reject(error));
      diffByPath[relative] = fullFileDiff(relative, snapshot.baselineContents.get(relative), after);
    }
    workflowState.phase = 'MANAGER_REVIEW';
    workflowState.testEvidence = tests;
    workflowState.actualDiff = diffByPath;
    await persist();
    let managerDecision;
    if (task.mockManagerDecisions?.[attempt - 1]) managerDecision = task.mockManagerDecisions[attempt - 1];
    else {
      const review = await codex({ config: { ...config, manager: { ...config.manager, sandbox: 'read-only' } }, role: 'manager', prompt: `Independently review task, acceptance criteria, actual diffs and test results. Do not edit files or run tools. Decide PASS only if evidence satisfies all criteria. If any test failed, PASS is forbidden.\nTASK: ${JSON.stringify(task)}\nACTUAL_CHANGED_PATHS: ${JSON.stringify(changed)}\nDIFFS: ${JSON.stringify(diffByPath)}\nTEST_RESULTS: ${JSON.stringify(tests)}`, root: snapshot.root, runDir: path.join(directory, `review-${attempt}`), timeoutMs, ephemeral: true, structuredOnly: true });
      managerDecision = review?.data ?? review;
    }
    if (managerDecision.taskId !== task.taskId) throw Error('Manager decision task ID mismatch');
    const managerAiDecision = structuredClone(managerDecision);
    if (!testPass && managerDecision.decision === 'PASS') managerDecision = { ...managerDecision, decision: 'REWORK', feedback: [...(managerDecision.feedback || []), 'Test evidence contains a failure; PASS is prohibited.'] };
    const record = { taskId: task.taskId, attempt, developerResult: output, changedFiles: changed, diffByPath, tests, managerAiDecision, managerDecision };
    attempts.push(record);
    await fs.writeFile(reportPath, `${JSON.stringify(record, null, 2)}\n`);
    workflowState.attemptHistory.push({ attempt, reportPath, managerDecision, testPass, changedFiles: changed });
    workflowState.lastManagerDecision = managerDecision;
    workflowState.phase = 'REVIEW_RECORDED';
    await persist();
    await onState({ taskId: task.taskId, attempt, status: managerDecision.decision, reportPath });
    const stillUnchanged = await verifySourceBaseline(projectRoot, initial);
    if (!stillUnchanged.matches) return { status: 'BLOCKED_SOURCE_CHANGED', taskId: task.taskId, attempts, baseline: stillUnchanged, applyOccurred: false };
    if (managerDecision.decision === 'PASS' && testPass) {
      const applyPlan = await prepareApplyPlan({ projectRoot, snapshotRoot: snapshot.root, initialManifest: initial, finalManifest, allowlist: task.editableFiles, managerDecision, tests, diffByPath, runId: task.taskId });
      const result = { status: applyPlan.status, taskId: task.taskId, attempts, snapshotRoot: snapshot.root, initialManifest: initial, finalManifest, tests, diffByPath, applyPlan, applyOccurred: false };
      await fs.writeFile(path.join(directory, 'workflow-result.json'), `${JSON.stringify(result, null, 2)}\n`);
      workflowState.status = result.status;
      workflowState.phase = 'VERIFIED_RESULT_SAVED';
      workflowState.resultPath = path.join(directory, 'workflow-result.json');
      await persist();
      return result;
    }
    if (managerDecision.decision === 'BLOCKED' || managerDecision.decision === 'NEEDS_APPROVAL') {
      const result = { status: managerDecision.decision, taskId: task.taskId, attempts, applyOccurred: false };
      await fs.writeFile(path.join(directory, 'workflow-result.json'), `${JSON.stringify(result, null, 2)}\n`);
      workflowState.status = result.status;
      workflowState.phase = 'STOPPED_BY_MANAGER';
      workflowState.resultPath = path.join(directory, 'workflow-result.json');
      await persist();
      return result;
    }
    previousFeedback = managerDecision.feedback || [];
  }
  const result = { status: 'REWORK_LIMIT', taskId: task.taskId, attempts, applyOccurred: false };
  await fs.writeFile(path.join(directory, 'workflow-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  workflowState.status = result.status;
  workflowState.phase = 'REWORK_LIMIT_REACHED';
  workflowState.resultPath = path.join(directory, 'workflow-result.json');
  await persist();
  return result;
}
