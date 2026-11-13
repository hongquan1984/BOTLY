import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

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

const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-rpg-toggle-${Date.now()}`);
mkdirSync(profileDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--headless=new",
  "--disable-gpu",
  "--window-size=430,932",
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    hasTouch: true,
  });

  // Navigate to /world
  await send("Page.navigate", { url: "http://127.0.0.1:8081/world" });
  await new Promise((r) => setTimeout(r, 3000));

  // Define realistic press
  await send("Runtime.evaluate", {
    expression: `
      window.__hcPress = function(text) {
        const all = Array.from(document.querySelectorAll('*'));
        const matches = all.filter(el => {
          return el.textContent && el.textContent.includes(text) && 
            !Array.from(el.children).some(child => child.textContent && child.textContent.includes(text));
        });
        if (matches.length === 0) return 'not found';
        const target = matches[0].closest('[role=\"button\"]') || matches[0].closest('button') || matches[0].parentElement || matches[0];
        const rect = target.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const opts = { bubbles: true, cancelable: true, view: window, clientX, clientY };
        target.dispatchEvent(new PointerEvent('pointerdown', opts));
        target.dispatchEvent(new MouseEvent('mousedown', opts));
        target.dispatchEvent(new PointerEvent('pointerup', opts));
        target.dispatchEvent(new MouseEvent('mouseup', opts));
        target.dispatchEvent(new MouseEvent('click', opts));
        if (typeof target.click === 'function') target.click();
        return 'pressed: ' + (target.getAttribute('role') || target.tagName) + ' text: ' + target.textContent;
      };
    `,
  });

  const res = await send("Runtime.evaluate", {
    expression: `window.__hcPress('Đại Bản Đồ')`,
    returnByValue: true,
  });
  console.log("Press result:", res.result.value);

  await new Promise((r) => setTimeout(r, 1500));

  const checkMode = await send("Runtime.evaluate", {
    expression: `document.body.innerText.includes('Đại Bản Đồ 8 Vùng Đất')`,
    returnByValue: true,
  });
  console.log("Overworld header visible?", checkMode.result.value);

  const s = await send("Page.captureScreenshot", { format: "png" });
  const p = path.join(artifactsDir, "mobile-rpg-overworld-8biomes.png");
  writeFileSync(p, Buffer.from(s.data, "base64"));
  console.log("[+] Saved mobile-rpg-overworld-8biomes.png");

  ws.close();
} finally {
  chromeProc.kill("SIGKILL");
}
