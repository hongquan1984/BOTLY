import type {
  CaseCandidateFactor,
  CaseClue,
  CaseHypothesis,
  DeductionConnection,
  DeductionStep,
  HypothesisStatus,
  MedicalHandbookEntry,
  UnifiedConclusionConfig,
  UnifiedConclusionEvaluation,
} from "../../types";

export interface HypothesisEvaluation {
  hypothesisId: string;
  status: HypothesisStatus;
  supportingClueIds: string[];
  contradictingClueIds: string[];
  isTrapBusted: boolean; // Bẫy đã bị lật tẩy thành công
  feedbackText: string;
}

export function evaluateHypothesis(
  hypothesis: CaseHypothesis,
  connections: DeductionConnection[],
  allClues: CaseClue[]
): HypothesisEvaluation {
  // Tìm tất cả connections nhắm vào hypothesis này
  const relevantConns = connections.filter((c) => c.hypothesisId === hypothesis.id);

  const supportingConns = relevantConns.filter((c) => c.relation === "supports");
  const contradictingConns = relevantConns.filter((c) => c.relation === "contradicts");

  const supportingClueIds = supportingConns.map((c) => c.clueId);
  const contradictingClueIds = contradictingConns.map((c) => c.clueId);

  // Kiểm tra xem có chứng cứ phản bác thực sự hay không
  const validContradictions = contradictingClueIds.filter((id) =>
    hypothesis.contradictingClueIds.includes(id)
  );

  let status: HypothesisStatus = "untested";
  let isTrapBusted = false;
  let feedbackText = "Chưa có đủ manh mối được liên kết với giả thuyết này.";

  if (validContradictions.length > 0) {
    status = "contradicted";
    isTrapBusted = Boolean(hypothesis.isInitialTrap);
    feedbackText = hypothesis.trapExplanation || "Giả thuyết này đã bị bác bỏ bởi bằng chứng mâu thuẫn.";
  } else if (
    hypothesis.requiredClueIds.length > 0 &&
    hypothesis.requiredClueIds.every((id) => supportingClueIds.includes(id))
  ) {
    status = "supported";
    feedbackText = "Giả thuyết này được củng cố vững chắc bởi các chứng cứ hiện trường.";
  } else if (supportingClueIds.length > 0) {
    status = "inconclusive";
    feedbackText = "Có một số dữ liệu hỗ trợ, nhưng chưa đủ chứng cứ xác đáng để kết luận.";
  }

  return {
    hypothesisId: hypothesis.id,
    status,
    supportingClueIds,
    contradictingClueIds,
    isTrapBusted,
    feedbackText,
  };
}

export interface StepEvaluationResult {
  stepId: string;
  isUnlocked: boolean;
  unlockedText?: string;
  isKeyRevelation: boolean;
}

export function evaluateDeductionSteps(
  steps: DeductionStep[],
  connections: DeductionConnection[]
): StepEvaluationResult[] {
  return steps.map((step) => {
    // Bước này đòi hỏi một danh sách requiredConnections
    const allRequirementsMet = step.requiredConnections.every((req) => {
      const match = connections.find(
        (c) =>
          c.clueId === req.clueId &&
          c.hypothesisId === req.hypothesisId &&
          c.relation === req.relation
      );
      return Boolean(match);
    });

    return {
      stepId: step.id,
      isUnlocked: allRequirementsMet,
      unlockedText: allRequirementsMet ? step.unlockedDeductionText : undefined,
      isKeyRevelation: Boolean(step.isKeyRevelation && allRequirementsMet),
    };
  });
}

export interface FinalDeductionCheck {
  canConclude: boolean;
  accuracyScore: number; // 0-100
  stars: number; // 1-3
  feedback: string;
  revealedTrapsCount: number;
}

export function checkFinalDeduction(
  hypotheses: CaseHypothesis[],
  steps: DeductionStep[],
  connections: DeductionConnection[]
): FinalDeductionCheck {
  const evaluatedHypotheses = hypotheses.map((h) => evaluateHypothesis(h, connections, []));
  const evaluatedSteps = evaluateDeductionSteps(steps, connections);

  const completedStepsCount = evaluatedSteps.filter((s) => s.isUnlocked).length;
  const trapsBusted = evaluatedHypotheses.filter((h) => h.isTrapBusted).length;

  // Cần hoàn thành ít nhất 80% deduction steps để có thể kết luận
  const stepRatio = steps.length > 0 ? completedStepsCount / steps.length : 1;
  const canConclude = stepRatio >= 0.7;

  let accuracyScore = Math.round(stepRatio * 70);
  if (trapsBusted > 0) {
    accuracyScore += 30; // Điểm thưởng phát hiện bẫy ngụy biện
  }
  accuracyScore = Math.min(100, Math.max(0, accuracyScore));

  let stars = 1;
  if (accuracyScore >= 90) stars = 3;
  else if (accuracyScore >= 70) stars = 2;

  let feedback = "";
  if (accuracyScore >= 90) {
    feedback = "Xuất sắc! Bạn đã đối chiếu chính xác toàn bộ dòng thời gian, bóc tách ngụy biện và đưa ra kết luận khoa học thấu đáo.";
  } else if (accuracyScore >= 70) {
    feedback = "Khá tốt! Bạn đã nhận ra các yếu tố quan trọng, dù một số mắt xích suy luận có thể đào sâu hơn.";
  } else {
    feedback = "Chưa đủ chứng cứ liên kết. Hãy mở lại bảng suy luận để nối các manh mối với giả thuyết phù hợp.";
  }

  return {
    canConclude,
    accuracyScore,
    stars,
    feedback,
    revealedTrapsCount: trapsBusted,
  };
}

// ----------------------------------------------------------------------------
// V4 ADVANCED PUZZLE EVALUATORS (Anti-Brute-Force & Multi-Step Reasoning)
// ----------------------------------------------------------------------------

import type {
  BatchDeductionResult,
  CasePuzzle,
  ContradictionBusterPuzzle,
  MultiFactorSynthesisPuzzle,
  PuzzleValidationResult,
  TimelineReconstructionPuzzle,
} from "../../types";

export function evaluateContradictionBuster(
  puzzle: ContradictionBusterPuzzle,
  selectedClueId: string | null,
  selectedReasonId: string | null
): PuzzleValidationResult {
  if (!selectedClueId) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "contradiction_buster",
      isSolved: false,
      score: 0,
      feedbackMessage: "Vui lòng chọn một chứng cứ trong hồ sơ để đối chất với lời kể.",
    };
  }

  const isClueMatch =
    selectedClueId === puzzle.requiredClueId ||
    Boolean(puzzle.acceptedClueIds && puzzle.acceptedClueIds.includes(selectedClueId));
  const reasonObj = puzzle.contradictionReasonOptions.find((r) => r.id === selectedReasonId);
  const isReasonMatch = Boolean(reasonObj?.isCorrect);

  if (isClueMatch && isReasonMatch) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "contradiction_buster",
      isSolved: true,
      score: 100,
      feedbackMessage: "Chính xác! Lời khẳng định đã bị bóc trần hoàn toàn bởi dấu vết thời gian thực tế.",
      revealedInsight: puzzle.successRevelation.text,
    };
  }

  if (isClueMatch && !isReasonMatch) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "contradiction_buster",
      isSolved: false,
      score: 40,
      feedbackMessage: "Bạn đã tìm đúng chứng cứ then chốt, nhưng lý do phản bác chưa phản ánh đúng bản chất mâu thuẫn.",
    };
  }

  return {
    puzzleId: puzzle.id,
    puzzleType: "contradiction_buster",
    isSolved: false,
    score: 10,
    feedbackMessage: "Chứng cứ này chưa chứng minh được sự mâu thuẫn trực tiếp với nhận định của nhân vật.",
  };
}

export function evaluateTimelineReconstruction(
  puzzle: TimelineReconstructionPuzzle,
  placedSlots: Record<string, string> // slotId -> clueId
): PuzzleValidationResult {
  const totalSlots = puzzle.slots.length;
  const slotEntries = Object.entries(placedSlots);

  if (slotEntries.length < totalSlots) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "timeline_reconstruction",
      isSolved: false,
      score: Math.round((slotEntries.length / totalSlots) * 30),
      feedbackMessage: `Chưa điền đủ các mốc thời gian (${slotEntries.length}/${totalSlots} mốc đã đặt).`,
    };
  }

  let correctCount = 0;
  for (const slot of puzzle.slots) {
    if (placedSlots[slot.id] === slot.expectedClueId) {
      correctCount++;
    }
  }

  const isAllCorrect = correctCount === totalSlots;
  const score = Math.round((correctCount / totalSlots) * 100);

  if (isAllCorrect) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "timeline_reconstruction",
      isSolved: true,
      score: 100,
      feedbackMessage: "Xuất sắc! Chuỗi sự kiện đã được tái hiện theo đúng trình tự thời gian sinh lý bệnh học.",
      revealedInsight: puzzle.successSummary,
    };
  }

  // Anti-Brute-Force: Giữ kín vị trí sai cụ thể để tránh người chơi đoán từng thẻ
  return {
    puzzleId: puzzle.id,
    puzzleType: "timeline_reconstruction",
    isSolved: false,
    score,
    feedbackMessage: `Bạn đã ghép đúng ${correctCount}/${totalSlots} mốc thời gian. Ít nhất một biến cố trước/trong bữa tối hoặc trước lúc đau đang bị nhầm lẫn. Hãy xem kỹ metadata thời gian trong sổ chứng cứ!`,
  };
}

export function evaluateMultiFactorSynthesis(
  puzzle: MultiFactorSynthesisPuzzle,
  selectedFactorIds: string[]
): PuzzleValidationResult {
  if (!selectedFactorIds || selectedFactorIds.length === 0) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "multi_factor_synthesis",
      isSolved: false,
      score: 0,
      feedbackMessage: "Hãy chọn các nhân tố sinh lý - hành vi thực sự tham gia vào cơ chế bùng phát cơn đau.",
    };
  }

  // Kiểm tra xem có dính bẫy ngụy biện (scapegoat / trap) không
  const hitTraps = selectedFactorIds.filter((id) => puzzle.trapFactorIds.includes(id));
  if (hitTraps.length > 0) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "multi_factor_synthesis",
      isSolved: false,
      score: 25,
      feedbackMessage: "LƯU Ý SUY LUẬN: Một trong các lựa chọn của bạn vẫn rơi vào bẫy quy kết nguyên nhân đơn lẻ (quy chụp) mà không có chứng cứ xác đáng.",
    };
  }

  const correctFactors = puzzle.factors.filter((f) => f.isCorrectContributingFactor);
  const correctSelected = selectedFactorIds.filter((id) => {
    const f = puzzle.factors.find((item) => item.id === id);
    return f?.isCorrectContributingFactor;
  });

  const isAllCorrectFactorsChosen = correctSelected.length === correctFactors.length;
  const score = Math.round((correctSelected.length / correctFactors.length) * 100);

  if (isAllCorrectFactorsChosen) {
    return {
      puzzleId: puzzle.id,
      puzzleType: "multi_factor_synthesis",
      isSolved: true,
      score: 100,
      feedbackMessage: "Chính xác! Bạn đã nhận diện toàn diện các mắt xích tương tác sinh học thay vì đổ lỗi cho một yếu tố ngẫu nhiên.",
      revealedInsight: puzzle.successSynthesis,
    };
  }

  return {
    puzzleId: puzzle.id,
    puzzleType: "multi_factor_synthesis",
    isSolved: false,
    score,
    feedbackMessage: `Bạn đã chọn đúng ${correctSelected.length}/${correctFactors.length} yếu tố nguy cơ then chốt. Cần đối chiếu thêm tình trạng dùng thuốc, nước và chuyển hóa.`,
  };
}

export function evaluateBatchPuzzles(
  puzzles: CasePuzzle[],
  puzzleStates: {
    contradictionBuster?: { selectedClueId: string | null; selectedReasonId: string | null };
    timelineReconstruction?: Record<string, string>;
    multiFactorSynthesis?: string[];
  }
): BatchDeductionResult {
  const totalPuzzles = puzzles.length;
  const puzzleResults: Record<string, PuzzleValidationResult> = {};
  let totalScore = 0;
  let solvedCount = 0;

  for (const puzzle of puzzles) {
    let result: PuzzleValidationResult;
    if (puzzle.type === "contradiction_buster") {
      const state = puzzleStates.contradictionBuster || { selectedClueId: null, selectedReasonId: null };
      result = evaluateContradictionBuster(puzzle, state.selectedClueId, state.selectedReasonId);
    } else if (puzzle.type === "timeline_reconstruction") {
      const state = puzzleStates.timelineReconstruction || {};
      result = evaluateTimelineReconstruction(puzzle, state);
    } else {
      const state = puzzleStates.multiFactorSynthesis || [];
      result = evaluateMultiFactorSynthesis(puzzle, state);
    }

    puzzleResults[puzzle.id] = result;
    totalScore += result.score;
    if (result.isSolved) solvedCount++;
  }

  const accuracyScore = totalPuzzles > 0 ? Math.round(totalScore / totalPuzzles) : 100;
  const allSolved = totalPuzzles > 0 ? solvedCount === totalPuzzles : true;

  let starsAwarded = 1;
  if (accuracyScore >= 90 && allSolved) starsAwarded = 3;
  else if (accuracyScore >= 70) starsAwarded = 2;

  let generalFeedback = "";
  if (allSolved) {
    generalFeedback = "TẤT CẢ CÁC BƯỚC SUY LUẬN ĐÃ ĐƯỢC GIẢI MÃ CHÍNH XÁC! Bí ẩn của vụ án đã sáng tỏ trọn vẹn.";
  } else {
    generalFeedback = `Đã hoàn thành ${solvedCount}/${totalPuzzles} thử thách điều tra. Hãy kiểm tra lại các bước suy luận còn vướng mắc!`;
  }

  return {
    allSolved,
    totalPuzzles,
    solvedCount,
    accuracyScore,
    starsAwarded,
    puzzleResults,
    generalFeedback,
  };
}

// ----------------------------------------------------------------------------
// V6 UNIFIED CONCLUSION & ITEM-UNLOCKED MEDICAL HANDBOOK EVALUATORS
// ----------------------------------------------------------------------------

/**
 * Phương án 2: Only unlock general medical handbook principles corresponding to clues
 * the player has actually inspected and recorded into their Evidence Notebook.
 */
export function getUnlockedMedicalHandbookEntries(
  handbook: MedicalHandbookEntry[] | undefined,
  foundClueIds: string[]
): MedicalHandbookEntry[] {
  if (!handbook || handbook.length === 0) return [];
  const foundSet = new Set(foundClueIds);
  return handbook.filter((entry) => foundSet.has(entry.unlockByClueId));
}

/**
 * Single-screen Unified Conclusion evaluation:
 * - Player selects the true physiological causes from candidates (true causes + traps).
 * - Wrong submissions deduct 1 star (3 -> 2 -> 1 -> 0) and give non-spoiling guidance.
 * - EXP scales down smoothly (100% -> 70% -> 40% -> 20%) while keeping Campaign unblocked.
 */
export function evaluateUnifiedConclusion(
  config: UnifiedConclusionConfig,
  selectedCandidateIds: string[],
  currentWrongAttempts: number = 0
): UnifiedConclusionEvaluation {
  const candidates = config.candidates || [];
  const totalCandidates = candidates.length;
  const selectedSet = new Set(selectedCandidateIds);

  if (selectedSet.size === 0) {
    const starsRemaining = Math.max(0, 3 - currentWrongAttempts);
    return {
      isCorrect: false,
      starsRemaining,
      wrongAttempts: currentWrongAttempts,
      matchedCount: 0,
      totalCandidates,
      accuracyPercent: 0,
      expMultiplier: starsRemaining === 3 ? 1 : starsRemaining === 2 ? 0.7 : starsRemaining === 1 ? 0.4 : 0.2,
      feedbackMessage: "Hãy tick chọn ít nhất một nguyên nhân trước khi xác nhận kết luận.",
    };
  }

  let matchedCount = 0;
  let missingTrueCount = 0;
  let trapPickedCount = 0;

  for (const c of candidates) {
    const isSelected = selectedSet.has(c.id);
    if (c.isTrueCause === isSelected) {
      matchedCount++;
    } else if (c.isTrueCause && !isSelected) {
      missingTrueCount++;
    } else if (!c.isTrueCause && isSelected) {
      trapPickedCount++;
    }
  }

  const isCorrect = missingTrueCount === 0 && trapPickedCount === 0;
  const accuracyPercent =
    totalCandidates > 0 ? Math.round((matchedCount / totalCandidates) * 100) : 100;

  if (isCorrect) {
    const starsRemaining = Math.max(0, 3 - currentWrongAttempts);
    const expMultiplier =
      starsRemaining === 3
        ? 1
        : starsRemaining === 2
        ? 0.7
        : starsRemaining === 1
        ? 0.4
        : 0.2;
    return {
      isCorrect: true,
      starsRemaining,
      wrongAttempts: currentWrongAttempts,
      matchedCount,
      totalCandidates,
      accuracyPercent: 100,
      expMultiplier,
      feedbackMessage:
        "Chính xác tuyệt đối! Bạn đã phân tách rạch ròi các nguyên nhân thực sự và loại bỏ hoàn toàn yếu tố đánh lừa.",
    };
  }

  // Wrong selection -> deduct 1 star (capped at 0 minimum)
  const nextWrongAttempts = currentWrongAttempts + 1;
  const starsRemaining = Math.max(0, 3 - nextWrongAttempts);
  const expMultiplier =
    starsRemaining === 2 ? 0.7 : starsRemaining === 1 ? 0.4 : 0.2;

  // Deliberately vague, non-spoiling feedback (NEVER mentions object names or exact clue keywords)
  let feedbackMessage = "";
  if (missingTrueCount > 0 && trapPickedCount > 0) {
    feedbackMessage = `Hồ sơ chưa khớp (${matchedCount}/${totalCandidates} đối chiếu hợp lệ). Vừa có nguyên nhân bị bỏ sót, vừa có yếu tố gây nhiễu bị chọn nhầm. Hãy rà soát lại các con số trong Sổ Manh Mối và đối chiếu Sổ Tay Y Khoa.`;
  } else if (missingTrueCount > 0) {
    feedbackMessage = `Hồ sơ vẫn còn thiếu nguyên nhân (${matchedCount}/${totalCandidates} đối chiếu hợp lệ). Vẫn còn tác nhân thực sự đang góp phần gây bệnh chưa được chọn — hãy kiểm tra kỹ mọi dữ kiện đã thu thập.`;
  } else {
    feedbackMessage = `Lựa chọn bị dư yếu tố gây nhiễu (${matchedCount}/${totalCandidates} đối chiếu hợp lệ). Có chi tiết nhìn bề ngoài tưởng là thủ phạm nhưng điều kiện thực tế lại chưa đủ cấu thành nguyên nhân — hãy đối chiếu kỹ lại Sổ Manh Mối và Sổ Tay Y Khoa.`;
  }

  return {
    isCorrect: false,
    starsRemaining,
    wrongAttempts: nextWrongAttempts,
    matchedCount,
    totalCandidates,
    accuracyPercent,
    expMultiplier,
    feedbackMessage,
  };
}

/**
 * Verifies that true causes and trap distractors are genuinely mixed across
 * both halves of the conclusion pinboard (never clustered all true on top/left).
 */
export function isMixedCandidateOrder(
  candidates: CaseCandidateFactor[],
  leftSplitSize = 4
): boolean {
  const trueCount = candidates.filter((c) => c.isTrueCause).length;
  const trapCount = candidates.length - trueCount;
  if (trueCount === 0 || trapCount === 0 || candidates.length <= leftSplitSize) {
    return true;
  }

  const leftSlice = candidates.slice(0, leftSplitSize);
  const rightSlice = candidates.slice(leftSplitSize);
  const leftTrue = leftSlice.filter((c) => c.isTrueCause).length;
  const rightTrue = rightSlice.filter((c) => c.isTrueCause).length;

  return (
    leftTrue > 0 &&
    leftTrue < leftSlice.length &&
    rightTrue > 0 &&
    rightTrue < rightSlice.length
  );
}

function forceMixedSwap(
  arr: CaseCandidateFactor[],
  leftSplitSize = 4
): CaseCandidateFactor[] {
  const copy = [...arr];
  const leftTrueCount = copy.slice(0, leftSplitSize).filter((c) => c.isTrueCause).length;
  if (leftTrueCount === leftSplitSize) {
    const firstTrapRightIdx = copy.findIndex((c, idx) => idx >= leftSplitSize && !c.isTrueCause);
    const swapLeftIdx = 1;
    if (firstTrapRightIdx !== -1 && swapLeftIdx < leftSplitSize) {
      [copy[swapLeftIdx], copy[firstTrapRightIdx]] = [copy[firstTrapRightIdx], copy[swapLeftIdx]];
    }
  } else if (leftTrueCount === 0) {
    const firstTrueRightIdx = copy.findIndex((c, idx) => idx >= leftSplitSize && c.isTrueCause);
    const swapLeftIdx = 1;
    if (firstTrueRightIdx !== -1 && swapLeftIdx < leftSplitSize) {
      [copy[swapLeftIdx], copy[firstTrueRightIdx]] = [copy[firstTrueRightIdx], copy[swapLeftIdx]];
    }
  }
  return copy;
}

function shuffleWithRng(
  candidates: CaseCandidateFactor[],
  nextRand: () => number,
  leftSplitSize: number,
  maxAttempts: number
): CaseCandidateFactor[] {
  if (candidates.length <= 2) return [...candidates];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const list = [...candidates];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    if (isMixedCandidateOrder(list, leftSplitSize)) {
      return list;
    }
  }

  return forceMixedSwap(candidates, leftSplitSize);
}

/**
 * Deterministic PRNG Fisher-Yates mix used for SSR-safe initial pinboard order.
 */
export function deterministicMixCandidates(
  candidates: CaseCandidateFactor[],
  seedText: string,
  leftSplitSize = 4
): CaseCandidateFactor[] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const nextRand = () => {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    return hash / 4294967296;
  };

  return shuffleWithRng(candidates, nextRand, leftSplitSize, 8);
}

/**
 * Runtime randomized Fisher-Yates shuffle guaranteeing true causes and traps
 * are distributed across both columns/groups on every open.
 */
export function shuffleCandidatesRandomly(
  candidates: CaseCandidateFactor[],
  leftSplitSize = 4
): CaseCandidateFactor[] {
  return shuffleWithRng(candidates, Math.random, leftSplitSize, 16);
}
