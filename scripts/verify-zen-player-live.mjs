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
  const auditDir = 'C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit';

  ws.addEventListener('open', async () => {
    try {
      console.log('Navigating to live production: https://www.botly.vn/night-companion...');
      await send('Page.navigate', { url: 'https://www.botly.vn/night-companion' });
      await new Promise(r => setTimeout(r, 2500));

      // Step 1: Click the Night 1 button on the map
      const step1 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const n1Btn = buttons.find(b => b.innerText.includes('Continue Night 1') || b.innerText.includes('Start Night 1') || b.innerText.includes('Night 1'));
            if (n1Btn) {
              n1Btn.click();
              return 'Clicked Night 1 CTA: ' + n1Btn.innerText;
            }
            return 'No Night 1 button found. Buttons: ' + buttons.map(b => b.innerText).join(' | ');
          })()
        `
      });
      console.log('Step 1:', step1.value);
      await new Promise(r => setTimeout(r, 1500));

      // Step 2: Click "Prepare for tonight" on the Intro screen
      const step2 = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const prepBtn = buttons.find(b => b.innerText.includes('Prepare for tonight') || b.innerText.includes('Listen now'));
            if (prepBtn) {
              prepBtn.click();
              return 'Clicked: ' + prepBtn.innerText;
            }
            return 'No prep button found. Visible text: ' + document.body.innerText.substring(0, 200);
          })()
        `
      });
      console.log('Step 2:', step2.value);
      await new Promise(r => setTimeout(r, 2000));

      // Step 3: Verify we are on the player
      const playerCheck = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const body = document.body.innerText;
            return {
              hasFlowTitle: body.includes('Continuous Sleep Flow'),
              hasDimBtn: body.includes('Dim screen'),
              hasStartBtn: body.includes('Start 60-Min Sleep Journey') || body.includes('Start 60-min sleep journey'),
              hasCustomize: body.includes('Customize Sound'),
            };
          })()
        `
      });
      console.log('Player Check on live production:', JSON.stringify(playerCheck.value));

      // Capture screenshot 1: Zen Bedtime Player
      console.log('Capturing zen-player-bedtime.png...');
      let ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/zen-player-bedtime.png`, Buffer.from(ss.data, 'base64'));

      // Step 4: Click "Dim screen" to test Blackout Mode
      console.log('Clicking Dim Screen...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const dimBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('dim screen'));
            if (dimBtn) dimBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));

      // Capture screenshot 2: Blackout Mode
      console.log('Capturing zen-player-blackout.png...');
      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/zen-player-blackout.png`, Buffer.from(ss.data, 'base64'));

      // Step 5: Wake up from blackout mode
      console.log('Waking up from blackout mode...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const overlay = document.querySelector('[aria-label="Wake screen"]');
            if (overlay) overlay.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));

      // Step 6: Expand "Customize Sound & Settings"
      console.log('Expanding Customize Sound...');
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const cBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Customize Sound'));
            if (cBtn) cBtn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 1000));

      // Capture screenshot 3: Customizer Expanded
      console.log('Capturing zen-player-customizer.png...');
      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/zen-player-customizer.png`, Buffer.from(ss.data, 'base64'));

      // Step 7: Click Start 60-Min Sleep Journey
      console.log('Clicking Start 60-Min Sleep Journey...');
      const playRes = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start 60-Min Sleep Journey') || b.innerText.includes('Start 60-min sleep journey'));
            if (startBtn) {
              startBtn.click();
              await new Promise(r => setTimeout(r, 1500));
              const audios = Array.from(document.querySelectorAll('audio')).map(a => ({
                src: a.src,
                paused: a.paused,
                currentTime: a.currentTime
              }));
              return { hasAudioPlaying: audios.some(a => !a.paused), audios };
            }
            return { error: 'Start button not found' };
          })()
        `,
        awaitPromise: true
      });
      console.log('Audio Playback status:', JSON.stringify(playRes.value));

      // Capture screenshot 4: Playing Player
      console.log('Capturing zen-player-playing.png...');
      ss = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${auditDir}/zen-player-playing.png`, Buffer.from(ss.data, 'base64'));

      ws.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      ws.close();
      process.exit(1);
    }
  });
})();
