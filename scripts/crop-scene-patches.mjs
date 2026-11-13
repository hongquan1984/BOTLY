import sharp from 'sharp';
import fs from 'fs';

async function cropPatches() {
  const gridPath = 'd:/botly/.tmp/annotated-scene-grid.jpg';
  const outDir = 'd:/botly/.tmp/patches';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const patches = [
    { name: '1-knowledge-library', left: 100, top: 120, width: 250, height: 200 },
    { name: '2-clinic-cottage', left: 20, top: 320, width: 280, height: 200 },
    { name: '3-stone-fountain', left: 400, top: 160, width: 220, height: 160 },
    { name: '4-greenhouse-garden', left: 650, top: 140, width: 280, height: 180 },
    { name: '5-wellness-pavilion', left: 700, top: 300, width: 260, height: 180 },
    { name: '6-center-circle-plaza', left: 350, top: 380, width: 320, height: 180 },
    { name: '7-wooden-pier', left: 760, top: 430, width: 240, height: 140 },
  ];

  for (const patch of patches) {
    await sharp(gridPath)
      .extract(patch)
      .jpeg({ quality: 90 })
      .toFile(`${outDir}/${patch.name}.jpg`);
  }
  console.log('Saved patches to .tmp/patches');
}

cropPatches();
