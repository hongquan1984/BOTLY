import * as THREE from 'three';

export function createFireplaceFlames(): {
  group: THREE.Group;
  uniforms: { uTime: { value: number }; uIntensity: { value: number } };
} {
  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1.0 },
  };

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.05;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float xDist = abs(uv.x - 0.5) * 2.0;

      // Tapered flame silhouette with animated upward turbulence
      vec2 flowUv = vec2(uv.x * 3.4, uv.y * 2.6 - uTime * 2.8);
      float n = fbm(flowUv);
      float sway = (fbm(vec2(uv.y * 2.0 - uTime * 2.0, uTime * 0.7)) - 0.5) * 0.25 * uv.y;
      float dx = abs(uv.x - 0.5 + sway) * 2.0;

      float shape = (1.0 - uv.y * 0.92) * 0.85 - dx * (0.72 + uv.y * 0.55) + (n - 0.35) * 0.55;
      float alpha = smoothstep(0.06, 0.42, shape) * smoothstep(1.0, 0.72, uv.y) * smoothstep(0.0, 0.08, uv.y);

      vec3 innerCore = vec3(1.0, 0.96, 0.65);
      vec3 midFlame = vec3(1.0, 0.52, 0.08);
      vec3 outerTip = vec3(0.85, 0.16, 0.02);

      float coreMask = smoothstep(0.32, 0.72, shape) * (1.0 - uv.y * 0.65);
      vec3 col = mix(outerTip, midFlame, smoothstep(0.1, 0.45, shape));
      col = mix(col, innerCore, coreMask);

      // Glowing ember bed near bottom
      float embers = smoothstep(0.28, 0.0, uv.y) * (1.0 - xDist * 0.6) * (0.65 + 0.35 * sin(uTime * 5.0 + uv.x * 12.0));
      col += vec3(1.0, 0.35, 0.05) * embers;

      float finalAlpha = clamp(max(alpha, embers * 0.85) * uIntensity, 0.0, 1.0);
      if (finalAlpha < 0.02) discard;

      gl_FragColor = vec4(col * (1.35 * uIntensity), finalAlpha);
    }
  `;

  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  // Crossed flame planes for rich 3D volume from all viewing angles
  const plane1 = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.68), mat);
  plane1.position.set(0, 0.34, 0);
  const plane2 = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.62), mat);
  plane2.position.set(0, 0.31, 0);
  plane2.rotation.y = Math.PI * 0.42;
  const plane3 = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.58), mat);
  plane3.position.set(0, 0.29, 0);
  plane3.rotation.y = -Math.PI * 0.35;

  group.add(plane1, plane2, plane3);

  // Charred firewood logs inside firebox
  const logMat = new THREE.MeshStandardMaterial({ color: '#3b2416', roughness: 0.92 });
  const emberMat = new THREE.MeshStandardMaterial({
    color: '#2a1208',
    emissive: '#ff4800',
    emissiveIntensity: 1.4,
    roughness: 0.85,
  });
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.62, 8), i === 1 ? emberMat : logMat);
    log.rotation.z = Math.PI / 2 + (i - 1) * 0.14;
    log.rotation.y = (i - 1) * 0.35;
    log.position.set((i - 1) * 0.06, 0.08 + (i === 1 ? 0.04 : 0), (i - 1) * 0.07);
    group.add(log);
  }

  return { group, uniforms };
}
