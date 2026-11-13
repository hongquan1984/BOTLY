import assert from "node:assert/strict";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolkitEquipMigration = path.join(root, "supabase", "migrations", "20261028100000_healthclues_toolkit_equip.sql");
const knowledgeMigration = path.join(root, "supabase", "migrations", "20261028110000_healthclues_knowledge_journey.sql");
const bossMigration = path.join(root, "supabase", "migrations", "20261028120000_healthclues_boss_world_evolution.sql");
const reminderMigration = path.join(root, "supabase", "migrations", "20261028130000_healthclues_reminder_queue.sql");
const reminderRetryMigration = path.join(root, "supabase", "migrations", "20261028140000_healthclues_reminder_retry.sql");
const adminDraftMigration = path.join(root, "supabase", "migrations", "20261028150000_healthclues_admin_drafts.sql");
const rewardConfigMigration = path.join(root, "supabase", "migrations", "20261028160000_healthclues_reward_configuration.sql");
const discoveryReviewerMigration = path.join(root, "supabase", "migrations", "20261028170000_healthclues_discovery_reviewer_boundary.sql");
const quizBankMigration = path.join(root, "supabase", "migrations", "20261028180000_healthclues_quiz_bank_review.sql");
const sourceDraftMigration = path.join(root, "supabase", "migrations", "20261028190000_healthclues_boss_source_references.sql");
const worldEvolutionMigration = path.join(root, "supabase", "migrations", "20261028200000_healthclues_milestone_world_evolution.sql");
const bossCosmeticRewardMigration = path.join(root, "supabase", "migrations", "20261028210000_healthclues_boss_cosmetic_rewards.sql");
const cosmeticRewardConfigMigration = path.join(root, "supabase", "migrations", "20261028220000_healthclues_cosmetic_reward_configuration.sql");
const knowledgeCurrencyMigration = path.join(root, "supabase", "migrations", "20261028230000_healthclues_knowledge_currency_ledger.sql");
const dataDeletionMigration = path.join(root, "supabase", "migrations", "20261028240000_healthclues_data_deletion.sql");
const analyticsIngestionMigration = path.join(root, "supabase", "migrations", "20261028260000_analytics_service_ingestion_only.sql");
const adminAnalyticsRpcMigration = path.join(root, "supabase", "migrations", "20261028270000_admin_analytics_service_only.sql");
const reminderJobToken = `hc-mock-job:${randomUUID()}`;
const retentionJobToken = `hc-retention-job:${randomUUID()}`;
const adminToken = `hc-game-admin:${randomUUID()}`;
const reviewerToken = `hc-game-reviewer:${randomUUID()}`;
const moderatorToken = `hc-game-moderator:${randomUUID()}`;
const dbContainerName = "botly-healthclues-db-e2e";
const postgrestContainerName = "botly-healthclues-postgrest-e2e";
const networkName = "botly-healthclues-e2e-20261027";
const databaseName = "botly_restore_verification";
const appOrigin = "http://127.0.0.1:3220";
const supabaseOrigin = "http://127.0.0.1:3221";
const restOrigin = "http://127.0.0.1:3001";
const browserDebugPort = 9333;
const tempBuild = path.join(root, "App", ".tmp", "healthclues-game-e2e-build");
mkdirSync(tempBuild, { recursive: true });
const tempSqlDir = mkdtempSync(path.join(os.tmpdir(), "hc-game-fixtures-"));
const fixtureSql = path.join(tempSqlDir, "setup.sql");
const cleanupSql = path.join(tempSqlDir, "cleanup.sql");
const staleCleanupSql = path.join(tempSqlDir, "stale-cleanup.sql");
const userA = randomUUID();
const userB = randomUUID();
const userC = randomUUID();
let deletionRequestId = null;
const emailA = `hc-game-${randomUUID()}@example.invalid`;
const emailB = `hc-game-${randomUUID()}@example.invalid`;
const emailC = `hc-game-${randomUUID()}@example.invalid`;
const itemIds = ["consume", "reduce", "practice", "practice-replacement", "ingredient", "recipe"].map(slot => `hc-test-${slot}-${randomUUID()}`);
const slugs = itemIds.map(() => `hc-test-${randomUUID()}`);
const clueIds = ["sleep", "nutrition"].map(topic => `hc-test-${topic}-clue-${randomUUID()}`);
const bossIds = ["sleep", "nutrition"].map(topic => `hc-test-${topic}-boss-${randomUUID()}`);
const comboId = `hc-test-journey-combo-${randomUUID()}`;
const recipeComboId = `hc-test-recipe-combo-${randomUUID()}`;
const methodId = `hc-test-method-${randomUUID()}`;
const authorMethodId = `hc-test-admin-method-${randomUUID()}`;
const authorRecipeComboId = `hc-test-admin-recipe-combo-${randomUUID()}`;
const authorJourneyComboId = `hc-test-admin-journey-combo-${randomUUID()}`;
const jwtFor = (secret, role, sub, lifetimeSeconds = 3600) => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = encode({ alg: "HS256", typ: "JWT" });
  const claims = encode({ role, aud: role, iss: "healthclues-game-e2e", ...(sub ? { sub } : {}), iat: now, exp: now + lifetimeSeconds });
  const input = `${head}.${claims}`;
  return `${input}.${createHmac("sha256", secret).update(input).digest("base64url")}`;
};
const inspect = name => JSON.parse(execFileSync("docker", ["inspect", name], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }))[0];
const envValue = (container, name) => {
  const entry = container.Config.Env.find(value => value.startsWith(`${name}=`));
  if (!entry) throw new Error(`Test harness blocked: ${name} is missing from the isolated container.`);
  return entry.slice(name.length + 1);
};
const setPortFree = port => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", () => reject(new Error(`Test port ${port} is occupied.`)));
  server.listen(port, "127.0.0.1", () => server.close(resolve));
});
const runPsqlFile = (file, inContainerPath) => {
  execFileSync("docker", ["cp", file, `${dbContainerName}:${inContainerPath}`], { timeout: 60_000, stdio: ["ignore", "ignore", "pipe"] });
  execFileSync("docker", ["exec", dbContainerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -v ON_ERROR_STOP=1 -f ${inContainerPath}`], { timeout: 60_000, stdio: ["ignore", "ignore", "pipe"] });
};
function nextLocalMondayHalfHour(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const start = Math.ceil(Date.now() / 1_800_000) * 1_800_000;
  for (let step = 0; step < 20 * 48; step++) {
    const at = new Date(start + step * 1_800_000);
    const parts = Object.fromEntries(formatter.formatToParts(at).map(part => [part.type, part.value]));
    if (parts.weekday === "Mon" && parts.hour === "00" && (parts.minute === "00" || parts.minute === "30")) return at;
  }
  throw new Error(`Could not calculate a future local Monday for ${timeZone}.`);
}

const database = inspect(dbContainerName);
const postgrest = inspect(postgrestContainerName);
assert.equal(database.Config.Image, "supabase/postgres:17.6.1.068");
assert.ok(database.NetworkSettings.Networks[networkName]);
assert.equal(Object.keys(database.HostConfig.PortBindings ?? {}).length, 0);
assert.equal(postgrest.Config.Image, "postgrest/postgrest:v16.4");
assert.ok(postgrest.NetworkSettings.Networks[networkName]);
assert.equal(postgrest.HostConfig.PortBindings?.["3000/tcp"]?.[0]?.HostIp, "127.0.0.1");
const postgrestUri = new URL(envValue(postgrest, "PGRST_DB_URI"));
assert.equal(postgrestUri.pathname, `/${databaseName}`);
assert.equal(postgrestUri.hostname, "botly-hc-db");
const jwtSecret = envValue(postgrest, "PGRST_JWT_SECRET");
const serviceToken = jwtFor(jwtSecret, "service_role");
const anonToken = jwtFor(jwtSecret, "anon");
const userTokenA = jwtFor(jwtSecret, "authenticated", userA);
const userTokenB = jwtFor(jwtSecret, "authenticated", userB);
const userTokenC = jwtFor(jwtSecret, "authenticated", userC);

let app;
let appLogs = "";
let appExited;
let proxy;
let chrome;
let ws;
let requestId = 0;
const pending = new Map();
const browserFailures = [];
const browserRequests = [];
const browserExceptions = [];
const mockActivationEmails = [];
const exited = new Promise(resolve => { appExited = resolve; });

async function waitForApp() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error("Local HealthClues test app exited before it became ready.");
    try { const response = await fetch(`${appOrigin}/en/wellness/healthclues/world`, { signal: AbortSignal.timeout(2000) }); if (response.ok) return; } catch { /* Continue startup polling. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Local HealthClues test app did not start on loopback.");
}

async function cdp(method, params = {}) {
  const id = ++requestId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 15_000);
    pending.set(id, message => { clearTimeout(timeout); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); });
  });
}
async function evaluate(expression, awaitPromise = false) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result?.value;
}
async function waitForText(text, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastEvaluationError = "";
  while (Date.now() < deadline) {
    try {
      const found = await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
      if (found) return;
      lastEvaluationError = "";
    } catch (error) {
      lastEvaluationError = error instanceof Error ? error.message : "unknown browser evaluation error";
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const browserState = await evaluate("JSON.stringify({url:location.href,title:document.title,body:document.body.innerText.slice(0,1200),html:document.documentElement.outerHTML.slice(0,500)})").catch(() => "<page unavailable>");
  const directResponse = await fetch(`${appOrigin}/en/wellness/healthclues/world?quest=eat-healthier`).catch(() => null);
  const directBody = directResponse ? await directResponse.text().catch(() => "") : "<request failed>";
  const debugDir = path.join(root, "App", "reports"); mkdirSync(debugDir, { recursive: true });
  try { await screenshot(path.join(debugDir, "healthclues-browser-failure.png")); } catch { /* Preserve the browser diagnostics even if screenshot capture fails. */ }
  throw new Error(`Browser did not show expected text: ${text}. Page: ${browserState}. Last evaluation error: ${lastEvaluationError || "none"}. Direct response: ${directResponse?.status ?? "none"} ${directBody.slice(0,300)}. Requests: ${JSON.stringify(browserRequests.slice(-20))}. Network failures: ${JSON.stringify(browserFailures.slice(-8))}. Exceptions: ${JSON.stringify(browserExceptions.slice(-8))}`);
}
async function clickButton(text) {
  const clicked = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.trim() === ${JSON.stringify(text)}); if (!b || b.disabled) return false; b.click(); return true; })()`);
  if (!clicked) {
    const buttons = await evaluate("JSON.stringify([...document.querySelectorAll('button')].map(x=>x.innerText.trim()).filter(Boolean))");
    const bodyText = await evaluate("document.body.innerText.slice(-1000)");
    throw new Error(`Could not click button: ${text}. Available buttons: ${buttons}. Page tail: ${bodyText}`);
  }
}
async function setCheckboxByLabel(text, checked) {
  return evaluate(`(() => { const label=[...document.querySelectorAll('label')].find(node=>node.innerText.includes(${JSON.stringify(text)})); const input=label?.querySelector('input[type="checkbox"]'); if(!input) return false; if(input.checked!==${checked}) input.click(); return true; })()`);
}
async function setInputValue(selector, value) {
  const updated = await evaluate(`(() => { const input=document.querySelector(${JSON.stringify(selector)}); if(!input) return false; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set; setter?.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
  assert.equal(updated, true, `Could not set input value: ${selector}`);
}
async function clickReminderButton(text) {
  const clicked = await evaluate(`(() => { const section=document.querySelector('#hc-reminders-title')?.closest('section'); const b=section&&[...section.querySelectorAll('button')].find(x=>x.innerText.trim()===${JSON.stringify(text)}); if(!b||b.disabled) return false; b.click(); return true; })()`);
  assert.equal(clicked, true, `Could not click Reminder action: ${text}`);
}
async function clickButtonContaining(text) {
  const clicked = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes(${JSON.stringify(text)})); if (!b || b.disabled) return false; b.click(); return true; })()`);
  assert.equal(clicked, true, `Could not click a button containing: ${text}`);
}
async function clickButtonInBoss(text) {
  const clicked = await evaluate(`(() => { const root = document.querySelector('[aria-labelledby="hc-boss-title"]'); const b = root && [...root.querySelectorAll('button')].find(x => x.innerText.trim() === ${JSON.stringify(text)}); if (!b || b.disabled) return false; b.click(); return true; })()`);
  assert.equal(clicked, true, `Could not click Boss answer: ${text}`);
}
async function clickButtonInCombo(title, text) {
  const clicked = await evaluate(`(() => { const heading=[...document.querySelectorAll('h3')].find(x=>x.innerText.trim()===${JSON.stringify(title)}); const card=heading?.closest('article'); const b=card&&[...card.querySelectorAll('button')].find(x=>x.innerText.trim()===${JSON.stringify(text)}); if(!b||b.disabled) return false; b.click(); return true; })()`);
  assert.equal(clicked, true, `Could not click Combo action: ${title} / ${text}`);
}
async function screenshot(filename) {
  const image = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
  writeFileSync(filename, Buffer.from(image.data, "base64"));
}
async function screenshotViewport(filename, selector) {
  if (selector) {
    const selectorLiteral = JSON.stringify(selector);
    await evaluate(`(() => { const element = document.querySelector(${selectorLiteral}); if (!element) return; const fixed = element.closest("[role=dialog]"); if (fixed && getComputedStyle(fixed).position === "fixed") return; const headerHeight = document.querySelector("header")?.getBoundingClientRect().height || 0; window.scrollBy({ top: element.getBoundingClientRect().top - headerHeight - 12, behavior: "instant" }); })()`);
  }
  const state = JSON.parse(await evaluate("JSON.stringify({width:document.documentElement.scrollWidth,viewport:innerWidth,footer:Boolean(document.querySelector('footer'))})"));
  assert.ok(state.width <= state.viewport + 2, `Screenshot has no horizontal overflow: ${JSON.stringify(state)}`);
  assert.equal(state.footer, false, "Game screenshots must not include a Botly marketing footer.");
  const image = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  writeFileSync(filename, Buffer.from(image.data, "base64"));
}
async function screenshotDesktopAndMobile(baseName, selector) {
  const previewsDir = path.join(root, "App", "reports", "previews");
  mkdirSync(previewsDir, { recursive: true });
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await screenshotViewport(path.join(previewsDir, `${baseName}-desktop.png`), selector);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await screenshotViewport(path.join(previewsDir, `${baseName}-mobile.png`), selector);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
}

try {
  await Promise.all([setPortFree(3220), setPortFree(3221), setPortFree(browserDebugPort)]);
  const seed = `
begin;
insert into auth.users(id,email,aud,role,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('${userA}','${emailA}','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now()),
 ('${userB}','${emailB}','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now()),
 ('${userC}','${emailC}','authenticated','authenticated','{}'::jsonb,'{}'::jsonb,now(),now());
insert into public.healthclues_catalog_items(id,slug,item_type,slot_key,review_status,active,recommendation_eligible,current_version) values
 ('${itemIds[0]}','${slugs[0]}','nutrition_habit','consume','reviewed',true,true,1),
 ('${itemIds[1]}','${slugs[1]}','reduce_habit','reduce','reviewed',true,true,1),
 ('${itemIds[2]}','${slugs[2]}','movement','practice','reviewed',true,true,1),
 ('${itemIds[3]}','${slugs[3]}','movement','practice','reviewed',true,true,1),
 ('${itemIds[4]}','${slugs[4]}','nutrition_habit','consume','reviewed',true,true,1),
 ('${itemIds[5]}','${slugs[5]}','recipe','consume','reviewed',true,true,1);
insert into public.healthclues_catalog_item_versions(catalog_item_id,version,name,description,evidence_class,evidence_summary,safety_notes,reviewed_by,reviewed_at) values
 ('${itemIds[0]}',1,'Test meal planning tool','Synthetic test fixture. No food prescription or treatment claim.','general_wellness','Synthetic non-clinical fixture.','Test fixture.','test-fixture',now()),
 ('${itemIds[1]}',1,'Test beverage reflection','Synthetic test fixture for tracking a user-selected habit.','general_wellness','Synthetic non-clinical fixture.','Test fixture.','test-fixture',now()),
 ('${itemIds[2]}',1,'Test gentle walk','Synthetic test fixture for a self-selected daily activity.','general_wellness','Synthetic non-clinical fixture.','Stop if uncomfortable. Test fixture.','test-fixture',now()),
 ('${itemIds[3]}',1,'Test stretch break','Synthetic reviewed fixture used only to exercise slot replacement.','general_wellness','Synthetic non-clinical fixture.','Choose a comfortable range. Test fixture.','test-fixture',now()),
 ('${itemIds[4]}',1,'Test recipe ingredient','Synthetic ingredient component for isolated Combo tests.','general_wellness','Synthetic non-clinical fixture.','No preparation or health claim. Test fixture.','test-fixture',now()),
 ('${itemIds[5]}',1,'Test recipe base','Synthetic recipe base for draft-authoring tests only.','general_wellness','Synthetic non-clinical fixture.','No preparation or health claim. Test fixture.','test-fixture',now());
insert into public.healthclues_knowledge_clues(clue_id,version,topic_key,chapter_id,title,content,source_references,question_prompt,question_options,review_status,published,reviewed_by,reviewed_at) values
 ('${clueIds[0]}',1,'sleep-better','test-chapter','Test sleep knowledge clue','Synthetic non-medical fixture content for isolated E2E only.','[{"label":"Isolated E2E fixture source","url":"https://example.invalid/sleep-clue"}]'::jsonb,'Which option is marked correct in this isolated fixture?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'reviewed',true,'test-fixture',now()),
 ('${clueIds[1]}',1,'eat-healthier','test-chapter','Test nutrition knowledge clue','Synthetic non-medical fixture content for isolated E2E only.','[{"label":"Isolated E2E fixture source","url":"https://example.invalid/nutrition-clue"}]'::jsonb,'Which option is marked correct in this isolated fixture?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'reviewed',true,'test-fixture',now());
insert into public.healthclues_knowledge_answer_keys(clue_id,clue_version,correct_option_id,answer_explanation) values
 ('${clueIds[0]}',1,'right','Synthetic fixture explanation; this is not health guidance.'),
 ('${clueIds[1]}',1,'right','Synthetic fixture explanation; this is not health guidance.');
insert into public.healthclues_boss_challenges(boss_id,version,topic_key,title,intro,question_prompt,question_options,source_references,review_status,published,reviewed_by,reviewed_at) values
 ('${bossIds[0]}',1,'sleep-better','Test Night Owl Boss','Synthetic isolated test challenge.','Which option is marked correct in this isolated fixture?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'[{"label":"Isolated E2E fixture source","url":"https://example.invalid/sleep-boss"}]'::jsonb,'reviewed',true,'test-fixture',now()),
 ('${bossIds[1]}',1,'eat-healthier','Test Sugar Dragon Boss','Synthetic isolated test challenge.','Which option is marked correct in this isolated fixture?','[{"id":"right","label":"Right"},{"id":"wrong","label":"Wrong"}]'::jsonb,'[{"label":"Isolated E2E fixture source","url":"https://example.invalid/nutrition-boss"}]'::jsonb,'reviewed',true,'test-fixture',now());
insert into public.healthclues_boss_answer_keys(boss_id,boss_version,correct_option_id,explanation) values
 ('${bossIds[0]}',1,'right','Synthetic fixture explanation; not health guidance.'),
 ('${bossIds[1]}',1,'right','Synthetic fixture explanation; not health guidance.');
insert into public.healthclues_journey_combos(id,version,name,review_status,active,rationale,partial_acceptance) values ('${comboId}',1,'Test Daily Journey Combo','reviewed',true,'Synthetic isolated fixture with optional reviewed components.','optional_components');
insert into public.healthclues_journey_combo_components(combo_id,combo_version,slot_key,catalog_item_id,item_version,required,display_order,rationale) values
 ('${comboId}',1,'consume','${itemIds[0]}',1,true,1,'Required synthetic test component.'),
 ('${comboId}',1,'reduce','${itemIds[1]}',1,false,2,'Optional synthetic test component.'),
 ('${comboId}',1,'practice','${itemIds[2]}',1,false,3,'Optional synthetic test component.');
insert into public.healthclues_usage_methods(id,slug,review_status,active,current_version) values ('${methodId}','${methodId}','reviewed',true,1);
insert into public.healthclues_usage_method_versions(method_id,version,name,instructions,estimated_minutes,safety_notes,review_status,reviewed_by,reviewed_at) values ('${methodId}',1,'Test recipe method','["Use the isolated test ingredient only.","Follow the synthetic test preparation step."]'::jsonb,5,'Synthetic test safety note; not health advice.','reviewed','test-fixture',now());
insert into public.healthclues_usage_method_items(method_id,method_version,catalog_item_id,item_version,relationship,is_required,display_order) values ('${methodId}',1,'${itemIds[4]}',1,'contains',true,1);
insert into public.healthclues_recipe_combos(id,version,recipe_item_id,recipe_item_version,method_id,method_version,review_status,active) values ('${recipeComboId}',1,'${itemIds[0]}',1,'${methodId}',1,'reviewed',true);
commit;
`;
  const cleanup = `
begin;
delete from public.healthclues_account_deletion_requests where user_id in ('${userA}','${userB}','${userC}');
delete from auth.users where id in ('${userA}','${userB}','${userC}');
delete from public.healthclues_audit_events where (entity_type in ('clue','boss') and entity_id like 'hc-test-%:v%') or (entity_type='community_report' and reason='Synthetic E2E moderator review.') or (action='content_draft_create' and entity_id like 'hc-test-admin-%:v1' and reason='Synthetic E2E draft authoring.');
delete from public.healthclues_journey_combos where id='${comboId}';
delete from public.healthclues_recipe_combos where id='${recipeComboId}';
delete from public.healthclues_journey_combos where id='${authorJourneyComboId}';
delete from public.healthclues_recipe_combos where id='${authorRecipeComboId}';
delete from public.healthclues_usage_method_items where method_id in ('${authorMethodId}','${methodId}');
delete from public.healthclues_usage_method_versions where method_id in ('${authorMethodId}','${methodId}');
delete from public.healthclues_usage_methods where id='${authorMethodId}';
delete from public.healthclues_usage_methods where id='${methodId}';
delete from public.healthclues_catalog_item_versions where catalog_item_id in ('${itemIds.join("','")}');
delete from public.healthclues_catalog_items where id in ('${itemIds.join("','")}');
delete from public.healthclues_knowledge_clues where clue_id in ('${clueIds.join("','")}');
delete from public.healthclues_boss_challenges where boss_id in ('${bossIds.join("','")}');
commit;
`;
  runPsqlFile(toolkitEquipMigration, "/tmp/healthclues-toolkit-equip.sql");
  runPsqlFile(knowledgeMigration, "/tmp/healthclues-knowledge-journey.sql");
  runPsqlFile(bossMigration, "/tmp/healthclues-boss-world-evolution.sql");
  runPsqlFile(reminderMigration, "/tmp/healthclues-reminder-queue.sql");
  runPsqlFile(reminderRetryMigration, "/tmp/healthclues-reminder-retry.sql");
  runPsqlFile(adminDraftMigration, "/tmp/healthclues-admin-drafts.sql");
  runPsqlFile(rewardConfigMigration, "/tmp/healthclues-reward-config.sql");
  runPsqlFile(discoveryReviewerMigration, "/tmp/healthclues-discovery-reviewer-boundary.sql");
  runPsqlFile(quizBankMigration, "/tmp/healthclues-quiz-bank-review.sql");
  runPsqlFile(sourceDraftMigration, "/tmp/healthclues-source-review-drafts.sql");
  runPsqlFile(worldEvolutionMigration, "/tmp/healthclues-milestone-world-evolution.sql");
  runPsqlFile(bossCosmeticRewardMigration, "/tmp/healthclues-boss-cosmetic-rewards.sql");
  runPsqlFile(cosmeticRewardConfigMigration, "/tmp/healthclues-cosmetic-reward-config.sql");
  runPsqlFile(knowledgeCurrencyMigration, "/tmp/healthclues-knowledge-currency-ledger.sql");
  runPsqlFile(dataDeletionMigration, "/tmp/healthclues-data-deletion.sql");
  runPsqlFile(analyticsIngestionMigration, "/tmp/healthclues-analytics-service-ingestion-only.sql");
  runPsqlFile(adminAnalyticsRpcMigration, "/tmp/healthclues-admin-analytics-service-only.sql");
  writeFileSync(staleCleanupSql, `begin;
delete from public.healthclues_account_deletion_requests where user_id in (select id from auth.users where email like 'hc-game-%@example.invalid');
delete from auth.users where email like 'hc-game-%@example.invalid';
delete from public.healthclues_audit_events where (entity_type in ('clue','boss') and entity_id like 'hc-test-%:v%') or (entity_type='community_report' and reason='Synthetic E2E moderator review.') or (action='content_draft_create' and entity_id like 'hc-test-admin-%:v1' and reason='Synthetic E2E draft authoring.');
delete from public.healthclues_recipe_combos where id like 'hc-test-recipe-combo-%';
delete from public.healthclues_recipe_combos where id like 'hc-test-admin-recipe-combo-%';
delete from public.healthclues_journey_combos where id like 'hc-test-journey-combo-%';
delete from public.healthclues_journey_combos where id like 'hc-test-admin-journey-combo-%';
delete from public.healthclues_usage_method_items where method_id like 'hc-test-method-%';
delete from public.healthclues_usage_method_versions where method_id like 'hc-test-method-%';
delete from public.healthclues_usage_methods where id like 'hc-test-method-%';
delete from public.healthclues_usage_method_items where method_id like 'hc-test-admin-method-%';
delete from public.healthclues_usage_method_versions where method_id like 'hc-test-admin-method-%';
delete from public.healthclues_usage_methods where id like 'hc-test-admin-method-%';
delete from public.healthclues_knowledge_clues where clue_id like 'hc-test-%-clue-%';
delete from public.healthclues_boss_challenges where boss_id like 'hc-test-%-boss-%';
delete from public.healthclues_catalog_item_versions where catalog_item_id like 'hc-test-%';
delete from public.healthclues_catalog_items where id like 'hc-test-%' and slug like 'hc-test-%';
commit;`, { encoding: "utf8" });
  runPsqlFile(staleCleanupSql, "/tmp/healthclues-stale-fixture-cleanup.sql");
  // This isolated PostgREST test container has PGRST_DB_CHANNEL_ENABLED=false,
  // so its schema cache cannot receive NOTIFY pgrst reload messages.
  execFileSync("docker", ["restart", postgrestContainerName], { stdio: ["ignore", "pipe", "pipe"] });
  const restReadyDeadline = Date.now() + 30_000;
  let restReady = false;
  while (Date.now() < restReadyDeadline) {
    try {
      const response = await fetch(restOrigin, { signal: AbortSignal.timeout(1500) });
      if (response.ok) { restReady = true; break; }
    } catch { /* Wait for the isolated REST service to reload the schema. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(restReady, "The isolated PostgREST service did not reload after the local migration.");
  writeFileSync(fixtureSql, seed, "utf8");
  writeFileSync(cleanupSql, cleanup, "utf8");
  runPsqlFile(fixtureSql, "/tmp/healthclues-game-setup.sql");

  const proxyServer = http.createServer((incoming, outgoing) => {
    const pathname = incoming.url || "/";
    if (pathname.startsWith("/auth/v1/") && incoming.method === "OPTIONS") {
      outgoing.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "apikey, authorization, content-type", "Access-Control-Max-Age": "600" });
      outgoing.end();
      return;
    }
    if (pathname === "/auth/v1/otp" && incoming.method === "POST") {
      let body = "";
      incoming.on("data", chunk => { body += chunk.toString(); });
      incoming.on("end", () => {
        try { mockActivationEmails.push(JSON.parse(body)); } catch { mockActivationEmails.push({ invalidBody: true }); }
        outgoing.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
        outgoing.end("{}");
      });
      return;
    }
    if (pathname === "/auth/v1/user" && incoming.method === "GET") {
      const token = incoming.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || "";
      const parts = token.split(".");
      if (parts.length !== 3) { outgoing.writeHead(401); outgoing.end(); return; }
      const input = `${parts[0]}.${parts[1]}`;
      const expected = createHmac("sha256", jwtSecret).update(input).digest();
      let supplied; let claims;
      try { supplied = Buffer.from(parts[2], "base64url"); claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); } catch { outgoing.writeHead(401); outgoing.end(); return; }
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected) || claims.role !== "authenticated" || !claims.sub || claims.exp < Math.floor(Date.now() / 1000)) { outgoing.writeHead(401); outgoing.end(); return; }
      outgoing.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
      outgoing.end(JSON.stringify({ id: claims.sub, email: claims.sub === userA ? emailA : claims.sub === userB ? emailB : undefined, email_confirmed_at: claims.sub === userB ? new Date().toISOString() : null }));
      return;
    }
    const upstreamPath = pathname.startsWith("/rest/v1") ? pathname.slice("/rest/v1".length) || "/" : pathname;
    const upstream = http.request({ hostname: "127.0.0.1", port: 3001, method: incoming.method, path: upstreamPath, headers: { ...incoming.headers, host: "127.0.0.1:3001" } }, response => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers); response.pipe(outgoing);
    });
    upstream.on("error", () => { outgoing.writeHead(502); outgoing.end(); });
    incoming.pipe(upstream);
  });
  proxy = proxyServer;
  await new Promise(resolve => proxy.listen(3221, "127.0.0.1", resolve));

  const src = path.join(root, "src");
  const publicDir = path.join(root, "public");
  for (const entry of [src, publicDir, "package.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs"]) cpSync(path.isAbsolute(entry) ? entry : path.join(root, entry), path.join(tempBuild, path.basename(entry)), { recursive: true });
  const sensitive = name => /^(SUPABASE_|NEXT_PUBLIC_SUPABASE_|EBOOK_ADMIN_TOKEN$|HEALTHCLUES_(REVIEWER|MODERATOR)_TOKEN$|DATABASE_URL$|PGHOST$|PGPORT$|PGUSER$|PGPASSWORD$|RESEND_API_KEY$|EMAIL_FROM$|ENABLE_REAL_EMAIL_DISPATCH$)/i.test(name);
  const appEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => !sensitive(name)));
  Object.assign(appEnv, {
    NODE_ENV: "production", SUPABASE_URL: supabaseOrigin, NEXT_PUBLIC_SUPABASE_URL: supabaseOrigin,
    SUPABASE_SECRET_KEY: serviceToken, SUPABASE_SERVICE_ROLE_KEY: serviceToken,
    SUPABASE_PUBLISHABLE_KEY: anonToken, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anonToken, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonToken,
    NEXT_PUBLIC_SITE_URL: appOrigin, EBOOK_ADMIN_TOKEN: adminToken,
    HEALTHCLUES_REVIEWER_TOKEN: reviewerToken, HEALTHCLUES_MODERATOR_TOKEN: moderatorToken,
    HEALTHCLUES_TURBOPACK_ROOT: root,
    RESEND_API_KEY: "", EMAIL_FROM: "", ENABLE_REAL_EMAIL_DISPATCH: "false",
    HEALTHCLUES_EMAIL_PROVIDER: "mock", HEALTHCLUES_REMINDER_JOB_TOKEN: reminderJobToken, HEALTHCLUES_RETENTION_JOB_TOKEN: retentionJobToken, HEALTHCLUES_MOCK_FAILURE_TESTS: "true",
      HEALTHCLUES_PENDING_JOURNEY_SECRET: `isolated-e2e-${randomUUID()}-${randomUUID()}`,
  });
  assert.equal(appEnv.RESEND_API_KEY, "");
  assert.equal(appEnv.ENABLE_REAL_EMAIL_DISPATCH, "false");
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  if (process.env.HEALTHCLUES_E2E_USE_EXISTING_BUILD !== "1" || !existsSync(path.join(tempBuild, ".next", "BUILD_ID"))) {
    try {
      execFileSync(process.execPath, [nextBin, "build"], { cwd: tempBuild, env: appEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    } catch (error) {
      const detail = `${error.stdout?.toString() ?? ""}\n${error.stderr?.toString() ?? ""}`.slice(-6000);
      throw new Error(`Isolated HealthClues build failed.\n${detail}`);
    }
  }
  app = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3220"], { cwd: tempBuild, env: appEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  app.stdout.on("data", chunk => { appLogs = `${appLogs}${chunk.toString()}`.slice(-12000); });
  app.stderr.on("data", chunk => { appLogs = `${appLogs}${chunk.toString()}`.slice(-12000); });
  app.once("exit", code => appExited(code ?? 1));
  await waitForApp();

  const unauthorized = await fetch(`${appOrigin}/api/healthclues/world`);
  assert.equal(unauthorized.status, 401, "private World API must require an authenticated session");
  const malformedBearer = await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: "Bearer not-a-jwt" } });
  assert.equal(malformedBearer.status, 401, "malformed bearer credentials cannot access a private HealthClues API");
  const expiredBearer = await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${jwtFor(jwtSecret, "authenticated", userA, -60)}` } });
  assert.equal(expiredBearer.status, 401, "expired signed credentials cannot access a private HealthClues API");
  for (const endpoint of ["/api/healthclues/world", "/api/healthclues/knowledge", "/api/healthclues/journal", "/api/healthclues/boss", "/api/healthclues/community", "/api/healthclues/reminders", "/api/healthclues/combos", "/api/healthclues/account", "/api/healthclues/world/checkin/detail"]) {
    const response = await fetch(`${appOrigin}${endpoint}`);
    assert.equal(response.status, 401, `private GET endpoint must deny anonymous access: ${endpoint}`);
  }
  for (const endpoint of ["/api/healthclues/world", "/api/healthclues/world/checkin", "/api/healthclues/world/collection", "/api/healthclues/world/toolkit", "/api/healthclues/knowledge", "/api/healthclues/journal", "/api/healthclues/boss", "/api/healthclues/community", "/api/healthclues/reminders", "/api/healthclues/account"]) {
    const response = await fetch(`${appOrigin}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(response.status, 401, `private POST endpoint must deny anonymous access: ${endpoint}`);
  }
  const anonymousToolkitMutation = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(anonymousToolkitMutation.status, 401, "private toolkit lifecycle mutation must deny anonymous access");
  const anonymousDeletion = await fetch(`${appOrigin}/api/healthclues/account`, { method: "DELETE" });
  assert.equal(anonymousDeletion.status, 401, "account deletion request must require an authenticated owner");
  const spoofedDeletionTarget = await fetch(`${appOrigin}/api/healthclues/account`, { method: "DELETE", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ userId: userA }) });
  assert.equal(spoofedDeletionTarget.status, 202, "authenticated deletion request is accepted for its session owner");
  const ownerADeletion = await (await fetch(`${appOrigin}/api/healthclues/account`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  const ownerBDeletion = await (await fetch(`${appOrigin}/api/healthclues/account`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(ownerADeletion.deletionRequest, null, "request body cannot target another account for deletion");
  assert.equal(ownerBDeletion.deletionRequest?.status, "requested", "deletion request belongs to authenticated session owner");
  const cancelSpoofProbe = await fetch(`${appOrigin}/api/healthclues/account`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
  assert.equal(cancelSpoofProbe.status, 200, "test owner can cancel the isolated ownership probe request");
  assert.equal((await (await fetch(`${appOrigin}/api/healthclues/account`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json()).deletionRequest, null, "test owner is restored immediately after the deletion-target probe");
  for (const endpoint of ["healthclues-quiz", "healthclues-discoveries", "healthclues-community", "healthclues-content", "healthclues-authoring", "healthclues-diagnostics", "healthclues-rewards"]) {
    const response = await fetch(`${appOrigin}/api/admin/${endpoint}`);
    assert.equal(response.status, 401, `HealthClues admin endpoint must reject unauthenticated access: ${endpoint}`);
    const memberResponse = await fetch(`${appOrigin}/api/admin/${endpoint}`, { headers: { Authorization: `Bearer ${userTokenA}` } });
    assert.equal(memberResponse.status, 401, `ordinary authenticated member cannot access HealthClues admin endpoint: ${endpoint}`);
    const legacyAdminResponse = await fetch(`${appOrigin}/api/admin/${endpoint}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(legacyAdminResponse.status, 401, `legacy Botly admin credential cannot access HealthClues admin endpoint: ${endpoint}`);
  }
  for (const endpoint of ["healthclues-quiz", "healthclues-discoveries", "healthclues-content", "healthclues-authoring", "healthclues-rewards"]) {
    const response = await fetch(`${appOrigin}/api/admin/${endpoint}`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
    assert.equal(response.status, 401, `Community moderator cannot access reviewer-only endpoint: ${endpoint}`);
  }
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-community`, { headers: { Authorization: `Bearer ${reviewerToken}` } })).status, 401, "reviewer credential cannot access moderator-only Community queue");
  const reviewerQueueResponse = await fetch(`${appOrigin}/api/admin/healthclues-content`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(reviewerQueueResponse.status, 200, "authorized reviewer can load Catalog, Clue and Boss candidates");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-content`, { headers: { Authorization: `Bearer ${moderatorToken}` } })).status, 401, "moderator credential cannot read the content review queue");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "POST", headers: { Authorization: `Bearer ${moderatorToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_v1_review_drafts" }) })).status, 401, "moderator credential cannot import reviewer drafts");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "POST", headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_v1_review_drafts" }) })).status, 401, "legacy admin credential cannot import reviewer drafts");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-community`, { headers: { Authorization: `Bearer ${reviewerToken}` } })).status, 401, "reviewer credential cannot read the Community moderation queue");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-content`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401, "legacy Botly admin credential cannot approve HealthClues content");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-community`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401, "legacy Botly admin credential cannot moderate HealthClues journeys");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-quiz`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401, "legacy Botly admin credential cannot access HealthClues quiz reviewer notes");
  const quizReviewPreview = await fetch(`${appOrigin}/api/admin/healthclues-quiz`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(quizReviewPreview.status, 200, "separate HealthClues reviewer can access the quiz preview");
  assert.ok((await quizReviewPreview.json()).questions.some(question => question.id === "C01" && question.note_vi), "reviewer preview includes the internal question note");
  const diagnosticsByReviewer = await fetch(`${appOrigin}/api/admin/healthclues-diagnostics`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(diagnosticsByReviewer.status, 200, "reviewer can access aggregate diagnostics");
  const diagnosticsPayload = await diagnosticsByReviewer.json();
  assert.ok(diagnosticsPayload.checkedAt && Object.values(diagnosticsPayload.queues).every(Number.isInteger), "diagnostics returns queue counts and a timestamp");
  assert.deepEqual(Object.keys(diagnosticsPayload).sort(), ["checkedAt", "queues"], "diagnostics exposes only aggregate operational fields");
  const diagnosticsByModerator = await fetch(`${appOrigin}/api/admin/healthclues-diagnostics`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
  assert.equal(diagnosticsByModerator.status, 200, "moderator can access aggregate operational diagnostics");
  const moderatorDiagnosticsPayload = await diagnosticsByModerator.json();
  assert.deepEqual(Object.keys(moderatorDiagnosticsPayload).sort(), ["checkedAt", "queues"], "moderator diagnostics expose aggregate fields only");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-diagnostics`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401, "legacy Botly admin credential cannot read HealthClues diagnostics");
  const reviewerQueue = await reviewerQueueResponse.json();
  assert.ok(Array.isArray(reviewerQueue.catalog) && Array.isArray(reviewerQueue.clues) && Array.isArray(reviewerQueue.bosses));
  const draftImportHeaders = { Authorization: `Bearer ${reviewerToken}`, "Content-Type": "application/json" };
  const sourceDraftImport = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "POST", headers: draftImportHeaders, body: JSON.stringify({ action: "import_v1_review_drafts" }) });
  assert.equal(sourceDraftImport.status, 200, "dedicated reviewer can import the bundled source-linked candidate drafts");
  const sourceDraftImportResult = await sourceDraftImport.json();
  const importedCounts = sourceDraftImportResult.result;
  assert.equal(importedCounts.inserted + importedCounts.skipped_existing_drafts, 6, "import creates or reuses all six reviewer drafts");
  assert.equal(importedCounts.published, false);
  assert.equal(importedCounts.review_status, "needs_review");
  const sourceDraftRetry = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "POST", headers: draftImportHeaders, body: JSON.stringify({ action: "import_v1_review_drafts" }) });
  assert.equal(sourceDraftRetry.status, 200);
  const sourceDraftRetryResult = await sourceDraftRetry.json();
  assert.equal(sourceDraftRetryResult.result.inserted, 0, "draft import retry is idempotent");
  assert.equal(sourceDraftRetryResult.result.skipped_existing_drafts, 6);
  const sourceDraftRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_knowledge_clues?clue_id=in.(hc-v1-sleep-clue,hc-v1-calm-clue,hc-v1-nutrition-clue)&select=clue_id,review_status,published,reviewed_by,reviewed_at`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(sourceDraftRows.length, 3);
  assert.ok(sourceDraftRows.every(row => row.review_status === "needs_review" && row.published === false && row.reviewed_by === null && row.reviewed_at === null), "imported clues remain unpublished and unreviewed");
  const anonymousDraftRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_knowledge_clues?clue_id=in.(hc-v1-sleep-clue,hc-v1-calm-clue,hc-v1-nutrition-clue)&select=clue_id`, { headers: { apikey: anonToken, Authorization: `Bearer ${anonToken}` } })).json();
  assert.equal(anonymousDraftRows.length, 0, "anonymous public content surface excludes reviewer drafts");
  const authorQueueDenied = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
  assert.equal(authorQueueDenied.status, 401, "Community moderator cannot access reviewer draft authoring");
  const authorQueueResponse = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(authorQueueResponse.status, 200, "reviewer can load approved Catalog choices and existing drafts");
  const authorQueue = await authorQueueResponse.json();
  assert.ok(authorQueue.catalog.some(item => item.id === itemIds[4]) && authorQueue.recipes.some(item => item.id === itemIds[5]), "draft authoring exposes only approved active Catalog versions");
  const draftHeaders = { Authorization: `Bearer ${reviewerToken}`, "Content-Type": "application/json" };
  const draftReason = "Synthetic E2E draft authoring.";
  const methodDraft = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { method: "POST", headers: draftHeaders, body: JSON.stringify({ reason: draftReason, payload: { kind: "method", id: authorMethodId, slug: authorMethodId, name: "Synthetic method draft", instructions: ["Synthetic draft instruction."], estimatedMinutes: 5, safetyNotes: "Synthetic test note; not health guidance.", components: [{ catalogItemId: itemIds[0], version: 1, relationship: "contains", required: true }] } }) });
  assert.equal(methodDraft.status, 201, "reviewer can create a versioned Method draft from reviewed Catalog components");
  assert.deepEqual(await methodDraft.json(), { draft: { kind: "method", id: authorMethodId, version: 1, review_status: "draft", active: false } }, "new Method remains unpublished and inactive");
  const recipeComboDraft = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { method: "POST", headers: draftHeaders, body: JSON.stringify({ reason: draftReason, payload: { kind: "recipe_combo", id: authorRecipeComboId, name: "Synthetic recipe combo draft", recipeItemId: itemIds[5], recipeItemVersion: 1, methodId: authorMethodId, methodVersion: 1 } }) });
  assert.equal(recipeComboDraft.status, 201, "reviewer can link a Recipe Combo draft to a recipe and a versioned Method draft");
  const journeyComboDraft = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { method: "POST", headers: draftHeaders, body: JSON.stringify({ reason: draftReason, payload: { kind: "journey_combo", id: authorJourneyComboId, name: "Synthetic journey combo draft", rationale: "Test a cross-slot draft only.", components: [{ catalogItemId: itemIds[0], version: 1, slotKey: "consume" }, { catalogItemId: itemIds[1], version: 1, slotKey: "reduce" }, { catalogItemId: itemIds[2], version: 1, slotKey: "practice" }] } }) });
  assert.equal(journeyComboDraft.status, 201, "reviewer can create a cross-slot Journey Combo draft");
  const contentQueueWithDrafts = await (await fetch(`${appOrigin}/api/admin/healthclues-content`, { headers: { Authorization: `Bearer ${reviewerToken}` } })).json();
  assert.ok(contentQueueWithDrafts.methods.some(item => item.id === authorMethodId) && contentQueueWithDrafts.recipeCombos.some(item => item.id === authorRecipeComboId) && contentQueueWithDrafts.journeyCombos.some(item => item.id === authorJourneyComboId), "review queue includes each newly authored draft with its versioned relations");
  const invalidDraftComponent = await fetch(`${appOrigin}/api/admin/healthclues-authoring`, { method: "POST", headers: draftHeaders, body: JSON.stringify({ reason: draftReason, payload: { kind: "journey_combo", id: `invalid-${randomUUID()}`, name: "Invalid combo draft", components: [{ catalogItemId: itemIds[0], version: 1, slotKey: "practice" }] } }) });
  assert.equal(invalidDraftComponent.status, 422, "draft authoring refuses a component in the wrong equipment slot");
  const createdDraftRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_usage_methods?id=eq.${authorMethodId}&select=review_status,active,current_version`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.deepEqual(createdDraftRows[0], { review_status: "draft", active: false, current_version: 1 }, "authoring persists only inactive draft state");
  const createdDraftAudit = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?action=eq.content_draft_create&entity_id=in.(${authorMethodId}:v1,${authorRecipeComboId}:v1,${authorJourneyComboId}:v1)&select=entity_id,actor_type,metadata,reason`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(createdDraftAudit.length, 3, "each created Method/Combo draft writes an audit row");
  assert.ok(createdDraftAudit.every(row => row.actor_type === "reviewer" && row.reason === draftReason && row.metadata.review_status === "draft"), "draft audit identifies reviewer and non-published status");
  const unauthorizedReminderJob = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(unauthorizedReminderJob.status, 401, "mock reminder worker must reject unauthenticated requests");
  const unauthorizedRetentionJob = await fetch(`${appOrigin}/api/internal/healthclues-retention`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(unauthorizedRetentionJob.status, 401, "retention worker must reject unauthenticated requests");
  const optOut = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: false, timezone: "Asia/Bangkok", localSendTime: "00:00", frequency: "daily" }) });
  assert.equal(optOut.status, 200, "user can explicitly keep reminders opted out");
  const consentRequired = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: true, timezone: "Asia/Bangkok", localSendTime: "00:00", frequency: "daily" }) });
  assert.equal(consentRequired.status, 422, "reminder opt-in requires explicit consent");
  for (const invalidSchedule of [
    { action: "save", optedIn: true, consentConfirmed: true, timezone: "Moon/Base", localSendTime: "08:00", frequency: "daily" },
    { action: "save", optedIn: true, consentConfirmed: true, timezone: "Asia/Bangkok", localSendTime: "24:60", frequency: "daily" },
    { action: "save", optedIn: true, consentConfirmed: true, timezone: "Asia/Bangkok", localSendTime: "08:00", frequency: "hourly" },
  ]) {
    const invalidResponse = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(invalidSchedule) });
    assert.equal(invalidResponse.status, 400, "invalid timezone, local time, or reminder frequency is rejected");
  }
  const optIn = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: true, consentConfirmed: true, timezone: "Asia/Bangkok", localSendTime: "00:00", frequency: "daily" }) });
  assert.equal(optIn.status, 200, "consented reminder schedule saves");
  const workerHeaders = { Authorization: `Bearer ${reminderJobToken}`, "Content-Type": "application/json" };
  const runAt = new Date().toISOString();
  const failedReminderRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt, simulateTransientFailure: true }) });
  assert.equal(failedReminderRun.status, 200, "isolated mock provider can exercise a transient delivery failure");
  assert.equal((await failedReminderRun.json()).failed, 1);
  const failureHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(failureHistory.deliveries[0].state, "failed");
  const beforeRetryRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: new Date(Date.parse(runAt) + 4 * 60_000).toISOString() }) });
  assert.equal((await beforeRetryRun.json()).sent, 0, "worker does not retry before the retry schedule");
  const retryRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: new Date(Date.parse(runAt) + 5 * 60_000).toISOString() }) });
  assert.equal(retryRun.status, 200);
  const reminderResult = await retryRun.json();
  assert.equal(reminderResult.provider, "mock");
  assert.equal(reminderResult.requeued, 1);
  assert.equal(reminderResult.sent, 1, "only the opted-in member receives the retried mock delivery");
  const reminderHistoryResponse = await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  const reminderHistory = await reminderHistoryResponse.json();
  assert.equal(reminderHistory.deliveries.length, 1);
  assert.equal(reminderHistory.deliveries[0].state, "sent");
  assert.equal(reminderHistory.deliveries[0].attempts, 2, "retry history records both provider attempts");
  assert.equal(reminderHistory.deliveries[0].template_key, "healthclues-daily-journey-v1", "delivery history exposes only the generic reminder template key");
  assert.equal(Object.keys(reminderHistory.deliveries[0]).some(key => /email|health|body|payload/i.test(key)), false, "delivery history contains no recipient or personal health payload");
  const duplicateReminderRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt }) });
  assert.equal((await duplicateReminderRun.json()).sent, 0, "rerunning the same local date does not duplicate a reminder");
  const pendingFailureRunAt = new Date(Date.parse(runAt) + 86400_000).toISOString();
  const pendingFailureRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: pendingFailureRunAt, simulateTransientFailure: true }) });
  assert.equal((await pendingFailureRun.json()).failed, 1, "next-day mock delivery can enter a scheduled retry state");
  const unsubscribe = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsubscribe" }) });
  assert.equal(unsubscribe.status, 200);
  const unsubscribedPreference = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(unsubscribedPreference.preference.opted_in, false, "unsubscribe clears the active opt-in");
  const firstConsentAt = reminderHistory.preference.consented_at;
  await new Promise(resolve => setTimeout(resolve, 20));
  const renewedConsent = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: true, consentConfirmed: true, timezone: "Asia/Bangkok", localSendTime: "00:00", frequency: "daily" }) });
  assert.equal(renewedConsent.status, 200, "a user may explicitly opt in again after unsubscribing");
  const renewedPreference = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(renewedPreference.preference.opted_in, true);
  assert.notEqual(renewedPreference.preference.consented_at, firstConsentAt, "a renewed opt-in records a fresh consent timestamp");
  const finalUnsubscribe = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "unsubscribe" }) });
  assert.equal(finalUnsubscribe.status, 200, "test account returns to an unsubscribed state after consent verification");
  const afterUnsubscribeRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: new Date(Date.now() + 86400_000).toISOString() }) });
  assert.equal((await afterUnsubscribeRun.json()).queued, 0, "unsubscribe prevents future queue creation");
  const afterUnsubscribeHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(afterUnsubscribeHistory.deliveries.find(item => item.local_date !== reminderHistory.deliveries[0].local_date)?.state, "canceled", "unsubscribe cancels a previously failed retry as well as queued deliveries");
  const optInRetryExhaustion = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: true, consentConfirmed: true, timezone: "Asia/Bangkok", localSendTime: "00:00", frequency: "daily" }) });
  assert.equal(optInRetryExhaustion.status, 200);
  const exhaustionRunAt = Date.parse(runAt) + 3 * 86400_000;
  for (const failedAttempt of [0, 1, 2]) {
    const failAt = new Date(exhaustionRunAt + failedAttempt * 5 * 60_000).toISOString();
    const failedRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: failAt, simulateTransientFailure: true }) });
    assert.equal(failedRun.status, 200);
  }
  const exhaustedRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: new Date(exhaustionRunAt + 15 * 60_000).toISOString() }) });
  const exhaustedResult = await exhaustedRun.json();
  assert.equal(exhaustedResult.requeued, 0);
  assert.equal(exhaustedResult.sent, 0, "delivery is not retried after the bounded attempt limit");
  const exhaustedHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(exhaustedHistory.deliveries[0].state, "failed");
  assert.equal(exhaustedHistory.deliveries[0].attempts, 3, "retry exhaustion records the fixed attempt limit");
  const weeklyOptIn = await fetch(`${appOrigin}/api/healthclues/reminders`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", optedIn: true, consentConfirmed: true, timezone: "America/New_York", localSendTime: "00:00", frequency: "weekly" }) });
  assert.equal(weeklyOptIn.status, 200, "weekly reminder supports a valid second timezone");
  const mondayAt = nextLocalMondayHalfHour("America/New_York");
  const sundayAt = new Date(mondayAt.getTime() - 60 * 60_000);
  const sundayRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: sundayAt.toISOString() }) });
  assert.equal(sundayRun.status, 200);
  const sundayHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenC}` } })).json();
  assert.equal(sundayHistory.deliveries.length, 0, "weekly schedule does not queue on Sunday before the local Monday boundary");
  const mondayRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: mondayAt.toISOString() }) });
  assert.equal(mondayRun.status, 200);
  const mondayHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenC}` } })).json();
  assert.equal(mondayHistory.deliveries.length, 1, "weekly reminder queues on the next local Monday after the DST boundary");
  assert.equal(mondayHistory.deliveries[0].state, "sent");
  assert.equal(mondayHistory.deliveries[0].local_date, new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(mondayAt), "delivery history uses the selected timezone's local date");
  const duplicateWeeklyRun = await fetch(`${appOrigin}/api/internal/healthclues-reminders`, { method: "POST", headers: workerHeaders, body: JSON.stringify({ runAt: mondayAt.toISOString() }) });
  assert.equal((await duplicateWeeklyRun.json()).sent, 0, "weekly local-date rerun remains deduplicated");
  const catalogResponse = await fetch(`${appOrigin}/api/healthclues/catalog`);
  if (catalogResponse.status !== 200) throw new Error(`Catalog request failed: ${await catalogResponse.text()}`);
  const catalog = await catalogResponse.json();
  assert.deepEqual(new Set(catalog.items.map(item => item.slot)), new Set(["consume", "reduce", "practice"]));
  assert.equal(catalog.items.filter(item => itemIds.includes(item.id)).length, 6, "the isolated catalog fixtures are all available");
  const consumeToolCount = catalog.items.filter(item => item.slot === "consume").length;

  const requestKey = randomUUID();
  const chosen = ["consume", "reduce", "practice"].map(slot => { const item = catalog.items.find(candidate => candidate.slot === slot); return { catalogItemId: item.id, itemVersion: item.version, slot }; });
  const savedBeforeWorld = catalog.items.find(item => item.slot === "practice" && item.id !== chosen.find(selection => selection.slot === "practice").catalogItemId);
  const collectBeforeWorld = await fetch(`${appOrigin}/api/healthclues/world/collection`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ catalogItemId: savedBeforeWorld.id, itemVersion: savedBeforeWorld.version }) });
  if (collectBeforeWorld.status !== 200) throw new Error(`Add to Collection failed (${collectBeforeWorld.status}): ${await collectBeforeWorld.text()}`);
  const duplicateCollectionSave = await fetch(`${appOrigin}/api/healthclues/world/collection`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ catalogItemId: savedBeforeWorld.id, itemVersion: savedBeforeWorld.version }) });
  assert.equal(duplicateCollectionSave.status, 200, "saving an existing item is idempotent");
  const emptyOwnerState = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(emptyOwnerState.world, null);
  assert.ok(emptyOwnerState.collection.some(item => item.catalog_item_id === savedBeforeWorld.id), "a user can save a reviewed item before creating a World");
  assert.equal(emptyOwnerState.collection.filter(item => item.catalog_item_id === savedBeforeWorld.id).length, 1, "duplicate saves do not create duplicate collection rows");
  for (const lockedRegion of ["feel-calmer", "more-energy", "eat-healthier", "move-more", "healthy-weight", "natural-wellness"]) {
    const lockedJourney = await fetch(`${appOrigin}/api/healthclues/world`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestKey: randomUUID(), topicKey: lockedRegion, title: "Locked region test", timezone: "Asia/Bangkok", startedOn: "2026-10-27", selections: [] }) });
    assert.equal(lockedJourney.status, 403, `${lockedRegion} stays visible but cannot create a journey before release`);
  }
  const worldResponse = await fetch(`${appOrigin}/api/healthclues/world`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestKey, topicKey: "sleep-better", title: "Sleep Better", timezone: "Asia/Bangkok", startedOn: "2026-10-27", selections: chosen }) });
  if (worldResponse.status !== 201) throw new Error(`World creation failed (${worldResponse.status}): ${await worldResponse.text()}`);
  const world = await worldResponse.json();
  const bindReviewedRecipeMethod = await fetch(`${supabaseOrigin}/rest/v1/healthclues_toolkit_entries?user_id=eq.${userA}&world_id=eq.${world.world_id}&catalog_item_id=eq.${itemIds[0]}`, { method: "PATCH", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ method_id: methodId, method_version: 1 }) });
  assert.equal(bindReviewedRecipeMethod.status, 200, "fixture attaches a reviewed recipe method to its equipped base item");
  assert.equal((await bindReviewedRecipeMethod.json()).length, 1);
  const retry = await fetch(`${appOrigin}/api/healthclues/world`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestKey, topicKey: "sleep-better", title: "Sleep Better", timezone: "Asia/Bangkok", startedOn: "2026-10-27", selections: chosen }) });
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).reused, true);
  const collectionEquipKey = randomUUID();
  const collectionEquip = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId: world.world_id, catalogItemId: savedBeforeWorld.id, itemVersion: savedBeforeWorld.version, requestKey: collectionEquipKey }) });
  if (collectionEquip.status !== 201) throw new Error(`Collection equip failed (${collectionEquip.status}): ${await collectionEquip.text()}`);
  const collectionEquipResult = await collectionEquip.json();
  const collectionEquipRetry = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ worldId: world.world_id, catalogItemId: savedBeforeWorld.id, itemVersion: savedBeforeWorld.version, requestKey: collectionEquipKey }) });
  assert.equal(collectionEquipRetry.status, 200, "Collection equip retries are idempotent");
  assert.equal((await collectionEquipRetry.json()).entry_id, collectionEquipResult.entry_id);
  const loaded = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(loaded.world.id, world.world_id);
  assert.equal(loaded.entries.length, 4, "World setup and one deliberate post-creation equip must be preserved");
  assert.equal(loaded.entries.every(entry => entry.status === "equipped"), true);

  const knowledgeBefore = await fetch(`${appOrigin}/api/healthclues/knowledge`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(knowledgeBefore.status, 200);
  const dailyKnowledge = await knowledgeBefore.json();
  assert.equal(dailyKnowledge.featured.clue_id, clueIds[0]);
  assert.equal(Object.hasOwn(dailyKnowledge.featured, "correct_option_id"), false, "the public clue response must not expose the answer key");
  const discoverPayload = { action: "discover", clueId: clueIds[0], version: 1 };
  const discoverOne = await fetch(`${appOrigin}/api/healthclues/knowledge`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(discoverPayload) });
  if (discoverOne.status !== 200) throw new Error(`Knowledge discovery failed (${discoverOne.status}): ${await discoverOne.text()}`);
  assert.equal((await discoverOne.json()).discovered, true);
  const discoverRetry = await fetch(`${appOrigin}/api/healthclues/knowledge`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(discoverPayload) });
  assert.equal((await discoverRetry.json()).discovered, false, "replaying a clue does not repeat discovery or XP");
  const wrongKnowledge = await fetch(`${appOrigin}/api/healthclues/knowledge`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "answer", clueId: clueIds[0], version: 1, selectedOptionId: "wrong", idempotencyKey: randomUUID() }) });
  assert.equal((await wrongKnowledge.json()).correct, false, "server marks the incorrect answer");
  const answerKey = randomUUID();
  const rightPayload = { action: "answer", clueId: clueIds[0], version: 1, selectedOptionId: "right", idempotencyKey: answerKey };
  const rightKnowledge = await fetch(`${appOrigin}/api/healthclues/knowledge`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(rightPayload) });
  assert.equal((await rightKnowledge.json()).correct, true);
  const rightRetry = await fetch(`${appOrigin}/api/healthclues/knowledge`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(rightPayload) });
  assert.equal((await rightRetry.json()).reused, true, "answer retry uses the recorded result");
  const knowledgeAfter = await (await fetch(`${appOrigin}/api/healthclues/knowledge`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(knowledgeAfter.featuredDiscovered, true);
  assert.equal(knowledgeAfter.book.length, 1);
  assert.equal(knowledgeAfter.book[0].attempts.length, 2);
  const bossBefore = await fetch(`${appOrigin}/api/healthclues/boss`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(bossBefore.status, 200);
  const bossPayload = await bossBefore.json();
  assert.equal(bossPayload.boss.boss_id, bossIds[0]);
  assert.equal(Object.hasOwn(bossPayload.boss, "correct_option_id"), false, "Boss answer key is never returned before an attempt");
  const bossWrong = await fetch(`${appOrigin}/api/healthclues/boss`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ bossId: bossIds[0], version: 1, selectedOptionId: "wrong", idempotencyKey: randomUUID() }) });
  assert.equal((await bossWrong.json()).correct, false, "incorrect Boss answer has feedback and can be retried");
  const bossClearKey = randomUUID();
  const bossCorrectPayload = { bossId: bossIds[0], version: 1, selectedOptionId: "right", idempotencyKey: bossClearKey };
  const bossClearResponses = await Promise.all([1, 2].map(() => fetch(`${appOrigin}/api/healthclues/boss`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(bossCorrectPayload) })));
  const bossClearResults = await Promise.all(bossClearResponses.map(response => response.json()));
  assert.deepEqual(bossClearResponses.map(response => response.status), [200, 200], "concurrent identical Boss answers both resolve successfully");
  assert.ok(bossClearResults.every(result => result.correct === true), "both concurrent Boss responses return the recorded correct answer");
  assert.equal(bossClearResults.filter(result => result.reward_granted === true).length, 1, "concurrent identical Boss answers grant the first-clear reward once");
  assert.equal(bossClearResults.filter(result => result.reused === true).length, 1, "the losing concurrent Boss request reuses the idempotent attempt");
  const bossAttemptRowsResponse = await fetch(`${supabaseOrigin}/rest/v1/healthclues_boss_attempts?user_id=eq.${userA}&idempotency_key=eq.${bossClearKey}&select=id,user_id,boss_id,boss_version,selected_option_id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
  const bossAttemptRows = await bossAttemptRowsResponse.json();
  assert.equal(bossAttemptRowsResponse.status, 200);
  assert.equal(bossAttemptRows.length, 1, "concurrent identical Boss answers persist exactly one attempt row");
  assert.equal(bossAttemptRows[0].selected_option_id, "right");
  const bossClearResult = bossClearResults.find(result => result.reward_granted === true);
  assert.equal(bossClearResult.cosmetic_reward_id, "boss-keepsake-sleep-lantern", "Sleep Boss clear returns its fixed cosmetic keepsake");
  assert.equal(bossClearResult.cosmeticRewardTitle, "Sleep Valley Lantern", "Boss reward API returns the persisted definition title");
  const bossClearRetry = await fetch(`${appOrigin}/api/healthclues/boss`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(bossCorrectPayload) });
  assert.equal((await bossClearRetry.json()).reused, true, "later Boss retry reuses the recorded result and cannot duplicate the reward");
  const persistentBoss = await (await fetch(`${appOrigin}/api/healthclues/boss`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(persistentBoss.cleared, true, "the Boss clear persists after concurrent retries");
  const persistentUnlocks = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.ok(persistentUnlocks.unlocks.some(row => row.unlock_key === `${bossIds[0]}-path-open`), "Boss path unlock is stored on the World");
  assert.deepEqual(persistentUnlocks.knowledgeCurrencies, { fragments: 1, keys: 1 }, "a first Boss clear adds one persisted Knowledge Key without duplicating the earlier Clue Fragment");
  const comboResponse = await fetch(`${appOrigin}/api/healthclues/combos`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(comboResponse.status, 200);
  const combosPayload = await comboResponse.json();
  assert.equal(combosPayload.journeys.find(combo => combo.id === comboId).components.length, 3, "Journey Combo shows its reviewed cross-slot components");
  const recipeFixture = combosPayload.recipes.find(combo => combo.id === recipeComboId);
  assert.equal(recipeFixture.components.length, 2, "Recipe Combo connects its base Catalog ID to its ingredient ID");
  assert.deepEqual(recipeFixture.method.instructions, ["Use the isolated test ingredient only.", "Follow the synthetic test preparation step."]);

  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const journalCreate = await fetch(`${appOrigin}/api/healthclues/journal`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryDate: date, body: "private journal fixture" }) });
  const journalCreatePayload = await journalCreate.json();
  assert.equal(journalCreate.status, 201, `private Journal create failed: ${JSON.stringify(journalCreatePayload)}`);
  const journalEntry = journalCreatePayload.entry;
  const journalListA = await (await fetch(`${appOrigin}/api/healthclues/journal`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.ok(journalListA.entries.some(entry => entry.id === journalEntry.id && entry.body === "private journal fixture"));
  const journalEdit = await fetch(`${appOrigin}/api/healthclues/journal`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: journalEntry.id, entryDate: date, body: "edited private journal fixture" }) });
  const journalEditPayload = await journalEdit.json();
  assert.equal(journalEdit.status, 200, `private Journal edit failed: ${JSON.stringify(journalEditPayload)}`);
  assert.equal(journalEditPayload.entry.body, "edited private journal fixture");
  const journalListB = await (await fetch(`${appOrigin}/api/healthclues/journal`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(journalListB.entries.length, 0, "another member cannot read private Journal entries");
  const usage = loaded.entries.map(entry => ({ toolkitEntryId: entry.id, status: "done", occurrenceCount: entry.slot_key === "practice" ? 2 : null }));
  const checkinPayload = { worldId: world.world_id, localDate: date, timezone: "Asia/Bangkok", usages: usage, note: "private e2e note" };
  const spoofedCheckinTimezone = await fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...checkinPayload, timezone: "America/Los_Angeles" }) });
  assert.equal(spoofedCheckinTimezone.status, 409, "a check-in cannot change its World timezone by overriding a client field");
  const concurrentCheckins = await Promise.all([0, 1].map(() => fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify(checkinPayload) })));
  const concurrentResults = await Promise.all(concurrentCheckins.map(async response => ({ status: response.status, payload: await response.json() })));
  assert.ok(concurrentResults.every(result => result.status === 200), `concurrent daily check-in saves must both complete: ${JSON.stringify(concurrentResults)}`);
  assert.equal(new Set(concurrentResults.map(result => result.payload.checkin_id)).size, 1, "concurrent saves converge on one local-day check-in");
  assert.equal(concurrentResults.filter(result => result.payload.xp_awarded).length, 1, "concurrent duplicate saves award the fixed daily XP once");
  assert.equal(new Set(concurrentResults.map(result => result.payload.xp_total)).size, 1, "concurrent callers observe the same final XP total");
  const persistedCheckinTimezoneResponse = await fetch(`${supabaseOrigin}/rest/v1/healthclues_daily_checkins?id=eq.${concurrentResults[0].payload.checkin_id}&select=id,local_date,timezone`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
  const persistedCheckinTimezone = await persistedCheckinTimezoneResponse.json();
  assert.equal(persistedCheckinTimezoneResponse.status, 200);
  assert.deepEqual(persistedCheckinTimezone.map(row => row.timezone), ["Asia/Bangkok"], "the persisted historical check-in keeps its Wellness World timezone");
  const firstResult = concurrentResults.find(result => result.payload.xp_awarded)?.payload ?? concurrentResults[0].payload;
  const checkinTwo = await fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ ...checkinPayload, usages: usage.map(row => ({ ...row, occurrenceCount: 4 })) }) });
  assert.equal(checkinTwo.status, 200);
  const secondResult = await checkinTwo.json();
  assert.equal(secondResult.xp_awarded, false, "editing a check-in must not award duplicate XP");
  assert.equal(secondResult.xp_total, firstResult.xp_total);
  const sharedCatalogId = chosen.find(item => item.slot === "consume").catalogItemId;
  const reminderConsentBeforeCommunityShare = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(reminderConsentBeforeCommunityShare.preference.opted_in, false, "community sharing begins from the explicitly unsubscribed reminder state");
  const shareResponse = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "share", journeyId: world.journey_id, alias: "Pathfinder A", title: "Public Sleep Trail", publicTopics: ["sleep-better"], catalogItemIds: [sharedCatalogId], methodIds: [methodId], shareTimeline: true, shareFrequency: true, shareReflections: false }) });
  const sharePayload = await shareResponse.json();
  assert.equal(shareResponse.status, 201, `explicit public projection failed: ${JSON.stringify(sharePayload)}`);
  const reminderConsentAfterCommunityShare = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(reminderConsentAfterCommunityShare.preference.opted_in, reminderConsentBeforeCommunityShare.preference.opted_in, "community-sharing consent does not subscribe the user to reminders");
  const publicJourneyId = sharePayload.publicJourneyId;
  const ownerShareView = await (await fetch(`${appOrigin}/api/healthclues/community?mine=1`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  const ownerShareRow = ownerShareView.journeys.find(item => item.id === publicJourneyId);
  assert.equal(ownerShareRow?.status, "active", "the owner can inspect their own active sharing state");
  assert.equal(JSON.stringify(ownerShareRow).includes("private e2e note"), false, "the owner's share-management view does not include private reflections");
  const communityMatch = await fetch(`${appOrigin}/api/healthclues/community?catalogItemId=${encodeURIComponent(sharedCatalogId)}`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  const communityPayload = await communityMatch.json();
  assert.equal(communityMatch.status, 200);
  const ownPublicProjection = communityPayload.journeys.find(item => item.id === publicJourneyId);
  const usageMethodMatch = await fetch(`${appOrigin}/api/healthclues/community?usageMethodId=${encodeURIComponent(methodId)}`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(usageMethodMatch.status, 200);
  assert.ok((await usageMethodMatch.json()).journeys.some(item => item.id === publicJourneyId), "Community matching supports the explicitly shared Usage Method ID");
  assert.ok(ownPublicProjection.sharedTools.some(item => item.catalogItemId === sharedCatalogId && item.timeline?.length), "only the selected Catalog ID and opted-in structured timeline are projected");
  assert.equal(JSON.stringify(ownPublicProjection).includes("private e2e note"), false, "private check-in and Journal prose must not enter a public projection");
  const dayDetail = await fetch(`${appOrigin}/api/healthclues/world/checkin/detail?worldId=${world.world_id}&date=${date}`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(dayDetail.status, 200);
  assert.equal((await dayDetail.json()).checkin.note_private, "private e2e note");
  const practiceEntry = loaded.entries.find(entry => entry.slot_key === "practice");
  const replacement = catalog.items.find(item => item.slot === "practice" && item.id !== practiceEntry.catalog_item_id);
  const pause = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: practiceEntry.id, action: "pause" }) });
  if (pause.status !== 200) throw new Error(`Tool pause failed (${pause.status}): ${await pause.text()}`);
  const resume = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: practiceEntry.id, action: "resume" }) });
  if (resume.status !== 200) throw new Error(`Tool resume failed (${resume.status}): ${await resume.text()}`);
  const schedule = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: practiceEntry.id, action: "schedule", schedule: { frequency: "daily", time: "08:00", timezone: "Asia/Bangkok" } }) });
  if (schedule.status !== 200) throw new Error(`Tool schedule failed (${schedule.status}): ${await schedule.text()}`);
  const scheduledWorld = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(scheduledWorld.entries.find(entry => entry.id === practiceEntry.id).schedule.time, "08:00");
  const replace = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: practiceEntry.id, action: "replace", catalogItemId: replacement.id, itemVersion: replacement.version }) });
  if (replace.status !== 200) throw new Error(`Tool replacement failed (${replace.status}): ${await replace.text()}`);
  const afterReplacement = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(afterReplacement.entries.find(entry => entry.id === practiceEntry.id).status, "archived");
  assert.ok(afterReplacement.entries.some(entry => entry.id !== practiceEntry.id && entry.catalog_item_id === replacement.id && entry.status === "equipped"));
  assert.ok(afterReplacement.usage.some(record => record.toolkit_entry_id === practiceEntry.id), "replacing a tool must preserve its previous usage history");
  assert.deepEqual(new Set(afterReplacement.entryEvents.filter(event => event.toolkit_entry_id === practiceEntry.id).map(event => event.event_type)), new Set(["paused", "resumed", "scheduled", "replaced"]), "Toolkit lifecycle events must be append-only and owner-readable");
  const crossUserPause = await fetch(`${appOrigin}/api/healthclues/world/toolkit`, { method: "PATCH", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: practiceEntry.id, action: "pause" }) });
  assert.equal(crossUserPause.status, 409, "another member cannot change someone else's Toolkit entry");
  const otherUserWorld = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(otherUserWorld.world, null, "another member cannot see this World");
  assert.equal(otherUserWorld.collection.length, 0, "another member cannot see the owner's My Collection rows");
  assert.deepEqual(otherUserWorld.knowledgeCurrencies, { fragments: 0, keys: 0 }, "knowledge collectibles stay isolated by user and World");
  const otherUserKnowledge = await (await fetch(`${appOrigin}/api/healthclues/knowledge`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(otherUserKnowledge.book.length, 0, "another member cannot see the owner's Knowledge Book history");
  const otherUserBoss = await (await fetch(`${appOrigin}/api/healthclues/boss`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(otherUserBoss.world, null, "another member cannot see the owner's Boss state");
  const otherUserDetail = await fetch(`${appOrigin}/api/healthclues/world/checkin/detail?worldId=${world.world_id}&date=${date}`, { headers: { Authorization: `Bearer ${userTokenB}` } });
  assert.equal((await otherUserDetail.json()).checkin, null, "another member cannot read private check-in notes");
  const ownerReminderHistory = await (await fetch(`${appOrigin}/api/healthclues/reminders`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.ok(ownerReminderHistory.deliveries.every(delivery => !Object.hasOwn(delivery, "user_id")), "reminder history projection contains no account identifier");
  assert.ok(ownerReminderHistory.deliveries.every(delivery => delivery.state !== "failed"), "member A cannot see member B's failed reminder deliveries");
  assert.equal(ownerReminderHistory.preference.timezone, "Asia/Bangkok", "reminder preferences are scoped to the requesting owner");
  const noDateFakes = await fetch(`${appOrigin}/api/healthclues/world/checkin/detail?worldId=${world.world_id}&date=${date}`);
  assert.equal(noDateFakes.status, 401);
  const noEquipmentWorld = await fetch(`${appOrigin}/api/healthclues/world`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestKey: randomUUID(), topicKey: "health-concern", title: "Explore at My Pace", timezone: "America/New_York", startedOn: "2025-11-02", selections: [] }) });
  assert.equal(noEquipmentWorld.status, 201, "a member can create a World without equipment");
  const noEquipmentLoaded = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenC}` } })).json();
  assert.ok(noEquipmentLoaded.world);
  assert.equal(noEquipmentLoaded.entries.length, 0);
  const localParts = (instant, zone) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(instant).map(part => [part.type, part.value]));
  const fallBackFirst = localParts(new Date("2025-11-02T05:30:00Z"), "America/New_York");
  const fallBackSecond = localParts(new Date("2025-11-02T06:30:00Z"), "America/New_York");
  assert.equal(`${fallBackFirst.year}-${fallBackFirst.month}-${fallBackFirst.day}`, "2025-11-02");
  assert.equal(`${fallBackSecond.year}-${fallBackSecond.month}-${fallBackSecond.day}`, "2025-11-02");
  assert.equal(fallBackFirst.hour, "01");
  assert.equal(fallBackSecond.hour, "01", "the repeated fall-back hour remains within the same local calendar date");
  const springBeforeJump = localParts(new Date("2026-03-08T06:30:00Z"), "America/New_York");
  const springAfterJump = localParts(new Date("2026-03-08T07:30:00Z"), "America/New_York");
  assert.equal(`${springBeforeJump.year}-${springBeforeJump.month}-${springBeforeJump.day}`, "2026-03-08");
  assert.equal(`${springAfterJump.year}-${springAfterJump.month}-${springAfterJump.day}`, "2026-03-08");
  assert.deepEqual([springBeforeJump.hour, springAfterJump.hour], ["01", "03"], "the spring-forward skipped hour does not change the local date key");
  const dstCheckinIds = [];
  for (const dstDate of ["2025-11-02", "2026-03-08"]) {
    const dstPayload = { worldId: noEquipmentLoaded.world.id, localDate: dstDate, timezone: "America/New_York", usages: [], reflection: "DST calendar-boundary E2E fixture." };
    const concurrentDst = await Promise.all([0, 1].map(() => fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify(dstPayload) })));
    const dstResults = await Promise.all(concurrentDst.map(async response => ({ status: response.status, payload: await response.json() })));
    assert.ok(dstResults.every(result => result.status === 200), `DST local-day saves succeed: ${JSON.stringify(dstResults)}`);
    assert.equal(new Set(dstResults.map(result => result.payload.checkin_id)).size, 1, `${dstDate} DST duplicate requests resolve to one check-in`);
    assert.equal(dstResults.filter(result => result.payload.xp_awarded).length, 1, `${dstDate} DST duplicate requests award XP once`);
    dstCheckinIds.push(dstResults[0].payload.checkin_id);
    const dstRowResponse = await fetch(`${supabaseOrigin}/rest/v1/healthclues_daily_checkins?id=eq.${dstResults[0].payload.checkin_id}&select=id,local_date,timezone`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
    const dstRows = await dstRowResponse.json();
    assert.equal(dstRowResponse.status, 200);
    assert.deepEqual(dstRows.map(row => ({ local_date: row.local_date, timezone: row.timezone })), [{ local_date: dstDate, timezone: "America/New_York" }], `${dstDate} saves one row with the World timezone`);
    const dstRetry = await fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify(dstPayload) });
    assert.equal(dstRetry.status, 200);
    assert.equal((await dstRetry.json()).xp_awarded, false, `${dstDate} sequential DST retry cannot award duplicate XP`);
  }
  assert.equal(new Set(dstCheckinIds).size, 2, "fall and spring DST transitions retain distinct local-date check-ins");

  const browserDir = mkdtempSync(path.join(tempSqlDir, "chrome-profile-"));
  const chromePath = [path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
  assert.ok(chromePath, "Chrome is required for the local browser test.");
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${browserDebugPort}`, "--remote-allow-origins=*", `--user-data-dir=${browserDir}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { target = await (await fetch(`http://127.0.0.1:${browserDebugPort}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch { /* Wait for headless Chrome. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(target?.webSocketDebuggerUrl, "Chrome DevTools endpoint was not ready.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => { const message = JSON.parse(event.data); if (message.method === "Network.requestWillBeSent" && message.params.request.url.startsWith(appOrigin)) browserRequests.push({ url: message.params.request.url, type: message.params.type, id: message.params.requestId }); if (message.method === "Network.responseReceived" && message.params.response.url.startsWith(appOrigin)) browserRequests.push({ url: message.params.response.url, type: message.params.type, status: message.params.response.status }); if (message.method === "Runtime.exceptionThrown") browserExceptions.push(message.params.exceptionDetails); if (message.method === "Network.loadingFailed") browserFailures.push(message.params); if (message.id && pending.has(message.id)) { const resolve = pending.get(message.id); pending.delete(message.id); resolve(message); } });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
  const reportDir = path.join(root, "App", "reports"); mkdirSync(reportDir, { recursive: true });
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${appOrigin}/play` });
  await waitForText("Your Wellness Adventure Begins Here");
  await screenshotDesktopAndMobile("healthclues-welcome", "main");
  await clickButtonContaining("START ADVENTURE");
  await waitForText("Two adventures are open");
  await screenshotDesktopAndMobile("healthclues-quest", "main");
  assert.equal(await evaluate("document.querySelectorAll('button[disabled][aria-disabled=true]').length"), 6, "Six regions must be visible as unavailable while the two approved adventures remain open");
  for (const questName of ["Sleep Valley", "HealthClues Realm"]) {
    await clickButtonContaining(questName);
    await waitForText("Question 1 of 10");
    assert.equal(await evaluate(`sessionStorage.getItem('healthclues-selected-quest') === ${JSON.stringify(({ "Sleep Valley": "sleep-better", "HealthClues Realm": "health-concern" })[questName])}`), true, `Quest ${questName} must be selectable and recorded`);
    assert.equal(await evaluate("!JSON.parse(sessionStorage.getItem('healthclues-quiz-draft-v1') || '{}').answers?.C04"), true, "Choosing a destination must leave the Discovery Quiz interest answer unset.");
    if (questName === "Sleep Valley") await screenshotDesktopAndMobile("healthclues-quiz", "main");
    await clickButton("Back");
    await waitForText("Two adventures are open");
  }
  await clickButtonContaining("Sleep Valley");
  await waitForText("Question 1 of 10");
  await waitForText("Are you 18 or older?");
  await clickButton("No");
  await clickButton("Next");
  await waitForText("Thanks for letting us know.");
  assert.equal(await evaluate("sessionStorage.getItem('healthclues_discovery_profile_v1') === null"), true, "underage flow must not persist a Discovery Profile");
  const underageProfileRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_profiles?user_id=eq.${userB}&select=user_id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.deepEqual(underageProfileRows, [], "underage flow leaves no saved profile row");
  await clickButton("Return");
  await clickButton("Begin My Adventure");
  await waitForText("Two adventures are open");
  await clickButtonContaining("Sleep Valley");
  await waitForText("Question 1 of 10");
  await clickButton("Skip");
  await waitForText("Explore at your own pace");
  assert.equal(await evaluate("sessionStorage.getItem('healthclues_discovery_profile_v1') === null"), true, "skipping the age gate must not create a profile");
  const unknownAgeProfileRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_profiles?user_id=eq.${userB}&select=user_id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.deepEqual(unknownAgeProfileRows, [], "unknown-age general path leaves no saved profile row");
  assert.equal(await evaluate("document.body.innerText.includes('personal profile or recommendations')"), true, "unknown age receives an explicit general-information path, not personalized recommendations");
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "General information screen fits desktop viewport");
  await screenshot(path.join(reportDir, "healthclues-general-content-age-skip-desktop.png"));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "General information screen fits mobile viewport");
  await screenshot(path.join(reportDir, "healthclues-general-content-age-skip-mobile.png"));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await clickButton("Start over");
  await waitForText("Two adventures are open");
  await clickButtonContaining("Sleep Valley");
  await waitForText("Question 1 of 10");
  await cdp("Page.reload");
  await waitForText("Question 1 of 10");
  await clickButton("Yes");
  await clickButton("Next");
  for (let question = 2; question <= 10; question++) {
    await waitForText(`Question ${question} of 10`);
    await clickButton("Skip");
  }
  await waitForText("Your adventure is ready!");
  await screenshotDesktopAndMobile("healthclues-results", "main");
  await clickButtonContaining("ENTER MY WELLNESS WORLD");
  await waitForText("Your Wellness World preview");
  await waitForText("READ-ONLY PREVIEW");
  assert.equal(await evaluate("document.body.innerText.includes('READ-ONLY PREVIEW')"), true, "guest World preview is explicitly read-only");
  const previewWorldRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_wellness_worlds?user_id=eq.${userB}&select=id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.deepEqual(previewWorldRows, [], "World preview does not create persistent World rows");
  await screenshotDesktopAndMobile("healthclues-world-preview", "main");
  await clickButton("START YOUR JOURNEY");
  await waitForText("Create Your Adventure");
  assert.equal(await evaluate("document.querySelector('[role=dialog]') !== null"), true, "activation is an overlay above the World preview");
  await screenshotDesktopAndMobile("healthclues-activation-overlay", '[role="dialog"]');
  await setInputValue("#hc-activation-email", emailB);
  await setCheckboxByLabel("I agree to save my HealthClues discovery profile", true);
  await clickButton("Send secure verification link");
  await waitForText("Check your email for the secure verification link.");
  await screenshotDesktopAndMobile("healthclues-verification-pending", '[role="dialog"]');
  assert.equal(mockActivationEmails.length, 1, "anonymous activation requests one isolated mock verification email");
  assert.equal(mockActivationEmails[0].email, emailB, "mock verification is sent only to the entered test identity");
  assert.ok(decodeURIComponent(mockActivationEmails[0].options.email_redirect_to).includes("/play?activation=complete"), "verification callback returns to the same game context");
  assert.equal(JSON.stringify(mockActivationEmails[0]).includes("Balanced nutrition"), false, "email request does not contain Quiz answers or profile data");
  const callbackUrl = `${appOrigin}/en/wellness/auth/callback?next=${encodeURIComponent("/play?activation=complete")}#access_token=${userTokenB}&refresh_token=isolated-test-refresh&expires_in=3600&token_type=bearer`;
  await cdp("Page.navigate", { url: callbackUrl });
  await waitForText("Prepare your backpack");
  await waitForText(`Explore ${consumeToolCount} reviewed tools`);
  await screenshotDesktopAndMobile("healthclues-toolkit", '[role="dialog"]');
  await clickButton(`Explore ${consumeToolCount} reviewed tools`);
  await waitForText("Choose your equipment");
  await clickButton("Add to My Collection");
  await waitForText("Added to My Collection");
  await clickButton("Equip this tool");
  await waitForText("1 of 3 starting slots equipped");
  await screenshot(path.join(reportDir, "healthclues-equipment-desktop.png"));
  await clickButton("START EXPLORING");
  await waitForText("Welcome back, Wayfinder");
  const firstWorldPayload = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  const firstWorldRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_wellness_worlds?user_id=eq.${userB}&select=id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(firstWorldRows.length, 1, "first entry creates exactly one World for the test player");
  await cdp("Page.navigate", { url: `${appOrigin}/play` });
  await waitForText("Welcome back, Wayfinder");
  const resumedWorldPayload = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  const resumedWorldRows = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_wellness_worlds?user_id=eq.${userB}&select=id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(resumedWorldPayload.world?.id, firstWorldPayload.world?.id, "/play resumes the same saved World");
  assert.equal(resumedWorldRows.length, 1, "/play resume does not create a duplicate World");
  await cdp("Page.navigate", { url: `${appOrigin}/en/wellness/healthclues/world` });
  await waitForText("Welcome back, Wayfinder");
  await waitForText("MY COLLECTION ≠ EQUIPPED TOOLKIT");
  await waitForText("Equipped in this World");
  await waitForText("Test Daily Journey Combo");
  await waitForText("Test recipe method");
  await waitForText("Synthetic test safety note; not health advice.");
  await waitForText("Public Sleep Trail");
  await waitForText("Daily Journey Reminder");
  await screenshotDesktopAndMobile("healthclues-game-shell-world", "#hc-world");
  await screenshotDesktopAndMobile("healthclues-toolkit-collection", "#hc-toolkit");
  await screenshotDesktopAndMobile("healthclues-knowledge", "#hc-knowledge");
  await screenshotDesktopAndMobile("healthclues-community", "#hc-community");
  assert.equal(await setCheckboxByLabel("Enable optional generic journey reminder emails.", true), true, "reminder opt-in control is available in the authenticated World");
  await waitForText("I consent to receive the generic reminder at the schedule above.");
  assert.equal(await setCheckboxByLabel("I consent to receive the generic reminder", true), true, "reminder consent control appears before opt-in save");
  let consentUpdated = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    consentUpdated = !(await evaluate("[...document.querySelectorAll('label')].some(node=>node.innerText.includes('I consent to receive the generic reminder'))"));
    if (consentUpdated) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(consentUpdated, true, "React applies the explicit reminder-consent choice before save");
  await clickButton("Save preference");
  await waitForText("Reminder preference saved.");
  await clickReminderButton("Pause");
  await waitForText("Reminders paused.");
  await clickReminderButton("Resume");
  await waitForText("Reminders resumed.");
  await clickReminderButton("Unsubscribe");
  await waitForText("Reminder emails unsubscribed.");
  await evaluate("document.querySelector('#hc-reminders-title')?.scrollIntoView({block:'start'})");
  await screenshot(path.join(reportDir, "healthclues-reminders-desktop.png"));
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await screenshot(path.join(reportDir, "healthclues-community-public-desktop.png"));
  await clickButton("Follow");
  await waitForText("Journey followed.");
  await clickButton("Start My Own Journey");
  await waitForText("Your own private journey has started from the shared topic.");
  const followedSearch = await (await fetch(`${appOrigin}/api/healthclues/community?catalogItemId=${encodeURIComponent(sharedCatalogId)}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  const followerProjection = followedSearch.journeys.find(item => item.id === publicJourneyId);
  assert.ok(followerProjection?.following, "member B can find and follow the explicit public Catalog match");
  assert.equal(JSON.stringify(followerProjection).includes("user_id"), false, "a follower sees only the owner's explicit public projection, not account identity fields");
  assert.equal(JSON.stringify(followerProjection).includes("private e2e note"), false, "a follower cannot read private Journal or check-in prose");
  const followerRevokeAttempt = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", publicJourneyId }) });
  assert.equal(followerRevokeAttempt.status, 403, "a follower cannot revoke another owner's public share");
  const stillSharedForFollower = await (await fetch(`${appOrigin}/api/healthclues/community?id=${publicJourneyId}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(stillSharedForFollower.journeys.length, 1, "a denied follower revoke leaves the owner's projection available");
  const followedMethodSearch = await (await fetch(`${appOrigin}/api/healthclues/community?usageMethodId=${encodeURIComponent(methodId)}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(followedMethodSearch.journeys.some(item => item.id === publicJourneyId), "member B can find the explicit public Usage Method match");
  const reportResponse = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", publicJourneyId, reasonCode: "privacy", details: "Synthetic privacy report fixture." }) });
  assert.equal(reportResponse.status, 201, "member can report an active public projection");
  const moderationQueueResponse = await fetch(`${appOrigin}/api/admin/healthclues-community`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
  assert.equal(moderationQueueResponse.status, 200, "authorized moderator can review the report queue");
  const moderationQueue = await moderationQueueResponse.json();
  const moderationItem = moderationQueue.reports.find(item => item.public_journey_id === publicJourneyId);
  assert.equal(moderationItem.status, "open");
  assert.equal(moderationItem.journey.alias, "Pathfinder A");
  const moderationAction = await fetch(`${appOrigin}/api/admin/healthclues-community`, { method: "PATCH", headers: { Authorization: `Bearer ${moderatorToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ reportId: moderationItem.id, action: "reviewing", reason: "Synthetic E2E moderator review." }) });
  assert.equal(moderationAction.status, 200, "moderator action updates report and audit log");
  const resolveReport = await fetch(`${appOrigin}/api/admin/healthclues-community`, { method: "PATCH", headers: { Authorization: `Bearer ${moderatorToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ reportId: moderationItem.id, action: "resolve", reason: "Synthetic E2E moderator review." }) });
  assert.equal(resolveReport.status, 200);
  assert.equal((await resolveReport.json()).status, "resolved", "moderator can resolve a reviewed report without removing its projection");
  const moderatorAuditIdentity = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_community_reports?id=eq.${moderationItem.id}&select=resolver_id`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(moderatorAuditIdentity[0]?.resolver_id, "healthclues_moderator_credential:HEALTHCLUES_MODERATOR_TOKEN", "Community audit identifies the distinct moderator role");
  const secondReportResponse = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenC}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", publicJourneyId, reasonCode: "other", details: "Second synthetic moderation fixture." }) });
  assert.equal(secondReportResponse.status, 201, "a separate member can submit a separate moderation report");
  const secondModerationQueue = await (await fetch(`${appOrigin}/api/admin/healthclues-community`, { headers: { Authorization: `Bearer ${moderatorToken}` } })).json();
  const secondModerationItem = secondModerationQueue.reports.find(item => item.public_journey_id === publicJourneyId && item.reason_code === "other");
  assert.ok(secondModerationItem);
  const dismissReport = await fetch(`${appOrigin}/api/admin/healthclues-community`, { method: "PATCH", headers: { Authorization: `Bearer ${moderatorToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ reportId: secondModerationItem.id, action: "dismiss", reason: "Synthetic E2E moderator review." }) });
  assert.equal(dismissReport.status, 200, "moderator can dismiss a reviewed report");
  const removeJourney = await fetch(`${appOrigin}/api/admin/healthclues-community`, { method: "PATCH", headers: { Authorization: `Bearer ${moderatorToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ reportId: moderationItem.id, action: "remove", reason: "Synthetic E2E moderator review." }) });
  assert.equal(removeJourney.status, 200, "moderator can remove a public projection after review");
  const removedForB = await (await fetch(`${appOrigin}/api/healthclues/community?id=${publicJourneyId}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(removedForB.journeys.length, 0, "moderated removal immediately hides the projection from community members");
  const copiedJourney = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(copiedJourney.branches.some(branch => branch.topic_key === "sleep-better"), "Start My Own creates a private branch without copying the source member's history");
  const revokeResponse = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", publicJourneyId }) });
  assert.equal(revokeResponse.status, 200);
  const revokedForB = await (await fetch(`${appOrigin}/api/healthclues/community?id=${publicJourneyId}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(revokedForB.journeys.length, 0, "revoke immediately removes the public projection from member B");
  assert.ok((await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json()).journeys.length >= 2, "member B retains the private journey they started");
  const crossJournalAttempt = await fetch(`${appOrigin}/api/healthclues/journal`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ entryId: journalEntry.id, entryDate: date, body: "cross-owner overwrite attempt" }) });
  assert.equal(crossJournalAttempt.status, 404, "a member with their own World cannot edit another owner's private Journal entry");
  const moderatorJournalRead = await fetch(`${appOrigin}/api/healthclues/journal`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
  assert.equal(moderatorJournalRead.status, 401, "a moderator credential cannot read member Journal data");
  const journalAfterCrossAttempt = await (await fetch(`${appOrigin}/api/healthclues/journal`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.ok(journalAfterCrossAttempt.entries.some(entry => entry.id === journalEntry.id && entry.body === "edited private journal fixture"), "cross-owner Journal mutation leaves the owner's private text unchanged");
  const crossWorldCheckin = await fetch(`${appOrigin}/api/healthclues/world/checkin`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify(checkinPayload) });
  assert.equal(crossWorldCheckin.status, 409, "a member with a separate World cannot write check-in data against another owner's World");
  const ownerCheckinAfterAttack = await (await fetch(`${appOrigin}/api/healthclues/world/checkin/detail?worldId=${world.world_id}&date=${date}`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.equal(ownerCheckinAfterAttack.checkin.note_private, "private e2e note", "cross-owner check-in attempt preserves the owner's private note");
  assert.equal(await evaluate(`(() => { const label=[...document.querySelectorAll('label')].find(x=>x.innerText.includes('Test gentle walk')); const input=label?.querySelector('input[type="checkbox"]'); if(!input) return false; input.click(); const row=label.closest('li'); const select=row?.querySelector('select'); const option=[...(select?.options||[])].find(x=>x.text.includes('Test stretch break')); if(!select||!option) return false; const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; setter.call(select,option.value); select.dispatchEvent(new Event('input',{bubbles:true})); select.dispatchEvent(new Event('change',{bubbles:true})); return input.checked && select.value===option.value; })()`), true, "Combo component can be explicitly accepted and replaced with a reviewed same-slot item");
  await clickButtonInCombo("Test Daily Journey Combo", "Save selected pieces to Collection");
  await waitForText("1 selected component saved to My Collection.");
  const replacedComboCollection = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(replacedComboCollection.collection.some(item => item.catalog_item_id === itemIds[3]), "the user-selected same-slot replacement is saved individually to Collection");
  await waitForText("Test sleep knowledge clue");
  await waitForText("Test Night Owl Boss");
  await clickButton("Discover this Clue");
  await waitForText("Clue discovered and added to your Knowledge Book. +2 learning XP · +1 Knowledge Fragment.");
  const browserWorldAfterClue = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.deepEqual(browserWorldAfterClue.knowledgeCurrencies, { fragments: 1, keys: 0 }, "a new reviewed clue grants one private Knowledge Fragment");
  await clickButton("Wrong");
  await waitForText("Not quite · reviewed answer: Right.");
  await clickButton("Right");
  await waitForText("That’s right. +2 learning XP.");
  const journalDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  assert.equal(await evaluate(`(() => { const d = document.querySelector('#hc-journal-date'); const n = document.querySelector('#hc-journal-body'); if (!d || !n) return false; for (const [el,value] of [[d,${JSON.stringify(journalDate)}],[n,'browser journal fixture']]) { const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set; setter.call(el,value); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } return true; })()`), true, "private Journal editor is mounted");
  await clickButton("Save note");
  await waitForText("Private reflection saved.");
  await waitForText("browser journal fixture");
  await screenshotDesktopAndMobile("healthclues-journal", 'section[aria-labelledby="hc-private-journal-title"]');
  await clickButtonInBoss("Wrong");
  await waitForText("Not quite · reviewed answer: Right");
  await clickButtonInBoss("Right");
  await waitForText("Gate opened · +25 XP");
  await waitForText("Keepsake earned: Sleep Valley Lantern");
  await waitForText("World path unlocked:");
  await waitForText("Knowledge Key collected");
  await screenshotDesktopAndMobile("healthclues-boss", '[aria-labelledby="hc-boss-title"]');
  const browserWorldAfterBoss = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.deepEqual(browserWorldAfterBoss.knowledgeCurrencies, { fragments: 1, keys: 1 }, "the Boss win adds one saved Knowledge Key beside the Clue Fragment");
  await screenshot(path.join(reportDir, "healthclues-boss-victory-desktop.png"));
  const browserWorldBeforeReload = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  const browserWorldId = browserWorldBeforeReload.world?.id;
  assert.ok(browserWorldId, "the signed-in browser member has a saved World before testing its milestone landmark");
  const libraryUnlock = await fetch(`${supabaseOrigin}/rest/v1/healthclues_world_unlocks`, { method: "POST", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ user_id: userB, world_id: browserWorldId, unlock_key: "knowledge-library-open", source_type: "milestone", source_id: "fixture-day-60" }) });
  assert.equal(libraryUnlock.status, 201, "isolated milestone unlock fixture is stored on the user's World");
  const storedLibraryUnlock = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_world_unlocks?user_id=eq.${userB}&world_id=eq.${browserWorldId}&unlock_key=eq.knowledge-library-open&select=unlock_key`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(storedLibraryUnlock.length, 1, "saved World evolution unlock can be loaded after write");
  const rewardFixture = await fetch(`${supabaseOrigin}/rest/v1/healthclues_user_rewards`, { method: "POST", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ user_id: userB, reward_id: "journey-milestone-60", source_key: `reward-display-${randomUUID()}` }) });
  assert.equal(rewardFixture.status, 201, "isolated reward display fixture is recorded for the browser account");
  const rewardWorld = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(rewardWorld.rewards.some(row => row.reward_id === "journey-milestone-60" && row.reward_type === "map_unlock" && row.title === "New Region"), "World API enriches persisted rewards with reviewed display metadata");  const worldBeforeReload = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(worldBeforeReload.unlocks.some(row => row.unlock_key === "knowledge-library-open"), `World API returns persisted unlock before browser reload: ${JSON.stringify(worldBeforeReload.unlocks.map(row => row.unlock_key))}`);
  assert.ok(worldBeforeReload.rewards.some(row => row.title === "New Region"), "saved reward title is present in the reloaded World payload");
  const freshWorldResponse = new Promise((resolve, reject) => {
    let reloadedLoaderId;
    let requestedWorldId;
    const timer = setTimeout(() => { ws.removeEventListener("message", handler); reject(new Error("No World API response arrived in the reloaded document.")); }, 15_000);
    const handler = event => {
      const message = JSON.parse(event.data);
      if (message.method === "Page.frameNavigated" && !message.params.frame.parentId && message.params.frame.url.startsWith(appOrigin)) reloadedLoaderId = message.params.frame.loaderId;
      if (message.method === "Network.requestWillBeSent" && message.params.request.url === `${appOrigin}/api/healthclues/world` && message.params.loaderId === reloadedLoaderId) requestedWorldId = message.params.requestId;
      if (message.method === "Network.responseReceived" && requestedWorldId && message.params.requestId === requestedWorldId) {
        clearTimeout(timer); ws.removeEventListener("message", handler); resolve(requestedWorldId);
      }
    };
    ws.addEventListener("message", handler);
  });
  await cdp("Page.reload");
  const worldRequestId = await freshWorldResponse;
  const worldResponseBody = await cdp("Network.getResponseBody", { requestId: worldRequestId });
  const browserWorldPayload = JSON.parse(worldResponseBody.body);
  const browserWorldUnlocks = browserWorldPayload.unlocks.map(row => row.unlock_key);
  assert.equal(browserWorldPayload.world?.id, browserWorldId, "browser reload resolves the same user-owned World");
  assert.ok(browserWorldUnlocks.includes("knowledge-library-open"), `browser's World API response contains persisted unlock: ${JSON.stringify({ world: browserWorldPayload.world, unlocks: browserWorldUnlocks, expectedWorldId: world.world_id, expectedUser: userA })}`);
  await waitForText("Welcome back, Wayfinder");
  await waitForText("browser journal fixture");
  await waitForText("Checkpoint cleared");
  await waitForText("PATH OPEN");
  await waitForText("Test sleep knowledge clue");
  await waitForText("Sleep Valley");
  const worldAfterEvolutionReload = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(worldAfterEvolutionReload.unlocks.some(row => row.unlock_key === "knowledge-library-open"), "World API restores milestone landmark state after reload");
  assert.ok(worldAfterEvolutionReload.unlocks.some(row => row.unlock_key === "sleep-valley-lantern-open"), "World API restores the Sleep Boss cosmetic map decoration after reload");
  assert.ok(worldAfterEvolutionReload.rewards.some(row => row.reward_id === "boss-keepsake-sleep-lantern" && row.title === "Sleep Valley Lantern"), "World API retains the Sleep Boss keepsake in My Collection after reload");
  assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"Sleep Valley Lantern cosmetic unlocked\"]'))"), true, "saved Sleep Boss cosmetic renders as an environmental map decoration");
  assert.match(await evaluate("document.querySelector('svg[data-world-unlocks]')?.getAttribute('data-world-unlocks') || ''"), /knowledge-library-open/, "interactive map receives the saved milestone unlock");
  assert.equal(await evaluate("Boolean(document.querySelector('[aria-label=\"Knowledge Library unlocked\"]'))"), true, "map renders the unlocked landmark from the saved key");
  await waitForText("KNOWLEDGE LIBRARY");
  await waitForText("New Region");
  await screenshotDesktopAndMobile("healthclues-rewards-world-evolution", "#hc-world");
  await screenshot(path.join(reportDir, "healthclues-world-desktop.png"));
  await clickButton("Sleep Valley");
  await waitForText("Moonlit lakes · quiet village");
  assert.equal(await evaluate("document.querySelector('button[aria-pressed=\\\"true\\\"]')?.innerText.trim()"), "Sleep Valley", "Selecting a region updates the active trail preview.");
  await screenshot(path.join(reportDir, "healthclues-world-sleep-region-desktop.png"));
  assert.equal(await evaluate("(() => { const item = [...document.querySelectorAll('nav[aria-label=\"World regions\"] button')].find(button => button.textContent.includes('Nutrition Garden')); const mapMarker = [...document.querySelectorAll('svg g[aria-label]')].find(marker => marker.getAttribute('aria-label')?.startsWith('Nutrition Garden')); return Boolean(item?.disabled && mapMarker?.getAttribute('aria-disabled') === 'true' && !mapMarker.hasAttribute('role')); })()"), true, "the visible Nutrition Garden stays a locked Coming Soon region and cannot be entered");
  assert.equal(await evaluate("document.querySelector('button[aria-pressed=\"true\"]')?.innerText.trim()"), "Sleep Valley", "inspecting an unreleased region cannot change the active Journey");
  assert.equal(await evaluate("(() => { const button = document.querySelector('button[aria-label=\\\"Zoom in\\\"]'); if (!button) return false; button.click(); return true; })()"), true, "Zoom-in control is accessible.");
  assert.match(await evaluate("document.querySelector('svg[aria-labelledby=\\\"world-map-title world-map-desc\\\"]').style.transform"), /scale\(1\.2\)/, "Zoom control scales the shared world-coordinate layer.");
  assert.equal(await evaluate("(() => { const button = document.querySelector('button[aria-label=\\\"Zoom out\\\"]'); if (!button) return false; button.click(); return true; })()"), true, "Zoom-out control is accessible.");
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  const regionFocus = await evaluate("new Promise(resolve => { const region = document.querySelector('g[aria-label^=\\\"Sleep Valley\\\"]'); region?.focus(); requestAnimationFrame(() => requestAnimationFrame(() => resolve({ keyboardFocusVisible: region?.matches(':focus-visible') ?? false, ringRendered: Boolean(region?.querySelector('.hc-map-focus-ring')) }))); })", true);
  assert.deepEqual(regionFocus, { keyboardFocusVisible: true, ringRendered: true }, "keyboard focus on a map region renders a high-contrast SVG ring");
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await cdp("Page.reload");
  await waitForText("Welcome back, Wayfinder");
  assert.equal(await evaluate("document.querySelector('svg[data-world-unlocks]')?.style.transition"), "none", "map zoom/pan transitions are disabled when reduced motion is preferred");
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await cdp("Page.reload");
  await waitForText("Welcome back, Wayfinder");
  await clickButtonContaining("Check in");
  await waitForText("How did today go?");
  await waitForText("Done");
  await screenshotDesktopAndMobile("healthclues-checkin", '[role="dialog"]');
  await clickButton("Done");
  await clickButton("Save check-in");
  await waitForText("Check-in saved");
  await cdp("Page.reload");
  await waitForText("Welcome back, Wayfinder");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp("Page.reload");
  await waitForText("Welcome back, Wayfinder");
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Mobile map must not create page-level horizontal overflow.");
  assert.ok(await evaluate("document.querySelector('[aria-label=\\\"Interactive illustrated world map\\\"]').getBoundingClientRect().width <= window.innerWidth"), "Mobile map frame must fit the viewport; only its internal canvas may scroll.");
  await screenshot(path.join(reportDir, "healthclues-world-mobile.png"));

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${appOrigin}/en/wellness/account` });
  await waitForText("HealthClues data and privacy");
  await waitForText("Request HealthClues data deletion");
  await screenshot(path.join(reportDir, "healthclues-account-privacy-desktop.png"));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp("Page.reload");
  await waitForText("HealthClues data and privacy");
  assert.ok(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Mobile account privacy controls must not create page-level horizontal overflow.");
  await screenshot(path.join(reportDir, "healthclues-account-privacy-mobile.png"));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-community` });
  await waitForText("Kiểm duyệt hành trình cộng đồng");
  assert.equal(await evaluate("(() => { const input=document.querySelector('input[type=\"password\"]'); input?.focus(); return Boolean(input); })()"), true, "moderation admin sign-in form is rendered");
  await new Promise(resolve => setTimeout(resolve, 1200));
  await cdp("Input.insertText", { text: moderatorToken });
  assert.equal(await evaluate(`document.querySelector('input[type="password"]')?.value === ${JSON.stringify(moderatorToken)}`), true, "Community moderator token remains in the hydrated sign-in form");
  await clickButton("Tải báo cáo");
  await waitForText("Đã tải");
  await screenshot(path.join(reportDir, "healthclues-admin-moderation-desktop.png"));
  writeFileSync(fixtureSql, `update public.healthclues_knowledge_clues set review_status='needs_review',published=false,reviewed_by=null,reviewed_at=null where clue_id in ('${clueIds[0]}','${clueIds[1]}') and reviewed_by='test-fixture'; update public.healthclues_boss_challenges set review_status='needs_review',published=false,reviewed_by=null,reviewed_at=null where boss_id='${bossIds[0]}' and reviewed_by='test-fixture'; update public.healthclues_catalog_items set review_status='needs_review',active=false,recommendation_eligible=false where id='${itemIds[4]}'; update public.healthclues_catalog_item_versions set evidence_sources='[{"label":"Isolated synthetic fixture","url":"https://example.invalid/catalog"}]'::jsonb,reviewed_by=null,reviewed_at=null where catalog_item_id='${itemIds[4]}' and version=1;`, "utf8");
  runPsqlFile(fixtureSql, "/tmp/healthclues-review-pending-fixtures.sql");
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-content` });
  await new Promise(resolve => setTimeout(resolve, 1200));
  await waitForText("Rà soát nội dung và công cụ");
  assert.equal(await evaluate("(() => { const input=document.querySelector('input[type=\"password\"]'); input?.focus(); return Boolean(input); })()"), true, "content reviewer sign-in form is rendered");
  await cdp("Input.insertText", { text: reviewerToken });
  assert.equal(await evaluate(`document.querySelector('input[type="password"]')?.value === ${JSON.stringify(reviewerToken)}`), true, "HealthClues reviewer token remains in the hydrated sign-in form");
  await clickButton("Tải hàng đợi");
  await waitForText("Hàng đợi đã cập nhật.");
  await screenshot(path.join(reportDir, "healthclues-admin-content-review-desktop.png"));
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-diagnostics` });
  await waitForText("Chẩn đoán vận hành");
  await new Promise(resolve => setTimeout(resolve, 250));
  await cdp("Runtime.evaluate", { expression: "document.querySelector('input[type=\"password\"]')?.focus()" });
  await cdp("Input.insertText", { text: reviewerToken });
  assert.equal(await evaluate("document.querySelector('input[type=\"password\"]')?.value"), reviewerToken, "diagnostics reviewer token is present before submitting the hydrated form");
  await clickButton("Kiểm tra trạng thái");
  await waitForText("Đã cập nhật chỉ số.");
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Operational queue counts\"]')?.querySelectorAll('article').length"), 5, "admin diagnostics renders five aggregate queue counters");
  await screenshot(path.join(reportDir, "healthclues-admin-diagnostics-desktop.png"));
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-authoring` });
  await waitForText("Soạn Methods và Combos");
  await cdp("Runtime.evaluate", { expression: "document.querySelector('input[type=\"password\"]')?.focus()" });
  await cdp("Input.insertText", { text: reviewerToken });
  await clickButton("Tải dữ liệu");
  await waitForText("Đã tải bản nháp và Catalog đã duyệt.");
  assert.equal(await evaluate("document.querySelectorAll('form').length"), 4, "draft authoring UI renders a credential form and three structured draft forms");
  assert.ok(await evaluate("document.body.innerText.includes('Synthetic method draft') && document.body.innerText.includes('Synthetic journey combo draft')"), "reviewer draft authoring UI lists the drafts created through its API");
  await screenshot(path.join(reportDir, "healthclues-admin-authoring-desktop.png"));
  const unconfirmedMethodPublish = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ contentType: "method", id: authorMethodId, version: 1, action: "publish", reason: draftReason }) });
  assert.equal(unconfirmedMethodPublish.status, 422, "Methods cannot be published without a reviewer confirmation");
  for (const [contentType, id] of [["method", authorMethodId], ["recipe_combo", authorRecipeComboId], ["journey_combo", authorJourneyComboId]]) {
    const publishDraft = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ contentType, id, version: 1, action: "publish", reason: draftReason, confirmReviewed: true }) });
    const publishPayload = await publishDraft.json();
    assert.equal(publishDraft.status, 200, `${contentType} draft can be published by a confirmed reviewer: ${JSON.stringify(publishPayload)}`);
  }
  const publishedMethod = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_usage_methods?id=eq.${authorMethodId}&select=review_status,active`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.deepEqual(publishedMethod[0], { review_status: "reviewed", active: true }, "Method publication persists reviewer-approved state");
  const publicCombosAfterReview = await (await fetch(`${appOrigin}/api/healthclues/combos`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  assert.ok(JSON.stringify(publicCombosAfterReview).includes(authorRecipeComboId) && JSON.stringify(publicCombosAfterReview).includes(authorJourneyComboId), "only reviewer-published Combos are exposed by the player catalog");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { headers: { Authorization: `Bearer ${moderatorToken}` } })).status, 401, "Community moderator cannot change reward configuration");
  assert.equal((await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401, "legacy Botly admin cannot change HealthClues rewards");
  const rewardQueueResponse = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(rewardQueueResponse.status, 200, "reviewer can load milestone reward configuration");
  const rewardQueue = await rewardQueueResponse.json();
  const rewardBefore = rewardQueue.rewards.find(item => item.id === "journey-milestone-7");
  assert.ok(rewardBefore && Number.isInteger(rewardBefore.version), "review queue returns versioned milestone rewards");
  const invalidRewardConfig = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: rewardBefore.id, expectedVersion: rewardBefore.version, title: "Updated name", active: false, reason: "" }) });
  assert.equal(invalidRewardConfig.status, 400, "reward configuration requires a meaningful audit reason");
  const unsupportedRewardConfig = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: "boss-keepsake-unlisted", expectedVersion: 1, title: "Synthetic reward", active: false, reason: "Synthetic allowlist boundary check." }) });
  assert.equal(unsupportedRewardConfig.status, 400, "reviewer API rejects reward identifiers outside its fixed allowlist");
  const disableReward = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: rewardBefore.id, expectedVersion: rewardBefore.version, title: `${rewardBefore.title} test`, active: false, reason: "Synthetic E2E reward config." }) });
  assert.equal(disableReward.status, 200, "reviewer can version and disable a configured milestone reward");
  const disabledReward = (await disableReward.json()).reward;
  assert.equal(disabledReward.version, rewardBefore.version + 1);
  assert.equal(disabledReward.active, false);
  const staleRewardConfig = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: rewardBefore.id, expectedVersion: rewardBefore.version, title: rewardBefore.title, active: rewardBefore.active, reason: "Synthetic stale version check." }) });
  assert.equal(staleRewardConfig.status, 409, "reward configuration rejects a stale version");
  const restoreReward = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: rewardBefore.id, expectedVersion: disabledReward.version, title: rewardBefore.title, active: rewardBefore.active, reason: "Synthetic E2E reward config restore." }) });
  assert.equal(restoreReward.status, 200, "E2E restores the original reward title and active state");
  const rewardAudit = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_type=eq.reward&entity_id=like.${encodeURIComponent("journey-milestone-7:v%")}&reason=in.(Synthetic%20E2E%20reward%20config.,Synthetic%20E2E%20reward%20config%20restore.)&select=actor_type,action,metadata&order=created_at.desc&limit=5`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.ok(rewardAudit.length >= 2 && rewardAudit.slice(0, 2).every(row => row.actor_type === "reviewer" && row.action === "reward_config_update"), "reward config changes are audit logged under the reviewer role");
  await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_type=eq.reward&entity_id=like.${encodeURIComponent("journey-milestone-7:v%")}&reason=in.(Synthetic%20E2E%20reward%20config.,Synthetic%20E2E%20reward%20config%20restore.)`, { method: "DELETE", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, Prefer: "return=minimal" } });
  const keepsakeBefore = rewardQueue.rewards.find(item => item.id === "boss-keepsake-nutrition-blossom");
  assert.ok(keepsakeBefore && Number.isInteger(keepsakeBefore.version), "review queue includes versioned Boss keepsake configuration");
  const disableKeepsake = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: keepsakeBefore.id, expectedVersion: keepsakeBefore.version, title: keepsakeBefore.title, active: false, reason: "Synthetic E2E keepsake config." }) });
  assert.equal(disableKeepsake.status, 200, "reviewer can disable a fixed Boss keepsake configuration");
  const disabledKeepsake = (await disableKeepsake.json()).reward;
  assert.equal(disabledKeepsake.active, false);
  const restoreKeepsake = await fetch(`${appOrigin}/api/admin/healthclues-rewards`, { method: "PATCH", headers: draftHeaders, body: JSON.stringify({ id: keepsakeBefore.id, expectedVersion: disabledKeepsake.version, title: keepsakeBefore.title, active: keepsakeBefore.active, reason: "Synthetic E2E keepsake config restore." }) });
  assert.equal(restoreKeepsake.status, 200, "E2E restores original Boss keepsake configuration");
  assert.equal((await restoreKeepsake.json()).reward.active, keepsakeBefore.active, "restored Boss keepsake is back in its original state");
  const keepsakeAudit = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_type=eq.reward&entity_id=like.${encodeURIComponent(`${keepsakeBefore.id}:v%`)}&reason=in.(Synthetic%20E2E%20keepsake%20config.,Synthetic%20E2E%20keepsake%20config%20restore.)&select=actor_type,action&order=created_at.desc&limit=5`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.ok(keepsakeAudit.length >= 2 && keepsakeAudit.slice(0, 2).every(row => row.actor_type === "reviewer" && row.action === "reward_config_update"), "Boss keepsake disable and restore are audit logged as reviewer actions");
  await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_type=eq.reward&entity_id=like.${encodeURIComponent(`${keepsakeBefore.id}:v%`)}&reason=in.(Synthetic%20E2E%20keepsake%20config.,Synthetic%20E2E%20keepsake%20config%20restore.)`, { method: "DELETE", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, Prefer: "return=minimal" } });
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-rewards` });
  await waitForText("Cấu hình phần thưởng");
  await new Promise(resolve => setTimeout(resolve, 1200));
  await cdp("Runtime.evaluate", { expression: "document.querySelector('input[type=\"password\"]')?.focus()" });
  await cdp("Input.insertText", { text: reviewerToken });
  assert.equal(await evaluate(`document.querySelector('input[type="password"]')?.value === ${JSON.stringify(reviewerToken)}`), true, "HealthClues reward reviewer token remains in the hydrated sign-in form");
  await clickButton("Tải cấu hình");
  await waitForText("Đã tải cấu hình phần thưởng.");
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Reward configuration\"]')?.querySelectorAll('article').length"), 9, "reward admin UI shows five milestones and four fixed Boss keepsakes");
  await screenshot(path.join(reportDir, "healthclues-admin-rewards-desktop.png"));
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-quiz-preview` });
  await waitForText("Quiz question bank");
  assert.equal(await evaluate("(() => { const input=document.querySelector('input[type=\"password\"]'); input?.focus(); return Boolean(input); })()"), true, "Quiz reviewer sign-in form is rendered");
  await cdp("Input.insertText", { text: reviewerToken });
  await new Promise(resolve => setTimeout(resolve, 1200));
  await evaluate(`(() => { const input=document.querySelector('input[type="password"]'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set; setter.call(input,${JSON.stringify(reviewerToken)}); input.dispatchEvent(new Event("input",{bubbles:true})); input.dispatchEvent(new Event("change",{bubbles:true})); return input.value; })()`);
  assert.equal(await evaluate(`document.querySelector('input[type="password"]')?.value === ${JSON.stringify(reviewerToken)}`), true, "Quiz reviewer token remains in the hydrated sign-in form");
  assert.equal(await evaluate(`fetch("/api/admin/healthclues-quiz",{headers:{Authorization:"Bearer "+document.querySelector('input[type="password"]').value}}).then(response=>response.status)`, true), 200, "Quiz reviewer browser credential is accepted by the API before submitting the UI form");
  await clickButton("Open question bank");
  await waitForText("Active player version:");
  await evaluate("document.querySelector('input[placeholder=\"Search by ID or question\"]')?.focus()");
  await cdp("Input.insertText", { text: "C01" });
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(await evaluate("document.querySelectorAll('main article').length"), 1, "Quiz reviewer page can filter to a single question for focused visual review");
  assert.equal(await evaluate("document.body.innerText.includes('HEALTHCLUES · INTERNAL REVIEW')"), true, "Quiz reviewer page renders the corrected Unicode separator");
  assert.equal(await evaluate("document.body.innerText.includes(String.fromCodePoint(0xC2,0xB7))"), false, "Quiz reviewer page does not render the broken middle-dot encoding");
  await screenshot(path.join(reportDir, "healthclues-admin-quiz-preview-desktop.png"));
  await cdp("Page.navigate", { url: `${appOrigin}/admin/healthclues-content` });
  await waitForText("Rà soát nội dung và công cụ");
  const pendingContentResponse = await fetch(`${appOrigin}/api/admin/healthclues-content`, { headers: { Authorization: `Bearer ${reviewerToken}` } });
  assert.equal(pendingContentResponse.status, 200);
  const pendingContent = await pendingContentResponse.json();
  assert.ok(pendingContent.clues.some(item => item.clue_id === clueIds[0]), "review queue includes a synthetic unreviewed Clue");
  assert.ok(pendingContent.bosses.some(item => item.boss_id === bossIds[0]), "review queue includes a synthetic unreviewed Boss");
  assert.ok(pendingContent.catalog.some(item => item.id === itemIds[4]), "review queue includes a synthetic Catalog candidate");
  const reviewerHeaders = { Authorization: `Bearer ${reviewerToken}`, "Content-Type": "application/json" };
  const staleCatalogVersion = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "catalog", id: itemIds[4], version: 2, action: "publish", reason: "Synthetic stale-version conflict check.", confirmReviewed: true }) });
  assert.equal(staleCatalogVersion.status, 409, "review actions reject a stale Catalog version");
  const missingHumanConfirmation = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "clue", id: clueIds[0], version: 1, action: "publish", reason: "Synthetic reviewer flow test." }) });
  assert.equal(missingHumanConfirmation.status, 422, "health content cannot be published without an explicit reviewer confirmation");
  const invalidRecommendationTarget = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "clue", id: clueIds[0], version: 1, action: "recommend", reason: "Invalid cross-type recommendation check.", confirmReviewed: true }) });
  assert.equal(invalidRecommendationTarget.status, 400, "only Catalog records can be made recommendation-eligible");
  const publishClue = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "clue", id: clueIds[0], version: 1, action: "publish", reason: "Synthetic non-medical fixture review test.", confirmReviewed: true }) });
  assert.equal(publishClue.status, 200, "reviewer can publish a source-backed synthetic test Clue after explicit confirmation");
  const contentReviewerIdentity = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_knowledge_clues?clue_id=eq.${clueIds[0]}&version=eq.1&select=reviewed_by`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(contentReviewerIdentity[0]?.reviewed_by, "healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN", "content review records the distinct reviewer role");
  const publishBoss = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "boss", id: bossIds[0], version: 1, action: "publish", reason: "Synthetic non-medical fixture review test.", confirmReviewed: true }) });
  assert.equal(publishBoss.status, 200, "reviewer can publish a synthetic test Boss with an answer key after explicit confirmation");
  const publishCatalog = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "catalog", id: itemIds[4], version: 1, action: "publish", reason: "Synthetic non-medical fixture review test.", confirmReviewed: true }) });
  assert.equal(publishCatalog.status, 200, "reviewer can activate a source-backed Catalog candidate");
  const recommendCatalog = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "catalog", id: itemIds[4], version: 1, action: "recommend", reason: "Synthetic isolated recommendation eligibility check.", confirmReviewed: true }) });
  assert.equal(recommendCatalog.status, 200, "reviewer can explicitly enable recommendations for an active, reviewed Catalog item");
  const visibleBeforeRetraction = await (await fetch(`${appOrigin}/api/healthclues/catalog`)).json();
  assert.ok(visibleBeforeRetraction.items.some(item => item.id === itemIds[4] && item.recommendationEligible), "active reviewed item is offered before its source is retracted");
  const recommendationState = await fetch(`${supabaseOrigin}/rest/v1/healthclues_catalog_items?id=eq.${itemIds[4]}&select=review_status,active,recommendation_eligible`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
  const recommendationRows = await recommendationState.json();
  assert.equal(recommendationRows[0].recommendation_eligible, true);
  const deactivateCatalog = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "catalog", id: itemIds[4], version: 1, action: "deactivate", reason: "Synthetic source retraction: source withdrawn by publisher." }) });
  assert.equal(deactivateCatalog.status, 200, "reviewer can deactivate a Catalog item after its source is withdrawn");
  const deactivatedCatalog = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_catalog_items?id=eq.${itemIds[4]}&select=review_status,active,recommendation_eligible`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(deactivatedCatalog[0].active, false);
  assert.equal(deactivatedCatalog[0].recommendation_eligible, false, "deactivation removes recommendation eligibility");
  const withdrawnCatalog = await (await fetch(`${appOrigin}/api/healthclues/catalog`)).json();
  assert.equal(withdrawnCatalog.items.some(item => item.id === itemIds[4]), false, "withdrawn-source item disappears from the public recommendation Catalog");
  const withdrawnAudit = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_id=eq.${encodeURIComponent(`${itemIds[4]}:v1`)}&select=action,reason,actor_type&limit=10`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.ok(withdrawnAudit.some(item => item.action === "content_catalog_deactivate" && item.reason.includes("source withdrawn") && item.actor_type === "reviewer"), "source withdrawal and its reason are preserved in reviewer audit");
  const withdrawnEquipAttempt = await fetch(`${appOrigin}/api/healthclues/world`, { method: "POST", headers: { Authorization: `Bearer ${userTokenB}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestKey: randomUUID(), topicKey: "sleep-better", title: "Withdrawn Source Test", timezone: "Asia/Bangkok", startedOn: date, selections: [{ catalogItemId: itemIds[4], itemVersion: 1, slot: "consume" }] }) });
  assert.equal(withdrawnEquipAttempt.status, 409, "world creation cannot equip a source-withdrawn Catalog item");
  const rejectClue = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "clue", id: clueIds[1], version: 1, action: "reject", reason: "Synthetic isolated rejection check." }) });
  assert.equal(rejectClue.status, 200);
  const deactivateBoss = await fetch(`${appOrigin}/api/admin/healthclues-content`, { method: "PATCH", headers: reviewerHeaders, body: JSON.stringify({ contentType: "boss", id: bossIds[0], version: 1, action: "deactivate", reason: "Synthetic isolated deactivation check." }) });
  assert.equal(deactivateBoss.status, 200);
  const retiredBoss = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_boss_challenges?boss_id=eq.${bossIds[0]}&select=review_status,published,reviewed_at`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(retiredBoss[0].review_status, "retired");
  assert.equal(retiredBoss[0].published, false);
  assert.ok(retiredBoss[0].reviewed_at, "deactivation preserves the original reviewer timestamp");
  const publishedClue = await fetch(`${supabaseOrigin}/rest/v1/healthclues_knowledge_clues?clue_id=eq.${clueIds[0]}&select=review_status,published,reviewed_by`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
  const publishedClueRows = await publishedClue.json();
  assert.equal(publishedClueRows[0].review_status, "reviewed"); assert.equal(publishedClueRows[0].published, true);
  const auditResponse = await fetch(`${supabaseOrigin}/rest/v1/healthclues_audit_events?entity_id=eq.${encodeURIComponent(`${clueIds[0]}:v1`)}&select=id,action&limit=5`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } });
  assert.ok((await auditResponse.json()).some(item => item.action === "content_clue_publish"), "review decision is present in the audit log");

  const deletionShareResponse = await fetch(`${appOrigin}/api/healthclues/community`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "share", journeyId: world.journey_id, alias: "Pathfinder A", title: "Deletion Test Trail", publicTopics: ["sleep-better"], catalogItemIds: [sharedCatalogId], methodIds: [methodId], shareTimeline: false, shareFrequency: false, shareReflections: false }) });
  assert.equal(deletionShareResponse.status, 200, "member can create an explicit share before requesting data deletion");
  const deletionShareId = (await deletionShareResponse.json()).publicJourneyId;
  const pendingDeletionDelivery = await fetch(`${supabaseOrigin}/rest/v1/healthclues_notification_deliveries`, { method: "POST", headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ user_id: userA, template_key: "healthclues-daily-journey-v1", local_date: "2099-01-01", idempotency_key: `hc-delete-${randomUUID()}`, state: "queued", scheduled_at: "2099-01-01T09:00:00.000Z" }) });
  assert.equal(pendingDeletionDelivery.status, 201, "isolated test creates a synthetic queued reminder for deletion cancellation");
  const deletionDeliveryId = (await pendingDeletionDelivery.json())[0].id;
  const requestDeletion = await fetch(`${appOrigin}/api/healthclues/account`, { method: "DELETE", headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(requestDeletion.status, 202, "member can request HealthClues-only data deletion");
  const pendingDeletionStatusResponse = await fetch(`${appOrigin}/api/healthclues/account`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  const pendingDeletionStatus = await pendingDeletionStatusResponse.json();
  assert.equal(pendingDeletionStatus.deletionRequest.status, "requested");
  deletionRequestId = pendingDeletionStatus.deletionRequest.id;
  assert.ok(Date.parse(pendingDeletionStatus.deletionRequest.recovery_until) > Date.now() + 29 * 86400_000, "deletion provides the documented 30-day recovery window");
  assert.ok(Date.parse(pendingDeletionStatus.deletionRequest.purge_after) > Date.now() + 59 * 86400_000, "primary data purge is scheduled after recovery and within the documented 60-day deadline");
  const lockedWorld = await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(lockedWorld.status, 423, "pending deletion locks private HealthClues APIs immediately");
  const deletionLockedApiCases = [
    ["GET", "/api/healthclues/boss"], ["GET", "/api/healthclues/combos"], ["GET", "/api/healthclues/community"],
    ["GET", "/api/healthclues/journal"], ["GET", "/api/healthclues/knowledge"], ["GET", "/api/healthclues/reminders"],
    ["GET", `/api/healthclues/world/checkin/detail?worldId=${world.world_id}&localDate=${date}`],
    ["POST", "/api/healthclues/world"], ["POST", "/api/healthclues/world/checkin"], ["POST", "/api/healthclues/world/collection"],
    ["POST", "/api/healthclues/world/toolkit"], ["PATCH", "/api/healthclues/world/toolkit"], ["POST", "/api/healthclues/community"],
    ["POST", "/api/healthclues/journal"], ["POST", "/api/healthclues/knowledge"], ["POST", "/api/healthclues/boss"], ["POST", "/api/healthclues/reminders"],
  ];
  for (const [method, pathname] of deletionLockedApiCases) {
    const response = await fetch(`${appOrigin}${pathname}`, { method, headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, ...(method === "GET" ? {} : { body: "{}" }) });
    assert.equal(response.status, 423, `pending deletion must lock ${method} ${pathname}`);
  }
  const rlsLockedProfile = await fetch(`${supabaseOrigin}/rest/v1/healthclues_profiles?user_id=eq.${userA}&select=user_id`, { headers: { apikey: anonToken, Authorization: `Bearer ${userTokenA}` } });
  assert.equal(rlsLockedProfile.status, 200);
  assert.deepEqual(await rlsLockedProfile.json(), [], "direct PostgREST profile access is also locked by RLS");
  const deletionRevokedShare = await (await fetch(`${appOrigin}/api/healthclues/community?id=${deletionShareId}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.equal(deletionRevokedShare.journeys.length, 0, "deletion request immediately removes the owner's public projection");
  const canceledDeletionDelivery = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_notification_deliveries?id=eq.${deletionDeliveryId}&select=state,safe_error_code`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(canceledDeletionDelivery[0]?.state, "canceled", "deletion request cancels queued reminder jobs immediately");
  const cancelDeletion = await fetch(`${appOrigin}/api/healthclues/account`, { method: "POST", headers: { Authorization: `Bearer ${userTokenA}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
  assert.equal(cancelDeletion.status, 200, "member can cancel during the recovery period");
  assert.equal((await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json()).world.id, world.world_id, "canceling deletion restores private access and preserves the World");
  assert.equal((await (await fetch(`${appOrigin}/api/healthclues/community?id=${deletionShareId}`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json()).journeys.length, 0, "cancel does not silently restore public-sharing consent");
  const optedOutAfterCancel = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_email_preferences?user_id=eq.${userA}&select=opted_in`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(optedOutAfterCancel[0]?.opted_in, false, "cancel does not silently restore reminder consent");
  const finalDeletionRequest = await fetch(`${appOrigin}/api/healthclues/account`, { method: "DELETE", headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(finalDeletionRequest.status, 202, "member may request deletion again after recovery");
  const finalDeletionStatus = await (await fetch(`${appOrigin}/api/healthclues/account`, { headers: { Authorization: `Bearer ${userTokenA}` } })).json();
  deletionRequestId = finalDeletionStatus.deletionRequest.id;
  const retentionRunAt = new Date(Date.parse(finalDeletionStatus.deletionRequest.purge_after) + 1000).toISOString();
  const retentionRun = await fetch(`${appOrigin}/api/internal/healthclues-retention`, { method: "POST", headers: { Authorization: `Bearer ${retentionJobToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ runAt: retentionRunAt, limit: 10 }) });
  assert.equal(retentionRun.status, 200, "authorized retention worker processes due deletion requests");
  assert.equal((await retentionRun.json()).processed, 1, "retention worker purges the due account exactly once");
  const deletedUserWorld = await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenA}` } });
  assert.equal(deletedUserWorld.status, 200, "HealthClues data purge retains Botly authentication");
  assert.equal((await deletedUserWorld.json()).world, null, "purged account has no remaining Wellness World");
  const retainedOtherWorld = await (await fetch(`${appOrigin}/api/healthclues/world`, { headers: { Authorization: `Bearer ${userTokenB}` } })).json();
  assert.ok(retainedOtherWorld.world, "another member's independent World survives the purge");
  const anonymizedDeletion = await (await fetch(`${supabaseOrigin}/rest/v1/healthclues_account_deletion_requests?id=eq.${deletionRequestId}&select=user_id,status,purged_at`, { headers: { apikey: serviceToken, Authorization: `Bearer ${serviceToken}` } })).json();
  assert.equal(anonymizedDeletion[0]?.user_id, null, "retention preserves only an anonymized deletion audit");
  assert.equal(anonymizedDeletion[0]?.status, "purged");

  console.log("HealthClues game E2E passed: guest intro, 8-quest selection, 10-question onboarding with resume, reviewed Catalog, Recipe/Journey Combos, individual Collection save, Community search/follow/start-own/report/revoke isolation and admin moderation, opt-in reminder consent/timezone/mock dispatch/dedupe/pause/resume/unsubscribe, deletion request lock/recovery/revoke/cancel/purge, equipment/World, check-in edit, Knowledge Book, private Journal, Boss retry/victory/reward/unlock persistence, toolkit history, desktop/mobile interactions, admin reviewer UI and reload. Synthetic rows are cleaned in finally.");
  console.log(`Screenshots: ${reportDir}`);
} catch (error) {
  if (appLogs) console.error(`Local test server output:\n${appLogs}`);
  throw error;
} finally {
  try { ws?.close(); } catch { /* Ignore browser teardown errors. */ }
  try { chrome?.kill(); } catch { /* Ignore browser teardown errors. */ }
  try { app?.kill(); } catch { /* Ignore app teardown errors. */ }
  try { if (app) await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 3000))]); } catch { /* Ignore app exit status during cleanup. */ }
  try { if (proxy) await new Promise(resolve => proxy.close(resolve)); } catch { /* Ignore proxy teardown errors. */ }
  try {
    if (deletionRequestId) {
      const deletionAuditCleanupSql = path.join(tempSqlDir, "cleanup-deletion-audit.sql");
      writeFileSync(deletionAuditCleanupSql, `delete from public.healthclues_account_deletion_requests where id='${deletionRequestId}' or user_id in ('${userA}','${userB}','${userC}');\n`, "utf8");
      runPsqlFile(deletionAuditCleanupSql, "/tmp/healthclues-game-deletion-audit-cleanup.sql");
      const remainingDeletionAudit = execFileSync("docker", ["exec", dbContainerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select count(*) from public.healthclues_account_deletion_requests where id='${deletionRequestId}'"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      assert.equal(remainingDeletionAudit, "0", "game E2E cleanup removes its anonymized deletion audit fixture");
    }
    runPsqlFile(cleanupSql, "/tmp/healthclues-game-cleanup.sql");
    const remainingFixtures = execFileSync("docker", ["exec", dbContainerName, "sh", "-lc", `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U supabase_admin -d ${databaseName} -Atc "select (select count(*) from public.healthclues_catalog_items where id in ('${itemIds.join("','")}')) + (select count(*) from public.healthclues_usage_methods where id in ('${methodId}','${authorMethodId}')) + (select count(*) from public.healthclues_knowledge_clues where clue_id in ('${clueIds.join("','")}')) + (select count(*) from public.healthclues_boss_challenges where boss_id in ('${bossIds.join("','")}')) + (select count(*) from public.healthclues_recipe_combos where id in ('${recipeComboId}','${authorRecipeComboId}')) + (select count(*) from public.healthclues_journey_combos where id in ('${comboId}','${authorJourneyComboId}'))"`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    assert.equal(remainingFixtures, "0", "game E2E cleanup removes every content fixture created by this run");
    console.log("Game E2E cleanup verified: no generated content fixture remains in the isolated test database.");
  } catch (error) {
    console.error("Game E2E cleanup failed; isolated test fixture state requires repair before another run.", error);
    process.exitCode = 1;
  }
  try { rmSync(tempSqlDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); }
  catch (error) { console.warn(`Could not remove this run's temporary SQL fixture directory (${tempSqlDir}); leaving it for safe manual cleanup.`, error instanceof Error ? error.code : "unknown"); }
}
