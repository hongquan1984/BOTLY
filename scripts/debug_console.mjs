import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message));
  await page.goto("http://localhost:5173/?mode=player", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  await browser.close();
}

run().catch(console.error);
