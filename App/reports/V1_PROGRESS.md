# HealthClues V1 Progress

Updated: 2026-10-28 (age-skip general path, desktop/mobile visual QA, deletion lifecycle and full browser verification)

## Objective and stage

Complete the unified Master Prompt 03 scope in local/test. The illustrated World map is preserved. Current continuation is Stage 6/6: core play, Combos, Community, mock reminders, admin queues, account-data deletion, saved profile revision history, build and principal browser/database regressions are implemented and exercised. V1 remains NOT COMPLETE pending remaining authorization/consent coverage, qualified review of real content, and privacy/retention approval.

## Feature verification matrix

| Master Prompt feature | Status | Evidence / remaining work |
|---|---|---|
| Eight Quest selection | DONE AND VERIFIED | Browser E2E selects among all eight Quest cards. |
| Consented Discovery Profile, revision history and deletion | DONE AND VERIFIED | Profile saves receive a server-controlled version; prior versions are private and owner-readable, cross-user/anonymous access and client writes are denied, and deleting the profile cascades through saved revisions. Isolated REST E2E verifies revision increments and purge. |
| Adaptive 8–10 question Quiz, back/skip/resume, age gate | DONE AND VERIFIED | All eight branch entry points pass browser checks against the versioned 96-question bank; the focused branch-to-bank regression also checks eight Quest/topic mappings and the general concern fallback. A full 10-question path, resume/back/skip, underage stop and unknown-age Skip to general information (browser verifies no session profile and no DB row; desktop/mobile screenshots), 38 safety/skip assertions, reviewer draft/publish, protected structure, and public-note stripping pass. Broader demographic/consent combinations remain under the security matrix. |
| Personalized recommendations from reviewed Catalog | BLOCKED | Recommendation filtering, safety eligibility, reviewer workflow and empty state are tested using synthetic fixtures. Read-only isolated DB audit found zero currently active/reviewed Catalog rows; real items must be reviewed by a qualified human before players can receive recommendations. |
| Three equipment slots, zero-to-three initial selection | DONE AND VERIFIED | Browser E2E exercises slot typing, skip, select and World creation. |
| My Collection separate from Equipped Toolkit | DONE AND VERIFIED | Browser E2E verifies save/idempotency and display separation. New post-World equip API/RPC is idempotent, owner-scoped and active/reviewed-only; DB rollback test and browser E2E verify persistence. |
| Recipe Combo | DONE AND VERIFIED | Recipe/base Catalog ID is connected to reviewed Method and ingredient Catalog IDs; active version, preparation steps and safety text are checked/rendered in fixture-backed API/browser E2E. Reviewer Method/Recipe Combo draft authoring, confirmation and publication are verified in Admin E2E. |
| Journey Combo | DONE AND VERIFIED | Reviewed cross-slot components, explicit include/skip, same-slot reviewed replacement and per-component Collection save pass API/browser E2E; no auto-equip. |
| One persistent World, branches, illustrated map and region interaction | DONE AND VERIFIED | World creation/reload, map region selection, desktop zoom and mobile layout verified in browser E2E. |
| Daily Check-in, edits, multiple usage records, fixed idempotent XP | DONE AND VERIFIED | Browser E2E and isolated PostgreSQL test cover save/edit, repeat usage, fixed XP and reload. |
| Private Journal timeline and edit | DONE AND VERIFIED | Private timeline UI and owner/world-scoped API support create/edit; browser E2E verifies create/reload and API E2E verifies edit and cross-user isolation. Check-in notes remain separate. |
| Toolkit pause/resume/replace/schedule history | DONE AND VERIFIED | Browser E2E validates history retained across lifecycle actions. |
| Daily Health Clue and curated knowledge library | BLOCKED | Versioned, review-gated topic matching, safe empty state, Book history and source links pass using synthetic non-medical fixtures. Isolated DB audit found zero published/reviewed Clues; a qualified human must review real learning content before release. |
| Knowledge Book, chapters and question history | DONE AND VERIFIED | Owner-private Book, discovery history, optional question attempts, server-only answer keys and fixed idempotent XP pass DB/API/browser reload checks. |
| Knowledge Bosses and reviewed challenge engine | BLOCKED | Versioned reviewer-gated challenge engine, private answer keys, wrong-answer retry, animation and server-authoritative rewards pass fixture-backed DB/API/browser tests. Isolated DB audit found zero published/reviewed Boss challenges; real challenge content awaits qualified human review. |
| XP ledger, fragments/keys, milestone badges, Boss cosmetics and World unlocks | DONE AND VERIFIED | Isolated DB and game E2E verify fixed/idempotent XP, one Knowledge Fragment on a first Clue discovery, one Knowledge Key on a first Boss clear, milestone rewards, fixed cosmetics, owner isolation, reload persistence and reviewer configuration. Milestones are the current achievement set. |
| Persisted World Evolution/unlocks | DONE AND VERIFIED | Boss clear writes an owner-scoped World unlock; SVG route overlay renders from saved unlock data and remains after page reload. DB/API/browser E2E verify persistence. |
| Community public journeys and explicit projections | DONE AND VERIFIED | API/browser E2E covers explicit topic/item/method projections, structured timeline, no raw private Journal, Catalog ID and Usage Method ID search, privacy isolation and revocation. |
| Follow, Start My Own Journey, revoke and report | DONE AND VERIFIED | Two-member browser/API E2E covers follow, independent private journey creation, report, owner revoke and post-revoke access denial. |
| Opt-in timezone email reminders, queue and dedupe | DONE AND VERIFIED | Mock E2E verifies explicit consent, Asia/Bangkok daily and America/New_York weekly schedules, Sunday skip/local Monday delivery, transient retry and three-attempt exhaustion, dedupe, malformed schedule rejection, UI controls, and failed-job unsubscribe cancellation. Other DST/timezone combinations remain outside current coverage. |
| Admin review, configuration and operational diagnostics | IMPLEMENTED BUT NOT FULLY TESTED | Content review, Community moderation, Method/Combo drafts, reward configuration, aggregate diagnostics, and reviewer-only Quiz wording/options/note editing with draft/publish versions are implemented and covered by representative role/browser/API tests. Full operational permission coverage remains partial. |
| Authentication, RLS, privacy and user isolation | IMPLEMENTED BUT NOT FULLY TESTED | Isolated DB asserts RLS on every `healthclues_*` table, grant/policy consistency, protected RPC privileges and populated two-user owner isolation across 28 data families; direct spoof writes and key cross-owner API actions are denied. Deletion request immediately locks private API/RLS access, revokes share/reminder consent, supports recovery and a protected due purge. The complete operation/consent matrix and retention policy approval remain open. |
| HealthClues data deletion, recovery and retention | DONE AND VERIFIED in local/test | Account page, authenticated request/status/cancel API and service-token-only purge worker pass DB/API/browser tests. Primary HealthClues data is removed, Botly auth and other users' Worlds remain; account privacy screenshots pass desktop and 390px mobile checks. Proposed 30/60-day dates require privacy approval before production. |
| Game effects / open-source engine evaluation | DONE AND VERIFIED | Existing SVG/map renderer is preserved; installed Motion supports reduced-motion-aware cards, Knowledge and Boss idle/hit/victory/reward. Boss effects and saved World unlock overlay were visually reviewed. No new game engine was justified. |
| Desktop/mobile visual QA | DONE AND VERIFIED | Latest E2E regenerated and visual review inspected desktop, mobile, selected region, Boss victory and Combo screens; 1440px/390px remain responsive. |
| Game library and effects evaluation | DONE AND VERIFIED | Existing SVG world renderer preserved; framer-motion 12.43.0 MIT already installed with reduced-motion support. PixiJS, @pixi/react, pixi-viewport, Phaser, Howler and Lottie are absent and not justified for this layered vector map; no parallel engine added. |

## Build isolation finding and change

On Windows, `D:\botly\App` (product documentation) collides case-insensitively with Next.js's expected `app` directory. Next therefore walked the preserved `D:\botly\App\.tmp\healthclues-build-baseline\.next\server\app\...` during root build page collection. The baseline was inspected and preserved; it was not the broken artifact. The safe build wrapper copies only application inputs into an owned `D:\botly\.tmp\healthclues-build-*` directory, points Turbopack dependency resolution back to the project root, and cleans only that generated directory after success. Reverification confirms both `D:\botly\App\.tmp\healthclues-build-baseline` and root `D:\botly\.next` still exist after the latest successful build. The standard `npm run build` now routes through this wrapper.

## Current changes in this continuation

- `package.json`: standard build uses guarded isolated build wrapper.
- `supabase/migrations/20261028100000_healthclues_toolkit_equip.sql`: service-role-only transactional equip RPC, owner/review checks and request idempotency table.
- `src/app/api/healthclues/world/toolkit/route.ts`: authenticated POST for equipping a saved reviewed item.
- `src/features/healthclues/ToolkitCollection.tsx`: Collection cards, explicit equip action, reduced-motion-aware transition.
- `src/features/healthclues/WellnessWorldGame.tsx`: renders Collection actions in a persistent World.
- `scripts/test-healthclues-world-db.mjs`: isolated rollback test for Collection equip/idempotent retry.
- `scripts/run-healthclues-game-e2e.mjs`: applies additive test migration and verifies Collection equip persistence/rendering.

## Latest verification

- `node scripts/test-healthclues-world-db.mjs` — PASS; test container is isolated (`botly-healthclues-db-e2e`, no published database port), feature fixtures roll back.
- `npm.cmd run build:healthclues:isolated` — PASS before Collection UI changes; `App/.tmp/healthclues-build-baseline` and root `.next` preserved.
- `npm.cmd run build` — PASS after Collection UI/API/RPC; it uses the guarded isolated wrapper and preserved `App/.tmp/healthclues-build-baseline`/root `.next`.
- `node scripts/test-healthclues-world-db.mjs` — PASS after adding collection equip/retry assertions; fixture transaction rolled back.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after adding collection equip/retry API assertions, PostgREST schema reload setup, and Collection rendering assertion. Screenshots regenerated.
- First HTTP attempt returned `PGRST202`; the local PostgREST fixture has `PGRST_DB_CHANNEL_ENABLED=false`. E2E now restarts that verified isolated container after applying the migration; retry passed.
- A browser assertion initially expected title-case innerText for an uppercase CSS label; adjusted the expectation to the rendered text. No application logic change was needed for that assertion.
- Current work does not deploy, mutate production, send email or change production credentials.

## Continued verification — 2026-10-28

### Quiz bank and branch recovery

- Found and fixed a live-path defect: Quiz Admin returned a 61-question reviewer subset while the adaptive engine can route to eight branches. Publishing that subset left Calm, Energy, Nutrition, Movement, and Natural Wellness questions absent; the rendered question region became empty. Admin now starts from all 96 canonical questions and overlays retained reviewer notes from the legacy review bank. Public delivery still strips reviewer notes.
- Quiz API regression asserts all eight branch entry IDs exist both in the bundled bank and after reviewer publication. The dashboard browser suite exercised all eight first branch questions against a published reviewer-managed bank; the browser suite printed PASS.
- `node scripts/test-healthclues-world-db.mjs` — PASS after the Quiz bank migration and reviewer/version/idempotency assertions.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after repairing the reviewer-note projection. Covered full game loop, eight quests, equipment, Combo, Community, mock reminders, check-in, Knowledge, Journal, Boss rewards/unlocks, responsive map, and admin review. Screenshots were regenerated; `healthclues-world-desktop.png` was visually inspected.
- `npm.cmd run build` — PASS; Next.js 16.3 compilation, TypeScript, and 79 page generation passed through the isolated build wrapper. Both the preserved `App/.tmp/healthclues-build-baseline` and root `.next` survived.
- Targeted ESLint and `git diff --check` — PASS (only existing Git line-ending advisories).
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS on a foreground rerun with exit code 0: isolated build, review/API and dashboard browser suites passed; cleanup restored 17 pending static candidates and restored the exact prior Quiz bank/audit snapshot.
- No production database, public deployment, production credentials, or real email were touched. Human-reviewed real Catalog/Clue/Boss content remains unavailable; no automation approved medical content.

- Fixed a real isolated E2E cleanup failure: reviewer mutation changes `reviewed_by`, so stale fixture cleanup now removes Catalog versions by reserved `hc-test-*` IDs rather than relying on the mutable reviewer marker. Foreign-key-safe order is retained; no non-test IDs are selected.
- Added `20261028140000_healthclues_reminder_retry.sql`: service-role-only bounded retry, cancels failed jobs when consent is withdrawn/paused, and a worker-only transient failure simulation RPC. The HTTP worker permits simulation only when the explicit local/test environment switch is enabled and provider is `mock`.
- Reminder E2E now verifies first attempt fails, no retry before five minutes, retry succeeds at schedule, attempt count is two, and duplicate local-date send is prevented.
- Admin Catalog now has explicit reviewer-confirmed recommendation eligibility. Route enforces current version, active/reviewed state and source presence; UI exposes a separate action. Isolated browser E2E verifies DB state.
- Community E2E now also exercises dismiss and removal, checks removed projections are inaccessible, then verifies owner revocation and independent journey behavior.
- Latest `node scripts/run-healthclues-game-e2e.mjs` — PASS with all new flows; test fixtures cleaned.
- Latest `node scripts/test-healthclues-world-db.mjs` — PASS after applying reminder retry migration in the isolated, unpublished-port DB container.
- Latest `npm.cmd run build` — PASS; Next.js 16.3 production build generated 77 pages and preserved both build baseline and root `.next`.
- Targeted ESLint — PASS with 0 warnings after simplifying the browser promise callback and removing an unused DB-test import.
- V1 remains incomplete: all Quest-specific adaptive branches, full auth/RLS surface, reminder exhaustion/timezone permutations, admin reject/deactivate/resolve and real human-reviewed content are not verified.

## Existing Botly regression harness and root build incident

- The legacy `scripts/run-healthclues-review-http-e2e.mjs` directly ran `next build` at repository root, reproducing the Windows `/.tmp/healthclues-build-baseline/.next/server/app/...` PageNotFoundError. Its `finally` also deleted root `.next`, even after build failure.
- Repaired the harness to copy only app inputs into an owned `.tmp/healthclues-review-build-*`, build/start from that isolated root, and clean only its own successful build directory. It no longer removes root `.next`.
- Restored root `.next` from the latest passing isolated browser build artifact; the preserved baseline at `App/.tmp/healthclues-build-baseline` remains present. The canonical `npm.cmd run build` passes.
- Updated old signed-in dashboard browser assertions to the current Quest-first quiz intro and quest card; full `node scripts/run-healthclues-review-http-e2e.mjs` regression passed (review HTTP, ebook funnel, signed-in dashboard/profile and responsive browser checks).
- The signed-in browser E2E now opens and verifies branch-specific first questions for all four configured question groups: Sleep, Gout, Healthy Weight and General/Fallback. All eight Quest cards are separately exercised in the game E2E; Quest-specific content beyond those four curated topic groups remains unverified.
- One run hit a transient port preflight conflict while a prior failed harness process still owned the proxy listener; after that process exited, the retry completed successfully. No production endpoints were involved.

## Next exact actions

1. Expand browser traversal of optional questions across distinct Quest branches and remaining age/consent/account-state combinations; current branch resolver-to-bank mapping test passes for all eight quests.
2. Continue enumerating every authenticated endpoint and RLS mutation/consent edge, including deletion-pending access across all direct tables; preserve isolated rollback-only fixtures.
3. Complete local/test release review for retention scheduling, backup handling, deletion operations and reviewer/moderator permission boundaries. Proposed deletion timing is not production-approved.
4. Prepare a sourced reviewer packet from `src/data/healthclues-content-review-candidates-v1.json` and obtain qualified human approval for real Catalog, Knowledge Clue and Boss content before a content-complete pilot. Automation must not publish or approve it.

## Continuation update — 2026-10-28

Current stage: Boss/World Evolution and Journey Combo flows implemented and verified in local/test. Recipe Combo fixture coverage remains next, then Community/reminders/admin. V1 remains incomplete.

Additional implemented files:
- `supabase/migrations/20261028110000_healthclues_knowledge_journey.sql`: versioned review-gated clues, private discoveries/attempts, isolated answer keys, idempotent learning XP RPCs.
- `src/app/api/healthclues/knowledge/route.ts` and `src/features/healthclues/KnowledgeJourneyPanel.tsx`: daily topic-matched clue, source links, optional knowledge challenge, private Book and persisted history.
- `src/app/api/healthclues/journal/route.ts` and `src/features/healthclues/PrivateJournalPanel.tsx`: private owner-scoped journal timeline and create/edit flow, distinct from check-in notes.
- `supabase/migrations/20261028120000_healthclues_boss_world_evolution.sql`, `/api/healthclues/boss`, and `BossBattlePanel.tsx`: reviewer-gated challenge attempts, private answer key, server-checked response, fixed XP and persistent World path unlock; map overlay reads saved unlock state.
- `/api/healthclues/combos` and `ComboJourneyPanel.tsx`: reviewed Journey/Recipe definitions, eligible component/safety details, explicit accept/skip/replacement and per-component Collection saves.

Fresh verification:
- `node scripts/test-healthclues-world-db.mjs` — PASS: Knowledge branch-topic checks, approved clue gate, discovery idempotency, wrong/correct answers, answer-key isolation, XP and owner RLS.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS: Knowledge discovery/feedback/Book persistence; Journal API create/edit/isolation and browser create/reload; existing quiz, Collection/equipment, check-in, map, responsive and reload scenarios. Fixtures are synthetic and isolated.
- E2E screenshots regenerated in `App/reports/`.
- Knowledge content distribution is implemented but production content remains empty pending human review; tests use non-medical fixtures only.

Exact next work: Recipe/Journey Combo preview, component acceptance/replacement/equip and tests; then Community projection/follow/start-own/revoke/report/moderation; then opt-in reminder scheduling with mock provider; then admin review/moderation and comprehensive security regression. Do not claim V1 complete.

## Unified continuation update — 2026-10-28 (latest)

The older continuation notes above are historical. Current verified state is reflected in the matrix and latest test report. Community, reminder UI/mock worker, admin review queues and admin community moderation have now been added. No map redesign was performed.

Files added/changed in this continuation:
- `supabase/migrations/20261028130000_healthclues_reminder_queue.sql`: timezone-aware idempotent queue and service-role-only mock dispatch RPCs.
- `/api/healthclues/reminders`, `/api/internal/healthclues-reminders`, `ReminderPreferencesPanel.tsx`: explicit opt-in/consent, schedule, pause/resume/unsubscribe, private delivery history, mock-only job endpoint.
- `/api/admin/healthclues-content`, `/admin/healthclues-content`: reviewer-gated Catalog/Clue/Boss queue and audit decisions; content is never generated/approved by the client.
- `/api/admin/healthclues-community`, `/admin/healthclues-community`: private report queue, admin-only moderation decisions, revoke/remove projection and audit.
- `CommunityJourneysPanel.tsx`: explicit default-off consent for publishing a Quest topic.
- `scripts/run-healthclues-game-e2e.mjs`: reminder API/UI, consent and scheduler dedupe, admin auth/queue/moderation and visual screenshot coverage.
- `scripts/test-healthclues-world-db.mjs`: applies reminder migration and asserts worker RPCs are service-role-only.

Latest evidence:
- `npm.cmd run build` — PASS, Next.js 16.3 isolated build; 77 routes/pages generated; baseline preserved. First build caught an admin UI type error; fixed, rebuilt and passed.
- `node scripts/test-healthclues-world-db.mjs` — PASS; World/equipment/check-in/Knowledge/Boss idempotency and owner isolation, XP write denial/private answer-key denial, reminder RPC grants.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, including actual headless browser interactions and synthetic-fixture cleanup. Screenshots include map desktop/mobile/region, boss victory, reminders UI, admin moderation and content review.
- Targeted ESLint — PASS after fixing hook/lint issues in touched files.
- `npm.cmd run secrets:scan` — PASS, 2,273 files scanned.
- `framer-motion@12.43.0` is already installed under MIT license and powers reduced-motion-aware game feedback. PixiJS/@pixi/react/pixi-viewport, Phaser, Howler and Lottie are absent; the current interactive layered SVG renderer meets the map needs, so no second engine was introduced.

Historical remaining-work list; see the current authoritative continuation status below for the latest verification and remaining gaps.

## Current authoritative continuation status — 2026-10-28

This final status supersedes older dated continuation notes above. Core play and the illustrated map remain preserved. Recent work closed admin state-transition test gaps, added bounded mock reminder retry and cancellation on unsubscribe/pause, fixed the legacy review harness build isolation, and exercised all four currently configured adaptive topic branches in a signed-in browser flow.

- Latest game browser E2E — PASS, including cancellation of a failed next-day reminder on unsubscribe; Catalog eligibility/publish/deactivate; Clue reject; Boss deactivate with original reviewer timestamp retained; Community resolve/dismiss/remove; Quiz, Collection/Toolkit, World, check-in, Journal, Knowledge, Boss and rewards.
- Anonymous access-denial regression now checks private GET/POST/PATCH routes across World, Check-in, Toolkit, Collection, Knowledge, Journal, Boss, Community, Reminder and Combo APIs.
- Community E2E now also associates a reviewed recipe Method with its equipped base item in the isolated fixture, publishes that explicit Method ID and verifies both owner and follower can find the public journey by Method ID.
- Reminder UI now normalizes database time values from `HH:mm:ss` to `HH:mm` in state; the browser E2E confirmed preference save succeeds. Retry exhaustion after three mock attempts, stale Catalog version conflict, and rejection of malformed timezone/time/frequency inputs pass in isolated E2E.
- Weekly reminder E2E now exercises America/New_York local Sunday rejection, next local Monday queue/send, local-date history, and duplicate Monday run suppression; user consent is required and delivery stays mock-only. Invalid timezone, impossible local time and unsupported frequency are rejected with HTTP 400.
- Latest isolated World/Postgres DB regression — PASS, including service-role-only grants for queue, dispatch, retry and mock-failure RPCs.
- Latest canonical `npm.cmd run build` — PASS (Next.js 16.3, 77 routes/pages); existing `App/.tmp/healthclues-build-baseline` and regenerated root `.next` exist.
- Latest Botly review/dashboard HTTP+browser regression — PASS after the build harness and stale quiz assertions were repaired; profile/activity REST test and secrets scan PASS.
- Current statuses remain mixed: gameplay systems are implemented and tested with synthetic fixtures; approved real Catalog/Clue/Boss content, full Quest-specific branches and full security/RLS matrix are incomplete. V1 is NOT COMPLETE and NOT READY FOR PRODUCTION.

Next exact actions: expand authenticated API/RLS mutation coverage and age/consent quiz permutations; add admin authoring/review operations for Methods/Combos and reward configuration/operational diagnostics; obtain human-reviewed health content before recommendations/clues/Bosses can be populated. Only Asia/Bangkok daily and America/New_York weekly schedules have been exercised so far. No production mutation/deploy/email was performed.

Latest regression follow-up: `node scripts/test-healthclues-world-db.mjs` PASS; `node scripts/run-healthclues-review-http-e2e.mjs` PASS (isolated build, review API, ebook funnel, authenticated dashboard/profile and responsive browser); `node scripts/test-healthclues-discovery-matching.mjs` PASS (34 assertions); and `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` PASS on retry (owner-only profile, consented save/delete, check-in history, anonymous denial, cross-user isolation, and no authenticated UPDATE). One initial launch hit transient Docker API access denial; rerun succeeded without a permission workaround. Latest canonical `npm.cmd run build` PASS (77 routes) and both the original baseline and root `.next` artifacts are preserved.

## Adaptive quiz completion update — 2026-10-28

- Added separate non-diagnostic, preference-based question groups for Calm, Energy, Nutrition, Movement, and Natural Wellness. Sleep and Healthy Weight retain their existing reviewed question groups; Health Concern continues to use the concern topic the user selects.
- Selecting a different Quest clears prior branch-specific session answers. Optional Quest preferences flow into the existing consented profile and reviewed-discovery matcher; no full answer set is newly persisted.
- Signed-in browser E2E checks the first adaptive question for all eight Quests. Full game E2E passes after the Quiz changes; discovery matching now passes 37 assertions, including preference matching for recipe/activity/research categories.
- `npm.cmd run build` — PASS, Next.js 16.3, TypeScript and 77 routes. Targeted ESLint, quiz-bank JSON parse and `git diff --check` pass. Existing build baseline and root `.next` preserved.
- Remaining Quiz gaps are wider age/consent/safety combinations and guest/account persistence permutations; V1 remains incomplete.

## Admin role separation and diagnostics update — 2026-10-28

- HealthClues reviewer and Community moderator APIs now use distinct timing-safe, server-only credentials: `HEALTHCLUES_REVIEWER_TOKEN` and `HEALTHCLUES_MODERATOR_TOKEN`. The legacy `EBOOK_ADMIN_TOKEN` does not authorize either HealthClues role. `.env.example` documents the two new variables without values.
- Added Vietnamese read-only Admin diagnostics at `/admin/healthclues-diagnostics` and `/api/admin/healthclues-diagnostics`. It shows exact aggregate counts for pending Catalog/Clues/Bosses, open Community reports and queued/failed reminders; no user IDs, notes, answers or profile fields are returned. Both reviewer and moderator roles may view these operational counts.
- Full isolated game E2E passes with separate reviewer/moderator tokens, cross-role/legacy-token denial, aggregate diagnostics API and five visible UI counters. Screenshot: `healthclues-admin-diagnostics-desktop.png`.
- Canonical build passes (78 routes), including TypeScript. Targeted ESLint and diff check pass; baseline and root `.next` remain present.
- Follow-up isolated PostgreSQL RLS/reward/idempotency suite PASS; workspace secret scan PASS (2,276 files). Diagnostics screenshot was opened and checked for readability and for unintended user-level data.
- Still incomplete: reward configuration, admin quiz and Methods/Combos authoring, broader operational checks and exhaustive role/RLS matrix. No production credentials were read or changed.

## Cross-owner RLS fixture expansion — 2026-10-28

- `scripts/test-healthclues-world-db.mjs` now creates populated private records for both isolated users before applying `SET LOCAL ROLE authenticated` as user A; cross-user `COUNT(*)=0` assertions therefore prove row filtering instead of relying on empty tables.
- Verified isolation covers World, branches, journeys, Collection, Toolkit, check-in, usage, Journal, personal tools, Catalog proposals, XP, Knowledge discoveries/attempts, Boss attempts/clears and World unlocks. Owner-visible World/Journal/Knowledge/proposal rows are asserted.
- Added grant assertions: client writes to XP, rewards, check-in, usage, Community report moderation and reminder delivery are denied; private answer-key SELECT is denied. Catalog proposal INSERT remains permitted and owner-scoped, matching its member-submission design.
- Latest isolated `node scripts/test-healthclues-world-db.mjs` — PASS; fixtures roll back. This is broader concrete coverage, but the total RLS matrix is still incomplete.
- The local browser/API E2E now also verifies member B receives an empty Collection, Knowledge Book and Boss state, cannot read A's check-in/World/Toolkit/Journal, and cannot see member A's reminder deliveries (including while B has separate failed deliveries). `node scripts/run-healthclues-game-e2e.mjs` — PASS after those checks.
- One E2E start hit the same transient Docker API access denial; a later retry started and completed successfully. No permission bypass was used.

## Verification continuation � 2026-10-28 (resume run)

- Re-ran `node scripts/run-healthclues-game-e2e.mjs` � PASS. This run verifies the reviewer attribution on the published synthetic Clue (`reviewed_by`) and moderator attribution on the resolved synthetic report (`resolver_id`), in addition to the complete tested local game path. No active process remained after the test completed.
- Re-ran `node scripts/test-healthclues-world-db.mjs` � PASS; actual populated two-member ownership checks, protected mutation grants, idempotency and rollback fixtures passed.
- Re-ran `npm.cmd run build` � PASS; isolated Next.js 16.3 build, TypeScript, 78 routes. Existing `App/.tmp/healthclues-build-baseline` and root `.next` were preserved. Only warning was the existing Next middleware-to-proxy deprecation.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` � PASS; profile consent/save/delete, check-in history, anonymous denial, cross-user isolation and authenticated UPDATE denial.
- `node scripts/run-healthclues-review-http-e2e.mjs` � PASS; isolated review/dashboard, ebook funnel/download, profile/history/deletion and responsive regression; test cleanup restored 17 static candidates.
- `node scripts/test-healthclues-discovery-matching.mjs` � PASS (37 assertions).
- `npm.cmd run secrets:scan` � PASS (2,276 workspace source files); targeted ESLint and `git diff --check` � PASS.
- No production DB, deployment, credentials or real email touched. V1 remains NOT COMPLETE: real health content requires human review; reward-config/admin authoring and broader authorization matrix remain incomplete.

## Next exact continuation actions

1. Add/verify a bounded, reviewer-authorized reward configuration path that cannot alter server XP award formulas or grant user rewards directly; test role denial, validation, audit and persistence against the isolated DB.
2. Audit whether the read-only Quiz preview still accepts a legacy credential and either separate its authorization from ebook admin or document/test the safe boundary.
3. Add management/review coverage for Usage Methods and Recipe/Journey Combo definitions if schemas and existing review lifecycle permit safe, versioned drafts; never publish test or medical content without reviewer confirmation.
4. Extend authenticated mutation/RLS tests table-by-table and rerun game/API/build regressions after each code change.
5. Keep real reviewer-approved Catalog/Clue/Boss corpus as an explicit external content gate; do not seed or label synthetic fixtures as real.

## Reviewer credential boundary repair � 2026-10-28

- Closed an identified HealthClues admin isolation gap: `/api/admin/healthclues-quiz` and its internal-note preview previously accepted the shared legacy `EBOOK_ADMIN_TOKEN`. It now requires the separate `HEALTHCLUES_REVIEWER_TOKEN`; the UI names this credential and does not store it.
- Game E2E checks legacy-token denial, reviewer success, and that the authorized preview includes the expected internal note (`C01`). Targeted ESLint and full game E2E passed; canonical isolated build passed afterward with 78 routes. Baseline/root build artifacts remain present.
- This is a read-only reviewer preview, not quiz-bank authoring. Reward configuration and CRUD/review authoring for Quiz/Usage Methods/Combos remain open; no broad reward mutation API was added because existing award functions hard-code server-side eligibility/XP and a superficial admin toggle would create inconsistent rewards.
- Follow-up `node scripts/run-healthclues-review-http-e2e.mjs` after this credential split � PASS; it now expects 503 when the isolated review/dashboard harness has no HealthClues reviewer credential configured. It completed ebook funnel, browser/dashboard/review checks and cleanup. The app emitted one non-fatal `destination stream closed early` diagnostic during browser teardown; process exit code was 0 and all subsequent suites/cleanup passed.

## Versioned admin Method/Combo authoring � 2026-10-28

- Added isolated-test migration `20261028150000_healthclues_admin_drafts.sql`: an atomic, service-role-only RPC creates Method, Recipe Combo, and Journey Combo v1 drafts. It validates active/reviewed Catalog references, component slot/type/version, instruction lengths, combo size, and audit reason. New rows always begin `review_status=draft, active=false`; the RPC cannot approve or award XP.
- Added reviewer-only `GET/POST /api/admin/healthclues-authoring` and Vietnamese `/admin/healthclues-authoring` forms. The authoring screen exposes only currently active/reviewed Catalog choices and lists existing drafts. Moderator/legacy role access is denied.
- Extended the content review queue to include Method/Recipe/Journey drafts and confirmed-but-inactive reviews. Publishing requires explicit reviewer confirmation; Method publication requires safety notes and current active/reviewed components; Recipe Combo publication requires a reviewed Usage Method; linked Combo components must still be eligible. Review actions retain audit identity/reason.
- Browser E2E creates all three drafts, rejects wrong-slot Catalog references and missing reviewer confirmation, confirms queue visibility and database/audit state, publishes a Method then its linked Recipe/Journey Combos, and confirms only published Combos reach the player API. A first full regression exposed fixture interference when the Method referenced a Catalog candidate that a later moderation step intentionally deactivated; the test now uses a stable reviewed component. The full game E2E then passed and cleaned all synthetic records.
- Screenshot `healthclues-admin-authoring-desktop.png` was captured and visually inspected. `node scripts/test-healthclues-world-db.mjs` � PASS (migration compiles and function is callable by service role only); targeted ESLint/diff check � PASS; canonical `npm.cmd run build` � PASS (79 routes; baseline and root `.next` preserved).
- Still incomplete: editing/revising existing Method/Combo versions, reward configuration, exhaustive auth/RLS matrix and human-reviewed real health content. V1 remains NOT COMPLETE.

## Authoritative resume audit — 2026-10-28
The entries above are historical where they conflict with this audit. Baseline build inputs were inspected; the old failure came from Windows case-insensitive discovery of `App` as Next `app`, which caused root builds to traverse `.tmp/healthclues-build-baseline/.next/server/app`. `scripts/build-healthclues-isolated.mjs` builds from a run-owned `.tmp/healthclues-build-*` project containing only app inputs. The current canonical build generated an isolated `.next/BUILD_ID`; root `.next/BUILD_ID` and the original baseline `.next/BUILD_ID` remain present. No baseline was deleted or overwritten.

| Master Prompt 03 feature | Current status | Evidence / gap |
|---|---|---|
| Eight Quest selection; adaptive Quiz core | IMPLEMENTED BUT NOT FULLY TESTED | Browser suite selects all eight, checks adaptive entry, adult 10-question path, resume and underage stop. Broader age/consent/guest-account and branch completion matrix remains. |
| Personalized Catalog recommendations and empty state | BLOCKED | Match/review/safety gates and empty state are implemented and synthetic-fixture tested. Real recommendation content cannot be released without a human-reviewed approved catalog corpus; no unreviewed medical content will be promoted. |
| Equipment slots, Collection, Toolkit, lifecycle | DONE AND VERIFIED | Core and post-World equip; skip, save, replace/pause/resume/schedule history, reload and owner isolation are covered by browser/API/DB suites. |
| Recipe Combo and Journey Combo | DONE AND VERIFIED | Method-linked reviewed fixture recipe; partial acceptance/replacement and component saves; admin draft/review authoring and published-only player access tested. |
| Persistent World and RPG map | DONE AND VERIFIED | Existing illustrated renderer retained; map interactions, desktop/mobile, reload, saved unlock visual, selected region and checkpoint tested. |
| Daily Check-in and private Journal | DONE AND VERIFIED | Multi-activity/occurrence, edit, XP dedupe, private notes/timeline, persistence and cross-user denial covered. |
| Daily Clues, Knowledge Book and challenges | BLOCKED for real content; feature path DONE AND VERIFIED with synthetic fixtures | Review/version/source gates, safe empty state, discovery, question history, private answer keys and XP idempotency covered. Real health content remains human-review gated. |
| Knowledge Boss, battle effects and rewards | DONE AND VERIFIED with synthetic challenge fixtures | Wrong-answer retry/explanation, hit/victory/reward, server result, idempotent reward, persisted unlock and reload covered. Real challenge content remains human-review gated. |
| XP / configured rewards / World evolution | DONE AND VERIFIED for implemented reward types | DB and browser test fixed XP/ledger dedupe, Boss/Knowledge awards, five milestone configuration, audits/version conflict and saved decoration unlock. Badges/cosmetic reward breadth is not implemented. |
| Community, Follow, Start My Own, revoke/report/moderation | DONE AND VERIFIED | Two-member API/browser fixtures test explicit projection, item/method search, timeline, follow, independent journey, revoke, report, moderation and access removal. |
| Email reminders | DONE AND VERIFIED in mock environment | Consent, timezone/local schedule, daily/weekly boundary, dedupe, retry/exhaustion, unsubscribe cancellation, UI/history; no real email provider. Other timezone/DST combinations remain untested. |
| Admin review, Method/Combo authoring, reward config, diagnostics | IMPLEMENTED BUT NOT FULLY TESTED | Reviewer/moderator separation, Vietnamese queues/authoring/config/diagnostics, draft/publish, audit and representative validation are tested. Quiz question authoring, existing version revision, and exhaustive review operations are absent. |
| Auth, RLS, privacy, idempotency | IMPLEMENTED BUT NOT FULLY TESTED | Populated cross-user DB/API isolation, anonymous denials, protected writes, answer key grants and admin role separation pass. Not every table/policy/mutation is exhaustively enumerated. |
| Open-source engine/effects | DONE AND VERIFIED | Motion is already installed (MIT) and used with reduced-motion; isolated Pixi/Phaser prototype was not warranted by the layered interactive SVG map. No parallel engine. |
| Desktop/mobile visual QA | DONE AND VERIFIED | Current map, region, mobile, boss victory, rewards and admin screenshots are in `App/reports/`; this continuation preserves map renderer. |
| Human-reviewed health content | BLOCKED | Requires qualified human review/approval. Synthetic test fixtures are explicitly not approved corpus and are never represented as reviewed real content. |

### Resume next actions
1. Finish current `node scripts/run-healthclues-game-e2e.mjs`, inspect exit and new failures/screenshots.
2. Run the canonical `npm.cmd run build` with an observable exit code and verify both preserved BUILD_ID files.
3. Run targeted lint, review/dashboard HTTP regression, profile/activity REST, discovery matcher and secret scan after the final code changes.
4. Expand a concrete remaining authenticated RLS denial/mutation table where a safe isolated fixture exists; do not spend test cycles on production.
5. Keep V1 NOT COMPLETE / NOT READY while approved real content is absent and uncovered security/quiz/reward breadth remains. No production DB, deploy, credentials or actual email touched.
## Final verification snapshot for this resume — 2026-10-28
- Latest isolated game browser E2E: PASS after reduced-motion Quest card selection animation, map pan state lint fix, Method/Combo authoring and reward config. Full synthetic local/test loop includes Quest selection, 10-question onboarding/resume, Catalog recommendation fixture, Recipes/Journey Combo, Collection/equip, Community follow/start-own/report/revoke/moderation, mock reminder consent/scheduling/retry/dedupe/unsubscribe, World/check-in/Journal, Knowledge discovery/Book, Boss retry/victory/reward/saved unlock and reload. Synthetic fixtures cleaned. `App/reports/healthclues-quest-picker-desktop.png`, `healthclues-world-desktop.png`, `healthclues-world-mobile.png`, `healthclues-world-sleep-region-desktop.png`, `healthclues-boss-victory-desktop.png`, and admin screenshots were regenerated; desktop/mobile map and Quest picker/Boss victory were visually opened and reviewed.
- Latest canonical `npm.cmd run build`: PASS; Next.js 16.3, TypeScript, 80 routes. Root cause remains Windows case-insensitive `App`/`app` discovery; isolated root wrapper is the supported fix. `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` both verified present. Baseline contents remain unchanged. Existing Next middleware deprecation warning is non-blocking.
- Latest `node scripts/test-healthclues-world-db.mjs`: PASS; isolated PostgreSQL fixture transaction rolled back.
- Latest `node scripts/run-healthclues-review-http-e2e.mjs`: PASS; isolated review/audit, Botly dashboard, ebook funnel and responsive browser regression; test catalog restored to review/draft and no active test item remains.
- Latest `node scripts/test-healthclues-profile-activity-rest-e2e.mjs`: PASS; owner-only profile, consented save/delete, check-in history, anonymous denial, cross-user isolation and no authenticated profile UPDATE.
- Latest `node scripts/test-healthclues-discovery-matching.mjs`: PASS (37 assertions).
- Targeted ESLint on HealthClues source/tests: PASS with zero findings. Final changed-file ESLint and `git diff --check`: PASS. Git reported only existing LF→CRLF working-copy advisories.
- `npm.cmd run secrets:scan`: PASS (2,282 workspace source files).
- No production DB, deployment, credential change or real email was used. Reminder tests use mock provider; content review tests publish only reserved synthetic non-medical fixtures.
- V1 remains NOT COMPLETE: the real Catalog/Clue/Boss corpus is awaiting qualified human review; broad quiz age/consent/guest-account permutations and exhaustive per-table/per-operation RLS coverage remain partial. Cosmetic/badge breadth beyond currently configured milestone rewards is also not fully implemented. Do not mark production-ready.
## Resume continuation — 2026-10-28 (reviewer boundary and verification)

- Re-audited the feature matrix above; previously verified gameplay/map scope was preserved. V1 remains NOT COMPLETE.
- Fixed a real admin authorization gap: `/api/admin/healthclues-discoveries` had still accepted shared `EBOOK_ADMIN_TOKEN`. It now requires `HEALTHCLUES_REVIEWER_TOKEN`; review audit identity is dedicated to that reviewer credential. Added additive migration `20261028170000_healthclues_discovery_reviewer_boundary.sql`, retaining legacy actor values only for historical audit rows.
- Extended isolated review HTTP E2E to prove legacy Botly admin denial, unauthenticated denial, reviewer access, reviewer audit identity, and quiz reviewer behavior. Runner provisions an ephemeral reviewer token and applies the migration only to the already allowlisted `botly_restore_verification` test database. This test has NOT run in this execution because Docker Engine access was denied by the sandbox; the migration has not been applied here.
- Expanded `scripts/test-healthclues-world-db.mjs` to apply the reviewer-boundary migration and assert service-role-only execution and the new function identity. This expanded DB suite has NOT run in this execution for the same Docker permission denial.
- `node scripts/test-healthclues-quiz-safety.mjs` — PASS (35 assertions).
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions).
- `npx.cmd eslint` on the changed discovery route, HTTP runner/suite, DB suite and quiz safety suite — PASS (no findings).
- `git diff --check` — PASS (only existing LF/CRLF working-copy advisories).
- `npm.cmd run build` — PASS; Next.js 16.3 compiled, TypeScript passed, 80 pages generated; wrapper exited 0. Both `D:\botly\App\.tmp\healthclues-build-baseline\.next\BUILD_ID` (unchanged timestamp/content) and `D:\botly\.next\BUILD_ID` remain present. The underlying cause is Windows case-insensitive discovery of documentation folder `App` as Next `app`; the guarded build wrapper builds a controlled copy under root `.tmp` and only removes its own generated directory after success. Baseline data was inspected and preserved.
- Current run could not perform Docker-backed DB, HTTP, or browser suites: `docker inspect botly-healthclues-db-e2e` returned permission denied for `npipe:////./pipe/docker_engine`. No sandbox bypass or production endpoint was used. Prior report entries document their earlier passes, but they do not validate this newly added reviewer-boundary migration/tests.
- Next exact action: rerun `node scripts/test-healthclues-world-db.mjs` and `node scripts/run-healthclues-review-http-e2e.mjs` in an execution environment with the approved local isolated Docker Engine, then rerun game browser E2E. Until those pass, the reviewer-boundary change is implemented but not runtime-verified.
- Re-ran repository secret scan after the reviewer boundary change: PASS (2,284 files).

## Latest authoritative continuation — 2026-10-28

- Fixed the reviewer-boundary migration runner to apply as the isolated table owner (`supabase_admin`), after the first HTTP run proved the restored audit table is not owned by `postgres`. The failed migration was transactional and rolled back; rerun applied successfully.
- `node scripts/test-healthclues-world-db.mjs` — PASS after correcting the assertion to check that the function-definition offset is positive. Dedicated reviewer RPC remains non-executable by `authenticated`, executable by `service_role`, and includes the new reviewer identity. Fixture rows rolled back.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0. It verifies the old Botly credential is denied for HealthClues review, the dedicated reviewer token can import/review/audit, quiz reviewer authorization, dashboard/profile/ebook regression, browser review UI and cleanup restoring 17 pending candidates with no active test item.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0. Full synthetic local/test gameplay, Community, mock reminder, admin review/moderation/reward and desktop/mobile checks passed; fixtures cleaned. Added a post-hydration wait and an in-browser token-value assertion for reviewer login. Screenshots were regenerated under `App/reports/`; `healthclues-admin-content-review-desktop.png` was opened and visually inspected.
- `npm.cmd run build` — PASS after final source/test changes (Next.js 16.3, TypeScript, 80 routes; wrapper exit 0). `npx.cmd eslint` on all touched application/test files — PASS. `git diff --check` — PASS (Git line-ending advisories only). `npm.cmd run secrets:scan` — PASS (2,284 files).
- A first game regression exposed the same reviewer-token hydration race in the content queue; after the test fix, full game E2E passed. The Admin Discovery screen now labels the separate HealthClues reviewer credential accurately. Botly `EBOOK_ADMIN_TOKEN` remains configured only for legacy Botly routes and is explicitly denied by HealthClues review APIs.
- Feature status remains per the matrix above: gameplay, map, Collection/Toolkit, Combos, Check-in/Journal, Knowledge, Boss/reward evolution, Community, reminders and moderation are DONE AND VERIFIED by isolated browser/DB runs; human-approved real Catalog/Clue/Boss corpus remains BLOCKED on qualified human review; full auth/RLS matrix and some quiz safety/account permutations remain INCOMPLETE. Quiz admin remains a read-only reviewer preview, so question authoring/version management is still NOT COMPLETE.
- No production database, deployment, production credentials, or real email was used.

### Next exact work

1. Continue technical gap audit, starting with whether versioned Quiz question management belongs in V1 acceptance and how its active version would be used by the playable Quiz (the existing admin screen is preview-only).
2. Expand the authenticated RLS/endpoint matrix for uncovered policies and mutations in the isolated DB, recording each tested table/operation rather than extrapolating from the existing matrix.
3. Keep real Catalog/Clue/Boss content gated until qualified human review; synthetic fixtures do not satisfy that gate.
4. Rerun build, DB, review HTTP and game browser suites after any further changes.

### Current verification status — supersedes older dated snapshots

- Quiz is DONE AND VERIFIED for all eight branch entry points, full 10-question flow, back/skip/resume, age gate, safety assertions, versioned reviewer draft/publish and public reviewer-note exclusion.
- Admin Quiz is no longer a read-only preview: the current editor manages wording/options/reviewer notes across all 96 questions, supports draft/version audit and explicit publication, and preserves the fixed branch/ID/type schema. Older report passages saying Quiz authoring is absent are historical and superseded.
- `node scripts/run-healthclues-review-http-e2e.mjs` exited 0 on the foreground rerun. Earlier redirected-run exit 1 was transient/unreproduced.
- Remaining V1 blockers: no human-reviewed real health content; broad authenticated RLS/mutation and demographic/consent coverage; limited cosmetic reward variety. Keep V1 NOT COMPLETE.

## Security matrix expansion — current run

- Expanded the isolated database suite to enumerate every `public.healthclues_*` ordinary table and fail if any does not have RLS enabled.
- Added an anonymous table-grant matrix. The test rejects direct reads of user profiles, discovery/review/audit data, World/Toolkit/Journal/check-ins, community projections/follows/reports, XP/rewards/reminders, answer keys, and reviewer Quiz bank tables. It separately confirms the explicit anonymous SELECT allowlist for reviewed Catalog/Methods/Combos/rewards/Clues/Boss challenge surfaces.
- `node scripts/test-healthclues-world-db.mjs` — PASS; all fixtures are transaction-scoped or uniquely named and removed by cleanup.
- `node --check scripts/test-healthclues-world-db.mjs` and targeted ESLint — PASS.
- This strengthens RLS/grant evidence; authenticated mutation and end-to-end role permutations remain INCOMPLETE.

- Extended the same DB transaction with authenticated mutation assertions: an owner can update their own World and Journal rows, while cross-owner World and Journal updates affect zero rows. This proves both positive owner access and negative foreign-owner access. The expanded DB suite and targeted ESLint pass.

## E2E fixture cleanup repair — 2026-10-28

- The live isolated database audit found synthetic `hc-test-*` Catalog/Method/Clue/Boss rows from earlier successful game runs; the prior harness silently swallowed cleanup failure, so its cleanup claim was not sufficiently evidenced.
- Fixed final cleanup FK order by deleting Usage Method item/version rows before deleting their Methods. Cleanup errors now fail the test process and log the failure; after each run it asserts no generated Catalog/Method/Clue/Boss/Combo rows remain.
- A first rerun verified cleanup even though a moderator hydration assertion failed; the moderator login test now waits for hydration and verifies the typed token. The next complete rerun passed and printed `Game E2E cleanup verified` with exit code 0.
- Direct read-only isolated DB query after that run: reserved Catalog/Method/Clue/Boss fixture count plus `hc-game-*` accounts = 0. Currently active reviewed Catalog, Clue and Boss rows in the local test database = 0, confirming the real-content blocker.
- Follow-up DB/RLS test passed after game E2E; the expanded isolated DB test, syntax check, targeted ESLint and diff check also passed.
- Latest desktop and mobile screenshots were regenerated; the desktop map screenshot was reopened and visually reviewed. The accepted RPG renderer and business logic were not changed.

Status correction: earlier historical `Next exact actions` that list Method/Combo authoring or Quiz management as future work are superseded. Those admin workflows are implemented and their browser/DB checks pass. The current blockers are reviewed production-appropriate content, exhaustive auth/RLS and age/consent permutations, and cosmetic reward breadth.

## Source-linked Knowledge/Boss candidate review workflow — 2026-10-28

- Added migration `20261028190000_healthclues_boss_source_references.sql`: Boss challenges retain source references; service-role-only `healthclues_import_review_drafts_v1` validates the bundled drafts, permits official CDC/NIMH/FDA HTTPS hosts, writes answer keys privately, audit-logs imports, is idempotent for pending drafts, and always sets `needs_review` / `published=false` / null reviewer fields.
- Added a reviewer-authenticated import action to `/admin/healthclues-content`. The payload is bundled server-side. The reviewer UI states that drafts remain pending. Boss publication now requires source references and a private answer key.
- Added three paraphrased, source-linked Clue candidates and three Boss question candidates. They are drafts only; no medical content was auto-approved or published.
- `node scripts/test-healthclues-world-db.mjs` — PASS after migration, including service-role-only RPC privilege assertions and existing RLS checks.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS; verifies reviewer import, six pending unpublished rows, idempotent retry, anonymous exclusion, Boss review, full gameplay, and synthetic fixture cleanup.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; review/dashboard/browser regression and snapshots restored. A non-fatal aborted response logged `The destination stream closed early`; suite assertions and cleanup completed.
- Targeted ESLint on changed app route, UI, and test scripts — PASS. Broad `npm.cmd run lint -- --no-cache` scanned generated `.next-healthclues-build-20261027` chunks and unrelated files, reporting generated-code and unrelated lint errors; treat the changed-file ESLint as the valid scoped result.
- Canonical `npm.cmd run build` is running; its final result must be recorded after process exit. The game E2E isolated production build and runtime passed.
- The isolated test DB retains exactly six intentional `hc-v1-*` review candidates. They are pending/unpublished and are not synthetic game fixtures. No active public content is created by this import.
- V1 remains NOT COMPLETE: qualified human review is required before candidates can power public Knowledge/Boss content. Broad authenticated mutation/consent coverage and cosmetic reward variety remain incomplete. No production DB/deploy/real email used.
- Canonical `npm.cmd run build` — PASS, exit 0 after isolated Next.js 16.3 build, TypeScript, and 79 static generation checks. `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` were checked and remain present; no baseline data was deleted or overwritten.
- Direct read-only isolated DB verification after E2E: exactly `3|3|3|3` for pending unpublished Clue rows, pending unpublished Boss rows, private Clue answer keys, and private Boss answer keys. The reviewer UI screenshot `App/reports/healthclues-admin-content-review-desktop.png` was captured during E2E and visually inspected; it displays the pending-source import control and draft queue. World/region screenshots remain at `healthclues-world-desktop.png`, `healthclues-world-mobile.png`, and `healthclues-world-sleep-region-desktop.png`.

## Final verification correction — 2026-10-28

- Follow-up after adding explicit invalid-source rejection and unauthorized import assertions: `node scripts/test-healthclues-world-db.mjs` PASS. The DB test invokes the importer as `service_role`, verifies `https://example.invalid/` is rejected without leaving a row, then rolls back all member fixtures.
- `node scripts/run-healthclues-game-e2e.mjs` PASS again. In addition to the previous flow, a Community moderator token and legacy Botly admin token are both rejected from the reviewer-only draft import endpoint. Cleanup verified zero generated test content remains; six reserved source-linked review drafts remain intentional.
- `npx.cmd eslint` for the changed app/UI/test files PASS; `node --check` for all three changed E2E/DB scripts PASS; `git diff --check` PASS (only LF/CRLF advisories).
- `npm.cmd run build` PASS. No change to the map renderer or established business/API contracts was made.
- Additional regression on the final code: `node scripts/test-healthclues-quiz-safety.mjs` PASS (35 assertions); `node scripts/test-healthclues-discovery-matching.mjs` PASS (37 assertions); `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` PASS (owner-only profile, consented save/delete, check-in history, anonymous denial and cross-user isolation).
- Resume next: a qualified human reviewer must inspect the six `hc-v1-*` source-linked records in `/admin/healthclues-content` before any one is approved/published. Keep the release gate blocked on that review; continue the remaining Auth/RLS coverage and cosmetic-reward breadth after review without replacing the passing map or gameplay.

## Persisted milestone World evolution — 2026-10-28

- Closed a progression gap: the configured Day 60 `map_unlock` now adds a server-owned `knowledge-library-open` row to that user's existing Wellness World, alongside the idempotent milestone reward and XP. New additive migration: `20261028200000_healthclues_milestone_world_evolution.sql`; it only replaces the existing milestone RPC behavior and grants it to `service_role`.
- The existing illustrated SVG renderer now draws the Knowledge Library only when that exact saved unlock key is supplied by World API data. No separate engine or database model was introduced; the map renderer and coordinates remain shared.
- `node scripts/test-healthclues-world-db.mjs` — PASS, exercises the actual 60-day milestone RPC and asserts one saved World unlock and one reward, with fixtures rolled back.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS. Browser regression writes a test milestone unlock to the signed-in member B World, correlates the fresh World API response to the reloaded main-frame loader, verifies the same World ID/key after reload, and confirms landmark rendering. Full gameplay and cleanup pass.
- Desktop and mobile screenshots regenerated and visually inspected: `healthclues-world-desktop.png` and `healthclues-world-mobile.png`. The unlocked library appears in the illustrated map on both viewports.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; isolated reviewer/dashboard/ebook/browser suite and catalog/Quiz snapshot restoration pass with migration applied.
- `npm.cmd run build` — PASS, exit 0; Next.js 16.3, TypeScript and 79 page-generation checks complete. Existing root `.next` and `App/.tmp/healthclues-build-baseline/.next` artifacts remain present.
- Targeted ESLint, Node syntax checks, and `git diff --check` — PASS (Git emitted only its existing LF/CRLF advisories).
- Release remains NOT COMPLETE. Human reviewer approval of actual health content and broader auth/consent coverage/reward variety remain outstanding.

## Reward presentation and persisted milestone verification — 2026-10-28

- Replaced raw reward ID pills on the World screen with reward-definition titles and type-specific icons/tones. Reward awards remain server-controlled; the API resolves display metadata from active reward definitions and safely falls back for legacy IDs.
- Extended the isolated gameplay E2E with a persisted, test-only Day 60 reward fixture. It asserts the World API returns the canonical `New Region` / `map_unlock` metadata and that the label is rendered after the signed-in browser reload. Account cleanup owns the fixture lifecycle.
- `node scripts/test-healthclues-world-db.mjs` — PASS: idempotent World/Collection equip/Knowledge/Boss rewards, persistent World unlock, reviewed content gates, private answer-key isolation, reminder scheduler/dispatch, daily usage, fixed XP, milestones and RLS.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after correcting the reward-row TypeScript type exposed by the first isolated build; complete playable flow, community/reminder/admin, persisted reward display and map landmark reload passed; cleanup verified zero generated content fixtures.
- `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 79 static pages); wrapper confirms the pre-existing baseline and root `.next` artifacts were preserved.
- Targeted ESLint on changed files — PASS with one pre-existing unused `Gem` import warning in `WellnessWorldGame.tsx`; no errors. `node --check scripts/run-healthclues-game-e2e.mjs` — PASS.
- No production database, deployment, credentials or real email were used. V1 remains NOT COMPLETE: qualified human review of health content and broader authorization/consent coverage remain release gates.

- Follow-up regression after reward presentation change: `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; isolated build, review/dashboard HTTP/browser checks, ebook regression and exact content/Quiz snapshot restoration succeeded.
- Final changed-file ESLint — PASS with no findings after removing the stale unused icon import. `git diff --check` — PASS; Git emitted only workspace-wide LF/CRLF advisories.
- Screenshot visual check: `healthclues-world-desktop.png` shows the illustrated map, Knowledge Book, Boss, and the visible `New Region` reward within My Collection. Screenshot was captured by the real browser E2E, not synthesized.

## Explicit profile RLS coverage — 2026-10-28

- Extended the isolated PostgreSQL RLS test with two real synthetic profile rows. Under the authenticated role, it now proves the owner can read and update their profile while the same user cannot read or update the other account's profile. All writes occur in the existing rollback-only fixture transaction.
- `node scripts/test-healthclues-world-db.mjs` — PASS with the added profile assertions; fixtures rolled back.
- `node scripts/test-healthclues-quiz-safety.mjs` — PASS (35 assertions). `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions).
- Targeted ESLint across the RLS runner, safety/matching tests, changed World API and World UI, and game E2E runner — PASS with no warnings or errors. This closes profile row isolation specifically; the broader per-operation authenticated matrix is still incomplete.

## Route-level cross-owner mutation coverage — 2026-10-28

- Extended the isolated two-account browser/API suite after both accounts own separate Worlds: account B attempts to edit account A's private Journal entry (404), and attempts to create a Daily Check-in against account A's World (409). Follow-up reads verify A's edited Journal text and private check-in note are unchanged.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; full gameplay, community, mock reminder, reviewer/admin and responsive browser flows passed, and generated fixtures were cleaned.
- The companion isolated DB suite already passed explicit profile owner-read/update and cross-owner-read/update assertions plus the full-table RLS and grant checks. Broader auth permutations for other row families remain open; this adds concrete API-level Journal and check-in mutation evidence.

- Clean DB/RLS rerun after the game E2E — `node scripts/test-healthclues-world-db.mjs`: PASS, including the newly added explicit profile owner/cross-owner reads and updates. A first immediate retry encountered a transient denied Docker named-pipe request after the browser runner exited; `docker ps` confirmed the isolated test stack was healthy, and the same DB suite then passed without code changes.

## Age/consent matrix expansion and full rerun — 2026-10-28

- Quiz safety now explicitly asserts that under-18, unknown, missing, and malformed age-gate answers cannot create a Discovery Profile. `node scripts/test-healthclues-quiz-safety.mjs` — PASS (38 assertions).
- The real browser game E2E now verifies the under-18 screen does not persist a profile. It also gained a wait and actual reviewer-token value assertion on the Rewards Admin sign-in, fixing an intermittent test-harness race that previously submitted an empty token. `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; it traversed the age gate and full game/admin sequence, including cross-owner Journal/check-in mutation checks, and verified fixture cleanup.
- The signed-in dashboard browser suite now asserts that a completed Quiz leaves the profile absent, Save is disabled before consent, and explicit consent enables Save. `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; profile consent, review/dashboard browser, ebook regression and snapshot restoration passed.
- `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 79 generated pages); the isolated wrapper confirmed the old baseline and root `.next` artifacts remain preserved.
- Final `node scripts/test-healthclues-world-db.mjs` — PASS after the browser runner; all-table RLS, grants, owner isolation, profile owner/cross-owner reads and updates, milestones, XP, Knowledge/Boss, and reminder service-role boundaries passed with rollback fixtures.
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions). Targeted ESLint and Node syntax checks for changed test scripts — PASS. One intermediate DB invocation hit Docker named-pipe access denial immediately after a runner cleanup; Docker recovered, the same suite passed, and no code change was needed.
- No production database, deployment, production credential, or real email was used. Real health content remains pending qualified human review; additional exhaustive auth/consent permutations remain open.

## Server-awarded Boss keepsakes and persisted map cosmetics — 2026-10-28

- Added migration `20261028210000_healthclues_boss_cosmetic_rewards.sql`. It seeds four fixed, non-medical cosmetics for Sleep, Calm, Nutrition, and Movement Boss topics, then extends the service-role-only Boss answer RPC to idempotently award the matching reward and save a topic-specific World decoration unlock on a successful clear. Wrong answers and retries cannot award another keepsake. Boss-topic matching and the existing XP/path reward remain server authoritative.
- The Boss API returns the saved reward definition title; the victory panel reveals the keepsake. The existing shared-coordinate SVG map conditionally renders the lantern, wind chimes, blossom, or pennant only from persisted World unlock data. No map renderer, coordinates, IDs, or gameplay contracts were replaced.
- Added the migration to the isolated DB, game E2E, and review HTTP runners. DB checks assert exactly one Movement keepsake and decoration and no duplicate on retry. Browser E2E verifies the Nutrition Blossom title, Collection record, and decoration survive reload and render on the map.
- `node scripts/test-healthclues-world-db.mjs` — PASS after aligning the synthetic Boss fixture topic with the reward mapping.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; full game/admin/community/mock reminder suite and cleanup passed. The actual desktop screenshot `healthclues-world-desktop.png` was inspected at original resolution; the saved Nutrition Garden Blossom is visible beside the map's Nutrition region. Boss victory screenshot shows the keepsake reveal and Collection entry.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; isolated migration, reviewer/dashboard browser tests, ebook regression, and snapshot restoration passed.
- Canonical `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 79 pages); baseline and root `.next` preserved. Changed-file ESLint and Node syntax checks — PASS. `git diff --check` — PASS apart from repository-wide LF/CRLF advisories.
- V1 remains NOT COMPLETE: actual health-content approval still requires a qualified human; broad auth/consent permutations and reward progression beyond the four initial Boss keepsakes remain open. No production database, deployment, credential change, or real email was used.

## Boss cosmetic reward administration and verification - 2026-10-28

- Added migration 20261028220000_healthclues_cosmetic_reward_configuration.sql. Reviewer configuration now allowlists exactly four seeded Boss keepsakes and five fixed milestones. Version conflicts, audit records and service-role-only RPC access remain enforced; XP, Boss eligibility, answer evaluation and unlock grants remain server-owned.
- The reviewer API loads all nine fixed rewards and validates IDs against the same allowlist. The admin screen identifies keepsakes by Boss topic.
- Isolated game E2E passed with exit 0. It applied the migration, disabled and restored the Nutrition Blossom through the reviewer route, verified all nine admin entries, and passed full game/community/mock-reminder/map and fixture-cleanup assertions.
- World DB/RLS suite PASS. Review/dashboard HTTP/browser E2E PASS. Canonical npm.cmd run build PASS (Next.js 16.3, TypeScript, 79 pages). Quiz safety PASS (38 assertions), discovery matching PASS (37), profile/activity REST E2E PASS. Changed-file ESLint, Node syntax checks and git diff --check PASS (only LF/CRLF advisories).
- Real-browser screenshot healthclues-admin-rewards-desktop.png was captured and inspected. Both root .next/BUILD_ID and App/.tmp/healthclues-build-baseline/.next/BUILD_ID remain present.
- V1 remains NOT COMPLETE: source-linked health-content candidates require qualified human review; auth/consent coverage and release review remain open. No production database, deploy, production credential or real email was used.
## Open-source game/rendering library evaluation - 2026-10-28

- Current dependency inspection (npm ls --depth=0): this HealthClues build has framer-motion@12.43.0; PixiJS, @pixi/react, pixi-viewport, Phaser, Howler.js, and Lottie are not installed.
- Preserve the accepted SVG/React World renderer. It uses one shared coordinate space, real interactive SVG nodes, persisted World unlock state and native accessible HTML controls; adding a canvas engine would create another input/rendering surface without solving a demonstrated gap. No isolated Pixi prototype was justified for this turn and no second engine was introduced.
- Motion: existing Framer Motion already drives Quest-card selection, Quiz/Knowledge transitions, inventory reveal and Boss idle/correct/wrong/victory effects; components use reduced-motion preference. The current Motion docs describe Motion as the successor and support declarative React/SVG animations; migration is not needed just to rename an existing dependency.
- PixiJS / @pixi/react: official stable PixiJS docs list 8.21.0; @pixi/react documents Pixi 8 and React 19 support (the project's React version is 19.2.8). Both package repositories list MIT. A future sprite-heavy renderer would fit, but would require a separately justified prototype and client-only lifecycle validation.
- pixi-viewport: MIT; repository v6 notes compatibility with PixiJS v8 and supplies drag/pinch/wheel camera controls. It is only relevant if the SVG map later needs a Pixi camera.
- Phaser: latest GitHub release observed during review is v4.2.1; repository lists MIT. This is a full canvas/WebGL game framework, more than current map/Boss effects require.
- Howler.js: MIT and appropriate if the product later adds optional game audio with user controls. There are no approved sound assets or audio requirement to justify it now.
- Lottie Web: repository package reports 5.13.0 and MIT. No authored, licensed animation JSON is present, so adding runtime weight without assets is not justified.
- Source checks: https://pixijs.com/versions ; https://github.com/pixijs/pixi-react ; https://github.com/pixijs-userland/pixi-viewport ; https://motion.dev/docs/react ; https://github.com/phaserjs/phaser/releases ; https://github.com/goldfire/howler.js ; https://github.com/airbnb/lottie-web/blob/master/package.json
- Follow-up security regression after adding explicit checks: game E2E PASS, exit 0. It now also rejects a non-allowlisted Boss reward ID, verifies the Boss keepsake is restored active after the reviewer test, and verifies disable/restore actions carry reviewer audit identity. Build and screenshots were produced before these test-only assertion additions; application source did not change afterward.
## Persistent Knowledge Fragments and Keys - 2026-10-28

- Added 20261028230000_healthclues_knowledge_currency_ledger.sql. An after-insert trigger awards one private Fragment per first reviewed Clue discovery and one private Key per first Boss clear. Server transaction/idempotency keys prevent duplicate awards; authenticated users can read only their own ledger rows and cannot directly insert. The awards remain separate from fixed XP and are not granted for usage counts, health outcomes or sensitive disclosures.
- World API now returns the per-World currency totals, with zero totals for accounts without a World. The map dashboard displays both counters; Knowledge discovery and Boss victory reveal their respective award.
- Isolated PostgreSQL suite PASS: exact award counts, retry behavior, full-table RLS, owner-only currency visibility and no authenticated insert grant. Game E2E PASS after correcting one fixture snapshot: the first member already had a Clue Fragment before clearing its Boss, so expected total is one Fragment/one Key. Browser assertions also verify the second member receives one Fragment from discovery and one Key from Boss, and the world totals persist/reload.
- Review/dashboard HTTP/browser E2E PASS; exact content and Quiz snapshots restored. Canonical isolated build PASS (Next.js 16.3, TypeScript, 79 pages); prior root and baseline build IDs remain present. Desktop and mobile screenshots were regenerated and inspected; currency pills fit on 390px mobile, and Boss victory displays the Key award.
- Library evaluation remains: existing reduced-motion-aware Framer Motion is sufficient; no PixiJS/Phaser/audio/Lottie runtime was added. The isolated vector world stays intact.
- V1 is still NOT COMPLETE: active reviewed real Catalog/Clue/Boss content requires a qualified human review, and remaining authorization/consent scenarios must be assessed. No production service or real email was used.
## Final V1 regression after Knowledge currency ledger - 2026-10-28

- Rerun note: first browser attempt correctly awarded member A both a prior Clue Fragment and the Boss Key, exposing an incorrect expected fixture total of zero Fragments. Updated the test expectation to the actual earlier discovery. The rerun passed; E2E cleanup confirmed no generated content fixture remained.
- node scripts/test-healthclues-world-db.mjs - PASS on the isolated unpublished-port database. Verifies exactly one Fragment/Key for eligible events, dedupe, RLS owner-only reads and denied client INSERT.
- node scripts/run-healthclues-game-e2e.mjs - PASS, exit 0. API and browser checks show member A totals 1/1 after clue plus Boss and member B totals 1/0 after clue, then 1/1 after Boss. It also passed onboarding, map, check-in, Book, Boss, Community, mock reminders, reviewer/admin, responsive interaction and synthetic fixture cleanup.
- node scripts/run-healthclues-review-http-e2e.mjs - PASS, exit 0 after the new ledger migration; review/dashboard browser, ebook regression, pending-content cleanup and exact Quiz/content snapshot restoration passed.
- npm.cmd run build - PASS, canonical isolated Next.js 16.3 build, TypeScript, 79 pages. Wrapper confirmed both prior build IDs preserved.
- Targeted ESLint passed with no findings. Node syntax checks and git diff --check passed (Git only emitted pre-existing LF/CRLF advisories). The 1440 desktop, 390 mobile and Boss victory screenshots were opened and visually inspected; map coordinates/artwork remain aligned, the currency counters fit on mobile, and victory feedback shows the Key.
- Earlier test output included one transient local Docker named-pipe denial before migration execution; docker ps then showed the isolated DB healthy and the unchanged suite passed. No production system or real email was used.
## Resume verification update — 2026-10-28

Current status matrix (supersedes older resume snapshots above):

| Feature | Status | Current evidence or remaining gate |
|---|---|---|
| Eight Quests, adaptive Quiz, skip/back/resume, age gate | DONE AND VERIFIED for tested flows | Full browser E2E plus 38 Quiz safety assertions; guest, all eight quest entry points, 10-question path, resume and underage stop. Exhaustive demographics/consent permutations remain partial. |
| Personalized recommendations from reviewed Catalog | BLOCKED for production content | Matching, safety filtering and empty state verified with isolated synthetic records. No real reviewed active Catalog corpus exists; qualified content review required. |
| Equipment, Collection, Toolkit, Recipe/Journey Combos | DONE AND VERIFIED | Full game E2E verifies selection/skip, save/equip separation, explicit combo choices/replacements, persistence and lifecycle history. |
| Persistent World/map, Check-in and Journal | DONE AND VERIFIED | Full game E2E and isolated DB cover map interaction, reload, multiple usage occurrences, edits, private timeline, XP dedupe and cross-owner denial; desktop/mobile screenshots captured. |
| Daily Clue, Knowledge Book and question history | BLOCKED for production content; feature path DONE AND VERIFIED | Review/source/version gates, empty state, discovery, private answer keys, Book history and idempotency tested with isolated synthetic content. Human review needed for publishable real content. |
| Boss challenges, animation, XP/Keys, cosmetics and World evolution | BLOCKED for production content; game path DONE AND VERIFIED | Wrong/retry/victory, server-authoritative rewards, Fragment/Key ledgers, cosmetics, persisted unlock and reload tested with synthetic challenges. Human review needed for real challenges. |
| Community, Follow, Start My Own, revoke, reports/moderation | DONE AND VERIFIED | Two-account browser/API E2E covers explicit sharing projection, Catalog/Method search, timeline, follow, independent journey, report, revoke and post-revoke access denial. |
| Reminder consent/schedule/dedupe/retry/unsubscribe | DONE AND VERIFIED in mock environment | Browser/API E2E with timezone cases, retries, dedupe, opt-out and cancellation. Real mail provider is intentionally not configured or used. |
| Admin review, moderation, Quiz authoring, reward configuration, diagnostics | DONE AND VERIFIED for tested operations | Reviewer/moderator routes, versioned drafts/publish, Quiz bank edits, fixed reward allowlist, audit identity, Vietnamese UI and diagnostics pass representative browser/API checks; exhaustive admin permission matrix remains partial. |
| Auth, RLS, privacy, idempotency | IMPLEMENTED BUT NOT FULLY TESTED | Isolated DB checks all-table RLS, anon grants, populated two-owner reads, key writes, protected RPC privileges and owner/cross-owner Profile/World/Journal mutations; API tests cover Journal/check-in cross-owner denial. Not every table/operation permutation is enumerated. |
| Game effects/libraries and visual QA | DONE AND VERIFIED | Existing shared-coordinate illustrated SVG renderer retained; reduced-motion-aware Motion effects; desktop 1440px, mobile 390px, selected region and Boss/reward screenshots inspected. No second engine justified. |
| Qualified review of real health content | BLOCKED | Requires a qualified human reviewer; no synthetic fixture has been approved or promoted. |

Latest rerun: Quiz safety PASS (38); discovery matching PASS (37); profile/activity REST E2E PASS; isolated World DB/RLS PASS; complete game browser E2E PASS with fixture cleanup; review/dashboard HTTP/browser and ebook regression PASS with snapshots restored; isolated production build PASS (79 pages; baseline and root artifacts preserved). Release remains NOT READY / V1 NOT COMPLETE.
## Expanded authenticated cross-owner matrix — 2026-10-28

- `scripts/test-healthclues-world-db.mjs` now seeds an actual member B row for each of 27 private owner families (including profile, World graph, Collection/Toolkit, check-ins and individual occurrences, Journal, discovery activity, lifecycle history, ledgers, Knowledge/Boss history, email delivery, follows and reports).
- Before switching roles, the isolated rollback transaction asserts every foreign-owner fixture is populated. Under the authenticated member A role, the probe attempts SELECT, UPDATE and DELETE against each member B row. It fails on any visible row or any changed/deleted row; missing table mutation grants count as an explicit denial. Existing positive owner-update tests remain.
- `node scripts/test-healthclues-world-db.mjs` — PASS after correcting the member B fixture to include a usage occurrence; the final run completed with fixtures rolled back.
- `node --check scripts/test-healthclues-world-db.mjs` and `npx.cmd eslint scripts/test-healthclues-world-db.mjs` — PASS.
- A first rerun occurred during a transient Docker named-pipe denial before DB startup. `docker ps` confirmed the isolated DB was healthy; the unchanged final suite then passed. Broader auth/consent role permutations and qualified real-content approval remain open; V1 stays NOT COMPLETE.
## HealthClues admin unauthenticated route coverage — 2026-10-28

- The real browser/API E2E now sends anonymous GET requests to all seven Admin endpoints: Quiz, discovery review, Community moderation, content review, authoring, diagnostics and reward configuration. Every endpoint must return HTTP 401 before the synthetic member/reviewer workflows proceed.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; full gameplay/admin/community/mock-reminder browser suite, fixture cleanup and screenshots completed.
- `node --check scripts/run-healthclues-game-e2e.mjs` and `npx.cmd eslint scripts/run-healthclues-game-e2e.mjs` — PASS.
- Previously verified application build remains applicable because this change is test-only. Full reviewer-vs-moderator operation permutations and qualified approval of real health content remain open. V1 is NOT COMPLETE.
## HealthClues Admin role-matrix expansion — 2026-10-28

- Extended the real HTTP/browser regression to test all seven Admin routes with no credential, an ordinary authenticated member token, and the legacy Botly admin token; every request must return 401.
- Added the moderator-vs-reviewer boundary for all five reviewer-only routes (Quiz, discoveries, content, authoring and rewards), plus reviewer denial on Community moderation.
- Verified both reviewer and moderator can read aggregate diagnostics and that both responses contain only the timestamp and integer queue aggregates. Existing moderator Community success and reviewer content/authoring/reward/Quiz operations remain covered.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; complete gameplay and moderation sequence, responsive interactions, screenshots and test fixture cleanup passed. `node --check` and targeted ESLint passed.
- This closes additional admin role permutations; it does not claim exhaustive authorization over every operational edge or complete V1. Qualified review of real health content is still required.
## Protected content and server-RPC authorization audit — 2026-10-28

- Read-only query against the isolated HealthClues test database returned `0|0|0` for active/reviewed Catalog items, currently published/reviewed Clues, and currently published/reviewed Boss challenges. Draft fixtures are not treated as approved data; this confirms the human-review gate remains real.
- Expanded `scripts/test-healthclues-world-db.mjs` to audit 17 server-owned business/reviewer RPC signatures: each must exist, deny EXECUTE to anon and authenticated, and grant it to service_role. The isolated DB suite passed.
- Added an authenticated direct-DML grant matrix for 17 content, answer-key, reward-config, Quiz-admin and audit tables. Test asserts there are zero authenticated INSERT/UPDATE/DELETE grants. Passed with the rest of RLS, two-owner, XP/currency/reward and reminder checks.
- `node --check scripts/test-healthclues-world-db.mjs`, targeted ESLint, and `git diff --check` — PASS. Git emitted only existing LF/CRLF advisories.
- Release remains NOT READY: only a qualified human can review/approve the real health learning corpus. No production database or service was queried or changed.
## Automated grant-to-policy RLS invariant — 2026-10-28

- The DB/RLS suite now enumerates every `healthclues_*` table with RLS and every table privilege granted to `anon` or `authenticated`. For each SELECT/INSERT/UPDATE/DELETE grant, it asserts a matching policy includes that role (or PUBLIC) and command (or ALL). A read-only audit found zero violations, and the new automated assertion passes in the isolated suite.
- `node scripts/test-healthclues-world-db.mjs` — PASS. This remains alongside populated foreign-owner SELECT/UPDATE/DELETE probes (27 data families), 17 service-only RPC privilege checks, and 17 protected-content DML checks.
- `node --check`, targeted ESLint and `git diff --check` — PASS; Git only reports existing LF/CRLF advisories.
- No application or World renderer changes. Release remains pending qualified review of real wellness content; exhaustive admin operational permutations remain partial.
## Reminder consent renewal regression — 2026-10-28

- Fixed reminder preference persistence so an already-opted-in schedule edit retains its current consent timestamp, while an opt-in after unsubscribe records a fresh consent timestamp.
- Expanded the actual browser/API game E2E to verify unsubscribe clears opt-in, explicit re-consent updates the timestamp, and the fixture is unsubscribed again before worker dispatch checks.
- First full E2E run exposed a diagnostics-page harness race: token insertion happened before the password form hydrated. Added a hydration wait and an assertion that the token is present before submit. The subsequent full E2E passed and verified generated fixture cleanup.
- `node scripts/test-healthclues-world-db.mjs` — PASS before the application-only change. `node scripts/run-healthclues-game-e2e.mjs` — PASS after change, including UI, Community, mock reminders, World/Check-in/Knowledge/Boss/Admin flows and desktop/mobile captures. `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 79 pages); isolated wrapper confirmed existing baseline and root `.next` artifacts preserved. `node --check` and targeted ESLint — PASS.
- V1 remains NOT COMPLETE / NOT READY: isolated DB still contains zero approved active Catalog items, published Clues or published Bosses; qualified human review remains required. Broader consent/authorization permutations remain open. No production database, deployment or real email used.

## Authenticated owner-spoof insertion and transfer probes — 2026-10-28

- Extended the isolated DB RLS suite to attempt foreign-owner INSERTs for personal tools, Catalog proposals, discovery activity, Collection, Follow and Community reports, plus ownership transfers on a member-owned personal tool and Catalog proposal. All eight probes are expected to fail under authenticated RLS.
- `node scripts/test-healthclues-world-db.mjs` — PASS; the suite confirms all eight probes were rejected and rolled back with the existing 27-row-family cross-owner SELECT/UPDATE/DELETE matrix. `node --check`, targeted ESLint and `git diff --check` — PASS.
- This expands write-boundary evidence; it does not close every operation/role/consent permutation. Qualified real health-content approval and the retention policy review remain release gates.

## Account data deletion and cleanup verification - 2026-10-28

- Added a HealthClues-only account data lifecycle: immediate private API/RLS lock, public-share revocation, queued-reminder cancellation, 30-day recovery, cancellation without restoring sharing or email consent, and service-token-only purge after 60 days. Botly authentication is retained; only anonymized purge audit remains.
- Added account privacy controls to the wellness account page and an authenticated-status/request/cancel API plus a timing-safe, token-protected internal retention route. Current schedule is a proposed release value and remains subject to privacy review before production.
- node scripts/test-healthclues-world-db.mjs - PASS against the isolated database, including lock/cancel/purge, owner access restoration, anonymized audit and preservation of other users' data.
- node scripts/run-healthclues-game-e2e.mjs - PASS after fixing an actual test teardown constraint failure. The browser/API run verifies deletion, cancellation, second request, scheduled purge, and then confirms test fixtures and deletion audit are cleaned. First gameplay run passed but exposed the cleanup-order defect; the repaired rerun passed with cleanup verified.
- node scripts/run-healthclues-review-http-e2e.mjs - PASS; review/dashboard, account deletion route, Ebook regression and responsive browser suite passed. Its isolated Next.js production build compiled and type-checked 79 routes.
- node scripts/test-healthclues-profile-activity-rest-e2e.mjs - PASS. Quiz safety checks PASS (38 assertions); discovery matching checks PASS (37 assertions).
- No production database, deployment or real email was used. The complete V1 remains NOT COMPLETE / NOT READY: approved real health-learning/catalog content and privacy sign-off are still required; the broad security matrix is not exhaustive.

## Latest verification after privacy-panel fix - 2026-10-28

The final async status-loading adjustment passed targeted ESLint, the complete game browser E2E (including deletion lifecycle and fixture cleanup), and the isolated Next.js production build (79 routes). The actual account privacy screenshot was opened and reviewed. Existing illustrated map screenshots and gameplay captures remain unchanged by this adjustment. No production actions were taken. Overall V1 is still NOT READY pending qualified content review, final retention policy sign-off, and remaining security/consent coverage.

## Adaptive Quiz branch coverage - 2026-10-28

- Added scripts/test-healthclues-quiz-branches.mjs to compare every Quest's resolver output against the actual quiz-bank data. All eight Quest/topic combinations map to seven real questions from the intended adaptive group, retain the shared safety/preference questions, and the health-concern topic fallback selects the expected general or concern branch.
- node scripts/test-healthclues-quiz-branches.mjs - PASS. node --check and targeted ESLint - PASS.
- Existing browser E2E continues to verify all eight Quest cards and the Eat Healthier onboarding/resume path. This focused test validates branch data mapping; it does not claim a full browser traversal of every optional question for every Quest.
- No application code changed. V1 remains incomplete pending qualified review of real health content, retention/privacy approval and the remaining authorization/consent matrix.

## Deletion access-lock RLS invariant - 2026-10-28

- Expanded the isolated database suite to require the deletion access-gate function in every authenticated RLS policy across 27 private user-data tables. The assertion rejects both missing table policies and any additional authenticated permissive policy that could bypass the lock.
- node scripts/test-healthclues-world-db.mjs - PASS: all 27 deletion-lock policies present, no bypassing policy, along with existing populated cross-owner, direct-write, reviewer privilege, game reward and purge tests; fixtures rolled back.
- First expanded run uncovered that the deletion test counted anonymized audit records left by another isolated fixture. It now stores and asserts the exact request ID generated by its own rollback fixture. Retest PASS; no test fixture was cleaned by deleting unrelated rows.
- node --check and targeted ESLint - PASS. No application or migration behavior changed in this update.

## Deletion idempotency and isolated fixture cleanup - 2026-10-28

- DB test now calls the request RPC twice while pending and asserts it reuses the same request ID. It runs the due-purge RPC twice and asserts the second run processes zero requests. Both assertions pass.
- The expanded RLS policy audit passes for all 27 private tables. DB test continues to verify request lock, recovery, purge, anonymized audit, retained Botly auth and preservation of another member's World.
- The first idempotency-test draft hit a temporary-table privilege issue while switching simulated roles. Granted the isolated temp fixture only to the test roles and reran; the full DB suite passed with all fixtures rolled back.
- The suite also revealed one anonymized row from an earlier failed synthetic browser cleanup. Confirmed it was the sole old test-time record in the isolated DB, removed that exact row, and verified zero anonymized test rows remained. Current E2E cleanup removes its own request and related synthetic canceled requests before account cleanup.
- node scripts/test-healthclues-world-db.mjs - PASS; targeted ESLint, node --check and focused git diff --check - PASS.

The latest isolated database run also verifies an active deletion hides populated rows from all 27 private data families under the authenticated role, and that duplicate requests/purge retries remain idempotent. DB suite, targeted ESLint and node syntax checks pass; all fixtures roll back.

## Pending-deletion API lock matrix - 2026-10-28

- Expanded the isolated full browser/API E2E to probe GET and mutating operations across World, Check-in, Collection, Toolkit, Journal, Knowledge, Boss, Community, Combos and Reminders while a deletion request is active. All 17 private API cases return 423; account status/recovery remains available and direct Profile PostgREST reads remain empty.
- First runs exposed test-harness timing issues in the existing Admin Quiz sign-in and transient browser-context evaluation after mobile reload. Added a hydrated-token assertion and made waitForText retry evaluation context errors while retaining a hard timeout and diagnostic snapshot. The full E2E then passed and verified cleanup.
- node scripts/run-healthclues-game-e2e.mjs - PASS, including deletion lock/cancel/purge, 17 private API lock cases, gameplay/admin/community/mock reminders and desktop/mobile screenshots; no generated fixtures remain.
- node --check, targeted ESLint and focused diff check - PASS. No product API, migration, production database or real email was changed.

## Current continuation and next exact action - 2026-10-28

Current verified additions: unanswered age Skip has a safe general-information destination with no session or database profile; consented profile revisions are owner-readable and cascade-delete; final gameplay, review/dashboard browser, DB/RLS, profile REST and build regressions pass. Next exact action: continue the remaining authenticated operation and purpose-separated consent matrix in local/test, then re-audit reviewed Catalog/Clue/Boss availability and retention policy decisions. Human content review and privacy sign-off remain release gates; do not publish synthetic fixtures or change production.


## Purpose-separated consent regression - 2026-10-28

- The signed-in Dashboard browser E2E verifies profile consent persists a profile but creates neither an email preference nor a public journey projection. The public projection check uses only the test-only isolated DB service role; normal member table access remains denied by RLS.
- Initial assertion with a member token got the expected Postgres permission denial. Corrected the test to use the isolated service token and assert a successful inspection response before checking for zero rows. Application security configuration was unchanged.
- `node scripts/run-healthclues-review-http-e2e.mjs` - PASS after correction: isolated Next.js build/TypeScript, 79 routes, ebook funnel, Dashboard browser, review/account browser, and fixture snapshot restoration. `node --check` and targeted ESLint - PASS.
- No production database, deployment, or real email was used. Broader authorization/consent review, privacy approval, and qualified content review remain open; V1 is NOT COMPLETE.


## Reverse consent independence regression - 2026-10-28

- Extended the full gameplay/API browser E2E to capture the reminder preference before and after creating an explicitly consented public journey. The account is unsubscribed before sharing, and community sharing must leave reminders opted out.
- `node scripts/run-healthclues-game-e2e.mjs` - PASS: full onboarding, Catalog/Combos, Community moderation/revoke, reminders/mock dispatch, World/check-in/Journal/Knowledge/Boss/rewards, admin, responsive interactions and screenshots; generated fixture cleanup verified. `node --check` and targeted ESLint - PASS.
- Together with the Dashboard regression, tested both directions: profile consent does not subscribe/share, and community-sharing consent does not subscribe. This does not exhaust the whole consent matrix. Release remains NOT READY / V1 NOT COMPLETE pending qualified content review, privacy approval and remaining security coverage. No production use or real email.


## Consented profile ownership-transfer regression - 2026-10-28

- Added an authenticated member A attempt to transfer the saved consented profile row owned by member A to member B in the rollback-only RLS suite. A successful transfer now fails the suite; insufficient privilege or an RLS-filtered zero-row update is accepted as denial. The combined spoof-insert/ownership-transfer probe count is now nine.
- `node scripts/test-healthclues-world-db.mjs` - PASS against the isolated local database. It confirms the profile transfer is denied alongside the 28-family populated cross-owner matrix, deletion lock/purge, reward/idempotency and all-table RLS checks; fixture transaction rolled back.
- `node --check`, targeted ESLint, and focused `git diff --check` - PASS. No production system changed. V1 remains NOT COMPLETE pending qualified content review, privacy/retention approval, and remaining authorization coverage.


## Current reviewed-content availability audit - 2026-10-28

- Read-only query against the isolated local test database returned 0 active reviewed Catalog items, 0 published reviewed Knowledge Clues, and 0 published reviewed Boss challenges. The query checked the actual schema fields active/published and review_status reviewed.
- This confirms synthetic E2E fixtures do not satisfy the content-readiness gate. No content was approved, and no production database was queried or changed.
- Qualified reviewer approval remains required before production recommendations and learning/boss content can be considered ready. V1 stays NOT COMPLETE.


## Account-deletion target spoof regression - 2026-10-28

- The full HTTP E2E now sends an unauthenticated DELETE to the account-deletion route and verifies 401. It then sends member B a request body naming member A; the route returns a request only for authenticated member B, while member A has no deletion request. Member B immediately cancels the disposable probe, and the test verifies normal account status is restored.
- `node scripts/run-healthclues-game-e2e.mjs` - PASS: full gameplay, Community/admin, mock reminders, deletion lifecycle, desktop/mobile and fixture cleanup. `node --check`, targeted ESLint, and focused `git diff --check` - PASS.
- This adds a route-level account-target ownership assertion; other permission and consent combinations remain partial. No production data or real email was used. V1 remains NOT COMPLETE.


## Invalid and expired session token regression - 2026-10-28

- The full game HTTP E2E now sends both a malformed bearer token and a correctly signed but expired authenticated token to the private World endpoint. Both must receive 401 from the auth boundary.
- `node scripts/run-healthclues-game-e2e.mjs` - PASS with these checks plus the account-deletion target-spoof case, full gameplay/admin/community/mock-reminder sequence, screenshots and isolated fixture cleanup. `node --check`, targeted ESLint, and focused `git diff --check` - PASS.
- These cases improve bearer-session coverage but do not complete the full role/operation matrix. No production database or real email was used; V1 remains NOT COMPLETE.


## HealthClues page-view analytics consent enforcement - 2026-10-28

- Fixed a privacy gap: the shared page-view tracker previously could create Botly visitor/session identifiers and send generic page views on HealthClues Quiz/World and ebook-funnel routes even when the existing HealthClues analytics opt-in was absent. The tracker now checks the same consent before emitting route analytics or creating identifiers on English/Vietnamese HealthClues and ebook paths; unrelated Botly routes keep existing behavior.
- Centralized consent read/write/event signaling and path eligibility in `src/lib/healthclues-analytics-consent.ts`; the existing funnel API re-exports the consent controls. Storage exceptions and server rendering default to denied.
- Added `scripts/test-healthclues-analytics-consent.mjs`, covering denied-by-default, quiz/ebook route gating, explicit grant/revoke, prefix boundary, unrelated routes, inaccessible storage and server denial. Focused test, ESLint and syntax check passed.
- `npm.cmd run build` - PASS with Next.js 16.3, TypeScript and 79 routes; build wrapper confirmed preserved baseline/root artifacts. `node scripts/run-healthclues-review-http-e2e.mjs` - PASS: isolated build, ebook funnel, dashboard/browser, review/account browser and test snapshot restoration.
- No production systems or real email used. Remaining qualified health-content review, privacy/retention approval and broader auth/consent matrix keep V1 NOT COMPLETE.


## Source withdrawal suppression acceptance test - 2026-10-28

- Expanded the full isolated game E2E for HC-AT04. A synthetic active/reviewed/recommended Catalog item is confirmed visible; a reviewer then deactivates it with a source-withdrawal reason. The test confirms the public Catalog no longer returns it, the audit records reviewer/action/reason, and a new World request cannot equip it.
- `node scripts/run-healthclues-game-e2e.mjs` - PASS with full gameplay, Community/admin/reminder/deletion regressions, responsive screenshots and generated-fixture cleanup. Targeted syntax, ESLint and diff checks passed.
- This verifies the reviewer-driven retraction flow with an isolated non-medical fixture; it does not promote synthetic content or claim automatic detection of a publisher retraction. V1 remains NOT COMPLETE pending qualified content review, privacy approval and remaining security work.


## Concurrent check-in award acceptance test - 2026-10-28

- Expanded the full game E2E to submit two identical daily check-ins concurrently for the same owner and local date. Both responses must succeed, share one check-in ID and XP total, and exactly one may report the fixed XP award.
- `node scripts/run-healthclues-game-e2e.mjs` - PASS with the concurrent check-in assertion, source-withdrawal retraction/audit case, full gameplay/admin/community/mock-reminder/deletion suite, desktop/mobile interactions and fixture cleanup. `node --check`, targeted ESLint and focused diff check - PASS.
- This verifies concurrent check-in and XP idempotency at the HTTP/API level. No production database or real email used; V1 remains NOT COMPLETE.

## Concurrent Boss reward idempotency and E2E cleanup repair - 2026-10-28

- Expanded the full local game E2E to submit two simultaneous correct Boss answers using one idempotency key. The test verifies both requests succeed with a correct answer, one response grants the first-clear reward, one reuses the recorded result, exactly one attempt row exists in the isolated test database, and a fresh Boss read confirms the clear persisted.
- The first run exposed cleanup ordering: deleting synthetic auth users before their canceled deletion-audit rows caused the existing ON DELETE SET NULL FK to violate the canceled-row check. Cleanup now deletes only those synthetic deletion rows before synthetic auth users. Startup stale-fixture cleanup repaired the failed run; the subsequent complete run ended with zero generated content fixtures.
- The replay response intentionally omits the original cleared/reward fields, so verification checks the replay contract and persisted state instead of assuming both response bodies repeat first-answer fields.
- node scripts/run-healthclues-game-e2e.mjs - PASS; node --check, targeted ESLint, and focused git diff --check - PASS. Screenshots: App/reports. This used only the isolated local test database; no production systems or real email. V1 remains NOT COMPLETE.


## DB, logic, build and review regression - 2026-10-28

- node scripts/test-healthclues-world-db.mjs - PASS: 28 private tables, ownership/RLS, idempotent progression and deletion checks; fixtures rolled back.
- node scripts/test-healthclues-analytics-consent.mjs - PASS; node scripts/test-healthclues-quiz-branches.mjs - PASS; node scripts/test-healthclues-quiz-safety.mjs - PASS (38 assertions); node scripts/test-healthclues-discovery-matching.mjs - PASS (37 assertions).
- node scripts/run-healthclues-review-http-e2e.mjs - PASS: isolated Next.js 16.3 production build, TypeScript, 79 routes, ebook funnel, HealthClues and review/dashboard browser flows, and restoration of all static content/Quiz fixtures. The build emitted the known middleware-to-proxy deprecation warning but passed.
- The full game E2E run in this session also passed with concurrency and cleanup-order fixes. These tests use local/test services only. V1 remains NOT COMPLETE pending the outstanding human review/sign-off and acceptance gaps.


## Game-renderer dependency and map accessibility QA - 2026-10-28

- Evaluated the current stack: Next.js/React map renderer is a shared 1600×900 SVG coordinate layer over the generated overworld artwork; the same SVG contains routes, region interaction, persisted unlock decorations, and pointer pan/zoom. The current installed animation dependency is framer-motion 12.43.0 (MIT, React 18/19 peer support), used in Quiz and Boss effects. PixiJS, @pixi/react, pixi-viewport, Motion for React, Phaser, Howler, and Lottie are not installed. A second canvas/game engine has no demonstrated benefit for the current map and would duplicate the working renderer, so no additional engine/dependency was added.
- Added reduced-motion handling to disable map pan/zoom transitions when the system preference is reduce. Added a high-contrast SVG focus ring for keyboard-focused region markers.
- The full isolated game browser E2E now checks keyboard focus visibility and emulates reduced motion to assert the map transition is disabled; both passed. The run also passed Boss/check-in concurrency, community, reminder/mock dispatch, account deletion, admin review, desktop/mobile scenarios, isolated build, and fixture cleanup. Screenshots refreshed in App/reports, including desktop, mobile, selected region and Boss victory.
- First focus styling experiments exposed selector behavior that failed at runtime; the final SVG React focus-state implementation passed the browser assertion. The quiz-preview browser auth test now dispatches the controlled input event and confirms the API accepts the token before UI submit. No production database, external email, deployment, or new game-engine package was used. V1 remains NOT COMPLETE pending qualified content review, privacy/retention approvals, and outstanding acceptance sign-offs.


## Map accessibility browser verification and profile REST regression - 2026-10-28

- Added useReducedMotion handling in src/features/healthclues/world-map.tsx so the map disables its zoom/pan transition when reduce is preferred. Keyboard focus now sets a React SVG focus state and renders a high-contrast ring on the selected region marker.
- node scripts/run-healthclues-game-e2e.mjs - PASS after the final adjustment. The real browser asserted the focused SVG ring, emulated prefers-reduced-motion and confirmed transition:none, then continued through the full game/admin/reminder/security/mobile suite; generated test content cleanup passed. Isolated production build and screenshots ran as part of the E2E.
- node scripts/test-healthclues-profile-activity-rest-e2e.mjs - PASS: versioned consented profile revisions, private history ownership, deletion cascade, check-in rationale, skipped actions, anonymous denial, cross-user isolation, and no authenticated UPDATE.
- Targeted ESLint, node --check and focused diff checks - PASS. Current evidence still does not replace qualified medical-content review or privacy/retention approval. No production database, deployment, or real email was used.


## Check-in timezone ownership integrity - 2026-10-28

- The authenticated check-in route previously trusted any valid timezone supplied in the request, even when it differed from the owner's saved Wellness World. It now reads the timezone from that owner's World, returns 409 for a mismatch, and uses the saved timezone for future-date validation and RPC persistence. Unknown World verification returns a safe 503; a non-owned/missing World returns 409.
- Expanded the real browser/API E2E to attempt a spoofed America/Los_Angeles zone against an Asia/Bangkok World and assert rejection, then save duplicate concurrent check-ins and inspect the isolated DB to confirm the persisted local-date row retains Asia/Bangkok. The full E2E passed, including one XP award only and fixture cleanup.
- node --check, targeted ESLint and diff check - PASS. No schema migration was needed; no production data or service was accessed. This closes one local authorization/timezone integrity case but does not complete the full authorization/consent matrix. V1 remains NOT COMPLETE.


## DST-local-date check-ins and reviewer form state - 2026-10-28

- Extended the isolated no-equipment World E2E with an America/New_York World starting before the fall-back transition. The test verifies two distinct UTC instants in the repeated 01:00 hour share the same local date, and the spring-forward 01:00-to-03:00 jump also shares its local date.
- Concurrent and sequential API saves for 2025-11-02 and 2026-03-08 each resolve to one persisted check-in per local date, retain America/New_York, and grant fixed XP once. Full browser/API E2E passed; generated content fixtures were cleaned.
- The same run reproduced a reviewer Quiz form bug: the DOM contained the entered credential and a direct API request returned 200, while the form request used stale React state and returned 401. The form now reads the submitted input value and passes it explicitly to the fetch; full admin browser flow passed afterward.
- node scripts/run-healthclues-game-e2e.mjs - PASS with isolated production build, gameplay, DST and timezone checks, reminder mock, community, admin, auth/RLS probes, map accessibility, mobile screenshots and cleanup. Targeted ESLint, node --check and git diff --check - PASS. No production systems or real mail used.
- Release remains NOT READY: qualified approval for real Catalog/Clue/Boss health content, privacy/retention approval, and residual acceptance coverage remain outstanding. V1 is NOT COMPLETE.


## Analytics consent transition and fail-closed revocation - 2026-10-28

- AnalyticsTracker now subscribes to the existing HealthClues analytics-consent event. A HealthClues/ebook page-view tracking key changes from denied to granted on the same route, so explicit opt-in starts current-page analytics without waiting for navigation; revocation changes the key and the event path exits before creating visitor/session IDs or sending requests. Unrelated routes do not retrack on these consent events.
- Consent revocation now stays denied in page memory if localStorage removal fails, and failed storage writes cannot grant consent over a prior stored value. Consent events still notify the tracker on storage errors.
- Expanded scripts/test-healthclues-analytics-consent.mjs for same-route grant/revoke keys, no unrelated-route retrack, failed remove, failed write, storage read failure, and server-side denial. Focused tests and targeted ESLint passed.
- node scripts/run-healthclues-review-http-e2e.mjs - PASS: isolated Next.js 16.3 production build, TypeScript, 79 routes, ebook funnel, HealthClues browser, review/dashboard browser, and fixture restoration. Only the known middleware-to-proxy deprecation warning was emitted. No production services or real email used.
- Existing full game E2E and DST check-in work remain verified. V1 is NOT COMPLETE: qualified review of real Catalog/Clue/Boss content, privacy/retention sign-off, and residual acceptance coverage remain release gates.


## Current continuation - 2026-10-28

- Verified this session: full gameplay E2E including DST and map accessibility; isolated Next.js build, 79-route generation, review/dashboard E2E, targeted analytics consent tests, and profile REST security checks.
- Next exact action: audit the remaining HC-AT23 owner/follower/moderator and HC-AT30 analytics data-suppression scenarios against the current route-level tests, then implement and run the next missing local regression. Keep the real health-content and retention-policy human approval gates open; do not promote synthetic content or query production.
- V1 remains NOT COMPLETE.

## HealthClues analytics data-minimization and server consent enforcement - 2026-10-28

- Fixed a gap found in the HC-AT30 audit: analytics consent had only been checked in browser code, while `/api/event-ping` and `/api/analytics/track` accepted direct HealthClues requests. Both ingestion routes now require the explicit same-site grant cookie for HealthClues/ebook paths and accept only the coarse, reviewed funnel event allowlist.
- HealthClues analytics now drops query strings, referrer, article slug, ebook ID, Quest ID, answers, notes, and unrecognized event types before network transmission; server ingestion applies the same minimization. Consent defaults to denied, explicit revocation clears the cookie, and storage errors fail closed. Unrelated Botly analytics behavior is unchanged.
- `node scripts/test-healthclues-analytics-consent.mjs` - PASS (consent, cookie, payload minimization, query stripping, answer-event rejection and failure handling).
- `node scripts/run-healthclues-game-e2e.mjs` - PASS (full gameplay, community, mock reminder, admin, security, desktop/mobile, Boss/reward persistence and cleanup; isolated build included).
- `node scripts/run-healthclues-review-http-e2e.mjs` - PASS (isolated production build, browser scenarios, and direct unconsented/answer-level event denial on both analytics endpoints; cleanup passed).
- Targeted ESLint, script syntax checks, and `git diff --check` - PASS. No migration, production service, deployment, or real email used. No screenshots changed by this data-ingestion-only change.
- HC-AT30 remains only partially closed: new raw health-specific event capture is prevented, but the proposed n<10 aggregate cell-suppression behavior and a review of any pre-existing analytics records still need a dedicated test/approval. V1 remains NOT COMPLETE.

## HealthClues analytics database boundary and general-dashboard isolation - 2026-10-28

- Added `supabase/migrations/20261028260000_analytics_service_ingestion_only.sql`: removes the public `anon_insert_analytics` policy and revokes direct INSERT from `anon` and `authenticated`. Existing Botly clients continue to use the server analytics routes; the service role remains the only database writer.
- Both isolated E2E runners now apply this migration. The review HTTP E2E exited 0 after asserting that direct anonymous PostgREST insertion of a synthetic HealthClues row is rejected and leaves no row, and that both server ingestion routes ignore unconsented and answer-level events.
- General admin analytics now filters HealthClues-specific quiz rows from the Botly recent-quiz view and Insomnia quiz analytics, including historic rows, while retaining unrelated Botly routes. `node scripts/test-healthclues-analytics-consent.mjs` covers the path-filter boundary.
- Latest-source isolated Next.js production build - PASS, TypeScript and 79 routes generated; existing baseline/root `.next` artifacts preserved. Targeted ESLint and script syntax checks - PASS.
- `node_modules/.bin/tsc.cmd --noEmit` at the repository root - FAILS on stale root `.next/types/validator.ts` route declarations from the previous root build cache. The supported isolated production build passes and does not overwrite that cache; this raw tsc invocation is not the project build command.
- A post-migration full game E2E rerun is still live but stalled after its admin moderation screenshot at `docker cp ... setup.sql` for isolated fixture restoration. The app and browser remain live; the docker CLI `docker cp` and a separate `docker ps` diagnostic have not returned. This run is not marked PASS or failed; preserve it and resolve the local Docker CLI/engine stall before retrying cleanup/regression. Earlier full game E2E passed before this RLS migration.
- No production database, deployment, real email, or non-test user data was changed. V1 remains NOT COMPLETE; minimum-cell suppression and human content/privacy approvals remain release gates.

## Docker E2E runner state recheck ? 2026-10-28

- Re-polled the same `node scripts/run-healthclues-game-e2e.mjs` process (PID 5856) and its child `docker cp` (PID 36472); both remain live without additional output. The pending copy is the isolated fixture reset SQL, not a production operation.
- Confirmed app port 3220 serves the game and PostgREST port 3001 responds. A read-only probe connected to `\\.\pipe\docker_engine`, but the Engine did not answer `GET /_ping` within three seconds; the earlier `docker ps` and current fixture `docker cp` remain pending. This points to Docker control-plane unresponsiveness, not app/database HTTP unavailability.
- Did not restart Docker Desktop or terminate the runner because that would disrupt unrelated local containers and could interrupt fixture recovery. Continue by resolving the local Docker Engine stall safely, then let the existing runner reach cleanup/exit before rerunning.

## Analytics RPC authorization audit ? 2026-10-28

- Continued the HC-AT30 boundary review and found the baseline `get_admin_analytics(integer)` security-definer RPC still had `EXECUTE` grants for `anon` and `authenticated`, which bypasses the token check on `/api/admin/analytics`.
- Added `supabase/migrations/20261028270000_admin_analytics_service_only.sql` to revoke execution from `PUBLIC`, `anon`, and `authenticated`, retaining execution for `service_role`. Both isolated E2E runners apply it. The review HTTP runner now asserts direct anon/authenticated RPC denial and successful authorized server API access.
- This new RPC ACL regression has not yet run because the existing game E2E is still waiting on Docker Engine during fixture reset. Do not treat this migration as database-verified until the review HTTP E2E exits successfully after applying it.
- Added a 60-second timeout to the game runner's Docker copy/SQL helper so future isolated runs fail with an actionable error rather than waiting indefinitely. It does not interrupt the already-running process, whose code was loaded before this change.
- Latest isolated application build, analytics consent/path tests, targeted ESLint, and script syntax checks remain PASS. The active runner/test fixture and unresolved Docker control-plane state are recorded above; V1 remains NOT COMPLETE.

## Docker recovery attempt ? 2026-10-28

- Tried the supported local-only `docker desktop restart --detach --timeout 30` after repeated Docker Engine `/_ping` and `docker cp` stalls. It exited 1: Docker Desktop could not stop its backend processes, and the CLI could not write diagnostics under `C:\Users\Admin\AppData\Local\Docker\log\host` or read `C:\Users\Admin\.docker\config.json` because the workspace filesystem sandbox denies access there.
- The existing full game E2E PID 5856 and its `docker cp` PID 36472 remain live. A fresh `docker ps` is also still pending. The app and PostgREST had continued to answer HTTP 200 before this attempt. No production/user data was touched; no Docker data was deleted.
- Required next external-state change: restore Docker Desktop control-plane access/restart outside the workspace sandbox. Then allow PID 5856 to reach its bounded copy/cleanup path, verify the isolated DB is clean, apply both analytics ACL migrations through the test runners, and rerun review/game E2E. The current migrations are not claimed DB-verified.

## Resume — Docker recovery, analytics ACL, and acceptance audit — 2026-10-28

- Docker Desktop recovered, but its restart had stopped the isolated E2E containers and removed the PostgreSQL forwarding container. Restarted only the dedicated HealthClues test database and PostgREST. Recreated the missing forwarder with its PostgreSQL target on the internal test network and a `127.0.0.1:5434` host binding; the game and review runners confirmed database identity before running.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0. This verifies migrations `20261028260000` (analytics service-only ingestion) and `20261028270000` (admin analytics RPC service-only access), plus the isolated build/TypeScript/79 routes, ebook funnel, HealthClues browser, review/dashboard flows, and restoration of content and Quiz fixtures.
- The previously stalled `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; all generated content fixtures were removed. Extended its HC-AT23 checks for owner access to their own share state, follower access to explicitly projected fields only, follower revoke denial, and moderator denial from private Journal API. The updated full game E2E passed and cleanup again verified no generated content fixture remained.
- HC-AT23 remains partial: the community specs promise member blocking, but no block action, persistence relation, or feed filtering exists. Existing coverage now verifies owner/follower/reporter/moderator boundaries and the moderator cannot call the private Journal API; it does not substitute for implementing block/mute behavior or exhaustive per-resource permissions.
- HC-AT30 remains partial: browser consent, server ingestion minimization, direct-write/RPC authorization, and exclusion of HealthClues quiz trails from the Botly recent-quiz view are verified. No HealthClues-specific aggregate dashboard or explicit `<10` cell suppression exists in the current response/UI path, and pre-existing analytics retention has not been assessed. Do not inspect production or change historical analytics without the separately approved privacy review.
- `node --check scripts/run-healthclues-game-e2e.mjs` and focused `git diff --check` — PASS. The known Next middleware-to-proxy deprecation warning appeared during build; build passed.
- Release remains NOT READY / V1 NOT COMPLETE. Qualified review of real Catalog/Clue/Boss content and privacy/retention approval remain human gates. No production database, deployment, credentials, or real email was used.

## Master Prompt 04 Game Shell — 2026-10-28

- Added canonical `/play`, a fantasy Welcome, shared Game Shell and account-aware smart entry while reusing the existing Quest, Quiz, Toolkit and World components. The implementation details and verified acceptance evidence are in `App/reports/GAME_SHELL_ACCEPTANCE.md`.
- Root cause of the Next dev CSS failure: Tailwind's arbitrary selector `md:[&>*:first-child]:order-2` in `src/components/sections/Process.tsx` generated an invalid pseudo-class selector in `globals.css`. Replaced it with `md:order-2`. The production stylesheet source had no control bytes; the generated utility was the cause.
- Captured and inspected Welcome and Quest desktop/mobile plus guest World desktop/mobile and Toolkit desktop. Fixed mobile Welcome clipping and removed the Quiz Quest reduced-motion hydration mismatch. No Botly marketing header/footer appeared in the game views.
- Live guest preview is available at `http://127.0.0.1:3210/play` from `.tmp/healthclues-prompt04-dev` with webpack. Root `App`/`app` casing collision prevents using the root as the Next app directory on this Windows workspace. Root `.next` and saved build baselines were preserved.
- Returning-player routing and account-owner guards are implemented but were not exercised with an authenticated player. Boss screenshot and authenticated progression were not attempted because `.env.local` points to production Supabase; no account login or writes were performed. No new long E2E or DB suite was run. Production readiness is not claimed.
# Master Prompt 05 visual experience — 2026-10-28

- Added a reusable six-pose adventurer sprite (PNG source and transparent WebP) and integrated it into Welcome, Quiz, Toolkit Collection, Knowledge, Community, and Boss presentation.
- Replaced the Quiz's plain page presentation with the existing illustrated World environment, region tint, scene rail, question panel, progress display, and responsive layout. Existing eligibility/question behavior and API logic were preserved.
- Updated captures for Welcome, Quest, Eligibility, and Quiz at desktop and 390px mobile. Visual inspection confirms the fantasy baseline is retained and no Botly marketing chrome appears in these screens.
- Preview remains at `http://127.0.0.1:3210/play`, served from the isolated source copy without root `.env.local`.
- This is a partial visual milestone. Dedicated quest-region and boss art, fresh QA for Results/Check-in/Toolkit/World/Knowledge/Boss/Rewards/Community, authenticated resume/account-isolation tests, and existing privacy/content release approvals remain outstanding. See `App/reports/RPG_VISUAL_ACCEPTANCE.md`.

## Master Prompt 05 continuation — visual acceptance and isolated end-to-end run (2026-10-28)

- Captured and visually inspected fresh 1440×960 and 390×844 Chromium views for Results, Toolkit, Collection, World, Check-in, Journal, Knowledge, Boss, Community, and persisted World rewards/evolution. Evidence is in `App/reports/previews/` and screen-by-screen status is in `RPG_VISUAL_ACCEPTANCE.md`.
- Updated the isolated game E2E screenshot helper to keep content below the sticky HUD and added a distinct reward/evolution viewport capture. `node --check scripts/run-healthclues-game-e2e.mjs` passed.
- Latest `node scripts/run-healthclues-game-e2e.mjs` passed the full existing guest/authenticated synthetic journey against the isolated Docker E2E DB; it covered the complete Start Adventure → Quest → Quiz → Toolkit → World → Check-in → Knowledge → Boss → persisted Rewards flow, reload and same-World resume without duplication. Cleanup confirmed no generated content fixture remained.
- Preview remains guest-only at `http://127.0.0.1:3210/play`; `.env.local` is production-configured and was deliberately excluded. No production write or deploy occurred.
- The transient Next “1 Issue” was traced to copying source into the active watched dev directory before the copy finished. Fresh DevTools verification shows no current browser/Next issue. Avoid live partial source sync; the badge was not hidden.
- Master Prompt 05 remains **PARTIAL**: Results, Toolkit/Collection, Check-in/Journal, Knowledge and Community retain form-like visual layouts; distinct region/Boss art, isolated interactive login preview, account-switching browser coverage, and independent content/privacy/security gates remain outstanding. V1 is not production ready.
## Master Prompt 07 — seamless onboarding (2026-10-28)

- Implemented World-first flow in existing Quiz/Game Shell: max 10 initial questions, branch changes reset prior branch answers, short companion-led reveal, actual interactive read-only map preview, consented activation overlay, and existing Backpack overlay before idempotent World creation.
- Returning-player E2E confirms /play restores the same World ID and does not create a duplicate. Unknown-age Skip and underage stop remain intact.
- Added pending journey context bound to email/Quest and expiring after 20 minutes. It stores derived profile/consent context, not full answers; it is plaintext localStorage and remains a privacy hardening limitation.
- Isolated Next build, focused lint, script syntax check and full game E2E passed. Actual desktop/mobile Chromium screenshots for reveal, preview, activation, backpack and World were captured and inspected. Full findings and blockers: App/reports/SEAMLESS_GAME_FLOW_ACCEPTANCE.md.
- E2E used the verified isolated fixture account; real anonymous signup, Supabase Auth verification callback, link recovery and account switching were not tested. Preview http://127.0.0.1:3210/play remains guest-only; .env.local production target was excluded. No production writes/deploy.
- Milestone PARTIAL, not complete; V1 remains NOT READY pending isolated Auth/mail capture, pending-state privacy review, account-switch coverage, human content approval and existing security/privacy gates.
### Master Prompt 07 — latest callback test update (2026-10-28)

Latest E2E starts anonymous, verifies World Preview has no saved World, submits email to a loopback mock OTP provider, captures pending desktop/mobile, then runs the real callback page using a synthetic signed test identity. It continues into the selected Quest Backpack, creates one World and passes same-ID /play resume. This supersedes the earlier note that browser E2E started pre-verified. Actual Supabase email delivery/provider, expired-link and account-switch behavior remain PARTIAL; pending context remains plaintext localStorage. See SEAMLESS_GAME_FLOW_ACCEPTANCE.md.
### Live preview availability correction

Earlier notes describing 3210 as an available preview are stale: the current 3210 process returns a Next not-found page for /play. Isolated trial on 3211 also returned not-found and was stopped; no existing process was terminated. The full E2E app on 3220 rendered the current source and passed, then runner cleanup stopped it. Do not advertise a live preview URL until the standalone Next routing issue is resolved.


### Master Prompt 07B - live preview recovery (2026-10-28)

- PASS: owner URL http://127.0.0.1:3222/play was opened in Chromium and the actual UI was exercised. Detached isolated server remains available after E2E cleanup.
- PASS: screenshots from that URL: live-preview Welcome desktop/mobile, Quest desktop, Reveal desktop, World Preview desktop/mobile, Activation desktop/mobile; files are under previews/ and were inspected.
- PASS: Welcome, Start Adventure, eight Quest destinations, Sleep Better Quiz (10-question maximum), Reveal, read-only World Preview and activation overlay rendered with zero uncaught runtime exceptions.
- PARTIAL: live owner preview intentionally has no Supabase/Auth; activation is read-only and does not send email or save a World. Backpack and active World were verified in isolated authenticated E2E screenshots.
- Root route issue: 3210 root dev manifest lacked /play/page; isolated Next build resolves it. Previous raw Flight HTML not-found probe was not sufficient. See LIVE_PREVIEW_RECOVERY.md.

### Pending activation privacy correction (2026-10-28)

- PASS: removed pending derived profile/email from localStorage. The legacy key is cleared on /play entry. New pending context is AES-GCM encrypted in a 20-minute HttpOnly SameSite cookie; retrieval requires a valid bearer session, verified email, and exact email match. No sensitive profile or Quiz data is placed in URLs.
- PASS: lint, isolated Next build, and full isolated game E2E passed after the change; no production Auth or data used.
- PARTIAL: real provider email delivery, link replay/expiration, cross-tab behavior and account switching remain to verify. The owner preview is guest-only and cannot persist.
- See LIVE_PREVIEW_RECOVERY.md for full details, tested URL, commands, and visual evidence.

## Master Prompt 07C — owner-visible Reveal fix (2026-10-28)

- PASS: The tested owner URL is http://127.0.0.1:3222/play. Chromium recorded the post-Quiz URL `/en/wellness/healthclues/quiz?from=play&step=reveal` and confirmed the old profile subtree is not mounted (`details=0`).
- PASS: Profile copy, six detail cards, Update/Clear controls, First Discoveries, external Guides/Ebooks and the old Toolkit CTA are absent from all eight canonical game Quest branches, even with `view=profile` in a stale URL.
- PASS: Refresh at Reveal resumes the same selected Quest. Selecting a Quest changes the route state to `step=onboarding`; explicit `step=quest` clears a stale World Preview draft.
- PASS: clicking ENTER MY WELLNESS WORLD opens the actual eight-region read-only map; no activation appears until START YOUR JOURNEY. Activation close returns to Preview. Result/Preview scenes reset scroll to the top.
- PASS: final owner-preview browser verification: eight branches, maximum 10 questions, desktop/mobile overflow/footer checks, 0 uncaught runtime errors. Actual screenshots captured and visually inspected under previews/.
- PASS: full isolated Docker game E2E after integration, including mock verification callback, Backpack, one persistent World, same-ID reload, Toolkit, Knowledge, Boss/rewards and Community privacy. Synthetic fixture cleanup passed.
- Root cause: the Quiz result component always mounted an expandable six-field Discovery Profile and external discovery dashboard under the short Reveal. Previous E2E only asserted the visible Reveal/action, not absence of the collapsed `<details>` subtree; its clean browser also missed stale `world_preview` draft overriding explicit Quest selection.
- PARTIAL: owner preview is intentionally guest/read-only with Auth/Supabase excluded. Real provider email, expired/replayed links and real account switching remain unverified. No production data, email or deployment used.
- Detailed evidence and before/after screenshots: OWNER_EXPERIENCE_FIX_ACCEPTANCE.md. Preview restart: `node scripts/start-healthclues-owner-preview.mjs`; rebuild after source changes with `node scripts/start-healthclues-owner-preview.mjs --rebuild`.

## Master Prompt 07D — fullscreen World (2026-10-28)

- PASS: focused fullscreen World visual change completed and verified from the same isolated owner preview build at http://127.0.0.1:3232/play.
- PASS: Chromium checked desktop 1440×960 and mobile 390×844, one interactive map, visible CTA, mobile fit, no horizontal overflow or wheel scrolling, region selection, pan, zoom and activation overlay. Screenshots were captured and inspected; see FULLSCREEN_WORLD_ACCEPTANCE.md.
- PASS: isolated Next.js 16.3 build, focused ESLint, browser verification across eight Quest branches and full isolated Docker game E2E passed. Synthetic fixture cleanup passed.
- PARTIAL: owner preview is guest-only. Live provider email/auth lifecycle is not covered. No production data or services were changed; release gates remain NOT READY.
### Master Prompt 07D final build correction

The final keyboard-accessibility build supersedes the earlier 3232 snapshot. Owner URL: http://127.0.0.1:3233/play (detached isolated process 32728). The final Chromium run and screenshots came from this 3233 build; focus enters activation, Escape closes it and focus returns to Start Your Journey. The final isolated game E2E passed and cleaned its synthetic fixtures. Restart/rebuild with `HEALTHCLUES_PREVIEW_PORT=3233` and `node scripts/start-healthclues-owner-preview.mjs --rebuild` after the port is free. Ports 3210 and 3222 remain untouched.
## Shared-source change after final verification — status PARTIAL

After the 3233 browser run and final isolated E2E passed, the shared working tree changed again: `world-map.tsx` now adds `playable` flags, companion names and a “COMING SOON” state, while `verify-healthclues-owner-preview.mjs` now expects only Sleep Valley and HealthClues Realm to be selectable and six regions to be disabled. Those file timestamps are later than the verified 3233 build. I left these newer changes untouched. The still-running 3233 URL is a verified detached snapshot of the 07D build, but it no longer represents the latest shared source. The new region restrictions may conflict with 07D’s requirement to inspect other regions. Reconcile that shared-source decision, then rebuild/retest before treating current source as accepted.
## Master Prompt 08 Final V2 — current audit (2026-10-28)

- PARTIAL: eight Overworld region IDs remain visible; centralized availability marks only Sleep Valley/HealthClues Realm playable. World creation API now rejects the six unreleased region IDs. Browser preview 3234 verified all eight labels (2 playable, 6 Coming Soon).
- PASS: isolated Next build and Chromium owner guest preview at http://127.0.0.1:3234/play; Welcome → Sleep Quiz (10 max) → Reveal → read-only World Preview → activation overlay. Zero browser runtime exceptions. Desktop/mobile World screenshots inspected.
- BLOCKED: local Supabase Auth and local email inbox are absent. `.env.local` points to production Supabase and was excluded; no writes/email/deploy performed. The owner preview is read-only guest only.
- BLOCKED: no detailed Sleep/Health region map artwork/renderer, Luna/Lumi pet assets/engine, canonical health Journey Context, Gout-specific continuity, in-map Knowledge/mini-games/Skills, or per-Journey loadout switching is present/verified. Existing V1 Toolkit, Knowledge, Boss, Rewards, Check-in and Journal components remain.
- Superseded status note: the full isolated E2E final rerun below PASS; the first two runs exposed stale fixture/locked-region assertions, which were corrected.
- Full feature matrix and limitations: `OWNER_PLAYABLE_FINAL_ACCEPTANCE.md`, `TWO_MAP_GAMEPLAY_ACCEPTANCE.md`, `QUIZ_TO_JOURNEY_PERSONALIZATION.md`, `PET_TOOLKIT_KNOWLEDGE_ACCEPTANCE.md`. Product remains NOT READY for production.

## Master Prompt 08 Final V2 — final rerun

- PASS: `node scripts/run-healthclues-game-e2e.mjs` completed successfully after correcting legacy assertions to match the selected Sleep Journey and the six locked Coming Soon regions.
- Coverage included quiz resume/max 10, mocked isolated activation callback, World creation and same-ID reload, Knowledge, Boss/rewards, Toolkit/Collection, Check-in/Journal, Community privacy, desktop/mobile interaction and synthetic fixture cleanup.
- Real Supabase email/Auth provider, Gout personalization, detailed region maps and pet/gameplay integration remain BLOCKED/PARTIAL; see `OWNER_PLAYABLE_FINAL_ACCEPTANCE.md`.

## Milestone 09A — isolated owner Auth and playable World (2026-10-29)

- PASS: dedicated local Supabase project, confirmed-email Auth and Mailpit inbox; 28 migration versions; separate persistent DB volume `supabase_db_healthclues-owner-demo`. Existing E2E volume was not used.
- PASS: production-mode isolated `/play` build and actual Chromium owner flow at `http://127.0.0.1:3235/play` → local email confirmation → Backpack → persistent World. `/play` reload resumed same World ID and one branch.
- PASS: second verified synthetic account could not read the first owner's World/check-in. Guest World API returned 401; invalid callback showed recovery. Browser runtime exceptions: 0.
- PASS: Welcome/World/Activation/Backpack/active World screenshots captured from this owner build and inspected. Full guest visual regression at the same URL also PASS.
- PASS: dedicated demo services were stopped/restarted without resetting the volume; 4 Auth users, 2 Worlds and 2 branches remained. The retained authenticated Chrome profile resumed `/play` into the same World, and reload retained its World ID (`scripts/verify-healthclues-owner-resume-after-restart.mjs`).
- PARTIAL: hosted email provider, expired/replayed real OTP, account deletion and full browser close/reopen are not verified. Detailed region maps, Pets, Journey context, Skills/mini-games and reviewed health-content gates remain PARTIAL/BLOCKED. V1 remains NOT COMPLETE.
- Start `App/start-game-demo.bat`; exact endpoints and evidence: `OWNER_PLAYABLE_AUTH_ACCEPTANCE.md`.

## Milestone 09B current implementation update — 2026-10-29

The newer evidence supersedes earlier 09A statements that detailed region scenes and Pets were absent: the 3238 isolated owner build now has interactive Sleep Valley/Luna and HealthClues Realm/Lumi scenes, authenticated RPG navigation, and Quiz-selected Gout continuity. See `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`. Topic-specific reviewed Knowledge/Catalog content, production-quality art, normalized Journey/loadout persistence, optional Daily Companion, learning mini-games/Skills and complete in-map Boss/reward acceptance remain incomplete or unverified.


## 09C implementation update — 2026-10-29

PARTIAL. Implemented shared Herbal/Nutrition, Movement and Wellness station panels, reviewed Catalog filtering, private owner-scoped Care Plan records/events, guide transition fix, and responsive mobile overlay/map adjustments. Final Chromium/Auth acceptance on the isolated owner demo is recorded in HEALTHCLUES_09C_GAMEPLAY_ACCEPTANCE.md. Reviewed content, detailed learning progression, final map/NPC art and daily Pet conversation remain incomplete. No production changes.

## 2026-10-29 — Milestone 09D-R

Status PARTIAL. Existing static SVG Region scene now has separate illustrated map backgrounds, continuous player movement on authored corridors, follow camera/Pet and proximity-gated NPC Talk. Owner Chromium/Auth regression passed on `http://127.0.0.1:3247/play`; local Auth/Postgres/Mailpit only. Screenshot evidence and precise gaps: `REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`. No schema migration or production change.


## Final-demo navigation correction — 2026-10-29

Owner demo build `app-build-final-a5`, URL `http://127.0.0.1:3249/play`, Mailpit `http://127.0.0.1:54324`. React region map now has authored constrained corridors, A* route checks, explicit bridge-deck debug markers, feet anchor CSS fix and blocked mouse/keyboard destinations. Latest local Chromium owner flow PASS for script assertions, including Sleep and Health/Gout, bridge route, mobile-emulated touch, Auth/Mailpit, World ID, account isolation and 0 browser exceptions. Overall remains PARTIAL: the collision map is not a precision polygon/navmesh, physical-device/performance/art QA and separate Mini-game/Skill progression remain unfinished. Full evidence: `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.
