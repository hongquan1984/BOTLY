import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0, private" };
type RecordRow = {
  id: string; user_id: string; world_id: string; record_type: "user_method" | "medication"; catalog_item_id: string | null; catalog_item_version: number | null;
  name: string; category: string; description: string | null; started_on: string | null;
  personal_schedule: string | null; private_notes: string | null; label_strength: string | null;
  instructions_as_written: string | null; schedule_kind: string | null; status: string;
  verification_status: "user_added_unverified"; updated_at: string;
};

async function ownsWorld(worldId: unknown, userId: string) {
  if (!validUuid(worldId)) return false;
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${worldId}&user_id=eq.${userId}&select=id&limit=1`);
    return worlds.length > 0;
  } catch { return false; }
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers });
}

async function authenticated(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return { response: auth.response } as const;
  if (!auth.emailConfirmed) return { response: fail("Verify your email before saving private Care Plan records.", 403) } as const;
  return { auth } as const;
}

export async function GET(request: Request) {
  const result = await authenticated(request);
  if ("response" in result) return result.response;
  const worldId = new URL(request.url).searchParams.get("worldId");
  if (!validUuid(worldId)) return fail("Choose a valid World.");
  try {
    if (!await ownsWorld(worldId, result.auth.id)) return fail("This World is not available to your account.", 404);
    const [records, events] = await Promise.all([
      serviceRest<RecordRow[]>(`healthclues_personal_care_records?user_id=eq.${result.auth.id}&world_id=eq.${worldId}&select=id,record_type,name,category,catalog_item_id,catalog_item_version,description,started_on,personal_schedule,private_notes,label_strength,instructions_as_written,schedule_kind,status,verification_status,updated_at&order=updated_at.desc&limit=200`),
      serviceRest<Array<{ id: string; record_id: string; local_date: string; self_reported_status: string; private_note: string | null; created_at: string }>>(`healthclues_personal_care_events?user_id=eq.${result.auth.id}&world_id=eq.${worldId}&select=id,record_id,local_date,self_reported_status,private_note,created_at&order=created_at.desc&limit=500`),
    ]);
    return NextResponse.json({ records, events }, { headers });
  } catch {
    return fail("Private Care Plan records are temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  const result = await authenticated(request);
  if ("response" in result) return result.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return fail("Check the Care Plan information and try again."); }
  try {
    if (!await ownsWorld(body.worldId, result.auth.id)) return fail("This World is not available to your account.", 404);
    if (body.action === "track") {
      if (!validUuid(body.recordId) || typeof body.localDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.localDate)
        || !["used", "not_yet", "skipped", "unsure", "prefer_not_to_say"].includes(String(body.status))
        || (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 1000))) return fail("Choose a valid private self-report.");
      const owned = await serviceRest<Array<{ id: string; status: string }>>(`healthclues_personal_care_records?id=eq.${body.recordId}&user_id=eq.${result.auth.id}&world_id=eq.${body.worldId}&select=id,status&limit=1`);
      if (!owned.length || owned[0].status === "archived") return fail("That private record is unavailable.", 404);
      const event = await serviceRest<Array<{ id: string }>>("healthclues_personal_care_events?select=id", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ user_id: result.auth.id, world_id: body.worldId, record_id: body.recordId, local_date: body.localDate, self_reported_status: body.status, private_note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null }) });
      return NextResponse.json({ saved: true, eventId: event[0]?.id }, { headers });
    }
    if (body.privacyAcknowledged !== true || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) return fail("Confirm the private-record notice and provide a short name.");
    const recordType = body.recordType;
    if (recordType !== "user_method" && recordType !== "medication") return fail("Choose a valid private record type.");
    let catalogItemId: string | null = null;
    let catalogItemVersion: number | null = null;
    if (body.catalogItemId !== undefined || body.catalogItemVersion !== undefined) {
      if (typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120 || !Number.isInteger(body.catalogItemVersion)) return fail("Choose a valid reviewed entry.");
      const current = await serviceRest<Array<{ id: string; current_version: number }>>(`healthclues_catalog_items?id=eq.${encodeURIComponent(body.catalogItemId)}&active=eq.true&review_status=eq.reviewed&current_version=eq.${body.catalogItemVersion}&select=id,current_version&limit=1`);
      if (!current.length) return fail("This reviewed entry is no longer current.", 409);
      catalogItemId = body.catalogItemId; catalogItemVersion = body.catalogItemVersion as number;
    }
    const category = recordType === "medication" ? "medication" : body.category;
    if (recordType === "user_method" && !["herbal_nutrition", "wellness_practice", "movement", "other"].includes(String(category))) return fail("Choose a valid method category.");
    const optionalText = (key: string, limit: number) => {
      const value = body[key];
      if (value === undefined || value === null || value === "") return null;
      return typeof value === "string" && value.length <= limit ? value.trim() || null : undefined;
    };
    const description = optionalText("description", 1000);
    const personalSchedule = optionalText("personalSchedule", 300);
    const privateNotes = optionalText("privateNotes", 2000);
    const labelStrength = optionalText("labelStrength", 180);
    const instructions = optionalText("instructionsAsWritten", 500);
    const startedOn = body.startedOn === undefined || body.startedOn === null || body.startedOn === "" ? null : typeof body.startedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startedOn) ? body.startedOn : undefined;
    if ([description, personalSchedule, privateNotes, labelStrength, instructions, startedOn].includes(undefined)) return fail("One or more optional fields are too long or invalid.");
    const scheduleKind = body.scheduleKind === undefined || body.scheduleKind === null || body.scheduleKind === "" ? null : body.scheduleKind;
    if (recordType === "medication" && scheduleKind !== null && !["scheduled", "as_needed", "journal_only"].includes(String(scheduleKind))) return fail("Choose a valid self-confirmed tracking preference.");
    const inserted = await serviceRest<RecordRow[]>("healthclues_personal_care_records?select=id,record_type,name,category,catalog_item_id,catalog_item_version,description,started_on,personal_schedule,private_notes,label_strength,instructions_as_written,schedule_kind,status,verification_status,updated_at", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
        user_id: result.auth.id, world_id: body.worldId, record_type: recordType, name: body.name.trim(), category,
        catalog_item_id: catalogItemId, catalog_item_version: catalogItemVersion,
        description: recordType === "user_method" ? description : null,
        started_on: startedOn, personal_schedule: personalSchedule, private_notes: privateNotes,
        label_strength: recordType === "medication" ? labelStrength : null,
        instructions_as_written: recordType === "medication" ? instructions : null,
        schedule_kind: recordType === "medication" ? scheduleKind : null,
        privacy_acknowledged_at: new Date().toISOString(),
      }),
    });
    return NextResponse.json({ record: inserted[0] }, { status: 201, headers });
  } catch {
    return fail("The private record could not be saved.", 503);
  }
}

export async function PATCH(request: Request) {
  const result = await authenticated(request);
  if ("response" in result) return result.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return fail("Check the record update and try again."); }
  if (!validUuid(body.worldId) || !validUuid(body.id)) return fail("Choose a valid private record.");
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (!["active", "paused", "archived"].includes(String(body.status))) return fail("Choose a valid record status.");
    updates.status = body.status;
  }
  for (const [source, target, limit] of [["name", "name", 120], ["description", "description", 1000], ["personalSchedule", "personal_schedule", 300], ["privateNotes", "private_notes", 2000], ["labelStrength", "label_strength", 180], ["instructionsAsWritten", "instructions_as_written", 500]] as const) {
    if (body[source] !== undefined) {
      if (typeof body[source] !== "string" || body[source].length > limit || (target === "name" && !body[source].trim())) return fail("One or more fields are invalid.");
      updates[target] = target === "name" ? (body[source] as string).trim() : (body[source] as string).trim() || null;
    }
  }
  if (body.scheduleKind !== undefined) {
    if (!["scheduled", "as_needed", "journal_only", null].includes(body.scheduleKind as string | null)) return fail("Choose a valid self-confirmed tracking preference.");
    updates.schedule_kind = body.scheduleKind;
  }
  if (!await ownsWorld(body.worldId, result.auth.id)) return fail("This World is not available to your account.", 404);
  try {
    const changed = await serviceRest<Array<{ id: string }>>(`healthclues_personal_care_records?id=eq.${body.id}&world_id=eq.${body.worldId}&user_id=eq.${result.auth.id}&select=id`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(updates) });
    return changed.length ? NextResponse.json({ saved: true }, { headers }) : fail("That private record is unavailable.", 404);
  } catch { return fail("The private record could not be updated.", 503); }
}

export async function DELETE(request: Request) {
  const result = await authenticated(request);
  if ("response" in result) return result.response;
  let body: { worldId?: unknown; id?: unknown };
  try { body = await request.json() as { worldId?: unknown; id?: unknown }; } catch { return fail("Choose a private record to remove."); }
  if (!validUuid(body.worldId) || !validUuid(body.id) || !await ownsWorld(body.worldId, result.auth.id)) return fail("That private record is unavailable.", 404);
  try {
    const changed = await serviceRest<Array<{ id: string }>>(`healthclues_personal_care_records?id=eq.${body.id}&world_id=eq.${body.worldId}&user_id=eq.${result.auth.id}&select=id`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    return changed.length ? NextResponse.json({ deleted: true }, { headers }) : fail("That private record is unavailable.", 404);
  } catch { return fail("The private record could not be deleted.", 503); }
}
