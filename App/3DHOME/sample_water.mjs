import sharp from 'sharp';

async function sampleWaterColor() {
  const buf = await sharp('glb_public/assets/bg/swiss_lake_village_vista.jpg')
    .extract({ left: 900, top: 1300, width: 100, height: 100 })
    .raw()
    .toBuffer();

  let rSum = 0, gSum = 0, bSum = 0;
  const count = 100 * 100;
  for (let i = 0; i < count; i++) {
    rSum += buf[i * 3];
    gSum += buf[i * 3 + 1];
    bSum += buf[i * 3 + 2];
  }
  const r = Math.round(rSum / count);
  const g = Math.round(gSum / count);
  const b = Math.round(bSum / count);
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  console.log(`Average Water Color in photo: RGB(${r}, ${g}, ${b}) -> ${hex}`);
}

sampleWaterColor();
