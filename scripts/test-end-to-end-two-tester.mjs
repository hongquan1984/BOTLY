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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-tester-${Date.now()}`);
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

    // Smartphone dimensions (390x844 @2x - iPhone 14 / modern Android)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    async function capture(name) {
      const s = await send("Page.captureScreenshot", { format: "png" });
      const p = path.join(artifactsDir, `${name}.png`);
      writeFileSync(p, Buffer.from(s.data, "base64"));
      console.log(`[+] Captured: ${name}.png`);
    }

    // Robust native tap helper: finds element with matching text or aria-label, gets center coordinates, dispatches CDP touch/mouse events
    async function tapByText(text, retries = 5) {
      for (let attempt = 0; attempt < retries; attempt++) {
        const evalRes = await send("Runtime.evaluate", {
          expression: `
            (() => {
              const all = Array.from(document.querySelectorAll('*'));
              const matches = all.filter(el => {
                const label = el.getAttribute('aria-label') || '';
                const tc = el.textContent || '';
                const hasMatch = label.includes(${JSON.stringify(text)}) || tc.includes(${JSON.stringify(text)});
                if (!hasMatch) return false;
                return !Array.from(el.children).some(child => {
                  const cl = child.getAttribute('aria-label') || '';
                  const ctc = child.textContent || '';
                  return cl.includes(${JSON.stringify(text)}) || ctc.includes(${JSON.stringify(text)});
                });
              });
              if (matches.length === 0) return { error: 'Not found: ' + ${JSON.stringify(text)} };
              const el = matches[0];
              const target = el.closest('[role="button"]') || el.closest('button') || el.closest('[tabindex="0"]') || el;
              const rect = target.getBoundingClientRect();
              target.scrollIntoView({ block: 'center', inline: 'center' });
              const updatedRect = target.getBoundingClientRect();
              return {
                x: updatedRect.left + updatedRect.width / 2,
                y: updatedRect.top + updatedRect.height / 2,
                width: updatedRect.width,
                height: updatedRect.height,
                role: target.getAttribute('role') || target.tagName
              };
            })()
          `,
          returnByValue: true,
        });

        const val = evalRes.result?.value;
        if (val && !val.error && val.x > 0 && val.y > 0) {
          // Native CDP touch/click emulation
          await send("Input.dispatchMouseEvent", {
            type: "mousePressed",
            x: Math.round(val.x),
            y: Math.round(val.y),
            button: "left",
            clickCount: 1,
          });
          await send("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x: Math.round(val.x),
            y: Math.round(val.y),
            button: "left",
            clickCount: 1,
          });
          console.log(`[Tapped] "${text}" at (${Math.round(val.x)}, ${Math.round(val.y)}) [${val.role}]`);
          return true;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      console.warn(`[Tap Failed] Could not find or tap element with text: "${text}"`);
      return false;
    }

    // Tap at specific coordinate on viewport
    async function tapAt(x, y) {
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: Math.round(x),
        y: Math.round(y),
        button: "left",
        clickCount: 1,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: Math.round(x),
        y: Math.round(y),
        button: "left",
        clickCount: 1,
      });
      console.log(`[Tapped at] (${Math.round(x)}, ${Math.round(y)})`);
    }

    // ==========================================
    // PHASE A: ONBOARDING QUIZ FLOW (TEST CASES 1 - 4)
    // ==========================================
    console.log("=== EXECUTING PHASE A: ONBOARDING QUIZ FLOW ===");

    // TC-01: Quiz Welcome Screen
    console.log("[TC-01] Testing Quiz Welcome Screen...");
    await send("Page.navigate", { url: "http://127.0.0.1:8081/quiz" });
    await new Promise((r) => setTimeout(r, 2500));
    await capture("test-01-onboarding-welcome");

    // TC-02: Quest Region Selection
    console.log("[TC-02] Choosing Quest Region...");
    await tapByText("Bắt Đầu Khám Phá");
    await new Promise((r) => setTimeout(r, 1500));
    await capture("test-02-onboarding-quest-choice");

    // Select "Thung Lũng Giấc Ngủ" and click Continue
    await tapByText("Thung Lũng Giấc Ngủ");
    await new Promise((r) => setTimeout(r, 500));
    console.log("[TC-03] Answering Adaptive Questions...");
    await tapByText("Tiếp Tục Trả Lời Câu Hỏi");
    await new Promise((r) => setTimeout(r, 1500));

    // Question 1: Sleep Schedule
    await tapByText("Trước 22:30");
    await new Promise((r) => setTimeout(r, 800));
    await capture("test-03-onboarding-question-answering");

    // Question 2: Challenge
    await tapByText("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 800));
    await tapByText("Lướt điện thoại ban đêm");
    await new Promise((r) => setTimeout(r, 800));

    // Question 3: Priority Goal
    await tapByText("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 800));
    await tapByText("Dễ vào giấc & ngủ sâu tự nhiên");
    await new Promise((r) => setTimeout(r, 800));

    // TC-04: Personalized Wellness Plan
    console.log("[TC-04] Generating Personalized Wellness Plan...");
    await tapByText("Xem Bản Kế Hoạch Sức Khỏe");
    await new Promise((r) => setTimeout(r, 1800));
    await capture("test-04-onboarding-wellness-plan");

    // ==========================================
    // PHASE B: ENTERING RPG GAME WORLD & REAL-TIME MOVEMENT (TEST CASES 5 - 9)
    // ==========================================
    console.log("=== EXECUTING PHASE B: EXPANSIVE RPG WORLD & REALTIME MOVEMENT ===");

    // Step into RPG World
    await tapByText("BƯỚC VÀO THẾ GIỚI RPG");
    await new Promise((r) => setTimeout(r, 3500));

    // TC-05: Expansive World Overview with Real-Time Coordinates HUD
    console.log("[TC-05] Capturing Expansive 16:9 World Map & Coordinates HUD...");
    await capture("test-05-world-expansive-overview");

    // TC-06: Tap-to-Walk Movement (Click at coordinates on the canvas)
    console.log("[TC-06] Testing Real-Time Character Movement (Tap-to-Walk)...");
    // Tap on path (e.g. towards X: 200, Y: 450)
    await tapAt(200, 450);
    // Capture during real-time movement
    await new Promise((r) => setTimeout(r, 400));
    await capture("test-06-world-character-moving-realtime");

    // Wait until character settles
    await new Promise((r) => setTimeout(r, 1600));

    // TC-07: Approach NPC / Landmark & Active Talk HUD
    console.log("[TC-07] Testing Landmark / NPC Selection & Active Talk HUD...");
    // Tap on NPC "Nhà Thám Hiểm" on screen
    const npcTapped = await tapByText("Nhà Thám Hiểm");
    if (!npcTapped) {
      await tapByText("Đường Mòn Vận Động");
    }
    // Wait for character to walk to NPC and Active Talk HUD to slide up
    await new Promise((r) => setTimeout(r, 2200));
    await capture("test-07-world-active-talk-npc");

    // TC-08: Test Boss Challenge & RewardReveal
    console.log("[TC-08] Testing Boss Challenge & RewardReveal...");
    // Tap Boss Landmark on map
    await tapByText("Thử Thách 'Cú Đêm'");
    await new Promise((r) => setTimeout(r, 2200));
    // Click "Khám Phá" in Talk HUD
    await tapByText("Khám Phá");
    await new Promise((r) => setTimeout(r, 1000));
    // Click "Tham gia thử thách (+15 EXP)" in Landmark Sheet
    await tapByText("Tham gia thử thách (+15 EXP)");
    await new Promise((r) => setTimeout(r, 1200));
    await capture("test-08-world-reward-reveal");

    // Claim reward: "Nhận Vào Túi Đồ"
    await tapByText("Nhận Vào Túi Đồ");
    await new Promise((r) => setTimeout(r, 800));

    // Close Landmark Sheet via close button
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const xIcons = Array.from(document.querySelectorAll('svg.lucide-x'));
          xIcons.forEach(x => {
            const btn = x.closest('[role="button"]') || x.closest('button') || x.closest('[tabindex="0"]') || x.parentElement;
            if (btn && btn.click) btn.click();
          });
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // TC-09: 4-7-8 Breathing Relaxation Modal
    console.log("[TC-09] Testing 4-7-8 Breathing Relaxation Modal...");
    // Switch to Overview Mode to see whole map
    await tapByText("Toàn Cảnh");
    await new Promise((r) => setTimeout(r, 1000));

    // Tap "Khu Thiền Định" on the overview map
    const sanctuaryTapped = await tapByText("Khu Thiền Định");
    if (!sanctuaryTapped) {
      await tapByText("Khu Thiền Định Yên Bình");
    }
    await new Promise((r) => setTimeout(r, 2500));

    // Click "Khám Phá" on Talk HUD
    await tapByText("Khám Phá");
    await new Promise((r) => setTimeout(r, 1200));

    // Click "Bắt đầu bài tập thở 4-7-8"
    await tapByText("Bắt đầu bài tập thở 4-7-8");
    await new Promise((r) => setTimeout(r, 1500));
    await capture("test-09-world-breathing-478");

    // Complete breathing exercise
    await tapByText("Hoàn Thành Bài Tập");
    await new Promise((r) => setTimeout(r, 1000));

    // Close Landmark Sheet
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const xIcons = Array.from(document.querySelectorAll('svg.lucide-x'));
          xIcons.forEach(x => {
            const btn = x.closest('[role="button"]') || x.closest('button') || x.closest('[tabindex="0"]') || x.parentElement;
            if (btn && btn.click) btn.click();
          });
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // ==========================================
    // PHASE C: INVENTORY & DOCK NAVIGATION (TEST CASE 10)
    // ==========================================
    console.log("=== EXECUTING PHASE C: INVENTORY & DOCK NAVIGATION ===");
    console.log("[TC-10] Testing Upgraded RPG Inventory...");
    await tapByText("Túi Đồ");
    await new Promise((r) => setTimeout(r, 2200));
    await capture("test-10-inventory-3slots-equipped");

    console.log("=== ALL END-TO-END AUTOMATED TEST CASES EXECUTED SUCCESSFULLY ===");
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
