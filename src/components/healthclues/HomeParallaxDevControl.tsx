"use client";

import React, { useState } from "react";
import { Eye, EyeOff, RotateCcw, Sliders, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { useHomeParallax } from "./useHomeParallax";

interface HomeParallaxDevControlProps {
  parallax: ReturnType<typeof useHomeParallax>;
  isVi?: boolean;
}

export function HomeParallaxDevControl({ parallax, isVi = true }: HomeParallaxDevControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    enabled,
    setEnabled,
    strength,
    setStrength,
    bgEnabled,
    setBgEnabled,
    decorEnabled,
    setDecorEnabled,
    viewCoords,
    prefersReducedMotion,
    overrideReducedMotion,
    setOverrideReducedMotion,
    resetView,
  } = parallax;

  return (
    <div
      className="fixed bottom-3 right-3 z-[9999] select-none text-xs font-sans"
      data-testid="parallax-dev-control-root"
      data-prevent-parallax
    >
      {/* Minimized Pill Toggle */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-xl backdrop-blur-md transition-all active:scale-95 ${
            enabled
              ? "border-emerald-400/80 bg-emerald-950/90 text-emerald-300 ring-2 ring-emerald-400/30"
              : "border-slate-700/80 bg-black/80 text-slate-300 hover:border-slate-500 hover:text-white"
          }`}
          title="Bảng điều khiển thử nghiệm 2.5D Parallax (Chỉ dành cho Dev/QA)"
          data-testid="parallax-dev-toggle-pill"
        >
          <Sparkles size={13} className={enabled ? "animate-pulse text-emerald-400" : "text-slate-400"} />
          <span className="font-bold">2.5D Parallax</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-black uppercase ${
              enabled ? "bg-emerald-500 text-stone-950" : "bg-slate-800 text-slate-400"
            }`}
          >
            {enabled ? "ON" : "OFF"}
          </span>
          <ChevronUp size={12} className="text-slate-400" />
        </button>
      )}

      {/* Expanded Floating Control Card */}
      {isOpen && (
        <div
          className="w-72 rounded-2xl border border-emerald-500/40 bg-[#0c1815]/95 p-3.5 text-slate-200 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/20 hc-parallax-dev-panel animate-in fade-in zoom-in-95 duration-150"
          data-testid="parallax-dev-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sliders size={14} className="text-emerald-400" />
              <span className="font-black tracking-wide text-white">2.5D Parallax Lab</span>
              <span className="rounded bg-emerald-900/60 border border-emerald-500/30 px-1 py-0.2 text-[9px] font-bold text-emerald-300">
                PROTOTYPE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Thu nhỏ bảng điều khiển"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Reduced Motion Notice */}
          {prefersReducedMotion && (
            <div className="mb-2.5 rounded-lg border border-amber-500/40 bg-amber-950/40 p-2 text-[10px] text-amber-200 leading-tight flex items-center justify-between gap-2">
              <span>⚠️ Hệ điều hành đang bật <em>prefers-reduced-motion</em>.</span>
              <button
                type="button"
                onClick={() => setOverrideReducedMotion(!overrideReducedMotion)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold border transition shrink-0 ${
                  overrideReducedMotion
                    ? "bg-amber-500 text-stone-950 border-amber-400"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                }`}
                data-testid="parallax-toggle-override-motion"
                title="Bỏ qua chế độ giảm chuyển động để kiểm thử"
              >
                {overrideReducedMotion ? "ĐANG BẬT TEST" : "TUÂN THỦ OS"}
              </button>
            </div>
          )}

          {/* Quick Help Tip */}
          <div className="mb-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-2 text-[10px] text-emerald-200 leading-tight">
            👆 <strong>Cách trải nghiệm:</strong> Nhấp giữ chuột trái vào bất kỳ khoảng trống nào trong phòng và kéo qua lại để cảm nhận chiều sâu 2.5D.
          </div>

          {/* Master ON/OFF Switch */}
          <div className="flex items-center justify-between mb-3 rounded-xl bg-black/40 border border-emerald-900/30 p-2">
            <span className="font-bold text-xs text-white">
              {isVi ? "Trạng thái Parallax" : "Parallax State"}
            </span>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black transition ${
                enabled
                  ? "bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
              data-testid="parallax-master-toggle"
            >
              {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{enabled ? (isVi ? "ĐANG BẬT" : "ACTIVE") : (isVi ? "ĐANG TẮT" : "OFF")}</span>
            </button>
          </div>

          {/* Strength Selector */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-slate-300">
              <span>{isVi ? "Cường độ chiều sâu (Strength)" : "Depth Strength"}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "subtle", labelVi: "Dịu Nhẹ", labelEn: "Subtle" },
                  { id: "normal", labelVi: "Chuẩn", labelEn: "Normal" },
                  { id: "strong", labelVi: "Mạnh Mẽ", labelEn: "Strong" },
                ] as const
              ).map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setStrength(lvl.id)}
                  className={`rounded-lg py-1 text-center font-bold text-[11px] transition border ${
                    strength === lvl.id
                      ? "border-emerald-400 bg-emerald-900/60 text-emerald-300 ring-1 ring-emerald-400/40"
                      : "border-slate-800 bg-black/30 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                  data-testid={`parallax-strength-${lvl.id}`}
                >
                  {isVi ? lvl.labelVi : lvl.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Independent Layer Toggles */}
          <div className="mb-3 space-y-1.5 border-t border-emerald-900/20 pt-2.5">
            <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
              <span>{isVi ? "Di chuyển hình nền (Background)" : "Move Background"}</span>
              <input
                type="checkbox"
                checked={bgEnabled}
                onChange={(e) => setBgEnabled(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                data-testid="parallax-toggle-bg"
              />
            </label>
            <label className="flex items-center justify-between text-[11px] text-slate-300 cursor-pointer">
              <span>{isVi ? "Di chuyển đồ nội thất (Decorations)" : "Move Decorations"}</span>
              <input
                type="checkbox"
                checked={decorEnabled}
                onChange={(e) => setDecorEnabled(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                data-testid="parallax-toggle-decor"
              />
            </label>
          </div>

          {/* Live Viewpoint Gauge */}
          <div className="mb-3 rounded-lg bg-black/50 p-2 font-mono text-[10px] text-slate-400 flex items-center justify-between border border-slate-800/80">
            <span>Tọa độ góc nhìn:</span>
            <span className="font-bold text-emerald-400" data-testid="parallax-view-coords">
              X: {viewCoords.x >= 0 ? "+" : ""}{viewCoords.x.toFixed(2)} | Y: {viewCoords.y >= 0 ? "+" : ""}{viewCoords.y.toFixed(2)}
            </span>
          </div>

          {/* Reset Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetView}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition active:scale-95 shadow"
              data-testid="parallax-reset-btn"
            >
              <RotateCcw size={12} />
              <span>{isVi ? "Căn Giữa (Reset)" : "Reset Center"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-800 bg-black/40 px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-black/60 transition"
            >
              {isVi ? "Ẩn" : "Hide"}
            </button>
          </div>

          <p className="mt-2 text-[9px] text-slate-500 leading-tight border-t border-slate-800/50 pt-1.5 text-center">
            💡 Thử nghiệm thị giác 2.5D • Tọa độ nội thất trên Database không bị ảnh hưởng.
          </p>
        </div>
      )}
    </div>
  );
}
