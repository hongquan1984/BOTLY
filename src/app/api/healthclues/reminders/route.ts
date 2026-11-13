import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validTimeZone } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type Preference = { user_id: string; opted_in: boolean; timezone: string; local_send_time: string; frequency: "daily" | "weekdays" | "weekly"; paused: boolean; consent_version: string | null; consented_at: string | null; updated_at: string };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const [preferences, deliveries] = await Promise.all([
      serviceRest<Preference[]>(`healthclues_email_preferences?user_id=eq.${auth.id}&select=user_id,opted_in,timezone,local_send_time,frequency,paused,consent_version,consented_at,updated_at&limit=1`),
      serviceRest<Array<{ id: string; template_key: string; local_date: string; state: string; attempts: number; scheduled_at: string; sent_at: string | null; safe_error_code: string | null }>>(`healthclues_notification_deliveries?user_id=eq.${auth.id}&select=id,template_key,local_date,state,attempts,scheduled_at,sent_at,safe_error_code&order=created_at.desc&limit=30`),
    ]);
    return NextResponse.json({ preference: preferences[0] ?? null, deliveries }, { headers });
  } catch (error) {
    console.error("HealthClues reminder preferences read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Reminder preferences are temporarily unavailable." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { action?: unknown; optedIn?: unknown; timezone?: unknown; localSendTime?: unknown; frequency?: unknown; consentConfirmed?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a reminder preference." }, { status: 400, headers }); }
  const action = body.action;
  if (!new Set(["save", "pause", "resume", "unsubscribe"]).has(String(action))) return NextResponse.json({ error: "Choose a supported reminder action." }, { status: 400, headers });
  try {
    const existing = await serviceRest<Preference[]>(`healthclues_email_preferences?user_id=eq.${auth.id}&select=user_id,opted_in,timezone,local_send_time,frequency,paused,consent_version,consented_at,updated_at&limit=1`);
    const now = new Date().toISOString();
    if (action === "unsubscribe") {
      await serviceRest(`healthclues_email_preferences?user_id=eq.${auth.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ opted_in: false, paused: false, updated_at: now }) });
      await serviceRest(`healthclues_notification_deliveries?user_id=eq.${auth.id}&state=in.(queued,failed)`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ state: "canceled", safe_error_code: "unsubscribed" }) });
    } else if (action === "pause" || action === "resume") {
      if (!existing[0]) return NextResponse.json({ error: "Save an opted-in schedule before changing it." }, { status: 409, headers });
      const paused = action === "pause";
      await serviceRest(`healthclues_email_preferences?user_id=eq.${auth.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ paused, updated_at: now }) });
      if (paused) await serviceRest(`healthclues_notification_deliveries?user_id=eq.${auth.id}&state=in.(queued,failed)`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ state: "canceled", safe_error_code: "paused" }) });
    } else {
      if (typeof body.optedIn !== "boolean" || typeof body.timezone !== "string" || !validTimeZone(body.timezone) || typeof body.localSendTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.localSendTime) || !new Set(["daily", "weekdays", "weekly"]).has(String(body.frequency))) return NextResponse.json({ error: "Choose a valid timezone, local time and reminder frequency." }, { status: 400, headers });
      if (body.optedIn && body.consentConfirmed !== true) return NextResponse.json({ error: "Confirm that you want to receive the generic daily journey reminder." }, { status: 422, headers });
      const hasCurrentConsent = existing[0]?.opted_in === true;
      await serviceRest("healthclues_email_preferences?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: auth.id, opted_in: body.optedIn, timezone: body.timezone, local_send_time: body.localSendTime, frequency: body.frequency, paused: false, consent_version: body.optedIn ? "healthclues-reminder-consent-v1" : existing[0]?.consent_version ?? null, consented_at: body.optedIn ? (hasCurrentConsent ? existing[0]?.consented_at ?? now : now) : existing[0]?.consented_at ?? null, updated_at: now }) });
      if (!body.optedIn) await serviceRest(`healthclues_notification_deliveries?user_id=eq.${auth.id}&state=in.(queued,failed)`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ state: "canceled", safe_error_code: "opted_out" }) });
    }
    const [preference, deliveries] = await Promise.all([
      serviceRest<Preference[]>(`healthclues_email_preferences?user_id=eq.${auth.id}&select=user_id,opted_in,timezone,local_send_time,frequency,paused,consent_version,consented_at,updated_at&limit=1`),
      serviceRest<Array<{ id: string; template_key: string; local_date: string; state: string; attempts: number; scheduled_at: string; sent_at: string | null; safe_error_code: string | null }>>(`healthclues_notification_deliveries?user_id=eq.${auth.id}&select=id,template_key,local_date,state,attempts,scheduled_at,sent_at,safe_error_code&order=created_at.desc&limit=30`),
    ]);
    return NextResponse.json({ preference: preference[0] ?? null, deliveries }, { headers });
  } catch (error) {
    console.error("HealthClues reminder preference write failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Reminder preference could not be saved." }, { status: 503, headers });
  }
}
