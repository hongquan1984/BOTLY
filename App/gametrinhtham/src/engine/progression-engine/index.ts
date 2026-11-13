import type { DetectiveRank } from "../../types";

export const DETECTIVE_RANKS: DetectiveRank[] = [
  { level: 1, title: "Thám tử tập sự", badge: "🌱", minSolved: 0, color: "#10b981" },
  { level: 2, title: "Thám tử khám phá", badge: "🔍", minSolved: 1, color: "#3b82f6" },
  { level: 3, title: "Thám tử tài năng", badge: "🕵️", minSolved: 2, color: "#8b5cf6" },
  { level: 4, title: "Thám tử chuyên gia", badge: "🎖️", minSolved: 4, color: "#f59e0b" },
  { level: 5, title: "Bậc thầy bí ẩn", badge: "👑", minSolved: 6, color: "#ef4444" },
];

export function calculateDetectiveRank(solvedCount: number): DetectiveRank {
  for (let i = DETECTIVE_RANKS.length - 1; i >= 0; i--) {
    if (solvedCount >= DETECTIVE_RANKS[i].minSolved) {
      return DETECTIVE_RANKS[i];
    }
  }
  return DETECTIVE_RANKS[0];
}

export function calculateRewardExp(baseExp: number, stars: number, expMultiplier?: number): number {
  if (typeof expMultiplier === "number") {
    return Math.max(0, Math.round(baseExp * expMultiplier));
  }
  if (stars >= 3) return baseExp + 20; // Thưởng hoàn hảo
  if (stars === 2) return baseExp + 10;
  if (stars === 1) return baseExp;
  return Math.max(0, Math.round(baseExp * 0.2));
}

export function calculateRewardCoins(
  baseCoins: number,
  stars: number,
  expMultiplier?: number,
  previousCoinsAwarded = 0
): { totalCoinsForStars: number; deltaCoins: number } {
  const safeBase = Math.max(0, baseCoins || 100);
  const multiplier =
    typeof expMultiplier === "number"
      ? expMultiplier
      : stars >= 3
      ? 1.0
      : stars === 2
      ? 0.7
      : stars === 1
      ? 0.4
      : 0.2;
  const totalCoinsForStars = Math.max(0, Math.round(safeBase * multiplier));
  const deltaCoins = Math.max(0, totalCoinsForStars - Math.max(0, previousCoinsAwarded || 0));
  return { totalCoinsForStars, deltaCoins };
}
