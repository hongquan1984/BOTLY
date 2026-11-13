import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9349;
const userDataDir = "D:\\botly\\App\\.tmp\\test-chrome-profile-" + Date.now();
mkdirSync(userDataDir, { recursive: true });

async function main() {
  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,OptimizationHints",
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

    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await sleep(200);
    }

    if (!targetWs) throw new Error("Could not find WebSocket debugger URL");

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
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

    const configs = [
      { name: "mobile_390", width: 390, height: 844, isMobile: true },
      { name: "tablet_820", width: 820, height: 1180, isMobile: true },
      { name: "desktop_1024", width: 1024, height: 768, isMobile: false },
      { name: "desktop_1440", width: 1440, height: 900, isMobile: false },
    ];

    for (const cfg of configs) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: cfg.width,
        height: cfg.height,
        deviceScaleFactor: 1,
        mobile: cfg.isMobile,
      });

      await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
      await sleep(2000);

      // Scroll to journey section
      await send("Runtime.evaluate", {
        expression: `
          const el = document.getElementById('journey-steps');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        `
      });
      await sleep(600);

      const shot = await send("Page.captureScreenshot", { format: "png" });
      const filename = `D:\\botly\\App\\.tmp\\live_journey_${cfg.name}.png`;
      writeFileSync(filename, Buffer.from(shot.data, "base64"));
      console.log(`Saved screenshot: ${filename}`);
    }

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
