import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

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

  const profileDir = path.join("d:\\botly\\App\\.tmp\\inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "http://127.0.0.1:3329/play-demo.html",
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
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs);

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(JSON.stringify(payload.error)));
        else resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("Runtime.enable");

    await new Promise((r) => setTimeout(r, 2500));

    const check = await send("Runtime.evaluate", {
      expression: `(() => {
        const frames = document.querySelectorAll('.hc-goal-3d-frame');
        const imgs = document.querySelectorAll('.hc-goal-3d-img');
        const el = frames[0];
        const img = imgs[0];
        return {
          frameCount: frames.length,
          frameComputed: el ? {
            border: window.getComputedStyle(el).border,
            background: window.getComputedStyle(el).background,
            boxShadow: window.getComputedStyle(el).boxShadow,
            borderRadius: window.getComputedStyle(el).borderRadius,
          } : null,
          imgSrc: img ? img.src : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Check result:", JSON.stringify(check.result?.value, null, 2));

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
