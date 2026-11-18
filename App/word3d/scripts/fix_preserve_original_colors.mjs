import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/botly/App/word3d';

// =========================================================================
// 1. UPDATE LEVEL EDITOR: Strict preservation of original colors
// =========================================================================
const editorPath = path.join(projectRoot, 'src/systems/levelEditor.ts');
let editorCode = fs.readFileSync(editorPath, 'utf8');

// A. In applyStylizedColorBlend: NEVER overwrite textured meshes or structures!
const oldBlendFunctionRegex = /export function applyStylizedColorBlend\(root: THREE\.Object3D, forceAll = false\): boolean {[\s\S]*?\n  return coloredAny;\n}/;

const newBlendFunction = `export function applyStylizedColorBlend(root: THREE.Object3D, forceAll = false): boolean {
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
      if ((mesh as any).isSkinnedMesh) return;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      for (let m = 0; m < materials.length; m++) {
        const mat = materials[m] as THREE.MeshStandardMaterial;

        // RULE 1: If mesh has a texture map (diffuse / image texture), NEVER overwrite it!
        if (mat && mat.map) {
          continue;
        }

        const nameLower = (mesh.name + ' ' + (mat?.name || '') + ' ' + (mesh.parent?.name || '')).toLowerCase();

        // RULE 2: Protect all architectural elements, houses, bridges, roofs, furniture, trees
        const isStructureOrProp =
          nameLower.includes('bridge') ||
          nameLower.includes('plank') ||
          nameLower.includes('rail') ||
          nameLower.includes('pier') ||
          nameLower.includes('house') ||
          nameLower.includes('building') ||
          nameLower.includes('roof') ||
          nameLower.includes('wall') ||
          nameLower.includes('chimney') ||
          nameLower.includes('door') ||
          nameLower.includes('window') ||
          nameLower.includes('store') ||
          nameLower.includes('hall') ||
          nameLower.includes('cottage') ||
          nameLower.includes('inn') ||
          nameLower.includes('tower') ||
          nameLower.includes('mill') ||
          nameLower.includes('wheel') ||
          nameLower.includes('dock') ||
          nameLower.includes('barrel') ||
          nameLower.includes('crate') ||
          nameLower.includes('fence') ||
          nameLower.includes('bench') ||
          nameLower.includes('well') ||
          nameLower.includes('vanguard') ||
          nameLower.includes('character') ||
          nameLower.includes('water') ||
          nameLower.includes('stream') ||
          nameLower.includes('leaf') ||
          nameLower.includes('leaves') ||
          nameLower.includes('foliage') ||
          nameLower.includes('trunk') ||
          nameLower.includes('branch') ||
          nameLower.includes('bark') ||
          nameLower.includes('momiji') ||
          nameLower.includes('maple') ||
          (mat && mat.color && Math.abs(mat.color.r - mat.color.g) > 0.16);

        if (isStructureOrProp) {
          continue;
        }

        // Only rock, cliff, stone, mountain, boulder or untextured white rock
        const isWhiteChalk =
          mat &&
          mat.color &&
          mat.color.r > 0.70 &&
          mat.color.g > 0.70 &&
          mat.color.b > 0.70 &&
          Math.abs(mat.color.r - mat.color.g) < 0.10 &&
          Math.abs(mat.color.g - mat.color.b) < 0.10;

        const isRockOrTerrain =
          nameLower.includes('rock') ||
          nameLower.includes('stone') ||
          nameLower.includes('cliff') ||
          nameLower.includes('mountain') ||
          nameLower.includes('boulder') ||
          nameLower.includes('step') ||
          nameLower.includes('terrace') ||
          nameLower.includes('terrain');

        if (forceAll || (isRockOrTerrain && isWhiteChalk)) {
          const geo = mesh.geometry;
          if (!geo) continue;

          // Backup original material and geometry if not yet backed up
          if (!mesh.userData._origMaterial) {
            mesh.userData._origMaterial = mesh.material;
          }
          if (!mesh.userData._origGeometry) {
            mesh.userData._origGeometry = geo.clone();
          }

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
}`;

editorCode = editorCode.replace(oldBlendFunctionRegex, newBlendFunction);

// B. Add restoreOriginalColor function
const restoreCode = `
export function restoreOriginalColor(root: THREE.Object3D): boolean {
  let restored = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.userData._origMaterial) {
        mesh.material = mesh.userData._origMaterial;
        restored = true;
      }
      if (mesh.userData._origGeometry) {
        mesh.geometry = mesh.userData._origGeometry.clone();
        restored = true;
      } else if (mesh.geometry && mesh.geometry.attributes.color) {
        mesh.geometry.deleteAttribute('color');
        restored = true;
      }
      mesh.userData.isColorBlended = false;
    }
  });
  root.userData.isColorBlended = false;
  return restored;
}
`;
if (!editorCode.includes('export function restoreOriginalColor')) {
  editorCode = editorCode.replace(newBlendFunction, newBlendFunction + restoreCode);
}

// C. REMOVE automatic call in loadCustomModel
editorCode = editorCode.replace(
  `registerObject(model, 'custom_model', uniqueName, {
            isCustomSpawn: true,
            modelStorageKey: storageKey,
          });
          applyStylizedColorBlend(model);`,
  `registerObject(model, 'custom_model', uniqueName, {
            isCustomSpawn: true,
            modelStorageKey: storageKey,
          });
          // Do NOT auto-blend: keep 100% original model colors and textures!`
);

// D. In importJSON: ONLY blend if item.isColorBlended === true AND it is a rock/mountain
editorCode = editorCode.replace(
  `if (item.isColorBlended || item.type === 'custom_model' || item.name?.toLowerCase().includes('rock') || item.name?.toLowerCase().includes('mountain')) {
                        applyStylizedColorBlend(model, true);
                        model.userData.isColorBlended = true;
                      }`,
  `const isRockMtn = (item.name || '').toLowerCase().includes('rock') || (item.name || '').toLowerCase().includes('mountain') || (item.name || '').toLowerCase().includes('cliff');
                      if (item.isColorBlended === true && isRockMtn) {
                        applyStylizedColorBlend(model, true);
                        model.userData.isColorBlended = true;
                      } else {
                        model.userData.isColorBlended = false;
                      }`
);

// In importJSON for base objects: never color bridge or buildings!
editorCode = editorCode.replace(
  `          if (item.isColorBlended) {
            applyStylizedColorBlend(match, true);
            match.userData.isColorBlended = true;
          }`,
  `          // Base objects keep pristine original materials
          match.userData.isColorBlended = false;`
);

// In importJSON for extracted assets:
editorCode = editorCode.replace(
  `if (item.isColorBlended || item.name?.toLowerCase().includes('rock') || item.name?.toLowerCase().includes('mountain')) {
                  applyStylizedColorBlend(spawned, true);
                  spawned.userData.isColorBlended = true;
                }`,
  `const isRockMtn = (item.name || '').toLowerCase().includes('rock') || (item.name || '').toLowerCase().includes('mountain') || (item.name || '').toLowerCase().includes('cliff');
                if (item.isColorBlended === true && isRockMtn) {
                  applyStylizedColorBlend(spawned, true);
                  spawned.userData.isColorBlended = true;
                } else {
                  spawned.userData.isColorBlended = false;
                }`
);

// E. Add restoreSelectedColor to LevelEditorResult interface & implementation
editorCode = editorCode.replace(
  `  blendSelectedColor: () => boolean;\n  blendAllUncoloredMeshes: () => number;\n}`,
  `  blendSelectedColor: () => boolean;\n  restoreSelectedColor: () => boolean;\n}`
);

editorCode = editorCode.replace(
  `    blendAllUncoloredMeshes: () => {
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
    },`,
  `    restoreSelectedColor: () => {
      if (!selectedObject) return false;
      const res = restoreOriginalColor(selectedObject);
      selectedObject.userData.isColorBlended = false;
      selectedObject.traverse((c) => {
        c.userData.isColorBlended = false;
      });
      saveLayout();
      console.log(\`Đã khôi phục màu gốc cho [\${selectedObject.name}]:\`, res);
      return res;
    },`
);

fs.writeFileSync(editorPath, editorCode, 'utf8');
console.log('1. levelEditor.ts updated: original colors strictly preserved!');

// =========================================================================
// 2. UPDATE GameUI.tsx: Add "↩️ Màu Gốc" and remove "Lên Màu Cảnh"
// =========================================================================
const uiPath = path.join(projectRoot, 'src/components/ui/GameUI.tsx');
let uiCode = fs.readFileSync(uiPath, 'utf8');

// Add onRestoreSelectedColor to GameUIProps
uiCode = uiCode.replace(
  `  onBlendSelectedColor?: () => void;\n  onBlendAllColors?: () => void;\n}`,
  `  onBlendSelectedColor?: () => void;\n  onRestoreSelectedColor?: () => void;\n}`
);

// Destructure in GameUI
uiCode = uiCode.replace(
  `  onBlendSelectedColor,\n  onBlendAllColors,\n}: GameUIProps`,
  `  onBlendSelectedColor,\n  onRestoreSelectedColor,\n}: GameUIProps`
);

// Remove "Lên Màu Cảnh" from top bar
uiCode = uiCode.replace(
  `          <button
            className="btn-editor-action"
            onClick={() => {
              onBlendAllColors?.();
              handleAction('Đã quét và lên màu tự nhiên cho tất cả núi đá!');
            }}
            title="Tự động lên màu cỏ xanh & đá xám cho tất cả núi/đá untextured"
            style={{
              background: 'rgba(22, 163, 74, 0.3)',
              border: '1px solid rgba(74, 222, 128, 0.5)',
              color: '#86efac',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu Cảnh
          </button>`,
  ``
);

// In inspector selection bar, add "↩️ Màu Gốc" next to "🎨 Lên Màu"
uiCode = uiCode.replace(
  `          <button
            className="editor-tool-btn"
            onClick={() => {
              onBlendSelectedColor?.();
              handleAction('Đã lên màu cỏ & đá tự nhiên cho vật thể!');
            }}
            title="Lên màu cỏ xanh cho bậc thang & đá cho vách núi"
            style={{
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu
          </button>`,
  `          <button
            className="editor-tool-btn"
            onClick={() => {
              onBlendSelectedColor?.();
              handleAction('Đã lên màu cỏ & đá cho núi/đá!');
            }}
            title="Chỉ dùng cho núi/đá: Lên màu cỏ xanh cho bậc thang & đá xám cho vách núi"
            style={{
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu (Núi/Đá)
          </button>
          <button
            className="editor-tool-btn"
            onClick={() => {
              onRestoreSelectedColor?.();
              handleAction('Đã khôi phục màu & texture gốc cho vật thể!');
            }}
            title="Khôi phục lại toàn bộ màu sắc và texture nguyên bản ban đầu của mô hình"
            style={{
              background: 'linear-gradient(135deg, #475569, #334155)',
              color: '#ffffff',
              fontWeight: 500,
            }}
          >
            ↩️ Màu Gốc
          </button>`
);

fs.writeFileSync(uiPath, uiCode, 'utf8');
console.log('2. GameUI.tsx updated: Added "↩️ Màu Gốc" button!');

// =========================================================================
// 3. UPDATE App.tsx: wire onRestoreSelectedColor
// =========================================================================
const appPath = path.join(projectRoot, 'src/App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

appCode = appCode.replace(
  `  const handleBlendAllColors = () => {
    systemsRef.current?.levelEditor.blendAllUncoloredMeshes();
  };`,
  `  const handleRestoreSelectedColor = () => {
    systemsRef.current?.levelEditor.restoreSelectedColor();
  };`
);

appCode = appCode.replace(
  `        onBlendSelectedColor={handleBlendSelectedColor}
        onBlendAllColors={handleBlendAllColors}`,
  `        onBlendSelectedColor={handleBlendSelectedColor}
        onRestoreSelectedColor={handleRestoreSelectedColor}`
);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('3. App.tsx updated!');
