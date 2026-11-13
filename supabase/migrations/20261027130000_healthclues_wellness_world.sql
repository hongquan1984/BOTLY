-- HealthClues V1 persistent Wellness Toolkit and World.
-- Additive only. Apply to the existing Botly Supabase project after the migration ledger/schema preflight.
-- No catalog entries are seeded or approved by this migration.

create table if not exists public.healthclues_catalog_items (
  id text primary key,
  slug text not null unique,
  item_type text not null check (item_type in ('food_ingredient','herbal_ingredient','recipe','nutrition_habit','reduce_habit','movement','breathing','mindfulness','lifestyle')),
  slot_key text not null check (slot_key in ('consume','reduce','practice')),
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  active boolean not null default false,
  recommendation_eligible boolean not null default false,
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not recommendation_eligible or (active and review_status = 'reviewed'))
);
alter table public.healthclues_catalog_items drop constraint if exists healthclues_catalog_slot_type_check;
alter table public.healthclues_catalog_items add constraint healthclues_catalog_slot_type_check
  check ((slot_key='consume' and item_type in ('food_ingredient','herbal_ingredient','recipe','nutrition_habit')) or (slot_key='reduce' and item_type='reduce_habit') or (slot_key='practice' and item_type in ('movement','breathing','mindfulness','lifestyle')));
create index if not exists healthclues_catalog_eligible_idx on public.healthclues_catalog_items (slot_key, item_type, id) where active and review_status='reviewed' and recommendation_eligible;

create table if not exists public.healthclues_catalog_item_versions (
  catalog_item_id text not null references public.healthclues_catalog_items(id) on delete restrict,
  version integer not null check (version > 0),
  name text not null,
  description text not null,
  icon_key text,
  evidence_class text not null default 'not_assessed' check (evidence_class in ('not_assessed','general_wellness','limited','moderate','strong','not_applicable')),
  evidence_summary text,
  evidence_sources jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_sources)='array'),
  safety_notes text,
  contraindications jsonb not null default '[]'::jsonb check (jsonb_typeof(contraindications)='array'),
  source_provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(source_provenance)='object'),
  reviewed_by text,
  reviewed_at timestamptz,
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (catalog_item_id, version)
);

create table if not exists public.healthclues_usage_methods (
  id text primary key,
  slug text not null unique,
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  active boolean not null default false,
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  check (not active or review_status='reviewed')
);
create table if not exists public.healthclues_usage_method_versions (
  method_id text not null references public.healthclues_usage_methods(id) on delete restrict,
  version integer not null check (version > 0),
  name text not null,
  instructions jsonb not null default '[]'::jsonb check (jsonb_typeof(instructions)='array'),
  estimated_minutes integer check (estimated_minutes between 0 and 1440),
  safety_notes text,
  review_status text not null check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (method_id, version)
);
create table if not exists public.healthclues_usage_method_items (
  method_id text not null,
  method_version integer not null,
  catalog_item_id text not null,
  item_version integer not null,
  relationship text not null default 'uses' check (relationship in ('uses','contains','performed_with','supports')),
  is_required boolean not null default true,
  display_order integer not null default 0,
  primary key (method_id, method_version, catalog_item_id),
  foreign key (method_id, method_version) references public.healthclues_usage_method_versions(method_id, version) on delete restrict,
  foreign key (catalog_item_id, item_version) references public.healthclues_catalog_item_versions(catalog_item_id, version) on delete restrict
);

create table if not exists public.healthclues_recipe_combos (
  id text not null,
  version integer not null check (version > 0),
  recipe_item_id text not null,
  recipe_item_version integer not null,
  method_id text,
  method_version integer,
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (id, version),
  foreign key (recipe_item_id, recipe_item_version) references public.healthclues_catalog_item_versions(catalog_item_id, version) on delete restrict,
  foreign key (method_id, method_version) references public.healthclues_usage_method_versions(method_id, version) on delete restrict,
  check ((method_id is null) = (method_version is null)),
  check (not active or review_status='reviewed')
);
create table if not exists public.healthclues_journey_combos (
  id text not null,
  version integer not null check (version > 0),
  name text not null,
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  active boolean not null default false,
  rationale text,
  safety_compatibility jsonb not null default '{}'::jsonb,
  partial_acceptance text not null default 'optional_components' check (partial_acceptance in ('all_or_nothing','optional_components')),
  created_at timestamptz not null default now(),
  primary key (id, version),
  check (not active or review_status='reviewed')
);
create table if not exists public.healthclues_journey_combo_components (
  combo_id text not null,
  combo_version integer not null,
  slot_key text not null check (slot_key in ('consume','reduce','practice')),
  catalog_item_id text not null,
  item_version integer not null,
  method_id text,
  method_version integer,
  required boolean not null default false,
  display_order integer not null default 0,
  rationale text,
  primary key (combo_id, combo_version, slot_key, catalog_item_id),
  foreign key (combo_id, combo_version) references public.healthclues_journey_combos(id, version) on delete cascade,
  foreign key (catalog_item_id, item_version) references public.healthclues_catalog_item_versions(catalog_item_id, version) on delete restrict,
  foreign key (method_id, method_version) references public.healthclues_usage_method_versions(method_id, version) on delete restrict,
  check ((method_id is null) = (method_version is null))
);

create table if not exists public.healthclues_personal_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description)<=1000),
  slot_key text not null check (slot_key in ('consume','reduce','practice')),
  review_status text not null default 'unreviewed' check (review_status='unreviewed'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);
create table if not exists public.healthclues_catalog_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  personal_tool_id uuid references public.healthclues_personal_tools(id) on delete set null,
  proposed_name text not null,
  proposed_type text not null,
  normalized_name text not null,
  possible_matches jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','linked','created','changes_requested','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);
create index if not exists healthclues_catalog_proposals_pending_idx on public.healthclues_catalog_proposals(created_at) where status='pending';

create table if not exists public.healthclues_wellness_worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  title text not null default 'My Wellness World' check (char_length(title) between 1 and 100),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);
create table if not exists public.healthclues_branches (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null,
  title text not null,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  unique (id,user_id),
  foreign key (world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
create table if not exists public.healthclues_journeys (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  started_on date not null,
  request_key uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id),
  unique (user_id,request_key),
  foreign key (branch_id,user_id) references public.healthclues_branches(id,user_id) on delete cascade
);
create index if not exists healthclues_journeys_user_status_idx on public.healthclues_journeys(user_id,status,started_on desc);

create table if not exists public.healthclues_toolkit_collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_id text references public.healthclues_catalog_items(id) on delete restrict,
  personal_tool_id uuid,
  saved_at timestamptz not null default now(),
  unique (id,user_id),
  unique (user_id,catalog_item_id),
  unique (user_id,personal_tool_id),
  foreign key (personal_tool_id,user_id) references public.healthclues_personal_tools(id,user_id) on delete cascade,
  check (num_nonnulls(catalog_item_id,personal_tool_id)=1)
);
create table if not exists public.healthclues_toolkit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  branch_id uuid not null,
  journey_id uuid not null,
  collection_id uuid,
  catalog_item_id text,
  item_version integer,
  method_id text,
  method_version integer,
  personal_tool_id uuid,
  slot_key text not null check (slot_key in ('consume','reduce','practice')),
  status text not null default 'equipped' check (status in ('equipped','in_collection','paused','archived')),
  schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(schedule)='object'),
  started_on date not null default current_date,
  ended_on date,
  replaced_by uuid references public.healthclues_toolkit_entries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id),
  foreign key (world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key (branch_id,user_id) references public.healthclues_branches(id,user_id) on delete cascade,
  foreign key (journey_id,user_id) references public.healthclues_journeys(id,user_id) on delete cascade,
  foreign key (collection_id,user_id) references public.healthclues_toolkit_collection(id,user_id) on delete restrict,
  foreign key (catalog_item_id,item_version) references public.healthclues_catalog_item_versions(catalog_item_id,version) on delete restrict,
  foreign key (method_id,method_version) references public.healthclues_usage_method_versions(method_id,version) on delete restrict,
  foreign key (personal_tool_id,user_id) references public.healthclues_personal_tools(id,user_id) on delete cascade,
  check ((catalog_item_id is null) = (item_version is null)),
  check ((method_id is null) = (method_version is null)),
  check (num_nonnulls(catalog_item_id,personal_tool_id)=1),
  check (ended_on is null or ended_on>=started_on)
);
create index if not exists healthclues_toolkit_entries_user_idx on public.healthclues_toolkit_entries(user_id,status,started_on desc);
create index if not exists healthclues_toolkit_entries_catalog_idx on public.healthclues_toolkit_entries(catalog_item_id,method_id) where catalog_item_id is not null;

create table if not exists public.healthclues_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  local_date date not null,
  timezone text not null,
  note_private text check (note_private is null or char_length(note_private)<=4000),
  reflection_private text check (reflection_private is null or char_length(reflection_private)<=4000),
  revision integer not null default 1 check (revision>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,local_date),
  unique (id,user_id),
  foreign key (world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
create index if not exists healthclues_daily_checkins_world_date_idx on public.healthclues_daily_checkins(world_id,local_date desc);
create table if not exists public.healthclues_daily_usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_id uuid not null,
  toolkit_entry_id uuid not null,
  catalog_item_id text,
  item_version integer,
  method_id text,
  method_version integer,
  status text not null check (status in ('done','not_yet','skipped','not_suitable')),
  occurrence_count integer check (occurrence_count between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (checkin_id,toolkit_entry_id),
  unique (id,user_id),
  foreign key (checkin_id,user_id) references public.healthclues_daily_checkins(id,user_id) on delete cascade,
  foreign key (toolkit_entry_id,user_id) references public.healthclues_toolkit_entries(id,user_id) on delete cascade,
  foreign key (catalog_item_id,item_version) references public.healthclues_catalog_item_versions(catalog_item_id,version) on delete restrict,
  foreign key (method_id,method_version) references public.healthclues_usage_method_versions(method_id,version) on delete restrict,
  check ((catalog_item_id is null) = (item_version is null)),
  check ((method_id is null) = (method_version is null))
);
create index if not exists healthclues_usage_item_date_idx on public.healthclues_daily_usage_records(catalog_item_id,checkin_id) where catalog_item_id is not null;
create index if not exists healthclues_usage_method_idx on public.healthclues_daily_usage_records(method_id,checkin_id) where method_id is not null;
create table if not exists public.healthclues_usage_occurrences (
  id uuid primary key default gen_random_uuid(),
  usage_record_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurrence_no integer not null check (occurrence_no between 1 and 100),
  occurred_at timestamptz,
  local_time time,
  status text not null check (status in ('done','not_yet','skipped','not_suitable')),
  created_at timestamptz not null default now(),
  unique (usage_record_id,occurrence_no),
  foreign key (usage_record_id,user_id) references public.healthclues_daily_usage_records(id,user_id) on delete cascade
);
create table if not exists public.healthclues_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  journey_id uuid,
  checkin_id uuid,
  entry_date date not null,
  body text not null check (char_length(body)<=4000),
  self_report jsonb not null default '{}'::jsonb check (jsonb_typeof(self_report)='object'),
  visibility text not null default 'private' check (visibility='private'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key (journey_id,user_id) references public.healthclues_journeys(id,user_id) on delete set null,
  foreign key (checkin_id,user_id) references public.healthclues_daily_checkins(id,user_id) on delete set null
);
create index if not exists healthclues_journal_user_date_idx on public.healthclues_journal_entries(user_id,entry_date desc);

create table if not exists public.healthclues_public_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null,
  alias text not null check (char_length(alias) between 2 and 40),
  title text not null check (char_length(title) between 1 and 120),
  public_topics text[] not null default '{}',
  sharing_catalog_items boolean not null default false,
  sharing_methods boolean not null default false,
  sharing_timeline boolean not null default false,
  sharing_frequency boolean not null default false,
  sharing_reflections boolean not null default false,
  consent_version text not null,
  consented_at timestamptz not null,
  status text not null default 'active' check (status in ('active','revoked','removed','moderated')),
  projection jsonb not null default '{}'::jsonb check (jsonb_typeof(projection)='object'),
  updated_at timestamptz not null default now(),
  unique (id,user_id),
  unique (journey_id),
  foreign key (journey_id,user_id) references public.healthclues_journeys(id,user_id) on delete cascade
);
create index if not exists healthclues_public_journey_active_idx on public.healthclues_public_journeys(updated_at desc) where status='active';
create table if not exists public.healthclues_public_tool_usages (
  id uuid primary key default gen_random_uuid(),
  public_journey_id uuid not null references public.healthclues_public_journeys(id) on delete cascade,
  catalog_item_id text not null references public.healthclues_catalog_items(id) on delete restrict,
  method_id text references public.healthclues_usage_methods(id) on delete restrict,
  match_item_consent boolean not null default false,
  match_method_consent boolean not null default false,
  timeline_projection jsonb not null default '[]'::jsonb check (jsonb_typeof(timeline_projection)='array'),
  updated_at timestamptz not null default now(),
  unique (public_journey_id,catalog_item_id,method_id),
  check (not match_method_consent or method_id is not null)
);
create unique index if not exists healthclues_public_tool_usage_unique_idx on public.healthclues_public_tool_usages(public_journey_id,catalog_item_id,coalesce(method_id,''));
create index if not exists healthclues_public_tool_usage_match_item_idx on public.healthclues_public_tool_usages(catalog_item_id,public_journey_id) where match_item_consent;
create index if not exists healthclues_public_tool_usage_match_method_idx on public.healthclues_public_tool_usages(method_id,public_journey_id) where match_method_consent and method_id is not null;
create table if not exists public.healthclues_journey_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  public_journey_id uuid not null references public.healthclues_public_journeys(id) on delete cascade,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (follower_user_id,public_journey_id)
);
create table if not exists public.healthclues_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('daily_checkin','learning','reflection','milestone','community_contribution')),
  source_id text not null,
  idempotency_key text not null,
  amount integer not null check (amount between 1 and 1000),
  reason_code text not null,
  created_at timestamptz not null default now(),
  unique (user_id,idempotency_key)
);
create index if not exists healthclues_xp_user_time_idx on public.healthclues_xp_ledger(user_id,created_at desc);
create table if not exists public.healthclues_reward_definitions (
  id text primary key,
  version integer not null default 1 check (version>0),
  reward_type text not null check (reward_type in ('badge','map_unlock','cosmetic')),
  title text not null,
  eligibility jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.healthclues_user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null references public.healthclues_reward_definitions(id) on delete restrict,
  source_key text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id,reward_id,source_key)
);
create table if not exists public.healthclues_user_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null,
  milestone_day integer not null check (milestone_day in (7,14,30,60,90)),
  reached_on date not null,
  awarded_at timestamptz,
  unique (user_id,journey_id,milestone_day),
  foreign key (journey_id,user_id) references public.healthclues_journeys(id,user_id) on delete cascade
);
create table if not exists public.healthclues_email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opted_in boolean not null default false,
  timezone text not null default 'UTC',
  local_send_time time not null default '09:00',
  frequency text not null default 'daily' check (frequency in ('daily','weekdays','weekly')),
  paused boolean not null default false,
  consent_version text,
  consented_at timestamptz,
  updated_at timestamptz not null default now(),
  check (not opted_in or (consent_version is not null and consented_at is not null))
);
create table if not exists public.healthclues_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null,
  local_date date not null,
  idempotency_key text not null unique,
  state text not null default 'queued' check (state in ('queued','claimed','sent','failed','canceled')),
  attempts integer not null default 0 check (attempts between 0 and 10),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  provider_message_id text,
  safe_error_code text,
  created_at timestamptz not null default now(),
  unique (user_id,local_date,template_key)
);
create index if not exists healthclues_notification_due_idx on public.healthclues_notification_deliveries(scheduled_at) where state='queued';
create table if not exists public.healthclues_community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  public_journey_id uuid not null references public.healthclues_public_journeys(id) on delete cascade,
  reason_code text not null check (reason_code in ('medical_claim','privacy','harassment','spam','other')),
  details text check (details is null or char_length(details)<=2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolver_id text
);
create table if not exists public.healthclues_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null check (actor_type in ('member','reviewer','moderator','system')),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists healthclues_audit_entity_idx on public.healthclues_audit_events(entity_type,entity_id,created_at desc);

-- RLS defaults closed. User-owned tables are visible only to the authenticated owner.
do $$ declare t text; begin
  foreach t in array array['healthclues_personal_tools','healthclues_catalog_proposals','healthclues_wellness_worlds','healthclues_branches','healthclues_journeys','healthclues_toolkit_collection','healthclues_toolkit_entries','healthclues_daily_checkins','healthclues_daily_usage_records','healthclues_usage_occurrences','healthclues_journal_entries','healthclues_xp_ledger','healthclues_user_rewards','healthclues_user_milestones','healthclues_email_preferences','healthclues_notification_deliveries'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('drop policy if exists owner_access on public.%I',t);
    execute format('create policy owner_access on public.%I for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
  end loop;
end $$;
alter table public.healthclues_journey_follows enable row level security;
revoke all on public.healthclues_journey_follows from public,anon;
grant select,insert,update,delete on public.healthclues_journey_follows to authenticated;
drop policy if exists owner_access on public.healthclues_journey_follows;
create policy owner_access on public.healthclues_journey_follows for all to authenticated using (follower_user_id=auth.uid()) with check (follower_user_id=auth.uid());
alter table public.healthclues_community_reports enable row level security;
revoke all on public.healthclues_community_reports from public,anon;
grant select,insert on public.healthclues_community_reports to authenticated;
drop policy if exists owner_access on public.healthclues_community_reports;
drop policy if exists report_read_own on public.healthclues_community_reports;
create policy owner_access on public.healthclues_community_reports for insert to authenticated with check (reporter_user_id=auth.uid() and status='open' and resolved_at is null and resolver_id is null);
create policy report_read_own on public.healthclues_community_reports for select to authenticated using (reporter_user_id=auth.uid());

-- XP, reward grants, delivery state and reports are not writable by clients.
revoke insert, update, delete on public.healthclues_xp_ledger from authenticated;
revoke insert, update, delete on public.healthclues_user_rewards from authenticated;
revoke insert, update, delete on public.healthclues_user_milestones from authenticated;
revoke insert, update, delete on public.healthclues_catalog_proposals from authenticated;
revoke insert, update, delete on public.healthclues_notification_deliveries from authenticated;
revoke update, delete on public.healthclues_community_reports from authenticated;
grant select on public.healthclues_catalog_proposals,public.healthclues_user_milestones,public.healthclues_notification_deliveries to authenticated;
grant insert on public.healthclues_catalog_proposals,public.healthclues_community_reports to authenticated;
revoke insert,update,delete on public.healthclues_toolkit_entries,public.healthclues_daily_checkins,public.healthclues_daily_usage_records,public.healthclues_usage_occurrences from authenticated;
grant select on public.healthclues_toolkit_entries,public.healthclues_daily_checkins,public.healthclues_daily_usage_records,public.healthclues_usage_occurrences to authenticated;
revoke all on public.healthclues_audit_events from public, anon, authenticated;
alter table public.healthclues_audit_events enable row level security;
grant select, insert, update, delete on public.healthclues_audit_events to service_role;

-- Catalog and reviewed templates are read-only to users. No content rows are approved here.
do $$ declare t text; begin
  foreach t in array array['healthclues_catalog_items','healthclues_catalog_item_versions','healthclues_usage_methods','healthclues_usage_method_versions','healthclues_usage_method_items','healthclues_recipe_combos','healthclues_journey_combos','healthclues_journey_combo_components','healthclues_reward_definitions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
drop policy if exists reviewed_catalog_read on public.healthclues_catalog_items;
create policy reviewed_catalog_read on public.healthclues_catalog_items for select to anon,authenticated using (active and review_status='reviewed');
drop policy if exists reviewed_catalog_version_read on public.healthclues_catalog_item_versions;
create policy reviewed_catalog_version_read on public.healthclues_catalog_item_versions for select to anon,authenticated using (exists(select 1 from public.healthclues_catalog_items i where i.id=catalog_item_id and i.active and i.review_status='reviewed'));
drop policy if exists reviewed_methods_read on public.healthclues_usage_methods;
create policy reviewed_methods_read on public.healthclues_usage_methods for select to anon,authenticated using (active and review_status='reviewed');
drop policy if exists reviewed_method_versions_read on public.healthclues_usage_method_versions;
create policy reviewed_method_versions_read on public.healthclues_usage_method_versions for select to anon,authenticated using (review_status='reviewed' and exists(select 1 from public.healthclues_usage_methods m where m.id=method_id and m.active and m.review_status='reviewed'));
drop policy if exists reviewed_method_items_read on public.healthclues_usage_method_items;
create policy reviewed_method_items_read on public.healthclues_usage_method_items for select to anon,authenticated using (exists(select 1 from public.healthclues_usage_method_versions v join public.healthclues_usage_methods m on m.id=v.method_id where v.method_id=healthclues_usage_method_items.method_id and v.version=healthclues_usage_method_items.method_version and v.review_status='reviewed' and m.active and m.review_status='reviewed'));
drop policy if exists reviewed_recipe_combos_read on public.healthclues_recipe_combos;
create policy reviewed_recipe_combos_read on public.healthclues_recipe_combos for select to anon,authenticated using (active and review_status='reviewed');
drop policy if exists reviewed_journey_combos_read on public.healthclues_journey_combos;
create policy reviewed_journey_combos_read on public.healthclues_journey_combos for select to anon,authenticated using (active and review_status='reviewed');
drop policy if exists reviewed_journey_combo_components_read on public.healthclues_journey_combo_components;
create policy reviewed_journey_combo_components_read on public.healthclues_journey_combo_components for select to anon,authenticated using (exists(select 1 from public.healthclues_journey_combos c where c.id=combo_id and c.version=combo_version and c.active and c.review_status='reviewed'));
drop policy if exists active_rewards_read on public.healthclues_reward_definitions;
create policy active_rewards_read on public.healthclues_reward_definitions for select to anon,authenticated using (active);

-- Public projection rows intentionally have no direct anon/authenticated table grant; serve via an allowlisted API.
alter table public.healthclues_public_journeys enable row level security;
alter table public.healthclues_public_tool_usages enable row level security;
revoke all on public.healthclues_public_journeys,public.healthclues_public_tool_usages from public,anon,authenticated;
grant all on public.healthclues_public_journeys,public.healthclues_public_tool_usages to service_role;

-- Client-created collection, world, journal and preference rows remain owner scoped. Direct writes to review state,
-- Catalog identity, XP, public projection, notifications and audit are denied by grants and/or absent policies.
insert into public.healthclues_reward_definitions(id,version,reward_type,title,eligibility,active) values
 ('journey-milestone-7',1,'badge','First Trail Marker','{"elapsed_days":7}'::jsonb,true),
 ('journey-milestone-14',1,'badge','Two Week Explorer','{"elapsed_days":14}'::jsonb,true),
 ('journey-milestone-30',1,'badge','One Month Wayfinder','{"elapsed_days":30}'::jsonb,true),
 ('journey-milestone-60',1,'map_unlock','New Region','{"elapsed_days":60}'::jsonb,true),
 ('journey-milestone-90',1,'cosmetic','Seasoned Explorer','{"elapsed_days":90}'::jsonb,true)
on conflict(id) do nothing;

create or replace function public.healthclues_create_world_v1(
  p_user_id uuid, p_request_key uuid, p_topic_key text, p_title text, p_timezone text,
  p_started_on date, p_selections jsonb
) returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_world public.healthclues_wellness_worlds%rowtype;
  v_branch public.healthclues_branches%rowtype;
  v_journey public.healthclues_journeys%rowtype;
  v_row jsonb;
  v_item public.healthclues_catalog_items%rowtype;
  v_collection uuid;
  v_slots text[] := array[]::text[];
  v_entries integer := 0;
  v_method text;
  v_method_version integer;
begin
  if p_user_id is null or p_request_key is null or jsonb_typeof(p_selections)<>'array' or jsonb_array_length(p_selections)>3 then
    raise exception 'invalid_world_request' using errcode='22023';
  end if;
  if p_timezone is null or length(p_timezone)>100 or p_title is null or length(trim(p_title)) not between 1 and 100 then
    raise exception 'invalid_world_metadata' using errcode='22023';
  end if;
  insert into public.healthclues_wellness_worlds(user_id,timezone) values(p_user_id,p_timezone)
    on conflict(user_id) do update set updated_at=now() returning * into v_world;
  select * into v_journey from public.healthclues_journeys where user_id=p_user_id and request_key=p_request_key;
  if found then
    select * into v_branch from public.healthclues_branches where id=v_journey.branch_id and user_id=p_user_id;
    return jsonb_build_object('world_id',v_world.id,'branch_id',v_branch.id,'journey_id',v_journey.id,'reused',true);
  end if;
  insert into public.healthclues_branches(world_id,user_id,topic_key,title)
    values(v_world.id,p_user_id,left(coalesce(nullif(p_topic_key,''),'general'),80),left(trim(p_title),120)) returning * into v_branch;
  insert into public.healthclues_journeys(branch_id,user_id,title,started_on,request_key)
    values(v_branch.id,p_user_id,left(trim(p_title),120),coalesce(p_started_on,(now() at time zone p_timezone)::date),p_request_key) returning * into v_journey;
  for v_row in select value from jsonb_array_elements(p_selections) loop
    if coalesce(v_row->>'slot_key','') not in ('consume','reduce','practice') or (v_row->>'slot_key')=any(v_slots) then
      raise exception 'invalid_or_duplicate_slot' using errcode='22023';
    end if;
    v_slots := array_append(v_slots,v_row->>'slot_key');
    select * into v_item from public.healthclues_catalog_items i
      where i.id=v_row->>'catalog_item_id' and i.active and i.review_status='reviewed' and i.recommendation_eligible
        and i.slot_key=v_row->>'slot_key' and i.current_version=(v_row->>'item_version')::integer;
    if not found then raise exception 'catalog_item_not_eligible' using errcode='22023'; end if;
    v_method := nullif(v_row->>'method_id','');
    v_method_version := nullif(v_row->>'method_version','')::integer;
    if (v_method is null) <> (v_method_version is null) then raise exception 'invalid_method_version' using errcode='22023'; end if;
    if v_method is not null and not exists(
      select 1 from public.healthclues_usage_methods m
      join public.healthclues_usage_method_versions mv on mv.method_id=m.id and mv.version=v_method_version
      join public.healthclues_usage_method_items mi on mi.method_id=mv.method_id and mi.method_version=mv.version and mi.catalog_item_id=v_item.id
      where m.id=v_method and m.active and m.review_status='reviewed' and m.current_version=v_method_version and mv.review_status='reviewed'
    ) then raise exception 'usage_method_not_eligible' using errcode='22023'; end if;
    insert into public.healthclues_toolkit_collection(user_id,catalog_item_id) values(p_user_id,v_item.id)
      on conflict(user_id,catalog_item_id) do update set saved_at=healthclues_toolkit_collection.saved_at returning id into v_collection;
    insert into public.healthclues_toolkit_entries(user_id,world_id,branch_id,journey_id,collection_id,catalog_item_id,item_version,method_id,method_version,slot_key,status,schedule,started_on)
      values(p_user_id,v_world.id,v_branch.id,v_journey.id,v_collection,v_item.id,v_item.current_version,v_method,v_method_version,v_item.slot_key,'equipped',coalesce(v_row->'schedule','{}'::jsonb),v_journey.started_on);
    v_entries := v_entries+1;
  end loop;
  return jsonb_build_object('world_id',v_world.id,'branch_id',v_branch.id,'journey_id',v_journey.id,'entries_created',v_entries,'reused',false);
end; $$;

create or replace function public.healthclues_save_daily_checkin_v1(
  p_user_id uuid, p_world_id uuid, p_local_date date, p_timezone text,
  p_usage jsonb, p_note text default null, p_reflection text default null
) returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_checkin public.healthclues_daily_checkins%rowtype;
  v_row jsonb;
  v_entry public.healthclues_toolkit_entries%rowtype;
  v_usage_id uuid;
  v_occ jsonb;
  v_award integer := 0;
  v_milestone integer;
  v_milestone_row integer;
  v_total integer;
begin
  if p_user_id is null or p_local_date is null or length(coalesce(p_timezone,''))>100 or jsonb_typeof(p_usage)<>'array' or jsonb_array_length(p_usage)>100 then
    raise exception 'invalid_checkin_request' using errcode='22023';
  end if;
  if not exists(select 1 from public.healthclues_wellness_worlds where id=p_world_id and user_id=p_user_id) then
    raise exception 'world_not_owned' using errcode='42501';
  end if;
  insert into public.healthclues_daily_checkins(user_id,world_id,local_date,timezone,note_private,reflection_private)
    values(p_user_id,p_world_id,p_local_date,p_timezone,nullif(left(coalesce(p_note,''),4000),''),nullif(left(coalesce(p_reflection,''),4000),''))
    on conflict(user_id,local_date) do update set note_private=excluded.note_private,reflection_private=excluded.reflection_private,timezone=excluded.timezone,revision=healthclues_daily_checkins.revision+1,updated_at=now()
    returning * into v_checkin;
  for v_row in select value from jsonb_array_elements(p_usage) loop
    select * into v_entry from public.healthclues_toolkit_entries e
      where e.id=(v_row->>'toolkit_entry_id')::uuid and e.user_id=p_user_id and e.world_id=p_world_id;
    if not found then raise exception 'toolkit_entry_not_owned' using errcode='42501'; end if;
    if coalesce(v_row->>'status','') not in ('done','not_yet','skipped','not_suitable') then raise exception 'invalid_usage_status' using errcode='22023'; end if;
    insert into public.healthclues_daily_usage_records(user_id,checkin_id,toolkit_entry_id,catalog_item_id,item_version,method_id,method_version,status,occurrence_count)
      values(p_user_id,v_checkin.id,v_entry.id,v_entry.catalog_item_id,v_entry.item_version,v_entry.method_id,v_entry.method_version,v_row->>'status',nullif(v_row->>'occurrence_count','')::integer)
      on conflict(checkin_id,toolkit_entry_id) do update set status=excluded.status,occurrence_count=excluded.occurrence_count,updated_at=now()
      returning id into v_usage_id;
    delete from public.healthclues_usage_occurrences where usage_record_id=v_usage_id and user_id=p_user_id;
    if jsonb_typeof(v_row->'occurrences')='array' then
      for v_occ in select value from jsonb_array_elements(v_row->'occurrences') loop
        if coalesce(v_occ->>'status','') not in ('done','not_yet','skipped','not_suitable') then raise exception 'invalid_occurrence_status' using errcode='22023'; end if;
        insert into public.healthclues_usage_occurrences(usage_record_id,user_id,occurrence_no,occurred_at,local_time,status)
          values(v_usage_id,p_user_id,(v_occ->>'occurrence_no')::integer,nullif(v_occ->>'occurred_at','')::timestamptz,nullif(v_occ->>'local_time','')::time,v_occ->>'status');
      end loop;
    end if;
  end loop;
  -- Fixed participation XP once per local day. Count, dose, repetitions and outcome are never inputs.
  insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
    values(p_user_id,'daily_checkin',v_checkin.id::text,'daily-checkin:'||p_local_date::text,10,'eligible_checkin') on conflict(user_id,idempotency_key) do nothing;
  get diagnostics v_award = row_count;
  for v_milestone in select unnest(array[7,14,30,60,90]) loop
    if exists(select 1 from public.healthclues_journeys j where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_milestone-1)) then
      insert into public.healthclues_user_milestones(user_id,journey_id,milestone_day,reached_on)
        select p_user_id,j.id,v_milestone,j.started_on+(v_milestone-1) from public.healthclues_journeys j
        where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_milestone-1)
        on conflict(user_id,journey_id,milestone_day) do nothing;
      get diagnostics v_milestone_row = row_count;
      if v_milestone_row>0 then
        insert into public.healthclues_user_rewards(user_id,reward_id,source_key)
          select p_user_id,'journey-milestone-'||v_milestone::text,j.id::text from public.healthclues_journeys j where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_milestone-1)
          on conflict(user_id,reward_id,source_key) do nothing;
        insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
          select p_user_id,'milestone',j.id::text,'milestone:'||j.id::text||':'||v_milestone::text,10,'elapsed_day_milestone'
          from public.healthclues_journeys j where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_milestone-1)
          on conflict(user_id,idempotency_key) do nothing;
      end if;
    end if;
  end loop;
  select coalesce(sum(amount),0)::integer into v_total from public.healthclues_xp_ledger where user_id=p_user_id;
  return jsonb_build_object('checkin_id',v_checkin.id,'revision',v_checkin.revision,'xp_awarded',v_award>0,'xp_total',v_total);
end; $$;
create or replace function public.healthclues_award_elapsed_milestones_v1(p_user_id uuid,p_local_date date)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_day integer; v_count integer:=0; v_rows integer;
begin
  if p_user_id is null or p_local_date is null then raise exception 'invalid_milestone_request' using errcode='22023'; end if;
  for v_day in select unnest(array[7,14,30,60,90]) loop
    insert into public.healthclues_user_milestones(user_id,journey_id,milestone_day,reached_on)
      select p_user_id,j.id,v_day,j.started_on+(v_day-1) from public.healthclues_journeys j
      where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
      on conflict(user_id,journey_id,milestone_day) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows>0 then
      insert into public.healthclues_user_rewards(user_id,reward_id,source_key)
        select p_user_id,'journey-milestone-'||v_day::text,j.id::text from public.healthclues_journeys j
        where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
        on conflict(user_id,reward_id,source_key) do nothing;
      insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
        select p_user_id,'milestone',j.id::text,'milestone:'||j.id::text||':'||v_day::text,10,'elapsed_day_milestone'
        from public.healthclues_journeys j where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
        on conflict(user_id,idempotency_key) do nothing;
      v_count:=v_count+v_rows;
    end if;
  end loop;
  return v_count;
end; $$;
revoke all on function public.healthclues_create_world_v1(uuid,uuid,text,text,text,date,jsonb) from public,anon,authenticated;
revoke all on function public.healthclues_save_daily_checkin_v1(uuid,uuid,date,text,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.healthclues_award_elapsed_milestones_v1(uuid,date) from public,anon,authenticated;
grant execute on function public.healthclues_create_world_v1(uuid,uuid,text,text,text,date,jsonb) to service_role;
grant execute on function public.healthclues_save_daily_checkin_v1(uuid,uuid,date,text,jsonb,text,text) to service_role;
grant execute on function public.healthclues_award_elapsed_milestones_v1(uuid,date) to service_role;
notify pgrst, 'reload schema';
