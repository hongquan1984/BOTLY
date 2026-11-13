import { spawn } from "node:child_process";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9494;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-overflow-" + Date.now(),
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
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3000);

  // Apply our style
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const style = document.createElement('style');
        style.innerHTML = \`
          .hc-carousel-3d-track,
          .carousel-3d-track {
            position: relative !important;
            width: 100% !important;
            height: 480px !important;
            transform-style: preserve-3d !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .carousel-3d-card {
            position: absolute !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: auto !important;
          }
        \`;
        document.head.appendChild(style);
      })()
    `
  });
  await sleep(500);

  const overflowReport = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const docW = document.documentElement.clientWidth;
        const all = Array.from(document.querySelectorAll('*'));
        const overflowing = [];
        all.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.right > docW + 2) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              right: r.right,
              docW
            });
          }
        });
        return overflowing.slice(0, 10);
      })()
    `,
    returnByValue: true
  });

  console.log("OVERFLOWING ELEMENTS AT 820px:\n", JSON.stringify(overflowReport.result.value, null, 2));

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
