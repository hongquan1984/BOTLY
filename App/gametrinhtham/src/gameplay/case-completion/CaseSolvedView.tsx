"use client";

import React from "react";
import type { CaseResolution, DetectiveCase } from "../../types";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  caseData: DetectiveCase;
  stars: number;
  accuracyScore: number;
  expAwarded: number;
  coinsAwarded?: number;
  walletCoins?: number;
  nextCaseId?: string | null;
  onNextCase?: (nextId: string) => void;
  onBackToLibrary: () => void;
  onReturnToWorld?: () => void;
}

export function CaseSolvedView({
  caseData,
  stars,
  accuracyScore,
  expAwarded,
  coinsAwarded = 0,
  walletCoins,
  nextCaseId,
  onNextCase,
  onBackToLibrary,
  onReturnToWorld,
}: Props) {
  const { resolution, victimOrPatient } = caseData;

  return (
    <div className="detective-solved-card relative overflow-hidden w-full max-w-4xl mx-auto rounded-2xl border-4 border-[#5a3b24] bg-[#f4ebd4] shadow-[0_18px_45px_rgba(0,0,0,0.75)] p-4 sm:p-6 text-[#2b1c10] select-none space-y-4">
      {/* Celebratory Shimmering Gold Coins Cascade Overlay */}
      <div className="absolute inset-x-0 top-0 h-28 pointer-events-none overflow-hidden z-20" aria-hidden="true">
        {[10, 26, 42, 58, 74, 88].map((leftPct, i) => (
          <span
            key={leftPct}
            style={{ left: `${leftPct}%`, animationDelay: `${i * 0.11}s` }}
            className="absolute top-0 text-base sm:text-lg animate-coin-fall opacity-0 drop-shadow"
          >
            {i % 2 === 0 ? "🪙" : "✨"}
          </span>
        ))}
      </div>
      {/* Compact Victory Header */}
      <div className="detective-solved-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#d4c094]">
        <div className="flex items-center gap-3">
          <div className="detective-solved-trophy w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-amber-200 flex items-center justify-center text-3xl shadow-md shrink-0">
            🏆
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#16664a] bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
              HỒ SƠ ĐÃ PHÁ GIẢI HOÀN TOÀN
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#231509] mt-1 leading-tight">
              {caseData.title}
            </h1>
            <p className="text-[11px] font-bold text-[#694926]">
              Vụ án số #{caseData.chapterOrder} · {caseData.region}
            </p>
          </div>
        </div>

        {/* Stars & Accuracy Seal */}
        <div className="flex flex-col sm:items-end gap-1 bg-[#fdf8ea] px-3.5 py-2 rounded-xl border border-[#cfb88a]">
          <div className="text-2xl tracking-wider flex items-center gap-0.5" aria-label={`${stars} trên 3 sao`}>
            {[1, 2, 3].map((slot) => (
              <span
                key={slot}
                className={slot <= stars ? "text-amber-500" : "text-slate-300"}
              >
                {slot <= stars ? "⭐" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#4e341b]">
            Đánh giá: <strong className="text-[#16664a]">{stars}/3 sao</strong> · {accuracyScore}%
          </span>
        </div>
      </div>

      {/* Rewards + Instant Action Strip */}
      <div className="detective-solved-reward-strip p-3.5 rounded-2xl bg-gradient-to-r from-[#134234] to-[#0d2e26] border border-[#b58b47] text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="text-2xl p-2 rounded-xl bg-white/10 border border-amber-300/40 shrink-0">
            {resolution.badgeReward?.icon || "🎖️"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                {expAwarded > 0
                  ? `PHẦN THƯỞNG PHÁ ÁN · +${expAwarded} EXP ✨`
                  : "CHƠI LẠI ÔN TẬP · ĐÃ NHẬN EXP"}
              </span>
              <span
                data-testid="solved-coins-awarded"
                className="text-[11px] font-black bg-amber-400/20 border border-amber-300/60 text-amber-200 px-2 py-0.2 rounded-full"
              >
                {coinsAwarded > 0
                  ? `🪙 +${coinsAwarded} Xu Thám Tử`
                  : "🪙 Đã nhận đủ Xu vụ này"}
              </span>
            </div>
            <div className="font-black text-sm text-white">
              {resolution.badgeReward?.title || "Huy hiệu Thám Tử"}
            </div>
            <p className="text-[11px] text-emerald-200">
              {resolution.badgeReward?.description || "Ghi nhận thành tích phá án."}
              {typeof walletCoins === "number" && (
                <span className="ml-1.5 text-amber-300/95 font-bold">
                  (Ví hiện có: {walletCoins} Xu · Dành mua đồ Ngôi Nhà)
                </span>
              )}
            </p>
          </div>
        </div>

        {nextCaseId && onNextCase && (
          <button
            onClick={() => {
              detectiveAudio.playFolderOpen();
              onNextCase(nextCaseId);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black text-xs border border-amber-100 shadow-lg hover:brightness-110 transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>MỞ KHÓA VỤ ÁN TIẾP THEO</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Scientific Conclusion & Mechanism */}
      <div className="space-y-2.5">
        <div className="p-3.5 rounded-xl bg-[#fffcf4] border border-[#cfb88a] shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#8f4c14] mb-1">
            <span>🔬</span>
            <span>KẾT LUẬN Y KHOA CHÍNH XÁC</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#231509] leading-relaxed">
            {resolution.primaryConclusion}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#efe4c9] border border-[#cfb88a] text-xs leading-relaxed text-[#47311a]">
          <span className="font-black text-[#2b1c10] block mb-0.5">Cơ chế bệnh học & Dòng thời gian:</span>
          <p>{resolution.scientificExplanation}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#dbe7df] border border-[#9cb6a4] flex items-start gap-2.5">
          <div className="text-xl p-1 rounded-lg bg-white/80 border border-[#9cb6a4] shrink-0">
            {victimOrPatient.avatar || "👤"}
          </div>
          <div className="text-xs text-[#1d3127]">
            <span className="font-black block mb-0.5">
              Lời cảm ơn từ {victimOrPatient.name}:
            </span>
            <p className="italic leading-relaxed">{resolution.patientFeedback}</p>
          </div>
        </div>
      </div>

      {/* Medical Pearls */}
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#61411d] mb-2">
          BÀI HỌC SỨC KHỎE VÀNG (MEDICAL PEARLS)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {resolution.medicalPearls.map((pearl, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#fffcf4] border border-[#cfb88a] shadow-2xs flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-black text-[#231509] mb-1">{pearl.title}</h4>
                <p className="text-[11px] text-[#4e341b] leading-snug">{pearl.takeaway}</p>
              </div>
              <div className="mt-2 pt-1.5 border-t border-[#e8d9b7] text-[10px] text-[#16664a] font-bold truncate">
                {pearl.evidenceSource} {pearl.pmid ? `(PMID: ${pearl.pmid})` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Archive Return */}
      <div className="pt-2 border-t border-[#d4c094] flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <button
          onClick={onBackToLibrary}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#b58b47] bg-[#fffcf4] font-black text-xs text-[#3b2511] hover:bg-[#efe4c9] transition shadow-xs"
        >
          📂 Danh sách hồ sơ vụ án
        </button>

        {onReturnToWorld && (
          <button
            onClick={onReturnToWorld}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#16664a] bg-[#dbe7df] text-[#144734] font-black text-xs hover:brightness-95 transition"
          >
            Về Vương Quốc HealthClues
          </button>
        )}
      </div>
    </div>
  );
}
