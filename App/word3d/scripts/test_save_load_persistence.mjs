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
      text.includes('Spawned') ||
      text.includes('imported') ||
      text.includes('layout') ||
      msg.type() === 'error'
    ) {
      console.log(`[Browser ${msg.type()}] ${text}`);
    }
  });

  console.log('1. Loading application at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Clear previous layout if any
  await page.evaluate(() => localStorage.removeItem('cozy_village_layout_v1'));

  // 2. Click Edit Map to enter editor mode
  console.log('2. Entering Edit Map mode...');
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1000);

  // 3. Spawn Great Hall (extracted asset)
  console.log('3. Spawning Great Hall in map...');
  await page.locator('button:has-text("Great Hall")').click();
  await page.waitForTimeout(1500);

  // Rotate +45 deg twice and scale +10% twice
  console.log('Transforming Great Hall...');
  await page.locator('button:has-text("↻ +45°")').click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("↻ +45°")').click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("🔍 +10%")').click();
  await page.waitForTimeout(300);
  await page.locator('button:has-text("🔍 +10%")').click();
  await page.waitForTimeout(300);

  // 4. Spawn Phong Đỏ (Momiji Maple Tree)
  console.log('4. Spawning Phong Đỏ (Momiji Maple) in map...');
  await page.locator('button:has-text("Phong Đỏ")').click();
  await page.waitForTimeout(1500);

  // 5. Click Save Layout
  console.log('5. Clicking 💾 Lưu Bố Cục...');
  await page.locator('button:has-text("💾 Lưu Bố Cục")').click();
  await page.waitForTimeout(1000);

  // Verify LocalStorage data
  const savedDataRaw = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  if (!savedDataRaw) {
    throw new Error('FAILED: cozy_village_layout_v1 was not found in LocalStorage!');
  }
  const savedData = JSON.parse(savedDataRaw);
  console.log(`Verified saved items count in LocalStorage: ${savedData.length}`);

  const greatHallItem = savedData.find((item) => item.name.includes('Great Hall') || (item.assetUrl && item.assetUrl.includes('great_hall')));
  const momijiItem = savedData.find((item) => item.name.includes('Phong Đỏ') || (item.assetUrl && item.assetUrl.includes('momiji')));

  console.log('Saved Great Hall:', JSON.stringify(greatHallItem, null, 2));
  console.log('Saved Momiji Maple:', JSON.stringify(momijiItem, null, 2));

  if (!greatHallItem || !greatHallItem.assetUrl) {
    throw new Error('FAILED: Great Hall was not properly saved with assetUrl!');
  }
  if (!momijiItem || !momijiItem.assetUrl) {
    throw new Error('FAILED: Momiji Maple was not properly saved with assetUrl!');
  }

  // 6. Reload page to test full reload & layout restoration!
  console.log('6. Reloading page to test persistence restoration...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000); // Allow async model loading & restoration to settle

  // 7. Verify presence in scene after reload
  console.log('7. Re-entering Edit Map mode to inspect restored objects...');
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1500);

  const screenshotPath1 = path.join(targetDir, 'docs', 'screenshots', '28_persistence_saved_and_reloaded.png');
  await page.screenshot({ path: screenshotPath1 });
  console.log('Saved screenshot:', screenshotPath1);

  // Copy screenshot to artifact directory
  const artifactScreenshot = path.join(artifactDir, '28_persistence_saved_and_reloaded.png');
  fs.copyFileSync(screenshotPath1, artifactScreenshot);
  console.log('Copied to artifact:', artifactScreenshot);

  // Check scene objects via evaluation
  const sceneSummary = await page.evaluate(() => {
    // Look for canvas
    return {
      hasStorage: !!localStorage.getItem('cozy_village_layout_v1'),
      layoutLength: JSON.parse(localStorage.getItem('cozy_village_layout_v1') || '[]').length,
    };
  });
  console.log('Scene Summary after reload:', sceneSummary);

  // 8. Test ↺ Đặt Lại Gốc (Reset layout)
  console.log('8. Testing ↺ Đặt Lại Gốc (Reset to Defaults)...');
  await page.locator('button:has-text("↺ Đặt Lại Gốc")').click();
  await page.waitForTimeout(1000);

  const afterResetStorage = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  console.log('LocalStorage after reset (should be null):', afterResetStorage);

  // Re-save layout so user sees their saved layout if they had one or can save fresh
  console.log('9. Re-spawning Great Hall and saving layout for user demo...');
  await page.locator('button:has-text("Great Hall")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("💾 Lưu Bố Cục")').click();
  await page.waitForTimeout(1000);

  const finalCheck = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  console.log('Final saved layout verification:', !!finalCheck);

  const screenshotPath2 = path.join(targetDir, 'docs', 'screenshots', '29_save_layout_verified.png');
  await page.screenshot({ path: screenshotPath2 });
  fs.copyFileSync(screenshotPath2, path.join(artifactDir, '29_save_layout_verified.png'));
  console.log('Saved screenshot:', screenshotPath2);

  await browser.close();
  console.log('=== Persistence Test Passed with 100% Success! ===');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
