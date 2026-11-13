import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9355;
const userDataDir = "D:\\botly\\App\\.tmp\\test-chrome-profile-" + Date.now();
mkdirSync(userDataDir, { recursive: true });

async function main() {
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    for (let i = 0; i < 40; i++) {
      try {
        const socket = net.createConnection(debugPort, "127.0.0.1");
        await new Promise((res, rej) => {
          socket.once("connect", () => { socket.end(); res(); });
          socket.once("error", rej);
        });
        break;
      } catch {
        await sleep(150);
      }
    }

    const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const json = await res.json();
    const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res) => ws.once("open", res));

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = msgId++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off("message", handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        ws.on("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");

    for (const width of [390, 768, 820, 1024, 1200, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width <= 768,
      });

      await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
      await sleep(1500);

      const metrics = await send("Runtime.evaluate", {
        expression: `
          (() => {
            const wrap = document.querySelector('.hc-pipeline-strip-wrap');
            const strip = document.querySelector('.hc-pipeline-strip');
            const items = document.querySelectorAll('.pipeline-item');
            const arrows = document.querySelectorAll('.pipeline-arrow');
            const computedStrip = strip ? window.getComputedStyle(strip) : null;
            return {
              width: window.innerWidth,
              stripDisplay: computedStrip ? computedStrip.display : null,
              stripFlexDirection: computedStrip ? computedStrip.flexDirection : null,
              wrapScrollWidth: wrap ? wrap.scrollWidth : null,
              wrapClientWidth: wrap ? wrap.clientWidth : null,
              stripScrollWidth: strip ? strip.scrollWidth : null,
              stripClientWidth: strip ? strip.clientWidth : null,
              isHorizontallyScrolling: strip ? (strip.scrollWidth > strip.clientWidth) : false,
              itemCount: items.length,
              arrowsCount: arrows.length,
              arrowDisplay: arrows[0] ? window.getComputedStyle(arrows[0]).display : null,
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(`Width ${width}:`, JSON.stringify(metrics.result.value));
    }

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
