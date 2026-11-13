import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "round2-audit-screenshots");
mkdirSync(screenshotsDir, { recursive: true });

const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9481;
const profileDir = path.join(root, "App", ".tmp", "test-portrait-profile-" + Date.now());
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

  // Emulate iPhone 14 in PORTRAIT (390 x 844)
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
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

  await send("Page.navigate", { url: "http://localhost:3000/play" });
  await sleep(1500);

  const sessionObj = {
    access_token: session.token,
    refresh_token: session.refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
    user: { id: session.userId, email: session.email },
  };

  await evaluate(`(() => {
    localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
    localStorage.setItem('healthclues-player-locale-v1', 'vi');
    localStorage.setItem('healthclues-player-locale-owner-v1', '${session.userId}');
    localStorage.setItem('healthclues-player-locale-v1:${session.userId}', 'vi');
    document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
  })()`);

  await send("Page.navigate", { url: "http://localhost:3000/en/wellness/healthclues/world" });
  await sleep(4000);

  // 1. Overworld in portrait
  const portraitMetrics = await evaluate(`(() => {
    const root = document.querySelector('.hc-game-root');
    const topbar = document.querySelector('.hc-rpg-topbar');
    const reward = document.querySelector('.hc-rpg-next-reward');
    const capsule = document.querySelector('.hc-rpg-exp-capsule');
    const dock = document.querySelector('.hc-rpg-bottom-dock');
    return {
      rootTop: root?.getBoundingClientRect().top,
      rootMarginTop: root ? window.getComputedStyle(root).marginTop : null,
      topbarTop: topbar?.getBoundingClientRect().top,
      rewardDisplay: reward ? window.getComputedStyle(reward).display : 'none',
      dockDisplay: dock ? window.getComputedStyle(dock).display : 'none',
    };
  })()`);
  console.log("PORTRAIT METRICS:", portraitMetrics);
  await takeScreenshot("portrait_01_overworld_signedin");

  // Dismiss tutorial or intro if present
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const skipBtn = btns.find(b => b.textContent.includes("Bỏ qua") || b.textContent.includes("Skip") || b.getAttribute("aria-label") === "Đóng");
    if (skipBtn) skipBtn.click();
    const closeLumi = document.querySelector(".hc-rpg-lumi-close-btn") || document.querySelector(".hc-rpg-talk-close-btn");
    if (closeLumi) closeLumi.click();
  })()`);
  await sleep(1000);

  // 2. Journey in portrait
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Hành Trình") || el.innerText.includes("Hành trình") || el.innerText.includes("Journey"));
    if (b) b.click();
  })()`);
  await sleep(1500);
  await takeScreenshot("portrait_02_journey_signedin");

  // Close Journey modal
  await evaluate(`(() => {
    const c = document.querySelector(".hc-game-modal-close-btn") || document.querySelector(".hc-close-btn") || document.querySelector(".hc-game-modal-header button");
    if (c) c.click();
  })()`);
  await sleep(1000);

  // 3. Chalet Home in portrait
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Nhà") || el.innerText.includes("Home"));
    if (b) b.click();
  })()`);
  await sleep(2000);
  await takeScreenshot("portrait_03_chalet_home_signedin");

  ws.close();
  chromeProc.kill();
  console.log("Portrait capture complete!");
}

main().catch((err) => {
  console.error("Portrait capture failed:", err);
  chromeProc.kill();
});
