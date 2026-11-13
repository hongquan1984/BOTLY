-- Migration 008: Night Companion Timezone & Bedtime Reminder System

-- 1. Extend night_companion_waitlist
alter table public.night_companion_waitlist
  add column if not exists waitlist_night2_consent boolean not null default true,
  add column if not exists waitlist_consented_at timestamptz not null default now(),
  add column if not exists night1_reminder_consent boolean not null default false,
  add column if not exists reminder_consented_at timestamptz,
  add column if not exists timezone text not null default 'UTC',
  add column if not exists bedtime text not null default '23:00',
  add column if not exists reminder_time text not null default '22:30',
  add column if not exists email_verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_token text,
  add column if not exists verification_sent_at timestamptz,
  add column if not exists reminder_status text not null default 'none',
  add column if not exists reminder_start_date date,
  add column if not exists reminder_end_date date,
  add column if not exists manage_token text;

create index if not exists night_companion_waitlist_manage_token_idx
  on public.night_companion_waitlist (manage_token) where manage_token is not null;

create index if not exists night_companion_waitlist_verification_token_idx
  on public.night_companion_waitlist (verification_token) where verification_token is not null;

-- 2. Create night_companion_reminders table for scheduled delivery jobs
create table if not exists public.night_companion_reminders (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references public.night_companion_waitlist(id) on delete cascade,
  sleep_date date not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending', -- pending, sent, skipped, cancelled, failed, expired
  idempotency_key text not null unique,
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  skip_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists night_companion_reminders_schedule_idx
  on public.night_companion_reminders (scheduled_for, status);

create index if not exists night_companion_reminders_waitlist_idx
  on public.night_companion_reminders (waitlist_id);

alter table public.night_companion_reminders enable row level security;
