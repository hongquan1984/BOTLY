import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const params = new URL(request.url).searchParams;
  const worldId = params.get("worldId");
  const date = params.get("date");
  if (!validUuid(worldId) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Check-in date is invalid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const rows = await serviceRest<Array<{ id: string; note_private: string | null; reflection_private: string | null; revision: number }>>(`healthclues_daily_checkins?user_id=eq.${auth.id}&world_id=eq.${worldId}&local_date=eq.${date}&select=id,note_private,reflection_private,revision&limit=1`);
    if (!rows[0]) return NextResponse.json({ checkin: null, usage: [] }, { headers: { "Cache-Control": "no-store" } });
    const usage = await serviceRest<Array<{ id: string; toolkit_entry_id: string; status: string; occurrence_count: number | null }>>(`healthclues_daily_usage_records?user_id=eq.${auth.id}&checkin_id=eq.${rows[0].id}&select=id,toolkit_entry_id,status,occurrence_count`);
    const occurrences = usage.length ? await serviceRest<unknown[]>(`healthclues_usage_occurrences?user_id=eq.${auth.id}&usage_record_id=in.(${usage.map(row => row.id).join(",")})&select=usage_record_id,occurrence_no,occurred_at,local_time,status&order=occurrence_no.asc`) : [];
    return NextResponse.json({ checkin: rows[0], usage, occurrences }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Private check-in details are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
