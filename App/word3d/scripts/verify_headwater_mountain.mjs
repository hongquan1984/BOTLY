import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING HEADWATER MOUNTAIN & SOURCE CASCADE ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  const statsBadge = page.locator('.stats-badge');
  const statsText = await statsBadge.innerText();
  console.log('--- STATS WITH HEADWATER MOUNTAIN ---\n' + statsText);

  // 1. Overview screenshot
  const ssOverview = path.join(ARTIFACT_DIR, '45_headwater_mountain_overview.png');
  await page.screenshot({ path: ssOverview });
  console.log('Saved Screenshot 1 (Overview with Mountain):', ssOverview);

  // 2. Orbit camera to look directly at the Headwater Mountain (North-West corner)
  // Default camera is at (0, 18, 26) looking at (0, 1, 0)
  // Drag to rotate camera around to see the mountain and watermill in front
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Drag rightwards ~180px to bring North-West quadrant closer to center view
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 180, startY + 60, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  // Zoom in slightly (scroll wheel down/up)
  await page.mouse.wheel(0, -350);
  await page.waitForTimeout(1000);

  const ssCloseup = path.join(ARTIFACT_DIR, '46_headwater_mountain_closeup.png');
  await page.screenshot({ path: ssCloseup });
  console.log('Saved Screenshot 2 (Headwater Mountain Close-up):', ssCloseup);

  // 3. Mobile Viewport (iPhone 14)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await mobilePage.waitForTimeout(2500);

  const ssMobile = path.join(ARTIFACT_DIR, '47_headwater_mountain_mobile.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Saved Screenshot 3 (Mobile Overview with Mountain):', ssMobile);

  const mobileStats = await mobilePage.locator('.stats-badge').innerText();
  console.log('--- MOBILE STATS ---\n' + mobileStats);

  await browser.close();
  console.log('=== VERIFICATION OF HEADWATER MOUNTAIN COMPLETED ===');
}

run().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
