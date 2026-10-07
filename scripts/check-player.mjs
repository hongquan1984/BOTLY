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
    // Navigate and go into player
    await send('Page.navigate', { url: 'http://localhost:3000/night-companion' });
    await new Promise(r => setTimeout(r, 1000));

    // Click Night 1
    await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll(".group")[0]?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // In intro screen, click "Prepare for tonight"
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Prepare") || b.innerText.includes("Chuẩn bị"))?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // In tonight state screen, click first option if present
    await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("button")[1]?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // If in prep screen, skip prep to audio
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Listen now") || b.innerText.includes("Nghe ngay"))?.click()'
    });
    await new Promise(r => setTimeout(r, 1000));

    const evalRes = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, playerHeight: document.querySelector("section")?.offsetHeight })'
    });
    console.log('Player info:', JSON.parse(evalRes.result.value));
    
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-view.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Saved player-view.png');
    process.exit(0);
  });
})();
