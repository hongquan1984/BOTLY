import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const targetUrl = "http://127.0.0.1:3360/";
const previewDir = "D:\\botly\\LADIPAGE\\previews";
mkdirSync(previewDir, { recursive: true });

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

  const profileDir = path.join("D:\\botly\\App\\.tmp", "chrome-ladipage-" + Date.now());
  mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1440,900",
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
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not connect to Chrome debugging target");

    const ws = new WebSocket(targetWs);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      if (payload.id && pending.has(payload.id)) {
        const { resolve, reject } = pending.get(payload.id);
        pending.delete(payload.id);
        if (payload.error) reject(new Error(JSON.stringify(payload.error)));
        else resolve(payload.result);
      }
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");

    // ==========================================
    // 1. DESKTOP VIEWPORT: 1440 x 900
    // ==========================================
    console.log("Setting desktop viewport 1440x900...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to " + targetUrl + " ...");
    await send("Page.navigate", { url: targetUrl });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Desktop Hero
    console.log("Capturing Desktop 1440x900 Hero...");
    let shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "desktop-1440x900-hero.png"), Buffer.from(shot.data, "base64"));
    writeFileSync(path.join(previewDir, "desktop-01-hero.png"), Buffer.from(shot.data, "base64"));

    // Verify CTA button link
    const ctaEval = await send("Runtime.evaluate", {
      expression: `
        const btn = document.getElementById('hero-primary-cta');
        ({
          exists: !!btn,
          href: btn ? btn.getAttribute('href') : null,
          text: btn ? btn.innerText.trim() : null,
          computedDisplay: btn ? window.getComputedStyle(btn).display : null
        })
      `,
      returnByValue: true,
    });
    console.log("CTA Button Evaluation:", ctaEval.result ? ctaEval.result.value : ctaEval);

    // ==========================================
    // 2. MOBILE VIEWPORT 1: iPhone X/11/12 mini (375 x 812)
    // ==========================================
    console.log("Setting mobile viewport 375x812...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Capturing Mobile 375x812 Hero...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-375x812-hero.png"), Buffer.from(shot.data, "base64"));

    // ==========================================
    // 3. MOBILE VIEWPORT 2: iPhone 12/13/14 (390 x 844)
    // ==========================================
    console.log("Setting mobile viewport 390x844...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
    await new Promise((r) => setTimeout(r, 800));
    console.log("Capturing Mobile 390x844 Hero...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-390x844-hero.png"), Buffer.from(shot.data, "base64"));
    writeFileSync(path.join(previewDir, "mobile-01-hero.png"), Buffer.from(shot.data, "base64"));

    // ==========================================
    // 4. MOBILE VIEWPORT 3: iPhone 14/15 Pro Max (430 x 932)
    // ==========================================
    console.log("Setting mobile viewport 430x932...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 430,
      height: 932,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0);" });
    await new Promise((r) => setTimeout(r, 800));
    console.log("Capturing Mobile 430x932 Hero...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-430x932-hero.png"), Buffer.from(shot.data, "base64"));
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-01-hero.png"), Buffer.from(shot.data, "base64"));

    await send("Runtime.evaluate", {
      expression: "document.getElementById('seven-doors').scrollIntoView({ behavior: 'instant' });",
    });
    await new Promise((r) => setTimeout(r, 700));
    console.log("Capturing Mobile 3D Carousel...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-02-carousel-3d.png"), Buffer.from(shot.data, "base64"));

    await send("Runtime.evaluate", {
      expression: "document.getElementById('journey-steps').scrollIntoView({ behavior: 'instant' });",
    });
    await new Promise((r) => setTimeout(r, 700));
    console.log("Capturing Mobile Journey Pipeline...");
    shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(previewDir, "mobile-03-journey-pipeline.png"), Buffer.from(shot.data, "base64"));

    console.log("All screenshots successfully captured in " + previewDir);
    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
