import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function checkMobileIframe() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 412, height: 860 } });
  await context.addInitScript(() => {
    window.localStorage.setItem("healthclues-starter-profile", JSON.stringify({
      quest: "glucose",
      topic: "Đường huyết / Tiểu đường",
      twoWeekGoal: "Ổn định đường huyết và giảm cảm giác thèm ngọt",
      profile: { primaryConcernId: "glucose" }
    }));
    window.localStorage.setItem("healthclues-onboarding-completed", "true");
    window.localStorage.setItem("healthclues-post-tour-roadmap-reviewed-v1", "true");
    window.localStorage.setItem("healthclues-cinematic-tour-dismissed", "true");
  });

  const page = await context.newPage();
  page.on("console", (m) => console.log(`[PAGE CONSOLE] ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[PAGE ERROR] ${e}`));

  await page.goto("http://localhost:8081/(game)/world", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);

  // Check frames
  const frames = page.frames();
  console.log("Frames count:", frames.length);
  for (const f of frames) {
    console.log("Frame URL:", f.url());
    if (f.url().includes("5173")) {
      const state = await f.evaluate(() => {
        const s = window.__systems;
        return {
          hasSystems: !!s,
          buildingsCount: s?.buildings?.length,
          lumiMesh: !!s?.lumiCompanion,
        };
      });
      console.log("Frame state:", state);
    }
  }

  // Dismiss any tour modal if present
  try {
    const skipBtn = await page.$('text="Bỏ qua"');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}

  const ARTIFACT_DIR = "C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb";
  await page.screenshot({ path: `${ARTIFACT_DIR}/qa_lumi_04_mobile_integrated.png` });
  console.log("Saved updated qa_lumi_04_mobile_integrated.png");

  // Check iframe element
  const iframeInfo = await page.evaluate(() => {
    const ifr = document.querySelector("iframe");
    return {
      src: ifr ? ifr.src : null,
      w: ifr ? ifr.offsetWidth : null,
      h: ifr ? ifr.offsetHeight : null,
      display: ifr ? getComputedStyle(ifr).display : null,
    };
  });
  console.log("Iframe info:", iframeInfo);

  await browser.close();
}

checkMobileIframe();
