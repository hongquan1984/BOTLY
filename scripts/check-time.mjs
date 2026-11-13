(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('night-companion'));
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
    const status = await send('Runtime.evaluate', {
      expression: `JSON.stringify(Array.from(document.querySelectorAll('audio')).map(a => ({
        src: a.src,
        paused: a.paused,
        currentTime: a.currentTime
      })))`
    });
    const tracks = JSON.parse(status.result.value);
    tracks.forEach(t => {
      if (!t.paused) console.log(' -> PLAYING:', t.src, '| Time:', t.currentTime.toFixed(1) + 's');
    });
    ws.close();
    process.exit(0);
  });
})();
