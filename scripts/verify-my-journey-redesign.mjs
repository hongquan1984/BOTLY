import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const base = "http://127.0.0.1:3329";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));

async function createTestAccount(hasPlan = false) {
  const email = `verify-journal-${Date.now()}@example.invalid`;
  const password = `HcTest_${randomUUID()}_Aa9!`;

  // 1. Create auth user
  const adminRes = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { test_only: true, suite: "journal-redesign" },
    }),
  });
  assert.ok(adminRes.ok, `Failed creating user: ${adminRes.status}`);
  const adminData = await adminRes.json();
  const userId = adminData.id || adminData.user?.id;

  // 2. Sign in to get access token
  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(tokenRes.ok, `Failed login: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 3. Save Profile into Supabase
  const profilePayload = {
    topic: "Sleep & rest",
    twoWeekGoal: "Improve evening wind-down routine",
    contentPreferences: ["Reading", "Nature"],
    presentation: "A mix of everything",
    comfortableActivityTime: "15 minutes",
    refreshFrequency: "Weekly",
    safetyLevel: "none",
    specificInterests: ["Falling asleep", "Relaxation"],
    safetyContext: {},
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId: "sleep",
      focusLabel: "Sleep & rest",
      answers: [],
    },
  };

  const profileRes = await fetch(`${runtime.apiUrl}/rest/v1/healthclues_profiles`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      profile: profilePayload,
      consent_version: "healthclues-consent-v1",
      consented_at: new Date().toISOString(),
    }),
  });
  console.log(`Saved Supabase profile for ${userId}: status ${profileRes.status}`);

  // 4. Initialize World
  const worldRes = await fetch(`${base}/api/healthclues/world`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      requestKey: randomUUID(),
      topicKey: "sleep-better",
      title: "Sleep Valley",
      timezone: "Asia/Bangkok",
      startedOn: "2026-11-03",
      selections: [],
    }),
  });
  assert.ok(worldRes.ok, `Failed creating World: ${worldRes.status}`);
  const worldData = await worldRes.json();
  console.log("worldData:", worldData);
  const worldId = worldData.world_id || worldData.world?.id || worldData.id;

  if (hasPlan) {
    // 5. Save Confirmed Wellness Plan with 2 Active Goals + 1 Saved for Later
    const sampleGoals = [
      {
        goalId: "redesign-goal-1",
        templateId: null,
        title: "Tập hít thở 4-7-8 trước khi ngủ",
        category: "relaxation",
        iconKey: "wellness.breathing",
        goalType: "maintain",
        choice: "active",
        frequency: "Daily",
        trackingUnit: "minutes",
        trackingDefinition: "Thực hành hít thở sâu 4-7-8 trong 5 phút khi nằm trên giường",
        targetValue: 5,
        targetUnit: "phút",
        durationDays: 7,
        durationMinutes: 5,
        safetyStatus: "user_created_unreviewed",
        provenance: "user_created",
        sourceVersion: null,
        evidenceStatus: "USER-CREATED · NOT REVIEWED",
        explanation: "Phù hợp với mục tiêu giảm căng thẳng và dễ đi vào giấc ngủ hơn",
        safetyNote: null,
        userSafetyConfirmation: true,
        sources: [],
      },
      {
        goalId: "redesign-goal-2",
        templateId: null,
        title: "Uống trà hoa cúc ấm",
        category: "nutrition",
        iconKey: "herbs.chamomile",
        goalType: "maintain",
        choice: "active",
        frequency: "Daily",
        trackingUnit: "cup",
        trackingDefinition: "Uống 1 tách trà hoa cúc ấm 30 phút trước khi ngủ",
        targetValue: 1,
        targetUnit: "tách",
        durationDays: 14,
        durationMinutes: null,
        safetyStatus: "user_created_unreviewed",
        provenance: "user_created",
        sourceVersion: null,
        evidenceStatus: "USER-CREATED · NOT REVIEWED",
        explanation: "Hoa cúc có tác dụng an thần nhẹ tự nhiên hỗ trợ giấc ngủ ngon",
        safetyNote: null,
        userSafetyConfirmation: true,
        sources: [],
      },
      {
        goalId: "redesign-goal-3",
        templateId: null,
        title: "Tắt điện thoại trước khi ngủ 30 phút",
        category: "sleep",
        iconKey: "lifestyle.screen_off",
        goalType: "reduce",
        choice: "saved",
        frequency: "Flexible",
        trackingUnit: "self-reported",
        trackingDefinition: "Để điện thoại ngoài tầm với và đọc sách nhẹ nhàng",
        targetValue: null,
        targetUnit: null,
        durationDays: null,
        durationMinutes: 30,
        safetyStatus: "user_created_unreviewed",
        provenance: "user_created",
        sourceVersion: null,
        evidenceStatus: "USER-CREATED · NOT REVIEWED",
        explanation: "Ánh sáng xanh gây ức chế sản sinh melatonin tự nhiên",
        safetyNote: null,
        userSafetyConfirmation: true,
        sources: [],
      },
    ];

    const planRes = await fetch(`${base}/api/healthclues/plan`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        worldId,
        requestKey: randomUUID(),
        confirmed: true,
        goals: sampleGoals,
      }),
    });
    if (!planRes.ok) {
      console.error("Plan save error body:", await planRes.text());
    }
    assert.ok(planRes.ok, `Failed saving plan: ${planRes.status}`);

    // Equip 1 herb tool into inventory
    const equipHerbRes = await fetch(`${base}/api/healthclues/world/toolkit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        worldId,
        requestKey: randomUUID(),
        catalogItemId: "hc-demo-ginger",
        itemVersion: 1,
        equipmentPosition: 1,
        discoveryStation: "nutrition",
      }),
    });
    console.log(`Equip herb response status: ${equipHerbRes.status}`);

    const equipPracticeRes = await fetch(`${base}/api/healthclues/world/toolkit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        worldId,
        requestKey: randomUUID(),
        catalogItemId: "hc-demo-walking",
        itemVersion: 1,
        equipmentPosition: 1,
        discoveryStation: "practices",
      }),
    });
    console.log(`Equip practice response status: ${equipPracticeRes.status}`);
  }

  return {
    email,
    password,
    token,
    worldId,
    session: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      user: tokenData.user,
    },
  };
}

async function runBrowserAudit() {
  console.log("=== STEP 1: Creating Seeded Accounts ===");
  const newUser = await createTestAccount(false);
  const activeUser = await createTestAccount(true);
  console.log(`Created New User: ${newUser.email}`);
  console.log(`Created Active User: ${activeUser.email}`);

  // Setup Chrome CDP
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

  const profileDir = path.join(__dirname, `../App/.tmp/chrome-redesign-test-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ]);

  let ws;
  try {
    // Wait for debugger
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find(item => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    assert.ok(targetWs, "Could not connect to Chrome page debugging target");

    ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let idCounter = 0;
    const pending = new Map();
    ws.addEventListener("message", event => {
      const msg = JSON.parse(event.data);
      if (pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    });

    function send(method, params = {}) {
      const id = ++idCounter;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timeout waiting for ${method}`));
        }, 15000);
        pending.set(id, msg => {
          clearTimeout(timer);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || "Evaluation error");
      }
      return res.result?.value;
    }

    async function wait(expr, description = "", timeoutMs = 15000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          const val = await evaluate(expr);
          if (Boolean(val)) return val;
        } catch {}
        const currentUrl = await evaluate("window.location.href");
        const bodySnippet = await evaluate("document.body?.innerText?.slice(0, 150) || ''");
        console.log(`Waiting for [${description}]... url: ${currentUrl} | body: ${bodySnippet.replace(/\n/g, ' ')}`);
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error(`Timeout waiting for: ${description || expr}`);
    }

    async function setViewport(width, height) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768,
      });
      await new Promise(r => setTimeout(r, 200));
    }

    async function captureScreenshot(filename) {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      const outPath = path.join(artifactsDir, filename);
      writeFileSync(outPath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${filename}`);
      return outPath;
    }

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");

    // =====================================================================
    // TEST PART 1: User with Confirmed Plan (2 Active Goals + 1 Saved + Herbs)
    // =====================================================================
    console.log("\n=== TEST PART 1: Testing Confirmed Wayfinder's Quest Journal ===");
    // Inject active session before navigation
    const sessionScript = `try {
      localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(activeUser.session))});
    } catch(e) {}`;
    const { identifier: scriptId1 } = await send("Page.addScriptToEvaluateOnNewDocument", { source: sessionScript });

    console.log("Navigating to Sleep Valley in-game World...");
    await send("Page.navigate", { url: `${base}/en/wellness/healthclues/world?quest=sleep-better` });

    console.log("Waiting for Sleep Valley Scene...");
    await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-region-map]') || document.querySelector('[data-game-ui]') || document.querySelector('.hc-hud-action'))", "Sleep Valley Scene loaded");

    // Skip tutorial if open
    const skipBtn = await evaluate("Boolean(document.querySelector('.hc-tour-link'))");
    if (skipBtn) {
      await evaluate("document.querySelector('.hc-tour-link')?.click()");
      await new Promise(r => setTimeout(r, 500));
    }

    console.log("Opening My Journey via data-my-journey-button...");
    await evaluate("document.querySelector('[data-my-journey-button]')?.click()");
    await wait("Boolean(document.querySelector('[data-my-journey-panel]'))", "My Journey panel opened");

    // Verification 1: Structural sections & data attributes
    const inventorySections = await evaluate(`
      [...document.querySelectorAll('[data-inventory-section]')].map(s => s.getAttribute('data-inventory-section'))
    `);
    console.log("Inventory sections present:", inventorySections);
    assert.deepEqual(inventorySections, ["checklist", "herbs", "practices"], "All 3 inventory sections present in continuous panel");

    // Verification 2: Upper Monthly Journey Map
    console.log("Testing Upper Monthly Journey Map components...");
    const hasMapBanner = await evaluate("Boolean(document.querySelector('.hc-journey-map-banner'))");
    assert.ok(hasMapBanner, "Map banner is present");

    const hasMonthPicker = await evaluate("Boolean(document.querySelector('.hc-month-picker-pill'))");
    assert.ok(hasMonthPicker, "Month picker pill is present");

    const hasLegend = await evaluate("Boolean(document.querySelector('.hc-map-legend-pill'))");
    assert.ok(hasLegend, "Map legend pill is present");

    const hasInfoCard = await evaluate("Boolean(document.querySelector('.hc-journey-info-card'))");
    assert.ok(hasInfoCard, "Journey info card is present");

    const dayNodesCount = await evaluate("document.querySelectorAll('.hc-day-node').length");
    console.log(`Rendered day nodes in month: ${dayNodesCount}`);
    assert.ok(dayNodesCount >= 28 && dayNodesCount <= 31, "Day nodes count matches month days (28-31)");

    const hasSvgTrail = await evaluate("Boolean(document.querySelector('.hc-journey-trail-svg'))");
    assert.ok(hasSvgTrail, "SVG winding trail path is rendered");

    // Click a day node to open popover
    console.log("Testing day node click interaction...");
    await evaluate("document.querySelector('.hc-day-node')?.click()");
    await new Promise(r => setTimeout(r, 200));
    const hasPopover = await evaluate("Boolean(document.querySelector('.hc-day-detail-popover'))");
    assert.ok(hasPopover, "Day detail popover opened on click");

    // Verification 3: Active Goals rendering
    console.log("Testing Active Goals rendering...");
    const goalIds = await evaluate(`
      [...document.querySelectorAll('[data-journey-goal]')].map(el => el.getAttribute('data-journey-goal'))
    `);
    console.log("Rendered goal IDs:", goalIds);
    assert.ok(goalIds.includes("redesign-goal-1"), "Goal 1 is present");
    assert.ok(goalIds.includes("redesign-goal-2"), "Goal 2 is present");
    assert.ok(goalIds.includes("redesign-goal-3"), "Goal 3 (saved) is present");

    // Verification 4: Card Illustration & EXP Badge & Action Box
    const questCardsSummary = await evaluate(`
      [...document.querySelectorAll('[data-journey-goal]')].map(el => ({
        id: el.getAttribute('data-journey-goal'),
        title: el.querySelector('.hc-quest-card-title')?.innerText,
        status: el.querySelector('.hc-journey-status')?.innerText,
        hasIllustrationOrIcon: Boolean(el.querySelector('.hc-goal-3d-img') || el.querySelector('.hc-game-icon')),
        hasExp: Boolean(el.querySelector('.hc-journey-exp-tag')),
        hasActionBox: Boolean(el.querySelector('.hc-goal-action-box')),
        quantities: el.querySelector('.hc-journey-quantities')?.innerText,
      }))
    `);
    console.log("Quest Cards Summary:", JSON.stringify(questCardsSummary, null, 2));
    assert.ok(questCardsSummary[0].hasIllustrationOrIcon, "Quest card has 3D illustration or HealthCluesGameIcon");
    assert.ok(questCardsSummary[0].hasExp, "Quest card has +20 EXP badge");
    assert.ok(questCardsSummary[0].hasActionBox, "Quest card has warm amber action box");

    // Verification 5: Progressive Disclosure (Click to expand details)
    console.log("Testing Progressive Disclosure toggle...");
    const isInitiallyOpen = await evaluate("Boolean(document.querySelector('[data-journey-goal=\"redesign-goal-1\"] .hc-quest-disclosure-content.is-open'))");
    assert.equal(isInitiallyOpen, false, "Details are initially collapsed");

    // Click toggle
    await evaluate("document.querySelector('[data-journey-goal=\"redesign-goal-1\"] .hc-quest-details-toggle')?.click()");
    await new Promise(r => setTimeout(r, 300));

    const isOpenAfterClick = await evaluate("Boolean(document.querySelector('[data-journey-goal=\"redesign-goal-1\"] .hc-quest-disclosure-content.is-open'))");
    assert.equal(isOpenAfterClick, true, "Details expanded upon clicking toggle");

    // Verification 6: Auxiliary Stations (Herbs & Practices)
    console.log("Testing Auxiliary Stations section...");
    const hasHerbStation = await evaluate("Boolean(document.querySelector('[data-inventory-section=\"herbs\"]'))");
    const hasPracticeStation = await evaluate("Boolean(document.querySelector('[data-inventory-section=\"practices\"]'))");
    assert.ok(hasHerbStation, "Herbs station card is present");
    assert.ok(hasPracticeStation, "Practices station card is present");

    // Capture Across 5 Viewports
    console.log("\n--- Capturing Across 5 Viewports ---");
    // 1. Desktop 1440x900 (Top view: Map + Goals)
    await setViewport(1440, 900);
    await captureScreenshot("journey-map-desktop-1440.png");

    // 1b. Desktop 1440x900 (Scrolled view: Active Goals + Auxiliary Stations)
    await evaluate("document.querySelector('.hc-game-modal-body').scrollTop = 420;");
    await new Promise(r => setTimeout(r, 200));
    await captureScreenshot("journey-map-desktop-scrolled.png");
    await evaluate("document.querySelector('.hc-game-modal-body').scrollTop = 0;");
    await new Promise(r => setTimeout(r, 200));

    // 2. Laptop 1280x800
    await setViewport(1280, 800);
    await captureScreenshot("journey-map-laptop-1280.png");

    // 3. Tablet 768x1024
    await setViewport(768, 1024);
    await captureScreenshot("journey-map-tablet-768.png");

    // 4. Mobile 390x844
    await setViewport(390, 844);
    await captureScreenshot("journey-map-mobile-390.png");

    // 5. Mobile Small 360x740
    await setViewport(360, 740);
    await captureScreenshot("journey-map-mobile-360.png");

    // Reset to Desktop
    await setViewport(1440, 900);

    // =====================================================================
    // TEST PART 2: New User with 0 Goals (Warm Onboarding Empty State)
    // =====================================================================
    console.log("\n=== TEST PART 2: Testing New User with 0 Goals ===");
    await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId1 });
    const newSessionScript = `try {
      localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(newUser.session))});
    } catch(e) {}`;
    const { identifier: scriptId2 } = await send("Page.addScriptToEvaluateOnNewDocument", { source: newSessionScript });
    await evaluate(`localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(newUser.session))});`);
    await send("Page.navigate", { url: `${base}/en/wellness/healthclues/world?quest=sleep-better` });
    await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-region-map]') || document.querySelector('[data-game-ui]') || document.querySelector('.hc-hud-action'))", "Sleep Valley Scene reloaded for new user");

    await evaluate("document.querySelector('[data-my-journey-button]')?.click()");
    await wait("Boolean(document.querySelector('[data-my-journey-panel]'))", "New User My Journey opened");

    const newPanelText = await evaluate("document.querySelector('[data-my-journey-panel]')?.innerText || ''");
    console.log("New User My Journey text summary:", newPanelText.slice(0, 300));
    assert.match(newPanelText, /No confirmed Plan yet/i, "Explicit no confirmed plan state");
    assert.match(newPanelText, /Review suggestions without retaking the Quiz/i, "Quiz focus guidance");
    assert.match(newPanelText, /No herbs equipped yet/i, "Herbs empty guidance");
    assert.match(newPanelText, /No practices equipped yet/i, "Practices empty guidance");

    await setViewport(1440, 900);
    await captureScreenshot("journey-map-new-user-desktop.png");
    await setViewport(390, 844);
    await captureScreenshot("journey-map-new-user-mobile.png");

    // Close new user modal before switching
    await evaluate("document.querySelector('.hc-game-modal-header button')?.click()");
    await new Promise(r => setTimeout(r, 400));

    // =====================================================================
    // TEST PART 3: Vietnamese Locale Verification & Screenshots (with Active User)
    // =====================================================================
    console.log("\n=== TEST PART 3: Testing Vietnamese Locale ===");
    // Patch profile preferredLocale on server so it persists properly
    await fetch(`${base}/api/healthclues/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${activeUser.session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        worldId: activeUser.worldId,
        preferredLocale: "vi",
      }),
    });

    await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: scriptId2 });
    const activeUserId = activeUser.session.user.id;
    const activeSessionScriptVi = `try {
      localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(activeUser.session))});
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${activeUserId}');
      localStorage.setItem('healthclues-player-locale-v1:${activeUserId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/';
    } catch(e) {}`;
    const { identifier: scriptId3 } = await send("Page.addScriptToEvaluateOnNewDocument", { source: activeSessionScriptVi });
    await evaluate(`(()=>{
      localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(activeUser.session))});
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${activeUserId}');
      localStorage.setItem('healthclues-player-locale-v1:${activeUserId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/';
    })()`);

    await setViewport(1440, 900);
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=sleep-better` });
    await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-region-map]') || document.querySelector('[data-game-ui]') || document.querySelector('.hc-hud-action'))", "Sleep Valley Scene reloaded in VI");

    console.log("Opening Vietnamese My Journey...");
    await evaluate("document.querySelector('[data-my-journey-button]')?.click()");
    await wait("Boolean(document.querySelector('[data-my-journey-panel]'))", "Vietnamese My Journey opened");

    const viPanelText = await evaluate("document.querySelector('[data-my-journey-panel]')?.innerText || ''");
    console.log("Vietnamese panel text snippet:", viPanelText.slice(0, 250));
    assert.match(viPanelText, /Mục tiêu đang theo đuổi|Hành trình/i, "Vietnamese header present");

    await captureScreenshot("journey-map-vi-desktop.png");
    await setViewport(390, 844);
    await captureScreenshot("journey-map-vi-mobile.png");

    // Close modal before Part 4
    await evaluate("document.querySelector('.hc-game-modal-header button')?.click()");
    await new Promise(r => setTimeout(r, 400));

    // =====================================================================
    // TEST PART 4: Reload Persistence & Smooth Return to World
    // =====================================================================
    console.log("\n=== TEST PART 4: Testing Reload Persistence & Return to World ===");
    await setViewport(1440, 900);
    await send("Page.reload");
    await wait("Boolean(document.querySelector('.hc-region-hud') || document.querySelector('[data-region-map]'))", "World reloaded successfully");

    await evaluate("document.querySelector('[data-my-journey-button]')?.click()");
    await wait("Boolean(document.querySelector('[data-my-journey-panel]'))", "My Journey re-opened after reload");

    const reloadedGoalCount = await evaluate("document.querySelectorAll('[data-journey-goal]').length");
    console.log(`Goals preserved after reload: ${reloadedGoalCount}`);
    assert.equal(reloadedGoalCount, 3, "All 3 goals survived browser reload");

    // Test Smooth Return to World
    console.log("Testing Smooth Return to World via Close button...");
    await evaluate("document.querySelector('.hc-game-modal-header button')?.click()");
    await new Promise(r => setTimeout(r, 400));

    const isPanelClosed = await evaluate("!document.querySelector('[data-my-journey-panel]')");
    assert.equal(isPanelClosed, true, "My Journey closed cleanly");
    const isWorldVisible = await evaluate("Boolean(document.querySelector('.hc-region-scene') || document.querySelector('[data-region-map]') || document.querySelector('.hc-region-hud'))");
    assert.equal(isWorldVisible, true, "World scene remains unobstructed and interactive");

    console.log("\n=== ALL WAYFINDER QUEST JOURNAL ACCEPTANCE TESTS PASSED! ===");
  } finally {
    if (ws) ws.close();
    chromeProc.kill("SIGKILL");
  }
}

runBrowserAudit().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
