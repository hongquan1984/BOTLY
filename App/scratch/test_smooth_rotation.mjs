import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9497;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-smooth-3d-" + Date.now(),
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

  console.log("Navigating to http://localhost:3360 ...");
  await send("Page.navigate", { url: "http://localhost:3360" });
  await sleep(2000);

  // Scroll to carousel area
  await send("Runtime.evaluate", {
    expression: `
      const el = document.getElementById('world-doors');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `
  });
  await sleep(500);

  // Test rotating next 3 times with 800ms intervals
  for (let step = 1; step <= 3; step++) {
    console.log("Clicking next: Step " + step + "...");
    await send("Runtime.evaluate", {
      expression: `
        const btn = document.querySelector('.carousel-next-btn');
        if (btn) btn.click();
      `
    });
    await sleep(600);

    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f\\smooth_step_" + step + ".png", Buffer.from(shot.data, "base64"));

    const check = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const center = document.querySelector('.carousel-3d-card.is-center');
          const r = center ? center.getBoundingClientRect() : null;
          return {
            title: center?.querySelector('.card-title')?.innerText,
            centerLeft: r?.left,
            centerRight: r?.right,
            isCentered: r ? Math.abs((r.left + r.width / 2) - 195) < 2 : false,
            hasHorizontalScroll: document.documentElement.scrollWidth > 390
          };
        })()
      `,
      returnByValue: true
    });
    console.log("Step " + step + " result:", JSON.stringify(check.result.value));
  }

  ws.close();
  chromeProc.kill();
  console.log("TEST COMPLETED!");
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
