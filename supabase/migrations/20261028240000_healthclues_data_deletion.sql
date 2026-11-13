begin;

-- Local/test and release-gated account-data deletion lifecycle.
-- The 30-day recovery and 60-day maximum purge deadline reflect the proposed
-- HC-BR39 schedule and still require privacy review before production release.
create table if not exists public.healthclues_account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null check (status in ('requested','canceled','purged')),
  requested_at timestamptz not null default now(),
  recovery_until timestamptz not null,
  purge_after timestamptz not null,
  canceled_at timestamptz,
  purged_at timestamptz,
  check (purge_after >= recovery_until),
  check ((status='requested' and user_id is not null and canceled_at is null and purged_at is null)
      or (status='canceled' and user_id is not null and canceled_at is not null and purged_at is null)
      or (status='purged' and user_id is null and purged_at is not null))
);
create unique index if not exists healthclues_one_pending_deletion_per_user
  on public.healthclues_account_deletion_requests(user_id) where status='requested' and user_id is not null;
alter table public.healthclues_account_deletion_requests enable row level security;
revoke all on public.healthclues_account_deletion_requests from public,anon,authenticated;
grant all on public.healthclues_account_deletion_requests to service_role;

create or replace function public.healthclues_account_access_enabled_v1()
returns boolean
language sql stable security definer
set search_path=public,auth,pg_temp
as $$
  select auth.uid() is not null and not exists (
    select 1 from public.healthclues_account_deletion_requests d
    where d.user_id=auth.uid() and d.status='requested'
  );
$$;
revoke all on function public.healthclues_account_access_enabled_v1() from public,anon;
grant execute on function public.healthclues_account_access_enabled_v1() to authenticated;

-- All direct owner RLS reads/writes lock as soon as a deletion is requested.
do $$ declare t text; begin
  foreach t in array array[
    'healthclues_personal_tools','healthclues_catalog_proposals','healthclues_wellness_worlds',
    'healthclues_branches','healthclues_journeys','healthclues_toolkit_collection',
    'healthclues_toolkit_entries','healthclues_daily_checkins','healthclues_daily_usage_records',
    'healthclues_usage_occurrences','healthclues_journal_entries','healthclues_xp_ledger',
    'healthclues_user_rewards','healthclues_user_milestones','healthclues_email_preferences',
    'healthclues_notification_deliveries'
  ] loop
    execute format('drop policy if exists owner_access on public.%I',t);
    execute format('create policy owner_access on public.%I for all to authenticated using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1()) with check (user_id=auth.uid() and public.healthclues_account_access_enabled_v1())',t);
  end loop;
end $$;

drop policy if exists "HealthClues users manage their own profile" on public.healthclues_profiles;
create policy "HealthClues users manage their own profile" on public.healthclues_profiles
  for all to authenticated using (auth.uid()=user_id and public.healthclues_account_access_enabled_v1())
  with check (auth.uid()=user_id and public.healthclues_account_access_enabled_v1());
drop policy if exists "HealthClues users manage their own discovery activity" on public.healthclues_discovery_activity;
create policy "HealthClues users manage their own discovery activity" on public.healthclues_discovery_activity
  for all to authenticated using (auth.uid()=user_id and public.healthclues_account_access_enabled_v1())
  with check (auth.uid()=user_id and public.healthclues_account_access_enabled_v1());

drop policy if exists owner_read_toolkit_events on public.healthclues_toolkit_entry_events;
create policy owner_read_toolkit_events on public.healthclues_toolkit_entry_events for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists owner_access on public.healthclues_journey_follows;
create policy owner_access on public.healthclues_journey_follows for all to authenticated
  using (follower_user_id=auth.uid() and public.healthclues_account_access_enabled_v1())
  with check (follower_user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists owner_access on public.healthclues_community_reports;
drop policy if exists report_read_own on public.healthclues_community_reports;
create policy owner_access on public.healthclues_community_reports for insert to authenticated
  with check (reporter_user_id=auth.uid() and status='open' and resolved_at is null and resolver_id is null and public.healthclues_account_access_enabled_v1());
create policy report_read_own on public.healthclues_community_reports for select to authenticated
  using (reporter_user_id=auth.uid() and public.healthclues_account_access_enabled_v1());

do $$ declare t text; begin
  foreach t in array array[
    'healthclues_knowledge_discoveries','healthclues_knowledge_attempts',
    'healthclues_boss_attempts','healthclues_boss_clears','healthclues_world_unlocks',
    'healthclues_knowledge_currency_ledger'
  ] loop
    execute format('drop policy if exists owner_read_knowledge_book on public.%I',t);
  end loop;
end $$;
drop policy if exists owner_read_knowledge_book on public.healthclues_knowledge_discoveries;
create policy owner_read_knowledge_book on public.healthclues_knowledge_discoveries for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists owner_read_knowledge_attempts on public.healthclues_knowledge_attempts;
create policy owner_read_knowledge_attempts on public.healthclues_knowledge_attempts for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists boss_attempts_owner_read on public.healthclues_boss_attempts;
create policy boss_attempts_owner_read on public.healthclues_boss_attempts for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists boss_clears_owner_read on public.healthclues_boss_clears;
create policy boss_clears_owner_read on public.healthclues_boss_clears for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists world_unlocks_owner_read on public.healthclues_world_unlocks;
create policy world_unlocks_owner_read on public.healthclues_world_unlocks for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());
drop policy if exists owner_read_knowledge_currency on public.healthclues_knowledge_currency_ledger;
create policy owner_read_knowledge_currency on public.healthclues_knowledge_currency_ledger for select to authenticated
  using (user_id=auth.uid() and public.healthclues_account_access_enabled_v1());

create or replace function public.healthclues_request_data_deletion_v1(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_request public.healthclues_account_deletion_requests%rowtype;
begin
  if p_user_id is null then raise exception 'invalid_user' using errcode='22023'; end if;
  select * into v_request from public.healthclues_account_deletion_requests
    where user_id=p_user_id and status='requested' for update;
  if not found then
    insert into public.healthclues_account_deletion_requests(user_id,status,requested_at,recovery_until,purge_after)
      values (p_user_id,'requested',now(),now()+interval '30 days',now()+interval '60 days')
      returning * into v_request;
  end if;
  update public.healthclues_public_journeys set status='revoked',updated_at=now()
    where user_id=p_user_id and status='active';
  update public.healthclues_email_preferences set opted_in=false,paused=false,updated_at=now() where user_id=p_user_id;
  update public.healthclues_notification_deliveries set state='canceled',safe_error_code='account_deletion_requested'
    where user_id=p_user_id and state in ('queued','failed','claimed');
  return jsonb_build_object('id',v_request.id,'status',v_request.status,'requested_at',v_request.requested_at,
    'recovery_until',v_request.recovery_until,'purge_after',v_request.purge_after);
end;
$$;

create or replace function public.healthclues_cancel_data_deletion_v1(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_count integer;
begin
  if p_user_id is null then raise exception 'invalid_user' using errcode='22023'; end if;
  update public.healthclues_account_deletion_requests set status='canceled',canceled_at=now()
    where user_id=p_user_id and status='requested' and recovery_until>now();
  get diagnostics v_count=row_count;
  return jsonb_build_object('canceled',v_count=1);
end;
$$;

create or replace function public.healthclues_purge_due_data_deletions_v1(p_run_at timestamptz,p_limit integer default 10)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_request record; v_user uuid; v_limit integer; v_processed integer:=0;
begin
  if p_run_at is null then raise exception 'invalid_run_time' using errcode='22023'; end if;
  v_limit:=greatest(1,least(coalesce(p_limit,10),100));
  for v_request in
    select id,user_id from public.healthclues_account_deletion_requests
    where status='requested' and user_id is not null and purge_after<=p_run_at
    order by requested_at for update skip locked limit v_limit
  loop
    v_user:=v_request.user_id;
    delete from public.healthclues_community_reports r where r.reporter_user_id=v_user or r.public_journey_id in (select p.id from public.healthclues_public_journeys p where p.user_id=v_user);
    delete from public.healthclues_journey_follows f where f.follower_user_id=v_user or f.public_journey_id in (select p.id from public.healthclues_public_journeys p where p.user_id=v_user);
    delete from public.healthclues_public_journeys where user_id=v_user;
    delete from public.healthclues_notification_deliveries where user_id=v_user;
    delete from public.healthclues_email_preferences where user_id=v_user;
    delete from public.healthclues_toolkit_entry_events where user_id=v_user;
    delete from public.healthclues_toolkit_entry_requests where user_id=v_user;
    delete from public.healthclues_journal_entries where user_id=v_user;
    delete from public.healthclues_usage_occurrences where user_id=v_user;
    delete from public.healthclues_daily_usage_records where user_id=v_user;
    delete from public.healthclues_daily_checkins where user_id=v_user;
    delete from public.healthclues_toolkit_entries where user_id=v_user;
    delete from public.healthclues_toolkit_collection where user_id=v_user;
    delete from public.healthclues_catalog_proposals where user_id=v_user;
    delete from public.healthclues_personal_tools where user_id=v_user;
    delete from public.healthclues_knowledge_attempts where user_id=v_user;
    delete from public.healthclues_knowledge_discoveries where user_id=v_user;
    delete from public.healthclues_boss_attempts where user_id=v_user;
    delete from public.healthclues_boss_clears where user_id=v_user;
    delete from public.healthclues_world_unlocks where user_id=v_user;
    delete from public.healthclues_knowledge_currency_ledger where user_id=v_user;
    delete from public.healthclues_user_milestones where user_id=v_user;
    delete from public.healthclues_user_rewards where user_id=v_user;
    delete from public.healthclues_xp_ledger where user_id=v_user;
    delete from public.healthclues_discovery_activity where user_id=v_user;
    delete from public.healthclues_wellness_worlds where user_id=v_user;
    delete from public.healthclues_profiles where user_id=v_user;
    update public.healthclues_account_deletion_requests set user_id=null,status='purged',purged_at=p_run_at
      where id=v_request.id;
    v_processed:=v_processed+1;
  end loop;
  return v_processed;
end;
$$;

revoke all on function public.healthclues_request_data_deletion_v1(uuid) from public,anon,authenticated;
revoke all on function public.healthclues_cancel_data_deletion_v1(uuid) from public,anon,authenticated;
revoke all on function public.healthclues_purge_due_data_deletions_v1(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.healthclues_request_data_deletion_v1(uuid) to service_role;
grant execute on function public.healthclues_cancel_data_deletion_v1(uuid) to service_role;
grant execute on function public.healthclues_purge_due_data_deletions_v1(timestamptz,integer) to service_role;

commit;
