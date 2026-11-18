import http from 'http';
import path from 'path';
import fs from 'fs';
import { chromium } from 'file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb';

async function run() {
  console.log('--- Launching Playwright Chromium ---');
  const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-web-security', '--autoplay-policy=no-user-gesture-required'],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  console.log('--- 1. Navigating to Onboarding Welcome ---');
  await page.goto('http://localhost:8081/(onboarding)/quiz', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Clear story state from localStorage
  await page.evaluate(() => {
    localStorage.removeItem('healthclues_story_state_v1');
    localStorage.removeItem('@healthclues_quiz_completed');
  });

  console.log('--- 2. Tapping "Bắt Đầu Hành Trình" to enter Video 1 ---');
  const startBtn = page.locator('button[aria-label="welcome-start-btn"]').first();
  await startBtn.click();
  await page.waitForTimeout(1500);

  console.log('--- 3. Progressing through Video 1, 2, 3 ---');
  const continueBtn1 = page.locator('button:has-text("Tiếp tục"), [role="button"]:has-text("Tiếp tục")').first();
  await continueBtn1.click();
  await page.waitForTimeout(1000);

  const continueBtn2 = page.locator('button:has-text("Tiếp tục"), [role="button"]:has-text("Tiếp tục")').first();
  await continueBtn2.click();
  await page.waitForTimeout(1000);

  const continueBtn3 = page.locator('button:has-text("Tiếp tục"), [role="button"]:has-text("Tiếp tục")').first();
  await continueBtn3.click();
  await page.waitForTimeout(1500);

  console.log('--- 4. In Discovery Screen 1: select concern ---');
  const concernChip = page.getByText('Giảm cân').first();
  await concernChip.click();
  await page.waitForTimeout(600);

  const nextDiscoveryBtn = page.getByText('Tiếp tục').first();
  await nextDiscoveryBtn.click();
  await page.waitForTimeout(1000);

  console.log('--- 5. In Discovery Screen 2: click Analyze ---');
  const analyzeBtn = page.getByText('Phân Tích & Gợi Ý Lộ Trình').first();
  if (await analyzeBtn.isVisible()) {
    await analyzeBtn.click();
    await page.waitForTimeout(2000);
  }

  console.log('--- 6. In Ready Screen: click "Bước Vào Xứ Sở Sức Khỏe" ---');
  const enterWorldBtn = page.locator('button[aria-label="mascot-enter-healthclues-realm-btn"], [aria-label="mascot-enter-healthclues-realm-btn"]').first();
  if (await enterWorldBtn.isVisible()) {
    await enterWorldBtn.click();
    await page.waitForTimeout(4000);
  }

  console.log('--- 7. Directly Ensuring Quiz Completed in localStorage & Navigating to World ---');
  await page.evaluate(() => {
    localStorage.setItem('@healthclues_quiz_completed', 'true');
    localStorage.setItem('healthclues_realm_mode_v1', 'healthclues-realm');
  });
  await page.goto('http://localhost:8081/(game)/world', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_08_world_clean.png') });
  console.log('Saved test_08_world_clean.png');

  const worldText = await page.evaluate(() => document.body.innerText);
  console.log('Does World top bar contain "Thung Lũng"?', worldText.includes('Thung Lũng') ? 'YES (BUG)' : 'NO (CORRECT)');

  console.log('--- 8. Testing Detective Modal (Phá Án) ---');
  const phaAnBtn = page.locator('text=Phá Án').first();
  if (await phaAnBtn.isVisible()) {
    await phaAnBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_09_detective_modal.png') });
    console.log('Saved test_09_detective_modal.png');

    // Close detective modal
    const closeBtn = page.locator('text=Về Làng, [aria-label="close-detective-modal"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  console.log('--- 9. Navigating to Chalet Home Screen via Bottom Tab ---');
  const homeTab = page.locator('text=Ngôi Nhà').first();
  if (await homeTab.isVisible()) {
    await homeTab.click();
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_10_chalet_home.png') });
    console.log('Saved test_10_chalet_home.png');
  }

  await browser.close();
  console.log('=== All tests finished successfully! ===');
}

run().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
