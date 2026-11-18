import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb\\photorealistic_25d_audit";
mkdirSync(artifactDir, { recursive: true });

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-audit-test-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=430,932",
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
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs, "Could not find Chrome page WebSocket target.");

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");

    // Standard iPhone 14 Pro Dimensions
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    async function takeScreenshot(name) {
      const s = await send("Page.captureScreenshot", { format: "png" });
      const p = path.join(artifactDir, `${name}.png`);
      writeFileSync(p, Buffer.from(s.data, "base64"));
      console.log(`[+] Captured: ${name}.png (${Math.round(s.data.length * 0.75 / 1024)} KB)`);
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

    // 1. Login
    console.log("Navigating to http://127.0.0.1:8081/login ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8081/login" });
    
    // Wait for inputs
    for (let i = 0; i < 25; i++) {
      const check = await evaluate("document.querySelectorAll('input').length");
      if (check >= 2) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    console.log("Submitting login form...");
    await evaluate(`
      (() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        function setVal(el, val) {
          const proto = Object.getPrototypeOf(el);
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) setter.call(el, val);
          else el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (inputs[0]) setVal(inputs[0], 'player@botly.vn');
        if (inputs[1]) setVal(inputs[1], 'healthclues123');
        const btns = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent && el.textContent.trim() === 'Đăng nhập' && el.children.length <= 1);
        if (btns.length) btns[btns.length - 1].click();
      })()
    `);

    await new Promise((r) => setTimeout(r, 3500));

    // Ensure we are on /(game)/world
    const currentUrl = await evaluate("window.location.href");
    console.log("Current URL after login:", currentUrl);
    if (!currentUrl.includes("/world")) {
      console.log("Navigating explicitly to /(game)/world ...");
      await send("Page.navigate", { url: "http://127.0.0.1:8081/(game)/world" });
      await new Promise((r) => setTimeout(r, 3000));
    }

    // Dismiss tour or popups if present
    await evaluate(`
      (() => {
        const all = Array.from(document.querySelectorAll('div, button, span'));
        const dismiss = all.find(el => {
          const t = (el.innerText || el.textContent || '').trim();
          return t === 'Bỏ qua' || t === 'Đã hiểu' || t === 'Tiếp tục' || t.includes('Bỏ qua');
        });
        if (dismiss) dismiss.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    // 2. Capture Initial World View
    await takeScreenshot("01_world_initial_photorealistic_square");

    // Inspect Actor & Parallax status
    const stats = await evaluate(`
      (() => {
        const player = document.querySelector('[aria-label="player-avatar-actor"]');
        const playerImg = player ? player.querySelector('img') : null;
        
        const allImgs = Array.from(document.querySelectorAll('img')).map(i => ({
          src: i.src,
          w: i.clientWidth,
          h: i.clientHeight
        }));

        const hasParallax = allImgs.some(i => i.src.includes('swiss-village-lake-bg') || i.src.includes('sleep-valley-mountains-bg'));
        const hasDiorama = allImgs.some(i => i.src.includes('swiss-village-mobile-diorama'));

        const landmarks = Array.from(document.querySelectorAll('[role="button"]')).map(b => b.getAttribute('aria-label')).filter(Boolean);

        return {
          playerImg: playerImg ? { src: playerImg.src, w: playerImg.clientWidth, h: playerImg.clientHeight } : null,
          hasParallax,
          hasDiorama,
          allImgsCount: allImgs.length,
          landmarks
        };
      })()
    `);
    console.log("Scene Inspection Stats:", JSON.stringify(stats, null, 2));

    // 3. Trigger walk movement
    console.log("Triggering walking motion on cobblestones...");
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: 195,
      y: 450,
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: 195,
      y: 450,
      button: "left",
    });

    await new Promise((r) => setTimeout(r, 220));
    await takeScreenshot("02_player_walking_frame1");

    await new Promise((r) => setTimeout(r, 220));
    await takeScreenshot("03_player_walking_frame2");

    await new Promise((r) => setTimeout(r, 220));
    await takeScreenshot("04_player_walking_frame3");

    await new Promise((r) => setTimeout(r, 1600));
    await takeScreenshot("05_player_arrived_idle");

    // 4. Test Parallax camera shift
    console.log("Testing 2.5D Parallax camera shift...");
    await evaluate(`
      (() => {
        const touchSurface = document.querySelector('[aria-label="swiss-village-mobile-diorama"]');
        if (touchSurface) {
          const scrollers = Array.from(document.querySelectorAll('div')).filter(d => {
            const s = window.getComputedStyle(d);
            return s.overflowX === 'scroll' || s.overflowY === 'scroll' || s.overflow === 'scroll' || s.overflowX === 'auto' || s.overflowY === 'auto';
          });
          scrollers.forEach(s => {
            s.scrollTop += 90;
            s.scrollLeft += 140;
            s.dispatchEvent(new Event('scroll', { bubbles: true }));
          });
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));
    await takeScreenshot("06_parallax_scrolled_view");

    console.log("Visual audit completed successfully!");
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
