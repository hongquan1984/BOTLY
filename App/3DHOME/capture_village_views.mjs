import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';
const repoOutDir = 'D:/botly/App/3DHOME/reports/shots';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(repoOutDir)) fs.mkdirSync(repoOutDir, { recursive: true });

async function run() {
  console.log('Launching installed Chrome with WebGL...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5179/village.html...');
  await page.goto('http://localhost:5179/village.html', { waitUntil: 'networkidle' });

  // Wait 4s for textures, PBR and backdrop to render smoothly
  await page.waitForTimeout(4000);

  // 1. Overview Isometric View
  console.log('Capturing View 1: Overview Isometric...');
  await page.screenshot({ path: path.join(outDir, '01_village_overview_iso.png') });
  await page.screenshot({ path: path.join(repoOutDir, '01_village_overview_iso.png') });

  // 2. Archway Gate View
  console.log('Capturing View 2: Archway Gate...');
  await page.click('#btn-view-archway');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, '02_village_archway_gate.png') });
  await page.screenshot({ path: path.join(repoOutDir, '02_village_archway_gate.png') });

  // 3. Central Fountain View
  console.log('Capturing View 3: Central Fountain...');
  await page.click('#btn-view-fountain');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, '03_village_central_fountain.png') });
  await page.screenshot({ path: path.join(repoOutDir, '03_village_central_fountain.png') });

  // 4. Lake Overlook View
  console.log('Capturing View 4: Lake Overlook...');
  await page.click('#btn-view-overlook');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, '04_village_lake_overlook.png') });
  await page.screenshot({ path: path.join(repoOutDir, '04_village_lake_overlook.png') });

  // 5. Character Follow & Walk View
  console.log('Capturing View 5: Character Walking on Plaza...');
  await page.click('#btn-view-character');
  await page.waitForTimeout(1000);
  // Walk forward
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1800);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '05_village_character_walk.png') });
  await page.screenshot({ path: path.join(repoOutDir, '05_village_character_walk.png') });

  // 6. Mobile Portrait View
  console.log('Capturing View 6: Mobile Portrait Viewport...');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.click('#btn-reset-view');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, '06_village_mobile_overview.png') });
  await page.screenshot({ path: path.join(repoOutDir, '06_village_mobile_overview.png') });

  console.log('All shots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
