import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3355;
const DAO_DIR = __dirname;
const WORD3D_DIR = path.resolve(__dirname, '../word3d');
const WORD3D_PUBLIC = path.join(WORD3D_DIR, 'public');
const HOME3D_DIR = path.resolve(__dirname, '../3DHOME');
const HOME3D_GLB = path.join(HOME3D_DIR, 'glb_public');
const HOME3D_STATIC = path.join(HOME3D_DIR, 'static_assets');
const HEALTHCLUES_MOBILE = path.resolve(__dirname, '../healthclues-mobile');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
};

// FAST FILE INDEX FOR ALL WORD3D, 3DHOME & DAO3D ASSETS
const fileIndex = new Map();

function indexDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name !== 'node_modules' && ent.name !== '.git') {
          indexDirectory(full);
        }
      } else {
        fileIndex.set(ent.name.toLowerCase(), full);
      }
    }
  } catch (err) {
    console.warn('Index error:', err.message);
  }
}

console.log('Building asset index...');
indexDirectory(WORD3D_PUBLIC);
indexDirectory(HOME3D_GLB);
indexDirectory(HOME3D_STATIC);
indexDirectory(path.join(HOME3D_DIR, 'public'));
indexDirectory(DAO_DIR);
console.log(`Indexed ${fileIndex.size} files ready for instant streaming.`);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = urlObj.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/preview.html';
  }

  // Helper to parse JSON body
  function parseBody(callback) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = body ? JSON.parse(body) : {};
        callback(null, json);
      } catch (e) {
        callback(e, null);
      }
    });
  }

  // API 1: GET /api/template/default
  if (reqPath === '/api/template/default' && req.method === 'GET') {
    const tplPath = path.join(DAO_DIR, 'data/default_island_template.json');
    if (fs.existsSync(tplPath)) {
      const data = fs.readFileSync(tplPath, 'utf8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
      return;
    }
  }

  // API 2: POST /api/template/default
  if (reqPath === '/api/template/default' && req.method === 'POST') {
    parseBody((err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const tplPath = path.join(DAO_DIR, 'data/default_island_template.json');
      data.updatedAt = new Date().toISOString();
      fs.writeFileSync(tplPath, JSON.stringify(data, null, 2), 'utf8');

      // Admin template is saved independently! We DO NOT wipe out player custom placed items in current_player.json
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: data.placedItems?.length || 0, updatedAt: data.updatedAt }));
    });
    return;
  }

  // API 3: GET /api/players
  if (reqPath === '/api/players' && req.method === 'GET') {
    const playersDir = path.join(DAO_DIR, 'data/players');
    if (!fs.existsSync(playersDir)) fs.mkdirSync(playersDir, { recursive: true });
    const files = fs.readdirSync(playersDir).filter(f => f.endsWith('.json'));
    const list = files.map(f => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(playersDir, f), 'utf8'));
        return {
          id: content.userId || path.basename(f, '.json'),
          name: content.playerName || content.userId,
          title: content.islandTitle || 'Hòn Đảo Dưỡng Sinh',
          itemCount: content.placedItems?.length || 0,
          updatedAt: content.updatedAt
        };
      } catch (e) {
        return { id: path.basename(f, '.json'), name: f, itemCount: 0 };
      }
    });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(list));
    return;
  }

  // API 4: GET /api/player/:id
  if (reqPath.startsWith('/api/player/') && req.method === 'GET') {
    const pId = reqPath.replace('/api/player/', '').trim();
    const pPath = path.join(DAO_DIR, `data/players/${pId}.json`);
    if (fs.existsSync(pPath)) {
      const data = fs.readFileSync(pPath, 'utf8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
      return;
    } else {
      // Fallback: Player is new, return the default template
      const tplPath = path.join(DAO_DIR, 'data/default_island_template.json');
      let tpl = { placedItems: [] };
      if (fs.existsSync(tplPath)) {
        tpl = JSON.parse(fs.readFileSync(tplPath, 'utf8'));
      }
      const newPlayer = {
        userId: pId,
        playerName: `Người Chơi (${pId})`,
        islandTitle: `Đảo Của ${pId}`,
        isNewPlayer: true,
        placedItems: tpl.placedItems || [],
        updatedAt: new Date().toISOString()
      };
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(newPlayer));
      return;
    }
  }

  // API 5: POST /api/player/:id
  if (reqPath.startsWith('/api/player/') && req.method === 'POST') {
    const pId = reqPath.replace('/api/player/', '').trim();
    parseBody((err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const pPath = path.join(DAO_DIR, `data/players/${pId}.json`);
      data.userId = pId;
      data.updatedAt = new Date().toISOString();
      fs.writeFileSync(pPath, JSON.stringify(data, null, 2), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, userId: pId, count: data.placedItems?.length || 0 }));
    });
    return;
  }

  // API 6: POST /api/admin/reset-player/:id
  if (reqPath.startsWith('/api/admin/reset-player/') && req.method === 'POST') {
    const pId = reqPath.replace('/api/admin/reset-player/', '').trim();
    const tplPath = path.join(DAO_DIR, 'data/default_island_template.json');
    let tpl = { placedItems: [] };
    if (fs.existsSync(tplPath)) {
      tpl = JSON.parse(fs.readFileSync(tplPath, 'utf8'));
    }
    const pPath = path.join(DAO_DIR, `data/players/${pId}.json`);
    const resetData = {
      userId: pId,
      playerName: `Người Chơi (${pId})`,
      islandTitle: `Đảo Của ${pId}`,
      placedItems: tpl.placedItems || [],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(pPath, JSON.stringify(resetData, null, 2), 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, resetToTemplate: true, count: resetData.placedItems.length }));
    return;
  }

  let filePath = '';

  // 0. React & ReactDOM UMD libraries
  if (reqPath === '/react.production.min.js') {
    filePath = path.join(HEALTHCLUES_MOBILE, 'node_modules/react/umd/react.production.min.js');
  } else if (reqPath === '/react-dom.production.min.js') {
    filePath = path.join(HEALTHCLUES_MOBILE, 'node_modules/react-dom/umd/react-dom.production.min.js');
  }
  // 1. Direct path in Dao3D
  else if (fs.existsSync(path.join(DAO_DIR, reqPath)) && !fs.statSync(path.join(DAO_DIR, reqPath)).isDirectory()) {
    filePath = path.join(DAO_DIR, reqPath);
  }
  // 2. Direct path in word3d node_modules
  else if (reqPath.startsWith('/node_modules/three/')) {
    filePath = path.join(WORD3D_DIR, reqPath);
  }
  // 3. Direct path in word3d public
  else if (fs.existsSync(path.join(WORD3D_PUBLIC, reqPath)) && !fs.statSync(path.join(WORD3D_PUBLIC, reqPath)).isDirectory()) {
    filePath = path.join(WORD3D_PUBLIC, reqPath);
  }
  // 4. By filename from indexed files
  else {
    const filename = path.basename(reqPath).toLowerCase();
    if (fileIndex.has(filename)) {
      filePath = fileIndex.get(filename);
    }
  }

  // Fallback to preview.html if asking for page root
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DAO_DIR, 'preview.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}/`);
});
