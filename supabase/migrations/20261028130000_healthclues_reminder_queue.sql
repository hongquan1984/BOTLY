-- Local/test-safe reminder queue. Provider delivery is deliberately handled outside the DB.
create or replace function public.healthclues_queue_daily_reminders_v1(p_run_at timestamptz)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_pref public.healthclues_email_preferences%rowtype; v_local_date date; v_local_time time; v_inserted integer:=0; v_rows integer;
begin
  if p_run_at is null then raise exception 'invalid_reminder_run_at' using errcode='22023'; end if;
  for v_pref in select * from public.healthclues_email_preferences where opted_in and not paused loop
    v_local_date := (p_run_at at time zone v_pref.timezone)::date;
    v_local_time := (p_run_at at time zone v_pref.timezone)::time;
    if v_pref.local_send_time>v_local_time then continue; end if;
    if v_pref.frequency='weekdays' and extract(isodow from v_local_date) not between 1 and 5 then continue; end if;
    if v_pref.frequency='weekly' and extract(isodow from v_local_date)<>1 then continue; end if;
    insert into public.healthclues_notification_deliveries(user_id,template_key,local_date,idempotency_key,state,scheduled_at)
      values(v_pref.user_id,'healthclues-daily-journey-v1',v_local_date,'healthclues-daily:'||v_pref.user_id::text||':'||v_local_date::text,'queued',((v_local_date+v_pref.local_send_time) at time zone v_pref.timezone))
      on conflict(user_id,local_date,template_key) do nothing;
    get diagnostics v_rows=row_count; v_inserted:=v_inserted+v_rows;
  end loop;
  return v_inserted;
end; $$;

create or replace function public.healthclues_dispatch_mock_reminders_v1(p_run_at timestamptz,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_claimed integer:=0; v_sent integer:=0;
begin
  if p_run_at is null or p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_reminder_dispatch' using errcode='22023'; end if;
  with due as (
    select d.id from public.healthclues_notification_deliveries d
    join public.healthclues_email_preferences p on p.user_id=d.user_id and p.opted_in and not p.paused
    where d.state='queued' and d.scheduled_at<=p_run_at and d.attempts<10 and d.template_key='healthclues-daily-journey-v1'
    order by d.scheduled_at,d.id limit p_limit for update of d skip locked
  ), sent as (
    update public.healthclues_notification_deliveries d
      set state='sent',attempts=d.attempts+1,sent_at=p_run_at,provider_message_id='mock:'||d.id::text,safe_error_code=null
      from due where d.id=due.id returning d.id
  ) select count(*) into v_sent from sent;
  v_claimed:=v_sent;
  return jsonb_build_object('claimed',v_claimed,'sent',v_sent,'provider','mock');
end; $$;

revoke all on function public.healthclues_queue_daily_reminders_v1(timestamptz) from public,anon,authenticated;
revoke all on function public.healthclues_dispatch_mock_reminders_v1(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.healthclues_queue_daily_reminders_v1(timestamptz) to service_role;
grant execute on function public.healthclues_dispatch_mock_reminders_v1(timestamptz,integer) to service_role;
notify pgrst,'reload schema';
