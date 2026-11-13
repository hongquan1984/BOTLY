import type {
  CaseFileStatus,
  DetectiveCase,
  DetectiveChapter,
  PlayerChapterProgress,
  PlayerDetectiveProgress,
} from "../../types";

export interface CaseWithPlayerState {
  caseData: DetectiveCase;
  status: CaseFileStatus;
  foundCluesCount: number;
  totalCluesCount: number;
  stars: number;
  canPlay: boolean;
  lockReason?: string;
}

export function computeCaseFileStatus(
  caseData: DetectiveCase,
  playerProgressList: PlayerDetectiveProgress[]
): { status: CaseFileStatus; canPlay: boolean; lockReason?: string } {
  const currentProgress = playerProgressList.find((p) => p.caseId === caseData.id);

  if (currentProgress && currentProgress.status === "solved") {
    return { status: "solved", canPlay: true };
  }

  if (currentProgress && currentProgress.status === "in_progress") {
    return { status: "in_progress", canPlay: true };
  }

  // Nếu không có prerequisite -> Vụ án đầu tiên, luôn mở khóa
  if (!caseData.prerequisiteCaseId) {
    return { status: "available", canPlay: true };
  }

  // Kiểm tra vụ án tiên quyết đã giải chưa
  const prereqProgress = playerProgressList.find(
    (p) => p.caseId === caseData.prerequisiteCaseId
  );

  const isPrereqSolved = prereqProgress && prereqProgress.status === "solved";

  if (isPrereqSolved) {
    return { status: "available", canPlay: true };
  }

  return {
    status: "locked",
    canPlay: false,
    lockReason: "Cần hoàn thành vụ án trước đó để mở khóa hồ sơ này.",
  };
}

export function buildChapterCampaignView(
  chapter: DetectiveChapter,
  casesInChapter: DetectiveCase[],
  playerProgressList: PlayerDetectiveProgress[]
): {
  chapter: DetectiveChapter;
  cases: CaseWithPlayerState[];
  progress: PlayerChapterProgress;
  nextAvailableCaseId: string | null;
} {
  // Sắp xếp các vụ án theo thứ tự trong chương
  const sortedCases = [...casesInChapter].sort((a, b) => a.chapterOrder - b.chapterOrder);

  let nextAvailableCaseId: string | null = null;
  let solvedCount = 0;
  let totalStars = 0;

  const casesWithState: CaseWithPlayerState[] = sortedCases.map((c) => {
    const { status, canPlay, lockReason } = computeCaseFileStatus(c, playerProgressList);
    const progress = playerProgressList.find((p) => p.caseId === c.id);

    if (status === "solved") {
      solvedCount++;
      totalStars += progress?.starsAwarded ?? 0;
    }

    if (!nextAvailableCaseId && (status === "available" || status === "in_progress")) {
      nextAvailableCaseId = c.id;
    }

    const validClueIdSet = new Set(c.clues.map((clue) => clue.id));
    const canonicalFoundCount = Array.from(
      new Set((progress?.foundClueIds || []).filter((id) => validClueIdSet.has(id)))
    ).length;

    return {
      caseData: c,
      status,
      foundCluesCount: canonicalFoundCount,
      totalCluesCount: c.clues.length,
      stars: progress?.starsAwarded || 0,
      canPlay,
      lockReason,
    };
  });

  const progress: PlayerChapterProgress = {
    chapterId: chapter.id,
    totalCases: sortedCases.length,
    solvedCases: solvedCount,
    totalStars,
    isCompleted: solvedCount === sortedCases.length && sortedCases.length > 0,
  };

  return {
    chapter,
    cases: casesWithState,
    progress,
    nextAvailableCaseId,
  };
}

/**
 * Server-side / engine-side validation to prevent client-forged unlock skips.
 */
export function verifyCaseUnlockAuthorization(
  caseData: DetectiveCase,
  playerProgressList: PlayerDetectiveProgress[]
): { authorized: boolean; error?: string } {
  // Case 001 (hoặc case không có prereq) luôn được phép
  if (!caseData.prerequisiteCaseId) {
    return { authorized: true };
  }

  const prereqProgress = playerProgressList.find(
    (p) => p.caseId === caseData.prerequisiteCaseId
  );

  if (!prereqProgress || prereqProgress.status !== "solved") {
    return {
      authorized: false,
      error: "Hồ sơ vụ án đang bị khóa. Bạn phải hoàn thành vụ án tiền đề trước.",
    };
  }

  return { authorized: true };
}
