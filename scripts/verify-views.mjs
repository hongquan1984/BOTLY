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
    // 1. Journey Map
    await send('Page.navigate', { url: 'http://localhost:3000/night-companion' });
    await new Promise(r => setTimeout(r, 1500));
    
    const mapMetrics = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, sectionHeight: document.querySelector("section")?.offsetHeight })'
    });
    console.log('Journey Map Metrics:', JSON.parse(mapMetrics.result.value));
    
    let ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/verified-01-journey-map.png', Buffer.from(ss.data, 'base64'));

    // 2. Open Waitlist/Preview Modal
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll(".group")).find(el => el.innerText.includes("Rediscover Calm") || el.innerText.includes("Night 2"))?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    const modalMetrics = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ hasModal: Boolean(document.querySelector(".fixed")), modalHeight: document.querySelector(".fixed > div")?.offsetHeight, modalScrollHeight: document.querySelector(".fixed > div")?.scrollHeight, windowHeight: window.innerHeight })'
    });
    console.log('Modal Metrics:', JSON.parse(modalMetrics.result.value));

    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/verified-02-modal.png', Buffer.from(ss.data, 'base64'));

    // Close modal
    await send('Runtime.evaluate', {
      expression: 'document.querySelector(".fixed button")?.click()'
    });
    await new Promise(r => setTimeout(r, 400));

    // 3. Navigate into Night 1 Intro -> Player
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button, .group")).find(el => el.innerText.includes("Night 1") || el.innerText.includes("Continue") || el.innerText.includes("Start"))?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // In intro screen, click "Prepare for tonight"
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Prepare for tonight"))?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // In tonight state, pick first option
    await send('Runtime.evaluate', {
      expression: 'document.querySelectorAll("button")[1]?.click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // In prep, click "Listen now (skip prep)"
    await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Listen now"))?.click()'
    });
    await new Promise(r => setTimeout(r, 1000));

    const playerMetrics = await send('Runtime.evaluate', {
      expression: 'JSON.stringify({ bodyHeight: document.body.scrollHeight, windowHeight: window.innerHeight, playerHeight: document.querySelector("section")?.offsetHeight })'
    });
    console.log('Player Metrics:', JSON.parse(playerMetrics.result.value));

    ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/night-companion-audit/verified-03-player.png', Buffer.from(ss.data, 'base64'));

    console.log('All verification screenshots captured!');
    process.exit(0);
  });
})();
