import { spawn } from "node:child_process";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9498;
const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  "--disable-gpu",
  "--no-sandbox",
  "--user-data-dir=D:\\botly\\App\\.tmp\\test-clicks-" + Date.now(),
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
  await send("Runtime.enable");

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.method === "Runtime.consoleAPICalled") {
      console.log("PAGE LOG:", msg.params.args.map(a => a.value || a.description).join(" "));
    }
  });

  await send("Page.navigate", { url: "http://localhost:3360" });
  await sleep(1500);

  const res = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const results = [];
        const nextBtn = document.getElementById('carousel-next');
        for (let i = 0; i < 5; i++) {
          nextBtn.click();
          const center = document.querySelector('.carousel-3d-card.is-center');
          results.push(center?.querySelector('.card-title')?.innerText);
        }
        return results;
      })()
    `,
    returnByValue: true
  });

  console.log("CLICK RESULTS:", res.result.value);

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  try { chromeProc.kill(); } catch {}
});
