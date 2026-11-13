## 2026-11-02 — Plan contract regression assertion maintenance

The initial `node scripts/test-healthclues-personalized-plan-contract.mjs` run failed at a brittle source regex that required `Include goal` text within 260 characters after the checkbox input. The redesigned component retains both the `included` state binding and localized accessible label, but renders them in different JSX attributes/elements. Updated the source contract to assert these independently. The UI was not changed.

- Personalized-plan contract: PASS (40+ assertions) after test-only correction.
- Gemini plan pipeline: PASS (offline mocked provider/parser/schema/A-B mapping suite).
- Adaptive discovery contract: PASS (13 assertions).
- Owner Demo preflight: PASS; dedicated local Auth/REST/Mailpit healthy, remote Supabase URL not inherited, secrets not printed.
- No Gemini call, account mutation, migration, seed, production access, commit or deployment.

This does not close the authenticated returning legacy browser regression or original 96-answer retention gap. A human-reviewed eligible botanical item remains unavailable and is required before item Save/Equip acceptance. See `CURRENT_STATE.md` for the next task.

## 2026-11-02 — Botanist / Plan Builder / My Journey visual redesign

**BOTANIST_VISUAL_ACCEPTANCE: PASS for localized Talk greeting and the actual no-eligible-reviewed-botanical empty state. PLAN_BUILDER_VISUAL_ACCEPTANCE: PASS for interactive responsive cards and controls, verified through opened Chromium screenshots. MY_JOURNEY_VISUAL_ACCEPTANCE: PASS for the three expanded localized sections, real equipment empty states and desktop/mobile scrolling. FUNCTIONAL_REGRESSION: PASS for the synthetic fixture Plan flow. EN_VI_LOCALIZATION: PASS for bilingual recommendation fixture display and labels.**

Current source was built in isolated Next.js 16.3 as `healthclues-visual-redesign-r3-20261102`, served at `http://127.0.0.1:3322/play`, reusing the local Owner Demo Supabase read-only. No Gemini inference, migration, seed, reset, production access, deploy, commit or push occurred.

The reference `references/healthclues-plan-reference.png` exists and was opened. The page reproduces its companion speech, warm parchment palette, illustrated goal icons, left/right card hierarchy, independent checkboxes, subdued unchecked cards, disclaimer, count and confirmation hierarchy. It adapts the ornate tall image frame into responsive scrollable HTML and uses the existing 12 SVG goal icons. The initial 390×844 viewport shows the introduction; paired captures scrolled to goal cards verify the controls.

Botanist shows the existing NPC on a localized Talk banner, a separate localized station greeting and only eligible botanical entries. No reviewed botanical entry qualifies for the current Journey, so the honest empty state is the accepted screen; no unrelated test nutrition fixtures are shown. No Save/Equip item-card success is claimed. My Journey remains separate from Plan Builder and keeps Daily Checklist, Herbs Equipped and Practices Equipped expanded, with actual statuses, empty states and inner scrolling.

Actual test: `node scripts/test-healthclues-mp17-goal-first-browser.mjs` exited 0 against port 3322. Two fresh authenticated synthetic accounts exercised Account A A/B/Custom selection, omitted goal 4, Plan API save/reload, EN/VI snapshot stability, zero selection, standalone authored goal, and cross-account Plan/profile read/write denial. Both Advisor requests were intercepted locally. Runtime exceptions: 0. Gemini was not contacted.

Opened screenshot evidence in `reports/previews/visual-redesign-20261102/` includes `account-a-vi-botanist-npc-greeting-desktop.png`, `account-a-vi-botanist-empty-desktop.png`, `botanist-empty-mobile.png`, `account-a-vi-plan-builder-vi-unselected-desktop.png`, `account-b-en-gout-plan-builder-en-unselected-desktop.png`, `account-a-vi-plan-builder-selected-unselected-desktop.png`, `account-a-vi-plan-builder-custom-option-desktop.png`, `account-a-vi-plan-builder-vi-mobile-goals.png`, `account-b-en-gout-plan-builder-en-mobile-goals.png`, `account-a-vi-custom-goal-my-journey-desktop.png`, `account-a-vi-journey-lower-desktop.png`, and `account-a-vi-journey-lower-mobile.png`.

**Remaining gaps:** no eligible botanical card is available to exercise Save/Equip visually. Synthetic fixture success is not live Gemini or recommendation-quality evidence. Existing legacy login was not rerun in this visual pass; historical 96-question answers remain unverifiable because no saved answer array was found. Physical mobile hardware was not tested. Focused ESLint exited 0 with two warnings in `WellnessEncyclopediaStation.tsx` (effect dependency `tx`; existing `<img>` optimization advice). The docs consistency guard ran and its `App/MASTER_SPEC.md` reminder was reviewed against the affected presentation-only scope.

## MP17 final legacy and Custom regression ? 2026-11-02

**Legacy account compatibility: PARTIAL. AI-card Custom persistence: PASS (synthetic fixture). EN/VI visual switching: PARTIAL.** Runtime: isolated local Owner Demo at `http://127.0.0.1:3316/play`. No Gemini inference, production access, migration, seed, reset, deploy, commit, or push occurred.

### Legacy account compatibility

- Read-only metadata showed 412 synthetic legacy-shaped profiles without `adaptiveDiscovery`; 405 have a World, 92 have a saved Plan, and 133 have equipped toolkit entries. No legacy-shaped profile contained an `answers` or `quizAnswers` array. Source inspection shows the old 96-question draft is stored in tab `sessionStorage`; the profile-save UI explicitly states that full Quiz answers are not saved.
- `node scripts/test-healthclues-localization.mjs` passed in Chromium against the same local build: an in-progress old Quiz draft retained canonical answers and question position through EN/VI switching and reload. It tested a guest/tab draft, not a returning authenticated account. Captures are in `previews/mp17-final-legacy-quiz-draft-20261102/`.
- No existing legacy account was modified, and a browser sign-in to an existing legacy-shaped account was not completed. This task cannot establish retention of original 96-question answers from the available persistent data. Legacy account compatibility remains **PARTIAL**, including browser verification of existing World, Plan, equipment, locale and duplicate-goal behavior.

### Custom within an AI card and standalone goal

- Chromium selected Custom on AI recommendation 3, entered `My test choice: note 1 drink pattern weekly`, confirmed through the actual authenticated Plan API, opened My Journey and reloaded. The saved Plan had exactly 3 Active goals: `ai:b0617572-14e2-460d-8e2a-2be51b70c748` (A), `ai:70a44c93-7e37-440a-8908-8762f58689cd` (B), and `95b724f1-87f8-45fa-80be-11d9947e8407` (Custom). Goal 4 and recommendation 3's A/B alternatives were absent. There were no duplicate goal IDs.
- Custom persisted as `user_created`, with the same exact text in `title`, `trackingDefinition`, and `originalNote`. No `sourceRecommendationId`/`derivedFromGoalId` field exists in the current Plan persistence contract; a durable link to the originating AI recommendation is not supported. The selected AI card is associated client-side during the builder session.
- `Add My Own Goal` was independently exercised after confirming a zero-goal Plan in the other synthetic account; its note persisted as `user_created` and Saved for Later.

### EN/VI visual switching

- Chromium switched the same saved Plan VI ? EN ? VI, reopened the same playable region and My Journey, and captured the actual visible panel in each language. Rendered goal IDs were identical in both views; the two A/B numeric action values stayed identical in authenticated Plan readbacks; the custom text remained unchanged; no Advisor request regenerated the Plan. The top-level labels and My Journey headings were localized and the World/My Journey remained accessible.
- **Partial:** the English capture still displays the two AI-generated goal titles in Vietnamese. The Plan preserves text in the locale selected when choosing the goals, but does not render its bilingual counterpart in My Journey. Screenshots: [EN My Journey](previews/mp17-final-legacy-custom-visual5-20261102/account-a-vi-same-plan-my-journey-en.png), [VI My Journey](previews/mp17-final-legacy-custom-visual5-20261102/account-a-vi-same-plan-my-journey-vi.png). Both were visually inspected.

### Live AI persistence readiness

The provider output is mapped by the existing `toAiPlanGoal` path into the same `/api/healthclues/plan` contract; the route validates its signed Advisor proof and persists to the authenticated profile used by the fixture E2E. This is a source-path review, not proof that a real Gemini response was saved. No live provider call was made, so live inference, persistence of actual provider output, and AI recommendation quality remain **UNVERIFIED**.

**Evidence:** the final fixture Chromium harness passed with 0 runtime exceptions and all three Advisor calls intercepted locally. It included AI-card Custom, Plan read/reload, zero-goal behavior, standalone `Add My Own Goal`, two-account isolation, and both locale views. Local account/profile aggregation was read-only; no existing synthetic legacy account was changed.

**Next exact task:** resolve or explicitly accept the untranslated AI content shown in EN, then use Chromium to sign in to an existing synthetic legacy-shaped account with a Plan and equipped items. Do not claim original 96-answer retention unless there is a persisted legacy answer source; current profile storage does not have one.

---

# HealthClues Master Prompt 17 — Acceptance checkpoint

## MP17 final functional Plan acceptance — 2026-11-02

**FUNCTIONAL_PLAN_E2E: PASS (synthetic fixture only). REAL_GEMINI_INFERENCE: NOT RUN. AI_RECOMMENDATION_QUALITY: NOT ASSESSED in this task.** Final successful Chromium run used `http://127.0.0.1:3316/play`, isolated Owner Demo build `mp17-final-plan-r3-20261102`, and the existing local Supabase/Auth/Mailpit project. It created two new synthetic local accounts, completed concern-first onboarding and actual region/Plan UI, and persisted through the existing authenticated `/api/healthclues/plan` endpoint. No production or remote service was accessed; no migration, seed, reset, commit, push or deployment occurred.

- Account A: synthetic VI/Gout, HealthClues Realm/Lumi. Exactly three Active goals were saved and read back: `Ghi nhận lựa chọn đồ uống` (A; note sugary-drink choices on 1 day this week), `Quan sát nếp ăn` (B; note 2 meal choices this week without a food limit), and Custom `My test choice: note 1 drink pattern weekly`. Goal 4 stayed unchecked and was absent. IDs: `ai:9e3e5c2e-997e-4189-a2aa-092de2c442ea`, `ai:5dbb0685-c968-4a65-ac78-8baeba38bc66`, `4d1f96c6-3eca-44dd-9e3f-81d9c3a757d9`. My Journey showed exactly the selected goals; reload and API readback preserved the same IDs, A/B/custom levels, numbers and exact custom note with no duplicates.
- EN/VI locale switches were exercised. Each subsequent authenticated Plan API read had the same canonical goal IDs, active states, A/B choice levels, numeric action values and Custom text. Locale navigation returned to the World surface; the visible My Journey itself was verified before locale changes and after reload, not claimed visible in each locale-switch screenshot.
- Account B: synthetic EN/Sleep, Sleep Valley/Luna. Confirmed an empty Plan with zero selected goals; its later user-authored note remained byte-for-byte unchanged and Saved for Later. Account B's profile RLS query did not return Account A's row. Plan GET and POST for another account's World returned 404 in both directions. Local test accounts/data were retained.
- All 3 Advisor requests were intercepted in Chromium and fulfilled from test-only local behavior; no route invocation reached the Gemini adapter. Browser runtime exceptions: 0. Synthetic status remains visible in the Advisor UI and was retained on signed fixture goals by the local Plan API. This is not Gemini inference or recommendation-quality evidence.
- Screenshots captured and visually inspected: `reports/previews/mp17-goal-first-fixture/account-a-vi-synthetic-recommendations-desktop.png`, `account-a-vi-confirmed-plan-desktop.png`, `account-a-vi-custom-goal-my-journey-desktop.png`, `account-a-vi-custom-goal-my-journey-mobile.png`, `account-b-en-sleep-zero-goal-plan-confirm-desktop.png`.
- Runtime readiness was inspected without a provider call: latest isolated source copies match the route/schema files; the launcher reported Gemini configured server-side only, with model `gemini-3.8-flash`; there are no application mock injection flags. The simplified personalized adapter uses one SDK attempt. The output schema requires up to six bilingual title/reason/A/B goals, and successful telemetry counts `goals.length`.
- Offline personalized-plan and mocked Gemini pipeline suites pass. A live refined-prompt inference remains unrun. AI recommendation quality after the prompt refinement remains **UNVERIFIED**.

The latest acceptance harness excludes the separate NPC interaction/re-login regression so this result stays scoped to Plan persistence; existing World, Pet and NPC source behavior was not changed. MP17's overall release status remains partial pending live AI assessment and remaining legacy account coverage.

## One controlled live Gemini acceptance request — 2026-11-02

Exactly one real SDK inference was run through the current unmocked local route with the synthetic Vietnamese Sleep profile. PowerShell 5.1 captured application status/body/request ID; there were no retries or subsequent Gemini calls.

- Application: **503**, JSON, `RESPONSE_SCHEMA_MISMATCH`, request ID `dfc91e62-8e4a-44a8-894f-ae4b62e5803b`; client duration 12,827 ms, server 12,562 ms.
- Provider: **reached**, successful SDK response; stage log records provider status **200**. The response was genuine runtime Gemini output, not the test preload/fixture.
- Pipeline passed receipt, input validation, adapter start/request, provider response, JSON extraction and JSON parsing. It failed at `SCHEMA_VALIDATED`; last completed stage `JSON_PARSED`.
- Four paths failed: `goals[0].goalId` through `goals[3].goalId`. Canonical schema requires lowercase ASCII string pattern `^[a-z][a-z0-9-]{2,59}$`. Logs intentionally stored paths only, not raw values or Zod issue codes/types; exact received-value defect (missing, wrong type, or invalid pattern) cannot be reconstructed.
- **0 valid goals**; no safety validation, A/B mapping or Plan save occurred. Quality and Vietnamese localization could not be evaluated from the response. No account data was changed.
- Final status: **REAL_GEMINI_PARTIAL**. Do not retry without new authorization. Future sanitized diagnostics should include issue code/expected/received types while continuing to omit actual values.


## Diagnostic runtime activation and HTTP mock verification — 2026-11-02

- Current-source owner-demo build `gemini-diagnostics-20261102` runs at `http://127.0.0.1:3312/play` (Node PID 20808 at final inspection). Process command and compiled route artifact match the named build; existing port 3311 remains running.
- Local Supabase reuse preflight passed for Auth/REST/Mailpit and loopback API; no migration or seed occurred. `.env.local` was not changed.
- The correct private server file `App/secrets/healthclues-owner-demo.env` is present; key/model/provider settings were checked only for presence and validity. Launcher reported Gemini configured server-side, and matched runtime `ADVISOR_STARTED` logs confirm provider/model settings loaded. Scanned 67 client JS chunks: no API key value or public Gemini key variable found.
- HTTP route mock success: synthetic A/B response returned 200 and one validated recommendation. Mock upstream 503: PowerShell 5.1 captured sanitized application 503 JSON, content type and correlation ID; route logs recorded upstream 503 and `PROVIDER_UNAVAILABLE`. Mock missing `optionB`: route returned `RESPONSE_SCHEMA_MISMATCH` at `SCHEMA_VALIDATED`, with sanitized path. All correlation IDs matched server logs.
- Mock transport existed only in an external preload guarded to this loopback Owner Demo build. After smoke tests the server was restarted from the same latest source without preload/mock variables; mock case file was removed. Final local process has diagnostics but no active mock injection.
- No live Gemini request was made. Verdict: **READY_FOR_ONE_LIVE_SYNTHETIC_TEST**. The test remains unrun pending a separate explicit request.

## HTTP 503 diagnosis and safe failure observability — 2026-11-02

- Request inspection identified `POST /api/healthclues/wellness-advisor`, handled by the Next route at `src/app/api/healthclues/wellness-advisor/route.ts`, on loopback port 3311 (Node PID 15928 at inspection). Its `unavailable()` helper emits an `AI_UNAVAILABLE` JSON body; the main catch maps internal failures to application 503. Application 503 alone does not prove the Gemini SDK was reached or returned 503.
- The prior PowerShell 5.1 `Invoke-RestMethod` failure did not preserve the `WebException.Response` stream or request ID. Its response body cannot be reconstructed from the sanitized build log; provider reachability remains unknown.
- The local PowerShell helper now explicitly reads the non-success response stream, reports application status/content type/correlation ID and whitelists safe JSON fields. API responses carry `X-Request-Id`. Server stage events distinguish request validation, provider invocation/response, JSON parse, schema/safety validation and completion. Failure events carry nullable provider status and sanitized paths only.
- Mock-only tests pass for provider 402/429/503, valid JSON with Level A/B through parser and mapper, malformed JSON, missing `optionB`, network failure, and backend schema preflight that avoids provider invocation. A mock HTTP 503 confirms PowerShell 5.1 captures the body and excludes injected key/profile/prompt values.
- No live Gemini request occurred in this diagnostic task. The isolated build and TypeScript check pass; the updated server was not started and its current runtime provider configuration was not checked. Overall live provider acceptance remains **PARTIAL**. One controlled synthetic request is not ready until those local checks and explicit authorization; it must not run automatically.


## Gemini retry — 2026-11-02

At owner request, one request was sent to the isolated loopback Advisor endpoint with a synthetic English Sleep profile. The endpoint returned HTTP 503; PowerShell surfaced only `Server Unavailable`, not the JSON diagnostic body. This does not confirm whether the request reached Gemini or whether the previous `INVALID_SCHEMA` persists. No goals were returned, no provider success is claimed, and no second request was sent. No production service or real user data was used.

## Updated checkpoint — persistent goal API, account isolation and logout/login (2026-11-01)

**Overall MP17: PARTIAL.** Fresh isolated reuse-only build: `http://127.0.0.1:3310/play`. No production service, migrations, volume reset, Docker reset or billing was touched.

### Verified in this checkpoint

- `scripts/test-healthclues-mp17-goal-first-browser.mjs` completed a real Chromium journey for two new local synthetic accounts: Vietnamese HealthClues Realm/Lumi and English Sleep Valley/Luna. Both selected locale, completed two synthetic adaptive questions (the browser disclosed these as test-intercepted replies), passed local Mailpit account verification, entered the real World, confirmed zero goals, added a personal goal through the UI and existing authenticated Plan API, opened all three My Journey sections, reloaded, logged out and signed back in. Result: `PASS_SYNTHETIC_QUESTIONS_LOCAL_AUTH_A_B_CUSTOM_PLAN_API_PERSISTENCE_ACCOUNT_ISOLATION_AND_RETURNING_WORLD`; browser runtime exceptions: 0.
- A real persistence API test used two locally signed, schema/source/safety-validated **synthetic-only** suggestion contracts for those just-created synthetic accounts. It persisted exactly three chosen rows: goal 1 `generatedOption.option=A`, goal 2 `generatedOption.option=B`, and the original user-authored custom note, selected as active. A fourth generated test suggestion was omitted as deselected. API readback retained selected option/action and exact custom text; target quantities remain null because the onboarding profile lacks a structured numeric baseline. Repeating the same request key reused the same Plan version; post-login API GET still returned exactly 3 goals. This proves the real Plan API and database path with test contracts; it does not prove live Gemini output or persisted selections coming from actual AI cards.
- The first manual Add My Own Goal operation is honestly `Saved for Later` until selected/configured. In the synthetic persisted-selection contract, the same exact player-authored text was then selected as the Custom implementation and confirmed active. The separate UI-only browser test exercised independent include checkbox, A/B and Custom interactions (16 assertions), but its AI fixture responses are explicitly non-persistable.
- Each account retained its own preferred locale, adaptive focus, World and distinct goals. Foreign profile read returned an empty RLS result; cross-account Plan GET and POST both returned 404 in both directions. Re-login preserved confirmed account identity, locale and all three saved goals.
- Returning Sleep Valley account loaded its existing World without new-player onboarding. This account was created in this test; a returning account with historical answers from the original 96-question Quiz was not exercised in this checkpoint.
- The Vietnamese auth callback was fixed to route `next=/vi/wellness/healthclues/world` through `WorldAuthCallback`; the earlier observed fallback to generic BOTLY Account is resolved. New screenshots were opened/visually inspected at `reports/previews/mp17-goal-first-fixture/account-a-vi-after-logout-login-mobile.png` and `reports/previews/mp17-goal-first-fixture/account-b-en-sleep-after-logout-login-mobile.png`. Both show exactly the confirmed selected set alongside the three visible Journey sections. Other desktop/mobile captures are in the same directory.
- The first re-login test encountered the returning-player Pet guide before My Journey. The harness now explicitly skips this replayable guide, waits for all three persisted titles to load, and captures both desktop and mobile. The localization browser harness was updated to test the new Vietnamese concern-first screen and to use `?step=quest` only for the returning-player legacy Quiz regression; it passes the shared question/answer position check and mobile width checks.
- Focused suites: adaptive discovery 13 assertions PASS; Wellness Plan validation/safety 42 PASS; AI contract/signature rules 14 PASS; plan-selection UI fixture 16 PASS with zero runtime exceptions; localization browser PASS (goal-first EN/VI entry and legacy canonical Quiz position); integrated Chromium E2E PASS with zero runtime exceptions.

### Still partial / blocked

- **Real Gemini:** no provider request was sent in this run. Latest recorded genuine invocation requested `gemini-3.8-flash` and the application returned 503 `INVALID_SCHEMA`, with no goals available. An earlier real provider test returned HTTP 402 `BILLING_REQUIRED`. No live Gemini inference PASS is claimed.
- **Plan card-to-persistence end-to-end:** in-World card UI interactions are fixture-tested separately; persistence uses the same real authenticated API with locally generated signed synthetic contracts. A live signed Advisor result is not available to drive actual cards through confirm.
- **Legacy account:** full preservation of an existing profile with historical original 96-question answers, confirmed plan and equipment remains NOT VERIFIED by this latest test.
- **Localization/regression:** EN/VI onboarding, account locale lifecycle, Plan and My Journey were verified. Full NPC dialogue, accessible game content and direct NPC interactions in both locales remain PARTIAL.

**Exact next executable task:** once a valid signed Gemini response is available, drive the real in-World recommendation cards through A/B/custom, deselection, confirmation, My Journey, reload and logout/login without fixtures. Independently run a legacy 96-question profile and EN/VI NPC regression. MP17 stays PARTIAL.

Date: 2026-11-01  
Status: **PARTIAL — no end-to-end acceptance claimed**

## Scope and checkpoint

The repository already contained the unfinished MP16 personalized-plan work and broad uncommitted source. Those changes, account data, local Supabase and legacy Quiz bank were preserved. The product request now changes first-time sequencing: concern-first adaptive questions, verified activation, enter World, then Pet-led optional goal selection. This supersedes the older pre-World Plan flow for new players. The existing source still uses its old fixed Quiz → Reveal → pre-World Plan flow.

Two narrow vertical slices were implemented. In `src/components/healthclues/WellnessPlanBuilder.tsx`, an AI suggestion's checkbox governs inclusion separately from its A/B/custom radio mode. Both the default-unchecked state and the remove-on-uncheck behavior are represented in state. The selected count displays independently. Choosing an implementation alone does not place it in the pending plan; a checked goal with no implementation is kept out until one is selected. Existing Plan confirmation and APIs remain authoritative. Vietnamese labels were added to `src/lib/healthclues-i18n.ts`.

An isolated server-side adaptive-discovery Gemini contract was added in `src/features/healthclues/adaptive-discovery.ts` and `src/app/api/healthclues/adaptive-discovery/route.ts`. It accepts one canonical focus and up to four categorical question/answer pairs, returns only one localized choice question or `done`, rejects duplicate/repeated IDs and malformed/too-early completion, has no treatment/recommendation role, and is gated to the local Owner Demo. The UI does not call this endpoint yet.

## Requirement matrix

| Requirement | State | Evidence |
|---|---|---|
| Preserve existing Quiz, World, accounts and uncommitted changes | COMPLETE for actions in this session | No destructive Git, data, container, production or deployment operation was run. |
| Independent goal checkbox vs A/B/custom choice in existing Builder | PASS for synthetic UI interaction only | Chromium verified unchecked defaults, A/B independence, check/uncheck count and Custom. Never tested genuine Gemini response. |
| Structured adaptive question contract / local Gemini route | IMPLEMENTED, unit tested; not browser-wired | Strict schemas and route-level source are present; no provider call made. |
| New-player concern-first discovery | NOT STARTED | Existing `HealthCluesQuiz` still opens fixed bank flow. |
| AI adaptive question API / personalized structured discovery | PARTIAL | Strict local-only Gemini endpoint and response schema are implemented and unit tested; no player UI calls it and no real inference was made. |
| Account activation and profile persistence for new discovery shape | NOT STARTED | Existing activation path still carries legacy profile/optional pre-World plan. |
| Recommendation panel inside World after Pet welcome | NOT STARTED | Current Plan Builder remains pre-World; no World panel changes. |
| Selected-only confirmed Plan persistence | EXISTING MP16 path retained; new checkbox integration unverified | Existing signed AI goal + authenticated Plan API remain in source. |
| Gemini inference | BLOCKED by known provider status | Prior genuine synthetic calls returned HTTP 402/BILLING_REQUIRED. No provider request was repeated. |
| Chromium UI controls, goal icon rendering and companion presentation | PASS, synthetic-only | Final 16 assertions on isolated build `http://127.0.0.1:3305/play`: loaded/tinted SVG geometry, real Luna/English and Lumi/Vietnamese bubble, independent checkbox/A/B/custom, EN desktop + EN/VI mobile, 0 runtime errors. Captures inspected at `reports/previews/mp17-plan-selection-fixture/`. |
| Full player journey, Gemini, persistence and account-isolation acceptance | NOT RUN | No new concern-to-World flow or authenticated Plan lifecycle was tested. |

## Known safety/data boundaries

- No static recommendation or question is labeled as Gemini output.
- Current profile has no structured habit frequency/quantity baselines; the MP16 server validator rejects unsupported numerical targets.
- The 96-question bank and stored old Quiz answers remain intact for existing accounts and rollback. Do not synthesize answers to fit the new profile shape.
- Eight region IDs and the two-playable-region rule are unchanged.

## Verification record

- `node scripts/test-healthclues-personalized-plan-contract.mjs`: PASS, 14 assertions (schema, source/safety, relevance, numeric target rejection, signed persistence). Existing MP16 suite, not MP17 adaptive-flow coverage.
- `node scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions (existing Plan rules/safety).
- `node scripts/test-healthclues-adaptive-discovery.mjs`: PASS, 11 assertions (canonical IDs, locale, maximum questions/input size, duplicate/repeated questions, minimum question count).
- `node_modules/.bin/eslint.cmd` on changed UI, localization, adaptive API/contracts and E2E scripts: PASS, no output/errors.
- `node scripts/build-healthclues-isolated.mjs`: PASS, production compile, TypeScript and static generation; isolated output cleaned by its own build script, baselines preserved. An initial attempt caught a duplicate `of` key in the translation dictionary; removed the duplicate and changed the count separator to `/`; final build passed.
- `node scripts/healthclues-owner-demo-preflight.mjs`: PASS for `healthclues-owner-demo`, local API `127.0.0.1:54321`, Auth/REST/Mailpit reachable, no inherited remote Supabase environment detected, secrets not printed.
- Latest authenticated isolated build (reuse-only, no migration/seed): `http://127.0.0.1:3304/play`; HTTP 200 and `HealthClues · Your Wellness Adventure | Botly`. Includes checkbox separation, adaptive API and synthetic-test UI guard. Local Supabase and persistent data were retained; no migration/seed.
- `npm run docs:healthclues:check ...`: PASS; all recommended documentation targets were supplied. This check is only a consistency guard.
- `node scripts/test-healthclues-mp17-plan-selection-browser.mjs`: PASS **synthetic UI only**, 13 assertions. CDP intercept labels the response `SYNTHETIC TEST`, prevents persistence, verifies unchecked state, A/B/checkbox independence, `0/2 → 1/2 → 0/2`, Custom mode, Vietnamese copy, mobile width and zero uncaught exceptions. Real Gemini was not called; no account or database writes occurred. Screenshots opened and inspected: `reports/previews/mp17-plan-selection-fixture/desktop-unselected.png`, `mobile-custom-selected.png`, `vietnamese-mobile-selected.png`.
- This browser evidence does not verify genuine AI output, full Quiz completion, account activation, real World, Plan save/reload, zero-goal persistence, account isolation or end-to-end sequencing.
- No real Gemini inference or adaptive-question HTTP request, activation for the new profile shape, or post-entry World Plan acceptance was performed.

Overall MP17: **PARTIAL**. Narrow API/UI contract and synthetic UI behavior are verified. The concern-first onboarding and full new-player acceptance are not implemented.

## Exact next task

Connect a reversible, localized concern-first new-player branch to the existing adaptive-question endpoint. Carry canonical concern/answer IDs through the existing encrypted activation handoff and account profile without making up legacy answers. Then show post-entry recommendations inside the authenticated World before the current Pet/My Journey guide, reuse the signed goal/Plan API, and verify both locales on isolated Chromium desktop/mobile with real authentication, zero-goal, reload and account-isolation checks. Keep no-provider behavior honest and playable.
## Addendum — RPG visual asset checkpoint — 2026-11-01

**Scoped result: PARTIAL; end-to-end MP17 remains PARTIAL.**

- The specified image exists at `App/references/healthclues-plan-reference.png` (not at the alternate `design/references` location). It was inspected and used for card composition/art direction only; its sample goal copy and medical claims were not reused.
- Reused the original HealthClues World artwork, the shared player adventurer and the existing in-code Luna/Lumi Pet art without replacement. Existing My Journey icons remain Game-icons.net adaptations under CC BY 3.0, with pinned source revision and creator attribution in `public/healthclues/assets/ui/my-journey/ATTRIBUTION.md`. No Kenney pack was imported.
- Added 12 separate, project-authored SVG category silhouettes with provenance documentation in `public/healthclues/assets/ui/goal-icons/ATTRIBUTION.md`. Seven canonical discovery category mappings are exposed for future UI; five icons cover plan domains (hydration, nutrition, movement, relaxation, general habit). Dynamic plan cards choose a relevant icon from validated category/text signals, and selected cards receive a restrained botanical/gold treatment. This is vector UI artwork, not custom hand-painted raster illustration.
- The actual concern-first Discovery cards and the MP17 in-World recommendation UI do not yet exist, so those surfaces cannot be browser-accepted here. The current legacy pre-World builder now shows the existing region Pet in a localized short guidance bubble; Chromium checks Luna/English for Sleep Valley and Lumi/Vietnamese for HealthClues Realm. No new character art or extra modal was added.
- No image-generation call was needed: the skill guidance prefers repo-native SVG for icon systems. No new paid API, third-party license or text-in-image asset was introduced.
- Focused visual UI browser test used an explicitly marked, non-persistable synthetic response; it did not call Gemini or save any plan. After fixing route-independent mask styles and rebuilding, Chromium returned `PASS_SYNTHETIC_UI_ONLY`, 14 assertions, zero runtime exceptions at `http://127.0.0.1:3305/play`. It checked SVG fetch/content type, mask, nontransparent tint, 32×32 geometry, independent checkboxes/options, EN/VI rendering and no mobile horizontal overflow. Desktop 1440×900 and mobile 390×844 screenshots were opened and inspected: `reports/previews/mp17-plan-selection-fixture/desktop-unselected.png`, `mobile-custom-selected.png`, `vietnamese-mobile-selected.png`.
- The preexisting process on 3304 was not stopped because its isolated-demo PID record did not match the launcher's ownership check; the new build uses port 3305 and reused the verified local Supabase without migrations or seeding. Physical-device testing remains untested; viewport emulation is the evidence.

## Resumed implementation checkpoint — 2026-11-01

Status remains **PARTIAL**. This section supersedes the earlier checkpoint's statement that the concern-first UI/API path was not connected; it does not supersede the requirement for full authenticated Chromium acceptance.

### Implemented in source

- Welcome now sends first-time players to the additive goal-first branch. Existing legacy `?step=quest` and the 96-question bank remain intact for existing/resumed profiles.
- Seven canonical discovery focus cards use the previously created SVGs. The player may enter a concern detail, confirms age 13+, and answers one structured multiple-choice prompt at a time. Back, skip, optional short text, multi-answer, locale-switch preservation and truthful provider-unavailable continue path are supported.
- Adaptive request/response schema supports stable focus/question/answer IDs and 1–5 selected answer IDs/labels per response; no more than eight questions. Contract asks Gemini to keep the ordinary journey short and only add needed clarifications. Session state preserves canonical answers across refresh/locale switch without translating user text or fabricating legacy answers.
- Profile `adaptiveDiscovery` now has a strict `ageConfirmed: true` marker and structured answer history. Existing encrypted pending-journey activation handoff and authenticated profile persistence carry it. Sleep enters existing Sleep Valley; other concerns enter HealthClues Realm. No World/map/region IDs changed.
- Authenticated World detects the adaptive profile, greets with the correct existing Luna/Lumi, opens the current Plan panel before the existing World/My Journey guide, and restores normal guide flow when the panel closes. Plan persistence remains the existing signed owner/World Plan API; checkbox, A/B/custom and zero-selection behavior reuse the existing builder. My Journey remains the existing three-section surface.
- Activation/preview high-level copy now has EN/VI variants, including resend locale. The wider World/plan/NPC UI has remaining Vietnamese coverage gaps; full localization is not claimed.
- Added/updated focused browser harness `scripts/test-healthclues-mp17-goal-first-browser.mjs` to test both locale screens with an explicitly disclosed `SYNTHETIC_TEST` response interceptor. It does not call Gemini, does not seed test prompts in the app, and is not a persistence test.

### Verification and blockers

- `node scripts/test-healthclues-adaptive-discovery.mjs`: PASS, 13 assertions including locale, stable IDs, choice arrays, bounds and duplicate/repeated-question rejection.
- `node scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions (existing shared-plan/safety suite).
- First fresh isolated build on port 3310 exposed two TypeScript issues: adaptive hydrated-profile omitted the validated age marker and `locale` was not read in `WellnessWorldGame`. Both source issues were fixed. A new reuse-only build was started; record its final exit/result below after completion.
- Initial Chromium runs on stale port 3307 exposed three harness defects (reading a parent disclosure attribute as a child, case-sensitive completion copy, and retaining EN localStorage before the VI run). The harness was corrected. The stale build must not be used as final current-source evidence.
- First current-source isolated build failed TypeScript with the two issues described above (not a safety/API failure). The corrected build is running as `mp17-complete-final-20261101` at port 3310 and reuses the already verified local project `healthclues-owner-demo`, API `127.0.0.1:54321`; no migration, seed, Supabase reset, production access or external Gemini request.
- Real Gemini inference: **BLOCKED**, known provider HTTP 402 `BILLING_REQUIRED`. Do not claim live personalized recommendations. Real browser plan goal persistence, local Mailpit account activation, cross-account isolation, EN/VI actual World and screenshot visual inspection remain pending until the corrected build and authenticated test finish.

### Unfinished requirement checklist

- [x] New-player concern-first route; legacy Quiz retained.
- [x] Canonical short-answer profile type and encrypted activation handoff in source.
- [x] Required 13+ self-confirmation and existing email verification path in source.
- [x] Actual existing World and first-plan/Pet sequencing in source.
- [x] Existing checkbox + A/B/custom + zero-selection Plan Builder reused in source.
- [x] Gemini/API failure is truthful and does not block the World; fixtures are QA-only.
- [ ] Full authenticated Chromium flow through local Mailpit activation and actual World.
- [ ] Confirm selected A/B/custom and zero goal; verify exact My Journey data after reload.
- [ ] Two-account profile/Plan isolation for the new `adaptiveDiscovery` field.
- [ ] Current source browser E2E on desktop/mobile, screenshots opened/inspected, zero runtime errors.
- [ ] Full EN/VI audit across World Plan panel, Pet/tutorial, NPC and accessible game surfaces.
- [ ] Real Gemini inference, blocked by HTTP 402/BILLING_REQUIRED.

**Exact next action:** complete the current source build; then finish and run `scripts/test-healthclues-mp17-goal-first-browser.mjs` through local Mailpit verification, backpack/World entry, initial Pet Plan, selected/custom and zero-plan persistence/reload. Add a second synthetic user and check profile/Plan isolation, inspect output screenshots, then update the matrix. Do not mark MP17 complete until these browser cases pass.

A real local Mailpit attempt verified the Vietnamese synthetic account but exposed a callback-routing defect: `/vi/song-khoe/auth/callback` ignored `next=/play?activation=complete` and rendered the generic Botly Account page. Fixed the route to mirror the EN HealthClues callback while preserving `initialLocale="vi"`; the fix is source-linted, and a fresh local build plus activation/World/Plan repeat is pending. The first account remains only a verified local synthetic account and is not evidence of a completed journey.
## Chromium acceptance update — 2026-11-01

### Current source build

- Reuse-only isolated build `mp17-complete-final-20261101`: TypeScript compilation and static generation completed successfully after adding `ageConfirmed: true` to the trusted profile hydration and loading the locale hook used for focus display. The follow-up rebuild includes the fixed Vietnamese HealthClues callback and Plan UI localization; verify final process exit and URL before calling it the latest build.
- Final target URL: `http://127.0.0.1:3310/play`. Local Supabase project: `healthclues-owner-demo`, API `127.0.0.1:54321`, local Mailpit `127.0.0.1:54324`. Build used `--reuse-existing-supabase`: no reset, migration or seed.

### Real Chromium results (synthetic profile, not Gemini)

- `scripts/test-healthclues-mp17-goal-first-browser.mjs`: **PASS for the exercised vertical slice** on port 3310, 0 browser runtime exceptions. The adaptive-question endpoint was intercepted with explicitly disclosed fixture questions. EN and VI each completed two choice questions; VI was switched to EN and back mid-Quiz and the first canonical answer IDs were preserved. The new account used an isolated synthetic email, a real local Mailpit verification link, and the local Supabase Auth callback. Chromium reached the real HealthClues World and localized Lumi/Plan panel; the Advisor request was blocked in Chromium and returned an unavailable state, so no external inference or fake goal occurred.
- In the same synthetic account, the player confirmed a zero-goal Plan, the authenticated Plan API was read back for the created World, My Journey displayed exactly `checklist`, `herbs`, and `practices`, and all three stayed available after browser reload. The empty checklist remained truthful. This is not the selected-goal A/B/custom persistence case.
- The run captured welcome, adaptive question, activation preview, verified World preparation, Lumi/Plan desktop, zero-goal confirmation, and My Journey desktop/mobile screenshots under `reports/previews/mp17-goal-first-fixture/`. `vi-adaptive-question-desktop.png`, `vi-actual-world-pet-plan-desktop.png`, and `vi-zero-goal-my-journey-mobile.png` were opened and inspected. My Journey shows all three expanded together. Earlier captures show some untranslated World map region descriptions/Coming Soon status; localization is not complete.
- `scripts/test-healthclues-mp17-plan-selection-browser.mjs`: **PASS_SYNTHETIC_UI_ONLY**, 16 assertions, 0 runtime exceptions. Explicit non-persistable test fixture verified independent checkbox and A/B/custom controls, zero/one selection count, Vietnamese copy and mobile sizing. It does not prove AI personalization or persistence.
- `scripts/test-healthclues-adaptive-discovery.mjs`: PASS, 13 assertions. `scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions. Focused ESLint over onboarding, callback, Plan, World and E2E harness passed before the final UI localization edits; rerun lint/build after those edits.

### Requirement matrix at this checkpoint

| Requirement | State | Evidence / limitation |
|---|---|---|
| New-player concern-first EN/VI discovery; legacy 96Q retained | PASS for browser fixture path | Browser confirmed new default, 7 focus cards, choice questions and no changed historical bank. Real adaptive generation was not invoked. |
| Short canonical adaptive answers and locale switch preservation | PASS, synthetic question contract | Stable IDs/answer arrays survived EN↔VI while mid-Quiz. Answer data uses session storage until encrypted handoff. |
| Required activation | PASS for one VI synthetic account | Local Mailpit magic link, confirmed local user and actual World. Discovered/fixed VI callback routing regression. |
| Actual World, correct Pet and in-World Plan sequence | PASS for the exercised VI account | HealthClues Realm/Lumi appeared. Plan opened before the existing guide. Sleep Valley/Luna was not repeated in this MP17 run. |
| Zero-goal confirmation, World-scoped Plan read and My Journey reload | PASS for one VI synthetic account | Plan returned null or zero goals; no invented active goal; all three Journey sections remained expanded after reload. |
| Selected AI goal A/B/custom saved to My Journey; two-account isolation | PARTIAL / NOT TESTED | Synthetic Plan UI control test passed separately. No live AI options exist under current provider/content state; no second new MP17 account was run. |
| Full EN/VI player localization across World, Plan, Pet, NPC and accessible game content | PARTIAL | Onboarding, welcome, Plan introduction, core empty Plan/My Journey and callbacks are translated. World-preview map descriptions/Coming Soon labels and portions of the World Plan/other game copy remain English or need audit. |
| Real Gemini inference | BLOCKED | Last known provider response HTTP 402 `BILLING_REQUIRED`. This run deliberately intercepted Advisor in Chromium and did not call Gemini. |
| Desktop/mobile screenshots and runtime | PASS for exercised surfaces only | Chromium 1440×900 and 390×844 screenshots inspected; no browser exceptions in the synthetic journey. Not physical-device tested. |

Overall Master Prompt 17 remains **PARTIAL**. Next: verify the rebuilt current source, rerun lint/docs checker, then add a second synthetic account to prove adaptive-profile and Plan isolation; fill remaining localization gaps; test selected user-created goal persistence and, if provider billing is restored, real Gemini separately. Do not label AI-generated recommendation acceptance PASS while HTTP 402 persists.

## Final available-session acceptance update — 2026-11-01

Overall MP17 remains **PARTIAL**. This newest execution evidence supersedes earlier text in this report that described the authenticated flow as not yet exercised; older negative statements about the Welcome branch, Vietnamese callback, or port 3310 build are historical checkpoints only.

### Current-source local build and browser results

- Isolated reuse-only build `mp17-complete-final-20261101` completed successfully at `http://127.0.0.1:3310/play`. It used the existing isolated `healthclues-owner-demo` Supabase API at `127.0.0.1:54321` and local Mailpit at `127.0.0.1:54324`; no reset, volume deletion, migration, seed, production access or deployment occurred.
- `scripts/test-healthclues-mp17-goal-first-browser.mjs`: **PASS_SYNTHETIC_QUESTIONS_LOCAL_AUTH_ZERO_PLAN**. Chromium completed the concern-first branch in English and Vietnamese, switched EN↔VI during the VI quiz and preserved canonical answer IDs, then used a synthetic VI account and local Mailpit magic-link activation to reach the actual HealthClues Realm. It rendered Lumi’s in-World Plan introduction, confirmed zero goals, read the Plan for the authenticated World, opened My Journey and retained all three expanded sections after reload. Runtime exceptions: 0. The adaptive responses were explicit `SYNTHETIC_TEST` fixtures; the Advisor response was intercepted as unavailable; no Gemini inference occurred.
- `scripts/test-healthclues-mp17-plan-selection-browser.mjs`: **PASS_SYNTHETIC_UI_ONLY**, 16 assertions, runtime exceptions: 0. It verified independent checkbox state vs A/B/custom selection, zero/one selected count, labels and responsive EN/VI UI. Its fixture is deliberately non-persistable, so this is not evidence that selected AI goal options persist.
- `scripts/test-healthclues-adaptive-discovery.mjs`: PASS, 13 assertions. `scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions. Focused ESLint and `npm run docs:healthclues:check` passed. The docs guard mapped four change groups and passed across 12 files; manual accuracy review remains required.
- Actual Chromium screenshots generated at `reports/previews/mp17-goal-first-fixture/` include English/Vietnamese Welcome and adaptive question, activation preview desktop/mobile, verified World preparation, Vietnamese Lumi/Plan desktop, zero-goal confirm, and My Journey desktop/mobile. `vi-adaptive-question-desktop.png`, `vi-actual-world-pet-plan-desktop.png`, and `vi-zero-goal-my-journey-mobile.png` were opened and inspected. A separate UI-only screenshot set is at `reports/previews/mp17-plan-selection-fixture/`; the Vietnamese mobile goal-selection capture was opened and inspected.

### Acceptance matrix

| Requirement | State | Evidence / gap |
|---|---|---|
| New-player concern-first default; legacy 96-question path retained | **PASS (fixture browser + source)** | Seven existing discovery icons/cards and one-question screens. Legacy bank and saved profiles are retained. |
| Adaptive answer IDs, locale switch, refresh handoff | **PASS for exercised flow** | Stable answer IDs survive EN↔VI switch; local authenticated VI flow reaches World. Adaptive model selection is synthetic, not real Gemini. |
| Required verified account activation and actual World | **PASS for one synthetic VI account** | Local Mailpit magic link and corrected `/vi/song-khoe/auth/callback` route reached the actual HealthClues Realm/Lumi. |
| Pet Plan sequence and zero-goal confirmation | **PASS for exercised path** | In-World panel appears before tutorial; authenticated Plan API returned null/empty goal set; no goals were fabricated. |
| My Journey has exactly the existing three sections and reloads | **PASS for empty Plan path** | `checklist`, `herbs`, `practices` all expanded after reload; honest zero-goal state. |
| Checkbox + A/B/custom and arbitrary/zero selection controls | **PASS (synthetic UI only)** | 16 assertions; fixture is non-persistable. |
| Selected Level A/B/Custom or authored goal persists exactly through confirmed Plan → My Journey | **NOT TESTED / PARTIAL** | No safe live Gemini suggestions; UI fixture is intentionally blocked from persistence. Zero-goal path is verified. |
| Adaptive profile and Plan isolation across two new accounts | **NOT TESTED** | No second new account was used in this MP17 run. Existing generic account-isolation coverage is not substituted for this specific field/path. |
| Complete EN/VI player UI and all World/NPC/tutorial copy | **PARTIAL** | Core discovery, activation, initial Pet/Plan, empty My Journey and selected navigation are localized, but World shell/map and some accessible NPC/game text remain English. |
| Desktop/mobile and browser runtime | **PASS for exercised screens only** | Chromium at 1440×900 and 390×844; zero runtime exceptions; visual inspection on selected desktop/mobile screenshots. Physical devices not tested. |
| Real Gemini inference | **BLOCKED** | Previously verified HTTP 402 `BILLING_REQUIRED`. This run did not invoke Gemini. |

**Next executable task:** add a second local Mailpit account to the MP17 browser harness and verify `adaptiveDiscovery`/Plan owner isolation; then persist a user-authored custom goal through the authenticated existing API and verify it in My Journey/reload. Continue the remaining World/NPC localization audit. Re-run live inference only when billing/provider status changes; do not label synthetic fixtures as AI output. MP17 is not complete.
## Gemini live status recheck — 2026-11-01

One real server-side request was sent through the isolated Owner Demo Advisor using a synthetic Sleep profile. The launcher reads the private Gemini config into server runtime (startup had reported “Gemini configured”); credentials were not printed or sent to the browser. Sanitized server event `d445710d-d09c-4994-b189-d6b3a37948e3` records provider `gemini`, model `gemini-3.8-flash`, `failureCategory: INVALID_SCHEMA`, duration 5253 ms. The loopback endpoint returned HTTP 503, `status: AI_UNAVAILABLE`, `diagnosticCode: INVALID_SCHEMA`, and zero goals. Thus a real provider-backed attempt occurred, but no validated checklist was produced.

The current classifier combines malformed JSON and Zod response-schema failures as `INVALID_SCHEMA`; the sanitized log does not include the provider's raw HTTP status, so it is unknown whether Gemini returned a successful HTTP response with unusable content or another status lacking a surfaced code. Server validation rejected the response before the independent personalized-plan safety validation completed. This is **not** `SAFETY_VALIDATION_FAILED` and not evidence that sources or safety passed. No raw output, health answers, or credentials were logged; only a synthetic Sleep profile was sent. No second call/retry was made. Latest real call supersedes the older 402 as the most recent observed result; historical `HTTP 402 BILLING_REQUIRED` remains recorded as prior provider behavior.

**Status:** real Gemini path **INVOCATION OBSERVED / RESPONSE INVALID / PLAN BLOCKED**. Exact next diagnostic step is to add sanitized parser-stage telemetry distinguishing JSON decode failure from response Zod schema failure, without exposing response text, then decide whether a single synthetic reproduction is justified. No localized AI goals should be presented from this failed response.


## Gemini diagnostic hardening — 2026-11-01

- The previous real synthetic Sleep call `d445710d-d09c-4994-b189-d6b3a37948e3` ended as application HTTP 503 / `INVALID_SCHEMA`; its old sanitized log had no stage, provider HTTP status, parser type, response size, or Zod paths. Its exact failure point cannot now be reconstructed. No new Gemini request was made in this diagnostic pass; the historical HTTP 402 is not assumed to describe this call.
- The personalized-plan path now shares one canonical runtime contract and a `generateContent` `config.responseSchema` builder. The installed `@google/genai` 2.32.0 declaration exposes `GenerateContentConfig.responseSchema`, `responseMimeType`, and `Schema.nullable`; the implementation does not use Interactions `response_format` syntax. Request schema receives a local structural preflight.
- A server-only pipeline now distinguishes `REQUEST_SCHEMA_INVALID`, `PROVIDER_HTTP_ERROR`, `PROVIDER_EMPTY_RESPONSE`, `RESPONSE_JSON_PARSE_FAILED`, `RESPONSE_SCHEMA_MISMATCH`, `RESPONSE_SEMANTIC_INVALID`, and `RESPONSE_SAFETY_REJECTED`. Failure logs separate upstream HTTP status from application status and retain only model/method, stage, parser error class, response byte count, structured-output state, sanitized Zod paths/types and rejection counts. Prompts, keys, user answers and raw model content are excluded.
- Independent semantic and safety validation remains active per goal; invalid goals can be omitted while other individually validated goals survive. The existing A/B goal transformation is preserved.
- Offline reproduction `scripts/test-healthclues-gemini-plan-pipeline.mjs` passes valid three-goal parsing, missing Level B path, invalid target type/category, empty/malformed JSON, semantically identical options, unsafe content, per-goal omission, A/B transformation, provider-status classification and invalid request-schema preflight. Contract/safety suites: 14 and 42 assertions pass; adaptive discovery: 13 assertions pass. Focused ESLint and a fresh isolated build are in progress/recorded separately below.
- The live provider has NOT been re-invoked. Thus this diagnoses and fixes observability and verifies the local parser contract, but does not prove the cause of the historical response or that live Gemini inference now succeeds. The first follow-up live synthetic inference must be explicitly authorized and should be made once only after the owner chooses to incur the provider request.

## 2026-11-02 — EN/VI region NPC shell and legacy Quiz route regression

**Status: PARTIAL.** Isolated current-source build `mp17-npc-locale-20261102` ran at `http://127.0.0.1:3311/play` against the already-running local `healthclues-owner-demo` project (`127.0.0.1:54321`, Mailpit `127.0.0.1:54324`) in reuse-only mode. No migration, seed, reset, production request, deployment, or Gemini inference occurred.

- The shared region scene now displays localized landmark names, NPC role names and authored greetings, the NPC approach aria-label, Talk/Interact actions, and movement help through the existing HealthClues dictionary. Region IDs, safe-path movement, proximity gating, stored values and schemas are unchanged. Catalog/editorial text and provider replies remain in their source language with existing review/source status; no translation implies editorial review.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3311 node scripts/test-healthclues-mp17-goal-first-browser.mjs` returned **PASS_SYNTHETIC_QUESTIONS_LOCAL_AUTH_A_B_CUSTOM_PLAN_API_PERSISTENCE_ACCOUNT_ISOLATION_AND_RETURNING_WORLD**, 12 intercepted synthetic question requests and 0 browser runtime exceptions. Two new synthetic local accounts completed email activation through Mailpit, real World entry, Plan/My Journey, logout/login and owner isolation. Direct safe-path arrival at the Botanist verified exact English and Vietnamese name/greeting/Talk/landmark labels; both locales opened the existing nutrition station. At 390×844 the Talk action was in view with no horizontal overflow. Screenshot set: `reports/previews/mp17-npc-locale-20261102/`; opened and visually inspected `account-a-vi-botanist-talk-desktop.png`, `account-a-vi-botanist-talk-mobile.png`, and `account-b-en-sleep-botanist-talk-mobile.png`.
- This browser's adaptive questions and signed A/B/custom contract were explicitly synthetic QA data, not Gemini output. Its Plan/API account-isolation results apply to those isolated synthetic accounts only.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3311 node scripts/test-healthclues-localization.mjs` returned **PASS** for the concern-first default plus legacy Quiz route compatibility: canonical C01 answer and step survived EN↔VI navigation/reload, 96 canonical question/option translation coverage remained, and 390×844 layouts fit. This was a guest compatibility check; it did **not** exercise a previously saved authenticated legacy 96-question profile.
- Adaptive discovery suite: 13 assertions PASS. Wellness Plan/safety suite: 42 assertions PASS. Focused ESLint: 0 errors, 2 existing `<img>` optimization warnings in `RegionMapScene.tsx`. Current-source isolated production build completed and served the browser run.
- The older `test-healthclues-owner-auth-demo.mjs` did not reach authentication because it still expects the retired first-time “Two adventures are open” screen instead of the approved goal-first discovery. It is stale for new-player onboarding; the MP17 current-flow harness above was used for the current journey. One initial localization-harness attempt timed out at `Page.captureScreenshot`; raising its CDP operation timeout allowed the complete run to pass.

**Remaining:** verify an already-populated authenticated legacy 96-question account still reopens its prior answers/World without forced new onboarding; finish the wider Vietnamese World, station catalog, guide, knowledge and accessible-game coverage. Real Gemini remains blocked at the most recent recorded response (`503 INVALID_SCHEMA`; earlier `402 BILLING_REQUIRED`), and synthetic output is not a substitute. MP17 and full localization remain **PARTIAL**.

**Exact next task:** add a returning-account regression using an isolated local owner whose profile was created through the original 96-question Quiz, then verify saved Quiz values and World across locale switch/reload without showing new-player adaptive onboarding. Continue the Vietnamese station/game coverage after that. Do not retry paid inference or describe synthetic fixtures as live Gemini.

## 2026-11-02 — simplified bilingual Gemini checklist (offline only)

**State: CONTRACT_IMPLEMENTED_AND_OFFLINE_VERIFIED; REAL_GEMINI_NOT_TESTED.** This work supersedes the earlier goal-ID/source-registry requirement for ordinary AI lifestyle suggestions only. The previous real Gemini result remains historical `REAL_GEMINI_PARTIAL` (provider response received, schema rejected); this change does not retroactively fix or validate that response.

- Gemini contract now contains only up to six goals: bilingual title, short relevance reason, and two bilingual A/B options. Each option has only title and action. Gemini does not generate IDs, categories, targets, citations, safety fields, checkboxes or Custom.
- Backend assigns `ai:` UUIDs and concern-derived category after parsing, runs relevance/danger checks, signs the complete bilingual goal, and validates the selected language/option against that signature in the existing Plan API. No catalog row or universal quantity is required.
- EN/VI language selection uses the same bilingual goal and ID. A short in-memory server cache handles route remounts without another inference; explicit Retry requests a new result. Include checkbox and Custom remain UI-owned; only confirmed selections are persisted.
- Focused offline suites passed: `scripts/test-healthclues-personalized-plan-contract.mjs` (19 assertions), `scripts/test-healthclues-gemini-plan-pipeline.mjs` (simplified schema, missing B, malformed/safety/semantic failures, mocked provider statuses, A/B mapping), and browser fixture script syntax check. `scripts/build-healthclues-isolated.mjs` passed compilation, TypeScript and static generation; its existing middleware deprecation notice remains.
- No real Gemini call, authenticated write, migration, seed or production access was performed. Recommendation quality, actual provider bilingual output, live cache behavior and real Plan persistence remain unverified.

**Readiness:** READY_FOR_ONE_CONTROLLED_REAL_INFERENCE_TEST after explicit authorization. Do not run it automatically. This readiness is based on offline contract/build evidence only and does not mean Gemini is working.

## 2026-11-02 — one authorized real Gemini inference on simplified contract

- Corrected runtime was isolated on `http://127.0.0.1:3313/play`, build `gemini-simplified-20261102`; source hashes for Advisor route, Gemini pipeline and goal contract matched source. Route probe returned 405 on GET (POST route registered). Launcher reported server-only Gemini configuration. API key/model/adapter entries were present; no key value was printed. Mock-related env vars, `NODE_OPTIONS` injector, and mock mode/case files were absent. SDK configured for one attempt; HTTP client sent one POST with no retry.
- Exactly one synthetic Vietnamese Sleep POST was sent. Provider HTTP status **200**; application HTTP **200**; request ID `8daba742-033f-499e-b55e-e3e658dd2d28`; model `gemini-3.8-flash`; elapsed 11.7 seconds. Pipeline stages completed: REQUEST_RECEIVED, INPUT_VALIDATED, ADVISOR_STARTED, PROVIDER_REQUEST_STARTED, PROVIDER_RESPONSE_RECEIVED, JSON_EXTRACTION_STARTED, JSON_PARSED, SCHEMA_VALIDATED, SAFETY_VALIDATED, RECOMMENDATIONS_READY.
- Gemini returned **4** goals. All had bilingual title/reason and distinct A/B title/action. Server IDs were unique `ai:` UUIDs. A/B mapped to the same IDs in EN/VI and both locale mappings retained null structured target values. Server response status confirms parser/schema/safety acceptance. No plan was saved and no user account was used.
- Sanitized goals: “Establish a consistent bedtime window”; “Adjust evening caffeine timing”; “Reduce bedtime screen exposure”; “Create a calming pre-sleep routine.” Options covered choosing a bedtime window vs a reminder, shifting caffeine timing vs a self-chosen cutoff, putting the phone down vs a phone-free wind-down period, and a simple unwind step vs a wind-down sequence.
- **Quality is PARTIAL against the approved no-universal-quantities direction:** Gemini inserted concrete durations/frequencies in prose (including an hour earlier, 15 minutes, 30–45 minutes and 20 minutes) and one option mentions a “target bedtime range.” These were not schema target fields, so current validators accepted them. Do not treat the response as fully meeting the simplified product contract. The concise disclaimer was present in the UI source; checkboxes/Custom are UI-owned. Their interactive browser behavior was not exercised in this live request.
- Correlated stage logs captured provider 200. The final success log's legacy `resultCount` was 0 because it counts `suggestions`, while the stage log and HTTP response correctly report four `goals`; correct that metric before relying on it.
- **No retry, no follow-up inference, no Plan save, no migration/seed/reset, and no production access.** Exact next task: strengthen prompt and server validation so generated prose cannot invent fixed numerical durations/frequencies, update offline fixtures, then stop. Any further live call needs new authorization.

## 2026-11-02 — risk-aware numeric quality refinement (offline)

Owner clarification withdraws the prior assessment that ordinary numeric durations/frequencies were a contract defect. The last real synthetic Sleep response (provider/app HTTP 200; four goals; completed safety/schema pipeline) remains a real technical success; its modest screen/wind-down quantities may be useful choices and are not rejected just for being numeric. No inference was made during this follow-up.

The Advisor prompt now requests concern-linked reasons, feasible and distinct A/B levels, and bilingual-consistent numeric choices. It permits modest adjustable low-risk experiments without requiring a precise baseline, while warning against medical-threshold framing, arbitrary repeated values, and unsupported higher-risk prescriptions. Server validation does not blanket-ban numbers: it permits Sleep 15/30-minute screen experiments and Weight Management 10/20-minute walking fixtures, while rejecting unsupported quantified fluid advice, calorie restriction, dangerous advice, mismatched EN/VI numeric values, duplicate A/B actions, irrelevant reasons and clearly implausible everyday values. Success telemetry now counts `goals` before falling back to legacy `suggestions`.

Offline evidence: personalized-plan contract suite PASS (30+ assertions) with synthetic Sleep, Gout and Weight Management; mocked Gemini pipeline suite PASS (including provider error cases). UI checkbox/Custom controls and existing A/B Plan mapping are asserted. No World/My Journey code changed. This does not verify new live provider quality or browser persistence of a live result.
- Final verification: focused ESLint 0 errors/0 warnings; isolated production build PASS (TypeScript and 81 routes; existing Middleware deprecation notice); docs consistency guard PASS for the updated acceptance/business/decision/implementation/current/report documents. Build left the existing root `.next` baseline intact.

## MP17 bilingual persisted display and authenticated legacy follow-up — 2026-11-02

**Current verified local URL:** `http://127.0.0.1:3319/play`. Current-source isolated build reused the existing local Owner Demo Supabase; no schema changes, migration, seed, reset, production access, Gemini inference, commit, push or deployment.

### Results

- Root cause: Advisor response had bilingual fields, but `toAiPlanGoal` reduced them to the requested locale. The signed proof was then discarded by Plan POST without copying its bilingual content into persisted JSONB; World/My Journey displayed the one saved string literally.
- Fix: server verifies the existing signed goal proof then persists a bounded EN/VI `localizedRecommendation` snapshot inside the existing JSONB Plan record. My Journey renders title, relevance reason and selected A/B title/action from the same canonical record by locale. Existing old records lacking the snapshot retain original text. Custom/player-authored copy is not translated.
- Chromium fixture: three goals (two AI choices and one AI-card Custom) retained stable IDs, A/B selection, numeric value/unit and active status across VI → EN → reload → VI. No duplicates. Custom exact text persisted; unselected alternatives are not active. Separate Add My Own Goal path passed in the MP17 goal-first fixture suite.
- Authenticated synthetic legacy profile: same World ID and ten saved Plan versions after locale/reload; existing World/My Journey remained accessible without a new onboarding flow; two existing practice rows rendered after legacy missing-discovery-station fallback; no herbs existed. No duplicate goal IDs. The World GET performs existing milestone reconciliation; XP baseline was not compared.
- Legacy profile has null/missing `answers` and `quizAnswers`. There is no authenticated persisted original 96-question response fixture, so historical answer preservation is unverified. Historical AI rows without bilingual snapshots cannot safely display an unavailable translation; their original wording remains visible.
- AI-card Custom remains stored as a new `user_created` UUID with no source recommendation ID/link. Its A/B alternatives are not active. No schema expansion was made for hypothetical linkage.
- Source fixture only; no real Gemini response was used. This does not establish live AI quality.

### Evidence

Current build Chromium checks: `.tmp/mp17-bilingual-legacy-chromium.mjs` PASS and `scripts/test-healthclues-mp17-goal-first-browser.mjs` PASS (`runtimeExceptions: 0`). Offline personalized-plan contract suite PASS (40+ assertions). Desktop and mobile screenshots are captured and visually inspected in `reports/previews/mp17-bilingual-legacy/`, including `fixture-my-journey-vi-desktop.png`, `fixture-my-journey-en-desktop.png`, `fixture-my-journey-vi-mobile.png`, `fixture-my-journey-en-mobile.png`, `legacy-my-journey-en-desktop.png`, and `legacy-my-journey-vi-desktop.png`.

### Acceptance status / next task

- New AI snapshot EN/VI display: **PASS**.
- Historical records missing source translations: **PARTIAL**, kept verbatim without fabrication.
- Sampled authenticated legacy World/Plan behavior: **PASS**.
- Original 96-question authenticated answer preservation: **PARTIAL / NOT VERIFIABLE**, because no saved answer fixture exists.
- AI-card Custom and independent Add My Own Goal: **PASS** as separate operations; source linkage is not retained.
- Real Gemini inference and recommendation quality: **NOT TESTED**.

Next task: identify a valid synthetic authenticated account that actually contains persisted legacy 96-question answers or maintain this as an evidence gap. MP17 is not fully accepted while this evidence gap and historical translation limitation remain.
