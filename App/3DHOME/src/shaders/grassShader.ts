import * as THREE from 'three';

export interface GrassFieldConfig {
  count: number;
  getGroundHeight: (x: number, z: number) => number;
  isForbidden: (x: number, z: number) => boolean;
}

function clumpNoise(x: number, z: number): number {
  const n1 = Math.sin(x * 0.42 + Math.cos(z * 0.37) * 1.6) * 0.5 + 0.5;
  const n2 = Math.cos(z * 0.68 - Math.sin(x * 0.53) * 1.4) * 0.5 + 0.5;
  return n1 * 0.58 + n2 * 0.42;
}

export function createInstancedGrass(config: GrassFieldConfig): {
  mesh: THREE.InstancedMesh;
  uniforms: { uTime: { value: number } };
  rebuild: (targetCount: number) => void;
} {
  const uniforms = {
    uTime: { value: 0 },
  };

  // Natural 3-blade crossed curved turf cluster (subtle multi-angle blades, zero bright spikes)
  const makeBlade = (rotY: number, offX: number, offZ: number, hScale: number) => {
    const g = new THREE.PlaneGeometry(0.036, 0.14 * hScale, 1, 2);
    g.translate(0, 0.07 * hScale, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = y / (0.14 * hScale);
      p.setX(i, p.getX(i) * (1.0 - t * 0.85));
      p.setZ(i, t * t * 0.032);
    }
    g.rotateY(rotY);
    g.translate(offX, 0, offZ);
    g.computeVertexNormals();
    return g;
  };
  const b1 = makeBlade(0, 0, 0, 1.0);
  const b2 = makeBlade(2.1, 0.025, 0.015, 0.85);
  const b3 = makeBlade(-2.0, -0.025, 0.018, 0.92);
  // Merge into one compact 3-blade tuft geometry
  const parts = [b1, b2, b3];
  const totalVerts = parts.reduce((acc, g) => acc + g.attributes.position.count, 0);
  const posArr = new Float32Array(totalVerts * 3);
  const normArr = new Float32Array(totalVerts * 3);
  const uvArr = new Float32Array(totalVerts * 2);
  const idxArr: number[] = [];
  let vOff = 0;
  for (const g of parts) {
    posArr.set(g.attributes.position.array as Float32Array, vOff * 3);
    normArr.set(g.attributes.normal.array as Float32Array, vOff * 3);
    uvArr.set(g.attributes.uv.array as Float32Array, vOff * 2);
    const gi = g.index!;
    for (let k = 0; k < gi.count; k++) idxArr.push(gi.getX(k) + vOff);
    vOff += g.attributes.position.count;
    g.dispose();
  }
  const bladeGeo = new THREE.BufferGeometry();
  bladeGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  bladeGeo.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
  bladeGeo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  bladeGeo.setIndex(idxArr);

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5a8634'),
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        varying float vBladeT;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vBladeT = clamp(position.y / 0.14, 0.0, 1.0);
        vec4 instWorld = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float breeze = sin(uTime * 1.75 + instWorld.x * 0.45 + instWorld.z * 0.35)
                     + 0.45 * cos(uTime * 2.9 + instWorld.x * 0.9 - instWorld.z * 0.7);
        transformed.x += breeze * 0.036 * vBladeT * vBladeT;
        transformed.z += breeze * 0.018 * vBladeT * vBladeT;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vBladeT;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 rootCol = vec3(0.14, 0.24, 0.08);
        vec3 tipCol = vec3(0.42, 0.58, 0.22);
        diffuseColor.rgb *= mix(rootCol, tipCol, smoothstep(0.0, 1.0, vBladeT)) * 1.48;`
      );
  };

  const maxCount = config.count;
  const mesh = new THREE.InstancedMesh(bladeGeo, mat, maxCount);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const positions: Array<{ x: number; y: number; z: number; ry: number; s: number; c: number }> = [];
  let attempts = 0;
  while (positions.length < maxCount && attempts < maxCount * 7) {
    attempts++;
    const x = -22 + rand() * 35;
    const z = -12 + rand() * 34;
    if (config.isForbidden(x, z)) continue;

    // Natural clumped distribution: sparser in open lawn center, richer near borders/stones/trees
    const clump = clumpNoise(x, z);
    const borderFactor = Math.min(1, Math.hypot(x + 1, z - 8) / 14);
    const densityGate = clump * 0.65 + borderFactor * 0.35;
    if (rand() > densityGate * 0.85 + 0.12) continue;

    const y = config.getGroundHeight(x, z);
    if (y < -0.05) continue;
    positions.push({
      x,
      y,
      z,
      ry: rand() * Math.PI * 2,
      s: 0.62 + clump * 0.55 + rand() * 0.32,
      c: rand(),
    });
  }

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    dummy.position.set(p.x, p.y - 0.01, p.z);
    dummy.rotation.set((rand() - 0.5) * 0.22, p.ry, (rand() - 0.5) * 0.22);
    dummy.scale.set(0.8 + p.s * 0.3, p.s, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    color.setHSL(0.24 + (p.c - 0.5) * 0.045, 0.50 + p.c * 0.16, 0.40 + p.c * 0.12);
    mesh.setColorAt(i, color);
  }
  mesh.count = positions.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  const rebuild = (targetCount: number) => {
    mesh.count = Math.min(positions.length, targetCount);
  };

  return { mesh, uniforms, rebuild };
}

export function createAlpineWildflowers(
  maxFlowers: number,
  getGroundHeight: (x: number, z: number) => number,
  isForbidden: (x: number, z: number) => boolean
): {
  group: THREE.Group;
  rebuild: (targetCount: number) => void;
} {
  const group = new THREE.Group();

  // Simple 5-petal blossom + stem merged look using two instanced meshes (stems + flower heads)
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.22, 4);
  stemGeo.translate(0, 0.11, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: '#457a24', roughness: 0.8 });

  const bloomGeo = new THREE.DodecahedronGeometry(0.042, 0);
  bloomGeo.scale(1.15, 0.45, 1.15);
  bloomGeo.translate(0, 0.22, 0);
  const bloomMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });

  const stems = new THREE.InstancedMesh(stemGeo, stemMat, maxFlowers);
  const blooms = new THREE.InstancedMesh(bloomGeo, bloomMat, maxFlowers);
  stems.receiveShadow = true;

  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Cluster seeds near lakeside fence, boulders, and garden edges
  const clusters: Array<[number, number, number]> = [
    [-11.5, 14.5, 2.8],
    [-9.5, 17.6, 3.2],
    [-4.0, 18.4, 2.8],
    [2.5, 17.9, 3.0],
    [7.5, 14.5, 2.8],
    [8.5, 7.2, 2.4],
    [-8.8, 3.0, 2.5],
  ];

  const palette = [
    new THREE.Color('#fffdf2'), // Alpine daisy white
    new THREE.Color('#ffd84d'), // Mountain buttercup gold
    new THREE.Color('#8e9df5'), // Alpine bluebell
    new THREE.Color('#f7b5d0'), // Clover pink
  ];

  const dummy = new THREE.Object3D();
  let placed = 0;
  let tries = 0;

  while (placed < maxFlowers && tries < maxFlowers * 6) {
    tries++;
    const [cx, cz, rad] = clusters[Math.floor(rand() * clusters.length)];
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * rad;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    if (isForbidden(x, z)) continue;
    const y = getGroundHeight(x, z);
    if (y < 0.0) continue;

    dummy.position.set(x, y, z);
    dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
    const s = 0.75 + rand() * 0.65;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(placed, dummy.matrix);
    blooms.setMatrixAt(placed, dummy.matrix);
    blooms.setColorAt(placed, palette[Math.floor(rand() * palette.length)]);
    placed++;
  }

  stems.count = placed;
  blooms.count = placed;
  stems.instanceMatrix.needsUpdate = true;
  blooms.instanceMatrix.needsUpdate = true;
  if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;

  group.add(stems, blooms);

  const rebuild = (targetCount: number) => {
    const c = Math.min(placed, targetCount);
    stems.count = c;
    blooms.count = c;
  };

  return { group, rebuild };
}
