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
await page.goto('http://localhost:8081/(game)/home', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// Click "Bỏ qua" to close tutorial card if present
const skipBtn = await page.$('text=Bỏ qua');
if (skipBtn) {
  console.log('Clicking Bỏ qua...');
  await skipBtn.click();
  await page.waitForTimeout(1000);
}

await page.screenshot({
  path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/mobile_home_tutorial_closed.png',
});
console.log('Saved mobile_home_tutorial_closed.png');

await browser.close();
