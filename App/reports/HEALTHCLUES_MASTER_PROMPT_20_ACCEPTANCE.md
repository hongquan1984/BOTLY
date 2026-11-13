## Pending journey activation regression ? 2026-11-02

The owner-facing message said the browser could not temporarily save journey information. Root cause was verified from the actual payload contract: the new two-question UI emitted raw factor IDs (for example, red-meat) while both pending-journey and Advisor schemas require a- IDs; also, the World profile parser rejected more than five answers although the Gout checklist permits twelve. Empty factor selections were also rejected by the API although the Quiz permits them. The generic error hid HTTP 400 as a browser-storage failure.

Fixes: normalize selected factor IDs to the established a- form while retaining none/unsure; permit 0?12 paired IDs/labels in activation and Advisor profile validation; preserve up to twelve IDs plus the exclusive states when hydrating the World profile; surface distinct localized validation, payload-size, service and connection errors while keeping the preview/answers.

Evidence: isolated production build passed. node scripts/test-healthclues-mp20-two-question-browser.mjs against http://127.0.0.1:3327/play completed the two-screen Gout Quiz and local activation-email submission; the pending-journey API returned HTTP 200 and the UI reached ?Check your email?. This synthetic fixture/browser flow did not complete email verification, authenticate, enter the World, invoke Gemini, or persist a Plan. Direct local API contract checks returned HTTP 200 and an encrypted cookie for both a 4-factor Gout profile and a zero-factor profile. Offline adaptive (13), Gemini mocked pipeline, and Plan contract (40+) suites passed. No live Gemini request, migration, seed or production write.

# HealthClues Master Prompt 20 — acceptance report (2026-11-02)

## Verdict

**Overall: PARTIAL.** The new-player question UI is changed to two local screens and a focused synthetic-browser UI scenario passed. The complete account → real World → recommendation activation/persistence journey is not yet verified. Real Gemini was not invoked. Botanist reviewed-content discovery remains content-blocked.

## Implemented changes

- `src/components/healthclues/HealthCluesGoalFirstDiscovery.tsx`: exactly two screens after world selection. Sleep Valley has sleep-only concerns; HealthClues Realm has health concerns including Gout, weight, blood glucose, blood pressure, headache/migraine, digestion, stress, general wellness, aging, beauty and Other. Factor lists vary for Gout, weight, glucose and sleep; unsupported/custom concerns use neutral factors. The second screen permits multiple selections, None, Unsure, optional note and no selected factors. It makes no adaptive API call and has no Gemini dependency.
- `src/app/api/healthclues/pending-journey/route.ts` and `src/app/api/healthclues/wellness-advisor/route.ts`: existing bounded profile schema accepts up to 12 matching multi-select IDs/labels, still rejecting malformed pairs. No DB change or migration.
- `src/features/healthclues/WorldAdventureScene.tsx` and `src/components/healthclues/WellnessPlanBuilder.tsx`: first-entry companion copy opens My Journey; recommendation cards are rendered in the same modal as selected goal/herb/practice state. In this central hub, valid selected A/B/Custom choices call the existing authenticated Plan API immediately; uncheck removes that suggestion from the current Plan revision, restores saved selected states on opening, and merges existing unrelated goals. The standalone Quiz Builder retains its global Confirm Plan behavior. Immediate authenticated persistence has not yet been browser-verified.
- Specs updated: `MASTER_SPEC.md`, `BUSINESS_RULES.md`, `USER_FLOWS.md`, `USE_CASES.md`, `UI_UX_SPEC.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `COMMUNITY_AND_PRIVACY_SPEC.md`, `DECISIONS_AND_ASSUMPTIONS.md`, `IMPLEMENTATION_PLAN.md`, `ACCEPTANCE_TESTS.md`, `CURRENT_STATE.md`.

## Evidence

- Final isolated production build passed for current source including `WorldAdventureScene.tsx`, immediate per-goal callback and Custom canonical identity/rehydration, with Next 16.3.0, TypeScript and static route generation. The fresh isolated Owner Demo at `http://127.0.0.1:3326/play` returned HTTP 200; its verified app process was rebuilt while preserving the reused local Supabase. No migrations or fixture seeds were run.
- `node scripts/test-healthclues-mp20-two-question-browser.mjs` passed against `http://127.0.0.1:3327/play`, using synthetic UI choices: HealthClues Realm → Gout → second multi-select screen → World preview; then Sleep concern/factors; then Weight Management factors. It asserted zero `/api/healthclues/adaptive-discovery` and zero `/api/healthclues/wellness-advisor` requests and no browser runtime exceptions. This was the UI-only run and did not activate an account. A separate synthetic local Mailpit run verified a Gout account and entered HealthClues Realm/Lumi directly; pending-journey API statuses were HTTP 200 and no Gemini response was used as evidence. One integrated run later observed an Advisor route request under Gemini-configured local runtime; status/output was not captured and no repeat was made.
- Visually inspected captures: `reports/previews/mp20-two-question-concern-desktop.png`, `mp20-two-question-gout-q2-desktop.png`, `mp20-two-question-gout-q2-mobile.png` (390×844), and `mp20-two-question-postquiz-mobile.png`. The mobile Quiz capture is a full-page tall screenshot, not full responsive/browser acceptance.
- Offline suites passed: adaptive-discovery contract (13 assertions), personalized Plan contract (40+), mocked Gemini pipeline. The localization browser suite failed to initialize Chrome CDP (`Page.enable` timeout); its earlier localization evidence predates MP20.
- Direct `node node_modules/typescript/bin/tsc --noEmit` was blocked by the existing stale root `.next/types/validator.ts` Route union. The final isolated Next build performed and passed its own TypeScript phase.
- No live Gemini inference, no synthetic-account activation in this MP20 test, no production access, migration, seed, commit, push or deployment.

## Verdict matrix

| Acceptance | Verdict | Evidence / remaining work |
|---|---|---|
| WORLD_SELECTION | PARTIAL | Existing world-first cards retained; no new MP20 regression scenario covering all eight regions. |
| TWO_QUESTION_QUIZ | PARTIAL | Gout, Sleep and Weight browser branches confirmed two screens and zero AI calls; Other and zero-factor branches pending. |
| CONDITION_SPECIFIC_FACTOR_CHECKLIST | PARTIAL | Source includes Gout/weight/glucose/sleep banks; browser directly exercised Gout, Weight and Sleep. Glucose/Other and clinical editorial review pending. |
| PERSONALIZED_GEMINI_CONTEXT | PARTIAL | Server prompt includes selectedWorld and adaptiveDiscovery; one Advisor endpoint request was observed on authenticated World entry, but its request body/provider response was not captured; a Gemini-configured runtime was active, so live inference cannot be ruled out. |
| RECOMMENDATION_QUALITY | BLOCKED | No real inference authorized or run; fixtures/offline tests do not prove AI quality. |
| INVENTORY_SUGGESTIONS | PARTIAL | Plan suggestion Builder is embedded in My Journey; live callback changes await final build/browser and API evidence. Herb/practice item previews remain unimplemented. |
| GOAL_FOLLOW_UNFOLLOW | PARTIAL | Central-hub code immediately posts valid choices and unchecks through the existing Plan contract; no authenticated click-through/readback/reload evidence yet. |
| BOTANIST_DISCOVERY | BLOCKED | No eligible human-reviewed botanical content verified; no fake content added. |
| WELLNESS_GUIDE_DISCOVERY | PARTIAL | Existing NPC/station remains; MP20 central inventory preview and actual selection path not tested. |
| NPC_EQUIPMENT_PERSISTENCE | PARTIAL | Existing authenticated equipment contracts remain; no MP20 account browser readback. |
| MY_JOURNEY | PARTIAL | Same modal now contains existing inventory plus suggestion builder; persistence after new Quiz activation not tested. |
| EN_VI | PARTIAL | Question copy is bilingual in source; localized browser handoff/profile persistence not tested. |
| FULL_E2E | BLOCKED | No activation → direct region → recommendations → NPC → My Journey persistence run for MP20. |

## Exact next work

Prepare a separate isolated Owner Demo with the Advisor disabled or intercepted before opening World, then verify saved concern/factor context and the honest no-plan/unavailable state after synthetic Gout activation. Test immediate selected A/B/Custom persistence, existing-goal preservation, uncheck, reload and account isolation. Test Other and zero-factor branches. Keep Botanist `CONTENT_BLOCKED` unless a real reviewed eligible local record is present.

## Follow-up — checklist first-screen visibility (2026-11-02)

**Source verdict: PARTIAL; owner UX review pending.** Source inspection found that first-entry already opened My Journey and mounted the real Advisor Plan Builder, but rendered its entire recommendations section last, below three inventory sections. That ordering concealed the personalized checklist below the panel's first view. `WorldAdventureScene.tsx` now renders the same section first; existing Advisor unavailable/retry handling and immediate authenticated per-goal save remain unchanged. No fixtures were substituted and no real inference was called during this follow-up.

Plan persistence contract: PASS (40+ offline assertions). Focused ESLint and isolated build were started; final outcome belongs to the current handoff. No E2E, browser screenshots, authenticated selection, actual Plan API write/readback, real Gemini output, or UX acceptance was performed. Keep Gemini quality and owner-visible runtime behavior unverified until owner testing.

Final verification: isolated production build passed (TypeScript and 81 routes); Plan contract passed (40+ assertions); docs consistency guard passed. ESLint stalled without output and was stopped; no lint PASS. Fresh current-source Owner Demo is running at `http://127.0.0.1:3328/play`, confirmed HTTP 200 with HealthClues content and verified dedicated app PID. Local Auth/REST/Mailpit reuse verification passed; no migration/seed. Gemini is configured server-side but was not called. No browser UX review, authenticated goal save/readback or real AI recommendation was performed. **Owner status: READY_FOR_OWNER_TEST; UX not yet accepted.**

## Follow-up — Advisor result lifecycle and goal following (2026-11-02)

Source trace confirms the handoff is wired end-to-end: saved two-question profile -> first World entry/Advisor Builder -> `POST /api/healthclues/wellness-advisor` -> server Gemini schema/safety validation -> UI `goals` -> checked valid A/B/Custom -> authenticated `POST /api/healthclues/plan` -> World reload and My Journey active-goal state. The observed historical Advisor request cannot be adjudicated without its request ID/outcome; this turn made no live Gemini request.

Changes: Builder now retains an account/world/profile/locale keyed in-memory response/failure snapshot across panel reopen, exposes lifecycle (`REQUEST_NOT_STARTED`, `GENERATING`, `SUCCESS_WITH_GOALS`, `PROVIDER_ERROR`, `VALIDATION_ERROR`, `NO_RECOMMENDATIONS`) plus sanitized request reference and error; only manual Retry bypasses its cache. Server logs a distinct `NO_RECOMMENDATIONS` terminal stage and already dedupes in-flight/cached same-profile Gemini work. World My Plan opens suggestions when Quiz profile exists. Individual-goal autosave no longer hides the suggestions, and a “Currently following” block appears beside them. Plan failure retains the pending goals and idempotency request key for a real retry. My Journey reload continues to source goals from the authenticated World API. No provider or Quiz data is emitted in diagnostics.

Evidence: production isolated Owner Demo build passed TypeScript and route generation (81 routes) on the current source. Plan contract passed (40+); mocked Gemini pipeline passed; docs guard passed. `/play` on `http://127.0.0.1:3328/play` returned HTTP 200; its build copy of `WellnessPlanBuilder.tsx` matched current source. Reuse-only local Auth/REST/Mailpit verification passed without migrations or seeds. ESLint stalled without output and was stopped. No live inference, browser journey, authenticated goal save/readback, screenshots or UX PASS.

Verdict: **READY_FOR_OWNER_TEST**. Owner should verify actual provider output and goal persistence in their synthetic account. Real Gemini generation and the result of the previously observed request remain unverified.


## Critical Gout context regression follow-up - 2026-11-03

Source root cause: verified activation loaded the existing account profile but saved the new Quiz profile only when no profile existed. Thus an older Sleep adaptiveDiscovery/topic could remain authoritative after a new Gout handoff. Separately, World entry chose the first active branch from an ascending list, allowing an older Sleep branch to override the new selected region. World/Plan APIs also selected the latest Plan per World without checking its Quiz context. These source defects can produce a Sleep Plan in a HealthClues Realm; they are independent of prompt quality.

Changes: activation merges the new profile and preserves account preferences/history; old Plan snapshots gain an opaque hash for their prior context. World entry uses the selected route/latest active branch. Advisor calls from World require a verified account and owned World, match the request to the saved profile, and send that saved profile to Gemini. Account/World/context scope isolates cached results. Context mismatches fail before inference, and stale Plan snapshots remain in history but are not returned as current. The Plan shows the selected concern and Q2 factors. Provider labels distinguish live response, cached/reused response, deterministic demo and synthetic fixture.

Evidence: synthetic offline Gout context regression PASS; existing personalized Plan contract PASS (40+ assertions); Gemini pipeline PASS; focused ESLint 0 errors (two hook-dependency warnings); isolated Next production build PASS including TypeScript and 81 routes. Active isolated Owner Demo: http://127.0.0.1:3327/play (HTTP 200). Catalog GET returned 200; unauthenticated World and Plan requests returned 401. Reuse verification confirmed local Auth/REST/Mailpit and explicitly made no migration/seed.

Not verified: no browser owner journey, no Plan API write/readback, and no Gemini inference was performed. The runtime has Gemini configured server-side; this is not evidence that a live request succeeds or that its Gout recommendations are good. Owner UX acceptance remains pending.
