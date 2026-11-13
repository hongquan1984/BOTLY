import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import { localized, type AiWellnessGoal } from "../personalized-wellness-plan.ts";

type SignedClaims = { goal: AiWellnessGoal; profileDigest: string; expiresAt: number };
function secret() { return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-development-healthclues-fallback-secret-key-32-chars"; }
function clean(value: string, max: number) { return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function profileDigest(profile: HealthCluesProfile) {
  const safetyFields = ["foodAllergy", "foodRestriction", "professionalRestriction", "activityRestriction", "medicationOrSupplement", "acutePainfulJoint", "urgentSymptoms", "fluidRestriction"] as const;
  const safetyContext = Object.fromEntries(safetyFields.map(field => {
    const value = profile.safetyContext?.[field];
    return [field, value === "yes" || value === "no" ? value : "unknown"];
  }));
  const safe = {
    topic: clean(profile.topic, 100), contentPreferences: profile.contentPreferences.map(value => clean(value, 80)),
    twoWeekGoal: clean(profile.twoWeekGoal, 160), specificInterests: (profile.specificInterests || []).map(value => clean(value, 80)),
    adaptiveDiscovery: profile.adaptiveDiscovery ? {
      focusId: profile.adaptiveDiscovery.focusId, focusLabel: clean(profile.adaptiveDiscovery.focusLabel, 100),
      concernDetail: clean(profile.adaptiveDiscovery.concernDetail || "", 100),
      answers: profile.adaptiveDiscovery.answers.map(answer => ({ questionId: answer.questionId, answerIds: answer.answerIds, answerLabels: answer.answerLabels.map(label => clean(label, 100)), optionalText: clean(answer.optionalText || "", 180) })),
    } : null,
    safetyLevel: profile.safetyLevel, safetyContext,
  };
  return createHash("sha256").update(JSON.stringify(safe)).digest("base64url");
}

export function signGeneratedGoal(goal: AiWellnessGoal, profile: HealthCluesProfile): string {
  const key = secret();
  if (key.length < 32) throw new Error("generated_goal_proof_unavailable");
  const claims: SignedClaims = { goal, profileDigest: profileDigest(profile), expiresAt: Date.now() + 30 * 60_000 };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifiedGeneratedGoalFromProof(input: {
  advisorProof?: string; goalId: string; title: string; category: string; explanation: string; trackingDefinition: string;
  sources: Array<{ title: string; url: string }>; generatedOption?: { locale: "en" | "vi"; option: "A" | "B"; title: string };
}, profile: HealthCluesProfile): AiWellnessGoal | null {
  const key = secret();
  if (key.length < 32 || !input.advisorProof || input.advisorProof.length > 12_000) return null;
  const [payload, supplied, extra] = input.advisorProof.split(".");
  if (!payload || !supplied || extra) return null;
  const expected = createHmac("sha256", key).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(supplied, "base64url"); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let claims: SignedClaims;
  try { claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedClaims; } catch { return null; }
  if (claims.expiresAt < Date.now() || claims.expiresAt > Date.now() + 31 * 60_000 || claims.profileDigest !== profileDigest(profile) || !input.generatedOption) return null;
  const goal = claims.goal;
  const selected = input.generatedOption.option === "A" ? goal.optionA : goal.optionB;
  const locale = input.generatedOption.locale;
  const allowedTitles = [localized(goal.title, locale), localized(selected.action, locale)];
  if (input.goalId !== goal.goalId || !allowedTitles.includes(input.title) || input.category !== goal.category || input.explanation !== localized(goal.relevanceReason, locale) || input.trackingDefinition !== localized(selected.action, locale) || input.generatedOption.title !== localized(selected.title, locale)) return null;
  return goal;
}

export function verifyGeneratedGoalProof(input: {
  advisorProof?: string; goalId: string; title: string; category: string; explanation: string; trackingDefinition: string;
  sources: Array<{ title: string; url: string }>; generatedOption?: { locale: "en" | "vi"; option: "A" | "B"; title: string };
}, profile: HealthCluesProfile): boolean {
  return verifiedGeneratedGoalFromProof(input, profile) !== null;
}
