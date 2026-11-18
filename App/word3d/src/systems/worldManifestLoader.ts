import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface BuildingInteractionConfig {
  mode: 'walk_then_open' | 'direct_open';
  anchorLocal: [number, number, number];
  radius: number;
}

export interface BuildingManifestItem {
  buildingInstanceId: string;
  name: string;
  displayName: {
    vi: string;
    en: string;
  };
  type: string;
  assetUrl?: string;
  templateType?: string;
  modelStorageKey?: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  hasFunction: boolean;
  landmarkId?: string;
  actionId?: string;
  interaction: BuildingInteractionConfig;
}

export interface EnvironmentManifestItem {
  name: string;
  type: string;
  assetUrl?: string;
  templateType?: string;
  modelStorageKey?: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  isCustomSpawn?: boolean;
  isColorBlended?: boolean;
}

export interface WorldManifest {
  schemaVersion: number;
  worldId: string;
  worldName: string;
  version: string;
  contentHash: string;
  updatedAt: string;
  allowlistActions: string[];
  buildings: BuildingManifestItem[];
  environmentObjects: EnvironmentManifestItem[];
}

export interface LoadedBuilding {
  config: BuildingManifestItem;
  meshGroup: THREE.Object3D;
  badgeMesh?: THREE.Mesh;
  worldAnchor: THREE.Vector3;
}

export interface WorldManifestLoadResult {
  group: THREE.Group;
  buildings: LoadedBuilding[];
  interactiveMeshes: THREE.Object3D[];
  colliders: { box: THREE.Box3; name: string }[];
  manifest: WorldManifest;
}

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

// Warm emission texture for glowing windows & lanterns
const emissionMap = textureLoader.load(
  '/assets/medieval_village/Textures/T_Village_Emission.png'
);

function applyStylizedMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (!m) continue;
        const std = m as THREE.MeshStandardMaterial;
        std.roughness = Math.max(0.68, std.roughness || 0.7);
        std.metalness = Math.min(0.08, std.metalness || 0.04);

        if (std.name && (std.name.includes('Glow') || std.name.includes('Atlas'))) {
          std.emissiveMap = emissionMap;
          std.emissive = new THREE.Color('#fbbf24');
          std.emissiveIntensity = 1.35;
        }
      }
    }
  });
}

function createBuildingBadge(title: string, iconEmoji: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // Pill shape
  ctx.fillStyle = 'rgba(5, 23, 18, 0.88)';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 364, 76, 38);
  ctx.fill();
  ctx.stroke();

  // Icon & Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${iconEmoji} ${title}`, 192, 48);

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

export async function loadWorldFromManifest(
  manifestUrl: string = '/worlds/cozy_village_manifest.json'
): Promise<WorldManifestLoadResult> {
  const group = new THREE.Group();
  group.name = 'ManifestWorldRoot';

  // 1. Fetch Manifest
  const res = await fetch(`${manifestUrl}?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`Failed to load world manifest from ${manifestUrl}: ${res.statusText}`);
  }
  const manifest: WorldManifest = await res.json();

  const buildings: LoadedBuilding[] = [];
  const interactiveMeshes: THREE.Object3D[] = [];
  const colliders: { box: THREE.Box3; name: string }[] = [];

  // Helper to load GLTF model
  const loadModel = (url: string): Promise<THREE.Group> => {
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          applyStylizedMaterials(gltf.scene);
          resolve(gltf.scene);
        },
        undefined,
        (err) => reject(err)
      );
    });
  };

  // 2. Load Buildings
  for (const bld of manifest.buildings) {
    let modelGroup: THREE.Group | null = null;
    let modelPath = bld.assetUrl;

    if (!modelPath) {
      if (bld.type === 'cottage') {
        modelPath = '/assets/medieval_village/GLTF/Buildings/SM_Cottage_Small.gltf';
      } else if (bld.type === 'well') {
        modelPath = '/assets/medieval_village/GLTF/Props/SM_Well.gltf';
      }
    }

    if (modelPath) {
      try {
        modelGroup = await loadModel(modelPath);
      } catch (err) {
        console.warn(`[WorldManifest] Failed to load model for ${bld.name} at ${modelPath}, using fallback`, err);
        // Fallback placeholder box
        const geo = new THREE.BoxGeometry(2.5, 2.8, 2.5);
        const mat = new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        modelGroup = new THREE.Group();
        modelGroup.add(mesh);
      }
    }

    if (!modelGroup) continue;

    // Apply Transform
    const [px, py, pz] = bld.transform.position;
    const [rx, ry, rz] = bld.transform.rotation;
    const [sx, sy, sz] = bld.transform.scale;

    modelGroup.position.set(px, py, pz);
    modelGroup.rotation.set(rx, ry, rz);
    modelGroup.scale.set(sx, sy, sz);

    modelGroup.name = bld.buildingInstanceId;
    modelGroup.userData.isBuilding = true;
    modelGroup.userData.buildingConfig = bld;
    modelGroup.userData.buildingInstanceId = bld.buildingInstanceId;

    group.add(modelGroup);

    // Compute initial world anchor
    const localAnchor = new THREE.Vector3(...bld.interaction.anchorLocal);
    const worldAnchor = modelGroup.localToWorld(localAnchor.clone());

    // Register all meshes for raycasting
    modelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.isBuilding = true;
        child.userData.buildingConfig = bld;
        child.userData.buildingInstanceId = bld.buildingInstanceId;
        interactiveMeshes.push(child);
      }
    });

    // Add 3D Overhead Badge for functional buildings
    let badgeMesh: THREE.Mesh | undefined;
    if (bld.hasFunction) {
      let emoji = '🏛️';
      if (bld.landmarkId === 'herbal_garden') emoji = '🌿';
      else if (bld.landmarkId === 'cloud_therapy') emoji = '🌊';
      else if (bld.landmarkId === 'knowledge_library') emoji = '📖';
      else if (bld.landmarkId === 'journey_house') emoji = '🏰';
      else if (bld.landmarkId === 'village_square') emoji = '⛲';

      badgeMesh = createBuildingBadge(bld.displayName.vi, emoji);
      // Position badge floating above the building
      badgeMesh.position.set(0, 4.2 / (sy || 1), 0);
      modelGroup.add(badgeMesh);
    }

    // Register NavMesh box collider
    const bldBox = new THREE.Box3().setFromObject(modelGroup);
    // Expand obstacle buffer slightly for clearance
    bldBox.expandByScalar(0.4);
    colliders.push({ box: bldBox, name: bld.buildingInstanceId });

    buildings.push({
      config: bld,
      meshGroup: modelGroup,
      badgeMesh,
      worldAnchor,
    });
  }

  // 3. Load Environment Objects (trees, rocks, river pieces, fences, etc.)
  for (const env of manifest.environmentObjects) {
    let modelGroup: THREE.Group | null = null;
    let modelPath = env.assetUrl;

    if (!modelPath && env.templateType) {
      if (env.templateType === 'treeOak') modelPath = '/assets/medieval_village/GLTF/Nature/SM_Tree_Oak.gltf';
      else if (env.templateType === 'rock') modelPath = '/assets/medieval_village/GLTF/Nature/SM_Rock_Boulder.gltf';
      else if (env.templateType === 'bush') modelPath = '/assets/medieval_village/GLTF/Nature/SM_Bush.gltf';
      else if (env.templateType === 'fence') modelPath = '/assets/medieval_village/GLTF/Props/SM_Fence_Picket.gltf';
      else if (env.templateType === 'lampPost') modelPath = '/assets/medieval_village/GLTF/Lighting/SM_Lamp_Post.gltf';
      else if (env.templateType === 'cart') modelPath = '/assets/medieval_village/GLTF/Carts/SM_Hand_Cart.gltf';
      else if (env.templateType === 'barrel') modelPath = '/assets/medieval_village/GLTF/Props/SM_Barrel.gltf';
      else if (env.templateType === 'crate') modelPath = '/assets/medieval_village/GLTF/Props/SM_Crate.gltf';
    }

    if (modelPath) {
      try {
        modelGroup = await loadModel(modelPath);
      } catch (err) {
        console.warn(`[WorldManifest] Skipped env object ${env.name} (${modelPath}):`, err);
      }
    }

    if (!modelGroup) continue;

    const [px, py, pz] = env.transform.position;
    const [rx, ry, rz] = env.transform.rotation;
    const [sx, sy, sz] = env.transform.scale;

    modelGroup.position.set(px, py, pz);
    modelGroup.rotation.set(rx, ry, rz);
    modelGroup.scale.set(sx, sy, sz);
    modelGroup.name = env.name;

    group.add(modelGroup);

    // If it's a solid obstacle (large rock or thick tree), add collider
    if (env.type === 'rock' || env.name.toLowerCase().includes('boulder') || env.name.toLowerCase().includes('mountain')) {
      const box = new THREE.Box3().setFromObject(modelGroup);
      colliders.push({ box, name: env.name });
    }
  }

  console.log(
    `[WorldManifest] Loaded successfully: ${buildings.length} buildings, ${manifest.environmentObjects.length} env objects, ${colliders.length} colliders.`
  );

  return {
    group,
    buildings,
    interactiveMeshes,
    colliders,
    manifest,
  };
}
