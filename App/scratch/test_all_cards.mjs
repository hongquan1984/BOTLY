import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9492;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-all-cards-" + Date.now(),
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

  const evalResult = await send("Runtime.evaluate", {
    expression: `
      (() => {
        // Inject centering fix
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

        const cards = Array.from(document.querySelectorAll('.carousel-3d-card'));
        return cards.map(c => {
          const r = c.getBoundingClientRect();
          return {
            title: c.querySelector('.card-title')?.innerText,
            isCenter: c.classList.contains('is-center'),
            left: r.left,
            right: r.right,
            width: r.width,
            opacity: window.getComputedStyle(c).opacity
          };
        });
      })()
    `,
    returnByValue: true
  });

  console.log("CARDS WITH FIX:\n", JSON.stringify(evalResult.result.value, null, 2));

  // Also check if any card is causing horizontal overflow on body
  const overflowCheck = await send("Runtime.evaluate", {
    expression: `
      (() => {
        return {
          windowInnerWidth: window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth,
          documentElementScrollWidth: document.documentElement.scrollWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
        };
      })()
    `,
    returnByValue: true
  });
  console.log("OVERFLOW CHECK:", JSON.stringify(overflowCheck.result.value, null, 2));

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
