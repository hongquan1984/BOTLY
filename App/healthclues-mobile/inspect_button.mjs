import { chromium } from 'file:///d:/botly/App/word3d/node_modules/playwright-core/index.mjs';

async function test() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  page.on('console', (msg) => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err));

  await page.goto('http://localhost:8081/(onboarding)/quiz');
  await page.waitForTimeout(1000);

  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter((el) => el.innerText && el.innerText.includes('Bắt Đầu'))
      .map((el) => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        tabIndex: el.getAttribute('tabindex'),
        textContent: el.textContent,
      }));
  });
  console.log('Buttons:', JSON.stringify(btns.slice(-5), null, 2));

  // Now let's try clicking the exact button
  console.log('Clicking button[aria-label="welcome-start-btn"]...');
  const locator = page.locator('button[aria-label="welcome-start-btn"]');
  console.log('Count:', await locator.count());
  await locator.first().click();
  await page.waitForTimeout(2000);

  const currentStepText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('After click text snippet:\n', currentStepText);

  await browser.close();
}

test().catch(console.error);
