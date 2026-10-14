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
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const delta = document.querySelector('audio[src*="delta"]');
          const cocoon = document.querySelector('audio[src*="cocoon"]');
          const pacer = document.querySelector('audio[src*="pacers"]');
          const bg = document.querySelector('audio[src*="music"]');
          
          const testEl = async (name, el) => {
            if (!el) return { name, exists: false };
            try {
              el.volume = 0.5;
              await el.play();
              const playing = !el.paused;
              el.pause();
              return { name, exists: true, src: el.src, playing, duration: el.duration, error: el.error };
            } catch (err) {
              return { name, exists: true, src: el.src, errorName: err.name, errorMsg: err.message };
            }
          };

          return {
            delta: await testEl('delta', delta),
            cocoon: await testEl('cocoon', cocoon),
            pacer: await testEl('pacer', pacer),
            bg: await testEl('bg', bg)
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Results:', JSON.stringify(res.result.value, null, 2));
    ws.close();
    process.exit(0);
  });
})();
