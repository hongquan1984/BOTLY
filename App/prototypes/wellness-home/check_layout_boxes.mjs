import { spawn } from 'child_process';

const chromeProc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--remote-debugging-port=9222', '--headless=new', '--disable-gpu',
  '--window-size=1440,900'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const list = await res.json();
    const page = list.find(it => it.type === 'page');
    const WebSocket = (await import('ws')).default;
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url: 'http://localhost:3450' } }));
    await new Promise(r => setTimeout(r, 2000));

    ws.send(JSON.stringify({
      id: 2,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const getR = sel => {
              const el = document.querySelector(sel);
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
            };
            return {
              header: getR('.app-header'),
              workspace: getR('.workspace'),
              viewport: getR('.scene-viewport'),
              stage: getR('#scene-stage'),
              decorPanel: getR('.decor-panel')
            };
          })()
        `,
        returnByValue: true
      }
    }));

    ws.on('message', d => {
      const m = JSON.parse(d.toString());
      if (m.id === 2) {
        console.log('LAYOUT BOXES:', JSON.stringify(m.result.result ? m.result.result.value : m.result, null, 2));
        chromeProc.kill();
        process.exit(0);
      }
    });
  } catch (e) {
    console.error(e);
    chromeProc.kill();
    process.exit(1);
  }
}, 1000);
