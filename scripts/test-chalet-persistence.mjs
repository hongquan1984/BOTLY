import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "chalet-persistence-screenshots");
mkdirSync(screenshotsDir, { recursive: true });

const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9484;
const profileDir = path.join(root, "App", ".tmp", "test-chalet-profile-" + Date.now());
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

  // Dismiss tutorial or intro if present
  await evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const skipBtn = btns.find(b => b.textContent.includes("Bỏ qua") || b.textContent.includes("Skip") || b.getAttribute("aria-label") === "Đóng");
    if (skipBtn) skipBtn.click();
    const closeLumi = document.querySelector(".hc-rpg-lumi-close-btn") || document.querySelector(".hc-rpg-talk-close-btn");
    if (closeLumi) closeLumi.click();
  })()`);
  await sleep(1000);

  // 1. First visit to Chalet: Open Home
  console.log("Opening Chalet first time...");
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Nhà") || el.innerText.includes("Home"));
    if (b) b.click();
  })()`);
  await sleep(2000);

  // Check if welcome modal opened on first visit
  const welcomeOpened = await evaluate(`Boolean(document.querySelector('[data-testid="welcome-gift-modal"]'))`);
  console.log("Welcome modal open on first visit:", welcomeOpened);
  await takeScreenshot("chalet_01_first_visit_welcome_modal");

  // Claim welcome gift if modal is open
  if (welcomeOpened) {
    console.log("Claiming welcome gift...");
    await evaluate(`(() => {
      const claimBtn = document.querySelector('[data-testid="claim-welcome-btn"]');
      if (claimBtn) claimBtn.click();
    })()`);
    await sleep(2000);
  }

  // Verify sofa is in room and 2/10 badge is NOT present
  const checkChaletFirstVisit = await evaluate(`(() => {
    const badge = document.querySelector('[data-testid="unlocked-count-badge"]');
    const sofa = document.querySelector('[data-testid="stage-item-sofa_luxury"]');
    const title = document.querySelector('.hc-wellness-home-title')?.textContent;
    return {
      hasBadge: Boolean(badge),
      badgeText: badge?.textContent?.trim() || null,
      hasSofa: Boolean(sofa),
      title: title?.trim(),
    };
  })()`);
  console.log("Chalet state after claim:", checkChaletFirstVisit);
  await takeScreenshot("chalet_02_claimed_sofa_no_badge");

  // 2. Return to World Map
  console.log("Returning to World Map...");
  await evaluate(`(() => {
    const backBtn = document.querySelector('[data-testid="home-back-button"]');
    if (backBtn) backBtn.click();
  })()`);
  await sleep(1500);

  // 3. Re-enter Chalet: Second visit (simulating re-entering game)
  console.log("Re-entering Chalet second time...");
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Nhà") || el.innerText.includes("Home"));
    if (b) b.click();
  })()`);
  await sleep(2000);

  // Check state on second visit
  const checkChaletSecondVisit = await evaluate(`(() => {
    const welcomeModal = document.querySelector('[data-testid="welcome-gift-modal"]');
    const badge = document.querySelector('[data-testid="unlocked-count-badge"]');
    const sofa = document.querySelector('[data-testid="stage-item-sofa_luxury"]');
    const title = document.querySelector('.hc-wellness-home-title')?.textContent;
    return {
      welcomeModalPresent: Boolean(welcomeModal),
      hasBadge: Boolean(badge),
      hasSofa: Boolean(sofa),
      title: title?.trim(),
    };
  })()`);
  console.log("SECOND VISIT VERIFICATION:", checkChaletSecondVisit);
  await takeScreenshot("chalet_03_second_visit_auto_loaded");

  ws.close();
  chromeProc.kill();
  console.log("Test finished successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  chromeProc.kill();
});
