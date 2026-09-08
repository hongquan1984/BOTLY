begin;

create table public.wellness_categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_vi text not null,
  slug_en text not null unique,
  slug_vi text not null unique,
  sort_order integer not null default 0
);

insert into public.wellness_categories (id, name_en, name_vi, slug_en, slug_vi, sort_order) values
  ('weight', 'Weight Loss', 'Giảm cân', 'weight-management', 'giam-can', 1),
  ('healing', 'Healing', 'Chữa lành', 'healing', 'chua-lanh', 2),
  ('health-tips', 'Health Tips', 'Mẹo sức khỏe', 'health-tips', 'meo-suc-khoe', 3);

-- Internal mapping: the API resolves a Facebook Page to its category.
-- Keep Facebook IDs as text. Never store access tokens in this table.
create table public.wellness_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  facebook_page_id text not null unique check (facebook_page_id ~ '^[0-9]+$'),
  category_id text not null references public.wellness_categories(id),
  default_locale text not null default 'en' check (default_locale in ('en', 'vi')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, category_id)
);

-- One Facebook post = one article identity, with one or two translations.
-- Manual articles have both channel_id and facebook_post_id null.
create table public.wellness_articles (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.wellness_categories(id),
  channel_id uuid,
  facebook_post_id text,
  facebook_url text check (facebook_url ~ '^https://'),
  facebook_published_at timestamptz,
  cover_image_url text check (cover_image_url ~ '^https?://|^/[^/]'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (channel_id, category_id)
    references public.wellness_channels(id, category_id),
  check ((channel_id is null and facebook_post_id is null)
    or (channel_id is not null and facebook_post_id is not null
      and length(btrim(facebook_post_id)) > 0 and facebook_url is not null)),
  unique (channel_id, facebook_post_id)
);

create table public.wellness_article_translations (
  article_id uuid not null references public.wellness_articles(id) on delete cascade,
  locale text not null check (locale in ('en', 'vi')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 1 and 240),
  description text not null default '',
  eyebrow text not null default '',
  takeaway text not null default '',
  -- Matches the existing renderer: [{title, paragraphs: [], bullets?: []}].
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  -- [{label, url}]; the ingestion API must validate individual entries.
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  cover_image_alt text not null default '',
  reading_minutes smallint check (reading_minutes between 1 and 120),
  evidence text check (evidence in ('supported', 'promising', 'limited')),
  reviewed_at timestamptz,
  tool text check (tool in ('calorie-needs', 'stress-check', 'meditation-timer',
    'food-combinations', 'remedy-checker', 'wellness-planner')),
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (article_id, locale),
  unique (locale, slug),
  check (status <> 'published' or (published_at is not null
    and length(btrim(description)) > 0 and jsonb_array_length(sections) > 0))
);

create index wellness_articles_category_created_idx
  on public.wellness_articles(category_id, created_at desc);
create index wellness_article_translations_feed_idx
  on public.wellness_article_translations(locale, published_at desc, article_id)
  where status = 'published';

create function public.set_wellness_article_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wellness_articles_updated_at before update on public.wellness_articles
  for each row execute function public.set_wellness_article_updated_at();
create trigger wellness_article_translations_updated_at before update on public.wellness_article_translations
  for each row execute function public.set_wellness_article_updated_at();

alter table public.wellness_categories enable row level security;
alter table public.wellness_channels enable row level security;
alter table public.wellness_articles enable row level security;
alter table public.wellness_article_translations enable row level security;

revoke all on public.wellness_categories, public.wellness_channels,
  public.wellness_articles, public.wellness_article_translations from anon, authenticated;
grant select on public.wellness_categories, public.wellness_articles,
  public.wellness_article_translations to anon, authenticated;
grant all on public.wellness_categories, public.wellness_channels,
  public.wellness_articles, public.wellness_article_translations to service_role;

create policy "Public categories" on public.wellness_categories
  for select to anon, authenticated using (true);
create policy "Public published translations" on public.wellness_article_translations
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy "Public articles with published content" on public.wellness_articles
  for select to anon, authenticated using (exists (
    select 1 from public.wellness_article_translations t
    where t.article_id = wellness_articles.id
      and t.status = 'published' and t.published_at <= now()
  ));

commit;
