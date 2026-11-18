import * as THREE from 'three';

export interface DistantSkyArchipelagoResult {
  group: THREE.Group;
  update: (time: number) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
}

interface FloatingIslandInstance {
  group: THREE.Group;
  baseY: number;
  bobSpeed: number;
  bobAmp: number;
  phase: number;
}

/**
 * Creates a vast floating sky archipelago surrounding the main village island.
 * Features 3 distinct compositional depth layers:
 * 1. Medium-distance islands with iconic landmarks (Shrine, Observatory, Windmill)
 * 2. Far floating islands with distinct silhouettes (Crystals, Castle ruins, Terraces)
 * 3. Very distant horizon silhouettes in atmospheric mist
 */
export function createDistantSkyArchipelago(): DistantSkyArchipelagoResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'DistantSkyArchipelago';

  // Shared optimized materials across all background islands (zero texture bloat, 100% mobile safe)
  const rockUnderbellyMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.88,
    metalness: 0.04,
    flatShading: true,
  });

  const islandGrassMat = new THREE.MeshStandardMaterial({
    color: '#4d7c0f', // Lush diorama green
    roughness: 0.92,
    metalness: 0.0,
    flatShading: true,
  });

  const mossStoneMat = new THREE.MeshStandardMaterial({
    color: '#365314',
    roughness: 0.9,
    metalness: 0.02,
    flatShading: true,
  });

  const woodTimberMat = new THREE.MeshStandardMaterial({
    color: '#78350f',
    roughness: 0.78,
    metalness: 0.02,
    flatShading: true,
  });

  const roofTileMat = new THREE.MeshStandardMaterial({
    color: '#b91c1c', // Vermilion / terracotta roof
    roughness: 0.72,
    metalness: 0.05,
    flatShading: true,
  });

  const verdigrisCopperMat = new THREE.MeshStandardMaterial({
    color: '#0d9488', // Observatory teal copper dome
    roughness: 0.55,
    metalness: 0.35,
    flatShading: true,
  });

  const goldMagicMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    roughness: 0.25,
    metalness: 0.8,
    emissive: new THREE.Color('#d97706'),
    emissiveIntensity: 0.45,
  });

  const crystalCyanMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    roughness: 0.15,
    metalness: 0.4,
    transparent: true,
    opacity: 0.88,
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.35,
  });

  const cloudPuffMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8,
  });

  // Hazy distant atmospheric material
  const distantHazeMat = new THREE.MeshBasicMaterial({
    color: '#93c5fd',
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const animatedIslands: FloatingIslandInstance[] = [];
  let windmillFanMesh: THREE.Group | null = null;
  let observatoryOrbitalRing: THREE.Mesh | null = null;
  const waterfallMeshes: { mesh: THREE.Mesh; speed: number }[] = [];

  // Helper: Builds a stylized low-poly floating island base
  function createFloatingBase(radius: number, depth: number, segments = 7): THREE.Group {
    const baseGroup = new THREE.Group();

    // 1. Inverted rocky keel (conical faceted underbelly)
    const keelGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.15, depth, segments);
    keelGeo.translate(0, -depth * 0.5, 0);
    const keel = new THREE.Mesh(keelGeo, rockUnderbellyMat);
    keel.castShadow = false;
    keel.receiveShadow = false;
    baseGroup.add(keel);

    // 2. Grassy upper plateau
    const grassGeo = new THREE.CylinderGeometry(radius, radius * 0.95, 0.45, segments);
    const grass = new THREE.Mesh(grassGeo, islandGrassMat);
    grass.castShadow = false;
    grass.receiveShadow = false;
    baseGroup.add(grass);

    return baseGroup;
  }

  // =========================================================================
  // LAYER 1: MEDIUM-DISTANCE FLOATING WORLDS (2-3 Iconic Diorama Islands)
  // Distance: R ~ 45 - 55m. Full landmark silhouettes visible from village
  // =========================================================================
  const mediumLayerGroup = new THREE.Group();
  mediumLayerGroup.name = 'MediumDistanceIslands';

  // -------------------------------------------------------------------------
  // 1A. SACRED SAKURA SHRINE & HEALING SPRING ISLAND (South-West: X = -38, Z = 26)
  // -------------------------------------------------------------------------
  const shrineIsland = new THREE.Group();
  const shrineBase = createFloatingBase(7.5, 9.0, 8);
  shrineIsland.add(shrineBase);

  // Shrine Pavilion
  const shrinePillars = new THREE.Group();
  const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.8, 5);
  [
    [-1.1, -1.1],
    [1.1, -1.1],
    [-1.1, 1.1],
    [1.1, 1.1],
  ].forEach(([px, pz]) => {
    const pil = new THREE.Mesh(pillarGeo, woodTimberMat);
    pil.position.set(px, 0.9, pz);
    shrinePillars.add(pil);
  });
  // Curved roof
  const roofGeo = new THREE.ConeGeometry(2.2, 1.1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofTileMat);
  roof.position.y = 2.2;
  shrinePillars.add(roof);
  shrineIsland.add(shrinePillars);

  // Flowering Pink Sakura Tree
  const sakuraGroup = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.8, 5);
  const trunk = new THREE.Mesh(trunkGeo, woodTimberMat);
  trunk.position.set(2.8, 1.4, -1.5);
  trunk.rotation.z = -0.15;
  sakuraGroup.add(trunk);

  const sakuraMat = new THREE.MeshStandardMaterial({
    color: '#f472b6', // Lovely vibrant blossom pink
    roughness: 0.85,
    flatShading: true,
  });
  const crownGeo = new THREE.DodecahedronGeometry(1.6, 1);
  const crown = new THREE.Mesh(crownGeo, sakuraMat);
  crown.position.set(3.2, 3.2, -1.5);
  crown.scale.set(1.4, 1.1, 1.3);
  sakuraGroup.add(crown);
  shrineIsland.add(sakuraGroup);

  // Tiny waterfall spilling off the shrine island into the clouds
  const shrineWfGeo = new THREE.PlaneGeometry(1.2, 6.0, 4, 8);
  const shrineWfMat = new THREE.MeshStandardMaterial({
    color: '#e0f2fe',
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shrineWf = new THREE.Mesh(shrineWfGeo, shrineWfMat);
  shrineWf.position.set(-5.5, -2.8, 1.2);
  shrineWf.rotation.y = 0.6;
  shrineIsland.add(shrineWf);
  waterfallMeshes.push({ mesh: shrineWf, speed: 2.2 });

  shrineIsland.position.set(-38, 1.2, 26);
  mediumLayerGroup.add(shrineIsland);
  animatedIslands.push({ group: shrineIsland, baseY: 1.2, bobSpeed: 0.42, bobAmp: 0.28, phase: 0.0 });

  // -------------------------------------------------------------------------
  // 1B. ANCIENT CELESTIAL OBSERVATORY & SCHOLAR'S SPIRE (North-East: X = 36, Z = -32)
  // -------------------------------------------------------------------------
  const observatoryIsland = new THREE.Group();
  const obsBase = createFloatingBase(8.0, 11.0, 8);
  observatoryIsland.add(obsBase);

  // Slender stone spire tower
  const towerGeo = new THREE.CylinderGeometry(1.8, 2.2, 6.5, 7);
  const tower = new THREE.Mesh(towerGeo, rockUnderbellyMat);
  tower.position.y = 3.25;
  observatoryIsland.add(tower);

  // Verdigris Copper Observatory Dome
  const domeGeo = new THREE.SphereGeometry(2.0, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const dome = new THREE.Mesh(domeGeo, verdigrisCopperMat);
  dome.position.y = 6.4;
  observatoryIsland.add(dome);

  // Revolving magical golden orbital ring around the dome
  const ringGeo = new THREE.TorusGeometry(2.7, 0.14, 6, 24);
  observatoryOrbitalRing = new THREE.Mesh(ringGeo, goldMagicMat);
  observatoryOrbitalRing.position.y = 7.5;
  observatoryIsland.add(observatoryOrbitalRing);

  // Small crystalline beacon at dome summit
  const beaconGeo = new THREE.OctahedronGeometry(0.65, 0);
  const beacon = new THREE.Mesh(beaconGeo, crystalCyanMat);
  beacon.position.y = 8.6;
  observatoryIsland.add(beacon);

  observatoryIsland.position.set(36, 5.8, -32);
  mediumLayerGroup.add(observatoryIsland);
  animatedIslands.push({ group: observatoryIsland, baseY: 5.8, bobSpeed: 0.38, bobAmp: 0.32, phase: 1.8 });

  // -------------------------------------------------------------------------
  // 1C. VERDANT PINE GROVE & WINDMILL ISLE (South-East: X = 32, Z = 40)
  // -------------------------------------------------------------------------
  const windmillIsland = new THREE.Group();
  const wmBase = createFloatingBase(7.0, 8.5, 8);
  windmillIsland.add(wmBase);

  // Windmill Tower (tapered wooden cylinder)
  const wmTowerGeo = new THREE.CylinderGeometry(0.9, 1.4, 4.0, 6);
  const wmTower = new THREE.Mesh(wmTowerGeo, woodTimberMat);
  wmTower.position.set(-1.8, 2.0, -0.8);
  windmillIsland.add(wmTower);

  // Windmill Cone Roof
  const wmRoofGeo = new THREE.ConeGeometry(1.2, 1.2, 6);
  const wmRoof = new THREE.Mesh(wmRoofGeo, roofTileMat);
  wmRoof.position.set(-1.8, 4.5, -0.8);
  windmillIsland.add(wmRoof);

  // Rotating 4-blade propeller fan
  windmillFanMesh = new THREE.Group();
  windmillFanMesh.position.set(-1.8, 3.8, 0.2);
  const bladeGeo = new THREE.BoxGeometry(0.2, 2.4, 0.05);
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(bladeGeo, woodTimberMat);
    blade.rotation.z = (b * Math.PI) / 2;
    blade.position.set(Math.cos((b * Math.PI) / 2) * 1.1, Math.sin((b * Math.PI) / 2) * 1.1, 0);
    windmillFanMesh.add(blade);
  }
  windmillIsland.add(windmillFanMesh);

  // Alpine Spruce Trees cluster
  const spruceMat = new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.8, flatShading: true });
  [
    [1.8, 0.8, 1.2],
    [2.8, -1.2, 1.0],
    [1.2, -2.4, 0.85],
  ].forEach(([sx, sz, scale]) => {
    const tree = new THREE.Group();
    for (let c = 0; c < 3; c++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((0.9 - c * 0.2) * scale, 1.1 * scale, 5), spruceMat);
      cone.position.y = (0.6 + c * 0.6) * scale;
      tree.add(cone);
    }
    tree.position.set(sx, 0.2, sz);
    windmillIsland.add(tree);
  });

  windmillIsland.position.set(32, -2.2, 40);
  mediumLayerGroup.add(windmillIsland);
  animatedIslands.push({ group: windmillIsland, baseY: -2.2, bobSpeed: 0.45, bobAmp: 0.25, phase: 3.2 });

  rootGroup.add(mediumLayerGroup);

  // =========================================================================
  // LAYER 2: FAR FLOATING ISLANDS (6 Distinct Silhouette Islands)
  // Distance: R ~ 75 - 110m.
  // =========================================================================
  const farLayerGroup = new THREE.Group();
  farLayerGroup.name = 'FarFloatingIslands';

  const farIslandConfigs = [
    // 2A. Twin Peaks Mountain Isle (WNW)
    {
      name: 'TwinPeaksIsle',
      pos: [-82, 8.5, -35],
      radius: 9.5,
      depth: 13.0,
      customDressing: (parent: THREE.Group) => {
        const peakMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.85, flatShading: true });
        const peak1 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7.5, 6), peakMat);
        peak1.position.set(-1.8, 3.8, 0);
        const peak2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5.5, 6), peakMat);
        peak2.position.set(2.0, 2.8, -1.2);
        parent.add(peak1, peak2);
      },
    },
    // 2B. Glowing Crystal Monolith Isle (SE)
    {
      name: 'CrystalMonolithIsle',
      pos: [72, 3.5, 65],
      radius: 8.5,
      depth: 11.0,
      customDressing: (parent: THREE.Group) => {
        for (let cr = 0; cr < 3; cr++) {
          const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.2 + cr * 0.8, 5), crystalCyanMat);
          crystal.position.set(Math.cos(cr * 2.1) * 2.0, 2.2 + cr * 0.4, Math.sin(cr * 2.1) * 2.0);
          crystal.rotation.set(0.15, cr * 1.2, -0.1);
          parent.add(crystal);
        }
      },
    },
    // 2C. Misty Cloud-Engulfed Isle (SW)
    {
      name: 'MistyCloudIsle',
      pos: [-58, -5.5, 75],
      radius: 8.0,
      depth: 10.0,
      customDressing: (parent: THREE.Group) => {
        // Enveloped in fluffy cloud puffs
        for (let cp = 0; cp < 4; cp++) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), cloudPuffMat);
          puff.position.set(Math.cos(cp * 1.6) * 3.5, 1.2 + Math.sin(cp) * 0.8, Math.sin(cp * 1.6) * 3.5);
          puff.scale.set(1.4, 0.7, 1.3);
          parent.add(puff);
        }
      },
    },
    // 2D. Floating Ruined Castle Citadel (North)
    {
      name: 'CitadelRuinIsle',
      pos: [-20, 12.0, -92],
      radius: 10.0,
      depth: 14.0,
      customDressing: (parent: THREE.Group) => {
        const ruinMat = new THREE.MeshStandardMaterial({ color: '#52525b', roughness: 0.85, flatShading: true });
        const keep = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.5, 4.0), ruinMat);
        keep.position.y = 2.8;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 7.5, 6), ruinMat);
        turret.position.set(2.8, 3.8, 2.0);
        parent.add(keep, turret);
      },
    },
    // 2E. Stepped Terraced Sky Garden (ENE)
    {
      name: 'TerracedGardenIsle',
      pos: [85, -2.0, -48],
      radius: 9.0,
      depth: 11.5,
      customDressing: (parent: THREE.Group) => {
        // 2 concentric elevated terraces
        const t1 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.0, 1.2, 7), islandGrassMat);
        t1.position.y = 0.8;
        const t2 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.5, 1.2, 7), islandGrassMat);
        t2.position.y = 1.9;
        parent.add(t1, t2);
      },
    },
    // 2F. Golden Sun Mesa (East)
    {
      name: 'GoldenMesaIsle',
      pos: [95, 6.5, 18],
      radius: 8.5,
      depth: 12.0,
      customDressing: (parent: THREE.Group) => {
        const mesaMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.88, flatShading: true });
        const plateau = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 6.5, 3.5, 6), mesaMat);
        plateau.position.y = 1.75;
        parent.add(plateau);
      },
    },
  ];

  farIslandConfigs.forEach((cfg, idx) => {
    const farIsland = new THREE.Group();
    farIsland.name = cfg.name;
    const base = createFloatingBase(cfg.radius, cfg.depth, 7);
    farIsland.add(base);
    cfg.customDressing(farIsland);

    farIsland.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    farLayerGroup.add(farIsland);

    animatedIslands.push({
      group: farIsland,
      baseY: cfg.pos[1],
      bobSpeed: 0.28 + (idx % 3) * 0.05,
      bobAmp: 0.35,
      phase: idx * 1.1,
    });
  });

  rootGroup.add(farLayerGroup);

  // =========================================================================
  // LAYER 3: VERY DISTANT HORIZON SILHOUETTES & SKY PEAKS
  // Distance: R ~ 150 - 210m. Soft atmospheric misty shapes encircling the world
  // =========================================================================
  const horizonLayerGroup = new THREE.Group();
  horizonLayerGroup.name = 'HorizonSkySilhouettes';

  const silhouetteCount = 10;
  for (let s = 0; s < silhouetteCount; s++) {
    const angle = (s / silhouetteCount) * Math.PI * 2 + Math.sin(s * 1.8) * 0.2;
    const dist = 160 + (s % 4) * 15;
    const height = -6 + Math.sin(s * 1.4) * 14;

    const silGroup = new THREE.Group();
    const w = 18 + (s % 3) * 8;
    const h = 12 + (s % 4) * 6;

    // Distant soft floating island silhouette
    const silMesh = new THREE.Mesh(new THREE.ConeGeometry(w * 0.5, h, 6), distantHazeMat);
    silMesh.rotation.x = Math.PI; // Inverted cone
    silGroup.add(silMesh);

    // Flat cap on top
    const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.5, 1.5, 6), distantHazeMat);
    capMesh.position.y = h * 0.5;
    silGroup.add(capMesh);

    silGroup.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
    horizonLayerGroup.add(silGroup);
  }

  rootGroup.add(horizonLayerGroup);

  return {
    group: rootGroup,
    update: (time: number) => {
      // 1. Subtle, slow undulating floating movement on individual islands
      animatedIslands.forEach((isle) => {
        isle.group.position.y = isle.baseY + Math.sin(time * isle.bobSpeed + isle.phase) * isle.bobAmp;
      });

      // 2. Rotate Windmill Propeller in the sky breeze
      if (windmillFanMesh) {
        windmillFanMesh.rotation.z = time * 0.85;
      }

      // 3. Rotate Observatory Magical Orbital Ring
      if (observatoryOrbitalRing) {
        observatoryOrbitalRing.rotation.x = time * 0.5;
        observatoryOrbitalRing.rotation.y = time * 0.75;
      }

      // 4. Scroll tiny distant waterfall textures
      waterfallMeshes.forEach((wf, i) => {
        const mat = wf.mesh.material as THREE.MeshStandardMaterial;
        if (mat.map) {
          mat.map.offset.y = -(time * wf.speed) % 1;
        }
        wf.mesh.position.y = -2.8 + Math.sin(time * 2.5 + i) * 0.03;
      });
    },
    setQuality: (quality: 'low' | 'medium' | 'high') => {
      if (quality === 'low') {
        horizonLayerGroup.visible = false;
        // On LOW, show only 3 medium islands and 2 far islands
        farLayerGroup.children.forEach((c, idx) => {
          c.visible = idx < 2;
        });
      } else if (quality === 'medium') {
        horizonLayerGroup.visible = true;
        farLayerGroup.children.forEach((c) => {
          c.visible = true;
        });
      } else {
        // High
        horizonLayerGroup.visible = true;
        mediumLayerGroup.visible = true;
        farLayerGroup.children.forEach((c) => {
          c.visible = true;
        });
      }
    },
  };
}
