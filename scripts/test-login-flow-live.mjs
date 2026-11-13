import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "d:\\botly";
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

  const profileDir = path.join(root, "App", ".tmp", "inspect-ui", `chrome-login-test-${Date.now()}`);
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=430,932",
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
    assert.ok(targetWs, "Could not find Chrome page WebSocket target.");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let messageId = 0;
    const pending = new Map();
    const consoleLogs = [];
    const networkRequests = [];
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.method === "Network.requestWillBeSent") {
        networkRequests.push({ url: payload.params.request.url, method: payload.params.request.method });
      }
      if (payload.method === "Network.loadingFailed") {
        networkRequests.push({ failed: true, errorText: payload.params.errorText, requestId: payload.params.requestId });
      }
      if (payload.method === "Runtime.consoleAPICalled") {
        consoleLogs.push(payload.params.args.map((a) => a.value || a.description).join(" "));
      }
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(payload.error.message));
        else resolve(payload.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    console.log("Navigating to http://127.0.0.1:8081/login ...");
    await send("Page.navigate", { url: "http://127.0.0.1:8081/login" });
    
    // Wait for inputs to appear
    for (let i = 0; i < 20; i++) {
      const check = await send("Runtime.evaluate", {
        expression: "document.querySelectorAll('input').length",
        returnByValue: true
      });
      if (check.result.value >= 2) break;
      await new Promise((r) => setTimeout(r, 250));
    }

    // Fill in Email and Password
    const evaluateResult = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          const emailInput = inputs.find(i => i.placeholder && i.placeholder.includes('email') || i.type === 'email' || inputs[0] === i);
          const passInput = inputs.find(i => i.type === 'password' || inputs[1] === i);
          
          function setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            
            if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
              prototypeValueSetter.call(element, value);
            } else if (valueSetter) {
              valueSetter.call(element, value);
            } else {
              element.value = value;
            }
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }

          if (emailInput) {
            setNativeValue(emailInput, 'player@botly.vn');
          }
          if (passInput) {
            setNativeValue(passInput, 'healthclues123');
          }

          // Find Login button
          const buttons = Array.from(document.querySelectorAll('div, button')).filter(el => {
            return el.textContent && el.textContent.trim() === 'Đăng nhập' && el.children.length <= 1;
          });
          const loginBtn = buttons[buttons.length - 1];
          if (loginBtn) {
            loginBtn.click();
            return { clicked: true, foundInputs: inputs.length };
          }
          return { clicked: false, foundInputs: inputs.length };
        })()
      `,
      returnByValue: true,
    });

    console.log("Click evaluate:", evaluateResult.result.value);

    // Wait for auth request and potential navigation
    await new Promise((r) => setTimeout(r, 3500));

    const pageState = await send("Runtime.evaluate", {
      expression: `
        ({
          url: window.location.href,
          pathname: window.location.pathname,
          hash: window.location.hash,
          bodyText: document.body.innerText.substring(0, 300)
        })
      `,
      returnByValue: true,
    });
    console.log("Post-login state:", pageState.result.value);

    // Capture screenshot after login
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const outPath = path.join(artifactsDir, "post-login-live.png");
    writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
    console.log(`[+] Captured post-login screenshot: ${outPath}`);

    console.log("Network requests during login:", networkRequests);

    if (consoleLogs.length > 0) {
      console.log("Console logs during login:", consoleLogs.slice(-10));
    }

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
