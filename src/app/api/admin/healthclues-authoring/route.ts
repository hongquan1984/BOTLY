import { NextResponse } from "next/server";
import { isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import { serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authError(request: Request) {
  if (!process.env.HEALTHCLUES_REVIEWER_TOKEN) return NextResponse.json({ error: "HealthClues reviewer chưa được cấu hình." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!isHealthCluesReviewerRequest(request)) return NextResponse.json({ error: "Không có quyền reviewer." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return null;
}

export async function GET(request: Request) {
  const denied = authError(request); if (denied) return denied;
  try {
    const [methods, methodVersions, methodItems, recipes, journeys, journeyComponents, catalog, recipesCatalog] = await Promise.all([
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_methods?review_status=in.(draft,needs_review,rejected)&select=id,slug,review_status,active,current_version&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_method_versions?review_status=in.(draft,needs_review,rejected)&select=method_id,version,name,instructions,estimated_minutes,safety_notes,review_status,created_at&order=created_at.desc&limit=500"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_usage_method_items?select=method_id,method_version,catalog_item_id,item_version,relationship,is_required,display_order&limit=1000"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_recipe_combos?review_status=in.(draft,needs_review,rejected)&select=id,version,recipe_item_id,recipe_item_version,method_id,method_version,review_status,active&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_journey_combos?review_status=in.(draft,needs_review,rejected)&select=id,version,name,review_status,active,rationale,partial_acceptance&order=created_at.desc&limit=200"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_journey_combo_components?select=combo_id,combo_version,slot_key,catalog_item_id,item_version,method_id,method_version,required,display_order,rationale&limit=1000"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_catalog_items?active=eq.true&review_status=eq.reviewed&select=id,slot_key,item_type,current_version&order=id.asc&limit=500"),
      serviceRest<Array<Record<string, unknown>>>("healthclues_catalog_items?active=eq.true&review_status=eq.reviewed&item_type=eq.recipe&select=id,slot_key,item_type,current_version&order=id.asc&limit=200"),
    ]);
    const ids = [...new Set([...catalog, ...recipesCatalog].map(row => String(row.id)))];
    const itemVersions = ids.length ? await serviceRest<Array<Record<string, unknown>>>(`healthclues_catalog_item_versions?catalog_item_id=in.(${ids.map(encodeURIComponent).join(",")})&select=catalog_item_id,version,name,description,safety_notes&limit=1000`) : [];
    return NextResponse.json({
      methods: methods.map(row => ({ ...row, current: methodVersions.find(version => version.method_id === row.id && version.version === row.current_version) ?? null, components: methodItems.filter(component => component.method_id === row.id && component.method_version === row.current_version) })),
      recipeCombos: recipes,
      journeyCombos: journeys.map(row => ({ ...row, components: journeyComponents.filter(component => component.combo_id === row.id && component.combo_version === row.version) })),
      catalog: catalog.map(row => ({ ...row, current: itemVersions.find(version => version.catalog_item_id === row.id && version.version === row.current_version) ?? null })),
      recipes: recipesCatalog.map(row => ({ ...row, current: itemVersions.find(version => version.catalog_item_id === row.id && version.version === row.current_version) ?? null })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HealthClues draft authoring queue failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Không tải được hàng đợi bản nháp." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const denied = authError(request); if (denied) return denied;
  let body: { payload?: unknown; reason?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload) || typeof body.reason !== "string" || body.reason.trim().length < 3 || body.reason.length > 1200) {
    return NextResponse.json({ error: "Bản nháp và lý do audit là bắt buộc." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const payload = body.payload as Record<string, unknown>;
  if (!["method", "recipe_combo", "journey_combo"].includes(String(payload.kind)) || typeof payload.id !== "string" || !/^[a-z0-9-]{1,100}$/.test(payload.id) || typeof payload.name !== "string" || payload.name.trim().length < 1 || payload.name.length > 160) {
    return NextResponse.json({ error: "Loại bản nháp, ID hoặc tên không hợp lệ." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await serviceRest<{ kind: string; id: string; version: number; review_status: string; active: boolean }>("rpc/healthclues_create_admin_draft_v1", {
      method: "POST", body: JSON.stringify({ p_payload: payload, p_reason: body.reason.trim() }),
    });
    return NextResponse.json({ draft: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("(409;") || message.includes("23505")) return NextResponse.json({ error: "ID này đã tồn tại. Hãy chọn ID khác hoặc sửa bản nháp hiện tại." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    if (message.includes("(400;") || message.includes("22023") || message.includes("23514") || message.includes("23503")) return NextResponse.json({ error: "Bản nháp không hợp lệ hoặc tham chiếu nội dung chưa được duyệt/đang hoạt động." }, { status: 422, headers: { "Cache-Control": "no-store" } });
    console.error("HealthClues draft creation failed", message || "unknown");
    return NextResponse.json({ error: "Không lưu được bản nháp." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
