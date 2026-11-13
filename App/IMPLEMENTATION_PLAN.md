## 2026-11-06 — Cycle 24: NPC/Lumi Dialogue Clearance Fix & Mystery Gift Box Unboxing System

- **NPC / Lumi Dialogue Clearance Above Bottom Dock**:
  - Addressed user bug report and visual evidence (`media_1793977916493_0977592c.jpg`): speech bubble was overlapped and partially covered by the bottom navigation dock on short/landscape screens.
  - Adjusted stacking context: elevated `.hc-rpg-lumi-dialogue` and `.hc-rpg-lumi-reopen-btn` to `z-index: 35` (above `.hc-rpg-bottom-dock` `z-index: 30`).
  - Increased bottom spacing clearance across all breakpoints: Desktop `calc(6.5rem)`, Tablet `calc(6.5rem)`, Mobile `calc(6.2rem)`, Mobile compact `calc(5.8rem)`.
  - Added dedicated `@media (max-height: 540px)` rule for mobile landscape and short window heights: dialogue bubble is clamped to `max-width: min(380px, 48vw)` with streamlined padding and `bottom: calc(4.6rem)`, while bottom dock is anchored to `bottom: calc(0.35rem)`.
  - Verified zero dock collision or occlusion on all viewports.

- **Mystery Gift Box (Hộp Quà Bí Ẩn) & Unboxing Modal**:
  - Replaced next level reward display on Top HUD (`hc-rpg-next-reward`): secret item name is hidden; displayed as Mystery Gift Box 🎁 with glowing sparkling icon, title "Hộp Quà Bí Ẩn 🎁", and kicker "Phần thưởng Cấp 2".
  - Replaced Day 7 milestone display (`hc-rpg-day7-box`): displayed as "Hộp Quà Bí Ẩn Ngày 7 🎁" - "Hoàn thành 7 ngày để mở quà bất ngờ!".
  - Built `MysteryGiftModal` component (`src/features/healthclues/MysteryGiftModal.tsx`):
    * Stage 1: Sealed mystery box floating in center with backdrop blur, golden borders, orbiting sparkles, and status indicator.
    * Stage 2: 1.4s animated unboxing choreography: anticipation wobble shake (`hcBoxOpenSequence`), scale up zoom to 1.4x, box lid pops off and tilts (`hcLidPop`), vertical golden light beam shoots up, radiant rotating sunburst rays (`hcSunburstSpin`), and 360-degree confetti & sparkle explosion (28 particles).
    * Stage 3: Mystery treasure floats up into view with glowing golden aura, item icon, title, lore description, EXP bonus tags, claim CTA, and unbox replay button.
    * Integrated interactive preview/test button to allow immediate inspection and verification.

---

## 2026-11-05 — Comprehensive Acceptance Round (Automated Verification Complete)

- Decommissioned quick-activate session bypass (HTTP 410 Gone); removed all instant buttons from client DOM.
- Fixed Sleep Valley region binding: `questId === "sleep-better"` and Luna companion strictly persist across magic link email callback and reload.
- Implemented immediate skip on Advisor loading; skipping plan opens honest empty state in World without error modals.
- Fixed NPC interaction: walk first, modal opens strictly upon arrival after clicking Talk or Interact.
- Enforced truthful Level 1 (0 / 50 EXP) progression and dynamic Daily Care card from `wellnessGoals`.
- Verified 3-button mobile dock (`Bản đồ · Hôm nay · Túi đồ`) across 320px, 390px, and 430px viewports.
- Automated CDP tests passed (`scripts/test-acceptance-round-fixes.mjs`): 5 screenshots captured and verified in artifacts directory.

## 2026-11-05 — Independent Tester handoff runner (implemented; live round pending)

Added `tester.bat` and `tester/` as a source-read-only Codex acceptance runner that creates a dedicated Tester thread on first use and resumes its saved ID thereafter. Antigravity supplies a per-round handoff, waits for the batch to exit, and reads a unique review plus `reports/tester/LATEST.json` and `PROMPT_FOR_ANTIGRAVITY.md`. The runner computes PASS/REWORK/BLOCKED from ten required checks and rejects unevidenced PASS responses. `--check` and focused contract tests passed; the first real Codex round produced a `REWORK` report, while second-run resume and the Antigravity repair loop remain unverified. Fresh synthetic test-account records are allowed only in the independently verified isolated loopback Owner Demo; source, production and existing accounts remain untouched. Exact usage and limits: `tester/README.md` and `reports/TESTER_RUNNER_ACCEPTANCE.md`. Product implementation priority remains the authenticated MP20 signed-goal persistence browser case documented below; the Tester must keep that item UNVERIFIED until directly exercised.

## 2026-11-05 — Concrete action title proof regression (completed locally)

- Fixed the mismatch between concrete generated action titles and signed Advisor proof validation, retaining the exact selected action while allowing the historical signed title form.
- Updated the proof contract suite for both representations and repaired one stale source assertion in the offline Gout-context regression to match the existing Pet concern presentation.
- Verification status and exact commands are in `CURRENT_STATE.md` and `reports/V1_MISSION_AND_SPECIFIC_HABIT_FIXES.md`. No Gemini, database, migration, production or browser verification is claimed for this slice.
- **Next task:** adapt the authenticated synthetic signed-goal browser harness from MP17 to the current MP20 two-screen activation flow, intercept all Advisor requests, and verify selected A/B/Custom persistence/readback and account isolation on fresh local synthetic accounts. Local runtime preflight already passed; preserve existing demo accounts/data and keep captures in a unique `.tmp` directory. Then continue the returning original-96-question locale/reload regression. Keep real Gemini and editorial review PARTIAL.

## 2026-11-02 — Plan contract test maintenance

Corrected a stale test-only source assertion to match the current accessible AI-goal checkbox markup: assert the `included` state binding and the localized “Include goal” label independently. No product component or behavior changed. The personalized-plan contract, Gemini pipeline, adaptive-discovery suites and isolated Owner Demo preflight pass. Next is the authenticated returning legacy World/Plan/toolkit browser regression; original 96-answer retention remains constrained by the absence of a persisted answer array. Eligible Botanist content requires editorial review.

## 2026-11-02 — UI redesign checkpoint complete (fixture evidence)

- Completed Botanist station presentation: localized NPC dialogue, reviewed/eligible botanical filtering, separate details flow and honest empty state. The station no longer renders the unrelated generic Nutrition test catalog.
- Completed interactive responsive Plan Builder and My Journey presentation refinements. Existing APIs/schemas are preserved. Corrected goal category localization and Custom input sizing; surfaced selected count before the cards.
- Verified isolated Next.js 16.3 build `healthclues-visual-redesign-r3-20261102`; authenticated synthetic Chromium E2E at `http://127.0.0.1:3322/play`, including Talk, A/B/Custom, persistence/reload, zero selection, standalone authored goal, locale stability, World/My Journey access and cross-account denial. All Advisor requests intercepted; zero runtime exceptions. Opened desktop/mobile evidence under `reports/previews/visual-redesign-20261102/` and compared against reference.
- Limits: no reviewed Botanist card is eligible, so Save/Equip item-card behavior is not visually exercised. Fixture E2E is not Gemini or recommendation-quality evidence. Existing authenticated legacy login was not rerun for this visual task; original 96-answer retention remains unverified because no persisted answer array was found.
- **Verification closeout:** focused ESLint exited 0 with two warnings in `WellnessEncyclopediaStation.tsx` (effect dependency `tx`; existing `<img>` optimization advice). The docs consistency guard ran and its `App/MASTER_SPEC.md` reminder was reviewed; updated UI, flow, business, acceptance, decision and current-state documents cover this presentation-only scope.
- **Next:** obtain a reviewed, eligible botanical entry to exercise item Save/Equip, and an authenticated synthetic legacy fixture with persisted original 96-question answers. Keep live Gemini and AI recommendation quality unverified.

## 2026-11-02 — MP17 final functional Plan acceptance

**FUNCTIONAL_PLAN_E2E: PASS using synthetic fixtures. REAL_GEMINI_INFERENCE: not run. AI_RECOMMENDATION_QUALITY: not evaluated by this run.** On `http://127.0.0.1:3316/play`, two local synthetic accounts completed concern-first onboarding and the actual Owner Demo Plan flow. Account A saved exactly three Active goals through the authenticated Plan API: `Ghi nhận lựa chọn đồ uống` (A), `Quan sát nếp ăn` (B), and exact Custom text `My test choice: note 1 drink pattern weekly`; Goal 4 was absent. Reload preserved those three IDs/options and no duplicates. EN/VI switches preserved canonical Plan API IDs, selected levels and numeric values. Account B confirmed zero goals, then retained a separate authored note unchanged as Saved for Later. Cross-account Plan reads/writes returned 404 both ways and profile RLS returned no foreign row. Runtime exceptions: 0. All Advisor requests were intercepted and fulfilled with TEST ONLY fixtures; Gemini was not contacted.

Screenshots were captured and visually inspected in `reports/previews/mp17-goal-first-fixture/`. Focused plan and mocked pipeline suites passed. New source build `mp17-final-plan-r3-20261102` matches the edited API/schema files. Gemini key/model are server-side and configured for the isolated runtime; no mock flags are active. The simplified live branch has one SDK attempt and successful logs count the current goals array. A live Gemini response and post-refinement AI quality remain unverified. No migration, seed, production, deployment, commit or push.

The Plan API preserves the exact `SYNTHETIC TEST ONLY · NOT PERSONALIZED ADVICE` evidence label only for a signed generated goal in the isolated Owner Demo; elsewhere it overwrites client evidence labels with the standard AI-generated disclaimer. This enables truthful local fixture persistence without accepting fixture provenance as AI proof.

**Next task:** run focused lint and `npm run docs:healthclues:check` on changed paths/documents. Do not call Gemini without separate authorization.

## 2026-11-01 — Master Prompt 15 guided focus completed

- **Completed / browser-verified:** four-stop My Journey focus tutorial, correct World dim/panel stacking on desktop and mobile emulation, live target scroll/resize tracking, adjacent Pet dialogue, keyboard/Back/Next/Skip, EN/VI tutorial copy, post-tour restoration.
- **Evidence:** isolated build http://127.0.0.1:3296/play; production build succeeded; full owner-auth Chromium E2E returned PASS, runtimeErrors 0. Screenshot set: reports/previews/mp15-focus-layerfix-final-20261101/. Detailed matrix in reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md.
- **Not changed:** schemas, Quiz/Plan, equipment rules, World IDs/artwork, Gemini; no Gemini inference. No physical mobile device test. No eligible reviewed Botanist herb fixture, so no herb equip success is claimed.
- **Next highest-priority task:** resume reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md for still-incomplete Vietnamese player coverage beyond this tour. Independently obtain human-reviewed Botanist catalog coverage before herb equipment acceptance. Preserve synthetic/production boundaries.
## Localization verification delta ? 2026-10-31

A current isolated build is running at http://127.0.0.1:3289/play. Focused Chromium acceptance passed for the English default, Vietnamese Welcome and Quiz C01/C02, shared canonical Quiz data, mid-Quiz locale switch/refresh preservation, guest preference, and responsive 390?844 controls. Static dictionary coverage and existing Quiz safety/branch regression checks passed. Full localization remains PARTIAL because authenticated preference handoff, most player surfaces, reviewed-content fallbacks and complete two-account journeys remain unverified. Continue from reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md.

## Highest-priority continuation ? complete player localization (2026-10-31)

Owner-approved requirement: English default plus full Vietnamese HealthClues player experience, including the same Quiz and persisted Journey.

**Current status: PARTIAL.** Locale provider, /en and /vi route counterparts, profile-preference endpoint support, welcome choice, initial Quiz localization and initial My Journey/Pet translation keys are implemented. Current browser validation is still in progress.

**Next exact task:** complete all missing player-facing Vietnamese surfaces and approved-content fallback disclosures, then test English and Vietnamese with separate synthetic local accounts through Quiz ? Plan/Advisor truthful state ? authenticated World ? Pet tutorial ? My Journey ? NPC/navigation, locale switching, reload, isolation and 1440?900 / 390?844. Keep the shared Quiz schema and all existing progression unchanged. Do not claim full localization until these journeys pass.

## Phase 10A — implemented in source, acceptance pending (2026-10-30)

Added optional Post-Quiz Plan Builder, deterministic Catalog filtering/ranking, accept/save/skip/custom goal/review, secure handoff and World plan persistence contract with Camp preview. No migration. Focused rules suites passed; final build rerun is pending. Exact remaining task is local DB identity read verification, then authenticated browser persistence/isolation tests and desktop/mobile screenshots. Phase 10B My Wellness Home and Phase 10C Challenges remain design-only; neither was implemented.

## Current continuation status — 2026-10-30
The existing authenticated local game now includes private nickname, persisted Pet-led guide stages through saved-state summary and optional reminder decision, a Gout-specific context helper, and an NPC provider-gated chat fallback. Chromium E2E passed on the rebuilt isolated demo and the playbook has 8 passing focused assertions. Remaining same-assignment work: mobile verification of new overlays and reminder settings, stale claimed-delivery recovery, real provider/cloud scheduler only after configuration/approval, and content/editorial/device acceptance. No new milestone is created. Exact evidence and the next task are in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.
# Implementation Plan (future work only)

## 2026-11-02 — NPC locale regression slice (completed locally; localization remains partial)

- Completed the authored region/NPC shell localization for landmark labels, role names/greetings, NPC approach aria-labels, Talk/Interact, and movement help. No schema, World/region IDs, owner boundary, or Quiz state changed.
- Current source built in isolated reuse-only local Owner Demo `mp17-npc-locale-20261102`, `http://127.0.0.1:3311/play`; Supabase/Mailpit reused at 54321/54324. No migrations, reset, seed, production access, Gemini request or deployment.
- Two new local synthetic accounts passed the current MP17 browser flow, World/Plan account isolation and logout/login, plus EN/VI safe-path Botanist interaction and Talk station open. Desktop/mobile 390×844 NPC screenshots and assertions passed; runtime exceptions 0. Responses were synthetic only, not Gemini.
- Separate guest compatibility harness passed original Quiz route/96-label source coverage and C01/step locale-switch+reload preservation. It is **not** evidence for a populated authenticated legacy account.
- Verification: adaptive discovery 13 PASS; Wellness Plan/safety 42 PASS; focused ESLint 0 errors/2 existing `<img>` warnings; isolated Next production build PASS; screenshot CDP timeout resolved by increasing harness timeout. Current docs guard and manual review are pending after this checkpoint update.

**Exact next task:** run a returning authenticated account populated via the original 96-question Quiz and verify its answers/World remain intact across locale switch and reload. Then continue remaining Vietnamese station/catalog, guide, knowledge and accessible game text. Keep MP17/full localization PARTIAL; do not make a live Gemini call while the latest recorded response is `503 INVALID_SCHEMA`.

## 2026-11-01 — MP17 selected-plan persistence checkpoint (PARTIAL)

- Rebuilt the isolated `healthclues-owner-demo` without resetting/reseeding Supabase at `http://127.0.0.1:3310/play`.
- Fixed Vietnamese Auth callback routing for `next=/vi/wellness/healthclues/world`; two separate VI/EN synthetic Mailpit accounts now reauthenticate to their existing World and retain locale.
- Browser E2E PASS: concern-first EN/VI onboarding with intercepted, explicitly synthetic adaptive replies → verified activation → real Sleep Valley/Luna or HealthClues Realm/Lumi → zero-goal confirm → personal goal note → three-section My Journey → reload → logout/login. No runtime errors.
- Actual Plan API PASS with isolated synthetic signed contracts: one Level A goal + one Level B goal + unchanged user-authored custom goal per account; deselected fourth suggestion absent; numeric values remain unset where no baseline exists; identical request key is idempotent; API readback after re-login remains exactly 3 goals. This validates persistence/safety gates but is not live Gemini and not a browser click-through of provider-generated goal cards.
- Cross-account checks PASS: profile RLS returns no foreign profile; Plan GET/POST against the other owner's World returns 404 both directions; locale, discovery, World and goal ownership stay separate.
- Additional suites PASS: adaptive discovery 13, Wellness Plan safety 42, personalized-plan contract 14; UI-only A/B/custom fixture 16. Full final docs check/lint remains pending after this checkpoint update.
- Latest recorded real Gemini result remains `503 INVALID_SCHEMA` for `gemini-3.8-flash`; previous provider invocation returned `402 BILLING_REQUIRED`. No provider call or billing change was made in this session.

**Remaining MP17:** valid real Gemini response and in-World card→persistence E2E; legacy original-96-question account regression; wider VI NPC/game copy and direct NPC regression. Current-status details and exact screenshot paths are in `CURRENT_STATE.md` and `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`. Do not mark MP17 complete.

## MP17 execution status — latest verified partial slice (2026-11-01)

The additive concern-first path is implemented and exercised through one real isolated local account: Welcome → EN/VI focus → adaptive-choice UI → existing verified Mailpit activation → actual HealthClues Realm/Lumi → in-World Plan → explicit zero-goal confirmation → authenticated Plan read → all three My Journey sections → reload. Adaptive questions were explicitly disclosed Chromium fixtures, not Gemini. Latest isolated build is `http://127.0.0.1:3310/play`; browser runtime exceptions were 0. Adaptive contract (13 assertions), Plan rules/safety (42 assertions), Plan UI fixture (16 assertions), focused ESLint, production build and documentation guard passed.

**Still open:** (1) run a second verified MP17 account and prove adaptive-profile/Plan owner isolation; (2) exercise a player-authored custom goal through the signed existing Plan API and verify exact My Journey/reload persistence; (3) complete the selected AI goal A/B/custom persistence case when a valid signed Advisor result is available; (4) complete EN/VI World navigation/map/NPC and accessible-game coverage; (5) repeat the authenticated path for Sleep Valley/Luna and run a returning legacy account regression. Real Gemini is **BLOCKED** by prior HTTP 402 `BILLING_REQUIRED`; do not retry billing or claim provider acceptance. See `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`. Do not mark MP17 complete.

## My Journey tutorial focus mode — 2026-10-31

Four internal tutorial focus stops and Pet narration are implemented. A separate full-World overlay dims and blocks map gestures below the My Journey drawer; sections remain open and only the active one is emphasized. The actual Pet+section pair is positioned together inside mobile panel scrolling and repositions on viewport resize. Existing progress persistence is reused. Latest isolated build `focus-mode-myjourney-20261031` at port 3293 passed owner-auth Chromium (`result: PASS`, runtimeErrors 0); assertions cover four focus stops, dimming, map overlay, dialogue adjacency/non-overlap and full mobile visibility. Desktop/mobile screenshots were inspected; evidence is in `reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md`.

Next exact task: continue the still-PARTIAL Vietnamese player localization acceptance in `reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md`, specifically authenticated desktop/mobile World → Pet → My Journey/NPC browser coverage across English/Vietnamese and owner-scoped locale persistence. Do not weaken the existing Botanist herb eligibility gate to create a test fixture.

## Prompt 14 continuation — verified 2026-10-31

The highest-priority My Journey/Pet integration gap was completed locally: Luna/Lumi now narrate the actual highlighted Checklist, Herbs and Practices sections. No-Plan copy states the saved Quiz focus without implying goals exist. E2E checks all section targets and narrator identities for both playable regions, desktop/mobile visibility, and the confirmed/no-Plan states. A new isolated build at `http://127.0.0.1:3282/play` passed the full owner-auth Chromium suite (`runtimeErrors: 0`) against the existing local `healthclues-owner-demo` with no migrations or seeds. Fresh screenshots are isolated under `reports/previews/master-prompt-14-tour-20261031/`.

Still blocked: real Botanist herb equipment persistence cannot be exercised until the isolated catalog contains an editorially approved item that passes the existing safety/eligibility gate. Do not relax that gate or fabricate a herb. Practice equip/persistence passed using the existing explicitly TEST ONLY local practice through the Wellness Guide. Gemini inference was not attempted; do not prioritize it over the primary acceptance or use credentials flagged for prior exposure. The next task is obtaining approved eligible herb coverage, followed by physical-device mobile review; no unrelated gameplay feature is in scope.

## Active owner priority — Master Prompt 13 recovery — 2026-10-31

The owner's current priority is My Journey RPG Inventory and fantasy icon integration. Existing source already implements the persistent left-side My Journey icon, one continuous panel with Wellness Focus / Daily Checklist / Herbs Equipped / Practices Equipped, truthful Plan and inventory states, NPC station-source persistence, and Luna/Lumi guided spotlight. Four CC BY 3.0 Game-icons.net SVG derivatives and their attribution are present. A fresh isolated owner build at `http://127.0.0.1:3281/play` passed the owner-auth Chromium regression with zero runtime errors after aligning the test's synthetic Gout profile to the Relaxation preference required by its practice fixture. No UI/schema changes were needed in this recovery. Herb equipment persistence remains unverified because the isolated Catalog has no eligible Botanist herb; preserve server safety gates and wait for an approved eligible item. The exact requested reference path under `design/references/` is absent; the same-named image under `references/` was inspected. Do not let the older Gemini Advisor continuation below override the owner's current Master Prompt 13 priority. Do not start Day 1–7, Home/Daily Care, new Challenges, or Gemini integration here.

## Continuation audit — 2026-10-31

The latest My Journey icon/navigation slice is already implemented and has isolated Chromium acceptance; do not treat it as the next unfinished task. The current deterministic Wellness Plan regression was re-run from the repository root and passed 42 assertions (`node --experimental-strip-types scripts/test-healthclues-wellness-plan.mjs`). The Advisor provider remains unverified because the dedicated runtime has no owner-provided private provider configuration, and eligible reviewed topic content is also absent. The next acceptance is therefore conditional: after those prerequisites are supplied, run synthetic-only live-provider validation, source/safety checks, confirmed Plan/World/Quests persistence and account isolation against the dedicated local demo. Until then keep the current deterministic disclosure and truthful empty/coverage-gap states. This audit made no source, schema or runtime changes.

## Existing final assignment continuation — personalized discovery implemented 2026-10-30

The single versioned recommendation rules service now reads the existing Quiz profile, RPG Catalog, private Backpack, Collection, active linked Care Plan entries, recommendation history and explicit feedback. It ranks deterministically, minimizes repeats already saved/shown, applies tri-state safety gates, returns explainable reasons and is reused at Camp/NPCs. One optional preference/time editor avoids new required Quiz questions. Local authenticated E2E evidence, synthetic fixture boundary and outstanding product/release gaps are recorded at the top of `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Remaining work is content/editorial and production release review, not a new milestone or duplicate recommender.

## Existing final assignment — character identity acceptance — implemented 2026-10-30

Distinct player and role-specific NPC sprites are integrated in both existing region scenes, with the current backgrounds, anchors and routes retained. Browser E2E on isolated owner build `app-build-final-a10` verifies unique loaded identity assets, role-to-station mapping, walk cycle and facing reversal, route movement/Pet follow, Talk after arrival, reload persistence, and the existing game flow. Actual whole-map and names-hidden character captures are linked in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. The region composition and scenery artwork are now locked pending explicit owner correction. This does not close physical-device performance, human-reviewed content or owner art approval gates.

## Existing final assignment continuation — shared two-region layout — implemented 2026-10-30

This section records work explicitly requested in `HEALTHCLUES_FINAL_COMPLETE.md`; the former “future work only” statement applies to the remaining unapproved phases below. Shared map blueprint, separate scenery-only art plates, one-label presentation and real owner-browser route checks are implemented in the existing renderer/path graph. Both regions use the same 16:9 logical anchors, with safe upper approaches on the walkable ground beneath the landmarks. Screenshot review of a9 led to a Camp hotspot clearance correction, a compact mobile welcome card and a ground-level NPC focus halo. The isolated `app-build-final-a10` full browser suite passed after rebuild on port 3249. Matched before/after screenshots and scope limits are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` and `CURRENT_STATE.md`. No schema or database migration was introduced by this layout work.

The remaining phase descriptions below preserve the earlier long-range proposal and are not a status statement about the implemented continuation sections above. Do not implement a listed future phase without the explicit approval and repository/schema review described in its gates. “Required tests” within those proposals are future test work; the completed continuation's actual evidence is recorded in the dated report and current handoff.

## Cross-phase Wellness Toolkit architecture
F016 is a structured identity and usage layer across phases, not another database/project. Keep four domains distinct: canonical Catalog item/version; reviewed Usage Method/Activity Template/version; member Toolkit entry/schedule; daily structured usage records. Existing `healthclues_discovery_content` may be linked after review but is not a complete item↔method↔user-toolkit model. Do not mine journal free text or bulk-convert ingredient strings into canonical IDs. All future storage stays in Botly’s existing Supabase project through separately approved additive migrations.

## Cross-phase discovery gate
Before any code: inventory current source behavior and identify tested/deployed status separately; inspect current Next version documentation per repository AGENTS instruction before writing code; verify Supabase applied migration list/schema in read-only mode; resolve open decisions; check data classification, auth and RLS, rollback, accessibility. Never create standalone backend/project.

## Phase 1 — Quiz → Plan → One Wellness World
- **Deliverables:** adaptive quiz completion/profile review, recommendation reasons/safety filter, create/continue persistent World, branches/journeys, Catalog picker, canonical item/method versions, My Toolkit states and basic equipping, map/list alternative.
- **Existing/reusable:** Quiz components/bank, profile JSONB/cloud save, reviewed discovery matcher/catalog/admin review, dashboard shell, articles/ebooks. Verify behavior before relying.
- **Missing/refactor/new:** World model, branch/journey schema, one-world uniqueness, canonical Catalog/Usage Method schema, Toolkit entries and private unreviewed tools, duplicate-proposal workflow, consistent consent/history, UI navigation/API contracts.
- **Dependencies/data:** additive profile version + catalog item/version, usage method/version/link, World/branch/journey/toolkit entry, personal tool/proposal; auth/RLS and content eligibility.
- **API concepts:** `GET/PUT /api/healthclues/profile`; `POST /quiz/sessions`, `PATCH /quiz/sessions/{id}`; `GET /discoveries`; `POST /world`; `GET /world`; `POST /branches`, `POST /journeys`, `POST /journeys/{id}/activities`.
- **Screens:** S01–S05, S08, S15–S17.
- **Tests/acceptance:** UC01–06, UC31–32, UC34–36; recommendation safety, canonical identity vs method, duplicate handling, personal tool isolation, RLS, unique World, map/list accessibility.
- **Risks:** live schema mismatch, guest-to-member transfer, profile JSON compatibility, safety review backlog, duplicate identities/taxonomy governance.
- **Approval gates:** product model/data migration, privacy/RLS review, content reviewer sign-off, staged release approval.

## Phase 2 — Check-in → Notes → Email → Milestones → XP
- **Deliverables:** daily check-in, private journal, structured daily usage records (item ID + optional method ID, occurrences/count/time optional), activity/tool state changes, reminders, idempotent ledger, milestone reflection.
- **Reusable:** email provider/client and timezone utilities may be candidate; inspect consent semantics and Night Companion isolation.
- **New:** check-in/journal/usage/occurrence tables, toolkit schedule/state history, XP ledger, milestone and notification job/delivery tables/workers.
- **API:** `POST/PUT /world/check-ins/{localDate}`; `GET /journal`; `PATCH /activities/{id}`; `PUT /notification-preferences`; `POST /notification-manage`; `GET /rewards`.
- **Screens:** S06–08, S12–13, S18.
- **Tests/acceptance:** UC07–12, UC33–34; ID-based usage queries, optional count with no dose semantics, no XP scaling, edit idempotency, DST, private RLS and delivery failures.
- **Risks:** local date uniqueness, provider idempotency, note leakage, count misread as dose or gamified quantity.
- **Gates:** privacy retention approval, email consent/unsubscribe review, worker reliability and restore rehearsal, release approval.

## Phase 3 — Community Journeys → Follow → Sharing → Moderation
- **Deliverables:** projection lifecycle, explorer with same-item vs same-method matching, consented tool timeline, follow/update prefs, Start My Own rematching into independent Toolkit entries, moderation and revocation.
- **Reusable:** public content shell/admin authentication mechanisms only after security review; current discovery audit is not a substitute for community moderation.
- **New:** projection/update/follow/comment/report/audit and public tool usage projection data, moderation roles, consented ID lookup API with privacy suppression.
- **API:** `POST /journeys/{id}/sharing`; `DELETE /public-journeys/{id}`; `GET /community/journeys`; `POST /public-journeys/{id}/follow`; `POST /reports`; moderator decision endpoints.
- **Screens:** S09–11, S15 extensions.
- **Tests:** UC05, UC13–16, UC23, UC27–28, UC37–38; no journal/profile leakage, item/method distinction, consent, suppression, revocation and A/B independence.
- **Risks:** de-anonymization, abusive claims, stale cache/search, moderation workload, rare-item re-identification.
- **Gates:** threat model, privacy review, moderation staffing/SLA and takedown policy, explicit public launch approval.

## Phase 4 — Advanced Gamification → Regions → Mini-games → Rewards
- **Deliverables:** map region unlocks and knowledge games, reward catalog and achievement UX.
- **Reuse:** Phase 2 ledger only; no leaderboard based on health outcomes.
- **New:** versioned reward config, achievement evaluator, content game review.
- **API:** `GET /rewards/catalog`, `POST /rewards/{id}/claim`, `GET /achievements`.
- **Screens:** S05/S12 extensions.
- **Tests:** exploit/idempotency, fairness, no unsafe behavior/publicity incentive, accessibility/reduced motion.
- **Risks:** compulsion, gaming activity counts, unsupported knowledge quiz.
- **Gates:** gamification ethics review, evidence review for quiz content, reward abuse limits and approval.

## Phase 5 — AI Companion → Knowledge Acquisition → Continuous Personalization
- **Deliverables:** retrieval-grounded explanations, user-owned history summaries, alternative suggestions, weekly reflection, reviewed knowledge gap workflow.
- **Reuse:** active Knowledge Engine, consent and audit; no direct community anecdote-as-evidence.
- **New:** model/provider governance, retrieval index/versioning, scoped context selection, AI safety evaluation and opt-in.
- **API:** `POST /companion/sessions`; `POST /companion/messages`; `POST /companion/feedback`; admin source ingestion/review.
- **Screens:** S14 plus S15.
- **Tests:** claim boundaries, citation fidelity, prompt injection, sensitive data minimization, stale/retracted source, no auto-write without confirm.
- **Risks:** hallucination, vendor data processing, unreviewed content, medical reliance.
- **Gates:** AI privacy/vendor review, safety evaluation acceptance, human oversight and kill switch, explicit feature launch approval.

## Stage status distinction
### Milestone 09A execution checkpoint — 2026-10-29

**Completed and verified locally:** isolated Supabase Auth/PostgreSQL/Mailpit owner demo, current 28 migrations, confirmation email capture, actual Chromium signup/confirmation callback, encrypted pending Journey continuation, three-slot Backpack skip, single persistent World creation and `/play` same-ID resume. A second synthetic account was confirmed and could not read the first account's World/check-in. Evidence and runbook: `reports/OWNER_PLAYABLE_AUTH_ACCEPTANCE.md`.

This closes the owner-authentication access blocker for the local demo only; it does not mark the full product plan complete. Next implementation work is a reviewed, playable Sleep Valley slice, then personalized HealthClues Realm context. Detailed region maps/Pets, Journey-specific loadouts, in-map Knowledge games/Skills and human content/privacy gates remain outstanding.

### Execution checkpoint — 2026-10-27

**Verified in isolated local environment:** the first persistent World loop and core Toolkit lifecycle are implemented in the existing Next.js application. Additive migrations `20261027130000_healthclues_wellness_world.sql` and `20261027140000_healthclues_toolkit_lifecycle.sql` have been applied only to local isolated test databases. Server APIs provide reviewed Catalog reads, one-World creation (idempotent), private World loading, daily check-in/editing, owner-only private check-in detail, fixed/idempotent XP, Toolkit pause/resume, local-time schedule, and same-slot replacement that retains old usage records. The responsive Quest-specific game route, three typed equipment slots, accessible SVG map, check-in sheet, session-only Quiz draft/resume and existing Botly magic-link session reuse are integrated.

**Evidence:** `node scripts/test-healthclues-world-db.mjs` passes against the isolated test database with rollback. `node scripts/run-healthclues-game-e2e.mjs` passes including the intro → eight-quest selection → ten-question onboarding (including refresh/resume) → result → equipment → persistent World → daily check-in browser flow, real local database persistence, authenticated API, private-note isolation, schedule save, pause/resume/replacement, replacement history preservation, cross-user denial, desktop/mobile interactions and reload persistence. Screenshots are in `App/reports/healthclues-quiz-intro-desktop.png`, `App/reports/healthclues-quest-picker-desktop.png`, `App/reports/healthclues-equipment-desktop.png`, `App/reports/healthclues-world-desktop.png` and `App/reports/healthclues-world-mobile.png`. The E2E runner builds a copy under `App/.tmp`, not the case-colliding source/docs root.

**Not complete / not production-verified:** Recipe/Journey Combo presentation and partial acceptance, profile-aware safety filtering, add-to-collection and archive UI, branch creation beyond the initial branch, public Community/Follow/Moderation, real scheduled email delivery, Admin review UI, and broad desktop/mobile/accessibility regression remain outstanding. The normalized Catalog contains no product-reviewed V1 inventory; E2E uses clearly synthetic fixtures that are deleted afterward. The reference image `App/references/healthclues-game-ui.png` is absent, so screenshots were not compared to it. These gaps must not be reported as completed or live.

**Next:** preserve the present API/UI checks; implement and verify working Combo and activity lifecycle flows against the same isolated schema, then public projection/consent and moderation, reminder scheduler/sandbox, admin review path, security and Botly regression. Rebuild and rerun acceptance tests after each material application change. Production migration, content approval, real email and deploy remain separate gates.

### Incremental verification — 2026-10-27 (Collection)

Added the authenticated `POST /api/healthclues/world/collection` flow. Members can save an active, reviewed, exact-version Catalog Item before creating a World; the World GET response now exposes the owner's Collection even when `world` is null. The game Catalog picker exposes **Add to My Collection**. Guests retain only temporary browser-session IDs and do not write account data. A PostgREST success response with an empty body exposed a shared REST parsing bug; `serviceRest` now safely treats an empty successful response as `undefined`.

**Verified:** full isolated `node scripts/run-healthclues-game-e2e.mjs` passed after the fix, including pre-World Collection save and UI save; `node scripts/test-healthclues-world-db.mjs` passed with rollback. No new schema change was needed. This still does not complete Combo support, Community, email delivery, admin review, branch creation, or V1.

Source-present features are not automatically verified. At planning start, classify each as `found in source`, `test evidence found`, `production status confirmed`, `missing`, `refactor`. No production status may be asserted from code/migration files alone.

## V1 build prompt execution override
The current Build HealthClues V1 request supersedes earlier wording that this file is only a future plan or that advanced AI/mini-games are V1. Implement and test in the existing Next.js/Supabase project, preserving pre-existing user changes. Sequence: (0) reuse/alignment/spec sync; (1) playable guest onboarding, recommendations, 0–3 slots, World and first check-in against isolated test DB; (2) auth persistence, branches/journeys, Toolkit, schedules, usage, journal, XP/milestones; (3) public projection/community/matching/follow/start-own/moderation; (4) opt-in reminder and map polish/accessibility; (5) regression/security/release package.

Test DB/migrations may be used only in isolation. Production migration, real email and public deployment remain behind the grouped approval. Do not create another project/database or import/activate medical content without qualified review.
# Current milestone overlay — Master Prompt 08 Final V2 (2026-10-28)

This dated section records current work without rewriting the historical phase proposal above. Product approval does not mark work complete.

1. **Phase A — BLOCKED:** establish isolated local Auth + email inbox, then manually verify persistent owner demo. Current `.env.local` production target must not be used for test writes.
2. **Phase B — PARTIAL/BLOCKED:** preserve eight Overworld regions and centrally gate to two active regions (implemented/verified); build separate detailed Sleep and Health maps and shared landmark engine (not implemented).
3. **Phase C — BLOCKED:** persist Quiz-selected topic as account-owned Journey context and connect content/toolkit to it. `branch.topic_key` currently holds region ID.
4. **Phase D — PARTIAL:** existing V1 Toolkit, World, Check-in, Knowledge, Boss, Rewards and Community APIs remain; region integration, Pets, mini-games, Skills, per-Journey loadouts and daily companion rules are not complete/verified.
5. **Phase E — REQUIRED:** real Chromium Sleep and Health scenarios, persistence/switching/security checks, visual QA and documentation guard. Mock callback E2E is not real email verification.

Acceptance evidence and blockers: `CURRENT_STATE.md` and `reports/OWNER_PLAYABLE_FINAL_ACCEPTANCE.md`. Continue only in isolated test resources; do not deploy production.


## Milestone 09B execution status — 2026-10-29

- PASS: isolated 09A Auth remains available; current 3238 owner build uses local Auth/Mailpit and real Chromium email confirmation. The authenticated World route now presents the RPG map scene, preserves eight global region IDs, and allows only Sleep Valley/HealthClues Realm entry.
- PASS (tested scope): shared in-map region renderer and Luna/Lumi presentation; existing authenticated Sleep and Health/Gout test accounts reached correct region; Gout topic carried from Quiz without asking again; same World ID survived reload; no unrelated Gout Knowledge fallback.
- PARTIAL: scene art is programmatic SVG; no reviewed topic-specific Knowledge/Catalog content exists for tested Gout; Journey is derived from profile rather than a canonical Journey record; per-Journey loadouts, daily companion dialogue, mini-games, Skills, and full in-map Boss/reward loop remain.
- NEXT: supply reviewed topic-tagged content, formalize owner-scoped Journey/loadout behavior only after schema audit, then implement/verify learning and reward activities inside each scene. Do not expand the six Coming Soon regions or deploy.

Detailed matrix/commands/evidence: `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## Milestone 09C implementation snapshot ? 2026-10-29

- **Implemented in source:** Shared station encyclopedia UI; three discovery landmarks in both playable maps; resumable optional guide stages; private owner/world-scoped Care Plan API/schema and UI; first-pass map camera controls.
- **Verification gate:** isolated migration apply, actual owner build, Chromium station/care-plan flows, map interaction, cross-account access denial, screenshot inspection and docs guard.
- **Still open:** reviewed topic-specific Catalog/Knowledge content, individual NPC portrait art, real Quick Quiz/mini-game/Skills progression, Daily Companion conversation/reminders, rigorous privacy/retention and production release review. Do not mark 09C fully done while those tests/content/screens remain unavailable.

## 09D-R — verified movement slice, remaining work

Implemented and owner-browser verified: Sleep Valley walking, follow camera/Pet, approach-before-Talk, current React station overlays, separate hand-painted prototype environments. Remaining: human art approval, authored obstacle/collision boundaries beyond coarse corridors, full HealthClues Realm NPC travel QA, physical mobile pinch test, measured performance, and the separately tracked content/Knowledge/Boss/reward work. See `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

## Final local-demo delivery continuation — 2026-10-29 — PARTIAL / BLOCKED

- PASS slices: optional two-question Pet check-in and private-note opt-in; actual owner-browser TEST ONLY catalog preview/full details/Collection/private self-report/equipment; Sleep/Gout topic-matched Knowledge discover/quiz; persisted in-map Sleep Boss; local email/Auth, same World after reload and account isolation.
- Current verified build: `app-build-final-a2`, `http://127.0.0.1:3249/play`; Mailpit `http://127.0.0.1:54324`. Build lives in `%TEMP%\healthclues-owner-demo-builds` on C: because D: filled. `App/start-game-demo.bat` uses this URL/build root. Browser evidence and images are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` and `reports/previews/`.
- Local owner-service stop/start against the persistent isolated Supabase volume passed; a retained confirmed Chrome profile resumed `/play` and the same World ID after reload. No production endpoint/data was used.
- Remaining PARTIAL: separate mini-game, Skills, full Health-map movement, physical-device QA, FPS measurement, human art review, complete all-Quest/safety suite, and production-reviewed content. Fixtures remain TEST ONLY and are not HealthClues guidance. D: is critically low; keep output on C:.


## Verified final-demo status addendum — 2026-10-29

Latest implemented slice: safe corridor-constrained Region Map movement, author data for Sleep/Health routes and bridge decks, correct CSS-module sprite grounding, local navigation debug, and browser tests for pointer/keyboard/touch-emulated movement and NPC proximity. This did not complete the remaining final-game requirements. Mini-games, four shared Skills/five levels, precise polygon collision/foreground occlusion, physical mobile and performance measurement, production-reviewed content and human art review remain outstanding. See `CURRENT_STATE.md` and the latest final-game acceptance report for evidence and priority.

## Final owner-demo continuation — 2026-10-30 — verified local scope

- Built isolated Next production output `app-build-final-a7` from current source into `%TEMP%\healthclues-owner-demo-builds`; started it at `http://127.0.0.1:3249/play` using local Supabase status at `127.0.0.1:54321`. Existing `healthclues-owner-demo` database/volume and Auth/Mailpit data were retained; no migration, seed, reset, production access or external email was used for this source build.
- Browser PASS on that exact build: `node scripts/test-healthclues-owner-auth-demo.mjs` verified local Auth/Mailpit, both regions, all eight Overworld IDs/two playable/six Coming Soon, Quiz topic continuity, compact navigation and blocked terrain, NPC approach/Talk, Encyclopedia, Collection/Backpack, Care Plan isolation, optional Daily Companion private-note opt-in, four TEST ONLY mini-games, persisted Skills, Boss key/unlock/reward, Rewards station, World reload and `runtimeErrors: 0`. Full output/screenshots: `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` and `reports/previews/`.
- PASS: region layout regression (seven safe approaches each; 564 Sleep / 579 Health world units; one connected path; no bridge dependency); five-level Skill threshold test (11 boundary assertions); focused ESLint (0 errors; two existing `<img>` warnings); isolated current-source Next build.
- **Still partial by evidence:** browser data demonstrates early Skill levels; thresholds are source-tested, not all reached with persisted fixture data. TEST ONLY content is not human-reviewed. Prototype art, pixel-accurate collision, physical mobile gestures, FPS measurement and human privacy/security/production review remain unverified. Current state records the exact next task and owner-demo operation limits.

## Existing final assignment — character identity acceptance — implemented 2026-10-30

Distinct player and role-specific NPC sprites are integrated in both existing region scenes; current backgrounds, anchors and routes are retained. Browser E2E on isolated `app-build-final-a10` verifies unique loaded identity assets, role-to-station mapping, walk cycle and facing reversal, route movement/Pet follow, Talk after arrival, reload persistence and game flow. Whole-map and names-hidden captures are linked in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Region composition/artwork is locked pending explicit owner correction. Physical-device performance, human-reviewed learning content and owner art approval remain open.


## Final assignment status update — 2026-10-30

Implemented in current source: populated TEST ONLY station fixtures, separate demo/review/evidence flags, server-validated three-position equipment, explicit replacement, independent Collection state, private `unsure` check-in status, and updated NPC/Backpack interfaces. Additive migrations preserve existing rows and action categories. See the current dated section in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Final acceptance must remain limited to actual local-browser/DB evidence. Production content approval, deployment, real-device QA and owner art approval are separate open gates.


## Final Backpack & Toolkit execution status — 2026-10-30

The empty pre-world equipment chooser is now an explanatory handoff with three flexible open positions. In-region NPC discovery, Collection browsing/removal, same-category flexible equipment, explicit replacement and optional private check-in were implemented and passed on the isolated authenticated browser demo. See the latest section in eports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md for build, DB and screenshot evidence. Follow-up is content review, owner art approval and physical-device QA; this does not authorize production release.
# Integrated recommendation implementation status — 2026-10-30

Implemented in source: tri-state Quiz safety context, deterministic shared Catalog ranking, owner/World-authorized GET and private event POST API, additive history migration, Camp and NPC suggestion UI, server-side demo equip gate, TEST ONLY metadata and focused unit test. Pending this edit’s final local browser E2E: authenticated profile-differentiation, safety-gate, history persistence/cross-owner checks and current build verification. The remaining release blockers remain human editorial review, owner art approval, physical-device QA and production security review—not a new milestone.

## Realtime Gemini Advisor — implementation in progress — 2026-10-31

Server-only local adapter and UI provider states are implemented in source. Next required acceptance is owner-provided private Gemini runtime config, then genuine synthetic-profile Chromium calls, output/safety validation, Plan/Quests persistence and two-account isolation. Do not mark complete based on build/unit tests. No Home/Challenge scope is included.


## Gemini + Vietnamese Plan Builder checkpoint — 2026-10-31

Status: **PARTIAL**. Plan Builder/Reveal labels and Quiz-derived topic/preferences/focus use the existing shared Quiz option IDs and display translator. The Advisor route receives locale and keeps one canonical output schema. Current local reviewed-candidate gate correctly prevents provider calls when no approved candidates exist.

Evidence: isolated local demo 'healthclues-owner-demo', candidate URL http://127.0.0.1:3292/play (verify it remains live before use); genuine prior synthetic Gout and Sleep Gemini attempts for model gemini-3.8-flash returned HTTP 402, with no JSON to validate. The currently visible blocker is source eligibility: local content is TEST ONLY and not human-reviewed, so route returns a localized SOURCE_VALIDATION_FAILED and hides candidate cards in Vietnamese.

Focused suites: 38 Quiz safety assertions, 42 Plan rules assertions, eight adaptive Quest mappings plus fallback, focused ESLint clean. Chromium Reveal/Plan visual capture is real but uses a synthetic browser fixture, not a completed authenticated Quiz/confirmed-Plan journey. Two synthetic local accounts verified 'preferredLocale' persistence across fresh sign-in and rejected cross-account World preference writes (404).

**Next exact task:** after reviewed source coverage with approved Vietnamese copy exists, exercise the actual Gemini JSON/schema and safety gates with synthetic Gout/Sleep profiles; then complete authenticated browser journeys in both languages through confirmed Plan → World/My Journey → reload and account isolation. Do not bypass the source gate or claim full localization.
## Final Gemini/Plan Builder status — 2026-10-31

The latest isolated build at http://127.0.0.1:3292/play completed. Continue with reviewed bilingual source content and then authenticated English/Vietnamese persistence E2E. Current local catalog has 14 TEST ONLY entries and no reviewed-eligible rows; synthetic Gemini calls to `gemini-3.8-flash` received HTTP 402/BILLING_REQUIRED and yielded no schema/safety-validation evidence. Current application request guard correctly returns localized SOURCE_VALIDATION_FAILED before provider invocation. Full acceptance stays PARTIAL.

## Master Prompt 16 — personalized Wellness Plan — PARTIAL (2026-11-01)

Implemented source slice: structured canonical AI goal contract with exactly two distinct options; server-owned official guidance IDs; goal-by-goal topic/relevance/risk filtering; rejection of unsupported numeric target metadata given the current Quiz profile; Gemini locale-aware authoring path without reviewed Catalog gating; EN/VI Plan Builder option selection, one custom field and skip; existing Plan API accepts and revalidates selected `ai_generated` goals while preserving the existing profile/World persistence. An expiring server HMAC proof binds generated option content to the Quiz profile and is verified before persistence. User-created choices remain separately assessed. No DB migration or World/My Journey redesign.

Verification: 14 focused contract assertions, existing 42 Plan rule assertions, focused ESLint clean, Next 16 isolated production build passed, isolated Owner Demo preflight passed and newest source build starts at http://127.0.0.1:3299/play. No Gemini request was made because prior genuine synthetic calls returned HTTP 402/BILLING_REQUIRED. No browser confirmation/persistence E2E or screenshot was obtained for this new flow. Direct repo `tsc` still reports pre-existing `.next/types/validator.ts` route mismatch (`Route` vs `never`); isolated production build completed its own TypeScript pass.

Next: use a visibly `SYNTHETIC_TEST`-marked test-only browser interception to exercise EN/VI A/B/custom/skip/confirm/reload and account isolation on the local Owner Demo without invoking Gemini; then implement missing structured habit baselines only with explicit product/Quiz support. After provider billing is available, run one synthetic real inference and report HTTP/schema/source/safety outcome honestly. Do not mark the overall plan feature complete before these checks.

## MP17 — AI-guided onboarding and post-entry Plan (approved, partial, 2026-11-01)

1. Preserve the legacy Quiz/profile/Plan path and all data; define a reversible new-player marker/profile contract.
2. Add a concern-first EN/VI picker and wire it to the bounded structured adaptive-question API (server contract implemented, client not connected), using only minimized canonical answers; fail truthfully without blocking World entry.
3. Carry the new structured answers through existing encrypted activation handoff and existing profile owner/World storage without fabricating legacy Quiz keys.
4. Enter one existing playable region, show Pet welcome, then optional in-World recommendations before the current guide (no modal stack).
5. Reuse the existing Gemini goal schema, server HMAC proof, safety validation and Plan API. Implement separate include checkbox and A/B/custom modes, zero-goal confirmation, and selected-only persistence.
6. Verify real Gemini separately (currently blocked by prior HTTP 402), then run local isolated authenticated Chromium EN/VI, desktop/mobile, persistence, account isolation and legacy regression. No fixture may claim live AI.

Checkpoint 2026-11-01: item 2's **strict loopback-only adaptive endpoint/contract** and item 5's **UI selection-state distinction** are implemented in source; the client flow is not wired, and end-to-end tests are pending. Other steps remain NOT STARTED. Detailed exact next action: connect the reversible concern-first branch and carry its structured profile through activation, then route post-entry recommendation rendering without bypassing auth or the existing Plan API.
## Master Prompt 17 visual-asset addendum — 2026-11-01

Status: **PARTIAL**. A small, provenance-documented project SVG category set is connected to legacy plan goal cards; seven discovery-category icon mappings are prepared. The existing region Pet appears in a brief localized bubble; all World/Pet imagery is reused unchanged. See `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md` for focused Chromium evidence. The new concern-first chooser and post-entry in-World plan presentation remain NOT STARTED; continue those as the next product flow task, preserving the 96-question/legacy-account compatibility.

## MP17 continuation checkpoint — 2026-11-01

Source now contains the reversible concern-first Welcome branch, canonical adaptive discovery profile, bounded adaptive question API call, encrypted activation payload support, and post-entry Plan-panel trigger ahead of the existing tutorial. Existing artwork/icons and the legacy Quiz bank are preserved. Gemini remains real-inference BLOCKED at HTTP 402/BILLING_REQUIRED. Continue in this order: (1) finish a fresh isolated source build; (2) Chromium both locales through the adaptive screen and existing verified email callback; (3) verify the real World opens the Plan without tutorial stacking; (4) confirm selected A/B/custom and zero-goal Plans persist to My Journey after reload; (5) prove two-account isolation and returning legacy path; (6) inspect desktop/mobile captures and complete localization sweep. Current MP17 status remains PARTIAL.

## Gemini structured-output diagnosis — 2026-11-01

Current state: application-side pipeline hardening implemented; real inference remains unverified. The last call's historical record only establishes an application 503 / `INVALID_SCHEMA`; upstream status and parse-vs-schema stage were not captured and cannot be inferred retroactively. Keep the 402 record as historical evidence only.

Implemented server pipeline stages: local request-schema preflight; explicit `@google/genai` `models.generateContent` configuration (`responseMimeType` + `responseSchema`); provider HTTP error extraction; empty response; JSON decoding; canonical Zod response contract; per-goal semantic/safety validation; A/B-to-plan transformation. Sanitized logs retain upstream and application HTTP statuses separately, model/API method, stage, parser exception type, response bytes, Zod paths/types and safe/semantic rejection counts. Raw prompt/health profile/response and credentials are never logged. Offline regression covers malformed and hostile output while preserving accepted valid goals; no safety check was removed.

**Next action:** after the owner authorizes a single paid synthetic call, check the latest event for exact stage and upstream status; until then do not claim live Gemini or root-cause resolution. Independently continue MP17 persistence/browser acceptance tasks from the acceptance report.
## 2026-11-02 — Gemini 503 diagnostics

- Added structured server-side pipeline stages and separated provider HTTP status from application HTTP 503; expanded provider failure categories and correlation response headers.
- Added a Windows PowerShell 5.1 non-2xx response reader plus a mock route test; added mocked provider/parser/schema/mapping cases. These are local automated checks and do not validate a live provider response.
- **Status at this checkpoint:** mocked tests/build passed, but the updated server/config were not yet verified. Superseded by the completed “Diagnostic runtime activated” checkpoint below.

## 2026-11-02 — Diagnostic runtime activated

- Fresh current source is active at `http://127.0.0.1:3312/play`; local Supabase was reused read-only and the previous 3311 process was preserved.
- Server-only Gemini configuration and client bundle boundary are verified without printing secrets. Three real HTTP route mock cases pass, including sanitized PowerShell 5.1 failure capture and matching server correlation logs.
- **At that checkpoint:** one controlled live request was the next authorized task; it is now complete as recorded below.

## 2026-11-02 — Single live Gemini result

- Exactly one provider request reached Gemini (SDK success/status 200) with the authorized synthetic Vietnamese Sleep profile. App response 503 `RESPONSE_SCHEMA_MISMATCH`; four `goals[*].goalId` paths failed the canonical lowercase ASCII pattern; zero valid goals.
- JSON parsing passed; schema failed; safety and A/B Plan mapping were not reached. No persistence or additional request.
- **Status: REAL_GEMINI_PARTIAL.** Do not retry without new authorization. Before a future call, improve sanitized schema diagnostics to record issue codes and expected/received types without logging values; consider constraining `goalId` in the provider response schema.


## 2026-11-02 — simplified Gemini checklist contract

- Replaced the model-owned goal ID/category/source/safety/target schema with a strict bilingual title, short reason, and A/B title/action contract (maximum six suggestions). The selected focus and concise onboarding answers remain structured input. The UI continues to own inclusion and Custom controls.
- Server parsing assigns UUID-backed `ai:` IDs and a concern-derived category. The existing HMAC proof and Plan API validate the localized selected option; ordinary lifestyle suggestions no longer need a fixed catalog row/source ID. No target or universal quantity is synthesized.
- The same bilingual response supports EN/VI selection without another inference. An in-memory 25-minute signed-result cache covers locale route remounts; explicit retry bypasses it. Existing World, Quiz, Pet and My Journey flows/data were not changed.
- Offline synthetic verification: `node scripts/test-healthclues-personalized-plan-contract.mjs` PASS (19 assertions); `node scripts/test-healthclues-gemini-plan-pipeline.mjs` PASS (schema, max-six, missing B, malformed JSON, danger/safety, provider mocks, A/B Plan mapping); changed browser acceptance script syntax check PASS.
- `node scripts/build-healthclues-isolated.mjs` PASS (production compile, TypeScript, static generation). The project emitted its existing Next middleware deprecation notice. An initial build caught two integration issues; both were fixed and the final isolated build passed.
- No live Gemini inference or account/data write occurred. **Status: simplified contract offline-verified; not yet verified against a real Gemini response or live Plan save.** Exact next task: with explicit owner authorization, make one controlled synthetic inference, inspect bilingual recommendations/safety, and exercise the signed selection through the existing Plan API; no automatic live call.

## 2026-11-02 — one authorized simplified Gemini test

- Rebuilt current source at isolated port 3313 (`gemini-simplified-20261102`); verified copied source hashes, POST route registration, server-only config presence, no mock injection/mode files, and one SDK attempt. Reused local Supabase in read-only preflight mode; no migration/seed/reset.
- Exactly one request reached Gemini: HTTP 200 provider, HTTP 200 app, correlation `8daba742-033f-499e-b55e-e3e658dd2d28`, model `gemini-3.8-flash`, four returned goals. Pipeline completed through RECOMMENDATIONS_READY; A/B fields passed server validation, IDs are unique server UUIDs, EN/VI maps preserve IDs and null structured target values. No account/Plan write.
- **Live quality PARTIAL:** output included fixed durations/frequencies and \u201ctarget bedtime range\u201d in prose; current validator only rejects structured numeric target fields. Success telemetry `resultCount` was 0 due counting legacy `suggestions` instead of generated `goals`, although stage log and response count were four.
- No retry/follow-up call. Exact next task: enforce no generated numerical quantities/targets in prose in prompt and server validation, add offline regression, then stop pending new live-test authorization.

## 2026-11-02 — goal quality refinement

**Implemented/offline verified:** prompt and server checks now distinguish useful low-risk numeric experiments from unsupported higher-risk quantities; reasons must be relevant, A/B levels distinct, and EN/VI numbers consistent. Successful `resultCount` reports generated goals. Synthetic Sleep, Gout and Weight Management tests cover good and rejected examples; mocked Gemini pipeline suite passes.

**Still unverified:** live Gemini quality after this prompt change and browser E2E selection/persistence from an actual live returned plan. No live inference was made in this task.

## 2026-11-02 — bilingual Plan and legacy acceptance follow-up

- **Implemented and Chromium verified on current isolated build 3319:** signed bilingual recommendation snapshots persist in the existing profile JSONB Plan structure and localize AI title, reason and selected option. Locale changes preserve IDs, selected levels, numeric targets, active status and Plan versions. User Custom text remains literal.
- **Legacy regression:** a valid synthetic authenticated legacy profile opens its existing World/Plan, keeps ten Plan versions and two equipped practice entries through locale/reload, with no newly forced onboarding or duplicate goals. Original 96-question answers are absent from persisted `answers`/`quizAnswers`; preservation cannot be proven for that historical data.
- **Historical limitation:** old goals lacking the bilingual snapshot retain original saved text; no translation is generated. AI-card Custom is stored as a separate `user_created` UUID with no source recommendation linkage. Standalone user goal was separately tested.
- **Status:** new snapshot localization PASS; sampled legacy World/Plan behavior PASS; 96-answer preservation and old-record bilingual rendering PARTIAL; real Gemini quality not tested. Next task: locate a genuine authenticated legacy fixture with persisted 96-question answers and, if available, a historical bilingual recommendation source; otherwise keep the limitation explicit. No migration, seed, production access or Gemini inference.
## MP19 — world-first onboarding and visible discovery (2026-11-02)

- Implement the new-player order: localized Welcome → choose playable World among eight visible regions → adaptive short Quiz. Limit adaptive discovery to three questions; Sleep Valley fixes the focus to sleep, while HealthClues Realm asks its concern once. Preserve the selected quest through the existing encrypted activation handoff.
- Authenticated World now initializes directly into the stored region scene; the existing back-to-global-map control remains.
- Current validation is pending isolated production build and local Chromium end-to-end. Gemini inference is intentionally not called in implementation tests. Botanist Save/Equip remains gated on reviewed eligible content; the local catalog’s only botanical row is a TEST ONLY ginger fixture and is not eligible.
- Next: complete isolated synthetic-account flows (Sleep VI and Realm EN), activation callback, direct region arrival, visible Plan/unavailable state, NPC discovery and My Journey persistence; capture 1440×900 and 390×844. Then record provider/content limits and legacy regression status without weakening gates.
## MP19 implementation and verification update — 2026-11-02

- Implemented and built the world-first new-player flow, three-question adaptive cap, preserved world selection across local Mailpit activation, direct selected-region opening, first-entry Plan presentation, non-blocking optional nickname, and selected-world context in the Gemini prompt. Legacy Quiz path and the eight-region map are retained.
- **Verified locally:** owner-demo isolated production build at `http://127.0.0.1:3323/play`; Chromium synthetic flow PASS for Sleep selection/short Quiz through activation preview, and HealthClues Realm EN/VI selection, local account activation, direct arrival, A/B/Custom Plan persistence, zero goals, My Journey reload, Botanist proximity/empty state, two-account isolation and returning player. Advisor/Quiz provider calls were intercepted. This is not live Gemini evidence.
- Offline suites: adaptive discovery (13 assertions), wellness-plan (42 assertions), mocked Gemini pipeline all PASS. `docs:healthclues:check` passed after listing all mapped documents.
- **Still open:** authenticated Sleep activation/direct arrival/Luna persistence; Wellness Guide action-specific browser coverage; actual Gemini request/response and Gemini-to-Plan persistence; reviewed Botanist catalog coverage and Save/Equip; 96-answer legacy retention. Local Botanist is CONTENT_BLOCKED because only TEST ONLY Ginger exists and is ineligible.
- **Next task:** run authenticated local Sleep activation/direct-entry/Plan persistence; keep local synthetic tests separate from any live inference authorization or reviewed content approval.
# MP20 delivery checkpoint — 2026-11-02

1. Replace adaptive network-generated new-player questions with exactly two deterministic screens and concern-specific factor banks (Gout, weight, glucose, sleep; neutral fallback for unsupported/custom concerns). Preserve world-first route and encrypted activation context.
2. Keep Gemini server-only; verify that its existing profile context receives only selected factors and the chosen World. Never invoke provider during implementation tests.
3. Place suggestion review in the same My Journey panel as current goal/equipment status; continue using authenticated Plan API. The central-hub A/B/Custom UI now invokes per-goal save/unfollow after a valid explicit selection, preserves signed goal proofs and unrelated prior goals, and keeps zero-goal support. Next verify initial selection rehydration, API persistence, uncheck, Custom validation, reload and account isolation. The standalone Quiz Builder retains its existing global confirmation.
4. Keep herb/practice previews informational and NPC-only for selection. Audit real approved catalog; no eligible herb means CONTENT_BLOCKED. Do not seed data.
5. Verify with offline schema/personalization tests, isolated build, fixture-only Chromium E2E and docs guard. Separate fixture from live AI evidence. Legacy authenticated 96-answer retention remains unverified until an actual persisted fixture exists.

### Advisor → World checklist continuity implementation status

Implemented source now exposes sanitized Advisor lifecycle and correlation ID in the real Plan Builder, distinguishes zero accepted recommendations, keeps the suggestion list open after immediate goal saves, and opens recommendations from the persistent My Plan entry for profiles with a saved Quiz. Plan errors retain a request key for retry; the same authenticated view renders currently followed goals. Source behavior still requires focused contract/build verification; no real Gemini call or owner UX acceptance is claimed.


## 2026-11-03: Gout-to-Sleep context regression fix

Implemented: verified activation merges the new discovery profile while preserving locale/nickname and prior Plan history; older Plan snapshots receive the previous profile context hash. The selected/latest active World branch is retained on entry. Advisor World requests authenticate the account, verify World ownership, compare the request with the saved Quiz, and use only the saved profile. Missing/mismatched context is rejected before provider invocation. Completed/in-flight Advisor caches now include account, World and canonical discovery/safety context. World and Plan reads hide mismatched snapshots without deleting history. Plan UI displays localized selected concern/factors and distinguishes live Gemini responses from reused server/session results, deterministic demo and synthetic test fixtures.

Verification: synthetic Gout context regression, personalized Plan contract (40+ assertions), and Gemini pipeline suites passed. Focused ESLint passed with two hook-dependency warnings. Isolated production build passed TypeScript and generated 81 routes. The Owner Demo at http://127.0.0.1:3327/play and public Catalog returned HTTP 200; unauthenticated World/Plan APIs returned HTTP 401. No browser journey, Plan database write/readback or Gemini inference was run. Direct root tsc remains affected by stale .next/types/validator.ts; the isolated production build typecheck passed.

Next exact task: owner manually retries a synthetic Gout journey on the active local build and checks the shown concern/factors, recommendations, A/B/Custom selection, Following persistence and My Journey after reload. Capture the Advisor request ID if a failure occurs. Do not run live Gemini acceptance without explicit bounded owner authorization.
