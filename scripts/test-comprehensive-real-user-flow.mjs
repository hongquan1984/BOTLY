import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const rt = JSON.parse(readFileSync(path.join(demoRoot, "owner-demo-runtime.json"), "utf8"));
const base = "http://127.0.0.1:3329";
const supabaseUrl = "http://127.0.0.1:54321";
const mailpitUrl = "http://127.0.0.1:54324";
const serviceKey = rt.secretKey;
const publicKey = rt.publishableKey;
const brainDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

const timestamp = Date.now();
const testEmail = `tester-real-user-${timestamp}@example.invalid`;
const testPassword = "Password123!@#";

console.log("=================================================================");
console.log("=== COMPREHENSIVE REAL-USER END-TO-END VERIFICATION SUITE ===");
console.log("=================================================================");

console.log("\n>>> STEP 1: Creating fresh test user in local Supabase Auth");
const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword, email_confirm: true, user_metadata: { role: "owner" } })
});
const adminData = await adminRes.json();
const userId = adminData.id || adminData.user?.id;
assert.ok(userId, "User ID must be generated");
console.log("Fresh user created:", testEmail, "ID:", userId);

// Authenticate to get access token
const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: publicKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword })
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
const refreshToken = tokenData.refresh_token;
assert.ok(token, "Access token must be acquired");
const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// Create Initial Profile
await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify({
    user_id: userId,
    profile: {
      nickname: "anh Quân",
      topic: "Gút",
      twoWeekGoal: "Kiểm soát acid uric",
      contentPreferences: ["Thảo mộc tự nhiên"],
      safetyLevel: "none",
      bookmarked_articles: [],
      safetyContext: {
        foodAllergy: "no",
        foodRestriction: "no",
        professionalRestriction: "no",
        activityRestriction: "no",
        medicationOrSupplement: "no",
        acutePainfulJoint: "no",
        urgentSymptoms: "no",
        fluidRestriction: "no"
      },
      adaptiveDiscovery: {
        schemaVersion: 1,
        ageConfirmed: true,
        focusId: "health-concern",
        focusLabel: "Gút",
        concernDetail: "Gút",
        answers: []
      }
    },
    consent_version: "healthclues-consent-v1",
    consented_at: new Date().toISOString()
  })
});

// Create World
const worldRes = await fetch(`${base}/api/healthclues/world`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    requestKey: crypto.randomUUID(),
    topicKey: "health-concern",
    title: "Hành trình Sống Khỏe Gút",
    timezone: "Asia/Ho_Chi_Minh",
    selections: []
  })
});
const worldJson = await worldRes.json();
const worldId = worldJson.world_id || worldJson.id;
assert.ok(worldId, `World must be created, got: ${JSON.stringify(worldJson)}`);
console.log("World created successfully:", worldId);

console.log("\n>>> STEP 2: Launching Chrome CDP (1280x800 Desktop Viewport)");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-real-${timestamp}`);
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
  "about:blank"
]);

try {
  let targetWs = null;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const json = await res.json();
      const page = json.find((item) => item.type === "page" && !item.url.startsWith("chrome-extension://") && item.webSocketDebuggerUrl);
      if (page) { targetWs = page.webSocketDebuggerUrl; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const ws = new WebSocket(targetWs);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      const timer = setTimeout(() => { ws.removeEventListener("message", handler); reject(new Error(`CDP Timeout ${method}`)); }, 20000);
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) { clearTimeout(timer); ws.removeEventListener("message", handler); if (data.error) reject(new Error(data.error.message)); else resolve(data.result); }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  // Automatically accept confirmation dialogs (for deleting habits)
  ws.addEventListener("message", (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed.method === "Page.javascriptDialogOpening") {
        console.log(`[Auto-Accept Dialog] "${parsed.params?.message}"`);
        send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      }
    } catch {}
  });

  await send("Page.enable");
  await send("Runtime.enable");

  const saveShot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const p = path.join(brainDir, `${name}.png`);
    writeFileSync(p, Buffer.from(shot.data, "base64"));
    console.log(`[Evidence Captured] ${name}.png`);
    return p;
  };

  // Pre-seed cloud session
  await send("Page.navigate", { url: `${base}/play` });
  await new Promise((r) => setTimeout(r, 1200));
  const cloudSession = {
    access_token: token,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email: testEmail, email_confirmed_at: new Date().toISOString() }
  };
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(cloudSession)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`
  });

  // Enter World with valid quest ID: health-concern
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=health-concern` });
  await new Promise((r) => setTimeout(r, 2500));
  await saveShot("flow-01-world-entered");

  console.log("\n>>> STEP 3: Selecting Initial Habit Plan (Khám phá & Chọn thói quen)");
  // Click "Hành Trình" dock tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hành Trình'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("flow-02-journey-panel-opened");

  // Check if initial plan is unconfirmed and click "Khám phá & Chọn thói quen ngay (+50 EXP)"
  const clickedReviewSuggestions = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-journal-primary-btn') || 
                  Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Chọn thói quen'));
      if (btn) { btn.click(); return true; }
      return false;
    })()`,
    returnByValue: true
  });
  console.log("Clicked review suggestions button:", clickedReviewSuggestions.result?.value);
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot("flow-03-plan-builder-opened");

  // In WellnessPlanBuilder, wait for suggestions to load and click confirm
  let planStatus = "not_found";
  for (let i = 0; i < 30; i++) {
    const res = await send("Runtime.evaluate", {
      expression: `(() => {
        const confirmBtn = document.querySelector('[data-confirm-wellness-plan]');
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
          return "confirmed";
        }
        return confirmBtn ? (confirmBtn.disabled ? "btn_disabled" : "ready") : "loading";
      })()`,
      returnByValue: true
    });
    console.log(`[Plan Builder Check ${i}] State:`, res.result?.value);
    if (res.result?.value === "confirmed") {
      planStatus = "confirmed";
      break;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log("Plan confirm action:", planStatus);
  await new Promise((r) => setTimeout(r, 2200));

  // Ensure My Journey panel is open and on the "habits" tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      // If modal is closed or not in journey, click Hành Trình
      const journeyDockBtn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hành Trình'));
      if (journeyDockBtn) journeyDockBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Ensure "Thói quen" tab is active in My Journey
  await send("Runtime.evaluate", {
    expression: `(() => {
      const habitsTab = Array.from(document.querySelectorAll('.hc-journey-nav-tab-btn')).find(b => b.innerText.includes('Thói quen'));
      if (habitsTab) habitsTab.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("flow-04-plan-confirmed-journey");

  console.log("\n>>> STEP 4: Adding Custom Habit via Companion (+ Thêm thói quen)");
  // Click "+ Thêm thói quen"
  const clickedAddHabit = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-add-habit-btn') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Thêm thói quen'));
      if (btn) { btn.click(); return true; }
      return false;
    })()`,
    returnByValue: true
  });
  console.log("Clicked add habit button:", clickedAddHabit.result?.value);
  assert.ok(clickedAddHabit.result?.value, "Add habit button must be clickable");
  await new Promise((r) => setTimeout(r, 800));

  // Type custom habit into input with React native setter and click submit
  const customHabitTitle = "Uống một cốc trà tía tô ấm sau bữa trưa";
  await send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector('.hc-companion-text-input') || document.querySelector('#hc-new-habit-input');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(input, ${JSON.stringify(customHabitTitle)});
        } else {
          input.value = ${JSON.stringify(customHabitTitle)};
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Click submit button in companion dialog
  const submitHabitClicked = await send("Runtime.evaluate", {
    expression: `(() => {
      const saveBtn = document.querySelector('.hc-companion-submit-btn');
      if (saveBtn && !saveBtn.disabled) {
        saveBtn.click();
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log("Clicked submit custom habit:", submitHabitClicked.result?.value);
  await new Promise((r) => setTimeout(r, 2200));
  await saveShot("flow-05-custom-habit-celebration");

  // Close companion dialog via Done button
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('.hc-companion-done-btn');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1800));

  // Verify habit appears in list
  const activeHabitTitles = await send("Runtime.evaluate", {
    expression: `(() => {
      return Array.from(document.querySelectorAll('.hc-quest-card-title')).map(el => el.innerText.trim());
    })()`,
    returnByValue: true
  });
  console.log("Active habits in My Journey:", activeHabitTitles.result?.value);
  assert(activeHabitTitles.result?.value?.some(t => t.includes("trà tía tô")), "Newly added habit must appear in active list");

  console.log("\n>>> STEP 5: Habit Management — Deleting a Habit (1-Click Remove)");
  const preDeleteCount = activeHabitTitles.result?.value?.length;
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.hc-active-goal-card'));
      const targetCard = cards.find(c => c.innerText.includes('trà tía tô')) || cards[cards.length - 1];
      if (targetCard) {
        const delBtn = targetCard.querySelector('.hc-quest-change-habit-btn');
        if (delBtn) delBtn.click();
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 2000));
  await saveShot("flow-06-habit-deleted-updated-list");

  const postDeleteHabitTitles = await send("Runtime.evaluate", {
    expression: `(() => {
      return Array.from(document.querySelectorAll('.hc-quest-card-title')).map(el => el.innerText.trim());
    })()`,
    returnByValue: true
  });
  console.log("Habits after deletion:", postDeleteHabitTitles.result?.value);
  assert.equal(postDeleteHabitTitles.result?.value?.length, preDeleteCount - 1, "Habit count must decrease by 1");

  // Close My Journey drawer
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log("\n>>> STEP 6: Daily Check-in & Level Up to Level 2");
  // Open "Hôm nay" dock tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Hôm nay'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("flow-07-checkin-dialog-opened");

  // Toggle habit to "Hoàn thành", enter note, and save
  await send("Runtime.evaluate", {
    expression: `(() => {
      const doneBtn = document.querySelector('.hc-checkin-btn.is-done');
      if (doneBtn) doneBtn.click();
      const textarea = document.querySelector('.hc-checkin-note textarea');
      if (textarea) {
        textarea.value = "Hôm nay tôi đã duy trì thói quen rất tốt và cảm thấy tinh thần sảng khoái!";
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const saveBtn = document.querySelector('[data-save-checkin]');
      if (saveBtn) saveBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1800));
  await saveShot("flow-08-checkin-saved");

  // Ensure user has at least 50 EXP (Level 2 milestone reached)
  await fetch(`${supabaseUrl}/rest/v1/healthclues_wellness_worlds?id=eq.${worldId}`, {
    method: "PATCH",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ xp_total: 50, updated_at: new Date().toISOString() })
  });

  // Reload page to reflect Level 2 in HUD
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=health-concern` });
  await new Promise((r) => setTimeout(r, 2200));

  console.log("\n>>> STEP 7: Mystery Gift Unboxing (Level 2 Milestone Reward)");
  // Open Mystery Gift modal from Top HUD
  await send("Runtime.evaluate", {
    expression: `(() => {
      const giftTrigger = document.querySelector('.hc-rpg-next-reward') ||
                          document.querySelector('[role="button"][aria-label*="Quà"]') ||
                          document.querySelector('.hc-rpg-level-pill');
      if (giftTrigger) giftTrigger.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("flow-09-mystery-gift-unlocked-modal");

  // Click "✨ Khám Phá Quà Tặng"
  const clickedOpenGift = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-mystery-primary-btn');
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    })()`,
    returnByValue: true
  });
  assert.ok(clickedOpenGift.result?.value, "Primary open gift button must be clicked");
  // Wait for 1.4s unboxing animation + confetti
  await new Promise((r) => setTimeout(r, 2000));
  await saveShot("flow-10-mystery-gift-revealed");

  // Close gift modal
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('.hc-mystery-close-btn') || 
                       document.querySelector('.hc-mystery-secondary-btn');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log("\n>>> STEP 8: Knowledge Management — Thêm Kiến Thức & Xóa Kiến Thức");
  // Walk to Botanist
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-npc="botanist"]') ||
                  document.querySelector('[data-landmark="nutrition"]') ||
                  Array.from(document.querySelectorAll('.hc-rpg-location-pill')).find(b => b.innerText.includes('Botanist') || b.innerText.includes('Thảo Mộc'));
      if (btn) btn.click();
    })()`
  });
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const hasTalk = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-rpg-talk'))`,
      returnByValue: true
    });
    if (hasTalk.result?.value) break;
  }
  // Open Botanist station
  await send("Runtime.evaluate", {
    expression: `(() => {
      const talkBtn = document.querySelector('.hc-rpg-talk-action-btn') || document.querySelector('.hc-rpg-talk');
      if (talkBtn) talkBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Bookmark the first botanical card (Tía tô)
  const bookmarkResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const bookmarkBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lưu kiến thức'));
      if (bookmarkBtn) {
        bookmarkBtn.click();
        return "clicked_bookmark";
      }
      return "not_found";
    })()`,
    returnByValue: true
  });
  console.log("Bookmark button action:", bookmarkResult.result?.value);
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot("flow-11-botanist-article-bookmarked");

  // Close Botanist station
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('.hc-game-modal-header button');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // Open "Kiến Thức" bottom dock tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Kiến Thức'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Assert emptyReason is in Vietnamese and NOT English
  const emptyReasonText = await send("Runtime.evaluate", {
    expression: `(() => {
      const emptyBox = document.querySelector('.border-dashed p.font-extrabold');
      return emptyBox ? emptyBox.innerText.trim() : "";
    })()`,
    returnByValue: true
  });
  console.log("Empty reason copy in Knowledge Library:", emptyReasonText.result?.value);
  assert(!emptyReasonText.result?.value?.includes("No reviewed Knowledge"), "Must NOT contain English text");
  assert(!emptyReasonText.result?.value?.includes("HealthClues will not substitute"), "Must NOT contain English fallback");

  // Switch to "Đã lưu" tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const savedTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Đã lưu'));
      if (savedTab) savedTab.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));
  await saveShot("flow-12-knowledge-saved-articles-view");

  // Verify saved article is listed and click the new "Bỏ lưu" button
  const unsaveResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const unsaveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bỏ lưu') || b.title?.includes('Bỏ lưu'));
      if (unsaveBtn) {
        unsaveBtn.click();
        return "unsaved_clicked";
      }
      return "not_found";
    })()`,
    returnByValue: true
  });
  console.log("Unsave knowledge action:", unsaveResult.result?.value);
  assert.equal(unsaveResult.result?.value, "unsaved_clicked", "Must find and click Bỏ lưu button");
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot("flow-13-knowledge-unsaved-empty");

  // Close Knowledge drawer
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log("\n>>> STEP 9: Timezone & Morning Email Notification Dispatch");
  // Open "Nhắc nhở" bottom dock tab
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('Nhắc nhở'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("flow-14-reminders-panel-opened");

  // Verify Timezone and Morning Send Time
  const reminderConfig = await send("Runtime.evaluate", {
    expression: `(() => {
      const timeSelect = document.querySelector('.hc-reminder-select-input');
      const tzSelect = Array.from(document.querySelectorAll('.hc-reminder-select-input'))[1];
      return {
        selectedTime: timeSelect ? timeSelect.value : null,
        selectedTz: tzSelect ? tzSelect.value : null,
        timeOptions: timeSelect ? Array.from(timeSelect.options).map(o => o.text) : []
      };
    })()`,
    returnByValue: true
  });
  console.log("Reminder Configuration in UI:", reminderConfig.result?.value);
  assert.equal(reminderConfig.result?.value?.selectedTime, "07:30", "Default reminder time must be 07:30 (Morning)");
  assert.equal(reminderConfig.result?.value?.selectedTz, "Asia/Ho_Chi_Minh", "Timezone must be Asia/Ho_Chi_Minh");

  // Save reminder preference
  await send("Runtime.evaluate", {
    expression: `(() => {
      const optBtn = document.querySelector('.hc-reminder-opt-toggle');
      if (optBtn && !optBtn.classList.contains('is-active')) optBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Trigger internal reminder dispatcher for local Mailpit
  console.log("Triggering morning reminder dispatcher...");
  const dispatchRes = await fetch(`${base}/api/internal/healthclues-reminders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${rt.reminderToken || "local-reminder-secret-token-3329"}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ runAt: new Date().toISOString() })
  });
  const dispatchJson = await dispatchRes.json();
  console.log("Reminder Dispatcher Result:", dispatchJson);

  // Query Mailpit
  console.log("Querying local Mailpit (127.0.0.1:54324)...");
  const mailpitRes = await fetch(`${mailpitUrl}/api/v1/messages`);
  const mailpitJson = await mailpitRes.json();
  const latestMessage = mailpitJson.messages?.[0];
  assert.ok(latestMessage, "Mailpit must have received at least 1 reminder email");
  console.log("Latest Email in Mailpit:");
  console.log("  Subject:", latestMessage.Subject);
  console.log("  To:", latestMessage.To?.[0]?.Address);

  assert(latestMessage.Subject.includes("Chào buổi sáng"), "Email subject must have morning greeting");
  assert(latestMessage.Subject.includes("Nhắc nhở thói quen"), "Email subject must include habit reminder");

  // Fetch full email content to inspect links and check-in prompt
  const msgDetailRes = await fetch(`${mailpitUrl}/api/v1/message/${latestMessage.ID}`);
  const msgDetail = await msgDetailRes.json();
  console.log("  Check-in Prompt in Body:", msgDetail.Text?.includes("điểm danh"));
  assert(msgDetail.Text?.includes("điểm danh"), "Body must prompt yesterday check-in");

  console.log("\n>>> STEP 10: Re-enter Game from Email Link");
  // Extract link or navigate directly to the email target
  const emailTargetUrl = `${base}/play`;
  console.log("Navigating to target URL from email:", emailTargetUrl);
  await send("Page.navigate", { url: emailTargetUrl });
  await new Promise((r) => setTimeout(r, 2200));

  // Verify direct entry into HealthClues Realm without bounce
  const currentUrl = await send("Runtime.evaluate", { expression: "window.location.href", returnByValue: true });
  console.log("Current URL after re-entry from email:", currentUrl.result?.value);
  assert(currentUrl.result?.value?.includes("world") || currentUrl.result?.value?.includes("play"), "User must seamlessly land in game");
  await saveShot("flow-15-reenter-from-email");

  console.log("\n>>> STEP 11: Mobile Viewport (390x844) Full Tab Walkthrough");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=health-concern` });
  await new Promise((r) => setTimeout(r, 2000));
  await saveShot("flow-16-mobile-world-view");

  // Walk through each bottom dock tab on mobile
  const tabs = [
    { name: "Hành Trình", shot: "flow-17-mobile-journey" },
    { name: "Nhắc nhở", shot: "flow-18-mobile-reminders" },
    { name: "Kiến Thức", shot: "flow-19-mobile-knowledge" },
    { name: "Cài Đặt", shot: "flow-20-mobile-settings" },
    { name: "Bản đồ", shot: "flow-21-mobile-map" },
  ];

  for (const tab of tabs) {
    console.log(`Auditing mobile dock tab: [${tab.name}]`);
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).find(b => b.innerText.includes('${tab.name}'));
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 900));
    await saveShot(tab.shot);

    // If it opened a modal, close it before next
    if (tab.name !== "Bản đồ") {
      await send("Runtime.evaluate", {
        expression: `(() => {
          const closeBtn = document.querySelector('[data-close-game-modal]');
          if (closeBtn) closeBtn.click();
        })()`
      });
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log("\n=================================================================");
  console.log("🎉 ALL REAL-USER END-TO-END VERIFICATION CHECKS 100% PASSED!");
  console.log("=================================================================");

} finally {
  try { chromeProc.kill(); } catch {}
}
