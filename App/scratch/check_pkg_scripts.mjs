import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('d:/botly/package.json', 'utf8'));
console.log(pkg.scripts);
