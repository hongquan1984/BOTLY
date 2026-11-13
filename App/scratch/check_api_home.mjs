import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/app/api/healthclues/home/route.ts', 'utf8');
console.log(c.substring(0, 1500));
