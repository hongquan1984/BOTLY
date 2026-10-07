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
      console.log('Navigating to http://localhost:3000/night-companion...');
      await send('Page.navigate', { url: 'http://localhost:3000/night-companion' });
      
      // Wait until loaded
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 300));
        const res = await send('Runtime.evaluate', {
          expression: 'document.body.innerText.includes("7-Night Gentle Sleep Path")'
        });
        if (res.result.value) break;
      }
      
      // 1. Capture Journey Map
      const mapMetrics = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, sectionHeight: document.querySelector("section")?.offsetHeight })'
      });
      console.log('Map Metrics:', JSON.parse(mapMetrics.result.value));

      let ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/journey-map-clean.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved journey-map-clean.png');

      // 2. Open Modal (Night 2)
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll(".group")).find(el => el.innerText.includes("Rediscover Calm"))?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      const modalMetrics = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ hasModal: Boolean(document.querySelector(".fixed")), modalHeight: document.querySelector(".fixed > div")?.offsetHeight, modalScrollHeight: document.querySelector(".fixed > div")?.scrollHeight })'
      });
      console.log('Modal Metrics:', JSON.parse(modalMetrics.result.value));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/modal-clean.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved modal-clean.png');

      // Close modal
      await send('Runtime.evaluate', {
        expression: 'document.querySelector(".fixed button")?.click()'
      });
      await new Promise(r => setTimeout(r, 400));

      // 3. Click Night 1 CTA
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button, .group")).find(el => el.innerText.includes("Start Night 1") || el.innerText.includes("Continue Night 1") || el.innerText.includes("Night 1"))?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      // In intro, click "Prepare for tonight"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Prepare for tonight"))?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      // In tonight state, pick first option
      await send('Runtime.evaluate', {
        expression: 'document.querySelectorAll("button")[1]?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      // If prep module, click "Listen now (skip prep)"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Listen now"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1000));

      // 4. Player Metrics & Screenshot
      const playerMetrics = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, sectionHeight: document.querySelector("section")?.offsetHeight, isPlayer: Boolean(document.querySelector("audio")) })'
      });
      console.log('Player Metrics:', JSON.parse(playerMetrics.result.value));

      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-clean.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved player-clean.png');

      console.log('SUCCESS! All views captured.');
    } catch (err) {
      console.error('Error during capture:', err);
    } finally {
      process.exit(0);
    }
  });
})();
