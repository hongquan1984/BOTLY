import * as THREE from 'three';

const geo = new THREE.CylinderGeometry(210, 210, 205, 8, 1, true, -0.85, 1.70);
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i += 2) {
  console.log('vertex', i, 'x:', pos.getX(i).toFixed(1), 'z:', pos.getZ(i).toFixed(1));
}
