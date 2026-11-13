import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { isApiError, requireUser, validUuid } from "@/features/healthclues/server";
import type { HealthCluesProfile } from "@/lib/healthclues-quiz";
import type { WellnessPlanGoal } from "@/features/healthclues/wellness-plan";
import { z } from "zod";
import { discoveryContextMatchesWorld } from "@/features/healthclues/onboarding-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieName = "hc-pending-journey";
const cookieNameChunk1 = "hc-pending-journey-1";
const maxAge = 20 * 60;
const quests = new Set(["sleep-better", "feel-calmer", "more-energy", "eat-healthier", "move-more", "healthy-weight", "natural-wellness", "health-concern"]);
const adaptiveProfileSchema = z.object({
  schemaVersion: z.literal(1), ageConfirmed: z.literal(true), focusId: z.enum(["sleep", "weight-fitness", "health-concern", "beauty-skin", "healthy-aging", "stress", "other"]),
  focusLabel: z.string().trim().min(1).max(100), concernDetail: z.string().trim().max(100).optional(),
  answers: z.array(z.object({ questionId: z.string().regex(/^q-[a-z0-9-]{2,48}$/), answerIds: z.array(z.string().regex(/^(?:a-[a-z0-9-]{1,48}|none|unsure)$/)).max(12), answerLabels: z.array(z.string().trim().min(1).max(100)).max(12), optionalText: z.string().trim().max(180).optional() }).strict().refine(answer => answer.answerIds.length === answer.answerLabels.length)).max(8),
}).strict();
type Payload = { version: 1; email: string; questId: string; profile: HealthCluesProfile; wellnessPlan?: WellnessPlanGoal[] | null; wellnessPlanRequestKey?: string; consentedAt: string; expiresAt: number };
const noStore = { "Cache-Control": "no-store, max-age=0", Vary: "Cookie, Authorization" };

function encryptionKey() {
  const secret = process.env.HEALTHCLUES_PENDING_JOURNEY_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || secret.length < 32) throw new Error("Pending journey encryption is not configured.");
  return createHash("sha256").update(secret).digest();
}
function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const requestHost = request.headers.get("host") || new URL(request.url).host;
    const requestProtocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
    return parsed.host === requestHost && parsed.protocol === `${requestProtocol}:`;
  } catch { return false; }
}
function secureCookie(request: Request) { return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"; }
function seal(payload: Payload) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const compressed = deflateRawSync(Buffer.from(JSON.stringify(payload)));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return `z1.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url")}`;
}
function open(value: string): Payload | null {
  try {
    const compressed = value.startsWith("z1.");
    const packed = Buffer.from(compressed ? value.slice(3) : value, "base64url"); if (packed.length < 29 || packed.length > 12_000) return null;
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), packed.subarray(0, 12));
    decipher.setAuthTag(packed.subarray(12, 28));
    const decrypted = Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]);
    const payload = JSON.parse((compressed ? inflateRawSync(decrypted) : decrypted).toString()) as Payload;
    if (payload.version !== 1 || payload.expiresAt <= Date.now() || !quests.has(payload.questId) || typeof payload.email !== "string" || !payload.profile || typeof payload.profile !== "object") return null;
    return payload;
  } catch { return null; }
}
function setCookie(response: NextResponse, request: Request, value: string) {
  const secure = secureCookie(request);
  if (value.length <= 3500) {
    response.cookies.set(cookieName, value, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
    response.cookies.set(cookieNameChunk1, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  } else {
    response.cookies.set(cookieName, value.slice(0, 3500), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
    response.cookies.set(cookieNameChunk1, value.slice(3500), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge });
  }
  return response;
}
function expired(request: Request) {
  const response = NextResponse.json({ error: "Pending adventure expired." }, { status: 410, headers: noStore });
  const secure = secureCookie(request);
  response.cookies.set(cookieName, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(cookieNameChunk1, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
  try {
    const body = await request.json() as Partial<Payload> & { consent?: boolean };
    const plan = normalizePlan(body.wellnessPlan);
    const adaptive = body.profile && typeof body.profile === "object" ? (body.profile as Record<string, unknown>).adaptiveDiscovery : undefined;
    const adaptiveValid = adaptive === undefined || adaptiveProfileSchema.safeParse(adaptive).success;
    const contextMatches = adaptive === undefined || typeof body.questId === "string" && body.profile && typeof body.profile === "object" && discoveryContextMatchesWorld(body.questId, body.profile as HealthCluesProfile);
    if (JSON.stringify(body).length > 25_000 || body.consent !== true || typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || typeof body.questId !== "string" || !quests.has(body.questId) || typeof body.consentedAt !== "string" || !body.profile || typeof body.profile !== "object" || !adaptiveValid || !contextMatches || plan === undefined || (plan !== null && !validUuid(body.wellnessPlanRequestKey))) {
      return NextResponse.json({ error: "Adventure consent or details are incomplete." }, { status: 400, headers: noStore });
    }
    const payload: Payload = { version: 1, email: body.email.trim().toLowerCase(), questId: body.questId, profile: body.profile, wellnessPlan: plan, ...(plan !== null ? { wellnessPlanRequestKey: body.wellnessPlanRequestKey as string } : {}), consentedAt: body.consentedAt, expiresAt: Date.now() + maxAge * 1000 };
    const sealed = seal(payload);
    if (sealed.length > 7000) return NextResponse.json({ error: "Adventure context is too large to save securely. Remove some optional details and try again." }, { status: 413, headers: noStore });
    return setCookie(NextResponse.json({ ok: true }, { headers: noStore }), request, sealed);
  } catch {
    return NextResponse.json({ error: "Secure adventure context is unavailable." }, { status: 503, headers: noStore });
  }
}

function normalizePlan(value: unknown): WellnessPlanGoal[] | null | undefined {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value) || value.length > 24) return undefined;
  const choices = new Set(["active", "saved", "skipped"]);
  const safety = new Set(["eligible_for_personal_choice", "insufficient_information", "ineligible", "user_created_unreviewed"]);
  const types = new Set(["maintain", "reduce", "avoid"]);
  const frequencies = new Set(["Flexible", "Once a week", "3 days a week", "Most days", "Daily", ...Array.from({ length: 7 }, (_, index) => `${index + 1} days a week`)]);
  const result: WellnessPlanGoal[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return undefined;
    const goal = item as Record<string, unknown>;
    if (typeof goal.goalId !== "string" || goal.goalId.length > 80 || typeof goal.title !== "string" || !goal.title.trim() || goal.title.length > 120 || typeof goal.category !== "string" || goal.category.length > 60 || !types.has(String(goal.goalType)) || !choices.has(String(goal.choice)) || !frequencies.has(String(goal.frequency)) || typeof goal.trackingUnit !== "string" || !goal.trackingUnit.trim() || goal.trackingUnit.length > 60 || typeof goal.trackingDefinition !== "string" || !goal.trackingDefinition.trim() || goal.trackingDefinition.length > 240 || (goal.originalNote !== undefined && (typeof goal.originalNote !== "string" || goal.originalNote.length > 180)) || !safety.has(String(goal.safetyStatus)) || !["catalog", "habit_library", "user_created", "ai_generated"].includes(String(goal.provenance)) || (goal.sourceVersion !== null && !Number.isInteger(goal.sourceVersion)) || typeof goal.evidenceStatus !== "string" || goal.evidenceStatus.length > 120 || typeof goal.explanation !== "string" || goal.explanation.length > 500 || (goal.safetyNote !== null && (typeof goal.safetyNote !== "string" || goal.safetyNote.length > 500)) || !Array.isArray(goal.sources) || goal.sources.length > 4 || (goal.targetValue !== undefined && goal.targetValue !== null && (typeof goal.targetValue !== "number" || !Number.isFinite(goal.targetValue) || goal.targetValue < 0 || goal.targetValue > 10000)) || (goal.targetUnit !== undefined && goal.targetUnit !== null && (typeof goal.targetUnit !== "string" || goal.targetUnit.length > 60)) || (goal.durationDays !== undefined && goal.durationDays !== null && (!Number.isInteger(goal.durationDays) || Number(goal.durationDays) < 1 || Number(goal.durationDays) > 365))) return undefined;
    const sources = goal.sources.flatMap(source => {
      if (!source || typeof source !== "object") return [];
      const row = source as Record<string, unknown>;
      try { const url = new URL(String(row.url)); if (url.protocol !== "https:" || typeof row.title !== "string" || row.title.length > 160) return []; return [{ title: row.title, url: url.toString() }]; } catch { return []; }
    });
    if (sources.length !== goal.sources.length) return undefined;
    result.push({ goalId: goal.goalId as string, templateId: typeof goal.templateId === "string" ? goal.templateId.slice(0, 120) : null, title: (goal.title as string).trim(), category: goal.category as string, goalType: goal.goalType as WellnessPlanGoal["goalType"], choice: goal.choice as WellnessPlanGoal["choice"], frequency: goal.frequency as string, durationMinutes: Number.isInteger(goal.durationMinutes) ? Number(goal.durationMinutes) : null, trackingUnit: goal.trackingUnit as string, trackingDefinition: String(goal.trackingDefinition).trim(), targetValue: typeof goal.targetValue === "number" ? goal.targetValue : null, targetUnit: typeof goal.targetUnit === "string" ? goal.targetUnit : null, durationDays: Number.isInteger(goal.durationDays) ? Number(goal.durationDays) : null, safetyStatus: goal.safetyStatus as WellnessPlanGoal["safetyStatus"], provenance: goal.provenance as WellnessPlanGoal["provenance"], sourceVersion: Number.isInteger(goal.sourceVersion) ? Number(goal.sourceVersion) : null, evidenceStatus: goal.evidenceStatus as string, explanation: goal.explanation as string, safetyNote: typeof goal.safetyNote === "string" ? goal.safetyNote : null, sources, ...(typeof goal.originalNote === "string" ? { originalNote: goal.originalNote.trim() } : {}), ...(goal.userSafetyConfirmation === true ? { userSafetyConfirmation: true } : {}), ...(goal.generatedOption ? { generatedOption: goal.generatedOption as WellnessPlanGoal["generatedOption"] } : {}), ...(typeof goal.advisorProof === "string" ? { advisorProof: goal.advisorProof } : {}), ...(typeof goal.iconKey === "string" ? { iconKey: goal.iconKey } : {}) });
  }
  return result;
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const cookies = request.headers.get("cookie")?.split(/;\s*/) || [];
  const part0 = cookies.find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || "";
  const part1 = cookies.find(part => part.startsWith(`${cookieNameChunk1}=`))?.slice(cookieNameChunk1.length + 1) || "";
  const cookieValue = decodeURIComponent(part0 + part1);
  const payload = cookieValue ? open(cookieValue) : null;
  const email = auth.email?.trim().toLowerCase();
  if (!payload || !email || payload.email !== email || !auth.emailConfirmed) return expired(request);
  return NextResponse.json(payload, { headers: noStore });
}

export async function DELETE(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  const secure = secureCookie(request);
  response.cookies.set(cookieName, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(cookieNameChunk1, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
