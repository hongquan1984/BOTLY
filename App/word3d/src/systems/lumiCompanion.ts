import * as THREE from 'three';

export class LumiCompanion {
  public group: THREE.Group;
  private lumiMesh: THREE.Points | null = null;
  private aura: THREE.Mesh | null = null;
  private sparkles: THREE.Points | null = null;
  private time: number = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LumiCompanion';

    // 1. Soft glowing emerald aura ring below Lumi's feet
    const auraGeo = new THREE.RingGeometry(0.16, 0.30, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    this.aura = new THREE.Mesh(auraGeo, auraMat);
    this.aura.rotation.x = Math.PI / 2;
    this.aura.position.y = -0.38;
    this.group.add(this.aura);

    // 2. Trailing magical golden sparkles
    this.initSparkles();

    // 3. Load 3D Plush Lumi Model (sample.ply converted to colored splat cloud)
    this.loadLumiModel();

    // Initial position hovering near crossroads
    this.group.position.set(0, 2.2, 4.2);
    scene.add(this.group);
  }

  private createSoftCircleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.7, 'rgba(255,255,255,0.92)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private initSparkles() {
    const sparkleCount = 45;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkleCount * 3);
    const colors = new Float32Array(sparkleCount * 3);

    for (let i = 0; i < sparkleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      // Golden yellow & emerald sparkles
      const isGold = Math.random() > 0.35;
      colors[i * 3] = isGold ? 1.0 : 0.2;
      colors[i * 3 + 1] = isGold ? 0.92 : 0.95;
      colors[i * 3 + 2] = isGold ? 0.25 : 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.032,
      map: this.createSoftCircleTexture(),
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkles = new THREE.Points(geo, mat);
    this.group.add(this.sparkles);
  }

  private loadLumiModel() {
    const modelUrl = '/assets/models/lumi_model.bin';

    fetch(modelUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${modelUrl}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const dv = new DataView(buffer);
        const pointCount = dv.getUint32(0, true);

        const positions = new Float32Array(buffer, 4, pointCount * 3);
        const rawColors = new Uint8Array(buffer, 4 + pointCount * 12, pointCount * 3);

        // Convert to normalized Float32 colors with slight fantasy vibrance
        const colors = new Float32Array(pointCount * 3);
        for (let i = 0; i < pointCount * 3; i++) {
          colors[i] = Math.min(1.0, (rawColors[i] / 255.0) * 1.08);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Soft plush velvet circular point cloud material
        const material = new THREE.PointsMaterial({
          size: 0.038,
          map: this.createSoftCircleTexture(),
          transparent: true,
          alphaTest: 0.02,
          vertexColors: true,
          sizeAttenuation: true,
        });

        this.lumiMesh = new THREE.Points(geometry, material);
        // Scale to ~0.70m cute floating companion size
        this.lumiMesh.scale.setScalar(0.70);
        this.group.add(this.lumiMesh);
        console.log(`[LumiCompanion] Successfully loaded 3D Lumi (${pointCount} points)`);
      })
      .catch((err) => {
        console.warn('[LumiCompanion] Could not load lumi_model.bin, using fallback:', err);
        const fbGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const fbMat = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          emissive: '#fef08a',
          emissiveIntensity: 0.5,
        });
        const fbMesh = new THREE.Mesh(fbGeo, fbMat);
        this.group.add(fbMesh);
      });
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.time += delta;

    // Smooth hover bobbing and breathing motion
    const hoverY = Math.sin(this.time * 2.8) * 0.14;
    const swayX = Math.cos(this.time * 1.5) * 0.08;

    // Orbiting companion position hovering near player's right shoulder
    const orbitAngle = this.time * 0.6;
    const targetX = playerPos.x + Math.cos(orbitAngle) * 1.25 + swayX;
    const targetZ = playerPos.z + Math.sin(orbitAngle) * 1.25;
    const targetY = playerPos.y + 1.35 + hoverY;

    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
    this.group.position.lerp(targetPos, delta * 3.6);

    // Turn Lumi to face towards the player or forward
    const lookAngle = Math.atan2(
      playerPos.x - this.group.position.x,
      playerPos.z - this.group.position.z
    );
    // Subtle tilt/bank while flying
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, lookAngle + Math.PI * 0.2, delta * 4.0);
    this.group.rotation.z = Math.sin(this.time * 2.5) * 0.06;

    // Pulse aura ring
    if (this.aura) {
      const auraScale = 1.0 + Math.sin(this.time * 3.5) * 0.1;
      this.aura.scale.set(auraScale, auraScale, 1);
      (this.aura.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(this.time * 3.5) * 0.15;
    }

    // Animate trailing sparkles swirling around Lumi
    if (this.sparkles) {
      const posAttr = this.sparkles.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const theta = this.time * 1.8 + (i / count) * Math.PI * 2;
        const r = 0.28 + Math.sin(this.time * 3.0 + i) * 0.10;
        const py = Math.sin(this.time * 2.2 + i * 0.5) * 0.28;
        posAttr.setXYZ(i, Math.cos(theta) * r, py, Math.sin(theta) * r);
      }
      posAttr.needsUpdate = true;
    }
  }
}
