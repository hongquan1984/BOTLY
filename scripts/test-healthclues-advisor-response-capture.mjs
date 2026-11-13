import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const psScript = path.join(root, "scripts", "healthclues-advisor-response.ps1");
const requestId = "8b8d78df-e53d-4700-8a42-60a1cc0c8115";
const server = createServer((request, response) => {
  let input = "";
  request.setEncoding("utf8");
  request.on("data", chunk => { input += chunk; });
  request.on("end", () => {
    const body = JSON.parse(input);
    assert.equal(body.requestId, requestId);
    assert.equal(request.headers["x-request-id"], requestId);
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("X-Request-Id", requestId);
    if (request.url === "/mock-success") {
      response.writeHead(200);
      response.end(JSON.stringify({ status: "GEMINI_AI", requestId, goals: [{ goalId: "sleep-routine", category: "sleep", title: "Sleep routine", relevanceReason: "Mock fixture reason", optionA: { title: "A", action: "A safe synthetic action", target: { value: null, unit: null, frequency: null, period: null } }, optionB: { title: "B", action: "A distinct safe synthetic action", target: { value: 6, unit: "hours", frequency: "weekly", period: "two weeks" } }, evidenceSourceIds: ["nhlbi_sleep"], safetyConditions: [], advisorProof: "DO_NOT_EXPOSE_PROOF" }], apiKey: "DO_NOT_EXPOSE", profile: { topic: "secret-health-data" } }));
    } else {
      response.writeHead(503);
      response.end(JSON.stringify({ status: "AI_UNAVAILABLE", requestId, diagnosticCode: "PROVIDER_UNAVAILABLE", error: "Gemini is temporarily unavailable.", apiKey: "DO_NOT_EXPOSE", profile: { topic: "secret-health-data" }, prompt: "secret prompt" }));
    }
  });
});

function invokePowerShell(uri, includePlan = false) {
  const command = [
    `. '${psScript.replaceAll("'", "''")}'`,
    "$body = @{ questId = 'sleep'; locale = 'en'; profile = @{ topic = 'sleep'; safetyLevel = 'none'; contentPreferences = @(); specificInterests = @(); excludedIngredients = @(); safetyContext = @{} } }",
    `$result = Invoke-HealthCluesAdvisorRequest -Uri '${uri}' -Origin '${new URL(uri).origin}' -RequestId '${requestId}' -Body $body${includePlan ? " -IncludeGeneratedPlan" : ""}`,
    "$result | ConvertTo-Json -Depth 6 -Compress",
  ].join("; ");
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command], { windowsHide: true });
    let stdout = "", stderr = "";
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", value => { stdout += value; }); child.stderr.on("data", value => { stderr += value; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(JSON.parse(stdout.trim())) : reject(new Error(`PowerShell exit ${code}: ${stderr.slice(0, 500)}`)));
  });
}

server.listen(0, "127.0.0.1", async () => {
  try {
    const { port } = server.address();
    const result = await invokePowerShell(`http://127.0.0.1:${port}/mock-advisor`);
    assert.equal(result.applicationStatus, 503);
    assert.match(result.contentType, /^application\/json/i);
    assert.equal(result.requestId, requestId);
    assert.deepEqual(result.body, { status: "AI_UNAVAILABLE", requestId, diagnosticCode: "PROVIDER_UNAVAILABLE" });
    assert.doesNotMatch(JSON.stringify(result), /DO_NOT_EXPOSE|secret-health-data|secret prompt|temporarily unavailable/);
    const success = await invokePowerShell(`http://127.0.0.1:${port}/mock-success`, true);
    assert.equal(success.applicationStatus, 200);
    assert.equal(success.requestId, requestId);
    assert.deepEqual(success.body.goals[0], { goalId: "sleep-routine", category: "sleep", title: "Sleep routine", relevanceReason: "Mock fixture reason", optionA: { title: "A", action: "A safe synthetic action", target: { value: null, unit: null, frequency: null, period: null } }, optionB: { title: "B", action: "A distinct safe synthetic action", target: { value: 6, unit: "hours", frequency: "weekly", period: "two weeks" } }, evidenceSourceIds: ["nhlbi_sleep"], safetyConditions: [] });
    assert.doesNotMatch(JSON.stringify(success), /DO_NOT_EXPOSE|secret-health-data/);
    console.log("PASS: Windows PowerShell 5.1 captures mocked non-2xx JSON status/content type/request ID and can opt in to a whitelisted synthetic A/B summary; secrets, profile and proof fields are omitted.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally { server.close(); }
});
