import fs from 'fs';

async function getRef() {
  const url = 'https://sketchfab.com/3d-models/castle-village-scene-675b3afce21a4acaa1140645a5206db3';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });
  const html = await res.text();
  const match = html.match(/property="og:image"\s+content="([^"]+)"/);
  if (match) {
    console.log('Found reference image URL:', match[1]);
    const imgRes = await fetch(match[1]);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync('docs/screenshots/01_original_sketchfab_reference.png', buffer);
    console.log('Saved docs/screenshots/01_original_sketchfab_reference.png');
  } else {
    console.log('og:image not matched, looking for twitter:image');
    const match2 = html.match(/name="twitter:image"\s+content="([^"]+)"/);
    if (match2) {
      console.log('Found twitter image URL:', match2[1]);
      const imgRes = await fetch(match2[1]);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync('docs/screenshots/01_original_sketchfab_reference.png', buffer);
      console.log('Saved docs/screenshots/01_original_sketchfab_reference.png');
    }
  }
}

getRef().catch(console.error);
