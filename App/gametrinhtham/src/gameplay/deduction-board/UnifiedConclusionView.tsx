"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  CaseCandidateFactor,
  CaseClue,
  MedicalHandbookEntry,
  UnifiedConclusionConfig,
  UnifiedConclusionEvaluation,
} from "../../types";
import {
  deterministicMixCandidates,
  evaluateUnifiedConclusion,
  getUnlockedMedicalHandbookEntries,
  shuffleCandidatesRandomly,
} from "../../engine/deduction-engine";
import { EvidenceIllustrationSvg } from "../shared/EvidenceIllustrationSvg";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  caseTitle: string;
  clues: CaseClue[];
  allCaseClues?: CaseClue[];
  foundClueIds: string[];
  medicalHandbook?: MedicalHandbookEntry[];
  conclusionConfig: UnifiedConclusionConfig;
  initialWrongAttempts?: number;
  initialSelectedIds?: string[];
  onWrongAttempt?: (
    wrongAttempts: number,
    starsRemaining: number,
    selectedIds: string[]
  ) => void;
  onFinalSubmit: (result: {
    canConclude: boolean;
    accuracyScore: number;
    stars: number;
    feedback: string;
    revealedTrapsCount: number;
    expMultiplier?: number;
  }) => void;
  onBackToScene: () => void;
}

interface StringLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function UnifiedConclusionView({
  caseTitle,
  clues,
  allCaseClues = [],
  foundClueIds,
  medicalHandbook = [],
  conclusionConfig,
  initialWrongAttempts = 0,
  initialSelectedIds = [],
  onWrongAttempt,
  onFinalSubmit,
  onBackToScene,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [wrongAttempts, setWrongAttempts] = useState<number>(initialWrongAttempts);
  const [lastEvaluation, setLastEvaluation] = useState<UnifiedConclusionEvaluation | null>(null);
  const [step, setStep] = useState<"select_causes" | "checklist_confirm">("select_causes");
  const [checkedActionIds, setCheckedActionIds] = useState<string[]>([]);
  const [showNotebookPopup, setShowNotebookPopup] = useState<boolean>(false);
  const [peekCandidate, setPeekCandidate] = useState<CaseCandidateFactor | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [shakeBoard, setShakeBoard] = useState<boolean>(false);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [shuffledCandidates, setShuffledCandidates] = useState<CaseCandidateFactor[]>(() =>
    deterministicMixCandidates(conclusionConfig.candidates, caseTitle)
  );

  useEffect(() => {
    setShuffledCandidates(shuffleCandidatesRandomly(conclusionConfig.candidates));
    setEliminatedIds([]);
  }, [caseTitle, conclusionConfig.candidates]);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [svgLines, setSvgLines] = useState<StringLine[]>([]);
  const [boardSize, setBoardSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const starsRemaining = Math.max(0, 3 - wrongAttempts);
  const minRequired = 4;
  const isUnlocked = foundClueIds.length >= minRequired;
  const uncollectedCluesCount = Math.max(
    0,
    (allCaseClues.length > 0 ? allCaseClues.length : clues.length) - foundClueIds.length
  );

  const unlockedHandbook = useMemo(
    () => getUnlockedMedicalHandbookEntries(medicalHandbook, foundClueIds),
    [medicalHandbook, foundClueIds]
  );

  const recomputeConnectionStrings = useCallback(() => {
    const board = boardRef.current;
    const lock = lockRef.current;
    if (!board || !lock) {
      setSvgLines([]);
      return;
    }

    const bRect = board.getBoundingClientRect();
    const lRect = lock.getBoundingClientRect();
    if (bRect.width === 0 || lRect.width === 0) {
      setSvgLines([]);
      return;
    }

    const lockCx = lRect.left - bRect.left + lRect.width / 2;
    const lockCy = lRect.top - bRect.top + lRect.height / 2;
    const isLandscapeHorizontal =
      typeof window !== "undefined"
        ? window.innerWidth >= 768 || (window.innerWidth >= 600 && window.innerHeight <= 520)
        : true;

    const lines: StringLine[] = [];
    for (const id of selectedIds) {
      const cardEl = cardRefs.current[id];
      if (!cardEl) continue;
      const cRect = cardEl.getBoundingClientRect();
      const cardCx = cRect.left - bRect.left + cRect.width / 2;
      const cardCy = cRect.top - bRect.top + cRect.height / 2;

      if (isLandscapeHorizontal) {
        const pinX =
          cardCx < lockCx
            ? cRect.left - bRect.left + cRect.width - 2
            : cRect.left - bRect.left + 2;
        lines.push({ id, x1: pinX, y1: cardCy, x2: lockCx, y2: lockCy });
      } else {
        // Mobile Vertical Butterfly Pinboard: top 4 connect from bottom edge, bottom 3 from top edge
        const pinY =
          cardCy < lockCy
            ? cRect.top - bRect.top + cRect.height - 2
            : cRect.top - bRect.top + 2;
        lines.push({ id, x1: cardCx, y1: pinY, x2: lockCx, y2: lockCy });
      }
    }

    setBoardSize({ w: bRect.width, h: bRect.height });
    setSvgLines(lines);
  }, [selectedIds]);

  useLayoutEffect(() => {
    recomputeConnectionStrings();
  }, [recomputeConnectionStrings, step, isUnlocked, lastEvaluation, shuffledCandidates]);

  useEffect(() => {
    const onResize = () => recomputeConnectionStrings();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeConnectionStrings]);

  const toggleCandidate = (candidateId: string) => {
    if (isEvaluating) return;
    if (eliminatedIds.includes(candidateId)) {
      setEliminatedIds((prev) => prev.filter((id) => id !== candidateId));
      detectiveAudio.playUiClick();
      return;
    }
    setSelectedIds((prev) => {
      const removing = prev.includes(candidateId);
      const next = removing
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId];
      detectiveAudio.playPinSnap(!removing, next.length);
      return next;
    });
  };

  const toggleEliminate = (candidateId: string) => {
    if (isEvaluating) return;
    const willEliminate = !eliminatedIds.includes(candidateId);
    setEliminatedIds((prev) =>
      willEliminate ? [...prev, candidateId] : prev.filter((id) => id !== candidateId)
    );
    if (willEliminate) {
      setSelectedIds((prev) => prev.filter((id) => id !== candidateId));
      detectiveAudio.playPinSnap(false, selectedIds.length);
    } else {
      detectiveAudio.playUiClick();
    }
  };

  const toggleActionItem = (actionId: string) => {
    setCheckedActionIds((prev) => {
      const removing = prev.includes(actionId);
      const next = removing
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId];
      if (!removing) {
        detectiveAudio.playChecklistTick(next.length);
      } else {
        detectiveAudio.playUiClick();
      }
      return next;
    });
  };

  const handleSubmitConclusion = () => {
    if (isEvaluating || selectedIds.length === 0) return;
    setIsEvaluating(true);
    detectiveAudio.playAnticipationLock();

    setTimeout(() => {
      const evalResult = evaluateUnifiedConclusion(
        conclusionConfig,
        selectedIds,
        wrongAttempts
      );
      setIsEvaluating(false);
      setLastEvaluation(evalResult);

      if (evalResult.isCorrect) {
        detectiveAudio.playEvidenceSave(6);
        setStep("checklist_confirm");
        return;
      }

      detectiveAudio.playWrongAttempt();
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 420);
      setWrongAttempts(evalResult.wrongAttempts);
      onWrongAttempt?.(evalResult.wrongAttempts, evalResult.starsRemaining, selectedIds);
    }, 220);
  };

  const handleConfirmChecklist = () => {
    if (!lastEvaluation || !lastEvaluation.isCorrect) return;
    detectiveAudio.playCaseSolvedFanfare();

    const totalCandidates = conclusionConfig.candidates.length;
    const trueCauseCount = conclusionConfig.candidates.filter((c) => c.isTrueCause).length;
    const trapsAvoidedCount = Math.max(0, totalCandidates - trueCauseCount);
    const penalty = wrongAttempts * 15;
    const accuracyScore = Math.max(40, Math.min(100, 100 - penalty));

    onFinalSubmit({
      canConclude: true,
      accuracyScore,
      stars: lastEvaluation.starsRemaining,
      feedback: lastEvaluation.feedbackMessage,
      revealedTrapsCount: trapsAvoidedCount,
      expMultiplier: lastEvaluation.expMultiplier,
    });
  };

  const allChecklistChecked =
    conclusionConfig.actionChecklist.length === 0 ||
    checkedActionIds.length === conclusionConfig.actionChecklist.length;

  const trueCauseCandidates = conclusionConfig.candidates.filter((c) => c.isTrueCause);
  const trapCandidates = conclusionConfig.candidates.filter((c) => !c.isTrueCause);

  const peekClue = peekCandidate?.clueId
    ? clues.find((c) => c.id === peekCandidate.clueId)
    : undefined;
  const peekHandbook = peekCandidate?.clueId
    ? unlockedHandbook.find((h) => h.unlockByClueId === peekCandidate.clueId)
    : undefined;

  const leftCandidates = shuffledCandidates.slice(0, 4);
  const rightCandidates = shuffledCandidates.slice(4);

  const renderCandidatePinCard = (
    candidate: CaseCandidateFactor,
    idx: number,
    group: "top_left" | "bottom_right"
  ) => {
    const isLockedByRoomClue =
      Boolean(candidate.clueId) && !foundClueIds.includes(candidate.clueId!);
    if (isLockedByRoomClue) {
      return (
        <button
          key={candidate.id}
          type="button"
          onClick={() => {
            detectiveAudio.playLockedPadlock();
            onBackToScene?.();
          }}
          data-testid={`candidate-locked-${candidate.id}`}
          className={`px-2.5 py-2 rounded-xl border border-dashed border-amber-500/50 bg-[#2b2016]/85 hover:bg-[#3a2a1d] flex items-center gap-2 text-amber-200 shadow-sm text-left transition ${
            group === "bottom_right" && idx === 6 ? "col-span-2 md:col-span-1" : ""
          }`}
        >
          <span className="text-sm shrink-0">🔒</span>
          <span className="text-[10.5px] font-bold leading-tight">
            Chưa soi món này · <span className="underline text-amber-300">Về phòng</span>
          </span>
        </button>
      );
    }

    const isSelected = selectedIds.includes(candidate.id);
    const isEliminated = eliminatedIds.includes(candidate.id);
    const linkedClue = candidate.clueId
      ? clues.find((c) => c.id === candidate.clueId)
      : undefined;
    const isAltTone = idx % 2 === 1;
    const isFullSpanLastMobile = group === "bottom_right" && idx === 6;

    return (
      <div
        key={candidate.id}
        ref={(el) => {
          cardRefs.current[candidate.id] = el;
        }}
        data-testid={`candidate-card-${candidate.id}`}
        data-eliminated={isEliminated ? "true" : "false"}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={() => toggleCandidate(candidate.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleEliminate(candidate.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleCandidate(candidate.id);
          }
        }}
        className={`detective-concl-card relative p-2 md:p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-1.5 sm:gap-2 select-none ${
          isFullSpanLastMobile ? "col-span-2 md:col-span-1" : ""
        } ${
          isSelected
            ? "border-emerald-400 bg-[#112e26]/95 text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.45)] ring-1 ring-emerald-300/60"
            : isEliminated
            ? "opacity-65 border-rose-500/45 bg-[#24161a]/90 text-slate-300 shadow-sm"
            : isAltTone
            ? "border-[#4b5a69] bg-[#1b242f]/95 text-slate-100 hover:border-amber-400/70 shadow-md"
            : "border-[#c4a874] bg-[#f4ebd4]/95 text-[#2b1c10] hover:border-amber-500 shadow-md"
        }`}
      >
        {/* Brass Thumbtack Pin (Faces Center Padlock on BOTH Mobile Vertical & Desktop Horizontal) */}
        <span
          className={`absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border shadow-sm pointer-events-none ${
            group === "top_left"
              ? "detective-concl-pin-left top-full left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-full"
              : "detective-concl-pin-right bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-0 md:-translate-x-1/2"
          } ${
            isSelected
              ? "bg-emerald-300 border-emerald-900 shadow-[0_0_8px_#34d399]"
              : isEliminated
              ? "bg-rose-900/75 border-rose-400/45"
              : "bg-amber-400 border-amber-900"
          }`}
        />

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className={`detective-concl-thumb w-7 h-6 md:w-12 md:h-9 rounded-md md:rounded-lg overflow-hidden bg-slate-900 border border-black/25 shrink-0 ${isEliminated ? "grayscale opacity-65" : ""}`}>
            <EvidenceIllustrationSvg
              clueOrCandidateId={candidate.clueId || candidate.id}
              fallbackIcon={candidate.icon}
            />
          </div>
          <div className="min-w-0">
            <div
              className={`detective-concl-label text-[11px] md:text-xs font-black leading-tight line-clamp-2 ${
                isEliminated
                  ? "line-through decoration-rose-400 decoration-2 text-rose-200/80"
                  : isSelected
                  ? "text-emerald-100"
                  : isAltTone
                  ? "text-slate-100"
                  : "text-[#24160b]"
              }`}
            >
              {candidate.label}
            </div>
            <div
              className={`detective-concl-sub text-[9.5px] md:text-[10px] font-bold truncate mt-0.5 ${
                isEliminated
                  ? "text-rose-300/85"
                  : isSelected
                  ? "text-emerald-300"
                  : isAltTone
                  ? "text-amber-300/85"
                  : "text-[#7a4b15]"
              }`}
            >
              {isEliminated
                ? "✗ Đã gạch loại trừ bẫy"
                : linkedClue?.source.timestamp
                ? `⏱️ ${linkedClue.source.timestamp}`
                : candidate.subtitle}
            </div>
          </div>
        </div>

        <div className="detective-concl-card-actions flex flex-col md:flex-row items-center gap-1 md:gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Nhờ Luna soi nhanh dữ kiện & Y khoa"
              onClick={(e) => {
                e.stopPropagation();
                detectiveAudio.playLunaChirp();
                setPeekCandidate(candidate);
              }}
              className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-[#23322c] hover:bg-[#2f453c] border border-[#8c6b3d]/70 text-[10px] flex items-center justify-center transition shadow-xs"
            >
              🦊
            </button>
            <button
              type="button"
              data-testid={`eliminate-card-${candidate.id}`}
              aria-pressed={isEliminated}
              title={isEliminated ? "Bỏ đánh dấu loại trừ" : "Đánh dấu ✗ Loại trừ bẫy (hoặc chuột phải)"}
              onClick={(e) => {
                e.stopPropagation();
                toggleEliminate(candidate.id);
              }}
              className={`w-5 h-5 md:w-6 md:h-6 rounded-md border text-[10px] font-black flex items-center justify-center transition shadow-xs ${
                isEliminated
                  ? "bg-rose-600 border-rose-300 text-white shadow-[0_0_8px_rgba(244,63,94,0.45)]"
                  : "bg-[#2b1d20]/90 hover:bg-rose-900/80 border-rose-400/40 text-rose-300/85"
              }`}
            >
              ✗
            </button>
          </div>
          <span
            className={`w-4 h-4 md:w-5 md:h-5 rounded-md border-2 flex items-center justify-center text-[10px] md:text-xs font-black ${
              isSelected
                ? "bg-emerald-400 border-emerald-200 text-slate-950"
                : isEliminated
                ? "border-rose-500/45 bg-rose-950/70 text-rose-300"
                : isAltTone
                ? "border-slate-500 bg-slate-900/70 text-transparent"
                : "border-[#9c7d4d] bg-white/75 text-transparent"
            }`}
          >
            {isEliminated ? "✗" : "✓"}
          </span>
        </div>
      </div>
    );
  };

  const renderStarMeter = (dataTestId?: string) => (
    <div
      data-testid={dataTestId}
      className="flex items-center gap-1 bg-[#1e1510]/95 px-2.5 py-1 rounded-lg border border-[#b88b47]/65 shadow"
    >
      <div className="flex items-center gap-0.5 text-xs sm:text-sm" aria-label={`${starsRemaining} trên 3 sao`}>
        {[1, 2, 3].map((slot) => (
          <span
            key={slot}
            className={slot <= starsRemaining ? "text-amber-400 drop-shadow" : "text-slate-600"}
          >
            {slot <= starsRemaining ? "⭐" : "☆"}
          </span>
        ))}
      </div>
      <span className="text-[11px] font-black text-amber-200">{starsRemaining}/3</span>
    </div>
  );

  return (
    <div
      style={{
        backgroundImage: "url('/gametrinhtham/ui/corkboard-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="detective-concl-wrapper w-full max-w-5xl mx-auto rounded-2xl border-4 border-[#5a3b24] bg-[#362417] shadow-[0_18px_45px_rgba(0,0,0,0.75)] p-2 sm:p-4 text-slate-100 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      <div className="relative z-10 space-y-2">
        {/* Engraved Brass Plaque Header Strip */}
        <div className="detective-concl-header flex items-center justify-between gap-2 pb-1.5 border-b border-[#c79d4b]/40">
          <div className="px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-[#8d6833] via-[#b88b47] to-[#8d6833] border border-[#f6d992]/70 text-[#1d1208] text-[10.5px] sm:text-xs font-black tracking-tight shadow-md flex items-center gap-1.5">
            <span>{step === "select_causes" ? "🎯" : "✅"}</span>
            <span>
              {step === "select_causes"
                ? "CHỌN NGUYÊN NHÂN GỐC RỄ (BỎ BẪY) · SAI -1★"
                : "ĐỐI CHIẾU & XÁC NHẬN HOÀN TẤT"}
            </span>
          </div>

          {/* Desktop Stars & Notebook (On mobile step 1 they move into Center Hub strip to save height) */}
          <div className={`detective-concl-desktop-meta ${step === "select_causes" ? "hidden md:flex" : "flex"} items-center gap-1.5 shrink-0`}>
            {renderStarMeter("conclusion-star-meter")}
            {isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setShowNotebookPopup(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#2e2015]/95 hover:bg-[#3f2c1d] text-amber-200 border border-[#b88b47]/70 text-[11px] font-black shadow transition whitespace-nowrap"
              >
                📓 <span className="hidden sm:inline">Xem Sổ </span>({clues.length})
              </button>
            )}
          </div>
        </div>

        {/* Gate when too few clues collected */}
        {!isUnlocked ? (
          <div className="p-5 sm:p-6 rounded-xl bg-[#1c130d]/90 border border-[#b88b47]/50 text-center space-y-3">
            <div className="text-3xl">🔐</div>
            <p className="text-xs text-amber-100">
              Cần soi &amp; lưu tối thiểu <strong>{minRequired}</strong> vật chứng trong phòng (đã có {foundClueIds.length}) trước khi mở Bảng Kết Luận.
            </p>
            <button
              type="button"
              onClick={onBackToScene}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow"
            >
              ← Quay lại phòng soi tiếp
            </button>
          </div>
        ) : (
          <>
            {/* STEP 1: VERTICAL BUTTERFLY ON MOBILE (< md) + HORIZONTAL PINBOARD ON DESKTOP (md+) */}
            {step === "select_causes" && (
              <div className={`space-y-2 ${shakeBoard ? "animate-detective-shake" : ""}`}>
                {uncollectedCluesCount > 0 && (
                  <div className="px-2.5 py-1 rounded-lg bg-[#1d140e]/85 border border-amber-400/50 text-[10.5px] sm:text-[11px] text-amber-200 flex items-center justify-between gap-2">
                    <span>⚠️ Còn <strong>{uncollectedCluesCount}</strong> vật thể chưa lưu dữ kiện vào Sổ.</span>
                    <button
                      type="button"
                      onClick={onBackToScene}
                      className="font-black text-amber-300 underline shrink-0"
                    >
                      Về phòng
                    </button>
                  </div>
                )}

                {/* Unified Single-DOM Pinboard Container */}
                <div
                  ref={boardRef}
                  className="detective-concl-board relative grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-3 items-center"
                >
                  {/* Live Glowing Emerald SVG Connection Strings (Works seamlessly on Mobile Vertical & Desktop Horizontal) */}
                  {boardSize.w > 0 && svgLines.length > 0 && (
                    <svg
                      width={boardSize.w}
                      height={boardSize.h}
                      className="absolute inset-0 pointer-events-none z-20 overflow-visible"
                    >
                      <defs>
                        <filter id="emerald-thread-glow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {svgLines.map((line) => (
                        <g key={line.id} filter="url(#emerald-thread-glow)">
                          <line
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="#34d399"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeOpacity="0.92"
                          />
                          <circle cx={line.x1} cy={line.y1} r="3.5" fill="#fde047" />
                        </g>
                      ))}
                    </svg>
                  )}

                  {/* Top 2x2 Grid (Mobile) / Left 4 Vertical Stack (Desktop) */}
                  <div className="detective-concl-col md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-2.5 relative z-20">
                    {leftCandidates.map((cand, i) => renderCandidatePinCard(cand, i, "top_left"))}
                  </div>

                  {/* Center Hub Strip: Mobile holds [Stars — Lock — Notebook], Desktop holds Center Lock Medallion */}
                  <div className="detective-concl-hub md:col-span-2 flex md:flex-col items-center justify-between md:justify-center gap-2 py-0.5 md:py-4 relative z-30">
                    {/* Mobile Left Star Meter */}
                    <div data-testid="conclusion-star-meter-mobile" className="detective-concl-mobile-meta md:hidden">
                      {renderStarMeter()}
                    </div>

                    {/* Central Brass Padlock Medallion */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        ref={lockRef}
                        className={`detective-concl-lock w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.65)] transition-all ${
                          isEvaluating
                            ? "animate-lock-anticipate bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border-amber-100 ring-4 ring-amber-300/60"
                            : selectedIds.length > 0
                            ? "bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.6)]"
                            : "bg-gradient-to-b from-[#9c783f] to-[#5e441e] border-[#e5c176]/70"
                        }`}
                      >
                        <span className="text-lg md:text-2xl drop-shadow leading-none">
                          {selectedIds.length > 0 ? "🔗" : "🔒"}
                        </span>
                        <span className="text-[9.5px] md:text-[10px] font-black text-slate-950 leading-tight mt-0.5">
                          {selectedIds.length} chốt
                        </span>
                      </div>
                      <span className="hidden md:inline-block text-[10px] font-bold text-amber-200 bg-black/55 px-2.5 py-0.5 rounded-full border border-amber-500/40 text-center">
                        {selectedIds.length > 0 ? "Đang nối hồ sơ" : "Chọn thẻ ghim"}
                      </span>
                    </div>

                    {/* Mobile Right Notebook Button */}
                    <button
                      type="button"
                      onClick={() => {
                        detectiveAudio.playPaperFlip();
                        setShowNotebookPopup(true);
                      }}
                      className="detective-concl-mobile-meta md:hidden px-2.5 py-1.5 rounded-lg bg-[#2e2015]/95 hover:bg-[#3f2c1d] text-amber-200 border border-[#b88b47]/70 text-[11px] font-black shadow whitespace-nowrap"
                    >
                      📓 ({clues.length})
                    </button>
                  </div>

                  {/* Bottom 3 Grid (Mobile) / Right 3 Vertical Stack (Desktop) */}
                  <div className="detective-concl-col md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-2.5 relative z-20">
                    {rightCandidates.map((cand, i) => renderCandidatePinCard(cand, i + 4, "bottom_right"))}
                  </div>
                </div>

                {lastEvaluation && !lastEvaluation.isCorrect && (
                  <div
                    data-testid="conclusion-error-feedback"
                    role="alert"
                    className="px-3 py-2 rounded-xl border border-rose-400/70 bg-[#3a1219]/95 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] sm:text-xs shadow-lg"
                  >
                    <span>
                      <strong className="text-rose-300 mr-1">⚠️ Chưa khớp (−1★):</strong>
                      {lastEvaluation.feedbackMessage}
                    </span>
                    <span className="text-[10.5px] font-black bg-rose-500/35 border border-rose-400/50 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-center">
                      Còn {lastEvaluation.starsRemaining}/3 sao
                    </span>
                  </div>
                )}

                {/* Bottom Brass & Emerald Seal Action Bar */}
                <div className="detective-concl-footer-bar flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs font-black text-amber-100 bg-[#1e1510]/90 px-3 py-2 rounded-xl border border-[#9e7742]/55 whitespace-nowrap">
                    Đã chọn: <strong className="text-emerald-400">{selectedIds.length}</strong>
                    {eliminatedIds.length > 0 && (
                      <span className="ml-1.5 text-rose-300">
                        · Loại: <strong>{eliminatedIds.length}</strong> ✗
                      </span>
                    )}
                    {eliminatedIds.length === 0 && (
                      <span className="hidden sm:inline text-amber-200/65 font-bold">
                        {" "}· Bấm ✗ để gạch bẫy
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    data-testid="submit-unified-conclusion"
                    disabled={selectedIds.length === 0 || isEvaluating}
                    onClick={handleSubmitConclusion}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#166b4c] via-[#1f8a63] to-[#b58b35] hover:brightness-110 disabled:opacity-45 text-amber-50 font-black text-xs sm:text-sm border-2 border-[#f6d992]/80 shadow-[0_6px_22px_rgba(16,185,129,0.35)] transition flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{isEvaluating ? "⏳ ĐANG ĐỐI CHIẾU..." : "⚖️ CHỐT KẾT ÁN"}</span>
                    {!isEvaluating && <span className="hidden sm:inline">&amp; PHÁ ÁN</span>}
                    {!isEvaluating && <span>→</span>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ACTION-FIRST SEALED CHECKLIST (Easy Top Confirmation on Mobile + Full Comparison Below) */}
            {step === "checklist_confirm" && (
              <div data-testid="checklist-confirm-step" className="space-y-3 bg-[#f4ebd4] text-[#2b1c10] p-3 sm:p-4 rounded-xl border-2 border-[#b58b47] shadow-xl">
                <div className="px-3 py-2 rounded-xl bg-[#16664a] text-amber-100 border border-[#b58b47] text-xs sm:text-sm font-black flex items-center gap-2 shadow">
                  <span>✅</span>
                  <span>Chính xác! Tách đúng {trueCauseCandidates.length} nguyên nhân gốc &amp; loại {trapCandidates.length} bẫy nhiễu</span>
                </div>

                {/* Action Checklist + Final Confirm placed FIRST right under Success Banner so Mobile sees immediately */}
                <div className="p-3 rounded-xl bg-white/95 border-2 border-[#b58b47] space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-black text-[#3b2511]">
                    <span>📋 Tick đủ hành động sức khỏe để đóng hồ sơ:</span>
                    <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {checkedActionIds.length}/{conclusionConfig.actionChecklist.length}
                    </span>
                  </div>
                  <div className="detective-checklist-grid space-y-1.5">
                    {conclusionConfig.actionChecklist.map((action) => {
                      const checked = checkedActionIds.includes(action.id);
                      return (
                        <label
                          key={action.id}
                          data-testid={`action-check-${action.id}`}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition ${
                            checked
                              ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                              : "bg-[#faf5e8] border-[#d6c299] text-[#3a2614] hover:border-[#b58b47]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleActionItem(action.id)}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                          />
                          <span className="text-sm shrink-0">{action.categoryIcon || "✓"}</span>
                          <span className="text-xs font-bold leading-snug">{action.text}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#e5d5b0]">
                    <span className="text-xs font-bold text-[#4a3117]">
                      Thành tích: <strong className="text-[#9e4716]">{starsRemaining}/3 sao</strong>
                    </span>
                    <button
                      type="button"
                      data-testid="confirm-case-completion"
                      disabled={!allChecklistChecked}
                      onClick={handleConfirmChecklist}
                      className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#166b4c] to-[#1e8760] hover:brightness-110 disabled:opacity-45 text-amber-100 font-black text-xs sm:text-sm border-2 border-[#c99e4e] shadow-xl transition whitespace-nowrap"
                    >
                      CONFIRM HOÀN TẤT ✓
                    </button>
                  </div>
                </div>

                {/* Comparison Summary Sheet below Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {trueCauseCandidates.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white/85 border border-emerald-500/60 space-y-1 text-xs shadow-2xs"
                    >
                      <div className="font-black text-emerald-900 flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-700">📌 {item.comparisonSummary}</div>
                      <div className="text-[11px] text-emerald-800 font-semibold">🩺 {item.scienceMatchText}</div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-[#eadbb9] border border-[#c7ab73] space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#6e4514]">
                    🛡️ {trapCandidates.length} bẫy đánh lừa đã loại:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {trapCandidates.map((item) => (
                      <div key={item.id} className="text-[11px] bg-white/75 p-2 rounded-lg border border-[#d6c299]">
                        <div className="font-black text-[#472c12]">
                          {item.icon} {item.label}
                        </div>
                        <div className="text-[#5e4425] mt-0.5 leading-snug">
                          {item.scienceMatchText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Candidate Peek Modal with Luna Doctor */}
      {peekCandidate && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/80 backdrop-blur-xs p-3"
          onClick={() => setPeekCandidate(null)}
        >
          <div
            className="w-full max-w-md m-auto max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl bg-[#dbe7df] border-4 border-[#5a3b25] p-3.5 shadow-2xl space-y-2.5 text-[#1d3127]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#8fa899]/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{peekCandidate.icon}</span>
                <h4 className="text-sm font-black">{peekCandidate.label}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPeekCandidate(null)}
                className="w-7 h-7 rounded-full bg-[#3a2515] text-amber-200 text-xs font-black"
              >
                ✕
              </button>
            </div>

            {peekClue ? (
              <div className="p-2.5 rounded-xl bg-white/85 border border-[#b9cbbd] text-xs space-y-1">
                <div className="font-black text-[#8f5116] text-[10px] uppercase">📌 Dữ kiện ghi nhận</div>
                <p className="font-semibold text-[#24362c]">{peekClue.shortDescription}</p>
                {peekClue.source.timestamp && (
                  <div className="text-[11px] font-mono font-bold text-[#7c480b]">
                    ⏱️ {peekClue.source.timestamp}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/85 border border-[#b9cbbd] text-xs">
                Lời kể / giả định ban đầu của nhân vật — kiểm tra các đồ vật thật trong phòng xem có khớp không.
              </div>
            )}

            {peekHandbook && (
              <div className="p-3 rounded-xl bg-[#f9f3e3] border-2 border-[#b58b47] text-xs space-y-1.5">
                <div className="text-[11px] font-black text-[#4a2b0d]">
                  🦊 Trợ lý Luna · {peekHandbook.topicTitle}
                </div>
                <p className="leading-relaxed text-[#2b1e12]">{peekHandbook.generalPrinciple}</p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {peekHandbook.keyParameters.map((p, i) => (
                    <span key={i} className="text-[10px] font-black bg-[#fde68a] border border-[#c79334] px-2 py-0.5 rounded text-[#5c3508]">
                      ⚡ {typeof p === "string" ? p : `${p.label}: ${p.value}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Notebook Popup */}
      {showNotebookPopup && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/80 backdrop-blur-xs p-3"
          onClick={() => setShowNotebookPopup(false)}
        >
          <div
            className="w-full max-w-2xl m-auto rounded-2xl bg-[#f5ecd7] border-4 border-[#5a3b25] p-4 shadow-2xl max-h-[calc(100dvh-24px)] flex flex-col gap-3 text-[#2d1d0f]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#d6c299] pb-2">
              <h3 className="text-sm font-black">📓 Tra nhanh Sổ Vật Chứng &amp; Y Khoa</h3>
              <button
                type="button"
                onClick={() => setShowNotebookPopup(false)}
                className="w-7 h-7 rounded-full bg-[#3a2515] text-amber-200 text-xs font-black"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-1">
              {clues.map((c) => {
                const hb = unlockedHandbook.find((h) => h.unlockByClueId === c.id);
                return (
                  <div key={c.id} className="p-3 rounded-xl bg-[#fffcf4] border border-[#cbb78e] space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2 font-black">
                      <span>{c.icon} {c.title}</span>
                      {c.source.timestamp && (
                        <span className="text-[10px] font-mono text-[#613407] bg-[#fdecc2] px-2 py-0.5 rounded">
                          {c.source.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-[#4a3117]">{c.shortDescription}</p>
                    {hb && (
                      <div className="p-2 rounded-lg bg-[#dbe7df] border border-[#9cb6a4] text-[#1d3127] text-[11px]">
                        <strong>🦊 {hb.topicTitle}:</strong> {hb.generalPrinciple}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
