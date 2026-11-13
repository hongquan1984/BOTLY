import * as THREE from 'three';
import { HybridAssetLoader } from '../assets/HybridAssetLoader';
import {
  createBarkTexture,
  createGraniteTextures,
  createLeafClusterTexture,
  createSoftShadowTexture,
  loadPolyHavenPBR,
} from '../textures/proceduralTextures';

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise2(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm2(x: number, z: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise2(x * freq, z * freq);
    freq *= 2.04;
    amp *= 0.5;
  }
  return v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getPeninsulaDistance(x: number, z: number): number {
  const frontShoreZ = 20.5 + Math.sin(x * 0.12) * 1.8 + Math.cos(x * 0.25) * 0.7;
  const rightShoreX = 11.2 + Math.sin(z * 0.11) * 1.9;
  const backShoreZ = -48.0;
  const leftShoreX = -32.0;

  const dx = Math.max(0, x - (rightShoreX - 5));
  const dz = Math.max(0, z - (frontShoreZ - 5));
  const cornerDist = Math.hypot(dx, dz) - 5.0;

  const dFront = z - frontShoreZ;
  const dRight = x - rightShoreX;
  const dBack = backShoreZ - z;
  const dLeft = leftShoreX - x;

  const baseMax = Math.max(dFront, dRight, dBack, dLeft);
  if (x > rightShoreX - 5 && z > frontShoreZ - 5) {
    return cornerDist;
  }
  return baseMax;
}

export function getGroundHeight(x: number, z: number): number {
  const penDist = getPeninsulaDistance(x, z);

  // Flat yard pad around extended chalet (Z: -10.3..+5.3), deck & stepping stones
  const padDist = Math.max(Math.abs(x + 1.0) - 13.0, Math.abs(z - 0.5) - 14.5);
  const flatHouseMask = smoothstep(0.0, 9.0, padDist);
  const microRoll = (fbm2(x * 0.08 + 5.2, z * 0.08 - 3.1, 3) - 0.5) * 0.20 * flatHouseMask;

  // Gentle shoreline slope into lake bed (distant mountains are rendered in 2.5D parallax backdrop)
  const lakeDrop = smoothstep(-1.1, 5.5, penDist) * -1.85;

  return microRoll + lakeDrop;
}

export function isGardenGrassForbidden(x: number, z: number): boolean {
  if (x > -7.5 && x < 5.7 && z > -6.1 && z < 9.35) return true;
  if (x > -5.5 && x < -2.9 && z >= 9.0 && z < 10.35) return true;
  if (getPeninsulaDistance(x, z) > -1.0) return true;
  for (const s of STEPPING_STONES) {
    if (Math.hypot(x - s.x, z - s.z) < s.r + 0.16) return true;
  }
  return false;
}

export const STEPPING_STONES: Array<{ x: number; z: number; r: number }> = [
  { x: -4.2, z: 10.6, r: 0.48 },
  { x: -3.75, z: 11.85, r: 0.45 },
  { x: -3.15, z: 13.15, r: 0.48 },
  { x: -2.45, z: 14.45, r: 0.44 },
  { x: -1.65, z: 15.75, r: 0.46 },
  { x: -0.75, z: 17.0, r: 0.43 },
  { x: 0.25, z: 18.15, r: 0.44 },
];

export interface EnvironmentBuildResult {
  group: THREE.Group;
  gardenSurface: THREE.Mesh;
  colliders: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; tag?: string }>;
  setHighDetail: (high: boolean) => void;
}

export function buildAlpineEnvironment(
  isMobile: boolean,
  assets?: HybridAssetLoader
): EnvironmentBuildResult {
  const group = new THREE.Group();
  const colliders: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; tag?: string }> = [];
  const shadowTex = createSoftShadowTexture();
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });

  // 1. Playable Peninsula 3D Terrain Mesh (110x110m lawn extending cleanly behind rear Bedroom window!)
  const segs = isMobile ? 36 : 52;
  const terrainSize = 110;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLawn = new THREE.Color('#53a522');
  const cWetBank = new THREE.Color('#6b6352');
  const cDryShore = new THREE.Color('#978c74');
  const cMeadow = new THREE.Color('#428426');
  const tmpCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i) - 8;
    const vz = pos.getZ(i) - 14;
    pos.setX(i, vx);
    pos.setZ(i, vz);
    pos.setY(i, getGroundHeight(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const nNoise = valueNoise2(vx * 0.06, vz * 0.06);

    if (vy < -0.25) {
      tmpCol.copy(cWetBank);
    } else if (vy < -0.04) {
      tmpCol.copy(cWetBank).lerp(cDryShore, smoothstep(-0.25, -0.04, vy));
    } else {
      tmpCol.copy(cLawn).lerp(cMeadow, nNoise * 0.38);
      if (vy < 0.06) {
        tmpCol.lerp(cDryShore, smoothstep(0.06, -0.04, vy) * 0.55);
      }
    }

    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Multi-layer Real CC0 1K PBR Grass Sets:
  // - ambientCG Grass001 (manicured chalet lawn)
  // - Poly Haven grass_ground (alpine meadow & lakeside)
  // - Poly Haven aerial_grass_rock (upper hillside slope & rocky edge)
  const acgLawnPBR = loadPolyHavenPBR('acg_grass001', 10, 10);
  const meadowPBR = loadPolyHavenPBR('grass_ground', 9, 9);
  const rockGrassPBR = loadPolyHavenPBR('aerial_grass_rock', 7, 7);

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    normalMap: acgLawnPBR.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: meadowPBR.roughnessMap,
    roughness: 0.92,
    metalness: 0.01,
    envMapIntensity: 0.24,
  });
  terrainMat.onBeforeCompile = (shader) => {
    shader.uniforms.uLawnTex = { value: acgLawnPBR.map };
    shader.uniforms.uMeadowTex = { value: meadowPBR.map };
    shader.uniforms.uRockGrassTex = { value: rockGrassPBR.map };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vTerrainWorldPos;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uLawnTex;
        uniform sampler2D uMeadowTex;
        uniform sampler2D uRockGrassTex;
        varying vec3 vTerrainWorldPos;
        float tHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float tNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), f.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        vec3 sampleAntiTile(sampler2D tex, vec2 wp, float sc) {
          vec2 uvA = wp * sc;
          vec2 uvB = mat2(0.80, 0.60, -0.60, 0.80) * wp * (sc * 0.68) + vec2(0.37, 0.71);
          float w = tNoise(wp * 0.16);
          vec3 col = mix(texture2D(tex, uvA).rgb, texture2D(tex, uvB).rgb, w);
          // Custom uniform textures are sampled raw; decode sRGB -> Linear for realistic AgX green depth
          return pow(max(col, vec3(0.001)), vec3(2.2));
        }`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float micro = tNoise(vTerrainWorldPos.xz * 0.42) * 0.62 + tNoise(vTerrainWorldPos.xz * 1.75) * 0.38;
        if (vTerrainWorldPos.y < 10.5) {
          vec3 pbrLawn = sampleAntiTile(uLawnTex, vTerrainWorldPos.xz, 0.32);
          vec3 pbrMeadow = sampleAntiTile(uMeadowTex, vTerrainWorldPos.xz, 0.24);
          vec3 pbrRockGrass = sampleAntiTile(uRockGrassTex, vTerrainWorldPos.xz, 0.17);

          float distHome = length(vTerrainWorldPos.xz - vec2(0.2, 5.5));
          float meadowPatchNoise = tNoise(vTerrainWorldPos.xz * 0.14);
          float meadowBlend = clamp(smoothstep(13.5, 22.0, distHome) * 0.72 + meadowPatchNoise * 0.25, 0.0, 1.0);
          float slopeBlend = smoothstep(0.95, 5.8, vTerrainWorldPos.y);

          vec3 grassAlbedo = mix(pbrLawn, pbrMeadow, meadowBlend);
          grassAlbedo = mix(grassAlbedo, pbrRockGrass, slopeBlend * 0.78);
          float grassMask = (1.0 - smoothstep(4.5, 10.5, vTerrainWorldPos.y)) * smoothstep(-0.28, 0.04, vTerrainWorldPos.y);
          vec3 modulatedTurf = grassAlbedo * vec3(0.76, 1.05, 0.68) * (0.88 + micro * 0.26);
          diffuseColor.rgb = mix(diffuseColor.rgb * (0.86 + micro * 0.28), modulatedTurf, grassMask * 0.88);
          float damp = smoothstep(0.05, -0.35, vTerrainWorldPos.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.62, damp);
        } else {
          // Craggy alpine granite strata & crisp snow ridges
          float strata = sin(vTerrainWorldPos.y * 0.95 + micro * 4.5) * 0.5 + 0.5;
          float rockDetail = mix(0.72, 1.22, strata * 0.55 + micro * 0.45);
          float snowWeight = smoothstep(26.0, 44.0, vTerrainWorldPos.y);
          diffuseColor.rgb *= mix(rockDetail, 0.96 + micro * 0.07, snowWeight);
        }`
      );
  };

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // Invisible raycast helper for lawn decoration placement
  const gardenSurfaceGeo = new THREE.PlaneGeometry(52, 46, 36, 36);
  gardenSurfaceGeo.rotateX(-Math.PI / 2);
  const gPos = gardenSurfaceGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const gx = gPos.getX(i) - 5;
    const gz = gPos.getZ(i) + 4;
    gPos.setX(i, gx);
    gPos.setZ(i, gz);
    gPos.setY(i, Math.max(0.0, getGroundHeight(gx, gz)));
  }
  gardenSurfaceGeo.computeVertexNormals();
  const gardenSurface = new THREE.Mesh(
    gardenSurfaceGeo,
    new THREE.MeshBasicMaterial({ visible: false })
  );
  group.add(gardenSurface);

  // 2. Granite Stepping Stones (with subtle PBR normals & contact shadows)
  const graniteTex = createGraniteTextures();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: graniteTex.map,
    normalMap: graniteTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: graniteTex.roughnessMap,
    color: '#d6d8d2',
    roughness: 0.88,
    metalness: 0.04,
  });

  STEPPING_STONES.forEach((st, idx) => {
    const stoneGeo = new THREE.CylinderGeometry(st.r, st.r * 1.07, 0.08, 18);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    const y = getGroundHeight(st.x, st.z);
    stone.position.set(st.x, y + 0.025, st.z);
    stone.scale.set(1.12, 1, 0.88 + (idx % 2) * 0.14);
    stone.rotation.y = idx * 0.85;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  });

  // 3. Shoreline Pebble & River Stone Band along peninsula water edge
  buildShorelinePebbles(group, stoneMat);

  // 4. Rustic Wooden Post-and-Rail Fence along the lakeside shore
  const fenceGroup = new THREE.Group();
  const fenceWoodMat = new THREE.MeshStandardMaterial({
    color: '#a36f3f',
    roughness: 0.84,
  });
  const fencePoints: Array<[number, number]> = [
    [-14.0, 18.8],
    [-10.6, 19.3],
    [-7.2, 19.6],
    [-3.8, 19.7],
    [-0.4, 19.5],
    [3.0, 19.0],
    [6.3, 18.2],
    [9.1, 16.5],
    [10.2, 13.4],
    [10.4, 10.0],
  ];

  for (let i = 0; i < fencePoints.length; i++) {
    const [fx, fz] = fencePoints[i];
    const fy = getGroundHeight(fx, fz);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.98, 0.14), fenceWoodMat);
    post.position.set(fx, fy + 0.45, fz);
    post.castShadow = true;
    post.receiveShadow = true;
    fenceGroup.add(post);

    if (i < fencePoints.length - 1) {
      const [nx, nz] = fencePoints[i + 1];
      const ny = getGroundHeight(nx, nz);
      const dx = nx - fx;
      const dz = nz - fz;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      for (const railH of [0.42, 0.78]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, len), fenceWoodMat);
        rail.position.set((fx + nx) * 0.5, (fy + ny) * 0.5 + railH, (fz + nz) * 0.5);
        rail.rotation.y = angle;
        rail.castShadow = true;
        rail.receiveShadow = true;
        fenceGroup.add(rail);
      }

      colliders.push({
        minX: Math.min(fx, nx) - 0.2,
        maxX: Math.max(fx, nx) + 0.2,
        minZ: Math.min(fz, nz) - 0.2,
        maxZ: Math.max(fz, nz) + 0.2,
        tag: 'fence',
      });
    }
  }
  group.add(fenceGroup);

  // 5. Real Photogrammetry Mossy Rock Clusters (rock_moss_set_01 & 02 GLB, instanced)
  const rockSpecs: Array<{ x: number; z: number; h: number; rotY: number; id: 'rock_moss_set_01' | 'rock_moss_set_02' }> = [
    { x: -11.3, z: 13.7, h: 0.78, rotY: 0.4, id: 'rock_moss_set_01' },
    { x: -6.6, z: 15.6, h: 0.66, rotY: 2.1, id: 'rock_moss_set_02' },
    { x: -3.2, z: 18.5, h: 0.58, rotY: 0.7, id: 'rock_moss_set_01' },
  ];

  const rockBuckets: Record<'rock_moss_set_01' | 'rock_moss_set_02', THREE.Matrix4[]> = {
    rock_moss_set_01: [],
    rock_moss_set_02: [],
  };
  const bDummy = new THREE.Object3D();

  for (const r of rockSpecs) {
    const gy = getGroundHeight(r.x, r.z);
    const sz = assets?.getSize(r.id);
    if (sz && sz.y > 0.01) {
      const s = r.h / sz.y;
      bDummy.position.set(r.x, gy - 0.04, r.z);
      bDummy.rotation.set(0, r.rotY, 0);
      bDummy.scale.setScalar(s);
      bDummy.updateMatrix();
      rockBuckets[r.id].push(bDummy.matrix.clone());
    }
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), contactShadowMat);
    cs.rotation.x = -Math.PI / 2;
    cs.position.set(r.x, gy + 0.015, r.z);
    group.add(cs);

    colliders.push({
      minX: r.x - 0.9,
      maxX: r.x + 0.9,
      minZ: r.z - 0.9,
      maxZ: r.z + 0.9,
      tag: 'boulder',
    });
  }

  for (const id of ['rock_moss_set_01', 'rock_moss_set_02'] as const) {
    if (rockBuckets[id].length > 0 && assets) {
      const batch = assets.createInstancedBatches(id, rockBuckets[id], {
        castShadow: false,
        receiveShadow: true,
      });
      if (batch) group.add(batch);
    }
  }

  // Real Botanical GLTF Instanced Clusters (Shrubs, Wildflowers, Ferns, Grass Clumps, Moss)
  buildInstancedGltfBotanicals(group, isMobile, assets);
  buildPathBollards(group);

  // 6. Broadleaf & Deciduous Trees Near House — procedural primary (GLB fallback)
  const tx = -12.4;
  const tz = 12.1;
  const heroTreeGltf = assets?.cloneNormalized('island_tree_02', 6.8);
  const treeGroup = heroTreeGltf ?? buildHeroDeciduousTree();
  treeGroup.position.set(tx, getGroundHeight(tx, tz) - 0.05, tz);
  treeGroup.rotation.y = 0.65;
  group.add(treeGroup);
  const treeShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), contactShadowMat);
  treeShadow.rotation.x = -Math.PI / 2;
  treeShadow.position.set(tx, getGroundHeight(tx, tz) + 0.015, tz);
  group.add(treeShadow);
  colliders.push({ minX: -13.1, maxX: -11.7, minZ: 11.4, maxZ: 12.8, tag: 'hero-tree' });

  // Side accent evergreen near right patio/fireplace window — Real CC0 GLB
  const sideTree = assets?.cloneNormalized('fir_sapling', 4.8) ?? assets?.cloneNormalized('pine_sapling_small', 4.8);
  if (sideTree) {
    const sideSpruceX = 6.8, sideSpruceZ = 8.2;
    sideTree.position.set(sideSpruceX, getGroundHeight(sideSpruceX, sideSpruceZ) - 0.05, sideSpruceZ);
    sideTree.rotation.y = 1.2;
    group.add(sideTree);
    const sideShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), contactShadowMat);
    sideShadow.rotation.x = -Math.PI / 2;
    sideShadow.position.set(sideSpruceX, getGroundHeight(sideSpruceX, sideSpruceZ) + 0.015, sideSpruceZ);
    group.add(sideShadow);
    colliders.push({ minX: 6.3, maxX: 7.3, minZ: 7.7, maxZ: 8.7, tag: 'side-tree' });
  }

  // Back-left accent evergreen — Real CC0 GLB
  const backSpruce = assets?.cloneNormalized('pine_sapling_small', 4.5) ?? assets?.cloneNormalized('fir_sapling', 4.5);
  if (backSpruce) {
    backSpruce.position.set(-11.0, getGroundHeight(-11.0, 1.5) - 0.05, 1.5);
    backSpruce.rotation.y = 2.8;
    group.add(backSpruce);
  }

  // 7. Near/Midground Real CC0 Alpine Pine GLBs (background forest is rendered in 2.5D parallax layers)
  buildNearPineGltfs(group, isMobile, assets);

  const setHighDetail = (_high: boolean) => {
    // Near 3D detail stays crisp; background 2.5D diorama has fixed 3 draw calls
  };

  return { group, gardenSurface, colliders, setHighDetail };
}

function buildShorelinePebbles(parent: THREE.Group, mat: THREE.Material): void {
  const count = 95;
  const geo = new THREE.DodecahedronGeometry(0.18, 1);
  geo.scale(1.25, 0.55, 0.95);
  const pebbles = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();

  let s = 313;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  let idx = 0;
  for (let i = 0; i < 360 && idx < count; i++) {
    const px = -20 + rand() * 34;
    const pz = -10 + rand() * 34;
    const d = getPeninsulaDistance(px, pz);
    if (d > -0.7 && d < 0.85) {
      const py = getGroundHeight(px, pz);
      dummy.position.set(px, py + 0.02, pz);
      dummy.rotation.set(rand() * 0.3, rand() * Math.PI * 2, rand() * 0.3);
      const sc = 0.6 + rand() * 1.45;
      dummy.scale.set(sc, sc * (0.7 + rand() * 0.4), sc);
      dummy.updateMatrix();
      pebbles.setMatrixAt(idx++, dummy.matrix);
    }
  }
  pebbles.count = idx;
  pebbles.receiveShadow = true;
  parent.add(pebbles);
}

function createCurvedTrunkGeo(botR: number, topR: number, height: number, bendX: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(topR, botR, height, 10, 6);
  geo.translate(0, height * 0.5, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = y / height;
    // Gentle organic S-bend + root flare at bottom
    p.setX(i, p.getX(i) + Math.sin(t * Math.PI * 0.85) * bendX);
    if (t < 0.14) {
      const flare = 1.0 + (0.14 - t) * 2.2;
      p.setX(i, p.getX(i) * flare);
      p.setZ(i, p.getZ(i) * flare);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function buildHeroDeciduousTree(): THREE.Group {
  const tree = new THREE.Group();
  const barkTex = createBarkTexture();
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    color: '#8a705b',
    roughness: 0.94,
  });
  const leafTex = createLeafClusterTexture();
  const leafMat = new THREE.MeshStandardMaterial({
    map: leafTex,
    alphaTest: 0.4,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });

  const trunk = new THREE.Mesh(createCurvedTrunkGeo(0.46, 0.26, 4.6, 0.28), barkMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const boughs: Array<{ pos: [number, number, number]; rot: [number, number, number]; len: number; r: number }> = [
    { pos: [1.35, 4.5, 0.15], rot: [0.1, 0.1, -0.82], len: 3.9, r: 0.15 },
    { pos: [3.2, 5.5, -0.5], rot: [-0.2, 0.2, -1.08], len: 3.6, r: 0.10 },
    { pos: [-0.6, 4.7, -0.8], rot: [-0.35, 0, 0.52], len: 2.8, r: 0.14 },
    { pos: [0.75, 5.1, 1.1], rot: [0.48, 0, -0.45], len: 2.7, r: 0.12 },
  ];
  for (const b of boughs) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.52, b.r, b.len, 8), barkMat);
    branch.position.set(...b.pos);
    branch.rotation.set(...b.rot);
    branch.castShadow = true;
    tree.add(branch);
  }

  const cardGeo = new THREE.PlaneGeometry(1.85, 1.85);
  const clusterCenters: Array<[number, number, number, number]> = [
    [0.25, 5.5, 0.1, 1.32],
    [1.85, 5.7, -0.2, 1.24],
    [3.35, 5.9, -0.6, 1.18],
    [4.65, 6.0, -0.9, 1.05],
    [5.85, 6.1, -1.1, 0.94],
    [-1.15, 5.3, -0.8, 1.18],
    [0.95, 5.5, 1.4, 1.15],
    [2.55, 5.4, 0.9, 1.1],
    [1.25, 6.4, -0.3, 1.15],
    [3.15, 6.5, -0.5, 1.05],
  ];

  clusterCenters.forEach(([lx, ly, lz, sc], idx) => {
    for (let k = 0; k < 3; k++) {
      const card = new THREE.Mesh(cardGeo, leafMat);
      card.position.set(lx + (k - 1) * 0.22, ly + (k === 1 ? 0.18 : -0.1), lz + (k - 1) * 0.15);
      card.rotation.set(0.35 * (k - 1), idx * 0.8 + k * 1.05, 0.25 * (k - 1));
      card.scale.setScalar(sc);
      card.castShadow = true;
      card.receiveShadow = true;
      tree.add(card);
    }
  });

  // Creamy-white spring Alpine blossoms clustered among the arching boughs
  const blossomMat = new THREE.MeshStandardMaterial({ color: '#faf6eb', roughness: 0.65 });
  const blossomGeo = new THREE.IcosahedronGeometry(0.09, 0);
  const blossomCount = 54;
  const blossoms = new THREE.InstancedMesh(blossomGeo, blossomMat, blossomCount);
  const bDummy = new THREE.Object3D();
  for (let i = 0; i < blossomCount; i++) {
    const [cx, cy, cz, sc] = clusterCenters[i % clusterCenters.length];
    const ang = i * 2.39996;
    const r = (0.2 + (i % 5) * 0.16) * sc;
    bDummy.position.set(cx + Math.cos(ang) * r, cy + Math.sin(i * 1.7) * 0.35, cz + Math.sin(ang) * r);
    bDummy.scale.setScalar(0.85 + (i % 3) * 0.25);
    bDummy.updateMatrix();
    blossoms.setMatrixAt(i, bDummy.matrix);
  }
  tree.add(blossoms);

  return tree;
}

function buildInstancedGltfBotanicals(
  parent: THREE.Group,
  isMobile: boolean,
  assets?: HybridAssetLoader
): void {
  if (!assets) return;

  let seed = 707;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const spawnSpecies = (
    assetId: string,
    sites: Array<{ x: number; z: number; count: number; radius: number }>,
    targetHMin: number,
    targetHMax: number,
    _castShadow: boolean,
    hueShiftRange = 0.04
  ) => {
    const size = assets.getSize(assetId);
    if (!size || size.y <= 0.001) return;
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    for (const site of sites) {
      const n = isMobile ? Math.max(1, Math.ceil(site.count * 0.6)) : site.count;
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 0.72) * site.radius;
        const x = site.x + Math.cos(a) * d;
        const z = site.z + Math.sin(a) * d;
        if (getPeninsulaDistance(x, z) > -0.7) continue;
        // Never overlap chalet or deck pad or stepping stones
        if (x > -7.3 && x < 5.5 && z > -5.7 && z < 9.15) continue;
        if (STEPPING_STONES.some((st) => Math.hypot(x - st.x, z - st.z) < st.r + 0.42)) continue;

        const y = getGroundHeight(x, z);
        const h = targetHMin + rand() * (targetHMax - targetHMin);
        const s = h / size.y;
        dummy.position.set(x, y - 0.02, z);
        dummy.rotation.set((rand() - 0.5) * 0.14, rand() * Math.PI * 2, (rand() - 0.5) * 0.14);
        dummy.scale.set(s * (0.85 + rand() * 0.3), s, s * (0.85 + rand() * 0.3));
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());

        const col = new THREE.Color().setHSL(
          0.26 + (rand() - 0.5) * hueShiftRange,
          0.10 + rand() * 0.10,
          0.92 + rand() * 0.14
        );
        colors.push(col);
      }
    }

    const batch = assets.createInstancedBatches(assetId, matrices, {
      colors,
      castShadow: false,
      receiveShadow: true,
    });
    if (batch) parent.add(batch);
  };

  // --- A. 3 Variants of Green Shrubs ---
  spawnSpecies(
    'shrub_02',
    [
      { x: -11.4, z: 12.2, count: 2, radius: 1.4 },
      { x: -7.5, z: 4.5, count: 2, radius: 1.5 },
      { x: 6.2, z: 9.2, count: 2, radius: 1.3 },
    ],
    0.55,
    0.85,
    true
  );
  spawnSpecies(
    'shrub_03',
    [
      { x: -10.2, z: 14.2, count: 3, radius: 1.6 },
      { x: 3.4, z: 9.4, count: 2, radius: 1.0 },
      { x: 7.5, z: 13.5, count: 2, radius: 1.5 },
    ],
    0.45,
    0.72,
    true
  );
  spawnSpecies(
    'shrub_04',
    [
      { x: -3.2, z: 18.8, count: 2, radius: 1.4 },
      { x: -8.8, z: 16.5, count: 2, radius: 1.6 },
      { x: 8.2, z: 6.2, count: 2, radius: 1.4 },
    ],
    0.50,
    0.80,
    true
  );

  // --- B. 6 Variants of Flowering Shrubs, Wildflowers & Ferns ---
  spawnSpecies(
    'periwinkle_plant',
    [
      { x: -10.5, z: 13.2, count: 2, radius: 1.4 },
      { x: -6.2, z: 15.5, count: 2, radius: 1.3 },
      { x: -8.5, z: 17.5, count: 2, radius: 1.4 },
    ],
    0.26,
    0.42,
    false
  );
  spawnSpecies(
    'flower_gazania',
    [
      { x: -11.0, z: 14.8, count: 4, radius: 1.3 },
      { x: -2.0, z: 9.45, count: 4, radius: 1.0 },
      { x: 2.2, z: 9.45, count: 4, radius: 1.2 },
      { x: 5.3, z: 8.8, count: 3, radius: 1.0 },
    ],
    0.26,
    0.38,
    false
  );
  spawnSpecies(
    'flower_empodium',
    [
      { x: -9.5, z: 14.2, count: 5, radius: 1.6 },
      { x: -7.4, z: 16.3, count: 4, radius: 1.4 },
      { x: 0.4, z: 9.45, count: 4, radius: 1.1 },
      { x: 4.5, z: 17.5, count: 5, radius: 1.8 },
    ],
    0.22,
    0.34,
    false
  );
  spawnSpecies(
    'celandine_01',
    [
      { x: -5.4, z: 14.6, count: 4, radius: 1.5 },
      { x: 1.2, z: 17.8, count: 4, radius: 1.8 },
      { x: 6.0, z: 11.2, count: 4, radius: 1.5 },
    ],
    0.24,
    0.36,
    false
  );
  spawnSpecies(
    'shrub_sorrel_01',
    [
      { x: -11.8, z: 10.5, count: 4, radius: 1.5 },
      { x: -2.8, z: 18.2, count: 4, radius: 1.4 },
      { x: 4.2, z: 14.8, count: 4, radius: 1.6 },
    ],
    0.22,
    0.34,
    false
  );
  spawnSpecies(
    'fern_02',
    [
      { x: -12.0, z: 12.5, count: 5, radius: 1.5 },
      { x: -11.4, z: 14.8, count: 4, radius: 1.3 },
      { x: -3.5, z: 18.8, count: 4, radius: 1.4 },
      { x: 6.8, z: 8.6, count: 4, radius: 1.3 },
      { x: -7.4, z: 4.2, count: 3, radius: 1.2 },
    ],
    0.36,
    0.56,
    true
  );

  // --- C. Realistic Multi-Tier 3D Grass & Wildflower Meadow System ---
  // Low manicured green turf tufts (grass_bermuda_01) skirting stepping stones & patio edges
  spawnSpecies(
    'grass_bermuda_01',
    [
      { x: -3.2, z: 10.6, count: 10, radius: 2.4 },
      { x: 3.4, z: 10.8, count: 10, radius: 2.4 },
      { x: -1.6, z: 13.4, count: 8, radius: 1.9 },
      { x: 2.4, z: 13.6, count: 8, radius: 1.9 },
      { x: -9.8, z: 13.8, count: 10, radius: 3.4 },
      { x: -4.5, z: 15.8, count: 10, radius: 3.6 },
      { x: 2.0, z: 16.2, count: 10, radius: 3.8 },
      { x: 6.4, z: 12.0, count: 8, radius: 3.2 },
    ],
    0.16,
    0.27,
    false
  );
  // Mid-height green meadow tufts along rock borders, path shoulders & lakeside shore
  spawnSpecies(
    'grass_medium_02',
    [
      { x: -11.0, z: 15.0, count: 7, radius: 2.6 },
      { x: -6.2, z: 16.5, count: 7, radius: 2.6 },
      { x: 0.5, z: 18.2, count: 7, radius: 2.8 },
      { x: 5.5, z: 9.8, count: 6, radius: 2.4 },
      { x: -8.2, z: 12.2, count: 6, radius: 2.2 },
    ],
    0.24,
    0.40,
    false
  );
  // Tall lakeside & slope wildflower meadow clusters (Innerscene CC0 cropped meadow_patch)
  spawnSpecies(
    'meadow_patch',
    [
      { x: -10.8, z: 14.5, count: 3, radius: 1.8 },
      { x: -5.4, z: 16.8, count: 3, radius: 1.8 },
      { x: 3.8, z: 16.8, count: 3, radius: 1.9 },
      { x: 6.8, z: 10.2, count: 3, radius: 1.8 },
      { x: -9.0, z: 6.2, count: 2, radius: 1.5 },
    ],
    0.46,
    0.66,
    false
  );
  spawnSpecies(
    'moss_01',
    [
      { x: -11.3, z: 13.6, count: 7, radius: 1.9 },
      { x: -6.6, z: 15.5, count: 6, radius: 1.8 },
      { x: -3.2, z: 18.3, count: 6, radius: 1.8 },
      { x: 5.2, z: 17.0, count: 5, radius: 1.7 },
    ],
    0.08,
    0.16,
    false
  );
}

function buildNearPineGltfs(
  parent: THREE.Group,
  isMobile: boolean,
  assets?: HybridAssetLoader
): void {
  if (!assets) return;

  // Real CC0 Photorealistic Alpine Pine & Fir Groves
  // Each grove combines primary + intertwined secondary instances for lush, dense, natural foliage
  const groveCenters: Array<{ x: number; z: number; h: number; id: 'pine_sapling_small' | 'fir_sapling' }> = [
    // Left forest copse framing the garden
    { x: -14.2, z: -2.5, h: 5.2, id: 'fir_sapling' },
    { x: -16.5, z: -7.0, h: 5.8, id: 'pine_sapling_small' },
    { x: -13.8, z: -10.5, h: 5.4, id: 'fir_sapling' },
    // Left rear hill behind bathroom wall (framing bedroom view on the left)
    { x: -7.5, z: -15.5, h: 5.6, id: 'pine_sapling_small' },
    { x: -9.8, z: -18.2, h: 6.2, id: 'fir_sapling' },
    // Right rear hill (framing bedroom view on the right, keeping X: 0.2..4.2 window view clear!)
    { x: 5.8, z: -15.2, h: 5.5, id: 'fir_sapling' },
    { x: 7.6, z: -18.0, h: 6.0, id: 'pine_sapling_small' },
    // Deep background forest fringe (far behind, subtle depth)
    { x: -1.2, z: -26.0, h: 6.5, id: 'fir_sapling' },
    { x: 3.5, z: -27.5, h: 6.8, id: 'pine_sapling_small' },
    // Lakeside & driveway accents
    { x: 8.6, z: 12.2, h: 3.8, id: 'fir_sapling' },
    { x: -15.5, z: 5.5, h: 4.6, id: 'pine_sapling_small' },
  ];

  const buckets: Record<'pine_sapling_small' | 'fir_sapling', THREE.Matrix4[]> = {
    pine_sapling_small: [],
    fir_sapling: [],
  };
  const dummy = new THREE.Object3D();

  for (let idx = 0; idx < groveCenters.length; idx++) {
    const g = groveCenters[idx];
    const sz = assets.getSize(g.id);
    if (!sz || sz.y <= 0.01) continue;

    // Primary tree at grove center
    const s1 = g.h / sz.y;
    const gy1 = getGroundHeight(g.x, g.z);
    dummy.position.set(g.x, gy1 - 0.04, g.z);
    dummy.rotation.set(0, (idx * 1.37) % (Math.PI * 2), 0);
    dummy.scale.set(s1, s1, s1);
    dummy.updateMatrix();
    buckets[g.id].push(dummy.matrix.clone());

    // Intertwined secondary tree: offset slightly & rotated 45-60 deg
    // This doubles branch and needle density, completely eliminating any "sparse" look!
    const partnerId = g.id === 'fir_sapling' ? 'pine_sapling_small' : 'fir_sapling';
    const partnerSz = assets.getSize(partnerId);
    if (partnerSz && partnerSz.y > 0.01) {
      const s2 = (g.h * 0.82) / partnerSz.y;
      const ox = Math.cos(idx * 2.1) * 0.35;
      const oz = Math.sin(idx * 2.1) * 0.35;
      const gy2 = getGroundHeight(g.x + ox, g.z + oz);
      dummy.position.set(g.x + ox, gy2 - 0.04, g.z + oz);
      dummy.rotation.set(0, (idx * 2.15 + 0.8) % (Math.PI * 2), 0);
      dummy.scale.set(s2 * 0.95, s2, s2 * 0.95);
      dummy.updateMatrix();
      buckets[partnerId].push(dummy.matrix.clone());
    }
  }

  for (const id of ['pine_sapling_small', 'fir_sapling'] as const) {
    if (buckets[id].length > 0) {
      const batch = assets.createInstancedBatches(id, buckets[id], {
        castShadow: !isMobile,
        receiveShadow: true,
      });
      if (batch) parent.add(batch);
    }
  }
}

function buildPathBollards(parent: THREE.Group): void {
  const ironMat = new THREE.MeshStandardMaterial({ color: '#22262b', roughness: 0.5, metalness: 0.55 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: '#fff1c9',
    emissive: '#ffab3d',
    emissiveIntensity: 2.0,
  });

  for (const [bx, bz] of [
    [-3.1, 12.7],
    [-1.95, 15.2],
  ]) {
    const by = getGroundHeight(bx, bz);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.08), ironMat);
    post.position.set(bx, by + 0.18, bz);
    post.castShadow = true;
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.065), glowMat);
    lens.position.set(bx, by + 0.38, bz);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.11), ironMat);
    cap.position.set(bx, by + 0.44, bz);
    parent.add(post, lens, cap);
  }
}
