import { NextResponse } from "next/server";
import { getActiveDiscoveryContent } from "@/lib/healthclues-discovery-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getActiveDiscoveryContent();
    const publicItems = items.map((item) => Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== "reviewedBy" && key !== "reviewedAt"),
    ));
    return NextResponse.json({ items: publicItems }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("HealthClues discovery API query failed", error);
    return NextResponse.json({ error: "Reviewed discovery content is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
