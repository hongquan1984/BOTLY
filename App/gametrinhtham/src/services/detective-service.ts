import type {
  DetectiveCase,
  DetectiveChapter,
  PlayerDetectiveProgress,
  DeductionConnection,
} from "../types";
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES, getCaseById } from "../data/cases";

export interface DetectiveCampaignPayload {
  chapters: DetectiveChapter[];
  cases: DetectiveCase[];
  progress: PlayerDetectiveProgress[];
  rankTitle: string;
  totalSolved: number;
}

/**
 * Loads campaign state. In browser local mode, integrates with localStorage.
 * On server or when Supabase token is present, connects with the backend API.
 */
export async function loadCampaignState(
  authToken?: string
): Promise<DetectiveCampaignPayload> {
  if (authToken && typeof window !== "undefined") {
    try {
      const res = await fetch("/api/healthclues/detective/campaign", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as DetectiveCampaignPayload;
      }
    } catch {}
  }

  // Fallback to local deterministic verified data
  let progress: PlayerDetectiveProgress[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("healthclues_detective_player_progress_v1");
      if (raw) progress = JSON.parse(raw);
    } catch {}
  }

  const totalSolved = progress.filter((p) => p.status === "solved").length;

  return {
    chapters: ALL_CHAPTERS,
    cases: ALL_DETECTIVE_CASES,
    progress,
    rankTitle: "Thám tử tập sự",
    totalSolved,
  };
}

export async function submitCaseSolution(params: {
  caseId: string;
  stars: number;
  foundClues: string[];
  connections: DeductionConnection[];
  authToken?: string;
  worldId?: string;
}): Promise<{
  success: boolean;
  unlockedNextCaseId?: string | null;
  expAwarded: number;
  coinsAwarded: number;
  message: string;
}> {
  if (params.authToken && typeof window !== "undefined") {
    try {
      const res = await fetch("/api/healthclues/detective/solve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId: params.caseId,
          stars: params.stars,
          foundClues: params.foundClues,
          connections: params.connections,
          worldId: params.worldId,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }

  // Local calculation
  const caseData = getCaseById(params.caseId);
  const baseExp = caseData?.resolution.expReward || 50;
  const expAwarded = baseExp + (params.stars === 3 ? 20 : params.stars === 2 ? 10 : 0);
  const baseCoins = caseData?.resolution.coinReward || 150;
  const mult = params.stars >= 3 ? 1 : params.stars === 2 ? 0.7 : params.stars === 1 ? 0.4 : 0.2;
  const coinsAwarded = Math.round(baseCoins * mult);

  // Determine next case across campaign order (supports crossing Chapter 1 -> Chapter 2)
  const sorted = [...ALL_DETECTIVE_CASES].sort((a, b) => a.chapterOrder - b.chapterOrder);
  const curIdx = sorted.findIndex((c) => c.id === params.caseId);
  const nextCase = sorted[curIdx + 1];

  return {
    success: true,
    unlockedNextCaseId: nextCase?.id || null,
    expAwarded,
    coinsAwarded,
    message: "Phá án thành công! Mở khóa ngay vụ án tiếp theo.",
  };
}
