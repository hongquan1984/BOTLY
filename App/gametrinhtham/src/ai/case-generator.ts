import type {
  CaseClue,
  CaseDifficultyLevel,
  CaseHypothesis,
  CasePuzzle,
  CaseResolution,
  CaseScene,
  DeductionStep,
  DetectiveCase,
  DetectiveTopic,
  MedicalReference,
} from "../types";

export interface CaseLogicDraft {
  id: string;
  topic: DetectiveTopic;
  difficulty: CaseDifficultyLevel;
  mysteryHook: string;
  underlyingTruth: string;
  patientClaim: {
    speaker: string;
    statement: string;
    biasType: "attribution_bias" | "post_hoc_fallacy" | "denial" | "confounding_variable";
  };
  clues: CaseClue[];
  timeline: Array<{
    order: number;
    timeLabel: string;
    expectedClueId: string;
    narrative: string;
  }>;
  contradiction: {
    targetClaim: string;
    requiredClueId: string;
    correctReason: string;
    revelationInsight: string;
  };
  contributingFactors: Array<{
    clueId?: string;
    title: string;
    isCorrect: boolean;
    isTrap: boolean;
  }>;
  resolution: {
    primaryConclusion: string;
    scientificExplanation: string;
    patientFeedback: string;
  };
  medicalReferences: MedicalReference[];
}

export interface LogicValidationResult {
  isValid: boolean;
  errors: string[];
  qualityScore: number; // 0..100
}

/**
 * Validates logical integrity BEFORE narrative or scenes are published.
 */
export function validateCaseLogic(draft: CaseLogicDraft): LogicValidationResult {
  const errors: string[] = [];

  // 1. Evidence Existence Checks
  const clueIds = new Set(draft.clues.map((c) => c.id));

  if (!clueIds.has(draft.contradiction.requiredClueId)) {
    errors.push(`Contradiction requires clue "${draft.contradiction.requiredClueId}" which is missing from evidence graph.`);
  }

  for (const item of draft.timeline) {
    if (!clueIds.has(item.expectedClueId)) {
      errors.push(`Timeline slot #${item.order} references non-existent clue "${item.expectedClueId}".`);
    }
  }

  // 2. Timeline Sequence Checks
  if (draft.timeline.length < 3) {
    errors.push("Timeline must contain at least 3 chronological milestones to prevent trivial guessing.");
  }

  // 3. Medical Integrity
  if (!draft.medicalReferences || draft.medicalReferences.length === 0) {
    errors.push("Case must cite at least 1 verified clinical publication or clinical guideline.");
  }

  // 4. Multi-Factor Integrity
  const correctFactors = draft.contributingFactors.filter((f) => f.isCorrect);
  const traps = draft.contributingFactors.filter((f) => f.isTrap);

  if (correctFactors.length < 2) {
    errors.push("Case must represent a multi-factorial interaction (at least 2 contributing factors).");
  }

  if (traps.length < 1) {
    errors.push("Case must include at least 1 plausible red herring / scapegoat trap.");
  }

  const qualityScore = Math.max(0, 100 - errors.length * 20);

  return {
    isValid: errors.length === 0,
    errors,
    qualityScore,
  };
}

/**
 * Stage 2: Compiles a validated logical draft into a published DetectiveCase format.
 */
export function compileDraftToCase(
  draft: CaseLogicDraft,
  chapterId: string,
  chapterOrder: number,
  scenes: CaseScene[]
): DetectiveCase {
  const validation = validateCaseLogic(draft);
  if (!validation.isValid) {
    throw new Error(`Cannot compile invalid case logic: ${validation.errors.join("; ")}`);
  }

  const puzzles: CasePuzzle[] = [
    {
      id: `puzzle-${draft.id}-contradiction`,
      type: "contradiction_buster",
      title: "Thử Thách A: Lật Tẩy Mâu Thuẫn",
      subtitle: "Ace Attorney Refutation Style",
      instruction: `Nhân vật quả quyết: "${draft.patientClaim.statement}". Hãy chọn chứng cứ và lý do bóc tách ngụy biện này!`,
      targetClaim: {
        speaker: draft.patientClaim.speaker,
        statement: draft.patientClaim.statement,
        context: `Thiên kiến nhận thức: ${draft.patientClaim.biasType}`,
      },
      requiredClueId: draft.contradiction.requiredClueId,
      contradictionReasonOptions: [
        {
          id: `reason-correct-${draft.id}`,
          text: draft.contradiction.correctReason,
          isCorrect: true,
        },
        {
          id: `reason-distractor-1-${draft.id}`,
          text: "Yếu tố này hoàn toàn vô hại và không thể gây ảnh hưởng sinh học nào.",
          isCorrect: false,
        },
        {
          id: `reason-distractor-2-${draft.id}`,
          text: "Dữ liệu được ghi nhận vào ban ngày nên không liên quan đến ban đêm.",
          isCorrect: false,
        },
      ],
      successRevelation: {
        title: "BÍ ẨN ĐÃ ĐƯỢC BÓC TRẦN!",
        text: draft.contradiction.revelationInsight,
        scientificInsight: draft.underlyingTruth,
      },
    },
    {
      id: `puzzle-${draft.id}-timeline`,
      type: "timeline_reconstruction",
      title: "Thử Thách B: Tái Dựng Dòng Thời Gian Bệnh Học",
      subtitle: "Golden Idol Sequence Style",
      instruction: "Xếp các chứng cứ vào đúng trình tự thời gian xảy ra để tái dựng chuỗi nhân quả.",
      slots: draft.timeline.map((t) => ({
        id: `slot-${draft.id}-${t.order}`,
        order: t.order,
        timeLabel: t.timeLabel,
        expectedClueId: t.expectedClueId,
        slotHint: `Mốc thời gian: ${t.timeLabel}`,
        narrativeWhenPlaced: t.narrative,
      })),
      availableClueIds: draft.clues.map((c) => c.id),
      successSummary: "Chuỗi nhân quả toàn cảnh đã được tái hiện chính xác.",
    },
    {
      id: `puzzle-${draft.id}-synthesis`,
      type: "multi_factor_synthesis",
      title: "Thử Thách C: Đánh Giá Đa Yếu Tố",
      subtitle: "Obra Dinn Multi-Factor Batch Style",
      instruction: "Chọn các mắt xích nguy cơ khoa học thực sự và loại bỏ các bẫy đổ lỗi.",
      coreQuestion: `Những yếu tố nào cùng tham gia kích hoạt vấn đề sức khỏe của ${draft.patientClaim.speaker}?`,
      minRequiredFactors: draft.contributingFactors.filter((f) => f.isCorrect).length,
      trapFactorIds: draft.contributingFactors.filter((f) => f.isTrap).map((f) => f.title),
      factors: draft.contributingFactors.map((f, idx) => ({
        id: `factor-${draft.id}-${idx}`,
        clueId: f.clueId,
        title: f.title,
        category: f.isTrap ? "false_scapegoat" : "contributing_risk",
        isCorrectContributingFactor: f.isCorrect,
        explanation: f.isTrap ? "Bẫy ngụy biện quy chụp." : "Mắt xích nguy cơ có căn cứ khoa học.",
      })),
      successSynthesis: draft.resolution.scientificExplanation,
    },
  ];

  const hypotheses: CaseHypothesis[] = [
    {
      id: `hypo-${draft.id}-trap`,
      caseId: draft.id,
      statement: draft.patientClaim.statement,
      initialProponent: draft.patientClaim.speaker,
      initialExplanation: "Nhận định ban đầu của nhân vật.",
      requiredClueIds: [],
      contradictingClueIds: [draft.contradiction.requiredClueId],
      status: "untested",
      isInitialTrap: true,
      trapExplanation: draft.contradiction.revelationInsight,
    },
    {
      id: `hypo-${draft.id}-truth`,
      caseId: draft.id,
      statement: draft.underlyingTruth,
      initialProponent: "Thám tử & Luna",
      initialExplanation: "Nhận định dựa trên đối chiếu lâm sàng.",
      requiredClueIds: draft.clues.filter((c) => c.isKeyClue).map((c) => c.id),
      contradictingClueIds: [],
      status: "untested",
    },
  ];

  const deductionSteps: DeductionStep[] = [
    {
      id: `step-${draft.id}-01`,
      caseId: draft.id,
      order: 1,
      title: "Lật tẩy mâu thuẫn & Tái dựng sự kiện",
      question: "Chứng cứ nào phản bác nhận định sai lầm của nhân vật?",
      requiredConnections: [
        {
          clueId: draft.contradiction.requiredClueId,
          hypothesisId: `hypo-${draft.id}-trap`,
          relation: "contradicts",
        },
      ],
      unlockedDeductionText: draft.contradiction.revelationInsight,
      revealsMisdirection: true,
      isKeyRevelation: true,
    },
  ];

  const resolution: CaseResolution = {
    caseId: draft.id,
    primaryConclusion: draft.resolution.primaryConclusion,
    isMultiFactor: true,
    scientificExplanation: draft.resolution.scientificExplanation,
    patientFeedback: draft.resolution.patientFeedback,
    medicalPearls: draft.medicalReferences.map((ref) => ({
      title: ref.title,
      takeaway: ref.summary,
      evidenceSource: ref.source,
      pmid: ref.pmid,
    })),
    expReward: 60,
    coinReward: 200,
  };

  return {
    id: draft.id,
    chapterId,
    chapterOrder,
    title: draft.mysteryHook,
    subtitle: draft.underlyingTruth,
    topic: draft.topic,
    region: "HealthClues Realm",
    difficulty: draft.difficulty,
    contentVersion: 1,
    publicationStatus: "draft", // Mặc định là draft, yêu cầu duyệt trước khi published!
    victimOrPatient: {
      name: draft.patientClaim.speaker,
      reportedSymptom: draft.patientClaim.statement,
      initialQuote: draft.patientClaim.statement,
    },
    lunaBriefing: {
      greeting: "Chào thám tử!",
      invitation: `Cùng mình điều tra vụ án "${draft.mysteryHook}" nhé!`,
      hint: "Hãy đối chiếu dấu thời gian và xem kỹ các chỉ số xét nghiệm.",
    },
    scenes,
    clues: draft.clues,
    hypotheses,
    deductionSteps,
    puzzles,
    resolution,
    references: draft.medicalReferences,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
