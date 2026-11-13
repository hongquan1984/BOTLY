import { NextResponse } from "next/server";
import { isApiError, isHealthCluesOwnerDemo, requireUser, serviceRest } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" };
type CatalogVersion = { catalog_item_id: string; version: number };

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { catalogItemId?: unknown; itemVersion?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a reviewed Catalog item." }, { status: 400, headers: noStore }); }
  if (typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120 || !Number.isInteger(body.itemVersion)) {
    return NextResponse.json({ error: "Choose a valid Catalog item version." }, { status: 400, headers: noStore });
  }
  if (body.catalogItemId.startsWith("hc-demo-") && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY entries are available only in the isolated owner demo." }, { status: 404, headers: noStore });
  try {
    const versions = await serviceRest<Array<{ reviewed_by: string | null; source_provenance: unknown }>>(`healthclues_catalog_item_versions?catalog_item_id=eq.${encodeURIComponent(body.catalogItemId)}&version=eq.${body.itemVersion}&select=reviewed_by,source_provenance&limit=1`);
    const provenance = versions[0]?.source_provenance && typeof versions[0].source_provenance === "object" && !Array.isArray(versions[0].source_provenance) ? versions[0].source_provenance as Record<string, unknown> : {};
    if ((versions[0]?.reviewed_by === "test-fixture" || provenance.demo_only === true) && !isHealthCluesOwnerDemo()) return NextResponse.json({ error: "TEST ONLY entries are unavailable outside the isolated owner demo." }, { status: 404, headers: noStore });
    const eligible = await serviceRest<Array<{ id: string; current_version: number }>>(`healthclues_catalog_items?id=eq.${encodeURIComponent(body.catalogItemId)}&active=eq.true&review_status=eq.reviewed&current_version=eq.${body.itemVersion}&select=id,current_version&limit=1`);
    if (!eligible.length) return NextResponse.json({ error: "This Catalog version is no longer active and reviewed." }, { status: 409, headers: noStore });
    await serviceRest<CatalogVersion[]>("healthclues_toolkit_collection?on_conflict=user_id,catalog_item_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: auth.id, catalog_item_id: body.catalogItemId }),
    });
    return NextResponse.json({ saved: true }, { headers: noStore });
  } catch (error) {
    console.error("HealthClues collection storage failure", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The reviewed item could not be added to your collection." }, { status: 503, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (isApiError(auth)) return auth.response;
  let body: { catalogItemId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a Collection entry to remove." }, { status: 400, headers: noStore }); }
  if (typeof body.catalogItemId !== "string" || body.catalogItemId.length > 120) return NextResponse.json({ error: "Choose a valid Collection entry." }, { status: 400, headers: noStore });
  try {
    const linked = await serviceRest<Array<{ id: string }>>(`healthclues_toolkit_entries?user_id=eq.${auth.id}&catalog_item_id=eq.${encodeURIComponent(body.catalogItemId)}&select=id&limit=1`);
    if (linked.length) return NextResponse.json({ error: "This Collection entry stays saved because Toolkit history refers to it." }, { status: 409, headers: noStore });
    await serviceRest<unknown>(`healthclues_toolkit_collection?user_id=eq.${auth.id}&catalog_item_id=eq.${encodeURIComponent(body.catalogItemId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ removed: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "This Collection entry could not be removed." }, { status: 503, headers: noStore });
  }
}
