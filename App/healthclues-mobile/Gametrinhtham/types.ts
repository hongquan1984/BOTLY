export type DetectiveAssetRole = "scene-main" | "mai-before" | "mai-after" | "clue-closeup";

export interface DetectiveAsset {
  role: DetectiveAssetRole;
  clueId?: string;
  url: string;
  storageKey?: string;
  alt?: string;
  width?: number;
  height?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface MobileHotspot {
  id: string;
  clueId?: string;
  name: string;
  x: number;
  y: number;
  radius?: number;
  polygon?: Array<{ x: number; y: number }>;
}

export interface MobileScene {
  id: string;
  name: string;
  description?: string;
  backgroundUrl?: string;
  backgroundSvg?: string;
  hotspots: MobileHotspot[];
  assets?: DetectiveAsset[];
}

export interface MobileClue {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  inspectMessage?: string;
  inspectionTitle?: string;
  inspectionSubtitle?: string;
  closeupImageUrl?: string;
  assets?: DetectiveAsset[];
}

export interface MobileCase {
  id: string;
  chapterId: string;
  chapterOrder: number;
  prerequisiteCaseId?: string | null;
  title: string;
  subtitle: string;
  topic: string;
  region: string;
  difficulty: number;
  victimOrPatient?: { name: string; reportedSymptom?: string; initialQuote?: string; avatar?: string };
  lunaBriefing?: { greeting?: string; invitation?: string; hint?: string };
  scenes: MobileScene[];
  clues: MobileClue[];
  medicalHandbook?: Array<Record<string, unknown>>;
  hypotheses?: Array<Record<string, unknown>>;
  conclusionConfig?: {
    caseId?: string;
    caseTitle?: string;
    casePrompt?: string;
    questionPrompt?: string;
    instruction?: string;
    requiredSelectionsCount?: number;
    candidates?: Array<Record<string, any>>;
    actionChecklist?: Array<{ id: string; text: string; categoryIcon?: string }>;
  };
  puzzles?: Array<Record<string, any>>;
  resolution?: {
    primaryConclusion?: string;
    scientificExplanation?: string;
    patientFeedback?: string;
    expReward?: number;
    coinReward?: number;
    badgeReward?: { title?: string; icon?: string; description?: string };
    medicalPearls?: Array<{ title?: string; takeaway?: string; evidenceSource?: string; pmid?: string }>;
  };
  assets?: DetectiveAsset[];
}

export interface MobileChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  color?: string;
  caseIds?: string[];
}

export interface MobileProgress {
  caseId: string;
  status: "locked" | "available" | "in_progress" | "solved";
  foundClueIds: string[];
  inspectedHotspotIds?: string[];
  selectedConclusionIds?: string[];
  wrongConclusionAttempts?: number;
  puzzleStates?: Record<string, any>;
  starsAwarded?: number;
  expAwarded?: number;
  coinsAwarded?: number;
}

export interface DetectiveCampaignPayload {
  chapters: MobileChapter[];
  cases: MobileCase[];
  progress?: MobileProgress[];
  rankTitle?: string;
  totalSolved?: number;
}
