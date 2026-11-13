import fs from 'fs';

function findApi(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) {
      findApi(p);
    } else if (p.includes('wellness-home') || p.includes('home')) {
      console.log(p);
    }
  }
}

findApi('d:/botly/src/app/api');
