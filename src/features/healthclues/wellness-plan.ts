import type { HealthCluesProfile } from "../../lib/healthclues-quiz";

export type PlanChoice = "active" | "saved" | "skipped";
export type PlanSafety = "eligible_for_personal_choice" | "insufficient_information" | "ineligible" | "user_created_unreviewed";
export type PlanGroup = "build" | "reduce" | "additional";
export type TargetKind = "weekly-count" | "movement" | "personal-fluid-guidance" | "alcohol-reduction" | "custom";
export type PlanSource = { title: string; url: string };
export type LocalizedPlanText = { en: string; vi: string };
export type LocalizedRecommendationSnapshot = {
  title: LocalizedPlanText;
  relevanceReason: LocalizedPlanText;
  optionA: { title: LocalizedPlanText; action: LocalizedPlanText };
  optionB: { title: LocalizedPlanText; action: LocalizedPlanText };
};

export type PlanCandidate = {
  id: string; version: number; name: string; description: string; kind: string; category: string;
  evidenceClass: string; evidenceSummary: string | null; evidenceSources: PlanSource[];
  safetyNotes: string | null; recommendationEligible: boolean; demoOnly: boolean;
  personalizationEligibility: string; requiresKnownActivitySafety?: boolean; requiresKnownFoodSafety?: boolean; requiresKnownFluidSafety?: boolean; requiresMedicationContext?: boolean;
  topicTags: string[]; goalTags: string[]; preferenceTags: string[]; ingredientTags?: string[];
  source?: "catalog" | "habit_library"; group?: PlanGroup; goalType?: "maintain" | "reduce" | "avoid";
  whyThis?: string; targetKind?: TargetKind; trackingUnit?: string; measurementPrompt?: string;
};

export type WellnessPlanGoal = {
  goalId: string; templateId: string | null; title: string; category: string; goalType: "maintain" | "reduce" | "avoid";
  originalNote?: string;
  choice: PlanChoice; frequency: string; durationMinutes: number | null; trackingUnit: string; trackingDefinition: string;
  targetValue?: number | null; targetUnit?: string | null; durationDays?: number | null;
  safetyStatus: PlanSafety; provenance: "catalog" | "habit_library" | "user_created" | "ai_generated"; sourceVersion: number | null;
  evidenceStatus: string; explanation: string; safetyNote: string | null; sources: PlanSource[]; userSafetyConfirmation?: boolean;
  generatedOption?: { locale: "en" | "vi"; option: "A" | "B"; title: string };
  /** Signed bilingual Advisor source, stored in the existing profile JSONB for future display localization. */
  localizedRecommendation?: LocalizedRecommendationSnapshot;
  advisorProof?: string;
  iconKey?: string | null;
};

function isLocalizedPlanText(value: unknown): value is LocalizedPlanText {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).en === "string" && (value as Record<string, string>).en.length > 0 && (value as Record<string, string>).en.length <= 240 &&
    typeof (value as Record<string, unknown>).vi === "string" && (value as Record<string, string>).vi.length > 0 && (value as Record<string, string>).vi.length <= 240);
}

export function isLocalizedRecommendationSnapshot(value: unknown): value is LocalizedRecommendationSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Record<string, unknown>;
  const option = (candidate: unknown) => Boolean(candidate && typeof candidate === "object" && !Array.isArray(candidate) &&
    isLocalizedPlanText((candidate as Record<string, unknown>).title) && isLocalizedPlanText((candidate as Record<string, unknown>).action));
  return isLocalizedPlanText(snapshot.title) && isLocalizedPlanText(snapshot.relevanceReason) && option(snapshot.optionA) && option(snapshot.optionB);
}

/** Uses only the original signed bilingual copy. Legacy rows without it retain their stored text. */
export function localizedPlanGoalCopy(goal: WellnessPlanGoal, locale: "en" | "vi") {
  const snapshot = goal.provenance === "ai_generated" && isLocalizedRecommendationSnapshot(goal.localizedRecommendation) ? goal.localizedRecommendation : null;
  const option = goal.generatedOption?.option;
  const selected = snapshot && option ? snapshot[`option${option}` as "optionA" | "optionB"] : null;
  return {
    title: snapshot?.title[locale] || goal.title,
    relevanceReason: snapshot?.relevanceReason[locale] || goal.explanation,
    optionTitle: selected?.title[locale] || goal.generatedOption?.title || "",
    trackingDefinition: selected?.action[locale] || goal.trackingDefinition,
  };
}

export type WellnessHabitTemplate = {
  id: string; version: number; applicableTopics: string[]; group: PlanGroup; goalType: "maintain" | "reduce" | "avoid";
  title: string; description: string; category: string; priority: number; tags: string[]; preferenceTags: string[];
  evidenceStatus: string; evidenceSummary: string; editorialStatus: "source-grounded-candidate";
  sourceRefs: PlanSource[]; safetyNote: string | null; targetKind: TargetKind; trackingUnit: string; measurementPrompt: string;
  safetyRule?: "personal-fluid-guidance" | "movement-current-context" | "alcohol-withdrawal-screen";
  requiresTargetDetail?: boolean;
};

export const WELLNESS_TOPIC_CONFIG = [
  { id: "gout", label: "Gout / uric acid", aliases: ["gout", "uric acid"] },
  { id: "type-2-diabetes", label: "Type 2 Diabetes", aliases: ["type 2 diabetes", "type-2-diabetes", "diabetes type 2"] },
  { id: "sleep-insomnia", label: "Sleep / Insomnia", aliases: ["sleep", "insomnia", "sleep & rest", "sleep/rest"] },
  { id: "migraine", label: "Migraine", aliases: ["migraine", "migraine headache"] },
  { id: "weight-management", label: "Weight Management", aliases: ["weight management", "healthy weight", "weight loss"] },
  { id: "general-wellness", label: "General Wellness", aliases: ["general wellness", "wellness", "balanced nutrition"] },
] as const;

export function resolveWellnessTopicId(topic: string): string | null {
  const normalized = topic.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return WELLNESS_TOPIC_CONFIG.find(item => item.aliases.some(alias => normalized === alias.replace(/[^a-z0-9]+/g, " ").trim() || normalized.includes(alias.replace(/[^a-z0-9]+/g, " ").trim())))?.id || null;
}

const NIAMS = { title: "NIAMS — Gout: Diagnosis, Treatment, and Steps to Take", url: "https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take" };
const ACR = { title: "American College of Rheumatology 2020 Gout Guideline", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10563586/" };
const NHLBI_SLEEP = { title: "NHLBI — Healthy Sleep Habits", url: "https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits" };

/** Source-grounded candidates for local UX evaluation. Not human-reviewed or approved recommendations. */
export const WELLNESS_HABIT_LIBRARY_VERSION = 1;
export const WELLNESS_HABIT_LIBRARY: WellnessHabitTemplate[] = [
  { id: "gout-hydration-guidance", version: 1, applicableTopics: ["gout"], group: "build", goalType: "maintain", title: "Follow your personal hydration guidance", description: "Review hydration information only if it is relevant to guidance you already received. No daily volume is suggested here.", category: "nutrition", priority: 80, tags: ["hydration", "fluid"], preferenceTags: ["everyday habits", "water"], evidenceStatus: "TEST ONLY · guideline context; not human-reviewed", evidenceSummary: "ACR mentions adequate hydration in the specific context of people treated with uricosurics; this is not a universal fluid target or a general gout prescription.", editorialStatus: "source-grounded-candidate", sourceRefs: [ACR], safetyNote: "A numeric fluid target is not provided. Only configure this if you already have personal fluid guidance and have no conflicting restriction.", targetKind: "personal-fluid-guidance", trackingUnit: "self-reported days", measurementPrompt: "Confirm that you already have personal hydration guidance you intend to follow. Do not enter a new volume target.", safetyRule: "personal-fluid-guidance", requiresTargetDetail: false },
  { id: "gout-balanced-meals", version: 1, applicableTopics: ["gout"], group: "build", goalType: "maintain", title: "Explore balanced meals", description: "Choose a practical meal habit, such as including vegetables with a meal. This is general nutrition education, not a gout treatment.", category: "nutrition", priority: 75, tags: ["nutrition", "vegetables", "balanced meals"], preferenceTags: ["foods and drinks", "nutrition"], evidenceStatus: "TEST ONLY · guideline context; not human-reviewed", evidenceSummary: "ACR notes that dietary effects on serum urate are small; a balanced eating pattern is general education, not a substitute for indicated treatment.", editorialStatus: "source-grounded-candidate", sourceRefs: [ACR, NIAMS], safetyNote: null, targetKind: "weekly-count", trackingUnit: "meals per week", measurementPrompt: "Choose how many meals per week you personally want to track for this behavior.", requiresTargetDetail: true },
  { id: "gout-gentle-movement", version: 1, applicableTopics: ["gout"], group: "build", goalType: "maintain", title: "Choose suitable everyday movement", description: "Set a self-chosen movement routine only when it fits your current situation. Do not exercise a painful, inflamed joint.", category: "movement", priority: 55, tags: ["movement", "activity"], preferenceTags: ["everyday habits", "movement", "walking"], evidenceStatus: "TEST ONLY · general activity education; not human-reviewed", evidenceSummary: "This is general movement education, not a gout-specific treatment or flare recommendation.", editorialStatus: "source-grounded-candidate", sourceRefs: [NIAMS], safetyNote: "Unavailable during a reported acute painful joint episode or activity restriction. A self-report is not medical clearance.", targetKind: "movement", trackingUnit: "minutes per session", measurementPrompt: "Choose a comfortable duration and number of days per week. Do not set an exercise goal for a painful joint.", safetyRule: "movement-current-context" },
  { id: "gout-sugary-drinks", version: 1, applicableTopics: ["gout"], group: "reduce", goalType: "reduce", title: "Set your own sugary-drink reduction goal", description: "If this matches your interests, choose a personal limit to track. Avoiding every sweet food or drink is not required here.", category: "nutrition", priority: 90, tags: ["sugary drinks", "high fructose"], preferenceTags: ["sugary drinks", "foods and drinks"], evidenceStatus: "TEST ONLY · conditional guideline context; not human-reviewed", evidenceSummary: "ACR conditionally recommends limiting high-fructose corn syrup (very-low certainty); NIAMS discusses avoiding sugar-sweetened drinks. Neither establishes a personal target for you.", editorialStatus: "source-grounded-candidate", sourceRefs: [NIAMS, ACR], safetyNote: null, targetKind: "weekly-count", trackingUnit: "servings per week", measurementPrompt: "Choose a weekly limit that you want to self-report. No limit is preselected." },
  { id: "gout-purine-foods", version: 1, applicableTopics: ["gout"], group: "reduce", goalType: "reduce", title: "Explore a manageable purine-food change", description: "If you choose, focus on a specific food pattern such as organ meats or red meat; complete avoidance is not required.", category: "nutrition", priority: 70, tags: ["gout", "purines", "red meat", "organ meats"], preferenceTags: ["red meat", "foods and drinks"], evidenceStatus: "TEST ONLY · conditional, low-certainty guideline context; not human-reviewed", evidenceSummary: "ACR conditionally recommends limiting purine intake with low-certainty evidence. Diet changes may have small effects and do not replace indicated medical care.", editorialStatus: "source-grounded-candidate", sourceRefs: [ACR, NIAMS], safetyNote: "Choose a specific pattern that is practical for you; the planner does not require eliminating red meat or other foods.", targetKind: "weekly-count", trackingUnit: "selected meals per week", measurementPrompt: "Choose a personal weekly pattern to track for foods you want to reduce. This is not a required elimination diet." },
  { id: "gout-alcohol-awareness", version: 1, applicableTopics: ["gout"], group: "reduce", goalType: "reduce", title: "Consider an alcohol goal, if relevant to you", description: "This appears only as an optional topic. You may skip it or choose to record your own pattern without setting a reduction target.", category: "general routine", priority: 65, tags: ["alcohol"], preferenceTags: ["alcohol", "foods and drinks"], evidenceStatus: "TEST ONLY · conditional, low-certainty guideline context; not human-reviewed", evidenceSummary: "ACR conditionally recommends limiting alcohol for people with gout. The plan does not recommend abrupt abstinence or determine what is appropriate for you.", editorialStatus: "source-grounded-candidate", sourceRefs: [ACR, NIAMS], safetyNote: "Before setting a reduction target, clarify whether you drink heavily/most days or have had withdrawal symptoms when cutting down. If yes or unsure, do not set a change goal here; seek qualified support.", targetKind: "alcohol-reduction", trackingUnit: "occasions per week", measurementPrompt: "Only set a personally chosen limit after confirming there is no heavy/daily drinking or prior withdrawal concern.", safetyRule: "alcohol-withdrawal-screen" },
  { id: "sleep-consistent-schedule", version: 1, applicableTopics: ["sleep-insomnia"], group: "build", goalType: "maintain", title: "Choose a consistent sleep/wake routine", description: "Pick a schedule pattern that fits your life, including shift work. No universal bedtime is set.", category: "sleep", priority: 90, tags: ["schedule", "routine"], preferenceTags: ["sleep", "routine"], evidenceStatus: "TEST ONLY · general sleep education; not human-reviewed", evidenceSummary: "General sleep-habit education; the planner does not set a bedtime or claim this treats a sleep disorder.", editorialStatus: "source-grounded-candidate", sourceRefs: [NHLBI_SLEEP], safetyNote: null, targetKind: "weekly-count", trackingUnit: "days per week", measurementPrompt: "Choose how many days per week you want to self-report following your own schedule.", requiresTargetDetail: true },
  { id: "sleep-wind-down", version: 1, applicableTopics: ["sleep-insomnia"], group: "build", goalType: "maintain", title: "Create a personal wind-down routine", description: "Choose a short, repeatable pre-sleep activity that fits your schedule; it does not have to start at a fixed time.", category: "sleep", priority: 80, tags: ["wind down", "routine"], preferenceTags: ["sleep", "relaxation"], evidenceStatus: "TEST ONLY · general sleep education; not human-reviewed", evidenceSummary: "General routine education. Tracking the routine does not measure sleep quality or diagnose insomnia.", editorialStatus: "source-grounded-candidate", sourceRefs: [NHLBI_SLEEP], safetyNote: null, targetKind: "weekly-count", trackingUnit: "nights per week", measurementPrompt: "Choose how many nights per week you want to self-report trying your own wind-down routine.", requiresTargetDetail: true },
  { id: "sleep-evening-habits", version: 1, applicableTopics: ["sleep-insomnia"], group: "reduce", goalType: "reduce", title: "Adjust one evening habit that disrupts your rest", description: "Select a habit you identified and set your own realistic change. No habit is assumed from the Quiz.", category: "sleep", priority: 65, tags: ["evening habits"], preferenceTags: ["sleep", "routine"], evidenceStatus: "TEST ONLY · general sleep education; not human-reviewed", evidenceSummary: "This is a personal routine prompt, not a treatment recommendation.", editorialStatus: "source-grounded-candidate", sourceRefs: [NHLBI_SLEEP], safetyNote: null, targetKind: "weekly-count", trackingUnit: "days per week", measurementPrompt: "Name the evening habit you want to adjust and choose a weekly self-report target.", requiresTargetDetail: true },
  { id: "sleep-relaxation", version: 1, applicableTopics: ["sleep-insomnia"], group: "additional", goalType: "maintain", title: "Explore a calming pre-sleep activity", description: "Try a relaxation or quiet activity only if it appeals to you; it is optional general wellness education.", category: "relaxation", priority: 40, tags: ["sleep", "relaxation"], preferenceTags: ["relaxation", "mindfulness"], evidenceStatus: "TEST ONLY · general wellness education; not human-reviewed", evidenceSummary: "No condition-specific effect is claimed.", editorialStatus: "source-grounded-candidate", sourceRefs: [NHLBI_SLEEP], safetyNote: null, targetKind: "weekly-count", trackingUnit: "nights per week", measurementPrompt: "Choose how many nights per week you would like to self-report trying this activity." },
];

const safeCategories = new Set(["sleep", "relaxation", "mindfulness", "nutrition", "movement", "general routine"]);
const onboardingExcludedTerms = /\b(?:herb(?:al)?|botanical|supplement|therapy|therapeutic|treatment|remedy|medication|medicine|dosage|dose)\b/i;
const isEverydayWellnessContent = (item: PlanCandidate) => !onboardingExcludedTerms.test(`${item.name} ${item.kind} ${item.category}`);
const validSources = (candidate: PlanCandidate) => candidate.evidenceSources.filter(source => { try { return new URL(source.url).protocol === "https:" && source.title.length <= 160; } catch { return false; } });
const topicFor = (profile: HealthCluesProfile): string | null => resolveWellnessTopicId(profile.topic);

export function personalizeHabitCandidates(profile: HealthCluesProfile, templates: WellnessHabitTemplate[]): PlanCandidate[] {
  const topic = topicFor(profile);
  if (!topic) return [];
  const specificInterests = (profile.specificInterests || []).map(value => value.toLowerCase());
  const preferences = (profile.contentPreferences || []).map(value => value.toLowerCase());
  const interests = [...specificInterests, ...preferences];
  const goal = profile.twoWeekGoal.toLowerCase();
  return templates.filter(template => template.applicableTopics.includes(topic)).map(template => {
    const selectedPreference = interests.find(value => template.preferenceTags.some(tag => value.includes(tag) || tag.includes(value)));
    const preferenceMatch = Boolean(selectedPreference);
    const goalTokens = goal.split(/[^a-z0-9]+/).filter(token => token.length > 3);
    const matchedGoal = goalTokens.find(token => template.tags.some(tag => tag.toLowerCase().includes(token)) || template.title.toLowerCase().includes(token));
    const goalMatch = Boolean(matchedGoal);
    const why = preferenceMatch ? `You selected “${selectedPreference}” in your Quiz, which matches this habit's interests.`
      : goalMatch ? `Your Quiz goal mentioned “${matchedGoal}.” This is an optional habit to consider, not a treatment.`
      : `This habit is tagged for your selected “${profile.topic}” topic. It is optional and does not confirm a diagnosis or treatment.`;
    return {
      id: `habit:${template.id}`, version: template.version, name: template.title, description: template.description,
      kind: template.category === "movement" ? "movement" : "lifestyle", category: template.category,
      evidenceClass: "source-grounded-candidate", evidenceSummary: template.evidenceSummary, evidenceSources: template.sourceRefs,
      safetyNotes: template.safetyNote, recommendationEligible: true, demoOnly: true, personalizationEligibility: "eligible",
      topicTags: template.applicableTopics, goalTags: template.tags, preferenceTags: template.preferenceTags,
      source: "habit_library" as const, group: template.group, goalType: template.goalType, whyThis: why,
      targetKind: template.targetKind, trackingUnit: template.trackingUnit, measurementPrompt: template.measurementPrompt,
      requiresKnownActivitySafety: template.safetyRule === "movement-current-context",
    };
  }).sort((a, b) => {
    const at = templates.find(item => `habit:${item.id}` === a.id)!;
    const bt = templates.find(item => `habit:${item.id}` === b.id)!;
    const score = (item: WellnessHabitTemplate) => item.priority
      + (item.preferenceTags.some(tag => specificInterests.some(value => value.includes(tag) || tag.includes(value))) ? 40 : 0)
      + (item.preferenceTags.some(tag => preferences.some(value => value.includes(tag) || tag.includes(value))) ? 10 : 0)
      + (item.tags.some(tag => goal.includes(tag.toLowerCase())) ? 15 : 0);
    return score(bt) - score(at) || a.id.localeCompare(b.id);
  });
}

function habitSafety(template: WellnessHabitTemplate, profile: HealthCluesProfile): { status: PlanSafety; note: string | null } {
  if (profile.safetyLevel === "urgent") return { status: "ineligible", note: "Your Quiz answers raised a safety notice. This goal is unavailable in the planner." };
  if (template.safetyRule === "personal-fluid-guidance") {
    const restriction = profile.safetyContext?.fluidRestriction || "unknown";
    return restriction === "yes" ? { status: "ineligible", note: "A reported fluid restriction means this goal cannot be configured here." }
      : { status: "insufficient_information", note: "Fluid restrictions and individualized guidance were not established in the Quiz. No volume target is suggested." };
  }
  if (template.safetyRule === "movement-current-context") {
    const safety = profile.safetyContext;
    if (safety?.acutePainfulJoint === "yes" || safety?.activityRestriction === "yes") return { status: "ineligible", note: "Your Quiz reports current pain or an activity restriction; this goal cannot be activated." };
    if (safety?.acutePainfulJoint !== "no" || safety?.activityRestriction !== "no") return { status: "insufficient_information", note: "Current pain and activity restrictions were not clarified. This is not medical clearance." };
  }
  if (template.safetyRule === "alcohol-withdrawal-screen") return { status: "insufficient_information", note: "A personal alcohol-change goal needs a separate safety conversation; do not stop abruptly based on this planner." };
  return { status: "eligible_for_personal_choice", note: template.safetyNote };
}

/** Shared topic-driven retrieval; only exact topic mappings may enter the candidate set. */
export function buildWellnessPlanSuggestions(profile: HealthCluesProfile, catalog: PlanCandidate[], journeyId: string, templates: WellnessHabitTemplate[] = []) {
  const topic = topicFor(profile);
  // Unknown topics must fail closed. Otherwise unknown Catalog tags also resolve
  // to null and can accidentally match an unsupported Quiz topic.
  if (!topic) return [];
  const habitCandidates = personalizeHabitCandidates(profile, templates).map(candidate => {
    const template = templates.find(item => `habit:${item.id}` === candidate.id)!;
    const safety = habitSafety(template, profile);
    return { candidate, safetyStatus: safety.status, safetyNote: safety.note, rank: template.priority, reason: candidate.whyThis || `Tagged for your selected ${profile.topic} topic.`, sources: validSources(candidate) };
  });
  const journeyTopic = resolveWellnessTopicId(journeyId);
  const exactTopicTags = new Set([topic]);
  const goal = profile.twoWeekGoal.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const preferences = profile.contentPreferences.flatMap(value => value.toLowerCase().split(/[^a-z0-9]+/)).filter(term => term.length > 2);
  const catalogCandidates = catalog.filter(item => isEverydayWellnessContent(item) && item.recommendationEligible && item.personalizationEligibility === "eligible" && item.topicTags.some(value => exactTopicTags.has(value.toLowerCase()) || resolveWellnessTopicId(value) === topic) && (!journeyTopic || journeyTopic === topic) && (item.demoOnly || validSources(item).length > 0)).map(item => {
    const goalMatch = item.goalTags.some(value => { const tag = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); return tag === goal || (goal.length > 2 && (tag.includes(goal) || goal.includes(tag))); });
    const preferenceMatch = preferences.some(value => `${item.category} ${item.name} ${item.preferenceTags.join(" ")}`.toLowerCase().includes(value));
    let safetyStatus: PlanSafety = profile.safetyLevel === "urgent" ? "ineligible" : "eligible_for_personal_choice";
    const safetyNote = item.safetyNotes;
    if (item.requiresKnownActivitySafety && (profile.safetyContext?.activityRestriction !== "no" || profile.safetyContext?.acutePainfulJoint !== "no")) safetyStatus = profile.safetyContext?.acutePainfulJoint === "yes" || profile.safetyContext?.activityRestriction === "yes" ? "ineligible" : "insufficient_information";
    const reason = preferenceMatch ? `You selected ${profile.contentPreferences.find(value => `${item.category} ${item.name} ${item.preferenceTags.join(" ")}`.toLowerCase().includes(value.toLowerCase()))}.` : goalMatch ? `You said you want to ${profile.twoWeekGoal.toLowerCase()}.` : `This reviewed catalog entry matches your selected ${profile.topic} topic.`;
    return { candidate: { ...item, source: "catalog" as const, group: item.group || "additional", whyThis: reason }, safetyStatus, safetyNote, rank: (goalMatch ? 4 : 0) + (preferenceMatch ? 2 : 0), reason, sources: validSources(item) };
  });
  return [...habitCandidates, ...catalogCandidates].sort((a, b) => b.rank - a.rank || a.candidate.id.localeCompare(b.candidate.id)).slice(0, 8);
}

export function validateConfiguredGoal(goal: Pick<WellnessPlanGoal, "targetValue" | "targetUnit" | "frequency" | "trackingDefinition" | "trackingUnit">): string | null {
  if (!goal.trackingDefinition.trim() || goal.trackingDefinition.length > 240) return "Add a clear self-report rule before saving this goal.";
  if (!goal.trackingUnit.trim() || goal.trackingUnit.length > 60) return "Choose how you will track this goal.";
  if (goal.targetValue !== null && goal.targetValue !== undefined && (!Number.isFinite(goal.targetValue) || goal.targetValue < 0 || goal.targetValue > 10000)) return "Choose a valid target.";
  if (goal.targetValue !== null && goal.targetValue !== undefined && !goal.targetUnit) return "Choose a unit for the target.";
  if (goal.frequency === "Flexible") return "Choose a weekly frequency before activating this goal.";
  return null;
}

export function assessPersonalGoal(input: { title: string; category: string; goalType: string; profile: HealthCluesProfile; activityConfirmed?: boolean; alcoholRisk?: "yes" | "no" | "unknown" }): { allowed: boolean; safetyStatus: PlanSafety; message?: string } {
  const title = input.title.trim();
  if (input.profile.safetyLevel === "urgent") return { allowed: false, safetyStatus: "ineligible", message: "Your Quiz answers raised a safety notice. This planner cannot create active practices right now." };
  if (!title || title.length > 120 || !safeCategories.has(input.category) || !["maintain", "reduce", "avoid"].includes(input.goalType)) return { allowed: false, safetyStatus: "ineligible", message: "Add a short goal and choose one of the available categories." };
  if (/thuốc|ngưng thuốc|đổi thuốc|điều trị|chữa khỏi|thực phẩm bổ sung|thảo dược|liều dùng|nhịn ăn|nhịn nước|thải độc|mất nước|cai rượu|chữa bệnh/i.test(title)) return { allowed: false, safetyStatus: "ineligible", message: "This planner is for everyday habits, not treatment, medication, supplement or herbal guidance." };
  if (onboardingExcludedTerms.test(title)) return { allowed: false, safetyStatus: "ineligible", message: "This onboarding planner is for everyday habits. Explore botanicals or therapies later with an in-world NPC." };
  if (/stop|quit|withdraw|detox.{0,15}alcohol|alcohol.{0,20}(cold turkey|suddenly)/i.test(title)) return { allowed: false, safetyStatus: "ineligible", message: "A sudden change to alcohol use can need medical support. This goal cannot guide that change; consider qualified healthcare support." };
  if (/alcohol|drinking/i.test(title) && ["reduce", "avoid"].includes(input.goalType) && input.alcoholRisk !== "no") return { allowed: false, safetyStatus: input.alcoholRisk === "yes" ? "ineligible" : "insufficient_information", message: input.alcoholRisk === "yes" ? "Do not set an alcohol reduction goal here when heavy/daily drinking or prior withdrawal is reported. Seek qualified support." : "Clarify heavy/daily drinking or prior withdrawal before setting an alcohol change goal; you may save the topic for later." };
  if (/stop|skip|change|reduce.{0,20}(medication|medicine|dose)|medication.{0,20}(stop|change|dose)/i.test(title)) return { allowed: false, safetyStatus: "ineligible", message: "This planner cannot create medication-change goals." };
  const isMovement = input.category === "movement" || /walk|run|exercise|movement|mobility|workout/i.test(title);
  if (isMovement && input.profile.safetyContext?.acutePainfulJoint === "yes" && /gout|uric acid/i.test(input.profile.topic)) return { allowed: false, safetyStatus: "ineligible", message: "You reported an acutely painful joint. Do not set an activity goal for that joint here." };
  if (isMovement && input.profile.safetyContext?.activityRestriction === "yes") return { allowed: false, safetyStatus: "ineligible", message: "You reported an activity restriction. This planner cannot make a movement goal active." };
  if (isMovement && (input.profile.safetyContext?.activityRestriction !== "no" || input.profile.safetyContext?.acutePainfulJoint !== "no") && !input.activityConfirmed) return { allowed: false, safetyStatus: "insufficient_information", message: "Clarify whether you currently have an activity restriction or painful joint before setting this goal. This self-report is not medical clearance." };
  if (/\d+\s*(ml|liters?|litres?)|\b2\s*l\b/i.test(title) && input.profile.safetyContext?.fluidRestriction !== "no") return { allowed: false, safetyStatus: "insufficient_information", message: "A personal fluid target needs clarification with your healthcare professional; no default volume is provided." };
  if (/fast weight loss|crash diet|starve|extreme fast/i.test(title)) return { allowed: false, safetyStatus: "ineligible", message: "This goal is outside the safe scope of the wellness planner." };
  if (/water|hydration|fluid/i.test(title) && input.profile.safetyContext?.fluidRestriction !== "no") return { allowed: false, safetyStatus: "insufficient_information", message: "Fluid guidance is unknown. Check any personal restrictions with a healthcare professional; no volume target is suggested." };
  return { allowed: true, safetyStatus: "user_created_unreviewed" };
}

export function buildPersonalPlanGoal(input: { title: string; category: string; goalType: "maintain" | "reduce" | "avoid"; frequency: string; trackingDefinition: string; trackingUnit?: string; targetValue?: number | null; targetUnit?: string | null; durationDays?: number | null; activityConfirmed?: boolean }): WellnessPlanGoal {
  return { goalId: crypto.randomUUID(), templateId: null, title: input.title.trim(), category: input.category, goalType: input.goalType, choice: "active", frequency: input.frequency, durationMinutes: null, trackingUnit: input.trackingUnit || "self-reported completion", trackingDefinition: input.trackingDefinition.trim(), targetValue: input.targetValue ?? null, targetUnit: input.targetUnit ?? null, durationDays: input.durationDays ?? null, safetyStatus: "user_created_unreviewed", provenance: "user_created", sourceVersion: null, evidenceStatus: "USER-CREATED · NOT REVIEWED", explanation: "You created this personal goal. Saving it does not verify a health benefit.", safetyNote: null, sources: [], ...(input.activityConfirmed ? { userSafetyConfirmation: true } : {}) };
}

export function buildHabitPlanGoal(input: { candidate: PlanCandidate; template: WellnessHabitTemplate; frequency: string; trackingDefinition: string; trackingUnit: string; targetValue: number | null; targetUnit: string | null; durationDays: number | null; safetyStatus: PlanSafety; userSafetyConfirmation?: boolean }): WellnessPlanGoal {
  return { goalId: `habit:${input.template.id}:${input.template.version}`, templateId: input.template.id, title: input.template.title, category: input.template.category, goalType: input.template.goalType, choice: "active", frequency: input.frequency, durationMinutes: input.template.targetKind === "movement" ? input.targetValue : null, trackingUnit: input.trackingUnit, trackingDefinition: input.trackingDefinition, targetValue: input.targetValue, targetUnit: input.targetUnit, durationDays: input.durationDays, safetyStatus: input.safetyStatus, provenance: "habit_library", sourceVersion: input.template.version, evidenceStatus: input.template.evidenceStatus, explanation: input.candidate.whyThis || "Optional source-grounded candidate for your selected Quiz topic.", safetyNote: input.template.safetyNote, sources: input.template.sourceRefs, ...(input.userSafetyConfirmation ? { userSafetyConfirmation: true } : {}) };
}

export function evaluateHabitGoalSafety(templateId: string, profile: HealthCluesProfile, context: { movementConfirmed?: boolean; fluidGuidanceConfirmed?: boolean; alcoholRisk?: "no" | "yes" | "unknown" }): { allowed: boolean; status: PlanSafety; message?: string } {
  if (profile.safetyLevel === "urgent") return { allowed: false, status: "ineligible", message: "The safety context in your Quiz needs attention before creating an active goal." };
  const template = WELLNESS_HABIT_LIBRARY.find(item => item.id === templateId);
  if (!template) return { allowed: false, status: "ineligible", message: "This habit template is unavailable." };
  if (template.safetyRule === "personal-fluid-guidance") {
    if (profile.safetyContext?.fluidRestriction !== "no") return { allowed: false, status: profile.safetyContext?.fluidRestriction === "yes" ? "ineligible" : "insufficient_information", message: "Fluid restrictions are not confirmed as absent. Do not create a hydration target here." };
    if (!context.fluidGuidanceConfirmed) return { allowed: false, status: "insufficient_information", message: "Only continue if you already have personal hydration guidance to follow. No new volume target is provided." };
  }
  if (template.safetyRule === "movement-current-context") {
    if (profile.safetyContext?.acutePainfulJoint === "yes" || profile.safetyContext?.activityRestriction === "yes") return { allowed: false, status: "ineligible", message: "Movement goal unavailable for your reported acute pain or restriction." };
    if (profile.safetyContext?.acutePainfulJoint !== "no" || profile.safetyContext?.activityRestriction !== "no" || !context.movementConfirmed) return { allowed: false, status: "insufficient_information", message: "Confirm you do not currently report a painful joint or restriction before configuring a self-chosen movement goal. This is not medical clearance." };
  }
  if (template.safetyRule === "alcohol-withdrawal-screen" && context.alcoholRisk !== "no") return { allowed: false, status: context.alcoholRisk === "yes" ? "ineligible" : "insufficient_information", message: context.alcoholRisk === "yes" ? "Do not set an alcohol reduction goal in this planner when heavy/daily drinking or prior withdrawal is reported. Seek qualified support." : "Clarify heavy/daily drinking or prior withdrawal before setting a reduction target. You may save this topic for later." };
  return { allowed: true, status: "eligible_for_personal_choice" };
}
