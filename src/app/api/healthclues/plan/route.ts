import { NextResponse } from "next/server";
import { assessPersonalGoal, evaluateHabitGoalSafety, isLocalizedRecommendationSnapshot, WELLNESS_HABIT_LIBRARY, type WellnessPlanGoal } from "@/features/healthclues/wellness-plan";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import { validatePersistedAiGoal } from "@/features/healthclues/personalized-wellness-plan";
import { verifiedGeneratedGoalFromProof } from "@/features/healthclues/server/wellness-plan-proof";
import { wellnessContextKey } from "@/features/healthclues/server/wellness-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type SavedPlan = { worldId: string; requestKey: string; version: number; confirmedAt: string; goals: WellnessPlanGoal[]; contextKey?: string };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const worldId = new URL(request.url).searchParams.get("worldId");
  if (!validUuid(worldId)) return NextResponse.json({ error: "A valid World is required." }, { status: 400, headers });
  try {
    const world = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!world.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers });
    const rows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
    const history = Array.isArray(rows[0]?.profile.wellnessPlans) ? rows[0].profile.wellnessPlans as SavedPlan[] : [];
    const contextKey = wellnessContextKey(rows[0]?.profile);
    const current = history.filter(plan => plan.worldId === worldId && (typeof plan.contextKey !== "string" || plan.contextKey === contextKey)).sort((a, b) => b.version - a.version)[0] ?? null;
    return NextResponse.json({ plan: current }, { headers });
  } catch { return NextResponse.json({ error: "Your private Wellness Plan could not be loaded." }, { status: 503, headers }); }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  if (!auth.emailConfirmed) return NextResponse.json({ error: "Verify your email before saving a Wellness Plan." }, { status: 403, headers });
  let body: { worldId?: unknown; requestKey?: unknown; confirmed?: unknown; goals?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Confirm your plan before saving it." }, { status: 400, headers }); }
  if (!validUuid(body.worldId) || !validUuid(body.requestKey) || body.confirmed !== true || !Array.isArray(body.goals) || body.goals.length > 24) return NextResponse.json({ error: "The confirmed Wellness Plan is incomplete." }, { status: 400, headers });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers });
    const profileRows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${auth.id}&select=profile&limit=1`);
    if (!profileRows.length) return NextResponse.json({ error: "Complete the Discovery Quiz before saving a plan." }, { status: 409, headers });
    const profile = profileRows[0].profile as unknown as HealthCluesProfile & { wellnessPlans?: SavedPlan[] };
    const history = Array.isArray(profile.wellnessPlans) ? profile.wellnessPlans : [];
    const currentContextKey = wellnessContextKey(profile);
    const existing = history.find(plan => plan.worldId === body.worldId && plan.requestKey === body.requestKey && (typeof plan.contextKey !== "string" || plan.contextKey === currentContextKey));
    if (existing) return NextResponse.json({ plan: existing, reused: true }, { headers });
    const goals = normalizeGoals(body.goals);
    if (!goals) return NextResponse.json({ error: "One or more goals need review before this plan can be saved." }, { status: 400, headers });
    const priorAiGoals = history.filter(plan => plan.worldId === body.worldId && (typeof plan.contextKey !== "string" || plan.contextKey === currentContextKey)).flatMap(plan => plan.goals.filter(goal => goal.provenance === "ai_generated"));
    for (const goal of goals.filter(item => item.provenance === "ai_generated")) {
      const previouslyAccepted = priorAiGoals.some(previous => previous.goalId === goal.goalId && previous.title === goal.title && previous.category === goal.category && previous.explanation === goal.explanation && previous.trackingDefinition === goal.trackingDefinition && JSON.stringify(previous.generatedOption) === JSON.stringify(goal.generatedOption) && JSON.stringify(previous.sources) === JSON.stringify(goal.sources) && JSON.stringify(previous.localizedRecommendation) === JSON.stringify(goal.localizedRecommendation));
      const signedSource = goal.advisorProof ? verifiedGeneratedGoalFromProof(goal, profile) : null;
      const signedNewGoal = Boolean(signedSource);
      if (!(["active", "saved"].includes(goal.choice)) || goal.templateId !== null || goal.sourceVersion !== 1 || !goal.generatedOption || !["A", "B"].includes(goal.generatedOption.option) || !["en", "vi"].includes(goal.generatedOption.locale) || (!signedNewGoal && !previouslyAccepted) || !validatePersistedAiGoal(goal)) return NextResponse.json({ error: "A generated goal did not pass the current safety checks." }, { status: 409, headers });
      if (signedSource) {
        goal.localizedRecommendation = { title: signedSource.title, relevanceReason: signedSource.relevanceReason, optionA: signedSource.optionA, optionB: signedSource.optionB };
        const fixtureOnly = isHealthCluesOwnerDemo() && goal.evidenceStatus === "SYNTHETIC TEST ONLY · NOT PERSONALIZED ADVICE";
        goal.evidenceStatus = fixtureOnly ? "SYNTHETIC TEST ONLY · NOT PERSONALIZED ADVICE" : "AI-GENERATED · NOT A MEDICAL ASSESSMENT";
      }
      delete goal.advisorProof;
    }
    const catalogGoals = goals.filter(goal => goal.provenance === "catalog" && goal.templateId);
    const habitGoals = goals.filter(goal => goal.provenance === "habit_library");
    if (habitGoals.length && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "These source-grounded candidate templates are only available in the isolated TEST ONLY owner demo pending editorial review." }, { status: 409, headers });
    for (const goal of habitGoals) {
      const template = WELLNESS_HABIT_LIBRARY.find(item => item.id === goal.templateId && item.version === goal.sourceVersion);
      if (!template || goal.title !== template.title || goal.category !== template.category || goal.goalType !== template.goalType) return NextResponse.json({ error: "A selected habit template is unavailable or was changed unexpectedly." }, { status: 409, headers });
      goal.evidenceStatus = template.evidenceStatus;
      goal.explanation = typeof goal.explanation === "string" ? goal.explanation.slice(0, 500) : template.title;
      goal.safetyNote = template.safetyNote;
      goal.sources = template.sourceRefs;
      if (goal.choice === "active" && goal.safetyStatus !== "eligible_for_personal_choice") return NextResponse.json({ error: "A selected habit template is not eligible for an active goal." }, { status: 409, headers });
      if (goal.choice === "active") {
        const confirmed = goal.userSafetyConfirmation === true;
        const safety = evaluateHabitGoalSafety(template.id, profile, {
          movementConfirmed: template.targetKind === "movement" && confirmed,
          fluidGuidanceConfirmed: template.targetKind === "personal-fluid-guidance" && confirmed,
          alcoholRisk: template.targetKind === "alcohol-reduction" ? goal.safetyStatus === "eligible_for_personal_choice" && confirmed ? "no" : "unknown" : undefined,
        });
        const targetValid = template.targetKind === "personal-fluid-guidance"
          ? goal.targetValue === null && goal.targetUnit === "personal guidance"
          : typeof goal.targetValue === "number" && goal.targetValue >= (template.targetKind === "movement" ? 1 : 0) && goal.targetUnit === (template.targetKind === "movement" ? "minutes/session" : template.trackingUnit);
        if (!safety.allowed || !targetValid || !/^([1-7]) days a week$/.test(goal.frequency) || !goal.trackingDefinition.trim() || goal.durationDays !== null && goal.durationDays !== undefined && (!Number.isInteger(goal.durationDays) || goal.durationDays < 1 || goal.durationDays > 365)) return NextResponse.json({ error: safety.message || "Configure a valid measurable target and schedule before activating this goal." }, { status: 409, headers });
      }
    }
    const catalogById = new Map<string, { current_version: number; recommendation_eligible: boolean; item_type: string }>();
    if (catalogGoals.length) {
      const ids = [...new Set(catalogGoals.map(goal => goal.templateId as string))];
      const rows = await serviceRest<Array<{ id: string; current_version: number; recommendation_eligible: boolean; item_type: string }>>(`healthclues_catalog_items?id=in.(${ids.map(encodeURIComponent).join(",")})&active=eq.true&review_status=eq.reviewed&select=id,current_version,recommendation_eligible,item_type`);
      rows.forEach(row => catalogById.set(row.id, row));
      const versions = await serviceRest<Array<{ catalog_item_id: string; version: number; reviewed_by: string | null; source_provenance: unknown }>>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids.map(encodeURIComponent).join(",")})&select=catalog_item_id,version,reviewed_by,source_provenance&limit=100`);
      for (const goal of catalogGoals) {
        const item = catalogById.get(goal.templateId as string);
        const version = versions.find(row => row.catalog_item_id === goal.templateId && row.version === goal.sourceVersion);
        const provenance = version?.source_provenance && typeof version.source_provenance === "object" && !Array.isArray(version.source_provenance) ? version.source_provenance as Record<string, unknown> : {};
        const demoOnly = version?.reviewed_by === "test-fixture" || provenance.demo_only === true || goal.templateId?.startsWith("hc-demo-");
        if (!item || item.current_version !== goal.sourceVersion || (goal.choice === "active" && (!item.recommendation_eligible || provenance.personalization_eligibility !== "eligible" || !["movement", "lifestyle", "mindfulness", "breathing"].includes(item.item_type || "") || goal.safetyStatus !== "eligible_for_personal_choice")) || (demoOnly && !isHealthCluesOwnerDemo())) return NextResponse.json({ error: "A selected catalog item is no longer available for this plan." }, { status: 409, headers });
        if (goal.choice === "active" && provenance.requires_known_activity_safety === true) {
          const safety = profile.safetyContext;
          if (safety?.activityRestriction !== "no" && (!goal.userSafetyConfirmation || safety?.activityRestriction === "yes" || safety?.acutePainfulJoint === "yes")) return NextResponse.json({ error: "The activity goal needs more safety context before it can be active." }, { status: 409, headers });
        }
      }
    }
    for (const goal of goals.filter(item => item.provenance === "user_created")) {
      if (goal.choice === "skipped" || goal.templateId !== null) return NextResponse.json({ error: "The personal goal data is invalid." }, { status: 400, headers });
      const assessment = assessPersonalGoal({ title: goal.title, category: goal.category, goalType: goal.goalType, profile, activityConfirmed: goal.userSafetyConfirmation === true && profile.safetyContext?.activityRestriction !== "yes" && profile.safetyContext?.acutePainfulJoint !== "yes", alcoholRisk: goal.userSafetyConfirmation === true ? "no" : "unknown" });
      if (!assessment.allowed || goal.safetyStatus !== "user_created_unreviewed") return NextResponse.json({ error: assessment.message || "This personal goal needs clarification." }, { status: 409, headers });
    }
    const version = Math.max(0, ...history.filter(plan => plan.worldId === body.worldId).map(plan => plan.version)) + 1;
    const saved: SavedPlan = { worldId: body.worldId as string, requestKey: body.requestKey as string, contextKey: currentContextKey, version, confirmedAt: new Date().toISOString(), goals };
    const nextHistory = [...history, saved].slice(-40);
    await serviceRest(`healthclues_profiles?user_id=eq.${auth.id}`, { method: "PATCH", body: JSON.stringify({ profile: { ...profileRows[0].profile, wellnessPlans: nextHistory }, updated_at: new Date().toISOString() }) });
    return NextResponse.json({ plan: saved, reused: false }, { status: 201, headers });
  } catch { return NextResponse.json({ error: "Your confirmed Wellness Plan could not be saved." }, { status: 503, headers }); }
}

function normalizeGoals(value: unknown): WellnessPlanGoal[] | null {
  if (!Array.isArray(value) || value.length > 24) return null;
  const choices = new Set(["active", "saved", "skipped"]);
  const types = new Set(["maintain", "reduce", "avoid"]);
  const status = new Set(["eligible_for_personal_choice", "insufficient_information", "ineligible", "user_created_unreviewed"]);
  const frequency = new Set(["Flexible", "Once a week", "3 days a week", "Most days", "Daily", ...Array.from({ length: 7 }, (_, index) => `${index + 1} days a week`)]);
  if (value.some(row => !row || typeof row !== "object" || Array.isArray(row))) return null;
  const goals = value as Array<Record<string, unknown>>;
  const categories = new Set([
    "sleep", "relaxation", "mindfulness", "nutrition", "movement", "general routine",
    "wellness", "hydration", "lifestyle", "herbs", "knowledge"
  ]);
  const goalIds = new Set<string>();
    if (goals.some(goal => typeof goal.goalId !== "string" || goal.goalId.length > 80 || typeof goal.title !== "string" || !goal.title.trim() || goal.title.length > 120 || typeof goal.category !== "string" || goal.category.length > 60 || !types.has(String(goal.goalType)) || !choices.has(String(goal.choice)) || !frequency.has(String(goal.frequency)) || typeof goal.trackingUnit !== "string" || !goal.trackingUnit.trim() || goal.trackingUnit.length > 60 || typeof goal.trackingDefinition !== "string" || !goal.trackingDefinition.trim() || goal.trackingDefinition.length > 240 || (goal.originalNote !== undefined && (typeof goal.originalNote !== "string" || goal.originalNote.length > 180)) || !status.has(String(goal.safetyStatus)) || !["catalog", "habit_library", "user_created", "ai_generated"].includes(String(goal.provenance)) || (["catalog", "habit_library"].includes(String(goal.provenance)) && (typeof goal.templateId !== "string" || !Number.isInteger(goal.sourceVersion))) || (["user_created", "ai_generated"].includes(String(goal.provenance)) && goal.templateId !== null) || (goal.provenance === "user_created" && goal.evidenceStatus !== "USER-CREATED · NOT REVIEWED") || (goal.provenance === "ai_generated" && (!Number.isInteger(goal.sourceVersion) || typeof goal.explanation !== "string" || !goal.generatedOption || !["A", "B"].includes(String((goal.generatedOption as Record<string, unknown>).option)) || !["en", "vi"].includes(String((goal.generatedOption as Record<string, unknown>).locale)))) || (goal.choice === "active" && (goal.safetyStatus === "ineligible" || goal.safetyStatus === "insufficient_information")) || (goal.targetValue !== undefined && goal.targetValue !== null && (typeof goal.targetValue !== "number" || !Number.isFinite(goal.targetValue) || goal.targetValue < 0 || goal.targetValue > 10000)) || (goal.targetUnit !== undefined && goal.targetUnit !== null && (typeof goal.targetUnit !== "string" || goal.targetUnit.length > 60)) || (goal.durationDays !== undefined && goal.durationDays !== null && (!Number.isInteger(goal.durationDays) || Number(goal.durationDays) < 1 || Number(goal.durationDays) > 365)) || goal.choice === "active" && (goal.targetValue === undefined || goal.targetValue === null) && !["habit_library", "ai_generated", "user_created"].includes(String(goal.provenance)))) return null;
  for (const goal of goals) {
    if (typeof goal.goalId !== "string" || goalIds.has(goal.goalId) || !categories.has(String(goal.category)) || typeof goal.explanation !== "string" || goal.explanation.length > 500 || typeof goal.evidenceStatus !== "string" || goal.evidenceStatus.length > 120 || (goal.safetyNote !== null && (typeof goal.safetyNote !== "string" || goal.safetyNote.length > 500)) || !Array.isArray(goal.sources) || goal.sources.length > 4) return null;
    if (goal.localizedRecommendation !== undefined && (goal.provenance !== "ai_generated" || !isLocalizedRecommendationSnapshot(goal.localizedRecommendation))) return null;
    goalIds.add(goal.goalId);
    for (const source of goal.sources) {
      if (!source || typeof source !== "object" || typeof (source as Record<string, unknown>).title !== "string" || typeof (source as Record<string, unknown>).url !== "string") return null;
      try { if (new URL((source as { url: string }).url).protocol !== "https:") return null; } catch { return null; }
      if (((source as { title: string }).title).length > 160) return null;
    }
  }
  return goals.map(goal => ({ ...goal, targetValue: typeof goal.targetValue === "number" ? goal.targetValue : null, targetUnit: typeof goal.targetUnit === "string" ? goal.targetUnit : null, durationDays: Number.isInteger(goal.durationDays) ? Number(goal.durationDays) : null })) as unknown as WellnessPlanGoal[];
}
