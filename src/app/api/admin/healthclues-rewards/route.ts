import { NextResponse } from "next/server";
import { isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import { serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authError(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Reviewer access required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return null;
}

export async function GET(request: Request) {
  const denied = authError(request); if (denied) return denied;
  try {
    const rewards = await serviceRest<Array<{ id: string; version: number; reward_type: string; title: string; eligibility: Record<string, unknown>; active: boolean; updated_at: string }>>("healthclues_reward_definitions?id=in.(journey-milestone-7,journey-milestone-14,journey-milestone-30,journey-milestone-60,journey-milestone-90,boss-keepsake-sleep-lantern,boss-keepsake-calm-chimes,boss-keepsake-nutrition-blossom,boss-keepsake-movement-pennant)&select=id,version,reward_type,title,eligibility,active,updated_at&order=version.asc,id.asc");
    return NextResponse.json({ rewards }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HealthClues reward configuration read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not load reward configuration." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  const denied = authError(request); if (denied) return denied;
  let body: { id?: unknown; expectedVersion?: unknown; title?: unknown; active?: unknown; reason?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  if (typeof body.id !== "string" || !/^(journey-milestone-(7|14|30|60|90)|boss-keepsake-(sleep-lantern|calm-chimes|nutrition-blossom|movement-pennant))$/.test(body.id) || !Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) < 1 || typeof body.title !== "string" || body.title.trim().length < 1 || body.title.length > 100 || typeof body.active !== "boolean" || typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 1200) {
    return NextResponse.json({ error: "Reward ID, version, title, active state and audit reason must be valid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const reward = await serviceRest<{ id: string; version: number; reward_type: string; title: string; active: boolean }>("rpc/healthclues_update_reward_config_v1", { method: "POST", body: JSON.stringify({ p_reward_id: body.id, p_expected_version: body.expectedVersion, p_title: body.title.trim(), p_active: body.active, p_reason: body.reason.trim() }) });
    return NextResponse.json({ reward }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("40001") || message.includes("(409;")) return NextResponse.json({ error: "Reward configuration changed. Reload the queue before saving." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    if (message.includes("22023") || message.includes("(400;")) return NextResponse.json({ error: "Reward configuration is invalid." }, { status: 422, headers: { "Cache-Control": "no-store" } });
    console.error("HealthClues reward configuration update failed", message || "unknown");
    return NextResponse.json({ error: "Could not save reward configuration." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
