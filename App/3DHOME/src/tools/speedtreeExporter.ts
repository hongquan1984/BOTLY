import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export async function convertFbxToGlb(
  fbxUrl: string,
  texMap: Record<string, { diffuse: string; normal?: string }>,
  scale = 0.01
): Promise<ArrayBuffer> {
  const fbxLoader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  const fbx = await new Promise<THREE.Group>((resolve, reject) => {
    fbxLoader.load(fbxUrl, resolve, undefined, reject);
  });

  fbx.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const matName = ((mesh.material as THREE.Material)?.name || '').toLowerCase();

      let diffuse = '';
      let normal = '';
      for (const [key, files] of Object.entries(texMap)) {
        if (matName.includes(key) || mesh.name.toLowerCase().includes(key)) {
          diffuse = files.diffuse;
          normal = files.normal || '';
          break;
        }
      }
      if (!diffuse) {
        const first = Object.values(texMap)[0];
        diffuse = first.diffuse;
        normal = first.normal || '';
      }

      const map = texLoader.load(diffuse);
      map.colorSpace = THREE.SRGBColorSpace;
      const norm = normal ? texLoader.load(normal) : null;
      const isLeaves = matName.includes('leaf') || matName.includes('leaves') || mesh.name.toLowerCase().includes('leaf');

      mesh.material = new THREE.MeshStandardMaterial({
        map,
        normalMap: norm,
        roughness: isLeaves ? 0.65 : 0.88,
        metalness: 0.02,
        side: isLeaves ? THREE.DoubleSide : THREE.FrontSide,
        alphaTest: isLeaves ? 0.45 : 0.0,
        transparent: isLeaves,
      });
    }
  });

  fbx.scale.setScalar(scale);

  const exporter = new GLTFExporter();
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      fbx,
      (res) => resolve(res as ArrayBuffer),
      (err) => reject(err),
      { binary: true }
    );
  });
}
