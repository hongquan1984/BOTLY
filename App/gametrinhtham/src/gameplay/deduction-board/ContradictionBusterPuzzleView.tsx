"use client";

import React, { useState } from "react";
import type { CaseClue, ContradictionBusterPuzzle, PuzzleValidationResult } from "../../types";
import { evaluateContradictionBuster } from "../../engine/deduction-engine";

interface Props {
  puzzle: ContradictionBusterPuzzle;
  collectedClues: CaseClue[];
  initialState?: { selectedClueId: string | null; selectedReasonId: string | null };
  onStateChange: (state: { selectedClueId: string | null; selectedReasonId: string | null }) => void;
  onPuzzleSolved?: (result: PuzzleValidationResult) => void;
}

export function ContradictionBusterPuzzleView({
  puzzle,
  collectedClues,
  initialState,
  onStateChange,
  onPuzzleSolved,
}: Props) {
  const [selectedClueId, setSelectedClueId] = useState<string | null>(
    initialState?.selectedClueId || null
  );
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(
    initialState?.selectedReasonId || null
  );
  const [validationResult, setValidationResult] = useState<PuzzleValidationResult | null>(null);

  const handleSelectClue = (clueId: string) => {
    setSelectedClueId(clueId);
    setValidationResult(null);
    onStateChange({ selectedClueId: clueId, selectedReasonId });
  };

  const handleSelectReason = (reasonId: string) => {
    setSelectedReasonId(reasonId);
    setValidationResult(null);
    onStateChange({ selectedClueId, selectedReasonId: reasonId });
  };

  const handleChallenge = () => {
    const result = evaluateContradictionBuster(puzzle, selectedClueId, selectedReasonId);
    setValidationResult(result);
    if (result.isSolved && onPuzzleSolved) {
      onPuzzleSolved(result);
    }
  };

  const isSolved = validationResult?.isSolved;

  return (
    <div className="space-y-6">
      {/* Target Claim Presentation */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-400/80 p-5 sm:p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
            LỜI KHAI CẦN ĐỐI CHẤT VỚI THỰC TẾ
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/20 text-3xl border border-amber-300 shadow-inner shrink-0">
            👤
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-200">
              {puzzle.targetClaim.speaker} khẳng định:
            </div>
            <p className="text-sm sm:text-base font-extrabold italic text-slate-100 leading-snug">
              "{puzzle.targetClaim.statement}"
            </p>
            <p className="text-[11px] text-slate-400">
              Bối cảnh ghi nhận: {puzzle.targetClaim.context}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Clue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>CHỌN CHỨNG CỨ PHẢN BÁC TRONG SỔ TAY ({collectedClues.length})</span>
          </h4>
          <span className="text-[11px] text-slate-500">Chạm để chọn chứng cứ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {collectedClues.map((clue) => {
            const isSelected = selectedClueId === clue.id;
            return (
              <div
                key={clue.id}
                onClick={() => handleSelectClue(clue.id)}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                  isSelected
                    ? "bg-amber-100 border-amber-500 shadow-lg ring-2 ring-amber-400/60"
                    : "bg-white border-[#e2d9c2] hover:bg-[#faf8f4] hover:border-slate-400"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                    {clue.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      {clue.title}
                    </h5>
                    {clue.source.timestamp && (
                      <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                        ⏱️ {clue.source.timestamp}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {clue.detailedObservation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Select Contradiction Reason */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
          <span>CHỈ RA MÂU THUẪN / LẬP LUẬN BÓC TÁCH</span>
        </h4>

        <div className="space-y-2">
          {puzzle.contradictionReasonOptions.map((reason) => {
            const isSelected = selectedReasonId === reason.id;
            return (
              <div
                key={reason.id}
                onClick={() => handleSelectReason(reason.id)}
                className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? "bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400/50"
                    : "bg-white border-[#e2d9c2] hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-amber-600 bg-amber-500 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  {reason.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button & Diagnostics Feedback */}
      <div className="pt-3 border-t border-[#e2d9c2] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleChallenge}
            disabled={!selectedClueId || !selectedReasonId}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 ${
              selectedClueId && selectedReasonId
                ? "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white hover:brightness-110 active:scale-98 animate-pulse"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span className="text-base">⚡</span>
            <span>BÓC TÁCH MÂU THUẪN ĐIỀU TRA</span>
          </button>

          {isSolved && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span>✅</span>
              <span>ĐÃ LẬT TẨY MÂU THUẪN</span>
            </span>
          )}
        </div>

        {/* Validation Result Feedback Banner */}
        {validationResult && (
          <div
            className={`p-4 rounded-2xl border-2 text-xs leading-relaxed animate-in fade-in ${
              validationResult.isSolved
                ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                : "bg-amber-50 border-amber-400 text-amber-950"
            }`}
          >
            <div className="font-black mb-1 flex items-center gap-1.5">
              <span>{validationResult.isSolved ? "🎉" : "💡"}</span>
              <span>{validationResult.feedbackMessage}</span>
            </div>

            {validationResult.revealedInsight && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/80 border border-emerald-300/80 text-slate-800 font-medium">
                <strong className="text-emerald-900 block mb-0.5">
                  Bước Ngoặt Khoa Học:
                </strong>
                <p>{validationResult.revealedInsight}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
