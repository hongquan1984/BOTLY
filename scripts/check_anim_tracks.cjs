const fs = require("fs");

function inspectAnimTracks(p) {
  const buf = fs.readFileSync(p);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
  for (const anim of gltf.animations || []) {
    console.log("Animation:", anim.name);
    for (const channel of anim.channels) {
      const nodeName = gltf.nodes[channel.target.node]?.name;
      const path = channel.target.path;
      if (path === "translation") {
        console.log("  Translation channel on:", nodeName);
      }
    }
  }
}

inspectAnimTracks("d:/botly/App/word3d/public/assets/characters/humanoid.glb");
