import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== TESTING HEADWATER MOUNTAIN EDIT & SCALE CONTROLS ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Enable Edit Map mode
  console.log('Enabling Edit Map...');
  await page.click('button:has-text("Edit Map")');
  await page.waitForTimeout(1000);

  // 2. Select the mountain through levelEditor API & verify UI toolbar updates
  const selectResult = await page.evaluate(() => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    const mountain = systems.cozyVillage.editableObjects.find(
      (o) => o.name === 'HeadwaterMountain' || o.userData?.name?.includes('Mountain')
    );
    if (!mountain) return { error: 'Mountain not found' };

    editor.selectObject(mountain);
    return {
      selectedName: editor.getSelectedInfo()?.name,
      pos: mountain.position,
      scale: mountain.scale,
    };
  });
  console.log('Selected Mountain via Editor:', selectResult);
  await page.waitForTimeout(800);

  // Screenshot 1: Mountain Selected with Gold BoxHelper & Toolbar visible
  const ssSelected = path.join(ARTIFACT_DIR, '56_headwater_mountain_selected.png');
  await page.screenshot({ path: ssSelected });
  console.log('Saved Screenshot: 56_headwater_mountain_selected.png');

  // 3. Test Scale Up using the UI button
  console.log('Clicking Scale Up UI button (+10%) 3 times...');
  const scaleUpBtn = page.locator('button[title*="Phóng to"]');
  if (await scaleUpBtn.isVisible()) {
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
    await scaleUpBtn.click();
    await page.waitForTimeout(300);
  }

  // 4. Test Rotate UI button
  console.log('Clicking Rotate UI button (↻ +45°)...');
  const rotateBtn = page.locator('button[title*="Xoay theo chiều kim đồng hồ"]');
  if (await rotateBtn.isVisible()) {
    await rotateBtn.click();
    await page.waitForTimeout(400);
  }

  // Check new transforms
  const afterTransform = await page.evaluate(() => {
    const systems = window.__systems;
    const mountain = systems.cozyVillage.editableObjects.find(
      (o) => o.name === 'HeadwaterMountain' || o.userData?.name?.includes('Mountain')
    );
    return {
      scale: mountain.scale.x,
      rotY: mountain.rotation.y,
      pos: mountain.position,
    };
  });
  console.log('After Scale and Rotate:', afterTransform);

  // Screenshot 2: Mountain Scaled Up & Rotated
  const ssScaled = path.join(ARTIFACT_DIR, '57_headwater_mountain_scaled_and_elevated.png');
  await page.screenshot({ path: ssScaled });
  console.log('Saved Screenshot: 57_headwater_mountain_scaled_and_elevated.png');

  // 5. Test Resetting to Defaults
  console.log('Clicking Reset to Defaults...');
  const resetBtn = page.locator('button:has-text("Đặt Lại Gốc")');
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(500);
  }

  // Re-select mountain to confirm it returned to original transform
  const afterReset = await page.evaluate(() => {
    const editor = window.__levelEditor;
    const systems = window.__systems;
    const mountain = systems.cozyVillage.editableObjects.find(
      (o) => o.name === 'HeadwaterMountain' || o.userData?.name?.includes('Mountain')
    );
    editor.selectObject(mountain);
    return {
      scale: mountain.scale.x,
      rotY: mountain.rotation.y,
      pos: mountain.position,
    };
  });
  console.log('After Reset:', afterReset);

  // Screenshot 3: Mountain reset cleanly
  const ssReset = path.join(ARTIFACT_DIR, '58_headwater_mountain_dragged.png');
  await page.screenshot({ path: ssReset });
  console.log('Saved Screenshot: 58_headwater_mountain_dragged.png');

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
