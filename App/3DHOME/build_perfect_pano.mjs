import sharp from 'sharp';

async function buildFlawlessPano() {
  const WIDTH = 8192;
  const HEIGHT = 2048;

  console.log('Building flawless seamless 360 panorama...');

  // 1. Resize Wengen photo to WIDTH x HEIGHT
  const wengenResized = await sharp('glb_public/assets/bg/swiss_wengen_slopes.jpg')
    .extract({ left: 0, top: 400, width: 7952, height: 4200 })
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .toBuffer();

  const leftHalf = await sharp(wengenResized)
    .extract({ left: 0, top: 0, width: 4096, height: HEIGHT })
    .toBuffer();

  const rightHalf = await sharp(wengenResized)
    .extract({ left: 4096, top: 0, width: 4096, height: HEIGHT })
    .toBuffer();

  // Swap halves: [RightHalf (4096px), LeftHalf (4096px)]
  // Guaranteed mathematically seamless at outer edges!
  const swapped = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([
      { input: rightHalf, left: 0, top: 0 },
      { input: leftHalf, left: 4096, top: 0 }
    ])
    .png()
    .toBuffer();

  // 2. Prepare Lake Brienz vista for the center (North sector)
  const lakeWidth = 3200;
  const lakeX = Math.round((WIDTH - lakeWidth) / 2); // 2496

  const lakeRaw = await sharp('glb_public/assets/bg/swiss_lake_village_vista.jpg')
    .extract({ left: 0, top: 0, width: 1920, height: 1400 })
    .resize(lakeWidth, HEIGHT, { fit: 'cover', position: 'bottom' })
    .modulate({ brightness: 1.01, saturation: 1.05 })
    .ensureAlpha()
    .toBuffer();

  // 700px ultra-smooth feathered mask on left & right of Lake Brienz
  const feather = 700;
  const maskData = Buffer.alloc(lakeWidth * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < lakeWidth; x++) {
      let alpha = 1.0;
      if (x < feather) {
        alpha = x / feather;
      } else if (x > lakeWidth - feather) {
        alpha = (lakeWidth - x) / feather;
      }
      alpha = alpha * alpha * (3 - 2 * alpha);
      maskData[y * lakeWidth + x] = Math.round(alpha * 255);
    }
  }

  const lakeBlended = await sharp(lakeRaw)
    .composite([{
      input: maskData,
      raw: { width: lakeWidth, height: HEIGHT, channels: 1 },
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  // 3. Composite into final WebP
  await sharp(swapped)
    .composite([{ input: lakeBlended, left: lakeX, top: 0 }])
    .webp({ quality: 92 })
    .toFile('glb_public/assets/bg/swiss_panorama_360_real.webp');

  console.log('Saved glb_public/assets/bg/swiss_panorama_360_real.webp successfully!');

  // Preview
  await sharp('glb_public/assets/bg/swiss_panorama_360_real.webp')
    .resize(1920, 480)
    .toFile('C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/panorama_360_preview.png');
  console.log('Saved panorama_360_preview.png');
}

buildFlawlessPano().catch(console.error);
