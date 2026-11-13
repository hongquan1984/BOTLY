import * as THREE from 'three';

/**
 * Generates a lightweight PMREM environment map matching the Swiss Alpine sky,
 * golden-hour sun, distant peaks, and emerald ground bounce.
 * Baked once at startup so mobile GPUs get rich PBR & glass reflections at zero per-frame cost.
 */
export function createAlpineEnvironmentMap(
  renderer: THREE.WebGLRenderer,
  sunDirection: THREE.Vector3
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();

  const skyGeo = new THREE.SphereGeometry(50, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uSunDir: { value: sunDirection.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col;
        if (h >= 0.0) {
          vec3 horizon = vec3(0.76, 0.88, 0.98);
          vec3 mid = vec3(0.26, 0.56, 0.90);
          vec3 zenith = vec3(0.08, 0.30, 0.72);
          col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
          col = mix(col, zenith, smoothstep(0.24, 0.85, h));
          // Subtle snow-peak horizon band
          float ridge = smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.06, 0.16, h));
          col = mix(col, vec3(0.84, 0.88, 0.94), ridge * 0.45);
        } else {
          // Ground / lake bounce below horizon
          vec3 lakeRefl = vec3(0.08, 0.31, 0.44);
          vec3 lawnBounce = vec3(0.24, 0.38, 0.16);
          col = mix(lakeRefl, lawnBounce, smoothstep(-0.05, -0.55, h));
        }

        float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
        col += vec3(1.0, 0.84, 0.55) * pow(sunDot, 12.0) * 0.55;
        col += vec3(1.0, 0.96, 0.85) * pow(sunDot, 120.0) * 1.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  const rt = pmrem.fromScene(envScene, 0.035);
  skyGeo.dispose();
  skyMat.dispose();
  pmrem.dispose();

  return rt.texture;
}
