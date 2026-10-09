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
          const results = [];
          for (const a of Array.from(document.querySelectorAll('audio'))) {
            try {
              await a.play();
              results.push({ src: a.src, status: 'ok' });
              a.pause();
            } catch (err) {
              results.push({ src: a.src, status: 'error', errorName: err.name, errorMessage: err.message });
            }
          }
          return JSON.stringify(results);
        })()
      `,
      awaitPromise: true
    });
    console.log('INDIVIDUAL AUDIO TEST:');
    console.log(JSON.parse(res.result.value));
    ws.close();
    process.exit(0);
  });
})();
