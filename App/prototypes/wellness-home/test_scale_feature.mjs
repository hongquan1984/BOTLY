import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = "D:\\botly\\App\\prototypes\\wellness-home";
const outputDir = path.join(root, "evidence");
mkdirSync(outputDir, { recursive: true });

async function cdpSend(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off("message", handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function testScaleFeature() {
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

  const profileDir = path.join(root, ".tmp-scale-chrome-profile");
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
        const list = await res.json();
        const page = list.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(targetWs, "Failed to connect to Chrome debugging WebSocket.");

    const { default: WebSocket } = await import("ws");
    const ws = new WebSocket(targetWs);
    await new Promise((resolve) => ws.once("open", resolve));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");
    await cdpSend(ws, "DOM.enable");

    // Navigate to prototype
    await cdpSend(ws, "Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 1200));

    // Switch to scene_interior
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `switchScene('scene_interior');`
    });
    await new Promise((r) => setTimeout(r, 600));

    // Test 1: Check initial scale & width of outdoor_table_01
    const evalInitial = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const img = node ? node.querySelector('.slot-item-img') : null;
        const scaleBadge = node ? node.querySelector('.slot-scale-val') : null;
        return {
          found: !!node,
          imgWidth: img ? img.offsetWidth : 0,
          scaleText: scaleBadge ? scaleBadge.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log("Initial table state:", evalInitial.result.value);
    assert.ok(evalInitial.result.value.found, "outdoor_table_01 node should exist");

    // Test 2: Scale UP by +30% (to 130%)
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `changeItemScale('outdoor_table_01', 0.3, false);`
    });
    await new Promise((r) => setTimeout(r, 500));

    const evalScaledUp = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const img = node ? node.querySelector('.slot-item-img') : null;
        const shadow = node ? node.querySelector('.slot-contact-shadow') : null;
        const sunShadow = node ? node.querySelector('.slot-sunlight-shadow') : null;
        const scaleBadge = node ? node.querySelector('.slot-scale-val') : null;
        return {
          imgWidth: img ? img.offsetWidth : 0,
          shadowWidth: shadow ? shadow.offsetWidth : 0,
          sunShadowWidth: sunShadow ? sunShadow.offsetWidth : 0,
          scaleText: scaleBadge ? scaleBadge.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log("Scaled up state (+30%):", evalScaledUp.result.value);
    assert.equal(evalScaledUp.result.value.scaleText, "130%", "Scale badge should show 130%");
    assert.ok(evalScaledUp.result.value.imgWidth > evalInitial.result.value.imgWidth, "Image width should increase");

    // Capture screenshot: Scaled Up
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "05a-scale-zoomed-in-130.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured 05a-scale-zoomed-in-130.png");

    // Test 3: Scale DOWN to 75%
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `applyScale('outdoor_table_01', 0.75, true);`
    });
    await new Promise((r) => setTimeout(r, 500));

    const evalScaledDown = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const img = node ? node.querySelector('.slot-item-img') : null;
        const scaleBadge = node ? node.querySelector('.slot-scale-val') : null;
        return {
          imgWidth: img ? img.offsetWidth : 0,
          scaleText: scaleBadge ? scaleBadge.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log("Scaled down state (75%):", evalScaledDown.result.value);
    assert.equal(evalScaledDown.result.value.scaleText, "75%", "Scale badge should show 75%");
    assert.ok(evalScaledDown.result.value.imgWidth < evalInitial.result.value.imgWidth, "Image width should be smaller than initial");

    // Capture screenshot: Scaled Down
    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "05b-scale-zoomed-out-75.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured 05b-scale-zoomed-out-75.png");

    // Test 4: Open modal and verify modal scale controls
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `openItemModal('outdoor_table_01');`
    });
    await new Promise((r) => setTimeout(r, 600));

    const evalModal = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const slider = document.getElementById('modal-scale-slider');
        const badge = document.getElementById('modal-scale-val');
        return {
          sliderVal: slider ? slider.value : '',
          badgeText: badge ? badge.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    console.log("Modal scale state:", evalModal.result.value);
    assert.equal(evalModal.result.value.badgeText, "75%", "Modal scale badge should reflect 75%");

    // Capture screenshot: Modal Scale Section
    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "05c-scale-modal-slider.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured 05c-scale-modal-slider.png");

    // Close modal & reset back to 100%
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        closeItemModal();
        applyScale('outdoor_table_01', 1.0, true);
      })()`
    });
    await new Promise((r) => setTimeout(r, 500));

    const evalReset = await cdpSend(ws, "Runtime.evaluate", {
      expression: `(() => {
        const node = document.querySelector('.slot-node[data-item-id="outdoor_table_01"]');
        const scaleBadge = node ? node.querySelector('.slot-scale-val') : null;
        return { scaleText: scaleBadge ? scaleBadge.textContent : '' };
      })()`,
      returnByValue: true
    });
    console.log("Reset state (100%):", evalReset.result.value);
    assert.equal(evalReset.result.value.scaleText, "100%", "Scale should reset to 100%");

    // Capture clean evidence of reset
    const shot4 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "05d-scale-rebalanced-100.png"), Buffer.from(shot4.data, "base64"));
    console.log("Captured 05d-scale-rebalanced-100.png");

    console.log("\n=========================================");
    console.log("🎉 ALL SCALE & ZOOM TESTS PASSED!");
    console.log("=========================================\n");

    ws.close();
  } finally {
    chromeProc.kill("SIGKILL");
  }
}

testScaleFeature().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
