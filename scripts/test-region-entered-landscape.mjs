import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "landscape-verified-final");
mkdirSync(screenshotsDir, { recursive: true });

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9502;
const profileDir = path.join(root, "App", ".tmp", "test-region-profile-" + Date.now());
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

  // Emulate iPhone 14 in LANDSCAPE (844 x 390)
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

  console.log("1. Navigating to http://localhost:3000/play...");
  await send("Page.navigate", { url: "http://localhost:3000/play" });
  await sleep(3500);

  // If on welcome, click start
  await evaluate(`(() => {
    const startBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.textContent.includes("Start") || b.textContent.includes("Bắt đầu") || b.textContent.includes("Hành trình")
    );
    if (startBtn) startBtn.click();
  })()`);
  await sleep(2000);

  // Click on region card (Sleep Valley or HealthClues Realm)
  console.log("2. Clicking region pin...");
  await evaluate(`(() => {
    const pin = document.querySelector('[data-region="sleep-better"]') ||
                document.querySelector('[data-region="health-concern"]') ||
                Array.from(document.querySelectorAll("button, .hc-region-node, [role='button']")).find(el => 
                  el.textContent.includes("Sleep") || el.textContent.includes("HealthClues") || el.textContent.includes("Giấc ngủ")
                );
    if (pin) pin.click();
  })()`);
  await sleep(1500);

  // Click VÀO KHU VỰC
  console.log("3. Entering region scene...");
  await evaluate(`(() => {
    const enterBtn = document.querySelector(".hc-gold-action") || 
      Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("VÀO") || b.textContent.includes("ENTER"));
    if (enterBtn) enterBtn.click();
  })()`);
  await sleep(3500);

  // Dismiss tutorial guide
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.textContent.includes("Skip") || b.textContent.includes("Bỏ qua") || b.textContent.includes("freely")
    );
    if (skipBtn) skipBtn.click();
    const closeLumi = document.querySelector(".hc-rpg-lumi-close-btn") || document.querySelector(".hc-rpg-talk-close-btn");
    if (closeLumi) closeLumi.click();
  })()`);
  await sleep(1000);

  // 4. Audit landscape bottom dock
  console.log("4. Auditing landscape bottom dock...");
  const dockAudit = await evaluate(`(() => {
    const dock = document.querySelector('.hc-rpg-bottom-dock');
    if (!dock) return { found: false, body: document.body.innerText.substring(0, 300) };
    const rect = dock.getBoundingClientRect();
    const style = window.getComputedStyle(dock);
    const buttons = Array.from(dock.querySelectorAll('.hc-rpg-dock-btn')).map(b => ({
      label: b.querySelector('.hc-rpg-dock-label')?.textContent?.trim() || b.textContent.trim(),
      width: Math.round(b.getBoundingClientRect().width),
      height: Math.round(b.getBoundingClientRect().height)
    }));

    const mystery = document.querySelector('.hc-rpg-next-reward');
    const mysteryDisplay = mystery ? window.getComputedStyle(mystery).display : 'none';

    const lumiBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
    const lumiRect = lumiBtn ? lumiBtn.getBoundingClientRect() : null;

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
      lumiClearance: lumiRect ? Math.round(rect.top - lumiRect.bottom) : null,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
  })()`);

  console.log("LANDSCAPE DOCK AUDIT RESULT:\n", JSON.stringify(dockAudit, null, 2));
  await takeScreenshot("01_landscape_overworld_dock_restored");

  // 5. Open Journey in landscape
  console.log("5. Testing Journey modal in landscape...");
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Journey") || el.innerText.includes("Hành trình"));
    if (b) b.click();
  })()`);
  await sleep(1500);
  await takeScreenshot("02_landscape_journey_modal");

  // Close Journey modal
  await evaluate(`(() => {
    const c = document.querySelector(".hc-game-modal-header button") || document.querySelector("[data-close-game-modal]");
    if (c) c.click();
  })()`);
  await sleep(800);

  // 6. Open Chalet Home in landscape
  console.log("6. Testing Chalet Home in landscape...");
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Home") || el.innerText.includes("Nhà"));
    if (b) b.click();
  })()`);
  await sleep(2500);

  // Dismiss welcome modal if open
  await evaluate(`(() => {
    const btn = document.querySelector('[data-testid="claim-welcome-btn"]') || document.querySelector(".hc-home-modal-card button");
    if (btn) btn.click();
  })()`);
  await sleep(1500);
  await takeScreenshot("03_landscape_chalet_restored");

  ws.close();
  chromeProc.kill("SIGKILL");
  console.log("LANDSCAPE TESTS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test error:", err);
  try { chromeProc.kill("SIGKILL"); } catch (e) {}
  process.exit(1);
});
