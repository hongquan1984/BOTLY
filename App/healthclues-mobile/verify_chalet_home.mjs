import path from 'path';
import { chromium } from 'file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb';

async function run() {
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-web-security'],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Set quiz completed so we can access home
  await page.goto('http://localhost:8081/(onboarding)/quiz');
  await page.evaluate(() => {
    localStorage.setItem('healthclues-onboarding-completed', 'true');
    localStorage.setItem('@healthclues_quiz_completed', 'true');
    localStorage.setItem('healthclues_realm_mode_v1', 'healthclues-realm');
  });

  console.log('Navigating to Chalet Home...');
  await page.goto('http://localhost:8081/(game)/home', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_10_chalet_home.png') });
  console.log('Saved test_10_chalet_home.png');

  await browser.close();
}

run().catch(console.error);
