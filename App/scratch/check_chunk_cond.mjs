import fs from 'fs';

const p = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/.next/static/chunks/1y_i9wh8-0nm_.js';
const c = fs.readFileSync(p, 'utf8');

const idx = 319709;
console.log(c.substring(Math.max(0, idx - 400), idx));
