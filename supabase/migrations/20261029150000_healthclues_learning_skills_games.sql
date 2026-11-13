-- Persisted learning-only Skill progress and isolated educational mini-games.
-- Mini-games are TEST ONLY in the local owner demo until editorially reviewed.

alter table public.healthclues_knowledge_clues
  add column if not exists skill_key text not null default 'health_knowledge';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname='healthclues_knowledge_skill_key_check'
      and conrelid='public.healthclues_knowledge_clues'::regclass
  ) then
    alter table public.healthclues_knowledge_clues
      add constraint healthclues_knowledge_skill_key_check
      check (skill_key in ('health_knowledge','natural_nutrition','movement','mind_sleep'));
  end if;
end $$;

update public.healthclues_knowledge_clues
set skill_key='mind_sleep'
where topic_key='sleep-better' and skill_key='health_knowledge';

create index if not exists healthclues_knowledge_skill_idx
  on public.healthclues_knowledge_clues(skill_key,topic_key,clue_id,version)
  where published and review_status='reviewed';

create table if not exists public.healthclues_learning_game_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  game_id text not null check (game_id in ('evidence-detective-v1','garden-sort-v1','movement-trail-v1','rest-reflection-v1')),
  skill_key text not null check (skill_key in ('health_knowledge','natural_nutrition','movement','mind_sleep')),
  completed_at timestamptz not null default now(),
  unique (user_id,game_id),
  foreign key (world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
create index if not exists healthclues_learning_game_user_idx
  on public.healthclues_learning_game_completions(user_id,world_id,completed_at desc);
alter table public.healthclues_learning_game_completions enable row level security;
revoke all on public.healthclues_learning_game_completions from public,anon,authenticated;
grant select on public.healthclues_learning_game_completions to authenticated;
grant all on public.healthclues_learning_game_completions to service_role;
drop policy if exists owner_read_learning_game_completions on public.healthclues_learning_game_completions;
create policy owner_read_learning_game_completions on public.healthclues_learning_game_completions
  for select to authenticated using (user_id=auth.uid());

create or replace function public.healthclues_complete_learning_game_v1(p_user_id uuid,p_world_id uuid,p_game_id text)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_skill text; v_existing public.healthclues_learning_game_completions%rowtype; v_inserted integer;
begin
  if p_user_id is null or p_world_id is null or p_game_id is null then
    raise exception 'invalid_learning_game_completion' using errcode='22023';
  end if;
  v_skill:=case p_game_id
    when 'evidence-detective-v1' then 'health_knowledge'
    when 'garden-sort-v1' then 'natural_nutrition'
    when 'movement-trail-v1' then 'movement'
    when 'rest-reflection-v1' then 'mind_sleep'
    else null end;
  if v_skill is null then raise exception 'learning_game_unavailable' using errcode='22023'; end if;
  if not exists(select 1 from public.healthclues_wellness_worlds where id=p_world_id and user_id=p_user_id) then
    raise exception 'world_not_owned' using errcode='42501';
  end if;
  insert into public.healthclues_learning_game_completions(user_id,world_id,game_id,skill_key)
    values(p_user_id,p_world_id,p_game_id,v_skill)
    on conflict(user_id,game_id) do nothing;
  get diagnostics v_inserted=row_count;
  select * into v_existing from public.healthclues_learning_game_completions where user_id=p_user_id and game_id=p_game_id;
  if v_existing.world_id<>p_world_id then raise exception 'learning_game_world_conflict' using errcode='42501'; end if;
  if v_inserted=1 then
    insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code)
      values(p_user_id,'learning','mini-game:'||p_game_id,'learning-game:'||p_user_id::text||':'||p_game_id,3,'unique_learning_game_completion')
      on conflict(user_id,idempotency_key) do nothing;
  end if;
  return jsonb_build_object('completed',true,'first_completion',v_inserted=1,'reward_granted',v_inserted=1,'skill_key',v_skill,'completion_id',v_existing.id);
end; $$;

revoke all on function public.healthclues_complete_learning_game_v1(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.healthclues_complete_learning_game_v1(uuid,uuid,text) to service_role;
notify pgrst,'reload schema';
