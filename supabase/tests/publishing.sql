-- Run after bootstrap.sql and migrations 002/003 in a disposable database.
begin;
insert into public.wellness_channels (id, name, facebook_page_id, category_id)
  values ('00000000-0000-0000-0000-000000000001', 'Test Health Tips', '123', 'health-tips');
insert into public.wellness_channel_tokens (channel_id, token_hash)
  values ('00000000-0000-0000-0000-000000000001', repeat('a', 64));
set local role service_role;
do $$
declare
  payload jsonb := '{"facebook_page_id":"123","facebook_post_id":"123_456",
    "facebook_url":"https://www.facebook.com/reel/456", "translations":[
    {"locale":"vi","slug":"test-health","title":"Test health","description":"Description",
     "sections":[{"title":"Section","paragraphs":["Body"]}],"status":"published"}]}';
  first_result jsonb;
  next_result jsonb;
  did_fail boolean;
begin
  first_result := public.publish_wellness_article(repeat('a',64), payload);
  assert first_result->>'action' = 'created';
  next_result := public.publish_wellness_article(repeat('a',64), payload);
  assert next_result->>'action' = 'updated';
  assert next_result->>'article_id' = first_result->>'article_id';
  assert next_result#>>'{translations,0,published_at}' = first_result#>>'{translations,0,published_at}';
  assert (select count(*) = 1 from public.wellness_articles);

  payload := jsonb_set(payload, '{translations,0,locale}', '"en"');
  payload := jsonb_set(payload, '{translations,0,slug}', '"test-health-en"');
  payload := jsonb_set(payload, '{translations,0,status}', '"draft"');
  perform public.publish_wellness_article(repeat('a',64), payload);
  assert (select count(*) = 2 from public.wellness_article_translations);

  did_fail := false;
  begin perform public.publish_wellness_article(repeat('b',64), payload);
  exception when others then assert sqlerrm = 'UNAUTHORIZED'; did_fail := true; end;
  assert did_fail;
  did_fail := false;
  begin perform public.publish_wellness_article(repeat('a',64), jsonb_set(payload, '{facebook_page_id}', '"999"'));
  exception when others then assert sqlerrm = 'CHANNEL_FORBIDDEN'; did_fail := true; end;
  assert did_fail;

  did_fail := false;
  begin perform public.publish_wellness_article(repeat('a',64), jsonb_set(payload, '{translations,0,slug}', '"changed"'));
  exception when others then assert sqlerrm = 'SLUG_IMMUTABLE'; did_fail := true; end;
  assert did_fail;

  -- New article and first translation must roll back if the second conflicts.
  did_fail := false;
  payload := jsonb_set(payload, '{facebook_post_id}', '"123_999"');
  payload := jsonb_set(payload, '{translations}', '[
    {"locale":"vi","slug":"new-test","title":"New","description":"Description","sections":[{"title":"S","paragraphs":["B"]}],"status":"published"},
    {"locale":"en","slug":"test-health-en","title":"Duplicate","description":"Description","sections":[{"title":"S","paragraphs":["B"]}]}]');
  begin perform public.publish_wellness_article(repeat('a',64), payload);
  exception when others then assert sqlerrm = 'SLUG_CONFLICT'; did_fail := true; end;
  assert did_fail;
  assert (select count(*) = 1 from public.wellness_articles);
  assert (select count(*) = 2 from public.wellness_article_translations);

  -- 30 successful writes per minute; a rejected request must not change content.
  update public.wellness_publish_limits set requests = 30, window_start = now();
  did_fail := false;
  begin perform public.publish_wellness_article(repeat('a',64), payload);
  exception when others then assert sqlerrm = 'RATE_LIMITED'; did_fail := true; end;
  assert did_fail;
  assert (select count(*) = 1 from public.wellness_articles);
  update public.wellness_channel_tokens set revoked_at = now();
  did_fail := false;
  begin perform public.publish_wellness_article(repeat('a',64), payload);
  exception when others then assert sqlerrm = 'UNAUTHORIZED'; did_fail := true; end;
  assert did_fail;
end;
$$;
set local role anon;
do $$
begin
  assert (select count(*) = 1 from public.wellness_articles);
  assert (select count(*) = 1 from public.wellness_article_translations);
  assert not has_table_privilege(current_user, 'public.wellness_channels', 'SELECT');
  assert not has_table_privilege(current_user, 'public.wellness_channel_tokens', 'SELECT');
  assert not has_table_privilege(current_user, 'public.wellness_articles', 'INSERT');
  assert not has_function_privilege(current_user, 'public.publish_wellness_article(text,jsonb)', 'EXECUTE');
end;
$$;
set local role authenticated;
do $$ begin
  assert (select count(*) = 1 from public.wellness_article_translations);
  assert not has_function_privilege(current_user, 'public.publish_wellness_article(text,jsonb)', 'EXECUTE');
end; $$;
reset role;
update public.wellness_article_translations set published_at = now() + interval '1 day' where locale = 'vi';
set local role anon;
do $$ begin
  assert (select count(*) = 0 from public.wellness_articles);
  assert (select count(*) = 0 from public.wellness_article_translations);
end; $$;
reset role;
rollback;
select 'Publishing, retries, translations, rollback, token permissions and RLS passed' as result;
