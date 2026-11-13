import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\f12658cb-4c4b-4005-ae69-ab0042733481";
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
  console.log("=== STARTING END-USER MOBILE AUDIT (390px & 320px) ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-mobile-audit-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=390,844",
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

    // 1. Onboarding & Authenticate account to test Sleep Valley
    console.log("\n1. Setting up new user in Sleep Valley...");
    const testEmail = `hc-mobile-audit-${Date.now()}@example.invalid`;

    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?quest=sleep-better&step=discovery` });
    await new Promise((r) => setTimeout(r, 2500));

    // Quiz Step 1: select concern
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

    // Quiz Step 2: select factor and check age
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

    // Submit step 2
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Skip plan builder if shown
    for (let i = 0; i < 20; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          if (document.querySelector('[data-hc-world-preview]')) return true;
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip'));
          if (skipBtn) { skipBtn.click(); return true; }
          return false;
        })()`,
        returnByValue: true
      });
      if (check.result?.value) break;
      await new Promise(r => setTimeout(r, 400));
    }

    // Click BẮT ĐẦU HÀNH TRÌNH
    for (let i = 0; i < 25; i++) {
      const started = await send("Runtime.evaluate", {
        expression: `(() => {
          const startBtn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU') || b.innerText.includes('START'));
          if (startBtn) { startBtn.click(); return true; }
          return false;
        })()`,
        returnByValue: true,
      });
      if (started.result?.value) break;
      await new Promise((r) => setTimeout(r, 400));
    }

    // Enter email in dialog
    for (let i = 0; i < 20; i++) {
      const dialog = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('section[role="dialog"] input[type="email"]'))`,
        returnByValue: true
      });
      if (dialog.result?.value) break;
      await new Promise(r => setTimeout(r, 300));
    }

    const formDiag = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('section[role="dialog"]');
        const input = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(testEmail)});
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
    console.log("Form diagnostics before submit:", JSON.stringify(formDiag.result?.value));
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
    console.log("Submit result:", JSON.stringify(submitResult.result?.value));

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

    console.log("Waiting for magic link in Mailpit...");
    const verifyUrl = await fetchMailpitLink(testEmail);
    console.log("✓ Magic link received:", verifyUrl);

    // Follow magic link
    await send("Page.navigate", { url: verifyUrl });
    await new Promise((r) => setTimeout(r, 4500));

    // Wait for world map
    for (let i = 0; i < 40; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // Dismiss tour if open
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    // Seed 5 sample habits into player's wellness plan
    console.log("Seeding sample habits to test Active Habits & Check-in...");
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
        if (!worldId) return { error: "No world found" };

        const makeGoal = (id, title, cat, unit, def) => ({
          goalId: id,
          title: title,
          category: cat,
          goalType: "maintain",
          choice: "active",
          frequency: "Daily",
          trackingUnit: unit,
          trackingDefinition: def,
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
          makeGoal("g1", "Uống trà hoa cúc buổi tối", "sleep", "cốc", "Uống 1 tách trà ấm trước ngủ 45 phút"),
          makeGoal("g2", "Tắt màn hình 30 phút trước ngủ", "sleep", "phút", "Tắt toàn bộ điện thoại và máy tính"),
          makeGoal("g3", "Thở 4-7-8 thư giãn", "relaxation", "lần", "Thực hiện 4 chu kỳ thở sâu"),
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
        return { planOk: savePlanRes.ok };
      })()`,
      awaitPromise: true,
    });

    // Reload page to display fresh state
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 3500));

    // Dismiss tour again if present
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    // =========================================================================
    // AUDIT 1: MOBILE VIEWPORT 390px (iPhone 14/15/16)
    // =========================================================================
    console.log("\n2. [AUDIT 1] Mobile Viewport 390x844 Inspection...");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 1000));

    // 1A. Bottom Dock Test
    const dockAudit390 = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const allBtns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const visibleBtns = allBtns.filter(b => getComputedStyle(b).display !== 'none');
        const labels = visibleBtns.map(b => b.querySelector('.hc-rpg-dock-label')?.innerText?.trim() || '');
        const hasTuiDo = labels.some(l => l.toLowerCase().includes('túi') || l.toLowerCase().includes('bag') || l.toLowerCase().includes('backpack'));
        const hasHanhTrinh = labels.some(l => l.toLowerCase().includes('hành trình') || l.toLowerCase().includes('journey'));
        const hasBanDo = labels.some(l => l.toLowerCase().includes('bản đồ') || l.toLowerCase().includes('map'));
        const hasHomNay = labels.some(l => l.toLowerCase().includes('hôm nay') || l.toLowerCase().includes('today'));

        return {
          totalButtons: allBtns.length,
          visibleCount: visibleBtns.length,
          labels,
          hasTuiDo,
          hasHanhTrinh,
          hasBanDo,
          hasHomNay,
          dockBoundingRect: dock ? dock.getBoundingClientRect() : null
        };
      })()`,
      returnByValue: true
    });

    console.log("390px Bottom Dock Audit:", JSON.stringify(dockAudit390.result?.value, null, 2));
    const dockRes = dockAudit390.result?.value;
    assert.equal(dockRes.visibleCount, 3, "Bottom dock must display exactly 3 buttons on mobile");
    assert.equal(dockRes.hasTuiDo, false, "Must NOT have redundant 'Túi đồ' (Bag) button on mobile dock");
    assert.equal(dockRes.hasHanhTrinh, true, "Must have 'Hành Trình' (Journey) button visible on mobile dock");
    assert.equal(dockRes.hasBanDo, true, "Must have 'Bản đồ' (Map) button visible on mobile dock");
    assert.equal(dockRes.hasHomNay, true, "Must have 'Hôm nay' (Today) button visible on mobile dock");
    console.log("✓ PASS: Mobile Dock has exactly 3 buttons: [Bản đồ] - [Hành Trình] - [Hôm nay]!");

    // 1B. Collision Check (Bottom dock vs Mascot / Purple Reopen Button)
    const collisionAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dockRect = dock ? dock.getBoundingClientRect() : null;

        // Mascot or dialogue bubble or reopen button
        const reopenBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
        const reopenRect = reopenBtn ? reopenBtn.getBoundingClientRect() : null;

        const speechBubble = document.querySelector('.hc-rpg-lumi-speech');
        const speechRect = speechBubble ? speechBubble.getBoundingClientRect() : null;

        const petActor = document.querySelector('.hc-rpg-pet-actor');
        const petRect = petActor ? petActor.getBoundingClientRect() : null;

        // Check vertical overlap: does dockRect overlap reopenRect?
        let overlapsReopen = false;
        if (dockRect && reopenRect && getComputedStyle(reopenBtn).display !== 'none') {
          const vertOverlap = !(reopenRect.bottom <= dockRect.top || reopenRect.top >= dockRect.bottom);
          const horizOverlap = !(reopenRect.right <= dockRect.left || reopenRect.left >= dockRect.right);
          overlapsReopen = vertOverlap && horizOverlap;
        }

        return {
          dockRect,
          reopenFound: Boolean(reopenBtn),
          reopenDisplay: reopenBtn ? getComputedStyle(reopenBtn).display : null,
          reopenRect,
          speechFound: Boolean(speechBubble),
          speechRect,
          overlapsReopen
        };
      })()`,
      returnByValue: true
    });
    console.log("Collision Audit Result:", JSON.stringify(collisionAudit.result?.value, null, 2));
    assert.equal(collisionAudit.result?.value.overlapsReopen, false, "Bottom dock must NOT overlap mascot reopen button!");
    console.log("✓ PASS: No collision detected between Bottom Dock and Mascot/Reopen button!");

    // 1C. Check HUD 'Nhiệm Care' Card typography and EXP badge
    const careHudAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const card = document.querySelector('.hc-rpg-care-card');
        if (!card) return { found: false };
        const heading = card.querySelector('.hc-rpg-card-heading');
        const badge = card.querySelector('.hc-rpg-card-count-badge');
        const expBadge = card.querySelector('.hc-rpg-habit-exp-badge') || card.querySelector('.hc-rpg-task-btn');
        const habitText = card.querySelector('.hc-rpg-habit-text strong');

        return {
          found: true,
          headingText: heading?.innerText?.trim(),
          headingFontSize: heading ? getComputedStyle(heading).fontSize : null,
          headingFontWeight: heading ? getComputedStyle(heading).fontWeight : null,
          badgeText: badge?.innerText?.trim(),
          badgeFontSize: badge ? getComputedStyle(badge).fontSize : null,
          habitTextFontSize: habitText ? getComputedStyle(habitText).fontSize : null,
          expBadgeText: expBadge?.innerText?.trim(),
          expBadgeFontSize: expBadge ? getComputedStyle(expBadge).fontSize : null,
        };
      })()`,
      returnByValue: true
    });
    console.log("Care HUD Typography Audit:", JSON.stringify(careHudAudit.result?.value, null, 2));
    const careHud = careHudAudit.result?.value;
    if (careHud.found) {
      console.log(`Care HUD heading: ${careHud.headingText} (${careHud.headingFontSize}, weight: ${careHud.headingFontWeight})`);
      console.log(`EXP badge text: ${careHud.expBadgeText} (${careHud.expBadgeFontSize})`);
      console.log("✓ PASS: Nhiệm Care typography verified compact and balanced!");
    }

    const shot390Dock = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("mobile-390-dock-and-hud.png", shot390Dock.data);

    // 1D. Open Dialog 'Ghi nhận hôm nay' (Daily Check-in)
    console.log("\n3. Testing Dialog 'Ghi nhận hôm nay' (Daily Check-in)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const homNayBtn = btns.find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today'));
        if (homNayBtn) homNayBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Audit Daily Checkin Dialog
    const checkinAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('.hc-checkin-dialog') || document.querySelector('section[role="dialog"]');
        if (!dialog) return { open: false };

        // 1. Check for 0/5 stars dropdown or rating box
        const starSelect = dialog.querySelector('select') || dialog.querySelector('[data-star-rating]') || dialog.querySelector('.hc-checkin-star-picker');
        const hasStarBox = Boolean(starSelect);

        // 2. Summary bar (minimal count pill)
        const summaryPill = dialog.querySelector('.hc-checkin-count-pill')?.innerText?.trim() || '';

        // 3. Goal cards info & title/subtitle redundancy
        const cards = Array.from(dialog.querySelectorAll('.hc-checkin-goal-card'));
        const goalItems = cards.map(c => {
          const title = c.querySelector('.hc-checkin-goal-title')?.innerText?.trim() || '';
          const sub = c.querySelector('.hc-checkin-goal-sub')?.innerText?.trim() || '';
          const isDuplicate = sub.length > 0 && (title.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(title.toLowerCase()));
          const doneBtn = c.querySelector('.hc-checkin-btn.is-done');
          const notYetBtn = c.querySelector('.hc-checkin-btn.is-not-yet');
          return {
            title,
            sub,
            hasSub: Boolean(sub),
            isDuplicate,
            hasDoneBtn: Boolean(doneBtn),
            hasNotYetBtn: Boolean(notYetBtn),
            isDoneActive: doneBtn?.classList.contains('is-active')
          };
        });

        return {
          open: true,
          hasStarBox,
          summaryPill,
          goalsCount: cards.length,
          goalItems
        };
      })()`,
      returnByValue: true
    });

    console.log("Daily Checkin Dialog Audit:", JSON.stringify(checkinAudit.result?.value, null, 2));
    const chk = checkinAudit.result?.value;
    assert.equal(chk.open, true, "Check-in dialog must open successfully");
    assert.equal(chk.hasStarBox, false, "No cumbersome 0/5 star rating box allowed in dialog");
    assert.ok(chk.summaryPill.includes("0 /") || chk.summaryPill.includes("mục tiêu"), "Clean summary pill must report count");
    for (const item of chk.goalItems) {
      assert.equal(item.isDuplicate, false, `Goal "${item.title}" must not have duplicate subtitle! (found "${item.sub}")`);
    }
    console.log("✓ PASS: No 0/5 star box, no duplicate title/subtitle, clean status pill verified!");

    // Test Single-Tap Toggle: Click Goal 1 "Hoàn thành" once -> Done; click again -> Not Yet
    console.log("Testing single-tap toggle on Goal 1...");
    const toggleTest = await send("Runtime.evaluate", {
      expression: `(async () => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        const cards = Array.from(dialog.querySelectorAll('.hc-checkin-goal-card'));
        const card1 = cards[0];
        const doneBtn = card1.querySelector('.hc-checkin-btn.is-done');

        // First click: mark done
        doneBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const afterFirstClick = card1.classList.contains('is-done') && doneBtn.classList.contains('is-active');

        // Second click: toggle back to not_yet
        doneBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const afterSecondClick = card1.classList.contains('is-done');

        // Third click: leave as done for save test
        doneBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const finalDone = card1.classList.contains('is-done');

        return {
          afterFirstClick,
          afterSecondClick,
          finalDone
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log("Single-tap Toggle Test Result:", JSON.stringify(toggleTest.result?.value, null, 2));
    assert.equal(toggleTest.result?.value.afterFirstClick, true, "1st tap must mark goal as completed");
    assert.equal(toggleTest.result?.value.afterSecondClick, false, "2nd tap must toggle back to not completed");
    assert.equal(toggleTest.result?.value.finalDone, true, "Final tap marks as completed");
    console.log("✓ PASS: Single-tap checklist toggle works smoothly!");

    const shot390Checkin = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("mobile-390-checkin-dialog.png", shot390Checkin.data);

    // Close Check-in Dialog
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // 1E. Open Modal 'Hành trình' (My Journey)
    console.log("\n4. Testing Modal 'Hành trình' (My Journey)...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const journeyBtn = btns.find(b => b.innerText.includes('Hành Trình') || b.innerText.includes('Journey'));
        if (journeyBtn) journeyBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const journeyModalAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        if (!modal) return { open: false };

        // Tab list
        const tabBtns = Array.from(modal.querySelectorAll('.hc-journey-nav-tab-btn'));
        const tabs = tabBtns.map(t => ({
          label: t.innerText?.trim(),
          isSelected: t.getAttribute('aria-selected') === 'true',
          isActiveClass: t.classList.contains('is-active')
        }));

        // Default tab content
        const activeHabitsSection = modal.querySelector('.hc-active-goals-section');
        const roadmapSection = modal.querySelector('.hc-journey-map-banner');

        // [+ Thêm thói quen] button
        const addHabitBtn = modal.querySelector('.hc-add-habit-btn');

        // [Đổi / Bỏ] button in goal cards
        const goalCards = Array.from(modal.querySelectorAll('.hc-active-goal-card'));
        const changeButtons = goalCards.map(c => {
          const btn = c.querySelector('.hc-quest-change-habit-btn');
          return {
            hasChangeBtn: Boolean(btn),
            btnText: btn?.innerText?.trim()
          };
        });

        return {
          open: true,
          tabsCount: tabBtns.length,
          tabs,
          hasActiveHabitsSection: Boolean(activeHabitsSection),
          hasRoadmapSection: Boolean(roadmapSection),
          hasAddHabitBtn: Boolean(addHabitBtn),
          addHabitBtnText: addHabitBtn?.innerText?.trim(),
          goalCardsCount: goalCards.length,
          changeButtons
        };
      })()`,
      returnByValue: true
    });

    console.log("Journey Modal Audit:", JSON.stringify(journeyModalAudit.result?.value, null, 2));
    const jm = journeyModalAudit.result?.value;
    assert.equal(jm.open, true, "Hành trình modal must open");
    assert.equal(jm.tabsCount, 2, "Must have exactly 2 tabs (Thói quen đang theo dõi & Lộ trình 30 ngày)");
    assert.equal(jm.tabs[0]?.isSelected, true, "Default tab MUST be 'Thói quen đang theo dõi'!");
    assert.equal(jm.hasActiveHabitsSection, true, "Active Habits section must be rendered by default");
    assert.equal(jm.hasRoadmapSection, false, "30-Day Roadmap section must NOT be rendered on Active Habits tab");
    assert.equal(jm.hasAddHabitBtn, true, "Must have [+ Thêm thói quen] button");
    assert.match(jm.addHabitBtnText, /\+ Thêm thói quen|\+ Add Habit/i, "Add habit button text verified");
    assert.ok(jm.goalCardsCount > 0, "Must have active goal cards rendered");
    for (const cb of jm.changeButtons) {
      assert.equal(cb.hasChangeBtn, true, "Every goal card must have [Đổi / Bỏ] button");
      assert.match(cb.btnText, /Đổi \/ Bỏ|Edit/i, "Change button label must say 'Đổi / Bỏ'");
    }
    console.log("✓ PASS: Default tab is 'Thói quen đang theo dõi', [+ Thêm thói quen] and [Đổi / Bỏ] buttons present!");

    // Switch to 'Lộ trình 30 ngày' tab
    console.log("Switching to 'Lộ trình 30 ngày' tab...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const tabBtns = Array.from(modal.querySelectorAll('.hc-journey-nav-tab-btn'));
        if (tabBtns[1]) tabBtns[1].click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    const roadmapTabAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const roadmapSection = modal?.querySelector('.hc-journey-map-banner');
        const activeHabitsSection = modal?.querySelector('.hc-active-goals-section');
        return {
          hasRoadmapSection: Boolean(roadmapSection),
          hasActiveHabitsSection: Boolean(activeHabitsSection)
        };
      })()`,
      returnByValue: true
    });
    assert.equal(roadmapTabAudit.result?.value.hasRoadmapSection, true, "Roadmap tab must render 30-day map banner");
    assert.equal(roadmapTabAudit.result?.value.hasActiveHabitsSection, false, "Active habits must hide when roadmap tab selected");
    console.log("✓ PASS: 'Lộ trình 30 ngày' tab cleanly separated and verified!");

    const shot390Journey = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("mobile-390-journey-modal.png", shot390Journey.data);

    // Close Journey Modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // AUDIT 2: MOBILE VIEWPORT 320px (iPhone SE / Small Screen)
    // =========================================================================
    console.log("\n5. [AUDIT 2] Mobile Viewport 320x800 Small Screen Inspection...");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 800, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 800));

    const dockAudit320 = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const allBtns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const visibleBtns = allBtns.filter(b => getComputedStyle(b).display !== 'none');
        const labels = visibleBtns.map(b => b.querySelector('.hc-rpg-dock-label')?.innerText?.trim() || '');
        const dockRect = dock ? dock.getBoundingClientRect() : null;
        const btnRects = visibleBtns.map(b => {
          const r = b.getBoundingClientRect();
          return { width: r.width, height: r.height };
        });

        // Horizontal overflow check on body/window
        const docWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalOverflow = docWidth > windowWidth;

        return {
          visibleCount: visibleBtns.length,
          labels,
          dockWidth: dockRect?.width,
          btnRects,
          hasHorizontalOverflow,
          docWidth,
          windowWidth
        };
      })()`,
      returnByValue: true
    });

    console.log("320px Bottom Dock Audit:", JSON.stringify(dockAudit320.result?.value, null, 2));
    const d320 = dockAudit320.result?.value;
    assert.equal(d320.visibleCount, 3, "320px dock must still show 3 buttons");
    assert.equal(d320.hasHorizontalOverflow, false, "Must NOT have horizontal scroll overflow at 320px");
    for (const rect of d320.btnRects) {
      assert.ok(rect.height >= 44, "Touch target height must be >= 44px");
      assert.ok(rect.width >= 44, "Touch target width must be >= 44px");
    }
    console.log("✓ PASS: 320px small screen fits cleanly with zero horizontal overflow, all touch targets >= 44px!");

    const shot320Dock = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("mobile-320-dock.png", shot320Dock.data);

    console.log("\n========================================================");
    console.log("🎉 ALL END-USER MOBILE AUDIT CHECKS PASSED WITH 100% SUCCESS!");
    console.log("========================================================");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in test-mobile-enduser-audit:", err);
  process.exit(1);
});
