import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const artifactsDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\657e9da8-7551-4202-bc28-ecfcfda170bb";

async function main() {
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
    "http://127.0.0.1:8081",
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const json = await res.json();
        const page = json.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(wsUrl, "Could not get Chrome WebSocket debugger URL");

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === curId) {
            ws.removeEventListener("message", handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    const evaluate = async (expression) => {
      const res = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result ? res.result.value : null;
    };

    const tapText = async (text) => {
      await evaluate(`
        (() => {
          const lower = ${JSON.stringify(text.toLowerCase())};
          const nodes = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && (el.textContent || '').toLowerCase().includes(lower);
          });
          if (nodes.length > 0) {
            const btn = nodes[0].closest('[role="button"]') || nodes[0].closest('[tabindex="0"]') || nodes[0].parentElement;
            btn.click();
            return true;
          }
          const byRole = Array.from(document.querySelectorAll('[role="button"], button, a, [role="tab"]')).find(el => {
            return (el.innerText || el.getAttribute('aria-label') || '').toLowerCase().includes(lower);
          });
          if (byRole) {
            byRole.click();
            return true;
          }
          return false;
        })()
      `);
      await new Promise((r) => setTimeout(r, 800));
    };

    console.log("Navigating to app...");
    await send("Page.navigate", { url: "http://127.0.0.1:8081" });
    await new Promise((r) => setTimeout(r, 2500));

    // Clear storage
    await evaluate(`localStorage.clear(); sessionStorage.clear();`);
    await send("Page.navigate", { url: "http://127.0.0.1:8081" });
    await new Promise((r) => setTimeout(r, 2500));

    console.log("Going through onboarding to enter main game...");
    await tapText("Bắt Đầu Hành Trình");
    await new Promise((r) => setTimeout(r, 1000));

    await tapText("Tiếp Tục Trả Lời Câu Hỏi");
    await new Promise((r) => setTimeout(r, 1000));

    await tapText("Giảm acid uric");
    await tapText("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 600));

    await tapText("Uống ít nước");
    await tapText("Câu Tiếp Theo");
    await new Promise((r) => setTimeout(r, 600));

    await tapText("5 - 10 phút");
    await tapText("Xem Bản Kế Hoạch Sức Khỏe");
    await new Promise((r) => setTimeout(r, 1500));

    // Into World
    await evaluate(`
      (() => {
        const btn = Array.from(document.querySelectorAll('[role="button"], button')).find(b =>
          (b.innerText || '').includes('BƯỚC VÀO') || (b.innerText || '').includes('Bắt Đầu')
        );
        if (btn) btn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 2500));

    console.log("In main game. Now switching to tab 5 (Cá Nhân)...");
    // Click 5th tab in bottom navigation bar
    const tabClicked = await evaluate(`
      (() => {
        // Tab buttons in react navigation bottom bar
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        if (tabs.length >= 5) {
          tabs[4].click();
          return "tab-clicked-by-role";
        }
        // Fallback: look for button or link with text 'Cá Nhân'
        const allBtns = Array.from(document.querySelectorAll('*')).filter(el => {
          return el.children.length === 0 && (el.textContent || '').trim() === 'Cá Nhân';
        });
        if (allBtns.length > 0) {
          (allBtns[0].closest('[role="button"]') || allBtns[0].parentElement).click();
          return "tab-clicked-by-text";
        }
        return "none";
      })()
    `);
    console.log("Tab click result:", tabClicked);

    await new Promise((r) => setTimeout(r, 2000));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(artifactsDir, "audit-vision-12-profile-screen.png"), Buffer.from(shot.data, "base64"));
    console.log("Successfully captured real audit-vision-12-profile-screen.png!");

    ws.close();
  } finally {
    try {
      chromeProc.kill("SIGKILL");
    } catch {}
  }
}

main().catch(console.error);
