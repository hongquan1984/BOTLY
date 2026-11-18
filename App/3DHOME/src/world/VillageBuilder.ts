import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadPolyHavenPBR } from '../textures/proceduralTextures';
import { AABBCollider } from '../types';

export interface VillageEntity {
  id: string;
  name: string;
  badge: string;
  category: 'building' | 'prop';
  group: THREE.Group;
  collider?: AABBCollider;
  initial: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    scale: number;
    halfW?: number;
    halfD?: number;
    radius?: number;
    height?: number;
  };
  current: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    scale: number;
  };
}

export interface VillageBuildResult {
  group: THREE.Group;
  plazaSurface: THREE.Mesh;
  colliders: AABBCollider[];
  fountainUniforms: { uTime: { value: number } };
  lanternLights: THREE.PointLight[];
  entities: Map<string, VillageEntity>;
  entitiesList: VillageEntity[];
  updateEntityTransform: (id: string, x: number, y: number, z: number, rotY: number, scale: number) => void;
  resetAllTransforms: () => void;
  getLayoutJSON: () => string;
  applyLayoutJSON: (jsonStr: string) => boolean;
  saveToStorage: () => void;
  update: (dt: number) => void;
  readyPromise: Promise<void>;
}

export interface VillageBuildingDef {
  id: string;
  name: string;
  badge: string;
  glbUrl: string;
  x: number;
  z: number;
  rotY: number;
  targetHeight: number;
  colliderWidth: number;
  colliderDepth: number;
  lightOffset?: [number, number, number];
  signOffset?: [number, number, number];
}

export interface VillagePropDef {
  name: string;
  displayName?: string;
  badge?: string;
  glbUrl: string;
  x: number;
  z: number;
  yOffset?: number;
  rotY: number;
  targetSize: number;
  sizeAxis?: 'x' | 'y' | 'z' | 'max';
  hasCollider?: boolean;
  colliderRadius?: number;
}

/**
 * Builds the Authentic 3D Swiss Alpine Village (Sleep Valley Dorfplatz):
 * - 10 distinct, individually modeled GLTF chalets & landmark buildings
 * - Realistic alpine village props: stone well, viewing gazebo, market stalls, cart, barrels, benches, fences, bonfire
 * - Elevated cobblestone plateau with open northern lake vista into the 2.5D panoramic depth
 * - NO procedural cone trees or fake terrain planes obscuring the mountain horizon
 * - Tight, realistic colliders allowing the player to walk right up to front doors and porches
 */
export function buildSwissVillage(): VillageBuildResult {
  const group = new THREE.Group();
  const colliders: AABBCollider[] = [];
  const lanternLights: THREE.PointLight[] = [];
  const entitiesMap = new Map<string, VillageEntity>();
  const entitiesList: VillageEntity[] = [];

  const STORAGE_KEY = 'swiss_village_layout_v1';

  const updateEntityTransform = (
    id: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    scale: number
  ) => {
    const entity = entitiesMap.get(id);
    if (!entity) return;

    entity.current.x = x;
    entity.current.y = y;
    entity.current.z = z;
    entity.current.rotY = rotY;
    entity.current.scale = scale;

    entity.group.position.set(x, y, z);
    entity.group.rotation.y = rotY;
    entity.group.scale.setScalar(scale);

    if (entity.collider) {
      if (entity.collider.obb && entity.initial.halfW && entity.initial.halfD) {
        const curHalfW = entity.initial.halfW * scale;
        const curHalfD = entity.initial.halfD * scale;
        const cosR = Math.abs(Math.cos(rotY));
        const sinR = Math.abs(Math.sin(rotY));
        const boxW = curHalfW * cosR + curHalfD * sinR;
        const boxD = curHalfW * sinR + curHalfD * cosR;

        entity.collider.minX = x - boxW;
        entity.collider.maxX = x + boxW;
        entity.collider.minZ = z - boxD;
        entity.collider.maxZ = z + boxD;
        entity.collider.maxY = y + (entity.initial.height || 6.0) * scale;

        entity.collider.obb.cx = x;
        entity.collider.obb.cz = z;
        entity.collider.obb.halfW = curHalfW;
        entity.collider.obb.halfD = curHalfD;
        entity.collider.obb.rotY = rotY;
      } else if (entity.initial.radius) {
        const curR = entity.initial.radius * scale;
        entity.collider.minX = x - curR;
        entity.collider.maxX = x + curR;
        entity.collider.minZ = z - curR;
        entity.collider.maxZ = z + curR;
        entity.collider.maxY = y + (entity.initial.height || 2.0) * scale;
      }
    }
  };

  const getLayoutJSON = (): string => {
    const data: Record<string, { x: number; y: number; z: number; rotY: number; scale: number }> = {};
    for (const [id, e] of entitiesMap.entries()) {
      data[id] = { ...e.current };
    }
    return JSON.stringify(data, null, 2);
  };

  const applyLayoutJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      for (const [id, t] of Object.entries(data as any)) {
        if (typeof t === 'object' && t !== null) {
          const tr = t as any;
          updateEntityTransform(
            id,
            typeof tr.x === 'number' ? tr.x : 0,
            typeof tr.y === 'number' ? tr.y : 0,
            typeof tr.z === 'number' ? tr.z : 0,
            typeof tr.rotY === 'number' ? tr.rotY : 0,
            typeof tr.scale === 'number' ? Math.max(0.1, tr.scale) : 1.0
          );
        }
      }
      return true;
    } catch (e) {
      console.error('Invalid JSON layout:', e);
      return false;
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, getLayoutJSON());
    } catch (e) {
      console.error('Failed to save layout to localStorage:', e);
    }
  };

  const resetAllTransforms = () => {
    for (const e of entitiesList) {
      updateEntityTransform(e.id, e.initial.x, e.initial.y, e.initial.z, e.initial.rotY, e.initial.scale);
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Keep the plaza generous and the buildings village-scale instead of letting
  // the imported GLBs dominate the whole composition.
  const buildingScale = 0.62;
  const gltfLoader = new GLTFLoader();

  // -------------------------------------------------------------
  // 1. PBR MATERIALS FOR CENTRAL PLAZA & HARDSCAPE
  // -------------------------------------------------------------
  const cobblePBR = loadPolyHavenPBR('cobblestone_05', 24, 24);
  const pathPBR = loadPolyHavenPBR('cobblestone_05', 4, 18);
  const slatePBR = loadPolyHavenPBR('castle_wall_slates', 6.0, 4.0);
  const beamPBR = loadPolyHavenPBR('brown_planks_07', 2.0, 1.0);

  const plazaMat = new THREE.MeshStandardMaterial({
    map: cobblePBR.map,
    normalMap: cobblePBR.normalMap,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: cobblePBR.roughnessMap,
    roughness: 0.84,
    metalness: 0.04,
    color: '#d8d1c7',
  });

  const pathMat = new THREE.MeshStandardMaterial({
    map: pathPBR.map,
    normalMap: pathPBR.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: pathPBR.roughnessMap,
    roughness: 0.88,
    metalness: 0.03,
    color: '#c9beaf',
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: slatePBR.map,
    normalMap: slatePBR.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: slatePBR.roughnessMap,
    roughness: 0.9,
    metalness: 0.05,
    color: '#aba195',
  });

  const grassPBR = loadPolyHavenPBR('aerial_grass_rock', 36, 36);
  const alpineMeadowMat = new THREE.MeshStandardMaterial({
    map: grassPBR.map,
    normalMap: grassPBR.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: grassPBR.roughnessMap,
    roughness: 0.92,
    metalness: 0.0,
    color: '#8fae6a', // Natural Swiss alpine pasture green
  });

  const darkBeamMat = new THREE.MeshStandardMaterial({
    map: beamPBR.map,
    normalMap: beamPBR.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: beamPBR.roughnessMap,
    roughness: 0.76,
    metalness: 0.02,
    color: '#5c3a1e',
  });

  const rusticArchStoneMat = new THREE.MeshStandardMaterial({
    map: cobblePBR.map,
    normalMap: cobblePBR.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: cobblePBR.roughnessMap,
    roughness: 0.92,
    metalness: 0.03,
    color: '#8b8175',
  });

  const ivyLeafMat = new THREE.MeshStandardMaterial({
    color: '#1e4620',
    roughness: 0.7,
  });

  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffe599',
    emissive: '#ff9900',
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: '#22252a',
    roughness: 0.45,
    metalness: 0.8,
  });

  // -------------------------------------------------------------
  // 2. CONTINUOUS SOLID ALPINE MEADOW TERRAIN + CIVIC DORFPLATZ
  // -------------------------------------------------------------
  // Meadow covers the southern, eastern, and western terrain up to the waterfront edge (z = -215m to +27.5m).
  // Stops cleanly at the waterfront balustrade so the turquoise lake water is 100% visible!
  const terrainGeo = new THREE.PlaneGeometry(380, 245, 32, 24);
  terrainGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(terrainGeo, alpineMeadowMat);
  groundMesh.position.set(0, -0.65, -94.5);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // A handsome circular/horseshoe civic plaza with warm PBR cobblestones
  const plazaGeo = new THREE.CylinderGeometry(34.0, 34.0, 0.45, 48);
  const plazaMesh = new THREE.Mesh(plazaGeo, [stoneMat, plazaMat, stoneMat]);
  plazaMesh.position.set(0, -0.22, 1.0);
  plazaMesh.receiveShadow = true;
  group.add(plazaMesh);

  // Approach Road from South: Z: [-24..-48], Width: 8m
  const roadGeo = new THREE.BoxGeometry(8.0, 0.45, 26);
  const roadMesh = new THREE.Mesh(roadGeo, pathMat);
  roadMesh.position.set(0, -0.22, -35.0);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Decorative rustic carved stone curb along the curved perimeter of the plaza
  const curbGroup = new THREE.Group();
  const curbCount = 48;
  const curbRadius = 34.0;
  const curbSegmentGeo = new THREE.BoxGeometry(4.2, 0.35, 0.65);
  for (let i = 0; i < curbCount; i++) {
    const angle = (i / curbCount) * Math.PI * 2;
    // Leave gaps for South approach road and North lake overlook
    const isSouthGap = angle > Math.PI * 1.38 && angle < Math.PI * 1.62;
    const isNorthGap = angle > Math.PI * 0.38 && angle < Math.PI * 0.62;
    if (isSouthGap || isNorthGap) continue;

    const x = Math.cos(angle) * curbRadius;
    const z = 1.0 + Math.sin(angle) * curbRadius;
    const curb = new THREE.Mesh(curbSegmentGeo, stoneMat);
    curb.position.set(x, 0.12, z);
    curb.rotation.y = -angle + Math.PI / 2;
    curb.castShadow = true;
    curb.receiveShadow = true;
    curbGroup.add(curb);
  }
  curbGroup.visible = true;
  group.add(curbGroup);

  // -------------------------------------------------------------
  // 3. CENTRAL CARVED STONE WATER FOUNTAIN
  // -------------------------------------------------------------
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0, 1.0);

  const basinOuter = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.9, 8, 1, true), stoneMat);
  basinOuter.position.y = 0.45;
  basinOuter.castShadow = true;
  basinOuter.receiveShadow = true;
  fountainGroup.add(basinOuter);

  const basinFloor = new THREE.Mesh(new THREE.CircleGeometry(4.3, 8), stoneMat);
  basinFloor.rotateX(-Math.PI / 2);
  basinFloor.position.y = 0.05;
  basinFloor.receiveShadow = true;
  fountainGroup.add(basinFloor);

  const basinRimGeo = new THREE.TorusGeometry(4.1, 0.25, 6, 8);
  basinRimGeo.rotateX(Math.PI / 2);
  const basinRim = new THREE.Mesh(basinRimGeo, stoneMat);
  basinRim.position.y = 0.9;
  basinRim.castShadow = true;
  fountainGroup.add(basinRim);

  const waterGeo = new THREE.CircleGeometry(3.95, 24);
  waterGeo.rotateX(-Math.PI / 2);
  const waterUniforms = { uTime: { value: 0.0 } };
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.88,
    roughness: 0.08,
    metalness: 0.05,
    ior: 1.333,
    transmission: 0.55,
    specularColor: new THREE.Color('#ffffff'),
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.78;
  fountainGroup.add(waterMesh);

  const colBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 1.4), stoneMat);
  colBase.position.y = 1.0;
  colBase.castShadow = true;
  fountainGroup.add(colBase);

  const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 2.6, 12), stoneMat);
  colShaft.position.y = 2.3;
  colShaft.castShadow = true;
  fountainGroup.add(colShaft);

  const upperBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.75, 0.6, 12), stoneMat);
  upperBasin.position.y = 3.35;
  upperBasin.castShadow = true;
  fountainGroup.add(upperBasin);

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 8), stoneMat);
  finial.position.y = 4.3;
  finial.castShadow = true;
  fountainGroup.add(finial);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.55, 6), ironMat);
    spout.rotateZ(Math.PI / 2);
    spout.position.set(Math.cos(angle) * 1.15, 3.25, Math.sin(angle) * 1.15);
    spout.rotation.y = -angle;
    fountainGroup.add(spout);
  }

  group.add(fountainGroup);
  colliders.push({ minX: -3.8, maxX: 3.8, minZ: -2.8, maxZ: 4.8, height: 4.5 });

  // -------------------------------------------------------------
  // 4. GATES: PERSONAL TIMBER GATE & HABITS ARENA ARCHWAY
  // -------------------------------------------------------------
  // A. Player's Personal Home Timber Gate (Left of South Road)
  const homeGateGroup = new THREE.Group();
  homeGateGroup.position.set(-6.5, 0, -25.5);
  homeGateGroup.rotation.y = 0.15;

  const hPostGeo = new THREE.BoxGeometry(0.45, 2.8, 0.45);
  [-1.6, 1.6].forEach((px) => {
    const post = new THREE.Mesh(hPostGeo, darkBeamMat);
    post.position.set(px, 1.4, 0);
    post.castShadow = true;
    homeGateGroup.add(post);
  });
  const hBeamTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 0.5), darkBeamMat);
  hBeamTop.position.set(0, 2.7, 0);
  hBeamTop.castShadow = true;
  homeGateGroup.add(hBeamTop);

  const gateLeafGeo = new THREE.BoxGeometry(1.35, 1.4, 0.08);
  [-0.75, 0.75].forEach((gx) => {
    const leaf = new THREE.Mesh(gateLeafGeo, darkBeamMat);
    leaf.position.set(gx, 0.85, 0);
    leaf.castShadow = true;
    homeGateGroup.add(leaf);
  });
  group.add(homeGateGroup);

  // B. Habits Arena Rustic Timber & Stone Post Gate (Right of South Road)
  const arenaArchGroup = new THREE.Group();
  arenaArchGroup.position.set(6.5, 0, -25.5);
  arenaArchGroup.rotation.y = -0.15;

  // Solid stone pillar pedestals with carved timber posts
  const baseStoneGeo = new THREE.BoxGeometry(0.85, 1.2, 0.85);
  const timberPostGeo = new THREE.BoxGeometry(0.45, 3.8, 0.45);
  [-2.2, 2.2].forEach((px) => {
    const base = new THREE.Mesh(baseStoneGeo, rusticArchStoneMat);
    base.position.set(px, 0.6, 0);
    base.castShadow = true;
    arenaArchGroup.add(base);

    const post = new THREE.Mesh(timberPostGeo, darkBeamMat);
    post.position.set(px, 3.1, 0);
    post.castShadow = true;
    arenaArchGroup.add(post);
  });

  // Carved timber lintel beams overhead
  const lintelBeam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.45, 0.55), darkBeamMat);
  lintelBeam.position.set(0, 5.0, 0);
  lintelBeam.castShadow = true;
  arenaArchGroup.add(lintelBeam);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 0.45), darkBeamMat);
  topBeam.position.set(0, 5.45, 0);
  topBeam.castShadow = true;
  arenaArchGroup.add(topBeam);

  const arenaLight = new THREE.PointLight('#ffaa40', 2.2, 12, 1.4);
  arenaLight.position.set(0, 4.6, 0);
  arenaArchGroup.add(arenaLight);
  lanternLights.push(arenaLight);

  group.add(arenaArchGroup);

  // -------------------------------------------------------------
  // 5. NORTH LAKE OVERLOOK STONE BALUSTRADE
  // -------------------------------------------------------------
  const balustradeGroup = new THREE.Group();
  balustradeGroup.position.set(0, 0, 28.0);

  const railWidth = 32.0;
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(railWidth, 0.35, 0.65), stoneMat);
  railTop.position.y = 1.15;
  railTop.castShadow = true;
  balustradeGroup.add(railTop);

  const railBase = new THREE.Mesh(new THREE.BoxGeometry(railWidth, 0.4, 0.75), stoneMat);
  railBase.position.y = 0.2;
  railBase.castShadow = true;
  balustradeGroup.add(railBase);

  const balusterCount = 32;
  const balusterGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.75, 8);
  for (let i = 0; i <= balusterCount; i++) {
    const bx = -railWidth / 2 + (i / balusterCount) * railWidth;
    const post = new THREE.Mesh(balusterGeo, stoneMat);
    post.position.set(bx, 0.65, 0);
    post.castShadow = true;
    balustradeGroup.add(post);
  }

  group.add(balustradeGroup);

  // 5B. Glacial Turquoise Lake Shimmer extending from balustrade to horizon (z = 26m to 205m)
  // Deep lakebed base plane color-matched to Swiss glacial depths
  const lakeBedGeo = new THREE.PlaneGeometry(380, 200);
  lakeBedGeo.rotateX(-Math.PI / 2);
  const lakeBedMat = new THREE.MeshBasicMaterial({ color: '#163b36' });
  const lakeBedMesh = new THREE.Mesh(lakeBedGeo, lakeBedMat);
  lakeBedMesh.position.set(0, -5.5, 126.0);
  group.add(lakeBedMesh);

  const lakeWaterGeo = new THREE.PlaneGeometry(380, 200, 48, 32);
  lakeWaterGeo.rotateX(-Math.PI / 2);
  const lakeUniforms = {
    uTime: { value: 0.0 },
    uColorNear: { value: new THREE.Color('#388a82') },
    uColorFar: { value: new THREE.Color('#2d6e68') },
  };
  const lakeWaterMat = new THREE.ShaderMaterial({
    uniforms: lakeUniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.y += sin(pos.x * 0.08 + uTime * 1.5) * 0.12 + cos(pos.z * 0.12 + uTime * 1.2) * 0.08;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorNear;
      uniform vec3 uColorFar;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        float wave = sin(vWorldPos.x * 0.35 + uTime * 2.2) * cos(vWorldPos.z * 0.30 + uTime * 1.6) * 0.5 + 0.5;
        vec3 col = mix(uColorNear, uColorFar, clamp((vWorldPos.z - 28.0) / 150.0, 0.0, 1.0));
        col += vec3(0.14, 0.20, 0.18) * pow(wave, 6.0); // sun glints on waves
        // Softly fade out near the backdrop cylinder (z = 160 to 205m) to blend seamlessly into photo
        float fade = smoothstep(205.0, 160.0, vWorldPos.z);
        gl_FragColor = vec4(col, fade * 0.92);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const lakeWaterMesh = new THREE.Mesh(lakeWaterGeo, lakeWaterMat);
  lakeWaterMesh.position.set(0, -2.1, 126.0);
  lakeWaterMesh.renderOrder = -2;
  group.add(lakeWaterMesh);

  colliders.push({
    minX: -railWidth / 2 - 1.0,
    maxX: railWidth / 2 + 1.0,
    minZ: 27.2,
    maxZ: 29.2,
    height: 2.0,
  });

  // -------------------------------------------------------------
  // 6. STREET LANTERNS & DIRECTIONAL SIGNPOSTS
  // -------------------------------------------------------------
  const lampPositions = [
    [-15.0, -18.0],
    [15.0, -18.0],
    [-20.0, -2.0],
    [20.0, -2.0],
    [-18.0, 15.0],
    [18.0, 15.0],
    [-8.0, 24.0],
    [8.0, 24.0],
  ];

  lampPositions.forEach(([lx, lz]) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.0, 8), ironMat);
    post.position.y = 2.0;
    post.castShadow = true;
    lampGroup.add(post);

    const lanternHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), windowGlowMat);
    lanternHead.position.y = 4.1;
    lampGroup.add(lanternHead);

    const lanternLight = new THREE.PointLight('#ffb347', 2.2, 16, 1.4);
    lanternLight.position.set(0, 4.2, 0);
    lampGroup.add(lanternLight);
    lanternLights.push(lanternLight);

    group.add(lampGroup);

    colliders.push({ minX: lx - 0.45, maxX: lx + 0.45, minZ: lz - 0.45, maxZ: lz + 0.45, height: 4.4 });
  });

  // Central Wooden Signpost
  const signpostGroup = new THREE.Group();
  signpostGroup.position.set(-3.5, 0, -5.0);

  const spPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.2, 8), darkBeamMat);
  spPost.position.y = 1.6;
  spPost.castShadow = true;
  signpostGroup.add(spPost);

  const signs = [
    { text: '🌿 Vườn Thảo Mộc', rotY: Math.PI * 0.45, y: 2.8 },
    { text: '📚 Thư Viện Tri Thức', rotY: -Math.PI * 0.45, y: 2.45 },
    { text: '🌊 Làng Ven Hồ', rotY: 0, y: 2.1 },
    { text: '🏡 Căn Nhà Cá Nhân', rotY: Math.PI, y: 1.75 },
  ];
  signs.forEach((s) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.08), darkBeamMat);
    board.position.set(0.65, s.y, 0);
    board.rotation.y = s.rotY;
    board.castShadow = true;
    signpostGroup.add(board);
  });
  group.add(signpostGroup);

  // -------------------------------------------------------------
  // 7. THE 10 DISTINCT REAL 3D GLTF BUILDINGS (Balanced & Diverse Horseshoe Dorfplatz)
  // Masterplanned Swiss Alpine Village: Clear zoning, harmonious spacing, accessible entrances!
  // Zero duplicates!
  const BUILDINGS_LIST: VillageBuildingDef[] = [
    // 1. West Flank (South): Botanical Greenhouse & Garden
    {
      id: 'botanical_greenhouse',
      name: 'Nhà Thực Vật Học',
      badge: '🌿',
      glbUrl: '/assets/models/village/greenhouse.glb',
      x: -22.5,
      z: -12.0,
      rotY: Math.PI * 0.38,
      targetHeight: 7.2,
      colliderWidth: 6.8,
      colliderDepth: 5.4,
      lightOffset: [0, 3.2, 3.6],
      signOffset: [0, 3.4, 3.8],
    },
    // 2. West Flank (Mid-South): Traditional Steep Alpine Chalet (Deep blue pitched roof)
    {
      id: 'traditional_chalet',
      name: 'Nhà Nghỉ Dưỡng Giấc Ngủ',
      badge: '🌙',
      glbUrl: '/assets/models/village/fantasy_house_3.glb',
      x: -24.0,
      z: 0.0,
      rotY: Math.PI * 0.48,
      targetHeight: 9.0,
      colliderWidth: 7.2,
      colliderDepth: 5.8,
      lightOffset: [0, 3.2, 3.8],
      signOffset: [0, 3.5, 4.0],
    },
    // 3. West Flank (North): Alchemist & Craftsman Forge (Heavy stone workshop & open hearth)
    {
      id: 'craftsman_forge',
      name: 'Xưởng Chế Tác Dược Liệu',
      badge: '🧪',
      glbUrl: '/assets/models/village/blacksmith.glb',
      x: -22.5,
      z: 12.0,
      rotY: Math.PI * 0.60,
      targetHeight: 8.2,
      colliderWidth: 7.0,
      colliderDepth: 5.8,
      lightOffset: [0, 3.0, 3.6],
      signOffset: [0, 3.3, 3.8],
    },
    // 4. North-West Waterfront: Alpine Windmill at Lake Edge (Tall rotating sails)
    {
      id: 'alpine_mill',
      name: 'Cối Xay Gió Ven Hồ',
      badge: '🌾',
      glbUrl: '/assets/models/village/mill.glb',
      x: -16.0,
      z: 23.5,
      rotY: Math.PI * 0.85,
      targetHeight: 12.5,
      colliderWidth: 5.0,
      colliderDepth: 5.0,
      lightOffset: [0, 3.2, 3.5],
      signOffset: [0, 3.5, 3.6],
    },
    // 5. North-East Waterfront: Scenic Wooden Gazebo Pavilion (Overlooking turquoise lake & Alps)
    {
      id: 'alpine_gazebo',
      name: 'Vọng Cảnh Đài Ven Hồ',
      badge: '🏛️',
      glbUrl: '/assets/models/village/gazebo.glb',
      x: 16.0,
      z: 23.5,
      rotY: -Math.PI * 0.85,
      targetHeight: 6.8,
      colliderWidth: 5.0,
      colliderDepth: 5.0,
      lightOffset: [0, 2.8, 2.5],
      signOffset: [0, 3.2, 2.8],
    },
    // 6. South Entrance (West of Road): Player's Personal Home Chalet (Chimney & warm timber porch)
    {
      id: 'player_chalet',
      name: 'Căn Nhà Cá Nhân (3D Home)',
      badge: '🏡',
      glbUrl: '/assets/models/village/fantasy_house_1.glb',
      x: -12.0,
      z: -23.5,
      rotY: 0.20,
      targetHeight: 9.0,
      colliderWidth: 7.2,
      colliderDepth: 5.8,
      lightOffset: [0, 3.2, 3.8],
      signOffset: [0, 3.5, 4.0],
    },
    // 7. South Entrance (East of Road): Traditional Two-Story Swiss House
    {
      id: 'two_story_chalet',
      name: 'Nhà Gỗ Hai Tầng Thụy Sỹ',
      badge: '🏔️',
      glbUrl: '/assets/models/village/two_story_house.glb',
      x: 12.0,
      z: -23.5,
      rotY: -0.20,
      targetHeight: 9.2,
      colliderWidth: 7.4,
      colliderDepth: 6.0,
      lightOffset: [0, 3.2, 3.8],
      signOffset: [0, 3.5, 4.0],
    },
    // 8. East Flank (South - Prominent Landmark): The 16m Village Bell Tower (Belfry)
    {
      id: 'village_bell_tower',
      name: 'Tháp Chuông Làng',
      badge: '🔔',
      glbUrl: '/assets/models/village/bell_tower.glb',
      x: 21.5,
      z: -12.0,
      rotY: -Math.PI * 0.38,
      targetHeight: 16.0,
      colliderWidth: 4.6,
      colliderDepth: 4.6,
      lightOffset: [0, 3.5, 3.0],
      signOffset: [0, 3.2, 3.2],
    },
    // 9. East Flank (Mid): Traditional Herbal Apothecary (Half-timber & red shingle roof)
    {
      id: 'traditional_apothecary',
      name: 'Hiệu Thuốc Thảo Mộc Truyền Thống',
      badge: '🌿',
      glbUrl: '/assets/models/village/fantasy_house_2.glb',
      x: 24.0,
      z: 0.0,
      rotY: -Math.PI * 0.48,
      targetHeight: 8.6,
      colliderWidth: 7.0,
      colliderDepth: 5.8,
      lightOffset: [0, 3.0, 3.6],
      signOffset: [0, 3.4, 3.8],
    },
    // 10. East Flank (North): The Grand Alpine Inn & Tavern (Patio dining outside)
    {
      id: 'alpine_inn',
      name: 'Quán Trọ Sleep Valley',
      badge: '🍺',
      glbUrl: '/assets/models/village/fantasy_inn.glb',
      x: 22.5,
      z: 12.0,
      rotY: -Math.PI * 0.60,
      targetHeight: 10.2,
      colliderWidth: 8.2,
      colliderDepth: 6.4,
      lightOffset: [0, 3.2, 4.0],
      signOffset: [0, 3.6, 4.2],
    },
  ];

  // -------------------------------------------------------------
  // 8. REALISTIC 3D VILLAGE PROPS LIST (Thematic Micro-Clusters)
  // Perfectly aligned with re-planned buildings; obstacle colliders optimized for zero door blocking!
  // -------------------------------------------------------------
  const PROPS_LIST: VillagePropDef[] = [
    // Central Stone Well in Dorfplatz (near southern plaza corner)
    {
      name: 'village_well',
      displayName: 'Giếng Đá Cổ',
      badge: '🪣',
      glbUrl: '/assets/models/village/well.glb',
      x: -6.0,
      z: -8.0,
      rotY: 0.4,
      targetSize: 3.2,
      sizeAxis: 'y',
      hasCollider: true,
      colliderRadius: 1.0,
    },
    // Herbalist Market Stall (West plaza lane)
    {
      name: 'herbal_market',
      displayName: 'Quầy Chợ Thảo Mộc',
      badge: '🎪',
      glbUrl: '/assets/models/village/market_stand.glb',
      x: -14.0,
      z: -6.0,
      rotY: Math.PI * 0.40,
      targetSize: 3.8,
      sizeAxis: 'y',
      hasCollider: true,
      colliderRadius: 1.1,
    },
    // Wooden Handcart laden with produce (East plaza lane)
    {
      name: 'wooden_cart',
      displayName: 'Xe Kéo Gỗ Nông Sản',
      badge: '🛒',
      glbUrl: '/assets/models/village/cart.glb',
      x: 14.0,
      z: -6.0,
      rotY: -Math.PI * 0.40,
      targetSize: 3.4,
      sizeAxis: 'x',
      hasCollider: true,
      colliderRadius: 1.1,
    },
    // Patio Seating outside Alpine Inn (East flank)
    {
      name: 'inn_patio_table',
      displayName: 'Bàn Ăn Hiên Quán Trọ',
      badge: '🪵',
      glbUrl: '/assets/glb/outdoor_table_chair_set_01.glb',
      x: 17.0,
      z: 11.5,
      rotY: -0.5,
      targetSize: 2.6,
      sizeAxis: 'x',
      hasCollider: true,
      colliderRadius: 1.0,
    },
    {
      name: 'inn_patio_tea',
      displayName: 'Bộ Ấm Trà Quán Trọ',
      badge: '🍵',
      glbUrl: '/assets/glb/tea_set_01.glb',
      x: 17.0,
      z: 11.5,
      yOffset: 0.82,
      rotY: -0.2,
      targetSize: 0.8,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Wooden Barrels outside Tavern (decorative, no collider blocking doorways)
    {
      name: 'barrel_inn_1',
      displayName: 'Thùng Gỗ Quán Trọ 1',
      badge: '🛢️',
      glbUrl: '/assets/models/village/barrel.glb',
      x: 19.5,
      z: 14.5,
      rotY: 0.3,
      targetSize: 1.4,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'barrel_inn_2',
      displayName: 'Thùng Gỗ Quán Trọ 2',
      badge: '🛢️',
      glbUrl: '/assets/models/village/barrel.glb',
      x: 20.2,
      z: 15.2,
      rotY: -0.5,
      targetSize: 1.2,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'crate_market_1',
      displayName: 'Kiện Hàng Chợ 1',
      badge: '📦',
      glbUrl: '/assets/models/village/crate.glb',
      x: -12.5,
      z: -7.5,
      rotY: 0.2,
      targetSize: 1.2,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Lakeside Alpine Fire Pit Terrace (North-East Overlook)
    {
      name: 'lake_fire_pit',
      displayName: 'Bếp Lửa Đá Ven Hồ',
      badge: '🔥',
      glbUrl: '/assets/glb/stone_fire_pit.glb',
      x: 10.5,
      z: 21.5,
      rotY: 0.0,
      targetSize: 2.6,
      sizeAxis: 'max',
      hasCollider: true,
      colliderRadius: 1.0,
    },
    // Symmetrical Wooden Benches around central fountain & lake overlook (low furniture, no snagging)
    {
      name: 'bench_fountain_left',
      displayName: 'Ghế Phun Nước (Trái)',
      badge: '🛋️',
      glbUrl: '/assets/models/village/bench.glb',
      x: -6.2,
      z: 1.0,
      rotY: Math.PI * 0.5,
      targetSize: 2.4,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'bench_fountain_right',
      displayName: 'Ghế Phun Nước (Phải)',
      badge: '🛋️',
      glbUrl: '/assets/models/village/bench.glb',
      x: 6.2,
      z: 1.0,
      rotY: -Math.PI * 0.5,
      targetSize: 2.4,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'bench_fountain_south',
      displayName: 'Ghế Phun Nước (Nam)',
      badge: '🛋️',
      glbUrl: '/assets/models/village/bench.glb',
      x: 0.0,
      z: -4.8,
      rotY: 0.0,
      targetSize: 2.4,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'bench_lake_overlook',
      displayName: 'Ghế Dài Ngắm Hồ',
      badge: '🛋️',
      glbUrl: '/assets/models/village/bench.glb',
      x: 0.0,
      z: 26.5,
      rotY: Math.PI,
      targetSize: 2.6,
      sizeAxis: 'x',
      hasCollider: false,
    },
    // West Plaza Tea Table (near Craftsman forge & garden)
    {
      name: 'plaza_cafe_table',
      displayName: 'Bàn Cafe Quảng Trường',
      badge: '☕',
      glbUrl: '/assets/glb/outdoor_table_chair_set_01.glb',
      x: -9.0,
      z: 14.0,
      rotY: 0.4,
      targetSize: 2.6,
      sizeAxis: 'x',
      hasCollider: true,
      colliderRadius: 1.0,
    },
    {
      name: 'plaza_cafe_tea',
      displayName: 'Bộ Ấm Trà Cafe',
      badge: '🍵',
      glbUrl: '/assets/glb/tea_set_01.glb',
      x: -9.0,
      z: 14.0,
      yOffset: 0.82,
      rotY: 0.2,
      targetSize: 0.8,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Detailed Alpine Wooden Flower Planters & Blooming Flowers at Chalets (All non-blocking!)
    {
      name: 'planter_greenhouse',
      displayName: 'Bồn Hoa Nhà Kính',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: -19.5,
      z: -9.8,
      rotY: Math.PI * 0.38,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_greenhouse_blooms',
      displayName: 'Hoa Cúc Nhà Kính',
      badge: '🌸',
      glbUrl: '/assets/glb/flower_gazania.glb',
      x: -19.5,
      z: -9.8,
      yOffset: 0.35,
      rotY: 0.5,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'planter_traditional_chalet',
      displayName: 'Bồn Hoa Chalet Giấc Ngủ',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: -21.0,
      z: 2.2,
      rotY: Math.PI * 0.48,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_chalet_blooms',
      displayName: 'Hoa Nở Chalet Giấc Ngủ',
      badge: '🌸',
      glbUrl: '/assets/glb/flower_gazania.glb',
      x: -21.0,
      z: 2.2,
      yOffset: 0.35,
      rotY: 0.3,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'planter_apothecary',
      displayName: 'Bồn Hoa Tiệm Thuốc',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: 21.0,
      z: 2.2,
      rotY: -Math.PI * 0.48,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_apothecary_blooms',
      displayName: 'Hoa Vàng Tiệm Thuốc',
      badge: '🌼',
      glbUrl: '/assets/glb/flower_empodium.glb',
      x: 21.0,
      z: 2.2,
      yOffset: 0.35,
      rotY: -0.5,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'planter_bell_tower',
      displayName: 'Bồn Hoa Tháp Chuông',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: 18.5,
      z: -10.5,
      rotY: -Math.PI * 0.38,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_bell_tower_blooms',
      displayName: 'Hoa Tím Tháp Chuông',
      badge: '🌺',
      glbUrl: '/assets/glb/periwinkle_plant.glb',
      x: 18.5,
      z: -10.5,
      yOffset: 0.35,
      rotY: 0.8,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'planter_player_home',
      displayName: 'Bồn Hoa Nhà Cá Nhân',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: -9.5,
      z: -21.0,
      rotY: 0.15,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'planter_two_story',
      displayName: 'Bồn Hoa Nhà Hai Tầng',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: 9.5,
      z: -21.0,
      rotY: -0.15,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'planter_fountain_1',
      displayName: 'Bồn Hoa Đài Phun Nước 1',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: -2.8,
      z: -3.5,
      rotY: 0.2,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_fountain_blooms_1',
      displayName: 'Hoa Đài Phun Nước 1',
      badge: '🌸',
      glbUrl: '/assets/glb/flower_gazania.glb',
      x: -2.8,
      z: -3.5,
      yOffset: 0.35,
      rotY: 0.3,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'planter_fountain_2',
      displayName: 'Bồn Hoa Đài Phun Nước 2',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: 2.8,
      z: -3.5,
      rotY: -0.2,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'flower_fountain_blooms_2',
      displayName: 'Hoa Đài Phun Nước 2',
      badge: '🌸',
      glbUrl: '/assets/glb/flower_gazania.glb',
      x: 2.8,
      z: -3.5,
      yOffset: 0.35,
      rotY: -0.3,
      targetSize: 1.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // South Road Approach Planters framing the gate
    {
      name: 'plaza_planter_left',
      displayName: 'Bồn Hoa Cổng Vào (Trái)',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: 4.8,
      z: -28.0,
      rotY: 0.0,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'plaza_planter_right',
      displayName: 'Bồn Hoa Cổng Vào (Phải)',
      badge: '🪴',
      glbUrl: '/assets/glb/planter_box_01.glb',
      x: -4.8,
      z: -28.0,
      rotY: 0.0,
      targetSize: 2.2,
      sizeAxis: 'x',
      hasCollider: false,
    },
    {
      name: 'lake_shrub_corner_left',
      displayName: 'Bụi Cây Bờ Hồ (Trái)',
      badge: '🌿',
      glbUrl: '/assets/glb/shrub_02.glb',
      x: -8.0,
      z: 25.5,
      rotY: 0.4,
      targetSize: 2.4,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'lake_shrub_corner_right',
      displayName: 'Bụi Cây Bờ Hồ (Phải)',
      badge: '🌿',
      glbUrl: '/assets/glb/shrub_02.glb',
      x: 8.0,
      z: 25.5,
      rotY: -0.4,
      targetSize: 2.4,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Tea Set & Dining Props on Patio Table
    {
      name: 'tea_set_inn',
      displayName: 'Bộ Ấm Trà Quán Trọ 2',
      badge: '🍵',
      glbUrl: '/assets/glb/tea_set_01.glb',
      x: 16.5,
      z: 14.0,
      rotY: 0.3,
      targetSize: 0.85,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Lush Botanical Greenhouse Interior Displays (visible through glass)
    {
      name: 'greenhouse_plant_1',
      displayName: 'Chậu Cây Nhà Kính 1',
      badge: '🪴',
      glbUrl: '/assets/glb/potted_plant_02.glb',
      x: -21.0,
      z: -10.0,
      rotY: 0.3,
      targetSize: 2.2,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'greenhouse_plant_2',
      displayName: 'Chậu Cây Nhà Kính 2',
      badge: '🪴',
      glbUrl: '/assets/glb/potted_plant_04.glb',
      x: -22.5,
      z: -11.2,
      rotY: -0.5,
      targetSize: 2.0,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'greenhouse_fern',
      displayName: 'Dương Xỉ Nhà Kính',
      badge: '🌿',
      glbUrl: '/assets/glb/fern_02.glb',
      x: -20.2,
      z: -11.5,
      rotY: 0.8,
      targetSize: 1.4,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'greenhouse_gazania',
      displayName: 'Hoa Cúc Trong Nhà Kính',
      badge: '🌸',
      glbUrl: '/assets/glb/flower_gazania.glb',
      x: -22.0,
      z: -9.4,
      rotY: 1.2,
      targetSize: 1.2,
      sizeAxis: 'y',
      hasCollider: false,
    },
    // Alpine Moss Boulders anchoring the elevated village terrace
    {
      name: 'rock_moss_west',
      displayName: 'Khối Đá Rêu Phía Tây',
      badge: '🪨',
      glbUrl: '/assets/glb/rock_moss_set_01.glb',
      x: -25.5,
      z: -1.5,
      rotY: 0.8,
      targetSize: 3.2,
      sizeAxis: 'max',
      hasCollider: true,
      colliderRadius: 1.5,
    },
    {
      name: 'rock_moss_east',
      displayName: 'Khối Đá Rêu Phía Đông',
      badge: '🪨',
      glbUrl: '/assets/glb/rock_moss_set_02.glb',
      x: 26.5,
      z: -1.5,
      rotY: -0.5,
      targetSize: 3.2,
      sizeAxis: 'max',
      hasCollider: true,
      colliderRadius: 1.5,
    },
    {
      name: 'boulder_overlook_west',
      displayName: 'Tảng Đá Vọng Cảnh Tây',
      badge: '🪨',
      glbUrl: '/assets/glb/boulder_01.glb',
      x: -18.5,
      z: 27.5,
      rotY: 1.2,
      targetSize: 4.2,
      sizeAxis: 'max',
      hasCollider: true,
      colliderRadius: 1.8,
    },
    {
      name: 'boulder_overlook_east',
      displayName: 'Tảng Đá Vọng Cảnh Đông',
      badge: '🪨',
      glbUrl: '/assets/glb/boulder_01.glb',
      x: 18.5,
      z: 27.5,
      rotY: -0.8,
      targetSize: 4.2,
      sizeAxis: 'max',
      hasCollider: true,
      colliderRadius: 1.8,
    },
    // Real Lush Alpine Trees & Flowering Shrubs framing the village perimeter on meadow
    {
      name: 'tree_west_meadow',
      displayName: 'Cây Tùng Đồng Cỏ Tây',
      badge: '🌲',
      glbUrl: '/assets/glb/island_tree_02.glb',
      x: -30.0,
      z: 8.0,
      rotY: 0.6,
      targetSize: 8.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'tree_east_meadow',
      displayName: 'Cây Tùng Đồng Cỏ Đông',
      badge: '🌲',
      glbUrl: '/assets/glb/island_tree_02.glb',
      x: 30.0,
      z: 8.5,
      rotY: -0.8,
      targetSize: 8.5,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'tree_southwest_meadow',
      displayName: 'Cây Tùng Tây Nam',
      badge: '🌲',
      glbUrl: '/assets/glb/island_tree_02.glb',
      x: -26.0,
      z: -17.5,
      rotY: 1.3,
      targetSize: 7.8,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'tree_southeast_meadow',
      displayName: 'Cây Tùng Đông Nam',
      badge: '🌲',
      glbUrl: '/assets/glb/island_tree_02.glb',
      x: 26.0,
      z: -17.0,
      rotY: -1.1,
      targetSize: 7.8,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'shrub_overlook_left',
      displayName: 'Bụi Cây Bờ Hồ (Trái)',
      badge: '🌿',
      glbUrl: '/assets/glb/shrub_02.glb',
      x: -16.0,
      z: 26.5,
      rotY: 0.3,
      targetSize: 2.6,
      sizeAxis: 'y',
      hasCollider: false,
    },
    {
      name: 'shrub_overlook_right',
      displayName: 'Bụi Cây Bờ Hồ (Phải)',
      badge: '🌿',
      glbUrl: '/assets/glb/shrub_02.glb',
      x: 16.0,
      z: 26.5,
      rotY: -0.3,
      targetSize: 2.6,
      sizeAxis: 'y',
      hasCollider: false,
    },
  ];

  // -------------------------------------------------------------
  // 9. ASYNC LOADING EXECUTION & COLLISION REGISTRATION
  // -------------------------------------------------------------
  const loadSingleGLTF = (url: string): Promise<THREE.Group> => {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => reject(err)
      );
    });
  };

  const readyPromise = (async () => {
    // A. Load All 10 Distinct Buildings in Parallel
    await Promise.all(
      BUILDINGS_LIST.map(async (b) => {
      try {
        const rawScene = await loadSingleGLTF(b.glbUrl);
        const bGroup = new THREE.Group();
        bGroup.position.set(b.x, 0, b.z);
        bGroup.rotation.y = b.rotY;

        rawScene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(rawScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center pivot and align bottom to y = 0
        rawScene.position.x -= center.x;
        rawScene.position.z -= center.z;
        rawScene.position.y -= box.min.y;

        // Scale to designated height in meters
        const scaledHeight = b.targetHeight * buildingScale;
        const scale = scaledHeight / Math.max(0.01, size.y);
        rawScene.scale.setScalar(scale);

        // Enhance materials and shadows
        rawScene.traverse((child) => {
          child.userData = { entityId: b.id };
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
              if (m && 'roughness' in m) {
                m.roughness = Math.max(0.35, (m.roughness || 0.7) * 0.9);
                m.metalness = Math.min(0.2, (m.metalness || 0.05));
                m.envMapIntensity = 0.55;
              }
            });
          }
        });

        bGroup.name = b.id;
        bGroup.userData = { entityId: b.id };
        bGroup.add(rawScene);

        // Add Porch Warm Light
        const lightOffset = b.lightOffset || [0, 3.2, 3.5];
        const porchLight = new THREE.PointLight('#ffb04f', 2.0, 14, 1.4);
        porchLight.position.set(lightOffset[0], lightOffset[1], lightOffset[2]);
        bGroup.add(porchLight);
        lanternLights.push(porchLight);

        // Add Thematic Signboard above entrance
        const signOffset = b.signOffset || [0, 3.5, 3.8];
        const signGroup = new THREE.Group();
        signGroup.position.set(signOffset[0], signOffset[1], signOffset[2]);

        const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.12), darkBeamMat);
        board.castShadow = true;
        signGroup.add(board);

        const badgePill = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.48, 0.16),
          new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 })
        );
        badgePill.position.set(-1.3, 0, 0.04);
        signGroup.add(badgePill);

        bGroup.add(signGroup);
        group.add(bGroup);

        // TIGHT, PRECISE OBB COLLIDER: Exact local rotated bounding box allows player to walk right up to front door!
        const halfW = b.colliderWidth * 0.40;
        const halfD = b.colliderDepth * 0.40;
        const cosR = Math.abs(Math.cos(b.rotY));
        const sinR = Math.abs(Math.sin(b.rotY));
        const boxW = halfW * cosR + halfD * sinR;
        const boxD = halfW * sinR + halfD * cosR;

        const collider: AABBCollider = {
          minX: b.x - boxW,
          maxX: b.x + boxW,
          minZ: b.z - boxD,
          maxZ: b.z + boxD,
          height: scaledHeight,
          obb: {
            cx: b.x,
            cz: b.z,
            halfW,
            halfD,
            rotY: b.rotY,
          },
        };
        colliders.push(collider);

        const entity: VillageEntity = {
          id: b.id,
          name: b.name,
          badge: b.badge,
          category: 'building',
          group: bGroup,
          collider,
          initial: {
            x: b.x,
            y: 0,
            z: b.z,
            rotY: b.rotY,
            scale: 1.0,
            halfW,
            halfD,
            height: scaledHeight,
          },
          current: {
            x: b.x,
            y: 0,
            z: b.z,
            rotY: b.rotY,
            scale: 1.0,
          },
        };
        entitiesMap.set(b.id, entity);
        entitiesList.push(entity);
      } catch (err) {
        console.error(`[VillageBuilder] Failed loading GLB for ${b.id}:`, err);
      }
    })
  );

  // B. Load All Village Props in Parallel
  await Promise.all(
    PROPS_LIST.map(async (p) => {
      try {
        const rawScene = await loadSingleGLTF(p.glbUrl);
        const propId = `prop_${p.name}`;
        const pGroup = new THREE.Group();
        pGroup.name = propId;
        pGroup.userData = { entityId: propId };
        pGroup.position.set(p.x, p.yOffset || 0, p.z);
        pGroup.rotation.y = p.rotY;

        rawScene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(rawScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        rawScene.position.x -= center.x;
        rawScene.position.z -= center.z;
        rawScene.position.y -= box.min.y;

        let dim = size.y;
        if (p.sizeAxis === 'x') dim = size.x;
        if (p.sizeAxis === 'z') dim = size.z;
        if (p.sizeAxis === 'max') dim = Math.max(size.x, size.y, size.z);

        const scale = p.targetSize / Math.max(0.001, dim);
        rawScene.scale.setScalar(scale);

        rawScene.traverse((child) => {
          child.userData = { entityId: propId };
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && 'envMapIntensity' in child.material) {
              child.material.envMapIntensity = 0.55;
            }
          }
        });

        pGroup.add(rawScene);
        group.add(pGroup);

        let collider: AABBCollider | undefined;
        if (p.hasCollider && p.colliderRadius) {
          const r = p.colliderRadius;
          collider = {
            minX: p.x - r,
            maxX: p.x + r,
            minZ: p.z - r,
            maxZ: p.z + r,
            height: p.targetSize,
          };
          colliders.push(collider);
        }

        const entity: VillageEntity = {
          id: propId,
          name: p.displayName || p.name,
          badge: p.badge || '🪴',
          category: 'prop',
          group: pGroup,
          collider,
          initial: {
            x: p.x,
            y: p.yOffset || 0,
            z: p.z,
            rotY: p.rotY,
            scale: 1.0,
            radius: p.colliderRadius,
            height: p.targetSize,
          },
          current: {
            x: p.x,
            y: p.yOffset || 0,
            z: p.z,
            rotY: p.rotY,
            scale: 1.0,
          },
        };
        entitiesMap.set(propId, entity);
        entitiesList.push(entity);
      } catch (err) {
        console.error(`[VillageBuilder] Failed loading prop ${p.name}:`, err);
      }
    })
  );

  // Restore saved custom layout from localStorage if exists
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      applyLayoutJSON(saved);
      console.log('[VillageBuilder] Restored customized layout from localStorage');
    }
  } catch {}
})();

  return {
    group,
    plazaSurface: plazaMesh,
    colliders,
    fountainUniforms: waterUniforms,
    lanternLights,
    entities: entitiesMap,
    entitiesList,
    updateEntityTransform,
    resetAllTransforms,
    getLayoutJSON,
    applyLayoutJSON,
    saveToStorage,
    update: (dt: number) => {
      waterUniforms.uTime.value += dt;
      waterMesh.rotation.z += dt * 0.12;
      lakeUniforms.uTime.value += dt;
    },
    readyPromise,
  };
}
