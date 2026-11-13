import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const nightSkySrc = 'C:/Users/Admin/.gemini/antigravity/brain/685e195b-af4b-4fee-8d91-49c1fcd4597d/swiss_alps_night_landscape_1794146671650.jpg';
const wideDaySrc = 'D:/botly/App/prototypes/wellness-home/assets/scenes/scene_interior_wide.webp';
const bedDaySrc = 'D:/botly/App/prototypes/wellness-home/assets/scenes/scene_bedroom.webp';

async function generateNightScenes() {
  console.log('Generating Night Scenes with 100% Geometry Preservation...');

  // 1. Process scene_interior_wide
  // Window area in wide interior:
  // x from 435 to 1640
  // y from 360 to 730
  // There are mullions at x ~ 500, 1000, 1150
  
  // We can sample pixels where color is outside daylight (blue sky / bright mountains)
  // Outside pixels have high brightness (R+G+B > 520) or high blue/cyan ratio (B > R + 20)
  
  const wideRaw = await sharp(wideDaySrc).raw().toBuffer({ resolveWithObject: true });
  const W = wideRaw.info.width;
  const H = wideRaw.info.height;

  // Prepare resized night sky (1672x941)
  const nightSkyBuf = await sharp(nightSkySrc)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const wideOut = Buffer.from(wideRaw.data);

  // Masking for Living Room Wide
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * wideRaw.info.channels;
      const r = wideRaw.data[idx];
      const g = wideRaw.data[idx + 1];
      const b = wideRaw.data[idx + 2];

      // Window bounding region: x between 420 and 1650, y between 365 and 735
      const inWindowBox = x > 425 && x < 1645 && y > 365 && y < 735;
      
      // Check if it's the outdoor landscape (bright sky, snow, green lake/trees, not dark wood frames)
      const isWoodFrame = (r > 60 && g < 45 && b < 30) || (r < 75 && g < 65 && b < 55);
      const isOutsideLandscape = inWindowBox && !isWoodFrame && (
        (r + g + b > 380) || 
        (b > 130 && b > r - 10) || 
        (g > 140 && g > r - 10)
      );

      const skyIdx = (y * W + x) * nightSkyBuf.info.channels;
      const skyR = nightSkyBuf.data[skyIdx];
      const skyG = nightSkyBuf.data[skyIdx + 1];
      const skyB = nightSkyBuf.data[skyIdx + 2];

      if (isOutsideLandscape) {
        // Blend with slight glass tint (85% night sky, 15% original reflection)
        wideOut[idx] = Math.round(skyR * 0.9 + r * 0.1);
        wideOut[idx + 1] = Math.round(skyG * 0.9 + g * 0.1);
        wideOut[idx + 2] = Math.round(skyB * 0.9 + b * 0.1);
      } else {
        // Interior chalet at night: warm, cozy, amber lighting from fireplace and ceiling lights
        // Lower cool daylight spill slightly, boost warm golden wood glow
        wideOut[idx] = Math.min(255, Math.round(r * 0.95 + 10)); // warm amber red
        wideOut[idx + 1] = Math.min(255, Math.round(g * 0.88 + 4));
        wideOut[idx + 2] = Math.max(0, Math.round(b * 0.78 - 5)); // cooler blue reduction for night warmth
      }
    }
  }

  const wideNightDest = 'D:/botly/App/prototypes/wellness-home/assets/scenes/scene_interior_wide_night.webp';
  await sharp(wideOut, { raw: { width: W, height: H, channels: wideRaw.info.channels } })
    .webp({ quality: 92 })
    .toFile(wideNightDest);
  console.log('Saved scene_interior_wide_night.webp');

  // Also save jpg for compatibility
  await sharp(wideOut, { raw: { width: W, height: H, channels: wideRaw.info.channels } })
    .jpeg({ quality: 92 })
    .toFile('D:/botly/App/prototypes/wellness-home/assets/scenes/scene_interior_wide_night.jpg');

  // 2. Process scene_bedroom
  const bedRaw = await sharp(bedDaySrc).raw().toBuffer({ resolveWithObject: true });
  const bedW = bedRaw.info.width;
  const bedH = bedRaw.info.height;

  const bedNightSky = await sharp(nightSkySrc)
    .resize(bedW, bedH, { fit: 'cover', position: 'top' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bedOut = Buffer.from(bedRaw.data);

  // Window region in Bedroom:
  // Windows are on the left and center-right:
  // Glass areas have bright sky/mountains (high brightness or blue)
  // Bed is at bottom-center (y > 450, x between 400 and 1200)
  // Ceiling is at top (y < 180)
  for (let y = 0; y < bedH; y++) {
    for (let x = 0; x < bedW; x++) {
      const idx = (y * bedW + x) * bedRaw.info.channels;
      const r = bedRaw.data[idx];
      const g = bedRaw.data[idx + 1];
      const b = bedRaw.data[idx + 2];

      const inWindowArea = (y > 150 && y < 650) && (
        (x > 140 && x < 400) || 
        (x > 450 && x < 1080)
      );

      const isFrame = (r < 90 && g < 75 && b < 60) || (r > 130 && r > g + 40);
      const isOutside = inWindowArea && !isFrame && (
        (r + g + b > 480) || 
        (b > 150 && b > r - 15) || 
        (g > 160 && g > r - 15)
      );

      const skyIdx = (y * bedW + x) * bedNightSky.info.channels;
      const skyR = bedNightSky.data[skyIdx];
      const skyG = bedNightSky.data[skyIdx + 1];
      const skyB = bedNightSky.data[skyIdx + 2];

      if (isOutside) {
        bedOut[idx] = Math.round(skyR * 0.92 + r * 0.08);
        bedOut[idx + 1] = Math.round(skyG * 0.92 + g * 0.08);
        bedOut[idx + 2] = Math.round(skyB * 0.92 + b * 0.08);
      } else {
        // Cozy bedroom night lighting
        bedOut[idx] = Math.min(255, Math.round(r * 0.94 + 8));
        bedOut[idx + 1] = Math.min(255, Math.round(g * 0.86 + 3));
        bedOut[idx + 2] = Math.max(0, Math.round(b * 0.76 - 6));
      }
    }
  }

  const bedNightDest = 'D:/botly/App/prototypes/wellness-home/assets/scenes/scene_bedroom_night.webp';
  await sharp(bedOut, { raw: { width: bedW, height: bedH, channels: bedRaw.info.channels } })
    .webp({ quality: 92 })
    .toFile(bedNightDest);
  console.log('Saved scene_bedroom_night.webp');

  await sharp(bedOut, { raw: { width: bedW, height: bedH, channels: bedRaw.info.channels } })
    .jpeg({ quality: 92 })
    .toFile('D:/botly/App/prototypes/wellness-home/assets/scenes/scene_bedroom_night.jpg');

  console.log('Night scenes generated with 100% identical geometry!');
}

generateNightScenes().catch(e => console.error(e));
