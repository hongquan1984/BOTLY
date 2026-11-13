(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise(r => {
    const msgId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === msgId) { ws.removeEventListener('message', handler); r(msg.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  ws.addEventListener('open', async () => {
    // Click retry or start button and inspect
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Retry') || b.innerText.includes('Start'));
          if (btn) {
            btn.click();
            await new Promise(r => setTimeout(r, 1000));
            const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start'));
            if (startBtn) {
              startBtn.click();
              await new Promise(r => setTimeout(r, 1000));
            }
          }
          return {
            innerText: document.body.innerText.substring(0, 500),
            audios: Array.from(document.querySelectorAll('audio')).map(a => ({
              src: a.src,
              paused: a.paused,
              currentTime: a.currentTime
            }))
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
    
    // Screenshot
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/zen-player-playing-retried.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved zen-player-playing-retried.png!');
    ws.close();
  });
})();
