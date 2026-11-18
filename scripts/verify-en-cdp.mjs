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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=412,860",
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
    assert.ok(targetWs, "Could not connect to Chrome debugging target");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(JSON.stringify(payload.error)));
        else resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 412,
      height: 860,
      deviceScaleFactor: 2,
      mobile: true,
    });

    const capture = async (filename) => {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      const outPath = path.join(artifactsDir, filename);
      writeFileSync(outPath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${filename}`);
    };

    // Step 1: Navigate to app and inject English settings into localStorage
    console.log("Navigating to http://localhost:8081/ ...");
    await send("Page.navigate", { url: "http://localhost:8081/" });
    await new Promise((r) => setTimeout(r, 2000));

    await send("Runtime.evaluate", {
      expression: `(() => {
        localStorage.setItem('@healthclues_locale', 'en');
        localStorage.setItem('healthclues_locale', 'en');
        localStorage.setItem('healthclues-onboarding-completed', 'true');
        localStorage.setItem('healthclues-village-cinematic-tour-v1', 'true');
        localStorage.setItem('healthclues-interactive-spotlight-tour-v4', 'true');
        localStorage.setItem('healthclues_bag_sounds', JSON.stringify(['binaural_432', 'rain']));
        localStorage.setItem('healthclues_bag_breaths', JSON.stringify(['breath_478', 'breath_box']));
        localStorage.setItem('hc_mobile_botanical_bookmarks', JSON.stringify(['matricaria-chamomilla', 'passiflora-incarnata']));
      })()`,
    });

    // Reload with English locale active
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 3000));

    // Capture World Screen in English
    await capture("qa_en_world_screen.png");

    // 1. Open Zen Breath Modal
    console.log("Opening Zen Breath Modal...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__OPEN_ZEN_BREATH__ === 'function') {
          window.__OPEN_ZEN_BREATH__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await capture("qa_en_zen_breath_modal.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__CLOSE_ALL_MODALS__ === 'function') {
          window.__CLOSE_ALL_MODALS__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 2. Open Sound Garden Modal
    console.log("Opening Sound Garden Modal...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__OPEN_SOUND_GARDEN__ === 'function') {
          window.__OPEN_SOUND_GARDEN__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await capture("qa_en_sound_garden_modal.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__CLOSE_ALL_MODALS__ === 'function') {
          window.__CLOSE_ALL_MODALS__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 3. Open Herbal Garden Modal
    console.log("Opening Herbal Garden Modal...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__OPEN_HERBAL_GARDEN__ === 'function') {
          window.__OPEN_HERBAL_GARDEN__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await capture("qa_en_herbal_garden_modal.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof window.__CLOSE_ALL_MODALS__ === 'function') {
          window.__CLOSE_ALL_MODALS__();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 4. Navigate to Backpack / Inventory (Sounds Tab)
    console.log("Navigating to Backpack Sounds Tab...");
    await send("Page.navigate", { url: "http://localhost:8081/inventory?tab=sounds" });
    await new Promise((r) => setTimeout(r, 2000));
    // Click PLAY on the sound card to verify master playback bar
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('div, span, button')).find(el => el.textContent === 'PLAY' || el.textContent === 'BẬT');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    await capture("qa_en_inventory_sounds.png");

    // 5. Navigate to Backpack (Breaths Tab)
    console.log("Navigating to Backpack Breaths Tab...");
    await send("Page.navigate", { url: "http://localhost:8081/inventory?tab=breath" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_inventory_breath.png");

    // 6. Navigate to Backpack (Herbs Tab)
    console.log("Navigating to Backpack Herbs Tab...");
    await send("Page.navigate", { url: "http://localhost:8081/inventory?tab=herbs" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_inventory_herbs.png");

    // 7. Navigate to Profile
    console.log("Navigating to Profile...");
    await send("Page.navigate", { url: "http://localhost:8081/profile" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_profile.png");

    // 8. Navigate to Journey
    console.log("Navigating to Journey...");
    await send("Page.navigate", { url: "http://localhost:8081/journey" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_journey.png");

    // 9. Navigate to Daily Care
    console.log("Navigating to Daily Care...");
    await send("Page.navigate", { url: "http://localhost:8081/daily-care" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_daily_care.png");

    // 10. Navigate to Home
    console.log("Navigating to Home...");
    await send("Page.navigate", { url: "http://localhost:8081/home" });
    await new Promise((r) => setTimeout(r, 2000));
    await capture("qa_en_home.png");

    console.log("ALL ENGLISH QA SCREENSHOTS CAPTURED SUCCESSFULLY!");
    ws.close();
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error("CDP Error:", err);
  process.exit(1);
});
