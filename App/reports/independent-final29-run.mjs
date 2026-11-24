import fs from 'node:fs';
let code = fs.readFileSync('D:/botly/App/reports/independent-final28-run.mjs', 'utf8');
code = code.replaceAll('final28-fresh-', 'final29-independent-');
await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
