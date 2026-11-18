import * as THREE from 'three';

export interface FloatingIslandResult {
  group: THREE.Group;
  undersideMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  walkableRaycastPlane: THREE.Mesh;
  update: (time: number) => void;
}

export function createFloatingIsland(): FloatingIslandResult {
  const group = new THREE.Group();
  group.name = 'FloatingIslandBase';

  // Base dimensions matching BlackSpire terrain bounds
  const islandRadiusX = 16.6;
  const islandRadiusZ = 17.4;
  const radialSegments = 72;
  const heightSegments = 28;

  // 1. Organic Layered Rocky Keel (from Y: 0 down to Y: -16m)
  const islandGeo = new THREE.CylinderGeometry(
    islandRadiusX,
    0.6,
    16.0,
    radialSegments,
    heightSegments,
    true
  );

  const posAttr = islandGeo.attributes.position;
  const colors: number[] = [];
  const v = new THREE.Vector3();

  // Color palette for geologic rock strata
  const colSoil = new THREE.Color('#38281d');    // Top dark loam / earthy shelf
  const colGranite = new THREE.Color('#4c4139'); // Mid rocky cliff
  const colBasalt = new THREE.Color('#2e2722');  // Deep mountain keel

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);

    const angle = Math.atan2(v.z, v.x);
    const normalizedY = (v.y + 8.0) / 16.0; // 0 at bottom, 1 at top

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Smooth squircle interpolation: rounded rectangular top matching BlackSpire diorama base (16.5m x 17.3m)
    const p = 1.0 - 0.28 * normalizedY;
    const squircleX = Math.sign(cosA) * Math.pow(Math.abs(cosA), p);
    const squircleZ = Math.sign(sinA) * Math.pow(Math.abs(sinA), p);

    // Natural multi-octave geologic rock formations & strata ledges
    const wobble = 1.0 + 
      0.05 * Math.sin(angle * 4 + 1.2) + 
      0.03 * Math.cos(angle * 7 - 0.5);

    // Sedimentary horizontal rock shelves
    const strataLedge = 1.0 + Math.sin(normalizedY * Math.PI * 12) * 0.035;

    // Tapering into a majestic mountain peak
    const taper = Math.pow(normalizedY, 0.46);
    const rockNoise = 1.0 + (1.0 - normalizedY) * 0.09 * Math.sin(v.y * 2.4 + angle * 5);

    v.x = squircleX * islandRadiusX * wobble * strataLedge * taper * rockNoise;
    v.z = squircleZ * islandRadiusZ * wobble * strataLedge * taper * rockNoise;

    // Slight asymmetric mountain keel tilt
    if (normalizedY < 0.25) {
      v.x += (0.25 - normalizedY) * 2.8;
      v.z -= (0.25 - normalizedY) * 1.6;
    }

    posAttr.setXYZ(i, v.x, v.y, v.z);

    // Vertex color gradient by elevation
    const c = new THREE.Color();
    if (normalizedY > 0.75) {
      c.copy(colSoil).lerp(colGranite, (1.0 - normalizedY) * 4.0);
    } else if (normalizedY > 0.25) {
      c.copy(colGranite).lerp(colBasalt, (0.75 - normalizedY) * 2.0);
    } else {
      c.copy(colBasalt);
    }
    // Subtle facet noise
    const noise = (Math.sin(angle * 8 + normalizedY * 10) * 0.04);
    c.r = Math.max(0, Math.min(1, c.r + noise));
    c.g = Math.max(0, Math.min(1, c.g + noise));
    c.b = Math.max(0, Math.min(1, c.b + noise));

    colors.push(c.r, c.g, c.b);
  }

  islandGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  islandGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true,
  });

  const undersideMesh = new THREE.Mesh(islandGeo, rockMat);
  undersideMesh.position.y = -8.0;
  undersideMesh.receiveShadow = true;
  undersideMesh.castShadow = true;
  group.add(undersideMesh);

  // 2. Translucent Mountain Valley Lake Water Mesh on the Western Cliff Overlook
  const waterGeo = new THREE.CircleGeometry(3.6, 32);
  waterGeo.rotateX(-Math.PI / 2);

  const waterMat = new THREE.MeshStandardMaterial({
    color: '#0ea5e9', // Vibrant turquoise alpine pool
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.85,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(-13.5, 1.45, -4.5);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // 3. Decorative floating cloud puffs swirling around the island base
  const mistGroup = new THREE.Group();
  mistGroup.position.y = -10.5;
  const mistPuffGeo = new THREE.DodecahedronGeometry(1.4, 1);
  const mistPuffMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.95,
    metalness: 0.02,
    transparent: true,
    opacity: 0.75,
    flatShading: true,
  });

  const mistPuffs: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; baseY: number }[] = [];
  for (let m = 0; m < 8; m++) {
    const puff = new THREE.Mesh(mistPuffGeo, mistPuffMat);
    const angle = (m / 8) * Math.PI * 2;
    const radius = 10.5 + (m % 3) * 2.5;
    const baseY = (m % 3) * 1.2 - 2.0;
    puff.scale.set(1.4 + (m % 2) * 0.6, 0.7, 1.2 + (m % 3) * 0.4);
    puff.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
    mistGroup.add(puff);
    mistPuffs.push({ mesh: puff, angle, radius, speed: 0.02 + (m % 3) * 0.01, baseY });
  }
  group.add(mistGroup);

  // 4. Invisible Walkable Raycast Plane for Click-to-Move at road level Y: 1.8
  const raycastGeo = new THREE.CircleGeometry(17.5, 32);
  raycastGeo.rotateX(-Math.PI / 2);
  const raycastMat = new THREE.MeshBasicMaterial({
    visible: false,
  });
  const walkableRaycastPlane = new THREE.Mesh(raycastGeo, raycastMat);
  walkableRaycastPlane.position.y = 1.8;
  group.add(walkableRaycastPlane);

  return {
    group,
    undersideMesh,
    waterMesh,
    walkableRaycastPlane,
    update: (time: number) => {
      waterMesh.position.y = 1.45 + Math.sin(time * 2.2) * 0.015;

      // Slowly swirl base mist puffs
      for (const p of mistPuffs) {
        p.angle += p.speed * 0.01;
        p.mesh.position.x = Math.cos(p.angle) * p.radius;
        p.mesh.position.z = Math.sin(p.angle) * p.radius;
        p.mesh.position.y = p.baseY + Math.sin(time * 1.5 + p.angle) * 0.25;
      }
    },
  };
}
