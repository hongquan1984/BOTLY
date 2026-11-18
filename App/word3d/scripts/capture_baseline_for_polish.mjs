import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== CAPTURING BASELINE FOR COZY FANTASY VILLAGE POLISH ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  // 1. Desktop baseline
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();

  console.log('Loading desktop page at http://localhost:5173/ ...');
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await desktopPage.waitForTimeout(3000);

  // Turn on stats
  const statsBtn = desktopPage.locator('button[title*="Stats"]');
  if (await statsBtn.count() > 0) {
    await statsBtn.click();
    await desktopPage.waitForTimeout(500);
  }

  // Read stats from page
  const desktopStats = await desktopPage.evaluate(() => {
    const statsOverlay = document.querySelector('.stats-overlay');
    return {
      text: statsOverlay ? statsOverlay.textContent : 'No stats overlay',
    };
  });
  console.log('Desktop Stats:', desktopStats.text);

  const desktopSSPath = path.join(ARTIFACT_DIR, '37_baseline_desktop_overview.png');
  await desktopPage.screenshot({ path: desktopSSPath });
  console.log('Saved baseline desktop screenshot:', desktopSSPath);

  // 2. Mobile baseline (iPhone 14 / standard 390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  console.log('Loading mobile page at http://localhost:5173/ ...');
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await mobilePage.waitForTimeout(3000);

  const mobileSSPath = path.join(ARTIFACT_DIR, '38_baseline_mobile_overview.png');
  await mobilePage.screenshot({ path: mobileSSPath });
  console.log('Saved baseline mobile screenshot:', mobileSSPath);

  await browser.close();
  console.log('=== BASELINE CAPTURE COMPLETED ===');
}

run().catch(err => {
  console.error('Baseline capture failed:', err);
  process.exit(1);
});
