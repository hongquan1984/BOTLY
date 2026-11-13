import assert from "node:assert/strict";
import { rankPersonalizedRecommendations } from "../src/features/healthclues/personalized-recommendations.ts";

const candidates = [
  { id: "food", version: 1, name: "Food learning", description: "TEST ONLY", category: "nutrition", slot: "consume", topicTags: ["gout-uric-acid"], goalTags: ["long-term lifestyle"], preferenceTags: ["food"], requiresKnownFoodSafety: true, demoOnly: true, recommendationEligible: true, personalizationEligibility: "eligible", evidenceClass: "not_assessed" },
  { id: "walk", version: 1, name: "Walking education", description: "TEST ONLY", category: "movement", slot: "practice", topicTags: ["gout-uric-acid"], goalTags: ["activity and daily routine"], preferenceTags: ["gentle movement"], estimatedMinutes: 10, requiresKnownActivitySafety: true, demoOnly: true, recommendationEligible: true, personalizationEligibility: "eligible", evidenceClass: "not_assessed" },
  { id: "wind", version: 1, name: "Relaxation education", description: "TEST ONLY", category: "practices", slot: "practice", topicTags: ["gout-uric-acid"], goalTags: ["long-term lifestyle"], preferenceTags: ["relaxation"], demoOnly: true, recommendationEligible: true, personalizationEligibility: "eligible", evidenceClass: "not_assessed" },
  { id: "ginger", version: 1, name: "Ginger", description: "TEST ONLY", category: "nutrition", slot: "consume", topicTags: ["gout-uric-acid"], goalTags: ["long-term lifestyle"], preferenceTags: ["botanical"], requiresMedicationContext: true, demoOnly: true, recommendationEligible: true, personalizationEligibility: "eligible", evidenceClass: "not_assessed" },
  { id: "tomato", version: 1, name: "Tomato", description: "TEST ONLY", category: "nutrition", slot: "consume", topicTags: ["general-education"], goalTags: [], preferenceTags: [], demoOnly: true, recommendationEligible: false, personalizationEligibility: "education_only", evidenceClass: "not_assessed" },
];
const base = { topic: "Gout & uric acid", safetyContext: { foodAllergy: "no", professionalRestriction: "no", medicationOrSupplement: "no", acutePainfulJoint: "no", urgentSymptoms: "no", fluidRestriction: "unknown" } };
const foodProfile = { ...base, twoWeekGoal: "long-term lifestyle", contentPreferences: ["Food"], safetyContext: { ...base.safetyContext, medicationOrSupplement: "unknown" } };
const activityProfile = { ...base, twoWeekGoal: "activity and daily routine", contentPreferences: ["Gentle movement"], comfortableActivityTime: "10 minutes" };
const food = rankPersonalizedRecommendations(foodProfile, candidates, { limit: 10 });
const activity = rankPersonalizedRecommendations(activityProfile, candidates, { limit: 10 });
assert.notDeepEqual(food.map(x => x.id), activity.map(x => x.id), "same topic with different goals/preferences yields different ranked IDs");
assert.match(food[0].reason, /goal|interest|selected/);
assert.equal(food.find(x => x.id === "ginger")?.equipmentEligible, false, "unresolved medication context never clears botanical equipment");
assert.equal(food.find(x => x.id === "tomato")?.equipmentEligible, false, "food education does not imply clinical/equipment eligibility");
assert.equal(food.find(x => x.id === "tomato")?.reason.includes("Gout"), false, "ordinary Tomato education is not falsely linked to Gout");
const collectionAware = rankPersonalizedRecommendations(foodProfile, candidates, { savedIds: ["food"], previouslyShownIds: ["food"], limit: 10 });
assert.notEqual(collectionAware[0]?.id, "food", "saved and previously shown entries move behind suitable undiscovered alternatives when available");
assert.ok(collectionAware.find(x => x.id === "food")?.reasonCodes.includes("already_saved"), "explanation records the private Collection state");
const alternativeAware = rankPersonalizedRecommendations(foodProfile, candidates, { alternativeRequestedIds: ["food"], limit: 10 });
assert.notEqual(alternativeAware[0]?.id, "food", "asking for an alternative prioritizes another suitable option without changing equipment");
assert.ok(alternativeAware.find(x => x.id === "food")?.reasonCodes.includes("alternative_requested"), "history records the player's alternative request");
const acute = rankPersonalizedRecommendations({ ...activityProfile, safetyContext: { ...activityProfile.safetyContext, acutePainfulJoint: "yes" } }, candidates, { station: "movement" });
assert.equal(acute.some(x => x.id === "walk" && x.equipmentEligible), false, "acute painful joint blocks movement equipment");
const unknown = rankPersonalizedRecommendations({ ...activityProfile, safetyContext: { ...activityProfile.safetyContext, professionalRestriction: "unknown" } }, candidates, { station: "movement" });
assert.equal(unknown[0]?.status, "insufficient_information", "missing safety context stays unknown");
const allergy = rankPersonalizedRecommendations({ ...foodProfile, safetyContext: { ...foodProfile.safetyContext, foodAllergy: "yes" } }, candidates, { station: "nutrition", limit: 10 });
assert.equal(allergy.find(item => item.id === "food")?.equipmentEligible, false, "a reported allergy blocks food equipment eligibility");
const urgent = rankPersonalizedRecommendations({ ...base, safetyContext: { ...base.safetyContext, urgentSymptoms: "yes" } }, candidates, { limit: 10 });
assert.equal(urgent.some(item => item.equipmentEligible), false, "urgent symptoms block personalized equipment eligibility");
const dismissed = rankPersonalizedRecommendations(base, candidates, { dismissedIds: ["food"], limit: 5 });
assert.equal(dismissed.at(-1)?.id === "food" || dismissed.findIndex(x => x.id === "food") > 0, true, "explicit dismissal changes deterministic ranking");
const prod = rankPersonalizedRecommendations(base, candidates.filter(x => !x.demoOnly), { limit: 5 });
assert.equal(prod.length, 0, "TEST ONLY fixtures do not enter non-demo candidate set");
const unrelated = rankPersonalizedRecommendations({ topic: "Gout & uric acid", contentPreferences: [], twoWeekGoal: "", safetyContext: {} }, [{ ...candidates[2], topicTags: ["general-education"], goalTags: [], preferenceTags: [] }]);
assert.equal(unrelated[0]?.status, "educational_only", "Demo status alone never turns an unrelated fixture into a personalized suggestion");
const untagged = rankPersonalizedRecommendations({ topic: "Gout & uric acid", contentPreferences: [], twoWeekGoal: "", safetyContext: {} }, [{ ...candidates[2], topicTags: [], goalTags: [], preferenceTags: [] }]);
assert.equal(untagged[0]?.status, "educational_only", "missing topic metadata never implies condition relevance");
const reviewedEducation = rankPersonalizedRecommendations(base, [{ ...candidates[0], demoOnly: false, personalizationEligibility: "education_only", recommendationEligible: true }]);
assert.equal(reviewedEducation[0]?.status, "educational_only", "Reviewed education can be surfaced without being promoted as an eligible wellness tool");
console.log("PASS: deterministic personalization, reasons, acute/allergy/urgent/medication gates, education-only distinction, saved/shown/alternative history and demo boundary");
