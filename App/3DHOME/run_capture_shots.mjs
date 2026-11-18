import { chromium } from 'file:///D:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
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

  // Guarantee: Wait for all 10 buildings and props to be fully parsed and loaded
  console.log('Waiting for window.villageReady === true ...');
  await page.waitForFunction(() => window.villageReady === true, { timeout: 40000 });
  console.log('Village ready! Waiting 1500ms for final render frames...');
  await page.waitForTimeout(1500);

  // 1. Overview: Entire horseshoe village with all 10 chalets & 2.5D Alps backdrop
  console.log('Capturing 01_village_overview_iso.png ...');
  await page.screenshot({ path: path.join(outputDir, '01_village_overview_iso.png') });

  // 2. Archway Gate View
  console.log('Capturing 02_village_archway_gate.png ...');
  await page.click('#btn-view-archway');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outputDir, '02_village_archway_gate.png') });

  // 3. Central Fountain & Well View
  console.log('Capturing 03_village_central_fountain.png ...');
  await page.click('#btn-view-fountain');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outputDir, '03_village_central_fountain.png') });

  // 4. Lake Overlook View (Northern 2.5D panoramic depth with Iseltwald lakeside village)
  console.log('Capturing 04_village_lake_overlook.png ...');
  await page.click('#btn-view-overlook');
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outputDir, '04_village_lake_overlook.png') });

  // 5. Character View & Walk in Plaza
  console.log('Capturing 05_village_character_walk.png ...');
  await page.click('#btn-view-character');
  await page.waitForTimeout(1200);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2600);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '05_village_character_walk.png') });

  // 6. Inspect West Flank (Greenhouse, Apothecary, Forge, Market Stand)
  console.log('Capturing 06_village_west_flank_chalets.png ...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(1080, 450, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '06_village_west_flank_chalets.png') });

  // 7. Inspect East Flank (Alpine Inn, Sleep Sanctuary, Knowledge Library, Bell Tower)
  console.log('Capturing 07_village_east_flank_chalets.png ...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(240, 450, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '07_village_east_flank_chalets.png') });

  // 8. PROXIMITY TEST: Teleport character right to Traditional Herbal Apothecary door & porch
  console.log('Capturing 08_character_at_chalet_door.png ...');
  await page.evaluate(() => {
    window.teleportPlayer(-20.5, 3.5, Math.PI * 0.5);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '08_character_at_chalet_door.png') });

  // 9. PROXIMITY TEST: Teleport character right to Botanical Greenhouse entrance
  console.log('Capturing 09_character_at_greenhouse.png ...');
  await page.evaluate(() => {
    window.teleportPlayer(-17.5, -9.5, Math.PI * 0.42);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '09_character_at_greenhouse.png') });

  // 10. 360-DEGREE ROTATION TEST: Character looks South towards Archway & Southern Alpine Mountains
  // Verifies that the entire southern / southeastern hemisphere is filled with lush pine mountains (NO WHITE VOID!)
  console.log('Capturing 10_character_looking_south_360.png ...');
  await page.evaluate(() => {
    window.teleportPlayer(0.0, 5.0, 0.0); // Stand near fountain
    window.setCharCamYaw(Math.PI); // Directly face South towards Archway and southern Alps mountains
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outputDir, '10_character_looking_south_360.png') });

  await browser.close();
  console.log('All 10 village screenshots captured successfully in ' + outputDir);
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
