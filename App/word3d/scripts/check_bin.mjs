import fs from "fs";

const buf = fs.readFileSync("d:/botly/App/word3d/public/assets/models/lumi_model.bin");
const dv = new DataView(buf.buffer, buf.byteOffset);
const count = dv.getUint32(0, true);
console.log("Count:", count);
const pos = new Float32Array(buf.buffer, buf.byteOffset + 4, 30);
console.log("First 15 positions:", pos.slice(0, 15));
const col = new Uint8Array(buf.buffer, buf.byteOffset + 4 + count * 12, 30);
console.log("First 15 colors:", col.slice(0, 15));
