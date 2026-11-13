import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "http://127.0.0.1:3312";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const modeFile = path.join(demoRoot, "gemini-mock-case.txt");
const logsFile = path.join(demoRoot, "owner-demo-next.log");
const psFile = path.join(root, "scripts", "healthclues-advisor-response.ps1");

const profile = {
  topic: "Sleep / Insomnia", contentPreferences: ["Sleep routine"], presentation: "", comfortableActivityTime: "", refreshFrequency: "",
  twoWeekGoal: "Explore a steadier evening routine", safetyLevel: "none", specificInterests: ["Consistent bedtime"], excludedIngredients: [],
  safetyContext: { foodAllergy: "no", foodRestriction: "no", professionalRestriction: "no", activityRestriction: "no", medicationOrSupplement: "no", acutePainfulJoint: "no", urgentSymptoms: "no", fluidRestriction: "no" },
};

async function setMode(mode) { await writeFile(modeFile, mode, "utf8"); }
async function postDirect(mode) {
  const requestId = randomUUID();
  await setMode(mode);
  const response = await fetch(`${base}/api/healthclues/wellness-advisor`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: base, "x-request-id": requestId },
    body: JSON.stringify({ requestId, questId: "sleep", locale: "en", profile }),
  });
  return { requestId, status: response.status, contentType: response.headers.get("content-type"), responseId: response.headers.get("x-request-id"), body: await response.json() };
}
async function postWithPowerShell(mode) {
  const requestId = randomUUID();
  await setMode(mode);
  const command = [
    `. '${psFile.replaceAll("'", "''")}'`,
    "$body = @{ questId = 'sleep'; locale = 'en'; profile = @{ topic = 'Sleep / Insomnia'; contentPreferences = @('Sleep routine'); presentation = ''; comfortableActivityTime = ''; refreshFrequency = ''; twoWeekGoal = 'Explore a steadier evening routine'; safetyLevel = 'none'; specificInterests = @('Consistent bedtime'); excludedIngredients = @(); safetyContext = @{ foodAllergy = 'no'; foodRestriction = 'no'; professionalRestriction = 'no'; activityRestriction = 'no'; medicationOrSupplement = 'no'; acutePainfulJoint = 'no'; urgentSymptoms = 'no'; fluidRestriction = 'no' } } }",
    `$result = Invoke-HealthCluesAdvisorRequest -Uri '${base}/api/healthclues/wellness-advisor' -Origin '${base}' -RequestId '${requestId}' -Body $body`,
    "$result | ConvertTo-Json -Depth 6 -Compress",
  ].join("; ");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command], { windowsHide: true });
    let stdout = "", stderr = "";
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", value => { stdout += value; }); child.stderr.on("data", value => { stderr += value; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve({ requestId, result: JSON.parse(stdout.trim()) }) : reject(new Error(`PowerShell exit ${code}: ${stderr.slice(0, 400)}`)));
  });
}
function getRequestEvents(log, requestId) {
  return log.split(/\r?\n/).flatMap(line => {
    try { const event = JSON.parse(line); return event.requestId === requestId ? [event] : []; } catch { return []; }
  });
}

const success = await postDirect("valid-ab");
assert.equal(success.status, 200, "actual route accepts a valid mocked Gemini response");
assert.match(success.contentType || "", /^application\/json/i);
assert.equal(success.responseId, success.requestId, "response header returns the request correlation ID");
assert.equal(success.body.status, "GEMINI_AI");
assert.equal(success.body.requestId, success.requestId);
assert.equal(success.body.goals.length, 1);
assert.ok(success.body.goals[0].optionA?.action && success.body.goals[0].optionB?.action, "actual route returns the valid synthetic A/B goal after parse, safety validation and signing");

const providerFailure = await postWithPowerShell("provider-503");
assert.equal(providerFailure.result.applicationStatus, 503);
assert.match(providerFailure.result.contentType || "", /^application\/json/i);
assert.equal(providerFailure.result.requestId, providerFailure.requestId);
assert.deepEqual(providerFailure.result.body, { status: "AI_UNAVAILABLE", requestId: providerFailure.requestId, diagnosticCode: "PROVIDER_UNAVAILABLE" });

const invalidPlan = await postWithPowerShell("missing-option-b");
assert.equal(invalidPlan.result.applicationStatus, 503);
assert.equal(invalidPlan.result.requestId, invalidPlan.requestId);
assert.equal(invalidPlan.result.body.diagnosticCode, "RESPONSE_SCHEMA_MISMATCH");

const log = await readFile(logsFile, "utf8");
for (const id of [success.requestId, providerFailure.requestId, invalidPlan.requestId]) assert.ok(getRequestEvents(log, id).length, `server log contains correlation ID ${id}`);
const successEvents = getRequestEvents(log, success.requestId);
assert.ok(successEvents.some(event => event.stage === "PROVIDER_RESPONSE_RECEIVED" && event.providerStatus === 200));
assert.ok(successEvents.some(event => event.stage === "RECOMMENDATIONS_READY" && event.recommendationCount === 1));
const failedEvents = getRequestEvents(log, providerFailure.requestId);
assert.ok(failedEvents.some(event => event.stage === "FAILED" && event.internalErrorCategory === "PROVIDER_UNAVAILABLE" && event.providerStatus === 503));
const schemaEvents = getRequestEvents(log, invalidPlan.requestId);
assert.ok(schemaEvents.some(event => event.stage === "PROVIDER_RESPONSE_RECEIVED" && event.providerStatus === 200));
assert.ok(schemaEvents.some(event => event.stage === "FAILED" && event.failureStage === "SCHEMA_VALIDATED" && event.internalErrorCategory === "RESPONSE_SCHEMA_MISMATCH" && event.schemaIssuePaths.some(part => part.includes("optionB"))));

console.log(JSON.stringify({ result: "PASS_LOCAL_MOCKED_ADVISOR_ROUTE", url: base, success: { status: success.status, requestId: success.requestId, goalsWithAB: success.body.goals.length }, providerFailure: { status: providerFailure.result.applicationStatus, requestId: providerFailure.requestId, diagnosticCode: providerFailure.result.body.diagnosticCode, powershell: "5.1" }, schemaFailure: { status: invalidPlan.result.applicationStatus, requestId: invalidPlan.requestId, diagnosticCode: invalidPlan.result.body.diagnosticCode, failedStage: "SCHEMA_VALIDATED", issuePathContainsOptionB: true } }, null, 2));
