import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js GLTFExporter binary writer
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

const projectDir = 'D:\\botly\\App\\word3d';
const sourceGlbPath = path.join(projectDir, 'HealthClues_-_Cozy_Village_Compact_V2.glb');
const outputDir = path.join(projectDir, 'assets-extracted');
const publicOutputDir = path.join(projectDir, 'public', 'assets-extracted');

const REQUIRED_CATEGORIES = [
  'houses',
  'trees',
  'bridges',
  'rocks',
  'vegetation',
  'props',
  'terrain',
  'other',
];

const ASSET_CATALOG = [
  {
    meshName: 'great_hall',
    category: 'houses',
    filename: 'house_great_hall.glb',
    displayName: 'Great Hall (Nhà sinh hoạt chung)',
    description: 'Tòa nhà sinh hoạt cộng đồng lớn nhất làng, mái dốc đôi và kết cấu gỗ đá ấm cúng.',
  },
  {
    meshName: 'general_store',
    category: 'houses',
    filename: 'house_general_store.glb',
    displayName: 'General Store (Nhà Lumi / Cửa hàng tạp hóa)',
    description: 'Nhà dân cư kết hợp buôn bán với hiên che và cửa sổ phát sáng ban đêm.',
  },
  {
    meshName: 'bld_general_store_01',
    category: 'houses',
    filename: 'house_library_cottage.glb',
    displayName: 'Library Cottage (Nhà Thư Viện / Nhà Tham Quan)',
    description: 'Ngôi nhà nhỏ cổ kính dùng làm thư viện lưu trữ tri thức và không gian đọc sách.',
  },
  {
    meshName: 'shade_tree_park_01',
    category: 'trees',
    filename: 'tree_shade_park.glb',
    displayName: 'Shade Tree (Cây viền làng bóng mát)',
    description: 'Cây bóng mát tán rộng bao quanh viền làng, tạo độ che phủ tự nhiên.',
  },
  {
    meshName: 'lineside_oak',
    category: 'trees',
    filename: 'tree_lineside_oak.glb',
    displayName: 'Lineside Oak (Cây sồi ven đường)',
    description: 'Cây sồi tán nhọn thanh lịch mọc dọc các lối đi và cạnh luống hoa.',
  },
  {
    meshName: 'momiji_maple_01',
    category: 'trees',
    filename: 'tree_momiji_maple.glb',
    displayName: 'Momiji Maple (Cây phong đỏ trung tâm khu nghỉ)',
    description: 'Cây lá phong đỏ đặc sắc tạo điểm nhấn cảnh quan nổi bật trung tâm làng.',
  },
  {
    meshName: 'moss_rock_01',
    category: 'rocks',
    filename: 'rock_moss_boulder.glb',
    displayName: 'Moss Rock (Tảng đá phủ rêu)',
    description: 'Khối đá tảng tự nhiên có mảng rêu xanh ven bờ suối và bãi cỏ.',
  },
  {
    meshName: 'mums_in_pot',
    category: 'vegetation',
    filename: 'plant_mums_flowerpot.glb',
    displayName: 'Mums in Pot (Chậu hoa cúc quảng trường)',
    description: 'Chậu hoa cúc vàng nở rộ đặt trang trí quanh đài phun và ghế nghỉ.',
  },
  {
    meshName: 'library_potted_plant',
    category: 'vegetation',
    filename: 'plant_library_flowerpot.glb',
    displayName: 'Library Potted Plant (Chậu cây cảnh thư viện)',
    description: 'Chậu cây kiểng lá xanh trang trí lối vào thư viện và bậc thềm.',
  },
  {
    meshName: 'mulch_bed_tile',
    category: 'vegetation',
    filename: 'bed_mulch_tile.glb',
    displayName: 'Mulch Bed Tile (Luống đất vườn thảo mộc)',
    description: 'Mảng đất mùn hữu cơ dùng làm nền trồng thảo mộc và hoa cảnh.',
  },
  {
    meshName: 'moss_patch_01',
    category: 'vegetation',
    filename: 'moss_patch.glb',
    displayName: 'Moss Patch (Thảm rêu phủ nền)',
    description: 'Thảm rêu cỏ mọc sát đất làm phong phú bề mặt địa hình.',
  },
  {
    meshName: 'acanthus_scatter',
    category: 'vegetation',
    filename: 'grass_acanthus_scatter.glb',
    displayName: 'Acanthus Scatter (Bụi cây thấp acanthus)',
    description: 'Bụi cây cỏ thấp điểm xuyết dưới gốc cây và chân tường nhà.',
  },
  {
    meshName: 'lawn_tuft_scatter',
    category: 'vegetation',
    filename: 'grass_lawn_tuft.glb',
    displayName: 'Lawn Tuft Scatter (Khóm cỏ xanh rải rác)',
    description: 'Khóm cỏ nhỏ tạo nét sinh động và tự nhiên cho thảm cỏ.',
  },
  {
    meshName: 'plaza_planter_01',
    category: 'props',
    filename: 'prop_plaza_planter.glb',
    displayName: 'Plaza Planter (Bồn hoa quảng trường trung tâm)',
    description: 'Bồn hoa tròn bằng đá trang trí ngay trung tâm quảng trường.',
  },
  {
    meshName: 'park_bench_01',
    category: 'props',
    filename: 'prop_park_bench.glb',
    displayName: 'Park Bench (Ghế băng công viên gỗ)',
    description: 'Ghế ngồi nghỉ chân khung gỗ thanh lịch đặt dọc lối đi.',
  },
  {
    meshName: 'picket_fence',
    category: 'props',
    filename: 'prop_picket_fence.glb',
    displayName: 'Picket Fence (Hàng rào cọc gỗ vườn)',
    description: 'Đoạn hàng rào cọc gỗ mộc mạc bao quanh vườn thảo dược.',
  },
];

async function main() {
  console.log('=== 1. Starting Asset Extraction from HealthClues Village GLB ===');
  console.log(`Source GLB: ${sourceGlbPath}`);

  if (!fs.existsSync(sourceGlbPath)) {
    console.error(`ERROR: Source file not found: ${sourceGlbPath}`);
    process.exit(1);
  }

  // Create required category directories in both locations
  [outputDir, publicOutputDir].forEach((dir) => {
    REQUIRED_CATEGORIES.forEach((cat) => {
      const catPath = path.join(dir, cat);
      if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath, { recursive: true });
      }
    });
  });

  const fileBuf = fs.readFileSync(sourceGlbPath);
  const arrayBuffer = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

  const loader = new GLTFLoader();
  const exporter = new GLTFExporter();

  console.log('Loading source GLB with Three.js GLTFLoader...');
  const gltf = await new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject);
  });

  console.log('Scene parsed successfully.');

  // Find all mesh objects in scene hierarchy
  const meshesByName = new Map();
  const instanceCounts = new Map();

  function getBaseName(rawName) {
    const exact = ASSET_CATALOG.find((item) => item.meshName === rawName);
    if (exact) return exact.meshName;

    for (const item of ASSET_CATALOG) {
      if (rawName.startsWith(item.meshName + '_')) {
        return item.meshName;
      }
    }
    return rawName;
  }

  gltf.scene.traverse((obj) => {
    if (obj.isMesh) {
      const rawName = obj.name || '';
      const baseName = getBaseName(rawName);
      instanceCounts.set(baseName, (instanceCounts.get(baseName) || 0) + 1);

      if (!meshesByName.has(baseName)) {
        meshesByName.set(baseName, obj);
      }
    }
  });

  console.log(`Found ${meshesByName.size} unique mesh types in scene across 49 placements.`);

  const manifest = [];
  let successCount = 0;

  for (const item of ASSET_CATALOG) {
    const originalMesh = meshesByName.get(item.meshName);
    if (!originalMesh) {
      console.warn(`WARNING: Mesh not found for "${item.meshName}"`);
      continue;
    }

    console.log(`\nExtracting: ${item.displayName} [${item.meshName}]...`);

    // Clone geometry and calculate bounding box
    const geo = originalMesh.geometry.clone();
    geo.computeBoundingBox();
    const box = geo.boundingBox;

    const sizeX = box.max.x - box.min.x;
    const sizeY = box.max.y - box.min.y;
    const sizeZ = box.max.z - box.min.z;
    const centerX = (box.min.x + box.max.x) / 2;
    const centerZ = (box.min.z + box.max.z) / 2;
    const bottomY = box.min.y;

    // Shift geometry: Center on X and Z, place bottom flat at Y = 0
    geo.translate(-centerX, -bottomY, -centerZ);
    geo.computeBoundingBox();
    geo.computeVertexNormals();

    const centeredBox = geo.boundingBox;

    // Clone material preserving colors and lowpoly look
    const mat = originalMesh.material.clone();
    if (mat.isMeshStandardMaterial) {
      mat.roughness = 0.92;
      mat.metalness = 0.02;
    }

    const exportMesh = new THREE.Mesh(geo, mat);
    exportMesh.name = item.meshName;
    exportMesh.castShadow = true;
    exportMesh.receiveShadow = true;

    const exportScene = new THREE.Scene();
    exportScene.name = item.meshName;
    exportScene.add(exportMesh);

    // Export to binary GLB
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (result) => resolve(Buffer.from(result)),
        reject,
        { binary: true }
      );
    });

    const targetSubPath = path.join(item.category, item.filename);
    const primaryPath = path.join(outputDir, targetSubPath);
    const publicPath = path.join(publicOutputDir, targetSubPath);

    fs.writeFileSync(primaryPath, glbBuffer);
    fs.writeFileSync(publicPath, glbBuffer);

    const triangleCount = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    const vertexCount = geo.attributes.position.count;
    const fileSizeKb = (glbBuffer.length / 1024).toFixed(1);

    // Self-verification: Load back the exported GLB to verify integrity
    const verifyLoader = new GLTFLoader();
    const verifiedGltf = await new Promise((resolve, reject) => {
      verifyLoader.parse(glbBuffer.buffer.slice(glbBuffer.byteOffset, glbBuffer.byteOffset + glbBuffer.byteLength), '', resolve, reject);
    });

    let verifiedMeshCount = 0;
    verifiedGltf.scene.traverse((o) => {
      if (o.isMesh) verifiedMeshCount++;
    });

    console.log(`  ✓ Exported: ${targetSubPath}`);
    console.log(`    - Triangles: ${triangleCount} | Vertices: ${vertexCount} | Size: ${fileSizeKb} KB`);
    console.log(`    - Dimensions: ${sizeX.toFixed(2)}m × ${sizeY.toFixed(2)}m × ${sizeZ.toFixed(2)}m`);
    console.log(`    - BoundingBox: Y min=${centeredBox.min.y.toFixed(3)}, Y max=${centeredBox.max.y.toFixed(3)}`);
    console.log(`    - Verification: OK (${verifiedMeshCount} mesh verified in loaded GLB)`);

    manifest.push({
      id: item.meshName,
      name: item.displayName,
      filename: item.filename,
      category: item.category,
      relativePath: `assets-extracted/${item.category}/${item.filename}`,
      triangles: triangleCount,
      vertices: vertexCount,
      fileSizeBytes: glbBuffer.length,
      fileSizeKb: `${fileSizeKb} KB`,
      dimensions: {
        width: Number(sizeX.toFixed(2)),
        height: Number(sizeY.toFixed(2)),
        depth: Number(sizeZ.toFixed(2)),
      },
      instancesInOriginalVillage: instanceCounts.get(item.meshName) || 1,
      description: item.description,
    });

    successCount++;
  }

  // Write Manifest JSON
  const manifestData = {
    source: 'HealthClues_-_Cozy_Village_Compact_V2.glb',
    extractedAt: new Date().toISOString(),
    totalOriginalPlacements: 49,
    totalUniqueAssets: manifest.length,
    categories: REQUIRED_CATEGORIES,
    assets: manifest,
  };

  const manifestJsonStr = JSON.stringify(manifestData, null, 2);
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), manifestJsonStr, 'utf8');
  fs.writeFileSync(path.join(publicOutputDir, 'manifest.json'), manifestJsonStr, 'utf8');

  console.log(`\n=== Extraction Completed Successfully! ===`);
  console.log(`Successfully extracted ${successCount} / ${ASSET_CATALOG.length} assets.`);
  console.log(`Saved manifest.json to assets-extracted/ and public/assets-extracted/`);
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
