import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'D:/botly/App/3DHOME/reports/shots';
fs.mkdirSync(outDir, { recursive: true });

const url = 'http://127.0.0.1:5173';

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

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(90000);

console.log('Navigating to', url);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__ && window.__CHALET_API__.camera));

// Wait for Phase 2 streaming
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);

// Hide HUD for clean cinematic screenshots
await page.evaluate(() => window.__CHALET_API__.hideHud());

// Shot 1: Camera outdoors in yard looking at the hero tree (-12.4, 12.1) with lake in background
// Exactly matching the user photo angle!
await page.evaluate(() => {
  const cam = window.__CHALET_API__.camera;
  cam.position.set(-13.8, 1.6, 7.5);
  cam.lookAt(-12.4, 2.6, 12.1);
  cam.updateProjectionMatrix();
});
await page.waitForTimeout(600);
const shotClose = path.join(outDir, 'yard_hero_tree_close.png');
await page.screenshot({ path: shotClose });
console.log('Saved hero tree close shot:', shotClose);

// Shot 2: Wide front lawn and lakeside garden panorama showing multiple replicated trees
await page.evaluate(() => {
  const cam = window.__CHALET_API__.camera;
  cam.position.set(-3.0, 3.2, 7.5);
  cam.lookAt(-10.0, 2.2, 13.5);
  cam.updateProjectionMatrix();
});
await page.waitForTimeout(600);
const shotWide = path.join(outDir, 'yard_garden_wide.png');
await page.screenshot({ path: shotWide });
console.log('Saved yard garden wide shot:', shotWide);

await browser.close();
console.log('ALL DONE!');
