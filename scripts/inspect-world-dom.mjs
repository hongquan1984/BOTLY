import { spawn } from "node:child_process";
import net from "node:net";

const probe = net.createServer();
const port = await new Promise(r => { probe.listen(0, "127.0.0.1", () => { const p = probe.address().port; probe.close(() => r(p)); }); });
const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", ["--remote-debugging-port=" + port, "--headless=new", "about:blank"]);

await new Promise(r => setTimeout(r, 1500));
const list = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise((resolve) => {
  const cur = id++;
  const h = (e) => {
    const d = JSON.parse(e.data);
    if (d.id === cur) { ws.removeEventListener("message", h); resolve(d.result); }
  };
  ws.addEventListener("message", h);
  ws.send(JSON.stringify({ id, method, params }));
});

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: "http://127.0.0.1:3329/play-demo.html" });
await new Promise(r => setTimeout(r, 4500));

const res = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    url: window.location.href,
    title: document.title,
    text: document.body.innerText.slice(0, 500),
    hasDock: Boolean(document.querySelector(".hc-rpg-bottom-dock")),
    allClasses: Array.from(document.querySelectorAll("[class]")).map(el => el.className).slice(0, 20),
    htmlPreview: document.body.innerHTML.slice(0, 500)
  })`,
  returnByValue: true
});
console.log("Inspection Result:", JSON.parse(res.result.value));
chrome.kill();
