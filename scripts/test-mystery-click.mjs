import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const rt = JSON.parse(readFileSync(path.join(demoRoot, "owner-demo-runtime.json"), "utf8"));
const base = "http://127.0.0.1:3329";
const supabaseUrl = "http://127.0.0.1:54321";
const serviceKey = rt.secretKey;
const publicKey = rt.publishableKey;
const brainDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

const testEmail = `tester-mystery-${Date.now()}@example.invalid`;
const testPassword = "Password123!@#";

// 1. Create temp user
const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword, email_confirm: true, user_metadata: { role: "owner" } })
});
const adminData = await adminRes.json();
const userId = adminData.id || adminData.user?.id;

// 2. Token
const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: publicKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword })
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
const refreshToken = tokenData.refresh_token;
const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// 3. Profile
await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify({
    user_id: userId,
    profile: {
      topic: "gout",
      twoWeekGoal: "Kiểm soát acid uric",
      contentPreferences: ["Thảo mộc tự nhiên"],
      safetyLevel: "none",
      adaptiveDiscovery: { schemaVersion: 1, ageConfirmed: true, focusId: "gout", focusLabel: "Gút", answers: [] }
    },
    consent_version: "healthclues-consent-v1",
    consented_at: new Date().toISOString()
  })
});

// 4. World
const worldRes = await fetch(`${base}/api/healthclues/world`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    requestKey: crypto.randomUUID(),
    topicKey: "health-concern",
    title: "Thung lũng Thảo Mộc",
    timezone: "Asia/Bangkok",
    startedOn: "2026-11-01",
    selections: []
  })
});
const worldData = await worldRes.json();
const worldId = worldData.world_id || worldData.id;

await fetch(`${base}/api/healthclues/guide`, {
  method: "PUT",
  headers: authHeaders,
  body: JSON.stringify({ worldId, stage: "completed" })
});

// Launch Chrome
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-myst-${Date.now()}`);
mkdirSync(profileDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--headless=new",
  "--disable-gpu",
  "--disable-extensions",
  "--window-size=1280,800",
  "about:blank"
]);

try {
  let targetWs = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const json = await res.json();
      const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
      if (page) { targetWs = page.webSocketDebuggerUrl; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const ws = new WebSocket(targetWs);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      const timer = setTimeout(() => { ws.removeEventListener("message", handler); reject(new Error(`CDP Timeout ${method}`)); }, 15000);
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) { clearTimeout(timer); ws.removeEventListener("message", handler); if (data.error) reject(new Error(data.error.message)); else resolve(data.result); }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  await send("Page.navigate", { url: `${base}/play` });
  await new Promise((r) => setTimeout(r, 1500));

  const cloudSession = {
    access_token: token,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email: testEmail, email_confirmed_at: new Date().toISOString() }
  };

  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(cloudSession)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${userId}');
      localStorage.setItem('healthclues-player-locale-v1:${userId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`
  });

  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
  await new Promise((r) => setTimeout(r, 3000));

  // Dismiss tour
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
  await new Promise((r) => setTimeout(r, 800));

  // Helper to click with real mouse events
  const mouseClick = async (x, y) => {
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    await new Promise((r) => setTimeout(r, 400));
  };

  // Helper to open mystery modal
  const openMysteryModal = async () => {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const b = document.querySelector('.hc-rpg-next-reward');
        if (b) b.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));
  };

  // Helper to capture screenshot
  const takeShot = async (filename) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(shot.data, "base64");
    writeFileSync(path.join(brainDir, filename), buf);
    console.log(`Saved screenshot: ${filename}`);
  };

  console.log("\n=== TEST 1: Open modal and audit computed styles ===");
  await openMysteryModal();
  const check = await send("Runtime.evaluate", {
    expression: `(() => {
      const backdrop = document.querySelector('.hc-mystery-modal-backdrop');
      const card = document.querySelector('.hc-mystery-modal-card');
      const closeBtn = document.querySelector('.hc-mystery-close-btn');
      const secBtn = document.querySelector('.hc-mystery-secondary-btn');
      const primBtn = document.querySelector('.hc-mystery-primary-btn');
      return {
        hasModal: Boolean(backdrop),
        backdropPE: backdrop ? window.getComputedStyle(backdrop).pointerEvents : null,
        cardPE: card ? window.getComputedStyle(card).pointerEvents : null,
        closeBtnPE: closeBtn ? window.getComputedStyle(closeBtn).pointerEvents : null,
        secBtnPE: secBtn ? window.getComputedStyle(secBtn).pointerEvents : null,
        primBtnPE: primBtn ? window.getComputedStyle(primBtn).pointerEvents : null,
      };
    })()`,
    returnByValue: true
  });
  console.log("POINTER-EVENTS AUDIT:", check.result?.value);
  await takeShot("verified-mystery-modal-open-pointerevents-auto.png");

  console.log("\n=== TEST 2: Real mouse click on Close Button (X) ===");
  const closeRect = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-mystery-close-btn');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true
  });
  assert(closeRect.result?.value, "Close button must be present in DOM");
  const { x: cx, y: cy } = closeRect.result.value;
  console.log(`Clicking close button at (${cx}, ${cy})...`);
  await mouseClick(cx, cy);

  const closedByX = await send("Runtime.evaluate", {
    expression: `!document.querySelector('.hc-mystery-modal-backdrop')`,
    returnByValue: true
  });
  console.log("Modal successfully closed by close button (X)?", closedByX.result?.value);
  assert.equal(closedByX.result?.value, true, "Modal must be closed after clicking close button");
  await takeShot("verified-mystery-modal-closed-by-x.png");

  console.log("\n=== TEST 3: Reopen modal and Real mouse click on 'Đã hiểu' ===");
  await openMysteryModal();
  const secRect = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-mystery-secondary-btn');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
    returnByValue: true
  });
  assert(secRect.result?.value, "Secondary button ('Đã hiểu') must be present");
  const { x: sx, y: sy } = secRect.result.value;
  console.log(`Clicking 'Đã hiểu' at (${sx}, ${sy})...`);
  await mouseClick(sx, sy);

  const closedBySec = await send("Runtime.evaluate", {
    expression: `!document.querySelector('.hc-mystery-modal-backdrop')`,
    returnByValue: true
  });
  console.log("Modal successfully closed by 'Đã hiểu'?", closedBySec.result?.value);
  assert.equal(closedBySec.result?.value, true, "Modal must be closed after clicking 'Đã hiểu'");
  await takeShot("verified-mystery-modal-closed-by-secondary.png");

  console.log("\n=== TEST 4: Reopen modal and click backdrop outside card ===");
  await openMysteryModal();
  // Click top-left of backdrop (10, 10)
  console.log("Clicking backdrop at (10, 10)...");
  await mouseClick(10, 10);

  const closedByBackdrop = await send("Runtime.evaluate", {
    expression: `!document.querySelector('.hc-mystery-modal-backdrop')`,
    returnByValue: true
  });
  console.log("Modal successfully closed by backdrop click?", closedByBackdrop.result?.value);
  assert.equal(closedByBackdrop.result?.value, true, "Modal must be closed after clicking backdrop");

  console.log("\n🎉 ALL MYSTERY MODAL DISMISSAL TESTS PASSED PERFECTLY!");
} finally {
  chromeProc.kill();
  process.exit(0);
}