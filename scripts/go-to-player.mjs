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
      // Step 0: Fill bedtime & wake time
      await send('Runtime.evaluate', {
        expression: `
          const inputs = document.querySelectorAll('input[type="time"]');
          if (inputs[0]) {
            inputs[0].value = '23:00';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (inputs[1]) {
            inputs[1].value = '07:00';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
          }
        `
      });
      await new Promise(r => setTimeout(r, 400));

      // Click Continue
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Continue"))?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      // Step 1: Last hour behavior
      await send('Runtime.evaluate', {
        expression: 'document.querySelectorAll("button")[1]?.click()'
      });
      await new Promise(r => setTimeout(r, 400));
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Continue"))?.click()'
      });
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Create profile
      await send('Runtime.evaluate', {
        expression: 'document.querySelectorAll("button")[1]?.click()'
      });
      await new Promise(r => setTimeout(r, 400));
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Create my Night Profile"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1200));

      // Now on Tonight State screen: select "My mind won't stop"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("My mind won\'t stop"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1200));

      // Now on Prep module: click "Listen now (skip prep)"
      await send('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Listen now"))?.click()'
      });
      await new Promise(r => setTimeout(r, 1500));

      // Now on Player Screen!
      const playerMetrics = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, sectionHeight: document.querySelector("section")?.offsetHeight, hasAudio: Boolean(document.querySelector("audio")), title: document.querySelector("h2")?.innerText })'
      });
      console.log('PLAYER SCREEN METRICS:', JSON.parse(playerMetrics.result.value));

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/verified-04-player-compact.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved verified-04-player-compact.png!');
    } catch (e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
})();
