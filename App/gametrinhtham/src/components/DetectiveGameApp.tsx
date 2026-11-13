"use client";

import React, { useState, useEffect } from "react";
import type {
  DetectiveCase,
  DetectiveChapter,
  PlayerDetectiveProgress,
  DeductionConnection,
  CaseClue,
} from "../types";
import { ALL_CHAPTERS, ALL_DETECTIVE_CASES, getCaseById } from "../data/cases";
import { CaseFileLibraryView } from "../gameplay/case-library/CaseFileLibraryView";
import { InvestigationSceneView } from "../gameplay/investigation-scene/InvestigationSceneView";
import { ClueNotebookView } from "../gameplay/clue-notebook/ClueNotebookView";
import { DeductionBoardView } from "../gameplay/deduction-board/DeductionBoardView";
import { UnifiedConclusionView } from "../gameplay/deduction-board/UnifiedConclusionView";
import { LunaDialogueModal } from "../gameplay/npc-dialogue/LunaDialogueModal";
import { CaseRevelationModal } from "../gameplay/case-completion/CaseRevelationModal";
import { CaseSolvedView } from "../gameplay/case-completion/CaseSolvedView";
import { calculateRewardCoins, calculateRewardExp } from "../engine/progression-engine";
import { detectiveAudio } from "../audio/detectiveSoundEngine";
import "../audio/detective-juice.css";

export type DetectiveAppView =
  | "library"
  | "invitation"
  | "scene"
  | "notebook"
  | "deduction_board"
  | "revelation"
  | "solved";

interface Props {
  initialCaseId?: string;
  playerName?: string;
  onReturnToWorld?: () => void;
  onOpenAdmin?: () => void;
}

const STORAGE_KEY = "healthclues_detective_player_progress_v1";
const WALLET_COINS_KEY = "healthclues_detective_wallet_coins_v1";

export function DetectiveGameApp({
  initialCaseId,
  playerName = "Quân",
  onReturnToWorld,
  onOpenAdmin,
}: Props) {
  const [chapters] = useState<DetectiveChapter[]>(ALL_CHAPTERS);
  const [allCases] = useState<DetectiveCase[]>(ALL_DETECTIVE_CASES);

  // Load progress from localStorage on mount
  const [playerProgressList, setPlayerProgressList] = useState<PlayerDetectiveProgress[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    // Khởi tạo mặc định: Chưa có tiến trình nào, Case 001 là available
    return [];
  });

  // Current active view & case
  const [activeCaseId, setActiveCaseId] = useState<string>(
    initialCaseId || "case-sleep-001"
  );
  const [currentView, setCurrentView] = useState<DetectiveAppView>(
    initialCaseId ? "invitation" : "library"
  );

  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [revelationData, setRevelationData] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [lastSolvedSummary, setLastSolvedSummary] = useState<{
    accuracyScore: number;
    expAwarded: number;
    coinsAwarded: number;
    stars: number;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [clueSavedToast, setClueSavedToast] = useState<string | null>(null);

  useEffect(() => {
    setSoundEnabled(detectiveAudio.getEnabled());
    const unlockOnce = () => {
      detectiveAudio.unlock();
    };
    window.addEventListener("pointerdown", unlockOnce, { passive: true, once: true });
    window.addEventListener("keydown", unlockOnce, { passive: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    };
  }, []);

  useEffect(() => {
    if (currentView === "deduction_board") {
      detectiveAudio.setBgmMood("tension");
    } else if (currentView === "scene" || currentView === "notebook") {
      detectiveAudio.setBgmMood("investigate");
    } else {
      detectiveAudio.setBgmMood("ambient");
    }
  }, [currentView]);

  const handleToggleSound = () => {
    const next = detectiveAudio.toggleEnabled();
    setSoundEnabled(next);
  };

  const activeCase = getCaseById(activeCaseId) || ALL_DETECTIVE_CASES[0];

  // Aggregate total Xu earned across all cases (backward-compatible with solved saves before coinsAwarded existed)
  const walletCoins = playerProgressList.reduce((sum, p) => {
    if (typeof p.coinsAwarded === "number") return sum + p.coinsAwarded;
    if (p.status === "solved") {
      const cData = getCaseById(p.caseId);
      const { totalCoinsForStars } = calculateRewardCoins(
        cData?.resolution.coinReward || 150,
        p.starsAwarded ?? 3
      );
      return sum + totalCoinsForStars;
    }
    return sum;
  }, 0);

  // Helper: Get active case progress
  const activeCaseProgress = playerProgressList.find((p) => p.caseId === activeCase.id);

  // Sync active scene when active case changes
  useEffect(() => {
    if (activeCase.scenes.length > 0) {
      setActiveSceneId(activeCase.scenes[0].id);
    }
  }, [activeCase]);

  // Persist progress & Xu wallet to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playerProgressList));
        localStorage.setItem(WALLET_COINS_KEY, String(walletCoins));
      } catch {}
    }
  }, [playerProgressList, walletCoins]);

  // Handle case selection from Library
  const handleSelectCase = (caseId: string) => {
    detectiveAudio.playFolderOpen();
    setLastSolvedSummary(null);
    setActiveCaseId(caseId);
    const existing = playerProgressList.find((p) => p.caseId === caseId);

    // If already in progress with at least 1 saved clue, resume right in the scene; otherwise show Luna's briefing
    if (existing && existing.status === "in_progress" && existing.foundClueIds.length > 0) {
      setCurrentView("scene");
    } else if (existing && existing.status === "solved") {
      // Replaying: show invitation first
      setCurrentView("invitation");
    } else {
      setCurrentView("invitation");
    }
  };

  // Start investigating from Luna invitation
  const handleStartInvestigation = () => {
    detectiveAudio.playLunaChirp();
    // Mark as in_progress if not already solved
    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      if (existing) {
        if (existing.status !== "solved") {
          return prev.map((p) =>
            p.caseId === activeCase.id ? { ...p, status: "in_progress" } : p
          );
        }
        return prev;
      }
      return [
        ...prev,
        {
          userId: "current-user",
          caseId: activeCase.id,
          foundClueIds: [],
          inspectedHotspotIds: [],
          boardConnections: [],
          revealedContradictions: [],
          completedStepIds: [],
          status: "in_progress",
          startedAt: new Date().toISOString(),
        },
      ];
    });

    setCurrentView("scene");
  };

  // Clue discovered on scene
  const handleClueDiscovered = (clue: CaseClue) => {
    const existingCase = playerProgressList.find((p) => p.caseId === activeCase.id);
    const prevClues = existingCase?.foundClueIds || [];
    if (!prevClues.includes(clue.id)) {
      detectiveAudio.playEvidenceSave(prevClues.length + 1);
      setClueSavedToast(`${clue.icon} ${clue.title}`);
      window.setTimeout(() => setClueSavedToast(null), 2200);
    }

    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      const currentClues = existing?.foundClueIds || [];
      if (currentClues.includes(clue.id)) return prev;

      const updatedClues = [...currentClues, clue.id];

      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id ? { ...p, foundClueIds: updatedClues } : p
        );
      }
      return [
        ...prev,
        {
          userId: "current-user",
          caseId: activeCase.id,
          foundClueIds: updatedClues,
          inspectedHotspotIds: [],
          boardConnections: [],
          revealedContradictions: [],
          completedStepIds: [],
          status: "in_progress",
          startedAt: new Date().toISOString(),
        },
      ];
    });
  };

  // Hotspot inspected
  const handleHotspotInspected = (hotspotId: string) => {
    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      const currentHotspots = existing?.inspectedHotspotIds || [];
      if (currentHotspots.includes(hotspotId)) return prev;

      const updated = [...currentHotspots, hotspotId];
      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id ? { ...p, inspectedHotspotIds: updated } : p
        );
      }
      return [
        ...prev,
        {
          userId: "current-user",
          caseId: activeCase.id,
          foundClueIds: [],
          inspectedHotspotIds: updated,
          boardConnections: [],
          revealedContradictions: [],
          completedStepIds: [],
          status: "in_progress",
          startedAt: new Date().toISOString(),
        },
      ];
    });
  };

  // Connections changed on deduction board
  const handleConnectionsChange = (newConnections: DeductionConnection[]) => {
    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id ? { ...p, boardConnections: newConnections } : p
        );
      }
      return prev;
    });

    // Check if player just linked a contradicting clue to a misdirection hypothesis!
    // (e.g. Case 002: clue-gout-photo contradicts hypo-gout-beef)
    const hasBustedTrap = newConnections.some((conn) => {
      const hypo = activeCase.hypotheses.find((h) => h.id === conn.hypothesisId);
      return hypo?.isInitialTrap && conn.relation === "contradicts" && hypo.contradictingClueIds.includes(conn.clueId);
    });

    if (hasBustedTrap && !activeCaseProgress?.revealedContradictions?.includes("misdirection-busted")) {
      setPlayerProgressList((prev) =>
        prev.map((p) =>
          p.caseId === activeCase.id
            ? { ...p, revealedContradictions: [...(p.revealedContradictions || []), "misdirection-busted"] }
            : p
        )
      );

      if (activeCase.id === "case-gout-002") {
        setRevelationData({
          title: "PHÁT HIỆN DẤU THỜI GIAN: ẢNH BÒ CHỤP 3 TUẦN TRƯỚC!",
          text: "Dấu thời gian EXIF của bức ảnh chứng minh đĩa thịt bò được chụp từ ngày 19/10/2026 (cách đây 21 ngày). Minh chỉ đăng lại ảnh cũ lên mạng; tối hôm qua Minh hoàn toàn không ăn thịt bò! Giả thuyết ngộ nhận của Minh đã bị lật tẩy hoàn toàn.",
        });
        setCurrentView("revelation");
      }
    }
  };

  const handlePuzzleStatesChange = (newStates: Record<string, any>) => {
    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id ? { ...p, puzzleStates: newStates } : p
        );
      }
      return prev;
    });
  };

  const handleConclusionWrongAttempt = (
    wrongAttempts: number,
    _starsRemaining: number,
    selectedIds: string[]
  ) => {
    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id
            ? {
                ...p,
                wrongConclusionAttempts: wrongAttempts,
                selectedConclusionIds: selectedIds,
              }
            : p
        );
      }
      return prev;
    });
  };

  // Submit Final Deduction
  const handleFinalSubmit = (result: {
    canConclude: boolean;
    accuracyScore: number;
    stars: number;
    feedback: string;
    revealedTrapsCount: number;
    expMultiplier?: number;
  }) => {
    if (!result.canConclude) return;

    const existingBefore = playerProgressList.find((p) => p.caseId === activeCase.id);
    const isReplay = existingBefore?.status === "solved";
    const baseExp = activeCase.resolution.expReward;
    const earnedExpThisRun = isReplay
      ? 0
      : calculateRewardExp(baseExp, result.stars, result.expMultiplier);

    const baseCoins = activeCase.resolution.coinReward || 150;
    const prevCoinsOnCase = existingBefore?.coinsAwarded ?? 0;
    const { totalCoinsForStars, deltaCoins } = calculateRewardCoins(
      baseCoins,
      result.stars,
      result.expMultiplier,
      isReplay ? prevCoinsOnCase : 0
    );

    setLastSolvedSummary({
      accuracyScore: result.accuracyScore,
      expAwarded: earnedExpThisRun,
      coinsAwarded: deltaCoins,
      stars: result.stars,
    });

    setPlayerProgressList((prev) => {
      const existing = prev.find((p) => p.caseId === activeCase.id);
      if (existing) {
        return prev.map((p) =>
          p.caseId === activeCase.id
            ? {
                ...p,
                status: "solved",
                solvedAt: new Date().toISOString(),
                starsAwarded: result.stars,
                expAwarded: isReplay ? (p.expAwarded ?? earnedExpThisRun) : earnedExpThisRun,
                coinsAwarded: Math.max(p.coinsAwarded ?? 0, totalCoinsForStars),
                checklistConfirmed: true,
                replayedCount: (p.replayedCount || 0) + (p.status === "solved" ? 1 : 0),
              }
            : p
        );
      }
      return [
        ...prev,
        {
          userId: "current-user",
          caseId: activeCase.id,
          foundClueIds: activeCase.clues.map((c) => c.id),
          inspectedHotspotIds: [],
          boardConnections: [],
          revealedContradictions: [],
          completedStepIds: [],
          status: "solved",
          startedAt: new Date().toISOString(),
          solvedAt: new Date().toISOString(),
          starsAwarded: result.stars,
          expAwarded: earnedExpThisRun,
          coinsAwarded: totalCoinsForStars,
          checklistConfirmed: true,
        },
      ];
    });

    setCurrentView("solved");
  };

  // Find next case across global campaign progression (so Case 003 unlocks Case 004 seamlessly)
  const sortedCasesInCampaign = [...allCases].sort(
    (a, b) => a.chapterOrder - b.chapterOrder
  );
  const currentCaseIdx = sortedCasesInCampaign.findIndex((c) => c.id === activeCase.id);
  const nextCaseInCampaign = sortedCasesInCampaign[currentCaseIdx + 1];

  const foundCluesForActiveCase = activeCase.clues.filter((c) =>
    activeCaseProgress?.foundClueIds?.includes(c.id)
  );

  return (
    <div
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.30), rgba(0, 0, 0, 0.30)), url('/gametrinhtham/ui/desk-mahogany-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      className="detective-landscape-root min-h-screen bg-[#160f0c] text-slate-100 flex flex-col font-sans"
    >
      {/* Ultra-Compact Bronze Game HUD (<= 44px single row) */}
      {currentView !== "library" && (
        <nav className="detective-topnav sticky top-0 z-20 h-11 bg-gradient-to-r from-[#211813]/95 via-[#171311]/95 to-[#211813]/95 border-b border-[#9e7742]/55 text-amber-50 px-2 sm:px-4 shadow-[0_4px_18px_rgba(0,0,0,0.65)] backdrop-blur flex items-center">
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setCurrentView("library");
                }}
                className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-200 hover:text-white transition bg-[#2e221b] px-2 sm:px-2.5 py-1 rounded-lg border border-[#8c6b3d]/60 whitespace-nowrap shrink-0 shadow-inner"
              >
                <span>📂</span>
                <span className="hidden sm:inline detective-nav-long">Thư Viện Hồ Sơ</span>
                <span className="sm:hidden detective-nav-short">Hồ sơ</span>
              </button>

              <div className="detective-nav-case-title hidden md:flex items-center gap-1.5 text-xs font-black text-amber-100/90 min-w-0 truncate">
                <span className="truncate">{activeCase.title}</span>
                <span className="text-amber-400/75 text-[11px] shrink-0">
                  · Vụ #{activeCase.chapterOrder}
                </span>
              </div>

              <span
                data-testid="hud-wallet-coins"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black text-amber-300 bg-[#3a2815] border border-amber-500/45 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
              >
                <span>🪙</span>
                <span>{walletCoins} Xu</span>
              </span>
            </div>

            {/* Game Mode Switcher Tabs (Hidden on initial Briefing invitation to keep focus) */}
            {currentView !== "invitation" && (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setCurrentView("scene");
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap border ${
                  currentView === "scene"
                    ? "bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black border-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.45)]"
                    : "bg-[#2a201a] border-[#785c37]/50 text-amber-100/85 hover:bg-[#382b23]"
                }`}
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Hiện Trường</span>
                <span className="sm:hidden">Phòng</span>
              </button>

              <button
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setCurrentView("notebook");
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap border ${
                  currentView === "notebook"
                    ? "bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black border-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.45)]"
                    : clueSavedToast
                    ? "bg-emerald-950 border-emerald-400 text-emerald-100 shadow-[0_0_14px_rgba(52,211,153,0.5)] animate-pulse"
                    : "bg-[#2a201a] border-[#785c37]/50 text-amber-100/85 hover:bg-[#382b23]"
                }`}
              >
                <span>📓</span>
                <span className="hidden md:inline detective-nav-long">Sổ Manh Mối & Y Khoa</span>
                <span className="md:hidden detective-nav-short">Sổ</span>
                <span className="text-[10px] bg-black/35 px-1.5 rounded-full font-black">
                  {foundCluesForActiveCase.length}
                </span>
              </button>

              <button
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setCurrentView("deduction_board");
                }}
                className={`px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 whitespace-nowrap border ${
                  currentView === "deduction_board"
                    ? "bg-gradient-to-b from-emerald-300 to-emerald-500 text-slate-950 font-black border-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.45)]"
                    : "bg-[#2a201a] border-[#785c37]/50 text-amber-100/85 hover:bg-[#382b23]"
                }`}
              >
                <span>{activeCase.conclusionConfig ? "⚖️" : "🧩"}</span>
                <span className="hidden md:inline detective-nav-long">
                  {activeCase.conclusionConfig ? "Bảng Kết Luận" : "Bảng Suy Luận"}
                </span>
                <span className="md:hidden detective-nav-short">
                  {activeCase.conclusionConfig ? "Kết luận" : "Suy luận"}
                </span>
                <span className="text-[10px] bg-black/35 px-1.5 rounded-full font-black">
                  {activeCase.conclusionConfig
                    ? `⭐${Math.max(0, 3 - (activeCaseProgress?.wrongConclusionAttempts || 0))}`
                    : activeCaseProgress?.boardConnections?.length || 0}
                </span>
              </button>

              <button
                type="button"
                data-testid="toggle-sound-btn"
                onClick={handleToggleSound}
                aria-label={soundEnabled ? "Tắt âm thanh & nhạc" : "Bật âm thanh & nhạc"}
                title={soundEnabled ? "Đang bật nhạc & hiệu ứng (bấm để tắt)" : "Đang tắt tiếng (bấm để bật)"}
                className={`w-7 h-7 sm:w-auto sm:px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border shrink-0 whitespace-nowrap ${
                  soundEnabled
                    ? "bg-[#2f2318] border-amber-400/50 text-amber-200 hover:bg-[#3e2f20]"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{soundEnabled ? "🔊" : "🔇"}</span>
                <span className="hidden lg:inline">{soundEnabled ? "Nhạc" : "Tắt"}</span>
              </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Brief Non-Blocking Clue Recorded Sparkle Banner */}
      {clueSavedToast && currentView === "scene" && (
        <div className="fixed top-13 right-2 sm:right-4 z-30 pointer-events-none px-3 py-1.5 rounded-xl bg-emerald-950/95 border border-emerald-400/70 text-emerald-100 text-[11px] font-black shadow-[0_8px_24px_rgba(16,185,129,0.35)] flex items-center gap-2 animate-seal-pop">
          <span className="text-emerald-300">✨</span>
          <span>Đã lưu Sổ &amp; Mở mục Y khoa: {clueSavedToast}</span>
        </div>
      )}

      {/* Full-Bleed Atmospheric Game Stage (no z-index stacking trap so z-50 modals always sit cleanly above nav) */}
      <main
        className={
          currentView === "library"
            ? "flex-1 p-2 sm:p-4"
            : "detective-main-play flex-1 px-1.5 py-1.5 sm:px-3 sm:py-2.5 flex flex-col justify-start"
        }
      >
        {/* 1. Case File Library View */}
        {currentView === "library" && (
          <CaseFileLibraryView
            chapters={chapters}
            allCases={allCases}
            playerProgressList={playerProgressList}
            playerName={playerName}
            totalCoins={walletCoins}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onSelectCase={handleSelectCase}
            onOpenAdmin={onOpenAdmin}
          />
        )}

        {/* 2. Investigation Scene View */}
        {currentView === "scene" && (
          <InvestigationSceneView
            key={activeCase.id}
            scene={
              activeCase.scenes.find((s) => s.id === activeSceneId) ||
              activeCase.scenes[0]
            }
            allClues={activeCase.clues}
            foundClueIds={activeCaseProgress?.foundClueIds || []}
            inspectedHotspotIds={activeCaseProgress?.inspectedHotspotIds || []}
            onClueDiscovered={handleClueDiscovered}
            onHotspotInspected={handleHotspotInspected}
            onOpenNotebook={() => setCurrentView("notebook")}
            onOpenBriefing={() => setCurrentView("invitation")}
          />
        )}

        {/* 3. Evidence Notebook & Medical Handbook View */}
        {currentView === "notebook" && (
          <ClueNotebookView
            key={activeCase.id}
            foundClues={foundCluesForActiveCase}
            allCaseClues={activeCase.clues}
            medicalHandbook={activeCase.medicalHandbook}
            foundClueIds={activeCaseProgress?.foundClueIds || []}
            onOpenDeductionBoard={() => setCurrentView("deduction_board")}
            onBackToScene={() => setCurrentView("scene")}
          />
        )}

        {/* 4. Unified Conclusion Board (V6) or Legacy Deduction Board View */}
        {currentView === "deduction_board" && (
          activeCase.conclusionConfig ? (
            <UnifiedConclusionView
              key={activeCase.id}
              caseTitle={activeCase.title}
              clues={foundCluesForActiveCase}
              allCaseClues={activeCase.clues}
              foundClueIds={activeCaseProgress?.foundClueIds || []}
              medicalHandbook={activeCase.medicalHandbook}
              conclusionConfig={activeCase.conclusionConfig}
              initialWrongAttempts={activeCaseProgress?.wrongConclusionAttempts || 0}
              initialSelectedIds={activeCaseProgress?.selectedConclusionIds || []}
              onWrongAttempt={handleConclusionWrongAttempt}
              onFinalSubmit={handleFinalSubmit}
              onBackToScene={() => setCurrentView("scene")}
            />
          ) : (
            <DeductionBoardView
              caseTitle={activeCase.title}
              clues={foundCluesForActiveCase}
              hypotheses={activeCase.hypotheses}
              deductionSteps={activeCase.deductionSteps}
              connections={activeCaseProgress?.boardConnections || []}
              puzzles={activeCase.puzzles || []}
              initialPuzzleStates={activeCaseProgress?.puzzleStates || {}}
              onPuzzleStatesChange={handlePuzzleStatesChange}
              onConnectionsChange={handleConnectionsChange}
              onFinalSubmit={handleFinalSubmit}
              onBackToScene={() => setCurrentView("scene")}
            />
          )
        )}

        {/* 5. Case Solved View */}
        {currentView === "solved" && (
          <CaseSolvedView
            caseData={activeCase}
            stars={lastSolvedSummary?.stars ?? activeCaseProgress?.starsAwarded ?? 3}
            accuracyScore={lastSolvedSummary?.accuracyScore ?? 100}
            expAwarded={
              lastSolvedSummary?.expAwarded ??
              activeCaseProgress?.expAwarded ??
              activeCase.resolution.expReward
            }
            coinsAwarded={
              lastSolvedSummary?.coinsAwarded ??
              activeCaseProgress?.coinsAwarded ??
              activeCase.resolution.coinReward ??
              150
            }
            walletCoins={walletCoins}
            nextCaseId={nextCaseInCampaign?.id || null}
            onNextCase={(nextId) => {
              setLastSolvedSummary(null);
              setActiveCaseId(nextId);
              setCurrentView("invitation");
            }}
            onBackToLibrary={() => setCurrentView("library")}
            onReturnToWorld={onReturnToWorld}
          />
        )}

        {/* Luna Invitation Modal */}
        {currentView === "invitation" && (
          <LunaDialogueModal
            caseData={activeCase}
            playerName={playerName}
            onStartInvestigation={handleStartInvestigation}
            onBackToLibrary={() => setCurrentView("library")}
          />
        )}

        {/* Revelation Dramatic Modal */}
        {currentView === "revelation" && revelationData && (
          <CaseRevelationModal
            title={revelationData.title}
            revelationText={revelationData.text}
            onProceed={() => setCurrentView("deduction_board")}
          />
        )}
      </main>
    </div>
  );
}
