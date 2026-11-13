import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const rt = JSON.parse(readFileSync(path.join(demoRoot, "owner-demo-runtime.json"), "utf8"));
const supabaseUrl = rt.apiUrl || "http://127.0.0.1:54321";
const serviceKey = rt.secretKey;
const publicKey = rt.publishableKey;

const testEmail = `tester-qa-${Date.now()}@example.invalid`;
const testPassword = "Password123!@#";

async function run() {
  console.log("Creating fresh user:", testEmail);
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword, email_confirm: true, user_metadata: { nickname: "Alex" } }),
  });
  const adminData = await adminRes.json();
  const userId = adminData.id || adminData.user?.id;
  console.log("Created user id:", userId);

  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  // Insert profile
  await fetch(`${supabaseUrl}/rest/v1/healthclues_profiles`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      profile: {
        topic: "gout",
        twoWeekGoal: "Kiểm soát acid uric",
        contentPreferences: ["Thảo mộc tự nhiên"],
        safetyLevel: "none",
        adaptiveDiscovery: { schemaVersion: 1, ageConfirmed: true, focusId: "gout", focusLabel: "Gút", createdAt: new Date().toISOString() },
      },
      consent_version: "healthclues-consent-v1",
      consented_at: new Date().toISOString(),
    }),
  });

  // Create world
  await fetch("http://127.0.0.1:3000/api/healthclues/world", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      questId: "gout",
      initialGoals: [{ goalId: "gout-water", category: "hydration", targetValue: 2000, targetUnit: "ml" }],
    }),
  });

  const sessionObj = {
    userId,
    email: testEmail,
    token,
    refreshToken,
  };

  writeFileSync(path.join(demoRoot, "mobile-qa-session.json"), JSON.stringify(sessionObj, null, 2));
  console.log("Updated mobile-qa-session.json successfully!");
}

run().catch(console.error);
