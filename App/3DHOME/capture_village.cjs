const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  console.log('Launching Chrome for 3D Village visual verification...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5179/village.html ...');
  await page.goto('http://localhost:5179/village.html', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait 4 seconds for GLB models to parse and load into the Three.js scene
  console.log('Waiting for 3D models and textures to settle...');
  await page.waitForTimeout(4500);

  // 1. Overview
  console.log('Capturing 01_village_overview_iso.png ...');
  await page.screenshot({ path: path.join(outputDir, '01_village_overview_iso.png') });

  // 2. Archway Gate View
  console.log('Switching to Archway Gate view...');
  await page.click('#btn-mode-archway');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outputDir, '02_village_archway_gate.png') });

  // 3. Central Fountain & Well View
  console.log('Switching to Central Fountain view...');
  await page.click('#btn-mode-fountain');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outputDir, '03_village_central_fountain.png') });

  // 4. Lake Overlook View (Northern 2.5D panoramic depth)
  console.log('Switching to Lake Overlook view...');
  await page.click('#btn-mode-overlook');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outputDir, '04_village_lake_overlook.png') });

  // 5. Character View & Walk Close to Chalets
  console.log('Switching to Character View and moving forward...');
  await page.click('#btn-mode-character');
  await page.waitForTimeout(1000);
  // Press W key to walk character into the village square up close
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, '05_village_character_walk.png') });

  // 6. Rotate camera to inspect West Flank (Greenhouse & Apothecary)
  console.log('Rotating camera to inspect West Flank chalets...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(960, 450, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '06_village_west_flank_chalets.png') });

  // 7. Rotate camera to inspect East Flank (Alpine Inn & Sleep Sanctuary)
  console.log('Rotating camera to inspect East Flank chalets...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(240, 450, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '07_village_east_flank_chalets.png') });

  await browser.close();
  console.log('All screenshots captured successfully in ' + outputDir);
})();
