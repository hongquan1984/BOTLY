"use client";

import React, { useMemo, useState } from "react";
import type { CaseClue, MedicalHandbookEntry } from "../../types";
import { getUnlockedMedicalHandbookEntries } from "../../engine/deduction-engine";
import { EvidenceIllustrationSvg } from "../shared/EvidenceIllustrationSvg";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  foundClues: CaseClue[];
  allCaseClues: CaseClue[];
  medicalHandbook?: MedicalHandbookEntry[];
  foundClueIds?: string[];
  onOpenDeductionBoard: () => void;
  onBackToScene?: () => void;
}

export function ClueNotebookView({
  foundClues,
  allCaseClues,
  medicalHandbook = [],
  foundClueIds,
  onOpenDeductionBoard,
  onBackToScene,
}: Props) {
  const [selectedClueId, setSelectedClueId] = useState<string | null>(
    foundClues[0]?.id ?? null
  );
  const [mobileModalOpen, setMobileModalOpen] = useState<boolean>(false);

  const resolvedFoundIds = useMemo(
    () => foundClueIds ?? foundClues.map((c) => c.id),
    [foundClueIds, foundClues]
  );

  const unlockedHandbook = useMemo(
    () => getUnlockedMedicalHandbookEntries(medicalHandbook, resolvedFoundIds),
    [medicalHandbook, resolvedFoundIds]
  );

  const hasMedicalHandbook = medicalHandbook.length > 0;
  const uncollectedClueCount = Math.max(0, allCaseClues.length - foundClues.length);

  const activeClueIndex = useMemo(() => {
    if (foundClues.length === 0) return -1;
    const idx = foundClues.findIndex((c) => c.id === selectedClueId);
    return idx >= 0 ? idx : 0;
  }, [foundClues, selectedClueId]);

  const activeClue = activeClueIndex >= 0 ? foundClues[activeClueIndex] : null;

  const findMatchingHandbook = (clueId: string): MedicalHandbookEntry | undefined =>
    unlockedHandbook.find((entry) => entry.unlockByClueId === clueId);

  const activeHandbook = activeClue ? findMatchingHandbook(activeClue.id) : undefined;

  const handleSelectClueCard = (clue: CaseClue) => {
    detectiveAudio.playPaperFlip();
    detectiveAudio.playLunaChirp();
    setSelectedClueId(clue.id);

    const isTwinPageVisible =
      typeof window !== "undefined" &&
      window.matchMedia(
        "(min-width: 1024px), ((orientation: landscape) and (max-height: 640px) and (min-width: 540px))"
      ).matches;

    if (!isTwinPageVisible) {
      setMobileModalOpen(true);
    }
  };

  const handleStepClue = (delta: number) => {
    if (foundClues.length === 0) return;
    detectiveAudio.playPaperFlip();
    detectiveAudio.playLunaChirp();
    const nextIdx = (activeClueIndex + delta + foundClues.length) % foundClues.length;
    setSelectedClueId(foundClues[nextIdx].id);
  };

  const renderRightLunaPage = () => {
    if (!activeClue) {
      return (
        <div className="py-12 text-center text-xs font-bold text-[#2f4b3e]">
          Chạm vào một tấm ảnh vật chứng bên trái để Trợ lý Bác sĩ Luna giải thích Y khoa!
        </div>
      );
    }

    return (
      <div className="detective-luna-page-body flex flex-col justify-between lg:h-full gap-2.5 sm:gap-3">
        {/* Top Row: Clue Title Pill + Page Flipper */}
        <div className="detective-luna-topbar flex items-center justify-between gap-2 pb-2 border-b border-[#8fa899]/50">
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-[#1d3127] truncate">
              {activeClue.title}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[#3f5f4f]">
              <span>📍 {activeClue.source.location}</span>
              {activeClue.source.timestamp && (
                <span className="bg-[#f3dc9c] text-[#5e3809] px-1.5 py-0.2 rounded border border-[#c79d4b] font-mono">
                  ⏱️ {activeClue.source.timestamp}
                </span>
              )}
            </div>
          </div>

          {foundClues.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleStepClue(-1)}
                className="w-7 h-7 rounded-lg bg-[#f6ecd6] border border-[#b58b47] text-xs font-black text-[#472c12] hover:bg-[#ebdbb7] shadow-xs"
                aria-label="Món trước"
              >
                ‹
              </button>
              <span className="text-[11px] font-black text-[#263f33] px-1">
                {activeClueIndex + 1}/{foundClues.length}
              </span>
              <button
                type="button"
                onClick={() => handleStepClue(1)}
                className="w-7 h-7 rounded-lg bg-[#f6ecd6] border border-[#b58b47] text-xs font-black text-[#472c12] hover:bg-[#ebdbb7] shadow-xs"
                aria-label="Món sau"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Centerpiece: Cute Fox Detective Doctor Luna Portrait + Observation Note (Stacks cleanly, inline on compact landscape) */}
        <div className="detective-luna-hero flex flex-col items-center gap-2">
          <div className="detective-luna-avatar relative w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-2 border-[#b58b47]/70 shadow-[0_8px_22px_rgba(24,48,38,0.2)] bg-[#dbe7df] shrink-0">
            <img
              src="/gametrinhtham/ui/luna-detective-doctor.jpg"
              alt="Trợ lý Y khoa Luna"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          {/* Concise Observation Note */}
          <div className="detective-luna-fact w-full px-3 py-2 rounded-xl bg-white/80 border border-[#b9cbbd] text-[11px] text-[#283c32] font-semibold">
            <span className="font-black text-[#8f5116] uppercase tracking-wide mr-1">
              📌 Dữ kiện:
            </span>
            {activeClue.shortDescription}
          </div>
        </div>

        {/* Ornate RPG Gold-Bordered Dialogue Box */}
        <div className="space-y-2">
          {activeHandbook ? (
            <div className="detective-luna-medical-card p-3 rounded-xl bg-[#f9f3e3] border-2 border-[#b58b47] shadow-md space-y-2 overflow-y-auto max-h-56">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-black text-[#4a2b0d]">
                  🦊 TRỢ LÝ Y KHOA LUNA — {activeHandbook.topicTitle}
                </span>
                <span className="text-[10px] font-bold text-[#14532d] bg-[#dcfce7] border border-[#86efac] px-2 py-0.5 rounded-full shrink-0">
                  {activeHandbook.categoryLabel}
                </span>
              </div>

              <p className="text-xs text-[#2b1e12] leading-relaxed font-medium">
                “{activeHandbook.generalPrinciple}”
              </p>

              {activeHandbook.keyParameters.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeHandbook.keyParameters.map((param, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] sm:text-[11px] font-black text-[#5c3508] bg-gradient-to-b from-[#fde68a] to-[#f59e0b]/45 border border-[#c79334] px-2 py-0.5 rounded-md shadow-2xs"
                    >
                      ⚡ {param}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#f9f3e3] border border-[#b58b47] text-xs text-[#3e2a17] font-semibold">
              🦊 Mục này chỉ ghi nhận hiện trường, không có quy luật y khoa đặc biệt.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Stitched Brown Leather Field Journal Binding */}
      <div className="detective-notebook-cover relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#5a3b25] via-[#472d1c] to-[#362114] p-2 sm:p-3.5 border-2 border-[#8c6b3d]/80 shadow-[0_18px_45px_rgba(0,0,0,0.75)]">
        {/* Corner Brass Guards */}
        <div className="hidden sm:block absolute top-1 left-1 w-4 h-4 border-t-4 border-l-4 border-[#d6ab56] rounded-tl-xl pointer-events-none" />
        <div className="hidden sm:block absolute top-1 right-1 w-4 h-4 border-t-4 border-r-4 border-[#d6ab56] rounded-tr-xl pointer-events-none" />
        <div className="hidden sm:block absolute bottom-1 left-1 w-4 h-4 border-b-4 border-l-4 border-[#d6ab56] rounded-bl-xl pointer-events-none" />
        <div className="hidden sm:block absolute bottom-1 right-1 w-4 h-4 border-b-4 border-r-4 border-[#d6ab56] rounded-br-xl pointer-events-none" />

        {/* Central Green Bookmark Ribbon (Desktop Twin-Page) */}
        <div className="detective-notebook-spine hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-gradient-to-r from-[#2c1a0e] via-[#1b5e3f] to-[#2c1a0e] z-20 shadow-md pointer-events-none" />

        {foundClues.length === 0 ? (
          <div className="rounded-xl bg-[#f4ecd8] p-8 text-center text-[#3a2614] space-y-2">
            <p className="text-3xl">🔍</p>
            <p className="text-sm font-black">Trang sổ vật chứng đang trống</p>
            {onBackToScene && (
              <button
                type="button"
                onClick={onBackToScene}
                className="px-4 py-2 rounded-xl bg-[#8c4b1e] text-amber-50 text-xs font-black shadow"
              >
                ← Quay lại phòng soi đồ vật
              </button>
            )}
          </div>
        ) : (
          <div className="detective-notebook-grid grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-0 relative z-10">
            {/* LEFT JOURNAL PAGE: Cream Vintage Ruled Paper + Polaroid Evidence Grid */}
            <div className="detective-notebook-left lg:col-span-6 rounded-xl lg:rounded-r-none bg-[#f5ecd7] border border-[#cdb88f] p-3 sm:p-4 text-[#2d1d0f] flex flex-col justify-between gap-2.5 shadow-inner overflow-y-auto max-h-[calc(100dvh-54px)]">
              <div>
                {/* Compact Journal Page Title */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#d6c299]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-[#2b1a0c]">
                      SỔ VẬT CHỨNG
                    </h2>
                    <span className="text-[10px] font-black bg-[#3a2515] text-amber-200 px-2 py-0.5 rounded-full">
                      {foundClues.length}/{allCaseClues.length}
                    </span>
                  </div>

                  {/* Mobile quick jump button */}
                  <button
                    type="button"
                    onClick={onOpenDeductionBoard}
                    className="detective-notebook-mobile-btn lg:hidden px-3 py-1 rounded-lg bg-gradient-to-r from-[#17684b] to-[#1d7a58] text-amber-100 font-black text-[11px] border border-emerald-400/50 shadow whitespace-nowrap"
                  >
                    ĐẾN KẾT LUẬN ⚖️
                  </button>
                </div>

                {/* 2-Column Polaroid Photo Grid */}
                <div className="detective-notebook-polaroids grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-3">
                  {foundClues.map((clue, idx) => {
                    const isSelected = activeClue?.id === clue.id;
                    const tiltClass = idx % 2 === 0 ? "-rotate-[1deg]" : "rotate-[1deg]";

                    return (
                      <button
                        key={clue.id}
                        type="button"
                        data-testid={`clue-card-${clue.id}`}
                        onClick={() => handleSelectClueCard(clue)}
                        className={`detective-polaroid-card relative bg-[#fffcf4] p-1.5 pb-2 rounded-md border text-left transition-all ${tiltClass} ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-[1.02] z-10"
                            : "border-[#d8c6a2] shadow-sm hover:shadow-md hover:scale-[1.01]"
                        }`}
                      >
                        {/* Washi masking tape strip at top center */}
                        <div className="detective-polaroid-tape w-8 h-2 bg-[#e8d5a3]/85 border border-[#cab279]/50 mx-auto -mt-2.5 mb-1 rounded-[1px] shadow-2xs pointer-events-none" />

                        <div className="detective-polaroid-img w-full aspect-[4/3] rounded-xs overflow-hidden bg-slate-900 mb-1.5">
                          <EvidenceIllustrationSvg
                            clueOrCandidateId={clue.id}
                            fallbackIcon={clue.icon}
                          />
                        </div>

                        <div className="px-0.5 space-y-1">
                          <div className="detective-polaroid-title text-[10.5px] font-black text-[#2a1a0d] leading-snug line-clamp-2 min-h-[26px]">
                            {clue.title}
                          </div>
                          {clue.source.timestamp && (
                            <span className="detective-polaroid-time inline-block text-[9px] sm:text-[10px] font-mono font-black text-[#613407] bg-[#fdecc2] border border-[#dfb465] px-1.5 py-0.2 rounded truncate max-w-full">
                              ⏰ {clue.source.timestamp}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Uncollected hint & Unlocked Medical Topics */}
              <div className="space-y-2 pt-1">
                {uncollectedClueCount > 0 && (
                  <div className="detective-notebook-hint-bar px-2.5 py-1.5 rounded-lg bg-[#e8dbb9] border border-dashed border-[#a6854d] text-[11px] font-bold text-[#4a3117] flex items-center justify-between gap-2">
                    <span>🔎 Còn {uncollectedClueCount} vật thể trong phòng chưa soi.</span>
                    {onBackToScene && (
                      <button
                        type="button"
                        onClick={() => {
                          detectiveAudio.playPaperFlip();
                          onBackToScene();
                        }}
                        className="font-black text-[#8c3d0f] underline shrink-0"
                      >
                        Về phòng →
                      </button>
                    )}
                  </div>
                )}

                {hasMedicalHandbook && (
                  <div className="detective-notebook-handbook-list p-2 rounded-xl bg-[#e8dfca] border border-[#cbb78e] space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#4e361b]">
                      🩺 Mục Y khoa đã mở ({unlockedHandbook.length}/{medicalHandbook.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {unlockedHandbook.map((entry) => {
                        const clueMatch = foundClues.find((c) => c.id === entry.unlockByClueId);
                        const isEntrySelected = activeHandbook?.id === entry.id;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            data-testid={`handbook-entry-${entry.id}`}
                            onClick={() => {
                              if (clueMatch) handleSelectClueCard(clueMatch);
                            }}
                            className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                              isEntrySelected
                                ? "bg-[#17684b] text-amber-100 border-[#0f4a35]"
                                : "bg-[#fffcf4] text-[#3a2614] border-[#cbb78e] hover:bg-amber-50"
                            }`}
                          >
                            <span>{entry.icon}</span>
                            <span>{entry.topicTitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT JOURNAL PAGE (Desktop): Pale Sage Parchment + Luna Fox Doctor Dialogue */}
            <aside
              aria-label="Trợ lý Y Khoa Luna"
              className="detective-notebook-right hidden lg:flex lg:col-span-6 rounded-r-xl bg-[#dbe7df] border border-[#9cb6a4] p-4 flex-col justify-between relative shadow-inner overflow-y-auto max-h-[calc(100dvh-54px)]"
            >
              {renderRightLunaPage()}

              {/* Protruding Brass-Emerald Tab CTA Bottom Right */}
              <div className="detective-notebook-right-cta flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    detectiveAudio.playPaperFlip();
                    onOpenDeductionBoard();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#16664a] via-[#1f7d5b] to-[#16664a] text-amber-100 font-black text-xs border-2 border-[#c99e4e] shadow-[0_6px_18px_rgba(0,0,0,0.28)] hover:brightness-110 transition flex items-center gap-1.5"
                >
                  <span>ĐẾN BẢNG KẾT LUẬN</span>
                  <span>⚖️ →</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Mobile Tap Modal: Right Page of Journal featuring Luna Doctor */}
      {mobileModalOpen && activeClue && (
        <div
          className="detective-notebook-tap-modal fixed inset-0 z-50 lg:hidden overflow-y-auto flex flex-col bg-black/80 backdrop-blur-xs p-2.5"
          onClick={() => setMobileModalOpen(false)}
        >
          <div
            className="w-full max-w-md m-auto rounded-2xl bg-[#dbe7df] border-4 border-[#5a3b25] shadow-2xl max-h-[calc(100dvh-20px)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5">
              {renderRightLunaPage()}
            </div>
            <div className="px-3.5 py-2 border-t border-[#9cb6a4] bg-[#cedcd3] shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  detectiveAudio.playUiClick();
                  setMobileModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#3a2515] text-amber-200 border border-[#b58b47] text-xs font-black shadow"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
