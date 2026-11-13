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
    // 1. Select Female Whisper first
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Nữ thì thầm"))?.click()'
    });
    await new Promise(r => setTimeout(r, 500));

    // 2. Click "3. Pivot" to jump straight to Stage 3 Cognitive Pivot whisper
    const pivotCoords = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("3. Pivot"));
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return JSON.stringify({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
      })()`
    });
    const coords = JSON.parse(pivotCoords.result.value);
    console.log('Pivot button coords:', coords);

    // Dispatch real trusted mouse click to start Stage 3 Cognitive Pivot
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1
    });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1
    });

    await new Promise(r => setTimeout(r, 1500));

    // Check which track is playing
    const status = await send('Runtime.evaluate', {
      expression: `JSON.stringify(Array.from(document.querySelectorAll("audio")).map(a => ({
        src: a.src,
        paused: a.paused,
        currentTime: a.currentTime
      })))`
    });
    console.log('ACTIVE PLAYING TRACKS:');
    const tracks = JSON.parse(status.result.value);
    tracks.forEach(t => {
      if (!t.paused) console.log(' -> PLAYING:', t.src, '| Time:', t.currentTime);
    });

    ws.close();
    process.exit(0);
  });
})();
