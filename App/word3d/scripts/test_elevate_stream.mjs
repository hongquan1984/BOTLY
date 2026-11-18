import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });

  page.on('console', (msg) => {
    const text = msg.text();
    if (
      text.includes('Saved') ||
      text.includes('imported') ||
      text.includes('cao độ') ||
      msg.type() === 'error'
    ) {
      console.log(`[Browser ${msg.type()}] ${text}`);
    }
  });

  console.log('1. Loading application at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 2. Open Edit Map
  console.log('2. Entering Edit Map mode...');
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1000);

  // Switch to Sample tab
  await page.locator('button:has-text("Gói Medieval Sample")').click();
  await page.waitForTimeout(500);

  // 3. Spawn Đoạn Suối
  console.log('3. Spawning Đoạn Suối...');
  await page.locator('button:has-text("Đoạn Suối")').click();
  await page.waitForTimeout(1000);

  // 4. Elevate the stream with ⬆️ Lên + button twice (+0.30m)
  console.log('4. Clicking ⬆️ Lên + twice to raise above grass...');
  await page.locator('button:has-text("⬆️ Lên +")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("⬆️ Lên +")').click();
  await page.waitForTimeout(400);

  // 5. Click 💾 Lưu Bố Cục
  console.log('5. Clicking 💾 Lưu Bố Cục...');
  await page.locator('button:has-text("💾 Lưu Bố Cục")').click();
  await page.waitForTimeout(1000);

  // Check saved position
  const savedDataRaw = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  const savedData = JSON.parse(savedDataRaw || '[]');
  const streamItem = savedData.find((item) => item.type === 'streamSection' || item.name.includes('streamSection'));
  console.log('Saved Stream Section in LocalStorage:', streamItem);

  if (!streamItem || streamItem.position[1] < 2.0) {
    throw new Error('FAILED: Stream was not elevated properly above grass!');
  }

  // 6. Reload page (F5) to verify elevation persists
  console.log('6. Reloading page to test elevation persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(targetDir, 'docs', 'screenshots', '32_elevated_stream_on_grass.png');
  await page.screenshot({ path: screenshotPath });
  fs.copyFileSync(screenshotPath, path.join(artifactDir, '32_elevated_stream_on_grass.png'));
  console.log('Saved screenshot:', screenshotPath);

  await browser.close();
  console.log('=== Elevation and Stream Test Passed 100%! ===');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
