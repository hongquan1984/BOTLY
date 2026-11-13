import { NextResponse } from "next/server";
import { isHealthCluesModeratorRequest, isHealthCluesReviewerRequest } from "@/lib/admin-auth";
import { serviceCount } from "@/features/healthclues/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configured = Boolean(process.env.HEALTHCLUES_REVIEWER_TOKEN || process.env.HEALTHCLUES_MODERATOR_TOKEN);
  if (!configured) return NextResponse.json({ error: "Quản trị HealthClues chưa được cấu hình." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!isHealthCluesReviewerRequest(request) && !isHealthCluesModeratorRequest(request)) {
    return NextResponse.json({ error: "Không có quyền xem chẩn đoán vận hành." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const [catalogPending, cluesPending, bossesPending, communityOpen, remindersPending] = await Promise.all([
      serviceCount("healthclues_catalog_items?review_status=in.(draft,needs_review)&select=id"),
      serviceCount("healthclues_knowledge_clues?review_status=in.(draft,needs_review)&select=clue_id"),
      serviceCount("healthclues_boss_challenges?review_status=in.(draft,needs_review)&select=boss_id"),
      serviceCount("healthclues_community_reports?status=in.(open,reviewing)&select=id"),
      serviceCount("healthclues_notification_deliveries?state=in.(queued,failed)&select=id"),
    ]);
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      queues: { catalogPending, cluesPending, bossesPending, communityOpen, remindersPending },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HealthClues operational diagnostics failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Không lấy được chỉ số vận hành HealthClues." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
