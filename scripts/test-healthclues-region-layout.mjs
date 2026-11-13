import assert from "node:assert/strict";
import { REGION_ANCHORS, REGION_APPROACHES, REGION_NPCS, REGION_NAVIGATION, REGION_WORLD } from "../src/features/healthclues/region-navigation-data.ts";

const distanceToSegment = (point, start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)) : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
};
const toWorld = anchor => ({ x: REGION_WORLD.width * anchor.x / 100, y: REGION_WORLD.height * anchor.y / 100 });
const keys = ["camp", "garden", "activity", "sanctuary", "library", "boss", "rewards"];
const expected = { camp: [18, 47], garden: [73, 28], activity: [24, 68], sanctuary: [81, 51], library: [24, 24], boss: [49, 28], rewards: [84, 78] };
assert.deepEqual([REGION_WORLD.width, REGION_WORLD.height], [1600, 900], "both regions use one 16:9 world coordinate space");
for (const key of keys) assert.deepEqual([REGION_ANCHORS[key].x, REGION_ANCHORS[key].y], expected[key], `${key} stays on the approved shared blueprint`);

for (const regionId of ["sleep-better", "health-concern"]) {
  const network = REGION_NAVIGATION[regionId];
  assert.ok(network.walkablePaths.length >= 1, `${regionId} routes are authored as a connected route graph`);
  assert.equal(network.bridgeDecks.length, 0, `${regionId} gameplay does not require a bridge`);
  
  for (const key of keys) {
    const approach = toWorld(REGION_APPROACHES[key]);
    const onPath = network.walkablePaths.some(path =>
      path.slice(1).some((end, index) => distanceToSegment(approach, path[index], end) <= 31)
    );
    assert.ok(onPath, `${regionId} ${key} approach lies within walkable clearance of the connected path`);
  }
  
  for (const path of network.walkablePaths) {
    assert.ok(path.every(point => point.x > 0 && point.x < REGION_WORLD.width && point.y > 0 && point.y < REGION_WORLD.height), `${regionId} route stays inside the world`);
  }
  console.log(`${regionId}: shared seven-location blueprint, verified connected stone paths across ${network.walkablePaths.length} routes`);
}
