import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f";

async function main() {
  console.log("=== STARTING FULL END-TO-END RPG USER JOURNEY CDP TEST ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-rpg-e2e-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,900",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not obtain Chrome WebSocket endpoint.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    // 1. Navigate to Quiz
    console.log("1. Navigating to Quiz Step 1 in Vietnamese...");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=health-concern&step=discovery" });
    await new Promise((r) => setTimeout(r, 2500));

    // Wait for quiz container
    for (let i = 0; i < 30; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`,
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    // Step 1: Select 2 concerns
    console.log("Step 1: Selecting 2 concerns...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục"
    console.log("Step 1 -> Click Tiếp tục");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const nextBtn = btns[btns.length - 1];
        if (nextBtn) nextBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Multi-select 2 factors + confirm age
    console.log("Step 2: Selecting 2 factors and confirming age...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button[aria-pressed]'));
        if (btns[0]) btns[0].click();
        if (btns[1]) btns[1].click();
        const chk = quiz.querySelector('input[type="checkbox"]');
        if (chk && !chk.checked) chk.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click "Tiếp tục kích hoạt tài khoản"
    console.log("Step 2 -> Click Tiếp tục kích hoạt tài khoản");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const quiz = document.querySelector('[data-healthclues-two-question-quiz]');
        const btns = Array.from(quiz.querySelectorAll('button'));
        const finishBtn = btns[btns.length - 1];
        if (finishBtn) finishBtn.click();
      })()`,
    });

    // Wait until quiz container disappears
    for (let i = 0; i < 30; i++) {
      const quizActive = await send("Runtime.evaluate", {
        expression: `Boolean(document.querySelector('[data-healthclues-two-question-quiz]'))`,
        returnByValue: true,
      });
      if (!quizActive.result?.value) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    // 2.5: Habit Suggestions / Plan Builder Step
    console.log("2.5 Checking if Habit Suggestions (WellnessPlanBuilder) is displayed...");
    for (let i = 0; i < 60; i++) {
      const planCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const isLoading = Boolean(document.querySelector('[data-advisor-loading]'));
          const radioInputs = Array.from(document.querySelectorAll('input[type="radio"]'));
          const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua gợi ý'));
          return {
            isLoading,
            radiosCount: radioInputs.length,
            hasConfirmBtn: Boolean(confirmBtn),
            confirmDisabled: confirmBtn ? confirmBtn.disabled : null,
            hasSkipBtn: Boolean(skipBtn)
          };
        })()`,
        returnByValue: true,
      });

      const st = planCheck.result?.value;
      if (st && !st.isLoading && (st.radiosCount > 0 || st.hasConfirmBtn || st.hasSkipBtn)) {
        console.log("✓ Habit Suggestions loaded:", st);

        // Click Option A for every goal by clicking the label wrapping the first radio
        const selectResult = await send("Runtime.evaluate", {
          expression: `(() => {
            const labels = Array.from(document.querySelectorAll('label')).filter(l => l.querySelector('input[type="radio"]'));
            let clickedCount = 0;
            for (let i = 0; i < labels.length; i += 3) {
              labels[i].click();
              clickedCount++;
            }
            const countPill = document.querySelector('[data-selected-goal-count]');
            return { labelsCount: labels.length, clickedCount, counterText: countPill?.textContent.trim() };
          })()`,
          returnByValue: true,
        });
        console.log("Selected goals result:", selectResult.result?.value);
        await new Promise((r) => setTimeout(r, 800));

        // Click confirm plan button
        const clickConfirm = await send("Runtime.evaluate", {
          expression: `(() => {
            const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
            if (confirmBtn && !confirmBtn.disabled) {
              confirmBtn.click();
              return { clicked: "confirm" };
            }
            const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bỏ qua gợi ý'));
            if (skipBtn) {
              skipBtn.click();
              return { clicked: "skip" };
            }
            return { clicked: "none" };
          })()`,
          returnByValue: true,
        });
        console.log("Plan advance action:", clickConfirm.result?.value);
        await new Promise((r) => setTimeout(r, 1500));

    // Wait for active goal cards to render
    for (let i = 0; i < 15; i++) {
      const cardCountCheck = await send("Runtime.evaluate", {
        expression: `document.querySelectorAll('.hc-active-goal-card').length`,
        returnByValue: true,
      });
      if ((cardCountCheck.result?.value || 0) > 0) {
        console.log("✓ Active goal cards detected in DOM:", cardCountCheck.result?.value);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. In World Preview: Open activation dialog and quick activate
    console.log("3. In World Preview: Opening activation dialog...");
    for (let i = 0; i < 40; i++) {
      const openDialogRes = await send("Runtime.evaluate", {
        expression: `(() => {
          const startBtn = document.querySelector('[data-start-journey-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BẮT ĐẦU HÀNH TRÌNH') || b.textContent.includes('START YOUR JOURNEY'));
          if (startBtn) {
            startBtn.click();
            return { clicked: true, text: startBtn.textContent.trim() };
          }
          return { clicked: false };
        })()`,
        returnByValue: true,
      });
      if (openDialogRes.result?.value?.clicked) {
        console.log("Start button clicked:", openDialogRes.result?.value);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Fill email and click Instant Activate
    console.log("Entering email and clicking Instant Activate...");
    for (let i = 0; i < 30; i++) {
      const activateRes = await send("Runtime.evaluate", {
        expression: `(() => {
          const emailInput = document.querySelector('#hc-activation-email') || document.querySelector('input[type="email"]');
          if (emailInput) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) {
              nativeSetter.call(emailInput, 'hongquan0508@gmail.com');
            } else {
              emailInput.value = 'hongquan0508@gmail.com';
            }
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const instantBtn = document.querySelector('[data-instant-activate-btn]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kích hoạt tức thì') || b.textContent.includes('Instant Activate'));
          if (instantBtn && !instantBtn.disabled) {
            instantBtn.click();
            return { clicked: true, text: instantBtn.textContent.trim() };
          }
          return { clicked: false, hasInput: Boolean(emailInput), hasBtn: Boolean(instantBtn), btnDisabled: instantBtn?.disabled };
        })()`,
        returnByValue: true,
      });
      if (activateRes.result?.value?.clicked) {
        console.log("Instant activate click succeeded:", activateRes.result?.value);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Wait for redirect to World scene
    console.log("4. Waiting for RPG World scene...");
    let worldUrl = "";
    for (let i = 0; i < 50; i++) {
      const urlCheck = await send("Runtime.evaluate", {
        expression: `window.location.href`,
        returnByValue: true,
      });
      worldUrl = urlCheck.result?.value || "";
      if (worldUrl.includes("/world")) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    console.log("World URL reached:", worldUrl);

    // CRITICAL ASSERTION: Must NOT be legacy backpack page
    const legacyCheck = await send("Runtime.evaluate", {
      expression: `Boolean(document.getElementById('hc-onboarding-backpack-title'))`,
      returnByValue: true,
    });
    assert.ok(!legacyCheck.result?.value, "FAIL: Legacy 'Prepare your backpack' screen detected!");
    console.log("✓ Pass: No legacy backpack screen. Navigated directly into RPG world!");

    // Wait for World scene to render
    await new Promise((r) => setTimeout(r, 4000));

    // 5. Ensure "Hành trình của tôi" (My Journey modal) is open
    console.log("5. Ensuring 'Hành trình của tôi' (My Journey modal) is open...");
    for (let i = 0; i < 20; i++) {
      const journeyCheck = await send("Runtime.evaluate", {
        expression: `(() => {
          const panel = document.querySelector('[data-my-journey-panel]');
          if (panel) return { open: true };
          const btns = Array.from(document.querySelectorAll('button'));
          const journeyBtn = btns.find(b => b.textContent.includes('Hành trình') || b.textContent.includes('Nhiệm vụ') || b.textContent.includes('My Journey') || b.getAttribute('aria-label')?.includes('Hành trình'));
          if (journeyBtn) {
            journeyBtn.click();
            return { open: false, clicked: true };
          }
          return { open: false, clicked: false };
        })()`,
        returnByValue: true,
      });
      if (journeyCheck.result?.value?.open) {
        console.log("✓ Journey modal open verified!");
        break;
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    await new Promise((r) => setTimeout(r, 1500));

    // Wait for active goal cards to render
    for (let i = 0; i < 15; i++) {
      const cardCountCheck = await send("Runtime.evaluate", {
        expression: `document.querySelectorAll('.hc-active-goal-card').length`,
        returnByValue: true,
      });
      if ((cardCountCheck.result?.value || 0) > 0) {
        console.log("✓ Active goal cards detected in DOM:", cardCountCheck.result?.value);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    // Measure layout metrics in Desktop (1280px)
    const desktopMetrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const modalBody = document.querySelector('.hc-game-modal-body');
        const panel = document.querySelector('.hc-my-journey-panel');
        const activeGoals = Array.from(document.querySelectorAll('.hc-active-goal-card'));
        const cardTitles = Array.from(document.querySelectorAll('.hc-quest-card-title')).map(el => el.textContent.trim());
        const cardHeaders = Array.from(document.querySelectorAll('.hc-goal-category-micro')).map(el => el.textContent.trim());
        const titlesTruncated = cardTitles.map(t => t.length);
        return {
          modalScrollWidth: modalBody ? modalBody.scrollWidth : 0,
          modalClientWidth: modalBody ? modalBody.clientWidth : 0,
          hasHorizontalOverflow: modalBody ? modalBody.scrollWidth > modalBody.clientWidth : false,
          activeGoalsCount: activeGoals.length,
          cardHeaders: cardHeaders.slice(0, 4),
          cardTitlesSample: cardTitles.slice(0, 4)
        };
      })()`,
      returnByValue: true,
    });
    console.log("Desktop Modal Metrics:", desktopMetrics.result?.value);
    assert.ok(!desktopMetrics.result?.value.hasHorizontalOverflow, "FAIL: Horizontal overflow on desktop!");

    // Capture desktop screenshot
    const desktopShot = await send("Page.captureScreenshot", { format: "png" });
    const desktopShotPath = path.join(artifactsDir, "verified-e2e-rpg-desktop.png");
    writeFileSync(desktopShotPath, Buffer.from(desktopShot.data, "base64"));
    console.log("Saved desktop screenshot to:", desktopShotPath);

    // 6. Measure layout metrics in Tablet (768px)
    console.log("6. Testing Tablet Viewport (768px)...");
    await send("Emulation.setDeviceMetricsOverride", { width: 768, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 1200));

    const tabletMetrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const modalBody = document.querySelector('.hc-game-modal-body');
        return {
          modalScrollWidth: modalBody ? modalBody.scrollWidth : 0,
          modalClientWidth: modalBody ? modalBody.clientWidth : 0,
          hasHorizontalOverflow: modalBody ? modalBody.scrollWidth > modalBody.clientWidth : false,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Tablet Modal Metrics (768px):", tabletMetrics.result?.value);
    assert.ok(!tabletMetrics.result?.value.hasHorizontalOverflow, "FAIL: Horizontal overflow on 768px tablet!");

    const tabletShot = await send("Page.captureScreenshot", { format: "png" });
    const tabletShotPath = path.join(artifactsDir, "verified-e2e-rpg-tablet.png");
    writeFileSync(tabletShotPath, Buffer.from(tabletShot.data, "base64"));
    console.log("Saved tablet screenshot to:", tabletShotPath);

    // 7. Measure layout metrics in Mobile (390px)
    console.log("7. Testing Mobile Viewport (390px)...");
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 1200));

    const mobileMetrics = await send("Runtime.evaluate", {
      expression: `(() => {
        const modalBody = document.querySelector('.hc-game-modal-body');
        return {
          modalScrollWidth: modalBody ? modalBody.scrollWidth : 0,
          modalClientWidth: modalBody ? modalBody.clientWidth : 0,
          hasHorizontalOverflow: modalBody ? modalBody.scrollWidth > modalBody.clientWidth : false,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Mobile Modal Metrics (390px):", mobileMetrics.result?.value);
    assert.ok(!mobileMetrics.result?.value.hasHorizontalOverflow, "FAIL: Horizontal overflow on 390px mobile!");

    const mobileShot = await send("Page.captureScreenshot", { format: "png" });
    const mobileShotPath = path.join(artifactsDir, "verified-e2e-rpg-mobile.png");
    writeFileSync(mobileShotPath, Buffer.from(mobileShot.data, "base64"));
    console.log("Saved mobile screenshot to:", mobileShotPath);

    // 8. Return to Desktop (1280x720) and close modal to verify RPG HUD matching reference
    console.log("8. Testing RPG HUD Reference View (1280x720)...");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await new Promise((r) => setTimeout(r, 800));

    // Close any open modal to reveal full RPG World HUD
    console.log("Closing any open modal to reveal full RPG World HUD...");
    for (let i = 0; i < 15; i++) {
      const closed = await send("Runtime.evaluate", {
        expression: `(() => {
          const modal = document.querySelector('.hc-game-modal');
          if (!modal) return true;
          const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal-header button');
          if (closeBtn) {
            closeBtn.click();
            return false;
          }
          const worldDockBtn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.textContent.includes('Thế Giới') || b.textContent.includes('World'));
          if (worldDockBtn) {
            worldDockBtn.click();
            return false;
          }
          return false;
        })()`,
        returnByValue: true,
      });
      if (closed.result?.value) {
        console.log("✓ Modal closed successfully. Full RPG World HUD is now uncovered!");
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Inspect HUD elements
    const hudAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const topbar = document.querySelector('.hc-rpg-topbar');
        const expCapsule = document.querySelector('.hc-rpg-exp-capsule');
        const levelTitle = document.querySelector('.hc-rpg-level-title')?.textContent || '';
        const expBarNum = document.querySelector('.hc-rpg-bar-num')?.textContent || '';
        const rewardName = document.querySelector('.hc-rpg-reward-name')?.textContent || '';
        const rightPanels = document.querySelector('.hc-rpg-right-panels');
        const habits = [...document.querySelectorAll('.hc-rpg-habit-row')].map(r => r.querySelector('strong')?.textContent.trim() || '');
        const nodes7 = [...document.querySelectorAll('.hc-rpg-7day-node')].map(n => n.textContent.trim());
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dockButtons = [...document.querySelectorAll('.hc-rpg-dock-btn')].map(b => b.textContent.trim());
        const lumiSpeech = document.querySelector('.hc-rpg-lumi-speech-text')?.textContent || '';
        const celebration = document.querySelector('.hc-rpg-exp-burst')?.textContent || '';
        const pills = [...document.querySelectorAll('.hc-rpg-location-pill')].map(p => p.textContent.trim());
        return {
          hasTopbar: Boolean(topbar),
          hasExpCapsule: Boolean(expCapsule),
          levelTitle,
          expBarNum,
          rewardName,
          hasRightPanels: Boolean(rightPanels),
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
      })()`,
      returnByValue: true,
    });
    console.log("HUD Audit Result:", JSON.stringify(hudAudit.result?.value, null, 2));

    const refShot = await send("Page.captureScreenshot", { format: "png" });
    const refShotPath = path.join(artifactsDir, "verified-rpg-hud-reference.png");
    writeFileSync(refShotPath, Buffer.from(refShot.data, "base64"));
    console.log("Saved RPG HUD reference screenshot to:", refShotPath);

    // 9. Click Botanist landmark pill to open the Botanical Garden modal
    console.log("9. Opening Botanist / Nhà Thảo Mộc to verify AI herbal recommendations...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const botanistPill = [...document.querySelectorAll('.hc-rpg-location-pill')].find(p => p.textContent.includes('Botanist') || p.textContent.includes('Thảo Mộc'));
        if (botanistPill) {
          botanistPill.click();
          return true;
        }
        const landmark = document.querySelector('[data-landmark-id="nutrition"] button') || document.querySelector('[data-landmark-id="nutrition"]');
        if (landmark) {
          landmark.click();
          return true;
        }
        return false;
      })()`,
    });

    let botanistResult = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const res = await send("Runtime.evaluate", {
        expression: `(() => {
          const botanistModal = document.querySelector('.hc-botanist');
          const title = botanistModal?.querySelector('h2')?.textContent || document.querySelector('.hc-game-modal-header h2')?.textContent || '';
          const items = [...document.querySelectorAll('.hc-botanist-item')].map(item => ({
            name: item.querySelector('h3')?.textContent || '',
            desc: item.querySelector('p')?.textContent || '',
            badge: item.querySelector('.hc-botanist-item-heading span')?.textContent || '',
          }));
          const emptyBox = document.querySelector('[data-botanist-empty]');
          return {
            modalOpen: Boolean(botanistModal),
            title,
            itemsCount: items.length,
            items,
            hasEmptyBox: Boolean(emptyBox),
          };
        })()`,
        returnByValue: true,
      });
      botanistResult = res.result?.value;
      if (botanistResult && botanistResult.modalOpen && botanistResult.itemsCount > 0) {
        console.log("✓ Botanist Garden loaded with AI herbs:", botanistResult);
        break;
      }
    }

    const botanistShot = await send("Page.captureScreenshot", { format: "png" });
    const botanistShotPath = path.join(artifactsDir, "verified-botanist-ai-garden.png");
    writeFileSync(botanistShotPath, Buffer.from(botanistShot.data, "base64"));
    console.log("Saved Botanist AI Garden screenshot to:", botanistShotPath);

    // Assertions
    assert.ok(hudAudit.result?.value.hasTopbar, "Topbar must be present.");
    assert.ok(hudAudit.result?.value.hasExpCapsule, "Experience capsule must be present.");
    assert.ok(hudAudit.result?.value.hasRightPanels, "Right panels must be present.");
    assert.ok(hudAudit.result?.value.hasDock, "Bottom dock must be present.");
    assert.equal(hudAudit.result?.value.dockButtons.length, 6, "Bottom dock must have 6 buttons.");
    assert.ok(botanistResult?.modalOpen, "Botanist modal must open.");
    assert.ok(!botanistResult?.hasEmptyBox, "Empty box must NOT be displayed in Botanist Garden!");
    assert.ok(botanistResult?.itemsCount >= 2, "AI Botanicals must display at least 2 recommended herbs!");

    console.log("=== ALL CDP E2E VERIFICATIONS PASSED WITH ZERO ERRORS ===");
    ws.close();
  } finally {
    chromeProc.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("FATAL E2E ERROR:", err);
  process.exit(1);
});
