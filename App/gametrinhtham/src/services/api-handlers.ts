import { NextResponse } from "next/server";
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES, getCaseById } from "../data/cases";
import type { PlayerDetectiveProgress } from "../types";

const noStore = { "Cache-Control": "no-store, max-age=0, private" };

export async function handleDetectiveCampaignGet(request: Request) {
  try {
    return NextResponse.json(
      {
        chapters: ALL_CHAPTERS,
        cases: ALL_DETECTIVE_CASES,
        rankTitle: "Thám tử tập sự",
      },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Không tải được hồ sơ chiến dịch." },
      { status: 500, headers: noStore }
    );
  }
}

export async function handleDetectiveSolvePost(request: Request) {
  try {
    const body = (await request.json()) as {
      caseId?: string;
      stars?: number;
      foundClues?: string[];
      connections?: unknown[];
      worldId?: string;
    };

    if (!body.caseId || typeof body.caseId !== "string") {
      return NextResponse.json({ error: "Thiếu caseId." }, { status: 400, headers: noStore });
    }

    const caseData = getCaseById(body.caseId);
    if (!caseData) {
      return NextResponse.json({ error: "Hồ sơ vụ án không tồn tại." }, { status: 404, headers: noStore });
    }

    const stars = Math.min(3, Math.max(0, Number(body.stars) ?? 3));
    const baseExp = caseData.resolution.expReward;
    const finalExp = baseExp + (stars === 3 ? 20 : stars === 2 ? 10 : 0);
    const baseCoins = caseData.resolution.coinReward || 150;
    const mult = stars >= 3 ? 1 : stars === 2 ? 0.7 : stars === 1 ? 0.4 : 0.2;
    const finalCoins = Math.round(baseCoins * mult);

    const sorted = [...ALL_DETECTIVE_CASES].sort((a, b) => a.chapterOrder - b.chapterOrder);
    const curIdx = sorted.findIndex((c) => c.id === body.caseId);
    const nextCase = sorted[curIdx + 1];

    return NextResponse.json(
      {
        success: true,
        caseId: body.caseId,
        stars,
        expAwarded: finalExp,
        coinsAwarded: finalCoins,
        unlockedNextCaseId: nextCase?.id || null,
        message: "Phá án thành công! Mở khóa ngay vụ án tiếp theo.",
      },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Không lưu được kết quả phá án." },
      { status: 500, headers: noStore }
    );
  }
}
