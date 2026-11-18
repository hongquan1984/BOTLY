/**
 * 2.5D Painterly Diorama Math & Atmosphere Helpers for HealthClues World Scene (1600x900)
 *
 * Transforms the flat 16:9 isometric illustration into a multi-depth 2.5D stage:
 * - Perspective Y-depth scaling (distant landmarks shrink naturally, foreground actors enlarge)
 * - Dynamic Y-sorting (zIndex = ground Y) so actors walk cleanly behind & in front of NPCs/markers
 * - 3-depth floating ambient particles (background mist motes, mid fireflies, foreground leaves)
 * - Perspective-foreshortened ground rings (scaleY ~ 0.48) on plaza stones & crystal fountain
 * - Time-of-day atmosphere (Auto / Day / Sunset / Night) with warm lantern halos
 */

export type WorldAtmosphereMode = "auto" | "day" | "sunset" | "night";
export type ResolvedWorldAtmosphere = "day" | "sunset" | "night";

export interface DioramaParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  depth: number; // 0.25 = distant sky/fountain, 0.65 = plaza mid, 1.35 = foreground near camera
  opacity: number;
  color: string;
  phaseMs: number;
}

export interface WarmGlowAnchor {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export const WORLD_MAP_WIDTH = 1600;
export const WORLD_MAP_HEIGHT = 900;

// Crystal Fountain basin & jewel centers inside HealthClues Realm northern plaza
export const FOUNTAIN_CENTER = { x: 786, y: 246 } as const;
export const FOUNTAIN_CRYSTAL_POS = { x: 786, y: 204 } as const;

// Ambient light sources that glow gently during Sunset & Night modes (rendered as smooth SVG radial gradients)
export const WORLD_GLOW_ANCHORS: WarmGlowAnchor[] = [
  { id: "fountain-crystal", x: 786, y: 204, radius: 185, color: "#38bdf8", intensity: 0.78 },
  { id: "library-windows", x: 270, y: 235, radius: 220, color: "#fbbf24", intensity: 0.9 },
  { id: "camp-lantern", x: 225, y: 495, radius: 180, color: "#f59e0b", intensity: 0.85 },
  { id: "botanical-lamp", x: 1125, y: 405, radius: 175, color: "#facc15", intensity: 0.72 },
  { id: "observatory-dome", x: 1370, y: 635, radius: 190, color: "#34d399", intensity: 0.7 },
];

// Lightweight 3-depth floating particles (fireflies / golden pollen) for 60fps performance
export const WORLD_AMBIENT_PARTICLES: DioramaParticle[] = [
  { id: "p-bg-1", x: 786, y: 215, size: 4.5, depth: 0.3, opacity: 0.65, color: "#7dd3fc", phaseMs: 0 },
  { id: "p-mid-1", x: 470, y: 515, size: 6, depth: 0.74, opacity: 0.7, color: "#fde047", phaseMs: 250 },
  { id: "p-mid-2", x: 1025, y: 495, size: 6, depth: 0.76, opacity: 0.68, color: "#a7f3d0", phaseMs: 650 },
  { id: "p-fg-1", x: 640, y: 745, size: 7.5, depth: 1.3, opacity: 0.58, color: "#fef08a", phaseMs: 950 },
];

/**
 * Perspective scale based on vertical ground position (y in 0..900).
 * Far horizon near Library/Fountain (~220) shrinks to ~0.77x; front plaza (~660+) scales up to ~1.05–1.14x.
 */
export function getWorldDepthScale(y: number, enabled = true): number {
  if (!enabled) return 1;
  const clamped = Math.max(180, Math.min(860, y));
  const t = (clamped - 180) / (860 - 180); // 0 (far) -> 1 (near)
  // Balanced isometric perspective: subtle depth scaling (0.92x to 1.08x) so NPCs and villagers
  // remain consistent and proportionate across the village square without looking unnaturally tiny.
  return Number((0.92 + t * 0.16).toFixed(3));
}

/**
 * Dynamic painter's algorithm z-order by foot ground Y coordinate.
 */
export function getActorZIndex(y: number, offset = 0): number {
  return Math.max(2, Math.round(y) + offset);
}

/**
 * Compute parallax shift for floating depth elements when camera pans across the 1600x900 canvas.
 */
export function getDioramaParallaxShift(
  normCamX: number,
  normCamY: number,
  depth: number,
  enabled = true
): { dx: number; dy: number } {
  if (!enabled) return { dx: 0, dy: 0 };
  const relativeDepth = depth - 0.85; // anchors midground paths close to 0 shift
  return {
    dx: Math.round(-normCamX * 26 * relativeDepth),
    dy: Math.round(-normCamY * 14 * relativeDepth),
  };
}

/**
 * Resolve Auto clock or manual atmosphere preset into active visual lighting state.
 */
export function resolveWorldAtmosphere(mode: WorldAtmosphereMode): ResolvedWorldAtmosphere {
  if (mode !== "auto") return mode;
  const hour = new Date().getHours();
  if (hour >= 19 || hour < 5) return "night";
  if (hour >= 16 && hour < 19) return "sunset";
  return "day";
}

export function getAtmosphereVisuals(resolved: ResolvedWorldAtmosphere): {
  tintColor: string;
  horizonHazeColor: string;
  sunbeamOpacity: number;
  glowMultiplier: number;
  labelVi: string;
} {
  switch (resolved) {
    case "sunset":
      return {
        tintColor: "rgba(180, 83, 9, 0.16)",
        horizonHazeColor: "rgba(251, 146, 60, 0.18)",
        sunbeamOpacity: 0.24,
        glowMultiplier: 0.65,
        labelVi: "Hoàng hôn",
      };
    case "night":
      return {
        tintColor: "rgba(6, 20, 42, 0.44)",
        horizonHazeColor: "rgba(56, 189, 248, 0.12)",
        sunbeamOpacity: 0.04,
        glowMultiplier: 1.0,
        labelVi: "Ban đêm",
      };
    case "day":
    default:
      return {
        tintColor: "rgba(0, 0, 0, 0.04)",
        horizonHazeColor: "rgba(254, 249, 195, 0.14)",
        sunbeamOpacity: 0.16,
        glowMultiplier: 0.22,
        labelVi: "Ban ngày",
      };
  }
}
