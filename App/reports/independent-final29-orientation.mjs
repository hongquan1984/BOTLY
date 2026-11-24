import fs from 'node:fs';
let code = fs.readFileSync('D:/botly/App/reports/independent-final28-orientation.mjs', 'utf8');
code = code.replaceAll('final28-fresh-', 'final29-independent-').replaceAll('final28-orientation-', 'final29-orientation-');
await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
