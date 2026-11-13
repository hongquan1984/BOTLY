export type HealthTopic = "Healthy weight" | "Gout & uric acid" | "Sleep & rest" | "Balanced nutrition" | "General wellness";

const ebookTopicMap: Record<string, HealthTopic> = {
  "gout-support": "Gout & uric acid",
  "better-sleep": "Sleep & rest",
  "weight-management": "Healthy weight",
  "blood-sugar": "Balanced nutrition",
  antioxidants: "Balanced nutrition",
};

export function suggestedTopicForEbook(ebookId: string | undefined) {
  return ebookId ? ebookTopicMap[ebookId] ?? null : null;
}

export function validateQuizAttribution(params: Record<string, string | string[] | undefined>) {
  const source = params.source === "ebook" ? "ebook" : "direct";
  const entry = params.entry === "hero" || params.entry === "post_download" ? params.entry : "direct";
  const candidate = typeof params.ebook_id === "string" && /^[a-z0-9-]{1,100}$/.test(params.ebook_id) ? params.ebook_id : "";
  const ebookId = candidate && Object.hasOwn(ebookTopicMap, candidate) ? candidate : "";
  const gameEntry = params.from === "play";
  return { source, entry, ebookId, suggestedTopic: suggestedTopicForEbook(ebookId || undefined), showProfile: !gameEntry && (params.view === "profile" || params.view === "save") };
}

export function getDeepQuestionIds(topic: string, questId = "") {
  const questBranches: Record<string, string> = {
    "sleep-better": "S", "feel-calmer": "R", "more-energy": "E", "eat-healthier": "N",
    "move-more": "M", "healthy-weight": "W", "natural-wellness": "L",
  };
  const branch = questBranches[questId] || (topic === "Gout & uric acid" ? "G" : topic === "Healthy weight" ? "W" : topic === "Sleep & rest" ? "S" : "F");
  return ["C11", "C12", "C16", "C17", "C18", "C20", "C21", "C22", "C23", "C24", "C25", "C32", "C33", ...Array.from({ length: 7 }, (_, index) => `${branch}0${index + 1}`)];
}

export const HEALTHCLUES_DISCLOSURE = "This experience helps you discover general wellness information. It does not diagnose conditions, recommend prescription medicines, or replace healthcare professionals. You can skip sensitive questions.";
export const HEALTHCLUES_SAFETY_NOTICE = "This quiz cannot assess symptoms or determine whether an activity is safe for you. If you have new, severe, or rapidly worsening symptoms, seek timely medical assessment. In an emergency, contact local emergency services.";
export const HEALTHCLUES_RESULT_DISCLAIMER = "Your Discovery Profile reflects your interests and preferences—not a medical diagnosis or treatment plan.";

export type HealthCluesProfile = {
  topic: string;
  contentPreferences: string[];
  presentation: string;
  comfortableActivityTime: string;
  refreshFrequency: string;
  twoWeekGoal: string;
  createdAt: string;
  safetyLevel: "none" | "caution" | "urgent";
  country?: string;
  excludedIngredients?: string[];
  foodSafetyHold?: boolean;
  activitySafetyHold?: boolean;
  specificInterests?: string[];
  /** Explicit answer states; older profiles stay unknown rather than being treated as safe. */
  safetyContext?: {
    foodAllergy: "yes" | "no" | "unknown";
    foodRestriction: "yes" | "no" | "unknown";
    professionalRestriction: "yes" | "no" | "unknown";
    activityRestriction: "yes" | "no" | "unknown";
    medicationOrSupplement: "yes" | "no" | "unknown";
    acutePainfulJoint: "yes" | "no" | "unknown";
    urgentSymptoms: "yes" | "no" | "unknown";
    fluidRestriction: "yes" | "no" | "unknown";
  };
  /** Canonical concern and adaptive answers. Separate from the legacy 96-question answer bank. */
  adaptiveDiscovery?: {
    schemaVersion: 1;
    ageConfirmed: true;
    focusId: "sleep" | "weight-fitness" | "health-concern" | "beauty-skin" | "healthy-aging" | "stress" | "other";
    focusLabel: string;
    concernDetail?: string;
    answers: Array<{ questionId: string; answerIds: string[]; answerLabels: string[]; optionalText?: string }>;
  };
};

function answerState(value: unknown): "yes" | "no" | "unknown" {
  if (value === "Yes") return "yes";
  if (value === "No") return "no";
  return "unknown";
}
function combinedAnswerState(values: unknown[]): "yes" | "no" | "unknown" {
  const answered = values.filter(value => typeof value === "string");
  if (answered.some(value => value === "Yes" || value === "Unsure" || value === "Not sure")) return "yes";
  if (answered.length > 0 && answered.every(value => value === "No")) return "no";
  return "unknown";
}

export function createDiscoveryProfile(answers: Record<string, string | string[]>, createdAt = new Date().toISOString()): HealthCluesProfile | null {
  if (answers.C01 !== "Yes") return null;
  const questPreferences = Object.entries(answers)
    .filter(([id, value]) => /^[RENML]\d{2}$/.test(id) && typeof value === "string")
    .map(([, value]) => value as string);
  return {
    topic: typeof answers.C04 === "string" ? answers.C04 : "General wellness",
    contentPreferences: Array.isArray(answers.C06) ? answers.C06 : [],
    presentation: typeof answers.C07 === "string" ? answers.C07 : "A mix of everything",
    comfortableActivityTime: typeof answers.C08 === "string" ? answers.C08 : "I only want to read",
    refreshFrequency: typeof answers.C09 === "string" ? answers.C09 : "Weekly",
    twoWeekGoal: typeof answers.C10 === "string" ? answers.C10 : "Find interesting new information",
    createdAt,
    safetyLevel: answers.C33 === "Yes" || answers.G03 === "Yes" || answers.G03 === "Unsure" ? "urgent" :
      ["C24", "C25", "C32", "G02", "G03", "G06", "W05", "S06"].some(id => ["Yes", "Not sure", "Unsure"].includes(String(answers[id]))) ? "caution" : "none",
    country: typeof answers.C02 === "string" && answers.C02 !== "Prefer not to say" ? answers.C02 : undefined,
    excludedIngredients: Array.isArray(answers.C23) ? answers.C23.filter(value => value !== "None" && value !== "Prefer not to say") : [],
    foodSafetyHold: ["Yes", "Not sure", "Unsure"].includes(String(answers.C24)) || ["Yes", "Not sure", "Unsure"].includes(String(answers.C25)) || ["Yes", "Not sure", "Unsure"].includes(String(answers.C32)) || ["Yes", "Unsure"].includes(String(answers.G06)),
    activitySafetyHold: ["Yes", "Not sure", "Unsure"].includes(String(answers.C25)) || ["Yes", "Not sure", "Unsure"].includes(String(answers.W05)) || ["Yes", "Unsure"].includes(String(answers.G02)) || ["Yes", "Unsure"].includes(String(answers.G03)) || ["Yes", "Unsure"].includes(String(answers.S06)) || answers.C33 === "Yes",
    specificInterests: [...[answers.W01, answers.G04, answers.G05, answers.G07, answers.S01, answers.S05, answers.F01, answers.F02].filter((value): value is string => typeof value === "string"), ...questPreferences],
    safetyContext: {
      foodAllergy: answerState(answers.C24),
      foodRestriction: combinedAnswerState([answers.C25, answers.G06]),
      professionalRestriction: answerState(answers.C25),
      activityRestriction: combinedAnswerState([answers.C25, answers.W05, answers.S06]),
      medicationOrSupplement: answerState(answers.C32),
      acutePainfulJoint: answerState(answers.G02),
      urgentSymptoms: answerState(answers.C33 ?? answers.G03),
      // G06 is a food/drink preference item, not an assessment of medically advised fluid limits.
      fluidRestriction: "unknown",
    },
  };
}
