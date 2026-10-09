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
    // Find coordinates of "Start 60-min sleep journey" button
    const box = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Start 60-min"));
        if (!btn) return null;
        const rect = btn.getBoundingClientRect();
        return JSON.stringify({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
      })()`
    });
    const coords = JSON.parse(box.result.value);
    console.log('Button coordinates:', coords);

    // Dispatch real trusted mouse click via CDP
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

    await new Promise(r => setTimeout(r, 2000));

    // Check playback status now
    const status = await send('Runtime.evaluate', {
      expression: `JSON.stringify(Array.from(document.querySelectorAll("audio")).map(a => ({
        src: a.src,
        paused: a.paused,
        currentTime: a.currentTime
      })))`
    });
    console.log('PLAYBACK STATUS AFTER TRUSTED CLICK:');
    const tracks = JSON.parse(status.result.value);
    tracks.forEach(t => console.log(' -', t.src, '| Paused:', t.paused, '| CurrentTime:', t.currentTime));

    // Capture running screenshot
    const fs = await import('fs');
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-actively-playing-cloned.png', Buffer.from(ss.data, 'base64'));
    console.log('Saved player-actively-playing-cloned.png!');

    ws.close();
    process.exit(0);
  });
})();
