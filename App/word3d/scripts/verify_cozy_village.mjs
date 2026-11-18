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
  console.log('=== Starting Cozy Village Demo Verification ===');
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
    console.log('\n1. Testing Desktop Cozy Village Demo (1280x800)...');
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    page.on('console', msg => console.log('PAGE:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(6000); // Wait for GLTF models and textures

    // Desktop Overview Screenshot
    const shotOverview = path.join(screenshotsDir, '10_cozy_village_overview_desktop.png');
    await page.screenshot({ path: shotOverview });
    console.log(`Saved screenshot: ${shotOverview}`);

    // Read real-time stats from HUD
    const statsText = await page.locator('.stats-badge').innerText().catch(() => 'N/A');
    console.log('Desktop HUD Stats:\n', statsText);

    // 2. Close-up of Lumi's Potion Shop & Arched Bridge
    console.log('\n2. Capturing close-up of Lumi\'s Potion Shop & Arched Bridge...');
    await page.click('button.loc-btn:has-text("Potion Shop")');
    await page.waitForTimeout(4000);
    const shotPotion = path.join(screenshotsDir, '11_cozy_village_potion_bridge_closeup.png');
    await page.screenshot({ path: shotPotion });
    console.log(`Saved screenshot: ${shotPotion}`);

    // Check modal
    const modalVisible = await page.locator('.location-modal').isVisible();
    if (modalVisible) {
      const shotModal = path.join(screenshotsDir, '14_cozy_village_potion_modal.png');
      await page.screenshot({ path: shotModal });
      console.log(`Saved modal screenshot: ${shotModal}`);
      await page.click('.modal-close-btn');
      await page.waitForTimeout(1000);
    }

    // 3. Close-up of the Whispering Watermill & Mountain Cascade
    console.log('\n3. Capturing Whispering Watermill & Cascade...');
    await page.click('button.loc-btn:has-text("Watermill")');
    await page.waitForTimeout(4000);
    if (await page.locator('.location-modal').isVisible()) {
      await page.click('.modal-close-btn');
    }
    const shotWatermill = path.join(screenshotsDir, '12_cozy_village_watermill_cascade.png');
    await page.screenshot({ path: shotWatermill });
    console.log(`Saved screenshot: ${shotWatermill}`);

    // 4. Central Starfall Plaza & Stone Well
    console.log('\n4. Capturing Starfall Plaza & Stone Well...');
    await page.click('button.loc-btn:has-text("Plaza Well")');
    await page.waitForTimeout(4000);
    if (await page.locator('.location-modal').isVisible()) {
      await page.click('.modal-close-btn');
    }
    const shotPlaza = path.join(screenshotsDir, '13_cozy_village_plaza_well.png');
    await page.screenshot({ path: shotPlaza });
    console.log(`Saved screenshot: ${shotPlaza}`);

    // Reset View
    await page.click('button.hud-btn:has-text("Reset View")');
    await page.waitForTimeout(1500);

    // 5. Test Scene Switcher: Switch to Castle Village and back
    console.log('\n5. Testing Scene Switcher: Switching to Castle Village...');
    const switchBtn = page.locator('button.hud-btn:has-text("Scene:")');
    await switchBtn.click();
    await page.waitForTimeout(2000);
    const shotCastle = path.join(screenshotsDir, '16_scene_switch_castle_village.png');
    await page.screenshot({ path: shotCastle });
    console.log(`Saved comparison screenshot: ${shotCastle}`);

    // Switch back to Cozy Village
    console.log('Switching back to Cozy Village...');
    await switchBtn.click();
    await page.waitForTimeout(2000);

    await page.close();

    // 6. Mobile Viewport Test (390x844 - iPhone 14)
    console.log('\n6. Testing Mobile Viewport (390x844 iPhone 14)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(6000);

    const locBtns = await mobilePage.locator('.loc-btn').all();
    console.log(`Mobile location buttons count: ${locBtns.length}`);
    for (let i = 0; i < locBtns.length; i++) {
      const box = await locBtns[i].boundingBox();
      const text = await locBtns[i].innerText();
      console.log(`  Button [${i}]: "${text.replace(/\n/g, ' ')}" -> x: ${box?.x}, y: ${box?.y}, w: ${box?.width}, h: ${box?.height}`);
    }

    const shotMobile = path.join(screenshotsDir, '15_cozy_village_mobile_390x844.png');
    await mobilePage.screenshot({ path: shotMobile });
    console.log(`Saved mobile screenshot: ${shotMobile}`);

    await mobilePage.close();

    console.log('\n=== All Cozy Village Verification Tests Completed Successfully! ===\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
