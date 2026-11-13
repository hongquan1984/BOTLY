import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/app/api/healthclues/wellness-home/route.ts', 'utf8');
const idx = c.indexOf('table_coffee');
console.log(c.substring(idx - 50, idx + 600));
