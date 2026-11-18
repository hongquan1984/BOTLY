const fs = require("fs");

function getNodes(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
  return gltf.nodes
    .filter((n) => n.scale || n.translation)
    .map((n) => ({ name: n.name, scale: n.scale, translation: n.translation }))
    .slice(0, 10);
}

console.log("humanoid:", getNodes("d:/botly/App/word3d/public/assets/characters/humanoid.glb"));
console.log("Peasant_Girl:", getNodes("d:/botly/App/word3d/public/assets/characters/Peasant_Girl.glb"));
console.log("RobotExpressive:", getNodes("d:/botly/App/word3d/public/assets/characters/RobotExpressive.glb"));
