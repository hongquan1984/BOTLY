# HealthClues Tester — 20261105081047292-26540

Verdict for local playable scope: **REWORK**. This is not a production release approval.

Handoff SHA-256: 9c52404e1c1c7943cdf54b50f10ef75e8386401f41a8a7828b1fe3ae9e28f67d

Cycle 2 fixes the focused test failure and the obvious mobile HUD clipping, but local acceptance remains REWORK. Daily Care still reports goal completion incorrectly, and mobile HUD controls are too small. Authenticated flows could not be rerun without changing demo data.

| Check | Status | Evidence | Finding |
|---|---|---|---|
| discovery | UNVERIFIED | Current headless Chromium loaded http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery; the two-question Quiz rendered. node scripts/test-healthclues-discovery-matching.mjs passed 37 assertions. | Concern selection, age confirmation and the resulting personal Journey were not completed in a current browser session. |
| overworld | PASS | Current headless Chromium loaded http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest and found eight region cards: two enabled and six disabled. src/components/healthclues/HealthCluesQuiz.tsx retains all eight IDs; the referenced Overworld artwork exists at public/healthclues/assets/world/healthclues-world-overworld.webp. | The current selector preserves the eight-region, two-playable scope. |
| world_entry | UNVERIFIED |  | No account activation or fresh entry into Sleep Valley or HealthClues Realm was performed in this run. |
| npc_arrival | UNVERIFIED | node scripts/test-healthclues-region-layout.mjs passed connected-route checks for both regions; src/features/healthclues/RegionMapScene.tsx routes landmark clicks through beginLandmarkTravel. | Current authenticated click-to-arrival timing, painted-road alignment, Talk action and keyboard or touch interaction were not observed. |
| journey_daily_care | FAIL | src/features/healthclues/HealthCluesRpgWorldHud.tsx:150-170 and :379-404: any check-in marks all three displayed goal rows as recorded; completedCount falls back to totalGoals when there are no matching done usage records. src/features/healthclues/WellnessWorldGame.tsx:322-326 submits usage only for equipped toolkit entries, while DailyCheckinDialog.tsx:161-200 handles Plan goals separately. | Reproduction from the current data path: with five Plan goals and no equipped tools, record one goal as done and four as not completed. The HUD can display 5/5 completed and mark all three summary rows recorded. The new three-of-five explanation and consecutive-date calculation exist, but per-goal completion is not truthfully recovered. |
| in_region_learning | UNVERIFIED |  | Lessons, learning quizzes, mini-games and Boss were not opened in a current authenticated region session. |
| auth_persistence | UNVERIFIED | node scripts/healthclues-owner-demo-preflight.mjs passed for project healthclues-owner-demo with loopback Auth and Mailpit. GET and POST http://127.0.0.1:3329/api/healthclues/account/quick-activate both returned 410. | Mailpit activation, return after reload or login, saved progress and two-account isolation were not retested. This run did not create or alter database records. |
| mobile_ui | FAIL | Inspected workspace captures D:\botly\App\.tmp\healthclues-tester\screenshots\verified-mobile-320-rpg.png, verified-mobile-390-rpg.png and verified-mobile-430-rpg.png. The prior topbar clipping appears repaired. Current src/features/healthclues/world-adventure.css sets the visible mobile language and profile controls to 32px high, with 32px profile width. | The visible language and profile touch targets are smaller than the 44px mobile target in App/UI_UX_SPEC.md. Other requested screens and physical touch behavior remain unverified. A separate Chrome window-size capture was excluded because Chrome used a 500px layout viewport despite a 320px image. |
| safety_privacy | UNVERIFIED | The read-only Owner Demo preflight passed; quick-activate returned 410 for GET and POST; node scripts/test-healthclues-wellness-plan.mjs passed 42 safety and coverage assertions. | Current-run cross-account denial, private Plan persistence and player-facing TEST ONLY or AI provenance were not verified through authenticated actions. Local fixtures do not establish clinical or production approval. |
| runtime_regression | UNVERIFIED | Current runs of scripts/test-healthclues-rpg-quest-board.mjs, test-healthclues-region-layout.mjs, test-healthclues-discovery-matching.mjs and test-healthclues-wellness-plan.mjs all exited 0. | The previously failing title assertion is repaired, but authenticated browser runtime errors and the complete gameplay regression were not checked in this run. |

## Blockers

- Daily Care treats a recorded check-in as completion of every Plan goal, even when goals were marked not completed.
- Visible mobile HUD language and profile controls have 32px touch targets.
- Authenticated Quiz-to-World, persistence, NPC, learning and cross-account paths lack current-run verification.

## Next test

Run an authenticated isolated Owner Demo check-in with five confirmed goals, zero equipped tools, one done and four not_yet; reload and compare every Daily Care row and the completed count with the saved check-in.

## Release readiness

REWORK for the local playable scope. Qualified health-content review, privacy/security approval and physical-device testing remain separate release gates.
