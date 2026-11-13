import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const PREVIEWS_DIR = "D:\\botly\\App\\reports\\previews";
if (!existsSync(PREVIEWS_DIR)) {
  mkdirSync(PREVIEWS_DIR, { recursive: true });
}

const BASE_URL = process.env.DETECTIVE_URL || "http://127.0.0.1:3329";
const ROUND_TAG = process.env.LANDSCAPE_ROUND || "r1";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);
  if (!chromePath) throw new Error("Google Chrome required");

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const profileDir = path.join("D:\\botly\\App\\.tmp\\detective-landscape", `${ROUND_TAG}-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=844,390",
    "about:blank",
  ]);

  const metrics = [];

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
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!targetWs) throw new Error("CDP target not found");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    const evaluate = async (code) => {
      const trimmed = code.trim();
      const wrapped =
        trimmed.includes(";") || trimmed.includes("const ") || trimmed.includes("return ")
          ? `(() => {\n${trimmed}\n})()`
          : `(${trimmed})`;
      const res = await send("Runtime.evaluate", {
        expression: wrapped,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || "Eval error");
      }
      return res.result ? res.result.value : null;
    };

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const snap = async (name) => {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(path.join(PREVIEWS_DIR, name), Buffer.from(data, "base64"));
    };

    const measureViewport = async (label, vpW, vpH) => {
      const info = await evaluate(`
        const doc = document.documentElement;
        const nav = document.querySelector("nav");
        const buttons = Array.from(document.querySelectorAll("button, [role='button']"))
          .filter(el => el.offsetParent !== null)
          .map(el => {
            const r = el.getBoundingClientRect();
            return {
              text: (el.innerText || el.getAttribute("aria-label") || "").replace(/\\s+/g, " ").trim().slice(0, 32),
              x: Math.round(r.left),
              y: Math.round(r.top),
              w: Math.round(r.width),
              h: Math.round(r.height),
              right: Math.round(r.right),
              bottom: Math.round(r.bottom),
            };
          });
        const clippedRight = buttons.filter(b => b.right > ${vpW} + 2);
        const navRect = nav ? nav.getBoundingClientRect() : null;
        return {
          label: "${label}",
          vp: "${vpW}x${vpH}",
          scrollW: doc.scrollWidth,
          innerW: window.innerWidth,
          horizOverflow: doc.scrollWidth > window.innerWidth + 1,
          scrollH: doc.scrollHeight,
          innerH: window.innerHeight,
          navH: navRect ? Math.round(navRect.height) : 0,
          clippedRightCount: clippedRight.length,
          clippedRight,
          visibleBtnCount: buttons.length,
        };
      `);
      metrics.push(info);
      console.log(`[${info.vp}] ${info.label}: scrollH=${info.scrollH}/${info.innerH}, horizOverflow=${info.horizOverflow} (${info.scrollW}/${info.innerW}), navH=${info.navH}px, clippedRight=${info.clippedRightCount}`);
      if (info.clippedRightCount > 0) {
        console.log("   CLIPPED RIGHT:", JSON.stringify(info.clippedRight));
      }
      return info;
    };

    // Test at 844x390 (Primary Modern Mobile Landscape)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send("Page.navigate", { url: `${BASE_URL}/detective` });
    await wait(2000);
    await measureViewport("01-library-844x390", 844, 390);
    await snap(`vision-landscape-${ROUND_TAG}-01-library-844x390.png`);

    // Compact landscape 667x375 Library
    await send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(350);
    await measureViewport("01b-library-667x375", 667, 375);
    await snap(`vision-landscape-${ROUND_TAG}-01b-library-667x375.png`);

    // Back to 844x390 for full flow walkthrough
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(250);

    // 2. Luna Dialogue Modal
    await evaluate(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("BẮT ĐẦU ĐIỀU TRA"));
      if (btn) btn.click();
    `);
    await wait(500);
    const modalScrollCheck = await evaluate(`
      const bd = document.querySelector('[data-testid="luna-dialogue-backdrop"]');
      const card = document.querySelector('[data-testid="luna-dialogue-card"]');
      const startBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("BẮT ĐẦU ĐIỀU TRA HIỆN TRƯỜNG"));
      return {
        cardTop: card ? Math.round(card.getBoundingClientRect().top) : -999,
        cardBottom: card ? Math.round(card.getBoundingClientRect().bottom) : -999,
        startBtnBottom: startBtn ? Math.round(startBtn.getBoundingClientRect().bottom) : -999,
        bdScrollH: bd ? bd.scrollHeight : 0,
        bdClientH: bd ? bd.clientHeight : 0,
      };
    `);
    console.log("   Luna Modal 844x390:", JSON.stringify(modalScrollCheck));
    await snap(`vision-landscape-${ROUND_TAG}-02-luna-modal-844x390.png`);

    // 3. Enter Scene 844x390
    await evaluate(`
      const enterBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("HIỆN TRƯỜNG"));
      if (enterBtn) enterBtn.click();
    `);
    await wait(1100);
    await measureViewport("03-scene-844x390", 844, 390);
    const sceneGeo844 = await evaluate(`
      const img = document.querySelector('main img');
      const r = img ? img.getBoundingClientRect() : null;
      return r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height), fitsInViewport: r.bottom <= 390 } : null;
    `);
    console.log("   Scene Canvas 844x390:", JSON.stringify(sceneGeo844));
    await snap(`vision-landscape-${ROUND_TAG}-03-scene-844x390.png`);

    // Also test 667x375 Scene + Nav
    await send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(350);
    await measureViewport("03b-scene-667x375", 667, 375);
    const sceneGeo667 = await evaluate(`
      const img = document.querySelector('main img');
      const r = img ? img.getBoundingClientRect() : null;
      return r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height), fitsInViewport: r.bottom <= 375 } : null;
    `);
    console.log("   Scene Canvas 667x375:", JSON.stringify(sceneGeo667));
    await snap(`vision-landscape-${ROUND_TAG}-03b-scene-667x375.png`);

    // Back to 844x390 -> Open Phone Layer 2 Modal
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(250);

    await evaluate(`
      Array.from(document.querySelectorAll('[aria-label^="Khám phá"]')).find(b => (b.getAttribute('aria-label')||'').includes('Điện thoại'))?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    `);
    await wait(500);
    await evaluate(`document.querySelector('[data-detail-tab-id="detail-phone-time"]')?.click()`);
    await wait(300);
    const objModalGeo844 = await evaluate(`
      const action = document.querySelector('[data-testid="object-save-action"]');
      const r = action ? action.getBoundingClientRect() : null;
      return {
        saveBtnVisibleIn390: r ? r.bottom <= 390 : false,
        saveBtnBottom: r ? Math.round(r.bottom) : 9999,
      };
    `);
    console.log("   ObjectModal 844x390:", JSON.stringify(objModalGeo844));
    await snap(`vision-landscape-${ROUND_TAG}-04-object-modal-844x390.png`);

    // Check ObjectModal on 667x375 too!
    await send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(300);
    const objModalGeo667 = await evaluate(`
      const action = document.querySelector('[data-testid="object-save-action"]');
      const r = action ? action.getBoundingClientRect() : null;
      return {
        saveBtnVisibleIn375: r ? r.bottom <= 375 : false,
        saveBtnBottom: r ? Math.round(r.bottom) : 9999,
      };
    `);
    console.log("   ObjectModal 667x375:", JSON.stringify(objModalGeo667));
    await snap(`vision-landscape-${ROUND_TAG}-04b-object-modal-667x375.png`);

    // Close the phone preview modal before collecting all 6 clues cleanly
    await evaluate(`
      const cb = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Quay lại") || b.innerText.trim() === "✕");
      if (cb) cb.click();
    `);
    await wait(250);

    // Collect all 6 clues quickly so Notebook & Conclusion unlock
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(200);
    const clueTargets = [
      ["Điện thoại", "detail-phone-time"],
      ["cà phê", "detail-coffee-receipt"],
      ["nhật ký", "detail-diary-schedule"],
      ["Laptop", "detail-laptop-work"],
      ["dương xỉ", "detail-plant-watering"],
      ["ban công", "detail-window-curtains"],
    ];
    for (const [labelFrag, detailFrag] of clueTargets) {
      await evaluate(`
        Array.from(document.querySelectorAll('[aria-label^="Khám phá"]')).find(b => (b.getAttribute('aria-label')||'').includes("${labelFrag}"))?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      `);
      await wait(250);
      await evaluate(`
        const tab = Array.from(document.querySelectorAll('button[data-detail-tab-id], button[data-detail-id]')).find(b =>
          (b.getAttribute('data-detail-tab-id') || b.getAttribute('data-detail-id') || '').includes("${detailFrag}")
        );
        if (tab) tab.click();
      `);
      await wait(150);
      await evaluate(`
        const sb = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("GHI NHẬN"));
        if (sb) sb.click();
      `);
      await wait(150);
      await evaluate(`
        const cb = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Quay lại") || b.innerText.trim() === "✕");
        if (cb) cb.click();
      `);
      await wait(150);
    }

    // Check Footer Strip below Scene when 6/6 on 844x390
    await measureViewport("03c-scene-all-found-844x390", 844, 390);
    await snap(`vision-landscape-${ROUND_TAG}-04c-scene-complete-844x390.png`);

    // 5. Notebook View 844x390 & tap clue card for Luna Modal
    await evaluate(`
      const sTab = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.includes("Sổ"));
      if (sTab) sTab.click();
    `);
    await wait(500);
    await measureViewport("05-notebook-844x390", 844, 390);
    const nbScrollMetrics = await evaluate(`
      const left = document.querySelector('.detective-notebook-left');
      const right = document.querySelector('.detective-notebook-right');
      return {
        docScrollH: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        leftHasScroll: left ? left.scrollHeight > left.clientHeight + 2 : false,
        leftSH: left ? left.scrollHeight : 0,
        leftCH: left ? left.clientHeight : 0,
        rightHasScroll: right ? right.scrollHeight > right.clientHeight + 2 : false,
        rightSH: right ? right.scrollHeight : 0,
        rightCH: right ? right.clientHeight : 0,
      };
    `);
    console.log("   Notebook 844x390 ScrollCheck (all 6 clues):", JSON.stringify(nbScrollMetrics));
    if (process.env.ENFORCE_LANDSCAPE === "1") {
      assert.ok(nbScrollMetrics.docScrollH <= nbScrollMetrics.innerH + 2, `Notebook doc must not scroll (${nbScrollMetrics.docScrollH} > ${nbScrollMetrics.innerH})`);
      assert.equal(nbScrollMetrics.leftHasScroll, false, `Left journal page must fit 6/6 Polaroids with ZERO inner scroll (${nbScrollMetrics.leftSH}/${nbScrollMetrics.leftCH})`);
      assert.equal(nbScrollMetrics.rightHasScroll, false, `Right Luna page must fit with ZERO inner scroll (${nbScrollMetrics.rightSH}/${nbScrollMetrics.rightCH})`);
    }
    await snap(`vision-landscape-${ROUND_TAG}-05-notebook-844x390.png`);

    await evaluate(`document.querySelector('[data-testid^="clue-card-"]')?.click()`);
    await wait(350);
    const tapModalInLandscape = await evaluate(`
      const el = document.querySelector('.detective-notebook-tap-modal');
      return el ? getComputedStyle(el).display !== 'none' : false;
    `);
    if (process.env.ENFORCE_LANDSCAPE === "1") {
      assert.equal(tapModalInLandscape, false, "Tapping clue card in 844x390 Twin-Page Journal must NOT pop up redundant modal");
    }
    await snap(`vision-landscape-${ROUND_TAG}-05b-notebook-luna-modal-844x390.png`);
    await evaluate(`
      const cb = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Đóng lại"));
      if (cb) cb.click();
    `);
    await wait(250);

    // 6. Deduction Board (UnifiedConclusionView) on 844x390 & 667x375
    await evaluate(`
      const kTab = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.toLowerCase().includes("kết luận"));
      if (kTab) kTab.click();
    `);
    await wait(500);
    for (const cid of ["cand-sleep-phone", "cand-sleep-laptop"]) {
      await evaluate(`document.querySelector('[data-testid="candidate-card-${cid}"]')?.click()`);
      await wait(100);
    }
    await measureViewport("06-conclusion-844x390", 844, 390);
    const conclGeo844 = await evaluate(`
      const sub = document.querySelector('[data-testid="submit-unified-conclusion"]');
      const wires = document.querySelectorAll('svg line').length;
      return {
        submitBottom: sub ? Math.round(sub.getBoundingClientRect().bottom) : 9999,
        fitsIn390WithoutScroll: sub ? sub.getBoundingClientRect().bottom <= 390 : false,
        wires,
      };
    `);
    console.log("   Conclusion 844x390:", JSON.stringify(conclGeo844));
    await snap(`vision-landscape-${ROUND_TAG}-06-conclusion-844x390.png`);

    await send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 375,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(350);
    await measureViewport("06b-conclusion-667x375", 667, 375);
    const conclGeo667 = await evaluate(`
      const sub = document.querySelector('[data-testid="submit-unified-conclusion"]');
      const wires = document.querySelectorAll('svg line').length;
      return {
        submitBottom: sub ? Math.round(sub.getBoundingClientRect().bottom) : 9999,
        fitsIn375WithoutScroll: sub ? sub.getBoundingClientRect().bottom <= 375 : false,
        wires,
      };
    `);
    console.log("   Conclusion 667x375:", JSON.stringify(conclGeo667));
    await snap(`vision-landscape-${ROUND_TAG}-06b-conclusion-667x375.png`);

    // 7. Solve & Check Step 2 Checklist + Solved View at 844x390
    await send("Emulation.setDeviceMetricsOverride", {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(250);
    for (const cid of ["cand-sleep-schedule", "cand-sleep-light"]) {
      await evaluate(`document.querySelector('[data-testid="candidate-card-${cid}"]')?.click()`);
      await wait(100);
    }
    await evaluate(`document.querySelector('[data-testid="submit-unified-conclusion"]')?.click()`);
    await wait(500);
    await measureViewport("07-checklist-844x390", 844, 390);
    await snap(`vision-landscape-${ROUND_TAG}-07-checklist-844x390.png`);

    await evaluate(`document.querySelectorAll('[data-testid^="action-check-"] input[type="checkbox"]').forEach(cb => cb.click())`);
    await wait(200);
    await evaluate(`document.querySelector('[data-testid="confirm-case-completion"]')?.click()`);
    await wait(700);
    await measureViewport("08-solved-844x390", 844, 390);
    await snap(`vision-landscape-${ROUND_TAG}-08-solved-844x390.png`);

    if (process.env.ENFORCE_LANDSCAPE === "1") {
      for (const m of metrics) {
        assert.equal(m.horizOverflow, false, `${m.label} must have 0 horizontal overflow`);
        assert.equal(m.clippedRightCount, 0, `${m.label} must have 0 right-clipped buttons`);
        assert.ok(m.navH <= 44, `${m.label} nav height ${m.navH}px must stay <= 44px`);
      }
      assert.ok(modalScrollCheck.startBtnBottom <= 390, `Luna CTA must fit in 844x390 (${modalScrollCheck.startBtnBottom}px)`);
      assert.equal(sceneGeo844?.fitsInViewport, true, "Scene must fit 844x390 without scroll");
      assert.equal(sceneGeo667?.fitsInViewport, true, "Scene must fit 667x375 without scroll");
      assert.equal(objModalGeo844.saveBtnVisibleIn390, true, "ObjectModal Save CTA must stay visible on 844x390");
      assert.equal(objModalGeo667.saveBtnVisibleIn375, true, "ObjectModal Save CTA must stay visible on 667x375");
      assert.equal(conclGeo844.fitsIn390WithoutScroll, true, `Conclusion 844x390 submitBottom=${conclGeo844.submitBottom} must fit <=390`);
      assert.equal(conclGeo667.fitsIn375WithoutScroll, true, `Conclusion 667x375 submitBottom=${conclGeo667.submitBottom} must fit <=375`);
      assert.ok(conclGeo844.wires >= 1 && conclGeo667.wires >= 1, "SVG connection wires must render on both landscape sizes");
    }

    console.log("\n=== LANDSCAPE AUDIT COMPLETE (" + ROUND_TAG + ") ===");
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Landscape audit failed:", err);
  process.exit(1);
});
