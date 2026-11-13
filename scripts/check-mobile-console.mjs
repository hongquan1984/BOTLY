import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";

async function run() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((r) => probe.listen(0, "127.0.0.1", () => {
    const p = probe.address().port; probe.close(() => r(p));
  }));

  const proc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    "--headless=new",
    "--disable-gpu",
    "http://127.0.0.1:8081"
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const list = await res.json();
        const p = list.find((x) => x.type === "page" && x.webSocketDebuggerUrl);
        if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.onopen = r);

    let id = 0;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = ++id;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) { ws.removeEventListener("message", handler); resolve(data.result); }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.addEventListener("message", (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === "Runtime.exceptionThrown") {
        console.error("RUNTIME EXCEPTION:", JSON.stringify(d.params.exceptionDetails));
      }
      if (d.method === "Console.messageAdded") {
        console.log("CONSOLE LOG:", d.params.message.text);
      }
    });

    await send("Runtime.enable");
    await send("Console.enable");
    await send("Page.enable");

    await new Promise((r) => setTimeout(r, 4000));

    const evalRes = await send("Runtime.evaluate", {
      expression: "document.getElementById('root') ? document.getElementById('root').innerHTML : 'no root'"
    });
    console.log("ROOT INNER HTML:", evalRes.result.value?.substring(0, 300));

    ws.close();
  } finally {
    proc.kill();
  }
}
run();
