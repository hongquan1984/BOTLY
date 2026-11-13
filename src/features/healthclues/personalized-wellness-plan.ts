import { z } from "zod";
import type { HealthCluesProfile } from "../../lib/healthclues-quiz";
import { validateAndResolveGoalIcon } from "../../components/healthclues/wellnessIconResolver.ts";

export type LocalizedText = { en: string; vi: string };
const text = z.object({ en: z.string().trim().min(2).max(240), vi: z.string().trim().min(2).max(240) }).strict();
const optionSchema = z.object({ title: text, action: text }).strict();
/** Gemini owns only player-facing copy. IDs, Plan fields, category and safety status are server-owned. */
export const aiWellnessGoalSchema = z.object({
  title: text,
  relevanceReason: text,
  category: z.string().trim().max(80).optional(),
  icon_key: z.string().trim().max(80).optional(),
  iconKey: z.string().trim().max(80).optional(),
  optionA: optionSchema,
  optionB: optionSchema,
}).strict();
export const aiWellnessPlanSchema = z.object({ goals: z.array(aiWellnessGoalSchema).max(12) }).strict();
export type ModelWellnessGoal = z.infer<typeof aiWellnessGoalSchema>;
export type AiWellnessGoal = ModelWellnessGoal & {
  goalId: string;
  category: string;
  iconKey?: string;
  advisorProof?: string;
};

export function buildGeminiWellnessPlanResponseSchema() {
  const localized = { type: "OBJECT", properties: { en: { type: "STRING" }, vi: { type: "STRING" } }, required: ["en", "vi"] } as const;
  const option = { type: "OBJECT", properties: { title: localized, action: localized }, required: ["title", "action"] } as const;
  const goal = {
    type: "OBJECT",
    properties: {
      title: localized,
      relevanceReason: localized,
      category: { type: "STRING" },
      icon_key: { type: "STRING" },
      optionA: option,
      optionB: option,
    },
    required: ["title", "relevanceReason", "optionA", "optionB"],
  } as const;
  return { type: "OBJECT", properties: { goals: { type: "ARRAY", maxItems: 12, items: goal } }, required: ["goals"] } as const;
}

const dangerous = /\b(stop|start|change|reduce|increase|skip|discontinue)\b.{0,45}\b(medication|medicine|prescription|insulin|drug)\b|\b(treat|cure|reverse|prevent|fast|detox|dehydrat|supplement|herb|herbal|dosage|dose|purge|starve|calorie restriction|weight loss|keto|elimination diet|alcohol withdrawal)\b|\b(thuốc|ngừng thuốc|đổi thuốc|điều trị|chữa khỏi|đảo ngược|nhịn ăn|nhịn nước|mất nước|thải độc|thực phẩm bổ sung|liều dùng|thảo mộc|cai rượu|giảm cân|hạn chế calo)\b/i;
function profileText(profile: HealthCluesProfile) {
  const adaptive = profile.adaptiveDiscovery;
  return [profile.topic, profile.twoWeekGoal, ...profile.contentPreferences, ...(profile.specificInterests || []), ...(adaptive ? [adaptive.focusLabel, adaptive.concernDetail || "", ...adaptive.answers.flatMap(item => [...item.answerLabels, item.optionalText || ""])] : [])].join(" ").toLowerCase();
}
function normalize(value: string) { return value.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ""); }
function numericValues(value: string) { return value.match(/\d+(?:[.,]\d+)?/g) || []; }
// Quantities are welcome for everyday experiments; reject quantities that can act as
// medical/dietary limits when no suitable clinical context exists.
const unsupportedHighRiskQuantity = /\b(?:\d+(?:[.,]\d+)?\s*(?:l|l(?:it|\u00edt)|lit(?:er|re)s?|ml|cups?)\s*(?:of\s*)?(?:water|fluid|n\u01b0\u1edbc)|(?:water|fluid|n\u01b0\u1edbc)s?\s*(?:to|at|of|:)?\s*\d+(?:[.,]\d+)?\s*(?:l|l(?:it|\u00edt)|lit(?:er|re)s?|ml|cups?)|\d+\s*(?:kcal|calories|calo|mg\s*(?:of\s*)?(?:sodium|purine)|g\s*(?:of\s*)?(?:sugar|carbs?))|\d+(?:[.,]\d+)?\s*kg\s*(?:per|\/|m\u1ed7i)\s*(?:week|wk|tu\u1ea7n)|(?:lose|weight loss|gi\u1ea3m c\u00e2n)\D{0,20}\d+\s*kg)\b/i;
const implausibleEverydayQuantity = /\b(?:walk|walking|exercise|activity|phone|screen|minutes?|mins?|hours?)\D{0,18}(\d{3,})\s*(?:minutes?|mins?|hours?)?\b/i;
function matchesSelectedConcern(profile: HealthCluesProfile, copy: string) {
  const signals = profileText(profile);
  const text = copy.toLowerCase();
  const focus = `${profile.adaptiveDiscovery?.focusId || ""} ${profile.topic} ${profile.adaptiveDiscovery?.concernDetail || ""}`.toLowerCase();
  if (/sleep|insomnia|ngủ|mất ngủ/.test(focus)) return /\b(sleep|insomnia|bedtime|evening|caffeine|rest)\b|wind[\s-]?down|ngủ|giấc|buổi tối|cà phê|cafein/i.test(text);
  if (/weight-fitness|weight management|fitness|vận động|thể lực/.test(focus)) return /\b(weight|fitness|movement|activity|exercise|meal|nutrition)\b|vận động|tập luyện|ăn uống|bữa ăn/i.test(text);
  if (/stress|căng thẳng|lo âu/.test(focus)) return /\b(stress|relax|breath|mindful|calm)\b|wind[\s-]?down|căng thẳng|thư giãn|thở|chánh niệm/i.test(text);
  if (/gout|uric acid|gút|axit uric/.test(focus)) return /\b(gout|uric acid|meal|food|nutrition)\b|gút|axit uric|bữa ăn|thực phẩm|dinh dưỡng/i.test(text);
  if (/diabetes|đái tháo đường|tiểu đường/.test(focus)) return /\b(diabetes|blood sugar|glucose|meal|food|activity)\b|tiểu đường|đường huyết|bữa ăn|thực phẩm|vận động/i.test(text);
  if (/migraine|headache|đau nửa đầu|đau đầu/.test(focus)) return /\b(migraine|headache|sleep|rest|relax|trigger)\b|đau nửa đầu|đau đầu|giấc ngủ|thư giãn/i.test(text);
  if (profile.adaptiveDiscovery?.concernDetail?.trim()) {
    const terms = profile.adaptiveDiscovery.concernDetail.toLowerCase().match(/[\p{L}]{4,}/gu) || [];
    return terms.some(term => text.includes(term));
  }
  const stop = new Set(["selected", "concern", "focus", "health", "topic", "routine", "improve", "quality", "habit", "journey", "would", "about", "your", "with", "from", "that", "this", "have", "want"]);
  const terms = signals.match(/[\p{L}]{4,}/gu) || [];
  return terms.some(term => !stop.has(term) && text.includes(term));
}

/** Reject only clear unsafe actions and unrelated suggestions; no catalog/source allowlist or inferred quantity. */
export function validateGeneratedWellnessPlan(input: unknown, profile: HealthCluesProfile) {
  const parsed = aiWellnessPlanSchema.parse(input);
  const accepted: ModelWellnessGoal[] = [];
  let semanticRejectedCount = 0;
  let safetyRejectedCount = 0;
  if (profile.safetyLevel === "urgent") return { goals: accepted, omittedCount: parsed.goals.length, semanticRejectedCount: 0, safetyRejectedCount: parsed.goals.length };
  for (const goal of parsed.goals) {
    const copy = [goal.title, goal.relevanceReason, goal.optionA.title, goal.optionA.action, goal.optionB.title, goal.optionB.action].flatMap(value => [value.en, value.vi]);
    if (copy.some(item => dangerous.test(item))) { safetyRejectedCount++; continue; }
    const actions = [goal.optionA.action.en, goal.optionA.action.vi, goal.optionB.action.en, goal.optionB.action.vi];
    if (actions.some(item => unsupportedHighRiskQuantity.test(item) || implausibleEverydayQuantity.test(item))) { safetyRejectedCount++; continue; }
    if (numericValues(goal.optionA.action.en).join(",") !== numericValues(goal.optionA.action.vi).join(",") || numericValues(goal.optionB.action.en).join(",") !== numericValues(goal.optionB.action.vi).join(",")) { semanticRejectedCount++; continue; }
    if (normalize(goal.optionA.action.en) === normalize(goal.optionB.action.en) || normalize(goal.optionA.action.vi) === normalize(goal.optionB.action.vi)) { semanticRejectedCount++; continue; }
    const relevant = matchesSelectedConcern(profile, copy.join(" ")) && matchesSelectedConcern(profile, [goal.relevanceReason.en, goal.relevanceReason.vi].join(" "));
    if (!relevant) { semanticRejectedCount++; continue; }
    const resolvedIcon = validateAndResolveGoalIcon({
      icon_key: goal.icon_key || goal.iconKey,
      category: goal.category,
      title: goal.title,
      relevanceReason: goal.relevanceReason,
      optionA: goal.optionA,
      optionB: goal.optionB,
      profile,
    });
    accepted.push({
      ...goal,
      category: goal.category || resolvedIcon.category,
      iconKey: resolvedIcon.iconKey,
    });
  }
  return { goals: accepted, omittedCount: parsed.goals.length - accepted.length, semanticRejectedCount, safetyRejectedCount };
}

export function inferWellnessCategory(profile: HealthCluesProfile) {
  const signals = profileText(profile);
  if (/sleep|insomnia|ngủ|mất ngủ/.test(signals)) return "sleep";
  if (/movement|activity|exercise|vận động|hoạt động|tập luyện/.test(signals)) return "movement";
  if (/nutrition|food|meal|gout|diabetes|dinh dưỡng|ăn uống|gút|tiểu đường/.test(signals)) return "nutrition";
  if (/stress|relax|mindful|căng thẳng|thư giãn|chánh niệm/.test(signals)) return "relaxation";
  return "general routine";
}

export function localized(value: LocalizedText, locale: "en" | "vi") { return value[locale]; }

export function toAiPlanGoal(goal: AiWellnessGoal, option: "A" | "B", locale: "en" | "vi", testOnly = false) {
  const selected = option === "A" ? goal.optionA : goal.optionB;
  const specificAction = localized(selected.action, locale);
  return {
    goalId: goal.goalId, templateId: null,
    title: specificAction || localized(goal.title, locale),
    category: goal.category, goalType: "maintain" as const,
    choice: "active" as const, frequency: "Flexible", durationMinutes: null,
    trackingUnit: "self-reported completion", trackingDefinition: specificAction, targetValue: null, targetUnit: null, durationDays: null,
    safetyStatus: "eligible_for_personal_choice" as const, provenance: "ai_generated" as const, sourceVersion: 1,
    evidenceStatus: testOnly ? "SYNTHETIC TEST ONLY · NOT PERSONALIZED ADVICE" : "AI-GENERATED · NOT A MEDICAL ASSESSMENT", explanation: localized(goal.relevanceReason, locale), safetyNote: null,
    sources: [], generatedOption: { locale, option, title: localized(selected.title, locale) }, advisorProof: goal.advisorProof,
    iconKey: goal.iconKey || null,
  };
}

export function validatePersistedAiGoal(goal: { title: string; trackingDefinition: string; explanation: string; targetValue?: number | null }): boolean {
  return ![goal.title, goal.trackingDefinition, goal.explanation].some(value => dangerous.test(value)) && (goal.targetValue === null || goal.targetValue === undefined);
}
