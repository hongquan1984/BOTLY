import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/botly/App/word3d';

// 1. Update src/systems/levelEditor.ts
const editorPath = path.join(projectRoot, 'src/systems/levelEditor.ts');
let editorCode = fs.readFileSync(editorPath, 'utf8');

// A. Add interface definitions
editorCode = editorCode.replace(
  `  update: () => void;
}`,
  `  update: () => void;
  blendSelectedColor: () => boolean;
  blendAllUncoloredMeshes: () => number;
}`
);

// B. Replace applyStylizedColorBlend with advanced normal-transformed version
const oldBlendRegex = /\/\*\*[\s\S]*?export function applyStylizedColorBlend\(root: THREE\.Object3D\): void {[\s\S]*?\n}\n/;
const newBlendCode = `/**
 * Automatically blends / applies natural stylized materials to any untextured or white custom model (like mountains, rocks, terrain):
 * - Up-facing surfaces (normals pointing up, normal.y > 0.50) -> Lush Meadow Grass Green (#58a638 / #86efac)
 * - Slope surfaces (normal.y between 0.25 and 0.50) -> Moss-covered transition stone (#3f6212 / #4d7c0f)
 * - Vertical cliff faces (normal.y < 0.25) -> Slate Cliff Rock (#64748b / #334155)
 * - Lower underbelly -> Dark Slate / Granite (#334155 / #1e293b)
 */
export function applyStylizedColorBlend(root: THREE.Object3D, forceAll = false): boolean {
  let coloredAny = false;
  const grassColor = new THREE.Color('#58a638');
  const lushHighlight = new THREE.Color('#86efac');
  const mossColor = new THREE.Color('#3f6212');
  const rockColor = new THREE.Color('#64748b');
  const darkRockColor = new THREE.Color('#334155');

  root.updateWorldMatrix(true, true);

  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      for (let m = 0; m < materials.length; m++) {
        const mat = materials[m] as THREE.MeshStandardMaterial;

        const nameLower = (mesh.name + ' ' + (mat?.name || '') + ' ' + (mesh.parent?.name || '')).toLowerCase();

        // Never overwrite colorful foliage, leaves or tree trunks unless forced
        const isFoliage =
          nameLower.includes('leaf') ||
          nameLower.includes('leaves') ||
          nameLower.includes('foliage') ||
          nameLower.includes('trunk') ||
          nameLower.includes('branch') ||
          nameLower.includes('bark') ||
          nameLower.includes('momiji') ||
          nameLower.includes('maple') ||
          (mat && mat.color && Math.abs(mat.color.r - mat.color.g) > 0.18);

        if (isFoliage && !forceAll) {
          continue;
        }

        // Detect white / chalk / untextured mesh
        const isWhiteOrChalk =
          !mat ||
          !mat.map ||
          (mat.color &&
            mat.color.r > 0.65 &&
            mat.color.g > 0.65 &&
            mat.color.b > 0.65 &&
            Math.abs(mat.color.r - mat.color.g) < 0.12 &&
            Math.abs(mat.color.g - mat.color.b) < 0.12);

        const isRockOrTerrain =
          nameLower.includes('rock') ||
          nameLower.includes('stone') ||
          nameLower.includes('cliff') ||
          nameLower.includes('mountain') ||
          nameLower.includes('boulder') ||
          nameLower.includes('step') ||
          nameLower.includes('terrace') ||
          nameLower.includes('terrain');

        if (forceAll || isRockOrTerrain || isWhiteOrChalk) {
          const geo = mesh.geometry;
          if (!geo) continue;

          mesh.geometry = geo.clone();
          const targetGeo = mesh.geometry;

          if (!targetGeo.attributes.normal) {
            targetGeo.computeVertexNormals();
          }

          const normals = targetGeo.attributes.normal;
          const positions = targetGeo.attributes.position;
          if (!normals || !positions) continue;

          const count = positions.count;
          const colors = new Float32Array(count * 3);

          let minY = Infinity;
          let maxY = -Infinity;
          for (let i = 0; i < count; i++) {
            const y = positions.getY(i);
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
          const heightRange = Math.max(0.1, maxY - minY);

          const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
          const worldNormal = new THREE.Vector3();

          for (let i = 0; i < count; i++) {
            worldNormal.set(normals.getX(i), normals.getY(i), normals.getZ(i));
            worldNormal.applyMatrix3(normalMatrix).normalize();
            const ny = worldNormal.y;

            const y = positions.getY(i);
            const relHeight = (y - minY) / heightRange;

            const vertexCol = new THREE.Color();

            if (ny > 0.50) {
              // Flat top plateau / terrace -> Lush Green Grass
              vertexCol.copy(grassColor);
              if (relHeight > 0.6) {
                vertexCol.lerp(lushHighlight, (relHeight - 0.6) * 0.45);
              }
            } else if (ny > 0.22) {
              // Slopes & terrace edges -> Mossy stone transition
              const t = (ny - 0.22) / 0.28;
              vertexCol.copy(rockColor).lerp(mossColor, t * 0.85);
            } else {
              // Vertical cliff walls & crevices -> Slate Rock
              vertexCol.copy(rockColor);
              if (relHeight < 0.35) {
                vertexCol.lerp(darkRockColor, (0.35 - relHeight) / 0.35);
              }
            }

            colors[i * 3] = vertexCol.r;
            colors[i * 3 + 1] = vertexCol.g;
            colors[i * 3 + 2] = vertexCol.b;
          }

          targetGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          mesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.86,
            metalness: 0.05,
            flatShading: true,
          });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          coloredAny = true;
        }
      }
    }
  });

  return coloredAny;
}
`;

editorCode = editorCode.replace(oldBlendRegex, newBlendCode);

// C. Call applyStylizedColorBlend in loadCustomModel
editorCode = editorCode.replace(
  `registerObject(model, 'custom_model', uniqueName, {
            isCustomSpawn: true,
            modelStorageKey: storageKey,
          });
          waterAnimationManager.animateWaterMeshes(model);
          selectObject(model);`,
  `registerObject(model, 'custom_model', uniqueName, {
            isCustomSpawn: true,
            modelStorageKey: storageKey,
          });
          applyStylizedColorBlend(model);
          waterAnimationManager.animateWaterMeshes(model);
          selectObject(model);`
);

// D. Call applyStylizedColorBlend in importJSON
editorCode = editorCode.replace(
  `registerObject(model, 'custom_model', item.name, {
                        isCustomSpawn: true,
                        modelStorageKey: item.modelStorageKey,
                      });
                      console.log(\`Restored uploaded 3D model from IndexedDB: \${item.name}\`);
                      resolve();`,
  `registerObject(model, 'custom_model', item.name, {
                        isCustomSpawn: true,
                        modelStorageKey: item.modelStorageKey,
                      });
                      applyStylizedColorBlend(model);
                      console.log(\`Restored uploaded 3D model from IndexedDB: \${item.name}\`);
                      resolve();`
);

// E. Add blend methods to return object of createLevelEditor
editorCode = editorCode.replace(
  `    update: () => {
      if (boxHelper && selectedObject && boxHelper.visible) {
        boxHelper.update();
      }
    },
  };`,
  `    update: () => {
      if (boxHelper && selectedObject && boxHelper.visible) {
        boxHelper.update();
      }
    },
    blendSelectedColor: () => {
      if (!selectedObject) return false;
      const res = applyStylizedColorBlend(selectedObject, true);
      console.log(\`Lên màu cho vật thể [\${selectedObject.name}]:\`, res);
      return res;
    },
    blendAllUncoloredMeshes: () => {
      let count = 0;
      parentGroup.traverse((child) => {
        if (child !== walkablePlane && (child as THREE.Mesh).isMesh) {
          if (applyStylizedColorBlend(child, false)) {
            count++;
          }
        }
      });
      console.log(\`Đã tự động lên màu cho \${count} khối núi/đá untextured trong cảnh.\`);
      return count;
    },
  };`
);

fs.writeFileSync(editorPath, editorCode, 'utf8');
console.log('src/systems/levelEditor.ts updated successfully!');
