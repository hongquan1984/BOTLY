"use client";

import React, { useState } from "react";
import type {
  CaseClue,
  CaseHypothesis,
  CasePuzzle,
  ClueRelationType,
  DeductionConnection,
  DeductionStep,
} from "../../types";
import {
  evaluateHypothesis,
  evaluateDeductionSteps,
  checkFinalDeduction,
  evaluateBatchPuzzles,
} from "../../engine/deduction-engine";
import { ContradictionBusterPuzzleView } from "./ContradictionBusterPuzzleView";
import { TimelineReconstructionPuzzleView } from "./TimelineReconstructionPuzzleView";
import { MultiFactorSynthesisPuzzleView } from "./MultiFactorSynthesisPuzzleView";

interface Props {
  caseTitle: string;
  clues: CaseClue[];
  hypotheses: CaseHypothesis[];
  deductionSteps: DeductionStep[];
  connections: DeductionConnection[];
  puzzles?: CasePuzzle[];
  initialPuzzleStates?: {
    contradictionBuster?: { selectedClueId: string | null; selectedReasonId: string | null };
    timelineReconstruction?: Record<string, string>;
    multiFactorSynthesis?: string[];
  };
  onPuzzleStatesChange?: (states: any) => void;
  onConnectionsChange: (newConnections: DeductionConnection[]) => void;
  onFinalSubmit: (result: {
    canConclude: boolean;
    accuracyScore: number;
    stars: number;
    feedback: string;
    revealedTrapsCount: number;
  }) => void;
  onBackToScene: () => void;
}

export function DeductionBoardView({
  caseTitle,
  clues,
  hypotheses,
  deductionSteps,
  connections,
  puzzles = [],
  initialPuzzleStates = {},
  onPuzzleStatesChange,
  onConnectionsChange,
  onFinalSubmit,
  onBackToScene,
}: Props) {
  const hasPuzzles = Boolean(puzzles && puzzles.length > 0);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState(0);

  // Puzzle States for V4 Anti-Brute-Force
  const [puzzleStates, setPuzzleStates] = useState<{
    contradictionBuster?: { selectedClueId: string | null; selectedReasonId: string | null };
    timelineReconstruction?: Record<string, string>;
    multiFactorSynthesis?: string[];
  }>(initialPuzzleStates);

  // Classic connection states (fallback)
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [activeLinkingTarget, setActiveLinkingTarget] = useState<{
    clueId: string;
    hypothesisId: string;
  } | null>(null);

  const evaluatedHypotheses = hypotheses.map((h) =>
    evaluateHypothesis(h, connections, clues)
  );
  const evaluatedSteps = evaluateDeductionSteps(deductionSteps, connections);
  const classicCheck = checkFinalDeduction(hypotheses, deductionSteps, connections);

  // Batch Puzzles evaluation
  const batchResult = hasPuzzles
    ? evaluateBatchPuzzles(puzzles, puzzleStates)
    : null;

  const canConclude = hasPuzzles ? batchResult?.allSolved : classicCheck.canConclude;

  const handleUpdateContradiction = (state: {
    selectedClueId: string | null;
    selectedReasonId: string | null;
  }) => {
    const updated = { ...puzzleStates, contradictionBuster: state };
    setPuzzleStates(updated);
    if (onPuzzleStatesChange) onPuzzleStatesChange(updated);
  };

  const handleUpdateTimeline = (placed: Record<string, string>) => {
    const updated = { ...puzzleStates, timelineReconstruction: placed };
    setPuzzleStates(updated);
    if (onPuzzleStatesChange) onPuzzleStatesChange(updated);
  };

  const handleUpdateSynthesis = (selectedIds: string[]) => {
    const updated = { ...puzzleStates, multiFactorSynthesis: selectedIds };
    setPuzzleStates(updated);
    if (onPuzzleStatesChange) onPuzzleStatesChange(updated);
  };

  const handleFinalConclusionClick = () => {
    if (hasPuzzles && batchResult) {
      if (!batchResult.allSolved) return;
      onFinalSubmit({
        canConclude: true,
        accuracyScore: batchResult.accuracyScore,
        stars: batchResult.starsAwarded,
        feedback: batchResult.generalFeedback,
        revealedTrapsCount: 1,
      });
    } else {
      if (!classicCheck.canConclude) return;
      onFinalSubmit(classicCheck);
    }
  };

  const handleCreateConnection = (
    clueId: string,
    hypothesisId: string,
    relation: ClueRelationType
  ) => {
    const filtered = connections.filter(
      (c) => !(c.clueId === clueId && c.hypothesisId === hypothesisId)
    );
    const updated = [...filtered, { clueId, hypothesisId, relation }];
    onConnectionsChange(updated);
    setActiveLinkingTarget(null);
    setSelectedClueId(null);
  };

  const handleRemoveConnection = (clueId: string, hypothesisId: string) => {
    const updated = connections.filter(
      (c) => !(c.clueId === clueId && c.hypothesisId === hypothesisId)
    );
    onConnectionsChange(updated);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl border-2 border-[#d7cfb7] bg-[#fbf9f4] shadow-2xl p-4 sm:p-6 text-slate-900">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e2d9c2] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 text-2xl shadow border border-slate-700">
            🧩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                BÀN LÀM VIỆC ĐIỀU TRA & SUY LUẬN
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {hasPuzzles && batchResult
                  ? `${batchResult.solvedCount} / ${batchResult.totalPuzzles} thử thách hoàn thành`
                  : `${connections.length} mối liên kết`}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-snug">{caseTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onBackToScene}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 hover:bg-slate-100 transition"
          >
            ← Quay lại hiện trường
          </button>

          <button
            onClick={handleFinalConclusionClick}
            disabled={!canConclude}
            className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
              canConclude
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-400/50 animate-pulse"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>KẾT LUẬN VỤ ÁN</span>
            <span className="text-base">⚖️</span>
          </button>
        </div>
      </div>

      {/* V4 PUZZLE INTERFACE (When puzzles are configured) */}
      {hasPuzzles && puzzles.length > 0 ? (
        <div className="my-6 space-y-6">
          {/* Puzzle Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#e2d9c2]">
            {puzzles.map((p, idx) => {
              const isActive = activePuzzleIndex === idx;
              const isSolved = batchResult?.puzzleResults[p.id]?.isSolved;

              return (
                <button
                  key={p.id}
                  onClick={() => setActivePuzzleIndex(idx)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
                    isActive
                      ? "bg-slate-900 text-amber-400 border-2 border-amber-400 ring-2 ring-slate-800"
                      : "bg-white border-2 border-[#e2d9c2] text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{isSolved ? "✅" : "🔍"}</span>
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Puzzle Render */}
          <div className="pt-2">
            {puzzles[activePuzzleIndex]?.type === "contradiction_buster" && (
              <ContradictionBusterPuzzleView
                puzzle={puzzles[activePuzzleIndex] as any}
                collectedClues={clues}
                initialState={puzzleStates.contradictionBuster}
                onStateChange={handleUpdateContradiction}
              />
            )}

            {puzzles[activePuzzleIndex]?.type === "timeline_reconstruction" && (
              <TimelineReconstructionPuzzleView
                puzzle={puzzles[activePuzzleIndex] as any}
                collectedClues={clues}
                initialPlacedSlots={puzzleStates.timelineReconstruction}
                onPlacedSlotsChange={handleUpdateTimeline}
              />
            )}

            {puzzles[activePuzzleIndex]?.type === "multi_factor_synthesis" && (
              <MultiFactorSynthesisPuzzleView
                puzzle={puzzles[activePuzzleIndex] as any}
                initialSelectedFactorIds={puzzleStates.multiFactorSynthesis}
                onSelectedFactorsChange={handleUpdateSynthesis}
              />
            )}
          </div>
        </div>
      ) : (
        /* CLASSIC HYPOTHESES & CONNECTION VIEW (Fallback) */
        <div className="my-6">
          <div className="my-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950">
            <span className="text-lg">💡</span>
            <div className="leading-relaxed">
              <strong>Cách suy luận:</strong> Chạm một <strong>Thẻ Chứng Cứ</strong> bên dưới, sau đó chạm vào <strong>Giả Thuyết</strong> bạn muốn đối chiếu. Chọn quan hệ:{" "}
              <span className="text-emerald-700 font-bold">[🟢 Hỗ trợ]</span> hoặc{" "}
              <span className="text-rose-700 font-bold">[🔴 Bác bỏ]</span> để bóc tách mâu thuẫn!
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="space-y-4">
                {hypotheses.map((hypothesis) => {
                  const evalResult = evaluatedHypotheses.find((e) => e.hypothesisId === hypothesis.id);
                  const connsForThisHypo = connections.filter((c) => c.hypothesisId === hypothesis.id);
                  const isContradicted = evalResult?.status === "contradicted";
                  const isSupported = evalResult?.status === "supported";

                  return (
                    <div
                      key={hypothesis.id}
                      onClick={() => {
                        if (selectedClueId) {
                          setActiveLinkingTarget({
                            clueId: selectedClueId,
                            hypothesisId: hypothesis.id,
                          });
                        }
                      }}
                      className={`relative p-5 rounded-3xl border-2 transition-all shadow-sm ${
                        selectedClueId ? "cursor-pointer hover:border-amber-500 hover:shadow-md" : ""
                      } ${
                        isContradicted
                          ? "bg-rose-50/60 border-rose-300"
                          : isSupported
                          ? "bg-emerald-50/60 border-emerald-300"
                          : "bg-white border-[#d7cfb7]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {isContradicted ? "❌" : isSupported ? "✅" : "💭"}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Người đưa ra: {hypothesis.initialProponent}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
                              "{hypothesis.statement}"
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs leading-relaxed text-slate-600 bg-black/5 p-3 rounded-xl border border-black/5">
                        {evalResult?.feedbackText}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 mb-2">
                          Manh mối đã liên kết ({connsForThisHypo.length}):
                        </div>
                        {connsForThisHypo.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Chưa có chứng cứ nào được gắn vào giả thuyết này.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {connsForThisHypo.map((conn) => {
                              const clue = clues.find((c) => c.id === conn.clueId);
                              if (!clue) return null;
                              const isSupport = conn.relation === "supports";
                              const isContradict = conn.relation === "contradicts";

                              return (
                                <span
                                  key={conn.clueId}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                                    isSupport
                                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                      : isContradict
                                      ? "bg-rose-100 text-rose-900 border-rose-300"
                                      : "bg-slate-100 text-slate-800 border-slate-300"
                                  }`}
                                >
                                  <span>{clue.icon}</span>
                                  <span className="truncate max-w-44">{clue.title}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveConnection(conn.clueId, hypothesis.id);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 text-sm ml-1 font-bold leading-none"
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
              <div className="sticky top-4 bg-white p-5 rounded-3xl border-2 border-[#d7cfb7] shadow-md space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    SỔ CHỨNG CỨ ({clues.length})
                  </h3>
                  <span className="text-[10px] text-slate-500">Chạm để chọn</span>
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {clues.map((clue) => {
                    const isSelected = selectedClueId === clue.id;
                    const isLinked = connections.some((c) => c.clueId === clue.id);
                    return (
                      <div
                        key={clue.id}
                        onClick={() => setSelectedClueId(isSelected ? null : clue.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                          isSelected
                            ? "bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-400/60"
                            : isLinked
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-[#faf8f4] border-[#e2d9c2] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl">{clue.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {clue.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                              {clue.detailedObservation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classic Linking Modal */}
      {activeLinkingTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-md m-auto rounded-3xl bg-white border-2 border-amber-400 p-5 sm:p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-800 mb-2">
              XÁC LẬP QUAN HỆ SUY LUẬN
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn đánh giá manh mối này có mối liên hệ như thế nào với giả thuyết đang xét?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() =>
                  handleCreateConnection(
                    activeLinkingTarget.clueId,
                    activeLinkingTarget.hypothesisId,
                    "supports"
                  )
                }
                className="p-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-emerald-900 font-black text-xs hover:bg-emerald-100 transition flex flex-col items-center gap-1 shadow-sm"
              >
                <span className="text-xl">🟢</span>
                <span>ỦNG HỘ / HỖ TRỢ</span>
              </button>

              <button
                onClick={() =>
                  handleCreateConnection(
                    activeLinkingTarget.clueId,
                    activeLinkingTarget.hypothesisId,
                    "contradicts"
                  )
                }
                className="p-3 rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-900 font-black text-xs hover:bg-rose-100 transition flex flex-col items-center gap-1 shadow-sm"
              >
                <span className="text-xl">🔴</span>
                <span>BÁC BỎ / MÂU THUẪN</span>
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveLinkingTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
