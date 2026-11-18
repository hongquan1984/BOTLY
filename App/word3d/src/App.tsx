import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createFloatingIsland, FloatingIslandResult } from './systems/floatingIsland';
import { createSkyEnvironment, SkyEnvironmentResult } from './systems/skyEnvironment';
import { buildVillage, VillageBuildResult } from './systems/villageBuilder';
import { buildCozyVillage, CozyVillageBuildResult } from './systems/cozyVillageBuilder';
import { IslandNavMesh } from './systems/navigationMesh';
import { createCharacterController, CharacterControllerResult } from './systems/characterController';
import { createCameraController, CameraControllerResult } from './systems/cameraController';
import { createLevelEditor, LevelEditorResult, LandmarkBuildingData, BuildingValidationResult } from './systems/levelEditor';
import { waterAnimationManager } from './systems/waterAnimation';
import { GameUI, QualityPreset, WorldMode } from './components/ui/GameUI';
import { AssetLibraryModal, ExtractedAssetItem } from './components/library/AssetLibraryModal';
import { COZY_VILLAGE_LOCATIONS, CASTLE_VILLAGE_LOCATIONS, InteractiveLocation } from './data/locations';
import { loadCozyVillageLayout, LoadedBuilding } from './systems/cozyVillageLayoutLoader';
import { SmartLandmarkOverlay } from './components/landmarks/SmartLandmarkOverlay';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [worldMode, setWorldMode] = useState<WorldMode>('cozy'); // Default to newly built CozyVillageDemo!
  const [selectedLocation, setSelectedLocation] = useState<InteractiveLocation | null>(null);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [quality, setQuality] = useState<QualityPreset>(() => {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    return isMobile ? 'medium' : 'high';
  });

  const [fps, setFps] = useState(60);
  const [triangles, setTriangles] = useState(0);
  const [drawCalls, setDrawCalls] = useState(0);

  // Level Editor & 3D Model Upload states
  const [editorMode, setEditorMode] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Master Task V3 Landmark & Smart Navigation states
  const [selectedBuildingData, setSelectedBuildingData] = useState<LandmarkBuildingData | null>(null);
  const [selectedValidation, setSelectedValidation] = useState<BuildingValidationResult | null>(null);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);
  const [arrivedBuilding, setArrivedBuilding] = useState<LoadedBuilding | null>(null);
  const [activeBuildings, setActiveBuildings] = useState<LoadedBuilding[]>([]);
  const [activeCamera, setActiveCamera] = useState<THREE.Camera | null>(null);

  // References for system interaction
  const systemsRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    cameraCtrl: CameraControllerResult;
    sky: SkyEnvironmentResult;
    island: FloatingIslandResult;
    castleVillage: VillageBuildResult;
    cozyVillage: CozyVillageBuildResult;
    castleNavMesh: IslandNavMesh;
    cozyNavMesh: IslandNavMesh;
    character: CharacterControllerResult;
    levelEditor: LevelEditorResult;
  } | null>(null);

  // Active locations based on current scene
  const currentLocations = worldMode === 'cozy' ? COZY_VILLAGE_LOCATIONS : CASTLE_VILLAGE_LOCATIONS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Renderer Setup with ACES Filmic Tone Mapping & Soft Shadows
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(
      quality === 'high' ? Math.min(window.devicePixelRatio, 2.0) :
      quality === 'medium' ? Math.min(window.devicePixelRatio, 1.5) : 1.0
    );
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 2. Scene Setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 3. Camera Controller
    const cameraCtrl = createCameraController(canvas);
    setActiveCamera(cameraCtrl.camera);

    // 4. Sky and Lighting Environment (Fixed 2.5D Sky World + 2 Depth Clouds)
    const sky = createSkyEnvironment(scene, cameraCtrl.camera);
    scene.add(sky.group);

    // 5. World A: BlackSpire Castle Village Scene & Base
    const island = createFloatingIsland();
    const castleVillage = buildVillage();
    scene.add(island.group);
    scene.add(castleVillage.group);
    const castleNavMesh = new IslandNavMesh(castleVillage.colliders);

    // 6. World B: Medieval Village Pack - Cozy Fantasy Diorama
    const cozyVillage = buildCozyVillage();
    scene.add(cozyVillage.group);
    const cozyNavMesh = new IslandNavMesh(cozyVillage.colliders);

    // Initial visibility: default to Cozy Village
    island.group.visible = false;
    castleVillage.group.visible = false;
    cozyVillage.group.visible = true;

    // 7. Player Character Controller (starting at Cozy Village bridge entrance [0, 1.82, 4.2])
    const character = createCharacterController(scene, cozyNavMesh);
    character.group.position.set(0.0, 1.82, 4.2);
    scene.add(character.group);

    // 8. Level Editor & 3D Model Upload System
    const levelEditor = createLevelEditor(
      scene,
      cozyVillage.group,
      cozyVillage.walkableRaycastPlane,
      cozyVillage.editableObjects,
      cozyVillage.templates,
      (state) => {
        setSelectedItemName(state.selectedName || null);
        setSelectedItemType(state.selectedType || null);
        setSelectedBuildingData(state.buildingData || null);
        setSelectedValidation(state.validation || null);
      }
    );

    systemsRef.current = {
      renderer,
      scene,
      cameraCtrl,
      sky,
      island,
      castleVillage,
      cozyVillage,
      castleNavMesh,
      cozyNavMesh,
      character,
      levelEditor,
    };

    (window as any).__CHARACTER__ = character;
    (window as any).__SYSTEMS__ = systemsRef.current;

    // Wait for models to complete loading, then load saved custom layout
    Promise.all([
      cozyVillage.readyPromise,
      character.readyPromise,
    ]).then(async () => {
      try {
        await levelEditor.loadSavedLayout();
        const blds = levelEditor.getLoadedBuildings();
        setActiveBuildings(blds);
        console.log('[App] Loaded saved layout and registered active landmarks:', blds.length);
      } catch (err) {
        console.error('[App] Error in loadSavedLayout:', err);
      } finally {
        setLoading(false);
      }
    });

    (window as any).__levelEditor = levelEditor;
    (window as any).__systems = systemsRef.current;
    (window as any).THREE = THREE;

    // 9. Resize Handling
    const handleResize = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraCtrl.camera.aspect = width / height;
      cameraCtrl.camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      sky.updateAspect?.(cameraCtrl.camera.aspect);
    };
    window.addEventListener('resize', handleResize);

    // 10. Click/Tap Detection (Distinguish Drag from Tap & Editor Interaction)
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      pointerDownTime = performance.now();
      pointerDownPos = { x: e.clientX, y: e.clientY };

      if (levelEditor.isEnabled()) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraCtrl.camera);
        const handled = levelEditor.handlePointerDown(e, raycaster);
        if (handled) {
          // Object selected / dragging started, prevent camera rotation
          return;
        }
      }

      cameraCtrl.handlePointerDown(e);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (levelEditor.isEnabled()) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraCtrl.camera);
        const handled = levelEditor.handlePointerMove(e, raycaster);
        if (handled) {
          return;
        }
      }

      cameraCtrl.handlePointerMove(e);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (levelEditor.isEnabled()) {
        levelEditor.handlePointerUp();
      }
      cameraCtrl.handlePointerUp(e);

      const elapsed = performance.now() - pointerDownTime;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);

      // If in Editor Mode, skip character walking
      if (levelEditor.isEnabled()) return;

      // If quick tap (< 300ms) with minimal movement (< 8px), treat as click-to-move
      if (elapsed < 300 && dist < 8 && systemsRef.current) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, cameraCtrl.camera);

        // Raycast against active world's walkable surface
        const currentMode = systemsRef.current.cozyVillage.group.visible ? 'cozy' : 'castle';
        const activePlane = currentMode === 'cozy'
          ? systemsRef.current.cozyVillage.walkableRaycastPlane
          : systemsRef.current.island.walkableRaycastPlane;

        const intersects = raycaster.intersectObject(activePlane, false);

        if (intersects.length > 0) {
          const hit = intersects[0].point;
          const locs = currentMode === 'cozy' ? COZY_VILLAGE_LOCATIONS : CASTLE_VILLAGE_LOCATIONS;

          // Check if user clicked near any interactive landmark
          const clickedLoc = locs.find((loc) => {
            const d = Math.hypot(hit.x - loc.buildingPos[0], hit.z - loc.buildingPos[2]);
            return d < 4.2;
          });

          if (clickedLoc) {
            handleSelectLocation(clickedLoc);
          } else {
            // Free movement to clicked point
            setActiveTargetId(null);
            setActiveLandmarkId(null);
            setArrivedBuilding(null);
            const success = character.moveTo(hit.x, hit.z);
            if (success) {
              setIsMoving(true);
            }
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      cameraCtrl.handleWheel(e);
    };

    // Drag and Drop 3D Model files from Desktop
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(true);
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDraggingFile(false);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);

      if (!e.dataTransfer || !e.dataTransfer.files.length || !systemsRef.current) return;
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.glb') || ext.endsWith('.gltf')) {
        if (!levelEditor.isEnabled()) {
          levelEditor.enable();
          setEditorMode(true);
        }

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraCtrl.camera);

        const groundHits = raycaster.intersectObject(cozyVillage.walkableRaycastPlane, false);
        const dropPos = groundHits.length > 0 ? groundHits[0].point : new THREE.Vector3(0, 1.82, 0);

        try {
          await levelEditor.loadCustomModel(file, dropPos);
        } catch (err) {
          console.error('Failed to load dropped 3D model:', err);
        }
      }
    };

    // Keyboard shortcuts for Level Editor
    const onKeyDown = (e: KeyboardEvent) => {
      if (!levelEditor.isEnabled()) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        levelEditor.deleteSelected();
      } else if (e.key === 'Escape') {
        levelEditor.selectObject(null);
      } else if (e.key === 'r' || e.key === 'R') {
        levelEditor.rotateSelected(e.shiftKey ? -45 : 45);
      } else if (e.key === '=' || e.key === '+') {
        levelEditor.scaleSelected(1.1);
      } else if (e.key === '-' || e.key === '_') {
        levelEditor.scaleSelected(0.9);
      } else if (e.key === 'PageUp' || (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W'))) {
        levelEditor.elevateSelected(0.15);
      } else if (e.key === 'PageDown' || (e.shiftKey && (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S'))) {
        levelEditor.elevateSelected(-0.15);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKeyDown);

    // 11. Animation Loop & Memory Lifecycle Management
    let animId: number | null = null;
    let isRunning = true;
    let isTabVisible = !document.hidden;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let currentFps = 60;

    const animate = (currentTime: number) => {
      if (!isRunning) return;
      if (!isTabVisible) {
        animId = null;
        return; // Halt render loop when tab/view is hidden
      }

      animId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const timeInSec = currentTime / 1000;

      // Update active systems
      sky.update(timeInSec);
      waterAnimationManager.update(timeInSec);
      if (systemsRef.current) {
        const isCozy = systemsRef.current.cozyVillage.group.visible;
        if (isCozy) {
          cozyVillage.update(timeInSec);
        } else {
          island.update(timeInSec);
          castleVillage.update(timeInSec);
        }
      }

      character.update(delta);
      cameraCtrl.update(delta);
      levelEditor.update();

      setIsMoving(character.isMoving);

      // Render Scene
      renderer.render(scene, cameraCtrl.camera);

      // Stats monitoring
      frameCount++;
      if (currentTime - lastFpsUpdate >= 500) {
        currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
        setFps(currentFps);
        frameCount = 0;
        lastFpsUpdate = currentTime;
        setTriangles(renderer.info.render.triangles);
        setDrawCalls(renderer.info.render.calls);
      }
    };

    const startLoop = () => {
      if (animId === null && isRunning && isTabVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    // Visibility Handling: Pause rendering when page is hidden to save GPU/CPU & prevent leaks
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
        fps: currentFps,
        isTabVisible,
        isLoopRunning: animId !== null,
      };
    };

    return () => {
      isRunning = false;
      stopLoop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKeyDown);
      renderer.dispose();
    };
  }, []);

  // Switch between Cozy Village Demo and Castle Village Demo
  const handleToggleWorld = (targetMode: WorldMode) => {
    setWorldMode(targetMode);
    setSelectedLocation(null);
    setActiveTargetId(null);

    if (!systemsRef.current) return;
    const { island, castleVillage, cozyVillage, character, cozyNavMesh, castleNavMesh, cameraCtrl, levelEditor } = systemsRef.current;

    // Turn off editor mode when switching scenes
    if (levelEditor.isEnabled()) {
      levelEditor.disable();
      setEditorMode(false);
      setSelectedItemName(null);
    }

    if (targetMode === 'cozy') {
      island.group.visible = false;
      castleVillage.group.visible = false;
      cozyVillage.group.visible = true;

      character.setNavMesh(cozyNavMesh);
      character.group.position.set(0.0, 1.82, 4.2);
    } else {
      cozyVillage.group.visible = false;
      island.group.visible = true;
      castleVillage.group.visible = true;

      character.setNavMesh(castleNavMesh);
      character.group.position.set(-1.5, 1.80, -2.5);
    }

    cameraCtrl.resetView();
  };

  // Update rendering quality
  const handleQualityChange = (newPreset: QualityPreset) => {
    setQuality(newPreset);
    if (!systemsRef.current) return;
    const { renderer, sky, cozyVillage } = systemsRef.current;

    sky.setQuality?.(newPreset);
    cozyVillage.setQuality?.(newPreset);

    if (newPreset === 'high') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      renderer.shadowMap.enabled = true;
      sky.sunLight.castShadow = true;
      sky.sunLight.shadow.mapSize.set(2048, 2048);
    } else if (newPreset === 'medium') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      sky.sunLight.castShadow = true;
      sky.sunLight.shadow.mapSize.set(1024, 1024);
    } else {
      renderer.setPixelRatio(1.0);
      renderer.shadowMap.enabled = false;
      sky.sunLight.castShadow = false;
    }
  };

  // Move character and focus camera when a location is selected
  const handleSelectLocation = (loc: InteractiveLocation) => {
    if (!systemsRef.current) return;
    const { character, cameraCtrl } = systemsRef.current;

    setActiveTargetId(loc.id);
    const [tx, ty, tz] = loc.targetPos;

    // Smoothly focus camera towards destination
    cameraCtrl.focusOn(new THREE.Vector3(tx, ty, tz), loc.cameraOffset);

    // Walk character to destination waypoint
    character.moveTo(tx, tz, () => {
      setSelectedLocation(loc);
      setActiveTargetId(null);
    });
  };

  const handleResetCamera = () => {
    if (!systemsRef.current) return;
    systemsRef.current.cameraCtrl.resetView();
  };

  // Level Editor Actions
  const handleToggleEditor = () => {
    if (!systemsRef.current) return;
    const nextState = systemsRef.current.levelEditor.toggle();
    setEditorMode(nextState);
    if (!nextState) {
      setSelectedItemName(null);
    }
  };

  const handleRotateSelected = (deltaDeg: number) => {
    systemsRef.current?.levelEditor.rotateSelected(deltaDeg);
  };

  const handleScaleSelected = (factor: number) => {
    systemsRef.current?.levelEditor.scaleSelected(factor);
  };

  const handleElevateSelected = (deltaY: number) => {
    systemsRef.current?.levelEditor.elevateSelected(deltaY);
  };

  const handleDuplicateSelected = () => {
    systemsRef.current?.levelEditor.duplicateSelected();
  };

  const handleDeleteSelected = () => {
    systemsRef.current?.levelEditor.deleteSelected();
  };

  const handleDeselect = () => {
    systemsRef.current?.levelEditor.selectObject(null);
  };

  const handleSpawnItem = (type: string) => {
    systemsRef.current?.levelEditor.spawnItem(type);
  };

  const handleSpawnExtractedAsset = async (relativePath: string, name: string) => {
    if (!systemsRef.current) return;
    if (!systemsRef.current.levelEditor.isEnabled()) {
      systemsRef.current.levelEditor.enable();
      setEditorMode(true);
    }
    await systemsRef.current.levelEditor.spawnExtractedAsset(relativePath, name);
  };

  const handleUploadModel = async (file: File) => {
    if (!systemsRef.current) return;
    if (!systemsRef.current.levelEditor.isEnabled()) {
      systemsRef.current.levelEditor.enable();
      setEditorMode(true);
    }
    await systemsRef.current.levelEditor.loadCustomModel(file);
  };

  const handleSaveLayout = () => {
    systemsRef.current?.levelEditor.saveLayout();
    try {
      const currentSavedJson = localStorage.getItem('cozy_village_layout_v1');
      if (currentSavedJson) {
        fetch('/_api/save-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: currentSavedJson,
        })
          .then((r) => r.json())
          .then((data) => {
            console.log('[WorldSync] Saved layout synced to disk JSON file (/data/cozy_village_layout.json):', data);
          })
          .catch((err) => console.warn('[WorldSync] Sync failed:', err));
      }
    } catch (err) {
      console.warn('[WorldSync] Save sync error:', err);
    }
  };

  const handleResetLayout = () => {
    systemsRef.current?.levelEditor.resetDefaultLayout();
  };

  const handleExportJSON = () => {
    if (!systemsRef.current) return;
    const json = systemsRef.current.levelEditor.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cozy_village_layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (jsonStr: string) => {
    if (!systemsRef.current) return;
    const ok = await systemsRef.current.levelEditor.importJSON(jsonStr);
    if (ok) {
      localStorage.setItem('cozy_village_layout_v1', jsonStr);
      fetch('/_api/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(() => {});
    }
  };

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

  const handleGoToLandmark = useCallback((building: LoadedBuilding) => {
    if (!systemsRef.current) return;
    const { character, cameraCtrl } = systemsRef.current;
    const door = building.getDoorWorldAnchor();
    const cfg = building.config;

    setActiveLandmarkId(cfg.landmarkId || cfg.buildingInstanceId);
    setArrivedBuilding(null);

    // 1. Camera smoothly turns towards building
    const bldPos = building.meshGroup.position;
    cameraCtrl.focusOn(new THREE.Vector3(bldPos.x, bldPos.y + 1.5, bldPos.z));

    sendToHost('NAVIGATION_STARTED', {
      buildingInstanceId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      actionId: cfg.actionId,
      targetDoor: { x: door.x, y: door.y, z: door.z },
    });

    // 2. Character walks to door anchor
    character.moveTo(door.x, door.z, () => {
      // 3. Stop and turn towards building center
      const charPos = character.group.position;
      const dirX = bldPos.x - charPos.x;
      const dirZ = bldPos.z - charPos.z;
      character.group.rotation.y = Math.atan2(dirX, dirZ);

      // 4. Mark arrival
      setArrivedBuilding(building);

      // 5. Emit LANDMARK_ARRIVED event
      sendToHost('LANDMARK_ARRIVED', {
        buildingInstanceId: cfg.buildingInstanceId,
        landmarkId: cfg.landmarkId,
        actionId: cfg.actionId,
        name: cfg.displayName.vi,
        nameEn: cfg.displayName.en,
      });
    });
  }, [sendToHost]);

  const handleEnterBuilding = useCallback((building: LoadedBuilding) => {
    const cfg = building.config;
    console.log('[World3D] Entering building / emitting INTERACT_BUILDING:', cfg.landmarkId, cfg.actionId);
    sendToHost('INTERACT_BUILDING', {
      buildingInstanceId: cfg.buildingInstanceId,
      landmarkId: cfg.landmarkId,
      actionId: cfg.actionId,
      name: cfg.displayName.vi,
      description: cfg.descriptionVi,
    });
  }, [sendToHost]);

  // Host Message Listener (from React Native / Web Parent)
  useEffect(() => {
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
        case 'GET_LANDMARKS': {
          sendToHost('LANDMARKS_UPDATED', {
            landmarks: activeBuildings.map((b) => ({
              buildingInstanceId: b.config.buildingInstanceId,
              landmarkId: b.config.landmarkId,
              actionId: b.config.actionId,
              displayName: b.config.displayName,
              iconId: b.config.iconId,
              enabled: b.config.enabled,
              doorAnchorWorld: b.getDoorWorldAnchor(),
            })),
          });
          break;
        }
        case 'FOCUS_LANDMARK': {
          const target = activeBuildings.find(
            (b) =>
              b.config.landmarkId === data.landmarkId ||
              b.config.buildingInstanceId === data.buildingInstanceId
          );
          if (target && systemsRef.current) {
            const bldPos = target.meshGroup.position;
            systemsRef.current.cameraCtrl.focusOn(new THREE.Vector3(bldPos.x, bldPos.y + 1.5, bldPos.z));
            sendToHost('CAMERA_FOCUSED', {
              landmarkId: target.config.landmarkId,
              buildingInstanceId: target.config.buildingInstanceId,
            });
          }
          break;
        }
        case 'GO_TO_LANDMARK': {
          const target = activeBuildings.find(
            (b) =>
              b.config.landmarkId === data.landmarkId ||
              b.config.buildingInstanceId === data.buildingInstanceId ||
              b.config.actionId === data.actionId
          );
          if (target) {
            handleGoToLandmark(target);
          } else {
            sendToHost('NAVIGATION_FAILED', {
              landmarkId: data.landmarkId,
              reason: 'LANDMARK_NOT_FOUND',
            });
          }
          break;
        }
        case 'CANCEL_NAVIGATION': {
          if (systemsRef.current) {
            systemsRef.current.character.cancelMove();
            setActiveLandmarkId(null);
            setArrivedBuilding(null);
            sendToHost('NAVIGATION_CANCELLED', { reason: 'HOST_REQUEST' });
          }
          break;
        }
        case 'INTERACT_BUILDING': {
          const target = activeBuildings.find(
            (b) =>
              b.config.landmarkId === data.landmarkId ||
              b.config.buildingInstanceId === data.buildingInstanceId
          );
          if (target) {
            handleEnterBuilding(target);
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleHostMessage);
    document.addEventListener('message', handleHostMessage as any);
    return () => {
      window.removeEventListener('message', handleHostMessage);
      document.removeEventListener('message', handleHostMessage as any);
    };
  }, [activeBuildings, sendToHost, handleGoToLandmark, handleEnterBuilding]);

  const handleBlendSelectedColor = () => {
    systemsRef.current?.levelEditor.blendSelectedColor();
  };

  const handleRestoreSelectedColor = () => {
    systemsRef.current?.levelEditor.restoreSelectedColor();
  };

  const handlePlaceAssetInMap = async (asset: ExtractedAssetItem) => {
    if (!systemsRef.current) return;
    if (!systemsRef.current.levelEditor.isEnabled()) {
      systemsRef.current.levelEditor.enable();
      setEditorMode(true);
    }
    try {
      await systemsRef.current.levelEditor.spawnExtractedAsset(
        asset.relativePath,
        asset.name,
        new THREE.Vector3(0, 1.82, 0)
      );
    } catch (err) {
      console.error('Failed to place asset into map:', err);
    }
  };

  return (
    <div className="game-container">
      <canvas id="webgl-canvas" ref={canvasRef} />

      {/* Loading Screen */}
      {loading && (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Floating Fantasy Village</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Loading Medieval Village Pack 3D models, textures & sky island...
          </p>
        </div>
      )}

      {/* UI Overlay */}
      <GameUI
        selectedLocation={selectedLocation}
        activeTargetId={activeTargetId}
        isMoving={isMoving}
        quality={quality}
        worldMode={worldMode}
        locations={currentLocations}
        onSelectLocation={handleSelectLocation}
        onCloseModal={() => setSelectedLocation(null)}
        onResetCamera={handleResetCamera}
        onChangeQuality={handleQualityChange}
        onToggleWorld={handleToggleWorld}
        fps={fps}
        triangles={triangles}
        drawCalls={drawCalls}
        editorMode={editorMode}
        onToggleEditor={handleToggleEditor}
        selectedItemName={selectedItemName}
        selectedItemType={selectedItemType}
        onRotateSelected={handleRotateSelected}
        onScaleSelected={handleScaleSelected}
        onElevateSelected={handleElevateSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onDeselect={handleDeselect}
        onSpawnItem={handleSpawnItem}
        onSpawnExtractedAsset={handleSpawnExtractedAsset}
        onUploadModel={handleUploadModel}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        isDraggingFile={isDraggingFile}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onBlendSelectedColor={handleBlendSelectedColor}
        onRestoreSelectedColor={handleRestoreSelectedColor}
        selectedBuildingData={selectedBuildingData}
        selectedValidation={selectedValidation}
        onUpdateBuildingLandmark={(partial) => {
          systemsRef.current?.levelEditor.updateBuildingLandmark(partial);
          setSelectedBuildingData(systemsRef.current?.levelEditor.getSelectedLandmarkData() || null);
          setSelectedValidation(systemsRef.current?.levelEditor.validateBuilding() || null);
          setActiveBuildings(systemsRef.current?.levelEditor.getLoadedBuildings() || []);
        }}
        onReplaceModel={async (file) => {
          if (!systemsRef.current) return false;
          try {
            await systemsRef.current.levelEditor.replaceSelectedModel(file);
            setSelectedBuildingData(systemsRef.current.levelEditor.getSelectedLandmarkData() || null);
            setSelectedValidation(systemsRef.current.levelEditor.validateBuilding() || null);
            setActiveBuildings(systemsRef.current.levelEditor.getLoadedBuildings() || []);
            return true;
          } catch {
            return false;
          }
        }}
      />

      {/* 2D Smart Landmark Badges & Arrival Card Overlay */}
      <SmartLandmarkOverlay
        camera={activeCamera}
        buildings={activeBuildings}
        selectedLandmarkId={activeLandmarkId}
        arrivedBuilding={arrivedBuilding}
        onSelectLandmark={handleGoToLandmark}
        onEnterBuilding={handleEnterBuilding}
        onDismissArrival={() => setArrivedBuilding(null)}
        language="vi"
      />

      {/* 3D Asset Studio / Library Modal */}
      <AssetLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onPlaceInMap={handlePlaceAssetInMap}
      />
    </div>
  );
};
