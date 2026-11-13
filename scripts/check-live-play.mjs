import https from 'node:https';

https.get('https://www.botly.vn/play', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Length:', body.length);
    const cssLinks = [...body.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
    console.log('CSS files:', cssLinks);
    if (cssLinks.length > 0) {
      // Check the first CSS file for our recent changes
      const cssUrl = cssLinks[0].startsWith('http') ? cssLinks[0] : `https://www.botly.vn${cssLinks[0]}`;
      console.log('Fetching CSS:', cssUrl);
      https.get(cssUrl, (cRes) => {
        let css = '';
        cRes.on('data', chunk => css += chunk);
        cRes.on('end', () => {
          console.log('CSS length:', css.length);
          console.log('Contains has-rpg-hud:', css.includes('has-rpg-hud'));
          console.log('Contains Math.max in JS or relevant styles:', css.includes('100dvh'));
          const matches = [...css.matchAll(/hc-game-root[^}]+}/g)].map(m => m[0]);
          console.log('hc-game-root matches:', matches.slice(0, 5));
        });
      });
    }
  });
}).on('error', console.error);
