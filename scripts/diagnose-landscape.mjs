import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "landscape-audit-screenshots");
mkdirSync(screenshotsDir, { recursive: true });

const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9477;
const profileDir = path.join(root, "App", ".tmp", "test-landscape-profile-" + Date.now());
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
    deviceScaleFactor: 3,
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
    localStorage.setItem('healthclues-player-locale-v1', 'en');
    localStorage.setItem('healthclues-player-locale-owner-v1', '${session.userId}');
    localStorage.setItem('healthclues-player-locale-v1:${session.userId}', 'en');
    document.cookie = 'hc_locale=en; Path=/; Max-Age=2592000';
  })()`);

  await send("Page.navigate", { url: "http://localhost:3000/play" });
  await sleep(3500);

  // 1. Overworld in landscape
  await takeScreenshot("landscape_01_overworld");
  const overworldDiag = await evaluate(`(() => {
    return {
      windowSize: { w: window.innerWidth, h: window.innerHeight },
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  })()`);
  console.log("Overworld Landscape Diag:", JSON.stringify(overworldDiag, null, 2));

  // 2. Open My Journey in landscape
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Journey") || el.innerText.includes("Hành trình"));
    if (b) b.click();
  })()`);
  await sleep(1500);
  await takeScreenshot("landscape_02_journey_modal");
  const journeyDiag = await evaluate(`(() => {
    const modal = document.querySelector(".hc-game-modal") || document.querySelector(".hc-my-journey-panel");
    const r = modal ? modal.getBoundingClientRect() : null;
    return {
      modalFound: !!modal,
      modalRect: r ? { top: r.top, bottom: r.bottom, height: r.height, width: r.width } : null,
      fitsScreen: r ? r.bottom <= window.innerHeight : false,
      removeBtns: Array.from(document.querySelectorAll(".hc-quest-change-habit-btn")).length,
    };
  })()`);
  console.log("Journey Landscape Diag:", JSON.stringify(journeyDiag, null, 2));

  // Close Journey modal
  await evaluate(`(() => {
    const c = document.querySelector(".hc-game-modal-close-btn") || document.querySelector(".hc-close-btn");
    if (c) c.click();
  })()`);
  await sleep(800);

  // 3. Open Home in landscape
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Home") || el.innerText.includes("Nhà"));
    if (b) b.click();
  })()`);
  await sleep(2000);

  // If welcome modal is open, dismiss it
  await evaluate(`(() => {
    const btn = document.querySelector(".hc-home-modal-card button");
    if (btn) btn.click();
  })()`);
  await sleep(1500);

  await takeScreenshot("landscape_03_chalet_home");
  const homeDiag = await evaluate(`(() => {
    const stage = document.querySelector(".hc-wellness-home-stage");
    const mobileCard = document.querySelector(".hc-mobile-room-card");
    const tabs = document.querySelector(".hc-wellness-home-tabs");
    const sr = stage ? stage.getBoundingClientRect() : null;
    const cr = mobileCard ? mobileCard.getBoundingClientRect() : null;
    const tr = tabs ? tabs.getBoundingClientRect() : null;
    return {
      stageRect: sr ? { width: Math.round(sr.width), height: Math.round(sr.height), top: Math.round(sr.top) } : null,
      cardVisible: cr ? cr.height > 0 : false,
      cardRect: cr ? { width: Math.round(cr.width), height: Math.round(cr.height), top: Math.round(cr.top) } : null,
      tabsRect: tr ? { width: Math.round(tr.width), height: Math.round(tr.height), top: Math.round(tr.top) } : null,
      bodyOverflow: document.documentElement.scrollHeight > window.innerHeight,
    };
  })()`);
  console.log("Home Landscape Diag:", JSON.stringify(homeDiag, null, 2));

  ws.close();
  chromeProc.kill("SIGKILL");
}

main().catch(console.error);
