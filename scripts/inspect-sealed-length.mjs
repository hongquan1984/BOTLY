import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";

function seal(payload) {
  const secret = "test-secret-that-is-at-least-32-characters-long-12345";
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const compressed = deflateRawSync(Buffer.from(JSON.stringify(payload)));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return `z1.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url")}`;
}

const mockGoal = {
  goalId: "ai:7922d4f8-118f-4310-85f2-959ec2172772",
  templateId: null,
  title: "Đi dạo nhẹ nhàng 5 phút quanh nhà hoặc văn phòng sau một bữa ăn hôm nay",
  category: "movement",
  goalType: "maintain",
  choice: "active",
  frequency: "Daily",
  durationMinutes: null,
  trackingUnit: "self-reported completion",
  trackingDefinition: "Đi dạo nhẹ nhàng 5 phút quanh nhà hoặc văn phòng sau một bữa ăn hôm nay",
  targetValue: null,
  targetUnit: null,
  durationDays: null,
  safetyStatus: "eligible_for_personal_choice",
  provenance: "ai_generated",
  sourceVersion: 1,
  evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
  explanation: "Vận động nhẹ nhàng giúp cải thiện độ nhạy insulin và kiểm soát cân nặng tốt hơn.",
  safetyNote: null,
  sources: [],
  generatedOption: { locale: "vi", option: "A", title: "Đi bộ nhẹ sau bữa ăn" },
  advisorProof: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-z8...long-proof-string-here-approximately-120-characters-signature",
  iconKey: "shoe-prints"
};

const payload = {
  version: 1,
  email: "hongquan0508@gmail.com",
  questId: "health-concern",
  profile: {
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
  },
  wellnessPlan: [mockGoal, { ...mockGoal, goalId: "ai:2" }, { ...mockGoal, goalId: "ai:3" }],
  wellnessPlanRequestKey: "12345678-1234-1234-1234-123456789abc",
  consentedAt: new Date().toISOString(),
  expiresAt: Date.now() + 20 * 60 * 1000,
};

const sealed = seal(payload);
console.log("Sealed length with 3 goals:", sealed.length);
