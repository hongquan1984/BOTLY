"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Lock, Gift, ChevronRight, RotateCcw, Check } from "lucide-react";

export type MysteryGiftData = {
  type: "level" | "day7" | "custom";
  title: string;
  kicker: string;
  requirementText: string;
  isUnlocked: boolean;
  rewardIcon: string;
  rewardImage?: string;
  itemId?: string;
  roomTag?: string;
  rewardTitle: string;
  rewardBadge: string;
  rewardDescription: string;
  bonusExp?: number;
};

type Props = {
  gift: MysteryGiftData;
  locale?: "vi" | "en";
  petName?: string;
  onClose: () => void;
  onClaim?: () => void;
  onOpenHome?: (itemId?: string) => void;
};

// Particle helper for burst effect
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  emoji?: string;
}

const SPARKLE_EMOJIS = ["✨", "⭐", "🎉", "🌟", "✨", "💫"];
const PARTICLE_COLORS = ["#facc15", "#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fef08a"];

export function MysteryGiftModal({
  gift,
  locale = "vi",
  petName = "Lumi",
  onClose,
  onClaim,
  onOpenHome,
}: Props) {
  const [stage, setStage] = useState<"idle" | "opening" | "revealed">("idle");
  const [particles, setParticles] = useState<Particle[]>([]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "opening") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, stage]);

  const triggerOpen = () => {
    if (stage === "opening") return;
    setStage("opening");

    // Generate radial confetti particles
    const newParticles: Particle[] = Array.from({ length: 28 }).map((_, i) => {
      const angle = (i / 28) * 2 * Math.PI + (Math.random() * 0.2 - 0.1);
      const distance = 80 + Math.random() * 140;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        size: 8 + Math.floor(Math.random() * 10),
        delay: Math.random() * 0.2,
        emoji: i % 4 === 0 ? SPARKLE_EMOJIS[(i / 4) % SPARKLE_EMOJIS.length] : undefined,
      };
    });
    setParticles(newParticles);

    // After animation sequence completes, reveal the gift
    const timer = setTimeout(() => {
      setStage("revealed");
    }, 1400);

    return () => clearTimeout(timer);
  };

  const handleClaim = async () => {
    if (gift.itemId) {
      try {
        await fetch("/api/healthclues/wellness-home", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "claim_daily_reward", itemId: gift.itemId }),
        });
      } catch (err) {
        console.error("Failed to unlock home gift", err);
      }
    }
    if (onClaim) onClaim();
    onClose();
  };

  const isVi = locale === "vi";

  return (
    <div
      className="hc-mystery-modal-backdrop"
      style={{ pointerEvents: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hc-mystery-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== "opening") {
          onClose();
        }
      }}
    >
      <div
        className={`hc-mystery-modal-card ${stage === "revealed" ? "is-revealed" : ""}`}
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner glows */}
        <div className="hc-mystery-corner-glow top-left" />
        <div className="hc-mystery-corner-glow top-right" />

        {/* Modal Header */}
        <div className="hc-mystery-modal-header">
          <div className="flex items-center gap-2">
            <span className="hc-mystery-header-icon">
              <Gift size={18} className="text-amber-300 animate-pulse" />
            </span>
            <div>
              <span className="hc-mystery-header-kicker">{gift.kicker}</span>
              <h2 id="hc-mystery-modal-title" className="hc-mystery-header-title">
                {stage === "revealed"
                  ? (isVi ? "✨ Quà Bí Ẩn Đã Mở Khóa!" : "✨ Surprise Gift Revealed!")
                  : gift.title}
              </h2>
            </div>
          </div>
          {stage !== "opening" && (
            <button
              type="button"
              className="hc-mystery-close-btn"
              style={{ pointerEvents: "auto" }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={isVi ? "Đóng hộp quà" : "Close"}
              title={isVi ? "Đóng" : "Close"}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Center Visual Stage */}
        <div className="hc-mystery-stage">
          {/* Radiant Sunburst background during opening and revealed */}
          {(stage === "opening" || stage === "revealed") && (
            <div className="hc-mystery-sunburst-wrap" aria-hidden="true">
              <div className="hc-mystery-sunburst" />
            </div>
          )}

          {/* Particle Burst during opening */}
          {stage === "opening" && (
            <div className="hc-mystery-particles-layer" aria-hidden="true">
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="hc-mystery-particle"
                  style={{
                    "--tx": `${p.x}px`,
                    "--ty": `${p.y}px`,
                    "--color": p.color,
                    "--size": `${p.size}px`,
                    animationDelay: `${p.delay}s`,
                  } as React.CSSProperties}
                >
                  {p.emoji || ""}
                </span>
              ))}
            </div>
          )}

          {/* PHASE 1 & 2: Mystery Gift Box (Idle or Opening) */}
          {stage !== "revealed" && (
            <div
              className={`hc-mystery-box-container ${stage === "opening" ? "is-opening" : "is-idle"}`}
              onClick={triggerOpen}
              role="button"
              tabIndex={0}
              title={isVi ? "Bấm vào để mở quà!" : "Click to open!"}
            >
              {/* Pulsing Aura */}
              <div className="hc-mystery-box-aura" />

              {/* The Mystery Box Assembly */}
              <div className="hc-mystery-box-graphic">
                {/* Floating Lid */}
                <div className={`hc-mystery-lid ${stage === "opening" ? "lid-popped" : ""}`}>
                  <div className="hc-mystery-ribbon-bow">
                    <span className="hc-bow-loop-left" />
                    <span className="hc-bow-knot" />
                    <span className="hc-bow-loop-right" />
                  </div>
                  <div className="hc-lid-cap" />
                </div>

                {/* Box Body */}
                <div className="hc-mystery-box-body">
                  <div className="hc-mystery-ribbon-v" />
                  <div className="hc-mystery-ribbon-h" />
                  <div className="hc-mystery-lock-badge">
                    <span className="hc-mystery-qmark">?</span>
                  </div>
                </div>

                {/* Light Beam Erupting from Inside */}
                {stage === "opening" && <div className="hc-mystery-light-beam" />}
              </div>

              {/* Orbiting Sparkles */}
              <span className="hc-mystery-sparkle-dot dot-1">✨</span>
              <span className="hc-mystery-sparkle-dot dot-2">⭐</span>
              <span className="hc-mystery-sparkle-dot dot-3">✨</span>
            </div>
          )}

          {/* PHASE 3: Revealed Reward Item */}
          {stage === "revealed" && (
            <div className="hc-mystery-revealed-container">
              {/* Glowing Aura Ring */}
              <div className="hc-revealed-halo" />

              {/* Floating Gift Icon or Realistic Furniture Graphic */}
              <div className="hc-revealed-icon-card">
                {gift.rewardImage ? (
                  <div className="relative mx-auto flex h-36 w-full items-center justify-center p-2">
                    <img
                      src={gift.rewardImage}
                      alt={gift.rewardTitle}
                      className="max-h-32 max-w-full object-contain filter drop-shadow(0 15px 25px rgba(0,0,0,0.55))"
                    />
                  </div>
                ) : (
                  <span className="hc-revealed-emoji">{gift.rewardIcon}</span>
                )}
                <span className="hc-revealed-badge-pill">{gift.rewardBadge}</span>
                {gift.roomTag && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                    🏡 {gift.roomTag}
                  </span>
                )}
              </div>

              {/* Gift Item Title & Lore */}
              <div className="hc-revealed-details">
                <h3 className="hc-revealed-title">{gift.rewardTitle}</h3>
                <p className="hc-revealed-lore">{gift.rewardDescription}</p>

                {/* Bonus perks */}
                <div className="hc-revealed-perks">
                  {gift.bonusExp && (
                    <div className="hc-perk-chip exp">
                      <Sparkles size={14} className="text-amber-300" />
                      <span>+{gift.bonusExp} EXP {isVi ? "Thưởng" : "Bonus"}</span>
                    </div>
                  )}
                  <div className="hc-perk-chip unlock">
                    <Check size={14} className="text-emerald-300" />
                    <span>{isVi ? "Đã chuyển vào Nhà Của Tôi 🏡" : "Sent to My Chalet 🏡"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer & Actions */}
        <div className="hc-mystery-modal-footer">
          {stage === "idle" && (
            <div className="w-full flex flex-col items-center gap-3">
              {/* Status info */}
              <div className="hc-mystery-status-bar">
                {gift.isUnlocked ? (
                  <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                    <Sparkles size={15} className="animate-spin text-amber-300" />
                    <span>{isVi ? "Đã đủ điều kiện! Sẵn sàng mở quà bất ngờ." : "Milestone reached! Ready to open."}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-200/90 text-xs">
                    <Lock size={13} className="text-amber-400 shrink-0" />
                    <span>{gift.requirementText}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2.5 w-full">
                {gift.isUnlocked ? (
                  <button
                    type="button"
                    className="hc-mystery-primary-btn is-pulse"
                    onClick={triggerOpen}
                  >
                    <span>🎁 {isVi ? "Mở Hộp Quà Bí Ẩn Ngay!" : "Open Mystery Gift Now!"}</span>
                    <Sparkles size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="hc-mystery-primary-btn is-preview"
                      onClick={triggerOpen}
                      title={isVi ? "Xem trước hiệu ứng mở quà bất ngờ" : "Preview unboxing animation"}
                    >
                      <Sparkles size={16} className="text-amber-300" />
                      <span>{isVi ? "✨ Khám Phá Quà Tặng" : "✨ Preview Gift Reward"}</span>
                    </button>
                    <button
                      type="button"
                      className="hc-mystery-secondary-btn"
                      style={{ pointerEvents: "auto" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                    >
                      <span>{isVi ? "Đã hiểu" : "Got it"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {stage === "opening" && (
            <div className="hc-mystery-opening-text">
              <span className="hc-mystery-opening-pulse">
                ✨ {isVi ? "Đang mở hộp quà bí ẩn..." : "Opening mystery gift box..."} ✨
              </span>
            </div>
          )}

          {stage === "revealed" && (
            <div className="w-full flex flex-col items-center gap-2">
              <button
                type="button"
                className="hc-mystery-claim-btn"
                onClick={handleClaim}
              >
                <span>🌟 {isVi ? "Nhận Quà & Khám Phá Tiếp" : "Claim Gift & Continue"} 🌟</span>
                <ChevronRight size={17} />
              </button>

              {onOpenHome && (
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-[#163329] px-5 py-2 text-xs font-black text-amber-200 shadow-md hover:bg-[#1d4235] hover:scale-105 active:scale-95 transition"
                  onClick={() => {
                    handleClaim();
                    onOpenHome(gift.itemId);
                  }}
                >
                  <span>🏡 {isVi ? "Vào Căn Nhà Trang Trí Ngay" : "View in Your Chalet Now"}</span>
                  <ChevronRight size={14} />
                </button>
              )}

              <button
                type="button"
                className="hc-mystery-replay-btn"
                onClick={() => setStage("idle")}
                title={isVi ? "Xem lại hiệu ứng mở quà" : "Replay unboxing"}
              >
                <RotateCcw size={13} />
                <span>{isVi ? "Mở lại hiệu ứng 🔄" : "Replay animation"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
