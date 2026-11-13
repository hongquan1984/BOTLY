(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  const fs = await import('fs');

  ws.addEventListener('open', async () => {
    // 1. Click 'Continue Night 1'
    const clickMap = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue Night 1') || b.innerText.includes('Night 1'));
          if (btn) { btn.click(); return 'clicked map Night 1'; }
          return 'map button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Result 1:', clickMap.result.value);
    await new Promise(r => setTimeout(r, 1200));

    // 2. Click 'Prepare for tonight'
    const clickIntro = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Prepare for tonight'));
          if (btn) { btn.click(); return 'clicked Prepare for tonight'; }
          return 'intro button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Result 2:', clickIntro.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // 3. Capture screenshot of what screen opens next!
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/after-prepare-tonight-clicked.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved after-prepare-tonight-clicked.png!');
    ws.close();
    process.exit(0);
  });
})();
