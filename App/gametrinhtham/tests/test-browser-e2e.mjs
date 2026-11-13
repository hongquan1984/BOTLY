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

async function main() {
  console.log("================================================================================");
  console.log(" HEALTHCLUES MYSTERY DETECTIVE: END-TO-END BROWSER CAMPAIGN TEST (V6 CDP)");
  console.log(` Target: ${BASE_URL}/detective`);
  console.log("================================================================================\n");

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

  const profileDir = path.join("D:\\botly\\App\\.tmp\\detective-e2e", `profile-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,800",
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
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(targetWs, "WebSocket debugger URL not found.");

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
        trimmed.includes(";") ||
        trimmed.includes("const ") ||
        trimmed.includes("let ") ||
        trimmed.includes("if ") ||
        trimmed.includes("return ")
          ? `(() => {\n${trimmed}\n})()`
          : `(() => {\nreturn (${trimmed});\n})()`;
      const res = await send("Runtime.evaluate", {
        expression: wrapped,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        console.error("   [CDP Eval Error]:", res.exceptionDetails.text, res.exceptionDetails.exception?.description);
      }
      return res.result ? res.result.value : null;
    };

    const screenshot = async (filename) => {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      const fullPath = path.join(PREVIEWS_DIR, filename);
      writeFileSync(fullPath, Buffer.from(data, "base64"));
      console.log(`   [Artifact Saved]: ${filename}`);
    };

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function inspectAndRecord(labelFragment, detailIdFragment, openModalShotName) {
      const hitPoint = await evaluate(`
        const hotspot = Array.from(document.querySelectorAll('[aria-label^="Khám phá"]')).find(b =>
          (b.getAttribute('aria-label') || '').includes("${labelFragment}")
        );
        if (!hotspot) return null;
        const rect = hotspot.getBoundingClientRect();
        hotspot.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height };
      `);
      assert.ok(hitPoint && hitPoint.w > 10 && hitPoint.h > 10, `SVG polygon for "${labelFragment}" must have non-zero hitbox`);
      await wait(650);

      await evaluate(`
        const tab = Array.from(document.querySelectorAll('button[data-detail-tab-id], button[data-detail-id]')).find(b =>
          (b.getAttribute('data-detail-tab-id') || b.getAttribute('data-detail-id') || '').includes("${detailIdFragment || ''}")
        );
        if (tab) tab.click();
      `);
      await wait(350);

      if (openModalShotName) {
        await screenshot(openModalShotName);
      }

      const saved = await evaluate(`
        const saveBtn = Array.from(document.querySelectorAll("button")).find(b =>
          b.innerText.includes("GHI NHẬN") || b.innerText.includes("Lưu vào Sổ")
        );
        if (saveBtn) { saveBtn.click(); return true; }
        return false;
      `);
      assert.ok(saved, `Must record detail for "${labelFragment}"`);
      await wait(350);

      await evaluate(`
        const closeBtn = Array.from(document.querySelectorAll("button")).find(b =>
          b.innerText.includes("Quay lại") || b.innerText.includes("Đóng") || b.innerText.trim() === "✕"
        );
        if (closeBtn) closeBtn.click();
      `);
      await wait(350);
    }

    // 1. Navigate to /detective
    console.log("1. Navigating to Case File Library (/detective)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send("Page.navigate", { url: `${BASE_URL}/detective` });
    await wait(2400);

    const heading = await evaluate(`document.querySelector("h1")?.innerText`);
    console.log(`   Page Heading: "${heading}"`);
    assert.ok(heading?.includes("Hồ Sơ Vụ Án"), "Heading must include 'Hồ Sơ Vụ Án'");
    const hasPromoBanner = await evaluate(`document.body.innerText.includes("GAME MỚI")`);
    assert.equal(hasPromoBanner, false, "Game route /detective must hide external promo banner");

    const libSoundToggle = await evaluate(`
      const btn = document.querySelector('[data-testid="library-sound-btn"]');
      if (!btn) return null;
      const before = btn.innerText.trim();
      btn.click();
      return { before, presentAfterFirstClick: true };
    `);
    assert.ok(libSoundToggle?.presentAfterFirstClick, "Library header must expose [data-testid='library-sound-btn']");
    await wait(120);
    const libSoundAfter = await evaluate(`document.querySelector('[data-testid="library-sound-btn"]')?.innerText?.trim() || ""`);
    assert.notEqual(libSoundAfter, libSoundToggle.before, "Clicking library sound button must toggle icon/state");
    await evaluate(`document.querySelector('[data-testid="library-sound-btn"]')?.click()`);
    await wait(120);

    await screenshot("vision-detective-01-library.png");

    // 2. Open Case 001 -> Luna Dialogue
    console.log("\n2. Opening Case 001 dossier...");
    await evaluate(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("BẮT ĐẦU ĐIỀU TRA"));
      if (btn) btn.click();
    `);
    await wait(1000);
    const lunaModalTitle = await evaluate(`document.querySelector("h2")?.innerText`);
    assert.ok(lunaModalTitle?.includes("Bí ẩn đêm không ngủ"), "Modal should display Case 001 title");
    await screenshot("vision-detective-02-luna-invitation.png");

    // 3. Enter Investigation Scene & Scan Polygons
    console.log("\n3. Entering 2D Investigation Scene (Case 001 Bedroom)...");
    const clickedStart = await evaluate(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("HIỆN TRƯỜNG"));
      if (btn) { btn.click(); return true; }
      return false;
    `);
    assert.ok(clickedStart, "Must click HIỆN TRƯỜNG start button");
    await wait(1600);
    await screenshot("vision-detective-03-scene-bedroom.png");

    const hotspotsCount = await evaluate(`document.querySelectorAll('[aria-label^="Khám phá"]').length`);
    console.log(`   Found ${hotspotsCount} interactive SVG polygon hotspots on Case 001 scene`);
    assert.equal(hotspotsCount, 6, "Case 001 must render all 6 SVG polygon hotspots");

    await evaluate(`
      const scanBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Soi Hiện Trường"));
      if (scanBtn) scanBtn.click();
    `);
    await wait(500);
    await screenshot("vision-detective-03b-scan-polygons-case1.png");
    await wait(2600);

    // 4. Inspect & save all 6 objects in Case 001
    console.log("\n4. Inspecting all 6 Case 001 hotspots & saving raw facts...");
    await inspectAndRecord("Điện thoại", "detail-phone-time", "vision-detective-04-inspection-modal.png");
    await inspectAndRecord("cà phê", "detail-coffee-receipt");
    await inspectAndRecord("nhật ký", "detail-diary-schedule");
    await inspectAndRecord("Laptop", "detail-laptop-work", "vision-detective-04b-laptop-modal.png");
    await inspectAndRecord("dương xỉ", "detail-plant-watering");
    await inspectAndRecord("ban công", "detail-window-curtains");

    // 5. Verify Interactive Sổ Vật Chứng & Trợ Lý Y Khoa Luna (Phương án 2)
    console.log("\n5. Verifying Interactive Sổ Vật Chứng & Trợ Lý Luna (Phương án 2)...");
    await evaluate(`
      const notebookBtn = Array.from(document.querySelectorAll("button")).find(b =>
        b.innerText.includes("Sổ Manh Mối") || b.innerText.includes("Sổ Vật Chứng")
      );
      if (notebookBtn) notebookBtn.click();
    `);
    await wait(900);

    // Click coffee card to verify Luna Assistant switches directly to Caffeine general science
    await evaluate(`document.querySelector('[data-testid="clue-card-clue-sleep-coffee"]')?.click()`);
    await wait(300);

    const notebookStats = await evaluate(`({
      cluesCount: document.querySelectorAll('[data-testid^="clue-card-"]').length,
      handbookCount: document.querySelectorAll('[data-testid^="handbook-entry-"]').length,
      bodyText: document.body.innerText
    })`);
    console.log(`   Notebook clues: ${notebookStats.cluesCount}, Unlocked handbook topics: ${notebookStats.handbookCount}`);
    assert.equal(notebookStats.cluesCount, 6, "Must display all 6 recorded clues in Sổ Vật Chứng");
    assert.equal(notebookStats.handbookCount, 6, "Must unlock all 6 matching medical topics in Sổ Tay Y Khoa");
    assert.ok(notebookStats.bodyText.includes("TRỢ LÝ Y KHOA LUNA"), "Luna Assistant panel must explain selected clue's medical science");
    await screenshot("vision-detective-05-notebook.png");

    // 6. Open Unified Conclusion Board & Test Wrong Attempt Star Penalty + Non-Spoiling Hint
    console.log("\n6. Opening Bảng Kết Luận & testing 1 intentional wrong attempt (-1 star, zero spoilers)...");
    await evaluate(`
      const boardBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Bảng Kết Luận") || b.innerText.includes("ĐẾN KẾT LUẬN"));
      if (boardBtn) boardBtn.click();
    `);
    await wait(900);
    const renderedCandOrder = await evaluate(`
      Array.from(document.querySelectorAll('[data-testid^="candidate-card-"]')).map(el =>
        el.getAttribute('data-testid').replace('candidate-card-', '')
      )
    `);
    const sleepTrueSet = new Set(["cand-sleep-phone", "cand-sleep-schedule", "cand-sleep-laptop", "cand-sleep-light"]);
    const top4TrueCount = renderedCandOrder.slice(0, 4).filter(id => sleepTrueSet.has(id)).length;
    console.log(`   Rendered Conclusion Card Order (top/left 4 has ${top4TrueCount}/4 true causes): ${renderedCandOrder.join(", ")}`);
    assert.ok(top4TrueCount >= 1 && top4TrueCount <= 3, `True causes must be shuffled across both sides (top/left has ${top4TrueCount}/4)`);

    // Verify Trap Elimination Mark (✗ Loại trừ bẫy) toggle & auto-unpin behavior
    await evaluate(`document.querySelector('[data-testid="candidate-card-cand-sleep-genetic"]')?.click()`);
    await wait(120);
    await evaluate(`document.querySelector('[data-testid="eliminate-card-cand-sleep-genetic"]')?.click()`);
    await wait(120);
    const elimTest = await evaluate(`({
      elimPressed: document.querySelector('[data-testid="candidate-card-cand-sleep-genetic"]')?.getAttribute('aria-pressed'),
      elimAttr: document.querySelector('[data-testid="candidate-card-cand-sleep-genetic"]')?.getAttribute('data-eliminated'),
      footerText: document.body.innerText.includes('Loại: 1 ✗')
    })`);
    assert.equal(elimTest.elimPressed, "false", "Eliminating a pinned card must automatically unpin it");
    assert.equal(elimTest.elimAttr, "true", "Eliminate button must set data-eliminated='true'");
    assert.ok(elimTest.footerText, "Footer must show 'Loại: 1 ✗' counter");
    // Tapping eliminated card clears mark back to neutral; mark Plant as trap for visual screenshot
    await evaluate(`document.querySelector('[data-testid="candidate-card-cand-sleep-genetic"]')?.click()`);
    await wait(100);
    await evaluate(`document.querySelector('[data-testid="eliminate-card-cand-sleep-plant"]')?.click()`);
    await wait(150);

    await screenshot("vision-detective-06-deduction-board.png");

    // Select 3 true causes + Coffee trap (cand-sleep-coffee)
    for (const id of ["cand-sleep-coffee", "cand-sleep-phone", "cand-sleep-schedule", "cand-sleep-laptop"]) {
      await evaluate(`document.querySelector('[data-testid="candidate-card-${id}"]')?.click()`);
      await wait(150);
    }
    await evaluate(`document.querySelector('[data-testid="submit-unified-conclusion"]')?.click()`);
    await wait(600);

    const wrongAttemptInfo = await evaluate(`({
      errorText: document.querySelector('[data-testid="conclusion-error-feedback"]')?.innerText || '',
      starText: document.querySelector('[data-testid="conclusion-star-meter"]')?.innerText || ''
    })`);
    console.log("   Wrong attempt meter:", wrongAttemptInfo.starText.replace(/\n/g, " | "));
    console.log("   Wrong attempt feedback:", wrongAttemptInfo.errorText.replace(/\n/g, " | "));
    assert.ok(wrongAttemptInfo.errorText.length > 20, "Must show error banner after wrong submission");
    assert.ok(!wrongAttemptInfo.errorText.toLowerCase().includes("cà phê"), "Feedback must NEVER spoil 'cà phê'");
    assert.ok(!wrongAttemptInfo.errorText.includes("07:00"), "Feedback must NEVER spoil '07:00'");
    assert.ok(wrongAttemptInfo.starText.includes("2/3"), "Star meter must drop cleanly from 3/3 to 2/3");
    await screenshot("vision-detective-06b-wrong-attempt-star-drop.png");

    // Switch Coffee -> Balcony Light (cand-sleep-light) -> Solve Step 1 -> Step 2 Checklist
    await evaluate(`document.querySelector('[data-testid="candidate-card-cand-sleep-coffee"]')?.click()`);
    await wait(150);
    await evaluate(`document.querySelector('[data-testid="candidate-card-cand-sleep-light"]')?.click()`);
    await wait(200);
    await evaluate(`document.querySelector('[data-testid="submit-unified-conclusion"]')?.click()`);
    await wait(700);

    const checklistVisible = await evaluate(`Boolean(document.querySelector('[data-testid="checklist-confirm-step"]'))`);
    assert.ok(checklistVisible, "Exact 4-cause match must unlock Step 2 Checklist Đối Chiếu");
    await screenshot("vision-detective-06c-checklist-confirm.png");

    // Tick all action checkboxes & Confirm
    await evaluate(`
      document.querySelectorAll('[data-testid^="action-check-"] input[type="checkbox"]').forEach(cb => cb.click());
    `);
    await wait(300);
    await evaluate(`document.querySelector('[data-testid="confirm-case-completion"]')?.click()`);
    await wait(1000);

    const solvedText01 = await evaluate(`document.body.innerText`);
    assert.ok(solvedText01.includes("HỒ SƠ ĐÃ PHÁ GIẢI HOÀN TOÀN"), "Case 001 Solved view must appear");
    assert.ok(solvedText01.includes("2/3 sao"), "Case 001 must record 2/3 stars after 1 wrong submission");
    await screenshot("vision-detective-07-case-01-solved.png");

    // 7. Immediate Unlock of Case 002
    console.log("\n7. Advancing to Case 002 (Immediate unlock)...");
    await evaluate(`
      const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("MỞ KHÓA VỤ ÁN TIẾP THEO"));
      if (nextBtn) nextBtn.click();
    `);
    await wait(1000);
    const case2Title = await evaluate(`document.querySelector("h2")?.innerText`);
    assert.ok(case2Title?.includes("Bí ẩn cơn đau lúc nửa đêm"), "Must transition immediately to Case 002");
    await screenshot("vision-detective-08-case-02-unlocked.png");

    // 8. Enter Case 002 Scene & Inspect All 6 Hotspots
    console.log("\n8. Entering Case 002 scene & inspecting all 6 Living Room hotspots...");
    await evaluate(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("HIỆN TRƯỜNG"));
      if (btn) btn.click();
    `);
    await wait(1400);
    await screenshot("vision-detective-09-case-02-scene.png");

    await evaluate(`
      const scanBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Soi Hiện Trường"));
      if (scanBtn) scanBtn.click();
    `);
    await wait(500);
    await screenshot("vision-detective-09b-scan-polygons-case2.png");
    await wait(2500);

    await inspectAndRecord("đĩa bò", "detail-photo-exif");
    await inspectAndRecord("SEAFOOD", "detail-bill-items");
    await inspectAndRecord("Bình giữ nhiệt", "detail-water-vol");
    await inspectAndRecord("ALLOPURINOL", "detail-meds-allopurinol");
    await inspectAndRecord("LAB RESULTS", "detail-lab-urate");
    await inspectAndRecord("Kệ sách", "detail-shelf-posture");

    // 9. Solve Case 002 Conclusion in 1 Try (3 Stars)
    console.log("\n9. Solving Case 002 Bảng Kết Luận cleanly on 1st attempt (3 stars)...");
    await evaluate(`
      const boardBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Bảng Kết Luận"));
      if (boardBtn) boardBtn.click();
    `);
    await wait(800);

    for (const id of ["cand-gout-meds", "cand-gout-lab", "cand-gout-water", "cand-gout-bill"]) {
      await evaluate(`document.querySelector('[data-testid="candidate-card-${id}"]')?.click()`);
      await wait(150);
    }
    await evaluate(`document.querySelector('[data-testid="submit-unified-conclusion"]')?.click()`);
    await wait(700);

    const goutStep2 = await evaluate(`Boolean(document.querySelector('[data-testid="checklist-confirm-step"]'))`);
    assert.ok(goutStep2, "Case 002 must reach Step 2 Checklist Đối Chiếu on 1st attempt");
    await screenshot("vision-detective-10-case-02-checklist.png");

    await evaluate(`
      document.querySelectorAll('[data-testid^="action-check-"] input[type="checkbox"]').forEach(cb => cb.click());
    `);
    await wait(250);
    await evaluate(`document.querySelector('[data-testid="confirm-case-completion"]')?.click()`);
    await wait(1000);

    const solvedText02 = await evaluate(`document.body.innerText`);
    assert.ok(solvedText02.includes("3/3 sao"), "Case 002 first-try solve must award 3/3 stars");
    const coinsBadge02 = await evaluate(`document.querySelector('[data-testid="solved-coins-awarded"]')?.innerText || ""`);
    console.log(`   Case 002 Bounty Awarded: "${coinsBadge02}"`);
    assert.ok(coinsBadge02.includes("+200 Xu"), `Case 002 3* must award +200 Xu (got: ${coinsBadge02})`);

    // Return to Library & check Xu Wallet (105 from 2* Case 001 + 200 from 3* Case 002 = 305 Xu) + Chapter 2 tabs
    await evaluate(`
      const libBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Danh sách hồ sơ") || b.innerText.includes("Thư Viện"));
      if (libBtn) libBtn.click();
    `);
    await wait(900);
    const libraryWallet = await evaluate(`document.querySelector('[data-testid="library-wallet-coins"]')?.innerText || ""`);
    console.log(`   Library Xu Wallet Balance after Case 001 (2*) + Case 002 (3*): "${libraryWallet}"`);
    assert.ok(libraryWallet.includes("305 Xu"), `Wallet should show 305 Xu (105 + 200), got "${libraryWallet}"`);
    await screenshot("vision-detective-11-campaign-progress.png");

    // 9b. Verify Chapter 2 Locked Cards + Play Through Case 003 -> Case 004 -> Case 005 -> Case 006 (All 6 Cases & 1655 Xu!)
    console.log("\n9b. Verifying Chapter 2 & Playing Through Cases 003, 004, 005, 006 End-to-End...");
    await evaluate(`document.querySelector('[data-testid="chapter-tab-chapter-02"]')?.click()`);
    await wait(450);
    const ch2Text = await evaluate(`document.body.innerText`);
    assert.ok(ch2Text.includes("Cơn nóng rát lúc 1 giờ sáng"), "Chapter 2 must list Case 004");
    assert.ok(ch2Text.includes("Cú sập nguồn lúc 3 giờ chiều"), "Chapter 2 must list Case 005");
    assert.ok(ch2Text.includes("Đôi chân cứng đơ sau buổi chạy tối"), "Chapter 2 must list Case 006");
    assert.ok(ch2Text.includes("+300 Xu") && ch2Text.includes("+450 Xu"), "Chapter 2 locked cards must show Xu bounty preview");
    await screenshot("vision-detective-11b-chapter2-library.png");

    async function completeOpenCaseFromInvitation(config) {
      await evaluate(`
        const enterBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("HIỆN TRƯỜNG"));
        if (enterBtn) enterBtn.click();
      `);
      await wait(1000);
      const polyCount = await evaluate(`document.querySelectorAll('polygon').length`);
      console.log(`   [${config.label}] Found ${polyCount} interactive SVG polygon hotspots`);
      assert.equal(polyCount, 6, `${config.label} must define 6 SVG polygon hotspots`);
      if (config.sceneShot) {
        await screenshot(config.sceneShot);
      }

      for (let i = 0; i < config.hotspotLabels.length; i++) {
        const frag = config.hotspotLabels[i];
        await evaluate(`
          const hs = Array.from(document.querySelectorAll('[aria-label^="Khám phá"]')).find(el =>
            (el.getAttribute('aria-label') || '').includes("${frag}")
          );
          if (hs) hs.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        `);
        await wait(240);
        if (i === 0) {
          const modalText = await evaluate(`document.body.innerText`);
          assert.ok(!modalText.includes("SLEEPHAVEN") && !modalText.includes("SEAFOOD & BEER"), `${config.label} Layer 2 must not leak Case 001/002 props`);
        }
        await evaluate(`document.querySelector('button[data-detail-tab-id]')?.click()`);
        await wait(160);
        await evaluate(`
          const saveBtn = document.querySelector('[data-testid="object-save-action"]');
          if (saveBtn && saveBtn.innerText.includes("GHI NHẬN")) saveBtn.click();
        `);
        await wait(180);
        await evaluate(`
          const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Quay lại") || b.innerText.trim() === "✕");
          if (closeBtn) closeBtn.click();
        `);
        await wait(180);
      }

      await evaluate(`
        const kTab = Array.from(document.querySelectorAll("nav button")).find(b =>
          b.innerText.toLowerCase().includes("kết luận")
        );
        if (kTab) kTab.click();
      `);
      await wait(550);

      for (const cid of config.trueCandidateIds) {
        const clickedCard = await evaluate(`
          const el = document.querySelector('[data-testid="candidate-card-${cid}"]');
          if (el) { el.click(); return true; }
          return false;
        `);
        assert.ok(clickedCard, `${config.label} candidate card ${cid} must be unlocked & clickable`);
        await wait(120);
      }
      await evaluate(`document.querySelector('[data-testid="submit-unified-conclusion"]')?.click()`);
      await wait(600);
      const step2Visible = await evaluate(`Boolean(document.querySelector('[data-testid="checklist-confirm-step"]'))`);
      assert.ok(step2Visible, `${config.label} must reach Step 2 Checklist Đối Chiếu after selecting 4 true causes`);
      await evaluate(`
        document.querySelectorAll('[data-testid^="action-check-"] input[type="checkbox"]').forEach(cb => cb.click());
      `);
      await wait(250);
      await evaluate(`document.querySelector('[data-testid="confirm-case-completion"]')?.click()`);
      await wait(750);

      const bountyText = await evaluate(`document.querySelector('[data-testid="solved-coins-awarded"]')?.innerText || ""`);
      console.log(`   [${config.label}] Solved 3/3 -> Awarded: "${bountyText}"`);
      assert.ok(bountyText.includes(`+${config.expectedCoins} Xu`), `${config.label} must award +${config.expectedCoins} Xu`);

      if (config.advanceNext) {
        await evaluate(`
          const nxt = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("MỞ KHÓA VỤ ÁN TIẾP THEO"));
          if (nxt) nxt.click();
        `);
        await wait(450);
      }
    }

    // Launch Case 003 via Library CTA
    await evaluate(`document.querySelector('[data-testid="chapter-tab-chapter-01"]')?.click()`);
    await wait(300);
    await evaluate(`
      const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("TIẾP TỤC ĐIỀU TRA"));
      if (nextBtn) nextBtn.click();
    `);
    await wait(450);

    await completeOpenCaseFromInvitation({
      label: "Case 003 (Migraine)",
      sceneShot: "vision-detective-08b-case-03-scene.png",
      hotspotLabels: ["Tập hồ sơ dự án", "Laptop màn hình", "Cặp kính", "Sổ tay", "Tách trà xanh", "Chậu cây xanh"],
      trueCandidateIds: ["cand-mig-stress", "cand-mig-glare", "cand-mig-fasting", "cand-mig-sleep"],
      expectedCoins: 250,
      advanceNext: true,
    });

    await completeOpenCaseFromInvitation({
      label: "Case 004 (Acid Reflux)",
      sceneShot: "vision-detective-11c-case-04-scene.png",
      hotspotLabels: ["Hộp gà rán", "Lon nước có ga", "Gối nằm bẹt", "Thắt lưng", "Bình nước lọc", "Chậu xương rồng"],
      trueCandidateIds: ["cand-reflux-takeout", "cand-reflux-soda", "cand-reflux-pillow", "cand-reflux-belt"],
      expectedCoins: 300,
      advanceNext: true,
    });

    await completeOpenCaseFromInvitation({
      label: "Case 005 (Afternoon Fatigue)",
      sceneShot: "vision-detective-11d-case-05-scene.png",
      hotspotLabels: ["Khay trà sữa", "Smartphone", "Bình nước 1L", "Bảng ghim", "Tai nghe", "Chậu sen đá"],
      trueCandidateIds: ["cand-fatigue-tray", "cand-fatigue-breakfast", "cand-fatigue-water", "cand-fatigue-sitting"],
      expectedCoins: 350,
      advanceNext: true,
    });

    await completeOpenCaseFromInvitation({
      label: "Case 006 (Electrolyte & Cramps)",
      sceneShot: "vision-detective-11e-case-06-scene.png",
      hotspotLabels: ["Đồng hồ thể thao", "Chai nước lọc trắng", "Lon nước tăng lực", "Thảm giãn cơ", "Đôi giày chạy", "Lọ tinh dầu"],
      trueCandidateIds: ["cand-elec-overtrain", "cand-elec-water", "cand-elec-energy", "cand-elec-yogamat"],
      expectedCoins: 450,
      advanceNext: false,
    });

    // Return to Library -> verify total wallet = 1655 Xu, Rank = Bậc thầy bí ẩn, & Chapter 2 = 3/3
    await evaluate(`
      const libBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Danh sách hồ sơ") || b.innerText.includes("Thư Viện"));
      if (libBtn) libBtn.click();
    `);
    await wait(700);
    await evaluate(`document.querySelector('[data-testid="chapter-tab-chapter-02"]')?.click()`);
    await wait(450);

    const finalLibText = await evaluate(`document.body.innerText`);
    const finalWallet = await evaluate(`document.querySelector('[data-testid="library-wallet-coins"]')?.innerText || ""`);
    console.log(`   Final Campaign Library Wallet: "${finalWallet}" (6/6 Cases, Rank check)`);
    assert.ok(finalWallet.includes("1655 Xu"), `Total wallet across 6 cases (2* Case1 105 + 1550) must be 1655 Xu, got "${finalWallet}"`);
    assert.ok(finalLibText.includes("Bậc thầy bí ẩn"), "Solving all 6 cases must promote detective to top rank Bậc thầy bí ẩn");
    await screenshot("vision-detective-11f-all-6-solved.png");

    // Switch back to Chapter 1 Library for Step 10 Mobile Viewport checks
    await evaluate(`document.querySelector('[data-testid="chapter-tab-chapter-01"]')?.click()`);
    await wait(450);

    // 10. Mobile Viewport Audit (390x844 - Single-Row Nav, Tap Card -> Luna Popup, Top-Half Candidate Choices)
    console.log("\n10. Checking Mobile Viewport UX (390x844)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(700);
    await screenshot("vision-detective-12-mobile-library.png");

    // Enter Case 001 ("CHƠI LẠI VỤ ÁN") -> HIỆN TRƯỜNG -> Verify 1-row nav height & compact UI
    await evaluate(`
      const replayBtn = Array.from(document.querySelectorAll("button")).find(b =>
        b.innerText.includes("CHƠI LẠI VỤ ÁN")
      );
      if (replayBtn) replayBtn.click();
    `);
    await wait(600);
    await evaluate(`
      const enterBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("HIỆN TRƯỜNG"));
      if (enterBtn) enterBtn.click();
    `);
    await wait(600);

    const navGeo = await evaluate(`
      const nav = document.querySelector("nav");
      return nav ? Math.round(nav.getBoundingClientRect().height) : 999;
    `);
    console.log(`   Mobile Top Nav height: ${navGeo}px (must stay <= 48px single-row)`);
    assert.ok(navGeo <= 48, `Mobile Top Nav wrapped or bloated (${navGeo}px > 48px)`);

    const navSoundToggle = await evaluate(`
      const btn = document.querySelector('[data-testid="toggle-sound-btn"]');
      if (!btn) return null;
      const before = btn.innerText.trim();
      btn.click();
      return { before };
    `);
    assert.ok(navSoundToggle, "Top Nav must expose [data-testid='toggle-sound-btn']");
    await wait(120);
    const navSoundAfter = await evaluate(`document.querySelector('[data-testid="toggle-sound-btn"]')?.innerText?.trim() || ""`);
    assert.notEqual(navSoundAfter, navSoundToggle.before, "Top Nav sound toggle must switch audio state cleanly");
    await evaluate(`document.querySelector('[data-testid="toggle-sound-btn"]')?.click()`);
    await wait(120);

    const mobileSceneTop = await evaluate(`
      const canvas = document.querySelector('main img');
      return canvas ? Math.round(canvas.getBoundingClientRect().top) : 9999;
    `);
    console.log(`   Mobile Scene Artwork top Y: ${mobileSceneTop}px (must start <= 65px right under HUD)`);
    assert.ok(mobileSceneTop <= 65, `Scene artwork pushed down by wasted header chrome (${mobileSceneTop}px > 65px)`);
    await screenshot("vision-detective-12a-mobile-scene.png");

    // Tap "Sổ" tab & tap clue card -> Luna Assistant Modal appears cleanly on Mobile
    await evaluate(`
      const sTab = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.includes("Sổ"));
      if (sTab) sTab.click();
    `);
    await wait(500);
    const mobileFirstClueTop = await evaluate(`
      const c = document.querySelector('[data-testid^="clue-card-"]');
      return c ? Math.round(c.getBoundingClientRect().top) : 9999;
    `);
    console.log(`   Mobile First Clue Card top Y: ${mobileFirstClueTop}px (must start <= 125px)`);
    assert.ok(mobileFirstClueTop <= 125, `First clue card pushed too far down (${mobileFirstClueTop}px > 125px)`);

    await evaluate(`document.querySelector('[data-testid="clue-card-clue-sleep-coffee"]')?.click()`);
    await wait(500);
    const mobileLunaOk = await evaluate(`document.body.innerText.includes("TRỢ LÝ Y KHOA LUNA")`);
    assert.ok(mobileLunaOk, "Tapping clue card on mobile must open Trợ Lý Y Khoa Luna popup");
    await screenshot("vision-detective-12b-mobile-notebook-luna.png");
    await evaluate(`
      const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Đóng lại"));
      if (closeBtn) closeBtn.click();
    `);
    await wait(300);

    // Switch to Conclusion tab -> Verify Mobile Vertical Butterfly Pinboard + SVG Threads fit inside 844px!
    await evaluate(`
      const kTab = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.includes("Kết luận"));
      if (kTab) kTab.click();
    `);
    await wait(500);
    const mobileConclusionGeo = await evaluate(`
      const card = document.querySelector('[data-testid^="candidate-card-"]');
      const submitBtn = document.querySelector('[data-testid="submit-unified-conclusion"]');
      const svgWireCount = document.querySelectorAll('svg line').length;
      return {
        firstCandTop: card ? Math.round(card.getBoundingClientRect().top) : 9999,
        submitBottom: submitBtn ? Math.round(submitBtn.getBoundingClientRect().bottom) : 9999,
        svgWireCount,
      };
    `);
    console.log(`   Mobile Conclusion Geometry: firstCardTop=${mobileConclusionGeo.firstCandTop}px, submitBottom=${mobileConclusionGeo.submitBottom}px (<=844), wires=${mobileConclusionGeo.svgWireCount}`);
    assert.ok(mobileConclusionGeo.firstCandTop <= 145, `Conclusion choice cards pushed too far down on mobile (${mobileConclusionGeo.firstCandTop}px > 145px)`);
    assert.ok(mobileConclusionGeo.svgWireCount >= 1, "Mobile Vertical Pinboard must draw live SVG connection wires to Center Lock");
    assert.ok(mobileConclusionGeo.submitBottom <= 844, `Submit button cut off below 844px viewport (${mobileConclusionGeo.submitBottom}px > 844px)`);
    await screenshot("vision-detective-12c-mobile-conclusion.png");

    // Also test Mobile ObjectInspectionModal sticky Save button visibility on Phone!
    await evaluate(`
      const pTab = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.includes("Phòng"));
      if (pTab) pTab.click();
    `);
    await wait(500);
    await evaluate(`
      Array.from(document.querySelectorAll('[aria-label^="Khám phá"]')).find(b => (b.getAttribute('aria-label')||'').includes('Điện thoại'))?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    `);
    await wait(500);
    await evaluate(`document.querySelector('[data-detail-tab-id="detail-phone-time"]')?.click()`);
    await wait(300);
    const mobileModalFooter = await evaluate(`
      const actionEl = document.querySelector('[data-testid="object-save-action"]');
      return actionEl ? Math.round(actionEl.getBoundingClientRect().bottom) : 9999;
    `);
    console.log(`   Mobile ObjectModal Save/Status Button bottom Y: ${mobileModalFooter}px (must stay visible <= 844px)`);
    assert.ok(mobileModalFooter <= 844, `Mobile ObjectModal Save button pushed off-screen (${mobileModalFooter}px > 844px)`);
    await screenshot("vision-detective-12d-mobile-object-modal.png");

    // 10b. Short/Landscape Viewport Regression Check (667x340 -> Image 1 reproduction)
    await evaluate(`
      const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Quay lại") || b.innerText.trim() === "✕");
      if (closeBtn) closeBtn.click();
    `);
    await wait(250);
    await evaluate(`
      const libBtn = Array.from(document.querySelectorAll("nav button")).find(b => b.innerText.includes("Hồ sơ"));
      if (libBtn) libBtn.click();
    `);
    await wait(450);
    await send("Emulation.setDeviceMetricsOverride", {
      width: 667,
      height: 340,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await evaluate(`
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("CHƠI LẠI") || b.innerText.includes("BẮT ĐẦU ĐIỀU TRA"));
      if (btn) btn.click();
    `);
    await wait(450);
    const shortModalCheck = await evaluate(`
      const backdrop = document.querySelector('[data-testid="luna-dialogue-backdrop"]');
      const card = document.querySelector('[data-testid="luna-dialogue-card"]');
      const topAtZero = card ? Math.round(card.getBoundingClientRect().top) : -999;
      if (backdrop) backdrop.scrollTop = backdrop.scrollHeight;
      const startBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("BẮT ĐẦU ĐIỀU TRA HIỆN TRƯỜNG"));
      const bottomAfterScroll = startBtn ? Math.round(startBtn.getBoundingClientRect().bottom) : 9999;
      return { topAtZero, bottomAfterScroll };
    `);
    console.log(`   Short Landscape Modal (667x340): cardTop=${shortModalCheck.topAtZero}px (>=8), scrolledStartBtnBottom=${shortModalCheck.bottomAfterScroll}px (<=340)`);
    assert.ok(shortModalCheck.topAtZero >= 8, `Short viewport Luna modal top must NEVER clip behind navbar/top edge (${shortModalCheck.topAtZero}px < 8px)`);
    assert.ok(shortModalCheck.bottomAfterScroll <= 340, `Scrolling modal backdrop must reach Start CTA (${shortModalCheck.bottomAfterScroll}px > 340px)`);
    await evaluate(`
      const backdrop = document.querySelector('[data-testid="luna-dialogue-backdrop"]');
      if (backdrop) backdrop.scrollTop = 0;
    `);
    await wait(150);
    await screenshot("vision-detective-12e-short-landscape-modal.png");

    // 11. Admin Editor Check (/admin/detective)
    console.log("\n11. Checking Admin Case Editor (/admin/detective)...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: `${BASE_URL}/admin/detective` });
    await wait(1800);
    const adminTitle = await evaluate(`document.querySelector("h1")?.innerText`);
    assert.ok(adminTitle?.includes("Admin Case"), "Admin page must load cleanly");
    await screenshot("vision-detective-13-admin-case-editor.png");

    await evaluate(`
      const tabHotspot = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Visual Hotspot Editor"));
      if (tabHotspot) tabHotspot.click();
    `);
    await wait(700);
    await screenshot("vision-detective-13b-admin-visual-hotspots.png");

    console.log("\n================================================================================");
    console.log(" 🎉 ALL V6 BROWSER E2E ASSERTIONS & SCREENSHOTS PASSED (100%)!");
    console.log("================================================================================\n");
  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch {}
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
