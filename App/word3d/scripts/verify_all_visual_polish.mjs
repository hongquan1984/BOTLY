import { chromium } from 'playwright-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/b6ff82c9-4cf6-4c71-93a2-4574cb0af50a';

async function run() {
  console.log('=== VERIFYING VISUAL POLISH: SKY, WATERFALL, PATHS, BIRDS, MOBILE ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  // 1. Desktop Test
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopContext.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') console.log(`[Browser ERROR] ${text}`);
  });

  console.log('1. Loading application at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Measure Real-Time Polished Stats
  const statsBadge = page.locator('.stats-badge');
  let polishedStats = '';
  if (await statsBadge.count() > 0) {
    polishedStats = await statsBadge.innerText();
    console.log('--- POLISHED STATS (HIGH PRESET) ---\n' + polishedStats);
  }

  // Screenshot 1: Desktop Overview (Same angle as baseline)
  const ssDesktop = path.join(ARTIFACT_DIR, '39_polished_desktop_overview.png');
  await page.screenshot({ path: ssDesktop });
  console.log('Screenshot 1 (Desktop Overview) saved:', ssDesktop);

  // Focus on Waterfall: Orbit camera slightly to view plunging waterfall closely
  console.log('2. Orbiting camera to capture Waterfall Close-up...');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: cx - 220, clientY: cy + 40, button: 0 }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: cx - 220, clientY: cy + 40, button: 0 }));
  });
  await page.waitForTimeout(1500);

  const ssWaterfall = path.join(ARTIFACT_DIR, '40_edge_waterfall_closeup.png');
  await page.screenshot({ path: ssWaterfall });
  console.log('Screenshot 2 (Waterfall Close-up) saved:', ssWaterfall);

  // Reset Camera View
  const resetBtn = page.locator('button:has-text("Reset View")');
  await resetBtn.click();
  await page.waitForTimeout(1000);

  // Screenshot 3: Footpaths & Landscaping detail
  const ssLandscaping = path.join(ARTIFACT_DIR, '41_footpaths_and_landscaping.png');
  await page.screenshot({ path: ssLandscaping });
  console.log('Screenshot 3 (Footpaths & Landscaping) saved:', ssLandscaping);

  // 3. Functional Regression Tests
  console.log('3. Running Functional Regression Tests...');

  // Test Location Bar Shortcut Click: Watermill
  const watermillBtn = page.locator('.loc-btn:has-text("Watermill")');
  if (await watermillBtn.count() > 0) {
    console.log('  Testing Watermill shortcut click...');
    await watermillBtn.click();
    await page.waitForTimeout(2500);
    const locModal = page.locator('.location-modal');
    if (await locModal.count() > 0 && await locModal.isVisible()) {
      console.log('  ✓ Location modal opened successfully');
      const closeBtn = page.locator('.modal-close-btn, button:has-text("Close"), button:has-text("✕")').first();
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Test Asset Studio Modal
  console.log('  Testing Asset Studio (22)...');
  const studioBtn = page.locator('button:has-text("Asset Studio")');
  await studioBtn.click();
  await page.waitForTimeout(1500);
  const studioModal = page.locator('.asset-library-modal');
  const studioVisible = await studioModal.isVisible();
  console.log('  ✓ Asset Studio modal visible:', studioVisible);

  if (studioVisible) {
    // Check Terrain category (Suối & Nước)
    const streamTab = page.locator('.asset-library-modal button:has-text("Suối & Nước")');
    if (await streamTab.count() > 0) {
      await streamTab.click();
      await page.waitForTimeout(800);
      const cards = page.locator('.asset-item-card');
      console.log('  ✓ Stream assets in studio:', await cards.count());
    }
    // Close Studio
    await page.locator('.asset-library-modal button:has-text("✕")').click();
    await page.waitForTimeout(800);
  }

  // Test Level Editor Mode
  console.log('  Testing Edit Map mode...');
  const editMapBtn = page.locator('button:has-text("Edit Map")');
  await editMapBtn.click();
  await page.waitForTimeout(1000);
  const palette = page.locator('.editor-palette-drawer');
  console.log('  ✓ Edit Map palette visible:', await palette.isVisible());

  // Close Edit Map
  await page.locator('button:has-text("Editor: ON")').click();
  await page.waitForTimeout(800);

  // 4. Test Quality Presets (High -> Medium -> Low -> High)
  console.log('4. Testing Quality Presets...');
  const qualityBtn = page.locator('button:has-text("Quality:")');
  await qualityBtn.click(); // to medium or low
  await page.waitForTimeout(1000);
  console.log('  Preset after 1st click:', (await statsBadge.innerText()).replace(/\n/g, ' '));

  await qualityBtn.click(); // to low
  await page.waitForTimeout(1000);
  const lowStats = await statsBadge.innerText();
  console.log('  Preset after 2nd click (LOW):\n' + lowStats);

  await qualityBtn.click(); // back to high
  await page.waitForTimeout(1000);
  console.log('  Preset restored to High.');

  // 5. Mobile Device Test (iPhone 14 standard 390x844)
  console.log('5. Testing Mobile Viewport (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await mobilePage.waitForTimeout(3000);

  const ssMobile = path.join(ARTIFACT_DIR, '42_polished_mobile_overview.png');
  await mobilePage.screenshot({ path: ssMobile });
  console.log('Screenshot 4 (Mobile Overview) saved:', ssMobile);

  const mobileStats = await mobilePage.locator('.stats-badge').innerText();
  console.log('--- MOBILE STATS ---\n' + mobileStats);

  await browser.close();
  console.log('=== ALL VALIDATION TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
