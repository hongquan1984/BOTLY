import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const probe = net.createServer();
const debugPort = await new Promise((r) => {
  probe.listen(0, '127.0.0.1', () => {
    const port = probe.address().port;
    probe.close(() => r(port));
  });
});

const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`,
  '--headless=new',
  '--disable-gpu',
  '--window-size=390,844',
  'http://127.0.0.1:8081/world'
]);

await new Promise(r => setTimeout(r, 2500));
const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
const [page] = await res.json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 0;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const curId = ++id;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

const styles = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const label = Array.from(document.querySelectorAll('div')).find(d => d.textContent === 'Thế Giới' && d.children.length === 0);
      if (!label) return 'not found';
      const cs = window.getComputedStyle(label);
      const parentCs = window.getComputedStyle(label.parentElement);
      return {
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        height: cs.height,
        maxHeight: cs.maxHeight,
        overflow: cs.overflow,
        fontFamily: cs.fontFamily,
        boxSizing: cs.boxSizing,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        parentHeight: parentCs.height,
        parentPadding: parentCs.padding,
        parentOverflow: parentCs.overflow
      };
    })()
  `,
  returnByValue: true
});
console.log('Label computed styles:', styles.result.value);
chromeProc.kill('SIGKILL');
