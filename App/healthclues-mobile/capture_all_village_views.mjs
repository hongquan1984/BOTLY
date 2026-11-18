import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const outputDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching Chrome for 3D Village capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5179/village.html ...');
  await page.goto('http://localhost:5179/village.html', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait 4.5 seconds for all 10 GLTF models, props, and textures to load into scene
  console.log('Waiting for 3D models and textures to settle...');
  await page.waitForTimeout(5000);

  // 1. Overview
  console.log('Capturing 01_village_overview_iso.png ...');
  await page.screenshot({ path: path.join(outputDir, '01_village_overview_iso.png') });

  // 2. Archway Gate View
  console.log('Capturing 02_village_archway_gate.png ...');
  await page.click('#btn-mode-archway');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '02_village_archway_gate.png') });

  // 3. Central Fountain & Well View
  console.log('Capturing 03_village_central_fountain.png ...');
  await page.click('#btn-mode-fountain');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '03_village_central_fountain.png') });

  // 4. Lake Overlook View (Northern 2.5D panoramic depth)
  console.log('Capturing 04_village_lake_overlook.png ...');
  await page.click('#btn-mode-overlook');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '04_village_lake_overlook.png') });

  // 5. Character View & Walk Close to Chalets
  console.log('Capturing 05_village_character_walk.png ...');
  await page.click('#btn-mode-character');
  await page.waitForTimeout(1000);
  // Walk character forward towards chalets
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '05_village_character_walk.png') });

  // 6. Turn left to inspect West Flank (Greenhouse & Apothecary)
  console.log('Capturing 06_village_west_flank_chalets.png ...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(1050, 450, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '06_village_west_flank_chalets.png') });

  // 7. Turn right to inspect East Flank (Alpine Inn & Tavern)
  console.log('Capturing 07_village_east_flank_chalets.png ...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(250, 450, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '07_village_east_flank_chalets.png') });

  // 8. Also capture iPhone Simulator view
  console.log('Capturing 08_iphone_simulator_view.png ...');
  await page.goto('http://localhost:8081/iphone.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.click('#route-village');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(outputDir, '08_iphone_simulator_view.png') });

  await browser.close();
  console.log('All village screenshots captured successfully in ' + outputDir);
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
