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
          const audios = Array.from(document.querySelectorAll('audio'));
          const results = [];
          for (const a of audios) {
            try {
              // Try to load and check readyState
              results.push({
                src: a.src,
                readyState: a.readyState,
                networkState: a.networkState,
                error: a.error ? { code: a.error.code, message: a.error.message } : null,
                duration: a.duration,
                paused: a.paused
              });
            } catch (e) {
              results.push({ src: a.src, error: e.message });
            }
          }
          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Audios state:', JSON.stringify(res.result.value, null, 2));
    ws.close();
    process.exit(0);
  });
})();
