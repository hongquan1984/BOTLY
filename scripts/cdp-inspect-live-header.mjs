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

    // TEST Mobile 390x844 on LIVE botly.vn/healthclues
    console.log("--- Testing Mobile 390x844 on LIVE botly.vn/healthclues ---");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });
    await send("Page.navigate", { url: "https://www.botly.vn/healthclues" });
    await new Promise((r) => setTimeout(r, 3500));

    // Scroll to the doors section
    await send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector('.hc-doors-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const shotMobile = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "live_prod_compact_mobile_390.png"), Buffer.from(shotMobile.data, "base64"));
    console.log("Live mobile screenshot saved to live_prod_compact_mobile_390.png");

    const headerMetrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const sec = document.querySelector('.hc-doors-section');
        const hdr = document.querySelector('.hc-doors-section .hc-section-header');
        const title = document.querySelector('.hc-doors-section .hc-section-title');
        const desc = document.querySelector('.hc-doors-section .hc-section-desc');
        const container = document.querySelector('.hc-carousel-3d-container');
        const activeCard = document.querySelector('.carousel-3d-card.is-center');
        
        return {
          sectionPaddingTop: sec ? window.getComputedStyle(sec).paddingTop : null,
          headerHeight: hdr ? Math.round(hdr.getBoundingClientRect().height) : null,
          titleHeight: title ? Math.round(title.getBoundingClientRect().height) : null,
          titleText: title ? title.innerText.replace(/\\n/g, ' ') : null,
          titleFontSize: title ? window.getComputedStyle(title).fontSize : null,
          descText: desc ? desc.innerText : null,
          descHeight: desc ? Math.round(desc.getBoundingClientRect().height) : null,
          activeCardTop: activeCard ? Math.round(activeCard.getBoundingClientRect().top) : null,
          activeCardBottom: activeCard ? Math.round(activeCard.getBoundingClientRect().bottom) : null,
          activeCardLeft: activeCard ? Math.round(activeCard.getBoundingClientRect().left) : null,
          activeCardWidth: activeCard ? Math.round(activeCard.getBoundingClientRect().width) : null,
          windowHeight: window.innerHeight,
          isEntireCardInViewport: activeCard ? (activeCard.getBoundingClientRect().bottom <= window.innerHeight) : null
        };
      })()`,
      returnByValue: true,
    });
    console.log("Live Prod Mobile Header & Card Metrics:", JSON.stringify(headerMetrics.result.value, null, 2));

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
