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

  ws.addEventListener('open', async () => {
    const evalRes = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ url: window.location.href, text: document.body.innerText.slice(0, 300), buttons: Array.from(document.querySelectorAll("button")).map(b => b.innerText.trim()) })'
    });
    console.log('Current state:', JSON.parse(evalRes.result.value));
    
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/live-screen.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved live-screen.png');
    process.exit(0);
  });
})();
