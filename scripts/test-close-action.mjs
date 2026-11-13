import net from "node:net";
import { spawn } from "node:child_process";

async function main() {
  const probe = net.createServer();
  const debugPort = await new Promise(r => probe.listen(0, '127.0.0.1', () => { const p = probe.address().port; probe.close(() => r(p)); }));
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--remote-debugging-port=' + debugPort, '--headless=new', '--no-first-run', '--window-size=390,844',
    'http://127.0.0.1:3329/play-demo.html'
  ]);
  await new Promise(r => setTimeout(r, 3500));
  const res = await fetch('http://127.0.0.1:' + debugPort + '/json/list');
  const json = await res.json();
  const target = json.find(p => p.webSocketDebuggerUrl);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params) => new Promise(r => {
    const cur = id++;
    const h = (e) => { const d = JSON.parse(e.data); if (d.id === cur) { ws.removeEventListener('message', h); r(d.result); } };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  const check1 = await send('Runtime.evaluate', {
    expression: '(() => ({ modal: Boolean(document.querySelector(".hc-game-modal")), hash: window.location.hash }))()',
    returnByValue: true
  });
  console.log('Before close:', check1.result.value);

  const clickRes = await send('Runtime.evaluate', {
    expression: '(() => { const btn = document.querySelector("[data-close-game-modal]"); if (btn) { btn.click(); return { clicked: true, tag: btn.tagName, text: btn.innerText }; } return { clicked: false }; })()',
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.value);

  await new Promise(r => setTimeout(r, 1000));

  const check2 = await send('Runtime.evaluate', {
    expression: '(() => ({ modal: Boolean(document.querySelector(".hc-game-modal")), hash: window.location.hash }))()',
    returnByValue: true
  });
  console.log('After close:', check2.result.value);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
