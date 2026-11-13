import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise(resolve => probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  }));

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    "--no-first-run",
    "--headless=new",
    "http://127.0.0.1:3329/play-demo.html",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find(p => p.type === "page" && p.webSocketDebuggerUrl);
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    const ws = new WebSocket(targetWs);
    await new Promise(r => ws.addEventListener("open", r, { once: true }));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) {
          ws.removeEventListener("message", handler);
          resolve(d.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send("Page.enable");
    await send("Runtime.enable");

    await new Promise(r => setTimeout(r, 3000));

    const goalsData = await send("Runtime.evaluate", {
      expression: `(() => {
        // Access React fiber or look at page DOM
        const cards = Array.from(document.querySelectorAll('.hc-active-goal-card')).map(card => {
          return {
            title: card.querySelector('.hc-quest-card-title')?.innerText,
            desc: card.querySelector('.hc-goal-desc-text')?.innerText,
            actionBody: card.querySelector('.hc-goal-action-body')?.innerText,
            pills: Array.from(card.querySelectorAll('.hc-goal-card-pills-row span')).map(s => s.innerText),
          };
        });
        return cards;
      })()`,
      returnByValue: true,
    });
    console.log("Goals on page:", JSON.stringify(goalsData.result?.value, null, 2));

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}
main().catch(console.error);
