import { spawn } from 'node:child_process';
import path from 'node:path';
import { writeFileSync } from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, ['--remote-debugging-port=9228', '--headless=new', '--disable-extensions', '--window-size=390,844', 'about:blank']);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9228/json/list').then(r => r.json());
    const ws = new WebSocket(list.find(p => !p.url.startsWith('chrome-')).webSocketDebuggerUrl);
    ws.onopen = async () => {
      let id = 1;
      const send = (m, p={}) => new Promise(res => {
        const cur = id++;
        const fn = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', fn); res(d.result); }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: cur, method: m, params: p }));
      });
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await send('Page.navigate', { url: 'http://127.0.0.1:3329/play-demo.html' });
      await new Promise(r => setTimeout(r, 3500));
      
      // Click Journey
      await send('Runtime.evaluate', { expression: 'document.querySelectorAll(".hc-rpg-dock-btn")[1].click()' });
      await new Promise(r => setTimeout(r, 1200));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync('d:\\botly\\App\\.tmp\\healthclues-tester\\screenshots\\debug-journey-real.png', Buffer.from(shot.data, 'base64'));
      
      const res = await send('Runtime.evaluate', { expression: `(() => {
        const card = document.querySelector('.hc-active-goal-card');
        const allCardEls = Array.from(card.querySelectorAll('*')).map(el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return {
            tag: el.tagName,
            class: el.className,
            text: el.innerText?.slice(0, 30),
            width: r.width,
            whiteSpace: s.whiteSpace,
            minWidth: s.minWidth,
            flexShrink: s.flexShrink
          };
        }).filter(el => el.width > 280);

        return {
          wideElementsInCard: allCardEls
        };
      })()`, returnByValue: true });
      
      console.log(JSON.stringify(res.result.value, null, 2));
      proc.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    proc.kill();
    process.exit(1);
  }
}, 1000);
