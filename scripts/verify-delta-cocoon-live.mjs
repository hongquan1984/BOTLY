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
      console.log('Navigating to live production...');
      await send('Page.navigate', { url: 'https://www.botly.vn/night-companion' });
      await new Promise(r => setTimeout(r, 2500));

      // Test playing Delta and Cocoon audio in browser context
      const audioTestResult = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const check = (url) => new Promise((res) => {
              const a = new Audio(url);
              a.volume = 0.5;
              a.onloadedmetadata = () => res({ url, ok: true, duration: a.duration });
              a.onerror = () => res({ url, ok: false, error: a.error ? a.error.code : 'unknown' });
              setTimeout(() => res({ url, ok: false, error: 'timeout' }), 8000);
            });
            const d = await check('/audio/night-companion/delta/deep_delta_brown_noise.mp3');
            const c = await check('/audio/night-companion/cocoon/sleep_cocoon_continuous.mp3');
            return { delta: d, cocoon: c };
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });
      console.log('Audio test results:', JSON.stringify(audioTestResult.result.value, null, 2));

      // Test clicking 4. Delta and 5. Cocoon buttons in player
      // First ensure we are in player
      const inPlayer = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector("button:has-text, button"))',
        returnByValue: true
      });

      // Click "4. Delta" button
      const deltaClick = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('4. Delta'));
            if (btn) { btn.click(); return 'clicked 4. Delta'; }
            return 'not found';
          })()
        `,
        returnByValue: true
      });
      console.log('Delta button click:', deltaClick.result.value);
      await new Promise(r => setTimeout(r, 1000));

      // Click "5. Cocoon" button
      const cocoonClick = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('5. Cocoon'));
            if (btn) { btn.click(); return 'clicked 5. Cocoon'; }
            return 'not found';
          })()
        `,
        returnByValue: true
      });
      console.log('Cocoon button click:', cocoonClick.result.value);
      await new Promise(r => setTimeout(r, 1000));

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/player-delta-cocoon-verified.png', Buffer.from(ss.data, 'base64'));
      console.log('Saved screenshot player-delta-cocoon-verified.png!');

      ws.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      ws.close();
      process.exit(1);
    }
  });
})();
