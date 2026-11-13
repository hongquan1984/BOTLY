<!-- Captured excerpts; original documents remain authoritative. -->
## MASTER_SPEC.md
## Isolated final-demo evidence update — 2026-10-30

Fresh authenticated Chromium evidence on owner build `app-build-final-a7` verifies the approved two-map flow and the current TEST ONLY learning/reward slice. Four unique mini-games and four persisted Skill aggregates are implemented and browser-verified; a focused source test covers all five Skill thresholds. Boss key/unlock and the in-region Rewards station persist in the local World. These synthetic fixtures are not reviewed HealthClues education, and this evidence does not imply production readiness or completion of human art/content, physical-device, performance or release review. See `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.


## Local demo evidence update — 2026-10-29

Current local evidence and blocking status are maintained in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. The isolated owner build is still available at 3248; optional Pet Check-in with explicit private-note opt-in is browser verified. Local synthetic Catalog/Knowledge/Boss fixtures are not human-reviewed content. New API labels/filtering and a topic-matching migration are source-only until the isolated build succeeds; D: exhaustion currently blocks that build. This does not change product scope or imply production readiness.


## 09B implementation status note — 2026-10-29

The architecture remains the existing Next.js/Supabase application and one persisted owner World. The current authenticated `/play` experience now branches into a shared RPG scene using the approved Overworld renderer plus two detailed interactive region views; this is a presentation integration over existing World/profile APIs, not a second game/database. Only two regions are playable. Current implementation evidence and gaps are tracked in `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`; approved Skills, reviewed content, Journey loadouts and production gates are not implied complete.



## BUSINESS_RULES.md
## Botanist player-facing content and UI state — 2026-11-02

- Botanist recommendations contain only botanical entries reviewed and eligible for the current Journey. Filter `demoOnly`/TEST ONLY and ineligible rows, including the legacy generic `PersonalizedSuggestions` nutrition fixtures. Do not re-label fixtures as reviewed recommendations or substitute unrelated nutrition items into this station.
- Empty eligibility is valid. Show an honest localized message; do not invent an item or enable Save/Equip controls. Discovery, saving to Collection and equipment remain separate state transitions under existing authenticated APIs and NPC-origin rules.
- UI locale is presentation only. A goal keeps its canonical ID, active/saved state, A/B choice and numeric target. Validated bilingual AI content uses its existing snapshot; user-authored Custom text stays exactly as entered.
- My Journey displays current confirmed goals and real equipped herbs/practices. Do not infer daily completion, mutate inventory on locale changes, or expose unsupported targets as player-facing state.


## Universal wellness plan retrieval and scope (2026-10-30)

Acceptance evidence update: actual local Chromium testing on build 3260 confirmed that only explicitly configured/confirmed goals persist to separate authenticated Worlds; reload preserves revisions and cross-owner read/write attempts return 404. This does not upgrade TEST ONLY templates to reviewed content or establish production readiness.

One shared topic-configured habit library serves all supported topics; topic names do not imply content approval. Only applicable templates or exact-topic Catalog records may be retrieved. Unknown or missing review/content coverage must not be filled by unrelated habits. Demo templates are isolated TEST ONLY and are rejected outside Owner Demo. Safety and target validation are deterministic server gates; personalization in the current checklist is rules-based, not a live AI model. No herbs, supplements or detailed therapies appear in onboarding. Such in-game NPC discoveries require explicit user confirmation to create a new plan revision.


# MP20 — two-screen discovery and inventory constraints (2026-11-02)

- New-player discovery has exactly two question screens after World selection. Screen 1 chooses one concern; Sleep Valley uses sleep-only choices, while HealthClues Realm uses health concerns. Screen 2 is a concern-specific multi-select and optional note. No question is required to advance except the concern selection, age confirmation already required by the product, and a short description for Other.
- Concern/factor bank entries are self-reported circumstances or experiences; they are not all causes, diagnoses, or clinical risk classifications. No new diagnosis, medication, hydration, or activity safety state may be inferred from absence of a selected answer. A report of recurrent painful/swollen joints does not establish a current acute flare; `acutePainfulJoint` remains unknown unless directly assessed through its existing safety checkpoint. `none`/`unsure` are mutually exclusive with other factor selections.
- Gemini context must include selected World, concern, selected factors and optional note, locale and known safety context. It must not claim a user reported an unselected factor. Provider failure must not block onboarding or show fabricated AI output.
- A recommendation preview never equips a practice or botanical. Existing proximity, reviewed content and account-scoped NPC equipment APIs remain authoritative. A botanical suggestion does not imply safe use or efficacy.
- Existing authenticated Plan persistence remains the source of truth. No activation or daily completion is inferred from a Quiz answer or preview.




## ACCEPTANCE_TESTS.md
## HC-UI-REDESIGN-2026-11-02 — Botanist, Plan Builder and My Journey

Use isolated Owner Demo `http://127.0.0.1:3322/play`, local Supabase reused read-only, and authenticated synthetic accounts. Intercept all Advisor responses locally; this case must not call Gemini.

- At desktop 1440×900 and mobile 390×844, approach Botanist and choose Talk. Verify localized greeting and open station. Current fixture set has no reviewed botanical entry eligible for this Journey, so verify an honest empty state and absence of TEST ONLY nutrition fixtures. **PASS** for Talk and localized greeting/empty-state visuals. Item details/Save/Equip are not claimed because the eligible catalog is empty.
- Open Plan Builder in VI and EN. Verify localized content, independent checkbox per goal, subdued unchecked cards, live selected count, A/B/Custom controls, disclaimer, Confirm and Skip. Capture the initial mobile viewport and a scrolled goal-card viewport. **PASS** for reference structure and interaction; fixture content remains explicitly synthetic.
- Select goal 1/A, goal 2/B, goal 3/Custom, leave goal 4 unchecked, confirm via Plan API, open My Journey and reload. Verify exactly three Active goals, unique IDs, exact Custom text, and absence of goal 4 and the Custom card's A/B alternatives. Verify zero-selection confirmation, standalone Add My Own Goal and cross-account Plan/profile read/write denial. Synthetic fixture Chromium run: **PASS**, two Advisor requests intercepted, zero runtime exceptions.
- Switch Account A's same Plan EN→VI→reload. Compare saved IDs, active state, A/B levels and numeric values, and visually inspect localized My Journey. Custom authored text remains unchanged. **PASS** with bilingual synthetic fixture.
- Capture and open Botanist greeting/empty desktop/mobile; Plan VI/EN, selected/unselected, Custom desktop and mobile; My Journey desktop/mobile top and lower scroll. Evidence: `reports/previews/visual-redesign-20261102/`. Compare screenshots directly with `references/healthclues-plan-reference.png`; source-level rendering alone is not visual acceptance.


## AT57 — Final owner demo, compact maps and persistent learning/rewards — 2026-10-30

- Run `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs` against the current isolated build and local Auth/Mailpit. Verify 8 visible regions, 2 playable/6 Coming Soon, verified synthetic email, one saved World, Quiz topic continuity, Luna/Lumi, short safe movement, water/scenery rejection, NPC approach-before-Talk, Encyclopedia, Collection/Backpack, Care Plan isolation, optional Daily Companion note opt-in, four TEST ONLY mini-games, deduplicated persisted Skill counts, Boss clear/key/unlock, Rewards station, reload persistence and zero browser runtime errors.
- After the camera reset, assert the complete landscape world dimensions fit the Region Map viewport; capture and inspect desktop/mobile map views and Knowledge, Boss, Rewards, Care Plan and Companion screens. Touch is Chromium mobile emulation, not physical-device verification.
- `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs`: verify seven valid approaches per region on one short connected path with no bridge dependency. `node --experimental-strip-types scripts/test-healthclues-skill-levels.mjs`: verify all five derived Skill thresholds and input bounds.
- **2026-10-30 result:** PASS for this isolated local test scope on `app-build-final-a7`; source/route checks and fresh Chromium evidence are recorded in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Fixture content remains TEST ONLY / NOT HUMAN-REVIEWED. Art/content human review, physical device gestures, measured FPS, production security/privacy review and production release are outside this PASS.


# MP20 two-question discovery acceptance — 2026-11-02

- **Automated/browser required:** New `/play` path preserves world-first choice and renders exactly two screens with progress 1/2 then 2/2. Sleep concern list is sleep-only; Health Realm list includes Gout, weight, glucose and Other. The factor list changes by concern (Gout vs weight vs sleep), supports multiple selection, none/unsure, optional note and zero factors, and proceeds without any adaptive/Gemini question request. Other concern uses only neutral fallback. Verify authenticated activation preserves IDs/labels and direct region entry.
- **Activation handoff contract:** Submit the real Q2-generated profile after explicit consent. Factor IDs must use canonical a-<id> format; none and unsure are permitted; zero selected factors must remain a valid empty paired array. The encrypted pending-journey API must return success, set its HttpOnly cookie and preserve at most 12 paired IDs/labels. UI errors distinguish validation/service/size/network failures and leave the preview available.
- **Plan/inventory required:** My Journey displays recommendations and selected state together. Exercise one valid selected choice, an unchecked goal, unchecking/deactivation, zero goals, persistence after reload and consistent My Journey status. Distinguish fixture recommendations from real Gemini. Preview routes must not offer equip; actual NPC proximity and catalog eligibility must be checked before selection. Botanist content acceptance remains blocked if no reviewed eligible items exist.
- **Immediate selection:** In central My Journey only, a checked goal with valid A/B or completed Custom implementation must POST to the existing account-scoped Plan API immediately; uncheck removes it from the current goals while previous Plan versions remain. Test rehydrating prior selections, preserving unrelated saved goals, zero goals, and API rejection without false success. The standalone legacy Builder retains global confirmation.
- **Current implementation status:** Quiz source is changed; server answer bounds were raised compatibly to 12. Focused offline suites passed. TypeScript project-wide command is currently blocked by pre-existing stale `.next/types/validator.ts` route union; a clean isolated build and browser E2E are pending. Do not mark the new end-to-end flow PASS based on older MP19 evidence.



## CURRENT_STATE.md
## Latest task — Complete unfinished UI redesign — 2026-11-02

**BOTANIST_VISUAL_ACCEPTANCE: PASS for localized NPC Talk and the honest no-eligible-content empty state. PLAN_BUILDER_VISUAL_ACCEPTANCE: PASS for the interactive, responsive card flow; screenshots inspected on desktop/mobile. MY_JOURNEY_VISUAL_ACCEPTANCE: PASS for the three expanded, localized sections and empty equipment states. FUNCTIONAL_REGRESSION: PASS for synthetic fixture UI-to-Plan persistence, zero selection, standalone goal, locale stability and synthetic account isolation. EN_VI_LOCALIZATION: PASS for AI fixture content and labels; authored Custom text remains as typed.** Latest source build: `http://127.0.0.1:3322/play`, isolated local Owner Demo Supabase reused read-only. No Gemini call, migration, seed, reset, production access, commit, push or deploy.

- Botanist test-only nutrition fixtures no longer render in the botanical station. The NPC greeting is localized; station content is compact and the empty state explicitly says no reviewed botanical discoveries are eligible. Desktop/mobile Talk and empty-state screenshots were opened. No botanical Save/Equip success is claimed because there are no eligible items in this Journey.
- The Plan Builder retains the reference's NPC introduction, icon/title/reason on the left, A/B/Custom on the right, independent inclusion checkbox, subdued unchecked cards, live selected count, short disclaimer, and sticky confirm/skip actions. It uses a smaller responsive HTML layout and the existing 12 SVG icons rather than the reference's decorative poster frame. Duplicate companion speech and an extra back action were removed; the Custom input now fills its available width.
- My Journey keeps Daily Checklist, Herbs Equipped and Practices Equipped expanded together, with actual status and empty states; it does not record fictional daily completion or expose unset/flexible technical values. Lower-viewport screenshots show all three groups on desktop and mobile.
- Actual Chromium E2E: `node scripts/test-healthclues-mp17-goal-first-browser.mjs` PASS at `3322`. Two authenticated synthetic accounts exercised A/B/Custom, Plan confirmation/reload, locale switching with stable goal IDs/choices/numeric targets, zero-selection, standalone user goal, World/My Journey access and cross-account read/write rejection. Two Advisor requests were intercepted; zero Gemini calls and zero runtime exceptions. This did not modify any pre-existing account data.
- Opened screenshots are in `reports/previews/visual-redesign-20261102/`: VI/EN desktop and mobile goal-card views; selected/unselected and Custom; Botanist Talk and honest empty state desktop/mobile; My Journey top/lower desktop/mobile. Compare with `references/healthclues-plan-reference.png`: structure, warm parchment, companion intro, icons, options, disclaimer and confirmation hierarchy are reproduced; density and mobile content intentionally use scrolling. The 390×844 initial viewport starts above the cards, so the paired `*-mobile-goals.png` shows their interactive layout after scrolling.
- Focused source files include `WellnessPlanBuilder`, `WellnessEncyclopediaStation`, `WorldAdventureScene`, `world-adventure.css` and locale strings. No persistence schema or backend changes. Synthetic fixture visuals are not evidence of Gemini quality. The existing authenticated legacy-account path was not re-run in this visual task; previous legacy-answer evidence limitation remains: no persisted original 96-answer array is available in inspected legacy profiles.
- Build: isolated Next.js 16.3 production build `healthclues-visual-redesign-r3-20261102` passed TypeScript and route compilation. Focused ESLint exited 0 with two warnings in `WellnessEncyclopediaStation.tsx` (effect dependency `tx`; existing `<img>` optimization advice). The docs consistency guard ran; it reported only a semantic reminder to review `App/MASTER_SPEC.md`, and the updated UI/flow/business/acceptance docs were reviewed and found to cover this presentation-only change.

**Exact next task:** obtain a reviewed botanical item eligible for player-facing discovery to exercise item Save/Equip, and a valid synthetic authenticate
## Latest task ? MP17 legacy, AI-card Custom, and EN/VI regression ? 2026-11-02

**Legacy account compatibility: PARTIAL. AI-card Custom persistence: PASS (fixture). EN/VI visual switching: PARTIAL. Real Gemini persistence readiness: code-path reviewed; no Gemini call.** Browser E2E used the isolated Owner Demo at `http://127.0.0.1:3316/play`; the test harness intercepted all Advisor requests and never invoked Gemini.

- Chromium selected Custom inside the third AI recommendation card, typed `My test choice: note 1 drink pattern weekly`, confirmed the Plan, opened My Journey, and reloaded. The persisted Plan contained exactly three Active goals: `ai:b0617572-14e2-460d-8e2a-2be51b70c748` (A), `ai:70a44c93-7e37-440a-8908-8762f58689cd` (B), and `95b724f1-87f8-45fa-80be-11d9947e8407` (Custom). The fourth recommendation and the third recommendation's A/B alternatives were absent. The Custom row retained the authored text in both `title`, `trackingDefinition`, and `originalNote`, with `provenance=user_created`; the persistence contract has no source recommendation ID field, so persisted linkage back to that AI card is not supported.
- The separate `Add My Own Goal` UI was exercised by the other synthetic account after confirming a zero-goal Plan. It saved one distinct user-authored goal as Saved for Later; it did not establish evidence for AI-card Custom by itself.
- Direct Chromium captures of the same saved Plan after switching and reopening My Journey in EN and VI are in `reports/previews/mp17-final-legacy-custom-visual5-20261102/account-a-vi-same-plan-my-journey-en.png` and `reports/previews/mp17-final-legacy-custom-visual5-20261102/account-a-vi-same-plan-my-journey-vi.png`. The rendered ID list matched in both locales, there were no duplicates, Custom text remained byte-for-byte, labels localized, and World/My Journey reopened. API snapshots retained the same A/B values and numeric action values without a new Advisor call. **Partial:** the English screenshot still shows the two saved AI goal titles in Vietnamese; plan content is persisted in the selection locale and is not translated on display. The Custom text is intentionally unchanged.
- Read-only inspection of the local Owner Demo found 412 synthetic legacy-shaped profiles (`topic`, no `adaptiveDiscovery`), 405 with a World, 92 with a saved Plan, and 133 with equipped toolkit rows. None of the legacy-shaped profiles stored an `answers`, `quizAnswers`, or adaptive answer array. The application source keeps old 96-question drafts in tab `sessionStorage`; the final profile-save notice also says full Quiz answers are not saved. No legacy account was modified and no browser login to a legacy-profile account was performed. Thus retention of the original 96 answers cannot be accepted from the available persisted data; legacy World/Plan continuity needs a dedicated authenticated browser regression.
- `node scripts/test-healthclues-localization.mjs` against the same local build passed in Chromium: an in-progress original Quiz draft retained canonical answers and question position across EN/VI and reload. This was a guest/tab draft, not an existing authenticated account. Screenshots are in `reports/previews/mp17-final-legacy-quiz-draft-20261102/`.
- The existing real Plan POST verifies signed AI goals and normalizes them into the same persisted Plan contract used by fixture E2E. Readiness is based on source flow and prior offline validation only. No actual provider response was routed through persistence in this task; AI quality and real-inference persistence remain unverified.
- The final full fixture harness on this build completed with 0 browser runtime exceptions and 3 Advisor requests intercepted; the visually focused run reopened the same saved Plan in both locales. The harness also passed account-isolation, zero-goal, and standalone-goal assertions. No source behavior, migration, seed, production data, commit, push, or deployment was changed.

**Exact next task:** fix or explicitly product-accept the untranslated AI goal content in EN/VI My Journey, then run an authenticated Chromium regression against an existing synthetic legacy-shaped account with a saved Plan and equip
# Latest task — MP20 two-question discovery and Hành trang entry — 2026-11-02

**Status: Quiz source IMPLEMENTED; focused local Chromium fixture UI PASS; overall player journey PARTIAL.** This update supersedes the MP19 new-player adaptive up-to-three-question UI while retaining world-first selection/direct region product direction. Exact latest-source demo URL verified by rebuild and HTTP 200: `http://127.0.0.1:3326/play` (isolated local Owner Demo; Auth/REST/Mailpit on loopback, existing Supabase reused without migrations/seeds).

- Replaced the new-player discovery UI with exactly two local screens: world-specific single concern selection and concern-specific multi-select contextual factors. Gout, weight, glucose and sleep have separate factor lists; unknown/custom topics receive a neutral fallback. None/Unsure and zero factors are supported. No adaptive question API or Gemini call is made during these two screens. Existing locale, age gate, encrypted activation continuation, World selection and profile JSON contracts remain in place. Recurrent painful/swollen joint history does not mark the separate current acute-joint safety state as yes.
- Increased existing pending-journey and Advisor answer-array bounds from 5 to 12 for multi-select (backward-compatible), and require answer ID/label pairing. No migration or database field was added. Recurrent joint symptoms remain reported context only and do not set the separate acute-joint field. The Quiz warns against treating self-report as diagnosis and asks professional assessment for new/severe pain/swelling. Factor language is based on NIAMS/NHLBI/NIDDK references in `KNOWLEDGE_AND_SAFETY_SPEC.md`; public editorial sign-off remains outstanding.
- The actual My Journey modal contains the suggestion builder under its current goal/herb/practice inventory sections; first-entry Plan prompt opens My Journey with companion copy. In this central hub, a checked A/B/Custom goal with a valid implementation is wired to save immediately through the existing signed, authenticated Plan API; unchecking removes it from the current revision, and existing goals outside the displayed suggestion set are merged forward. The standalone Quiz Builder retains global Confirm Plan behavior. Immediate persistence is implemented but has not been exercised in an authenticated browser/API run. No real Gemini call was made.
- Final isolated production build passed for current source, including immediate Plan callback and Custom canonical identity/rehydration code; Next TypeScript phase and static route generation passed. Owner Demo was rebuilt at port 3326 after stopping only its verified prior app process, preserving Supabase, and read-only reuse verification confirmed local Auth/REST/Mailpit; no migration/seed.
- `scripts/test-healthclues-mp20-two-question-browser.mjs` passed on current source at 3326 using synthetic UI selection. It exercised Gout → factor multi-select → World preview; then Sleep concern and sleep-specific factors; then Weight Management and weight-specific factors. It asserted zero adaptive-discovery and zero Advisor requests and no browser exceptions. It did not complete activation or write Plan data. Repeated CDP starts were intermittent (`Page.enable` timeouts); the successful run used debug timing. Screenshots visually inspected: `reports/previews/mp20-two-question-concern-desktop.png`, `reports/previews/mp20-two-question-gout-q2-desktop.png`, `reports/previews/mp20-two-question-gout-q2-mobile.png` (390×844), and `reports/previews/mp20-two-question-postquiz-mobile.png`. The 390-wide full-page screenshot shows factor cards in a vertical scrollable list; this is focused visual evidence, not full responsive acceptance.
- Focused offline tests passed after live-selection changes: adaptive schema (13 assertions), Plan contract (40+), mocked Gemini pipeline. Localization browser suite failed at Chrome DevTools `Page.enable` timeout. Direct `tsc` is blocked by stale root `.next/types/validator.ts` route union; isolated Next build's own TypeScript check passed. Docs guard passed after all recommended targets were updated.
- **Not verified:** account activation with new two-screen profile; 

## UI_UX_SPEC.md
## Visual redesign checkpoint — 2026-11-02

- **Botanist:** existing Botanist portrait and localized Talk greeting; compact reviewed, Journey-eligible botanical cards only. Keep name/icon/brief description/status visible, with safety, evidence and references in a separate detail view. If none qualify, show the localized empty state; never fill the Botanical Garden with unrelated/test-only nutrition fixtures. Discovery, Saved and Equipped remain distinct.
- **In-World Plan Builder:** show the localized companion introduction once, then interactive cards with checkbox + illustrated goal/title/reason on the left and A/B/Custom on the right. Unchecked cards remain available but subdued. Keep the live selected count, concise wellness disclaimer and sticky Confirm/Skip actions. Use the existing SVG icon set. On mobile, the list scrolls to reveal complete card controls.
- **My Journey:** a separate persistent journal with Daily Checklist, Herbs Equipped and Practices Equipped expanded together. Use compact icon-led rows, localized status/empty states, and panel-local scrolling. Do not imply daily completion or show raw `flexible`/unset values.
- **Browser evidence:** 1440×900 and 390×844 captures were opened under `reports/previews/visual-redesign-20261102/`. Reproduced the reference's parchment palette, companion speech, goal icons, left/right card hierarchy, independent selection, disclaimer and confirmation controls. The ornate full-page poster frame is adapted to compact, responsive, scrollable HTML. The empty Botanist state is expected because no reviewed botanical entry currently qualifies; item-card Save/Equip visuals are not fabricated.


## 09C ? NPC discovery stations, Care Plan and region camera

Both playable Region Maps now show landmarks for Herbal & Nutrition, Activity Trail/Movement, Wellness Sanctuary/Practices, Camp, Knowledge, optional challenge and Rewards. A shared station component names Botanist, Explorer or Wellness Guide, gives concise educational framing, search/details and separate save/use/equip actions. Catalog rows are current editorially reviewed versions only; filtering is by the saved topic tag and item category. Editorial status, evidence classification and suitability remain separately labeled. The content list is intentionally empty when there is no match.

Adventure Camp opens a separate Care Records Keeper desk. It distinguishes My Collection, Backpack, Care Plan and Journal. Care Plan includes optional user methods and medicines with user-entered information, private self-report history, pause/delete and explicit acknowledgement. Medication UI warns that it does not prescribe or change medicines; it does not calculate or reward doses. Private notes are not stored in browser storage.

The existing React/SVG/DOM scene remains the renderer. Camera controls use bounded scale, pointer drag, wheel zoom, accessible zoom/reset buttons and arrow-key pan; hotspots are transformed with the same layer. Browser-specific gesture, focus and reduced-motion QA status is listed in the 09C report; do not infer 60 FPS without measurement.


## Master Prompt 15 — guided My Journey spotlight behavior (2026-11-01)

The existing My Journey tutorial keeps all four real sections expanded and introduces Wellness Focus, Daily Checklist, Herbs Equipped and Practices Equipped in sequence. At each stop exactly one section receives the primary outline/glow; the other three are subdued. The real World is softly darkened and blocked behind the active dialog. Use the modal backdrop as the World dim layer so the actual Journey panel paints above it; do not use a body-level overlay that can out-stack the target content. Keep dialogue adjacent in normal panel flow. Auto-scroll within the Journey body to show the dialogue and target, preserve scrolling for long targets, and recalculate geometry when content or viewport changes. English/Vietnamese dialogue is presentation-only. No Quiz, Plan, inventory, World or tutorial persistence semantics change.

Implementation/browser evidence: reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md (isolated local Chromium, final build http://127.0.0.1:3296/play). Overall broader player localization remains PARTIAL.


## reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md
## Starting state recovered

- The repository already contained extensive uncommitted modifications and untracked files. They were preserved; no reset, clean, restore, stage or commit was run.
- Existing Wellness Advisor was a Gemini selector over existing reviewed Catalog candidates. The source gate rejected all candidates before the model call because available habit templates were TEST ONLY. `WellnessPlanBuilder` configured one candidate at a time with numeric targets; it did not have two AI options per goal.
- The current Quiz profile exposes topic, interests/preferences, two-week goal and safety context, but has no structured baseline fields for red-meat frequency, hydration, sleep timing, or physical activity. The new path therefore cannot safely infer quantitative targets.
- Previous genuine synthetic-profile requests to `gemini-3.8-flash` returned HTTP 402/BILLING_REQUIRED. This session did not retry or call the provider. No response was available for JSON/source/safety validation.
- Read Next 16.3 route handler guidance from `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` before editing the route handler.


## Verified evidence

- `node --experimental-strip-types --experimental-specifier-resolution=node scripts/test-healthclues-personalized-plan-contract.mjs`: PASS, 14 assertions (schema/safety/source mismatch/unsupported target/relevance/urgent state, no caffeine/red-meat inference when unreported/already avoided, signed-option integrity and profile binding).
- `node --experimental-strip-types --experimental-specifier-resolution=node scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions.
- Focused ESLint across changed TS/TSX and test files: PASS.
- `npm run build:healthclues:isolated`: PASS; Next 16.3 production compilation and its TypeScript pass completed in an isolated build workspace. Existing root `.next` was not used/overwritten.
- Direct repository `tsc --noEmit`: not clean because the existing `.next/types/validator.ts` reports two `Route` vs `never` errors. Isolated production build's own TypeScript pass passed.
- Owner Demo preflight: PASS for local project `healthclues-owner-demo`, `127.0.0.1:54321`, Auth/REST/Mailpit reachable, no inherited remote Supabase URL.
- Newest isolated Owner Demo build: ready at `http://127.0.0.1:3299/play`; server reports Gemini configured, but this is configuration evidence only, not inference evidence. No Gemini request was made. No AI plan screenshot was captured.


## Acceptance not yet verified

- Real Gemini invocation, model response ID, schema response from provider, goal/source/safety acceptance, and Vietnamese Gemini output: **BLOCKED** by prior HTTP 402/BILLING_REQUIRED; no retry made.
- Chromium end-to-end A/B/custom/skip/confirm into World → My Journey → reload: **NOT RUN** on this change. No browser PASS is claimed.
- EN/VI full flow, two-account generated-goal isolation, desktop/mobile layout screenshots and runtime-error check: **NOT RUN** for this change.
- Distinct synthetic Gout/Sleep profiles with and without the specific reported baseline: pure validator coverage is partial; real model behavior was not exercised. Numeric baselines are deliberately not inferred from the existing profile.
- Custom input uses current server-side deterministic text risk assessment; this is a conservative keyword safety gate, not a clinical classifier. It cannot promise detection of every unsafe paraphrase.
- Gemini schema/provider compatibility for nullable nested target fields remains unverified without a provider response. Current server validation rejects any quantitative or ungrounded target metadata until structured baselines exist.



## reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md
## 2026-11-02 — Botanist / Plan Builder / My Journey visual redesign

**BOTANIST_VISUAL_ACCEPTANCE: PASS for localized Talk greeting and the actual no-eligible-reviewed-botanical empty state. PLAN_BUILDER_VISUAL_ACCEPTANCE: PASS for interactive responsive cards and controls, verified through opened Chromium screenshots. MY_JOURNEY_VISUAL_ACCEPTANCE: PASS for the three expanded localized sections, real equipment empty states and desktop/mobile scrolling. FUNCTIONAL_REGRESSION: PASS for the synthetic fixture Plan flow. EN_VI_LOCALIZATION: PASS for bilingual recommendation fixture display and labels.**

Current source was built in isolated Next.js 16.3 as `healthclues-visual-redesign-r3-20261102`, served at `http://127.0.0.1:3322/play`, reusing the local Owner Demo Supabase read-only. No Gemini inference, migration, seed, reset, production access, deploy, commit or push occurred.

The reference `references/healthclues-plan-reference.png` exists and was opened. The page reproduces its companion speech, warm parchment palette, illustrated goal icons, left/right card hierarchy, independent checkboxes, subdued unchecked cards, disclaimer, count and confirmation hierarchy. It adapts the ornate tall image frame into responsive scrollable HTML and uses the existing 12 SVG goal icons. The initial 390×844 viewport shows the introduction; paired captures scrolled to goal cards verify the controls.

Botanist shows the existing NPC on a localized Talk banner, a separate localized station greeting and only eligible botanical entries. No reviewed botanical entry qualifies for the current Journey, so the honest empty state is the accepted screen; no unrelated test nutrition fixtures are shown. No Save/Equip item-card success is claimed. My Journey remains separate from Plan Builder and keeps Daily Checklist, Herbs Equipped and Practices Equipped expanded, with actual statuses, empty states and inner scrolling.

Actual test: `node scripts/test-healthclues-mp17-goal-first-browser.mjs` exited 0 against port 3322. Two fresh authenticated synthetic accounts exercised Account A A/B/Custom selection, omitted goal 4, Plan API save/reload, EN/VI snapshot stability, zero selection, standalone authored goal, and cross-account Plan/profile read/write denial. Both Advisor requests were intercepted locally. Runtime exceptions: 0. Gemini was not contacted.

Opened screenshot evidence in `reports/previews/visual-redesign-20261102/` includes `account-a-vi-botanist-npc-greeting-desktop.png`, `account-a-vi-botanist-empty-desktop.png`, `botanist-empty-mobile.png`, `account-a-vi-plan-builder-vi-unselected-desktop.png`, `account-b-en-gout-plan-builder-en-unselected-desktop.png`, `account-a-vi-plan-builder-selected-unselected-desktop.png`, `account-a-vi-plan-builder-custom-option-desktop.png`, `account-a-vi-plan-builder-vi-mobile-goals.png`, `account-b-en-gout-plan-builder-en-mobile-goals.png`, `account-a-vi-custom-goal-my-journey-desktop.png`, `account-a-vi-journey-lower-desktop.png`, and `account-a-vi-journey-lower-mobile.png`.

**Remaining gaps:** no eligible botanical card is available to exercise Save/Equip visually. Synthetic fixture success is not live Gemini or recommendation-quality evidence. Existing legacy login was not rerun in this visual pass; historical 96-question answers remain unverifiable because no saved answer array was found. Physical mobile hardware was not tested. Focused ESLint exited 0 with two warnings in `WellnessEncyclopediaStation.tsx` (effect dependency `tx`; existing `<img>` optimization advice). The docs consistency guard ran and its `App/MASTER_SPEC.md` reminder was reviewed against the affected presentation-only scope.


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


## 2026-11-02 — EN/VI region NPC shell and legacy Quiz route regression

**Status: PARTIAL.** Isolated current-source build `mp17-npc-locale-20261102` ran at `http://127.0.0.1:3311/play` against the already-running local `healthclues-owner-demo` project (`127.0.0.1:54321`, Mailpit `127.0.0.1:54324`) in reuse-only mode. No migration, seed, reset, production request, deployment, or Gemini inference occurred.

- The shared region scene now displays localized landmark names, NPC role names and authored greetings, the NPC approach aria-label, Talk/Interact actions, and movement help through the existing HealthClues dictionary. Region IDs, safe-path movement, proximity gating, stored values and schemas are unchanged. Catalog/editorial text and provider replies remain in their source language with existing review/source status; no translation implies editorial review.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3311 node scripts/test-healthclues-mp17-goal-first-browser.mjs` returned **PASS_SYNTHETIC_QUESTIONS_LOCAL_AUTH_A_B_CUSTOM_PLAN_API_PERSISTENCE_ACCOUNT_ISOLATION_AND_RETURNING_WORLD**, 12 intercepted synthetic question requests and 0 browser runtime exceptions. Two new synthetic local accounts completed email activation through Mailpit, real World entry, Plan/My Journey, logout/login and owner isolation. Direct safe-path arrival at the Botanist verified exact English and Vietnamese name/greeting/Talk/landmark labels; both locales opened the existing nutrition station. At 390×844 the Talk action was in view with no horizontal overflow. Screenshot set: `reports/previews/mp17-npc-locale-20261102/`; opened and visually inspected `account-a-vi-botanist-talk-desktop.png`, `account-a-vi-botanist-talk-mobile.png`, and `account-b-en-sleep-botanist-talk-mobile.png`.
- This browser's adaptive questions and signed A/B/custom contract were explicitly synthetic QA data, not Gemini output. Its Plan/API account-isolation results apply to those isolated synthetic accounts only.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3311 node scripts/test-healthclues-localization.mjs` returned **PASS** for the concern-first default plus legacy Quiz route compatibility: canonical C01 answer and step survived EN↔VI navigation/reload, 96 canonical question/option translation coverage remained, and 390×844 layouts fit. This was a guest compatibility check; it did **not** exercise a previously saved authenticated legacy 96-question profile.
- Adaptive discovery suite: 13 assertions PASS. Wellness Plan/safety suite: 42 assertions PASS. Focused ESLint: 0 errors, 2 existing `<img>` optimization warnings in `RegionMapScene.tsx`. Current-source isolated production build completed and served the browser run.
- The older `test-healthclues-owner-auth-demo.mjs` did not reach authentication because it still expects the retired first-time “Two adventures are open” screen instead of the approved goal-first discovery. It is stale for new-player onboarding; the MP17 current-flow harness above was used for the current journey. One initial localization-harness attempt timed out at `Page.captureScreenshot`; raising its CDP operation timeout allowed the complete run to pass.

**Remaining:** verify an already-populated authenticated legacy 96-question account still reopens its prior answers/World without forced new onboarding; finish the wider Vietnamese World, station catalog, 
