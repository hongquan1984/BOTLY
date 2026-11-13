import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HYBRID_ASSET_REGISTRY } from './AssetTierRegistry';

interface PreparedAsset {
  id: string;
  template: THREE.Group;
  size: THREE.Vector3;
}

export class HybridAssetLoader {
  private loader = new GLTFLoader();
  private cache = new Map<string, PreparedAsset>();
  private failed = new Set<string>();
  private static readonly ASSET_CACHE_NAME = 'alpine-chalet-glb-v1';

  private async fetchWithCache(url: string): Promise<ArrayBuffer> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const storage = await window.caches.open(HybridAssetLoader.ASSET_CACHE_NAME);
        const hit = await storage.match(url);
        if (hit && hit.ok) {
          return await hit.arrayBuffer();
        }
        const net = await fetch(url);
        if (!net.ok) throw new Error(`HTTP ${net.status}`);
        await storage.put(url, net.clone());
        return await net.arrayBuffer();
      } catch {
        // Fallback smoothly to regular fetch when CacheStorage is restricted
      }
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.arrayBuffer();
  }

  private async loadSpec(
    spec: (typeof HYBRID_ASSET_REGISTRY)[number],
    loaded: string[],
    missing: string[]
  ): Promise<void> {
    if (this.cache.has(spec.id)) {
      loaded.push(spec.id);
      return;
    }
    try {
      if (spec.id === 'chalet_hero') {
        const head = await fetch(spec.url, { method: 'HEAD' });
        if (!head.ok || head.headers.get('content-type')?.includes('text/html')) {
          this.failed.add(spec.id);
          missing.push(spec.id);
          return;
        }
      }

      const buf = await this.fetchWithCache(spec.url);
      const gltf = await this.loader.parseAsync(buf, '');
      const root = new THREE.Group();
      root.add(gltf.scene);

      // Normalize pivot: center XZ and place bottom at y = 0
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      gltf.scene.position.x -= center.x;
      gltf.scene.position.z -= center.z;
      gltf.scene.position.y -= box.min.y;

      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m && 'envMapIntensity' in m) {
              const std = m as THREE.MeshStandardMaterial;
              std.envMapIntensity = 0.42;
              const isLeaves = m.name && m.name.toLowerCase().includes('leaves');
              if (isLeaves) {
                std.alphaTest = 0.45;
                std.transparent = false;
                std.depthWrite = true;
                std.side = THREE.DoubleSide;
              } else if (spec.tier === 'secondary' && std.transparent) {
                std.alphaTest = Math.max(0.38, std.alphaTest || 0.42);
                std.transparent = false;
                std.depthWrite = true;
              }
            }
          }
        }
      });

      this.cache.set(spec.id, { id: spec.id, template: root, size });
      loaded.push(spec.id);
    } catch (err) {
      console.error(`[HybridAssetLoader] Failed loading ${spec.id} (${spec.url}):`, err);
      this.failed.add(spec.id);
      missing.push(spec.id);
    }
  }

  /**
   * Phase 1: Loads critical Living Room + Exterior Core so the first screen mounts fast.
   */
  public async preloadPhase1(): Promise<{ loaded: string[]; missing: string[] }> {
    const loaded: string[] = [];
    const missing: string[] = [];
    const phase1Specs = HYBRID_ASSET_REGISTRY.filter((s) => (s.loadPhase ?? 1) === 1);
    await Promise.all(phase1Specs.map((spec) => this.loadSpec(spec, loaded, missing)));
    return { loaded, missing };
  }

  /**
   * Phase 2: Streams Kitchen, Master Bedroom, WC & decorative luxury models in batches in background.
   */
  public async preloadPhase2(): Promise<{ loaded: string[]; missing: string[] }> {
    const loaded: string[] = [];
    const missing: string[] = [];
    const phase2Specs = HYBRID_ASSET_REGISTRY.filter((s) => s.loadPhase === 2);
    const batchSize = 4;
    for (let i = 0; i < phase2Specs.length; i += batchSize) {
      const slice = phase2Specs.slice(i, i + batchSize);
      await Promise.all(slice.map((spec) => this.loadSpec(spec, loaded, missing)));
    }
    return { loaded, missing };
  }

  /**
   * Preloads all available CC0 GLTF assets (Phase 1 + Phase 2).
   */
  public async preloadAll(): Promise<{ loaded: string[]; missing: string[] }> {
    const p1 = await this.preloadPhase1();
    const p2 = await this.preloadPhase2();
    return {
      loaded: [...p1.loaded, ...p2.loaded],
      missing: [...p1.missing, ...p2.missing],
    };
  }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public getSize(id: string): THREE.Vector3 | null {
    return this.cache.get(id)?.size.clone() ?? null;
  }

  /**
   * Returns a scaled clone of a loaded GLTF hero asset with bottom anchored at y = 0.
   */
  public cloneNormalized(id: string, targetHeight?: number): THREE.Group | null {
    const entry = this.cache.get(id);
    if (!entry) return null;
    const clone = entry.template.clone(true);
    if (targetHeight && entry.size.y > 0.001) {
      const s = targetHeight / entry.size.y;
      clone.scale.setScalar(s);
    }
    return clone;
  }

  /**
   * Creates InstancedMesh batches from a multi-submesh GLTF botanical/rock model,
   * preserving submesh transforms and PBR materials with minimal draw calls.
   */
  public createInstancedBatches(
    id: string,
    matrices: THREE.Matrix4[],
    options?: {
      colors?: THREE.Color[];
      castShadow?: boolean;
      receiveShadow?: boolean;
    }
  ): THREE.Group | null {
    const entry = this.cache.get(id);
    if (!entry || matrices.length === 0) return null;

    const batchGroup = new THREE.Group();
    entry.template.updateMatrixWorld(true);

    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();

    entry.template.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!mat) return;
      const g = obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone();
      g.applyMatrix4(obj.matrixWorld);
      // Keep only standard attributes so mergeGeometries succeeds across submeshes
      for (const attr of Object.keys(g.attributes)) {
        if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') {
          g.deleteAttribute(attr);
        }
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) {
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      }
      let bucket = byMaterial.get(mat);
      if (!bucket) {
        bucket = [];
        byMaterial.set(mat, bucket);
      }
      bucket.push(g);
    });

    byMaterial.forEach((geos, mat) => {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (geos.length > 1) geos.forEach((g) => g.dispose());
      if (!merged) return;
      const inst = new THREE.InstancedMesh(merged, mat, matrices.length);
      for (let i = 0; i < matrices.length; i++) {
        inst.setMatrixAt(i, matrices[i]);
        if (options?.colors && options.colors[i]) {
          inst.setColorAt(i, options.colors[i]);
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.castShadow = options?.castShadow ?? false;
      inst.receiveShadow = options?.receiveShadow ?? true;
      inst.computeBoundingSphere();
      inst.frustumCulled = true;
      batchGroup.add(inst);
    });

    return batchGroup;
  }

  public getLoadedIds(): string[] {
    return Array.from(this.cache.keys());
  }
}
