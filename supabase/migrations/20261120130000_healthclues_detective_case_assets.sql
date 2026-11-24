-- Player-facing detective assets. Content is joined into case_payload by the
-- mobile campaign API; the web renderer remains on its existing contract.
create table if not exists public.healthclues_detective_case_assets (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.healthclues_detective_case_files(id) on delete cascade,
  role text not null check (role in ('scene-main', 'mai-before', 'mai-after', 'clue-closeup')),
  clue_id text,
  sort_order integer not null default 0,
  storage_key text not null,
  public_url text not null,
  alt_text text,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, role, sort_order)
);

create index if not exists healthclues_detective_case_assets_case_idx
  on public.healthclues_detective_case_assets (case_id, role, sort_order);

alter table public.healthclues_detective_case_assets enable row level security;
drop policy if exists "Published detective assets are viewable by authenticated users"
  on public.healthclues_detective_case_assets;
create policy "Published detective assets are viewable by authenticated users"
  on public.healthclues_detective_case_assets for select to authenticated
  using (exists (
    select 1 from public.healthclues_detective_case_files c
    where c.id = case_id and c.publication_status = 'published'
  ));
