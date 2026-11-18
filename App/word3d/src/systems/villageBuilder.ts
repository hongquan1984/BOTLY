import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ObstacleCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  radius?: number;
  centerX: number;
  centerZ: number;
}

export interface VillageBuildResult {
  group: THREE.Group;
  villageModel: THREE.Group | null;
  colliders: ObstacleCollider[];
  readyPromise: Promise<void>;
  update: (time: number) => void;
}

export function buildVillage(): VillageBuildResult {
  const group = new THREE.Group();
  group.name = 'CastleVillageScene';

  const colliders: ObstacleCollider[] = [];
  const gltfLoader = new GLTFLoader();

  // Authentic BlackSpire Castle Village Scene scale and centering offsets
  // Raw bounding box: width 1.263m, height 0.573m, depth 1.341m, center [-0.088, 0.228, 0.0018], min Y: -0.058
  // With scale 26.0: ~33m diameter diorama, centered at (0, 0), terrain base Y = 0.0, cobblestone paths at Y ~ 1.8
  const scale = 26.0;
  const offsetX = 2.288;
  const offsetY = 1.508;
  const offsetZ = -0.047;

  // Obstacle colliders for castle walls and major building clusters
  // 1. Great Castle Fortress & Citadel Keep (North/East)
  colliders.push({
    id: 'castle-citadel-keep',
    centerX: 0.0,
    centerZ: 10.5,
    minX: -6.5,
    maxX: 6.5,
    minZ: 4.5,
    maxZ: 16.5,
  });

  // 2. Castle Western Ramparts & Watchtowers
  colliders.push({
    id: 'castle-west-rampart',
    centerX: -9.5,
    centerZ: 6.5,
    minX: -13.0,
    maxX: -6.5,
    minZ: 2.0,
    maxZ: 11.0,
  });

  // 3. Castle Eastern Flank Tower
  colliders.push({
    id: 'castle-east-tower',
    centerX: 9.0,
    centerZ: 8.5,
    minX: 6.5,
    maxX: 12.0,
    minZ: 5.0,
    maxZ: 12.5,
  });

  // 4. Village House Cluster West (Near Lumi's House)
  colliders.push({
    id: 'village-house-west-1',
    centerX: -11.5,
    centerZ: -10.5,
    minX: -14.0,
    maxX: -9.0,
    minZ: -13.0,
    maxZ: -8.0,
  });

  // 5. Village House Cluster South-East (Near Herbal Garden)
  colliders.push({
    id: 'village-house-se',
    centerX: 10.5,
    centerZ: -11.0,
    minX: 7.5,
    maxX: 13.5,
    minZ: -14.0,
    maxZ: -8.0,
  });

  // 6. Village Cottage Cluster South
  colliders.push({
    id: 'village-cottages-south',
    centerX: -1.0,
    centerZ: -13.0,
    minX: -4.5,
    maxX: 2.5,
    minZ: -15.5,
    maxZ: -10.5,
  });

  // Warm ambient lantern lights placed in the village
  const squareLight = new THREE.PointLight('#fbbf24', 2.4, 14);
  squareLight.position.set(-1.5, 3.2, -2.5);
  group.add(squareLight);

  const castleLight = new THREE.PointLight('#f59e0b', 2.6, 16);
  castleLight.position.set(0.0, 4.0, 7.0);
  group.add(castleLight);

  const lumisLight = new THREE.PointLight('#fbbf24', 2.0, 10);
  lumisLight.position.set(-8.5, 3.0, -9.5);
  group.add(lumisLight);

  let villageModel: THREE.Group | null = null;

  // Material Upgrade Function: Rich PBR enhancements & draw-call optimization
  function enhanceBlackSpireMaterials(root: THREE.Object3D) {
    let houseIndex = 0;
    let treeIndex = 0;

    // Palette variants for different village cottages (terracotta, amber thatch, rustic cedar, slate)
    const cottageRoofTints = [
      new THREE.Color('#b45309'), // Warm terracotta amber
      new THREE.Color('#9a3412'), // Deep burnt rustic red
      new THREE.Color('#d97706'), // Rich golden cedar
      new THREE.Color('#57534e'), // Weathered pine slate
    ];

    // Tree foliage variants
    const treeFoliageColors = [
      new THREE.Color('#1c4d2e'), // Deep alpine spruce
      new THREE.Color('#28663b'), // Vibrant forest green
      new THREE.Color('#387a4c'), // Highland emerald
    ];

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = (mesh.name || '').toLowerCase();

        // DRAW-CALL OPTIMIZATION: Only significant vertical occluders cast shadows!
        // Ground tiles, roads, and minor meshes receive shadows only.
        const isPrimaryOccluder = 
          meshName.includes('casa') || 
          meshName.includes('mura') || 
          meshName.includes('torre') || 
          meshName.includes('albero') ||
          meshName.includes('roccia') ||
          meshName.includes('group');

        mesh.castShadow = isPrimaryOccluder;
        mesh.receiveShadow = true;

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (let mi = 0; mi < mats.length; mi++) {
          const m = mats[mi];
          if (!m) continue;
          let std = m as THREE.MeshStandardMaterial;
          const name = (std.name || '').toLowerCase();

          // 1. Hide artist's flat shadow decals (Zone_Ombra)
          if (name.includes('ombra')) {
            std.visible = false;
            return;
          }

          // 2. Upgrade Grass Material: Rich lush meadow green
          if (name.includes('erba') || name.includes('grass')) {
            std.color = new THREE.Color('#6eb857');
            std.roughness = 0.82;
            std.metalness = 0.0;
          }
          // 3. Upgrade Roads & Pathways: Crisp medieval cobblestone
          else if (name.includes('terreno') || name.includes('road') || name.includes('path')) {
            std.color = new THREE.Color('#dcd3c7');
            std.roughness = 0.84;
            std.metalness = 0.02;
          }
          // 4. Upgrade Castle Walls & Stone Masonry
          else if (name.includes('mura') || name.includes('roccia') || name.includes('stone') || name.includes('wall') || name.includes('zolla')) {
            std.roughness = 0.86;
            std.metalness = 0.06;
          }
          // 5. Upgrade Timber & Wooden Ramparts
          else if (name.includes('legno') || name.includes('wood') || name.includes('passerella')) {
            std.color = new THREE.Color('#b46022');
            std.roughness = 0.70;
            std.metalness = 0.02;
          }
          // 6. Upgrade Houses & Roofs: Varied warm cottage tones across houses
          else if (name.includes('casa') || name.includes('house') || name.includes('roof') || name.includes('tetto')) {
            // Clone material so different houses have distinct roof/wall tints
            const clonedMat = std.clone();
            const tint = cottageRoofTints[houseIndex % cottageRoofTints.length];
            houseIndex++;
            clonedMat.color = clonedMat.color.clone().lerp(tint, 0.42);
            clonedMat.roughness = 0.74;
            clonedMat.metalness = 0.03;
            if (Array.isArray(mesh.material)) {
              mesh.material[mi] = clonedMat;
            } else {
              mesh.material = clonedMat;
            }
          }
          // 7. Upgrade Windows / Glass: Warm Golden Lantern Glow!
          else if (name.includes('glass') || name.includes('finestra') || name.includes('window')) {
            std.emissive = new THREE.Color('#f59e0b');
            std.emissiveIntensity = 1.35;
            std.roughness = 0.15;
          }
          // 8. Upgrade Tree Foliage: Natural multi-tone mountain pine greens
          else if (name.includes('albero') || name.includes('tree') || name.includes('leaf') || name.includes('foglie')) {
            const treeColor = treeFoliageColors[treeIndex % treeFoliageColors.length];
            treeIndex++;
            std.color = treeColor;
            std.roughness = 0.80;
            std.metalness = 0.02;
          }
        }
      }
    });
  }

  // Add rich hero vegetation & instanced wildflower clumps
  function addHeroVegetation(targetGroup: THREE.Group) {
    // A. 5 Stylized Hero Canopy Trees at focal points
    const heroTreeSpots = [
      { x: -2.4, y: 1.8, z: -1.4, s: 1.15 },  // Village Square crossroads
      { x: -9.2, y: 1.8, z: -9.5, s: 1.25 },  // Lumi's Cottage entrance
      { x: -11.8, y: 1.8, z: -7.5, s: 1.05 }, // Lumi's Garden lane
      { x: 9.2, y: 1.8, z: -6.5, s: 1.20 },   // Eastern Herbal Grove
      { x: -12.8, y: 1.8, z: -2.5, s: 1.10 }, // Western Cliff Overlook
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.8, 7);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: '#653a1a',
      roughness: 0.85,
      metalness: 0.02,
    });

    const canopyGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: '#2e7542',
      roughness: 0.75,
      metalness: 0.02,
      flatShading: true,
    });

    heroTreeSpots.forEach((spot) => {
      const tree = new THREE.Group();
      tree.position.set(spot.x, spot.y, spot.z);
      tree.scale.setScalar(spot.s);

      // Trunk
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Cloud-like layered canopy
      const puffs = [
        { x: 0, y: 2.8, z: 0, s: 1.1 },
        { x: 0.45, y: 3.2, z: 0.3, s: 0.85 },
        { x: -0.4, y: 3.1, z: -0.35, s: 0.9 },
        { x: 0.2, y: 3.7, z: -0.2, s: 0.8 },
      ];

      puffs.forEach((p) => {
        const puff = new THREE.Mesh(canopyGeo, canopyMat);
        puff.position.set(p.x, p.y, p.z);
        puff.scale.setScalar(p.s);
        puff.castShadow = true;
        puff.receiveShadow = true;
        tree.add(puff);
      });

      targetGroup.add(tree);
    });

    // B. Instanced Wildflower Clumps (Lavender & Gold) along paths (1 draw call)
    const flowerCount = 55;
    const flowerGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: '#facc15', // Vibrant golden buttercups / lavender blossoms
      roughness: 0.6,
      metalness: 0.05,
    });
    const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    flowerInst.receiveShadow = true;

    // C. Instanced Garden Bushes (1 draw call)
    const bushCount = 40;
    const bushGeo = new THREE.DodecahedronGeometry(0.48, 1);
    const bushMat = new THREE.MeshStandardMaterial({
      color: '#347746',
      roughness: 0.82,
      metalness: 0.02,
      flatShading: true,
    });
    const bushInst = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
    bushInst.castShadow = true;
    bushInst.receiveShadow = true;

    const dummy = new THREE.Object3D();

    // Place flowers around paths, cottages, and gardens
    const flowerPoints = [
      // Lumi's house surroundings
      [-8.0, 1.82, -8.2], [-8.4, 1.82, -9.0], [-7.5, 1.82, -7.8], [-9.5, 1.82, -10.2], [-10.2, 1.82, -8.8],
      [-10.8, 1.82, -9.2], [-7.2, 1.82, -8.8], [-8.8, 1.82, -7.4], [-9.8, 1.82, -7.0], [-11.0, 1.82, -7.8],
      // Herbal Grove hillside
      [7.8, 1.82, -6.2], [8.2, 1.82, -7.5], [9.0, 1.82, -8.0], [9.8, 1.82, -6.8], [10.5, 1.82, -7.2],
      [8.5, 1.82, -5.8], [7.2, 1.82, -7.0], [9.5, 1.82, -8.8], [10.2, 1.82, -6.0], [11.0, 1.82, -7.5],
      // Village Square crossroads
      [-2.0, 1.82, -1.8], [-1.2, 1.82, -2.8], [-0.5, 1.82, -1.5], [-2.5, 1.82, -0.8], [-0.8, 1.82, -0.4],
      [-1.8, 1.82, -3.2], [-2.8, 1.82, -2.0], [-0.2, 1.82, -2.2], [-1.5, 1.82, -0.2], [-3.0, 1.82, -1.2],
      // Castle path & ramparts entrance
      [-1.2, 1.82, 3.5], [1.2, 1.82, 3.8], [-0.5, 1.82, 4.5], [0.8, 1.82, 5.0], [-2.0, 1.82, 2.8],
      [1.8, 1.82, 2.5], [-1.8, 1.82, 4.2], [1.5, 1.82, 4.8], [-0.2, 1.82, 2.0], [0.5, 1.82, 1.8],
      // Western Overlook terrace
      [-11.2, 1.82, -3.8], [-12.0, 1.82, -4.5], [-10.8, 1.82, -2.8], [-12.5, 1.82, -3.2], [-11.8, 1.82, -1.8],
      [-10.2, 1.82, -3.5], [-12.8, 1.82, -4.0], [-13.2, 1.82, -2.8], [-11.5, 1.82, -5.0], [-10.5, 1.82, -2.2],
    ];

    for (let f = 0; f < flowerCount; f++) {
      const pt = flowerPoints[f % flowerPoints.length];
      const jx = (Math.sin(f * 2.3) - 0.5) * 0.8;
      const jz = (Math.cos(f * 1.9) - 0.5) * 0.8;
      dummy.position.set(pt[0] + jx, pt[1], pt[2] + jz);
      const s = 0.7 + (f % 4) * 0.2;
      dummy.scale.set(s, s * 1.2, s);
      dummy.rotation.y = f * 1.2;
      dummy.updateMatrix();
      flowerInst.setMatrixAt(f, dummy.matrix);

      // Flower color variation (Golden yellow / Soft lavender / Rose)
      const col = (f % 2 === 0) ? new THREE.Color('#facc15') : new THREE.Color('#c084fc');
      flowerInst.setColorAt(f, col);
    }
    flowerInst.instanceMatrix.needsUpdate = true;
    if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
    targetGroup.add(flowerInst);

    // Place garden bushes along stone cottage edges and rock ledges
    const bushPoints = [
      [-11.5, 1.82, -10.0], [-10.5, 1.82, -11.5], [-8.0, 1.82, -10.5], [-7.2, 1.82, -9.5],
      [7.5, 1.82, -8.5], [8.8, 1.82, -9.8], [11.0, 1.82, -9.0], [10.2, 1.82, -10.5],
      [-3.5, 1.82, -1.2], [-3.8, 1.82, -2.5], [-0.5, 1.82, -3.5], [0.5, 1.82, -2.8],
      [-2.5, 1.82, 3.0], [2.2, 1.82, 3.2], [-2.8, 1.82, 4.5], [2.5, 1.82, 4.8],
      [-12.0, 1.82, -5.5], [-13.0, 1.82, -3.8], [-10.5, 1.82, -4.8], [-9.8, 1.82, -2.5],
    ];

    for (let b = 0; b < bushCount; b++) {
      const pt = bushPoints[b % bushPoints.length];
      const jx = (Math.sin(b * 3.1) - 0.5) * 1.0;
      const jz = (Math.cos(b * 2.7) - 0.5) * 1.0;
      dummy.position.set(pt[0] + jx, pt[1] + 0.2, pt[2] + jz);
      const s = 0.8 + (b % 3) * 0.35;
      dummy.scale.set(s * 1.2, s * 0.8, s * 1.1);
      dummy.rotation.y = b * 0.8;
      dummy.updateMatrix();
      bushInst.setMatrixAt(b, dummy.matrix);
    }
    bushInst.instanceMatrix.needsUpdate = true;
    targetGroup.add(bushInst);
  }

  // Load the authentic BlackSpire Castle Village Scene
  const readyPromise = new Promise<void>((resolve, reject) => {
    gltfLoader.load(
      '/assets/world/optimized/castle_village_scene.glb',
      (gltf) => {
        villageModel = gltf.scene;
        villageModel.name = 'BlackSpire_CastleVillage';

        // Apply calibrated scale and positioning
        villageModel.scale.setScalar(scale);
        villageModel.position.set(offsetX, offsetY, offsetZ);

        // Apply materials upgrade & draw-call optimization
        enhanceBlackSpireMaterials(villageModel);

        group.add(villageModel);

        // Add rich hero vegetation & instanced wildflower clumps
        addHeroVegetation(group);

        console.log('Original Castle Village Scene successfully remastered & enhanced.');
        resolve();
      },
      (xhr) => {
        // Progress tracking if needed
      },
      (err) => {
        console.error('Failed to load castle_village_scene.glb:', err);
        reject(err);
      }
    );
  });

  return {
    group,
    villageModel,
    colliders,
    readyPromise,
    update: (time: number) => {
      // Gentle lantern breathing / flicker in square
      squareLight.intensity = 2.2 + Math.sin(time * 6.0) * 0.25;
      castleLight.intensity = 2.4 + Math.cos(time * 5.0) * 0.2;
    },
  };
}
