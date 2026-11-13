import { readFileSync } from "node:fs";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { deflateRawSync } from "node:zlib";

function seal(payload) {
  const secret = "test-secret-that-is-at-least-32-characters-long-12345";
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const compressed = deflateRawSync(Buffer.from(JSON.stringify(payload)));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return `z1.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url")}`;
}

const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));

async function test() {
  const profRes = await fetch(runtime.apiUrl + "/rest/v1/healthclues_profiles?limit=1", {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const profRows = await profRes.json();
  const profData = profRows[0].profile;

  const reqId = crypto.randomUUID();
  const advRes = await fetch("http://127.0.0.1:3329/api/healthclues/wellness-advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-Id": reqId },
    body: JSON.stringify({
      requestId: reqId,
      questId: "health-concern",
      profile: profData,
      locale: "vi",
      forceRefresh: false,
    }),
  });
  const advData = await advRes.json();
  const { toAiPlanGoal } = await import("file:///d:/botly/src/features/healthclues/personalized-wellness-plan.ts");
  const goals = advData.goals.slice(0, 2).map(g => ({
    ...toAiPlanGoal(g, "A", "vi"),
    choice: "active",
  }));

  const payload = {
    version: 1,
    email: "hongquan0508@gmail.com",
    questId: "health-concern",
    profile: profData,
    wellnessPlan: goals,
    wellnessPlanRequestKey: crypto.randomUUID(),
    consentedAt: new Date().toISOString(),
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  const rawJson = JSON.stringify(payload);
  console.log("Raw JSON length:", rawJson.length);
  const sealed = seal(payload);
  console.log("Sealed length:", sealed.length);
}

test().catch(console.error);
