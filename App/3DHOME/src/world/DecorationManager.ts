import * as THREE from 'three';
import { createSoftShadowTexture } from '../textures/proceduralTextures';
import { HybridAssetLoader } from '../assets/HybridAssetLoader';
import { AABBCollider, PlaceableDefinition, PlacedItemRecord, SurfaceZone } from '../types';

export const PLACEABLE_ITEMS: PlaceableDefinition[] = [
  {
    id: 'lounge-chair',
    name: 'Ghế gỗ thư giãn',
    emoji: '🪑',
    radius: 0.52,
    boundingBox: { width: 0.78, height: 0.92, depth: 0.76 },
    allowedZones: ['interior', 'deck', 'garden'],
  },
  {
    id: 'coffee-table',
    name: 'Bàn trà gỗ sồi',
    emoji: '🪵',
    radius: 0.48,
    boundingBox: { width: 0.92, height: 0.56, depth: 0.92 },
    allowedZones: ['interior', 'deck', 'garden'],
  },
  {
    id: 'flower-planter',
    name: 'Chậu hoa Alpine',
    emoji: '🪴',
    radius: 0.34,
    boundingBox: { width: 0.58, height: 0.78, depth: 0.58 },
    allowedZones: ['interior', 'deck', 'garden'],
  },
  {
    id: 'garden-lantern',
    name: 'Đèn lồng sân vườn',
    emoji: '🏮',
    radius: 0.25,
    boundingBox: { width: 0.34, height: 1.15, depth: 0.34 },
    allowedZones: ['deck', 'garden'],
  },
  {
    id: 'lakeside-bench',
    name: 'Ghế dài nhìn hồ',
    emoji: '🛋️',
    radius: 0.76,
    boundingBox: { width: 1.52, height: 0.94, depth: 0.58 },
    allowedZones: ['deck', 'garden'],
  },
  {
    id: 'woven-rug',
    name: 'Thảm dệt len',
    emoji: '🧶',
    radius: 0.92,
    boundingBox: { width: 2.1, height: 0.04, depth: 1.45 },
    allowedZones: ['interior', 'deck'],
  },
  {
    id: 'firewood-stack',
    name: 'Giá củi lò sưởi',
    emoji: '🔥',
    radius: 0.42,
    boundingBox: { width: 0.74, height: 0.58, depth: 0.42 },
    allowedZones: ['interior', 'deck'],
  },
];

const STORAGE_KEY = 'swiss_chalet_3d_decor_v2';

export class DecorationManager {
  public readonly container = new THREE.Group();
  private placed = new Map<string, { record: PlacedItemRecord; mesh: THREE.Group }>();
  private ghostGroup: THREE.Group | null = null;
  private ghostMatValid = new THREE.MeshBasicMaterial({
    color: '#4ade80',
    transparent: true,
    opacity: 0.52,
  });
  private ghostMatInvalid = new THREE.MeshBasicMaterial({
    color: '#f87171',
    transparent: true,
    opacity: 0.52,
  });

  public active = false;
  public selectedDefId = PLACEABLE_ITEMS[0].id;
  public selectedPlacedUid: string | null = null;
  public previewRotY = 0;
  public previewScale = 1.0;
  private lastHit: { x: number; y: number; z: number; valid: boolean } | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selectionRing: THREE.Mesh;

  constructor(
    private zones: SurfaceZone[],
    private staticColliders: AABBCollider[],
    private assets?: HybridAssetLoader
  ) {
    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.66, 28),
      new THREE.MeshBasicMaterial({ color: '#f3b154', side: THREE.DoubleSide })
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.visible = false;
    this.container.add(this.selectionRing);

    this.loadFromStorage();
  }

  public setActive(enabled: boolean): void {
    this.active = enabled;
    if (enabled) {
      this.rebuildGhost();
    } else {
      if (this.ghostGroup) {
        this.container.remove(this.ghostGroup);
        this.ghostGroup = null;
      }
      this.selectedPlacedUid = null;
      this.selectionRing.visible = false;
      this.lastHit = null;
    }
  }

  public selectItem(defId: string): void {
    this.selectedDefId = defId;
    this.selectedPlacedUid = null;
    this.selectionRing.visible = false;
    if (this.active) {
      this.rebuildGhost();
    }
  }

  public rotatePreview(): void {
    if (this.selectedPlacedUid) {
      const entry = this.placed.get(this.selectedPlacedUid);
      if (entry) {
        entry.record.rotY = Number(((entry.record.rotY + Math.PI / 4) % (Math.PI * 2)).toFixed(3));
        entry.mesh.rotation.y = entry.record.rotY;
        this.saveToStorage();
        return;
      }
    }
    this.previewRotY = (this.previewRotY + Math.PI / 4) % (Math.PI * 2);
    if (this.ghostGroup) {
      this.ghostGroup.rotation.y = this.previewRotY;
    }
  }

  public setScale(scale: number): void {
    this.previewScale = scale;
    if (this.selectedPlacedUid) {
      const entry = this.placed.get(this.selectedPlacedUid);
      if (entry) {
        const def = PLACEABLE_ITEMS.find((d) => d.id === entry.record.defId)!;
        entry.record.scale = scale;
        entry.record.boundingBox = {
          width: Number((def.boundingBox.width * scale).toFixed(2)),
          height: Number((def.boundingBox.height * scale).toFixed(2)),
          depth: Number((def.boundingBox.depth * scale).toFixed(2)),
        };
        entry.mesh.scale.setScalar(scale);
        this.selectionRing.scale.setScalar(scale);
        this.saveToStorage();
      }
    }
    if (this.ghostGroup) {
      this.ghostGroup.scale.setScalar(scale);
    }
  }

  public deleteSelected(): boolean {
    if (!this.selectedPlacedUid) return false;
    const entry = this.placed.get(this.selectedPlacedUid);
    if (!entry) return false;
    this.container.remove(entry.mesh);
    this.placed.delete(this.selectedPlacedUid);
    this.selectedPlacedUid = null;
    this.selectionRing.visible = false;
    this.saveToStorage();
    return true;
  }

  private rebuildGhost(): void {
    if (this.ghostGroup) {
      this.container.remove(this.ghostGroup);
    }
    this.ghostGroup = buildDecorMesh(this.selectedDefId, this.assets);
    this.ghostGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = this.ghostMatValid;
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    this.ghostGroup.rotation.y = this.previewRotY;
    this.ghostGroup.scale.setScalar(this.previewScale);
    this.ghostGroup.visible = false;
    this.container.add(this.ghostGroup);
  }

  public updatePointer(clientX: number, clientY: number, domElement: HTMLElement, camera: THREE.Camera): void {
    if (!this.active || !this.ghostGroup) return;

    const rect = domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, camera);
    const meshes = this.zones.map((z) => z.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);

    if (hits.length === 0) {
      this.ghostGroup.visible = false;
      this.lastHit = null;
      return;
    }

    const hit = hits[0];
    const zoneEntry = this.zones.find((z) => z.mesh === hit.object);
    const def = PLACEABLE_ITEMS.find((d) => d.id === this.selectedDefId)!;
    const x = hit.point.x;
    const y = hit.point.y;
    const z = hit.point.z;
    const effR = def.radius * this.previewScale;

    let valid = !!zoneEntry && def.allowedZones.includes(zoneEntry.zone);
    if (valid && zoneEntry?.zone === 'garden') {
      if (y < -0.02) valid = false;
      if (x > -7.3 && x < 5.5 && z > -5.8 && z < 9.1) valid = false;
    }
    if (valid) {
      for (const c of this.staticColliders) {
        if (x + effR > c.minX && x - effR < c.maxX && z + effR > c.minZ && z - effR < c.maxZ) {
          valid = false;
          break;
        }
      }
    }
    if (valid && def.id !== 'woven-rug') {
      this.placed.forEach((other) => {
        if (other.record.uid === this.selectedPlacedUid || other.record.defId === 'woven-rug') return;
        const otherDef = PLACEABLE_ITEMS.find((d) => d.id === other.record.defId)!;
        const minSep = effR + otherDef.radius * other.record.scale * 0.8;
        if (Math.hypot(x - other.record.x, z - other.record.z) < minSep) {
          valid = false;
        }
      });
    }

    this.ghostGroup.visible = true;
    this.ghostGroup.position.set(x, y, z);
    this.ghostGroup.rotation.y = this.previewRotY;
    this.ghostGroup.scale.setScalar(this.previewScale);
    const mat = valid ? this.ghostMatValid : this.ghostMatInvalid;
    this.ghostGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.material = mat;
    });
    this.lastHit = { x, y, z, valid };
  }

  public handleLeftClick(clientX: number, clientY: number, domElement: HTMLElement, camera: THREE.Camera): 'selected' | 'placed' | 'none' {
    if (!this.active) return 'none';

    // 1. Check if clicking an already-placed item to select/edit it
    const hitUid = this.pickPlacedUid(clientX, clientY, domElement, camera);
    if (hitUid) {
      this.selectedPlacedUid = hitUid;
      const entry = this.placed.get(hitUid)!;
      this.selectionRing.position.set(entry.record.x, entry.record.y + 0.02, entry.record.z);
      this.selectionRing.scale.setScalar(entry.record.scale);
      this.selectionRing.visible = true;
      return 'selected';
    }

    // 2. Otherwise clear selection and place new item at ghost
    this.selectedPlacedUid = null;
    this.selectionRing.visible = false;
    this.updatePointer(clientX, clientY, domElement, camera);
    const placed = this.tryPlaceAtCurrent();
    return placed ? 'placed' : 'none';
  }

  public tryPlaceAtCurrent(): PlacedItemRecord | null {
    if (!this.active || !this.lastHit || !this.lastHit.valid) return null;
    const def = PLACEABLE_ITEMS.find((d) => d.id === this.selectedDefId)!;
    const rec: PlacedItemRecord = {
      uid: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      defId: this.selectedDefId,
      x: Number(this.lastHit.x.toFixed(3)),
      y: Number(this.lastHit.y.toFixed(3)),
      z: Number(this.lastHit.z.toFixed(3)),
      rotY: Number(this.previewRotY.toFixed(3)),
      scale: this.previewScale,
      boundingBox: {
        width: Number((def.boundingBox.width * this.previewScale).toFixed(2)),
        height: Number((def.boundingBox.height * this.previewScale).toFixed(2)),
        depth: Number((def.boundingBox.depth * this.previewScale).toFixed(2)),
      },
    };
    this.spawnItem(rec);
    this.saveToStorage();
    return rec;
  }

  private pickPlacedUid(clientX: number, clientY: number, domElement: HTMLElement, camera: THREE.Camera): string | null {
    const rect = domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, camera);

    const targets: THREE.Object3D[] = [];
    this.placed.forEach((entry) => targets.push(entry.mesh));
    const hits = this.raycaster.intersectObjects(targets, true);
    if (hits.length === 0) return null;

    let curr: THREE.Object3D | null = hits[0].object;
    while (curr && !curr.userData?.decorUid) {
      curr = curr.parent;
    }
    return (curr?.userData?.decorUid as string | undefined) ?? null;
  }

  public tryRemoveAtPointer(clientX: number, clientY: number, domElement: HTMLElement, camera: THREE.Camera): boolean {
    const uid = this.pickPlacedUid(clientX, clientY, domElement, camera);
    if (!uid) return false;
    const entry = this.placed.get(uid);
    if (!entry) return false;
    this.container.remove(entry.mesh);
    this.placed.delete(uid);
    if (this.selectedPlacedUid === uid) {
      this.selectedPlacedUid = null;
      this.selectionRing.visible = false;
    }
    this.saveToStorage();
    return true;
  }

  public clearAll(): void {
    this.placed.forEach((entry) => this.container.remove(entry.mesh));
    this.placed.clear();
    this.selectedPlacedUid = null;
    this.selectionRing.visible = false;
    this.saveToStorage();
  }

  public getCount(): number {
    return this.placed.size;
  }

  private spawnItem(rec: PlacedItemRecord): void {
    const mesh = buildDecorMesh(rec.defId, this.assets);
    mesh.position.set(rec.x, rec.y, rec.z);
    mesh.rotation.y = rec.rotY;
    mesh.scale.setScalar(rec.scale);
    mesh.userData.decorUid = rec.uid;
    this.container.add(mesh);
    this.placed.set(rec.uid, { record: rec, mesh });
  }

  private saveToStorage(): void {
    try {
      const list = Array.from(this.placed.values()).map((e) => e.record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage quota errors
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as PlacedItemRecord[];
      for (const rec of list) {
        if (PLACEABLE_ITEMS.some((d) => d.id === rec.defId)) {
          this.spawnItem({ ...rec, scale: rec.scale ?? 1.0 });
        }
      }
    } catch {
      // Ignore corrupted local storage
    }
  }
}

let cachedShadowMat: THREE.MeshBasicMaterial | null = null;
function getContactShadowMat(): THREE.MeshBasicMaterial {
  if (!cachedShadowMat) {
    cachedShadowMat = new THREE.MeshBasicMaterial({
      map: createSoftShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
  }
  return cachedShadowMat;
}

export function buildDecorMesh(defId: string, assets?: HybridAssetLoader): THREE.Group {
  if (assets) {
    const gltfMap: Record<string, { id: string; h: number }> = {
      'lounge-chair': { id: 'mid_century_lounge_chair', h: 0.84 },
      'coffee-table': { id: 'coffee_table_round_01', h: 0.44 },
      'garden-lantern': { id: 'Lantern_01', h: 0.48 },
    };
    if (defId === 'flower-planter' && assets.has('planter_box_01')) {
      const wrap = new THREE.Group();
      const box = assets.cloneNormalized('planter_box_01', 0.42)!;
      wrap.add(box);
      const fl = assets.cloneNormalized('flower_gazania', 0.34);
      if (fl) {
        fl.position.y = 0.32;
        wrap.add(fl);
      }
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), getContactShadowMat());
      cs.rotation.x = -Math.PI / 2;
      cs.position.y = 0.012;
      wrap.add(cs);
      return wrap;
    }
    const spec = gltfMap[defId];
    if (spec && assets.has(spec.id)) {
      const wrap = new THREE.Group();
      const model = assets.cloneNormalized(spec.id, spec.h)!;
      wrap.add(model);
      const cs = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), getContactShadowMat());
      cs.rotation.x = -Math.PI / 2;
      cs.position.y = 0.012;
      wrap.add(cs);
      return wrap;
    }
  }

  const g = new THREE.Group();
  const oakMat = new THREE.MeshStandardMaterial({ color: '#b57b45', roughness: 0.62 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#6b4728', roughness: 0.72 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: '#efe8d8', roughness: 0.88 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#22262b', roughness: 0.45, metalness: 0.55 });

  switch (defId) {
    case 'lounge-chair': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.60), oakMat);
      seat.position.set(0, 0.36, 0);
      seat.rotation.x = -0.14;
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.52), cushionMat);
      cushion.position.set(0, 0.43, 0.02);
      cushion.rotation.x = -0.14;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.62, 0.06), oakMat);
      back.position.set(0, 0.66, -0.27);
      back.rotation.x = -0.26;
      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.08), cushionMat);
      backCushion.position.set(0, 0.65, -0.21);
      backCushion.rotation.x = -0.26;
      g.add(seat, cushion, back, backCushion);
      for (const sx of [-0.35, 0.35]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.64), oakMat);
        arm.position.set(sx, 0.56, -0.02);
        const legF = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.07), oakMat);
        legF.position.set(sx, 0.28, 0.24);
        const legB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 0.07), oakMat);
        legB.position.set(sx, 0.27, -0.24);
        g.add(arm, legF, legB);
      }
      break;
    }

    case 'coffee-table': {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.05, 20), oakMat);
      top.position.y = 0.44;
      g.add(top);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, 0.44, 8), darkWoodMat);
        leg.position.set(Math.cos(a) * 0.26, 0.22, Math.sin(a) * 0.26);
        g.add(leg);
      }
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.04, 0.09, 12),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
      );
      mug.position.set(0.12, 0.51, 0.06);
      g.add(mug);
      break;
    }

    case 'flower-planter': {
      const potMat = new THREE.MeshStandardMaterial({ color: '#b86443', roughness: 0.85 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.38, 14), potMat);
      pot.position.y = 0.19;
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: '#3b2b1d', roughness: 0.95 })
      );
      soil.position.y = 0.37;
      const foliageMat = new THREE.MeshStandardMaterial({ color: '#4d912a', roughness: 0.78 });
      const flowerMat = new THREE.MeshStandardMaterial({ color: '#f5f2eb', roughness: 0.7 });
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), foliageMat);
      bush.position.y = 0.55;
      bush.scale.set(1.15, 0.9, 1.15);
      g.add(pot, soil, bush);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), flowerMat);
        fl.position.set(Math.cos(a) * 0.15, 0.68 + (i % 2) * 0.05, Math.sin(a) * 0.15);
        g.add(fl);
      }
      break;
    }

    case 'garden-lantern': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.08, 8), ironMat);
      base.position.y = 0.04;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.72, 8), ironMat);
      post.position.y = 0.42;
      const cage = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.26, 0.20), ironMat);
      cage.position.y = 0.88;
      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.18, 0.14),
        new THREE.MeshStandardMaterial({
          color: '#fff2cc',
          emissive: '#ffaa3b',
          emissiveIntensity: 2.0,
        })
      );
      glow.position.y = 0.88;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.12, 4), ironMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = 1.07;
      g.add(base, post, cage, glow, cap);
      break;
    }

    case 'lakeside-bench': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.48), oakMat);
      seat.position.y = 0.45;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.36, 0.06), oakMat);
      back.position.set(0, 0.76, -0.21);
      back.rotation.x = -0.14;
      g.add(seat, back);
      for (const sx of [-0.62, 0.62]) {
        const legF = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.07), darkWoodMat);
        legF.position.set(sx, 0.225, 0.18);
        const legB = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.88, 0.07), darkWoodMat);
        legB.position.set(sx, 0.44, -0.20);
        g.add(legF, legB);
      }
      break;
    }

    case 'woven-rug': {
      const outer = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.018, 1.45),
        new THREE.MeshStandardMaterial({ color: '#dfd3be', roughness: 0.95 })
      );
      outer.position.y = 0.01;
      const inner = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.02, 1.12),
        new THREE.MeshStandardMaterial({ color: '#b55d3b', roughness: 0.95 })
      );
      inner.position.y = 0.012;
      const center = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.022, 0.66),
        new THREE.MeshStandardMaterial({ color: '#eadcc7', roughness: 0.95 })
      );
      center.position.y = 0.014;
      g.add(outer, inner, center);
      break;
    }

    case 'firewood-stack': {
      const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.36), ironMat);
      rackL.position.set(-0.34, 0.28, 0);
      const rackR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.56, 0.36), ironMat);
      rackR.position.set(0.34, 0.28, 0);
      const rackB = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.36), ironMat);
      rackB.position.set(0, 0.04, 0);
      g.add(rackL, rackR, rackB);
      const barkMat = new THREE.MeshStandardMaterial({ color: '#7a583b', roughness: 0.9 });
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4 - (row % 2); col++) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.38, 8), barkMat);
          log.rotation.x = Math.PI / 2;
          log.position.set(-0.21 + col * 0.14 + (row % 2) * 0.07, 0.12 + row * 0.11, 0);
          g.add(log);
        }
      }
      break;
    }
  }

  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  if (defId !== 'woven-rug') {
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), getContactShadowMat());
    cs.rotation.x = -Math.PI / 2;
    cs.position.y = 0.012;
    g.add(cs);
  }
  return g;
}
