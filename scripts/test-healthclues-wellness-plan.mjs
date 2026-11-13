import assert from "node:assert/strict";
import { assessPersonalGoal, buildHabitPlanGoal, buildPersonalPlanGoal, buildWellnessPlanSuggestions, evaluateHabitGoalSafety, personalizeHabitCandidates, resolveWellnessTopicId, validateConfiguredGoal, WELLNESS_HABIT_LIBRARY, WELLNESS_TOPIC_CONFIG } from "../src/features/healthclues/wellness-plan.ts";
import { createDiscoveryProfile } from "../src/lib/healthclues-quiz.ts";

const base = { topic: "Gout & uric acid", contentPreferences: ["Foods and drinks"], specificInterests: ["Sugary drinks"], presentation: "", comfortableActivityTime: "10 minutes", refreshFrequency: "Weekly", twoWeekGoal: "Explore everyday habits", createdAt: new Date(0).toISOString(), safetyLevel: "none", safetyContext: { foodAllergy: "unknown", foodRestriction: "unknown", professionalRestriction: "unknown", activityRestriction: "unknown", medicationOrSupplement: "unknown", acutePainfulJoint: "unknown", urgentSymptoms: "unknown", fluidRestriction: "unknown" } };
const candidates = buildWellnessPlanSuggestions(base, [], "gout-uric-acid", WELLNESS_HABIT_LIBRARY);
assert.ok(candidates.length >= 6, "Gout playbook supplies source-grounded local candidates without relying on the generic Catalog");
assert.ok(candidates.filter(item => item.candidate.group === "build").length >= 3);
assert.ok(candidates.some(item => item.candidate.group === "reduce" && item.candidate.id.includes("sugary-drinks")));
assert.ok(candidates.every(item => item.candidate.demoOnly && item.candidate.evidenceSources.every(source => source.url.startsWith("https://"))));
assert.equal(candidates.some(item => /mindfulness note|notice a detail/i.test(item.candidate.name)), false, "irrelevant generic fixtures are not used as Gout fillers");
assert.match(candidates.find(item => item.candidate.id.includes("sugary-drinks")).reason, /Sugary drinks/i, "rationale uses saved quiz interest");
assert.equal(candidates.find(item => item.candidate.id.includes("gout-hydration")).safetyStatus, "insufficient_information", "unknown fluid safety blocks activation");
assert.equal(candidates.find(item => item.candidate.id.includes("gout-gentle-movement")).safetyStatus, "insufficient_information", "unknown activity context blocks activation");
assert.equal(candidates.find(item => item.candidate.id.includes("gout-alcohol-awareness")).safetyStatus, "insufficient_information", "alcohol change requires clarification");
assert.equal(evaluateHabitGoalSafety("gout-hydration-guidance", base, { fluidGuidanceConfirmed: true }).allowed, false, "missing fluid safety cannot be bypassed with a checkbox");
assert.equal(evaluateHabitGoalSafety("gout-hydration-guidance", { ...base, safetyContext: { ...base.safetyContext, fluidRestriction: "no" } }, { fluidGuidanceConfirmed: true }).allowed, true, "hydration requires existing individualized guidance and no reported restriction");
assert.equal(evaluateHabitGoalSafety("gout-gentle-movement", { ...base, safetyContext: { ...base.safetyContext, acutePainfulJoint: "yes", activityRestriction: "no" } }, { movementConfirmed: true }).allowed, false, "acute painful joint blocks movement goal");
assert.equal(evaluateHabitGoalSafety("gout-gentle-movement", { ...base, safetyContext: { ...base.safetyContext, acutePainfulJoint: "no", activityRestriction: "no" } }, { movementConfirmed: true }).allowed, true, "movement requires both relevant self-reported safety answers");
assert.equal(evaluateHabitGoalSafety("gout-alcohol-awareness", base, { alcoholRisk: "yes" }).allowed, false, "heavy/daily use or withdrawal concern blocks reduction challenge");
assert.equal(evaluateHabitGoalSafety("gout-alcohol-awareness", base, { alcoholRisk: "unknown" }).status, "insufficient_information");

const sleep = { ...base, topic: "Sleep & rest", contentPreferences: ["Relaxation"], specificInterests: ["Wind-down"], twoWeekGoal: "Build a consistent sleep routine" };
const sleepSuggestions = buildWellnessPlanSuggestions(sleep, [], "sleep-better", WELLNESS_HABIT_LIBRARY);
assert.ok(sleepSuggestions.length >= 3 && sleepSuggestions.every(item => item.candidate.id.startsWith("habit:sleep-")), "Sleep uses its own playbook");
assert.equal(sleepSuggestions.some(item => item.candidate.id.includes("sugary-drinks")), false, "Gout diet restrictions do not leak to Sleep");
const digestion = { ...base, topic: "Digestion & Gut Health", specificInterests: ["bloating"], contentPreferences: ["food"] };
assert.equal(resolveWellnessTopicId(digestion.topic), null, "Digestion remains an explicitly unsupported topic until its knowledge coverage is reviewed");
assert.deepEqual(buildWellnessPlanSuggestions(digestion, [], "health-concern", WELLNESS_HABIT_LIBRARY), [], "Unsupported Digestion coverage does not get filled with unrelated Sleep, mindfulness, movement, or Gout templates");
const goutPreferenceA = personalizeHabitCandidates(base, WELLNESS_HABIT_LIBRARY);
const goutPreferenceB = personalizeHabitCandidates({ ...base, specificInterests: ["Red meat"], contentPreferences: ["Foods and drinks"] }, WELLNESS_HABIT_LIBRARY);
assert.notEqual(goutPreferenceA.findIndex(item => item.id.includes("sugary-drinks")), goutPreferenceB.findIndex(item => item.id.includes("sugary-drinks")), "Quiz preference changes ranking");
assert.match(goutPreferenceB.find(item => item.id.includes("purine-foods")).whyThis, /Red meat/i, "personal rationale is grounded in the selected answer");

const genericProfile = { ...base, topic: "General wellness" };
const genericCandidate = { id: "generic", version: 1, name: "Generic mindfulness", description: "Learn", kind: "mindfulness", category: "mindfulness", evidenceClass: "not_assessed", evidenceSummary: null, evidenceSources: [{ title: "Example", url: "https://example.org" }], safetyNotes: null, recommendationEligible: true, demoOnly: true, personalizationEligibility: "eligible", topicTags: ["general-wellness"], goalTags: [], preferenceTags: [] };
assert.deepEqual(buildWellnessPlanSuggestions(digestion, [genericCandidate], "health-concern", WELLNESS_HABIT_LIBRARY), [], "unsupported topics fail closed even when unrelated Catalog tags are also unrecognized");
assert.equal(buildWellnessPlanSuggestions(genericProfile, [genericCandidate], "general-wellness").length, 1, "non-playbook topics still use exact-tagged Catalog material");
assert.equal(buildWellnessPlanSuggestions(base, [genericCandidate], "gout-uric-acid", []).length, 0, "Gout never receives unrelated Catalog filler");
const sleepCatalogCandidate = { ...genericCandidate, id: "sleep-reading", name: "Sleep education", topicTags: ["sleep-insomnia"] };
assert.equal(buildWellnessPlanSuggestions(base, [sleepCatalogCandidate], "sleep-better", []).length, 0, "a mismatched Journey identifier cannot override the selected Quiz topic");

assert.equal(assessPersonalGoal({ title: "Drink 2 liters water", category: "nutrition", goalType: "maintain", profile: base }).allowed, false);
assert.equal(assessPersonalGoal({ title: "Stop prescribed medication", category: "general routine", goalType: "avoid", profile: base }).allowed, false);
assert.equal(assessPersonalGoal({ title: "Stop drinking alcohol suddenly", category: "general routine", goalType: "avoid", profile: base }).allowed, false);
assert.equal(assessPersonalGoal({ title: "Take herbal supplement", category: "nutrition", goalType: "maintain", profile: base }).allowed, false, "the onboarding goal builder keeps therapies for in-world discovery");
const personal = buildPersonalPlanGoal({ title: "Reduce sugary drinks", category: "nutrition", goalType: "reduce", frequency: "3 days a week", trackingUnit: "servings per week", targetValue: 3, targetUnit: "servings per week", durationDays: 3, trackingDefinition: "I will count servings I self-report" });
assert.equal(personal.provenance, "user_created");
assert.equal(personal.targetValue, 3);
assert.equal(validateConfiguredGoal(personal), null);
assert.notEqual(validateConfiguredGoal({ ...personal, frequency: "Flexible" }), null, "undefined flexible schedules cannot activate");
assert.notEqual(validateConfiguredGoal({ ...personal, trackingDefinition: "" }), null, "measurement rule is required");
const activeMovement = buildHabitPlanGoal({ candidate: candidates.find(item => item.candidate.id.includes("gentle-movement")).candidate, template: WELLNESS_HABIT_LIBRARY.find(item => item.id === "gout-gentle-movement"), frequency: "3 days a week", trackingDefinition: "12 minutes/session", trackingUnit: "minutes per session", targetValue: 12, targetUnit: "minutes/session", durationDays: null, safetyStatus: "eligible_for_personal_choice" });
assert.equal(activeMovement.targetValue, 12);
assert.equal(activeMovement.provenance, "habit_library");

for (const topic of ["Gout / uric acid", "Type 2 Diabetes", "Sleep / Insomnia", "Migraine", "Weight Management", "General Wellness"]) {
  assert.ok(resolveWellnessTopicId(topic), `topic is represented in shared config: ${topic}`);
}
assert.equal(WELLNESS_TOPIC_CONFIG.length, 6, "topic support is represented by shared data config");
const quizProfile = createDiscoveryProfile({ C01: "Yes", C04: "Gout & uric acid", G06: "No" });
assert.equal(quizProfile?.safetyContext?.fluidRestriction, "unknown", "food restriction answer is not misused as fluid safety confirmation");
const diabetes = { ...base, topic: "Type 2 Diabetes", specificInterests: ["Movement"], contentPreferences: ["movement"] };
assert.deepEqual(buildWellnessPlanSuggestions(diabetes, [], "type-2-diabetes", WELLNESS_HABIT_LIBRARY), [], "no invented condition-specific items when approved/demo templates are absent");
const diabetesCatalogCandidate = { ...genericCandidate, id: "diabetes-reading", name: "Diabetes general education", topicTags: ["type-2-diabetes"] };
assert.equal(buildWellnessPlanSuggestions(diabetes, [diabetesCatalogCandidate], "type-2-diabetes", []).length, 1, "shared engine can retrieve a properly mapped topic item");
const botanicalCandidate = { ...diabetesCatalogCandidate, id: "botanical-item", name: "Herbal therapy", kind: "lifestyle" };
assert.equal(buildWellnessPlanSuggestions(diabetes, [botanicalCandidate], "type-2-diabetes", []).length, 0, "post-Quiz retrieval excludes botanicals and therapies");
const migraine = { ...base, topic: "Migraine" };
assert.equal(buildWellnessPlanSuggestions(migraine, [], "migraine", WELLNESS_HABIT_LIBRARY).length, 0, "unsupported topic returns coverage gap, not unrelated filler");
const goutMovementRestricted = { ...base, safetyContext: { ...base.safetyContext, activityRestriction: "yes", acutePainfulJoint: "no" } };
assert.equal(buildWellnessPlanSuggestions(goutMovementRestricted, [], "gout", WELLNESS_HABIT_LIBRARY).find(item => item.candidate.id.includes("gentle-movement")).safetyStatus, "ineligible", "movement restriction is a generic hard gate");
assert.equal(evaluateHabitGoalSafety("missing-template", base, {}).allowed, false, "server rejects removed or unknown template IDs");
console.log("PASS: shared multi-topic wellness library, deterministic personalization, honest coverage gaps, target validation and safety gates (42 assertions)");
