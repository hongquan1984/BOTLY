import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const baseDir = 'D:/botly/App/prototypes/wellness-home';
const nightLandscapeSrc = 'C:/Users/Admin/.gemini/antigravity/brain/685e195b-af4b-4fee-8d91-49c1fcd4597d/swiss_alps_night_landscape_1794146671650.jpg';

// =========================================================================
// 1. Process Living Room Wide (scene_interior_wide)
// =========================================================================
async function buildLivingRoomNight() {
  console.log('Building photorealistic Living Room Night background...');
  const daySrc = path.join(baseDir, 'assets/scenes/scene_interior_wide.webp');
  const dayRaw = await sharp(daySrc).raw().toBuffer({ resolveWithObject: true });
  const W = dayRaw.info.width;
  const H = dayRaw.info.height;

  // Prepare high-res night sky aligned to room perspective
  // Height = H, Width = W
  const nightRaw = await sharp(nightLandscapeSrc)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuf = Buffer.from(dayRaw.data);
  const maskBuf = Buffer.alloc(W * H);

  // We determine the window regions:
  // Region 1: Upper cathedral windows (y between 180 and 365, x between 640 and 1060, plus right gable x > 1570)
  // Region 2: Main panoramic glass wall & sliding doors (x between 415 and 1650, y between 355 and 735)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3;
      const r = dayRaw.data[idx];
      const g = dayRaw.data[idx + 1];
      const b = dayRaw.data[idx + 2];

      // Check if pixel is in any window geometric aperture
      let inWindowZone = false;

      // Zone 1: Upper Cathedral Gable
      if (y >= 180 && y <= 365) {
        // Left gable triangle: x between 650 and 835
        // Right gable triangle: x between 855 and 1045
        // Far right gable trapezoid: x between 1575 and 1655
        if ((x >= 650 && x <= 835) || (x >= 855 && x <= 1045) || (x >= 1575 && x <= 1655)) {
          inWindowZone = true;
        }
      }

      // Zone 2: Main Middle Windows & Sliding Doors & Right Terrace Glass
      if (y > 355 && y <= 735 && x >= 415 && x <= 1650) {
        // Check lower sill line:
        // Left section (x: 415 - 1130): sill is at y ~ 715
        // Right section (x: 1130 - 1650): sill is at y ~ 735
        if (x <= 1130 && y <= 715) {
          inWindowZone = true;
        } else if (x > 1130 && y <= 735) {
          inWindowZone = true;
        }
      }

      // If in window zone, determine if it's glass/outdoor or timber frame
      let outdoorWeight = 0.0;

      if (inWindowZone) {
        // Distinctive timber features:
        // Warm brown wood: r > b + 28, r > g, r > 60
        // Shadow wood / dark frames: (r < 75 && g < 55 && b < 45) or (r > 60 && b < 45)
        const isWoodTone = (r > b + 25 && r > g * 1.02 && r > 65) || (r < 75 && g < 60 && b < 45);
        
        // Outdoor features in daytime:
        // Sky: high blue, b > r - 10, b > 140
        // Snow peaks: high luminance (r+g+b > 500), b > 130
        // Lake: green/cyan, g > 130, b > 120, g >= r - 10
        // Nature/trees: g > r, g > b, g > 80
        // Outdoor terrace deck: outside daylight wood (b > 120, r < 235)
        const isDayOutdoor = !isWoodTone && (
          (b > 120 && b >= r - 18) ||
          (g > 130 && g >= r - 15 && b > 100) ||
          (r + g + b > 480 && b > 125) ||
          (y > 560 && y <= 715 && b > 110 && (b >= r - 35))
        );

        if (isDayOutdoor) {
          outdoorWeight = 1.0;
        }
      }

      maskBuf[y * W + x] = Math.round(outdoorWeight * 255);
    }
  }

  // Smooth / feather the mask so there are zero hard cutout edges
  // 3x3 gaussian-style box blur on maskBuf
  const featheredMask = Buffer.alloc(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += maskBuf[(y + dy) * W + (x + dx)];
        }
      }
      featheredMask[y * W + x] = Math.round(sum / 9);
    }
  }

  // Apply composite and interior night lighting
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3;
      const alpha = featheredMask[y * W + x] / 255.0;

      const r = dayRaw.data[idx];
      const g = dayRaw.data[idx + 1];
      const b = dayRaw.data[idx + 2];

      const skyR = nightRaw.data[idx];
      const skyG = nightRaw.data[idx + 1];
      const skyB = nightRaw.data[idx + 2];

      if (alpha > 0.05) {
        // Window glass area:
        // Night sky/mountains with authentic subtle glass interior reflection (8%)
        const glassR = Math.round(skyR * 0.92 + r * 0.08);
        const glassG = Math.round(skyG * 0.92 + g * 0.08);
        const glassB = Math.round(skyB * 0.92 + b * 0.08);

        outBuf[idx] = Math.round(glassR * alpha + r * (1 - alpha));
        outBuf[idx + 1] = Math.round(glassG * alpha + g * (1 - alpha));
        outBuf[idx + 2] = Math.round(glassB * alpha + b * (1 - alpha));
      } else {
        // Interior Room Night Lighting:
        // 1. Fireplace area (x < 420): warm dancing firelight glow
        let fireGlowR = 0, fireGlowG = 0;
        if (x < 550 && y > 350) {
          const dist = Math.hypot((x - 220), (y - 620)); // fireplace center
          const intensity = Math.max(0, 1 - dist / 400);
          fireGlowR = Math.round(intensity * 35);
          fireGlowG = Math.round(intensity * 15);
        }

        // 2. Warm evening chalet lighting (amber 2700K warmth, subtle shadow deepening)
        // Deepen cool daylight spill, boost warm golden wood tone
        const nightR = Math.min(255, Math.round(r * 0.94 + 12 + fireGlowR));
        const nightG = Math.min(255, Math.round(g * 0.88 + 5 + fireGlowG));
        const nightB = Math.max(0, Math.round(b * 0.76 - 8));

        outBuf[idx] = nightR;
        outBuf[idx + 1] = nightG;
        outBuf[idx + 2] = nightB;
      }
    }
  }

  // Save living room night image in both webp and jpg
  const outWebp = path.join(baseDir, 'assets/scenes/scene_interior_wide_night.webp');
  const outJpg = path.join(baseDir, 'assets/scenes/scene_interior_wide_night.jpg');

  await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
    .webp({ quality: 94 })
    .toFile(outWebp);

  await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 94 })
    .toFile(outJpg);

  console.log('Saved Living Room Night: scene_interior_wide_night.webp & .jpg');
}

// =========================================================================
// 2. Process Bedroom (scene_bedroom)
// =========================================================================
async function buildBedroomNight() {
  console.log('Building photorealistic Bedroom Night background...');
  const bedSrc = path.join(baseDir, 'assets/scenes/scene_bedroom.webp');
  const bedRaw = await sharp(bedSrc).raw().toBuffer({ resolveWithObject: true });
  const W = bedRaw.info.width;
  const H = bedRaw.info.height;

  // Align night landscape to bedroom view
  const nightRaw = await sharp(nightLandscapeSrc)
    .resize(W, H, { fit: 'cover', position: 'top' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outBuf = Buffer.from(bedRaw.data);
  const maskBuf = Buffer.alloc(W * H);

  // Bedroom window regions:
  // Left panoramic window: x from 0 to 400, y from 0 to 650
  // Center-right window: x from 450 to 1280, y from 250 to 580 (behind and above bed)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3;
      const r = bedRaw.data[idx];
      const g = bedRaw.data[idx + 1];
      const b = bedRaw.data[idx + 2];

      const inWindowZone = (
        (x >= 0 && x <= 400 && y >= 0 && y <= 660) ||
        (x >= 450 && x <= 1280 && y >= 240 && y <= 580)
      );

      let outdoorWeight = 0.0;
      if (inWindowZone) {
        // Bed headboard / platform wood / frames:
        const isWoodOrBed = (r > b + 32 && r > g) || (r < 75 && g < 60 && b < 50) || (y > 450 && x > 400 && x < 1200 && r > 90);
        
        const isDayOutdoor = !isWoodOrBed && (
          (b > 125 && b >= r - 15) ||
          (g > 135 && g >= r - 15) ||
          (r + g + b > 480 && b > 120)
        );

        if (isDayOutdoor) {
          outdoorWeight = 1.0;
        }
      }

      maskBuf[y * W + x] = Math.round(outdoorWeight * 255);
    }
  }

  // Feather bedroom mask
  const featheredMask = Buffer.alloc(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += maskBuf[(y + dy) * W + (x + dx)];
        }
      }
      featheredMask[y * W + x] = Math.round(sum / 9);
    }
  }

  // Composite bedroom
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3;
      const alpha = featheredMask[y * W + x] / 255.0;

      const r = bedRaw.data[idx];
      const g = bedRaw.data[idx + 1];
      const b = bedRaw.data[idx + 2];

      const skyR = nightRaw.data[idx];
      const skyG = nightRaw.data[idx + 1];
      const skyB = nightRaw.data[idx + 2];

      if (alpha > 0.05) {
        // Window glass with night Alps view
        const glassR = Math.round(skyR * 0.93 + r * 0.07);
        const glassG = Math.round(skyG * 0.93 + g * 0.07);
        const glassB = Math.round(skyB * 0.93 + b * 0.07);

        outBuf[idx] = Math.round(glassR * alpha + r * (1 - alpha));
        outBuf[idx + 1] = Math.round(glassG * alpha + g * (1 - alpha));
        outBuf[idx + 2] = Math.round(glassB * alpha + b * (1 - alpha));
      } else {
        // Cozy night bedroom ambiance: soft warm bedtime glow
        const nightR = Math.min(255, Math.round(r * 0.93 + 10));
        const nightG = Math.min(255, Math.round(g * 0.86 + 4));
        const nightB = Math.max(0, Math.round(b * 0.74 - 8));

        outBuf[idx] = nightR;
        outBuf[idx + 1] = nightG;
        outBuf[idx + 2] = nightB;
      }
    }
  }

  const outWebp = path.join(baseDir, 'assets/scenes/scene_bedroom_night.webp');
  const outJpg = path.join(baseDir, 'assets/scenes/scene_bedroom_night.jpg');

  await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
    .webp({ quality: 94 })
    .toFile(outWebp);

  await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 94 })
    .toFile(outJpg);

  console.log('Saved Bedroom Night: scene_bedroom_night.webp & .jpg');
}

async function main() {
  await buildLivingRoomNight();
  await buildBedroomNight();
  console.log('All authentic night backgrounds successfully generated!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
