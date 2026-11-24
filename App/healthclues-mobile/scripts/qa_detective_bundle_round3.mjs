import { chromium } from "file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs";
import fs from "node:fs";

const base = "http://127.0.0.1:8100";
const out = "D:/botly/App/reports/previews";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--no-sandbox", "--disable-gpu-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.addInitScript(() => { localStorage.setItem("healthclues-onboarding-completed", "true"); localStorage.setItem("hc_onboarding_done", "true"); localStorage.setItem("guest_session", JSON.stringify({ guest: true, nickname: "Lữ Khách" })); });
await page.goto(`${base}/world`, { waitUntil: "networkidle", timeout: 30000 });
const skip = page.getByText("Bỏ qua", { exact: false }).first();
if (await skip.isVisible().catch(() => false)) { await skip.click({ force: true }); await page.waitForTimeout(800); }
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(500);
console.log("buttons", await page.locator("button").allTextContents());
await page.screenshot({ path: `${out}/mobile-detective-round3-world.png`, fullPage: true });
const bodyText = await page.locator("body").innerText();
const detectiveButton = page.getByText("Giải Mã", { exact: true }).first();
if (await detectiveButton.isVisible().catch(() => false)) {
  await detectiveButton.click({ force: true });
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: `${out}/mobile-detective-round3-library.png`, fullPage: true });
const libraryText = await page.locator("body").innerText();
const start = page.getByText("BẮT ĐẦU ĐIỀU TRA", { exact: true }).first();
if (await start.isVisible().catch(() => false)) {
  await start.click({ force: true });
  await page.waitForTimeout(600);
}
await page.screenshot({ path: `${out}/mobile-detective-round3-briefing.png`, fullPage: true });
const beginScene = page.getByText("BẮT ĐẦU ĐIỀU TRA", { exact: true }).first();
if (await beginScene.isVisible().catch(() => false)) { await beginScene.click({ force: true }); await page.waitForTimeout(900); }
console.log("sceneVisible", await page.getByText("Sổ (0)", { exact: true }).isVisible().catch(() => false));
const earlyGate = page.getByText("Soi đủ 6 vật chứng", { exact: true }).first();
if (!(await earlyGate.isVisible().catch(() => false))) throw new Error("0/6 evidence gate label is missing");
await earlyGate.click({ force: true });
await page.waitForTimeout(250);
if (await page.getByText("BẢNG KẾT LUẬN", { exact: false }).isVisible().catch(() => false)) throw new Error("0/6 opened conclusion");
console.log("gate0 blocked");
console.log("sceneSvgs", await page.locator("svg").evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((item) => item.w <= 24 && item.h <= 24)));
const hotspotCoords = [[125,235],[23,261],[369,298],[277,311],[86,339],[320,352]];
let inspected = 0;
for (const [x, y] of hotspotCoords) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(250);
  if ((await page.locator("body").innerText()).includes("VẬT CHỨNG ĐÃ SOI")) {
    inspected++;
    const saveClue = page.getByText("Lưu vào Sổ Manh Mối", { exact: false }).first();
    if (await saveClue.isVisible().catch(() => false)) { await saveClue.click({ force: true }); await page.waitForTimeout(200); }
    if (inspected === 5) {
      const fiveGate = page.getByText("Soi đủ 6 vật chứng", { exact: true }).first();
      if (!(await fiveGate.isVisible().catch(() => false))) throw new Error("5/6 evidence gate label is missing");
      await fiveGate.click({ force: true });
      await page.waitForTimeout(200);
      if (await page.getByText("BẢNG KẾT LUẬN", { exact: false }).isVisible().catch(() => false)) throw new Error("5/6 opened conclusion");
      console.log("gate5 blocked");
    }
  }
}
await page.screenshot({ path: `${out}/mobile-detective-round3-scene-all-clues.png`, fullPage: true });
const notebook = page.getByText(/Sổ \(/).first();
if (await notebook.isVisible().catch(() => false)) { await notebook.click({ force: true }); await page.waitForTimeout(500); }
await page.screenshot({ path: `${out}/mobile-detective-round3-notebook.png`, fullPage: true });
const conclusionButton = page.getByText("ĐẾN BẢNG KẾT LUẬN", { exact: true }).first();
if (await conclusionButton.isVisible().catch(() => false)) { await conclusionButton.click({ force: true }); await page.waitForTimeout(500); }
await page.screenshot({ path: `${out}/mobile-detective-round3-conclusion-initial.png`, fullPage: true });
console.log("inspected", inspected, "conclusionVisible", await page.getByText(/BẢNG KẾT LUẬN/).isVisible().catch(() => false));
const clickLabel = async (label) => { const loc = page.getByText(label, { exact: false }).first(); if (!(await loc.count())) return false; await loc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {}); if (!(await loc.isVisible({ timeout: 1500 }).catch(() => false))) return false; const box = await loc.boundingBox(); if (!box) return false; await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(220); return true; };
const wrong = page.getByText("Ly cà phê Cold Brew trên bàn", { exact: true }).first();
console.log("wrongClicked", await clickLabel("Ly cà phê Cold Brew trên bàn"));
const compare = page.getByText("ĐỐI CHIẾU KẾT LUẬN", { exact: true }).first();
if (await compare.isVisible().catch(() => false)) { await compare.click({ force: true }); await page.waitForTimeout(350); }
await page.screenshot({ path: `${out}/mobile-detective-round3-wrong-answer.png`, fullPage: true });
await clickLabel("Ly cà phê Cold Brew trên bàn");
for (const label of ["Sử dụng điện thoại trên giường", "Lịch ngủ thất thường trong tuần", "Làm việc căng thẳng khuya", "Ánh sáng phòng & Cửa sổ không kéo rèm"]) {
  await clickLabel(label);
}
if (await compare.isVisible().catch(() => false)) { await compare.click({ force: true }); await page.waitForTimeout(350); }
await page.screenshot({ path: `${out}/mobile-detective-round3-correct-checklist.png`, fullPage: true });
console.log("afterCorrect", (await page.locator("body").innerText()).slice(-900));
for (const action of ["Cất điện thoại và ngưng tiếp xúc màn hình sáng 45–60 phút trước khi ngủ.", "Ngừng xử lý công việc trên Laptop ít nhất 1 tiếng trước giờ lên giường.", "Kéo kín rèm cửa ban công và tắt các đèn sáng khi bắt đầu ngủ.", "Cố định khung giờ đi ngủ – thức dậy đều đặn kể cả cuối tuần."]) { await clickLabel(action); }
const rewardButton = page.getByText("XÁC NHẬN CHECKLIST & NHẬN THƯỞNG", { exact: true }).first();
if (await rewardButton.isVisible().catch(() => false)) { await rewardButton.click({ force: true }); await page.waitForTimeout(700); }
await page.screenshot({ path: `${out}/mobile-detective-round3-solved.png`, fullPage: true });
console.log("solvedVisible", await page.getByText("Hồ sơ đã phá giải hoàn toàn", { exact: true }).isVisible().catch(() => false));
console.log(JSON.stringify({ url: page.url(), bodyHasDetective: /Phá Án|Hồ Sơ Vụ Án/.test(bodyText), libraryHasHud: /HỒ SƠ VỤ ÁN THÁM TỬ/.test(libraryText), errors }));
await browser.close();
