create table if not exists public.healthclues_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  consent_version text not null,
  consented_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.healthclues_profiles enable row level security;
revoke all on public.healthclues_profiles from anon, public;
grant select, insert, update, delete on public.healthclues_profiles to authenticated;
create policy "HealthClues users manage their own profile" on public.healthclues_profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
