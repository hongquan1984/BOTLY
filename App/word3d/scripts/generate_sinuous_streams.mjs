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

// Materials
const waterMat = new THREE.MeshStandardMaterial({
  color: '#38bdf8',
  roughness: 0.06,
  metalness: 0.4,
  transparent: true,
  opacity: 0.88,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const riverbedMat = new THREE.MeshStandardMaterial({
  color: '#3f3f46', // slate river gravel
  roughness: 0.9,
  metalness: 0.05,
  flatShading: true,
});

const stoneMat = new THREE.MeshStandardMaterial({
  color: '#52525b',
  roughness: 0.85,
  metalness: 0.03,
  flatShading: true,
});

const mossStoneMat = new THREE.MeshStandardMaterial({
  color: '#3f4e3c', // mossy green stone
  roughness: 0.88,
  metalness: 0.02,
  flatShading: true,
});

const foamMat = new THREE.MeshStandardMaterial({
  color: '#f8fafc',
  roughness: 0.25,
  metalness: 0.1,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const sandMat = new THREE.MeshStandardMaterial({
  color: '#78716c',
  roughness: 0.95,
  flatShading: true,
});

// Helper to create stylized organic rock
function createRock(radius, mat, deformSeed = 1) {
  const geo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const noise = Math.sin(v.x * 10 + deformSeed) * Math.cos(v.z * 8 + deformSeed) * 0.18;
    v.multiplyScalar(1.0 + noise);
    v.y *= 0.72; // natural river pebble flattened shape
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat || stoneMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ========================================================
// 1. MEANDERING S-CURVE STREAM (Suối Uốn Lượn Chữ S Tự Nhiên)
// ========================================================
function buildMeanderingSCurve() {
  const group = new THREE.Group();
  group.name = 'Stream_Meandering_S_Curve';

  const length = 11.0;
  const numSteps = 60;
  const widthBase = 2.4;

  // Path formula: S-curve meander with primary sine and secondary wobble
  const getCenterPoint = (t) => {
    // t in [-0.5, 0.5]
    const z = t * length;
    const x = Math.sin(t * Math.PI * 2) * 2.2 + Math.sin(t * Math.PI * 4) * 0.45;
    return new THREE.Vector3(x, 0, z);
  };

  const getWidth = (t) => {
    // Widens at bends, slightly narrows at straights
    return widthBase + Math.cos(t * Math.PI * 2) * 0.6 + Math.sin(t * Math.PI * 6) * 0.2;
  };

  // Build contoured riverbed & banks
  // Cross section vertices per step:
  // [0] Left outer bank
  // [1] Left water edge
  // [2] Riverbed bottom
  // [3] Right water edge
  // [4] Right outer bank
  const bedPositions = [];
  const bedNormals = [];
  const bedIndices = [];

  const waterPositions = [];
  const waterNormals = [];
  const waterIndices = [];

  const foamPositions = [];
  const foamIndices = [];

  const yOuter = 0.38;
  const yWater = 0.28;
  const yBottom = 0.04;
  const bankMargin = 0.75;

  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) - 0.5;
    const curr = getCenterPoint(t);
    const next = getCenterPoint(t + 0.005);
    const tangent = new THREE.Vector3().subVectors(next, curr).normalize();
    // Normal perpendicular to tangent in XZ plane
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const w = getWidth(t);
    const halfW = w / 2;

    const leftOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW + bankMargin);
    leftOuter.y = yOuter;

    const leftWater = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW);
    leftWater.y = yWater;

    const centerBed = new THREE.Vector3().copy(curr);
    centerBed.y = yBottom;

    const rightWater = new THREE.Vector3().copy(curr).addScaledVector(normal, -halfW);
    rightWater.y = yWater;

    const rightOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, -(halfW + bankMargin));
    rightOuter.y = yOuter;

    // Push riverbed vertices (5 per ring)
    const baseBedIdx = (bedPositions.length / 3);
    [leftOuter, leftWater, centerBed, rightWater, rightOuter].forEach(pt => {
      bedPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevBedIdx = baseBedIdx - 5;
      // 4 quads across cross section
      for (let q = 0; q < 4; q++) {
        const p1 = prevBedIdx + q;
        const p2 = prevBedIdx + q + 1;
        const p3 = baseBedIdx + q;
        const p4 = baseBedIdx + q + 1;
        bedIndices.push(p1, p3, p2);
        bedIndices.push(p2, p3, p4);
      }
    }

    // Push water vertices (3 per ring: Left edge, Center, Right edge)
    const baseWaterIdx = (waterPositions.length / 3);
    [leftWater, new THREE.Vector3(curr.x, yWater, curr.z), rightWater].forEach(pt => {
      waterPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevWaterIdx = baseWaterIdx - 3;
      // Quad 1: Left to Center
      waterIndices.push(prevWaterIdx, baseWaterIdx, prevWaterIdx + 1);
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx, baseWaterIdx + 1);
      // Quad 2: Center to Right
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx + 1, prevWaterIdx + 2);
      waterIndices.push(prevWaterIdx + 2, baseWaterIdx + 1, baseWaterIdx + 2);
    }

    // Scatter shoreline rocks along both meandering banks
    if (i % 2 === 0) {
      // Left bank rocks
      const rSizeL = 0.22 + Math.sin(i * 1.7) * 0.12;
      const rockL = createRock(rSizeL, (i % 4 === 0) ? mossStoneMat : stoneMat, i);
      const rPosL = new THREE.Vector3().copy(leftWater).addScaledVector(normal, 0.15 + (Math.sin(i) * 0.15));
      rPosL.y = yOuter * 0.85;
      rockL.position.copy(rPosL);
      rockL.rotation.set(Math.sin(i), i * 0.5, Math.cos(i));
      group.add(rockL);

      // Right bank rocks
      const rSizeR = 0.24 + Math.cos(i * 2.3) * 0.13;
      const rockR = createRock(rSizeR, (i % 3 === 0) ? mossStoneMat : stoneMat, i + 50);
      const rPosR = new THREE.Vector3().copy(rightWater).addScaledVector(normal, -(0.15 + (Math.cos(i) * 0.15)));
      rPosR.y = yOuter * 0.85;
      rockR.position.copy(rPosR);
      rockR.rotation.set(Math.cos(i), i * 0.7, Math.sin(i));
      group.add(rockR);
    }

    // Add Stepping stones across the stream at gentle shallow sections
    if (i === 18 || i === 42) {
      for (let s = -1; s <= 1; s++) {
        const step = createRock(0.32, sandMat, i + s * 10);
        const stepPos = new THREE.Vector3().copy(curr).addScaledVector(normal, s * (halfW * 0.55));
        stepPos.y = yWater + 0.08; // slightly above water surface
        step.position.copy(stepPos);
        step.scale.set(1.25, 0.5, 1.25);
        group.add(step);
      }
    }
  }

  // Create riverbed mesh
  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMesh = new THREE.Mesh(bedGeo, riverbedMat);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  // Create water mesh
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  return group;
}

// ========================================================
// 2. WINDING RIVER DOUBLE WAVE (Suối Lượn Sóng Đôi Mềm Mại)
// ========================================================
function buildWindingRiver() {
  const group = new THREE.Group();
  group.name = 'Stream_Winding_River_Double_Wave';

  const length = 13.0;
  const numSteps = 70;
  const widthBase = 3.0;

  // Path formula: Multi-frequency harmonic meander
  const getCenterPoint = (t) => {
    const z = t * length;
    const x = Math.sin(t * Math.PI * 3.0) * 2.5 + Math.cos(t * Math.PI * 1.5) * 1.2;
    return new THREE.Vector3(x, 0, z);
  };

  const getWidth = (t) => {
    return widthBase + Math.sin(t * Math.PI * 4) * 0.8 + 0.2;
  };

  const bedPositions = [];
  const bedIndices = [];
  const waterPositions = [];
  const waterIndices = [];

  const yOuter = 0.36;
  const yWater = 0.27;
  const yBottom = 0.03;
  const bankMargin = 0.85;

  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) - 0.5;
    const curr = getCenterPoint(t);
    const next = getCenterPoint(t + 0.005);
    const tangent = new THREE.Vector3().subVectors(next, curr).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const w = getWidth(t);
    const halfW = w / 2;

    const leftOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW + bankMargin);
    leftOuter.y = yOuter;
    const leftWater = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW);
    leftWater.y = yWater;
    const centerBed = new THREE.Vector3().copy(curr);
    centerBed.y = yBottom;
    const rightWater = new THREE.Vector3().copy(curr).addScaledVector(normal, -halfW);
    rightWater.y = yWater;
    const rightOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, -(halfW + bankMargin));
    rightOuter.y = yOuter;

    const baseBedIdx = (bedPositions.length / 3);
    [leftOuter, leftWater, centerBed, rightWater, rightOuter].forEach(pt => {
      bedPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevBedIdx = baseBedIdx - 5;
      for (let q = 0; q < 4; q++) {
        bedIndices.push(prevBedIdx + q, baseBedIdx + q, prevBedIdx + q + 1);
        bedIndices.push(prevBedIdx + q + 1, baseBedIdx + q, baseBedIdx + q + 1);
      }
    }

    const baseWaterIdx = (waterPositions.length / 3);
    [leftWater, new THREE.Vector3(curr.x, yWater, curr.z), rightWater].forEach(pt => {
      waterPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevWaterIdx = baseWaterIdx - 3;
      waterIndices.push(prevWaterIdx, baseWaterIdx, prevWaterIdx + 1);
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx, baseWaterIdx + 1);
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx + 1, prevWaterIdx + 2);
      waterIndices.push(prevWaterIdx + 2, baseWaterIdx + 1, baseWaterIdx + 2);
    }

    // Shoreline boulders and pebbles
    if (i % 2 === 0) {
      const rL = createRock(0.25 + Math.sin(i * 1.5) * 0.14, (i % 3 === 0) ? mossStoneMat : stoneMat, i + 10);
      const posL = new THREE.Vector3().copy(leftWater).addScaledVector(normal, 0.2);
      posL.y = yOuter * 0.8;
      rL.position.copy(posL);
      group.add(rL);

      const rR = createRock(0.28 + Math.cos(i * 1.9) * 0.13, (i % 2 === 0) ? mossStoneMat : stoneMat, i + 70);
      const posR = new THREE.Vector3().copy(rightWater).addScaledVector(normal, -0.2);
      posR.y = yOuter * 0.8;
      rR.position.copy(posR);
      group.add(rR);
    }
  }

  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMesh = new THREE.Mesh(bedGeo, riverbedMat);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  return group;
}

// ========================================================
// 3. ORGANIC 90° MEANDER BEND (Khúc Cua Suối Uốn 90° Tự Nhiên)
// ========================================================
function buildOrganicMeanderBend() {
  const group = new THREE.Group();
  group.name = 'Stream_Organic_Meander_Bend_90';

  const numSteps = 50;
  const radius = 5.2;
  const width = 2.6;

  const bedPositions = [];
  const bedIndices = [];
  const waterPositions = [];
  const waterIndices = [];

  const yOuter = 0.36;
  const yWater = 0.27;
  const yBottom = 0.04;
  const bankMargin = 0.8;

  for (let i = 0; i <= numSteps; i++) {
    const angle = (i / numSteps) * (Math.PI / 2);
    // Add organic undulating radial wobble
    const r = radius + Math.sin(angle * 4) * 0.45;
    const curr = new THREE.Vector3(Math.cos(angle) * r - radius, 0, Math.sin(angle) * r - radius);

    // Tangent along arc
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const halfW = (width + Math.sin(angle * 6) * 0.3) / 2;

    const leftOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW + bankMargin);
    leftOuter.y = yOuter;
    const leftWater = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW);
    leftWater.y = yWater;
    const centerBed = new THREE.Vector3().copy(curr);
    centerBed.y = yBottom;
    const rightWater = new THREE.Vector3().copy(curr).addScaledVector(normal, -halfW);
    rightWater.y = yWater;
    const rightOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, -(halfW + bankMargin));
    rightOuter.y = yOuter;

    const baseBedIdx = (bedPositions.length / 3);
    [leftOuter, leftWater, centerBed, rightWater, rightOuter].forEach(pt => {
      bedPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevBedIdx = baseBedIdx - 5;
      for (let q = 0; q < 4; q++) {
        bedIndices.push(prevBedIdx + q, baseBedIdx + q, prevBedIdx + q + 1);
        bedIndices.push(prevBedIdx + q + 1, baseBedIdx + q, baseBedIdx + q + 1);
      }
    }

    const baseWaterIdx = (waterPositions.length / 3);
    [leftWater, new THREE.Vector3(curr.x, yWater, curr.z), rightWater].forEach(pt => {
      waterPositions.push(pt.x, pt.y, pt.z);
    });

    if (i > 0) {
      const prevWaterIdx = baseWaterIdx - 3;
      waterIndices.push(prevWaterIdx, baseWaterIdx, prevWaterIdx + 1);
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx, baseWaterIdx + 1);
      waterIndices.push(prevWaterIdx + 1, baseWaterIdx + 1, prevWaterIdx + 2);
      waterIndices.push(prevWaterIdx + 2, baseWaterIdx + 1, baseWaterIdx + 2);
    }

    // Rocks along both curved bends
    if (i % 2 === 0) {
      const rL = createRock(0.26 + Math.sin(i) * 0.12, mossStoneMat, i + 33);
      rL.position.copy(leftWater).addScaledVector(normal, 0.18);
      rL.position.y = yOuter * 0.8;
      group.add(rL);

      const rR = createRock(0.24 + Math.cos(i) * 0.1, stoneMat, i + 88);
      rR.position.copy(rightWater).addScaledVector(normal, -0.18);
      rR.position.y = yOuter * 0.8;
      group.add(rR);
    }
  }

  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMesh = new THREE.Mesh(bedGeo, riverbedMat);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  return group;
}

// ========================================================
// 4. FORK JUNCTION (Suối Ngã Ba Tách Dòng Chữ Y Uốn Lượn)
// ========================================================
function buildForkJunction() {
  const group = new THREE.Group();
  group.name = 'Stream_Fork_Junction_Y';

  const trunkSteps = 25;
  const branchSteps = 25;
  const width = 2.4;

  const bedPositions = [];
  const bedIndices = [];
  const waterPositions = [];
  const waterIndices = [];

  const yOuter = 0.36;
  const yWater = 0.27;
  const yBottom = 0.04;
  const bankMargin = 0.75;

  function addRibbon(getPath, getW, numSegments) {
    const startBedIdx = (bedPositions.length / 3);
    const startWaterIdx = (waterPositions.length / 3);

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const curr = getPath(t);
      const next = getPath(Math.min(1.0, t + 0.01));
      const tangent = new THREE.Vector3().subVectors(next, curr).normalize();
      if (tangent.lengthSq() < 0.001) tangent.set(0, 0, 1);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const halfW = getW(t) / 2;

      const leftOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW + bankMargin);
      leftOuter.y = yOuter;
      const leftWater = new THREE.Vector3().copy(curr).addScaledVector(normal, halfW);
      leftWater.y = yWater;
      const centerBed = new THREE.Vector3().copy(curr);
      centerBed.y = yBottom;
      const rightWater = new THREE.Vector3().copy(curr).addScaledVector(normal, -halfW);
      rightWater.y = yWater;
      const rightOuter = new THREE.Vector3().copy(curr).addScaledVector(normal, -(halfW + bankMargin));
      rightOuter.y = yOuter;

      const currentRingBed = (bedPositions.length / 3);
      [leftOuter, leftWater, centerBed, rightWater, rightOuter].forEach(pt => {
        bedPositions.push(pt.x, pt.y, pt.z);
      });

      if (i > 0) {
        const prevRingBed = currentRingBed - 5;
        for (let q = 0; q < 4; q++) {
          bedIndices.push(prevRingBed + q, currentRingBed + q, prevRingBed + q + 1);
          bedIndices.push(prevRingBed + q + 1, currentRingBed + q, currentRingBed + q + 1);
        }
      }

      const currentRingWater = (waterPositions.length / 3);
      [leftWater, new THREE.Vector3(curr.x, yWater, curr.z), rightWater].forEach(pt => {
        waterPositions.push(pt.x, pt.y, pt.z);
      });

      if (i > 0) {
        const prevRingWater = currentRingWater - 3;
        waterIndices.push(prevRingWater, currentRingWater, prevRingWater + 1);
        waterIndices.push(prevRingWater + 1, currentRingWater, currentRingWater + 1);
        waterIndices.push(prevRingWater + 1, currentRingWater + 1, prevRingWater + 2);
        waterIndices.push(prevRingWater + 2, currentRingWater + 1, currentRingWater + 2);
      }

      if (i % 2 === 0) {
        const rL = createRock(0.24, stoneMat, i + 12);
        rL.position.copy(leftWater).addScaledVector(normal, 0.15);
        rL.position.y = yOuter * 0.8;
        group.add(rL);

        const rR = createRock(0.24, mossStoneMat, i + 44);
        rR.position.copy(rightWater).addScaledVector(normal, -0.15);
        rR.position.y = yOuter * 0.8;
        group.add(rR);
      }
    }
  }

  // Trunk
  addRibbon(
    (t) => new THREE.Vector3(Math.sin(t * Math.PI) * 0.4, 0, -5.0 + t * 5.0),
    (t) => 2.4 + t * 0.8,
    trunkSteps
  );

  // Left Branch (curves left)
  addRibbon(
    (t) => new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * -3.2, 0, t * 5.5),
    (t) => 2.2 - t * 0.3,
    branchSteps
  );

  // Right Branch (curves right)
  addRibbon(
    (t) => new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * 3.2, 0, t * 5.5),
    (t) => 2.2 - t * 0.3,
    branchSteps
  );

  // Center island divider rock cluster
  for (let c = 0; c < 5; c++) {
    const angle = (c / 5) * Math.PI * 2;
    const rockC = createRock(0.35 + (c % 2) * 0.1, mossStoneMat, c + 99);
    rockC.position.set(Math.cos(angle) * 0.4, yOuter * 0.85, 1.2 + Math.sin(angle) * 0.4);
    group.add(rockC);
  }

  const bedGeo = new THREE.BufferGeometry();
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
  bedGeo.setIndex(bedIndices);
  bedGeo.computeVertexNormals();
  const bedMesh = new THREE.Mesh(bedGeo, riverbedMat);
  bedMesh.receiveShadow = true;
  group.add(bedMesh);

  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  return group;
}

// Export single group to GLB binary
async function exportToGLB(group, filename) {
  // Compute bounding box and normalize so it is grounded at Y=0 and centered on X/Z
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const minY = box.min.y;

  const wrapper = new THREE.Group();
  wrapper.name = group.name;
  group.position.set(-center.x, -minY, -center.z);
  wrapper.add(group);

  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      wrapper,
      (gltf) => {
        const buffer = Buffer.from(gltf);
        const p1 = path.join(outputDir, filename);
        const p2 = path.join(publicOutputDir, filename);
        fs.writeFileSync(p1, buffer);
        fs.writeFileSync(p2, buffer);
        console.log(`Exported ${filename}: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
        resolve({
          filename,
          sizeBytes: buffer.length,
          sizeKb: (buffer.length / 1024).toFixed(1) + ' KB',
        });
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

async function main() {
  console.log('--- GENERATING HIGHLY SINUOUS & MEANDERING 3D STREAMS ---');

  // 1. Meandering S-Curve Stream
  console.log('Generating Stream_Meandering_S_Curve...');
  const sCurve = buildMeanderingSCurve();
  await exportToGLB(sCurve, 'stream_straight_01.glb'); // replace straight with S-Curve so default stream is beautifully sinuous!
  await exportToGLB(sCurve, 'stream_meandering_s_01.glb');

  // 2. Winding River Double Wave
  console.log('Generating Stream_Winding_River_Double_Wave...');
  const winding = buildWindingRiver();
  await exportToGLB(winding, 'stream_curve_01.glb'); // also update curve with organic winding river
  await exportToGLB(winding, 'stream_winding_river_01.glb');

  // 3. Organic 90deg Meander Bend
  console.log('Generating Stream_Organic_Meander_Bend_90...');
  const bend90 = buildOrganicMeanderBend();
  await exportToGLB(bend90, 'stream_bend_90_01.glb');

  // 4. Fork Junction Y
  console.log('Generating Stream_Fork_Junction_Y...');
  const fork = buildForkJunction();
  await exportToGLB(fork, 'stream_fork_junction_01.glb');

  console.log('=== STREAM GENERATION COMPLETE ===');
}

main().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
