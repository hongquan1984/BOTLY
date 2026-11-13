-- Bounded retry support. Failed rows are retried only while consent remains active.
create or replace function public.healthclues_requeue_failed_reminders_v1(p_run_at timestamptz,p_limit integer default 50)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_count integer;
begin
  if p_run_at is null or p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_reminder_retry' using errcode='22023'; end if;
  update public.healthclues_notification_deliveries d set state='canceled',safe_error_code=case when not p.opted_in then 'opted_out' else 'paused' end
    from public.healthclues_email_preferences p where p.user_id=d.user_id and d.state='failed' and (not p.opted_in or p.paused) and d.template_key='healthclues-daily-journey-v1';
  with due as (select d.id from public.healthclues_notification_deliveries d join public.healthclues_email_preferences p on p.user_id=d.user_id and p.opted_in and not p.paused
    where d.state='failed' and d.scheduled_at<=p_run_at and d.attempts<3 and d.template_key='healthclues-daily-journey-v1' order by d.scheduled_at,d.id limit p_limit for update of d skip locked)
  update public.healthclues_notification_deliveries d set state='queued',safe_error_code=null from due where d.id=due.id;
  get diagnostics v_count=row_count; return v_count;
end; $$;

-- Test provider hook: callable only by the authenticated internal worker and only when explicitly enabled.
create or replace function public.healthclues_mock_fail_due_reminders_v1(p_run_at timestamptz,p_limit integer default 50)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_count integer;
begin
  if p_run_at is null or p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_mock_failure' using errcode='22023'; end if;
  with due as (select d.id from public.healthclues_notification_deliveries d join public.healthclues_email_preferences p on p.user_id=d.user_id and p.opted_in and not p.paused
    where d.state='queued' and d.scheduled_at<=p_run_at and d.template_key='healthclues-daily-journey-v1' order by d.scheduled_at,d.id limit p_limit for update of d skip locked)
  update public.healthclues_notification_deliveries d set state='failed',attempts=d.attempts+1,scheduled_at=p_run_at+interval '5 minutes',safe_error_code='mock_transient'
    from due where d.id=due.id;
  get diagnostics v_count=row_count; return v_count;
end; $$;
revoke all on function public.healthclues_requeue_failed_reminders_v1(timestamptz,integer) from public,anon,authenticated;
revoke all on function public.healthclues_mock_fail_due_reminders_v1(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.healthclues_requeue_failed_reminders_v1(timestamptz,integer) to service_role;
grant execute on function public.healthclues_mock_fail_due_reminders_v1(timestamptz,integer) to service_role;
notify pgrst,'reload schema';
