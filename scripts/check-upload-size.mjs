import fs from "fs";
import path from "path";

const root = "d:/botly";
const entries = fs.readdirSync(root, { withFileTypes: true });
for (const e of entries) {
  if (e.name === "node_modules" || e.name === ".git" || e.name === ".next" || e.name === "App" || e.name === "Music_Voice" || e.name === ".tmp") continue;
  const p = path.join(root, e.name);
  if (e.isDirectory()) {
    let size = 0;
    const calc = (dir) => {
      try {
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of list) {
          const itemP = path.join(dir, item.name);
          if (item.isDirectory()) calc(itemP);
          else size += fs.statSync(itemP).size;
        }
      } catch {}
    };
    calc(p);
    console.log(`${(size / (1024 * 1024)).toFixed(2)} MB: ${e.name}/`);
  } else {
    const size = fs.statSync(p).size;
    if (size > 100 * 1024) {
      console.log(`${(size / (1024 * 1024)).toFixed(2)} MB: ${e.name}`);
    }
  }
}
