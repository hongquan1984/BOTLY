"use client";

import React, { useState } from "react";
import type {
  CaseClue,
  PuzzleValidationResult,
  TimelineReconstructionPuzzle,
} from "../../types";
import { evaluateTimelineReconstruction } from "../../engine/deduction-engine";

interface Props {
  puzzle: TimelineReconstructionPuzzle;
  collectedClues: CaseClue[];
  initialPlacedSlots?: Record<string, string>; // slotId -> clueId
  onPlacedSlotsChange: (placedSlots: Record<string, string>) => void;
  onPuzzleSolved?: (result: PuzzleValidationResult) => void;
}

export function TimelineReconstructionPuzzleView({
  puzzle,
  collectedClues,
  initialPlacedSlots = {},
  onPlacedSlotsChange,
  onPuzzleSolved,
}: Props) {
  const [placedSlots, setPlacedSlots] = useState<Record<string, string>>(initialPlacedSlots);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<PuzzleValidationResult | null>(null);

  // Available clues for this puzzle (filtered by what player actually found)
  const availableClues = collectedClues.filter((c) =>
    puzzle.availableClueIds.includes(c.id)
  );

  const handleSlotClick = (slotId: string) => {
    if (placedSlots[slotId]) {
      // Clear slot if already occupied
      const updated = { ...placedSlots };
      delete updated[slotId];
      setPlacedSlots(updated);
      onPlacedSlotsChange(updated);
      setValidationResult(null);
    } else {
      setActiveSlotId(slotId === activeSlotId ? null : slotId);
    }
  };

  const handleAssignClueToActiveSlot = (clueId: string) => {
    if (!activeSlotId) return;

    setPlacedSlots((prev) => {
      const updated = { ...prev };
      for (const [sId, cId] of Object.entries(updated)) {
        if (cId === clueId) {
          delete updated[sId];
        }
      }
      updated[activeSlotId] = clueId;
      onPlacedSlotsChange(updated);
      return updated;
    });

    setActiveSlotId(null);
    setValidationResult(null);
  };

  const handleVerify = () => {
    const result = evaluateTimelineReconstruction(puzzle, placedSlots);
    setValidationResult(result);
    if (result.isSolved && onPuzzleSolved) {
      onPuzzleSolved(result);
    }
  };

  const isSolved = validationResult?.isSolved;
  const isFilled = Object.keys(placedSlots).length === puzzle.slots.length;

  return (
    <div className="space-y-6">
      {/* Intro Instruction */}
      <div className="rounded-3xl bg-[#f0ebd9] border-2 border-[#d7cfb7] p-5 text-slate-900 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⏱️</span>
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
            {puzzle.title}
          </h4>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {puzzle.instruction}
        </p>
      </div>

      {/* Chronological Slots (The Case of the Golden Idol Sequence Style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>CÁC MỐC THỜI GIAN THEO TRÌNH TỰ BỆNH HỌC ({puzzle.slots.length})</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            {activeSlotId ? "👉 Chọn một chứng cứ bên dưới để gắn vào ô" : "Chạm vào ô để gán hoặc bỏ chứng cứ"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {puzzle.slots
            .sort((a, b) => a.order - b.order)
            .map((slot) => {
              const placedClueId = placedSlots[slot.id];
              const placedClue = collectedClues.find((c) => c.id === placedClueId);
              const isActive = activeSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  className={`relative p-4 rounded-2xl border-2 transition cursor-pointer ${
                    isActive
                      ? "bg-amber-100/80 border-amber-500 shadow-md ring-2 ring-amber-400/60"
                      : placedClue
                      ? "bg-white border-emerald-400 shadow-sm"
                      : "bg-[#faf8f4] border-dashed border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                      Mốc #{slot.order}: {slot.timeLabel}
                    </span>
                    {placedClue ? (
                      <span className="text-[10px] text-rose-600 font-bold hover:underline">
                        Bỏ gắn ✕
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">
                        {isActive ? "Đang chờ chọn chứng cứ..." : "Trống"}
                      </span>
                    )}
                  </div>

                  {placedClue ? (
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl p-1 rounded-lg bg-emerald-50 border border-emerald-200 shrink-0">
                        {placedClue.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {placedClue.title}
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {placedClue.detailedObservation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">
                      💡 {slot.slotHint}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Available Clues Pool */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
          <span>DANH SÁCH CHỨNG CỨ THỜI GIAN ({availableClues.length})</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableClues.map((clue) => {
            const isAssigned = Object.values(placedSlots).includes(clue.id);
            return (
              <div
                key={clue.id}
                onClick={() => {
                  if (activeSlotId) {
                    handleAssignClueToActiveSlot(clue.id);
                  }
                }}
                className={`p-3 rounded-2xl border-2 transition select-none ${
                  activeSlotId
                    ? "cursor-pointer hover:border-amber-500 hover:bg-amber-50"
                    : "cursor-default"
                } ${
                  isAssigned
                    ? "bg-slate-100 border-slate-300 opacity-60"
                    : "bg-white border-[#e2d9c2] shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl shrink-0">{clue.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {clue.title}
                      </h5>
                      {isAssigned && (
                        <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          Đã xếp
                        </span>
                      )}
                    </div>
                    {clue.source.timestamp && (
                      <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                        ⏱️ {clue.source.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verify Action & Feedback */}
      <div className="pt-3 border-t border-[#e2d9c2] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleVerify}
            disabled={!isFilled}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 ${
              isFilled
                ? "bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white hover:brightness-110 active:scale-98 animate-pulse"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span className="text-base">⏱️</span>
            <span>XÁC THỰC TRÌNH TỰ SỰ KIỆN</span>
          </button>

          {isSolved && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span>✅</span>
              <span>DÒNG THỜI GIAN HOÀN HẢO</span>
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
                  Tái Dựng Chuỗi Sự Kiện Toàn Cảnh:
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
