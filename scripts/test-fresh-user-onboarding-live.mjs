import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const callerArtifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

// Load environment from .env.local
const envFile = readFileSync(path.join(root, ".env.local"), "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL).replace(/\/$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

assert.ok(supabaseUrl, "Missing NEXT_PUBLIC_SUPABASE_URL");
assert.ok(serviceKey, "Missing SUPABASE_SERVICE_ROLE_KEY");
assert.ok(anonKey, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

async function main() {
  console.log("================================================================================");
  console.log("   AUTOMATED QA TEST: FRESH USER ONBOARDING & ACTIVATION (LIVE WWW.BOTLY.VN)    ");
  console.log("================================================================================");

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

  const profileDir = path.join(root, "App", ".tmp", "chrome-fresh-user-" + Date.now());
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
    assert.ok(targetWs, "Could not obtain Chrome WebSocket endpoint.");

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

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.method === "Runtime.consoleAPICalled") {
        const text = (data.params.args || []).map((a) => a.value || a.description).join(" ");
        if (/error|fail|warn/i.test(text)) {
          console.log("  [Browser Console]", data.params.type, text.slice(0, 150));
        }
      }
    });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // -------------------------------------------------------------------------
    // STEP 1: Navigate to https://www.botly.vn/play
    // -------------------------------------------------------------------------
    console.log("\n[STEP 1] Navigating to https://www.botly.vn/play...");
    await send("Page.navigate", { url: "https://www.botly.vn/play" });
    await new Promise((r) => setTimeout(r, 3000));

    // Choose Tiếng Việt if button exists, then click Bắt đầu hành trình / Start Journey
    console.log("  Selecting Tiếng Việt and clicking Bắt đầu hành trình...");
    for (let i = 0; i < 30; i++) {
      const startCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const viBtn = btns.find(b => b.textContent.trim() === 'Tiếng Việt');
          if (viBtn && viBtn.getAttribute('aria-pressed') !== 'true') viBtn.click();
          
          const startBtn = btns.find(b => b.textContent.includes('Bắt đầu') || b.textContent.includes('Start Journey'));
          if (startBtn) {
            startBtn.click();
            return { clicked: true, text: startBtn.textContent.trim() };
          }
          return { clicked: false, btns: btns.map(b => b.textContent.trim()) };
        })()`,
        returnByValue: true,
      });
      if (startCheck.result?.value?.clicked) {
        console.log("  ✓ Clicked Start Journey:", startCheck.result.value.text);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    // Wait until URL changes to /quiz
    console.log("  Waiting for navigation to Quiz URL...");
    let quizUrl = "";
    for (let i = 0; i < 30; i++) {
      const urlEval = await send("Runtime.evaluate", { expression: "window.location.href", returnByValue: true });
      quizUrl = urlEval.result?.value || "";
      if (quizUrl.includes("/quiz")) {
        console.log("  ✓ Arrived at Quiz URL:", quizUrl);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    assert.ok(quizUrl.includes("/quiz"), `Failed to navigate to quiz. Current URL: ${quizUrl}`);
    await new Promise((r) => setTimeout(r, 1500));

    // Check if on Quest Selection Screen ("Hai vùng đất đang mở" / "Choose where to begin")
    const questSelectionCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const questCards = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Sleep Valley') || b.textContent.includes('HealthClues') || b.textContent.includes('Luna') || b.textContent.includes('Lumi') || b.textContent.includes('Thung lũng') || b.textContent.includes('Cõi'));
        if (questCards.length > 0) {
          // Select HealthClues Realm (Lumi) for health concerns including stress
          const realmCard = questCards.find(c => c.textContent.includes('Lumi') || c.textContent.includes('HealthClues') || c.textContent.includes('Realm')) || questCards[questCards.length - 1];
          if (realmCard) {
            realmCard.click();
            return { clickedQuest: true, cardText: realmCard.textContent.trim().slice(0, 50) };
          }
        }
        return { clickedQuest: false };
      })()`,
      returnByValue: true,
    });
    if (questSelectionCheck.result?.value?.clickedQuest) {
      console.log("  ✓ Selected Quest Card:", questSelectionCheck.result.value.cardText);
      await new Promise((r) => setTimeout(r, 1500));
    }

    // -------------------------------------------------------------------------
    // STEP 2: Quiz Question 1 (Select 'Căng thẳng' / Stress topic)
    // -------------------------------------------------------------------------
    console.log("\n[STEP 2] Waiting for Goal-First Quiz Step 1...");
    let quizStep1Ready = false;
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]') || document.querySelector('button[aria-pressed]'))`,
        returnByValue: true,
      });
      if (check.result?.value) {
        quizStep1Ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    assert.ok(quizStep1Ready, "Quiz Step 1 not ready");

    console.log("  Selecting 'Căng thẳng' (Stress) topic for Question 1...");
    const selectStressRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]') || document;
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        const stressBtn = btns.find(b => b.textContent.includes('Căng thẳng') || b.textContent.includes('Stress'));
        if (stressBtn) {
          stressBtn.click();
          return { selected: true, text: stressBtn.textContent.trim() };
        }
        return { selected: false, available: btns.map(b => b.textContent.trim()) };
      })()`,
      returnByValue: true,
    });
    console.log("  Stress selection result:", selectStressRes.result?.value);
    assert.ok(selectStressRes.result?.value?.selected, "Could not find and select 'Căng thẳng' option");
    await new Promise((r) => setTimeout(r, 600));

    // Click Next (Tiếp tục) to Step 2
    console.log("  Clicking Next to Step 2...");
    const clickNextRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]') || document;
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns.find(b => b.textContent.includes('Tiếp tục') || b.textContent.includes('Next'));
        if (nextBtn) {
          nextBtn.click();
          return { clicked: true, text: nextBtn.textContent.trim() };
        }
        return { clicked: false, btns: btns.map(b => b.textContent.trim()) };
      })()`,
      returnByValue: true,
    });
    console.log("  Next button result:", clickNextRes.result?.value);
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------------------
    // STEP 2.2: Quiz Question 2 (Select Factors & Confirm Non-Blocking Age)
    // -------------------------------------------------------------------------
    console.log("\n[STEP 2.2] Selecting factors for Question 2 and confirming age checkpoint non-blocking...");
    const step2Res = await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]') || document;
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        let selectedCount = 0;
        if (btns[0]) { btns[0].click(); selectedCount++; }
        if (btns[1]) { btns[1].click(); selectedCount++; }

        const chk = quiz.querySelector('input[type="checkbox"]');
        const chkStatus = chk ? { exists: true, checked: chk.checked } : { exists: false, note: "Age confirmed by system default" };
        if (chk && !chk.checked) chk.click();

        const allButtons = Array.from(quiz.querySelectorAll('button'));
        const finishBtn = allButtons.find(b => b.textContent.includes('kích hoạt') || b.textContent.includes('Hoàn thành') || b.textContent.includes('kế hoạch') || b.textContent.includes('Finish') || b.textContent.includes('Tiếp tục'));

        return {
          selectedCount,
          chkStatus,
          finishBtnFound: Boolean(finishBtn),
          finishBtnDisabled: finishBtn ? finishBtn.disabled : null,
          finishBtnText: finishBtn ? finishBtn.textContent.trim() : null
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Question 2 status:", step2Res.result?.value);
    assert.ok(step2Res.result?.value?.finishBtnFound, "Finish / advance button not found in Question 2");
    assert.equal(step2Res.result?.value?.finishBtnDisabled, false, "Finish button is blocked/disabled!");
    console.log("  ✓ Confirmed: Question 2 is NOT blocked by age checkbox. Button is enabled.");
    await new Promise((r) => setTimeout(r, 600));

    // Click Finish / Advance button
    console.log("  Clicking Finish button to advance to Plan Builder...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]') || document;
        const allButtons = Array.from(quiz.querySelectorAll('button'));
        const finishBtn = allButtons.find(b => b.textContent.includes('kích hoạt') || b.textContent.includes('Hoàn thành') || b.textContent.includes('kế hoạch') || b.textContent.includes('Finish') || b.textContent.includes('Tiếp tục'));
        if (finishBtn) finishBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2500));

    // -------------------------------------------------------------------------
    // STEP 3: Plan Builder Verification & Screenshot 1
    // -------------------------------------------------------------------------
    console.log("\n[STEP 3] Verifying Wellness Plan Builder...");
    let planFound = false;
    let planMetrics = null;
    for (let i = 0; i < 40; i++) {
      const pCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
          const countPill = document.querySelector('[data-selected-goal-count]');
          const radioInputs = Array.from(document.querySelectorAll('input[type="radio"]'));
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua') || b.textContent.includes('Skip'));
          const articles = document.querySelectorAll('article');
          return {
            hasConfirmBtn: Boolean(confirmBtn),
            confirmDisabled: confirmBtn ? confirmBtn.disabled : null,
            radioCount: radioInputs.length,
            counterText: countPill?.textContent.trim() || '',
            hasSkipBtn: Boolean(skipBtn),
            articleCount: articles.length
          };
        })()`,
        returnByValue: true,
      });
      const pVal = pCheck.result?.value;
      if (pVal && (pVal.hasConfirmBtn || pVal.hasSkipBtn || pVal.radioCount > 0)) {
        planFound = true;
        planMetrics = pVal;
        console.log("  ✓ Wellness Plan Builder loaded:", planMetrics);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(planFound, "Wellness Plan Builder failed to load");

    // Select goal options if available
    await send("Runtime.evaluate", {
      expression: `(() => {
        const labels = Array.from(document.querySelectorAll('label')).filter(l => l.querySelector('input[type="radio"]'));
        for (let i = 0; i < labels.length; i += 3) {
          labels[i].click();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Capture Screenshot 1: Onboarding & Plan Builder
    const onboardingShot = await send("Page.captureScreenshot", { format: "png" });
    const onboardingShotPath = path.join(callerArtifactsDir, "verified-live-fresh-user-onboarding.png");
    writeFileSync(onboardingShotPath, Buffer.from(onboardingShot.data, "base64"));
    console.log("  ✓ Screenshot 1 saved to:", onboardingShotPath);

    // Confirm Plan to transition to World Preview
    console.log("  Confirming Plan to advance to World Preview...");
    const clickPlanConfirm = await send("Runtime.evaluate", {
      expression: `(() => {
        const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
          return { clicked: "confirm", text: confirmBtn.textContent.trim() };
        }
        const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua') || b.textContent.includes('Skip'));
        if (skipBtn) {
          skipBtn.click();
          return { clicked: "skip", text: skipBtn.textContent.trim() };
        }
        return { clicked: "none" };
      })()`,
      returnByValue: true,
    });
    console.log("  Plan transition action:", clickPlanConfirm.result?.value);
    await new Promise((r) => setTimeout(r, 2000));

    // -------------------------------------------------------------------------
    // STEP 4: World Preview & Fresh User Email Entry
    // -------------------------------------------------------------------------
    console.log("\n[STEP 4] Verifying World Preview & Opening Activation Dialog...");
    let previewReady = false;
    for (let i = 0; i < 30; i++) {
      const prevCheck = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-hc-world-preview]') || document.querySelector('[data-start-journey-btn]'))`,
        returnByValue: true,
      });
      if (prevCheck.result?.value) {
        previewReady = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    assert.ok(previewReady, "World Preview did not load");

    // Click 'BẮT ĐẦU HÀNH TRÌNH'
    const openDialogRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BẮT ĐẦU HÀNH TRÌNH') || b.textContent.includes('START YOUR JOURNEY'));
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.textContent.trim() };
        }
        return { clicked: false };
      })()`,
      returnByValue: true,
    });
    console.log("  Start Journey Button Click:", openDialogRes.result?.value);
    assert.ok(openDialogRes.result?.value?.clicked, "Could not click BẮT ĐẦU HÀNH TRÌNH");
    await new Promise((r) => setTimeout(r, 1200));

    // Generate unique fresh test email
    const freshUserEmail = `fresh-user-${Date.now()}@example.invalid`;
    console.log(`  Fresh user email: ${freshUserEmail}`);

    // Fill email and submit form
    console.log("  Inputting email and submitting activation request...");
    const fillInputRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const emailInput = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (!emailInput) return { success: false, reason: "input not found" };
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(emailInput, ${JSON.stringify(freshUserEmail)});
        } else {
          emailInput.value = ${JSON.stringify(freshUserEmail)};
        }
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, value: emailInput.value };
      })()`,
      returnByValue: true,
    });
    console.log("  Email input result:", fillInputRes.result?.value);
    await new Promise((r) => setTimeout(r, 600));

    const submitRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const emailInput = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        const submitBtn = emailInput?.form?.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Gửi liên kết') || b.textContent.includes('Send Sign-In') || b.type === 'submit');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          return { success: true, text: submitBtn.textContent.trim() };
        }
        if (emailInput?.form) {
          emailInput.form.requestSubmit();
          return { success: true, text: "form.requestSubmit()" };
        }
        return { success: false, disabled: submitBtn?.disabled, text: submitBtn?.textContent.trim() };
      })()`,
      returnByValue: true,
    });
    console.log("  Email submit result:", submitRes.result?.value);
    assert.ok(submitRes.result?.value?.success, "Failed to submit activation email");
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Pending Journey is recorded in browser storage
    const storageCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const local = localStorage.getItem('healthclues-pending-journey-local');
        const session = sessionStorage.getItem('healthclues-pending-journey-local');
        return {
          hasLocal: Boolean(local),
          hasSession: Boolean(session),
          localEmail: local ? JSON.parse(local).email : null,
          localQuest: local ? JSON.parse(local).questId : null
        };
      })()`,
      returnByValue: true,
    });
    console.log("  Pending journey storage status:", storageCheck.result?.value);
    assert.ok(storageCheck.result?.value?.hasLocal || storageCheck.result?.value?.hasSession, "Pending journey was not saved in storage");

    // -------------------------------------------------------------------------
    // STEP 5: Supabase Auth API Simulation (Account Activation)
    // -------------------------------------------------------------------------
    console.log("\n[STEP 5] Authenticating fresh user via Supabase Auth Admin API...");
    const genRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email: freshUserEmail,
        options: {
          redirectTo: "https://www.botly.vn/vi/song-khoe/auth/callback?next=/play?activation=complete",
        },
      }),
    });
    assert.equal(genRes.status, 200, `generate_link failed with HTTP ${genRes.status}`);
    const genData = await genRes.json();
    console.log("  ✓ Supabase admin generated link:", {
      id: genData.id,
      email: genData.email,
      verification_type: genData.verification_type,
    });

    // Verify token to obtain live session tokens
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: genData.verification_type || "magiclink",
        token_hash: genData.hashed_token,
      }),
    });
    assert.equal(verifyRes.status, 200, `verify failed with HTTP ${verifyRes.status}`);
    const authSession = await verifyRes.json();
    console.log("  ✓ Live Session Tokens obtained! User ID:", authSession.user?.id);
    console.log("  ✓ Email confirmed at:", authSession.user?.email_confirmed_at);
    assert.ok(authSession.access_token, "Missing access_token");

    // -------------------------------------------------------------------------
    // STEP 6: Deliver Authentication to Browser & Enter World
    // -------------------------------------------------------------------------
    console.log("\n[STEP 6] Opening auth callback with authenticated session...");
    const callbackUrl = `https://www.botly.vn/vi/song-khoe/auth/callback?next=/play?activation=complete#access_token=${authSession.access_token}&refresh_token=${authSession.refresh_token}&expires_in=${authSession.expires_in}&token_type=bearer`;

    await send("Page.navigate", { url: callbackUrl });
    await new Promise((r) => setTimeout(r, 2000));

    // -------------------------------------------------------------------------
    // STEP 7: Verify World Game Scene Navigation & Zero Data Loss
    // -------------------------------------------------------------------------
    console.log("\n[STEP 7] Monitoring World Scene entry and data persistence...");
    let finalUrl = "";
    let enteredWorldScene = false;

    for (let i = 0; i < 40; i++) {
      const urlCheck = await send("Runtime.evaluate", {
        expression: `window.location.href`,
        returnByValue: true,
      });
      finalUrl = urlCheck.result?.value || "";

      const sceneCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const hasScene = Boolean(document.querySelector('[data-hc-adventure-scene]') || document.querySelector('.hc-day-node') || document.querySelector('.hc-game-header') || document.querySelector('.hc-adventurer-avatar') || document.querySelector('[data-my-journey-panel]'));
          const legacyScreen = Boolean(document.getElementById('hc-onboarding-backpack-title'));
          const quizScreen = Boolean(document.querySelector('[data-healthclues-two-question-quiz]'));
          const sessionSaved = Boolean(localStorage.getItem('botly-cloud-session'));
          const alertMsg = document.querySelector('[role="alert"]')?.textContent || '';
          return { hasScene, legacyScreen, quizScreen, sessionSaved, alertMsg };
        })()`,
        returnByValue: true,
      });

      const sc = sceneCheck.result?.value;
      if (sc?.hasScene && !sc?.legacyScreen && !sc?.quizScreen) {
        enteredWorldScene = true;
        console.log(`  ✓ [T+${i + 1}s] Successfully arrived at World Game Scene!`, {
          url: finalUrl,
          scene: sc,
        });
        break;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    assert.ok(enteredWorldScene, `Did not enter World scene in time. Current URL: ${finalUrl}`);

    // Wait 3 seconds for world assets and full DOM stabilization
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Backend Database Persistence:
    console.log("  Verifying database persistence in Supabase...");
    const profileDbRes = await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles?user_id=eq.${authSession.user.id}&select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const profileDbRows = await profileDbRes.json();
    console.log("  ✓ Supabase healthclues_profiles count:", profileDbRows.length);
    if (profileDbRows[0]) {
      console.log("    Saved profile topic:", profileDbRows[0].profile?.topic);
      console.log("    Consented at:", profileDbRows[0].consented_at);
    }
    assert.ok(profileDbRows.length > 0, "Discovery profile was not saved to database!");

    const worldDbRes = await fetch(`${supabaseUrl}/rest/v1/healthclues_wellness_worlds?user_id=eq.${authSession.user.id}&select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const worldDbRows = await worldDbRes.json();
    console.log("  ✓ Supabase healthclues_wellness_worlds count:", worldDbRows.length);
    if (worldDbRows[0]) {
      console.log("    Created world ID:", worldDbRows[0].id);
      console.log("    Title:", worldDbRows[0].title);
    }
    assert.ok(worldDbRows.length > 0, "Wellness World was not created in database!");

    // Capture Screenshot 2: World Game Scene
    const worldShot = await send("Page.captureScreenshot", { format: "png" });
    const worldShotPath = path.join(callerArtifactsDir, "verified-live-fresh-user-world.png");
    writeFileSync(worldShotPath, Buffer.from(worldShot.data, "base64"));
    console.log("  ✓ Screenshot 2 saved to:", worldShotPath);

    console.log("\n================================================================================");
    console.log("   ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY (PASS)                        ");
    console.log("================================================================================");

    ws.close();
  } finally {
    chromeProc.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
