import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9484;
const profileDir = path.join(root, "App", ".tmp", "test-topbar-profile-" + Date.now());
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

  let idCounter = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = idCounter++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off("message", handler);
        resolve(msg.result);
      }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((resolve) => ws.once("open", resolve));

  const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));

  await send("Page.enable");
  await send("Runtime.enable");

  const sessionObj = {
    access_token: session.token,
    refresh_token: session.refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
    user: { id: session.userId, email: session.email },
  };

  const widths = [690, 720, 768, 800, 844];

  for (const w of widths) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: w,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 90, type: "landscapePrimary" },
    });

    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await sleep(600);

    await send("Runtime.evaluate", {
      expression: `(() => {
        localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
        localStorage.setItem('healthclues-player-locale-v1', 'en');
      })()`
    });

    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await sleep(2500);

    const hudData = await send("Runtime.evaluate", {
      expression: `(() => {
        const topbar = document.querySelector(".hc-rpg-topbar");
        const brand = document.querySelector(".hc-rpg-brand");
        const capsule = document.querySelector(".hc-rpg-exp-capsule");
        const nextReward = document.querySelector(".hc-rpg-next-reward");
        const actions = document.querySelector(".hc-rpg-top-actions");
        const mobileTitle = document.querySelector(".hc-rpg-level-title.is-mobile-title");
        const desktopTitle = document.querySelector(".hc-rpg-level-title.is-desktop-title");
        const mysteryIcon = document.querySelector(".hc-rpg-mystery-icon");

        const getBox = (el) => el ? {
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width,
          display: window.getComputedStyle(el).display,
        } : null;

        const dock = document.querySelector(".hc-rpg-bottom-dock");
        const dockButtons = dock ? Array.from(dock.querySelectorAll(".hc-rpg-dock-btn")).map(b => b.textContent.trim()) : [];

        return {
          windowWidth: window.innerWidth,
          dock: getBox(dock),
          dockButtons,
          topbar: getBox(topbar),
          brand: getBox(brand),
          capsule: getBox(capsule),
          nextReward: getBox(nextReward),
          actions: getBox(actions),
          mobileTitle: getBox(mobileTitle),
          desktopTitle: getBox(desktopTitle),
          mysteryIcon: getBox(mysteryIcon),
        };
      })()`,
      returnByValue: true,
    });

    console.log(`\nWidth: ${w}px ->`, JSON.stringify(hudData.result.value));

    const shot = await send("Page.captureScreenshot", {
      clip: { x: 0, y: 0, width: w, height: 390, scale: 2 },
    });
    writeFileSync(path.join("C:/Users/Admin/.gemini/antigravity/brain/abff8161-8d04-4588-8fd8-ca4619ccaf85/landscape-audit-screenshots", `hud_w${w}.png`), Buffer.from(shot.data, "base64"));
  }

  chromeProc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  try { chromeProc.kill(); } catch {}
  process.exit(1);
});
