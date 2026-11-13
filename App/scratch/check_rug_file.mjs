import fs from 'fs';

const p = 'd:/botly/public/healthclues/assets/home/items/bedroom_rug.png';
const stat = fs.statSync(p);
console.log('bedroom_rug.png size:', stat.size);
