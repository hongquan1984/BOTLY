-- Anonymous Night Companion beta profiles. Keep product identity separate from analytics IDs.
create table if not exists public.night_companion_profiles (
  id uuid primary key,
  access_token_hash text not null unique,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index if not exists night_companion_profiles_token_hash_idx
  on public.night_companion_profiles (access_token_hash);

create index if not exists night_companion_profiles_expires_at_idx
  on public.night_companion_profiles (expires_at);

alter table public.night_companion_profiles enable row level security;

-- The server API uses the service key after validating the anonymous access token.
-- No browser-facing Supabase policy is intentionally added.
