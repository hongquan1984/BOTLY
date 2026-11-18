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

const page = await browser.newPage({ viewport: { width: 440, height: 920 } });
page.on('console', (msg) => console.log('PAGE_LOG:', msg.text()));

console.log('Navigating to http://localhost:8081/iphone.html ...');
await page.goto('http://localhost:8081/iphone.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Switch to home tab if needed
const gameFrameEl = await page.$('#gameFrame');
if (gameFrameEl) {
  const frame = await gameFrameEl.contentFrame();
  if (frame) {
    console.log('Inside gameFrame...');
    // Click Home tab (tabBar item 2)
    const homeTabBtn = await frame.$('[aria-label="Home"], [aria-label="Nhà Của Tôi"], [data-testid="tab-home"]');
    if (homeTabBtn) {
      await homeTabBtn.click();
      await page.waitForTimeout(2000);
    }
  }
}

await page.screenshot({
  path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_home_verified.png',
});
console.log('Saved mobile_home_verified.png');

await browser.close();
