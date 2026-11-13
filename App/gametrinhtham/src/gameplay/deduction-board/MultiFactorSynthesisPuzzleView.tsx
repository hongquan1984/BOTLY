"use client";

import React, { useState } from "react";
import type {
  MultiFactorSynthesisPuzzle,
  PuzzleValidationResult,
} from "../../types";
import { evaluateMultiFactorSynthesis } from "../../engine/deduction-engine";

interface Props {
  puzzle: MultiFactorSynthesisPuzzle;
  initialSelectedFactorIds?: string[];
  onSelectedFactorsChange: (selectedIds: string[]) => void;
  onPuzzleSolved?: (result: PuzzleValidationResult) => void;
}

export function MultiFactorSynthesisPuzzleView({
  puzzle,
  initialSelectedFactorIds = [],
  onSelectedFactorsChange,
  onPuzzleSolved,
}: Props) {
  const [selectedFactorIds, setSelectedFactorIds] = useState<string[]>(
    initialSelectedFactorIds
  );
  const [validationResult, setValidationResult] = useState<PuzzleValidationResult | null>(null);

  const handleToggleFactor = (factorId: string) => {
    setSelectedFactorIds((prev) => {
      const updated = prev.includes(factorId)
        ? prev.filter((id) => id !== factorId)
        : [...prev, factorId];
      onSelectedFactorsChange(updated);
      return updated;
    });
    setValidationResult(null);
  };

  const handleVerify = () => {
    const result = evaluateMultiFactorSynthesis(puzzle, selectedFactorIds);
    setValidationResult(result);
    if (result.isSolved && onPuzzleSolved) {
      onPuzzleSolved(result);
    }
  };

  const isSolved = validationResult?.isSolved;

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#122b24] via-[#0f2420] to-[#0a1815] border-2 border-emerald-500/70 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🧬</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
            {puzzle.title} · {puzzle.subtitle}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-amber-200 leading-snug">
          "{puzzle.coreQuestion}"
        </h3>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {puzzle.instruction}
        </p>
      </div>

      {/* Factor Selection Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
              ✓
            </span>
            <span>CHỌN CÁC NHÂN TỐ CÓ MỐI LIÊN HỆ BỆNH HỌC (ĐÃ CHỌN {selectedFactorIds.length})</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-semibold">
            Tối thiểu {puzzle.minRequiredFactors} yếu tố cấu thành
          </span>
        </div>

        <div className="space-y-2.5">
          {puzzle.factors.map((factor) => {
            const isSelected = selectedFactorIds.includes(factor.id);
            return (
              <div
                key={factor.id}
                onClick={() => handleToggleFactor(factor.id)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 select-none ${
                  isSelected
                    ? "bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-400/40"
                    : "bg-white border-[#e2d9c2] hover:bg-[#faf8f4] hover:border-slate-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-500 text-white font-bold"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <span className="text-sm">✓</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                      Dữ liệu kiểm chứng
                    </span>
                  </div>

                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {factor.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {factor.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button & Diagnostics Feedback */}
      <div className="pt-3 border-t border-[#e2d9c2] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleVerify}
            disabled={selectedFactorIds.length === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 ${
              selectedFactorIds.length > 0
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:brightness-110 active:scale-98"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span className="text-base">⚖️</span>
            <span>XÁC LẬP TỔ HỢP NGUY CƠ</span>
          </button>

          {isSolved && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span>✅</span>
              <span>TỔNG HỢP KHOA HỌC CHÍNH XÁC</span>
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
                  Kết Luận Hội Tụ Sinh Lý:
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
