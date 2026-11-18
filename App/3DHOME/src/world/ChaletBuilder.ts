import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createSoftShadowTexture,
  createWovenRugTextures,
  loadPolyHavenPBR,
} from '../textures/proceduralTextures';
import { createFireplaceFlames } from '../shaders/fireplaceShader';
import { HybridAssetLoader } from '../assets/HybridAssetLoader';
import { AABBCollider } from '../types';

export interface ChaletBuildResult {
  group: THREE.Group;
  deckSurface: THREE.Mesh;
  interiorSurface: THREE.Mesh;
  colliders: AABBCollider[];
  fireplaceUniforms: { uTime: { value: number }; uIntensity: { value: number } };
  setDoorsOpen: (open: boolean) => void;
  updateDoors: (dt: number) => void;
  setLightsEnabled: (enabled: boolean) => void;
  setCutaway: (enabled: boolean) => void;
  getDoorsOpen: () => boolean;
  populateSecondaryRooms: (secondaryAssets: HybridAssetLoader) => void;
}

export function buildSwissChalet(assets?: HybridAssetLoader): ChaletBuildResult {
  const group = new THREE.Group();
  const roofCutawayGroup = new THREE.Group();
  const colliders: AABBCollider[] = [];

  // Real Poly Haven CC0 1K Scanned PBR Texture Sets (Albedo + OpenGL Normal + Roughness)
  const deckWoodTex = loadPolyHavenPBR('brown_planks_08', 4, 2.5);
  const floorWoodTex = loadPolyHavenPBR('brown_planks_07', 6.0, 11.5);
  const logWallTex = loadPolyHavenPBR('brown_planks_08', 4.2, 2.0);
  const timberBeamTex = loadPolyHavenPBR('brown_planks_07', 2, 1);
  const ceilingWoodTex = loadPolyHavenPBR('brown_planks_08', 6.5, 4.5);
  const stoneTex = loadPolyHavenPBR('cobblestone_05', 3.2, 0.75);
  const pierStoneTex = loadPolyHavenPBR('cobblestone_05', 0.9, 2.2);
  const chimneyStoneTex = loadPolyHavenPBR('cobblestone_05', 1.0, 2.4);
  const roofSlateTex = loadPolyHavenPBR('castle_wall_slates', 6, 4);
  const slateFloorTex = loadPolyHavenPBR('castle_wall_slates', 3.2, 5.0);

  // Shared PBR Materials
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckWoodTex.map,
    normalMap: deckWoodTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: deckWoodTex.roughnessMap,
    color: '#e5bc8d',
    roughness: 0.76,
    metalness: 0.03,
    envMapIntensity: 0.25,
  });

  const interiorFloorMat = new THREE.MeshStandardMaterial({
    map: floorWoodTex.map,
    normalMap: floorWoodTex.normalMap,
    normalScale: new THREE.Vector2(0.78, 0.78),
    roughnessMap: floorWoodTex.roughnessMap,
    color: '#cf975d',
    roughness: 0.44,
    metalness: 0.03,
    envMapIntensity: 0.52,
  });

  const logWallMat = new THREE.MeshStandardMaterial({
    map: logWallTex.map,
    normalMap: logWallTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: logWallTex.roughnessMap,
    color: '#dfb078',
    roughness: 0.74,
    metalness: 0.02,
    envMapIntensity: 0.20,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    map: timberBeamTex.map,
    normalMap: timberBeamTex.normalMap,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: timberBeamTex.roughnessMap,
    color: '#d9a066',
    roughness: 0.68,
    metalness: 0.03,
    envMapIntensity: 0.22,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingWoodTex.map,
    normalMap: ceilingWoodTex.normalMap,
    normalScale: new THREE.Vector2(0.70, 0.70),
    roughnessMap: ceilingWoodTex.roughnessMap,
    color: '#d8a670',
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex.map,
    normalMap: stoneTex.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: stoneTex.roughnessMap,
    color: '#d8d2c7',
    roughness: 0.92,
    metalness: 0.03,
    envMapIntensity: 0.22,
  });

  const pierStoneMat = new THREE.MeshStandardMaterial({
    map: pierStoneTex.map,
    normalMap: pierStoneTex.normalMap,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: pierStoneTex.roughnessMap,
    color: '#dcd5c9',
    roughness: 0.92,
    metalness: 0.03,
    envMapIntensity: 0.22,
  });

  const chimneyStoneMat = new THREE.MeshStandardMaterial({
    map: chimneyStoneTex.map,
    normalMap: chimneyStoneTex.normalMap,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: chimneyStoneTex.roughnessMap,
    color: '#dcd5c9',
    roughness: 0.92,
    envMapIntensity: 0.22,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    map: roofSlateTex.map,
    normalMap: roofSlateTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: roofSlateTex.roughnessMap,
    color: '#464e5a',
    roughness: 0.68,
    metalness: 0.12,
    envMapIntensity: 0.58,
  });

  const bronzeFrameMat = new THREE.MeshStandardMaterial({
    color: '#5a3822',
    roughness: 0.42,
    metalness: 0.14,
    envMapIntensity: 0.65,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#eaf5fc',
    transparent: true,
    opacity: 0.10,
    roughness: 0.05,
    metalness: 0.04,
    reflectivity: 0.76,
    ior: 1.50,
    envMapIntensity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const frostedGlassMat = new THREE.MeshPhysicalMaterial({
    color: '#e6eff6',
    transparent: true,
    opacity: 0.72,
    roughness: 0.58,
    metalness: 0.02,
    ior: 1.48,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
  });

  const warmBulbMat = new THREE.MeshStandardMaterial({
    color: '#fff1c9',
    emissive: '#ffaa3b',
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: '#1b1e22',
    roughness: 0.5,
    metalness: 0.6,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#d8dee4',
    roughness: 0.16,
    metalness: 0.92,
    envMapIntensity: 0.95,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: '#c9a25e',
    roughness: 0.28,
    metalness: 0.85,
    envMapIntensity: 0.85,
  });

  const porcelainMat = new THREE.MeshStandardMaterial({
    color: '#f5f2eb',
    roughness: 0.18,
    metalness: 0.04,
    envMapIntensity: 0.52,
  });

  const slateMat = new THREE.MeshStandardMaterial({
    map: slateFloorTex.map,
    normalMap: slateFloorTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: slateFloorTex.roughnessMap,
    color: '#828790',
    roughness: 0.65,
    metalness: 0.08,
    envMapIntensity: 0.38,
  });

  const quartzMat = new THREE.MeshStandardMaterial({
    color: '#f3efe7',
    roughness: 0.22,
    metalness: 0.04,
    envMapIntensity: 0.48,
  });

  const darkCabinetMat = new THREE.MeshStandardMaterial({
    color: '#2d3035',
    roughness: 0.52,
    metalness: 0.12,
    envMapIntensity: 0.36,
  });

  // Interior plaster & feature wall accents — warm natural timber panelling with real wood grain
  const plasterWallMat = new THREE.MeshStandardMaterial({
    map: timberBeamTex.map,
    normalMap: timberBeamTex.normalMap,
    normalScale: new THREE.Vector2(0.60, 0.60),
    roughnessMap: timberBeamTex.roughnessMap,
    color: '#d4aa74',   // warm natural wood tone matching chalet aesthetic
    roughness: 0.72,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });

  // Spine & partition walls: rich horizontal timber logs with authentic PBR maps
  const spinePanelMat = new THREE.MeshStandardMaterial({
    map: logWallTex.map,
    normalMap: logWallTex.normalMap,
    normalScale: new THREE.Vector2(0.70, 0.70),
    roughnessMap: logWallTex.roughnessMap,
    color: '#c89d6a',   // warm Alpine oak/pine
    roughness: 0.70,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });

  // Warm heavy linen drapes — slightly off-white with warm flax undertone
  const linenCurtainMat = new THREE.MeshStandardMaterial({
    color: '#d4c9b0',   // warm flax linen — not pure white, reads as fabric
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.1,
  });

  // --- Geometry constants (Phương án B: 9.0m x 16.8m Single-Floor Luxury Villa) ---
  const W = 9.0; // X: -4.5 .. +4.5
  const frontZ = 5.3;
  const rearZ = -11.5;
  const D = frontZ - rearZ; // 16.8m
  const centerZ = (frontZ + rearZ) * 0.5; // -3.1m
  const halfW = W * 0.5;
  const floorY = 0.42;
  const eaveY = 3.72;
  const ridgeY = 6.95;

  // =========================================================
  // 1. STONE PLINTH & WRAP-AROUND WOODEN DECK (Front + Left)
  // =========================================================
  const frontDeckPlinth = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.32, 3.6), stoneMat);
  frontDeckPlinth.position.set(-0.9, 0.16, 7.1);
  frontDeckPlinth.receiveShadow = true;
  frontDeckPlinth.castShadow = true;
  group.add(frontDeckPlinth);

  const leftDeckPlinth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 11.0), stoneMat);
  leftDeckPlinth.position.set(-5.85, 0.16, -0.1);
  leftDeckPlinth.receiveShadow = true;
  leftDeckPlinth.castShadow = true;
  group.add(leftDeckPlinth);

  // Front Deck Top
  const frontDeck = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.08, 3.65), deckMat);
  frontDeck.position.set(-0.9, 0.34, 7.12);
  frontDeck.receiveShadow = true;
  frontDeck.castShadow = true;
  group.add(frontDeck);

  // Left Side Deck Top
  const leftDeck = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 11.0), deckMat);
  leftDeck.position.set(-5.87, 0.34, -0.1);
  leftDeck.receiveShadow = true;
  leftDeck.castShadow = true;
  group.add(leftDeck);

  // Invisible unified deck raycast mesh for item placement
  const deckGeo = new THREE.BoxGeometry(12.6, 0.04, 3.65);
  const deckSurface = new THREE.Mesh(deckGeo, new THREE.MeshBasicMaterial({ visible: false }));
  deckSurface.position.set(-0.9, 0.38, 7.12);
  deckSurface.userData.dynamic = true;
  group.add(deckSurface);

  // Front-left 2-step wooden stairs down to stepping stones + soft contact shadow
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.13, 0.45), deckMat);
  step1.position.set(-4.2, 0.24, 9.16);
  step1.castShadow = true;
  step1.receiveShadow = true;
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.45), deckMat);
  step2.position.set(-4.2, 0.11, 9.58);
  step2.castShadow = true;
  step2.receiveShadow = true;
  const stairShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.3),
    new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    })
  );
  stairShadow.rotation.x = -Math.PI / 2;
  stairShadow.position.set(-4.2, 0.015, 9.35);
  stairShadow.userData.dynamic = true;
  group.add(step1, step2, stairShadow);

  // =========================================================
  // 2. INTERIOR HARDWOOD FLOOR, BATH SLATE FLOOR & PLINTH
  // =========================================================
  const housePlinth = new THREE.Mesh(new THREE.BoxGeometry(W, 0.38, D), stoneMat);
  housePlinth.position.set(0, 0.19, centerZ);
  housePlinth.receiveShadow = true;
  group.add(housePlinth);

  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.06, D - 0.18), interiorFloorMat);
  interiorFloor.position.set(0, floorY - 0.01, centerZ);
  interiorFloor.receiveShadow = true;
  group.add(interiorFloor);

  // Architectural slate tile overlay in Luxury Spa Bathroom (X: -4.4..-0.05, Z: -11.4..-4.32)
  const bathFloorTile = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.028, 7.08), slateMat);
  bathFloorTile.position.set(-2.225, floorY + 0.022, -7.86);
  bathFloorTile.receiveShadow = true;
  group.add(bathFloorTile);

  const interiorSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.4, D - 0.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  interiorSurface.rotation.x = -Math.PI / 2;
  interiorSurface.position.set(0, floorY + 0.02, centerZ);
  interiorSurface.userData.dynamic = true;
  group.add(interiorSurface);

  // =========================================================
  // 3. LEFT WALL (Stone Pier + Wainscot + Timber Logs + Door + Window)
  // =========================================================
  const wallT = 0.26;
  // Front-left massive stacked-stone corner pier (Image 1 & 3 signature!)
  const frontLeftPier = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.86, 0.96), pierStoneMat);
  frontLeftPier.position.set(-4.12, 1.85, 4.92);
  frontLeftPier.castShadow = true;
  frontLeftPier.receiveShadow = true;
  group.add(frontLeftPier);
  colliders.push({ minX: -4.65, maxX: -3.6, minZ: 4.4, maxZ: 5.45, tag: 'pier-fl' });

  // Stone wainscot along left wall (broken for side door at z ∈ [-3.1, -2.05])
  const leftStoneBack = new THREE.Mesh(new THREE.BoxGeometry(wallT + 0.04, 0.88, 8.4), stoneMat);
  leftStoneBack.position.set(-4.5, 0.86, -7.3);
  leftStoneBack.castShadow = true;
  leftStoneBack.receiveShadow = true;
  const leftStoneFront = new THREE.Mesh(new THREE.BoxGeometry(wallT + 0.04, 0.88, 6.6), stoneMat);
  leftStoneFront.position.set(-4.5, 0.86, 1.25);
  leftStoneFront.castShadow = true;
  leftStoneFront.receiveShadow = true;
  group.add(leftStoneBack, leftStoneFront);

  // Left timber wall segments above wainscot & around windows (side door z:-3.1..-2.05, bath frosted z:-9.2..-7.6)
  const addWallBox = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // Back of bathroom frosted window (-11.5 to -9.2)
  addWallBox(-4.5, 2.51, -10.35, wallT, 2.42, 2.3, logWallMat);
  // Below & above bathroom frosted window (-9.2 to -7.6, window y: 1.45..2.55)
  addWallBox(-4.5, 1.165, -8.4, wallT, 0.57, 1.6, logWallMat);
  addWallBox(-4.5, 3.135, -8.4, wallT, 1.17, 1.6, logWallMat);
  // Between frosted window and side door (-7.6 to -3.1)
  addWallBox(-4.5, 2.51, -5.35, wallT, 2.42, 4.5, logWallMat);
  // Above door (-3.1 to -2.05, y: 2.68..3.72)
  addWallBox(-4.5, 3.20, -2.575, wallT, 1.04, 1.05, logWallMat);
  // Between door and window (-2.05 to -0.85)
  addWallBox(-4.5, 2.51, -1.45, wallT, 2.42, 1.20, logWallMat);
  // Above window (-0.85 to +1.25, y: 2.55..3.72)
  addWallBox(-4.5, 3.135, 0.20, wallT, 1.17, 2.10, logWallMat);
  // Between window and front stone pier (+1.25 to +4.45)
  addWallBox(-4.5, 2.51, 2.85, wallT, 2.42, 3.20, logWallMat);
  // Top timber strip above front-left pier (y: 3.28..3.72)
  addWallBox(-4.5, 3.50, 4.88, wallT, 0.44, 0.85, logWallMat);

  // Wooden Side Entry Door (closed cozy oak door)
  addWallBox(-4.52, 1.54, -2.575, 0.08, 2.24, 0.98, timberMat);
  addWallBox(-4.57, 1.54, -2.10, 0.04, 2.28, 0.08, bronzeFrameMat);
  addWallBox(-4.57, 1.54, -3.05, 0.04, 2.28, 0.08, bronzeFrameMat);
  addWallBox(-4.57, 2.66, -2.575, 0.04, 0.08, 1.04, bronzeFrameMat);

  // Left Wall 2-Pane Casement Window (Kitchen/Living) & Bathroom Frosted Privacy Window
  buildFramedWindow(group, -4.53, 1.925, 0.2, 2.10, 1.25, Math.PI / 2, bronzeFrameMat, glassMat);
  buildFramedWindow(group, -4.53, 2.00, -8.4, 1.60, 1.10, Math.PI / 2, bronzeFrameMat, frostedGlassMat);

  // Left wall collider
  colliders.push({ minX: -4.7, maxX: -4.2, minZ: -11.6, maxZ: 5.4, tag: 'wall-left' });

  // =========================================================
  // 4. RIGHT WALL (Symmetrical Stone + Timber + Two Windows)
  // =========================================================
  const frontRightPier = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.86, 0.88), pierStoneMat);
  frontRightPier.position.set(4.16, 1.85, 4.96);
  frontRightPier.castShadow = true;
  frontRightPier.receiveShadow = true;
  group.add(frontRightPier);

  // Low stone wainscot on right lakefront wall + tall panoramic windows (y: 0.90..3.05)
  addWallBox(4.5, 0.66, centerZ, wallT + 0.04, 0.48, D, stoneMat);
  addWallBox(4.5, 2.31, -10.30, wallT, 2.82, 2.4, logWallMat);
  addWallBox(4.5, 3.38, -8.00, wallT, 0.68, 2.2, logWallMat);
  addWallBox(4.5, 2.31, -5.10, wallT, 2.82, 3.6, logWallMat);
  addWallBox(4.5, 3.38, -2.10, wallT, 0.68, 2.4, logWallMat);
  addWallBox(4.5, 2.31, -0.05, wallT, 2.82, 1.7, logWallMat);
  addWallBox(4.5, 3.38, 2.15, wallT, 0.68, 2.7, logWallMat);
  addWallBox(4.5, 2.31, 4.40, wallT, 2.82, 1.8, logWallMat);

  buildFramedWindow(group, 4.53, 1.97, -8.00, 2.2, 2.14, Math.PI / 2, bronzeFrameMat, glassMat);
  buildFramedWindow(group, 4.53, 1.97, -2.10, 2.4, 2.14, Math.PI / 2, bronzeFrameMat, glassMat);
  buildFramedWindow(group, 4.53, 1.97, 2.15, 2.7, 2.14, Math.PI / 2, bronzeFrameMat, glassMat);

  colliders.push({ minX: 4.2, maxX: 4.7, minZ: -11.6, maxZ: 5.4, tag: 'wall-right' });

  // =========================================================
  // 5. REAR WALL (z = -11.5 w/ Giant Bedroom Pine Forest Window) & INTERIOR PARTITION WALLS
  // =========================================================
  // Stone wainscot at rear (full 0.88m behind Bath, low 0.48m sill under Bedroom picture window)
  addWallBox(-2.25, 0.86, rearZ, 4.5, 0.88, wallT + 0.04, stoneMat);
  addWallBox(2.25, 0.66, rearZ, 4.5, 0.48, wallT + 0.04, stoneMat);

  // Solid log wall behind Spa Bathroom (X: -4.5..0.0)
  addWallBox(-2.25, 2.51, rearZ, 4.5, 2.42, wallT, logWallMat);

  // Bedroom wall piers flanking Giant Floor-to-Ceiling Pine Forest Picture Window (X: 0.5..4.0, Y: 0.90..3.14)
  addWallBox(0.25, 2.31, rearZ, 0.50, 2.82, wallT, logWallMat);
  addWallBox(4.25, 2.31, rearZ, 0.50, 2.82, wallT, logWallMat);
  addWallBox(2.25, 3.43, rearZ, 3.50, 0.58, wallT, logWallMat);
  buildFramedWindow(group, 2.25, 2.02, rearZ - 0.03, 3.50, 2.24, 0, bronzeFrameMat, glassMat, false);

  // Pleated fabric drapes — wide flat panels with sinusoidal wave shape at leading edge
  const addWindowCurtain = (cx: number, cy: number, cz: number, ry: number, cw = 0.52, ch = 2.65) => {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    cg.rotation.y = ry;

    // Create a wavy drape using a PlaneGeometry with vertex displacement
    const segW = 6; const segH = 10;
    const geo = new THREE.PlaneGeometry(cw, ch, segW, segH);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / cw + 0.5);  // 0..1
      const v = (pos.getY(i) / ch + 0.5);  // 0..1
      // Pleat wave: sinusoidal ripple along U, tapering at top (rod) and bottom
      const wave = Math.sin(u * Math.PI * 3.2) * 0.032 * Math.sin(v * Math.PI);
      pos.setZ(i, wave);
    }
    geo.computeVertexNormals();
    const drape = new THREE.Mesh(geo, linenCurtainMat);
    drape.position.set(0, 0, 0);
    drape.castShadow = true;
    drape.receiveShadow = true;
    cg.add(drape);

    // Slim brass curtain rod above
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cw + 0.08, 8), brassMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, ch * 0.5 + 0.04, 0);
    cg.add(rod);

    group.add(cg);
  };
  // Giant Bedroom Forest Picture Window curtains (left & right edges)
  addWindowCurtain(0.66, floorY + 1.48, rearZ + 0.24, 0, 0.46, 2.72);
  addWindowCurtain(3.84, floorY + 1.48, rearZ + 0.24, 0, 0.46, 2.72);
  // Front panoramic living room edge curtains
  addWindowCurtain(-3.55, floorY + 1.45, 5.02, 0, 0.48, 2.70);
  addWindowCurtain(3.82, floorY + 1.45, 5.02, 0, 0.48, 2.70);

  // Rear gable solid timber triangle (y: 3.72 -> 6.95 at z = -11.5)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-halfW, eaveY);
  gableShape.lineTo(halfW, eaveY);
  gableShape.lineTo(0, ridgeY);
  gableShape.closePath();

  const rearGableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: wallT, bevelEnabled: false });
  const rearGable = new THREE.Mesh(rearGableGeo, logWallMat);
  rearGable.position.set(0, 0, rearZ - wallT * 0.5);
  rearGable.castShadow = true;
  rearGable.receiveShadow = true;
  roofCutawayGroup.add(rearGable);

  colliders.push({ minX: -4.6, maxX: 4.6, minZ: rearZ - 0.2, maxZ: rearZ + 0.3, tag: 'wall-rear' });

  // Interior Cross Partition Wall at Z = -4.3 (separates Kitchen/Dining from Bath/Bedroom w/ two 1.0m doorways)
  const crossZ = -4.3;
  const partT = 0.20;
  // Left of Bathroom Door (X: -4.5..-1.85)
  addWallBox(-3.175, floorY + 1.65, crossZ, 2.65, 3.30, partT, spinePanelMat);
  // Lintel above Bathroom Door (X: -1.85..-0.85, y: 2.66..3.72)
  addWallBox(-1.35, 3.19, crossZ, 1.00, 1.06, partT, spinePanelMat);
  // Center Feature Pier between Bath & Bedroom Doors (X: -0.85..+0.85)
  addWallBox(0.0, floorY + 1.65, crossZ, 1.70, 3.30, partT, spinePanelMat);
  // Lintel above Bedroom Door (X: 0.85..1.85, y: 2.66..3.72)
  addWallBox(1.35, 3.19, crossZ, 1.00, 1.06, partT, spinePanelMat);
  // Right of Bedroom Door (X: 1.85..4.5)
  addWallBox(3.175, floorY + 1.65, crossZ, 2.65, 3.30, partT, spinePanelMat);

  // Upper Cross Wall Gable Triangle (in roofCutawayGroup so cutaway view shows all rooms cleanly!)
  const crossGableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: partT, bevelEnabled: false });
  const crossGable = new THREE.Mesh(crossGableGeo, plasterWallMat);
  crossGable.position.set(0, 0, crossZ - partT * 0.5);
  crossGable.castShadow = true;
  crossGable.receiveShadow = true;
  roofCutawayGroup.add(crossGable);

  // Oak door casings & swung-open oak interior doors (clear passage!)
  const addInteriorDoorway = (hingeX: number, swingDir: -1 | 1) => {
    const centerDoorX = hingeX - swingDir * 0.50;
    addWallBox(centerDoorX - 0.50, floorY + 1.12, crossZ, 0.08, 2.24, partT + 0.04, timberMat);
    addWallBox(centerDoorX + 0.50, floorY + 1.12, crossZ, 0.08, 2.24, partT + 0.04, timberMat);
    addWallBox(centerDoorX, floorY + 2.24, crossZ, 1.08, 0.08, partT + 0.04, timberMat);

    // Open oak door leaf swung inward inside room (flush against side)
    const leafPivot = new THREE.Group();
    leafPivot.position.set(hingeX, floorY, crossZ - partT * 0.5);
    leafPivot.rotation.y = swingDir * 1.42;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.18, 0.055), timberMat);
    leaf.position.set(-swingDir * 0.46, 1.09, -0.04);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.09), brassMat);
    handle.position.set(-swingDir * 0.82, 1.02, -0.04);
    leafPivot.add(leaf, handle);
    group.add(leafPivot);
  };
  addInteriorDoorway(-0.85, -1); // Bathroom door swung into Bath toward center pier
  addInteriorDoorway(0.85, 1);   // Bedroom door swung into Bedroom toward center spine

  // Cross wall colliders (leaving doors at X:[-1.85..-0.85] and X:[0.85..1.85] wide open!)
  colliders.push({ minX: -4.5, maxX: -1.85, minZ: crossZ - 0.16, maxZ: crossZ + 0.16, tag: 'wall-cross-l1' });
  colliders.push({ minX: -0.85, maxX: 0.85, minZ: crossZ - 0.16, maxZ: crossZ + 0.16, tag: 'wall-cross-mid' });
  colliders.push({ minX: 1.85, maxX: 4.5, minZ: crossZ - 0.16, maxZ: crossZ + 0.16, tag: 'wall-cross-r2' });

  // Central Spine Wall at X = 0.0 dividing Bathroom (left) & Master Bedroom (right)
  addWallBox(0.0, floorY + 1.65, -7.90, partT, 3.30, 7.20, spinePanelMat);
  // Spine upper attic beam reaching ridge inside roofCutawayGroup
  const spineAttic = new THREE.Mesh(new THREE.BoxGeometry(partT, ridgeY - eaveY, 7.20), spinePanelMat);
  spineAttic.position.set(0, (eaveY + ridgeY) * 0.5, -7.90);
  spineAttic.castShadow = true;
  roofCutawayGroup.add(spineAttic);
  colliders.push({ minX: -0.15, maxX: 0.15, minZ: rearZ, maxZ: crossZ, tag: 'wall-spine' });

  // =========================================================
  // 6. FRONT GABLE FACADE (4-Panel Sliding Glass Doors + Upper Gable Glass + Balcony)
  // =========================================================
  const doorLeftX = -3.65;
  const doorRightX = 3.88;
  const doorSpan = doorRightX - doorLeftX; // 7.53m
  const doorTopY = 3.12;
  const panelW = doorSpan / 4;
  const panelH = doorTopY - floorY;

  // Top dark transom beam above sliding doors
  addWallBox(0.12, doorTopY + 0.06, 5.26, doorSpan + 0.12, 0.14, 0.18, bronzeFrameMat);
  // Bottom track sill
  addWallBox(0.12, floorY + 0.01, 5.26, doorSpan, 0.04, 0.14, bronzeFrameMat);

  // Fixed Outer Left & Outer Right glass panels
  const buildDoorPanel = (w: number, h: number) => {
    const p = new THREE.Group();
    const frameT = 0.055;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - frameT * 2, h - frameT * 2), glassMat);
    p.add(glass);
    const topF = new THREE.Mesh(new THREE.BoxGeometry(w, frameT, 0.055), bronzeFrameMat);
    topF.position.y = h * 0.5 - frameT * 0.5;
    const botF = new THREE.Mesh(new THREE.BoxGeometry(w, frameT, 0.055), bronzeFrameMat);
    botF.position.y = -h * 0.5 + frameT * 0.5;
    const lF = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, 0.055), bronzeFrameMat);
    lF.position.x = -w * 0.5 + frameT * 0.5;
    const rF = new THREE.Mesh(new THREE.BoxGeometry(frameT, h, 0.055), bronzeFrameMat);
    rF.position.x = w * 0.5 - frameT * 0.5;
    topF.castShadow = botF.castShadow = lF.castShadow = rF.castShadow = true;
    p.add(topF, botF, lF, rF);
    return p;
  };

  const fixedLeftPanel = buildDoorPanel(panelW, panelH);
  fixedLeftPanel.position.set(doorLeftX + panelW * 0.5, floorY + panelH * 0.5, 5.28);
  const fixedRightPanel = buildDoorPanel(panelW, panelH);
  fixedRightPanel.position.set(doorRightX - panelW * 0.5, floorY + panelH * 0.5, 5.28);
  group.add(fixedLeftPanel, fixedRightPanel);

  // Animated Center Sliding Panels (default open!)
  const slideLeftPanel = buildDoorPanel(panelW + 0.04, panelH);
  const slideRightPanel = buildDoorPanel(panelW + 0.04, panelH);
  const closedLeftX = doorLeftX + panelW * 1.5;
  const closedRightX = doorRightX - panelW * 1.5;
  const openLeftX = doorLeftX + panelW * 0.55;
  const openRightX = doorRightX - panelW * 0.55;

  slideLeftPanel.position.set(openLeftX, floorY + panelH * 0.5, 5.22);
  slideRightPanel.position.set(openRightX, floorY + panelH * 0.5, 5.22);
  slideLeftPanel.traverse((o) => (o.userData.dynamic = true));
  slideRightPanel.traverse((o) => (o.userData.dynamic = true));
  group.add(slideLeftPanel, slideRightPanel);

  // Sliding door colliders (left & right fixed panel barriers, leaving a wide open center passage x: -2.0 .. +2.2)
  colliders.push({ minX: -3.7, maxX: -2.0, minZ: 5.05, maxZ: 5.45, tag: 'door-fixed-l' });
  colliders.push({ minX: 2.2, maxX: 4.5, minZ: 5.05, maxZ: 5.45, tag: 'door-fixed-r' });
  const centerDoorCollider: AABBCollider = {
    minX: -2.0,
    maxX: 2.2,
    minZ: -999,
    maxZ: -998,
    maxY: 0,
    tag: 'door-center',
  };
  colliders.push(centerDoorCollider);

  let doorsOpen = true;
  let doorOpenRatio = 1.0;

  const syncCenterCollider = () => {
    if (doorOpenRatio > 0.4) {
      // Open: move collider out of walkable path
      centerDoorCollider.minZ = -999;
      centerDoorCollider.maxZ = -998;
    } else {
      centerDoorCollider.minZ = 5.05;
      centerDoorCollider.maxZ = 5.45;
    }
  };
  syncCenterCollider();

  // Upper Gable Glazed Curtain Wall (y: 3.24 -> 6.80, matching Image 1 & Image 2 clerestory!)
  const upperGableW = 7.8;
  const gableApexY = ridgeY - 0.18;
  const gableBaseY = 3.25;

  // Triangular glass pane in the front gable
  const triGlassShape = new THREE.Shape();
  triGlassShape.moveTo(-upperGableW * 0.5, gableBaseY);
  triGlassShape.lineTo(upperGableW * 0.5, gableBaseY);
  triGlassShape.lineTo(0, gableApexY);
  triGlassShape.closePath();
  const triGlass = new THREE.Mesh(new THREE.ShapeGeometry(triGlassShape), glassMat);
  triGlass.position.z = 5.24;
  roofCutawayGroup.add(triGlass);

  // Vertical mullions across the triangular gable window
  const mullionXs = [-3.2, -2.0, -0.8, 0.4, 1.6, 2.8];
  for (const mx of mullionXs) {
    const slopeTopY = ridgeY - (Math.abs(mx) / halfW) * (ridgeY - eaveY) - 0.18;
    const h = slopeTopY - gableBaseY;
    if (h > 0.2) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.10), bronzeFrameMat);
      m.position.set(mx, gableBaseY + h * 0.5, 5.25);
      m.castShadow = true;
      roofCutawayGroup.add(m);
    }
  }
  // Horizontal timber header beam at balcony floor level
  addWallBox(0, 3.21, 5.26, W - 0.2, 0.24, 0.28, timberMat);

  // =========================================================
  // 7. PROJECTING UPPER TIMBER BALCONY (Image 1 Hero Feature!)
  // =========================================================
  const balcW = 7.4;
  const balcDepth = 0.32;
  const balcY = 3.26;
  const balcZCenter = 5.3 + balcDepth * 0.5;

  // Slim exterior timber header ledge (keeps upper gable glass unobstructed)
  addWallBox(0, balcY, balcZCenter, balcW, 0.12, balcDepth, timberMat);

  // Front Terrace Sleek Glass Balustrade along outer deck edge (z = 8.88, keeping Reference Img 2 lake vista clear)
  const deckRailZ = 8.88;
  const deckRailH = 0.86;
  const deckRailSpan = 8.2; // x: -2.7 .. +5.3 (leaving steps at x=-4.2 clear)
  addWallBox(1.3, 0.38 + deckRailH, deckRailZ, deckRailSpan, 0.06, 0.08, bronzeFrameMat);
  for (const dpx of [-2.7, -0.7, 1.3, 3.3, 5.3]) {
    addWallBox(dpx, 0.38 + deckRailH * 0.5, deckRailZ, 0.07, deckRailH, 0.07, bronzeFrameMat);
  }
  const deckGlassRail = new THREE.Mesh(new THREE.PlaneGeometry(deckRailSpan, deckRailH - 0.08), glassMat);
  deckGlassRail.position.set(1.3, 0.38 + deckRailH * 0.5, deckRailZ);
  group.add(deckGlassRail);

  // =========================================================
  // 8. ROOF SLOPES, DEEP OVERHANGS, EXPOSED RAFTERS & PURLINS
  // =========================================================
  const overhangX = 1.05;
  const overhangZ = 1.15;
  const roofHalfSpanX = halfW + overhangX; // 5.55m
  const riseTotal = ridgeY - eaveY; // 3.23m
  const slopeAngle = Math.atan2(riseTotal, halfW); // ~35.6 deg
  const slopeLen = roofHalfSpanX / Math.cos(slopeAngle); // ~6.83m
  const roofLengthZ = D + overhangZ * 2; // 12.9m

  const buildRoofSlope = (side: -1 | 1) => {
    const slopeGroup = new THREE.Group();
    // Timber underside sheathing
    const woodDeck = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.08, roofLengthZ), ceilingMat);
    woodDeck.receiveShadow = true;
    woodDeck.castShadow = true;
    slopeGroup.add(woodDeck);

    // Slate shingle top layer
    const slate = new THREE.Mesh(new THREE.BoxGeometry(slopeLen + 0.06, 0.11, roofLengthZ + 0.06), roofMat);
    slate.position.y = 0.095;
    slate.castShadow = true;
    slate.receiveShadow = true;
    slopeGroup.add(slate);

    // Dark fascia trim along outer eave edge
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, roofLengthZ + 0.08), bronzeFrameMat);
    fascia.position.set(side * (slopeLen * 0.5), 0.04, 0);
    slopeGroup.add(fascia);

    // Position pivot at ridge centered at centerZ
    slopeGroup.rotation.z = -side * slopeAngle;
    const midX = side * (slopeLen * 0.5) * Math.cos(slopeAngle);
    const midY = ridgeY - (slopeLen * 0.5) * Math.sin(slopeAngle) + 0.08;
    slopeGroup.position.set(midX, midY, centerZ);
    roofCutawayGroup.add(slopeGroup);
  };

  buildRoofSlope(-1);
  buildRoofSlope(1);

  // Ridge Cap & Exposed Ridge Beam + Purlins + Interior/Exterior Rafters
  const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, roofLengthZ + 0.1), bronzeFrameMat);
  ridgeCap.position.set(0, ridgeY + 0.18, centerZ);
  roofCutawayGroup.add(ridgeCap);

  // Heavy Ridge Beam & Eave Purlins protruding out the front & rear gables (classic chalet!)
  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, roofLengthZ - 0.15), timberMat);
  ridgeBeam.position.set(0, ridgeY - 0.14, centerZ);
  ridgeBeam.castShadow = true;
  roofCutawayGroup.add(ridgeBeam);

  for (const sx of [-1, 1]) {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, roofLengthZ - 0.15), timberMat);
    const px = sx * 2.35;
    const py = ridgeY - (2.35 / halfW) * riseTotal - 0.16;
    purlin.position.set(px, py, centerZ);
    purlin.castShadow = true;
    roofCutawayGroup.add(purlin);

    // Protruding front gable bargeboard
    const bargeFront = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.24, 0.14), timberMat);
    bargeFront.rotation.z = -sx * slopeAngle;
    bargeFront.position.set(
      sx * (slopeLen * 0.5) * Math.cos(slopeAngle),
      ridgeY - (slopeLen * 0.5) * Math.sin(slopeAngle) - 0.02,
      frontZ + overhangZ - 0.08
    );
    bargeFront.castShadow = true;
    roofCutawayGroup.add(bargeFront);

    // Protruding rear gable bargeboard
    const bargeRear = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.24, 0.14), timberMat);
    bargeRear.rotation.z = -sx * slopeAngle;
    bargeRear.position.set(
      sx * (slopeLen * 0.5) * Math.cos(slopeAngle),
      ridgeY - (slopeLen * 0.5) * Math.sin(slopeAngle) - 0.02,
      rearZ - overhangZ + 0.08
    );
    bargeRear.castShadow = true;
    roofCutawayGroup.add(bargeRear);
  }

  // Exposed interior & eave timber rafters spaced along Z
  for (let rz = rearZ - 0.55; rz <= frontZ + 0.55; rz += 1.32) {
    for (const sx of [-1, 1]) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(slopeLen - 0.25, 0.18, 0.12), timberMat);
      rafter.rotation.z = -sx * slopeAngle;
      rafter.position.set(
        sx * ((slopeLen - 0.2) * 0.5) * Math.cos(slopeAngle),
        ridgeY - ((slopeLen - 0.2) * 0.5) * Math.sin(slopeAngle) - 0.08,
        rz
      );
      rafter.castShadow = true;
      roofCutawayGroup.add(rafter);
    }
  }

  // =========================================================
  // 9. STACKED-STONE CHIMNEY (Exterior Left Slope + Interior Fireplace!)
  // =========================================================
  const chimneyX = -3.85;
  const chimneyZ = 1.85;

  // Exterior chimney shaft rising above left roof slope (bottom above ceiling plane so zero internal protrusion)
  const extChimney = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.7, 0.96), chimneyStoneMat);
  extChimney.position.set(chimneyX, 6.28, chimneyZ);
  extChimney.castShadow = true;
  extChimney.receiveShadow = true;
  roofCutawayGroup.add(extChimney);

  // Projecting stone cap & dark metal flue hood
  const chimCap = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.14, 1.14), stoneMat);
  chimCap.position.set(chimneyX, 7.70, chimneyZ);
  chimCap.castShadow = true;
  const chimFlue = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.36, 12), ironMat);
  chimFlue.position.set(chimneyX, 7.91, chimneyZ);
  roofCutawayGroup.add(chimCap, chimFlue);

  // Interior Stacked-Stone Fireplace directly below on Left Wall (Image 2!)
  const fpX = -3.95;
  const fpZ = chimneyZ;

  // Raised stone hearth
  const fpHearth = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.34, 1.95), chimneyStoneMat);
  fpHearth.position.set(fpX + 0.12, floorY + 0.17, fpZ);
  fpHearth.castShadow = true;
  fpHearth.receiveShadow = true;
  group.add(fpHearth);

  // Firebox stone surround pillars & backing
  addWallBox(fpX - 0.24, floorY + 0.84, fpZ, 0.34, 1.02, 1.56, chimneyStoneMat);
  addWallBox(fpX + 0.06, floorY + 0.84, fpZ - 0.62, 0.62, 1.02, 0.34, chimneyStoneMat);
  addWallBox(fpX + 0.06, floorY + 0.84, fpZ + 0.62, 0.62, 1.02, 0.34, chimneyStoneMat);

  // Black iron firebox frame
  const fireboxBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.86, 0.94), ironMat);
  fireboxBack.position.set(fpX - 0.04, floorY + 0.78, fpZ);
  group.add(fireboxBack);

  // Thick rustic timber mantel beam above firebox (Image 2!)
  const mantel = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 1.82), timberMat);
  mantel.position.set(fpX + 0.08, floorY + 1.44, fpZ);
  mantel.castShadow = true;
  group.add(mantel);

  // Upper stone chimney breast stopping neatly at sloped ceiling plane
  const fpBreast = new THREE.Mesh(new THREE.BoxGeometry(0.76, 2.08, 1.48), chimneyStoneMat);
  fpBreast.position.set(fpX - 0.02, floorY + 2.48, fpZ);
  fpBreast.castShadow = true;
  fpBreast.receiveShadow = true;
  group.add(fpBreast);

  // Animated GLSL Fireplace Flames & Warm Flickering Light
  const { group: flameGroup, uniforms: fireplaceUniforms } = createFireplaceFlames();
  flameGroup.position.set(fpX + 0.14, floorY + 0.36, fpZ);
  flameGroup.rotation.y = Math.PI / 2;
  flameGroup.scale.set(1.28, 1.12, 1.25);
  flameGroup.traverse((o) => (o.userData.dynamic = true));
  group.add(flameGroup);

  const fireLight = new THREE.PointLight('#ff8e3c', 6.2, 11.0, 1.5);
  fireLight.position.set(fpX + 0.72, floorY + 0.92, fpZ);
  group.add(fireLight);

  // Warm hidden architectural cove uplighting along cathedral timber ceiling rafters (Ref Image 1)
  const coveLightFront = new THREE.PointLight('#ffb96e', 2.3, 10.5, 1.5);
  coveLightFront.position.set(0.2, 5.15, 2.2);
  const coveLightBack = new THREE.PointLight('#ffb96e', 1.8, 9.5, 1.5);
  coveLightBack.position.set(0.2, 5.15, -1.6);
  group.add(coveLightFront, coveLightBack);

  colliders.push({ minX: -4.5, maxX: -3.25, minZ: fpZ - 1.0, maxZ: fpZ + 1.0, tag: 'fireplace' });

  // =========================================================
  // 10. BUILT-IN WOOD BOOKSHELF (Real GLB) & HARMONIZED LIVING SUITE
  // =========================================================
  const shelfZ = 3.58;
  const shelfX = -4.12;
  const gltfShelf = assets?.cloneNormalized('wooden_bookshelf_worn', 2.35);
  if (gltfShelf) {
    gltfShelf.position.set(shelfX, floorY, shelfZ);
    gltfShelf.rotation.y = Math.PI / 2;
    gltfShelf.traverse((o) => {
      o.userData.dynamic = true;
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        const m = o.material;
        if (m instanceof THREE.MeshStandardMaterial) {
          o.material = m.clone();
          (o.material as THREE.MeshStandardMaterial).color.multiply(new THREE.Color('#c29164'));
          (o.material as THREE.MeshStandardMaterial).envMapIntensity = 0.28;
        }
      }
    });
    group.add(gltfShelf);
  } else {
    addWallBox(shelfX, floorY + 1.38, shelfZ - 0.66, 0.38, 2.76, 0.08, timberMat);
    addWallBox(shelfX, floorY + 1.38, shelfZ + 0.66, 0.38, 2.76, 0.08, timberMat);
    addWallBox(shelfX - 0.16, floorY + 1.38, shelfZ, 0.06, 2.76, 1.36, logWallMat);
    for (let sy = 0.08; sy <= 2.72; sy += 0.56) {
      addWallBox(shelfX, floorY + sy, shelfZ, 0.36, 0.06, 1.28, timberMat);
    }
  }
  const shelfLight = new THREE.PointLight('#ffbe6b', 1.4, 4.2, 1.8);
  shelfLight.position.set(shelfX + 0.35, floorY + 1.6, shelfZ);
  group.add(shelfLight);

  // Open panoramic glass corners match Reference Image 1 (no bulky cylinder curtains)

  // Cozy Interior Resort Living Suite (Real CC0 GLB Sofa, Coffee Table, Dining Set, Lounge Chairs)
  const tableMat = timberMat;
  const sofaMat = new THREE.MeshStandardMaterial({ color: '#ede5d5', roughness: 0.88 });
  const rugTex = createWovenRugTextures();
  const rugMat = new THREE.MeshStandardMaterial({
    map: rugTex.map,
    normalMap: rugTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: rugTex.roughnessMap,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.16,
  });

  const placeGltfHero = (
    id: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    targetH: number,
    castShadow = true,
    tintHex?: string,
    maxEnv = 0.38,
    parent: THREE.Group = group,
    loaderSource: HybridAssetLoader | undefined = assets
  ): boolean => {
    const model = loaderSource?.cloneNormalized(id, targetH);
    if (!model) return false;
    model.position.set(x, y, z);
    model.rotation.y = rotY;
    model.traverse((o) => {
      o.userData.dynamic = true;
      if (o instanceof THREE.Mesh) {
        o.castShadow = castShadow;
        o.receiveShadow = true;
        if (tintHex || maxEnv < 1.0) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          const cloned = mats.map((m) => {
            if (!(m instanceof THREE.MeshStandardMaterial)) return m;
            const cm = m.clone();
            if (tintHex) cm.color.multiply(new THREE.Color(tintHex));
            cm.envMapIntensity = Math.min(cm.envMapIntensity, maxEnv);
            cm.roughness = Math.max(cm.roughness, 0.42);
            return cm;
          });
          o.material = Array.isArray(o.material) ? cloned : cloned[0];
        }
      }
    });
    parent.add(model);
    return true;
  };

  // Curated shelf props using already-loaded assets
  placeGltfHero('ceramic_vase_01', shelfX + 0.04, floorY + 1.24, shelfZ + 0.25, 0.3, 0.26, true, '#efe6d8', 0.35);
  placeGltfHero('wooden_bowl_01', shelfX + 0.04, floorY + 0.82, shelfZ - 0.22, 0.8, 0.12, true, '#d8aa78', 0.30);

  // =========================================================
  // 11. FRONT LAKEFRONT LIVING LOUNGE (Phase 1 Modern Alpine Suite)
  // =========================================================
  const sofaRug = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.016, 3.2), rugMat);
  sofaRug.position.set(0.35, floorY + 0.029, 2.25);
  sofaRug.receiveShadow = true;
  group.add(sofaRug);

  if (!placeGltfHero('sofa_03', 0.35, floorY, 1.38, 0, 0.84, true, '#f2eadc', 0.32)) {
    if (!placeGltfHero('Sofa_01', 0.35, floorY, 1.38, 0, 0.86, true, '#f5ebdc', 0.32)) {
      const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.34, 0.92), sofaMat);
      sofaBase.position.set(0.35, floorY + 0.22, 1.38);
      group.add(sofaBase);
    }
  }
  colliders.push({ minX: -0.90, maxX: 1.60, minZ: 0.88, maxZ: 1.90, tag: 'living-sofa' });

  // Throw pillows arranged gently on the main living sofa
  placeGltfHero('throw_pillows_01', 0.35, floorY + 0.38, 1.36, 0.15, 0.34, true, '#efe7da', 0.30);

  if (!placeGltfHero('modern_arm_chair_01', -1.52, floorY, 2.55, Math.PI * 0.36, 0.84, true, '#efe5d6', 0.32)) {
    placeGltfHero('ArmChair_01', -1.52, floorY, 2.55, Math.PI * 0.36, 0.84, true, '#f5ebdc', 0.32);
  }
  if (!placeGltfHero('modern_arm_chair_01', 2.22, floorY, 2.55, -Math.PI * 0.36, 0.84, true, '#efe5d6', 0.32)) {
    placeGltfHero('ArmChair_01', 2.22, floorY, 2.55, -Math.PI * 0.36, 0.84, true, '#f5ebdc', 0.32);
  }
  colliders.push({ minX: -2.02, maxX: -1.02, minZ: 2.05, maxZ: 3.05, tag: 'armchair-l' });
  colliders.push({ minX: 1.72, maxX: 2.72, minZ: 2.05, maxZ: 3.05, tag: 'armchair-r' });

  if (!placeGltfHero('modern_coffee_table_01', 0.35, floorY, 2.68, 0, 0.44, true, '#e8d0b5', 0.34)) {
    if (!placeGltfHero('CoffeeTable_01', 0.35, floorY, 2.68, 0, 0.45, true, '#f2dcc4', 0.34)) {
      const coffeeTbl = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 0.78), tableMat);
      coffeeTbl.position.set(0.35, floorY + 0.42, 2.68);
      group.add(coffeeTbl);
    }
  }
  colliders.push({ minX: -0.40, maxX: 1.10, minZ: 2.22, maxZ: 3.14, tag: 'coffee-table' });

  placeGltfHero('brass_vase_01', 0.08, floorY + 0.44, 2.68, 0.4, 0.28, true, undefined, 0.65);
  placeGltfHero('tea_set_01', 0.56, floorY + 0.44, 2.70, -0.35, 0.16, true, '#faf5ec', 0.42);

  // Fireplace mantel styling & Hallway pier console + gallery art + sconces
  placeGltfHero('ceramic_vase_01', fpX + 0.14, floorY + 1.55, fpZ - 0.35, 0.5, 0.32, true, '#f2e8da', 0.35);
  placeGltfHero('ClassicConsole_01', 0.0, floorY, -3.96, 0, 0.80, true, '#c99c72', 0.34);
  placeGltfHero('potted_plant_02', -0.35, floorY + 0.80, -3.96, 0.2, 0.32, true, undefined, 0.45);
  placeGltfHero('brass_vase_01', 0.28, floorY + 0.80, -3.96, 0.2, 0.30, true, undefined, 0.68);
  placeGltfHero('hanging_picture_frame_01', 0.0, floorY + 1.55, -4.16, 0, 0.78, true);
  placeGltfHero('industrial_wall_sconce', -0.62, floorY + 1.68, -4.15, 0, 0.34, false, undefined, 0.55);
  placeGltfHero('industrial_wall_sconce', 0.62, floorY + 1.68, -4.15, 0, 0.34, false, undefined, 0.55);
  placeGltfHero('fancy_picture_frame_01', -3.65, floorY + 2.05, -4.16, 0, 0.85, true);

  // Grand Vaulted Living Chandelier
  if (!placeGltfHero('Chandelier_01', 0.35, floorY + 3.05, 2.05, 0.2, 0.96, false, undefined, 0.55, roofCutawayGroup)) {
    placeGltfHero('lantern_chandelier_01', 0.35, floorY + 3.05, 2.05, 0.25, 1.05, false, undefined, 0.38, roofCutawayGroup);
  }
  const chanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.25, 6), bronzeFrameMat);
  chanRod.position.set(0.35, floorY + 5.20, 2.05);
  roofCutawayGroup.add(chanRod);
  const indoorChandelierLight = new THREE.PointLight('#ffdca8', 2.0, 9.5, 1.55);
  indoorChandelierLight.position.set(0.35, floorY + 2.95, 2.05);
  group.add(indoorChandelierLight);

  // =========================================================
  // 12. OPEN-CONCEPT LUXURY KITCHEN, WATERFALL ISLAND & DINING (Z: -4.2 .. +0.3)
  // =========================================================
  // Tall Built-in Matte Charcoal Fridge & Pantry Column (back-left corner X: -4.02, Z: -3.84)
  addWallBox(-4.02, floorY + 1.18, -3.84, 0.72, 2.36, 0.68, darkCabinetMat);
  addWallBox(-3.68, floorY + 1.32, -3.49, 0.025, 0.62, 0.03, brassMat); // Upper fridge handle
  addWallBox(-3.68, floorY + 0.52, -3.49, 0.025, 0.42, 0.03, brassMat); // Freezer handle
  colliders.push({ minX: -4.42, maxX: -3.62, minZ: -4.22, maxZ: -3.46, tag: 'kitchen-fridge' });

  // Rear Kitchen Base Cabinet Run + Calacatta Quartz Countertop (X: -3.66..-1.92, Z: -3.84)
  addWallBox(-2.79, floorY + 0.43, -3.84, 1.74, 0.86, 0.66, darkCabinetMat);
  addWallBox(-2.79, floorY + 0.89, -3.84, 1.78, 0.06, 0.70, quartzMat);
  // Integrated brushed stainless undermount sink + high-arc brass faucet
  addWallBox(-2.18, floorY + 0.922, -3.84, 0.54, 0.015, 0.42, slateMat);
  const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.28, 10), brassMat);
  faucetStem.position.set(-2.18, floorY + 1.06, -4.06);
  const faucetSpout = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 8, 16, Math.PI), brassMat);
  faucetSpout.position.set(-2.18, floorY + 1.20, -3.975);
  faucetSpout.rotation.y = Math.PI / 2;
  group.add(faucetStem, faucetSpout);
  // Overhead sleek stainless range hood above induction stove
  addWallBox(-3.08, floorY + 2.02, -3.82, 0.76, 0.14, 0.54, chromeMat);
  addWallBox(-3.08, floorY + 2.68, -3.92, 0.28, 1.22, 0.26, chromeMat);
  colliders.push({ minX: -3.70, maxX: -1.88, minZ: -4.22, maxZ: -3.46, tag: 'kitchen-counter' });

  // Waterfall Calacatta Marble Island Bar (X: -2.25, Z: -1.35)
  addWallBox(-2.25, floorY + 0.43, -1.35, 1.84, 0.86, 0.78, darkCabinetMat);
  addWallBox(-2.25, floorY + 0.89, -1.35, 1.96, 0.06, 0.92, quartzMat);
  addWallBox(-3.20, floorY + 0.46, -1.35, 0.055, 0.92, 0.92, quartzMat); // Left waterfall leg
  addWallBox(-1.30, floorY + 0.46, -1.35, 0.055, 0.92, 0.92, quartzMat); // Right waterfall leg
  colliders.push({ minX: -3.26, maxX: -1.24, minZ: -1.85, maxZ: -0.85, tag: 'kitchen-island' });

  // Alpine Fine Dining Area (Right side, X: 2.45, Z: -2.15 overlooking lake window)
  if (!placeGltfHero('dining_table', 2.45, floorY, -2.15, Math.PI / 2, 0.76, true, '#d8b086', 0.36)) {
    addWallBox(2.45, floorY + 0.76, -2.15, 1.05, 0.07, 1.95, tableMat);
  }
  colliders.push({ minX: 1.75, maxX: 3.15, minZ: -3.05, maxZ: -1.25, tag: 'dining-table' });
  placeGltfHero('wooden_bowl_01', 2.45, floorY + 0.76, -2.15, 0.35, 0.11, true);
  placeGltfHero('food_apple_01', 2.42, floorY + 0.80, -2.13, 0.2, 0.085, true);
  placeGltfHero('food_apple_01', 2.49, floorY + 0.80, -2.18, 1.4, 0.082, true);
  placeGltfHero('dining_chair_02', 1.82, floorY, -1.72, Math.PI / 2, 0.86, true, '#e8dccb', 0.32);
  placeGltfHero('dining_chair_02', 1.82, floorY, -2.58, Math.PI / 2, 0.86, true, '#e8dccb', 0.32);
  placeGltfHero('dining_chair_02', 3.08, floorY, -1.72, -Math.PI / 2, 0.86, true, '#e8dccb', 0.32);
  placeGltfHero('dining_chair_02', 3.08, floorY, -2.58, -Math.PI / 2, 0.86, true, '#e8dccb', 0.32);

  const kitchenLight = new THREE.PointLight('#ffe2b8', 2.2, 8.5, 1.5);
  kitchenLight.position.set(-2.25, floorY + 2.75, -1.95);
  group.add(kitchenLight);

  // =========================================================
  // 13. MASTER BEDROOM ARCHITECTURAL BASE (X: 0.1..4.4, Z: -11.4..-4.4)
  // =========================================================
  const bedroomRug = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.016, 2.7), rugMat);
  bedroomRug.position.set(1.55, floorY + 0.025, -7.80);
  bedroomRug.receiveShadow = true;
  group.add(bedroomRug);

  // Plush Cream Linen Mattress Base along Spine Wall (X: 0.25..2.20, Z: -8.68..-6.92)
  addWallBox(1.22, floorY + 0.22, -7.80, 1.92, 0.28, 1.72, porcelainMat);
  addWallBox(1.38, floorY + 0.35, -7.80, 1.56, 0.06, 1.66, sofaMat); // Folded cream linen duvet
  colliders.push({ minX: 0.20, maxX: 2.30, minZ: -8.80, maxZ: -6.80, tag: 'master-bed' });

  const bedroomLight = new THREE.PointLight('#ffe0b2', 2.2, 9.5, 1.5);
  bedroomLight.position.set(2.25, floorY + 2.75, -8.00);
  group.add(bedroomLight);

  // =========================================================
  // 14. ENCLOSED LUXURY SPA BATHROOM ARCHITECTURAL BASE (X: -4.4..-0.1, Z: -11.4..-4.4)
  // =========================================================
  // Freestanding Sculpted Soaking Tub (Back-left corner under frosted window light)
  const tubX = -2.95;
  const tubZ = -10.30;
  const tubShell = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.40, 0.56, 28), porcelainMat);
  tubShell.scale.set(1.85, 1.0, 1.0);
  tubShell.position.set(tubX, floorY + 0.28, tubZ);
  tubShell.castShadow = true;
  tubShell.receiveShadow = true;
  const tubWater = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.04, 24), glassMat);
  tubWater.scale.set(1.78, 1.0, 0.92);
  tubWater.position.set(tubX, floorY + 0.52, tubZ);
  // Floor-mounted chrome tub filler stand
  const tubFiller = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.84, 10), chromeMat);
  tubFiller.position.set(tubX + 0.92, floorY + 0.42, tubZ - 0.18);
  const tubSpout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.03), chromeMat);
  tubSpout.position.set(tubX + 0.84, floorY + 0.82, tubZ - 0.18);
  group.add(tubShell, tubWater, tubFiller, tubSpout);
  colliders.push({ minX: -3.90, maxX: -1.95, minZ: -10.82, maxZ: -9.75, tag: 'spa-tub' });

  // Frameless Glass Walk-in Rain Shower (Front-left corner X: -4.35..-2.60, Z: -6.45..-4.45)
  addWallBox(-3.48, floorY + 0.02, -5.45, 1.72, 0.04, 1.96, slateMat);
  addWallBox(-4.02, floorY + 0.042, -5.45, 0.06, 0.008, 1.35, chromeMat); // Linear drain
  const showerGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 2.32, 1.38), glassMat);
  showerGlass.position.set(-2.62, floorY + 1.18, -5.14);
  showerGlass.userData.dynamic = true;
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 16), chromeMat);
  showerHead.position.set(-3.55, floorY + 2.30, -5.40);
  const showerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 8), chromeMat);
  showerArm.position.set(-3.55, floorY + 2.58, -5.40);
  group.add(showerGlass, showerHead, showerArm);
  colliders.push({ minX: -2.72, maxX: -2.52, minZ: -5.90, maxZ: -4.42, tag: 'shower-glass' });

  // Floating Oak Double Vanity + Twin Vessel Basins (Spine Wall X: -0.50, Z: -8.35)
  addWallBox(-0.46, floorY + 0.62, -8.35, 0.58, 0.42, 2.10, timberMat);
  addWallBox(-0.46, floorY + 0.85, -8.35, 0.62, 0.055, 2.14, quartzMat);
  for (const bz of [-8.90, -7.80]) {
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.14, 20), porcelainMat);
    basin.position.set(-0.46, floorY + 0.94, bz);
    const fPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.24, 10), chromeMat);
    fPost.position.set(-0.22, floorY + 0.98, bz);
    const fArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.025), chromeMat);
    fArm.position.set(-0.29, floorY + 1.09, bz);
    group.add(basin, fPost, fArm);
  }
  colliders.push({ minX: -0.88, maxX: -0.10, minZ: -9.46, maxZ: -7.24, tag: 'bath-vanity' });

  // Wall-Hung Ceramic WC (X: -3.95, Z: -7.45)
  addWallBox(-4.26, floorY + 0.52, -7.45, 0.22, 1.04, 0.64, plasterWallMat); // Concealed cistern boxing
  const wcPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.22), chromeMat);
  wcPlate.position.set(-4.14, floorY + 0.88, -7.45);
  const wcBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.34, 18), porcelainMat);
  wcBowl.scale.set(1.25, 1.0, 1.0);
  wcBowl.position.set(-3.90, floorY + 0.24, -7.45);
  const wcSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.035, 18), porcelainMat);
  wcSeat.scale.set(1.25, 1.0, 1.0);
  wcSeat.position.set(-3.90, floorY + 0.42, -7.45);
  group.add(wcPlate, wcBowl, wcSeat);
  colliders.push({ minX: -4.40, maxX: -3.55, minZ: -7.85, maxZ: -7.05, tag: 'bath-wc' });

  const bathLight = new THREE.PointLight('#ffeacc', 1.9, 8.5, 1.5);
  bathLight.position.set(-2.25, floorY + 2.75, -8.00);
  group.add(bathLight);

  // =========================================================
  // 15. PHASE 2 BACKGROUND STREAMING STAGING (Kitchen, Bedroom, Bath, Fine Styling)
  // =========================================================
  let secondaryPopulated = false;
  const populateSecondaryRooms = (secAssets: HybridAssetLoader) => {
    if (secondaryPopulated) return;
    secondaryPopulated = true;

    // Bookshelf & Coffee Table hardcover book styling
    placeGltfHero('book_encyclopedia_set_01', shelfX + 0.04, floorY + 1.72, shelfZ - 0.12, Math.PI / 2, 0.22, true, undefined, 0.32, group, secAssets);
    placeGltfHero('book_encyclopedia_set_01', shelfX + 0.04, floorY + 0.40, shelfZ + 0.14, Math.PI / 2, 0.22, true, undefined, 0.32, group, secAssets);
    // Fireplace mantel candlesticks & Ottoman accent
    placeGltfHero('brass_candleholders', fpX + 0.14, floorY + 1.55, fpZ + 0.36, 0.3, 0.26, true, undefined, 0.65, group, secAssets);
    placeGltfHero('Ottoman_01', -1.05, floorY, 3.65, 0.3, 0.44, true, '#efe5d6', 0.32, group, secAssets);

    // Kitchen Appliances, Counter Styling & Waterfall Island Bar Stools
    placeGltfHero('electric_stove', -3.08, floorY + 0.92, -3.84, 0, 0.10, true, undefined, 0.48, group, secAssets);
    placeGltfHero('modern_wooden_cabinet', -4.05, floorY, -0.35, Math.PI / 2, 0.88, true, '#c99c72', 0.34, group, secAssets);
    placeGltfHero('drawer_cabinet', -2.75, floorY, -1.35, Math.PI, 0.86, true, '#d8b48e', 0.34, group, secAssets);
    placeGltfHero('bar_chair_round_01', -2.92, floorY, -0.68, Math.PI, 0.72, true, undefined, 0.38, group, secAssets);
    placeGltfHero('bar_chair_round_01', -2.25, floorY, -0.68, Math.PI, 0.72, true, undefined, 0.38, group, secAssets);
    placeGltfHero('bar_chair_round_01', -1.58, floorY, -0.68, Math.PI, 0.72, true, undefined, 0.38, group, secAssets);
    placeGltfHero('wooden_cutting_board', -2.55, floorY + 0.92, -1.35, 0.12, 0.05, true, undefined, 0.36, group, secAssets);
    placeGltfHero('croissant', -2.55, floorY + 0.95, -1.35, 0.4, 0.08, true, undefined, 0.36, group, secAssets);
    placeGltfHero('vintage_electric_kettle', -1.85, floorY + 0.92, -1.42, -0.5, 0.24, true, undefined, 0.65, group, secAssets);
    placeGltfHero('wine_bottles_01', -1.55, floorY + 0.92, -1.30, 0.25, 0.32, true, undefined, 0.45, group, secAssets);
    placeGltfHero('modern_ceiling_lamp_01', -2.55, floorY + 2.38, -1.35, 0, 0.42, false, undefined, 0.55, roofCutawayGroup, secAssets);
    placeGltfHero('modern_ceiling_lamp_01', -1.95, floorY + 2.38, -1.35, 0, 0.42, false, undefined, 0.55, roofCutawayGroup, secAssets);
    placeGltfHero('brass_candleholders', 2.45, floorY + 0.76, -1.68, 0.2, 0.26, true, undefined, 0.68, group, secAssets);

    // Master Bedroom Luxury Suite (Bed, Nightstands, Reading Nook, Dresser, Window Planter)
    placeGltfHero('GothicBed_01', 1.22, floorY, -7.80, Math.PI / 2, 1.38, true, '#8c694b', 0.32, group, secAssets);
    placeGltfHero('throw_pillows_01', 0.58, floorY + 0.38, -7.80, Math.PI / 2, 0.34, true, '#efe6d8', 0.30, group, secAssets);
    placeGltfHero('ClassicNightstand_01', 0.48, floorY, -9.22, Math.PI / 2, 0.62, true, '#c2986e', 0.34, group, secAssets);
    placeGltfHero('ClassicNightstand_01', 0.48, floorY, -6.38, Math.PI / 2, 0.62, true, '#c2986e', 0.34, group, secAssets);
    placeGltfHero('potted_plant_02', 0.48, floorY + 0.62, -9.22, 0.3, 0.32, true, undefined, 0.45, group, secAssets);
    placeGltfHero('brass_candleholders', 0.48, floorY + 0.62, -6.38, -0.2, 0.24, true, undefined, 0.65, group, secAssets);
    placeGltfHero('drawer_cabinet', 3.92, floorY, -5.50, -Math.PI / 2, 0.86, true, '#caa076', 0.34, group, secAssets);
    placeGltfHero('ornate_mirror_01', 4.30, floorY + 1.52, -5.50, -Math.PI / 2, 0.92, false, undefined, 0.65, group, secAssets);
    placeGltfHero('brass_vase_01', 3.92, floorY + 0.86, -5.50, 0.1, 0.28, true, undefined, 0.68, group, secAssets);
    placeGltfHero('modern_arm_chair_01', 3.22, floorY, -10.12, Math.PI * 0.86, 0.84, true, '#efe5d6', 0.32, group, secAssets);
    placeGltfHero('Ottoman_01', 2.66, floorY, -10.48, 0.2, 0.42, true, '#efe5d6', 0.32, group, secAssets);
    // Real potted plant (potted_plant_02 from 3dsky / Poly Haven) placed at its authentic tabletop/corner scale
    placeGltfHero('potted_plant_02', 0.78, floorY, -10.75, 0.4, 0.46, true, undefined, 0.45, group, secAssets);
    placeGltfHero('modern_ceiling_lamp_01', 2.25, floorY + 2.75, -7.80, 0, 0.48, false, undefined, 0.55, roofCutawayGroup, secAssets);
    // Art on bedroom wall — framed painting above the bed headboard
    placeGltfHero('hanging_picture_frame_01', 1.22, floorY + 1.72, -4.44, 0, 0.72, false, undefined, 0.65, group, secAssets);
    // Ceramic vase + tea set on nightstand
    placeGltfHero('ceramic_vase_01', 0.48, floorY + 0.65, -6.38, 0.5, 0.18, true, undefined, 0.65, group, secAssets);

    // Spa Bathroom Mirror, Sconces, Vase, Candles & Greenery
    placeGltfHero('ornate_mirror_01', -0.14, floorY + 1.62, -8.90, -Math.PI / 2, 0.90, false, undefined, 0.65, group, secAssets);
    placeGltfHero('ornate_mirror_01', -0.14, floorY + 1.62, -7.80, -Math.PI / 2, 0.90, false, undefined, 0.65, group, secAssets);
    placeGltfHero('industrial_wall_sconce', -0.16, floorY + 1.78, -9.58, -Math.PI / 2, 0.32, false, undefined, 0.55, group, secAssets);
    placeGltfHero('industrial_wall_sconce', -0.16, floorY + 1.78, -7.12, -Math.PI / 2, 0.32, false, undefined, 0.55, group, secAssets);
    placeGltfHero('potted_plant_02', -0.46, floorY + 0.88, -8.35, 0.3, 0.30, true, undefined, 0.45, group, secAssets);
    placeGltfHero('brass_candleholders', -2.06, floorY + 0.56, -10.30, 0.5, 0.24, true, undefined, 0.68, group, secAssets);
    placeGltfHero('fern_02', -3.95, floorY, -10.65, -0.4, 0.42, true, undefined, 0.38, group, secAssets);
    placeGltfHero('ceramic_vase_01', -2.06, floorY + 0.60, -10.30, 0.3, 0.16, true, undefined, 0.65, group, secAssets);
  };

  if (assets && assets.has('GothicBed_01')) {
    populateSecondaryRooms(assets);
  }

  // Front-Right Deck: Two Real GLB Lounge Chairs + Side Coffee Table
  const buildDeckChair = (lx: number, lz: number, ry: number) => {
    if (!placeGltfHero('mid_century_lounge_chair', lx, 0.38, lz, ry, 0.84, true)) {
      const fallback = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.72, 0.66), tableMat);
      fallback.position.set(lx, 0.74, lz);
      group.add(fallback);
    }
    colliders.push({ minX: lx - 0.45, maxX: lx + 0.45, minZ: lz - 0.45, maxZ: lz + 0.45, tag: 'deck-chair' });
  };

  buildDeckChair(2.45, 7.15, -0.35);
  buildDeckChair(3.75, 7.15, -0.48);

  if (!placeGltfHero('coffee_table_round_01', 3.10, 0.38, 7.25, 0.4, 0.42)) {
    const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.42, 12), tableMat);
    sideTbl.position.set(3.10, 0.59, 7.25);
    group.add(sideTbl);
  }

  // Left-side Deck: Real GLTF Outdoor Table & Chair Set
  if (!placeGltfHero('outdoor_table_chair_set_01', -5.85, 0.38, 3.1, Math.PI / 2, 0.82, true)) {
    const bistroTop = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.06, 16), tableMat);
    bistroTop.position.set(-5.85, 1.12, 3.1);
    group.add(bistroTop);
  }
  colliders.push({ minX: -6.7, maxX: -5.0, minZ: 2.1, maxZ: 4.1, tag: 'patio-set' });

  // Real GLTF Lanterns on deck steps & front corner
  placeGltfHero('Lantern_01', -3.05, 0.38, 8.55, 0.3, 0.36);
  placeGltfHero('Lantern_01', 4.65, 0.38, 8.55, -0.4, 0.36);

  // Floral Deck Planter Boxes visible right outside panoramic glass doors (Ref Image 1)
  if (placeGltfHero('planter_box_01', -2.05, 0.38, 8.32, 0.04, 0.42)) {
    placeGltfHero('periwinkle_plant', -2.05, 0.68, 8.32, 0.4, 0.44);
  }
  if (placeGltfHero('planter_box_01', 2.85, 0.38, 8.32, -0.05, 0.42)) {
    placeGltfHero('periwinkle_plant', 2.85, 0.68, 8.32, 1.2, 0.44);
  }
  if (placeGltfHero('planter_box_01', -6.35, 0.38, 6.25, 0.15, 0.44)) {
    placeGltfHero('flower_gazania', -6.35, 0.72, 6.25, 0.4, 0.38);
  }

  // Real CC0 Potted Botanical Plants flanking steps, deck corners & warm indoor living corner
  placeGltfHero('potted_plant_04', -3.45, 0.38, 6.15, 0.3, 0.88);
  placeGltfHero('potted_plant_04', 4.35, 0.38, 6.25, -0.6, 0.84);
  placeGltfHero('potted_plant_04', 4.05, floorY, 4.35, 1.1, 0.92);

  // Outdoor Lakefront Patio Stone Fire Pit nestled flush into lower lawn terrace
  placeGltfHero('stone_fire_pit', -5.20, -0.07, 11.35, 0.4, 0.44);

  // Subtle Animated Chimney Smoke Wisps rising from stone flue
  const smokePuffs: THREE.Mesh[] = [];
  const smokeMat = new THREE.MeshBasicMaterial({
    color: '#f4f7fb',
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22 + i * 0.06, 8, 8), smokeMat);
    puff.position.set(chimneyX, 8.2 + i * 0.45, chimneyZ);
    puff.userData.dynamic = true;
    smokePuffs.push(puff);
    group.add(puff);
  }

  // =========================================================
  // 11. WARM CARRIAGE WALL LANTERNS (Exterior + Interior Chimney)
  // =========================================================
  const lanternLights: THREE.PointLight[] = [];
  const lanternBulbs: THREE.Mesh[] = [];

  const addLantern = (x: number, y: number, z: number, lightIntensity = 2.6) => {
    const lGroup = new THREE.Group();
    lGroup.position.set(x, y, z);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.18), ironMat);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.12, 4), ironMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.20;
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.20, 0.12), warmBulbMat);
    bulb.userData.dynamic = true;
    lanternBulbs.push(bulb);

    const pt = new THREE.PointLight('#ffaa44', lightIntensity, 6.5, 1.8);
    lanternLights.push(pt);

    lGroup.add(frame, roof, bulb, pt);
    group.add(lGroup);
  };

  // Front-left stone pier lantern (Image 1)
  addLantern(-3.98, 2.24, 5.48, 2.8);
  // Left wall lanterns flanking casement window (Image 1)
  addLantern(-4.72, 2.16, -1.18, 2.2);
  addLantern(-4.72, 2.16, 1.56, 2.2);
  // Front-right corner pier lantern (Image 1)
  addLantern(4.18, 2.24, 5.46, 2.5);
  // Interior lantern mounted on stone chimney breast (Image 2!)
  addLantern(fpX + 0.42, floorY + 2.25, fpZ, 3.2);

  // Warm interior ceiling fill light so interior glows warmly from outside (Image 1)
  const interiorWarmFill = new THREE.PointLight('#ffd494', 2.3, 12.0, 1.6);
  interiorWarmFill.position.set(0.2, 3.2, 1.0);
  group.add(interiorWarmFill);

  // =========================================================
  // DOOR ANIMATION & LIGHTING TOGGLES
  // =========================================================
  let lightsEnabled = true;

  const setDoorsOpen = (open: boolean) => {
    doorsOpen = open;
  };

  const getDoorsOpen = () => doorsOpen;

  const updateDoors = (dt: number) => {
    const target = doorsOpen ? 1.0 : 0.0;
    doorOpenRatio += (target - doorOpenRatio) * Math.min(1, dt * 5.5);
    slideLeftPanel.position.x = THREE.MathUtils.lerp(closedLeftX, openLeftX, doorOpenRatio);
    slideRightPanel.position.x = THREE.MathUtils.lerp(closedRightX, openRightX, doorOpenRatio);
    syncCenterCollider();

    // Gentle firelight flicker & chimney smoke drift when enabled
    const t = fireplaceUniforms.uTime.value;
    if (lightsEnabled) {
      fireLight.intensity = 6.0 + Math.sin(t * 9.5) * 0.6 + Math.cos(t * 15.2) * 0.35;
    }
    smokePuffs.forEach((puff, idx) => {
      puff.visible = lightsEnabled;
      if (!lightsEnabled) return;
      const phase = ((t * 0.35 + idx / smokePuffs.length) % 1.0);
      puff.position.set(
        chimneyX - phase * 0.95 + Math.sin(t * 1.4 + idx) * 0.09,
        8.12 + phase * 3.1,
        chimneyZ + phase * 0.35
      );
      puff.scale.setScalar(0.75 + phase * 1.65);
    });
  };

  const setLightsEnabled = (enabled: boolean) => {
    lightsEnabled = enabled;
    fireplaceUniforms.uIntensity.value = enabled ? 1.0 : 0.0;
    fireLight.intensity = enabled ? 6.2 : 0.0;
    shelfLight.intensity = enabled ? 1.4 : 0.0;
    indoorChandelierLight.intensity = enabled ? 2.0 : 0.0;
    coveLightFront.intensity = enabled ? 2.3 : 0.0;
    coveLightBack.intensity = enabled ? 1.8 : 0.0;
    interiorWarmFill.intensity = enabled ? 2.3 : 0.5;
    kitchenLight.intensity = enabled ? 2.2 : 0.35;
    bedroomLight.intensity = enabled ? 2.2 : 0.35;
    bathLight.intensity = enabled ? 1.9 : 0.35;
    for (const l of lanternLights) {
      l.intensity = enabled ? 2.2 : 0.0;
    }
    warmBulbMat.emissiveIntensity = enabled ? 2.0 : 0.0;
  };

  mergeStaticChaletMeshes(group);
  mergeStaticChaletMeshes(roofCutawayGroup);
  group.add(roofCutawayGroup);

  const setCutaway = (enabled: boolean) => {
    roofCutawayGroup.visible = !enabled;
  };

  return {
    group,
    deckSurface,
    interiorSurface,
    colliders,
    fireplaceUniforms,
    setDoorsOpen,
    updateDoors,
    setLightsEnabled,
    setCutaway,
    getDoorsOpen,
    populateSecondaryRooms,
  };
}

function buildFramedWindow(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  rotY: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  withCenterMullion = true
): void {
  const wg = new THREE.Group();
  wg.position.set(x, y, z);
  wg.rotation.y = rotY;

  const t = 0.07;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width - t, height - t), glassMat);
  wg.add(glass);

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, t, 0.12), frameMat);
  top.position.y = height * 0.5;
  const bot = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, t * 1.2, 0.16), frameMat);
  bot.position.y = -height * 0.5;
  const left = new THREE.Mesh(new THREE.BoxGeometry(t, height, 0.12), frameMat);
  left.position.x = -width * 0.5;
  const right = new THREE.Mesh(new THREE.BoxGeometry(t, height, 0.12), frameMat);
  right.position.x = width * 0.5;
  top.castShadow = bot.castShadow = left.castShadow = right.castShadow = true;
  wg.add(top, bot, left, right);
  if (withCenterMullion) {
    const mid = new THREE.Mesh(new THREE.BoxGeometry(t * 0.85, height, 0.10), frameMat);
    mid.castShadow = true;
    wg.add(mid);
  }

  parent.add(wg);
}

/**
 * Merges static non-animated chalet meshes sharing the same material to slash mobile draw calls (~220 -> ~14).
 */
function mergeStaticChaletMeshes(root: THREE.Group): void {
  root.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; castShadow: boolean; receiveShadow: boolean }>();
  const toRemove: THREE.Mesh[] = [];

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj instanceof THREE.InstancedMesh) return;
    if (obj.userData.dynamic) return;
    const mat = obj.material;
    if (Array.isArray(mat) || !mat || mat.transparent) return;

    const cloned = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
    cloned.applyMatrix4(obj.matrixWorld);
    if (!cloned.attributes.uv) {
      const count = cloned.attributes.position.count;
      cloned.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    let entry = buckets.get(mat);
    if (!entry) {
      entry = { geos: [], castShadow: false, receiveShadow: false };
      buckets.set(mat, entry);
    }
    entry.geos.push(cloned);
    if (obj.castShadow) entry.castShadow = true;
    if (obj.receiveShadow) entry.receiveShadow = true;
    toRemove.push(obj);
  });

  for (const m of toRemove) {
    m.parent?.remove(m);
  }

  buckets.forEach((entry, mat) => {
    if (entry.geos.length === 0) return;
    const merged = mergeGeometries(entry.geos, false);
    entry.geos.forEach((g) => g.dispose());
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = entry.castShadow;
    mesh.receiveShadow = entry.receiveShadow;
    root.add(mesh);
  });
}
