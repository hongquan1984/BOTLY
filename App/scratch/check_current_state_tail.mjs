import fs from 'fs';

const c = fs.readFileSync('d:/botly/App/CURRENT_STATE.md', 'utf8');
const lines = c.split('\n');
console.log('Total lines:', lines.length);
console.log('Last 40 lines:');
lines.slice(-40).forEach((l, idx) => {
  console.log(l);
});
