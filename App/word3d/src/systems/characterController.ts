import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IslandNavMesh } from './navigationMesh';

export interface CharacterControllerResult {
  group: THREE.Group;
  markerMesh: THREE.Mesh;
  readyPromise: Promise<void>;
  moveTo: (targetX: number, targetZ: number, onArrival?: () => void) => boolean;
  cancelMove: () => void;
  getPosition: () => THREE.Vector3;
  update: (delta: number) => void;
  setNavMesh: (newNavMesh: IslandNavMesh) => void;
  isMoving: boolean;
}

export function createCharacterController(
  scene: THREE.Scene,
  navMesh: IslandNavMesh,
  onLocationReached?: (locationId: string) => void
): CharacterControllerResult {
  const group = new THREE.Group();
  group.name = 'PlayerCharacter';

  let currentNavMesh = navMesh;

  // Starting location: Central Village Crossroads (x: -1.5, y: 1.8, z: -2.5)
  group.position.set(-1.5, 1.8, -2.5);

  let mixer: THREE.AnimationMixer | null = null;
  const actions: { [name: string]: THREE.AnimationAction } = {};
  let currentAction: THREE.AnimationAction | null = null;

  let waypoints: THREE.Vector3[] = [];
  let currentWaypointIndex = 0;
  let isMoving = false;
  let arrivalCallback: (() => void) | null = null;

  const walkSpeed = 3.8; // meters per second - natural stride pace for chibi adventurer
  const rotateSpeed = 12.0;

  // 1. Subtle Animated Destination Marker
  const markerGeo = new THREE.RingGeometry(0.35, 0.5, 32);
  markerGeo.rotateX(-Math.PI / 2);
  const markerMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const markerMesh = new THREE.Mesh(markerGeo, markerMat);
  markerMesh.position.set(0, 1.84, 0);
  scene.add(markerMesh);

  // 2. Load Real 3D Animated Character: Cute Human Village Adventurer (Rogue.glb)
  const loader = new GLTFLoader();
  const readyPromise = new Promise<void>((resolve) => {
    loader.load(
      '/assets/characters/Rogue.glb',
      (gltf) => {
        const model = gltf.scene;
        // Scale appropriately relative to miniature buildings
        model.scale.setScalar(0.6);
        model.position.y = 0;
        // Rogue faces forward naturally (+Z), rotation.y = 0 aligns forward with motion vectors
        model.rotation.y = 0;

        model.traverse((child) => {
          // Hide combat weapons to make peaceful cute explorer
          if (
            child.name.includes('Knife') ||
            child.name.includes('Crossbow') ||
            child.name.includes('Throwable')
          ) {
            child.visible = false;
          }

          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        group.add(model);
        mixer = new THREE.AnimationMixer(model);

        for (const clip of gltf.animations) {
          const name = clip.name.toLowerCase();
          const action = mixer.clipAction(clip);
          if (name === 'idle' || name === 'unarmed_idle') {
            if (!actions['idle']) actions['idle'] = action;
          } else if (name === 'walking_a' || name === 'walking' || name === 'walk') {
            if (!actions['walk']) actions['walk'] = action;
          } else if (name === 'running_a' || name === 'running' || name === 'run') {
            if (!actions['run']) actions['run'] = action;
          } else if (name.includes('cheer')) {
            actions['cheer'] = action;
          } else if (name.includes('interact')) {
            actions['interact'] = action;
          }
        }

        // Default to idle
        if (actions['idle']) {
          currentAction = actions['idle'];
          currentAction.play();
        } else if (gltf.animations.length > 0) {
          currentAction = mixer.clipAction(gltf.animations[0]);
          currentAction.play();
        }

        resolve();
      },
      undefined,
      (err) => {
        console.warn('Failed to load chibi_adventurer.glb, falling back to humanoid.glb:', err);
        loader.load(
          '/assets/characters/humanoid.glb',
          (gltf) => {
            const model = gltf.scene;
            model.scale.setScalar(0.9);
            model.position.y = 0;
            model.rotation.y = Math.PI;

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            group.add(model);
            mixer = new THREE.AnimationMixer(model);

            for (const clip of gltf.animations) {
              const name = clip.name.toLowerCase();
              const action = mixer.clipAction(clip);
              if (name.includes('idle')) actions['idle'] = action;
              else if (name.includes('walk')) actions['walk'] = action;
              else if (name.includes('run')) actions['run'] = action;
            }

            if (actions['idle']) {
              currentAction = actions['idle'];
              currentAction.play();
            }
            resolve();
          },
          undefined,
          () => {
            // Fallback procedural traveler figure
            const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
            const bodyMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.6 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.7;
            body.castShadow = true;
            group.add(body);
            resolve();
          }
        );
      }
    );
  });

  function fadeToAction(name: string, duration: number = 0.25) {
    const nextAction = actions[name];
    if (!nextAction || nextAction === currentAction) return;

    if (currentAction) {
      currentAction.fadeOut(duration);
    }
    nextAction.reset().fadeIn(duration).play();
    currentAction = nextAction;
  }

  function moveTo(targetX: number, targetZ: number, onArrival?: () => void): boolean {
    const path = currentNavMesh.findPath(group.position.x, group.position.z, targetX, targetZ);
    if (!path || path.length === 0) {
      return false;
    }

    waypoints = path;
    // Skip first waypoint if character is already virtually on it
    if (waypoints.length > 1 && group.position.distanceTo(waypoints[0]) < 0.4) {
      currentWaypointIndex = 1;
    } else {
      currentWaypointIndex = 0;
    }

    arrivalCallback = onArrival || null;
    isMoving = true;

    // Show destination marker at final path waypoint
    const finalPoint = waypoints[waypoints.length - 1];
    markerMesh.position.set(finalPoint.x, 1.84, finalPoint.z);
    markerMat.opacity = 0.85;

    fadeToAction('walk');
    return true;
  }

  function cancelMove() {
    isMoving = false;
    waypoints = [];
    markerMat.opacity = 0.0;
    fadeToAction('idle');
  }

  return {
    group,
    markerMesh,
    readyPromise,
    moveTo,
    cancelMove,
    getPosition: () => group.position.clone(),
    get isMoving() {
      return isMoving;
    },
    update: (delta: number) => {
      if (mixer) {
        mixer.update(delta);
      }

      // Animate destination marker pulse
      if (markerMat.opacity > 0.01) {
        markerMesh.rotation.y += delta * 1.5;
        const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.12;
        markerMesh.scale.set(scale, 1, scale);
      }

      if (!isMoving || waypoints.length === 0 || currentWaypointIndex >= waypoints.length) {
        if (isMoving) {
          isMoving = false;
          markerMat.opacity = 0.0;
          fadeToAction('idle');
          if (arrivalCallback) {
            const cb = arrivalCallback;
            arrivalCallback = null;
            cb();
          }
        }
        return;
      }

      const targetWP = waypoints[currentWaypointIndex];
      const moveVec = new THREE.Vector3().subVectors(targetWP, group.position);
      moveVec.y = 0; // maintain horizontal navigation
      const dist = moveVec.length();

      if (dist < 0.18) {
        // Waypoint reached, advance to next
        currentWaypointIndex++;
        if (currentWaypointIndex >= waypoints.length) {
          isMoving = false;
          markerMat.opacity = 0.0;
          fadeToAction('idle');
          if (arrivalCallback) {
            const cb = arrivalCallback;
            arrivalCallback = null;
            cb();
          }
          return;
        }
      } else {
        // Rotate toward target
        const targetAngle = Math.atan2(moveVec.x, moveVec.z);
        // Smooth rotation with shortest angle interpolation
        let diff = targetAngle - group.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        group.rotation.y += diff * Math.min(1.0, rotateSpeed * delta);

        // Move character forward
        const step = Math.min(dist, walkSpeed * delta);
        moveVec.normalize().multiplyScalar(step);
        group.position.add(moveVec);
      }
    },
    setNavMesh: (nm: IslandNavMesh) => {
      currentNavMesh = nm;
    },
  };
}
