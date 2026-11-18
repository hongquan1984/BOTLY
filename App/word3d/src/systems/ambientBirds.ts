import * as THREE from 'three';

export interface AmbientBirdsResult {
  group: THREE.Group;
  update: (delta: number, time: number) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
}

interface BirdInstance {
  root: THREE.Group;
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
  groupType: 'near' | 'far';
  baseRadiusX: number;
  baseRadiusZ: number;
  centerPos: THREE.Vector3;
  flightSpeed: number;
  flapFrequency: number;
  phase: number;
  elevationBase: number;
  elevationAmp: number;
}

export function createAmbientBirds(): AmbientBirdsResult {
  const group = new THREE.Group();
  group.name = 'AmbientCozyBirds';

  // Shared lightweight stylized bird geometry & material (Zero shadow overhead)
  const birdMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.8,
    metalness: 0.05,
    flatShading: true,
  });

  const beakMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' }); // warm gold beak

  // 1. Bird Body: aerodynamic low-poly tapered shape
  const bodyGeo = new THREE.ConeGeometry(0.12, 0.45, 5);
  bodyGeo.rotateX(Math.PI / 2); // point forward along +Z

  // 2. Bird Beak
  const beakGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
  beakGeo.rotateX(Math.PI / 2);

  // 3. Wing geometry (simple lightweight tapered quad/tri prism)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.32, -0.05);
  wingShape.lineTo(0.24, 0.18);
  wingShape.lineTo(0, 0.12);
  wingShape.closePath();

  const wingGeo = new THREE.ShapeGeometry(wingShape);

  function createBirdMesh(): { root: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh } {
    const birdRoot = new THREE.Group();

    // Body
    const body = new THREE.Mesh(bodyGeo, birdMat);
    body.scale.set(1.0, 0.7, 1.0);
    birdRoot.add(body);

    // Beak
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, -0.01, 0.28);
    birdRoot.add(beak);

    // Left Wing
    const wingL = new THREE.Mesh(wingGeo, birdMat);
    wingL.position.set(0.08, 0.04, 0.02);
    wingL.rotation.x = Math.PI / 2;
    birdRoot.add(wingL);

    // Right Wing
    const wingR = new THREE.Mesh(wingGeo, birdMat);
    wingR.position.set(-0.08, 0.04, 0.02);
    wingR.rotation.x = Math.PI / 2;
    wingR.rotation.y = Math.PI; // mirrored
    birdRoot.add(wingR);

    // Subtle scale for miniature cozy diorama aesthetic
    birdRoot.scale.setScalar(0.9);

    return { root: birdRoot, wingL, wingR };
  }

  const birds: BirdInstance[] = [];

  // Group A: Near Flock (3 birds circling roofs, trees and waterfall edge)
  const nearConfigs = [
    {
      center: new THREE.Vector3(1.5, 0, 0),
      radiusX: 9.5,
      radiusZ: 10.5,
      speed: 0.38,
      flapFreq: 12.0,
      phase: 0.0,
      yBase: 4.8,
      yAmp: 1.2,
    },
    {
      center: new THREE.Vector3(-1.0, 0, 1.5),
      radiusX: 11.0,
      radiusZ: 8.5,
      speed: 0.34,
      flapFreq: 13.5,
      phase: 2.1,
      yBase: 5.5,
      yAmp: 1.4,
    },
    {
      center: new THREE.Vector3(4.5, 0, 2.5), // swoops over waterfall canyon and pond
      radiusX: 8.0,
      radiusZ: 9.0,
      speed: 0.42,
      flapFreq: 11.5,
      phase: 4.2,
      yBase: 4.2,
      yAmp: 1.0,
    },
  ];

  nearConfigs.forEach((cfg) => {
    const meshPack = createBirdMesh();
    group.add(meshPack.root);
    birds.push({
      ...meshPack,
      groupType: 'near',
      baseRadiusX: cfg.radiusX,
      baseRadiusZ: cfg.radiusZ,
      centerPos: cfg.center,
      flightSpeed: cfg.speed,
      flapFrequency: cfg.flapFreq,
      phase: cfg.phase,
      elevationBase: cfg.yBase,
      elevationAmp: cfg.yAmp,
    });
  });

  // Group B: Far Flock (3 birds soaring gracefully over the island perimeter and cloud sea)
  const farConfigs = [
    {
      center: new THREE.Vector3(0, 0, 0),
      radiusX: 22.0,
      radiusZ: 21.0,
      speed: 0.22,
      flapFreq: 9.5,
      phase: 1.0,
      yBase: 2.8,
      yAmp: 2.2,
    },
    {
      center: new THREE.Vector3(2.0, 0, -2.0),
      radiusX: 25.0,
      radiusZ: 23.5,
      speed: 0.19,
      flapFreq: 8.5,
      phase: 3.5,
      yBase: 1.5,
      yAmp: 2.5,
    },
    {
      center: new THREE.Vector3(-3.0, 0, 2.0),
      radiusX: 20.0,
      radiusZ: 24.0,
      speed: 0.25,
      flapFreq: 10.0,
      phase: 5.2,
      yBase: 3.5,
      yAmp: 1.8,
    },
  ];

  farConfigs.forEach((cfg) => {
    const meshPack = createBirdMesh();
    group.add(meshPack.root);
    birds.push({
      ...meshPack,
      groupType: 'far',
      baseRadiusX: cfg.radiusX,
      baseRadiusZ: cfg.radiusZ,
      centerPos: cfg.center,
      flightSpeed: cfg.speed,
      flapFrequency: cfg.flapFreq,
      phase: cfg.phase,
      elevationBase: cfg.yBase,
      elevationAmp: cfg.yAmp,
    });
  });

  // Track tab visibility to pause animation when hidden
  let isTabVisible = true;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
    });
  }

  return {
    group,
    update: (_delta: number, time: number) => {
      if (!isTabVisible) return;

      birds.forEach((bird) => {
        if (!bird.root.visible) return;

        // Parametric Lissajous curved flight trajectory
        const t = time * bird.flightSpeed + bird.phase;
        const x = bird.centerPos.x + Math.cos(t) * bird.baseRadiusX + Math.sin(t * 2.0) * 1.5;
        const z = bird.centerPos.z + Math.sin(t) * bird.baseRadiusZ + Math.cos(t * 2.0) * 1.2;
        const y = bird.elevationBase + Math.sin(t * 1.5 + bird.phase) * bird.elevationAmp;

        // Tangent / Velocity vector for smooth banking and rotation
        const nextT = t + 0.05;
        const nextX = bird.centerPos.x + Math.cos(nextT) * bird.baseRadiusX + Math.sin(nextT * 2.0) * 1.5;
        const nextZ = bird.centerPos.z + Math.sin(nextT) * bird.baseRadiusZ + Math.cos(nextT * 2.0) * 1.2;
        const nextY = bird.elevationBase + Math.sin(nextT * 1.5 + bird.phase) * bird.elevationAmp;

        const dirX = nextX - x;
        const dirY = nextY - y;
        const dirZ = nextZ - z;

        bird.root.position.set(x, y, z);

        // Yaw: face direction of travel
        const yaw = Math.atan2(dirX, dirZ);
        bird.root.rotation.y = yaw;

        // Pitch: tilt up/down according to climb/dive
        const horizDist = Math.hypot(dirX, dirZ);
        const pitch = -Math.atan2(dirY, horizDist);
        bird.root.rotation.x = pitch;

        // Roll / Banking into the turn
        const bank = Math.sin(t) * 0.35;
        bird.root.rotation.z = -bank;

        // Wing flapping procedural sine wave
        const flap = Math.sin(time * bird.flapFrequency + bird.phase * 4.0);
        bird.wingL.rotation.z = flap * 0.48;
        bird.wingR.rotation.z = -flap * 0.48;
      });
    },
    setQuality: (quality: 'low' | 'medium' | 'high') => {
      if (quality === 'low') {
        // Keep only 2 birds active on low-end devices
        birds.forEach((b, idx) => {
          b.root.visible = idx < 2;
        });
      } else if (quality === 'medium') {
        // 4 birds active on medium
        birds.forEach((b, idx) => {
          b.root.visible = idx < 4;
        });
      } else {
        // All 6 birds active on high
        birds.forEach((b) => {
          b.root.visible = true;
        });
      }
    },
  };
}
