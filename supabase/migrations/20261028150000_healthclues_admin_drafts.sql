-- Atomic creation of review-only Method and Combo drafts.
-- This function cannot approve, activate, publish, or grant rewards.
create or replace function public.healthclues_create_admin_draft_v1(p_payload jsonb,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_kind text:=p_payload->>'kind';
  v_id text:=p_payload->>'id';
  v_name text:=btrim(coalesce(p_payload->>'name',''));
  v_slug text:=btrim(coalesce(p_payload->>'slug',''));
  v_component jsonb;
  v_instructions jsonb;
  v_count integer:=0;
  v_slot text;
  v_item_id text;
  v_item_version integer;
  v_method_id text;
  v_method_version integer;
  v_recipe_id text;
  v_recipe_version integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or v_kind is null or v_kind not in ('method','recipe_combo','journey_combo') or v_id is null or v_id !~ '^[a-z0-9-]{1,100}$' or length(v_name) not between 1 and 160 or length(btrim(coalesce(p_reason,''))) not between 3 and 1200 then
    raise exception 'invalid_draft_payload' using errcode='22023';
  end if;

  if v_kind='method' then
    if v_slug is null or v_slug !~ '^[a-z0-9-]{1,120}$' then raise exception 'invalid_method_slug' using errcode='22023'; end if;
    v_instructions:=p_payload->'instructions';
    if jsonb_typeof(v_instructions) is distinct from 'array' then raise exception 'invalid_method_instructions' using errcode='22023'; end if;
    if jsonb_array_length(v_instructions) not between 1 and 20 or exists(select 1 from jsonb_array_elements(v_instructions) s where jsonb_typeof(s)<>'string' or length(btrim(s#>>'{}')) not between 1 and 500) then
      raise exception 'invalid_method_instructions' using errcode='22023';
    end if;
    if jsonb_typeof(p_payload->'components') is distinct from 'array' then raise exception 'invalid_method_components' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'components') not between 1 and 30 then raise exception 'invalid_method_components' using errcode='22023'; end if;
    if coalesce(length(p_payload->>'safetyNotes'),0)>1200 then raise exception 'invalid_method_safety_notes' using errcode='22023'; end if;
    insert into public.healthclues_usage_methods(id,slug,review_status,active,current_version) values(v_id,v_slug,'draft',false,1);
    insert into public.healthclues_usage_method_versions(method_id,version,name,instructions,estimated_minutes,safety_notes,review_status)
      values(v_id,1,v_name,v_instructions,nullif(p_payload->>'estimatedMinutes','')::integer,nullif(btrim(p_payload->>'safetyNotes'),''),'draft');
    for v_component in select value from jsonb_array_elements(p_payload->'components') loop
      v_item_id:=v_component->>'catalogItemId'; v_item_version:=nullif(v_component->>'version','')::integer;
      if v_item_id !~ '^[a-z0-9-]{1,120}$' or v_item_version is null or coalesce(v_component->>'relationship','uses') not in ('uses','contains','performed_with','supports') then raise exception 'invalid_method_component' using errcode='22023'; end if;
      if not exists(select 1 from public.healthclues_catalog_items i join public.healthclues_catalog_item_versions v on v.catalog_item_id=i.id and v.version=i.current_version where i.id=v_item_id and i.current_version=v_item_version and i.active and i.review_status='reviewed') then raise exception 'component_not_reviewed' using errcode='22023'; end if;
      insert into public.healthclues_usage_method_items(method_id,method_version,catalog_item_id,item_version,relationship,is_required,display_order)
        values(v_id,1,v_item_id,v_item_version,coalesce(v_component->>'relationship','uses'),coalesce((v_component->>'required')::boolean,true),coalesce((v_component->>'displayOrder')::integer,v_count));
      v_count:=v_count+1;
    end loop;
  elsif v_kind='recipe_combo' then
    v_recipe_id:=p_payload->>'recipeItemId'; v_recipe_version:=nullif(p_payload->>'recipeItemVersion','')::integer;
    if v_recipe_id is null or v_recipe_version is null or not exists(select 1 from public.healthclues_catalog_items i join public.healthclues_catalog_item_versions v on v.catalog_item_id=i.id and v.version=i.current_version where i.id=v_recipe_id and i.item_type='recipe' and i.slot_key='consume' and i.current_version=v_recipe_version and i.active and i.review_status='reviewed') then raise exception 'recipe_not_reviewed' using errcode='22023'; end if;
    v_method_id:=nullif(p_payload->>'methodId',''); v_method_version:=nullif(p_payload->>'methodVersion','')::integer;
    if (v_method_id is null)<>(v_method_version is null) then raise exception 'invalid_recipe_method' using errcode='22023'; end if;
    if v_method_id is not null and not exists(select 1 from public.healthclues_usage_method_versions where method_id=v_method_id and version=v_method_version) then raise exception 'recipe_method_not_found' using errcode='22023'; end if;
    insert into public.healthclues_recipe_combos(id,version,recipe_item_id,recipe_item_version,method_id,method_version,review_status,active) values(v_id,1,v_recipe_id,v_recipe_version,v_method_id,v_method_version,'draft',false);
  else
    if jsonb_typeof(p_payload->'components') is distinct from 'array' then raise exception 'invalid_journey_components' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'components') not between 1 and 9 then raise exception 'invalid_journey_components' using errcode='22023'; end if;
    insert into public.healthclues_journey_combos(id,version,name,review_status,active,rationale,safety_compatibility,partial_acceptance)
      values(v_id,1,v_name,'draft',false,nullif(btrim(p_payload->>'rationale'),''),coalesce(p_payload->'safetyCompatibility','{}'::jsonb),'optional_components');
    for v_component in select value from jsonb_array_elements(p_payload->'components') loop
      v_slot:=v_component->>'slotKey'; v_item_id:=v_component->>'catalogItemId'; v_item_version:=nullif(v_component->>'version','')::integer;
      if v_slot is null or v_slot not in ('consume','reduce','practice') or v_item_id is null or v_item_id !~ '^[a-z0-9-]{1,120}$' or v_item_version is null then raise exception 'invalid_journey_component' using errcode='22023'; end if;
      if not exists(select 1 from public.healthclues_catalog_items i join public.healthclues_catalog_item_versions v on v.catalog_item_id=i.id and v.version=i.current_version where i.id=v_item_id and i.slot_key=v_slot and i.current_version=v_item_version and i.active and i.review_status='reviewed') then raise exception 'component_not_reviewed' using errcode='22023'; end if;
      v_method_id:=nullif(v_component->>'methodId',''); v_method_version:=nullif(v_component->>'methodVersion','')::integer;
      if (v_method_id is null)<>(v_method_version is null) then raise exception 'invalid_component_method' using errcode='22023'; end if;
      if v_method_id is not null and not exists(select 1 from public.healthclues_usage_method_versions where method_id=v_method_id and version=v_method_version) then raise exception 'component_method_not_found' using errcode='22023'; end if;
      insert into public.healthclues_journey_combo_components(combo_id,combo_version,slot_key,catalog_item_id,item_version,method_id,method_version,required,display_order,rationale)
        values(v_id,1,v_slot,v_item_id,v_item_version,v_method_id,v_method_version,coalesce((v_component->>'required')::boolean,false),coalesce((v_component->>'displayOrder')::integer,v_count),nullif(btrim(v_component->>'rationale'),''));
      v_count:=v_count+1;
    end loop;
  end if;

  insert into public.healthclues_audit_events(actor_type,action,entity_type,entity_id,reason,metadata)
    values('reviewer','content_draft_create',v_kind,v_id||':v1',btrim(p_reason),jsonb_build_object('reviewer_credential','healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN','review_status','draft'));
  return jsonb_build_object('kind',v_kind,'id',v_id,'version',1,'review_status','draft','active',false);
end; $$;
revoke all on function public.healthclues_create_admin_draft_v1(jsonb,text) from public,anon,authenticated;
grant execute on function public.healthclues_create_admin_draft_v1(jsonb,text) to service_role;
notify pgrst,'reload schema';
