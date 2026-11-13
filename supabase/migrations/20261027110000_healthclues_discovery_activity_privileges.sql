begin;

-- Do not inherit broad default privileges from the restored Botly schema.
revoke all on table public.healthclues_discovery_activity
  from public, anon, authenticated, service_role;
grant select, insert, delete on table public.healthclues_discovery_activity
  to authenticated;
grant all on table public.healthclues_discovery_activity to service_role;

revoke all on sequence public.healthclues_discovery_activity_id_seq
  from public, anon, authenticated, service_role;
grant usage, select on sequence public.healthclues_discovery_activity_id_seq
  to authenticated;
grant all on sequence public.healthclues_discovery_activity_id_seq to service_role;

commit;
