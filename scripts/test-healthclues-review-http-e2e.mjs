import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import ts from "typescript";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`E2E blocked: required test-only setting ${name} is missing`);
  return value;
}

const appUrl = new URL(required("HC_E2E_APP_URL"));
const restUrl = new URL(required("HC_E2E_REST_URL"));
const expectedApp = "http://127.0.0.1:3207";
const expectedRest = "http://127.0.0.1:3001";
if (appUrl.origin !== expectedApp || appUrl.pathname !== "/" || appUrl.username || appUrl.password) {
  throw new Error("E2E blocked: app endpoint is outside the exact loopback allowlist");
}
if (restUrl.origin !== expectedRest || restUrl.pathname !== "/" || restUrl.username || restUrl.password) {
  throw new Error("E2E blocked: REST endpoint is outside the exact loopback allowlist");
}

const databaseUrl = new URL(required("HC_E2E_DB_URL"));
const expectedDatabase = required("HC_E2E_EXPECTED_DB");
if (databaseUrl.protocol !== "postgresql:" || databaseUrl.hostname !== "127.0.0.1" || databaseUrl.port !== "5434" ||
    databaseUrl.pathname !== `/${expectedDatabase}` || expectedDatabase !== "botly_restore_verification" ||
    databaseUrl.username !== "authenticator" || databaseUrl.searchParams.get("sslmode") !== "disable") {
  throw new Error("E2E blocked: database endpoint is outside the exact restored-test allowlist");
}
if (Object.keys(process.env).some(name => name.startsWith("SUPABASE_") || name.startsWith("NEXT_PUBLIC_SUPABASE_"))) {
  throw new Error("E2E blocked: production Supabase environment was inherited");
}

const adminToken = required("HC_E2E_ADMIN_TOKEN");
const reviewerToken = required("HC_E2E_REVIEWER_TOKEN");
const testSecret = required("HC_E2E_JWT_SECRET");
if (!adminToken.startsWith("hc-e2e:") || !reviewerToken.startsWith("hc-e2e-reviewer:") || testSecret.length < 32) {
  throw new Error("E2E blocked: test-only admin/JWT credentials are invalid");
}

const runnerPid = Number(required("HC_E2E_RUNNER_PID"));
const marker = JSON.parse(readFileSync(new URL("../.tmp/healthclues-e2e-app.json", import.meta.url), "utf8"));
assert.equal(marker.pid, runnerPid, "E2E requires the controlled test-app launcher");
assert.equal(marker.appUrl, expectedApp);
assert.equal(marker.restUrl, expectedRest);
assert.equal(marker.supabaseUrl, "http://127.0.0.1:3002");
assert.equal(marker.database, expectedDatabase);
assert.equal(marker.externalSideEffectsDisabled, true, "E2E environment has outbound production side effects disabled");
assert.ok(Date.now() - marker.startedAt < 5 * 60_000, "test-app launch proof expired");
try { process.kill(runnerPid, 0); } catch { throw new Error("E2E blocked: controlled test-app launcher is not running"); }

const client = new pg.Client({ connectionString: databaseUrl.toString(), connectionTimeoutMillis: 3000 });
await client.connect();
try {
  const identity = await client.query("SELECT current_database() AS db, current_user AS role, current_setting('server_version') AS version, inet_server_addr()::text AS address, to_regclass('public.healthclues_discovery_content')::text AS content_table");
  const row = identity.rows[0];
  assert.equal(row.db, expectedDatabase, "PostgreSQL identity mismatch");
  assert.equal(row.role, "authenticator", "unexpected test database role");
  assert.ok(row.version.startsWith("17.6"), "test PostgreSQL version mismatch");
  assert.equal(row.content_table, "healthclues_discovery_content", "restored HealthClues table missing");
} finally {
  await client.end();
}

const base64url = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const header = base64url({ alg: "HS256", typ: "JWT" });
const now = Math.floor(Date.now() / 1000);
const claims = base64url({ role: "service_role", iss: "healthclues-e2e", iat: now, exp: now + 3600 });
const signingInput = `${header}.${claims}`;
const serviceJwt = `${signingInput}.${createHmac("sha256", testSecret).update(signingInput).digest("base64url")}`;

const typeScript = readFileSync(new URL("../src/data/healthclues-discoveries.ts", import.meta.url), "utf8")
  .replace(/^import .*;\r?\n/gm, "");
const compiled = ts.transpileModule(typeScript, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const tsModule = { exports: {} };
new Function("module", "exports", compiled)(tsModule, tsModule.exports);
const { matchHealthCluesDiscoveries } = tsModule.exports;

async function request(url, init = {}) {
  const response = await fetch(url, init);
  const body = await response.text();
  let json;
  try { json = body ? JSON.parse(body) : null; } catch { json = body; }
  return { response, json };
}

async function admin(path, body, token = adminToken) {
  return request(new URL(path, appUrl), {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function reviewer(path, body, token = reviewerToken) {
  return request(new URL(path, appUrl), {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function dbRead(table, query) {
  const { response, json } = await request(new URL(`/${table}?${query}`, restUrl), {
    headers: { apikey: serviceJwt, Authorization: `Bearer ${serviceJwt}` },
  });
  assert.equal(response.status, 200, `test database query ${table} failed: ${JSON.stringify(json)}`);
  return json;
}

for (const path of [
  "/api/admin/healthclues-discoveries", "/api/admin/analytics", "/api/admin/night-companion-funnel",
  "/api/admin/ebook-library",
]) {
  const result = await request(new URL(path, appUrl));
  assert.equal(result.response.status, 401, `unauthenticated admin GET is refused: ${path}`);
}
const quizReviewerNoAuth = await request(new URL("/api/admin/healthclues-quiz", appUrl));
assert.equal(quizReviewerNoAuth.response.status, 401, "HealthClues quiz preview requires reviewer credentials");
const quizReviewerLegacy = await request(new URL("/api/admin/healthclues-quiz", appUrl), { headers: { Authorization: `Bearer ${adminToken}` } });
assert.equal(quizReviewerLegacy.response.status, 401, "legacy Botly admin credential cannot access quiz authoring");
const quizReviewer = await request(new URL("/api/admin/healthclues-quiz", appUrl), { headers: { Authorization: `Bearer ${reviewerToken}` } });
assert.equal(quizReviewer.response.status, 200, "configured reviewer can access quiz question bank");
assert.ok(Array.isArray(quizReviewer.json.questions), "quiz authoring returns question data");
const discoveryLegacy = await admin("/api/admin/healthclues-discoveries");
assert.equal(discoveryLegacy.response.status, 401, "legacy Botly admin credential cannot read HealthClues content review");
const unauthenticatedWrite = await reviewer("/api/admin/healthclues-discoveries", { action: "import_static_candidates", confirmPendingImport: true }, "");
assert.equal(unauthenticatedWrite.response.status, 401, "unauthenticated admin POST is refused");
const unauthenticatedDispatch = await request(new URL("/api/admin/night-companion-dispatch", appUrl), {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
});
assert.equal(unauthenticatedDispatch.response.status, 401, "unauthenticated reminder dispatch is refused before work is processed");

const rssResponse = await request(new URL("/rss.xml?category=health-tips&limit=5", appUrl));
assert.equal(rssResponse.response.status, 200, "legacy wellness RSS stays available on the isolated test app");
assert.match(rssResponse.response.headers.get("content-type") || "", /application\/xml/i);
assert.match(rssResponse.json, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.ok(rssResponse.json.includes("<item>"), "RSS feed returns existing published Botly articles");

const initialPublic = await request(new URL("/api/healthclues/discoveries", appUrl));
assert.equal(initialPublic.response.status, 200);
assert.deepEqual(initialPublic.json.items, [], "public API starts empty");

const quizAdminInitial = await reviewer("/api/admin/healthclues-quiz");
assert.equal(quizAdminInitial.response.status, 200);
assert.equal(quizAdminInitial.json.persistenceAvailable, true);
assert.equal(quizAdminInitial.json.activeVersion, 0, "Quiz bank starts on the bundled baseline in the isolated test database");
assert.equal(quizAdminInitial.json.questions.length, 96);
for (const branchId of ["S01", "R01", "E01", "N01", "M01", "W01", "L01", "G01"]) {
  assert.ok(quizAdminInitial.json.questions.some(question => question.id === branchId), `reviewed bank retains adaptive branch ${branchId}`);
}
const bundledQuizResponse = await request(new URL("/api/healthclues/quiz-bank", appUrl));
assert.equal(bundledQuizResponse.response.status, 200);
assert.equal(bundledQuizResponse.json.version, 0);
assert.ok(bundledQuizResponse.json.questions.every(question => !Object.hasOwn(question, "note_vi")), "public Quiz API never exposes reviewer notes");
const editedQuizBank = quizAdminInitial.json.questions.map(question => question.id === "C01" ? { ...question, text: "E2E TEST reviewer-managed adult eligibility wording" } : question);
const draftQuizResponse = await reviewer("/api/admin/healthclues-quiz", {
  action: "save_draft", expectedActiveVersion: 0, reason: "TEST: persist a reviewer-managed quiz wording draft", questions: editedQuizBank,
});
assert.equal(draftQuizResponse.response.status, 200, JSON.stringify(draftQuizResponse.json));
assert.equal(draftQuizResponse.json.version, 1);
const invalidQuizStructure = await reviewer("/api/admin/healthclues-quiz", {
  action: "save_draft", expectedActiveVersion: 0, reason: "TEST: preserve safety branch structure", questions: editedQuizBank.map(question => question.id === "C01" ? { ...question, type: "multi" } : question),
});
assert.equal(invalidQuizStructure.response.status, 422, "reviewer cannot silently alter protected Quiz IDs, branches, or answer types");
const unpublishedQuiz = await request(new URL("/api/healthclues/quiz-bank", appUrl));
assert.equal(unpublishedQuiz.json.version, 0, "saving a draft cannot change the player Quiz");
assert.equal(unpublishedQuiz.json.questions.find(question => question.id === "C01").text, quizAdminInitial.json.questions.find(question => question.id === "C01").text);
const missingQuizConfirmation = await reviewer("/api/admin/healthclues-quiz", {
  action: "publish", expectedActiveVersion: 0, reason: "TEST: publishing requires explicit reviewer confirmation", confirmReviewed: false,
});
assert.equal(missingQuizConfirmation.response.status, 422);
const publishQuiz = await reviewer("/api/admin/healthclues-quiz", {
  action: "publish", expectedActiveVersion: 0, reason: "TEST: publish synthetic reviewer wording fixture", confirmReviewed: true,
});
assert.equal(publishQuiz.response.status, 200, JSON.stringify(publishQuiz.json));
assert.equal(publishQuiz.json.version, 1);
const publishedQuiz = await request(new URL("/api/healthclues/quiz-bank", appUrl));
assert.equal(publishedQuiz.response.status, 200);
assert.equal(publishedQuiz.json.version, 1);
assert.equal(publishedQuiz.json.questions.find(question => question.id === "C01").text, "E2E TEST reviewer-managed adult eligibility wording");
for (const branchId of ["S01", "R01", "E01", "N01", "M01", "W01", "L01", "G01"]) {
  assert.ok(publishedQuiz.json.questions.some(question => question.id === branchId), `published bank retains adaptive branch ${branchId}`);
}
assert.ok(publishedQuiz.json.questions.every(question => !Object.hasOwn(question, "note_vi")), "published bank delivery excludes Vietnamese reviewer notes");
const activeQuizAdmin = await reviewer("/api/admin/healthclues-quiz");
assert.equal(activeQuizAdmin.json.activeVersion, 1);
assert.equal(activeQuizAdmin.json.draft, null, "publishing retires the draft state");

const importResult = await reviewer("/api/admin/healthclues-discoveries", { action: "import_static_candidates", confirmPendingImport: true });
assert.equal(importResult.response.status, 200, JSON.stringify(importResult.json));
assert.equal(importResult.json.candidateCount, 17);
assert.equal(importResult.json.insertedCount, 17);
assert.equal(importResult.json.credentialIdentity, "healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN");

const pendingRows = await dbRead("healthclues_discovery_content", "select=id,review_status,status,content_version&order=id.asc");
assert.equal(pendingRows.length, 17);
assert.ok(pendingRows.every(row => row.review_status === "needs_review" && row.status === "draft" && row.content_version === 1));
assert.equal((await dbRead("healthclues_review_audit", "select=id,action,content_id,content_version&action=eq.submitted&limit=30")).length, 17);
assert.deepEqual((await request(new URL("/api/healthclues/discoveries", appUrl))).json.items, [], "pending content stays private");

const adminList = await reviewer("/api/admin/healthclues-discoveries");
assert.equal(adminList.response.status, 200);
assert.equal(adminList.json.persistenceAvailable, true);
const candidates = new Map(adminList.json.candidates.map(item => [item.id, item]));
const ebookCandidates = [...candidates.values()].filter(item => item.id.startsWith("ebook-"));
assert.equal(ebookCandidates.length, 6, "the six static ebook candidates are present for review");
const ebookIds = ebookCandidates.map(item => item.id.slice("ebook-".length));
const publishedEbooks = await dbRead("wellness_ebooks", `id=in.(${ebookIds.join(",")})&status=eq.published&select=id,slug`);
assert.equal(publishedEbooks.length, 6, "every static ebook candidate has a published catalog row");
const ebookSlugById = new Map(publishedEbooks.map(row => [row.id, row.slug]));
for (const candidate of ebookCandidates) {
  assert.equal(candidate.url, `/en/wellness/ebooks/${ebookSlugById.get(candidate.id.slice("ebook-".length))}`, `candidate ${candidate.id} URL resolves from the live test catalog slug`);
}

function reviewPayload(item, changes = {}) {
  return {
    id: item.id, locale: item.locale, url: item.url, title: item.title, summary: item.summary,
    topicTags: item.topicTags, contentType: item.contentType, estimatedMinutes: item.estimatedMinutes,
    ingredients: item.ingredients, instructions: item.instructions, restrictions: item.restrictions,
    countryRelevance: item.countryRelevance, evidence: item.evidence, safetyNotes: item.safetyNotes,
    ...changes,
  };
}

async function review(id, action, reason, changes = {}) {
  const item = candidates.get(id);
  assert.ok(item, `missing candidate ${id}`);
  const result = await reviewer("/api/admin/healthclues-discoveries", {
    action, reason, item: reviewPayload(item, changes),
    confirmReviewed: action === "approved" || action === "activated",
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.json));
  return result.json;
}

const noSourcePayload = reviewPayload(candidates.get("ebook-blood-sugar"));
for (const action of ["approved", "activated"]) {
  const noSourceResult = await reviewer("/api/admin/healthclues-discoveries", {
    action, reason: "TEST: " + action + " must refuse candidates without a source", item: noSourcePayload, confirmReviewed: true,
  });
  assert.equal(noSourceResult.response.status, 422, action + " refuses a candidate without evidence sources");
}
assert.equal((await dbRead("healthclues_discovery_content", "select=id,review_status,status&id=eq.ebook-blood-sugar"))[0].review_status, "needs_review");
const testOnlySource = { summary: "E2E TEST fixture only; not a medical citation.", sources: [{ label: "E2E TEST fixture only", url: "https://example.org/healthclues-test-fixture" }] };
await review("ebook-blood-sugar", "approved", "TEST: editorial approval step", { evidence: testOnlySource, topicTags: ["healthy-weight"] });
let row = (await dbRead("healthclues_discovery_content", "select=id,review_status,status,content_version&id=eq.ebook-blood-sugar"))[0];
assert.equal(row.review_status, "reviewed");
assert.equal(row.status, "draft");
assert.equal(row.content_version, 2);
assert.deepEqual((await request(new URL("/api/healthclues/discoveries", appUrl))).json.items, [], "approved draft stays private");

const goutNoDelivery = await reviewer("/api/admin/healthclues-discoveries", {
  action: "activated", reason: "TEST: do not activate an ebook without a file or public source",
  item: reviewPayload(candidates.get("ebook-gout-support"), { evidence: testOnlySource }), confirmReviewed: true,
});
assert.equal(goutNoDelivery.response.status, 422, "ebook activation refuses a catalog page with no deliverable");
assert.equal((await dbRead("healthclues_discovery_content", "select=id,review_status,status&id=eq.ebook-gout-support"))[0].review_status, "needs_review");

const recipeFixtureId = "published-bfcb5665-5c32-4139-a5e0-4c918aaffd30";
const recipeCandidate = candidates.get(recipeFixtureId);
assert.ok(recipeCandidate, "a real structured-recipe Botly candidate is available from the restored snapshot");
assert.equal(recipeCandidate.contentType, "recipe", "the selected Botly candidate is classified as a recipe");
await review(recipeFixtureId, "approved", "TEST: approve isolated recipe matching fixture", {
  url: "https://example.org/healthclues-test-recipe",
  title: "E2E TEST Simple Meal Recipe",
  summary: "TEST ONLY: verifies recipe matching and card delivery; makes no nutrition or health claim.",
  topicTags: ["healthy-weight"], contentType: "recipe", estimatedMinutes: 5,
  ingredients: ["TEST ingredient: oats", "TEST ingredient: berries"],
  instructions: ["TEST step: combine the listed ingredients."],
  restrictions: [], countryRelevance: [], evidence: testOnlySource,
  safetyNotes: "TEST ONLY. This synthetic card is isolated E2E data, not a real recommendation.",
});
await review(recipeFixtureId, "activated", "TEST: activate isolated Healthy Weight recipe fixture", {
  url: "https://example.org/healthclues-test-recipe",
  title: "E2E TEST Simple Meal Recipe",
  summary: "TEST ONLY: verifies recipe matching and card delivery; makes no nutrition or health claim.",
  topicTags: ["healthy-weight"], contentType: "recipe", estimatedMinutes: 5,
  ingredients: ["TEST ingredient: oats", "TEST ingredient: berries"],
  instructions: ["TEST step: combine the listed ingredients."],
  restrictions: [], countryRelevance: [], evidence: testOnlySource,
  safetyNotes: "TEST ONLY. This synthetic card is isolated E2E data, not a real recommendation.",
});
await review("static-article-meditation-for-restless-beginners", "activated", "TEST: activate short Sleep activity");
row = (await dbRead("healthclues_discovery_content", "select=id,review_status,status,content_version&id=eq.published-bfcb5665-5c32-4139-a5e0-4c918aaffd30"))[0];
assert.equal(row.status, "published");
assert.equal(row.content_version, 2);
const pendingGoutRows = await dbRead("healthclues_discovery_content", "select=id&topic_tags=cs.{gout-uric-acid}&review_status=eq.needs_review&status=eq.draft");
assert.deepEqual(new Set(pendingGoutRows.map(item => item.id)), new Set(["ebook-gout-support", "external-niams-gout-overview"]));

const activeResponse = await request(new URL("/api/healthclues/discoveries", appUrl));
assert.equal(activeResponse.response.status, 200);
const activeItems = activeResponse.json.items;
assert.deepEqual(new Set(activeItems.map(item => item.id)), new Set([recipeFixtureId, "static-article-meditation-for-restless-beginners"]));
const publicRecipeFixture = activeItems.find(item => item.id === recipeFixtureId);
assert.equal(publicRecipeFixture.contentType, "recipe");
assert.equal(publicRecipeFixture.estimatedMinutes, 5);
assert.match(publicRecipeFixture.title, /^E2E TEST/);
const publicJson = JSON.stringify(activeItems);
for (const privateKey of ["reviewedBy", "reviewedAt", "actor_identity", "content_version", "reason", "healthclues_profiles"]) {
  assert.ok(!publicJson.includes(privateKey), `public API must omit ${privateKey}`);
}

const profile = overrides => ({
  topic: "Healthy weight", contentPreferences: ["Food & recipes"], presentation: "Step-by-step recipes",
  comfortableActivityTime: "5 minutes", refreshFrequency: "Daily", twoWeekGoal: "Explore simple recipes", ...overrides,
});
assert.equal(matchHealthCluesDiscoveries(profile(), activeItems)[0]?.id, recipeFixtureId, "live API delivers a recipe for the Healthy Weight recipe profile");
const goutProfile = profile({ topic: "Gout & uric acid", contentPreferences: ["Everyday habits"], presentation: "Short research summaries" });
assert.equal(matchHealthCluesDiscoveries(goutProfile, activeItems).length, 0, "unreviewed Gout content is not recommended");
const sleepProfile = profile({ topic: "Sleep & rest", contentPreferences: ["Everyday habits"], presentation: "Quick daily cards", comfortableActivityTime: "10–15 minutes", specificInterests: ["Relaxation"] });
assert.equal(matchHealthCluesDiscoveries(sleepProfile, activeItems)[0]?.id, "static-article-meditation-for-restless-beginners", "live API content matches Sleep");

const auditResponse = await reviewer(`/api/admin/healthclues-discoveries?auditContentId=${recipeFixtureId}`);
assert.equal(auditResponse.response.status, 200);
const weightAudit = auditResponse.json.audit;
assert.deepEqual(weightAudit.slice(0, 2).map(event => event.action), ["activated", "approved"]);
assert.ok(weightAudit.every(event => event.actor_identity === "healthclues_reviewer_credential:HEALTHCLUES_REVIEWER_TOKEN"));
assert.ok(weightAudit.slice(0, 2).every(event => event.reason.startsWith("TEST:")));
assert.deepEqual(weightAudit.slice(0, 2).map(event => event.content_version), [2, 1]);
assert.equal(weightAudit[0].old_status, "draft");
assert.equal(weightAudit[0].new_status, "published");
const ebookAudit = await reviewer("/api/admin/healthclues-discoveries?auditContentId=ebook-blood-sugar");
assert.deepEqual(ebookAudit.json.audit.map(event => event.action), ["approved", "submitted"], "static candidate import and editorial approval are both audited");

const forbiddenAuditPatch = await request(new URL(`/healthclues_review_audit?content_id=eq.${recipeFixtureId}`, restUrl), {
  method: "PATCH", headers: { apikey: serviceJwt, Authorization: `Bearer ${serviceJwt}`, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ reason: "tampered" }),
});
assert.ok([401, 403, 404].includes(forbiddenAuditPatch.response.status), "audit cannot be updated through REST");

await review(recipeFixtureId, "deactivated", "TEST: deactivate and remove from delivery");
row = (await dbRead("healthclues_discovery_content", `select=id,review_status,status,content_version&id=eq.${recipeFixtureId}`))[0];
assert.equal(row.status, "archived");
assert.equal(row.content_version, 3);
const afterDeactivate = await request(new URL("/api/healthclues/discoveries", appUrl));
assert.equal(afterDeactivate.response.status, 200);
assert.ok(!afterDeactivate.json.items.some(item => item.id === recipeFixtureId));
assert.ok(afterDeactivate.json.items.some(item => item.id === "static-article-meditation-for-restless-beginners"));

const testLeadEmail = `healthclues-e2e-${randomUUID()}@example.invalid`;
let testLeadId = "";
try {
  let leadResponse;
  try {
    leadResponse = await fetch(new URL("/api/ebooks/lead", appUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": `198.51.100.${1 + Math.floor(Math.random() * 200)}` },
      body: JSON.stringify({
        email: testLeadEmail, ebookId: "blood-sugar", locale: "en",
        sourcePage: "/e2e-test/ebook-funnel", deliveryConsent: true, marketingConsent: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    throw new Error(`ebook lead API request failed at the loopback boundary (${cause instanceof Error ? cause.name : "network error"})`);
  }
  const leadJson = await leadResponse.json();
  assert.equal(leadResponse.status, 200, "ebook lead capture API succeeds on the restored test database");
  assert.equal(leadJson.ok, true);
  assert.match(leadJson.leadId, /^[0-9a-f-]{36}$/i);
  testLeadId = leadJson.leadId;
  const downloadUrl = new URL(leadJson.downloadUrl, appUrl);
  assert.equal(downloadUrl.origin, appUrl.origin, "ebook download token remains on the test app origin");
  assert.equal(downloadUrl.pathname, "/ebooks/blood-sugar/healthclues-blood-sugar-guide.pdf", "ebook uses the restored record's approved local file path");
  const leadRows = await dbRead("ebook_email_leads", `id=eq.${encodeURIComponent(testLeadId)}&select=id,ebook_id,marketing_consent_at`);
  assert.equal(leadRows.length, 1, "lead is persisted in the isolated test database");
  assert.equal(leadRows[0].ebook_id, "blood-sugar");
  assert.equal(leadRows[0].marketing_consent_at, null, "delivery consent does not imply marketing consent");
  const fileResponse = await fetch(downloadUrl, { signal: AbortSignal.timeout(30_000) });
  assert.equal(fileResponse.status, 200, "signed ebook download returns a real file");
  assert.match(fileResponse.headers.get("content-type") || "", /application\/pdf/i);
  const fileBytes = Buffer.from(await fileResponse.arrayBuffer());
  assert.ok(fileBytes.length > 1024, "downloaded PDF has substantive content");
  assert.equal(fileBytes.subarray(0, 5).toString("ascii"), "%PDF-", "download body is a PDF");
  const downloadLog = await dbRead("ebook_download_logs", `lead_id=eq.${encodeURIComponent(testLeadId)}&event=eq.downloaded&select=id,ebook_id,event`);
  assert.equal(downloadLog.length, 0, "public asset downloads do not claim server-side download telemetry");
  console.log("Ebook funnel HTTP E2E passed: test-only lead, separate marketing consent, loopback-only file URL, real PDF download, and persisted lead; direct asset download is not counted in server download logs.");
} finally {
  if (testLeadId) {
    for (const [table, filter] of [["ebook_download_logs", `lead_id=eq.${encodeURIComponent(testLeadId)}`], ["ebook_email_leads", `id=eq.${encodeURIComponent(testLeadId)}`]]) {
      const cleanup = await request(new URL(`/${table}?${filter}`, restUrl), {
        method: "DELETE", headers: { apikey: serviceJwt, Authorization: `Bearer ${serviceJwt}`, Prefer: "return=minimal" },
      });
      assert.ok([200, 204].includes(cleanup.response.status), `test-only ebook data cleanup failed for ${table}`);
    }
  }
}

const dashboardBrowser = spawnSync(process.execPath, [fileURLToPath(new URL("./test-healthclues-dashboard-browser-e2e.mjs", import.meta.url))], {
  cwd: process.cwd(), env: process.env, stdio: "inherit", windowsHide: true,
});
assert.equal(dashboardBrowser.status, 0, "signed-in dashboard browser E2E failed");

console.log("HealthClues review and dashboard HTTP/browser E2E passed (admin review/audit, account-owned profile, check-in history, return visit, deletion, and responsive layouts).");
