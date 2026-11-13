import type {
  DetectiveCase,
  PlayerDetectiveProgress,
  DeductionConnection,
} from "../../types";

export type DetectiveGameStage =
  | "invitation"
  | "dossier"
  | "investigation"
  | "notebook"
  | "deduction_board"
  | "revelation"
  | "case_solved";

export interface CaseEngineState {
  currentCase: DetectiveCase;
  stage: DetectiveGameStage;
  activeSceneId: string;
  foundClueIds: string[];
  inspectedHotspotIds: string[];
  boardConnections: DeductionConnection[];
  activeInspectClueId: string | null;
  revealedMisdirection: boolean;
  unlockedDeductionText: string | null;
  isCompleted: boolean;
  accuracyScore: number;
  stars: number;
  expAwarded: number;
}

export function createInitialCaseState(
  caseData: DetectiveCase,
  savedProgress?: Partial<PlayerDetectiveProgress>
): CaseEngineState {
  return {
    currentCase: caseData,
    stage: savedProgress?.status === "solved" ? "case_solved" : "invitation",
    activeSceneId: caseData.scenes[0]?.id || "",
    foundClueIds: savedProgress?.foundClueIds || [],
    inspectedHotspotIds: savedProgress?.inspectedHotspotIds || [],
    boardConnections: savedProgress?.boardConnections || [],
    activeInspectClueId: null,
    revealedMisdirection: (savedProgress?.revealedContradictions?.length || 0) > 0,
    unlockedDeductionText: null,
    isCompleted: savedProgress?.status === "solved",
    accuracyScore: 0,
    stars: savedProgress?.starsAwarded || 0,
    expAwarded: savedProgress?.expAwarded || 0,
  };
}
