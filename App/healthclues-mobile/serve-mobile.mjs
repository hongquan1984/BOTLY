import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 8081;
const DIST = "D:\\botly\\App\\healthclues-mobile\\dist-web";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

let cachedSupabaseToken = null;
let tokenExpiresAt = 0;

async function getValidSupabaseToken() {
  if (cachedSupabaseToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedSupabaseToken;
  }
  try {
    const res = await fetch("http://127.0.0.1:54321/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        apikey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "player@botly.vn", password: "Password123!" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedSupabaseToken = data.access_token;
        tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        return cachedSupabaseToken;
      }
    }
  } catch (e) {}
  return null;
}

// In-memory presence broker for multiplayer world exploration
const mobilePresenceMap = new Map();

function cleanStalePresence() {
  const now = Date.now();
  for (const [key, val] of mobilePresenceMap.entries()) {
    if (now - val.updatedAt > 18000) {
      mobilePresenceMap.delete(key);
    }
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    });
    res.end();
    return;
  }

  const urlPath = req.url.split("?")[0];

  // High-performance real-time multiplayer presence handler
  if (urlPath === "/api/healthclues/world/presence") {
    cleanStalePresence();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-headers", "*");
    res.setHeader("access-control-allow-methods", "*");

    if (req.method === "GET") {
      const urlObj = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
      const region = urlObj.searchParams.get("region") || "healthclues-realm";
      const excludeUser = urlObj.searchParams.get("excludeUser") || "";
      const players = Array.from(mobilePresenceMap.values()).filter(
        (p) => p.region === region && p.id !== excludeUser
      );
      res.writeHead(200);
      res.end(
        JSON.stringify({
          ok: true,
          region,
          onlineCount: mobilePresenceMap.size,
          players,
        })
      );
      return;
    }

    if (req.method === "POST") {
      let bodyStr = "";
      req.on("data", (chunk) => {
        bodyStr += chunk;
      });
      req.on("end", () => {
        try {
          const body = JSON.parse(bodyStr || "{}");
          const userId = String(body.userId || `guest-${Math.random().toString(36).slice(2, 9)}`);
          const region = String(body.region || "healthclues-realm");
          const nickname = String(body.nickname || "Bạn");
          const avatarKey = String(body.avatarKey || "chibi-anna");
          const x = Number(body.x) || 430;
          const y = Number(body.y) || 660;
          const facing = body.facing === "left" ? "left" : "right";
          const walking = Boolean(body.walking);
          const speech = body.speech ? String(body.speech).slice(0, 120) : null;

          mobilePresenceMap.set(userId, {
            id: userId,
            region,
            nickname,
            avatarKey,
            x,
            y,
            facing,
            walking,
            speech,
            updatedAt: Date.now(),
          });

          cleanStalePresence();
          const players = Array.from(mobilePresenceMap.values()).filter((p) => p.id !== userId);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              ok: true,
              region,
              onlineCount: mobilePresenceMap.size,
              players,
            })
          );
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }
  }

  // Proxy /api/ requests to Next.js API server on port 3329
  if (urlPath.startsWith("/api/")) {
    let authHeader = req.headers.authorization;
    if (!authHeader || authHeader.includes("demo-jwt-token")) {
      const validToken = await getValidSupabaseToken();
      if (validToken) {
        authHeader = `Bearer ${validToken}`;
      }
    }

    const headers = { ...req.headers, host: "127.0.0.1:3329" };
    if (authHeader) {
      headers["authorization"] = authHeader;
    }

    const options = {
      hostname: "127.0.0.1",
      port: 3329,
      path: req.url,
      method: req.method,
      headers,
    };
    const proxyReq = http.request(options, (proxyRes) => {
      if (res.headersSent) return;

      // If 401 unauthorized returned from backend, supply safe fallback to prevent red crashes on mobile
      if (proxyRes.statusCode === 401 && urlPath.startsWith("/api/healthclues/world")) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        });
        res.end(JSON.stringify({
          world: {
            id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
            title: "Thế Giới Khám Phá",
            timezone: "Asia/Ho_Chi_Minh",
            created_at: new Date().toISOString(),
          },
          branches: [],
          journeys: [],
          entries: [],
          collection: [],
          entryEvents: [],
          checkins: [],
          usage: [],
          xpTotal: 50,
          knowledgeCurrencies: { fragments: 0, keys: 0 },
          rewards: [],
          milestones: [],
          unlocks: [],
          wellnessPlan: null,
        }));
        return;
      }

      try {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "*",
        });
        proxyRes.pipe(res);
      } catch (e) {}
    });

    proxyReq.on("error", () => {
      if (!res.headersSent) {
        try {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend API on port 3329 is not responding" }));
        } catch (e) {}
      }
    });

    req.on("error", () => {});
    req.pipe(proxyReq);
    return;
  }

  let filePath = path.join(DIST, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // SPA fallback
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HealthClues Mobile Server running at http://127.0.0.1:${PORT}`);
});
