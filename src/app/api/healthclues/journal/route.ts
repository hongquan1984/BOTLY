import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type World = { id: string; timezone: string };
type Entry = { id: string; entry_date: string; body: string; created_at: string; updated_at: string };

async function ownedWorld(userId: string) {
  const worlds = await serviceRest<World[]>(`healthclues_wellness_worlds?user_id=eq.${userId}&select=id,timezone&limit=1`);
  return worlds[0] ?? null;
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const world = await ownedWorld(auth.id);
    if (!world) return NextResponse.json({ entries: [] }, { headers });
    const entries = await serviceRest<Entry[]>(`healthclues_journal_entries?user_id=eq.${auth.id}&world_id=eq.${world.id}&visibility=eq.private&select=id,entry_date,body,created_at,updated_at&order=entry_date.desc,updated_at.desc&limit=100`);
    return NextResponse.json({ entries }, { headers });
  } catch (error) {
    console.error("HealthClues journal read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Your private Journal is temporarily unavailable." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { entryId?: unknown; entryDate?: unknown; body?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Write a short private reflection." }, { status: 400, headers }); }
  if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 4000 || typeof body.entryDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.entryDate)) {
    return NextResponse.json({ error: "A date and reflection of up to 4,000 characters are required." }, { status: 400, headers });
  }
  try {
    const world = await ownedWorld(auth.id);
    if (!world) return NextResponse.json({ error: "Create a Wellness World before saving a Journal entry." }, { status: 409, headers });
    const validDate = new Intl.DateTimeFormat("en-CA", { timeZone: world.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const dateValue = new Date(`${body.entryDate}T12:00:00Z`);
    if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== body.entryDate || body.entryDate > validDate) return NextResponse.json({ error: "Choose a valid date that is today or earlier in your World timezone." }, { status: 400, headers });
    const values = { body: body.body.trim(), entry_date: body.entryDate, updated_at: new Date().toISOString() };
    let saved: Entry[];
    if (body.entryId !== undefined) {
      if (!validUuid(body.entryId)) return NextResponse.json({ error: "Choose a valid Journal entry." }, { status: 400, headers });
      saved = await serviceRest<Entry[]>(`healthclues_journal_entries?id=eq.${body.entryId}&user_id=eq.${auth.id}&world_id=eq.${world.id}&visibility=eq.private&select=id,entry_date,body,created_at,updated_at`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) });
      if (!saved[0]) return NextResponse.json({ error: "That private Journal entry was not found." }, { status: 404, headers });
    } else {
      saved = await serviceRest<Entry[]>("healthclues_journal_entries", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...values, user_id: auth.id, world_id: world.id, visibility: "private" }) });
    }
    return NextResponse.json({ entry: saved[0] }, { status: body.entryId ? 200 : 201, headers });
  } catch (error) {
    console.error("HealthClues journal write failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Your private Journal entry could not be saved." }, { status: 503, headers });
  }
}
