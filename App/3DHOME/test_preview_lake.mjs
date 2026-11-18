import sharp from 'sharp';

async function previewLake() {
  await sharp('glb_public/assets/bg/swiss_lake_village_vista.jpg')
    .resize(1920, 1080, { fit: 'inside' })
    .toFile('C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/lake_preview.png');
  console.log('Saved lake_preview.png');
}

previewLake();
