import * as THREE from 'three';

export interface WaterUniforms {
  uTime: { value: number };
  uFlowSpeed: { value: number };
  uWaveHeight: { value: number };
}

export class WaterAnimationManager {
  private registeredMaterials = new Set<THREE.MeshStandardMaterial>();
  private globalUniforms: WaterUniforms = {
    uTime: { value: 0 },
    uFlowSpeed: { value: 1.0 },
    uWaveHeight: { value: 0.038 },
  };

  /**
   * Upgrades a standard material with realistic flowing, undulating wave displacement
   * and sparkling current ripples in the fragment stage.
   */
  public upgradeToAnimatedWater(
    material: THREE.MeshStandardMaterial,
    flowSpeed = 1.0,
    waveHeight = 0.038
  ): void {
    if (this.registeredMaterials.has(material)) return;

    material.transparent = true;
    material.opacity = Math.max(material.opacity, 0.86);
    material.roughness = 0.05;
    material.metalness = 0.35;
    material.side = THREE.DoubleSide;
    material.depthWrite = false;

    // Use onBeforeCompile to inject GLSL vertex wave displacement and flowing water sparkles
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.globalUniforms.uTime;
      shader.uniforms.uFlowSpeed = { value: flowSpeed };
      shader.uniforms.uWaveHeight = { value: waveHeight };

      // 1. Vertex Shader Injection: Undulating Wave Displacement
      shader.vertexShader = `
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uWaveHeight;
        varying vec3 vWaterWorldPos;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Multi-harmonic traveling waves for realistic stream flow
        float wave1 = sin(position.x * 2.2 + position.z * 1.5 + uTime * 3.2 * uFlowSpeed) * uWaveHeight;
        float wave2 = cos(position.x * 1.6 - position.z * 2.8 + uTime * 2.5 * uFlowSpeed) * (uWaveHeight * 0.7);
        float wave3 = sin((position.x * 3.0 + position.z * 2.0) + uTime * 4.2 * uFlowSpeed) * (uWaveHeight * 0.35);
        transformed.y += wave1 + wave2 + wave3;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `
        #include <project_vertex>
        vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      // 2. Fragment Shader Injection: Water Flow Ripples, Caustics & Shimmering Crests
      shader.fragmentShader = `
        uniform float uTime;
        uniform float uFlowSpeed;
        varying vec3 vWaterWorldPos;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // Animated current flow along stream direction (Z axis)
        vec2 flowUV1 = vWaterWorldPos.xz * 1.6 + vec2(0.1, -1.2) * (uTime * 0.65 * uFlowSpeed);
        vec2 flowUV2 = vWaterWorldPos.xz * 2.5 + vec2(-0.25, -0.85) * (uTime * 0.48 * uFlowSpeed);

        float r1 = sin(flowUV1.x * 5.5 + flowUV1.y * 7.5);
        float r2 = cos(flowUV2.x * 7.5 - flowUV2.y * 5.5);
        float sparkle = pow(clamp(r1 * 0.5 + r2 * 0.5, 0.0, 1.0), 4.5);

        // Subtle crystal turquoise crest highlight for flowing mountain water
        vec3 crestColor = vec3(0.55, 0.92, 1.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, crestColor, sparkle * 0.45);
        `
      );
    };

    material.needsUpdate = true;
    this.registeredMaterials.add(material);
  }

  /**
   * Creates a dedicated animated waterfall material with rushing downward whitewater foam
   * and translucent crystal cyan core.
   */
  public createAnimatedWaterfallMaterial(flowSpeed = 2.4): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      roughness: 0.12,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.globalUniforms.uTime;
      shader.uniforms.uFlowSpeed = { value: flowSpeed };

      shader.vertexShader = `
        uniform float uTime;
        uniform float uFlowSpeed;
        varying vec3 vWaterWorldPos;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // High speed cascading churning flutter
        float flutter = sin(position.y * 3.5 - uTime * 6.5 * uFlowSpeed) * 0.045 * sin(position.x * 4.0);
        transformed.x += flutter;
        transformed.z += sin(position.y * 2.8 - uTime * 5.0 * uFlowSpeed) * 0.025;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `
        #include <project_vertex>
        vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform float uTime;
        uniform float uFlowSpeed;
        varying vec3 vWaterWorldPos;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // Downward plunging foam streak pattern
        float streamY = vWaterWorldPos.y * 3.2 - uTime * 4.8 * uFlowSpeed;
        float streak1 = sin(vWaterWorldPos.x * 12.0 + streamY * 2.5);
        float streak2 = cos(vWaterWorldPos.x * 20.0 - streamY * 3.2);
        float foam = pow(clamp((streak1 * 0.5 + streak2 * 0.5) + 0.45, 0.0, 1.0), 3.0);

        // Core cyan water and white frothing foam highlights
        vec3 deepCyan = vec3(0.12, 0.65, 0.92);
        vec3 whiteFoam = vec3(1.0, 1.0, 1.0);
        vec3 waterColor = mix(deepCyan, whiteFoam, foam * 0.75);

        gl_FragColor.rgb = mix(gl_FragColor.rgb, waterColor, 0.85);
        `
      );
    };

    mat.needsUpdate = true;
    this.registeredMaterials.add(mat);
    return mat;
  }

  /**
   * Scans an object (or group/model) and upgrades any water mesh to animated flowing water.
   */
  public animateWaterMeshes(root: THREE.Object3D): void {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        const mat = child.material as THREE.MeshStandardMaterial;
        const matName = mat?.name?.toLowerCase() || '';

        const isWaterName =
          name.includes('water') ||
          name.includes('stream') ||
          name.includes('suoi') ||
          name.includes('pond') ||
          name.includes('river') ||
          name.includes('lake') ||
          name.includes('song') ||
          name.includes('ho') ||
          matName.includes('water') ||
          matName.includes('stream');

        // Also detect cyan/turquoise transparent materials
        const isCyanWater =
          mat &&
          mat.transparent &&
          mat.color &&
          ((mat.color.r < 0.35 && mat.color.g > 0.6 && mat.color.b > 0.8) ||
            mat.color.getHexString() === '38bdf8');

        if (isWaterName || isCyanWater || child.userData.isWater) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) this.upgradeToAnimatedWater(m);
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            this.upgradeToAnimatedWater(child.material);
          }
        }
      }
    });
  }

  /**
   * Advances time in seconds to animate all water surfaces.
   */
  public update(timeInSec: number): void {
    this.globalUniforms.uTime.value = timeInSec;
  }
}

export const waterAnimationManager = new WaterAnimationManager();
