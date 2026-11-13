/**
 * Walkable Road Network and Pathfinding for HealthClues Mobile RPG World
 * Derived from canonical 16:9 1600x900 Blueprint (authoredPaths)
 */

export interface Point {
  x: number;
  y: number;
}

const s = 1.5625; // Scale factor 1600 / 1024
const pt = (x: number, y: number): Point => ({
  x: Math.round(x * s),
  y: Math.round(y * s),
});

export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 900;
export const WALK_CORRIDOR_WIDTH = 55; // Half width corridor allowance in pixels

// Canonical authored paths for the 1600x900 scene
export const AUTHORED_PATHS: Point[][] = [
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

  // 4. Central plaza NW to Knowledge Library (extending cleanly up to front steps)
  [pt(420, 395), pt(385, 365), pt(365, 325), pt(320, 290), pt(280, 275), pt(276, 225)],

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

  // 12. South-West road exit (Trail explorer walk on ground walkway)
  [{ x: 260, y: 740 }, { x: 330, y: 690 }, { x: 384, y: 650 }, { x: 430, y: 660 }],
];

// Distance from point to line segment
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

// Find closest point on line segment
export function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { x: a.x, y: a.y };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return {
    x: Math.round(a.x + t * dx),
    y: Math.round(a.y + t * dy),
  };
}

// Check if point is inside walkable boundary (corridor)
export function isWalkable(p: Point): boolean {
  for (const path of AUTHORED_PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      if (distanceToSegment(p, path[i], path[i + 1]) <= WALK_CORRIDOR_WIDTH) {
        return true;
      }
    }
  }
  return false;
}

// Snap any point (e.g. clicking on house roof, lake, mountain) to nearest walkable road point
export function snapToWalkableRoad(p: Point): Point {
  let bestPoint = p;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const path of AUTHORED_PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const candidate = closestPointOnSegment(p, path[i], path[i + 1]);
      const dist = Math.hypot(p.x - candidate.x, p.y - candidate.y);
      if (dist < minDistance) {
        minDistance = dist;
        bestPoint = candidate;
      }
    }
  }

  return bestPoint;
}

// All major junction nodes for waypoint routing
export const JUNCTION_NODES: Point[] = [
  pt(490, 442), // Hub Center
  pt(490, 388), // Hub North
  pt(490, 496), // Hub South
  pt(325, 442), // Hub West
  pt(655, 442), // Hub East
  pt(360, 415), // Hub NW inner
  pt(420, 395), // Hub NW outer
  pt(560, 395), // Hub NE outer
  pt(620, 415), // Hub NE inner
  pt(360, 470), // Hub SW
  pt(420, 490), // Hub SW outer
  pt(560, 490), // Hub SE outer
  pt(620, 470), // Hub SE inner
  pt(140, 415), // Clinic / Camp
  pt(280, 275), // Knowledge Library walkway
  pt(276, 225), // Knowledge Library front steps
  pt(504, 240), // Fountain Center
  pt(735, 265), // Greenhouse
  pt(815, 415), // Lotus Sanctuary
  pt(885, 490), // Lake Pier
  { x: 330, y: 690 }, // Trail walkway lower
  { x: 384, y: 650 }, // Trail Explorer
  { x: 430, y: 660 }, // Trail Approach
  { x: 380, y: 670 }, // Central Camp Ground Approach
];

// Simple waypoint router along the road network
export function buildRoadWaypoints(start: Point, destination: Point): Point[] {
  const safeStart = isWalkable(start) ? start : snapToWalkableRoad(start);
  const safeDest = isWalkable(destination) ? destination : snapToWalkableRoad(destination);

  // If start and dest are very close or already in line of sight without crossing non-walkable:
  const directDist = Math.hypot(safeDest.x - safeStart.x, safeDest.y - safeStart.y);
  if (directDist < 120) {
    return [safeDest];
  }

  // Find nearest junction node to start and destination
  let startJunction: Point = safeStart;
  let minStartDist = Number.POSITIVE_INFINITY;
  let destJunction: Point = safeDest;
  let minDestDist = Number.POSITIVE_INFINITY;

  for (const node of JUNCTION_NODES) {
    const dStart = Math.hypot(safeStart.x - node.x, safeStart.y - node.y);
    if (dStart < minStartDist) {
      minStartDist = dStart;
      startJunction = node;
    }
    const dDest = Math.hypot(safeDest.x - node.x, safeDest.y - node.y);
    if (dDest < minDestDist) {
      minDestDist = dDest;
      destJunction = node;
    }
  }

  // Intermediate hub central point if going from West/NW to East/SE
  const hubCenter = pt(490, 442);
  const waypoints: Point[] = [];

  if (startJunction !== safeStart && minStartDist > 40) {
    waypoints.push(startJunction);
  }

  // If crosses across the map center (dx > 400), route via central plaza hub
  if (Math.abs(destJunction.x - startJunction.x) > 350) {
    waypoints.push(hubCenter);
  }

  if (destJunction !== safeDest && minDestDist > 40 && destJunction !== startJunction) {
    waypoints.push(destJunction);
  }

  waypoints.push(safeDest);
  return waypoints;
}
