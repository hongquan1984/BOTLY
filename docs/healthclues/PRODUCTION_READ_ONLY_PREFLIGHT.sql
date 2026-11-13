-- HealthClues production preflight. SELECT-only; safe to paste into Supabase SQL Editor.
-- Run sections separately. Do not run migrations or change grants/policies from this file.

-- 1) Presence and kind of relevant Botly/HealthClues relations.
select n.nspname as schema_name, c.relname as relation_name,
       case c.relkind when 'r' then 'table' when 'v' then 'view'
         when 'm' then 'materialized view' when 'p' then 'partitioned table'
         else c.relkind::text end as relation_kind
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'supabase_migrations')
  and (c.relname like 'healthclues%' or c.relname like 'wellness%'
       or c.relname in ('newsletter_subscribers', 'schema_migrations'))
order by n.nspname, c.relname;

-- 2) Supabase CLI migration ledger presence. Run section 3 only when this is non-NULL.
select to_regclass('supabase_migrations.schema_migrations') as migration_ledger;

-- 3) All applied migration versions, when the ledger exists. Compare the full
-- history with every local migration (001 onward) before considering db push.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- 4) Columns and types for the two HealthClues tables, if present.
select table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('healthclues_profiles', 'healthclues_discovery_content')
order by table_name, ordinal_position;

-- 5) RLS enabled/forced state.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('healthclues_profiles', 'healthclues_discovery_content',
                    'wellness_articles', 'wellness_article_translations',
                    'wellness_plans', 'newsletter_subscribers')
order by c.relname;

-- 6) Policies on relevant relations.
select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('healthclues_profiles', 'healthclues_discovery_content',
                    'wellness_articles', 'wellness_article_translations',
                    'wellness_plans', 'newsletter_subscribers')
order by tablename, policyname;

-- 7) Explicit table grants for application roles.
select table_name, grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('healthclues_profiles', 'healthclues_discovery_content',
                     'wellness_articles', 'wellness_article_translations',
                     'wellness_plans', 'newsletter_subscribers')
order by table_name, grantee, privilege_type;

-- 8) HealthClues indexes and constraints, when those relations exist.
select schemaname, tablename, indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename in ('healthclues_profiles', 'healthclues_discovery_content')
order by tablename, indexname;

select con.conrelid::regclass as table_name, con.conname as constraint_name,
       con.contype as constraint_type, pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con
where con.conrelid in (
  select c.oid
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('healthclues_profiles', 'healthclues_discovery_content')
)
order by table_name, constraint_name;

-- 9) Run only when the table and the evidence/content_type/status columns exist.
-- Counts expose no content. Nonzero invalid_source_count must be resolved
-- before migration 013 can validate its stricter research-source CHECK.
select count(*) as invalid_source_count
from public.healthclues_discovery_content
where status = 'published' and content_type = 'research'
  and not (evidence ? 'sources'
    and jsonb_typeof(evidence->'sources') = 'array'
    and jsonb_array_length(case when jsonb_typeof(evidence->'sources') = 'array'
      then evidence->'sources' else '[]'::jsonb end) > 0);

-- 10) Run only when the table and review_status/status/content_type columns exist.
select review_status, status, content_type, count(*) as records
from public.healthclues_discovery_content
group by review_status, status, content_type
order by review_status, status, content_type;

-- 11) Search every non-system schema for the HealthClues relations. This is
-- catalog-only and read-only; it also catches a table outside public.
select n.nspname as schema_name, c.relname as relation_name,
       case c.relkind when 'r' then 'table' when 'v' then 'view'
         when 'm' then 'materialized view' when 'p' then 'partitioned table'
         else c.relkind::text end as relation_kind,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and c.relname in ('healthclues_profiles', 'healthclues_discovery_content')
order by n.nspname, c.relname;
