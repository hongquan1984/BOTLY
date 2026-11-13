import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ensureLayout, dirs, readJson, atomicJson, acquireLock } from './state-store.mjs';
import { buildIndex, relevantContext, readAuditEvidence, verifyAuditEvidenceUnchanged, hashTaskRequirements, affectedTasksByChangedSources } from './project-reader.mjs';
import { readyCandidates } from './task-planner.mjs';
import { runCodex } from './developer-adapter.mjs';
import { validResult, validDecision } from './report-reader.mjs';
import { checkTask, checkReport } from './safety-policy.mjs';
import { verify } from './evidence-verifier.mjs';
import { reviewResult } from './acceptance-reviewer.mjs';

const now = () => new Date().toISOString();
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const safeId = value => { if (!/^[A-Z0-9-]{3,40}$/.test(value)) throw new Error('Unsafe task id for agent workspace.'); return value; };

export function reconcileDocumentDrift(queue, docsRoot, projectRoot, changedSources, approvedSnapshot) {
  const changed = [...new Set(changedSources)];
  const affectedTasks = changed.length ? affectedTasksByChangedSources(queue, docsRoot, projectRoot, changed) : [];
  const currentStateChanged = changed.some(file => file.replaceAll('\\', '/').toLowerCase() === 'app/current_state.md');
  const blockedTaskIds = currentStateChanged
    ? queue.filter(task => ['PENDING', 'READY', 'REWORK'].includes(task.status)
      && (task.sourceRequirements || []).some(file => file.replaceAll('\\', '/').toLowerCase() === 'current_state.md')
      && !approvedSnapshot?.approvedTaskIds?.includes(task.taskId)).map(task => task.taskId)
    : [];
  return { changedSources: changed, affectedTasks, blockedTaskIds };
}

export function normalizeAuditEvidence(result, manifest) {
  const normalized = { ...result };
  const rawEvidence = [...result.evidence];
  normalized.auditFindings = rawEvidence;
  normalized.evidence = [...new Set(manifest.filter(item => rawEvidence.some(line => line.includes(item.path))).map(item => item.path))];
  return normalized;
}

async function nextAttemptNumber(root, taskId) {
  const dir = path.join(root, 'reports', taskId);
  let names = [];
  try { names = await fs.readdir(dir); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const prior = names.map(name => /^attempt-(\d+)$/.exec(name)).filter(Boolean).map(match => Number(match[1]));
  return Math.max(0, ...prior) + 1;
}

async function verifyPinnedTaskInputs(managerRoot, projectRoot, manifest, approvedSnapshot, liveWatchDocuments) {
  const checked = manifest.filter(file => file.path !== approvedSnapshot?.projectRelativePath);
  const base = await verifyAuditEvidenceUnchanged(projectRoot, checked);
  const changed = [...base.changed];
  try { if (!approvedSnapshot || sha(await fs.readFile(path.resolve(managerRoot, approvedSnapshot.snapshotFile))) !== approvedSnapshot.sha256) changed.push('Manager-approved snapshot integrity'); }
  catch { changed.push('Manager-approved snapshot integrity'); }
  for (const file of liveWatchDocuments) {
    try {
      const abs = path.resolve(projectRoot, file.path), st = await fs.stat(abs), current = sha(await fs.readFile(abs));
      if (current !== file.sha256 || (file.modifiedAt && st.mtime.toISOString() !== file.modifiedAt)) changed.push(file.path);
    } catch { changed.push(file.path); }
  }
  return { ok: changed.length === 0, changed: [...new Set(changed)] };
}

export async function runSafeAuditWorkflow({ config, root, logger = console.log, maxTasks = 10, maxCycles = null, resume = false, codex = runCodex }) {
  await ensureLayout(root);
  const release = await acquireLock(root);
  try {
    const d = dirs(root), stateFile = path.join(d.state, 'PROJECT_STATE.json'), queueFile = path.join(d.state, 'TASK_QUEUE.json');
    const state = await readJson(stateFile, { status: 'INITIALIZING', phase: 'PROJECT_AUDIT', cycle: 0, acceptedTasks: [], blockers: [], approvalRequests: [], history: [], models: {} });
    let queue = await readJson(queueFile, null);
    if (!Array.isArray(queue) || queue.length === 0) throw new Error('TASK_QUEUE.json is missing or empty; refusing to reconstruct/replace owner queue.');
    let approvedSnapshot = null;
    const approvalPath = path.join(root, 'state', 'approved-source-snapshot.json');
    const approval = await readJson(approvalPath, null);
    if (approval) {
      const snapshotPath = path.resolve(root, approval.snapshotFile || '');
      if (!snapshotPath.startsWith(path.resolve(root) + path.sep)) throw new Error('Approved source snapshot path escaped Manager root.');
      const snapshotStat = await fs.lstat(snapshotPath);
      if (snapshotStat.isSymbolicLink() || !snapshotStat.isFile()) throw new Error('Approved source snapshot is not a regular Manager-owned file.');
      const snapshotBytes = await fs.readFile(snapshotPath);
      if (sha(snapshotBytes) !== approval.sha256 || approval.projectRelativePath !== 'App/CURRENT_STATE.md' || !Array.isArray(approval.approvedTaskIds)) throw new Error('Approved source snapshot integrity/schema check failed.');
      approvedSnapshot = { ...approval, content: snapshotBytes.toString('utf8') };
    }
    const indexPath = path.join(root, 'PROJECT_INDEX.md');
    try { await fs.access(indexPath); } catch (error) { if (error.code !== 'ENOENT') throw error; await buildIndex(config.docsRoot, config.projectRoot, indexPath); }
    if (state.activeProcess?.pid) {
      try { process.kill(state.activeProcess.pid, 0); state.status = 'INTERRUPTED'; state.blockers = [...(state.blockers || []), `Child process ${state.activeProcess.pid} is still alive; no parallel run started.`]; await atomicJson(stateFile, state); return state; }
      catch (e) { if (e.code !== 'ESRCH') { state.status = 'INTERRUPTED'; state.blockers = [...(state.blockers || []), 'Could not verify previous child process; refusing replay.']; await atomicJson(stateFile, state); return state; } }
    }
    if (state.activeAttempt) {
      const task = queue.find(item => item.taskId === state.activeAttempt.taskId);
      if (task) task.status = 'INTERRUPTED';
      state.status = 'INTERRUPTED';
      state.blockers = [...(state.blockers || []), `Previous ${state.activeAttempt.taskId} attempt has no terminal reconciliation; inspect its report before resume.`];
      state.activeAttempt.reconciled = 'INTERRUPTED'; state.activeAttempt = null; state.activeProcess = null;
      await atomicJson(stateFile, state); await atomicJson(queueFile, queue); return state;
    }
    const staleAccepted = [], changedSources = new Set();
    for (const accepted of queue.filter(item => item.status === 'PASS')) {
      const history = [...(state.history || [])].reverse().find(item => item.taskId === accepted.taskId && item.decision === 'PASS' && item.evidenceManifest);
      if (!history?.evidenceManifest) continue;
      const manifest = await readJson(history.evidenceManifest, null);
      if (!manifest?.files) { state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Accepted task ${accepted.taskId} has no readable evidence manifest; reconcile before continuing.`]; await atomicJson(stateFile, state); return state; }
      const stable = await verifyAuditEvidenceUnchanged(config.projectRoot, manifest.files);
      if (!stable.ok) { staleAccepted.push({ taskId: accepted.taskId, manifest: history.evidenceManifest, changed: stable.changed }); for (const file of stable.changed) changedSources.add(file); }
    }
    const drift = reconcileDocumentDrift(queue, config.docsRoot, config.projectRoot, [...changedSources], approvedSnapshot);
    const driftBlockedTaskIds = new Set(drift.blockedTaskIds);
    if (staleAccepted.length) {
      const historicalPassIds = queue.filter(task => task.status === 'PASS').map(task => task.taskId);
      state.staleEvidence = { ...(state.staleEvidence || {}), historicalAcceptedTasks: staleAccepted, changedSources: drift.changedSources, affectedTasks: drift.affectedTasks, affectedAcceptedTasks: drift.affectedTasks.filter(id => historicalPassIds.includes(id)), affectedPendingTasks: drift.affectedTasks.filter(id => !historicalPassIds.includes(id)), detectedAt: now(), policy: 'Historical PASS and original manifests are preserved. New audit tasks snapshot stable inputs at task start. CURRENT_STATE is never refreshed automatically; only the exact Owner-approved snapshot is used, and tasks without applicable approval remain held.' };
      if (approvedSnapshot && drift.changedSources.some(file => file.replaceAll('\\', '/').toLowerCase() === approvedSnapshot.projectRelativePath.replaceAll('\\', '/').toLowerCase())) state.sourceDriftResolution = { ownerAuthorization: approvalPath, path: approvedSnapshot.projectRelativePath, sha256: approvedSnapshot.sha256, appliesToTaskIds: approvedSnapshot.approvedTaskIds, historicalAcceptedStatusesPreserved: true, resolvedForContinuationAt: now() };
      if (driftBlockedTaskIds.size) state.blockers = [...(state.blockers || []).filter(item => !String(item).startsWith('Unapproved CURRENT_STATE version affects tasks:')), `Unapproved CURRENT_STATE version affects tasks: ${[...driftBlockedTaskIds].join(', ')}`];
    }
    const stopFile = path.join(root, 'state', 'STOP');
    const runId = `${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`;
    const runRoot = path.join(root, 'workspaces', 'agent-runs', runId);
    const beforeAccepted = new Set(state.acceptedTasks || []);
    state.models = { manager: config.manager.model, developer: config.developer.model };

    const save = async () => { state.updatedAt = now(); await atomicJson(stateFile, state); await atomicJson(queueFile, queue); };
    const callAI = async ({ role, taskId, attempt, prompt, runDir }) => {
      const workDir = path.join(runRoot, safeId(taskId || 'PLANNING'), role, `attempt-${attempt || 1}`);
      await fs.mkdir(workDir, { recursive: true });
      const roleConfig = { ...config[role], sandbox: 'read-only' };
      state.activeProcess = { role, taskId: taskId || null, startedAt: now(), pid: null, structuredOnly: true, cwd: workDir };
      await save();
      try {
        const response = await codex({ config: { ...config, [role]: roleConfig }, role, prompt, root: workDir, runDir, timeoutMs: config.limits.timeoutMinutes * 60000, logger,
          ephemeral: true, structuredOnly: true,
          onSpawn: async pid => { state.activeProcess = { ...state.activeProcess, pid }; await save(); }
        });
        return response;
      } finally { state.activeProcess = null; await save(); }
    };

    logger(`Manager: chạy workflow AI structured-only; tối đa ${maxTasks} task PASS trong phiên.`);
    const cycleLimit = Number.isInteger(maxCycles) && maxCycles > 0 && maxCycles <= 40 ? maxCycles : config.limits.maxCyclesPerSession;
    let cycles = 0, acceptedThisRun = 0;
    while (cycles < cycleLimit && acceptedThisRun < maxTasks) {
      if (await fs.access(stopFile).then(() => true, () => false)) { await fs.rm(stopFile, { force: true }); state.status = 'PAUSED'; state.currentTaskId = null; state.activeAttempt = null; await save(); logger('Đã nhận yêu cầu STOP; state được lưu.'); return state; }
      const candidates = readyCandidates(queue).filter(task => !driftBlockedTaskIds.has(task.taskId));
      if (!candidates.length) { state.status = staleAccepted.length ? 'BLOCKED' : queue.some(t => t.status === 'NEEDS_APPROVAL') ? 'NEEDS_APPROVAL' : queue.some(t => t.status === 'BLOCKED') ? 'BLOCKED' : 'PAUSED_NO_READY_TASK'; state.currentTaskId = null; await save(); logger(staleAccepted.length ? `Dừng: source drift ảnh hưởng task sẵn sàng: ${[...driftBlockedTaskIds].join(', ')}.` : `Dừng: ${state.status}; không có task sẵn sàng.`); return state; }
      const selectionDir = path.join(root, 'reports', 'planning', runId, `select-${cycles + 1}`);
      const selection = await callAI({ role: 'manager', taskId: candidates[0].taskId, attempt: cycles + 1, runDir: selectionDir,
        prompt: `Select exactly the first highest-priority ready task provided below. This is an audit-only run. Return schema-valid SELECT_TASK with the exact task object and taskId. Do not change queue data or invent a task.\nREADY TASKS:\n${JSON.stringify(candidates)}` });
      if (!validDecision(selection.data) || selection.data.decision !== 'SELECT_TASK' || selection.data.taskId !== candidates[0].taskId || selection.data.nextTask?.taskId !== candidates[0].taskId) {
        state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Manager task selection was invalid or did not select priority task ${candidates[0].taskId}.`]; await save(); logger('BLOCKED: task selection was not valid.'); return state;
      }
      const task = queue.find(item => item.taskId === selection.data.taskId);
      const policy = checkTask(task, state.approvals || []);
      if (!policy.ok) { task.status = 'NEEDS_APPROVAL'; state.status = 'NEEDS_APPROVAL'; state.approvalRequests = [...(state.approvalRequests || []), { taskId: task.taskId, reason: policy.reason, createdAt: now() }]; await save(); return state; }
      const auditOnly = task.acceptanceCriteria.some(value => /no product files changed/i.test(value));
      if (!auditOnly) { task.status = 'NEEDS_APPROVAL'; state.status = 'NEEDS_APPROVAL'; state.approvalRequests = [...(state.approvalRequests || []), { taskId: task.taskId, reason: 'Safe structured audit reader is not configured for this task; code task patch workflow is not enabled in this run.', createdAt: now() }]; await save(); return state; }
      cycles++; const attempt = await nextAttemptNumber(root, task.taskId);
      const reportDir = path.join(root, 'reports', task.taskId, `attempt-${attempt}`);
      await fs.mkdir(reportDir, { recursive: true });
      let source, docsBefore, docsAfter;
      try { source = await readAuditEvidence(config.projectRoot, task.taskId); docsBefore = await hashTaskRequirements(config.docsRoot, config.projectRoot, task.sourceRequirements); }
      catch (error) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Trusted reader failed closed for ${task.taskId}: ${error.message}`]; await save(); return state; }
      const overrides = {};
      if (approvedSnapshot?.approvedTaskIds.includes(task.taskId)) {
        const expectedDoc = docsBefore.find(file => file.path === approvedSnapshot.projectRelativePath);
        if (!expectedDoc) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Owner-approved CURRENT_STATE snapshot is missing from the requirements for ${task.taskId}.`]; await save(); return state; }
        const rel = path.relative(config.docsRoot, path.resolve(config.projectRoot, approvedSnapshot.projectRelativePath)).replaceAll('\\', '/');
        overrides[rel] = approvedSnapshot.content;
      }
      const specs = await relevantContext(task, config.docsRoot, { overrides });
      try { docsAfter = await hashTaskRequirements(config.docsRoot, config.projectRoot, task.sourceRequirements); }
      catch (error) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Requirement snapshot failed closed for ${task.taskId}: ${error.message}`]; await save(); return state; }
      if (JSON.stringify(docsBefore) !== JSON.stringify(docsAfter)) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Requirement documents changed while preparing ${task.taskId}; no AI task was launched.`]; await save(); return state; }
      let reviewedDocuments = docsAfter;
      const liveWatchDocuments = docsAfter.map(({ path: filePath, sha256, modifiedAt }) => ({ path: filePath, sha256, modifiedAt }));
      const sourceByPath = new Map(source.manifest.map(file => [file.path, file.sha256]));
      if (approvedSnapshot?.approvedTaskIds.includes(task.taskId)) {
        const currentDoc = docsAfter.find(file => file.path === approvedSnapshot.projectRelativePath);
        if (!currentDoc) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Approved CURRENT_STATE snapshot is not part of ${task.taskId} requirements.`]; await save(); return state; }
        const pinned = { ...currentDoc, sha256: approvedSnapshot.sha256, bytes: approvedSnapshot.bytes, modifiedAt: approvedSnapshot.sourceMtimeUtc, snapshotFile: approvedSnapshot.snapshotFile };
        reviewedDocuments = docsAfter.map(file => file.path === approvedSnapshot.projectRelativePath ? pinned : file);
      }
      const inconsistent = reviewedDocuments.filter(file => sourceByPath.has(file.path) && sourceByPath.get(file.path) !== file.sha256).map(file => file.path);
      if (inconsistent.length) { task.status = 'BLOCKED'; state.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), `Trusted source and requirements snapshots disagree for ${task.taskId}: ${inconsistent.join(', ')}`]; await save(); return state; }
      const allManifest = [...new Map([...source.manifest, ...reviewedDocuments].map(file => [file.path, file])).values()];
      const evidenceInput = source.files.map(file => `\n\n===== ${file.path} | SHA-256 ${file.sha256} | ${file.bytes} bytes =====\n${file.content}`).join('');
      const manifestPath = path.join(reportDir, 'trusted-evidence-manifest.json');
      await fs.writeFile(path.join(reportDir, 'reviewed-requirements.md'), `<!-- Captured excerpts; original documents remain authoritative. -->\n${specs}\n`, 'utf8');
      await atomicJson(manifestPath, { taskId: task.taskId, createdAt: now(), sourceRoot: config.projectRoot, files: allManifest, documents: reviewedDocuments, liveWatchDocuments, ownerApprovedSnapshots: approvedSnapshot?.approvedTaskIds.includes(task.taskId) ? [{ path: approvedSnapshot.projectRelativePath, sha256: approvedSnapshot.sha256, snapshotFile: approvedSnapshot.snapshotFile }] : [], reviewedContextFile: path.join(reportDir, 'reviewed-requirements.md'), totalBytes: source.totalBytes });
      task.status = 'IN_PROGRESS'; state.status = 'RUNNING'; state.phase = 'AI_MANAGER_DEVELOPER_REVIEW'; state.currentTaskId = task.taskId; state.cycle = (state.cycle || 0) + 1;
      state.activeAttempt = { taskId: task.taskId, attempt, startedAt: now(), runDir: reportDir, pid: null, evidenceManifest: manifestPath, mode: 'read-only-audit' };
      await save(); logger(`Task ${task.taskId}: ${task.title}`); logger('Developer: đang đọc source/test được cấp qua trusted project reader (không có tools, không ghi file).');
      try {
        const priorFeedback = JSON.stringify(task.previousReviewFeedback || []);
        const developerPrompt = `You are the Codex Developer doing a factual, read-only audit for ${task.taskId}, attempt ${attempt}. You have no tools. Do not infer or claim that you inspected any file not supplied below. Do not edit files, run commands, use network/provider calls, or treat fixtures as live integration. CURRENT_STATE is an owner-authored progress document, not proof: corroborate its claims against supplied code/tests/artifacts or label them report-only/unverified. Return only the required JSON schema. Cite only exact repository-relative paths listed in the evidence manifest; changedFiles must be [], tests must be [] unless actual test execution evidence is supplied (none is supplied). State unknowns explicitly.\nTASK: ${JSON.stringify(task)}\nPREVIOUS REVIEW FEEDBACK: ${priorFeedback}\nTRUSTED EVIDENCE MANIFEST: ${JSON.stringify(allManifest)}\nAPPROVED SPECIFICATION EXCERPTS:\n${specs}\nTRUSTED SOURCE AND EXISTING TEST/REPORT CONTENT (each block has path and SHA-256):${evidenceInput}`;
        const dev = await callAI({ role: 'developer', taskId: task.taskId, attempt, prompt: developerPrompt, runDir: reportDir });
        const result = dev.data;
        if (!validResult(result) || result.taskId !== task.taskId || result.attempt !== attempt) throw new Error('Developer report schema/task/attempt validation failed.');
        if (result.status === 'READY_FOR_REVIEW' && result.changedFiles.length !== 0) throw new Error('Audit Developer reported changed files; refusing review.');
        // Audit prose sometimes embeds a citation plus its finding in one schema string. Split
        // those claims from evidence paths so deterministic verification checks actual files.
        const normalizedResult = normalizeAuditEvidence(result, allManifest);
        Object.assign(result, normalizedResult);
        const reportPath = path.join(reportDir, 'developer-result.json'); await atomicJson(reportPath, result);
        state.lastDeveloperResult = result; task.status = 'UNDER_REVIEW'; await save();
        const evidence = await verify(task, result, config.projectRoot);
        const independent = approvedSnapshot?.approvedTaskIds.includes(task.taskId) ? await verifyPinnedTaskInputs(root, config.projectRoot, allManifest, approvedSnapshot, liveWatchDocuments) : await verifyAuditEvidenceUnchanged(config.projectRoot, allManifest);
        if (!independent.ok) throw new Error(`Source changed during task; fail closed: ${independent.changed.join(', ')}`);
        const reviewPrompt = `You are the independent Manager reviewer. Evaluate audit quality, not whether HealthClues features are complete. Base every finding only on the approved requirements, trusted source/test/report excerpts, actual trusted-reader manifest and Developer report. CURRENT_STATE is an owner-authored progress document, not proof: cross-check claims against the supplied code/tests/artifacts; mark unsupported claims report-only or UNVERIFIED. A task can PASS while its findings say the product criterion is incomplete; PASS means the audit is evidence-backed, scoped and candid. Dimensions describe the audited product state; UNVERIFIED is a valid and often correct audit finding. Do not claim product UI visual PASS without screenshots (none are provided). Do not claim tests were executed; source/test contents are inspection evidence only. Check for unsupported claims, omitted relevant evidence, fixture-vs-real distinctions, missing artifacts, conflicts and source drift. If audit is sufficient return PASS; if specific evidence gaps can be repaired return REWORK with exact file paths/criteria; if blocked by an external or safety issue return BLOCKED. The normalized evidence array contains only exact manifest paths; auditFindings preserves the Developer's original citation statements.\nTASK: ${JSON.stringify(task)}\nDEVELOPER RESULT: ${JSON.stringify(result)}\nAUTOMATED EVIDENCE CHECK: ${JSON.stringify(evidence)}\nTRUSTED SOURCE MANIFEST: ${JSON.stringify(allManifest)}\nSOURCE/TEST/REPORT CONTENT:\n${evidenceInput}\nSPECIFICATIONS:\n${specs}\nReturn exactly the decision schema.`;
        logger('Manager: đang review độc lập report, đường dẫn evidence, source/test và hash manifest.');
        const mgr = await callAI({ role: 'manager', taskId: task.taskId, attempt, prompt: reviewPrompt, runDir: reportDir });
        const independentAfter = approvedSnapshot?.approvedTaskIds.includes(task.taskId) ? await verifyPinnedTaskInputs(root, config.projectRoot, allManifest, approvedSnapshot, liveWatchDocuments) : await verifyAuditEvidenceUnchanged(config.projectRoot, allManifest);
        if (!independentAfter.ok) throw new Error(`Source changed during Manager review; fail closed: ${independentAfter.changed.join(', ')}`);
        const decision = validDecision(mgr.data) && mgr.data.taskId === task.taskId ? reviewResult(task, result, evidence, mgr.data) : { decision: 'REWORK', taskId: task.taskId, reasoning: 'Invalid Manager review schema.', feedback: ['Manager review schema/task validation failed.'], dimensions: { functional: 'UNVERIFIED' } };
        await atomicJson(path.join(reportDir, 'manager-decision.json'), { ...decision, reviewedAt: now(), sourceManifestSha256: sha(JSON.stringify(allManifest)), developerReportSha256: sha(JSON.stringify(result)), independentSourceCheck: independentAfter });
        if (decision.decision === 'PASS') { task.status = 'PASS'; if (!(state.acceptedTasks || []).includes(task.taskId)) state.acceptedTasks = [...(state.acceptedTasks || []), task.taskId]; acceptedThisRun++; }
        else if (decision.decision === 'BLOCKED') { task.status = 'BLOCKED'; state.blockers = [...(state.blockers || []), ...(decision.feedback || [])]; }
        else if (decision.decision === 'NEEDS_APPROVAL') { task.status = 'NEEDS_APPROVAL'; state.approvalRequests = [...(state.approvalRequests || []), { taskId: task.taskId, reason: decision.approvalRequest || decision.reasoning, createdAt: now() }]; }
        else { task.retryCount++; task.previousReviewFeedback = decision.feedback || []; task.status = task.retryCount >= config.limits.maxReworkAttempts ? 'BLOCKED' : 'REWORK'; if (task.status === 'BLOCKED') state.blockers = [...(state.blockers || []), `Maximum rework attempts reached for ${task.taskId}.`]; }
        state.lastDecision = decision; state.history = [...(state.history || []), { taskId: task.taskId, attempt, decision: decision.decision, at: now(), developerReport: reportPath, managerReview: path.join(reportDir, 'manager-decision.json'), evidenceManifest: manifestPath }];
        state.activeAttempt = null; state.activeProcess = null; state.currentTaskId = null; state.status = task.status === 'PASS' ? 'RUNNING' : task.status; await save();
        logger(`${task.taskId}: ${decision.decision}${decision.feedback?.length ? ` — ${decision.feedback.join('; ')}` : ''}`);
        if (['BLOCKED', 'NEEDS_APPROVAL'].includes(task.status)) return state;
      } catch (error) {
        task.status = 'INTERRUPTED'; state.activeAttempt = null; state.activeProcess = null; state.currentTaskId = null; state.status = 'INTERRUPTED'; state.blockers = [...(state.blockers || []), `${task.taskId} attempt ${attempt}: ${error.message}`]; await save(); logger(`INTERRUPTED: ${error.message}`); return state;
      }
    }
    const next = readyCandidates(queue)[0] || null;
    state.status = acceptedThisRun >= maxTasks ? 'PAUSED_LIMIT' : 'PAUSED_LIMIT'; state.currentTaskId = null; state.activeAttempt = null;
    state.lastSession = { runId, acceptedThisRun, maxTasks, maxCycles: cycleLimit, acceptedAtStart: [...beforeAccepted], nextTask: next?.taskId || null, stoppedAt: now(), reason: acceptedThisRun >= maxTasks ? 'SESSION_TASK_LIMIT' : 'SESSION_CYCLE_LIMIT' };
    await save(); logger(`Phiên dừng an toàn: ${state.lastSession.reason}. Task tiếp theo: ${next?.taskId || 'không có'}.`); return state;
  } finally { await release(); }
}
