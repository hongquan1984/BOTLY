## Current authoritative status - 2026-10-28

**V1 NOT COMPLETE / NOT READY FOR PRODUCTION.** The illustrated RPG map and playable core are preserved. The latest isolated Next.js 16.3 build passed with 79 routes; the populated two-user DB/RLS suite and full game browser E2E passed, including account deletion/recovery/purge and 390px privacy-page QA. Review/dashboard and profile/activity REST suites, Quiz safety/branch mapping, 37 discovery-matching assertions, targeted lint and diff checks passed. Screenshots include the map, Boss victory, Admin diagnostics and account privacy on desktop/mobile.

Remaining acceptance gates: qualified review of real Catalog/Clue/Boss content; privacy approval for the proposed retention and backup-erasure schedule; broader age/safety/consent/account permutations; and remaining authenticated RLS/mutation and reviewer/moderator operation coverage. Admin review, reward configuration, diagnostics, and Quiz/Method/Combo authoring have representative local/test coverage. All fixture data and email delivery remain local/mock. No production database, deployment, credentials or real email were changed.

## Historical continuation snapshot — superseded

**V1 NOT COMPLETE / NOT READY FOR PRODUCTION.** Latest isolated production build, database regression, and browser E2E pass. The E2E now covers mock transient reminder failure and scheduled retry, Catalog activation plus reviewer-controlled recommendation eligibility, and Community moderation dismiss/remove in addition to the previously verified gameplay loop. The root Next build isolation is the canonical build path and both the existing baseline and root `.next` remain preserved.

Remaining acceptance gaps: all Quest-specific adaptive Quiz branches and broad age/consent permutations; the full endpoint/RLS matrix; reminder retry exhaustion and timezone/frequency edges; stale-version admin conflict behavior; authoring workflows for reviewed Methods/Combos; and a human-reviewed real Catalog/Clue/Boss content corpus. Tests use isolated synthetic non-medical fixtures only. Production DB/deploy/credentials/email remain untouched.

The legacy Botly review/browser regression runner was also repaired after it reproduced the root `App/app` build collision. It now builds and starts only from a run-owned `.tmp/healthclues-review-build-*` directory, does not delete root `.next`, and passed the isolated review/ebook/dashboard browser suite. The existing `App/.tmp/healthclues-build-baseline` remains intact.

## Historical gate snapshot — superseded

**NOT COMPLETE / NOT READY FOR PRODUCTION.** Latest E2E verifies mock failed-job cancellation on unsubscribe and admin reviewer reject/deactivate/eligibility and Community resolve/dismiss/remove paths. Latest canonical build, isolated DB suite and full review/dashboard regression pass. Four currently configured adaptive topic branches were opened in browser; eight Quest cards are selectable, but eight distinct content branches are not implemented or verified. All production boundaries remain intact.

Remaining release gaps: human-reviewed real health content; full Quest-specific quiz content and age/consent matrix; timezone/frequency reminder boundaries; broad auth/RLS/API matrix; operational diagnostics and Combo/Method authoring/review. Synthetic fixtures do not meet medical content review requirements.

Latest local/test E2E now also covers three-attempt reminder retry exhaustion, failed-job cancellation on unsubscribe, stale Catalog-version conflict, and UI normalization of persisted local time. Retry exhaustion and stale-version checks should no longer be considered outstanding; timezone/frequency boundaries, broader operations and security matrix remain.

Updated: 2026-10-28

## Historical implementation snapshot

**First playable World/Toolkit/check-in slice: locally tested.**

**HealthClues V1: NOT RELEASE-READY.** The end-to-end V1 loop does not yet include Knowledge, Boss, learning rewards, persistent World unlocks, Combos, Community, HealthClues reminders or Community moderation.

## Verified locally

- `npm.cmd run build` passes through a build-isolation wrapper that avoids the Windows `App`/`app` path collision. The prior `App/.tmp/healthclues-build-baseline` and root `.next` artifacts are preserved.
- Browser E2E passes the current Quest/Quiz/Toolkit/World/check-in flow, Collection save and post-World equip, lifecycle history, owner-only private notes, map region interaction, desktop/mobile and reload.
- Isolated PostgreSQL test passes World idempotency, reviewed equipment, Collection equip idempotency, check-in edit/XP dedupe, private-note isolation and RLS assertions with rollback.
- Current screenshots were captured and visually reviewed under `App/reports/`.
- No production database, deployment, real email or production credential was changed.

## Release blockers

- Implement and test reviewed Daily Knowledge, Knowledge Book and Boss challenge flows. No reviewed HealthClues challenge content has been authored or approved; empty states must remain safe until approved content exists.
- Implement and test server-authoritative learning/Boss rewards and persisted visual World unlock state.
- Complete Recipe Combo and Journey Combo UI/API flows.
- Complete standalone private Journal timeline/edit and security tests.
- Complete Community journeys, explicit projections, matching, follow, Start My Own, revoke/report and moderator queue.
- Complete opt-in timezone reminders with a mock/sandbox provider, dedupe, delivery history and unsubscribe.
- Complete admin review/moderation role matrix and broad RLS/API regression.
- Run all mandatory Master Prompt E2Es and verify remaining mobile/accessibility criteria.

## Production boundary

All current evidence is local/test only. Do not deploy, run production migrations, send real email, activate unreviewed health content, or change production credentials. Production approval is not requested by these changes.

## Continuation status — 2026-10-28

**NOT READY FOR PRODUCTION.** Fresh local/test build and browser E2E pass for current work. Knowledge Clue/Book and private Journal flow are implemented and covered with synthetic fixtures; no real health content was approved or seeded.

Remaining release blockers include Boss battle/reward and persistent World Evolution, Recipe/Journey Combo flows, Community Journeys/revoke/moderation, HealthClues reminder scheduling with mock delivery, admin review/moderation UI, and comprehensive authorization/RLS/security tests. The successful map visual QA remains valid and was not redesigned in this continuation. Local/test only; no production changes.

## Historical local/test release gate — superseded

**NOT READY FOR PRODUCTION.** Canonical isolated production build, isolated World DB tests, and full browser E2E pass for the implemented onboarding/Toolkit/Collection/check-in/Knowledge/Journal/Boss/World-unlock scope. Boss unlocks persist after reload and alter the interactive map from saved state. Screenshot QA includes desktop, mobile, selected region, and Boss victory.

Still required: real approved catalog/knowledge content and content reviewer UI; Recipe/Journey Combo member flows; Community Journeys, Follow/Start Own, revocation and moderation; HealthClues reminder scheduler with mock delivery; broader admin moderation; full security/RLS matrix and regression. Do not deploy or run production migrations.

## Combo release status — 2026-10-28

Journey Combo partial acceptance, same-slot replacement and individual Collection save are covered by the isolated member E2E. Recipe Combo with reviewed Method instructions/safety has not yet had fixture-backed E2E. Community, reminder scheduling and admin moderation remain release blockers. No production actions were taken.

## Latest Combo verification — 2026-10-28

Recipe Combo Method/ingredient relationships and Journey Combo partial acceptance/replacement now have isolated fixture-backed E2E coverage. User decisions are saved as separate Collection items; there is no automatic equipment. Both require a future admin authoring/review UI before release content can be managed operationally. V1 remains not ready for production due to Community, reminder, moderation, and complete security gates.

## Historical Master Prompt 03 snapshot — superseded

**STATUS: PLAYABLE V1 CORE VERIFIED LOCALLY; NOT PRODUCTION-READY / NOT V1 COMPLETE.**

Latest evidence: isolated Next.js production build PASS; isolated PostgreSQL World/Knowledge/Boss/Reminder RLS regression PASS; full local headless-Chrome E2E PASS; targeted ESLint PASS; repository secrets scan PASS. E2E now includes Community privacy/follow/revoke/report and admin moderation, daily reminder consent/timezone/mock dispatch/dedupe/pause/resume/unsubscribe, reviewer queue access, quiz/combos/equipment/world/check-in/Knowledge/Journal/Boss/reward/unlock persistence, desktop/mobile screenshots, and reload. Screenshots for reminder and both admin queues were captured and visually reviewed. The illustrated map was retained unchanged.

Added gated Vietnamese admin interfaces/APIs for Catalog/Clue/Boss review and community report moderation. Automated tests verify authorization, Clue/Boss reviewer-confirmation guard, synthetic-fixture publish state/audit, and community moderation action/audit. Catalog decision mutations and reject/deactivate branches are not tested. Only isolated synthetic non-medical fixtures were published by the test reviewer flow; no real health content was approved.

Remaining acceptance gaps:

- No human-reviewed real Catalog/Clue/Boss content is available in the isolated test project. Game E2E uses only non-medical synthetic fixtures, so personalized recommendations and learning are proven against fixture data, not a content-complete corpus.
- All eight adaptive quiz branches, full age/consent edge cases and every API/RLS policy are not exhaustively exercised.
- Reminder provider retry after a simulated transient failure is not exercised; delivery is intentionally mock-only and no real provider/email was used.
- Admin authoring for Combo/Usage Method definitions, Catalog decision mutations and reject/deactivate review tests remain absent.
- Broader operational diagnostics and release/production migration review remain outstanding.

No deployment, production migration/database mutation, real email delivery, production credential change, or real-content approval occurred. Do not describe this build as release-ready until the gaps above are addressed and the content receives human review.

## Latest reminder/API regression — 2026-10-28

The latest isolated game E2E passes malformed timezone, local-time and frequency rejection, explicit reminder-consent enforcement, America/New_York weekly local boundary/dedupe, transient retry and retry exhaustion, and unsubscribe cancellation. Community Method ID lookup by owner and follower also passes. Targeted ESLint and `git diff --check` pass. These checks close reminder retry/stale-version gaps from earlier historical sections; those earlier sections are superseded by this current status.

**Still NOT READY at this historical checkpoint:** reviewer-approved Catalog/Clue/Boss content was absent; age/consent and authenticated RLS mutation coverage was not exhaustive; Methods/Combos lack admin authoring. Later entries in this report record the eight-Quest Quiz branch implementation and broader populated RLS checks; current gaps are summarized at the top.

Latest 2026-10-28 verification: canonical isolated build PASS (77 routes), game browser E2E PASS, World DB/RLS suite PASS, review/dashboard HTTP+browser regression PASS, profile/activity REST E2E PASS, discovery matching checks PASS (34 assertions), targeted ESLint PASS, and `git diff --check` PASS. Visual evidence from the accepted RPG map and Boss/reward screens remains in `App/reports/`. The project is still NOT V1 COMPLETE because the listed product/content and coverage gaps are real; no production data, deployment, credential, or email provider was touched.

Latest Quiz continuation: the signed-in browser suite now verifies the opening adaptive question for all eight Quest routes, and the complete local game E2E plus canonical production build pass after the change. Discovery matching passes 37 assertions. Quiz age/safety/consent/account permutations remain partial; release status remains NOT READY due reviewer-approved health content, broad RLS coverage, and admin configuration/diagnostics gaps.

Admin follow-up: HealthClues content review and Community moderation now use separate `HEALTHCLUES_REVIEWER_TOKEN` and `HEALTHCLUES_MODERATOR_TOKEN`; the generic Botly admin token is denied. Read-only Vietnamese diagnostics are available to either role and expose aggregate queue counts only. Isolated E2E verifies role cross-denial, legacy-token denial, diagnostics API/UI, and full game regression; canonical build passes at 78 routes. `.env.example` documents the new names; no secret values or production credentials were changed.

Still NOT READY: reviewer-approved real Catalog/Clue/Boss content, broader RLS/authenticated mutation coverage, Quiz age/safety/account permutations, reward configuration, and admin authoring for Quiz/Methods/Combos remain incomplete.

Security follow-up: the isolated DB suite now populates private rows for two users before running authenticated cross-owner queries. It proves owner isolation across core World, toolkit, check-in, Journal, Knowledge, Boss, XP and unlock data, plus protected write grants and private answer-key denial. The suite passes and rolls back fixtures; untested RLS policies and mutation paths remain, so this does not close the full security gate.

The latest browser E2E additionally verifies cross-account API boundaries for World, Collection, check-in details, Toolkit mutations, Journal, Knowledge Book, Boss state and Reminder history while both members have independent data. `node scripts/run-healthclues-game-e2e.mjs` passes. Security coverage is materially broader but still not exhaustive.

## Resume verification � 2026-10-28

Latest local/test evidence: full game E2E PASS (including separate reviewer/moderator audit identity assertions); populated PostgreSQL/RLS suite PASS; isolated Next.js build PASS (78 routes, baseline artifacts preserved); profile/activity REST suite PASS; review/dashboard/ebook HTTP-browser regression PASS; discovery matching PASS (37 assertions); targeted ESLint, diff check and secrets scan PASS. Synthetic fixtures and mock email only; candidate cleanup passed. No production database, deployment, production credentials or real email changed.

**Release gate remains NOT COMPLETE / NOT READY.** Human-approved real Catalog/Clue/Boss content is unavailable; admin reward configuration and authoring for Quiz/Methods/Combos remain unfinished; authenticated access-control coverage is broad but not exhaustive. Existing middleware deprecation warning is non-blocking and remains for a separate Next migration.

## Admin credential repair � 2026-10-28

The HealthClues Quiz reviewer-note preview no longer accepts the shared Botly ebook admin credential. The separate reviewer token is verified in full game E2E (legacy denial and reviewer success) and the post-change isolated build passes. This closes one authorization gap; it does not implement quiz authoring or complete the broader RLS matrix. V1 remains NOT COMPLETE / NOT READY.
The follow-up review/dashboard regression passed against an environment with no HealthClues reviewer token configured (the preview returns 503 until configured). It emitted one non-fatal Next `destination stream closed early` teardown diagnostic while all checks, cleanup, and exit status succeeded.

## Method/Combo admin authoring � 2026-10-28

Reviewer-only draft authoring and review/publish paths for Usage Methods, Recipe Combos and Journey Combos are implemented and verified against the isolated database and game browser E2E. Drafts are inactive, audit logged, and require explicit reviewer confirmation plus active/reviewed dependencies before publish. The post-change build passed with 79 routes. **V1 is still NOT COMPLETE / NOT READY:** existing content revision management, reward configuration, exhaustive access-control coverage, and human-reviewed health content remain open.

## Authoritative resume status — 2026-10-28

**HEALTHCLUES V1 NOT COMPLETE / NOT READY FOR PRODUCTION.** The canonical build isolation fix is in place; the baseline was inspected and preserved. Latest isolated World database suite passed. Game browser E2E is currently running. Reward configuration and Method/Combo draft authoring have now been implemented and are under actual DB/API/browser verification; older report lines claiming they are missing are superseded by this section and the run evidence in `V1_TEST_RESULTS.md`.

Remaining release blockers: a qualified human must review and approve real Catalog/Clue/Boss content before it can be populated; the broader age/consent/account and per-table/per-operation authorization matrix is not exhaustive; Quiz authoring and revision of existing Method/Combo content versions are absent; badge/cosmetic rewards beyond current fixed milestone configuration are not implemented. Automated local synthetic fixtures do not satisfy the content-review requirement.

Latest evidence: `node scripts/test-healthclues-world-db.mjs` PASS after admin draft/reward migrations. Build child produced an isolated BUILD_ID, and both root and original baseline BUILD_ID files remain intact; wrapper exit verification is pending. Browser game E2E is running. No production DB, deployment, credentials or real email were touched. Do not approve release until the outstanding product and security gates are closed.
## Latest verified release decision — 2026-10-28

**NOT V1 COMPLETE / NOT READY FOR PRODUCTION.** Current canonical isolated production build PASS (Next.js 16.3, TypeScript, 80 routes); full game browser E2E PASS; isolated World DB/RLS PASS; review/dashboard/browser regression PASS; profile/activity REST PASS; discovery matcher PASS (37 assertions); targeted HealthClues ESLint and secret scan PASS. Latest screenshots were regenerated and desktop/mobile map, selected Quest picker and Boss victory were visually reviewed.

Completed and verified local/test scope includes Quest and core Quiz flows; reviewed-fixture recommendations; slots, Collection and Toolkit lifecycle; Recipe/Journey Combo; one persistent illustrated World; check-in and private Journal; reviewed-fixture Knowledge Book and Boss; fixed XP, configured milestone reward toggles and saved World unlock; Community share/follow/start-own/revoke/report/moderation; mock-only reminders; Vietnamese admin content/Method/Combo/reward/moderation/diagnostic pages. These synthetic-fixture results do not imply an approved health-content library.

Release blockers and limitations:
- No qualified reviewer has supplied/approved a real Catalog/Clue/Boss corpus. This must remain blocked; no automated or agent approval can satisfy the human review gate.
- Quiz age/safety/consent/guest-account cases and the full authenticated RLS/table/mutation matrix are not exhaustive.
- Admin Quiz authoring and revision of existing Method/Combo versions are not implemented.
- Badge/cosmetic reward breadth beyond configured milestones and Boss-driven map unlock is limited.

Build isolation fix details and test evidence are in `V1_PROGRESS.md` and `V1_TEST_RESULTS.md`. The inspected pre-existing `App/.tmp/healthclues-build-baseline` and root `.next` were preserved; canonical build wrapper exits successfully. Reminder E2E used mock delivery only. No production database, deployment, production credential change, or real email was touched.
## Release decision update — 2026-10-28 continuation

**NOT V1 COMPLETE / NOT READY FOR PRODUCTION.** The current code builds successfully and quiz-safety/discovery-matching plus targeted lint pass. During this continuation, a previously missed shared-admin-token access path for HealthClues discovery review was corrected and an additive isolated-test migration plus HTTP/DB assertions were added. Those new security assertions have not yet run because this execution is denied access to the required isolated Docker Engine. Do not treat the reviewer-boundary fix as verified until the DB and HTTP suites rerun successfully.

The known build incident remains addressed by the isolated build wrapper. The `App/.tmp/healthclues-build-baseline` data and root `.next` artifact were both checked after build; the baseline BUILD_ID timestamp/content remained intact. No baseline deletion or mutation occurred.

Immediate test gate: rerun `node scripts/test-healthclues-world-db.mjs`, `node scripts/run-healthclues-review-http-e2e.mjs`, then `node scripts/run-healthclues-game-e2e.mjs` where the approved local isolated Docker Engine is available. The present sandbox denial is `permission denied` for Docker's Windows named pipe; no attempt was made to bypass it.

Other release blockers remain: qualified human review/approval for real health Catalog/Clue/Boss content, non-exhaustive authentication/consent/RLS matrix, absent Quiz authoring/existing-version revision breadth, and limited cosmetic reward breadth. No production database, deploy, production credentials or real email were touched.

## Current release gate — 2026-10-28

**HEALTHCLUES V1 NOT COMPLETE / NOT READY FOR PRODUCTION.** Since the prior checkpoint, the dedicated HealthClues reviewer boundary has been applied and verified against the isolated DB, review HTTP/browser E2E, and full gameplay browser E2E. Canonical build, targeted lint, RLS suite and secret scan pass. The baseline remains intact. The earlier test-runner role and UI-token issues were fixed and the final regression runs exited successfully.

The implemented and verified playable loop remains intact: Quiz → reviewed-fixture Toolkit/Collection and Combos → persistent World → Check-in/Journal → reviewed-fixture Knowledge Book → Boss → XP/reward and saved World evolution. Community follow/start-own/revoke/report/moderation and mock-only reminders also pass isolated checks. Screenshots are in `App/reports/`; the latest admin content-review screenshot was visually inspected. The RPG map was preserved.

Open gates:
- A qualified human must review/approve real Catalog, Knowledge Clue and Boss content before V1 can serve a real health-information corpus. Automated synthetic fixtures cannot satisfy this.
- Authenticated authorization/RLS mutation coverage and some Quiz age/consent/account permutations remain incomplete.
- Quiz Admin is currently read-only preview; persistent question authoring/version management and active-version integration are not complete.
- Cosmetic reward breadth remains limited.

No production database, deployment, credentials or real email were changed. Continue implementation/testing; do not mark V1 complete until every gate is resolved and evidenced.

### Latest continuation addendum — 2026-10-28

The Quiz Admin partial-bank defect is fixed: all 96 canonical questions, eight adaptive branch families, and retained reviewer notes are available to the reviewer. Public Quiz responses omit internal notes. The full game E2E, isolated DB tests, targeted lint, and canonical isolated build pass after the fix. The branch-routing browser suite printed PASS and screenshot QA reconfirmed the retained RPG World map.

The review/dashboard orchestration runner is not yet marked PASS: its child suite and isolated DB snapshot cleanup logged success, but the wrapper returned exit code 1 without a captured parent stack. This needs a clean diagnostic rerun. V1 also remains blocked from production readiness by the absence of human-reviewed real Catalog/Clue/Boss content and incomplete broad age/consent and authenticated RLS coverage. Synthetic fixtures remain test-only. No production system or real email was used.

Review-runner clarification: a foreground rerun of `node scripts/run-healthclues-review-http-e2e.mjs` exited 0 and passed the isolated review/dashboard/ebook suites; both catalog and Quiz snapshots were restored exactly. The earlier redirected run's exit 1 was not reproduced. This does not change the NOT COMPLETE status or the real-content/security coverage blockers.

Status correction: older dated entries that describe Quiz Admin as read-only or adaptive branches as unimplemented are superseded. Current reviewer-only versioned Quiz editor, all eight routeable branch entries, foreground review runner, full game E2E and canonical build are verified. The release remains NOT READY due to real-content human review and remaining security/consent coverage.

Security coverage addendum: the isolated DB regression now verifies RLS is enabled on every HealthClues table and checks anon SELECT grants across private, audit, answer-key, projection, reviewer, and reviewed-content surfaces. The suite passed with existing two-user row-isolation and protected-write checks. Authenticated mutation permutations remain open; this does not clear the production security gate.

The DB security regression also now exercises authenticated row mutations, confirming own World/Journal updates succeed while cross-owner updates affect no rows. Remaining authenticated policy permutations still need coverage.

A database audit found and resolved a test isolation defect: previous game E2E runs had left synthetic `hc-test-*` content because Method component/version references were not removed before their parents and the cleanup error was swallowed. Cleanup now reports/fails visibly and asserts zero run-generated content remains. Full game E2E and DB/RLS regression pass after this fix; a read-only query verified zero test fixtures/users remain and zero published reviewed Catalog/Clue/Boss rows exist in the isolated test database. The absence of human-reviewed real content remains a release blocker.

Current status correction: Admin authoring/review for Usage Methods and Recipe/Journey Combos, versioned Quiz editing/publishing, and reviewer-controlled reward display configuration have all since been implemented and verified in isolated E2E. Earlier dated gaps naming these features as absent are historical. The remaining blockers are not those authoring screens; they are human review/approval of the actual health-information corpus and the incomplete broad security/consent matrix, plus limited cosmetic reward variety.

## Release gate update — 2026-10-28 source-linked review drafts

**HEALTHCLUES V1 IS NOT COMPLETE / NOT READY FOR PRODUCTION.** Added a reviewer-only pipeline for six paraphrased Clue/Boss candidates with official source references. The RPC and UI cannot auto-approve or publish them; all six remain pending human review and answer keys remain private. Isolated DB/RLS, complete game browser E2E, review/dashboard browser E2E, and changed-file lint pass. Canonical build result is pending and must be appended when the build exits.

Open gates remain: qualified human review and approval of the actual Knowledge/Boss/catalog corpus; broad authenticated mutation, age-gate and consent permutations; and greater cosmetic reward variety. No production DB/deployment, production credential or real email was used. Keep the goal active; do not mark V1 complete.
Canonical Next.js production build now PASS (exit 0), with TypeScript and all 79 static pages completed. The root build artifact and the preserved App build baseline remain in place. The review UI screenshot demonstrates that the import control and draft queue render; it does not imply reviewer approval. The six imported source-linked candidates remain pending.
The last security recheck passed: the DB rejects non-approved source hosts atomically, the browser/API E2E rejects both legacy admin and moderator credentials for reviewer draft import, and the full gameplay suite cleans its fixtures. Production remains gated on a qualified human reviewer evaluating the six private, unpublished candidates and the remaining broader security/content coverage. No deployment or production mutation occurred.

## Release gate update — persisted milestone evolution

Day 60 now grants a saved Knowledge Library landmark to the existing World; the UI renders it from the database-backed unlock state. The milestone DB test, full browser game E2E (including post-reload persistence and visual render), review/dashboard browser regression, and canonical Next.js build pass. Desktop/mobile screenshots were inspected. Existing map and progression contracts remain in place.

**HEALTHCLUES V1 IS STILL NOT COMPLETE / NOT READY FOR PRODUCTION.** Six source-linked health content candidates remain private, unpublished and pending qualified human review. Broader Auth/RLS consent permutations and cosmetic reward breadth remain open. No production mutation, deployment, credential change, or real email occurred.

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

## Verification addendum - reviewer-configurable Boss cosmetics - 2026-10-28

- Reward configuration now includes four fixed Boss keepsakes and five milestones. API and security-definer RPC enforce the fixed allowlist, versioning, audit reason and reviewer identity; only service_role can execute the RPC. XP, Boss correctness and reward grants remain server-controlled.
- Full gameplay E2E passed after the migration, including keepsake disable/restore through the reviewer route, all nine visible admin entries, Boss reward persistence, responsive interactions, Community, mock reminder delivery and cleanup. DB/RLS and review/dashboard HTTP/browser suites passed.
- Canonical isolated production build passed on Next.js 16.3 with TypeScript and 79 static pages. Both pre-existing build artifacts remain present. Quiz safety, discovery matching, and profile/activity REST regression suites passed.
- Real-browser reward admin screenshot was inspected. No production database, deployment, credential change or real email was used.
- RELEASE NOT READY / V1 NOT COMPLETE. Source-linked health-content drafts still require qualified review before publication; the complete authorization/consent matrix remains under audit. No content was approved or published by this change.
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
## Final continuation status — 2026-10-28

Latest full rerun passed: isolated DB/RLS suite, full game E2E, review/dashboard HTTP/browser suite, three focused Quiz/discovery/profile security regressions, and canonical isolated Next.js production build (79 generated pages). Baseline and pre-existing root `.next` artifacts were preserved. Latest game E2E screenshots were regenerated under `App/reports/`; report records visual QA and interactions.

**Release status: NOT READY — HEALTHCLUES V1 NOT COMPLETE.** The code paths are fixture-verified, but no actual active reviewed Catalog/Clue/Boss health corpus is available. A qualified human must review and approve production learning/recommendation content. The auth/RLS implementation has substantial isolated evidence but its full per-operation authorization and consent matrix is still incomplete. Real email, production database writes, credentials, deployment, and production migrations were not used.
## Authorization evidence update — 2026-10-28

The isolated PostgreSQL suite now probes cross-owner SELECT, UPDATE and DELETE against populated rows in 27 private row families under authenticated role, in addition to its existing direct-write grants, owner-write, anonymous denial, API cross-owner, reviewer separation and RLS checks. The latest DB run passed and rolled back all fixtures. This improves coverage but does not complete every role/consent/operation permutation; release remains NOT READY while the complete authorization matrix and qualified review of real health content are outstanding.
## Admin authentication route check — 2026-10-28

All seven HealthClues Admin API routes now have an explicit anonymous HTTP regression assertion; the complete game E2E passed after this test expansion. The role matrix still requires complete reviewer/moderator operation coverage; no real health content has been approved. Release remains NOT READY.
## Admin credential matrix update — 2026-10-28

The latest full game E2E passes expanded role checks across all seven HealthClues Admin endpoints: anonymous, ordinary-member and legacy Botly admin denial, reviewer/moderator separation, and aggregate-only diagnostics for both allowed roles. This is additional coverage, not proof of every role/operation combination. V1 remains NOT READY pending the remaining security audit and qualified review of real Catalog/Clue/Boss content.
## Content and server privilege audit — 2026-10-28

Read-only inspection of the isolated test DB found zero active/reviewed Catalog items and zero published/reviewed Clues or Bosses. Synthetic browser fixtures remain test-only. The DB suite now verifies server-role-only EXECUTE privileges for all 17 business/reviewer RPCs and no authenticated DML grants across 17 protected content/answer/audit tables. These checks pass. Production release still requires qualified human content approval; no production system was used.
## RLS grant/policy consistency — 2026-10-28

Current isolated-schema audit found zero anon/authenticated table grants without a matching RLS policy; this is now a repeatable DB test invariant. The latest RLS suite passes along with two-owner, protected-write and server-RPC checks. This strengthens the security evidence but does not approve health content or complete every reviewer/moderator operational permutation. Release remains NOT READY.
## Consent renewal follow-up — 2026-10-28

The reminder API now records a fresh consent timestamp when a user opts in again after unsubscribe, while retaining the timestamp when an already-subscribed user edits schedule settings. The full isolated browser E2E passed the opt-out/re-consent/unsubscribe sequence and its reminder, Community, admin, gameplay, persistence and responsive checks. The isolated DB/RLS suite and canonical isolated production build also passed. Build isolation preserved both existing build artifacts.

**Release remains NOT READY / HEALTHCLUES V1 NOT COMPLETE.** Read-only isolated data audit still finds no active reviewed Catalog or published reviewed Clue/Boss corpus. Qualified human review/approval is required before real health content can be made available. Broader auth/consent and admin operation coverage also remains partial. No production data, deployment, credentials or real email was touched.

## Owner-RLS spoof-write regression — 2026-10-28

Isolated security coverage now verifies eight authenticated foreign-owner insert/ownership-transfer attempts are rejected across personal tools, proposals, discovery activity, Collection, Follow and Community reports. The rollback-only PostgreSQL suite passes, alongside the prior populated cross-owner read/update/delete, grants, RLS-policy consistency and server-only RPC checks. Authorization coverage remains broad but not exhaustive; the release remains gated on qualified human review of real health content and final privacy/retention approval.

## Account deletion and retention release gate - 2026-10-28

Local/test implementation and representative DB/API/browser verification pass for HealthClues account data request, immediate access/share/reminder restrictions, recovery cancellation, and due purge. Botly auth remains, the user's HealthClues primary data is removed, an anonymized audit is retained, and another member's data survives. The full browser run verifies fixture cleanup after the teardown fix.

This does not authorize production activation. The 30-day recovery and 60-day primary-data purge schedule remains a proposal requiring privacy/legal approval and a reviewed backup-retention/deletion policy. Do not run the retention worker against production until that review, operational scheduling, monitoring and recovery procedures are approved. No production database or real email was used.

Overall release remains **NOT READY / V1 NOT COMPLETE**. Qualified review and approval of real Catalog/Clue/Boss content and exhaustive authorization/consent review remain open gates.

## Latest deletion-lock verification - 2026-10-28

The full browser/API E2E now verifies the pending-deletion lock across 17 private HealthClues API operations, while account recovery stays accessible. The isolated DB/RLS suite verifies every authenticated policy on 27 private tables includes the deletion gate and that populated rows across all 28 families are hidden while pending. Full game E2E, cleanup, targeted lint and DB suite pass. This improves the privacy/access evidence; it does not close all consent, age/safety or operational authorization cases.

Overall release remains **NOT READY / V1 NOT COMPLETE** until qualified human review of real Catalog/Clue/Boss content and privacy approval of retention/backup-erasure policy. No production systems or real email were used.

## Age-gate skip verification - 2026-10-28

The unknown-age Skip path now ends in general information, creates no Discovery Profile or personalized recommendations, and links to general wellness guides. Full browser E2E, Next.js build, Quiz safety/branch tests, isolated World DB/RLS tests and targeted lint pass. Desktop 1440px and mobile 390px screenshots were inspected. V1 remains NOT READY: qualified review of real health content, retention-policy approval, and broader authorization/consent matrix coverage are still open.

## Saved profile history verification - 2026-10-28

Consent-based profile revisions are saved with server-managed version numbers, displayed in the signed-in account UI, protected by owner RLS and removed by profile deletion. Isolated REST/DB tests and the real browser review/dashboard suite pass. Desktop/mobile screenshots are in App/reports/healthclues-profile-history-desktop.png and healthclues-profile-history-mobile.png. Release remains NOT READY pending qualified review of real health content, privacy approval of retention/backup-erasure dates and remaining authorization/consent matrix work.

## Final age-persistence regression - 2026-10-28

The full HealthClues gameplay browser E2E passed after profile-history work. It now directly verifies zero saved profile rows for both under-18 and unknown-age Skip flows, then completes the adult onboarding path. Fixtures were cleaned from the isolated local/test database. No production changes were made.


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

## Resume verification and acceptance gaps — 2026-10-28

Docker recovered. The review HTTP E2E and full game E2E both exit 0 against the isolated test database after restoring its stopped containers and loopback-only forwarding path. The review runner applied and verified both analytics ACL migrations. The game runner now also checks owner/follower/moderator boundaries for community sharing and private Journal access; it passes with zero generated content fixtures after cleanup.

Remaining security/privacy gaps: the Community specification includes blocking/muting members, but this is not implemented; HC-AT23 is therefore partial. HC-AT30 still lacks explicit small-cell (`<10`) aggregate suppression and an approved review of pre-existing analytics retention. Do not query production or change existing analytics until the privacy/retention review is approved. These gaps do not clear the human review gate for real Catalog/Clue/Boss content. **V1 remains NOT COMPLETE / NOT READY FOR PRODUCTION.** No production database, deployment, credential, or real email was used.

## Master Prompt 04 release status — 2026-10-28

- The local Welcome/Game Shell entry experience and guest preview are implemented and visually inspected in Chromium. The isolated webpack dev server is live at `http://127.0.0.1:3210/play`.
- Returning-player detection and same-owner Quiz resume are implemented but not verified with authenticated test identities. Boss/rewards visual acceptance and a fresh full regression are still outstanding.
- No production auth, database write, migration, deployment, or real email was used. `.env.local` is configured for the production Supabase project; the isolated preview omits it. Live authenticated features are therefore intentionally unavailable through this preview.
- Existing independent human content, security and privacy approvals remain outstanding; implementation does not make V1 production-ready. See `App/reports/GAME_SHELL_ACCEPTANCE.md` and the prior V1 release blockers.
# Master Prompt 05 visual release note — 2026-10-28

The player-facing art direction is improved but this milestone is PARTIAL. The Quiz scene is now visually connected to the approved World art and a consistent adventurer sprite is reused in several features. Results and multiple persistent/authenticated screens have not received complete visual QA; region-specific and Boss artwork remains outstanding. The safe local preview does not include production Supabase credentials, so authenticated persistence and returning-player behavior were not exercised. The mobile dev overlay still reports one issue in some captures. Keep the previously recorded independent human content review, privacy/security items, community blocking/muting, and analytics suppression/retention gates open. **Not production-ready.**

## Master Prompt 05 continuation status — 2026-10-28

**Visual/game milestone: PARTIAL. Production release: NOT READY.**

The Welcome and approved World art are preserved. The existing game shell and core gameplay remain integrated; the latest isolated browser E2E passed the complete new-player journey and same saved-World resume/no-duplicate check. Fresh desktop/mobile screenshots were captured and inspected for all remaining major screens and saved World evolution. Several screens still look like conventional form/card interfaces (Results, Toolkit/Collection, Check-in/Journal, Knowledge and Community), so this visual milestone is not marked complete. The local `/play` preview is guest-only because the root `.env.local` points to production and is intentionally excluded. The isolated Docker E2E database is used for authenticated synthetic persistence checks and fixture cleanup.

The earlier transient Next “1 Issue” occurred during partial source synchronization into a live watched preview. Current fresh DevTools/Next logs show no persistent issue. Independent human content review, privacy/security review, community member blocking/muting, analytics small-cell/retention review and account-switch browser isolation remain open. Do not deploy or claim production readiness.
## Master Prompt 07 — onboarding status (2026-10-28)

World-first onboarding and persistent World continuation are implemented and the isolated browser regression/build pass. The journey uses existing gameplay components and a verified fixture account; E2E did not send a real email or test the real Supabase Auth callback/new-guest link lifecycle. The 20-minute pending handoff is consent-gated and email-bound but uses plaintext localStorage, which requires privacy/security review before production. The local preview is guest-only; .env.local remains production-configured and was excluded. No production changes occurred.

Milestone: PARTIAL. Release: NOT READY. Remaining gates include actual isolated Auth + mail capture, guest OTP/callback recovery, account switching, temporary sensitive-state handling, member blocking/muting, analytics suppression/retention review, and qualified approval of real health content. Do not deploy.
### Latest Master Prompt 07 test clarification

Latest isolated E2E is guest-first and exercises the real callback route using a loopback mock OTP/Auth service and a synthetic signed test identity. It captures pending-email screenshots, resumes the selected Quest, creates a single World, and verifies same-ID resume. This verifies application orchestration only; real provider delivery, callback-token lifecycle, expired links and account switching remain unverified. The preview is guest-only and production .env.local was excluded. Plaintext short-lived localStorage handoff requires security/privacy review. Milestone PARTIAL; release NOT READY.
### Live preview correction

No stable local playable preview is currently verified. Port 3210 is occupied and returns the Next not-found fallback at /play; that existing process was not touched. A task-owned isolated 3211 attempt had the same result and was stopped. The full E2E served current source at 3220 and passed, then stopped on cleanup. Release/milestone status remains PARTIAL / NOT READY; do not present 3210 as a working preview.


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
## Master Prompt 08 V2 — release status (2026-10-28)

**NOT READY / PARTIAL.** The guest `/play` visual preview is verified at `http://127.0.0.1:3234/play`, but no isolated Supabase Auth or local mail inbox is available for the requested real owner registration/verification journey. `.env.local` points to production and was not used. No production data, email, schema or deployment was changed.

Blocking product gaps: no two detailed region scenes, no Luna/Lumi sprite/companion engine, no normalized account-owned personalized Journey Context (Health/Gout in particular), no in-region learning mini-games/Skills progression, and no confirmed per-Journey loadout switching. Existing independent V1 World, Toolkit, Knowledge, Boss, Rewards, Daily Check-in, Journal and Community backends are not equivalent to the requested integrated two-map gameplay. Human content review and privacy/security gates remain open.

The six unreleased Overworld regions remain visible and are centrally gated from new Quiz/World creation. Do not infer that decorative legacy map unlocks make them playable. See Master Prompt 08 acceptance reports for the matrix and test evidence.

## Master Prompt 08 Final V2 — release status

Status remains **NOT READY**. Local Supabase Auth and email capture are absent; the verified preview is guest/read-only. Region-map assets/renderer, pet assets/engine and canonical Quiz-driven Journey personalization remain incomplete. Real health content review and privacy/security release gates remain open. No production data, credentials, emails or deployment were changed.

## Milestone 09B release status — 2026-10-29

**NOT READY for production.** Isolated owner Auth, local email confirmation, authenticated RPG World presentation, two region scenes and tested Gout topic continuity are available on local build 3238. Current detailed-map art is provisional SVG; no topic-matched reviewed Gout content is available, and several approved learning/progression systems remain incomplete. Human content, privacy and security gates remain open. No production system was modified or deployed. See `OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.


## 09C release status — 2026-10-29

Visual/gameplay infrastructure slice remains PARTIAL and is not a production release. Care Plan schema/API has only been applied to the isolated local owner demo. Still required: independent privacy/security review of sensitive medication records and retention/export/deletion; approved reviewed Health/Sleep content; production RLS/Auth validation; full learning/Boss/reward checks; final hand-painted map/NPC art; mobile pinch/performance validation; existing human content, privacy and security gates. No production DB/service was changed.

## 09D-R status — 2026-10-29

The two region scenes now have a movement prototype, but this is not release-ready art or collision architecture. Human art review, real mobile gesture/performance QA, complete reviewed Health/Sleep Catalog and Knowledge, and existing security/privacy/content release gates remain open. No production DB/service was changed.


## Latest local navigation status — 2026-10-29

Local owner-demo regression PASS for latest browser assertions only; owner URL 3249 and local inbox 54324. Production release remains NOT READY/PARTIAL: authored corridors are not full collision polygons; no physical mobile or FPS measurement; environment and NPC assets are not human-approved; Mini-games/Skill levels and production content review remain incomplete. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.
