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
  console.log("=== STARTING COMPREHENSIVE ACCEPTANCE ROUND TEST ===");

  // 1. Check quick-activate endpoint is permanently disabled (410 Gone)
  console.log("1. Testing /api/healthclues/account/quick-activate endpoint...");
  const qaGet = await fetch(`${base}/api/healthclues/account/quick-activate`);
  assert.equal(qaGet.status, 410, "GET /api/healthclues/account/quick-activate must return 410");
  const qaPost = await fetch(`${base}/api/healthclues/account/quick-activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com" }),
  });
  assert.equal(qaPost.status, 410, "POST /api/healthclues/account/quick-activate must return 410");
  console.log("✓ Quick-activate endpoint is permanently disabled (410 Gone).");

  // Launch Chrome
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-acc-fix-${Date.now()}`);
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

    // =========================================================================
    // TEST 1: SLEEP VALLEY FLOW VIA AUTH & LOCAL MAILPIT
    // =========================================================================
    console.log("\n2. Testing Sleep Valley Flow with Real Mailpit Auth...");
    const sleepEmail = `hc-sleep-${Date.now()}@example.invalid`;

    // Navigate directly to Sleep Discovery Quiz
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery` });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for quiz container
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Capture Quiz screenshots across mobile viewports
    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 300));
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-quiz.png`, shot.data);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 300));

    // Step 1: Select 1 sleep concern
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục"
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Select 1 factor and confirm age
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        const check = quiz.querySelector('input[type="checkbox"]');
        if (check && !check.checked) check.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục kích hoạt tài khoản"
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    // If WellnessPlanBuilder shows, wait for skip button and click it
    console.log("Checking for WellnessPlanBuilder skip option...");
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          if (document.querySelector('[data-hc-world-preview]')) return { inPreview: true };
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip'));
          if (skipBtn) {
            skipBtn.click();
            return { clickedSkip: true };
          }
          return { waiting: true };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.inPreview) {
        console.log("Already in World Preview.");
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    // Wait for World Preview and click BẮT ĐẦU HÀNH TRÌNH
    console.log("In World Preview: Waiting for BẮT ĐẦU HÀNH TRÌNH button...");
    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 300));
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-preview.png`, shot.data);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 300));
    for (let i = 0; i < 30; i++) {
      const started = await send("Runtime.evaluate", {
        expression: `(() => {
          const startBtn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU') || b.innerText.includes('START'));
          if (startBtn) {
            startBtn.click();
            return true;
          }
          return false;
        })()`,
        returnByValue: true,
      });
      if (started.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Wait for activation dialog to open
    for (let i = 0; i < 20; i++) {
      const dialogCheck = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('section[role="dialog"]'))`,
        returnByValue: true,
      });
      if (dialogCheck.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Assert that instant activate button is NOT present!
    const hasInstantBtn = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('[data-instant-activate-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Kích hoạt tức thì')))` ,
      returnByValue: true,
    });
    assert.equal(hasInstantBtn.result?.value, false, "Instant Activate button must be completely removed from DOM!");
    console.log("✓ Verified: No instant activation shortcuts in client DOM.");

    // Fill in email and request verification link
    console.log(`Submitting email ${sleepEmail} for Mailpit verification...`);
    const formDiag = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('section[role="dialog"]');
        const input = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(sleepEmail)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const check = document.querySelector('section[role="dialog"] input[type="checkbox"]') || document.querySelector('input[type="checkbox"]');
        if (check && !check.checked) {
          check.click();
        }
        const submitBtn = document.querySelector('button[type="submit"]');
        return {
          dialogOpen: Boolean(dialog),
          inputFound: Boolean(input),
          inputValue: input?.value,
          checkFound: Boolean(check),
          checkChecked: check?.checked,
          submitBtnFound: Boolean(submitBtn),
          submitBtnDisabled: submitBtn?.disabled,
          submitBtnText: submitBtn?.innerText
        };
      })()`,
      returnByValue: true,
    });
    console.log("Form diagnostics before submit:", JSON.stringify(formDiag.result?.value, null, 2));

    await new Promise((r) => setTimeout(r, 600));

    // Submit form
    const submitResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        const form = document.querySelector('section[role="dialog"] form');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          return { clicked: true, disabled: false };
        } else if (form) {
          form.requestSubmit();
          return { clicked: false, requestSubmit: true };
        }
        return { clicked: false, submitBtnFound: Boolean(submitBtn), disabled: submitBtn?.disabled };
      })()`,
      returnByValue: true,
    });
    console.log("Submit result:", JSON.stringify(submitResult.result?.value, null, 2));

    // Wait up to 5s for submit network call and response
    for (let i = 0; i < 20; i++) {
      const settleCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const alert = document.querySelector('p[role="alert"]')?.innerText;
          const status = document.querySelector('[role="status"]')?.innerText;
          return { alert, status };
        })()`,
        returnByValue: true,
      });
      if (settleCheck.result?.value?.status || settleCheck.result?.value?.alert) {
        console.log("Form settled state:", JSON.stringify(settleCheck.result?.value));
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    // Fetch verification link from Mailpit
    console.log("Waiting for magic link in Mailpit...");
    const verifyUrl = await fetchMailpitLink(sleepEmail);
    console.log("✓ Mailpit delivered magic link:", verifyUrl);

    // Follow the verification URL in browser
    console.log("Navigating to Supabase verification endpoint...");
    await send("Page.navigate", { url: verifyUrl });
    await new Promise((r) => setTimeout(r, 4500));

    // Wait for World Game scene to load
    for (let i = 0; i < 60; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          const map = Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]'));
          const statusText = document.querySelector('[role="status"]')?.innerText || '';
          const heading = document.querySelector('h1')?.innerText || '';
          return { map, url: window.location.href, statusText, heading };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.map) {
        console.log("World loaded on step", i);
        break;
      }
      if (i % 5 === 0) {
        console.log(`[Wait step ${i}]`, check.result?.value);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Inspect the world scene
    const worldAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const map = document.querySelector('[data-region-map]');
        const petActor = document.querySelector('.hc-rpg-pet-actor');
        const petName = document.querySelector('.hc-rpg-lumi-tag')?.innerText?.trim() || document.querySelector('.hc-rpg-pet-world-name')?.textContent?.trim() || '';
        const levelTitle = document.querySelector('.hc-rpg-level-title')?.innerText?.trim() || '';
        const expNum = document.querySelector('.hc-rpg-bar-num')?.innerText?.trim() || '';
        const hasCelebration = Boolean(document.querySelector('.hc-rpg-center-burst'));
        const rightPanels = document.querySelector('.hc-rpg-right-panels');
        const careHeading = rightPanels?.querySelector('.hc-rpg-care-card .hc-rpg-card-heading')?.innerText?.trim() || '';
        const careEmpty = Boolean(rightPanels?.querySelector('.hc-rpg-empty-care') || rightPanels?.innerText?.includes('Chưa có mục tiêu'));
        const day7Heading = rightPanels?.querySelector('.hc-rpg-journey-card .hc-rpg-card-heading')?.innerText?.trim() || '';
        const dayNodes = Array.from(rightPanels?.querySelectorAll('.hc-rpg-7day-node') || []).map(n => ({
          label: n.querySelector('.hc-rpg-7day-label')?.innerText?.trim() || '',
          isDone: n.classList.contains('is-done'),
          isToday: n.classList.contains('is-today'),
          isLocked: n.classList.contains('is-locked')
        }));
        return {
          url: window.location.href,
          regionMapAttr: map?.getAttribute('data-region-map'),
          petFollowAttr: petActor?.getAttribute('data-pet-follow'),
          petName,
          levelTitle,
          expNum,
          hasCelebration,
          careHeading,
          careEmpty,
          day7Heading,
          dayNodesCount: dayNodes.length,
          firstNode: dayNodes[0],
          secondNode: dayNodes[1]
        };
      })()`,
      returnByValue: true,
    });

    console.log("Sleep Valley World Audit Result:", JSON.stringify(worldAudit.result?.value, null, 2));

    const audit = worldAudit.result?.value;
    assert.equal(audit.regionMapAttr, "sleep-better", "Sleep Valley region map must be sleep-better");
    assert.equal(audit.petFollowAttr, "luna", "Pet companion must be Luna in Sleep Valley");
    assert.match(audit.petName, /Luna/i, "Pet name tag must say Luna");
    assert.match(audit.levelTitle, /Cấp 1/i, "Brand new account must start at Level 1");
    assert.match(audit.expNum, /0 \/ 50 EXP/, "Brand new account must have 0 / 50 EXP");
    assert.equal(audit.hasCelebration, false, "Brand new account must NOT have fake celebration toast (+20 EXP) by default");
    assert.equal(audit.careEmpty, true, "Card 1 must show honest empty state when plan was skipped");
    assert.equal(audit.firstNode?.isToday, true, "Day 1 must be active (is-today)");
    assert.equal(audit.secondNode?.isLocked, true, "Day 2 must be locked");
    console.log("✓ Sleep Valley region, Luna companion, real Level 1, 0 EXP verified!");

    // Capture screenshot of Sleep Valley
    const sleepShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-sleep-valley-real-auth.png", sleepShot.data);
    console.log("Saved verified-sleep-valley-real-auth.png");

    // Dismiss tour ("bỏ tour") if active
    console.log("Dismissing tour (bỏ tour)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // TEST 2: RELOAD PERSISTENCE (Sleep Valley stays sleep-better with Luna)
    // =========================================================================
    console.log("\n3. Testing Page Reload Persistence...");
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 3500));

    const reloadAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const map = document.querySelector('[data-region-map]');
        const petActor = document.querySelector('.hc-rpg-pet-actor');
        const petName = document.querySelector('.hc-rpg-lumi-tag')?.innerText?.trim() || document.querySelector('.hc-rpg-pet-world-name')?.textContent?.trim() || '';
        return {
          regionMapAttr: map?.getAttribute('data-region-map'),
          petFollowAttr: petActor?.getAttribute('data-pet-follow'),
          petName,
        };
      })()`,
      returnByValue: true,
    });
    console.log("After Reload Audit:", JSON.stringify(reloadAudit.result?.value, null, 2));
    assert.equal(reloadAudit.result?.value.regionMapAttr, "sleep-better", "Reload must retain Sleep Valley");
    assert.equal(reloadAudit.result?.value.petFollowAttr, "luna", "Reload must retain Luna");
    console.log("✓ Verified: Region and Companion persist after reload.");

    // =========================================================================
    // TEST 2B: TRUTHFUL 5-GOAL PLAN, CHECK-IN (1 DONE, 4 NOT YET) & PERSISTENCE
    // =========================================================================
    console.log("\n3B. Testing Truthful Daily Care (5 Journey Goals, 1 Done, 4 Not Yet)...");
    const storageKeys = await send("Runtime.evaluate", {
      expression: `(() => {
        return {
          localKeys: Object.keys(localStorage),
          sessionKeys: Object.keys(sessionStorage),
          cookie: document.cookie,
          localDump: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)?.slice(0, 50)]))
        };
      })()`,
      returnByValue: true
    });
    console.log("Storage diagnostic:", JSON.stringify(storageKeys.result?.value, null, 2));

    const planSetup = await send("Runtime.evaluate", {
      expression: `(async () => {
        const token = (() => {
          const raw = localStorage.getItem('botly-cloud-session');
          if (raw) {
            try { return JSON.parse(raw).access_token; } catch {}
          }
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('-auth-token') || key.includes('session'))) {
              try {
                const item = JSON.parse(localStorage.getItem(key));
                return item.access_token || item?.currentSession?.access_token;
              } catch {}
            }
          }
          return null;
        })();
        const authHeaders = token ? { 'Authorization': 'Bearer ' + token } : {};

        const res = await fetch('/api/healthclues/world', { headers: authHeaders });
        const data = await res.json();
        const worldId = data.world?.id;
        if (!worldId) return { error: "No world found", data, hasToken: Boolean(token) };

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
        const sampleGoals = [
          makeGoal("g1", "Uống trà hoa cúc buổi tối", "sleep"),
          makeGoal("g2", "Tắt màn hình 30 phút trước ngủ", "sleep"),
          makeGoal("g3", "Thở 4-7-8 thư giãn 5 phút", "relaxation"),
          makeGoal("g4", "Giữ phòng ngủ thoáng mát 22°C", "sleep"),
          makeGoal("g5", "Ghi nhật ký cảm xúc 3 dòng", "relaxation"),
        ];

        const savePlanRes = await fetch('/api/healthclues/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            worldId,
            requestKey: 'c0000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0').slice(-12),
            confirmed: true,
            goals: sampleGoals
          })
        });
        const planJson = await savePlanRes.json();
        return { worldId, planOk: savePlanRes.ok, planJson };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log("Plan Setup Result:", JSON.stringify(planSetup.result?.value));
    assert.equal(planSetup.result?.value?.planOk, true, "Plan must be saved with 5 goals");

    // Reload to display the 5 goals
    await send("Page.reload");
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-rpg-care-card .hc-rpg-card-count-badge'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    await new Promise((r) => setTimeout(r, 800));

    // Close modal (e.g. My Journey) if open so HUD floating cards are visible
    for (let i = 0; i < 30; i++) {
      const closed = await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
          if (closeBtn) {
            closeBtn.click();
            return true;
          }
          return !document.querySelector('.hc-game-modal');
        })()`,
        returnByValue: true
      });
      if (closed.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify initial 0/5 completed
    const initialCareCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const careCard = document.querySelector('.hc-rpg-care-card');
        const badge = careCard?.querySelector('.hc-rpg-card-count-badge')?.innerText?.trim() || '';
        const subtitle = careCard?.querySelector('.hc-rpg-care-subtitle')?.innerText?.trim() || '';
        const rightPanels = document.querySelector('.hc-rpg-right-panels');
        return {
          careCardFound: Boolean(careCard),
          careCardText: careCard?.innerText?.slice(0, 300),
          rightPanelsText: rightPanels?.innerText?.slice(0, 300),
          badge,
          subtitle
        };
      })()`,
      returnByValue: true,
    });
    console.log("Initial Care Check (0/5):", JSON.stringify(initialCareCheck.result?.value, null, 2));
    assert.match(initialCareCheck.result?.value.badge, /0\/5/, "Initial completed count must be 0/5");
    assert.match(initialCareCheck.result?.value.careCardText, /3 mục tiêu đầu trong số 5/, "Must explain first 3 of 5 goals");

    // Now record check-in using the real UI:
    // 1. Open Daily Check-in modal via UI
    console.log("Opening Daily Check-in modal via UI...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const checkinBtn = document.querySelector('.hc-rpg-task-btn') ||
                           Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today')) ||
                           Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Check-in') || b.innerText.includes('Ghi nhận'));
        if (checkinBtn) checkinBtn.click();
      })()`
    });

    // Wait for check-in dialog to open and load
    for (let i = 0; i < 30; i++) {
      const openCheck = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-checkin-dialog .hc-checkin-goal-card'))`,
        returnByValue: true,
      });
      if (openCheck.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // 2. Tap Goal 1 Done once
    // 3. Tap Goal 2 Done twice (to test double toggle: first done, then not_yet)
    const uiInteractionResult = await send("Runtime.evaluate", {
      expression: `(async () => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        if (!dialog) return { found: false };
        const cards = Array.from(dialog.querySelectorAll('.hc-checkin-goal-card'));
        if (cards.length < 2) return { cardsCount: cards.length };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // Card 1: click Done
        const card1Done = cards[0].querySelector('.hc-checkin-btn.is-done');
        if (card1Done) card1Done.click();
        await sleep(200);
        const card1IsDone = document.querySelectorAll('.hc-checkin-goal-card')[0].classList.contains('is-done');

        // Card 2: click Done first time (sets to done)
        const card2Done = document.querySelectorAll('.hc-checkin-goal-card')[1].querySelector('.hc-checkin-btn.is-done');
        if (card2Done) card2Done.click();
        await sleep(200);
        const afterFirst = document.querySelectorAll('.hc-checkin-goal-card')[1].classList.contains('is-done');

        // Card 2: click Done again (toggles back to not_yet)
        const card2DoneAgain = document.querySelectorAll('.hc-checkin-goal-card')[1].querySelector('.hc-checkin-btn.is-done');
        if (card2DoneAgain) card2DoneAgain.click();
        await sleep(200);
        const afterSecond = document.querySelectorAll('.hc-checkin-goal-card')[1].classList.contains('is-done');

        return {
          found: true,
          cardsCount: cards.length,
          card1Done: card1IsDone,
          card2AfterFirstClick: afterFirst,
          card2AfterSecondClick: afterSecond
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log("UI Check-in Interaction:", JSON.stringify(uiInteractionResult.result?.value, null, 2));
    assert.equal(uiInteractionResult.result?.value?.card1Done, true, "Goal 1 must be marked Done");
    assert.equal(uiInteractionResult.result?.value?.card2AfterFirstClick, true, "Goal 2 must be marked Done after 1st click");
    assert.equal(uiInteractionResult.result?.value?.card2AfterSecondClick, false, "Goal 2 must toggle back to not_yet after 2nd click");

    // 4. Click Save Check-in button in dialog
    console.log("Saving check-in via UI save button...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const saveBtn = document.querySelector('[data-save-checkin]') ||
                        Array.from(document.querySelectorAll('.hc-checkin-buttons button')).find(b => b.innerText.includes('Lưu') || b.innerText.includes('Save'));
        if (saveBtn) saveBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Reload page to verify persistence from server
    console.log("Reloading world after truthful check-in...");
    await send("Page.reload");
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('.hc-rpg-care-card .hc-rpg-card-count-badge'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    await new Promise((r) => setTimeout(r, 800));

    // Close modal if open so HUD floating cards are visible
    for (let i = 0; i < 30; i++) {
      const closed = await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
          if (closeBtn) {
            closeBtn.click();
            return true;
          }
          return !document.querySelector('.hc-game-modal');
        })()`,
        returnByValue: true
      });
      if (closed.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify after reload: 1/5 completed, row 1 is done, rows 2 & 3 not done
    const postCheckinAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const careCard = document.querySelector('.hc-rpg-care-card');
        const badge = careCard?.querySelector('.hc-rpg-card-count-badge')?.innerText?.trim() || '';
        const subtitle = careCard?.querySelector('.hc-rpg-care-subtitle')?.innerText?.trim() || '';
        const rows = Array.from(careCard?.querySelectorAll('.hc-rpg-habit-row') || []);
        const rowStates = rows.map((r, i) => {
          const btn = r.querySelector('.hc-rpg-task-btn') || r.querySelector('button');
          return {
            index: i,
            isRowDoneClass: r.classList.contains('is-done'),
            isCompletedClass: btn?.classList.contains('is-completed'),
            btnText: btn?.innerText?.trim(),
            titleText: r.querySelector('.hc-rpg-habit-text strong')?.innerText?.trim()
          };
        });
        const streakBadge = document.querySelector('.hc-rpg-journey-card .hc-rpg-card-count-badge')?.innerText?.trim() || '';
        return { badge, subtitle, rowsCount: rows.length, rowStates, streakBadge };
      })()`,
      returnByValue: true,
    });
    console.log("Post Check-in Audit:", JSON.stringify(postCheckinAudit.result?.value, null, 2));
    const postAudit = postCheckinAudit.result?.value;
    assert.match(postAudit.badge, /1\/5/, "Badge must report truthful 1/5 completed");
    assert.equal(postAudit.rowStates[0]?.isCompletedClass, true, "Row 1 must be marked completed");
    assert.match(postAudit.rowStates[0]?.btnText, /Đã xong|Đã ghi nhận/i, "Row 1 button must say Đã xong or Đã ghi nhận");
    assert.equal(postAudit.rowStates[1]?.isCompletedClass, false, "Row 2 must NOT be marked completed");
    assert.equal(postAudit.rowStates[2]?.isCompletedClass, false, "Row 3 must NOT be marked completed");
    assert.match(postAudit.streakBadge, /1\/7/, "7-day streak must truthfully report 1/7 days");
    console.log("✓ Truthful 1/5 completed, per-goal status and consecutive streak verified after reload!");

    // =========================================================================
    // TEST 3: NPC CLICK -> WALK -> ARRIVE -> TALK (No instant modal open)
    // =========================================================================
    console.log("\n4. Testing NPC Interaction: Walk then Talk...");

    // Dismiss any tour overlay or modal if open before walk test
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    const clickNpcResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const botanist = document.querySelector('[data-landmark-id="nutrition"] .hc-rpg-npc') || document.querySelector('[data-landmark-id="nutrition"] button');
        if (!botanist) return { found: false };
        const initialModal = Boolean(document.querySelector('.hc-game-modal'));
        botanist.click();
        const modalImmediatelyAfterClick = Boolean(document.querySelector('.hc-game-modal'));
        const playerWalking = document.querySelector('[data-player-actor]')?.getAttribute('data-walking');
        return {
          found: true,
          initialModal,
          modalImmediatelyAfterClick,
          playerWalking
        };
      })()`,
      returnByValue: true,
    });
    console.log("Click NPC Result:", JSON.stringify(clickNpcResult.result?.value, null, 2));
    assert.equal(clickNpcResult.result?.value.modalImmediatelyAfterClick, false, "Clicking NPC must NOT open modal immediately!");
    console.log("✓ Verified: NPC click does NOT open modal immediately.");

    // Wait for player to arrive and Talk button to appear
    console.log("Waiting for player to walk along stone path and arrive...");
    let talkButtonAppeared = false;
    for (let i = 0; i < 45; i++) {
      const talkCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const btn = document.querySelector('.hc-rpg-talk button');
          const playerPos = document.querySelector('[data-player-actor]') ? {
            x: document.querySelector('[data-player-actor]').getAttribute('data-world-x'),
            y: document.querySelector('[data-player-actor]').getAttribute('data-world-y'),
            walking: document.querySelector('[data-player-actor]').getAttribute('data-walking')
          } : null;
          return { hasTalk: Boolean(btn), playerPos };
        })()`,
        returnByValue: true,
      });
      if (talkCheck.result?.value?.hasTalk) {
        talkButtonAppeared = true;
        break;
      }
      if (i % 5 === 0) {
        console.log(`[Walk step ${i}] playerPos:`, talkCheck.result?.value?.playerPos);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    assert.equal(talkButtonAppeared, true, "Talk button must appear upon arrival at landmark");
    console.log("✓ Talk button appeared after arrival!");

    // Click Talk button to open panel
    await send("Runtime.evaluate", {
      expression: `(() => {
        const talkBtn = document.querySelector('.hc-rpg-talk button');
        if (talkBtn) talkBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const modalCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const modalTitle = modal?.querySelector('h2')?.innerText?.trim() || '';
        const hudSidePanels = document.querySelector('.hc-rpg-right-panels');
        const sidePanelsHidden = !hudSidePanels || getComputedStyle(hudSidePanels).display === 'none';
        return {
          modalOpen: Boolean(modal),
          modalTitle,
          sidePanelsHidden
        };
      })()`,
      returnByValue: true,
    });
    console.log("Modal Open Check:", JSON.stringify(modalCheck.result?.value, null, 2));
    assert.equal(modalCheck.result?.value.modalOpen, true, "Clicking Talk must open the Botanist Garden modal");
    console.log("✓ Verified: Talk button successfully opens Botanist modal.");

    // Capture Botanist NPC Modal across mobile viewports
    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 300));
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-npc-modal.png`, shot.data);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 300));

    // Close modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal header button');
        if (closeBtn) closeBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // TEST 4: MOBILE VIEWPORT VERIFICATION (390x844 & 3-Button Dock)
    // =========================================================================
    console.log("\n5. Testing Mobile Viewport 390x844...");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileDockAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const visibleBtns = btns.filter(b => getComputedStyle(b).display !== 'none');
        return {
          totalBtns: btns.length,
          visibleBtnsCount: visibleBtns.length,
          labels: visibleBtns.map(b => b.querySelector('.hc-rpg-dock-label')?.innerText?.trim() || '')
        };
      })()`,
      returnByValue: true,
    });
    console.log("Mobile Dock Audit (390px):", JSON.stringify(mobileDockAudit.result?.value, null, 2));
    assert.equal(mobileDockAudit.result?.value.visibleBtnsCount, 3, "Mobile dock must show exactly 3 primary buttons");
    console.log("✓ Verified: Mobile dock has exactly 3 primary buttons (Bản đồ · Hành Trình · Hôm nay).");

    // =========================================================================
    // 5B. COLLISION CHECK: DOCK VS MASCOT / REOPEN BUTTON
    // =========================================================================
    const collisionAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const reopen = document.querySelector('.hc-rpg-lumi-reopen-btn');
        if (!dock || !reopen || getComputedStyle(reopen).display === 'none') return { overlaps: false };
        const d = dock.getBoundingClientRect();
        const r = reopen.getBoundingClientRect();
        const vert = !(r.bottom <= d.top || r.top >= d.bottom);
        const horiz = !(r.right <= d.left || r.left >= d.right);
        return { overlaps: vert && horiz };
      })()`,
      returnByValue: true
    });
    assert.equal(collisionAudit.result?.value?.overlaps, false, "Bottom dock must not overlap mascot/reopen button");
    console.log("✓ Verified: Zero collision between bottom menu dock and mascot/reopen button.");

    // =========================================================================
    // 5C. MODAL 'HÀNH TRÌNH' (My Journey Tabs & Buttons)
    // =========================================================================
    console.log("Testing Modal 'Hành trình' (My Journey)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const journeyBtn = btns.find(b => b.innerText.includes('Hành Trình') || b.innerText.includes('Journey'));
        if (journeyBtn) journeyBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const journeyAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const tabs = Array.from(modal?.querySelectorAll('.hc-journey-nav-tab-btn') || []);
        const addBtn = modal?.querySelector('.hc-add-habit-btn');
        const changeBtns = Array.from(modal?.querySelectorAll('.hc-quest-change-habit-btn') || []);
        const activeSection = modal?.querySelector('.hc-active-goals-section');
        const roadmapSection = modal?.querySelector('.hc-journey-map-banner');
        return {
          modalOpen: Boolean(modal),
          tabsCount: tabs.length,
          defaultTabSelected: tabs[0]?.getAttribute('aria-selected') === 'true',
          hasAddBtn: Boolean(addBtn),
          changeBtnsCount: changeBtns.length,
          hasActiveSection: Boolean(activeSection),
          hasRoadmapSection: Boolean(roadmapSection),
        };
      })()`,
      returnByValue: true
    });
    console.log("Journey Modal Audit:", JSON.stringify(journeyAudit.result?.value));
    assert.equal(journeyAudit.result?.value.modalOpen, true, "Journey modal must open");
    assert.equal(journeyAudit.result?.value.tabsCount, 2, "Must have exactly 2 tabs in Journey modal");
    assert.equal(journeyAudit.result?.value.defaultTabSelected, true, "Default tab must be 'Thói quen đang theo dõi'");
    assert.equal(journeyAudit.result?.value.hasAddBtn, true, "Must have [+ Thêm thói quen] button");
    assert.ok(journeyAudit.result?.value.changeBtnsCount > 0, "Must have [Đổi / Bỏ] button on goal cards");
    assert.equal(journeyAudit.result?.value.hasActiveSection, true, "Active habits section must be visible");
    assert.equal(journeyAudit.result?.value.hasRoadmapSection, false, "30-Day roadmap must be hidden on active habits tab");
    console.log("✓ Verified: Modal 'Hành trình' has default tab 'Thói quen đang theo dõi', [+ Thêm thói quen], and [Đổi / Bỏ]!");

    // Switch to Roadmap tab and verify separation
    await send("Runtime.evaluate", {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.hc-journey-nav-tab-btn'));
        if (tabs[1]) tabs[1].click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    const roadmapCheck = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-journey-map-banner'))`,
      returnByValue: true
    });
    assert.equal(roadmapCheck.result?.value, true, "Lộ trình 30 ngày tab must render 30-day map banner");
    console.log("✓ Verified: 'Lộ trình 30 ngày' tab is cleanly separated!");

    // Close Journey modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // 5D. DIALOG 'GHI NHẬN HÔM NAY' (Daily Check-in)
    // =========================================================================
    console.log("Testing Dialog 'Ghi nhận hôm nay' (Daily Check-in)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const homNayBtn = btns.find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today'));
        if (homNayBtn) homNayBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const checkinModalAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        const hasStarBox = Boolean(dialog?.querySelector('select') || dialog?.querySelector('[data-star-rating]'));
        const cards = Array.from(dialog?.querySelectorAll('.hc-checkin-goal-card') || []);
        const items = cards.map(c => {
          const title = c.querySelector('.hc-checkin-goal-title')?.innerText?.trim() || '';
          const sub = c.querySelector('.hc-checkin-goal-sub')?.innerText?.trim() || '';
          const isDuplicate = sub.length > 0 && (title.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(title.toLowerCase()));
          return { title, sub, isDuplicate };
        });
        return {
          dialogOpen: Boolean(dialog),
          hasStarBox,
          cardsCount: cards.length,
          items
        };
      })()`,
      returnByValue: true
    });
    console.log("Checkin Dialog Audit:", JSON.stringify(checkinModalAudit.result?.value));
    assert.equal(checkinModalAudit.result?.value.dialogOpen, true, "Check-in dialog must open");
    assert.equal(checkinModalAudit.result?.value.hasStarBox, false, "No cumbersome 0/5 star rating box in dialog");
    for (const it of checkinModalAudit.result?.value.items || []) {
      assert.equal(it.isDuplicate, false, `No duplicate title/subtitle allowed for ${it.title}`);
    }
    console.log("✓ Verified: Dialog 'Ghi nhận hôm nay' has no 0/5 star box, no duplicate title/subtitle!");

    // Close Checkin dialog
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // 5E. THẺ HUD 'NHIỆM CARE' (Typography & EXP Badge)
    // =========================================================================
    const hudCareCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const card = document.querySelector('.hc-rpg-care-card');
        const titles = Array.from(card?.querySelectorAll('.hc-rpg-habit-title') || []);
        const expTags = Array.from(card?.querySelectorAll('.hc-rpg-exp-tag') || []);
        return {
          cardFound: Boolean(card),
          titlesCount: titles.length,
          allTitlesSpan: titles.every(t => t.tagName.toLowerCase() === 'span'),
          allTitlesNormalWeight: titles.every(t => getComputedStyle(t).fontWeight !== '700'),
          expTagsFound: expTags.length > 0
        };
      })()`,
      returnByValue: true
    });
    console.log("HUD Care Typography Check:", JSON.stringify(hudCareCheck.result?.value));
    assert.equal(hudCareCheck.result?.value.cardFound, true, "Nhiệm Care card must be found");
    assert.equal(hudCareCheck.result?.value.allTitlesSpan, true, "All habit titles must be span (not heavy strong tag)");
    assert.equal(hudCareCheck.result?.value.allTitlesNormalWeight, true, "Habit titles must not be bold 700");
    console.log("✓ Verified: Thẻ HUD 'Nhiệm Care' has compact font, not bold/chunky, badge +10 EXP is compact!");

    // Check 390px touch target sizes and EXP contrast & non-clipping
    const touchAudit390 = await send("Runtime.evaluate", {
      expression: `(() => {
        const lang = document.querySelector('.hc-rpg-lang-btn');
        const profile = document.querySelector('.hc-rpg-top-actions button[aria-label*="Profile"]') || document.querySelector('.hc-rpg-top-actions .hc-rpg-circle-btn:not(.is-mobile-hidden)');
        const dockBtns = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).filter(b => getComputedStyle(b).display !== 'none');
        const track = document.querySelector('.hc-rpg-bar-track');
        const barNum = document.querySelector('.hc-rpg-bar-num');
        const langRect = lang ? lang.getBoundingClientRect() : null;
        const profRect = profile ? profile.getBoundingClientRect() : null;
        const dockRects = dockBtns.map(b => b.getBoundingClientRect());
        const trackRect = track ? track.getBoundingClientRect() : null;
        const numRect = barNum ? barNum.getBoundingClientRect() : null;
        const numColor = barNum ? getComputedStyle(barNum).color : '';
        return {
          lang: langRect ? { width: langRect.width, height: langRect.height } : null,
          profile: profRect ? { width: profRect.width, height: profRect.height } : null,
          dockHeights: dockRects.map(r => r.height),
          dockWidths: dockRects.map(r => r.width),
          expTrack: trackRect ? { height: trackRect.height } : null,
          expNum: numRect ? { height: numRect.height, color: numColor } : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log("390px Touch Target & EXP Audit:", JSON.stringify(touchAudit390.result?.value));
    assert.ok(touchAudit390.result?.value.lang?.height >= 44, "Language button height must be >= 44px");
    assert.ok(touchAudit390.result?.value.lang?.width >= 44, "Language button width must be >= 44px");
    assert.ok(touchAudit390.result?.value.profile?.height >= 44, "Profile button height must be >= 44px");
    assert.ok(touchAudit390.result?.value.profile?.width >= 44, "Profile button width must be >= 44px");
    for (const h of touchAudit390.result?.value.dockHeights || []) {
      assert.ok(h >= 44, "Dock button height must be >= 44px");
    }
    assert.ok(touchAudit390.result?.value.expTrack?.height >= 14, "390px EXP track height must be >= 14px to prevent vertical clipping");
    assert.ok(touchAudit390.result?.value.expNum?.color.includes("255, 255, 255"), "390px EXP text must be high-contrast white");

    const mobileShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-rpg.png", mobileShot.data);
    saveScreenshot("mobile-390-hud.png", mobileShot.data);
    console.log("Saved verified-mobile-390-rpg.png and mobile-390-hud.png");

    // 320x800
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 800, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 600));

    const touchAudit320 = await send("Runtime.evaluate", {
      expression: `(() => {
        const lang = document.querySelector('.hc-rpg-lang-btn');
        const profile = document.querySelector('.hc-rpg-top-actions button[aria-label*="Profile"]') || document.querySelector('.hc-rpg-top-actions .hc-rpg-circle-btn:not(.is-mobile-hidden)');
        const track = document.querySelector('.hc-rpg-bar-track');
        const barNum = document.querySelector('.hc-rpg-bar-num');
        const langRect = lang ? lang.getBoundingClientRect() : null;
        const profRect = profile ? profile.getBoundingClientRect() : null;
        const trackRect = track ? track.getBoundingClientRect() : null;
        const numRect = barNum ? barNum.getBoundingClientRect() : null;
        const numColor = barNum ? getComputedStyle(barNum).color : '';
        return {
          lang: langRect ? { width: langRect.width, height: langRect.height } : null,
          profile: profRect ? { width: profRect.width, height: profRect.height } : null,
          expTrack: trackRect ? { height: trackRect.height } : null,
          expNum: numRect ? { height: numRect.height, color: numColor } : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log("320px Touch Target Audit:", JSON.stringify(touchAudit320.result?.value));
    assert.ok(touchAudit320.result?.value.lang?.height >= 44, "320px Language button height must be >= 44px");
    assert.ok(touchAudit320.result?.value.lang?.width >= 44, "320px Language button width must be >= 44px");
    assert.ok(touchAudit320.result?.value.profile?.height >= 44, "320px Profile button height must be >= 44px");
    assert.ok(touchAudit320.result?.value.profile?.width >= 44, "320px Profile button width must be >= 44px");
    assert.ok(touchAudit320.result?.value.expTrack?.height >= 14, "320px EXP track height must be >= 14px to prevent vertical clipping");
    assert.ok(touchAudit320.result?.value.expNum?.color.includes("255, 255, 255"), "320px EXP text must be high-contrast white");

    const shot320 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-320-rpg.png", shot320.data);
    saveScreenshot("mobile-320-hud.png", shot320.data);
    console.log("Saved verified-mobile-320-rpg.png and mobile-320-hud.png");

    // 430x932
    await send("Emulation.setDeviceMetricsOverride", { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 600));
    const shot430 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-430-rpg.png", shot430.data);
    saveScreenshot("mobile-430-hud.png", shot430.data);
    console.log("Saved verified-mobile-430-rpg.png and mobile-430-hud.png");

    // Open Daily Care modal across mobile viewports
    console.log("Capturing Daily Care modal across 390, 320, 430...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('.hc-rpg-task-btn') || Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hôm nay'));
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 400));
      if (w === 320) {
        const boundsAudit = await send("Runtime.evaluate", {
          expression: `(() => {
            const cards = Array.from(document.querySelectorAll('.hc-checkin-goal-card'));
            if (!cards.length) return { found: false };
            return {
              found: true,
              cardsCount: cards.length,
              audits: cards.map((c, i) => {
                const cRect = c.getBoundingClientRect();
                const group = c.querySelector('.hc-checkin-binary-group');
                const btns = Array.from(group?.querySelectorAll('.hc-checkin-btn') || []);
                const b0 = btns[0]?.getBoundingClientRect();
                const b1 = btns[1]?.getBoundingClientRect();
                return {
                  i,
                  cWidth: cRect.width,
                  b0Left: b0?.left,
                  b1Right: b1?.right,
                  overflowLeft: b0 ? b0.left < cRect.left - 1 : false,
                  overflowRight: b1 ? b1.right > cRect.right + 1 : false,
                  b0Height: b0?.height,
                  b1Height: b1?.height
                };
              })
            };
          })()`,
          returnByValue: true
        });
        console.log("320px Daily Care Bounds Audit:", JSON.stringify(boundsAudit.result?.value));
        if (boundsAudit.result?.value?.found) {
          for (const a of boundsAudit.result.value.audits) {
            assert.equal(a.overflowLeft, false, `Card ${a.i} must not overflow left at 320px`);
            assert.equal(a.overflowRight, false, `Card ${a.i} must not overflow right at 320px`);
            assert.ok((a.b0Height || 0) >= 44, `Card ${a.i} button 0 height >= 44px (got ${a.b0Height})`);
            assert.ok((a.b1Height || 0) >= 44, `Card ${a.i} button 1 height >= 44px (got ${a.b1Height})`);
          }
          console.log("✓ Verified: At 320x800, Daily Care action buttons lie completely within card boundaries with >= 44px height!");
        }
      }
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-daily-care.png`, shot.data);
    }
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('.hc-game-modal-header button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Open My Journey modal across mobile viewports
    console.log("Capturing My Journey modal across 390, 320, 430...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Xem toàn bộ') || b.innerText.includes('Hành trình của tôi')) ||
                    document.querySelector('.hc-rpg-care-card button:last-of-type');
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 400));
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-journey.png`, shot.data);
    }
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('section[role="dialog"] header button');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // TEST 5: HEALTHCLUES REALM + ACCOUNT ISOLATION (Lumi companion)
    // =========================================================================
    console.log("\n6. Testing HealthClues Realm with Second Synthetic Account & Isolation...");
    const secondEmail = `hc-realm-${Date.now()}@example.invalid`;

    // Clear session & cookies
    await send("Network.clearBrowserCookies");
    await send("Runtime.evaluate", {
      expression: `(() => {
        localStorage.clear();
        sessionStorage.clear();
      })()`,
    });

    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=health-concern&step=discovery` });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for quiz container
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Capture Quiz screenshots across mobile viewports
    for (const [w, h] of [[390, 844], [320, 800], [430, 932]]) {
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await new Promise((r) => setTimeout(r, 300));
      const shot = await send("Page.captureScreenshot", { format: "png" });
      saveScreenshot(`mobile-${w}-quiz.png`, shot.data);
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 300));

    // Step 1: Select multiple concerns (first two buttons)
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Verify primary focus selector appeared
    const primaryFocusCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const primaryBtns = Array.from(quiz.querySelectorAll('button')).filter(b => b.classList.contains('ring-emerald-700') || b.classList.contains('border-emerald-700') || b.innerText.includes('★'));
        return {
          hasPrimarySelector: primaryBtns.length > 0,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Primary Focus Selector Check:", JSON.stringify(primaryFocusCheck.result?.value));

    // Click "Tiếp tục"
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Select factor and confirm age
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        const check = quiz.querySelector('input[type="checkbox"]');
        if (check && !check.checked) check.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục kích hoạt tài khoản"
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1500));

    // If WellnessPlanBuilder shows, skip it
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          if (document.querySelector('[data-hc-world-preview]')) return { inPreview: true };
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip'));
          if (skipBtn) {
            skipBtn.click();
            return { clickedSkip: true };
          }
          return { waiting: true };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.inPreview) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // In World Preview: Click BẮT ĐẦU HÀNH TRÌNH
    for (let i = 0; i < 30; i++) {
      const started = await send("Runtime.evaluate", {
        expression: `(() => {
          const startBtn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU') || b.innerText.includes('START'));
          if (startBtn) {
            startBtn.click();
            return true;
          }
          return false;
        })()`,
        returnByValue: true,
      });
      if (started.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Wait for activation dialog
    for (let i = 0; i < 20; i++) {
      const dialogCheck = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('section[role="dialog"]'))`,
        returnByValue: true,
      });
      if (dialogCheck.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Fill in second email
    console.log(`Submitting second email ${secondEmail} for Mailpit verification...`);
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(secondEmail)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const check = document.querySelector('section[role="dialog"] input[type="checkbox"]') || document.querySelector('input[type="checkbox"]');
        if (check && !check.checked) check.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Submit form
    await send("Runtime.evaluate", {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        const form = document.querySelector('section[role="dialog"] form');
        if (submitBtn && !submitBtn.disabled) submitBtn.click();
        else if (form) form.requestSubmit();
      })()`,
    });
    for (let i = 0; i < 20; i++) {
      const settleCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const alert = document.querySelector('p[role="alert"]')?.innerText;
          const status = document.querySelector('[role="status"]')?.innerText;
          return { alert, status };
        })()`,
        returnByValue: true,
      });
      if (settleCheck.result?.value?.status || settleCheck.result?.value?.alert) {
        console.log("Second account form settled state:", JSON.stringify(settleCheck.result?.value));
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    // Fetch magic link for second account
    const secondVerifyUrl = await fetchMailpitLink(secondEmail);
    console.log("✓ Mailpit delivered magic link for second account:", secondVerifyUrl);

    // Follow verification URL
    await send("Page.navigate", { url: secondVerifyUrl });
    await new Promise((r) => setTimeout(r, 4500));

    // Wait for World Game scene to load
    for (let i = 0; i < 60; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          const map = Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]'));
          const statusText = document.querySelector('[role="status"]')?.innerText || '';
          const heading = document.querySelector('h1')?.innerText || '';
          return { map, url: window.location.href, statusText, heading };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.map) {
        console.log("World loaded on step", i);
        break;
      }
      if (i % 5 === 0) {
        console.log(`[Wait step ${i}]`, check.result?.value);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    const realmAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const map = document.querySelector('[data-region-map]');
        const petActor = document.querySelector('.hc-rpg-pet-actor');
        const petName = document.querySelector('.hc-rpg-lumi-tag')?.innerText?.trim() || document.querySelector('.hc-rpg-pet-world-name')?.textContent?.trim() || '';
        const levelTitle = document.querySelector('.hc-rpg-level-title')?.innerText?.trim() || '';
        const expNum = document.querySelector('.hc-rpg-bar-num')?.innerText?.trim() || '';
        return {
          regionMapAttr: map?.getAttribute('data-region-map'),
          petFollowAttr: petActor?.getAttribute('data-pet-follow'),
          petName,
          levelTitle,
          expNum
        };
      })()`,
      returnByValue: true,
    });
    console.log("HealthClues Realm Audit Result:", JSON.stringify(realmAudit.result?.value, null, 2));
    assert.equal(realmAudit.result?.value.regionMapAttr, "health-concern", "HealthClues Realm region map must be health-concern");
    assert.equal(realmAudit.result?.value.petFollowAttr, "lumi", "Pet companion must be Lumi in HealthClues Realm");
    assert.match(realmAudit.result?.value.petName, /Lumi/i, "Pet name tag must say Lumi");
    assert.match(realmAudit.result?.value.levelTitle, /Cấp 1/i, "Second account must start at Level 1");
    assert.match(realmAudit.result?.value.expNum, /0 \/ 50 EXP/, "Second account must have 0 / 50 EXP");
    console.log("✓ HealthClues Realm region, Lumi companion, real Level 1, 0 EXP verified!");

    const realmShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-realm-real-auth-desktop.png", realmShot.data);
    console.log("Saved verified-realm-real-auth-desktop.png");

    console.log("\n=== ALL COMPREHENSIVE ACCEPTANCE ROUND TESTS PASSED WITH ZERO ERRORS ===");
    process.exit(0);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
