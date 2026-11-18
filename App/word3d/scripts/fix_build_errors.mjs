import fs from 'fs';

// 1. Fix src/systems/cozyVillageBuilder.ts lines 963-971
const builderPath = 'd:/botly/App/word3d/src/systems/cozyVillageBuilder.ts';
let builderCode = fs.readFileSync(builderPath, 'utf8');
builderCode = builderCode.replace(
  `      // 2b. Subtle breathing animation on headwater splash & mountain mist
      if (headwaterSplashMesh) {
        const hss = 1.0 + Math.sin(time * 3.8) * 0.08;
        headwaterSplashMesh.scale.set(hss, hss, hss);
      }
      if (mountainMistMesh) {
        const ms = 1.0 + Math.sin(time * 1.5) * 0.1;
        mountainMistMesh.scale.set(1.4 * ms, 0.65 * (2.0 - ms), 1.2 * ms);
      }`,
  `      // 2b. Headwater mountain removed - no mist mesh`
);
fs.writeFileSync(builderPath, builderCode, 'utf8');
console.log('Fixed cozyVillageBuilder.ts');

// 2. Fix src/components/ui/GameUI.tsx destructuring
const uiPath = 'd:/botly/App/word3d/src/components/ui/GameUI.tsx';
let uiCode = fs.readFileSync(uiPath, 'utf8');
uiCode = uiCode.replace(
  `  isDraggingFile,
  onOpenLibrary,
}) => {`,
  `  isDraggingFile,
  onOpenLibrary,
  onBlendSelectedColor,
  onBlendAllColors,
}) => {`
);
fs.writeFileSync(uiPath, uiCode, 'utf8');
console.log('Fixed GameUI.tsx');
