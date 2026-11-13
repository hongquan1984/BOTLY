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

const testEmail = `tester-collision-${Date.now()}@example.invalid`;
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
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-vp-${Date.now()}`);
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

  const viewports = [
    { name: "User screenshot Aspect (1024x581)", w: 1024, h: 581 },
    { name: "Desktop 1280x800", w: 1280, h: 800 },
    { name: "Desktop 1366x768", w: 1366, h: 768 },
    { name: "Desktop 1024x768", w: 1024, h: 768 },
    { name: "Small Desktop (900x600)", w: 900, h: 600 },
    { name: "Short Desktop (1280x550)", w: 1280, h: 550 },
    { name: "Very Short (1024x500)", w: 1024, h: 500 },
  ];

  for (const vp of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 800));

    const measurement = await send("Runtime.evaluate", {
      expression: `(() => {
        const lumi = document.querySelector('.hc-rpg-lumi-dialogue');
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        if (!lumi || !dock) return { found: false, hasLumi: Boolean(lumi), hasDock: Boolean(dock) };

        const lr = lumi.getBoundingClientRect();
        const dr = dock.getBoundingClientRect();

        const horizOverlap = (lr.right > dr.left && lr.left < dr.right);
        const vertOverlap = (lr.bottom > dr.top && lr.top < dr.bottom);
        const clearanceY = dr.top - lr.bottom;
        const clearanceX = dr.left - lr.right;

        return {
          found: true,
          horizOverlap,
          vertOverlap,
          collides: horizOverlap && vertOverlap,
          clearanceY: Math.round(clearanceY),
          clearanceX: Math.round(clearanceX),
          lumi: { left: Math.round(lr.left), right: Math.round(lr.right), top: Math.round(lr.top), bottom: Math.round(lr.bottom), w: Math.round(lr.width), h: Math.round(lr.height), zIndex: window.getComputedStyle(lumi).zIndex },
          dock: { left: Math.round(dr.left), right: Math.round(dr.right), top: Math.round(dr.top), bottom: Math.round(dr.bottom), w: Math.round(dr.width), h: Math.round(dr.height), zIndex: window.getComputedStyle(dock).zIndex },
        };
      })()`,
      returnByValue: true
    });

    console.log(`\n=== Viewport: ${vp.name} ===`);
    console.log(measurement.result?.value);

    // Also take a screenshot for 1024x581!
    if (vp.w === 1024 && vp.h === 581) {
      const shot = await send("Page.captureScreenshot", { format: "png" });
      const buf = Buffer.from(shot.data, "base64");
      const outPath = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\debug-1024x581.png";
      writeFileSync(outPath, buf);
      console.log(`Saved screenshot to ${outPath}`);
    }
  }

} finally {
  chromeProc.kill();
  process.exit(0);
}
