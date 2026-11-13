-- Isolated local Mailpit worker support. This grants only the existing service role
-- the ability to atomically claim queued delivery rows and record the result.
create or replace function public.healthclues_claim_mailpit_reminders_v1(p_run_at timestamptz, p_limit integer default 50)
returns table(delivery_id uuid, recipient_email text, nickname text)
language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  if p_run_at is null or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'invalid_mailpit_reminder_claim' using errcode='22023';
  end if;
  return query
  with due as (
    select d.id, d.user_id
    from public.healthclues_notification_deliveries d
    join public.healthclues_email_preferences p on p.user_id=d.user_id and p.opted_in and not p.paused
    join auth.users u on u.id=d.user_id and u.email_confirmed_at is not null and u.email is not null
    where d.state='queued' and d.scheduled_at<=p_run_at and d.attempts<10 and d.template_key='healthclues-daily-journey-v1'
    order by d.scheduled_at,d.id limit p_limit for update of d skip locked
  ), claimed as (
    update public.healthclues_notification_deliveries d
      set state='claimed', attempts=d.attempts+1, safe_error_code=null
      from due where d.id=due.id
      returning d.id, d.user_id
  )
  select c.id, u.email::text,
    coalesce(nullif(left(trim(coalesce(p.profile->>'nickname','')),32),''),'Adventurer')
  from claimed c
  join auth.users u on u.id=c.user_id
  left join public.healthclues_profiles p on p.user_id=c.user_id;
end; $$;

create or replace function public.healthclues_finish_mailpit_reminder_v1(
  p_delivery_id uuid, p_sent boolean, p_message_id text default null, p_error_code text default null, p_run_at timestamptz default now()
) returns boolean language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_updated integer;
begin
  if p_delivery_id is null or p_sent is null or p_run_at is null
    or (p_message_id is not null and length(p_message_id)>160)
    or (p_error_code is not null and p_error_code not in ('mailpit_unavailable','mailpit_rejected','mailpit_timeout')) then
    raise exception 'invalid_mailpit_reminder_result' using errcode='22023';
  end if;
  update public.healthclues_notification_deliveries d
    set state=case when p_sent then 'sent' else 'failed' end,
        sent_at=case when p_sent then p_run_at else null end,
        provider_message_id=case when p_sent then p_message_id else null end,
        safe_error_code=case when p_sent then null else coalesce(p_error_code,'mailpit_rejected') end,
        scheduled_at=case when p_sent then d.scheduled_at else p_run_at+interval '5 minutes' end
    where d.id=p_delivery_id and d.state='claimed' and d.template_key='healthclues-daily-journey-v1';
  get diagnostics v_updated=row_count;
  return v_updated=1;
end; $$;

revoke all on function public.healthclues_claim_mailpit_reminders_v1(timestamptz,integer) from public,anon,authenticated;
revoke all on function public.healthclues_finish_mailpit_reminder_v1(uuid,boolean,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.healthclues_claim_mailpit_reminders_v1(timestamptz,integer) to service_role;
grant execute on function public.healthclues_finish_mailpit_reminder_v1(uuid,boolean,text,text,timestamptz) to service_role;
notify pgrst,'reload schema';
