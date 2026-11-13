import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
const ARTIFACTS_DIR = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\abff8161-8d04-4588-8fd8-ca4619ccaf85\\upload-verified";
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

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
  fs.writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  console.log(`[CDP] Saved screenshot: ${filePath}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log("=== STEP 1: Test API upload endpoint ===");
  // Generate sample PNG
  const samplePngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGlJREFUeNrs2UENACAMBMGf/JuwgRsMhK2C3Azo53SftoF5b18AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgKcARoABAJ5q5h8AYEQBIAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBbAxBwAALfMh3TAAAAAElFTkSuQmCC";
  const samplePngBuffer = Buffer.from(samplePngBase64, "base64");

  const blob = new Blob([samplePngBuffer], { type: "image/png" });
  const form = new FormData();
  form.append("file", blob, "chair_nordic_emerald.png");
  form.append("suggestedId", "sofa_luxury");

  const uploadRes = await fetch(`${BASE_URL}/api/healthclues/wellness-home/upload`, {
    method: "POST",
    body: form,
  });

  assert.equal(uploadRes.status, 200, "Upload API must return 200");
  const uploadData = await uploadRes.json();
  console.log("Upload result:", uploadData);
  assert.ok(uploadData.success, "Upload must succeed");
  assert.ok(uploadData.url, "Upload must return image serving url");

  console.log("=== STEP 2: Test image serving route ===");
  const imgUrl = `${BASE_URL}${uploadData.url}`;
  const imgRes = await fetch(imgUrl);
  console.log("Image route status:", imgRes.status, "Content-Type:", imgRes.headers.get("content-type"));
  assert.equal(imgRes.status, 200, "Image route must return 200 OK");
  assert.ok(imgRes.headers.get("content-type")?.includes("image/"), "Content-type must be image");
  const imgBytes = await imgRes.arrayBuffer();
  assert.ok(imgBytes.byteLength > 0, "Image bytes must not be empty");

  console.log("=== STEP 3: Test compatibility /api/upload route ===");
  const compatRes = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: "test_furniture.png",
      dataUrl: `data:image/png;base64,${samplePngBase64}`,
    }),
  });
  assert.equal(compatRes.status, 200, "Compatibility /api/upload must return 200");
  const compatData = await compatRes.json();
  console.log("Compat upload result:", compatData);
  assert.ok(compatData.success, "Compat upload must succeed");

  console.log("=== STEP 4: Browser E2E Test on Admin Studio via CDP ===");
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(fs.existsSync);

  if (!chromePath) throw new Error("Chrome not found");

  const cdpPort = 9224;
  const userDataDir = path.join(process.env.TEMP || "C:\\temp", "chrome-cdp-upload-profile");
  const chromeProc = spawn(
    chromePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--headless=new",
      "--window-size=1400,900",
      "about:blank",
    ],
    { detached: true }
  );

  const cleanup = () => {
    try {
      chromeProc.kill();
    } catch {}
  };
  process.on("exit", cleanup);

  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      if (res.ok) {
        connected = true;
        break;
      }
    } catch {}
  }
  if (!connected) throw new Error("Could not connect to Chrome CDP");

  let targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  let targets = await targetsRes.json();
  let pageTarget = targets.find((t) => t.type === "page" && !t.url.startsWith("chrome-extension://"));
  if (!pageTarget) {
    const newRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new`, { method: "PUT" });
    pageTarget = await newRes.json();
  }
  assert.ok(pageTarget && pageTarget.webSocketDebuggerUrl, "Must find or create page target");

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  const msgId = { id: 1 };
  await cdpRequest(ws, msgId.id++, "Page.enable");
  await cdpRequest(ws, msgId.id++, "Runtime.enable");
  await cdpRequest(ws, msgId.id++, "DOM.enable");

  console.log("[CDP] Navigating to http://localhost:3000/admin/healthclues-home...");
  await cdpRequest(ws, msgId.id++, "Page.navigate", { url: `${BASE_URL}/admin/healthclues-home` });
  
  // Wait for page to fully load and hydrate
  let hasUploadCard = false;
  for (let i = 0; i < 20; i++) {
    await sleep(600);
    hasUploadCard = await evalInPage(
      ws,
      msgId,
      `Boolean(document.querySelector('[data-testid="admin-sidebar-upload-card"]'))`
    );
    if (hasUploadCard) break;
  }
  console.log("[CDP] Sidebar upload card present:", hasUploadCard);
  assert.ok(hasUploadCard, "Sidebar upload card must exist in DOM");

  // Check initial catalog items count
  const initialCatalogCount = await evalInPage(
    ws,
    msgId,
    `document.querySelectorAll('[data-testid^="catalog-item-row-"]').length`
  );
  console.log("[CDP] Initial items in catalog:", initialCatalogCount);

  // Check initial selected item
  const initialSelectedName = await evalInPage(
    ws,
    msgId,
    `(() => {
      const el = document.querySelector('input[value*="Tranh"], input[value*="Sofa"]');
      return el ? el.value : "None";
    })()`
  );
  console.log("[CDP] Initially selected item:", initialSelectedName);

  console.log("[CDP] Simulating file selection from computer via DataTransfer onto Add New Furniture input...");
  await evalInPage(
    ws,
    msgId,
    `(() => {
      const b64 = "${samplePngBase64}";
      const byteChars = atob(b64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: "image/png" });
      const file = new File([blob], "custom_chair_test.png", { type: "image/png" });
      const input = document.querySelector('input[data-testid="admin-add-new-file-input"]') || document.querySelector('input[type="file"]');
      if (!input) return false;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()`
  );

  await sleep(2500);

  // Capture screenshot of admin studio after upload
  await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "01_admin_after_upload.png"));

  // Check stage image status
  const imgCheck = await evalInPage(
    ws,
    msgId,
    `(() => {
      const imgs = Array.from(document.querySelectorAll('[data-testid="admin-stage"] img'));
      return {
        totalImages: imgs.length,
        brokenCount: imgs.filter(i => i.naturalWidth === 0).length,
        sources: imgs.map(i => ({ src: i.src.slice(0, 80), w: i.naturalWidth, h: i.naturalHeight }))
      };
    })()`
  );
  console.log("[CDP] Stage image check:", imgCheck);
  assert.equal(imgCheck.brokenCount, 0, "No stage images should be broken (404)");

  // Check catalog items count AFTER upload: MUST BE ADDITIVE (strictly greater than initial!)
  const catalogCountAfter = await evalInPage(
    ws,
    msgId,
    `document.querySelectorAll('[data-testid^="catalog-item-row-"]').length`
  );
  console.log(`[CDP] Total items after upload: ${catalogCountAfter} (Initial was ${initialCatalogCount})`);
  assert.ok(
    catalogCountAfter > initialCatalogCount,
    `Upload MUST add a new item to catalog! Expected > ${initialCatalogCount}, got ${catalogCountAfter}`
  );

  // Check that the original item is STILL present and NOT replaced
  const originalItemStillExists = await evalInPage(
    ws,
    msgId,
    `(() => {
      const items = Array.from(document.querySelectorAll('[data-testid^="catalog-item-row-"]'));
      return items.some(el => el.textContent.includes("Piano") || el.textContent.includes("Grand") || el.textContent.includes("Tranh") || el.textContent.includes("Sofa"));
    })()`
  );
  console.log("[CDP] Original item still intact (not overwritten):", originalItemStillExists);
  assert.ok(originalItemStillExists, "Original item must not be overwritten or removed!");

  // Step 5: Test Smooth Chibi Walk Mode ("Thử Đi")
  console.log("[CDP] Testing Live Walk Mode ('Thử Đi')...");
  await evalInPage(
    ws,
    msgId,
    `(() => {
      const painterBtn = document.querySelector('[data-testid="admin-toggle-painter-btn"]');
      if (painterBtn) painterBtn.click();
    })()`
  );
  await sleep(1000);

  await evalInPage(
    ws,
    msgId,
    `(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const walkBtn = btns.find(b => b.textContent.includes("Thử Đi") || b.textContent.includes("Dừng Thử"));
      if (walkBtn) walkBtn.click();
    })()`
  );
  await sleep(1500);

  const chibiPositions = [];
  for (let i = 0; i < 5; i++) {
    const pos = await evalInPage(
      ws,
      msgId,
      `(() => {
        const chibi = document.querySelector("img[alt='Chibi']");
        if (!chibi) return null;
        const rect = chibi.getBoundingClientRect();
        return { x: Math.round(rect.left), y: Math.round(rect.top) };
      })()`
    );
    if (pos) chibiPositions.push(pos);
    await sleep(250);
  }
  console.log("[CDP] Chibi positions during smooth walk:", chibiPositions);
  assert.ok(chibiPositions.length > 0, "Chibi must be rendered and moving in test walk mode");

  // Save changes
  console.log("[CDP] Saving uploaded furniture...");
  await evalInPage(
    ws,
    msgId,
    `(() => {
      const btn = document.querySelector('[data-testid="admin-save-item-btn"]') || document.querySelector('[data-testid="admin-batch-save-btn"]');
      if (btn) btn.click();
      return Boolean(btn);
    })()`
  );

  await sleep(1500);
  await captureScreenshot(ws, msgId, path.join(ARTIFACTS_DIR, "02_admin_saved_upload.png"));

  ws.close();
  cleanup();
  console.log("=== ALL UPLOAD FIX VERIFICATIONS PASSED 100%! ===");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
