"use client";

import React, { useState } from "react";
import type { CaseClue, CaseScene, SceneHotspot } from "../../types";
import { inspectHotspot } from "../../engine/clue-engine";
import { ObjectInspectionModal } from "./ObjectInspectionModal";
import { detectiveAudio } from "../../audio/detectiveSoundEngine";

interface Props {
  scene: CaseScene;
  allClues: CaseClue[];
  foundClueIds: string[];
  inspectedHotspotIds: string[];
  onClueDiscovered: (clue: CaseClue) => void;
  onHotspotInspected: (hotspotId: string) => void;
  onOpenNotebook?: () => void;
  onOpenBriefing?: () => void;
}

export function InvestigationSceneView({
  scene,
  allClues,
  foundClueIds,
  inspectedHotspotIds,
  onClueDiscovered,
  onHotspotInspected,
  onOpenNotebook,
  onOpenBriefing,
}: Props) {
  const [activeDeepInspectionHotspot, setActiveDeepInspectionHotspot] =
    useState<SceneHotspot | null>(null);
  const [activeModalHotspot, setActiveModalHotspot] = useState<SceneHotspot | null>(null);
  const [inspectionData, setInspectionData] = useState<{
    isClue: boolean;
    clue?: CaseClue;
    decorText?: string;
    isFirstDiscovery: boolean;
  } | null>(null);

  // Detective Scan Mode (highlights objects temporarily for 2.8s)
  const [isScanActive, setIsScanActive] = useState(false);
  // Optional calibration debug overlay via ?calibrate=1
  const [showCalibration] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("calibrate") === "1";
    }
    return false;
  });
  // Zoom level (1x, 1.25x, 1.5x)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  const getPolygonPoints = (hotspot: SceneHotspot): string => {
    if (hotspot.polygon && hotspot.polygon.length >= 3) {
      return hotspot.polygon.map((p) => `${p.x},${p.y}`).join(" ");
    }
    if (hotspot.bounds) {
      const { x, y, width, height } = hotspot.bounds;
      return `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`;
    }
    const r = Math.max(4, hotspot.radius || 6);
    const rx = r * 0.85;
    const ry = r * 1.15;
    return `${hotspot.x - rx},${hotspot.y - ry} ${hotspot.x + rx},${hotspot.y - ry} ${hotspot.x + rx},${hotspot.y + ry} ${hotspot.x - rx},${hotspot.y + ry}`;
  };

  const isHotspotRecorded = (hotspot: SceneHotspot): boolean => {
    if (hotspot.clueId && foundClueIds.includes(hotspot.clueId)) return true;
    if (hotspot.detailHotspots?.some((d) => d.associatedClueId && foundClueIds.includes(d.associatedClueId))) {
      return true;
    }
    return false;
  };

  const isHotspotVisitedOnly = (hotspot: SceneHotspot): boolean =>
    inspectedHotspotIds.includes(hotspot.id) && !isHotspotRecorded(hotspot);

  const handleHotspotClick = (hotspot: SceneHotspot) => {
    detectiveAudio.playMagnifyInspect();
    onHotspotInspected(hotspot.id);
    if (hotspot.detailHotspots && hotspot.detailHotspots.length > 0) {
      setActiveDeepInspectionHotspot(hotspot);
    } else {
      const result = inspectHotspot(hotspot, allClues, foundClueIds);
      setActiveModalHotspot(hotspot);
      setInspectionData(result);
    }
  };

  const handleSaveClue = () => {
    if (inspectionData?.clue) {
      onClueDiscovered(inspectionData.clue);
    }
    setActiveModalHotspot(null);
    setInspectionData(null);
  };

  const triggerDetectiveScan = () => {
    if (isScanActive) return;
    detectiveAudio.playMagnifyInspect();
    setIsScanActive(true);
    setTimeout(() => {
      setIsScanActive(false);
    }, 2800);
  };

  // Determine background artwork source
  const primaryBg = scene.backgroundUrl || (
    scene.id === "scene-an-bedroom"
      ? "/gametrinhtham/scenes/scene-an-bedroom.png"
      : "/gametrinhtham/scenes/scene-minh-livingroom.png"
  );
  const fallbackSvg = scene.backgroundSvg || (
    scene.id === "scene-an-bedroom"
      ? "/gametrinhtham/scenes/scene-an-bedroom.svg"
      : "/gametrinhtham/scenes/scene-minh-livingroom.svg"
  );

  const inspectedCount = scene.hotspots.filter((h) => isHotspotRecorded(h)).length;

  const sceneAspect = scene.aspectRatio || 1376 / 768;
  const hasCompleteFooter = inspectedCount > 0 && inspectedCount >= scene.hotspots.length && Boolean(onOpenNotebook);

  return (
    <div
      style={sceneAspect < 1.6 ? { maxWidth: "860px" } : undefined}
      className={`detective-scene-shell relative w-full max-w-6xl mx-auto overflow-hidden rounded-xl sm:rounded-2xl border border-amber-500/35 bg-slate-950 shadow-[0_12px_40px_rgba(0,0,0,0.65)] ${
        hasCompleteFooter ? "has-complete-footer" : ""
      }`}
    >
      {/* Main 2D Scene Canvas with Embedded Game HUD Pills (Zero Stacked Header Waste) */}
      <div
        style={{ aspectRatio: String(sceneAspect) }}
        className="detective-scene-canvas relative w-full bg-slate-950 overflow-hidden select-none"
      >
        {/* Top-Left Floating Scene Badge + Reopen Briefing Pill */}
        <div className="detective-scene-pills absolute top-2 left-2 sm:top-3 sm:left-3 z-30 flex items-center gap-1.5 pointer-events-none">
          <div className="detective-scene-pill px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-amber-400/35 text-amber-200 text-[11px] sm:text-xs font-black flex items-center gap-1.5 shadow-lg">
            <span>📍</span>
            <span className="truncate max-w-36 sm:max-w-xs">{scene.name}</span>
          </div>
          {onOpenBriefing && (
            <button
              type="button"
              data-testid="scene-briefing-btn"
              onClick={() => {
                detectiveAudio.playLunaChirp();
                onOpenBriefing();
              }}
              title="Xem lại lời dẫn vụ án từ Luna"
              className="detective-scene-pill pointer-events-auto px-2 py-1 rounded-full bg-slate-950/75 hover:bg-slate-900 backdrop-blur-md border border-amber-400/35 text-amber-200 text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-lg transition whitespace-nowrap"
            >
              <span>🦊</span>
              <span className="hidden sm:inline detective-nav-long">Lời dẫn</span>
            </button>
          )}
        </div>

        {/* Top-Right Floating Controls Overlay (Soi + Zoom + Counter) */}
        <div className="detective-scene-pills absolute top-2 right-2 sm:top-3 sm:right-3 z-30 flex items-center gap-1.5">
          <button
            onClick={triggerDetectiveScan}
            disabled={isScanActive}
            title="Kích hoạt giác quan thám tử để soi hiện trường trong 3 giây"
            className={`detective-scene-pill px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black transition flex items-center gap-1 shadow-lg border backdrop-blur-md whitespace-nowrap ${
              isScanActive
                ? "bg-amber-400 text-slate-950 border-amber-200 animate-pulse"
                : "bg-slate-950/75 hover:bg-slate-900 text-amber-200 border-amber-400/40"
            }`}
          >
            <span>✨</span>
            <span className="hidden sm:inline detective-nav-long">Soi Hiện Trường</span>
            <span className="sm:hidden detective-nav-short">Soi</span>
          </button>

          <div className="detective-scene-zoom hidden sm:flex items-center bg-slate-950/75 backdrop-blur-md rounded-full border border-slate-600/70 px-1 py-0.5 text-[11px] shadow-lg">
            <button
              onClick={() => {
                detectiveAudio.playUiClick();
                setZoomLevel((z) => Math.max(1, z - 0.25));
              }}
              className="px-1.5 text-slate-300 hover:text-white font-black"
              title="Thu nhỏ"
            >
              −
            </button>
            <span className="px-1 font-bold text-amber-300 min-w-9 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => {
                detectiveAudio.playUiClick();
                setZoomLevel((z) => Math.min(1.75, z + 0.25));
              }}
              className="px-1.5 text-slate-300 hover:text-white font-black"
              title="Phóng to"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs bg-emerald-950/85 backdrop-blur-md border border-emerald-400/50 px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
            <span className="text-emerald-300 font-black">
              {inspectedCount}/{scene.hotspots.length}
            </span>
          </div>
        </div>

        {/* First-time Tiny RPG Tip Inside Canvas Bottom-Left (Disappears once first item saved) */}
        {inspectedCount === 0 && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-30 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/30 text-amber-100 text-[11px] font-bold shadow-lg flex items-center gap-1.5">
              <span>🦊</span>
              <span>Chạm vào đồ vật khả nghi trong phòng để soi</span>
            </div>
          </div>
        )}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          className="relative w-full h-full"
        >
          {/* Panoramic RPG Background Image (Locked aspect ratio -> exact coordinate sync) */}
          <img
            src={primaryBg}
            alt={scene.name}
            className="w-full h-full object-fill pointer-events-none select-none transition-opacity duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fallbackSvg) {
                target.src = fallbackSvg;
              }
            }}
          />

          {/* Atmospheric Cinematic Lighting Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/15 pointer-events-none" />

          {/* Floating Ghibli Warm Dust Motes (Atmospheric Depth, Pointer-Free) */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
            <span className="animate-dust-mote absolute left-[18%] top-[72%] w-1.5 h-1.5 rounded-full bg-amber-200/70 blur-[0.5px]" style={{ animationDelay: "0s" }} />
            <span className="animate-dust-mote absolute left-[36%] top-[64%] w-1 h-1 rounded-full bg-amber-100/60" style={{ animationDelay: "1.6s" }} />
            <span className="animate-dust-mote absolute left-[58%] top-[78%] w-1.5 h-1.5 rounded-full bg-amber-300/65 blur-[0.5px]" style={{ animationDelay: "3.1s" }} />
            <span className="animate-dust-mote absolute left-[76%] top-[58%] w-1 h-1 rounded-full bg-amber-100/75" style={{ animationDelay: "4.4s" }} />
            <span className="animate-dust-mote absolute left-[88%] top-[70%] w-1.5 h-1.5 rounded-full bg-amber-200/60 blur-[0.5px]" style={{ animationDelay: "2.3s" }} />
          </div>

          {/* Detective Scanline Wave Effect */}
          {isScanActive && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/10 to-transparent pointer-events-none animate-scanline" />
          )}

          {/* SVG Normalized Polygon Hit-Mask (0..100% viewBox locked 1:1 with artwork) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full z-10"
          >
            {scene.hotspots.map((hotspot) => {
              const isHovered = hoveredHotspotId === hotspot.id;
              const isHighlighted = isHovered || isScanActive || showCalibration;
              const points = getPolygonPoints(hotspot);

              return (
                <g
                  key={hotspot.id}
                  role="button"
                  tabIndex={0}
                  data-hotspot-id={hotspot.id}
                  aria-label={`Khám phá ${hotspot.name}`}
                  onClick={() => handleHotspotClick(hotspot)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleHotspotClick(hotspot);
                    }
                  }}
                  onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                  onMouseLeave={() => setHoveredHotspotId(null)}
                  className="cursor-zoom-in outline-none"
                >
                  <polygon
                    points={points}
                    fill={
                      isHighlighted
                        ? showCalibration
                          ? "rgba(251, 191, 36, 0.24)"
                          : isHovered
                          ? "rgba(251, 191, 36, 0.16)"
                          : "rgba(251, 191, 36, 0.12)"
                        : "rgba(0, 0, 0, 0)"
                    }
                    stroke={
                      isHighlighted
                        ? isHovered
                          ? "#fde047"
                          : "#f59e0b"
                        : "transparent"
                    }
                    strokeWidth={isHovered || showCalibration ? "0.45" : "0.35"}
                    strokeLinejoin="round"
                    strokeDasharray={isScanActive && !isHovered ? "1.2 0.8" : undefined}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Subtle Post-Inspection Indicators, Calibration Labels & Edge-Clamped Tooltips */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {scene.hotspots.map((hotspot) => {
              const isRecorded = isHotspotRecorded(hotspot);
              const isVisitedOnly = isHotspotVisitedOnly(hotspot);
              const isHovered = hoveredHotspotId === hotspot.id;
              const isRightEdge = hotspot.x > 78;
              const isLeftEdge = hotspot.x < 22;
              const isTopEdge = hotspot.y < 18;

              return (
                <React.Fragment key={`overlay-${hotspot.id}`}>
                  {/* Green Check Seal ONLY after clue is actually saved to Sổ Vật Chứng */}
                  {isRecorded && !showCalibration && (
                    <span
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute w-5 h-5 rounded-full bg-emerald-600/95 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-950 shadow-md"
                    >
                      ✓
                    </span>
                  )}

                  {/* Amber Eye Badge if clicked without saving main clue yet */}
                  {isVisitedOnly && !showCalibration && (
                    <span
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute w-5 h-5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-slate-950 shadow-md"
                    >
                      !
                    </span>
                  )}

                  {/* Calibration Debug Pill when ?calibrate=1 */}
                  {showCalibration && (
                    <span
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute whitespace-nowrap bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-950 shadow-lg"
                    >
                      {hotspot.discoveredIcon} {hotspot.name} ({hotspot.x}%, {hotspot.y}%)
                    </span>
                  )}

                  {/* Clamped Hover Inspection Label */}
                  {isHovered && !showCalibration && (
                    <span
                      style={{
                        left: `${hotspot.x}%`,
                        top: isTopEdge ? `${hotspot.y + 8}%` : `${Math.max(8, hotspot.y - 9)}%`,
                        transform: isRightEdge
                          ? "translate(-90%, -50%)"
                          : isLeftEdge
                          ? "translate(-10%, -50%)"
                          : "translate(-50%, -50%)",
                      }}
                      className="absolute whitespace-nowrap bg-slate-950/95 text-amber-200 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-2xl border border-amber-500/50 flex items-center gap-1.5 animate-in fade-in duration-150"
                    >
                      <span>{hotspot.discoveredIcon || "🔍"}</span>
                      <span>{hotspot.name}</span>
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Non-overlapping 1-tap transition footer strip below scene canvas once all hotspots saved */}
      {hasCompleteFooter && onOpenNotebook && (
        <div className="detective-scene-footer flex flex-col sm:flex-row items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border-t border-emerald-400/35">
          <div className="text-[11px] sm:text-xs font-bold text-emerald-100 flex items-center gap-2">
            <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black items-center justify-center text-[10px]">
              ✓
            </span>
            <span>
              Đã thu thập đủ {inspectedCount}/{scene.hotspots.length} vật chứng tại hiện trường.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              detectiveAudio.playPaperFlip();
              onOpenNotebook?.();
            }}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-[0_0_16px_rgba(16,185,129,0.45)] border border-emerald-200 transition whitespace-nowrap"
          >
            📓 Mở Sổ Manh Mối &amp; Đối Chiếu →
          </button>
        </div>
      )}

      {/* Close-up Inspection Modal Styled like a Detective Dossier */}
      {activeModalHotspot && inspectionData && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg m-auto rounded-3xl bg-[#fdfbf7] border-2 border-[#d7cfb7] p-5 sm:p-6 text-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#e2d9c2] pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-amber-100 border border-amber-300 shadow-sm">
                  {activeModalHotspot.discoveredIcon || "🔍"}
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                    {inspectionData.isClue ? "CHỨNG CỨ KHÁM PHÁ" : "VẬT THỂ HIỆN TRƯỜNG"}
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-0.5">
                    {activeModalHotspot.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveModalHotspot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Inspection Content */}
            <div className="my-4 space-y-3.5">
              {/* Physical Observation Note */}
              <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/90 shadow-inner">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                  Quan sát trực tiếp tại hiện trường:
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {activeModalHotspot.inspectMessage}
                </p>
              </div>

              {inspectionData.isClue && inspectionData.clue && (
                <div className="rounded-2xl bg-white p-4 border border-[#e2d9c2] text-xs space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-semibold text-slate-500">Nguồn thu thập:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      📍 {inspectionData.clue.source.location}
                    </span>
                  </div>

                  {inspectionData.clue.source.timestamp && (
                    <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-semibold text-slate-500">Dấu thời gian:</span>
                      <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                        ⏱️ {inspectionData.clue.source.timestamp}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 text-slate-700 leading-relaxed">
                    <span className="text-[11px] font-bold text-slate-900 block mb-1">
                      Phân tích pháp y & sinh học:
                    </span>
                    <p className="font-medium text-slate-700">
                      {inspectionData.clue.detailedObservation}
                    </p>
                  </div>

                  {inspectionData.clue.source.medicalRef && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-950">
                      <strong className="text-emerald-900 block mb-0.5">
                        Cơ sở khoa học / Y văn:
                      </strong>
                      <p>{inspectionData.clue.source.medicalRef.summary}</p>
                      {inspectionData.clue.source.medicalRef.pmid && (
                        <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                          (PMID: {inspectionData.clue.source.medicalRef.pmid})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!inspectionData.isClue && (
                <div className="rounded-2xl bg-slate-100 p-4 border border-slate-200 text-center text-xs text-slate-600">
                  {inspectionData.decorText}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e2d9c2]">
              <button
                onClick={() => setActiveModalHotspot(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                Đóng
              </button>
              {inspectionData.isClue && (
                <button
                  onClick={handleSaveClue}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-lg hover:brightness-110 active:scale-98 transition flex items-center gap-2"
                >
                  <span>📋</span>
                  <span>
                    {foundClueIds.includes(inspectionData.clue!.id)
                      ? "Đã lưu trong Sổ tay"
                      : "Lưu vào Sổ Manh Mối (+1)"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Layer 2: Deep Object Inspection Modal */}
      {activeDeepInspectionHotspot && (
        <ObjectInspectionModal
          sceneHotspot={activeDeepInspectionHotspot}
          allClues={allClues}
          recordedClueIds={foundClueIds}
          onRecordClue={(clue) => onClueDiscovered(clue)}
          onClose={() => setActiveDeepInspectionHotspot(null)}
        />
      )}
    </div>
  );
}
