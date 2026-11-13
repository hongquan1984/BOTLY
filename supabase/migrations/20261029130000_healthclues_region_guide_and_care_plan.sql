begin;

alter table public.healthclues_player_guide_state
  drop constraint if exists healthclues_player_guide_state_stage_check;
alter table public.healthclues_player_guide_state
  add constraint healthclues_player_guide_state_stage_check
  check (stage in ('welcome','discovery_herbal','discovery_movement','discovery_practices','backpack','knowledge','completed','skipped'));

commit;
