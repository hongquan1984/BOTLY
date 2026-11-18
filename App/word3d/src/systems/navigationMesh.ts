import * as THREE from 'three';
import { ObstacleCollider } from './villageBuilder';

export interface PathNode {
  x: number;
  z: number;
  gridX: number;
  gridZ: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class IslandNavMesh {
  private cellSize: number = 0.4;
  private minX: number = -20.0;
  private maxX: number = 20.0;
  private minZ: number = -20.0;
  private maxZ: number = 20.0;
  private gridWidth: number;
  private gridHeight: number;
  private walkableGrid: boolean[][];
  private colliders: ObstacleCollider[] = [];

  constructor(colliders: ObstacleCollider[]) {
    this.colliders = colliders;
    this.gridWidth = Math.ceil((this.maxX - this.minX) / this.cellSize);
    this.gridHeight = Math.ceil((this.maxZ - this.minZ) / this.cellSize);
    this.walkableGrid = [];

    this.buildGrid();
  }

  public updateColliders(colliders: ObstacleCollider[]) {
    this.colliders = colliders;
    this.buildGrid();
  }

  private buildGrid() {
    this.walkableGrid = [];
    const islandRadius = 18.8;
    const charRadius = 0.55; // clearance buffer

    for (let gx = 0; gx < this.gridWidth; gx++) {
      this.walkableGrid[gx] = [];
      const worldX = this.minX + (gx + 0.5) * this.cellSize;

      for (let gz = 0; gz < this.gridHeight; gz++) {
        const worldZ = this.minZ + (gz + 0.5) * this.cellSize;

        // 1. Check if inside island perimeter
        const dist = Math.hypot(worldX, worldZ);
        if (dist >= islandRadius) {
          this.walkableGrid[gx][gz] = false;
          continue;
        }

        // 2. Check bridge corridors across the stream (permeable walkways over water)
        // Bridge 1: Main Wooden Arched Bridge at (-0.8, 1.2), rot: 0.65 rad
        const b1Dx = worldX - (-0.8);
        const b1Dz = worldZ - 1.2;
        const b1Lx = b1Dx * Math.cos(0.65) - b1Dz * Math.sin(0.65);
        const b1Lz = b1Dx * Math.sin(0.65) + b1Dz * Math.cos(0.65);
        const onBridge1 = Math.abs(b1Lx) <= 2.4 && Math.abs(b1Lz) <= 0.68;

        // Bridge 2: Upper Wooden Bridge at (4.023, -5.914), rot: 2.49 rad
        const b2Dx = worldX - 4.023;
        const b2Dz = worldZ - (-5.914);
        const b2Lx = b2Dx * Math.cos(2.491) - b2Dz * Math.sin(2.491);
        const b2Lz = b2Dx * Math.sin(2.491) + b2Dz * Math.cos(2.491);
        const onBridge2 = Math.abs(b2Lx) <= 2.4 && Math.abs(b2Lz) <= 0.68;

        const onAnyBridge = onBridge1 || onBridge2;

        // 3. Water obstruction (river stream & pond): strictly non-walkable unless on a bridge
        if (!onAnyBridge) {
          const riverDist = Math.abs(worldX * 0.7 - worldZ * 0.7 + 0.8);
          const inRiver = riverDist < 1.7;
          const inPond = Math.hypot(worldX - 6.5, worldZ - 3.5) < 3.5;

          if (inRiver || inPond) {
            this.walkableGrid[gx][gz] = false;
            continue;
          }
        }

        // 4. Check collision with building and obstacle colliders
        let blocked = false;
        for (const col of this.colliders) {
          if (col.radius) {
            const d = Math.hypot(worldX - col.centerX, worldZ - col.centerZ);
            if (d < col.radius + charRadius) {
              blocked = true;
              break;
            }
          } else {
            if (
              worldX >= col.minX - charRadius &&
              worldX <= col.maxX + charRadius &&
              worldZ >= col.minZ - charRadius &&
              worldZ <= col.maxZ + charRadius
            ) {
              blocked = true;
              break;
            }
          }
        }

        this.walkableGrid[gx][gz] = !blocked;
      }
    }
  }

  public isWalkable(worldX: number, worldZ: number): boolean {
    const gx = Math.floor((worldX - this.minX) / this.cellSize);
    const gz = Math.floor((worldZ - this.minZ) / this.cellSize);
    if (gx < 0 || gx >= this.gridWidth || gz < 0 || gz >= this.gridHeight) return false;
    return this.walkableGrid[gx][gz];
  }

  private worldToGrid(x: number, z: number): [number, number] {
    const gx = Math.max(0, Math.min(this.gridWidth - 1, Math.floor((x - this.minX) / this.cellSize)));
    const gz = Math.max(0, Math.min(this.gridHeight - 1, Math.floor((z - this.minZ) / this.cellSize)));
    return [gx, gz];
  }

  private gridToWorld(gx: number, gz: number): [number, number] {
    return [
      this.minX + (gx + 0.5) * this.cellSize,
      this.minZ + (gz + 0.5) * this.cellSize,
    ];
  }

  public findNearestWalkable(worldX: number, worldZ: number): [number, number] | null {
    if (this.isWalkable(worldX, worldZ)) return [worldX, worldZ];

    const [startGx, startGz] = this.worldToGrid(worldX, worldZ);
    for (let r = 1; r <= 10; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r || Math.abs(dz) === r) {
            const gx = startGx + dx;
            const gz = startGz + dz;
            if (gx >= 0 && gx < this.gridWidth && gz >= 0 && gz < this.gridHeight) {
              if (this.walkableGrid[gx][gz]) {
                return this.gridToWorld(gx, gz);
              }
            }
          }
        }
      }
    }
    return null;
  }

  // A* Pathfinding across cobblestone village roads
  public findPath(
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number
  ): THREE.Vector3[] {
    const safeTarget = this.findNearestWalkable(targetX, targetZ);
    if (!safeTarget) return [];

    const [dstX, dstZ] = safeTarget;
    const [startGx, startGz] = this.worldToGrid(startX, startZ);
    const [targetGx, targetGz] = this.worldToGrid(dstX, dstZ);

    if (startGx === targetGx && startGz === targetGz) {
      return [new THREE.Vector3(dstX, 1.8, dstZ)];
    }

    const openSet: PathNode[] = [];
    const closedSet: boolean[][] = Array.from({ length: this.gridWidth }, () =>
      Array(this.gridHeight).fill(false)
    );

    const startNode: PathNode = {
      x: startX,
      z: startZ,
      gridX: startGx,
      gridZ: startGz,
      g: 0,
      h: Math.hypot(startGx - targetGx, startGz - targetGz),
      f: Math.hypot(startGx - targetGx, startGz - targetGz),
      parent: null,
    };

    openSet.push(startNode);

    const directions = [
      [1, 0, 1.0],
      [-1, 0, 1.0],
      [0, 1, 1.0],
      [0, -1, 1.0],
      [1, 1, 1.414],
      [-1, 1, 1.414],
      [1, -1, 1.414],
      [-1, -1, 1.414],
    ];

    let foundTargetNode: PathNode | null = null;
    let iterations = 0;
    const maxIterations = 3000;

    while (openSet.length > 0 && iterations++ < maxIterations) {
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }

      const current = openSet.splice(lowestIndex, 1)[0];
      closedSet[current.gridX][current.gridZ] = true;

      if (current.gridX === targetGx && current.gridZ === targetGz) {
        foundTargetNode = current;
        break;
      }

      for (const [dx, dz, cost] of directions) {
        const nx = current.gridX + dx;
        const nz = current.gridZ + dz;

        if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridHeight) continue;
        if (closedSet[nx][nz] || !this.walkableGrid[nx][nz]) continue;

        if (dx !== 0 && dz !== 0) {
          if (!this.walkableGrid[current.gridX + dx][current.gridZ] ||
              !this.walkableGrid[current.gridX][current.gridZ + dz]) {
            continue;
          }
        }

        const gScore = current.g + cost;
        const existing = openSet.find((n) => n.gridX === nx && n.gridZ === nz);

        if (!existing) {
          const h = Math.hypot(nx - targetGx, nz - targetGz);
          const [wx, wz] = this.gridToWorld(nx, nz);
          openSet.push({
            x: wx,
            z: wz,
            gridX: nx,
            gridZ: nz,
            g: gScore,
            h,
            f: gScore + h,
            parent: current,
          });
        } else if (gScore < existing.g) {
          existing.g = gScore;
          existing.f = gScore + existing.h;
          existing.parent = current;
        }
      }
    }

    if (!foundTargetNode) {
      return [];
    }

    const rawPath: THREE.Vector3[] = [];
    let curr: PathNode | null = foundTargetNode;
    while (curr) {
      rawPath.unshift(new THREE.Vector3(curr.x, 1.8, curr.z));
      curr = curr.parent;
    }

    if (rawPath.length > 0) {
      rawPath[rawPath.length - 1].set(dstX, 1.8, dstZ);
    }

    return this.smoothPath(rawPath);
  }

  private hasLineOfSight(p1: THREE.Vector3, p2: THREE.Vector3): boolean {
    const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const steps = Math.ceil(dist / 0.15); // Fine 15cm collision testing
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const z = p1.z + (p2.z - p1.z) * t;
      if (!this.isWalkable(x, z)) {
        return false;
      }
    }
    return true;
  }

  private smoothPath(path: THREE.Vector3[]): THREE.Vector3[] {
    if (path.length <= 2) return path;

    const smoothed: THREE.Vector3[] = [path[0]];
    let currentIdx = 0;

    while (currentIdx < path.length - 1) {
      let furthestVisible = currentIdx + 1;
      for (let testIdx = currentIdx + 2; testIdx < path.length; testIdx++) {
        if (this.hasLineOfSight(path[currentIdx], path[testIdx])) {
          furthestVisible = testIdx;
        }
      }
      smoothed.push(path[furthestVisible]);
      currentIdx = furthestVisible;
    }

    return smoothed;
  }
}
