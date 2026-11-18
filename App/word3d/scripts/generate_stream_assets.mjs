import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
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
const outputDir = path.join(projectDir, 'assets-extracted', 'terrain');
const publicOutputDir = path.join(projectDir, 'public', 'assets-extracted', 'terrain');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(publicOutputDir, { recursive: true });

const waterMat = new THREE.MeshStandardMaterial({
  color: '#38bdf8',
  roughness: 0.08,
  metalness: 0.45,
  transparent: true,
  opacity: 0.88,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const stoneMat = new THREE.MeshStandardMaterial({
  color: '#57534e',
  roughness: 0.82,
  metalness: 0.04,
  flatShading: true,
});

const mossStoneMat = new THREE.MeshStandardMaterial({
  color: '#44403c',
  roughness: 0.88,
  metalness: 0.02,
  flatShading: true,
});

const foamMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.3,
  metalness: 0.1,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const lilyMat = new THREE.MeshStandardMaterial({
  color: '#15803d',
  roughness: 0.6,
  side: THREE.DoubleSide,
});

// Helper to create jittered stylized rock
function createRock(radius, mat) {
  const geo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const scale = 1.0 + (Math.sin(v.x * 12 + v.y * 7) * 0.12);
    v.multiplyScalar(scale);
    v.y *= 0.75; // slightly flattened boulder
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat || stoneMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// 1. Build Straight Stream (stream_straight_01)
function buildStraightStream() {
  const group = new THREE.Group();
  group.name = 'Stream_Straight_01';

  const length = 6.0;
  const width = 2.6;
  const bedDepth = 0.22;

  // Riverbed base
  const bedGeo = new THREE.BoxGeometry(width + 0.6, bedDepth, length);
  const bedMesh = new THREE.Mesh(bedGeo, mossStoneMat);
  bedMesh.position.set(0, bedDepth / 2, 0);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  // Water Surface
  const waterGeo = new THREE.PlaneGeometry(width, length - 0.05, 12, 12);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, bedDepth + 0.04, 0);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Left Bank Boulders
  const rockOffsetsZ = [-2.5, -1.8, -1.0, -0.2, 0.6, 1.4, 2.2];
  rockOffsetsZ.forEach((rz, idx) => {
    const r1 = createRock(0.25 + (idx % 3) * 0.06, idx % 2 === 0 ? stoneMat : mossStoneMat);
    r1.position.set(-(width / 2) - 0.15 + (Math.sin(idx * 3) * 0.08), bedDepth + 0.08, rz);
    r1.rotation.y = idx * 0.8;
    group.add(r1);

    const r2 = createRock(0.24 + ((idx + 1) % 3) * 0.06, idx % 2 === 1 ? stoneMat : mossStoneMat);
    r2.position.set((width / 2) + 0.15 + (Math.cos(idx * 4) * 0.08), bedDepth + 0.08, rz + 0.35);
    r2.rotation.y = idx * 1.2;
    group.add(r2);
  });

  // Stepping stones in middle of the stream
  const step1 = createRock(0.28, stoneMat);
  step1.position.set(-0.35, bedDepth + 0.08, 0.4);
  step1.scale.set(1.1, 0.6, 1.1);
  group.add(step1);

  const step2 = createRock(0.26, mossStoneMat);
  step2.position.set(0.35, bedDepth + 0.07, -0.5);
  step2.scale.set(1.1, 0.6, 1.1);
  group.add(step2);

  return group;
}

// 2. Build Curved Stream Bend (stream_curve_01)
function buildCurvedStream() {
  const group = new THREE.Group();
  group.name = 'Stream_Curve_01';

  const innerR = 2.0;
  const outerR = 4.6;
  const midR = (innerR + outerR) / 2;
  const segments = 20;

  // Riverbed curved channel
  const bedShape = new THREE.Shape();
  bedShape.absarc(0, 0, outerR + 0.3, 0, Math.PI / 2, false);
  bedShape.lineTo(0, innerR - 0.3);
  bedShape.absarc(0, 0, innerR - 0.3, Math.PI / 2, 0, true);
  bedShape.closePath();

  const bedExtrudeGeo = new THREE.ExtrudeGeometry(bedShape, {
    depth: 0.22,
    bevelEnabled: false,
  });
  bedExtrudeGeo.rotateX(Math.PI / 2);
  const bedMesh = new THREE.Mesh(bedExtrudeGeo, mossStoneMat);
  bedMesh.position.set(-midR, 0, -midR);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  // Curved Water Surface
  const waterGeo = new THREE.RingGeometry(innerR, outerR, segments, 4, 0, Math.PI / 2);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(-midR, 0.26, -midR);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Rocks along inner and outer arc
  for (let i = 0; i <= 8; i++) {
    const angle = (i / 8) * (Math.PI / 2);
    // Outer rock
    const ox = Math.cos(angle) * (outerR + 0.2) - midR;
    const oz = Math.sin(angle) * (outerR + 0.2) - midR;
    const rockO = createRock(0.28, i % 2 === 0 ? stoneMat : mossStoneMat);
    rockO.position.set(ox, 0.3, oz);
    group.add(rockO);

    // Inner rock
    const ix = Math.cos(angle) * (innerR - 0.15) - midR;
    const iz = Math.sin(angle) * (innerR - 0.15) - midR;
    const rockI = createRock(0.26, i % 2 === 1 ? stoneMat : mossStoneMat);
    rockI.position.set(ix, 0.3, iz);
    group.add(rockI);
  }

  // Stepping stone along the curve
  const midAngle = Math.PI / 4;
  const sx = Math.cos(midAngle) * midR - midR;
  const sz = Math.sin(midAngle) * midR - midR;
  const step = createRock(0.3, stoneMat);
  step.position.set(sx, 0.3, sz);
  step.scale.set(1.2, 0.6, 1.2);
  group.add(step);

  return group;
}

// 3. Build Mossy Rock Pond (stream_pond_01)
function buildMossyPond() {
  const group = new THREE.Group();
  group.name = 'Stream_Pond_01';

  const radiusX = 2.6;
  const radiusZ = 2.2;
  const depth = 0.24;

  // Pond basin
  const basinGeo = new THREE.CylinderGeometry(radiusX + 0.4, radiusX + 0.2, depth, 24);
  const basinMesh = new THREE.Mesh(basinGeo, mossStoneMat);
  basinMesh.position.set(0, depth / 2, 0);
  basinMesh.scale.set(1.0, 1.0, radiusZ / radiusX);
  basinMesh.receiveShadow = true;
  group.add(basinMesh);

  // Water surface
  const waterGeo = new THREE.CircleGeometry(radiusX, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, depth + 0.04, 0);
  waterMesh.scale.set(1.0, 1.0, radiusZ / radiusX);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // Perimeter boulders
  const numRocks = 16;
  for (let i = 0; i < numRocks; i++) {
    const angle = (i / numRocks) * Math.PI * 2;
    const rx = Math.cos(angle) * (radiusX + 0.15);
    const rz = Math.sin(angle) * (radiusZ + 0.15);
    const r = createRock(0.26 + (Math.sin(i * 3) * 0.06), i % 2 === 0 ? stoneMat : mossStoneMat);
    r.position.set(rx, depth + 0.08, rz);
    r.rotation.y = angle + 0.3;
    group.add(r);
  }

  // Floating Lily Pads
  const lilyGeo = new THREE.CircleGeometry(0.22, 12, 0, Math.PI * 1.85); // slit leaf
  lilyGeo.rotateX(-Math.PI / 2);
  const lilyPositions = [
    { x: -0.9, z: 0.6, r: 0.5 },
    { x: -0.6, z: 0.9, r: 1.2 },
    { x: 0.8, z: -0.5, r: 2.1 },
    { x: 1.1, z: -0.2, r: 0.8 },
  ];
  lilyPositions.forEach((lp) => {
    const lily = new THREE.Mesh(lilyGeo, lilyMat);
    lily.position.set(lp.x, depth + 0.06, lp.z);
    lily.rotation.y = lp.r;
    group.add(lily);
  });

  return group;
}

// 4. Build Stepped Rock Waterfall (stream_waterfall_step_01)
function buildWaterfallStep() {
  const group = new THREE.Group();
  group.name = 'Stream_Waterfall_Step_01';

  // Upper terrace rock
  const upperRock = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.0), mossStoneMat);
  upperRock.position.set(0, 1.1, -1.2);
  upperRock.castShadow = true;
  upperRock.receiveShadow = true;
  group.add(upperRock);

  // Upper pool water
  const upperWater = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), waterMat);
  upperWater.rotateX(-Math.PI / 2);
  upperWater.position.set(0, 1.72, -1.2);
  upperWater.receiveShadow = true;
  group.add(upperWater);

  // Cascading water plane
  const cascadeGeo = new THREE.PlaneGeometry(2.2, 1.5, 8, 8);
  const cascade = new THREE.Mesh(cascadeGeo, foamMat);
  cascade.position.set(0, 0.95, -0.15);
  cascade.rotation.x = 0.25; // slight angle
  group.add(cascade);

  // Lower basin
  const lowerBed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 2.4), mossStoneMat);
  lowerBed.position.set(0, 0.125, 1.2);
  lowerBed.receiveShadow = true;
  group.add(lowerBed);

  // Lower water pool
  const lowerWater = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.0), waterMat);
  lowerWater.rotateX(-Math.PI / 2);
  lowerWater.position.set(0, 0.28, 1.2);
  lowerWater.receiveShadow = true;
  group.add(lowerWater);

  // Foam splash crest at base of cascade
  const foamCrest = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.3, 0.1, 16), foamMat);
  foamCrest.position.set(0, 0.3, 0.2);
  foamCrest.scale.set(1.0, 1.0, 0.4);
  group.add(foamCrest);

  // Flanking cliff rocks
  [-1.5, 1.5].forEach((sx) => {
    const cliff = createRock(0.7, mossStoneMat);
    cliff.position.set(sx, 1.0, -0.2);
    cliff.scale.set(1.0, 1.6, 1.2);
    group.add(cliff);
  });

  return group;
}

// Center and ground models flat at Y = 0.000
function normalizeGroup(grp) {
  grp.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(grp);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  const minY = bbox.min.y;

  // Wrap in a container to cleanly shift pivot to bottom center
  const root = new THREE.Group();
  root.name = grp.name;
  root.add(grp);
  grp.position.set(-center.x, -minY, -center.z);
  root.updateMatrixWorld(true);

  const finalBbox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  finalBbox.getSize(size);
  return {
    root,
    dims: {
      width: parseFloat(size.x.toFixed(2)),
      height: parseFloat(size.y.toFixed(2)),
      depth: parseFloat(size.z.toFixed(2)),
    },
  };
}

// Export a THREE.Group to .glb binary buffer
async function exportToGlb(group) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (glb) => resolve(glb),
      (err) => reject(err),
      { binary: true }
    );
  });
}

const STREAM_MODELS = [
  {
    id: 'stream_straight_01',
    name: 'Đoạn Suối Thẳng (Straight River Stream)',
    filename: 'stream_straight_01.glb',
    category: 'terrain',
    builder: buildStraightStream,
    description: 'Đoạn suối thẳng với lòng suối lót sỏi cuội, nước trong xanh phản chiếu và bờ đá phong cách Cozy Fantasy.',
  },
  {
    id: 'stream_curve_01',
    name: 'Đoạn Suối Uốn Lượn (Curved Stream Bend)',
    filename: 'stream_curve_01.glb',
    category: 'terrain',
    builder: buildCurvedStream,
    description: 'Khúc suối uốn cong 90 độ mềm mại, có bờ đá rêu phong và đá cuội lót lòng sông.',
  },
  {
    id: 'stream_pond_01',
    name: 'Hồ Nước Đá Rêu (Mossy Rock Pond)',
    filename: 'stream_pond_01.glb',
    category: 'terrain',
    builder: buildMossyPond,
    description: 'Hồ nước tròn tự nhiên với viền đá cuội, mảng rêu phong và hoa sen nước/lá súng.',
  },
  {
    id: 'stream_waterfall_step_01',
    name: 'Bậc Thác Nước Đá (Stepped Rock Cascade)',
    filename: 'stream_waterfall_step_01.glb',
    category: 'terrain',
    builder: buildWaterfallStep,
    description: 'Tầng thác nước nhỏ đổ từ bậc đá cao xuống thấp, có bọt nước trắng và hồ chứa phía dưới.',
  },
];

async function main() {
  console.log('Generating 4 Cozy Fantasy 3D Stream Models (.glb)...');

  const generatedManifestEntries = [];

  for (const item of STREAM_MODELS) {
    console.log(`Building ${item.name}...`);
    const grp = item.builder();
    const { root, dims } = normalizeGroup(grp);

    // Count triangles and vertices
    let tris = 0;
    let verts = 0;
    root.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry;
        if (geo.index) {
          tris += geo.index.count / 3;
        } else if (geo.attributes.position) {
          tris += geo.attributes.position.count / 3;
        }
        if (geo.attributes.position) {
          verts += geo.attributes.position.count;
        }
      }
    });

    const glbBuffer = await exportToGlb(root);
    const outPath1 = path.join(outputDir, item.filename);
    const outPath2 = path.join(publicOutputDir, item.filename);

    fs.writeFileSync(outPath1, Buffer.from(glbBuffer));
    fs.writeFileSync(outPath2, Buffer.from(glbBuffer));

    const sizeBytes = glbBuffer.byteLength;
    const sizeKb = `${(sizeBytes / 1024).toFixed(1)} KB`;
    console.log(`  ✓ Exported ${item.filename} (${sizeKb}, ${tris} tris, ${dims.width}x${dims.height}x${dims.depth}m)`);

    generatedManifestEntries.push({
      id: item.id,
      name: item.name,
      filename: item.filename,
      category: item.category,
      relativePath: `assets-extracted/terrain/${item.filename}`,
      triangles: Math.round(tris),
      vertices: verts,
      fileSizeBytes: sizeBytes,
      fileSizeKb: sizeKb,
      dimensions: dims,
      instancesInOriginalVillage: 1,
      description: item.description,
    });
  }

  // Update manifest.json in both locations
  const manifestPath1 = path.join(projectDir, 'assets-extracted', 'manifest.json');
  const manifestPath2 = path.join(projectDir, 'public', 'assets-extracted', 'manifest.json');

  const manifest = JSON.parse(fs.readFileSync(manifestPath2, 'utf8'));

  // Filter out any existing entries with same id, then add new entries
  const existingIds = new Set(generatedManifestEntries.map((e) => e.id));
  manifest.assets = manifest.assets.filter((a) => !existingIds.has(a.id));
  manifest.assets.push(...generatedManifestEntries);
  manifest.totalUniqueAssets = manifest.assets.length;

  fs.writeFileSync(manifestPath1, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(manifestPath2, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest.json: total ${manifest.assets.length} unique assets!`);

  console.log('=== All 4 3D Stream Models Generated Successfully! ===');
}

main().catch(console.error);
