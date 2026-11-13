begin;

-- Version 2 introduces target-following contextual spotlights. Preserve terminal
-- completion/skip states; restart only unfinished version-1 tutorials at welcome.
alter table public.healthclues_player_guide_state
  alter column guide_version set default 2;
alter table public.healthclues_player_guide_state
  drop constraint if exists healthclues_player_guide_state_guide_version_check;

update public.healthclues_player_guide_state
set guide_version = 2,
    stage = case when stage in ('completed', 'skipped') then stage else 'welcome' end,
    updated_at = now()
where guide_version < 2;

alter table public.healthclues_player_guide_state
  add constraint healthclues_player_guide_state_guide_version_check check (guide_version = 2);

commit;
