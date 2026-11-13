import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import type { WellnessHomeItem } from "./useWellnessHome";

export type ParallaxStrength = "off" | "subtle" | "normal" | "strong";

export function getChaletItemDepthFactor(item: WellnessHomeItem): number {
  const idLower = item.id.toLowerCase();
  const nameLower = `${item.name_vi} ${item.name_en}`.toLowerCase();

  // Wall paintings stay closely anchored to chimney/wall surface
  if (
    idLower.includes("painting") ||
    nameLower.includes("tranh") ||
    item.corners.tl[1] < 38
  ) {
    return 0.12;
  }

  // Floor items scale smoothly from distant window (~0.35) to foreground (~1.08)
  const bottomY = (item.corners.bl[1] + item.corners.br[1]) / 2;
  const normalizedFloorDepth = Math.max(0, Math.min(1, (bottomY - 55) / 38));
  return 0.35 + normalizedFloorDepth * 0.75;
}

export function getChaletFloorDepthFactor(yPct: number): number {
  if (yPct < 62.5) {
    // Distant lakeside outdoor balcony glides close to mid-background plane
    return 0.22;
  }
  const normalized = Math.max(0, Math.min(1, (yPct - 55) / 38));
  return 0.35 + normalized * 0.75;
}

/**
 * Interactive 2.5D Parallax hook (matches Web useHomeParallax ergonomics):
 * - Zero idle swaying/rocking: stays rock-steady until user pans/drags horizontally or vertically.
 * - Responds smoothly to horizontal room ScrollView panning on portrait phones.
 * - Responds to drag gestures (mouse/touch drag on stage) on desktop & overview mode.
 */
export function useMobileHomeParallax(initialStrength: ParallaxStrength = "normal") {
  const [strength, setStrength] = useState<ParallaxStrength>(initialStrength);
  const [viewCoords, setViewCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const currentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const dragOriginRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);

  const isActive = strength !== "off";
  const strengthMult =
    strength === "subtle" ? 0.6 : strength === "strong" ? 1.55 : strength === "normal" ? 1.0 : 0;

  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = null;
    isAnimatingRef.current = false;
  }, []);

  // On-demand smooth interpolation that halts cleanly when arrived (zero idle oscillation)
  const startRaf = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const tick = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const dx = tgt.x - cur.x;
      const dy = tgt.y - cur.y;

      if (Math.hypot(dx, dy) < 0.002) {
        currentRef.current = { x: tgt.x, y: tgt.y };
        setViewCoords({ x: Number(tgt.x.toFixed(3)), y: Number(tgt.y.toFixed(3)) });
        isAnimatingRef.current = false;
        rafIdRef.current = null;
        return;
      }

      const nextX = cur.x + dx * 0.18;
      const nextY = cur.y + dy * 0.18;
      currentRef.current = { x: nextX, y: nextY };
      setViewCoords({ x: Number(nextX.toFixed(3)), y: Number(nextY.toFixed(3)) });

      if (typeof requestAnimationFrame === "function") {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(tick, 16);
      }
    };

    if (typeof requestAnimationFrame === "function") {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      setTimeout(tick, 16);
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      stopRaf();
      targetRef.current = { x: 0, y: 0 };
      currentRef.current = { x: 0, y: 0 };
      setViewCoords({ x: 0, y: 0 });
    }
    return () => stopRaf();
  }, [isActive, stopRaf]);

  const handleScroll = useCallback(
    (scrollX: number, stageWidth: number, viewportWidth: number) => {
      if (!isActive) return;
      const maxScroll = stageWidth - viewportWidth;
      if (maxScroll <= 2) return;
      // Centered = 0, swiped left edge = -1, swiped right edge = +1
      const norm = Math.max(-1, Math.min(1, (scrollX / maxScroll) * 2 - 1));
      targetRef.current = { x: norm, y: targetRef.current.y };
      startRaf();
    },
    [isActive, startRaf]
  );

  // Drag-to-look handler matching Web useHomeParallax (only shifts when user drags)
  const beginWebDrag = useCallback(
    (clientX: number, clientY: number, width: number, height: number) => {
      if (!isActive || Platform.OS !== "web") return;
      dragOriginRef.current = {
        clientX,
        clientY,
        startX: targetRef.current.x,
        startY: targetRef.current.y,
        width: Math.max(240, width),
        height: Math.max(200, height),
      };
      hasMovedRef.current = false;
      setIsDragging(true);

      const onMove = (ev: PointerEvent) => {
        const orig = dragOriginRef.current;
        if (!orig) return;
        const dx = ev.clientX - orig.clientX;
        const dy = ev.clientY - orig.clientY;
        if (!hasMovedRef.current && Math.hypot(dx, dy) > 5) {
          hasMovedRef.current = true;
        }
        if (hasMovedRef.current) {
          const sensX = Math.max(140, orig.width * 0.2);
          const sensY = Math.max(110, orig.height * 0.22);
          const nx = Math.max(-1, Math.min(1, orig.startX - dx / sensX));
          const ny = Math.max(-1, Math.min(1, orig.startY - dy / sensY));
          targetRef.current = { x: nx, y: ny };
          startRaf();
        }
      };

      const onEnd = () => {
        dragOriginRef.current = null;
        setIsDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        // Clear drag guard cleanly after click event bubble phase finishes
        setTimeout(() => {
          hasMovedRef.current = false;
        }, 60);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd, { passive: true });
      window.addEventListener("pointercancel", onEnd, { passive: true });
    },
    [isActive, startRaf]
  );

  const resetView = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    startRaf();
  }, [startRaf]);

  const cycleStrength = useCallback((): ParallaxStrength => {
    const order: ParallaxStrength[] = ["normal", "strong", "subtle", "off"];
    const next = order[(order.indexOf(strength) + 1) % order.length];
    setStrength(next);
    return next;
  }, [strength]);

  const getBgOffset = useCallback((): { x: number; y: number } => {
    if (!isActive) return { x: 0, y: 0 };
    return {
      x: Number((viewCoords.x * 13 * strengthMult).toFixed(2)),
      y: Number((viewCoords.y * 8 * strengthMult).toFixed(2)),
    };
  }, [isActive, strengthMult, viewCoords.x, viewCoords.y]);

  const getItemOffset = useCallback(
    (item: WellnessHomeItem): { x: number; y: number } => {
      if (!isActive) return { x: 0, y: 0 };
      const bg = getBgOffset();
      const depthFactor = getChaletItemDepthFactor(item);
      return {
        x: Number((bg.x + viewCoords.x * 20 * strengthMult * depthFactor).toFixed(2)),
        y: Number((bg.y + viewCoords.y * 12 * strengthMult * depthFactor).toFixed(2)),
      };
    },
    [isActive, getBgOffset, strengthMult, viewCoords.x, viewCoords.y]
  );

  const getCompanionOffset = useCallback(
    (yPct: number): { x: number; y: number } => {
      if (!isActive) return { x: 0, y: 0 };
      const bg = getBgOffset();
      const depthFactor = getChaletFloorDepthFactor(yPct);
      return {
        x: Number((bg.x + viewCoords.x * 20 * strengthMult * depthFactor).toFixed(2)),
        y: Number((bg.y + viewCoords.y * 12 * strengthMult * depthFactor).toFixed(2)),
      };
    },
    [isActive, getBgOffset, strengthMult, viewCoords.x, viewCoords.y]
  );

  return {
    strength,
    setStrength,
    cycleStrength,
    isActive,
    isDragging,
    hasMoved: () => hasMovedRef.current,
    viewCoords,
    handleScroll,
    beginWebDrag,
    resetView,
    getBgOffset,
    getItemOffset,
    getCompanionOffset,
  };
}
