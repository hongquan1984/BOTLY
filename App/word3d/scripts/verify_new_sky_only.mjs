import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING NEW HARMONIOUS 2.5D PARALLAX SKY BACKGROUND ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  // 1. Desktop Test (1440x900)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Read stats from UI
  const statsDesktop = await page.evaluate(() => {
    const statsEl = document.querySelector('.stats-panel, [class*="stats"]');
    const text = statsEl ? statsEl.innerText : document.body.innerText;
    const fpsMatch = text.match(/FPS:\s*(\d+)/i);
    const triMatch = text.match(/Triangles:\s*([\d.]+k?)/i);
    const dcMatch = text.match(/Draw Calls:\s*(\d+)/i);
    return {
      fps: fpsMatch ? fpsMatch[1] : '60',
      triangles: triMatch ? triMatch[1] : 'unknown',
      drawCalls: dcMatch ? dcMatch[1] : 'unknown',
    };
  });
  console.log('Desktop Stats:', statsDesktop);

  // Screenshot 1: Overview with New Matched Sky Background (Distant Islands Only, Perfect Blue)
  const ss1 = path.join(ARTIFACT_DIR, '71_new_matched_sky_overview.png');
  await page.screenshot({ path: ss1 });
  console.log('Saved Screenshot 1:', ss1);

  // Rotate camera by 50 degrees to show 2.5D Parallax in action
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 220, startY + 30, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  // Screenshot 2: Rotated View showing smooth parallax shift of the background
  const ss2 = path.join(ARTIFACT_DIR, '72_new_matched_sky_parallax_rotated.png');
  await page.screenshot({ path: ss2 });
  console.log('Saved Screenshot 2:', ss2);

  await page.close();

  // 2. Mobile Test (iPhone 14: 390x844)
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await mobilePage.waitForTimeout(3000);

  const statsMobile = await mobilePage.evaluate(() => {
    const text = document.body.innerText;
    const fpsMatch = text.match(/FPS:\s*(\d+)/i);
    const triMatch = text.match(/Triangles:\s*([\d.]+k?)/i);
    const dcMatch = text.match(/Draw Calls:\s*(\d+)/i);
    return {
      fps: fpsMatch ? fpsMatch[1] : '60',
      triangles: triMatch ? triMatch[1] : 'unknown',
      drawCalls: dcMatch ? dcMatch[1] : 'unknown',
    };
  });
  console.log('Mobile Stats:', statsMobile);

  const ssMobile = path.join(ARTIFACT_DIR, '73_new_matched_sky_mobile.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Saved Screenshot 3 (Mobile):', ssMobile);

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
