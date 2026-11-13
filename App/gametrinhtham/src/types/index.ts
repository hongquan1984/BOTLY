/**
 * HealthClues Mystery Detective - Case File Campaign System Domain Types
 * Portable contracts supporting Web (Next.js/React) and Future Mobile (React Native/Expo).
 */

export type CaseDifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface CaseDifficultyInfo {
  level: CaseDifficultyLevel;
  name: string;
  badge: string;
  description: string;
  estimatedMinutes: string;
  maxScenes: number;
  hasMisdirection: boolean;
  hasContradiction: boolean;
  color: string;
}

export type DetectiveTopic =
  | "sleep"
  | "gout"
  | "nutrition"
  | "migraine"
  | "stress"
  | "hydration"
  | "activity"
  | "herbal";

export interface MedicalReference {
  title: string;
  source: string;
  pmid?: string;
  url?: string;
  summary: string;
}

export type EvidenceSourceType = "item" | "document" | "witness" | "test_result" | "record" | "photo";

export interface EvidenceSource {
  type: EvidenceSourceType;
  location: string;
  timestamp?: string; // Dấu thời gian ghi nhận (cho timeline comparison)
  verified: boolean;
  medicalRef?: MedicalReference;
}

export interface CaseClue {
  id: string;
  caseId: string;
  sceneId: string;
  title: string;
  shortDescription: string;
  detailedObservation: string;
  icon: string;
  illustration?: string;
  source: EvidenceSource;
  isKeyClue: boolean;
  isMisdirection?: boolean; // Chi tiết đánh lạc hướng
  contradictsHypothesisIds?: string[];
  supportsHypothesisIds?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export type ObjectInspectionType =
  | "phone"
  | "coffee_cup"
  | "sleep_diary"
  | "plant"
  | "laptop"
  | "window"
  | "generic"
  | "interactive_card"
  | "medical_chart"
  | "photo_exif"
  | "receipt"
  | "water_bottle"
  | "pill_bottle";

export type InspectionCardTheme =
  | "clipboard"
  | "screen"
  | "beverage"
  | "food_box"
  | "pill"
  | "device"
  | "plant"
  | "bed"
  | "fitness";

export interface DetailHotspot {
  id: string;
  sceneHotspotId: string;
  title: string;
  subtitle?: string;
  observation: string;
  x: number; // 0..100 (%) relative to close-up container
  y: number; // 0..100 (%) relative to close-up container
  width?: number; // (%)
  height?: number; // (%)
  radius?: number; // (%)
  shape?: "circle" | "rect";
  associatedClueId?: string; // Clue ID it unlocks or records
  isCrucialEvidence?: boolean; // Internal engine logic only (never rendered in player UI!)
  category: "timestamp" | "statement" | "physical_property" | "medical_record" | "secondary_note";
  discoveredIcon?: string;
  evidenceData?: {
    timestamp?: string;
    location?: string;
    medicalRef?: MedicalReference;
  };
}

export interface SceneHotspot {
  id: string;
  sceneId: string;
  clueId: string;
  name: string;
  description: string;
  x: number; // 0..100 (%) centroid
  y: number; // 0..100 (%) centroid
  radius: number; // (%)
  shape: "circle" | "rect" | "polygon";
  width?: number; // (%)
  height?: number; // (%)
  bounds?: {
    x: number; // 0..100 (%) left
    y: number; // 0..100 (%) top
    width: number; // 0..100 (%)
    height: number; // 0..100 (%)
  };
  polygon?: Array<{ x: number; y: number }>; // Normalized 0..100% vertices wrapping object contour
  inspectMessage: string;
  discoveredIcon?: string;
  isDecorativeOnly?: boolean;
  decorText?: string;
  // V5 2-Tier Deep Inspection extensions:
  inspectionType?: ObjectInspectionType;
  inspectionTheme?: InspectionCardTheme;
  inspectionTitle?: string;
  inspectionSubtitle?: string;
  inspectionAsset?: string;
  detailHotspots?: DetailHotspot[];
}

export interface CaseScene {
  id: string;
  caseId: string;
  name: string;
  description: string;
  theme: "bedroom" | "living_room" | "clinic" | "garden" | "office";
  lighting: "night" | "warm" | "cozy" | "dramatic";
  hotspots: SceneHotspot[];
  backgroundSvg?: string;
  backgroundUrl?: string;
  aspectRatio?: number; // Exact naturalWidth / naturalHeight of scene image (default 1376/768)
}

export type HypothesisStatus = "untested" | "supported" | "contradicted" | "inconclusive";

export interface CaseHypothesis {
  id: string;
  caseId: string;
  statement: string;
  initialProponent: string;
  initialExplanation: string;
  requiredClueIds: string[];
  contradictingClueIds: string[];
  status: HypothesisStatus;
  isInitialTrap?: boolean;
  trapExplanation?: string;
}

export type ClueRelationType = "supports" | "contradicts" | "irrelevant" | "needs_info";

export interface DeductionConnection {
  clueId: string;
  hypothesisId: string;
  relation: ClueRelationType;
  playerNote?: string;
}

export interface DeductionStep {
  id: string;
  caseId: string;
  order: number;
  title: string;
  question: string;
  requiredConnections: Array<{
    clueId: string;
    hypothesisId: string;
    relation: "supports" | "contradicts";
  }>;
  unlockedDeductionText: string;
  revealsMisdirection: boolean;
  isKeyRevelation?: boolean;
}

export interface MedicalPearl {
  title: string;
  takeaway: string;
  evidenceSource: string;
  pmid?: string;
}

// ----------------------------------------------------------------------------
// V4 UPGRADED PUZZLE ARCHITECTURE (Golden Idol, Ace Attorney, Obra Dinn Inspired)
// ----------------------------------------------------------------------------

export type DeductionPuzzleType =
  | "contradiction_buster"
  | "timeline_reconstruction"
  | "multi_factor_synthesis";

/**
 * Puzzle A: Ace Attorney Contradiction Buster
 * Challenge a patient or witness statement with concrete contradictory evidence.
 */
export interface ContradictionBusterPuzzle {
  id: string;
  type: "contradiction_buster";
  title: string;
  subtitle: string;
  instruction: string;
  targetClaim: {
    speaker: string;
    statement: string;
    context: string;
  };
  requiredClueId: string;
  acceptedClueIds?: string[];
  contradictionReasonOptions: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  successRevelation: {
    title: string;
    text: string;
    scientificInsight: string;
  };
}

/**
 * Puzzle B: Golden Idol Timeline Reconstruction
 * Chronologically map evidence and event occurrences.
 */
export interface TimelineSlot {
  id: string;
  order: number;
  timeLabel: string; // e.g. "14 ngày trước", "Ban ngày hôm qua", "21:15 tối qua", "02:00 sáng nay"
  expectedClueId: string;
  slotHint: string;
  narrativeWhenPlaced: string;
}

export interface TimelineReconstructionPuzzle {
  id: string;
  type: "timeline_reconstruction";
  title: string;
  subtitle: string;
  instruction: string;
  slots: TimelineSlot[];
  availableClueIds: string[];
  successSummary: string;
}

/**
 * Puzzle C: Obra Dinn Multi-Factor Hypothesis Evaluation
 * Distinguish multi-factorial physiological triggers from singular scapegoats.
 */
export interface SynthesisFactorOption {
  id: string;
  clueId?: string;
  title: string;
  category: "contributing_risk" | "underlying_baseline" | "false_scapegoat" | "irrelevant_decor";
  isCorrectContributingFactor: boolean;
  explanation: string;
}

export interface MultiFactorSynthesisPuzzle {
  id: string;
  type: "multi_factor_synthesis";
  title: string;
  subtitle: string;
  instruction: string;
  coreQuestion: string;
  factors: SynthesisFactorOption[];
  minRequiredFactors: number;
  trapFactorIds: string[];
  successSynthesis: string;
}

export type CasePuzzle =
  | ContradictionBusterPuzzle
  | TimelineReconstructionPuzzle
  | MultiFactorSynthesisPuzzle;

export interface PuzzleValidationResult {
  puzzleId: string;
  puzzleType: DeductionPuzzleType;
  isSolved: boolean;
  score: number; // 0..100
  feedbackMessage: string;
  revealedInsight?: string;
}

export interface BatchDeductionResult {
  allSolved: boolean;
  totalPuzzles: number;
  solvedCount: number;
  accuracyScore: number;
  starsAwarded: number;
  puzzleResults: Record<string, PuzzleValidationResult>;
  generalFeedback: string;
}

export interface CaseResolution {
  caseId: string;
  primaryConclusion: string;
  isMultiFactor: boolean;
  scientificExplanation: string;
  patientFeedback: string;
  medicalPearls: MedicalPearl[];
  expReward: number;
  coinReward?: number; // Thù lao Xu Thám Tử trao khi hoàn thành hồ sơ
  badgeReward?: {
    id: string;
    title: string;
    icon: string;
    description: string;
  };
}

export type CaseFileStatus = "locked" | "available" | "in_progress" | "solved";

export interface DetectiveChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  description: string;
  region: string;
  icon: string;
  color: string;
  caseIds: string[];
  isPublished: boolean;
}

// ----------------------------------------------------------------------------
// V6 UNIFIED INVESTIGATION: MEDICAL HANDBOOK + 1-SCREEN CONCLUSION + CHECKLIST
// ----------------------------------------------------------------------------

/**
 * Pure theoretical clinical knowledge unlocked inside the separate Medical Handbook tab
 * ONLY AFTER the player inspects and records the matching object clue (Phương án 2).
 * Must NEVER be attached to physical objects or pre-calculate case answers.
 */
export interface MedicalHandbookEntry {
  id: string;
  unlockByClueId: string;
  topicTitle: string;
  categoryLabel: string;
  icon: string;
  generalPrinciple: string;
  keyParameters: string[];
  medicalRef?: MedicalReference;
}

export interface CaseCandidateFactor {
  id: string;
  clueId?: string; // If omitted, represents a patient claim / room-wide factor always shown once ready
  label: string;
  subtitle?: string;
  icon: string;
  isTrueCause: boolean; // Internal engine logic only (NEVER rendered in selection UI!)
  comparisonSummary: string; // Shown in Step 2 Checklist Đối Chiếu after solving
  scienceMatchText: string; // Shown in Step 2 Checklist Đối Chiếu after solving
}

export interface HealthActionChecklistItem {
  id: string;
  text: string;
  categoryIcon: string;
}

export interface UnifiedConclusionConfig {
  questionPrompt: string;
  instruction: string;
  candidates: CaseCandidateFactor[];
  actionChecklist: HealthActionChecklistItem[];
}

export interface UnifiedConclusionEvaluation {
  isCorrect: boolean;
  starsRemaining: number; // 3 -> 2 -> 1 -> 0
  wrongAttempts: number;
  matchedCount: number;
  totalCandidates: number;
  accuracyPercent: number;
  expMultiplier: number; // 1.0 (3*), 0.7 (2*), 0.4 (1*), 0.2 (0*)
  feedbackMessage: string; // Vague, non-spoiling guidance when wrong
}

export interface DetectiveCase {
  id: string;
  chapterId: string;
  chapterOrder: number;
  prerequisiteCaseId?: string | null; // Vụ án bắt buộc phải giải trước để mở khóa
  title: string;
  subtitle: string;
  topic: DetectiveTopic;
  region: string;
  difficulty: CaseDifficultyLevel;
  contentVersion: number;
  publicationStatus: "draft" | "review" | "approved" | "published";
  victimOrPatient: {
    name: string;
    age?: number;
    reportedSymptom: string;
    initialQuote: string;
    avatar?: string;
  };
  lunaBriefing: {
    greeting: string;
    invitation: string;
    hint: string;
  };
  scenes: CaseScene[];
  clues: CaseClue[];
  medicalHandbook?: MedicalHandbookEntry[];
  conclusionConfig?: UnifiedConclusionConfig;
  hypotheses: CaseHypothesis[];
  deductionSteps: DeductionStep[];
  puzzles?: CasePuzzle[];
  resolution: CaseResolution;
  references: MedicalReference[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerDetectiveProgress {
  userId: string;
  caseId: string;
  foundClueIds: string[];
  inspectedHotspotIds: string[];
  boardConnections: DeductionConnection[];
  revealedContradictions: string[];
  completedStepIds: string[];
  puzzleStates?: Record<string, any>;
  wrongConclusionAttempts?: number;
  selectedConclusionIds?: string[];
  checklistConfirmed?: boolean;
  status: CaseFileStatus;
  startedAt: string;
  solvedAt?: string;
  starsAwarded?: number;
  expAwarded?: number;
  coinsAwarded?: number;
  replayedCount?: number;
}

export interface DetectiveRank {
  level: number;
  title: string;
  badge: string;
  minSolved: number;
  color: string;
}

export interface PlayerChapterProgress {
  chapterId: string;
  totalCases: number;
  solvedCases: number;
  totalStars: number;
  isCompleted: boolean;
}
