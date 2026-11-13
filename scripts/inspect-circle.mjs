import http from 'http';

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const target = list.find(t => t.url && t.url.includes('night-companion'));
    if (!target) return console.log('Target not found');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const el = document.querySelector('.relative.flex.h-20');
            if (!el) return { error: 'no el' };
            // Add a test style
            const testStyle = document.createElement('style');
            testStyle.textContent = \`
              @keyframes testOrb {
                0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
                50% { transform: scale(1.1) translate(4px, -4px); opacity: 0.8; }
                100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
              }
              .test-orb-anim {
                animation-name: testOrb !important;
                animation-duration: 8s !important;
                animation-iteration-count: infinite !important;
                animation-timing-function: ease-in-out !important;
              }
            \`;
            document.head.appendChild(testStyle);
            el.classList.add('test-orb-anim');
            el.style.animationPlayState = 'running';

            const cs = window.getComputedStyle(el);
            return {
              animName: cs.animationName,
              animDuration: cs.animationDuration,
              animIterationCount: cs.animationIterationCount,
              animPlayState: cs.animationPlayState
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
