import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const targetUrl = "http://127.0.0.1:3329/vi/wellness/healthclues/world?quest=health-concern";

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-diag-shot-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=1280,800",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => { ws.on("open", resolve); ws.on("error", reject); });

    let msgId = 1;
    const pending = new Map();
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString("utf8"));
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    console.log("Navigating to play-demo.html...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise((r) => setTimeout(r, 2000));

    console.log("Navigating to world page...");
    await send("Page.navigate", { url: targetUrl });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture screenshot BEFORE click
    const shotBefore = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(root, "scripts", "shot-before-click.png"), Buffer.from(shotBefore.data, "base64"));

    // Check what elements are on the page
    const textOnPage = await send("Runtime.evaluate", {
      expression: `document.body.innerText`,
      returnByValue: true,
    });
    console.log("TEXT ON PAGE BEFORE CLICK:", textOnPage.result?.value);

    // Click enter button
    console.log("Clicking enter button...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Vào ngay Cõi Sống Khỏe'));
        if (b) b.click();
      })()`,
    });

    await new Promise((r) => setTimeout(r, 3000));

    // Capture screenshot AFTER click
    const shotAfter = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(root, "scripts", "shot-after-click.png"), Buffer.from(shotAfter.data, "base64"));

    const textAfter = await send("Runtime.evaluate", {
      expression: `document.body.innerText`,
      returnByValue: true,
    });
    console.log("TEXT ON PAGE AFTER CLICK:", textAfter.result?.value);
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch(console.error);
