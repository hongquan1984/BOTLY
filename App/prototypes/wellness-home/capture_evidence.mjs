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

async function capture() {
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

  const profileDir = path.join(root, ".tmp-chrome-profile");
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
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(targetWs, "Could not obtain Chrome target WS URL.");

    const { default: WebSocket } = await import("ws");
    const ws = new WebSocket(targetWs);
    await new Promise((resolve) => ws.once("open", resolve));

    await cdpSend(ws, "Page.enable");
    await cdpSend(ws, "Runtime.enable");
    await cdpSend(ws, "Network.enable");
    await cdpSend(ws, "Network.setCacheDisabled", { cacheDisabled: true });

    // Navigate to local server
    await cdpSend(ws, "Page.navigate", { url: "http://127.0.0.1:3450" });
    await new Promise((r) => setTimeout(r, 1000));
    await cdpSend(ws, "Runtime.evaluate", { expression: "localStorage.clear();" });
    await cdpSend(ws, "Page.reload");
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Capture Garden Scene with slots and initial active item
    const shot1 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "01-v1-garden-slots-active.png"), Buffer.from(shot1.data, "base64"));
    console.log("✓ Saved 01-v1-garden-slots-active.png");

    // 1b. Display wooden bench on garden, capture fully decorated garden view
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `displayItem('wooden_bench_01');`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot1b = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "01b-v1-garden-both-items.png"), Buffer.from(shot1b.data, "base64"));
    console.log("✓ Saved 01b-v1-garden-both-items.png");

    // 1c. Toggle off guides: 100% clean pristine Swiss landscape with items
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `toggleSlotGuides();`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot1c = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "01c-v1-garden-clean-no-guides.png"), Buffer.from(shot1c.data, "base64"));
    console.log("✓ Saved 01c-v1-garden-clean-no-guides.png");

    // Toggle guides back on for testing
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `toggleSlotGuides();`
    });

    // 2. Open Item Detail Modal for wooden_bench_01 (with 6 criteria)
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `openItemModal('wooden_bench_01');`
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot2 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "02-v1-item-detail-modal-with-vision-score.png"), Buffer.from(shot2.data, "base64"));
    console.log("✓ Saved 02-v1-item-detail-modal-with-vision-score.png");

    // Close modal, display bench, and switch to Interior
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        closeItemModal();
        displayItem('wooden_bench_01');
        displayItem('flower_pot_02');
        switchScene('scene_interior');
      `
    });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Capture Interior Scene with slots
    const shot3 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "03-v1-interior-slots.png"), Buffer.from(shot3.data, "base64"));
    console.log("✓ Saved 03-v1-interior-slots.png");

    // 3b. Test Drag & Rearrange: drag the coffee table smoothly across the room
    try {
      const tablePos = await cdpSend(ws, "Runtime.evaluate", {
        expression: `
          (() => {
            const node = document.getElementById('node-slot_interior_03');
            if (!node) return null;
            const rect = node.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          })()
        `,
        returnByValue: true
      });

      if (tablePos?.result?.value) {
        const startX = Math.round(tablePos.result.value.x);
        const startY = Math.round(tablePos.result.value.y);
        const destX = startX + 60;
        const destY = startY + 15;

        await cdpSend(ws, "Input.dispatchMouseEvent", { type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
        await new Promise((r) => setTimeout(r, 120));
        for (let i = 1; i <= 6; i++) {
          const curX = Math.round(startX + (destX - startX) * (i / 6));
          const curY = Math.round(startY + (destY - startY) * (i / 6));
          await cdpSend(ws, "Input.dispatchMouseEvent", { type: "mouseMoved", x: curX, y: curY });
          await new Promise((r) => setTimeout(r, 50));
        }
        await cdpSend(ws, "Input.dispatchMouseEvent", { type: "mouseReleased", x: destX, y: destY, button: "left" });
        await new Promise((r) => setTimeout(r, 600));

        const shot3b = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
        writeFileSync(path.join(outputDir, "03b-v1-interior-drag-rearranged.png"), Buffer.from(shot3b.data, "base64"));
        console.log("✓ Saved 03b-v1-interior-drag-rearranged.png");
      }
    } catch (err) {
      console.warn("Drag test warning:", err.message);
    }

    // 4. Open Before/After Split Comparison Slider on Garden
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        switchScene('scene_garden');
        if (!isCompareMode) toggleCompareMode();
      `
    });
    await new Promise((r) => setTimeout(r, 800));
    const shot4 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "04-v1-before-after-split-compare.png"), Buffer.from(shot4.data, "base64"));
    console.log("✓ Saved 04-v1-before-after-split-compare.png");

    // 5. Open AI Pipeline Report Modal
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `
        if (isCompareMode) toggleCompareMode();
        openPipelineModal();
      `
    });
    await new Promise((r) => setTimeout(r, 800));
    const shot5 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "05-v1-pipeline-report-modal.png"), Buffer.from(shot5.data, "base64"));
    console.log("✓ Saved 05-v1-pipeline-report-modal.png");

    // 6. Mobile Portrait Viewport test
    await cdpSend(ws, "Runtime.evaluate", {
      expression: `closePipelineModal();`
    });
    await cdpSend(ws, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 600));
    const shot6 = await cdpSend(ws, "Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join(outputDir, "06-v1-mobile-view.png"), Buffer.from(shot6.data, "base64"));
    console.log("✓ Saved 06-v1-mobile-view.png");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
