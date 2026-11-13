import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
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
    "--remote-debugging-port=9600",
    "about:blank"
  ]);

  try {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9600/json");
        if (res.ok) break;
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targets = await (await fetch("http://127.0.0.1:9600/json")).json();
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

    // Exact user screen: 378 x 622
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: 378,
      height: 622,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    console.log("Navigating to play-demo.html...");
    await cdp("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
    await new Promise(r => setTimeout(r, 4000));

    // Ensure journey modal is open
    await cdp("Runtime.evaluate", {
      expression: `(() => {
        const dockBtn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hành trình') || b.title?.includes('Hành trình'));
        if (dockBtn && !document.querySelector('.hc-game-modal-journey')) dockBtn.click();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Capture Habits tab
    console.log("Checking Habits tab...");
    await cdp("Runtime.evaluate", {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.hc-journey-nav-tab-btn, button[role="tab"]'));
        const habitTab = tabs.find(t => t.innerText.includes('Thói quen'));
        if (habitTab) habitTab.click();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const habitsScreenshot = await cdp("Page.captureScreenshot", { format: "png" });
    const habitsPath = path.join("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85", "vision-check-habits-378x622.png");
    writeFileSync(habitsPath, Buffer.from(habitsScreenshot.data, "base64"));
    console.log("Saved habits screenshot:", habitsPath);

    // Scroll down to view habits 3, 4, 5, 6
    console.log("Scrolling down in Habits tab...");
    await cdp("Runtime.evaluate", {
      expression: `(() => {
        const goalsSection = document.querySelector('.hc-active-goals-section');
        if (goalsSection) {
          goalsSection.scrollTop = 280;
        }
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 800));

    const habitsScrolledScreenshot = await cdp("Page.captureScreenshot", { format: "png" });
    const habitsScrolledPath = path.join("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85", "vision-check-habits-scrolled-378x622.png");
    writeFileSync(habitsScrolledPath, Buffer.from(habitsScrolledScreenshot.data, "base64"));
    console.log("Saved scrolled habits screenshot:", habitsScrolledPath);

    // 2. Capture Roadmap tab
    console.log("Switching to Roadmap tab...");
    await cdp("Runtime.evaluate", {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.hc-journey-nav-tab-btn, button[role="tab"]'));
        const roadmapTab = tabs.find(t => t.innerText.includes('Lộ trình'));
        if (roadmapTab) roadmapTab.click();
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const roadmapMetrics = await cdp("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal.hc-game-modal-journey');
        const body = document.querySelector('.hc-game-modal-body');
        const banner = document.querySelector('.hc-journey-map-banner');
        const weekBlocks = Array.from(document.querySelectorAll('.hc-trail-week-block'));
        const dayNodes = Array.from(document.querySelectorAll('.hc-day-node'));
        const lastNode = dayNodes[dayNodes.length - 1];

        return {
          windowHeight: window.innerHeight,
          modalRect: modal ? modal.getBoundingClientRect() : null,
          bodyRect: body ? body.getBoundingClientRect() : null,
          bannerRect: banner ? banner.getBoundingClientRect() : null,
          bannerScrollHeight: banner ? banner.scrollHeight : null,
          bannerClientHeight: banner ? banner.clientHeight : null,
          weekBlocksCount: weekBlocks.length,
          dayNodesCount: dayNodes.length,
          lastDayNodeText: lastNode ? lastNode.innerText : null,
          lastDayNodeRect: lastNode ? lastNode.getBoundingClientRect() : null,
          isLastNodeInsideBody: lastNode && body ? (lastNode.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom) : null,
          isLastNodeInsideBanner: lastNode && banner ? (lastNode.getBoundingClientRect().bottom <= banner.getBoundingClientRect().bottom) : null,
        };
      })()`,
      returnByValue: true
    });

    console.log("ROADMAP METRICS:", JSON.stringify(roadmapMetrics.result?.value, null, 2));

    const roadmapScreenshot = await cdp("Page.captureScreenshot", { format: "png" });
    const roadmapPath = path.join("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85", "vision-check-roadmap-378x622.png");
    writeFileSync(roadmapPath, Buffer.from(roadmapScreenshot.data, "base64"));
    console.log("Saved roadmap screenshot:", roadmapPath);

    pageWs.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
