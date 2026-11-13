import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.HEALTHCLUES_OWNER_DEMO_URL || "http://127.0.0.1:3283";
const chromePath = [path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe")].find(existsSync);
assert.ok(chromePath, "Google Chrome is required.");
const profileDir = path.join(root, "App", ".tmp", `healthclues-localization-chrome-${process.pid}-${randomUUID()}`);
const screenshotDir = process.env.HEALTHCLUES_SCREENSHOT_ROOT || path.join(root, "App", "reports", "previews", "healthclues-localization-20261031");
const quizBank = JSON.parse(readFileSync(path.join(root, "src", "data", "healthclues-quiz-bank.json"), "utf8"));
const i18nSource = readFileSync(path.join(root, "src", "lib", "healthclues-i18n.ts"), "utf8");
const questionMap = i18nSource.split("const quizQuestionVi: Record<string, string> = {")[1].split("\n};")[0];
const questionIds = new Set([...questionMap.matchAll(/([A-Z]\d{2}):\s*"/g)].map(match => match[1]));
assert.equal(questionIds.size, quizBank.length, "Every canonical question ID in the bundled Quiz has a Vietnamese question translation.");
const optionMap = i18nSource.split("const quizOptionVi: Record<string, string> = {")[1].split("\n};")[0];
const optionIds = new Set([...optionMap.matchAll(/(?:^|[,\n])\s*(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/g)].map(match => match[1] || match[2]));
const untranslatedOptions = [...new Set(quizBank.flatMap(question => question.options))].filter(option => !optionIds.has(option) && !/^\d+$/.test(option) && option !== "English");
assert.deepEqual(untranslatedOptions, [], "Every bundled Quiz answer option is translated, except locale-independent numerals and the proper language name English.");
mkdirSync(profileDir, { recursive: false });
mkdirSync(screenshotDir, { recursive: true });
const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const port = probe.address().port; probe.close(() => resolve(port)); }); });
const chrome = spawn(chromePath, [`--remote-debugging-port=${debugPort}`, `--user-data-dir=${profileDir}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "about:blank"], { windowsHide: true, stdio: "ignore" });
let ws;
let id = 0;
const pending = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function cdp(method, params = {}) {
  const requestId = ++id;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 45000);
    pending.set(requestId, message => { clearTimeout(timer); if (message.error) reject(new Error(message.error.message)); else resolve(message.result); });
  });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
}
async function waitFor(expression, label, timeout = 30000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { if (await evaluate(expression).catch(() => false)) return; await sleep(200); }
  throw new Error(`Timed out waiting for ${label}: ${await evaluate("location.href+' :: '+document.body.innerText.slice(0,700)").catch(() => "unavailable")}`);
}
async function capture(name) {
  const image = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = path.join(screenshotDir, `${name}.png`);
  await import("node:fs/promises").then(fs => fs.writeFile(file, Buffer.from(image.data, "base64")));
  return file;
}
async function clickButton(expression, label) {
  const ok = await evaluate(expression);
  const buttons = ok ? "" : await evaluate("JSON.stringify([...document.querySelectorAll('button')].map(b=>({text:b.innerText,disabled:b.disabled})).slice(-16))");
  assert.equal(ok, true, `Could not click ${label}; available buttons: ${buttons}`);
}

try {
  const deadline = Date.now() + 15000;
  let targets = [];
  while (Date.now() < deadline) {
    targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then(response => response.json()).catch(() => []);
    if (targets.some(target => target.type === "page")) break;
    await sleep(100);
  }
  const target = targets.find(item => item.type === "page");
  assert.ok(target, "Chrome page target did not start.");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const resolve = pending.get(message.id); pending.delete(message.id); resolve(message); } });
  await cdp("Page.enable"); await cdp("Runtime.enable");
  await cdp("Page.navigate", { url: `${base}/play` });
  await waitFor("!!(document.querySelector('[data-hc-welcome]') || document.querySelector('#hc-welcome-title'))", "HealthClues Welcome");
  assert.equal(await evaluate("document.querySelector('[lang=en][aria-pressed=true]')?.innerText"), "English", "English starts selected by default.");
  const englishWelcome = await capture("english-welcome-desktop");
  await clickButton("(()=>{const b=[...document.querySelectorAll('button[lang=vi]')].find(x=>x.closest('fieldset'));if(!b)return false;b.click();return true})()", "Vietnamese language choice");
  await waitFor("document.body.innerText.includes('Hành trình chăm sóc sức khỏe của bạn bắt đầu từ đây')", "Vietnamese Welcome copy");
  assert.equal(await evaluate("document.documentElement.lang"), "vi", "Vietnamese sets the document language.");
  assert.equal(await evaluate("localStorage.getItem('healthclues-player-locale-v1')"), "vi", "Guest preference is persisted on this device.");
  const vietnameseWelcome = await capture("vietnamese-welcome-desktop");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, "Vietnamese Welcome has no horizontal overflow at 390px.");
  const vietnameseWelcomeMobile = await capture("vietnamese-welcome-mobile");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Bắt đầu hành trình'));if(!b)return false;b.click();return true})()", "Start Journey in Vietnamese");
  await waitFor("!!document.querySelector('[data-healthclues-goal-first]')", "Vietnamese goal-first discovery");
  assert.equal(await evaluate("document.body.innerText.includes('Bạn đang muốn cải thiện điều gì trong cuộc sống của mình?')"), true, "New players see the Vietnamese concern-first prompt, not the long fixed Quiz.");
  const vietnameseDiscovery = await capture("vietnamese-goal-discovery-desktop");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, "Vietnamese goal discovery has no horizontal overflow at 390px.");
  const vietnameseDiscoveryMobile = await capture("vietnamese-goal-discovery-mobile");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  // Returning players retain direct access to the original Quiz bank; this branch is a compatibility regression only.
  await cdp("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz?from=play&step=quest` });
  await waitFor("location.pathname === '/vi/wellness/healthclues/quiz'", "Vietnamese legacy Quiz route");
  await waitFor("document.body.innerText.includes('Hai hành trình đang mở')", "Vietnamese Quiz region selection");
  assert.equal(await evaluate("document.documentElement.lang"), "vi", "Vietnamese locale survives Quiz navigation.");
  const vietnameseQuiz = await capture("vietnamese-quiz-intro-desktop");
  await clickButton("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('HealthClues') && !x.disabled && x.closest('section'));if(!b)return false;b.click();return true})()", "HealthClues Realm selection");
  await waitFor("document.body.innerText.includes('Bạn từ 18 tuổi trở lên phải không?')", "Vietnamese question C01");
  const vietnameseQuestion = await capture("vietnamese-quiz-question-desktop");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, "Vietnamese Quiz has no horizontal overflow at 390px.");
  const mobileLanguageControl = JSON.parse(await evaluate("JSON.stringify((()=>{const b=document.querySelector('header button[lang=vi]'),r=b?.getBoundingClientRect(),s=b&&getComputedStyle(b);return {present:!!b,visible:!!r&&r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none',withinViewport:!!r&&r.left>=0&&r.right<=innerWidth,text:b?.innerText}})())"));
  assert.equal(mobileLanguageControl.visible && mobileLanguageControl.withinViewport, true, `Vietnamese/English switching is reachable in the mobile Quiz header: ${JSON.stringify(mobileLanguageControl)}`);
  const vietnameseQuizMobile = await capture("vietnamese-quiz-question-mobile");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await clickButton("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Có');if(!b)return false;b.click();return true})()", "answer C01=yes");
  await clickButton("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Tiếp tục');if(!b)return false;b.click();return true})()", "continue to C02");
  await waitFor("!!document.querySelector('#healthclues-country')", "question C02");
  const beforeSwitch = JSON.parse(await evaluate("JSON.stringify(JSON.parse(sessionStorage.getItem('healthclues-quiz-draft-v1')))"));
  assert.equal(beforeSwitch.answers.C01, "Yes", "Canonical C01 answer is stored in English ID form.");
  assert.equal(beforeSwitch.onboardingIndex, 1, "The Quiz is on question C02 before locale switching.");
  const c02Desktop = await capture("vietnamese-quiz-c02-desktop");
  await clickButton("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-pressed')==='false' && x.innerText.trim()==='English');if(!b)return false;b.click();return true})()", "switch back to English mid-Quiz");
  await waitFor("location.pathname === '/en/wellness/healthclues/quiz' && !!document.querySelector('#healthclues-country')", "same Quiz position after switching to English");
  const afterSwitch = JSON.parse(await evaluate("JSON.stringify(JSON.parse(sessionStorage.getItem('healthclues-quiz-draft-v1')))"));
  assert.deepEqual(afterSwitch.answers, beforeSwitch.answers, "Switching locale preserves canonical Quiz answers.");
  assert.equal(afterSwitch.onboardingIndex, beforeSwitch.onboardingIndex, "Switching locale preserves the current question position.");
  assert.equal(await evaluate("document.documentElement.lang"), "en", "English locale updates document language.");
  await cdp("Page.reload");
  await waitFor("location.pathname === '/en/wellness/healthclues/quiz' && !!document.querySelector('#healthclues-country')", "English Quiz draft after reload");
  assert.equal(await evaluate("document.querySelector('#healthclues-country') !== null"), true, "The current C02 question survives reload.");
  assert.equal(await evaluate("JSON.parse(sessionStorage.getItem('healthclues-quiz-draft-v1')).answers.C01"), "Yes", "The selected canonical C01 answer survives reload.");
  assert.equal(await evaluate("localStorage.getItem('healthclues-player-locale-v1')"), "en", "Switched preference survives reload.");
  const englishQuiz = await capture("english-quiz-mid-progress-desktop");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, "English Quiz has no horizontal overflow at 390px.");
  const englishQuizMobile = await capture("english-quiz-mobile");
  console.log(JSON.stringify({ result: "PASS", route: "English and Vietnamese share localized concern-first onboarding and keep the original shared Quiz bank available for returning-player compatibility", canonicalAnswerIdsPreserved: true, questionPositionPreserved: true, accountIndependentGuestPreferencePersisted: true, languageDefault: "English", screenshots: { englishWelcome, vietnameseWelcome, vietnameseWelcomeMobile, vietnameseDiscovery, vietnameseDiscoveryMobile, vietnameseQuiz, vietnameseQuestion, vietnameseQuizMobile, c02Desktop, englishQuiz, englishQuizMobile } }, null, 2));
} finally {
  try { ws?.close(); } catch { /* owned browser connection */ }
  if (chrome.exitCode === null) chrome.kill();
}
