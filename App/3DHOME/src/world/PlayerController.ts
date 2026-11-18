import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AABBCollider } from '../types';
import { createSoftShadowTexture } from '../textures/proceduralTextures';
import { getGroundHeight, getPeninsulaDistance } from './EnvironmentBuilder';

export class PlayerController {
  public readonly mesh: THREE.Group;
  public readonly position = new THREE.Vector3(0.0, 0.42, 3.6);
  public velocityY = 0;
  public yaw = Math.PI; // Facing directly toward panoramic glass sliding doors and lake vista
  public isGrounded = true;

  // Fallback procedural adventurer limbs
  private fallbackMeshGroup: THREE.Group;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private torsoGroup: THREE.Group;
  private walkPhase = 0;

  // Real 3D Humanoid Model with Rigged Skeletal Animation
  private humanoidModel: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private runAction: THREE.AnimationAction | null = null;
  private currentAction: 'idle' | 'walk' | 'run' = 'idle';

  private keys = new Set<string>();
  public joystickInput = new THREE.Vector2(0, 0);
  public mode: 'home' | 'village' = 'home';
  public bounds = { minX: -23.0, maxX: 14.0, minZ: -25.0, maxZ: 22.0 };

  constructor(mode: 'home' | 'village' = 'home') {
    this.mode = mode;
    if (mode === 'village') {
      this.bounds = { minX: -36.0, maxX: 36.0, minZ: -48.0, maxZ: 28.5 };
    }
    this.mesh = new THREE.Group();
    this.fallbackMeshGroup = new THREE.Group();
    this.torsoGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: '#f1c29b', roughness: 0.72 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: '#d97a2b', roughness: 0.75 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#2b3a4a', roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: '#3b281c', roughness: 0.88 });
    const hatMat = new THREE.MeshStandardMaterial({ color: '#9c2c2c', roughness: 0.8 });
    const packMat = new THREE.MeshStandardMaterial({ color: '#4d6346', roughness: 0.82 });

    // Legs (pivot at hip y = 0.74)
    const legGeo = new THREE.CapsuleGeometry(0.088, 0.44, 6, 10);
    legGeo.translate(0, -0.31, 0);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.11, 0.74, 0);
    this.leftLeg.castShadow = true;

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.11, 0.74, 0);
    this.rightLeg.castShadow = true;

    // Sculpted Hiking Boots
    const bootGeo = new THREE.CapsuleGeometry(0.085, 0.12, 4, 8);
    bootGeo.rotateX(Math.PI / 2);
    const lBoot = new THREE.Mesh(bootGeo, bootMat);
    lBoot.position.set(0, -0.66, 0.04);
    const rBoot = new THREE.Mesh(bootGeo, bootMat);
    rBoot.position.set(0, -0.66, 0.04);
    this.leftLeg.add(lBoot);
    this.rightLeg.add(rBoot);

    // Rounded Torso Jacket + Scarf
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.28, 6, 12), jacketMat);
    body.scale.set(1.04, 1.0, 0.72);
    body.position.set(0, 1.02, 0);
    body.castShadow = true;

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.045, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#f2e8cf', roughness: 0.9 })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 1.32, 0.01);

    // Rounded Alpine Backpack
    const pack = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.20, 4, 8), packMat);
    pack.scale.set(1.1, 1.0, 0.75);
    pack.position.set(0, 1.05, -0.18);
    pack.castShadow = true;

    // Head + Eyes + Beanie Hat
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), skinMat);
    head.position.set(0, 1.51, 0);
    head.castShadow = true;

    const eyeMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeMat);
    lEye.position.set(-0.058, 1.52, 0.155);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeMat);
    rEye.position.set(0.058, 1.52, 0.155);

    const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hatMat);
    beanie.position.set(0, 1.54, -0.01);
    beanie.rotation.x = -0.12;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: '#f5efe6' }));
    pom.position.set(0, 1.73, -0.04);

    // Rounded Arms (pivot at shoulder y = 1.24)
    const armGeo = new THREE.CapsuleGeometry(0.064, 0.34, 6, 10);
    armGeo.translate(0, -0.20, 0);
    this.leftArm = new THREE.Mesh(armGeo, jacketMat);
    this.leftArm.position.set(-0.25, 1.22, 0);
    this.leftArm.castShadow = true;

    this.rightArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArm.position.set(0.25, 1.22, 0);
    this.rightArm.castShadow = true;

    this.torsoGroup.add(body, scarf, pack, head, lEye, rEye, beanie, pom, this.leftArm, this.rightArm);
    this.fallbackMeshGroup.add(this.leftLeg, this.rightLeg, this.torsoGroup);
    this.mesh.add(this.fallbackMeshGroup);

    // Ground contact ambient occlusion contact shadow disc
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    this.mesh.add(shadow);

    this.mesh.position.copy(this.position);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Load real 3D Humanoid Rigged Model with walk cycle
    this.loadHumanoidModel();
  }

  private loadHumanoidModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/models/character/humanoid.glb',
      (gltf) => {
        this.humanoidModel = gltf.scene;

        // Auto-scale model so height is ~1.75m
        const bbox = new THREE.Box3().setFromObject(this.humanoidModel);
        const rawHeight = Math.max(0.1, bbox.max.y - bbox.min.y);
        const targetHeight = 1.74;
        const scale = targetHeight / rawHeight;
        this.humanoidModel.scale.set(scale, scale, scale);

        // Align feet cleanly to floor y = 0
        const bottomY = bbox.min.y * scale;
        this.humanoidModel.position.y = -bottomY;
        this.humanoidModel.rotation.y = Math.PI; // Face forward

        this.humanoidModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Initialize AnimationMixer with Walk & Idle clips
        this.mixer = new THREE.AnimationMixer(this.humanoidModel);
        const clips = gltf.animations;
        const idleClip = clips.find((c) => c.name.toLowerCase().includes('idle')) || clips[0];
        const walkClip = clips.find((c) => c.name.toLowerCase().includes('walk')) || clips[3] || clips[1];
        const runClip = clips.find((c) => c.name.toLowerCase().includes('run')) || clips[1];

        if (idleClip) this.idleAction = this.mixer.clipAction(idleClip);
        if (walkClip) this.walkAction = this.mixer.clipAction(walkClip);
        if (runClip) this.runAction = this.mixer.clipAction(runClip);

        this.idleAction?.play();
        this.currentAction = 'idle';

        // Hide procedural fallback mesh and display real 3D humanoid
        this.fallbackMeshGroup.visible = false;
        this.mesh.add(this.humanoidModel);
        console.log('[PlayerController] Real 3D Humanoid model loaded with walking leg animations!');
      },
      undefined,
      (err) => {
        console.warn('[PlayerController] Using procedural character fallback:', err);
      }
    );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
      this.keys.add(e.code);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private getSupportHeight(x: number, z: number): number {
    if (this.mode === 'village') {
      return 0.42;
    }
    const ground = getGroundHeight(x, z);
    const inVillaBounds = x >= -14.8 && x <= 6.8 && z >= -7.2 && z <= 9.2;
    if (inVillaBounds) {
      return Math.max(0.42, ground);
    }
    return ground;
  }

  public update(dt: number, cameraYaw: number, colliders: AABBCollider[]): boolean {
    let inputX = 0;
    let inputZ = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) inputZ += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) inputZ -= 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) inputX += 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) inputX -= 1;

    if (this.joystickInput.lengthSq() > 0.01) {
      inputX -= this.joystickInput.x;
      inputZ -= this.joystickInput.y;
    }

    const isMoving = inputX !== 0 || inputZ !== 0;
    const isSprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const moveSpeed = (isSprinting ? 6.2 : 3.6) * dt;

    if (isMoving) {
      const len = Math.hypot(inputX, inputZ);
      const nx = inputX / len;
      const nz = inputZ / len;

      const sinA = Math.sin(cameraYaw);
      const cosA = Math.cos(cameraYaw);

      const dirX = -(nx * cosA + nz * sinA);
      const dirZ = -(-nx * sinA + nz * cosA);

      const newX = this.position.x + dirX * moveSpeed;
      const newZ = this.position.z + dirZ * moveSpeed;
      const radius = 0.32;

      let acceptedX = this.position.x;
      let acceptedZ = this.position.z;

      if (this.canStandAt(newX, this.position.z, radius, colliders)) {
        acceptedX = newX;
      }
      if (this.canStandAt(acceptedX, newZ, radius, colliders)) {
        acceptedZ = newZ;
      }

      if (acceptedX !== this.position.x || acceptedZ !== this.position.z) {
        this.position.x = acceptedX;
        this.position.z = acceptedZ;
      }

      const targetYaw = Math.atan2(dirX, dirZ);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (isSprinting ? 14 : 9.5);
    } else {
      this.walkPhase = 0;
    }

    // Gravity & smooth step up onto deck/stairs
    const supportY = this.getSupportHeight(this.position.x, this.position.z);
    if (!this.isGrounded || this.position.y > supportY + 0.05) {
      this.velocityY -= 19.5 * dt;
      this.position.y += this.velocityY * dt;
      if (this.position.y <= supportY) {
        this.position.y = supportY;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y += (supportY - this.position.y) * Math.min(1, dt * 16);
      this.velocityY = 0;
      this.isGrounded = true;
    }

    // Animate Real 3D Humanoid Model (or fallback limbs)
    if (this.mixer) {
      if (isMoving) {
        if (this.currentAction !== 'walk') {
          this.idleAction?.fadeOut(0.2);
          this.walkAction?.reset().fadeIn(0.2).play();
          this.currentAction = 'walk';
        }
      } else {
        if (this.currentAction !== 'idle') {
          this.walkAction?.fadeOut(0.2);
          this.idleAction?.reset().fadeIn(0.2).play();
          this.currentAction = 'idle';
        }
      }
      this.mixer.update(dt * (isSprinting ? 1.35 : 1.1));
    } else {
      // Procedural limb animation fallback
      const swing = isMoving ? Math.sin(this.walkPhase) * 0.62 : 0;
      this.leftLeg.rotation.x += (swing - this.leftLeg.rotation.x) * Math.min(1, dt * 14);
      this.rightLeg.rotation.x += (-swing - this.rightLeg.rotation.x) * Math.min(1, dt * 14);
      this.leftArm.rotation.x += (-swing * 0.85 - this.leftArm.rotation.x) * Math.min(1, dt * 14);
      this.rightArm.rotation.x += (swing * 0.85 - this.rightArm.rotation.x) * Math.min(1, dt * 14);
      this.torsoGroup.position.y = isMoving ? Math.abs(Math.sin(this.walkPhase)) * 0.045 : 0;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    return isMoving;
  }

  private canStandAt(x: number, z: number, r: number, colliders: AABBCollider[]): boolean {
    if (this.mode === 'village') {
      if (x < this.bounds.minX || x > this.bounds.maxX || z < this.bounds.minZ || z > this.bounds.maxZ) {
        return false;
      }
    } else {
      if (getPeninsulaDistance(x, z) > -0.35) return false;
      if (x < this.bounds.minX || x > this.bounds.maxX || z < this.bounds.minZ || z > this.bounds.maxZ) {
        return false;
      }
    }

    for (const c of colliders) {
      if (c.obb) {
        const dx = x - c.obb.cx;
        const dz = z - c.obb.cz;
        const cosA = Math.cos(-c.obb.rotY);
        const sinA = Math.sin(-c.obb.rotY);
        const lx = dx * cosA - dz * sinA;
        const lz = dx * sinA + dz * cosA;
        if (Math.abs(lx) < c.obb.halfW + r && Math.abs(lz) < c.obb.halfD + r) {
          return false;
        }
        continue;
      }

      if (
        x + r > c.minX &&
        x - r < c.maxX &&
        z + r > c.minZ &&
        z - r < c.maxZ
      ) {
        return false;
      }
    }
    return true;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.humanoidModel!);
    }
  }
}
