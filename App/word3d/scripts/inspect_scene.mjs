import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function inspectScene() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 412, height: 860 } });

  await page.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  const sceneInfo = await page.evaluate(() => {
    // Traverse window.scene or check Three.js objects
    // Let's see if scene is accessible
    const results = [];
    const walk = (obj, depth = 0) => {
      results.push({
        name: obj.name || "unnamed",
        type: obj.type,
        pos: [obj.position.x, obj.position.y, obj.position.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        visible: obj.visible,
        material: obj.material ? (Array.isArray(obj.material) ? obj.material.map(m => m.type) : obj.material.type) : null,
      });
      for (const child of obj.children || []) {
        walk(child, depth + 1);
      }
    };

    if (window.scene) {
      walk(window.scene);
    } else {
      // Find scene from renderer or canvas
      return { noWindowScene: true };
    }
    return results;
  });

  console.log("Scene info:", sceneInfo);
  await browser.close();
}

inspectScene();
