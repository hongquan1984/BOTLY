import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, ['--remote-debugging-port=9232', '--headless=new', '--disable-extensions', '--window-size=390,844', 'about:blank']);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9232/json/list').then(r => r.json());
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
      await send('Runtime.evaluate', { expression: 'document.querySelectorAll(".hc-rpg-dock-btn")[1].click()' });
      await new Promise(r => setTimeout(r, 1200));

      const res = await send('Runtime.evaluate', { expression: `(() => {
        try {
          const modal = document.querySelector('.hc-game-modal');
          if (!modal) return { err: "no modal" };
          const els = Array.from(modal.querySelectorAll('*')).map(el => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return {
              tag: el.tagName,
              cls: el.className,
              left: Math.round(r.left),
              right: Math.round(r.right),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              w: Math.round(r.width),
              h: Math.round(r.height),
              border: s.border,
              boxShadow: s.boxShadow
            };
          }).filter(e => e.w > 0 && e.h > 10 && (e.border || e.boxShadow));
          return { count: els.length, items: els.slice(0, 20) };
        } catch(e) {
          return { err: e.message };
        }
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
