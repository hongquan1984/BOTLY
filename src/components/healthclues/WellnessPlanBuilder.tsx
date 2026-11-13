"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleHelp, Leaf, Moon, Plus, ShieldCheck, Sparkles } from "lucide-react";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import { assessPersonalGoal, buildHabitPlanGoal, buildPersonalPlanGoal, evaluateHabitGoalSafety, validateConfiguredGoal, WELLNESS_HABIT_LIBRARY, type PlanCandidate, type WellnessPlanGoal } from "@/features/healthclues/wellness-plan";
import { useHealthCluesLocale } from "./HealthCluesLocaleProvider";
import { healthCluesQuizOption } from "@/lib/healthclues-i18n";
import { discoveryContextMatchesWorld, localizedDiscoveryConcern, localizedDiscoveryFactors } from "@/features/healthclues/onboarding-context";
import { localized, toAiPlanGoal, type AiWellnessGoal } from "@/features/healthclues/personalized-wellness-plan";
import { HealthCluesPet } from "@/features/healthclues/HealthCluesPet";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "./HealthCluesGameIcon";
import { resolveWellnessIcon, validateAndResolveGoalIcon } from "./wellnessIconResolver";
import styles from "./WellnessPlanBuilder.module.css";

type AdvisorSuggestion = { candidate: PlanCandidate; safetyStatus: string; safetyNote: string | null; rank: number; reason: string; sources: PlanCandidate["evidenceSources"] };
type AdvisorResponse = { status: "GEMINI_AI" | "DETERMINISTIC_DEMO" | "SYNTHETIC_TEST" | "AI_UNAVAILABLE"; delivery?: "live_provider" | "server_cache" | "inflight_reuse" | "same_request_reuse" | "session_cache"; worldId?: string; requestId: string; providerResponseId?: string; model: string | null; suggestions: AdvisorSuggestion[]; goals?: Array<AiWellnessGoal & { advisorProof: string }>; omittedCount?: number; knowledgeCount: number; error?: string };
type AdvisorLifecycle = "REQUEST_NOT_STARTED" | "GENERATING" | "SUCCESS_WITH_GOALS" | "PROVIDER_ERROR" | "VALIDATION_ERROR" | "NO_RECOMMENDATIONS";
class AdvisorUiError extends Error {
  constructor(message: string, readonly lifecycle: Exclude<AdvisorLifecycle, "REQUEST_NOT_STARTED" | "GENERATING" | "SUCCESS_WITH_GOALS" | "NO_RECOMMENDATIONS">, readonly requestId: string) { super(message); }
}
type AdvisorSnapshot = { outcome: "success"; result: AdvisorResponse } | { outcome: "failure"; lifecycle: "PROVIDER_ERROR" | "VALIDATION_ERROR"; requestId: string; message: string };
const advisorSessionCache = new Map<string, AdvisorSnapshot>();
function cacheAdvisorSnapshot(key: string | undefined, value: AdvisorSnapshot) {
  if (!key) return;
  advisorSessionCache.set(key, value);
  if (advisorSessionCache.size > 32) advisorSessionCache.delete(advisorSessionCache.keys().next().value as string);
}
const frequencies = Array.from({ length: 7 }, (_, index) => index + 1);
const byTemplateId = (id: string | null) => id ? WELLNESS_HABIT_LIBRARY.find(template => template.id === id) || null : null;

function personalizedGoalIcon(goal: AiWellnessGoal, locale: "en" | "vi"): HealthCluesGameIconName {
  if (goal.iconKey) return goal.iconKey as HealthCluesGameIconName;
  const resolved = resolveWellnessIcon({
    title: localized(goal.title, locale),
    action: `${localized(goal.optionA.action, locale)} ${localized(goal.optionB.action, locale)}`,
    category: goal.category,
    text: localized(goal.relevanceReason, locale),
  });
  return (resolved.aiHabitKey || resolved.key) as HealthCluesGameIconName;
}

function getGoal3DIcon(goal: AiWellnessGoal, index: number, locale: "en" | "vi"): string {
  const words = `${localized(goal.title, locale)} ${localized(goal.relevanceReason, locale)} ${localized(goal.optionA.action, locale)} ${localized(goal.optionB.action, locale)}`.toLowerCase();
  const category = goal.category.toLowerCase();
  if (/drink|beverage|soda|tea|sugar|đường|nước ngọt|trà sữa|caffeine|hydration|water/.test(words) || /fluid|hydration/.test(category)) {
    return "/healthclues/assets/ui/ref_icon_drink.png";
  }
  if (/movement|activity|exercise|vận động|đi bộ|walk|run|steps/.test(category) || /walk|movement|exercise|activity|steps|vận động|chạy bộ|thể dục/.test(words)) {
    return "/healthclues/assets/ui/ref_icon_movement.png";
  }
  if (/sleep|bedtime|rest|giấc ngủ|ngủ|wind.?down/.test(category) || /sleep|bedtime|rest|ngủ|giấc ngủ|wind.?down/.test(words)) {
    return "/healthclues/assets/ui/ref_icon_sleep.png";
  }
  if (/nutrition|food|meal|ăn uống|rau|diet/.test(category) || /vegetable|nutrition|meal|food|rau|ăn uống|dinh dưỡng/.test(words)) {
    return "/healthclues/assets/ui/ref_icon_nutrition.png";
  }
  const defaultIcons = [
    "/healthclues/assets/ui/ref_icon_drink.png",
    "/healthclues/assets/ui/ref_icon_movement.png",
    "/healthclues/assets/ui/ref_icon_nutrition.png",
    "/healthclues/assets/ui/ref_icon_sleep.png",
  ];
  return defaultIcons[index % defaultIcons.length];
}

export function WellnessPlanBuilder({ profile, questId, worldId, accessToken, onConfirm, onSkip, onBack, onSelectionChange, initialGoals = [], advisorCacheKey }: { profile: HealthCluesProfile; questId: string; worldId?: string; accessToken?: string; onConfirm: (goals: WellnessPlanGoal[]) => void; onSkip: () => void; onBack: () => void; onSelectionChange?: (goals: WellnessPlanGoal[], suggestionIds: string[]) => void; initialGoals?: WellnessPlanGoal[]; advisorCacheKey?: string }) {
  const { locale, text } = useHealthCluesLocale();
  const profileKey = JSON.stringify(profile);
  const effectiveQuestId = useMemo(() => {
    if (discoveryContextMatchesWorld(questId, profile)) return questId;
    const isSleep = profile.adaptiveDiscovery
      ? profile.adaptiveDiscovery.focusId === "sleep"
      : /sleep|rest|ngủ/i.test(profile.topic || "");
    return isSleep ? "sleep-better" : "health-concern";
  }, [questId, profile]);
  const responseCacheKey = advisorCacheKey ? `${advisorCacheKey}:${effectiveQuestId}:${locale}:${profileKey}` : undefined;
  const profileRef = useRef(profile);
  const localeRef = useRef(locale);
  const textRef = useRef(text);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { localeRef.current = locale; textRef.current = text; }, [locale, text]);
  const [suggestions, setSuggestions] = useState<AdvisorSuggestion[]>([]);
  const [personalizedGoals, setPersonalizedGoals] = useState<Array<AiWellnessGoal & { advisorProof: string }>>([]);
  const [aiSelections, setAiSelections] = useState<Record<string, WellnessPlanGoal>>({});
  const [aiIncluded, setAiIncluded] = useState<Record<string, boolean>>({});
  const [aiModes, setAiModes] = useState<Record<string, "A" | "B" | "custom">>({});
  const [customizingGoal, setCustomizingGoal] = useState<string | null>(null);
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [providerStatus, setProviderStatus] = useState<"loading" | "GEMINI_AI" | "DETERMINISTIC_DEMO" | "SYNTHETIC_TEST" | "AI_UNAVAILABLE">("loading");
  const [advisorLifecycle, setAdvisorLifecycle] = useState<AdvisorLifecycle>("REQUEST_NOT_STARTED");
  const [advisorRequestId, setAdvisorRequestId] = useState<string | null>(null);
  const [providerModel, setProviderModel] = useState<string | null>(null);
  const [providerDelivery, setProviderDelivery] = useState<AdvisorResponse["delivery"]>(undefined);
  const [providerTraceId, setProviderTraceId] = useState<string | null>(null);
  const [retryGeneration, setRetryGeneration] = useState(0);
  const requestIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [choices, setChoices] = useState<Record<string, WellnessPlanGoal>>({});
  const [review, setReview] = useState(false);
  const [configuring, setConfiguring] = useState<PlanCandidate | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [frequency, setFrequency] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [targetDetail, setTargetDetail] = useState("");
  const [fluidConfirmed, setFluidConfirmed] = useState(false);
  const [movementConfirmed, setMovementConfirmed] = useState(false);
  const [alcoholRisk, setAlcoholRisk] = useState<"unknown" | "yes" | "no">("unknown");
  const [configError, setConfigError] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [editingCustomGoalId, setEditingCustomGoalId] = useState<string | null>(null);
  const [customError, setCustomError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const liveSelectionChanged = useRef(false);
  const liveSelectionCallback = useRef(onSelectionChange);
  const initialGoalsRef = useRef(initialGoals);
  const hydratedSavedGoalIds = useRef(new Set<string>());
  const previousResponseKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (previousResponseKey.current !== responseCacheKey) { previousResponseKey.current = responseCacheKey; requestIdRef.current = null; }
    const applySuccess = (result: AdvisorResponse, requestId: string) => {
      setSuggestions(result.suggestions); setPersonalizedGoals(result.goals || []); setProviderStatus(result.status); setProviderModel(result.model); setProviderDelivery(result.delivery || "live_provider"); setProviderTraceId(result.providerResponseId || result.requestId);
      setAdvisorRequestId(requestId);
      setAdvisorLifecycle(result.goals?.length || result.suggestions.length ? "SUCCESS_WITH_GOALS" : "NO_RECOMMENDATIONS");
      const restored: Record<string, WellnessPlanGoal> = {};
      const restoredModes: Record<string, "A" | "B" | "custom"> = {};
      const restoredIncluded: Record<string, boolean> = {};
      for (const generated of result.goals || []) {
        const saved = initialGoalsRef.current.find(goal => goal.goalId === generated.goalId);
        const option = saved?.provenance === "user_created" && saved.originalNote ? "custom" : saved?.generatedOption?.option;
        if (!saved || (option !== "A" && option !== "B" && option !== "custom")) continue;
        restored[generated.goalId] = saved; restoredModes[generated.goalId] = option; restoredIncluded[generated.goalId] = true;
      }
      if (initialGoalsRef.current.length === 0 && Array.isArray(result.goals)) {
        for (const generated of result.goals.slice(0, 3)) {
          const defaultPlanGoal = toAiPlanGoal(generated, "A", localeRef.current, false) as WellnessPlanGoal;
          restored[generated.goalId] = defaultPlanGoal;
          restoredModes[generated.goalId] = "A";
          restoredIncluded[generated.goalId] = true;
        }
      }
      setAiSelections(current => ({ ...current, ...restored })); setAiModes(current => ({ ...current, ...restoredModes })); setAiIncluded(current => ({ ...current, ...restoredIncluded })); setChoices(current => ({ ...current, ...restored }));
      setCustomDrafts(current => ({ ...Object.fromEntries(Object.values(restored).filter(goal => goal.provenance === "user_created" && goal.originalNote).map(goal => [goal.goalId, goal.originalNote!])), ...current }));
    };
    const cached = retryGeneration === 0 && responseCacheKey ? advisorSessionCache.get(responseCacheKey) : undefined;
    if (cached) {
      queueMicrotask(() => {
        if (!active) return;
        if (cached.outcome === "success") applySuccess({ ...cached.result, delivery: "session_cache" }, cached.result.requestId);
        else { setSuggestions([]); setProviderStatus("AI_UNAVAILABLE"); setProviderModel(null); setProviderTraceId(null); setAdvisorLifecycle(cached.lifecycle); setAdvisorRequestId(cached.requestId); setCatalogError(cached.message); }
        setLoading(false);
      });
      return () => { active = false; };
    }
    if (!requestIdRef.current || retryGeneration > 0) requestIdRef.current = crypto.randomUUID();
    const currentRequestId = requestIdRef.current;
    const contextMismatch = !discoveryContextMatchesWorld(effectiveQuestId, profileRef.current);
    if (contextMismatch) {
      const message = textRef.current("Your saved Quiz concern does not match this World. No recommendations were generated.");
      queueMicrotask(() => {
        if (!active) return;
        setSuggestions([]); setPersonalizedGoals([]); setProviderStatus("AI_UNAVAILABLE"); setProviderModel(null); setCatalogError(message); setAdvisorLifecycle("VALIDATION_ERROR"); setAdvisorRequestId(currentRequestId); setLoading(false);
        cacheAdvisorSnapshot(responseCacheKey, { outcome: "failure", lifecycle: "VALIDATION_ERROR", requestId: currentRequestId, message });
      });
      return () => { active = false; };
    }
    queueMicrotask(() => { if (active) { setAdvisorLifecycle("GENERATING"); setAdvisorRequestId(currentRequestId); } });
    void fetch("/api/healthclues/wellness-advisor", {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "X-Request-Id": currentRequestId, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ requestId: currentRequestId, questId: effectiveQuestId, ...(worldId ? { worldId } : {}), profile: profileRef.current, locale: localeRef.current, forceRefresh: retryGeneration > 0 }),
    }).then(async response => {
      let result: AdvisorResponse & { diagnosticCode?: string };
      try { result = await response.json() as AdvisorResponse & { diagnosticCode?: string }; }
      catch { throw new AdvisorUiError(textRef.current("The personalized Advisor response could not be read. Please retry."), "VALIDATION_ERROR", currentRequestId); }
      const responseId = typeof result.requestId === "string" ? result.requestId : currentRequestId;
      if (!response.ok || result.status === "AI_UNAVAILABLE") {
        const lifecycle = /schema|validat/i.test(result.diagnosticCode || "") ? "VALIDATION_ERROR" : "PROVIDER_ERROR";
        throw new AdvisorUiError(result.error || textRef.current("The personalized Advisor is currently unavailable. No generated checklist is being shown."), lifecycle, responseId);
      }
      if (responseId !== currentRequestId || (worldId && result.worldId !== worldId)) throw new AdvisorUiError(textRef.current("The Advisor response did not match this World and request. Please retry."), "VALIDATION_ERROR", currentRequestId);
      if ((result.status !== "GEMINI_AI" && result.status !== "DETERMINISTIC_DEMO" && result.status !== "SYNTHETIC_TEST") || !Array.isArray(result.suggestions) || (result.status === "GEMINI_AI" && !Array.isArray(result.goals))) {
        throw new AdvisorUiError(textRef.current("The Advisor response could not be validated. Please retry."), "VALIDATION_ERROR", responseId);
      }
      if (active) {
        cacheAdvisorSnapshot(responseCacheKey, { outcome: "success", result });
        applySuccess(result, responseId);
      }
    }).catch(error => {
      if (!active) return;
      setSuggestions([]); setProviderStatus("AI_UNAVAILABLE"); setProviderModel(null); setProviderTraceId(null);
      const failure = error instanceof AdvisorUiError ? error : new AdvisorUiError(textRef.current("The personalized Advisor could not be reached. Please check your connection and retry."), "PROVIDER_ERROR", currentRequestId);
      setAdvisorLifecycle(failure.lifecycle); setAdvisorRequestId(failure.requestId);
      setCatalogError(failure.message);
      cacheAdvisorSnapshot(responseCacheKey, { outcome: "failure", lifecycle: failure.lifecycle, requestId: failure.requestId, message: failure.message });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, effectiveQuestId, profileKey, responseCacheKey, retryGeneration, worldId]);

  const planGoals = Object.values(choices).map(goal => {
    const generated = goal.provenance === "ai_generated" ? personalizedGoals.find(item => item.goalId === goal.goalId) : undefined;
    const option = goal.generatedOption?.option;
    if (!generated || (option !== "A" && option !== "B")) return goal;
    const updated = toAiPlanGoal(generated, option, locale, providerStatus === "SYNTHETIC_TEST") as WellnessPlanGoal;
    return { ...updated, choice: goal.choice, frequency: goal.frequency, durationMinutes: goal.durationMinutes, trackingUnit: goal.trackingUnit, trackingDefinition: goal.trackingDefinition, targetValue: goal.targetValue, targetUnit: goal.targetUnit, durationDays: goal.durationDays, safetyStatus: goal.safetyStatus, userSafetyConfirmation: goal.userSafetyConfirmation };
  });
  const activeGoals = planGoals.filter(goal => goal.choice === "active");
  const hasIncompleteAiSelection = personalizedGoals.some(goal => aiIncluded[goal.goalId] && !aiSelections[goal.goalId]);
  useEffect(() => { liveSelectionCallback.current = onSelectionChange; }, [onSelectionChange]);
  useEffect(() => { initialGoalsRef.current = initialGoals; }, [initialGoals]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active || liveSelectionChanged.current || !initialGoals.length || !personalizedGoals.length) return;
      const restored: Record<string, WellnessPlanGoal> = {};
      const restoredModes: Record<string, "A" | "B" | "custom"> = {};
      const restoredIncluded: Record<string, boolean> = {};
      for (const generated of personalizedGoals) {
        const saved = initialGoals.find(goal => goal.goalId === generated.goalId);
        const option = saved?.provenance === "user_created" && saved.originalNote ? "custom" : saved?.generatedOption?.option;
        if (!saved || (option !== "A" && option !== "B" && option !== "custom") || hydratedSavedGoalIds.current.has(generated.goalId)) continue;
        hydratedSavedGoalIds.current.add(generated.goalId); restored[generated.goalId] = saved; restoredModes[generated.goalId] = option; restoredIncluded[generated.goalId] = true;
      }
      if (Object.keys(restored).length) {
        setAiSelections(current => ({ ...restored, ...current })); setAiModes(current => ({ ...restoredModes, ...current })); setAiIncluded(current => ({ ...restoredIncluded, ...current })); setChoices(current => ({ ...restored, ...current }));
        setCustomDrafts(current => ({ ...Object.fromEntries(Object.values(restored).filter(goal => goal.provenance === "user_created" && goal.originalNote).map(goal => [goal.goalId, goal.originalNote!])), ...current }));
      }
    });
    return () => { active = false; };
  }, [initialGoals, personalizedGoals]);
  useEffect(() => {
    if (liveSelectionCallback.current && liveSelectionChanged.current && !hasIncompleteAiSelection) liveSelectionCallback.current(planGoals, personalizedGoals.map(goal => goal.goalId));
  // planGoals is derived from the current checked and configured choices.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choices, hasIncompleteAiSelection]);
  const configuringTemplate = configuring?.source === "habit_library" ? byTemplateId(configuring.id.replace(/^habit:/, "")) : null;
  const goalsForGroup = (group: string) => suggestions.filter(item => (item.candidate.group || "additional") === group);
  const updateChoice = (goal: WellnessPlanGoal) => setChoices(value => ({ ...value, [goal.goalId]: goal }));

  function chooseAiOption(goal: AiWellnessGoal, option: "A" | "B") {
    liveSelectionChanged.current = true;
    const selected = toAiPlanGoal(goal, option, locale, providerStatus === "SYNTHETIC_TEST") as WellnessPlanGoal;
    const previous = aiSelections[goal.goalId];
    setAiIncluded(current => ({ ...current, [goal.goalId]: true }));
    setAiSelections(current => ({ ...current, [goal.goalId]: selected }));
    setAiModes(current => ({ ...current, [goal.goalId]: option }));
    setChoices(current => { const next = { ...current }; if (previous) delete next[previous.goalId]; next[selected.goalId] = selected; return next; });
    setCustomizingGoal(null);
  }

  function chooseAiCustom(goal: AiWellnessGoal) {
    liveSelectionChanged.current = true;
    const note = (customDrafts[goal.goalId] || "").trim();
    if (!note || note.length > 180) { setCustomError(text("Enter a short personal goal (up to 180 characters).")); return; }
    const assessment = assessPersonalGoal({ title: note, category: goal.category, goalType: "maintain", profile });
    if (!assessment.allowed) { setCustomError(text(assessment.message || "This goal needs clarification before it can be added.")); return; }
    const personal = buildPersonalPlanGoal({ title: note, category: goal.category, goalType: "maintain", frequency: "Flexible", trackingUnit: "self-reported completion", trackingDefinition: note });
    personal.goalId = goal.goalId;
    personal.choice = "active";
    personal.originalNote = note;
    personal.iconKey = goal.iconKey || resolveWellnessIcon({ text: `${localized(goal.title, locale)} ${note}`, category: goal.category }).aiHabitKey || goal.iconKey;
    const previous = aiSelections[goal.goalId];
    setAiIncluded(current => ({ ...current, [goal.goalId]: true }));
    setAiSelections(current => ({ ...current, [goal.goalId]: personal }));
    setAiModes(current => ({ ...current, [goal.goalId]: "custom" }));
    setChoices(current => { const next = { ...current }; if (previous) delete next[previous.goalId]; next[personal.goalId] = personal; return next; });
    setCustomError(""); setCustomizingGoal(null);
  }

  const handleConfirmPlan = async () => {
    setConfirming(true);
    setConfirmError("");
    try {
      await Promise.resolve(onConfirm(planGoals));
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : text("Your private Wellness Plan could not be saved. Please try again."));
    } finally {
      setConfirming(false);
    }
  };

  function openConfigure(candidate: PlanCandidate, existing?: WellnessPlanGoal) {
    setConfigError(""); setConfiguring(candidate); setEditingGoalId(existing?.goalId || null);
    setTarget(existing?.targetValue == null ? "" : String(existing.targetValue));
    setFrequency(existing?.frequency?.match(/^(\d+) days a week$/)?.[1] || (existing?.frequency === "Daily" ? "7" : ""));
    setDurationDays(existing?.durationDays == null ? "" : String(existing.durationDays));
    setTargetDetail(existing?.trackingDefinition || "");
    setFluidConfirmed(existing?.userSafetyConfirmation === true);
    setMovementConfirmed(existing?.userSafetyConfirmation === true);
    setAlcoholRisk("unknown");
  }

  function saveConfiguredGoal() {
    if (!configuring) return;
    setConfigError("");
    const template = byTemplateId(configuring.id.replace(/^habit:/, ""));
    const count = configuring.targetKind === "personal-fluid-guidance" ? null : Number(target);
    if (configuring.targetKind !== "personal-fluid-guidance" && (!target || !Number.isFinite(count) || count! < (configuring.targetKind === "movement" ? 1 : 0) || count! > 10000)) { setConfigError(text("Choose a measurable target before adding this goal.")); return; }
    const days = Number(frequency);
    if (!Number.isInteger(days) || days < 1 || days > 7) { setConfigError(text("Choose how many days per week you want to track this.")); return; }
    if (template?.requiresTargetDetail && targetDetail.trim().length < 3) { setConfigError(text("Add the specific behavior you want to track.")); return; }
    const safety = template ? evaluateHabitGoalSafety(template.id, profile, { movementConfirmed, fluidGuidanceConfirmed: fluidConfirmed, alcoholRisk }) : { allowed: true, status: "eligible_for_personal_choice" as const };
    if (!safety.allowed) { setConfigError(text(safety.message || "This goal needs more context before it can be active.")); return; }
    const unit = configuring.targetKind === "movement" ? "minutes per session" : configuring.targetKind === "personal-fluid-guidance" ? "days following existing personal guidance" : configuring.trackingUnit;
    const definition = configuring.targetKind === "personal-fluid-guidance" ? "Self-report days you followed your existing personal hydration guidance; no new volume target is set." :
      `${targetDetail.trim() ? `${targetDetail.trim()} — ` : ""}Self-report ${count} ${configuring.trackingUnit}${configuring.group === "reduce" ? " or fewer" : ""} over ${days} day${days === 1 ? "" : "s"} per week${durationDays ? ` for ${durationDays} days` : ""}.`;
    const goal = template ? buildHabitPlanGoal({ candidate: configuring, template, frequency: `${days} days a week`, trackingDefinition: definition, trackingUnit: unit || "self-reported completion", targetValue: count, targetUnit: template.targetKind === "personal-fluid-guidance" ? "personal guidance" : template.targetKind === "movement" ? "minutes/session" : configuring.trackingUnit || "self-reported completion", durationDays: durationDays ? Number(durationDays) : null, safetyStatus: safety.status, userSafetyConfirmation: template.targetKind === "personal-fluid-guidance" ? fluidConfirmed : template.targetKind === "movement" ? movementConfirmed : template.targetKind === "alcohol-reduction" ? alcoholRisk === "no" : false }) : {
      goalId: editingGoalId || `catalog:${configuring.id}:${configuring.version}`, templateId: configuring.id.replace(/^habit:/, ""), title: configuring.name,
      category: configuring.category, goalType: configuring.goalType || "maintain", choice: "active" as const, frequency: `${days} days a week`, durationMinutes: configuring.targetKind === "movement" ? count : null,
      trackingUnit: unit || "self-reported completion", trackingDefinition: definition, targetValue: count, targetUnit: configuring.targetKind === "movement" ? "minutes/session" : configuring.trackingUnit || "self-reported completion",
      durationDays: durationDays ? Number(durationDays) : null, safetyStatus: safety.status, provenance: "catalog" as const, sourceVersion: configuring.version,
      evidenceStatus: configuring.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : configuring.evidenceClass,
      explanation: configuring.whyThis || "Matches a saved Quiz preference.", safetyNote: configuring.safetyNotes, sources: configuring.evidenceSources,
    };
    const resolved = validateAndResolveGoalIcon({ title: goal.title, category: goal.category });
    goal.iconKey = (resolved.aiHabitKey || resolved.iconKey) as string;
    const validation = validateConfiguredGoal(goal);
    if (validation) { setConfigError(text(validation)); return; }
    updateChoice(goal); setConfiguring(null); setEditingGoalId(null);
  }

  function setSaved(candidate: PlanCandidate) {
    const template = byTemplateId(candidate.id.replace(/^habit:/, ""));
    const id = template ? `habit:${template.id}:${template.version}` : `catalog:${candidate.id}:${candidate.version}`;
    const resolved = validateAndResolveGoalIcon({ title: candidate.name, category: candidate.category });
    updateChoice({ goalId: id, templateId: template?.id || candidate.id, title: candidate.name, category: candidate.category, iconKey: (resolved.aiHabitKey || resolved.iconKey) as string, goalType: candidate.goalType || "maintain", choice: "saved", frequency: "Flexible", durationMinutes: null, trackingUnit: candidate.trackingUnit || "self-reported completion", trackingDefinition: "Saved for later; no active target has been configured.", safetyStatus: "insufficient_information", provenance: template ? "habit_library" : "catalog", sourceVersion: candidate.version, evidenceStatus: template?.evidenceStatus || (candidate.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : candidate.evidenceClass), explanation: candidate.whyThis || "Matches your saved Quiz context.", safetyNote: candidate.safetyNotes, sources: candidate.evidenceSources });
  }

  function skipCandidate(candidate: PlanCandidate) {
    const template = byTemplateId(candidate.id.replace(/^habit:/, ""));
    const id = template ? `habit:${template.id}:${template.version}` : `catalog:${candidate.id}:${candidate.version}`;
    const resolved = validateAndResolveGoalIcon({ title: candidate.name, category: candidate.category });
    updateChoice({ goalId: id, templateId: template?.id || candidate.id, title: candidate.name, category: candidate.category, iconKey: (resolved.aiHabitKey || resolved.iconKey) as string, goalType: candidate.goalType || "maintain", choice: "skipped", frequency: "Flexible", durationMinutes: null, trackingUnit: candidate.trackingUnit || "self-reported completion", trackingDefinition: "Skipped during onboarding.", safetyStatus: "eligible_for_personal_choice", provenance: template ? "habit_library" : "catalog", sourceVersion: candidate.version, evidenceStatus: template?.evidenceStatus || (candidate.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED" : candidate.evidenceClass), explanation: candidate.whyThis || "Matches your saved Quiz context.", safetyNote: candidate.safetyNotes, sources: candidate.evidenceSources });
  }

  function addCustomNote() {
    setCustomError("");
    const originalNote = customNote.trim();
    if (!originalNote || originalNote.length > 180) { setCustomError(text("Enter a short personal goal (up to 180 characters).")); return; }
    const goalType: "maintain" | "reduce" | "avoid" = /\b(avoid|stop|quit|give up)\b/i.test(originalNote) ? "avoid" : /\b(reduce|less|fewer|limit)\b/i.test(originalNote) ? "reduce" : "maintain";
    const category = /\b(walk|run|exercise|move|movement|mobility|workout)\b/i.test(originalNote) ? "movement" : /\b(sleep|bed|wind.down|rest)\b/i.test(originalNote) ? "sleep" : /\b(food|meal|vegetable|soda|sugary drink|water|hydration|alcohol|eat|drink)\b/i.test(originalNote) ? "nutrition" : "general routine";
    const assessment = assessPersonalGoal({ title: originalNote, category, goalType, profile });
    if (!assessment.allowed) { setCustomError(text(assessment.message || "This goal needs clarification before it can be added.")); return; }
    const goal = buildPersonalPlanGoal({ title: originalNote, category, goalType, frequency: "Flexible", trackingUnit: "self-reported completion", trackingDefinition: `Unconfigured personal goal draft. No target or schedule has been inferred. Original note: ${originalNote}` });
    const resolved = validateAndResolveGoalIcon({ title: originalNote, category });
    goal.iconKey = (resolved.aiHabitKey || resolved.iconKey) as string;
    updateChoice({ ...goal, goalId: editingCustomGoalId || goal.goalId, originalNote, choice: "saved", safetyStatus: "user_created_unreviewed" });
    setEditingCustomGoalId(null); setCustomNote("");
  }

  function habitCard(candidate: PlanCandidate, safetyStatus: string, reason: string, safetyNote: string | null) {
    const goalId = candidate.source === "habit_library" ? `habit:${candidate.id.replace(/^habit:/, "")}:${candidate.version}` : `catalog:${candidate.id}:${candidate.version}`;
    const current = choices[goalId];
    const blocked = safetyStatus === "ineligible";
    return <article key={goalId} className="rounded-2xl border border-[#dddcca] bg-white p-4 shadow-sm" data-plan-suggestion={candidate.id}>
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{candidate.name}</h3><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded-full bg-[#edf2e7] px-2 py-1 font-semibold capitalize">{candidate.category} · {candidate.goalType === "reduce" ? "Reduce" : "Build"}</span></div></div>{candidate.category === "sleep" ? <Moon aria-hidden className="h-5 w-5 text-indigo-700"/> : <Sparkles aria-hidden className="h-5 w-5 shrink-0 text-amber-700"/>}</div>
      <p className="mt-2 text-sm leading-relaxed text-[#56675d]">{candidate.description}</p>
      {safetyStatus !== "eligible_for_personal_choice" && <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-950"><ShieldCheck className="h-4 w-4 shrink-0"/>{safetyNote || "More context is needed before this can become an active goal."}</p>}
      <details className="mt-3 border-t border-[#ececdf] pt-2"><summary className="cursor-pointer text-xs font-bold text-emerald-900">{text("Why this? · Sources & safety")}</summary><p className="mt-2 text-xs leading-relaxed"><strong>{text("Why:")}</strong> {reason}</p><p className="mt-2 text-xs leading-relaxed"><strong>{text("Evidence:")}</strong> {candidate.evidenceSummary || candidate.evidenceClass}. <strong>{text("Review:")}</strong> {candidate.demoOnly ? "TEST ONLY · NOT HUMAN-REVIEWED; this is not approved guidance." : "Current catalog review status is shown above."}</p>{safetyNote && <p className="mt-2 text-xs leading-relaxed"><strong>{text("Safety:")}</strong> {safetyNote}</p>}{candidate.evidenceSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-emerald-900 underline">{source.title}</a>)}</details>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => openConfigure(candidate, current)} disabled={blocked} className="min-h-10 rounded-lg bg-[#173f36] px-4 text-xs font-extrabold text-white disabled:opacity-40">{current?.choice === "active" ? "Adjust" : "Add"}</button><button type="button" onClick={() => setSaved(candidate)} className="min-h-10 rounded-lg border border-[#cfd7c8] px-3 text-xs font-bold">{text("Save for later")}</button><button type="button" onClick={() => skipCandidate(candidate)} className="min-h-10 rounded-lg px-3 text-xs font-bold text-[#627166] underline">{text("Skip")}</button></div>
      {current && <p role="status" className="mt-2 text-xs font-bold text-emerald-900">{current.choice === "active" ? `Ready · ${current.targetValue ?? "personal guidance"} ${current.targetUnit || ""} · ${current.frequency}` : current.choice === "saved" ? "Saved for later · not active" : "Skipped"}</p>}
    </article>;
  }

  const groups = [
    { id: "build", title: "Healthy Habits to Build", icon: <Leaf className="h-5 w-5 text-emerald-800"/> },
    { id: "reduce", title: "Habits to Reduce or Avoid", icon: <ShieldCheck className="h-5 w-5 text-amber-800"/> },
    { id: "additional", title: "Additional Wellness Habits", icon: <Moon className="h-5 w-5 text-indigo-800"/> },
  ];

  const petRegion = (questId === "sleep-better" || profile.adaptiveDiscovery?.focusId === "sleep" || /sleep/i.test(profile.topic)) ? "sleep-better" : "health-concern";
  const petName = petRegion === "sleep-better" ? "Luna" : "Lumi";
  const displayFocus = profile.adaptiveDiscovery ? localizedDiscoveryConcern(profile, locale) : text(healthCluesQuizOption(locale, profile.topic));
  const selectedCount = Object.values(aiIncluded).filter(Boolean).length;
  const totalGoals = personalizedGoals.length || 4;

  return <section className={styles.builder} aria-labelledby="hc-plan-title" data-healthclues-plan-builder data-advisor-lifecycle={advisorLifecycle} data-advisor-request-id={advisorRequestId || undefined}>
    {/* Top Bar: Brand Pill + Truthful Status Pill */}
    <div className={styles.topBar}>
      <div className={styles.brandPill}>
        <span>🌿</span>
        <span className={styles.brandText}>HealthClues</span>
      </div>
      <div className={styles.statusPill} data-advisor-status={providerStatus} data-advisor-response-id={providerTraceId || undefined}>
        {providerStatus === "GEMINI_AI"
          ? `✨ Gemini AI · ${providerModel || text("configured model")}`
          : providerStatus === "DETERMINISTIC_DEMO"
          ? `📜 ${locale === "vi" ? "Chế độ thử nghiệm" : text("Deterministic Demo")}`
          : providerStatus === "SYNTHETIC_TEST"
          ? `🧪 ${text("Synthetic Test Fixture · not Gemini-generated")}`
          : providerStatus === "AI_UNAVAILABLE"
          ? `⚠️ ${locale === "vi" ? "AI tạm ngắt kết nối" : text("AI Unavailable")}`
          : `⏳ ${locale === "vi" ? "Đang tạo danh sách thói quen..." : text("Contacting Advisor…")}`}
      </div>
    </div>

    {!review ? <>
      <p className="sr-only" role="status" aria-live="polite">
        {text(advisorLifecycle === "REQUEST_NOT_STARTED" ? "Personalized recommendations have not started yet." : advisorLifecycle === "GENERATING" ? "Preparing personalized recommendations." : advisorLifecycle === "SUCCESS_WITH_GOALS" ? "Personalized recommendations are available." : advisorLifecycle === "PROVIDER_ERROR" ? "Recommendation generation failed." : advisorLifecycle === "VALIDATION_ERROR" ? "The recommendations could not be validated." : "No recommendations are available.")}
      </p>

      {/* Companion Section: Mascot + Clean Speech Bubble */}
      <aside className={styles.petGuide} aria-label={`${petName}'s guidance`}>
        <div className={styles.petPortrait}>
          {petRegion === "sleep-better" ? (
            <HealthCluesPet region="sleep-better" topic={profile.topic} pose="guide" className={styles.lumiCleanFox} />
          ) : (
            <img src="/healthclues/assets/ui/lumi_fox_clean.png" alt={petName} className={styles.lumiCleanFox} />
          )}
        </div>
        <div className={styles.petSpeech}>
          <div className={styles.lumiBadgeRow}>
            <span className={styles.lumiBadge}>✦ {petName}</span>
          </div>
          <p>
            {locale === "vi" ? (
              <>Mình đã chuẩn bị một số mục tiêu phù hợp với mong muốn <strong>{displayFocus}</strong> của bạn. Bạn có thể chọn những mục tiêu muốn thực hiện, điều chỉnh mức độ hoặc bỏ qua bất kỳ mục nào nhé!</>
            ) : (
              <>Welcome, adventurer! Based on your wellness focus on <strong>{displayFocus}</strong>, I&apos;ve gathered practical habit quests for you. Choose what feels right, adjust the level, or skip any you prefer!</>
            )}
          </p>
        </div>
      </aside>

      {/* Plaque Banner: Centered Ornate Emerald & Gold Plaque */}
      <div className={styles.plaqueBanner}>
        <div className={styles.plaqueInner}>
          <span className={styles.plaqueStar}>✦</span>
          <h1 id="hc-plan-title" className={styles.plaqueTitle}>
            {locale === "vi" ? "Kế hoạch dành cho bạn" : "Plan for you"}
          </h1>
          <span className={styles.plaqueStar}>✦</span>
        </div>
      </div>

      <div className={styles.questSlotsHud} aria-label={text("Quest Slots")}>
        <div className={styles.questSlotsGrid}>
          {[0, 1, 2].map(slotIndex => {
            const activeGoalIds = personalizedGoals.filter(goal => aiIncluded[goal.goalId]).map(goal => goal.goalId);
            const currentId = activeGoalIds[slotIndex];
            const goal = currentId ? personalizedGoals.find(g => g.goalId === currentId) : null;
            return <div key={slotIndex} className={goal ? styles.questSlotFilled : styles.questSlotEmpty}>{text("equipped")}</div>;
          })}
        </div>
      </div>
      <div className={styles.gameNotice} data-advisor-status={providerStatus} />

      {loading ? (
        <div role="status" className="mt-6 rounded-xl bg-white p-5 text-center font-bold" data-advisor-loading>
          <p>{text("Generating your personalized checklist…")}</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onSkip}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
            >
              {text("Skip plan and preview World")}
            </button>
          </div>
        </div>
      ) : providerStatus === "AI_UNAVAILABLE" ? (
        <div role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm" data-advisor-error={advisorLifecycle}>
          <p>{catalogError || text("The personalized Advisor is currently unavailable. No generated checklist is being shown.")}</p>
          {advisorRequestId && <small className="mt-2 block">{text("Support reference")}: {advisorRequestId}</small>}
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => { requestIdRef.current = null; setCatalogError(""); setLoading(true); setProviderStatus("loading"); setProviderTraceId(null); setSuggestions([]); setRetryGeneration(value => value + 1); }} className="min-h-10 rounded-lg border border-rose-300 px-4 font-bold">{text("Retry Gemini")}</button>
            <button type="button" onClick={onSkip} className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50">{text("Skip plan and preview World")}</button>
          </div>
        </div>
      ) : (
        <>
          {/* Goal Cards List */}
          <div className={styles.goalsList}>
            {personalizedGoals.map((goal, index) => {
              const selected = aiSelections[goal.goalId];
              const included = aiIncluded[goal.goalId] === true;
              const selectedChoice = aiModes[goal.goalId] || (selected?.provenance === "ai_generated" ? (selected as WellnessPlanGoal & { generatedOption?: { option?: string } }).generatedOption?.option : selected ? "custom" : undefined);
              const goal3d = getGoal3DIcon(goal, index, locale);
              return (
                <article
                  key={goal.goalId}
                  data-ai-goal={goal.goalId}
                  className={`${styles.goalCard} ${included ? styles.goalSelected : styles.goalSubdued}`}
                >
                  {/* Left Column: Checkbox, 3D Icon, Title, Subtitle */}
                  <div className={styles.goalLeft}>
                    <label className={styles.checkWrap} aria-label={`${text("Include goal")}: ${localized(goal.title, locale)}`}>
                      <input type="checkbox" checked={included} onChange={event => {
                          liveSelectionChanged.current = true;
                          const checked = event.target.checked;
                          setAiIncluded(current => ({ ...current, [goal.goalId]: checked }));
                          if (checked && !aiSelections[goal.goalId]) {
                            chooseAiOption(goal, "A");
                          } else {
                            setChoices(current => {
                              const next = { ...current };
                              const previous = aiSelections[goal.goalId];
                              if (previous) delete next[previous.goalId];
                              if (checked && previous) next[previous.goalId] = previous;
                              return next;
                            });
                          }
                        }}
                        className={styles.realCheck}
                      />
                      <span className={`${styles.customCheckSquare} ${included ? styles.customCheckSquareActive : ""}`}>
                        {included ? "✓" : ""}
                      </span>
                      <span className={styles.srOnly}>{text("Include goal")}</span>
                    </label>

                    <div className={styles.goalIconWrap}>
                      <img src={goal3d} alt="" className={styles.goal3DIcon} />
                      <HealthCluesGameIcon
                        icon={personalizedGoalIcon(goal, locale)}
                        tone={goal.category === "sleep" ? "lavender" : "botanical"}
                        className={styles.goalGameIconBehind}
                      />
                    </div>

                    <div className={styles.goalCopy}>
                      <h3 className={styles.goalTitle}>{localized(goal.title, locale)} <span className={styles.rewardBadge}>✨ +20 EXP</span></h3>
                      <p className={styles.goalSubtitle}>{localized(goal.relevanceReason, locale)}</p>
                    </div>
                  </div>

                  {/* Right Column: 3 Options (A, B, Custom) */}
                  <div className={styles.optionsBox} aria-label={text("Choose an implementation level")}>
                    {/* Option A & Option B */}
                    {[{ key: "A" as const, item: goal.optionA, badge: text("Start Small") }, { key: "B" as const, item: goal.optionB, badge: text("Level Up") }].map(({ key, item, badge }) => (
                      <label key={key} className={styles.optionChoice}>
                        <input
                          type="radio"
                          name={`goal-${goal.goalId}`}
                          checked={selectedChoice === key}
                          onChange={() => chooseAiOption(goal, key)}
                          aria-label={`${text("Option")} ${key}`}
                          className={styles.realRadio}
                        />
                        <span className={`${styles.radioCircle} ${selectedChoice === key ? styles.radioCircleSelected : ""}`}>
                          {selectedChoice === key && <span className={styles.radioInnerDot} />}
                        </span>
                        <span className={styles.optionLabel}>
                          <span className={styles.stepBadge}>{badge}</span>
                          {localized(item.action, locale) || localized(item.title, locale)}
                        </span>
                      </label>
                    ))}

                    {/* Option Custom with inline text input */}
                    <div className={styles.customChoiceRow}>
                      <label className={styles.optionChoice}>
                        <input
                          type="radio"
                          name={`goal-${goal.goalId}`}
                          checked={selectedChoice === "custom"}
                          onChange={() => {
                            setCustomError("");
                            setAiModes(current => ({ ...current, [goal.goalId]: "custom" }));
                            setCustomizingGoal(goal.goalId);
                          }}
                          aria-label={text("Custom")}
                          className={styles.realRadio}
                        />
                        <span className={`${styles.radioCircle} ${selectedChoice === "custom" ? styles.radioCircleSelected : ""}`}>
                          {selectedChoice === "custom" && <span className={styles.radioInnerDot} />}
                        </span>
                        <span className={styles.optionLabel}>
                          {locale === "vi" ? "Tự điều chỉnh" : "Custom"}
                        </span>
                      </label>

                      <div className={styles.customInlineWrap}>
                        <input
                          aria-label={text("Your custom goal")}
                          maxLength={180}
                          value={customDrafts[goal.goalId] || ""}
                          onChange={event => setCustomDrafts(current => ({ ...current, [goal.goalId]: event.target.value }))}
                          onFocus={() => {
                            setCustomError("");
                            setAiModes(current => ({ ...current, [goal.goalId]: "custom" }));
                            setCustomizingGoal(goal.goalId);
                          }}
                          placeholder={locale === "vi" ? "✏️ Nhập mục tiêu của bạn..." : "✏️ Enter your goal..."}
                          className={styles.customInput}
                        />
                        <button
                          type="button"
                          onClick={() => chooseAiCustom(goal)}
                          className={styles.customSaveBtn}
                        >
                          {locale === "vi" ? "Lưu" : "Save"}
                        </button>
                      </div>
                      {customError && customizingGoal === goal.goalId && (
                        <p role="alert" className={styles.customErrorText}>{text(customError)}</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!personalizedGoals.length && (
            <div role="status" className="mt-5 rounded-xl border border-dashed bg-white p-5 text-sm text-center">
              {text("No suitable, safety-checked suggestions were available for the Quiz profile. You can continue without goals or add your own.")}
            </div>
          )}

          {/* Bottom Notice Banner */}
          <div className={styles.noticeBanner}>
            <span className={styles.infoBadge}>i</span>
            <p className={styles.noticeText}>
              {locale === "vi"
                ? "Lưu ý: Các mục tiêu chỉ mang tính gợi ý. Hãy lựa chọn và điều chỉnh theo tình trạng sức khỏe, khả năng của bản thân và lời khuyên của chuyên gia y tế khi cần thiết."
                : "Note: These goals are suggestions only. Please choose and adjust according to your health condition, capabilities, and professional medical advice when necessary."}
            </p>
          </div>

          {providerStatus === "SYNTHETIC_TEST" && (
            <p className={styles.syntheticNotice}>
              Synthetic test fixture only. Not personalized advice or Gemini-generated; confirming saves this test selection to the current local account.
            </p>
          )}

          {/* Footer Action Bar */}
          <div className={styles.footerBar}>
            <div className={styles.counterPill} data-selected-goal-count>
              <span>📋</span>
              <span>{locale === "vi" ? `Đã chọn ${selectedCount}/${totalGoals} mục tiêu` : `Selected ${selectedCount}/${totalGoals} goals`}</span>
              <span>🍃</span>
            </div>

            <div className={styles.actionGroup}>
              <button
                type="button"
                onClick={onSkip}
                className={styles.skipBtn}
              >
                {text("Skip suggestions & continue")}
              </button>

              <button
                type="button"
                data-confirm-wellness-plan
                disabled={loading || hasIncompleteAiSelection || confirming}
                onClick={handleConfirmPlan}
                className={styles.confirmBtn}
              >
                {confirming ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    <span>{locale === "vi" ? "Đang lưu kế hoạch…" : "Saving Plan…"}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.confirmCheck}>✔</span>
                    <span>{locale === "vi" ? "Xác nhận kế hoạch" : "Confirm Plan"}</span>
                  </>
                )}
              </button>
            </div>
            {confirmError && (
              <p role="alert" className="mt-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg p-2.5 text-center">
                {confirmError}
              </p>
            )}
          </div>
        </>
      )}
    </> : <>
      <h1 id="hc-plan-title" className="mt-2 text-3xl font-black">{text("My Wellness Plan")}</h1><p className="mt-2 text-sm text-[#5d6e62]">{text("Confirm only goals you configured. These are personal tracking choices, not treatment instructions.")}</p>
      {activeGoals.length ? <section className="mt-5"><h2 className="font-extrabold">{text("Ready to activate")}</h2><div className="mt-2 space-y-2">{activeGoals.map(goal => <article key={goal.goalId} className="rounded-xl border bg-white p-3"><strong>{goal.title}</strong><p className="mt-1 text-xs capitalize text-[#617065]">{text(goal.goalType)} · {goal.targetValue ?? "personal"} {text(goal.targetUnit || "guidance")} · {text(goal.frequency)}</p><p className="mt-1 text-xs">{text("Track:")} {goal.trackingDefinition}</p><p className="mt-1 text-[11px] font-semibold text-amber-900">{text(goal.evidenceStatus)}</p><div className="mt-2 flex gap-2"><button type="button" className="text-xs font-bold underline" onClick={() => { if (goal.provenance === "user_created") { setEditingCustomGoalId(goal.goalId); setCustomNote(goal.originalNote || goal.title); setReview(false); return; } const candidate = suggestions.find(item => item.candidate.source === (goal.provenance === "habit_library" ? "habit_library" : "catalog") && (goal.provenance === "habit_library" ? `habit:${item.candidate.id.replace(/^habit:/, "")}:${item.candidate.version}` === goal.goalId : item.candidate.id === goal.templateId)); if (candidate) openConfigure(candidate.candidate, goal); }}>{text("Edit")}</button><button type="button" className="text-xs font-bold underline" onClick={() => setChoices(value => { const next = { ...value }; delete next[goal.goalId]; return next; })}>{text("Remove")}</button><button type="button" className="text-xs font-bold underline" onClick={() => updateChoice({ ...goal, choice: "saved", safetyStatus: "insufficient_information" })}>{text("Save for later")}</button></div></article>)}</div></section> : <p className="mt-5 rounded-xl bg-[#edf2e7] p-4 text-sm">{text("No active goals selected. You can continue with an empty plan.")}</p>}
      {planGoals.some(goal => goal.choice === "saved") && <section className="mt-5"><h2 className="font-extrabold">{text("Saved for Later")}</h2><div className="mt-2 space-y-2">{planGoals.filter(goal => goal.choice === "saved").map(goal => <article key={goal.goalId} className="rounded-xl border bg-white p-3"><strong className="text-sm">{goal.title}</strong><p className="mt-1 text-xs text-[#617065]">{goal.originalNote ? "Personal draft · target and schedule not configured" : "No active target has been configured"}</p><div className="mt-2 flex gap-3"><button type="button" className="text-xs font-bold underline" onClick={() => { if (goal.originalNote) { setEditingCustomGoalId(goal.goalId); setCustomNote(goal.originalNote); setReview(false); } else { const candidate = suggestions.find(item => item.candidate.source === (goal.provenance === "habit_library" ? "habit_library" : "catalog") && (goal.provenance === "habit_library" ? `habit:${item.candidate.id.replace(/^habit:/, "")}:${item.candidate.version}` === goal.goalId : item.candidate.id === goal.templateId)); if (candidate) { setReview(false); openConfigure(candidate.candidate, goal); } } }}>{text("Edit")}</button><button type="button" className="text-xs font-bold underline" onClick={() => setChoices(value => { const next = { ...value }; delete next[goal.goalId]; return next; })}>{text("Remove")}</button></div></article>)}</div></section>}
      {planGoals.some(goal => goal.choice === "skipped") && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">{text("Skipped suggestions")}</summary><ul className="mt-2 list-inside list-disc text-sm">{planGoals.filter(goal => goal.choice === "skipped").map(goal => <li key={goal.goalId}>{goal.title}</li>)}</ul></details>}
      <p className="mt-5 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed"><CircleHelp className="h-4 w-4 shrink-0"/>{text("Your targets are self-selected for tracking, not medically assessed. Unrecorded days are not failures.")}</p>
      <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <button type="button" onClick={() => setReview(false)} className={styles.skipBtn}>{text("Edit choices")}</button>
        <button
          type="button"
          disabled={confirming}
          onClick={async () => {
            setConfirming(true);
            setConfirmError("");
            try {
              await Promise.resolve(onConfirm(planGoals));
            } catch (err) {
              setConfirmError(err instanceof Error ? err.message : text("Your private Wellness Plan could not be saved. Please try again."));
            } finally {
              setConfirming(false);
            }
          }}
          className={styles.confirmBtn}
        >
          {confirming ? (
            <>
              <span className="inline-block animate-spin mr-1">⏳</span>
              <span>{locale === "vi" ? "Đang lưu kế hoạch…" : "Saving Plan…"}</span>
            </>
          ) : (
            <>
              <span className={styles.confirmCheck}>✔</span>
              <span>{locale === "vi" ? "Xác nhận kế hoạch" : "Confirm My Plan"}</span>
            </>
          )}
        </button>
      </div>
    </>}
    {configuring && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfiguring(null); }}><section role="dialog" aria-modal="true" aria-labelledby="goal-config-title" className="my-auto max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fbfaf4] p-5 shadow-2xl"><h2 id="goal-config-title" className="text-xl font-black">{text("Configure:")} {configuring.name}</h2><p className="mt-2 text-sm text-[#56675d]">{configuring.measurementPrompt || configuring.description}</p>
      {configuring.targetKind === "personal-fluid-guidance" ? profile.safetyContext?.fluidRestriction === "no" ? <label className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm"><input type="checkbox" checked={fluidConfirmed} onChange={event => setFluidConfirmed(event.target.checked)}/><span>{text("Your Quiz indicates no fluid restriction. Continue only if you already have personal hydration guidance to follow. No new volume target is provided.")}</span></label> : null : <label className="mt-4 block text-sm font-bold">{configuring.targetKind === "movement" ? "Minutes per session (you choose)" : configuring.group === "reduce" ? `Your weekly ${configuring.trackingUnit} limit` : `Your target · ${configuring.trackingUnit}`}<input autoFocus type="number" min="0" max="10000" value={target} onChange={event => setTarget(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" placeholder="Enter your target"/></label>}
      <label className="mt-3 block text-sm font-bold">{text("Days per week")}<select value={frequency} onChange={event => setFrequency(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"><option value="">{text("Choose days")}</option>{frequencies.map(value => <option key={value} value={value}>{value} {text("days per week")}</option>)}</select></label>
      {configuring.targetKind === "alcohol-reduction" && <fieldset className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3"><legend className="px-1 text-sm font-bold">{text("Safety check")}</legend><p className="text-xs">{text("Do you drink heavily or most days, or have you had withdrawal symptoms when cutting down?")}</p>{(["no", "yes", "unknown"] as const).map(value => <label key={value} className="mr-4 mt-2 inline-flex items-center gap-1 text-sm"><input type="radio" name="alcohol-risk" checked={alcoholRisk === value} onChange={() => setAlcoholRisk(value)}/>{value === "unknown" ? "Prefer not to say / unsure" : value === "yes" ? "Yes" : "No"}</label>)}</fieldset>}
      {configuring.targetKind === "movement" && (profile.safetyContext?.acutePainfulJoint !== "no" || profile.safetyContext?.activityRestriction !== "no") && <label className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm"><input type="checkbox" checked={movementConfirmed} onChange={event => setMovementConfirmed(event.target.checked)}/><span>{text("I currently do not report a painful joint or activity restriction. This self-report is not medical clearance.")}</span></label>}
      {configuring.targetKind === "personal-fluid-guidance" && profile.safetyContext?.fluidRestriction !== "no" && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{text("No active hydration goal can be set because your fluid restriction is unknown or reported.")}</p>}
      {configuring.targetKind === "movement" && (profile.safetyContext?.acutePainfulJoint === "yes" || profile.safetyContext?.activityRestriction === "yes") && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">{text("This movement goal cannot be activated with the current Quiz safety answers.")}</p>}
      {configuring.category === "sleep" && <p className="mt-3 text-xs">{text("No fixed bedtime is required. Track the routine you choose, not sleep quality.")}</p>}
      {configuringTemplate?.requiresTargetDetail && <label className="mt-3 block text-sm font-bold">{text("What specific behavior will you track?")}<input maxLength={160} value={targetDetail} onChange={event => setTargetDetail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" placeholder="Describe your chosen behavior"/></label>}
      {configuring.targetKind !== "personal-fluid-guidance" && <label className="mt-3 block text-sm font-bold">{text("Optional duration in days")}<input type="number" min="1" max="365" value={durationDays} onChange={event => setDurationDays(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border px-3" placeholder="Leave blank for ongoing"/></label>}
      {configError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{configError}</p>}
      <div className="mt-5 flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setConfiguring(null)} className="min-h-11 rounded-lg border px-4 text-sm font-bold">{text("Cancel")}</button><button type="button" onClick={saveConfiguredGoal} disabled={configuring.targetKind === "personal-fluid-guidance" && profile.safetyContext?.fluidRestriction !== "no"} className="min-h-11 rounded-lg bg-[#173f36] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check className="mr-1 inline h-4 w-4"/>{text("Add configured goal")}</button></div>
      </section></div>}
  </section>;
}
