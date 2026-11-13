import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";

const root = "D:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

const env = nextEnv.loadEnvConfig(root).combinedEnv;
const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function main() {
  console.log("=== VERIFYING FULL LIVE WORLD MAP VIEW IN REAL CHROMIUM BROWSER ===");

  const testEmail = `browser-world-map-${Date.now()}@example.invalid`;
  const testPassword = `Pass_${randomUUID()}_!1aA`;

  console.log("1. Creating temporary test user in Supabase Auth...");
  const adminRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { test_only: true }
    })
  });
  assert.ok(adminRes.ok, "Admin user creation must succeed");
  const adminUserData = await adminRes.json();
  const userId = adminUserData.id;

  const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  assert.ok(tokenRes.ok, "Token login must succeed");
  const tokenData = await tokenRes.json();

  const sessionObj = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: userId,
      email: testEmail,
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString()
    }
  };

  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Chrome executable must exist");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-live-world-map-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=1280,850",
  ]);

  let targetWs = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const json = await res.json();
      const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
      if (page) {
        targetWs = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  assert.ok(targetWs, "Chrome debugging websocket must be ready");
  const ws = new WebSocket(targetWs);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.on("message", (raw) => {
    const data = JSON.parse(raw);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  await new Promise((resolve) => ws.once("open", resolve));
  await send("Page.enable");
  await send("Runtime.enable");

  const evaluate = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  };

  const capture = async (filename) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(shot.data, "base64");
    const filePath = path.join(artifactDir, filename);
    writeFileSync(filePath, buffer);
    console.log(`✓ Screenshot saved: ${filePath}`);
    return filePath;
  };

  try {
    console.log("2. Navigating to https://www.botly.vn to establish origin...");
    await send("Page.navigate", { url: "https://www.botly.vn" });
    await new Promise((r) => setTimeout(r, 1500));

    console.log("3. Injecting authenticated session into localStorage...");
    await evaluate(`
      localStorage.setItem("botly-cloud-session", JSON.stringify(${JSON.stringify(sessionObj)}));
    `);

    console.log("4. Navigating to https://www.botly.vn/vi/wellness/healthclues/world...");
    await send("Page.navigate", { url: "https://www.botly.vn/vi/wellness/healthclues/world" });

    // Wait for the button or auto-enter
    let mapLoaded = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 600));

      // If button exists, click it
      await evaluate(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vào ngay') || b.innerText.includes('Enter'));
        if (btn) btn.click();
      `);

      mapLoaded = await evaluate(`
        document.body.innerText.includes("Welcome back") || 
        document.body.innerText.includes("Your active trail") || 
        document.body.innerText.includes("Check in") ||
        document.body.innerText.includes("Map View") ||
        document.body.innerText.includes("Hành trình của bạn")
      `);
      if (mapLoaded) {
        console.log(`[Tick ${i}] Full World Map loaded!`);
        break;
      }
    }

    const hasPinkAlert = await evaluate(`
      document.body.innerText.includes("Account verification is temporarily unavailable")
    `);
    console.log("Has pink alert error:", hasPinkAlert);
    assert.strictEqual(hasPinkAlert, false, "Must not show account verification alert");

    await new Promise((r) => setTimeout(r, 1000));
    await capture("verified-live-world-active-map.png");
    console.log("✓ Active RPG World map screenshot captured!");

  } finally {
    console.log("5. Cleaning up browser and test user...");
    ws.close();
    chromeProc.kill();
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    });
    console.log("Done verification!");
  }
}

main().catch(err => {
  console.error("Browser verification error:", err);
  process.exit(1);
});
