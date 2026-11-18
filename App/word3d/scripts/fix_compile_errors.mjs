import fs from 'fs';

// 1. Fix src/systems/skyEnvironment.ts
const skyPath = 'd:/botly/App/word3d/src/systems/skyEnvironment.ts';
let skyCode = fs.readFileSync(skyPath, 'utf8');
skyCode = skyCode.replace(
  `      // 2. Gentle breathing/floating motion for the 2 depth clouds
      depthCloud1.position.y = 0.4 + Math.sin(time * 0.7) * 0.22;
      depthCloud2.position.y = -14.2 + Math.sin(time * 0.85 + 1.2) * 0.28;
      const s2 = 1.0 + Math.sin(time * 1.1) * 0.05;
      depthCloud2.scale.set(s2, s2, s2);`,
  `      // 3D clouds removed so island edge is clean and open`
);
skyCode = skyCode.replace(
  `      if (quality === 'low') {
        cloudMat.opacity = 0.80;
      } else {
        cloudMat.opacity = 0.88;
      }`,
  `      // Quality settings updated`
);
fs.writeFileSync(skyPath, skyCode, 'utf8');
console.log('Fixed skyEnvironment.ts');

// 2. Fix src/systems/levelEditor.ts
const editorPath = 'd:/botly/App/word3d/src/systems/levelEditor.ts';
let editorCode = fs.readFileSync(editorPath, 'utf8');
editorCode = editorCode.replace(
  `    extra?: {
      assetUrl?: string;
      templateType?: string;
      modelStorageKey?: string;
      isCustomSpawn?: boolean;
      customDataUrl?: string;
    }`,
  `    extra?: {
      assetUrl?: string;
      templateType?: string;
      modelStorageKey?: string;
      isCustomSpawn?: boolean;
      isColorBlended?: boolean;
      customDataUrl?: string;
    }`
);
fs.writeFileSync(editorPath, editorCode, 'utf8');
console.log('Fixed levelEditor.ts');
