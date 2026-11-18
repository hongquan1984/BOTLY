import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const shotDir = path.join(root, 'reports', 'shots');
fs.mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

await page.goto('http://127.0.0.1:5179/village.html', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction(() => window.villageReady === true, { timeout: 40000 });

// Round 1: desktop readiness, all camera presets, and character movement input.
const desktopViews = [
  ['overview', '01_village_overview_iso.png'],
  ['archway', '02_village_archway_gate.png'],
  ['fountain', '03_village_central_fountain.png'],
  ['overlook', '04_village_lake_overlook.png'],
  ['character', '05_village_character_walk.png'],
];
for (const [mode, filename] of desktopViews) {
  await page.click(`.view-tabs [data-view="${mode}"]`);
  await page.waitForTimeout(mode === 'character' ? 1000 : 900);
  assert(await page.locator(`.view-tabs [data-view="${mode}"].active`).count() === 1, `Round 1: ${mode} did not activate`);
  if (mode === 'character') {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(900);
    await page.keyboard.up('KeyW');
  }
  await page.screenshot({ path: path.join(shotDir, filename) });
}

assert(await page.evaluate(() => window.villageReady === true), 'Round 1: villageReady is false');
assert(runtimeErrors.length === 0, `Round 1 runtime errors: ${runtimeErrors.join(' | ')}`);
console.log('ROUND 1 PASS: desktop readiness, 5 camera modes, movement input, 0 runtime errors');

// Round 2: mobile portrait layout and control bounds.
await page.setViewportSize({ width: 393, height: 852 });
await page.click('#btn-reset-view');
await page.waitForTimeout(1100);
const mobileAudit = await page.evaluate(() => {
  const rect = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
  };
  return {
    header: rect('.hud-top'),
    tabs: rect('.view-tabs'),
    actions: rect('.hud-actions'),
    footer: rect('.hud-bottom'),
    canvas: rect('#scene-canvas'),
  };
});
for (const [name, box] of Object.entries(mobileAudit)) {
  assert(box && box.left >= -1 && box.right <= 394, `Round 2: ${name} escapes viewport: ${JSON.stringify(box)}`);
}
assert(mobileAudit.header.bottom <= 145, `Round 2: mobile HUD too tall: ${JSON.stringify(mobileAudit.header)}`);
await page.screenshot({ path: path.join(shotDir, '06_village_mobile_overview.png') });
assert(runtimeErrors.length === 0, `Round 2 runtime errors: ${runtimeErrors.join(' | ')}`);
console.log(`ROUND 2 PASS: mobile bounds ${mobileAudit.header.width}px wide, 0 runtime errors`);

await browser.close();
