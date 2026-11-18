import * as THREE from 'three';

export function createAlpineSkyDome(sunDirection: THREE.Vector3): {
  mesh: THREE.Mesh;
  uniforms: {
    uTime: { value: number };
    uSunDir: { value: THREE.Vector3 };
  };
} {
  const uniforms = {
    uTime: { value: 0 },
    uSunDir: { value: sunDirection.clone().normalize() },
  };

  const vertexShader = /* glsl */ `
    varying vec3 vWorldDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldDir = normalize(worldPos.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uSunDir;
    varying vec3 vWorldDir;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        v += amp * noise(p);
        p = p * 2.05 + vec2(17.1, 31.7);
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 dir = normalize(vWorldDir);
      float h = clamp(dir.y, 0.0, 1.0);

      // Crisp Alpine azure sky gradient matching ultra-sharp exterior backdrop
      vec3 zenithCol = vec3(0.08, 0.24, 0.52);
      vec3 midSkyCol = vec3(0.24, 0.48, 0.76);
      vec3 horizonCol = vec3(0.68, 0.80, 0.91);

      vec3 sky = mix(horizonCol, midSkyCol, smoothstep(0.0, 0.28, h));
      sky = mix(sky, zenithCol, smoothstep(0.22, 0.85, h));

      // Warm golden-hour atmospheric glow around the sunset sun
      float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
      vec3 warmScatter = vec3(1.0, 0.64, 0.38);
      sky += warmScatter * pow(sunDot, 4.5) * 0.42;
      sky += vec3(1.0, 0.86, 0.64) * pow(sunDot, 32.0) * 0.55;
      // Crisp bright sun core
      float sunDisc = smoothstep(0.9985, 0.9996, sunDot);
      sky = mix(sky, vec3(1.0, 0.98, 0.9), sunDisc);

      // Soft Alpine cumulus clouds above horizon
      if (dir.y > 0.03) {
        vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.15 + vec2(uTime * 0.0045, uTime * 0.0018);
        float c1 = fbm(cloudUv * 1.4);
        float c2 = fbm(cloudUv * 2.9 + vec2(4.2, 8.7));
        float cloudDensity = smoothstep(0.51, 0.78, c1 * 0.72 + c2 * 0.32);
        cloudDensity *= smoothstep(0.03, 0.18, dir.y) * smoothstep(0.85, 0.35, dir.y);

        vec3 cloudLit = mix(vec3(0.95, 0.97, 1.0), vec3(1.0, 0.92, 0.78), pow(sunDot, 3.0) * 0.65);
        vec3 cloudShadow = vec3(0.75, 0.83, 0.93);
        vec3 cloudCol = mix(cloudShadow, cloudLit, smoothstep(0.35, 0.75, c2));
        sky = mix(sky, cloudCol, cloudDensity * 0.82);
      }

      gl_FragColor = vec4(sky, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  const geo = new THREE.SphereGeometry(480, 40, 24);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}
