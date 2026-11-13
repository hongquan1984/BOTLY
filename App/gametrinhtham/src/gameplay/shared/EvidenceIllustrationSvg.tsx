"use client";

import React from "react";

interface Props {
  clueOrCandidateId: string;
  fallbackIcon?: string;
  className?: string;
}

/**
 * Renders cozy hand-crafted miniature vector artwork inside Polaroid / Evidence Pin cards
 * matching Case 001 & Case 002 objects cleanly at any DPI.
 */
export function EvidenceIllustrationSvg({
  clueOrCandidateId,
  fallbackIcon = "🔍",
  className = "w-full h-full",
}: Props) {
  const key = clueOrCandidateId.toLowerCase();

  // Smartphone 01:24 (Sleep)
  if (key.includes("phone")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="ev-wood-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3c2618" />
            <stop offset="100%" stopColor="#24150d" />
          </linearGradient>
        </defs>
        <rect width="120" height="90" fill="url(#ev-wood-1)" rx="6" />
        <ellipse cx="60" cy="48" rx="34" ry="28" fill="#38bdf8" opacity="0.16" />
        <rect x="40" y="12" width="40" height="66" rx="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
        <rect x="44" y="18" width="32" height="52" rx="3" fill="#0f172a" />
        <rect x="44" y="18" width="32" height="52" rx="3" fill="#38bdf8" opacity="0.18" />
        <text x="60" y="38" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="bold" fontFamily="monospace">
          01:24
        </text>
        <rect x="48" y="45" width="24" height="6" rx="2" fill="#38bdf8" opacity="0.6" />
        <rect x="48" y="54" width="18" height="4" rx="2" fill="#7dd3fc" opacity="0.5" />
        <circle cx="60" cy="74" r="2" fill="#64748b" />
      </svg>
    );
  }

  // Iced Coffee 07:00
  if (key.includes("coffee")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#2e1f14" rx="6" />
        <ellipse cx="60" cy="74" rx="26" ry="7" fill="#160d07" opacity="0.6" />
        {/* Straw */}
        <path d="M51 12 L58 64" stroke="#e2d1a7" strokeWidth="4" strokeLinecap="round" />
        {/* Tall Glass */}
        <path d="M40 26 L46 72 C46 74 74 74 74 72 L80 26 Z" fill="#fef3c7" fillOpacity="0.18" stroke="#d6c5a9" strokeWidth="2" />
        {/* Coffee liquid ~2/3 full */}
        <path d="M43 39 L46 71 C46 73 74 73 74 71 L77 39 Z" fill="#78350f" />
        <path d="M43 39 Q60 43 77 39 Q60 35 43 39 Z" fill="#b45309" />
        {/* Ice cubes */}
        <rect x="49" y="34" width="9" height="9" rx="2" fill="#e0f2fe" opacity="0.65" transform="rotate(-12 53 38)" />
        <rect x="61" y="36" width="9" height="9" rx="2" fill="#e0f2fe" opacity="0.6" transform="rotate(14 65 40)" />
        {/* Receipt sticker */}
        <rect x="74" y="46" width="24" height="14" rx="2" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1" />
        <text x="86" y="56" textAnchor="middle" fill="#854d0e" fontSize="7" fontWeight="bold" fontFamily="monospace">
          07:00
        </text>
      </svg>
    );
  }

  // Diary / Night Notes Schedule
  if (key.includes("schedule") || key.includes("diary") || key.includes("journal")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#281a12" rx="6" />
        {/* Book cover & spread */}
        <rect x="16" y="16" width="88" height="58" rx="4" fill="#5c3a21" />
        <rect x="20" y="18" width="39" height="52" rx="2" fill="#f7eed7" />
        <rect x="61" y="18" width="39" height="52" rx="2" fill="#efe2c4" />
        <line x1="60" y1="18" x2="60" y2="70" stroke="#855836" strokeWidth="2" />
        {/* Ruled lines */}
        <line x1="25" y1="29" x2="54" y2="29" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="25" y1="38" x2="50" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="25" y1="47" x2="53" y2="47" stroke="#b45309" strokeWidth="2" />
        <line x1="66" y1="29" x2="94" y2="29" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="66" y1="38" x2="92" y2="38" stroke="#dc2626" strokeWidth="1.8" />
        {/* Fountain pen */}
        <path d="M52 58 L82 28 L86 32 L56 62 L50 64 Z" fill="#b45309" stroke="#451a03" strokeWidth="1" />
        <circle cx="96" cy="20" r="8" fill="#f59e0b" opacity="0.25" />
      </svg>
    );
  }

  // Laptop 23:35 + Desk Lamp
  if (key.includes("laptop")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#1b222c" rx="6" />
        <circle cx="24" cy="24" r="18" fill="#fbbf24" opacity="0.22" />
        {/* Lamp */}
        <path d="M16 32 L28 22 L34 32 Z" fill="#d97706" />
        <path d="M26 24 L20 68" stroke="#92400e" strokeWidth="3" />
        {/* Laptop */}
        <rect x="40" y="20" width="58" height="38" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        <rect x="44" y="24" width="50" height="30" rx="2" fill="#1e3a5f" />
        <text x="69" y="39" textAnchor="middle" fill="#93c5fd" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
          23:35
        </text>
        <rect x="52" y="44" width="34" height="4" rx="1.5" fill="#38bdf8" opacity="0.7" />
        <polygon points="36,58 102,58 108,68 30,68" fill="#475569" />
      </svg>
    );
  }

  // Open Rainy Balcony Window & Streetlight
  if (key.includes("light") || key.includes("window")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#0f1d30" rx="6" />
        <rect x="26" y="10" width="68" height="70" rx="3" fill="#1e3a5f" stroke="#475569" strokeWidth="3" />
        <line x1="60" y1="10" x2="60" y2="80" stroke="#475569" strokeWidth="2.5" />
        <line x1="26" y1="45" x2="94" y2="45" stroke="#475569" strokeWidth="2" />
        {/* Crescent moon & bright street glow */}
        <circle cx="44" cy="25" r="8" fill="#fde047" />
        <circle cx="47" cy="23" r="6.5" fill="#1e3a5f" />
        <circle cx="77" cy="60" r="14" fill="#fbbf24" opacity="0.28" />
        {/* Tied curtains on outer edges */}
        <path d="M18 8 Q32 35 20 82 L14 82 L14 8 Z" fill="#cbd5e1" opacity="0.85" />
        <path d="M102 8 Q88 35 100 82 L106 82 L106 8 Z" fill="#cbd5e1" opacity="0.85" />
      </svg>
    );
  }

  // Fern Plant
  if (key.includes("plant")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#231914" rx="6" />
        <circle cx="60" cy="40" r="30" fill="#10b981" opacity="0.12" />
        {/* Leaves */}
        <path d="M60 52 Q40 28 32 34 Q42 46 60 52 Z" fill="#15803d" />
        <path d="M60 52 Q52 18 60 16 Q68 20 60 52 Z" fill="#22c55e" />
        <path d="M60 52 Q80 28 88 34 Q78 46 60 52 Z" fill="#16a34a" />
        <path d="M60 52 Q36 44 28 50 Q42 54 60 52 Z" fill="#166534" />
        <path d="M60 52 Q84 44 92 50 Q78 54 60 52 Z" fill="#15803d" />
        {/* Terracotta Pot */}
        <polygon points="44,52 76,52 70,76 50,76" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
        <rect x="42" y="49" width="36" height="6" rx="2" fill="#d97706" />
      </svg>
    );
  }

  // Genetic / Inherent Myth
  if (key.includes("genetic")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#1a162b" rx="6" />
        <path d="M32 20 Q60 45 88 20" stroke="#c084fc" strokeWidth="3.5" fill="none" />
        <path d="M32 70 Q60 45 88 70" stroke="#38bdf8" strokeWidth="3.5" fill="none" />
        <path d="M32 45 Q60 20 88 45" stroke="#a855f7" strokeWidth="2.5" fill="none" opacity="0.6" />
        <circle cx="44" cy="31" r="3.5" fill="#f472b6" />
        <circle cx="76" cy="59" r="3.5" fill="#38bdf8" />
        <circle cx="60" cy="45" r="4" fill="#fde047" />
      </svg>
    );
  }

  // Gout Case: Allopurinol Pill Bottle
  if (key.includes("meds")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#231814" rx="6" />
        <rect x="43" y="24" width="34" height="50" rx="5" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="40" y="16" width="40" height="10" rx="2" fill="#e2e8f0" />
        <rect x="45" y="34" width="30" height="26" rx="2" fill="#fefce8" />
        <text x="60" y="46" textAnchor="middle" fill="#991b1b" fontSize="6.5" fontWeight="bold">
          300mg
        </text>
        <text x="60" y="55" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">
          14d STOP
        </text>
      </svg>
    );
  }

  // Gout Case: Lab Results 9.8 mg/dL
  if (key.includes("lab")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#17202b" rx="6" />
        <rect x="26" y="12" width="68" height="66" rx="3" fill="#f8fafc" />
        <rect x="46" y="8" width="28" height="8" rx="2" fill="#94a3b8" />
        <text x="60" y="31" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">
          LAB RESULTS
        </text>
        <ellipse cx="60" cy="51" rx="24" ry="12" fill="none" stroke="#ef4444" strokeWidth="2.5" />
        <text x="60" y="54" textAnchor="middle" fill="#b91c1c" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
          9.8 mg/dL
        </text>
      </svg>
    );
  }

  // Gout Case: 500ml Water Flask
  if (key.includes("water")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#15232e" rx="6" />
        <rect x="46" y="12" width="28" height="9" rx="2" fill="#64748b" />
        <rect x="42" y="22" width="36" height="54" rx="6" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
        <rect x="45" y="34" width="30" height="39" rx="3" fill="#38bdf8" opacity="0.55" />
        <text x="60" y="56" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
          500ml
        </text>
      </svg>
    );
  }

  // Gout Case: Seafood & Beer Receipt
  if (key.includes("bill")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#291d16" rx="6" />
        <path d="M24 14 L64 14 L64 74 L58 70 L52 74 L46 70 L40 74 L34 70 L28 74 L24 70 Z" fill="#fef9c3" />
        <text x="44" y="29" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="bold">
          SEAFOOD
        </text>
        <text x="44" y="41" textAnchor="middle" fill="#991b1b" fontSize="7" fontWeight="bold">
          4 BEER
        </text>
        <text x="44" y="54" textAnchor="middle" fill="#334155" fontSize="7" fontFamily="monospace">
          21:15
        </text>
        {/* Beer Mug */}
        <rect x="70" y="34" width="24" height="32" rx="3" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
        <path d="M68 34 Q82 24 96 34 Z" fill="#ffffff" />
      </svg>
    );
  }

  // Gout Case: EXIF Steak Photo
  if (key.includes("photo")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#1e2430" rx="6" />
        <circle cx="60" cy="46" r="26" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <ellipse cx="60" cy="46" rx="16" ry="11" fill="#7f1d1d" />
        <line x1="50" y1="42" x2="68" y2="50" stroke="#450a0a" strokeWidth="2" />
        <rect x="66" y="14" width="44" height="15" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
        <text x="88" y="24" textAnchor="middle" fill="#fde047" fontSize="7" fontWeight="bold" fontFamily="monospace">
          EXIF 3w
        </text>
      </svg>
    );
  }

  // Gout Case: Bookshelf & Posture
  if (key.includes("shelf")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#231914" rx="6" />
        <rect x="20" y="58" width="80" height="7" rx="2" fill="#78350f" />
        <rect x="28" y="24" width="12" height="34" rx="1.5" fill="#1d4ed8" />
        <rect x="42" y="20" width="13" height="38" rx="1.5" fill="#047857" />
        <rect x="57" y="27" width="11" height="31" rx="1.5" fill="#b45309" />
        <rect x="74" y="34" width="22" height="22" rx="2" fill="#fef3c7" transform="rotate(6 85 45)" />
      </svg>
    );
  }

  // Migraine Case 003: Stress Clipboard / Glare / Glasses / Mug
  if (key.includes("stress") || key.includes("clipboard")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#2a1c12" rx="6" />
        <rect x="30" y="14" width="60" height="66" rx="4" fill="#92400e" />
        <rect x="45" y="10" width="30" height="8" rx="2" fill="#94a3b8" />
        <rect x="36" y="20" width="48" height="54" rx="2" fill="#fef9c3" />
        <text x="60" y="35" textAnchor="middle" fill="#991b1b" fontSize="8" fontWeight="bold" fontFamily="monospace">
          12h x 5d
        </text>
        <line x1="42" y1="45" x2="78" y2="45" stroke="#dc2626" strokeWidth="2.5" />
        <line x1="42" y1="54" x2="72" y2="54" stroke="#64748b" strokeWidth="2" />
        <line x1="42" y1="63" x2="68" y2="63" stroke="#64748b" strokeWidth="2" />
      </svg>
    );
  }

  if (key.includes("glare") || key.includes("fasting") || key.includes("glasses")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#17202b" rx="6" />
        <rect x="24" y="16" width="72" height="46" rx="4" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2.5" />
        <circle cx="60" cy="39" r="14" fill="#fef08a" opacity="0.85" />
        <text x="60" y="43" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="monospace">
          100%
        </text>
        <polygon points="18,66 102,66 108,76 12,76" fill="#475569" />
      </svg>
    );
  }

  if (key.includes("mug") || key.includes("tea") || key.includes("boba") || key.includes("tray") || key.includes("donut")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#2d1f18" rx="6" />
        <rect x="20" y="64" width="80" height="8" rx="3" fill="#78350f" />
        <rect x="30" y="24" width="28" height="40" rx="4" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5" />
        <circle cx="38" cy="56" r="3" fill="#292524" />
        <circle cx="46" cy="58" r="3" fill="#292524" />
        <circle cx="51" cy="54" r="2.5" fill="#292524" />
        <line x1="44" y1="12" x2="44" y2="52" stroke="#f8fafc" strokeWidth="3" />
        <circle cx="80" cy="48" r="16" fill="#f472b6" stroke="#fbcfe8" strokeWidth="2" />
        <circle cx="80" cy="48" r="5.5" fill="#2d1f18" />
      </svg>
    );
  }

  // Case 004: Takeout Box, Soda/Cola, Flat Pillow, Belt, Vitamin C/Water, Cactus
  if (key.includes("takeout") || key.includes("spicy") || key.includes("chicken")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#291712" rx="6" />
        <polygon points="34,36 86,36 80,74 40,74" fill="#dc2626" stroke="#fecaca" strokeWidth="1.5" />
        <polygon points="34,36 48,18 72,18 86,36" fill="#fca5a5" opacity="0.9" />
        <circle cx="52" cy="34" r="6" fill="#ea580c" />
        <circle cx="65" cy="33" r="7" fill="#c2410c" />
        <rect x="66" y="52" width="32" height="16" rx="2" fill="#fefce8" />
        <text x="82" y="63" textAnchor="middle" fill="#991b1b" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
          23:10
        </text>
      </svg>
    );
  }

  if (key.includes("soda") || key.includes("cola") || key.includes("energy")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#181224" rx="6" />
        <rect x="44" y="16" width="32" height="58" rx="6" fill={key.includes("energy") ? "#312e81" : "#1e293b"} stroke={key.includes("energy") ? "#facc15" : "#ef4444"} strokeWidth="2.5" />
        <ellipse cx="60" cy="18" rx="14" ry="3" fill="#cbd5e1" />
        <path d="M62 28 L53 45 L61 45 L57 62 L69 42 L61 42 Z" fill={key.includes("energy") ? "#facc15" : "#f87171"} />
      </svg>
    );
  }

  if (key.includes("pillow") || key.includes("bed")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#172033" rx="6" />
        <rect x="18" y="48" width="84" height="24" rx="4" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
        <rect x="24" y="39" width="38" height="11" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="80" y="38" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="bold" fontFamily="monospace">
          0° FLAT
        </text>
      </svg>
    );
  }

  if (key.includes("belt")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#241912" rx="6" />
        <ellipse cx="60" cy="46" rx="28" ry="20" fill="none" stroke="#78350f" strokeWidth="10" />
        <ellipse cx="60" cy="46" rx="28" ry="20" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 4" />
        <rect x="66" y="54" width="18" height="14" rx="2" fill="none" stroke="#cbd5e1" strokeWidth="3" />
      </svg>
    );
  }

  // Case 005: Tracker/Sitting, Corkboard/Breakfast, Dehydration 1L Bottle, Headphones
  if (key.includes("tracker") || key.includes("sitting") || key.includes("calendar") || key.includes("overtrain")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#13222b" rx="6" />
        <rect x="40" y="14" width="40" height="62" rx="9" fill="#0f172a" stroke="#34d399" strokeWidth="2.5" />
        <rect x="46" y="24" width="28" height="42" rx="3" fill="#064e3b" />
        <rect x="50" y="42" width="4" height="18" fill="#34d399" />
        <rect x="57" y="34" width="4" height="26" fill="#facc15" />
        <rect x="64" y="30" width="4" height="30" fill="#f87171" />
        <text x="60" y="22" textAnchor="middle" fill="#a7f3d0" fontSize="6" fontWeight="bold" fontFamily="monospace">
          {key.includes("calendar") ? "7/7 RUN" : "5H SIT"}
        </text>
      </svg>
    );
  }

  if (key.includes("board") || key.includes("breakfast")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#3b2615" rx="6" />
        <rect x="18" y="14" width="84" height="62" rx="3" fill="#b4834b" stroke="#6d4720" strokeWidth="2" />
        <rect x="38" y="22" width="44" height="44" rx="2" fill="#fef08a" />
        <circle cx="60" cy="45" r="12" fill="#fde68a" stroke="#78350f" strokeWidth="1.5" />
        <line x1="44" y1="29" x2="76" y2="61" stroke="#dc2626" strokeWidth="3.5" />
        <line x1="76" y1="29" x2="44" y2="61" stroke="#dc2626" strokeWidth="3.5" />
      </svg>
    );
  }

  if (key.includes("headphones") || key.includes("shoes") || key.includes("sneakers") || key.includes("yogamat")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#1b1c2e" rx="6" />
        {key.includes("yogamat") ? (
          <>
            <rect x="22" y="34" width="76" height="24" rx="11" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="2" />
            <ellipse cx="95" cy="46" rx="7" ry="12" fill="#4c1d95" stroke="#ddd6fe" strokeWidth="1.5" />
            <rect x="38" y="33" width="6" height="26" fill="#0f172a" />
            <rect x="74" y="33" width="6" height="26" fill="#0f172a" />
          </>
        ) : (
          <>
            <path d="M30 50 A30 30 0 0 1 90 50" fill="none" stroke="#94a3b8" strokeWidth="6" />
            <rect x="24" y="45" width="14" height="24" rx="6" fill="#38bdf8" />
            <rect x="82" y="45" width="14" height="24" rx="6" fill="#38bdf8" />
          </>
        )}
      </svg>
    );
  }

  if (key.includes("cactus") || key.includes("succulent") || key.includes("diffuser")) {
    return (
      <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
        <rect width="120" height="90" fill="#1e241b" rx="6" />
        <ellipse cx="60" cy="38" rx="12" ry="20" fill="#16a34a" stroke="#86efac" strokeWidth="1.5" />
        <polygon points="44,54 76,54 70,76 50,76" fill="#c2410c" />
      </svg>
    );
  }

  // Fallback Cute Icon Frame
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <rect width="120" height="90" fill="#16222f" rx="6" />
      <circle cx="60" cy="45" r="24" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
      <text x="60" y="54" textAnchor="middle" fontSize="26">
        {fallbackIcon}
      </text>
    </svg>
  );
}
