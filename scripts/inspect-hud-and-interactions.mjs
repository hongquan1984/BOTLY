import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

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

const profileDir = path.join("d:\\botly", "App", ".tmp", "inspect-ui", `chrome-hud-test-${Date.now()}`);
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

  await send("Page.navigate", { url: "http://127.0.0.1:8081/world" });
  await new Promise((r) => setTimeout(r, 3000));

  // Inspect tab bar DOM
  const inspectTabResult = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const tabs = Array.from(document.querySelectorAll('a, [role="tab"], div')).filter(el => {
          const t = el.textContent || '';
          return ['Thế Giới', 'Hành Trình', 'Nhiệm Vụ', 'Túi Đồ', 'Cá Nhân'].some(name => t === name);
        });
        return tabs.map(el => {
          const rect = el.getBoundingClientRect();
          const parentRect = el.parentElement?.getBoundingClientRect();
          return {
            text: el.textContent,
            tag: el.tagName,
            rect: { top: rect.top, bottom: rect.bottom, height: rect.height, left: rect.left, right: rect.right },
            parentRect: parentRect ? { top: parentRect.top, bottom: parentRect.bottom, height: parentRect.height } : null,
            windowHeight: window.innerHeight,
          };
        });
      })()
    `,
    returnByValue: true,
  });
  console.log("Tab HUD inspection:", JSON.stringify(inspectTabResult.result.value, null, 2));

  // Also inspect what elements exist with text "Đại Bản Đồ"
  const inspectToggle = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const els = Array.from(document.querySelectorAll('*')).filter(el => el.textContent && el.textContent.includes('Đại Bản Đồ'));
        return els.map(el => ({
          tag: el.tagName,
          className: el.className,
          role: el.getAttribute('role'),
          text: el.textContent,
          childrenCount: el.children.length,
          hasOnclick: !!el.onclick,
        }));
      })()
    `,
    returnByValue: true,
  });
  console.log("Toggle inspection:", JSON.stringify(inspectToggle.result.value, null, 2));

  ws.close();
} finally {
  chromeProc.kill("SIGKILL");
}
