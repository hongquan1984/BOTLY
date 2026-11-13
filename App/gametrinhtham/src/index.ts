// HealthClues Mystery Detective Module - Main Exports
export * from "./types";
export * from "./data/cases";
export * from "./engine/difficulty-engine";
export * from "./engine/clue-engine";
export * from "./engine/deduction-engine";
export * from "./engine/progression-engine";
export * from "./engine/case-engine";
export * from "./engine/case-engine/campaign-engine";
export * from "./services/detective-service";
export * from "./services/api-handlers";

export { DetectiveGameApp } from "./components/DetectiveGameApp";
export { DetectiveCaseEditor } from "./admin/DetectiveCaseEditor";
export { CaseFileLibraryView } from "./gameplay/case-library/CaseFileLibraryView";
export { InvestigationSceneView } from "./gameplay/investigation-scene/InvestigationSceneView";
export { ClueNotebookView } from "./gameplay/clue-notebook/ClueNotebookView";
export { DeductionBoardView } from "./gameplay/deduction-board/DeductionBoardView";
export { ContradictionBusterPuzzleView } from "./gameplay/deduction-board/ContradictionBusterPuzzleView";
export { TimelineReconstructionPuzzleView } from "./gameplay/deduction-board/TimelineReconstructionPuzzleView";
export { MultiFactorSynthesisPuzzleView } from "./gameplay/deduction-board/MultiFactorSynthesisPuzzleView";
export { LunaDialogueModal } from "./gameplay/npc-dialogue/LunaDialogueModal";
export { CaseRevelationModal } from "./gameplay/case-completion/CaseRevelationModal";
export { CaseSolvedView } from "./gameplay/case-completion/CaseSolvedView";
export * from "./ai/case-generator";
export * from "./ai/prompt-templates";
