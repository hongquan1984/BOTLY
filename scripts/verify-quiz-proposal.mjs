import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = "http://127.0.0.1:3329";

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
}

async function findOpenPort(start = 9530) {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(start, "127.0.0.1", () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
    s.on("error", () => resolve(findOpenPort(start + 1)));
  });
}

async function main() {
  console.log("=== VERIFYING POST-QUIZ PLAN PROPOSAL UX ON MOBILE (390px) ===");

  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome is required.");

  const cdpPort = await findOpenPort();
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${cdpPort}`,
    "about:blank"
  ]);

  try {
    // Wait for Chrome CDP port
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
        if (res.ok) break;
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }

    const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json();
    const pageTarget = targets.find(t => t.type === "page");
    assert.ok(pageTarget, "No page target found");

    const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => pageWs.onopen = r);
    let pId = 1;
    const pagePending = new Map();
    pageWs.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pagePending.has(msg.id)) {
        const { resolve, reject } = pagePending.get(msg.id);
        pagePending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    function cdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = pId++;
        pagePending.set(reqId, { resolve, reject });
        pageWs.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await cdp("Page.enable");
    await cdp("DOM.enable");
    await cdp("Runtime.enable");

    // Set mobile viewport 390x844
    await cdp("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    console.log("Navigating to Quiz:", `${base}/vi/wellness/healthclues/quiz`);
    await cdp("Page.navigate", { url: `${base}/vi/wellness/healthclues/quiz` });
    await new Promise(r => setTimeout(r, 2000));

    async function evalCode(expression) {
      const res = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result?.value;
    }

    console.log("1. Clicking 'Bắt đầu hành trình'...");
    const clickedBegin = await evalCode(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bắt đầu hành trình') || b.innerText.includes('Begin My Adventure'));
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    console.log("Clicked begin button:", clickedBegin);
    await new Promise(r => setTimeout(r, 1200));

    console.log("2. Selecting Quest (Sleep Valley)...");
    const chosenQuest = await evalCode(`(() => {
      const questBtn = document.querySelector('[data-world-selection] button, button[class*="questCard"]');
      if (questBtn) { questBtn.click(); return true; }
      return false;
    })()`);
    console.log("Selected quest:", chosenQuest);
    await new Promise(r => setTimeout(r, 1200));

    console.log("3. Stepping through onboarding questions...");
    for (let step = 0; step < 20; step++) {
      const current = await evalCode(`(() => {
        const h1 = document.querySelector('h1')?.innerText || '';
        const bodyText = document.body.innerText;
        const isPlanBuilder = Boolean(document.querySelector('[data-healthclues-plan-builder], #hc-plan-title'));
        const isDeepOffer = bodyText.includes('cá nhân hóa thêm') || bodyText.includes('Quick profile complete') || bodyText.includes('tạo hồ sơ') || bodyText.includes('Skip and create');
        const isResult = bodyText.includes('Cuộc phiêu lưu của bạn đã sẵn sàng') || bodyText.includes('Your adventure is ready');
        const choices = Array.from(document.querySelectorAll('button[aria-pressed]')).map(b => b.innerText.trim());
        return { h1, isPlanBuilder, isDeepOffer, isResult, choices };
      })()`);

      console.log(`Step ${step} current screen:`, current);

      if (current.isPlanBuilder) {
        console.log("SUCCESS: Reached Wellness Plan Builder directly!");
        break;
      }

      if (current.isResult) {
        console.log("On result screen, clicking to open Wellness Plan...");
        await evalCode(`(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('KẾ HOẠCH') || b.innerText.includes('WELLNESS PLAN') || b.innerText.includes('Build My Wellness Plan'));
          if (btn) btn.click();
        })()`);
        await new Promise(r => setTimeout(r, 1500));
        break;
      }

      if (current.isDeepOffer) {
        console.log("On deep offer screen, clicking 'Bỏ qua và tạo hồ sơ'...");
        await evalCode(`(() => {
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('tạo hồ sơ') || b.innerText.includes('Skip and create'));
          if (skipBtn) skipBtn.click();
        })()`);
        await new Promise(r => setTimeout(r, 1800));
        continue;
      }

      // Pick an appropriate choice for this question
      await evalCode(`(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const yesBtn = buttons.find(b => b.getAttribute('aria-pressed') !== null && (b.innerText.includes('Có') || b.innerText.includes('Yes')));
        const sleepBtn = buttons.find(b => b.getAttribute('aria-pressed') !== null && (b.innerText.includes('ngủ') || b.innerText.includes('Sleep')));
        const preferBtn = buttons.find(b => b.getAttribute('aria-pressed') !== null && (b.innerText.includes('tiết lộ') || b.innerText.includes('Prefer not')));
        const englishBtn = buttons.find(b => b.getAttribute('aria-pressed') !== null && (b.innerText.includes('English') || b.innerText.includes('Tiếng Việt')));
        const targetBtn = yesBtn || sleepBtn || preferBtn || englishBtn || document.querySelector('button[aria-pressed]');
        if (targetBtn) targetBtn.click();
      })()`);
      await new Promise(r => setTimeout(r, 400));

      await evalCode(`(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(b => b.innerText.trim() === 'Tiếp' || b.innerText.trim() === 'Next' || (b.innerText.includes('Tiếp') && !b.innerText.includes('Bỏ qua')));
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
        } else {
          const skipBtn = buttons.find(b => b.innerText.trim() === 'Bỏ qua' || b.innerText.trim() === 'Skip');
          if (skipBtn) skipBtn.click();
        }
      })()`);
      await new Promise(r => setTimeout(r, 1200));
    }

    console.log("4. Waiting for Wellness Plan proposals to render...");
    let planData = null;
    for (let t = 0; t < 25; t++) {
      planData = await evalCode(`(() => {
        const builder = document.querySelector('[data-healthclues-plan-builder]');
        const goals = Array.from(document.querySelectorAll('[data-ai-goal], article[class*="goalCard"]'));
        const title = document.querySelector('#hc-plan-title')?.innerText || '';
        const countText = document.querySelector('[data-selected-goal-count]')?.innerText || '';
        const statusText = document.querySelector('[data-advisor-status]')?.innerText || '';
        const mascotSpeech = document.querySelector('[class*="petSpeech"] p')?.innerText || '';
        return {
          hasBuilder: Boolean(builder),
          goalCount: goals.length,
          title,
          countText,
          statusText,
          mascotSpeech,
          goalsSummary: goals.map(g => ({
            title: g.querySelector('h3')?.innerText || '',
            subtitle: g.querySelector('p')?.innerText || '',
            isChecked: Boolean(g.querySelector('input[type="checkbox"]:checked'))
          }))
        };
      })()`);

      if (planData && planData.goalCount > 0) {
        console.log("Proposals successfully rendered!", planData);
        break;
      }
      await new Promise(r => setTimeout(r, 800));
    }

    assert.ok(planData && planData.goalCount >= 3, `Expected at least 3 proposed habit goals, got: ${planData?.goalCount}`);
    console.log(`Verified ${planData.goalCount} habit proposals visible!`);
    console.log("Mascot speech:", planData.mascotSpeech);
    console.log("Selected goals count badge:", planData.countText);
    console.log("Proposed Goals:", planData.goalsSummary);

    // Capture screenshot: vision-raw-quiz-proposal-mobile-390.png
    console.log("Capturing artifact screenshot: vision-raw-quiz-proposal-mobile-390.png...");
    const screenshot = await cdp("Page.captureScreenshot", { format: "png" });
    saveScreenshot("vision-raw-quiz-proposal-mobile-390.png", screenshot.data);

    console.log("=== ALL POST-QUIZ PROPOSAL CHECKS PASSED 100% ===");

    pageWs.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error("FAILED:", err);
  process.exit(1);
});
