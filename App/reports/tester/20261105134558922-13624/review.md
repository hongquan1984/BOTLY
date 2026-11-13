# HealthClues Tester — 20261105134558922-13624

Verdict for local playable scope: **REWORK**. This is not a production release approval.

Handoff SHA-256: 00aeb3dc924ae97e9ca1f3a51a3d3427807ff666759b88e6342da060e7818c8a

REWORK. Current-run checks confirm the eight-region Overworld and several focused regressions, but the public botanical endpoint still serves unreviewed, dose-level herbal instructions.

| Check | Status | Evidence | Finding |
|---|---|---|---|
| discovery | UNVERIFIED | scripts/test-healthclues-discovery-matching.mjs passed 37 assertions. | The current Quiz → preview → activation flow was not exercised in a browser. |
| overworld | PASS | Headless Chrome opened http://127.0.0.1:3329/vi/wellness/healthclues/quiz?step=quest; live DOM showed Sleep Valley and HealthClues Realm as choices and six regions labeled “Sắp ra mắt”. | All eight region choices remain visible; only the two approved regions are presented as playable. |
| world_entry | UNVERIFIED | Owner Demo preflight identified local project healthclues-owner-demo with loopback Auth and Mailpit. | No fresh account was taken through activation into a region in this review. |
| npc_arrival | UNVERIFIED | scripts/test-healthclues-region-layout.mjs passed connected-path checks for both playable regions. | NPC approach timing, painted-road alignment, and keyboard or touch arrival were not exercised in a current-run browser session. |
| journey_daily_care | UNVERIFIED | scripts/test-daily-care-component-hydration.mjs and scripts/test-daily-care-focused-regression.mjs passed. | These checks simulate state logic; authenticated save, reopen, reload, and the relationship between five goal ticks and three Daily Care cards remain unverified. |
| in_region_learning | UNVERIFIED | src/features/healthclues/WellnessEncyclopediaStation.tsx filters Botanist list entries to reviewed Catalog recommendations; inspected local mobile NPC captures showed an empty Botanist state. | Current-run interactive lesson, quiz, mini-game, and Boss flows were not exercised. |
| auth_persistence | UNVERIFIED | scripts/healthclues-owner-demo-preflight.mjs passed for healthclues-owner-demo, loopback Auth, and Mailpit. | Magic-link login, returning-player persistence, and two-account isolation were not retested. |
| mobile_ui | UNVERIFIED | Inspected supplied captures under App/.tmp/healthclues-tester/screenshots at 320×800, 390×844, and 430×932; the 320 Daily Care buttons appear contained. | The captures predate this independent run. Current-run touch, overlay closing, safe-area, and overflow measurements are missing. |
| safety_privacy | FAIL | Unauthenticated GET http://127.0.0.1:3329/api/healthclues/botanical-advisor?focusId=health-concern&topic=Gout returned 200, UNREVIEWED_FALLBACK, four herbs, and instructions to prepare 1–2 leaves in 1 liter and drink it. Sleep returned three unreviewed herbs with preparation amounts and timing. src/features/healthclues/WellnessEncyclopediaStation.tsx:81-129 automatically POSTs the private topic on Botanist open and maps returned herbs as eligible Catalog-like items; src/app/api/healthclues/botanical-advisor/route.ts:223-256 contains a real-provider call path. | A public endpoint exposes unreviewed condition-specific use instructions. The station also starts a potential external-provider request without per-request consent. No provider call was made during this review. |
| runtime_regression | UNVERIFIED | Seven safe focused scripts passed, including botanical gate, Daily Care, discovery, region layout, and wellness-plan tests. | No current-run authenticated browser runtime or full journey regression was completed; the botanical gate test does not reject unreviewed instructions in recognized-topic responses. |

## Blockers

- Public botanical GET serves unreviewed condition-specific preparation and consumption instructions.
- Opening Botanist automatically POSTs the user's topic to a route capable of calling a real AI provider without per-request consent.
- Current-run authenticated journey, persistence, NPC timing, and mobile interaction evidence is incomplete.

## Next test

After the safety fix, repeat unauthenticated Gout/Sleep botanical GET checks and intercept Botanist network requests in an authenticated loopback browser session to assert zero automatic botanical POSTs.

## Release readiness

REWORK. The local playable scope is not accepted until the botanical safety and privacy boundary is repaired and the missing current-run browser checks pass. Production and clinical release remain separate gates.
