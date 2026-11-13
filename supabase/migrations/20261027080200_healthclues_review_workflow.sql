begin;

alter table public.healthclues_discovery_content
  drop constraint if exists healthclues_discovery_content_review_status_check;
alter table public.healthclues_discovery_content
  drop constraint if exists healthclues_discovery_review_status_check;
alter table public.healthclues_discovery_content
  add constraint healthclues_discovery_review_status_check
  check (review_status in ('needs_review', 'changes_requested', 'reviewed', 'rejected'));

-- Keep this as a separate stricter constraint so it also protects a table
-- created by the original 012 migration with its older unnamed CHECK.
alter table public.healthclues_discovery_content
  drop constraint if exists healthclues_discovery_research_sources_check;
alter table public.healthclues_discovery_content
  add constraint healthclues_discovery_research_sources_check
  check (status <> 'published' or content_type <> 'research' or
    (evidence ? 'sources' and jsonb_typeof(evidence->'sources') = 'array'
      and jsonb_array_length(evidence->'sources') > 0));

commit;
