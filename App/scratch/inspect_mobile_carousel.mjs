import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9489;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\mobile-carousel-inspect-" + Date.now(),
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
  // Set iPhone 12/13/14 viewport: 390 x 844
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log("Navigating to https://www.botly.vn/healthclues on Mobile 390px...");
  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3000);

  // Scroll to doors carousel
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(800);

  // Inspect elements
  const metrics = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const container = document.querySelector('.hc-carousel-3d-container');
        const track = document.querySelector('.hc-carousel-3d-track');
        const cards = Array.from(document.querySelectorAll('.carousel-3d-card'));
        const containerRect = container ? container.getBoundingClientRect() : null;
        const trackRect = track ? track.getBoundingClientRect() : null;
        const windowWidth = window.innerWidth;
        const bodyScrollWidth = document.body.scrollWidth;

        const cardDetails = cards.map((c, idx) => {
          const r = c.getBoundingClientRect();
          const style = window.getComputedStyle(c);
          return {
            idx,
            className: c.className,
            title: c.querySelector('.card-title')?.innerText,
            rect: { left: r.left, right: r.right, width: r.width, height: r.height, top: r.top },
            transform: style.transform,
            left: style.left,
            top: style.top,
            position: style.position
          };
        });

        return {
          windowWidth,
          bodyScrollWidth,
          containerRect,
          trackRect,
          cardDetails
        };
      })()
    `,
    returnByValue: true
  });

  console.log("METRICS:\n", JSON.stringify(metrics.result.value, null, 2));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\mobile_carousel_actual.png", Buffer.from(shot.data, "base64"));
  console.log("Saved mobile_carousel_actual.png");

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
