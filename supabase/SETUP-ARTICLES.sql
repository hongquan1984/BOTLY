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

begin;

create table public.wellness_channel_tokens (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.wellness_channels(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text not null default 'publisher',
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.wellness_channel_tokens enable row level security;
revoke all on public.wellness_channel_tokens from anon, authenticated;
grant all on public.wellness_channel_tokens to service_role;

-- One bounded row per channel; shared across all server instances and tokens.
create table public.wellness_publish_limits (
  channel_id uuid primary key references public.wellness_channels(id),
  window_start timestamptz not null,
  requests integer not null
);
alter table public.wellness_publish_limits enable row level security;
revoke all on public.wellness_publish_limits from anon, authenticated;
grant all on public.wellness_publish_limits to service_role;

create function public.publish_wellness_article(p_token_hash text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_channel public.wellness_channels;
  v_article public.wellness_articles;
  v_old public.wellness_article_translations;
  v_new public.wellness_article_translations;
  v_input jsonb;
  v_merged jsonb;
  v_result jsonb := '[]'::jsonb;
  v_created boolean := false;
  v_count integer;
  v_constraint text;
begin
  -- Locks serialize writes for a channel and token revocation with publishing.
  select c.* into v_channel from public.wellness_channels c
    join public.wellness_channel_tokens t on t.channel_id = c.id
    where t.token_hash = p_token_hash and t.revoked_at is null
    for update of c, t;
  if not found then raise exception using message = 'UNAUTHORIZED', errcode = 'P0001'; end if;
  if not v_channel.enabled or v_channel.facebook_page_id <> p_payload->>'facebook_page_id' then
    raise exception using message = 'CHANNEL_FORBIDDEN', errcode = 'P0001';
  end if;

  insert into public.wellness_publish_limits values (v_channel.id, now(), 1)
    on conflict (channel_id) do update set
      requests = case when wellness_publish_limits.window_start <= now() - interval '1 minute'
        then 1 else wellness_publish_limits.requests + 1 end,
      window_start = case when wellness_publish_limits.window_start <= now() - interval '1 minute'
        then now() else wellness_publish_limits.window_start end
    returning requests into v_count;
  if v_count > 30 then raise exception using message = 'RATE_LIMITED', errcode = 'P0001'; end if;

  select * into v_article from public.wellness_articles
    where channel_id = v_channel.id and facebook_post_id = p_payload->>'facebook_post_id';
  if not found then
    insert into public.wellness_articles (category_id, channel_id, facebook_post_id, facebook_url,
      facebook_published_at, cover_image_url)
      values (v_channel.category_id, v_channel.id, p_payload->>'facebook_post_id',
        p_payload->>'facebook_url', (p_payload->>'facebook_published_at')::timestamptz,
        p_payload->>'cover_image_url') returning * into v_article;
    v_created := true;
  else
    update public.wellness_articles set facebook_url = p_payload->>'facebook_url',
      facebook_published_at = case when p_payload ? 'facebook_published_at'
        then (p_payload->>'facebook_published_at')::timestamptz else facebook_published_at end,
      cover_image_url = case when p_payload ? 'cover_image_url'
        then p_payload->>'cover_image_url' else cover_image_url end
      where id = v_article.id returning * into v_article;
  end if;

  for v_input in select value from jsonb_array_elements(p_payload->'translations') loop
    select * into v_old from public.wellness_article_translations
      where article_id = v_article.id and locale = v_input->>'locale';
    if found then
      if v_old.slug <> v_input->>'slug' then
        raise exception using message = 'SLUG_IMMUTABLE', errcode = 'P0001';
      end if;
      if v_old.published_at is not null and v_input ? 'published_at'
        and v_old.published_at <> (v_input->>'published_at')::timestamptz then
        raise exception using message = 'PUBLICATION_TIME_IMMUTABLE', errcode = 'P0001';
      end if;
      v_merged := to_jsonb(v_old) || v_input;
    else
      v_merged := jsonb_build_object('article_id', v_article.id, 'eyebrow', '', 'takeaway', '',
        'sources', '[]'::jsonb, 'cover_image_alt', '', 'status', 'draft', 'created_at', now(),
        'updated_at', now()) || v_input;
    end if;
    if v_input ? 'published_at' and v_merged->>'status' <> 'published' then
      raise exception using message = 'INVALID_PUBLICATION_STATUS', errcode = 'P0001';
    end if;
    if v_merged->>'status' = 'published' and v_merged->>'published_at' is null then
      v_merged := v_merged || jsonb_build_object('published_at', now());
    end if;
    v_new := jsonb_populate_record(null::public.wellness_article_translations, v_merged);
    insert into public.wellness_article_translations select v_new.*
      on conflict (article_id, locale) do update set
        title = excluded.title, description = excluded.description, eyebrow = excluded.eyebrow,
        takeaway = excluded.takeaway, sections = excluded.sections, sources = excluded.sources,
        cover_image_alt = excluded.cover_image_alt, reading_minutes = excluded.reading_minutes,
        evidence = excluded.evidence, reviewed_at = excluded.reviewed_at, tool = excluded.tool,
        seo_title = excluded.seo_title, seo_description = excluded.seo_description,
        status = excluded.status, published_at = excluded.published_at;
    v_result := v_result || jsonb_build_array(jsonb_build_object('locale', v_new.locale,
      'slug', v_new.slug, 'status', v_new.status, 'published_at', v_new.published_at,
      'visible', coalesce(v_new.status = 'published' and v_new.published_at <= now(), false)));
  end loop;
  return jsonb_build_object('ok', true, 'action', case when v_created then 'created' else 'updated' end,
    'article_id', v_article.id, 'category_id', v_channel.category_id,
    'facebook_page_id', v_channel.facebook_page_id, 'facebook_post_id', v_article.facebook_post_id,
    'translations', v_result);
exception when unique_violation then
  get stacked diagnostics v_constraint = CONSTRAINT_NAME;
  if v_constraint = 'wellness_article_translations_locale_slug_key' then
    raise exception using message = 'SLUG_CONFLICT', errcode = 'P0001';
  end if;
  raise;
end;
$$;
revoke all on function public.publish_wellness_article(text, jsonb) from public, anon, authenticated;
grant execute on function public.publish_wellness_article(text, jsonb) to service_role;
commit;

