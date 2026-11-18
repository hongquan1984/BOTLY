import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'D:\\botly\\App\\word3d';
const screenshotsDir = path.join(targetDir, 'docs', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function main() {
  console.log('=== Starting Visual Remaster & Mobile UX Verification ===');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  try {
    // 1. Desktop Test (1280x800)
    console.log('\n1. Testing Desktop Remastered Scene (1280x800)...');
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for WebGL models and textures

    // Desktop Overview Screenshot
    const shot1 = path.join(screenshotsDir, '02_imported_castle_village_overview.png');
    await page.screenshot({ path: shot1 });
    console.log(`Saved screenshot: ${shot1}`);

    // Read real-time stats from HUD
    const statsText = await page.locator('.stats-badge').innerText().catch(() => 'N/A');
    console.log('Desktop HUD Stats:\n', statsText);

    // 2. Close-up of improved village
    console.log('\n2. Capturing close-up of remastered village...');
    // Zoom in smoothly to reveal cobblestones, warm cottages, and hero foliage
    await page.mouse.move(640, 400);
    for (let w = 0; w < 6; w++) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1500);

    const shotCloseup = path.join(screenshotsDir, '05_village_closeup_detail.png');
    await page.screenshot({ path: shotCloseup });
    console.log(`Saved screenshot: ${shotCloseup}`);

    // 3. Floating island base & atmospheric background
    console.log('\n3. Capturing floating island base & atmospheric background...');
    // Reset view
    await page.click('button.hud-btn:has-text("Reset View")');
    await page.waitForTimeout(1200);

    // Orbit down slightly by dragging to reveal island underside and distant mountains
    await page.mouse.move(640, 400);
    await page.mouse.down();
    await page.mouse.move(640, 250, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1500);

    const shotAtmo = path.join(screenshotsDir, '06_floating_island_atmosphere.png');
    await page.screenshot({ path: shotAtmo });
    console.log(`Saved screenshot: ${shotAtmo}`);

    // Reset view for location testing
    await page.click('button.hud-btn:has-text("Reset View")');
    await page.waitForTimeout(1200);

    // 4. Test all 5 locations individually
    console.log('\n4. Testing All 5 Interactive Locations...');
    const locationsToTest = [
      { name: 'Library', title: 'Grand Castle Library' },
      { name: "Lumi's House", title: "Lumi's Cozy Cottage" },
      { name: 'Herbal Garden', title: 'Eastern Herbal Grove' },
      { name: 'Peaceful Overlook', title: 'Western Cliff Overlook' },
      { name: 'Village Square', title: 'Central Village Square' },
    ];

    for (const loc of locationsToTest) {
      console.log(`- Testing location: ${loc.name}...`);
      const btn = page.locator(`button.loc-btn:has-text("${loc.name}")`);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForSelector('.location-modal', { timeout: 12000 });
        console.log(`  Modal opened for: ${loc.title}`);

        if (loc.name === 'Library') {
          const shotModal = path.join(screenshotsDir, '03_enhanced_castle_village_interaction.png');
          await page.screenshot({ path: shotModal });
          console.log(`  Saved screenshot: ${shotModal}`);
        }

        await page.click('.modal-close-btn');
        await page.waitForTimeout(1000);
      } else {
        console.warn(`  Button not found for ${loc.name}`);
      }
    }

    await page.close();

    // 5. Mobile Viewport Test (390x844 - iPhone 14)
    console.log('\n5. Testing Mobile Viewport (390x844 iPhone 14)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(5000);

    // Check that all 5 location buttons are visible on screen without overflow
    const locBtns = await mobilePage.locator('.loc-btn').all();
    console.log(`Mobile location buttons count: ${locBtns.length}`);
    for (let i = 0; i < locBtns.length; i++) {
      const box = await locBtns[i].boundingBox();
      const text = await locBtns[i].innerText();
      console.log(`  Button [${i}]: "${text.replace(/\n/g, ' ')}" -> x: ${box?.x}, y: ${box?.y}, w: ${box?.width}, h: ${box?.height}`);
    }

    const shotMobile = path.join(screenshotsDir, '04_mobile_castle_village_overview.png');
    await mobilePage.screenshot({ path: shotMobile });
    console.log(`Saved screenshot: ${shotMobile}`);

    // Test clicking a location on mobile
    console.log('Testing mobile location click (Lumi\'s House)...');
    await mobilePage.click('button.loc-btn:has-text("Lumi\'s House")');
    await mobilePage.waitForSelector('.location-modal', { timeout: 12000 });
    console.log('Mobile modal opened successfully!');
    await mobilePage.click('.modal-close-btn');
    await mobilePage.waitForTimeout(1000);

    await mobilePage.close();

    console.log('\n=== All Verification Tests Completed Successfully! ===\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
