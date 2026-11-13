import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { computeHomography } from "./verify_perspective_math.mjs";

async function testWarpRender() {
  const chromePath = [
    path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
  ].find(existsSync);

  const probe = net.createServer();
  const debugPort = await new Promise((resolve) => {
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });

  const chromeProc = spawn(chromePath, [
    "--remote-debugging-port=" + debugPort,
    "--user-data-dir=D:/botly/App/prototypes/wellness-home/.tmp-test-profile-warp",
    "--headless=new",
    "--disable-gpu",
    "--window-size=1000,700",
    "about:blank",
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch("http://127.0.0.1:" + debugPort + "/json/list");
        const list = await res.json();
        const page = list.find((it) => it.type === "page");
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 100));
    }

    const { default: WebSocket } = await import("ws");
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.once("open", r));

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1e6);
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off("message", handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.on("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    // Navigate to local server to test in actual page origin
    await send("Page.navigate", { url: "http://localhost:3450" });
    await new Promise((r) => setTimeout(r, 1500));

    // Evaluate applying matrix3d directly to an image element inside scene-stage
    const testResult = await send("Runtime.evaluate", {
      returnByValue: true,
      expression: `
        (() => {
          const stage = document.getElementById('scene-stage');
          const stageRect = stage.getBoundingClientRect();

          // Create test picture frame
          const img = document.createElement('img');
          img.id = 'test-warp-painting';
          img.src = 'assets/items/sofa_italian_trimmed.png';
          img.style.position = 'absolute';
          img.style.left = '0';
          img.style.top = '0';
          img.style.width = '300px';
          img.style.height = '150px';
          img.style.transformOrigin = '0 0';
          img.style.zIndex = '999';
          img.style.border = '2px solid red';
          stage.appendChild(img);

          // Homography points on wall / floor (in stage percentage or px)
          // Let's create an extreme perspective trapezoid:
          // TL = (200, 100), TR = (500, 140), BR = (550, 420), BL = (150, 360)
          const p0 = { x: 200, y: 100 };
          const p1 = { x: 500, y: 140 };
          const p2 = { x: 550, y: 420 };
          const p3 = { x: 150, y: 360 };

          const w = 300, h = 150;
          const dx1 = p1.x - p2.x;
          const dx2 = p3.x - p2.x;
          const dx3 = p0.x - p1.x + p2.x - p3.x;
          const dy1 = p1.y - p2.y;
          const dy2 = p3.y - p2.y;
          const dy3 = p0.y - p1.y + p2.y - p3.y;

          const det = dx1 * dy2 - dx2 * dy1;
          const g = (dx3 * dy2 - dx2 * dy3) / det;
          const h_val = (dx1 * dy3 - dx3 * dy1) / det;
          const a = p1.x - p0.x + g * p1.x;
          const b = p3.x - p0.x + h_val * p3.x;
          const c = p0.x;
          const d = p1.y - p0.y + g * p1.y;
          const e = p3.y - p0.y + h_val * p3.y;
          const f = p0.y;

          const m = [
            a / w, d / w, 0, g / w,
            b / h, e / h, 0, h_val / h,
            0, 0, 1, 0,
            c, f, 0, 1
          ];

          img.style.transform = 'matrix3d(' + m.join(',') + ')';
          return { applied: true, matrix: m };
        })()
      `,
    });

    console.log("Render test result:", testResult.result.value);

    await new Promise((r) => setTimeout(r, 600));
    const shot = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(
      "D:/botly/App/prototypes/wellness-home/evidence/test_warp_rendered.png",
      Buffer.from(shot.data, "base64")
    );
    console.log("Saved test_warp_rendered.png!");
  } finally {
    chromeProc.kill();
  }
}

testWarpRender().catch((err) => console.error("Error:", err));
