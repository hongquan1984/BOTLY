begin;

create table if not exists public.healthclues_discovery_content (
  id text primary key check (id ~ '^[a-z0-9-]{1,180}$'),
  locale text not null default 'en' check (locale in ('en', 'vi')),
  url text not null check (url ~ '^https://[^[:space:]]+$|^/en/wellness/[^[:space:]]+$'),
  title text not null check (length(btrim(title)) between 1 and 240),
  summary text not null check (length(btrim(summary)) between 1 and 4000),
  topic_tags text[] not null default '{}',
  content_type text not null check (content_type in ('recipe', 'activity', 'research', 'ebook')),
  estimated_minutes smallint check (estimated_minutes between 1 and 240),
  ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients) = 'array'),
  instructions jsonb not null default '[]'::jsonb check (jsonb_typeof(instructions) = 'array'),
  restrictions text[] not null default '{}',
  country_relevance text[] not null default '{}',
  evidence jsonb not null default '{"summary":"","sources":[]}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  safety_notes text,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'reviewed', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or (review_status = 'reviewed' and reviewed_by is not null and reviewed_at is not null)),
  check (review_status <> 'reviewed' or (reviewed_by is not null and reviewed_at is not null)),
  check (status <> 'published' or content_type not in ('recipe', 'activity') or
    (estimated_minutes is not null and jsonb_array_length(instructions) > 0)),
  check (status <> 'published' or content_type <> 'recipe' or jsonb_array_length(ingredients) > 0),
  check (status <> 'published' or content_type <> 'research' or jsonb_array_length(evidence->'sources') > 0)
);

create index if not exists healthclues_discovery_active_idx
  on public.healthclues_discovery_content (locale, status, review_status, content_type);
alter table public.healthclues_discovery_content enable row level security;
revoke all on public.healthclues_discovery_content from public, anon, authenticated;
grant select, insert, update, delete on public.healthclues_discovery_content to service_role;

commit;
