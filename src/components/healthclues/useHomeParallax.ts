"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WellnessHomeItem } from "@/app/api/healthclues/wellness-home/route";

export type ParallaxStrength = "subtle" | "normal" | "strong";

export interface ParallaxState {
  enabled: boolean;
  strength: ParallaxStrength;
  bgEnabled: boolean;
  decorEnabled: boolean;
  viewX: number; // Normalized from -1.0 to 1.0
  viewY: number; // Normalized from -1.0 to 1.0
  isDragging: boolean;
  prefersReducedMotion: boolean;
}

const STORAGE_KEY_PARALLAX_ENABLED = "hc_parallax_enabled_v1";
const STORAGE_KEY_PARALLAX_STRENGTH = "hc_parallax_strength_v1";

/**
 * Depth mapping helper for Swiss Chalet interior rooms.
 * Distinguishes wall-mounted items (paintings, wall decor) from floor furniture
 * to ensure objects stay naturally anchored to their supporting surfaces.
 */
export function getChaletItemDepthFactor(item: WellnessHomeItem): number {
  // If explicitly overridden via metadata
  if (typeof (item as unknown as { parallax_depth?: number }).parallax_depth === "number") {
    return (item as unknown as { parallax_depth: number }).parallax_depth;
  }

  const idLower = item.id.toLowerCase();
  const nameLower = (item.name_vi + " " + item.name_en).toLowerCase();

  // Wall-mounted objects: stay tightly anchored to the wall background
  if (
    idLower.includes("painting") ||
    nameLower.includes("tranh") ||
    item.tag_vi?.includes("Treo Tường") ||
    item.corners.tl[1] < 38
  ) {
    return 0.12; // Wall anchor: barely diverges from background displacement
  }

  // Floor furniture: depth gradient based on baseline Y position on the floor (50% to 95%)
  const bottomY = (item.corners.bl[1] + item.corners.br[1]) / 2;
  const normalizedFloorDepth = Math.max(0, Math.min(1, (bottomY - 55) / 38));

  // Items deep near the panoramic glass window (piano, back bed) have lower relative delta (~0.35)
  // Foreground items (luxury sofa, front rug, near plants) have higher relative delta (~1.0)
  return 0.35 + normalizedFloorDepth * 0.75;
}

export function useHomeParallax(initialEnabled = false) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParam = new URLSearchParams(window.location.search).get("parallax");
      if (urlParam === "true" || urlParam === "1") return true;
      if (urlParam === "false" || urlParam === "0") return false;
      const stored = localStorage.getItem(STORAGE_KEY_PARALLAX_ENABLED);
      if (stored !== null) return stored === "true";
    }
    return initialEnabled;
  });

  const [strength, setStrength] = useState<ParallaxStrength>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY_PARALLAX_STRENGTH);
      if (stored === "subtle" || stored === "normal" || stored === "strong") return stored;
    }
    return "normal";
  });

  const [bgEnabled, setBgEnabled] = useState<boolean>(true);
  const [decorEnabled, setDecorEnabled] = useState<boolean>(true);

  // Viewpoint coordinates: -1.0 to +1.0
  const [viewCoords, setViewCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [overrideReducedMotion, setOverrideReducedMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hc_parallax_override_reduced_motion");
      if (stored !== null) return stored === "true";
    }
    return true; // Default to true in dev lab so testers can experience the movement immediately!
  });

  // Animation & interpolation refs
  const currentViewRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetViewRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  // Drag tracking refs
  const dragStartRef = useRef<{ clientX: number; clientY: number; startViewX: number; startViewY: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Detect OS prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_PARALLAX_ENABLED, String(enabled));
  }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_PARALLAX_STRENGTH, strength);
  }, [strength]);

  // Smooth RAF interpolation loop
  const startRafLoop = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const tick = () => {
      const cur = currentViewRef.current;
      const tgt = targetViewRef.current;

      const dx = tgt.x - cur.x;
      const dy = tgt.y - cur.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.001) {
        // Arrived at target
        currentViewRef.current = { x: tgt.x, y: tgt.y };
        setViewCoords({ x: Number(tgt.x.toFixed(4)), y: Number(tgt.y.toFixed(4)) });
        isAnimatingRef.current = false;
        rafIdRef.current = null;
        return;
      }

      // Smooth dampening factor (~14% per frame at 60fps)
      const factor = 0.14;
      cur.x += dx * factor;
      cur.y += dy * factor;

      setViewCoords({ x: Number(cur.x.toFixed(4)), y: Number(cur.y.toFixed(4)) });
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  // Stop RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Reset viewpoint to (0, 0)
  const resetView = useCallback(() => {
    targetViewRef.current = { x: 0, y: 0 };
    startRafLoop();
  }, [startRafLoop]);

  // Pointer drag event handlers for stage surface
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || (prefersReducedMotion && !overrideReducedMotion)) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;

      const target = e.target as HTMLElement;
      // Do NOT hijack drag if user is clicking/interacting with a modal, button, input, or control panel
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest(".hc-home-modal-card") ||
        target.closest(".hc-parallax-dev-panel") ||
        target.closest("[data-prevent-parallax]")
      ) {
        return;
      }

      const stageEl = e.currentTarget;
      const stageRect = stageEl.getBoundingClientRect();
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startViewX = targetViewRef.current.x;
      const startViewY = targetViewRef.current.y;

      dragStartRef.current = {
        clientX: startClientX,
        clientY: startClientY,
        startViewX,
        startViewY,
      };
      hasMovedRef.current = false;
      setIsDragging(true);

      const onWindowPointerMove = (ev: PointerEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = ev.clientX - startClientX;
        const deltaY = ev.clientY - startClientY;

        if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 4) {
          hasMovedRef.current = true;
        }

        if (hasMovedRef.current) {
          // Highly responsive sensitivity: dragging ~140-180px smoothly tilts the whole room
          const sensitivityX = Math.max(140, stageRect.width * 0.18);
          const sensitivityY = Math.max(100, stageRect.height * 0.18);

          const newX = Math.max(-1.0, Math.min(1.0, startViewX - deltaX / sensitivityX));
          const newY = Math.max(-1.0, Math.min(1.0, startViewY - deltaY / sensitivityY));

          targetViewRef.current = { x: newX, y: newY };
          startRafLoop();
        }
      };

      const onWindowPointerUp = () => {
        dragStartRef.current = null;
        setIsDragging(false);
        window.removeEventListener("pointermove", onWindowPointerMove);
        window.removeEventListener("pointerup", onWindowPointerUp);
        window.removeEventListener("pointercancel", onWindowPointerUp);
      };

      window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
      window.addEventListener("pointerup", onWindowPointerUp, { passive: true });
      window.addEventListener("pointercancel", onWindowPointerUp, { passive: true });
    },
    [enabled, startRafLoop]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Kept for backward compatibility if bound on element
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartRef.current) {
        dragStartRef.current = null;
        setIsDragging(false);
      }
    },
    []
  );

  // Strength multiplier
  const strengthMult = strength === "subtle" ? 0.6 : strength === "strong" ? 1.8 : 1.0;
  // Active when enabled, unless reduced-motion is requested and not overridden
  const isEffectActive = enabled && (!prefersReducedMotion || overrideReducedMotion);

  // Background offset calculation (generous safe bounds: max ±15px horizontal, max ±9.5px vertical)
  const getBgOffset = useCallback((): { x: number; y: number } => {
    if (!isEffectActive || !bgEnabled) return { x: 0, y: 0 };
    const maxShiftX = 15.0 * strengthMult;
    const maxShiftY = 9.5 * strengthMult;
    return {
      x: Number((viewCoords.x * maxShiftX).toFixed(2)),
      y: Number((viewCoords.y * maxShiftY).toFixed(2)),
    };
  }, [isEffectActive, bgEnabled, strengthMult, viewCoords.x, viewCoords.y]);

  // Decoration item offset calculation (anchored to background offset + relative depth delta)
  const getItemOffset = useCallback(
    (item: WellnessHomeItem): { x: number; y: number } => {
      if (!isEffectActive || !decorEnabled) return { x: 0, y: 0 };
      const bg = getBgOffset();
      const depthFactor = getChaletItemDepthFactor(item);

      // Relative delta: foreground items move up to ±22px further than background (total ~37px)
      const maxDeltaX = 22.0 * strengthMult * depthFactor;
      const maxDeltaY = 14.0 * strengthMult * depthFactor;

      return {
        x: Number((bg.x + viewCoords.x * maxDeltaX).toFixed(2)),
        y: Number((bg.y + viewCoords.y * maxDeltaY).toFixed(2)),
      };
    },
    [isEffectActive, decorEnabled, getBgOffset, strengthMult, viewCoords.x, viewCoords.y]
  );

  // Chibi companion offset calculation (dynamic depth based on current floor Y position)
  const getCompanionOffset = useCallback(
    (companionYPct: number): { x: number; y: number } => {
      if (!isEffectActive || !decorEnabled) return { x: 0, y: 0 };
      const bg = getBgOffset();

      // Normalize companion depth based on Y position (from 60% back to 90% front)
      const normY = Math.max(0, Math.min(1, (companionYPct - 58) / 34));
      const depthFactor = 0.45 + normY * 0.65;

      const maxDeltaX = 20.0 * strengthMult * depthFactor;
      const maxDeltaY = 12.5 * strengthMult * depthFactor;

      return {
        x: Number((bg.x + viewCoords.x * maxDeltaX).toFixed(2)),
        y: Number((bg.y + viewCoords.y * maxDeltaY).toFixed(2)),
      };
    },
    [isEffectActive, decorEnabled, getBgOffset, strengthMult, viewCoords.x, viewCoords.y]
  );

  return {
    enabled,
    setEnabled,
    strength,
    setStrength,
    bgEnabled,
    setBgEnabled,
    decorEnabled,
    setDecorEnabled,
    viewCoords,
    isDragging,
    hasMoved: hasMovedRef.current,
    prefersReducedMotion,
    overrideReducedMotion,
    setOverrideReducedMotion,
    isEffectActive,
    resetView,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    getBgOffset,
    getItemOffset,
    getCompanionOffset,
  };
}
