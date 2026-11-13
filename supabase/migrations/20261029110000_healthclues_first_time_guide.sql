begin;

-- Stores only non-sensitive tutorial progress. Existing players are not forced into
-- a newly introduced guide; new Worlds receive the welcome stage on first API read.
create table if not exists public.healthclues_player_guide_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  guide_version smallint not null default 1 check (guide_version = 1),
  stage text not null check (stage in ('welcome','backpack','knowledge','completed','skipped')),
  updated_at timestamptz not null default now(),
  primary key (user_id, world_id),
  foreign key (world_id, user_id) references public.healthclues_wellness_worlds(id, user_id) on delete cascade
);

alter table public.healthclues_player_guide_state enable row level security;
revoke all on public.healthclues_player_guide_state from public, anon, authenticated;
grant all on public.healthclues_player_guide_state to service_role;

-- Returning players keep their existing flow. Only Worlds created after this
-- migration's rollout will be initialized as first-time onboarding by the API.
insert into public.healthclues_player_guide_state (user_id, world_id, stage)
select user_id, id, 'skipped'
from public.healthclues_wellness_worlds
on conflict (user_id, world_id) do nothing;

commit;
