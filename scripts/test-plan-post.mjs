import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = "d:\\botly";
const demoRoot = path.join(root, "App", ".tmp", "healthclues-owner-demo");
const runtime = JSON.parse(readFileSync(path.join(demoRoot, "owner-demo-runtime.json"), "utf8"));

async function testPlan() {
  // 1. Quick activate to get session for hongquan0508@gmail.com
  const actRes = await fetch("http://127.0.0.1:3329/api/healthclues/account/quick-activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hongquan0508@gmail.com" }),
  });
  const actData = await actRes.json();
  console.log("Quick activate ok:", actData.ok, "token:", actData.session?.access_token ? "yes" : "no");
  const token = actData.session.access_token;

  // 2. Load world
  const worldRes = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const worldData = await worldRes.json();
  console.log("World ID:", worldData.world?.id, "Current wellnessPlan goals:", worldData.wellnessPlan?.goals?.length || 0);

  // 3. Post plan
  const plan = [
    {
      goalId: "habit-walk",
      title: "Đi dạo nhẹ nhàng 5 phút quanh nhà",
      category: "movement",
      goalType: "maintain",
      choice: "active",
      frequency: "Daily",
      durationMinutes: null,
      trackingUnit: "self-reported completion",
      trackingDefinition: "Đi dạo nhẹ nhàng 5 phút quanh nhà",
      safetyStatus: "eligible_for_personal_choice",
      provenance: "ai_generated",
      sourceVersion: 1,
      evidenceStatus: "AI-GENERATED · NOT A MEDICAL ASSESSMENT",
      explanation: "Vận động nhẹ nhàng hỗ trợ chuyển hóa",
      safetyNote: null,
      sources: [],
      generatedOption: { locale: "vi", option: "A", title: "Đi dạo nhẹ nhàng" },
    },
    {
      goalId: "habit-water",
      title: "Uống một cốc nước lọc ấm sau khi thức dậy",
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
      explanation: "Hỗ trợ thanh lọc cơ thể",
      safetyNote: null,
      sources: [],
      generatedOption: { locale: "vi", option: "A", title: "Uống nước ấm" },
    },
  ];

  const planRes = await fetch("http://127.0.0.1:3329/api/healthclues/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      worldId: worldData.world.id,
      requestKey: crypto.randomUUID(),
      confirmed: true,
      goals: plan,
    }),
  });

  console.log("Plan POST status:", planRes.status);
  const planJson = await planRes.json();
  console.log("Plan POST response:", planJson);

  // 4. Reload world
  const reloaded = await fetch("http://127.0.0.1:3329/api/healthclues/world", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const reloadedData = await reloaded.json();
  console.log("Reloaded wellnessPlan goals count:", reloadedData.wellnessPlan?.goals?.length || 0);
  console.log("Reloaded goals sample:", reloadedData.wellnessPlan?.goals?.map(g => g.title));
}

testPlan().catch(console.error);
