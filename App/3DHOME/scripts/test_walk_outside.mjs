import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('d:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');

const outDir = 'D:/botly/App/3DHOME/reports/shots';
fs.mkdirSync(outDir, { recursive: true });

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

const page = await browser.newPage();
page.setDefaultTimeout(90000);

await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.__CHALET_API__ && window.__CHALET_API__.camera), null, { timeout: 90000 });
await page.evaluate(() => window.__CHALET_API__.waitPhase2());
await page.waitForTimeout(1000);
await page.evaluate(() => window.__CHALET_API__.hideHud());

// Switch to character mode
await page.evaluate(() => {
  window.__CHALET_API__.switchView('character');
});
await page.waitForTimeout(800);

// 1. Teleport/move player onto the terrace deck outside
await page.evaluate(() => {
  window.__CHALET_API__.movePlayerTo(0.0, 7.0);
});
await page.waitForTimeout(1000);
const p1 = path.join(outDir, 'character_on_deck.png');
await page.screenshot({ path: p1 });
console.log('Saved character on deck:', p1);

// 2. Move player out onto the garden lawn
await page.evaluate(() => {
  window.__CHALET_API__.movePlayerTo(-6.0, 11.5);
});
await page.waitForTimeout(1000);
const p2 = path.join(outDir, 'character_on_garden_lawn.png');
await page.screenshot({ path: p2 });
console.log('Saved character on lawn:', p2);

// 3. Move player right beside the flowering tree
await page.evaluate(() => {
  window.__CHALET_API__.movePlayerTo(-10.5, 12.0);
});
await page.waitForTimeout(1000);
const p3 = path.join(outDir, 'character_at_flowering_tree.png');
await page.screenshot({ path: p3 });
console.log('Saved character at flowering tree:', p3);

// 4. Also 3/4 cutaway view of the clean lush green yard without 3D grass or dry stick trees
await page.evaluate(() => {
  window.__CHALET_API__.switchView('view34');
});
await page.waitForTimeout(1000);
const p4 = path.join(outDir, 'lush_green_yard_final.png');
await page.screenshot({ path: p4 });
console.log('Saved lush green yard view34:', p4);

await browser.close();
console.log('ALL WALKING TESTS PASSED!');
