import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/healthclues-quiz.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("module", "exports", output)(loaded, loaded.exports);
const { createDiscoveryProfile } = loaded.exports;

const profile = answers => createDiscoveryProfile({ C01: "Yes", C04: "Sleep & rest", ...answers }, "2026-10-28T00:00:00.000Z");
assert.equal(createDiscoveryProfile({ C01: "No" }), null, "under-18 answer must stop profile personalization");
assert.equal(createDiscoveryProfile({ C01: "Not sure" }), null, "uncertain age must not create a personalized profile");
assert.equal(createDiscoveryProfile({}), null, "missing age-gate answer must not create a personalized profile");
assert.equal(createDiscoveryProfile({ C01: ["Yes"] }), null, "malformed age-gate answer must not create a personalized profile");
assert.equal(profile({}).safetyLevel, "none", "skipped safety questions must not fabricate risk answers");
assert.equal(profile({}).foodSafetyHold, false, "skipped safety questions must not trigger a food hold");
assert.equal(profile({}).activitySafetyHold, false, "skipped safety questions must not trigger an activity hold");

for (const answer of ["Yes", "Not sure"]) {
  const result = profile({ C24: answer });
  assert.equal(result.foodSafetyHold, true, `C24=${answer} conservatively blocks food suggestions`);
  assert.equal(result.safetyLevel, "caution", `C24=${answer} creates a caution state`);
}
assert.equal(profile({ C24: "No" }).foodSafetyHold, false, "explicit no allergy response does not create a hold");
assert.equal(profile({ C24: "Prefer not to say" }).foodSafetyHold, false, "declined optional allergy response is not treated as no or as a fabricated hold");

for (const [questionId, property] of [["C25", "foodSafetyHold"], ["C32", "foodSafetyHold"], ["G06", "foodSafetyHold"], ["C25", "activitySafetyHold"], ["G02", "activitySafetyHold"], ["W05", "activitySafetyHold"], ["S06", "activitySafetyHold"]]) {
  for (const answer of ["Yes", "Not sure", "Unsure"]) {
    if ((questionId === "G02" || questionId === "G06" || questionId === "W05" || questionId === "S06") && answer === "Not sure") continue;
    const result = profile({ [questionId]: answer });
    assert.equal(result[property], true, `${questionId}=${answer} conservatively activates ${property}`);
  }
}

assert.equal(profile({ C33: "Yes" }).safetyLevel, "urgent", "new/severe/worsening symptoms receive the urgent safety state");
assert.equal(profile({ C33: "Yes" }).activitySafetyHold, true, "urgent symptom response blocks activity recommendations");
assert.equal(profile({ G03: "Yes" }).safetyLevel, "urgent", "red-flag concern receives urgent safety state");
assert.equal(profile({ G03: "Unsure" }).safetyLevel, "urgent", "uncertain red-flag concern remains conservatively urgent");
assert.equal(profile({ C33: "Prefer not to say" }).safetyLevel, "none", "declining symptom disclosure does not invent a symptom");

const answeredOnly = profile({ C06: ["Everyday habits"] });
assert.deepEqual(answeredOnly.contentPreferences, ["Everyday habits"], "profile stores only explicitly answered preference fields");
assert.deepEqual(answeredOnly.excludedIngredients, [], "no allergy details are invented when the optional answer was skipped");
console.log("HealthClues Quiz safety and skip checks passed (38 assertions).");
