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
page.on('console', (msg) => console.log('PAGE_LOG [' + msg.type() + ']:', msg.text()));
page.on('pageerror', (err) => console.log('PAGE_ERROR:', err.stack || err.message));

console.log('Navigating to http://localhost:5173/ ...');
const resp = await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
console.log('Response status:', resp?.status());

// Check if __CHALET_API__ is already there or poll it
let found = false;
for (let i = 0; i < 40; i++) {
  found = await page.evaluate(() => Boolean(window.__CHALET_API__));
  if (found) {
    console.log(`Found __CHALET_API__ after ${i * 250}ms!`);
    break;
  }
  await new Promise((r) => setTimeout(r, 250));
}

if (!found) {
  console.log('__CHALET_API__ NOT FOUND after 10s!');
  const scripts = await page.evaluate(() => Array.from(document.querySelectorAll('script')).map(s => s.src));
  console.log('Scripts on page:', scripts);
  await browser.close();
  process.exit(1);
}

console.log('Waiting for waitPhase2 ...');
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
console.log('Phase 2 ready!');
await new Promise((r) => setTimeout(r, 500));

await page.evaluate(() => {
  window.__CHALET_API__.switchView('bedroom');
  window.__CHALET_API__.setHomeLook(88, 3.0, 3.2, 'bedroom');
});
await new Promise((r) => setTimeout(r, 800));

await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/819881c5-9f35-406a-a5f6-dec1cc5a607a/bedroom_current_view.png' });
console.log('SUCCESS: Screenshot saved to bedroom_current_view.png');

await browser.close();
