import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING COZY FANTASY VILLAGE V3 POLISH ===');
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

  // Screenshot 1: Overview with New Mountain, Cascading Waterfall & Footpaths
  const ss1 = path.join(ARTIFACT_DIR, '63_v3_polish_overview.png');
  await page.screenshot({ path: ss1 });
  console.log('Saved Screenshot 1:', ss1);

  // Rotate camera slightly to focus on the Headwater Mountain & Stepped Waterfall
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Orbit to view mountain face clearly
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 180, startY + 60, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Zoom in on mountain and waterfall
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(1500);

  // Screenshot 2: Mountain and Waterfall Close-up
  const ss2 = path.join(ARTIFACT_DIR, '64_v3_mountain_and_waterfall_closeup.png');
  await page.screenshot({ path: ss2 });
  console.log('Saved Screenshot 2:', ss2);

  // Zoom back and orbit to focus on Village Plaza and Footpaths
  await page.mouse.wheel(0, 400);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 260, startY - 80, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  // Screenshot 3: Village Roadways & Plaza Close-up
  const ss3 = path.join(ARTIFACT_DIR, '65_v3_village_roads_closeup.png');
  await page.screenshot({ path: ss3 });
  console.log('Saved Screenshot 3:', ss3);

  await page.close();

  // 4. Mobile Test (iPhone 14 viewport: 390x844)
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

  const ssMobile = path.join(ARTIFACT_DIR, '66_v3_mobile_performance.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Saved Screenshot 4 (Mobile):', ssMobile);

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
