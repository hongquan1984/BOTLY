import https from 'node:https';

https.get('https://www.botly.vn/en/wellness/healthclues/world', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', async () => {
    console.log('Status on world:', res.statusCode);
    const cssLinks = [...body.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
    console.log('CSS links on world:', cssLinks);
    for (const link of cssLinks) {
      const url = link.startsWith('http') ? link : `https://www.botly.vn${link}`;
      await new Promise(resolve => {
        https.get(url, (cRes) => {
          let css = '';
          cRes.on('data', chunk => css += chunk);
          cRes.on('end', () => {
            console.log(link, 'length:', css.length, 'has-rpg-hud:', css.includes('has-rpg-hud'));
            if (css.includes('has-rpg-hud')) {
              console.log('MATCH FOUND IN:', link);
            }
            resolve();
          });
        });
      });
    }
  });
});
