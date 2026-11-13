import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('Navigating to Quiz...');
  await page.goto('http://127.0.0.1:3329/vi/wellness/healthclues/quiz', { waitUntil: 'networkidle2' });
  console.log('Page loaded:', page.url());

  // Click Begin My Adventure
  const beginBtn = await page.waitForSelector('button:has-text("Bắt đầu"), button:has-text("Begin My Adventure")', { timeout: 5000 }).catch(() => null);
  if (beginBtn) {
    console.log('Found begin button, clicking...');
    await beginBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  } else {
    // maybe button with text
    const btns = await page.$$eval('button', els => els.map(e => ({ text: e.innerText.trim(), class: e.className })));
    console.log('Buttons on page:', btns);
    const startBtn = await page.$('button[class*="actionPrimary"], button');
    if (startBtn) await startBtn.click();
  }

  await new Promise(r => setTimeout(r, 1000));
  console.log('Current state after begin:', await page.evaluate(() => ({
    url: window.location.href,
    h1: document.querySelector('h1')?.innerText,
    buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim())
  })));

  await browser.close();
})();
