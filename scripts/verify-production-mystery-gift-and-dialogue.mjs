import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";

const root = "d:\\botly";
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const prodBase = "https://www.botly.vn";

mkdirSync(artifactsDir, { recursive: true });

const env = nextEnv.loadEnvConfig(root).combinedEnv;
const supabaseUrl = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
const publicKey = env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

assert.ok(supabaseUrl, "SUPABASE_URL is required");
assert.ok(serviceKey, "SUPABASE_SECRET_KEY is required");
assert.ok(publicKey, "SUPABASE_PUBLISHABLE_KEY is required");

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  const fullPath = path.join(artifactsDir, filename);
  writeFileSync(fullPath, buf);
  console.log(`✓ Saved screenshot: ${fullPath} (${buf.length} bytes)`);
  return fullPath;
}

async function main() {
  console.log("==========================================================================");
  console.log("PRODUCTION REAL CHROMIUM VISUAL QA: NPC DIALOGUE & MYSTERY GIFT MODAL");
  console.log(`Target: ${prodBase}`);
  console.log("==========================================================================");

  let userId = null;
  const testEmail = `qa-prod-test-${Date.now()}@example.invalid`;
  const testPassword = `Pass_${randomUUID()}_!1aA`;

  // 1. Create temporary test user in Supabase Auth
  console.log("\n1. Creating temporary test user in Supabase Auth...");
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: "owner", suite: "qa-prod-test" },
    }),
  });
  assert.ok(adminRes.ok, `Admin user creation failed: ${adminRes.status}`);
  const adminData = await adminRes.json();
  userId = adminData.id || adminData.user?.id;
  console.log(`  -> Temporary user created: ${userId}`);

  // 2. Sign in to obtain access token
  console.log("2. Signing in to obtain access token...");
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  assert.ok(tokenRes.ok, `Token login failed: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("  -> Access token acquired successfully!");

  // 3. Initialize World and Profile on Production
  console.log("3. Initializing World & Profile on production...");
  const profilePayload = {
    topic: "Giấc ngủ ngon",
    twoWeekGoal: "Thiết lập nhịp sinh học và ngủ sâu hơn",
    contentPreferences: ["Đọc sách", "Thiên nhiên"],
    presentation: "Kết hợp",
    comfortableActivityTime: "15 phút",
    refreshFrequency: "Hằng tuần",
    safetyLevel: "none",
    specificInterests: ["Dễ vào giấc", "Thư giãn sâu"],
    safetyContext: {},
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId: "sleep",
      focusLabel: "Giấc ngủ ngon",
      answers: [],
    },
  };

  await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      profile: profilePayload,
      consent_version: "healthclues-consent-v1",
      consented_at: new Date().toISOString(),
    }),
  });

  const worldRes = await fetch(`${prodBase}/api/healthclues/world`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      requestKey: randomUUID(),
      topicKey: "sleep-better",
      title: "Thung lũng Giấc ngủ",
      timezone: "Asia/Bangkok",
      startedOn: "2026-11-01",
      selections: [],
    }),
  });
  const worldData = await worldRes.json();
  const worldId = worldData.world_id || worldData.world?.id || worldData.id;
  console.log(`  -> World created: ${worldId}`);

  // Attach wellness plan
  await fetch(`${prodBase}/api/healthclues/plan`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      requestKey: randomUUID(),
      confirmed: true,
      goals: [
        {
          goalId: "goal-sleep-reading",
          title: "Thói quen đọc sách trước khi ngủ",
          category: "sleep",
          iconKey: "sleep.reading",
          goalType: "maintain",
          choice: "active",
          frequency: "Daily",
          trackingUnit: "phút",
          trackingDefinition: "Đọc sách 10 phút trước khi ngủ",
          targetValue: 10,
          targetUnit: "phút",
          durationDays: 30,
          durationMinutes: 10,
          safetyStatus: "user_created_unreviewed",
          provenance: "user_created",
          evidenceStatus: "USER-CREATED · NOT REVIEWED",
          explanation: "Đọc sách trước khi ngủ",
          userSafetyConfirmation: true,
          sources: [],
        },
      ],
    }),
  });

  // Mark introductory guide complete
  await fetch(`${prodBase}/api/healthclues/guide`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      stage: "completed",
    }),
  });
  console.log("  -> World setup completed!");

  // 4. Launch Chromium
  console.log("\n4. Launching real Google Chrome headless...");
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-prod-qa-${Date.now()}`);
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
        const timer = setTimeout(() => {
          ws.removeEventListener("message", handler);
          reject(new Error(`CDP Timeout waiting for ${method} (id=${id})`));
        }, 15000);

        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            clearTimeout(timer);
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

    // Establish origin on www.botly.vn
    console.log("5. Navigating to https://www.botly.vn to establish origin...");
    await send("Page.navigate", { url: prodBase });
    await new Promise((r) => setTimeout(r, 1500));

    // Inject session
    console.log("6. Injecting authenticated session into localStorage...");
    const sessionObj = {
      access_token: token,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
      user: {
        id: userId,
        email: testEmail,
        email_confirmed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      },
    };

    await send("Runtime.evaluate", {
      expression: `(() => {
        const session = ${JSON.stringify(sessionObj)};
        localStorage.setItem('botly-cloud-session', JSON.stringify(session));
        localStorage.setItem('healthclues-player-locale-v1', 'vi');
        localStorage.setItem('healthclues-player-locale-owner-v1', '${userId}');
        localStorage.setItem('healthclues-player-locale-v1:${userId}', 'vi');
        document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
      })()`,
    });

    // Navigate to World
    console.log("7. Navigating to https://www.botly.vn/vi/wellness/healthclues/world?quest=sleep-better...");
    await send("Page.navigate", { url: `${prodBase}/vi/wellness/healthclues/world?quest=sleep-better` });

    // Wait for world map and bottom dock
    let worldLoaded = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 600));

      // Click "Vào ngay Cõi Sống Khỏe" button if present
      await send("Runtime.evaluate", {
        expression: `(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b =>
            b.innerText.includes('Vào ngay') || b.innerText.includes('Enter')
          );
          if (btn) btn.click();
          const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                              Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                                b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                              );
          if (skipTourBtn) skipTourBtn.click();
        })()`,
      });

      const check = await send("Runtime.evaluate", {
        expression: `(() => {
          return {
            hasMap: Boolean(document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]')),
            hasDock: Boolean(document.querySelector('.hc-rpg-bottom-dock')),
            hasLumi: Boolean(document.querySelector('.hc-rpg-lumi-dialogue')),
            url: window.location.href,
          };
        })()`,
        returnByValue: true,
      });

      if (check.result?.value?.hasDock) {
        worldLoaded = true;
        console.log(`✓ World and bottom dock loaded at step ${i}!`);
        break;
      }
      if (i % 5 === 0) console.log(`[Wait step ${i}]`, check.result?.value);
    }
    assert.ok(worldLoaded, "Production World failed to load dock/map.");

    // Dismiss tour or modals
    await send("Runtime.evaluate", {
      expression: `(() => {
        const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                            Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                              b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                            );
        if (skipTourBtn) skipTourBtn.click();
        const closeBtn = document.querySelector('[data-close-game-modal]');
        if (closeBtn) closeBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // =========================================================================
    // TEST 1: NPC/Lumi Dialogue Box above Bottom Dock (Desktop, Tablet, Mobile)
    // =========================================================================
    console.log("\n==========================================================================");
    console.log("TEST 1: NPC/Lumi Dialogue Box vs Bottom Dock Clearance (4 Resolutions)");
    console.log("==========================================================================");

    const resolutions = [
      { name: "desktop_1280", width: 1280, height: 800, mobile: false },
      { name: "tablet_768", width: 768, height: 1024, mobile: true },
      { name: "mobile_390", width: 390, height: 844, mobile: true },
      { name: "mobile_375", width: 375, height: 667, mobile: true },
    ];

    const dialogueResults = [];

    for (const res of resolutions) {
      console.log(`\nTesting Resolution: ${res.name} (${res.width}x${res.height})`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: res.width,
        height: res.height,
        deviceScaleFactor: 1,
        mobile: res.mobile,
      });
      await new Promise((r) => setTimeout(r, 800));

      const measurement = await send("Runtime.evaluate", {
        expression: `(() => {
          const lumi = document.querySelector('.hc-rpg-lumi-dialogue');
          const dock = document.querySelector('.hc-rpg-bottom-dock');
          if (!lumi || !dock) return { found: false, hasLumi: Boolean(lumi), hasDock: Boolean(dock) };

          const lumiRect = lumi.getBoundingClientRect();
          const dockRect = dock.getBoundingClientRect();
          const clearance = dockRect.top - lumiRect.bottom;
          const isOverlapping = lumiRect.bottom > dockRect.top;
          const isCompletelyAbove = lumiRect.bottom <= dockRect.top;

          return {
            found: true,
            isCompletelyAbove,
            isOverlapping,
            clearancePx: clearance,
            lumiRect: {
              top: lumiRect.top,
              bottom: lumiRect.bottom,
              left: lumiRect.left,
              right: lumiRect.right,
              height: lumiRect.height
            },
            dockRect: {
              top: dockRect.top,
              bottom: dockRect.bottom,
              left: dockRect.left,
              right: dockRect.right,
              height: dockRect.height
            }
          };
        })()`,
        returnByValue: true,
      });

      const data = measurement.result?.value;
      console.log(`Resolution ${res.name} measurement:`, data);
      dialogueResults.push({ ...res, ...data });

      // Assert clearance is strictly positive (isCompletelyAbove === true)
      assert.ok(data.found, `Lumi dialogue and dock must be found on ${res.name}`);
      assert.equal(data.isOverlapping, false, `Lumi dialogue MUST NOT overlap dock on ${res.name}!`);
      assert.ok(data.isCompletelyAbove, `Lumi dialogue MUST be completely above dock on ${res.name}!`);
      assert.ok(data.clearancePx >= 0, `Clearance must be >= 0px on ${res.name} (actual: ${data.clearancePx}px)`);

      // Capture verified screenshot for mobile 390
      if (res.name === "mobile_390") {
        const shot = await send("Page.captureScreenshot", { format: "png" });
        saveScreenshot("verified-npc-dialogue-above-menu.png", shot.data);
      }
    }

    console.log("\n✓ PASS: NPC Dialogue is completely above dock across ALL 4 resolutions!");
    console.table(dialogueResults.map(d => ({
      resolution: d.name,
      clearancePx: d.clearancePx?.toFixed(2) + "px",
      isCompletelyAbove: d.isCompletelyAbove,
      isOverlapping: d.isOverlapping,
    })));

    // =========================================================================
    // TEST 2: Mystery Gift Box on Top HUD & Day 7 Card
    // =========================================================================
    console.log("\n==========================================================================");
    console.log("TEST 2: Mystery Gift Box Presentation on Top HUD & Day 7 Card");
    console.log("==========================================================================");

    // Switch back to desktop 1280
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 800));

    const giftAudit = await send("Runtime.evaluate", {
      expression: `(() => {
        const nextReward = document.querySelector('.hc-rpg-next-reward');
        const day7Box = document.querySelector('.hc-rpg-day7-box');
        const topText = nextReward ? nextReward.innerText : '';
        const day7Text = day7Box ? day7Box.innerText : '';

        const hasGiftIconTop = topText.includes('🎁') || Boolean(nextReward?.querySelector('.hc-rpg-mystery-icon'));
        const hasMysteryTextTop = topText.includes('Hộp Quà Bí Ẩn') || /mystery gift/i.test(topText);
        const spoilsLantern = topText.includes('Đèn lồng Ánh Sao');

        const hasGiftIconDay7 = day7Text.includes('🎁') || Boolean(day7Box?.querySelector('.hc-rpg-day7-icon-box'));
        const hasMysteryTextDay7 = day7Text.includes('Hộp Quà Bí Ẩn') || /mystery gift/i.test(day7Text);
        const spoilsPerseverance = day7Text.includes('Huy hiệu Người Kiên Trì');

        return {
          hasTopReward: Boolean(nextReward),
          topRewardText: topText.trim(),
          hasGiftIconTop,
          hasMysteryTextTop,
          spoilsLantern,
          hasDay7Box: Boolean(day7Box),
          day7Text: day7Text.trim(),
          hasGiftIconDay7,
          hasMysteryTextDay7,
          spoilsPerseverance,
        };
      })()`,
      returnByValue: true,
    });

    console.log("Mystery Gift Audit on HUD:", giftAudit.result?.value);
    const hud = giftAudit.result?.value;

    assert.ok(hud.hasTopReward, "Top HUD must have next reward pill");
    assert.ok(hud.hasGiftIconTop, "Top HUD reward must show 🎁 mystery icon");
    assert.ok(hud.hasMysteryTextTop, "Top HUD reward title must say 'Hộp Quà Bí Ẩn 🎁'");
    assert.equal(hud.spoilsLantern, false, "Top HUD MUST NOT spoil 'Đèn lồng Ánh Sao' beforehand!");

    assert.ok(hud.hasDay7Box, "Day 7 card must have milestone reward box");
    assert.ok(hud.hasGiftIconDay7, "Day 7 reward must show 🎁 mystery icon");
    assert.ok(hud.hasMysteryTextDay7, "Day 7 reward title must say 'Hộp Quà Bí Ẩn Ngày 7 🎁'");
    assert.equal(hud.spoilsPerseverance, false, "Day 7 reward MUST NOT spoil 'Huy hiệu Người Kiên Trì' beforehand!");

    console.log("✓ PASS: Both Top HUD and Day 7 Card display Mystery Gift Box without spoiling item name!");

    // Capture HUD proof
    const hudShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mystery-gift-box-hud.png", hudShot.data);

    // =========================================================================
    // TEST 3: Mystery Gift Unboxing Effect & Modal
    // =========================================================================
    console.log("\n==========================================================================");
    console.log("TEST 3: Mystery Gift Unboxing Interaction, Animation & Reveal");
    console.log("==========================================================================");

    // Click Top HUD Mystery Gift Box to open Modal
    console.log("Clicking Top HUD Mystery Gift Box...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const giftBox = document.querySelector('.hc-rpg-next-reward');
        if (giftBox) giftBox.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify Modal Opened
    const modalCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-mystery-modal-backdrop') || document.querySelector('[role="dialog"]');
        const boxContainer = document.querySelector('.hc-mystery-box-container');
        const qmark = document.querySelector('.hc-mystery-qmark');
        const sparkles = Array.from(document.querySelectorAll('.hc-mystery-sparkle-dot')).map(el => el.innerText);

        return {
          hasModal: Boolean(modal),
          hasBoxContainer: Boolean(boxContainer),
          hasQmark: Boolean(qmark),
          sparkles,
          modalTitle: document.querySelector('.hc-mystery-header-title')?.innerText?.trim(),
        };
      })()`,
      returnByValue: true,
    });
    console.log("Initial Modal State:", modalCheck.result?.value);
    assert.ok(modalCheck.result?.value?.hasModal, "Mystery Gift Modal backdrop must be visible!");
    assert.ok(modalCheck.result?.value?.hasBoxContainer, "Mystery Gift Box graphic must be present in center!");

    // Click the Mystery Box inside Modal to trigger UNBOXING EFFECT
    console.log("\nClicking Mystery Box in Modal to trigger unboxing animation...");
    await send("Runtime.evaluate", {
      expression: `(() => {
        const box = document.querySelector('.hc-mystery-box-container');
        if (box) box.click();
      })()`,
    });

    // Check opening state after 300ms (particles, sunburst, popped lid, light beam)
    await new Promise((r) => setTimeout(r, 400));
    const openingCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const isOpening = Boolean(document.querySelector('.hc-mystery-box-container.is-opening'));
        const lidPopped = Boolean(document.querySelector('.hc-mystery-lid.lid-popped'));
        const hasSunburst = Boolean(document.querySelector('.hc-mystery-sunburst'));
        const hasLightBeam = Boolean(document.querySelector('.hc-mystery-light-beam'));
        const particlesCount = document.querySelectorAll('.hc-mystery-particle').length;

        return {
          isOpening,
          lidPopped,
          hasSunburst,
          hasLightBeam,
          particlesCount,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Opening Animation State:", openingCheck.result?.value);
    assert.ok(openingCheck.result?.value?.isOpening, "Box must have .is-opening class during unboxing animation");
    assert.ok(openingCheck.result?.value?.lidPopped, "Box lid must pop open with .lid-popped class");
    assert.ok(openingCheck.result?.value?.hasSunburst, "Sunburst aura must rotate behind box");
    assert.ok(openingCheck.result?.value?.hasLightBeam, "Light beam must erupt from inside box");
    assert.ok(openingCheck.result?.value?.particlesCount > 0, "Confetti and sparkle particles must be generated");

    // Wait for the full 1400ms timer to complete reveal
    console.log("Waiting for reveal stage transition (1400ms)...");
    await new Promise((r) => setTimeout(r, 1200));

    // Inspect Revealed State
    const revealedCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const isRevealedCard = Boolean(document.querySelector('.hc-mystery-modal-card.is-revealed'));
        const revealedContainer = document.querySelector('.hc-mystery-revealed-container');
        const halo = Boolean(document.querySelector('.hc-revealed-halo'));
        const rewardTitle = document.querySelector('.hc-revealed-title')?.innerText?.trim();
        const rewardBadge = document.querySelector('.hc-revealed-badge')?.innerText?.trim();
        const rewardDesc = document.querySelector('.hc-revealed-desc')?.innerText?.trim();
        const bonusExp = document.querySelector('.hc-revealed-exp-pill')?.innerText?.trim();
        const claimBtn = document.querySelector('.hc-revealed-claim-btn')?.innerText?.trim();

        return {
          isRevealedCard,
          hasRevealedContainer: Boolean(revealedContainer),
          hasHalo: halo,
          rewardTitle,
          rewardBadge,
          rewardDesc,
          bonusExp,
          claimBtn,
        };
      })()`,
      returnByValue: true,
    });
    console.log("Revealed Reward State:", revealedCheck.result?.value);
    assert.ok(revealedCheck.result?.value?.hasRevealedContainer, "Revealed reward container must be displayed");
    assert.ok(revealedCheck.result?.value?.hasHalo, "Glowing halo must encircle revealed reward");
    assert.ok(revealedCheck.result?.value?.rewardTitle, "Reward title must be displayed");
    console.log(`✓ Revealed Reward: "${revealedCheck.result?.value?.rewardTitle}" (${revealedCheck.result?.value?.rewardBadge})`);

    // Capture Unboxing Modal proof
    const modalShot = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-mystery-gift-opening-modal.png", modalShot.data);

    console.log("\n==========================================================================");
    console.log("🎉 ALL PRODUCTION QA TESTS PASSED WITH 100% SUCCESS!");
    console.log("==========================================================================");

  } finally {
    console.log("\nCleaning up test user & browser...");
    try { chromeProc.kill(); } catch {}
    if (userId) {
      try {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        console.log(`  -> Temporary test user ${userId} cleaned up.`);
      } catch (e) {
        console.warn("Cleanup error:", e.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("QA FAILURE:", err);
    process.exit(1);
  });
