import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const debugPort = 9488;
const proc = spawn(chromePath, ["--headless=new", "--remote-debugging-port=" + debugPort, "--disable-gpu", "--no-sandbox", "about:blank"]);

setTimeout(async () => {
  try {
    const json = await (await fetch("http://127.0.0.1:" + debugPort + "/json")).json();
    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(json[0].webSocketDebuggerUrl);
    await new Promise((r) => ws.once("open", r));

    const send = (method, params = {}) =>
      new Promise((res) => {
        const id = Math.random();
        ws.on("message", function h(d) {
          const m = JSON.parse(d);
          if (m.id === id) {
            ws.off("message", h);
            res(m.result);
          }
        });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });

    const session = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/mobile-qa-session.json", "utf8"));
    const sessionObj = {
      access_token: session.token,
      refresh_token: session.refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
      user: { id: session.userId, email: session.email, user_metadata: { nickname: "Alex" } },
    };

    await send("Page.navigate", { url: "http://localhost:3000/play" });
    await new Promise((r) => setTimeout(r, 1200));

    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('botly-cloud-session', JSON.stringify(${JSON.stringify(sessionObj)}));
        localStorage.setItem('healthclues-player-locale-v1', 'vi');
      `
    });

    await send("Page.navigate", { url: "http://localhost:3000/en/wellness/healthclues/world" });
    await new Promise((r) => setTimeout(r, 4000));

    const r = await send("Runtime.evaluate", {
      expression: `
        ({
          url: window.location.href,
          dockFound: Boolean(document.querySelector('.hc-rpg-bottom-dock')),
          dockDisplay: document.querySelector('.hc-rpg-bottom-dock') ? getComputedStyle(document.querySelector('.hc-rpg-bottom-dock')).display : null,
          dockRect: document.querySelector('.hc-rpg-bottom-dock') ? document.querySelector('.hc-rpg-bottom-dock').getBoundingClientRect() : null,
          buttons: Array.from(document.querySelectorAll('.hc-rpg-dock-btn')).map(b => b.textContent.trim()),
          title: document.title,
          bodyText: document.body.innerText.substring(0, 300)
        })
      `,
      returnByValue: true,
    });

    console.log("DOM INSPECT RESULT:\n", JSON.stringify(r.value, null, 2));
    ws.close();
  } catch (err) {
    console.error("Inspect error:", err);
  } finally {
    proc.kill("SIGKILL");
    process.exit(0);
  }
}, 1500);
