import * as THREE from 'three';

export function createAlpineWater(sunDirection: THREE.Vector3, waterLevel = -0.35): {
  mesh: THREE.Mesh;
  uniforms: {
    uTime: { value: number };
    uSunDir: { value: THREE.Vector3 };
    uFogColor: { value: THREE.Color };
    uFogDensity: { value: number };
    uHighQuality: { value: number };
  };
} {
  const uniforms = {
    uTime: { value: 0 },
    uSunDir: { value: sunDirection.clone().normalize() },
    uFogColor: { value: new THREE.Color('#b6d8f2') },
    uFogDensity: { value: 0.0021 },
    uHighQuality: { value: 1.0 },
  };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    varying vec3 vWorldPos;

    void main() {
      vec3 pos = position;
      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      float w1 = sin(worldPos.x * 0.28 + uTime * 0.95) * cos(worldPos.z * 0.24 + uTime * 0.78);
      float w2 = sin((worldPos.x * 0.52 - worldPos.z * 0.38) + uTime * 1.45);
      worldPos.y += w1 * 0.014 + w2 * 0.008;
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uSunDir;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform float uHighQuality;

    varying vec3 vWorldPos;

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

    float waveHeight(vec2 p, float t) {
      float h = noise(p * 0.52 + vec2(t * 0.18, t * 0.12)) * 0.62
              + noise(p * 1.35 - vec2(t * 0.25, -t * 0.20)) * 0.34;
      if (uHighQuality > 0.5) {
        h += noise(p * 3.4 + vec2(t * 0.42, t * 0.35)) * 0.14;
      }
      return h;
    }

    vec3 computeNormal(vec2 p, float t) {
      float e = 0.14;
      float h0 = waveHeight(p, t);
      float hx = waveHeight(p + vec2(e, 0.0), t);
      float hz = waveHeight(p + vec2(0.0, e), t);
      return normalize(vec3((h0 - hx) * 0.38, 1.0, (h0 - hz) * 0.38));
    }

    // Approximate peninsula shore distance for shallow-to-deep color gradient
    float shoreFactor(vec2 xz) {
      float frontShoreZ = 20.5 + sin(xz.x * 0.12) * 1.8 + cos(xz.x * 0.25) * 0.7;
      float tEast = clamp((6.0 - xz.y) / 4.5, 0.0, 1.0);
      tEast = tEast * tEast * (3.0 - 2.0 * tEast);
      float rightShoreX = mix(11.2 + sin(xz.y * 0.11) * 1.9, 55.0, tEast);
      float d = max(xz.y - frontShoreZ, xz.x - rightShoreX);
      return d;
    }

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float distCam = length(cameraPosition - vWorldPos);
      vec3 rawNormal = computeNormal(vWorldPos.xz, uTime);
      float rippleSmooth = mix(0.68, 0.15, smoothstep(14.0, 90.0, distCam));
      vec3 normal = normalize(mix(vec3(0.0, 1.0, 0.0), rawNormal, rippleSmooth));
      vec3 reflDir = reflect(-viewDir, normal);
      vec3 sunDir = normalize(uSunDir);

      // Schlick Fresnel reflection
      float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
      float fresnel = mix(0.06, 0.90, pow(1.0 - cosTheta, 3.6));

      // Depth-driven Alpine lake palette (clear jade-turquoise shallows -> deep emerald-sapphire)
      float dShore = shoreFactor(vWorldPos.xz);
      float depthMix = smoothstep(0.5, 22.0, dShore);
      vec3 shallowJade = vec3(0.11, 0.50, 0.53);
      vec3 midTeal = vec3(0.06, 0.35, 0.48);
      vec3 deepAlpine = vec3(0.03, 0.20, 0.38);
      vec3 waterBody = mix(shallowJade, midTeal, smoothstep(0.0, 0.45, depthMix));
      waterBody = mix(waterBody, deepAlpine, smoothstep(0.4, 1.0, depthMix));

      // Procedural environment reflection: zenith sky + Alpine snow/forest mountain reflection
      float reflElev = clamp(reflDir.y, 0.0, 1.0);
      vec3 skyRefl = mix(vec3(0.70, 0.85, 0.96), vec3(0.13, 0.39, 0.76), smoothstep(0.0, 0.48, reflElev));

      // Reflected dark spruce hillside + snow peak silhouette near horizon
      float mNoise = noise(vec2(vWorldPos.x * 0.025 + vWorldPos.z * 0.018, 1.5));
      float forestBand = smoothstep(0.0, 0.035, reflElev) * (1.0 - smoothstep(0.07, 0.16, reflElev));
      float peakBand = smoothstep(0.07, 0.13, reflElev) * (1.0 - smoothstep(0.16, 0.26, reflElev));
      vec3 forestRefl = mix(vec3(0.09, 0.24, 0.19), vec3(0.15, 0.31, 0.24), mNoise);
      vec3 peakRefl = mix(vec3(0.45, 0.52, 0.60), vec3(0.82, 0.88, 0.95), mNoise);
      skyRefl = mix(skyRefl, forestRefl, forestBand * 0.65);
      skyRefl = mix(skyRefl, peakRefl, peakBand * 0.38);

      vec3 col = mix(waterBody, skyRefl, fresnel);

      // Sun specular shimmer & warm golden reflection path
      vec3 halfVec = normalize(sunDir + viewDir);
      float specTight = pow(max(dot(normal, halfVec), 0.0), 260.0);
      float specBroad = pow(max(dot(normal, halfVec), 0.0), 32.0);
      col += vec3(1.0, 0.92, 0.70) * specTight * 1.9;
      col += vec3(1.0, 0.80, 0.45) * specBroad * 0.20;

      // Subtle natural shoreline meniscus/foam where water kisses the bank
      float shoreEdge = 1.0 - smoothstep(-0.3, 1.1, abs(dShore));
      float foamWave = sin(dShore * 9.0 - uTime * 1.8) * 0.5 + 0.5;
      col = mix(col, vec3(0.80, 0.88, 0.90), shoreEdge * foamWave * 0.22);

      // Distance atmospheric haze + seamless horizon kiss into 2.5D forest shore (R=132m)
      float radialDist = length(vWorldPos.xz);
      if (radialDist > 134.0) discard;
      // Natural organic water clipping: lake is in front of the chalet (+Z)
      if (dShore < -0.3) discard;
      if (vWorldPos.z < -11.8) discard;
      if (vWorldPos.z < 2.0 && vWorldPos.x > 6.0) discard;
      float horizonMist = smoothstep(104.0, 133.5, radialDist);
      float fogFactor = 1.0 - exp(-pow(distCam * uFogDensity, 2.0));
      col = mix(col, uFogColor, clamp(fogFactor, 0.0, 0.65));
      col = mix(col, vec3(0.18, 0.49, 0.58), horizonMist * 0.68);

      float edgeAlpha = smoothstep(-0.8, 0.8, dShore) * 0.22 + 0.74;
      edgeAlpha *= 1.0 - smoothstep(129.0, 134.0, radialDist);
      gl_FragColor = vec4(col, clamp(edgeAlpha, 0.0, 0.96));
    }
  `;

  // Focused 3D near-lake surface around playable peninsula (2,048 tris vs 10,368)
  const geo = new THREE.PlaneGeometry(250, 250, 32, 32);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, waterLevel, 0);
  mesh.receiveShadow = false;
  return { mesh, uniforms };
}
