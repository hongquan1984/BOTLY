# HealthClues Discovery Content Library and Matching

Updated: 2026-10-26

> Historical design and implementation snapshot. Its environment findings and test status below are superseded by [`ENVIRONMENT_STATE.md`](ENVIRONMENT_STATE.md) and [`RELEASE_PACKAGE_20261027.md`](RELEASE_PACKAGE_20261027.md), updated 2026-10-27. Keep this file as the content-model and matching rationale; do not use its old statements that test database/API work was unavailable as the current release status.

## Database integration execution plan (2026-10-26)

Before any additional code or database write, the checkout was inspected for environment separation and migration history:

- `.env.local` contains one Supabase project URL/ref and database connection variable names; values/credentials are not recorded here. `NEXT_PUBLIC_SITE_URL` points to `https://botly.vn`, so the configured target must be treated as production until proven otherwise.
- This checkout has no `supabase/config.toml`, no Supabase CLI, `psql`, or `pg_dump` executable, and only one Git branch (`master`). `.vercel/project.json` identifies the linked website project; it does not establish a separate Supabase development/staging project.
- A bounded read-only Postgres inspection was attempted using the configured connection variables in the sandbox; hostname resolution failed (`ENOTFOUND`). No database write was attempted. Local public discovery API returns 503; admin API returns 503 because the admin token/configuration is absent.
- The migration has not been applied. Migration history, RLS catalog state and backup/restore capability remain unverified until the configured database can be queried read-only outside the sandbox. No production change is authorized by this plan.

Required sequence: verify project/environment from read-only migration history and Supabase/Vercel environment scopes; inspect migrations for compatibility, grants, policy boundaries and rollback; use an existing authorized non-production target if one exists. If only Production is available, require explicit owner approval and a confirmed backup/recovery point before any write. Then apply only the needed forward migrations, verify tables/RLS/API, seed pending candidates, and test review transitions. Do not create another project. Database rollback is a reviewed compensating migration or agreed restore, not an assumed transaction rollback after commit.

## Audit before implementation

### Why the result slots were empty

- `src/data/healthclues-discoveries.ts` contained only two hard-coded records. Both were returned only for the exact `Balanced nutrition` topic and exact content interest (`Food & recipes` or `Research explained`). All other topic/preference combinations returned `null`.
- The Everyday Wellness Activity branch was hard-coded to `null`, so it could never produce a result.
- The quiz profile stored topic, content interests, presentation, activity time, refresh preference, two-week goal and safety level. It omitted country and food avoidance preferences; matching did not use format, time, goals, country or constraints.
- The result UI rendered all three empty placeholders even when a different useful resource could have been linked as a reading item.

### Existing source inventory

- `src/data/wellness-articles.ts` contains 8 English article records (paired with Vietnamese translations). Records have a public route, summary, sources, `reviewedAt` text and an evidence label. The static schema has no reviewer identity, discovery-specific review state, approval timestamp, active flag, country metadata, ingredient restrictions or structured recipe steps. A date/evidence label is not sufficient approval for personalized recommendation.
- `src/data/wellness-ebooks.ts` currently contains 6 available HealthClues ebooks with public routes and summaries. Availability is a delivery status; it is not discovery approval.
- `src/data/ebook-library.ts` contains 11 third-party/public-domain/source-page catalog entries and license/delivery notes. Several are historical remedy/herbal books, so they must remain reading references and must not be represented as current health guidance or personalized treatment.
- The published-article schema (`src/lib/published-articles.ts`, `src/lib/article-publishing.ts`, Supabase migrations 002/003) supports published article status, `reviewed_at`, sources, and optional structured `quick_recipe` ingredients/steps/avoidance notes. Publication and `reviewed_at` alone do not record a discovery reviewer, per-content approval, or recommendation status. Dynamic recipe records need discovery-specific moderation before use.
- Existing static article examples include a three-minute stress reset and beginner meditation practice with NCCIH source links and caution text. They are candidates for an editor to review, not automatically approved activities.
- No static HealthClues recipe has a complete locally structured ingredient list, steps and verified preparation-time field. One externally linked MyPlate salmon-skewer recipe is in the pending review queue; its source lists 20 minutes prep plus 15 minutes cooking. Do not label it a quick or five-minute recipe, and do not distribute it until reviewed.

Current source inventory (verified against the seed builder on 2026-10-27): 8 static English HealthClues articles + 6 available HealthClues ebooks + 3 official-source-backed candidates = 17 static import candidates. The builder classifies them as 2 activities, 8 research resources, 6 ebooks, and 1 externally linked recipe. Every seed is `needs_review`/`draft`. Ebook seeds have an empty evidence source list and therefore cannot pass the nonempty-source publication constraint until a reviewer adds and verifies sources. No candidate count is an approved/active recommendation count. The 11 third-party ebook catalog entries are separate from these 17 seeds.

### Restored-snapshot ebook delivery check (2026-10-27)

The isolated PostgreSQL 17.6 restore was queried for the six seed IDs. This is evidence about that snapshot only, not a fresh production inventory. `file` means the catalog row has a nonempty `downloadable_file_url`; `source` means it has a nonempty `source_url`.

| Candidate ID | Canonical published catalog slug in test restore | File | Public source | Release implication |
|---|---|---:|---:|---|
| `ebook-blood-sugar` | `everyday-food-pairings` | Yes | No | A PDF delivery target exists; discovery evidence still needs independent review. |
| `ebook-antioxidants` | `colorful-food-pairings` | Yes | No | A PDF delivery target exists; review all claims and sources. |
| `ebook-weight-management` | `satisfying-everyday-meals` | No | No | Do not activate as an ebook/resource until the real deliverable is added and verified. |
| `ebook-better-sleep` | `gentle-evening-food-drink` | No | No | Do not activate as an ebook/resource until the real deliverable is added and verified. |
| `ebook-gout-support` | `food-everyday-wellness-evidence` | No | No | Do not activate; no file/source was present, and no gout treatment material may be inferred from the generic page. |
| `ebook-liver-health` | `everyday-foods-liver-health` | Yes | No | A PDF delivery target exists; review detox/clinical claims and sources. |

The Admin API now checks that an ebook candidate's canonical published page resolves to a catalog row with an actual file or public source before activation. The check does not approve its medical claims or make the catalog row a verified clinical source. Test E2E confirms the Gout resource is rejected for lacking a deliverable, while an explicitly labeled E2E-only item with a real test PDF can exercise the distribution path. This guard must remain in place until production catalog availability is rechecked.

The admin candidate reader also loads up to 100 already-published Botly articles as additional `needs_review`/`draft` candidates; the static bulk-import action does not import those dynamic rows. Read-only SQL against the isolated restored snapshot `botly_cli_baseline_acl_test2` (not production) found 73 published English article rows; 49 in category `health-tips` have structured recipes with nonempty ingredients, steps, and sources. These 49 are promising real recipe candidates, not HealthClues approvals. The mapper leaves `estimatedMinutes` null for all dynamic rows, so the activation guard will reject a recipe until a reviewer verifies and records its preparation duration. Category mapping for dynamic articles is intentionally broad and must be corrected during review where the source supports a narrower topic. Existing article publication metadata is not discovery approval. The snapshot may differ from current production and must not be used as a current live count.

### Reviewer triage summary

- **Food & Recipes:** No static candidates qualify as recipes. The restored test snapshot contains 49 structured, sourced recipe candidates from published Botly articles. Review them individually; verify ingredients, steps, preparation time, restrictions and source before approval. Do not relabel ebooks as recipes.
- **Everyday Wellness Activities:** Two static candidates (stress reset and beginner meditation) have practical steps and safety copy, but still require editorial/safety review. Respect the user's activity safety hold and do not frame activities as treatment.
- **Research & Learn:** Six static articles and six ebooks can serve as reading candidates. Confirm every source and the scope of each health claim. Ebooks currently lack source entries in the discovery seed and need source metadata before they can be published.
- **Gout & uric acid:** The static catalog has one gout ebook candidate, but it is not approved and has no discovery evidence sources yet. Until reviewed, show only generally available, public educational material outside personalized treatment claims or return an empty-library state.
- **Healthy Weight / Sleep & Rest / Stress & Relaxation:** Matching candidates exist in the source catalog, but none is automatically eligible. Approval remains per-record; the empty-library fallback is the correct result when no matching reviewed item is active.

### Static review queue IDs

These are the exact static seed IDs emitted by `getDiscoveryCandidateSeeds()`. All begin in `needs_review` + `draft`; the tags below are routing hints, not medical approval.

| ID | Type | Topic tags | Review note |
|---|---|---|---|
| `static-article-balanced-plate-simple` | Research | Balanced nutrition; Healthy weight | Check nutrition language and audience scope. |
| `static-article-three-minute-stress-reset` | Activity | Stress & relaxation; General wellness | Verify steps, duration and breathing safety note. |
| `static-article-meditation-for-restless-beginners` | Activity | Stress & relaxation; Sleep & rest; General wellness | Verify duration, distress caveat and source. |
| `static-article-blood-sugar-pairings` | Research | Balanced nutrition | Review glucose claims and references. |
| `static-article-lentils-rice-blood-sugar` | Research | Balanced nutrition | Review glycemic-response claims and references. |
| `static-article-oats-berries-blood-sugar` | Research | Balanced nutrition | Review evidence scope and references. |
| `static-article-onion-honey-blood-sugar` | Research | Balanced nutrition | Ensure debunking context stays clear; review all claims and references. |
| `static-article-beans-toast-blood-sugar` | Research | Balanced nutrition | Review glycemic-response claims and references. |
| `ebook-blood-sugar` | Ebook | Balanced nutrition | Add/verify discovery evidence sources; reading item only. |
| `ebook-antioxidants` | Ebook | Balanced nutrition | Add/verify discovery evidence sources; reading item only. |
| `ebook-weight-management` | Ebook | Healthy weight; Balanced nutrition | Add/verify discovery evidence sources; no weight-loss outcome promise. |
| `ebook-better-sleep` | Ebook | Sleep & rest | Add/verify discovery evidence sources; no sleep-treatment claim. |
| `ebook-gout-support` | Ebook | Gout & uric acid | Add/verify discovery evidence sources; exclude treatment/diet prescription claims. |
| `external-niams-gout-overview` | Research | Gout & uric acid | NIAMS educational source; verify summary and ensure no treatment inference. |
| `external-nhlbi-healthy-sleep-habits` | Research | Sleep & rest | NHLBI educational source; verify summary and scope. |
| `external-myplate-salmon-skewers` | Recipe | Healthy weight; Balanced nutrition | MyPlate/Seafood Nutrition Partnership; 35 minutes total per source; verify recipe, fish avoidance and food-safety note. |
| `ebook-liver-health` | Ebook | Balanced nutrition | Add/verify discovery evidence sources; exclude detox or clinical efficacy claims. |

This queue is a reviewer checklist, not a review result. No record is marked approved, reviewed, or active by this table.

### AI source check for lower-risk candidates

On 2026-10-27, the existing Harvard Healthy Eating Plate source and the NCCIH stress/meditation sources were opened and checked against three existing article candidates. Source scope, unsupported satiety/weight language, the exact three-minute stress protocol, and meditation safety caveats are recorded in [`CONTENT_REVIEW_TRIAGE_20261027.md`](CONTENT_REVIEW_TRIAGE_20261027.md). This is a pre-review aid only. It does not replace human editorial or qualified nutrition review, and none of the candidates was changed or activated.

## Phase 1 implementation specification

### Normalized catalog

Use a dedicated `healthclues_discovery_content` table and a typed source catalog. A record includes stable ID, real internal/external source URL, title, short summary, topic tags, content type (`recipe`, `activity`, `research`, `ebook`), estimated minutes, ingredients, restrictions, country relevance, source/evidence metadata, safety notes, review status, reviewer identity/time, and publication/active status.

Seed repository resources as `needs_review` and `draft`. Never derive discovery approval from published status, `reviewedAt`, evidence label, or a Trust Meter score. Existing source records remain intact. Admin approval must explicitly record the reviewer and review time, and must require a source/safety review confirmation. High-risk treatment, medication, disease-cure, weight-loss guarantee, interaction, or dosing claims are not eligible for discovery cards.

The Vietnamese admin screen uses the existing server-side `EBOOK_ADMIN_TOKEN` pattern. Mutations run through a no-store server route using the server-only Supabase service credential. Public retrieval returns only active, discovery-reviewed English records; no answer or profile is sent to that endpoint.

### Matching rules

Matching runs in the browser over the approved catalog using the minimized session profile: topic, content interests, preferred format, comfortable time, refresh preference, two-week focus, declared food avoidance and practical-content safety hold. Country relevance is used only where the source provides an explicit basis; otherwise it is neutral. A topic interest is not treated as diagnosis.

- Recipe cards require reviewed structured steps, ingredient/restriction metadata, and time metadata. If a short recipe is not eligible, a vetted ebook/guide may be shown as a reading resource with the format and reading time stated accurately; never label it a 5-minute recipe.
- Activity cards require reviewed practical instructions, source, time, and safety notes. Do not show a practical activity when the profile records a food/activity restriction or unresolved safety hold.
- Research & Learn cards require a real source and editorial review; summarize as educational reading, not personal medical advice.
- Match relevance and preferences first; limit output to one item per type and three total. Hide unmatched categories and offer one library return link rather than repeating three identical empty messages.
- Never select material because of `General treatment information` preference. Do not personalize treatment content.

### Interactions and persistence

`View / Read` opens the actual source. `Save for Later` is durable only for an authenticated user with separate consent and implemented server storage; otherwise it is clearly labeled/handled as a session-only state. `I've Tried It` appears only for actionable recipe/activity content. `Not Yet` and `Try Something Else` are local to the result session unless durable storage is implemented. Analytics receives none of these statuses or health answers.

Profile account saving remains separate from ebook delivery and marketing. Show the result to guests. Server persistence requires unchecked consent and authenticated account; provide resume after magic-link callback and delete/update controls. Do not report success until the database accepts the write. Pending profile data stays tab-local and is not joined to ebook/email records.

### Admin review fields

An item stays ineligible until all required source and safety fields have been reviewed and an admin records `reviewed_by`, `reviewed_at`, `review_status=reviewed`, and `status=published`. Admin can change tags, time, restrictions, country relevance, evidence/source notes and safety copy, or reject/archive an item. Missing facts remain blank/unknown; do not infer them.

## Required acceptance scenarios

1. Healthy Weight + Food & Recipes + Step-by-step recipes + 5 minutes prefers only an approved, structured recipe with suitable time and no matching restriction. Otherwise shows an appropriately labeled reading resource or library link.
2. Gout + Everyday Habits + Short Research Summaries can show only approved general wellness/research material; no disease treatment recommendation.
3. Sleep & Rest + 10–15 minutes can show an approved activity/resource whose actual time fits; safety notes remain visible.
4. Unmatched profile receives no fake card and one clear library path.
5. Draft/unreviewed content is never returned by public matching.
6. Safety hold excludes practical food/activity cards; eligible educational reading may remain.
7. Save consent, magic-link return, explicit save, retrieval and deletion are verified against the configured database/migration.
8. Mobile result and desktop result remain usable.
9. Ebook Hero and post-download CTAs still enter the same quiz and topic attribution remains editable.

## Implementation status

Audit was documented before code edits. Implemented locally:

- A normalized typed candidate library from 8 English static articles and 6 available HealthClues ebooks (14 local static records), plus dynamic published article candidates from the existing server article store when that store is reachable. Candidate review state starts as `needs_review` and publication state starts as `draft`.
- Migration `supabase/migrations/20261027080100_healthclues_discovery_content.sql` stores source/content fields, ingredients, instructions, restrictions, country relevance, evidence, safety notes, review identity/time and publication state. Database checks prohibit activating unreviewed items and require instructions/time for activities and recipes, ingredients for recipes, and sources for research.
- Token-protected Vietnamese admin page `/admin/healthclues-discoveries` and API. Admin must enter reviewer identity and explicitly confirm the source, claims, audience fit and safety review before activation. Draft review choices do not imply that content is approved.
- Public API returns only English rows where both `review_status=reviewed` and `status=published`. It accepts no quiz profile or answers. Matching runs locally in the browser and considers topic, declared content and specific interests, format, time ceiling, refresh cadence, two-week focus, country evidence, avoidance selections and practical-content safety holds.
- Result cards are hidden when unmatched. A single shared state offers guide/ebook library links. Reading resources remain labeled as reading and are never presented as timed recipes. `I've Tried It` appears only for recipes and activities. Interaction statuses are memory-only while the result is open and are described as such.
- Profile saving remains separate from ebook email/marketing, includes the current minimized topic/preferences/country/avoidance/safety-hold profile only after separate consent, resumes after same-device magic-link sign-in, and supports account restore/delete. A failed server operation is not reported as success.

No content is pre-marked discovery-reviewed by this change. The local static inventory has 14 candidate records requiring explicit review; 0 are approved for recommendation. The 11 historical/third-party ebook library items were identified but intentionally not promoted into recommendation candidates. Dynamic article candidates also start as `needs_review`/`draft`.

Validation: 10 matching assertions passed, covering short structured recipe preference, explicit reading fallback, gout research mapping, sleep activity timing, safety holds, draft/unreviewed exclusion, food avoidance, and weekly item cap. Targeted ESLint and `npm exec tsc -- --noEmit` passed. `npm run build` compiled and listed `/admin/healthclues-discoveries`, `/api/admin/healthclues-discoveries`, `/api/healthclues/discoveries`, and `/en/wellness/healthclues/quiz`. Local admin page returned HTTP 200. The local public discovery API returned HTTP 503 because the database catalog/migration is not available in that environment; admin API returned HTTP 503 because admin storage/configuration is not ready. Therefore no real content can be activated or live database profile restore tested in this checkout until configuration and migration are applied. No remote migration or deployment was performed.

## Environment integration result (2026-10-26)

Final read-only verification for this continuation:

- The only locally configured Supabase project ref matches its URL and is paired with the `botly.vn` site origin. Production RSS data and Storage host now confirm the deployed Botly content path uses that same project. No development or staging environment was found. Direct PostgreSQL `PGHOST` DNS fails; Supabase HTTPS REST works.
- No migration or seed write was performed. The production database's migration ledger, physical table state, RLS and backup status remain unverified. The current environment has no Supabase CLI, `psql`, or `pg_dump`.
- Runtime checks against local Next server: `/admin/healthclues-discoveries` returned 200; `GET /api/admin/healthclues-discoveries` returned 503 (`Admin review is not configured.`); `GET /api/healthclues/discoveries` returned 503 (`Reviewed discovery content is temporarily unavailable.`).
- Local static inventory is 14 records (8 articles and 6 available ebooks), all `needs_review` and `draft`: 0 authorized/reviewed, 0 active/distributable. A count-only REST query on the locally configured project returned 73 published English article translations for the separate dynamic candidate source. No content was marked reviewed. The 11 historical/third-party ebooks remain excluded.
- End-to-end database/API tests for Healthy Weight, Gout, Sleep, draft/rejected/disabled filtering, admin actions, profile persistence, and backup/restore could not be run because the catalog API is unavailable. Previous local matching unit checks (10 assertions), ESLint, TypeScript, and production build passed; those do not establish live database integration.

Required owner action before a production write: provision read-only Supabase Management API access with `database:read` / `database_read`, or run the SELECT-only preflight in `PRODUCTION_READ_ONLY_PREFLIGHT.sql`; then review migration history/schema and explicitly approve the exact production migration/seed operation after backup/recovery is confirmed. The static seed count is 14, not 15. A qualified reviewer must make any clinical-content approval decision. Production remains untouched.

## Existing Botly infrastructure discovery (2026-10-26)

Read-only Vercel/Supabase discovery results:

- Vercel CLI is installed and authenticated as the existing account. `.vercel/project.json` links this checkout to project `aiflow-automation` (`prj_KaYTumiO8O98FHHVB7gSY3uLct33`); `vercel project ls` identifies `https://www.botly.vn` as that project's latest production URL. This is the existing Botly production project, not a new project.
- Historical 2026-10-26 note: `vercel env ls` showed Production Supabase variables and no `EBOOK_ADMIN_TOKEN`; the CLI masked values and no env pull had yet been performed. On 2026-10-27, Production `SUPABASE_SECRET_KEY` was intentionally updated from the Botly local secret via stdin and the stable deployment was redeployed. The currently configured Vercel project ref still has not been compared by reading the URL value; `EBOOK_ADMIN_TOKEN` remains absent.
- The local `.env.local` Supabase URL ref agrees with its `SUPABASE_PROJECT_REF`. Its HTTPS hostname resolves and TCP/443 is reachable. The separate `PGHOST` hostname in `.env.local` fails DNS resolution (`ENOTFOUND`), identifying the actual failing endpoint as the direct Postgres host, not the Supabase Cloud URL. Supabase REST remains reachable from this environment.
- Read-only REST checks against the configured Supabase project: `wellness_articles` returns HTTP 200; `healthclues_profiles` and `healthclues_discovery_content` return PostgREST `PGRST205`, meaning they are not in the current PostgREST schema cache. This does not prove the physical tables are absent. Supabase CLI is not installed and direct PostgreSQL migration-history inspection is blocked by the unresolved `PGHOST`; migration ledger/history and RLS catalog remain unverified.
- Production Vercel's database-backed RSS route returned HTTP 200 with five article items, confirming the existing deployed Botly content path can reach its database. Vercel's Supabase env values are configured for Production. Because the CLI did not safely expose the production ref, equality between that ref and the local URL ref remains unverified rather than assumed.
- Production routes `/api/healthclues/discoveries`, `/api/admin/healthclues-discoveries`, and `/en/wellness/healthclues/quiz` all return HTTP 404. HealthClues code in this checkout has not been deployed. Local API findings remain: public discovery GET gives 503 because the catalog table is absent; admin GET gives 503 because `EBOOK_ADMIN_TOKEN` is missing. These are two separate causes.
- Existing Botly article publishing uses the same `supabaseRequest` server helper and `SUPABASE_URL`/secret-key configuration. The HealthClues review API reuses the existing `EBOOK_ADMIN_TOKEN` convention with timing-safe token comparison and correctly refuses service when the token is absent; it does not bypass authentication. No Vercel auth change was made.

Migration 012 is transaction-wrapped and uses `create table/index if not exists`, but that is not sufficient to call production application safe: a pre-existing incompatible table would not be reconciled, the remote migration ledger and live RLS state were not inspected, migration 011 is also absent from the REST-visible schema, and no production backup/restore point was verified. No `db reset`, `db push`, remote migration, seed, RLS change, Vercel link, env pull, or deployment was performed. Reuse of the existing production Supabase is technically demonstrated for current Botly article data; HealthClues schema/content integration still requires a verified environment and explicit approval before any production write.
- `git remote -v` returned no configured remote; source identity was verified through the existing Vercel project link and authenticated CLI instead.

## Final blocker work (2026-10-26)

- Vercel environment variables were verified through the logged-in CLI and official Vercel env API. The Supabase URL fields are Secrets (`decrypted: false`) and cannot be read back. Instead, a read-only comparison matched all five slugs in the production Botly RSS response to the 73 published English slugs from the local Supabase project; the response also contains the same project's Storage hostname. This confirms the existing production Botly content path uses the same project ref without disclosing secrets.
- Supabase Management API read-only SQL was not available: no Supabase CLI auth/PAT or `SUPABASE_ACCESS_TOKEN` exists in the inspected environment. The correct owner-provided scope is `database:read` with `database_read`; the server service-role key is not an acceptable Management API token. `docs/healthclues/PRODUCTION_READ_ONLY_PREFLIGHT.sql` contains SELECT-only catalog, ledger, RLS, policy, grant, index and constraint checks for SQL Editor fallback.
- The earlier statement that PGRST205 means a table is absent is narrowed: it only proves the table is missing from the current PostgREST schema cache, not from `pg_catalog`. Physical existence/history still need the SQL preflight.
- Historical count correction before external-source candidates were added: 14, not 15 (8 articles + 6 available ebooks). The configured database has 73 published English article translations which the dynamic source can display as pending review. The admin import operation only bulk-inserts the current static seeds, using `ON CONFLICT DO NOTHING`; it cannot overwrite a previous review or activate content.
- HealthClues admin now separates approve (stays draft) from activate, and has request-changes/reject actions and status counters. The API requires the existing timing-safe `EBOOK_ADMIN_TOKEN`; no default token or RLS bypass was added. Static import always writes `needs_review` + `draft`.
- Preserved migration 012 as an immutable migration and added `013_healthclues_review_workflow.sql` for the new `changes_requested` state and a strict nonempty research-source constraint. Sequence must be determined from the remote migration ledger before any write.
- Validation completed locally: matching tests (10 assertions), targeted ESLint, TypeScript no-emit, and optimized Next build pass. Local page/quiz routes return 200. Admin API returns 503 because token is absent; the pending-import POST also returns 503 before persistence; public discoveries returns 503 while the table/schema cache is unavailable. Production HealthClues routes remain 404; no deployment or database write was performed.


## Superseding validation update — 2026-10-27

The earlier statement above that database/API E2E could not run describes the initial preflight only and is superseded by the isolated PostgreSQL 17.6/PostgREST test stack documented in `RELEASE_PACKAGE_20261027.md`. The latest fail-closed HTTP/browser E2E passed against actual HTTP responses. Healthy Weight recipe matching now uses a clearly labeled synthetic `E2E TEST` recipe fixture isolated to the test database; it does not claim that a real recipe has passed content review. Sleep matching uses the test-only reviewed activity path. The Gout candidate remains `needs_review`/`draft`, is absent from public delivery, and returns no personalized Gout item. A separate matching assertion confirms an explicitly reviewed research resource can match Gout as education. No real candidate received qualified clinical approval; temporary test records were removed/reset after E2E. The current restored catalog has no deliverable Gout resource; do not activate the existing unsourced ebook.
