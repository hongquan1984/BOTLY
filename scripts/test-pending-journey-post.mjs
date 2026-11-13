import fetch from "node:fs";

async function testPost() {
  const profile = {
    topic: "Gút / axit uric cao · HealthClues Realm",
    contentPreferences: [],
    presentation: "Choice-based discovery",
    comfortableActivityTime: "Not provided",
    refreshFrequency: "Not provided",
    twoWeekGoal: "Explore personal wellness goals",
    createdAt: new Date().toISOString(),
    safetyLevel: "caution",
    specificInterests: [],
    adaptiveDiscovery: {
      schemaVersion: 1,
      ageConfirmed: true,
      focusId: "health-concern",
      focusLabel: "Gút / axit uric cao",
      answers: [
        {
          questionId: "q-gout-factors",
          answerIds: ["a-schedule"],
          answerLabels: ["Nếp sinh hoạt hoặc lịch trình ảnh hưởng đến điều này"],
        },
      ],
    },
  };

  const plan = [
    {
      goalId: "gout-hydration",
      title: "Uống một cốc nước lọc ấm ngay sau khi thức dậy",
      category: "hydration",
      goalType: "maintain",
      choice: "active",
      frequency: "Daily",
      durationMinutes: null,
      trackingUnit: "self-reported completion",
      trackingDefinition: "Uống một cốc nước lọc ấm",
      safetyStatus: "eligible_for_personal_choice",
      provenance: "ai_generated",
      sourceVersion: 1,
      evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
      explanation: "Hỗ trợ đào thải axit uric tự nhiên",
      safetyNote: null,
      sources: [],
    },
  ];

  const res = await globalThis.fetch("http://127.0.0.1:3329/api/healthclues/pending-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "hongquan0508@gmail.com",
      questId: "health-concern",
      profile,
      wellnessPlan: plan,
      wellnessPlanRequestKey: crypto.randomUUID(),
      consentedAt: new Date().toISOString(),
      consent: true,
    }),
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
}

testPost().catch(console.error);
