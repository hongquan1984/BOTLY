begin;

alter table public.healthclues_discovery_activity
  drop constraint if exists healthclues_discovery_activity_action_check;

alter table public.healthclues_discovery_activity
  add constraint healthclues_discovery_activity_action_check
  check (action in ('viewed', 'saved', 'tried', 'not_yet', 'not_interested', 'skipped'));

commit;
