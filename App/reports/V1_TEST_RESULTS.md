# HealthClues V1 Test Results

## Resilient Furniture Image Upload & Dynamic Serving Verification — 2026-11-09 (Cycle 60)

- **API & Dynamic Image Serving Audit (`scripts/verify-upload-fix.mjs`)**:
  - `POST /api/healthclues/wellness-home/upload`: Verified multipart file upload returning HTTP 200, valid JSON with `url` and `dataUrl`.
  - `GET /api/healthclues/wellness-home/file?name=...`: Verified image serving returning HTTP 200, `Content-Type: image/png`, valid non-empty byte buffer.
  - `POST /api/upload`: Verified backward-compatibility endpoint returning HTTP 200.
- **Admin Studio Browser CDP Audit**:
  - Sidebar quick upload card `[data-testid="admin-sidebar-upload-card"]` verified present.
  - Injected sample PNG image via DOM file input: Image rendered successfully on stage canvas without errors.
  - `brokenCount: 0` verified: All stage image assets returned natural dimensions > 0 with zero 404s.
  - Item saved successfully to database and memory catalog.
  - Artifacts captured:
    * `01_admin_after_upload.png`: Stage rendering newly uploaded furniture.
    * `02_admin_saved_upload.png`: Saved state confirmed.
- **Security & Integrity**:
  - `scripts/scan-secrets.mjs --all`: PASS (1393 files checked, 0 secrets found).

---

## Swiss Chalet NavMesh Painter, Compact Journey Header & Housewarming Persistence Audit — 2026-11-09 (Cycle 59)

- **Walkable NavMesh Painter & Obstacle Avoidance Verification (`scripts/verify-walkable-and-journey-header.mjs`)**:
  - Admin Studio (`/admin/healthclues-home`):
    * NavMesh painter toggle `data-testid="admin-toggle-painter-btn"` successfully activated.
    * Toolbar verified with 🟢 Cọ Vẽ, ⚪ Cọ Tẩy, Brush Sizes (20/45/80), 🎯 Mẫu Chuẩn, 🚶 Thử Đi Lại, and 💾 Lưu Mặt Sàn.
    * Mask drawing verified: Green overlay rendered correctly on Living Room and Bedroom.
    * Saved mask verified: Successfully sent via POST `/api/healthclues/wellness-home` and loaded back on refresh.
    * Live test verified: Chibi Anna walks strictly within the green walkable region and stops at boundaries.
  - Compact My Journey Header:
    * Modal opened on `/play` (`Hành Trình`).
    * Kicker `HEALTHCLUES · HEALTHCLUES REALM` verified absent.
    * Summary strip `.hc-habits-summary-strip` verified absent.
    * Header height streamlined to under 100px; habit tracking cards verified immediately visible.
  - Housewarming Gift Persistence & Badge 2/10:
    * Chalet entered: Title shows clean `Căn Nhà Thụy Sĩ` without `2/10`.
    * First visit starter sofa claimed and placed.
    * Page refreshed and re-entered: Welcome gift modal is 100% suppressed (`welcomeModalPresent: false`), Luxury sofa is already placed in the living room.
  - Artifacts captured:
    * `01_admin_walkable_painter_active.png`
    * `02_admin_walkable_saved.png`
    * `03_compact_my_journey_modal.png`
    * `04_chalet_home_persisted.png`
    * `05_chalet_reentered_no_popup.png`
- **Security & Build**:
  - `scripts/scan-secrets.mjs --all`: PASS (1388 files, 0 secrets).
  - Turbopack Production Build (`app-build`): PASS (85/85 static pages, 0 errors).

---

## Landscape Navigation Bottom Dock & Topbar Stability Audit — 2026-11-09 (Cycle 52)

- **Landscape Viewport CDP Automation Audit (iPhone 14 Landscape, 844x390)**:
  - Bottom navigation dock `.hc-rpg-bottom-dock` verified visible (`display: flex !important;`, height ~34px, bottom ~4px).
  - All 5 navigation buttons (`Bản đồ`, `Hành Trình`, `Nhắc nhở`, `Hôm nay`, `Nhà Của Tôi`) verified present and 100% interactive.
  - Floating overlays cleared: `.hc-rpg-lumi-reopen-btn` verified at `bottom: 2.8rem`, dialogues at `bottom: 3.4rem`, zero stacking overlap with the dock.
  - Topbar Mystery Gift button `.hc-rpg-next-reward` verified hidden on landscape/short viewports, permanently resolving collision with `Lv.1 · Explorer` and EXP bar.
  - Edge-to-edge game canvas verified: over 91% vertical screen area preserved for immersive map navigation and Swiss Alpine Chalet.
  - Artifacts captured:
    * `01_landscape_dock_restored.png`
    * `02_portrait_dock_verified.png`
    * `03_chalet_landscape_verified.png`
- **Security & Build**:
  - `scripts/scan-secrets.mjs --all`: PASS (1363 files, 0 secrets).

---

## Chalet Persistence & 2/10 Badge Removal Audit — 2026-11-09 (Cycle 51)

- **Mobile Viewport CDP Automation Audit (`test-chalet-persistence.mjs`)**:
  - Visit 1 (Initial Welcome Gift): Modal opens on first-time entry; player claims Day 1 Luxury Alps Sofa.
  - Visit 2 (Returning Player): Re-entering Chalet automatically renders the Living Room with Luxury Sofa and coffee table in place; `welcomeModalPresent: false` strictly verified; `hasBadge: false` verified.
  - The green `2/10` counter badge is completely absent from the title bar.
  - Artifacts captured:
    * `chalet_01_first_visit_welcome_modal.png`
    * `chalet_02_claimed_sofa_no_badge.png`
    * `chalet_03_second_visit_auto_loaded.png`
- **Security & Build**:
  - `scripts/scan-secrets.mjs --all`: PASS (1363 files, 0 secrets).
  - Vercel Production Build: PASS (`dpl_5PJnvwjpToj7LW5oSvnfC1CQFdyH`, HTTP 200 on `https://www.botly.vn/play`).

---

## Mobile Journey Header & Real Estate Optimization Audit — 2026-11-09 (Cycle 50)

- **Mobile Viewport CDP Audit (iPhone 14, 390x844)**:
  - Header modal height reduced from ~60px to 36px; subtitle kicker hidden on mobile.
  - Tab controls transformed into a 30px segmented control with 100% clickability and active state transitions.
  - Action buttons `.hc-add-habit-btn` & `.hc-view-all-plan-btn` verified at 28px height.
  - Redundant summary strip `.hc-habits-summary-strip` verified hidden (`display: none !important;`).
  - Active habit card list begins at top 98px of modal, fully visible in viewport without scrolling.
  - Artifacts captured: `portrait_02_journey_signedin.png`, `portrait_02_journey_with_3_habits.png`.
- **Security & Build**:
  - `scripts/scan-secrets.mjs --all`: PASS (1354 files, 0 secrets).
  - Vercel Production Build: PASS (`dpl_H7Q1otzdUiwbTEEKnFkeMD85cDZj`, HTTP 200 on `https://www.botly.vn/play`).

---

## Latest continuation run — 2026-10-28

- `npm.cmd run build` — PASS. Isolated Next.js 16.3 production build, TypeScript and 77 generated pages; baseline and root `.next` preserved.
- `node scripts/test-healthclues-world-db.mjs` — PASS on isolated Postgres with the new reminder retry migration; World/Collection/XP/RLS checks plus service-role-only reminder worker functions passed.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS on the isolated local Next server and headless Chrome. In addition to the established game loop and visual map checks, this run verified transient reminder failure/retry timing and dedupe; explicit Catalog publish/recommendation eligibility persistence; Community report review, dismiss, remove and revoked projection access. Stale synthetic Catalog fixture cleanup also passed after reviewer metadata mutation.
- Targeted ESLint — latest run PASS with zero errors/warnings; previous test-script warnings were fixed.
- No production DB, deployment, credentials, or real email were used.
- Screenshots regenerated under `App/reports/`; map visual QA remains from the accepted RPG overhaul and was not redesigned in this continuation.
- Still not exhaustive: all Quest-specific adaptive content branches, broad endpoint/RLS matrix, reminder retry exhaustion and timezone/frequency edge cases, stale-version admin conflict behavior. No human-approved real health content exists in the isolated fixture set.

## Build-isolation and regression harness follow-up — 2026-10-28

- Reproduced a legacy harness build failure: `scripts/run-healthclues-review-http-e2e.mjs` invoked Next build at `D:\botly` root and Next traversed the preserved `App/.tmp/healthclues-build-baseline` as a case-insensitive app route. Its cleanup then removed root `.next` even on failure.
- Fixed the harness to use an owned temporary build root and restricted cleanup to that root; restored root `.next` from the latest successful isolated HealthClues browser build. Verified the named baseline directory remains present.
- Updated stale dashboard browser test copy to the actual Quest-first Quiz UI. `node scripts/run-healthclues-review-http-e2e.mjs` then PASS: isolated build (77 routes), review HTTP, ebook funnel, authenticated dashboard profile flow and responsive browser checks. Test database review seeds were restored to 17 `needs_review`/`draft` items by the harness cleanup.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` — PASS: consented profile save/delete, owner isolation, anon denial, activity records and no authenticated profile UPDATE.
- `npm.cmd run secrets:scan` — PASS, 2,274 workspace source files.
- The full browser regression now also opens the branch-specific first question for Sleep, Gout, Healthy Weight and General/Fallback. The game E2E separately selects all eight Quest cards; the current content model shares four topic question branches, so eight independent Quest question banks are not claimed.
- Targeted ESLint over changed files — latest run PASS with zero errors/warnings.
- During repair, three obsolete expected quiz labels were corrected from the prior flat-form quiz to the current Quest-first interface. The final comprehensive review/dashboard runner passed after those corrections.

## Final current continuation verification — 2026-10-28

- `node scripts/run-healthclues-game-e2e.mjs` — PASS after reminder unsubscribe was expanded to cancel failed jobs; the test creates a failed next-day delivery, unsubscribes and verifies its state is `canceled`.
- Latest game E2E also verifies the bounded three-attempt mock retry, no fourth send, stale Catalog version gets HTTP 409, and reminder preferences can save when persisted PostgreSQL time (`HH:mm:ss`) is normalized to the `HH:mm` input format.
- The same run verifies anonymous denial for private GET, POST and Toolkit PATCH routes across World, Check-in, Collection, Toolkit, Knowledge, Journal, Boss, Community, Reminders and Combos; admin and internal-worker authorization checks also remain in the suite.
- Community fixture E2E verifies explicit Usage Method ID sharing and matching for both the owner and follower, alongside Catalog ID matching.
- `node scripts/test-healthclues-world-db.mjs` — PASS after retry migration; RPC grants for queue/dispatch/requeue/mock-fail are checked as service-role only.
- `npm.cmd run build` — PASS after the reminders API change; isolated production build generated 77 routes/pages.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS; isolated build, discovery review APIs, ebook funnel and signed-in responsive dashboard/profile browser checks. Dashboard browser additionally exercises current Sleep, Gout, Healthy Weight and General/Fallback branches. This does not mean each of eight Quests has a distinct branch.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` — PASS.
- `npm.cmd run secrets:scan` — PASS (2,274 files).
- Targeted ESLint — latest run PASS with zero errors/warnings.
- Root `.next/BUILD_ID` and `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` both exist after final canonical build.

V1 remains not complete: no human-reviewed real health content; all-Quest-specific adaptive question content; full endpoint/RLS matrix; comprehensive timezone/frequency boundary cases; and operational diagnostics remain outstanding.

Updated: 2026-10-28

## Latest local/test verification

| Check | Result | Evidence |
|---|---|---|
| Standard Next.js production build | PASS | `npm.cmd run build`; invokes `scripts/build-healthclues-isolated.mjs`, compiles, typechecks and renders 77 generated pages. `App/.tmp/healthclues-build-baseline` and root `.next` artifacts are preserved. |
| Isolated World database tests | PASS | `node scripts/test-healthclues-world-db.mjs`; world creation, reviewed equipment, collection equip/retry idempotency, repeat usage/edit, private note, fixed XP dedupe, elapsed milestone and RLS. Fixture transaction rolls back. |
| Browser game E2E | PASS | `node scripts/run-healthclues-game-e2e.mjs`; 8-Quest selection, 10-question flow/resume, reviewed fixture Catalog, Collection save, equip after World creation with idempotent retry, World persistence, check-in/edit, XP, schedule/pause/resume/replace history, cross-user denial, map region selection/preview/zoom, mobile layout and reload. Synthetic rows cleaned in `finally`. |
| Desktop screenshot | Captured and visually reviewed | `healthclues-world-desktop.png`, 1440px. |
| Alternate region screenshot | Captured and visually reviewed | `healthclues-world-sleep-region-desktop.png`, after selecting Sleep Valley. |
| Mobile screenshot | Captured and visually reviewed | `healthclues-world-mobile.png`, 390px; map remains legible in its swipeable canvas and page has no horizontal overflow. |
| PostgREST RPC schema exposure | PASS | E2E applies the additive migration and restarts only the isolated PostgREST container because `PGRST_DB_CHANNEL_ENABLED=false`; equip RPC is then discoverable and API E2E passes. |

## Investigated failures and repairs

- Root `next build` previously selected `D:\botly\App` as a Next `app` directory because Windows paths are case-insensitive. The baseline at `D:\botly\App\.tmp\healthclues-build-baseline` was not corrupt and is still present; root `D:\botly\.next` is also still present. The standard build command now uses a guarded isolated build root without `App`; the latest full build passed.
- First Collection-equip HTTP test returned `PGRST202`: the isolated PostgREST schema cache was stale because schema notifications were disabled in that test container. E2E now explicitly restarts the isolated container after applying the migration. Retry passed.
- A title-case browser text assertion did not match a CSS-uppercase label. The test now asserts the rendered capitalization. The application UI was rendering correctly.
- A Windows `EPERM` during temporary SQL fixture cleanup once masked the original browser assertion. Cleanup retries and leaves/logs only that owned temp directory if Windows still refuses removal. The subsequent complete E2E passed.

## Prior map visual verification retained

The new continuous illustrated world asset with independent SVG interaction layer remains visually reviewed. The latest E2E regenerated screenshots and verified the active region, map preview and mobile frame. No map renderer or game state was rewritten in this continuation.

## Not tested / not complete

- Knowledge Clues, Knowledge Book, Boss, learning rewards and persistent World unlocks.
- Recipe/Journey Combo member journeys.
- Standalone Journal timeline/edit.
- Community projection, search, follow, Start My Own Journey, revoke, reports and moderation.
- HealthClues reminder scheduler, timezone delivery, mock provider and unsubscribe.
- Full admin reviewer/moderator authorization matrix.
- Complete security/RLS regression for every API and all Master Prompt scenarios.
- Direct root `next build` outside the canonical `npm run build` wrapper. The canonical build is the verified supported command in this workspace.

The passing scenarios use synthetic local fixtures and do not imply approved real health content or production readiness.

## Unified V1 continuation verification — 2026-10-28

- `npm.cmd run build` — PASS after adding Community moderation and content review admin pages/APIs. Next.js 16.3 typecheck and production compilation passed (77 generated pages); the only warning is the repository's pre-existing middleware-to-proxy deprecation. The build wrapper preserves `D:\botly\App\.tmp\healthclues-build-baseline` and root `D:\botly\.next`.
- `node scripts/test-healthclues-world-db.mjs` — PASS with the reminder-queue migration applied to the isolated `botly-healthclues-db-e2e` container; the test confirms queue/dispatch RPC execution is denied to `authenticated` and granted to `service_role`. World/equipment/check-in/knowledge/boss XP/unlock/RLS transaction fixtures roll back.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS on a real local Next server + headless Chrome + isolated Postgres/PostgREST. Coverage includes 8-Quest selection, 10-question quiz/resume, Catalog recommendations, Recipe Method+ingredients, Journey Combo partial selection/replacement, Collection save/equip, Community search/follow/Start Own/report/revoke, moderator queue/action, Daily Check-in edit and fixed XP, Knowledge discovery/question/Book, private Journal create/edit/cross-user isolation, Boss wrong answer/retry/victory/reward/unlock reload, and desktop/mobile map.
- Latest E2E also moves only reserved `hc-test-*` Clue/Boss fixture rows to `needs_review`, verifies publish is denied without reviewer confirmation, publishes the synthetic rows with explicit test reviewer confirmation, and verifies persisted review status plus audit entry. Test fixtures and their audit rows are removed in cleanup.
- Latest browser run clicks and records all eight distinct Quest choices, verifies the under-18 stop before profile creation, then resumes the adult Eat Healthier flow through all ten onboarding questions.
- Reminder E2E verifies explicit opt-in consent, Asia/Bangkok local schedule, opted-out exclusion, mock-only dispatch, idempotent same-day rerun, generic delivery history, unsubscribe preventing later queueing, and browser UI save/pause/resume/unsubscribe. No email provider is invoked.
- Admin E2E verifies unauthenticated rejection, authorized content queue loading, community report queue and a moderation status/audit action. It does not approve or publish medical content.
- Screenshots captured: `healthclues-reminders-desktop.png`, `healthclues-admin-moderation-desktop.png`, `healthclues-admin-content-review-desktop.png`, plus map desktop/mobile/region, Boss victory, equipment, quiz and community screenshots. New reminder/admin screenshots were visually inspected.
- Targeted ESLint on the changed HealthClues UI/API/admin files — PASS (zero errors/warnings).
- `npm.cmd run secrets:scan` — PASS (2,273 workspace source files scanned).
- Remaining gaps: Catalog decision mutation and reject/deactivate paths are not covered; reminder failure/retry path is not simulated by the deterministic mock provider; all eight adaptive quiz branches and all security/RLS endpoints are not exhaustively covered; no human-approved real Catalog/Knowledge/Boss corpus is present. Therefore no V1 COMPLETE or production-ready claim is made.

## Continuation verification — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS after Knowledge migration: clue topic eligibility, idempotent discovery and answer attempts, wrong/correct response, XP dedupe, private answer-key SELECT denied, owner-only Book and existing World/Toolkit/RLS checks.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after Knowledge and Journal changes: Knowledge discovery, wrong-answer explanation, correct response and persisted Book; Journal create/edit and cross-user API denial; browser saves a Journal note and reloads it; existing 8 Quest/10 question quiz, equipment, map interaction, check-in, toolkit history, desktop/mobile and reload checks.
- The standard isolated Next build is part of the browser E2E setup and passed TypeScript/production compilation before the test server started.
- Latest screenshot outputs: `healthclues-world-desktop.png`, `healthclues-world-sleep-region-desktop.png`, `healthclues-world-mobile.png`, plus quiz/equipment screenshots. See `App/reports/`.
- Scope remains local/test. No production database, deployment, credentials, or email delivery was touched.
- Remaining significant gaps: boss, World evolution unlocks, combos, Community, reminder scheduler, admin Clue review/moderation and full security matrix. V1 is not release-ready.

## Boss and World Evolution verification — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS: reviewer-gated Boss challenge, wrong answer, correct answer, idempotent reward replay and one persisted per-World unlock; fixture transaction rolled back.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS: API verifies no answer-key leak, wrong-answer retry, Boss clear/reward retry and persisted unlock; browser performs nutrition Boss wrong/correct sequence, confirms reward animation, reloads, and sees cleared checkpoint + PATH OPEN overlay.
- `npm.cmd run build` — PASS on the isolated build root: Next 16.3 compiles, TypeScript passes, and all 75 static pages generate. The baseline and root `.next` remain preserved. Only existing middleware deprecation warning was emitted.
- Screenshots: `healthclues-boss-victory-desktop.png`, `healthclues-world-desktop.png`, `healthclues-world-sleep-region-desktop.png`, `healthclues-world-mobile.png`. Visual review confirms the saved unlock appears over the illustrated world; mobile remains a swipeable map/list experience.
- No real reviewed Boss content exists yet; all Boss fixture content is non-medical and confined to the local isolated tests.

## Combo flow verification — 2026-10-28

- `node scripts/run-healthclues-game-e2e.mjs` — PASS: isolated reviewed three-slot Journey Combo appears for the member; the browser accepts one optional piece, replaces it with another reviewed item in the same slot, saves only that selected replacement to My Collection and verifies the exact catalog ID persisted. The item remains unequipped until the separate Collection equip action. Existing Boss/Knowledge/Journal/check-in/map/mobile E2E still passes.
- The E2E screenshot `healthclues-world-desktop.png` visually includes the Journey Combo component chooser, saved Collection item, Knowledge Book, private Journal, Boss and illustrated World. Synthetic fixture rows are deleted during cleanup.
- Recipe combo/method query paths are implemented but need their own fixture-backed E2E; admin authoring/review for these definitions is not present.

## Recipe Combo and fixture isolation — 2026-10-28

- `node scripts/run-healthclues-game-e2e.mjs` — PASS: fixture-backed Recipe Combo links the base Catalog item to its reviewed Method and ingredient Catalog ID; API returns versioned steps and safety details; browser shows the preparation steps and safety note. Journey Combo explicitly accepted one optional component, selected a reviewed same-slot replacement, and persisted that individual item in My Collection without equipping it.
- The isolated E2E startup now removes only prior rows carrying the `test-fixture` marker and `hc-test-*` identifiers, in FK-safe order, plus prior `hc-game-*` member accounts. This prevents old synthetic Clues from changing deterministic daily selection. No non-fixture content is targeted.
- Latest desktop screenshot shows the Recipe Method, Journey Combo chooser, World, Collection, Knowledge Book, Journal and Boss together. Map screenshots are still captured at 1440px and 390px plus selected region and Boss victory.

## Latest isolated reminder/API regression — 2026-10-28

- `node scripts/run-healthclues-game-e2e.mjs` — PASS after adding invalid schedule coverage. The API rejects malformed timezone identifiers, impossible local-time values and unsupported frequencies with HTTP 400; opting in without explicit consent returns HTTP 422.
- Same run reverified local daily/weekly schedule boundaries, retry success, three-attempt exhaustion, cancellation on unsubscribe, deduplication, Community Usage Method ID search by owner and follower, and the full local browser game flow. All delivery uses the mock provider.
- `npx.cmd eslint scripts/run-healthclues-game-e2e.mjs` — PASS; `git diff --check` on changed source, migration and test files — PASS.
- Still incomplete: exhaustive authenticated mutation/RLS policies, age/consent and all unique Quest branch coverage, admin authoring for Methods/Combos, and a human-reviewed real health content corpus.

## Latest comprehensive regression — 2026-10-28

- `npm.cmd run build` — PASS; isolated Next.js 16.3 production build, TypeScript and 77 routes. Both `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` remain present.
- `node scripts/test-healthclues-world-db.mjs` — PASS; isolated PostgreSQL idempotency, RLS, reviewed-content gates, XP/rewards, World unlocks and service-role-only reminder functions.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS; isolated review build/server, HealthClues review APIs, ebook funnel, signed-in dashboard/profile and responsive browser checks.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` — PASS; profile consent/save/delete, check-in history, anonymous denial, cross-user isolation and no authenticated direct UPDATE. One initial run hit a transient Docker access denial; the retry passed without policy changes.
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (34 assertions).

## Eight-Quest adaptive quiz verification — 2026-10-28

- Added Quest-specific preference question groups. The HealthClues signed-in browser E2E passed and checks the opening adaptive question for all eight Quest routes, including concern selection for the Health Concern route.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after the Quiz/profile matcher change; full core game, Community, mock reminders, admin, Boss and World flow, responsive interactions and screenshot capture passed with synthetic fixtures.
- Canonical `npm.cmd run build` — PASS (Next.js 16.3; 77 routes; TypeScript pass; baseline and root `.next` preserved).
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions), including Calm activity, Nutrition recipe and Natural Wellness research preference matching.
- Targeted ESLint, quiz bank JSON parsing and changed-file `git diff --check` — PASS.
- Remaining Quiz coverage includes wider age/safety/consent and guest/account persistence permutations; no unique medical knowledge was authored.

## Admin credential separation and diagnostics — 2026-10-28

- Game E2E passes with independent reviewer and moderator tokens; verifies each role is denied the other role's queue and legacy `EBOOK_ADMIN_TOKEN` is denied both HealthClues APIs.
- Diagnostics API returns exact aggregate queue counts and timestamp only; E2E confirms reviewer access, legacy-token denial and five rendered UI counters. Captured `App/reports/healthclues-admin-diagnostics-desktop.png`.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after changes, with synthetic fixtures cleaned and email provider mock-only.
- `npm.cmd run build` — PASS, Next.js 16.3 and 78 routes, with baseline and root `.next` preserved.
- Targeted ESLint and changed-file `git diff --check` — PASS.

## Populated cross-owner RLS regression — 2026-10-28

- Expanded the isolated Postgres DB suite to create rows for both members in World, branch, journey, Collection, Toolkit, check-in/usage, Journal, personal tools, catalog proposals, XP, Knowledge Book/attempts, Boss attempts/clears and unlocks before impersonating member A.
- Member A sees owned World/Journal/Knowledge/proposal rows and zero rows for actual member B records across the checked tables. Client mutation grants for XP/rewards/check-ins/usage/Community moderation/reminder delivery and private answer-key reads are denied. Catalog proposal insert remains permitted under owner RLS.
- `node scripts/test-healthclues-world-db.mjs` — PASS; transaction and user fixtures roll back. This strengthens per-table isolation evidence but does not exhaust every table/mutation/RPC combination.
- Latest game E2E also passes API-level cross-user checks for World, Collection, check-in detail, Toolkit mutation, Journal, Knowledge Book, Boss and Reminder delivery history. Member B has independent failed reminder rows while the member A response remains owner-scoped and omits account IDs.

## Resume regression � 2026-10-28

- `node scripts/run-healthclues-game-e2e.mjs` � PASS, including new checks that the Clue reviewer and community moderator are recorded as separate role identities in their audit rows. Full test-only game, reminder-mock, community, admin, persistence, reload, desktop/mobile and screenshot scenarios passed; synthetic fixtures were cleaned.
- `node scripts/test-healthclues-world-db.mjs` � PASS; populated cross-user RLS, protected writes/answer keys, idempotency, rewards, unlocks and rollback.
- `npm.cmd run build` � PASS; isolated Next.js 16.3 production build with 78 routes. Preserved the original baseline and root `.next` artifacts.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` � PASS.
- `node scripts/run-healthclues-review-http-e2e.mjs` � PASS; review/dashboard, ebook funnel and responsive browser regression. Isolated candidate cleanup passed.
- `node scripts/test-healthclues-discovery-matching.mjs` � PASS (37 assertions); targeted ESLint, diff check and workspace secret scan (2,276 files) � PASS.
- Remaining: human-reviewed real content, reward configuration/admin authoring, and exhaustive per-table/per-operation authorization coverage. No production actions or real email.

## Admin boundary regression � 2026-10-28

- Identified and repaired legacy shared-token access to the HealthClues Quiz internal-note preview. `/api/admin/healthclues-quiz` now accepts only `HEALTHCLUES_REVIEWER_TOKEN`; legacy Botly admin gets 401 and the reviewer receives the question bank including reviewer notes.
- `npx.cmd eslint src/app/api/admin/healthclues-quiz/route.ts src/app/admin/healthclues-quiz-preview/page.tsx scripts/run-healthclues-game-e2e.mjs` � PASS.
- `node scripts/run-healthclues-game-e2e.mjs` � PASS with explicit old-token denial/new-reviewer access checks plus all previously described local game flows.
- `npm.cmd run build` � PASS afterward, isolated Next.js 16.3 production build, 78 routes, baseline and root `.next` preserved.
- Follow-up `node scripts/run-healthclues-review-http-e2e.mjs` � PASS after updating its unconfigured reviewer expectation to 503. Ebook funnel, HealthClues dashboard/profile/review browser checks and cleanup all passed. One non-fatal Next stream-close diagnostic appeared during teardown; runner exit code was 0.

## Admin Method/Combo authoring and review � 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` � PASS with `20261028150000_healthclues_admin_drafts.sql`; Postgres accepted the atomic draft RPC and verified execution is denied to authenticated clients but granted to service_role.
- Targeted ESLint and `git diff --check` � PASS for new authoring/review routes, UI, migration and game E2E.
- `node scripts/run-healthclues-game-e2e.mjs` � PASS after adding reviewer draft creation, DB persistence, audit rows, invalid slot rejection, queue visibility, missing confirmation denial, publication dependency checks, published-only player API visibility, authoring UI loading, and screenshot capture. The run also passed existing game/Community/mock-reminder/Boss/check-in/mobile flows and cleaned synthetic rows.
- `npm.cmd run build` � PASS; isolated Next.js 16.3 production build, TypeScript, 79 routes. Existing baseline and root `.next` artifacts were preserved.
- Screenshot `healthclues-admin-authoring-desktop.png` reviewed. Email stayed mock-only; no production action.
- Remains unverified/incomplete: revise existing content versions in Admin, reward configuration, exhaustive security/RLS per endpoint and reviewer-approved real Catalog/Clue/Boss data.

## Authoritative resume run — 2026-10-28
- `node scripts/test-healthclues-world-db.mjs` — PASS on isolated Postgres after Method/Combo authoring and reward-configuration migrations. Confirms owner isolation, equip/knowledge/Boss idempotency, XP/reward protected writes, reminder service-role grants, approved-content gates and rollback.
- Current canonical `npm.cmd run build` — Next child exited and produced `.tmp/healthclues-build-*/.next/BUILD_ID`; root `.next/BUILD_ID` and `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` remain present. Capturing wrapper process exit is still pending; do not claim build PASS until the wrapper exits successfully.
- Current `node scripts/run-healthclues-game-e2e.mjs` — IN PROGRESS; record result after process exit and inspect regenerated screenshots.
- New tested scope: reviewer-only Method/Recipe Combo/Journey Combo draft authoring and explicit publish, plus five configured milestone reward title/active settings with optimistic version check, audit and no XP formula mutation. Screenshots: `healthclues-admin-authoring-desktop.png`, `healthclues-admin-rewards-desktop.png`.
- Human-approved real Catalog/Clue/Boss corpus is still absent; test content is synthetic and non-medical. This is a real release blocker, not a passing content gate.
- No production database, deployment, production credential changes or live email.
## Latest authoritative verification — 2026-10-28
- `npm.cmd run build` — PASS (final code after Quest animation/lint repair); isolated Next.js 16.3 build, TypeScript and 80 routes; wrapper exit code 0. The existing `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` were both verified present.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS on isolated Next/Postgres/PostgREST/headless Chrome. Covers guest intro, eight Quests, adult 10-question Quiz/resume and underage stop, reviewed fixture Catalog, Recipe/Journey Combos, Collection save/equip, Community search/follow/Start Own/report/revoke/moderation and owner isolation, reminder consent/timezone/mock scheduling/retry/dedupe/pause/resume/unsubscribe, World/check-in/edit/XP, Knowledge clue/question/Book, private Journal, Boss wrong answer/retry/victory/reward/unlock persistence, toolkit event history, admin queues/authoring/reward settings and reload. Desktop/mobile/map-region/Boss/admin screenshots generated; synthetic fixtures cleaned.
- `node scripts/test-healthclues-world-db.mjs` — PASS; isolated Postgres constraints/RLS/privileges/idempotency and fixture rollback.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS; isolated build, review API/audit, dashboard/profile, ebook funnel and responsive browser regression; cleanup restored 17 static candidates to `needs_review`/`draft` with no active test item.
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` — PASS.
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions).
- Targeted HealthClues ESLint — PASS with zero findings; final `git diff --check` — PASS (Git only printed existing line-ending advisories).
- `npm.cmd run secrets:scan` — PASS (2,282 files).
- Visual review opened the regenerated desktop/mobile World screens, Quest picker, and Boss victory screenshot. The illustration remains the hero and the map controls/content are responsive.
- The only build warning is existing Next middleware convention deprecation. No production mutation, deployment, credential change or real email.
- V1 remains NOT COMPLETE: reviewer-approved real Catalog/Clue/Boss content is a human review blocker; age/consent/account permutations, exhaustive RLS mutation matrix, Quiz authoring/version edits and full reward cosmetics remain incomplete/partial.
## Resume continuation — 2026-10-28 (current execution)

- `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 80 pages); canonical isolated build wrapper exited 0. Existing `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` were verified present after build. Baseline file timestamp/content were unchanged.
- `node scripts/test-healthclues-quiz-safety.mjs` — PASS, 35 assertions.
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS, 37 assertions.
- Targeted `npx.cmd eslint` on changed route and scripts — PASS with no findings. `git diff --check` — PASS, with Git line-ending advisories only.
- New security correction: HealthClues discoveries review route now uses `HEALTHCLUES_REVIEWER_TOKEN`, not shared `EBOOK_ADMIN_TOKEN`; audit rows use the dedicated reviewer identity. Added migration `20261028170000_healthclues_discovery_reviewer_boundary.sql`, plus test-runner and HTTP/DB assertions for legacy-token denial, reviewer-only access, audit identity, and RPC grants.
- `node scripts/test-healthclues-world-db.mjs` — BLOCKED before test setup: `docker inspect botly-healthclues-db-e2e` denied by sandbox (`npipe:////./pipe/docker_engine` permission denied). The reviewer-boundary migration was not applied in this run.
- `node scripts/run-healthclues-review-http-e2e.mjs` — NOT RUN because it has the same required Docker dependency. The expanded DB/HTTP changes remain implemented but unverified. Earlier report PASSes apply to earlier code only.
- No production database, deployment, credentials, or real email were used. V1 remains NOT COMPLETE / NOT READY; human-reviewed real Catalog/Clue/Boss content and remaining auth/RLS/authoring breadth are still outstanding.
- `npm.cmd run secrets:scan` — PASS (2,284 source files; after reviewer-boundary changes).

## Latest authoritative rerun — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS after applying the dedicated discovery-reviewer migration to the isolated `botly_restore_verification` database. It asserts authenticated role denial, service-role allowance, new reviewer actor identity, populated cross-user ownership boundaries and rolls back test fixtures.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS (exit 0). Verified discovery legacy-token denial, reviewer-token success, reviewer audit identity, Quiz reviewer success, ebook funnel, dashboard/profile and browser review queue. E2E restored 17 static candidates to `needs_review`/`draft`, with no active content left.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS (exit 0) after adding a post-hydration reviewer-token form assertion. Full gameplay/Community/mock-email/admin/mobile suite passed; synthetic rows cleaned.
- `npm.cmd run build` — PASS after final changes: Next.js 16.3, TypeScript, 80 routes; isolated wrapper exited 0. The original `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` and root `.next/BUILD_ID` remain present. Baseline file timestamp remained unchanged.
- Targeted ESLint — PASS, zero findings. `git diff --check` — PASS with existing line-ending notices. Secret scan — PASS (2,284 files).
- Reviewed `App/reports/healthclues-admin-content-review-desktop.png` after regeneration. UI clearly shows the dedicated reviewer gate and test review queue.
- Initial reruns exposed and then fixed: assertion expecting PostgreSQL `position()` to equal 1 rather than any positive offset; runner applying the table-owner migration as the wrong role; browser harness entering legacy admin token for discovery review; and a hydration race in the game admin form. The final runs above include those fixes.
- V1 remains NOT COMPLETE / NOT READY: human-reviewed real health content is absent; the broad RLS/authenticated mutation matrix and some age/consent/account permutations remain incomplete; Quiz question authoring/version management is read-only/unimplemented; cosmetic reward breadth is limited.
- No production DB, deploy, production credentials or real email was used. Reminder delivery was mock-only.

## Quiz bank repair and full game regression — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS after adding versioned Quiz bank draft/publish, optimistic version checking, reviewer audit, and service-role-only RPC assertions.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS. The first rerun exposed that the Quiz Admin reviewer projection omitted five adaptive branch families; after using all 96 canonical questions and merging retained reviewer notes, the full game E2E passed. It covers onboarding/resume, all eight Quests, recommendations, Combos, Collection/equipment, check-in/XP, Knowledge/Journal, Boss retry/reward/world unlock, Community, mock reminders, admin review, and responsive map interactions.
- Dashboard browser suite printed PASS after exercising first-question routing for all eight Quest branches against the published 96-question bank; Quiz Admin UI edited and saved a reviewer-only draft while live player content stayed on the prior published version.
- `npm.cmd run build` — PASS; isolated Next 16.3 production build, TypeScript, and 79 generated pages. `App/.tmp/healthclues-build-baseline` and root `.next` preserved.
- Targeted ESLint and `git diff --check` — PASS; Git emitted existing line-ending advisories only.
- `node scripts/run-healthclues-review-http-e2e.mjs` — NOT VERIFIED as a passing process: child suite logged PASS and both data snapshots restored, but the outer runner returned exit code 1 with no parent error visible in the captured output. This needs a clean diagnostic rerun before claiming that runner passes.
- Screenshots regenerated under `App/reports/`; the latest `healthclues-world-desktop.png` was opened and confirms the illustrated map remains the hero of the world page. No map renderer changes were made.
- No real health content was approved, no real email was sent, and no production resource was changed.

### Review runner rerun clarification — 2026-10-28

A foreground rerun of `node scripts/run-healthclues-review-http-e2e.mjs` completed with exit code 0. The isolated build, review/API suite, dashboard browser suite, and ebook funnel passed; cleanup restored all 17 static candidates to pending state and exactly restored the pre-run Quiz versions/audit snapshot. The earlier redirected invocation's exit code 1 was not reproduced.

Status correction: any earlier dated passage in this report that calls Quiz Admin a read-only preview or says adaptive branch coverage is absent is historical and superseded by the Quiz bank repair and foreground review-runner pass above. Current Quiz authoring/version checks and all eight branch starts are verified. Broader age/consent and authenticated security coverage remain incomplete.

## RLS inventory and anonymous grant matrix — current run

- Extended `scripts/test-healthclues-world-db.mjs` to assert every ordinary `public.healthclues_*` table has RLS enabled.
- The same isolated SQL transaction checks anon cannot directly SELECT private profile/discovery/review, game progress, journal/check-in, Community projection, XP/reward/reminder, answer-key, audit, or Quiz reviewer tables; it verifies explicit anon SELECT grants only on the approved-content table surfaces.
- `node scripts/test-healthclues-world-db.mjs` — PASS; populated owner-isolation assertions and all existing idempotency/reward checks also passed with rollback.
- `node --check scripts/test-healthclues-world-db.mjs` and `npx.cmd eslint scripts/test-healthclues-world-db.mjs` — PASS.
- Authenticated mutation edge cases and route-level role combinations remain incomplete.

- Added authenticated positive/negative mutation checks: owner edits to their own World and private Journal each affect one row; attempts targeting the second user's rows affect zero rows. `node scripts/test-healthclues-world-db.mjs`, `node --check`, and targeted ESLint all PASS after this addition.

## Game E2E cleanup integrity and rerun — 2026-10-28

- Database audit discovered older generated `hc-test-*` rows persisted despite earlier runner PASS output; final cleanup errors were swallowed, and Method component/version FKs blocked fixture deletion.
- Corrected cleanup order, surfaced cleanup failures, and added a zero-residue postcondition. Moderator browser login also now waits for hydration and verifies the entered credential before submit.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; full gameplay/admin/mobile suite passed and cleanup verified no generated content fixture remains.
- Direct read-only query after E2E — PASS: zero reserved Catalog/Method/Clue/Boss rows and test accounts remain. Zero currently published reviewed Catalog, Clue and Boss rows in the isolated test database.
- `node scripts/test-healthclues-world-db.mjs` — PASS after E2E; all-table RLS, anonymous grant allowlist, populated owner isolation, owner-vs-cross-owner World/Journal edits, reward, check-in, knowledge, Boss and idempotency assertions passed.
- Targeted ESLint, Node syntax check and `git diff --check` — PASS; only pre-existing Git line-ending advisories.
- This run improves isolation integrity. It does not clear the human-reviewed content gate; test fixtures remain synthetic and are now confirmed removed after runs.

## 2026-10-28 — Source-linked review draft import

- Applied `20261028190000_healthclues_boss_source_references.sql` to the isolated E2E database via the game and review runners; it adds Boss source references and a service-role-only, idempotent, audited import RPC.
- World DB/RLS suite: PASS, including permission boundary assertion for the import RPC.
- Game browser E2E: PASS, including reviewer import, six pending/unpublished candidates, second-call idempotency, anonymous exclusion, Boss publication validation, world/game interactions, and fixture cleanup.
- Review/dashboard HTTP/browser E2E: PASS, exit 0; catalog and Quiz snapshots restored.
- Changed-file ESLint: PASS. Full repository lint command is not a valid signal in this checkout because it traverses generated `.next-healthclues-build-20261027` and unrelated existing errors.
- Canonical isolated `npm.cmd run build`: result pending at report write time; update after completion.
- No real health content was approved or published. Six source-linked records remain pending human review in the isolated test DB. No production DB, deploy, credentials, or real email touched.
- Canonical `npm.cmd run build` — PASS, exit 0 (isolated Next.js 16.3 build, TypeScript, 79 statically generated pages). Root `.next/BUILD_ID` and `App/.tmp/healthclues-build-baseline/.next/BUILD_ID` remain present.
- Direct isolated DB verification: 3 pending Clues + 3 pending Bosses, 3 private Clue answer keys + 3 private Boss answer keys (`3|3|3|3`). All challenge content remains unpublished/unreviewed.
- Visually inspected E2E-captured `App/reports/healthclues-admin-content-review-desktop.png`, which shows the reviewer import control and six source-based review drafts in the queue.

## Follow-up security assertions — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` PASS after adding a transactional invalid-source test. The approved service role rejects `https://example.invalid/` and leaves no Boss row; fixtures roll back.
- `node scripts/run-healthclues-game-e2e.mjs` PASS after adding API assertions that moderator and legacy Botly admin tokens cannot import reviewer content. Full gameplay, admin flow, screenshot capture and synthetic fixture cleanup passed.
- Changed-file ESLint, test-script syntax checks and diff check pass. Canonical Next production build pass is recorded above.
- Final-code regression: Quiz safety PASS (35 assertions), discovery matching PASS (37 assertions), profile/activity REST E2E PASS (owner isolation, consented deletion, check-in persistence, anon/cross-user denial).
- Required next human step for release readiness: a qualified reviewer evaluates the six private, unpublished records in `/admin/healthclues-content`. No code path auto-approves them.

## Persisted Day 60 World evolution — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` PASS: Day 60 creates the owner/world-scoped `knowledge-library-open` unlock and `journey-milestone-60` reward once.
- Full game browser E2E PASS: signed-in member's persisted unlock is present in the browser's fresh post-reload World API response and the interactive map renders the Knowledge Library landmark. Desktop/mobile screenshots were regenerated and reviewed.
- Review/dashboard HTTP/browser E2E PASS (exit 0), with isolated content and Quiz snapshots restored.
- Canonical isolated `npm.cmd run build` PASS (Next.js 16.3, TypeScript, 79 static pages); both existing root build artifact and preserved App build baseline remain intact.
- Changed-file ESLint, Node syntax checks, and diff check PASS. No production DB/deploy/email used.

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

## Boss cosmetic reward reviewer configuration - 2026-10-28

- node scripts/test-healthclues-world-db.mjs - PASS after applying 20261028220000_healthclues_cosmetic_reward_configuration.sql; DB fixtures rolled back.
- node scripts/run-healthclues-game-e2e.mjs - PASS, exit 0. Reviewer disabled and restored an allowlisted Boss keepsake; admin UI showed five milestones and four cosmetics. Full onboarding, equipment, World, check-in, Knowledge Book, Boss retry/victory, rewards, Community, mock reminders, admin review, responsive interactions and fixture cleanup passed.
- node scripts/run-healthclues-review-http-e2e.mjs - PASS, exit 0; dashboard/review browser checks, ebook regression and exact content/Quiz snapshot restoration passed. The early-closed destination stream log was non-fatal; all assertions and cleanup completed.
- npm.cmd run build - PASS, isolated Next.js 16.3 production build, TypeScript and 79 static pages. Existing root and App/.tmp/healthclues-build-baseline build IDs remained present.
- Quiz safety PASS (38 assertions); discovery matching PASS (37); profile/activity REST E2E PASS (owner isolation, consented save/delete, check-ins, anonymous denial).
- Changed-file ESLint, runner syntax checks and git diff --check PASS. Browser screenshot healthclues-admin-rewards-desktop.png was opened and reviewed.
- Tests used isolated/local test services and mock email only. No production changes. Qualified content review remains pending.
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
## Final continuation rerun — 2026-10-28

- `node scripts/test-healthclues-quiz-safety.mjs` — PASS (38 assertions).
- `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions).
- `node scripts/test-healthclues-profile-activity-rest-e2e.mjs` — PASS (owner-only profile, consented save/delete, check-in history, anonymous denial, cross-user isolation, and no authenticated profile UPDATE).
- `node scripts/test-healthclues-world-db.mjs` — PASS; isolated PostgreSQL RLS/grant, idempotency, currencies/rewards and progression fixtures rolled back.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; complete gameplay, Community, mock reminders, admin/reviewer, reload, responsive interactions, screenshot capture and synthetic fixture cleanup.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, exit 0; HealthClues review/dashboard browser and HTTP checks, ebook regression and snapshot restoration passed.
- `npm.cmd run build` — PASS, exit 0; isolated Next.js 16.3 build, TypeScript and 79 pages. Wrapper confirmed existing baseline and root `.next` artifacts were preserved. Next.js printed its existing middleware-to-proxy deprecation warning.
- No production services or real email used. Human review of real Catalog/Clue/Boss content and exhaustive authorization matrix remain release blockers; no V1 completion claim.
## Expanded cross-owner database security probe — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS. The fixture now asserts actual rows exist for 27 private owner data families, then runs authenticated member A SELECT/UPDATE/DELETE attempts against member B rows inside a rollback-only PostgreSQL transaction. It fails if a foreign row is visible or changed/removed; direct-mutation privilege denials are accepted as the intended boundary. Existing positive owner-write, protected grant, RLS, idempotency and progression assertions also pass.
- `node --check scripts/test-healthclues-world-db.mjs` — PASS.
- `npx.cmd eslint scripts/test-healthclues-world-db.mjs` — PASS.
- One invocation was blocked before DB startup by a transient Docker named-pipe permission error. The Docker daemon and isolated DB were confirmed healthy immediately afterward, and the final unchanged suite passed. No production service was used.
## Admin anonymous-route regression — 2026-10-28

- The full game E2E now verifies anonymous GET requests return 401 for all seven HealthClues Admin APIs: Quiz, discoveries, Community, content, authoring, diagnostics and rewards.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS, exit 0; gameplay, admin role checks, Community, mocked reminders, responsive browser interaction, screenshot capture and generated fixture cleanup passed.
- `node --check scripts/run-healthclues-game-e2e.mjs` — PASS; `npx.cmd eslint scripts/run-healthclues-game-e2e.mjs` — PASS.
- Test-runner-only change; no production systems or real email used.
## Admin credential/role matrix regression — 2026-10-28

- Full game browser/API E2E PASS after adding unauthenticated, ordinary member, legacy Botly admin, reviewer, and moderator role assertions across all seven HealthClues Admin routes. All seven deny anonymous/member/legacy-admin access; reviewer-only routes deny the moderator; Community denies the reviewer; reviewer and moderator diagnostics return aggregate-only fields. Existing reviewer/moderator permitted actions and Community flow pass.
- `node --check scripts/run-healthclues-game-e2e.mjs` and `npx.cmd eslint scripts/run-healthclues-game-e2e.mjs` — PASS.
- Isolated synthetic fixtures were cleaned; no production service or real email used.
## Server-owned RPC and protected-content grants — 2026-10-28

- Isolated DB/RLS suite PASS with a 17-function privilege audit: all World/check-in/Toolkit/Knowledge/Boss/reward/reminder/reviewer RPCs exist; anon and authenticated cannot execute them; service_role can.
- Same suite PASS with direct DML assertions for 17 reviewed-content, answer-key, reward-config, Quiz-admin and audit tables: authenticated INSERT/UPDATE/DELETE grants are absent.
- Read-only count on isolated test DB: active/reviewed Catalog = 0, published/reviewed Clues = 0, published/reviewed Bosses = 0. Synthetic E2E content is not counted or promoted as approved content.
- `node --check`, `npx.cmd eslint scripts/test-healthclues-world-db.mjs`, and `git diff --check` — PASS; Git only reported existing line-ending advisories.
## Automated RLS grant/policy consistency — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS. New catalog-driven invariant enumerates all `healthclues_*` tables with RLS and all anon/authenticated SELECT/INSERT/UPDATE/DELETE grants, then requires a matching role and command policy. Zero violations found in current isolated schema.
- The same run passes populated cross-owner read/update/delete probes for 27 row families, 17 service-only RPC privileges, 17 protected content/admin/audit tables with no authenticated DML grants, and existing functional/rollback assertions.
- `node --check scripts/test-healthclues-world-db.mjs`, targeted ESLint and `git diff --check` — PASS (line-ending advisories only).
## Reminder consent renewal regression — 2026-10-28

- `node scripts/test-healthclues-world-db.mjs` — PASS; isolated rollback fixtures, World/Collection/Toolkit, Check-in/XP, Knowledge/Boss rewards, persisted unlocks, approved-content gates, answer-key isolation, reminder worker privileges and RLS checks passed.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS after adding unsubscribe/re-consent checks. The test confirmed opt-out state, a new `consented_at` on confirmed re-opt-in, final unsubscribe, no future queue, and no generated content fixtures left behind. This run also exercised onboarding, Combos, Collection/Toolkit, Community, check-in/Journal, Knowledge/Boss, Admin and mobile/desktop interactions.
- An initial E2E run reached all reminder assertions but failed at Admin diagnostics because the test inserted reviewer credentials before client hydration. The test now waits and asserts the input value; the subsequent full run passed.
- `npm.cmd run build` — PASS (Next.js 16.3, TypeScript, 79 pages); isolated build reports pre-existing root `.next` and baseline preserved. `node --check scripts/run-healthclues-game-e2e.mjs`; targeted ESLint on the reminder route and E2E runner — PASS.
- No production database, deployment, credentials or real email used. Health-content review remains a qualified-human gate.
- Additional regressions after the change: `node scripts/test-healthclues-quiz-safety.mjs` — PASS (38 assertions); `node scripts/test-healthclues-discovery-matching.mjs` — PASS (37 assertions); `node scripts/run-healthclues-review-http-e2e.mjs` — PASS, including isolated build, Ebook regression, profile/check-in/history/deletion, admin review/audit, responsive browser checks, and restoration of 17 candidate states plus the prior Quiz bank version/audit state.
- Actual reviewer diagnostics screenshot refreshed at `App/reports/healthclues-admin-diagnostics-desktop.png` and inspected; it shows five aggregate counters and no user-specific records.

## Authenticated owner-spoof insertion and transfer probes — 2026-10-28

- The isolated PostgreSQL test attempts eight forged writes as authenticated member A: insert rows claiming member B for personal tools, Catalog proposals, discovery activity, Collection, Follow and Community reports; transfer A-owned personal tool and proposal rows to B. Each attempted cross-owner write must be rejected by RLS.
- `node scripts/test-healthclues-world-db.mjs` — PASS after correcting the Collection fixture to its actual schema (catalog item IDs have no version column in the Collection table). The run rolled back all synthetic rows. `node --check`, targeted ESLint and `git diff --check` — PASS.

## Account deletion lifecycle regression - 2026-10-28

- Isolated DB/RLS suite PASS for request lock, cancellation, future purge, data removal, anonymized audit and preservation of another member's data.
- Full browser game E2E PASS. It covers the account privacy page and API, immediate private access lock, RLS lock, share revocation, queued email job cancellation, recovery cancellation without consent restoration, a second request and token-authenticated purge. Cleanup verifies there are no generated content or deletion-audit fixtures left.
- The first gameplay run surfaced a teardown-only FK/check-constraint issue: an earlier canceled deletion record could not be implicitly anonymized during synthetic auth-user cleanup. Runner cleanup now removes only the exact synthetic deletion audit and any deletion requests for its synthetic accounts before auth cleanup; stale test cleanup does the same by the isolated test email prefix. Retest PASS.
- Review/dashboard HTTP/browser E2E PASS, including account deletion UI/API, admin review/audit, check-in history, return visit and responsive layout. Ebook and static-candidate/Quiz snapshot cleanup passed.
- Quiz safety PASS (38 assertions); discovery matching PASS (37 assertions); profile/activity REST E2E PASS (owner-only profile, consented save/delete, check-in, skipped action, anonymous denial and cross-user isolation).
- Isolated Next.js 16.3 build PASS: compile, TypeScript and 79 generated routes. A framework deprecation warning remains for the existing middleware convention; it did not fail the build.
- Retention dates (30-day recovery, 60-day primary purge) are a proposed implementation and require privacy approval. No production systems or real email were used.

## Final privacy-panel lint and build verification - 2026-10-28

- Targeted ESLint initially found a synchronous effect-state pattern in HealthCluesDataControls. Refactored the request-status load into a cancellation-safe async effect; targeted ESLint then passed with no findings.
- Reran node scripts/run-healthclues-game-e2e.mjs after the component change: PASS, including privacy-page rendering, full gameplay, deletion request/recovery/purge, and isolated fixture cleanup.
- Reran npm.cmd run build after the component change: PASS, Next.js 16.3, TypeScript and 79 routes. The isolated build wrapper reported the existing baseline and root .next artifacts preserved.
- Opened App/reports/healthclues-account-privacy-desktop.png: deletion controls and their recovery/purge explanation render clearly in the real account page. Latest gameplay screenshots remain in App/reports/.
- The only build note is Next.js's existing middleware-to-proxy deprecation warning; it is non-fatal and unrelated to HealthClues. Release remains gated on qualified health-content approval and privacy/retention sign-off.
- Follow-up mobile privacy visual QA: the full game browser E2E now also checks no page-level horizontal overflow at 390px and captures healthclues-account-privacy-mobile.png. The real screenshot was opened and inspected; cards stack cleanly, text wraps, controls remain visible, and the page stays within the viewport.

## Adaptive Quiz branch mapping regression - 2026-10-28

- Added a focused regression over the actual adaptive branch resolver and checked its IDs against the current quiz bank for Sleep Better, Feel Calmer, More Energy, Eat Healthier, Move More, Healthy Weight, Natural Wellness and health-concern/Gout. Shared optional preference/safety questions remain present; branch questions exist and use the intended group. The general health-concern fallback is also covered.
- node scripts/test-healthclues-quiz-branches.mjs - PASS; node --check and targeted ESLint - PASS.
- This verifies data selection/mapping and complements the browser E2E that visits every Quest card. It does not substitute for fully answering every optional branch in the browser.

## Account deletion RLS lock audit - 2026-10-28

- The isolated DB test now checks all 27 authenticated private user-data tables for an account-deletion lock in every authenticated policy. It asserts there is at least one authenticated policy for each table and no authenticated policy can bypass the shared access-gate helper.
- node scripts/test-healthclues-world-db.mjs - PASS, including this invariant and the existing deletion lock/cancel/purge, 27-family cross-owner, spoof-write, RPC grant, and RLS grant/policy checks; all transactional fixtures rolled back.
- An initial run found a brittle assertion that counted old anonymized audit fixtures globally. Scoped it to the exact request ID created by this rollback test; the retest passed.
- node --check and targeted ESLint - PASS. No application behavior changed; production remains untouched.

## Deletion retry/idempotency and policy bypass regression - 2026-10-28

- Added assertions that duplicate pending deletion requests reuse the same recovery request and duplicate due-purge runs do not process an already purged account twice.
- Audited authenticated policies for all 27 private user-data tables: every table has a lock policy and no additional authenticated policy bypasses the deletion gate.
- node scripts/test-healthclues-world-db.mjs - PASS with the expanded checks and transaction rollback. Targeted ESLint, node --check and focused diff check - PASS.
- Removed one known orphaned anonymized audit from the isolated DB left by the earlier E2E teardown failure; it was identified by its synthetic run timestamp and was the only existing anonymized row. No production or user data was accessed.
- Stronger runtime check: while a member with seeded private rows has a pending deletion, the isolated DB test performs authenticated SELECTs across every one of the 27 private owner row families and requires zero visible rows. The same rollback run passes duplicate-request reuse and zero-work retry after purge.

## Pending-deletion endpoint matrix and browser harness regression - 2026-10-28

- Added 17 authenticated HTTP probes during the deletion recovery window covering GET/POST/PATCH for all private HealthClues APIs with supported methods: World, Check-in, Collection, Toolkit, Journal, Knowledge, Boss, Community, Combos and Reminders. Every request must return 423. The account status and cancellation APIs remain reachable; direct PostgREST Profile SELECT returns no row.
- One failed run was caused by the existing Quiz Admin token being submitted before hydration. The runner now waits and asserts the token value before submitting. Another run caught transient CDP evaluation exceptions after reload; waitForText now retries them until its existing timeout and preserves useful diagnostics.
- node scripts/run-healthclues-game-e2e.mjs - PASS after these fixes; it covers all prior gameplay flows and verifies synthetic content/deletion audit cleanup.
- DB/RLS suite - PASS with the all-27-policy and populated-row deletion lock assertions. Targeted ESLint, node --check and focused diff check - PASS. No production systems or real email were used.

## Age gate skip and general-information path - 2026-10-28

- Fixed unanswered C01 Skip: it exits onboarding to general information rather than advancing into a quiz that cannot produce a profile. The finish guard also routes missing or negative age state safely.
- Full isolated HealthClues game E2E: PASS after the age-skip/general-information fixes; the run covered gameplay and confirmed synthetic fixture cleanup.
- Desktop (1440px) and mobile (390px) screenshots inspected: healthclues-general-content-age-skip-desktop.png and healthclues-general-content-age-skip-mobile.png. Both fit without horizontal overflow.
- npm.cmd run build PASS (Next.js 16.3, TypeScript, 79 routes; baseline/root .next preserved). Quiz safety (38 assertions), adaptive branch mapping, and isolated World DB/RLS suite PASS.
- node --check, targeted ESLint and git diff --check PASS. No production DB/deploy or real email used.

## Consented profile revision history - 2026-10-28

- Added migration 20261028250000_healthclues_profile_history.sql: server-managed revision numbers, owner-only history reads, no client mutation grants, deletion-gate policy, and cascade purge when the active saved profile is deleted/revoked.
- Added account history UI in English and Vietnamese with prior topic, version, timestamp and privacy/deletion explanation.
- Isolated World DB/RLS suite PASS across 28 private data families; profile/activity REST E2E PASS for version increment, owner read, cross-owner/anonymous denial, forged write denial, profile deletion cascade and fixture cleanup.
- Review/dashboard HTTP/browser E2E PASS with a real synthetic revision displayed in the account page. Desktop 1440px and mobile 390px screenshots inspected: healthclues-profile-history-desktop.png and healthclues-profile-history-mobile.png. Both layouts fit without horizontal overflow.
- Isolated Next.js 16.3 build PASS with TypeScript and 79 routes. Targeted ESLint and node --check PASS. No production database, deployment or real email used.

## Final gameplay and age-persistence regression - 2026-10-28

- Reran node scripts/run-healthclues-game-e2e.mjs after adding profile history and confirmed the whole gameplay regression passes with synthetic fixture cleanup.
- Under-18 and unknown-age branches now each assert both no Discovery Profile in session storage and zero saved healthclues_profiles rows in the isolated database. The unknown-age path continues to general information; adult restart and the full 10-question path still pass.


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

## Resume verification — Docker and analytics ACL recovery — 2026-10-28

- Docker Desktop control-plane access recovered. Restarted the existing isolated HealthClues PostgreSQL and PostgREST containers. Recreated the absent PostgreSQL forwarder using the internal E2E network and a loopback-only host port; both runner preflights validated the test database identity.
- `node scripts/run-healthclues-review-http-e2e.mjs` — PASS (exit 0): verified both analytics ACL migrations, isolated production build/TypeScript/79 routes, ebook funnel, HealthClues browser, review/dashboard browser, and exact cleanup/restoration of content and Quiz fixtures.
- `node scripts/run-healthclues-game-e2e.mjs` — PASS (exit 0) after Docker recovery; generated test content cleanup verified.
- Added HC-AT23 assertions to the full game E2E for owner share visibility, follower projection minimization, follower revoke denial with share preservation, and moderator Journal denial. The updated full E2E passed and removed all generated content fixtures.
- HC-AT23 still lacks the documented member block/mute behavior. HC-AT30 still lacks explicit `<10` aggregate suppression and an approved review of existing analytics retention; these remain open. No production data was queried or changed.
- Syntax and focused diff checks passed. Build emitted the known non-blocking middleware-to-proxy deprecation warning. No production deploy, credential change, or real email occurred.

## Master Prompt 04 Game Shell verification — 2026-10-28

- `/play` real Next webpack dev response: HTTP 200. `/play`, Quiz Quest and World pages compiled in the isolated local project copy. No `globals.css` CSS parser failure after removing the malformed arbitrary Tailwind selector source.
- Real Chromium screenshots captured and visually inspected: Welcome desktop/mobile, Quest desktop/mobile, guest World desktop/mobile and Toolkit setup desktop. At 390px, inspected Welcome and World screenshots fit without page horizontal overflow; mobile Welcome sizing was corrected and recaptured.
- The initial screenshot showed a reduced-motion hydration mismatch on animated Quest cards. Replaced these particular motion buttons with regular keyboard/touch buttons and retained reduced-motion-safe CSS feedback. A browser check after this fix showed the Quest interface renders; the Next dev badge may still be visible in development.
- No personalized Quiz submission, authenticated World resume, account-switch browser flow, Boss view, or test DB operation was performed. Existing E2E and DB test records are historical and were not rerun for this shell change. Statuses and limitations: `App/reports/GAME_SHELL_ACCEPTANCE.md`.
# Master Prompt 05 visual validation — 2026-10-28

- Chromium capture: `/play` and Welcome, Quest, Eligibility, Quiz at 1440×960 and 390×844; screenshots are stored under `App/reports/previews/` and listed in `RPG_VISUAL_ACCEPTANCE.md`.
- Quiz interaction: selected an existing Quest, answered the existing age checkpoint in the isolated browser session, and confirmed progression to the following existing question. No submit, authenticated session, database write, or email was triggered.
- Responsive check: browser document width was 390px at a 390px mobile viewport on captured Quiz screens. The Welcome/Quest imagery rendered from local assets. No Botly footer/header appeared inside gameplay.
- Focused ESLint and `/play` HTTP verification are recorded in `RPG_VISUAL_ACCEPTANCE.md`; no full E2E/build/DB suite was run in this visual pass.
- A Next development “1 Issue” badge appeared in some mobile screenshots; console-level cause has not been identified. Do not claim the preview warning-free.

## Master Prompt 05 visual/E2E continuation — 2026-10-28

- **PASS:** `node --check scripts/run-healthclues-game-e2e.mjs` after viewport screenshot alignment and rewards screenshot addition.
- **PASS:** Latest `node scripts/run-healthclues-game-e2e.mjs` against isolated Docker E2E DB. Full game path including all eight Quests, onboarding resume, Toolkit/Collection, World, Check-in, Knowledge, Boss retry/victory, persisted reward/unlock, reload and existing World resume passed. Test runner confirmed cleanup left no generated content fixture.
- **PASS:** Actual desktop 1440×960 and mobile 390×844 Chromium screenshots captured and inspected for Results, Toolkit, Collection, World, Check-in, Journal, Knowledge, Boss, Community and World reward/evolution. These are screenshots/visual findings, not claims that all screens have finished art direction; see per-screen PASS/PARTIAL entries in `RPG_VISUAL_ACCEPTANCE.md`.
- **PASS:** Latest development preview browser probe had no browser exception/console error and no Next portal issue text. Prior transient “1 Issue” aligned with incomplete source copy into the active watched preview; after copy completed, Next recompiled successfully. The dev overlay was not hidden.
- **SAFE ENV:** Isolated E2E database only; production `.env.local` was not loaded. Guest preview at `http://127.0.0.1:3210/play` does not enable authenticated writes. No production, email or deployment action.
- **PARTIAL:** Form-like styling remains on Results, Toolkit/Collection, Check-in/Journal, Knowledge and Community. Account-switching UI was not independently browser-tested. Human health-content and privacy/security release gates remain open.
- **Visual capture note:** after the final E2E rerun, the Journal desktop screenshot shows its full panel header; mobile screenshot starts within the editor, so the mobile Journal header composition remains unverified and PARTIAL.
## Master Prompt 07 onboarding regression — 2026-10-28

- PASS: node scripts/build-healthclues-isolated.mjs — Next.js 16.3 build, TypeScript and route generation; isolated temp build cleaned; root .next and baseline preserved.
- PASS: Focused ESLint over modified Quiz, World Preview, World map/Game, auth callback, route and state helpers. node --check scripts/run-healthclues-game-e2e.mjs passed.
- PASS: node scripts/run-healthclues-game-e2e.mjs — isolated Docker E2E DB; all 8 Quest choices, 10-question onboarding/resume, reveal/preview before Toolkit, activation continuation using an already verified synthetic account, persistent World, stable World ID on /play, existing Check-in/Knowledge/Boss/Rewards/Community regressions, and fixture cleanup passed.
- PASS: actual 1440×960 and 390×844 screenshots captured and visually inspected: healthclues-results-*, healthclues-world-preview-*, healthclues-activation-overlay-*, healthclues-toolkit-*, healthclues-game-shell-world-*. Capture helper checks document overflow and absence of footer.
- PASS: prior browser run identified React #418 hydration mismatch from reading auth/selected-Quest/pending profile storage during initial Quiz render. State now hydrates after initial server/client render; successful full browser E2E recorded no React exception.
- PARTIAL/BLOCKED: real guest OTP, email provider/callback/recovery, account switching, new-tab behavior, and secure handling review were not tested because no isolated Supabase Auth/email capture service was configured. E2E started with a verified fixture identity; do not call it a real email activation test.
- SAFE ENV: authenticated fixture writes used only isolated Docker DB botly_restore_verification / PostgREST loopback and synthetic fixture data. No production email/data/deployment.
### Latest guest-first mock OTP/callback run

- PASS: full node scripts/run-healthclues-game-e2e.mjs after adding a loopback-only OTP capture and Auth user mock. Browser starts signed out; captures World Preview before activation and verifies no World row exists; submits the entered synthetic email; verifies the callback URL excludes Quiz/profile data; captures email-pending desktop/mobile; loads the real HealthClues callback route with a synthetic signed identity; matches the pending email/Quest; enters Backpack; creates one World; and confirms reload resumes the same World ID.
- PASS: the same comprehensive game regression and isolated fixture cleanup completed. No real email or production data was used.
- PARTIAL: this mock verifies application callback/state behavior but is not a Supabase Auth/email delivery test. Expired/reused links, cross-tab/new-tab handoff and account switching remain outstanding.
### Live preview check

- BLOCKED: HTTP HEAD to http://127.0.0.1:3210/play returned 200, but response HTML is the Next “This page could not be found” fallback; a direct content probe confirmed it does not contain Welcome. The port belongs to an existing root Next dev process and was left running.
- BLOCKED: isolated standalone attempt at 3211 with current source/build also rendered the Next not-found fallback; the process started for this attempt was stopped. The isolated browser E2E at 3220 did render /play and pass, but shuts its server down after cleanup. No stable live preview URL is currently verified.


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
## Master Prompt 08 Final V2 checks (2026-10-28)

- Focused ESLint (`region-availability.ts`, `world-map.tsx`, `HealthCluesQuiz.tsx`, `world/route.ts`): PASS.
- `node --check scripts/run-healthclues-game-e2e.mjs`: PASS.
- `node scripts/start-healthclues-owner-preview.mjs --rebuild` with port 3234: PASS; isolated Next.js build includes `/play`.
- `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3234/play`: PASS. Browser saw HealthClues Welcome, 2 open Quest choices, 6 Coming Soon regions, 10-question cap, Reveal, fullscreen Overworld preview, activation overlay, and 0 runtime exceptions. Actual screenshots are saved under `App/reports/previews/` and desktop/mobile World captures were visually inspected.
- Superseded interim note: the final Master Prompt 08 rerun PASS; see the final rerun addendum below.
- No authenticated owner-demo email, Auth callback, Gout personalized journey, detailed region-map, or map-integrated mini-game test was possible with currently running local services. Production target was not contacted for writes.

## Master Prompt 08 Final V2 — final rerun

- PASS: full isolated `node scripts/run-healthclues-game-e2e.mjs` after aligning Sleep Knowledge/Boss fixture expectations and asserting Nutrition Garden remains disabled.
- PASS: final owner guest browser verification at `http://127.0.0.1:3234/play`; 2 playable regions, 6 Coming Soon, 10-question cap, Reveal and read-only World Preview; no runtime exceptions.
- The mock callback is not real email verification. No production endpoint was used for writes or email.

## Milestone 09A owner Auth acceptance — 2026-10-29

- PASS: `node scripts/start-healthclues-owner-demo.mjs --rebuild` applied current repository migrations to the dedicated local Supabase demo project and started the owner build. Exactly 28 migration-history rows were present. The DB volume `supabase_db_healthclues-owner-demo` is separate from the existing E2E fixture volume.
- PASS: `node scripts/test-healthclues-owner-auth-demo.mjs` exercised actual Chromium, not mocked identity: maximum-10-question Sleep path, Mailpit email, real local Supabase confirmation callback, Backpack, Skip, persistent World, and `/play` reload with stable World ID.
- PASS: two independently confirmed synthetic users; user B received no World and could not read user A's check-in. Guest GET World returned 401. Invalid callback recovery passed. Runtime exceptions: 0.
- PASS: `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3235/play` passed against the exact owner build: Welcome, both playable Quest choices, six locked regions, 10-question cap, Reveal, fullscreen read-only World and activation overlay; pan/zoom/select and no runtime errors. Screenshots were inspected.
- PASS: Auth URL returned to HealthClues only after correcting the raw GoTrue OTP redirect to `?redirect_to=...`; build and browser tests above use that corrected current source.
- PASS: local demo stop/start preserved the named volume (4 Auth users, 2 Worlds, 2 branches); the retained authenticated Chrome profile resumed the same World ID after services restarted and after `/play` reload (`node scripts/verify-healthclues-owner-resume-after-restart.mjs`).
- NOT VERIFIED: real hosted email provider, expired/replayed confirmation token timing, account deletion, and closing/reopening the entire browser. No production Supabase URL, database or email was used.
- Owner endpoints and screenshot links: `OWNER_PLAYABLE_AUTH_ACCEPTANCE.md`. Full product/content/security release status remains NOT READY.

## Milestone 09B verification update — 2026-10-29

- PASS: actual Chromium against owner build 3238 with local Supabase/Mailpit; authenticated Sleep and Health/Gout onboarding, World scene, Luna/Lumi, in-map landmarks, stable World reload, 8 visible regions (2 playable/6 locked), and guest/cross-account protections in exercised routes.
- PASS: Quiz safety (38 assertions), Quest/topic mapping, focused ESLint, changed script syntax and isolated owner build.
- PARTIAL: exact-topic Knowledge filtering works, but no reviewed Gout lesson is available; therefore a Knowledge Quick Quiz/lesson completion was not demonstrated. Full `run-healthclues-game-e2e.mjs` and fresh 09B stop/start verification were not rerun. Hosted email/provider token lifecycle remains outside local Mailpit coverage.
- Screenshots captured and inspected: `reports/previews/owner-two-region-*`, `owner-auth-*`. Full evidence: `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.


## 09C latest test evidence — 2026-10-29

Owner Auth browser test against the isolated build at http://127.0.0.1:3241/play: PASS. Real Chromium + local Mailpit; Sleep and Health/Gout verified; Care Plan synthetic method/medication records, self-report, edited note, pause and reload; guest 401, cross-account Care Plan 404, second account isolation, same World after reload, eight Overworld IDs (six Coming Soon), invalid callback, runtime exceptions 0. See HEALTHCLUES_09C_GAMEPLAY_ACCEPTANCE.md for exact scope/screenshots. Reviewed Catalog entries were absent, so item-level preview/save/equip, Knowledge lesson/Quiz, Boss, Skill and rewards were not verified.

## 2026-10-29 — 09D-R isolated Chromium

PASS for executed movement slice: local authenticated owner demo, Sleep walking coordinates changed, camera and Pet follow, Talk gated on arrival, station interactions, Health/Gout continuity, same World ID after reload, guest denial, second-account Care Plan isolation, invalid callback handling, zero uncaught runtime errors. Mobile viewport screenshot captured; physical device and FPS not verified. Full matrix: `REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

Xác minh tích hợp cuối (build `app-build-09d-r6`, 2026-10-29): isolated Next production build PASS; focused ESLint exit code 0 (còn 2 warning `@next/next/no-img-element` cho các ảnh local scene/NPC); `node --check scripts/test-healthclues-owner-auth-demo.mjs` PASS; `docs:healthclues:check` PASS; `git diff --check` PASS (chỉ cảnh báo chuyển LF/CRLF ở các file có sẵn). Test chạy đúng URL 3247 và kết quả JSON PASS ở trên.


## Owner-browser navigation rerun — 2026-10-29

Command: `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3249'; node scripts/test-healthclues-owner-auth-demo.mjs`. Result: PASS for the current script on actual Chromium against the owner URL and local Supabase Auth/Mailpit. Tested water/scenery/keyboard destination rejection without movement, authored bridge route and on-deck stop, both region travel/approach interactions, touch emulation, adventurer feet/shadow bounds, pet/camera follow, knowledge/Boss TEST ONLY flow, Auth, persistence, cross-account privacy and no runtime exceptions. Screenshots in `reports/previews/final-nav-*.jpg`. Mobile was emulated, not physical hardware. One earlier run stopped during Health return travel after touch; the latest run passed, so maintain PARTIAL for map collision fidelity until broader route QA. No production DB/email was used.
