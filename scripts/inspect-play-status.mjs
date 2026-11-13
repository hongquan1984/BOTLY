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
          expression: `(() => {
            const audios = Array.from(document.querySelectorAll('audio')).map(a => ({
              src: a.src,
              paused: a.paused,
              currentTime: a.currentTime,
              error: a.error ? a.error.message : null
            }));
            const playBtn = Array.from(document.querySelectorAll('button')).find(b =>
              b.textContent.includes('Start') || b.textContent.includes('Pause')
            );
            const errP = document.querySelector('p.text-rose-200');
            return {
              audios,
              playBtnText: playBtn ? playBtn.textContent.trim() : null,
              error: errP ? errP.textContent.trim() : null
            };
          })()`,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (msg) => {
      console.log(JSON.stringify(JSON.parse(msg.data).result.result.value, null, 2));
      ws.close();
    };
  });
});
