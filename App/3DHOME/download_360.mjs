import fs from 'fs';

async function download() {
  const thumbUrl = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Grindelwald_360_Grad_2022.jpg/3840px-Grindelwald_360_Grad_2022.jpg';
  console.log('Downloading from:', thumbUrl);
  const res = await fetch(thumbUrl, {
    headers: { 'User-Agent': 'BotlySwissVillage/1.0 (contact@botly.app)' }
  });
  if (!res.ok) {
    console.error('Failed to download thumbnail:', res.status, res.statusText);
    return;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('glb_public/assets/bg/swiss_grindelwald_360_real.jpg', Buffer.from(buffer));
  console.log('Downloaded successfully! File size:', buffer.byteLength, 'bytes');
}

download();
