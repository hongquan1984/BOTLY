"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { BookOpen, Compass, Leaf, Moon, Mountain, Sun, Wind, Flower2, ZoomIn, ZoomOut } from "lucide-react";
import { HealthCluesGameIcon } from "@/components/healthclues/HealthCluesGameIcon";
import { HEALTHCLUES_REGIONS } from "./region-availability";
import "./world-map-immersive.css";

const regionPresentation = {
  "sleep-better": { x: 150, y: 300, color: "#91c9fa", icon: Moon, gameIcon: "trail:sleep", clue: "Moonlit lakes · quiet village" },
  "feel-calmer": { x: 440, y: 300, color: "#a8df9c", icon: Wind, gameIcon: "trail:calm", clue: "Waterfalls · ancient woodland" },
  "more-energy": { x: 1335, y: 285, color: "#ffd275", icon: Sun, gameIcon: "trail:energy", clue: "Golden trails · sunrise ridge" },
  "eat-healthier": { x: 220, y: 640, color: "#d2ed83", icon: Leaf, gameIcon: "trail:nutrition", clue: "Orchards · gardens · streams" },
  "move-more": { x: 790, y: 170, color: "#c2e6f8", icon: Mountain, gameIcon: "trail:movement", clue: "Snowy passes · stone bridges" },
  "healthy-weight": { x: 795, y: 505, color: "#e4b3e9", icon: Flower2, gameIcon: "trail:weight", clue: "Wildflowers · still water" },
  "natural-wellness": { x: 1270, y: 650, color: "#a8ddb7", icon: Leaf, gameIcon: "trail:natural", clue: "Botanical paths · forest shelters" },
  "health-concern": { x: 1450, y: 785, color: "#f4d39a", icon: Compass, gameIcon: "trail:health", clue: "A welcoming home for your personal wellness journey" },
} as const;
export const WELLNESS_REGIONS = HEALTHCLUES_REGIONS.map(region => ({ ...region, ...regionPresentation[region.id] }));

type RegionId = typeof WELLNESS_REGIONS[number]["id"];

export function WellnessWorldMap({ questId, checkinCount = 0, unlocks = [], previewMode = false, immersive = false, onRegionSelect, onUnavailableRegion }: { questId: string; checkinCount?: number; unlocks?: string[]; previewMode?: boolean; immersive?: boolean; onRegionSelect?: (id: RegionId) => void; onUnavailableRegion?: (name: string, id: RegionId) => void }) {
  const [selected, setSelected] = useState<RegionId>(WELLNESS_REGIONS.some(region => region.id === questId) ? questId as RegionId : "health-concern");
  const [focusedRegion, setFocusedRegion] = useState<RegionId | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const drag = useRef<{ id: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const active = WELLNESS_REGIONS.find(region => region.id === selected) ?? WELLNESS_REGIONS[7];
  const explore = (id: RegionId) => { setSelected(id); onRegionSelect?.(id); };
  const route = "M150 300 C245 225 320 250 440 300 C560 360 660 225 790 170 C930 120 1125 190 1335 285 C1410 390 1240 480 1270 650 C1300 715 1400 745 1450 785 M150 300 C140 440 160 540 220 640 C370 670 560 550 795 505 C1015 455 1110 560 1270 650";

  useEffect(() => {
    if (!immersive || typeof ResizeObserver === "undefined") return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const centerStartingRegion = () => {
      if (window.matchMedia("(min-width: 900px)").matches) { setPan({ x: 0, y: 0 }); return; }
      const rect = viewport.getBoundingClientRect();
      const sceneWidth = Math.max(rect.width, rect.height * (16 / 9));
      const sceneHeight = Math.max(rect.height, rect.width * (9 / 16));
      const region = WELLNESS_REGIONS.find(item => item.id === questId) ?? WELLNESS_REGIONS[7];
      const maxX = Math.max(0, (sceneWidth - rect.width) / 2);
      const maxY = Math.max(0, (sceneHeight - rect.height) / 2);
      const x = -((region.x / 1600) - .5) * sceneWidth;
      const y = -((region.y / 900) - .5) * sceneHeight;
      setPan({ x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) });
    };
    const observer = new ResizeObserver(centerStartingRegion);
    observer.observe(viewport);
    centerStartingRegion();
    return () => observer.disconnect();
  }, [immersive, questId]);

  return <section aria-label="Interactive illustrated world map" data-world-canvas={immersive ? "immersive" : undefined} className={immersive ? "hc-world-immersive relative h-full w-full overflow-hidden bg-[#102720]" : "overflow-hidden rounded-[1.7rem] border border-[#c9b991] bg-[#102720] shadow-[0_24px_60px_#112b2538]"}>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#102c2b] via-[#174238] to-[#283e35] px-4 py-3 text-white sm:px-5">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border border-amber-200/50 bg-[#f3dfa6]/15 text-[#ffe4a3]"><HealthCluesGameIcon icon={active.gameIcon} size={22} tone="inherit"/></span><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">{previewMode ? "World preview · starting trail" : "Your current trail"}</p><h2 className="text-lg font-black leading-tight">{active.name}</h2></div></div>
      <div className="flex items-center gap-2"><span className="rounded-full border border-white/20 bg-black/20 px-3 py-2 text-xs font-bold text-white/90">{previewMode ? "Read-only preview" : `${checkinCount} trail ${checkinCount === 1 ? "mark" : "marks"}`}</span><div className="hidden items-center gap-1 sm:flex" aria-label="Map zoom controls"><button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(1, +(value - .2).toFixed(1)))} className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white"><HealthCluesGameIcon icon="nav:zoom-out" size={16} tone="inherit"/></button><button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(1.6, +(value + .2).toFixed(1)))} className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white"><HealthCluesGameIcon icon="nav:zoom-in" size={16} tone="inherit"/></button></div></div>
    </div>
    <div ref={viewportRef} className={immersive ? "hc-world-viewport absolute inset-0 overflow-hidden bg-[#29483d]" : "w-full overflow-x-auto overscroll-x-contain sm:overflow-hidden"} aria-label={immersive ? "Pan and explore the World map" : "Swipe horizontally to explore the full map on small screens"}>
    <div className={immersive ? "hc-world-scene relative overflow-hidden bg-[#29483d]" : "relative aspect-[16/9] min-w-[620px] overflow-hidden bg-[#29483d] sm:min-w-0"}>
      <svg viewBox="0 0 1600 900" role="group" aria-labelledby="world-map-title world-map-desc" data-world-unlocks={unlocks.join(",")} className="absolute inset-0 h-full w-full touch-pan-y cursor-grab active:cursor-grabbing" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: isDragging || reducedMotion ? "none" : "transform .35s ease", transformOrigin: "50% 50%" }} onPointerDown={event => { if ((event.target as Element).closest?.('[role="button"]')) return; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; setIsDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (!drag.current || drag.current.id !== event.pointerId) return; const viewport = viewportRef.current, scene = viewport?.firstElementChild; const limitX = viewport && scene ? Math.max(0, (scene.clientWidth * zoom - viewport.clientWidth) / 2) : 180 * (zoom - 1) + 40; const limitY = viewport && scene ? Math.max(0, (scene.clientHeight * zoom - viewport.clientHeight) / 2) : 180 * (zoom - 1) + 40; setPan({ x: Math.max(-limitX, Math.min(limitX, drag.current.panX + event.clientX - drag.current.x)), y: Math.max(-limitY, Math.min(limitY, drag.current.panY + event.clientY - drag.current.y)) }); }} onPointerUp={event => { if (drag.current?.id === event.pointerId) drag.current = null; setIsDragging(false); }} onPointerCancel={() => { drag.current = null; setIsDragging(false); }}>
        <title id="world-map-title">{previewMode ? "HealthClues World preview — illustrated adventure map" : "My Wellness World — illustrated adventure map"}</title><desc id="world-map-desc">{previewMode ? "Read-only preview of eight connected regions. The highlighted marker is a suggested starting region, not saved progress. Region exploration does not create or change a World." : "Explore eight connected regions. Select a region marker to preview its trail. The golden traveler marker shows your current location."}</desc>
        <defs>
          <linearGradient id="hc-vignette" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#061b25" stopOpacity=".32"/><stop offset=".45" stopColor="#09251e" stopOpacity="0"/><stop offset="1" stopColor="#081b20" stopOpacity=".35"/></linearGradient>
          <filter id="hc-map-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="13" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="hc-pin-shadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#071713" floodOpacity=".7"/></filter>
          <pattern id="hc-route-dashes" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.2" fill="#fff2bd" opacity=".95"/></pattern>
        </defs>
        <image href="/healthclues/assets/world/healthclues-world-overworld.webp" x="0" y="0" width="1600" height="900" preserveAspectRatio="none"/>
        <rect width="1600" height="900" fill="url(#hc-vignette)"/>
        <path d={route} fill="none" stroke="#362b1b" strokeOpacity=".7" strokeWidth="18" strokeLinecap="round"/>
        <path d={route} fill="none" stroke="#e8c77a" strokeOpacity=".88" strokeWidth="10" strokeLinecap="round"/>
        <path d={route} fill="none" stroke="url(#hc-route-dashes)" strokeWidth="7" strokeLinecap="round"/>
        {unlocks.some(key => key.endsWith("-path-open")) && <g aria-label="Boss path unlocked"><path d="M440 300 C560 360 660 225 790 170" fill="none" stroke="#ffe29a" strokeWidth="14" strokeLinecap="round" opacity=".82"/><path d="M440 300 C560 360 660 225 790 170" fill="none" stroke="#fff6d5" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 20"/><g transform="translate(620 263)" filter="url(#hc-pin-shadow)"><rect x="-76" y="-20" width="152" height="40" rx="19" fill="#173b35" stroke="#ffe29a" strokeWidth="3"/><text x="0" y="6" textAnchor="middle" fill="#fff3c9" fontSize="15" fontWeight="900">✦ PATH OPEN ✦</text></g></g>}
        {unlocks.includes("knowledge-library-open") && <g aria-label="Knowledge Library unlocked" transform="translate(1050 475)" filter="url(#hc-pin-shadow)"><ellipse cx="0" cy="44" rx="71" ry="17" fill="#081b16" opacity=".58"/><path d="M-54 5v30h108V5" fill="#9c7049" stroke="#f2d591" strokeWidth="3"/><path d="M-65 7L0-37 65 7z" fill="#254d42" stroke="#f5dea4" strokeWidth="4"/><path d="M-17 35V13q17-22 34 0v22" fill="#4a3021" stroke="#f5dea4" strokeWidth="3"/><rect x="-44" y="12" width="16" height="13" rx="3" fill="#f8d987"/><rect x="28" y="12" width="16" height="13" rx="3" fill="#f8d987"/><path d="M0-29v14m-7-7h14" stroke="#fff0b7" strokeWidth="3" strokeLinecap="round"/><rect x="-76" y="48" width="152" height="27" rx="13" fill="#102c29" stroke="#ffe29a" strokeWidth="2"/><text x="0" y="66" textAnchor="middle" fill="#fff3c9" fontSize="12" fontWeight="900">KNOWLEDGE LIBRARY</text></g>}
        {WELLNESS_REGIONS.map(region => {
          const isCurrent = region.id === selected;
          const isHome = region.id === questId;
          const unlocked = region.playable;
          const canInspect = region.playable || Boolean(onUnavailableRegion);
          const Icon = region.icon;
          return <g key={region.id} role={canInspect ? "button" : undefined} tabIndex={canInspect ? 0 : undefined} aria-label={`${region.name}: ${region.clue}${region.companion ? ` · Companion ${region.companion}` : ""}${region.playable ? isCurrent ? ", current playable region" : ", playable region" : ", Coming Soon"}`} aria-pressed={region.playable ? isCurrent : undefined} aria-disabled={!region.playable} onFocus={canInspect ? () => setFocusedRegion(region.id) : undefined} onBlur={canInspect ? () => setFocusedRegion(null) : undefined} onClick={region.playable ? () => explore(region.id) : canInspect ? () => onUnavailableRegion?.(region.name, region.id) : undefined} onKeyDown={canInspect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (region.playable) explore(region.id); else onUnavailableRegion?.(region.name, region.id); } } : undefined} className={`${canInspect ? "cursor-pointer" : "cursor-not-allowed"} outline-none`} filter={isCurrent ? "url(#hc-map-glow)" : "url(#hc-pin-shadow)"}>
            {isCurrent && <><circle cx={region.x} cy={region.y} r="59" fill={region.color} opacity=".22"/><circle cx={region.x} cy={region.y} r="43" fill="none" stroke={region.color} strokeOpacity=".72" strokeWidth="3" strokeDasharray="6 7"/></>}
            {focusedRegion === region.id && <circle className="hc-map-focus-ring" cx={region.x} cy={region.y} r={isCurrent ? 40 : 33} fill="none" stroke="#fff" strokeWidth="6" filter="url(#hc-map-glow)" pointerEvents="none"/>}
            <circle className="hc-map-region-hit" cx={region.x} cy={region.y} r={isCurrent ? 30 : 23} fill={unlocked ? "#173b35" : "#23312e"} stroke={isCurrent ? "#fff0ba" : region.color} strokeWidth={isCurrent ? 5 : 3}/>
            <foreignObject x={region.x - 13} y={region.y - 13} width="26" height="26"><div className="grid h-[26px] w-[26px] place-items-center" style={{ color: unlocked ? region.color : "#abb3a4" }}><HealthCluesGameIcon icon={region.gameIcon} size={18} tone="inherit"/></div></foreignObject>
            {isHome && <g><circle cx={region.x} cy={region.y - 47} r="13" fill="#ffdb81" stroke="#fff7d5" strokeWidth="3"/><path d={`M${region.x} ${region.y - 34}l-11 15h22z`} fill="#b47230"/><circle cx={region.x} cy={region.y - 48} r="4" fill="#235943"/></g>}
            <g transform={`translate(${region.x},${region.y + 49})`}><rect x="-97" y={region.playable ? -14 : -20} width="194" height={region.playable ? 30 : 40} rx="15" fill="#102c29" fillOpacity=".91" stroke={isCurrent ? region.color : "#f7e6b8"} strokeOpacity={isCurrent ? ".9" : ".55"} strokeWidth="1.5"/><text x="0" y={region.playable ? 5 : -2} textAnchor="middle" fontSize={region.playable ? 15 : 13} fontWeight="800" fill="#fff8e7" style={{ paintOrder: "stroke", stroke: "#102c29", strokeWidth: 1 }}>{region.name}</text>{!region.playable && <text x="0" y="13" textAnchor="middle" fontSize="9" fontWeight="900" letterSpacing="1.1" fill="#f4d390">{region.id === "sleep-better" ? "🔒 TẠM KHÓA" : "🔒 COMING SOON"}</text>}</g>
          </g>;
        })}
        {unlocks.includes("sleep-valley-lantern-open") && <g aria-label="Sleep Valley Lantern cosmetic unlocked" transform="translate(220 222)" filter="url(#hc-pin-shadow)"><circle r="25" fill="#f7cf72" opacity=".18"/><path d="M-9-13q0-8 9-8t9 8M-12-13h24l-3 31H-9z" fill="#24473e" stroke="#ffe4a1" strokeWidth="3"/><path d="M-7-5h14v13H-7z" fill="#ffd979" stroke="#fff0bd" strokeWidth="2"/><path d="M0-21v-5m-15 11-5-3m35 3 5-3" stroke="#fff0bd" strokeWidth="2" strokeLinecap="round"/></g>}
        {unlocks.includes("calm-forest-chimes-open") && <g aria-label="Calm Forest Wind Chimes cosmetic unlocked" transform="translate(492 228)" filter="url(#hc-pin-shadow)"><path d="M-28-8q28-25 56 0M0-18v13m-15 2v21m15-21v28m15-28v18" fill="none" stroke="#e5d69c" strokeWidth="3" strokeLinecap="round"/><circle cx="-15" cy="17" r="4" fill="#a8df9c"/><circle cy="24" r="4" fill="#c9df9d"/><circle cx="15" cy="14" r="4" fill="#a8df9c"/><path d="M-28-8q9 4 15 0M13-8q8 4 15 0" fill="none" stroke="#94bc82" strokeWidth="2"/></g>}
        {unlocks.includes("nutrition-garden-blossom-open") && <g aria-label="Nutrition Garden Blossom cosmetic unlocked" transform="translate(286 578)" filter="url(#hc-pin-shadow)"><path d="M0 4v34m0-16q-18-15-26-2 14 15 26 7m0-1q18-16 26-3Q12 34 0 27" fill="#5c925d" stroke="#d7edb1" strokeWidth="3" strokeLinejoin="round"/><circle r="8" fill="#f5ca68" stroke="#fff0b9" strokeWidth="2"/><g fill="#f7e8a5" stroke="#fff5d4" strokeWidth="1.5"><ellipse cy="-14" rx="6" ry="10"/><ellipse cy="14" rx="6" ry="10"/><ellipse cx="-14" rx="10" ry="6"/><ellipse cx="14" rx="10" ry="6"/><ellipse cx="-10" cy="-10" rx="6" ry="9" transform="rotate(-45 -10 -10)"/><ellipse cx="10" cy="-10" rx="6" ry="9" transform="rotate(45 10 -10)"/><ellipse cx="-10" cy="10" rx="6" ry="9" transform="rotate(45 -10 10)"/><ellipse cx="10" cy="10" rx="6" ry="9" transform="rotate(-45 10 10)"/></g><circle r="5" fill="#e9a648"/></g>}
        {unlocks.includes("movement-peaks-pennant-open") && <g aria-label="Movement Peaks Pennant cosmetic unlocked" transform="translate(758 108)" filter="url(#hc-pin-shadow)"><path d="M0 30V-34" stroke="#f3e5bb" strokeWidth="4" strokeLinecap="round"/><path d="M2-32h42L27-18 44-4H2z" fill="#e78367" stroke="#fff0c3" strokeWidth="2" strokeLinejoin="round"/><path d="M14-26h16" stroke="#ffe5a5" strokeWidth="3" strokeLinecap="round"/><circle cx="0" cy="31" r="5" fill="#c1a174" stroke="#fff0c3" strokeWidth="2"/></g>}
        <g transform="translate(1510 120)" opacity=".92" filter="url(#hc-pin-shadow)"><circle r="35" fill="#102d29" fillOpacity=".8" stroke="#f1d996" strokeOpacity=".8" strokeWidth="2"/><path d="M0-25l7 25-7-5-7 5zM0 25l-7-25 7 5 7-5z" fill="#ffe8aa"/><text x="0" y="-42" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff0c4">N</text></g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#091d1b]/70 to-transparent"/>
      <div className="absolute bottom-3 left-3 max-w-[75%] rounded-2xl border border-white/25 bg-[#102c29]/90 px-3 py-2 text-white shadow-xl backdrop-blur sm:bottom-5 sm:left-5 sm:px-4 sm:py-3"><p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-200 sm:text-[10px]">Trail preview</p><p className="mt-0.5 text-xs font-bold sm:text-sm">{active.clue}</p></div>
      <div className="absolute bottom-3 right-3 rounded-full border border-white/25 bg-[#102c29]/85 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-100 backdrop-blur sm:bottom-5 sm:right-5">✦ {previewMode ? "Suggested starting region" : checkinCount ? "Trail growing" : "Your journey begins"}</div>
    </div></div>
    {immersive && <div className="hc-world-controls absolute right-3 top-3 z-20 flex gap-2 sm:right-5 sm:top-5" aria-label="Map zoom controls"><button type="button" aria-label="Zoom out" onClick={() => setZoom(value => Math.max(1, +(value - .2).toFixed(1)))} className="grid h-10 w-10 place-items-center rounded-full border border-amber-100/50 bg-[#102c29]/90 text-amber-100 shadow-lg backdrop-blur hover:bg-[#174238]"><ZoomOut className="h-4 w-4"/></button><button type="button" aria-label="Zoom in" onClick={() => setZoom(value => Math.min(1.6, +(value + .2).toFixed(1)))} className="grid h-10 w-10 place-items-center rounded-full border border-amber-100/50 bg-[#102c29]/90 text-amber-100 shadow-lg backdrop-blur hover:bg-[#174238]"><ZoomIn className="h-4 w-4"/></button></div>}
    <div className="border-t border-[#d8c99d]/30 bg-[#102c29] px-3 py-3 text-white sm:px-4"><div className="mb-2 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-200"><Compass className="h-3.5 w-3.5"/> Explore the world</span><span className="hidden text-[10px] font-bold text-white/55 sm:block">ONE CONNECTED WORLD · MANY TRAILS</span></div><nav aria-label="World regions" className="flex gap-2 overflow-x-auto pb-1">{[...WELLNESS_REGIONS].sort((a, b) => (a.playable === b.playable ? 0 : a.playable ? -1 : 1)).map(region => { const Icon = region.icon; return <button type="button" key={region.id} disabled={!region.playable} onClick={() => explore(region.id)} aria-pressed={region.playable ? selected === region.id : undefined} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60 ${selected === region.id ? "border-amber-200 bg-amber-100 text-[#18362e]" : "border-white/20 bg-white/5 text-white/90 hover:bg-white/15"}`}><Icon className="h-3.5 w-3.5" style={{ color: selected === region.id ? "#315b43" : region.color }}/>{region.name}{region.playable ? "" : region.id === "sleep-better" ? " · 🔒 Tạm khóa" : " · Coming Soon"}</button>; })}</nav></div>
    <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0b211e] px-4 py-2.5 text-[10px] text-white/65 sm:text-xs"><span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-amber-200"/>Select a landmark to preview its region. Your trail marker shows your starting quest.</span><span className="hidden font-bold text-amber-200 sm:inline">DRAG TO PAN · ZOOM TO DISCOVER</span><span className="font-bold text-amber-200 sm:hidden">SWIPE MAP</span></div>
  </section>;
}
