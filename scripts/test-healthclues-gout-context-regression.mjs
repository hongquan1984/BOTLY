import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseGeminiWellnessPlanResponse } from "../src/features/healthclues/gemini-wellness-plan.ts";
import { toAiPlanGoal } from "../src/features/healthclues/personalized-wellness-plan.ts";
import { advisorCacheIdentity, discoveryContextIdentity, discoveryContextMatchesWorld, localizedDiscoveryConcern, mergeVerifiedDiscoveryProfile } from "../src/features/healthclues/onboarding-context.ts";

const goutProfile = {
  topic: "Gout / high uric acid · HealthClues Realm", contentPreferences: [], presentation: "Choice-based discovery",
  comfortableActivityTime: "Not provided", refreshFrequency: "Not provided", twoWeekGoal: "Explore personal wellness goals",
  createdAt: "synthetic", safetyLevel: "caution", specificInterests: [],
  safetyContext: { foodAllergy: "unknown", foodRestriction: "unknown", professionalRestriction: "unknown", activityRestriction: "unknown", medicationOrSupplement: "unknown", acutePainfulJoint: "unknown", urgentSymptoms: "unknown", fluidRestriction: "unknown" },
  adaptiveDiscovery: { schemaVersion: 1, ageConfirmed: true, focusId: "health-concern", focusLabel: "Gout / high uric acid", answers: [{ questionId: "q-gout-factors", answerIds: ["a-alcohol", "a-red-meat", "a-sweet-drinks", "a-activity"], answerLabels: ["Beer or alcohol", "Red meat", "Sugar-sweetened drinks", "Movement is difficult"] }] },
};
const sleepProfile = {
  ...goutProfile, topic: "Difficulty falling asleep · Sleep Valley", adaptiveDiscovery: { ...goutProfile.adaptiveDiscovery, focusId: "sleep", focusLabel: "Difficulty falling asleep", answers: [{ questionId: "q-sleep-onset-factors", answerIds: ["a-screens"], answerLabels: ["Screen close to bedtime"] }] },
};
const text = (en, vi = en) => ({ en, vi });
const goutGoal = {
  title: text("Notice food and drink patterns", "Theo dõi lựa chọn ăn uống"),
  relevanceReason: text("You selected gout, alcohol, red meat, and sweetened drinks.", "Bạn chọn Gút, bia rượu, thịt đỏ và đồ uống có đường."),
  optionA: { title: text("One small note", "Ghi chú ngắn"), action: text("Notice one food or drink choice that fits your routine this week.", "Tuần này, để ý một lựa chọn ăn uống phù hợp với nếp sinh hoạt của bạn.") },
  optionB: { title: text("A little more detail", "Thêm một chút chi tiết"), action: text("Notice a few food or drink choices and how they fit your routine this week.", "Tuần này, để ý một vài lựa chọn ăn uống và cách chúng phù hợp với nếp sinh hoạt của bạn.") },
};
const sleepGoal = {
  title: text("A gentle bedtime snack", "Bữa phụ nhẹ trước khi ngủ"),
  relevanceReason: text("Explore a simple recipe to wind down at the end of the day.", "Khám phá công thức đơn giản để thư giãn cuối ngày."),
  optionA: { title: text("Prepare a snack", "Chuẩn bị bữa phụ"), action: text("Try a light snack before bedtime.", "Thử một bữa phụ nhẹ trước khi đi ngủ.") },
  optionB: { title: text("Make it a routine", "Tạo nếp sinh hoạt"), action: text("Prepare a light snack as part of your bedtime routine.", "Chuẩn bị bữa phụ nhẹ như một phần của nếp sinh hoạt trước giờ ngủ.") },
};

// Synthetic offline fixtures only. No account service, database, or Gemini request is used.
const pending = { questId: "health-concern", profile: structuredClone(goutProfile) };
const oldPlan = { worldId: "local-world", requestKey: "old-plan", version: 2, goals: [{ goalId: "old-sleep-goal", title: "Existing confirmed plan" }] };
const oldProfile = { ...sleepProfile, preferredLocale: "vi", nickname: "Wayfinder", wellnessPlans: [oldPlan] };
const activated = await mergeVerifiedDiscoveryProfile(oldProfile, pending.profile);
assert.equal(activated.adaptiveDiscovery.answers[0].questionId, "q-gout-factors", "A: verified handoff retains the canonical Gout concern");
assert.equal(activated.adaptiveDiscovery.focusId, "health-concern", "B: selected HealthClues Realm context survives activation");
assert.deepEqual(activated.adaptiveDiscovery.answers[0].answerIds, ["a-alcohol", "a-red-meat", "a-sweet-drinks", "a-activity"], "B: selected factors survive account verification");
assert.equal(activated.wellnessPlans.length, 1, "G: prior confirmed Plans remain in history");
assert.equal(activated.wellnessPlans[0].contextKey, createHash("sha256").update(discoveryContextIdentity(oldProfile)).digest("hex"), "G: legacy history is bound to its original Quiz context without storing raw answers");
assert.equal(activated.preferredLocale, "vi", "profile merge preserves account language preference");
assert.equal(activated.nickname, "Wayfinder", "profile merge preserves player preferences");

assert.equal(discoveryContextMatchesWorld("health-concern", goutProfile), true, "Gout profile matches HealthClues Realm");
assert.equal(discoveryContextMatchesWorld("sleep-better", goutProfile), false, "Gout profile cannot silently route to Sleep Valley");
assert.equal(discoveryContextMatchesWorld("health-concern", sleepProfile), false, "Sleep profile cannot silently route to HealthClues Realm");
assert.equal(discoveryContextMatchesWorld("health-concern", { ...goutProfile, topic: "Sleep Valley · bedtime" }), false, "a profile whose topic contradicts its selected concern is rejected");
assert.equal(discoveryContextMatchesWorld("health-concern", { topic: "", adaptiveDiscovery: undefined }), false, "E: missing context is rejected instead of defaulting to Sleep or generic advice");

assert.throws(() => parseGeminiWellnessPlanResponse(JSON.stringify({ goals: [sleepGoal] }), goutProfile), /validated|invalid|relevant/i, "C: a Sleep-only recommendation set is rejected for a Gout profile");
const parsedGout = parseGeminiWellnessPlanResponse(JSON.stringify({ goals: [goutGoal] }), goutProfile);
assert.equal(parsedGout.goals.length, 1, "F: a relevant synthetic Gout response passes the existing validated goal schema");
const selectedGoal = toAiPlanGoal(parsedGout.goals[0], "A", "en");
assert.equal(selectedGoal.provenance, "ai_generated", "F: validated Gout goal maps to the existing Plan contract");
assert.equal(selectedGoal.generatedOption.option, "A", "F: A/B selection identity reaches the Plan goal");
assert.equal(localizedDiscoveryConcern(goutProfile, "vi"), "Gút / axit uric cao", "Plan UI displays the selected concern, not a generic category");

const first = advisorCacheIdentity({ accountId: "account-a", worldId: "world-a", questId: "health-concern", context: discoveryContextIdentity(goutProfile), locale: "en" });
assert.notEqual(first, advisorCacheIdentity({ accountId: "account-b", worldId: "world-a", questId: "health-concern", context: discoveryContextIdentity(goutProfile), locale: "en" }), "D: Advisor cache identity is account scoped");
assert.notEqual(first, advisorCacheIdentity({ accountId: "account-a", worldId: "world-a", questId: "health-concern", context: discoveryContextIdentity(sleepProfile), locale: "en" }), "D: Advisor cache identity is concern/context scoped");
const viGout = structuredClone(goutProfile);
viGout.adaptiveDiscovery.focusLabel = "Gút / axit uric cao";
viGout.adaptiveDiscovery.answers[0].answerLabels = ["Bia rượu", "Thịt đỏ", "Đồ uống có đường", "Khó vận động"];
assert.equal(discoveryContextIdentity(goutProfile), discoveryContextIdentity(viGout), "H: EN/VI text changes do not mutate canonical concern or factor identity");
assert.equal(localizedDiscoveryConcern(viGout, "en"), "Gout / high uric acid", "H: saved concern is localized without rewriting canonical IDs");

const worldSource = await readFile(new URL("../src/features/healthclues/WellnessWorldGame.tsx", import.meta.url), "utf8");
const builderSource = await readFile(new URL("../src/components/healthclues/WellnessPlanBuilder.tsx", import.meta.url), "utf8");
const advisorSource = await readFile(new URL("../src/app/api/healthclues/wellness-advisor/route.ts", import.meta.url), "utf8");
const worldApiSource = await readFile(new URL("../src/app/api/healthclues/world/route.ts", import.meta.url), "utf8");
const planApiSource = await readFile(new URL("../src/app/api/healthclues/plan/route.ts", import.meta.url), "utf8");
assert.match(worldSource, /mergeVerifiedDiscoveryProfile\(existingProfile, activationContext\.profile\)/, "A: verified callback merges the new Quiz rather than skipping it for existing accounts");
assert.match(builderSource, /worldId \? \{ worldId \}/, "F: World context is sent with the authenticated Advisor request");
assert.match(worldSource, /\.reverse\(\)\.find\(branch => branch\.status === "active"\)/, "selected/latest active region is not resolved to the oldest Sleep branch");
assert.match(advisorSource, /discoveryContextIdentity\(safeProfile\(storedParsed\.data\)\)/, "Advisor verifies the request against the authenticated account's saved Quiz context");
assert.match(advisorSource, /accountId: accountId \|\| `request:/, "D: server result cache includes account identity");
assert.match(worldApiSource, /candidate\.contextKey === currentContextKey/, "G: World API excludes an old-concern Plan from the current view while keeping history");
assert.match(planApiSource, /plan\.contextKey === contextKey/, "G: Plan GET is scoped to the current Quiz context");
assert.match(planApiSource, /plan\.contextKey === currentContextKey/, "G: old-context AI goals cannot be reused as prior accepted goals in the new context");
assert.match(builderSource, /<strong>\{displayFocus\}<\/strong>/, "F: the selected Quiz concern is presented in the Pet guidance");
console.log("PASS: Gout onboarding context regression (synthetic offline fixtures; no Gemini calls)");
