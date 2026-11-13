import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9588",
    "about:blank"
  ]);

  try {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9588/json");
        if (res.ok) break;
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targets = await (await fetch("http://127.0.0.1:9588/json")).json();
    const pageTarget = targets.find(t => t.type === "page");
    const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => pageWs.onopen = r);
    let pId = 1;
    const pagePending = new Map();
    pageWs.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pagePending.has(msg.id)) {
        const { resolve, reject } = pagePending.get(msg.id);
        pagePending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    function cdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = pId++;
        pagePending.set(reqId, { resolve, reject });
        pageWs.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await cdp("Page.enable");
    await cdp("DOM.enable");
    await cdp("Runtime.enable");

    // Mobile 390x844
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    console.log("Navigating to play-demo.html...");
    await cdp("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise(r => setTimeout(r, 3000));

    // Switch to roadmap tab
    console.log("Switching to roadmap tab...");
    await cdp("Runtime.evaluate", {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.hc-journey-nav-tab-btn, button[role="tab"]'));
        const roadmapTab = tabs.find(t => t.innerText.includes('Lộ trình'));
        if (roadmapTab) roadmapTab.click();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // Measure bounding boxes
    const metrics = await cdp("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal.hc-game-modal-journey');
        const body = document.querySelector('.hc-game-modal-body');
        const panel = document.querySelector('.hc-my-journey-panel');
        const banner = document.querySelector('.hc-journey-map-banner');
        const weeksContainer = document.querySelector('.hc-roadmap-weeks-container');
        const weekBlocks = Array.from(document.querySelectorAll('.hc-trail-week-block'));
        const dayNodes = Array.from(document.querySelectorAll('.hc-day-node'));

        const getBox = el => el ? {
          rect: el.getBoundingClientRect(),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          offsetHeight: el.offsetHeight,
          overflowY: window.getComputedStyle(el).overflowY,
          maxHeight: window.getComputedStyle(el).maxHeight,
          height: window.getComputedStyle(el).height
        } : null;

        return {
          windowHeight: window.innerHeight,
          modal: getBox(modal),
          body: getBox(body),
          panel: getBox(panel),
          banner: getBox(banner),
          weeksContainer: getBox(weeksContainer),
          weekBlocksCount: weekBlocks.length,
          weekBlocks: weekBlocks.map((w, i) => ({
            week: i + 1,
            title: w.querySelector('.hc-week-title-badge')?.innerText,
            rect: w.getBoundingClientRect()
          })),
          dayNodesCount: dayNodes.length,
          lastDayNode: dayNodes.length ? {
            text: dayNodes[dayNodes.length - 1].innerText,
            rect: dayNodes[dayNodes.length - 1].getBoundingClientRect()
          } : null
        };
      })()`,
      returnByValue: true
    });

    console.log("METRICS RESULT:", JSON.stringify(metrics.result?.value, null, 2));

    pageWs.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
