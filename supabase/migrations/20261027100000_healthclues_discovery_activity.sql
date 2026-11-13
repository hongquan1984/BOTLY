begin;

create table if not exists public.healthclues_discovery_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.healthclues_profiles(user_id) on delete cascade,
  content_id text not null,
  action text not null check (action in ('viewed', 'saved', 'tried', 'not_yet', 'not_interested')),
  reason text check (reason is null or reason in ('not_enough_time', 'ingredients_unavailable', 'too_complicated', 'not_interested', 'other')),
  occurred_at timestamptz not null default now()
);

create index if not exists healthclues_discovery_activity_user_time_idx
  on public.healthclues_discovery_activity (user_id, occurred_at desc);
create index if not exists healthclues_discovery_activity_user_content_idx
  on public.healthclues_discovery_activity (user_id, content_id, occurred_at desc);

alter table public.healthclues_discovery_activity enable row level security;
revoke all on public.healthclues_discovery_activity from public, anon;
grant select, insert, delete on public.healthclues_discovery_activity to authenticated;
revoke all on sequence public.healthclues_discovery_activity_id_seq from public, anon;
grant usage, select on sequence public.healthclues_discovery_activity_id_seq to authenticated;
create policy "HealthClues users manage their own discovery activity"
  on public.healthclues_discovery_activity for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
