import * as THREE from 'three';

export interface IslandGrassSystem {
  grassMesh: THREE.Mesh;
  update: (time: number) => void;
  getElevation: (x: number, z: number) => number;
}

/**
 * Analytical boundary of the squircle floating island
 */
export function getIslandBoundary(angle: number, radiusX = 18.0, radiusZ = 18.5) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const p = 0.75; // Organic squircle shape
  const sqX = Math.sign(cosA) * Math.pow(Math.abs(cosA), p);
  const sqZ = Math.sign(sinA) * Math.pow(Math.abs(sinA), p);
  const wobble = 1.0 + 0.06 * Math.sin(angle * 5 + 1.2) + 0.04 * Math.cos(angle * 7 - 0.6);
  return {
    x: sqX * radiusX * wobble,
    z: sqZ * radiusZ * wobble,
    r: Math.hypot(sqX * radiusX * wobble, sqZ * radiusZ * wobble),
  };
}

/**
 * Evaluates smooth natural terrain elevation across the entire island
 */
export function getIslandGrassElevation(x: number, z: number, tRadial = -1): number {
  let y = 1.82; // Base elevation matching village buildings and road anchor

  let t = tRadial;
  if (t < 0) {
    const angle = Math.atan2(z, x);
    const b = getIslandBoundary(angle);
    t = Math.hypot(x, z) / Math.max(1.0, b.r);
  }

  // 1. Watermill terrace hill on upper-left ([-7, -7])
  const distWatermill = Math.hypot(x + 7.0, z + 7.0);
  if (distWatermill < 8.5) {
    const hillWeight = Math.max(0, 1.0 - distWatermill / 8.5);
    y += 1.42 * Math.pow(hillWeight, 1.5);
  }

  // 2. River stream canyon & bed depression
  const riverDist = Math.abs(x * 0.7 - z * 0.7 + 0.8);
  if (riverDist < 2.2 && x > -8.5 && x < 10.5 && z > -8.5 && z < 9.5) {
    const inBed = Math.max(0, 1.0 - riverDist / 2.2);
    y -= 0.38 * Math.sin(inBed * Math.PI * 0.5);
  }

  // 3. Pond depression on the right ([6.5, 3.5])
  const pondDist = Math.hypot(x - 6.5, z - 3.5);
  if (pondDist < 4.2) {
    const inPond = Math.max(0, 1.0 - pondDist / 4.2);
    y -= 0.35 * Math.sin(inPond * Math.PI * 0.5);
  }

  // 4. Soft organic rolling meadow undulation
  y += Math.sin(x * 0.75) * Math.cos(z * 0.75) * 0.09 + Math.sin(x * 1.5 + 0.6) * Math.cos(z * 1.3) * 0.03;

  // 5. Outer perimeter rollover: when t > 0.86, smooth rounded downward curve meeting rocky cliff rim
  if (t > 0.86) {
    const edgeT = (t - 0.86) / (1.0 - 0.86);
    y -= edgeT * edgeT * 0.48;
  }

  return y;
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  if (l2 === 0) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

const pathSegments = [
  { ax: -2.8, az: 4.2, bx: -0.8, bz: 1.2 },  // Great Hall to Bridge
  { ax: -0.8, az: 1.2, bx: 2.2, bz: -1.5 },   // Bridge to Plaza Well
  { ax: 2.2, az: -1.5, bx: 4.8, bz: -4.5 },   // Plaza Well to Lumi Store
  { ax: 2.2, az: -1.5, bx: -4.5, bz: -1.8 },  // Plaza Well to Library
  { ax: 2.2, az: -1.5, bx: 0.5, bz: -2.8 },   // Plaza Well to Potion Shop
  { ax: 2.2, az: -1.5, bx: -2.2, bz: -4.2 },  // Plaza Well to Watermill trail lower
  { ax: -2.2, az: -4.2, bx: -6.5, bz: -7.2 }, // Trail climbing to Watermill terrace
];

// Rich highland meadow palette
const colLawnLush = new THREE.Color('#58b438');   // Vibrant fresh green
const colLawnDeep = new THREE.Color('#3f8628');   // Deep rich clover green
const colLawnSunlit = new THREE.Color('#6dc745'); // Warm golden sunlit tips
const colPathEarth = new THREE.Color('#78634a');  // Warm beaten footpath earth
const colPathGravel = new THREE.Color('#5c4e3e'); // Weathered gravel footpath rim
const colRiverEarth = new THREE.Color('#423528'); // Moist riverbed soil
const colLoamRim = new THREE.Color('#453123');    // Dark rich soil rim
const colCliffRim = new THREE.Color('#5a4e44');   // Sedimentary cliff edge

function evaluateVertexColor(x: number, y: number, z: number, t: number): THREE.Color {
  const c = new THREE.Color();

  // 1. Natural multi-frequency procedural grass variation
  const n1 = (Math.sin(x * 0.6 + z * 0.5) + 1.0) * 0.5;
  const n2 = (Math.sin(x * 1.8 - z * 1.5 + 1.2) + 1.0) * 0.5;
  const n3 = (Math.cos(x * 3.4 + z * 2.8) + 1.0) * 0.5;
  const grassBlend = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

  c.copy(colLawnLush).lerp(colLawnDeep, grassBlend);

  // Sunlit warmth on elevated hills & ridges
  if (y > 1.82) {
    const sunlitWeight = Math.min(1.0, (y - 1.82) * 0.7);
    c.lerp(colLawnSunlit, sunlitWeight * 0.75);
  }

  // 2. Landmark Walking Paths Blending
  let minPathDist = 999.0;
  for (let p = 0; p < pathSegments.length; p++) {
    const seg = pathSegments[p];
    const d = distToSegment(x, z, seg.ax, seg.az, seg.bx, seg.bz);
    if (d < minPathDist) minPathDist = d;
  }

  const pathWidth = 1.25;
  if (minPathDist < pathWidth) {
    const pathFactor = Math.pow((pathWidth - minPathDist) / pathWidth, 1.2);
    const gravelNoise = (Math.sin(x * 6.0 + z * 6.0) + 1.0) * 0.5;
    const pathTone = colPathEarth.clone().lerp(colPathGravel, gravelNoise * 0.55);
    c.lerp(pathTone, pathFactor * 0.88);
  }

  // 3. River stream canyon & pond edge (moist soil & silt)
  const riverDist = Math.abs(x * 0.7 - z * 0.7 + 0.8);
  if (riverDist < 2.4 && x > -8.5 && x < 10.5 && z > -8.5 && z < 9.5) {
    const riverFactor = Math.pow((2.4 - riverDist) / 2.4, 1.5);
    c.lerp(colRiverEarth, riverFactor * 0.78);
  }

  // 4. Outer perimeter rollover into rocky cliff rim
  if (t > 0.86) {
    const rimWeight = Math.min(1.0, (t - 0.86) / (1.0 - 0.86));
    const rimTarget = colLoamRim.clone().lerp(colCliffRim, rimWeight * 0.7);
    c.lerp(rimTarget, rimWeight * 0.85);
  }

  return c;
}

/**
 * Builds the realistic high-density organic terrain geometry (no radial spokes!)
 */
export function buildIslandGrassGeometry(rings = 68, segments = 136): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Center vertex (Ring 0)
  const centerY = getIslandGrassElevation(0, 0, 0);
  positions.push(0, centerY, 0);
  const centerCol = evaluateVertexColor(0, centerY, 0, 0);
  colors.push(centerCol.r, centerCol.g, centerCol.b);
  uvs.push(0.5, 0.5);

  // Rings from 1 to `rings`
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    const radiusFrac = Math.pow(t, 0.94);

    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const b = getIslandBoundary(angle);
      const x = b.x * radiusFrac;
      const z = b.z * radiusFrac;
      const y = getIslandGrassElevation(x, z, t);

      positions.push(x, y, z);

      const col = evaluateVertexColor(x, y, z, t);
      colors.push(col.r, col.g, col.b);

      uvs.push((x + 19.0) / 38.0, (z + 19.0) / 38.0);
    }
  }

  // Indices: Center ring fan
  for (let s = 0; s < segments; s++) {
    const nextS = (s + 1) % segments;
    indices.push(0, 1 + s, 1 + nextS);
  }

  // Ring quads
  for (let r = 1; r < rings; r++) {
    const currentRingStart = 1 + (r - 1) * segments;
    const nextRingStart = 1 + r * segments;

    for (let s = 0; s < segments; s++) {
      const nextS = (s + 1) % segments;

      const c0 = currentRingStart + s;
      const c1 = currentRingStart + nextS;
      const n0 = nextRingStart + s;
      const n1 = nextRingStart + nextS;

      indices.push(c0, n0, c1);
      indices.push(c1, n0, n1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return geo;
}

/**
 * Creates lightweight procedural high-detail micro-grass texture in memory
 */
function createProceduralGrassTexture(): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill lush meadow base
  ctx.fillStyle = '#62bf3f';
  ctx.fillRect(0, 0, size, size);

  // Paint fine grass blade flecks & clover patches
  for (let i = 0; i < 4000; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const len = 3 + Math.random() * 6;
    const ang = (Math.random() - 0.5) * 0.8 - Math.PI / 2;

    const shade = Math.random();
    if (shade > 0.6) {
      ctx.strokeStyle = 'rgba(125, 218, 86, 0.45)'; // bright blade tip
    } else if (shade > 0.25) {
      ctx.strokeStyle = 'rgba(74, 155, 46, 0.55)'; // rich mid blade
    } else {
      ctx.strokeStyle = 'rgba(48, 108, 30, 0.60)'; // dark blade base
    }

    ctx.lineWidth = 1.0 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
    ctx.stroke();
  }

  // Tiny wildflower petals (daisies & buttercups)
  for (let i = 0; i < 220; i++) {
    const fx = Math.random() * size;
    const fy = Math.random() * size;
    const petalType = Math.random();
    ctx.fillStyle = petalType > 0.5 ? 'rgba(255, 255, 220, 0.85)' : 'rgba(255, 225, 80, 0.9)';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.2 + Math.random() * 1.0, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(12, 12);
  map.anisotropy = 4;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  // Normal map canvas
  const norCanvas = document.createElement('canvas');
  norCanvas.width = size;
  norCanvas.height = size;
  const norCtx = norCanvas.getContext('2d')!;
  norCtx.fillStyle = 'rgb(128, 128, 255)'; // Flat tangent normal
  norCtx.fillRect(0, 0, size, size);

  // Normal perturb details
  for (let i = 0; i < 2500; i++) {
    const nx = Math.random() * size;
    const ny = Math.random() * size;
    const r = 120 + Math.floor(Math.random() * 18);
    const g = 120 + Math.floor(Math.random() * 18);
    norCtx.fillStyle = `rgb(${r}, ${g}, 255)`;
    norCtx.fillRect(nx, ny, 1 + Math.random() * 2, 2 + Math.random() * 4);
  }

  const normalMap = new THREE.CanvasTexture(norCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(12, 12);
  normalMap.needsUpdate = true;

  return { map, normalMap };
}

/**
 * Creates the realistic PBR grass material
 */
export function createRealisticIslandGrassMaterial(): {
  material: THREE.MeshStandardMaterial;
  uniforms: Record<string, THREE.IUniform>;
} {
  const { map, normalMap } = createProceduralGrassTexture();

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#55a338'),
    vertexColors: true,
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.82,
    metalness: 0.02,
    flatShading: false,
  });

  return { material: mat, uniforms: {} };
}

/**
 * Creates and attaches the realistic island grass system to the island group
 */
export function createRealisticIslandGrass(islandGroup: THREE.Group): IslandGrassSystem {
  const geo = buildIslandGrassGeometry(68, 136);
  const { material } = createRealisticIslandGrassMaterial();

  const grassMesh = new THREE.Mesh(geo, material);
  grassMesh.name = 'RealisticIslandGrass';
  grassMesh.receiveShadow = true;
  grassMesh.castShadow = false;

  islandGroup.add(grassMesh);

  return {
    grassMesh,
    update: (_time: number) => {},
    getElevation: getIslandGrassElevation,
  };
}
