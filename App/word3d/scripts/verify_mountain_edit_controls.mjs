import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING HEADWATER MOUNTAIN EDIT & SCALE CONTROLS ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Click "Edit Map" button
  console.log('Clicking Edit Map button...');
  const editMapBtn = page.locator('button:has-text("Edit Map")');
  await editMapBtn.click();
  await page.waitForTimeout(1000);

  // 2. Click on the Mountain Peak at (805, 290) - clearly below the top menu bar (Y > 240)
  console.log('Clicking on Headwater Mountain peak at (805, 290)...');
  await page.mouse.click(805, 290);
  await page.waitForTimeout(1000);

  // Verify what object is selected in the bottom toolbar
  const selectedName = await page.evaluate(() => {
    const bottomBar = document.querySelector('.editor-floating-toolbar');
    return bottomBar ? bottomBar.innerText : '';
  });
  console.log('Selected Toolbar Text:', selectedName);

  // Screenshot of selected mountain
  const ssSelected = path.join(ARTIFACT_DIR, '56_headwater_mountain_selected.png');
  await page.screenshot({ path: ssSelected });
  console.log('Saved Screenshot: 56_headwater_mountain_selected.png');

  // If selectedName contains "Headwater Mountain" or "Mountain", test scale
  const scaleUpBtn = page.locator('button[title*="Phóng to"]');
  if (await scaleUpBtn.isVisible()) {
    console.log('Clicking Scale Up 3 times (+30%)...');
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
  } else {
    console.warn('Scale up button not visible yet!');
  }

  // Screenshot after scaling
  const ssScaled = path.join(ARTIFACT_DIR, '57_headwater_mountain_scaled_and_elevated.png');
  await page.screenshot({ path: ssScaled });
  console.log('Saved Screenshot: 57_headwater_mountain_scaled_and_elevated.png');

  // Test Dragging mountain
  console.log('Testing dragging mountain...');
  await page.mouse.move(805, 290);
  await page.mouse.down();
  await page.mouse.move(850, 310, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const ssMoved = path.join(ARTIFACT_DIR, '58_headwater_mountain_dragged.png');
  await page.screenshot({ path: ssMoved });
  console.log('Saved Screenshot: 58_headwater_mountain_dragged.png');

  await browser.close();
  console.log('=== TEST COMPLETED ===');
}

run().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
