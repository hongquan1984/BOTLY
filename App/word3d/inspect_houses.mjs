import path from "path";
import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

const ARTIFACTS_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";

async function inspectHouses() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  
  await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
  
  // Wait until loading screen disappears
  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('.loading-overlay') || document.querySelector('#loading') || Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('Loading Medieval Village'));
      return !el;
    }, { timeout: 25000 });
  } catch (e) {
    console.log("Loading wait finished/timed out:", e.message);
  }

  await page.waitForTimeout(4000);

  // Take full overview
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "inspect_village_full_overview.png") });

  await browser.close();
  console.log("Captured inspect_village_full_overview.png");
}

inspectHouses().catch(console.error);
