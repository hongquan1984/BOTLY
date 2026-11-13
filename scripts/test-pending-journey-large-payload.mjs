import assert from "node:assert/strict";

async function testLargePayload() {
  console.log("=== TESTING LARGE JOURNEY PAYLOAD (HTTP 413 PREVENTION) ===");

  const goals = Array.from({ length: 6 }, (_, i) => ({
    goalId: `gout-goal-${i}`,
    templateId: `habit:gout-${i}:1`,
    title: `Uống một cốc nước lọc ấm ngay sau khi thức dậy vào mỗi buổi sáng sớm số ${i}`,
    category: "hydration",
    goalType: "maintain",
    choice: i < 3 ? "active" : "saved",
    frequency: "Daily",
    durationMinutes: 10,
    trackingUnit: "self-reported completion",
    trackingDefinition: "Uống một cốc nước lọc ấm ngay sau khi thức dậy",
    targetValue: 1,
    targetUnit: "cốc",
    durationDays: 30,
    safetyStatus: "eligible_for_personal_choice",
    provenance: "ai_generated",
    sourceVersion: 1,
    evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
    explanation: "Hỗ trợ đào thải axit uric tự nhiên bằng cách duy trì lượng nước đều đặn trong ngày. Đây là mục tiêu quan trọng giúp bảo vệ sức khỏe thận và giảm thiểu nguy cơ bùng phát cơn đau khớp cấp tính.".repeat(2),
    safetyNote: "Uống từng ngụm nhỏ, không uống quá nhiều nước một lúc.".repeat(2),
    sources: [{ title: "Hướng dẫn chăm sóc sức khỏe Gout quốc gia", url: "https://example.com/guidelines" }],
    originalNote: "Ghi chú cá nhân của tôi về thói quen này",
    advisorProof: "eyJhbGciOiJIUzI1NiJ9." + Buffer.from("dummy-signature-payload-token-data-1234567890".repeat(5)).toString("base64url"),
  }));

  const profile = {
    topic: "Gút / axit uric cao · HealthClues Realm",
    contentPreferences: ["articles", "checkins"],
    presentation: "Choice-based discovery",
    comfortableActivityTime: "Morning",
    refreshFrequency: "Daily",
    twoWeekGoal: "Uống đủ nước và giảm thịt đỏ",
    createdAt: new Date().toISOString(),
    safetyLevel: "caution",
    specificInterests: ["hydration", "nutrition"],
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId: "health-concern",
      focusLabel: "Gút / axit uric cao",
      answers: [
        {
          questionId: "q-gout-factors",
          answerIds: ["a-schedule", "a-hydration"],
          answerLabels: ["Lịch trình bận rộn", "Thói quen uống nước"],
          optionalText: "Tôi hay quên uống nước khi làm việc căng thẳng cả ngày",
        },
      ],
    },
  };

  const body = {
    email: "hongquan0508@gmail.com",
    questId: "health-concern",
    profile,
    wellnessPlan: goals,
    wellnessPlanRequestKey: crypto.randomUUID(),
    consentedAt: new Date().toISOString(),
    consent: true,
  };

  console.log("Payload raw JSON size:", JSON.stringify(body).length, "bytes");

  const res = await fetch("http://127.0.0.1:3329/api/healthclues/pending-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("POST Response status:", res.status);
  const data = await res.json();
  console.log("POST Response body:", data);

  assert.equal(res.status, 200, "Must return HTTP 200 OK (NOT 413 or 400)");
  assert.equal(data.ok, true, "Response must be ok: true");

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
  console.log("Set-Cookie headers count:", setCookies.length);
  for (const cookie of setCookies) {
    console.log("  Cookie header preview:", cookie.slice(0, 60) + "...");
  }

  console.log("✓ LARGE PAYLOAD TEST PASSED (100%): 413 PAYLOAD TOO LARGE ELIMINATED!");
}

testLargePayload().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
