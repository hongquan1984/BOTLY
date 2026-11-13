begin;

-- Private, player-entered records are kept separate from reviewed Catalog,
-- Collection, Backpack and reward tables. They never grant game rewards.
create table if not exists public.healthclues_personal_care_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  record_type text not null check (record_type in ('user_method','medication')),
  name text not null check (length(btrim(name)) between 1 and 120),
  category text not null check (category in ('herbal_nutrition','wellness_practice','movement','other','medication')),
  catalog_item_id text,
  catalog_item_version integer,
  description text check (description is null or length(description) <= 1000),
  started_on date,
  personal_schedule text check (personal_schedule is null or length(personal_schedule) <= 300),
  private_notes text check (private_notes is null or length(private_notes) <= 2000),
  label_strength text check (label_strength is null or length(label_strength) <= 180),
  instructions_as_written text check (instructions_as_written is null or length(instructions_as_written) <= 500),
  schedule_kind text check (schedule_kind is null or schedule_kind in ('scheduled','as_needed','journal_only')),
  status text not null default 'active' check (status in ('active','paused','archived')),
  verification_status text not null default 'user_added_unverified' check (verification_status = 'user_added_unverified'),
  privacy_acknowledged_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id, world_id),
  foreign key (world_id, user_id) references public.healthclues_wellness_worlds(id, user_id) on delete cascade,
  foreign key (catalog_item_id, catalog_item_version) references public.healthclues_catalog_item_versions(catalog_item_id, version) on delete restrict,
  check ((catalog_item_id is null and catalog_item_version is null) or (catalog_item_id is not null and catalog_item_version is not null)),
  check ((record_type = 'user_method' and category <> 'medication' and label_strength is null and instructions_as_written is null and schedule_kind is null)
      or (record_type = 'medication' and category = 'medication' and description is null))
);

create index if not exists healthclues_personal_care_records_owner_idx
  on public.healthclues_personal_care_records(user_id, world_id, status, updated_at desc);

create table if not exists public.healthclues_personal_care_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  record_id uuid not null,
  local_date date not null,
  self_reported_status text not null check (self_reported_status in ('used','not_yet','skipped','unsure','prefer_not_to_say')),
  private_note text check (private_note is null or length(private_note) <= 1000),
  created_at timestamptz not null default now(),
  foreign key (record_id, user_id, world_id)
    references public.healthclues_personal_care_records(id, user_id, world_id) on delete cascade
);

create index if not exists healthclues_personal_care_events_owner_idx
  on public.healthclues_personal_care_events(user_id, world_id, local_date desc);

alter table public.healthclues_personal_care_records enable row level security;
alter table public.healthclues_personal_care_events enable row level security;
revoke all on public.healthclues_personal_care_records, public.healthclues_personal_care_events from public, anon, authenticated;
grant all on public.healthclues_personal_care_records, public.healthclues_personal_care_events to service_role;

commit;
