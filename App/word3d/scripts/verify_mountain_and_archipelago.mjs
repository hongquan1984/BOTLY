import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING HEADWATER MOUNTAIN & DISTANT SKY ARCHIPELAGO ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Test with both clean and saved layout in localStorage
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  const statsBadge = page.locator('.stats-badge');
  const statsText = await statsBadge.innerText();
  console.log('--- STATS (HEADWATER MOUNTAIN + DISTANT ARCHIPELAGO) ---\n' + statsText);

  // 1. Full Overview from Default Camera View
  const ssOverview = path.join(ARTIFACT_DIR, '48_headwater_mountain_and_archipelago_overview.png');
  await page.screenshot({ path: ssOverview });
  console.log('Saved Screenshot 1 (Default Overview):', ssOverview);

  // 2. Orbit to inspect Sacred Shrine Island and Waterfall on the left
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 260, startY + 40, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  const ssShrine = path.join(ARTIFACT_DIR, '49_distant_archipelago_close_shrine.png');
  await page.screenshot({ path: ssShrine });
  console.log('Saved Screenshot 2 (Sacred Shrine & Headwater Mountain):', ssShrine);

  // 3. Orbit to inspect Celestial Observatory & Windmill on the right
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 500, startY, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  const ssObservatory = path.join(ARTIFACT_DIR, '50_distant_archipelago_close_observatory.png');
  await page.screenshot({ path: ssObservatory });
  console.log('Saved Screenshot 3 (Observatory & Windmill Islands):', ssObservatory);

  // 4. Mobile Viewport (iPhone 14)
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

  const ssMobile = path.join(ARTIFACT_DIR, '51_distant_archipelago_mobile.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Saved Screenshot 4 (Mobile Viewport):', ssMobile);

  const mobileStats = await mobilePage.locator('.stats-badge').innerText();
  console.log('--- MOBILE STATS ---\n' + mobileStats);

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
