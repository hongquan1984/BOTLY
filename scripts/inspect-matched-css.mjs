import { spawn } from 'node:child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, ['--remote-debugging-port=9231', '--headless=new', '--disable-extensions', '--window-size=390,844', 'about:blank']);

setTimeout(async () => {
  try {
    const list = await fetch('http://127.0.0.1:9231/json/list').then(r => r.json());
    const ws = new WebSocket(list.find(p => !p.url.startsWith('chrome-')).webSocketDebuggerUrl);
    ws.onopen = async () => {
      let id = 1;
      const send = (m, p={}) => new Promise(res => {
        const cur = id++;
        const fn = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === cur) { ws.removeEventListener('message', fn); res(d.result); }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: cur, method: m, params: p }));
      });
      await send('Page.enable');
      await send('Runtime.enable');
      await send('DOM.enable');
      await send('CSS.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await send('Page.navigate', { url: 'http://127.0.0.1:3329/play-demo.html' });
      await new Promise(r => setTimeout(r, 3500));
      await send('Runtime.evaluate', { expression: 'document.querySelectorAll(".hc-rpg-dock-btn")[1].click()' });
      await new Promise(r => setTimeout(r, 1200));

      const doc = await send('DOM.getDocument');
      const node = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.hc-journey-nav-tabs' });
      const styles = await send('CSS.getMatchedStylesForNode', { nodeId: node.nodeId });
      
      const matchingRules = styles.matchedCSSRules.map(r => ({
        selector: r.rule.selectorList.text,
        cssText: r.rule.style.cssText
      }));

      console.log('TABS MATCHED RULES:', JSON.stringify(matchingRules, null, 2));

      const btnNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.hc-journey-nav-tab-btn' });
      const btnStyles = await send('CSS.getMatchedStylesForNode', { nodeId: btnNode.nodeId });
      const btnMatchingRules = btnStyles.matchedCSSRules.map(r => ({
        selector: r.rule.selectorList.text,
        cssText: r.rule.style.cssText
      }));

      console.log('BTN MATCHED RULES:', JSON.stringify(btnMatchingRules, null, 2));

      proc.kill();
      process.exit(0);
    };
  } catch (err) {
    console.error(err);
    proc.kill();
    process.exit(1);
  }
}, 1000);
