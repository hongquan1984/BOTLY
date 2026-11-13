# HealthClues Tester — 20261105132407417-17432

Verdict for local playable scope: **REWORK**. This is not a production release approval.

Handoff SHA-256: 724ec5bbf0818d2ed8829b9317fa9945ae523919ceeffbe74ea173a5c4fdec27

REWORK. Current-run checks found unsafe Botanist content, unrelated Gout advice for a Digestion topic, and a 320px Daily Care layout defect. The previous check-in hydration issue has a source fix, but its real UI persistence remains unverified.

| Check | Status | Evidence | Finding |
|---|---|---|---|
| discovery | UNVERIFIED | node scripts/test-healthclues-discovery-matching.mjs passed 37 assertions; the guest region chooser loaded in Chrome at http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest. | The complete Quiz-to-Journey flow was not exercised in this run. |
| overworld | PASS | Current-run Chrome DOM at http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest showed Sleep Valley with Luna, HealthClues Realm with Lumi, and six region buttons labeled “Sắp ra mắt”; Chrome exited 0. | All eight region choices appear with the expected availability labels. |
| world_entry | UNVERIFIED | node scripts/healthclues-owner-demo-preflight.mjs passed for loopback project healthclues-owner-demo; inspected region HUD screenshots in App/.tmp/healthclues-tester/screenshots/. | Authenticated World creation and region/companion persistence were not exercised directly. |
| npc_arrival | UNVERIFIED | node scripts/test-healthclues-region-layout.mjs passed 17 connected routes per playable region; inspected mobile NPC modal screenshots at 320, 390, and 430px. | The screenshots show an open station but do not establish walk-before-Talk timing, approach position, or keyboard/touch behavior. |
| journey_daily_care | UNVERIFIED | Current source has a hydration effect in src/features/healthclues/DailyCheckinDialog.tsx; node scripts/test-daily-care-component-hydration.mjs and node scripts/test-daily-care-focused-regression.mjs passed. | The new lifecycle test simulates the component logic rather than rendering React. Reopen, unchanged save, and reload of an existing authenticated check-in were not directly verified. |
| in_region_learning | FAIL | Read-only local GET http://127.0.0.1:3329/api/healthclues/botanical-advisor?topic=Digestion&focusId=health-concern returned category=gout, four herbs, firstId=hc-herb-sake. src/app/api/healthclues/botanical-advisor/route.ts defaults unmatched topics to Gout. | An unrelated Digestion topic receives Gout-specific botanical advice instead of a truthful no-content state. |
| auth_persistence | UNVERIFIED | Owner Demo preflight passed; guest GET /api/healthclues/world returned 401 and GET /api/healthclues/account/quick-activate returned 410. | Magic-link activation, return after login, and cross-account isolation were not exercised because this run prohibited database writes. |
| mobile_ui | FAIL | Opened all 18 workspace images App/.tmp/healthclues-tester/screenshots/mobile-{320,390,430}-{quiz,preview,hud,npc-modal,journey,daily-care}.png. In mobile-320-daily-care.png, the “Không hoàn thành” buttons extend beyond their rounded goal cards. src/features/healthclues/world-adventure.css:2124-2129 keeps the two-button group on one unshrinking flex row. | At 320×800, Daily Care actions overflow their card boundaries; the 390px and 430px captures have enough width. |
| safety_privacy | FAIL | Inspected mobile-320-npc-modal.png, mobile-390-npc-modal.png, and mobile-430-npc-modal.png: herb cards say “AI Đề xuất” and “Nội dung giáo dục đã duyệt · Đủ điều kiện khám phá.” src/features/healthclues/WellnessEncyclopediaStation.tsx maps botanical-advisor results to demoOnly:false and recommendationEligible:true and adds their IDs to eligibleIds. The local GET returned CURATED_KNOWLEDGE; the route contains dosing instructions without review records or source references. | Unreviewed botanical advice is presented as reviewed and personally eligible, contrary to the canonical review gate. Guest World access and quick-activate protections passed, but they do not resolve this safety defect. |
| runtime_regression | UNVERIFIED | Safe focused Daily Care, RPG quest board, discovery, region layout, and wellness-plan suites passed; the guest chooser loaded in current-run Chrome. | A full authenticated runtime regression was not run, and the focused suites did not catch the Botanist topic and review-gate defects. |

## Blockers

- Botanist presents unreviewed botanical cards as reviewed and eligible.
- An unsupported Digestion topic receives Gout-specific herbs.
- Daily Care buttons overflow goal cards at 320px.
- Authenticated end-to-end and check-in persistence remain unverified under the no-database-write constraint.

## Next test

Run a no-provider, no-database botanical review-gate regression asserting that Digestion returns no Gout herbs and that unreviewed fallback cards have no reviewed, eligible, Save, or Equip presentation.

## Release readiness

REWORK for the local playable scope. Human review of health content, broader privacy/security acceptance, authenticated persistence, and physical-device testing remain separate release gates.
