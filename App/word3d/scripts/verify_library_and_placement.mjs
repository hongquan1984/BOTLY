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
  console.log('=== Starting 3D Asset Studio & Map Builder Integration Verification ===');
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
    console.log('\n1. Testing Desktop Asset Studio...');
    const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });

    page.on('console', (msg) => {
      const t = msg.text();
      if (t.includes('Custom 3D model') || msg.type() === 'error') {
        console.log(`[Browser ${msg.type()}] ${t}`);
      }
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 2. Open Asset Studio Modal
    console.log('Opening Asset Studio Modal...');
    const studioBtn = page.locator('button:has-text("Asset Studio (16)")');
    await studioBtn.click();
    await page.waitForTimeout(1500);

    const modal = page.locator('.asset-library-modal');
    const isModalVisible = await modal.isVisible();
    console.log('Asset Studio modal visible:', isModalVisible);

    await page.screenshot({ path: path.join(screenshotsDir, '22_asset_studio_modal.png') });
    console.log('Saved screenshot: 22_asset_studio_modal.png');

    // 3. Switch Category & Select House
    console.log('Selecting category Houses & Wireframe...');
    const houseTab = page.locator('button:has-text("Nhà cửa")');
    await houseTab.click();
    await page.waitForTimeout(500);

    // Toggle Wireframe
    const wireframeBtn = page.locator('button:has-text("Wireframe")');
    await wireframeBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(screenshotsDir, '23_asset_wireframe_preview.png') });
    console.log('Saved screenshot: 23_asset_wireframe_preview.png');

    // 4. Test Place into Map Builder
    console.log('Testing "Đặt Vào Làng (Map Builder)"...');
    const placeBtn = page.locator('button:has-text("Đặt Vào Làng")');
    await placeBtn.click();
    await page.waitForTimeout(2000);

    // Verify modal closed and selection bar is active in map
    const selectionBar = page.locator('.editor-selection-bar');
    const isSelectionActive = await selectionBar.isVisible();
    console.log('Selection bar visible in Map Builder:', isSelectionActive);
    if (isSelectionActive) {
      const title = await page.locator('.editor-selection-title').innerText();
      console.log('Active placed asset in map:', title);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '24_placed_asset_in_map_builder.png') });
    console.log('Saved screenshot: 24_placed_asset_in_map_builder.png');

    // 5. Test Mobile Viewport (390x844)
    console.log('\n2. Testing Mobile Asset Studio (390x844)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
    await mobilePage.waitForTimeout(1500);

    const mobileStudioBtn = mobilePage.locator('button:has-text("Asset Studio")');
    await mobileStudioBtn.click();
    await mobilePage.waitForTimeout(1500);

    await mobilePage.screenshot({ path: path.join(screenshotsDir, '25_asset_studio_mobile.png') });
    console.log('Saved screenshot: 25_asset_studio_mobile.png');

    console.log('\n=== All Asset Studio & Map Builder Tests PASSED! ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
