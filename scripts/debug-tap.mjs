import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=D:\\botly\\App\\.tmp\\debug-profile-${Date.now()}`,
    "--headless=new",
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

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send("Page.navigate", { url: "http://127.0.0.1:8081" });
    await new Promise((r) => setTimeout(r, 3500));

    const clickRes = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const leafNodes = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent && el.textContent.includes('Bắt Đầu Hành Trình'));
          if (leafNodes.length === 0) return { success: false, reason: 'NO_LEAF' };
          
          const textNode = leafNodes[0];
          const btn = textNode.closest('[role="button"]') || textNode.closest('[tabindex="0"]') || textNode.parentElement;
          const rect = btn.getBoundingClientRect();
          
          // Trigger click
          btn.click();
          return {
            success: true,
            leafTag: textNode.tagName,
            btnTag: btn.tagName,
            btnRole: btn.getAttribute('role'),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });
    console.log("Click result:", JSON.stringify(clickRes.result.value, null, 2));

    await new Promise((r) => setTimeout(r, 1500));
    const afterText = await send("Runtime.evaluate", {
      expression: `document.body.innerText`,
      returnByValue: true,
    });
    console.log("After text preview:", afterText.result.value.slice(0, 300));
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
