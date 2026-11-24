import { NextResponse } from "next/server";
import { isApiError, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0, private" };
const itemTypes = new Set(["herb", "sound", "breath"]);
type ItemType = "herb" | "sound" | "breath";
type ToolkitRow = { item_type: ItemType; item_id: string };

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  try {
    const userId = encodeURIComponent(auth.id);
    const rows = await serviceRest<ToolkitRow[]>(
      `healthclues_mobile_toolkit_items?user_id=eq.${userId}&select=item_type,item_id&order=saved_at.asc,item_id.asc&limit=500`,
    );
    return response({
      herbs: rows.filter((row) => row.item_type === "herb").map((row) => row.item_id),
      sounds: rows.filter((row) => row.item_type === "sound").map((row) => row.item_id),
      breaths: rows.filter((row) => row.item_type === "breath").map((row) => row.item_id),
    });
  } catch {
    return response({ error: "Túi đồ chưa thể tải. Vui lòng thử lại." }, 503);
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { action?: unknown; itemType?: unknown; itemId?: unknown };
  try { body = await request.json(); } catch { return response({ error: "Dữ liệu túi đồ không hợp lệ." }, 400); }
  if ((body.action !== "save" && body.action !== "remove") || typeof body.itemType !== "string" || !itemTypes.has(body.itemType) || typeof body.itemId !== "string" || !/^[A-Za-z0-9_.:-]{1,160}$/.test(body.itemId)) {
    return response({ error: "Vật phẩm túi đồ không hợp lệ." }, 400);
  }
  const itemType = body.itemType as ItemType;
  const itemId = body.itemId;
  const userId = encodeURIComponent(auth.id);
  try {
    if (body.action === "save") {
      await serviceRest("healthclues_mobile_toolkit_items?on_conflict=user_id,item_type,item_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: auth.id, item_type: itemType, item_id: itemId }),
      });
    } else {
      await serviceRest(`healthclues_mobile_toolkit_items?user_id=eq.${userId}&item_type=eq.${encodeURIComponent(itemType)}&item_id=eq.${encodeURIComponent(itemId)}`, { method: "DELETE" });
    }
    return response({ saved: body.action === "save", itemType, itemId });
  } catch {
    return response({ error: "Túi đồ chưa thể cập nhật. Vui lòng thử lại." }, 503);
  }
}
