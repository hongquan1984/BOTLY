-- Migration 007: Night Companion Night 2 Email Waitlist
create table if not exists public.night_companion_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text not null unique,
  source text not null default 'journey_map',
  clicked_night int not null default 2,
  profile_id text,
  visitor_id text,
  session_id text,
  consent_copy_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists night_companion_waitlist_email_idx
  on public.night_companion_waitlist (normalized_email);

create index if not exists night_companion_waitlist_created_at_idx
  on public.night_companion_waitlist (created_at desc);

create index if not exists night_companion_waitlist_night_idx
  on public.night_companion_waitlist (clicked_night);

alter table public.night_companion_waitlist enable row level security;
-- No browser-facing public select policy: emails remain confidential.
-- Server uses service role key to insert and count waitlist entries.
