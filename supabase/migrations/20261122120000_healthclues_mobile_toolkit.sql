-- Persist the mobile library/bag per authenticated account.
-- The mobile client must not use device storage as the source of truth.
begin;

create table if not exists public.healthclues_mobile_toolkit_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('herb', 'sound', 'breath')),
  item_id text not null check (char_length(item_id) between 1 and 160),
  saved_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

alter table public.healthclues_mobile_toolkit_items enable row level security;
revoke all on table public.healthclues_mobile_toolkit_items from anon, authenticated;
grant all on table public.healthclues_mobile_toolkit_items to service_role;

create index if not exists healthclues_mobile_toolkit_items_user_saved_idx
  on public.healthclues_mobile_toolkit_items (user_id, saved_at desc);

commit;
