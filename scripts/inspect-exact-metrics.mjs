import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";

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

  const profileDir = path.join("d:\\botly", "App", ".tmp", "inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1200,900",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) { targetWs = page.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }

    const ws = new WebSocket(targetWs);
    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve } = pending.get(payload.id);
        pending.delete(payload.id);
        resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve) => {
        pending.set(id, { resolve });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");

    // 1. Portrait 390x844
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await new Promise((r) => setTimeout(r, 3000));

    const pRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const root = document.querySelector('.hc-game-root');
        const rRect = root?.getBoundingClientRect();
        const topbar = document.querySelector('.hc-rpg-topbar');
        const tRect = topbar?.getBoundingClientRect();
        const reward = document.querySelector('.hc-rpg-next-reward');
        const rewardDisp = reward ? window.getComputedStyle(reward).display : 'none';
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dRect = dock?.getBoundingClientRect();
        const expBody = document.querySelector('.hc-rpg-exp-body');
        const expRect = expBody?.getBoundingClientRect();

        return {
          rootTop: rRect ? rRect.top : null,
          rootHeight: rRect ? rRect.height : null,
          topbarTop: tRect ? tRect.top : null,
          rewardDisplay: rewardDisp,
          dockTop: dRect ? dRect.top : null,
          dockHeight: dRect ? dRect.height : null,
          expBodyWidth: expRect ? expRect.width : null,
        };
      })()`,
      returnByValue: true,
    });

    console.log("PORTRAIT NUMBERS:", pRes.result?.value);

    // 2. Landscape 844x390
    await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true, screenOrientation: { angle: 90, type: "landscapePrimary" } });
    await new Promise((r) => setTimeout(r, 1500));

    const lRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const root = document.querySelector('.hc-game-root');
        const rRect = root?.getBoundingClientRect();
        const topbar = document.querySelector('.hc-rpg-topbar');
        const tRect = topbar?.getBoundingClientRect();
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dockDisp = dock ? window.getComputedStyle(dock).display : 'none';
        const canvas = document.querySelector('canvas') || document.querySelector('.hc-rpg-stage');
        const cRect = canvas?.getBoundingClientRect();

        return {
          rootTop: rRect ? rRect.top : null,
          topbarTop: tRect ? tRect.top : null,
          dockDisplay: dockDisp,
          canvasWidth: cRect ? cRect.width : null,
          canvasHeight: cRect ? cRect.height : null,
        };
      })()`,
      returnByValue: true,
    });

    console.log("LANDSCAPE NUMBERS:", lRes.result?.value);

    ws.close();
    chromeProc.kill();
  } catch (err) {
    console.error(err);
    chromeProc.kill();
  }
}

main();
