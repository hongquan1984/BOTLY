import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const containerName = "botly-healthclues-db-e2e";
const networkName = "botly-healthclues-e2e-20261027";
const databaseName = "botly_restore_verification";
const container = JSON.parse(execFileSync("docker", ["inspect", containerName], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }))[0];
assert.equal(container.Config.Image, "supabase/postgres:17.6.1.068");
assert.ok(container.NetworkSettings.Networks[networkName]);
assert.equal(Object.keys(container.HostConfig.PortBindings ?? {}).length, 0);

const userId = randomUUID();
const otherUserId = randomUUID();
const requestKey = randomUUID();
const itemId = `hc-test-walk-${randomUUID()}`;
const itemSlug = `hc-test-walk-${randomUUID()}`;
const savedItemId = `hc-test-stretch-${randomUUID()}`;
const savedItemSlug = `hc-test-stretch-${randomUUID()}`;
const equipRequestKey = randomUUID();
const clueId = `hc-test-clue-${randomUUID()}`;
const bossId = `hc-test-boss-${randomUUID()}`;
const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const tempDir = mkdtempSync(path.join(os.tmpdir(), "healthclues-world-db-"));
const sqlPath = path.join(tempDir, "world-test.sql");
const knowledgeCleanupPath = path.join(tempDir, "knowledge-cleanup.sql");
const migrationPath = path.resolve("supabase/migrations/20261028100000_healthclues_toolkit_equip.sql");
const knowledgeMigrationPath = path.resolve("supabase/migrations/20261028110000_healthclues_knowledge_journey.sql");
const bossMigrationPath = path.resolve("supabase/migrations/20261028120000_healthclues_boss_world_evolution.sql");
const reminderMigrationPath = path.resolve("supabase/migrations/20261028130000_healthclues_reminder_queue.sql");
const reminderRetryMigrationPath = path.resolve("supabase/migrations/20261028140000_healthclues_reminder_retry.sql");
const adminDraftMigrationPath = path.resolve("supabase/migrations/20261028150000_healthclues_admin_drafts.sql");
const rewardConfigMigrationPath = path.resolve("supabase/migrations/20261028160000_healthclues_reward_configuration.sql");
const discoveryReviewerMigrationPath = path.resolve("supabase/migrations/20261028170000_healthclues_discovery_reviewer_boundary.sql");
const quizBankMigrationPath = path.resolve("supabase/migrations/20261028180000_healthclues_quiz_bank_review.sql");
const sourceDraftMigrationPath = path.resolve("supabase/migrations/20261028190000_healthclues_boss_source_references.sql");
const worldEvolutionMigrationPath = path.resolve("supabase/migrations/20261028200000_healthclues_milestone_world_evolution.sql");
const bossCosmeticRewardMigrationPath = path.resolve("supabase/migrations/20261028210000_healthclues_boss_cosmetic_rewards.sql");
const cosmeticRewardConfigMigrationPath = path.resolve("supabase/migrations/20261028220000_healthclues_cosmetic_reward_configuration.sql");
const knowledgeCurrencyMigrationPath = path.resolve("supabase/migrations/20261028230000_healthclues_knowledge_currency_ledger.sql");
const dataDeletionMigrationPath = path.resolve("supabase/migrations/20261028240000_healthclues_data_deletion.sql");
const profileHistoryMigrationPath = path.resolve("supabase/migrations/20261028250000_healthclues_profile_history.sql");
const sql = `
begin;
select 'RLS_ALL_HEALTHCLUES_TABLES|'||not exists (
  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relname like 'healthclues_%' and not c.relrowsecurity
);
select public.healthclues_save_quiz_bank_v1('[{"id":"fixture-q1","group":"core","stage":"onboarding","type":"single","text":"Synthetic test question","options":["Yes","No"]}]'::jsonb,'save_draft','Isolated synthetic quiz bank draft.',0);
select public.healthclues_save_quiz_bank_v1('[{"id":"fixture-q1","group":"core","stage":"onboarding","type":"single","text":"Synthetic revised test question","options":["Yes","No"]}]'::jsonb,'save_draft','Isolated synthetic quiz bank draft revision.',0);
select public.healthclues_save_quiz_bank_v1(null,'publish','Isolated synthetic quiz bank publish.',0);
select public.healthclues_save_quiz_bank_v1('[{"id":"fixture-q1","group":"core","stage":"onboarding","type":"single","text":"Synthetic second test version","options":["Yes","No"]}]'::jsonb,'save_draft','Isolated synthetic second quiz bank version.',1);
select public.healthclues_save_quiz_bank_v1(null,'publish','Isolated synthetic second quiz bank publish.',1);
do $$ begin
  if not exists(select 1 from public.healthclues_quiz_bank_versions where version=1 and status='superseded' and questions->0->>'text'='Synthetic revised test question' and reviewed_by='healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN') then raise exception 'superseded Quiz version/revision is missing'; end if;
  if not exists(select 1 from public.healthclues_quiz_bank_versions where version=2 and status='published' and questions->0->>'text'='Synthetic second test version' and reviewed_by='healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN') then raise exception 'published Quiz version is missing or reviewer identity is wrong'; end if;
  if (select count(*) from public.healthclues_quiz_bank_audit where actor_identity='healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN')<>5 then raise exception 'quiz bank draft/publish audit missing'; end if;
  begin
    perform public.healthclues_save_quiz_bank_v1('[{"id":"fixture-q1","group":"core","stage":"onboarding","type":"single","text":"Stale fixture","options":["Yes","No"]}]'::jsonb,'save_draft','Isolated stale quiz bank version check.',1);
    raise exception 'stale Quiz version was accepted';
  exception when serialization_failure then null;
  end;
end $$;
insert into auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('${userId}','${userId}@example.invalid','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now()),
       ('${otherUserId}','${otherUserId}@example.invalid','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now());
insert into public.healthclues_profiles(user_id,profile,consent_version,consented_at)
values ('${userId}'::uuid,'{"topic":"sleep"}'::jsonb,'test-consent-v1',now()),('${otherUserId}'::uuid,'{"topic":"nutrition"}'::jsonb,'test-consent-v1',now());insert into public.healthclues_reward_definitions(id,version,reward_type,title,eligibility,active) values ('hc-test-reward-config-${userId}',1,'badge','Test configurable reward','{"elapsed_days":7}'::jsonb,false);
insert into public.healthclues_user_rewards(user_id,reward_id,source_key) values ('${userId}','hc-test-reward-config-${userId}','inactive-must-not-grant') on conflict do nothing;
do $$ begin if exists(select 1 from public.healthclues_user_rewards where user_id='${userId}' and reward_id='hc-test-reward-config-${userId}') then raise exception 'inactive reward was granted'; end if; end $$;
update public.healthclues_reward_definitions set active=true where id='hc-test-reward-config-${userId}';
insert into public.healthclues_user_rewards(user_id,reward_id,source_key) values ('${userId}','hc-test-reward-config-${userId}','active-can-grant') on conflict do nothing;
do $$ begin if not exists(select 1 from public.healthclues_user_rewards where user_id='${userId}' and reward_id='hc-test-reward-config-${userId}') then raise exception 'active reward was not granted'; end if; end $$;
insert into public.healthclues_catalog_items(id,slug,item_type,slot_key,review_status,active,recommendation_eligible,current_version)
values ('${itemId}','${itemSlug}','movement','practice','reviewed',true,true,1),
       ('${savedItemId}','${savedItemSlug}','movement','practice','reviewed',true,true,1);
insert into public.healthclues_catalog_item_versions(catalog_item_id,version,name,description,evidence_class,evidence_summary,safety_notes,reviewed_by,reviewed_at)
values ('${itemId}',1,'Test gentle walk','Synthetic non-medical fixture for isolated tests.','general_wellness','Test fixture only.', 'Stop if uncomfortable. Test fixture only.','test-fixture',now()),
       ('${savedItemId}',1,'Test stretch','Synthetic non-medical fixture for isolated tests.','general_wellness','Test fixture only.', 'Stop if uncomfortable. Test fixture only.','test-fixture',now());
do $$ declare result jsonb; result2 jsonb; added jsonb; added_retry jsonb; world_id uuid; branch_id uuid; journey_id uuid; entry_id uuid; check1 jsonb; check2 jsonb;
begin
  result := public.healthclues_create_world_v1('${userId}'::uuid,'${requestKey}'::uuid,'move-more','Move More','Asia/Bangkok','2026-10-21','[{"catalog_item_id":"${itemId}","item_version":1,"slot_key":"practice","schedule":{"days":[1,2,3,4,5]}}]'::jsonb);
  world_id := (result->>'world_id')::uuid; branch_id := (result->>'branch_id')::uuid; journey_id := (result->>'journey_id')::uuid;
  if (result->>'entries_created')::integer<>1 then raise exception 'initial toolkit entry was not created'; end if;
  result2 := public.healthclues_create_world_v1('${userId}'::uuid,'${requestKey}'::uuid,'move-more','Move More','Asia/Bangkok','2026-10-21','[{"catalog_item_id":"${itemId}","item_version":1,"slot_key":"practice"}]'::jsonb);
  if result2->>'world_id'<>world_id::text or result2->>'journey_id'<>journey_id::text or result2->>'reused'<>'true' then raise exception 'world creation retry was not idempotent'; end if;
  if (select count(*) from public.healthclues_wellness_worlds where user_id='${userId}')<>1 then raise exception 'more than one Wellness World was created'; end if;
  if (select count(*) from public.healthclues_toolkit_entries where user_id='${userId}')<>1 then raise exception 'retry duplicated an equipped tool'; end if;
  added := public.healthclues_equip_collection_item_v1('${userId}'::uuid,world_id,'${savedItemId}',1,'${equipRequestKey}'::uuid);
  added_retry := public.healthclues_equip_collection_item_v1('${userId}'::uuid,world_id,'${savedItemId}',1,'${equipRequestKey}'::uuid);
  if added->>'reused'<>'false' or added_retry->>'reused'<>'true' or added->>'entry_id'<>added_retry->>'entry_id' then raise exception 'collection equip retry was not idempotent'; end if;
  if (select count(*) from public.healthclues_toolkit_entries where user_id='${userId}')<>2 then raise exception 'collection equip created a duplicate or missing Toolkit entry'; end if;
  select id into entry_id from public.healthclues_toolkit_entries where user_id='${userId}';
  check1 := public.healthclues_save_daily_checkin_v1('${userId}'::uuid,world_id,'${localDate}','Asia/Bangkok',jsonb_build_array(jsonb_build_object('toolkit_entry_id',entry_id,'status','done','occurrence_count',2,'occurrences',jsonb_build_array(jsonb_build_object('occurrence_no',1,'local_time','08:30','status','done'),jsonb_build_object('occurrence_no',2,'local_time','17:15','status','done')))),'private test note',null);
  check2 := public.healthclues_save_daily_checkin_v1('${userId}'::uuid,world_id,'${localDate}','Asia/Bangkok',jsonb_build_array(jsonb_build_object('toolkit_entry_id',entry_id,'status','done','occurrence_count',3,'occurrences','[]'::jsonb)),'edited private test note',null);
  if check1->>'xp_awarded'<>'true' or (check2->>'xp_awarded')<>'false' or (check2->>'xp_total')::integer<>(check1->>'xp_total')::integer then raise exception 'XP idempotency failed: first %, second %',check1,check2; end if;
  if (select count(*) from public.healthclues_daily_checkins where user_id='${userId}' and local_date='${localDate}')<>1 then raise exception 'daily check-in uniqueness failed'; end if;
  if (select count(*) from public.healthclues_xp_ledger where user_id='${userId}' and source_type='daily_checkin')<>1 or (select amount from public.healthclues_xp_ledger where user_id='${userId}' and source_type='daily_checkin')<>10 then raise exception 'daily check-in XP award was duplicated or not fixed'; end if;
  if (select occurrence_count from public.healthclues_daily_usage_records where user_id='${userId}')<>3 then raise exception 'usage occurrence count did not update'; end if;
  if (select count(*) from public.healthclues_usage_occurrences where user_id='${userId}')<>0 then raise exception 'occurrence edit did not replace old occurrences'; end if;
  if (select count(*) from public.healthclues_user_milestones where user_id='${userId}' and milestone_day=7)<>1 then raise exception 'elapsed milestone was not recorded'; end if;
  perform public.healthclues_award_elapsed_milestones_v1('${userId}'::uuid,(select started_on+59 from public.healthclues_journeys where id=journey_id));
  if not exists(select 1 from public.healthclues_world_unlocks u where u.user_id='${userId}' and u.world_id=(select w.id from public.healthclues_wellness_worlds w where w.user_id='${userId}' limit 1) and u.unlock_key='knowledge-library-open' and u.source_type='milestone') then raise exception 'Day 60 milestone did not create the saved Knowledge Library World unlock'; end if;
  if (select count(*) from public.healthclues_user_rewards where user_id='${userId}' and reward_id='journey-milestone-60')<>1 then raise exception 'Day 60 map reward was not idempotently issued'; end if;
  check1 := public.healthclues_discover_knowledge_clue_v1('${userId}'::uuid,world_id,'${clueId}',1,'${localDate}'::date);
  check2 := public.healthclues_discover_knowledge_clue_v1('${userId}'::uuid,world_id,'${clueId}',1,'${localDate}'::date);
  if check1->>'discovered'<>'true' or check2->>'discovered'<>'false' then raise exception 'knowledge discovery idempotency failed: %, %',check1,check2; end if;
  check1 := public.healthclues_answer_knowledge_clue_v1('${userId}'::uuid,world_id,'${clueId}',1,'wrong','${randomUUID()}'::uuid);
  if check1->>'correct'<>'false' then raise exception 'wrong knowledge answer was marked correct'; end if;
  check2 := public.healthclues_answer_knowledge_clue_v1('${userId}'::uuid,world_id,'${clueId}',1,'right','${equipRequestKey}'::uuid);
  if check2->>'correct'<>'true' or check2->>'reused'<>'false' then raise exception 'correct knowledge answer was not recorded: %',check2; end if;
  check2 := public.healthclues_answer_knowledge_clue_v1('${userId}'::uuid,world_id,'${clueId}',1,'right','${equipRequestKey}'::uuid);
  if check2->>'correct'<>'true' or check2->>'reused'<>'true' then raise exception 'knowledge answer retry was not idempotent: %',check2; end if;
  if (select count(*) from public.healthclues_knowledge_discoveries where user_id='${userId}')<>1 or (select count(*) from public.healthclues_knowledge_attempts where user_id='${userId}')<>2 then raise exception 'knowledge Book or question history is incomplete'; end if;
  if (select count(*) from public.healthclues_xp_ledger where user_id='${userId}' and source_type='learning')<>2 then raise exception 'knowledge XP was duplicated or granted for an incorrect answer'; end if;
  check1 := public.healthclues_answer_boss_challenge_v1('${userId}'::uuid,world_id,'${bossId}',1,'wrong','${randomUUID()}'::uuid);
  if check1->>'correct'<>'false' then raise exception 'wrong Boss answer was marked correct'; end if;
  check1 := public.healthclues_answer_boss_challenge_v1('${userId}'::uuid,world_id,'${bossId}',1,'right','${equipRequestKey}'::uuid);
  if check1->>'correct'<>'true' or check1->>'reward_granted'<>'true' or check1->>'unlock_key'<>'${bossId}-path-open' then raise exception 'Boss clear did not issue its reward/unlock: %',check1; end if;
  if check1->>'cosmetic_reward_id'<>'boss-keepsake-movement-pennant' or check1->>'cosmetic_unlock_key'<>'movement-peaks-pennant-open' then raise exception 'Move More Boss did not issue its fixed keepsake: %',check1; end if;
  if (select count(*) from public.healthclues_user_rewards where user_id='${userId}' and reward_id='boss-keepsake-movement-pennant')<>1 then raise exception 'Boss cosmetic reward was not stored exactly once'; end if;
  if (select count(*) from public.healthclues_world_unlocks u where u.user_id='${userId}' and u.world_id=(select w.id from public.healthclues_wellness_worlds w where w.user_id='${userId}' limit 1) and u.unlock_key='movement-peaks-pennant-open')<>1 then raise exception 'Boss cosmetic map decoration was not stored exactly once'; end if;
  check2 := public.healthclues_answer_boss_challenge_v1('${userId}'::uuid,world_id,'${bossId}',1,'right','${equipRequestKey}'::uuid);
  if check2->>'reused'<>'true' or check2->>'reward_granted'<>'false' then raise exception 'Boss answer retry duplicated its reward: %',check2; end if;
  if (select count(*) from public.healthclues_user_rewards where user_id='${userId}' and reward_id='boss-keepsake-movement-pennant')<>1 then raise exception 'Boss retry duplicated its cosmetic reward'; end if;
  if (select count(*) from public.healthclues_world_unlocks u where u.user_id='${userId}' and u.world_id=(select w.id from public.healthclues_wellness_worlds w where w.user_id='${userId}' limit 1) and u.unlock_key='${bossId}-path-open')<>1 then raise exception 'Boss World unlock was not persisted once'; end if;
  if (select count(*) from public.healthclues_knowledge_currency_ledger where user_id='${userId}' and currency_type='fragment' and source_type='clue_discovery')<>1 or (select count(*) from public.healthclues_knowledge_currency_ledger where user_id='${userId}' and currency_type='key' and source_type='boss_clear')<>1 then raise exception 'Knowledge Fragment/Key awards were missing or duplicated'; end if;
  raise notice 'FUNCTIONAL_OK world=% branch=% journey=% checkin=% collection_equip=%', world_id,branch_id,journey_id,check1->>'checkin_id',added->>'entry_id';
end $$;
do $$ declare result jsonb; b_world uuid; b_journey uuid; b_entry uuid; checkin_result jsonb;
begin
  result := public.healthclues_create_world_v1('${otherUserId}'::uuid,'${randomUUID()}'::uuid,'move-more','Move More Test','Asia/Bangkok','${localDate}','[{"catalog_item_id":"${itemId}","item_version":1,"slot_key":"practice"}]'::jsonb);
  b_world := (result->>'world_id')::uuid;
  b_journey := (result->>'journey_id')::uuid;
  select id into b_entry from public.healthclues_toolkit_entries where user_id='${otherUserId}' limit 1;
  checkin_result := public.healthclues_save_daily_checkin_v1('${otherUserId}'::uuid,b_world,'${localDate}','Asia/Bangkok',jsonb_build_array(jsonb_build_object('toolkit_entry_id',b_entry,'status','done','occurrence_count',1,'occurrences',jsonb_build_array(jsonb_build_object('occurrence_no',1,'local_time','09:15','status','done')))),'other owner private check-in',null);
  perform public.healthclues_discover_knowledge_clue_v1('${otherUserId}'::uuid,b_world,'${clueId}',1,'${localDate}'::date);
  perform public.healthclues_answer_knowledge_clue_v1('${otherUserId}'::uuid,b_world,'${clueId}',1,'wrong','${randomUUID()}'::uuid);
  perform public.healthclues_answer_boss_challenge_v1('${otherUserId}'::uuid,b_world,'${bossId}',1,'right','${randomUUID()}'::uuid);
  insert into public.healthclues_journal_entries(user_id,world_id,journey_id,checkin_id,entry_date,body)
    select '${userId}'::uuid,w.id,j.id,c.id,'${localDate}','owner A private journal fixture'
    from public.healthclues_wellness_worlds w join public.healthclues_journeys j on j.user_id=w.user_id
    join public.healthclues_daily_checkins c on c.user_id=w.user_id where w.user_id='${userId}';
  insert into public.healthclues_journal_entries(user_id,world_id,journey_id,checkin_id,entry_date,body)
    select '${otherUserId}'::uuid,w.id,j.id,c.id,'${localDate}','owner B private journal fixture'
    from public.healthclues_wellness_worlds w join public.healthclues_journeys j on j.user_id=w.user_id
    join public.healthclues_daily_checkins c on c.user_id=w.user_id where w.user_id='${otherUserId}';
  insert into public.healthclues_personal_tools(user_id,name,description,slot_key) values
    ('${userId}'::uuid,'Owner A private tool','Synthetic fixture','practice'),
    ('${otherUserId}'::uuid,'Owner B private tool','Synthetic fixture','practice');
  insert into public.healthclues_catalog_proposals(user_id,proposed_name,proposed_type,normalized_name) values
    ('${userId}'::uuid,'Owner A proposal','practice','owner a proposal'),
    ('${otherUserId}'::uuid,'Owner B proposal','practice','owner b proposal');
  insert into public.healthclues_discovery_activity(user_id,content_id,action)
    values ('${otherUserId}'::uuid,'test-private-topic','viewed');
  insert into public.healthclues_toolkit_entry_events(user_id,toolkit_entry_id,event_type,previous_status,next_status,effective_date)
    values ('${otherUserId}'::uuid,b_entry,'paused','equipped','paused','${localDate}'::date);
  insert into public.healthclues_user_milestones(user_id,journey_id,milestone_day,reached_on)
    values ('${otherUserId}'::uuid,b_journey,7,'${localDate}'::date);
  if checkin_result->>'xp_awarded'<>'true' then raise exception 'second owner check-in fixture failed'; end if;
end $$;
insert into public.healthclues_public_journeys(user_id,journey_id,alias,title,consent_version,consented_at,projection)
select '${userId}'::uuid,j.id,'Owner A','Owner A public test journey','test-consent-v1',now(),'{}'::jsonb
from public.healthclues_journeys j where j.user_id='${userId}'::uuid;
insert into public.healthclues_public_journeys(user_id,journey_id,alias,title,consent_version,consented_at,projection)
select '${otherUserId}'::uuid,j.id,'Owner B','Owner B public test journey','test-consent-v1',now(),'{}'::jsonb
from public.healthclues_journeys j where j.user_id='${otherUserId}'::uuid;
insert into public.healthclues_journey_follows(follower_user_id,public_journey_id)
select '${userId}'::uuid,p.id from public.healthclues_public_journeys p where p.user_id='${otherUserId}'::uuid;
insert into public.healthclues_journey_follows(follower_user_id,public_journey_id)
select '${otherUserId}'::uuid,p.id from public.healthclues_public_journeys p where p.user_id='${userId}'::uuid;
insert into public.healthclues_community_reports(reporter_user_id,public_journey_id,reason_code,details)
select '${userId}'::uuid,p.id,'privacy','Owner A synthetic privacy report' from public.healthclues_public_journeys p where p.user_id='${otherUserId}'::uuid;
insert into public.healthclues_community_reports(reporter_user_id,public_journey_id,reason_code,details)
select '${otherUserId}'::uuid,p.id,'spam','Owner B synthetic report' from public.healthclues_public_journeys p where p.user_id='${userId}'::uuid;
insert into public.healthclues_email_preferences(user_id,opted_in,timezone,local_send_time,frequency,consent_version,consented_at)
values ('${userId}'::uuid,true,'Asia/Bangkok','09:00','daily','test-consent-v1',now()),('${otherUserId}'::uuid,true,'America/New_York','10:00','weekly','test-consent-v1',now());
insert into public.healthclues_notification_deliveries(user_id,template_key,local_date,idempotency_key,scheduled_at)
values ('${userId}'::uuid,'generic_daily_journey','${localDate}'::date,'hc-test-owner-a-${userId}',now()),('${otherUserId}'::uuid,'generic_daily_journey','${localDate}'::date,'hc-test-owner-b-${otherUserId}',now());
insert into public.healthclues_user_rewards(user_id,reward_id,source_key)
values ('${otherUserId}'::uuid,'hc-test-reward-config-${userId}','other-owner-reward');
update public.healthclues_profiles
set profile=profile || '{"securityFixtureRevision":true}'::jsonb
where user_id='${otherUserId}'::uuid;
do $$
declare target text[]; row_count integer;
  populated_tables text[][] := array[
    array['healthclues_profiles','user_id'],array['healthclues_personal_tools','user_id'],
    array['healthclues_profile_history','user_id'],
    array['healthclues_catalog_proposals','user_id'],array['healthclues_wellness_worlds','user_id'],
    array['healthclues_branches','user_id'],array['healthclues_journeys','user_id'],
    array['healthclues_toolkit_collection','user_id'],array['healthclues_toolkit_entries','user_id'],
    array['healthclues_daily_checkins','user_id'],array['healthclues_daily_usage_records','user_id'],
    array['healthclues_usage_occurrences','user_id'],array['healthclues_journal_entries','user_id'],
    array['healthclues_discovery_activity','user_id'],array['healthclues_toolkit_entry_events','user_id'],
    array['healthclues_xp_ledger','user_id'],array['healthclues_user_rewards','user_id'],
    array['healthclues_user_milestones','user_id'],array['healthclues_email_preferences','user_id'],
    array['healthclues_notification_deliveries','user_id'],array['healthclues_knowledge_currency_ledger','user_id'],
    array['healthclues_knowledge_discoveries','user_id'],array['healthclues_knowledge_attempts','user_id'],
    array['healthclues_boss_attempts','user_id'],array['healthclues_boss_clears','user_id'],
    array['healthclues_world_unlocks','user_id'],array['healthclues_journey_follows','follower_user_id'],
    array['healthclues_community_reports','reporter_user_id']
  ];
begin
  foreach target slice 1 in array populated_tables loop
    execute format('select count(*) from public.%I where %I=$1',target[1],target[2])
      into row_count using '${otherUserId}'::uuid;
    if row_count=0 then raise exception 'security fixture has no foreign-owner row in %',target[1]; end if;
  end loop;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','${userId}',true);
do $$
declare
  target text[];
  affected integer;
  visible integer;
  probe_tables text[][] := array[
    array['healthclues_profiles','user_id'],
    array['healthclues_profile_history','user_id'],
    array['healthclues_personal_tools','user_id'],
    array['healthclues_catalog_proposals','user_id'],
    array['healthclues_wellness_worlds','user_id'],
    array['healthclues_branches','user_id'],
    array['healthclues_journeys','user_id'],
    array['healthclues_toolkit_collection','user_id'],
    array['healthclues_toolkit_entries','user_id'],
    array['healthclues_daily_checkins','user_id'],
    array['healthclues_daily_usage_records','user_id'],
    array['healthclues_usage_occurrences','user_id'],
    array['healthclues_journal_entries','user_id'],
    array['healthclues_discovery_activity','user_id'],
    array['healthclues_toolkit_entry_events','user_id'],
    array['healthclues_xp_ledger','user_id'],
    array['healthclues_user_rewards','user_id'],
    array['healthclues_user_milestones','user_id'],
    array['healthclues_email_preferences','user_id'],
    array['healthclues_notification_deliveries','user_id'],
    array['healthclues_knowledge_currency_ledger','user_id'],
    array['healthclues_knowledge_discoveries','user_id'],
    array['healthclues_knowledge_attempts','user_id'],
    array['healthclues_boss_attempts','user_id'],
    array['healthclues_boss_clears','user_id'],
    array['healthclues_world_unlocks','user_id'],
    array['healthclues_journey_follows','follower_user_id'],
    array['healthclues_community_reports','reporter_user_id']
  ];
begin
  foreach target slice 1 in array probe_tables loop
    begin
      execute format('select count(*) from public.%I where %I=$1',target[1],target[2])
        into visible using '${otherUserId}'::uuid;
      if visible<>0 then raise exception 'cross-owner SELECT leaked %',target[1]; end if;
    exception when insufficient_privilege then
      null; -- No table SELECT grant is also a valid denial.
    end;
    begin
      execute format('update public.%I set %I=%I where %I=$1',target[1],target[2],target[2],target[2])
        using '${otherUserId}'::uuid;
      get diagnostics affected = row_count;
      if affected<>0 then raise exception 'cross-owner UPDATE changed % rows in %',affected,target[1]; end if;
    exception when insufficient_privilege then
      null; -- Service/API-only mutations must be rejected at the grant boundary.
    end;
    begin
      execute format('delete from public.%I where %I=$1',target[1],target[2]) using '${otherUserId}'::uuid;
      get diagnostics affected = row_count;
      if affected<>0 then raise exception 'cross-owner DELETE removed % rows from %',affected,target[1]; end if;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
  raise notice 'CROSS_OWNER_PROBES_OK tables=%',array_length(probe_tables,1);
end $$;
select 'CROSS_OWNER_SECURITY_PROBES_OK|28';
do $$
begin
  begin
    insert into public.healthclues_personal_tools(user_id,name,description,slot_key)
      values ('${otherUserId}'::uuid,'Spoofed foreign tool','Must be rejected by owner RLS','practice');
    raise exception 'owner RLS accepted a foreign-owned personal tool insert';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.healthclues_catalog_proposals(user_id,proposed_name,proposed_type,normalized_name)
      values ('${otherUserId}'::uuid,'Spoofed proposal','practice','spoofed proposal');
    raise exception 'owner RLS accepted a foreign-owned Catalog proposal insert';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.healthclues_discovery_activity(user_id,content_id,action)
      values ('${otherUserId}'::uuid,'spoofed-foreign-activity','viewed');
    raise exception 'owner RLS accepted a foreign-owned discovery activity insert';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.healthclues_toolkit_collection(user_id,catalog_item_id)
      values ('${otherUserId}'::uuid,'${savedItemId}');
    raise exception 'owner RLS accepted a foreign-owned Collection insert';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.healthclues_journey_follows(follower_user_id,public_journey_id)
      select '${otherUserId}'::uuid,id from public.healthclues_public_journeys where user_id='${otherUserId}'::uuid limit 1;
    raise exception 'owner RLS accepted a foreign-owned Follow insert';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.healthclues_community_reports(reporter_user_id,public_journey_id,reason_code,details)
      select '${otherUserId}'::uuid,id,'other','Spoofed foreign report' from public.healthclues_public_journeys where user_id='${otherUserId}'::uuid limit 1;
    raise exception 'owner RLS accepted a foreign-owned Community report insert';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.healthclues_personal_tools set user_id='${otherUserId}'::uuid where user_id='${userId}'::uuid;
    if found then raise exception 'owner RLS allowed a personal tool transfer to another account'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    update public.healthclues_catalog_proposals set user_id='${otherUserId}'::uuid where user_id='${userId}'::uuid;
    if found then raise exception 'owner RLS allowed a Catalog proposal transfer to another account'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    update public.healthclues_profiles set user_id='${otherUserId}'::uuid where user_id='${userId}'::uuid;
    if found then raise exception 'owner RLS allowed a consented profile transfer to another account'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;
select 'OWNER_SPOOF_INSERT_AND_TRANSFER_PROBES_OK|9';
with changed as (update public.healthclues_profiles set profile='{"topic":"sleep-updated"}'::jsonb where user_id='${userId}' returning 1) select 'OWNER_PROFILE_UPDATE|'||count(*) from changed;
with changed as (update public.healthclues_profiles set profile='{"topic":"cross-owner"}'::jsonb where user_id='${otherUserId}' returning 1) select 'CROSS_PROFILE_UPDATE|'||count(*) from changed;
select 'PROFILE_OWN|'||count(*) from public.healthclues_profiles where user_id='${userId}';
select 'PROFILE_CROSS|'||count(*) from public.healthclues_profiles where user_id='${otherUserId}';
select 'PROFILE_HISTORY_OWN|'||count(*) from public.healthclues_profile_history where user_id='${userId}';
select 'PROFILE_HISTORY_CROSS|'||count(*) from public.healthclues_profile_history where user_id='${otherUserId}';
select 'CURRENCY_OWN|'||count(*) from public.healthclues_knowledge_currency_ledger where user_id='${userId}';
select 'CURRENCY_CROSS|'||count(*) from public.healthclues_knowledge_currency_ledger where user_id='${otherUserId}';
with changed as (update public.healthclues_wellness_worlds set title='Owner A authorized update' where user_id='${userId}' returning 1) select 'OWNER_WORLD_UPDATE|'||count(*) from changed;
with changed as (update public.healthclues_wellness_worlds set title='Cross-owner update must be filtered' where user_id='${otherUserId}' returning 1) select 'CROSS_WORLD_UPDATE|'||count(*) from changed;
with changed as (update public.healthclues_journal_entries set body='Owner A authorized private edit' where user_id='${userId}' returning 1) select 'OWNER_JOURNAL_UPDATE|'||count(*) from changed;
with changed as (update public.healthclues_journal_entries set body='Cross-owner private edit must be filtered' where user_id='${otherUserId}' returning 1) select 'CROSS_JOURNAL_UPDATE|'||count(*) from changed;
select 'RLS_WORLD_OWN|'||count(*) from public.healthclues_wellness_worlds where user_id='${userId}';
select 'RLS_WORLD_CROSS|'||count(*) from public.healthclues_wellness_worlds where user_id='${otherUserId}';
select 'RLS_BRANCH_CROSS|'||count(*) from public.healthclues_branches where user_id='${otherUserId}';
select 'RLS_JOURNEY_CROSS|'||count(*) from public.healthclues_journeys where user_id='${otherUserId}';
select 'RLS_COLLECTION_CROSS|'||count(*) from public.healthclues_toolkit_collection where user_id='${otherUserId}';
select 'RLS_TOOLKIT_CROSS|'||count(*) from public.healthclues_toolkit_entries where user_id='${otherUserId}';
select 'RLS_CHECKIN_CROSS|'||count(*) from public.healthclues_daily_checkins where user_id='${otherUserId}';
select 'RLS_USAGE_CROSS|'||count(*) from public.healthclues_daily_usage_records where user_id='${otherUserId}';
select 'RLS_JOURNAL_OWN|'||count(*) from public.healthclues_journal_entries where user_id='${userId}';
select 'RLS_JOURNAL_CROSS|'||count(*) from public.healthclues_journal_entries where user_id='${otherUserId}';
select 'RLS_PERSONAL_TOOLS_CROSS|'||count(*) from public.healthclues_personal_tools where user_id='${otherUserId}';
select 'RLS_CATALOG_PROPOSALS_OWN|'||count(*) from public.healthclues_catalog_proposals where user_id='${userId}';
select 'RLS_CATALOG_PROPOSALS_CROSS|'||count(*) from public.healthclues_catalog_proposals where user_id='${otherUserId}';
select 'RLS_XP_CROSS|'||count(*) from public.healthclues_xp_ledger where user_id='${otherUserId}';
select 'BOOK_OWN|'||count(*) from public.healthclues_knowledge_discoveries;
select 'BOOK_CROSS|'||count(*) from public.healthclues_knowledge_discoveries where user_id='${otherUserId}';
select 'KNOWLEDGE_ATTEMPT_CROSS|'||count(*) from public.healthclues_knowledge_attempts where user_id='${otherUserId}';
select 'BOSS_ATTEMPT_CROSS|'||count(*) from public.healthclues_boss_attempts where user_id='${otherUserId}';
select 'BOSS_CLEAR_CROSS|'||count(*) from public.healthclues_boss_clears where user_id='${otherUserId}';
select 'UNLOCK_CROSS|'||count(*) from public.healthclues_world_unlocks where user_id='${otherUserId}';
select 'MILESTONE_CROSS|'||count(*) from public.healthclues_user_milestones where user_id='${otherUserId}';
select 'REWARD_CROSS|'||count(*) from public.healthclues_user_rewards where user_id='${otherUserId}';
select 'EMAIL_PREFERENCE_CROSS|'||count(*) from public.healthclues_email_preferences where user_id='${otherUserId}';
select 'REMINDER_DELIVERY_OWN|'||count(*) from public.healthclues_notification_deliveries where user_id='${userId}';
select 'REMINDER_DELIVERY_CROSS|'||count(*) from public.healthclues_notification_deliveries where user_id='${otherUserId}';
select 'FOLLOW_OWN|'||count(*) from public.healthclues_journey_follows where follower_user_id='${userId}';
select 'FOLLOW_CROSS|'||count(*) from public.healthclues_journey_follows where follower_user_id='${otherUserId}';
select 'COMMUNITY_REPORT_OWN|'||count(*) from public.healthclues_community_reports where reporter_user_id='${userId}';
select 'COMMUNITY_REPORT_CROSS|'||count(*) from public.healthclues_community_reports where reporter_user_id='${otherUserId}';
select 'ANSWER_KEY_SELECT|'||has_table_privilege(current_user,'public.healthclues_knowledge_answer_keys','SELECT');
select 'CONTENT_IMPORT_PRIVILEGES|'||has_function_privilege('authenticated','public.healthclues_import_review_drafts_v1(jsonb,text)','execute')::text||'|'||has_function_privilege('service_role','public.healthclues_import_review_drafts_v1(jsonb,text)','execute')::text;
select 'ANON_PRIVATE_SELECT_GRANTS|'||coalesce((select string_agg(t,',') from unnest(array[
  'healthclues_profiles','healthclues_discovery_activity','healthclues_discovery_content','healthclues_review_audit',
  'healthclues_profile_history',
  'healthclues_personal_tools','healthclues_catalog_proposals','healthclues_wellness_worlds','healthclues_branches',
  'healthclues_journeys','healthclues_toolkit_collection','healthclues_toolkit_entries','healthclues_toolkit_entry_events',
  'healthclues_toolkit_entry_requests','healthclues_daily_checkins','healthclues_daily_usage_records','healthclues_usage_occurrences',
  'healthclues_journal_entries','healthclues_public_journeys','healthclues_public_tool_usages','healthclues_journey_follows',
  'healthclues_xp_ledger','healthclues_user_rewards','healthclues_user_milestones','healthclues_knowledge_currency_ledger','healthclues_email_preferences',
  'healthclues_notification_deliveries','healthclues_community_reports','healthclues_audit_events',
  'healthclues_knowledge_answer_keys','healthclues_knowledge_discoveries','healthclues_knowledge_attempts',
  'healthclues_boss_answer_keys','healthclues_boss_attempts','healthclues_boss_clears','healthclues_world_unlocks','healthclues_account_deletion_requests',
  'healthclues_quiz_bank_versions','healthclues_quiz_bank_audit'
]::text[]) t where has_table_privilege('anon','public.'||t,'SELECT')),'');
select 'ANON_APPROVED_CONTENT_SELECT|'||(
  has_table_privilege('anon','public.healthclues_catalog_items','SELECT') and
  has_table_privilege('anon','public.healthclues_catalog_item_versions','SELECT') and
  has_table_privilege('anon','public.healthclues_usage_methods','SELECT') and
  has_table_privilege('anon','public.healthclues_usage_method_versions','SELECT') and
  has_table_privilege('anon','public.healthclues_usage_method_items','SELECT') and
  has_table_privilege('anon','public.healthclues_recipe_combos','SELECT') and
  has_table_privilege('anon','public.healthclues_journey_combos','SELECT') and
  has_table_privilege('anon','public.healthclues_journey_combo_components','SELECT') and
  has_table_privilege('anon','public.healthclues_reward_definitions','SELECT') and
  has_table_privilege('anon','public.healthclues_knowledge_clues','SELECT') and
  has_table_privilege('anon','public.healthclues_boss_challenges','SELECT')
);
select 'PUBLIC_JOURNEY_DIRECT_SELECT|'||has_table_privilege(current_user,'public.healthclues_public_journeys','SELECT');
select 'PUBLIC_USAGE_DIRECT_SELECT|'||has_table_privilege(current_user,'public.healthclues_public_tool_usages','SELECT');
select 'AUDIT_EVENT_SELECT|'||has_table_privilege(current_user,'public.healthclues_audit_events','SELECT');
select 'AUDIT_EVENT_INSERT|'||has_table_privilege(current_user,'public.healthclues_audit_events','INSERT');
select 'XP_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_xp_ledger','INSERT');
select 'XP_UPDATE_GRANT|'||has_table_privilege(current_user,'public.healthclues_xp_ledger','UPDATE');
select 'REWARD_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_user_rewards','INSERT');
select 'CURRENCY_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_knowledge_currency_ledger','INSERT');
select 'KNOWLEDGE_ATTEMPT_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_knowledge_attempts','INSERT');
select 'BOSS_CLEAR_DELETE_GRANT|'||has_table_privilege(current_user,'public.healthclues_boss_clears','DELETE');
select 'CHECKIN_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_daily_checkins','INSERT');
select 'USAGE_UPDATE_GRANT|'||has_table_privilege(current_user,'public.healthclues_daily_usage_records','UPDATE');
select 'COMMUNITY_REPORT_UPDATE_GRANT|'||has_table_privilege(current_user,'public.healthclues_community_reports','UPDATE');
select 'REMINDER_DELIVERY_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_notification_deliveries','INSERT');
select 'CATALOG_PROPOSAL_INSERT_GRANT|'||has_table_privilege(current_user,'public.healthclues_catalog_proposals','INSERT');
set local role service_role;
do $$ begin
  begin
    perform public.healthclues_import_review_drafts_v1('[{"kind":"boss","id":"hc-invalid-source","version":1,"topicKey":"sleep-better","title":"Synthetic test","intro":"Synthetic test","questionPrompt":"Synthetic question","questionOptions":[{"id":"a","label":"A"},{"id":"b","label":"B"}],"sourceReferences":[{"label":"Unapproved test host","url":"https://example.invalid/content"}],"answerKey":{"correctOptionId":"a","explanation":"Synthetic test."}}]'::jsonb,'Reject unapproved source in DB regression.');
    raise exception 'unapproved source host was accepted';
  exception when invalid_parameter_value then null;
  end;
  if exists(select 1 from public.healthclues_boss_challenges where boss_id='hc-invalid-source') then raise exception 'invalid source rejection left a Boss row'; end if;
end $$;
reset role;
select public.healthclues_request_data_deletion_v1('${userId}'::uuid);
create temporary table healthclues_deletion_test_request(id uuid);
grant all on healthclues_deletion_test_request to authenticated,service_role;
insert into healthclues_deletion_test_request select id from public.healthclues_account_deletion_requests where user_id='${userId}'::uuid and status='requested';
select 'DELETION_REQUEST_IDEMPOTENT|'||((public.healthclues_request_data_deletion_v1('${userId}'::uuid)->>'id')=(select id::text from healthclues_deletion_test_request))::text;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','${userId}',true);
select 'DELETION_LOCK_ACCESS|'||public.healthclues_account_access_enabled_v1();
select 'DELETION_LOCK_PROFILE|'||count(*) from public.healthclues_profiles where user_id='${userId}';
select 'DELETION_LOCK_WORLD|'||count(*) from public.healthclues_wellness_worlds where user_id='${userId}';
do $$ declare t text; owner_column text; visible_rows integer; private_tables text[]:=array[
  'healthclues_profiles','healthclues_discovery_activity','healthclues_personal_tools','healthclues_catalog_proposals',
  'healthclues_profile_history',
  'healthclues_wellness_worlds','healthclues_branches','healthclues_journeys','healthclues_toolkit_collection',
  'healthclues_toolkit_entries','healthclues_daily_checkins','healthclues_daily_usage_records','healthclues_usage_occurrences',
  'healthclues_journal_entries','healthclues_xp_ledger','healthclues_user_rewards','healthclues_user_milestones',
  'healthclues_email_preferences','healthclues_notification_deliveries','healthclues_toolkit_entry_events',
  'healthclues_journey_follows','healthclues_community_reports','healthclues_knowledge_discoveries',
  'healthclues_knowledge_attempts','healthclues_boss_attempts','healthclues_boss_clears','healthclues_world_unlocks',
  'healthclues_knowledge_currency_ledger'
]; begin
  foreach t in array private_tables loop
    owner_column:=case t when 'healthclues_journey_follows' then 'follower_user_id' when 'healthclues_community_reports' then 'reporter_user_id' else 'user_id' end;
    execute format('select count(*) from public.%I where %I=$1',t,owner_column) into visible_rows using auth.uid();
    if visible_rows<>0 then raise exception 'pending deletion exposed private rows in %',t; end if;
  end loop;
  perform set_config('healthclues.deletion_lock_private_rows',cardinality(private_tables)::text,true);
end $$;
select 'DELETION_LOCK_PRIVATE_ROWS_OK|'||current_setting('healthclues.deletion_lock_private_rows',true);
reset role;
set local role service_role;
select 'DELETION_CANCELED|'||(public.healthclues_cancel_data_deletion_v1('${userId}'::uuid)->>'canceled');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','${userId}',true);
select 'DELETION_RESTORED_ACCESS|'||public.healthclues_account_access_enabled_v1();
select 'DELETION_RESTORED_PROFILE|'||count(*) from public.healthclues_profiles where user_id='${userId}';
reset role;
set local role service_role;
select public.healthclues_request_data_deletion_v1('${userId}'::uuid);
truncate healthclues_deletion_test_request;
insert into healthclues_deletion_test_request select id from public.healthclues_account_deletion_requests where user_id='${userId}'::uuid and status='requested';
select 'DELETION_PURGE_COUNT|'||public.healthclues_purge_due_data_deletions_v1(now()+interval '61 days',10);
select 'DELETION_PURGE_RETRY|'||public.healthclues_purge_due_data_deletions_v1(now()+interval '61 days',10);
select 'DELETION_ANONYMIZED_AUDIT|'||count(*) from public.healthclues_account_deletion_requests where id=(select id from healthclues_deletion_test_request) and user_id is null and status='purged' and purged_at is not null;
reset role;
select 'DELETION_AUTH_ACCOUNT_RETAINED|'||count(*) from auth.users where id='${userId}'::uuid;
select 'DELETION_PRIMARY_ROWS_REMAIN|' ||
  (select count(*) from public.healthclues_profiles where user_id='${userId}') ||
  (select count(*) from public.healthclues_profile_history where user_id='${userId}') ||
  (select count(*) from public.healthclues_wellness_worlds where user_id='${userId}') ||
  (select count(*) from public.healthclues_toolkit_entries where user_id='${userId}') ||
  (select count(*) from public.healthclues_daily_checkins where user_id='${userId}') ||
  (select count(*) from public.healthclues_journal_entries where user_id='${userId}') ||
  (select count(*) from public.healthclues_xp_ledger where user_id='${userId}') ||
  (select count(*) from public.healthclues_knowledge_discoveries where user_id='${userId}') ||
  (select count(*) from public.healthclues_boss_attempts where user_id='${userId}') ||
  (select count(*) from public.healthclues_public_journeys where user_id='${userId}') ||
  (select count(*) from public.healthclues_email_preferences where user_id='${userId}');
select 'DELETION_OTHER_OWNER_RETAINED|'||count(*) from public.healthclues_wellness_worlds where user_id='${otherUserId}';
rollback;
`;

try {
  writeFileSync(knowledgeCleanupPath, `delete from public.healthclues_knowledge_clues where clue_id='${clueId}'; delete from public.healthclues_boss_challenges where boss_id='${bossId}';`, { encoding: "utf8" });
  const migrationContainerPath = `/tmp/${path.basename(migrationPath)}`;
  execFileSync("docker", ["cp", migrationPath, `${containerName}:${migrationContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${migrationContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const knowledgeContainerPath = `/tmp/${path.basename(knowledgeMigrationPath)}`;
  execFileSync("docker", ["cp", knowledgeMigrationPath, `${containerName}:${knowledgeContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${knowledgeContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const bossContainerPath = `/tmp/${path.basename(bossMigrationPath)}`;
  execFileSync("docker", ["cp", bossMigrationPath, `${containerName}:${bossContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${bossContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const reminderContainerPath = `/tmp/${path.basename(reminderMigrationPath)}`;
  execFileSync("docker", ["cp", reminderMigrationPath, `${containerName}:${reminderContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${reminderContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const retryContainerPath = `/tmp/${path.basename(reminderRetryMigrationPath)}`;
  execFileSync("docker", ["cp", reminderRetryMigrationPath, `${containerName}:${retryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${retryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const authoringContainerPath = `/tmp/${path.basename(adminDraftMigrationPath)}`;
  execFileSync("docker", ["cp", adminDraftMigrationPath, `${containerName}:${authoringContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${authoringContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const rewardConfigContainerPath = `/tmp/${path.basename(rewardConfigMigrationPath)}`;
  execFileSync("docker", ["cp", rewardConfigMigrationPath, `${containerName}:${rewardConfigContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${rewardConfigContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const reviewerBoundaryContainerPath = `/tmp/${path.basename(discoveryReviewerMigrationPath)}`;
  execFileSync("docker", ["cp", discoveryReviewerMigrationPath, `${containerName}:${reviewerBoundaryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${reviewerBoundaryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const quizBankContainerPath = `/tmp/${path.basename(quizBankMigrationPath)}`;
  execFileSync("docker", ["cp", quizBankMigrationPath, `${containerName}:${quizBankContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${quizBankContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const sourceDraftContainerPath = `/tmp/${path.basename(sourceDraftMigrationPath)}`;
  execFileSync("docker", ["cp", sourceDraftMigrationPath, `${containerName}:${sourceDraftContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${sourceDraftContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const worldEvolutionContainerPath = `/tmp/${path.basename(worldEvolutionMigrationPath)}`;
  execFileSync("docker", ["cp", worldEvolutionMigrationPath, `${containerName}:${worldEvolutionContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${worldEvolutionContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const bossCosmeticRewardContainerPath = `/tmp/${path.basename(bossCosmeticRewardMigrationPath)}`;
  execFileSync("docker", ["cp", bossCosmeticRewardMigrationPath, `${containerName}:${bossCosmeticRewardContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${bossCosmeticRewardContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const cosmeticRewardConfigContainerPath = `/tmp/${path.basename(cosmeticRewardConfigMigrationPath)}`;
  execFileSync("docker", ["cp", cosmeticRewardConfigMigrationPath, `${containerName}:${cosmeticRewardConfigContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${cosmeticRewardConfigContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const knowledgeCurrencyContainerPath = `/tmp/${path.basename(knowledgeCurrencyMigrationPath)}`;
  execFileSync("docker", ["cp", knowledgeCurrencyMigrationPath, `${containerName}:${knowledgeCurrencyContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${knowledgeCurrencyContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const dataDeletionContainerPath = `/tmp/${path.basename(dataDeletionMigrationPath)}`;
  execFileSync("docker", ["cp", dataDeletionMigrationPath, `${containerName}:${dataDeletionContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${dataDeletionContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const profileHistoryContainerPath = `/tmp/${path.basename(profileHistoryMigrationPath)}`;
  execFileSync("docker", ["cp", profileHistoryMigrationPath, `${containerName}:${profileHistoryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${profileHistoryContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const reminderPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('authenticated','public.healthclues_queue_daily_reminders_v1(timestamptz)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_queue_daily_reminders_v1(timestamptz)','execute')::text || '|' || has_function_privilege('authenticated','public.healthclues_dispatch_mock_reminders_v1(timestamptz,integer)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_dispatch_mock_reminders_v1(timestamptz,integer)','execute')::text || '|' || has_function_privilege('authenticated','public.healthclues_requeue_failed_reminders_v1(timestamptz,integer)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_requeue_failed_reminders_v1(timestamptz,integer)','execute')::text || '|' || has_function_privilege('authenticated','public.healthclues_mock_fail_due_reminders_v1(timestamptz,integer)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_mock_fail_due_reminders_v1(timestamptz,integer)','execute')::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(reminderPrivileges, "false|true|false|true|false|true|false|true", "all reminder worker RPCs must be service-role only");
  const draftPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('authenticated','public.healthclues_create_admin_draft_v1(jsonb,text)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_create_admin_draft_v1(jsonb,text)','execute')::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(draftPrivileges, "false|true", "only the service-role-backed reviewer API may create content drafts");
  const rewardPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('authenticated','public.healthclues_update_reward_config_v1(text,integer,text,boolean,text)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_update_reward_config_v1(text,integer,text,boolean,text)','execute')::text || '|' || has_table_privilege('authenticated','public.healthclues_reward_definitions','UPDATE')::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(rewardPrivileges, "false|true|false", "reward configuration is reviewer-RPC-only and authenticated clients cannot edit definitions");
  const discoveryReviewerPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('authenticated','public.healthclues_review_write(jsonb,text,text,boolean)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_review_write(jsonb,text,text,boolean)','execute')::text || '|' || position('healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN' in pg_get_functiondef('public.healthclues_review_write(jsonb,text,text,boolean)'::regprocedure))::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const [authenticatedExecute, serviceExecute, reviewerIdentityOffset] = discoveryReviewerPrivileges.split("|");
  assert.equal(authenticatedExecute, "false", "authenticated clients cannot invoke discovery review RPC");
  assert.equal(serviceExecute, "true", "service role can invoke discovery review RPC");
  assert.ok(Number(reviewerIdentityOffset) > 0, "discovery review RPC records the dedicated reviewer identity");
  const quizBankPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('authenticated','public.healthclues_save_quiz_bank_v1(jsonb,text,text,integer)','execute')::text || '|' || has_function_privilege('service_role','public.healthclues_save_quiz_bank_v1(jsonb,text,text,integer)','execute')::text || '|' || has_table_privilege('authenticated','public.healthclues_quiz_bank_versions','SELECT')::text || '|' || has_table_privilege('service_role','public.healthclues_quiz_bank_versions','SELECT')::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(quizBankPrivileges, "false|true|false|true", "quiz bank edits are service-role only; authenticated clients cannot read reviewer drafts");
  const serverRpcSignatures = [
    "healthclues_create_world_v1(uuid,uuid,text,text,text,date,jsonb)",
    "healthclues_save_daily_checkin_v1(uuid,uuid,date,text,jsonb,text,text)",
    "healthclues_award_elapsed_milestones_v1(uuid,date)",
    "healthclues_manage_toolkit_entry_v1(uuid,uuid,text,text,integer,jsonb)",
    "healthclues_equip_collection_item_v1(uuid,uuid,text,integer,uuid)",
    "healthclues_discover_knowledge_clue_v1(uuid,uuid,text,integer,date)",
    "healthclues_answer_knowledge_clue_v1(uuid,uuid,text,integer,text,uuid)",
    "healthclues_answer_boss_challenge_v1(uuid,uuid,text,integer,text,uuid)",
    "healthclues_queue_daily_reminders_v1(timestamptz)",
    "healthclues_dispatch_mock_reminders_v1(timestamptz,integer)",
    "healthclues_requeue_failed_reminders_v1(timestamptz,integer)",
    "healthclues_mock_fail_due_reminders_v1(timestamptz,integer)",
    "healthclues_create_admin_draft_v1(jsonb,text)",
    "healthclues_update_reward_config_v1(text,integer,text,boolean,text)",
    "healthclues_review_write(jsonb,text,text,boolean)",
    "healthclues_save_quiz_bank_v1(jsonb,text,text,integer)",
    "healthclues_import_review_drafts_v1(jsonb,text)",
    "healthclues_request_data_deletion_v1(uuid)",
    "healthclues_cancel_data_deletion_v1(uuid)",
    "healthclues_purge_due_data_deletions_v1(timestamptz,integer)",
  ];
  const rpcSqlList = serverRpcSignatures.map(signature => `'public.${signature}'`).join(",");
  const serverRpcPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select count(*) filter (where procedure is null) || '|' || count(*) filter (where has_function_privilege('anon',procedure,'execute')) || '|' || count(*) filter (where has_function_privilege('authenticated',procedure,'execute')) || '|' || count(*) filter (where has_function_privilege('service_role',procedure,'execute')) from (select to_regprocedure(signature) as procedure from unnest(array[${rpcSqlList}]::text[]) as signatures(signature)) as functions"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(serverRpcPrivileges, `0|0|0|${serverRpcSignatures.length}`, "all business/reviewer RPCs must exist, deny anon/authenticated execution, and allow only service-role execution");
  const deletionHelperPrivileges = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select has_function_privilege('anon','public.healthclues_account_access_enabled_v1()','execute')::text || '|' || has_function_privilege('authenticated','public.healthclues_account_access_enabled_v1()','execute')::text"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(deletionHelperPrivileges, "false|true", "only authenticated row policies may execute the account access gate");
  const deletionLockTables = [
    "healthclues_profiles", "healthclues_profile_history", "healthclues_discovery_activity", "healthclues_personal_tools", "healthclues_catalog_proposals",
    "healthclues_wellness_worlds", "healthclues_branches", "healthclues_journeys", "healthclues_toolkit_collection",
    "healthclues_toolkit_entries", "healthclues_daily_checkins", "healthclues_daily_usage_records", "healthclues_usage_occurrences",
    "healthclues_journal_entries", "healthclues_xp_ledger", "healthclues_user_rewards", "healthclues_user_milestones",
    "healthclues_email_preferences", "healthclues_notification_deliveries", "healthclues_toolkit_entry_events",
    "healthclues_journey_follows", "healthclues_community_reports", "healthclues_knowledge_discoveries",
    "healthclues_knowledge_attempts", "healthclues_boss_attempts", "healthclues_boss_clears", "healthclues_world_unlocks",
    "healthclues_knowledge_currency_ledger",
  ];
  const deletionLockTableList = deletionLockTables.map(table => `'${table}'`).join(",");
  const deletionLockPolicyAudit = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select count(distinct tablename) || '|' || count(*) filter (where (coalesce(qual,'') || coalesce(with_check,'')) not ilike '%healthclues_account_access_enabled_v1%') from pg_policies where schemaname='public' and tablename=any(array[${deletionLockTableList}]::text[]) and 'authenticated'=any(roles)"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(deletionLockPolicyAudit, `${deletionLockTables.length}|0`, "every authenticated private-data policy must include the immediate account-deletion lock");
  const protectedContentTables = [
    "healthclues_catalog_items", "healthclues_catalog_item_versions", "healthclues_usage_methods",
    "healthclues_usage_method_versions", "healthclues_usage_method_items", "healthclues_recipe_combos",
    "healthclues_journey_combos", "healthclues_journey_combo_components", "healthclues_discovery_content",
    "healthclues_knowledge_clues", "healthclues_knowledge_answer_keys", "healthclues_boss_challenges",
    "healthclues_boss_answer_keys", "healthclues_reward_definitions", "healthclues_quiz_bank_versions",
    "healthclues_quiz_bank_audit", "healthclues_audit_events", "healthclues_account_deletion_requests",
  ];
  const protectedTableList = protectedContentTables.map(table => `'public.${table}'`).join(",");
  const protectedTableGrants = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select count(*) || '|' || count(*) filter (where has_table_privilege('authenticated',table_name,'insert') or has_table_privilege('authenticated',table_name,'update') or has_table_privilege('authenticated',table_name,'delete')) from unnest(array[${protectedTableList}]::text[]) as tables(table_name)"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(protectedTableGrants, `${protectedContentTables.length}|0`, "authenticated users cannot directly mutate reviewed content, answer keys, Quiz drafts, reward definitions, or audit events");
  const rlsGrantPolicySql = "with t as (select c.oid,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname like 'healthclues_%' and c.relrowsecurity), principals as (select rolname from pg_roles where rolname in ('anon','authenticated')), privileges(privilege,policy_cmd) as (values ('SELECT','SELECT'),('INSERT','INSERT'),('UPDATE','UPDATE'),('DELETE','DELETE')) select count(*) from t cross join principals p cross join privileges v where has_table_privilege(p.rolname,t.oid,v.privilege) and not exists(select 1 from pg_policies pol where pol.schemaname='public' and pol.tablename=t.relname and (p.rolname::name=any(pol.roles) or 'public'::name=any(pol.roles)) and pol.cmd in (v.policy_cmd,'ALL'))";
  const rlsGrantPolicyViolations = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "${rlsGrantPolicySql}"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  assert.equal(rlsGrantPolicyViolations, "0", "every anon/authenticated table grant must be protected by a matching role and command RLS policy");
  writeFileSync(sqlPath, sql, { encoding: "utf8" });
  const containerPath = `/tmp/${path.basename(sqlPath)}`;
  const clueSql = `insert into public.healthclues_knowledge_clues(clue_id,version,topic_key,chapter_id,title,content,source_references,related_catalog_ids,question_prompt,question_options,review_status,published,reviewed_by,reviewed_at) values ('${clueId}',1,'move-more','basics','Test learning clue','Synthetic, non-medical fixture content.','[{"label":"Isolated test source","url":"https://example.invalid/test"}]'::jsonb,'{}','Which option is the test answer?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'reviewed',true,'test-fixture',now()); insert into public.healthclues_knowledge_answer_keys(clue_id,clue_version,correct_option_id,answer_explanation) values ('${clueId}',1,'right','Synthetic fixture explanation.'); insert into public.healthclues_boss_challenges(boss_id,version,topic_key,title,intro,question_prompt,question_options,review_status,published,reviewed_by,reviewed_at) values ('${bossId}',1,'move-more','Test Move More Boss','Synthetic fixture.','Which answer is correct?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'reviewed',true,'test-fixture',now()); insert into public.healthclues_boss_answer_keys(boss_id,boss_version,correct_option_id,explanation) values ('${bossId}',1,'right','Synthetic fixture explanation.');`;
  const clueSqlPath = path.join(tempDir, "knowledge-fixture.sql");
  writeFileSync(clueSqlPath, clueSql, { encoding: "utf8" });
  const clueContainerPath = `/tmp/${path.basename(clueSqlPath)}`;
  execFileSync("docker", ["cp", clueSqlPath, `${containerName}:${clueContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${clueContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["cp", sqlPath, `${containerName}:${containerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  const output = execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${containerPath}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /\nDO\n/);
  assert.match(output, /RLS_ALL_HEALTHCLUES_TABLES\|true/, "every HealthClues table in the isolated DB must enable RLS");
  assert.match(output, /CROSS_OWNER_SECURITY_PROBES_OK\|28/, "all 28 populated private row families must deny cross-owner reads and updates/deletes in the rollback fixture");
  assert.match(output, /OWNER_SPOOF_INSERT_AND_TRANSFER_PROBES_OK\|9/, "owner RLS must reject foreign-user inserts and ownership transfers, including consented profile rows");
  assert.match(output, /DELETION_LOCK_ACCESS\|false/, "a pending deletion immediately disables authenticated data access");
  assert.match(output, /DELETION_REQUEST_IDEMPOTENT\|true/, "repeated deletion requests reuse the one pending recovery record");
  assert.match(output, /DELETION_LOCK_PROFILE\|0/);
  assert.match(output, /DELETION_LOCK_WORLD\|0/);
  assert.match(output, /DELETION_LOCK_PRIVATE_ROWS_OK\|28/, "a pending deletion hides all populated private row families through direct RLS");
  assert.match(output, /DELETION_CANCELED\|true/, "the owner can recover during the recovery window");
  assert.match(output, /DELETION_RESTORED_ACCESS\|true/);
  assert.match(output, /DELETION_RESTORED_PROFILE\|1/);
  assert.match(output, /DELETION_PURGE_COUNT\|1/, "the service retention worker purges only due requests");
  assert.match(output, /DELETION_PURGE_RETRY\|0/, "a second retention run does not repeat an already completed purge");
  assert.match(output, /DELETION_ANONYMIZED_AUDIT\|1/, "purge leaves only an anonymized minimal request audit");
  assert.match(output, /DELETION_AUTH_ACCOUNT_RETAINED\|1/, "HealthClues data deletion does not delete the user's Botly auth account");
  assert.match(output, /DELETION_PRIMARY_ROWS_REMAIN\|0/, "all primary HealthClues data is removed after the purge deadline");
  assert.match(output, /DELETION_OTHER_OWNER_RETAINED\|1/, "purging one member cannot affect another member's World");
  for (const label of ["OWNER_PROFILE_UPDATE", "OWNER_WORLD_UPDATE", "OWNER_JOURNAL_UPDATE"]) assert.match(output, new RegExp(`${label}\\|1`), `${label} must allow an authenticated owner to edit their row`);
  for (const label of ["CROSS_PROFILE_UPDATE", "CROSS_WORLD_UPDATE", "CROSS_JOURNAL_UPDATE"]) assert.match(output, new RegExp(`${label}\\|0`), `${label} must filter writes against another user's row`);
  assert.match(output, /PROFILE_OWN\|1/);
  assert.match(output, /PROFILE_CROSS\|0/);
  assert.match(output, /PROFILE_HISTORY_OWN\|1/, "profile revision history is visible to its owner");
  assert.match(output, /PROFILE_HISTORY_CROSS\|0/, "profile revision history is hidden from other members");
  assert.match(output, /CURRENCY_OWN\|2/);
  assert.match(output, /CURRENCY_CROSS\|0/);
  assert.match(output, /RLS_WORLD_OWN\|1/);
  for (const label of ["RLS_WORLD_CROSS", "RLS_BRANCH_CROSS", "RLS_JOURNEY_CROSS", "RLS_COLLECTION_CROSS", "RLS_TOOLKIT_CROSS", "RLS_CHECKIN_CROSS", "RLS_USAGE_CROSS", "RLS_JOURNAL_CROSS", "RLS_PERSONAL_TOOLS_CROSS", "RLS_CATALOG_PROPOSALS_CROSS", "RLS_XP_CROSS", "BOOK_CROSS", "KNOWLEDGE_ATTEMPT_CROSS", "BOSS_ATTEMPT_CROSS", "BOSS_CLEAR_CROSS", "UNLOCK_CROSS", "MILESTONE_CROSS", "REWARD_CROSS", "EMAIL_PREFERENCE_CROSS", "REMINDER_DELIVERY_CROSS", "FOLLOW_CROSS", "COMMUNITY_REPORT_CROSS"]) assert.match(output, new RegExp(`${label}\\|0`), `${label} must hide actual rows owned by the second user`);
  assert.match(output, /RLS_JOURNAL_OWN\|1/);
  assert.match(output, /RLS_CATALOG_PROPOSALS_OWN\|1/);
  assert.match(output, /BOOK_OWN\|1/);
  for (const label of ["REMINDER_DELIVERY_OWN", "FOLLOW_OWN", "COMMUNITY_REPORT_OWN"]) assert.match(output, new RegExp(`${label}\\|1`), `${label} must expose the current user's populated row`);
  assert.match(output, /ANSWER_KEY_SELECT\|false/);
  assert.match(output, /CONTENT_IMPORT_PRIVILEGES\|false\|true/, "review-draft imports are executable only by the service role");
  assert.match(output, /ANON_PRIVATE_SELECT_GRANTS\|\n/, "anon must have no direct SELECT grant for private, audit, answer-key, projection, or reviewer tables");
  assert.match(output, /ANON_APPROVED_CONTENT_SELECT\|true/, "anon content reads are limited to explicitly reviewed-content table surfaces");
  for (const label of ["PUBLIC_JOURNEY_DIRECT_SELECT", "PUBLIC_USAGE_DIRECT_SELECT", "AUDIT_EVENT_SELECT", "AUDIT_EVENT_INSERT"]) assert.match(output, new RegExp(`${label}\\|false`), `${label} must be denied to authenticated table clients`);
  assert.match(output, /XP_INSERT_GRANT\|false/);
  assert.match(output, /XP_UPDATE_GRANT\|false/);
  assert.match(output, /REWARD_INSERT_GRANT\|false/);
  assert.match(output, /CURRENCY_INSERT_GRANT\|false/);
  assert.match(output, /KNOWLEDGE_ATTEMPT_INSERT_GRANT\|false/);
  assert.match(output, /BOSS_CLEAR_DELETE_GRANT\|false/);
  for (const label of ["CHECKIN_INSERT_GRANT", "USAGE_UPDATE_GRANT", "COMMUNITY_REPORT_UPDATE_GRANT", "REMINDER_DELIVERY_INSERT_GRANT"]) assert.match(output, new RegExp(`${label}\\|false`), `${label} must deny direct client writes`);
  assert.match(output, /CATALOG_PROPOSAL_INSERT_GRANT\|true/, "members may submit their own catalog proposals under owner RLS");
  assert.match(output, /ROLLBACK/);
  console.log(`HealthClues World DB tests passed: idempotent World/Collection equip and deletion request/purge, Knowledge Fragment/Key ledger, Knowledge/Boss rewards, persistent World unlock, approved content gates, private answer-key isolation, service-role-only reminder scheduler/dispatch, daily usage, fixed XP, milestones, deletion lock policies and populated-row lock on ${deletionLockTables.length} private tables, and RLS; member fixtures rolled back.`);
} finally {
  try {
    const cleanupContainerPath = `/tmp/${path.basename(knowledgeCleanupPath)}`;
    execFileSync("docker", ["cp", knowledgeCleanupPath, `${containerName}:${cleanupContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
    execFileSync("docker", ["exec", containerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${cleanupContainerPath}`], { stdio: ["ignore", "ignore", "pipe"] });
  } catch { /* The fixture row is uniquely named and isolated; preserve the primary test result. */ }
  rmSync(tempDir, { recursive: true, force: true });
}
