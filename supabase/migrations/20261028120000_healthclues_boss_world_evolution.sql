-- Reviewer-gated Knowledge Bosses, server-authoritative rewards and persistent World unlock state.
-- No Boss questions or health content are seeded here.
create table if not exists public.healthclues_boss_challenges (
  boss_id text not null check (boss_id ~ '^[a-z0-9-]{1,100}$'),
  version integer not null check (version>0),
  topic_key text not null check (topic_key ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  intro text not null check (char_length(btrim(intro)) between 1 and 1000),
  question_prompt text not null check (char_length(btrim(question_prompt)) between 1 and 1000),
  question_options jsonb not null check (jsonb_typeof(question_options)='array' and jsonb_array_length(question_options)>=2),
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  published boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  primary key(boss_id,version),
  check(not published or (review_status='reviewed' and reviewed_by is not null and reviewed_at is not null))
);
create index if not exists healthclues_boss_topic_idx on public.healthclues_boss_challenges(topic_key,boss_id,version desc) where published and review_status='reviewed';
alter table public.healthclues_boss_challenges enable row level security;
revoke all on public.healthclues_boss_challenges from public,anon,authenticated;
grant select on public.healthclues_boss_challenges to anon,authenticated;
grant all on public.healthclues_boss_challenges to service_role;
drop policy if exists reviewed_boss_challenges_read on public.healthclues_boss_challenges;
create policy reviewed_boss_challenges_read on public.healthclues_boss_challenges for select to anon,authenticated using(published and review_status='reviewed' and (review_due_at is null or review_due_at>now()));

create table if not exists public.healthclues_boss_answer_keys (
  boss_id text not null,
  boss_version integer not null,
  correct_option_id text not null,
  explanation text not null check(char_length(btrim(explanation)) between 1 and 2000),
  primary key(boss_id,boss_version),
  foreign key(boss_id,boss_version) references public.healthclues_boss_challenges(boss_id,version) on delete cascade
);
alter table public.healthclues_boss_answer_keys enable row level security;
revoke all on public.healthclues_boss_answer_keys from public,anon,authenticated;
grant all on public.healthclues_boss_answer_keys to service_role;

create table if not exists public.healthclues_boss_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  boss_id text not null,
  boss_version integer not null,
  idempotency_key uuid not null,
  selected_option_id text not null,
  is_correct boolean not null,
  attempted_at timestamptz not null default now(),
  unique(user_id,idempotency_key),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key(boss_id,boss_version) references public.healthclues_boss_challenges(boss_id,version) on delete restrict
);
create table if not exists public.healthclues_boss_clears (
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  boss_id text not null,
  boss_version integer not null,
  cleared_at timestamptz not null default now(),
  primary key(user_id,world_id,boss_id,boss_version),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key(boss_id,boss_version) references public.healthclues_boss_challenges(boss_id,version) on delete restrict
);
create table if not exists public.healthclues_world_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  unlock_key text not null check(unlock_key ~ '^[a-z0-9-]{1,100}$'),
  source_type text not null check(source_type in ('boss_clear','milestone','knowledge_chapter')),
  source_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key(user_id,world_id,unlock_key),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade
);
create index if not exists healthclues_boss_attempts_member_idx on public.healthclues_boss_attempts(user_id,attempted_at desc);
alter table public.healthclues_boss_attempts enable row level security;
alter table public.healthclues_boss_clears enable row level security;
alter table public.healthclues_world_unlocks enable row level security;
revoke all on public.healthclues_boss_attempts,public.healthclues_boss_clears,public.healthclues_world_unlocks from public,anon,authenticated;
grant select on public.healthclues_boss_attempts,public.healthclues_boss_clears,public.healthclues_world_unlocks to authenticated;
grant all on public.healthclues_boss_attempts,public.healthclues_boss_clears,public.healthclues_world_unlocks to service_role;
drop policy if exists boss_attempts_owner_read on public.healthclues_boss_attempts;
create policy boss_attempts_owner_read on public.healthclues_boss_attempts for select to authenticated using(user_id=auth.uid());
drop policy if exists boss_clears_owner_read on public.healthclues_boss_clears;
create policy boss_clears_owner_read on public.healthclues_boss_clears for select to authenticated using(user_id=auth.uid());
drop policy if exists world_unlocks_owner_read on public.healthclues_world_unlocks;
create policy world_unlocks_owner_read on public.healthclues_world_unlocks for select to authenticated using(user_id=auth.uid());

create or replace function public.healthclues_answer_boss_challenge_v1(p_user_id uuid,p_world_id uuid,p_boss_id text,p_boss_version integer,p_selected_option_id text,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_boss public.healthclues_boss_challenges%rowtype; v_answer public.healthclues_boss_answer_keys%rowtype; v_attempt public.healthclues_boss_attempts%rowtype; v_correct boolean; v_inserted integer; v_unlock text;
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
  insert into public.healthclues_boss_attempts(user_id,world_id,boss_id,boss_version,idempotency_key,selected_option_id,is_correct) values(p_user_id,p_world_id,p_boss_id,p_boss_version,p_idempotency_key,p_selected_option_id,v_correct) on conflict(user_id,idempotency_key) do nothing returning * into v_attempt;
  if not found then select * into v_attempt from public.healthclues_boss_attempts where user_id=p_user_id and idempotency_key=p_idempotency_key; if v_attempt.world_id<>p_world_id or v_attempt.boss_id<>p_boss_id or v_attempt.boss_version<>p_boss_version or v_attempt.selected_option_id<>p_selected_option_id then raise exception 'boss_idempotency_conflict' using errcode='22023'; end if; return jsonb_build_object('correct',v_attempt.is_correct,'reused',true,'attempt_id',v_attempt.id); end if;
  v_unlock:=p_boss_id||'-path-open';
  if v_correct then
    insert into public.healthclues_boss_clears(user_id,world_id,boss_id,boss_version) values(p_user_id,p_world_id,p_boss_id,p_boss_version) on conflict do nothing;
    get diagnostics v_inserted=row_count;
    if v_inserted>0 then
      insert into public.healthclues_xp_ledger(user_id,source_type,source_id,idempotency_key,amount,reason_code) values(p_user_id,'learning','boss:'||p_boss_id||':'||p_boss_version,'boss-clear:'||p_world_id::text||':'||p_boss_id||':'||p_boss_version,25,'reviewed_boss_clear') on conflict(user_id,idempotency_key) do nothing;
      insert into public.healthclues_world_unlocks(user_id,world_id,unlock_key,source_type,source_id) values(p_user_id,p_world_id,v_unlock,'boss_clear',p_boss_id||':'||p_boss_version) on conflict do nothing;
    end if;
  end if;
  return jsonb_build_object('correct',v_correct,'reused',false,'cleared',v_correct,'reward_granted',v_correct and v_inserted>0,'unlock_key',case when v_correct then v_unlock else null end,'explanation',v_answer.explanation);
end; $$;
revoke all on function public.healthclues_answer_boss_challenge_v1(uuid,uuid,text,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.healthclues_answer_boss_challenge_v1(uuid,uuid,text,integer,text,uuid) to service_role;
notify pgrst,'reload schema';
