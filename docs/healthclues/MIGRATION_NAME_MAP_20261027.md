# HealthClues migration name map

The active Supabase CLI migration sequence is:

| Version | File | Purpose/test result |
| --- | --- | --- |
| `20261027070000` | `20261027070000_botly_existing_schema_baseline.sql` | Schema-only baseline generated from the ACL-preserving PostgreSQL 17.6 restore for the application-owned `public` and `growth` schemas. It contains tables, functions, indexes, triggers, policies and grants, with HealthClues objects excluded. Replayed successfully on a fresh Supabase Postgres 17.6 test database. |
| `20261027080000` | `20261027080000_healthclues_profiles.sql` | Formerly `011_healthclues_profiles.sql`; applied by Supabase CLI to the isolated restored test copy. |
| `20261027080100` | `20261027080100_healthclues_discovery_content.sql` | Formerly `012_healthclues_discovery_content.sql`; applied by Supabase CLI to the isolated restored test copy. |
| `20261027080200` | `20261027080200_healthclues_review_workflow.sql` | Formerly `013_healthclues_review_workflow.sql`; applied by Supabase CLI to the isolated restored test copy. |
| `20261027080300` | `20261027080300_healthclues_review_audit.sql` | Audit extension; applied by Supabase CLI to the isolated restored test copy. |
| `20261027100000` | `20261027100000_healthclues_discovery_activity.sql` | Owner-only check-in/history table for the MVP dashboard. SQL/RLS and authenticated PostgREST CRUD passed. Supabase CLI tracking now also passes on the full restored copy: catalog verification showed the DDL had applied before a ledger ACL error, so the test-only ledger row was repaired with the CLI after exact schema verification; temporary test grants were reverted. `migration list` matches, dry-run is empty, and the next push is a no-op. |
| `20261027110000` | `20261027110000_healthclues_discovery_activity_privileges.sql` | Removes broad inherited table/sequence defaults: anon has no access; authenticated has only SELECT/INSERT/DELETE and sequence USAGE/SELECT; service_role retains full access. Applied and CLI-tracked on the full restored test copy; privilege assertions pass, dry-run is empty, and the next push is a no-op. |
| `20261027120000` | `20261027120000_healthclues_discovery_skipped_action.sql` | Adds persistent `skipped` to the activity action constraint, enabling dashboard “Try Something Else” to suppress an item on return visits. Applied and CLI-tracked on the restored test copy; REST and browser E2E verified persistence/suppression. |

The CLI-tracked restored test database is `botly_cli_baseline_acl_test2` in test container `botly-healthclues-cli-baseline-db`. The separate HTTP E2E database `botly_restore_verification` in `botly-healthclues-db-e2e` has the HealthClues SQL objects but no CLI ledger. Migrations 015, 016, and 017 are recorded on the full CLI-tracked restore. The restore had an ACL difference: `postgres` had no CREATE on `public` and only SELECT on the migration ledger. After catalog verification of the applied 015 objects, a temporary test-only ledger privilege enabled the CLI-supported history repair; temporary grants were reverted. Migration 016 was applied with a temporary ledger INSERT grant, also reverted after success. Migration 017 was applied/tracked on the same test restore.

The original numeric migration files remain byte-for-byte in `supabase/legacy_migrations/` as reference. They are outside the CLI migration scan and are not applied or marked individually:

| Former label | Current file | Test database execution |
| --- | --- | --- |
| `001_wellness.sql` | `supabase/legacy_migrations/001_wellness.sql` | Not replayed or marked |
| `002_wellness_articles.sql` | `supabase/legacy_migrations/002_wellness_articles.sql` | Not replayed or marked |
| `003_article_publishing.sql` | `supabase/legacy_migrations/003_article_publishing.sql` | Not replayed or marked |
| `004_mindful_haven_widgets.sql` | `supabase/legacy_migrations/004_mindful_haven_widgets.sql` | Not replayed or marked |
| `005_app_download_analytics.sql` | `supabase/legacy_migrations/005_app_download_analytics.sql` | Not replayed or marked |
| `006_night_companion.sql` | `supabase/legacy_migrations/006_night_companion.sql` | Not replayed or marked |
| `007_night_companion_waitlist.sql` | `supabase/legacy_migrations/007_night_companion_waitlist.sql` | Not replayed or marked |
| `008_night_companion_reminders.sql` | `supabase/legacy_migrations/008_night_companion_reminders.sql` | Not replayed or marked |
| `009_ebook_library.sql` | `supabase/legacy_migrations/009_ebook_library.sql` | Not replayed or marked |
| `010_enable_verified_ebook_files.sql` | `supabase/legacy_migrations/010_enable_verified_ebook_files.sql` | Not replayed or marked |

On a new test database restored from the backup, schema identity/count and the application-owned schema dump were verified before registering the single baseline version. `migration repair` was used only on that test copy to record `20261027070000`; the old versions `001`–`010` were never inserted. The CLI then applied `20261027080000`–`20261027080300` and forward versions through `20261027120000`. `migration list` matched all eight active versions, `db push --dry-run` listed no pending migrations, and a second `db push` reported the database up to date. No CLI or ledger operation was run against production.

Production still has no CLI ledger according to the previously confirmed snapshot. Before any production write, a read-only live schema comparison against this baseline and a fresh recovery point must be reviewed. Production baseline registration and HealthClues deployment remain separate, explicitly approved steps.

This map records test evidence only. It is not evidence that the production database has any migration-history rows.
