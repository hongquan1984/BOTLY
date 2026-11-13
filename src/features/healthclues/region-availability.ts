/** Central product availability for the eight regions drawn on the Overworld.
 * Keep IDs stable for existing database rows; only the first and last regions
 * currently have playable detailed-map experiences.
 */
export const HEALTHCLUES_REGIONS = [
  { id: "sleep-better", name: "Sleep Valley", playable: false, locked: true, companion: "Luna" },
  { id: "feel-calmer", name: "Calm Forest", playable: false, companion: null },
  { id: "more-energy", name: "Energy Hills", playable: false, companion: null },
  { id: "eat-healthier", name: "Nutrition Garden", playable: false, companion: null },
  { id: "move-more", name: "Movement Peaks", playable: false, companion: null },
  { id: "healthy-weight", name: "Balance Meadow", playable: false, companion: null },
  { id: "natural-wellness", name: "Natural Living Forest", playable: false, companion: null },
  { id: "health-concern", name: "HealthClues Realm", playable: true, companion: "Lumi" },
] as const;

export type HealthCluesRegionId = typeof HEALTHCLUES_REGIONS[number]["id"];
export const PLAYABLE_HEALTHCLUES_REGION_IDS = HEALTHCLUES_REGIONS.filter(region => region.playable).map(region => region.id);
export function isPlayableHealthCluesRegion(id: string): id is HealthCluesRegionId {
  return HEALTHCLUES_REGIONS.some(region => region.id === id && region.playable);
}

