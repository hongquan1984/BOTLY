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
    // Click Dim screen while audio is playing
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const dimBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Dim screen'));
          if (dimBtn) dimBtn.click();
          await new Promise(r => setTimeout(r, 800));
          const audios = Array.from(document.querySelectorAll('audio')).map(a => ({
            src: a.src,
            paused: a.paused,
            currentTime: a.currentTime
          }));
          return {
            hasBlackout: Boolean(document.querySelector('[aria-label="Wake screen"]')),
            audios
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/zen-player-playing-in-blackout.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved zen-player-playing-in-blackout.png!');
    ws.close();
  });
})();
