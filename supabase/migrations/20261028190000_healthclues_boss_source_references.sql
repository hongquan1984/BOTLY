-- Boss prompts are sourced learning challenges, never disease-treatment claims.
-- Existing rows remain unpublished until a reviewer checks the references.
alter table public.healthclues_boss_challenges
  add column if not exists source_references jsonb not null default '[]'::jsonb;

alter table public.healthclues_boss_challenges
  drop constraint if exists healthclues_boss_source_references_array_check;
alter table public.healthclues_boss_challenges
  add constraint healthclues_boss_source_references_array_check
  check (jsonb_typeof(source_references) = 'array');

notify pgrst, 'reload schema';

create or replace function public.healthclues_import_review_drafts_v1(p_candidates jsonb,p_reason text)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  v_candidate jsonb;
  v_kind text;
  v_id text;
  v_version integer;
  v_sources jsonb;
  v_options jsonb;
  v_answer jsonb;
  v_inserted integer:=0;
  v_skipped integer:=0;
begin
  if jsonb_typeof(p_candidates) is distinct from 'array' or jsonb_array_length(p_candidates) not between 1 and 30
     or p_reason is null or length(btrim(p_reason)) not between 3 and 1200 then
    raise exception 'invalid_review_draft_import' using errcode='22023';
  end if;
  for v_candidate in select value from jsonb_array_elements(p_candidates) loop
    v_kind:=v_candidate->>'kind';
    v_id:=v_candidate->>'id';
    v_version:=nullif(v_candidate->>'version','')::integer;
    v_sources:=v_candidate->'sourceReferences';
    v_options:=v_candidate->'questionOptions';
    v_answer:=v_candidate->'answerKey';
    if v_kind not in ('clue','boss') or v_id is null or v_id !~ '^[a-z0-9-]{1,120}$' or v_version is null or v_version<1
       or jsonb_typeof(v_sources) is distinct from 'array' or jsonb_array_length(v_sources)<1
       or exists(select 1 from jsonb_array_elements(v_sources) s where coalesce(s->>'label','')='' or coalesce(s->>'url','') !~ '^https://(www\.)?(cdc\.gov|nimh\.nih\.gov|fda\.gov)/')
       or jsonb_typeof(v_options) is distinct from 'array' or jsonb_array_length(v_options)<2
       or jsonb_typeof(v_answer) is distinct from 'object' or coalesce(v_answer->>'correctOptionId','')=''
       or not exists(select 1 from jsonb_array_elements(v_options) o where o->>'id'=v_answer->>'correctOptionId')
       or exists(select 1 from jsonb_array_elements(v_options) o where coalesce(o->>'id','')='' or coalesce(o->>'label','')='') then
      raise exception 'invalid_review_candidate:%',coalesce(v_id,'unknown') using errcode='22023';
    end if;
    if (select count(*) from jsonb_array_elements(v_options) o) <>
       (select count(distinct o->>'id') from jsonb_array_elements(v_options) o) then
      raise exception 'duplicate_review_candidate_option:%',v_id using errcode='22023';
    end if;
    if exists(select 1 from jsonb_array_elements(v_sources) s where s->>'url' ~* '(^|\.)example\.invalid(/|$)') then
      raise exception 'test_source_not_allowed:%',v_id using errcode='22023';
    end if;

    if v_kind='clue' then
      if coalesce(v_candidate->>'topicKey','') !~ '^[a-z0-9-]{1,80}$' or coalesce(v_candidate->>'chapterId','') !~ '^[a-z0-9-]{1,100}$'
         or length(btrim(coalesce(v_candidate->>'title',''))) not between 1 and 180
         or length(btrim(coalesce(v_candidate->>'content',''))) not between 1 and 5000
         or length(btrim(coalesce(v_candidate->>'questionPrompt',''))) not between 1 and 1000
         or length(btrim(coalesce(v_answer->>'explanation',''))) not between 1 and 2000
         or jsonb_typeof(coalesce(v_candidate->'relatedCatalogIds','[]'::jsonb)) is distinct from 'array' then
        raise exception 'invalid_review_clue:%',v_id using errcode='22023';
      end if;
      if exists(select 1 from public.healthclues_knowledge_clues where clue_id=v_id and version=v_version) then
        if exists(select 1 from public.healthclues_knowledge_clues where clue_id=v_id and version=v_version and review_status='needs_review' and not published) then v_skipped:=v_skipped+1; continue;
        else raise exception 'review_candidate_conflict:%',v_id using errcode='40001'; end if;
      end if;
      insert into public.healthclues_knowledge_clues(clue_id,version,topic_key,chapter_id,title,content,source_references,related_catalog_ids,question_prompt,question_options,review_status,published,reviewed_by,reviewed_at)
        values(v_id,v_version,v_candidate->>'topicKey',v_candidate->>'chapterId',v_candidate->>'title',v_candidate->>'content',v_sources,
          array(select jsonb_array_elements_text(coalesce(v_candidate->'relatedCatalogIds','[]'::jsonb))),v_candidate->>'questionPrompt',v_options,'needs_review',false,null,null);
      insert into public.healthclues_knowledge_answer_keys(clue_id,clue_version,correct_option_id,answer_explanation)
        values(v_id,v_version,v_answer->>'correctOptionId',v_answer->>'explanation');
    else
      if coalesce(v_candidate->>'topicKey','') !~ '^[a-z0-9-]{1,80}$'
         or length(btrim(coalesce(v_candidate->>'title',''))) not between 1 and 160
         or length(btrim(coalesce(v_candidate->>'intro',''))) not between 1 and 1000
         or length(btrim(coalesce(v_candidate->>'questionPrompt',''))) not between 1 and 1000
         or length(btrim(coalesce(v_answer->>'explanation',''))) not between 1 and 2000 then
        raise exception 'invalid_review_boss:%',v_id using errcode='22023';
      end if;
      if exists(select 1 from public.healthclues_boss_challenges where boss_id=v_id and version=v_version) then
        if exists(select 1 from public.healthclues_boss_challenges where boss_id=v_id and version=v_version and review_status='needs_review' and not published) then v_skipped:=v_skipped+1; continue;
        else raise exception 'review_candidate_conflict:%',v_id using errcode='40001'; end if;
      end if;
      insert into public.healthclues_boss_challenges(boss_id,version,topic_key,title,intro,question_prompt,question_options,source_references,review_status,published,reviewed_by,reviewed_at)
        values(v_id,v_version,v_candidate->>'topicKey',v_candidate->>'title',v_candidate->>'intro',v_candidate->>'questionPrompt',v_options,v_sources,'needs_review',false,null,null);
      insert into public.healthclues_boss_answer_keys(boss_id,boss_version,correct_option_id,explanation)
        values(v_id,v_version,v_answer->>'correctOptionId',v_answer->>'explanation');
    end if;
    insert into public.healthclues_audit_events(actor_type,action,entity_type,entity_id,reason,metadata)
      values('reviewer','content_draft_import',v_kind,v_id||':v'||v_version,btrim(p_reason),jsonb_build_object(
        'reviewer_credential','healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN',
        'review_status','needs_review','published',false,'source_count',jsonb_array_length(v_sources)
      ));
    v_inserted:=v_inserted+1;
  end loop;
  return jsonb_build_object('inserted',v_inserted,'skipped_existing_drafts',v_skipped,'published',false,'review_status','needs_review');
end; $$;

revoke all on function public.healthclues_import_review_drafts_v1(jsonb,text) from public,anon,authenticated;
grant execute on function public.healthclues_import_review_drafts_v1(jsonb,text) to service_role;
notify pgrst, 'reload schema';
