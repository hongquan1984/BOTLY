# HC-MGR-MVP-004 — Apply Gate, Isolation, and Baseline Report

Date: 2026-11-02

## Verdict

- Apply Gate on synthetic repositories: **PASS**.
- Verified rollback and recovery on synthetic repositories: **PASS**.
- Windows Developer OS isolation: **NOT VERIFIED / BLOCKED**.
- HealthClues baseline: **DO NOT ACCEPT OR RESTORE**; owner reconciliation required.
- Real HC-PILOT-001: **NOT RUN**.
- GO for a real HealthClues pilot: **NO-GO**.

## Apply Gate changes

`src/apply-gate.mjs` now prepares a digest-bound plan and only executes it after an explicit Owner approval tied to the plan digest. It requires independent Manager PASS and passing test evidence; derives the actual changed inventory from the snapshot; compares exact full-file diff content; applies only the strict allowlist; checks source and replacement hashes; rejects canonical path and symlink/junction escapes; captures original bytes; writes a recovery manifest; stages replacements; and verifies resulting images. Modified, added and deleted files are supported. Reapplying the same plan is blocked by the now-stale source precondition.

Interrupted apply recovery restores only files still equal to the recorded postimage, validates backup hashes and paths, and preserves concurrent independent edits as a recovery conflict. It does not invoke Git or execute AI-supplied shell commands.

`src/workspace-snapshot.mjs` supports an explicit absent-file baseline for a file-add operation and tracks workspace presence separately from source presence. The structured patch schema supports additions and deletions. README describes the new approval and recovery behavior.

Fixture evidence in `tests/apply-gate.test.mjs`:

- Modified, added, and deleted files applied; backup bytes and final hashes verified.
- Owner approval missing or not bound to the plan prevents apply.
- Interrupted two-file apply recovered to exact original contents.
- Concurrent external edit was preserved while the other file was rolled back.
- Manager REWORK and unauthorized modified/added files did not produce an applicable plan.
- Changed plan digest and stale original precondition failed closed.
- Symlink fixture creation was skipped because Windows returned `EPERM`; the separate snapshot resolver test rejects an injected symlink/reparse path. A real Apply Gate symlink fixture remains unverified on this host.

## Developer isolation

Codex CLI version: `codex-cli 0.166.0`. The installed CLI exposes `codex sandbox`; the current user config selects the legacy Windows `elevated` implementation. An ephemeral MXC compatibility invocation returned `native MXC is unavailable on this executor`.

A deterministic negative-write probe used only synthetic paths: workspace under `%TEMP%`, protected sentinel under `Manager/tests`, and `:workspace` permission profile. The command wrote its allowed marker **and also overwrote the protected sentinel**. The test detected the hash change; the sentinel was restored byte-for-byte and both probe directories were removed. This is a failed boundary test, not evidence of isolation. No HealthClues file was used as a probe. No Windows policy, source ACL, or system account was changed.

Therefore structured JSON patches, ignored user config, and disabled AI tool features do not provide the required host write boundary. Until an OS-enforced boundary passes a negative-write test, AI Developer execution must not be connected to a real HealthClues snapshot or original checkout. Windows sandbox documentation describes MXC and legacy implementations as permission-enforcing, but this host's MXC is unavailable and the tested elevated path did not enforce the requested scope in this invocation.

## HC-PILOT-001 baseline review

Read-only status and hashes at the final check of this audit:

| File | Status | SHA-256 | Acceptance coverage observation |
|---|---|---|---|
| `D:\botly\src\features\healthclues\personalized-wellness-plan.ts` | Untracked (`??`) | `B10F6FD991B76CB883E5F639C6B924B0DAFC445D77A6C01B566320DE16C35E46` | Current logic compares extracted numeric values; it does not establish equivalence of unit meanings. |
| `D:\botly\scripts\test-healthclues-personalized-plan-contract.mjs` | Untracked (`??`) | `34BD35309AD064CD5F78C958156E8FF8618DDF4BD184DDFCAA9A59B7E570A4D2` | Has low-risk and high-risk checks and a number mismatch check, but lacks the required 15 minutes/15 phút accept and hour/minute rejection cases. |

The test file hash was `AD7989393B811B7B244EF6A12822982EADF55ADC49DBC184887D0955B919A9E3` at the first check, then changed to `34BD35309AD064CD5F78C958156E8FF8618DDF4BD184DDFCAA9A59B7E570A4D2` at the final check. Its recorded last-write time was 2026-11-02 15:21:34 UTC, during this audit window. This audit did not write that HealthClues file and cannot identify who or what changed it. Treat the change as concurrent and do not accept its checksum as a baseline. The source implementation file remained at the same hash at final verification.

The current test does not prove the six requested acceptance conditions. Given current numeric-only comparison, same quantities with different units are not shown to reject. This is a read-only content review; the HealthClues test was not run. Neither target was written by this audit, but the contract test changed concurrently as recorded above.

Manager history reports captured an earlier test-file hash `49D41FF6E1EE0C0E1187516E2D3F4252F2BA5809CF20FC0B8C0DD451FF3ABACB`. The current test hash differs. The files are untracked, and this audit found only the old hash in Manager reports, not the old file bytes or a trusted content backup. A hash cannot reconstruct the prior diff. Do not restore or adopt either baseline automatically.

Owner should retrieve the prior file from an independent trusted backup if available, compare its content with the current file, and then explicitly authorize the exact current bytes (or provide the approved prior bytes) before any snapshot or Developer task. No baseline was updated by this audit.

## Regression and preserved state

`npm.cmd test`: **33 passed, 0 failed, 1 skipped** (symlink creation unavailable under current Windows privileges). Apply Gate focused tests: **5 passed, 0 failed, 1 skipped**. This suite covers existing MVP-001/002/003 mock and fixture regressions. It does not rerun AI inference or a real Manager-to-Developer task, consistent with the request.

`state/PROJECT_STATE.json` remains `AUTH_BLOCKED`, current task `HC-PILOT-001`; `HC-001` through `HC-008` remain `PENDING`. No HealthClues code, auth, Docker Engine, production, migration, database, commit, push, or deployment operation was performed. No original HealthClues file was applied.

## Remaining conditions before HC-PILOT-001

1. Provision or select an OS boundary that can be tested with allowed-write success and protected-write denial; rerun the test only on synthetic files and verify protected hashes.
2. Owner reconciles the test-file baseline using trusted prior bytes or explicitly approves current exact content and hashes.
3. After those pass, separately authorize the one bounded pilot. Apply remains explicit-approval and plan-digest gated; this audit did not exercise it on HealthClues.

Until then: **NO-GO** for a real HealthClues task or multi-task autonomous loop.
