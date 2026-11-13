import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9366;
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

    // Inspect mobile 390
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
    await sleep(2000);

    const mobileData = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const strip = document.querySelector('.hc-pipeline-strip');
          const items = Array.from(document.querySelectorAll('.pipeline-item')).map((el, i) => {
            const rect = el.getBoundingClientRect();
            return {
              step: i + 1,
              text: el.innerText.replace(/\\n/g, ' '),
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
          return {
            windowWidth: window.innerWidth,
            stripRect: strip ? {
              top: Math.round(strip.getBoundingClientRect().top),
              left: Math.round(strip.getBoundingClientRect().left),
              width: Math.round(strip.getBoundingClientRect().width),
              height: Math.round(strip.getBoundingClientRect().height),
            } : null,
            items,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("MOBILE 390 DOM:", JSON.stringify(mobileData.result.value, null, 2));

    // Inspect tablet 820
    await send("Emulation.setDeviceMetricsOverride", {
      width: 820,
      height: 1180,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
    await sleep(1500);

    const tabletData = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const strip = document.querySelector('.hc-pipeline-strip');
          const items = Array.from(document.querySelectorAll('.pipeline-item')).map((el, i) => {
            const rect = el.getBoundingClientRect();
            return {
              step: i + 1,
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
          return {
            windowWidth: window.innerWidth,
            stripRect: strip ? {
              width: Math.round(strip.getBoundingClientRect().width),
              height: Math.round(strip.getBoundingClientRect().height),
              scrollWidth: strip.scrollWidth,
              clientWidth: strip.clientWidth,
            } : null,
            items,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log("TABLET 820 DOM:", JSON.stringify(tabletData.result.value, null, 2));

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
