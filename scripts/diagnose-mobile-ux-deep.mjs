import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "mobile-audit-screenshots");
mkdirSync(screenshotsDir, { recursive: true });

const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9455;
const profileDir = path.join(root, "App", ".tmp", "test-mobile-profile-" + Date.now());
mkdirSync(profileDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "--no-sandbox",
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Starting Chrome CDP on port", debugPort);
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
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const WebSocket = (await import("ws")).default;
  const ws = new WebSocket(wsUrl);
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

  async function emulateDevice(width, height, dpr = 3, isMobile = true) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: isMobile,
      screenOrientation: { angle: 0, type: "portraitPrimary" },
    });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  }

  async function takeScreenshot(name) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const p = path.join(screenshotsDir, `${name}.png`);
    writeFileSync(p, Buffer.from(res.data, "base64"));
    console.log(`Saved screenshot: ${name}.png (${Math.round(res.data.length * 0.75 / 1024)} KB)`);
    return p;
  }

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  try {
    // 1. Emulate iPhone 14
    console.log("\n=== EMULATING IPHONE 14 (390 x 844) ===");
    await emulateDevice(390, 844);

    // 2. Establish origin & inject session
    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await sleep(1500);

    const sessionObj = {
      access_token: session.token,
      refresh_token: session.refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
      user: {
        id: session.userId,
        email: session.email,
        email_confirmed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      },
    };

    await evaluate(`(() => {
      const session = ${JSON.stringify(sessionObj)};
      localStorage.setItem('botly-cloud-session', JSON.stringify(session));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${session.userId}');
      localStorage.setItem('healthclues-player-locale-v1:${session.userId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`);

    // Reload /play with authenticated session
    console.log("Navigating into /play with authenticated session...");
    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await sleep(4000);

    await takeScreenshot("01_iphone14_rpg_overworld");

    // Audit Overworld
    const overworldAudit = await evaluate(`(() => {
      const hud = document.querySelector(".hc-rpg-hud") || document.querySelector("header");
      const dock = document.querySelector(".hc-rpg-bottom-dock") || document.querySelector("nav");
      const dpad = document.querySelector(".hc-rpg-dpad") || document.querySelector(".hc-touch-dpad");
      const player = document.querySelector(".hc-rpg-player") || document.querySelector('[data-character]');

      const issues = [];
      const docWidth = document.documentElement.offsetWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      if (scrollWidth > docWidth) {
        issues.push("Horizontal scroll overflow: scrollWidth=" + scrollWidth + " > docWidth=" + docWidth);
      }

      // Check dock buttons
      const dockBtns = document.querySelectorAll(".hc-rpg-dock-btn");
      const dockInfo = Array.from(dockBtns).map(b => {
        const r = b.getBoundingClientRect();
        return { text: b.innerText.trim(), width: Math.round(r.width), height: Math.round(r.height) };
      });

      // Check HUD layout
      const hudRect = hud ? hud.getBoundingClientRect() : null;
      if (hudRect && hudRect.height > 100) {
        issues.push("HUD height too tall: " + hudRect.height + "px");
      }

      return {
        hasHud: !!hud,
        hasDock: !!dock,
        dockBtnCount: dockBtns.length,
        dockInfo,
        hasDpad: !!dpad,
        hasPlayer: !!player,
        issues,
      };
    })()`);
    console.log("Overworld Audit:", JSON.stringify(overworldAudit, null, 2));

    // 2. Open Mystery Gift Modal on iPhone 14
    console.log("\n=== TESTING MYSTERY GIFT MODAL ON MOBILE ===");
    await evaluate(`(() => {
      const giftBtn = document.querySelector('[aria-label*="Quà"]') || document.querySelector('[aria-label*="Gift"]') || Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Quà"));
      if (giftBtn) giftBtn.click();
    })()`);
    await sleep(1500);
    await takeScreenshot("02_iphone14_mystery_gift_modal");

    const giftAudit = await evaluate(`(() => {
      const card = document.querySelector(".hc-mystery-modal-card");
      if (!card) return { found: false };
      const r = card.getBoundingClientRect();
      const issues = [];
      if (r.width > window.innerWidth) issues.push("Card width overflows window");
      if (r.bottom > window.innerHeight) issues.push("Card bottom cut off: " + r.bottom + " > " + window.innerHeight);

      const btns = Array.from(card.querySelectorAll("button")).map(b => {
        const br = b.getBoundingClientRect();
        return { text: b.innerText.trim(), width: Math.round(br.width), height: Math.round(br.height) };
      });

      return {
        found: true,
        cardSize: { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top) },
        btns,
        issues
      };
    })()`);
    console.log("Mystery Gift Modal Audit:", JSON.stringify(giftAudit, null, 2));

    // Close gift modal
    await evaluate(`(() => {
      const c = document.querySelector(".hc-mystery-close-btn") || document.querySelector(".hc-mystery-secondary-btn");
      if (c) c.click();
    })()`);
    await sleep(800);

    // 3. Open Chalet Home on iPhone 14
    console.log("\n=== ENTERING CHALET WELLNESS HOME ON IPHONE 14 ===");
    await evaluate(`(() => {
      const homeBtn = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(b => b.innerText.includes("Nhà") || b.innerText.includes("Home") || b.getAttribute("aria-label")?.includes("Nhà"));
      if (homeBtn) homeBtn.click();
    })()`);
    await sleep(2500);
    await takeScreenshot("03_iphone14_chalet_home_living_room");

    const homeAudit = await evaluate(`(() => {
      const container = document.querySelector(".hc-wellness-home-container");
      if (!container) return { found: false };

      const header = document.querySelector(".hc-wellness-home-header");
      const stage = document.querySelector(".hc-wellness-home-stage");
      const tabs = document.querySelector(".hc-wellness-home-tabs");
      const items = document.querySelectorAll(".hc-stage-item-wrapper");

      const headerRect = header ? header.getBoundingClientRect() : null;
      const stageRect = stage ? stage.getBoundingClientRect() : null;

      const issues = [];
      if (headerRect && headerRect.height > 100) {
        issues.push("Header height is excessively large on mobile: " + Math.round(headerRect.height) + "px (takes up too much screen)");
      }
      if (stageRect && (stageRect.height < 180 || stageRect.height > 350)) {
        issues.push("Stage height is out of bounds on mobile: " + Math.round(stageRect.height) + "px");
      }

      const tabBtns = Array.from(document.querySelectorAll(".hc-wellness-home-tab-btn")).map(b => ({
        text: b.innerText.trim(),
        width: Math.round(b.getBoundingClientRect().width),
        height: Math.round(b.getBoundingClientRect().height),
      }));

      const actionBtns = Array.from(document.querySelectorAll(".hc-wellness-home-btn")).map(b => ({
        text: b.innerText.trim(),
        width: Math.round(b.getBoundingClientRect().width),
        height: Math.round(b.getBoundingClientRect().height),
      }));

      return {
        found: true,
        headerHeight: headerRect ? Math.round(headerRect.height) : null,
        stageSize: stageRect ? { width: Math.round(stageRect.width), height: Math.round(stageRect.height) } : null,
        tabBtns,
        actionBtns,
        visibleItemsCount: items.length,
        issues,
      };
    })()`);
    console.log("Chalet Home Living Room Audit:", JSON.stringify(homeAudit, null, 2));

    // 4. Switch to Bedroom on iPhone 14
    console.log("\n=== SWITCHING TO BEDROOM ON IPHONE 14 ===");
    await evaluate(`(() => {
      const bedTab = Array.from(document.querySelectorAll(".hc-wellness-home-tab-btn")).find(b => b.innerText.includes("Phòng Ngủ") || b.innerText.includes("Bedroom"));
      if (bedTab) bedTab.click();
    })()`);
    await sleep(1200);
    await takeScreenshot("04_iphone14_chalet_home_bedroom");

    // 5. Trigger Daily Reward Modal in Home ("Chọn 1 Trong 2")
    console.log("\n=== TRIGGERING DAILY REWARD MODAL IN HOME ===");
    await evaluate(`(() => {
      const rewardBtn = document.querySelector(".hc-wellness-home-btn.is-reward") ||
        Array.from(document.querySelectorAll(".hc-wellness-home-btn")).find(b => b.innerText.includes("Nhận Quà") || b.innerText.includes("Reward") || b.innerText.includes("Gift"));
      if (rewardBtn) rewardBtn.click();
    })()`);
    await sleep(1500);
    await takeScreenshot("05_iphone14_home_daily_reward_modal");

    const rewardAudit = await evaluate(`(() => {
      const card = document.querySelector(".hc-home-modal-card");
      if (!card) return { found: false };
      const r = card.getBoundingClientRect();
      const issues = [];
      if (r.width > window.innerWidth) issues.push("Modal width overflows screen");
      if (r.bottom > window.innerHeight) issues.push("Modal bottom overflows screen fold: " + Math.round(r.bottom) + " > " + window.innerHeight);

      const pickCards = Array.from(document.querySelectorAll(".hc-home-pick-card")).map(c => {
        const pr = c.getBoundingClientRect();
        return { width: Math.round(pr.width), height: Math.round(pr.height) };
      });

      const confirmBtn = document.querySelector('[data-testid="confirm-reward-btn"]');
      const confirmRect = confirmBtn ? confirmBtn.getBoundingClientRect() : null;

      return {
        found: true,
        cardSize: { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) },
        pickCards,
        confirmBtnVisible: confirmRect ? confirmRect.bottom <= window.innerHeight : false,
        issues,
      };
    })()`);
    console.log("Daily Reward Modal Audit:", JSON.stringify(rewardAudit, null, 2));

    // 6. Test on Galaxy S21 (360 x 800)
    console.log("\n=== TESTING GALAXY S21 (360 x 800) ===");
    await emulateDevice(360, 800, 2.625);
    await sleep(1000);
    await takeScreenshot("06_galaxy_s21_daily_reward_modal");

    // Close modal
    await evaluate(`(() => {
      const c = document.querySelector('[data-testid="close-reward-modal-btn"]');
      if (c) c.click();
    })()`);
    await sleep(800);
    await takeScreenshot("07_galaxy_s21_chalet_home");

    // 7. Test on iPhone SE (375 x 667)
    console.log("\n=== TESTING IPHONE SE (375 x 667) ===");
    await emulateDevice(375, 667, 2);
    await sleep(1000);
    await takeScreenshot("08_iphone_se_chalet_home");

    console.log("\n=== ALL MOBILE AUDITS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Error during mobile audit:", err);
  } finally {
    ws.close();
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
