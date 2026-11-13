import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "live-landscape-production");
mkdirSync(screenshotsDir, { recursive: true });

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9498;
const profileDir = path.join(root, "App", ".tmp", "test-live-profile-" + Date.now());
mkdirSync(profileDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "--disable-gpu",
  "--no-sandbox",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (let i = 0; i < 30; i++) {
    try {
      const s = net.createConnection(debugPort, "127.0.0.1");
      await new Promise((res, rej) => {
        s.once("connect", () => { s.end(); res(); });
        s.once("error", rej);
      });
      break;
    } catch {
      await sleep(200);
    }
  }

  const json = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const pageTarget = json.find((t) => t.type === "page");
  const WebSocket = (await import("ws")).default;
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.once("open", resolve));

  let reqId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = reqId++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("DOM.enable");
  await send("Runtime.enable");

  // 1. Emulate iPhone 14 in LANDSCAPE (844 x 390)
  await send("Emulation.setDeviceMetricsOverride", {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: "landscapePrimary" },
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  async function takeScreenshot(name) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const p = path.join(screenshotsDir, `${name}.png`);
    writeFileSync(p, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${name}.png`);
    return p;
  }

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  console.log("Navigating to live production: https://www.botly.vn/play...");
  await send("Page.navigate", { url: "https://www.botly.vn/play" });
  await sleep(4500);

  // If there is an entry button or region card, enter region
  await evaluate(`(() => {
    const enterBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.textContent.includes("VÀO") || b.textContent.includes("ENTER") || b.textContent.includes("Khám phá")
    );
    if (enterBtn) enterBtn.click();
    const skipBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.textContent.includes("Bỏ qua") || b.textContent.includes("Skip")
    );
    if (skipBtn) skipBtn.click();
  })()`);
  await sleep(3000);

  // Audit landscape bottom dock on live production
  const dockAudit = await evaluate(`(() => {
    const dock = document.querySelector('.hc-rpg-bottom-dock');
    if (!dock) return { found: false, htmlPreview: document.body.innerText.substring(0, 300) };
    const rect = dock.getBoundingClientRect();
    const style = window.getComputedStyle(dock);
    const buttons = Array.from(dock.querySelectorAll('.hc-rpg-dock-btn')).map(b => ({
      label: b.querySelector('.hc-rpg-dock-label')?.textContent?.trim() || b.textContent.trim(),
      width: Math.round(b.getBoundingClientRect().width),
      height: Math.round(b.getBoundingClientRect().height)
    }));

    const mystery = document.querySelector('.hc-rpg-next-reward');
    const mysteryDisplay = mystery ? window.getComputedStyle(mystery).display : 'none';

    return {
      found: true,
      display: style.display,
      dockRect: {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        left: Math.round(rect.left)
      },
      buttonsCount: buttons.length,
      buttons,
      mysteryDisplay,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  })()`);

  console.log("LIVE PRODUCTION LANDSCAPE AUDIT:\n", JSON.stringify(dockAudit, null, 2));
  await takeScreenshot("01_live_landscape_restored_dock");

  // Open Home/Chalet
  console.log("Navigating to Chalet Home on live production...");
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Nhà") || el.innerText.includes("Home"));
    if (b) b.click();
  })()`);
  await sleep(3500);

  // Dismiss welcome modal if present
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="claim-welcome-btn"]') || document.querySelector(".hc-home-modal-card button");
    if (btn) btn.click();
  })()`);
  await sleep(2000);

  await takeScreenshot("02_live_landscape_chalet");

  ws.close();
  chromeProc.kill("SIGKILL");
  console.log("LIVE PRODUCTION AUDIT COMPLETED!");
}

main().catch((err) => {
  console.error("Live test error:", err);
  try { chromeProc.kill("SIGKILL"); } catch (e) {}
  process.exit(1);
});
