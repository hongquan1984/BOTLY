# HealthClues Local AI Manager

## Current safe audit runner (MVP-004)

Use `npm run manager:start` for the real AI audit queue, `npm run manager:status` to inspect progress, `npm run manager:stop` to request a graceful stop, and `npm run manager:resume` to continue after a clean pause. On this PowerShell machine use `npm.cmd run ...` because PowerShell blocks the `npm.ps1` shim under the current execution policy; the `.bat` launcher runs through Windows command processing. `START_MANAGER.bat` starts the same workflow. `--max-tasks=2` bounds a verification session to two accepted tasks.

The trusted reader has task-specific audit allowlists for HC-001 through HC-008. It preserves the existing task queue and will fail closed with NEEDS_APPROVAL on code-change tasks until the structured snapshot patch workflow is wired to the same AI loop. Developer and Manager receive only task-specific trusted-reader excerpts; both calls use `codex exec` with JSON Schema, `--ephemeral`, `--sandbox read-only`, and structured-only tool-disable flags. Their working directory is a per-call scratch directory under `Manager/workspaces/agent-runs/`; neither AI receives shell, browser, computer, MCP, or project filesystem tools. This is a procedural tool boundary, not a general OS-level Windows sandbox claim. The trusted runner hashes each supplied source file before the calls and checks those hashes again before and after Manager review; a later resume also rechecks evidence manifests for already accepted tasks. No audit calls HealthClues APIs or executes HealthClues tests. Visual audits cannot pass without actual supplied screenshots being inspected; the current reader does not treat screenshot filenames as visual evidence.

Each attempt stores `developer-result.json`, `manager-output.json`, `manager-decision.json`, `trusted-evidence-manifest.json`, and CLI JSONL logs under `reports/<task>/attempt-N/`. Findings in an audit may correctly report product dimensions as UNVERIFIED while the audit task itself passes; a PASS means the audit is complete and evidence-backed, not that the product feature passed acceptance. After HC-001 PASS, the Manager selects HC-002 automatically. Queue dependencies remain authoritative, and a source drift, invalid structured response, interruption, missing evidence, or rework limit stops the run. Code tasks do not fall back to direct workspace-write execution.

This is a local Node.js orchestrator that coordinates separate Codex Manager and Developer executions. Node 24+ and the already-installed authenticated Codex CLI are required; no extra API key or orchestration dependency is used.

## Actual checkout layout

The machine layout differs from the assumed paths in the original request. The Git checkout and application source are at `D:\botly`; HealthClues requirements, status documents, reference image, reports, and the original launcher are under `D:\botly\App`; this Manager is `D:\botly\App\Manager`. The existing `HealthClues_start_auto.bat` changes directory to `D:\botly\App` and starts an interactive Codex UI over the parent Botly workspace. It is preserved. It is not a structured-task adapter and its working directory is not the app checkout root.

## Workflow

`PROJECT_INDEX.md` is generated from the canonical docs list and a bounded source inventory. It records SHA-256 and modification times and points back to the original documents. The index is a navigation aid only. The initial queue contains eight factual audits, not assumptions that those areas are broken; audit Developer executions are forced to the read-only sandbox. Task selection is made by the Manager from dependency-ready, schema-validated queued tasks. Developer results are JSON-schema constrained and checked against task ID/attempt, paths, required test evidence and required screenshots. Manager independently reviews the supplied evidence. Only a validated Manager PASS advances a task. When the queue is exhausted, Manager proposes the next scoped task from unfinished approved requirements; audit exhaustion cannot mark the project complete. Completion requires a passed read-only task marked `projectFinalAudit` and every queued task passed or explicitly waived.

One process holds `state/orchestrator.lock`. State writes use temp-file + rename. A restart with an active attempt marks it INTERRUPTED and preserves the run; it does not blindly replay. `state/STOP` requests a graceful stop. Rework, cycle and timeout boundaries are enforced by the orchestrator. Codex CLI does not expose a measurable spending quota here, so no spend cap is claimed; cycle, retry and timeout limits bound execution counts. Mock mode does not call Codex or modify HealthClues.

## Controls

- `START_MANAGER.bat` starts the real Manager → Developer → Manager loop.
- `STOP_MANAGER.bat` requests a graceful stop.
- `STATUS_MANAGER.bat` prints current state, queue and blocker.
- `RESUME_MANAGER.bat` resumes persisted work after interruption reconciliation.
- `DRY_RUN_MANAGER.bat` runs a full mocked Manager → Developer → Manager cycle, accepts HC-001 and HC-002, then prints all ten scenario checks. It writes only to a temporary directory and never starts Codex.
- `node src/cli.mjs smoke` runs the bounded real Codex smoke test in read-only mode.
- `npm.cmd test` runs orchestration unit/integration tests on this Windows PowerShell setup.

Review `state/PROJECT_STATE.json`, `state/TASK_QUEUE.json`, `reports/`, and `logs/` to inspect outcomes. The initial task queue is discovery-only and should not start broad product implementation until the baseline findings are reviewed. Current uncommitted Botly changes are preserved.

## Model settings and Codex integration

`manager.config.json` independently configures Manager and Developer models, reasoning effort, and sandbox mode. Defaults are `gpt-6.1-sol` / high for Manager and `gpt-6.1-sol` / medium for Developer; these are requested settings, not verified availability claims. Change each independently after confirming support. The CLI was observed as Codex CLI 0.166.0. The adapter uses supported `codex exec --json --output-schema ... --output-last-message ... --model ... --sandbox ... --cd ... -` flags and feeds prompts on stdin. It never uses `--yolo`, danger-full-access, or an extra paid API.

The adapter invokes the installed Codex JavaScript entry point through Node directly, without a shell. The installed `codex exec --help` does not support the root CLI `--ask-for-approval` flag, so the adapter uses only flags verified for `exec`; sandbox remains read-only for the smoke and workspace-write for authorized implementation tasks. The real smoke uses read-only sandbox for both roles, no HealthClues changes, and a harmless source metadata task. A successful smoke proves the installed CLI can execute structured requests and return a schema-shaped response; it does not prove HealthClues functionality. The running Codex account was authenticated via ChatGPT at inspection time. No credential is read or logged.

## Permissions and recovery

The developer sandbox configuration can be set to `workspace-write` for authorized tasks. The orchestrator starts a Developer in the common directory of its allowlisted scopes and validates changed paths against those scopes. Broad scopes that resolve to the checkout root require explicit owner approval. Codex workspace sandbox provides directory-level write access, not an exact per-file Windows ACL; a noncompliant child could write elsewhere under the granted directory. Keep implementation tasks narrow and review every run. Restricted operations require a hash-bound owner approval record. Do not edit secrets, use production data, deploy, commit or push. Approval requests are recorded in state; approval is not inferred from a report. After reviewing the exact task and its scope, an owner can approve a queued approval-gated task with `node src/cli.mjs approve HC-001 "specific approved scope and reason"`. Approval is bound to a SHA-256 hash of the task's objective, requirements, scope, and acceptance criteria; editing those fields invalidates the approval.

If a run exits unexpectedly, inspect the specific `reports/<task>/attempt-N` logs and `activeAttempt`. Start `RESUME_MANAGER.bat`; an unreconciled active task is marked INTERRUPTED and the system stops safely. Resolve whether its work completed before changing status/retrying. Never delete state to restart. If the lock remains, verify its PID is gone before manually removing `state/orchestrator.lock`.

The existing launcher is interactive and lacks structured input/output and a task result contract, so it is not reused or modified. The noninteractive adapter is separate and does not recursively launch the Manager.

## MVP-002 source snapshot workflow

`src/workspace-snapshot.mjs` copies only an explicit per-task file allowlist into a fresh workspace. Every file needs an Owner-captured SHA-256 baseline; the manifest records path, hash, byte count, and tracked/untracked status. Secrets, environment files, credential directories/files, symlinks, junctions, unexpected workspace files, and path traversal are rejected. The original source is rechecked before and after task review. `src/snapshot-workflow.mjs` applies structured patches only inside that snapshot and runs fixed test paths in a disposable `node:24-bookworm-slim` container with no network, no Docker socket, a read-only mount/root, non-root UID, dropped capabilities, and resource limits.

`src/apply-gate.mjs` creates a hash-bound `VERIFIED_READY_TO_APPLY` plan and, only when called by the trusted runner with explicit Owner approval tied to that plan digest, can apply its strict allowlisted modified/added/deleted files. It rechecks the source baseline and snapshot, rejects symlinks/junctions and unexpected diffs, writes verified byte backups plus a recovery manifest, stages replacements and verifies postimages. Interrupted transactions can be rolled back only when each current file still matches the recorded postimage; concurrent independent edits are preserved and reported as conflicts. Fixture tests cover apply, add/delete, backup, interruption/recovery, checksum drift, Manager rejection and allowlist rejection. No HealthClues file has been applied by this gate. A real first application still requires explicit Owner approval of the exact plan.

The Windows Codex CLI still runs as a host process. `--sandbox read-only` and disabled tool feature flags are not treated as an OS-level filesystem boundary. A synthetic negative-write test with Codex CLI 0.166.0's Windows `elevated` sandbox wrapper and `:workspace` profile wrote to a protected probe outside the assigned workspace. The one-command MXC compatibility probe reported native MXC unavailable in this executor. Developer isolation is therefore NOT VERIFIED; do not use this host process against HealthClues source until an outside-write denial test passes. HC-PILOT-001 remains blocked pending Owner confirmation of its mismatched test-file baseline.

## MVP-003 real-AI synthetic integration

`npm run mvp003-demo` runs a maximum of two dependency-ordered synthetic tasks through real Manager and Developer Codex calls, the snapshot patch workflow, Docker tests, independent Manager review, and automatic next-task selection. The adapter uses `--ignore-user-config` and per-invocation `--disable` flags for shell, browser, computer, apps, plugins, code-mode host, image viewing, and skill/MCP discovery; only the minimum process environment plus `CODEX_HOME` is passed. This avoids loading user MCP/tool configuration and prevents the AI roles from invoking host shell tools in this mode. Codex still executes as a Windows process, so this is limited to synthetic task input and does not establish a general Windows filesystem sandbox boundary. No HealthClues source is mounted or provided.

`npm run mvp003-rework` is a same-task adversarial fixture: the Developer's initial brief omits an authoritative Unicode requirement; the Manager receives the full acceptance criteria and independently reviews real test evidence. It is counted as a rework verification run of HC-901, not a third task. Both commands persist AI calls, attempts, reports, diffs, Docker evidence, and state under `reports/MVP_003/` or `reports/MVP_003_REWORK/`. They are separate bounded demos and do not change the HealthClues queue or `PROJECT_STATE.json`.
# MVP tổng hợp: vòng Manager ↔ Developer

Lệnh `npm run mvp-demo` chạy hai task giả lập `HC-901` và `HC-902` trong `workspaces/mvp-demo/`. Lệnh này không đọc HealthClues source, không dùng queue/state HealthClues và không ghi vào checkout gốc.

Codex Manager/Developer chạy `codex exec` với `--sandbox read-only`, `--ephemeral` và JSON Schema. Developer chỉ trả patch có cấu trúc. Orchestrator kiểm tra task ID, allowlist chính xác, symlink/path traversal và SHA-256 trước khi thay file trong workspace tổng hợp. Test chạy trong container tạm: network tắt, root filesystem và bind mount read-only, non-root, giới hạn CPU/RAM/process, không có Docker socket. Manager nhận diff Git thực tế cùng stdout/exit code của test trước khi quyết định.

Task HC-901 cố ý có một lần REWORK fixture (đổi `Hello` thành `Hola`) để kiểm tra Manager từ chối test lỗi; Developer sửa qua patch thứ hai, sau đó Manager nghiệm thu. HC-902 được Manager chọn tự động sau khi HC-901 PASS. Báo cáo, structured output và state của demo nằm dưới `reports/MVP_DEMO/<run-id>/`; workspace tổng hợp nằm dưới `workspaces/mvp-demo/<run-id>/`.

Đây chỉ là demo local trên dữ liệu tổng hợp. Không dùng `mvp-demo` làm bằng chứng ranh giới Windows read-only được kiểm chứng cho mọi lệnh; không chạy HealthClues task qua đường này. Trước khi dùng trên source thật vẫn cần sandbox Developer được kiểm chứng, snapshot nguyên trạng tracked/untracked work, container adapter ổn định, review cô lập và Apply Gate riêng có kiểm soát.
