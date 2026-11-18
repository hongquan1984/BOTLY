import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CozyVillageBuildResult } from './cozyVillageBuilder';
import { IslandNavMesh } from './navigationMesh';
import { ObstacleCollider } from './villageBuilder';
import { waterAnimationManager } from './waterAnimation';
import { getInitialLandmarkForBuilding } from '../data/landmarkCatalog';

export interface BuildingConfig {
  buildingInstanceId: string;
  name: string;
  displayName: {
    vi: string;
    en: string;
  };
  hasFunction: boolean;
  landmarkId?: string;
  actionId?: string;
  iconId?: string;
  enabled?: boolean;
  anchorLocal: [number, number, number];
  labelAnchorLocal?: [number, number, number];
  interactionRadius?: number;
  interactionMode?: 'walk_then_enter' | 'direct_open';
  descriptionVi?: string;
}

export interface LoadedBuilding {
  config: BuildingConfig;
  meshGroup: THREE.Object3D;
  badgeMesh?: THREE.Mesh;
  getDoorWorldAnchor: () => THREE.Vector3;
  getLabelWorldAnchor: () => THREE.Vector3;
}

export interface VillageLayoutLoadResult {
  buildings: LoadedBuilding[];
  interactiveMeshes: THREE.Object3D[];
  colliders: ObstacleCollider[];
}

export const BUILDING_REGISTRY: Record<string, BuildingConfig> = {
  // 1. Herbal House (Potion Shop) - Tiên Nữ Flora
  "Lumi's Potion Shop": {
    buildingInstanceId: 'bld_potion_shop',
    name: "Lumi's Potion Shop",
    displayName: { vi: 'Nhà Thảo Mộc', en: 'Herbal House' },
    hasFunction: true,
    landmarkId: 'herbal_garden',
    actionId: 'OPEN_HERBAL_GARDEN',
    iconId: '🌿',
    anchorLocal: [0, 0, 2.8],
    descriptionVi: 'Tìm hiểu hoa cỏ, dược tính tự nhiên & trà thanh lọc cùng Tiên Nữ Flora',
  },

  // 2. Sound House (Arcane Bookshop Cottage) - Tiên Nữ Lyra
  'Arcane Bookshop': {
    buildingInstanceId: 'bld_bookshop',
    name: 'Arcane Bookshop',
    displayName: { vi: 'Nhà Âm Thanh', en: 'Sound House' },
    hasFunction: true,
    landmarkId: 'sound_garden',
    actionId: 'OPEN_SOUND_GARDEN',
    iconId: '🎵',
    anchorLocal: [0, 0, 2.5],
    descriptionVi: 'Thanh âm thiên nhiên, suối thác & tần số sóng não 432Hz cùng Tiên Nữ Lyra',
  },

  // 3. Zen Breath Sanctuary (Great Hall) - Tiên Nữ Aura
  'Great Hall (Nhà sinh hoạt chung)_8967_52': {
    buildingInstanceId: 'bld_great_hall',
    name: 'Great Hall',
    displayName: { vi: 'Thiền Đường - Hơi Thở', en: 'Zen Breath Sanctuary' },
    hasFunction: true,
    landmarkId: 'zen_breath',
    actionId: 'OPEN_ZEN_BREATH',
    iconId: '🌬️',
    anchorLocal: [0, 0, 3.2],
    descriptionVi: 'Kỹ thuật thở 4-7-8, thở hộp & thôi miên ru ngủ cùng Tiên Nữ Aura',
  },

  // 4. Guồng Nước Trang Trí (Prop ven suối, không phải nhà)
  'Guồng Nước (Water Wheel)': {
    buildingInstanceId: 'bld_watermill',
    name: 'Guồng Nước (Water Wheel)',
    displayName: { vi: 'Guồng Nước Suối', en: 'River Water Wheel' },
    hasFunction: false,
    anchorLocal: [0, 0, 2.8],
  },

  // 5. Village Square (Plaza Well)
  'Plaza Well': {
    buildingInstanceId: 'bld_plaza_well',
    name: 'Plaza Well',
    displayName: { vi: 'Quảng Trường & Giếng Ước', en: 'Plaza & Well' },
    hasFunction: true,
    landmarkId: 'village_square',
    actionId: 'OPEN_VILLAGE_SQUARE',
    iconId: '⛲',
    anchorLocal: [0, 0, 2.0],
    descriptionVi: 'Nhận nhiệm vụ hàng ngày & điểm danh năng lượng EXP',
  },

  // 6. Fantasy Cottage
  'fantasy_house_9348': {
    buildingInstanceId: 'bld_fantasy_cottage',
    name: 'fantasy_house_9348',
    displayName: { vi: 'Nhà Nghỉ Chân', en: 'Rest Cottage' },
    hasFunction: false,
    anchorLocal: [0, 0, 2.5],
  },

  // 7. Stone Cottage
  'stone_house_7483': {
    buildingInstanceId: 'bld_stone_cottage',
    name: 'stone_house_7483',
    displayName: { vi: 'Nhà Đá Cổ', en: 'Stone Cottage' },
    hasFunction: false,
    anchorLocal: [0, 0, 2.5],
  },
};

function downscaleTexture(texture: THREE.Texture, maxDim: number = 1024) {
  if (!texture || !texture.image) return;
  const img = texture.image;
  const w = img.width || (img.videoWidth as number) || 0;
  const h = img.height || (img.videoHeight as number) || 0;
  if (w > maxDim || h > maxDim) {
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxDim / w, maxDim / h);
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
        texture.needsUpdate = true;
      }
    } catch {}
  }
}

function clampModelTextures(root: THREE.Object3D, maxDim: number = 1024) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (!m) continue;
        if ((m as any).map) downscaleTexture((m as any).map, maxDim);
        if ((m as any).emissiveMap) downscaleTexture((m as any).emissiveMap, maxDim);
        if ((m as any).normalMap) downscaleTexture((m as any).normalMap, maxDim);
        if ((m as any).roughnessMap) downscaleTexture((m as any).roughnessMap, maxDim);
      }
    }
  });
}

function createBuildingBadge(title: string, iconEmoji: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // Background rounded pill
  ctx.fillStyle = 'rgba(5, 23, 18, 0.92)';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 364, 76, 38);
  ctx.fill();
  ctx.stroke();

  // Subtle inner highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(14, 14, 356, 68, 34);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${iconEmoji} ${title}`, 192, 49);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });

  const geo = new THREE.PlaneGeometry(2.4, 0.6);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 999;
  return mesh;
}

const modelCache = new Map<string, THREE.Group>();

async function getCachedGLTF(url: string, loader: GLTFLoader, timeoutMs: number = 3000): Promise<THREE.Group> {
  if (modelCache.has(url)) {
    return modelCache.get(url)!.clone(true);
  }
  const loadPromise = new Promise<any>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
  const timeoutPromise = new Promise<any>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout loading ${url}`)), timeoutMs)
  );

  const gltf = await Promise.race([loadPromise, timeoutPromise]);
  modelCache.set(url, gltf.scene);
  return gltf.scene.clone(true);
}

export async function loadCozyVillageLayout(
  cozyVillage: CozyVillageBuildResult,
  navMesh?: IslandNavMesh
): Promise<VillageLayoutLoadResult> {
  const gltfLoader = new GLTFLoader();
  const parentGroup = cozyVillage.group;
  const baseObjects = [...cozyVillage.editableObjects];
  const templates = cozyVillage.templates;

  let layoutData: any[] | null = null;

  // Older player layouts used the pre-integration roles (Great Hall =
  // "Hành Trình Của Tôi", Bookshop = knowledge library, Water Wheel = cloud
  // therapy). Do not let those persisted layouts override the canonical
  // HealthClues village mapping used by the player runtime.
  const isCurrentHealthCluesLayout = (items: any[]) => {
    const bookshop = items.find((item) => item?.buildingInstanceId === 'bld_bookshop');
    const greatHall = items.find((item) => item?.buildingInstanceId === 'bld_great_hall');
    const watermill = items.find((item) => item?.buildingInstanceId === 'bld_watermill');
    return (
      bookshop?.landmarkId === 'sound_garden' &&
      bookshop?.actionId === 'OPEN_SOUND_GARDEN' &&
      bookshop?.displayNameVi === 'Nhà Âm Thanh' &&
      greatHall?.landmarkId === 'zen_breath' &&
      greatHall?.actionId === 'OPEN_ZEN_BREATH' &&
      greatHall?.displayNameVi === 'Thiền Đường - Hơi Thở' &&
      watermill?.hasFunction === false
    );
  };

  // 1. Prioritize user's active saved layout from LocalStorage
  try {
    const local = localStorage.getItem('cozy_village_layout_v1');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0 && isCurrentHealthCluesLayout(parsed)) {
        layoutData = parsed;
        console.log(`[cozyVillageLayoutLoader] Loaded layout from LocalStorage: ${layoutData.length} items`);
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        console.warn('[cozyVillageLayoutLoader] Ignoring stale pre-HealthClues player layout; loading canonical village layout.');
      }
    }
  } catch {}

  // 2. Fallback to server JSON file (/data/cozy_village_layout.json)
  if (!layoutData || !Array.isArray(layoutData) || layoutData.length === 0) {
    try {
      const res = await fetch(`/data/cozy_village_layout.json?t=${Date.now()}`);
      if (res.ok) {
        const parsed = await res.json();
        if (Array.isArray(parsed) && parsed.length > 0) {
          layoutData = parsed;
        }
      }
    } catch {}
  }

  if (!layoutData || !Array.isArray(layoutData) || layoutData.length === 0) {
    try {
      const res = await fetch(`/worlds/cozy_village_manifest.json?t=${Date.now()}`);
      if (res.ok) {
        const manifest = await res.json();
        // Flatten manifest into layoutData
        layoutData = [];
        if (manifest.buildings) {
          manifest.buildings.forEach((b: any) => {
            layoutData!.push({
              name: b.name,
              type: b.type,
              assetUrl: b.assetUrl,
              templateType: b.templateType,
              modelStorageKey: b.modelStorageKey,
              position: b.transform.position,
              rotation: b.transform.rotation,
              scale: b.transform.scale,
              isCustomSpawn: b.type === 'custom_model' || b.type === 'extracted_asset',
              hasFunction: b.hasFunction,
              buildingInstanceId: b.buildingInstanceId,
              landmarkId: b.landmarkId,
              actionId: b.actionId,
              displayNameVi: b.displayName?.vi || b.displayNameVi,
              displayNameEn: b.displayName?.en || b.displayNameEn,
              iconId: b.iconId,
              enabled: b.enabled,
              interactionAnchorLocal: b.interaction?.anchorLocal || b.interactionAnchorLocal,
              labelAnchorLocal: b.interaction?.labelAnchorLocal || b.labelAnchorLocal,
              interactionRadius: b.interaction?.radius || b.interactionRadius,
              interactionMode: b.interaction?.mode || b.interactionMode,
            });
          });
        }
        if (manifest.environmentObjects) {
          manifest.environmentObjects.forEach((e: any) => {
            layoutData!.push({
              name: e.name,
              type: e.type,
              assetUrl: e.assetUrl,
              templateType: e.templateType,
              modelStorageKey: e.modelStorageKey,
              position: e.transform.position,
              rotation: e.transform.rotation,
              scale: e.transform.scale,
              isCustomSpawn: !!e.isCustomSpawn,
              isColorBlended: !!e.isColorBlended,
            });
          });
        }
      }
    } catch {}
  }

  if (!layoutData || !Array.isArray(layoutData) || layoutData.length === 0) {
    try {
      const local = localStorage.getItem('cozy_village_layout_v1');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && isCurrentHealthCluesLayout(parsed)) {
          layoutData = parsed;
        }
      }
    } catch {}
  }

  // Fallback to static backup file on disk
  if (!layoutData || !Array.isArray(layoutData) || layoutData.length === 0) {
    try {
      const res = await fetch(`/data/cozy_village_backup.json?t=${Date.now()}`);
      if (res.ok) {
        layoutData = await res.json();
      } else {
        const res2 = await fetch(`/src/data/cozy_village_backup.json?t=${Date.now()}`);
        if (res2.ok) {
          layoutData = await res2.json();
        }
      }
    } catch {}
  }

  if (!layoutData || !Array.isArray(layoutData)) {
    console.warn('[VillageLayout] No layout data found. Using base scene.');
    return { buildings: [], interactiveMeshes: [], colliders: [] };
  }

  console.log(`[VillageLayout] Applying ${layoutData.length} items from saved layout...`);

  // Preload unique custom GLTF assets in parallel to avoid sequential network waterfall
  const urlsToPreload = new Set<string>();
  for (const item of layoutData) {
    if (item.modelStorageKey) {
      urlsToPreload.add(`/assets-custom/${item.modelStorageKey}.glb`);
    } else if (item.assetUrl) {
      const cleanPath = item.assetUrl.startsWith('/') ? item.assetUrl.slice(1) : item.assetUrl;
      urlsToPreload.add(`/${cleanPath}`);
    }
  }

  if (urlsToPreload.size > 0) {
    console.log(`[VillageLayout] Fast-preloading ${urlsToPreload.size} unique models in parallel...`);
    await Promise.allSettled(
      Array.from(urlsToPreload).map((url) => getCachedGLTF(url, gltfLoader, 2500))
    );
  }

  const matchedBaseNames = new Set<string>();
  const activeBuildings: LoadedBuilding[] = [];
  const interactiveMeshes: THREE.Object3D[] = [];
  const dynamicColliders: ObstacleCollider[] = [];

  // Helper to register building metadata
  const registerBuilding = (obj: THREE.Object3D, cfg: BuildingConfig) => {
    obj.userData.isBuilding = true;
    obj.userData.buildingConfig = cfg;
    obj.userData.buildingInstanceId = cfg.buildingInstanceId;

    // Register all child meshes for raycasting
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.isBuilding = true;
        child.userData.buildingConfig = cfg;
        child.userData.buildingInstanceId = cfg.buildingInstanceId;
        interactiveMeshes.push(child);
      }
    });

    // Clean up any existing 3D overhead badge on this object first
    const existingBadge = obj.children.find((c) => c.name === 'BuildingBadge');
    if (existingBadge) {
      obj.remove(existingBadge);
      existingBadge.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
    }

    // Add 3D Overhead Badge for functional buildings
    let badgeMesh: THREE.Mesh | undefined;
    if (cfg.hasFunction) {
      let emoji = '🏛️';
      if (cfg.landmarkId === 'herbal_garden') emoji = '🌿';
      else if (cfg.landmarkId === 'cloud_therapy') emoji = '🌊';
      else if (cfg.landmarkId === 'knowledge_library') emoji = '📖';
      else if (cfg.landmarkId === 'journey_house') emoji = '🏰';
      else if (cfg.landmarkId === 'village_square') emoji = '⛲';

      badgeMesh = createBuildingBadge(cfg.displayName.vi, emoji);
      badgeMesh.name = 'BuildingBadge';
      // Place badge floating above the building
      const sy = Math.max(0.1, obj.scale.y || 1);
      const badgeY = cfg.buildingInstanceId === 'bld_great_hall' ? 4.8 / sy : 3.8 / sy;
      badgeMesh.position.set(0, badgeY, 0);
      obj.add(badgeMesh);
    }

    const loadedBld: LoadedBuilding = {
      config: cfg,
      meshGroup: obj,
      badgeMesh,
      getDoorWorldAnchor: () => {
        const local = new THREE.Vector3(...(cfg.anchorLocal || [0, 0, 2.8]));
        const world = obj.localToWorld(local.clone());
        world.y = 1.82; // clamp to standard ground walking height
        return world;
      },
      getLabelWorldAnchor: () => {
        const local = new THREE.Vector3(...(cfg.labelAnchorLocal || [0, 4.0, 0]));
        return obj.localToWorld(local.clone());
      },
    };
    activeBuildings.push(loadedBld);

    // Compute bounding box collider for navmesh
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    dynamicColliders.push({
      id: cfg.buildingInstanceId,
      centerX: center.x,
      centerZ: center.z,
      minX: box.min.x - 0.3,
      maxX: box.max.x + 0.3,
      minZ: box.min.z - 0.3,
      maxZ: box.max.z + 0.3,
    });
  };

  // 2. Process each saved item
  for (const item of layoutData) {
    const rawName = item.name || '';

    // Match in base objects
    const match = baseObjects.find(
      (o) =>
        o.userData?.name === rawName ||
        o.name === rawName ||
        (rawName.includes('Mountain') && o.userData?.name?.includes('Mountain'))
    );

    if (match) {
      matchedBaseNames.add(match.userData.name);
      if (!parentGroup.children.includes(match)) {
        parentGroup.add(match);
      }
      match.position.set(item.position[0], item.position[1], item.position[2]);
      match.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
      match.scale.set(item.scale[0], item.scale[1], item.scale[2]);

      // Check if this base object is a functional building or has saved landmark metadata
      const isFunctional = item.hasFunction !== undefined ? !!item.hasFunction : (!!item.landmarkId || !!BUILDING_REGISTRY[match.userData.name] || !!BUILDING_REGISTRY[rawName]);
      const initialCat = getInitialLandmarkForBuilding(rawName, item.type || '');
      
      const bldCfg: BuildingConfig | null = (isFunctional || item.buildingInstanceId) ? {
        buildingInstanceId: item.buildingInstanceId || (BUILDING_REGISTRY[match.userData.name]?.buildingInstanceId) || (BUILDING_REGISTRY[rawName]?.buildingInstanceId) || initialCat?.buildingInstanceId || `bld_${rawName.replace(/\s+/g, '_').toLowerCase()}`,
        name: rawName,
        displayName: {
          vi: item.displayNameVi || item.displayName?.vi || (BUILDING_REGISTRY[match.userData.name]?.displayName.vi) || (BUILDING_REGISTRY[rawName]?.displayName.vi) || initialCat?.displayName.vi || 'Công trình',
          en: item.displayNameEn || item.displayName?.en || (BUILDING_REGISTRY[match.userData.name]?.displayName.en) || (BUILDING_REGISTRY[rawName]?.displayName.en) || initialCat?.displayName.en || 'Building',
        },
        hasFunction: isFunctional,
        landmarkId: item.landmarkId || (BUILDING_REGISTRY[match.userData.name]?.landmarkId) || (BUILDING_REGISTRY[rawName]?.landmarkId) || initialCat?.landmarkId,
        actionId: item.actionId || (BUILDING_REGISTRY[match.userData.name]?.actionId) || (BUILDING_REGISTRY[rawName]?.actionId) || initialCat?.actionId,
        iconId: item.iconId || initialCat?.iconId || '🏛️',
        enabled: item.enabled !== undefined ? !!item.enabled : true,
        anchorLocal: item.interactionAnchorLocal || item.anchorLocal || (BUILDING_REGISTRY[match.userData.name]?.anchorLocal) || (BUILDING_REGISTRY[rawName]?.anchorLocal) || [0, 0, 2.8],
        labelAnchorLocal: item.labelAnchorLocal || (initialCat as any)?.defaultLabelAnchor || [0, 4.0, 0],
        interactionRadius: item.interactionRadius || 2.5,
        interactionMode: item.interactionMode || 'walk_then_enter',
      } : null;

      if (bldCfg) {
        registerBuilding(match, bldCfg);
      }
    } else {
      // Custom spawned item to load!
      let modelGroup: THREE.Group | null = null;

      // A. Custom uploaded models (IndexedDB or static /assets-custom/ fallback)
      if (item.modelStorageKey) {
        try {
          // Fetch from static file with cache
          const modelUrl = `/assets-custom/${item.modelStorageKey}.glb`;
          modelGroup = await getCachedGLTF(modelUrl, gltfLoader);
        } catch (err) {
          console.warn(`[VillageLayout] Could not load static model for ${item.modelStorageKey}:`, err);
        }
      }

      // B. Extracted GLB assets
      if (!modelGroup && item.assetUrl) {
        const cleanPath = item.assetUrl.startsWith('/') ? item.assetUrl.slice(1) : item.assetUrl;
        try {
          modelGroup = await getCachedGLTF(`/${cleanPath}`, gltfLoader);
        } catch (err) {
          console.warn(`[VillageLayout] Could not load asset ${cleanPath}:`, err);
        }
      }

      // C. Cloned from template
      if (!modelGroup && item.templateType && templates.has(item.templateType)) {
        modelGroup = templates.get(item.templateType)!.clone(true);
      } else if (!modelGroup && item.type && templates.has(item.type)) {
        modelGroup = templates.get(item.type)!.clone(true);
      }

      if (modelGroup) {
        clampModelTextures(modelGroup, 1024);
        modelGroup.name = rawName;
        modelGroup.position.set(item.position[0], item.position[1], item.position[2]);
        modelGroup.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
        modelGroup.scale.set(item.scale[0], item.scale[1], item.scale[2]);

        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        parentGroup.add(modelGroup);
        waterAnimationManager.animateWaterMeshes(modelGroup);

        // Check if custom object is a registered building or has landmark metadata
        const isFunctional = item.hasFunction !== undefined ? !!item.hasFunction : (!!item.landmarkId || !!BUILDING_REGISTRY[rawName] || rawName.includes('Great Hall'));
        const initialCat = getInitialLandmarkForBuilding(rawName, item.type || '');

        if (isFunctional || item.buildingInstanceId || initialCat) {
          const bldCfg: BuildingConfig = {
            buildingInstanceId: item.buildingInstanceId || (BUILDING_REGISTRY[rawName]?.buildingInstanceId) || initialCat?.buildingInstanceId || `bld_${rawName.replace(/\s+/g, '_').toLowerCase()}`,
            name: rawName,
            displayName: {
              vi: item.displayNameVi || item.displayName?.vi || (BUILDING_REGISTRY[rawName]?.displayName.vi) || initialCat?.displayName.vi || 'Công trình',
              en: item.displayNameEn || item.displayName?.en || (BUILDING_REGISTRY[rawName]?.displayName.en) || initialCat?.displayName.en || 'Building',
            },
            hasFunction: isFunctional,
            landmarkId: item.landmarkId || (BUILDING_REGISTRY[rawName]?.landmarkId) || initialCat?.landmarkId,
            actionId: item.actionId || (BUILDING_REGISTRY[rawName]?.actionId) || initialCat?.actionId,
            iconId: item.iconId || initialCat?.iconId || '🏛️',
            enabled: item.enabled !== undefined ? !!item.enabled : true,
            anchorLocal: item.interactionAnchorLocal || item.anchorLocal || (BUILDING_REGISTRY[rawName]?.anchorLocal) || [0, 0, 2.8],
            labelAnchorLocal: item.labelAnchorLocal || (initialCat as any)?.defaultLabelAnchor || [0, 4.0, 0],
            interactionRadius: item.interactionRadius || 2.5,
            interactionMode: item.interactionMode || 'walk_then_enter',
          };
          registerBuilding(modelGroup, bldCfg);
        } else {
          // If it's a solid mountain or huge rock, add collider
          if (rawName.toLowerCase().includes('mountain') || rawName.toLowerCase().includes('rock')) {
            const box = new THREE.Box3().setFromObject(modelGroup);
            const center = new THREE.Vector3();
            box.getCenter(center);
            dynamicColliders.push({
              id: rawName,
              centerX: center.x,
              centerZ: center.z,
              minX: box.min.x - 0.2,
              maxX: box.max.x + 0.2,
              minZ: box.min.z - 0.2,
              maxZ: box.max.z + 0.2,
            });
          }
        }
      }
    }
  }

  // 3. Remove any default base objects that were deleted by the user
  for (const baseObj of baseObjects) {
    if (
      baseObj.name?.includes('Mountain') ||
      baseObj.name?.includes('Waterfall') ||
      baseObj.name?.includes('River') ||
      baseObj.userData?.name?.includes('Mountain') ||
      baseObj.userData?.name?.includes('Headwater') ||
      baseObj.userData?.type === 'mountain' ||
      baseObj.userData?.type === 'waterfall' ||
      baseObj.userData?.type === 'river' ||
      baseObj.userData?.isPermanent
    ) {
      continue;
    }

    if (!matchedBaseNames.has(baseObj.userData?.name)) {
      if (baseObj.parent) {
        baseObj.parent.remove(baseObj);
      } else {
        parentGroup.remove(baseObj);
      }
    }
  }

  // 4. Update NavMesh with dynamic colliders if available
  if (navMesh && typeof (navMesh as any).updateColliders === 'function') {
    // Also include permanent water obstacles
    const riverColliders: ObstacleCollider[] = [
      {
        id: 'river-bank-nw',
        centerX: -4.0,
        centerZ: -4.0,
        minX: -5.5,
        maxX: -2.5,
        minZ: -7.0,
        maxZ: -1.0,
      },
      {
        id: 'pond-water',
        centerX: 6.8,
        centerZ: 3.5,
        radius: 3.5,
        minX: 3.3,
        maxX: 10.3,
        minZ: 0.0,
        maxZ: 7.0,
      },
    ];
    (navMesh as any).updateColliders([...dynamicColliders, ...riverColliders]);
  }

  console.log(
    `[VillageLayout] Synchronized village: ${activeBuildings.length} buildings registered, ${interactiveMeshes.length} interactive meshes, ${dynamicColliders.length} colliders.`
  );

  return {
    buildings: activeBuildings,
    interactiveMeshes,
    colliders: dynamicColliders,
  };
}
