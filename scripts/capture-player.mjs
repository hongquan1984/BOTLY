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
    try {
      // Navigate to night-companion
      await send('Page.navigate', { url: 'http://localhost:3000/night-companion' });
      await new Promise(r => setTimeout(r, 1500));

      // Click "Start Night 1 — Free"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button, .group")).find(el => el.innerText.includes("Night 1") || el.innerText.includes("Start"))?.click()'
      });
      await new Promise(r => setTimeout(r, 800));

      // In Night 1 intro, click "Prepare for tonight"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Prepare for tonight"))?.click()'
      });
      await new Promise(r => setTimeout(r, 800));

      // In tonight state, pick first option: "My mind won't stop"
      await send('Runtime.evaluate', {
        expression: 'document.querySelectorAll("button")[1]?.click()'
      });
      await new Promise(r => setTimeout(r, 800));

      // In prep module, click "Listen now (skip prep)"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Listen now"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1200));

      const playerMetrics = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, playerHeight: document.querySelector("section")?.offsetHeight, hasAudio: Boolean(document.querySelector("audio")) })'
      });
      console.log('Player metrics:', JSON.parse(playerMetrics.result.value));

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-clean.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved player-clean.png!');
    } catch (e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
})();
