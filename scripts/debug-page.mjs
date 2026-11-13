import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-debug-page-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=390,844",
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
  await new Promise(r => setTimeout(r, 3000));

  const state = await send("Runtime.evaluate", {
    expression: `(() => {
      return {
        url: window.location.href,
        title: document.title,
        text: document.body.innerText.substring(0, 300),
        hasDock: Boolean(document.querySelector('.hc-rpg-bottom-dock')),
        hasMap: Boolean(document.querySelector('[data-region-map]')),
        hasGameShell: Boolean(document.querySelector('.hc-game-shell')),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
      };
    })()`,
    returnByValue: true
  });
  console.log("Page State:", JSON.stringify(state.result?.result?.value, null, 2));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (shot.result?.data) {
    writeFileSync("C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/debug-page-view.png", Buffer.from(shot.result.data, "base64"));
    console.log("Saved debug-page-view.png");
  }

  ws.close();
  chromeProc.kill("SIGKILL");
}

main().catch(console.error);
