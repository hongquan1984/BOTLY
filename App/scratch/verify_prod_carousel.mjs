import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9496;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\prod-verify-carousel-" + Date.now(),
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

async function verifyViewport(send, width, height, label) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 768
  });
  await sleep(400);

  // Trigger resize in page
  await send("Runtime.evaluate", {
    expression: `window.dispatchEvent(new Event('resize'));`
  });
  await sleep(400);

  const metrics = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const center = document.querySelector('.carousel-3d-card.is-center');
        const centerRect = center ? center.getBoundingClientRect() : null;
        const windowWidth = window.innerWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const isDeadCenter = centerRect ? Math.abs((centerRect.left + centerRect.width / 2) - windowWidth / 2) < 2 : false;

        return {
          viewport: '${label}',
          windowWidth,
          docScrollWidth,
          hasHorizontalScroll: docScrollWidth > windowWidth,
          centerRect: centerRect ? {
            left: centerRect.left,
            right: centerRect.right,
            width: centerRect.width,
            midpoint: centerRect.left + centerRect.width / 2,
            isDeadCenter
          } : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log("PROD LIVE METRICS [" + label + "]:", JSON.stringify(metrics.result.value));

  // Scroll to carousel area
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(500);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\prod_live_carousel_" + label + ".png", Buffer.from(shot.data, "base64"));
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
  console.log("Navigating to https://www.botly.vn/healthclues on LIVE PRODUCTION...");
  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3500);

  await verifyViewport(send, 375, 812, "mobile_375");
  await verifyViewport(send, 390, 844, "mobile_390");
  await verifyViewport(send, 430, 932, "mobile_430");
  await verifyViewport(send, 820, 1180, "tablet_820");
  await verifyViewport(send, 1024, 1366, "tablet_1024");
  await verifyViewport(send, 1440, 900, "desktop_1440");

  ws.close();
  chromeProc.kill();
  console.log("ALL PRODUCTION VERIFICATIONS FINISHED SUCCESSFULLY!");
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
