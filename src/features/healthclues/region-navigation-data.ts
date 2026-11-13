/**
 * Shared 16:9 scene blueprint. Percent anchors are the approved logical
 * positions for both regions; the painted backgrounds place their landmarks
 * and connected paths against these stable coordinates.
 */
export type NavPoint = { x: number; y: number };
export type RegionNavData = { walkablePaths: NavPoint[][]; bridgeDecks: NavPoint[][] };
export const REGION_WORLD = { width: 1600, height: 900 } as const;

export const REGION_ANCHORS = {
  camp: { x: 18, y: 47 },
  garden: { x: 73, y: 28 },
  activity: { x: 24, y: 68 },
  sanctuary: { x: 81, y: 51 },
  library: { x: 24, y: 24 },
  boss: { x: 49, y: 28 },
  rewards: { x: 84, y: 78 },
} as const;

export const REGION_APPROACHES = {
  camp: { x: 18, y: 72 },
  garden: { x: 72, y: 46 },
  activity: { x: 27, y: 72 },
  sanctuary: { x: 80, y: 72 },
  library: { x: 27, y: 48 },
  boss: { x: 49, y: 46 },
  rewards: { x: 84, y: 84 },
  hub: { x: 48, y: 77 },
} as const;

export const REGION_NPCS = {
  botanist: { x: 68, y: 46 },
  explorer: { x: 24, y: 72 },
  wellness: { x: 76, y: 72 },
} as const;

const s = 1.5625; // 1600 / 1024
const pt = (x: number, y: number): NavPoint => ({ x: Math.round(x * s), y: Math.round(y * s) });

const authoredPaths: NavPoint[][] = [
  // 1. Central Circular Plaza outer ring (12-point ellipse)
  [
    pt(490, 388), pt(560, 395), pt(620, 415), pt(655, 442),
    pt(620, 470), pt(560, 490), pt(490, 496), pt(420, 490),
    pt(360, 470), pt(325, 442), pt(360, 415), pt(420, 395),
    pt(490, 388),
  ],
  // 2. Center hub radial spokes through center leaf emblem
  [pt(325, 442), pt(490, 442), pt(655, 442)],
  [pt(490, 388), pt(490, 442), pt(490, 496)],
  [pt(360, 415), pt(490, 442), pt(620, 470)],
  [pt(420, 395), pt(490, 442), pt(560, 490)],
  [pt(560, 395), pt(490, 442), pt(420, 490)],
  [pt(620, 415), pt(490, 442), pt(360, 470)],

  // 3. Central plaza to Camp/Clinic (West Road)
  [pt(325, 442), pt(280, 420), pt(230, 415), pt(185, 415), pt(140, 415)],

  // 4. Central plaza NW to Knowledge Library
  [pt(420, 395), pt(385, 365), pt(365, 325), pt(320, 290), pt(280, 275)],

  // 5. Cross road from Library branch to Fountain
  [pt(365, 325), pt(410, 295), pt(450, 265), pt(480, 250), pt(504, 240)],

  // 6. Central plaza straight North to Fountain
  [pt(490, 388), pt(495, 340), pt(500, 300), pt(504, 265)],

  // 7. Fountain apron circle
  [pt(480, 250), pt(455, 245), pt(475, 235), pt(504, 230), pt(535, 235), pt(555, 245), pt(530, 250), pt(504, 265), pt(480, 250)],

  // 8. Cross road from Fountain to Greenhouse
  [pt(530, 250), pt(560, 265), pt(595, 295), pt(635, 335)],

  // 9. Central plaza NE to Greenhouse
  [pt(560, 395), pt(600, 365), pt(635, 335), pt(680, 305), pt(735, 265)],

  // 10. Central plaza East to Wellness Sanctuary (Lotus Pavilion)
  [pt(655, 442), pt(720, 420), pt(765, 415), pt(815, 415)],

  // 11. Branch to Wooden Pier / Lake Dock
  [pt(765, 415), pt(785, 440), pt(805, 470), pt(840, 480), pt(860, 485), pt(885, 490)],

  // 12. South-West road exit
  [pt(360, 470), pt(310, 520), pt(260, 560), pt(240, 575)],
];

const sharedRegion = (): RegionNavData => ({ walkablePaths: authoredPaths, bridgeDecks: [] });

export const REGION_NAVIGATION: Record<"sleep-better" | "health-concern", RegionNavData> = {
  "sleep-better": sharedRegion(),
  "health-concern": sharedRegion(),
};
