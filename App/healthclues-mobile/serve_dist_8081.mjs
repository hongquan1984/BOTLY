import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.env.MOBILE_DIST_ROOT
  ? path.resolve(process.env.MOBILE_DIST_ROOT)
  : path.join(__dirname, 'dist-web');
const publicGameAssets = path.resolve(__dirname, '..', '..', 'public', 'gametrinhtham');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ttf': 'font/ttf',
};

async function proxyDetectiveApi(req, res) {
  const apiOrigin = process.env.DETECTIVE_API_ORIGIN || 'http://127.0.0.1:3329';
  const target = `${apiOrigin.replace(/\/$/, '')}${req.url}`;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const upstream = await fetch(target, {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'] || 'application/json',
      ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  });
  const responseBody = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, {
    'Content-Type': upstream.headers.get('content-type') || 'application/json',
    'Content-Length': responseBody.length,
    'Cache-Control': 'no-store',
  });
  res.end(responseBody);
}

const server = http.createServer(async (req, res) => {
  // The isolated preview has no Next.js world API. Keep the shared World shell
  // healthy while the detective API is proxied to the local contract server.
  if (req.url.startsWith('/api/healthclues/world/presence')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, region: 'healthclues-realm', onlineCount: 0, players: [] }));
    return;
  }
  if (req.url.startsWith('/api/healthclues/world')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      world: { id: 'local-preview-world', title: 'Thế Giới Khám Phá', timezone: 'Asia/Ho_Chi_Minh' },
      branches: [], journeys: [], entries: [], collection: [], entryEvents: [], checkins: [], usage: [],
      xpTotal: 50, knowledgeCurrencies: { fragments: 0, keys: 0 }, rewards: [], milestones: [], unlocks: [], wellnessPlan: null,
    }));
    return;
  }
  if (req.url.startsWith('/api/healthclues/')) {
    try {
      await proxyDetectiveApi(req, res);
    } catch (error) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Detective API unavailable', detail: String(error?.message || error) }));
    }
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  let filePath = reqPath.startsWith('/gametrinhtham/')
    ? path.join(publicGameAssets, reqPath.slice('/gametrinhtham/'.length))
    : path.join(root, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range && ext === '.mp4') {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
});

const PORT = Number(process.env.MOBILE_PORT || 8081);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile web server listening on http://0.0.0.0:${PORT}`);
});
