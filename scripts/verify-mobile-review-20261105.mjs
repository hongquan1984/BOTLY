import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import WebSocket from "ws";

const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3329";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only loopback demo is allowed.");
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe")
].find(existsSync);
assert.ok(chromePath, "Chrome is required.");

const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";
const outDir = path.join(artifactDir, "mobile-review-20261105");
mkdirSync(outDir, { recursive: true });

const profileDir = path.resolve(`App/.tmp/mobile-review-browser-${process.pid}-${randomUUID()}`);
mkdirSync(profileDir, { recursive: true });

const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const p = probe.address().port;
    probe.close(() => resolve(p));
  });
});

const chrome = spawn(chromePath, [
  "--headless=new",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--disable-features=Translate",
  `--user-data-dir=${profileDir}`,
  `--remote-debugging-port=${debugPort}`,
  "about:blank"
], { stdio: "ignore", windowsHide: true });

let ws;
let nextId = 0;
const waiting = new Map();
const apiRequests = [];
const errors = [];

const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => {
    waiting.delete(id);
    reject(new Error(`CDP timeout: ${method}`));
  }, 45000);
  waiting.set(id, value => {
    clearTimeout(timer);
    if (value.error) reject(new Error(value.error.message));
    else resolve(value.result);
  });
  ws.send(JSON.stringify({ id, method, params }));
});

const evaluate = async expression => {
  const value = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (value.exceptionDetails) {
    throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  }
  return value.result?.value;
};

const wait = async (expression, label) => {
  const end = Date.now() + 25000;
  while (Date.now() < end) {
    if (await evaluate(expression)) return;
    await delay(150);
  }
  throw new Error(`Timeout ${label}: ${String(await evaluate("document.body.innerText")).slice(0, 900)}`);
};

const clickText = async (text, exact = false) => {
  const encoded = JSON.stringify(text);
  const done = await evaluate(`(()=>{
    const all = [...document.querySelectorAll('button,label,[role=button]')];
    const clean = x => x.innerText.replace(/[✓✔]/g,'').replace(/\\s+/g,' ').trim();
    const b = all.find(x => ${exact ? `clean(x) === ${encoded}` : `clean(x).includes(${encoded})`});
    if (!b || b.disabled) return false;
    const input = b.querySelector('input[type=checkbox],input[type=radio]');
    if (input) input.click();
    else b.click();
    return true;
  })()`);
  assert.equal(done, true, `Interactive control not available: ${text}`);
};

const clickWorld = async (name) => {
  const encoded = JSON.stringify(name);
  const done = await evaluate(`(()=>{
    const root = document.querySelector('[data-world-selection]');
    const b = [...(root?.querySelectorAll('button[aria-pressed]') || [])].find(x => x.innerText.includes(${encoded}) && !x.disabled);
    if (!b) return false;
    b.click();
    return true;
  })()`);
  assert.equal(done, true, `Playable world card not available: ${name}`);
};

const capture = async (filename, beyondViewport = false) => {
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: beyondViewport });
  const targetPath = path.join(outDir, filename);
  await import("node:fs/promises").then(fs => fs.writeFile(targetPath, Buffer.from(shot.data, "base64")));
  // also copy directly into artifactDir for immediate user-facing inspection
  const directPath = path.join(artifactDir, filename);
  await import("node:fs/promises").then(fs => fs.writeFile(directPath, Buffer.from(shot.data, "base64")));
  console.log(`Saved screenshot: ${filename}`);
  return targetPath;
};

try {
  const end = Date.now() + 10000;
  let version;
  while (Date.now() < end) {
    try {
      version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(version, "Chrome debugging endpoint did not start.");

  let targets = [];
  const targetEnd = Date.now() + 10000;
  while (Date.now() < targetEnd) {
    targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then(r => r.json()).catch(() => []);
    if (targets.some(item => item.type === "page")) break;
    await delay(100);
  }
  const target = targets.find(item => item.type === "page");
  assert.ok(target, "Chrome page target did not start.");

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.on("message", raw => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && waiting.has(msg.id)) {
      waiting.get(msg.id)(msg);
      waiting.delete(msg.id);
    }
    if (msg.method === "Network.requestWillBeSent" && /\/api\//.test(msg.params.request.url)) {
      apiRequests.push(msg.params.request.url);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      errors.push(msg.params.exceptionDetails?.text || "runtime exception");
    }
  });

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");

  console.log(`Navigating to ${base}/play ...`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp("Page.navigate", { url: `${base}/play` });
  await wait("[...document.querySelectorAll('button')].some(b=>b.innerText.includes('Start Journey'))", "welcome");
  await clickText("Start Journey");

  await wait("!!document.querySelector('[data-world-selection]')", "world selection");
  await clickWorld("HealthClues Realm");

  await wait("!!document.querySelector('[data-healthclues-two-question-quiz][data-question-screen=\"1\"]')", "question one");
  await clickText("Gout / high uric acid", true);
  await clickText("Continue", true);

  await wait("!!document.querySelector('[data-healthclues-two-question-quiz][data-question-screen=\"2\"]')", "question two");

  // 1. Verify Breadcrumb has NO duplicate "HEALTHCLUES · HEALTHCLUES"
  const breadcrumb = await evaluate(`document.querySelector('[data-healthclues-two-question-quiz] p')?.innerText || ''`);
  console.log(`Breadcrumb text: "${breadcrumb}"`);
  assert.ok(!breadcrumb.includes("HEALTHCLUES · HEALTHCLUES"), `Breadcrumb must not duplicate HEALTHCLUES: ${breadcrumb}`);
  assert.ok(breadcrumb.includes("HEALTHCLUES REALM"), `Breadcrumb must contain HEALTHCLUES REALM: ${breadcrumb}`);

  // 2. Verify Age confirmation checkbox is UNCHECKED by default
  const isAgeInitiallyChecked = await evaluate(`document.querySelector('[data-healthclues-two-question-quiz] input[type=checkbox]')?.checked`);
  console.log(`Age checkbox initially checked: ${isAgeInitiallyChecked}`);
  assert.equal(isAgeInitiallyChecked, false, "Age confirmation must be unchecked by default.");

  // 3. Verify Continue CTA is disabled when age confirmation is unchecked
  const isContinueInitiallyDisabled = await evaluate(`(()=>{
    const all = [...document.querySelectorAll('[data-healthclues-two-question-quiz] button')];
    const btn = all.find(b => b.innerText.includes('Continue') || b.innerText.includes('Tiếp tục'));
    return Boolean(btn?.disabled);
  })()`);
  console.log(`Continue button initially disabled: ${isContinueInitiallyDisabled}`);
  assert.equal(isContinueInitiallyDisabled, true, "Continue button must be disabled until age confirmation is checked.");

  // Test Quiz Question 2 across the 3 requested viewports: 320x800, 390x844, 430x932
  const viewports = [
    { name: "320x800", width: 320, height: 800 },
    { name: "390x844", width: 390, height: 844 },
    { name: "430x932", width: 430, height: 932 },
  ];

  for (const vp of viewports) {
    console.log(`Testing Quiz Step 2 at viewport ${vp.name}...`);
    await cdp("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 2, mobile: true });
    await delay(300);

    // Measure CTA button width & height, verify no overflow
    const buttonMetrics = await evaluate(`(()=>{
      const all = [...document.querySelectorAll('[data-healthclues-two-question-quiz] button')];
      const back = all.find(b => b.innerText.includes('Back') || b.innerText.includes('Quay lại'));
      const next = all.find(b => b.innerText.includes('Continue') || b.innerText.includes('Tiếp tục'));
      const bRect = back?.getBoundingClientRect();
      const nRect = next?.getBoundingClientRect();
      const docWidth = document.documentElement.clientWidth;
      const nav = document.querySelector('nav');
      const navRect = nav?.getBoundingClientRect();
      return {
        backWidth: bRect?.width,
        nextWidth: nRect?.width,
        nextText: next?.innerText,
        docWidth,
        overflow: nRect ? nRect.right > docWidth + 2 : false,
        navCoveringNext: navRect && nRect ? (navRect.top < nRect.bottom && navRect.bottom > nRect.top) : false
      };
    })()`);
    console.log(`Viewport ${vp.name} Quiz Q2 metrics:`, buttonMetrics);
    assert.equal(buttonMetrics.overflow, false, `CTA button overflowed horizontally at ${vp.name}`);

    // Capture viewport screenshot
    await capture(`quiz-q2-${vp.name}.png`, false);
  }

  // Now select factor options
  for (const label of ["I often eat red meat or organ meats", "I often drink beer or alcohol", "I sometimes drink less than I would like", "Movement is difficult or limited for me"]) {
    await clickText(label, true);
  }

  // Check the age confirmation checkbox
  console.log("Checking age confirmation checkbox...");
  await evaluate(`document.querySelector('[data-healthclues-two-question-quiz] input[type=checkbox]')?.click()`);
  const isAgeNowChecked = await evaluate(`document.querySelector('[data-healthclues-two-question-quiz] input[type=checkbox]')?.checked`);
  assert.equal(isAgeNowChecked, true, "Age checkbox must be checked after user click.");

  const isContinueNowEnabled = await evaluate(`(()=>{
    const all = [...document.querySelectorAll('[data-healthclues-two-question-quiz] button')];
    const btn = all.find(b => b.innerText.includes('Continue') || b.innerText.includes('Tiếp tục'));
    return Boolean(btn && !btn.disabled);
  })()`);
  assert.equal(isContinueNowEnabled, true, "Continue button must be enabled once age is confirmed.");

  // Capture checked state at 390x844
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await capture(`quiz-q2-390x844-confirmed.png`, false);

  // Click continue to World preview (or through plan confirmation)
  console.log("Clicking Continue to account activation...");
  await clickText("Continue to account activation", true);
  
  await wait("!!document.querySelector('[data-hc-world-preview]') || !!document.querySelector('[data-confirm-wellness-plan]') || document.body.innerText.includes('Skip') || document.body.innerText.includes('Your Wellness World preview')", "plan or world preview");

  const needAdvanceFromPlan = await evaluate("!document.querySelector('[data-hc-world-preview]')");
  if (needAdvanceFromPlan) {
    console.log("In WellnessPlanBuilder, advancing to World preview...");
    await delay(1500);
    await evaluate(`(()=>{
      const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
      if (confirmBtn && !confirmBtn.disabled) {
        confirmBtn.click();
        return;
      }
      const all = [...document.querySelectorAll('button')];
      const skipBtn = all.find(b => b.innerText.includes('Skip') || b.innerText.includes('Bỏ qua'));
      if (skipBtn) skipBtn.click();
      else if (confirmBtn) confirmBtn.click();
    })()`);
  }

  await wait("document.body.innerText.includes('Your Wellness World preview') || !!document.querySelector('[data-hc-world-preview]')", "world preview");

  // Verify World preview across 3 viewports: 320x800, 390x844, 430x932
  for (const vp of viewports) {
    console.log(`Testing World preview at viewport ${vp.name}...`);
    await cdp("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 2, mobile: true });
    await delay(400);

    // Measure companion bubble and start journey button positions
    const worldMetrics = await evaluate(`(()=>{
      const startBtn = document.querySelector('[data-start-journey-btn]');
      const companion = document.querySelector('div[class*="companion"]');
      const speech = document.querySelector('div[class*="speech"]');
      const nav = document.querySelector('nav');
      const startRect = startBtn?.getBoundingClientRect();
      const compRect = companion?.getBoundingClientRect();
      const speechRect = speech?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();

      let overlapStart = false;
      if (speechRect && startRect) {
        overlapStart = !(speechRect.right < startRect.left || speechRect.left > startRect.right || speechRect.bottom < startRect.top || speechRect.top > startRect.bottom);
      }
      return {
        startTop: startRect?.top,
        startBottom: startRect?.bottom,
        speechBottom: speechRect?.bottom,
        speechWidth: speechRect?.width,
        overlapStart,
        navHeight: navRect?.height
      };
    })()`);
    console.log(`Viewport ${vp.name} World preview metrics:`, worldMetrics);
    assert.equal(worldMetrics.overlapStart, false, `Companion speech bubble must NOT overlap START button at ${vp.name}`);

    // Capture screenshot with dialogue open
    await capture(`world-preview-${vp.name}-dialogue-open.png`, false);

    // Click close (X) button on companion speech
    console.log(`Minimizing companion dialogue at ${vp.name}...`);
    await evaluate(`document.querySelector('div[class*="speech"] button')?.click()`);
    await delay(300);

    // Verify reopen button is visible and capture
    const reopenVisible = await evaluate(`!!document.querySelector('button[class*="companionReopen"]')`);
    assert.equal(reopenVisible, true, `Companion reopen button must be visible when dialogue is minimized at ${vp.name}`);
    await capture(`world-preview-${vp.name}-dialogue-closed.png`, false);

    // Reopen dialogue for next iteration
    await evaluate(`document.querySelector('button[class*="companionReopen"]')?.click()`);
    await delay(200);
  }

  // Also check horizontal scroll on GameShell nav at 390x844
  console.log("Checking GameShell nav horizontal scrolling & typography...");
  const navMetrics = await evaluate(`(()=>{
    const nav = document.querySelector('nav');
    const links = [...(nav?.querySelectorAll('a') || [])];
    const computed = links.map(l => ({
      text: l.innerText,
      fontSize: window.getComputedStyle(l).fontSize,
      width: l.getBoundingClientRect().width
    }));
    return {
      scrollWidth: nav?.scrollWidth,
      clientWidth: nav?.clientWidth,
      isScrollable: (nav?.scrollWidth || 0) > (nav?.clientWidth || 0),
      links: computed
    };
  })()`);
  console.log("Nav metrics at 390px:", navMetrics);
  assert.ok(navMetrics.isScrollable, "Nav must be scrollable horizontally on mobile");
  assert.ok(parseFloat(navMetrics.links[0]?.fontSize) >= 11, `Nav link font size must be >= 11px (0.7rem): ${navMetrics.links[0]?.fontSize}`);

  // Report API calls
  const adaptiveCalls = apiRequests.filter(url => url.includes("adaptive-discovery"));
  const geminiCalls = apiRequests.filter(url => url.includes("wellness-advisor"));
  console.log(`API requests generated: total=${apiRequests.length}`);
  console.log(`  - Adaptive discovery calls: ${adaptiveCalls.length}`);
  console.log(`  - Wellness advisor (Gemini) calls: ${geminiCalls.length}`);
  assert.equal(adaptiveCalls.length, 0, "The two-screen Quiz must not call adaptive-discovery API");
  assert.deepEqual(errors, []);

  console.log("ALL MOBILE REVIEW CHECKS PASSED SUCCESSFULLY!");
} finally {
  ws?.close();
  chrome.kill();
}
