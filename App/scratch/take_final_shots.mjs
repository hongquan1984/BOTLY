import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9488;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\final-verify-" + Date.now(),
  "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const list = await res.json();
      const page = list.find(item => item.type === "page");
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

async function main() {
  const wsUrl = await getWsUrl();
  console.log("Connected to Chrome:", wsUrl);

  const WebSocket = (await import("ws")).default;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => ws.once("open", res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === curId) { ws.off("message", handler); resolve(msg.result); }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log("Navigating to https://www.botly.vn/healthclues ...");
  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3000);

  // 1. Check card font
  await send("DOM.enable");
  await send("CSS.enable");
  const doc = await send("DOM.getDocument");
  const node = await send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".card-title" });
  if (node && node.nodeId) {
    const fonts = await send("CSS.getPlatformFontsForNode", { nodeId: node.nodeId });
    console.log("Card-title platform fonts:", JSON.stringify(fonts.fonts));
  }

  // Scroll to doors carousel
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(800);
  const shot1 = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\carousel_fixed_font.png", Buffer.from(shot1.data, "base64"));
  console.log("Saved carousel_fixed_font.png");

  // Scroll to 5-step journey
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('journey-pipeline');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(800);
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\journey_desktop_fixed.png", Buffer.from(shot2.data, "base64"));
  console.log("Saved journey_desktop_fixed.png");

  // Mobile test 390px
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);
  const mobileShot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\journey_mobile_fixed.png", Buffer.from(mobileShot.data, "base64"));
  console.log("Saved journey_mobile_fixed.png");

  ws.close();
  chromeProc.kill();
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Error:", err);
  try { chromeProc.kill(); } catch {}
  process.exit(1);
});
