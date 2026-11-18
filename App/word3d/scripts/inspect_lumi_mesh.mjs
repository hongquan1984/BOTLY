import { chromium } from "file:///D:/botly/App/word3d/node_modules/playwright-core/index.mjs";

async function inspectLumiMesh() {
  const browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 412, height: 860 } });

  await page.goto("http://localhost:5173/?mode=player", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  const info = await page.evaluate(() => {
    const s = window.__systems;
    if (!s) return "no __systems";
    const lumi = s.lumiCompanion;
    if (!lumi) return "no lumiCompanion";

    const grp = lumi.group;
    const children = grp.children.map(c => {
      let geoInfo = null;
      if (c.geometry) {
        geoInfo = {
          type: c.geometry.type,
          attrs: Object.keys(c.geometry.attributes),
          vertCount: c.geometry.attributes.position ? c.geometry.attributes.position.count : 0,
          colorCount: c.geometry.attributes.color ? c.geometry.attributes.color.count : 0,
        };
      }
      return {
        name: c.name,
        type: c.type,
        visible: c.visible,
        pos: [c.position.x, c.position.y, c.position.z],
        scale: [c.scale.x, c.scale.y, c.scale.z],
        geometry: geoInfo,
        material: c.material ? {
          type: c.material.type,
          transparent: c.material.transparent,
          opacity: c.material.opacity,
          color: c.material.color ? c.material.color.getHexString() : null,
          vertexColors: c.material.vertexColors,
        } : null,
      };
    });

    return {
      groupPos: [grp.position.x, grp.position.y, grp.position.z],
      children,
    };
  });

  console.log("Lumi inspect:", JSON.stringify(info, null, 2));
  await browser.close();
}

inspectLumiMesh();
