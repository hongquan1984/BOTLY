const fs = require("fs");

function inspectBounds(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
  console.log("=== " + p + " ===");
  // Check accessor min/max for positions (accessor 0 or mesh primitives)
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      const posAccessorIdx = prim.attributes?.POSITION;
      if (posAccessorIdx !== undefined) {
        const acc = gltf.accessors[posAccessorIdx];
        console.log("Mesh:", mesh.name, "Pos min:", acc.min, "max:", acc.max);
      }
    }
  }
}

inspectBounds("d:/botly/App/word3d/public/assets/characters/humanoid.glb");
inspectBounds("d:/botly/App/word3d/public/assets/characters/Peasant_Girl.glb");
inspectBounds("d:/botly/App/word3d/public/assets/characters/RobotExpressive.glb");
