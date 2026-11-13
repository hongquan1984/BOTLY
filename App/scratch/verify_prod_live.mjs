import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9411;
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

    const viewports = [
      { name: "live_mobile_375", width: 375, height: 812, mobile: true },
      { name: "live_mobile_390", width: 390, height: 844, mobile: true },
      { name: "live_mobile_430", width: 430, height: 932, mobile: true },
      { name: "live_tablet_820", width: 820, height: 1180, mobile: false },
      { name: "live_tablet_1024", width: 1024, height: 768, mobile: false },
      { name: "live_desktop_1440", width: 1440, height: 900, mobile: false },
    ];

    for (const vp of viewports) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
      await sleep(1200);

      const check = await send("Runtime.evaluate", {
        expression: `
          (() => {
            const strip = document.querySelector('.hc-pipeline-strip');
            const wrap = document.querySelector('.hc-pipeline-strip-wrap');
            const items = document.querySelectorAll('.pipeline-item');
            const cs = strip ? window.getComputedStyle(strip) : null;
            return {
              viewport: '${vp.name}',
              width: window.innerWidth,
              flexDirection: cs ? cs.flexDirection : null,
              stripScrollWidth: strip ? strip.scrollWidth : null,
              stripClientWidth: strip ? strip.clientWidth : null,
              wrapScrollWidth: wrap ? wrap.scrollWidth : null,
              wrapClientWidth: wrap ? wrap.clientWidth : null,
              isHorizontallyScrolling: wrap ? (wrap.scrollWidth > wrap.clientWidth) : false,
              firstItemWidth: items[0] ? Math.round(items[0].getBoundingClientRect().width) : null,
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(`[PROD LIVE ${vp.name}]`, JSON.stringify(check.result.value));

      // Scroll to journey and capture screenshot
      await send("Runtime.evaluate", {
        expression: `
          const el = document.getElementById('journey-steps');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        `
      });
      await sleep(400);

      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(`C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\${vp.name}.png`, Buffer.from(shot.data, "base64"));
    }

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
