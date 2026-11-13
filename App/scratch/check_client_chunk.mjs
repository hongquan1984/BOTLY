import fs from 'fs';

const p = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/.next/static/chunks/1y_i9wh8-0nm_.js';
const c = fs.readFileSync(p, 'utf8');

// Search for hc-game-modal-header
let pos = 0;
while (true) {
  const idx = c.indexOf('hc-game-modal-header', pos);
  if (idx === -1) break;
  console.log('--- FOUND AT ' + idx + ' ---');
  console.log(c.substring(Math.max(0, idx - 150), Math.min(c.length, idx + 250)));
  pos = idx + 1;
}
