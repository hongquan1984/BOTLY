import fs from 'fs';

const c = fs.readFileSync('d:/botly/src/components/healthclues/wellness-home.css', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('hc-home-pick')) {
    console.log(`${idx+1}: ${l}`);
  }
});
