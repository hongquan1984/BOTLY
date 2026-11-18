import { chromium } from 'file:///D:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
import path from 'path';

const outputDir = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/village_3d_shots';

async function testPlannerZoom() {
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
  console.log('Village ready! Testing Planner View & Wide Zoom features...');

  // 1. Open Editor Panel (which now automatically activates Planner Top-Down View)
  console.log('Test 1: Opening Editor Panel & activating Planner View...');
  await page.click('#btn-editor-toggle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, 'zoom_01_planner_topdown_view.png') });

  // 2. Zoom Out to Maximum Wide Overview
  console.log('Test 2: Zooming out camera further to maximum wide overview (dist ~90m)...');
  await page.click('#btn-cam-zoom-out');
  await page.waitForTimeout(400);
  await page.click('#btn-cam-zoom-out');
  await page.waitForTimeout(400);
  await page.click('#btn-cam-zoom-out');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, 'zoom_02_max_wide_zoom_out.png') });

  // 3. Zoom In & Focus on Selected Building (e.g. windmill or personal chalet)
  console.log('Test 3: Selecting Alpine Mill and zooming in...');
  await page.selectOption('#editor-entity-select', 'alpine_mill');
  await page.click('#btn-editor-focus');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, 'zoom_03_zoom_in_to_building.png') });

  // 4. Return to Planner View and test wheel zoom
  console.log('Test 4: Back to Planner View via top tab button...');
  await page.click('#btn-view-planner');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, 'zoom_04_planner_tab_view.png') });

  console.log('All planner zoom tests completed successfully!');
  await browser.close();
}

testPlannerZoom().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
