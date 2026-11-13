import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join("D:\\botly\\App\\.tmp\\inspect-ui", `chrome-web-inspect-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=390,844",
    "about:blank",
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
    assert.ok(targetWs, "Could not find Chrome page WebSocket target.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    async function capture(name) {
      const s = await send("Page.captureScreenshot", { format: "png" });
      const p = path.join(artifactsDir, `${name}.png`);
      writeFileSync(p, Buffer.from(s.data, "base64"));
      console.log(`[+] Captured: ${name}.png`);
    }

    console.log("Navigating to http://127.0.0.1:3329/play...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play" });
    await new Promise((r) => setTimeout(r, 3500));
    await capture("web-reference-play-welcome");

    // Click Start Journey button if present
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Start Journey') || b.textContent.includes('Bắt đầu')));
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 3000));
    await capture("web-reference-quiz-quest-selection");

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch((err) => {
  console.error("Web inspect failed:", err);
  process.exit(1);
});
