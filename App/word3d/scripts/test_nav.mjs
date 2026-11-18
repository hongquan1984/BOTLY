import { IslandNavMesh } from '../src/systems/navigationMesh.ts';
import { INTERACTIVE_LOCATIONS } from '../src/data/locations.ts';

// Colliders mimicking villageBuilder
const colliders = [
  { id: 'lumis-house-mesh', centerX: -9.2, centerZ: 7.5, minX: -11.3, maxX: -7.1, minZ: 5.5, maxZ: 9.5 },
  { id: 'knowledge-library-mesh', centerX: 11.5, centerZ: 6.0, minX: 8.4, maxX: 14.6, minZ: 3.25, maxZ: 8.75 },
  { id: 'herbal-greenhouse-mesh', centerX: 8.2, centerZ: -11.2, minX: 6.1, maxX: 10.3, minZ: -13.1, maxZ: -9.3 },
  { id: 'herbal-gazebo-mesh', centerX: 10.8, centerZ: -8.0, minX: 9.2, maxX: 12.4, minZ: -9.6, maxZ: -6.4 },
  { id: 'blacksmith-mesh', centerX: 4.5, centerZ: 11.5, minX: 2.1, maxX: 6.9, minZ: 9.25, maxZ: 13.75 },
  { id: 'mill-mesh', centerX: -3.8, centerZ: 12.0, minX: -5.9, maxX: -1.7, minZ: 9.9, maxZ: 14.1 },
  { id: 'bell-tower-mesh', centerX: -12.5, centerZ: 2.5, minX: -14.3, maxX: -10.7, minZ: 0.7, maxZ: 4.3 },
  { id: 'fantasy-house-2-mesh', centerX: -13.0, centerZ: -2.0, minX: -15.25, maxX: -10.75, minZ: -4.1, maxZ: 0.1 },
  { id: 'fantasy-house-3-mesh', centerX: 1.2, centerZ: -12.5, minX: -1.0, maxX: 3.4, minZ: -14.5, maxZ: -10.5 },
  { id: 'well', centerX: -0.2, centerZ: 0.0, radius: 1.3, minX: -1.5, maxX: 1.1, minZ: -1.3, maxZ: 1.3 },
  { id: 'market_stand', centerX: 2.8, centerZ: 1.8, radius: 1.4, minX: 1.4, maxX: 4.2, minZ: 0.4, maxZ: 3.2 },
  { id: 'bonfire', centerX: -2.4, centerZ: -1.8, radius: 1.1, minX: -3.5, maxX: -1.3, minZ: -2.9, maxZ: -0.7 },
  { id: 'boulder-lake', centerX: -13.0, centerZ: -8.5, radius: 1.2, minX: -14.2, maxX: -11.8, minZ: -9.7, maxZ: -7.3 },
];

const nav = new IslandNavMesh(colliders);

console.log('Testing pathfinding between all 5 locations:');
const locs = INTERACTIVE_LOCATIONS;

for (let i = 0; i < locs.length; i++) {
  const from = locs[i];
  const to = locs[(i + 1) % locs.length];
  const isWalkable = nav.isWalkable(to.targetPos[0], to.targetPos[2]);
  const path = nav.findPath(from.targetPos[0], from.targetPos[2], to.targetPos[0], to.targetPos[2]);
  console.log(`From [${from.name}] to [${to.name}]:`);
  console.log(`  Target Walkable: ${isWalkable}, Path waypoints: ${path.length}`);
  if (path.length === 0) {
    console.log(`  Target pos:`, to.targetPos);
    console.log(`  Nearest walkable:`, nav.findNearestWalkable(to.targetPos[0], to.targetPos[2]));
  }
}
