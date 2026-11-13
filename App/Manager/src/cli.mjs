import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Orchestrator, runDryWorkflow } from './orchestrator.mjs';
import { runSafeAuditWorkflow } from './safe-audit-workflow.mjs';
import { dirs, readJson, atomicJson, acquireLock } from './state-store.mjs';
import { approvalHash } from './safety-policy.mjs';
import { buildIndex } from './project-reader.mjs';
import { runMvpDemo } from './mvp-demo.mjs';
import { runMvp003Demo, runMvp003ReworkProbe } from './mvp003-demo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'manager.config.json'), 'utf8'));
const cmd = process.argv[2] || 'status';
const log = value => console.log(`[${new Date().toLocaleTimeString('vi-VN')}] ${value}`);

if (cmd === 'index') {
  const result = await buildIndex(config.docsRoot, config.projectRoot, path.join(root, 'PROJECT_INDEX.md'));
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'status') {
  const d = dirs(root);
  const state = await readJson(path.join(d.state, 'PROJECT_STATE.json'), { status: 'NOT_INITIALIZED', acceptedTasks: [], blockers: [], approvalRequests: [], history: [] });
  const queue = await readJson(path.join(d.state, 'TASK_QUEUE.json'), []);
  const task = queue.find(item => item.taskId === state.currentTaskId);
  const next = queue.filter(item => ['PENDING', 'READY', 'REWORK'].includes(item.status) && item.dependencies.every(id => queue.find(q => q.taskId === id)?.status === 'PASS')).sort((a, b) => a.priority.localeCompare(b.priority) || a.taskId.localeCompare(b.taskId))[0];
  console.log(`Manager: ${state.status}\nPhase: ${state.phase || '—'}\nTask: ${task?.taskId || '—'} ${task?.title || ''}\nĐang làm: ${state.activeProcess?.role === 'developer' ? 'Developer đang lập báo cáo' : state.activeProcess?.role === 'manager' ? 'Manager đang chọn/review task' : 'không có AI process'}\nKết quả gần nhất: ${state.lastDecision?.decision || state.history?.at(-1)?.decision || state.history?.at(-1)?.kind || state.status}\nĐã PASS: ${(state.acceptedTasks || []).join(', ') || 'chưa có'}\nTask tiếp theo: ${next ? `${next.taskId} ${next.title}` : 'không có task sẵn sàng'}\nBlocker/dừng: ${(task && state.lastDecision?.feedback?.[0]) || state.blockers?.at(-1) || state.lastSession?.reason || state.lastDecision?.feedback?.[0] || '—'}\nApproval: ${state.approvalRequests?.at(-1)?.reason || '—'}`);
} else if (cmd === 'stop') {
  await fs.mkdir(path.join(root, 'state'), { recursive: true });
  await fs.writeFile(path.join(root, 'state', 'STOP'), 'stop requested\n');
  log('Đã gửi yêu cầu dừng an toàn; phiên hiện tại sẽ dừng sau khi hoàn tất inference đang chạy.');
} else if (cmd === 'approve') {
  const taskId = process.argv[3], reason = process.argv.slice(4).join(' ').trim();
  if (!/^HC-\d{3,}$/.test(taskId || '') || reason.length < 8) { console.error('Dùng: node src/cli.mjs approve HC-001 "lý do/phạm vi owner duyệt"'); process.exitCode = 2; }
  else {
    const release = await acquireLock(root);
    try {
      const d = dirs(root), state = await readJson(path.join(d.state, 'PROJECT_STATE.json'), null), queue = await readJson(path.join(d.state, 'TASK_QUEUE.json'), []), task = queue.find(item => item.taskId === taskId);
      if (!task || task.status !== 'NEEDS_APPROVAL' || !state?.approvalRequests?.some(item => item.taskId === taskId)) throw Error('Task không có yêu cầu approval đang chờ.');
      const approval = { taskId, taskHash: approvalHash(task), reason, approvedAt: new Date().toISOString(), approvalSource: 'explicit-owner-cli' };
      state.approvals = [...(state.approvals || []), approval]; state.approvalRequests = state.approvalRequests.map(item => item.taskId === taskId ? { ...item, resolvedAt: approval.approvedAt, approvalHash: approval.taskHash } : item); task.status = 'READY'; state.history.push({ taskId, kind: 'OWNER_APPROVED', at: approval.approvedAt, reason, taskHash: approval.taskHash });
      await atomicJson(path.join(d.state, 'PROJECT_STATE.json'), state); await atomicJson(path.join(d.state, 'TASK_QUEUE.json'), queue); log(`Owner approval được lưu cho ${taskId}.`);
    } finally { await release(); }
  }
} else if (cmd === 'dry-run') {
  try { const result = await runDryWorkflow(config, log); console.log(JSON.stringify(result, null, 2)); if (result.status !== 'DRY_RUN_PASS') process.exitCode = 1; }
  catch (error) { console.error(`DRY RUN FAILED: ${error.message}`); process.exitCode = 1; }
} else if (cmd === 'mvp-demo') {
  try { console.log(JSON.stringify(await runMvpDemo({ config, logger: log }), null, 2)); } catch (error) { console.error(`MVP DEMO BLOCKED: ${error.message}`); if (error.reportFile) console.error(`Report: ${error.reportFile}`); process.exitCode = 1; }
} else if (cmd === 'mvp003-demo' || cmd === 'mvp003-rework') {
  try { const result = cmd === 'mvp003-demo' ? await runMvp003Demo({ config, logger: log }) : await runMvp003ReworkProbe({ config, logger: log }); console.log(JSON.stringify(result, null, 2)); if (result.status !== (cmd === 'mvp003-demo' ? 'DEMO_PASS' : 'REWORK_PASS')) process.exitCode = 1; }
  catch (error) { console.error(`${cmd.toUpperCase()} BLOCKED: ${error.message}`); if (error.reportRoot) console.error(`Reports: ${error.reportRoot}`); process.exitCode = 1; }
} else if (['start', 'run', 'resume'].includes(cmd)) {
  const maxArg = process.argv.find(value => value.startsWith('--max-tasks='));
  const candidate = maxArg ? Number(maxArg.slice('--max-tasks='.length)) : 10;
  const maxTasks = Number.isInteger(candidate) && candidate > 0 && candidate <= 50 ? candidate : 10;
  const cycleArg = process.argv.find(value => value.startsWith('--max-cycles='));
  const cycleCandidate = cycleArg ? Number(cycleArg.slice('--max-cycles='.length)) : null;
  const maxCycles = Number.isInteger(cycleCandidate) && cycleCandidate > 0 && cycleCandidate <= 40 ? cycleCandidate : null;
  try {
    const result = await runSafeAuditWorkflow({ config, root, logger: log, maxTasks, maxCycles, resume: cmd === 'resume' });
    log(`Kết thúc: ${result.status}`);
    if (['BLOCKED', 'INTERRUPTED', 'NEEDS_APPROVAL'].includes(result.status)) process.exitCode = 1;
  } catch (error) { log(`DỪNG AN TOÀN: ${error.message}`); process.exitCode = 1; }
} else if (cmd === 'smoke') {
  try { const result = await new Orchestrator({ config, root, logger: log }).run({ smoke: true }); log(`Kết thúc: ${result.status}`); }
  catch (error) { log(`DỪNG AN TOÀN: ${error.message}`); process.exitCode = 1; }
} else {
  console.log('Lệnh: start/run [--max-tasks=N] | resume [--max-tasks=N] | status | stop | approve HC-001 "reason" | dry-run | index | smoke'); process.exitCode = 2;
}
