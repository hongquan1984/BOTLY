import http from 'http';

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

http.get('http://127.0.0.1:9222/json', async (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', async () => {
    const list = JSON.parse(raw);
    const target = list.find(t => t.url && t.url.includes('night-companion'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = async () => {
      try {
        // Find play button coordinates
        const rect = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b =>
              b.textContent.includes('Start') && b.textContent.includes('Sleep Journey')
            );
            if (!btn) return null;
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`,
          returnByValue: true
        });
        console.log('Button pos:', rect.result.value);

        if (rect.result.value) {
          const { x, y } = rect.result.value;
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
          await new Promise(r => setTimeout(r, 1000));

          const status = await sendCommand(ws, 'Runtime.evaluate', {
            expression: `(() => {
              const orb = document.querySelector('.aura-anim-orb');
              const playBtn = Array.from(document.querySelectorAll('button')).find(b =>
                b.textContent.includes('Start') || b.textContent.includes('Pause')
              );
              const errP = document.querySelector('p.text-rose-200');
              return {
                playBtnText: playBtn ? playBtn.textContent.trim() : null,
                error: errP ? errP.textContent.trim() : null,
                orbPlayState: orb ? window.getComputedStyle(orb).animationPlayState : null
              };
            })()`,
            returnByValue: true
          });
          console.log('Status after trusted click:', status.result.value);
        }
        ws.close();
      } catch (err) {
        console.error(err);
        ws.close();
      }
    };
  });
});
