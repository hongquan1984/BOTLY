import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => console.log(`[PAGE ERROR]`, err));

  await page.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const res = await page.evaluate(() => {
    // Check if webgl shader compiled
    const canvas = document.querySelector("canvas");
    return {
      canvasExists: !!canvas,
      canvasW: canvas?.width,
      canvasH: canvas?.height,
    };
  });
  console.log("Evaluate:", res);
  await browser.close();
}

run();
