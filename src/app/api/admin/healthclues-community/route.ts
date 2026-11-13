import { NextResponse } from "next/server";
import { isHealthCluesModeratorRequest } from "@/lib/admin-auth";
import { serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Report = { id: string; reporter_user_id: string; public_journey_id: string; reason_code: string; details: string | null; status: string; created_at: string; resolved_at: string | null; resolver_id: string | null };

function check(request: Request) {
  if (!process.env.HEALTHCLUES_MODERATOR_TOKEN) return NextResponse.json({ error: "Quản trị moderator chưa được cấu hình." }, { status: 503 });
  if (!isHealthCluesModeratorRequest(request)) return NextResponse.json({ error: "Không có quyền moderator." }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = check(request); if (denied) return denied;
  try {
    const reports = await serviceRest<Report[]>("healthclues_community_reports?select=id,reporter_user_id,public_journey_id,reason_code,details,status,created_at,resolved_at,resolver_id&order=created_at.desc&limit=200");
    const journeys = await Promise.all([...new Set(reports.map(row => row.public_journey_id))].map(async id => {
      const rows = await serviceRest<Array<{ id: string; alias: string; title: string; status: string; projection: Record<string, unknown> }>>(`healthclues_public_journeys?id=eq.${encodeURIComponent(id)}&select=id,alias,title,status,projection&limit=1`);
      const row = rows[0];
      return row ? [id, { alias: row.alias, title: row.title, status: row.status, projection: row.projection }] as const : null;
    }));
    const byId = Object.fromEntries(journeys.filter((row): row is NonNullable<typeof row> => Boolean(row)));
    return NextResponse.json({ reports: reports.map(({ reporter_user_id, ...row }) => { void reporter_user_id; return { ...row, journey: byId[row.public_journey_id] ?? null }; }) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HealthClues moderation queue read failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Không tải được hàng đợi kiểm duyệt." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  const denied = check(request); if (denied) return denied;
  let input: { reportId?: unknown; action?: unknown; reason?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  if (typeof input.reportId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.reportId) || !new Set(["reviewing", "resolve", "dismiss", "remove"]).has(String(input.action)) || typeof input.reason !== "string" || input.reason.trim().length < 3 || input.reason.length > 1000) return NextResponse.json({ error: "Chọn báo cáo, hành động và lý do hợp lệ." }, { status: 400 });
  try {
    const rows = await serviceRest<Report[]>(`healthclues_community_reports?id=eq.${encodeURIComponent(input.reportId)}&select=id,public_journey_id,status&limit=1`);
    const report = rows[0]; if (!report) return NextResponse.json({ error: "Không tìm thấy báo cáo." }, { status: 404 });
    const now = new Date().toISOString();
    const status = input.action === "reviewing" ? "reviewing" : input.action === "dismiss" ? "dismissed" : "resolved";
    await serviceRest(`healthclues_community_reports?id=eq.${encodeURIComponent(report.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status, resolved_at: status === "reviewing" ? null : now, resolver_id: "healthclues_moderator_credential:HEALTHCLUES_MODERATOR_TOKEN" }) });
    if (input.action === "remove") await serviceRest(`healthclues_public_journeys?id=eq.${encodeURIComponent(report.public_journey_id)}&status=eq.active`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: "moderated", updated_at: now }) });
    await serviceRest("healthclues_audit_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ actor_type: "moderator", action: `community_${input.action}`, entity_type: "community_report", entity_id: report.id, reason: input.reason.trim() }) });
    return NextResponse.json({ ok: true, status, removed: input.action === "remove" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("HealthClues moderation action failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Không lưu được quyết định kiểm duyệt." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
