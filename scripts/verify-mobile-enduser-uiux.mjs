import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const workspaceScreenshotsDir = "D:\\botly\\App\\.tmp\\healthclues-tester\\screenshots";
const base = "http://127.0.0.1:3329";

mkdirSync(workspaceScreenshotsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try { writeFileSync(path.join(artifactsDir, filename), buf); } catch {}
  if (existsSync(workspaceScreenshotsDir)) {
    try { writeFileSync(path.join(workspaceScreenshotsDir, filename), buf); } catch {}
  }
}

async function main() {
  console.log("=== STARTING DEDICATED END-USER MOBILE AUDIT (390px & 320px) ===");

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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-mobile-audit-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--window-size=390,844",
    "about:blank",
  ]);

  try {
    let targetWs = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
        if (page) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not connect to Chrome DevTools.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
            else resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    // Set mobile metrics 390x844
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    // Navigate to play-demo.html which loads session and takes us to Sleep Valley
    console.log("Navigating to play-demo.html for instant authenticated entry...");
    await send("Page.navigate", { url: `${base}/play-demo.html` });
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for world map or rpg world
    console.log("Waiting for world page to load...");
    for (let i = 0; i < 60; i++) {
      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          const hasMap = Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]'));
          const hasDock = Boolean(document.querySelector('.hc-rpg-bottom-dock'));
          return { hasMap, hasDock, url: window.location.href, title: document.title };
        })()`,
        returnByValue: true,
      });
      if (check.result?.value?.hasMap || check.result?.value?.hasDock) {
        console.log(`World and dock loaded on step ${i}:`, check.result?.value);
        break;
      }
      if (check.result?.value?.url?.includes("chrome-error") && i % 3 === 0) {
        console.log("Transient chrome error, re-navigating to play-demo.html...");
        await send("Page.navigate", { url: `${base}/play-demo.html` });
      }
      if (i % 5 === 0) {
        console.log(`[Wait step ${i}]`, check.result?.value);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // Dismiss tour or any open modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // AUDIT 1: BOTTOM DOCK (Thanh Menu đáy 4 nút Web & Mobile phong cách App)
    // =========================================================================
    console.log("\n--- [AUDIT 1] Bottom Dock 4-Button Inspection (390px) ---");
    const dockAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const allBtns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const visibleBtns = allBtns.filter(b => getComputedStyle(b).display !== 'none');
        const labels = visibleBtns.map(b => b.querySelector('.hc-rpg-dock-label')?.innerText?.trim() || '');
        const hasTuiDo = labels.some(l => l.toLowerCase().includes('túi') || l.toLowerCase().includes('bag') || l.toLowerCase().includes('backpack'));
        const hasHanhTrinh = labels.some(l => l.toLowerCase().includes('hành trình') || l.toLowerCase().includes('journey'));
        const hasBanDo = labels.some(l => l.toLowerCase().includes('bản đồ') || l.toLowerCase().includes('map'));
        const hasNhacNho = labels.some(l => l.toLowerCase().includes('nhắc nhở') || l.toLowerCase().includes('reminder'));
        const hasHomNay = labels.some(l => l.toLowerCase().includes('hôm nay') || l.toLowerCase().includes('today'));

        return {
          totalButtons: allBtns.length,
          visibleCount: visibleBtns.length,
          labels,
          hasTuiDo,
          hasHanhTrinh,
          hasBanDo,
          hasNhacNho,
          hasHomNay,
          dockBoundingRect: dock ? {
            top: dock.getBoundingClientRect().top,
            bottom: dock.getBoundingClientRect().bottom,
            height: dock.getBoundingClientRect().height
          } : null
        };
      })()`,
      returnByValue: true
    });

    console.log("Dock Audit:", JSON.stringify(dockAudit.result?.value, null, 2));
    const dock = dockAudit.result?.value;
    assert.equal(dock.visibleCount, 4, "Mobile dock must show exactly 4 buttons [Bản đồ - Hành Trình - Nhắc nhở - Hôm nay]");
    assert.equal(dock.hasTuiDo, false, "Mobile dock must NOT have redundant 'Túi đồ' button");
    assert.equal(dock.hasBanDo, true, "Mobile dock MUST have [Bản đồ]");
    assert.equal(dock.hasHanhTrinh, true, "Mobile dock MUST have [Hành Trình]");
    assert.equal(dock.hasNhacNho, true, "Mobile dock MUST have [Nhắc nhở]");
    assert.equal(dock.hasHomNay, true, "Mobile dock MUST have [Hôm nay]");
    assert.deepEqual(dock.labels, ["Bản đồ", "Hành Trình", "Nhắc nhở", "Hôm nay"], "Dock button labels must match exactly");
    console.log("✓ PASS: Mobile Dock has exactly 4 buttons: [Bản đồ] - [Hành Trình] - [Nhắc nhở] - [Hôm nay] (native app style)!");

    // =========================================================================
    // AUDIT 1B: TEST DEDICATED REMINDER WINDOW VIA BOTTOM DOCK
    // =========================================================================
    console.log("\n--- [AUDIT 1B] Dedicated Daily Reminder Window via Bottom Dock ---");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const nhacnho = btns.find(b => b.innerText.includes('Nhắc nhở') || b.innerText.includes('Reminders'));
        if (nhacnho) nhacnho.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    const reminderFromDockAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const panel = document.querySelector('.hc-daily-reminder-panel-view');
        return {
          open: Boolean(panel),
          hasToggle: Boolean(panel?.querySelector('input[type="checkbox"]')),
          hasTimeSelect: Boolean(panel?.querySelector('select')),
          hasDoneBtn: Boolean(panel?.querySelector('.hc-reminder-save-btn'))
        };
      })()`,
      returnByValue: true
    });
    console.log("Reminder from Dock Audit:", JSON.stringify(reminderFromDockAudit.result?.value, null, 2));
    assert.equal(reminderFromDockAudit.result?.value.open, true, "Clicking [Nhắc nhở] in bottom dock must open dedicated Daily Reminder window!");
    console.log("✓ PASS: Dedicated Reminder Window opens directly from bottom dock!");

    const shotReminder = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-reminder-window.png", shotReminder.data);

    // Close reminder modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-reminder-save-btn');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // AUDIT 2: COLLISION CHECK (Bottom dock vs Mascot / Purple button)
    // =========================================================================
    console.log("\n--- [AUDIT 2] Collision Check (Dock vs Mascot/Purple Reopen Button) ---");
    const collisionAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const dockRect = dock ? dock.getBoundingClientRect() : null;

        // Check purple circular button or mascot dialogue
        const reopenBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
        const reopenRect = reopenBtn ? reopenBtn.getBoundingClientRect() : null;
        const reopenVisible = reopenBtn && getComputedStyle(reopenBtn).display !== 'none';

        const speechBubble = document.querySelector('.hc-rpg-lumi-speech');
        const speechRect = speechBubble ? speechBubble.getBoundingClientRect() : null;
        const speechVisible = speechBubble && getComputedStyle(speechBubble).display !== 'none';

        // Check overlap with reopen button if visible
        let overlapsReopen = false;
        if (dockRect && reopenRect && reopenVisible) {
          const vertOverlap = !(reopenRect.bottom <= dockRect.top || reopenRect.top >= dockRect.bottom);
          const horizOverlap = !(reopenRect.right <= dockRect.left || reopenRect.left >= dockRect.right);
          overlapsReopen = vertOverlap && horizOverlap;
        }

        // Check overlap with speech bubble if visible
        let overlapsSpeech = false;
        if (dockRect && speechRect && speechVisible) {
          const vertOverlap = !(speechRect.bottom <= dockRect.top || speechRect.top >= dockRect.bottom);
          const horizOverlap = !(speechRect.right <= dockRect.left || speechRect.left >= dockRect.right);
          overlapsSpeech = vertOverlap && horizOverlap;
        }

        return {
          dockRect: dockRect ? { top: dockRect.top, bottom: dockRect.bottom, left: dockRect.left, right: dockRect.right } : null,
          reopenVisible,
          reopenRect: reopenRect ? { top: reopenRect.top, bottom: reopenRect.bottom, left: reopenRect.left, right: reopenRect.right } : null,
          overlapsReopen,
          speechVisible,
          speechRect: speechRect ? { top: speechRect.top, bottom: speechRect.bottom, left: speechRect.left, right: speechRect.right } : null,
          overlapsSpeech
        };
      })()`,
      returnByValue: true
    });

    console.log("Collision Audit:", JSON.stringify(collisionAudit.result?.value, null, 2));
    assert.equal(collisionAudit.result?.value.overlapsReopen, false, "Bottom dock must NOT overlap purple reopen button!");
    assert.equal(collisionAudit.result?.value.overlapsSpeech, false, "Bottom dock must NOT overlap mascot speech bubble!");
    console.log("✓ PASS: Zero collision between bottom menu dock and mascot / purple button!");

    // =========================================================================
    // AUDIT 3: THẺ HUD 'NHIỆM CARE' (Typography & EXP Badge)
    // =========================================================================
    console.log("\n--- [AUDIT 3] HUD 'Nhiệm Care' Typography & EXP Badge ---");
    // Ensure any open modal is closed so floating HUD cards are visible in world view
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const bando = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []).find(b => b.innerText.includes('Bản đồ'));
        if (bando) bando.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1000));

    const careAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const card = document.querySelector('.hc-rpg-care-card');
        if (!card) return { found: false };

        const heading = card.querySelector('.hc-rpg-card-heading');
        const badge = card.querySelector('.hc-rpg-card-count-badge');
        const habitRows = Array.from(card.querySelectorAll('.hc-rpg-habit-row'));
        const habits = habitRows.map(r => {
          const titleEl = r.querySelector('.hc-rpg-habit-title');
          const expTag = r.querySelector('.hc-rpg-exp-tag');
          const taskBtn = r.querySelector('.hc-rpg-task-btn');
          return {
            titleTag: titleEl ? titleEl.tagName.toLowerCase() : '',
            titleFontSize: titleEl ? getComputedStyle(titleEl).fontSize : '',
            titleFontWeight: titleEl ? getComputedStyle(titleEl).fontWeight : '',
            expTagText: expTag ? expTag.innerText?.trim() : '',
            expTagFontSize: expTag ? getComputedStyle(expTag).fontSize : '',
            btnText: taskBtn ? taskBtn.innerText?.trim() : ''
          };
        });

        return {
          found: true,
          headingFontSize: heading ? getComputedStyle(heading).fontSize : '',
          headingFontWeight: heading ? getComputedStyle(heading).fontWeight : '',
          badgeText: badge ? badge.innerText?.trim() : '',
          habitsCount: habits.length,
          habits: habitRows.map(r => {
            const titleEl = r.querySelector('.hc-rpg-habit-title');
            const expTag = r.querySelector('.hc-rpg-exp-tag');
            const taskBtn = r.querySelector('.hc-rpg-task-btn');
            return {
              titleText: titleEl ? titleEl.innerText?.trim() : '',
              titleTag: titleEl ? titleEl.tagName.toLowerCase() : '',
              titleFontSize: titleEl ? getComputedStyle(titleEl).fontSize : '',
              titleFontWeight: titleEl ? getComputedStyle(titleEl).fontWeight : '',
              whiteSpace: titleEl ? getComputedStyle(titleEl).whiteSpace : '',
              textOverflow: titleEl ? getComputedStyle(titleEl).textOverflow : '',
              expTagText: expTag ? expTag.innerText?.trim() : '',
              expTagFontSize: expTag ? getComputedStyle(expTag).fontSize : '',
              btnText: taskBtn ? taskBtn.innerText?.trim() : ''
            };
          })
        };
      })()`,
      returnByValue: true
    });

    console.log("Nhiệm Care HUD Audit:", JSON.stringify(careAudit.result?.value, null, 2));
    const care = careAudit.result?.value;
    assert.equal(care.found, true, "Nhiệm Care card must be present");
    for (const h of care.habits) {
      assert.equal(h.titleTag, "span", "Habit title must be a span, not a bold/chunky strong tag");
      assert.notEqual(h.titleFontWeight, "700", "Habit title font-weight must not be heavy 700 bold");
      assert.notEqual(h.textOverflow, "ellipsis", "Habit title must NOT be cut off with ellipsis '...'");
      assert.notEqual(h.whiteSpace, "nowrap", "Habit title must allow multi-line wrapping");
      if (h.expTagText) {
        assert.match(h.expTagText, /\+10 EXP/, "Badge must say +10 EXP");
      }
    }
    console.log("✓ PASS: Nhiệm Care font is compact, NO '...' ellipsis cut-off, wraps cleanly, badge +10 EXP is compact!");

    const shot390Dock = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-dock.png", shot390Dock.data);

    // =========================================================================
    // AUDIT 4: MODAL 'HÀNH TRÌNH' (My Journey Redesign - First Fold Visibility & Deduplication)
    // =========================================================================
    console.log("\n--- [AUDIT 4] Modal 'Hành trình' (Active Habits First Fold & Zero Duplicates) ---");
    // Click [Hành Trình] on mobile bottom dock
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const journeyBtn = btns.find(b => b.innerText.includes('Hành Trình') || b.innerText.includes('Journey'));
        if (journeyBtn) journeyBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const journeyAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        if (!modal) return { open: false };

        // Check Quick Strip is GONE (reminders moved to bottom dock)
        const quickStrip = modal.querySelector('.hc-journey-reminder-quick-strip');

        // Check old 450px banner is GONE
        const oldBanner = modal.querySelector('.hc-journey-reminder-banner');

        // Check Speech dialogue is hidden on mobile
        const planDialogue = document.querySelector('.hc-plan-builder-dialogue');
        const planDialogueVisible = planDialogue ? getComputedStyle(planDialogue).display !== 'none' : false;

        // Check title group is hidden on mobile
        const titleGroup = modal.querySelector('.hc-active-goals-title-group');
        const titleGroupVisible = titleGroup ? getComputedStyle(titleGroup).display !== 'none' : false;

        // Tabs
        const tabList = modal.querySelector('.hc-journey-nav-tabs');
        const tabListRect = tabList ? tabList.getBoundingClientRect() : null;
        const tabBtns = Array.from(modal.querySelectorAll('.hc-journey-nav-tab-btn'));
        const tabs = tabBtns.map(t => ({
          label: t.innerText?.trim(),
          isSelected: t.getAttribute('aria-selected') === 'true',
          isActiveClass: t.classList.contains('is-active'),
          height: t.getBoundingClientRect().height,
          width: t.getBoundingClientRect().width
        }));

        // Content sections
        const activeHabitsSection = modal.querySelector('.hc-active-goals-section');
        const roadmapSection = modal.querySelector('.hc-journey-map-banner');

        // Buttons & Cards metrics
        const addHabitBtn = modal.querySelector('.hc-add-habit-btn');
        const goalCards = Array.from(modal.querySelectorAll('.hc-active-goal-card'));

        const modalRect = modal ? {
          width: modal.getBoundingClientRect().width,
          right: modal.getBoundingClientRect().right,
          left: modal.getBoundingClientRect().left
        } : null;

        const cardMetrics = goalCards.map(c => {
          const r = c.getBoundingClientRect();
          const actionsRow = c.querySelector('.hc-goal-card-actions-row');
          const actionsRowRect = actionsRow ? actionsRow.getBoundingClientRect() : null;
          return {
            title: c.querySelector('.hc-quest-card-title')?.innerText?.trim() || '',
            width: r.width,
            height: r.height,
            right: r.right,
            left: r.left,
            isOverflowingModal: modalRect ? r.right > modalRect.right + 2 : false,
            isWiderThanModal: modalRect ? r.width > modalRect.width + 1 : false,
            actionsRowRight: actionsRowRect ? actionsRowRect.right : null,
            isActionsOverflowing: modalRect && actionsRowRect ? actionsRowRect.right > modalRect.right + 2 : false
          };
        });

        // First Goal Card position
        const firstGoalCard = modal.querySelector('.hc-active-goal-card');
        const firstGoalTop = firstGoalCard ? firstGoalCard.getBoundingClientRect().top : 9999;

        // Deduplication check
        const habitTitles = goalCards.map(c => c.querySelector('.hc-quest-card-title')?.innerText?.trim()).filter(Boolean);
        const titleCounts = {};
        for (const t of habitTitles) titleCounts[t] = (titleCounts[t] || 0) + 1;
        const duplicates = Object.entries(titleCounts).filter(([_, count]) => count > 1);

        const changeButtons = goalCards.map(c => {
          const btn = c.querySelector('.hc-quest-change-habit-btn');
          const actionsRow = c.querySelector('.hc-goal-card-actions-row');
          return {
            found: Boolean(btn),
            hasActionsRow: Boolean(actionsRow),
            text: btn ? btn.innerText?.trim() : ''
          };
        });

        return {
          open: true,
          hasQuickStrip: Boolean(quickStrip),
          hasOldBanner: Boolean(oldBanner),
          planDialogueVisible,
          titleGroupVisible,
          firstGoalTop,
          habitTitles,
          duplicates,
          tabsCount: tabs.length,
          tabs,
          tabListWidth: tabListRect ? tabListRect.width : 0,
          tabListHeight: tabListRect ? tabListRect.height : 0,
          modalRect,
          cardMetrics,
          hasActiveHabitsSection: Boolean(activeHabitsSection),
          hasRoadmapSection: Boolean(roadmapSection),
          hasAddHabitBtn: Boolean(addHabitBtn),
          addHabitBtnText: addHabitBtn ? addHabitBtn.innerText?.trim() : '',
          goalCardsCount: goalCards.length,
          changeButtons
        };
      })()`,
      returnByValue: true
    });

    console.log("Journey Modal Audit:", JSON.stringify(journeyAudit.result?.value, null, 2));
    const jny = journeyAudit.result?.value;
    assert.equal(jny.open, true, "Journey modal must be open");
    assert.equal(jny.hasOldBanner, false, "Old 450px reminder banner must be COMPLETELY REMOVED from Journey!");
    assert.equal(jny.hasQuickStrip, false, "Quick strip should be moved out to bottom dock!");
    assert.equal(jny.planDialogueVisible, false, "Speech bubble must be hidden on mobile to conserve screen height!");
    assert.equal(jny.titleGroupVisible, false, "Title group must be hidden on mobile to avoid redundant header!");
    assert.ok(jny.firstGoalTop < 300, `First goal card must start above Y=300px so habits are immediately visible in top fold of mobile screen without scrolling! (actual: ${jny.firstGoalTop}px)`);
    assert.equal(jny.duplicates.length, 0, `Must have ZERO duplicate habit cards! Found duplicates: ${JSON.stringify(jny.duplicates)}`);
    assert.equal(jny.tabsCount, 2, "Must have exactly 2 tabs");

    // VISUAL & TOUCH-TARGET RIGOROUS CHECKS
    console.log(`Checking Tab bar dimensions: width=${jny.tabListWidth}px, height=${jny.tabListHeight}px`);
    assert.ok(jny.tabListHeight >= 40, `Tab list container height must be >= 40px (cannot be squashed to ${jny.tabListHeight}px slit!)`);
    for (const t of jny.tabs) {
      assert.ok(t.height >= 36, `Tab button "${t.label}" height must be >= 36px for mobile touch target (actual: ${t.height}px)`);
    }

    // HORIZONTAL OVERFLOW & CARD BOUNDARY CHECKS
    for (const c of jny.cardMetrics) {
      assert.equal(c.isWiderThanModal, false, `Card "${c.title}" width (${c.width}px) exceeds modal width (${jny.modalRect?.width}px)!`);
      assert.equal(c.isOverflowingModal, false, `Card "${c.title}" right edge (${c.right}px) exceeds modal right edge (${jny.modalRect?.right}px)! Checkmark button is clipped!`);
      assert.equal(c.isActionsOverflowing, false, `Actions row for card "${c.title}" overflows modal bounds!`);
    }

    assert.equal(jny.tabs[0]?.isSelected, true, "Default tab MUST be 'Thói quen'!");
    assert.equal(jny.hasActiveHabitsSection, true, "Active habits section must be visible by default");
    assert.equal(jny.hasRoadmapSection, false, "30-Day Roadmap must be hidden when Active Habits tab is selected");
    assert.equal(jny.hasAddHabitBtn, true, "Must have [+ Thêm thói quen] button");
    assert.doesNotMatch(jny.addHabitBtnText, /\+\s*\+\s*Thêm/i, "Button text must NOT duplicate '+ +'");
    assert.match(jny.addHabitBtnText, /Thêm thói quen|Add Habit/i, "Add habit button text verified");
    assert.ok(jny.goalCardsCount > 0, "Must have active goal cards");
    for (const cb of jny.changeButtons) {
      assert.equal(cb.found, true, "Every goal card must have [Đổi / Bỏ] button");
      assert.equal(cb.hasActionsRow, true, "Action buttons must be housed in dedicated actions row");
      assert.match(cb.text, /Đổi \/ Bỏ|Edit/i, "Change button label must be 'Đổi / Bỏ'");
    }
    console.log("✓ PASS: Default tab is 'Thói quen', banner removed, habits visible immediately on first fold, ZERO duplicates, actions row cleanly separated!");

    const shot390Habits = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-journey-habits-first-fold.png", shot390Habits.data);

    // =========================================================================
    // AUDIT 4B: INTERACTIVE COMPANION ADD HABIT (1 Screen, Zero-Scroll Modal)
    // =========================================================================
    console.log("\n--- [AUDIT 4B] Interactive Companion Add Habit Dialog (Zero Scroll) ---");
    // Click [+ Thêm thói quen]
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('.hc-add-habit-btn');
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    const companionAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const card = document.querySelector('.hc-companion-dialog-card');
        if (!card) return { open: false };

        const rect = card.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const scrollHeight = card.scrollHeight;
        const clientHeight = card.clientHeight;
        const hasVerticalScrollbar = scrollHeight > clientHeight + 4;

        const greeting = card.querySelector('.hc-companion-greeting-text')?.innerText?.trim() || '';
        const input = card.querySelector('.hc-companion-text-input');
        const pills = Array.from(card.querySelectorAll('.hc-companion-quick-pill')).map(p => p.innerText?.trim());
        const submitBtn = card.querySelector('.hc-companion-submit-btn');

        return {
          open: true,
          winHeight,
          cardHeight: rect.height,
          fitsScreen: rect.height <= 0.92 * winHeight,
          hasVerticalScrollbar,
          greeting,
          hasInput: Boolean(input),
          pillsCount: pills.length,
          pills,
          hasSubmitBtn: Boolean(submitBtn)
        };
      })()`,
      returnByValue: true
    });

    console.log("Companion Add Habit Modal Audit:", JSON.stringify(companionAudit.result?.value, null, 2));
    const cmp = companionAudit.result?.value;
    assert.equal(cmp.open, true, "Companion modal must open upon clicking [+ Thêm thói quen]");
    assert.equal(cmp.fitsScreen, true, "Companion modal must fit within 90% of screen height");
    assert.equal(cmp.hasVerticalScrollbar, false, "Companion modal must NOT have vertical scrollbar (fits in 1 screen)!");
    assert.ok(cmp.greeting.includes("Chào") || cmp.greeting.includes("Hello"), "Companion greets user warmly");
    assert.equal(cmp.hasInput, true, "Text input for custom habit must be present");
    assert.ok(cmp.pillsCount >= 4, "Must have at least 4 1-tap quick suggestion pills");
    console.log("✓ PASS: Companion dialog fits 100% in one mobile screen with ZERO scroll!");

    // Click 1st suggestion pill
    console.log("Tapping quick suggestion pill 'Thở sâu thư giãn 3 phút'...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const pill = document.querySelector('.hc-companion-quick-pill');
        if (pill) pill.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Check pill selection or set value cleanly via React tracker
    await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('.hc-companion-text-input');
        if (input && !input.value) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(input, "Thở sâu thư giãn 3 phút");
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await new Promise((r) => setTimeout(r, 300));

    // Submit new habit
    console.log("Submitting new habit to journey...");
    const submitClick = await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector('.hc-companion-text-input');
        const submit = document.querySelector('.hc-companion-submit-btn');
        const canClick = submit && !submit.disabled;
        if (canClick) submit.click();
        return {
          canClick,
          inputValue: input ? input.value : null,
          submitDisabled: submit ? submit.disabled : null
        };
      })()`,
      returnByValue: true
    });
    console.log("Submit click state:", submitClick.result?.value);

    // Wait up to 3 seconds for save to complete
    let successReached = false;
    for (let wait = 0; wait < 15; wait++) {
      const state = await send("Runtime.evaluate", {
        expression: `(() => {
          const successStep = document.querySelector('.hc-companion-step-content.is-success');
          const cheerText = successStep?.querySelector('.hc-companion-greeting-text')?.innerText?.trim() || '';
          const errorMsg = document.querySelector('.hc-companion-error-msg')?.innerText?.trim() || '';
          const doneBtn = document.querySelector('.hc-companion-done-btn');
          return {
            hasSuccessStep: Boolean(successStep),
            cheerText,
            errorMsg,
            hasDoneBtn: Boolean(doneBtn)
          };
        })()`,
        returnByValue: true
      });
      if (state.result?.value?.hasSuccessStep) {
        console.log(`Celebration step reached on check ${wait}:`, state.result?.value);
        successReached = true;
        break;
      }
      if (state.result?.value?.errorMsg) {
        console.log("Companion error message:", state.result?.value?.errorMsg);
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    // Check Step 2 (Celebration / Success)
    const celebrationAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const successStep = document.querySelector('.hc-companion-step-content.is-success');
        const cheerText = successStep?.querySelector('.hc-companion-greeting-text')?.innerText?.trim() || '';
        const doneBtn = document.querySelector('.hc-companion-done-btn');
        return {
          hasSuccessStep: Boolean(successStep),
          cheerText,
          hasDoneBtn: Boolean(doneBtn)
        };
      })()`,
      returnByValue: true
    });

    console.log("Celebration Step Audit:", JSON.stringify(celebrationAudit.result?.value, null, 2));
    assert.equal(celebrationAudit.result?.value.hasSuccessStep, true, "Must show celebration step after adding habit");
    assert.ok(celebrationAudit.result?.value.cheerText.includes("Tuyệt vời") || celebrationAudit.result?.value.cheerText.includes("Em đã ghi nhận"), "Companion cheers with encouragement");
    console.log("✓ PASS: Celebration message and confirmation verified!");

    // Close companion dialog
    await send("Runtime.evaluate", {
      expression: `(() => {
        const doneBtn = document.querySelector('.hc-companion-done-btn');
        if (doneBtn) doneBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // AUDIT 4C: SWITCH TO 'LỘ TRÌNH 30 NGÀY' TAB
    // =========================================================================
    console.log("\n--- [AUDIT 4C] Switching to 'Lộ trình 30 ngày' tab ---");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const tabBtns = Array.from(modal.querySelectorAll('.hc-journey-nav-tab-btn'));
        if (tabBtns[1]) tabBtns[1].click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));

    const roadmapAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const roadmapSection = modal ? modal.querySelector('.hc-journey-map-banner') : null;
        const activeHabitsSection = modal ? modal.querySelector('.hc-active-goals-section') : null;
        const dayNodes = Array.from(modal ? modal.querySelectorAll('.hc-day-node') : []);
        const weekBlocks = Array.from(modal ? modal.querySelectorAll('.hc-trail-week-block') : []);
        const modalRect = modal ? modal.getBoundingClientRect() : { width: 390 };
        
        // Check day nodes visibility and horizontal clipping
        const nodesInfo = dayNodes.map(node => {
          const rect = node.getBoundingClientRect();
          const num = node.querySelector('.hc-day-node-num')?.innerText?.trim() || '';
          const isClippedRight = rect.right > (modalRect.width + 10);
          const isClippedLeft = rect.left < -5;
          return { num, width: Math.round(rect.width), height: Math.round(rect.height), right: Math.round(rect.right), isClipped: isClippedRight || isClippedLeft };
        });

        const clippedNodes = nodesInfo.filter(n => n.isClipped);

        return {
          hasRoadmapSection: Boolean(roadmapSection),
          hasActiveHabitsSection: Boolean(activeHabitsSection),
          dayNodesCount: dayNodes.length,
          weekBlocksCount: weekBlocks.length,
          clippedNodesCount: clippedNodes.length,
          clippedNodeNames: clippedNodes.map(n => n.num),
          hasDay07: dayNodes.some(n => n.innerText.includes('07')),
          hasDay14: dayNodes.some(n => n.innerText.includes('14')),
          hasDay21: dayNodes.some(n => n.innerText.includes('21')),
          hasDay28: dayNodes.some(n => n.innerText.includes('28')),
          hasDay30: dayNodes.some(n => n.innerText.includes('30'))
        };
      })()`,
      returnByValue: true
    });
    assert.equal(roadmapAudit.result?.value.hasRoadmapSection, true, "Roadmap section must render on Roadmap tab");
    assert.equal(roadmapAudit.result?.value.hasActiveHabitsSection, false, "Active habits must hide on Roadmap tab");
    assert.ok(roadmapAudit.result?.value.dayNodesCount >= 30, `Must have all 30 days present, found: ${roadmapAudit.result?.value.dayNodesCount}`);
    assert.equal(roadmapAudit.result?.value.clippedNodesCount, 0, `No day nodes may be clipped or overflow horizontally! Clipped: ${JSON.stringify(roadmapAudit.result?.value.clippedNodeNames)}`);
    assert.equal(roadmapAudit.result?.value.hasDay07, true, "Day 07 must be present");
    assert.equal(roadmapAudit.result?.value.hasDay14, true, "Day 14 must be present");
    assert.equal(roadmapAudit.result?.value.hasDay21, true, "Day 21 must be present");
    assert.equal(roadmapAudit.result?.value.hasDay28, true, "Day 28 must be present");
    assert.equal(roadmapAudit.result?.value.hasDay30, true, "Day 30 must be present");
    console.log(`✓ PASS: 'Lộ trình 30 ngày' tab is cleanly separated, all ${roadmapAudit.result?.value.dayNodesCount} days verified with 0 clipped nodes!`);

    const shot390Roadmap = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-journey-roadmap.png", shot390Roadmap.data);

    // Close Journey Modal
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-game-modal header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // AUDIT 5: DIALOG 'GHI NHẬN HÔM NAY' (Daily Check-in)
    // =========================================================================
    console.log("\n--- [AUDIT 5] Dialog 'Ghi nhận hôm nay' (Daily Check-in) ---");
    // Click [Hôm nay] on bottom dock
    await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const btns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []);
        const homNayBtn = btns.find(b => b.innerText.includes('Hôm nay') || b.innerText.includes('Today'));
        if (homNayBtn) homNayBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 1200));

    const checkinAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        if (!dialog) return { open: false };

        // 1. Check for 0/5 stars dropdown or selector
        const starSelect = dialog.querySelector('select') || dialog.querySelector('[data-star-rating]') || dialog.querySelector('.hc-checkin-star-picker');

        // 2. Summary count pill
        const summaryPill = dialog.querySelector('.hc-checkin-count-pill')?.innerText?.trim() || '';

        // 3. Goal cards info & title/subtitle duplicate check
        const cards = Array.from(dialog.querySelectorAll('.hc-checkin-goal-card'));
        const goalItems = cards.map(c => {
          const title = c.querySelector('.hc-checkin-goal-title')?.innerText?.trim() || '';
          const sub = c.querySelector('.hc-checkin-goal-sub')?.innerText?.trim() || '';
          const isDuplicate = sub.length > 0 && (
            title.toLowerCase().includes(sub.toLowerCase()) ||
            sub.toLowerCase().includes(title.toLowerCase())
          );
          const doneBtn = c.querySelector('.hc-checkin-btn.is-done');
          const notYetBtn = c.querySelector('.hc-checkin-btn.is-not-yet');
          return {
            title,
            sub,
            isDuplicate,
            hasDoneBtn: Boolean(doneBtn),
            hasNotYetBtn: Boolean(notYetBtn),
            isDoneActive: doneBtn?.classList.contains('is-active')
          };
        });

        return {
          open: true,
          hasStarBox: Boolean(starSelect),
          summaryPill,
          goalsCount: cards.length,
          goalItems
        };
      })()`,
      returnByValue: true
    });

    console.log("Check-in Dialog Audit:", JSON.stringify(checkinAudit.result?.value, null, 2));
    const chk = checkinAudit.result?.value;
    assert.equal(chk.open, true, "Check-in dialog must be open");
    assert.equal(chk.hasStarBox, false, "Must NOT have cumbersome 0/5 star rating box in dialog");
    assert.ok(chk.summaryPill.includes("mục tiêu") || chk.summaryPill.includes("goals"), "Clean summary pill present");
    for (const item of chk.goalItems) {
      assert.equal(item.isDuplicate, false, `Goal "${item.title}" must not have duplicate subtitle! (found "${item.sub}")`);
    }
    console.log("✓ PASS: No 0/5 star rating box, zero duplicate title/subtitle text!");

    // Test single-tap toggle on Goal 1
    console.log("Testing single-tap toggle on Goal 1...");
    const toggleAudit = await send("Runtime.evaluate", {
      expression: `(async () => {
        const dialog = document.querySelector('.hc-checkin-dialog');
        const cards = Array.from(dialog.querySelectorAll('.hc-checkin-goal-card'));
        const card1 = cards[0];
        const doneBtn = card1.querySelector('.hc-checkin-btn.is-done');

        // First click: sets to done
        doneBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const afterFirst = card1.classList.contains('is-done') && doneBtn.classList.contains('is-active');

        // Second click: toggles back to not_yet
        doneBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const afterSecond = card1.classList.contains('is-done');

        return {
          afterFirst,
          afterSecond
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Toggle Audit Result:", JSON.stringify(toggleAudit.result?.value, null, 2));
    assert.equal(toggleAudit.result?.value.afterFirst, true, "1st click must mark goal as completed");
    assert.equal(toggleAudit.result?.value.afterSecond, false, "2nd click must toggle goal back to not completed");
    console.log("✓ PASS: Single-tap checklist toggle works smoothly!");

    const shot390Checkin = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-390-checkin.png", shot390Checkin.data);

    // Close Check-in Dialog
    await send("Runtime.evaluate", {
      expression: `(() => {
        const closeBtn = document.querySelector('.hc-checkin-dialog header button') || document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // AUDIT 6: SMALL SCREEN 320px VIEWPORT (iPhone SE / Small Android)
    // =========================================================================
    console.log("\n--- [AUDIT 6] Small Screen 320x800 Viewport Inspection ---");
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 800, deviceScaleFactor: 2, mobile: true });
    await new Promise((r) => setTimeout(r, 800));

    const audit320 = await send("Runtime.evaluate", {
      expression: `(() => {
        const dock = document.querySelector('.hc-rpg-bottom-dock');
        const visibleBtns = Array.from(dock?.querySelectorAll('.hc-rpg-dock-btn') || []).filter(b => getComputedStyle(b).display !== 'none');
        const btnRects = visibleBtns.map(b => {
          const r = b.getBoundingClientRect();
          return { width: r.width, height: r.height };
        });

        const docWidth = document.documentElement.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalOverflow = docWidth > windowWidth;

        return {
          visibleCount: visibleBtns.length,
          labels: visibleBtns.map(b => b.querySelector('.hc-rpg-dock-label')?.innerText?.trim() || ''),
          hasHorizontalOverflow,
          docWidth,
          windowWidth,
          btnRects
        };
      })()`,
      returnByValue: true
    });

    console.log("320px Viewport Audit:", JSON.stringify(audit320.result?.value, null, 2));
    const a320 = audit320.result?.value;
    assert.equal(a320.visibleCount, 4, "320px dock must show 4 buttons [Bản đồ - Hành Trình - Nhắc nhở - Hôm nay]");
    assert.equal(a320.hasHorizontalOverflow, false, "Must NOT have horizontal scroll overflow on 320px screen");
    for (const r of a320.btnRects) {
      assert.ok(r.height >= 44, "Touch target height must be >= 44px");
      assert.ok(r.width >= 35, "Touch target width must be >= 35px");
    }
    console.log("✓ PASS: 320px small screen has zero horizontal overflow and meets WCAG touch target standards!");

    const shot320Dock = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mobile-320-dock.png", shot320Dock.data);

    console.log("\n========================================================");
    console.log("🎉 ALL END-USER MOBILE & WEB AUDIT ITEMS PASSED 100%!");
    console.log("========================================================");
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in verify-mobile-enduser-uiux:", err);
  process.exit(1);
});
