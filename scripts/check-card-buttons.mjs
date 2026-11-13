import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const chromePath = [
  path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].find(existsSync);

const chromeProc = spawn(chromePath, [
  '--remote-debugging-port=9337',
  '--user-data-dir=d:/botly/App/.tmp/inspect-ui/test-quick5',
  '--headless=new',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9337/json/list');
    const json = await res.json();
    const ws = new WebSocket(json[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(new Error(JSON.stringify(d.error)));
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
    
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:3329/play-demo.html' });
    await new Promise(r => setTimeout(r, 4500));
    
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const goalCards = Array.from(document.querySelectorAll('.hc-active-goal-card'));
        return {
          goalCardsCount: goalCards.length,
          cards: goalCards.map(c => ({
            title: c.querySelector('.hc-quest-card-title')?.innerText.trim(),
            buttons: Array.from(c.querySelectorAll('button')).map(b => ({
              text: b.innerText.trim(),
              disabled: b.disabled,
              className: b.className
            }))
          }))
        };
      })()`,
      returnByValue: true
    });
    console.log('Cards before click:', JSON.stringify(evalRes.result?.value, null, 2));
    
    // Click Day 01
    await send('Runtime.evaluate', {
      expression: `(() => {
        const dayNodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const day1 = dayNodes.find(n => n.innerText.includes('01'));
        if (day1) day1.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const day1Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const goalCards = Array.from(document.querySelectorAll('.hc-active-goal-card'));
        return {
          goalCardsCount: goalCards.length,
          cards: goalCards.map(c => ({
            title: c.querySelector('.hc-quest-card-title')?.innerText.trim(),
            buttons: Array.from(c.querySelectorAll('button')).map(b => ({
              text: b.innerText.trim(),
              disabled: b.disabled,
              className: b.className
            }))
          }))
        };
      })()`,
      returnByValue: true
    });
    console.log('Cards after Day 01 click:', JSON.stringify(day1Res.result?.value, null, 2));

    ws.close();
  } catch(e) {
    console.error(e);
  } finally {
    chromeProc.kill();
  }
}, 1500);
