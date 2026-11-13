-- Add a reviewed Collection item to the member's existing World.
-- The RPC is service-role only; eligibility and ownership are checked transactionally.
create table if not exists public.healthclues_toolkit_entry_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key uuid not null,
  toolkit_entry_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_key),
  foreign key (toolkit_entry_id,user_id) references public.healthclues_toolkit_entries(id,user_id) on delete cascade
);
alter table public.healthclues_toolkit_entry_requests enable row level security;
revoke all on public.healthclues_toolkit_entry_requests from public,anon,authenticated;
grant all on public.healthclues_toolkit_entry_requests to service_role;

create or replace function public.healthclues_equip_collection_item_v1(
  p_user_id uuid,
  p_world_id uuid,
  p_catalog_item_id text,
  p_item_version integer,
  p_request_key uuid
) returns jsonb
language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_world public.healthclues_wellness_worlds%rowtype;
  v_item public.healthclues_catalog_items%rowtype;
  v_branch public.healthclues_branches%rowtype;
  v_journey public.healthclues_journeys%rowtype;
  v_collection uuid;
  v_entry uuid;
begin
  if p_user_id is null or p_world_id is null or p_request_key is null
     or p_catalog_item_id is null or length(p_catalog_item_id)>120
     or p_item_version is null or p_item_version<1 then
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
  insert into public.healthclues_toolkit_entries(
    user_id,world_id,branch_id,journey_id,collection_id,catalog_item_id,item_version,
    slot_key,status,schedule,started_on
  ) values (
    p_user_id,p_world_id,v_branch.id,v_journey.id,v_collection,p_catalog_item_id,p_item_version,
    v_item.slot_key,'equipped','{}'::jsonb,(now() at time zone v_world.timezone)::date
  ) returning id into v_entry;
  insert into public.healthclues_toolkit_entry_requests(user_id,request_key,toolkit_entry_id)
    values(p_user_id,p_request_key,v_entry);
  return jsonb_build_object('entry_id',v_entry,'reused',false,'slot_key',v_item.slot_key);
end; $$;
revoke all on function public.healthclues_equip_collection_item_v1(uuid,uuid,text,integer,uuid) from public,anon,authenticated;
grant execute on function public.healthclues_equip_collection_item_v1(uuid,uuid,text,integer,uuid) to service_role;
notify pgrst, 'reload schema';
