import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { waterAnimationManager } from './waterAnimation';
import { getInitialLandmarkForBuilding, LANDMARK_CATALOG } from '../data/landmarkCatalog';
import { LoadedBuilding } from './cozyVillageLayoutLoader';

export interface EditableObjectData {
  id?: string;
  buildingInstanceId?: string;
  assetId?: string;
  landmarkId?: string;
  actionId?: string;
  displayNameVi?: string;
  displayNameEn?: string;
  iconId?: string;
  descriptionVi?: string;
  hasFunction?: boolean;
  enabled?: boolean;
  interactionAnchorLocal?: [number, number, number];
  labelAnchorLocal?: [number, number, number];
  interactionRadius?: number;
  interactionMode?: 'walk_then_enter' | 'direct_open';

  type: string;
  name: string;
  assetUrl?: string; // Path to extracted asset GLB e.g. "assets-extracted/houses/house_great_hall.glb"
  templateType?: string; // e.g. "tree_pine", "bench", etc.
  modelStorageKey?: string; // IndexedDB storage key for uploaded 3D files (.glb / .gltf)
  customDataUrl?: string; // Base64 data URL for small custom uploads
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isCustomSpawn?: boolean;
  isColorBlended?: boolean;
}

export interface LandmarkBuildingData {
  buildingInstanceId: string;
  name: string;
  modelStorageKey?: string;
  assetUrl?: string;
  landmarkId?: string;
  actionId?: string;
  displayNameVi: string;
  displayNameEn: string;
  iconId: string;
  descriptionVi?: string;
  hasFunction: boolean;
  enabled: boolean;
  interactionAnchorLocal: [number, number, number];
  labelAnchorLocal: [number, number, number];
  interactionRadius: number;
  interactionMode: 'walk_then_enter' | 'direct_open';
}

export interface BuildingValidationResult {
  isOnIsland: boolean;
  isDoorReachable: boolean;
  noDuplicateLandmark: boolean;
  warnings: string[];
}

export interface LevelEditorState {
  enabled: boolean;
  selectedObject: THREE.Object3D | null;
  selectedName: string;
  selectedType: string;
  isDragging: boolean;
  buildingData?: LandmarkBuildingData | null;
  validation?: BuildingValidationResult | null;
}

export interface LevelEditorResult {
  isEnabled: () => boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => boolean;
  selectObject: (obj: THREE.Object3D | null) => void;
  getSelectedObject: () => THREE.Object3D | null;
  getSelectedInfo: () => { name: string; type: string } | null;
  getSelectedLandmarkData: () => LandmarkBuildingData | null;
  updateBuildingLandmark: (data: Partial<LandmarkBuildingData>) => void;
  replaceSelectedModel: (file: File) => Promise<THREE.Object3D>;
  validateBuilding: (obj?: THREE.Object3D) => BuildingValidationResult;
  getLandmarkBuildings: () => LandmarkBuildingData[];
  getLoadedBuildings: () => LoadedBuilding[];
  moveSelected: (x: number, z: number) => void;
  rotateSelected: (deltaDeg: number) => void;
  scaleSelected: (factor: number) => void;
  elevateSelected: (deltaY: number) => void;
  deleteSelected: () => boolean;
  duplicateSelected: () => THREE.Object3D | null;
  spawnItem: (type: string, position?: THREE.Vector3, customName?: string) => THREE.Object3D | null;
  spawnExtractedAsset: (relativePath: string, name: string, position?: THREE.Vector3) => Promise<THREE.Object3D>;
  loadCustomModel: (file: File, position?: THREE.Vector3) => Promise<THREE.Object3D>;
  saveLayout: () => { count: number };
  loadSavedLayout: () => Promise<boolean>;
  resetDefaultLayout: () => void;
  exportJSON: () => string;
  importJSON: (jsonStr: string) => Promise<boolean>;
  handlePointerDown: (e: PointerEvent, raycaster: THREE.Raycaster) => boolean;
  handlePointerMove: (e: PointerEvent, raycaster: THREE.Raycaster) => boolean;
  handlePointerUp: () => void;
  update: () => void;
  blendSelectedColor: () => boolean;
  restoreSelectedColor: () => boolean;
}

// Extracted asset relative path mapping for backward compatibility with names
const EXTRACTED_PATH_LOOKUP: Record<string, string> = {
  house_great_hall: 'assets-extracted/houses/house_great_hall.glb',
  house_general_store: 'assets-extracted/houses/house_general_store.glb',
  house_library_cottage: 'assets-extracted/houses/house_library_cottage.glb',
  tree_shade_park: 'assets-extracted/trees/tree_shade_park.glb',
  tree_lineside_oak: 'assets-extracted/trees/tree_lineside_oak.glb',
  tree_momiji_maple: 'assets-extracted/trees/tree_momiji_maple.glb',
  prop_plaza_planter: 'assets-extracted/props/prop_plaza_planter.glb',
  prop_park_bench: 'assets-extracted/props/prop_park_bench.glb',
  prop_picket_fence: 'assets-extracted/props/prop_picket_fence.glb',
  plant_mums_flowerpot: 'assets-extracted/vegetation/plant_mums_flowerpot.glb',
  plant_library_flowerpot: 'assets-extracted/vegetation/plant_library_flowerpot.glb',
  bed_mulch_tile: 'assets-extracted/vegetation/bed_mulch_tile.glb',
  moss_patch: 'assets-extracted/vegetation/moss_patch.glb',
  grass_acanthus_scatter: 'assets-extracted/vegetation/grass_acanthus_scatter.glb',
  grass_lawn_tuft: 'assets-extracted/vegetation/grass_lawn_tuft.glb',
  rock_moss_boulder: 'assets-extracted/rocks/rock_moss_boulder.glb',
  stream_meandering_s_01: 'assets-extracted/terrain/stream_meandering_s_01.glb',
  stream_winding_river_01: 'assets-extracted/terrain/stream_winding_river_01.glb',
  stream_bend_90_01: 'assets-extracted/terrain/stream_bend_90_01.glb',
  stream_fork_junction_01: 'assets-extracted/terrain/stream_fork_junction_01.glb',
  stream_straight: 'assets-extracted/terrain/stream_straight_01.glb',
  stream_curve: 'assets-extracted/terrain/stream_curve_01.glb',
  stream_pond: 'assets-extracted/terrain/stream_pond_01.glb',
  stream_waterfall_step: 'assets-extracted/terrain/stream_waterfall_step_01.glb',
};

function resolveExtractedAssetPath(rawName: string): string | null {
  const lower = rawName.toLowerCase();
  for (const [key, path] of Object.entries(EXTRACTED_PATH_LOOKUP)) {
    if (lower.includes(key.toLowerCase())) return path;
  }
  if (lower.includes('uốn chữ s') || lower.includes('meandering') || lower.includes('chữ s')) return 'assets-extracted/terrain/stream_meandering_s_01.glb';
  if (lower.includes('sóng đôi') || lower.includes('winding')) return 'assets-extracted/terrain/stream_winding_river_01.glb';
  if (lower.includes('cua 90') || lower.includes('bend')) return 'assets-extracted/terrain/stream_bend_90_01.glb';
  if (lower.includes('ngã ba') || lower.includes('fork') || lower.includes('chữ y')) return 'assets-extracted/terrain/stream_fork_junction_01.glb';
  if (lower.includes('suối thẳng') || lower.includes('straight')) return 'assets-extracted/terrain/stream_straight_01.glb';
  if (lower.includes('suối uốn') || lower.includes('curve')) return 'assets-extracted/terrain/stream_curve_01.glb';
  if (lower.includes('hồ nước') || lower.includes('pond')) return 'assets-extracted/terrain/stream_pond_01.glb';
  if (lower.includes('thác') || lower.includes('waterfall')) return 'assets-extracted/terrain/stream_waterfall_step_01.glb';
  if (lower.includes('great hall')) return 'assets-extracted/houses/house_great_hall.glb';
  if (lower.includes('general store')) return 'assets-extracted/houses/house_general_store.glb';
  if (lower.includes('library')) return 'assets-extracted/houses/house_library_cottage.glb';
  if (lower.includes('momiji') || lower.includes('phong')) return 'assets-extracted/trees/tree_momiji_maple.glb';
  if (lower.includes('shade') || lower.includes('râm mát')) return 'assets-extracted/trees/tree_shade_park.glb';
  if (lower.includes('lineside') || lower.includes('sồi')) return 'assets-extracted/trees/tree_lineside_oak.glb';
  if (lower.includes('planter') || lower.includes('chậu hoa')) return 'assets-extracted/props/prop_plaza_planter.glb';
  if (lower.includes('bench') || lower.includes('ghế')) return 'assets-extracted/props/prop_park_bench.glb';
  if (lower.includes('fence') || lower.includes('rào')) return 'assets-extracted/props/prop_picket_fence.glb';
  if (lower.includes('boulder') || lower.includes('tảng đá')) return 'assets-extracted/rocks/rock_moss_boulder.glb';
  return null;
}

// IndexedDB persistence for user-uploaded custom 3D models (.glb / .gltf)
const DB_NAME = 'CozyVillage3D_DB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_models';

export function openModelDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveModelToStorage(key: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openModelDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save model to IndexedDB:', err);
  }
}

export async function getModelFromStorage(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openModelDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get model from IndexedDB:', err);
    return null;
  }
}

export async function deleteModelFromStorage(key: string): Promise<void> {
  try {
    const db = await openModelDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete model from IndexedDB:', err);
  }
}

export async function clearAllModelsFromStorage(): Promise<void> {
  try {
    const db = await openModelDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear models from IndexedDB:', err);
  }
}

/**
 * Recursively disposes all geometries, materials, and textures in an Object3D hierarchy
 * to completely eliminate WebGL memory leaks on Replace Model, Delete, and Layout Reload.
 */
export function disposeHierarchy(root: THREE.Object3D): void {
  const disposedTextures = new Set<THREE.Texture>();

  const disposeTexture = (tex: any) => {
    if (tex && tex.isTexture && !disposedTextures.has(tex)) {
      disposedTextures.add(tex);
      tex.dispose();
    }
  };

  root.traverse((child: any) => {
    if (child.isMesh || child.isPoints || child.isLine) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of materials) {
          if (!mat) continue;
          // Dispose all texture slots
          disposeTexture(mat.map);
          disposeTexture(mat.lightMap);
          disposeTexture(mat.bumpMap);
          disposeTexture(mat.normalMap);
          disposeTexture(mat.specularMap);
          disposeTexture(mat.envMap);
          disposeTexture(mat.alphaMap);
          disposeTexture(mat.aoMap);
          disposeTexture(mat.displacementMap);
          disposeTexture(mat.emissiveMap);
          disposeTexture(mat.gradientMap);
          disposeTexture(mat.metalnessMap);
          disposeTexture(mat.roughnessMap);
          disposeTexture(mat.clearcoatMap);
          disposeTexture(mat.clearcoatNormalMap);
          disposeTexture(mat.clearcoatRoughnessMap);
          disposeTexture(mat.transmissionMap);
          disposeTexture(mat.thicknessMap);
          disposeTexture(mat.sheenColorMap);
          disposeTexture(mat.sheenRoughnessMap);

          // Iterate extra properties
          for (const key of Object.keys(mat)) {
            const val = mat[key];
            if (val && typeof val === 'object' && val.isTexture) {
              disposeTexture(val);
            }
          }

          mat.dispose();
        }
      }
    }
  });
}

/**
 * Automatically blends / applies natural stylized materials to any untextured or white custom model (like mountains, rocks, terrain):
 * - Up-facing surfaces (normals pointing up, normal.y > 0.50) -> Lush Meadow Grass Green (#58a638 / #86efac)
 * - Slope surfaces (normal.y between 0.25 and 0.50) -> Moss-covered transition stone (#3f6212 / #4d7c0f)
 * - Vertical cliff faces (normal.y < 0.25) -> Slate Cliff Rock (#64748b / #334155)
 * - Lower underbelly -> Dark Slate / Granite (#334155 / #1e293b)
 */
export function applyStylizedColorBlend(root: THREE.Object3D, forceAll = false): boolean {
  let coloredAny = false;
  const grassColor = new THREE.Color('#58a638');
  const lushHighlight = new THREE.Color('#86efac');
  const mossColor = new THREE.Color('#3f6212');
  const rockColor = new THREE.Color('#64748b');
  const darkRockColor = new THREE.Color('#334155');

  root.updateWorldMatrix(true, true);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if ((mesh as any).isSkinnedMesh) return;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      for (let m = 0; m < materials.length; m++) {
        const mat = materials[m] as THREE.MeshStandardMaterial;

        // RULE 1: If mesh has a texture map (diffuse / image texture), NEVER overwrite it!
        if (mat && mat.map) {
          continue;
        }

        const nameLower = (mesh.name + ' ' + (mat?.name || '') + ' ' + (mesh.parent?.name || '')).toLowerCase();

        // RULE 2: Protect all architectural elements, houses, bridges, roofs, furniture, trees
        const isStructureOrProp =
          nameLower.includes('bridge') ||
          nameLower.includes('plank') ||
          nameLower.includes('rail') ||
          nameLower.includes('pier') ||
          nameLower.includes('house') ||
          nameLower.includes('building') ||
          nameLower.includes('roof') ||
          nameLower.includes('wall') ||
          nameLower.includes('chimney') ||
          nameLower.includes('door') ||
          nameLower.includes('window') ||
          nameLower.includes('store') ||
          nameLower.includes('hall') ||
          nameLower.includes('cottage') ||
          nameLower.includes('inn') ||
          nameLower.includes('tower') ||
          nameLower.includes('mill') ||
          nameLower.includes('wheel') ||
          nameLower.includes('dock') ||
          nameLower.includes('barrel') ||
          nameLower.includes('crate') ||
          nameLower.includes('fence') ||
          nameLower.includes('bench') ||
          nameLower.includes('well') ||
          nameLower.includes('vanguard') ||
          nameLower.includes('character') ||
          nameLower.includes('water') ||
          nameLower.includes('stream') ||
          nameLower.includes('leaf') ||
          nameLower.includes('leaves') ||
          nameLower.includes('foliage') ||
          nameLower.includes('trunk') ||
          nameLower.includes('branch') ||
          nameLower.includes('bark') ||
          nameLower.includes('momiji') ||
          nameLower.includes('maple') ||
          (mat && mat.color && Math.abs(mat.color.r - mat.color.g) > 0.16);

        if (isStructureOrProp) {
          continue;
        }

        // Only rock, cliff, stone, mountain, boulder or untextured white rock
        const isWhiteChalk =
          mat &&
          mat.color &&
          mat.color.r > 0.70 &&
          mat.color.g > 0.70 &&
          mat.color.b > 0.70 &&
          Math.abs(mat.color.r - mat.color.g) < 0.10 &&
          Math.abs(mat.color.g - mat.color.b) < 0.10;

        const isRockOrTerrain =
          nameLower.includes('rock') ||
          nameLower.includes('stone') ||
          nameLower.includes('cliff') ||
          nameLower.includes('mountain') ||
          nameLower.includes('boulder') ||
          nameLower.includes('step') ||
          nameLower.includes('terrace') ||
          nameLower.includes('terrain');

        if (forceAll || (isRockOrTerrain && isWhiteChalk)) {
          const geo = mesh.geometry;
          if (!geo) continue;

          // Backup original material and geometry if not yet backed up
          if (!mesh.userData._origMaterial) {
            mesh.userData._origMaterial = mesh.material;
          }
          if (!mesh.userData._origGeometry) {
            mesh.userData._origGeometry = geo.clone();
          }

          mesh.geometry = geo.clone();
          const targetGeo = mesh.geometry;

          if (!targetGeo.attributes.normal) {
            targetGeo.computeVertexNormals();
          }

          const normals = targetGeo.attributes.normal;
          const positions = targetGeo.attributes.position;
          if (!normals || !positions) continue;

          const count = positions.count;
          const colors = new Float32Array(count * 3);

          let minY = Infinity;
          let maxY = -Infinity;
          for (let i = 0; i < count; i++) {
            const y = positions.getY(i);
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
          const heightRange = Math.max(0.1, maxY - minY);

          const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
          const worldNormal = new THREE.Vector3();

          for (let i = 0; i < count; i++) {
            worldNormal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
            worldNormal.applyMatrix3(normalMatrix).normalize();
            const ny = worldNormal.y;

            const y = positions.getY(i);
            const relHeight = (y - minY) / heightRange;

            const vertexCol = new THREE.Color();

            if (ny > 0.50) {
              // Flat top plateau / terrace -> Lush Green Grass
              vertexCol.copy(grassColor);
              if (relHeight > 0.6) {
                vertexCol.lerp(lushHighlight, (relHeight - 0.6) * 0.45);
              }
            } else if (ny > 0.22) {
              // Slopes & terrace edges -> Mossy stone transition
              const t = (ny - 0.22) / 0.28;
              vertexCol.copy(rockColor).lerp(mossColor, t * 0.85);
            } else {
              // Vertical cliff walls & crevices -> Slate Rock
              vertexCol.copy(rockColor);
              if (relHeight < 0.35) {
                vertexCol.lerp(darkRockColor, (0.35 - relHeight) / 0.35);
              }
            }

            colors[i * 3] = vertexCol.r;
            colors[i * 3 + 1] = vertexCol.g;
            colors[i * 3 + 2] = vertexCol.b;
          }

          targetGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          mesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.86,
            metalness: 0.05,
            flatShading: true,
          });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          coloredAny = true;
        }
      }
    }
  });

  return coloredAny;
}
export function restoreOriginalColor(root: THREE.Object3D): boolean {
  let restored = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.userData._origMaterial) {
        mesh.material = mesh.userData._origMaterial;
        restored = true;
      }
      if (mesh.userData._origGeometry) {
        mesh.geometry = mesh.userData._origGeometry.clone();
        restored = true;
      } else if (mesh.geometry && mesh.geometry.attributes.color) {
        mesh.geometry.deleteAttribute('color');
        restored = true;
      }
      mesh.userData.isColorBlended = false;
    }
  });
  root.userData.isColorBlended = false;
  return restored;
}


export function createLevelEditor(
  scene: THREE.Scene,
  parentGroup: THREE.Group,
  walkablePlane: THREE.Mesh,
  editableObjects: THREE.Object3D[],
  templates: Map<string, THREE.Group>,
  onStateChange?: (state: LevelEditorState) => void
): LevelEditorResult {
  let enabled = false;
  let selectedObject: THREE.Object3D | null = null;
  let isDragging = false;
  const dragOffset = new THREE.Vector3();

  // Keep track of deleted base objects so they can be restored on resetDefaultLayout
  const deletedBaseObjects: THREE.Object3D[] = [];

  // Bounding Box Highlight Helper
  let boxHelper: THREE.BoxHelper | null = null;
  const gltfLoader = new GLTFLoader();

  // Door Entrance Visual Marker Helper in Editor
  let doorHelperMesh: THREE.Mesh | null = null;

  function updateDoorHelper() {
    if (selectedObject && enabled) {
      const ud = selectedObject.userData || {};
      const anchor = ud.interactionAnchorLocal || [0, 0, 2.5];
      const isBld = ud.buildingInstanceId || ud.hasFunction || ud.landmarkId || ud.type === 'cottage' || ud.type === 'waterWheel' || ud.type === 'well' || (ud.name || '').toLowerCase().includes('hall') || (ud.name || '').toLowerCase().includes('house') || (ud.name || '').toLowerCase().includes('shop');

      if (isBld) {
        if (!doorHelperMesh) {
          const geo = new THREE.RingGeometry(0.35, 0.48, 28);
          const mat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
          });
          doorHelperMesh = new THREE.Mesh(geo, mat);
          doorHelperMesh.rotation.x = -Math.PI / 2;
          doorHelperMesh.renderOrder = 999;
          scene.add(doorHelperMesh);
        }
        const localPos = new THREE.Vector3(...anchor);
        const worldPos = selectedObject.localToWorld(localPos.clone());
        doorHelperMesh.position.set(worldPos.x, worldPos.y + 0.05, worldPos.z);
        doorHelperMesh.visible = true;
        return;
      }
    }
    if (doorHelperMesh) {
      doorHelperMesh.visible = false;
    }
  }

  function getSelectedLandmarkData(): LandmarkBuildingData | null {
    if (!selectedObject) return null;
    const ud = selectedObject.userData || {};
    const isBld = ud.buildingInstanceId || ud.landmarkId || ud.hasFunction || ud.type === 'cottage' || ud.type === 'waterWheel' || ud.type === 'well' || (ud.name || '').toLowerCase().includes('hall') || (ud.name || '').toLowerCase().includes('house') || (ud.name || '').toLowerCase().includes('shop');
    if (!isBld) return null;

    return {
      buildingInstanceId: ud.buildingInstanceId || `bld_${ud.name}`,
      name: ud.name || 'Building',
      modelStorageKey: ud.modelStorageKey,
      assetUrl: ud.assetUrl,
      landmarkId: ud.landmarkId,
      actionId: ud.actionId,
      displayNameVi: ud.displayNameVi || ud.name || 'Công trình',
      displayNameEn: ud.displayNameEn || ud.name || 'Building',
      iconId: ud.iconId || '🏡',
      descriptionVi: ud.descriptionVi,
      hasFunction: !!ud.hasFunction,
      enabled: ud.enabled !== false,
      interactionAnchorLocal: ud.interactionAnchorLocal || [0, 0, 2.5],
      labelAnchorLocal: ud.labelAnchorLocal || [0, 3.8, 0],
      interactionRadius: ud.interactionRadius || 2.5,
      interactionMode: ud.interactionMode || 'walk_then_enter',
    };
  }

  function validateBuilding(obj?: THREE.Object3D): BuildingValidationResult {
    const target = obj || selectedObject;
    if (!target) {
      return { isOnIsland: true, isDoorReachable: true, noDuplicateLandmark: true, warnings: [] };
    }
    const warnings: string[] = [];
    const ud = target.userData || {};

    // 1. Check if building is on island surface (center radius <= 18m)
    const distFromCenter = Math.hypot(target.position.x, target.position.z);
    const isOnIsland = distFromCenter <= 18.0 && target.position.y >= 0.5;
    if (!isOnIsland) {
      warnings.push('Công trình nằm ngoài rìa đảo hoặc lơ lửng dưới vực.');
    }

    // 2. Check interaction door point
    const localAnchor = new THREE.Vector3(...(ud.interactionAnchorLocal || [0, 0, 2.5]));
    const doorWorld = target.localToWorld(localAnchor.clone());
    const doorDist = Math.hypot(doorWorld.x, doorWorld.z);
    const isDoorReachable = doorDist <= 17.8 && doorWorld.y >= 0.8;
    if (!isDoorReachable) {
      warnings.push('Điểm đứng trước cửa nằm ngoài đảo hoặc quá gần vực.');
    }

    // 3. Check duplicate landmarkId
    let noDuplicateLandmark = true;
    if (ud.landmarkId) {
      const duplicates = editableObjects.filter(
        (o) => o !== target && o.userData?.landmarkId === ud.landmarkId
      );
      if (duplicates.length > 0) {
        noDuplicateLandmark = false;
        warnings.push(`Trùng Landmark ID: "${ud.landmarkId}" với vật thể khác.`);
      }
    }

    return {
      isOnIsland,
      isDoorReachable,
      noDuplicateLandmark,
      warnings,
    };
  }

  function notifyChangeState() {
    onStateChange?.({
      enabled,
      selectedObject,
      selectedName: selectedObject?.userData?.name || '',
      selectedType: selectedObject?.userData?.type || '',
      isDragging,
      buildingData: getSelectedLandmarkData(),
      validation: validateBuilding(),
    });
  }

  function updateBoxHelper() {
    if (selectedObject && enabled) {
      if (!boxHelper) {
        boxHelper = new THREE.BoxHelper(selectedObject, 0xfbbf24);
        scene.add(boxHelper);
      } else {
        boxHelper.setFromObject(selectedObject);
        boxHelper.visible = true;
      }
    } else {
      if (boxHelper) {
        boxHelper.visible = false;
      }
    }
  }

  function selectObject(obj: THREE.Object3D | null) {
    selectedObject = obj;
    updateBoxHelper();
    updateDoorHelper();
    notifyChangeState();
  }

  function updateBuildingLandmark(data: Partial<LandmarkBuildingData>) {
    if (!selectedObject) return;
    const ud = selectedObject.userData;

    if (data.buildingInstanceId !== undefined) ud.buildingInstanceId = data.buildingInstanceId;
    if (data.landmarkId !== undefined) ud.landmarkId = data.landmarkId;
    if (data.actionId !== undefined) ud.actionId = data.actionId;
    if (data.displayNameVi !== undefined) ud.displayNameVi = data.displayNameVi;
    if (data.displayNameEn !== undefined) ud.displayNameEn = data.displayNameEn;
    if (data.iconId !== undefined) ud.iconId = data.iconId;
    if (data.descriptionVi !== undefined) ud.descriptionVi = data.descriptionVi;
    if (data.hasFunction !== undefined) ud.hasFunction = data.hasFunction;
    if (data.enabled !== undefined) ud.enabled = data.enabled;
    if (data.interactionAnchorLocal !== undefined) ud.interactionAnchorLocal = [...data.interactionAnchorLocal];
    if (data.labelAnchorLocal !== undefined) ud.labelAnchorLocal = [...data.labelAnchorLocal];
    if (data.interactionRadius !== undefined) ud.interactionRadius = data.interactionRadius;
    if (data.interactionMode !== undefined) ud.interactionMode = data.interactionMode;

    updateDoorHelper();
    notifyChangeState();
  }

  async function replaceSelectedModel(file: File): Promise<THREE.Object3D> {
    if (!selectedObject) {
      throw new Error('Chưa chọn ngôi nhà để thay thế mô hình');
    }
    const targetObj = selectedObject;
    const ud = targetObj.userData;

    const buffer = await file.arrayBuffer();

    // Parse GLB to verify validity before touching targetObj
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (result) => resolve(result),
        (err) => reject(err)
      );
    });

    const newScene = gltf.scene;

    // 1. Remove and thoroughly dispose existing mesh children from targetObj
    const toRemove: THREE.Object3D[] = [];
    targetObj.children.forEach((c) => toRemove.push(c));
    toRemove.forEach((c) => {
      targetObj.remove(c);
      disposeHierarchy(c);
    });

    // 2. Add new mesh children from newScene
    while (newScene.children.length > 0) {
      const child = newScene.children[0];
      targetObj.add(child);
    }

    // 3. Configure shadows
    targetObj.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 4. Save into IndexedDB and server static directory
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const storageKey = `model_${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;
    await saveModelToStorage(storageKey, buffer);

    ud.modelStorageKey = storageKey;
    ud.assetId = storageKey;
    ud.isCustomSpawn = true;

    fetch(`/_api/save-custom-model?key=${encodeURIComponent(storageKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    }).catch(() => {});

    // 5. Adapt label anchor height based on new model bounding box
    const box = new THREE.Box3().setFromObject(targetObj);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (!ud.labelAnchorLocal) {
      ud.labelAnchorLocal = [0, parseFloat((size.y + 0.6).toFixed(2)), 0];
    } else {
      ud.labelAnchorLocal[1] = parseFloat((size.y + 0.6).toFixed(2));
    }

    updateBoxHelper();
    updateDoorHelper();
    notifyChangeState();

    console.log(`[LevelEditor] Successfully replaced model for [${ud.name}] with [${file.name}]. Landmark: ${ud.landmarkId}`);
    return targetObj;
  }

  function getLandmarkBuildings(): LandmarkBuildingData[] {
    const list: LandmarkBuildingData[] = [];
    editableObjects.forEach((obj) => {
      const ud = obj.userData;
      if (ud?.buildingInstanceId && ud?.hasFunction && ud?.landmarkId) {
        list.push({
          buildingInstanceId: ud.buildingInstanceId,
          name: ud.name,
          modelStorageKey: ud.modelStorageKey,
          assetUrl: ud.assetUrl,
          landmarkId: ud.landmarkId,
          actionId: ud.actionId,
          displayNameVi: ud.displayNameVi || ud.name,
          displayNameEn: ud.displayNameEn || ud.name,
          iconId: ud.iconId || '🏡',
          descriptionVi: ud.descriptionVi,
          hasFunction: !!ud.hasFunction,
          enabled: ud.enabled !== false,
          interactionAnchorLocal: ud.interactionAnchorLocal || [0, 0, 2.5],
          labelAnchorLocal: ud.labelAnchorLocal || [0, 3.8, 0],
          interactionRadius: ud.interactionRadius || 2.5,
          interactionMode: ud.interactionMode || 'walk_then_enter',
        });
      }
    });
    return list;
  }

  function getLoadedBuildings(): LoadedBuilding[] {
    const list: LoadedBuilding[] = [];
    editableObjects.forEach((obj) => {
      const ud = obj.userData;
      if (ud?.buildingInstanceId && ud?.hasFunction && ud?.landmarkId) {
        list.push({
          config: {
            buildingInstanceId: ud.buildingInstanceId,
            name: ud.name,
            displayName: {
              vi: ud.displayNameVi || ud.name,
              en: ud.displayNameEn || ud.name,
            },
            hasFunction: !!ud.hasFunction,
            landmarkId: ud.landmarkId,
            actionId: ud.actionId,
            iconId: ud.iconId || '🏛️',
            enabled: ud.enabled !== false,
            anchorLocal: ud.interactionAnchorLocal || [0, 0, 2.5],
            labelAnchorLocal: ud.labelAnchorLocal || [0, 3.8, 0],
            interactionRadius: ud.interactionRadius || 2.5,
            interactionMode: ud.interactionMode || 'walk_then_enter',
            descriptionVi: ud.descriptionVi,
          },
          meshGroup: obj,
          getDoorWorldAnchor: () => {
            const local = new THREE.Vector3(...(ud.interactionAnchorLocal || [0, 0, 2.5]));
            const world = obj.localToWorld(local.clone());
            world.y = 1.82;
            return world;
          },
          getLabelWorldAnchor: () => {
            const local = new THREE.Vector3(...(ud.labelAnchorLocal || [0, 3.8, 0]));
            return obj.localToWorld(local.clone());
          },
        });
      }
    });
    return list;
  }

  function registerObject(
    obj: THREE.Object3D,
    type: string,
    name?: string,
    extra?: {
      assetUrl?: string;
      templateType?: string;
      modelStorageKey?: string;
      isCustomSpawn?: boolean;
      isColorBlended?: boolean;
      customDataUrl?: string;
      buildingInstanceId?: string;
      landmarkId?: string;
      actionId?: string;
      displayNameVi?: string;
      displayNameEn?: string;
      iconId?: string;
      descriptionVi?: string;
      hasFunction?: boolean;
      enabled?: boolean;
      interactionAnchorLocal?: [number, number, number];
      labelAnchorLocal?: [number, number, number];
      interactionRadius?: number;
      interactionMode?: 'walk_then_enter' | 'direct_open';
    }
  ) {
    const objName = name || `${type}_${editableObjects.length + 1}`;
    const initialLandmark = getInitialLandmarkForBuilding(objName, type);

    obj.userData = {
      ...obj.userData,
      editable: true,
      type,
      name: objName,
      assetUrl: extra?.assetUrl ?? obj.userData?.assetUrl,
      templateType: extra?.templateType ?? obj.userData?.templateType,
      modelStorageKey: extra?.modelStorageKey ?? obj.userData?.modelStorageKey,
      isCustomSpawn: extra?.isCustomSpawn ?? obj.userData?.isCustomSpawn ?? false,
      isColorBlended: extra?.isColorBlended ?? obj.userData?.isColorBlended ?? false,
      customDataUrl: extra?.customDataUrl ?? obj.userData?.customDataUrl,
      
      // Landmark attributes
      buildingInstanceId: extra?.buildingInstanceId ?? obj.userData?.buildingInstanceId ?? initialLandmark?.buildingInstanceId,
      landmarkId: extra?.landmarkId ?? obj.userData?.landmarkId ?? initialLandmark?.landmarkId,
      actionId: extra?.actionId ?? obj.userData?.actionId ?? initialLandmark?.actionId,
      displayNameVi: extra?.displayNameVi ?? obj.userData?.displayNameVi ?? initialLandmark?.displayName?.vi,
      displayNameEn: extra?.displayNameEn ?? obj.userData?.displayNameEn ?? initialLandmark?.displayName?.en,
      iconId: extra?.iconId ?? obj.userData?.iconId ?? initialLandmark?.iconId,
      descriptionVi: obj.userData?.descriptionVi ?? initialLandmark?.descriptionVi,
      hasFunction: extra?.hasFunction ?? obj.userData?.hasFunction ?? initialLandmark?.hasFunction ?? false,
      enabled: extra?.enabled ?? obj.userData?.enabled ?? initialLandmark?.enabled ?? true,
      interactionAnchorLocal: extra?.interactionAnchorLocal ?? obj.userData?.interactionAnchorLocal ?? initialLandmark?.defaultInteractionAnchor ?? [0, 0, 2.5],
      labelAnchorLocal: extra?.labelAnchorLocal ?? obj.userData?.labelAnchorLocal ?? initialLandmark?.defaultLabelAnchor ?? [0, 3.8, 0],
      interactionRadius: extra?.interactionRadius ?? obj.userData?.interactionRadius ?? initialLandmark?.interactionRadius ?? 2.5,
      interactionMode: extra?.interactionMode ?? obj.userData?.interactionMode ?? 'walk_then_enter',

      initialPos: obj.position.clone(),
      initialRot: obj.rotation.clone(),
      initialScale: obj.scale.clone(),
    };
    if (!editableObjects.includes(obj)) {
      editableObjects.push(obj);
    }
  }

  function spawnItem(type: string, position?: THREE.Vector3, customName?: string): THREE.Object3D | null {
    const template = templates.get(type);
    if (!template) {
      console.warn(`Template not found for type: ${type}`);
      return null;
    }

    const clone = template.clone(true);
    const p = position || new THREE.Vector3(0, 1.82, 0);
    clone.position.copy(p);
    parentGroup.add(clone);

    const uniqueName = customName || `${type}_${Date.now().toString().slice(-4)}_${editableObjects.length + 1}`;
    clone.name = uniqueName;

    registerObject(clone, type, uniqueName, {
      templateType: type,
      isCustomSpawn: true,
    });
    waterAnimationManager.animateWaterMeshes(clone);
    selectObject(clone);
    return clone;
  }

  // Spawn an extracted 3D asset from /assets-extracted/...
  async function spawnExtractedAsset(relativePath: string, name: string, position?: THREE.Vector3): Promise<THREE.Object3D> {
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const url = `/${cleanPath}`;
    const gltf = await new Promise<any>((resolve, reject) => {
      gltfLoader.load(url, resolve, undefined, reject);
    });

    const model = gltf.scene;
    const uniqueName = name.includes('_') && /\d/.test(name)
      ? name
      : `${name}_${Date.now().toString().slice(-4)}_${editableObjects.length + 1}`;
    model.name = uniqueName;

    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const p = position || new THREE.Vector3(0, 1.82, 0);
    model.position.copy(p);
    parentGroup.add(model);

    registerObject(model, 'extracted_asset', uniqueName, {
      assetUrl: cleanPath,
      isCustomSpawn: true,
    });
    waterAnimationManager.animateWaterMeshes(model);
    selectObject(model);
    console.log(`Spawned extracted asset: ${uniqueName} from ${url}`);
    return model;
  }

  function moveSelected(x: number, z: number) {
    if (!selectedObject) return;
    selectedObject.position.x = x;
    selectedObject.position.z = z;
    updateBoxHelper();
    updateDoorHelper();
  }

  function rotateSelected(deltaDeg: number) {
    if (!selectedObject) return;
    const rad = (deltaDeg * Math.PI) / 180;
    selectedObject.rotation.y += rad;
    updateBoxHelper();
    updateDoorHelper();
  }

  function scaleSelected(factor: number) {
    if (!selectedObject) return;
    const s = Math.max(0.2, Math.min(5.0, selectedObject.scale.x * factor));
    selectedObject.scale.setScalar(s);
    updateBoxHelper();
    updateDoorHelper();
  }

  function elevateSelected(deltaY: number) {
    if (!selectedObject) return;
    selectedObject.position.y += deltaY;
    selectedObject.position.y = parseFloat(selectedObject.position.y.toFixed(2));
    updateBoxHelper();
    updateDoorHelper();
  }

  function deleteSelected(): boolean {
    if (!selectedObject) return false;
    const idx = editableObjects.indexOf(selectedObject);
    if (idx !== -1) {
      editableObjects.splice(idx, 1);
    }
    if (selectedObject.parent) {
      selectedObject.parent.remove(selectedObject);
    } else {
      parentGroup.remove(selectedObject);
    }

    // If it's a base object, save to deletedBaseObjects so user can restore via reset
    if (!selectedObject.userData?.isCustomSpawn) {
      deletedBaseObjects.push(selectedObject);
    } else {
      if (selectedObject.userData?.modelStorageKey) {
        deleteModelFromStorage(selectedObject.userData.modelStorageKey);
      }
      disposeHierarchy(selectedObject);
    }

    selectObject(null);
    saveLayout(); // AUTO-SAVE AFTER DELETION so F5 never brings it back!
    return true;
  }

  function duplicateSelected(): THREE.Object3D | null {
    if (!selectedObject) return null;
    const clone = selectedObject.clone(true);
    clone.position.add(new THREE.Vector3(1.2, 0, 1.2));
    parentGroup.add(clone);

    const type = selectedObject.userData?.type || 'item';
    const baseName = selectedObject.userData?.name || type;
    const uniqueName = `${baseName}_copy_${Date.now().toString().slice(-4)}`;
    clone.name = uniqueName;

    registerObject(clone, type, uniqueName, {
      assetUrl: selectedObject.userData?.assetUrl,
      templateType: selectedObject.userData?.templateType,
      modelStorageKey: selectedObject.userData?.modelStorageKey,
      customDataUrl: selectedObject.userData?.customDataUrl,
      isCustomSpawn: true,
    });
    waterAnimationManager.animateWaterMeshes(clone);
    selectObject(clone);
    return clone;
  }

  // Load custom 3D model (.glb / .gltf) from user upload
  async function loadCustomModel(file: File, position?: THREE.Vector3): Promise<THREE.Object3D> {
    const buffer = await file.arrayBuffer();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const uniqueName = `${baseName}_${Date.now().toString().slice(-4)}`;
    const storageKey = `model_${uniqueName}`;

    // Store raw binary ArrayBuffer in IndexedDB so it persists permanently across F5
    await saveModelToStorage(storageKey, buffer);

    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const model = gltf.scene;
          model.name = uniqueName;

          // Enable shadow casting & receiving for the custom model
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Compute bounding box to auto-scale appropriately
          const bbox = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);

          // If model is massive or tiny, scale comfortably into a 3m bounding box
          if (maxDim > 8.0) {
            const autoScale = 3.5 / maxDim;
            model.scale.setScalar(autoScale);
          } else if (maxDim < 0.3) {
            const autoScale = 1.5 / maxDim;
            model.scale.setScalar(autoScale);
          }

          const targetPos = position || new THREE.Vector3(0, 1.82, 0);
          model.position.copy(targetPos);
          parentGroup.add(model);

          registerObject(model, 'custom_model', uniqueName, {
            isCustomSpawn: true,
            modelStorageKey: storageKey,
          });
          // Do NOT auto-blend: keep 100% original model colors and textures!
          waterAnimationManager.animateWaterMeshes(model);
          selectObject(model);

          console.log(`Custom 3D model loaded and stored to IndexedDB: ${uniqueName}`);
          resolve(model);
        },
        (err) => {
          console.error('Failed to parse 3D file:', err);
          reject(err);
        }
      );
    });
  }

  // Save layout to LocalStorage
  function saveLayout(): { count: number } {
    const data: EditableObjectData[] = [];
    editableObjects.forEach((obj) => {
      data.push({
        type: obj.userData?.type || 'item',
        name: obj.userData?.name || obj.name || '',
        assetUrl: obj.userData?.assetUrl,
        templateType: obj.userData?.templateType,
        modelStorageKey: obj.userData?.modelStorageKey,
        customDataUrl: obj.userData?.customDataUrl,
        position: [
          parseFloat(obj.position.x.toFixed(3)),
          parseFloat(obj.position.y.toFixed(3)),
          parseFloat(obj.position.z.toFixed(3)),
        ],
        rotation: [
          parseFloat(obj.rotation.x.toFixed(3)),
          parseFloat(obj.rotation.y.toFixed(3)),
          parseFloat(obj.rotation.z.toFixed(3)),
        ],
        scale: [
          parseFloat(obj.scale.x.toFixed(3)),
          parseFloat(obj.scale.y.toFixed(3)),
          parseFloat(obj.scale.z.toFixed(3)),
        ],
        isCustomSpawn: !!obj.userData?.isCustomSpawn,
        isColorBlended: !!obj.userData?.isColorBlended,
        buildingInstanceId: obj.userData?.buildingInstanceId,
        landmarkId: obj.userData?.landmarkId,
        actionId: obj.userData?.actionId,
        displayNameVi: obj.userData?.displayNameVi,
        displayNameEn: obj.userData?.displayNameEn,
        iconId: obj.userData?.iconId,
        descriptionVi: obj.userData?.descriptionVi,
        hasFunction: !!obj.userData?.hasFunction,
        enabled: obj.userData?.enabled !== false,
        interactionAnchorLocal: obj.userData?.interactionAnchorLocal,
        labelAnchorLocal: obj.userData?.labelAnchorLocal,
        interactionRadius: obj.userData?.interactionRadius,
        interactionMode: obj.userData?.interactionMode,
      });
    });

    try {
      localStorage.setItem('cozy_village_layout_v1', JSON.stringify(data));
      console.log(`Saved ${data.length} village objects to LocalStorage.`);
      // Sync layout to disk server JSON file automatically
      fetch('/_api/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
      return { count: data.length };
    } catch (err) {
      console.error('Failed to save layout to LocalStorage:', err);
      return { count: 0 };
    }
  }

  // Load saved layout: Prioritize LocalStorage (active edits), fallback to server JSON file
  async function loadSavedLayout(): Promise<boolean> {
    try {
      let json: string | null = null;

      // 1. Prioritize user's active saved layout in LocalStorage
      json = localStorage.getItem('cozy_village_layout_v1');
      if (json) {
        console.log('[LevelEditor] Loaded active layout from LocalStorage');
      }

      // 2. Fallback to server static JSON file (/data/cozy_village_layout.json)
      if (!json) {
        try {
          const res = await fetch(`/data/cozy_village_layout.json?t=${Date.now()}`);
          if (res.ok) {
            const fileData = await res.json();
            if (Array.isArray(fileData) && fileData.length > 0) {
              json = JSON.stringify(fileData);
              localStorage.setItem('cozy_village_layout_v1', json);
              console.log(`[LevelEditor] Loaded layout from JSON file (/data/cozy_village_layout.json): ${fileData.length} items`);
            }
          }
        } catch (err) {
          console.warn('[LevelEditor] Could not fetch cozy_village_layout.json:', err);
        }
      }

      // 1b. Fallback to backup JSON file if layout.json wasn't loaded
      if (!json) {
        try {
          const res = await fetch(`/data/cozy_village_backup.json?t=${Date.now()}`);
          if (res.ok) {
            const fileData = await res.json();
            if (Array.isArray(fileData) && fileData.length > 0) {
              json = JSON.stringify(fileData);
              localStorage.setItem('cozy_village_layout_v1', json);
              console.log(`[LevelEditor] Loaded layout from backup JSON: ${fileData.length} items`);
            }
          }
        } catch (err) {
          console.warn('[LevelEditor] Could not fetch backup JSON:', err);
        }
      }

      // 2. Fallback to LocalStorage if offline or no network
      if (!json) {
        json = localStorage.getItem('cozy_village_layout_v1');
        if (json) {
          console.log('[LevelEditor] Loaded layout from LocalStorage');
        }
      }

      if (!json) {
        console.warn('[LevelEditor] No saved layout found on server or LocalStorage.');
        return false;
      }

      return await importJSON(json);
    } catch (err) {
      console.error('Failed to load saved layout:', err);
      return false;
    }
  }

  // Reset to initial positions and restore any deleted base objects
  function resetDefaultLayout() {
    // 1. Remove all custom spawned items and dispose GPU resources
    const customSpawned = editableObjects.filter((o) => o.userData?.isCustomSpawn);
    for (const obj of customSpawned) {
      const idx = editableObjects.indexOf(obj);
      if (idx !== -1) editableObjects.splice(idx, 1);
      if (obj.parent) {
        obj.parent.remove(obj);
      } else {
        parentGroup.remove(obj);
      }
      disposeHierarchy(obj);
    }

    // 2. Clear IndexedDB models
    clearAllModelsFromStorage();

    // 3. Restore all deleted base objects back to parentGroup and editableObjects
    for (const obj of deletedBaseObjects) {
      if (!parentGroup.children.includes(obj)) {
        parentGroup.add(obj);
      }
      if (!editableObjects.includes(obj)) {
        editableObjects.push(obj);
      }
    }
    deletedBaseObjects.length = 0;

    // 4. Reset transforms of all base objects
    editableObjects.forEach((obj) => {
      if (obj.userData?.initialPos) obj.position.copy(obj.userData.initialPos);
      if (obj.userData?.initialRot) obj.rotation.copy(obj.userData.initialRot);
      if (obj.userData?.initialScale) obj.scale.copy(obj.userData.initialScale);
    });

    localStorage.removeItem('cozy_village_layout_v1');
    selectObject(null);
    updateBoxHelper();
    console.log('Reset village layout to defaults.');
  }

  function exportJSON(): string {
    const data: EditableObjectData[] = [];
    editableObjects.forEach((obj) => {
      data.push({
        type: obj.userData?.type || 'item',
        name: obj.userData?.name || obj.name || '',
        assetUrl: obj.userData?.assetUrl,
        templateType: obj.userData?.templateType,
        modelStorageKey: obj.userData?.modelStorageKey,
        customDataUrl: obj.userData?.customDataUrl,
        position: [
          parseFloat(obj.position.x.toFixed(3)),
          parseFloat(obj.position.y.toFixed(3)),
          parseFloat(obj.position.z.toFixed(3)),
        ],
        rotation: [
          parseFloat(obj.rotation.x.toFixed(3)),
          parseFloat(obj.rotation.y.toFixed(3)),
          parseFloat(obj.rotation.z.toFixed(3)),
        ],
        scale: [
          parseFloat(obj.scale.x.toFixed(3)),
          parseFloat(obj.scale.y.toFixed(3)),
          parseFloat(obj.scale.z.toFixed(3)),
        ],
        isCustomSpawn: !!obj.userData?.isCustomSpawn,
        isColorBlended: !!obj.userData?.isColorBlended,
        buildingInstanceId: obj.userData?.buildingInstanceId,
        landmarkId: obj.userData?.landmarkId,
        actionId: obj.userData?.actionId,
        displayNameVi: obj.userData?.displayNameVi,
        displayNameEn: obj.userData?.displayNameEn,
        iconId: obj.userData?.iconId,
        descriptionVi: obj.userData?.descriptionVi,
        hasFunction: !!obj.userData?.hasFunction,
        enabled: obj.userData?.enabled !== false,
        interactionAnchorLocal: obj.userData?.interactionAnchorLocal,
        labelAnchorLocal: obj.userData?.labelAnchorLocal,
        interactionRadius: obj.userData?.interactionRadius,
        interactionMode: obj.userData?.interactionMode,
      });
    });
    return JSON.stringify(data, null, 2);
  }

  let isImportingLayout = false;

  async function importJSON(jsonStr: string): Promise<boolean> {
    if (isImportingLayout) {
      console.warn('[LevelEditor] importJSON already in progress, skipping concurrent import.');
      return false;
    }
    isImportingLayout = true;
    try {
      const modelBufferCache = new Map<string, ArrayBuffer>();
      const rawData: EditableObjectData[] = JSON.parse(jsonStr);
      if (!Array.isArray(rawData)) return false;

      // Purge any legacy hardcoded mountain from saved layout
      const data = rawData.filter((item) => {
        const n = (item.name || '').toLowerCase();
        if ((n.includes('headwater') || n.includes('ngọn núi đầu nguồn')) && !item.modelStorageKey) {
          console.log('Purging legacy headwater mountain from saved layout:', item.name);
          return false;
        }
        return true;
      });

      // 1. Remove all previously spawned custom objects currently in scene and dispose GPU resources
      const customSpawned = editableObjects.filter((o) => o.userData?.isCustomSpawn);
      for (const customObj of customSpawned) {
        const idx = editableObjects.indexOf(customObj);
        if (idx !== -1) editableObjects.splice(idx, 1);
        if (customObj.parent) {
          customObj.parent.remove(customObj);
        } else {
          parentGroup.remove(customObj);
        }
        disposeHierarchy(customObj);
      }

      // 2. Put back any previously deleted base objects so they can be matched
      for (const obj of deletedBaseObjects) {
        if (!editableObjects.includes(obj)) {
          editableObjects.push(obj);
        }
      }
      deletedBaseObjects.length = 0;

      const baseObjects = [...editableObjects];
      const matchedBaseNames = new Set<string>();

      // 3. Process each saved item
      for (const item of data) {
        // Find match in base objects by name
        const match = baseObjects.find(
          (o) =>
            o.userData?.name === item.name ||
            o.name === item.name ||
            (item.name?.includes('Mountain') && o.userData?.name?.includes('Mountain')) ||
            (item.name?.includes('Headwater') && o.userData?.name?.includes('Headwater'))
        );

        if (match) {
          matchedBaseNames.add(match.userData.name);
          if (!parentGroup.children.includes(match)) {
            parentGroup.add(match);
          }
          match.position.set(item.position[0], item.position[1], item.position[2]);
          match.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
          match.scale.set(item.scale[0], item.scale[1], item.scale[2]);
          // Base objects keep pristine original materials
          match.userData.isColorBlended = false;

          // Restore Landmark identity
          const initialLandmark = getInitialLandmarkForBuilding(match.userData.name, match.userData.type);
          match.userData.buildingInstanceId = item.buildingInstanceId || match.userData.buildingInstanceId || initialLandmark?.buildingInstanceId;
          match.userData.landmarkId = item.landmarkId !== undefined ? item.landmarkId : (match.userData.landmarkId || initialLandmark?.landmarkId);
          match.userData.actionId = item.actionId !== undefined ? item.actionId : (match.userData.actionId || initialLandmark?.actionId);
          match.userData.displayNameVi = item.displayNameVi !== undefined ? item.displayNameVi : (match.userData.displayNameVi || initialLandmark?.displayName.vi);
          match.userData.displayNameEn = item.displayNameEn !== undefined ? item.displayNameEn : (match.userData.displayNameEn || initialLandmark?.displayName.en);
          match.userData.iconId = item.iconId !== undefined ? item.iconId : (match.userData.iconId || initialLandmark?.iconId);
          match.userData.descriptionVi = item.descriptionVi !== undefined ? item.descriptionVi : (match.userData.descriptionVi || initialLandmark?.descriptionVi);
          match.userData.hasFunction = item.hasFunction !== undefined ? item.hasFunction : (match.userData.hasFunction ?? initialLandmark?.hasFunction ?? false);
          match.userData.enabled = item.enabled !== undefined ? item.enabled : (match.userData.enabled ?? initialLandmark?.enabled ?? true);
          match.userData.interactionAnchorLocal = item.interactionAnchorLocal ? [...item.interactionAnchorLocal] : (match.userData.interactionAnchorLocal || initialLandmark?.defaultInteractionAnchor || [0, 0, 2.5]);
          match.userData.labelAnchorLocal = item.labelAnchorLocal ? [...item.labelAnchorLocal] : (match.userData.labelAnchorLocal || initialLandmark?.defaultLabelAnchor || [0, 3.8, 0]);
          match.userData.interactionRadius = item.interactionRadius !== undefined ? item.interactionRadius : (match.userData.interactionRadius || initialLandmark?.interactionRadius || 2.5);
          match.userData.interactionMode = item.interactionMode !== undefined ? item.interactionMode : (match.userData.interactionMode || 'walk_then_enter');
        } else {
          // This is a custom spawned item to be created!
          if (item.modelStorageKey) {
            // Restore from cached buffer, static /assets-custom/, or IndexedDB fallback
            try {
              let buffer: ArrayBuffer | null | undefined = modelBufferCache.get(item.modelStorageKey);
              if (!buffer) {
                try {
                  const res = await fetch(`/assets-custom/${item.modelStorageKey}.glb`);
                  if (res.ok) {
                    buffer = await res.arrayBuffer();
                    modelBufferCache.set(item.modelStorageKey, buffer);
                  }
                } catch {}
              }
              if (!buffer) {
                const storageBuf = await getModelFromStorage(item.modelStorageKey);
                if (storageBuf) {
                  buffer = storageBuf;
                  modelBufferCache.set(item.modelStorageKey, storageBuf);
                }
              }
              if (buffer) {
                await new Promise<void>((resolve, reject) => {
                  gltfLoader.parse(
                    buffer as ArrayBuffer,
                    '',
                    (gltf) => {
                      const model = gltf.scene;
                      model.name = item.name;
                      model.position.set(item.position[0], item.position[1], item.position[2]);
                      model.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
                      model.scale.set(item.scale[0], item.scale[1], item.scale[2]);

                      model.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                          child.castShadow = true;
                          child.receiveShadow = true;
                        }
                      });

                      parentGroup.add(model);
                      registerObject(model, 'custom_model', item.name, {
                        isCustomSpawn: true,
                        modelStorageKey: item.modelStorageKey,
                        isColorBlended: !!item.isColorBlended,
                        buildingInstanceId: item.buildingInstanceId,
                        landmarkId: item.landmarkId,
                        actionId: item.actionId,
                        displayNameVi: item.displayNameVi,
                        displayNameEn: item.displayNameEn,
                        iconId: item.iconId,
                        descriptionVi: item.descriptionVi,
                        hasFunction: item.hasFunction,
                        enabled: item.enabled,
                        interactionAnchorLocal: item.interactionAnchorLocal,
                        labelAnchorLocal: item.labelAnchorLocal,
                        interactionRadius: item.interactionRadius,
                        interactionMode: item.interactionMode,
                      });
                      const isRockMtn = (item.name || '').toLowerCase().includes('rock') || (item.name || '').toLowerCase().includes('mountain') || (item.name || '').toLowerCase().includes('cliff');
                      if (item.isColorBlended === true && isRockMtn) {
                        applyStylizedColorBlend(model, true);
                        model.userData.isColorBlended = true;
                      } else {
                        model.userData.isColorBlended = false;
                      }
                      console.log(`Restored uploaded 3D model from IndexedDB: ${item.name}`);
                      resolve();
                    },
                    (err) => reject(err)
                  );
                });
              } else {
                console.warn(`Buffer not found in IndexedDB for key: ${item.modelStorageKey}`);
              }
            } catch (err) {
              console.warn(`Could not restore model from IndexedDB for ${item.name}:`, err);
            }
          } else {
            let assetPath = item.assetUrl;
            if (!assetPath && item.type === 'extracted_asset') {
              assetPath = resolveExtractedAssetPath(item.name) || undefined;
            }

            if (assetPath) {
              try {
                const spawned = await spawnExtractedAsset(
                  assetPath,
                  item.name,
                  new THREE.Vector3(...item.position)
                );
                spawned.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
                spawned.scale.set(item.scale[0], item.scale[1], item.scale[2]);
                spawned.userData.name = item.name;
                spawned.name = item.name;

                // Restore Landmark identity
                if (item.buildingInstanceId) spawned.userData.buildingInstanceId = item.buildingInstanceId;
                if (item.landmarkId !== undefined) spawned.userData.landmarkId = item.landmarkId;
                if (item.actionId !== undefined) spawned.userData.actionId = item.actionId;
                if (item.displayNameVi !== undefined) spawned.userData.displayNameVi = item.displayNameVi;
                if (item.displayNameEn !== undefined) spawned.userData.displayNameEn = item.displayNameEn;
                if (item.iconId !== undefined) spawned.userData.iconId = item.iconId;
                if (item.descriptionVi !== undefined) spawned.userData.descriptionVi = item.descriptionVi;
                if (item.hasFunction !== undefined) spawned.userData.hasFunction = item.hasFunction;
                if (item.enabled !== undefined) spawned.userData.enabled = item.enabled;
                if (item.interactionAnchorLocal) spawned.userData.interactionAnchorLocal = [...item.interactionAnchorLocal];
                if (item.labelAnchorLocal) spawned.userData.labelAnchorLocal = [...item.labelAnchorLocal];
                if (item.interactionRadius !== undefined) spawned.userData.interactionRadius = item.interactionRadius;
                if (item.interactionMode !== undefined) spawned.userData.interactionMode = item.interactionMode;
                const isRockMtn = (item.name || '').toLowerCase().includes('rock') || (item.name || '').toLowerCase().includes('mountain') || (item.name || '').toLowerCase().includes('cliff');
                if (item.isColorBlended === true && isRockMtn) {
                  applyStylizedColorBlend(spawned, true);
                  spawned.userData.isColorBlended = true;
                } else {
                  spawned.userData.isColorBlended = false;
                }
              } catch (err) {
                console.warn(`Could not restore extracted asset: ${assetPath}`, err);
              }
            } else if (item.templateType && templates.has(item.templateType)) {
              const spawned = spawnItem(item.templateType, new THREE.Vector3(...item.position), item.name);
              if (spawned) {
                spawned.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
                spawned.scale.set(item.scale[0], item.scale[1], item.scale[2]);
                spawned.userData.name = item.name;
                spawned.name = item.name;

                // Restore Landmark identity
                if (item.buildingInstanceId) spawned.userData.buildingInstanceId = item.buildingInstanceId;
                if (item.landmarkId !== undefined) spawned.userData.landmarkId = item.landmarkId;
                if (item.actionId !== undefined) spawned.userData.actionId = item.actionId;
                if (item.displayNameVi !== undefined) spawned.userData.displayNameVi = item.displayNameVi;
                if (item.displayNameEn !== undefined) spawned.userData.displayNameEn = item.displayNameEn;
                if (item.iconId !== undefined) spawned.userData.iconId = item.iconId;
                if (item.descriptionVi !== undefined) spawned.userData.descriptionVi = item.descriptionVi;
                if (item.hasFunction !== undefined) spawned.userData.hasFunction = item.hasFunction;
                if (item.enabled !== undefined) spawned.userData.enabled = item.enabled;
                if (item.interactionAnchorLocal) spawned.userData.interactionAnchorLocal = [...item.interactionAnchorLocal];
                if (item.labelAnchorLocal) spawned.userData.labelAnchorLocal = [...item.labelAnchorLocal];
                if (item.interactionRadius !== undefined) spawned.userData.interactionRadius = item.interactionRadius;
                if (item.interactionMode !== undefined) spawned.userData.interactionMode = item.interactionMode;
              }
            } else if (item.type && templates.has(item.type)) {
              const spawned = spawnItem(item.type, new THREE.Vector3(...item.position), item.name);
              if (spawned) {
                spawned.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
                spawned.scale.set(item.scale[0], item.scale[1], item.scale[2]);
                spawned.userData.name = item.name;
                spawned.name = item.name;

                // Restore Landmark identity
                if (item.buildingInstanceId) spawned.userData.buildingInstanceId = item.buildingInstanceId;
                if (item.landmarkId !== undefined) spawned.userData.landmarkId = item.landmarkId;
                if (item.actionId !== undefined) spawned.userData.actionId = item.actionId;
                if (item.displayNameVi !== undefined) spawned.userData.displayNameVi = item.displayNameVi;
                if (item.displayNameEn !== undefined) spawned.userData.displayNameEn = item.displayNameEn;
                if (item.iconId !== undefined) spawned.userData.iconId = item.iconId;
                if (item.descriptionVi !== undefined) spawned.userData.descriptionVi = item.descriptionVi;
                if (item.hasFunction !== undefined) spawned.userData.hasFunction = item.hasFunction;
                if (item.enabled !== undefined) spawned.userData.enabled = item.enabled;
                if (item.interactionAnchorLocal) spawned.userData.interactionAnchorLocal = [...item.interactionAnchorLocal];
                if (item.labelAnchorLocal) spawned.userData.labelAnchorLocal = [...item.labelAnchorLocal];
                if (item.interactionRadius !== undefined) spawned.userData.interactionRadius = item.interactionRadius;
                if (item.interactionMode !== undefined) spawned.userData.interactionMode = item.interactionMode;
              }
            } else if (item.customDataUrl) {
              try {
                const gltf = await new Promise<any>((resolve, reject) => {
                  gltfLoader.load(item.customDataUrl!, resolve, undefined, reject);
                });
                const model = gltf.scene;
                model.name = item.name;
                model.position.set(item.position[0], item.position[1], item.position[2]);
                model.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
                model.scale.set(item.scale[0], item.scale[1], item.scale[2]);
                model.traverse((child: any) => {
                  if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                });
                parentGroup.add(model);
                registerObject(model, 'custom_model', item.name, {
                  isCustomSpawn: true,
                  customDataUrl: item.customDataUrl,
                });
              } catch (err) {
                console.warn(`Could not restore custom model from data url`, err);
              }
            }
          }
        }
      }

      // 4. Any default base object that was NOT in data was deleted by the user
      for (const baseObj of baseObjects) {
        // Protect permanent island structure from being deleted
        if (baseObj.userData?.isPermanent) {
          continue;
        }

        if (!matchedBaseNames.has(baseObj.userData?.name)) {
          console.log(`Removing deleted base object: ${baseObj.userData?.name}`);
          const idx = editableObjects.indexOf(baseObj);
          if (idx !== -1) editableObjects.splice(idx, 1);
          if (baseObj.parent) {
            baseObj.parent.remove(baseObj);
          } else {
            parentGroup.remove(baseObj);
          }
          deletedBaseObjects.push(baseObj);
        }
      }

      selectObject(null);
      updateBoxHelper();
      modelBufferCache.clear();
      waterAnimationManager.animateWaterMeshes(parentGroup);
      console.log(`Successfully imported/loaded layout with ${data.length} objects.`);
      return true;
    } catch (err) {
      console.error('Failed to import layout JSON:', err);
      return false;
    } finally {
      isImportingLayout = false;
    }
  }

  // Pointer Interaction
  function handlePointerDown(e: PointerEvent, raycaster: THREE.Raycaster): boolean {
    if (!enabled) return false;

    // First check if clicking on any editable object
    const intersects = raycaster.intersectObjects(editableObjects, true);
    if (intersects.length > 0) {
      // Find the top-level editable parent
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && hitObj !== parentGroup && !hitObj.userData?.editable) {
        hitObj = hitObj.parent;
      }

      if (hitObj && hitObj.userData?.editable) {
        selectObject(hitObj);
        isDragging = true;

        // Calculate drag offset relative to ground intersection
        const groundHits = raycaster.intersectObject(walkablePlane, false);
        if (groundHits.length > 0) {
          dragOffset.copy(hitObj.position).sub(groundHits[0].point);
        } else {
          // Fallback to ground plane at Y = walkablePlane.position.y (Y = 1.82)
          const mathPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -walkablePlane.position.y);
          const planeHit = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(mathPlane, planeHit)) {
            dragOffset.copy(hitObj.position).sub(planeHit);
          }
        }
        return true;
      }
    }

    // Clicked on empty ground or air -> deselect
    if (selectedObject) {
      selectObject(null);
      return true;
    }

    return false;
  }

  function handlePointerMove(e: PointerEvent, raycaster: THREE.Raycaster): boolean {
    if (!enabled || !isDragging || !selectedObject) return false;

    const groundHits = raycaster.intersectObject(walkablePlane, false);
    let hitPoint: THREE.Vector3 | null = groundHits.length > 0 ? groundHits[0].point : null;
    if (!hitPoint) {
      const mathPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -walkablePlane.position.y);
      const planeHit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(mathPlane, planeHit)) {
        hitPoint = planeHit;
      }
    }

    if (hitPoint) {
      selectedObject.position.x = hitPoint.x + dragOffset.x;
      selectedObject.position.z = hitPoint.z + dragOffset.z;
      updateBoxHelper();
      updateDoorHelper();
      return true;
    }

    return false;
  }

  function handlePointerUp() {
    isDragging = false;
  }

  return {
    isEnabled: () => enabled,
    enable: () => {
      enabled = true;
      updateBoxHelper();
      updateDoorHelper();
      notifyChangeState();
    },
    disable: () => {
      enabled = false;
      selectObject(null);
      notifyChangeState();
    },
    toggle: () => {
      enabled = !enabled;
      if (!enabled) selectObject(null);
      notifyChangeState();
      return enabled;
    },
    selectObject,
    getSelectedObject: () => selectedObject,
    getSelectedInfo: () => {
      if (!selectedObject) return null;
      return {
        name: selectedObject.userData?.name || 'Vật thể',
        type: selectedObject.userData?.type || 'item',
      };
    },
    getSelectedLandmarkData,
    updateBuildingLandmark,
    replaceSelectedModel,
    validateBuilding,
    getLandmarkBuildings,
    getLoadedBuildings,
    moveSelected,
    rotateSelected,
    scaleSelected,
    elevateSelected,
    deleteSelected,
    duplicateSelected,
    spawnItem,
    spawnExtractedAsset,
    loadCustomModel,
    saveLayout,
    loadSavedLayout,
    resetDefaultLayout,
    exportJSON,
    importJSON,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    update: () => {
      if (boxHelper && selectedObject && boxHelper.visible) {
        boxHelper.update();
      }
    },
    blendSelectedColor: () => {
      if (!selectedObject) return false;
      const res = applyStylizedColorBlend(selectedObject, true);
      selectedObject.userData.isColorBlended = true;
      selectedObject.traverse((c) => {
        c.userData.isColorBlended = true;
      });
      // AUTO-SAVE IMMEDIATELY SO COLOR PERSISTS ACROSS F5!
      saveLayout();
      console.log(`Đã lên màu và tự động lưu bố cục cho vật thể [${selectedObject.name}]:`, res);
      return res;
    },
    restoreSelectedColor: () => {
      if (!selectedObject) return false;
      const res = restoreOriginalColor(selectedObject);
      selectedObject.userData.isColorBlended = false;
      selectedObject.traverse((c) => {
        c.userData.isColorBlended = false;
      });
      saveLayout();
      console.log(`Đã khôi phục màu gốc cho [${selectedObject.name}]:`, res);
      return res;
    },
  };
}
