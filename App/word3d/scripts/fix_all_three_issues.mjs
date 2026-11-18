import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/botly/App/word3d';

// =========================================================================
// 1. FIX SKY ENVIRONMENT: Remove the 3D cloud stuck to the island
// =========================================================================
const skyPath = path.join(projectRoot, 'src/systems/skyEnvironment.ts');
let skyCode = fs.readFileSync(skyPath, 'utf8');

// Remove depthCloud1 which was intersecting the island rim at [-16.5, 0.4, 11.5]
skyCode = skyCode.replace(
  `  const depthCloud1 = buildCloudCluster(cloud1Puffs);
  depthCloud1.position.set(-16.5, 0.4, 11.5);
  depthCloudsGroup.add(depthCloud1);`,
  `  // depthCloud1 REMOVED - was clipping directly into the island edge!`
);

// Also remove depthCloud2 or make depthCloudsGroup empty so no 3D clouds touch the island
skyCode = skyCode.replace(
  `  const depthCloud2 = buildCloudCluster(cloud2Puffs);
  depthCloud2.position.set(9.6, -14.2, 4.9);
  depthCloudsGroup.add(depthCloud2);`,
  `  // depthCloudsGroup kept clean - sky painting provides all natural distant clouds`
);

// In update method, guard depthCloud1 and depthCloud2 references
skyCode = skyCode.replace(
  `      depthCloud1.position.y = 0.4 + Math.sin(time * 0.7) * 0.22;
      depthCloud2.position.y = -14.2 + Math.sin(time * 0.85 + 1.2) * 0.28;
      const s2 = 1.0 + Math.sin(time * 0.9) * 0.05;
      depthCloud2.scale.set(s2, s2, s2);`,
  `      // No 3D clouds clipping near the island`
);

fs.writeFileSync(skyPath, skyCode, 'utf8');
console.log('1. skyEnvironment.ts: Successfully removed clipping 3D clouds!');

// =========================================================================
// 2. FIX LEVEL EDITOR: Persistence of color blending, auto-save on blend & delete, purge legacy mountain
// =========================================================================
const editorPath = path.join(projectRoot, 'src/systems/levelEditor.ts');
let editorCode = fs.readFileSync(editorPath, 'utf8');

// A. Add isColorBlended to EditableObjectData interface
if (!editorCode.includes('isColorBlended?: boolean;')) {
  editorCode = editorCode.replace(
    `  isCustomSpawn?: boolean;\n}`,
    `  isCustomSpawn?: boolean;\n  isColorBlended?: boolean;\n}`
  );
}

// B. In registerObject, pass through isColorBlended
editorCode = editorCode.replace(
  `      isCustomSpawn: extra?.isCustomSpawn ?? obj.userData?.isCustomSpawn ?? false,
      customDataUrl: extra?.customDataUrl ?? obj.userData?.customDataUrl,`,
  `      isCustomSpawn: extra?.isCustomSpawn ?? obj.userData?.isCustomSpawn ?? false,
      isColorBlended: extra?.isColorBlended ?? obj.userData?.isColorBlended ?? false,
      customDataUrl: extra?.customDataUrl ?? obj.userData?.customDataUrl,`
);

// C. In deleteSelected, automatically save layout immediately
editorCode = editorCode.replace(
  `    selectObject(null);
    return true;
  }`,
  `    selectObject(null);
    saveLayout(); // AUTO-SAVE AFTER DELETION so F5 never brings it back!
    return true;
  }`
);

// D. In saveLayout, persist isColorBlended
editorCode = editorCode.replace(
  `        isCustomSpawn: !!obj.userData?.isCustomSpawn,
      });`,
  `        isCustomSpawn: !!obj.userData?.isCustomSpawn,
        isColorBlended: !!obj.userData?.isColorBlended,
      });`
);

// E. In exportJSON, persist isColorBlended
editorCode = editorCode.replace(
  `        isCustomSpawn: !!obj.userData?.isCustomSpawn,\n      });\n    });\n    return JSON.stringify`,
  `        isCustomSpawn: !!obj.userData?.isCustomSpawn,\n        isColorBlended: !!obj.userData?.isColorBlended,\n      });\n    });\n    return JSON.stringify`
);

// F. In importJSON:
// - Purge any legacy 'Headwater' or 'Mountain' that doesn't have a modelStorageKey
// - When restoring any item, if isColorBlended is true (or if it's a custom_model/rock/mountain), apply blend and set userData.isColorBlended = true!
const oldImportStart = `    try {
      const data: EditableObjectData[] = JSON.parse(jsonStr);
      if (!Array.isArray(data)) return false;`;

const newImportStart = `    try {
      const rawData: EditableObjectData[] = JSON.parse(jsonStr);
      if (!Array.isArray(rawData)) return false;

      // Purge any legacy hardcoded mountain from saved layout
      const data = rawData.filter((item) => {
        const n = (item.name || '').toLowerCase();
        if ((n.includes('headwater') || n.includes('ngọn núi đầu nguồn')) && !item.modelStorageKey) {
          console.log('Purging legacy headwater mountain from saved layout:', item.name);
          return false;
        }
        return true;
      });`;

editorCode = editorCode.replace(oldImportStart, newImportStart);

// In importJSON when restoring model from storage:
editorCode = editorCode.replace(
  `                      registerObject(model, 'custom_model', item.name, {
                        isCustomSpawn: true,
                        modelStorageKey: item.modelStorageKey,
                      });
                      applyStylizedColorBlend(model);`,
  `                      registerObject(model, 'custom_model', item.name, {
                        isCustomSpawn: true,
                        modelStorageKey: item.modelStorageKey,
                        isColorBlended: !!item.isColorBlended,
                      });
                      if (item.isColorBlended || item.type === 'custom_model' || item.name?.toLowerCase().includes('rock') || item.name?.toLowerCase().includes('mountain')) {
                        applyStylizedColorBlend(model, true);
                        model.userData.isColorBlended = true;
                      }`
);

// In importJSON when restoring extracted asset:
editorCode = editorCode.replace(
  `                spawned.userData.name = item.name;
                spawned.name = item.name;
              } catch (err) {`,
  `                spawned.userData.name = item.name;
                spawned.name = item.name;
                if (item.isColorBlended || item.name?.toLowerCase().includes('rock') || item.name?.toLowerCase().includes('mountain')) {
                  applyStylizedColorBlend(spawned, true);
                  spawned.userData.isColorBlended = true;
                }
              } catch (err) {`
);

// In importJSON when matching base objects:
editorCode = editorCode.replace(
  `          match.scale.set(item.scale[0], item.scale[1], item.scale[2]);
        } else {`,
  `          match.scale.set(item.scale[0], item.scale[1], item.scale[2]);
          if (item.isColorBlended) {
            applyStylizedColorBlend(match, true);
            match.userData.isColorBlended = true;
          }
        } else {`
);

// G. In blendSelectedColor: auto-save immediately so F5 never loses color!
editorCode = editorCode.replace(
  `    blendSelectedColor: () => {
      if (!selectedObject) return false;
      const res = applyStylizedColorBlend(selectedObject, true);
      console.log(\`Lên màu cho vật thể [\${selectedObject.name}]:\`, res);
      return res;
    },`,
  `    blendSelectedColor: () => {
      if (!selectedObject) return false;
      const res = applyStylizedColorBlend(selectedObject, true);
      selectedObject.userData.isColorBlended = true;
      selectedObject.traverse((c) => {
        c.userData.isColorBlended = true;
      });
      // AUTO-SAVE IMMEDIATELY SO COLOR PERSISTS ACROSS F5!
      saveLayout();
      console.log(\`Đã lên màu và tự động lưu bố cục cho vật thể [\${selectedObject.name}]:\`, res);
      return res;
    },`
);

fs.writeFileSync(editorPath, editorCode, 'utf8');
console.log('2. levelEditor.ts: Successfully updated color persistence & auto-save!');
