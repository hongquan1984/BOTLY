import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const screenshotsDir = path.join(artifactDir, "local-verified");
mkdirSync(screenshotsDir, { recursive: true });

const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);

const debugPort = 9520;
const profileDir = path.join(root, "App", ".tmp", "test-local-profile-" + Date.now());
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

  // Emulate mobile portrait: 390x844
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

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

  console.log("Navigating to http://localhost:3000/play-demo.html...");
  await send("Page.navigate", { url: "http://localhost:3000/play-demo.html" });
  await sleep(4000);

  // Dismiss any guide or alert
  await evaluate(`(() => {
    const skipBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.textContent.includes("Bỏ qua") || b.textContent.includes("Skip") || b.textContent.includes("Tự do")
    );
    if (skipBtn) skipBtn.click();
    const closeLumi = document.querySelector(".hc-rpg-lumi-close-btn") || document.querySelector(".hc-rpg-talk-close-btn");
    if (closeLumi) closeLumi.click();
  })()`);
  await sleep(1000);

  await takeScreenshot("01_local_rpg_world");

  // Click on "Nhà Của Tôi" (Home) on the bottom dock
  console.log("Clicking Home dock button...");
  await evaluate(`(() => {
    const homeBtn = Array.from(document.querySelectorAll(".hc-rpg-dock-btn")).find(b => 
      b.innerText.includes("Nhà") || b.innerText.includes("Home")
    );
    if (homeBtn) homeBtn.click();
  })()`);
  await sleep(2500);

  // Dismiss welcome gift modal if open
  await evaluate(`(() => {
    const claimBtn = Array.from(document.querySelectorAll("button")).find(b => 
      b.innerText.includes("Mở Hộp Quà") || b.innerText.includes("Nhận quà")
    );
    if (claimBtn) claimBtn.click();
  })()`);
  await sleep(1500);

  await takeScreenshot("02_local_chalet_home");

  // Emulate landscape
  console.log("Switching to landscape 844x390...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: "landscapePrimary" },
  });
  await sleep(1500);

  await takeScreenshot("03_local_chalet_landscape");

  chromeProc.kill();
  console.log("VERIFICATION COMPLETED!");
}

main().catch(console.error);
