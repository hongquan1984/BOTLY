import { createRequire } from 'module';
const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--no-sandbox',
  ],
});

// ==========================================
// TEST 1: PORTRAIT MODE (390 x 844)
// ==========================================
console.log('Testing Mobile PORTRAIT mode (390 x 844)...');
const portraitPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await portraitPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await portraitPage.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 60000 });
await portraitPage.evaluate(() => window.__CHALET_API__.waitPhase2());
await portraitPage.waitForTimeout(1000);

// Screenshot 1: Portrait Collapsed (Pure clean 3D scene + tiny floating trigger)
await portraitPage.screenshot({
  path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/01_mobile_portrait_collapsed_clean.png',
});
console.log('Saved 01_mobile_portrait_collapsed_clean.png');

// Screenshot 2: Click trigger to open collapsible menu
const triggerBtn = await portraitPage.$('#btn-mobile-menu');
if (triggerBtn) {
  await triggerBtn.click();
  await portraitPage.waitForTimeout(500);
  await portraitPage.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/02_mobile_portrait_menu_expanded.png',
  });
  console.log('Saved 02_mobile_portrait_menu_expanded.png');
}

// Screenshot 3: Click Bedroom view button inside menu
const bedroomBtn = await portraitPage.$('[data-view="bedroom"]');
if (bedroomBtn) {
  await bedroomBtn.click();
  await portraitPage.waitForTimeout(900);
  await portraitPage.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/03_mobile_portrait_bedroom_wide.png',
  });
  console.log('Saved 03_mobile_portrait_bedroom_wide.png');
}

await portraitPage.close();

// ==========================================
// TEST 2: LANDSCAPE MODE (844 x 390)
// ==========================================
console.log('Testing Mobile LANDSCAPE mode (844 x 390)...');
const landscapePage = await browser.newPage({ viewport: { width: 844, height: 390 } });
await landscapePage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await landscapePage.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 60000 });
await landscapePage.evaluate(() => window.__CHALET_API__.waitPhase2());
await landscapePage.waitForTimeout(1000);

// Screenshot 4: Landscape Collapsed (Expansive panoramic lake & Alps vista)
await landscapePage.screenshot({
  path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/04_mobile_landscape_collapsed_clean.png',
});
console.log('Saved 04_mobile_landscape_collapsed_clean.png');

// Screenshot 5: Landscape Expanded Menu
const landscapeTrigger = await landscapePage.$('#btn-mobile-menu');
if (landscapeTrigger) {
  await landscapeTrigger.click();
  await landscapePage.waitForTimeout(500);
  await landscapePage.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/05_mobile_landscape_menu_expanded.png',
  });
  console.log('Saved 05_mobile_landscape_menu_expanded.png');
}

// Screenshot 6: Switch to Bedroom in Landscape
const lsBedroomBtn = await landscapePage.$('[data-view="bedroom"]');
if (lsBedroomBtn) {
  await lsBedroomBtn.click();
  await landscapePage.waitForTimeout(900);
  await landscapePage.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/06_mobile_landscape_bedroom_wide.png',
  });
  console.log('Saved 06_mobile_landscape_bedroom_wide.png');
}

// Screenshot 7: Switch to Kitchen in Landscape
const lsTrigger2 = await landscapePage.$('#btn-mobile-menu');
if (lsTrigger2) {
  await lsTrigger2.click();
  await landscapePage.waitForTimeout(400);
  const lsKitchenBtn = await landscapePage.$('[data-view="kitchen"]');
  if (lsKitchenBtn) {
    await lsKitchenBtn.click();
    await landscapePage.waitForTimeout(900);
    await landscapePage.screenshot({
      path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/07_mobile_landscape_kitchen_wide.png',
    });
    console.log('Saved 07_mobile_landscape_kitchen_wide.png');
  }
}

await landscapePage.close();
await browser.close();
console.log('All tests completed successfully!');
