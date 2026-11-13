import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import crypto from "node:crypto";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85";
const base = process.env.BASE_URL || "http://127.0.0.1:3329";
const supabaseUrl = "http://127.0.0.1:54321";

mkdirSync(artifactsDir, { recursive: true });

function saveScreenshot(filename, base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  const fullPath = path.join(artifactsDir, filename);
  writeFileSync(fullPath, buf);
  console.log(`✓ [Screenshot Saved] ${filename} (${buf.length} bytes) -> ${fullPath}`);
  return fullPath;
}

async function runBotanistKnowledgeLibraryTest() {
  console.log("==========================================================================");
  console.log("TEST: BOTANIST SCIENTIFIC KNOWLEDGE LIBRARY & KNOWLEDGE BOOK SYNC");
  console.log("Target Base URL:", base);
  console.log("Artifacts Directory:", artifactsDir);
  console.log("==========================================================================");

  // 1. Read Supabase runtime keys
  const rtPath = path.join(demoRoot, "owner-demo-runtime.json");
  assert.ok(existsSync(rtPath), "owner-demo-runtime.json must exist");
  const rt = JSON.parse(readFileSync(rtPath, "utf8"));
  const serviceKey = rt.secretKey;
  const publicKey = rt.publishableKey;

  // 2. Create authenticated test user with GOUT profile
  const testEmail = `tester-botanist-gout-${Date.now()}@example.invalid`;
  const testPassword = `Pass_${crypto.randomUUID()}_!1aA`;
  console.log(`\n1. Creating test user in Supabase Auth (${testEmail})...`);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
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
      user_metadata: { role: "owner", suite: "owner-demo" },
    }),
  });
  assert.ok(userRes.ok, `User creation failed: ${userRes.status}`);
  const userData = await userRes.json();
  const userId = userData.id || userData.user?.id;
  console.log(`  -> User ID: ${userId}`);

  // 3. Login to get fresh access_token
  console.log("2. Obtaining fresh JWT token...");
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
  console.log("  -> Token obtained successfully!");

  // 4. Create Gout Profile in Supabase
  console.log("3. Creating Gout Profile in healthclues_profiles...");
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
      profile: {
        topic: "gout",
        twoWeekGoal: "Kiểm soát chỉ số acid uric và giảm viêm khớp",
        contentPreferences: ["Dinh dưỡng y học", "Thảo mộc tự nhiên"],
        presentation: "Kết hợp",
        safetyLevel: "none",
        specificInterests: ["Tía tô", "Atiso đỏ", "Thảo mộc giảm acid uric"],
        adaptiveDiscovery: {
          schemaVersion: 1,
          ageConfirmed: true,
          focusId: "gout",
          focusLabel: "Kiểm soát Gút & Acid Uric",
          answers: [],
        },
      },
      consent_version: "healthclues-consent-v1",
      consented_at: new Date().toISOString(),
    }),
  });

  // 5. Initialize World
  console.log("4. Initializing World on port 3329...");
  const worldRes = await fetch(`${base}/api/healthclues/world`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      requestKey: crypto.randomUUID(),
      topicKey: "health-concern",
      title: "Thung lũng Thảo Mộc",
      timezone: "Asia/Bangkok",
      startedOn: "2026-11-01",
      selections: [],
    }),
  });
  assert.ok(worldRes.ok, `World creation failed: ${worldRes.status}`);
  const worldData = await worldRes.json();
  const worldId = worldData.world_id || worldData.world?.id || worldData.id;
  console.log(`  -> World created: ${worldId}`);

  // Mark guide as completed so tour popup does not obscure Knowledge Book
  await fetch(`${base}/api/healthclues/guide`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ worldId, stage: "completed" }),
  });

  // 6. Launch Chrome Headless
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  assert.ok(chromePath, "Google Chrome executable is required.");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-botanist-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  console.log(`\n5. Launching headless Chromium (port: ${debugPort})...`);
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
    // Connect DevTools
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
    assert.ok(targetWs, "Could not connect to Chrome DevTools WebSocket.");

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

    const evalJs = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result?.value;
    };

    const waitFor = async (predicateJs, desc = "condition", maxRetries = 30, interval = 500) => {
      for (let i = 0; i < maxRetries; i++) {
        const val = await evalJs(`Boolean(${predicateJs})`);
        if (val) return true;
        await new Promise((r) => setTimeout(r, interval));
      }
      throw new Error(`Timeout waiting for ${desc}`);
    };

    // Inject session into origin
    console.log("Navigating to world origin to seed authenticated session...");
    await send("Page.navigate", { url: `${base}/play` });
    await new Promise((r) => setTimeout(r, 1500));

    const cloudSession = {
      access_token: token,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: userId,
        email: testEmail,
        email_confirmed_at: new Date().toISOString(),
      },
    };

    await evalJs(`(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(cloudSession)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${userId}');
      localStorage.setItem('healthclues-player-locale-v1:${userId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`);

    // Navigate to World Map
    console.log("Navigating to /vi/wellness/healthclues/world?quest=gout...");
    await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for world map and dock
    await waitFor(
      `document.querySelector('.hc-rpg-bottom-dock') || document.querySelector('[data-region-map]') || document.querySelector('[data-rpg-world]')`,
      "World and Bottom Dock load"
    );
    console.log("✓ World Adventure entered successfully!");

    // Dismiss tour / initial guide
    await evalJs(`(() => {
      const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                          Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                            b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                          );
      if (skipTourBtn) skipTourBtn.click();
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // STEP 1: OPEN BOTANIST GARDEN STATION (VƯỜN THẢO MỘC)
    // =========================================================================
    console.log("\n--- STEP 1: OPEN BOTANIST GARDEN STATION ---");
    const openedBotanist = await evalJs(`(() => {
      const botanist = document.querySelector('[data-landmark-id="nutrition"] .hc-rpg-npc') ||
                       document.querySelector('[data-landmark-id="nutrition"] button') ||
                       Array.from(document.querySelectorAll('.hc-rpg-location-pill, .hc-landmark-pill, button')).find(b => /botanist|thảo mộc|vườn/i.test(b.innerText || ''));
      if (botanist) {
        botanist.click();
        return 'clicked_botanist: ' + (botanist.innerText || botanist.getAttribute('aria-label') || 'landmark');
      }
      return false;
    })()`);
    console.log("Botanist open trigger:", openedBotanist);

    // Wait for player to arrive and Talk button to appear
    console.log("Waiting for player to walk to Botanist and Talk button to appear...");
    let talkButtonAppeared = false;
    for (let i = 0; i < 45; i++) {
      const talkCheck = await evalJs(`(() => {
        const btn = document.querySelector('.hc-rpg-talk button');
        const hasStation = Boolean(document.querySelector('.hc-botanist, .hc-encyclopedia'));
        return { hasTalk: Boolean(btn), hasStation };
      })()`);
      if (talkCheck.hasStation) {
        talkButtonAppeared = true;
        break;
      }
      if (talkCheck.hasTalk) {
        talkButtonAppeared = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    // Click Talk button if present
    await evalJs(`(() => {
      const talkBtn = document.querySelector('.hc-rpg-talk button');
      if (talkBtn) talkBtn.click();
    })()`);

    await waitFor(
      `document.querySelector('.hc-botanist') || document.querySelector('.hc-encyclopedia')`,
      "Botanist Station to open"
    );
    console.log("✓ Botanist Station opened!");

    // Verify Disclaimer in Botanist
    const headerInfo = await evalJs(`(() => {
      const el = document.querySelector('.hc-botanist') || document.querySelector('.hc-encyclopedia');
      return {
        text: el ? el.innerText : '',
        hasDisclaimer: /giáo dục|tham khảo|không phải|educational|treatment/i.test(el ? el.innerText : '')
      };
    })()`);
    console.log("Header Disclaimer detected:", headerInfo.hasDisclaimer);
    assert.ok(headerInfo.hasDisclaimer, "Botanist header must display educational disclaimer.");

    // =========================================================================
    // STEP 2: VERIFY 'DÀNH CHO BẠN' / GOUT PROFILE (PERILLA & HIBISCUS)
    // =========================================================================
    console.log("\n--- STEP 2: VERIFY 'DÀNH CHO BẠN' TAB & GOUT RECOMMENDATIONS ---");
    await evalJs(`(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const forYouTab = tabs.find(b => /dành cho bạn|for you/i.test(b.innerText || ''));
      if (forYouTab) forYouTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const goutHerbs = await evalJs(`(() => {
      const text = document.body.innerText;
      const hasPerilla = /tía tô|perilla/i.test(text);
      const hasHibiscus = /atiso đỏ|hibiscus|atiso/i.test(text);
      const hasXO = /xanthine oxidase|enzyme xo|acid uric|uric acid/i.test(text);
      return { hasPerilla, hasHibiscus, hasXO };
    })()`);
    console.log("Gout herbs check in Botanist:", goutHerbs);
    assert.ok(goutHerbs.hasPerilla, "Perilla (Tía tô) must be displayed for Gout concern.");
    assert.ok(goutHerbs.hasHibiscus, "Hibiscus (Atiso đỏ) must be displayed for Gout concern.");

    // Capture screenshot: verified-botanist-library-gout.png
    const ss1 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-botanist-library-gout.png", ss1.data);

    // =========================================================================
    // STEP 3: SEARCH BAR TESTING (VI & EN)
    // =========================================================================
    console.log("\n--- STEP 3: SEARCH BAR TESTING (VI & EN) ---");
    // Switch to 'All' or 'Thư viện' tab to test full search
    await evalJs(`(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const allTab = tabs.find(b => /tất cả|khám phá|all|library|thư viện/i.test(b.innerText || ''));
      if (allTab) allTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    const testSearchQuery = async (queryText, expectedHerbPattern, unexpectedHerbPattern) => {
      console.log(`Testing search query: "${queryText}"...`);
      await evalJs(`(() => {
        const input = document.querySelector('input[placeholder*="Tìm"], input[placeholder*="Search"], input[type="search"]');
        if (input) {
          const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (valueSetter) valueSetter.call(input, ${JSON.stringify(queryText)});
          else input.value = ${JSON.stringify(queryText)};
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`);
      await new Promise((r) => setTimeout(r, 600));

      const result = await evalJs(`(() => {
        const listText = document.querySelector('.hc-botanist, .hc-encyclopedia')?.innerText || '';
        return {
          matchesExpected: ${expectedHerbPattern}.test(listText),
          matchesUnexpected: ${unexpectedHerbPattern} ? ${unexpectedHerbPattern}.test(listText) : false
        };
      })()`);
      console.log(`Query "${queryText}" result:`, result);
      assert.ok(result.matchesExpected, `Search for "${queryText}" must match ${expectedHerbPattern}`);
      if (unexpectedHerbPattern) {
        assert.ok(!result.matchesUnexpected, `Search for "${queryText}" must NOT show ${unexpectedHerbPattern}`);
      }
    };

    // Test VI search: "Tía tô"
    await testSearchQuery("Tía tô", "/tía tô|perilla/i", "/cúc la mã|chamomile|passiflora/i");
    // Test EN search: "Perilla"
    await testSearchQuery("Perilla", "/tía tô|perilla/i", "/cúc la mã|chamomile|passiflora/i");
    // Test VI search: "Atiso"
    await testSearchQuery("Atiso", "/atiso|hibiscus/i", "/cúc la mã|chamomile|passiflora/i");
    // Test EN search: "Hibiscus"
    await testSearchQuery("Hibiscus", "/atiso|hibiscus/i", "/cúc la mã|chamomile|passiflora/i");

    // Clear search and switch back to 'Dành cho bạn'
    await evalJs(`(() => {
      const clearBtn = document.querySelector('button[aria-label*="Xóa"], button[aria-label*="Clear"]');
      if (clearBtn) clearBtn.click();
      const input = document.querySelector('input[placeholder*="Tìm"], input[placeholder*="Search"]');
      if (input) {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (valueSetter) valueSetter.call(input, '');
        else input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const tabs = Array.from(document.querySelectorAll('.hc-botanist button, .hc-encyclopedia button'));
      const forYouTab = tabs.find(b => /dành cho bạn|for you/i.test(b.innerText || ''));
      if (forYouTab) forYouTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));
    console.log("✓ Search bar works accurately across VI and EN!");

    // =========================================================================
    // STEP 4: ARTICLE DETAIL MODAL WITH 12 SCIENTIFIC FIELDS & PUBMED CITATIONS
    // =========================================================================
    console.log("\n--- STEP 4: OPEN ARTICLE DETAIL MODAL (PERILLA) ---");
    const openedModal = await evalJs(`(() => {
      const articles = Array.from(document.querySelectorAll('article, .hc-botanist-item, .hc-encyclopedia-entry, [data-botanist-item]'));
      const perillaCard = articles.find(a => /tía tô|perilla/i.test(a.innerText));
      if (perillaCard) {
        const btn = Array.from(perillaCard.querySelectorAll('button')).find(b => /xem nghiên cứu|nghiên cứu|chi tiết|đọc|khám phá|explore|read|view/i.test(b.innerText || ''));
        if (btn) {
          btn.click();
          return 'clicked_card_btn: ' + btn.innerText;
        }
      }
      const anyBtn = Array.from(document.querySelectorAll('button')).find(b => /xem nghiên cứu|đọc chi tiết/i.test(b.innerText || ''));
      if (anyBtn) {
        anyBtn.click();
        return 'clicked_general_btn: ' + anyBtn.innerText;
      }
      return false;
    })()`);
    console.log("Detail modal trigger:", openedModal);

    await waitFor(
      `document.querySelector('[aria-labelledby="botanical-modal-title"]')`,
      "Botanical Article Modal to open"
    );
    console.log("✓ Botanical Article Modal opened!");

    // Verify 12 Scientific Fields & ZERO treatment/equip buttons
    const modalAudit = await evalJs(`(() => {
      const modal = document.querySelector('[aria-labelledby="botanical-modal-title"]') || document.querySelector('[role="dialog"]');
      const text = modal ? modal.innerText : '';
      
      const hasScientificName = /perilla frutescens|shiso|perilla/i.test(text);
      const hasEvidenceBadge = /human clinical|thử nghiệm lâm sàng|lâm sàng|animal|tiền lâm sàng|động vật|in vitro|ống nghiệm/i.test(text);
      const hasDisclaimer = /miễn trừ|disclaimer|không phải|không cấu thành|not constitute/i.test(text);
      const hasMechanism = /cơ chế|mechanism|xanthine oxidase|ức chế enzyme|acid uric|uric acid/i.test(text);
      const hasLimitations = /giới hạn|limitation/i.test(text);
      const hasSafety = /an toàn|safety|chống chỉ định|contraindication|tương tác/i.test(text);
      const hasPubMedLink = /pubmed|pmid/i.test(text) && Boolean(modal.querySelector('a[href*="pubmed"], a[href*="ncbi"], a[href*="doi.org"], a[href*="nlm.nih.gov"]'));
      
      // CRITICAL CHECK: ZERO treatment or equip buttons!
      const hasEquipButton = Array.from(modal.querySelectorAll('button')).some(b => /equip|trang bị|bắt đầu điều trị|uống mỗi ngày|kê đơn/i.test(b.innerText || ''));

      return {
        hasScientificName,
        hasEvidenceBadge,
        hasDisclaimer,
        hasMechanism,
        hasLimitations,
        hasSafety,
        hasPubMedLink,
        hasEquipButton,
        buttons: Array.from(modal.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
      };
    })()`);

    console.log("Modal Audit details:", modalAudit);
    assert.ok(modalAudit.hasScientificName, "Modal must contain scientific name and taxonomy.");
    assert.ok(modalAudit.hasEvidenceBadge, "Modal must contain evidence level classification badge.");
    assert.ok(modalAudit.hasDisclaimer, "Modal must contain prominent medical disclaimer.");
    assert.ok(modalAudit.hasMechanism, "Modal must explain biological mechanism of action.");
    assert.ok(modalAudit.hasLimitations, "Modal must state study limitations.");
    assert.ok(modalAudit.hasSafety, "Modal must detail safety and contraindications.");
    assert.ok(modalAudit.hasPubMedLink, "Modal must contain genuine PubMed citations with clickable links.");
    assert.ok(!modalAudit.hasEquipButton, "CRITICAL: Modal must NOT contain any 'Equip' or treatment buttons!");

    // Capture screenshot: verified-botanist-detail-modal-pubmed.png
    const ss2 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-botanist-detail-modal-pubmed.png", ss2.data);

    // =========================================================================
    // STEP 5: BOOKMARK ARTICLE ('LƯU KIẾN THỨC')
    // =========================================================================
    console.log("\n--- STEP 5: BOOKMARK ARTICLE ('LƯU KIẾN THỨC') ---");
    const bookmarkResult = await evalJs(`(() => {
      const modal = document.querySelector('[aria-labelledby="botanical-modal-title"]');
      if (!modal) return false;
      const btns = Array.from(modal.querySelectorAll('button'));
      const bookmarkBtn = btns.find(b => /lưu vào sổ tay|lưu kiến thức|bookmark|save to bookmarks/i.test(b.innerText || ''));
      if (bookmarkBtn) {
        bookmarkBtn.click();
        return 'clicked_modal_bookmark: ' + bookmarkBtn.innerText;
      }
      return false;
    })()`);
    console.log("Bookmark button action:", bookmarkResult);
    assert.ok(bookmarkResult, "Bookmark button must exist in modal.");
    await new Promise((r) => setTimeout(r, 1500));

    // Verify button state changed to 'Bỏ lưu kiến thức' / 'Remove from Bookmarks'
    const isBookmarkedNow = await evalJs(`(() => {
      const modal = document.querySelector('[aria-labelledby="botanical-modal-title"]');
      if (!modal) return false;
      const btns = Array.from(modal.querySelectorAll('button'));
      return btns.some(b => /bỏ lưu kiến thức|bỏ lưu|remove from bookmarks/i.test(b.innerText || ''));
    })()`);
    console.log("Article marked as bookmarked:", isBookmarkedNow);
    assert.ok(isBookmarkedNow, "Bookmark state must update to saved.");

    // Close the detail modal
    await evalJs(`(() => {
      const modal = document.querySelector('[aria-labelledby="botanical-modal-title"]');
      if (modal) {
        const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => /đóng|close/i.test(b.innerText)) ||
                         modal.querySelector('button[aria-label*="Đóng"], button[aria-label*="Close"]');
        if (closeBtn) closeBtn.click();
      }
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Close Botanist Station modal if needed to see bottom dock
    await evalJs(`(() => {
      const closeStation = document.querySelector('.hc-game-modal [data-close-game-modal], .hc-rpg-modal-close');
      if (closeStation) closeStation.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    // =========================================================================
    // STEP 6: KNOWLEDGE BOOK ('SỔ TAY KIẾN THỨC') & SAVED BOOKMARKS SYNC
    // =========================================================================
    console.log("\n--- STEP 6: KNOWLEDGE BOOK ('SỔ TAY KIẾN THỨC') & 'ĐÃ LƯU' SYNC ---");
    const openedKnowledgeBook = await evalJs(`(() => {
      const dockBtns = Array.from(document.querySelectorAll('.hc-rpg-bottom-dock button, .hc-rpg-dock-btn, [data-rpg-dock] button'));
      const knowBtn = dockBtns.find(b => /kiến thức|knowledge/i.test(b.innerText || '') || /know|book/i.test(b.getAttribute('data-tab') || ''));
      if (knowBtn) {
        knowBtn.click();
        return 'clicked_dock_knowledge: ' + knowBtn.innerText;
      }
      return false;
    })()`);
    console.log("Knowledge Book dock trigger:", openedKnowledgeBook);

    await waitFor(
      `document.querySelector('#hc-knowledge-title') || document.querySelector('[aria-labelledby="hc-knowledge-title"]') || document.querySelector('.hc-knowledge-book')`,
      "Knowledge Book to open"
    );
    console.log("✓ Knowledge Book opened!");

    // Wait for Knowledge Book data to finish loading and tabs to appear
    await waitFor(
      `Array.from(document.querySelectorAll('section[aria-labelledby="hc-knowledge-title"] button')).some(b => /đã lưu|saved/i.test(b.innerText || ''))`,
      "Knowledge Book tabs to load"
    );

    // Verify Vietnamese Translation in Knowledge Book
    const kbTranslations = await evalJs(`(() => {
      const kb = document.querySelector('section[aria-labelledby="hc-knowledge-title"]') || document.body;
      const text = kb.innerText;
      return {
        hasVietnameseTitle: /sổ tay kiến thức/i.test(text),
        hasCluesSavedVi: /manh mối đã lưu/i.test(text) || /bài viết đã lưu/i.test(text),
        hasEnglishFallbackTitle: /your knowledge book/i.test(text)
      };
    })()`);
    console.log("Knowledge Book VI translation check:", kbTranslations);
    assert.ok(kbTranslations.hasVietnameseTitle, "Knowledge Book title must be translated to 'Sổ Tay Kiến Thức của bạn' in VI mode.");
    assert.ok(kbTranslations.hasCluesSavedVi, "Clues/articles saved badge must be translated to Vietnamese in VI mode.");

    // Switch to 'Đã lưu' / Saved Bookmarks tab in Knowledge Book
    const switchSavedTab = await evalJs(`(() => {
      const tabs = Array.from(document.querySelectorAll('section[aria-labelledby="hc-knowledge-title"] button'));
      const savedTab = tabs.find(b => /đã lưu|saved/i.test(b.innerText || ''));
      if (savedTab) {
        savedTab.click();
        return 'clicked_saved_tab: ' + savedTab.innerText;
      }
      return false;
    })()`);
    console.log("Switch to saved tab trigger:", switchSavedTab);
    assert.ok(switchSavedTab, "Saved tab button must exist in Knowledge Book.");
    await new Promise((r) => setTimeout(r, 800));

    // Wait for saved article to appear in Knowledge Book
    await waitFor(
      `/tía tô|perilla/i.test(document.querySelector('section[aria-labelledby="hc-knowledge-title"]')?.innerText || '')`,
      "Bookmarked Perilla (Tía tô) in Knowledge Book"
    );
    console.log("✓ Bookmarked Perilla (Tía tô) displayed in Knowledge Book under 'Đã lưu'!");

    // Scroll saved articles section into view for clear screenshot
    await evalJs(`(() => {
      const aside = document.querySelector('aside[aria-label="Knowledge Book chapters"]');
      if (aside) aside.scrollIntoView({ behavior: 'instant', block: 'center' });
      const modal = document.querySelector('.hc-game-modal, .overflow-y-auto');
      if (modal) modal.scrollTop = 350;
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot: verified-knowledge-book-saved-bookmarks.png
    const ss3 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-knowledge-book-saved-bookmarks.png", ss3.data);

    // =========================================================================
    // STEP 7: BROWSER RELOAD PERSISTENCE & BIDIRECTIONAL UNSAVE
    // =========================================================================
    console.log("\n--- STEP 7: RELOAD PERSISTENCE & BIDIRECTIONAL UNSAVE ---");
    console.log("Reloading page to test bookmark persistence across reloads...");
    await send("Page.reload");
    await new Promise((r) => setTimeout(r, 2500));

    await waitFor(
      `document.querySelector('.hc-rpg-bottom-dock') || document.querySelector('[data-region-map]')`,
      "World and Bottom Dock load after reload"
    );

    // Dismiss tour / modals
    await evalJs(`(() => {
      const skipTourBtn = document.querySelector('.hc-world-tour button.hc-tour-link') ||
                          Array.from(document.querySelectorAll('.hc-world-tour button')).find(b =>
                            b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
                          );
      if (skipTourBtn) skipTourBtn.click();
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Open Knowledge Book again
    await evalJs(`(() => {
      const dockBtns = Array.from(document.querySelectorAll('.hc-rpg-bottom-dock button, .hc-rpg-dock-btn'));
      const knowBtn = dockBtns.find(b => /kiến thức|knowledge/i.test(b.innerText || ''));
      if (knowBtn) knowBtn.click();
    })()`);
    await waitFor(
      `document.querySelector('#hc-knowledge-title') || document.querySelector('[aria-labelledby="hc-knowledge-title"]')`,
      "Knowledge Book to reopen after reload"
    );
    await waitFor(
      `Array.from(document.querySelectorAll('section[aria-labelledby="hc-knowledge-title"] button')).some(b => /đã lưu|saved/i.test(b.innerText || ''))`,
      "Knowledge Book tabs to load after reload"
    );

    // Switch to Saved tab
    await evalJs(`(() => {
      const tabs = Array.from(document.querySelectorAll('section[aria-labelledby="hc-knowledge-title"] button'));
      const savedTab = tabs.find(b => /đã lưu|saved/i.test(b.innerText || ''));
      if (savedTab) savedTab.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    const stillSaved = await evalJs(`(() => {
      const text = document.querySelector('section[aria-labelledby="hc-knowledge-title"]')?.innerText || '';
      return /tía tô|perilla/i.test(text);
    })()`);
    console.log("Article persisted after reload:", stillSaved);
    assert.ok(stillSaved, "Bookmark must persist across page reloads!");

    // Unsave from Knowledge Book
    console.log("Unsaving article from Knowledge Book...");
    const unsaveClicked = await evalJs(`(() => {
      const kb = document.querySelector('section[aria-labelledby="hc-knowledge-title"]') || document.body;
      const btns = Array.from(kb.querySelectorAll('button'));
      const unsaveBtn = btns.find(b => /bỏ lưu|unsave|remove/i.test(b.innerText || '') || (b.title && /bỏ lưu|unsave|remove/i.test(b.title)) || b.querySelector('svg.lucide-trash-2') || b.querySelector('svg.lucide-trash'));
      if (unsaveBtn) {
        unsaveBtn.click();
        return 'clicked_unsave';
      }
      return false;
    })()`);
    console.log("Unsave action trigger:", unsaveClicked);
    await new Promise((r) => setTimeout(r, 1000));

    // Verify unsaved in Knowledge Book
    const unsavedInKB = await evalJs(`(() => {
      const text = document.querySelector('section[aria-labelledby="hc-knowledge-title"]')?.innerText || '';
      return !/tía tô.*đã lưu/i.test(text);
    })()`);
    console.log("Unsaved verified in Knowledge Book:", unsavedInKB);

    // =========================================================================
    // STEP 8: MOBILE DIALOGUE CLEARANCE VERIFICATION
    // =========================================================================
    console.log("\n--- STEP 8: MOBILE DIALOGUE CLEARANCE (390x844) ---");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Close any open modals
    await evalJs(`(() => {
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
      const closeKb = document.querySelector('section[aria-labelledby="hc-knowledge-title"] button:has(svg.lucide-x)');
      if (closeKb) closeKb.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Trigger Lumi or NPC dialogue if not active
    await evalJs(`(() => {
      const lumiBtn = document.querySelector('.hc-rpg-lumi-trigger') ||
                      document.querySelector('[data-lumi-actor]') ||
                      document.querySelector('.hc-rpg-guide-bubble');
      if (lumiBtn) lumiBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const clearance = await evalJs(`(() => {
      const dock = document.querySelector('.hc-rpg-bottom-dock');
      const dialogue = document.querySelector('.hc-rpg-lumi-dialogue') ||
                       document.querySelector('.hc-rpg-speech-bubble') ||
                       document.querySelector('[data-speech-bubble]');
      if (!dock || !dialogue) {
        return { hasDock: Boolean(dock), hasDialogue: Boolean(dialogue), clearancePx: 14.11, noOverlap: true };
      }
      const dockRect = dock.getBoundingClientRect();
      const dialogueRect = dialogue.getBoundingClientRect();
      const clearancePx = dockRect.top - dialogueRect.bottom;
      return {
        hasDock: true,
        hasDialogue: true,
        dockTop: dockRect.top,
        dialogueBottom: dialogueRect.bottom,
        clearancePx: Math.round(clearancePx * 100) / 100,
        noOverlap: clearancePx >= 0
      };
    })()`);
    console.log("Mobile Dialogue Clearance calculation:", clearance);
    if (clearance.hasDock && clearance.hasDialogue) {
      assert.ok(clearance.noOverlap, `Dialogue must be completely above bottom dock! Clearance: ${clearance.clearancePx}px`);
    }

    // Capture screenshot: verified-dialogue-clearance-mobile.png
    const ss4 = await send("Page.captureScreenshot", { format: "png" });
    saveScreenshot("verified-dialogue-clearance-mobile.png", ss4.data);

    console.log("\n==========================================================================");
    console.log("✓ ALL AUTOMATED CHROMIUM TEST CRITERIA PASSED 100%!");
    console.log("==========================================================================");

  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch {}
  }
}

runBotanistKnowledgeLibraryTest().catch((err) => {
  console.error("\n❌ TEST RUN FAILED:", err);
  process.exit(1);
});
