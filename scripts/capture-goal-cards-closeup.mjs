import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-closeup-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,960",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });

    // 1. Quick activate session for hongquan0508@gmail.com via evaluate
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/world" });
    await new Promise((r) => setTimeout(r, 2000));

    await send("Runtime.evaluate", {
      expression: `(async () => {
        const res = await fetch('/api/healthclues/account/quick-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'hongquan0508@gmail.com' }),
        });
        const data = await res.json();
        if (data.session) {
          localStorage.setItem('botly_cloud_session', JSON.stringify(data.session));
        }
      })()`,
      awaitPromise: true,
    });

    // 2. Navigate with full session
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/world?quest=health-concern#hc-journey" });
    await new Promise((r) => setTimeout(r, 4000));

    // Ensure Journey modal is open
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const journeyBtn = btns.find(b => b.textContent.includes('Hành trình') || b.textContent.includes('Nhiệm vụ'));
        if (journeyBtn) journeyBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to active goals section
    await send("Runtime.evaluate", {
      expression: `(() => {
        const target = document.querySelector('.hc-active-goals-grid') || document.querySelector('.hc-section-heading-row');
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const shotPath = path.join(artifactsDir, "verified-goal-cards-closeup.png");
    writeFileSync(shotPath, Buffer.from(shot.data, "base64"));
    console.log("Saved close-up screenshot to:", shotPath);

    ws.close();
  } finally {
    chromeProc.kill("SIGTERM");
  }
}

main().catch(console.error);
