import fs from 'fs';

const p = 'd:/botly/App/.tmp/healthclues-owner-demo/app-build/src/components/healthclues/wellness-home.css';
if (fs.existsSync(p)) {
  const c = fs.readFileSync(p, 'utf8');
  console.log('Exists in app-build/src/components? Yes, length:', c.length);
  console.log('Contains is-modal-active?', c.includes('is-modal-active'));
} else {
  console.log('Not in app-build');
}
