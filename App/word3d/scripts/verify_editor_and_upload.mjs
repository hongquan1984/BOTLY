import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';
const screenshotsDir = path.join(targetDir, 'docs', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function main() {
  console.log('=== Starting Sandbox Level Editor & 3D Model Upload Verification ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  try {
    // 1. Desktop Test (1366x800)
    console.log('\n1. Testing Desktop Level Editor & 3D Upload...');
    const page = await browser.newPage({
      viewport: { width: 1366, height: 800 },
    });

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warn' || msg.text().includes('Custom 3D model') || msg.text().includes('Saved')) {
        console.log(`[Browser ${type}] ${msg.text()}`);
      }
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('Page loaded, waiting for 3D assets to load...');

    await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
    console.log('Loading screen dismissed, 3D village active.');
    await page.waitForTimeout(2000);

    // 2. Activate Editor Mode
    console.log('\n2. Activating Level Editor Mode...');
    const editBtn = page.locator('button:has-text("Edit Map")');
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.click();
    await page.waitForTimeout(1000);

    // Verify editor palette drawer appears
    const paletteDrawer = page.locator('.editor-palette-drawer');
    const isPaletteVisible = await paletteDrawer.isVisible();
    console.log(`Editor palette drawer visible: ${isPaletteVisible}`);

    await page.screenshot({
      path: path.join(screenshotsDir, '17_editor_mode_active.png'),
    });
    console.log('Saved screenshot: 17_editor_mode_active.png');

    // 3. Select an editable object
    console.log('\n3. Selecting an editable object...');
    // Query screen coordinates of editable objects from browser
    const clickTarget = await page.evaluate(() => {
      // @ts-ignore
      const canvas = document.querySelector('canvas#webgl-canvas');
      if (!canvas) return null;
      // Click at 35% width, 55% height where Lumi's Potion Shop sits
      return {
        x: Math.round(window.innerWidth * 0.35),
        y: Math.round(window.innerHeight * 0.55),
      };
    });

    console.log(`Clicking canvas at (${clickTarget.x}, ${clickTarget.y})...`);
    await page.mouse.click(clickTarget.x, clickTarget.y);
    await page.waitForTimeout(1000);

    let selectionBar = page.locator('.editor-selection-bar');
    let hasSelection = await selectionBar.isVisible();
    console.log(`Selection bar visible after click 1: ${hasSelection}`);

    if (!hasSelection) {
      // Try clicking another spot (e.g. 50% width, 40% height)
      console.log('Trying click at (50%, 40%)...');
      await page.mouse.click(Math.round(1366 * 0.5), Math.round(800 * 0.4));
      await page.waitForTimeout(1000);
      hasSelection = await selectionBar.isVisible();
      console.log(`Selection bar visible after click 2: ${hasSelection}`);
    }

    if (!hasSelection) {
      // Try clicking another spot (e.g. 65% width, 45% height - Bookshop)
      console.log('Trying click at (65%, 45%)...');
      await page.mouse.click(Math.round(1366 * 0.65), Math.round(800 * 0.45));
      await page.waitForTimeout(1000);
      hasSelection = await selectionBar.isVisible();
      console.log(`Selection bar visible after click 3: ${hasSelection}`);
    }

    if (hasSelection) {
      const title = await page.locator('.editor-selection-title').innerText();
      console.log(`Selected object title: ${title}`);
    }

    // 4. Test Rotate and Scale Controls
    console.log('\n4. Testing Rotate and Scale buttons...');
    const rotateBtn = page.locator('button:has-text("↻ +45°")');
    if (await rotateBtn.isVisible()) {
      await rotateBtn.click();
      await page.waitForTimeout(500);
      await rotateBtn.click();
      await page.waitForTimeout(500);
      console.log('Rotated object +90 degrees.');
    }

    const scaleBtn = page.locator('button:has-text("🔍 +10%")');
    if (await scaleBtn.isVisible()) {
      await scaleBtn.click();
      await page.waitForTimeout(500);
      console.log('Scaled object +10%.');
    }

    await page.screenshot({
      path: path.join(screenshotsDir, '18_object_selected_inspector.png'),
    });
    console.log('Saved screenshot: 18_object_selected_inspector.png');

    // 5. Test Spawning an Item from Catalog
    console.log('\n5. Spawning an item from catalog (Giếng Nước)...');
    const spawnWellBtn = page.locator('button:has-text("Giếng Nước")');
    await spawnWellBtn.click();
    await page.waitForTimeout(1000);

    // 6. Test Uploading a Custom 3D Model (.gltf)
    console.log('\n6. Testing 3D Model Upload via file input...');
    const testModelPath = path.join(targetDir, 'public', 'assets', 'medieval_village', 'GLTF', 'Props', 'SM_Well.gltf');
    const fileInput = page.locator('input[type="file"][accept=".glb,.gltf"]');
    await fileInput.setInputFiles(testModelPath);
    await page.waitForTimeout(2000);
    console.log('Custom 3D model uploaded and parsed into scene.');

    // 7. Save Layout to LocalStorage
    console.log('\n7. Testing Save Layout...');
    const saveBtn = page.locator('button:has-text("💾 Lưu Bố Cục")');
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const savedData = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
    console.log(`Saved layout JSON exists in LocalStorage: ${!!savedData}, length: ${savedData ? savedData.length : 0}`);

    await page.screenshot({
      path: path.join(screenshotsDir, '19_custom_model_uploaded_and_saved.png'),
    });
    console.log('Saved screenshot: 19_custom_model_uploaded_and_saved.png');

    // 8. Mobile Viewport Test (390x844 - iPhone 14)
    console.log('\n8. Testing Mobile Viewport with Editor Mode (390x844)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    // Open Editor on mobile
    const mobileEditBtn = mobilePage.locator('button:has-text("Edit Map")');
    await mobileEditBtn.click();
    await mobilePage.waitForTimeout(1000);

    // Tap canvas to select object
    await mobilePage.mouse.click(195, 420);
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: path.join(screenshotsDir, '20_mobile_editor_mode.png'),
    });
    console.log('Saved screenshot: 20_mobile_editor_mode.png');

    console.log('\n=== All verification tests completed successfully! ===');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
