import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9488;
const profileDir = path.join(root, "App", ".tmp", "test-hud-profile-" + Date.now());
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    screenOrientation: { angle: 0, type: "portraitPrimary" },
  });

  // Seed session
  const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));
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

  await send("Runtime.evaluate", {
    expression: `(() => {
      const session = ${JSON.stringify(sessionObj)};
      localStorage.setItem('botly-cloud-session', JSON.stringify(session));
      localStorage.setItem('healthclues-player-locale-v1', 'en');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${session.userId}');
      localStorage.setItem('healthclues-player-locale-v1:${session.userId}', 'en');
      document.cookie = 'hc_locale=en; Path=/; Max-Age=2592000';
    })()`,
  });

  await send("Page.navigate", { url: "http://localhost:3000/play" });
  await sleep(3500);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("d:/botly/App/.tmp/hud_mobile_debug.png", Buffer.from(shot.data, "base64"));
  console.log("Saved screenshot to App/.tmp/hud_mobile_debug.png");

  const diag = await send("Runtime.evaluate", {
    expression: `(() => {
      const topbar = document.querySelector(".hc-rpg-topbar");
      const brand = document.querySelector(".hc-rpg-brand");
      const capsule = document.querySelector(".hc-rpg-exp-capsule");
      const avatar = document.querySelector(".hc-rpg-avatar-frame");
      const expBody = document.querySelector(".hc-rpg-exp-body");
      const title = document.querySelector(".hc-rpg-level-title.is-mobile-title");
      const track = document.querySelector(".hc-rpg-bar-track");
      const reward = document.querySelector(".hc-rpg-next-reward");
      const actions = document.querySelector(".hc-rpg-top-actions");
      const r = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      };
      const s = (el) => el ? window.getComputedStyle(el) : null;
      return {
        topbar: { rect: r(topbar), display: s(topbar)?.display, gap: s(topbar)?.gap },
        brand: { rect: r(brand), display: s(brand)?.display },
        capsule: { rect: r(capsule), display: s(capsule)?.display, width: s(capsule)?.width },
        avatar: { rect: r(avatar) },
        expBody: { rect: r(expBody), width: s(expBody)?.width, minWidth: s(expBody)?.minWidth },
        title: { rect: r(title), text: title?.innerText, display: s(title)?.display },
        track: { rect: r(track), display: s(track)?.display },
        reward: { rect: r(reward), display: s(reward)?.display, position: s(reward)?.position },
        actions: { rect: r(actions) }
      };
    })()`,
    returnByValue: true,
  });

  console.log("Diagnostics:\n", JSON.stringify(diag.result.value, null, 2));

  ws.close();
  chromeProc.kill("SIGKILL");
}

main().catch(console.error);
