import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-rpg-test-${Date.now()}`);
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
    await send("Network.enable");

    // Standard iPhone 14 Pro Dimensions
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    // 1. Login
    await send("Page.navigate", { url: "http://127.0.0.1:8081/login" });
    for (let i = 0; i < 20; i++) {
      const check = await send("Runtime.evaluate", {
        expression: "document.querySelectorAll('input').length",
        returnByValue: true
      });
      if (check.result.value >= 2) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    await send("Runtime.evaluate", {
      expression: `
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
      `,
    });

    await new Promise((r) => setTimeout(r, 3500));

    // Capture 1: Main World Exploration View
    async function capture(name) {
      const s = await send("Page.captureScreenshot", { format: "png" });
      const p = path.join(artifactsDir, `${name}.png`);
      writeFileSync(p, Buffer.from(s.data, "base64"));
      console.log(`[+] Captured: ${name}.png`);
    }

    // 1. Capture living exploration view
    await capture("mobile-rpg-exploration-view");

    // Helper in page context: trigger realistic press
    await send("Runtime.evaluate", {
      expression: `
        window.__hcPress = function(text) {
          const all = Array.from(document.querySelectorAll('*'));
          const matches = all.filter(el => {
            return el.textContent && el.textContent.includes(text) && 
              !Array.from(el.children).some(child => child.textContent && child.textContent.includes(text));
          });
          if (matches.length === 0) return 'not found';
          const target = matches[0].closest('[role=\"button\"]') || matches[0].closest('button') || matches[0].parentElement || matches[0];
          const rect = target.getBoundingClientRect();
          const clientX = rect.left + rect.width / 2;
          const clientY = rect.top + rect.height / 2;
          const opts = { bubbles: true, cancelable: true, view: window, clientX, clientY };
          target.dispatchEvent(new PointerEvent('pointerdown', opts));
          target.dispatchEvent(new MouseEvent('mousedown', opts));
          target.dispatchEvent(new PointerEvent('pointerup', opts));
          target.dispatchEvent(new MouseEvent('mouseup', opts));
          target.dispatchEvent(new MouseEvent('click', opts));
          if (typeof target.click === 'function') target.click();
          return 'pressed: ' + (target.getAttribute('role') || target.tagName) + ' text: ' + text;
        };
      `,
    });

    // 2. Click Living NPC "Nhà Thực Vật Học" on the map -> character walks to NPC
    const pressBotanist = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Nhà Thực Vật Học')`,
    });
    console.log("Press Botanist NPC result:", pressBotanist);
    // Wait for walk animation (700ms) and active talk HUD slide up
    await new Promise((r) => setTimeout(r, 1200));
    await capture("mobile-rpg-active-talk-hud");

    // 3. Click "Khám Phá" inside Active Talk HUD -> opens rich modal sheet
    const pressExplore = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Khám Phá')`,
    });
    console.log("Press Explore result:", pressExplore);
    await new Promise((r) => setTimeout(r, 1000));
    await capture("mobile-rpg-botanical-sheet");

    // 4. Click "Trang bị vào Túi Đồ" inside Sheet
    const pressEquip = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Trang bị vào Túi Đồ')`,
    });
    console.log("Press Equip result:", pressEquip);
    await new Promise((r) => setTimeout(r, 800));
    await capture("mobile-rpg-botanical-feedback");

    // Close Sheet
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const all = Array.from(document.querySelectorAll('*'));
          const closeBtn = all.find(el => el.getAttribute('role') === 'button' && el.querySelector('svg.lucide-x'));
          if (closeBtn) {
            closeBtn.click();
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 5. Click "Người Hướng Dẫn" (Wellness Guide NPC) -> walk to Sanctuary
    const pressSanctuary = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Người Hướng Dẫn')`,
    });
    console.log("Press Wellness Guide NPC result:", pressSanctuary);
    await new Promise((r) => setTimeout(r, 1200));

    // Click "Khám Phá" in Talk bar
    await send("Runtime.evaluate", {
      expression: `window.__hcPress('Khám Phá')`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Click "Bắt đầu bài tập thở 4-7-8"
    const pressBreathBtn = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Bắt đầu bài tập thở')`,
    });
    console.log("Press Breath Btn result:", pressBreathBtn);
    await new Promise((r) => setTimeout(r, 1500));
    await capture("mobile-rpg-breathing-modal");

    // Close Breathing Modal
    await send("Runtime.evaluate", {
      expression: `window.__hcPress('Hoàn Thành')`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 6. Switch to 8-Biome Overworld Map
    const toggleOverworld = await send("Runtime.evaluate", {
      expression: `window.__hcPress('Đại Bản Đồ')`,
    });
    console.log("Toggle Overworld result:", toggleOverworld);
    await new Promise((r) => setTimeout(r, 1200));
    await capture("mobile-rpg-overworld-8biomes");

    // 7. Verify Bottom Dock HUD (Tabs)
    const tabs = [
      { name: "mobile-tab-journey", path: "/journey" },
      { name: "mobile-tab-daily-care", path: "/daily-care" },
      { name: "mobile-tab-inventory", path: "/inventory" },
      { name: "mobile-tab-profile", path: "/profile" },
    ];
    for (const tab of tabs) {
      await send("Page.navigate", { url: `http://127.0.0.1:8081${tab.path}` });
      await new Promise((r) => setTimeout(r, 2000));
      await capture(tab.name);
    }

    console.log("=== ALL RPG INTERACTION AND TAB TESTS COMPLETED ===");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
