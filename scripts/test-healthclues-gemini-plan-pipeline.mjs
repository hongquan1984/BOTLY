import assert from "node:assert/strict";
import { buildGeminiWellnessPlanResponseSchema, toAiPlanGoal } from "../src/features/healthclues/personalized-wellness-plan.ts";
import { classifyGeminiProviderError, GeminiPlanPipelineError, parseGeminiWellnessPlanResponse, runGeminiPlanPipeline, validateGeminiRequestSchema } from "../src/features/healthclues/gemini-wellness-plan.ts";

const profile = { topic: "Sleep / Insomnia", contentPreferences: ["Sleep routine"], specificInterests: ["Evening caffeine"], twoWeekGoal: "Improve sleep quality", presentation: "", comfortableActivityTime: "", refreshFrequency: "Weekly", createdAt: "", safetyLevel: "none", safetyContext: { activityRestriction: "no", acutePainfulJoint: "no" } };
const makeGoal = (suffix = "") => ({
  title: { en: `Explore a sleep routine${suffix}`, vi: `Khám phá thói quen ngủ${suffix}` },
  relevanceReason: { en: "You selected sleep quality as your focus.", vi: "Bạn chọn cải thiện chất lượng giấc ngủ." },
  optionA: { title: { en: "Small step", vi: "Bước nhỏ" }, action: { en: `Choose a manageable evening wind-down step${suffix}.`, vi: `Chọn một bước thư giãn buổi tối phù hợp${suffix}.` } },
  optionB: { title: { en: "Flexible reflection", vi: "Quan sát linh hoạt" }, action: { en: `Notice which evening routine fits you${suffix}.`, vi: `Quan sát thói quen buổi tối nào phù hợp với bạn${suffix}.` } },
});
const rawPlan = { goals: [makeGoal(" 1"), makeGoal(" 2"), makeGoal(" 3")] };
const expectFailure = (value, category) => assert.throws(() => parseGeminiWellnessPlanResponse(typeof value === "string" ? value : JSON.stringify(value), profile), error => error instanceof GeminiPlanPipelineError && error.category === category, `Expected ${category}`);

assert.deepEqual(validateGeminiRequestSchema(buildGeminiWellnessPlanResponseSchema()), [], "simplified bilingual response contract is valid for Gemini structured output");
const parsed = parseGeminiWellnessPlanResponse(JSON.stringify(rawPlan), profile);
assert.equal(parsed.goals.length, 3);
assert.notEqual(parsed.goals[0].goalId, parsed.goals[1].goalId, "backend assigns unique IDs");
const missingB = structuredClone(rawPlan); delete missingB.goals[0].optionB;
assert.throws(() => parseGeminiWellnessPlanResponse(JSON.stringify(missingB), profile), error => error.category === "RESPONSE_SCHEMA_MISMATCH" && error.schemaIssues.some(issue => issue.path.join(".") === "goals.0.optionB"));
expectFailure("{malformed", "RESPONSE_JSON_PARSE_FAILED");
expectFailure("", "PROVIDER_EMPTY_RESPONSE");
const sameAB = structuredClone(rawPlan); sameAB.goals = [makeGoal()]; sameAB.goals[0].optionB.action = structuredClone(sameAB.goals[0].optionA.action);
expectFailure(sameAB, "RESPONSE_SEMANTIC_INVALID");
const unsafe = structuredClone(rawPlan); unsafe.goals = [makeGoal()]; unsafe.goals[0].optionA.action.en = "Stop prescribed medication and use herbs instead.";
expectFailure(unsafe, "RESPONSE_SAFETY_REJECTED");
const partial = structuredClone(rawPlan); partial.goals[0].optionA.action.vi = "Ngừng thuốc kê đơn.";
assert.equal(parseGeminiWellnessPlanResponse(JSON.stringify(partial), profile).goals.length, 2, "unsafe recommendation does not suppress safe goals");
const mappedA = toAiPlanGoal(parsed.goals[0], "A", "vi");
const mappedB = toAiPlanGoal(parsed.goals[0], "B", "en");
assert.equal(mappedA.trackingDefinition, rawPlan.goals[0].optionA.action.vi);
assert.equal(mappedB.trackingDefinition, rawPlan.goals[0].optionB.action.en);
assert.equal(mappedA.goalId, mappedB.goalId);

for (const [status, category] of [[402, "BILLING_REQUIRED"], [429, "RATE_LIMITED"], [503, "PROVIDER_UNAVAILABLE"]]) {
  const error = classifyGeminiProviderError({ status });
  assert.equal(error.category, category);
  assert.equal(error.upstreamHttpStatus, status);
}
assert.equal(classifyGeminiProviderError(new Error("mock network failure")).upstreamHttpStatus, undefined, "network failure does not invent a provider status");
for (const [name, category, request] of [
  ["malformed JSON", "RESPONSE_JSON_PARSE_FAILED", async () => ({ text: "{" })],
  ["missing option B", "RESPONSE_SCHEMA_MISMATCH", async () => { const value = structuredClone(rawPlan); delete value.goals[0].optionB; return { text: JSON.stringify(value) }; }],
  ["network exception", "PROVIDER_NETWORK_ERROR", async () => { throw new Error("offline mock"); }],
]) await assert.rejects(runGeminiPlanPipeline({ request, profile }), error => error instanceof GeminiPlanPipelineError && error.category === category, name);
let invoked = false;
const stages = [];
const result = await runGeminiPlanPipeline({ request: async () => { invoked = true; return { text: JSON.stringify(rawPlan) }; }, profile, onStage: stage => stages.push(stage) });
assert.ok(invoked);
assert.equal(result.parsed.goals.length, 3);
assert.deepEqual(stages, ["PROVIDER_REQUEST_STARTED", "PROVIDER_RESPONSE_RECEIVED", "JSON_EXTRACTION_STARTED", "JSON_PARSED", "SCHEMA_VALIDATED", "SAFETY_VALIDATED"]);
console.log("PASS: simplified Gemini offline pipeline (bilingual schema, up to six goals, missing A/B, parse/safety failures, mocked provider statuses, A/B persistence mapping)");
