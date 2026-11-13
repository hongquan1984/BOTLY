begin;

alter table public.healthclues_discovery_content
  add column if not exists content_version integer not null default 1;
alter table public.healthclues_discovery_content
  drop constraint if exists healthclues_discovery_content_content_version_check;
alter table public.healthclues_discovery_content
  add constraint healthclues_discovery_content_content_version_check check (content_version > 0);

create table if not exists public.healthclues_review_audit (
  id bigint generated always as identity primary key,
  content_id text not null,
  action text not null check (action in ('submitted', 'changes_requested', 'approved', 'rejected', 'activated', 'deactivated')),
  old_status text,
  new_status text not null,
  occurred_at timestamptz not null default now(),
  reason text not null,
  actor_identity text not null check (actor_identity = 'shared_admin_credential:EBOOK_ADMIN_TOKEN'),
  content_version integer not null check (content_version > 0)
);

create index if not exists healthclues_review_audit_content_idx
  on public.healthclues_review_audit (content_id, occurred_at desc, id desc);

alter table public.healthclues_review_audit enable row level security;
revoke all on public.healthclues_review_audit from public, anon, authenticated, service_role;
grant select on public.healthclues_review_audit to service_role;
revoke all on sequence public.healthclues_review_audit_id_seq from public, anon, authenticated, service_role;

create or replace function public.healthclues_review_write(
  p_content jsonb,
  p_action text,
  p_reason text,
  p_if_missing boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.healthclues_discovery_content%rowtype;
  v_old_status text;
  v_content_version integer;
  v_exists boolean;
  v_actor constant text := 'shared_admin_credential:EBOOK_ADMIN_TOKEN';
begin
  if p_action not in ('submitted', 'changes_requested', 'approved', 'rejected', 'activated', 'deactivated') then
    raise exception 'Invalid review action';
  end if;
  if p_reason is null or length(btrim(p_reason)) < 2 or length(p_reason) > 2000 then
    raise exception 'A reason or review note is required';
  end if;
  select * into v_item
  from jsonb_populate_record(null::public.healthclues_discovery_content, p_content);
  if v_item.id is null then raise exception 'Content ID is required'; end if;

  select status, content_version into v_old_status, v_content_version
  from public.healthclues_discovery_content
  where id = v_item.id
  for update;
  v_exists := found;
  if v_exists and p_action = 'submitted' and p_if_missing then
    return jsonb_build_object(
      'content_id', v_item.id,
      'old_status', v_old_status,
      'new_status', v_old_status,
      'content_version', v_content_version,
      'created', false
    );
  end if;
  v_content_version := coalesce(v_content_version, 0) + 1;

  insert into public.healthclues_discovery_content (
    id, locale, url, title, summary, topic_tags, content_type, estimated_minutes,
    ingredients, instructions, restrictions, country_relevance, evidence, safety_notes,
    review_status, reviewed_by, reviewed_at, status, content_version, updated_at
  ) values (
    v_item.id, v_item.locale, v_item.url, v_item.title, v_item.summary, v_item.topic_tags,
    v_item.content_type, v_item.estimated_minutes, v_item.ingredients, v_item.instructions,
    v_item.restrictions, v_item.country_relevance, v_item.evidence, v_item.safety_notes,
    v_item.review_status,
    case when v_item.review_status = 'reviewed' then v_actor else null end,
    case when v_item.review_status = 'reviewed' then now() else null end,
    v_item.status, v_content_version, now()
  ) on conflict (id) do update set
    locale = excluded.locale,
    url = excluded.url,
    title = excluded.title,
    summary = excluded.summary,
    topic_tags = excluded.topic_tags,
    content_type = excluded.content_type,
    estimated_minutes = excluded.estimated_minutes,
    ingredients = excluded.ingredients,
    instructions = excluded.instructions,
    restrictions = excluded.restrictions,
    country_relevance = excluded.country_relevance,
    evidence = excluded.evidence,
    safety_notes = excluded.safety_notes,
    review_status = excluded.review_status,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    status = excluded.status,
    content_version = excluded.content_version,
    updated_at = excluded.updated_at;

  insert into public.healthclues_review_audit
    (content_id, action, old_status, new_status, reason, actor_identity, content_version)
  values
    (v_item.id, p_action, v_old_status, v_item.status, btrim(p_reason), v_actor, v_content_version);

  return jsonb_build_object(
    'content_id', v_item.id,
    'old_status', v_old_status,
    'new_status', v_item.status,
    'content_version', v_content_version,
    'created', not v_exists
  );
end;
$$;

revoke all on function public.healthclues_review_write(jsonb, text, text, boolean) from public, anon, authenticated;
grant execute on function public.healthclues_review_write(jsonb, text, text, boolean) to service_role;

commit;
