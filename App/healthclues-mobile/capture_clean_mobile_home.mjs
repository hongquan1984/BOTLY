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

const page = await browser.newPage({ viewport: { width: 440, height: 860 } });
page.on('console', (msg) => console.log('PAGE_LOG:', msg.text()));

console.log('Navigating to http://localhost:8081/ ...');
await page.goto('http://localhost:8081/', { waitUntil: 'domcontentloaded' });

await page.evaluate(() => {
  localStorage.setItem('healthclues-onboarding-completed', 'true');
  localStorage.setItem('healthclues-interactive-spotlight-tour-v4', 'true');
  localStorage.setItem('healthclues_chalet_welcome_claimed', 'true');
  localStorage.setItem('healthclues_chalet_state_global', JSON.stringify({ hasClaimedWelcome: true, activeRoom: 'scene_interior_wide' }));
  localStorage.setItem('healthclues-chalet-state-v1_guest', JSON.stringify({ hasClaimedWelcome: true, activeRoom: 'scene_interior_wide' }));
});

await page.goto('http://localhost:8081/(game)/home', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

// If modal button is still visible, click it
const modalBtn = await page.$('text=Mở Hộp Quà Tân Gia');
if (modalBtn) {
  console.log('Clicking welcome gift button...');
  await modalBtn.click();
  await page.waitForTimeout(1000);
}

// Capture overview
await page.screenshot({
  path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_chalet_final_overview.png',
});
console.log('Saved mobile_chalet_final_overview.png');

// Click "Phòng Ngủ" tab
const bedroomBtn = await page.$('text=Phòng Ngủ');
if (bedroomBtn) {
  console.log('Clicking Phòng Ngủ tab...');
  await bedroomBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_chalet_final_bedroom.png',
  });
  console.log('Saved mobile_chalet_final_bedroom.png');
}

// Click "Bếp Ăn" tab
const kitchenBtn = await page.$('text=Bếp Ăn');
if (kitchenBtn) {
  console.log('Clicking Bếp Ăn tab...');
  await kitchenBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_chalet_final_kitchen.png',
  });
  console.log('Saved mobile_chalet_final_kitchen.png');
}

// Click "Spa & Tắm" tab
const bathBtn = await page.$('text=Spa & Tắm');
if (bathBtn) {
  console.log('Clicking Spa & Tắm tab...');
  await bathBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_chalet_final_bath.png',
  });
  console.log('Saved mobile_chalet_final_bath.png');
}

await browser.close();
