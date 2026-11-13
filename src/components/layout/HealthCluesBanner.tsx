"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Gamepad2, ArrowRight, X } from "lucide-react";

export function HealthCluesBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check session storage on client mount
    try {
      const isDismissed = sessionStorage.getItem("botly_hc_banner_dismissed");
      if (isDismissed === "true") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Do not render banner inside the game (/play, /wellness/healthclues/*),
  // on HealthClues landing page, or on admin dashboard
  if (
    dismissed ||
    !pathname ||
    pathname.includes("healthclue") ||
    pathname.startsWith("/play") ||
    pathname.startsWith("/detective") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const isEn = pathname.startsWith("/en");

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("botly_hc_banner_dismissed", "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <aside
      role="region"
      aria-label={isEn ? "HealthClues Announcement" : "Thông báo Game HealthClues"}
      className="relative z-40 w-full border-b border-emerald-500/25 bg-gradient-to-r from-[#061813] via-[#0c2a20] to-[#071914] text-slate-100 shadow-md shadow-emerald-950/20"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-2.5">
        {/* Left: Mascot & Highlighted message */}
        <Link
          href="/healthclues"
          className="group flex flex-1 items-center gap-2.5 sm:gap-3 overflow-hidden text-left"
        >
          {/* Glowing pill / Mascot preview */}
          <div className="relative flex shrink-0 items-center justify-center">
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
            <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#0a1e17] border border-emerald-400/50 shadow-inner">
              <span className="text-base sm:text-lg leading-none select-none">🦊</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-bold tracking-wide text-emerald-300 border border-emerald-500/30 uppercase">
              <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
              {isEn ? "NEW RPG" : "GAME MỚI"}
            </span>

            <p className="truncate text-xs sm:text-sm text-slate-200 group-hover:text-white transition">
              <span className="font-bold text-amber-300">HealthClues</span>
              <span className="hidden md:inline">
                {" "}— {isEn
                  ? "The 1st Alpine Wellness RPG Adventure! Solve body mysteries with Lumi & Luna."
                  : "Game Nhập Vai Sức Khỏe & Dưỡng Sinh Đầu Tiên! Cùng Bé Cáo Lumi giải mã bí mật thể trạng."}
              </span>
              <span className="md:hidden">
                {" "}— {isEn ? "Wellness RPG Adventure" : "Game Nhập Vai Sức Khỏe Đầu Tiên"}
              </span>
            </p>
          </div>
        </Link>

        {/* Right: CTA & Dismiss */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/healthclues"
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-slate-950 shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.03] hover:shadow-amber-400/30 active:scale-95"
          >
            <span>{isEn ? "Explore" : "Khám phá ngay"}</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isEn ? "Dismiss announcement" : "Đóng thông báo"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-90"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
