
// Test NavMesh river blocking and bridge passability
function testRiverNavMesh() {
  const cellSize = 0.4; // fine resolution
  const minX = -18, maxX = 18;
  const minZ = -18, maxZ = 18;
  const gridWidth = Math.ceil((maxX - minX) / cellSize);
  const gridHeight = Math.ceil((maxZ - minZ) / cellSize);
  const walkableGrid = [];

  for (let gx = 0; gx < gridWidth; gx++) {
    walkableGrid[gx] = [];
    const wx = minX + (gx + 0.5) * cellSize;
    for (let gz = 0; gz < gridHeight; gz++) {
      const wz = minZ + (gz + 0.5) * cellSize;

      // 1. Island boundary
      if (Math.hypot(wx, wz) >= 17.5) {
        walkableGrid[gx][gz] = false;
        continue;
      }

      // 2. Check if on Bridge 1 (WoodenArchedBridge at -0.8, 1.2, rot: 0.65)
      const b1Dx = wx - (-0.8);
      const b1Dz = wz - 1.2;
      const b1Lx = b1Dx * Math.cos(0.65) - b1Dz * Math.sin(0.65);
      const b1Lz = b1Dx * Math.sin(0.65) + b1Dz * Math.cos(0.65);
      const onBridge1 = (Math.abs(b1Lx) <= 2.6 && Math.abs(b1Lz) <= 1.2);

      // Check Bridge 2 (at 4.02, -5.91)
      const b2Dist = Math.hypot(wx - 4.02, wz - (-5.91));
      const onBridge2 = b2Dist <= 1.4;

      if (onBridge1 || onBridge2) {
        walkableGrid[gx][gz] = true;
        continue;
      }

      // 3. River and pond water obstruction
      const riverDist = Math.abs(wx * 0.7 - wz * 0.7 + 0.8);
      const inRiver = riverDist < 1.7; // spans full stream across island
      const inPond = Math.hypot(wx - 6.5, wz - 3.5) < 3.5;

      if (inRiver || inPond) {
        walkableGrid[gx][gz] = false;
        continue;
      }

      walkableGrid[gx][gz] = true;
    }
  }

  // A* pathfinding helper
  function findPath(sx, sz, tx, tz) {
    function w2g(x, z) {
      return [
        Math.max(0, Math.min(gridWidth - 1, Math.floor((x - minX) / cellSize))),
        Math.max(0, Math.min(gridHeight - 1, Math.floor((z - minZ) / cellSize)))
      ];
    }
    const [sgx, sgz] = w2g(sx, sz);
    const [tgx, tgz] = w2g(tx, tz);

    const openSet = [{ gx: sgx, gz: sgz, g: 0, h: Math.hypot(sgx - tgx, sgz - tgz), f: 0, parent: null }];
    const closed = Array.from({ length: gridWidth }, () => Array(gridHeight).fill(false));

    let endNode = null;
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const curr = openSet.shift();

      if (curr.gx === tgx && curr.gz === tgz) {
        endNode = curr;
        break;
      }

      closed[curr.gx][curr.gz] = true;

      const dirs = [
        [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
        [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414]
      ];

      for (const [dx, dz, cost] of dirs) {
        const nx = curr.gx + dx;
        const nz = curr.gz + dz;
        if (nx < 0 || nx >= gridWidth || nz < 0 || nz >= gridHeight) continue;
        if (!walkableGrid[nx][nz] || closed[nx][nz]) continue;

        const g = curr.g + cost;
        const h = Math.hypot(nx - tgx, nz - tgz);
        const f = g + h;

        const existing = openSet.find(o => o.gx === nx && o.gz === nz);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = curr;
          }
        } else {
          openSet.push({ gx: nx, gz: nz, g, h, f, parent: curr });
        }
      }
    }

    if (!endNode) return null;
    const path = [];
    let n = endNode;
    while (n) {
      path.unshift([minX + (n.gx + 0.5) * cellSize, minZ + (n.gz + 0.5) * cellSize]);
      n = n.parent;
    }
    return path;
  }

  // Test: from Great Hall (-2.8, 4.2) to Plaza Well (2.2, -1.5)
  const path = findPath(-2.8, 4.2, 2.2, -1.5);
  console.log('Path found:', path !== null, 'nodes count:', path ? path.length : 0);

  // Check if path passes near bridge center (-0.8, 1.2)
  let passedBridge = false;
  let steppedInWaterOutsideBridge = false;

  for (const [wx, wz] of path) {
    const dBridge = Math.hypot(wx - (-0.8), wz - 1.2);
    if (dBridge < 1.4) passedBridge = true;

    const riverDist = Math.abs(wx * 0.7 - wz * 0.7 + 0.8);
    const inRiver = riverDist < 1.7 && wx > -8.5 && wx < 10.5 && wz > -8.5 && wz < 9.5;
    if (inRiver && dBridge >= 2.2) {
      steppedInWaterOutsideBridge = true;
    }
  }

  console.log('Passed bridge at (-0.8, 1.2):', passedBridge);
  console.log('Stepped in water outside bridge:', steppedInWaterOutsideBridge);
  console.log('Sample path points across stream:', path.filter((_, i) => i % 5 === 0));
}

testRiverNavMesh();
