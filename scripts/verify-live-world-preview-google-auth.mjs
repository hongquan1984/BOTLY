import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";
import assert from "node:assert/strict";

const root = "D:\\botly";
const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

async function main() {
  console.log("=== FULL END-TO-END LIVE PRODUCTION VERIFICATION ON BOTLY.VN ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-live-full-${Date.now()}`);
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
    // -------------------------------------------------------------
    // STEP 1: Test /play landing screen & Sign-in modal
    // -------------------------------------------------------------
    console.log("\n[STEP 1] Navigating to https://www.botly.vn/play...");
    await send("Page.navigate", { url: "https://www.botly.vn/play" });

    let hasSignInBtn = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 400));
      hasSignInBtn = await evaluate(`
        Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Đăng nhập') || b.innerText.includes('Sign in'))
      `);
      if (hasSignInBtn) break;
    }
    console.log(`Play page has [Đăng nhập] button: ${hasSignInBtn}`);
    assert.ok(hasSignInBtn, "Play page must display the Sign-In button");

    // Click Sign In on /play
    console.log("Opening Sign-In modal on /play...");
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Đăng nhập') || b.innerText.includes('Sign in'));
      if (btn) btn.click();
    `);
    await new Promise((r) => setTimeout(r, 1000));

    const playModalText = await evaluate("document.body.innerText");
    assert.ok(playModalText.includes("Google"), "Play modal must have Google option");
    assert.ok(playModalText.includes("Email") || playModalText.includes("email"), "Play modal must have Email option");
    console.log("✓ /play landing and Sign-In modal verified!");
    await capture("verified-live-play-landing-modal.png");

    // -------------------------------------------------------------
    // STEP 2: Start Journey -> Quest Selection
    // -------------------------------------------------------------
    console.log("\n[STEP 2] Navigating to Quiz (/vi/wellness/healthclues/quiz?from=play&step=quest)...");
    await send("Page.navigate", { url: "https://www.botly.vn/vi/wellness/healthclues/quiz?from=play&step=quest" });
    await new Promise((r) => setTimeout(r, 3500));

    // Ensure Vietnamese
    await evaluate(`
      const viBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Tiếng Việt');
      if (viBtn) viBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    console.log("Selecting 'HealthClues Realm' quest...");
    await evaluate(`
      const realmCard = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HealthClues Realm') || b.innerText.includes('Lumi'));
      if (realmCard) realmCard.click();
    `);
    await new Promise((r) => setTimeout(r, 2000));

    // -------------------------------------------------------------
    // STEP 3: Discovery Screen 1 -> "Vấn đề khác": "stress"
    // -------------------------------------------------------------
    console.log("\n[STEP 3] Screen 1: Choosing 'Vấn đề khác' and typing 'stress'...");
    await evaluate(`
      const otherBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vấn đề khác'));
      if (otherBtn) otherBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 500));

    await evaluate(`
      const input = document.querySelector('input[placeholder*="mối quan tâm"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'stress');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục"
    await evaluate(`
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tiếp tục'));
      if (nextBtn) { nextBtn.scrollIntoView(); nextBtn.click(); }
    `);
    await new Promise((r) => setTimeout(r, 1500));

    // -------------------------------------------------------------
    // STEP 4: Discovery Screen 2 -> No 13yo checkbox, advance to plan
    // -------------------------------------------------------------
    console.log("\n[STEP 4] Screen 2: Verifying no 13yo checkbox and advancing...");
    const screen2Html = await evaluate("document.body.innerHTML");
    assert.equal(screen2Html.includes("13 tuổi"), false, "13-year-old checkbox MUST NOT exist on screen 2");
    console.log("✓ Screen 2 has NO 13yo checkbox!");

    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('Tiếp tục kích hoạt') || b.innerText.includes('kích hoạt tài khoản')
      );
      if (btn) { btn.scrollIntoView(); btn.click(); }
    `);
    await new Promise((r) => setTimeout(r, 6000));

    // -------------------------------------------------------------
    // STEP 5: Plan Builder -> Advance to World Preview Map
    // -------------------------------------------------------------
    console.log("\n[STEP 5] Plan Builder: Advancing to World Preview Map...");
    await evaluate(`(() => {
      const skipBtn = document.querySelector('button[class*="skipBtn"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ qua') || b.innerText.includes('Skip'));
      if (skipBtn) { skipBtn.scrollIntoView(); skipBtn.click(); return; }
      const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
      if (confirmBtn) { confirmBtn.scrollIntoView(); confirmBtn.click(); }
    })()`);
    await new Promise((r) => setTimeout(r, 4500));

    // -------------------------------------------------------------
    // STEP 6: World Preview Map & Modal Authentication Verification
    // -------------------------------------------------------------
    console.log("\n[STEP 6] World Preview Map: Verifying [Đăng nhập] and [BẮT ĐẦU HÀNH TRÌNH]...");
    let mapLoaded = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      mapLoaded = await evaluate(`Boolean(document.querySelector('[data-hc-world-preview]'))`);
      if (mapLoaded) break;
    }
    console.log(`World Preview map loaded: ${mapLoaded}`);
    assert.ok(mapLoaded, "World Preview map must be loaded");

    // Check top status bar has [Đăng nhập] button
    const hasPreviewSignInBtn = await evaluate(`
      Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('Đăng nhập'))
    `);
    console.log(`World Preview map has [Đăng nhập] in status bar: ${hasPreviewSignInBtn}`);
    assert.ok(hasPreviewSignInBtn, "World Preview map must have [Đăng nhập] button in status bar");

    // Click "BẮT ĐẦU HÀNH TRÌNH" button
    console.log("Clicking 'BẮT ĐẦU HÀNH TRÌNH' button...");
    const clickedStart = await evaluate(`(() => {
      const btn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BẮT ĐẦU HÀNH TRÌNH') || b.innerText.includes('START YOUR JOURNEY'));
      if (btn) { btn.click(); return true; } else return false;
    })()`);
    assert.ok(clickedStart, "Must find and click start journey button");
    await new Promise((r) => setTimeout(r, 1500));

    // Inspect the opened modal
    const modalHeading = await evaluate("document.querySelector('#hc-activation-title')?.innerText || ''");
    console.log(`Activation Modal Heading: "${modalHeading}"`);
    assert.ok(modalHeading.includes("Tạo hành trình của bạn") || modalHeading.includes("Create Your Adventure"), "Modal title must match");

    // Verify Google 1-Click Button inside modal
    const googleBtnInfo = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('section[role="dialog"] button'));
      const googleBtn = btns.find(b => b.innerText.includes('Google'));
      if (!googleBtn) return null;
      return {
        text: googleBtn.innerText.trim(),
        hasSvg: Boolean(googleBtn.querySelector('svg')),
        disabled: googleBtn.disabled
      };
    })()`);
    console.log("Google 1-Click Button Info:", JSON.stringify(googleBtnInfo, null, 2));
    assert.ok(googleBtnInfo, "Modal must have Google 1-Click button");
    assert.ok(googleBtnInfo.text.includes("Google"), "Button must have Google text");
    assert.ok(googleBtnInfo.hasSvg, "Button must have Google logo SVG");
    assert.equal(googleBtnInfo.disabled, false, "Google button must be enabled and clickable immediately");

    // Verify Email Form inside modal
    const emailFormInfo = await evaluate(`(() => {
      const emailInput = document.querySelector('section[role="dialog"] input[type="email"]');
      const checkbox = document.querySelector('section[role="dialog"] input[type="checkbox"]');
      const submitBtn = Array.from(document.querySelectorAll('section[role="dialog"] button[type="submit"]'))[0];
      return {
        hasEmailInput: Boolean(emailInput),
        emailPlaceholder: emailInput?.placeholder,
        consentChecked: checkbox?.checked,
        hasSubmitBtn: Boolean(submitBtn),
        submitText: submitBtn?.innerText?.trim()
      };
    })()`);
    console.log("Email Form Info:", JSON.stringify(emailFormInfo, null, 2));
    assert.ok(emailFormInfo.hasEmailInput, "Modal must have email input");
    assert.equal(emailFormInfo.consentChecked, true, "Consent checkbox must be checked by default (zero friction)");
    assert.ok(emailFormInfo.hasSubmitBtn, "Modal must have submit button");

    // Capture screenshot of the modal
    await capture("verified-live-world-preview-google-auth-modal.png");

    console.log("\n========================================================");
    console.log("🎉 ALL REAL-WORLD LIVE TESTS ON BOTLY.VN PASSED 100%! 🎉");
    console.log("========================================================");
  } finally {
    ws.close();
    chromeProc.kill("SIGKILL");
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in verification:", err);
  process.exit(1);
});
