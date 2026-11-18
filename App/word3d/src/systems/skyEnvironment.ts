import * as THREE from 'three';

export interface SkyEnvironmentResult {
  group: THREE.Group;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  depthCloudsGroup: THREE.Group;
  update: (time: number) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  updateAspect: (aspect: number) => void;
}

/**
 * Procedural 2.5D High-Resolution Canvas Texture Generator
 * Paints a fixed, painterly Cozy Fantasy Sky World:
 * - Rich morning sky gradient (sapphire -> azure -> warm golden sunrise)
 * - Warm morning sun glow matching directional light
 * - Distant mountain silhouettes in atmospheric haze
 * - Distant floating fantasy worlds (sky citadels, spires, waterfalls, floating shards)
 * - Billowing sea of clouds along the lower horizon with sunlit golden rims
 */
function createCozyFantasySkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Cozy Fantasy Morning Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0.0, '#1e3a8a'); // Deep sapphire sky at zenith
  skyGrad.addColorStop(0.22, '#2563eb'); // Royal azure
  skyGrad.addColorStop(0.48, '#60a5fa'); // Clear morning blue
  skyGrad.addColorStop(0.66, '#93c5fd'); // Soft pale azure
  skyGrad.addColorStop(0.76, '#fed7aa'); // Warm honey peach sunrise glow
  skyGrad.addColorStop(0.86, '#fef08a'); // Gentle golden morning mist
  skyGrad.addColorStop(1.0, '#e0f2fe'); // Soft sea of clouds below
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Warm Morning Sun Glow & Atmospheric Flare (Upper-Right quadrant)
  const sunX = w * 0.74;
  const sunY = h * 0.30;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.45);
  sunGlow.addColorStop(0.0, 'rgba(255, 255, 252, 0.95)');
  sunGlow.addColorStop(0.06, 'rgba(254, 240, 138, 0.65)');
  sunGlow.addColorStop(0.18, 'rgba(253, 230, 138, 0.28)');
  sunGlow.addColorStop(0.35, 'rgba(254, 215, 170, 0.10)');
  sunGlow.addColorStop(1.0, 'rgba(254, 215, 170, 0.0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);

  // 3. Far Highland & Mountain Silhouettes along the Horizon
  ctx.fillStyle = 'rgba(147, 197, 253, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.80);
  const mountainPts = [
    [0.0, 0.75],
    [0.10, 0.71],
    [0.22, 0.74],
    [0.36, 0.69],
    [0.48, 0.75],
    [0.62, 0.68],
    [0.76, 0.72],
    [0.88, 0.67],
    [1.0, 0.73],
  ];
  for (let i = 0; i < mountainPts.length - 1; i++) {
    const p1 = mountainPts[i];
    const p2 = mountainPts[i + 1];
    const cpx = ((p1[0] + p2[0]) / 2) * w;
    const cpy = Math.min(p1[1], p2[1]) * h - 18;
    ctx.quadraticCurveTo(cpx, cpy, p2[0] * w, p2[1] * h);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // 4. Distant Floating Worlds & Sky Island Silhouettes (2.5D Atmospheric Silhouettes)
  function drawFloatingIsland(
    cx: number,
    cy: number,
    radiusX: number,
    depthY: number,
    type: 'citadel' | 'shrine' | 'observatory' | 'mesa',
    color: string
  ) {
    ctx.save();
    ctx.fillStyle = color;

    // A. Island rocky inverted cone / hanging roots base
    ctx.beginPath();
    ctx.moveTo(cx - radiusX, cy);
    // Rocky bottom contours tapering to a craggy tip
    ctx.bezierCurveTo(
      cx - radiusX * 0.8,
      cy + depthY * 0.6,
      cx - radiusX * 0.3,
      cy + depthY * 0.9,
      cx,
      cy + depthY
    );
    ctx.bezierCurveTo(
      cx + radiusX * 0.3,
      cy + depthY * 0.9,
      cx + radiusX * 0.8,
      cy + depthY * 0.6,
      cx + radiusX,
      cy
    );
    // Plateau top
    ctx.quadraticCurveTo(cx, cy - depthY * 0.15, cx - radiusX, cy);
    ctx.closePath();
    ctx.fill();

    // B. Architecture & Features on the island
    if (type === 'citadel') {
      // Slender fantasy castle towers with conical roofs
      const towerW = radiusX * 0.16;
      const tH = depthY * 0.95;
      // Central Keep
      ctx.fillRect(cx - towerW * 0.5, cy - tH, towerW, tH);
      ctx.beginPath();
      ctx.moveTo(cx - towerW * 0.7, cy - tH);
      ctx.lineTo(cx, cy - tH - depthY * 0.55);
      ctx.lineTo(cx + towerW * 0.7, cy - tH);
      ctx.closePath();
      ctx.fill();
      // Flanking Towers
      [-1, 1].forEach((dir) => {
        const offX = cx + dir * radiusX * 0.45;
        const sideH = tH * 0.75;
        ctx.fillRect(offX - towerW * 0.4, cy - sideH, towerW * 0.8, sideH);
        ctx.beginPath();
        ctx.moveTo(offX - towerW * 0.5, cy - sideH);
        ctx.lineTo(offX, cy - sideH - depthY * 0.4);
        ctx.lineTo(offX + towerW * 0.5, cy - sideH);
        ctx.closePath();
        ctx.fill();
      });

      // Cascading thin silver waterfall plunging from cliff into clouds
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + radiusX * 0.25, cy + 2);
      ctx.lineTo(cx + radiusX * 0.25, cy + depthY * 1.8);
      ctx.stroke();

      // Delicate spray puff at waterfall bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(cx + radiusX * 0.25, cy + depthY * 1.8, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'observatory') {
      // Round observatory dome and spire
      const domeR = radiusX * 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy - domeR * 0.3, domeR, Math.PI, 0);
      ctx.fill();
      // Spire tip
      ctx.fillRect(cx - 1.5, cy - domeR * 1.6, 3, domeR * 1.3);
      // Floating crystal shards
      ctx.beginPath();
      ctx.moveTo(cx + radiusX * 0.55, cy - domeR * 0.8);
      ctx.lineTo(cx + radiusX * 0.60, cy - domeR * 1.3);
      ctx.lineTo(cx + radiusX * 0.65, cy - domeR * 0.8);
      ctx.closePath();
      ctx.fill();

      // Slender waterfall cascade
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - radiusX * 0.35, cy + 2);
      ctx.lineTo(cx - radiusX * 0.35, cy + depthY * 1.6);
      ctx.stroke();
    } else if (type === 'shrine') {
      // Arched Torii / Pagoda curved roof silhouette
      const roofW = radiusX * 0.45;
      ctx.beginPath();
      ctx.moveTo(cx - roofW, cy - depthY * 0.4);
      ctx.quadraticCurveTo(cx, cy - depthY * 0.65, cx + roofW, cy - depthY * 0.4);
      ctx.lineTo(cx + roofW * 0.7, cy - depthY * 0.3);
      ctx.quadraticCurveTo(cx, cy - depthY * 0.48, cx - roofW * 0.7, cy - depthY * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'mesa') {
      // Windmill / Lookout post silhouette
      ctx.fillRect(cx - 2, cy - depthY * 0.6, 4, depthY * 0.6);
      // Windmill blades cross
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - depthY * 0.6 - 9);
      ctx.lineTo(cx + 9, cy - depthY * 0.6 + 9);
      ctx.moveTo(cx - 9, cy - depthY * 0.6 + 9);
      ctx.lineTo(cx + 9, cy - depthY * 0.6 - 9);
      ctx.stroke();
    }

    // Tiny floating rock fragments nearby
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx - radiusX * 1.3, cy + depthY * 0.3, 4, 0, Math.PI * 2);
    ctx.arc(cx + radiusX * 1.25, cy - depthY * 0.2, 5, 0, Math.PI * 2);
    ctx.arc(cx + radiusX * 1.45, cy + depthY * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw 4 distant floating sky worlds with atmospheric perspective
  // Island 1: Sky Citadel (Far left, grand floating castle with towers and waterfall)
  drawFloatingIsland(w * 0.13, h * 0.52, 90, 48, 'citadel', 'rgba(125, 211, 252, 0.68)');
  // Island 2: Sacred Shrine Isle (Mid-left)
  drawFloatingIsland(w * 0.31, h * 0.60, 60, 30, 'shrine', 'rgba(147, 197, 253, 0.55)');
  // Island 3: Celestial Observatory Isle (Far right, with dome & crystal)
  drawFloatingIsland(w * 0.86, h * 0.50, 85, 42, 'observatory', 'rgba(125, 211, 252, 0.72)');
  // Island 4: Floating Mesa & Windmill (Far far-right)
  drawFloatingIsland(w * 0.95, h * 0.62, 55, 28, 'mesa', 'rgba(147, 197, 253, 0.52)');

  // 5. Billowing Sea of Clouds (3 Overlapping Soft Cloud Banks at the Lower Horizon)
  function drawCloudBank(yRatio: number, fillStyle: string, count: number, radius: number) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    const baseY = h * yRatio;
    ctx.moveTo(-radius, h);
    for (let i = 0; i <= count; i++) {
      const px = (i / count) * (w + radius * 2) - radius;
      const py = baseY + Math.sin(i * 1.7) * (radius * 0.35);
      const r = radius * (0.85 + Math.sin(i * 2.3) * 0.25);
      ctx.arc(px, py, r, 0, Math.PI, true);
    }
    ctx.lineTo(w + radius, h);
    ctx.lineTo(-radius, h);
    ctx.closePath();
    ctx.fill();
  }

  // Back cloud bank (soft sky azure haze)
  drawCloudBank(0.70, 'rgba(224, 242, 254, 0.72)', 18, 55);
  // Mid cloud bank (bright fluffy layer)
  drawCloudBank(0.77, 'rgba(240, 249, 255, 0.88)', 14, 75);
  // Front cloud bank (pure soft white clouds)
  drawCloudBank(0.85, '#ffffff', 11, 95);

  // 6. Warm Golden Sunlight Highlight across the top cloud rims
  const cloudRimGrad = ctx.createLinearGradient(0, h * 0.68, 0, h * 0.82);
  cloudRimGrad.addColorStop(0.0, 'rgba(254, 243, 199, 0.40)');
  cloudRimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  cloudRimGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = cloudRimGrad;
  ctx.fillRect(0, h * 0.68, w, h * 0.25);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function createSkyEnvironment(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): SkyEnvironmentResult {
  const group = new THREE.Group();
  group.name = 'SkyAndEnvironment';

  // 1. Soft Atmospheric Fog matching the warm morning horizon
  scene.fog = new THREE.FogExp2('#cbe7fc', 0.0032);

  // 2. Fixed 2.5D Background Plane (Attached to Camera)
  // Non-rotating and fixed relative to the screen, while the 3D main island rotates freely!
  scene.add(camera);

  const bgTexture = createCozyFantasySkyTexture();
  const bgGeo = new THREE.PlaneGeometry(1, 1);
  const bgMat = new THREE.MeshBasicMaterial({
    map: bgTexture,
    depthTest: false,
    depthWrite: false,
    fog: false,
  });

  // Load High-Res 2.5D Fantasy Sky Worlds Matte Painting
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    '/textures/sky/fantasy_sky_worlds_25d.jpg',
    (artTex) => {
      artTex.colorSpace = THREE.SRGBColorSpace;
      artTex.minFilter = THREE.LinearFilter;
      artTex.magFilter = THREE.LinearFilter;
      bgMat.map = artTex;
      bgMat.needsUpdate = true;
    },
    undefined,
    (err) => {
      console.warn('Using procedural sky texture fallback:', err);
    }
  );

  const bgPlane = new THREE.Mesh(bgGeo, bgMat);
  bgPlane.name = 'Fixed25DBackgroundSky';
  bgPlane.renderOrder = -1000;

  const bgDistance = 140;
  let bgScaleW = 1;
  let bgScaleH = 1;
  let currentParallaxX = 0;
  let currentParallaxY = 0;

  function updateFrustumScale(aspect: number) {
    const fovRad = (camera.fov * Math.PI) / 180;
    const frustumH = 2 * bgDistance * Math.tan(fovRad / 2);
    const frustumW = frustumH * aspect;
    const imgAspect = 16 / 9;

    let baseW: number;
    let baseH: number;
    if (aspect > imgAspect) {
      baseW = frustumW;
      baseH = frustumW / imgAspect;
    } else {
      baseH = frustumH;
      baseW = frustumH * imgAspect;
    }
    // Expand by 45% horizontally and 30% vertically so 2.5D parallax shift never reveals image borders
    bgScaleW = baseW * 1.45;
    bgScaleH = baseH * 1.30;
    bgPlane.scale.set(bgScaleW, bgScaleH, 1);
  }
  updateFrustumScale(camera.aspect);
  camera.add(bgPlane);

  // 3. Cinematic Crisp Daytime Sunlight matching the new bright sky
  const sunDir = new THREE.Vector3(0.58, 0.76, 0.42).normalize();
  const sunLight = new THREE.DirectionalLight('#ffffff', 3.0); // Clean bright daytime sunlight
  sunLight.position.copy(sunDir).multiplyScalar(55);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.035;
  group.add(sunLight);

  // 4. Hemisphere Fill Light
  const hemiLight = new THREE.HemisphereLight('#7dd3fc', '#3b4252', 1.25);
  group.add(hemiLight);

  // 5. Ambient Fill
  const ambientLight = new THREE.AmbientLight('#f0f9ff', 0.60);
  group.add(ambientLight);

  // 6. EXACTLY 2 NEARBY 3D CLOUD CLUSTERS FOR DEPTH & COMPOSITION
  // Requirements:
  // - Kept near the main island to establish clear 3D parallax depth
  // - Positioned carefully so they NEVER occlude houses, paths, or interaction points
  // - Cluster 1: Foreground Depth Anchor (Left rim, sitting slightly below island edge)
  // - Cluster 2: Waterfall Landing Pillow (Right rim, catching the falling waterfall plunge)
  const depthCloudsGroup = new THREE.Group();
  depthCloudsGroup.name = 'DepthCloudsGroup';

  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.92,
    metalness: 0.0,
    transparent: true,
    opacity: 0.88,
  });

  const puffGeo = new THREE.IcosahedronGeometry(1.0, 2);

  // Helper to build a compact, organic cloud cluster
  function buildCloudCluster(puffs: { x: number; y: number; z: number; s: number }[]): THREE.Group {
    const cl = new THREE.Group();
    puffs.forEach((p) => {
      const mesh = new THREE.Mesh(puffGeo, cloudMat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.scale.set(p.s, p.s * 0.72, p.s);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      cl.add(mesh);
    });
    return cl;
  }

  // Cloud Cluster 1: Foreground Depth Anchor (Front-Left, floating right beside the island rim)
  // Position: [-16.5, 0.4, 11.5]
  const cloud1Puffs = [
    { x: 0, y: 0, z: 0, s: 4.2 },
    { x: -2.8, y: -0.4, z: 0.6, s: 3.2 },
    { x: 2.8, y: -0.3, z: -0.5, s: 3.0 },
    { x: 1.0, y: 0.8, z: -0.8, s: 2.7 },
    { x: -1.5, y: 0.6, z: 0.8, s: 2.5 },
  ];
  // depthCloud1 REMOVED - was clipping directly into the island edge!

  // Cloud Cluster 2: Waterfall Landing Pillow (Directly under the 17m waterfall plunge)
  // Position: [9.6, -14.2, 4.9]
  const cloud2Puffs = [
    { x: 0, y: 0, z: 0, s: 5.5 },
    { x: -2.8, y: -0.5, z: 0.8, s: 4.2 },
    { x: 3.0, y: -0.4, z: -0.7, s: 4.0 },
    { x: 0.8, y: 1.2, z: 0.5, s: 3.6 },
    { x: -1.5, y: 0.9, z: -0.9, s: 3.2 },
    { x: 2.0, y: 0.8, z: 1.2, s: 3.0 },
  ];
  // depthCloudsGroup kept clean - sky painting provides all natural distant clouds

  group.add(depthCloudsGroup);

  return {
    group,
    sunLight,
    ambientLight,
    hemiLight,
    depthCloudsGroup,
    update: (time: number) => {
      // 1. 2.5D Parallax Shift for the Distant Sky Background Plane
      // When the camera orbits around the village island, calculate the azimuth (theta) & polar angle (phi)
      const camX = camera.position.x;
      const camY = camera.position.y - 2.2;
      const camZ = camera.position.z;
      const theta = Math.atan2(camX, camZ);
      const horizDist = Math.hypot(camX, camZ) || 1;
      const phi = Math.atan2(camY, horizDist);

      // Parallax slide amount: smooth horizontal and vertical drift in opposite direction to rotation
      const fovRad = (camera.fov * Math.PI) / 180;
      const frustumH = 2 * bgDistance * Math.tan(fovRad / 2);
      const frustumW = frustumH * camera.aspect;
      const maxSlideX = Math.max(0, (bgScaleW - frustumW) * 0.46);
      const maxSlideY = Math.max(0, (bgScaleH - frustumH) * 0.44);

      const targetParallaxX = -Math.sin(theta) * (maxSlideX * 0.85);
      const targetParallaxY = (phi - 0.70) * (maxSlideY * 0.65);

      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.08;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.08;

      bgPlane.position.set(currentParallaxX, currentParallaxY, -bgDistance);

      // 3D clouds removed so island edge is clean and open
    },
    setQuality: (quality: 'low' | 'medium' | 'high') => {
      // Both depth clouds are extremely lightweight (total 11 small low-poly spheres)
      // On LOW, we can keep them visible or reduce opacity slightly
      // Quality settings updated
    },
    updateAspect: (aspect: number) => {
      updateFrustumScale(aspect);
    },
  };
}
