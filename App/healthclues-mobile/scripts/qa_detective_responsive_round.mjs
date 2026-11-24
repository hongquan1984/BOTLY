import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "node:fs";

const base = "http://127.0.0.1:8100";
const out = "D:/botly/App/reports/previews";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox"] });
const results = [];
for (const [name, width, height] of [["portrait", 390, 844], ["landscape", 844, 390]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.addInitScript(() => { localStorage.setItem("healthclues-onboarding-completed", "true"); localStorage.setItem("hc_onboarding_done", "true"); });
  await page.goto(`${base}/world`, { waitUntil: "networkidle", timeout: 30000 });
  const skip = page.getByText("Bỏ qua", { exact: false }).first();
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.keyboard.press("Escape").catch(() => {});
  await page.mouse.click(width - (name === "portrait" ? 55 : 175), name === "portrait" ? 122 : 77);
  await page.waitForTimeout(450);
  const decode = page.getByText("Giải Mã", { exact: true }).first();
  if (await decode.isVisible().catch(() => false)) { await decode.click({ force: true }); await page.waitForTimeout(600); }
  await page.screenshot({ path: `${out}/mobile-detective-round-responsive-${name}.png`, fullPage: true });
  const chapter2 = page.getByText(/Chương 2:/, { exact: false }).first();
  const chapter2Clickable = await chapter2.isVisible().catch(() => false);
  if (chapter2Clickable) { await chapter2.click({ force: true }); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/mobile-detective-round-responsive-${name}-chapter2.png`, fullPage: true }); }
  const metrics = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  results.push({ name, metrics, library: /HỒ SƠ VỤ ÁN THÁM TỬ/.test(await page.locator("body").innerText()), chapter2Clickable, errors });
  await context.close();
}
await browser.close();
console.log(JSON.stringify(results));
