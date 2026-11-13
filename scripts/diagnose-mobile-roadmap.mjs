import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";

const root = "D:\\botly";

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-diag-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=378,622",
  ]);

  let targetWs = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const json = await res.json();
      const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
      if (page) {
        targetWs = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  const ws = new WebSocket(targetWs);
  let id = 1;
  const pending = new Map();
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const currentId = id++;
      pending.set(currentId, resolve);
      ws.send(JSON.stringify({ id: currentId, method, params }));
    });
  }

  await new Promise((r) => ws.on("open", r));
  await send("Page.enable");
  await send("DOM.enable");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 378,
    height: 622,
    deviceScaleFactor: 2,
    mobile: true,
  });

  console.log("Navigating to http://127.0.0.1:3329/play-demo.html...");
  await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });

  let loaded = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const check = await send("Runtime.evaluate", {
      expression: `(() => {
        const hasDock = Boolean(document.querySelector('.hc-rpg-bottom-dock'));
        const hasMap = Boolean(document.querySelector('[data-region-map]') || document.querySelector('.hc-region-map-viewport'));
        return hasDock || hasMap;
      })()`,
      returnByValue: true
    });
    if (check.result?.result?.value) {
      console.log(`Page ready in ${(i+1)*0.5}s`);
      loaded = true;
      break;
    }
  }

  // Dismiss any tour
  await send("Runtime.evaluate", {
    expression: `(() => {
      const skipBtn = document.querySelector('.hc-tour-skip-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Khám phá tự do') || b.textContent.includes('Bỏ qua'));
      if (skipBtn) skipBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click journey dock button
  await send("Runtime.evaluate", {
    expression: `(() => {
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
      const journeyBtn = btns.find(b => b.innerText.includes('Hành Trình') || b.innerText.includes('Journey'));
      if (journeyBtn) journeyBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Click roadmap tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('.hc-game-modal');
      const tabBtns = Array.from(modal?.querySelectorAll('.hc-journey-nav-tab-btn') || []);
      if (tabBtns[1]) tabBtns[1].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  const diag = await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('.hc-game-modal.hc-game-modal-journey') || document.querySelector('.hc-game-modal');
      const body = document.querySelector('.hc-game-modal-journey .hc-game-modal-body') || document.querySelector('.hc-game-modal-body');
      const banner = document.querySelector('.hc-journey-map-banner');
      const backdrop = document.querySelector('.hc-game-modal-backdrop.is-journey-drawer') || document.querySelector('.hc-game-modal-backdrop');
      const weeks = Array.from(document.querySelectorAll('.hc-trail-week-block')).map((w, idx) => {
        const rect = w.getBoundingClientRect();
        return {
          idx,
          text: w.querySelector('.hc-week-title-badge')?.textContent?.trim(),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height),
          visibleInViewport: rect.bottom <= window.innerHeight
        };
      });

      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        backdropRect: backdrop ? { top: Math.round(backdrop.getBoundingClientRect().top), bottom: Math.round(backdrop.getBoundingClientRect().bottom), height: Math.round(backdrop.getBoundingClientRect().height) } : null,
        modalRect: modal ? { top: Math.round(modal.getBoundingClientRect().top), bottom: Math.round(modal.getBoundingClientRect().bottom), height: Math.round(modal.getBoundingClientRect().height) } : null,
        bodyScroll: body ? { scrollHeight: body.scrollHeight, clientHeight: body.clientHeight, scrollTop: body.scrollTop, overflowY: window.getComputedStyle(body).overflowY } : null,
        bannerRect: banner ? { top: Math.round(banner.getBoundingClientRect().top), bottom: Math.round(banner.getBoundingClientRect().bottom), height: Math.round(banner.getBoundingClientRect().height), overflow: window.getComputedStyle(banner).overflow } : null,
        weeks
      };
    })()`,
    returnByValue: true
  });

  const val = diag.result?.result?.value;
  console.log("Roadmap Diagnostic:\n", JSON.stringify(val, null, 2));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (shot.result?.data) {
    writeFileSync("C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/diag-roadmap-378x622.png", Buffer.from(shot.result.data, "base64"));
    console.log("Saved diag-roadmap-378x622.png");
  }

  ws.close();
  chromeProc.kill("SIGKILL");
}

main().catch(console.error);
