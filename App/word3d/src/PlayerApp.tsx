import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createSkyEnvironment } from './systems/skyEnvironment';
import { buildCozyVillage } from './systems/cozyVillageBuilder';
import { IslandNavMesh } from './systems/navigationMesh';
import { createCharacterController, CharacterControllerResult } from './systems/characterController';
import { createCameraController, CameraControllerResult } from './systems/cameraController';
import { waterAnimationManager } from './systems/waterAnimation';
import { LumiCompanion } from './systems/lumiCompanion';
import { loadCozyVillageLayout, LoadedBuilding, BuildingConfig } from './systems/cozyVillageLayoutLoader';
import { SmartLandmarkOverlay } from './components/landmarks/SmartLandmarkOverlay';

export interface PlayerAppProps {
  language?: 'vi' | 'en';
  nickname?: string;
}

export const PlayerApp: React.FC<PlayerAppProps> = ({
  language = 'vi',
  nickname = 'Bạn',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLang, setCurrentLang] = useState<'vi' | 'en'>(language);
  const currentLangRef = useRef<'vi' | 'en'>(language);
  currentLangRef.current = currentLang;

  const [buildings, setBuildings] = useState<LoadedBuilding[]>([]);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [arrivedBuilding, setArrivedBuilding] = useState<LoadedBuilding | null>(null);
  const arrivedBuildingRef = useRef<LoadedBuilding | null>(null);
  arrivedBuildingRef.current = arrivedBuilding;
  const [activeCamera, setActiveCamera] = useState<THREE.Camera | null>(null);
  const [activeSpeech, setActiveSpeech] = useState<{
    speaker: string;
    text: string;
    action?: string;
  } | null>(null);

  // References
  const systemsRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    cameraCtrl: CameraControllerResult;
    character: CharacterControllerResult;
    lumiCompanion: LumiCompanion;
    navMesh: IslandNavMesh;
    buildings: LoadedBuilding[];
    interactiveMeshes: THREE.Object3D[];
    isPaused: boolean;
    beaconGroup: THREE.Group;
    groundRingMesh: THREE.Mesh;
    innerRingMesh: THREE.Mesh;
    groundRingMat: THREE.MeshBasicMaterial;
    innerRingMat: THREE.MeshBasicMaterial;
    highlightedBuilding: LoadedBuilding | null;
  } | null>(null);

  const pendingArrivalRef = useRef<{
    building: LoadedBuilding;
    targetDoor: THREE.Vector3;
    triggered: boolean;
  } | null>(null);

  // PostMessage Bridge Helper (WebView Protocol: HEALTHCLUES_WORLD3D_V3)
  const sendToHost = useCallback((type: string, payload: any = {}) => {
    const message = JSON.stringify({ version: 'HEALTHCLUES_WORLD3D_V3', source: 'word3d', type, ...payload });
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(message);
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    }
  }, []);

  // Helper when character arrives at building: Stops character, displays arrival prompt, and emits ONLY LANDMARK_ARRIVED
  const handleLandmarkArrival = useCallback((building: LoadedBuilding) => {
    if (pendingArrivalRef.current?.triggered) return;
    if (pendingArrivalRef.current) pendingArrivalRef.current.triggered = true;

    if (!systemsRef.current) return;
    const { character } = systemsRef.current;
    const cfg = building.config;
    const lang = currentLangRef.current;

    // Face building center
    const charPos = character.group.position;
    const bldPos = building.meshGroup.position;
    const dirX = bldPos.x - charPos.x;
    const dirZ = bldPos.z - charPos.z;
    character.group.rotation.y = Math.atan2(dirX, dirZ);

    // Show arrival card with "🚪 Vào" button
    setArrivedBuilding(building);

    setActiveSpeech({
      speaker: cfg.displayName[lang],
      text: cfg.descriptionVi || `Chào mừng bạn đến với ${cfg.displayName[lang]}!`,
    });

    console.log('[PlayerApp] LANDMARK_ARRIVED emitted for:', cfg.buildingInstanceId, cfg.landmarkId);

    // Emit ONLY LANDMARK_ARRIVED. DO NOT auto-emit INTERACT_BUILDING!
    sendToHost('LANDMARK_ARRIVED', {
      buildingInstanceId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      actionId: cfg.actionId,
      name: cfg.displayName[lang],
      nameEn: cfg.displayName.en,
    });
  }, [sendToHost]);

  // Handler when user actively confirms "Vào" to enter the building
  const handleConfirmEnterBuilding = useCallback((building: LoadedBuilding) => {
    const cfg = building.config;
    const lang = currentLangRef.current;

    console.log('[PlayerApp] User confirmed enter / emitting INTERACT_BUILDING for:', cfg.buildingInstanceId, cfg.actionId);

    sendToHost('INTERACT_BUILDING', {
      buildingInstanceId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      actionId: cfg.actionId,
      name: cfg.displayName[lang],
      description: cfg.descriptionVi,
    });

    sendToHost('INTERACT_LANDMARK', {
      landmarkId: cfg.landmarkId,
      name: cfg.displayName[lang],
    });

    sendToHost('INTERACT_NPC', {
      npcId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      name: cfg.displayName[lang],
      role: cfg.displayName[lang],
    });
  }, [sendToHost]);

  // Handler to command character to walk to a building door anchor
  const handleWalkToBuilding = useCallback((building: LoadedBuilding) => {
    if (!systemsRef.current) return;
    const { character, cameraCtrl } = systemsRef.current;
    const targetDoor = building.getDoorWorldAnchor();
    const cfg = building.config;
    const lang = currentLangRef.current;

    setSelectedLandmarkId(cfg.landmarkId || cfg.buildingInstanceId);
    setArrivedBuilding(null);

    // Smooth camera focus
    const bldPos = building.meshGroup.position;
    cameraCtrl.focusOn(new THREE.Vector3(bldPos.x, bldPos.y + 1.5, bldPos.z));

    pendingArrivalRef.current = {
      building,
      targetDoor,
      triggered: false,
    };

    sendToHost('NAVIGATION_STARTED', {
      buildingInstanceId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      actionId: cfg.actionId,
      targetDoor: { x: targetDoor.x, y: targetDoor.y, z: targetDoor.z },
    });

    character.moveTo(targetDoor.x, targetDoor.z, () => {
      handleLandmarkArrivalRef.current(building);
    });

    setActiveSpeech({
      speaker: 'Lumi',
      text: `Đang đi đến ${building.config.displayName[lang]}...`,
    });
  }, [sendToHost]);

  const handleWalkToBuildingRef = useRef(handleWalkToBuilding);
  handleWalkToBuildingRef.current = handleWalkToBuilding;

  const handleLandmarkArrivalRef = useRef(handleLandmarkArrival);
  handleLandmarkArrivalRef.current = handleLandmarkArrival;

  const handleConfirmEnterBuildingRef = useRef(handleConfirmEnterBuilding);
  handleConfirmEnterBuildingRef.current = handleConfirmEnterBuilding;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect mobile device
    const isMobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 768;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 2. Scene Setup
    const scene = new THREE.Scene();

    // 3. Camera Controller (Mobile touch: single finger rotate, pinch zoom)
    const cameraCtrl = createCameraController(canvas);
    setActiveCamera(cameraCtrl.camera);

    // 4. Sky and Lighting Environment
    const sky = createSkyEnvironment(scene, cameraCtrl.camera);
    scene.add(sky.group);

    // 5. Cozy Floating Village Scene
    const cozyVillage = buildCozyVillage();
    scene.add(cozyVillage.group);
    const cozyNavMesh = new IslandNavMesh(cozyVillage.colliders);

    // 6. Character Controller (Spawn at bridge entrance)
    const character = createCharacterController(scene, cozyNavMesh);
    character.group.position.set(0.0, 1.82, 4.2);
    scene.add(character.group);

    // 7. Lumi Companion Mascot (Floating orbiting bunny)
    const lumiCompanion = new LumiCompanion(scene);

    // 8. Ground Destination Target Marker Ring
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: '#34d399',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const targetRingGeo = new THREE.RingGeometry(0.28, 0.42, 28);
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(0, -100, 0); // Hide initially
    scene.add(targetRing);

    // 9. 3D Landmark Highlight Pulsing Ground Circle (Clean, no giant light pillar)
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(0, -999, 0); // Hide initially
    scene.add(beaconGroup);

    // 9a. Ground Outer Pulsing Ring
    const groundRingGeo = new THREE.RingGeometry(3.0, 5.2, 40);
    const groundRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const groundRingMesh = new THREE.Mesh(groundRingGeo, groundRingMat);
    groundRingMesh.rotation.x = -Math.PI / 2;
    groundRingMesh.position.y = 0.08;
    beaconGroup.add(groundRingMesh);

    // 9b. Ground Inner Emerald Ripple Ring
    const innerRingGeo = new THREE.RingGeometry(1.5, 2.8, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 2;
    innerRingMesh.position.y = 0.10;
    beaconGroup.add(innerRingMesh);

    systemsRef.current = {
      renderer,
      scene,
      cameraCtrl,
      character,
      lumiCompanion,
      navMesh: cozyNavMesh,
      buildings: [],
      interactiveMeshes: [],
      isPaused: false,
      beaconGroup,
      groundRingMesh,
      innerRingMesh,
      groundRingMat,
      innerRingMat,
      highlightedBuilding: null,
    };
    (window as any).__systems = systemsRef.current;
    (window as any).__CHARACTER__ = character;

    // Load synchronized village layout from manifest / disk
    // Hard fail-safe timeout: never leave player on loading screen indefinitely if network hangs
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      sendToHost('WORLD_READY', { loaded: true, buildings: [] });
    }, 15000);

    cozyVillage.readyPromise
      .then(async () => {
        try {
          const layoutResult = await loadCozyVillageLayout(cozyVillage, cozyNavMesh);
          if (systemsRef.current) {
            systemsRef.current.buildings = layoutResult.buildings;
            systemsRef.current.interactiveMeshes = layoutResult.interactiveMeshes;
          }
          setBuildings(layoutResult.buildings);

          clearTimeout(safetyTimer);
          setLoading(false);
          sendToHost('WORLD_READY', {
            loaded: true,
            buildings: layoutResult.buildings.map((b) => ({
              id: b.config.buildingInstanceId,
              name: b.config.displayName[currentLangRef.current],
              landmarkId: b.config.landmarkId,
              actionId: b.config.actionId,
              iconId: b.config.iconId,
              hasFunction: b.config.hasFunction,
              enabled: b.config.enabled,
              doorWorldAnchor: b.getDoorWorldAnchor(),
            })),
          });
        } catch (err) {
          console.error('[PlayerApp] Error loading synchronized layout:', err);
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[PlayerApp] readyPromise failed:', err);
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    // 9. Raycast Tap / Touch Handling
    const raycaster = new THREE.Raycaster();
    const touchStartPos = new THREE.Vector2();
    let isTouchDrag = false;

    const handlePointerDown = (e: PointerEvent) => {
      touchStartPos.set(e.clientX, e.clientY);
      isTouchDrag = false;
      cameraCtrl.handlePointerDown(e);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - touchStartPos.x, e.clientY - touchStartPos.y) > 8) {
        isTouchDrag = true;
      }
      cameraCtrl.handlePointerMove(e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      cameraCtrl.handlePointerUp(e);
      // If user was dragging/rotating camera, do not trigger walk
      if (isTouchDrag) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, cameraCtrl.camera);

      // Check interaction with Buildings
      if (systemsRef.current && systemsRef.current.interactiveMeshes.length > 0) {
        const buildingIntersects = raycaster.intersectObjects(
          systemsRef.current.interactiveMeshes,
          false
        );

        if (buildingIntersects.length > 0) {
          const hit = buildingIntersects[0].object;
          const config: BuildingConfig = hit.userData.buildingConfig;
          if (config) {
            const targetBuilding = systemsRef.current.buildings.find(
              (b) => b.config.buildingInstanceId === config.buildingInstanceId
            );

            if (targetBuilding) {
              const doorAnchor = targetBuilding.getDoorWorldAnchor();
              pendingArrivalRef.current = {
                building: targetBuilding,
                targetDoor: doorAnchor,
                triggered: false,
              };

              character.moveTo(doorAnchor.x, doorAnchor.z, () => {
                handleLandmarkArrivalRef.current(targetBuilding);
              });

              // Target ring at door
              targetRing.position.set(doorAnchor.x, doorAnchor.y + 0.05, doorAnchor.z);
              targetRingMat.opacity = 0.9;

              setActiveSpeech({
                speaker: 'Lumi',
                text: `Đang đi đến ${config.displayName[currentLangRef.current]}...`,
              });

              sendToHost('PLAYER_MOVEMENT_STATE', {
                isMoving: true,
                targetX: doorAnchor.x,
                targetZ: doorAnchor.z,
                targetBuilding: config.buildingInstanceId,
              });
              return;
            }
          }
        }
      }

      // Check ground tap to walk anywhere
      const groundIntersects = raycaster.intersectObject(cozyVillage.walkableRaycastPlane);
      if (groundIntersects.length > 0) {
        const pt = groundIntersects[0].point;
        character.moveTo(pt.x, pt.z);

        // Clear any pending building interaction & navigation
        pendingArrivalRef.current = null;
        setSelectedLandmarkId(null);
        setArrivedBuilding(null);
        setActiveSpeech(null);
        sendToHost('NAVIGATION_CANCELLED', { reason: 'user_manual_movement' });

        // Position target ring on ground
        targetRing.position.set(pt.x, pt.y + 0.05, pt.z);
        targetRingMat.opacity = 0.85;

        sendToHost('PLAYER_MOVEMENT_STATE', {
          isMoving: true,
          targetX: pt.x,
          targetZ: pt.z,
        });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraCtrl.handleWheel(e);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel);

    // 10. Animation Render Loop & Lifecycle Management
    let animId: number | null = null;
    let isRunning = true;
    let isTabVisible = !document.hidden;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isRunning) return;
      if (!isTabVisible || systemsRef.current?.isPaused) {
        animId = null;
        return; // Halt render loop when tab/view is hidden or explicitly paused
      }

      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);

      // Fade target ring
      if (targetRingMat.opacity > 0) {
        targetRingMat.opacity = Math.max(0, targetRingMat.opacity - delta * 0.9);
      }

      // Update character
      character.update(delta);

      // Camera update
      cameraCtrl.update(delta);

      // Water animation & wheel rotation
      waterAnimationManager.update(delta);

      // Update Sky & ambient elements
      sky.update(delta);

      // Update Lumi Companion
      lumiCompanion.update(delta, character.group.position);

      // Orient all building badges towards the camera
      if (systemsRef.current) {
        for (const bld of systemsRef.current.buildings) {
          if (bld.badgeMesh) {
            bld.badgeMesh.quaternion.copy(cameraCtrl.camera.quaternion);
          }
        }

        // Animate 3D Landmark Highlight Pulsing Ground Circle & Pulse Building
        const { beaconGroup, groundRingMesh, innerRingMesh, groundRingMat, innerRingMat, highlightedBuilding } = systemsRef.current;
        if (beaconGroup && beaconGroup.position.y > -500) {
          const elapsed = clock.getElapsedTime();
          groundRingMesh.rotation.z += delta * 0.45;
          innerRingMesh.rotation.z -= delta * 0.65;

          const pulse = Math.sin(elapsed * 4.5);
          groundRingMat.opacity = 0.55 + pulse * 0.35;
          innerRingMat.opacity = 0.5 + pulse * 0.3;
          groundRingMesh.scale.setScalar(1.0 + pulse * 0.14);
          innerRingMesh.scale.setScalar(1.0 - pulse * 0.1);

          // Gently pulse the building's meshes so the entire house flashes softly
          if (highlightedBuilding) {
            const glowOscillation = 0.5 + 0.5 * Math.sin(elapsed * 4.5);
            highlightedBuilding.meshGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const m of mats) {
                  if (m && (m as any).emissive) {
                    if ((m as any)._origEmissiveHex === undefined) {
                      (m as any)._origEmissiveHex = (m as any).emissive.getHex();
                    }
                    if ((m as any)._origEmissiveIntensity === undefined) {
                      (m as any)._origEmissiveIntensity = (m as any).emissiveIntensity ?? 1.0;
                    }
                    // Actively set a warm emerald/golden pulsing glow
                    const r = 0.15 + 0.35 * glowOscillation;
                    const g = 0.25 + 0.55 * glowOscillation;
                    const b = 0.18 + 0.28 * glowOscillation;
                    (m as any).emissive.setRGB(r, g, b);
                    (m as any).emissiveIntensity = 1.0 + glowOscillation * 1.5;
                  }
                }
              }
            });
          }
        }
      }

      // Check arrival at building door (displays prompt, does NOT auto-enter)
      if (pendingArrivalRef.current && !pendingArrivalRef.current.triggered) {
        const charPos = character.group.position;
        const doorPos = pendingArrivalRef.current.targetDoor;
        const distToDoor = Math.hypot(charPos.x - doorPos.x, charPos.z - doorPos.z);

        if (distToDoor <= 2.2) {
          handleLandmarkArrivalRef.current(pendingArrivalRef.current.building);
        }
      }

      // If arrived at a building, but character walks away (> 3.2m from door), dismiss arrival prompt
      if (arrivedBuildingRef.current) {
        const charPos = character.group.position;
        const doorPos = arrivedBuildingRef.current.getDoorWorldAnchor();
        const dist = Math.hypot(charPos.x - doorPos.x, charPos.z - doorPos.z);
        if (dist > 3.2) {
          setArrivedBuilding(null);
        }
      }

      renderer.render(scene, cameraCtrl.camera);
    };

    const startLoop = () => {
      if (animId === null && isRunning && isTabVisible && !systemsRef.current?.isPaused) {
        clock.getDelta(); // flush delta to avoid teleportation
        animId = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    // Visibility Handling
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (!isTabVisible) {
        stopLoop();
      } else {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startLoop();

    // 11. Resize handling
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraCtrl.camera.aspect = w / h;
      cameraCtrl.camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 12. Host Message Listener (from React Native)
    const handleHostMessage = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || !data.type) return;
      if (data.source === 'word3d') return; // Ignore self-emitted messages

      switch (data.type) {
        case 'INIT_WORLD':
          if (data.language) setCurrentLang(data.language);
          break;
        case 'SET_LANGUAGE':
          if (data.language) setCurrentLang(data.language);
          break;
        case 'PAUSE_WORLD':
          if (systemsRef.current) systemsRef.current.isPaused = true;
          break;
        case 'RESUME_WORLD':
          if (systemsRef.current) systemsRef.current.isPaused = false;
          break;
        case 'GET_LANDMARKS':
          if (systemsRef.current) {
            sendToHost('LANDMARKS_UPDATED', {
              landmarks: systemsRef.current.buildings.map((b) => ({
                buildingInstanceId: b.config.buildingInstanceId,
                landmarkId: b.config.landmarkId,
                actionId: b.config.actionId,
                displayName: b.config.displayName,
                iconId: b.config.iconId,
                enabled: b.config.enabled,
                doorAnchorWorld: b.getDoorWorldAnchor(),
              })),
            });
          }
          break;
        case 'FOCUS_LANDMARK':
          if (systemsRef.current) {
            const target = systemsRef.current.buildings.find(
              (b) =>
                b.config.landmarkId === data.landmarkId ||
                b.config.buildingInstanceId === data.buildingInstanceId
            );
            if (target) {
              const bldPos = target.meshGroup.position;
              systemsRef.current.cameraCtrl.focusOn(new THREE.Vector3(bldPos.x, bldPos.y + 1.5, bldPos.z));
              sendToHost('CAMERA_FOCUSED', {
                landmarkId: target.config.landmarkId,
                buildingInstanceId: target.config.buildingInstanceId,
              });
            }
          }
          break;
        case 'HIGHLIGHT_LANDMARK':
        case 'HIGHLIGHT_BUILDING':
          if (systemsRef.current) {
            const { beaconGroup } = systemsRef.current;
            const restoreBuildingEmissive = (bld: LoadedBuilding | null) => {
              if (!bld) return;
              bld.meshGroup.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh;
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  for (const m of mats) {
                    if (m && (m as any).emissive) {
                      if ((m as any)._origEmissiveHex !== undefined) {
                        (m as any).emissive.setHex((m as any)._origEmissiveHex);
                      }
                      if ((m as any)._origEmissiveIntensity !== undefined) {
                        (m as any).emissiveIntensity = (m as any)._origEmissiveIntensity;
                      }
                    }
                  }
                }
              });
            };

            if (!data.landmarkId && !data.buildingInstanceId && !data.actionId) {
              setSelectedLandmarkId(null);
              restoreBuildingEmissive(systemsRef.current.highlightedBuilding);
              systemsRef.current.highlightedBuilding = null;
              if (beaconGroup) beaconGroup.position.set(0, -999, 0);
            } else {
              const target = systemsRef.current.buildings.find(
                (b) =>
                  (data.landmarkId && b.config.landmarkId === data.landmarkId) ||
                  (data.buildingInstanceId && b.config.buildingInstanceId === data.buildingInstanceId) ||
                  (data.actionId && b.config.actionId === data.actionId) ||
                  (data.landmarkId === 'village_square' && (b.config.buildingInstanceId === 'bld_plaza_well' || b.config.landmarkId === 'task_square')) ||
                  (data.landmarkId === 'task_square' && (b.config.buildingInstanceId === 'bld_plaza_well' || b.config.landmarkId === 'village_square')) ||
                  (data.landmarkId === 'herbal_house' && (b.config.buildingInstanceId === 'bld_potion_shop' || b.config.landmarkId === 'herbal_garden')) ||
                  (data.landmarkId === 'herbal_garden' && (b.config.buildingInstanceId === 'bld_potion_shop' || b.config.landmarkId === 'herbal_garden')) ||
                  (data.landmarkId === 'body_science_house' && (b.config.buildingInstanceId === 'bld_bookshop' || b.config.landmarkId === 'knowledge_library')) ||
                  (data.landmarkId === 'knowledge_library' && (b.config.buildingInstanceId === 'bld_bookshop' || b.config.landmarkId === 'knowledge_library')) ||
                  (data.landmarkId === 'journey_house' && (b.config.buildingInstanceId === 'bld_great_hall' || b.config.landmarkId === 'journey_house')) ||
                  (data.landmarkId === 'detective_office' && (b.config.buildingInstanceId === 'bld_watermill' || b.config.landmarkId === 'cloud_therapy')) ||
                  (data.landmarkId === 'cloud_therapy' && (b.config.buildingInstanceId === 'bld_watermill' || b.config.landmarkId === 'cloud_therapy'))
              );
              if (target) {
                if (systemsRef.current.highlightedBuilding && systemsRef.current.highlightedBuilding !== target) {
                  restoreBuildingEmissive(systemsRef.current.highlightedBuilding);
                }
                // Do not set selectedLandmarkId here to avoid intrusive 2D billboards during cinematic tour.
                // The 3D pulsing ground circle beaconGroup & building emissive pulse are sufficient.
                systemsRef.current.highlightedBuilding = target;
                const bldPos = target.meshGroup.position;
                if (beaconGroup) {
                  const groundY = Math.max(1.85, bldPos.y);
                  beaconGroup.position.set(bldPos.x, groundY, bldPos.z);
                }
                if (data.focusCamera) {
                  systemsRef.current.cameraCtrl.focusOn(new THREE.Vector3(bldPos.x, bldPos.y + 1.5, bldPos.z));
                }
              } else {
                setSelectedLandmarkId(null);
                restoreBuildingEmissive(systemsRef.current.highlightedBuilding);
                systemsRef.current.highlightedBuilding = null;
                if (beaconGroup) beaconGroup.position.set(0, -999, 0);
              }
            }
          }
          break;
        case 'SET_CAMERA_VIEW':
          if (systemsRef.current) {
            if (data.view === 'overview') {
              systemsRef.current.cameraCtrl.setOverviewView();
              sendToHost('CAMERA_VIEW_CHANGED', { view: 'overview' });
            } else if (data.view === 'close') {
              const charPos = systemsRef.current.character.getPosition();
              systemsRef.current.cameraCtrl.setCloseView(charPos);
              sendToHost('CAMERA_VIEW_CHANGED', { view: 'close' });
            }
          }
          break;
        case 'GO_TO_LANDMARK':
        case 'WALK_TO_BUILDING':
          if (systemsRef.current) {
            const target = systemsRef.current.buildings.find(
              (b) =>
                b.config.landmarkId === data.landmarkId ||
                b.config.buildingInstanceId === data.buildingInstanceId ||
                b.config.actionId === data.actionId
            );
            if (target) {
              handleWalkToBuildingRef.current(target);
            } else {
              sendToHost('NAVIGATION_FAILED', {
                landmarkId: data.landmarkId,
                reason: 'LANDMARK_NOT_FOUND',
              });
            }
          }
          break;
        case 'CANCEL_NAVIGATION':
          if (systemsRef.current) {
            systemsRef.current.character.cancelMove();
            pendingArrivalRef.current = null;
            setSelectedLandmarkId(null);
            setArrivedBuilding(null);
            sendToHost('NAVIGATION_CANCELLED', { reason: 'HOST_REQUEST' });
          }
          break;
        case 'INTERACT_BUILDING':
          if (systemsRef.current) {
            const target = systemsRef.current.buildings.find(
              (b) =>
                b.config.landmarkId === data.landmarkId ||
                b.config.buildingInstanceId === data.buildingInstanceId
            );
            if (target) {
              handleConfirmEnterBuildingRef.current(target);
            }
          }
          break;
        case 'PAUSE_RENDER':
          if (systemsRef.current) systemsRef.current.isPaused = true;
          stopLoop();
          break;
          sendToHost('RENDER_STATE_CHANGED', { paused: true });
          break;
        case 'RESUME_RENDER':
          if (systemsRef.current) systemsRef.current.isPaused = false;
          startLoop();
          sendToHost('RENDER_STATE_CHANGED', { paused: false });
          break;
        case 'DESTROY':
          isRunning = false;
          stopLoop();
          renderer.dispose();
          sendToHost('WORLD_DESTROYED', { success: true });
          break;
      }
    };

    window.addEventListener('message', handleHostMessage);
    document.addEventListener('message', handleHostMessage as any);

    // Memory Diagnostics Interface for automated stress tests
    (window as any).__getMemoryMetrics = () => {
      const perfMem = (performance as any).memory;
      const renMem = renderer?.info?.memory;
      const renRender = renderer?.info?.render;
      return {
        timestamp: Date.now(),
        usedJSHeapMB: perfMem ? parseFloat((perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : null,
        totalJSHeapMB: perfMem ? parseFloat((perfMem.totalJSHeapSize / (1024 * 1024)).toFixed(2)) : null,
        geometries: renMem ? renMem.geometries : 0,
        textures: renMem ? renMem.textures : 0,
        triangles: renRender ? renRender.triangles : 0,
        drawCalls: renRender ? renRender.calls : 0,
        isTabVisible,
        isPaused: systemsRef.current?.isPaused || false,
        isLoopRunning: animId !== null,
      };
    };

    return () => {
      isRunning = false;
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('message', handleHostMessage);
      document.removeEventListener('message', handleHostMessage as any);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);



  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#020b08',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* Soft Glass Loading Overlay - Never black out the 3D scene */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(3, 15, 12, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#34d399',
          fontFamily: '"Plus Jakarta Sans", "Be Vietnam Pro", sans-serif',
          zIndex: 100,
          opacity: loading ? 1 : 0,
          pointerEvents: loading ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(52, 211, 153, 0.25)',
            borderTopColor: '#34d399',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
          Đang kết nối Làng Nổi 3D...
        </p>
      </div>

      {/* Floating NPC Speech Modal - Positioned comfortably below top sub-HUD pills */}
      {activeSpeech && (
        <div
          style={{
            position: 'absolute',
            top: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '92%',
            width: 360,
            backgroundColor: 'rgba(5, 22, 17, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(52, 211, 153, 0.65)',
            borderRadius: 16,
            padding: '12px 16px',
            color: '#ffffff',
            fontFamily: '"Plus Jakarta Sans", "Be Vietnam Pro", sans-serif',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            pointerEvents: 'auto',
          }}
        >
          <div>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#34d399', display: 'block' }}>
              ✨ {activeSpeech.speaker}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: '18px', color: '#e2e8f0' }}>
              {activeSpeech.text}
            </p>
          </div>
          <button
            onClick={() => setActiveSpeech(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              color: '#94a3b8',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2D Smart Landmark Badges & Arrival Prompt */}
      <SmartLandmarkOverlay
        camera={activeCamera}
        buildings={buildings}
        selectedLandmarkId={selectedLandmarkId}
        arrivedBuilding={arrivedBuilding}
        onSelectLandmark={handleWalkToBuilding}
        onEnterBuilding={(bld) => handleConfirmEnterBuilding(bld)}
        onDismissArrival={() => setArrivedBuilding(null)}
        language={currentLang}
      />

      {/* Control hints */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          borderRadius: 14,
          padding: '4px 12px',
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'sans-serif',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        🖱️ Kéo xoay · Cuộn zoom · Chạm nhà để di chuyển
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
