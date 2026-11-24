import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };

type Goal = Record<string, unknown> & { id: string; status?: string };
type MobileCheckin = { localDate: string; statuses: Record<string, "done" | "not_yet" | "skipped">; stars: number; note: string; submitted: true; timestamp: string };

function validGoal(value: unknown): value is Goal {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const goal = value as Record<string, unknown>;
  return typeof goal.id === "string" && /^[a-zA-Z0-9._:-]{1,120}$/.test(goal.id) && typeof goal.title === "string" && goal.title.trim().length > 0 && goal.title.length <= 180 && ["active", "saved_for_later", "skipped"].includes(String(goal.status ?? "active"));
}

async function readProfile(userId: string) {
  const rows = await serviceRest<Array<{ profile: Record<string, unknown> }>>(`healthclues_profiles?user_id=eq.${encodeURIComponent(userId)}&select=profile&limit=1`);
  if (!rows[0]) throw new Error("MOBILE_PROFILE_MISSING");
  return rows[0].profile;
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const profile = await readProfile(auth.id);
    const goals = Array.isArray(profile.mobileJourneyGoals) ? profile.mobileJourneyGoals.filter(validGoal) : [];
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const checkins = Array.isArray(profile.mobileDailyCheckins) ? profile.mobileDailyCheckins as MobileCheckin[] : [];
    return NextResponse.json({ goals, todayCheckin: checkins.find(item => item.localDate === today) ?? null, coins: typeof profile.mobileCoins === "number" ? profile.mobileCoins : 0 }, { headers });
  } catch {
    return NextResponse.json({ error: "Mobile progress could not be loaded." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { action?: unknown; goals?: unknown; localDate?: unknown; statuses?: unknown; note?: unknown; stars?: unknown; amount?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Mobile progress is invalid." }, { status: 400, headers }); }
  try {
    const profile = await readProfile(auth.id);
    if (body.action === "save_goals") {
      if (!Array.isArray(body.goals) || body.goals.length > 24 || body.goals.some(goal => !validGoal(goal))) return NextResponse.json({ error: "Journey goals are invalid." }, { status: 400, headers });
      const goals = body.goals as Goal[];
      const previous = Array.isArray(profile.mobileJourneyGoals) ? profile.mobileJourneyGoals.filter(validGoal) as Goal[] : [];
      const previousIds = new Set(previous.map(goal => goal.id));
      const added = goals.find(goal => !previousIds.has(goal.id));
      await serviceRest(`healthclues_profiles?user_id=eq.${encodeURIComponent(auth.id)}`, { method: "PATCH", body: JSON.stringify({ profile: { ...profile, mobileJourneyGoals: goals }, updated_at: new Date().toISOString() }) });
      if (added) {
        await serviceRest("healthclues_xp_ledger?on_conflict=user_id,idempotency_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: auth.id, source_type: "learning", source_id: `mobile-journey-goal:${added.id}`, idempotency_key: `mobile-journey-goal:${added.id}`, amount: 20, reason_code: "mobile_journey_goal_created" }) });
      }
      return NextResponse.json({ goals }, { headers });
    }
    if (body.action === "save_checkin") {
      if (typeof body.localDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.localDate) || !body.statuses || typeof body.statuses !== "object" || Array.isArray(body.statuses)) return NextResponse.json({ error: "Daily check-in is invalid." }, { status: 400, headers });
      const statuses = Object.fromEntries(Object.entries(body.statuses as Record<string, unknown>).filter(([, value]) => ["done", "not_yet", "skipped"].includes(String(value)))) as MobileCheckin["statuses"];
      const checkin: MobileCheckin = { localDate: body.localDate, statuses, stars: Number.isInteger(body.stars) ? Number(body.stars) : 0, note: typeof body.note === "string" ? body.note.slice(0, 4000) : "", submitted: true, timestamp: new Date().toISOString() };
      const history = Array.isArray(profile.mobileDailyCheckins) ? profile.mobileDailyCheckins.filter(item => item && typeof item === "object" && (item as { localDate?: unknown }).localDate !== body.localDate) : [];
      await serviceRest(`healthclues_profiles?user_id=eq.${encodeURIComponent(auth.id)}`, { method: "PATCH", body: JSON.stringify({ profile: { ...profile, mobileDailyCheckins: [...history, checkin].slice(-90) }, updated_at: new Date().toISOString() }) });
      await serviceRest("healthclues_xp_ledger?on_conflict=user_id,idempotency_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ user_id: auth.id, source_type: "daily_checkin", source_id: `mobile-checkin:${body.localDate}`, idempotency_key: `mobile-checkin:${auth.id}:${body.localDate}`, amount: Math.max(1, Object.values(statuses).filter(value => value === "done").length * 10), reason_code: "mobile_daily_checkin" }) });
      const ledger = await serviceRest<Array<{ amount: number }>>(`healthclues_xp_ledger?user_id=eq.${encodeURIComponent(auth.id)}&select=amount&limit=10000`);
      return NextResponse.json({ checkin, xpTotal: ledger.reduce((sum, row) => sum + row.amount, 0) }, { headers });
    }
    if (body.action === "add_coins" || body.action === "spend_coins") {
      if (!Number.isInteger(body.amount) || Number(body.amount) <= 0 || Number(body.amount) > 10000) return NextResponse.json({ error: "Coin amount is invalid." }, { status: 400, headers });
      const current = typeof profile.mobileCoins === "number" && Number.isFinite(profile.mobileCoins) ? Math.max(0, Math.floor(profile.mobileCoins)) : 0;
      const amount = Number(body.amount);
      if (body.action === "spend_coins" && current < amount) return NextResponse.json({ error: "Not enough coins." }, { status: 409, headers });
      const coins = body.action === "add_coins" ? current + amount : current - amount;
      await serviceRest(`healthclues_profiles?user_id=eq.${encodeURIComponent(auth.id)}`, { method: "PATCH", body: JSON.stringify({ profile: { ...profile, mobileCoins: coins }, updated_at: new Date().toISOString() }) });
      return NextResponse.json({ coins }, { headers });
    }
    return NextResponse.json({ error: "Unknown mobile progress action." }, { status: 400, headers });
  } catch {
    return NextResponse.json({ error: "Mobile progress could not be saved." }, { status: 503, headers });
  }
}
