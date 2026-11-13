import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3235";
const tempRoot = process.env.HEALTHCLUES_CHROME_PROFILE_ROOT || path.join(root, "App", ".tmp");
const profiles = readdirSync(tempRoot).filter(name => /^healthclues-auth-chrome-\d+$/.test(name)).map(name => path.join(tempRoot, name));
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);
assert.ok(chromePath && profiles.length, "Chrome and a retained HealthClues Auth test profile are required.");

async function freePort() {
  const server = net.createServer();
  return new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => resolve(port)); }); });
}
async function inspectProfile(profile) {
  const port = await freePort();
  const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let ws;
  let commandId = 0;
  const pending = new Map();
  const send = (method, params = {}) => {
    const id = ++commandId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 12000);
      pending.set(id, message => { clearTimeout(timer); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); });
    });
  };
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluate failed.");
    return result.result?.value;
  };
  try {
    let target;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch { /* Chrome is starting. */ }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (!target?.webSocketDebuggerUrl) return null;
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
    ws.addEventListener("message", event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const resolve = pending.get(message.id); pending.delete(message.id); resolve(message); } });
    await send("Page.enable"); await send("Runtime.enable");
    await send("Page.navigate", { url: `${base}/play` });
    const deadline = Date.now() + 18000;
    while (Date.now() < deadline) {
      const ready = await evaluate("document.body.innerText.includes('MY WELLNESS WORLD')").catch(() => false);
      if (ready) {
        const result = JSON.parse(await evaluate("(async()=>{const s=JSON.parse(localStorage.getItem('botly-cloud-session')||'null');if(!s?.access_token)return JSON.stringify({id:null});const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();return JSON.stringify({id:p.world?.id||null,url:location.pathname,confirmed:!!s.user?.email_confirmed_at||!!s.user?.confirmed_at})})()"));
        if (result.id) {
          await send("Page.reload", { ignoreCache: true });
          const reloadDeadline = Date.now() + 18000;
          while (Date.now() < reloadDeadline) {
            const same = await evaluate("(async()=>{if(!document.body.innerText.includes('MY WELLNESS WORLD'))return false;const s=JSON.parse(localStorage.getItem('botly-cloud-session')||'{}');const r=await fetch('/api/healthclues/world',{headers:{Authorization:'Bearer '+s.access_token},cache:'no-store'});const p=await r.json();return p.world?.id||false})()").catch(() => false);
            if (same) return { confirmed: result.confirmed, route: result.url, sameIdAfterReload: same === result.id };
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return null;
  } finally {
    try { ws?.close(); } catch { /* close owned CDP socket */ }
    if (chrome.exitCode === null) chrome.kill();
  }
}

for (const profile of profiles) {
  const result = await inspectProfile(profile).catch(() => null);
  if (!result) continue;
  assert.equal(result.confirmed, true, "The retained account remains email-confirmed after service restart.");
  assert.equal(result.route.startsWith("/en/wellness/healthclues/world"), true, "The returning account resumes its World from /play.");
  assert.equal(result.sameIdAfterReload, true, "The same World remains after a browser reload following service restart.");
  console.log(JSON.stringify({ result: "PASS", serviceRestartResume: true, existingConfirmedSession: true, directWorldResume: true, sameWorldAfterReload: true, testedProfile: path.basename(profile), appUrl: `${base}/play` }, null, 2));
  process.exit(0);
}
assert.fail("No retained authenticated browser profile with an existing World could resume after the local Supabase restart.");
