import fs from 'fs';

const p = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/.next/server/chunks/ssr/0uaj_app-build_src_features_healthclues_WellnessWorldGame_tsx_1v6q8w4._.js';
const c = fs.readFileSync(p, 'utf8');
const idx = c.indexOf('hc-game-modal');
if (idx !== -1) {
  console.log('Snippet around hc-game-modal:');
  console.log(c.substring(Math.max(0, idx - 200), Math.min(c.length, idx + 400)));
} else {
  console.log('hc-game-modal not found');
}
