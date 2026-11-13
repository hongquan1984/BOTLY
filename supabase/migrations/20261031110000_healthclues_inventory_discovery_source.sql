-- Preserve the NPC discovery origin of equipped tools without guessing from a Backpack slot.
-- Legacy entries stay NULL and remain visible in the general Backpack only.
begin;
alter table public.healthclues_toolkit_entries
  add column if not exists discovery_station text;

alter table public.healthclues_toolkit_entries
  drop constraint if exists healthclues_toolkit_entries_discovery_station_check;
alter table public.healthclues_toolkit_entries
  add constraint healthclues_toolkit_entries_discovery_station_check
  check (discovery_station is null or discovery_station in ('nutrition','practices','movement'));

create or replace function public.healthclues_equip_tool_from_station_v1(
  p_user_id uuid,
  p_world_id uuid,
  p_catalog_item_id text,
  p_item_version integer,
  p_request_key uuid,
  p_equipment_position smallint,
  p_replace_entry_id uuid default null,
  p_allow_demo_fixture boolean default false,
  p_discovery_station text default null
) returns jsonb
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_result jsonb;
  v_entry uuid;
  v_existing_station text;
begin
  if p_discovery_station not in ('nutrition','practices','movement') then
    raise exception 'invalid_discovery_station' using errcode='22023';
  end if;
  v_result := public.healthclues_equip_tool_v2(
    p_user_id,p_world_id,p_catalog_item_id,p_item_version,p_request_key,
    p_equipment_position,p_replace_entry_id,p_allow_demo_fixture
  );
  v_entry := nullif(v_result->>'entry_id','')::uuid;
  if v_entry is null then raise exception 'equipped_entry_missing' using errcode='22023'; end if;

  select discovery_station into v_existing_station
    from public.healthclues_toolkit_entries
    where id=v_entry and user_id=p_user_id and world_id=p_world_id and status='equipped'
    for update;
  if not found then raise exception 'world_not_owned' using errcode='42501'; end if;
  if v_existing_station is not null and v_existing_station <> p_discovery_station then
    raise exception 'request_source_mismatch' using errcode='22023';
  end if;
  update public.healthclues_toolkit_entries
    set discovery_station=p_discovery_station
    where id=v_entry and user_id=p_user_id and world_id=p_world_id;
  return v_result || jsonb_build_object('discovery_station',p_discovery_station);
end; $$;

revoke all on function public.healthclues_equip_tool_from_station_v1(uuid,uuid,text,integer,uuid,smallint,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.healthclues_equip_tool_from_station_v1(uuid,uuid,text,integer,uuid,smallint,uuid,boolean,text) to service_role;
notify pgrst, 'reload schema';
commit;
