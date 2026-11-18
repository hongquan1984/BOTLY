import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/botly/App/word3d';
const appPath = path.join(projectRoot, 'src/App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Add auto-blend after loading
appCode = appCode.replace(
  `      await levelEditor.loadSavedLayout();
    });`,
  `      await levelEditor.loadSavedLayout();
      // Auto-blend untextured white mountain/rock meshes in cozyVillage
      levelEditor.blendAllUncoloredMeshes();
    });`
);

// 2. Add handler functions
appCode = appCode.replace(
  `  const handlePlaceAssetInMap = async (asset: ExtractedAssetItem) => {`,
  `  const handleBlendSelectedColor = () => {
    systemsRef.current?.levelEditor.blendSelectedColor();
  };

  const handleBlendAllColors = () => {
    systemsRef.current?.levelEditor.blendAllUncoloredMeshes();
  };

  const handlePlaceAssetInMap = async (asset: ExtractedAssetItem) => {`
);

// 3. Pass handlers to GameUI
appCode = appCode.replace(
  `        isDraggingFile={isDraggingFile}
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />`,
  `        isDraggingFile={isDraggingFile}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onBlendSelectedColor={handleBlendSelectedColor}
        onBlendAllColors={handleBlendAllColors}
      />`
);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('src/App.tsx patched successfully!');
