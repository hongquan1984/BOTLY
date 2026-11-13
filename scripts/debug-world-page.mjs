import { spawn } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";

const base = "http://127.0.0.1:3329";
const chromePath = [
  path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
].find(existsSync);

const profileDir = path.resolve(`d:/botly/App/.tmp/debug-browser-${process.pid}-${randomUUID()}`);
mkdirSync(profileDir, { recursive: true });

const probe = net.createServer();
const debugPort = await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const p = probe.address().port;
    probe.close(() => resolve(p));
  });
});

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true }
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ws;
let nextId = 0;
const waiting = new Map();

const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      waiting.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 20000);
    waiting.set(id, (value) => {
      clearTimeout(timer);
      value.error ? reject(new Error(value.error.message)) : resolve(value.result);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

try {
  await delay(1000);
  const version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data.toString());
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message);
      waiting.delete(message.id);
    }
  });

  await cdp("Page.enable");
  await cdp("Runtime.enable");

  console.log("Navigating to world page...");
  await cdp("Page.navigate", { url: `${base}/en/wellness/healthclues/world?quest=sleep-better` });
  await delay(3000);

  const evalRes = await cdp("Runtime.evaluate", {
    expression: "({ title: document.title, url: window.location.href, text: document.body.innerText.slice(0, 1000), html: document.body.innerHTML.slice(0, 800) })",
    returnByValue: true,
  });
  console.log("PAGE STATE:", evalRes.result.value);

  const shot = await cdp("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bf806726-5fdf-45f1-b574-a2b65a5fbf0f\\debug-world-page.png", Buffer.from(shot.data, "base64"));
  console.log("Saved debug-world-page.png");
} finally {
  if (ws) ws.close();
  chrome.kill("SIGKILL");
}
