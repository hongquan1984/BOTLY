import sharp from 'sharp';

async function build360() {
  const WIDTH = 8192;
  const HEIGHT = 2048;

  console.log('Building perfected seamless 360 real-photo panorama...');

  // 1. Prepare Wengen base image
  // Extract lush mountain slopes and alpine meadows
  const wengenRaw = await sharp('glb_public/assets/bg/swiss_wengen_slopes.jpg')
    .extract({ left: 0, top: 200, width: 7952, height: 4400 })
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
    .toBuffer();

  // Make Wengen seamlessly wrap at edges (X=0 and X=WIDTH)
  // We extract a 600px strip from the left edge (X=0..600) and blend it onto the right edge (X=WIDTH-600..WIDTH)
  const wrapFeather = 600;
  const leftEdge = await sharp(wengenRaw)
    .extract({ left: 0, top: 0, width: wrapFeather, height: HEIGHT })
    .ensureAlpha()
    .toBuffer();

  const wrapMask = Buffer.alloc(wrapFeather * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < wrapFeather; x++) {
      let a = x / wrapFeather;
      a = a * a * (3 - 2 * a);
      wrapMask[y * wrapFeather + x] = Math.round(a * 255);
    }
  }

  const leftEdgeBlended = await sharp(leftEdge)
    .composite([{
      input: wrapMask,
      raw: { width: wrapFeather, height: HEIGHT, channels: 1 },
      blend: 'dest-in'
    }])
    .png()
    .toBuffer();

  const wengenSeamless = await sharp(wengenRaw)
    .composite([{ input: leftEdgeBlended, left: WIDTH - wrapFeather, top: 0 }])
    .toBuffer();

  // 2. Prepare Lake Brienz vista for the center (North sector)
  // swiss_lake_village_vista.jpg: 1920 x 1440
  const lakeWidth = 3400;
  const lakeX = Math.round((WIDTH - lakeWidth) / 2); // 2396

  // Match color warmth slightly
  const lakeResized = await sharp('glb_public/assets/bg/swiss_lake_village_vista.jpg')
    .extract({ left: 0, top: 60, width: 1920, height: 1250 })
    .resize(lakeWidth, HEIGHT, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 1.02, saturation: 1.08 })
    .ensureAlpha()
    .toBuffer();

  // Wide 650px smooth feather on both flanks
  const feather = 650;
  const maskData = Buffer.alloc(lakeWidth * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < lakeWidth; x++) {
      let alpha = 1.0;
      if (x < feather) {
        alpha = x / feather;
      } else if (x > lakeWidth - feather) {
        alpha = (lakeWidth - x) / feather;
      }
      // Smooth cubic curve
      alpha = alpha * alpha * (3 - 2 * alpha);
      maskData[y * lakeWidth + x] = Math.round(alpha * 255);
    }
  }

  const lakeBlended = await sharp(lakeResized)
    .composite([
      {
        input: maskData,
        raw: { width: lakeWidth, height: HEIGHT, channels: 1 },
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();

  // 3. Composite Final 360 Panorama
  await sharp(wengenSeamless)
    .composite([
      { input: lakeBlended, left: lakeX, top: 0 }
    ])
    .webp({ quality: 92 })
    .toFile('glb_public/assets/bg/swiss_panorama_360_real.webp');

  console.log('Saved glb_public/assets/bg/swiss_panorama_360_real.webp');

  // Preview
  await sharp('glb_public/assets/bg/swiss_panorama_360_real.webp')
    .resize(1920, 480)
    .toFile('C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots/panorama_360_preview.png');
  console.log('Updated preview file.');
}

build360().catch(console.error);
