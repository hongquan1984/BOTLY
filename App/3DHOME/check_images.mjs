import sharp from 'sharp';

async function check() {
  const meta = await sharp('glb_public/assets/bg/swiss_grindelwald_360_real.jpg').metadata();
  console.log('Grindelwald 360:', meta.width, 'x', meta.height, meta.format);
}

check();
