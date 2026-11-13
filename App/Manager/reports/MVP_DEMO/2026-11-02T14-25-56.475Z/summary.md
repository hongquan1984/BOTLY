# Manager MVP synthetic demo result

Run ID: `2026-11-02T14-25-56.475Z`  
Final run status: `DEMO_PASS`  
This is a synthetic-only demo, not a HealthClues pilot.

## Real AI and task outcomes

- Successful demo: 8 real Codex inference turns — Manager selected HC-901, Developer proposed a patch, Manager returned REWORK against an intentional fixture defect, Developer proposed a correction, Manager accepted it, Manager selected HC-902 automatically, Developer proposed its patch, Manager accepted it.
- A preceding attempt made 4 real inference turns and then stopped on an orchestration implementation error (`Assignment to constant variable`) after the Developer correction. It did not change HealthClues or the real task queue. The successful run was a fresh synthetic workspace.
- Total real inference turns during this MVP session: 12. There were no fixture-generated AI responses counted as real.
- One earlier restricted process launch incremented the attempt counter but failed before a model turn because Codex could not create its runtime arg0 temporary directory; it made zero inference turns.
- HC-901: PASS after one REWORK. The deliberate fixture changed output to `Hola, Ada!`; its test failed and Manager rejected it with precise feedback. Corrected output then passed the Docker test and Manager review.
- HC-902: automatically selected after HC-901 PASS; Docker test passed and Manager review returned PASS.
- Both tasks and decisions are persisted in `demo-state.json`; raw AI protocol logs and outputs are under `ai/`.

## Execution boundary

- The model processes used Codex `exec` with `--sandbox read-only`, `--ephemeral`, and JSON Schema output. Developer returned patches; it made no tool calls in the captured Developer logs. Manager used read-only inspection/test commands only in the synthetic workspace.
- Deterministic patch application accepted only the task's one exact synthetic source path and a matching pre-apply SHA-256. Actual accepted diffs are `HC-901-accepted-actual-diff.patch` and `HC-902-accepted-actual-diff.patch`.
- Test containers used Node 24, `--network none`, `--read-only`, UID 65534, dropped capabilities, `no-new-privileges`, process/CPU/memory limits, and a read-only bind mount of the synthetic workspace. Containers use `--rm`; no HealthClues checkout, Docker socket, or secrets were mounted.
- A normal restricted launch initially failed before inference because Codex could not create its runtime arg0 temporary directory in the existing CODEX_HOME. The successful demo was launched through the authorized elevated process path while retaining Codex `--sandbox read-only`. The Windows read-only sandbox boundary was not independently adversarially tested in this run; do not infer that it is a verified host write boundary.

## Verification and unchanged project state

- Manager tests: 16/16 PASS after implementation.
- HealthClues files used in the earlier HC-PILOT preflight were re-hashed read-only and remain at their recorded values:
  - `D:\botly\src\features\healthclues\personalized-wellness-plan.ts`: `B10F6FD991B76CB883E5F639C6B924B0DAFC445D77A6C01B566320DE16C35E46`
  - `D:\botly\scripts\test-healthclues-personalized-plan-contract.mjs`: `AD7989393B811B7B244EF6A12822982EADF55ADC49DBC184887D0955B919A9E3`
- `state/PROJECT_STATE.json` remains `AUTH_BLOCKED`, HC-PILOT-001 remains blocked, and HC-001 through HC-008 remain pending.
- All generated source/test files are synthetic and under `workspaces/mvp-demo/<run-id>/`; the AI prompt contained only synthetic task requirements, code, and tests.

## Remaining boundary before real HealthClues use

This run proves the proposal → allowlist apply → container test → independent review loop on synthetic input. It does not prove the Windows read-only sandbox is an enforceable host boundary for arbitrary agent behavior, nor does it implement a faithful snapshot of HealthClues' existing modified/untracked work, isolated real Manager review, or a separately reviewed Apply Gate to the original checkout. Keep this MVP command scoped to synthetic workspaces.
