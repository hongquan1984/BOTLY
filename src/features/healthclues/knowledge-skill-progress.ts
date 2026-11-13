export const HEALTHCLUES_SKILL_LEVELS = ["Novice", "Explorer", "Learner", "Scholar", "Master"] as const;

export function getHealthCluesSkillLevel(points: number): number {
  const completions = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0;
  if (completions >= 8) return 4;
  if (completions >= 5) return 3;
  if (completions >= 3) return 2;
  if (completions >= 1) return 1;
  return 0;
}
