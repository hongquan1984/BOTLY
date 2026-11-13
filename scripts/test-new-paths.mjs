// Full path validation script
const W = 1600;
const H = 900;
const s = 1.5625; // 1600 / 1024

const pt = (x, y) => ({ x: Math.round(x * s), y: Math.round(y * s) });

// Anchors
const anchors = {
  camp: pt(185, 270),
  campApproach: pt(185, 415),
  activity: pt(250, 390),
  activityApproach: pt(280, 415),
  activityNpc: pt(250, 415),
  library: pt(250, 140),
  libraryApproach: pt(280, 275),
  boss: pt(504, 160),
  bossApproach: pt(504, 265),
  garden: pt(750, 160),
  gardenApproach: pt(735, 265),
  gardenNpc: pt(700, 265),
  sanctuary: pt(825, 295),
  sanctuaryApproach: pt(815, 415),
  sanctuaryNpc: pt(775, 415),
  rewards: pt(860, 450),
  rewardsApproach: pt(860, 485),
  centerHub: pt(490, 442),
};

console.log('Scaled anchors:', anchors);

const paths = [
  // 1. Central Circular Plaza outer ring
  [
    pt(490, 388), pt(560, 395), pt(620, 415), pt(655, 442),
    pt(620, 470), pt(560, 490), pt(490, 496), pt(420, 490),
    pt(360, 470), pt(325, 442), pt(360, 415), pt(420, 395),
    pt(490, 388)
  ],
  // 2. Center hub spokes
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

// Test navigation algorithm from RegionMapScene
const PLAYER_CLEARANCE = 12;
const WALK_CORRIDOR_HALF_WIDTH = 43;
const NAV_CELL = 16;
const NAV_SAMPLE = 4;

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x; const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)) : 0;
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function insideWorld(point) {
  return point.x >= PLAYER_CLEARANCE && point.y >= PLAYER_CLEARANCE && point.x <= W - PLAYER_CLEARANCE && point.y <= H - PLAYER_CLEARANCE;
}

function walkable(point, paths) {
  if (!insideWorld(point)) return false;
  const maxDistance = WALK_CORRIDOR_HALF_WIDTH - PLAYER_CLEARANCE;
  return paths.some(path => path.slice(1).some((end, index) => distanceToSegment(point, path[index], end) <= maxDistance));
}

function segmentIsWalkable(start, end, paths) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const samples = Math.max(1, Math.ceil(distance / NAV_SAMPLE));
  for (let index = 0; index <= samples; index++) {
    const progress = index / samples;
    if (!walkable({ x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress }, paths)) return false;
  }
  return true;
}

function closestCell(point, paths) {
  const cols = Math.ceil(W / NAV_CELL); const rows = Math.ceil(H / NAV_CELL);
  const cellX = Math.floor(point.x / NAV_CELL); const cellY = Math.floor(point.y / NAV_CELL);
  let best = null; let bestDistance = Number.POSITIVE_INFINITY;
  for (let y = Math.max(0, cellY - 2); y <= Math.min(rows - 1, cellY + 2); y++) for (let x = Math.max(0, cellX - 2); x <= Math.min(cols - 1, cellX + 2); x++) {
    const center = { x: x * NAV_CELL + NAV_CELL / 2, y: y * NAV_CELL + NAV_CELL / 2 };
    if (!walkable(center, paths)) continue;
    const distance = Math.hypot(center.x - point.x, center.y - point.y);
    if (distance < bestDistance) { best = center; bestDistance = distance; }
  }
  return best && bestDistance <= NAV_CELL ? best : null;
}

function findPath(from, destination, paths) {
  if (!walkable(from, paths) || !walkable(destination, paths)) return [];
  const start = closestCell(from, paths); const finish = closestCell(destination, paths);
  if (!start || !finish || !segmentIsWalkable(from, start, paths) || !segmentIsWalkable(finish, destination, paths)) return [];
  const cols = Math.ceil(W / NAV_CELL); const rows = Math.ceil(H / NAV_CELL);
  const key = (p) => `${Math.floor(p.x / NAV_CELL)},${Math.floor(p.y / NAV_CELL)}`;
  const parse = (value) => { const [x, y] = value.split(',').map(Number); return { x: x * NAV_CELL + NAV_CELL / 2, y: y * NAV_CELL + NAV_CELL / 2 }; };
  const startKey = key(start); const goalKey = key(finish);
  if (startKey === goalKey) return segmentIsWalkable(from, destination, paths) ? [from, destination] : [];
  const open = new Set([startKey]); const cameFrom = new Map(); const g = new Map([[startKey, 0]]);
  const h = (p) => Math.hypot(p.x - finish.x, p.y - finish.y) / NAV_CELL;
  const f = new Map([[startKey, h(start)]]); const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let safety = cols * rows * 2;
  while (open.size && safety-- > 0) {
    let current = ''; let lowest = Number.POSITIVE_INFINITY;
    for (const node of open) { const score = f.get(node) ?? Infinity; if (score < lowest) { lowest = score; current = node; } }
    if (current === goalKey) {
      const route = [destination, finish]; let cursor = current;
      while (cameFrom.has(cursor)) { cursor = cameFrom.get(cursor); route.push(cursor === startKey ? start : parse(cursor)); }
      route.push(from);
      const result = route.reverse();
      return result.every((point, index) => index === 0 || segmentIsWalkable(result[index - 1], point, paths)) ? result : [];
    }
    open.delete(current); const at = parse(current);
    for (const [dx, dy] of dirs) {
      const next = { x: at.x + dx * NAV_CELL, y: at.y + dy * NAV_CELL };
      if (!walkable(next, paths) || !segmentIsWalkable(at, next, paths)) continue;
      if (dx && dy) {
        const horizontal = { x: at.x + dx * NAV_CELL, y: at.y };
        const vertical = { x: at.x, y: at.y + dy * NAV_CELL };
        if (!walkable(horizontal, paths) || !walkable(vertical, paths)) continue;
      }
      const nextKey = key(next); const candidate = (g.get(current) ?? Infinity) + (dx && dy ? 1.414 : 1);
      if (candidate >= (g.get(nextKey) ?? Infinity)) continue;
      cameFrom.set(nextKey, current); g.set(nextKey, candidate); f.set(nextKey, candidate + h(next)); open.add(nextKey);
    }
  }
  return [];
}

// Validate every approach point
const approaches = {
  camp: anchors.campApproach,
  activity: anchors.activityApproach,
  library: anchors.libraryApproach,
  boss: anchors.bossApproach,
  garden: anchors.gardenApproach,
  sanctuary: anchors.sanctuaryApproach,
  rewards: anchors.rewardsApproach,
  centerHub: anchors.centerHub,
};

let allPass = true;
for (const [name, pt] of Object.entries(approaches)) {
  const isWalk = walkable(pt, paths);
  console.log(`Approach '${name}' (${pt.x}, ${pt.y}) walkable:`, isWalk);
  if (!isWalk) allPass = false;
}

// Test pathfinding between all pairs of approaches
console.log('\n--- Testing Routes Between Landmarks ---');
const names = Object.keys(approaches);
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const fromName = names[i];
    const toName = names[j];
    const route = findPath(approaches[fromName], approaches[toName], paths);
    console.log(`Route ${fromName} -> ${toName}: ${route.length > 0 ? `PASS (${route.length} pts)` : 'FAIL'}`);
    if (route.length === 0) allPass = false;
  }
}

console.log('\nALL PASS:', allPass);
