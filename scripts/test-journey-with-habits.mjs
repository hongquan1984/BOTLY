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

const debugPort = 9483;
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

  const mockGoals = [
    { id: "g1", title: "Tập hít thở cơ hoành 3 phút khi căng thẳng", category: "stress", choice: "active", difficulty: "easy" },
    { id: "g2", title: "Đi bộ nhẹ nhàng 10 phút ngoài trời không kiểm tra thông báo công việc", category: "movement", choice: "active", difficulty: "easy" },
    { id: "g3", title: "Uống một cốc nước ấm trước khi bắt đầu bữa sáng", category: "nutrition", choice: "active", difficulty: "easy" }
  ];

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
    localStorage.setItem('healthclues-wellness-goals-v1', JSON.stringify(${JSON.stringify(mockGoals)}));
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

  // Open Journey modal
  await evaluate(`(() => {
    const b = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(el => el.innerText.includes("Hành Trình") || el.innerText.includes("Hành trình") || el.innerText.includes("Journey"));
    if (b) b.click();
  })()`);
  await sleep(1500);

  await takeScreenshot("portrait_02_journey_with_3_habits");

  ws.close();
  chromeProc.kill();
  console.log("Journey with habits captured successfully!");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  chromeProc.kill();
});
