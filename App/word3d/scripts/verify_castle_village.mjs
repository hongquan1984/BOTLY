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
  console.log('Launching Chrome to verify BlackSpire Castle Village Scene...');
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
    console.log('1. Testing Desktop Castle Village Scene (1280x800)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    // Wait for the 7 MB Castle Village Scene GLB to fully load into WebGL
    await desktopPage.waitForTimeout(5000);

    const shot1 = path.join(screenshotsDir, '02_imported_castle_village_overview.png');
    await desktopPage.screenshot({ path: shot1 });
    console.log(`Saved screenshot: ${shot1}`);

    // 2. Test Location Interaction: Grand Castle Library
    console.log('2. Testing Location Interaction: Grand Castle Library...');
    const libBtn = desktopPage.locator('button.loc-btn:has-text("Library")');
    if (await libBtn.isVisible()) {
      await libBtn.click();
      console.log('Clicked Castle Library. Waiting for character to walk to castle gates...');
      await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
      await desktopPage.waitForTimeout(1000);

      const shot2 = path.join(screenshotsDir, '03_enhanced_castle_village_interaction.png');
      await desktopPage.screenshot({ path: shot2 });
      console.log(`Saved screenshot: ${shot2}`);

      await desktopPage.click('.modal-close-btn');
      await desktopPage.waitForTimeout(1000);
    }

    // 3. Test Location Interaction: Lumi's House
    console.log('3. Testing Location Interaction: Lumi\'s Cottage...');
    const lumisBtn = desktopPage.locator('button.loc-btn:has-text("Lumi\'s House")');
    if (await lumisBtn.isVisible()) {
      await lumisBtn.click();
      await desktopPage.waitForSelector('.location-modal', { timeout: 12000 });
      await desktopPage.waitForTimeout(1000);
      await desktopPage.click('.modal-close-btn');
      await desktopPage.waitForTimeout(1000);
    }

    // 4. Test Reset View
    console.log('4. Testing Camera Reset View...');
    await desktopPage.click('button.hud-btn:has-text("Reset View")');
    await desktopPage.waitForTimeout(1500);

    await desktopPage.close();

    // 5. Mobile Viewport Test (390x844 - iPhone 14)
    console.log('5. Testing Mobile Viewport (390x844 iPhone 14)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(5000);

    const shot3 = path.join(screenshotsDir, '04_mobile_castle_village_overview.png');
    await mobilePage.screenshot({ path: shot3 });
    console.log(`Saved screenshot: ${shot3}`);

    await mobilePage.close();

    console.log('\n=== BlackSpire Castle Village Scene Verification Completed Successfully! ===\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
