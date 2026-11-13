import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\walkable-verified";
mkdirSync(artifactsDir, { recursive: true });

async function cdpRequest(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMessage);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(msg);
  });
}

async function evalInPage(ws, msgId, expression) {
  const res = await cdpRequest(ws, msgId.id++, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function captureScreenshot(ws, msgId, filePath) {
  const shot = await cdpRequest(ws, msgId.id++, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${filePath}`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("=== STARTING WALKABLE NAVMESH & COMPACT HEADER VERIFICATION ===");

  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  if (!chromePath) {
    throw new Error("Google Chrome executable not found");
  }

  const cdpPort = 9223;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-walkable-profile");

  console.log(`[Chrome] Launching Chrome on debugging port ${cdpPort}...`);
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--window-size=1280,800",
    "about:blank",
  ], { detached: true });

  const cleanup = () => {
    try { chromeProc.kill(); } catch {}
  };
  process.on("exit", cleanup);

  // Wait for remote debugging to open
  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (res.ok) { connected = true; break; }
    } catch {}
  }
  if (!connected) throw new Error("Could not connect to Chrome CDP");

  const targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === "page") || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener("open", resolve));
  console.log("[CDP] Connected to Chrome Page WebSocket.");

  const msgId = { id: 1 };
  await cdpRequest(ws, msgId.id++, "Page.enable");
  await cdpRequest(ws, msgId.id++, "DOM.enable");
  await cdpRequest(ws, msgId.id++, "Runtime.enable");
  await cdpRequest(ws, msgId.id++, "Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // TEST 1: Admin Walkable NavMesh Painter Studio
  console.log("[Test 1] Navigating to http://localhost:3000/admin/healthclues-home...");
  await cdpRequest(ws, msgId.id++, "Page.navigate", { url: "http://localhost:3000/admin/healthclues-home" });
  await sleep(4000);

  // Check header toggle button for painter
  const hasPainterBtn = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-testid="admin-toggle-painter-btn"]'))`);
  console.log("[Test 1] Has '[data-testid=\"admin-toggle-painter-btn\"]':", hasPainterBtn);

  if (hasPainterBtn) {
    // Click painter toggle
    await evalInPage(ws, msgId, `document.querySelector('[data-testid="admin-toggle-painter-btn"]').click()`);
    await sleep(1000);

    // Verify painter toolbar
    const hasToolbar = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-testid="admin-painter-toolbar"]'))`);
    console.log("[Test 1] Has '[data-testid=\"admin-painter-toolbar\"]':", hasToolbar);

    // Click "Mẫu Chuẩn" (auto fill standard preset floor)
    await evalInPage(ws, msgId, `
      const btns = Array.from(document.querySelectorAll('button'));
      const presetBtn = btns.find(b => b.textContent && b.textContent.includes('Mẫu Chuẩn'));
      if (presetBtn) presetBtn.click();
    `);
    await sleep(800);

    // Click "Thử Đi Lại" (walk test)
    await evalInPage(ws, msgId, `
      const btns = Array.from(document.querySelectorAll('button'));
      const walkBtn = btns.find(b => b.textContent && b.textContent.includes('Thử Đi Lại'));
      if (walkBtn) walkBtn.click();
    `);
    console.log("[Test 1] Activated live Chibi movement test mode...");
    await sleep(2500);

    await captureScreenshot(ws, msgId, path.join(artifactsDir, "01_admin_walkable_painter_active.png"));

    // Save mask
    await evalInPage(ws, msgId, `
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent && b.textContent.includes('Lưu Mặt Sàn'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(1500);

    await captureScreenshot(ws, msgId, path.join(artifactsDir, "02_admin_walkable_saved.png"));
  }

  // Setup test account via Supabase for authenticated World access
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const testEmail = `test-walkable-${Date.now()}@example.invalid`;
  const testPassword = `HcTest_${Date.now()}_Aa9!`;

  await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { test_only: true },
    }),
  });

  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const tokenData = await tokenRes.json();
  const session = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
    user: tokenData.user,
  };

  const sessionScript = `try {
    localStorage.setItem('botly-cloud-session', ${JSON.stringify(JSON.stringify(session))});
  } catch(e) {}`;
  await cdpRequest(ws, msgId.id++, "Page.addScriptToEvaluateOnNewDocument", { source: sessionScript });

  // TEST 2: Game /en/wellness/healthclues/world?quest=sleep-better - Compact Journey Header & Chalet Persistence
  console.log("[Test 2] Navigating directly to Sleep Valley in-game World...");
  await cdpRequest(ws, msgId.id++, "Page.navigate", { url: "http://localhost:3000/en/wellness/healthclues/world?quest=sleep-better" });
  await sleep(4000);

  // Click Enter or Start exploring if present
  await evalInPage(ws, msgId, `(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent && (x.textContent.includes('Enter My Wellness World') || x.textContent.includes('START') || x.textContent.includes('ENTER') || x.textContent.includes('Khám phá')));
    if (b) b.click();
  })()`);
  await sleep(2500);

  // Dismiss guide/tour if present
  await evalInPage(ws, msgId, `(() => {
    const skip = Array.from(document.querySelectorAll('button')).find(e => /skip tour|skip|bỏ qua/i.test(e.textContent));
    if (skip) skip.click();
  })()`);
  await sleep(1000);

  // Dismiss tour overlay if present and close Check-in modal
  await evalInPage(ws, msgId, `(() => {
    const skip = Array.from(document.querySelectorAll('button')).find(e => /skip tour|skip|bỏ qua/i.test(e.textContent));
    if (skip) skip.click();
  })()`);
  await sleep(800);

  await evalInPage(ws, msgId, `(() => {
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
    if (cancelBtn) cancelBtn.click();
    const closeBtn = document.querySelector('button[aria-label="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent === '✕' || b.textContent === 'x');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // Open "Hành trình của tôi" modal via dock button
  console.log("[Test 2] Opening My Journey modal...");
  await evalInPage(ws, msgId, `(() => {
    const journeyBtn = document.querySelector('[data-testid="hud-dock-journey-btn"]') ||
      Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.textContent && (b.textContent.includes('Hành trình') || b.textContent.includes('Journey')));
    if (journeyBtn) journeyBtn.click();
  })()`);
  await sleep(2000);

  // Check that My Journey modal is open
  const isJourneyOpen = await evalInPage(ws, msgId, `Boolean(document.querySelector('.hc-game-modal-journey'))`);
  console.log("[Test 2] Journey modal is open:", isJourneyOpen);

  await captureScreenshot(ws, msgId, path.join(artifactsDir, "03_compact_my_journey_modal.png"));

  // Close journey modal
  await evalInPage(ws, msgId, `
    const closeBtn = document.querySelector('.hc-game-modal-journey [data-close-game-modal]');
    if (closeBtn) closeBtn.click();
  `);
  await sleep(1000);

  // Open Swiss Chalet
  console.log("[Test 2] Opening Swiss Chalet Home...");
  await evalInPage(ws, msgId, `
    const homeBtn = document.querySelector('[data-testid="hud-dock-home-btn"]');
    if (homeBtn) homeBtn.click();
  `);
  await sleep(2500);

  // Check if welcome gift modal is open, claim it
  const isWelcomeOpen = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-testid="claim-welcome-btn"]'))`);
  console.log("[Test 2] Welcome gift modal open on first visit:", isWelcomeOpen);
  if (isWelcomeOpen) {
    await evalInPage(ws, msgId, `document.querySelector('[data-testid="claim-welcome-btn"]').click()`);
    await sleep(2000);
  }

  // Verify 2/10 badge is NOT present
  const badgeCheck = await evalInPage(ws, msgId, `(() => {
    const title = document.querySelector('.hc-wellness-home-title');
    return {
      titleText: title ? title.textContent : "",
      hasTwoOutOfTen: title ? title.textContent.includes('2/10') : false,
    };
  })()`);
  console.log("[Test 2] Badge check results:", badgeCheck);

  await captureScreenshot(ws, msgId, path.join(artifactsDir, "04_chalet_home_persisted.png"));

  // Re-enter chalet or switch rooms to confirm welcome modal does NOT pop up again!
  console.log("[Test 2] Testing persistence: reloading Chalet...");
  await evalInPage(ws, msgId, `
    const backBtn = document.querySelector('[data-testid="home-back-button"]');
    if (backBtn) backBtn.click();
  `);
  await sleep(1500);

  await evalInPage(ws, msgId, `
    const homeBtn = document.querySelector('[data-testid="hud-dock-home-btn"]');
    if (homeBtn) homeBtn.click();
  `);
  await sleep(2000);

  const welcomePoppedUpAgain = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-testid="claim-welcome-btn"]'))`);
  console.log("[Test 2] Welcome gift modal popped up again (should be false):", welcomePoppedUpAgain);

  await captureScreenshot(ws, msgId, path.join(artifactsDir, "05_chalet_reentered_no_popup.png"));

  console.log("=== ALL VERIFICATION CHECKS COMPLETED ===");
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
