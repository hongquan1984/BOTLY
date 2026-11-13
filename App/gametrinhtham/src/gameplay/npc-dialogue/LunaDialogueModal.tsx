"use client";

import React, { useState } from "react";
import type { DetectiveCase } from "../../types";

interface Props {
  caseData: DetectiveCase;
  playerName?: string;
  onStartInvestigation: () => void;
  onBackToLibrary: () => void;
}

export function LunaDialogueModal({
  caseData,
  playerName = "Quân",
  onStartInvestigation,
  onBackToLibrary,
}: Props) {
  const [showHint, setShowHint] = useState(false);
  const { lunaBriefing, victimOrPatient } = caseData;

  return (
    <div
      data-testid="luna-dialogue-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/80 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        data-testid="luna-dialogue-card"
        className="detective-luna-modal relative w-full max-w-xl m-auto rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#183d36] to-[#0d221e] border-2 border-amber-400 p-4 sm:p-6 text-white shadow-2xl space-y-3 sm:space-y-4"
      >
        {/* Luna & Companion Avatar Header */}
        <div className="detective-luna-modal-header flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="detective-luna-modal-avatar w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#dbe7df] border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]">
                <img
                  src="/gametrinhtham/ui/luna-detective-doctor.jpg"
                  alt="Luna"
                  className="w-full h-full object-cover scale-105"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 text-xs bg-emerald-500 rounded-full p-0.5 border border-white">
                ✨
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  LUNA · BẠN ĐỒNG HÀNH THÁM TỬ
                </span>
                <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-slate-200 font-bold whitespace-nowrap">
                  {caseData.region}
                </span>
              </div>
              <h2 className="detective-luna-modal-title text-lg sm:text-xl font-black text-white mt-0.5 leading-snug">
                Hồ Sơ: {caseData.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToLibrary}
            aria-label="Về thư viện hồ sơ"
            title="Về thư viện hồ sơ"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 transition"
          >
            ✕
          </button>
        </div>

        {/* Luna Narrative Dialogue Speech Box */}
        <div className="detective-luna-dialogue-box relative rounded-2xl bg-white/10 border border-white/15 p-3 sm:p-4 text-xs sm:text-sm text-slate-100 leading-relaxed shadow-inner">
          <p className="font-medium">
            "{lunaBriefing.greeting}{" "}
            <strong className="text-amber-300">{playerName}</strong> ơi! {lunaBriefing.invitation}"
          </p>

          {/* Patient Card Preview */}
          <div className="detective-luna-quote-box mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2.5 sm:gap-3">
            <span className="text-xl sm:text-2xl shrink-0">{victimOrPatient.avatar || "👤"}</span>
            <div className="text-xs">
              <span className="font-bold text-amber-200">{victimOrPatient.name}: </span>
              <span className="italic text-slate-300">"{victimOrPatient.initialQuote}"</span>
            </div>
          </div>
        </div>

        {/* Optional Limited Hint */}
        {showHint ? (
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in">
            <span className="text-base">💡</span>
            <div>
              <strong className="text-amber-300 block mb-0.5">Gợi ý từ Luna:</strong>
              <p>{lunaBriefing.hint}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="text-xs text-amber-300 hover:text-amber-200 underline font-bold flex items-center gap-1.5"
          >
            <span>💡 Cần một chút gợi ý từ Luna?</span>
          </button>
        )}

        {/* Action Choices */}
        <div className="detective-luna-actions flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-1">
          <button
            onClick={onBackToLibrary}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 transition"
          >
            Để sau (Về thư viện)
          </button>

          <button
            onClick={onStartInvestigation}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-xs shadow-xl hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>BẮT ĐẦU ĐIỀU TRA HIỆN TRƯỜNG</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
