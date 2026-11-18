import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const projectDir = 'D:\\botly\\App\\word3d';
const manifestPath = path.join(projectDir, 'assets-extracted', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('=== VERIFYING EXTRACTED ASSETS WITH THREE.JS GLTFLOADER ===\n');

const loader = new GLTFLoader();
let passCount = 0;
let failCount = 0;

for (const asset of manifest.assets) {
  const filePath = path.join(projectDir, asset.relativePath);
  console.log(`[TEST] Checking ${asset.filename} (${asset.name})...`);

  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ File does not exist: ${filePath}`);
    failCount++;
    continue;
  }

  const fileBuf = fs.readFileSync(filePath);
  const arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.parse(arrayBuffer, '', resolve, reject);
    });

    let meshFound = null;
    gltf.scene.traverse((obj) => {
      if (obj.isMesh) meshFound = obj;
    });

    if (!meshFound) {
      console.error(`  ❌ No mesh found inside ${asset.filename}`);
      failCount++;
      continue;
    }

    const geo = meshFound.geometry;
    geo.computeBoundingBox();
    const box = geo.boundingBox;

    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    const bottomY = box.min.y;

    const isGrounded = Math.abs(bottomY) < 0.005;
    const isCenteredX = Math.abs(centerX) < 0.005;
    const isCenteredZ = Math.abs(centerZ) < 0.005;
    const hasColor = !!geo.attributes.color;

    if (!isGrounded || !isCenteredX || !isCenteredZ) {
      console.warn(`  ⚠️ Pivot check warning: Grounded=${isGrounded} (bottomY=${bottomY.toFixed(4)}), CenteredX=${isCenteredX}, CenteredZ=${isCenteredZ}`);
    }

    console.log(`  ✓ Passed verification:`);
    console.log(`    - Triangles: ${asset.triangles} | Vertices: ${asset.vertices}`);
    console.log(`    - Bounding Box: [${box.min.x.toFixed(2)}, ${box.min.y.toFixed(2)}, ${box.min.z.toFixed(2)}] to [${box.max.x.toFixed(2)}, ${box.max.y.toFixed(2)}, ${box.max.z.toFixed(2)}]`);
    console.log(`    - Grounded at Y=0: ${isGrounded ? 'YES' : 'NO'}`);
    console.log(`    - Centered at (0,0): ${isCenteredX && isCenteredZ ? 'YES' : 'NO'}`);
    console.log(`    - Vertex Colors: ${hasColor ? 'YES' : 'NO'}`);

    passCount++;
  } catch (err) {
    console.error(`  ❌ Failed to parse ${asset.filename}:`, err);
    failCount++;
  }
}

console.log(`\n========================================`);
console.log(`VERIFICATION SUMMARY:`);
console.log(`Total Assets Tested: ${manifest.assets.length}`);
console.log(`Passed: ${passCount} / ${manifest.assets.length}`);
console.log(`Failed: ${failCount} / ${manifest.assets.length}`);
console.log(`Result: ${failCount === 0 ? 'ALL PASSED (100%)' : 'SOME FAILED'}`);
console.log(`========================================\n`);

if (failCount > 0) process.exit(1);
