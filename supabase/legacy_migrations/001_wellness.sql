create extension if not exists "pgcrypto";

create table if not exists public.wellness_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text not null check (locale in ('en', 'vi')),
  source text not null default 'website',
  consented_at timestamptz not null default now(),
  status text not null default 'active',
  unique (email, locale)
);

alter table public.wellness_plans enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "Users can read their own wellness plan" on public.wellness_plans for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own wellness plan" on public.wellness_plans for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own wellness plan" on public.wellness_plans for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Newsletter writes go through the server route with the service-role key.
