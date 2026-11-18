import sharp from 'sharp';

async function testCrop() {
  // Let's create a 1280x640 preview to inspect
  await sharp('glb_public/assets/bg/swiss_grindelwald_360_real.jpg')
    .resize(1280, 640)
    .toFile('C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/grindelwald_preview.png');
  console.log('Saved grindelwald_preview.png');
}

testCrop();
