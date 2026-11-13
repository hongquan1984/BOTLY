-- Preserve a distinct "Don't Remember" response in private usage history.
-- Additive only; existing statuses and historical rows remain valid.
alter table public.healthclues_daily_usage_records
  drop constraint if exists healthclues_daily_usage_records_status_check;
alter table public.healthclues_daily_usage_records
  add constraint healthclues_daily_usage_records_status_check
  check (status in ('done','not_yet','skipped','not_suitable','unsure'));

alter table public.healthclues_usage_occurrences
  drop constraint if exists healthclues_usage_occurrences_status_check;
alter table public.healthclues_usage_occurrences
  add constraint healthclues_usage_occurrences_status_check
  check (status in ('done','not_yet','skipped','not_suitable','unsure'));

-- Retain the established owner-scoped check-in RPC logic, grants and XP behavior;
-- widen only its two status allowlists. Fail migration if the expected old body changed.
do $$
declare
  v_definition text;
  v_old text := '''done'',''not_yet'',''skipped'',''not_suitable''';
  v_new text := '''done'',''not_yet'',''skipped'',''not_suitable'',''unsure''';
begin
  select pg_get_functiondef('public.healthclues_save_daily_checkin_v1(uuid,uuid,date,text,jsonb,text,text)'::regprocedure)
    into v_definition;
  if length(v_definition) - length(replace(v_definition, v_old, '')) <> 2 * length(v_old) then
    raise exception 'Unexpected check-in RPC status allowlist; refusing to replace function.';
  end if;
  execute replace(v_definition, v_old, v_new);
end;
$$;
notify pgrst, 'reload schema';
