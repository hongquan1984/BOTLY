import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9425;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-font-debug-" + Date.now(),
  "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await sleep(1500);

  const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  const json = await res.json();
  const page = json.find((item) => item.type === "page");

  const WebSocket = (await import("ws")).default;
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => ws.once("open", res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === curId) { ws.off("message", handler); resolve(msg.result); }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(2500);

  const fontInfo = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const title = document.querySelector('.card-title');
        const computed = window.getComputedStyle(title);
        return {
          fontFamily: computed.fontFamily,
          innerText: title ? title.innerText : null,
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Font Info:", JSON.stringify(fontInfo.result.value));

  await send("DOM.enable");
  await send("CSS.enable");
  const doc = await send("DOM.getDocument");
  const node = await send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".card-title" });
  const platformFonts = await send("CSS.getPlatformFontsForNode", { nodeId: node.nodeId });
  console.log("Platform fonts for .card-title:", JSON.stringify(platformFonts.fonts));

  // Scroll to doors carousel and take screenshot
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(600);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\carousel_fixed_font.png", Buffer.from(shot.data, "base64"));
  console.log("Screenshot successfully saved: carousel_fixed_font.png");

  ws.close();
  chromeProc.kill();
}

run().catch((e) => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
