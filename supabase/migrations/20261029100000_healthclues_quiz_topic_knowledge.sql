-- Let the HealthClues Realm use the private self-reported Quiz topic for
-- exact reviewed Knowledge eligibility while keeping the stable region ID.
-- This does not grant access to another user's profile or World.
create or replace function public.healthclues_journey_topic_matches_v1(
  p_user_id uuid,
  p_world_id uuid,
  p_content_topic_key text
)
returns boolean
language sql
security definer
set search_path=public,pg_temp
as $$
  select exists (
    select 1
    from public.healthclues_wellness_worlds w
    join public.healthclues_branches b on b.world_id=w.id and b.user_id=w.user_id and b.status='active'
    join public.healthclues_profiles p on p.user_id=w.user_id
    where w.id=p_world_id
      and w.user_id=p_user_id
      and b.topic_key='health-concern'
      and lower(regexp_replace(coalesce(p.profile->>'topic',''), '[^a-z0-9]+', '-', 'g'))=p_content_topic_key
  );
$$;
revoke all on function public.healthclues_journey_topic_matches_v1(uuid,uuid,text) from public,anon,authenticated;

do $$
declare
  v_signature regprocedure;
  v_definition text;
  v_old text := 'if not exists(select 1 from public.healthclues_branches b where b.world_id=p_world_id and b.user_id=p_user_id and b.status=''active'' and b.topic_key=v_clue.topic_key) then raise exception ''knowledge_topic_mismatch'' using errcode=''22023''; end if;';
  v_new text := 'if not exists(select 1 from public.healthclues_branches b where b.world_id=p_world_id and b.user_id=p_user_id and b.status=''active'' and b.topic_key=v_clue.topic_key) and not public.healthclues_journey_topic_matches_v1(p_user_id,p_world_id,v_clue.topic_key) then raise exception ''knowledge_topic_mismatch'' using errcode=''22023''; end if;';
begin
  foreach v_signature in array array[
    'public.healthclues_discover_knowledge_clue_v1(uuid,uuid,text,integer,date)'::regprocedure,
    'public.healthclues_answer_knowledge_clue_v1(uuid,uuid,text,integer,text,uuid)'::regprocedure
  ] loop
    v_definition := pg_get_functiondef(v_signature);
    if position(v_old in v_definition)=0 then
      raise exception 'Unexpected Knowledge function definition; refusing unsafe migration';
    end if;
    execute replace(v_definition,v_old,v_new);
  end loop;
end $$;

notify pgrst, 'reload schema';
