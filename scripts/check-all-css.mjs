import https from 'node:https';

https.get('https://www.botly.vn/play', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', async () => {
    const cssLinks = [...body.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
    for (const link of cssLinks) {
      const url = link.startsWith('http') ? link : `https://www.botly.vn${link}`;
      await new Promise(resolve => {
        https.get(url, (cRes) => {
          let css = '';
          cRes.on('data', chunk => css += chunk);
          cRes.on('end', () => {
            console.log(link, 'length:', css.length, 'has-rpg-hud:', css.includes('has-rpg-hud'));
            resolve();
          });
        });
      });
    }
  });
});
