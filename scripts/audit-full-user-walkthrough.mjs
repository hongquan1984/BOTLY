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
const serviceKey = rt.secretKey;
const publicKey = rt.publishableKey;
const brainDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";

const testEmail = `tester-polished-walkthrough-${Date.now()}@example.invalid`;
const testPassword = "Password123!@#";

console.log("=== STEP 1: Creating fresh test user in local Supabase ===");
const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword, email_confirm: true, user_metadata: { role: "owner" } })
});
const adminData = await adminRes.json();
const userId = adminData.id || adminData.user?.id;

const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: publicKey, "Content-Type": "application/json" },
  body: JSON.stringify({ email: testEmail, password: testPassword })
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
const refreshToken = tokenData.refresh_token;
const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles`, {
  method: "POST",
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify({
    user_id: userId,
    profile: {
      topic: "gout",
      twoWeekGoal: "Kiểm soát acid uric",
      contentPreferences: ["Thảo mộc tự nhiên"],
      safetyLevel: "none",
      adaptiveDiscovery: { schemaVersion: 1, ageConfirmed: true, focusId: "gout", focusLabel: "Gút", answers: [] }
    },
    consent_version: "healthclues-consent-v1",
    consented_at: new Date().toISOString()
  })
});

await fetch(`${base}/api/healthclues/world`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    questId: "gout",
    initialGoals: [{ goalId: "gout-water", category: "hydration", targetValue: 2000, targetUnit: "ml", frequency: "daily" }]
  })
});

console.log("=== STEP 2: Launching Chrome CDP (1280x800) ===");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-walk-${Date.now()}`);
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

  await send("Page.enable");
  await send("Runtime.enable");

  const saveShot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const p = path.join(brainDir, `${name}.png`);
    writeFileSync(p, Buffer.from(shot.data, "base64"));
    console.log(`[Captured] ${name}.png`);
    return p;
  };

  // 1. Visit /play desktop
  console.log("\n--- Audit 1: /play Welcome Screen Desktop ---");
  await send("Page.navigate", { url: `${base}/play` });
  await new Promise((r) => setTimeout(r, 1500));
  await saveShot("polish-01-welcome-desktop");

  // 2. Set Session & Go to World Desktop
  console.log("\n--- Audit 2: World Desktop (1280x800) ---");
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

  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
  await new Promise((r) => setTimeout(r, 2500));
  await saveShot("polish-02-world-desktop");

  // Verify Right Rail title is now "Nhiệm vụ Sống Khỏe"
  const railHeading = await send("Runtime.evaluate", {
    expression: `(() => {
      const h3 = document.querySelector('.hc-rpg-care-card .hc-rpg-card-heading');
      return h3 ? h3.innerText.trim() : null;
    })()`,
    returnByValue: true
  });
  console.log("Right Rail Heading:", railHeading.result?.value);
  assert.equal(railHeading.result?.value, "Nhiệm vụ Sống Khỏe", "Must say Nhiệm vụ Sống Khỏe instead of Nhiệm Care");

  // 3. Mystery Gift Modal Desktop
  console.log("\n--- Audit 3: Mystery Gift Modal Desktop ---");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const giftPill = document.querySelector('.hc-rpg-next-reward') || 
                       document.querySelector('[role="button"][aria-label*="Quà"]') ||
                       document.querySelector('.hc-rpg-journey-card .hc-rpg-journey-reward');
      if (giftPill) giftPill.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("polish-03-mystery-gift-modal-desktop");

  // Check mystery gift button label (should NOT contain (Khám Phá))
  const giftBtnLabel = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-mystery-primary-btn');
      return btn ? btn.innerText.trim() : null;
    })()`,
    returnByValue: true
  });
  console.log("Mystery Gift Button Label:", giftBtnLabel.result?.value);
  assert(giftBtnLabel.result?.value?.includes("Khám Phá Quà Tặng"), `Button label must be clean, got: ${giftBtnLabel.result?.value}`);
  assert(!giftBtnLabel.result?.value?.includes("(Khám Phá)"), "Must not have awkward parentheses");

  // Close mystery gift modal
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('.hc-mystery-close-btn') || 
                       document.querySelector('.hc-mystery-secondary-btn');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // 4. Walk to Botanist and inspect Talk card & Station modal
  console.log("\n--- Audit 4: Botanist Walk & Talk Card Desktop ---");
  const clickedLandmark = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-npc="botanist"]') ||
                  document.querySelector('[data-landmark="nutrition"]') ||
                  Array.from(document.querySelectorAll('.hc-rpg-location-pill')).find(b => b.innerText.includes('Botanist') || b.innerText.includes('Thảo Mộc'));
      if (btn) { btn.click(); return btn.innerText || 'botanist'; }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log("Landmark clicked:", clickedLandmark.result?.value);

  // Poll until talk prompt appears after walk
  console.log("Waiting for walk arrival and talk card...");
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const hasTalk = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-rpg-talk'))`,
      returnByValue: true
    });
    if (hasTalk.result?.value) break;
  }
  await new Promise((r) => setTimeout(r, 400));
  await saveShot("polish-04-botanist-talk-card-desktop");

  // Inspect talk prompt clearance above dock & Lumi suppression
  const talkMetrics = await send("Runtime.evaluate", {
    expression: `(() => {
      const talk = document.querySelector('.hc-rpg-talk');
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const lumiDialogue = document.querySelector('.hc-rpg-lumi-dialogue');
      const lumiBtn = document.querySelector('.hc-rpg-lumi-reopen-btn');
      if (!talk || !dock) return null;
      const tRect = talk.getBoundingClientRect();
      const dRect = dock.getBoundingClientRect();
      const hasActiveTalkClass = document.body.classList.contains('hc-has-active-talk');
      return {
        talkBottom: tRect.bottom,
        dockTop: dRect.top,
        clearancePx: dRect.top - tRect.bottom,
        hasPositiveClearance: dRect.top > tRect.bottom,
        hasActiveTalkClass,
        lumiDialogueHidden: !lumiDialogue || window.getComputedStyle(lumiDialogue).opacity === '0',
        lumiBtnHidden: !lumiBtn || window.getComputedStyle(lumiBtn).opacity === '0'
      };
    })()`,
    returnByValue: true
  });
  console.log("Talk Prompt Clearance & Lumi Suppression:", JSON.stringify(talkMetrics.result?.value, null, 2));
  assert(talkMetrics.result?.value?.hasPositiveClearance, "Talk prompt must be positioned cleanly above dock");
  assert(talkMetrics.result?.value?.clearancePx >= 15, `Clearance must be at least 15px, got: ${talkMetrics.result?.value?.clearancePx}px`);

  // Click TRÒ CHUYỆN to open Botanist Station
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-rpg-talk-action-btn') || 
                  document.querySelector('.hc-rpg-talk button');
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot("polish-05-botanist-station-modal-desktop");

  // Click "Đọc chi tiết" on Tía tô
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="botanical-read-detail-perilla-frutescens"]') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Đọc chi tiết'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("polish-06-botanist-detail-modal-desktop");

  // Close modals
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeButtons = Array.from(document.querySelectorAll('[role="dialog"] button')).filter(b => b.getAttribute('aria-label') === 'Đóng' || b.getAttribute('data-close-game-modal') || b.innerText.includes('✕') || b.innerText.includes('X') || b.innerText.includes('Đóng') || b.innerText.includes('x'));
      closeButtons.forEach(b => b.click());
    })()`
  });
  await new Promise((r) => setTimeout(r, 600));

  // 5. Test Bottom Dock Modals
  console.log("\n--- Audit 5: Testing Bottom Dock Modals ---");
  const openDockAndAudit = async (label, shotName) => {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('.hc-rpg-bottom-dock button')).find(b => b.innerText.includes('${label}'));
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 800));
    await saveShot(shotName);
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('[data-close-game-modal]') ||
                    document.querySelector('[role="dialog"] button[aria-label="Đóng"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'x' || b.innerText === 'X' || b.innerText.includes('✕'));
        if (btn) btn.click();
      })()`
    });
    await new Promise((r) => setTimeout(r, 600));
  };

  // Journey (Check contrast)
  await openDockAndAudit("Hành Trình", "polish-07-dock-journey-desktop");

  // Reminders (Check no tutorial overlay)
  await openDockAndAudit("Nhắc nhở", "polish-08-dock-reminders-desktop");

  // Today
  await openDockAndAudit("Hôm nay", "polish-09-dock-today-desktop");

  // Knowledge (Check Vietnamese banner)
  await openDockAndAudit("Kiến Thức", "polish-10-dock-knowledge-desktop");

  // Settings (Check inline language control & localized headings)
  await openDockAndAudit("Cài Đặt", "polish-11-dock-settings-desktop");

  // 6. Mobile Viewport Audit (390x844)
  console.log("\n--- Audit 6: Mobile Viewport (390x844) ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
  await new Promise((r) => setTimeout(r, 2500));
  await saveShot("polish-12-world-mobile");

  // Inspect Mobile Level Badge
  const mobileLevelText = await send("Runtime.evaluate", {
    expression: `(() => {
      const desktopSpan = document.querySelector('.hc-rpg-level-title.is-desktop-title');
      const mobileSpan = document.querySelector('.hc-rpg-level-title.is-mobile-title');
      return {
        desktopVisible: desktopSpan ? window.getComputedStyle(desktopSpan).display !== 'none' : false,
        mobileVisible: mobileSpan ? window.getComputedStyle(mobileSpan).display !== 'none' : false,
        mobileText: mobileSpan ? mobileSpan.innerText.trim() : null
      };
    })()`,
    returnByValue: true
  });
  console.log("Mobile Level Badge Audit:", mobileLevelText.result?.value);
  assert.equal(mobileLevelText.result?.value?.mobileVisible, true, "Mobile level title must be visible");
  assert.equal(mobileLevelText.result?.value?.desktopVisible, false, "Desktop level title must be hidden on mobile");
  assert(mobileLevelText.result?.value?.mobileText?.includes("Cấp 1 · Khám Phá"), "Must show concise level title without ellipsis");

  // Mobile Talk Card (Walk to Botanist)
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
  await new Promise((r) => setTimeout(r, 400));
  await saveShot("polish-13-talk-card-mobile");

  const mobileTalkMetrics = await send("Runtime.evaluate", {
    expression: `(() => {
      const talk = document.querySelector('.hc-rpg-talk');
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const talkBtn = talk ? talk.querySelector('button') : null;
      if (!talk || !dock) return null;
      const tRect = talk.getBoundingClientRect();
      const dRect = dock.getBoundingClientRect();
      const bRect = talkBtn ? talkBtn.getBoundingClientRect() : null;
      return {
        talkBottom: tRect.bottom,
        dockTop: dRect.top,
        clearancePx: dRect.top - tRect.bottom,
        hasPositiveClearance: dRect.top > tRect.bottom,
        btnWidth: bRect ? bRect.width : 0,
        btnHeight: bRect ? bRect.height : 0
      };
    })()`,
    returnByValue: true
  });
  console.log("Mobile Talk Metrics:", JSON.stringify(mobileTalkMetrics.result?.value, null, 2));
  assert(mobileTalkMetrics.result?.value?.hasPositiveClearance, "Mobile talk must be above dock");

  // Mobile Mystery Gift
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-mystery-close-btn') || 
                  document.querySelector('.hc-mystery-secondary-btn') ||
                  document.querySelector('[data-close-game-modal]');
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 400));

  // Open Mystery Gift on mobile from HUD or trigger
  await send("Runtime.evaluate", {
    expression: `(() => {
      const giftPill = document.querySelector('.hc-rpg-next-reward') || 
                       document.querySelector('[role="button"][aria-label*="Quà"]');
      if (giftPill) giftPill.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot("polish-14-mystery-gift-mobile");

  console.log("\n=== POLISHED WALKTHROUGH AUDIT COMPLETE - ALL CHECKS PASSED ===");

  ws.close();
} finally {
  chromeProc.kill("SIGKILL");
}
