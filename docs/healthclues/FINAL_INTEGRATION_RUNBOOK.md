# HealthClues integration runbook

Updated: 2026-10-26

> Historical preflight only. Test/CLI/E2E status was updated on 2026-10-27 in `TEST_RESTORE_20261027.md`, `MIGRATION_NAME_MAP_20261027.md` and `RELEASE_PACKAGE_20261027.md`. Statements below about the CLI being unavailable, backup/restore not being tested, or HTTP E2E not being run are superseded for the isolated test environment. The production evidence below has not been freshly revalidated and does not authorize a production write.

## Latest production evidence and current blockers

- Owner-reported SQL results for ref `rswmadukvegraxfcdbcb`: `supabase_migrations.schema_migrations`, `public.healthclues_profiles`, and `public.healthclues_discovery_content` returned NULL; `public.wellness_articles` exists. This establishes that the CLI ledger and the two HealthClues tables are absent at those names in the queried schemas. It does not establish whether either HealthClues table exists in another schema.
- `PRODUCTION_READ_ONLY_PREFLIGHT.sql` now includes section 11, a catalog-only search for both HealthClues relations across every non-system schema. Its 12 statements were statically checked: each starts with `SELECT`, with no write/DDL/RLS/grant tokens. Run section 11 only; do not repeat the already-returned SQL sections.
- No Supabase PAT/Management API token, Session Pooler connection string, `pg_dump`, `pg_restore`, `psql`, or Supabase CLI is available in this environment. The configured direct DB host is not a verified Session Pooler endpoint. Therefore no production dump or isolated restore test was performed, and no plan/automated-backup entitlement could be independently confirmed.
- Before any write, the owner must inspect the existing project's **Database → Backups** page for plan, last successful backup, retention and (if enabled) PITR recovery window. Supabase database backups do not include Storage object bytes; protect those separately if required. A logical DB dump should be made from the Session Pooler URI shown by that project's **Connect** panel, stored outside Git, inspected with `pg_restore --list`, then actually restored to an isolated disposable database before it is called verified.

## Read-only checks completed

- Vercel project `aiflow-automation` has Supabase variables scoped to Production. `vercel env run -e production --` did not expose the sensitive URL/keys to the child process. The official Vercel env API reported the URL variables as secret and `decrypted: false`; no secret was printed or pulled to disk. Production RSS returned five article slugs that all matched the local Supabase project's published English slugs, and the response contained that project's storage hostname. This read-only cross-check confirms the production Botly content path uses the same existing Supabase project ref.
- Supabase Management API read-only SQL was not called: no Supabase CLI login/PAT or `SUPABASE_ACCESS_TOKEN` is available in the inspected environment. The Supabase service-role key is not a Management API credential and must not be substituted.
- REST `PGRST205` means a relation is not available in the current PostgREST schema cache; it does not by itself prove that the relation is absent from PostgreSQL. Use `PRODUCTION_READ_ONLY_PREFLIGHT.sql` to establish catalog state and migration history.
- A count-only REST check against the local configured project found 73 published English article translations. The local static seed builder yields 14 records (8 English static articles + 6 available ebooks), not 15. Do not invent or auto-approve a fifteenth record. Existing published article rows are separate dynamic review candidates and are also emitted as `needs_review`/`draft`.

## Required read-only SQL authorization

Preferred remote route is Supabase Management API `POST /v1/projects/{ref}/database/query/read-only`, with an authorized scoped PAT/OAuth token carrying `database:read` and `database_read`. This is a read-only endpoint. A Supabase Data API service-role key is not valid for this Management API. If no such token can be provisioned, an owner should run `PRODUCTION_READ_ONLY_PREFLIGHT.sql` in the existing project's SQL Editor and provide the result sets without any user data.

### Supabase SQL Editor fallback

1. Open the existing project's Dashboard and verify the project ref in the Dashboard URL is `rswmadukvegraxfcdbcb`.
2. Open **SQL Editor** and create a new query. Open `docs/healthclues/PRODUCTION_READ_ONLY_PREFLIGHT.sql` in the checkout and paste only the requested SELECT sections; the file contains no DDL/DML, RLS or grant statements.
3. Run section 1 and section 2 first. Run section 3 only when section 2 returns a non-NULL migration ledger. Run sections 4–8 for catalog metadata. Run sections 9–10 only if section 1 confirms the catalog table exists and the required columns are present.
4. Return the result grids (schema/migration metadata only). Do not export table contents, credentials or user profile data. If any query errors, report its section number and error message.

The preflight file was statically checked: all 12 SQL statements start with `SELECT`. Sections 3, 9 and 10 are intentionally conditional so a missing ledger/table does not get confused with a successful empty result. Section 11 searches all non-system schemas for the two HealthClues relations.

## Migration review

Files and database objects:

1. `011_healthclues_profiles.sql`: creates `public.healthclues_profiles` with `IF NOT EXISTS`; FK to `auth.users(id)` with cascade delete; JSONB profile, consent version/time, update time; enables RLS; removes public/anon grants; grants CRUD to `authenticated`; adds an own-user-only policy. The table guard does not reconcile an existing incompatible definition, and the policy has no duplicate guard, so rerunning against a partially/already applied schema can fail.
2. `012_healthclues_discovery_content.sql`: transaction creates `public.healthclues_discovery_content` and `healthclues_discovery_active_idx`; adds validation constraints; enables RLS; revokes public/anon/authenticated access; grants CRUD to `service_role`. It uses `IF NOT EXISTS`, which does not reconcile a pre-existing incompatible table/index.
3. `013_healthclues_review_workflow.sql`: replaces the review-status check to add `changes_requested`; adds a strict research-source check requiring `evidence.sources` to exist, be an array and be nonempty before publish. It is separate from 012 so an already-applied 012 is not silently rewritten.

No migration has been executed. Do not run 011/012/013 until the read-only ledger and catalog results are reconciled. If all are absent: confirm backup/recovery, apply 011 then 012 then 013 through the approved migration mechanism, verify schema/RLS/grants/ledger, then seed only pending rows. If 011/012 are already recorded, inspect the live schema and apply 013 only if its effects are absent. If tables exist but REST says PGRST205, investigate schema cache before changing schema. Never repair history by editing the migration ledger manually.

### Production migration sequence (not yet approved or executed)

1. The reported production ledger is NULL while `wellness_articles` exists. **Do not run `db push` or replay 001–010.** Multiple old migrations contain unguarded table/policy creation or data changes: 002 unconditionally creates `wellness_articles`; 001/002 create policies without duplicate guards; 003 creates publishing objects; 004 changes article columns/function; 005 replaces analytics; 006–008 add Night Companion schema; 009 creates ebook tables, seeds and policies; 010 changes the Storage bucket and ebook delivery records/functions. The live schema may already include these effects, so an absent CLI ledger cannot safely be treated as an empty database.
2. First obtain the section 11 result and full read-only catalog comparison. In a separate working copy, use the official Supabase CLI against the existing ref to pull/read the live schema, but decline any prompt to update or repair remote migration history. Keep the legacy 001–010 files unchanged for audit; do not put them in the pending migration path or mark them applied merely because `wellness_articles` exists. Validate the baseline against the live schema, then compare 011–013 against it. Do not use `migration repair` until each legacy effect is proven present; repair changes only the migration ledger and is not a substitute for schema comparison. Do not use `db push` during baseline discovery.
3. After baseline reconciliation, use `supabase migration list --linked` and inspect complete output. If history still differs from actual schema, stop. Use migration repair only after exact object-by-object verification and explicit approval.
3. Once the history is reconciled, run `supabase db push --dry-run`. Continue only if the preview lists the exact intended pending migration files and no earlier Botly migrations. If the direct DB host still fails, restore database connectivity through an authorized connection mode or use an approved Management API migration operation; do not apply migration SQL in the Dashboard editor.
4. Check a database backup and separately protect any required Storage object bytes. Prove an isolated restore before relying on the backup. Then obtain explicit approval for the listed migration versions. Apply through the tracked CLI workflow (`supabase db push`) so each applied migration is recorded. Verify `supabase migration list` and rerun catalog/RLS checks.
5. Import the 17 current static seeds only after schema verification and separate import approval. The admin import action uses conflict-ignore and writes every imported row as `needs_review` + `draft`; it does not approve or publish.

### Backup verification

Backup status has not been verified. In the existing Supabase Dashboard, open **Database → Backups** and confirm the project plan, latest successful backup timestamp, retention window and available restore action. If PITR is enabled, verify the displayed recovery window/latest restore point. Do not click Restore. If there is no usable recovery point (for example, a plan without automatic daily backups), stop and create a secure logical backup using an approved database connection before any production write. Supabase documents daily backup coverage and PITR by plan; restore is a project-level recovery operation and can cause downtime.

### Backup and failure handling

- The documented Supabase CLI backup workflow creates `roles.sql`, `schema.sql`, and `data.sql` via `supabase db dump` and the Session Pooler URI. Verify dump scope: standard CLI dump filters managed schemas; if preserving `auth.users` or custom Auth/Storage schema objects is required, capture and verify that scope separately under the documented Supabase procedure. Database dumps/backups do not contain Storage object bytes; copy required bucket objects separately and verify counts/checksums. Never infer coverage from filenames or successful exit codes. Before any approved production write, confirm current backup/PITR coverage, a recoverable checkpoint/time, and who will restore it. A schema-only migration backup must also retain the exact migration SQL and pre-change catalog output.
- Apply each migration as its own tracked operation. Stop on the first SQL error; do not seed candidates or mark a migration applied manually. Capture the database error and compare the post-failure catalog against the saved preflight.
- Recovery is a reviewed forward correction or restore from the agreed checkpoint. Dropping HealthClues tables is not an automatic rollback because profile/content rows could have been created after application.
- Post-migration verify tables, columns, FK, PK/indexes, checks, RLS flags, policies, grants, migration records, and PostgREST schema visibility. Test API reads and admin draft writes only in a permitted non-production target first.

## Admin and content review

- HealthClues routes require `EBOOK_ADMIN_TOKEN` and use timing-safe comparison. It is missing from the Vercel Production env list. The existing ebook-library route has an insecure hard-coded fallback (`botly_admin_2026`); do not reuse that fallback. No other role/session-based admin implementation was found in the inspected routes.
- `EBOOK_ADMIN_TOKEN` is shared by the ebook-library, HealthClues quiz-preview and HealthClues discovery admin APIs. Setting/rotating it changes access for all of those admin surfaces. Configure a high-entropy token as a Vercel Secret (server-side only) after owner approval; do not use the ebook route's legacy hard-coded fallback or expose the token to `NEXT_PUBLIC_*`. Preview currently lacks the required environment setup. A missing token must remain an explicit 503; unauthorized requests should return 401; do not bypass auth or RLS. This shared-token scheme does not provide individual admin identities or role separation.
- Static import inventory is 14 records, not 15. An additional 73 English published translations are available to the dynamic candidate builder; publication alone is not discovery review. Keep all imported candidates `needs_review` + `draft`, with no reviewer identity/time.
- Before any activation, a reviewer records source/use rights, exact content claims, topic fit, target audience, estimated duration, restrictions/ingredients, safety caveats and the evidence links. Refer disease treatment, medicine, herbs, interactions, dosage, clinical efficacy or disease-specific safety claims to a qualified health reviewer. Reject unsupported claims; request edits for overstatement or missing source/safety detail. No existing `reviewed_at`/Trust Score/published status substitutes for this review.

## Deploy gate

Required environment names for HealthClues: `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), server-only `SUPABASE_SECRET_KEY` (or legacy server-only `SUPABASE_SERVICE_ROLE_KEY`), and `EBOOK_ADMIN_TOKEN`. Existing Vercel Production has the Supabase names but not `EBOOK_ADMIN_TOKEN`; no Preview/Development vars were listed. Do not expose the service key or token to `NEXT_PUBLIC_*`.

Before production deploy: apply/verify approved migrations; import pending candidates; validate the admin token; test draft/reject/edit/activate transitions; verify public API filters to reviewed+published; test profile consent/save/delete under authenticated RLS; pass build, TypeScript, ESLint, matching tests, desktop/mobile route checks. Deploy only through the already-linked `aiflow-automation` project after explicit production approval. No deployment was performed for this runbook.


## Superseding state — 2026-10-27

The earlier inventory and local 503/404 observations above are historical pre-implementation findings. The isolated test restore now contains migrations through 017 and the end-to-end runner verifies HTTP Admin Review/Audit, public discovery filtering, consented profile persistence, dashboard/check-in/history, Ebook funnel, and responsive browser behavior. The complete filtered release patch applies cleanly to stable commit `3761b5210ae8faa7cf6cc9e0958351ebcef75b8e`. Production remains unchanged and its HealthClues routes remain undeployed; production schema/ledger and fresh recovery point still require verified read-only/backup evidence, the exposed Supabase key must be safely resolved, the production admin security hotfix/token remains a gate, and no clinical content may be activated before qualified review. See `RELEASE_PACKAGE_20261027.md` for the current authoritative release gates and artifact hash.

### Latest test and content update — 2026-10-27

Earlier isolated HTTP/browser E2E, production build, TypeScript, targeted HealthClues lint, 12 matching assertions, 351-file secret scan, and 20-error/115-warning lint no-increase baseline passed. The matching checks include exact card caps for Weekly (1), Three times a week (2), and Daily (up to 3). The ebook activation API rejects a published catalog page with neither a deliverable file nor a public source. The restored snapshot contains only 3 of 6 ebook files and no public `source_url` values; the Gout, Sleep and Weight Management ebook candidates must remain inactive until real deliverables and qualified content review exist. Earlier Healthy Weight recipe matching used a synthetic test-only recipe; the new MyPlate recipe candidate remains pending review and is not an approved recommendation. The Blood Sugar PDF is exercised separately. The latest E2E cleanup leaves all 17 static candidates pending/draft and zero active. Production has not been written or deployed. Refer to `DISCOVERY_CONTENT_LIBRARY.md` for snapshot-only inventory and `RELEASE_PACKAGE_20261027.md` for the current patch hash and production gates.
