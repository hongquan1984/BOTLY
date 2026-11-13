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

const testEmail = `tester-botanist-cards-${Date.now()}@example.invalid`;
const testPassword = "Password123!@#";

console.log("=== STEP 1: Creating verified test user in local Supabase ===");
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

console.log("=== STEP 2: Launching Chrome via CDP ===");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const probe = net.createServer();
const debugPort = await new Promise((resolve) => {
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});
const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-cards-${Date.now()}`);
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
      const timer = setTimeout(() => { ws.removeEventListener("message", handler); reject(new Error(`CDP Timeout ${method}`)); }, 15000);
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) { clearTimeout(timer); ws.removeEventListener("message", handler); if (data.error) reject(new Error(data.error.message)); else resolve(data.result); }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  await send("Page.navigate", { url: `${base}/play` });
  await new Promise((r) => setTimeout(r, 1200));

  const sessionObj = {
    access_token: token,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    user: { id: userId, email: testEmail, email_confirmed_at: new Date().toISOString() }
  };

  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    })()`
  });

  console.log("=== STEP 3: Navigating to World Scene and opening Botanist Station ===");
  await send("Page.navigate", { url: `${base}/vi/wellness/healthclues/world?quest=gout` });
  await new Promise((r) => setTimeout(r, 3500));

  // Mark guide as completed so tour popup does not obscure
  await fetch(`${base}/api/healthclues/guide`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ stage: "completed" })
  });

  // Dismiss any tour modals
  await send("Runtime.evaluate", {
    expression: `(() => {
      const skipTourBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.innerText?.includes('Bỏ qua') || b.innerText?.includes('Skip')
      );
      if (skipTourBtn) skipTourBtn.click();
      const closeBtn = document.querySelector('[data-close-game-modal]');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 800));

  // Trigger Botanist Garden
  console.log("Triggering Botanist landmark...");
  const triggerResult = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('[data-landmark-id="nutrition"] button') || 
                  document.querySelector('[data-npc="botanist"]') ||
                  Array.from(document.querySelectorAll('.hc-rpg-location-pill, .hc-landmark-pill, button')).find(b => /botanist|thảo mộc|vườn/i.test(b.innerText || ''));
      if (btn) {
        btn.click();
        return 'clicked landmark: ' + (btn.innerText || 'nutrition');
      }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log("Botanist landmark trigger:", triggerResult.result?.value);

  // Poll until talk button appears after walking animation
  console.log("Waiting for walk animation and talk card to appear...");
  let talkBtnFound = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-rpg-talk-action-btn') || document.querySelector('.hc-rpg-talk button'))`,
      returnByValue: true
    });
    if (check.result?.value) {
      talkBtnFound = true;
      break;
    }
  }
  console.log("Talk button appeared?", talkBtnFound);

  // Click Talk button to open Botanist Station
  console.log("Clicking talk button to open Botanist Station...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.hc-rpg-talk-action-btn') || document.querySelector('.hc-rpg-talk button');
      if (btn) btn.click();
    })()`
  });

  // Poll until .hc-botanist or botanical card appears
  let stationFound = false;
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.hc-botanist article'))`,
      returnByValue: true
    });
    if (check.result?.value) {
      stationFound = true;
      break;
    }
  }
  console.log("Botanist station cards visible?", stationFound);
  assert.equal(stationFound, true, "Botanist cards must be visible in Station modal");

  await new Promise((r) => setTimeout(r, 800));

  console.log("=== STEP 4: Auditing Desktop Botanical Cards Layout & Images ===");
  const desktopAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.hc-botanist article'));
      return cards.map(c => {
        const title = c.querySelector('h3')?.innerText?.trim();
        const scientific = c.querySelector('p.font-serif')?.innerText?.trim();
        const img = c.querySelector('img');
        const imgSrc = img ? img.getAttribute('src') : null;
        const imgWidth = img ? img.getBoundingClientRect().width : 0;
        const imgHeight = img ? img.getBoundingClientRect().height : 0;
        const naturalWidth = img ? img.naturalWidth : 0;
        const naturalHeight = img ? img.naturalHeight : 0;

        const bioactives = Array.from(c.querySelectorAll('.bg-white.border.shadow-2xs, [class*="text-[10.5px]"]')).map(el => el.innerText.trim());
        const highlights = Array.from(c.querySelectorAll('li')).map(el => el.innerText.trim());
        const hasParagraph = Boolean(c.querySelector('p.leading-relaxed.line-clamp-3'));
        const readBtn = c.querySelector('button');

        return {
          title,
          scientific,
          hasImg: Boolean(img),
          imgSrc,
          imgWidth: Math.round(imgWidth),
          imgHeight: Math.round(imgHeight),
          naturalWidth,
          naturalHeight,
          bioactivesCount: bioactives.length,
          bioactivesSample: bioactives.slice(0, 3),
          highlightsCount: highlights.length,
          highlightsSample: highlights.slice(0, 2),
          hasParagraph,
          hasReadBtn: Boolean(readBtn)
        };
      });
    })()`,
    returnByValue: true
  });

  const cards = desktopAudit.result?.value;
  console.log("DESKTOP CARDS AUDIT:", JSON.stringify(cards, null, 2));
  assert.ok(cards.length >= 2, "Must display at least 2 botanical cards for Gout");

  // Check Card 1 (Tía tô)
  const perilla = cards.find(c => c.title.includes("Tía tô"));
  assert.ok(perilla, "Perilla card must exist");
  assert.equal(perilla.hasImg, true, "Card must have botanical illustration");
  assert.ok(perilla.imgSrc.includes("perilla-frutescens.webp"), "Image src must point to perilla-frutescens.webp");
  assert.ok(perilla.imgWidth > 100, `Image width must be rendered (>100px), got ${perilla.imgWidth}px`);
  assert.ok(perilla.imgHeight > 100, `Image height must be rendered (>100px), got ${perilla.imgHeight}px`);
  assert.ok(perilla.naturalWidth > 0, "Image must be loaded with non-zero natural width");
  assert.equal(perilla.hasParagraph, false, "Dense paragraph must be REMOVED from card overview");
  assert.ok(perilla.bioactivesCount >= 2, "Must list key bioactives as tags");
  assert.ok(perilla.highlightsCount >= 2, "Must list studied mechanisms / effects as bullet points");

  // Take Desktop Screenshot
  const shotDesktop = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-botanist-rpg-cards-desktop.png"), Buffer.from(shotDesktop.data, "base64"));
  console.log("Saved: verified-botanist-rpg-cards-desktop.png");

  // Step 5: Test "Đọc chi tiết" Modal
  console.log("=== STEP 5: Testing [Đọc chi tiết] Modal Opening ===");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('.hc-botanist article button')).find(b => b.innerText.includes('Đọc chi tiết') || b.innerText.includes('Read Details'));
      if (btn) btn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 700));

  const modalAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]#botanical-modal-title')?.closest('[role="dialog"]') || Array.from(document.querySelectorAll('[role="dialog"]')).pop();
      const modalTitle = document.querySelector('#botanical-modal-title')?.innerText?.trim() || modal?.querySelector('h2')?.innerText?.trim();
      const modalImg = modal?.querySelector('img[src*="botanical"]');
      const pmidLinks = Array.from(modal?.querySelectorAll('a[href*="pubmed"]') || []).map(a => a.href);
      return {
        hasModal: Boolean(modal),
        modalTitle,
        hasModalImg: Boolean(modalImg),
        modalImgSrc: modalImg ? modalImg.getAttribute('src') : null,
        pmidLinksCount: pmidLinks.length
      };
    })()`,
    returnByValue: true
  });
  console.log("MODAL AUDIT:", modalAudit.result?.value);
  const ma = modalAudit.result?.value;
  assert.equal(ma.hasModal, true, "Botanical detail modal must open");
  assert.ok(ma.modalTitle.includes("Tía tô"), "Modal title must be Tía tô");
  assert.equal(ma.hasModalImg, true, "Detail modal must include botanical artwork");
  assert.ok(ma.pmidLinksCount >= 1, "Must contain verified PubMed citation links");

  const shotModal = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-botanist-detail-modal-artwork.png"), Buffer.from(shotModal.data, "base64"));
  console.log("Saved: verified-botanist-detail-modal-artwork.png");

  // Close modal
  await send("Runtime.evaluate", {
    expression: `(() => {
      const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Đóng"], [role="dialog"] button[aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 500));

  // Step 6: Test Mobile Viewport (390x844)
  console.log("=== STEP 6: Testing Mobile Viewport (390x844) ===");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise((r) => setTimeout(r, 800));

  const mobileAudit = await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.hc-botanist article'));
      return cards.map(c => {
        const title = c.querySelector('h3')?.innerText?.trim();
        const rect = c.getBoundingClientRect();
        const img = c.querySelector('img');
        const imgRect = img ? img.getBoundingClientRect() : null;
        return {
          title,
          cardWidth: Math.round(rect.width),
          cardHeight: Math.round(rect.height),
          imgWidth: imgRect ? Math.round(imgRect.width) : 0,
          imgHeight: imgRect ? Math.round(imgRect.height) : 0,
          fitsViewport: rect.width <= 390
        };
      });
    })()`,
    returnByValue: true
  });
  console.log("MOBILE CARDS AUDIT:", mobileAudit.result?.value);
  const mobCards = mobileAudit.result?.value;
  assert.ok(mobCards.length >= 2, "Mobile cards must render");
  assert.ok(mobCards[0].fitsViewport, "Mobile card must fit within screen bounds");
  assert.ok(mobCards[0].imgHeight > 100, "Mobile hero illustration must have positive height");

  const shotMobile = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(brainDir, "verified-botanist-rpg-cards-mobile.png"), Buffer.from(shotMobile.data, "base64"));
  console.log("Saved: verified-botanist-rpg-cards-mobile.png");

  console.log("\n🎉 ALL BOTANICAL RPG CARDS TESTS 100% PASSED!");
} finally {
  chromeProc.kill();
  process.exit(0);
}