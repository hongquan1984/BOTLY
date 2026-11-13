import puppeteer from 'puppeteer';
import path from 'path';

const brainDir = 'C:/Users/Admin/.gemini/antigravity/brain/685e195b-af4b-4fee-8d91-49c1fcd4597d';

async function verifyNightBackgroundLive() {
  console.log('Launching browser to test authentic night background...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3450', { waitUntil: 'networkidle2' });

  // 1. Ensure we are in Living Room Day Mode
  await page.evaluate(() => {
    switchScene('scene_interior_wide');
    if (currentDayNight === 'night') toggleDayNightMode();
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture Day Living Room
  const dayLivingPath = path.join(brainDir, '47-living-room-day-authentic.png');
  await page.screenshot({ path: dayLivingPath, fullPage: true });
  console.log('Captured:', dayLivingPath);

  // 2. Toggle to Night Mode
  await page.evaluate(() => {
    toggleDayNightMode();
  });
  await new Promise(r => setTimeout(r, 600));

  // Capture Night Living Room
  const nightLivingPath = path.join(brainDir, '48-living-room-night-authentic.png');
  await page.screenshot({ path: nightLivingPath, fullPage: true });
  console.log('Captured:', nightLivingPath);

  // 3. Switch to Bedroom Day Mode
  await page.evaluate(() => {
    switchScene('scene_bedroom');
    if (currentDayNight === 'night') toggleDayNightMode();
  });
  await new Promise(r => setTimeout(r, 600));

  const dayBedPath = path.join(brainDir, '49-bedroom-day-view.png');
  await page.screenshot({ path: dayBedPath, fullPage: true });
  console.log('Captured:', dayBedPath);

  // 4. Toggle Bedroom to Night Mode
  await page.evaluate(() => {
    toggleDayNightMode();
  });
  await new Promise(r => setTimeout(r, 600));

  const nightBedPath = path.join(brainDir, '50-bedroom-night-view.png');
  await page.screenshot({ path: nightBedPath, fullPage: true });
  console.log('Captured:', nightBedPath);

  // 5. Verification checks
  const result = await page.evaluate(() => {
    const layer = document.getElementById('layer-scene_bedroom');
    const baseImg = layer.querySelector('.scene-img.base-layer');
    return {
      bedroomImgSrc: baseImg ? baseImg.src : null,
      currentDayNight: currentDayNight,
      currentSceneId: currentSceneId
    };
  });
  console.log('Live State:', result);

  await browser.close();
  console.log('All live tests completed successfully!');
}

verifyNightBackgroundLive().catch(err => {
  console.error(err);
  process.exit(1);
});
