-- Owner-scoped Toolkit lifecycle actions. Apply only through the approved migration workflow.
create table if not exists public.healthclues_toolkit_entry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  toolkit_entry_id uuid not null,
  event_type text not null check (event_type in ('paused','resumed','scheduled','archived','replaced')),
  previous_status text not null check (previous_status in ('equipped','in_collection','paused','archived')),
  next_status text not null check (next_status in ('equipped','in_collection','paused','archived')),
  previous_schedule jsonb not null default '{}'::jsonb,
  next_schedule jsonb not null default '{}'::jsonb,
  replacement_entry_id uuid,
  effective_date date not null,
  created_at timestamptz not null default now(),
  foreign key (toolkit_entry_id,user_id) references public.healthclues_toolkit_entries(id,user_id) on delete cascade,
  foreign key (replacement_entry_id,user_id) references public.healthclues_toolkit_entries(id,user_id) on delete restrict
);
create index if not exists healthclues_toolkit_entry_events_user_date_idx on public.healthclues_toolkit_entry_events(user_id,created_at desc);
alter table public.healthclues_toolkit_entry_events enable row level security;
revoke all on public.healthclues_toolkit_entry_events from public,anon;
grant select on public.healthclues_toolkit_entry_events to authenticated;
revoke insert,update,delete on public.healthclues_toolkit_entry_events from authenticated;
grant all on public.healthclues_toolkit_entry_events to service_role;
drop policy if exists owner_read_toolkit_events on public.healthclues_toolkit_entry_events;
create policy owner_read_toolkit_events on public.healthclues_toolkit_entry_events for select to authenticated using (user_id=auth.uid());

create or replace function public.healthclues_manage_toolkit_entry_v1(
  p_user_id uuid,
  p_entry_id uuid,
  p_action text,
  p_catalog_item_id text default null,
  p_item_version integer default null,
  p_schedule jsonb default null
) returns jsonb
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_old public.healthclues_toolkit_entries%rowtype;
  v_item public.healthclues_catalog_items%rowtype;
  v_collection uuid;
  v_new_id uuid;
  v_local_date date;
begin
  if p_user_id is null or p_entry_id is null or p_action not in ('pause','resume','archive','schedule','replace') then
    raise exception 'invalid_toolkit_action' using errcode='22023';
  end if;
  if p_schedule is not null and jsonb_typeof(p_schedule)<>'object' then
    raise exception 'invalid_toolkit_schedule' using errcode='22023';
  end if;
  select * into v_old from public.healthclues_toolkit_entries
    where id=p_entry_id and user_id=p_user_id for update;
  if not found then raise exception 'toolkit_entry_not_owned' using errcode='42501'; end if;
  select (now() at time zone w.timezone)::date into v_local_date
    from public.healthclues_wellness_worlds w where w.id=v_old.world_id and w.user_id=p_user_id;

  if p_action='pause' then
    if v_old.status<>'equipped' then raise exception 'toolkit_entry_not_active' using errcode='22023'; end if;
    update public.healthclues_toolkit_entries set status='paused',updated_at=now() where id=v_old.id;
    insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,effective_date)
      values(p_user_id,v_old.id,'paused',v_old.status,'paused',v_old.schedule,v_old.schedule,coalesce(v_local_date,current_date));
    return jsonb_build_object('entry_id',v_old.id,'status','paused');
  elsif p_action='resume' then
    if v_old.status<>'paused' then raise exception 'toolkit_entry_not_paused' using errcode='22023'; end if;
    update public.healthclues_toolkit_entries set status='equipped',ended_on=null,updated_at=now() where id=v_old.id;
    insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,effective_date)
      values(p_user_id,v_old.id,'resumed',v_old.status,'equipped',v_old.schedule,v_old.schedule,coalesce(v_local_date,current_date));
    return jsonb_build_object('entry_id',v_old.id,'status','equipped');
  elsif p_action='schedule' then
    if v_old.status not in ('equipped','paused') or p_schedule is null then raise exception 'invalid_schedule_change' using errcode='22023'; end if;
    update public.healthclues_toolkit_entries set schedule=p_schedule,updated_at=now() where id=v_old.id;
    insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,effective_date)
      values(p_user_id,v_old.id,'scheduled',v_old.status,v_old.status,v_old.schedule,p_schedule,coalesce(v_local_date,current_date));
    return jsonb_build_object('entry_id',v_old.id,'status',v_old.status,'schedule',p_schedule);
  elsif p_action='archive' then
    if v_old.status not in ('equipped','paused','in_collection') then raise exception 'toolkit_entry_not_archivable' using errcode='22023'; end if;
    update public.healthclues_toolkit_entries set status='archived',ended_on=coalesce(v_local_date,current_date),updated_at=now() where id=v_old.id;
    insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,effective_date)
      values(p_user_id,v_old.id,'archived',v_old.status,'archived',v_old.schedule,v_old.schedule,coalesce(v_local_date,current_date));
    return jsonb_build_object('entry_id',v_old.id,'status','archived');
  end if;

  if v_old.status not in ('equipped','paused') or v_old.catalog_item_id is null or p_catalog_item_id is null or p_catalog_item_id=v_old.catalog_item_id or p_item_version is null then
    raise exception 'invalid_replacement_request' using errcode='22023';
  end if;
  select * into v_item from public.healthclues_catalog_items i
    where i.id=p_catalog_item_id and i.active and i.review_status='reviewed' and i.recommendation_eligible
      and i.current_version=p_item_version and i.slot_key=v_old.slot_key;
  if not found then raise exception 'replacement_not_eligible' using errcode='22023'; end if;
  insert into public.healthclues_toolkit_collection(user_id,catalog_item_id) values(p_user_id,v_item.id)
    on conflict(user_id,catalog_item_id) do update set saved_at=healthclues_toolkit_collection.saved_at returning id into v_collection;
  insert into public.healthclues_toolkit_entries(user_id,world_id,branch_id,journey_id,collection_id,catalog_item_id,item_version,method_id,method_version,slot_key,status,schedule,started_on)
    values(p_user_id,v_old.world_id,v_old.branch_id,v_old.journey_id,v_collection,v_item.id,v_item.current_version,null,null,v_old.slot_key,'equipped',coalesce(p_schedule,v_old.schedule),coalesce(v_local_date,current_date))
    returning id into v_new_id;
  update public.healthclues_toolkit_entries set status='archived',ended_on=coalesce(v_local_date,current_date),replaced_by=v_new_id,updated_at=now() where id=v_old.id;
  insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,previous_schedule,next_schedule,replacement_entry_id,effective_date)
    values(p_user_id,v_old.id,'replaced',v_old.status,'archived',v_old.schedule,v_old.schedule,v_new_id,coalesce(v_local_date,current_date));
  return jsonb_build_object('entry_id',v_old.id,'status','archived','replacement_entry_id',v_new_id,'replacement_catalog_item_id',v_item.id);
end; $$;

revoke all on function public.healthclues_manage_toolkit_entry_v1(uuid,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.healthclues_manage_toolkit_entry_v1(uuid,uuid,text,text,integer,jsonb) to service_role;
notify pgrst, 'reload schema';
