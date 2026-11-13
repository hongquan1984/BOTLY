(async () => {
  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await versionRes.json();
    const pageTab = tabs.find(t => t.type === 'page');
    if (pageTab) {
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
        await send('Page.navigate', { url: 'https://www.botly.vn/night-companion' });
        await new Promise(r => setTimeout(r, 2000));
        // Click Night 1
        await send('Runtime.evaluate', {
          expression: `
            (() => {
              const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Night 1') || b.innerText.includes('Continue'));
              if (btn) btn.click();
            })()
          `
        });
        await new Promise(r => setTimeout(r, 1200));
        // Click Prepare for tonight
        await send('Runtime.evaluate', {
          expression: `
            (() => {
              const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Prepare for tonight') || b.innerText.includes('Listen now'));
              if (btn) btn.click();
            })()
          `
        });
        ws.close();
      });
    }
  } catch (err) {
    console.error(err);
  }
})();
