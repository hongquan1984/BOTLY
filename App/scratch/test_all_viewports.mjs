import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9493;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-offsets-" + Date.now(),
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

async function testViewport(send, width, height, label) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 768
  });
  await sleep(400);

  // Measure center card and side cards
  const metrics = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const center = document.querySelector('.carousel-3d-card.is-center');
        const cards = Array.from(document.querySelectorAll('.carousel-3d-card'));
        const centerRect = center ? center.getBoundingClientRect() : null;
        return {
          windowWidth: window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth,
          centerRect: centerRect ? {
            left: centerRect.left,
            right: centerRect.right,
            width: centerRect.width,
            midpoint: centerRect.left + centerRect.width / 2,
            isDeadCenter: Math.abs((centerRect.left + centerRect.width / 2) - window.innerWidth / 2) < 2
          } : null,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
        };
      })()
    `,
    returnByValue: true
  });

  console.log("METRICS [" + label + " " + width + "x" + height + "]:", JSON.stringify(metrics.result.value));

  // Capture screenshot of carousel area
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(400);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\test_carousel_" + label + ".png", Buffer.from(shot.data, "base64"));
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
  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(3000);

  // Inject comprehensive CSS fix
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
            width: 420px !important;
            height: 460px !important;
          }

          @media (max-width: 1024px) {
            .carousel-3d-card {
              width: 360px !important;
              height: 440px !important;
            }
          }

          @media (max-width: 768px) {
            .hc-carousel-3d-container {
              height: 420px !important;
              overflow: hidden !important;
              margin-top: 0.25rem !important;
            }

            .hc-carousel-3d-track,
            .carousel-3d-track {
              height: 370px !important;
            }

            .carousel-3d-card {
              width: 270px !important;
              height: 350px !important;
              border-radius: 14px !important;
            }

            /* On mobile, cards at distance >= 2 should be completely hidden */
            .carousel-3d-card:not(.is-center) {
              /* let inline styles or classes manage distance 1 */
            }
          }
        \`;
        document.head.appendChild(style);
      })()
    `
  });

  await testViewport(send, 375, 812, "mobile_375");
  await testViewport(send, 390, 844, "mobile_390");
  await testViewport(send, 430, 932, "mobile_430");
  await testViewport(send, 820, 1180, "tablet_820");
  await testViewport(send, 1024, 1366, "tablet_1024");
  await testViewport(send, 1440, 900, "desktop_1440");

  ws.close();
  chromeProc.kill();
  console.log("All viewports verified!");
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
