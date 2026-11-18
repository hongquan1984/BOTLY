import sharp from 'sharp';

async function measureWaterline() {
  const meta = await sharp('glb_public/assets/bg/swiss_panorama_360_real.webp').metadata();
  console.log('Image dimensions:', meta.width, 'x', meta.height);

  // Let's crop a vertical strip from the center (X = 4000..4200) to inspect the waterline Y
  await sharp('glb_public/assets/bg/swiss_panorama_360_real.webp')
    .extract({ left: 3900, top: 0, width: 400, height: meta.height })
    .resize(200, 1024)
    .toFile('C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/waterline_strip.png');

  console.log('Saved waterline_strip.png');
}

measureWaterline().catch(console.error);
