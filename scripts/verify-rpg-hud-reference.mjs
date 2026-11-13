import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function cdpRequest(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", onMessage);
        if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
        else resolve(data.result);
      }
    };
    ws.addEventListener("message", onMessage);
    ws.send(msg);
  });
}

async function evalInPage(ws, msgId, expression) {
  const res = await cdpRequest(ws, msgId.id++, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function captureScreenshot(ws, msgId, filePath) {
  const shot = await cdpRequest(ws, msgId.id++, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${filePath}`);
}

async function main() {
  console.log("=== STARTING FULL E2E RPG HUD & AI BOTANICAL VERIFICATION ===");

  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-rpg-hud-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,720",
    "about:blank",
  ]);

  let ws;
  let msgId = { id: 1 };

  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
        if (res.ok) {
          targets = await res.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targets && targets.length, "No targets returned from Chrome CDP");

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const WebSocket = globalThis.WebSocket;
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    await cdpRequest(ws, msgId.id++, "Page.enable");
    await cdpRequest(ws, msgId.id++, "Runtime.enable");
    await cdpRequest(ws, msgId.id++, "Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Navigate to Quiz Step 1
    console.log("1. Navigating to Quiz in Vietnamese...");
    await cdpRequest(ws, msgId.id++, "Page.navigate", {
      url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=health-concern&step=discovery",
    });

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const res = await evalInPage(ws, msgId, `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`);
      if (res) break;
    }

    // Step 1: Select concern (e.g. Gout / uric acid) & continue
    console.log("2. Selecting health concern...");
    await evalInPage(
      ws,
      msgId,
      `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        const allBtns = Array.from(quiz.querySelectorAll('button'));
        const next = allBtns[allBtns.length - 1];
        if (next) next.click();
      })()`
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: Confirm age & continue to activation
    console.log("3. Confirming age and activating account...");
    await evalInPage(
      ws,
      msgId,
      `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const chk = quiz?.querySelector('input[type="checkbox"]');
        if (chk && !chk.checked) chk.click();
        const allBtns = Array.from(quiz.querySelectorAll('button'));
        const finish = allBtns[allBtns.length - 1];
        if (finish) finish.click();
      })()`
    );
    await new Promise((r) => setTimeout(r, 2000));

    // Habit suggestions / Plan Builder: Confirm Plan
    console.log("4. Confirming wellness plan habits...");
    for (let i = 0; i < 40; i++) {
      const planRes = await evalInPage(
        ws,
        msgId,
        `(() => {
          const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
          if (confirmBtn && !confirmBtn.disabled) {
            confirmBtn.click();
            return { clicked: true };
          }
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua gợi ý'));
          if (skipBtn) {
            skipBtn.click();
            return { clicked: true };
          }
          return { clicked: false };
        })()`
      );
      if (planRes?.clicked) {
        console.log("✓ Plan confirmed!");
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 1500));

    // Click "BẮT ĐẦU HÀNH TRÌNH" in World Preview
    console.log("5. In World Preview: clicking Start Journey...");
    for (let i = 0; i < 30; i++) {
      const startRes = await evalInPage(
        ws,
        msgId,
        `(() => {
          const btn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BẮT ĐẦU HÀNH TRÌNH'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()`
      );
      if (startRes) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Fill email and click Instant Activate
    console.log("6. Activating companion account...");
    await evalInPage(
      ws,
      msgId,
      `(() => {
        const emailInput = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
        if (emailInput) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(emailInput, 'hongquan0508@gmail.com');
          else emailInput.value = 'hongquan0508@gmail.com';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const instantBtn = document.querySelector('[data-instant-activate-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kích hoạt tức thì'));
        if (instantBtn && !instantBtn.disabled) instantBtn.click();
      })()`
    );

    // Wait for redirect to /world
    console.log("7. Waiting for redirect to RPG World...");
    for (let i = 0; i < 40; i++) {
      const url = await evalInPage(ws, msgId, `window.location.href`);
      if (url && url.includes("/world")) {
        console.log(`✓ World reached: ${url}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Wait for world game canvas & HUD to render
    await new Promise((r) => setTimeout(r, 3500));

    // If an initial drawer or modal is open (e.g. My Journey), close it so the map scene is in full view
    await evalInPage(
      ws,
      msgId,
      `(() => {
        const closeBtn = document.querySelector('.hc-game-modal-header button');
        if (closeBtn) closeBtn.click();
      })()`
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Verify all RPG HUD elements
    const hudAudit = await evalInPage(
      ws,
      msgId,
      `(() => {
        const topbar = document.querySelector('.hc-rpg-topbar');
        const brandTitle = document.querySelector('.hc-rpg-brand-title')?.textContent || '';
        const expCapsule = document.querySelector('.hc-rpg-exp-capsule');
        const levelTitle = document.querySelector('.hc-rpg-level-title')?.textContent || '';
        const expBarNum = document.querySelector('.hc-rpg-bar-num')?.textContent || '';
        const rewardName = document.querySelector('.hc-rpg-reward-name')?.textContent || '';
        const rightPanels = document.querySelector('.hc-rpg-right-panels');
        const careCard = document.querySelector('.hc-rpg-care-card');
        const careHeading = careCard?.querySelector('.hc-rpg-card-heading')?.textContent || '';
        const habits = [...document.querySelectorAll('.hc-rpg-habit-row')].map(r => r.querySelector('strong')?.textContent.trim() || '');
        const nodes7 = [...document.querySelectorAll('.hc-rpg-7day-node')].map(n => n.textContent.trim());
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dockButtons = [...document.querySelectorAll('.hc-rpg-dock-btn')].map(b => b.textContent.trim());
        const lumiSpeech = document.querySelector('.hc-rpg-lumi-speech-text')?.textContent || '';
        const celebration = document.querySelector('.hc-rpg-exp-burst')?.textContent || '';
        const pills = [...document.querySelectorAll('.hc-rpg-location-pill')].map(p => p.textContent.trim());
        return {
          hasTopbar: Boolean(topbar),
          brandTitle,
          hasExpCapsule: Boolean(expCapsule),
          levelTitle,
          expBarNum,
          rewardName,
          hasRightPanels: Boolean(rightPanels),
          hasCareCard: Boolean(careCard),
          careHeading,
          habitsCount: habits.length,
          habits,
          nodes7Count: nodes7.length,
          nodes7,
          hasDock: Boolean(dock),
          dockButtons,
          lumiSpeech,
          celebration,
          pillsCount: pills.length,
          pills,
        };
      })()`
    );

    console.log("[CDP] Full RPG HUD Audit:", JSON.stringify(hudAudit, null, 2));

    // 8. Capture Full Screenshot matching reference image
    const desktopShotPath = path.join(artifactsDir, "verified-rpg-hud-reference.png");
    await captureScreenshot(ws, msgId, desktopShotPath);

    // 9. Now click Botanist Landmark ("Nhà Thảo Mộc") to open the Botanist Garden modal
    console.log("8. Clicking Botanist / Nhà Thảo Mộc landmark to inspect AI herbal recommendations...");
    await evalInPage(
      ws,
      msgId,
      `(() => {
        const botanistPill = [...document.querySelectorAll('.hc-rpg-location-pill')].find(p => p.textContent.includes('Botanist') || p.textContent.includes('Thảo Mộc'));
        if (botanistPill) {
          botanistPill.click();
          return true;
        }
        const landmark = document.querySelector('[data-landmark-id="nutrition"] button');
        if (landmark) {
          landmark.click();
          return true;
        }
        return false;
      })()`
    );

    // Wait for Botanist modal & AI items
    let botanistResult = null;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 600));
      botanistResult = await evalInPage(
        ws,
        msgId,
        `(() => {
          const botanistModal = document.querySelector('.hc-botanist');
          const title = botanistModal?.querySelector('h2')?.textContent || document.querySelector('.hc-game-modal-header h2')?.textContent || '';
          const items = [...document.querySelectorAll('.hc-botanist-item')].map(item => ({
            name: item.querySelector('h3')?.textContent || '',
            desc: item.querySelector('p')?.textContent || '',
            hasAiBadge: Boolean(item.querySelector('.hc-botanist-item-heading span')),
          }));
          const emptyBox = document.querySelector('[data-botanist-empty]');
          return {
            modalOpen: Boolean(botanistModal),
            title,
            itemsCount: items.length,
            items,
            hasEmptyBox: Boolean(emptyBox),
          };
        })()`
      );
      if (botanistResult && botanistResult.modalOpen && (botanistResult.itemsCount > 0 || !botanistResult.hasEmptyBox)) {
        console.log("✓ Botanist Garden loaded with AI recommendations:", botanistResult);
        break;
      }
    }

    // Capture Botanist Modal Screenshot
    const botanistShotPath = path.join(artifactsDir, "verified-botanist-ai-garden.png");
    await captureScreenshot(ws, msgId, botanistShotPath);

    // Assertions
    assert.ok(hudAudit.hasTopbar, "Topbar must be present.");
    assert.ok(hudAudit.hasExpCapsule, "Experience capsule must be present.");
    assert.ok(hudAudit.hasRightPanels, "Right panels must be present.");
    assert.ok(hudAudit.hasDock, "Bottom dock must be present.");
    assert.equal(hudAudit.dockButtons.length, 6, "Bottom dock must have 6 buttons.");
    assert.ok(botanistResult?.modalOpen, "Botanist modal must open.");
    assert.ok(!botanistResult?.hasEmptyBox, "Empty box must NOT be displayed in Botanist Garden!");
    assert.ok(botanistResult?.itemsCount >= 2, "AI Botanicals must display at least 2 recommended herbs!");

    console.log("=== ALL E2E VERIFICATION ASSERTIONS PASSED! ===");
  } finally {
    if (ws) ws.close();
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in verification:", err);
  process.exit(1);
});
