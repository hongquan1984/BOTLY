import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { createAlpineSkyDome } from './shaders/skyShader';
import { createAlpineBackdrop25D } from './shaders/backdrop25D';
import { createAlpineEnvironmentMap } from './shaders/envMap';
import { createAlpineWater } from './shaders/waterShader';
import { createInstancedGrass } from './shaders/grassShader';
import {
  buildAlpineEnvironment,
  getGroundHeight,
  isGardenGrassForbidden,
} from './world/EnvironmentBuilder';
import { buildSwissChalet } from './world/ChaletBuilder';
import { PlayerController } from './world/PlayerController';
import { DecorationManager, PLACEABLE_ITEMS } from './world/DecorationManager';
import { HybridAssetLoader } from './assets/HybridAssetLoader';
import { QualityPreset, ViewMode } from './types';

const isMobileDevice =
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

// =========================================================
// 1. RENDERER & SCENE SETUP (AgX Tone Mapping + GPU Budget)
// =========================================================
const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobileDevice,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#b6d8f2', 0.0008);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.15, 650);
camera.rotation.order = 'YXZ';

// =========================================================
// 2. SUNLIGHT, SKY & REAL CC0 ALPINE HDRI ENVIRONMENT MAP
// =========================================================
// Warm late-afternoon sunlight poured diagonally through front & right glass doors
const sunDir = new THREE.Vector3(0.68, 0.34, 0.65).normalize();

const fallbackEnvMap = createAlpineEnvironmentMap(renderer, sunDir);
scene.environment = fallbackEnvMap;
scene.environmentIntensity = 0.42;

new RGBELoader().load(
  '/assets/hdri/alps_field_1k.hdr',
  (hdrTex) => {
    hdrTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envRT = pmrem.fromEquirectangular(hdrTex);
    scene.environment = envRT.texture;
    hdrTex.dispose();
    pmrem.dispose();
  },
  undefined,
  () => {
    // Fallback procedural Alpine environment remains active on error
  }
);

const { mesh: skyMesh, uniforms: skyUniforms } = createAlpineSkyDome(sunDir);
scene.add(skyMesh);

const backdrop25D = createAlpineBackdrop25D(sunDir);
scene.add(backdrop25D.group);

const sunLight = new THREE.DirectionalLight('#ffd39e', 3.8);
sunLight.position.copy(sunDir).multiplyScalar(42);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobileDevice ? 1024 : 2048, isMobileDevice ? 1024 : 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 90;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
sunLight.shadow.bias = -0.00035;
sunLight.shadow.normalBias = 0.015;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight('#9ec2ec', '#5e4128', 0.44);
scene.add(hemiLight);

const bounceFill = new THREE.DirectionalLight('#ffdcb8', 0.28);
bounceFill.position.set(-18, 12, -20);
scene.add(bounceFill);

// =========================================================
// 3. PRELOAD HYBRID GLTF ASSETS & BUILD WORLD (2-PHASE STREAMING)
// =========================================================
const statusPillInit = document.getElementById('status-pill');
if (statusPillInit) statusPillInit.textContent = 'Đang tải phòng khách ven hồ...';
const assetLoader = new HybridAssetLoader();
// Phase 1 preload: Living Room core & terrace
const preloadReport = await assetLoader.preloadPhase1();

const envResult = buildAlpineEnvironment(isMobileDevice, assetLoader);
// Keep 3D yard, pine trees, stepping stones & shoreline active as real world-space landmarks!
envResult.group.visible = true;
scene.add(envResult.group);

const { mesh: waterMesh, uniforms: waterUniforms } = createAlpineWater(sunDir, -0.35);
waterMesh.visible = true;
scene.add(waterMesh);

const grassField = createInstancedGrass({
  count: isMobileDevice ? 2600 : 5800,
  getGroundHeight,
  isForbidden: isGardenGrassForbidden,
});
grassField.mesh.visible = true;
scene.add(grassField.mesh);

const chalet = buildSwissChalet(assetLoader);
scene.add(chalet.group);

// Background streaming for Phase 2: Kitchen, Bedroom, Bathroom & Decorative props
let phase2Promise: Promise<void> | null = null;
let phase2Done = false;
const waitPhase2 = async (): Promise<void> => {
  if (phase2Promise) await phase2Promise;
};

phase2Promise = (async () => {
  const p2Report = await assetLoader.preloadPhase2();
  preloadReport.loaded.push(...p2Report.loaded);
  preloadReport.missing.push(...p2Report.missing);
  chalet.populateSecondaryRooms(assetLoader);
  phase2Done = true;
  updateStatus();
})();

// Keep interior wall/glass boundaries & furniture colliders active so character stays cleanly inside
const allColliders = [
  ...chalet.colliders,
  { minX: -4.6, maxX: 4.6, minZ: 4.95, maxZ: 5.5, tag: 'interior-glass-front' },
];

// =========================================================
// 4. PLAYABLE CHARACTER & DECORATION PLACEMENT
// =========================================================
const player = new PlayerController();
scene.add(player.mesh);

const decorManager = new DecorationManager(
  [
    { zone: 'interior', mesh: chalet.interiorSurface },
    { zone: 'deck', mesh: chalet.deckSurface },
    { zone: 'garden', mesh: envResult.gardenSurface },
  ],
  allColliders,
  assetLoader
);
scene.add(decorManager.container);

// =========================================================
// 5. PER-ROOM FULL 360° BOUNDED INTERIOR ORBIT + 3/4 CUTAWAY + CHARACTER
// =========================================================
interface RoomOrbitPreset {
  target: THREE.Vector3;
  defaultAz: number;
  defaultEl: number;
  defaultDist: number;
  elMin: number;
  elMax: number;
  distMin: number;
  distMax: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  rxFactor: number;
  rzFactor: number;
}

const ROOM_PRESETS: Record<'overview' | 'kitchen' | 'bedroom' | 'bathroom', RoomOrbitPreset> = {
  overview: {
    target: new THREE.Vector3(0.15, 1.52, 2.05),
    defaultAz: THREE.MathUtils.degToRad(-46),
    defaultEl: THREE.MathUtils.degToRad(5.0),
    defaultDist: 3.65,
    elMin: THREE.MathUtils.degToRad(-6),
    elMax: THREE.MathUtils.degToRad(26),
    distMin: 1.85,
    distMax: 4.10,
    bounds: { minX: -3.55, maxX: 3.75, minY: 1.02, maxY: 3.30, minZ: 0.25, maxZ: 4.65 },
    rxFactor: 0.85,
    rzFactor: 0.95,
  },
  kitchen: {
    target: new THREE.Vector3(-0.35, 1.48, -2.05),
    defaultAz: THREE.MathUtils.degToRad(-38),
    defaultEl: THREE.MathUtils.degToRad(6.0),
    defaultDist: 3.15,
    elMin: THREE.MathUtils.degToRad(-6),
    elMax: THREE.MathUtils.degToRad(28),
    distMin: 1.65,
    distMax: 3.75,
    bounds: { minX: -3.65, maxX: 3.65, minY: 1.05, maxY: 3.30, minZ: -3.85, maxZ: -0.35 },
    rxFactor: 0.90,
    rzFactor: 0.85,
  },
  bedroom: {
    target: new THREE.Vector3(2.25, 1.52, -7.85),
    defaultAz: THREE.MathUtils.degToRad(-155),
    defaultEl: THREE.MathUtils.degToRad(4.5),
    defaultDist: 3.15,
    elMin: THREE.MathUtils.degToRad(-8),
    elMax: THREE.MathUtils.degToRad(28),
    distMin: 1.65,
    distMax: 3.85,
    bounds: { minX: 0.45, maxX: 3.95, minY: 1.05, maxY: 3.30, minZ: -10.90, maxZ: -4.85 },
    rxFactor: 0.72,
    rzFactor: 0.85,
  },
  bathroom: {
    target: new THREE.Vector3(-1.85, 1.38, -8.60),
    defaultAz: THREE.MathUtils.degToRad(128),
    defaultEl: THREE.MathUtils.degToRad(8.0),
    defaultDist: 2.85,
    elMin: THREE.MathUtils.degToRad(-8),
    elMax: THREE.MathUtils.degToRad(28),
    distMin: 1.55,
    distMax: 3.50,
    bounds: { minX: -3.95, maxX: -0.45, minY: 1.05, maxY: 3.30, minZ: -10.90, maxZ: -4.85 },
    rxFactor: 0.72,
    rzFactor: 0.85,
  },
};

function getHomeBaseFov(): number {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  return aspect < 1.0 ? 68 : 60;
}

let currentMode: ViewMode = 'overview';

// Damped spherical orbit inside active room (0 wall clipping, true 3D parallax!)
let homeAzimuth = ROOM_PRESETS.overview.defaultAz;
let homeElevation = ROOM_PRESETS.overview.defaultEl;
let homeDist = ROOM_PRESETS.overview.defaultDist;
let targetHomeAzimuth = homeAzimuth;
let targetHomeElevation = homeElevation;
let targetHomeDist = homeDist;

// Smooth ~0.65s easing transitions (Mode switches & Reset View)
let transitionT = 1.0;
let transitionStartMs = 0;
const TRANSITION_DURATION = 0.65;
const transitionFromPos = new THREE.Vector3();
const transitionFromQuat = new THREE.Quaternion();
const transitionToPos = new THREE.Vector3();
const transitionToQuat = new THREE.Quaternion();
let transitionFromFov = 60;
let transitionToFov = 60;
const _tmpMat = new THREE.Matrix4();

// Character follow camera state (Mode C)
let charCamYaw = 2.78;
let charCamPitch = 0.16;
let charCamDist = 2.45;
const CHAR_CAM_FOV = 52;

// 3/4 Elevated Cutaway Camera state (Mode B: view34 — scaled for 16.8m full luxury villa)
const VIEW34_TARGET = new THREE.Vector3(0.0, 1.35, -2.6);
let view34Azimuth = THREE.MathUtils.degToRad(-35);
let view34Elevation = THREE.MathUtils.degToRad(34);
let view34Dist = 18.2;
let targetView34Azimuth = view34Azimuth;
let targetView34Elevation = view34Elevation;
let targetView34Dist = view34Dist;
const VIEW34_AZ_MIN = THREE.MathUtils.degToRad(-75);
const VIEW34_AZ_MAX = THREE.MathUtils.degToRad(75);
const VIEW34_EL_MIN = THREE.MathUtils.degToRad(20);
const VIEW34_EL_MAX = THREE.MathUtils.degToRad(60);
const VIEW34_FOV = 50;

let isDraggingCam = false;
let lastPointerX = 0;
let lastPointerY = 0;

function computeView34Pose(
  az: number,
  el: number,
  dist: number,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion
): void {
  // Centered around -Z looking toward +Z lake & Alps (az=0 -> due -Z looking +Z)
  const hDist = Math.cos(el) * dist;
  outPos.set(
    VIEW34_TARGET.x - Math.sin(az) * hDist,
    VIEW34_TARGET.y + Math.sin(el) * dist,
    VIEW34_TARGET.z - Math.cos(az) * hDist
  );
  _tmpMat.lookAt(outPos, VIEW34_TARGET, camera.up);
  outQuat.setFromRotationMatrix(_tmpMat);
}

function computeCharacterCameraPose(outPos: THREE.Vector3, outQuat: THREE.Quaternion): void {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const distBoost = aspect < 1.0 ? 1.0 + (1.0 - aspect) * 0.22 : 1.0;
  const effDist = charCamDist * distBoost;

  const rightX = Math.cos(charCamYaw);
  const rightZ = -Math.sin(charCamYaw);
  const target = new THREE.Vector3(
    player.position.x + rightX * 0.42,
    player.position.y + 1.18,
    player.position.z + rightZ * 0.42
  );
  const offsetX = Math.sin(charCamYaw) * Math.cos(charCamPitch) * effDist;
  const offsetY = Math.sin(charCamPitch) * effDist + 0.24;
  const offsetZ = Math.cos(charCamYaw) * Math.cos(charCamPitch) * effDist;

  // Respect spine wall if character enters Master Bedroom (x > 0) or Spa Bathroom (x < 0)
  let minXClamp = -3.92;
  let maxXClamp = 3.92;
  let minZClamp = -10.85;
  let maxZClamp = 4.65;
  if (player.position.z < -4.3) {
    minZClamp = -10.90;
    if (player.position.x >= 0) {
      minXClamp = 0.38;
    } else {
      maxXClamp = -0.38;
    }
  }

  outPos.set(
    THREE.MathUtils.clamp(target.x + offsetX, minXClamp, maxXClamp),
    THREE.MathUtils.clamp(target.y + offsetY, 0.92, 3.25),
    THREE.MathUtils.clamp(target.z + offsetZ, minZClamp, maxZClamp)
  );
  _tmpMat.lookAt(outPos, target, camera.up);
  outQuat.setFromRotationMatrix(_tmpMat);
}

function getActiveRoomPreset(): RoomOrbitPreset {
  if (currentMode === 'kitchen' || currentMode === 'bedroom' || currentMode === 'bathroom') {
    return ROOM_PRESETS[currentMode];
  }
  return ROOM_PRESETS.overview;
}

function computeHomeOrbitPose(
  az: number,
  el: number,
  dist: number,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion
): void {
  const room = getActiveRoomPreset();
  const rx = dist * room.rxFactor;
  const rz = dist * room.rzFactor;
  const cosEl = Math.cos(el);
  outPos.set(
    THREE.MathUtils.clamp(room.target.x - Math.sin(az) * cosEl * rx, room.bounds.minX, room.bounds.maxX),
    THREE.MathUtils.clamp(room.target.y + Math.sin(el) * dist, room.bounds.minY, room.bounds.maxY),
    THREE.MathUtils.clamp(room.target.z - Math.cos(az) * cosEl * rz, room.bounds.minZ, room.bounds.maxZ)
  );
  _tmpMat.lookAt(outPos, room.target, camera.up);
  outQuat.setFromRotationMatrix(_tmpMat);
}

function clampHomeTargets(): void {
  const room = getActiveRoomPreset();
  targetHomeElevation = THREE.MathUtils.clamp(targetHomeElevation, room.elMin, room.elMax);
  targetHomeDist = THREE.MathUtils.clamp(targetHomeDist, room.distMin, room.distMax);
}

function resetHomeView(instant = false): void {
  if (currentMode === 'view34') {
    chalet.setCutaway(true);
    targetView34Azimuth = THREE.MathUtils.degToRad(-35);
    targetView34Elevation = THREE.MathUtils.degToRad(34);
    targetView34Dist = 18.2;
    const destPos = new THREE.Vector3();
    const destQuat = new THREE.Quaternion();
    computeView34Pose(targetView34Azimuth, targetView34Elevation, targetView34Dist, destPos, destQuat);
    if (instant) {
      view34Azimuth = targetView34Azimuth;
      view34Elevation = targetView34Elevation;
      view34Dist = targetView34Dist;
      camera.position.copy(destPos);
      camera.quaternion.copy(destQuat);
      camera.fov = VIEW34_FOV;
      camera.updateProjectionMatrix();
      transitionT = 1.0;
    } else {
      transitionFromPos.copy(camera.position);
      transitionFromQuat.copy(camera.quaternion);
      transitionFromFov = camera.fov;
      transitionToPos.copy(destPos);
      transitionToQuat.copy(destQuat);
      transitionToFov = VIEW34_FOV;
      view34Azimuth = targetView34Azimuth;
      view34Elevation = targetView34Elevation;
      view34Dist = targetView34Dist;
      transitionStartMs = performance.now();
      transitionT = 0.0;
    }
    updateStatus();
    return;
  }

  const targetRoomMode: 'overview' | 'kitchen' | 'bedroom' | 'bathroom' =
    currentMode === 'kitchen' || currentMode === 'bedroom' || currentMode === 'bathroom'
      ? currentMode
      : 'overview';
  currentMode = targetRoomMode;
  chalet.setCutaway(false);
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === targetRoomMode);
  });
  document.getElementById('mobile-controls')!.classList.add('hidden');

  const room = ROOM_PRESETS[targetRoomMode];
  targetHomeAzimuth = room.defaultAz;
  targetHomeElevation = room.defaultEl;
  targetHomeDist = room.defaultDist;
  const baseFov = getHomeBaseFov();
  const destPos = new THREE.Vector3();
  const destQuat = new THREE.Quaternion();
  computeHomeOrbitPose(room.defaultAz, room.defaultEl, room.defaultDist, destPos, destQuat);

  if (instant) {
    homeAzimuth = room.defaultAz;
    homeElevation = room.defaultEl;
    homeDist = room.defaultDist;
    camera.position.copy(destPos);
    camera.quaternion.copy(destQuat);
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
    transitionT = 1.0;
  } else {
    transitionFromPos.copy(camera.position);
    transitionFromQuat.copy(camera.quaternion);
    transitionFromFov = camera.fov;
    transitionToPos.copy(destPos);
    transitionToQuat.copy(destQuat);
    transitionToFov = baseFov;
    homeAzimuth = room.defaultAz;
    homeElevation = room.defaultEl;
    homeDist = room.defaultDist;
    transitionStartMs = performance.now();
    transitionT = 0.0;
  }
  updateStatus();
}

function switchView(mode: ViewMode, instant = false): void {
  const normalized: ViewMode =
    mode === 'character' || mode === 'view34' || mode === 'kitchen' || mode === 'bedroom' || mode === 'bathroom'
      ? mode
      : 'overview';
  const prevMode = currentMode;
  currentMode = normalized;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === normalized);
  });

  const mobileControls = document.getElementById('mobile-controls')!;
  player.mesh.visible = normalized === 'character';
  if (normalized === 'character') {
    chalet.setCutaway(false);
    mobileControls.classList.toggle('hidden', !isMobileDevice && window.innerWidth > 900);
    const destPos = new THREE.Vector3();
    const destQuat = new THREE.Quaternion();
    computeCharacterCameraPose(destPos, destQuat);
    if (instant) {
      camera.position.copy(destPos);
      camera.quaternion.copy(destQuat);
      camera.fov = CHAR_CAM_FOV;
      camera.updateProjectionMatrix();
      transitionT = 1.0;
    } else if (prevMode !== 'character') {
      transitionFromPos.copy(camera.position);
      transitionFromQuat.copy(camera.quaternion);
      transitionFromFov = camera.fov;
      transitionToPos.copy(destPos);
      transitionToQuat.copy(destQuat);
      transitionToFov = CHAR_CAM_FOV;
      transitionStartMs = performance.now();
      transitionT = 0.0;
    }
    updateStatus();
    return;
  }

  if (normalized === 'view34') {
    chalet.setCutaway(true);
    mobileControls.classList.add('hidden');
    resetHomeView(instant);
    return;
  }

  // Switching to Room Interior Orbit (overview | kitchen | bedroom | bathroom)
  chalet.setCutaway(false);
  mobileControls.classList.add('hidden');
  resetHomeView(instant);
}

function updateCharacterCamera(lerpAlpha: number): void {
  const destPos = new THREE.Vector3();
  const destQuat = new THREE.Quaternion();
  computeCharacterCameraPose(destPos, destQuat);
  camera.position.lerp(destPos, lerpAlpha);
  camera.quaternion.slerp(destQuat, lerpAlpha);
  if (Math.abs(camera.fov - CHAR_CAM_FOV) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, CHAR_CAM_FOV, lerpAlpha);
    camera.updateProjectionMatrix();
  }
}

// =========================================================
// 6. QUALITY TIERS & AUTOMATIC LOW-FPS THERMAL GUARD
// =========================================================
const selectQuality = document.getElementById('select-quality') as HTMLSelectElement;
let currentQuality: QualityPreset = isMobileDevice ? 'balanced' : 'high';
let autoScaleLevel = 0; // 0 = full preset, 1 = stepped-down DPR/grass, 2 = ultra-safe thermal mode
let lastFpsSample = 60;

function applyQuality(preset: QualityPreset, scaleLevel = autoScaleLevel): void {
  currentQuality = preset;
  const isHigh = preset === 'high' && scaleLevel === 0;

  let dprCap = preset === 'high' ? 2.0 : 1.35;
  if (scaleLevel === 1) dprCap = Math.min(dprCap, 1.05);
  if (scaleLevel >= 2) dprCap = 0.85;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const shadowActive = scaleLevel < 2;
  renderer.shadowMap.enabled = shadowActive;
  sunLight.castShadow = shadowActive;
  const targetShadow = preset === 'high' && scaleLevel === 0 ? 2048 : 1024;
  if (sunLight.shadow.mapSize.x !== targetShadow) {
    sunLight.shadow.mapSize.set(targetShadow, targetShadow);
    sunLight.shadow.map?.dispose();
    sunLight.shadow.map = null;
  }

  waterUniforms.uHighQuality.value = isHigh ? 1.0 : 0.0;
  envResult.setHighDetail(isHigh);

  const grassTarget =
    scaleLevel >= 2 ? 1200 : scaleLevel === 1 ? 1800 : preset === 'high' ? 5800 : 2600;
  grassField.rebuild(grassTarget);
}

selectQuality.value = currentQuality;
applyQuality(currentQuality, 0);
selectQuality.addEventListener('change', () => {
  autoScaleLevel = 0;
  applyQuality(selectQuality.value as QualityPreset, 0);
  updateStatus();
});

// =========================================================
// 7. UI, INTERACTIONS, TOUCH PINCH & DECORATE EVENTS
// =========================================================
const btnDecorate = document.getElementById('btn-decorate')!;
const decoratePanel = document.getElementById('decorate-panel')!;
const btnCloseDecorate = document.getElementById('btn-close-decorate')!;
const decorateItemsGrid = document.getElementById('decorate-items')!;
const btnDoor = document.getElementById('btn-door')!;
const btnLights = document.getElementById('btn-lights')!;
const statusPill = document.getElementById('status-pill')!;

let lightsOn = true;

PLACEABLE_ITEMS.forEach((item, idx) => {
  const card = document.createElement('button');
  card.className = `item-card ${idx === 0 ? 'selected' : ''}`;
  card.innerHTML = `<span class="item-emoji">${item.emoji}</span><span>${item.name}</span>`;
  card.addEventListener('click', () => {
    document.querySelectorAll('.item-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    decorManager.selectItem(item.id);
  });
  decorateItemsGrid.appendChild(card);
});

document.querySelectorAll<HTMLButtonElement>('.scale-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.scale-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    decorManager.setScale(Number(btn.dataset.scale || 1));
  });
});

function toggleDecorate(force?: boolean): void {
  const next = force ?? !decorManager.active;
  decorManager.setActive(next);
  btnDecorate.classList.toggle('active', next);
  decoratePanel.classList.toggle('hidden', !next);
  updateStatus();
}

btnDecorate.addEventListener('click', () => toggleDecorate());
btnCloseDecorate.addEventListener('click', () => toggleDecorate(false));
document.getElementById('btn-rotate-item')!.addEventListener('click', () => decorManager.rotatePreview());
document.getElementById('btn-delete-selected')!.addEventListener('click', () => {
  if (decorManager.deleteSelected()) updateStatus();
});
document.getElementById('btn-clear-items')!.addEventListener('click', () => {
  decorManager.clearAll();
  updateStatus();
});

function toggleDoors(): void {
  const next = !chalet.getDoorsOpen();
  chalet.setDoorsOpen(next);
  btnDoor.textContent = `🚪 Cửa kính: ${next ? 'Mở' : 'Đóng'}`;
}

function toggleLights(): void {
  lightsOn = !lightsOn;
  chalet.setLightsEnabled(lightsOn);
  btnLights.classList.toggle('active', lightsOn);
  btnLights.textContent = lightsOn ? '🔥 Đèn & Lửa' : '🌙 Tắt đèn';
}

btnDoor.addEventListener('click', toggleDoors);
btnLights.addEventListener('click', toggleLights);
btnLights.classList.add('active');

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view as ViewMode);
  });
});

document.getElementById('btn-reset-view')!.addEventListener('click', () => {
  resetHomeView(false);
});

const hudTop = document.querySelector('.hud-top')!;
const hudBottom = document.getElementById('hud-bottom')!;
const btnRestoreHud = document.getElementById('btn-restore-hud')!;
document.getElementById('btn-toggle-hud')!.addEventListener('click', () => {
  hudTop.classList.add('hidden');
  hudBottom.classList.add('hidden');
  decoratePanel.classList.add('hidden');
  btnRestoreHud.classList.remove('hidden');
});
btnRestoreHud.addEventListener('click', () => {
  hudTop.classList.remove('hidden');
  hudBottom.classList.remove('hidden');
  if (decorManager.active) decoratePanel.classList.remove('hidden');
  btnRestoreHud.classList.add('hidden');
});

let pointerDownPos = { x: 0, y: 0 };
let activeTouchCount = 0;

canvas.addEventListener('pointermove', (e) => {
  if (decorManager.active) {
    decorManager.updatePointer(e.clientX, e.clientY, canvas, camera);
  }
  if (!isDraggingCam || activeTouchCount > 1) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;

  if (currentMode === 'character') {
    charCamYaw -= dx * 0.006;
    charCamPitch = THREE.MathUtils.clamp(charCamPitch + dy * 0.005, 0.06, 0.72);
  } else if (currentMode === 'view34') {
    transitionT = 1.0;
    targetView34Azimuth = THREE.MathUtils.clamp(
      targetView34Azimuth - dx * 0.0045,
      VIEW34_AZ_MIN,
      VIEW34_AZ_MAX
    );
    targetView34Elevation = THREE.MathUtils.clamp(
      targetView34Elevation + dy * 0.0035,
      VIEW34_EL_MIN,
      VIEW34_EL_MAX
    );
  } else {
    transitionT = 1.0; // Cancel any active reset animation on manual orbit
    targetHomeAzimuth -= dx * 0.0044;
    targetHomeElevation += dy * 0.0034;
    clampHomeTargets();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  if (e.button === 0 && e.isPrimary) {
    isDraggingCam = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (e.isPrimary) isDraggingCam = false;
  const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (moved < 8 && e.button === 0 && decorManager.active) {
    decorManager.handleLeftClick(e.clientX, e.clientY, canvas, camera);
    updateStatus();
  }
});

canvas.addEventListener('pointercancel', () => {
  isDraggingCam = false;
});

canvas.addEventListener('contextmenu', (e) => {
  if (!decorManager.active) return;
  e.preventDefault();
  if (decorManager.tryRemoveAtPointer(e.clientX, e.clientY, canvas, camera)) {
    updateStatus();
  }
});

canvas.addEventListener(
  'wheel',
  (e) => {
    if (currentMode === 'character') {
      charCamDist = THREE.MathUtils.clamp(charCamDist + e.deltaY * 0.003, 1.8, 3.8);
    } else if (currentMode === 'view34') {
      transitionT = 1.0;
      targetView34Dist = THREE.MathUtils.clamp(targetView34Dist + e.deltaY * 0.008, 10.5, 24.0);
    } else {
      transitionT = 1.0;
      targetHomeDist += e.deltaY * 0.0022;
      clampHomeTargets();
    }
  },
  { passive: true }
);

// Pinch-to-zoom for Home View (optical FOV) & Character Mode on Mobile Touch Screens
let pinchStartDist = 0;
canvas.addEventListener(
  'touchstart',
  (e) => {
    activeTouchCount = e.touches.length;
    if (e.touches.length === 2) {
      isDraggingCam = false;
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  },
  { passive: true }
);
canvas.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length === 2 && pinchStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = pinchStartDist - dist;
      pinchStartDist = dist;
      if (currentMode === 'character') {
        charCamDist = THREE.MathUtils.clamp(charCamDist + delta * 0.015, 1.8, 3.8);
      } else if (currentMode === 'view34') {
        transitionT = 1.0;
        targetView34Dist = THREE.MathUtils.clamp(targetView34Dist + delta * 0.04, 9.0, 19.0);
      } else {
        transitionT = 1.0;
        targetHomeDist += delta * 0.012;
        clampHomeTargets();
      }
    }
  },
  { passive: true }
);
canvas.addEventListener(
  'touchend',
  (e) => {
    activeTouchCount = e.touches.length;
    if (e.touches.length < 2) pinchStartDist = 0;
  },
  { passive: true }
);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Digit1') switchView('overview');
  if (e.code === 'Digit2') switchView('view34');
  if (e.code === 'Digit3') switchView('character');
  if (e.code === 'KeyR' && !decorManager.active) resetHomeView(false);
  if (e.code === 'KeyE') toggleDoors();
  if (e.code === 'KeyL') toggleLights();
  if (e.code === 'KeyR' && decorManager.active) decorManager.rotatePreview();
  if ((e.code === 'Delete' || e.code === 'Backspace') && decorManager.active) {
    if (decorManager.deleteSelected()) updateStatus();
  }
});

// Mobile Virtual Joystick
const joystickZone = document.getElementById('joystick-zone')!;
const joystickKnob = document.getElementById('joystick-knob')!;
let joyActiveId: number | null = null;

joystickZone.addEventListener('pointerdown', (e) => {
  joyActiveId = e.pointerId;
  joystickZone.setPointerCapture(e.pointerId);
});
joystickZone.addEventListener('pointermove', (e) => {
  if (joyActiveId !== e.pointerId) return;
  const rect = joystickZone.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const maxR = 36;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const clamped = Math.min(len, maxR);
  const nx = (dx / len) * (clamped / maxR);
  const ny = (dy / len) * (clamped / maxR);
  joystickKnob.style.transform = `translate(${nx * maxR}px, ${ny * maxR}px)`;
  player.joystickInput.set(nx, -ny);
});
const resetJoy = () => {
  joyActiveId = null;
  joystickKnob.style.transform = 'translate(0px, 0px)';
  player.joystickInput.set(0, 0);
};
joystickZone.addEventListener('pointerup', resetJoy);
joystickZone.addEventListener('pointercancel', resetJoy);

document.getElementById('btn-mobile-jump')!.addEventListener('click', () => player.triggerJump());
document.getElementById('btn-mobile-interact')!.addEventListener('click', toggleDoors);

// =========================================================
// 8. RESIZE, STATUS & VERIFICATION API
// =========================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
  if (currentMode === 'overview') {
    camera.fov = getHomeBaseFov();
  }
  camera.updateProjectionMatrix();
  applyQuality(currentQuality, autoScaleLevel);
});

function updateStatus(): void {
  const modeLabel: Record<ViewMode, string> = {
    overview: 'Phòng khách',
    kitchen: 'Bếp & Ăn',
    bedroom: 'Phòng ngủ',
    bathroom: 'Phòng tắm',
    view34: 'Góc 3/4',
    garden: 'Vườn',
    lake: 'Hồ',
    character: 'Nhân vật',
  };
  const phase2Txt = phase2Done ? '' : ' | Tải chi tiết...';
  const decorTxt = decorManager.active ? ' | Đặt đồ' : '';
  const scaleTxt = autoScaleLevel > 0 ? ` | Auto-${autoScaleLevel}` : '';
  statusPill.textContent = `${modeLabel[currentMode]}${decorTxt}${scaleTxt}${phase2Txt} | Đồ: ${decorManager.getCount()}`;
}

(window as unknown as Record<string, unknown>).__CHALET_API__ = {
  switchView: (m: ViewMode) => switchView(m, true),
  resetView: (instant = false) => resetHomeView(instant),
  waitPhase2: () => waitPhase2(),
  isPhase2Loaded: () => phase2Done,
  setHomeLook: (azDeg: number, elDeg = 4.5, dist?: number, roomMode?: ViewMode) => {
    if (roomMode && (roomMode === 'overview' || roomMode === 'kitchen' || roomMode === 'bedroom' || roomMode === 'bathroom')) {
      currentMode = roomMode;
      document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.view === roomMode);
      });
    } else if (currentMode === 'view34' || currentMode === 'character') {
      currentMode = 'overview';
    }
    chalet.setCutaway(false);
    player.mesh.visible = false;
    transitionT = 1.0;
    targetHomeAzimuth = THREE.MathUtils.degToRad(azDeg);
    targetHomeElevation = THREE.MathUtils.degToRad(elDeg);
    if (typeof dist === 'number') targetHomeDist = dist;
    clampHomeTargets();
    homeAzimuth = targetHomeAzimuth;
    homeElevation = targetHomeElevation;
    homeDist = targetHomeDist;
    const destP = new THREE.Vector3();
    const destQ = new THREE.Quaternion();
    computeHomeOrbitPose(homeAzimuth, homeElevation, homeDist, destP, destQ);
    camera.position.copy(destP);
    camera.quaternion.copy(destQ);
    camera.fov = getHomeBaseFov();
    camera.updateProjectionMatrix();
  },
  setView34: (azDeg: number, elDeg = 34, dist = 18.2) => {
    currentMode = 'view34';
    chalet.setCutaway(true);
    transitionT = 1.0;
    targetView34Azimuth = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(azDeg), VIEW34_AZ_MIN, VIEW34_AZ_MAX);
    targetView34Elevation = THREE.MathUtils.clamp(THREE.MathUtils.degToRad(elDeg), VIEW34_EL_MIN, VIEW34_EL_MAX);
    targetView34Dist = THREE.MathUtils.clamp(dist, 10.5, 24.0);
    view34Azimuth = targetView34Azimuth;
    view34Elevation = targetView34Elevation;
    view34Dist = targetView34Dist;
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    computeView34Pose(view34Azimuth, view34Elevation, view34Dist, p, q);
    camera.position.copy(p);
    camera.quaternion.copy(q);
    camera.fov = VIEW34_FOV;
    camera.updateProjectionMatrix();
  },
  getCameraState: () => ({
    mode: currentMode,
    pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    fov: camera.fov,
    azDeg: THREE.MathUtils.radToDeg(homeAzimuth),
    elDeg: THREE.MathUtils.radToDeg(homeElevation),
    dist: homeDist,
  }),
  getCameraPos: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
  toggleDoors,
  toggleLights,
  setDecorate: (v: boolean) => toggleDecorate(v),
  setQuality: (q: QualityPreset) => {
    autoScaleLevel = 0;
    selectQuality.value = q;
    applyQuality(q, 0);
  },
  getPlayerPos: () => ({ x: player.position.x, y: player.position.y, z: player.position.z }),
  movePlayerTo: (x: number, z: number) => {
    player.position.set(x, player.getSupportHeight(x, z), z);
    player.mesh.position.copy(player.position);
  },
  getPerfStats: () => ({
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0,
    fps: Math.round(lastFpsSample),
    qualityMode: currentQuality,
    autoScaleLevel,
    loadedGltfModels: preloadReport.loaded,
    missingOptionalModels: preloadReport.missing,
  }),
  hideHud: () => {
    hudTop.classList.add('hidden');
    hudBottom.classList.add('hidden');
    decoratePanel.classList.add('hidden');
  },
  showHud: () => {
    hudTop.classList.remove('hidden');
    hudBottom.classList.remove('hidden');
  },
};

switchView('overview', true);

// =========================================================
// 9. ANIMATION LOOP & AUTO-FPS THERMAL THROTTLE
// =========================================================
const clock = new THREE.Clock();
let fpsWindowFrames = 0;
let fpsWindowTime = 0;
let consecutiveLowWindows = 0;
let lastThrottleTime = 0;

function animate(): void {
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  const elapsed = clock.elapsedTime;

  // Rolling FPS window (2.5s) with hysteresis & 8s cooldown to prevent oscillation
  fpsWindowFrames++;
  fpsWindowTime += rawDt;
  if (fpsWindowTime >= 2.5) {
    lastFpsSample = fpsWindowFrames / fpsWindowTime;
    fpsWindowFrames = 0;
    fpsWindowTime = 0;

    // Only auto-throttle on genuine sustained lag after initial startup settle (> 12s)
    if (elapsed > 12.0 && lastFpsSample < 24 && autoScaleLevel < 2 && elapsed - lastThrottleTime > 8.0) {
      consecutiveLowWindows++;
      if (consecutiveLowWindows >= 2) {
        autoScaleLevel++;
        consecutiveLowWindows = 0;
        lastThrottleTime = elapsed;
        applyQuality(currentQuality, autoScaleLevel);
        updateStatus();
      }
    } else if (lastFpsSample >= 30) {
      consecutiveLowWindows = 0;
    }
  }

  // Update shaders & door animation
  skyUniforms.uTime.value = elapsed;
  waterUniforms.uTime.value = elapsed;
  grassField.uniforms.uTime.value = elapsed;
  chalet.fireplaceUniforms.uTime.value = elapsed;
  chalet.updateDoors(dt);

  // Update playable character
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const activeCamYaw = Math.atan2(-camDir.x, -camDir.z);
  player.update(dt, currentMode === 'character' ? charCamYaw : activeCamYaw, allColliders);

  // Smooth transitions & damped Fixed View / Character Follow cameras
  if (transitionT < 1.0) {
    transitionT = Math.min(1.0, (performance.now() - transitionStartMs) / (TRANSITION_DURATION * 1000));
    const ease = transitionT < 0.5
      ? 4 * transitionT * transitionT * transitionT
      : 1 - Math.pow(-2 * transitionT + 2, 3) / 2;

    if (currentMode === 'character') {
      computeCharacterCameraPose(transitionToPos, transitionToQuat);
    }
    camera.position.lerpVectors(transitionFromPos, transitionToPos, ease);
    camera.quaternion.slerpQuaternions(transitionFromQuat, transitionToQuat, ease);
    camera.fov = THREE.MathUtils.lerp(transitionFromFov, transitionToFov, ease);
    camera.updateProjectionMatrix();
  } else if (currentMode === 'character') {
    updateCharacterCamera(Math.min(1, dt * 8.5));
  } else if (currentMode === 'view34') {
    const damp = 1 - Math.exp(-9 * dt);
    view34Azimuth = THREE.MathUtils.lerp(view34Azimuth, targetView34Azimuth, damp);
    view34Elevation = THREE.MathUtils.lerp(view34Elevation, targetView34Elevation, damp);
    view34Dist = THREE.MathUtils.lerp(view34Dist, targetView34Dist, damp);
    const destP = new THREE.Vector3();
    const destQ = new THREE.Quaternion();
    computeView34Pose(view34Azimuth, view34Elevation, view34Dist, destP, destQ);
    camera.position.copy(destP);
    camera.quaternion.copy(destQ);
    if (Math.abs(camera.fov - VIEW34_FOV) > 0.05) {
      camera.fov = VIEW34_FOV;
      camera.updateProjectionMatrix();
    }
  } else {
    const damp = 1 - Math.exp(-10 * dt);
    homeAzimuth = THREE.MathUtils.lerp(homeAzimuth, targetHomeAzimuth, damp);
    homeElevation = THREE.MathUtils.lerp(homeElevation, targetHomeElevation, damp);
    homeDist = THREE.MathUtils.lerp(homeDist, targetHomeDist, damp);

    const destP = new THREE.Vector3();
    const destQ = new THREE.Quaternion();
    computeHomeOrbitPose(homeAzimuth, homeElevation, homeDist, destP, destQ);
    camera.position.copy(destP);
    camera.quaternion.copy(destQ);
    const targetFov = getHomeBaseFov();
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }

  backdrop25D.updateParallax(camera.position, elapsed);
  renderer.render(scene, camera);
}

animate();
