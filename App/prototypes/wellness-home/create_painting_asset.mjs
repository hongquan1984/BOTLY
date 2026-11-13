import sharp from "sharp";

async function makePainting() {
  const mountain = await sharp("D:/botly/App/prototypes/wellness-home/assets/scenes/scene_overview.webp")
    .extract({ left: 300, top: 120, width: 540, height: 360 })
    .toBuffer();

  const svgBorder = Buffer.from(
    `<svg width="600" height="420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3d2817" />
          <stop offset="50%" stop-color="#5a3d24" />
          <stop offset="100%" stop-color="#2c1d10" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b8860b" />
          <stop offset="50%" stop-color="#ffd700" />
          <stop offset="100%" stop-color="#daa520" />
        </linearGradient>
      </defs>
      <!-- Outer Wooden Picture Frame -->
      <rect x="0" y="0" width="600" height="420" rx="6" fill="url(#frameGrad)" stroke="#1a110a" stroke-width="4" />
      <!-- Inner Gold Bevel Mat -->
      <rect x="18" y="18" width="564" height="384" rx="3" fill="#1c1c1c" stroke="url(#goldGrad)" stroke-width="3" />
      <!-- White Gallery Mount -->
      <rect x="26" y="26" width="548" height="368" fill="#fdfcf7" />
    </svg>`
  );

  await sharp(svgBorder)
    .composite([
      {
        input: mountain,
        left: 30,
        top: 30,
      },
    ])
    .png()
    .toFile("D:/botly/App/prototypes/wellness-home/assets/items/painting-alps-01.png");

  console.log("Created painting-alps-01.png successfully!");
}

makePainting().catch(console.error);
