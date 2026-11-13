-- Private, minimized audit trail for the deterministic recommender. No quiz answers or notes copied here.
create table if not exists public.healthclues_recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.healthclues_wellness_worlds(id) on delete cascade,
  catalog_item_id text not null references public.healthclues_catalog_items(id),
  item_version integer not null,
  event_type text not null check (event_type in ('shown','saved','equipped','dismissed','replaced','feedback')),
  reason_codes text[] not null default '{}',
  feedback_code text check (feedback_code is null or feedback_code in ('not_interested','too_difficult','no_time','want_alternative')),
  engine_version text not null default 'hc-personalized-rules-v1',
  event_key uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id,event_key),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
alter table public.healthclues_recommendation_events enable row level security;
revoke all on public.healthclues_recommendation_events from public,anon,authenticated;
grant select,insert on public.healthclues_recommendation_events to service_role;
create index if not exists healthclues_recommendation_history_owner_world on public.healthclues_recommendation_events(user_id,world_id,created_at desc);
