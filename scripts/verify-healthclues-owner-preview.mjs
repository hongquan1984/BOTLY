import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewUrl = process.argv[2] || "http://127.0.0.1:3212/play";
const portProbe = net.createServer();
const debugPort = await new Promise((resolve, reject) => {
  portProbe.once("error", reject);
  portProbe.listen(0, "127.0.0.1", () => { const port = portProbe.address().port; portProbe.close(() => resolve(port)); });
});
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
].find(existsSync);
assert.ok(chromePath, "Google Chrome is required for actual browser verification.");

let chrome;
let ws;
let commandId = 0;
const pending = new Map();
const runtimeErrors = [];
const profileDir = path.join(root, "App", ".tmp", `healthclues-preview-chrome-${process.pid}`);
mkdirSync(profileDir, { recursive: false });

async function cdp(method, params = {}) {
  const id = ++commandId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, message => {
      clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  });
}

async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed.");
  return result.result?.value;
}

async function waitForText(text, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`).catch(() => false)) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const state = await evaluate("JSON.stringify({url:location.href,title:document.title,body:document.body.innerText.slice(0,1600)})").catch(error => error.message);
  throw new Error(`Timed out waiting for “${text}”. Browser state: ${state}`);
}

async function clickButton(text) {
  const clicked = await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(item=>item.innerText.trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())})); if(!button||button.disabled)return false;button.click();return true; })()`);
  assert.equal(clicked, true, `Could not click visible button containing: ${text}`);
}

async function capture(name, width, height, mobile) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await new Promise(resolve => setTimeout(resolve, 350));
  const state = await evaluate("JSON.stringify({width:document.documentElement.scrollWidth,viewport:innerWidth,footer:Boolean(document.querySelector('footer')),body:document.body.innerText})");
  const parsed = JSON.parse(state);
  assert.ok(parsed.width <= parsed.viewport + 2, `${name}: no document horizontal overflow (${parsed.width}/${parsed.viewport})`);
  assert.equal(parsed.footer, false, `${name}: no Botly marketing footer`);
  assert.equal(parsed.body.includes("This page could not be found"), false, `${name}: route is not Next not-found`);
  const image = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  const output = path.join(root, "App", "reports", "previews", `${name}.png`);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(image.data, "base64"));
  return output;
}

try {
  chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--no-proxy-server", "--no-sandbox", `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" })).json(); if (target.webSocketDebuggerUrl) break; } catch { /* Chrome is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  assert.ok(target?.webSocketDebuggerUrl, "Chrome DevTools endpoint did not start.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails);
    if (message.id && pending.has(message.id)) { const resolve = pending.get(message.id); pending.delete(message.id); resolve(message); }
  });
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Log.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: previewUrl });
  await waitForText("Your Wellness Adventure Begins Here");
  await waitForText("START ADVENTURE");
  const initial = await evaluate("JSON.stringify({url:location.href,title:document.title,notFound:document.body.innerText.includes('This page could not be found'),shell:document.body.innerText.includes('HEALTHCLUES')})");
  assert.equal(JSON.parse(initial).notFound, false);
  assert.equal(JSON.parse(initial).shell, true);
  const screenshots = [];
  screenshots.push(await capture("healthclues-live-preview-welcome-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-live-preview-welcome-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await clickButton("START ADVENTURE");
  await waitForText("Two adventures are open");
  screenshots.push(await capture("healthclues-live-preview-quest-desktop", 1440, 960, false));
  await clickButton("Sleep Valley");
  await waitForText("Question 1 of 10");
  await waitForText("Are you 18 or older?");
  await clickButton("Yes");
  await clickButton("Next");
  for (let question = 2; question <= 9; question++) {
    await waitForText(`Question ${question} of 10`);
    await clickButton("Skip");
  }
  await waitForText("Question 10 of 10");
  screenshots.push(await capture("healthclues-owner-07c-last-question-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-owner-07c-last-question-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await clickButton("Skip");
  await waitForText("Your adventure is ready!");
  const afterQuiz = JSON.parse(await evaluate("JSON.stringify({url:location.href, scrollY, title:document.querySelector('#hc-discovery-reveal-title')?.innerText || '', body:document.body.innerText, details:document.querySelectorAll('details').length, html:document.body.textContent || ''})"));
  console.log(JSON.stringify({ phase: "post-quiz", url: afterQuiz.url, title: afterQuiz.title, scrollY: afterQuiz.scrollY, legacyDetailsMounted: afterQuiz.details, oldProfileVisible: /YOUR PERSONAL DISCOVERY PROFILE|A starting point shaped around you|Update profile|Clear profile and start again|Your First Discoveries|NEXT\s*[·.]?\s*UNLOCK YOUR TOOLKIT/i.test(afterQuiz.body) }, null, 2));
  screenshots.push(await capture("healthclues-owner-07c-before-reveal-desktop", 1440, 960, false));
  if (afterQuiz.details > 0) {
    await evaluate("(() => { const summary=document.querySelector('details summary'); if (!summary) return false; summary.click(); summary.scrollIntoView({block:'start'}); return true; })()");
    await waitForText("A starting point shaped around you");
    screenshots.push(await capture("healthclues-owner-07c-before-legacy-profile-expanded-desktop", 1440, 960, false));
  }
  assert.match(afterQuiz.title, /Your adventure is ready!/);
  assert.match(afterQuiz.body, /Sleep Valley/);
  assert.doesNotMatch(afterQuiz.body, /YOUR PERSONAL DISCOVERY PROFILE|A starting point shaped around you|Update profile|Clear profile and start again|Your First Discoveries|NEXT\s*[·.]?\s*UNLOCK YOUR TOOLKIT/i, "Legacy profile UI and Toolkit CTA must not appear after the canonical Quiz.");
  assert.equal(afterQuiz.details, 0, "Legacy profile dashboard is not mounted in canonical game onboarding.");
  assert.equal(new URL(afterQuiz.url).searchParams.get("step"), "reveal", "Post-Quiz state is represented by a resumable canonical route state.");
  assert.ok(afterQuiz.scrollY < 8, "Discovery Reveal resets the scroll position below the game navigation.");
  screenshots.push(await capture("healthclues-live-preview-reveal-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-live-preview-reveal-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await cdp("Page.reload", { ignoreCache: true });
  await waitForText("Your adventure is ready!");
  const afterRefresh = JSON.parse(await evaluate("JSON.stringify({url:location.href,details:document.querySelectorAll('details').length,body:document.body.innerText,scrollY})"));
  assert.equal(new URL(afterRefresh.url).searchParams.get("step"), "reveal");
  assert.equal(afterRefresh.details, 0, "Refresh resumes the short Reveal without mounting the old Profile report.");
  assert.doesNotMatch(afterRefresh.body, /YOUR PERSONAL DISCOVERY PROFILE|A starting point shaped around you|Update profile|Clear profile and start again|Your First Discoveries/i);
  screenshots.push(await capture("healthclues-live-preview-reveal-after-refresh-desktop", 1440, 960, false));
  await clickButton("ENTER MY WELLNESS WORLD");
  await waitForText("READ-ONLY PREVIEW");
  const previewState = JSON.parse(await evaluate("JSON.stringify({url:location.href,worlds:document.querySelectorAll('[data-world-canvas=immersive]').length,map:document.querySelector('[aria-label=\"Interactive illustrated world map\"]')?.getBoundingClientRect().toJSON(),scene:document.querySelector('[data-hc-world-preview]')?.getBoundingClientRect().toJSON(),cta:[...document.querySelectorAll('button')].find(button=>button.innerText.includes('START YOUR JOURNEY'))?.getBoundingClientRect().toJSON(),start:document.body.innerText.includes('START YOUR JOURNEY'),registration:document.body.innerText.includes('Create Your Adventure'),scrollY,scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,bodyHeight:document.body.scrollHeight,body:document.body.innerText})"));
  assert.equal(previewState.worlds, 1, "The preview renders exactly one interactive World canvas.");
  assert.ok(previewState.map.width >= 1420, `The interactive map spans the available desktop viewport (${previewState.map.width}px); scene=${JSON.stringify(previewState.scene)}.`);
  assert.ok(previewState.scene.height >= 780, "The World scene fills the available desktop game viewport.");
  assert.equal(previewState.start, true, "World Preview exposes Start Your Journey.");
  assert.equal(previewState.registration, false, "Activation is not shown before the player requests it.");
  assert.ok(previewState.scrollY < 8, "World Preview starts at the top of the game scene.");
  assert.ok(previewState.cta.y >= 0 && previewState.cta.bottom <= 960, "Start Your Journey is visible without page scrolling.");
  assert.ok(previewState.scrollHeight <= 964, `World Preview has no document scrolling (${previewState.scrollHeight}/${previewState.clientHeight}; body ${previewState.bodyHeight}).`);
  assert.doesNotMatch(previewState.body, /Your selected starting trail|Explore the world|Swipe map/i, "Immersive preview has no nested map card, region list or website footer panel.");
  screenshots.push(await capture("healthclues-fullscreen-world-preview-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-fullscreen-world-companion-desktop", 1440, 960, false));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise(resolve => setTimeout(resolve, 400));
  await waitForText("START YOUR JOURNEY");
  const mobileScene = JSON.parse(await evaluate("JSON.stringify({width:document.documentElement.scrollWidth,viewport:innerWidth,scrollHeight:document.documentElement.scrollHeight,height:innerHeight,scene:document.querySelector('[data-hc-world-preview]').getBoundingClientRect().toJSON(),cta:[...document.querySelectorAll('button')].find(button=>button.innerText.includes('START YOUR JOURNEY')).getBoundingClientRect().toJSON(),map:document.querySelector('[aria-label=\"Interactive illustrated world map\"]').getBoundingClientRect().toJSON(),htmlOverflow:getComputedStyle(document.documentElement).overflow,bodyOverflow:getComputedStyle(document.body).overflow})"));
  assert.ok(mobileScene.width <= mobileScene.viewport + 2, "Mobile World has no horizontal overflow.");
  assert.ok(mobileScene.map.width >= mobileScene.viewport - 2 && mobileScene.map.height >= mobileScene.scene.height - 2, "Mobile interactive map fills the complete game scene.");
  assert.equal(mobileScene.htmlOverflow, "hidden", "Mobile World disables document-level scrolling.");
  assert.equal(mobileScene.bodyOverflow, "hidden", "Mobile World disables body scrolling while the map is active.");
  await cdp("Input.dispatchMouseEvent", { type: "mouseWheel", x: 190, y: 360, deltaY: 220, deltaX: 0 });
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.equal(await evaluate("window.scrollY"), 0, "A user wheel gesture cannot scroll the page behind the fullscreen World.");
  assert.ok(mobileScene.cta.bottom <= mobileScene.height - 55, `Mobile Start Your Journey remains above the bottom game navigation (${JSON.stringify(mobileScene.cta)}; viewport=${mobileScene.height}).`);
  screenshots.push(await capture("healthclues-fullscreen-world-preview-mobile", 390, 844, true));
  screenshots.push(await capture("healthclues-fullscreen-world-companion-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await new Promise(resolve => setTimeout(resolve, 350));
  const zoomBefore = await evaluate("document.querySelector('[data-world-canvas=immersive] svg[role=group]').getAttribute('style')");
  assert.equal(await evaluate("Boolean(document.querySelector('.hc-world-controls [aria-label=\"Zoom in\"]'))"), true, "Immersive zoom controls are present above the map.");
  await evaluate("document.querySelector('.hc-world-controls [aria-label=\"Zoom in\"]')?.click()");
  await new Promise(resolve => setTimeout(resolve, 350));
  const zoomAfter = await evaluate("document.querySelector('[data-world-canvas=immersive] svg[role=group]').getAttribute('style')");
  assert.notEqual(zoomAfter, zoomBefore, "Immersive map zoom control changes the actual World camera.");
  const panBefore = zoomAfter;
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: 1000, y: 520, button: "left", buttons: 1, clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1045, y: 520, button: "left", buttons: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: 1045, y: 520, button: "left", buttons: 0, clickCount: 1 });
  await new Promise(resolve => setTimeout(resolve, 200));
  const panAfter = await evaluate("document.querySelector('[data-world-canvas=immersive] svg[role=group]').getAttribute('style')");
  assert.notEqual(panAfter, panBefore, "Dragging the World canvas updates its pan position.");
  await evaluate("(() => { const marker=[...document.querySelectorAll('[data-world-canvas=immersive] g[role=button]')].find(item=>item.getAttribute('aria-label').startsWith('HealthClues Realm:')); if(!marker)return false; marker.dispatchEvent(new MouseEvent('click',{bubbles:true})); return true; })()");
  await waitForText("HealthClues Realm looks lovely.");
  assert.equal(await evaluate("document.querySelectorAll('[data-world-canvas=immersive] g[aria-disabled=true]').length"), 6, "All six future regions remain visible and non-interactive on the map.");
  assert.equal(await evaluate("document.querySelector('[data-hc-world-preview]').innerText.includes('Luna')"), true, "Sleep Valley introduces Luna as its companion.");
  const questAfterInspection = await evaluate("document.querySelector('[data-hc-world-preview]').innerText.includes('Starting trail') && document.querySelector('[data-hc-world-preview]').innerText.includes('Sleep Valley')");
  assert.equal(questAfterInspection, true, "Inspecting another region does not change the selected starting Quest.");
  screenshots.push(await capture("healthclues-fullscreen-world-region-selected-desktop", 1440, 960, false));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  screenshots.push(await capture("healthclues-fullscreen-world-region-selected-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await clickButton("START YOUR JOURNEY");
  await waitForText("Create Your Adventure");
  assert.equal(await evaluate("document.querySelector('[role=dialog]')?.contains(document.activeElement)"), true, "Activation moves keyboard focus inside its modal.");
  assert.equal(await evaluate("document.querySelectorAll('[data-world-canvas=immersive]').length"), 1, "Activation remains an overlay above the same World scene.");
  screenshots.push(await capture("healthclues-fullscreen-world-activation-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-fullscreen-world-activation-mobile", 390, 844, true));
  const sensitiveStorage = await evaluate("JSON.stringify({local: Object.keys(localStorage), session: Object.keys(sessionStorage)})");
  assert.equal(JSON.parse(sensitiveStorage).local.some(key => key.includes("pending-journey")), false, "Pending profile is not stored in localStorage.");
  assert.equal(JSON.parse(sensitiveStorage).session.some(key => key.includes("pending-journey")), false, "Pending profile is not stored in sessionStorage.");
  await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(await evaluate("document.body.innerText.includes('Create Your Adventure')"), false, "Escape closes the activation overlay safely.");
  assert.equal(await evaluate("document.activeElement === [...document.querySelectorAll('button')].find(button=>button.innerText.includes('START YOUR JOURNEY'))"), true, "Closing activation restores focus to Start Your Journey.");
  await clickButton("START YOUR JOURNEY");
  await waitForText("Create Your Adventure");
  screenshots.push(await capture("healthclues-live-preview-activation-desktop", 1440, 960, false));
  screenshots.push(await capture("healthclues-live-preview-activation-mobile", 390, 844, true));
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await clickButton("Close · Return to Preview");
  await waitForText("READ-ONLY PREVIEW");
  assert.equal(await evaluate("document.body.innerText.includes('Create Your Adventure')"), false, "Activation overlay closes back to the World preview.");
  const questIds = ["Sleep Valley", "HealthClues Realm"];
  for (const questName of questIds) {
    await cdp("Page.navigate", { url: `${new URL(previewUrl).origin}/en/wellness/healthclues/quiz?from=play&step=quest&view=profile` });
    await waitForText("Two adventures are open");
    await clickButton(questName);
    await waitForText("Question 1 of 10");
    await clickButton("Yes");
    await clickButton("Next");
    for (let question = 2; question <= 9; question++) { await waitForText(`Question ${question} of 10`); await clickButton("Skip"); }
    await waitForText("Question 10 of 10");
    await clickButton("Skip");
    await waitForText("Your adventure is ready!");
    const branch = JSON.parse(await evaluate("JSON.stringify({url:location.href,quest:document.querySelector('#hc-discovery-reveal-title')?.parentElement?.innerText || document.body.innerText,details:document.querySelectorAll('details').length,body:document.body.innerText})"));
    assert.equal(branch.details, 0, `${questName}: no legacy details component in canonical game entry, even with stale view=profile query.`);
    assert.doesNotMatch(branch.body, /YOUR PERSONAL DISCOVERY PROFILE|A starting point shaped around you|Update profile|Clear profile and start again|Your First Discoveries|NEXT\s*[·.]?\s*UNLOCK YOUR TOOLKIT/i, `${questName}: old profile dashboard is absent.`);
  }
  assert.deepEqual(runtimeErrors, [], `No uncaught browser runtime errors: ${JSON.stringify(runtimeErrors)}`);
  console.log(JSON.stringify({ previewUrl, result: "PASS", initial, postQuizUrl: afterQuiz.url, refreshUrl: afterRefresh.url, selectedQuest: "Sleep Valley", questionLimit: 10, playableDestinationsChecked: questIds.length, comingSoonRegionsChecked: 6, screenshots, runtimeErrors: 0 }, null, 2));
} finally {
  try { ws?.close(); } catch { /* Close owned browser connection. */ }
  if (chrome && chrome.exitCode === null) chrome.kill();
  if (existsSync(profileDir)) {
    const resolvedRoot = path.resolve(root, "App", ".tmp");
    const relative = path.relative(resolvedRoot, path.resolve(profileDir));
    assert.ok(relative.startsWith("healthclues-preview-chrome-"), "Refusing to remove a browser profile outside this run's temporary directory.");
    // Keep the isolated browser profile for post-run diagnostics; it contains no HealthClues account session.
  }
}
