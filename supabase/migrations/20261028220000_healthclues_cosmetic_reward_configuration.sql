-- Extend reviewer display/availability controls to the fixed Boss keepsakes.
-- Reward eligibility, Boss answers, XP and World unlocks remain server controlled.
create or replace function public.healthclues_update_reward_config_v1(
  p_reward_id text,p_expected_version integer,p_title text,p_active boolean,p_reason text
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_before public.healthclues_reward_definitions%rowtype; v_after public.healthclues_reward_definitions%rowtype;
begin
  if p_reward_id is null
     or p_reward_id !~ '^(journey-milestone-(7|14|30|60|90)|boss-keepsake-(sleep-lantern|calm-chimes|nutrition-blossom|movement-pennant))$'
     or p_expected_version is null or p_expected_version<1
     or p_title is null or length(btrim(p_title)) not between 1 and 100
     or p_active is null or p_reason is null or length(btrim(p_reason)) not between 3 and 1200 then
    raise exception 'invalid_reward_configuration' using errcode='22023';
  end if;
  select * into v_before from public.healthclues_reward_definitions where id=p_reward_id for update;
  if not found then raise exception 'reward_not_found' using errcode='P0002'; end if;
  if v_before.version<>p_expected_version then raise exception 'reward_version_conflict' using errcode='40001'; end if;
  update public.healthclues_reward_definitions set title=btrim(p_title),active=p_active,version=version+1,updated_at=now()
    where id=p_reward_id returning * into v_after;
  insert into public.healthclues_audit_events(actor_type,action,entity_type,entity_id,reason,metadata)
    values('reviewer','reward_config_update','reward',p_reward_id||':v'||v_after.version,btrim(p_reason),jsonb_build_object(
      'reviewer_credential','healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN',
      'previous',jsonb_build_object('version',v_before.version,'title',v_before.title,'active',v_before.active),
      'current',jsonb_build_object('version',v_after.version,'title',v_after.title,'active',v_after.active)
    ));
  return jsonb_build_object('id',v_after.id,'version',v_after.version,'reward_type',v_after.reward_type,'title',v_after.title,'active',v_after.active,'eligibility',v_after.eligibility);
end; $$;
revoke all on function public.healthclues_update_reward_config_v1(text,integer,text,boolean,text) from public,anon,authenticated;
grant execute on function public.healthclues_update_reward_config_v1(text,integer,text,boolean,text) to service_role;
notify pgrst,'reload schema';
