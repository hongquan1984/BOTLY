import WebSocket from 'file:///d:/botly/node_modules/ws/index.js';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

async function main() {
  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9246', '--headless=new', '--disable-gpu', '--window-size=1280,800'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch('http://127.0.0.1:9246/json/list');
  const list = await res.json();
  const page = list.find(item => item.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (data) => {
        const m = JSON.parse(data.toString());
        if (m.id === id) { ws.off('message', handler); resolve(m.result); }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3450' });
  await new Promise(r => setTimeout(r, 2500));

  const info = await send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.getElementById('home-chibi-companion');
      const img = document.getElementById('chibi-sprite-el');
      return {
        companionFound: !!c,
        display: c ? window.getComputedStyle(c).display : null,
        left: c?.style?.left,
        top: c?.style?.top,
        zIndex: c?.style?.zIndex,
        imgSrc: img?.getAttribute('src'),
        modalDailyOpen: document.getElementById('modal-daily-reward')?.classList?.contains('is-open')
      };
    })()`,
    returnByValue: true
  });
  console.log('Companion status:', JSON.stringify(info.result.value, null, 2));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/685e195b-af4b-4fee-8d91-49c1fcd4597d/75-live-chalet-with-chibi-companion.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved 75-live-chalet-with-chibi-companion.png');

  chromeProc.kill();
  process.exit(0);
}

main().catch(console.error);
