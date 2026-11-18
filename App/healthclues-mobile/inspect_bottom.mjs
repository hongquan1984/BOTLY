
import { chromium } from 'file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:8081/world', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const texts = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('*'));
  return all
    .filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top > 650 && rect.bottom < 844 && el.innerText && el.children.length === 0;
    })
    .map(el => el.innerText.trim());
});

console.log('Texts at bottom:', Array.from(new Set(texts)));
await browser.close();
