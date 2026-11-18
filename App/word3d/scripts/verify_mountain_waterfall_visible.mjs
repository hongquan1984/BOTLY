import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING HEADWATER MOUNTAIN WATERFALL VISIBILITY ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Overview screenshot
  const ssOverview = path.join(ARTIFACT_DIR, '52_headwater_waterfall_visible_overview.png');
  await page.screenshot({ path: ssOverview });
  console.log('Saved Screenshot 1 (Overview):', ssOverview);

  // 2. Focus on Headwater Waterfall: Zoom in and frame the Watermill & Mountain Waterfall Gorge
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Zoom in significantly towards the center
  await page.mouse.move(startX, startY);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(1500);

  // Slightly pan/orbit so the Watermill & mountain waterfall gorge are right in the center
  await page.mouse.down();
  await page.mouse.move(startX + 80, startY + 30, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  const ssCloseup = path.join(ARTIFACT_DIR, '53_headwater_waterfall_visible_closeup.png');
  await page.screenshot({ path: ssCloseup });
  console.log('Saved Screenshot 2 (Headwater Waterfall Close-up):', ssCloseup);

  await browser.close();
  console.log('=== VERIFICATION COMPLETED ===');
}

run().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
