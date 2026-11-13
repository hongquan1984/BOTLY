# HealthClues restore and migration test

Test date: 2026-10-27

## Backup verification

- Backup: `C:\Users\Admin\AppData\Local\BotlyBackups\supabase-production-20261026-212811\botly-production-20261026-212811.dump`
- SHA-256: `1800B4092079F49ACEB1D16DFD669B23F078CA94ADB815A74CF58F459AE07B8C` (matches the supplied value)
- Size: 1,145,309 bytes
- Format: PostgreSQL custom archive, 952 TOC entries, dumped from PostgreSQL 17.6.
- Docker Desktop context: `desktop-linux`; Engine 29.3.1.
- Test image: `supabase/postgres:17.6.1.068`; `pg_restore` 17.6.

## Isolation and restore

- Container: `botly-healthclues-test-20261027`
- Volume: `botly_healthclues_test_20261027_data`
- Network mode: `none`; the application is not connected to the container.
- Backup bind mount: `/tmp/restore.dump`, read-only.
- A full ACL restore completed with exit code 0 into `botly_restore_verification` using `pg_restore --exit-on-error --no-owner`. The test-only cluster needed a `NOLOGIN` role named `supabase_realtime_admin`, referenced by the archive. Ownership was not restored; archive ACL entries were restored.
- A second database, `botly_production_snapshot`, was restored with `--no-owner --no-acl` while diagnosing a missing role. It is not the canonical grants-check database.
- Both databases are inside the new test volume. No existing container or volume was removed.

## Snapshot baseline before migrations

On `botly_restore_verification`:

- 89 non-system tables; `public.wellness_articles` exists with 73 rows; `auth.users` count is 0.
- `supabase_migrations.schema_migrations`, `public.healthclues_profiles`, and `public.healthclues_discovery_content` were absent.
- This confirms the snapshot needs only migrations 011–013 for HealthClues. Migrations 001–010 were not run or marked applied.
- Existing `wellness_articles` grants for `anon`, `authenticated`, and `service_role` were present after restoring ACL.

## Migrations and database checks

- Applied 011, then 012, then 013 with `psql -v ON_ERROR_STOP=1`; each completed successfully.
- `healthclues_profiles` has its auth.users foreign key, RLS, and one owner-only policy using `auth.uid() = user_id` for both visibility and writes.
- Two synthetic auth users were used in a rolled-back transaction: a user saw one own profile, saw zero other profiles, and an attempted update to the other profile affected zero rows.
- `anon` has no direct HealthClues table access. `authenticated` has profile table grants and is constrained by RLS. `service_role` has discovery content access. Both HealthClues tables have RLS enabled.
- Discovery constraints and indexes were present, including the strict published-research source constraint added by 013.
- Rerunning 012 and 013 succeeded. Rerunning 011 failed on its unguarded duplicate policy; it was executed with `--single-transaction` and is not idempotent.
- The audit migration `20261027080300_healthclues_review_audit.sql` was applied on the isolated test DB. Its write RPC inserts versioned state changes and audit rows in one transaction; the audit table is not directly mutable by API roles.
- Fourteen static candidates were imported into `botly_restore_verification`; all 14 began in `needs_review`/`draft`, and none was public.
- The later HTTP E2E exercised the running Next.js routes against a local PostgREST endpoint backed by this test cluster. It verified denied unauthenticated admin requests, import and DB state, public filtering, approve/activate/deactivate, quiz matching for Healthy Weight and Sleep, Gout exclusion while unreviewed, audit attribution to the shared admin credential, version/status/reason fields, and rejection of direct audit-table mutation.
- The admin page exposes the audit history in Vietnamese and explains that the shared token identifies a credential, not an individual reviewer.
- An initial aborted app run inherited `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `.env.local` because the app prefers those names over `NEXT_PUBLIC_SUPABASE_URL`. After its unauthenticated Admin calls, the public route issued a GET and returned 503; the run stopped before any authenticated write/import. The replacement harness, `scripts/run-healthclues-review-http-e2e.mjs`, inspects exact test container/image/network/DB names and loopback bindings, confirms PostgreSQL identity and PostgREST schema before starting Next.js, strips inherited Supabase keys, sets local-only URLs/JWTs, and removes app/test tokens from logs. A deliberate non-loopback app URL was rejected before any request. The final HTTP run passed and also smoke-tested the HealthClues quiz and Ebook routes. No production mutation or deploy occurred in the final run.

## Migration tracking limitations

- The official Windows CLI binary is version 2.122.0 and its SHA-256 matched the official release checksum. It runs with telemetry disabled and a workspace-local `SUPABASE_HOME`.
- A dedicated PostgreSQL 17.6 test container was restored from the read-only backup mount into a separate test database. The CLI used a TCP forwarder bound only to `127.0.0.1:5435`; a SQL identity query returned the expected database, PostgreSQL 17.6, 89 pre-HealthClues catalog tables, no migration ledger, no HealthClues profile table, and 73 `wellness_articles` rows.
- A schema-only baseline for `public` and `growth` was applied successfully to a fresh Supabase PostgreSQL 17.6 test database and the ACL-preserving schema dump was checked. The old SQL files `001`–`010` were preserved byte-for-byte under `supabase/legacy_migrations/` and removed from the CLI scan.
- On the restored copy, the CLI recorded only baseline `20261027070000`; dry-run listed only timestamped HealthClues `20261027080000`–`20261027080300`. CLI push applied those four migrations. The next `migration list` showed the baseline and four HealthClues versions applied; dry-run listed nothing; a second push returned up to date. No old migration was replayed/marked and no production operation was run. See `MIGRATION_NAME_MAP_20261027.md`.
- Follow-up dashboard migrations `20261027100000`–`20261027120000` add activity history, least-privilege grants, and persistent skipped actions. On the CLI-tracked full restore, migration history now matches all eight active versions and a fresh dry-run/push is a no-op. The separate app E2E restore has no ledger and received SQL only on the test database.
- The `176` figure is resolved: the archive TOC contains 88 `TABLE` definitions and 88 separate `TABLE DATA` entries; a broad `TABLE` text match counted both and called the combined 176 “tables.” The raw restore baseline had 89 catalog tables (the 88 archived definitions plus the `vault.secrets` table supplied by the Supabase Postgres image). After the two HealthClues base migrations, `botly_production_snapshot` has 91 tables; after the audit migration, `botly_restore_verification` has 92. These counts reconcile to the migration state and are not evidence of missing restore objects.
- No production migration, import, or deployment was performed.

## Application validation

- `npm run build` passed. Next.js 16.3 emitted the existing `middleware` → `proxy` deprecation warning.
- `npm exec -- tsc --noEmit` passed after the build.
- `node scripts/test-healthclues-discovery-matching.mjs` passed all 10 assertions.
- `.tmp/**` is excluded through ESLint `globalIgnores`; source checks remain enabled. The historical full-lint measurement on this restore was 21 errors and 114 warnings across 12 source files. Four JSX quote errors were fixed. HealthClues admin/public/API files, secret-hardened utility scripts, and fail-closed E2E scripts pass targeted lint. `npm run lint:baseline` passes with no increase over the documented non-HealthClues debt baseline; the ordinary full lint command still exits nonzero.
- Latest superseding completion pass (2026-10-27): `npx.cmd tsc --noEmit`, `npm.cmd run build`, targeted HealthClues ESLint, `npm.cmd run lint:baseline` (20 existing errors/115 warnings, no increase), secret scan (351 source files), and discovery matching (10 assertions) all passed. The existing Next.js middleware-to-proxy deprecation warning remains. Ebook activation now checks the catalog for an actual file/public source; see `DISCOVERY_CONTENT_LIBRARY.md` and the latest release package hash there.
- Latest HTTP/browser E2E correction: the Healthy Weight recipe path now activates a synthetic, clearly labeled test recipe through the admin API and verifies recipe type, time, ingredients and match in the actual public API. It is removed with its audit during teardown. The Blood Sugar PDF is tested separately. This proves the application flow, not real recipe-content review or production catalog readiness.
- Latest regression smoke in the same loopback E2E fetched the legacy RSS route with `category=health-tips`, verified HTTP 200 and an XML feed containing existing article items. Test state afterward is 14 pending/draft candidates, zero published content, and no synthetic recipe/audit rows.
- Discovery matching suite now passes 12 assertions: content type/fit, safety holds, unreviewed exclusions and Weekly/Three-times-weekly/Daily card caps.
- Final browser E2E passed on the isolated Next.js/PostgREST/PostgreSQL setup: direct quiz onboarding/result, reviewed Sleep recommendation, explicit-consent profile save verified in PostgREST, account profile restore/delete; dashboard cards, Save/Not Yet reason/persistent skip and return-visit suppression; history deletion; desktop/mobile no-overflow assertions. The test refuses non-allowlisted hosts or inherited production Supabase variables. Admin review/audit HTTP E2E and owner-only profile/activity REST E2E also passed.
