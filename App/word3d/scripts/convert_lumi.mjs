import fs from "fs";

const inputPath = "c:/Users/Admin/Downloads/sample.ply";
const outputPath = "d:/botly/App/word3d/public/assets/models/lumi_model.bin";

console.log("Reading sample.ply...");
const buf = fs.readFileSync(inputPath);
const headerEnd = buf.indexOf("end_header\n") + "end_header\n".length;
const vertexCount = 626656;
const vertexSize = 68;
const dv = new DataView(buf.buffer, buf.byteOffset + headerEnd);

const SH_C0 = 0.28209479177387814;

// Filter and collect points
const validIndices = [];
for (let i = 0; i < vertexCount; i++) {
  const off = i * vertexSize;
  const op = 1 / (1 + Math.exp(-dv.getFloat32(off + 36, true)));
  if (op < 0.28) continue;

  const x = dv.getFloat32(off, true);
  const y = dv.getFloat32(off + 4, true);
  const z = dv.getFloat32(off + 8, true);
  if (Math.hypot(x, y, z) > 0.8) continue;

  validIndices.push(i);
}

console.log(`Filtered: ${validIndices.length} / ${vertexCount} points`);

// Target around 250,000 points for 60fps silky smooth rendering on web & mobile
// If we downsample by step:
const step = Math.max(1, Math.floor(validIndices.length / 280000));
const finalIndices = [];
for (let i = 0; i < validIndices.length; i += step) {
  finalIndices.push(validIndices[i]);
}

const pointCount = finalIndices.length;
console.log(`Final point count: ${pointCount}`);

// Binary format:
// uint32: pointCount
// positions: Float32Array (pointCount * 3)
// colors: Uint8Array (pointCount * 3)
const outBuffer = Buffer.alloc(4 + pointCount * 12 + pointCount * 3);
outBuffer.writeUInt32LE(pointCount, 0);

let posOffset = 4;
let colOffset = 4 + pointCount * 12;

for (let i = 0; i < pointCount; i++) {
  const vIdx = finalIndices[i];
  const off = vIdx * vertexSize;

  // Upright orientation: negate Y and Z
  const x = dv.getFloat32(off, true);
  const y = -dv.getFloat32(off + 4, true);
  const z = -dv.getFloat32(off + 8, true);

  outBuffer.writeFloatLE(x, posOffset);
  outBuffer.writeFloatLE(y, posOffset + 4);
  outBuffer.writeFloatLE(z, posOffset + 8);
  posOffset += 12;

  // Colors from SH0
  let r = 0.5 + SH_C0 * dv.getFloat32(off + 24, true);
  let g = 0.5 + SH_C0 * dv.getFloat32(off + 28, true);
  let b = 0.5 + SH_C0 * dv.getFloat32(off + 32, true);

  // Slight vibrant boost for 3D environment
  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b = Math.max(0, Math.min(255, Math.round(b * 255)));

  outBuffer.writeUInt8(r, colOffset);
  outBuffer.writeUInt8(g, colOffset + 1);
  outBuffer.writeUInt8(b, colOffset + 2);
  colOffset += 3;
}

fs.writeFileSync(outputPath, outBuffer);
console.log(`Successfully saved ${outputPath} (${(outBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
