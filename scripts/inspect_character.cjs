const fs = require("fs");
const path = require("path");

function inspectGlb(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log("Not found:", filePath);
    return;
  }
  const buf = fs.readFileSync(filePath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString("utf8", 20, 20 + jsonLen);
  const gltf = JSON.parse(jsonStr);
  console.log("=== " + path.basename(filePath) + " (" + buf.length + " bytes) ===");
  console.log("Meshes:", gltf.meshes?.map((m) => m.name));
  console.log("Animations:", gltf.animations?.map((a) => a.name));
  if (gltf.animations) {
    for (const anim of gltf.animations) {
      const targetNodes = anim.channels.map((c) => gltf.nodes[c.target.node]?.name).filter(Boolean);
      console.log(anim.name, "first 5 channels:", targetNodes.slice(0, 5));
    }
  }
  console.log("Materials:", gltf.materials?.map((m) => m.name));
}

inspectGlb("d:/botly/App/word3d/public/assets/characters/humanoid.glb");
inspectGlb("d:/botly/App/word3d/public/assets/characters/Peasant_Girl.glb");
inspectGlb("d:/botly/App/word3d/public/assets/characters/RobotExpressive.glb");
