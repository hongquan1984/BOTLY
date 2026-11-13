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
    // Click 4. Delta
    const resDelta = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('4. Delta'));
          if (btn) { btn.click(); return 'clicked 4. Delta'; }
          return 'btn not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Result Delta:', resDelta.result.value);
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot playing Delta
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-delta-active.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved player-delta-active.png!');

    // Click 5. Cocoon
    const resCocoon = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('5. Cocoon'));
          if (btn) { btn.click(); return 'clicked 5. Cocoon'; }
          return 'btn not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Result Cocoon:', resCocoon.result.value);
    await new Promise(r => setTimeout(r, 1000));

    // Capture screenshot playing Cocoon
    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-cocoon-active.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved player-cocoon-active.png!');

    ws.close();
    process.exit(0);
  });
})();
