import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';

async function main() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  
  page.on('console', (msg) => {
    if (msg.text().includes('Spawned') || msg.text().includes('Custom 3D model') || msg.type() === 'error') {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click Edit Map
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1000);

  // Screenshot 1: Drawer showing 16 extracted assets buttons
  const p1 = path.join(targetDir, 'docs', 'screenshots', '26_extracted_assets_spawn_bar.png');
  await page.screenshot({ path: p1 });
  console.log('Saved:', p1);

  // Click Great Hall button directly in the palette
  console.log('Clicking Great Hall in palette...');
  await page.locator('button:has-text("Great Hall")').click();
  await page.waitForTimeout(1500);

  // Click Momiji Maple button in the palette
  console.log('Clicking Phong Đỏ in palette...');
  await page.locator('button:has-text("Phong Đỏ")').click();
  await page.waitForTimeout(1500);

  // Screenshot 2: Both assets spawned and selectable on the village map
  const p2 = path.join(targetDir, 'docs', 'screenshots', '27_direct_spawned_in_map.png');
  await page.screenshot({ path: p2 });
  console.log('Saved:', p2);

  await browser.close();
  console.log('=== Direct spawn test completed successfully! ===');
}

main();
