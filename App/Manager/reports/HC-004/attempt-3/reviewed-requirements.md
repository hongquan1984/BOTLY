<!-- Captured excerpts; original documents remain authoritative. -->
## MASTER_SPEC.md
## Isolated final-demo evidence update — 2026-10-30

Fresh authenticated Chromium evidence on owner build `app-build-final-a7` verifies the approved two-map flow and the current TEST ONLY learning/reward slice. Four unique mini-games and four persisted Skill aggregates are implemented and browser-verified; a focused source test covers all five Skill thresholds. Boss key/unlock and the in-region Rewards station persist in the local World. These synthetic fixtures are not reviewed HealthClues education, and this evidence does not imply production readiness or completion of human art/content, physical-device, performance or release review. See `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.


## Local demo evidence update — 2026-10-29

Current local evidence and blocking status are maintained in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. The isolated owner build is still available at 3248; optional Pet Check-in with explicit private-note opt-in is browser verified. Local synthetic Catalog/Knowledge/Boss fixtures are not human-reviewed content. New API labels/filtering and a topic-matching migration are source-only until the isolated build succeeds; D: exhaustion currently blocks that build. This does not change product scope or imply production readiness.


## Implementation note — first-time guide slice (2026-10-29)

The authenticated owner build now offers a resumable, optional Pet-led first-time guide inside the already selected Region Map. This records the implementation evidence in `CURRENT_STATE.md`; it does not change the approved one-World/two-playable-region product scope and does not imply that reviewed tools or Knowledge lessons are available. Detailed UX and acceptance scope: `UI_UX_SPEC.md` and `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md`.



## BUSINESS_RULES.md
## Universal wellness plan retrieval and scope (2026-10-30)

Acceptance evidence update: actual local Chromium testing on build 3260 confirmed that only explicitly configured/confirmed goals persist to separate authenticated Worlds; reload preserves revisions and cross-owner read/write attempts return 404. This does not upgrade TEST ONLY templates to reviewed content or establish production readiness.

One shared topic-configured habit library serves all supported topics; topic names do not imply content approval. Only applicable templates or exact-topic Catalog records may be retrieved. Unknown or missing review/content coverage must not be filled by unrelated habits. Demo templates are isolated TEST ONLY and are rejected outside Owner Demo. Safety and target validation are deterministic server gates; personalization in the current checklist is rules-based, not a live AI model. No herbs, supplements or detailed therapies appear in onboarding. Such in-game NPC discoveries require explicit user confirmation to create a new plan revision.


## Personalized Wellness Plan — Master Prompt 16 (2026-11-01)

- Gemini may propose ordinary lifestyle habits without a pre-existing Catalog row. This supersedes the earlier all-Catalog source gate for this post-Quiz plan only; it does not make TEST ONLY Catalog entries approved or eligible.
- The server supplies an allow-listed set of public guidance references. The model may return source IDs only, never arbitrary citations. Server schema, topic, and safety validation runs per goal and may omit one invalid goal without discarding valid siblings.
- Each accepted goal has exactly two distinct options. Neither is preselected. The player may select A/B, enter one custom goal, or skip. Only explicit selections enter the existing Confirm Plan request; alternatives are not persisted as goals.
- Current Quiz profile has no structured food/activity/sleep/hydration quantity baseline. Numeric targets and unverified target metadata are rejected. Do not infer red-meat frequency, inactivity, or fluid needs from a topic alone.
- Medication changes, treatment, herbal/supplement claims or doses, restrictive diets, fasting/dehydration, alcohol-withdrawal plans, and movement with unresolved acute pain/restriction are excluded from ordinary generation. Sources and model self-declarations do not replace server safety checks.
- Suggestions are optional and are not diagnoses, treatment, or proof of benefit. Custom goals remain user-authored and pass the existing independent risk assessment.
- HTTP 402/BILLING_REQUIRED is a provider blocker. Do not retry it automatically, substitute fixtures as AI, or claim inference/schema acceptance without a real response. Any test fixture must be explicitly marked synthetic/test-only and never emitted as genuine AI output.

# MP20 — two-screen discovery and inventory constraints (2026-11-02)

- New-player discovery has exactly two question screens after World selection. Screen 1 chooses one concern; Sleep Valley uses sleep-only choices, while HealthClues Realm uses health concerns. Screen 2 is a concern-specific multi-select and optional note. No question is required to advance except the concern selection, age confirmation already required by the product, and a short description for Other.
- Concern/factor bank entries are self-reported circumstances or experiences; they are not all causes, diagnoses, or clinical risk classifications. No new diagnosis, medication, hydration, or activity safety state may be inferred from absence of a selected answer. A report of recurrent painful/swollen joints does not establish a current acute flare; `acutePainfulJoint` remains unknown unless directly assessed through its existing safety checkpoint. `none`/`unsure` are mutually exclusive with other factor selections.
- Gemini context must include selected World, concern, selected factors and optional note, locale and known safety context. It must not claim a user reported an unselected factor. Provider failure must not block onboarding or show fabricated AI output.
- A recommendation preview never equips a practice or botanical. Existing proximity, reviewed content and account-scoped NPC equipment APIs remain authoritative. A botanical suggestion does not imply safe use or efficacy.
- Existing authenticated Plan persistence remains the source of truth. No activation or daily completion is inferred from a Quiz answer or preview.




## ACCEPTANCE_TESTS.md
## Additional executed acceptance evidence - 2026-10-28

- **HC-AT04 source retraction:** `node scripts/run-healthclues-game-e2e.mjs` - PASS. A synthetic item is visible while active/reviewed/recommended; reviewer deactivation with a source-withdrawal reason removes it from public Catalog results, creates an audit event with the reason, and causes subsequent World creation with that item to be rejected. Fixture cleanup was verified. This validates the review-driven retraction path only; the fixture is not approved health content.

- **HC-AT15 concurrent check-in:** `node scripts/run-healthclues-game-e2e.mjs` - PASS. Two same-owner, same-local-date check-in POSTs run concurrently; both succeed with the same check-in ID and final XP total, and exactly one response reports an XP award. Synthetic fixtures are cleaned after the run.


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
## Latest continuation â€” Post-Quiz Wellness Plan local acceptance â€” 2026-10-30

- **Scope:** Quiz â†’ personalized everyday-habit checklist â†’ Add/Adjust/Save for later/Skip/custom goal â†’ review and explicit confirmation â†’ persist to the authenticated user's existing World. Herbal/supplement/therapy discovery remains in-world NPC flow. No Home, Pet evolution, challenge or Boss work.
- **Runtime verified:** local Supabase project `healthclues-owner-demo`, CLI `2.122.0`, API `http://127.0.0.1:54321`, DB `54322`, Mailpit `54324`. Project ID and loopback API/key came from `supabase status --workdir healthclues-owner-demo --output json`; Auth health/settings, REST Catalog and Mailpit returned 200. Dedicated ignored config: `App/.tmp/healthclues-owner-demo/owner-demo-runtime.json`. `.env.local` was not used or modified; no production endpoint/data was targeted. Docker CLI access required explicit Docker Desktop Linux named-pipe/Docker-config environment; this resolved the process context issue without restarting services or touching volumes.
- **Latest build:** `http://127.0.0.1:3261/play`, isolated source build `app-build-postquiz-safety-20261030`. Older demos 3249/3254/3257/3258 remain untouched. Reuse mode did not run migrations, fixture seeding, reset or container operations.
- **Chromium E2E:** `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3261 node scripts/test-healthclues-post-quiz-plan-browser.mjs` PASS for Gout and Sleep with two synthetic, locally confirmed Auth accounts. Final checks: wellness-plan unit tests PASS (41 assertions); Quiz safety PASS (38 assertions); focused ESLint 0 errors after removing one unused E2E variable; docs consistency guard PASS. Both ran Quiz â†’ distinct TEST ONLY checklist â†’ configure and adjust â†’ skip â†’ create measurable personal goal â†’ review/confirm â†’ authenticated activation consent â†’ create separate region World â†’ reload. Each plan revision remained `1`, owner/world remained stable, and browser runtime errors were `0`. Account B cross-read of A's plan and cross-write to A's World both returned 404. The test source is `scripts/test-healthclues-post-quiz-plan-browser.mjs`.
- **Visual QA:** Chromium screenshots captured at 1440Ã—900 and 390Ã—844; latest Gout/Sleep Plan and Review images were opened and inspected. No horizontal overflow at 390 px. World desktop capture waited for region artwork load; map, Pet and guide rendered. Paths are listed in `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md`.
- **AI/content:** no LLM is connected to this checklist. UI accurately says deterministic rules are used and live AI is not configured. Gout has 6 and Sleep 4 source-grounded habit templates, all TEST ONLY / not human-reviewed; other topics have configuration identifiers but no approved template coverage. No herbs/supplements/therapies are included.
- **Still PARTIAL:** Magic Link email callback was not tested on port 3261 because local Auth redirect allowlist is configured for 3257. The browser E2E uses already-confirmed synthetic local sessions, so it verifies activation/persistence but not email verification. The latest build also verifies the hydration safety dialog: unknown restriction context shows an alert, no false confirmation checkbox, and Add remains disabled. All source candidates also await independent editorial review before production use. RPG scope outside entering the two Worlds was not retested by this focused suite.
- **Next task:** keep this as the current Post-Quiz boundary; complete local Auth redirect verification on an owner-approved isolated callback setup and obtain human editorial review for habit templates before claiming full acceptance. Do not start Home/Phase 10B. Do not deploy.


## Master Prompt 17 â€” AI-guided onboarding & RPG Wellness Plan checkpoint (2026-11-01) â€” PARTIAL

- **Workspace protection:** existing repo already had extensive modified/deleted/untracked BOTLY and HealthClues files at session start. No reset/clean/restore/stage/deploy/production action was performed. Existing MP16 implementation and old Quiz bank were preserved.
- **Product/spec conflict resolved:** the newer MP17 direction supersedes MP16's pre-World Plan Builder for new players. The approved future path is concern â†’ short adaptive discovery â†’ existing verified activation â†’ World â†’ Pet â†’ optional goals â†’ current Plan/My Journey. Existing players remain legacy-compatible. No new adaptive flow or in-World sequencing is implemented yet.
- **Implemented this checkpoint:** current `WellnessPlanBuilder` now tracks AI goal inclusion independently from the A/B/custom implementation choice. Goal checkboxes default unchecked; selecting A/B/custom alone does not add a goal to the pending Plan; checking after choosing an option adds it; unchecking removes it; selection count is exposed and updated. Custom choice uses a radio and one text input. Added Vietnamese labels and a guard against confirming a checked suggestion without an implementation. Also added a strict server-side adaptive-discovery request/response schema and Gemini endpoint, restricted to the local Owner Demo, minimized to focus plus categorical prior answers, with localized truthful failure handling and max-four-question validation. This is still not wired into the legacy pre-World flow.
- **Not done:** concern-first entry UI; wiring adaptive questions into onboarding; new-profile compatibility/activation handoff; post-World goal presentation/Pet sequencing; real AI question inference; authenticated/full-journey browser persistence and account-isolation acceptance. Synthetic Builder controls were tested; this does not accept the new player flow.
- **Provider:** prior genuine synthetic Gemini calls yielded HTTP 402/BILLING_REQUIRED; no retry in this task. Do not claim live recommendations or generated adaptive questions.
- **Verification:** adaptive-discovery contract suite 11 assertions PASS; MP16 personalized-plan contract suite PASS (14 assertions); shared Plan suite PASS (42 assertions); focused ESLint and isolated Next 16.3 production build + TypeScript PASS; isolated Owner Demo preflight PASS for `healthclues-owner-demo` / `127.0.0.1:54321`, Auth/REST/Mailpit, no remote Supabase inherited; latest source build `http://127.0.0.1:3304/play` returns HTTP 200. Reuse-only build; no migration/seed. Actual Chromium synthetic UI-only PASS: 13 assertions for unchecked defaults, A/B independence, check/uncheck count, Custom selection, non-persistable fixture, EN/VI labels, mobile width and 0 runtime exceptions. Screenshots captured and opened in `reports/previews/mp17-plan-selection-fixture/`. Real Gemini NOT CALLED. Docs consistency guard PASS. MP17 overall remains PARTIAL.
- **Exact next task:** implement the reversible concern-first new-player UI and wire it to the local-only adaptive endpoint; carry canonical values through the encrypted activation handoff/profile without synthesizing old Quiz answers. Then render post-entry recommendations inside the authenticated World before the existing tutorial, reuse signed-goal/Plan API, and complete real EN/VI authenticated Chromium, zero-goal, reload, My Journey and account-isolation acceptance. Preserve legacy accounts and current game systems.

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


### Implemented first-playable UI checkpoint (2026-10-27)

The route `/en/wellness/healthclues/world?quest={questId}` currently renders a responsive equipment reveal and, after confirmation, the persistent World view. The reveal has a 4-step progress strip, quest/region intro, three Consume/Eat, Reduce/Avoid and Do/Practice slots, reviewed item details and safety/evidence text, replace/unequip/skip, zero-tool support, and an explicit enter-world action. No item is preselected. When no reviewed Catalog items exist, the slot can be skipped and the map remains available.

The World screen uses a real inline SVG map with eight selectable regions, a highlighted current quest, dotted route, checkpoint markers, map/list alternative, active trail panel, Today/check-in action, next elapsed-day milestone, journey history and collection summary. Equipped tools expose pause/resume, schedule and same-slot replacement; replacement confirmation states that old usage stays on the prior Tool Entry. The check-in is a modal/bottom sheet with Done, Not Yet, Skipped, Not Suitable, optional occurrence count for practice tools, and a private note. Mobile stacks the map and panels without requiring zoom to find Today. Quiz drafts (answers, quest and step index) resume from the current browser tab's session storage after refresh; they are not sent to the server unless the user separately consents to save a profile.

Visual validation on 1440×1000 desktop and 390×844 mobile is recorded at `App/reports/healthclues-equipment-desktop.png`, `App/reports/healthclues-world-desktop.png` and `App/reports/healthclues-world-mobile.png`. These show the current implementation, including synthetic test copy; they are not approved product artwork. The named reference image was not present at test time, so no claim of a visual match is made. The current map uses vector terrain, paths and symbols, not a final authored fantasy illustration.

Seven stages: Welcome to Your Wellness World; Choose Your Quest; Discover Your Lifestyle; Personalized Safety & Preferences; Unlock Your Wellness Toolkit; Equip Your Starting Tools; Enter Your Wellness World. Use warm adult RPG and premium wellness styling, gentle transitions, map reveal, progress, Back/Skip/Resume and keyboard support. Mobile-first cards; reduced motion disables transitions. No account wall before result. Target 8–10 initial questions using the existing bank; retain deeper questions for relevant future triggers.


## MP17 guided discovery and RPG goal selection — approved direction, not accepted end-to-end (2026-11-01)

New-player discovery uses one concern picker and short tap-first adaptive prompts, not the long legacy Quiz. AI recommendations appear in the actual World after the existing Pet welcome, without stacking the My Journey tutorial. Cards contain an unchecked goal checkbox, two action radio levels, and one custom radio that reveals one text field. Selection count updates immediately; zero-goal confirmation and postpone/continue are visible. A single concise disclaimer follows the list. In-world display, adaptive questions, and EN/VI browser acceptance are not implemented yet; do not mistake requirements for shipped behavior.

The existing pre-World Builder remains for legacy/rollback during migration. In that current Builder, the checkbox now controls inclusion independently from the A/B/custom mode. This UI change is source-implemented but awaits current-build Chromium verification.


## reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md
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


### Current-source local build and browser results

- Isolated reuse-only build `mp17-complete-final-20261101` completed successfully at `http://127.0.0.1:3310/play`. It used the existing isolated `healthclues-owner-demo` Supabase API at `127.0.0.1:54321` and local Mailpit at `127.0.0.1:54324`; no reset, volume deletion, migration, seed, production access or deployment occurred.
- `scripts/test-healthclues-mp17-goal-first-browser.mjs`: **PASS_SYNTHETIC_QUESTIONS_LOCAL_AUTH_ZERO_PLAN**. Chromium completed the concern-first branch in English and Vietnamese, switched EN↔VI during the VI quiz and preserved canonical answer IDs, then used a synthetic VI account and local Mailpit magic-link activation to reach the actual HealthClues Realm. It rendered Lumi’s in-World Plan introduction, confirmed zero goals, read the Plan for the authenticated World, opened My Journey and retained all three expanded sections after reload. Runtime exceptions: 0. The adaptive responses were explicit `SYNTHETIC_TEST` fixtures; the Advisor response was intercepted as unavailable; no Gemini inference occurred.
- `scripts/test-healthclues-mp17-plan-selection-browser.mjs`: **PASS_SYNTHETIC_UI_ONLY**, 16 assertions, runtime exceptions: 0. It verified independent checkbox state vs A/B/custom selection, zero/one selected count, labels and responsive EN/VI UI. Its fixture is deliberately non-persistable, so this is not evidence that selected AI goal options persist.
- `scripts/test-healthclues-adaptive-discovery.mjs`: PASS, 13 assertions. `scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions. Focused ESLint and `npm run docs:healthclues:check` passed. The docs guard mapped four change groups and passed across 12 files; manual accuracy review remains required.
- Actual Chromium screenshots generated at `reports/previews/mp17-goal-first-fixture/` include English/Vietnamese Welcome and adaptive question, activation preview desktop/mobile, verified World preparation, Vietnamese Lumi/Plan desktop, zero-goal confirm, and My Journey desktop/mobile. `vi-adaptive-question-desktop.png`, `vi-actual-world-pet-plan-desktop.png`, and `vi-zero-goal-my-journey-mobile.png` were opened and inspected. A separate UI-only screenshot set is at `reports/previews/mp17-plan-selection-fixture/`; the Vietnamese mobile goal-selection capture was opened and inspected.


