-- The existing Day 60 map reward must change the user's saved World, not only add a reward row.
create or replace function public.healthclues_award_elapsed_milestones_v1(p_user_id uuid,p_local_date date)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_day integer; v_count integer:=0; v_rows integer;
begin
  if p_user_id is null or p_local_date is null then raise exception 'invalid_milestone_request' using errcode='22023'; end if;
  for v_day in select unnest(array[7,14,30,60,90]) loop
    insert into public.healthclues_user_milestones(user_id,journey_id,milestone_day,reached_on)
      select p_user_id,j.id,v_day,j.started_on+(v_day-1) from public.healthclues_journeys j
      where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
      on conflict(user_id,journey_id,milestone_day) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows>0 then
      insert into public.healthclues_user_rewards(user_id,reward_id,source_key)
        select p_user_id,'journey-milestone-'||v_day::text,j.id::text from public.healthclues_journeys j
        where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
        on conflict(user_id,reward_id,source_key) do nothing;
      insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
        select p_user_id,'milestone',j.id::text,'milestone:'||j.id::text||':'||v_day::text,10,'elapsed_day_milestone'
        from public.healthclues_journeys j where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+(v_day-1)
        on conflict(user_id,idempotency_key) do nothing;
      if v_day=60 then
        insert into public.healthclues_world_unlocks(user_id,world_id,unlock_key,source_type,source_id)
          select p_user_id,b.world_id,'knowledge-library-open','milestone',j.id::text||':60'
          from public.healthclues_journeys j join public.healthclues_branches b on b.id=j.branch_id and b.user_id=j.user_id
          where j.user_id=p_user_id and j.status<>'archived' and p_local_date>=j.started_on+59
          on conflict(user_id,world_id,unlock_key) do nothing;
      end if;
      v_count:=v_count+v_rows;
    end if;
  end loop;
  return v_count;
end; $$;
revoke all on function public.healthclues_award_elapsed_milestones_v1(uuid,date) from public,anon,authenticated;
grant execute on function public.healthclues_award_elapsed_milestones_v1(uuid,date) to service_role;
notify pgrst,'reload schema';
