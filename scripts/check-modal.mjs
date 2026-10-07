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
    // Click on Night 2 or Night 7
    await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll(".group")[1]?.click()'
    });
    await new Promise(r => setTimeout(r, 600));
    
    const evalRes = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ hasModal: Boolean(document.querySelector(".fixed")), modalHeight: document.querySelector(".fixed > div")?.offsetHeight, modalScrollHeight: document.querySelector(".fixed > div")?.scrollHeight })'
    });
    console.log('Modal info:', JSON.parse(evalRes.result.value));
    
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/modal-view.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Saved modal-view.png');
    process.exit(0);
  });
})();
