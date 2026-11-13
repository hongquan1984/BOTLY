import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\26d5c7f6-01a9-45c4-9f12-9d045293059f";

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
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
    assert.ok(targetWs, "Could not connect to Chrome debugging target");

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
    await send("DOM.enable");
    await send("Runtime.enable");

    // TEST 1: Desktop 1440x900
    console.log("--- Testing Desktop 1440x900 ---");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://127.0.0.1:3000/healthclues" });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to carousel
    await send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector('.hc-doors-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // Capture desktop screenshot
    const shotDesktop = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "test_check_desktop_1440.png"), Buffer.from(shotDesktop.data, "base64"));
    console.log("Desktop screenshot saved to test_check_desktop_1440.png");

    // Inspect font and text of active card on desktop
    const fontInfo = await send("Runtime.evaluate", {
      expression: `(() => {
        const title = document.querySelector('.carousel-3d-card.is-center .card-title') || document.querySelector('.card-title');
        if (!title) return { error: 'No card-title found' };
        const cs = window.getComputedStyle(title);
        return {
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          innerText: title.innerText,
          textContent: title.textContent,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Desktop active card font info:", fontInfo.result.value);

    // TEST 2: Mobile 390x844
    console.log("--- Testing Mobile 390x844 ---");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });
    await new Promise((r) => setTimeout(r, 800));

    await send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector('.hc-doors-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotMobile = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "test_check_mobile_390.png"), Buffer.from(shotMobile.data, "base64"));
    console.log("Mobile screenshot saved to test_check_mobile_390.png");

    const mobileMetrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.carousel-3d-card')).map((c, i) => {
          const r = c.getBoundingClientRect();
          const cs = window.getComputedStyle(c);
          return {
            index: i,
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            isCenter: c.classList.contains('is-center'),
            opacity: cs.opacity,
            transform: c.style.transform,
            title: c.querySelector('.card-title')?.textContent?.trim()
          };
        });
        return {
          windowWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          cards
        };
      })()`,
      returnByValue: true,
    });
    console.log("Mobile metrics:", JSON.stringify(mobileMetrics.result.value, null, 2));

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
