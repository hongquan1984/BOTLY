import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest, userRpc } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0, private" };
type DeletionRequest = { id: string; status: "requested" | "canceled"; requested_at: string; recovery_until: string; purge_after: string };

export async function GET(request: Request) {
  const auth = await requireUser(request, { allowDeletionPending: true });
  if (isApiError(auth)) return auth.response;
  try {
    const rows = await serviceRest<DeletionRequest[]>(`healthclues_account_deletion_requests?user_id=eq.${auth.id}&status=eq.requested&select=id,status,requested_at,recovery_until,purge_after&order=requested_at.desc&limit=1`);
    return NextResponse.json({ deletionRequest: rows[0] ?? null }, { headers });
  } catch (error) {
    console.error("HealthClues deletion status read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "HealthClues deletion status is temporarily unavailable." }, { status: 503, headers });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request, { allowDeletionPending: true });
  if (isApiError(auth)) return auth.response;
  try {
    const result = await userRpc<{ id: string; status: string; requested_at: string; recovery_until: string; purge_after: string }>("healthclues_request_data_deletion_v1", { p_user_id: auth.id });
    return NextResponse.json({ deletionRequest: result }, { status: 202, headers });
  } catch (error) {
    console.error("HealthClues deletion request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "HealthClues data deletion could not be requested." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request, { allowDeletionPending: true });
  if (isApiError(auth)) return auth.response;
  let body: { action?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose whether to cancel deletion." }, { status: 400, headers }); }
  if (body.action !== "cancel") return NextResponse.json({ error: "Choose a supported deletion action." }, { status: 400, headers });
  try {
    const result = await userRpc<{ canceled: boolean }>("healthclues_cancel_data_deletion_v1", { p_user_id: auth.id });
    if (!result.canceled) return NextResponse.json({ error: "The recovery period has ended or no deletion request is pending." }, { status: 409, headers });
    return NextResponse.json({ canceled: true }, { headers });
  } catch (error) {
    console.error("HealthClues deletion cancellation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "HealthClues deletion could not be canceled." }, { status: 503, headers });
  }
}
