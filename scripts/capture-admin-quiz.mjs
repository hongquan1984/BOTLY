import { writeFile } from 'node:fs/promises';

async function run() {
  const version = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  const socket = new WebSocket(version.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const call = (method, params = {}) => new Promise(resolve => {
    const requestId = ++id;
    pending.set(requestId, resolve);
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { socket.onopen = resolve; });

  const target = await call('Target.createTarget', { url: 'about:blank' });
  const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const page = pages.find(item => item.id === target.result.targetId);
  const pageSocket = new WebSocket(page.webSocketDebuggerUrl);
  let pageId = 0;
  const pagePending = new Map();
  pageSocket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pagePending.has(message.id)) {
      pagePending.get(message.id)(message);
      pagePending.delete(message.id);
    }
  };
  const pageCall = (method, params = {}) => new Promise(resolve => {
    const requestId = ++pageId;
    pagePending.set(requestId, resolve);
    pageSocket.send(JSON.stringify({ id: requestId, method, params }));
  });
  await new Promise(resolve => { pageSocket.onopen = resolve; });

  await pageCall('Page.enable');
  await pageCall('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await pageCall('Page.navigate', { url: 'http://localhost:3000/admin/thong-ke' });
  await new Promise(r => setTimeout(r, 2500));

  // Switch to Quiz tab
  await pageCall('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const qTab = buttons.find(b => b.textContent && b.textContent.includes('Phễu Quiz Mất Ngủ'));
        if (qTab) qTab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click Insights subtab
  await pageCall('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Mẫu Hình Đêm'));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const screenshotInsights = await pageCall('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });
  await writeFile('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/admin-quiz-insights-full.png', Buffer.from(screenshotInsights.result.data, 'base64'));

  // Click Submissions subtab
  await pageCall('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Nhật Ký Người Làm Quiz'));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const screenshotSubs = await pageCall('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true
  });
  await writeFile('C:/Users/Admin/.gemini/antigravity/brain/ea2d8329-b86f-4322-b31d-14baa377dafb/admin-quiz-submissions-full.png', Buffer.from(screenshotSubs.result.data, 'base64'));

  await pageCall('Target.closeTarget', { targetId: target.result.targetId });
  pageSocket.close();
  socket.close();
  console.log('Full page screenshots saved!');
}

run().catch(console.error);
