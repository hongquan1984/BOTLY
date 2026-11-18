import fs from "fs";

const buf = fs.readFileSync("d:/botly/App/word3d/public/assets/models/lumi_model.bin");
const dv = new DataView(buf.buffer, buf.byteOffset);
const count = dv.getUint32(0, true);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

let rSum = 0, gSum = 0, bSum = 0;

for (let i = 0; i < count; i++) {
  const x = dv.getFloat32(4 + i * 12, true);
  const y = dv.getFloat32(4 + i * 12 + 4, true);
  const z = dv.getFloat32(4 + i * 12 + 8, true);

  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;

  const r = buf[4 + count * 12 + i * 3];
  const g = buf[4 + count * 12 + i * 3 + 1];
  const b = buf[4 + count * 12 + i * 3 + 2];
  rSum += r;
  gSum += g;
  bSum += b;
}

console.log("X range:", minX, "to", maxX, "width:", maxX - minX);
console.log("Y range:", minY, "to", maxY, "height:", maxY - minY);
console.log("Z range:", minZ, "to", maxZ, "depth:", maxZ - minZ);
console.log("Avg color:", (rSum / count).toFixed(1), (gSum / count).toFixed(1), (bSum / count).toFixed(1));
