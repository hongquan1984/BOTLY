import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const base = "http://127.0.0.1:3329";
const root = "d:\\botly";
const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const buildPublic = path.join(demoRoot, "app-build-rpg-ui", "public");

async function setupOwnerDemo() {
  console.log("Setting up fresh owner session...");
  const email = `owner-demo-${Date.now()}@example.invalid`;
  const password = `HcOwner_${randomUUID()}_Aa9!`;

  const adminRes = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "owner", suite: "owner-demo" },
    }),
  });
  assert.ok(adminRes.ok, `Failed creating user: ${adminRes.status}`);
  const adminData = await adminRes.json();
  const userId = adminData.id || adminData.user?.id;

  const tokenRes = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: runtime.publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(tokenRes.ok, `Failed login: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const profilePayload = {
    topic: "Giấc ngủ ngon",
    twoWeekGoal: "Thiết lập nhịp sinh học và ngủ sâu hơn",
    contentPreferences: ["Đọc sách", "Thiên nhiên"],
    presentation: "Kết hợp",
    comfortableActivityTime: "15 phút",
    refreshFrequency: "Hằng tuần",
    safetyLevel: "none",
    specificInterests: ["Dễ vào giấc", "Thư giãn sâu"],
    safetyContext: {},
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId: "sleep",
      focusLabel: "Giấc ngủ ngon",
      answers: [],
    },
  };

  await fetch(`${runtime.apiUrl}/rest/v1/healthclues_profiles`, {
    method: "POST",
    headers: {
      apikey: runtime.secretKey,
      Authorization: `Bearer ${runtime.secretKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      profile: profilePayload,
      consent_version: "healthclues-consent-v1",
      consented_at: new Date().toISOString(),
    }),
  });

  const worldRes = await fetch(`${base}/api/healthclues/world`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      requestKey: randomUUID(),
      topicKey: "sleep-better",
      title: "Thung lũng Giấc ngủ",
      timezone: "Asia/Bangkok",
      startedOn: "2026-11-01",
      selections: [],
    }),
  });
  assert.ok(worldRes.ok, `Failed creating World: ${worldRes.status}`);
  const worldData = await worldRes.json();
  const worldId = worldData.world_id || worldData.world?.id || worldData.id;

  const sampleGoals = [
    {
      goalId: "goal-sleep-reading",
      templateId: null,
      title: "Thói quen đọc sách trước khi ngủ",
      category: "sleep",
      iconKey: "sleep.reading",
      goalType: "maintain",
      choice: "active",
      frequency: "Daily",
      trackingUnit: "phút",
      trackingDefinition: "Đọc sách 10 phút trước khi ngủ",
      targetValue: 10,
      targetUnit: "phút",
      durationDays: 30,
      durationMinutes: 10,
      safetyStatus: "user_created_unreviewed",
      provenance: "user_created",
      sourceVersion: null,
      evidenceStatus: "USER-CREATED · NOT REVIEWED",
      explanation: "Bạn yêu thích việc đọc sách và mong muốn dễ đi vào giấc ngủ hơn.",
      safetyNote: null,
      userSafetyConfirmation: true,
      sources: [],
    },
    {
      goalId: "goal-sleep-screens",
      templateId: null,
      title: "Tạm dừng thiết bị điện tử trước khi ngủ",
      category: "sleep",
      iconKey: "sleep.screen_free",
      goalType: "avoid",
      choice: "active",
      frequency: "Daily",
      trackingUnit: "phút",
      trackingDefinition: "Đặt điện thoại và màn hình sang một bên trước giờ ngủ 15 phút",
      targetValue: 15,
      targetUnit: "phút",
      durationDays: 30,
      durationMinutes: 15,
      safetyStatus: "user_created_unreviewed",
      provenance: "user_created",
      sourceVersion: null,
      evidenceStatus: "USER-CREATED · NOT REVIEWED",
      explanation: "Giảm bớt ánh sáng màn hình trước giờ ngủ giúp tâm trí lắng dịu và dễ vào giấc hơn.",
      safetyNote: null,
      userSafetyConfirmation: true,
      sources: [],
    },
  ];

  await fetch(`${base}/api/healthclues/plan`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      requestKey: randomUUID(),
      confirmed: true,
      goals: sampleGoals,
    }),
  });

  await fetch(`${base}/api/healthclues/guide`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      worldId,
      stage: "completed",
    }),
  });

  const sessionData = {
    access_token: token,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    user: {
      id: userId,
      email: email,
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    },
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HealthClues · Đang tải Hành trình của tôi...</title>
  <style>
    body {
      background: radial-gradient(circle at 50% 40%, #16382b 0%, #0d231a 100%);
      color: #ffd868;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: grid;
      place-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: rgba(18, 44, 32, 0.85);
      border: 2px solid #dfc982;
      border-radius: 1.5rem;
      padding: 2rem 2.5rem;
      text-align: center;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      max-width: 440px;
    }
    h2 { margin: 0 0 0.5rem; font-size: 1.35rem; color: #fff8db; }
    p { margin: 0; color: #d4e8da; font-size: 0.9rem; line-height: 1.5; }
    .spinner {
      width: 40px;
      height: 40px;
      margin: 1.25rem auto;
      border: 3.5px solid rgba(223, 201, 130, 0.25);
      border-top-color: #f5c84c;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>🌿 Đang vào Thung lũng Giấc ngủ</h2>
    <p>Đang chuẩn bị Bản đồ Hành trình 30 ngày &amp; Mục tiêu sức khỏe của bạn...</p>
  </div>
  <script>
    try {
      const session = ${JSON.stringify(sessionData)};
      localStorage.setItem('botly-cloud-session', JSON.stringify(session));
      localStorage.setItem('healthclues-player-locale-v1', 'vi');
      localStorage.setItem('healthclues-player-locale-owner-v1', '${userId}');
      localStorage.setItem('healthclues-player-locale-v1:${userId}', 'vi');
      document.cookie = 'hc_locale=vi; Path=/; Max-Age=2592000';
    } catch(e) {
      console.error(e);
    }
    setTimeout(function() {
      window.location.replace('/vi/wellness/healthclues/world?quest=sleep-better');
    }, 400);
  </script>
</body>
</html>`;

  writeFileSync(path.join(root, "public", "play-demo.html"), htmlContent, "utf8");
  if (existsSync(buildPublic)) {
    writeFileSync(path.join(buildPublic, "play-demo.html"), htmlContent, "utf8");
  }
  const proofPublic = path.join(demoRoot, "proof-title-20261105", "public");
  if (existsSync(proofPublic)) {
    writeFileSync(path.join(proofPublic, "play-demo.html"), htmlContent, "utf8");
  }

  console.log("Fresh play-demo.html successfully created!");
}

setupOwnerDemo().catch(console.error);
