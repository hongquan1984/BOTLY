import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Rotate camera to look towards positive X and Z (+8.6, +4.2)
  // Default camera is at (0, 18, 26) looking at (0, 1, 0)
  // Let's drag horizontally to rotate orbit around to see the eastern edge
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Drag mouse leftwards by 340px to rotate camera ~90-110 degrees
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 320, startY + 50, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(1500);

  const heroWaterfallSS = path.join(ARTIFACT_DIR, '44_hero_waterfall_plunge.png');
  await page.screenshot({ path: heroWaterfallSS });
  console.log('Saved hero waterfall screenshot to:', heroWaterfallSS);

  await browser.close();
}

run().catch(console.error);
