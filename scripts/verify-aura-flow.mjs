import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

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
    if (!target) {
      console.error('Target tab not found');
      process.exit(1);
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = async () => {
      try {
        console.log('Connected to target');
        await sendCommand(ws, 'Page.enable');
        await sendCommand(ws, 'Runtime.enable');

        // Check current running state (from previous step)
        const checkStatus = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            const orb = document.querySelector('.aura-anim-orb');
            const playBtn = Array.from(document.querySelectorAll('button')).find(b =>
              b.textContent.includes('Start') || b.textContent.includes('Pause')
            );
            return {
              playBtnText: playBtn ? playBtn.textContent.trim() : null,
              orbPlayState: orb ? window.getComputedStyle(orb).animationPlayState : null
            };
          })()`,
          returnByValue: true
        });
        console.log('Current status:', checkStatus.result.value);

        // 1. Desktop Screenshot while playing with animated aura orb & non-clickable flow
        await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
          width: 1280,
          height: 950,
          deviceScaleFactor: 1,
          mobile: false
        });
        await new Promise(r => setTimeout(r, 600));

        const playingShot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-aura-playing-verified.png'), Buffer.from(playingShot.data, 'base64'));
        console.log('Saved desktop-aura-playing-verified.png');

        // 2. Pause audio to test pause state
        const pausePos = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pause & Rest'));
            if (!btn) return null;
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`,
          returnByValue: true
        });
        if (pausePos.result.value) {
          const { x, y } = pausePos.result.value;
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
          await new Promise(r => setTimeout(r, 800));
        }

        const pauseCheck = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            const orb = document.querySelector('.aura-anim-orb');
            return {
              orbPlayState: orb ? window.getComputedStyle(orb).animationPlayState : null
            };
          })()`,
          returnByValue: true
        });
        console.log('Status after pause (should be paused):', pauseCheck.result.value);

        const pausedShot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop-aura-paused-verified.png'), Buffer.from(pausedShot.data, 'base64'));
        console.log('Saved desktop-aura-paused-verified.png');

        // Resume playing for mobile screenshot
        const resumePos = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b =>
              b.textContent.includes('Start') || b.textContent.includes('Resume')
            );
            if (!btn) return null;
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`,
          returnByValue: true
        });
        if (resumePos.result.value) {
          const { x, y } = resumePos.result.value;
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await sendCommand(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
          await new Promise(r => setTimeout(r, 800));
        }

        // 3. Mobile Viewport (390x844) Screenshot
        await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true
        });
        await new Promise(r => setTimeout(r, 600));

        const mobileShot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile-aura-flow-verified.png'), Buffer.from(mobileShot.data, 'base64'));
        console.log('Saved mobile-aura-flow-verified.png');

        // Verify mobile horizontal overflow
        const overflow = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `(() => {
            return {
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
          })()`,
          returnByValue: true
        });
        console.log('Mobile horizontal overflow check:', overflow.result.value);

        // Reset device metrics
        await sendCommand(ws, 'Emulation.clearDeviceMetricsOverride');

        console.log('All verification screenshots successfully captured!');
        ws.close();
        process.exit(0);
      } catch (err) {
        console.error(err);
        ws.close();
        process.exit(1);
      }
    };
  });
});
