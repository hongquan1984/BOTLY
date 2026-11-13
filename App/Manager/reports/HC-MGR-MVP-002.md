# HC-MGR-MVP-002 — implementation and validation

Date: 2026-11-02

## Result

**PARTIAL — safe synthetic snapshot/review path implemented; HealthClues task execution remains blocked.** No HealthClues source was edited, no Developer/Manager inference was launched, no Apply Gate operation was executed, and no queue/state transition was made. The new plan status `VERIFIED_READY_TO_APPLY` was reached only by a synthetic mocked fixture.

## Implemented

- `src/workspace-snapshot.mjs`: explicit SHA-256 preflight for every allowlisted file; tracked/untracked metadata; source-to-snapshot copy; source recheck after copy; snapshot inventory verification; symlink/reparse, path traversal, sensitive path and unexpected-file rejection; patch application only inside the snapshot; patch base-hash preconditions; original-baseline verification.
- `schemas/workspace-patch.schema.json`: structured Developer patch payload.
- `src/snapshot-workflow.mjs`: bounded snapshot → structured patch → isolated tests → Manager decision loop. The test command is constructed by code from fixed paths; AI output cannot choose shell commands. A PASS plus successful test evidence creates a plan only.
- `src/apply-gate.mjs`: read-only `VERIFIED_READY_TO_APPLY` proposal. It checks Manager PASS, task identity, strict allowlist, actual snapshot inventory and changed-file hashes, independently reconstructs the diff from original/replacement bytes, requires passing test records, and rechecks the source baseline. It performs no writes to the original checkout.
- `tests/workspace-snapshot.test.mjs`: synthetic snapshot, patch and review tests.
- `tests/docker-snapshot-smoke.mjs` and `reports/evidence/mvp002-docker-workspace/`: bounded Docker integration evidence using only a synthetic fixture.
- `README.md`: describes the workflow and explicitly records the unverified Windows Codex host boundary.

## Validation evidence

- `npm.cmd test`: **25/25 PASS** (16 existing MVP/orchestrator tests plus 9 new snapshot workflow tests).
- `node tests/docker-snapshot-smoke.mjs`: **PASS**, actual disposable container. Effective configuration: `node:24-bookworm-slim`, UID/GID 65534, `--network none`, `--read-only`, read-only mount of only `reports/evidence/mvp002-docker-workspace`, `--cap-drop ALL`, `no-new-privileges`, 64 process limit, 512 MiB, 1 CPU, 16 MiB `/tmp`. The test read its synthetic snapshot and confirmed a write into the mounted workspace was denied. No Docker socket, HealthClues checkout, or existing container was mounted or changed.
- A direct fixture container probe also passed after correcting a fixture newline expectation; its evidence is under `reports/evidence/mvp002-docker-fixture/`.
- Snapshot tests use synthetic temporary directories. Developer, Manager, and test responses in workflow tests are injected fixtures, not real AI calls.
- No HC-PILOT-001 test was executed.

## HC-PILOT-001 read-only preflight

Both paths remain untracked in the real repository. No contents were changed by this work.

| File | Current SHA-256 | Git status | Captured baseline comparison |
|---|---|---|---|
| `D:\botly\src\features\healthclues\personalized-wellness-plan.ts` | `B10F6FD991B76CB883E5F639C6B924B0DAFC445D77A6C01B566320DE16C35E46` | untracked (`??`) | matches prior recorded preflight |
| `D:\botly\scripts\test-healthclues-personalized-plan-contract.mjs` | `AD7989393B811B7B244EF6A12822982EADF55ADC49DBC184887D0955B919A9E3` | untracked (`??`) | **mismatch** with captured baseline `49D41FF6E1EE0C0E1187516E2D3F4252F2BA5809CF20FC0B8C0DD451FF3ABACB` |

The mismatch was reported only. No baseline was replaced or accepted.

## Limits and remaining blockers

1. The workflow is a reusable module, not wired into the ordinary HealthClues queue/orchestrator entrypoint. The current queue remains `HC-001` through `HC-008` all `PENDING`; project state remains `AUTH_BLOCKED`.
2. Host Windows Codex CLI is still an agent process. This environment has not verified a no-tools mode or an enforceable filesystem boundary outside the supplied snapshot. The new runner configures `--sandbox read-only`, but does not claim this is a security boundary. Do not use this host inference path with HealthClues source until a no-tool/isolated inference boundary is verified.
3. Original-source Apply Gate execution, backup creation, restore-on-failure, locking/concurrent-write transaction and owner approval enforcement are not implemented. Only plan generation is implemented, by design for this phase.
4. Docker verified the synthetic test adapter and mount constraints, not the HealthClues contract test or Developer container inference.
5. HC-PILOT-001 must remain blocked until Owner reconciles and explicitly approves the test-file baseline, and the AI inference boundary is resolved.

## Decision

Snapshot / patch / review: **PASS for synthetic fixtures**. Docker test execution: **PASS for the synthetic workspace only**. HealthClues source pilot: **NOT RUN / BLOCKED**. Original source apply: **NOT IMPLEMENTED / NOT AUTHORIZED**. This is not autonomous or multi-task readiness.
