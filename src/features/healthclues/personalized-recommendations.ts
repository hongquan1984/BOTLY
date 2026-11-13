/** Deterministic, explainable ranking for the existing RPG Catalog. No diagnosis or efficacy inference. */
export const RECOMMENDATION_RULE_VERSION = "hc-personalized-rules-v1";

export type SafetyState = "yes" | "no" | "unknown";
export type PersonalProfile = {
  topic?: string; twoWeekGoal?: string; contentPreferences?: string[]; comfortableActivityTime?: string;
  specificInterests?: string[]; excludedIngredients?: string[];
  safetyContext?: { foodAllergy?: SafetyState; foodRestriction?: SafetyState; professionalRestriction?: SafetyState; activityRestriction?: SafetyState; medicationOrSupplement?: SafetyState; acutePainfulJoint?: SafetyState; urgentSymptoms?: SafetyState; fluidRestriction?: SafetyState };
  foodSafetyHold?: boolean; activitySafetyHold?: boolean;
};
export type RecommendationCandidate = {
  id: string; version: number; name: string; description: string; category: string; slot: string;
  topicTags: string[]; goalTags: string[]; preferenceTags: string[]; estimatedMinutes?: number | null;
  demoOnly: boolean; recommendationEligible: boolean; personalizationEligibility: "eligible" | "education_only" | "caution" | "unknown";
  requiresMedicationContext?: boolean; requiresKnownFoodSafety?: boolean; requiresKnownActivitySafety?: boolean;
  requiresKnownFluidSafety?: boolean; ingredientTags?: string[]; evidenceClass: string; evidenceSummary?: string | null;
  safetyNotes?: string | null;
};
export type Recommendation = RecommendationCandidate & { status: "eligible_for_personalized_discovery" | "educational_only" | "requires_caution" | "insufficient_information"; equipmentEligible: boolean; reason: string; reasonCodes: string[]; score: number };

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(w => w.length > 2);
function relevantTags(topic: string) {
  const t = words(topic);
  return t.flatMap(w => w === "gout" ? ["gout", "uric", "gout-uric-acid"] : w === "sleep" ? ["sleep", "sleep-better", "rest"] : [w]);
}
function matchesAny(values: string[], needles: string[]) { return values.some(value => { const v = words(value); return needles.some(n => v.some(w => w === n || n.includes(w) || w.includes(n))); }); }

export function rankPersonalizedRecommendations(profile: PersonalProfile, candidates: RecommendationCandidate[], options: { station?: string; dismissedIds?: string[]; alternativeRequestedIds?: string[]; equippedIds?: string[]; trackedIds?: string[]; savedIds?: string[]; previouslyShownIds?: string[]; limit?: number } = {}): Recommendation[] {
  const context = profile.safetyContext ?? {};
  const topicNeedles = relevantTags(profile.topic || "");
  const preferences = [...(profile.contentPreferences || []), ...(profile.specificInterests || [])];
  const excluded = (profile.excludedIngredients || []).flatMap(words);
  const dismissed = new Set(options.dismissedIds || []), equipped = new Set(options.equippedIds || []);
  const tracked = new Set(options.trackedIds || []);
  const saved = new Set(options.savedIds || []), previouslyShown = new Set(options.previouslyShownIds || []);
  const alternativeRequested = new Set(options.alternativeRequestedIds || []);
  const ranked: Recommendation[] = [];
  for (const item of candidates) {
    if (!item.demoOnly && item.personalizationEligibility === "unknown") continue;
    if (options.station && item.category !== options.station) continue;
    const topicMatch = item.topicTags.length > 0 && matchesAny(item.topicTags, topicNeedles);
    const goalMatch = matchesAny(item.goalTags, [profile.twoWeekGoal || "", ...(profile.specificInterests || [])]);
    const preferenceMatch = matchesAny(item.preferenceTags, preferences);
    const minutes = Number.parseInt(profile.comfortableActivityTime || "", 10);
    const timeMismatch = Number.isFinite(minutes) && minutes < 5 && (item.estimatedMinutes ?? 0) > 5;
    const ingredientConflict = excluded.length > 0 && item.ingredientTags?.flatMap(words).some(tag => excluded.includes(tag));
    const acute = context.acutePainfulJoint === "yes" || profile.activitySafetyHold === true;
    const missingFood = (item.requiresKnownFoodSafety && (context.foodAllergy !== "no" || (context.foodRestriction ?? context.professionalRestriction) !== "no")) || (item.requiresKnownFluidSafety && context.fluidRestriction !== "no") || (item.requiresMedicationContext && context.medicationOrSupplement !== "no") || (!profile.safetyContext && profile.foodSafetyHold === true && item.category === "nutrition");
    const missingActivity = (item.requiresKnownActivitySafety && ((context.activityRestriction ?? context.professionalRestriction) !== "no" || (acute && profile.topic?.toLowerCase().includes("gout")))) || (!profile.safetyContext && profile.activitySafetyHold === true && item.category === "movement");
    let status: Recommendation["status"] = "educational_only";
    if (ingredientConflict || (acute && item.category === "movement" && profile.topic?.toLowerCase().includes("gout"))) status = "requires_caution";
    else if (missingFood || missingActivity || context.urgentSymptoms === "yes") status = "insufficient_information";
    else if (item.personalizationEligibility === "eligible" && (topicMatch || goalMatch || preferenceMatch)) status = "eligible_for_personalized_discovery";
    const reasonCodes = [topicMatch && item.topicTags.length ? "topic" : "general_education", goalMatch ? "goal" : "", preferenceMatch ? "preference" : "", timeMismatch ? "time_mismatch" : "", equipped.has(item.id) ? "already_equipped" : "", tracked.has(item.id) ? "already_tracked" : "", saved.has(item.id) ? "already_saved" : "", previouslyShown.has(item.id) ? "previously_shown" : "", alternativeRequested.has(item.id) ? "alternative_requested" : "", dismissed.has(item.id) ? "previously_dismissed" : ""].filter(Boolean);
    const rationale: string[] = [];
    if (topicMatch && item.topicTags.length) rationale.push(`related educational reading for your selected ${profile.topic || "Journey"} interest`);
    if (goalMatch) rationale.push("matches a goal you selected");
    if (preferenceMatch) rationale.push("matches an interest you shared");
    if (saved.has(item.id)) rationale.push("already saved in your Collection");
    if (alternativeRequested.has(item.id)) rationale.push("you asked to see an alternative");
    if (!rationale.length) rationale.push("general educational information available in this Journey");
    if (status !== "eligible_for_personalized_discovery") rationale.push(status === "requires_caution" ? "not offered as a personally suitable practice because of the available safety context" : status === "insufficient_information" ? "personal suitability cannot be established from the information available" : "clinical benefit or personal suitability is not established");
    if (item.demoOnly) rationale.push("TEST ONLY fixture; not human-reviewed");
    const score = (topicMatch ? 8 : 0) + (goalMatch ? 6 : 0) + (preferenceMatch ? 5 : 0) - (timeMismatch ? 4 : 0) - (equipped.has(item.id) ? 7 : 0) - (tracked.has(item.id) ? 5 : 0) - (saved.has(item.id) ? 3 : 0) - (previouslyShown.has(item.id) ? 1 : 0) - (alternativeRequested.has(item.id) ? 8 : 0) - (dismissed.has(item.id) ? 10 : 0);
    ranked.push({ ...item, status, equipmentEligible: status === "eligible_for_personalized_discovery" && item.recommendationEligible, reason: `Shown because it ${rationale.join(" and ")}.`, reasonCodes, score });
  }
  return ranked.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, Math.max(0, Math.min(options.limit ?? 3, 10)));
}
