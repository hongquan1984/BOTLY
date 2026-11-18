import { chromium } from 'file:///D:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
import path from 'path';

const outputDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';

async function testEditor() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  console.log('Navigating to http://localhost:5179/village.html ...');
  await page.goto('http://localhost:5179/village.html', { waitUntil: 'networkidle', timeout: 30000 });

  await page.waitForFunction(() => window.villageReady === true, { timeout: 35000 });
  console.log('Village ready! Testing Sandbox Editor features...');

  // 1. Open Editor Panel
  console.log('Test 1: Opening Editor Panel...');
  await page.click('#btn-editor-toggle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'editor_01_open_panel.png') });

  // 2. Select Player Chalet and Scale up to 1.5x
  console.log('Test 2: Selecting Player Chalet & scaling to 1.50x...');
  await page.selectOption('#editor-entity-select', 'player_chalet');
  await page.click('#btn-editor-focus');
  await page.waitForTimeout(1200);
  await page.click('button[data-scale-set="1.5"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'editor_02_scale_up_chalet.png') });

  // 3. Move/Nudge the Chalet with D-pad and change rotation
  console.log('Test 3: Nudging position and rotating...');
  await page.click('button[data-step="1.0"]');
  await page.click('button[data-dir="north"]');
  await page.waitForTimeout(200);
  await page.click('button[data-dir="north"]');
  await page.waitForTimeout(200);
  await page.click('button[data-rot-delta="45"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'editor_03_move_and_rotate.png') });

  // 4. Select a Prop (Stone Well) and scale up
  console.log('Test 4: Selecting Stone Well prop & scaling to 1.8x...');
  await page.selectOption('#editor-entity-select', 'prop_village_well');
  await page.click('#btn-editor-focus');
  await page.waitForTimeout(1200);
  await page.click('button[data-scale-delta="0.1"]');
  await page.click('button[data-scale-delta="0.1"]');
  await page.click('button[data-scale-delta="0.1"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outputDir, 'editor_04_scale_prop_well.png') });

  // 5. Test Export JSON Modal
  console.log('Test 5: Testing Export JSON Modal...');
  await page.click('#btn-export-json');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, 'editor_05_export_json_modal.png') });

  console.log('All tests completed successfully!');
  await browser.close();
}

testEditor().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
