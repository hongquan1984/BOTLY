import { chromium } from "file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-web-security"],
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 869 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    window.localStorage.removeItem('healthclues-village-cinematic-tour-v1');
    window.localStorage.setItem('healthclues-quiz-results', JSON.stringify({
      focus: 'sleep',
      category: 'Giấc ngủ & Căng thẳng',
      title: 'Mất ngủ & Khó ngủ',
      symptoms: ['Khó đi vào giấc ngủ', 'Thức giấc nửa đêm'],
      recommendedHerbs: ['Cúc La Mã', 'Lạc Tiên'],
    }));
  });

  console.log('Navigating to http://localhost:8081/(game)/world');
  await page.goto('http://localhost:8081/(game)/world', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/check_live_world_now.png' });
  console.log('Captured check_live_world_now.png');
  await browser.close();
}

run().catch(console.error);
