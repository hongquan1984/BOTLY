import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(2000);
  const badge = page.locator('.stats-badge');
  if (await badge.count() > 0) {
    const text = await badge.innerText();
    console.log('=== REAL-TIME BASELINE STATS ===\n' + text);
  } else {
    console.log('No stats badge found, dumping body classes:');
    const html = await page.content();
    console.log(html.slice(0, 500));
  }
  await browser.close();
}

main().catch(console.error);
