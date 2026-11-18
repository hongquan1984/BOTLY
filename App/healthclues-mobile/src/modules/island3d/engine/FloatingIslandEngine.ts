// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  STARTER_HOUSE_CONFIG,
  MOUNTAIN_CONFIG,
  STREAM_WAYPOINTS,
  STREAM_EXCLUSION_WIDTH,
  ISLAND_BOUNDS,
  CAMERA_CONFIG,
  DECOR_CATALOG,
} from '../constants/islandConfig';
import { PlacedItemInstance, PlacementValidationResult } from '../types/island';

export interface FloatingIslandEngineOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  assetBaseUrl?: string;
  onSelectPlacedItem?: (instance: PlacedItemInstance | null) => void;
  onPlacementChange?: (pos: { x: number; z: number }, isValid: boolean) => void;
}

export class FloatingIslandEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private animFrameId: number | null = null;
  private isDisposed: boolean = false;

  // Scene elements
  private islandGroup: THREE.Group;
  private mountainGroup: THREE.Group;
  private streamGroup: THREE.Group;
  private waterfallMesh: THREE.Mesh | null = null;
  private starterHouseGroup: THREE.Group;
  private placedObjectsGroup: THREE.Group;
  private raycastPlane: THREE.Mesh;
  private previewGhostGroup: THREE.Group;
  private previewCursorMesh: THREE.Mesh;

  // Camera Orbit state
  private cameraDistance: number = CAMERA_CONFIG.defaultDistance;
  private cameraPolar: number = CAMERA_CONFIG.defaultPolarAngle;
  private cameraAzimuth: number = CAMERA_CONFIG.defaultAzimuthAngle;
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.8, 0);
  private isResettingCamera: boolean = false;

  // Interaction & Decoration state
  public isDecorationMode: boolean = false;
  private activePreviewItemId: string | null = null;
  private activePreviewPosition: { x: number; z: number } = { x: 0, z: 0 };
  private activePreviewRotationY: number = 0;
  private isPlacementValid: boolean = true;
  private selectedInstanceId: string | null = null;

  // Asset Caches
  private gltfLoader: GLTFLoader;
  private loadedModelTemplates: Map<string, THREE.Group> = new Map();
  private placedItemInstancesMap: Map<string, THREE.Group> = new Map();
  private assetBaseUrl: string;

  // Callbacks
  private onSelectPlacedItem?: (instance: PlacedItemInstance | null) => void;
  private onPlacementChange?: (pos: { x: number; z: number }, isValid: boolean) => void;

  constructor(options: FloatingIslandEngineOptions) {
    this.canvas = options.canvas;
    this.assetBaseUrl = options.assetBaseUrl || '/assets/models/';
    this.onSelectPlacedItem = options.onSelectPlacedItem;
    this.onPlacementChange = options.onPlacementChange;

    // 1. Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87CEEB'); // Soft morning sky blue

    // 2. Initialize Camera
    this.camera = new THREE.PerspectiveCamera(42, options.width / options.height, 0.5, 200);
    this.updateCameraPosition();

    // 3. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.gltfLoader = new GLTFLoader();

    // 4. Scene Groups
    this.islandGroup = new THREE.Group();
    this.mountainGroup = new THREE.Group();
    this.streamGroup = new THREE.Group();
    this.starterHouseGroup = new THREE.Group();
    this.placedObjectsGroup = new THREE.Group();
    this.previewGhostGroup = new THREE.Group();

    this.scene.add(this.islandGroup);
    this.scene.add(this.mountainGroup);
    this.scene.add(this.streamGroup);
    this.scene.add(this.starterHouseGroup);
    this.scene.add(this.placedObjectsGroup);
    this.scene.add(this.previewGhostGroup);

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build Island Base
    this.buildIslandTerrain();

    // 7. Build Mountain Peak
    this.buildMountainPeak();

    // 8. Build Stream & Waterfall
    this.buildStreamAndWaterfall();

    // 9. Build Starter House
    this.buildStarterHouse();

    // 10. Setup Placement Raycast Plane & Cursor
    this.raycastPlane = this.createRaycastPlane();
    this.scene.add(this.raycastPlane);

    this.previewCursorMesh = this.createPreviewCursor();
    this.scene.add(this.previewCursorMesh);
    this.previewCursorMesh.visible = false;

    // Start render loop
    this.startLoop();
  }

  // -------------------------------------------------------------
  // LIGHTING & ENVIRONMENT
  // -------------------------------------------------------------
  private setupLighting(): void {
    // Soft fantasy hemisphere skylight (warm sky, earthy bounce)
    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#4b3f35', 1.1);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    // Warm morning fantasy sun
    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.85);
    dirLight.position.set(18, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Subtle ambient fill
    const ambientLight = new THREE.AmbientLight('#fef3c7', 0.45);
    this.scene.add(ambientLight);
  }

  // -------------------------------------------------------------
  // PROCEDURAL FLOATING ISLAND TERRAIN
  // -------------------------------------------------------------
  private buildIslandTerrain(): void {
    const islandRadiusX = 14.5;
    const islandRadiusZ = 14.5;
    const heightTotal = 15.0;
    const radialSegments = 64;
    const heightSegments = 24;

    const cylinderGeo = new THREE.CylinderGeometry(
      islandRadiusX,
      0.6,
      heightTotal,
      radialSegments,
      heightSegments,
      false
    );

    const pos = cylinderGeo.attributes.position;
    const colors: number[] = [];
    const v = new THREE.Vector3();

    // Cozy Fantasy Color Palette
    const colGrass = new THREE.Color('#48bb78');      // Lush green grass
    const colGrassDeep = new THREE.Color('#38a169');  // Deep meadow
    const colLoam = new THREE.Color('#4a3728');       // Top soil edge
    const colCliff = new THREE.Color('#574b40');      // Weathered cliff rock
    const colBasalt = new THREE.Color('#2d2621');     // Deep mountain keel

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const angle = Math.atan2(v.z, v.x);
      const normalizedY = (v.y + heightTotal / 2) / heightTotal; // 0 = keel, 1 = top

      if (normalizedY >= 0.96) {
        // Top plateau surface
        const wobble = Math.sin(v.x * 0.4) * Math.cos(v.z * 0.4) * 0.12;
        v.y += wobble;

        // Slight stream bed depression along the stream path
        const streamDist = this.getDistanceToStream(v.x, v.z);
        if (streamDist < 1.6) {
          v.y -= Math.max(0, 0.35 * (1.0 - streamDist / 1.6));
        }
      } else {
        // Natural rocky tapered underside keel
        const taper = Math.pow(normalizedY, 0.48);
        const strata = 1.0 + Math.sin(normalizedY * Math.PI * 10) * 0.04;
        const noise = 1.0 + 0.05 * Math.sin(angle * 6 + 1.0) + 0.03 * Math.cos(angle * 8);

        v.x = v.x * taper * strata * noise;
        v.z = v.z * taper * strata * noise;

        // Asymmetric keel tilt into cloud sea
        if (normalizedY < 0.3) {
          v.x += (0.3 - normalizedY) * 2.2;
          v.z -= (0.3 - normalizedY) * 1.4;
        }
      }

      pos.setXYZ(i, v.x, v.y, v.z);

      // Vertex color by elevation & strata
      const c = new THREE.Color();
      if (normalizedY >= 0.94) {
        c.copy(colGrass).lerp(colGrassDeep, (Math.sin(v.x * 2.5 + v.z * 2.5) + 1.0) * 0.5);
      } else if (normalizedY > 0.8) {
        c.copy(colLoam).lerp(colCliff, (0.94 - normalizedY) * 7.0);
      } else if (normalizedY > 0.3) {
        c.copy(colCliff).lerp(colBasalt, (0.8 - normalizedY) * 2.0);
      } else {
        c.copy(colBasalt);
      }

      colors.push(c.r, c.g, c.b);
    }

    cylinderGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    cylinderGeo.computeVertexNormals();

    const islandMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.03,
      flatShading: true,
    });

    const islandMesh = new THREE.Mesh(cylinderGeo, islandMat);
    islandMesh.position.y = -heightTotal / 2 + ISLAND_BOUNDS.centerGroundY;
    islandMesh.receiveShadow = true;
    islandMesh.castShadow = true;
    this.islandGroup.add(islandMesh);

    // Floating cloud ring around the island keel
    this.buildKeelMistPuffs();
  }

  private buildKeelMistPuffs(): void {
    const mistGeo = new THREE.DodecahedronGeometry(1.5, 1);
    const mistMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.72,
      flatShading: true,
    });

    for (let i = 0; i < 9; i++) {
      const puff = new THREE.Mesh(mistGeo, mistMat);
      const angle = (i / 9) * Math.PI * 2;
      const radius = 9.5 + (i % 3) * 2.0;
      puff.scale.set(1.5 + (i % 2) * 0.5, 0.7, 1.3 + (i % 3) * 0.4);
      puff.position.set(Math.cos(angle) * radius, -9.0 + (i % 3) * 1.2, Math.sin(angle) * radius);
      this.islandGroup.add(puff);
    }
  }

  // -------------------------------------------------------------
  // MOUNTAIN PEAK (Upper-left corner, non-obstructive)
  // -------------------------------------------------------------
  private buildMountainPeak(): void {
    const mountainGeo = new THREE.ConeGeometry(
      MOUNTAIN_CONFIG.baseRadius,
      MOUNTAIN_CONFIG.peakHeight,
      18,
      8,
      false
    );

    const pos = mountainGeo.attributes.position;
    const colors: number[] = [];
    const v = new THREE.Vector3();

    const colRock = new THREE.Color('#4c4139');
    const colMoss = new THREE.Color('#384b39');
    const colSnow = new THREE.Color('#f0f9ff');

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const normalizedY = (v.y + MOUNTAIN_CONFIG.peakHeight / 2) / MOUNTAIN_CONFIG.peakHeight;

      // Organic rugged noise
      const angle = Math.atan2(v.z, v.x);
      const facetNoise = 1.0 + 0.12 * Math.sin(angle * 5 + normalizedY * 4);
      v.x *= facetNoise;
      v.z *= facetNoise;

      pos.setXYZ(i, v.x, v.y, v.z);

      // Color: snowy crown at top, rugged granite & moss at foot
      const c = new THREE.Color();
      if (normalizedY > 0.72) {
        c.copy(colRock).lerp(colSnow, (normalizedY - 0.72) / 0.28);
      } else if (normalizedY < 0.25) {
        c.copy(colMoss).lerp(colRock, normalizedY / 0.25);
      } else {
        c.copy(colRock);
      }

      colors.push(c.r, c.g, c.b);
    }

    mountainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mountainGeo.computeVertexNormals();

    const mountainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
    });

    const mountainMesh = new THREE.Mesh(mountainGeo, mountainMat);
    mountainMesh.position.set(
      MOUNTAIN_CONFIG.position.x,
      MOUNTAIN_CONFIG.position.y + MOUNTAIN_CONFIG.peakHeight / 2 - 0.2,
      MOUNTAIN_CONFIG.position.z
    );
    mountainMesh.receiveShadow = true;
    mountainMesh.castShadow = true;
    this.mountainGroup.add(mountainMesh);

    // Natural mountain foot boulders
    const boulderMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.88, flatShading: true });
    for (let b = 0; b < 4; b++) {
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85 + (b % 2) * 0.35, 1), boulderMat);
      const bAngle = 0.5 + b * 0.75;
      boulder.position.set(
        MOUNTAIN_CONFIG.position.x + Math.cos(bAngle) * 3.8,
        ISLAND_BOUNDS.centerGroundY + 0.4,
        MOUNTAIN_CONFIG.position.z + Math.sin(bAngle) * 3.8
      );
      boulder.scale.set(1.2, 0.7, 1.1);
      boulder.castShadow = true;
      this.mountainGroup.add(boulder);
    }
  }

  // -------------------------------------------------------------
  // ANIMATED STREAM & RIM WATERFALL
  // -------------------------------------------------------------
  private buildStreamAndWaterfall(): void {
    // 1. Water Ribbon Shape
    const streamShape = new THREE.Shape();
    streamShape.moveTo(-6.5, -6.5);
    streamShape.quadraticCurveTo(-3.5, -2.5, -0.5, 1.2);
    streamShape.quadraticCurveTo(3.2, 4.8, 8.0, 5.2);
    streamShape.lineTo(8.5, 3.8);
    streamShape.quadraticCurveTo(3.8, 3.2, 0.5, 0.2);
    streamShape.quadraticCurveTo(-2.5, -3.2, -5.5, -7.2);
    streamShape.closePath();

    const streamGeo = new THREE.ShapeGeometry(streamShape, 20);
    streamGeo.rotateX(-Math.PI / 2);

    const streamMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8', // Crystal turquoise stream
      roughness: 0.08,
      metalness: 0.3,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.position.y = ISLAND_BOUNDS.centerGroundY + 0.04;
    streamMesh.receiveShadow = true;
    this.streamGroup.add(streamMesh);

    // 2. Cascade Waterfall over the island rim
    const wfSlices = 24;
    const wfPos: number[] = [];
    const wfUv: number[] = [];
    const wfInd: number[] = [];

    for (let s = 0; s <= wfSlices; s++) {
      const u = s / wfSlices;
      const y = (ISLAND_BOUNDS.centerGroundY + 0.04) - u * 14.5;
      const outward = Math.sin(u * 1.1) * 1.2;
      const cx = 8.2 + outward;
      const cz = 4.5 + outward * 0.8;
      const halfW = 1.3 - Math.sin(u * Math.PI) * 0.25;

      wfPos.push(cx - 0.7 * halfW, y, cz + 0.7 * halfW);
      wfUv.push(0, u * 4.0);

      wfPos.push(cx + 0.7 * halfW, y, cz - 0.7 * halfW);
      wfUv.push(1, u * 4.0);

      if (s > 0) {
        const base = s * 2;
        wfInd.push(base - 2, base, base - 1);
        wfInd.push(base - 1, base, base + 1);
      }
    }

    const wfGeo = new THREE.BufferGeometry();
    wfGeo.setAttribute('position', new THREE.Float32BufferAttribute(wfPos, 3));
    wfGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wfUv, 2));
    wfGeo.setIndex(wfInd);
    wfGeo.computeVertexNormals();

    const wfMat = new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });

    this.waterfallMesh = new THREE.Mesh(wfGeo, wfMat);
    this.streamGroup.add(this.waterfallMesh);
  }

  // -------------------------------------------------------------
  // STARTER HOUSE
  // -------------------------------------------------------------
  private buildStarterHouse(): void {
    this.starterHouseGroup.position.set(
      STARTER_HOUSE_CONFIG.position.x,
      STARTER_HOUSE_CONFIG.position.y,
      STARTER_HOUSE_CONFIG.position.z
    );
    this.starterHouseGroup.rotation.y = STARTER_HOUSE_CONFIG.rotation.y;
    this.starterHouseGroup.scale.set(
      STARTER_HOUSE_CONFIG.scale.x,
      STARTER_HOUSE_CONFIG.scale.y,
      STARTER_HOUSE_CONFIG.scale.z
    );

    // Try loading actual GLB model; create beautiful wooden cottage fallback while loading
    const fallbackHouse = this.createProceduralCottageMesh();
    fallbackHouse.name = 'ProceduralStarterCottage';
    this.starterHouseGroup.add(fallbackHouse);

    const modelPath = `${this.assetBaseUrl}${STARTER_HOUSE_CONFIG.modelFileName}`;
    this.gltfLoader.load(
      modelPath,
      (gltf: any) => {
        if (this.isDisposed) return;
        this.starterHouseGroup.remove(fallbackHouse);
        const houseModel = gltf.scene;
        houseModel.traverse((child: any) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.starterHouseGroup.add(houseModel);
      },
      undefined,
      (err: any) => {
        // Fallback is already added and looks great!
        console.warn('Using procedural starter cottage fallback:', err?.message || err);
      }
    );
  }

  private createProceduralCottageMesh(): THREE.Group {
    const cottage = new THREE.Group();

    // Stone base foundation
    const stoneBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.5, 3.2),
      new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.9 })
    );
    stoneBase.position.y = 0.25;
    stoneBase.castShadow = true;
    stoneBase.receiveShadow = true;
    cottage.add(stoneBase);

    // Timber walls
    const woodWalls = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.2, 3.0),
      new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.78 })
    );
    woodWalls.position.y = 1.6;
    woodWalls.castShadow = true;
    woodWalls.receiveShadow = true;
    cottage.add(woodWalls);

    // Cozy alpine pitched roof
    const roofGeo = new THREE.ConeGeometry(2.7, 1.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(
      roofGeo,
      new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.65 }) // Warm terracotta red roof
    );
    roof.position.y = 3.5;
    roof.scale.set(1.15, 1.0, 1.05);
    roof.castShadow = true;
    cottage.add(roof);

    // Wooden door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.1),
      new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.7 })
    );
    door.position.set(0, 1.2, 1.55);
    cottage.add(door);

    // Warm glowing window
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.1),
      new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#facc15', emissiveIntensity: 0.85 })
    );
    windowMesh.position.set(1.0, 1.8, 1.55);
    cottage.add(windowMesh);

    return cottage;
  }

  // -------------------------------------------------------------
  // RAYCAST & PREVIEW CURSOR
  // -------------------------------------------------------------
  private createRaycastPlane(): THREE.Mesh {
    const geo = new THREE.CircleGeometry(ISLAND_BOUNDS.radiusMax + 1.0, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = ISLAND_BOUNDS.centerGroundY;
    return mesh;
  }

  private createPreviewCursor(): THREE.Mesh {
    const ringGeo = new THREE.RingGeometry(0.7, 0.85, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: '#10b981', // Green for valid
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const cursor = new THREE.Mesh(ringGeo, mat);
    cursor.position.y = ISLAND_BOUNDS.centerGroundY + 0.05;
    return cursor;
  }

  // -------------------------------------------------------------
  // DECORATION VALIDATION RULES
  // -------------------------------------------------------------
  public validatePlacement(x: number, z: number, colliderRadius: number = 1.0): PlacementValidationResult {
    // 1. Check island perimeter bound
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter + colliderRadius > ISLAND_BOUNDS.radiusMax) {
      return {
        status: 'out_of_bounds',
        isValid: false,
        messageVi: 'Vật phẩm vượt quá mép đảo!',
      };
    }

    // 2. Check collision with Starter House
    const distToHouse = Math.hypot(x - STARTER_HOUSE_CONFIG.position.x, z - STARTER_HOUSE_CONFIG.position.z);
    if (distToHouse < STARTER_HOUSE_CONFIG.colliderRadius + colliderRadius) {
      return {
        status: 'colliding_house',
        isValid: false,
        messageVi: 'Không thể đặt chồng lấn lên Ngôi Nhà Khởi Đầu!',
      };
    }

    // 3. Check collision with Mountain Peak
    const distToMountain = Math.hypot(x - MOUNTAIN_CONFIG.position.x, z - MOUNTAIN_CONFIG.position.z);
    if (distToMountain < MOUNTAIN_CONFIG.baseRadius * 0.85 + colliderRadius) {
      return {
        status: 'colliding_mountain',
        isValid: false,
        messageVi: 'Khu vực vách núi dốc, không thể xây dựng!',
      };
    }

    // 4. Check collision with Stream
    const distToStream = this.getDistanceToStream(x, z);
    if (distToStream < STREAM_EXCLUSION_WIDTH / 2 + colliderRadius) {
      return {
        status: 'colliding_stream',
        isValid: false,
        messageVi: 'Không thể đặt chắn dòng chảy suối nguồn!',
      };
    }

    return {
      status: 'valid',
      isValid: true,
      messageVi: 'Vị trí hợp lệ để đặt vật phẩm!',
    };
  }

  private getDistanceToStream(px: number, pz: number): number {
    let minDist = 999;
    for (let i = 0; i < STREAM_WAYPOINTS.length - 1; i++) {
      const a = STREAM_WAYPOINTS[i];
      const b = STREAM_WAYPOINTS[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const lenSq = dx * dx + dz * dz;
      let t = lenSq === 0 ? 0 : ((px - a.x) * dx + (pz - a.z) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = a.x + t * dx;
      const projZ = a.z + t * dz;
      const dist = Math.hypot(px - projX, pz - projZ);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  // -------------------------------------------------------------
  // DECORATION PREVIEW & GHOST PLACEMENT
  // -------------------------------------------------------------
  public setDecorationPreviewItem(itemId: string | null): void {
    this.activePreviewItemId = itemId;
    this.previewGhostGroup.clear();

    if (!itemId) {
      this.previewCursorMesh.visible = false;
      return;
    }

    const itemDef = DECOR_CATALOG.find((d) => d.id === itemId);
    if (!itemDef) return;

    this.previewCursorMesh.visible = true;

    // Load or create ghost mesh
    const ghost = this.createGhostMeshForCatalogItem(itemDef);
    this.previewGhostGroup.add(ghost);
    this.updatePreviewTransform();
  }

  public updatePreviewPositionFromNormalizedTouch(normX: number, normY: number): void {
    if (!this.activePreviewItemId) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(normX, normY), this.camera);
    const intersects = raycaster.intersectObject(this.raycastPlane);

    if (intersects.length > 0) {
      const hit = intersects[0].point;

      // Snapping to grid (0.5m)
      const step = ISLAND_BOUNDS.snappingGridStep;
      const snappedX = Math.round(hit.x / step) * step;
      const snappedZ = Math.round(hit.z / step) * step;

      this.activePreviewPosition = { x: snappedX, z: snappedZ };

      const itemDef = DECOR_CATALOG.find((d) => d.id === this.activePreviewItemId);
      const radius = itemDef ? itemDef.colliderRadius : 1.0;
      const validation = this.validatePlacement(snappedX, snappedZ, radius);

      this.isPlacementValid = validation.isValid;
      this.updatePreviewTransform();

      // Update cursor ring color
      const cursorMat = this.previewCursorMesh.material as THREE.MeshBasicMaterial;
      cursorMat.color.set(validation.isValid ? '#10b981' : '#ef4444');

      if (this.onPlacementChange) {
        this.onPlacementChange(this.activePreviewPosition, validation.isValid);
      }
    }
  }

  public rotatePreviewItem(deltaRadians: number = Math.PI / 4): void {
    this.activePreviewRotationY = (this.activePreviewRotationY + deltaRadians) % (Math.PI * 2);
    this.updatePreviewTransform();
  }

  private updatePreviewTransform(): void {
    this.previewGhostGroup.position.set(
      this.activePreviewPosition.x,
      ISLAND_BOUNDS.centerGroundY,
      this.activePreviewPosition.z
    );
    this.previewGhostGroup.rotation.y = this.activePreviewRotationY;

    this.previewCursorMesh.position.set(
      this.activePreviewPosition.x,
      ISLAND_BOUNDS.centerGroundY + 0.05,
      this.activePreviewPosition.z
    );
  }

  private createGhostMeshForCatalogItem(itemDef: typeof DECOR_CATALOG[0]): THREE.Group {
    const group = new THREE.Group();
    // Semi-transparent ghost material
    const ghostMat = new THREE.MeshStandardMaterial({
      color: '#6ee7b7',
      transparent: true,
      opacity: 0.65,
      roughness: 0.5,
    });

    const box = new THREE.Mesh(
      new THREE.CylinderGeometry(itemDef.colliderRadius * 0.9, itemDef.colliderRadius * 0.9, 1.2, 16),
      ghostMat
    );
    box.position.y = 0.6;
    group.add(box);
    group.scale.set(itemDef.modelScale, itemDef.modelScale, itemDef.modelScale);
    return group;
  }

  // -------------------------------------------------------------
  // PLACED ITEMS SYNC & LIFECYCLE
  // -------------------------------------------------------------
  public syncPlacedItems(placedList: PlacedItemInstance[]): void {
    // Retain existing instances if unchanged; add new, remove stale
    const currentInstanceIds = new Set(placedList.map((p) => p.instanceId));

    // Remove deleted instances
    for (const [instId, group] of this.placedItemInstancesMap.entries()) {
      if (!currentInstanceIds.has(instId)) {
        this.placedObjectsGroup.remove(group);
        this.placedItemInstancesMap.delete(instId);
      }
    }

    // Add or update
    for (const inst of placedList) {
      let group = this.placedItemInstancesMap.get(inst.instanceId);
      if (!group) {
        group = this.buildPlacedItemMesh(inst);
        this.placedObjectsGroup.add(group);
        this.placedItemInstancesMap.set(inst.instanceId, group);
      }
      group.position.set(inst.position.x, inst.position.y, inst.position.z);
      group.rotation.set(inst.rotation.x, inst.rotation.y, inst.rotation.z);
      group.scale.set(inst.scale.x, inst.scale.y, inst.scale.z);
    }
  }

  private buildPlacedItemMesh(inst: PlacedItemInstance): THREE.Group {
    const group = new THREE.Group();
    group.name = `Placed_${inst.instanceId}`;
    group.userData = { instanceId: inst.instanceId, itemId: inst.itemId };

    const itemDef = DECOR_CATALOG.find((d) => d.id === inst.itemId);
    const radius = itemDef ? itemDef.colliderRadius : 0.8;

    // Default stylized geometric mesh
    const placeholderMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      roughness: 0.7,
      metalness: 0.1,
    });
    const placeholder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.8, radius * 0.8, 1.2, 16),
      placeholderMat
    );
    placeholder.position.y = 0.6;
    placeholder.castShadow = true;
    placeholder.receiveShadow = true;
    group.add(placeholder);

    // Asynchronously load real GLB if available
    if (itemDef) {
      const modelPath = `${this.assetBaseUrl}${itemDef.modelFileName}`;
      this.gltfLoader.load(
        modelPath,
        (gltf: any) => {
          if (this.isDisposed) return;
          group.remove(placeholder);
          const model = gltf.scene;
          model.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          group.add(model);
        },
        undefined,
        () => {
          // Keep placeholder without crashing
        }
      );
    }

    return group;
  }

  // -------------------------------------------------------------
  // CAMERA & TOUCH CONTROLS
  // -------------------------------------------------------------
  public orbitCamera(deltaX: number, deltaY: number): void {
    if (this.isResettingCamera) return;
    this.cameraAzimuth -= deltaX * 0.005;
    this.cameraPolar -= deltaY * 0.005;

    // Clamp polar angle to avoid looking through or under the island
    this.cameraPolar = Math.max(CAMERA_CONFIG.minPolarAngle, Math.min(CAMERA_CONFIG.maxPolarAngle, this.cameraPolar));
    this.updateCameraPosition();
  }

  public zoomCamera(pinchScaleDelta: number): void {
    if (this.isResettingCamera) return;
    this.cameraDistance *= pinchScaleDelta;
    this.cameraDistance = Math.max(CAMERA_CONFIG.minDistance, Math.min(CAMERA_CONFIG.maxDistance, this.cameraDistance));
    this.updateCameraPosition();
  }

  public resetCamera(): void {
    this.isResettingCamera = true;
    const targetDist = CAMERA_CONFIG.defaultDistance;
    const targetPolar = CAMERA_CONFIG.defaultPolarAngle;
    const targetAzimuth = CAMERA_CONFIG.defaultAzimuthAngle;

    const startDist = this.cameraDistance;
    const startPolar = this.cameraPolar;
    const startAzimuth = this.cameraAzimuth;
    let progress = 0;

    const step = () => {
      if (this.isDisposed) return;
      progress += 0.08;
      if (progress >= 1.0) {
        this.cameraDistance = targetDist;
        this.cameraPolar = targetPolar;
        this.cameraAzimuth = targetAzimuth;
        this.updateCameraPosition();
        this.isResettingCamera = false;
        return;
      }
      this.cameraDistance = THREE.MathUtils.lerp(startDist, targetDist, progress);
      this.cameraPolar = THREE.MathUtils.lerp(startPolar, targetPolar, progress);
      this.cameraAzimuth = THREE.MathUtils.lerp(startAzimuth, targetAzimuth, progress);
      this.updateCameraPosition();
      requestAnimationFrame(step);
    };
    step();
  }

  private updateCameraPosition(): void {
    const x = this.targetLookAt.x + this.cameraDistance * Math.sin(this.cameraPolar) * Math.sin(this.cameraAzimuth);
    const y = this.targetLookAt.y + this.cameraDistance * Math.cos(this.cameraPolar);
    const z = this.targetLookAt.z + this.cameraDistance * Math.sin(this.cameraPolar) * Math.cos(this.cameraAzimuth);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.targetLookAt);
  }

  // -------------------------------------------------------------
  // RENDER LOOP & LIFECYCLE
  // -------------------------------------------------------------
  private startLoop(): void {
    let lastTime = 0;
    const render = (time: number) => {
      if (this.isDisposed) return;
      this.animFrameId = requestAnimationFrame(render);

      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      // Animate waterfall UV ripple
      if (this.waterfallMesh) {
        const uv = this.waterfallMesh.geometry.attributes.uv;
        if (uv) {
          for (let i = 1; i < uv.count * 2; i += 2) {
            uv.array[i] -= delta * 1.8;
          }
          uv.needsUpdate = true;
        }
      }

      this.renderer.render(this.scene, this.camera);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  public resize(width: number, height: number): void {
    if (this.isDisposed) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public getActivePreviewData(): { position: { x: number; z: number }; rotationY: number; isValid: boolean } {
    return {
      position: this.activePreviewPosition,
      rotationY: this.activePreviewRotationY,
      isValid: this.isPlacementValid,
    };
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
    this.scene.clear();
  }
}
