import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3450;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Handle File Upload API (POST /api/upload)
  if (req.method === 'POST' && reqUrl.pathname === '/api/upload') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { filename, dataUrl, folder = 'furniture' } = payload;
        if (!dataUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing dataUrl' }));
          return;
        }

        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid dataUrl format' }));
          return;
        }

        const ext = filename ? path.extname(filename).toLowerCase() || '.png' : '.png';
        const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const targetDir = path.join(__dirname, 'assets', 'uploads', folder);
        fs.mkdirSync(targetDir, { recursive: true });

        const destPath = path.join(targetDir, cleanName);
        let buffer = Buffer.from(match[2], 'base64');
        let initialWidth = 280;

        if (folder === 'furniture' && ext === '.png') {
          try {
            const { default: sharp } = await import('sharp');
            const trimmed = await sharp(buffer)
              .trim({ threshold: 5 })
              .toBuffer({ resolveWithObject: true });
            buffer = trimmed.data;
            initialWidth = Math.min(480, Math.max(180, trimmed.info.width));
          } catch (_) {}
        }

        fs.writeFileSync(destPath, buffer);

        const relUrl = `assets/uploads/${folder}/${cleanName}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: relUrl, filename: cleanName, width: initialWidth }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Handle Master Blueprint APIs (GET / POST /api/master-blueprint)
  if (reqUrl.pathname === '/api/master-blueprint') {
    const bpPath = path.join(__dirname, 'data', 'master-blueprint.json');
    if (req.method === 'GET') {
      if (fs.existsSync(bpPath)) {
        const content = fs.readFileSync(bpPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Master blueprint not found' }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          fs.writeFileSync(bpPath, JSON.stringify(data, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, updated_at: new Date().toISOString() }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Handle Player State API (GET / POST /api/player-state)
  if (reqUrl.pathname === '/api/player-state') {
    const playerId = reqUrl.searchParams.get('playerId') || 'player_1';
    const playerFile = path.join(__dirname, 'data', `player-${playerId}.json`);

    if (req.method === 'GET') {
      if (fs.existsSync(playerFile)) {
        const content = fs.readFileSync(playerFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
        res.end(content);
      } else {
        // Return fresh player profile with empty room
        const defaultProfile = {
          player_id: playerId,
          created_at: new Date().toISOString(),
          unlocked_items: [],
          active_scene: 'scene_interior_wide',
          day_night_override: null
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(defaultProfile));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const pId = data.player_id || playerId;
          const targetFile = path.join(__dirname, 'data', `player-${pId}.json`);
          fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, saved_at: new Date().toISOString() }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Handle Player Reset API (POST /api/player-reset)
  if (req.method === 'POST' && reqUrl.pathname === '/api/player-reset') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const playerId = data.playerId || 'player_1';
        const playerFile = path.join(__dirname, 'data', `player-${playerId}.json`);
        const freshProfile = {
          player_id: playerId,
          created_at: new Date().toISOString(),
          unlocked_items: [],
          active_scene: 'scene_interior_wide',
          day_night_override: null
        };
        fs.writeFileSync(playerFile, JSON.stringify(freshProfile, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, reset: playerId, state: freshProfile }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Handle Room State Persistence API (GET /api/state)
  if (req.method === 'GET' && reqUrl.pathname === '/api/state') {
    const saveFilePath = path.join(__dirname, 'data', 'saved-room-state.json');
    if (fs.existsSync(saveFilePath)) {
      try {
        const content = fs.readFileSync(saveFilePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
        res.end(content);
        return;
      } catch (_) {}
    }
    const defaultFilePath = path.join(__dirname, 'data', 'inventory-state.json');
    if (fs.existsSync(defaultFilePath)) {
      try {
        const content = fs.readFileSync(defaultFilePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
        res.end(content);
        return;
      } catch (_) {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    res.end(JSON.stringify({}));
    return;
  }

  // Handle Room State Persistence API (POST /api/state)
  if (req.method === 'POST' && reqUrl.pathname === '/api/state') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const dataDir = path.join(__dirname, 'data');
        fs.mkdirSync(dataDir, { recursive: true });
        const saveFilePath = path.join(dataDir, 'saved-room-state.json');
        fs.writeFileSync(saveFilePath, JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true, saved_at: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  let safePath = path.normalize(decodeURIComponent(reqUrl.pathname));
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  // Security: prevent path traversal outside __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
    });

    const readStream = fs.createReadStream(filePath);
    readStream.on('error', (err) => {
      console.warn('Stream error for:', filePath, err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('500 Internal Server Error');
      }
    });
    res.on('error', (err) => {
      console.warn('Response error:', err.message);
      readStream.destroy();
    });
    readStream.pipe(res);
  });
});

process.on('uncaughtException', (err) => {
  console.warn('Uncaught exception caught safely:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled rejection caught safely:', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏡 Wellness Home Prototype is running!`);
  console.log(`👉 Local URL: http://localhost:${PORT}`);
  console.log(`👉 Network  : http://127.0.0.1:${PORT}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Please choose another port.`);
  } else {
    console.error(`Server error:`, err);
  }
});
