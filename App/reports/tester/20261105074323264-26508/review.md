# HealthClues Tester — 20261105074323264-26508

Verdict for local playable scope: **REWORK**. This is not a production release approval.

Handoff SHA-256: 018190958176049ab5befa93444d7fd8ee9d5c7ad817e95b9350aca6a5d34a47

Local acceptance is not complete. The live guest Overworld shows eight regions, and the quick-activation endpoint returns 410. Source review found misleading Daily Care completion behavior, the focused RPG quest-board test fails, and inspected mobile captures show a clipped HUD. Authenticated gameplay was not rerun because this review could not change demo data.

| Check | Status | Evidence | Finding |
|---|---|---|---|
| discovery | UNVERIFIED | Headless Chromium loaded http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery and found data-healthclues-two-question-quiz. node scripts/test-healthclues-discovery-matching.mjs passed 37 assertions. | The two-question click path, primary-focus choice, age gate and Quiz-to-Journey handoff were not exercised in this run. |
| overworld | PASS | Headless Chromium loaded http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest: eight region cards rendered, with two aria-disabled="false" and six aria-disabled="true". src/components/healthclues/HealthCluesQuiz.tsx retains all eight IDs; its CSS references the existing public/healthclues/assets/world/healthclues-world-overworld.webp. | The current guest selector preserves the eight-region, two-playable scope. |
| world_entry | UNVERIFIED |  | No new account was activated or entered into either region during this read-only run. |
| npc_arrival | UNVERIFIED | node scripts/test-healthclues-region-layout.mjs passed connected-route checks for both regions. src/features/healthclues/RegionMapScene.tsx routes landmark clicks through beginLandmarkTravel. | Actual click, walking animation, painted-road alignment, arrival timing, Talk action, keyboard and touch behavior were not observed in a current authenticated browser session. |
| journey_daily_care | FAIL | src/features/healthclues/HealthCluesRpgWorldHud.tsx:97-110 and :314-343: only three goals are displayed; toggleGoal changes component-local completedGoals and renders +10 EXP without saving a check-in or updating server XP. The seven-day track uses the count of all distinct check-in dates as its streak. | A Daily Care tap can display completion and an EXP reward without a persisted daily record; reload loses that state. Nonconsecutive historical check-ins can also advance the displayed streak. |
| in_region_learning | UNVERIFIED |  | Knowledge lessons, quizzes, mini-games and Boss were not opened in an authenticated region during this run. |
| auth_persistence | UNVERIFIED | GET and POST http://127.0.0.1:3329/api/healthclues/account/quick-activate each returned HTTP 410. | Mailpit activation, return after login, saved progress and two-account isolation were not retested; the 410 result verifies only removal of that bypass. |
| mobile_ui | FAIL | Inspected supplied emulated Chromium captures C:\Users\Admin\.gemini\antigravity\brain\bf806726-5fdf-45f1-b574-a2b65a5fbf0f\verified-mobile-320-rpg.png, verified-mobile-390-rpg.png and verified-mobile-430-rpg.png. At 320px the top level capsule extends beyond the right edge; the 390px and 430px captures also cut off top-bar content. These are supplied captures, not fresh screenshots. | The region HUD clips on the requested mobile widths. Quiz, preview, Journey, Daily Care, modal closure, safe-area clearance and physical touch behavior still need fresh visual checks. |
| safety_privacy | UNVERIFIED | Current GET/POST quick-activate responses were 410. node scripts/test-healthclues-wellness-plan.mjs passed 42 deterministic safety and coverage assertions. | Current-run account isolation, private Plan reads and writes, and health-content provenance were not verified in an authenticated browser. Local fixtures and past reports do not establish reviewed content or production safety. |
| runtime_regression | FAIL | node scripts/test-healthclues-rpg-quest-board.mjs exited 1 at line 74: expected the historical Vietnamese goal title, received the selected action title. Discovery matching, region layout and wellness-plan focused tests exited 0. | The focused RPG quest-board regression is red. Its title expectation appears stale against the 2026-11-05 signed-action-title decision; the correct contract and UI behavior need verification before updating the assertion. |

## Blockers

- Daily Care presents component-local completion and +10 EXP without a persisted check-in, and the seven-day streak counts nonconsecutive dates.
- The mobile region HUD clips at the inspected 320px, 390px and 430px widths.
- The focused RPG quest-board regression fails on the generated goal-title contract.
- Authenticated Quiz-to-World, NPC, learning, persistence and account-isolation paths lack current-run verification.

## Next test

After repair, rerun node scripts/test-healthclues-rpg-quest-board.mjs, then perform one authenticated local Mailpit Sleep Valley journey with a saved check-in, reload, NPC arrival and 320x800/390x844/430x932 visual inspection.

## Release readiness

REWORK for the local playable scope. Production release also requires qualified health-content review, privacy/security sign-off and physical-device verification; this run establishes none of those gates.
