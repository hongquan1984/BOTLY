import WebSocket from 'file:///d:/botly/node_modules/ws/index.js';
import { spawn } from 'child_process';

async function main() {
  const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--remote-debugging-port=9243', '--headless=new', '--disable-gpu'
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch('http://127.0.0.1:9243/json/list');
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
  await new Promise(r => setTimeout(r, 2000));

  const before = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('modal-daily-reward');
      return {
        masterBlueprintExists: !!window.masterBlueprint,
        itemsCount: window.masterBlueprint?.items?.length,
        currentPlayerProfile: window.currentPlayerProfile,
        modalStyleDisplay: el ? el.style.display : 'not_found',
        computedDisplay: el ? window.getComputedStyle(el).display : 'not_found',
        titleA: document.getElementById('card-title-a')?.textContent,
        imgA: document.getElementById('card-img-a')?.src
      };
    })()`,
    returnByValue: true
  });
  console.log('Page Load Initial State:', JSON.stringify(before.result.value, null, 2));

  await send('Runtime.evaluate', { expression: `openDailyRewardModal()` });
  await new Promise(r => setTimeout(r, 500));

  const after = await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('modal-daily-reward');
      return {
        modalStyleDisplay: el ? el.style.display : 'not_found',
        computedDisplay: el ? window.getComputedStyle(el).display : 'not_found',
        titleA: document.getElementById('card-title-a')?.textContent,
        imgA: document.getElementById('card-img-a')?.src,
        titleB: document.getElementById('card-title-b')?.textContent,
        imgB: document.getElementById('card-img-b')?.src
      };
    })()`,
    returnByValue: true
  });
  console.log('After openDailyRewardModal():', JSON.stringify(after.result.value, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(console.error);
