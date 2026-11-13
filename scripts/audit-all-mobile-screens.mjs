import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
  console.log("================================================================================");
  console.log(" HEALTHCLUES MOBILE GAME: COMPREHENSIVE AI VISION AUDIT (ALL SCREENS)");
  console.log(" Verifying: Ground Pathing, Sleek Typography, No-Roof Standing, Full Flows");
  console.log("================================================================================");

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

  const profileDir = path.join("D:\\botly\\App\\.tmp\\vision-audit", `chrome-profile-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=390,844",
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
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    const evaluate = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result ? res.result.value : null;
    };

    const captureScreenshot = async (filename) => {
      const res = await send("Page.captureScreenshot", { format: "png" });
      const buffer = Buffer.from(res.data, "base64");
      const outPath = path.join(artifactsDir, filename);
      writeFileSync(outPath, buffer);
      console.log(`[+] Captured Artifact: ${filename}`);
      return outPath;
    };

    const tapOnElement = async (textToFind) => {
      const result = await evaluate(`
        (() => {
          const lower = "${textToFind}".toLowerCase();
          const leafNodes = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && el.textContent && el.textContent.toLowerCase().includes(lower);
          });
          if (leafNodes.length === 0) {
            const byRole = Array.from(document.querySelectorAll('[role="button"], button, [aria-label]')).find(el => {
              const label = (el.getAttribute('aria-label') || el.textContent || '').toLowerCase();
              return label.includes(lower);
            });
            if (byRole) {
              byRole.click();
              return { found: true };
            }
            return { found: false, error: 'NO_LEAF' };
          }
          const textNode = leafNodes[0];
          const btn = textNode.closest('[role="button"]') || textNode.closest('[tabindex="0"]') || textNode.parentElement;
          btn.click();
          return { found: true };
        })()
      `);
      if (!result || !result.found) {
        throw new Error(`Element not clickable for text: "${textToFind}"`);
      }
      await new Promise((r) => setTimeout(r, 700));
    };

    // 1. FRESH START: WELCOME SCREEN
    console.log("\n[1/12] Soi Màn Hình Chào Đón & Đăng Nhập...");
    await send("Page.navigate", { url: "http://127.0.0.1:8081" });
    await new Promise((r) => setTimeout(r, 3000));
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await send("Page.navigate", { url: "http://127.0.0.1:8081" });
    await new Promise((r) => setTimeout(r, 3000));
    await captureScreenshot("audit-vision-01-welcome-replica.png");

    // 2. QUEST CHOICE & SLEEP VALLEY LOCK
    console.log("\n[2/12] Soi Màn Hình Chọn Vùng Đất Khám Phá (Sleep Valley Tạm Khóa)...");
    await tapOnElement("Bắt Đầu Hành Trình");
    await new Promise((r) => setTimeout(r, 1200));
    await tapOnElement("Thung Lũng Giấc Ngủ");
    await new Promise((r) => setTimeout(r, 600));
    await captureScreenshot("audit-vision-02-quest-choice-locked-valley.png");

    // 3. ADAPTIVE QUESTIONS
    console.log("\n[3/12] Soi Màn Hình 3 Câu Hỏi Thích Ứng Y Khoa...");
    await tapOnElement("Tiếp Tục Trả Lời Câu Hỏi");
    await new Promise((r) => setTimeout(r, 1000));
    await tapOnElement("Giảm acid uric");
    await captureScreenshot("audit-vision-03-adaptive-questions.png");
    await tapOnElement("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 600));
    await tapOnElement("Uống ít nước");
    await tapOnElement("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 600));
    await tapOnElement("5 - 10 phút");
    await tapOnElement("Xem Bản Kế Hoạch Sức Khỏe");
    await new Promise((r) => setTimeout(r, 1500));

    // 4. PERSONALIZED WELLNESS PLAN (LUMI)
    console.log("\n[4/12] Soi Màn Hình Bản Kế Hoạch Sống Khỏe Khởi Đầu (1 Dòng Đơn)...");
    await captureScreenshot("audit-vision-04-lumi-wellness-plan.png");

    // 5. ENTER WORLD - CHECK NO ROOF STANDING
    console.log("\n[5/12] Soi Bản Đồ RPG Thế Giới: Nhân Vật Đứng Trên Đường Đá Mặt Đất...");
    try {
      await tapOnElement("Bắt Đầu Hành Trình");
    } catch {
      await tapOnElement("Vào Vương Quốc");
    }
    await new Promise((r) => setTimeout(r, 3000));
    await captureScreenshot("audit-vision-05-healthclues-realm-ground-walk.png");

    // 6. TAB HÀNH TRÌNH
    console.log("\n[6/12] Soi Tab Hành Trình (Compact Coach Bar & Thẻ 1 Dòng)...");
    await tapOnElement("Hành Trình");
    await new Promise((r) => setTimeout(r, 2000));
    await captureScreenshot("audit-vision-06-journey-habits-compact.png");

    // 7. MODAL THÊM THÓI QUEN
    console.log("\n[7/12] Soi Modal Thêm Thói Quen Mới...");
    try {
      await tapOnElement("Thêm mới");
    } catch {
      await tapOnElement("Thêm Thói Quen");
    }
    await new Promise((r) => setTimeout(r, 1200));
    await captureScreenshot("audit-vision-07-add-habit-modal.png");

    // Add 4th habit and submit
    await tapOnElement("Uống một cốc nước ấm");
    await new Promise((r) => setTimeout(r, 600));
    await tapOnElement("LƯU THÓI QUEN VÀO HÀNH TRÌNH");
    await new Promise((r) => setTimeout(r, 1500));
    await evaluate(`
      (() => {
        const okBtn = Array.from(document.querySelectorAll('[role="button"], button')).find(b => (b.textContent||'').toLowerCase().includes('ok'));
        if (okBtn) okBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));

    // 8. TAB NHIỆM VỤ (DAILY CARE)
    console.log("\n[8/12] Soi Tab Nhiệm Vụ (Streak 3 Ngày & 4 Thói Quen)...");
    await tapOnElement("Nhiệm Vụ");
    await new Promise((r) => setTimeout(r, 2000));
    await captureScreenshot("audit-vision-08-daily-care-checkin.png");

    // 9. CHECK-IN TO TRIGGER 5-STAR CELEBRATION MODAL
    console.log("\n[9/12] Soi Modal Chúc Mừng 5 Sao Lộng Lẫy (CheckinCelebrationModal)...");
    await evaluate(`
      (async () => {
        const btns = Array.from(document.querySelectorAll('[role="button"], button, [tabindex="0"]'));
        const doneBtns = btns.filter(b => (b.innerText || '').includes('Đã làm'));
        for (const btn of doneBtns) {
          btn.click();
          await new Promise(r => setTimeout(r, 150));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));
    await tapOnElement("LƯU ĐIỂM DANH");
    await new Promise((r) => setTimeout(r, 1500));
    await captureScreenshot("audit-vision-09-celebration-5star-modal.png");

    // Close celebration modal
    await evaluate(`
      (() => {
        const btn = document.querySelector('[aria-label*="Thu Nhận Thưởng"]') ||
                    Array.from(document.querySelectorAll('[role="button"], button')).find(b => (b.innerText||'').includes('Thu Nhận Thưởng'));
        if (btn) {
          btn.click();
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 1200));

    // 10. TAB TÚI ĐỒ (INVENTORY)
    console.log("\n[10/12] Soi Tab Túi Đồ & Tri Thức Y Khoa...");
    await tapOnElement("Túi Đồ");
    await new Promise((r) => setTimeout(r, 2000));
    await captureScreenshot("audit-vision-10-inventory-collection.png");

    // 11. ITEM DETAIL MODAL
    console.log("\n[11/12] Soi Modal Chi Tiết Vật Phẩm RPG (Dược Thảo & PubMed)...");
    await tapOnElement("Trà Hoa Cúc");
    await new Promise((r) => setTimeout(r, 1000));
    await captureScreenshot("audit-vision-11-inventory-item-detail.png");

    // Close item modal
    try {
      await tapOnElement("Đóng chi tiết");
    } catch {
      await evaluate(`
        (() => {
          const closeBtn = document.querySelector('[aria-label="Đóng chi tiết"]') ||
                          Array.from(document.querySelectorAll('[role="button"], button')).find(b => b.querySelector('svg'));
          if (closeBtn) closeBtn.click();
        })()
      `);
    }
    await new Promise((r) => setTimeout(r, 1000));

    // 12. TAB CÁ NHÂN (PROFILE)
    console.log("\n[12/12] Soi Tab Cá Nhân (Profile & Settings)...");
    await tapOnElement("Cá Nhân");
    await new Promise((r) => setTimeout(r, 2000));
    await captureScreenshot("audit-vision-12-profile-screen.png");

    console.log("\n================================================================================");
    console.log(" [🎉 AUDIT HOÀN TẤT] TOÀN BỘ 12 MÀN HÌNH ĐÃ ĐƯỢC MẮT THẦN AI VISION CHỤP LẠI!");
    console.log("================================================================================");
  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch {}
  }
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
