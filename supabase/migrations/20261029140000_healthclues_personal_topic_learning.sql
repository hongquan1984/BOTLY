-- Allow in-map Knowledge RPCs to honor the original self-reported topic on the
-- stable health-concern World branch. This does not change diagnosis or safety.
create or replace function public.healthclues_user_journey_topic_matches_v1(p_user_id uuid,p_world_id uuid,p_topic_key text)
returns boolean language sql stable security definer set search_path=public,auth,pg_temp as $$
  select exists(
    select 1 from public.healthclues_branches b
    where b.world_id=p_world_id and b.user_id=p_user_id and b.status='active'
      and (
        b.topic_key=p_topic_key
        or (b.topic_key='health-concern' and exists(
          select 1 from public.healthclues_profiles p
          where p.user_id=p_user_id
            and lower(btrim(regexp_replace(coalesce(p.profile->>'topic',''),'[^a-zA-Z0-9]+','-','g'),'-'))=p_topic_key
        ))
      )
  );
$$;
revoke all on function public.healthclues_user_journey_topic_matches_v1(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.healthclues_user_journey_topic_matches_v1(uuid,uuid,text) to service_role;

create or replace function public.healthclues_discover_knowledge_clue_v1(p_user_id uuid,p_world_id uuid,p_clue_id text,p_clue_version integer,p_local_date date)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_world public.healthclues_wellness_worlds%rowtype; v_clue public.healthclues_knowledge_clues%rowtype; v_existing public.healthclues_knowledge_discoveries%rowtype; v_inserted integer;
begin
  if p_user_id is null or p_world_id is null or p_clue_id is null or p_clue_version is null or p_local_date is null then raise exception 'invalid_knowledge_discovery' using errcode='22023'; end if;
  select * into v_world from public.healthclues_wellness_worlds where id=p_world_id and user_id=p_user_id for update;
  if not found then raise exception 'world_not_owned' using errcode='42501'; end if;
  if p_local_date<>(now() at time zone v_world.timezone)::date then raise exception 'knowledge_local_date_mismatch' using errcode='22023'; end if;
  select * into v_clue from public.healthclues_knowledge_clues where clue_id=p_clue_id and version=p_clue_version and published and review_status='reviewed' and (review_due_at is null or review_due_at>now());
  if not found then raise exception 'knowledge_content_not_eligible' using errcode='22023'; end if;
  if not public.healthclues_user_journey_topic_matches_v1(p_user_id,p_world_id,v_clue.topic_key) then raise exception 'knowledge_topic_mismatch' using errcode='22023'; end if;
  insert into public.healthclues_knowledge_discoveries(user_id,world_id,clue_id,clue_version,local_date) values(p_user_id,p_world_id,p_clue_id,p_clue_version,p_local_date) on conflict do nothing;
  get diagnostics v_inserted=row_count;
  if v_inserted=0 then
    select * into v_existing from public.healthclues_knowledge_discoveries where user_id=p_user_id and clue_id=p_clue_id and clue_version=p_clue_version;
    if not found then
      select * into v_existing from public.healthclues_knowledge_discoveries where user_id=p_user_id and world_id=p_world_id and local_date=p_local_date;
      return jsonb_build_object('discovered',false,'already_today',true,'discovery_id',v_existing.id,'clue_id',v_existing.clue_id,'local_date',v_existing.local_date);
    end if;
    return jsonb_build_object('discovered',false,'already_today',false,'discovery_id',v_existing.id,'local_date',v_existing.local_date);
  end if;
  insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
    values(p_user_id,'learning',p_clue_id||':'||p_clue_version,'knowledge-discovery:'||p_user_id::text||':'||p_clue_id||':'||p_clue_version,2,'reviewed_knowledge_discovery') on conflict(user_id,idempotency_key) do nothing;
  select * into v_existing from public.healthclues_knowledge_discoveries where user_id=p_user_id and clue_id=p_clue_id and clue_version=p_clue_version;
  return jsonb_build_object('discovered',true,'xp_awarded',true,'discovery_id',v_existing.id,'local_date',v_existing.local_date);
end; $$;

create or replace function public.healthclues_answer_knowledge_clue_v1(p_user_id uuid,p_world_id uuid,p_clue_id text,p_clue_version integer,p_selected_option_id text,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_world public.healthclues_wellness_worlds%rowtype; v_clue public.healthclues_knowledge_clues%rowtype; v_answer public.healthclues_knowledge_answer_keys%rowtype; v_attempt public.healthclues_knowledge_attempts%rowtype; v_correct boolean;
begin
  if p_user_id is null or p_world_id is null or p_clue_id is null or p_clue_version is null or p_selected_option_id is null or p_idempotency_key is null then raise exception 'invalid_knowledge_answer' using errcode='22023'; end if;
  select * into v_world from public.healthclues_wellness_worlds where id=p_world_id and user_id=p_user_id;
  if not found then raise exception 'world_not_owned' using errcode='42501'; end if;
  select * into v_attempt from public.healthclues_knowledge_attempts where user_id=p_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_attempt.world_id<>p_world_id or v_attempt.clue_id<>p_clue_id or v_attempt.clue_version<>p_clue_version or v_attempt.selected_option_id<>p_selected_option_id then raise exception 'knowledge_idempotency_key_conflict' using errcode='22023'; end if;
    return jsonb_build_object('correct',v_attempt.is_correct,'attempt_id',v_attempt.id,'reused',true);
  end if;
  select * into v_clue from public.healthclues_knowledge_clues where clue_id=p_clue_id and version=p_clue_version and published and review_status='reviewed' and question_prompt is not null and (review_due_at is null or review_due_at>now());
  if not found then raise exception 'knowledge_question_not_eligible' using errcode='22023'; end if;
  if not public.healthclues_user_journey_topic_matches_v1(p_user_id,p_world_id,v_clue.topic_key) then raise exception 'knowledge_topic_mismatch' using errcode='22023'; end if;
  if not exists(select 1 from jsonb_array_elements(v_clue.question_options) o where o->>'id'=p_selected_option_id) then raise exception 'invalid_knowledge_option' using errcode='22023'; end if;
  select * into v_answer from public.healthclues_knowledge_answer_keys where clue_id=p_clue_id and clue_version=p_clue_version;
  if not found then raise exception 'knowledge_answer_key_unavailable' using errcode='22023'; end if;
  v_correct:=p_selected_option_id=v_answer.correct_option_id;
  insert into public.healthclues_knowledge_attempts(user_id,world_id,clue_id,clue_version,idempotency_key,selected_option_id,is_correct)
    values(p_user_id,p_world_id,p_clue_id,p_clue_version,p_idempotency_key,p_selected_option_id,v_correct)
    on conflict(user_id,idempotency_key) do nothing returning * into v_attempt;
  if not found then
    select * into v_attempt from public.healthclues_knowledge_attempts where user_id=p_user_id and idempotency_key=p_idempotency_key;
    if v_attempt.world_id<>p_world_id or v_attempt.clue_id<>p_clue_id or v_attempt.clue_version<>p_clue_version or v_attempt.selected_option_id<>p_selected_option_id then raise exception 'knowledge_idempotency_key_conflict' using errcode='22023'; end if;
    return jsonb_build_object('correct',v_attempt.is_correct,'attempt_id',v_attempt.id,'reused',true);
  end if;
  if v_correct then
    insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
      values(p_user_id,'learning',p_clue_id||':'||p_clue_version,'knowledge-answer:'||p_user_id::text||':'||p_clue_id||':'||p_clue_version,2,'reviewed_knowledge_answer') on conflict(user_id,idempotency_key) do nothing;
  end if;
  return jsonb_build_object('correct',v_correct,'attempt_id',v_attempt.id,'reused',false,'explanation',v_answer.answer_explanation);
end; $$;

revoke all on function public.healthclues_discover_knowledge_clue_v1(uuid,uuid,text,integer,date) from public,anon,authenticated;
revoke all on function public.healthclues_answer_knowledge_clue_v1(uuid,uuid,text,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.healthclues_discover_knowledge_clue_v1(uuid,uuid,text,integer,date) to service_role;
grant execute on function public.healthclues_answer_knowledge_clue_v1(uuid,uuid,text,integer,text,uuid) to service_role;
notify pgrst,'reload schema';
