# HC-MGR-MVP-003 — real-AI synthetic integration report

Date: 2026-11-02

## Verdict

**PASS for the bounded synthetic Manager ↔ Developer loop. NOT READY for a HealthClues task.** Two synthetic task IDs were processed by real Codex Manager and Developer inference. A separately labeled rework probe repeated HC-901 with a deliberately incomplete Developer brief; real Manager review rejected a real failing patch, then real Developer and Manager calls repaired and accepted it. No HealthClues file was mounted, read by the task workflow, modified, or applied.

## AI call count

There were **11 real inference invocations**:

- 1 initial Manager selection invocation in an aborted startup. It returned a valid selection response, but an early adapter build classified a fail-closed Code Mode error event as an unexpected tool and stopped before task assignment. This is retained in its own BLOCKED state report.
- 6 calls in the successful two-task run: Manager select HC-901, Developer patch, Manager review, Manager select HC-902, Developer patch, Manager review.
- 4 calls in the HC-901 rework probe: Developer attempt 1, Manager REWORK, Developer attempt 2, Manager PASS.

Successful workflow and rework runs therefore contain 10 completed task-cycle inference calls. The first invocation was a completed model response but not a completed orchestration call. The run made no calls beyond these records.

## Task and evidence results

| Run/task | Result | Evidence |
|---|---|---|
| Main demo HC-901 | PASS, attempt 1 | `reports/MVP_003/2026-11-02T14-59-24.682Z/runs/HC-901/workflow-result.json`; Docker test PASS; Manager AI PASS |
| Main demo HC-902 | PASS, attempt 1 | `reports/MVP_003/2026-11-02T14-59-24.682Z/runs/HC-902/workflow-result.json`; Docker test PASS; Manager AI PASS |
| Same-task HC-901 rework probe, attempt 1 | REWORK | `reports/MVP_003_REWORK/2026-11-02T15-02-32.981Z/runs/HC-901/workflow-result.json`; ASCII-only Developer patch failed 3 of 5 Docker tests; Manager AI returned REWORK and identified ampersand mapping, Unicode preservation and NFKC gaps |
| Same-task HC-901 rework probe, attempt 2 | PASS | Same workflow result; Developer added Unicode-aware normalization; Docker tests passed 5 of 5; Manager AI returned PASS |

The rework probe is explicitly an adversarial synthetic fixture. Its initial Developer brief intentionally omitted requirements still present in the authoritative Manager acceptance criteria. This tests whether independent review catches incomplete work; it is not a product requirement or a mocked response.

After main-demo HC-901 PASS, the persisted history records `AUTOMATIC_NEXT_TASK_ASSIGNED` for HC-902. The demo stopped after HC-902 because the run is limited to two unique tasks.

Every accepted task result was `VERIFIED_READY_TO_APPLY`, with `applyOccurred: false` and `ownerApprovalRequired: true`. No original-source Apply Gate ran.

## Docker and snapshot evidence

All actual task tests ran in disposable `node:24-bookworm-slim` containers using `runSnapshotTests`. Each test mounted only its task snapshot read-only; network was disabled; root filesystem was read-only; UID/GID 65534; capabilities dropped; `no-new-privileges`; 64 process limit; 512 MiB memory; 1 CPU; 16 MiB `/tmp`. No checkout, Docker socket or existing service container was mounted. AI output was applied only to the per-run Manager snapshot after schema, task ID, path allowlist and SHA-256 checks.

The full Manager suite after implementation: `npm.cmd test` — **28/28 PASS**. This includes the mock integration test for automatic next-task state, the prior Manager tests, snapshot/apply-plan tests, and an interruption fixture confirming the workflow state and snapshot manifest remain available for manual reconciliation.

## Structured-only Codex configuration and observed tool events

For MVP-003 calls, the adapter used the existing Codex CLI with `--ignore-user-config`, per-invocation `--disable` for shell, browser, computer, apps, plugins, Code Mode host, image viewing and skill/MCP discovery, plus `--sandbox read-only`, schema-constrained final output and a minimal inherited environment containing only runtime variables and `CODEX_HOME`. The CLI's installed version was 0.166.0. No authentication files were printed, copied or modified.

The real JSONL logs show a Code Mode request returned an error stating the Code Mode host was disabled and the request failed closed. The structured-only adapter records this blocked event. No command-execution, MCP, browser or other tool-call events appeared in completed runs. This is evidence that the configured tool features did not execute in these invocations; it is **not** proof of an OS-level Windows filesystem boundary. Do not generalize this mode to HealthClues source.

## HealthClues baseline and queue

HC-PILOT-001 was not launched. Read-only hashes remain:

- `D:\botly\src\features\healthclues\personalized-wellness-plan.ts`: `B10F6FD991B76CB883E5F639C6B924B0DAFC445D77A6C01B566320DE16C35E46`, untracked.
- `D:\botly\scripts\test-healthclues-personalized-plan-contract.mjs`: `AD7989393B811B7B244EF6A12822982EADF55ADC49DBC184887D0955B919A9E3`, untracked; differs from previously captured baseline `49D41FF6E1EE0C0E1187516E2D3F4252F2BA5809CF20FC0B8C0DD451FF3ABACB`.

No new baseline was accepted. Manager project state remains `AUTH_BLOCKED`; HC-001 through HC-008 remain `PENDING`.

## Remaining blockers before a real HealthClues pilot

1. Windows Codex is still a host process. The disabled tool configuration is not an OS sandbox, and source checkout non-access has not been independently enforced. A real HealthClues task must wait for an execution boundary that can be verified independently.
2. Owner must inspect the existing untracked test file and determine whether its current content is intended. Only after that review may the Owner explicitly approve a fresh checksum baseline or reconcile the file and approve the resulting state. This report does not decide that question.
3. The future original-source Apply Gate remains plan-only. It still needs explicit Owner authorization and tested backup/recovery before any source integration.

Workflow checkpoints and attempt reports persist atomically or as task-specific artifacts; the interruption test confirms the last phase is retained. Automatic resume of an interrupted MVP-003 run is not implemented; an owner/operator must reconcile the saved phase before restarting that demo.

No application source, queue state, authentication, proxy, Docker Engine, database, production resource, commit, push or deployment was changed.
