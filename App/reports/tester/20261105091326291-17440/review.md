# HealthClues Tester — 20261105091326291-17440

Verdict for local playable scope: **REWORK**. This is not a production release approval.

Handoff SHA-256: fca97e7a254bce76208e4659f8b320078ff72afe9b885af63f14e24008bb7db8

Cycle 3 fixes the earlier Daily Care count calculation and mobile touch-target sizes, but local acceptance remains REWORK. Source review found a check-in status mismatch that can record usage for an unrelated tool, and inspected mobile captures show unreadable EXP text.

| Check | Status | Evidence | Finding |
|---|---|---|---|
| discovery | UNVERIFIED | node scripts/test-healthclues-discovery-matching.mjs passed 37 assertions; current Quiz source retains the two-question and age-confirmation controls. | A current browser session did not complete concern selection, age confirmation and the resulting personal Journey. |
| overworld | PASS | Current headless Chromium loaded http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest and found eight cards: two enabled and six disabled. The artwork at D:\botly\public\healthclues\assets\world\healthclues-world-overworld.webp was opened and inspected. | The eight-region artwork and two-playable selector scope are present. |
| world_entry | UNVERIFIED |  | Quiz-to-Mailpit activation and entry into each selected region were not performed in this run. |
| npc_arrival | UNVERIFIED | node scripts/test-healthclues-region-layout.mjs passed connected-route checks for both regions. RegionMapScene.tsx routes NPC clicks through beginLandmarkTravel and opens Talk after arrival. | Current authenticated walking, approach-point timing, painted-road alignment and keyboard or touch interaction were not exercised. |
| journey_daily_care | FAIL | DailyCheckinDialog.tsx:183-195 changes local status to not_yet on a second Done tap but still sends done to onStatus; it also maps Plan goal position i to unrelated equipped entries[i]. WellnessWorldGame.tsx:322-328 persists those equipped-entry statuses as toolkit usage. The existing scripts/test-daily-care-truthful-reproduction.mjs posts a compiled note directly, so it does not exercise this UI path. | With a Plan goal and an unrelated equipped tool at the same list position, tapping Done twice leaves the goal marked not_yet locally while the parent retains done for that tool. Saving can record false tool usage. The new five-goal count and three-goal summary need an actual UI-driven save and reload check. |
| in_region_learning | UNVERIFIED |  | Knowledge lessons, quizzes, mini-games and Boss were not opened in a current authenticated region session. |
| auth_persistence | UNVERIFIED | node scripts/healthclues-owner-demo-preflight.mjs passed for healthclues-owner-demo with loopback Auth and Mailpit. GET and POST http://127.0.0.1:3329/api/healthclues/account/quick-activate each returned 410. | Mailpit activation, return after login or reload, saved progress and cross-account isolation were not retested. This run did not change database records. |
| mobile_ui | FAIL | Opened D:\botly\App\.tmp\healthclues-tester\screenshots\verified-mobile-320-rpg.png, verified-mobile-390-rpg.png and verified-mobile-430-rpg.png. At all three emulated widths the EXP number is dark and vertically clipped within the narrow progress track. world-adventure.css:2623-2653 gives the number dark text; its mobile rule reduces the track to 7px while the number remains about 9–10px high. | Players cannot clearly read the EXP value on the mobile HUD. Touch targets appear enlarged, but Quiz, preview, NPC modal, Journey and Daily Care layouts still lack current-run visual inspection. |
| safety_privacy | UNVERIFIED | The read-only Owner Demo preflight passed; quick-activate returned 410; node scripts/test-healthclues-wellness-plan.mjs passed 42 safety and coverage assertions. | Current-run account isolation, private Plan access and player-facing TEST ONLY or AI provenance were not checked through authenticated actions. Local fixture success does not establish reviewed content. |
| runtime_regression | UNVERIFIED | Current runs of scripts/test-healthclues-rpg-quest-board.mjs, test-healthclues-region-layout.mjs, test-healthclues-discovery-matching.mjs and test-healthclues-wellness-plan.mjs exited 0. | These focused tests do not exercise the failing check-in interaction or establish a browser run without runtime errors. |

## Blockers

- The check-in dialog can persist Done usage for an unrelated equipped tool while its Plan goal is shown as not completed.
- EXP text is unreadable in the inspected 320×800, 390×844 and 430×932 emulated mobile captures.
- The authenticated end-to-end, learning, persistence and account-isolation paths remain unverified in this run.

## Next test

Use an authenticated isolated demo UI to tap Done twice on a Plan goal while an unrelated tool is equipped, save, then read the private check-in detail and reload to compare goal status with toolkit usage.

## Release readiness

REWORK for the local playable scope. Qualified health-content review, privacy/security approval and physical-device testing remain separate release gates.
