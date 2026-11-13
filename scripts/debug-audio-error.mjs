(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
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
    const res = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const audios = Array.from(document.querySelectorAll('audio'));
          const results = [];
          for (const a of audios) {
            try {
              await a.play();
              results.push({ src: a.src, status: 'ok', paused: a.paused });
              a.pause();
            } catch (err) {
              results.push({ src: a.src, status: 'error', error: err.name + ': ' + err.message });
            }
          }
          return results;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
    ws.close();
  });
})();
