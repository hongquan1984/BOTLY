import type { CSSProperties } from "react";
import { GAME_ICON_REGISTRY, type GameIconSemanticKey } from "./gameIconRegistry";

export type HealthCluesGameIconName =
  | "backpack" | "checklist" | "herbs-bundle" | "lotus"
  | "sleep-rest" | "weight-fitness" | "health-concerns" | "beauty-skin"
  | "healthy-aging" | "stress-wellbeing" | "other-goals"
  | "hydration" | "nutrition" | "movement" | "relaxation" | "everyday-habits"
  | GameIconSemanticKey;

/** Canonical keys for goal-discovery cards; labels remain owned by the locale layer. */
export const HEALTHCLUES_DISCOVERY_ICONS = {
  sleep_rest: "sleep-rest",
  weight_fitness: "weight-fitness",
  health_concerns: "health-concerns",
  beauty_skin: "beauty-skin",
  healthy_aging: "healthy-aging",
  stress_wellbeing: "stress-wellbeing",
  other_goals: "other-goals",
} as const satisfies Record<string, HealthCluesGameIconName>;

const legacyAndRegistrySources: Record<string, string> = {
  // Legacy keys mapped to enhanced vector game assets
  backpack: "/assets/game/icons/inventory/backpack.svg",
  checklist: "/assets/game/icons/quests/checklist.svg",
  "herbs-bundle": "/assets/game/icons/inventory/herbs-bundle.svg",
  lotus: "/assets/game/icons/inventory/lotus-flower.svg",
  "sleep-rest": "/assets/game/icons/navigation/trail-moon.svg",
  "weight-fitness": "/assets/game/icons/inventory/running-shoe.svg",
  "health-concerns": "/assets/game/icons/navigation/compass.svg",
  "beauty-skin": "/assets/game/icons/navigation/trail-flower.svg",
  "healthy-aging": "/assets/game/icons/navigation/trail-leaf.svg",
  "stress-wellbeing": "/assets/game/icons/inventory/lotus-flower.svg",
  "other-goals": "/assets/game/icons/navigation/compass.svg",
  hydration: "/assets/game/icons/inventory/water-bottle.svg",
  nutrition: "/assets/game/icons/inventory/food-bowl.svg",
  movement: "/assets/game/icons/inventory/running-shoe.svg",
  relaxation: "/assets/game/icons/inventory/lotus-flower.svg",
  "everyday-habits": "/assets/game/icons/quests/quest-scroll.svg",

  // Spread the centralized registry
  ...GAME_ICON_REGISTRY,
};

export type IconTone = "gold" | "botanical" | "lavender" | "amber" | "emerald" | "crimson" | "sky" | "silver" | "inherit";

const toneColors: Record<IconTone, string> = {
  gold: "#cca65b",
  botanical: "#5c8a4d",
  lavender: "#8a6cb5",
  amber: "#e6a13c",
  emerald: "#2e8b57",
  crimson: "#d9534f",
  sky: "#5bc0de",
  silver: "#a8b2b7",
  inherit: "currentColor",
};

export function HealthCluesGameIcon({
  icon,
  className = "",
  tone = "gold",
  size,
  style: userStyle,
  alt,
}: {
  icon: HealthCluesGameIconName | string;
  className?: string;
  tone?: IconTone;
  size?: string | number;
  style?: CSSProperties;
  alt?: string;
}) {
  const source = legacyAndRegistrySources[icon] || (icon in GAME_ICON_REGISTRY ? GAME_ICON_REGISTRY[icon as GameIconSemanticKey] : icon);
  const dimension = size ? (typeof size === "number" ? `${size}px` : size) : "1.15rem";
  const color = toneColors[tone] || toneColors.gold;

  const combinedStyle: CSSProperties = {
    display: "inline-block",
    width: dimension,
    height: dimension,
    flex: "none",
    backgroundColor: "currentColor",
    color: color,
    maskImage: `url("${source}")`,
    WebkitMaskImage: `url("${source}")`,
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    ...userStyle,
  };

  return (
    <span
      className={`hc-game-icon hc-game-icon-${tone} ${className}`.trim()}
      style={combinedStyle}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={!alt ? "true" : undefined}
      data-game-icon={icon}
    />
  );
}
