import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, userRpc, validTimeZone, validUuid } from "@/features/healthclues/server";
import { validateUsageInput, type UsageStatus } from "@/features/healthclues/toolkit-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0" };
const statuses: UsageStatus[] = ["done", "not_yet", "skipped", "not_suitable", "unsure"];

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { worldId?: string; localDate?: string; timezone?: string; usages?: Array<{ toolkitEntryId: string; status: UsageStatus; occurrenceCount?: number | null; occurrences?: Array<{ occurrenceNo: number; occurredAt?: string | null; localTime?: string | null; status: UsageStatus }> }>; note?: string; reflection?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Check-in details are invalid." }, { status: 400, headers: noStore }); }
  if (!validUuid(body.worldId) || !validTimeZone(body.timezone) || !body.localDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.localDate) || !Array.isArray(body.usages) || body.usages.length > 100 || (body.note && body.note.length > 4000) || (body.reflection && body.reflection.length > 4000)) {
    return NextResponse.json({ error: "Check-in details are incomplete or too long." }, { status: 400, headers: noStore });
  }
  let world: Array<{ timezone: string }>;
  try {
    world = await serviceRest<Array<{ timezone: string }>>(`healthclues_wellness_worlds?user_id=eq.${auth.id}&id=eq.${body.worldId}&select=timezone&limit=1`);
  } catch {
    return NextResponse.json({ error: "Your World could not be verified. Refresh and try again." }, { status: 503, headers: noStore });
  }
  if (!world[0]) return NextResponse.json({ error: "Create a Wellness World before saving a check-in." }, { status: 409, headers: noStore });
  if (body.timezone !== world[0].timezone) return NextResponse.json({ error: "Check-in timezone must match your Wellness World." }, { status: 409, headers: noStore });
  const worldTimezone = world[0].timezone;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: worldTimezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (body.localDate > today) return NextResponse.json({ error: "You can only check in for today or an earlier day." }, { status: 400, headers: noStore });
  const entryIds = new Set<string>();
  const usages = [];
  for (const row of body.usages) {
    if (!validUuid(row.toolkitEntryId) || !statuses.includes(row.status) || entryIds.has(row.toolkitEntryId)) return NextResponse.json({ error: "Each selected tool needs one valid status." }, { status: 400, headers: noStore });
    entryIds.add(row.toolkitEntryId);
    const normalized = validateUsageInput({ status: row.status, occurrenceCount: row.occurrenceCount });
    if (!normalized.ok) return NextResponse.json({ error: normalized.reason }, { status: 400, headers: noStore });
    const occurrences = row.occurrences ?? [];
    if (occurrences.length > 100 || occurrences.some(item => !Number.isInteger(item.occurrenceNo) || item.occurrenceNo < 1 || item.occurrenceNo > 100 || !statuses.includes(item.status) || (item.localTime !== undefined && item.localTime !== null && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(item.localTime)))) {
      return NextResponse.json({ error: "Occurrence details are invalid." }, { status: 400, headers: noStore });
    }
    usages.push({ toolkit_entry_id: row.toolkitEntryId, status: row.status, occurrence_count: normalized.normalized.occurrenceCount,
      occurrences: occurrences.map(item => ({ occurrence_no: item.occurrenceNo, occurred_at: item.occurredAt ?? null, local_time: item.localTime ?? null, status: item.status })) });
  }
  try {
    const result = await userRpc<{ checkin_id: string; revision: number; xp_awarded: boolean; xp_total: number }>("healthclues_save_daily_checkin_v1", {
      p_user_id: auth.id, p_world_id: body.worldId, p_local_date: body.localDate, p_timezone: worldTimezone,
      p_usage: usages, p_note: body.note?.trim() || null, p_reflection: body.reflection?.trim() || null,
    });
    return NextResponse.json(result, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Your check-in could not be saved. Refresh your World and try again." }, { status: 409, headers: noStore });
  }
}
