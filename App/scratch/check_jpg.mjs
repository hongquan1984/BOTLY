import fs from 'fs';

// Read image header or dimensions using node
const p = 'C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/swiss_sheepskin_rug_1794158774567.jpg';
const buf = fs.readFileSync(p);
console.log('Buffer length:', buf.length);
// Check if JPEG
if (buf[0] === 0xff && buf[1] === 0xd8) {
  console.log('Valid JPEG format');
}
