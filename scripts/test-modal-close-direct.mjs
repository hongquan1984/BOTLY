import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

async function main() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((r) => probe.listen(0, "127.0.0.1", () => { const p = probe.address().port; probe.close(() => r(p)); }));
  const profile = path.join("d:\\botly\\App\\.tmp\\inspect-ui", "chrome-check-modal-" + Date.now());
  mkdirSync(profile, { recursive: true });

  const proc = spawn(chromePath, [
    "--remote-debugging-port=" + debugPort,
    "--user-data-dir=" + profile,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,720",
    "about:blank"
  ]);

  try {
    let wsUrl = "";
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch("http://127.0.0.1:" + debugPort + "/json/list");
        const json = await res.json();
        const p = json.find(x => x.type === "page" && x.webSocketDebuggerUrl);
        if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    const send = (m, p = {}) => new Promise((res, rej) => {
      const msgId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === msgId) { ws.removeEventListener("message", handler); d.error ? rej(d.error) : res(d.result); }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: msgId, method: m, params: p }));
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url: "http://127.0.0.1:3329/vi/wellness/healthclues/quiz?quest=health-concern&step=discovery" });
    await new Promise(r => setTimeout(r, 2500));

    // Quiz 1
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll("[data-healthclues-two-question-quiz] button[aria-pressed]"));
        btns[0]?.click();
        btns[1]?.click();
        const all = Array.from(document.querySelectorAll("[data-healthclues-two-question-quiz] button"));
        all[all.length-1]?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Quiz 2
    await send("Runtime.evaluate", {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll("[data-healthclues-two-question-quiz] button[aria-pressed]"));
        btns[0]?.click();
        btns[1]?.click();
        const chk = document.querySelector("[data-healthclues-two-question-quiz] input[type=checkbox]");
        if (chk && !chk.checked) chk.click();
        const all = Array.from(document.querySelectorAll("[data-healthclues-two-question-quiz] button"));
        all[all.length-1]?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Confirm suggestions
    await send("Runtime.evaluate", {
      expression: `(() => {
        const labels = Array.from(document.querySelectorAll("label")).filter(l => l.querySelector("input[type=radio]"));
        for (let i = 0; i < labels.length; i += 3) labels[i].click();
        const btn = document.querySelector("[data-confirm-wellness-plan]");
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Instant activate
    await send("Runtime.evaluate", {
      expression: `(() => {
        const start = document.querySelector("[data-start-journey-btn]");
        if (start) start.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    await send("Runtime.evaluate", {
      expression: `(() => {
        const em = document.querySelector("#hc-activation-email") || document.querySelector("input[type=email]");
        if (em) {
          em.value = "hongquan0508@gmail.com";
          em.dispatchEvent(new Event("input", { bubbles: true }));
          em.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const act = document.querySelector("[data-instant-activate-btn]");
        if (act) act.click();
      })()`
    });

    for (let i = 0; i < 30; i++) {
      const u = await send("Runtime.evaluate", { expression: "window.location.href", returnByValue: true });
      if (u.result?.value?.includes("/world")) break;
      await new Promise(r => setTimeout(r, 400));
    }
    await new Promise(r => setTimeout(r, 3500));

    // Check if modal exists
    const before = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const closeBtn = document.querySelector('[data-close-game-modal]');
        const fallbackBtn = document.querySelector('.hc-game-modal-header button');
        return {
          hasModal: Boolean(modal),
          hasDataClose: Boolean(closeBtn),
          hasFallback: Boolean(fallbackBtn),
          dataCloseText: closeBtn?.innerText,
          dataCloseAria: closeBtn?.getAttribute('aria-label')
        };
      })()`,
      returnByValue: true
    });
    console.log("Before close:", before.result?.value);

    // Click data-close-game-modal
    const clickClose = await send("Runtime.evaluate", {
      expression: `(() => {
        const btn = document.querySelector('[data-close-game-modal]') || document.querySelector('.hc-game-modal-header button');
        if (btn) {
          btn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log("Click close result:", clickClose.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    const after = await send("Runtime.evaluate", {
      expression: `(() => {
        const modal = document.querySelector('.hc-game-modal');
        const topbar = document.querySelector('.hc-rpg-topbar');
        const rightPanels = document.querySelector('.hc-rpg-right-panels');
        const bottomDock = document.querySelector('.hc-rpg-bottom-dock');
        const lumiSpeech = document.querySelector('.hc-rpg-lumi-speech');
        return {
          hasModal: Boolean(modal),
          hasTopbar: Boolean(topbar),
          hasRightPanels: Boolean(rightPanels),
          hasBottomDock: Boolean(bottomDock),
          hasLumiSpeech: Boolean(lumiSpeech)
        };
      })()`,
      returnByValue: true
    });
    console.log("After close:", after.result?.value);

    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f", "verified-rpg-hud-reference.png"), Buffer.from(shot.data, "base64"));
    console.log("Captured updated verified-rpg-hud-reference.png!");

    ws.close();
  } finally {
    proc.kill("SIGTERM");
  }
}
main().catch(console.error);
