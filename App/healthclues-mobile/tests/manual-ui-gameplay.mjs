import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire('D:/botly/App/3DHOME/package.json');
const { chromium } = require('playwright-core');
const outDir = 'D:/botly/App/healthclues-mobile/reports/manual-ui';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`); });

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  console.log(`SHOT ${name}`);
}
async function body(label) {
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
  console.log(`TEXT ${label} ${text.slice(0, 900)}`);
}

await page.goto('http://127.0.0.1:8100/world', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
await shot('01-initial-world');
await body('initial');

// Exercise the language switch before starting so the same playthrough checks
// the actual English strings used by the player shell.
const english = page.getByText('English', { exact: true });
if (await english.count()) {
  await english.first().click();
  await page.waitForTimeout(250);
}

// If this is a fresh context, complete the minimum onboarding flow.
const start = page.locator('button').filter({ hasText: /Bắt Đầu Hành Trình|Start Journey/i });
console.log(`START_COUNT ${await start.count()}`);
if (await start.count()) {
  await start.first().click({ force: true });
  await page.waitForTimeout(500);
  const skip = page.getByRole('button', { name: /Bỏ qua|Skip/i });
  if (await skip.count()) await skip.first().click();
  await page.waitForTimeout(500);
  const sleep = page.getByText(/Mất ngủ|Sleep/i).first();
  if (await sleep.count()) await sleep.click();
  const cont = page.getByRole('button', { name: /Tiếp tục|Continue|Next/i });
  if (await cont.count()) await cont.last().click();
  await page.waitForTimeout(1400);
}

const enterWorld = page.locator('button').filter({ hasText: /Bước Vào Xứ Sở Sức Khỏe|Enter HealthClues Realm/i });
console.log(`ENTER_WORLD_COUNT ${await enterWorld.count()}`);
if (await enterWorld.count()) {
  await enterWorld.first().click();
  await page.waitForTimeout(2200);
}

const demoLogin = page.locator('button').filter({ hasText: /1 Chạm Đăng Nhập Demo Ngay|One-tap Demo Login/i });
console.log(`DEMO_LOGIN_COUNT ${await demoLogin.count()}`);
if (await demoLogin.count()) {
  await demoLogin.first().click({ force: true });
  await page.waitForTimeout(2200);
}

const introSkip = page.locator('button').filter({ hasText: /^Bỏ qua|^Skip/i });
if (await introSkip.count()) {
  await introSkip.first().click({ force: true });
  await page.waitForTimeout(4500);
}

const roadmapClose = page.locator('[aria-label="Đóng gợi ý thói quen"], [aria-label="Close habit suggestion"]');
if (await roadmapClose.count()) await roadmapClose.first().click();
const investigate = page.locator('button').filter({ hasText: /Giải Mã Hồ Sơ Sức Khỏe|Investigate Health Clues|Investigate/i });
console.log(`INVESTIGATE_COUNT ${await investigate.count()}`);
if (await investigate.count()) {
  await investigate.first().click();
  await page.waitForTimeout(1800);
}
await shot('02-library');
await body('library');
console.log(`BEGIN_TEXT_COUNT ${await page.getByText('BẮT ĐẦU ĐIỀU TRA', { exact: true }).count()} BTN_TOTAL ${await page.locator('button').count()} ROLE_BTN ${await page.locator('[role="button"]').count()}`);

const begin = page.getByText('BẮT ĐẦU ĐIỀU TRA', { exact: true });
console.log(`BEGIN_COUNT ${await begin.count()}`);
if (await begin.count()) {
  await begin.first().click();
  await page.waitForTimeout(1600);
}
await shot('03-briefing-or-scene');
await body('briefing');

const startInvestigation = page.getByText('START INVESTIGATION', { exact: true });
if (await startInvestigation.count()) {
  await startInvestigation.first().click();
  await page.waitForTimeout(1800);
}
await shot('04-scene');
await body('scene');
console.log('POINTS', await page.evaluate(() => document.elementsFromPoint(352, 402).slice(0, 8).map((e) => ({ tag: e.tagName, role: e.getAttribute('role'), text: (e.textContent || '').trim().slice(0, 80), cls: e.className }))));
console.log('HOTSPOT_BOXES', await page.evaluate(() => Array.from(document.querySelectorAll('*')).map((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { tag:e.tagName, x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), opacity:s.opacity, pos:s.position }; }).filter((x) => x.pos === 'absolute' && x.w >= 38 && x.w <= 46 && x.h >= 38 && x.h <= 46).slice(0, 10)));

// Tap the first known bedroom hotspot (phone) and save it.
const scene = page.locator('img').filter({ has: undefined }).last();
const phone = page.locator('[data-testid="hotspot-phone"], [aria-label*="phone" i], [aria-label*="điện thoại" i]');
if (await phone.count()) {
  await phone.first().click();
} else {
  const hotspotBoxes = await page.evaluate(() => Array.from(document.querySelectorAll('*')).map((e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return { x: r.x, y: r.y, w: r.width, h: r.height, pos: s.position };
  }).filter((x) => x.pos === 'absolute' && x.w >= 38 && x.w <= 46 && x.h >= 38 && x.h <= 46));
  if (hotspotBoxes[0]) await page.mouse.click(hotspotBoxes[0].x + hotspotBoxes[0].w / 2, hotspotBoxes[0].y + hotspotBoxes[0].h / 2);
}
await page.waitForTimeout(500);
await shot('05-inspection');
await body('inspection');
const save = page.getByText('Save to Clue Journal', { exact: true });
console.log(`SAVE_COUNT ${await save.count()}`);
if (await save.count()) await save.first().click();
await page.waitForTimeout(400);

// Continue the same playthrough by inspecting the remaining five evidence
// hotspots. Their hit areas are deliberately invisible until touched.
const remainingBoxes = await page.evaluate(() => Array.from(document.querySelectorAll('*')).map((e) => {
  const r = e.getBoundingClientRect();
  const s = getComputedStyle(e);
  return { x: r.x, y: r.y, w: r.width, h: r.height, pos: s.position };
}).filter((x) => x.pos === 'absolute' && x.w >= 38 && x.w <= 46 && x.h >= 38 && x.h <= 46));
for (const box of remainingBoxes) {
  await page.mouse.click(box.x + box.w / 2, box.y + box.h / 2);
  await page.waitForTimeout(180);
  const nextSave = page.getByText('Save to Clue Journal', { exact: true });
  if (await nextSave.count()) {
    await nextSave.first().click();
    await page.waitForTimeout(220);
  }
}
await shot('06-saved-hotspot');
await body('saved');

const journal = page.getByText(/Journal \(6\)|Sổ \(6\)/).first();
console.log(`JOURNAL_COUNT ${await journal.count()}`);
if (await journal.count()) await journal.first().click();
await page.waitForTimeout(600);
await shot('07-journal');
await body('journal');
const guide = page.getByText(/Open Medical Guide/).first();
console.log(`GUIDE_COUNT ${await guide.count()}`);
if (await guide.count()) await guide.first().click();
await page.waitForTimeout(500);
await shot('08-medical-guide');
await body('guide');

const deduction = page.getByText(/OPEN DEDUCTION BOARD|OPEN CONCLUSION|ĐẾN BẢNG SUY LUẬN|ĐẾN BẢNG KẾT LUẬN/, { exact: false }).last();
console.log(`DEDUCTION_COUNT ${await deduction.count()}`);
if (await deduction.count()) {
  await deduction.click();
  await page.waitForTimeout(500);
  await shot('09-conclusion-or-puzzle');
  await body('conclusion');
}

console.log(`ERRORS ${errors.slice(0, 20).join(' || ')}`);
await browser.close();
