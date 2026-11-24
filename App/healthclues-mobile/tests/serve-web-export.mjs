import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(process.argv[2] ?? "dist-mobile-web-island3d-fix");
const port = Number(process.argv[3] ?? 8100);
const publicRoot = path.resolve(root, "..", "..", "..", "public");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".wav": "audio/wav", ".mp3": "audio/mpeg" };

const server = http.createServer((req, res) => {
  if ((req.url ?? "").startsWith("/api/healthclues/mobile-detective/")) {
    const upstream = `http://127.0.0.1:3339${req.url}`;
    fetch(upstream, { method: req.method, headers: { "content-type": req.headers["content-type"] ?? "" }, body: req.method === "GET" || req.method === "HEAD" ? undefined : req, duplex: "half" }).then(async (response) => {
      res.writeHead(response.status, { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" });
      res.end(Buffer.from(await response.arrayBuffer()));
    }).catch(() => { res.writeHead(502); res.end(JSON.stringify({ error: "Detective API unavailable" })); });
    return;
  }
  const requested = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const sourceRoot = requested.startsWith("/gametrinhtham/") ? publicRoot : root;
  const candidate = path.resolve(sourceRoot, `.${requested}`);
  const safe = candidate.startsWith(sourceRoot) ? candidate : path.join(root, "index.html");
  const file = fs.existsSync(safe) && fs.statSync(safe).isFile() ? safe : path.join(root, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, "127.0.0.1", () => console.log(`Serving ${root} with SPA fallback at http://127.0.0.1:${port}`));
