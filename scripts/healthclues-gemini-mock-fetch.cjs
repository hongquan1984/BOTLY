// External test-only fetch adapter for the isolated local Owner Demo. Never bundled with Next.
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.join(" ").toLowerCase();
const diagnosticBuild = path.join("D:", "botly", "App", ".tmp", "healthclues-owner-demo", "gemini-diagnostics-20261102").toLowerCase();
const isTargetServer = args.includes("next") && args.includes("start") && args.includes(diagnosticBuild);
if (!isTargetServer) return;

const modeFile = process.env.HEALTHCLUES_GEMINI_MOCK_CASE_FILE;
const supabaseHost = (() => { try { return new URL(process.env.SUPABASE_URL || "").hostname; } catch { return ""; } })();
if (process.env.NODE_ENV !== "production"
  || process.env.HEALTHCLUES_OWNER_DEMO !== "1"
  || process.env.HEALTHCLUES_OWNER_DEMO_PORT !== "3312"
  || !["127.0.0.1", "localhost", "::1"].includes(supabaseHost)
  || process.env.HEALTHCLUES_GEMINI_MOCK_MODE !== "local-diagnostics-only"
  || !modeFile
  || !path.resolve(modeFile).toLowerCase().startsWith(path.join("D:", "botly", "App", ".tmp", "healthclues-owner-demo").toLowerCase() + path.sep)) {
  throw new Error("Refusing mock provider injection outside the guarded local diagnostics build.");
}

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  if (url.hostname !== "generativelanguage.googleapis.com") return realFetch(input, init);
  const mode = fs.readFileSync(modeFile, "utf8").trim();
  let status = 200;
  let payload;
  if (mode === "provider-503") {
    status = 503;
    payload = { error: { code: 503, status: "UNAVAILABLE", message: "mock provider unavailable" } };
  } else if (mode === "valid-ab" || mode === "missing-option-b") {
    const goal = {
      goalId: "sleep-routine-mock",
      category: "sleep",
      title: "Explore a steady sleep routine",
      relevanceReason: "You selected sleep as the focus of this journey.",
      optionA: { title: "Level A", action: "Choose one small wind-down step.", target: { value: null, unit: null, frequency: null, period: null } },
      evidenceSourceIds: ["nhlbi_sleep"],
      safetyConditions: [],
    };
    if (mode === "valid-ab") goal.optionB = { title: "Level B", action: "Notice an evening routine that suits you.", target: { value: null, unit: null, frequency: null, period: null } };
    const plan = { locale: "en", goals: [goal] };
    payload = { modelVersion: "mock-gemini-diagnostics", responseId: `mock-${mode}`, candidates: [{ index: 0, finishReason: "STOP", content: { role: "model", parts: [{ text: JSON.stringify(plan) }] } }] };
  } else {
    status = 500;
    payload = { error: { code: 500, status: "INVALID_ARGUMENT", message: "unknown local mock case" } };
  }
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "x-mock-upstream-status": String(status) } });
};
