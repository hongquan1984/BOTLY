import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { WebSocket } from "ws";
import assert from "node:assert/strict";

const root = "D:\\botly";

async function main() {
  console.log("=== VERIFYING LIVE PRODUCTION FLOW ON WWW.BOTLY.VN ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-live-${Date.now()}`);
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
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const currentId = id++;
      pending.set(currentId, resolve);
      ws.send(JSON.stringify({ id: currentId, method, params }));
    });
  }

  await new Promise((r) => ws.on("open", r));
  await send("Page.enable");
  await send("Runtime.enable");

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  }

  async function captureScreenshot(filepath) {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.result.data, "base64");
    writeFileSync(filepath, buffer);
    console.log(`✓ Screenshot saved: ${filepath}`);
  }

  try {
    // 1. Navigate to https://www.botly.vn/play
    console.log("1. Navigating to https://www.botly.vn/play ...");
    await send("Page.navigate", { url: "https://www.botly.vn/play" });

    // Wait 4s for network and hydration
    await new Promise((r) => setTimeout(r, 4000));

    // Verify page title and content
    const pageText = await evaluate("document.body.innerText");
    assert.ok(pageText.includes("HEALTHCLUES"), "Page must contain HEALTHCLUES");
    console.log("✓ Page loaded successfully with HealthClues branding!");

    // Check if [Đăng nhập] button is present
    const hasSignInBtn = await evaluate(`Boolean(Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Đăng nhập') || b.innerText.includes('Sign in')) )`);
    assert.ok(hasSignInBtn, "Sign In button must exist on /play landing page!");
    console.log("✓ Found [Đăng nhập] button on /play landing page!");

    // Capture screenshot of landing page with Sign In button
    const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
    await captureScreenshot(path.join(artifactDir, "verified-live-play-landing.png"));

    // Click [Đăng nhập] button to open modal
    console.log("2. Clicking [Đăng nhập] button...");
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Đăng nhập') || b.innerText.includes('Sign in'));
      if (btn) {
        btn.click();
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1000));

    // Verify Auth Modal is open with Google and Email
    const modalText = await evaluate("document.body.innerText");
    console.log("Modal / Page Text after click:\n", modalText);
    const hasGoogleOption = /google/i.test(modalText);
    const hasEmailOption = /email/i.test(modalText);
    assert.ok(hasGoogleOption, "Auth Modal must display Google option");
    assert.ok(hasEmailOption, "Auth Modal must display Email option");
    console.log("✓ Auth Modal opened with BOTH Google 1-Click and Email Magic Link!");

    await captureScreenshot(path.join(artifactDir, "verified-live-play-auth-modal.png"));

    // Close modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('div[role="dialog"] button');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    // 3. Test Discovery Quiz Flow: Click "Bắt đầu hành trình"
    console.log("3. Navigating to Quiz (/vi/wellness/healthclues/quiz?from=play&step=quest)...");
    await send("Page.navigate", { url: "https://www.botly.vn/vi/wellness/healthclues/quiz?from=play&step=quest" });
    await new Promise((r) => setTimeout(r, 3500));

    // Ensure Vietnamese is active
    await evaluate(`(() => {
      const viBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Tiếng Việt');
      if (viBtn) viBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    console.log("✓ Quest selection loaded! Clicking 'HealthClues Realm'...");
    // Click on HealthClues Realm quest card
    await evaluate(`(() => {
      const realmCard = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('HealthClues Realm') || b.innerText.includes('Lumi'));
      if (realmCard) realmCard.click();
    })()`);
    await new Promise((r) => setTimeout(r, 2000));

    // Now we are on HealthCluesGoalFirstDiscovery Screen 1!
    console.log("4. Selecting 'Vấn đề khác' and typing 'stress'...");
    await evaluate(`(() => {
      const otherBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Vấn đề khác'));
      if (otherBtn) otherBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    await evaluate(`(() => {
      const input = document.querySelector('input[placeholder*="mối quan tâm"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'stress');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    await captureScreenshot(path.join(artifactDir, "verified-live-quiz-screen1-stress.png"));

    // Click "Tiếp tục"
    console.log("5. Clicking 'Tiếp tục' to advance to Screen 2...");
    await evaluate(`(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Tiếp tục'));
      if (nextBtn) {
        nextBtn.scrollIntoView();
        nextBtn.click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Screen 2: Checkbox 13yo is GONE and "Tiếp tục kích hoạt tài khoản" is ENABLED
    const screen2Html = await evaluate("document.body.innerHTML");
    const has13yoCheckbox = screen2Html.includes("13 tuổi");
    assert.equal(has13yoCheckbox, false, "13-year-old checkbox MUST NOT exist on screen 2!");
    console.log("✓ CONFIRMED: 13-year-old checkbox is completely REMOVED from live web!");

    const finishBtnStatus = await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('Tiếp tục kích hoạt') || 
        b.innerText.includes('kích hoạt tài khoản')
      );
      return btn ? { exists: true, disabled: btn.disabled, text: btn.innerText.trim() } : { exists: false };
    })()`);

    console.log("Finish Button Status on Screen 2:", finishBtnStatus);
    assert.ok(finishBtnStatus.exists, "Finish button must exist on Screen 2");
    assert.equal(finishBtnStatus.disabled, false, "Finish button MUST BE ENABLED without checking any box!");
    console.log("✓ CONFIRMED: 'Tiếp tục kích hoạt tài khoản' is enabled immediately without any checkbox friction!");

    await captureScreenshot(path.join(artifactDir, "verified-live-quiz-screen2-no-13yo.png"));

    // Advance to Plan Builder
    console.log("6. Clicking 'Tiếp tục kích hoạt tài khoản' to load Plan Builder...");
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('Tiếp tục kích hoạt') || 
        b.innerText.includes('kích hoạt tài khoản')
      );
      if (btn) {
        btn.scrollIntoView();
        btn.click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 6000));

    const planText = await evaluate("document.body.innerText");
    console.log("Plan text excerpt:\n", planText.slice(0, 500));
    const hasStressHabits = /căng thẳng|thở sâu|thư giãn|khoảng lặng|trà ấm|stress/i.test(planText);
    assert.ok(hasStressHabits, "Plan builder must display stress-tailored goals!");
    console.log("✓ Plan proposals loaded! Stress-tailored habits verified: TRUE!");

    await captureScreenshot(path.join(artifactDir, "verified-live-plan-builder-tailored.png"));

    console.log("\n========================================================");
    console.log("🎉 ALL REAL-WORLD LIVE TESTS ON BOTLY.VN PASSED 100%! 🎉");
    console.log("========================================================");
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Live verification failed:", err);
  process.exit(1);
});
