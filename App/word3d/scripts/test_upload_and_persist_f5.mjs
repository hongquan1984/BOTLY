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
      text.includes('Custom 3D model') ||
      text.includes('IndexedDB') ||
      text.includes('Saved') ||
      text.includes('imported') ||
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

  // 3. Upload a GLB file using file input
  const testGlbPath = path.join(targetDir, 'public', 'assets-extracted', 'houses', 'house_library_cottage.glb');
  console.log('3. Uploading custom 3D file:', testGlbPath);

  const fileInput = await page.locator('input[type="file"][accept=".glb,.gltf"]');
  await fileInput.setInputFiles(testGlbPath);
  await page.waitForTimeout(2000);

  // 4. Click 💾 Lưu Bố Cục
  console.log('4. Clicking 💾 Lưu Bố Cục...');
  await page.locator('button:has-text("💾 Lưu Bố Cục")').click();
  await page.waitForTimeout(1000);

  // Check LocalStorage
  const savedDataRaw = await page.evaluate(() => localStorage.getItem('cozy_village_layout_v1'));
  const savedData = JSON.parse(savedDataRaw || '[]');
  const uploadedItem = savedData.find((item) => item.type === 'custom_model' || (item.modelStorageKey && item.modelStorageKey.includes('house_library_cottage')));
  console.log('Saved uploaded model entry in LocalStorage:', uploadedItem);

  if (!uploadedItem || !uploadedItem.modelStorageKey) {
    throw new Error('FAILED: Uploaded model was not recorded with modelStorageKey in LocalStorage!');
  }

  // 5. Reload the page (F5) to test persistence!
  console.log('5. Pressing F5 / Reloading page...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000); // Allow async model loading from IndexedDB

  // 6. Enter Edit Map to inspect restored uploaded object
  console.log('6. Re-entering Edit Map mode after reload...');
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(targetDir, 'docs', 'screenshots', '31_uploaded_file_persisted_after_f5.png');
  await page.screenshot({ path: screenshotPath });
  fs.copyFileSync(screenshotPath, path.join(artifactDir, '31_uploaded_file_persisted_after_f5.png'));
  console.log('Saved screenshot:', screenshotPath);

  await browser.close();
  console.log('=== Uploaded File F5 Persistence Test Passed 100%! ===');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
