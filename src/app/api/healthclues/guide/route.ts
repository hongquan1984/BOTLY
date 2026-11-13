import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, validUuid } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0, private" };
const stages = new Set(["welcome", "discovery_herbal", "discovery_movement", "discovery_practices", "backpack", "toolkit_summary", "reminder_setup", "knowledge", "completed", "skipped"]);
const CURRENT_GUIDE_VERSION = 2;
type GuideRow = { user_id: string; world_id: string; guide_version: number; stage: string; updated_at: string };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  const worldId = new URL(request.url).searchParams.get("worldId");
  if (!validUuid(worldId)) return NextResponse.json({ error: "Choose a valid World." }, { status: 400, headers: noStore });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers: noStore });
    let rows = await serviceRest<GuideRow[]>(`healthclues_player_guide_state?user_id=eq.${auth.id}&world_id=eq.${worldId}&select=user_id,world_id,guide_version,stage,updated_at&limit=1`);
    if (!rows.length) {
      rows = await serviceRest<GuideRow[]>("healthclues_player_guide_state?on_conflict=user_id,world_id&select=user_id,world_id,guide_version,stage,updated_at", {
        method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify({ user_id: auth.id, world_id: worldId, guide_version: CURRENT_GUIDE_VERSION, stage: "welcome" }),
      });
      if (!rows.length) rows = await serviceRest<GuideRow[]>(`healthclues_player_guide_state?user_id=eq.${auth.id}&world_id=eq.${worldId}&select=user_id,world_id,guide_version,stage,updated_at&limit=1`);
    }
    return NextResponse.json({ stage: rows[0]?.stage ?? "welcome", guideVersion: rows[0]?.guide_version ?? CURRENT_GUIDE_VERSION }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Your companion guide could not be loaded." }, { status: 503, headers: noStore });
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { worldId?: unknown; stage?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a valid guide step." }, { status: 400, headers: noStore }); }
  if (!validUuid(body.worldId) || typeof body.stage !== "string" || !stages.has(body.stage)) return NextResponse.json({ error: "Choose a valid guide step." }, { status: 400, headers: noStore });
  try {
    const worlds = await serviceRest<Array<{ id: string }>>(`healthclues_wellness_worlds?id=eq.${body.worldId}&user_id=eq.${auth.id}&select=id&limit=1`);
    if (!worlds.length) return NextResponse.json({ error: "This World is not available to your account." }, { status: 404, headers: noStore });
    await serviceRest("healthclues_player_guide_state?on_conflict=user_id,world_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: auth.id, world_id: body.worldId, guide_version: CURRENT_GUIDE_VERSION, stage: body.stage, updated_at: new Date().toISOString() }),
    });
    return NextResponse.json({ saved: true, stage: body.stage }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Your companion guide progress could not be saved." }, { status: 503, headers: noStore });
  }
}
