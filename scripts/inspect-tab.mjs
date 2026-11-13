import http from 'http';

http.get('http://127.0.0.1:9222/json', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const list = JSON.parse(raw);
    const target = list.find(t => t.url && t.url.includes('night-companion'));
    if (!target) return console.log('Target not found');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().replace(/\\n/g, ' ')),
            h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText),
            h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText),
            url: window.location.href
          })`,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (msg) => {
      console.log(JSON.parse(JSON.parse(msg.data).result.result.value));
      ws.close();
    };
  });
});
