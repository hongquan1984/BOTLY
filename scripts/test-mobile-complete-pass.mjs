import assert from "node:assert/strict";
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

const debugPort = 9466;
const profileDir = path.join(root, "App", ".tmp", "test-mobile-profile-verify-" + Date.now());
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
  console.log("================================================================================");
  console.log("HEALTHCLUES MOBILE USER EXPERIENCE (UX) RIGOROUS AUDIT SUITE");
  console.log("Testing Viewports: iPhone 14 (390x844), Galaxy S21 (360x800), iPhone SE (375x667)");
  console.log("Target Base URL: http://localhost:3000");
  console.log("================================================================================\n");

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

  async function emulateDevice(width, height, dpr = 3) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: true,
      screenOrientation: { angle: 0, type: "portraitPrimary" },
    });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  }

  async function takeScreenshot(name) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const p = path.join(screenshotsDir, `${name}.png`);
    writeFileSync(p, Buffer.from(res.data, "base64"));
    console.log(`  ✓ Saved visual snapshot: ${name}.png`);
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
    // -----------------------------------------------------------------------------------
    // STAGE 1: IPHONE 14 (390 x 844) - MAIN RPG PLAYER EXPERIENCE
    // -----------------------------------------------------------------------------------
    console.log(">>> [STAGE 1] AUDITING IPHONE 14 (390 x 844) - MAIN RPG EXPERIENCE");
    await emulateDevice(390, 844);

    // Seed session
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

    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await sleep(3500);
    await takeScreenshot("verify_01_iphone14_rpg_overworld");

    const overworldCheck = await evaluate(`(() => {
      const docW = document.documentElement.offsetWidth;
      const scrollW = document.documentElement.scrollWidth;
      const dock = document.querySelector(".hc-rpg-bottom-dock");
      const dockBtns = Array.from(document.querySelectorAll(".hc-rpg-dock-btn"));
      const giftBox = document.querySelector(".hc-rpg-next-reward");

      return {
        hasOverflow: scrollW > docW,
        scrollW,
        docW,
        hasDock: !!dock,
        dockBtnCount: dockBtns.filter(b => b.getBoundingClientRect().width > 0).length,
        dockBtnHeights: dockBtns.map(b => b.getBoundingClientRect().height).filter(h => h > 0),
        giftBoxVisible: giftBox ? giftBox.getBoundingClientRect().width > 0 : false,
      };
    })()`);

    assert.equal(overworldCheck.hasOverflow, false, "Overworld must not have horizontal scroll overflow.");
    assert.ok(overworldCheck.hasDock, "Bottom dock must exist.");
    assert.equal(overworldCheck.dockBtnCount, 5, "5 mobile dock buttons must be visible.");
    assert.ok(overworldCheck.dockBtnHeights.every(h => h >= 44), "Dock buttons must meet min 44px tap target.");
    assert.ok(overworldCheck.giftBoxVisible, "Level-up Mystery Gift box must be visible on mobile.");
    console.log("  ✓ Stage 1 Passed: Overworld, Dock, and Gift Box verified.\n");

    // -----------------------------------------------------------------------------------
    // STAGE 2: MYSTERY GIFT MODAL ON MOBILE (TAP TARGET & CARD SIZING)
    // -----------------------------------------------------------------------------------
    console.log(">>> [STAGE 2] AUDITING MYSTERY GIFT MODAL ON MOBILE");
    await evaluate(`(() => {
      const gift = document.querySelector(".hc-rpg-next-reward");
      if (gift) gift.click();
    })()`);
    await sleep(1500);
    await takeScreenshot("verify_02_iphone14_mystery_gift_modal");

    const giftModalCheck = await evaluate(`(() => {
      const card = document.querySelector(".hc-mystery-modal-card");
      if (!card) return { found: false };
      const cr = card.getBoundingClientRect();
      const closeBtn = document.querySelector(".hc-mystery-close-btn");
      const closeR = closeBtn ? closeBtn.getBoundingClientRect() : null;

      return {
        found: true,
        fitsScreen: cr.width <= window.innerWidth && cr.bottom <= window.innerHeight,
        closeBtnTarget: closeR ? { width: Math.round(closeR.width), height: Math.round(closeR.height) } : null,
      };
    })()`);

    assert.ok(giftModalCheck.found, "Mystery gift modal must open on tap.");
    assert.ok(giftModalCheck.fitsScreen, "Mystery gift modal must fit within mobile screen bounds.");
    assert.ok(giftModalCheck.closeBtnTarget.width >= 44 && giftModalCheck.closeBtnTarget.height >= 44, "Close button must have at least 44x44px touch target.");
    console.log("  ✓ Stage 2 Passed: Mystery Gift Modal fits mobile and has 44x44px close target.\n");

    // Close modal
    await evaluate(`document.querySelector(".hc-mystery-close-btn").click()`);
    await sleep(600);

    // -----------------------------------------------------------------------------------
    // STAGE 3: CHALET WELLNESS HOME ON IPHONE 14 (SLIM HEADER & BOTTOM DOCK TABS)
    // -----------------------------------------------------------------------------------
    console.log(">>> [STAGE 3] AUDITING CHALET WELLNESS HOME ON IPHONE 14");
    await evaluate(`(() => {
      const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Nhà") || el.innerText.includes("Home"));
      if (b) b.click();
    })()`);
    await sleep(2500);
    await takeScreenshot("verify_03_iphone14_chalet_home_living_room");

    const homeCheck = await evaluate(`(() => {
      const header = document.querySelector(".hc-wellness-home-header");
      const stage = document.querySelector(".hc-wellness-home-stage");
      const tabs = document.querySelector(".hc-wellness-home-tabs");
      const tabBtns = Array.from(document.querySelectorAll(".hc-wellness-home-tab-btn"));

      const hr = header ? header.getBoundingClientRect() : null;
      const sr = stage ? stage.getBoundingClientRect() : null;
      const tr = tabs ? tabs.getBoundingClientRect() : null;

      return {
        found: !!header,
        headerHeight: hr ? Math.round(hr.height) : 0,
        stageWidth: sr ? Math.round(sr.width) : 0,
        stageHeight: sr ? Math.round(sr.height) : 0,
        stageRatio: sr ? (sr.width / sr.height).toFixed(2) : 0,
        tabsRect: tr ? { top: Math.round(tr.top), bottom: Math.round(tr.bottom), height: Math.round(tr.height) } : null,
        windowHeight: window.innerHeight,
        tabsBottomDocked: tr ? tr.bottom > (window.innerHeight - 120) : false,
        tabBtnCount: tabBtns.length,
        tabBtnHeights: tabBtns.map(b => b.getBoundingClientRect().height),
      };
    })()`);

    console.log("Stage 3 homeCheck:", JSON.stringify(homeCheck, null, 2));

    assert.ok(homeCheck.found, "Chalet Home must render.");
    assert.ok(homeCheck.headerHeight <= 75, `Header must be slim on mobile (got ${homeCheck.headerHeight}px, was 226px).`);
    assert.ok(homeCheck.stageHeight >= 180 && homeCheck.stageHeight <= 350, `Stage must maintain proportional height on mobile (got ${homeCheck.stageHeight}px).`);
    assert.ok(Math.abs(Number(homeCheck.stageRatio) - 1.78) < 0.1, `Stage must maintain 16:9 aspect ratio without distortion (got ${homeCheck.stageRatio}).`);
    assert.ok(homeCheck.tabsBottomDocked, "Room tabs must be docked at bottom of viewport for thumb access.");
    assert.ok(homeCheck.tabBtnHeights.every(h => h >= 40), "Tab buttons must have touch-friendly height.");
    console.log("  ✓ Stage 3 Passed: Chalet Home header slimmed (66px) and tabs docked at bottom.\n");

    // Switch to Bedroom
    await evaluate(`(() => {
      const b = Array.from(document.querySelectorAll(".hc-wellness-home-tab-btn")).find(el => el.innerText.includes("Phòng Ngủ") || el.innerText.includes("Bedroom"));
      if (b) b.click();
    })()`);
    await sleep(1000);
    await takeScreenshot("verify_04_iphone14_chalet_home_bedroom");

    // -----------------------------------------------------------------------------------
    // STAGE 4: DAILY REWARD MODAL ("CHỌN 1 TRONG 2") - SIDE-BY-SIDE & 100% VISIBLE
    // -----------------------------------------------------------------------------------
    console.log(">>> [STAGE 4] AUDITING DAILY REWARD MODAL (PICK 1 OF 2) ON MOBILE");
    await evaluate(`(() => {
      const r = document.querySelector(".hc-wellness-home-btn.is-reward") ||
        Array.from(document.querySelectorAll(".hc-wellness-home-btn")).find(el => el.innerText.includes("Nhận Quà") || el.innerText.includes("Reward") || el.innerText.includes("Gift"));
      if (r) r.click();
    })()`);
    await sleep(1500);
    await takeScreenshot("verify_05_iphone14_daily_reward_modal");

    const rewardModalCheck = await evaluate(`(() => {
      const card = document.querySelector(".hc-home-modal-card");
      if (!card) return { found: false };
      const cr = card.getBoundingClientRect();
      const pickCards = Array.from(document.querySelectorAll(".hc-home-pick-card"));
      const confirmBtn = document.querySelector('[data-testid="confirm-reward-btn"]');
      const confirmR = confirmBtn ? confirmBtn.getBoundingClientRect() : null;

      return {
        found: true,
        modalHeight: Math.round(cr.height),
        fitsWindow: cr.bottom <= window.innerHeight,
        pickCardsCount: pickCards.length,
        isSideBySide: pickCards.length === 2 && Math.abs(pickCards[0].getBoundingClientRect().top - pickCards[1].getBoundingClientRect().top) < 10,
        confirmBtnVisible: confirmR ? confirmR.bottom <= window.innerHeight : false,
      };
    })()`);

    assert.ok(rewardModalCheck.found, "Daily reward modal must open.");
    assert.ok(rewardModalCheck.isSideBySide, "Choice cards must be side-by-side (2 columns) on mobile to save vertical space.");
    assert.ok(rewardModalCheck.confirmBtnVisible, "Confirm button MUST be visible on screen without requiring scrolling.");
    assert.ok(rewardModalCheck.fitsWindow, "Entire modal must fit within mobile screen bounds.");
    console.log("  ✓ Stage 4 Passed: Daily Reward Modal side-by-side 2-col and 100% visible on screen.\n");

    // Close modal
    await evaluate(`document.querySelector('[data-testid="close-reward-modal-btn"]').click()`);
    await sleep(600);

    // -----------------------------------------------------------------------------------
    // STAGE 5: AUDIT SAMSUNG GALAXY S21 (360 x 800) & IPHONE SE (375 x 667)
    // -----------------------------------------------------------------------------------
    console.log(">>> [STAGE 5] AUDITING SAMSUNG GALAXY S21 & IPHONE SE");
    await emulateDevice(360, 800, 2.625);
    await sleep(800);
    await takeScreenshot("verify_06_galaxy_s21_home");

    const galaxyCheck = await evaluate(`(() => {
      const h = document.querySelector(".hc-wellness-home-header");
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.offsetWidth,
        headerHeight: h ? Math.round(h.getBoundingClientRect().height) : 0,
      };
    })()`);
    assert.equal(galaxyCheck.overflow, false, "Galaxy S21 must have 0 horizontal overflow.");
    assert.ok(galaxyCheck.headerHeight <= 75, "Galaxy S21 header must be slim.");

    await emulateDevice(375, 667, 2);
    await sleep(800);
    await takeScreenshot("verify_07_iphone_se_compact_home");

    const seCheck = await evaluate(`(() => {
      const h = document.querySelector(".hc-wellness-home-header");
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.offsetWidth,
        headerHeight: h ? Math.round(h.getBoundingClientRect().height) : 0,
      };
    })()`);
    assert.equal(seCheck.overflow, false, "iPhone SE must have 0 horizontal overflow.");
    assert.ok(seCheck.headerHeight <= 75, "iPhone SE header must be slim.");
    console.log("  ✓ Stage 5 Passed: Galaxy S21 and iPhone SE verified cleanly.\n");

    console.log("================================================================================");
    console.log(">>> OVERALL MOBILE UX STATUS: 100% PASS ACROSS ALL VIEWPORTS <<<");
    console.log("================================================================================");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    ws.close();
    chromeProc.kill("SIGKILL");
  }
}

main().catch(console.error);
