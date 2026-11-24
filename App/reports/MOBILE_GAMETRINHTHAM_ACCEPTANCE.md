# Mobile Game Trinh Thám — Acceptance Evidence

## Scope

Player-facing game flow is implemented in `App/healthclues-mobile/Gametrinhtham` as a React Native mobile-first renderer. The existing web reference in `App/gametrinhtham` remains untouched by this change.

## Acceptance matrix

| Area | Evidence | State |
|---|---|---|
| No player iframe/WebView | `src/modules/detective/DetectiveWebViewModal.tsx` contains direct `MobileDetectiveGame` entry and no iframe/WebView | PASS |
| Generic campaign renderer | `MobileDetectiveGame.tsx` consumes campaign cases, chapters, scenes, clues and hypotheses | PASS |
| API/DB boundary | `dataAdapter.ts` loads campaign and submits solve through detective API routes | PASS locally; DB join remains backend responsibility |
| 9 Case 007 assets | `tests/fixtures/case-007-assets.json` enumerates 3 scene/character assets plus 6 clue closeups | PASS fixture |
| Type safety | `npx tsc --noEmit` from `healthclues-mobile` | PASS |
| Contract test | `node Gametrinhtham/tests/test-mobile-detective-contract.mjs` | PASS |
| Local browser smoke | Click Giải Mã → mở thư viện → chọn hồ sơ → Bắt đầu điều tra → scene hiển thị với hotspot và Sổ/Kết luận | PASS |
| Production acceptance | Not run against production | NOT CLAIMED |

## Known boundary

The mobile schema migration is a local artifact and has not been applied to production. The campaign API must expose the asset rows in each case payload before the full DB-backed 9-image path can be marked production-verified.

## QA continuation — 2026-11-20

- Added strict DB-backed mobile campaign route at `src/app/api/healthclues/mobile-detective/campaign/route.ts`; it returns `503` when the DB contract is unavailable instead of silently serving fixture data.
- Added root migration `supabase/migrations/20261120130000_healthclues_detective_case_assets.sql` and source-data sync script `scripts/sync-detective-campaign-db.mjs`. The sync script requires explicit `SUPABASE_URL` plus service credentials; it was not run against production.
- Added API integration test `healthclues-mobile/Gametrinhtham/tests/test-mobile-detective-api.mjs` plus `tests/local-db-contract-server.mjs`. The source-backed local contract server passes: 7 cases, Case 007 present, exactly 9 assets, and canonical clue fields. Browser/mobile viewport smoke passes Case 007 briefing → image scene → hotspot/closeup → hypotheses → submit/result. Real Supabase remains blocked by Docker host policy; isolated 3329 production artifact remains blocked by dependency/build environment.
- Added clue-shape normalization for `title/shortDescription/detailedObservation/icon` and removed hardcoded `localhost:5173` from player 3D runtime; missing configured 3D URL now shows a graceful fallback.
## 2026-11-23 — Web-parity implementation pass

The mobile renderer now covers the web game's player-facing investigation states: library/briefing, scene inspection, evidence notebook, unlocked Medical Handbook, unified conclusion candidate evaluation with star penalties, action checklist, legacy puzzle/deduction cards, solve persistence payload, and solved summary with conclusion/medical pearls/rewards. It remains a native React Native renderer without iframe/WebView.

Evidence:

- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json` — PASS.
- `npx expo export --platform web --output-dir dist-mobile-parity` — PASS, 3,203 modules.
- `node Gametrinhtham/tests/test-mobile-detective-contract.mjs` — PASS.
- `DETECTIVE_URL=http://127.0.0.1:3339 node Gametrinhtham/tests/test-mobile-detective-api.mjs` — PASS, 7 cases and 9 Case 007 assets.
- Fresh exported bundle served at `http://127.0.0.1:8082/world` — HTTP 200.

Parity boundary: mobile and web use the same campaign fields and conclusion semantics, while the mobile presentation is responsive/native rather than pixel-identical to the desktop web shell. Production persistence and physical-device QA are not claimed by this local acceptance.

Visual follow-up: the mobile shell now adopts the web reference language (mahogany header/background, parchment case cards and panels, bronze/gold borders, amber primary actions, green success/reward surfaces). Final export `dist-mobile-web-theme-final2` was served at `http://127.0.0.1:8085/world` with HTTP 200.

## 2026-11-23 — Professional UX / web comparison round 3

- The native mobile library now follows the web reference structure more closely: profile/EXP HUD, coin affordance, chapter selector, case preview image, state badge, difficulty, progress metadata and explicit “BẮT ĐẦU ĐIỀU TRA” CTA.
- Automated checks PASS: TypeScript, renderer contract, detective API contract and documentation guard. Browser-bundle acceptance is still open because the clean Expo export in this Windows workspace stopped after Metro initialization and emitted assets only; do not treat the source-level parity pass as browser verification.
## 2026-11-23 — Clean bundle verification round 4

- Cleared stale Metro processes and exported `dist-mobile-web-theme-final4` successfully: 3,203 modules, JS entry `entry-aaf366fa77d204203321cbbf16b23753.js`, `index.html` and metadata present.
- Exact bundle served at `http://127.0.0.1:8087/world` with HTTP `200`. TypeScript, renderer contract, detective API contract and docs guard PASS. Computer-use screenshot capture was unavailable due service timeout, so this is export/HTTP verified rather than screenshot-AI verified.
## 2026-11-23 — Visual QA round 5

- Chromium mobile flow PASS on the exact exported bundle: World → Giải Mã → Library → Briefing → Scene → Notebook. Screenshots were captured and inspected. Fixed briefing and notebook text contrast found by visual QA.
- Fixed web-only Haptics runtime error in World with a no-op adapter. Final browser run reports zero page errors; final export `dist-mobile-web-theme-final9` is served at `http://127.0.0.1:8092/world` (HTTP 200). TypeScript, renderer contract and API contract PASS.
## 2026-11-23 — Visual / UX audit round 6

- Full Chromium interaction matrix PASS on final13: World → Giải Mã → Library/chapter tab → Briefing → Scene → 6 hotspots → Notebook 6/6 → wrong answer → correct answer → checklist → solved rewards. Portrait and landscape overflow PASS; zero page errors.
- Detailed evidence: `reports/MOBILE_GAMETRINHTHAM_VISUAL_AUDIT_ROUND6.md`. Functional acceptance is PASS; exact visual parity is still PARTIAL for the conclusion board, which remains a native vertical evidence list rather than the web's connected board composition.
## 2026-11-23 — Deduction board parity round 7

- Conclusion UI now uses a two-column evidence board with connection status and selected cards, preserving wrong-answer star penalties, correct feedback, checklist and solved rewards. Final14 Chromium audit PASS with zero page errors.
- Decorative connector lines and central lock artwork from the desktop web reference remain a known visual delta; mobile semantics and board grouping are implemented.

## 2026-11-23 — Hotspot coordinate QA round 8

- Fixed mobile scene coordinate mapping for `resizeMode="contain"`: hotspot percentages are now resolved against the rendered image rectangle and its letterbox inset, keeping markers attached to the source objects on portrait screens.
- Fresh bundle `healthclues-mobile/dist-mobile-web-theme-final19` was browser-tested at `http://127.0.0.1:8100/world`. The scene screenshot shows all six markers aligned to the intended objects; the full flow reports `inspected 6`, reaches solved state, and reports zero page errors.
- Responsive checks pass at portrait `390×844` and landscape `844×390`; no horizontal overflow and chapter navigation remains clickable.

## Evidence gate follow-up — round 9

## Web-parity completion round 10

- Fresh bundle `healthclues-mobile/dist-mobile-web-theme-final27` was browser-tested at `http://127.0.0.1:8100/world`.
- Conclusion board now includes the web-inspired two-column layout, connector lines, central lock/chốt indicator and selected evidence states.
- Runtime evidence: 0/6 blocked, 5/6 blocked, 6/6 enabled; six inspections, notebook, wrong answer, correct answer, checklist and solved reward all PASS. Browser errors: 0.
- Responsive evidence: portrait 390×844 and landscape 844×390 both PASS with no horizontal overflow and working chapter navigation.

## Final QA round 11 — 2026-11-23

- Exact bundle `healthclues-mobile/dist-mobile-web-theme-final35` served at `http://127.0.0.1:8100/world`.
- Five flow rounds passed World → Giải Mã → Library → Briefing → Scene → six saved inspections → gated conclusion → wrong/correct evaluation → checklist → solved reward.
- Shared corkboard texture, two-column evidence cards, center lock and connectors are now present. Independent QA PASS confirms save/gate/button behavior, responsive layout and no runtime/network errors.

## Card layout refinement round 12 — 2026-11-23

- Deduction controls now sit below each title at the lower-right, preserving title readability.
- Library case cards now use thumbnail-left/content-right layout to remove unused whitespace and improve CTA hierarchy.
- `dist-mobile-web-theme-final36` flow and responsive checks PASS; no production deploy or commit performed.

## Conclusion UX round 13 — 2026-11-23

- Conclusion header now returns directly to `Sổ Manh Mối` for evidence review.
- Center lock/connector space is reserved between the two card columns; controls remain in a separate lower row without breaking card selection.
- `dist-mobile-web-theme-final42` full flow and portrait/landscape responsive checks PASS.

## Narrative / notebook / village round 14 — 2026-11-23

- Case 001 briefing now follows the Sleep Valley story: Luna reports a distress signal from An and asks the player to investigate the bedroom evidence.
- Notebook uses separate `Manh mối` and `Sổ tay` tabs for faster cross-reference on mobile.
- Added the missing local player-village URL configuration. `http://127.0.0.1:5179/village.html` and the exported mobile world bundle both return HTTP 200; the previous “Làng 3D chưa được cấu hình” fallback was caused by the absent environment variable.

- Added an explicit six-clue gate to both entry points into deduction/conclusion. At fewer than six saved clues, the action is disabled and the required count is shown; at six, it routes normally.
- Source guard and mobile TypeScript pass. Browser verification of this specific change remains open because the clean Expo export was blocked by Metro native out-of-memory (`AlignedAlloc Allocation failed`, exit 134).

## Verification round 15 — 2026-11-23

- Added and independently exercised an inline `Xem Sổ Tay liên quan` action on saved clues; it opens the Sổ Tay tab without losing the clue list.
- Independent runtime QA: authenticated world and 3D iframe PASS; detective collect/gate/conclusion/solved flow PASS; portrait and landscape overflow checks PASS; no JavaScript page errors observed.
- Persistence boundary: toolkit/inventory is DB-backed through authenticated mobile-toolkit APIs. Journey goals, XP and legacy check-in fallback still write AsyncStorage and remain outstanding before claiming complete DB-only persistence.

## World 3D routing correction round 16 — 2026-11-24

- Corrected the player-facing World 3D route to use `MyIslandScreen` and `Island3DCanvas` from the mobile `island3d` module. It no longer embeds the village runtime for this branch.
- TypeScript PASS; fresh Expo web export: `dist-mobile-web-island3d-fix`.

## World 3D test-server correction round 17 — 2026-11-24

- Added an SPA-fallback server for the exported Expo web build; `/world` now returns the build entry instead of a Python-server 404.
- Verified the served bundle contains the mobile island runtime (`MyIslandScreen` and `Island3DCanvas`). TypeScript, detective contract and docs consistency checks PASS.

## World/Dao3D routing and detective API correction round 18 — 2026-11-24

- Final route split: World 3D uses the floating village runtime; Home/Ngôi Nhà uses the player's Dao3D island runtime.
- Added SPA test-server proxying for the detective campaign and solve endpoints. Campaign GET and solve POST both return HTTP 200 through port 8100.
- Fresh export: `dist-mobile-web-village3d-correct`; TypeScript PASS and both runtime markers are present in the bundle.

## Detective asset serving correction round 19 — 2026-11-24

- Local SPA server now serves `public/gametrinhtham` assets. `scene-an-bedroom.png` returns HTTP 200 and the detective campaign endpoint returns HTTP 200, removing the black scene/empty thumbnail failure seen in the captured screenshots.

## Detective UX and localization round 20 — 2026-11-24

- English locale now changes the detective header, Case 001 briefing, scene actions and evidence-save labels; Vietnamese remains the default when locale is Vietnamese.
- Hotspot coordinates are hidden until tapped; the inspection panel is the interaction feedback.
- Briefing spacing was widened and the conclusion board now uses one evidence row per item with a centered connection lock.
- Fresh export `dist-mobile-web-ux-round20`; TypeScript and generic detective renderer contract PASS.

## P1 DB-backed persistence correction — 2026-11-24

- Corrected the persistence boundary for the mobile player flow: Journey goals/status, Daily Care check-ins, XP, solved detective cases and Toolkit Bag now use authenticated server APIs/DB-backed records. Device storage is retained only for session/onboarding/visual drafts and is not the progress source of truth.
- Added `src/app/api/healthclues/mobile-progress/route.ts` for profile-backed mobile goals/check-ins and idempotent XP ledger entries; `world/route.ts` returns the saved mobile goals. Updated `useWorld`, mobile healthclues service, and the legacy detective launcher to use the server contracts.
- Automated evidence: `npx tsc --noEmit` completed without diagnostics; `node Gametrinhtham/tests/test-mobile-detective-contract.mjs` PASS; `node tests/test-mobile-persistence-contract.mjs` PASS.
- NOT VERIFIED: live API contract/browser cross-device test because local backend port 3329 was not running during this pass. Fresh Expo web export is still required before release acceptance; no production data/deploy was touched.

## P1 QA retest correction — 2026-11-24

- Fixed authenticated campaign/solve calls: `dataAdapter.ts` now loads the stored Supabase access token automatically. The briefing CTA has an explicit `setMode("scene")` transition.
- Removed demo identities, demo JWTs, dev fallback tokens and the special demo password path from `services/auth.ts`; failed Auth is surfaced instead of fabricating a session.
- Replaced local economy persistence for coins/EXP with authenticated `mobile-progress` reads/writes. Detective progress is API/DB-only.
- Solve API and DB progress mapping now round-trip `selectedConclusionIds`, `wrongConclusionAttempts` and `puzzleStates` through `board_connections` while preserving the existing RPC contract.
- Evidence: mobile `tsc --noEmit` PASS; `test-mobile-persistence-contract.mjs` PASS; generic detective contract PASS; fresh export `dist-p1-db-persistence-qa-final` PASS. Unauthenticated campaign call to `http://127.0.0.1:3329` returned 401 as expected.
- BLOCKED: authenticated API/browser cross-device test. Local Supabase `127.0.0.1:54321` is closed, so no real bearer session or DB readback was available. No authenticated PASS claim, production write, deploy or commit.

## Hands-on gameplay QA round 27 — 2026-11-24

- Fresh bundle: `healthclues-mobile/dist-mobile-web-ux-round27`, served through the SPA/API fixture at `http://127.0.0.1:8100/world`.
- Independent mobile Chromium run PASS: English selection → demo login → World → `Investigate` → Case 001 library → `START INVESTIGATION` → scene → hidden hotspot touch feedback → evidence inspection → save → green ✓ → Journal → `Open Medical Guide` → six handbook entries → `Conclusion`.
- Runtime evidence: `Journal (6)`, `Medical Field Guide · 6`, English conclusion text, `6/6` clue gate and zero page/console errors. The conclusion screenshot was visually inspected; evidence cards are one per row, title space is preserved, and controls are on a dedicated lower row.
- Direct World 3D check PASS at `http://127.0.0.1:5173/?mode=player`: village scene rendered at mobile viewport; the loading veil is released once the playable shell exists while optional models stream. No console/page errors observed.
- Remaining release boundary: live cross-device DB persistence still requires a running authenticated backend on port 3329; this round intentionally used the local detective fixture and does not claim production persistence acceptance.

## Language polish round 28 — 2026-11-24

- Added the final English decoy label on the Case 001 deduction board and served the resulting export as `healthclues-mobile/dist-mobile-web-ux-round28` at `http://127.0.0.1:8100/world`.
- No functional flow changed from round 27; the six-clue, Medical Field Guide, English conclusion and zero-error browser evidence remains valid, with this round closing the last visible mixed-language label.
