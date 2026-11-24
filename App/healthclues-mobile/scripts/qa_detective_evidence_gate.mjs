import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "node:fs";

const base = "http://127.0.0.1:8100";
const out = "D:/botly/App/reports/previews";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--disable-gpu-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.addInitScript(() => { localStorage.setItem("healthclues-onboarding-completed", "true"); localStorage.setItem("hc_onboarding_done", "true"); localStorage.setItem("guest_session", JSON.stringify({ guest: true, nickname: "Lữ Khách" })); });
await page.goto(`${base}/world`, { waitUntil: "networkidle", timeout: 30000 });
await page.getByText("Giải Mã", { exact: true }).click();
await page.getByText("BẮT ĐẦU ĐIỀU TRA", { exact: false }).first().click();
await page.waitForTimeout(500);

const sceneHotspots = async () => await page.locator("svg").evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }).filter((item) => item.w === 18 && item.h === 18 && item.y > 100 && item.y < 500));
const gateButton = () => page.getByText(/Soi đủ 6 vật chứng|Kết luận|Suy luận/).last();
const zeroButton = gateButton();
if (!(await page.getByText("Soi đủ 6 vật chứng", { exact: true }).isVisible())) throw new Error("0/6 gate label missing");
await zeroButton.click({ force: true });
if (await page.getByText("BẢNG KẾT LUẬN", { exact: false }).isVisible().catch(() => false)) throw new Error("0/6 opened conclusion");
console.log("0/6 blocked");
await page.screenshot({ path: `${out}/mobile-detective-evidence-gate-0-of-6.png`, fullPage: true });

for (const point of (await sceneHotspots()).slice(0, 5)) {
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(220);
  const save = page.getByText("Lưu vào Sổ Manh Mối", { exact: false }).first();
  if (await save.isVisible().catch(() => false)) await save.click({ force: true });
  await page.waitForTimeout(220);
}
const fiveButton = gateButton();
if (!(await page.getByText("Soi đủ 6 vật chứng", { exact: true }).isVisible())) throw new Error("5/6 gate label missing");
await fiveButton.click({ force: true });
if (await page.getByText("BẢNG KẾT LUẬN", { exact: false }).isVisible().catch(() => false)) throw new Error("5/6 opened conclusion");
console.log("5/6 blocked");
await page.screenshot({ path: `${out}/mobile-detective-evidence-gate-5-of-6.png`, fullPage: true });

for (const point of (await sceneHotspots()).slice(0, 6)) {
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(180);
  const save = page.getByText("Lưu vào Sổ Manh Mối", { exact: false }).first();
  if (await save.isVisible().catch(() => false)) await save.click({ force: true });
  await page.waitForTimeout(180);
}
if (await page.getByText("Soi đủ 6 vật chứng", { exact: true }).isVisible().catch(() => false)) throw new Error("6/6 gate did not unlock");
await page.getByText("Sổ (6)", { exact: true }).click({ force: true });
await page.waitForTimeout(300);
const notebookButton = page.getByText("ĐẾN BẢNG KẾT LUẬN", { exact: true }).first();
await notebookButton.click({ force: true });
await page.waitForTimeout(300);
if (!(await page.getByText("BẢNG KẾT LUẬN", { exact: false }).isVisible())) throw new Error("6/6 did not open conclusion");
await page.screenshot({ path: `${out}/mobile-detective-evidence-gate-6-of-6-conclusion.png`, fullPage: true });
console.log("PASS evidence gate 0/6 disabled, 5/6 disabled, 6/6 enabled and opened conclusion");
await browser.close();
