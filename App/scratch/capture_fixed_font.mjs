import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import net from "node:net";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9445;
console.log("Starting Chrome...");
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-carousel-shot-" + Date.now(),
  "about:blank"
], { stdio: "pipe" });

chromeProc.stderr.on("data", d => console.log("Chrome stderr:", d.toString()));


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
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
  const page = json.find((item) => item.type === "page");

  const WebSocket = (await import("ws")).default;
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res) => ws.once("open", res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === curId) { ws.off("message", handler); resolve(msg.result); }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
  await sleep(2500);

  // Scroll to carousel section
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(800);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\carousel_fixed_font.png", Buffer.from(shot.data, "base64"));
  console.log("Screenshot saved: carousel_fixed_font.png");

  ws.close();
  chromeProc.kill();
}

run().catch((e) => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
