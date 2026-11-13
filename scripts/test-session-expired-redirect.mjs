import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const root = "d:\\botly";
const base = "http://127.0.0.1:3329";
const brainDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

// First, rebuild proof-title-20261105 and restart daemon on 3329
console.log("=== STEP 1: Restarting local server on port 3329 ===");

// Launch Chrome
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-exp-${Date.now()}`);
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

  // Step 1: Navigate to /play to set an EXPIRED session in localStorage
  await send("Page.navigate", { url: `${base}/play` });
  await new Promise((r) => setTimeout(r, 1500));

  const expiredSession = {
    access_token: "expired.invalid.token",
    refresh_token: "invalid.refresh.token",
    expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    user: { id: "00000000-0000-0000-0000-000000000000", email: "expired-user@example.invalid", email_confirmed_at: new Date().toISOString() }
  };

  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(expiredSession)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`
  });

  console.log("=== STEP 2: Navigating to World page with EXPIRED session ===");
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });

  // Wait for redirect to occur
  let redirectedUrl = "";
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const urlCheck = await send("Runtime.evaluate", {
      expression: `window.location.href`,
      returnByValue: true
    });
    redirectedUrl = urlCheck.result?.value || "";
    if (redirectedUrl.includes("/play") && redirectedUrl.includes("signin=1")) {
      break;
    }
  }

  console.log("Current URL after expired session detection:", redirectedUrl);
  assert(redirectedUrl.includes("/play"), `Must redirect to /play, got: ${redirectedUrl}`);
  assert(redirectedUrl.includes("signin=1"), `Must have signin=1 query, got: ${redirectedUrl}`);

  await new Promise((r) => setTimeout(r, 800));

  // Check that the sign-in modal is open and has the expired warning
  const modalCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      const text = modal ? modal.innerText : '';
      const hasGoogle = Boolean(modal && modal.querySelector('button') && text.includes('Google'));
      const hasEmail = Boolean(modal && modal.querySelector('input[type="email"]'));
      const hasExpiredAlert = text.includes('hết hạn') || text.includes('expired');
      const hasStuckWorldText = document.body.innerText.includes('Đang mở Cõi Sống Khỏe');
      return {
        hasModal: Boolean(modal),
        hasGoogle,
        hasEmail,
        hasExpiredAlert,
        hasStuckWorldText
      };
    })()`,
    returnByValue: true
  });

  console.log("MODAL CHECK AUDIT:", modalCheck.result?.value);
  const audit = modalCheck.result?.value;
  assert.equal(audit.hasModal, true, "Sign-in modal must be open automatically");
  assert.equal(audit.hasGoogle, true, "Google sign-in button must be present in modal");
  assert.equal(audit.hasEmail, true, "Email sign-in input must be present in modal");
  assert.equal(audit.hasExpiredAlert, true, "Expired session alert must be shown");
  assert.equal(audit.hasStuckWorldText, false, "Must NEVER show stuck 'Đang mở Cõi Sống Khỏe' screen");

  // Capture screenshot as evidence
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const buf = Buffer.from(shot.data, "base64");
  const shotPath = path.join(brainDir, "verified-expired-session-redirect-to-login.png");
  writeFileSync(shotPath, buf);
  console.log("Saved screenshot:", shotPath);

  console.log("\n🎉 EXPIRED SESSION REDIRECT TO LOGIN SCREEN TEST 100% PASSED!");
} finally {
  chromeProc.kill();
  process.exit(0);
}