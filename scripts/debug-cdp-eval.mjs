const BASE_URL = 'http://localhost:3000';
async function test() {
  const cdpPort = 9225;
  const { spawn } = await import('node:child_process');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, ['--remote-debugging-port=' + cdpPort, '--headless=new', 'about:blank']);
  await new Promise(r => setTimeout(r, 1500));
  const tRes = await fetch('http://127.0.0.1:' + cdpPort + '/json');
  const targets = await tRes.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const cur = id++;
    const cb = e => {
      const d = JSON.parse(e.data);
      if (d.id === cur) { ws.removeEventListener('message', cb); res(d.result); }
    };
    ws.addEventListener('message', cb);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: BASE_URL + '/admin/healthclues-home' });
  await new Promise(r => setTimeout(r, 3000));
  const pageInfo = await send('Runtime.evaluate', {
    expression: `({
      href: window.location.href,
      title: document.title,
      bodyLen: document.body.innerHTML.length,
      hasCard: Boolean(document.querySelector('[data-testid="admin-sidebar-upload-card"]')),
      snippet: document.body.innerText.slice(0, 300)
    })`,
    returnByValue: true
  });
  console.log('Page info:', pageInfo.result.value);
  chromeProc.kill();
}
test().catch(console.error);
