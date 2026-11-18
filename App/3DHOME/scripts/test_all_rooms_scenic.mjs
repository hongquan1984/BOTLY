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
    '--disk-cache-dir=D:/botly/.tmp_3dhome/cache',
  ],
});

const page = await browser.newPage({ viewport: { width: 480, height: 854 } });
page.on('console', (msg) => console.log('PAGE_LOG:', msg.text()));

console.log('Navigating to http://localhost:5173/ ...');
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__), null, { timeout: 60000 });
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);

const rooms = ['overview', 'kitchen', 'bedroom', 'bathroom'];
for (const r of rooms) {
  console.log(`Testing room: ${r} ...`);
  await page.evaluate((room) => {
    window.__CHALET_API__.switchView(room);
  }, r);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/room_test_${r}.png`,
  });
  console.log(`Saved room_test_${r}.png`);
}

await browser.close();
