import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { createAlpineSkyDome } from './shaders/skyShader';
import { createVillageAlpineBackdrop25D } from './shaders/backdrop25D';
import { createAlpineEnvironmentMap } from './shaders/envMap';
import { buildSwissVillage } from './world/VillageBuilder';
import { VillageEditor } from './world/VillageEditor';
import { PlayerController } from './world/PlayerController';
import { AABBCollider } from './types';

const isMobile =
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;

// =========================================================
// 1. RENDERER & SCENE SETUP (AgX Tone Mapping + Soft Shadows)
// =========================================================
const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobile,
  powerPreference: 'high-performance',
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.04;

const scene = new THREE.Scene();
// Alpine azure sky background fallback ensuring no black or white void ever appears
scene.background = new THREE.Color('#94c4ec');
scene.fog = null;

const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.2, 750);
camera.rotation.order = 'YXZ';

// =========================================================
// 2. SUNLIGHT, SKY & 2.5D CYLINDRICAL ALPINE BACKDROP
// =========================================================
// Warm golden morning sun angled diagonally across the plaza
const sunDir = new THREE.Vector3(0.62, 0.48, 0.62).normalize();

const fallbackEnv = createAlpineEnvironmentMap(renderer, sunDir);
scene.environment = fallbackEnv;
scene.environmentIntensity = 0.45;

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
  () => {}
);

// Procedural high-altitude Swiss sky dome
const { mesh: skyMesh, uniforms: skyUniforms } = createAlpineSkyDome(sunDir);
scene.add(skyMesh);

// 2.5D Physical Cylindrical Panorama with 100% Real Photographs
const backdrop25D = createVillageAlpineBackdrop25D(sunDir);
scene.add(backdrop25D.group);

// Sun Directional Light with Soft Shadows
const sunLight = new THREE.DirectionalLight('#ffe5b8', 3.6);
sunLight.position.copy(sunDir).multiplyScalar(65);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
sunLight.shadow.camera.near = 15;
sunLight.shadow.camera.far = 140;
sunLight.shadow.camera.left = -32;
sunLight.shadow.camera.right = 32;
sunLight.shadow.camera.top = 32;
sunLight.shadow.camera.bottom = -32;
sunLight.shadow.bias = -0.00035;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

// Hemisphere fill & ambient bounce
const hemiLight = new THREE.HemisphereLight('#a4ccfa', '#5c4328', 0.48);
scene.add(hemiLight);

const ambientFill = new THREE.DirectionalLight('#ffd6a5', 0.35);
ambientFill.position.set(-25, 20, -35);
scene.add(ambientFill);

// =========================================================
// 3. BUILD 3D SWISS ALPINE VILLAGE SCENE
// =========================================================
const village = buildSwissVillage();
scene.add(village.group);
const panoramaElement = document.getElementById('village-panorama');

// =========================================================
// 4. PLAYABLE CHARACTER & CONTROLLER
// =========================================================
const player = new PlayerController('village');
// Spawn at the southern village entrance road stepping into the grand plaza
player.position.set(0.0, 0.42, -22.0);
player.yaw = Math.PI; // Face +Z (north towards fountain, lake overlook, and Alps)
scene.add(player.mesh);

// Extended village boundaries & collision for 10-chalet grand layout
const villageColliders: AABBCollider[] = village.colliders;
villageColliders.push(
  { minX: -38, maxX: -35, minZ: -45, maxZ: 35, height: 4 }, // West boundary
  { minX: 35, maxX: 38, minZ: -45, maxZ: 35, height: 4 },   // East boundary
  { minX: -36, maxX: 36, minZ: -50, maxZ: -47, height: 4 }  // South entrance road limit
);

(window as any).teleportPlayer = (x: number, z: number, yaw?: number) => {
  player.position.set(x, 0.42, z);
  if (yaw !== undefined) player.yaw = yaw;
};

(window as any).villageReady = false;
village.readyPromise.then(() => {
  console.log('[Village] All 10 distinct chalets and props loaded into scene!');
  (window as any).villageReady = true;
  const statusPill = document.getElementById('status-pill');
  if (statusPill) {
    statusPill.textContent = 'Làng Sống Khỏe 3D (Wellness Village) — 10 Ngôi Nhà & Cảnh Vật Đã Tải';
  }
});

// =========================================================
// 5. CAMERA MODES & VIEWPOINTS
// =========================================================
type VillageViewMode = 'overview' | 'planner' | 'archway' | 'fountain' | 'overlook' | 'character';

interface ViewPreset {
  target: THREE.Vector3;
  defaultAz: number;
  defaultEl: number;
  defaultDist: number;
  elMin: number;
  elMax: number;
  distMin: number;
  distMax: number;
}

const VIEW_PRESETS: Record<Exclude<VillageViewMode, 'character'>, ViewPreset> = {
  overview: {
    // Elevated Hero Perspective: positioned at South, looking North over plaza towards lake and Alps
    target: new THREE.Vector3(0, 1.2, 5.0),
    defaultAz: Math.PI, // Face North directly towards lake and mountains
    defaultEl: THREE.MathUtils.degToRad(22.0), // ~22 deg elevation
    defaultDist: 38.0,
    elMin: THREE.MathUtils.degToRad(12),
    elMax: THREE.MathUtils.degToRad(60), // Allow wide upward tilt
    distMin: 18.0,
    distMax: 85.0, // Expanded wide zoom
  },
  planner: {
    // City Planner / Top-Down God View: elevated steep angle showing the entire village, all 10 chalets & lake
    target: new THREE.Vector3(0, 1.0, 2.0),
    defaultAz: Math.PI,
    defaultEl: THREE.MathUtils.degToRad(52.0), // ~52 deg top-down angle
    defaultDist: 68.0, // High up, shows all 10 chalets, lake, gate, and plaza
    elMin: THREE.MathUtils.degToRad(20),
    elMax: THREE.MathUtils.degToRad(75),
    distMin: 22.0,
    distMax: 105.0, // Zoom out to massive 105m overview!
  },
  archway: {
    target: new THREE.Vector3(0, 2.5, -20.0),
    defaultAz: THREE.MathUtils.degToRad(6),
    defaultEl: THREE.MathUtils.degToRad(15),
    defaultDist: 22.0,
    elMin: THREE.MathUtils.degToRad(10),
    elMax: THREE.MathUtils.degToRad(35),
    distMin: 12.0,
    distMax: 45.0,
  },
  fountain: {
    target: new THREE.Vector3(0, 1.6, 1.0),
    defaultAz: Math.PI - 0.35,
    defaultEl: THREE.MathUtils.degToRad(18),
    defaultDist: 18.0,
    elMin: THREE.MathUtils.degToRad(10),
    elMax: THREE.MathUtils.degToRad(45),
    distMin: 10.0,
    distMax: 45.0,
  },
  overlook: {
    target: new THREE.Vector3(0, 1.6, 27.0),
    defaultAz: Math.PI, // Stand south of balustrade, look North into turquoise lake and mountains
    defaultEl: THREE.MathUtils.degToRad(12),
    defaultDist: 15.0,
    elMin: THREE.MathUtils.degToRad(6),
    elMax: THREE.MathUtils.degToRad(38),
    distMin: 8.0,
    distMax: 45.0,
  },
};

let currentMode: VillageViewMode = 'overview';
village.group.visible = true;
let camAzimuth = VIEW_PRESETS.overview.defaultAz;
let camElevation = VIEW_PRESETS.overview.defaultEl;
let camDist = VIEW_PRESETS.overview.defaultDist;
let targetAzimuth = camAzimuth;
let targetElevation = camElevation;
let targetDist = camDist;

// Character follow camera state
let charCamYaw = Math.PI;
let charCamPitch = 0.22;
let charCamDist = 6.5;
(window as any).setCharCamYaw = (yaw: number) => { charCamYaw = yaw; };

// Camera target interpolation state
const currentCamTarget = new THREE.Vector3().copy(VIEW_PRESETS.overview.target);
const targetCamTarget = new THREE.Vector3().copy(currentCamTarget);

// Smooth camera transition state
let transitionT = 1.0;
let transitionDuration = 0.65;
let transitionStartMs = 0;
const transFromPos = new THREE.Vector3();
const transFromQuat = new THREE.Quaternion();
const transToPos = new THREE.Vector3();
const transToQuat = new THREE.Quaternion();
const _tmpMat = new THREE.Matrix4();

function setCameraMode(mode: VillageViewMode): void {
  // Capture from position & orientation
  transFromPos.copy(camera.position);
  transFromQuat.copy(camera.quaternion);

  currentMode = mode;
  transitionT = 0.0;
  transitionStartMs = performance.now();

  if (mode !== 'character') {
    const p = VIEW_PRESETS[mode];
    targetCamTarget.copy(p.target);
    targetAzimuth = p.defaultAz;
    targetElevation = p.defaultEl;
    targetDist = p.defaultDist;
    camAzimuth = p.defaultAz;
    camElevation = p.defaultEl;
    camDist = p.defaultDist;

    const cx = p.target.x + Math.sin(camAzimuth) * Math.cos(camElevation) * camDist;
    const cy = p.target.y + Math.sin(camElevation) * camDist;
    const cz = p.target.z + Math.cos(camAzimuth) * Math.cos(camElevation) * camDist;
    transToPos.set(cx, cy, cz);
    _tmpMat.lookAt(transToPos, p.target, new THREE.Vector3(0, 1, 0));
    transToQuat.setFromRotationMatrix(_tmpMat);
  } else {
    // Character follow mode initial position
    const charPos = player.position;
    const cx = charPos.x - Math.sin(player.yaw) * charCamDist;
    const cy = charPos.y + 2.8;
    const cz = charPos.z - Math.cos(player.yaw) * charCamDist;
    transToPos.set(cx, cy, cz);
    _tmpMat.lookAt(transToPos, new THREE.Vector3(charPos.x, charPos.y + 1.2, charPos.z), new THREE.Vector3(0, 1, 0));
    transToQuat.setFromRotationMatrix(_tmpMat);
  }

  // Update button active state
  document.querySelectorAll('.view-tabs .hud-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === mode);
  });
}

function focusCameraOn(pos: THREE.Vector3, dist: number, elevation = THREE.MathUtils.degToRad(28)): void {
  targetCamTarget.copy(pos);
  targetDist = dist;
  targetElevation = elevation;
  // If in character mode, switch to planner or overview
  if (currentMode === 'character') {
    currentMode = 'planner';
  }
}

// =========================================================
// 5.5 VILLAGE SANDBOX EDITOR
// =========================================================
const villageEditor = new VillageEditor(
  scene,
  camera,
  village,
  (targetPos, dist) => {
    focusCameraOn(targetPos, dist);
  },
  {
    setMode: (mode: VillageViewMode) => setCameraMode(mode),
    adjustZoom: (delta: number) => {
      const p = VIEW_PRESETS[currentMode];
      targetDist = THREE.MathUtils.clamp(targetDist + delta, p.distMin, p.distMax);
    },
    getCurrentMode: () => currentMode,
  }
);
(window as any).villageEditor = villageEditor;
(window as any).setCameraMode = setCameraMode;
(window as any).adjustCameraZoom = (deltaDist: number) => {
  const p = VIEW_PRESETS[currentMode];
  targetDist = THREE.MathUtils.clamp(targetDist + deltaDist, p.distMin, p.distMax);
};

// =========================================================
// 6. MOUSE & TOUCH ORBIT CONTROLS
// =========================================================
let isDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let pinchStartDist = 0;

canvas.addEventListener('pointerdown', (e) => {
  if (villageEditor.isOpen() && villageEditor.handlePointerDown(e)) {
    return;
  }
  if (e.button === 0) {
    isDragging = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (villageEditor.isOpen() && villageEditor.handlePointerMove(e)) {
    return;
  }
  if (!isDragging) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;

  if (currentMode === 'character') {
    // 360-degree free orbit around character
    charCamYaw -= dx * 0.005;
    charCamPitch = THREE.MathUtils.clamp(charCamPitch + dy * 0.004, -0.05, 0.75);
  } else if (currentMode === 'planner') {
    // Planner top-down perspective with wide tilt & pan
    const p = VIEW_PRESETS.planner;
    targetAzimuth = THREE.MathUtils.clamp(targetAzimuth - dx * 0.003, Math.PI - 0.45, Math.PI + 0.45);
    targetElevation = THREE.MathUtils.clamp(targetElevation + dy * 0.003, p.elMin, p.elMax);
  } else if (currentMode === 'overview') {
    // Overview is locked to the heroic North lake-facing perspective.
    // Subtle parallax pan only (±8.5° max around Math.PI). No 360-degree orbit that exposes void/background edges!
    const p = VIEW_PRESETS.overview;
    targetAzimuth = THREE.MathUtils.clamp(targetAzimuth - dx * 0.002, Math.PI - 0.15, Math.PI + 0.15);
    targetElevation = THREE.MathUtils.clamp(targetElevation + dy * 0.002, p.elMin, p.elMax);
  } else {
    const p = VIEW_PRESETS[currentMode];
    targetAzimuth = THREE.MathUtils.clamp(targetAzimuth - dx * 0.004, p.defaultAz - 0.40, p.defaultAz + 0.40);
    targetElevation = THREE.MathUtils.clamp(targetElevation + dy * 0.003, p.elMin, p.elMax);
  }
});

const endDrag = (e: PointerEvent) => {
  if (villageEditor.isOpen() && villageEditor.handlePointerUp()) {
    // Drag handled
  }
  if (isDragging) {
    isDragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
  }
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.015;
    if (currentMode === 'character') {
      charCamDist = THREE.MathUtils.clamp(charCamDist + zoomDelta, 3.2, 14.0);
    } else {
      const p = VIEW_PRESETS[currentMode];
      targetDist = THREE.MathUtils.clamp(targetDist + zoomDelta, p.distMin, p.distMax);
    }
  },
  { passive: false }
);

// Mobile touch pinch-to-zoom
canvas.addEventListener(
  'touchstart',
  (e) => {
    if (e.touches.length === 2) {
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
      const delta = (pinchStartDist - dist) * 0.04;
      pinchStartDist = dist;
      if (currentMode === 'character') {
        charCamDist = THREE.MathUtils.clamp(charCamDist + delta, 3.2, 14.0);
      } else {
        const p = VIEW_PRESETS[currentMode];
        targetDist = THREE.MathUtils.clamp(targetDist + delta, p.distMin, p.distMax);
      }
    }
  },
  { passive: true }
);

// =========================================================
// 7. VIRTUAL JOYSTICK FOR MOBILE
// =========================================================
const joystickZone = document.getElementById('joystick-zone');
const joystickKnob = document.getElementById('joystick-knob');
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
const joystickMaxRadius = 42;

if (joystickZone && joystickKnob) {
  joystickZone.addEventListener('pointerdown', (e) => {
    joystickActive = true;
    const rect = joystickZone.getBoundingClientRect();
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    joystickZone.setPointerCapture(e.pointerId);
  });

  joystickZone.addEventListener('pointermove', (e) => {
    if (!joystickActive) return;
    const dx = e.clientX - joystickCenter.x;
    const dy = e.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, joystickMaxRadius);

    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;
    joystickKnob.style.transform = `translate(${kx}px, ${ky}px)`;

    player.joystickInput.x = kx / joystickMaxRadius;
    player.joystickInput.y = -ky / joystickMaxRadius;
  });

  const resetJoystick = (e: PointerEvent) => {
    if (joystickActive) {
      joystickActive = false;
      joystickKnob.style.transform = 'translate(0px, 0px)';
      player.joystickInput.set(0, 0);
      try {
        joystickZone.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };
  joystickZone.addEventListener('pointerup', resetJoystick);
  joystickZone.addEventListener('pointercancel', resetJoystick);
}

// =========================================================
// 8. HUD & UI INTERACTION WIRING
// =========================================================
document.querySelectorAll('.view-tabs .hud-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const v = btn.getAttribute('data-view') as VillageViewMode;
    if (v) setCameraMode(v);
  });
});

document.getElementById('btn-reset-view')?.addEventListener('click', () => {
  setCameraMode('overview');
  // Playwright/mobile browsers may auto-scroll the horizontal tab row to reveal
  // this button before the click. Return the camera row to its natural start.
  document.querySelectorAll<HTMLElement>('.view-tabs, .hud-actions').forEach((bar) => {
    bar.scrollLeft = 0;
  });
});

// Toggle Lantern Lights
let lightsOn = true;
document.getElementById('btn-lights')?.addEventListener('click', () => {
  lightsOn = !lightsOn;
  village.lanternLights.forEach((l) => {
    l.intensity = lightsOn ? 2.0 : 0.0;
  });
  const btn = document.getElementById('btn-lights');
  if (btn) btn.textContent = lightsOn ? '🔥 Đèn: Bật' : '🌑 Đèn: Tắt';
});

// Toggle Sandbox Editor
document.getElementById('btn-editor-toggle')?.addEventListener('click', () => {
  villageEditor.toggle();
});

// Status display
const statusPill = document.getElementById('status-pill');
if (statusPill && !statusPill.textContent?.includes('10 Ngôi Nhà')) {
  statusPill.textContent = 'Làng Sống Khỏe 3D (Wellness Village) — Đang tải tài nguyên 3D...';
}

// Show mobile touch controls on mobile devices
if (isMobile) {
  document.getElementById('mobile-controls')?.classList.remove('hidden');
}

// Window resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
  // Do not preserve a desktop horizontal-scroll offset when the HUD collapses
  // into mobile rows; otherwise the first camera/action button can be clipped.
  document.querySelectorAll<HTMLElement>('.view-tabs, .hud-actions').forEach((bar) => {
    bar.scrollLeft = 0;
  });
});

// =========================================================
// 9. ANIMATION & RENDER LOOP
// =========================================================
const clock = new THREE.Clock();
const _camLookTarget = new THREE.Vector3();

function tick(): void {
  requestAnimationFrame(tick);
  const dt = Math.min(0.06, clock.getDelta());
  const now = performance.now();

  // Update village water fountain & props
  village.update(dt);
  villageEditor.update(dt);

  // Skip WASD player movement while typing numbers in editor
  const isTyping =
    document.activeElement &&
    (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'SELECT' ||
      document.activeElement.tagName === 'TEXTAREA');

  // Update player character physics & movement
  if (!isTyping) {
    const cameraYaw = currentMode === 'character' ? charCamYaw : camAzimuth;
    player.update(dt, cameraYaw, villageColliders);
  }

  // Camera animation & transition
  if (transitionT < 1.0) {
    const elapsed = (now - transitionStartMs) / 1000;
    transitionT = Math.min(1.0, elapsed / transitionDuration);
    // Smooth cubic ease out
    const ease = 1 - Math.pow(1 - transitionT, 3);
    camera.position.lerpVectors(transFromPos, transToPos, ease);
    camera.quaternion.slerpQuaternions(transFromQuat, transToQuat, ease);
  } else if (currentMode === 'character') {
    // Smooth 3rd person follow
    const charPos = player.position;
    const targetCamX = charPos.x - Math.sin(charCamYaw) * Math.cos(charCamPitch) * charCamDist;
    const targetCamY = charPos.y + 1.4 + Math.sin(charCamPitch) * charCamDist;
    const targetCamZ = charPos.z - Math.cos(charCamYaw) * Math.cos(charCamPitch) * charCamDist;

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), Math.min(1, dt * 10));
    _camLookTarget.set(charPos.x, charPos.y + 1.25, charPos.z);
    camera.lookAt(_camLookTarget);
  } else {
    // Damped orbit around active viewpoint
    const p = VIEW_PRESETS[currentMode];
    camAzimuth += (targetAzimuth - camAzimuth) * Math.min(1, dt * 10);
    camElevation += (targetElevation - camElevation) * Math.min(1, dt * 10);
    camDist += (targetDist - camDist) * Math.min(1, dt * 10);

    currentCamTarget.lerp(targetCamTarget, Math.min(1, dt * 8));
    const cx = currentCamTarget.x + Math.sin(camAzimuth) * Math.cos(camElevation) * camDist;
    const cy = currentCamTarget.y + Math.sin(camElevation) * camDist;
    const cz = currentCamTarget.z + Math.cos(camAzimuth) * Math.cos(camElevation) * camDist;

    camera.position.set(cx, cy, cz);
    camera.lookAt(currentCamTarget);
  }

  // Update physical 2.5D backdrop parallax relative to camera
  backdrop25D.updateParallax(camera.position, now * 0.001);

  renderer.render(scene, camera);
}

tick();
