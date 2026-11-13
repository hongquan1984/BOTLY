import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "landscape-menu-verified");
mkdirSync(screenshotsDir, { recursive: true });

const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9484;
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
  await new Promise((res) => ws.once("open", res));

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
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
  await send("Runtime.enable");

  const baseUrl = "http://127.0.0.1:3000";

  console.log("1. Setting Landscape viewport: 844x390 (iPhone 14 Landscape)...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: "landscapePrimary" },
  });

  await send("Page.navigate", { url: `${baseUrl}/play` });
  await sleep(1500);

  const sessionObj = {
    access_token: session.token,
    refresh_token: session.refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
    user: { id: session.userId, email: session.email, user_metadata: { nickname: "Alex" } },
  };

  await send("Runtime.evaluate", {
    expression: `
      (() => {
        localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
        localStorage.setItem('botly_healthclues_token', '${session.token}');
        localStorage.setItem('healthclues-player-locale-v1', 'vi');
        localStorage.setItem('healthclues-player-locale-owner-v1', '${session.userId}');
        localStorage.setItem('healthclues-player-locale-v1:${session.userId}', 'vi');
        document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
      })()
    `
  });

  await send("Page.navigate", { url: `${baseUrl}/vi/wellness/healthclues/world` });
  await sleep(4000);

  // Dismiss any guide/tutorial modal if present
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const skipBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent?.includes('Skip') || b.textContent?.includes('Bỏ qua') || b.textContent?.includes('Khám phá')
        );
        if (skipBtn) skipBtn.click();
      })()
    `
  });
  await sleep(1500);

  // Audit landscape bottom dock
  const dockAudit = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        if (!dock) return { found: false, html: document.body.innerHTML.substring(0, 300) };
        const rect = dock.getBoundingClientRect();
        const style = window.getComputedStyle(dock);
        const buttons = Array.from(dock.querySelectorAll('.hc-rpg-dock-btn')).map(b => ({
          label: b.querySelector('.hc-rpg-dock-label')?.textContent?.trim(),
          width: Math.round(b.getBoundingClientRect().width),
          height: Math.round(b.getBoundingClientRect().height)
        }));

        const topbar = document.querySelector('.hc-rpg-topbar');
        const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
        const mysteryReward = document.querySelector('.hc-rpg-next-reward');
        const mysteryStyle = mysteryReward ? window.getComputedStyle(mysteryReward).display : 'none';

        const expCapsule = document.querySelector('.hc-rpg-exp-capsule');
        const expRect = expCapsule ? expCapsule.getBoundingClientRect() : null;

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
          mysteryDisplay: mysteryStyle,
          expCapsuleRect: expRect ? { width: Math.round(expRect.width), height: Math.round(expRect.height) } : null,
          lumiBottom: lumiRect ? Math.round(lumiRect.bottom) : null,
          dockTop: Math.round(rect.top),
          viewport: { width: window.innerWidth, height: window.innerHeight }
        };
      })()
    `,
    returnByValue: true
  });

  console.log("Landscape Dock Audit Result:\n", JSON.stringify(dockAudit.result.value, null, 2));

  // Capture Landscape Overworld Screenshot
  const landscapeShot = await send("Page.captureScreenshot", { format: "png" });
  const landscapePath = path.join(screenshotsDir, "01_landscape_dock_restored.png");
  writeFileSync(landscapePath, Buffer.from(landscapeShot.data, "base64"));
  console.log("Saved Landscape Screenshot to:", landscapePath);

  // Switch to Portrait mode: 390x844
  console.log("2. Setting Portrait viewport: 390x844 (iPhone 14 Portrait)...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 0, type: "portraitPrimary" },
  });
  await sleep(1500);

  const portraitShot = await send("Page.captureScreenshot", { format: "png" });
  const portraitPath = path.join(screenshotsDir, "02_portrait_dock_verified.png");
  writeFileSync(portraitPath, Buffer.from(portraitShot.data, "base64"));
  console.log("Saved Portrait Screenshot to:", portraitPath);

  // Navigate to Chalet in Landscape
  console.log("3. Testing Chalet Home in Landscape...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: "landscapePrimary" },
  });

  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const homeBtn = document.querySelector('[data-rpg-nav="home"]') ||
          Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => 
            b.textContent?.includes('Nhà') || b.textContent?.includes('Home')
          );
        if (homeBtn) homeBtn.click();
      })()
    `
  });
  await sleep(2500);

  const chaletShot = await send("Page.captureScreenshot", { format: "png" });
  const chaletPath = path.join(screenshotsDir, "03_chalet_landscape_verified.png");
  writeFileSync(chaletPath, Buffer.from(chaletShot.data, "base64"));
  console.log("Saved Chalet Screenshot to:", chaletPath);

  ws.close();
  chromeProc.kill("SIGKILL");
  console.log("Verification test completed successfully!");
}

main().catch((err) => {
  console.error("Test error:", err);
  try { chromeProc.kill("SIGKILL"); } catch (e) {}
  process.exit(1);
});
