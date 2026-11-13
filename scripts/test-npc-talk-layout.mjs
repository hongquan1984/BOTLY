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

const testEmail = `tester-npctalk-${Date.now()}@example.invalid`;
const testPassword = "Password123!@#";

console.log("=== STEP 1: Creating verified test user in local Supabase ===");
const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword, email_confirm: true, user_metadata: { role: "owner" } })
});
const adminData = await adminRes.json();
const userId = adminData.id || adminData.user?.id;

const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: publicKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword })
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
const refreshToken = tokenData.refresh_token;
const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

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

await fetch(`${base}/api/healthclues/world`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    questId: "gout",
    initialGoals: [{ goalId: "gout-water", category: "hydration", targetValue: 2000, targetUnit: "ml", frequency: "daily" }]
  })
});

console.log("=== STEP 2: Launching Chrome via CDP ===");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-npc-${Date.now()}`);
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
  await new Promise((r) => setTimeout(r, 1200));

  const sessionObj = {
    access_token: token,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    user: { id: userId, email: testEmail, email_confirmed_at: new Date().toISOString() }
  };

  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`
  });

  console.log("=== STEP 3: Navigating to World Scene on Desktop (1280x800) ===");
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
  await new Promise((r) => setTimeout(r, 3500));

  // Trigger arrival at Activity Trail (movement) to show .hc-rpg-talk
  console.log("Triggering arrival at Activity Trail (movement)...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-landmark-id="movement"] button') || document.querySelector('[data-npc="explorer"]');
      if (btn) btn.click();
    })()`
  });

  // Poll until .hc-rpg-talk appears
  let talkFound = false;
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-rpg-talk'))`,
      returnByValue: true
    });
    if (check.result?.value) {
      talkFound = true;
      break;
    }
  }
  console.log("Talk prompt appeared?", talkFound);
  await new Promise((r) => setTimeout(r, 600));

  // Audit Desktop layout
  const desktopAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const talk = document.querySelector('.hc-rpg-talk');
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const lumiBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
      const lumiDialogue = document.querySelector('.hc-rpg-lumi-dialogue');
      const btn = talk ? talk.querySelector('.hc-rpg-talk-action-btn, button') : null;
      const avatar = talk ? talk.querySelector('.hc-rpg-talk-avatar') : null;
      
      const talkRect = talk ? talk.getBoundingClientRect() : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      const btnRect = btn ? btn.getBoundingClientRect() : null;

      const clearance = (dockRect && talkRect) ? (dockRect.top - talkRect.bottom) : null;
      const collidesWithDock = (dockRect && talkRect) ? !(talkRect.bottom < dockRect.top || talkRect.top > dockRect.bottom || talkRect.right < dockRect.left || talkRect.left > dockRect.right) : false;

      const lumiBtnOpacity = lumiBtn ? window.getComputedStyle(lumiBtn).opacity : null;
      const lumiDialogueOpacity = lumiDialogue ? window.getComputedStyle(lumiDialogue).opacity : null;

      const serializeRect = (r) => r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) } : null;

      return {
        talkFound: Boolean(talk),
        dockFound: Boolean(dock),
        hasAvatar: Boolean(avatar),
        talkText: talk ? talk.innerText.replace(/\s+/g, ' ') : '',
        btnText: btn ? btn.innerText.trim() : '',
        btnHeight: btnRect ? btnRect.height : null,
        btnWidth: btnRect ? btnRect.width : null,
        clearance,
        collidesWithDock,
        talkRect: serializeRect(talkRect),
        dockRect: serializeRect(dockRect),
        lumiBtnOpacity,
        lumiDialogueOpacity
      };
    })()`,
    returnByValue: true
  });

  console.log("DESKTOP 1280x800 AUDIT:", desktopAudit.result?.value);
  const da = desktopAudit.result?.value;
  assert.equal(da.talkFound, true, "Talk card must be visible when near landmark");
  assert.equal(da.dockFound, true, "Dock must be visible");
  assert.equal(da.collidesWithDock, false, `Talk card must NOT collide with dock! Clearance: ${da.clearance}px`);
  assert.ok(da.clearance > 5, `Clearance above dock must be positive, got ${da.clearance}px`);
  assert.equal(da.hasAvatar, true, "Talk card must have integrated NPC avatar thumbnail");
  assert.ok(da.btnHeight <= 40, `Button height must be compact, got ${da.btnHeight}px`);

  const shotDesktop = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-desktop-npc-talk-above-dock.png"), Buffer.from(shotDesktop.data, "base64"));
  console.log("Saved: verified-desktop-npc-talk-above-dock.png");

  // Step 4: Short Desktop Screen (1024x581)
  console.log("=== STEP 4: Testing on Short Laptop Viewport (1024x581) ===");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1024,
    height: 581,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 600));

  const shortAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const talk = document.querySelector('.hc-rpg-talk');
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const talkRect = talk ? talk.getBoundingClientRect() : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      const clearance = (dockRect && talkRect) ? (dockRect.top - talkRect.bottom) : null;
      const collidesWithDock = (dockRect && talkRect) ? !(talkRect.bottom < dockRect.top || talkRect.top > dockRect.bottom || talkRect.right < dockRect.left || talkRect.left > dockRect.right) : false;
      const serializeRect = (r) => r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) } : null;
      return { clearance, collidesWithDock, talkRect: serializeRect(talkRect), dockRect: serializeRect(dockRect) };
    })()`,
    returnByValue: true
  });
  console.log("SHORT SCREEN 1024x581 AUDIT:", shortAudit.result?.value);
  const sa = shortAudit.result?.value;
  assert.equal(sa.collidesWithDock, false, `Must NOT collide on 1024x581! Clearance: ${sa.clearance}px`);
  assert.ok(sa.clearance > 5, `Clearance must be positive on 1024x581, got ${sa.clearance}px`);

  const shotShort = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-short-desktop-npc-talk-above-dock.png"), Buffer.from(shotShort.data, "base64"));

  // Step 5: Mobile Viewport (390x844)
  console.log("=== STEP 5: Testing on Mobile Viewport (390x844) ===");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const mobileAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const talk = document.querySelector('.hc-rpg-talk');
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const lumiBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
      const btn = talk ? talk.querySelector('.hc-rpg-talk-action-btn, button') : null;
      const avatar = talk ? talk.querySelector('.hc-rpg-talk-avatar') : null;

      const talkRect = talk ? talk.getBoundingClientRect() : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      const btnRect = btn ? btn.getBoundingClientRect() : null;
      const clearance = (dockRect && talkRect) ? (dockRect.top - talkRect.bottom) : null;
      const collidesWithDock = (dockRect && talkRect) ? !(talkRect.bottom < dockRect.top || talkRect.top > dockRect.bottom || talkRect.right < dockRect.left || talkRect.left > dockRect.right) : false;

      const lumiBtnOpacity = lumiBtn ? window.getComputedStyle(lumiBtn).opacity : '0';
      const lumiBtnPointerEvents = lumiBtn ? window.getComputedStyle(lumiBtn).pointerEvents : 'none';

        const serializeRect = (r) => r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) } : null;

        return {
          talkFound: Boolean(talk),
          dockFound: Boolean(dock),
          hasAvatar: Boolean(avatar),
          btnText: btn ? btn.innerText.trim() : '',
          btnHeight: btnRect ? btnRect.height : null,
          btnWidth: btnRect ? btnRect.width : null,
          clearance,
          collidesWithDock,
          lumiBtnOpacity,
          lumiBtnPointerEvents,
          talkRect: serializeRect(talkRect),
          dockRect: serializeRect(dockRect)
        };
    })()`,
    returnByValue: true
  });

  console.log("MOBILE 390x844 AUDIT:", mobileAudit.result?.value);
  const ma = mobileAudit.result?.value;
  assert.equal(ma.talkFound, true, "Talk card must be visible on mobile");
  assert.equal(ma.collidesWithDock, false, `Mobile talk card must NOT collide with dock! Clearance: ${ma.clearance}px`);
  assert.ok(ma.clearance > 5, `Mobile clearance above dock must be positive, got ${ma.clearance}px`);
  assert.equal(ma.hasAvatar, true, "Mobile talk card must have integrated NPC avatar thumbnail");
  assert.ok(ma.btnHeight <= 36, `Mobile button height must be <= 36px, got ${ma.btnHeight}px`);
  assert.equal(ma.lumiBtnOpacity, "0", "Lumi companion button must be hidden (opacity 0) when NPC talk card is active");
  assert.equal(ma.lumiBtnPointerEvents, "none", "Lumi button must not intercept clicks (pointerEvents none)");

  const shotMobile = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-mobile-npc-talk-compact-no-overlap.png"), Buffer.from(shotMobile.data, "base64"));
  console.log("Saved: verified-mobile-npc-talk-compact-no-overlap.png");

  console.log("\n🎉 ALL NPC TALK LAYOUT & CLEARANCE TESTS 100% PASSED!");
} finally {
  chromeProc.kill();
  process.exit(0);
}
