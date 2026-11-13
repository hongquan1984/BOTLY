begin;

create table if not exists public.healthclues_quiz_bank_versions (
  version integer primary key check (version > 0),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 100),
  status text not null check (status in ('draft', 'published', 'superseded')),
  reviewed_by text,
  review_reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check ((status = 'draft') = (published_at is null)),
  check ((status = 'draft') = (reviewed_by is null))
);
create unique index if not exists healthclues_quiz_one_draft_idx
  on public.healthclues_quiz_bank_versions ((status)) where status = 'draft';
create unique index if not exists healthclues_quiz_one_published_idx
  on public.healthclues_quiz_bank_versions ((status)) where status = 'published';

create table if not exists public.healthclues_quiz_bank_audit (
  id bigint generated always as identity primary key,
  version integer not null references public.healthclues_quiz_bank_versions(version),
  action text not null check (action in ('draft_saved', 'published')),
  reason text not null,
  actor_identity text not null check (actor_identity = 'healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN'),
  occurred_at timestamptz not null default now()
);

alter table public.healthclues_quiz_bank_versions enable row level security;
alter table public.healthclues_quiz_bank_audit enable row level security;
revoke all on public.healthclues_quiz_bank_versions, public.healthclues_quiz_bank_audit from public, anon, authenticated;
grant select, insert, update on public.healthclues_quiz_bank_versions to service_role;
grant select, insert on public.healthclues_quiz_bank_audit to service_role;
grant usage, select on sequence public.healthclues_quiz_bank_audit_id_seq to service_role;

create or replace function public.healthclues_save_quiz_bank_v1(
  p_questions jsonb,
  p_action text,
  p_reason text,
  p_expected_active_version integer
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_active integer;
  v_version integer;
  v_actor constant text := 'healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN';
begin
  if p_action not in ('save_draft', 'publish') then raise exception 'invalid_quiz_bank_action' using errcode='22023'; end if;
  if p_reason is null or length(btrim(p_reason)) not between 3 and 1200 then raise exception 'invalid_quiz_bank_reason' using errcode='22023'; end if;
  if p_expected_active_version is null or p_expected_active_version < 0 then raise exception 'invalid_expected_quiz_version' using errcode='22023'; end if;

  perform pg_advisory_xact_lock(hashtext('healthclues_quiz_bank_v1'));
  select version into v_active from public.healthclues_quiz_bank_versions where status='published' for update;
  if coalesce(v_active,0) <> p_expected_active_version then raise exception 'stale_quiz_bank_version' using errcode='40001'; end if;
  v_version := p_expected_active_version + 1;

  if p_action = 'save_draft' then
    if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) not between 1 and 100 then raise exception 'invalid_quiz_questions' using errcode='22023'; end if;
    if exists (select 1 from jsonb_array_elements(p_questions) q where jsonb_typeof(q) <> 'object' or length(btrim(coalesce(q->>'id',''))) not between 1 and 80 or length(btrim(coalesce(q->>'text',''))) not between 1 and 1000 or jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 1 and 20) then
      raise exception 'invalid_quiz_question_shape' using errcode='22023';
    end if;
    if (select count(distinct q->>'id') from jsonb_array_elements(p_questions) q) <> jsonb_array_length(p_questions) then raise exception 'duplicate_quiz_question_id' using errcode='22023'; end if;
    insert into public.healthclues_quiz_bank_versions(version,questions,status,review_reason)
    values(v_version,p_questions,'draft',btrim(p_reason))
    on conflict(version) do update set questions=excluded.questions,status='draft',reviewed_by=null,review_reason=excluded.review_reason,updated_at=now(),published_at=null
    where public.healthclues_quiz_bank_versions.status='draft';
    if not found then raise exception 'quiz_draft_version_is_immutable' using errcode='40001'; end if;
    insert into public.healthclues_quiz_bank_audit(version,action,reason,actor_identity) values(v_version,'draft_saved',btrim(p_reason),v_actor);
    return jsonb_build_object('version',v_version,'status','draft','active_version',p_expected_active_version);
  end if;

  update public.healthclues_quiz_bank_versions set status='superseded',updated_at=now()
    where status='published';
  update public.healthclues_quiz_bank_versions set status='published',reviewed_by=v_actor,review_reason=btrim(p_reason),published_at=now(),updated_at=now()
    where version=v_version and status='draft';
  if not found then raise exception 'quiz_draft_not_found' using errcode='P0002'; end if;
  insert into public.healthclues_quiz_bank_audit(version,action,reason,actor_identity) values(v_version,'published',btrim(p_reason),v_actor);
  return jsonb_build_object('version',v_version,'status','published','active_version',v_version);
end;
$$;

revoke all on function public.healthclues_save_quiz_bank_v1(jsonb,text,text,integer) from public, anon, authenticated;
grant execute on function public.healthclues_save_quiz_bank_v1(jsonb,text,text,integer) to service_role;
notify pgrst, 'reload schema';
commit;
