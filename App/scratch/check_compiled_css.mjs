import fs from 'fs';
import path from 'path';

const cssDir = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/.next/static/css';
if (fs.existsSync(cssDir)) {
  const files = fs.readdirSync(cssDir);
  console.log('CSS files in .next:', files);
  for (const f of files) {
    const c = fs.readFileSync(path.join(cssDir, f), 'utf8');
    console.log(f, 'has is-modal-active?', c.includes('is-modal-active'));
  }
} else {
  console.log('CSS dir does not exist');
}
