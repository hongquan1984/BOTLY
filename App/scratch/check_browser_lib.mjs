import fs from 'fs';

const c = fs.readFileSync('d:/botly/scripts/capture-all-mobile-surfaces.mjs', 'utf8');
console.log(c.substring(0, 500));
