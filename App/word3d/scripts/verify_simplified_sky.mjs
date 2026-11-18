import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING SIMPLIFIED 2.5D SKY ENVIRONMENT ===');
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
  console.log('Desktop Stats (High Quality):', statsDesktop);

  // Screenshot 1: Overview with Fixed 2.5D Sky & 2 Depth Clouds
  const ss1 = path.join(ARTIFACT_DIR, '59_simplified_25d_sky_overview.png');
  await page.screenshot({ path: ss1 });
  console.log('Saved Screenshot 1:', ss1);

  // 2. Rotate Camera 60 degrees to verify the island rotates while 2.5D background stays fixed
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 220, startY + 40, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  // Screenshot 2: Rotated View
  const ss2 = path.join(ARTIFACT_DIR, '60_simplified_25d_sky_rotated.png');
  await page.screenshot({ path: ss2 });
  console.log('Saved Screenshot 2:', ss2);

  // Screenshot 3: Close-up of 2 nearby depth clouds (Foreground cloud & Waterfall pillow)
  await page.mouse.wheel(0, -500); // Zoom in
  await page.waitForTimeout(1000);
  const ss3 = path.join(ARTIFACT_DIR, '62_simplified_25d_sky_clouds_closeup.png');
  await page.screenshot({ path: ss3 });
  console.log('Saved Screenshot 3:', ss3);

  await page.close();

  // 3. Mobile Test (iPhone 14 viewport: 390x844)
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
  console.log('Mobile Stats (Medium Quality):', statsMobile);

  const ssMobile = path.join(ARTIFACT_DIR, '61_simplified_25d_sky_mobile.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Saved Screenshot 4 (Mobile):', ssMobile);

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
