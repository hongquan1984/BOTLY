import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";
const workspaceScreenshotsDir = "D:\\botly\\App\\.tmp\\healthclues-tester\\screenshots";
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329";
const inbox = "http://127.0.0.1:54324";

mkdirSync(workspaceScreenshotsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
  if (existsSync(workspaceScreenshotsDir)) {
    try { writeFileSync(path.join(workspaceScreenshotsDir, filename), buf); } catch {}
  }
}

async function fetchMailpitLink(targetEmail) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${inbox}/api/v1/messages?limit=20`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const payload = await response.json();
        const items = payload.messages || [];
        for (const item of items) {
          const detailRes = await fetch(`${inbox}/api/v1/message/${encodeURIComponent(item.ID || item.Id || item.id)}`, { signal: AbortSignal.timeout(5000) });
          if (!detailRes.ok) continue;
          const detail = await detailRes.json();
          const recipients = JSON.stringify(detail.To || detail.to || item.To || item.to || "").toLowerCase();
          if (!recipients.includes(targetEmail.toLowerCase())) continue;
          const body = `${detail.HTML || detail.Html || detail.html || ""}\n${detail.Text || detail.text || ""}`.replaceAll("&amp;", "&");
          const match = body.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i);
          if (match) return match[0].replace(/[),.;]+$/, "");
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Verification email for ${targetEmail} did not arrive in Mailpit within 30s.`);
}

async function main() {
  console.log("=== CAPTURING ALL MOBILE SURFACES ACROSS 320, 390, 430 ===");

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  assert.ok(existsSync(chromePath), "Chrome executable must exist");

  const debugPort = 9338;
  const userDataDir = path.join(root, "App", ".tmp", "test-mobile-surfaces-profile-" + Date.now());

  const chromeProc = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,OptimizationHints",
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    // Wait for Chrome port
    for (let i = 0; i < 40; i++) {
      try {
        const socket = net.createConnection(debugPort, "127.0.0.1");
        await new Promise((res, rej) => {
          socket.once("connect", () => { socket.end(); res(); });
          socket.once("error", rej);
        });
        break;
      } catch {
        await sleep(250);
      }
    }

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
      await sleep(200);
    }
    assert.ok(targetWs, "Must get page webSocketDebuggerUrl from Chrome");

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(targetWs);
    await new Promise((res, rej) => {
      ws.once("open", res);
      ws.once("error", rej);
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event);
          if (data.id === id) {
            ws.removeListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.on("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    // Authenticate a fresh account first so World surfaces (HUD, NPC, Journey, Daily Care) are fully unlocked
    const testEmail = `hc-mobile-surfaces-${Date.now()}@example.invalid`;
    console.log(`Setting up authenticated session for ${testEmail}...`);

    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=preview` });
    await sleep(2500);

    // Click START YOUR JOURNEY
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU HÀNH TRÌNH') || b.innerText.includes('START YOUR JOURNEY'));
        if (btn) btn.click();
      })()`
    });
    await sleep(1000);

    // Submit email
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(testEmail)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const check = document.querySelector('section[role="dialog"] input[type="checkbox"]') || document.querySelector('input[type="checkbox"]');
        if (check && !check.checked) check.click();
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()`
    });

    const magicLink = await fetchMailpitLink(testEmail);
    console.log("Verified link from Mailpit:", magicLink);
    await send("Page.navigate", { url: magicLink });
    await sleep(3500);

    // Attach 5-goal plan so Daily Care & Journey have full content
    await send("Runtime.evaluate", {
      expression: `(async () => {
        const token = (() => {
          const raw = localStorage.getItem('botly-cloud-session');
          if (raw) {
            try { return JSON.parse(raw).access_token; } catch {}
          }
          return null;
        })();
        const authHeaders = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/healthclues/world', { headers: authHeaders });
        const data = await res.json();
        const worldId = data.world?.id;
        if (!worldId) return;

        const makeGoal = (id, title, cat) => ({
          goalId: id,
          title: title,
          category: cat,
          goalType: "maintain",
          choice: "active",
          frequency: "Daily",
          trackingUnit: "lần",
          trackingDefinition: title,
          safetyStatus: "user_created_unreviewed",
          provenance: "user_created",
          templateId: null,
          evidenceStatus: "USER-CREATED · NOT REVIEWED",
          explanation: title,
          safetyNote: null,
          sources: [],
          targetValue: null,
          targetUnit: null,
          durationDays: null,
          userSafetyConfirmation: true
        });

        await fetch('/api/healthclues/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            worldId,
            requestKey: 'c0000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0').slice(-12),
            confirmed: true,
            goals: [
              makeGoal("g1", "Uống trà hoa cúc buổi tối", "sleep"),
              makeGoal("g2", "Tắt màn hình 30 phút trước ngủ", "sleep"),
              makeGoal("g3", "Thở 4-7-8 thư giãn 5 phút", "relaxation"),
              makeGoal("g4", "Giữ phòng ngủ thoáng mát 22°C", "sleep"),
              makeGoal("g5", "Ghi nhật ký cảm xúc 3 dòng", "relaxation"),
            ]
          })
        });

        // Save an existing check-in to test truthful Daily Care reopen hydration
        await fetch('/api/healthclues/world/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            worldId,
            date: new Date().toISOString().slice(0, 10),
            privateNote: "[Đánh giá ngày: 3/5 sao]\\n[Trạng thái mục tiêu: g1=done,g2=not_yet,g3=done,g4=not_yet,g5=not_yet]\\nLý do chưa hoàn thành:\\n- Tắt màn hình 30 phút trước ngủ: bận việc đột xuất\\nCảm thấy ngủ ngon hơn.",
            statuses: {}
          })
        });
      })()`,
      awaitPromise: true
    });

    const viewports = [
      { w: 320, h: 800, prefix: "mobile-320" },
      { w: 390, h: 844, prefix: "mobile-390" },
      { w: 430, h: 932, prefix: "mobile-430" }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Capturing Viewport ${vp.w}x${vp.h} ---`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 2,
        mobile: true,
      });

      // 1. Surface: Quiz
      console.log(`[${vp.w}px] Surface 1: Quiz`);
      await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery` });
      await sleep(2000);
      const quizShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-quiz.png`, quizShot.data);
      console.log(`Saved ${vp.prefix}-quiz.png`);

      // 2. Surface: World Preview
      console.log(`[${vp.w}px] Surface 2: World Preview`);
      await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=preview` });
      await sleep(2000);
      const previewShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-preview.png`, previewShot.data);
      console.log(`Saved ${vp.prefix}-preview.png`);

      // 3. Surface: Region HUD
      console.log(`[${vp.w}px] Surface 3: Region HUD`);
      await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=sleep-better` });
      await sleep(2500);

      // Dismiss tour if present
      await send("Runtime.evaluate", {
        expression: `(() => {
          const skipTourBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip') || b.innerText.includes('bỏ tour'));
          if (skipTourBtn) skipTourBtn.click();
        })()`
      });
      await sleep(800);

      // Close any open modal
      await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
          if (closeBtn) closeBtn.click();
        })()`
      });
      await sleep(600);

      const hudShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-hud.png`, hudShot.data);
      console.log(`Saved ${vp.prefix}-hud.png`);

      // 4. Surface: Daily Care Modal (with late hydration from saved checkin)
      console.log(`[${vp.w}px] Surface 4: Daily Care Modal`);
      await send("Runtime.evaluate", {
        expression: `(() => {
          const checkinBtn = document.querySelector('.hc-rpg-task-btn') ||
                             Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today'));
          if (checkinBtn) checkinBtn.click();
        })()`
      });
      await sleep(1500);
      const careShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-daily-care.png`, careShot.data);
      console.log(`Saved ${vp.prefix}-daily-care.png`);

      // Close Daily Care modal
      await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('.hc-game-modal-header button');
          if (closeBtn) closeBtn.click();
        })()`
      });
      await sleep(800);

      // 5. Surface: My Journey Modal (all 5 goals)
      console.log(`[${vp.w}px] Surface 5: My Journey Modal`);
      await send("Runtime.evaluate", {
        expression: `(() => {
          const journeyLink = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Xem toàn bộ') || b.innerText.includes('Hành trình của tôi')) ||
                              document.querySelector('.hc-rpg-care-card button:last-of-type') ||
                              Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hôm nay'));
          if (journeyLink) journeyLink.click();
        })()`
      });
      await sleep(1500);
      const journeyShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-journey.png`, journeyShot.data);
      console.log(`Saved ${vp.prefix}-journey.png`);

      // Close Journey modal
      await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
          if (closeBtn) closeBtn.click();
        })()`
      });
      await sleep(800);

      // 6. Surface: NPC Modal (Botanist / Food & Herbs)
      console.log(`[${vp.w}px] Surface 6: NPC Modal`);
      // Open botanist station panel
      await send("Runtime.evaluate", {
        expression: `(() => {
          // Open herbal panel directly or via landmark
          const openHerbal = window.__openLandmark || window.__setWorldPanel;
          if (openHerbal) {
            openHerbal('herbal');
          } else {
            // Find NPC actor or station and click
            const npc = document.querySelector('[data-station="nutrition"]') || document.querySelector('.hc-rpg-npc') || document.querySelector('.hc-rpg-landmark-btn');
            if (npc) npc.click();
          }
        })()`
      });
      await sleep(1500);
      const npcShot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`${vp.prefix}-npc-modal.png`, npcShot.data);
      console.log(`Saved ${vp.prefix}-npc-modal.png`);

      // Close NPC modal
      await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
          if (closeBtn) closeBtn.click();
        })()`
      });
      await sleep(600);
    }

    console.log("\n=== ALL 18 MOBILE SURFACE SCREENSHOTS SUCCESSFULLY CAPTURED ===");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
