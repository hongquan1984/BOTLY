import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";

const root = "D:\\botly";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-diag-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=378,622",
  ]);

  let targetWs = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const json = await res.json();
      const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
      if (page) {
        targetWs = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const ws = new WebSocket(targetWs);
  let id = 1;
  const pending = new Map();
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const currentId = id++;
      pending.set(currentId, resolve);
      ws.send(JSON.stringify({ id: currentId, method, params }));
    });
  }

  await new Promise((r) => ws.on("open", r));
  await send("Page.enable");

  await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 0; i < 15; i++) {
    const res = await send("Runtime.evaluate", {
      expression: `({ url: window.location.href, title: document.title, bodyText: document.body.innerText.substring(0, 100) })`,
      returnByValue: true
    });
    console.log(`Step ${i}:`, res.result?.result?.value);
    await new Promise(r => setTimeout(r, 1000));
  }

  ws.close();
  chromeProc.kill("SIGKILL");
}

main().catch(console.error);
