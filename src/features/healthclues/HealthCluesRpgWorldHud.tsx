"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Mail,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Check,
  Calendar,
  Sparkles,
  Lock,
  Compass,
  BookOpen,
  Backpack,
  Settings,
  ClipboardList,
  User,
  Sprout,
  X,
  Eye,
  EyeOff,
  Target,
  MessageCircle,
  Home,
} from "lucide-react";
import { useHealthCluesLocale } from "@/components/healthclues/HealthCluesLocaleProvider";
import { HealthCluesPet } from "./HealthCluesPet";
import { localizedPlanGoalCopy, type WellnessPlanGoal } from "./wellness-plan";
import { HealthCluesGameIcon, type HealthCluesGameIconName } from "@/components/healthclues/HealthCluesGameIcon";
import { validateAndResolveGoalIcon } from "@/components/healthclues/wellnessIconResolver";
import { MysteryGiftModal, type MysteryGiftData } from "./MysteryGiftModal";
import { ExpFireworksEffect } from "./ExpFireworksEffect";
import type { ActiveTalkPrompt } from "./RegionMapScene";

type Props = {
  xp?: number;
  nickname?: string;
  activePanel?: string | null;
  region?: string;
  wellnessGoals?: WellnessPlanGoal[];
  checkins?: Array<{ id: string; local_date: string; revision: number; note_private?: string | null }>;
  usageHistory?: Array<{ toolkit_entry_id: string; checkin_id?: string; local_date?: string; status: string; occurrence_count: number | null }>;
  timezone?: string;
  onlineCount?: number;
  activeTalk?: ActiveTalkPrompt | null;
  onNavigate: (target: "world" | "care" | "journey" | "camp" | "knowledge" | "settings" | "reminder" | "home", extra?: string) => void;
  onOpenCheckin?: () => void;
  onOpenPlan?: () => void;
  onOpenNickname?: () => void;
  onToggleLocale?: () => void;
};

function formatGoalTitle(goal: WellnessPlanGoal, locale: "en" | "vi" = "vi"): string {
  const copy = localizedPlanGoalCopy(goal, locale);
  if (goal.originalNote && goal.originalNote.trim()) {
    return goal.originalNote.trim();
  }
  if (copy.trackingDefinition && copy.trackingDefinition.trim() && !copy.trackingDefinition.startsWith("Personal note saved") && !copy.trackingDefinition.startsWith("Saved for later") && !copy.trackingDefinition.startsWith("Unconfigured personal goal") && !copy.trackingDefinition.startsWith("Skipped during")) {
    return copy.trackingDefinition.trim();
  }
  if (goal.targetValue !== null && goal.targetValue !== undefined && goal.targetUnit) {
    return `${copy.optionTitle || copy.title} ${goal.targetValue} ${goal.targetUnit}`.trim();
  }
  if (copy.optionTitle && copy.optionTitle !== copy.title) {
    return copy.optionTitle.trim();
  }
  return copy.title.trim().replace(/\.+$/, "");
}

import { getTodayLocalDate, computeConsecutiveStreak, parseGoalStatusesFromNote } from "./daily-care-domain";
export { getTodayLocalDate, computeConsecutiveStreak, parseGoalStatusesFromNote };

export function HealthCluesRpgWorldHud({
  xp = 0,
  nickname = "",
  activePanel = null,
  region = "health-concern",
  wellnessGoals = [],
  checkins = [],
  usageHistory = [],
  timezone = "UTC",
  onlineCount = 1,
  activeTalk = null,
  onNavigate,
  onOpenCheckin,
  onOpenPlan,
  onOpenNickname,
  onToggleLocale,
}: Props) {
  const { locale, setLocale, text } = useHealthCluesLocale();

  const handleToggleLocale = () => {
    if (onToggleLocale) {
      onToggleLocale();
    } else {
      const next = locale === "vi" ? "en" : "vi";
      setLocale(next);
    }
  };

  // 1. Experience & Level calculations based on real server XP
  const safeXp = Math.max(0, xp);
  const level = Math.max(1, Math.floor(safeXp / 50) + 1);
  const currentExp = safeXp;
  const levelBaseExp = (level - 1) * 50;
  const nextLevelExp = level * 50;
  const expInCurrentLevel = currentExp - levelBaseExp;
  const expPercent = Math.min(100, Math.round((expInCurrentLevel / 50) * 100));
  const expRemaining = Math.max(0, nextLevelExp - currentExp);

  // Companion identification
  const isSleep = region === "sleep-better";
  const petName = isSleep ? "Luna" : "Lumi";

  // 2. Real Active Goals from Player's Wellness Plan
  const activeGoals = wellnessGoals.filter(g => g.choice !== "saved" && g.choice !== "skipped");
  const totalGoals = activeGoals.length;
  const displayGoals = activeGoals.slice(0, 3);

  // Check-in state derived strictly from server records (persisted after reload)
  const todayStr = getTodayLocalDate(timezone);
  const todayCheckin = checkins.find(c => c.local_date === todayStr);
  const isTodayCheckedIn = Boolean(todayCheckin);

  // Parse verified goal completion statuses from today's saved checkin note
  const todayGoalStatuses = useMemo(() => {
    if (!todayCheckin) return {};
    return parseGoalStatusesFromNote(todayCheckin.note_private);
  }, [todayCheckin]);

  // Check if a specific goal was actually completed today
  const isGoalDoneToday = (goalId: string): boolean => {
    if (!todayCheckin) return false;
    // 1. Check verified note status
    if (todayGoalStatuses[goalId] !== undefined) {
      return todayGoalStatuses[goalId] === "done";
    }
    // 2. Check usageHistory if toolkit entry maps to this goal
    if (usageHistory && usageHistory.length > 0) {
      const match = usageHistory.find(u => u.checkin_id === todayCheckin.id && u.toolkit_entry_id === goalId);
      if (match) return match.status === "done";
    }
    // 3. Do NOT assume done if not recorded!
    return false;
  };

  // Completed count is the number of active goals actually marked "done"
  const completedCount = useMemo(() => {
    if (!todayCheckin || activeGoals.length === 0) return 0;
    return activeGoals.filter(g => isGoalDoneToday(g.goalId)).length;
  }, [todayCheckin, activeGoals, todayGoalStatuses, usageHistory]);

  const handleGoalAction = () => {
    if (onOpenCheckin) {
      onOpenCheckin();
    } else {
      onNavigate("care");
    }
  };

  // 3. Real 7-Day Timeline Check-in Calculation (consecutive streak ending today/yesterday)
  const streak = computeConsecutiveStreak(checkins, timezone);
  const dayNodes = [1, 2, 3, 4, 5, 6, 7].map(day => {
    if (day <= streak) {
      return { day, status: "done" as const };
    } else if (day === streak + 1) {
      return { day, status: "today" as const };
    } else {
      return { day, status: "locked" as const };
    }
  });

  // UI Visibility States
  // Default celebration toast is strictly FALSE for new/reloaded accounts; only shows when user completes a task in this session
  const [celebrationToast, setCelebrationToast] = useState(false);
  const [showCareCard, setShowCareCard] = useState(true);
  const [show7DayCard, setShow7DayCard] = useState(true);
  const [showLumiDialogue, setShowLumiDialogue] = useState(true);
  const [allPanelsVisible, setAllPanelsVisible] = useState(true);
  const [mysteryGiftModal, setMysteryGiftModal] = useState<MysteryGiftData | null>(null);

  // Experience Fireworks Celebration State
  const [expFireworksActive, setExpFireworksActive] = useState(false);
  const [expGainedAmount, setExpGainedAmount] = useState(10);

  const triggerExpFireworks = useCallback((amount = 10) => {
    setExpGainedAmount(amount);
    setExpFireworksActive(false);
    window.requestAnimationFrame(() => {
      setExpFireworksActive(true);
    });
  }, []);

  const prevXpRef = useRef(xp);
  useEffect(() => {
    if (xp > prevXpRef.current && prevXpRef.current >= 0) {
      triggerExpFireworks(xp - prevXpRef.current);
    }
    prevXpRef.current = xp;
  }, [xp, triggerExpFireworks]);

  useEffect(() => {
    const handleFireworks = (e: Event) => {
      const custom = e as CustomEvent<{ xpGained?: number }>;
      triggerExpFireworks(custom.detail?.xpGained || 10);
    };
    window.addEventListener("healthclues:exp-fireworks", handleFireworks);
    if (typeof window !== "undefined") {
      (window as unknown as { __triggerHealthCluesExpFireworks?: (amount?: number) => void }).__triggerHealthCluesExpFireworks = triggerExpFireworks;
    }
    return () => {
      window.removeEventListener("healthclues:exp-fireworks", handleFireworks);
    };
  }, [triggerExpFireworks]);

  const getChaletLevelGift = (targetLevel: number) => {
    const isVi = locale === "vi";
    switch (targetLevel) {
      case 2:
        return {
          itemId: "table_coffee",
          rewardIcon: "🪵",
          rewardImage: "/healthclues/assets/home/items/table_coffee.png",
          rewardTitle: isVi ? "Bàn Trà Gỗ Sồi Thụy Sĩ" : "Alpine Oak Coffee Table",
          roomTag: isVi ? "Nội Thất Phòng Khách" : "Living Room Furniture",
          rewardBadge: isVi ? "BỘ SƯU TẬP ALPS · CẤP 2" : "ALPINE CHALET · LEVEL 2",
          rewardDescription: isVi
            ? "Bàn trà gỗ sồi mộc mạc phong cách Alpine để thưởng thức trà thảo mộc ấm cúng, thư giãn trong Căn Nhà Nghỉ Dưỡng của bạn."
            : "Rustic oak coffee table perfect for enjoying warm herbal teas in your Swiss Alpine Chalet.",
          bonusExp: 40,
        };
      case 3:
        return {
          itemId: "piano_grand",
          rewardIcon: "🎹",
          rewardImage: "/healthclues/assets/home/items/piano_grand.png",
          rewardTitle: isVi ? "Đàn Grand Piano Cổ Điển" : "Classic Grand Piano",
          roomTag: isVi ? "Nội Thất Phòng Khách" : "Living Room Furniture",
          rewardBadge: isVi ? "BẢO VẬT PHÒNG KHÁCH · CẤP 3" : "GRAND PIANO MASTERPIECE · LEVEL 3",
          rewardDescription: isVi
            ? "Đàn dương cầm gỗ bóng bẩy thượng hạng, tấu lên những khúc nhạc tuyết rơi êm dịu, trang hoàng sang trọng cho phòng khách Căn Nhà Dãy Alps của bạn."
            : "Polished concert grand piano playing peaceful winter melodies in your Alps Chalet living room.",
          bonusExp: 50,
        };
      case 4:
        return {
          itemId: "plant_pot_alps",
          rewardIcon: "🪴",
          rewardImage: "/healthclues/assets/home/items/plant_pot_alps.png",
          rewardTitle: isVi ? "Chậu Cây Xanh Alpine" : "Alpine Evergreen Planter",
          roomTag: isVi ? "Nội Thất Phòng Khách" : "Living Room Furniture",
          rewardBadge: isVi ? "CÂY XANH TƯƠI MÁT · CẤP 4" : "AIR PURIFYING EVERGREEN · LEVEL 4",
          rewardDescription: isVi
            ? "Chậu cây thanh lọc không khí tươi mát từ sườn núi tuyết Matterhorn, mang sinh khí thiên nhiên thanh bình vào Căn Nhà của bạn."
            : "Air-purifying evergreen foliage straight from Matterhorn pine trails to refresh your Chalet.",
          bonusExp: 60,
        };
      case 5:
        return {
          itemId: "painting_fireplace",
          rewardIcon: "🖼️",
          rewardImage: "/healthclues/assets/home/items/painting_fireplace.png",
          rewardTitle: isVi ? "Tranh Dãy Alps Uốn Góc Lò Sưởi" : "Matterhorn Chimney Wall Art",
          roomTag: isVi ? "Trang Trí Lò Sưởi" : "Fireplace Art",
          rewardBadge: isVi ? "TRANH NGHỆ THUẬT · CẤP 5" : "MASTERPIECE WALL ART · LEVEL 5",
          rewardDescription: isVi
            ? "Tuyệt tác tranh sơn dầu danh họa Dãy Alps gắn uốn góc hoàn hảo trên trụ lò sưởi đá nguyên khối trong phòng khách của bạn."
            : "Masterpiece Alps oil painting aligned on your stone fireplace mantle.",
          bonusExp: 80,
        };
      case 6:
        return {
          itemId: "luxury_chalet_bed",
          rewardIcon: "🛏️",
          rewardImage: "/healthclues/assets/home/items/luxury_chalet_bed.png",
          rewardTitle: isVi ? "Giường Ngủ Minimalist Gỗ Sồi" : "Minimalist Oak Chalet Bed",
          roomTag: isVi ? "Nội Thất Phòng Ngủ" : "Bedroom Furniture",
          rewardBadge: isVi ? "PHÒNG NGỦ TĨNH DƯỠNG · CẤP 6" : "RESTORATIVE BEDROOM · LEVEL 6",
          rewardDescription: isVi
            ? "Giường ngủ cao cấp đệm công thái học tự nhiên, mang lại giấc ngủ sâu phục hồi năng lượng tại phòng ngủ Căn Nhà Thụy Sĩ của bạn."
            : "Premium ergonomic natural wooden bed for deep restorative sleep in your Chalet bedroom.",
          bonusExp: 100,
        };
      default:
        return {
          itemId: "bedroom_rug",
          rewardIcon: "🧶",
          rewardImage: "/healthclues/assets/home/items/bedroom_rug.png",
          rewardTitle: isVi ? "Thảm Lông Cừu Thụy Sĩ" : "Swiss Fleece Bedroom Rug",
          roomTag: isVi ? "Nội Thất Phòng Ngủ" : "Bedroom Furniture",
          rewardBadge: isVi ? `THẢM LÔNG ẤM ÁP · CẤP ${targetLevel}` : `ALPINE FLEECE RUG · LEVEL ${targetLevel}`,
          rewardDescription: isVi
            ? "Thảm lông mềm mại giữ ấm đôi chân mỗi buổi sáng bước xuống giường tại Căn Nhà Nghỉ Dưỡng của bạn."
            : "Plush insulating fleece rug keeping feet warm in cool mountain mornings in your Chalet.",
          bonusExp: 120,
        };
    }
  };

  const openLevelMysteryGift = () => {
    const targetLevel = level + 1;
    const isUnlocked = currentExp >= nextLevelExp;
    const chaletReward = getChaletLevelGift(targetLevel);
    setMysteryGiftModal({
      type: "level",
      title: locale === "vi" ? `Hộp Quà Bí Ẩn Cấp ${targetLevel} 🎁` : `Level ${targetLevel} Mystery Gift Box 🎁`,
      kicker: locale === "vi" ? `Mục tiêu Cấp ${targetLevel}` : `Level ${targetLevel} Milestone`,
      requirementText: locale === "vi"
        ? `Tiến trình: ${currentExp}/${nextLevelExp} EXP · Còn thiếu ${expRemaining} EXP để mở quà!`
        : `Progress: ${currentExp}/${nextLevelExp} EXP · ${expRemaining} EXP remaining to unlock!`,
      isUnlocked,
      ...chaletReward,
    });
  };

  const openDay7MysteryGift = () => {
    const isUnlocked = streak >= 7;
    const isVi = locale === "vi";
    setMysteryGiftModal({
      type: "day7",
      title: isVi ? "Hộp Quà Bí Ẩn Ngày 7 🎁" : "Day 7 Mystery Gift Box 🎁",
      kicker: isVi ? "Mốc Thưởng 7 Ngày Liên Tiếp" : "7-Day Consecutive Milestone",
      requirementText: isVi
        ? `Chuỗi hiện tại: ${streak}/7 ngày check-in liên tục`
        : `Current streak: ${streak}/7 consecutive days`,
      isUnlocked,
      itemId: "bedside_armchair",
      rewardIcon: "🛋️",
      rewardImage: "/healthclues/assets/home/items/bedside_armchair.png",
      rewardTitle: isVi ? "Ghế Bành Thư Giãn Đọc Sách" : "Chalet Reading Armchair",
      roomTag: isVi ? "Nội Thất Phòng Ngủ" : "Bedroom Furniture",
      rewardBadge: isVi ? "NỘI THẤT ĐẶC QUYỀN · 7 NGÀY" : "CHALET READING NOOK · 7 DAYS",
      rewardDescription: isVi
        ? `Góc đọc sách tĩnh lặng ngắm sao trời bên khung cửa sổ phòng ngủ, phần thưởng trang trí ngôi nhà vinh danh 7 ngày kiên trì sống khỏe của bạn!`
        : `Quiet reading nook beside the bedroom window under starlit skies, honoring your 7-day wellness streak!`,
      bonusExp: 150,
    });
  };

  // When any modal or drawer is open (activePanel !== null), suppress floating elements to prevent text overlap
  const isModalOpen = Boolean(activePanel);

  const toggleAllPanels = () => {
    setAllPanelsVisible((prev) => {
      const next = !prev;
      setShowCareCard(next);
      setShow7DayCard(next);
      setShowLumiDialogue(next);
      return next;
    });
  };

  const levelTitle = locale === "vi"
    ? (level === 1 ? "Cấp 1 · Nhà Khám Phá Sức Khỏe" : level === 2 ? "Cấp 2 · Người Đi Tìm Cân Bằng" : level === 3 ? "Cấp 3 · Nhà Thám Hiểm Sức Khỏe" : `Cấp ${level} · Chiến Binh Kiên Trì`)
    : (level === 1 ? "Level 1 · Wellness Explorer" : level === 2 ? "Level 2 · Balance Seeker" : level === 3 ? "Level 3 · Health Adventurer" : `Level ${level} · Habit Champion`);

  const shortLevelTitle = locale === "vi"
    ? (level === 1 ? "Cấp 1 · Khám Phá" : level === 2 ? "Cấp 2 · Cân Bằng" : level === 3 ? "Cấp 3 · Thám Hiểm" : `Cấp ${level}`)
    : (level === 1 ? "Lv.1 · Explorer" : level === 2 ? "Lv.2 · Seeker" : level === 3 ? "Lv.3 · Adventurer" : `Lv.${level}`);

  return (
    <div className="hc-rpg-hud-layer" data-rpg-hud>
      {/* ========================================================================= */}
      {/* 1. TOP BAR HUD (Logo, Experience Bar, Quick Controls)                     */}
      {/* ========================================================================= */}
      <header className="hc-rpg-topbar">
        {/* Left: Brand Logo */}
        <div className="hc-rpg-brand" onClick={() => onNavigate("world")} role="button" tabIndex={0}>
          <div className="hc-rpg-brand-icon">
            <Sprout size={22} className="text-emerald-300" />
          </div>
          <div className="hc-rpg-brand-text">
            <strong className="hc-rpg-brand-title">HealthClues</strong>
            <span className="hc-rpg-brand-sub">My Wellness World</span>
          </div>
        </div>

        {/* Center: Experience & Level HUD */}
        <div className="hc-rpg-exp-wrapper relative">
          {expFireworksActive && (
            <ExpFireworksEffect
              expGained={expGainedAmount}
              onComplete={() => setExpFireworksActive(false)}
            />
          )}

          <div className={`hc-rpg-exp-capsule ${expFireworksActive ? "is-exp-celebrating" : ""}`}>
            {/* Adventurer Avatar */}
            <div className="hc-rpg-avatar-frame" onClick={onOpenNickname} title={nickname || text("Adventurer")}>
              <div className="grid h-full w-full place-items-center bg-[#173b30] text-amber-200">
                <User size={20} />
              </div>
            </div>

            {/* Level Info & Progress Bar */}
            <div className="hc-rpg-exp-body">
              <div className="hc-rpg-exp-labels">
                <span className="hc-rpg-level-title is-desktop-title">{levelTitle}</span>
                <span className="hc-rpg-level-title is-mobile-title">{shortLevelTitle}</span>
                <button
                  type="button"
                  className="hc-rpg-help-circle ml-1"
                  aria-label="Experience information"
                  title={locale === "vi" ? "Cách nhận kinh nghiệm từ các thói quen hàng ngày" : "How to earn EXP from daily wellness habits"}
                  onClick={() => triggerExpFireworks(10)}
                >
                  <HelpCircle size={13} />
                </button>
              </div>

              <div className="hc-rpg-bar-track">
                <div className="hc-rpg-bar-fill" style={{ width: `${expPercent}%` }} />
                <span className="hc-rpg-bar-num">{currentExp} / {nextLevelExp} EXP</span>
              </div>
            </div>

            {/* Next Level Mystery Gift Box */}
            <div
              className="hc-rpg-next-reward"
              onClick={openLevelMysteryGift}
              role="button"
              tabIndex={0}
              aria-label={locale === "vi" ? `Hộp Quà Bí Ẩn Cấp ${level + 1}` : `Level ${level + 1} Mystery Gift Box`}
              title={locale === "vi" ? "Nhấn để khám phá hộp quà bí ẩn!" : "Click to inspect mystery gift box!"}
            >
              <div className="hc-rpg-mystery-icon">
                <span className="text-xl">🎁</span>
                <span className="hc-rpg-mystery-sparkle">✨</span>
              </div>
              <div className="hc-rpg-reward-text">
                <span className="hc-rpg-reward-kicker">
                  {locale === "vi" ? `Phần thưởng Cấp ${level + 1}` : `Level ${level + 1} Reward`}
                </span>
                <strong className="hc-rpg-reward-name">
                  {locale === "vi" ? "Hộp Quà Bí Ẩn 🎁" : "Mystery Gift Box 🎁"}
                </strong>
                <small className="hc-rpg-reward-desc">
                  {locale === "vi"
                    ? `Đạt Cấp ${level + 1} để mở quà bất ngờ!`
                    : `Reach Level ${level + 1} to unlock surprise gift!`}
                </small>
              </div>
              <ChevronRight size={14} className="text-amber-200/80 shrink-0 ml-1" />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="hc-rpg-top-actions">
          <div
            className="hc-rpg-online-pill"
            title={locale === "vi" ? `${onlineCount} lữ khách đang online trong làng` : `${onlineCount} adventurers online in the village`}
          >
            <span className="hc-online-dot" aria-hidden="true" />
            <span className="hc-online-count-text">
              {onlineCount} <span className="hc-online-word is-mobile-hidden">online</span>
            </span>
          </div>
          <button
            type="button"
            className="hc-rpg-circle-btn has-badge"
            onClick={() => onNavigate("reminder")}
            aria-label={locale === "vi" ? "Lịch nhắc nhở đồng hành" : "Reminder schedule"}
            title={locale === "vi" ? "Cấu hình giờ nhắc nhở" : "Reminder schedule"}
          >
            <Bell size={18} />
            <span className="hc-rpg-badge-dot" />
          </button>
          <button type="button" className="hc-rpg-circle-btn is-mobile-hidden" aria-label="Mail" title={text("Mail")}>
            <Mail size={18} />
          </button>
          <button
            type="button"
            className="hc-rpg-lang-btn"
            onClick={handleToggleLocale}
            aria-label="Change language"
            title={locale === "vi" ? "Chuyển sang tiếng Anh" : "Switch to Vietnamese"}
          >
            <span>{locale.toUpperCase()}</span>
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            className="hc-rpg-circle-btn is-mobile-hidden"
            onClick={onOpenNickname}
            aria-label="Profile"
            title={nickname ? `${text("Profile:")} ${nickname}` : text("Profile")}
          >
            <User size={18} />
          </button>
          <button
            type="button"
            className="hc-rpg-circle-btn is-mobile-hidden"
            onClick={toggleAllPanels}
            aria-label={allPanelsVisible ? (locale === "vi" ? "Ẩn các bảng nổi" : "Hide panels") : (locale === "vi" ? "Hiện các bảng nổi" : "Show panels")}
            title={allPanelsVisible ? (locale === "vi" ? "Ẩn các bảng nổi để ngắm cảnh" : "Hide panels") : (locale === "vi" ? "Hiện lại các bảng nổi" : "Show panels")}
          >
            {allPanelsVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. RIGHT FLOATING CARDS (Daily Care & 7-Day Journey)                       */}
      {/* ========================================================================= */}
      {!isModalOpen && allPanelsVisible && (
        <aside className="hc-rpg-right-panels" aria-label="Adventure tracker">
          {/* Card 1: Nhiệm vụ Sống Khỏe / Nhiệm vụ hôm nay */}
          {showCareCard ? (
            <div className="hc-rpg-card hc-rpg-care-card">
              <div className="hc-rpg-card-header">
                <div className="hc-rpg-card-title-group">
                  <div className="hc-rpg-card-icon-box">
                    <Calendar size={17} className="text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="hc-rpg-card-heading">
                      {locale === "vi" ? "Nhiệm vụ Sống Khỏe" : "Daily Care"}
                    </h3>
                    <p className="hc-rpg-card-sub">
                      {locale === "vi" ? "Mục tiêu hôm nay" : "Today's goals"}
                    </p>
                  </div>
                </div>
                <div className="hc-rpg-card-actions">
                  {totalGoals > 0 && (
                    <span className="hc-rpg-card-count-badge">
                      {completedCount}/{totalGoals} {locale === "vi" ? (isTodayCheckedIn ? "đã hoàn thành" : "hôm nay") : (isTodayCheckedIn ? "done" : "today")}
                    </span>
                  )}
                  <button
                    type="button"
                    className="hc-rpg-card-close-btn"
                    onClick={() => setShowCareCard(false)}
                    aria-label={locale === "vi" ? "Thu gọn Nhiệm vụ Sống Khỏe" : "Collapse Daily Care"}
                    title={locale === "vi" ? "Thu gọn thẻ này" : "Collapse card"}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {totalGoals === 0 ? (
                <div className="py-3 text-center">
                  <p className="text-xs text-[#a6b8ad] leading-relaxed">
                    {locale === "vi" ? "Chưa có mục tiêu trong kế hoạch của bạn." : "No active goals in your plan yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenPlan ? onOpenPlan() : onNavigate("journey")}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#e6cd88]/40 bg-[#14362b] px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-[#1c4839] transition"
                  >
                    <Target size={13} />
                    {locale === "vi" ? "Khám phá kế hoạch sức khỏe" : "Build Wellness Plan"}
                  </button>
                </div>
              ) : (
                <>
                  {totalGoals > 3 && (
                    <p className="hc-rpg-care-subtitle text-[11px] text-[#9fc0b0] mb-2 leading-relaxed font-normal">
                      {locale === "vi"
                        ? `3 mục tiêu đầu trong số ${totalGoals} mục tiêu của Hành trình:`
                        : `First 3 of ${totalGoals} Journey goals:`}
                    </p>
                  )}
                  <div className="hc-rpg-habit-list">
                    {displayGoals.map((goal) => {
                      const isDone = isGoalDoneToday(goal.goalId);
                      const title = formatGoalTitle(goal, locale);
                      const resolved = validateAndResolveGoalIcon(goal);
                      const iconKey = resolved.iconKey;
                      return (
                        <div key={goal.goalId} className={`hc-rpg-habit-row ${isDone ? "is-done" : ""}`}>
                          <div className="hc-rpg-habit-icon-sq is-walk">
                            <HealthCluesGameIcon icon={iconKey} size={17} tone="amber" />
                          </div>
                          <div className="hc-rpg-habit-text">
                            <span className="hc-rpg-habit-title" title={title}>{title}</span>
                          </div>
                          <button
                            type="button"
                            className={`hc-rpg-task-btn ${isDone ? "is-completed" : ""}`}
                            onClick={handleGoalAction}
                            title={locale === "vi" ? (isDone ? "Đã hoàn thành hôm nay · Bấm để xem chi tiết" : "Chưa hoàn thành · Bấm để ghi nhận check-in") : (isDone ? "Completed today · Click to view" : "Not yet completed · Click to check in")}
                          >
                            {isDone ? (
                              <>
                                <Check size={12} className="stroke-[2.5]" />
                                <span>{locale === "vi" ? "Đã xong" : "Done"}</span>
                              </>
                            ) : (
                              <>
                                <span className="hc-rpg-exp-tag">+10 EXP</span>
                                <span>{locale === "vi" ? "Ghi nhận" : "Check in"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {totalGoals > 3 && (
                    <button
                      type="button"
                      onClick={() => onNavigate("journey")}
                      className="mt-2.5 block w-full text-right text-xs font-medium text-amber-200/90 hover:underline"
                    >
                      {locale === "vi" ? `Xem toàn bộ ${totalGoals} mục tiêu trong Hành trình của tôi ›` : `View all ${totalGoals} goals in My Journey ›`}
                    </button>
                  )}
                  {totalGoals <= 3 && (
                    <button
                      type="button"
                      onClick={() => onNavigate("journey")}
                      className="mt-2 block w-full text-right text-[11px] font-medium text-amber-200/80 hover:underline"
                    >
                      {locale === "vi" ? "Xem chi tiết trong Hành trình ›" : "View in My Journey ›"}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="hc-rpg-minimized-pill is-care"
              onClick={() => setShowCareCard(true)}
              title={locale === "vi" ? "Mở rộng Nhiệm vụ Sống Khỏe" : "Expand Daily Care"}
            >
              <Calendar size={14} className="text-emerald-400" />
              <span>{locale === "vi" ? "Nhiệm vụ Sống Khỏe" : "Daily Care"} ({completedCount}/{totalGoals})</span>
            </button>
          )}

          {/* Card 2: Kết quả check-in 7 ngày */}
          {show7DayCard ? (
            <div className="hc-rpg-card hc-rpg-journey-card">
              <div className="hc-rpg-card-header">
                <div className="hc-rpg-card-title-group">
                  <div className="hc-rpg-card-icon-box">
                    <Calendar size={17} className="text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="hc-rpg-card-heading">
                      {locale === "vi" ? "Hành trình 7 ngày" : "7-Day Streak"}
                    </h3>
                    <p className="hc-rpg-card-sub">
                      {locale === "vi" ? "Chuỗi ngày check-in liên tiếp" : "Consecutive daily check-ins"}
                    </p>
                  </div>
                </div>
                <div className="hc-rpg-card-actions">
                  <span className="hc-rpg-card-count-badge" title={locale === "vi" ? "Chuỗi ngày check-in liên tiếp" : "Consecutive streak"}>
                    {streak}/7 {locale === "vi" ? "ngày" : "days"}
                  </span>
                  <button
                    type="button"
                    className="hc-rpg-card-close-btn"
                    onClick={() => setShow7DayCard(false)}
                    aria-label={locale === "vi" ? "Thu gọn Hành trình" : "Collapse 7-Day Journey"}
                    title={locale === "vi" ? "Thu gọn thẻ này" : "Collapse card"}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* 7-Day Node Track */}
              <div className="hc-rpg-7day-track">
                {dayNodes.map(({ day, status }) => {
                  const isDone = status === "done";
                  const isToday = status === "today";
                  return (
                    <div
                      key={day}
                      className={`hc-rpg-7day-node ${isDone ? "is-done" : isToday ? "is-today" : "is-locked"}`}
                    >
                      <div className="hc-rpg-7day-circle">
                        {isDone ? (
                          <Check size={14} className="hc-rpg-check-icon stroke-[3]" />
                        ) : isToday ? (
                          <Sparkles size={14} className="text-amber-200 animate-pulse" />
                        ) : (
                          <Lock size={12} className="text-slate-400" />
                        )}
                      </div>
                      <span className="hc-rpg-7day-label">
                        {isToday ? `☀️N${day}` : `N${day}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day 7 Mystery Gift Box */}
              <div
                className="hc-rpg-day7-box"
                onClick={openDay7MysteryGift}
                role="button"
                tabIndex={0}
                aria-label={locale === "vi" ? "Hộp Quà Bí Ẩn Ngày 7" : "Day 7 Mystery Gift Box"}
                title={locale === "vi" ? "Nhấn để khám phá hộp quà ngày 7!" : "Click to inspect Day 7 gift!"}
              >
                <div className="hc-rpg-day7-icon-box">
                  <span className="text-2xl animate-pulse">🎁</span>
                  <span className="hc-rpg-day7-sparkle">✨</span>
                </div>
                <div className="hc-rpg-day7-text">
                  <span className="hc-rpg-day7-kicker">
                    {locale === "vi" ? "Phần thưởng ngày 7" : "Day 7 Reward"}
                  </span>
                  <strong className="hc-rpg-day7-title">
                    {locale === "vi"
                      ? "Hộp Quà Bí Ẩn Ngày 7 🎁"
                      : "Day 7 Mystery Gift Box 🎁"}
                  </strong>
                  <small className="hc-rpg-day7-desc">
                    {locale === "vi"
                      ? "Hoàn thành 7 ngày để mở quà bất ngờ!"
                      : "Complete 7 days to reveal surprise gift!"}
                  </small>
                </div>
                <ChevronRight size={14} className="text-amber-200/80 shrink-0 ml-1" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="hc-rpg-minimized-pill is-journey"
              onClick={() => setShow7DayCard(true)}
              title={locale === "vi" ? "Mở rộng Hành trình" : "Expand Journey"}
            >
              <Calendar size={14} className="text-amber-400" />
              <span>{locale === "vi" ? "Check-in 7 ngày" : "7-Day Streak"} ({streak}/7)</span>
            </button>
          )}
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 3. CENTER CELEBRATION BURST (+20 EXP Toast)                               */}
      {/* ========================================================================= */}
      {!isModalOpen && celebrationToast && (
        <div
          className="hc-rpg-center-burst"
          onClick={() => setCelebrationToast(false)}
          role="button"
          tabIndex={0}
          title={locale === "vi" ? "Nhấn để đóng thông báo" : "Click to close"}
        >
          <div className="hc-rpg-burst-content">
            <span className="hc-rpg-burst-sparkles">✨</span>
            <span className="hc-rpg-burst-text">+20 EXP</span>
            <span className="hc-rpg-burst-sparkles">✨</span>
            <button
              type="button"
              className="hc-rpg-burst-close"
              onClick={(e) => {
                e.stopPropagation();
                setCelebrationToast(false);
              }}
              aria-label="Close celebration toast"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM-LEFT COMPANION SPEECH BUBBLE (Lumi or Luna)                     */}
      {/* Suppressed when an NPC talk prompt is active or a modal is open          */}
      {/* ========================================================================= */}
      {!isModalOpen && allPanelsVisible && !activeTalk && (
        showLumiDialogue ? (
          <aside className="hc-rpg-lumi-dialogue" aria-label={`${petName} companion advice`}>
            <div
              className="hc-rpg-lumi-avatar-circle"
              onClick={() => setShowLumiDialogue(false)}
              title={locale === "vi" ? `Nhấn để thu gọn lời nhắc của ${petName}` : `Click to collapse ${petName} advice`}
              role="button"
              tabIndex={0}
            >
              {isSleep ? (
                <div className="grid h-full w-full place-items-center rounded-full bg-[#3d335c]">
                  <HealthCluesPet region="sleep-better" topic="" pose="guide" className="scale-75" />
                </div>
              ) : (
                <img
                  src="/healthclues/assets/ui/ref_lumi.png"
                  alt={`${petName} companion`}
                  className="hc-rpg-lumi-head"
                />
              )}
            </div>
            <div className="hc-rpg-lumi-speech-box">
              <div className="hc-rpg-bubble-top-row">
                <span className="hc-rpg-lumi-tag">{petName}</span>
                <button
                  type="button"
                  className="hc-rpg-bubble-close-btn"
                  onClick={() => setShowLumiDialogue(false)}
                  aria-label={locale === "vi" ? `Đóng lời nhắc của ${petName}` : "Close dialogue"}
                  title={locale === "vi" ? "Đóng lời nhắc" : "Close"}
                >
                  <X size={14} />
                </button>
              </div>
              <p className="hc-rpg-lumi-speech-text">
                {currentExp === 0 ? (
                  locale === "vi"
                    ? `Chào mừng bạn đến với ${isSleep ? "Sleep Valley" : "HealthClues Realm"}! Mình là ${petName}. Cùng khám phá các địa điểm và ghi nhận thói quen đầu tiên nhé! ✨`
                    : `Welcome to ${isSleep ? "Sleep Valley" : "HealthClues Realm"}! I'm ${petName}. Explore the map and record your first habit! ✨`
                ) : (
                  locale === "vi"
                    ? `Tiến trình thật của bạn: ${currentExp} EXP. Chúng ta chỉ còn ${expRemaining} EXP nữa để lên Cấp ${level + 1} và nhận phần thưởng mới cùng ${petName} nhé! ✨`
                    : `Your verified progress: ${currentExp} EXP. Only ${expRemaining} EXP left to reach Level ${level + 1} with ${petName}! ✨`
                )}
              </p>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            className="hc-rpg-lumi-reopen-btn"
            onClick={() => setShowLumiDialogue(true)}
            aria-label={locale === "vi" ? `Mở lời nhắc của ${petName}` : `Open ${petName} advice`}
            title={locale === "vi" ? `${petName} có lời nhắn cho bạn!` : `${petName} has advice for you!`}
          >
            {isSleep ? (
              <div className="grid h-full w-full place-items-center rounded-full bg-[#3d335c]">
                <HealthCluesPet region="sleep-better" topic="" pose="guide" className="scale-75" />
              </div>
            ) : (
              <img
                src="/healthclues/assets/ui/ref_lumi.png"
                alt={`${petName} companion`}
                className="hc-rpg-lumi-mini-head"
              />
            )}
            <span className="hc-rpg-lumi-pulse-ring" />
          </button>
        )
      )}

      {/* ========================================================================= */}
      {/* 4.5 NPC INTERACTION PROMPT (Guaranteed safe clearance above bottom dock)   */}
      {/* ========================================================================= */}
      {activeTalk && !isModalOpen && (
        <aside className="hc-rpg-talk" data-game-ui role="status" aria-label={activeTalk.name}>
          <div className="hc-rpg-talk-avatar" aria-hidden="true">
            {activeTalk.npcSrc ? (
              <img src={activeTalk.npcSrc} alt="" className="hc-rpg-talk-avatar-img" />
            ) : (
              <HealthCluesGameIcon icon={(activeTalk.gameIcon as HealthCluesGameIconName) || "compass"} size={18} tone="amber" />
            )}
          </div>
          <div className="hc-rpg-talk-copy">
            <span>
              {activeTalk.npcName
                ? `${text(activeTalk.npcName)} · ${text(activeTalk.name)}`
                : text(activeTalk.name)}
            </span>
            <strong>{text(activeTalk.greeting || activeTalk.subtitle)}</strong>
          </div>
          <div className="hc-rpg-talk-actions">
            <button
              type="button"
              className="hc-rpg-talk-action-btn"
              onClick={activeTalk.onAction}
            >
              {activeTalk.npcSrc ? <MessageCircle size={14} /> : <Compass size={14} />}
              <span>{activeTalk.npcSrc ? (locale === "vi" ? "Trò chuyện" : "Talk") : (locale === "vi" ? "Khám phá" : "Explore")}</span>
            </button>
            <button
              type="button"
              className="hc-rpg-talk-close-btn"
              onClick={activeTalk.onClose}
              aria-label={locale === "vi" ? "Đóng" : "Close"}
              title={locale === "vi" ? "Đóng" : "Close"}
            >
              <X size={13} />
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM NAVIGATION DOCK (3 Primary on Mobile, Full on Desktop)          */}
      {/* ========================================================================= */}
      <nav className="hc-rpg-bottom-dock" aria-label="Game navigation dock">
        {/* 1. Thế Giới / Bản đồ */}
        <button
          type="button"
          className={`hc-rpg-dock-btn ${!activePanel ? "is-active" : ""}`}
          onClick={() => onNavigate("world")}
        >
          <div className="hc-rpg-dock-icon">
            <Compass size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Bản đồ" : "Map"}
          </span>
        </button>

        {/* 2. Hành Trình của Tôi (Primary Mobile & Desktop) */}
        <button
          type="button"
          className={`hc-rpg-dock-btn ${activePanel === "journey" ? "is-active" : ""}`}
          onClick={() => onNavigate("journey")}
        >
          <div className="hc-rpg-dock-icon">
            <BookOpen size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Hành Trình" : "Journey"}
          </span>
        </button>

        {/* 2.5 Nhắc nhở hằng ngày (Web & Mobile Native App Style) */}
        <button
          type="button"
          className={`hc-rpg-dock-btn ${activePanel === "reminder" ? "is-active" : ""}`}
          onClick={() => onNavigate("reminder")}
        >
          <div className="hc-rpg-dock-icon">
            <Bell size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Nhắc nhở" : "Reminders"}
          </span>
        </button>

        {/* 3. Hôm nay / Daily Check-in */}
        <button
          type="button"
          className={`hc-rpg-dock-btn ${activePanel === "checkin" ? "is-active" : ""}`}
          onClick={() => {
            if (onOpenCheckin) onOpenCheckin();
            else onNavigate("care");
          }}
        >
          <div className="hc-rpg-dock-icon">
            <ClipboardList size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Hôm nay" : "Today"}
          </span>
        </button>

        {/* 4. Căn Nhà Nghỉ Dưỡng Thụy Sĩ */}
        <button
          type="button"
          className={`hc-rpg-dock-btn ${activePanel === "home" ? "is-active" : ""}`}
          onClick={() => onNavigate("home")}
          data-testid="hud-dock-home-btn"
          title={locale === "vi" ? "Vào Căn Nhà Nghỉ Dưỡng Thụy Sĩ của bạn" : "Enter your Swiss Alpine Chalet"}
        >
          <div className="hc-rpg-dock-icon">
            <Home size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Nhà Của Tôi" : "Home"}
          </span>
        </button>

        {/* 5. Thám Tử Cơ Thể (Mystery Detective Campaign) */}
        <a
          href="/detective"
          className="hc-rpg-dock-btn"
          title={locale === "vi" ? "Thám Tử Cơ Thể (Mystery Detective)" : "Mystery Detective"}
        >
          <div className="hc-rpg-dock-icon">
            <span style={{ fontSize: "20px" }}>🔎</span>
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Thám Tử" : "Detective"}
          </span>
        </a>

        {/* 6. Kiến Thức */}
        <button
          type="button"
          className={`hc-rpg-dock-btn is-mobile-hidden ${activePanel === "knowledge" ? "is-active" : ""}`}
          onClick={() => onNavigate("knowledge")}
        >
          <div className="hc-rpg-dock-icon">
            <BookOpen size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Kiến Thức" : "Knowledge"}
          </span>
        </button>

        {/* 6. Cài Đặt */}
        <button
          type="button"
          className={`hc-rpg-dock-btn is-mobile-hidden ${activePanel === "settings" ? "is-active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <div className="hc-rpg-dock-icon">
            <Settings size={22} />
          </div>
          <span className="hc-rpg-dock-label">
            {locale === "vi" ? "Cài Đặt" : "Settings"}
          </span>
        </button>
      </nav>

      {/* 6. Mystery Gift Unboxing Modal */}
      {mysteryGiftModal && (
        <MysteryGiftModal
          gift={mysteryGiftModal}
          locale={locale}
          petName={petName}
          onClose={() => setMysteryGiftModal(null)}
          onOpenHome={(itemId) => onNavigate("home", itemId || mysteryGiftModal.itemId)}
          onClaim={() => {
            setCelebrationToast(true);
          }}
        />
      )}
    </div>
  );
}
