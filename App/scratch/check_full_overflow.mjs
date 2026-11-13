import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9388;
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

    const widths = [390];
    for (const w of widths) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: w <= 768,
      });

      await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
      await sleep(1500);

      const check = await send("Runtime.evaluate", {
        expression: `
          (() => {
            const docWidth = document.documentElement.clientWidth;
            const docScroll = document.documentElement.scrollWidth;
            const bodyWidth = document.body.clientWidth;
            const bodyScroll = document.body.scrollWidth;
            
            // Find all elements wider than viewport
            const overflowing = [];
            document.querySelectorAll('*').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (r.right > docWidth + 2) {
                overflowing.push({
                  tag: el.tagName,
                  className: (el.className || '').toString().slice(0, 50),
                  id: el.id,
                  right: Math.round(r.right),
                  viewportWidth: docWidth,
                  overflowBy: Math.round(r.right - docWidth),
                });
              }
            });

            return {
              viewport: w,
              docWidth,
              docScroll,
              bodyScroll,
              hasPageHorizontalScroll: docScroll > docWidth || bodyScroll > docWidth,
              overflowCount: overflowing.length,
              topOverflows: overflowing.slice(0, 5),
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(`Viewport ${w}px:`, JSON.stringify(check.result.value));
    }

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
