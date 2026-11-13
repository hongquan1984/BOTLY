import * as THREE from 'three';

export interface Backdrop25DResult {
  group: THREE.Group;
  updateParallax: (camPos: THREE.Vector3, time: number) => void;
}

const LAYER_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const LAYER_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTopFeather;
  uniform float uExposure;

  varying vec2 vUv;

  void main() {
    // Pure fixed world-space 360-degree cylinder UVs (no camera rotation/UV sliding, no repeated mountains!)
    // Cylinder starts at theta=PI (-Z) so vUv.x=0.5 faces +Z panoramic lake; flip horizontally for interior view.
    float u = 1.0 - vUv.x;
    vec4 raw = texture2D(uTex, vec2(u, vUv.y));
    // Decode sRGB WebP to linear color for accurate AgX tone mapping
    vec3 col = pow(max(raw.rgb, vec3(0.0001)), vec3(2.2)) * uExposure;

    float alpha = raw.a;
    if (uTopFeather > 0.001) {
      alpha *= smoothstep(1.0, 1.0 - uTopFeather, vUv.y);
    }
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Fixed World-Space 360-degree Layered Alpine Backdrop (Non-Repeating!):
 * Front sector (-60..+60 deg centered at +Z): Crisp Swiss Alps snow peaks & turquoise bay.
 * Side & Rear sectors (-Z backyard & sides): Distinct lower forested alpine foothills & valley (no repeated lake).
 * Locked permanently in world space at R=132m / 175m / 230m for true physical 3D parallax.
 */
export function createAlpineBackdrop25D(_sunDirection: THREE.Vector3): Backdrop25DResult {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();

  const thetaLen = Math.PI * 2.0;
  const thetaStart = Math.PI; // 0.5 -> +Z front, 0/1 -> -Z rear

  const makeLayer = (
    url: string,
    radius: number,
    height: number,
    yBase: number,
    topFeather: number,
    exposure: number,
    renderOrder: number
  ) => {
    const tex = loader.load(url);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uTopFeather: { value: topFeather },
        uExposure: { value: exposure },
      },
      vertexShader: LAYER_VERT,
      fragmentShader: LAYER_FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const geo = new THREE.CylinderGeometry(radius, radius, height, 96, 1, true, thetaStart, thetaLen);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = yBase + height * 0.5;
    mesh.renderOrder = renderOrder;
    group.add(mesh);
  };

  // Waterline in world360_* textures is at vUv.y = 0.28 -> align directly with 3D lake surface y = -0.35m!
  makeLayer('/assets/bg/world360_sky.webp', 230, 250, -70.35, 0.14, 1.0, -8);
  makeLayer('/assets/bg/world360_peaks.webp', 175, 192, -54.11, 0.0, 1.01, -6);
  makeLayer('/assets/bg/world360_shore.webp', 132, 148, -41.79, 0.0, 1.00, -4);

  // Dedicated Fixed World-Space Pine Forest Arc behind Rear Bedroom Window (-Z, R=30m)
  // Looking out the giant bedroom picture window reveals the sun-drenched Alps spruce forest with true 3D depth!
  const forestTex = loader.load('/assets/bg/bedroom_forest_vista.webp');
  forestTex.wrapS = THREE.ClampToEdgeWrapping;
  forestTex.wrapT = THREE.ClampToEdgeWrapping;
  forestTex.minFilter = THREE.LinearMipmapLinearFilter;
  forestTex.magFilter = THREE.LinearFilter;
  forestTex.anisotropy = 8;

  const forestMat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: forestTex },
      uTopFeather: { value: 0.04 },
      uExposure: { value: 1.0 },
    },
    vertexShader: LAYER_VERT,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform float uTopFeather;
      uniform float uExposure;
      varying vec2 vUv;
      void main() {
        vec4 raw = texture2D(uTex, vec2(1.0 - vUv.x, vUv.y));
        vec3 col = pow(max(raw.rgb, vec3(0.0001)), vec3(2.2)) * uExposure;
        float alpha = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        if (uTopFeather > 0.001) alpha *= smoothstep(1.0, 1.0 - uTopFeather, vUv.y);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });

  // Arc spanning -48..+48 deg around theta = PI (-Z, directly behind Bedroom Picture Window!)
  const forestArc = new THREE.Mesh(
    new THREE.CylinderGeometry(30, 30, 26, 48, 1, true, Math.PI - 0.85, 1.70),
    forestMat
  );
  forestArc.position.set(1.5, 6.2, -5.0);
  forestArc.renderOrder = -2;
  group.add(forestArc);

  const updateParallax = (_camPos: THREE.Vector3, _time: number) => {
    // Fixed in world space; true 3D depth parallax emerges naturally from physical cylinder radii.
  };

  return { group, updateParallax };
}
