import fs from 'fs';

const buf = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/.user_uploaded/media_1793946411517_657678f1.jpg');
for (let i = 0; i < buf.length - 8; i++) {
  if (buf[i] === 0xff && (buf[i+1] === 0xc0 || buf[i+1] === 0xc2)) {
    const h = buf.readUInt16BE(i + 5);
    const w = buf.readUInt16BE(i + 7);
    console.log('Image dimensions:', w, 'x', h);
    break;
  }
}
