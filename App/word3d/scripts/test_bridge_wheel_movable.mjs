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

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click Edit Map
  await page.locator('button:has-text("Edit Map")').click();
  await page.waitForTimeout(1000);

  // Click on Wooden Bridge in the 3D view (around bridge screen coords or via Raycast)
  // Let's click around center-bottom where the bridge arches over the stream
  await page.mouse.click(620, 500);
  await page.waitForTimeout(1000);

  let selectionBar = page.locator('.editor-selection-bar');
  let isSelected = await selectionBar.isVisible();
  console.log('Selection bar visible after clicking bridge area:', isSelected);

  if (!isSelected) {
    // Try clicking near waterwheel (-6.2, 2.4, -7.5) -> screen coords roughly top-left
    await page.mouse.click(420, 320);
    await page.waitForTimeout(1000);
    isSelected = await selectionBar.isVisible();
    console.log('Selection bar visible after clicking waterwheel area:', isSelected);
  }

  if (isSelected) {
    const title = await page.locator('.editor-selection-title').innerText();
    console.log('Selected object:', title);
  }

  // Click spawn bridge button to test creating another bridge
  console.log('Testing spawn bridge button...');
  await page.locator('button:has-text("Gói Medieval")').click();
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Cầu Gỗ")').click();
  await page.waitForTimeout(1500);

  const title2 = await page.locator('.editor-selection-title').innerText();
  console.log('Newly spawned and selected:', title2);

  const p = path.join(targetDir, 'docs', 'screenshots', '28_bridge_and_wheel_movable.png');
  await page.screenshot({ path: p });
  console.log('Saved:', p);

  await browser.close();
}

main();
