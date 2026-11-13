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
    // 1. Wake from blackout
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const overlay = document.querySelector('[aria-label="Wake screen"]');
          if (overlay) overlay.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Click "Finished listening — ready to rest"
    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Finished listening'));
          if (btn) {
            btn.click();
            return 'Clicked: ' + btn.innerText;
          }
          return 'Button not found';
        })()
      `
    });
    console.log(clickRes.result.value);
    await new Promise(r => setTimeout(r, 1200));

    // 3. Inspect resting screen text
    const textRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            innerText: document.body.innerText.substring(0, 500),
            hasPhoneDown: document.body.innerText.includes('You can put the phone down now'),
            hasFadedToSilence: document.body.innerText.includes('faded to silence'),
            hasCloseAndSleep: document.body.innerText.includes('Close & Sleep')
          };
        })()
      `,
      returnByValue: true
    });
    console.log(JSON.stringify(textRes.result.value, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/zen-player-resting-screen.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved zen-player-resting-screen.png!');
    ws.close();
  });
})();
