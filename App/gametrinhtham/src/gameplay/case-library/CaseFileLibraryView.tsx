"use client";

import React, { useState } from "react";
import type {
  DetectiveCase,
  DetectiveChapter,
  PlayerDetectiveProgress,
} from "../../types";
import { buildChapterCampaignView } from "../../engine/case-engine/campaign-engine";
import { getDifficultyInfo } from "../../engine/difficulty-engine";
import { calculateDetectiveRank } from "../../engine/progression-engine";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  chapters: DetectiveChapter[];
  allCases: DetectiveCase[];
  playerProgressList: PlayerDetectiveProgress[];
  playerName?: string;
  totalCoins?: number;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onSelectCase: (caseId: string) => void;
  onOpenAdmin?: () => void;
}

function getCaseThumbnailSrc(caseData: DetectiveCase): string {
  if (caseData.scenes?.[0]?.backgroundUrl) return caseData.scenes[0].backgroundUrl;
  if (caseData.id.includes("sleep")) return "/gametrinhtham/scenes/scene-an-bedroom.png";
  if (caseData.id.includes("gout")) return "/gametrinhtham/scenes/scene-minh-livingroom.png";
  return "/gametrinhtham/ui/case-03-office-desk.jpg";
}

export function CaseFileLibraryView({
  chapters,
  allCases,
  playerProgressList,
  playerName = "Quân",
  totalCoins,
  soundEnabled = true,
  onToggleSound,
  onSelectCase,
  onOpenAdmin,
}: Props) {
  const [lockedShakeId, setLockedShakeId] = useState<string | null>(null);
  // Default to the first chapter that still has an available/in-progress case
  const initialChapterId = (() => {
    for (const ch of chapters) {
      const chView = buildChapterCampaignView(
        ch,
        allCases.filter((c) => c.chapterId === ch.id),
        playerProgressList
      );
      if (chView.nextAvailableCaseId) return ch.id;
    }
    return chapters[0]?.id || "chapter-01";
  })();

  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId);

  const activeChapter = chapters.find((ch) => ch.id === selectedChapterId) || chapters[0];
  const casesInChapter = allCases.filter((c) => c.chapterId === activeChapter?.id);

  const campaignView = activeChapter
    ? buildChapterCampaignView(activeChapter, casesInChapter, playerProgressList)
    : null;

  // Determine next playable case globally so "TIẾP TỤC ĐIỀU TRA" works seamlessly across chapters
  const globalNextAvailableCaseId = (() => {
    for (const ch of chapters) {
      const chView = buildChapterCampaignView(
        ch,
        allCases.filter((c) => c.chapterId === ch.id),
        playerProgressList
      );
      if (chView.nextAvailableCaseId) return chView.nextAvailableCaseId;
    }
    return campaignView?.nextAvailableCaseId || null;
  })();

  const totalSolvedAll = playerProgressList.filter((p) => p.status === "solved").length;
  const totalExpAll = playerProgressList.reduce((acc, p) => acc + (p.expAwarded || 0), 0);
  const walletTotalCoins =
    typeof totalCoins === "number"
      ? totalCoins
      : playerProgressList.reduce((acc, p) => acc + (p.coinsAwarded || 0), 0);
  const currentRank = calculateDetectiveRank(totalSolvedAll);
  const expProgressPct = Math.min(100, Math.max(15, (totalSolvedAll / Math.max(1, allCases.length)) * 100));

  return (
    <div className="detective-library w-full max-w-6xl mx-auto px-1 sm:px-3 py-1 sm:py-3 text-slate-100 select-none space-y-4">
      {/* Ornate Bronze Detective Studio Top HUD */}
      <header className="detective-lib-header rounded-2xl border-2 border-[#8c6b3d]/80 bg-gradient-to-r from-[#241b15]/95 via-[#181c22]/95 to-[#241b15]/95 px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-[0_8px_28px_rgba(0,0,0,0.65)] backdrop-blur-md">
        <div className="detective-lib-header-row flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Fox Emblem Crest + Rank + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="detective-lib-avatar w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400/80 overflow-hidden bg-[#dbe7df] shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.35)]">
              <img
                src="/gametrinhtham/ui/luna-detective-doctor.jpg"
                alt="Luna"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="detective-lib-title text-base sm:text-xl font-black text-amber-100 tracking-tight truncate">
                  Hồ Sơ Vụ Án Thám Tử
                </h1>
                <span className="text-[10px] sm:text-[11px] font-black text-amber-200 bg-[#3a2a1d] border border-[#9e7742]/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {currentRank.badge} {currentRank.title}
                </span>
              </div>

              {/* Golden Game EXP & Xu Wallet Strip */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-amber-300/90">
                  ⭐ EXP: {totalExpAll}
                </span>
                <div className="w-24 sm:w-32 h-2 rounded-full bg-black/50 border border-[#785c37]/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500"
                    style={{ width: `${expProgressPct}%` }}
                  />
                </div>
                <span
                  data-testid="library-wallet-coins"
                  title="Thù lao tích lũy (có thể dùng trang trí Ngôi Nhà sau này)"
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-200 bg-gradient-to-b from-[#4a3217] to-[#2e1e0c] border border-amber-400/60 px-2.5 py-0.5 rounded-full shadow-xs"
                >
                  <span>🪙</span>
                  <span>{walletTotalCoins} Xu</span>
                </span>
                <span className="text-[10px] text-slate-300 hidden md:inline">
                  Thám tử <strong className="text-amber-200">{playerName}</strong> · {totalSolvedAll}/{allCases.length} vụ
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary Investigate CTA & Admin */}
          <div className="flex items-center gap-2 shrink-0">
            {globalNextAvailableCaseId && (
              <button
                onClick={() => onSelectCase(globalNextAvailableCaseId)}
                className="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-slate-950 font-black text-xs border border-amber-200 shadow-[0_4px_15px_rgba(245,158,11,0.35)] hover:brightness-110 transition active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>TIẾP TỤC ĐIỀU TRA</span>
                <span>🔎</span>
              </button>
            )}
            {onToggleSound && (
              <button
                type="button"
                data-testid="library-sound-btn"
                onClick={onToggleSound}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  soundEnabled
                    ? "bg-[#312419] hover:bg-[#413021] border-amber-400/55 text-amber-200"
                    : "bg-slate-900/90 hover:bg-slate-800 border-slate-600 text-slate-400"
                }`}
              >
                <span>{soundEnabled ? "🔊" : "🔇"}</span>
                <span className="hidden sm:inline">{soundEnabled ? "Nhạc & Âm" : "Đang tắt âm"}</span>
              </button>
            )}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3 py-2 rounded-xl bg-[#2a211b] hover:bg-[#382b23] border border-[#8c6b3d]/55 text-amber-200/90 text-xs font-bold transition whitespace-nowrap"
              >
                Quản trị
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pinned Chapter Parchment Ribbon */}
      {activeChapter && campaignView && (
        <div className="detective-lib-chapters flex flex-wrap items-center justify-center gap-2">
          {chapters.map((ch) => {
            const isSelected = ch.id === selectedChapterId;
            const chProgress = buildChapterCampaignView(
              ch,
              allCases.filter((c) => c.chapterId === ch.id),
              playerProgressList
            ).progress;
            return (
              <button
                key={ch.id}
                data-testid={`chapter-tab-${ch.id}`}
                onClick={() => {
                  detectiveAudio.playPaperFlip();
                  setSelectedChapterId(ch.id);
                }}
                className={`detective-lib-chapter-tab relative px-3 sm:px-5 py-2 rounded-xl border-2 shadow-lg transition flex items-center gap-1.5 sm:gap-2 max-w-full ${
                  isSelected
                    ? "bg-[#efe2c4] border-[#8c6b3d] text-[#2c1d11]"
                    : "bg-[#2c2119]/90 border-[#6e5233] text-amber-100/80 hover:bg-[#382a20]"
                }`}
              >
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-600 border border-rose-900 shadow-sm shrink-0" />
                <span className="text-sm sm:text-base shrink-0">{ch.icon}</span>
                <span className="font-black text-[11px] sm:text-sm tracking-tight text-left leading-tight">
                  {ch.title}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    isSelected
                      ? "bg-[#b91c1c] text-amber-50"
                      : "bg-black/40 text-amber-300"
                  }`}
                >
                  {chProgress.solvedCases}/{chProgress.totalCases} vụ
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tactile Case Folders Resting on the Mahogany Detective Desk */}
      {campaignView && (
        <div className="detective-lib-grid grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch pt-1">
          {campaignView.cases.map(({ caseData, status, foundCluesCount, totalCluesCount, stars, canPlay, lockReason }) => {
            const diff = getDifficultyInfo(caseData.difficulty);
            const isLocked = status === "locked";
            const isSolved = status === "solved";
            const isActive = status === "available" || status === "in_progress";
            const thumbSrc = getCaseThumbnailSrc(caseData);

            // Locked Leather Bound Tome
            if (isLocked) {
              const isShaking = lockedShakeId === caseData.id;
              return (
                <article
                  key={caseData.id}
                  onClick={() => {
                    detectiveAudio.playLockedPadlock();
                    setLockedShakeId(caseData.id);
                    window.setTimeout(() => setLockedShakeId(null), 380);
                  }}
                  className={`detective-lib-locked relative rounded-2xl bg-gradient-to-br from-[#2b231e] via-[#211b17] to-[#17120f] border-2 border-[#4d3d32] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.65)] flex flex-col justify-between overflow-hidden min-h-72 cursor-pointer transition ${
                    isShaking ? "animate-detective-shake border-amber-500/70" : ""
                  }`}
                >
                  {/* Decorative leather binder strap & cross twine */}
                  <div className="absolute inset-0 pointer-events-none opacity-45">
                    <svg viewBox="0 0 300 320" className="w-full h-full" preserveAspectRatio="none">
                      <line x1="0" y1="95" x2="300" y2="205" stroke="#a68a64" strokeWidth="4" />
                      <line x1="300" y1="95" x2="0" y2="205" stroke="#8a714f" strokeWidth="4" />
                    </svg>
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-black/40 border border-[#695240] text-amber-200/70">
                      HỒ SƠ #{caseData.chapterOrder.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 bg-black/50 px-2.5 py-0.5 rounded-full border border-slate-600">
                      🔒 ĐANG KHÓA
                    </span>
                  </div>

                  {/* Center Brass Padlock Emblem */}
                  <div className="relative z-10 my-4 flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-600 border-2 border-amber-200 shadow-[0_6px_20px_rgba(0,0,0,0.6)] flex items-center justify-center text-3xl text-slate-950">
                      🔒
                    </div>
                    <h3 className="text-base font-black text-amber-100/90 leading-snug">
                      {caseData.title}
                    </h3>
                    <span className="text-[10px] font-black text-amber-300 bg-black/45 border border-amber-500/35 px-2.5 py-0.5 rounded-full">
                      🪙 Thù lao: +{caseData.resolution.coinReward || 150} Xu
                    </span>
                    <p className="text-[11px] text-amber-200/70 leading-snug max-w-xs">
                      {lockReason || `Mở khi phá xong vụ #${Math.max(1, caseData.chapterOrder - 1)}`}
                    </p>
                  </div>

                  <div className="relative z-10 pt-2">
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl font-black text-xs bg-black/40 text-slate-400 border border-[#4d3d32] cursor-not-allowed"
                    >
                      MỞ KHI PHÁ VỤ #{Math.max(1, caseData.chapterOrder - 1)}
                    </button>
                  </div>
                </article>
              );
            }

            // Solved / Active Manila Folder Card with Pinned Polaroid
            return (
              <article
                key={caseData.id}
                onClick={() => canPlay && onSelectCase(caseData.id)}
                className={`detective-lib-card relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between p-4 pt-3.5 border-2 ${
                  isActive
                    ? "bg-gradient-to-b from-[#f7ebd1] to-[#e9d6ad] border-amber-400 shadow-[0_0_32px_rgba(245,158,11,0.38)] hover:-translate-y-1 text-[#2c1d11]"
                    : "bg-gradient-to-b from-[#efe3c6] to-[#dfd0ab] border-[#b59c72] shadow-[0_12px_28px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 text-[#2e2116]"
                }`}
              >
                {/* Folder File Tab Top-Right */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#3a281a] text-amber-200 whitespace-nowrap shrink-0">
                    HỒ SƠ #{caseData.chapterOrder.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/65 border border-[#c7b28a] text-[#4a3520] whitespace-nowrap truncate">
                    {diff.badge} {diff.name}
                  </span>
                </div>

                {/* Pinned Polaroid Photo Preview + Golden Wax Seal if Solved */}
                <div className="detective-lib-thumb-wrap relative mx-auto w-full max-w-64 mb-3">
                  {/* Sleek Metallic SVG Paperclip */}
                  <svg
                    viewBox="0 0 24 36"
                    className="absolute -top-3 left-4 z-20 w-4 h-6 drop-shadow pointer-events-none"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 10 V24 A5 5 0 0 0 17 24 V8 A3.5 3.5 0 0 0 10 8 V22 A1.8 1.8 0 0 0 13.6 22 V10"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    className={`bg-[#fdfaf2] p-1.5 pb-2 rounded-md shadow-md border border-[#d6c5a3] transition-transform ${
                      isSolved ? "-rotate-1" : "rotate-1"
                    }`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xs bg-slate-900">
                      <img
                        src={thumbSrc}
                        alt={caseData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Golden Wax Seal Badge on Solved Case */}
                  {isSolved && (
                    <div className="absolute -bottom-2 -right-2 z-20 px-2.5 py-1 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 border-2 border-amber-100 shadow-lg text-slate-950 font-black text-[10px] flex items-center gap-1 rotate-[-4deg]">
                      <span>ĐÃ PHÁ</span>
                      <span>
                        {"★".repeat(stars)}
                        {"☆".repeat(Math.max(0, 3 - stars))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Concise Case Title, Narrative Hook & Clue Metric Chip */}
                <div className="space-y-1.5 mb-3">
                  <h3 className="text-base sm:text-lg font-black leading-tight text-[#23170d]">
                    {caseData.title}
                  </h3>
                  {caseData.subtitle && (
                    <p
                      data-testid={`case-subtitle-${caseData.id}`}
                      className="text-[11px] font-medium leading-snug text-[#4a3520]/90 line-clamp-2"
                    >
                      {caseData.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#594128]">
                    <span className="bg-white/60 border border-[#cfb991] px-2 py-0.5 rounded-md">
                      {caseData.victimOrPatient.avatar || "👤"} {caseData.victimOrPatient.name}
                    </span>
                    <span className="bg-white/60 border border-[#cfb991] px-2 py-0.5 rounded-md">
                      🔍 {foundCluesCount}/{totalCluesCount} manh mối
                    </span>
                    <span className="bg-emerald-900/10 text-emerald-900 border border-emerald-700/25 px-2 py-0.5 rounded-md font-black">
                      +{caseData.resolution.expReward} EXP
                    </span>
                    <span className="bg-[#fef3c7] text-[#78350f] border border-[#b45309]/45 px-2 py-0.5 rounded-md font-black shadow-2xs">
                      🪙{" "}
                      {isSolved
                        ? `Đã nhận ${
                            playerProgressList.find((p) => p.caseId === caseData.id)?.coinsAwarded ??
                            caseData.resolution.coinReward ??
                            150
                          } Xu`
                        : `+${caseData.resolution.coinReward || 150} Xu`}
                    </span>
                  </div>
                </div>

                {/* Tactile Game Ribbon / Bronze CTA Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCase(caseData.id);
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md border ${
                    isActive
                      ? "bg-gradient-to-b from-amber-400 via-amber-500 to-orange-600 text-slate-950 border-amber-200 hover:brightness-110 shadow-[0_4px_15px_rgba(245,158,11,0.4)]"
                      : "bg-[#3d2b1d] hover:bg-[#4e3826] text-amber-100 border-[#7a5d3d]"
                  }`}
                >
                  <span>
                    {status === "in_progress"
                      ? "TIẾP TỤC ĐIỀU TRA"
                      : isSolved
                      ? "CHƠI LẠI VỤ ÁN"
                      : "BẮT ĐẦU ĐIỀU TRA"}
                  </span>
                  <span>→</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
