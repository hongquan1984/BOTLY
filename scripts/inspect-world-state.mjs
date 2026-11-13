import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

async function inspect() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = "d:\\botly\\App\\.tmp\\inspect-ui\\chrome-inspect";
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,900",
    "http://127.0.0.1:3329/vi/wellness/healthclues/world?quest=health-concern#hc-journey",
  ]);

  try {
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
      await new Promise((r) => setTimeout(r, 200));
    }

    const ws = new WebSocket(targetWs);
    await new Promise((resolve) => (ws.onopen = resolve));

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener("message", handler);
            resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await new Promise((r) => setTimeout(r, 4000));

    const state = await send("Runtime.evaluate", {
      expression: `(() => {
        const alerts = Array.from(document.querySelectorAll('[role="alert"]')).map(el => el.textContent.trim());
        const cards = Array.from(document.querySelectorAll('.hc-active-goal-card')).map(el => ({
          title: el.querySelector('.hc-quest-card-title')?.textContent.trim(),
          category: el.querySelector('.hc-goal-category-micro')?.textContent.trim(),
        }));
        const emptyState = document.querySelector('.hc-goals-empty-state')?.textContent.trim();
        const session = window.sessionStorage.getItem('healthclues-cloud-session') || window.localStorage.getItem('healthclues-cloud-session');
        return { alerts, cards, emptyState, hasSession: Boolean(session) };
      })()`,
      returnByValue: true,
    });
    console.log("Browser State on direct load:", state.result?.value);
    ws.close();
  } finally {
    chromeProc.kill("SIGTERM");
  }
}

inspect().catch(console.error);
