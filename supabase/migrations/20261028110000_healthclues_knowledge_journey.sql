-- Versioned, reviewer-gated Daily Knowledge and member Knowledge Book.
-- No content is seeded or approved by this migration.
create table if not exists public.healthclues_knowledge_clues (
  clue_id text not null check (clue_id ~ '^[a-z0-9-]{1,120}$'),
  version integer not null check (version > 0),
  topic_key text not null check (topic_key ~ '^[a-z0-9-]{1,80}$'),
  chapter_id text not null check (chapter_id ~ '^[a-z0-9-]{1,100}$'),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  source_references jsonb not null default '[]'::jsonb check (jsonb_typeof(source_references)='array'),
  related_catalog_ids text[] not null default '{}',
  question_prompt text check (question_prompt is null or char_length(question_prompt) between 1 and 1000),
  question_options jsonb not null default '[]'::jsonb check (jsonb_typeof(question_options)='array'),
  review_status text not null default 'needs_review' check (review_status in ('draft','needs_review','reviewed','rejected','retired')),
  published boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clue_id,version),
  check (not published or (review_status='reviewed' and reviewed_by is not null and reviewed_at is not null and jsonb_array_length(source_references)>0)),
  check (question_prompt is null or (char_length(btrim(question_prompt))>0 and jsonb_array_length(question_options)>=2))
);
create index if not exists healthclues_knowledge_active_topic_idx on public.healthclues_knowledge_clues(topic_key,chapter_id,clue_id,version) where published and review_status='reviewed';
alter table public.healthclues_knowledge_clues enable row level security;
revoke all on public.healthclues_knowledge_clues from public,anon,authenticated;
grant select on public.healthclues_knowledge_clues to anon,authenticated;
grant all on public.healthclues_knowledge_clues to service_role;
drop policy if exists reviewed_knowledge_clues_read on public.healthclues_knowledge_clues;
create policy reviewed_knowledge_clues_read on public.healthclues_knowledge_clues for select to anon,authenticated using (published and review_status='reviewed' and (review_due_at is null or review_due_at>now()));

-- Correct answers are stored separately; public/content roles cannot inspect them.
create table if not exists public.healthclues_knowledge_answer_keys (
  clue_id text not null,
  clue_version integer not null,
  correct_option_id text not null,
  answer_explanation text not null check (char_length(btrim(answer_explanation)) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key(clue_id,clue_version),
  foreign key(clue_id,clue_version) references public.healthclues_knowledge_clues(clue_id,version) on delete cascade
);
alter table public.healthclues_knowledge_answer_keys enable row level security;
revoke all on public.healthclues_knowledge_answer_keys from public,anon,authenticated;
grant all on public.healthclues_knowledge_answer_keys to service_role;

create table if not exists public.healthclues_knowledge_discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  clue_id text not null,
  clue_version integer not null,
  local_date date not null,
  discovered_at timestamptz not null default now(),
  unique(user_id,world_id,local_date),
  unique(user_id,clue_id,clue_version),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key(clue_id,clue_version) references public.healthclues_knowledge_clues(clue_id,version) on delete restrict
);
create index if not exists healthclues_knowledge_book_user_idx on public.healthclues_knowledge_discoveries(user_id,discovered_at desc);
alter table public.healthclues_knowledge_discoveries enable row level security;
revoke all on public.healthclues_knowledge_discoveries from public,anon,authenticated;
grant select on public.healthclues_knowledge_discoveries to authenticated;
grant all on public.healthclues_knowledge_discoveries to service_role;
drop policy if exists owner_read_knowledge_book on public.healthclues_knowledge_discoveries;
create policy owner_read_knowledge_book on public.healthclues_knowledge_discoveries for select to authenticated using(user_id=auth.uid());

create table if not exists public.healthclues_knowledge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null,
  clue_id text not null,
  clue_version integer not null,
  idempotency_key uuid not null,
  selected_option_id text not null,
  is_correct boolean not null,
  attempted_at timestamptz not null default now(),
  unique(user_id,idempotency_key),
  foreign key(world_id,user_id) references public.healthclues_wellness_worlds(id,user_id) on delete cascade,
  foreign key(clue_id,clue_version) references public.healthclues_knowledge_clues(clue_id,version) on delete restrict
);
create index if not exists healthclues_knowledge_attempts_user_idx on public.healthclues_knowledge_attempts(user_id,attempted_at desc);
alter table public.healthclues_knowledge_attempts enable row level security;
revoke all on public.healthclues_knowledge_attempts from public,anon,authenticated;
grant select on public.healthclues_knowledge_attempts to authenticated;
grant all on public.healthclues_knowledge_attempts to service_role;
drop policy if exists owner_read_knowledge_attempts on public.healthclues_knowledge_attempts;
create policy owner_read_knowledge_attempts on public.healthclues_knowledge_attempts for select to authenticated using(user_id=auth.uid());

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
  if not exists(select 1 from public.healthclues_branches b where b.world_id=p_world_id and b.user_id=p_user_id and b.status='active' and b.topic_key=v_clue.topic_key) then raise exception 'knowledge_topic_mismatch' using errcode='22023'; end if;
  insert into public.healthclues_knowledge_discoveries(user_id,world_id,clue_id,clue_version,local_date)
    values(p_user_id,p_world_id,p_clue_id,p_clue_version,p_local_date) on conflict do nothing;
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
  if not exists(select 1 from public.healthclues_branches b where b.world_id=p_world_id and b.user_id=p_user_id and b.status='active' and b.topic_key=v_clue.topic_key) then raise exception 'knowledge_topic_mismatch' using errcode='22023'; end if;
  select * into v_answer from public.healthclues_knowledge_answer_keys where clue_id=p_clue_id and clue_version=p_clue_version;
  if not found then raise exception 'knowledge_answer_key_unavailable' using errcode='22023'; end if;
  if not exists(select 1 from jsonb_array_elements(v_clue.question_options) o where o->>'id'=p_selected_option_id) then raise exception 'invalid_knowledge_option' using errcode='22023'; end if;
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
notify pgrst, 'reload schema';
