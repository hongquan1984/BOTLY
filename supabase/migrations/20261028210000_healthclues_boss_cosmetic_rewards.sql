-- Boss clears award a fixed, non-medical keepsake and persist its map decoration.
-- All grants remain inside this service-role-only, idempotent RPC.
insert into public.healthclues_reward_definitions(id,version,reward_type,title,eligibility,active)
values
  ('boss-keepsake-sleep-lantern',1,'cosmetic','Sleep Valley Lantern','{"boss_topic":"sleep-better"}'::jsonb,true),
  ('boss-keepsake-calm-chimes',1,'cosmetic','Calm Forest Wind Chimes','{"boss_topic":"feel-calmer"}'::jsonb,true),
  ('boss-keepsake-nutrition-blossom',1,'cosmetic','Nutrition Garden Blossom','{"boss_topic":"eat-healthier"}'::jsonb,true),
  ('boss-keepsake-movement-pennant',1,'cosmetic','Movement Peaks Pennant','{"boss_topic":"move-more"}'::jsonb,true)
on conflict(id) do nothing;

create or replace function public.healthclues_answer_boss_challenge_v1(
  p_user_id uuid,p_world_id uuid,p_boss_id text,p_boss_version integer,p_selected_option_id text,p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_boss public.healthclues_boss_challenges%rowtype;
  v_answer public.healthclues_boss_answer_keys%rowtype;
  v_attempt public.healthclues_boss_attempts%rowtype;
  v_correct boolean;
  v_inserted integer;
  v_unlock text;
  v_cosmetic_reward text;
  v_cosmetic_unlock text;
begin
  if p_user_id is null or p_world_id is null or p_boss_id is null or p_boss_version is null or p_selected_option_id is null or p_idempotency_key is null then raise exception 'invalid_boss_answer' using errcode='22023'; end if;
  if not exists(select 1 from public.healthclues_wellness_worlds where id=p_world_id and user_id=p_user_id) then raise exception 'world_not_owned' using errcode='42501'; end if;
  select * into v_attempt from public.healthclues_boss_attempts where user_id=p_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_attempt.world_id<>p_world_id or v_attempt.boss_id<>p_boss_id or v_attempt.boss_version<>p_boss_version or v_attempt.selected_option_id<>p_selected_option_id then raise exception 'boss_idempotency_conflict' using errcode='22023'; end if;
    return jsonb_build_object('correct',v_attempt.is_correct,'reused',true,'attempt_id',v_attempt.id);
  end if;
  select * into v_boss from public.healthclues_boss_challenges where boss_id=p_boss_id and version=p_boss_version and published and review_status='reviewed' and (review_due_at is null or review_due_at>now());
  if not found then raise exception 'boss_content_not_eligible' using errcode='22023'; end if;
  if not exists(select 1 from public.healthclues_branches where world_id=p_world_id and user_id=p_user_id and status='active' and topic_key=v_boss.topic_key) then raise exception 'boss_topic_mismatch' using errcode='22023'; end if;
  if not exists(select 1 from jsonb_array_elements(v_boss.question_options) o where o->>'id'=p_selected_option_id) then raise exception 'invalid_boss_option' using errcode='22023'; end if;
  select * into v_answer from public.healthclues_boss_answer_keys where boss_id=p_boss_id and boss_version=p_boss_version;
  if not found then raise exception 'boss_answer_unavailable' using errcode='22023'; end if;
  v_correct:=p_selected_option_id=v_answer.correct_option_id;
  insert into public.healthclues_boss_attempts(user_id,world_id,boss_id,boss_version,idempotency_key,selected_option_id,is_correct)
    values(p_user_id,p_world_id,p_boss_id,p_boss_version,p_idempotency_key,p_selected_option_id,v_correct)
    on conflict(user_id,idempotency_key) do nothing returning * into v_attempt;
  if not found then
    select * into v_attempt from public.healthclues_boss_attempts where user_id=p_user_id and idempotency_key=p_idempotency_key;
    if v_attempt.world_id<>p_world_id or v_attempt.boss_id<>p_boss_id or v_attempt.boss_version<>p_boss_version or v_attempt.selected_option_id<>p_selected_option_id then raise exception 'boss_idempotency_conflict' using errcode='22023'; end if;
    return jsonb_build_object('correct',v_attempt.is_correct,'reused',true,'attempt_id',v_attempt.id);
  end if;
  v_unlock:=p_boss_id||'-path-open';
  if v_boss.topic_key='sleep-better' then
    v_cosmetic_reward:='boss-keepsake-sleep-lantern'; v_cosmetic_unlock:='sleep-valley-lantern-open';
  elsif v_boss.topic_key='feel-calmer' then
    v_cosmetic_reward:='boss-keepsake-calm-chimes'; v_cosmetic_unlock:='calm-forest-chimes-open';
  elsif v_boss.topic_key='eat-healthier' then
    v_cosmetic_reward:='boss-keepsake-nutrition-blossom'; v_cosmetic_unlock:='nutrition-garden-blossom-open';
  elsif v_boss.topic_key='move-more' then
    v_cosmetic_reward:='boss-keepsake-movement-pennant'; v_cosmetic_unlock:='movement-peaks-pennant-open';
  end if;
  if v_correct then
    insert into public.healthclues_boss_clears(user_id,world_id,boss_id,boss_version) values(p_user_id,p_world_id,p_boss_id,p_boss_version) on conflict do nothing;
    get diagnostics v_inserted=row_count;
    if v_inserted>0 then
      insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
        values(p_user_id,'learning','boss:'||p_boss_id||':'||p_boss_version,'boss-clear:'||p_world_id::text||':'||p_boss_id||':'||p_boss_version,25,'reviewed_boss_clear') on conflict(user_id,idempotency_key) do nothing;
      insert into public.healthclues_world_unlocks(user_id,world_id,unlock_key,source_type,source_id)
        values(p_user_id,p_world_id,v_unlock,'boss_clear',p_boss_id||':'||p_boss_version) on conflict do nothing;
      if v_cosmetic_reward is not null and exists(select 1 from public.healthclues_reward_definitions where id=v_cosmetic_reward and active) then
        insert into public.healthclues_user_rewards(user_id,reward_id,source_key)
          values(p_user_id,v_cosmetic_reward,'boss:'||p_world_id::text||':'||p_boss_id||':'||p_boss_version) on conflict do nothing;
        insert into public.healthclues_world_unlocks(user_id,world_id,unlock_key,source_type,source_id)
          values(p_user_id,p_world_id,v_cosmetic_unlock,'boss_clear',p_boss_id||':'||p_boss_version) on conflict do nothing;
      else
        v_cosmetic_reward:=null; v_cosmetic_unlock:=null;
      end if;
    else
      v_cosmetic_reward:=null; v_cosmetic_unlock:=null;
    end if;
  else
    v_cosmetic_reward:=null; v_cosmetic_unlock:=null;
  end if;
  return jsonb_build_object(
    'correct',v_correct,'reused',false,'cleared',v_correct,'reward_granted',v_correct and v_inserted>0,
    'unlock_key',case when v_correct then v_unlock else null end,
    'cosmetic_reward_id',v_cosmetic_reward,'cosmetic_unlock_key',v_cosmetic_unlock,
    'explanation',v_answer.explanation
  );
end; $$;
revoke all on function public.healthclues_answer_boss_challenge_v1(uuid,uuid,text,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.healthclues_answer_boss_challenge_v1(uuid,uuid,text,integer,text,uuid) to service_role;
notify pgrst,'reload schema';
