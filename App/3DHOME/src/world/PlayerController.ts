import * as THREE from 'three';
import { AABBCollider } from '../types';
import { createSoftShadowTexture } from '../textures/proceduralTextures';
import { getGroundHeight, getPeninsulaDistance } from './EnvironmentBuilder';

export class PlayerController {
  public readonly mesh: THREE.Group;
  public readonly position = new THREE.Vector3(-2.45, 0.42, 3.35);
  public velocityY = 0;
  public yaw = 2.35; // Facing comfortably toward fireplace & seating area without blocking lake vista
  public isGrounded = true;

  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private torsoGroup: THREE.Group;
  private walkPhase = 0;

  private keys = new Set<string>();
  public joystickInput = new THREE.Vector2(0, 0);

  constructor() {
    this.mesh = new THREE.Group();
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
    this.leftArm.position.set(-0.27, 1.24, 0);
    this.leftArm.castShadow = true;

    this.rightArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArm.position.set(0.27, 1.24, 0);
    this.rightArm.castShadow = true;

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({
        map: createSoftShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.6,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;

    this.torsoGroup.add(body, scarf, pack, head, lEye, rEye, beanie, pom, this.leftArm, this.rightArm);
    this.mesh.add(this.leftLeg, this.rightLeg, this.torsoGroup, contactShadow);
    this.mesh.scale.setScalar(0.86);

    this.position.y = this.getSupportHeight(this.position.x, this.position.z);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'Space' && this.isGrounded) {
      this.triggerJump();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  public triggerJump(): void {
    if (this.isGrounded) {
      this.velocityY = 6.2;
      this.isGrounded = false;
    }
  }

  public getSupportHeight(x: number, z: number): number {
    // Inside extended chalet hardwood floor (Living, Kitchen, Bedroom, Spa Bath)
    if (x >= -4.45 && x <= 4.45 && z >= -11.45 && z <= 5.3) {
      return 0.42;
    }
    // Wrap-around wooden deck (front + left)
    if (
      (x >= -7.2 && x <= 5.4 && z >= 5.3 && z <= 8.95) ||
      (x >= -7.2 && x <= -4.45 && z >= -5.6 && z <= 5.3)
    ) {
      return 0.38;
    }
    // Front-left stairs
    if (x >= -5.28 && x <= -3.12 && z >= 8.95 && z <= 9.85) {
      return z < 9.38 ? 0.30 : 0.17;
    }
    return Math.max(0.0, getGroundHeight(x, z));
  }

  public update(dt: number, cameraYaw: number, colliders: AABBCollider[]): boolean {
    let moveForward = 0;
    let moveRight = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveRight += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveRight -= 1;

    // Combine mobile joystick
    moveRight += this.joystickInput.x;
    moveForward += this.joystickInput.y;

    const inputLen = Math.hypot(moveForward, moveRight);
    const isMoving = inputLen > 0.08;
    const isSprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = isSprinting ? 6.2 : 3.9;

    if (isMoving) {
      const nf = moveForward / Math.max(1, inputLen);
      const nr = moveRight / Math.max(1, inputLen);

      // Camera forward on XZ plane
      const fwdX = -Math.sin(cameraYaw);
      const fwdZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      const dirX = fwdX * nf + rightX * nr;
      const dirZ = fwdZ * nf + rightZ * nr;
      const len = Math.hypot(dirX, dirZ) || 1;
      const vx = (dirX / len) * speed * dt;
      const vz = (dirZ / len) * speed * dt;

      // Resolve X and Z separately against AABBs & lake shoreline
      const radius = 0.34;
      const nextX = this.position.x + vx;
      if (this.canStandAt(nextX, this.position.z, radius, colliders)) {
        this.position.x = nextX;
      }
      const nextZ = this.position.z + vz;
      if (this.canStandAt(this.position.x, nextZ, radius, colliders)) {
        this.position.z = nextZ;
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

    // Animate limbs
    const swing = isMoving ? Math.sin(this.walkPhase) * 0.62 : 0;
    this.leftLeg.rotation.x += (swing - this.leftLeg.rotation.x) * Math.min(1, dt * 14);
    this.rightLeg.rotation.x += (-swing - this.rightLeg.rotation.x) * Math.min(1, dt * 14);
    this.leftArm.rotation.x += (-swing * 0.85 - this.leftArm.rotation.x) * Math.min(1, dt * 14);
    this.rightArm.rotation.x += (swing * 0.85 - this.rightArm.rotation.x) * Math.min(1, dt * 14);
    this.torsoGroup.position.y = isMoving ? Math.abs(Math.sin(this.walkPhase)) * 0.045 : 0;

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    return isMoving;
  }

  private canStandAt(x: number, z: number, r: number, colliders: AABBCollider[]): boolean {
    // Keep within peninsula dry land & full extended villa boundaries
    if (getPeninsulaDistance(x, z) > -0.35) return false;
    if (x < -23 || x > 14 || z < -25 || z > 22) return false;

    for (const c of colliders) {
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
  }
}
