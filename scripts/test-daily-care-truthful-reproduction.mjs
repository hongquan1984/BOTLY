import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";
const workspaceScreenshots = path.join(root, "App", ".tmp", "healthclues-tester", "screenshots");
mkdirSync(workspaceScreenshots, { recursive: true });

const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329";
const inbox = "http://127.0.0.1:54324";

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
  console.log("=== STARTING TRUTHFUL DAILY CARE & TOUCH TARGET TEST ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-daily-care-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,900",
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
    assert.ok(targetWs, "Could not connect to Chrome DevTools.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    // 1. Create synthetic account with Sleep Valley
    const email = `hc-truthful-${Date.now()}@example.invalid`;
    console.log(`Creating account ${email}...`);

    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery` });
    await new Promise((r) => setTimeout(r, 2000));

    // Complete quiz step 1 & 2
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        btns[btns.length - 1]?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        const check = quiz.querySelector('input[type="checkbox"]');
        if (check && !check.checked) check.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        btns[btns.length - 1]?.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Wait for World Preview & click START
    for (let i = 0; i < 30; i++) {
      const started = await send("Runtime.evaluate", {
        expression: `(() => {
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip'));
          if (skipBtn) skipBtn.click();
          const startBtn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU'));
          if (startBtn) { startBtn.click(); return true; }
          return false;
        })()`,
        returnByValue: true,
      });
      if (started.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Submit email
    await new Promise((r) => setTimeout(r, 1000));
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(email)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const check = document.querySelector('section[role="dialog"] input[type="checkbox"]');
        if (check && !check.checked) check.click();
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) submitBtn.click();
      })()`,
    });

    const verifyUrl = await fetchMailpitLink(email);
    console.log("✓ Magic link received:", verifyUrl);

    await send("Page.navigate", { url: verifyUrl });
    await new Promise((r) => setTimeout(r, 4500));

    // 2. Set up 5 Journey goals via plan confirmation
    console.log("Setting up 5 Journey goals in player world...");
    const planSetup = await send("Runtime.evaluate", {
      expression: `(async () => {
        let res = await fetch('/api/healthclues/world');
        let data = await res.json();
        let worldId = data.world?.id;
        if (!worldId) {
          const createWorldRes = await fetch('/api/healthclues/world', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestKey: '11111111-1111-4111-8111-111111111111',
              topicKey: 'sleep-valley',
              title: 'Thung Lũng Ngủ Ngon',
              timezone: 'Asia/Ho_Chi_Minh',
              selections: []
            })
          });
          const createData = await createWorldRes.json();
          worldId = createData.world_id;
          if (!worldId) return { error: "Failed to obtain world", createStatus: createWorldRes.status, createData };
        }
        if (!worldId) return { error: "Failed to obtain world" };

        const sampleGoals = [
          { goalId: "g1", title: "Uống trà hoa cúc buổi tối", category: "sleep", choice: "active", frequency: "Daily", trackingDefinition: "Uống trà hoa cúc" },
          { goalId: "g2", title: "Tắt màn hình 30 phút trước ngủ", category: "sleep", choice: "active", frequency: "Daily", trackingDefinition: "Tắt điện thoại" },
          { goalId: "g3", title: "Thở 4-7-8 thư giãn 5 phút", category: "relaxation", choice: "active", frequency: "Daily", trackingDefinition: "Thở 4-7-8" },
          { goalId: "g4", title: "Giữ phòng ngủ thoáng mát 22°C", category: "sleep", choice: "active", frequency: "Daily", trackingDefinition: "Chỉnh nhiệt độ" },
          { goalId: "g5", title: "Ghi nhật ký cảm xúc 3 dòng", category: "relaxation", choice: "active", frequency: "Daily", trackingDefinition: "Viết nhật ký" },
        ];

        const savePlanRes = await fetch('/api/healthclues/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId,
            requestKey: 'test-req-5goals',
            confirmed: true,
            goals: sampleGoals
          })
        });

        return { worldId, planOk: savePlanRes.ok };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log("Plan setup result:", JSON.stringify(planSetup.result?.value));
    assert.equal(planSetup.result?.value?.planOk, true, "Plan must be saved with 5 goals");

    // Reload world to load the 5 goals
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 3500));

    // Verify initial Daily Care state before checkin: 0/5 completed
    const initialCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const careCard = document.querySelector('.hc-rpg-care-card');
        const badge = careCard?.querySelector('.hc-rpg-card-count-badge')?.innerText?.trim() || '';
        const rows = Array.from(careCard?.querySelectorAll('.hc-rpg-habit-row') || []);
        const doneRows = rows.filter(r => r.classList.contains('is-done'));
        const subNote = careCard?.querySelector('p.text-\\[11px\\]')?.innerText?.trim() || '';
        return { badge, totalRows: rows.length, doneRows: doneRows.length, subNote };
      })()`,
      returnByValue: true,
    });
    console.log("Initial Daily Care Check (Before check-in):", JSON.stringify(initialCheck.result?.value));
    assert.match(initialCheck.result?.value.badge, /0\/5/, "Initial completed count must be 0/5");
    assert.equal(initialCheck.result?.value.doneRows, 0, "No rows should be marked done before check-in");
    assert.match(initialCheck.result?.value.subNote, /3 mục tiêu đầu trong số 5/, "Clarifying 3 of 5 copy must be present");
    console.log("✓ Initial 0/5 completed and 3-of-5 explanation verified!");

    // 3. Now simulate real checkin: Goal 1 = done, Goals 2..5 = not_yet
    console.log("Saving check-in: 1 goal done, 4 goals not_yet...");
    const checkinSave = await send("Runtime.evaluate", {
      expression: `(async () => {
        const res = await fetch('/api/healthclues/world');
        const data = await res.json();
        const worldId = data.world.id;
        const timezone = data.world.timezone || "UTC";

        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone === "UTC" ? "UTC" : "Asia/Ho_Chi_Minh",
          year: "numeric", month: "2-digit", day: "2-digit"
        }).format(new Date());

        // Compiled note with truthful goal statuses
        const compiledNote = [
          "[Đánh giá ngày: 1/5 sao]",
          "[Trạng thái mục tiêu: g1=done,g2=not_yet,g3=not_yet,g4=not_yet,g5=not_yet]",
          "Lý do chưa hoàn thành:",
          "- Tắt màn hình 30 phút trước ngủ: có việc bận",
          "- Thở 4-7-8 thư giãn 5 phút: quên",
          "- Giữ phòng ngủ thoáng mát 22°C: trời lạnh",
          "- Ghi nhật ký cảm xúc 3 dòng: buồn ngủ"
        ].join("\\n");

        const checkinRes = await fetch('/api/healthclues/world/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId,
            localDate: today,
            timezone,
            usages: [], // 0 equipped tools!
            note: compiledNote
          })
        });

        const checkinJson = await checkinRes.json();
        return { today, checkinOk: checkinRes.ok, xpAwarded: checkinJson.xp_awarded };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log("Checkin save result:", JSON.stringify(checkinSave.result?.value));
    assert.equal(checkinSave.result?.value?.checkinOk, true, "Check-in must save successfully");

    // 4. Reload page and verify truthfulness after reload!
    console.log("Reloading page to verify persistence...");
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 3500));

    const postCheckin = await send("Runtime.evaluate", {
      expression: `(() => {
        const careCard = document.querySelector('.hc-rpg-care-card');
        const badge = careCard?.querySelector('.hc-rpg-card-count-badge')?.innerText?.trim() || '';
        const rows = Array.from(careCard?.querySelectorAll('.hc-rpg-habit-row') || []);
        const rowStates = rows.map(r => ({
          title: r.querySelector('strong')?.innerText?.trim() || '',
          isDone: r.classList.contains('is-done'),
          btnText: r.querySelector('button')?.innerText?.trim() || ''
        }));
        const journeyCard = document.querySelector('.hc-rpg-journey-card');
        const streakBadge = journeyCard?.querySelector('.hc-rpg-card-count-badge')?.innerText?.trim() || '';

        return { badge, streakBadge, rowStates };
      })()`,
      returnByValue: true,
    });

    console.log("Post-Checkin Verification Result:", JSON.stringify(postCheckin.result?.value, null, 2));
    const post = postCheckin.result?.value;

    // Assert: completed count must be exactly 1/5!
    assert.match(post.badge, /1\/5/, "Badge must report exactly 1/5 completed (NOT 5/5!)");
    assert.equal(post.rowStates[0].isDone, true, "Row 1 (g1) must be marked done");
    assert.match(post.rowStates[0].btnText, /Đã ghi nhận|Recorded/, "Row 1 button must show recorded");

    assert.equal(post.rowStates[1].isDone, false, "Row 2 (g2) must NOT be marked done");
    assert.match(post.rowStates[1].btnText, /Ghi nhận|Check in/, "Row 2 button must show check in");

    assert.equal(post.rowStates[2].isDone, false, "Row 3 (g3) must NOT be marked done");
    assert.match(post.rowStates[2].btnText, /Ghi nhận|Check in/, "Row 3 button must show check in");

    assert.match(post.streakBadge, /1\/7/, "7-day streak must report 1/7 days consecutive");
    console.log("✓ TRUTHFUL CHECK-IN RECOVERY VERIFIED: 1/5 completed, row 1 done, rows 2 & 3 not done, streak 1/7!");

    // 5. Test Mobile Viewports and Touch Targets (320px, 390px, 430px)
    for (const [w, h] of [[320, 800], [390, 844], [430, 932]]) {
      console.log(`\nTesting mobile touch targets at ${w}x${h}...`);
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 600));

      const touchAudit = await send("Runtime.evaluate", {
        expression: `(() => {
          const langBtn = document.querySelector('.hc-rpg-lang-btn');
          const profileBtn = Array.from(document.querySelectorAll('.hc-rpg-circle-btn')).find(b => getComputedStyle(b).display !== 'none');
          const topbar = document.querySelector('.hc-rpg-topbar');
          const capsule = document.querySelector('.hc-rpg-exp-capsule');

          const langRect = langBtn?.getBoundingClientRect();
          const profRect = profileBtn?.getBoundingClientRect();
          const topRect = topbar?.getBoundingClientRect();
          const capRect = capsule?.getBoundingClientRect();

          const hasHorizOverflow = document.documentElement.scrollWidth > window.innerWidth;

          return {
            viewportWidth: window.innerWidth,
            langTouch: { width: langRect?.width, height: langRect?.height },
            profileTouch: { width: profRect?.width, height: profRect?.height },
            topbarWidth: topRect?.width,
            capsuleWidth: capRect?.width,
            hasHorizOverflow
          };
        })()`,
        returnByValue: true,
      });

      console.log(`Touch Target Audit (${w}x${h}):`, JSON.stringify(touchAudit.result?.value, null, 2));
      const touch = touchAudit.result?.value;

      assert.equal(touch.hasHorizOverflow, false, `Must have zero horizontal overflow at ${w}px`);
      assert.ok(touch.langTouch.width >= 44, `Language button width must be >= 44px (got ${touch.langTouch.width}px)`);
      assert.ok(touch.langTouch.height >= 44, `Language button height must be >= 44px (got ${touch.langTouch.height}px)`);
      assert.ok(touch.profileTouch.width >= 44, `Profile button width must be >= 44px (got ${touch.profileTouch.width}px)`);
      assert.ok(touch.profileTouch.height >= 44, `Profile button height must be >= 44px (got ${touch.profileTouch.height}px)`);
      console.log(`✓ All touch targets >= 44px verified at ${w}x${h} with zero overflow!`);

      const shot = await send("Page.captureScreenshot", { format: "png" });
      const imgBuffer = Buffer.from(shot.data, "base64");
      writeFileSync(path.join(workspaceScreenshots, `verified-mobile-${w}-rpg.png`), imgBuffer);
      writeFileSync(path.join(artifactsDir, `verified-mobile-${w}-rpg.png`), imgBuffer);
      console.log(`Saved verified-mobile-${w}-rpg.png to workspace and artifacts.`);
    }

    console.log("\n=== ALL TRUTHFUL CHECKS & TOUCH TARGET TESTS PASSED! ===");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
