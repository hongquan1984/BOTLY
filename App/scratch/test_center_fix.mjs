import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9491;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-center-" + Date.now(),
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
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3000);

  // Apply fix dynamically:
  // 1. set top: 0; bottom: 0; left: 0; right: 0; margin: auto on .carousel-3d-card
  // 2. Hide diff 2 / -2 on mobile
  const result = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const style = document.createElement('style');
        style.innerHTML = \`
          .carousel-3d-card {
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: auto !important;
          }
        \`;
        document.head.appendChild(style);

        const centerCard = document.querySelector('.carousel-3d-card.is-center');
        const r = centerCard.getBoundingClientRect();
        return {
          windowWidth: window.innerWidth,
          centerCardRect: { left: r.left, right: r.right, width: r.width, center: r.left + r.width / 2 }
        };
      })()
    `,
    returnByValue: true
  });

  console.log("AFTER FIX RECT:", JSON.stringify(result.result.value, null, 2));

  // Scroll to carousel and capture screenshot
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(600);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\mobile_carousel_centered_test.png", Buffer.from(shot.data, "base64"));
  console.log("Saved mobile_carousel_centered_test.png");

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
