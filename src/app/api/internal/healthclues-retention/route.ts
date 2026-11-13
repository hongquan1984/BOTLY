import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };

function tokenMatches(value: string | null, expected: string) {
  if (!value) return false;
  const supplied = Buffer.from(value);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function POST(request: Request) {
  const expected = process.env.HEALTHCLUES_RETENTION_JOB_TOKEN;
  if (!expected || !tokenMatches(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, expected)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers });
  }
  let body: { runAt?: unknown; limit?: unknown };
  try { body = await request.json(); } catch { body = {}; }
  const runAt = body.runAt === undefined ? new Date().toISOString() : body.runAt;
  const limit = body.limit === undefined ? 10 : body.limit;
  if (typeof runAt !== "string" || !Number.isFinite(Date.parse(runAt)) || typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Invalid HealthClues retention worker request." }, { status: 400, headers });
  }
  try {
    const processed = await serviceRest<number>("rpc/healthclues_purge_due_data_deletions_v1", { method: "POST", body: JSON.stringify({ p_run_at: new Date(runAt).toISOString(), p_limit: limit }) });
    return NextResponse.json({ processed }, { headers });
  } catch (error) {
    console.error("HealthClues retention worker failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "HealthClues retention worker is temporarily unavailable." }, { status: 503, headers });
  }
}
