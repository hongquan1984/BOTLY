-- Add independent RPG equipment positions while preserving slot_key as the tool's action category.
-- Additive, owner-scoped, service-role-only RPC; existing rows and history are retained.
alter table public.healthclues_toolkit_entries
  add column if not exists equipment_position smallint;

with ranked as (
  select id, row_number() over (partition by world_id order by created_at asc, id asc) as position
  from public.healthclues_toolkit_entries
  where status='equipped' and equipment_position is null
)
update public.healthclues_toolkit_entries e
set equipment_position=ranked.position::smallint
from ranked where e.id=ranked.id and ranked.position between 1 and 3;

alter table public.healthclues_toolkit_entries
  drop constraint if exists healthclues_toolkit_entries_equipment_position_check;
alter table public.healthclues_toolkit_entries
  add constraint healthclues_toolkit_entries_equipment_position_check
  check (equipment_position is null or equipment_position between 1 and 3);
create unique index if not exists healthclues_one_equipped_item_per_backpack_position
  on public.healthclues_toolkit_entries(world_id,equipment_position)
  where status='equipped' and equipment_position is not null;

create or replace function public.healthclues_equip_tool_v2(
  p_user_id uuid,
  p_world_id uuid,
  p_catalog_item_id text,
  p_item_version integer,
  p_request_key uuid,
  p_equipment_position smallint,
  p_replace_entry_id uuid default null,
  p_allow_demo_fixture boolean default false
) returns jsonb
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_world public.healthclues_wellness_worlds%rowtype;
  v_item public.healthclues_catalog_items%rowtype;
  v_version public.healthclues_catalog_item_versions%rowtype;
  v_branch public.healthclues_branches%rowtype;
  v_journey public.healthclues_journeys%rowtype;
  v_old public.healthclues_toolkit_entries%rowtype;
  v_collection uuid;
  v_entry uuid;
  v_existing uuid;
  v_local_date date;
  v_demo boolean;
begin
  if p_user_id is null or p_world_id is null or p_request_key is null
     or p_catalog_item_id is null or length(p_catalog_item_id)>120
     or p_item_version is null or p_item_version<1
     or p_equipment_position not between 1 and 3 then
    raise exception 'invalid_equip_request' using errcode='22023';
  end if;
  select * into v_world from public.healthclues_wellness_worlds
    where id=p_world_id and user_id=p_user_id for update;
  if not found then raise exception 'world_not_owned' using errcode='42501'; end if;

  select r.toolkit_entry_id into v_entry from public.healthclues_toolkit_entry_requests r
    where r.user_id=p_user_id and r.request_key=p_request_key;
  if found then return jsonb_build_object('entry_id',v_entry,'reused',true); end if;

  select * into v_item from public.healthclues_catalog_items i
    where i.id=p_catalog_item_id and i.current_version=p_item_version
      and i.active and i.review_status='reviewed' and i.recommendation_eligible;
  if not found then raise exception 'item_not_eligible' using errcode='22023'; end if;
  select * into v_version from public.healthclues_catalog_item_versions v
    where v.catalog_item_id=p_catalog_item_id and v.version=p_item_version;
  if not found then raise exception 'item_version_missing' using errcode='22023'; end if;
  v_demo := v_item.id like 'hc-demo-%' or v_version.reviewed_by='test-fixture'
    or coalesce((v_version.source_provenance->>'demo_only')::boolean,false);
  if v_demo and not coalesce(p_allow_demo_fixture,false) then
    raise exception 'demo_fixture_not_available' using errcode='42501';
  end if;

  select * into v_old from public.healthclues_toolkit_entries e
    where e.id=p_replace_entry_id and e.user_id=p_user_id and e.world_id=p_world_id
      and e.status='equipped' and e.equipment_position=p_equipment_position
    for update;
  if p_replace_entry_id is not null and not found then
    raise exception 'replacement_not_owned_or_in_position' using errcode='42501';
  end if;
  if p_replace_entry_id is null then
    select id into v_existing from public.healthclues_toolkit_entries
      where user_id=p_user_id and world_id=p_world_id and status='equipped'
        and equipment_position=p_equipment_position limit 1;
    if found then raise exception 'backpack_position_occupied' using errcode='23505'; end if;
  else
    if v_old.catalog_item_id=p_catalog_item_id then
      raise exception 'replacement_must_be_different' using errcode='22023';
    end if;
    update public.healthclues_toolkit_entries
      set status='archived',ended_on=(now() at time zone v_world.timezone)::date,updated_at=now()
      where id=v_old.id;
  end if;
  if (select count(*) from public.healthclues_toolkit_entries
      where user_id=p_user_id and world_id=p_world_id and status='equipped') >= 3 then
    raise exception 'backpack_full' using errcode='23514';
  end if;

  select * into v_branch from public.healthclues_branches b
    where b.world_id=p_world_id and b.user_id=p_user_id and b.status='active'
    order by b.created_at asc limit 1;
  if not found then raise exception 'active_branch_missing' using errcode='22023'; end if;
  select * into v_journey from public.healthclues_journeys j
    where j.branch_id=v_branch.id and j.user_id=p_user_id and j.status='active'
    order by j.started_on desc,j.created_at desc limit 1;
  if not found then raise exception 'active_journey_missing' using errcode='22023'; end if;

  insert into public.healthclues_toolkit_collection(user_id,catalog_item_id)
    values(p_user_id,p_catalog_item_id)
    on conflict(user_id,catalog_item_id) do update set saved_at=healthclues_toolkit_collection.saved_at
    returning id into v_collection;
  v_local_date := (now() at time zone v_world.timezone)::date;
  insert into public.healthclues_toolkit_entries(
    user_id,world_id,branch_id,journey_id,collection_id,catalog_item_id,item_version,
    slot_key,status,schedule,started_on,equipment_position
  ) values (
    p_user_id,p_world_id,v_branch.id,v_journey.id,v_collection,p_catalog_item_id,p_item_version,
    v_item.slot_key,'equipped','{}'::jsonb,v_local_date,p_equipment_position
  ) returning id into v_entry;
  if p_replace_entry_id is not null then
    update public.healthclues_toolkit_entries set replaced_by=v_entry where id=v_old.id;
    insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,replacement_entry_id,effective_date)
      values(p_user_id,v_old.id,'replaced','equipped','archived',v_old.schedule,v_old.schedule,v_entry,v_local_date);
  end if;
  insert into public.healthclues_toolkit_entry_requests(user_id,request_key,toolkit_entry_id)
    values(p_user_id,p_request_key,v_entry);
  return jsonb_build_object('entry_id',v_entry,'reused',false,'slot_key',v_item.slot_key,
    'equipment_position',p_equipment_position,'replaced_entry_id',p_replace_entry_id);
end; $$;

revoke all on function public.healthclues_equip_tool_v2(uuid,uuid,text,integer,uuid,smallint,uuid,boolean) from public,anon,authenticated;
grant execute on function public.healthclues_equip_tool_v2(uuid,uuid,text,integer,uuid,smallint,uuid,boolean) to service_role;
notify pgrst, 'reload schema';

-- Keep the legacy typed slot_key as an action category while allowing repeated categories in the three inventory positions.
create or replace function public.healthclues_create_world_v1(
  p_user_id uuid,p_request_key uuid,p_topic_key text,p_title text,p_timezone text,p_started_on date,p_selections jsonb
) returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_world public.healthclues_wellness_worlds%rowtype;
  v_branch public.healthclues_branches%rowtype;
  v_journey public.healthclues_journeys%rowtype;
  v_row jsonb;
  v_item public.healthclues_catalog_items%rowtype;
  v_collection uuid;
  v_item_ids text[]:=array[]::text[];
  v_entries integer:=0;
  v_method text;
  v_method_version integer;
begin
  if p_user_id is null or p_request_key is null or jsonb_typeof(p_selections)<>'array' or jsonb_array_length(p_selections)>3 then
    raise exception 'invalid_world_request' using errcode='22023';
  end if;
  if p_timezone is null or length(p_timezone)>100 or p_title is null or length(trim(p_title)) not between 1 and 100 then
    raise exception 'invalid_world_metadata' using errcode='22023';
  end if;
  insert into public.healthclues_wellness_worlds(user_id,timezone) values(p_user_id,p_timezone)
    on conflict(user_id) do update set updated_at=now() returning * into v_world;
  select * into v_journey from public.healthclues_journeys where user_id=p_user_id and request_key=p_request_key;
  if found then
    select * into v_branch from public.healthclues_branches where id=v_journey.branch_id and user_id=p_user_id;
    return jsonb_build_object('world_id',v_world.id,'branch_id',v_branch.id,'journey_id',v_journey.id,'reused',true);
  end if;
  insert into public.healthclues_branches(world_id,user_id,topic_key,title)
    values(v_world.id,p_user_id,left(coalesce(nullif(p_topic_key,''),'general'),80),left(trim(p_title),120)) returning * into v_branch;
  insert into public.healthclues_journeys(branch_id,user_id,title,started_on,request_key)
    values(v_branch.id,p_user_id,left(trim(p_title),120),coalesce(p_started_on,(now() at time zone p_timezone)::date),p_request_key) returning * into v_journey;
  for v_row in select value from jsonb_array_elements(p_selections) loop
    if coalesce(v_row->>'slot_key','') not in ('consume','reduce','practice')
       or coalesce(v_row->>'catalog_item_id','')=any(v_item_ids) then
      raise exception 'invalid_or_duplicate_equipment' using errcode='22023';
    end if;
    v_item_ids:=array_append(v_item_ids,v_row->>'catalog_item_id');
    select * into v_item from public.healthclues_catalog_items i
      where i.id=v_row->>'catalog_item_id' and i.active and i.review_status='reviewed' and i.recommendation_eligible
        and i.slot_key=v_row->>'slot_key' and i.current_version=(v_row->>'item_version')::integer;
    if not found then raise exception 'catalog_item_not_eligible' using errcode='22023'; end if;
    v_method:=nullif(v_row->>'method_id',''); v_method_version:=nullif(v_row->>'method_version','')::integer;
    if (v_method is null)<>(v_method_version is null) then raise exception 'invalid_method_version' using errcode='22023'; end if;
    if v_method is not null and not exists(
      select 1 from public.healthclues_usage_methods m
      join public.healthclues_usage_method_versions mv on mv.method_id=m.id and mv.version=v_method_version
      join public.healthclues_usage_method_items mi on mi.method_id=mv.method_id and mi.method_version=mv.version and mi.catalog_item_id=v_item.id
      where m.id=v_method and m.active and m.review_status='reviewed' and m.current_version=v_method_version and mv.review_status='reviewed'
    ) then raise exception 'usage_method_not_eligible' using errcode='22023'; end if;
    insert into public.healthclues_toolkit_collection(user_id,catalog_item_id) values(p_user_id,v_item.id)
      on conflict(user_id,catalog_item_id) do update set saved_at=healthclues_toolkit_collection.saved_at returning id into v_collection;
    v_entries:=v_entries+1;
    insert into public.healthclues_toolkit_entries(user_id,world_id,branch_id,journey_id,collection_id,catalog_item_id,item_version,method_id,method_version,slot_key,status,schedule,started_on,equipment_position)
      values(p_user_id,v_world.id,v_branch.id,v_journey.id,v_collection,v_item.id,v_item.current_version,v_method,v_method_version,v_item.slot_key,'equipped',coalesce(v_row->'schedule','{}'::jsonb),v_journey.started_on,v_entries::smallint);
  end loop;
  return jsonb_build_object('world_id',v_world.id,'branch_id',v_branch.id,'journey_id',v_journey.id,'entries_created',v_entries,'reused',false);
end; $$;
revoke all on function public.healthclues_create_world_v1(uuid,uuid,text,text,text,date,jsonb) from public,anon,authenticated;
grant execute on function public.healthclues_create_world_v1(uuid,uuid,text,text,text,date,jsonb) to service_role;
notify pgrst, 'reload schema';
