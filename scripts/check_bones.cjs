const fs = require("fs");

function getBones(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
  return gltf.nodes
    .filter(
      (n) =>
        n.name &&
        (n.name.includes("mixamorig") ||
          n.name.includes("Hips") ||
          n.name.includes("Spine"))
    )
    .map((n) => n.name)
    .slice(0, 10);
}

console.log("humanoid:", getBones("d:/botly/App/word3d/public/assets/characters/humanoid.glb"));
console.log("Peasant_Girl:", getBones("d:/botly/App/word3d/public/assets/characters/Peasant_Girl.glb"));
