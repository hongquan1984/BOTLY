begin;

-- Add somatic & sleep wind-down columns to wellness_article_translations
alter table public.wellness_article_translations
  add column if not exists somatic_signals jsonb,
  add column if not exists winddown_protocol jsonb,
  add column if not exists mind_traps jsonb,
  add column if not exists somatic_quiz jsonb,
  add column if not exists midnight_faqs jsonb;

-- Update publish_wellness_article function to handle all somatic widgets
create or replace function public.publish_wellness_article(p_token_hash text, p_payload jsonb)
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
    -- Normalize midnight_faqs into faqs if faqs is not provided
    if (v_input ? 'midnight_faqs') and not (v_input ? 'faqs') then
      v_input := v_input || jsonb_build_object('faqs', v_input->'midnight_faqs');
    end if;

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
        status = excluded.status, published_at = excluded.published_at,
        trust_meter = excluded.trust_meter, quick_recipe = excluded.quick_recipe,
        fact_checks = excluded.fact_checks, faqs = excluded.faqs,
        safety_quiz = excluded.safety_quiz,
        somatic_signals = excluded.somatic_signals,
        winddown_protocol = excluded.winddown_protocol,
        mind_traps = excluded.mind_traps,
        somatic_quiz = excluded.somatic_quiz,
        midnight_faqs = excluded.midnight_faqs;
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
