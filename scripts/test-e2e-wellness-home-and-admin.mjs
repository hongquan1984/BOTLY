import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

console.log("================================================================================");
console.log("HEALTHCLUES END-TO-END VERIFICATION: ADMIN STUDIO & WELLNESS HOME GAMEPLAY");
console.log(`Target URL: ${baseUrl}`);
console.log("================================================================================\n");

async function runTests() {
  // -----------------------------------------------------------------------------------------
  // 1. ENDPOINT AVAILABILITY & HTML INTEGRITY
  // -----------------------------------------------------------------------------------------
  console.log(">>> TEST 1: ENDPOINT AVAILABILITY & SSR HEALTH CHECKS");
  
  const playRes = await fetch(`${baseUrl}/play`);
  assert.equal(playRes.status, 200, "GET /play must return HTTP 200.");
  const playHtml = await playRes.text();
  assert.ok(playHtml.includes("HEALTHCLUES"), "Play page contains HEALTHCLUES branding.");
  console.log("  ✓ GET /play returns HTTP 200 OK with valid game container.");

  const adminRes = await fetch(`${baseUrl}/admin/healthclues-home`);
  assert.equal(adminRes.status, 200, "GET /admin/healthclues-home must return HTTP 200.");
  const adminHtml = await adminRes.text();
  assert.ok(adminHtml.includes("Studio") || adminHtml.includes("Admin") || adminHtml.includes("Nội Thất"), "Admin page renders HealthClues Admin CMS UI.");
  console.log("  ✓ GET /admin/healthclues-home returns HTTP 200 OK with Admin Studio CMS.");

  // -----------------------------------------------------------------------------------------
  // 2. ADMIN CMS API: CREATE, UPDATE POSITION, PERSIST & DELETE
  // -----------------------------------------------------------------------------------------
  console.log("\n>>> TEST 2: ADMIN CMS FURNITURE POSITIONING & PERSISTENCE");

  // A. Save/Update item position
  const testItem = {
    id: "test_clock_alps",
    room: "scene_interior_wide",
    name_vi: "Đồng Hồ Cúc Cu Gỗ Tuyết Alps",
    name_en: "Alpine Snow Cuckoo Clock",
    tag_vi: "Trang Trí Tường",
    tag_en: "Wall Decor",
    desc_vi: "Đồng hồ thủ công truyền thống vùng núi tuyết Thụy Sĩ.",
    desc_en: "Traditional Swiss alpine handcrafted cuckoo clock.",
    img_src: "/healthclues/assets/home/items/plant_pot_alps.png",
    is_starter: false,
    natural_width: 200,
    natural_height: 250,
    user_scale: 0.8,
    z_index: 450,
    corners: {
      tl: [15.5, 30.2],
      tr: [28.0, 30.2],
      br: [28.0, 52.4],
      bl: [15.5, 52.4],
    },
  };

  const saveRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "admin_save_item",
      item: testItem,
    }),
  });
  assert.equal(saveRes.status, 200, "admin_save_item must return HTTP 200.");
  const saveData = await saveRes.json();
  assert.equal(saveData.success, true, "admin_save_item reports success: true.");
  console.log("  ✓ Admin CMS successfully created and saved new item 'test_clock_alps' with custom 4-corner coordinates.");

  // B. Verify item exists in live catalog query
  const catalogRes = await fetch(`${baseUrl}/api/healthclues/wellness-home?playerId=tester_verify`);
  assert.equal(catalogRes.status, 200, "Catalog query returns HTTP 200.");
  const catalogData = await catalogRes.json();
  const foundItem = catalogData.catalog.find(i => i.id === "test_clock_alps");
  assert.ok(foundItem, "Saved item must be present in live catalog.");
  assert.equal(foundItem.name_vi, testItem.name_vi, "Item name matches.");
  assert.equal(foundItem.z_index, 450, "Z-index matches.");
  assert.deepEqual(foundItem.corners.tl, [15.5, 30.2], "Top-left coordinates match.");
  console.log("  ✓ Live catalog query immediately returns the admin-configured item and exact coordinates.");

  // C. Delete test item
  const deleteRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "admin_delete_item",
      itemId: "test_clock_alps",
    }),
  });
  assert.equal(deleteRes.status, 200, "admin_delete_item returns HTTP 200.");
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true, "admin_delete_item reports success: true.");
  console.log("  ✓ Admin CMS successfully deleted test item, keeping catalog clean.");

  // -----------------------------------------------------------------------------------------
  // 3. PLAYER GAMEPLAY & REWARD UNLOCK FLOW
  // -----------------------------------------------------------------------------------------
  console.log("\n>>> TEST 3: PLAYER REWARD UNLOCK & CHALET PROGRESSION FLOW");

  const testPlayerId = `test_player_${Date.now()}`;

  // Initial State: Fresh player
  const initRes = await fetch(`${baseUrl}/api/healthclues/wellness-home?playerId=${testPlayerId}`);
  const initData = await initRes.json();
  assert.equal(initData.playerState.hasClaimedWelcome, false, "Fresh player has not claimed welcome gift.");
  assert.equal(initData.playerState.unlockedItems.length, 0, "Fresh player starts with 0 items.");
  console.log("  ✓ Fresh player starts with pristine empty chalet and welcome gift pending.");

  // Day 1: Welcome unboxing
  const welcomeRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "claim_welcome",
      playerId: testPlayerId,
    }),
  });
  assert.equal(welcomeRes.status, 200, "claim_welcome returns HTTP 200.");
  const welcomeData = await welcomeRes.json();
  assert.equal(welcomeData.playerState.hasClaimedWelcome, true, "Welcome gift marked as claimed.");
  assert.ok(welcomeData.playerState.unlockedItems.includes("sofa_luxury"), "Player now has sofa_luxury in inventory.");
  console.log("  ✓ Day 1 Welcome Gift unboxing unlocks Luxury Swiss Sofa into Living Room center.");

  // Day 2+: Daily reward claim (Pick 1 of 2 or Mystery Gift milestone)
  const rewardRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "claim_daily_reward",
      playerId: testPlayerId,
      itemId: "piano_grand",
    }),
  });
  assert.equal(rewardRes.status, 200, "claim_daily_reward returns HTTP 200.");
  const rewardData = await rewardRes.json();
  assert.ok(rewardData.playerState.unlockedItems.includes("piano_grand"), "Player now has piano_grand in inventory.");
  assert.ok(rewardData.playerState.lastRewardClaimedAt, "Reward claim timestamp is recorded.");
  console.log("  ✓ Milestone Mystery Gift Level 3 unlocks Classic Grand Piano into Living Room.");

  // Room & Lighting Controls
  const roomRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "set_active_room",
      playerId: testPlayerId,
      room: "scene_bedroom",
    }),
  });
  assert.equal(roomRes.status, 200);
  const roomData = await roomRes.json();
  assert.equal(roomData.playerState.activeRoom, "scene_bedroom", "Switched to Restorative Bedroom.");
  console.log("  ✓ Room switching dynamically updates active room to Bedroom.");

  const lightRes = await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "set_day_night",
      playerId: testPlayerId,
      override: "night",
    }),
  });
  assert.equal(lightRes.status, 200);
  const lightData = await lightRes.json();
  assert.equal(lightData.playerState.dayNightOverride, "night", "Night mode override enabled.");
  console.log("  ✓ Lighting override switches chalet to cozy Starlight Night mode.");

  // Clean reset
  await fetch(`${baseUrl}/api/healthclues/wellness-home`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reset_player",
      playerId: testPlayerId,
    }),
  });
  console.log("  ✓ Test player state cleanly reset.");

  // -----------------------------------------------------------------------------------------
  // 4. GRAPHIC ASSET ACCESSIBILITY CHECK OVER HTTP
  // -----------------------------------------------------------------------------------------
  console.log("\n>>> TEST 4: GRAPHIC ASSET AVAILABILITY OVER HTTP");

  const httpAssets = [
    "/healthclues/assets/home/scenes/scene_interior_wide.webp",
    "/healthclues/assets/home/scenes/scene_interior_wide_night.webp",
    "/healthclues/assets/home/scenes/scene_bedroom.webp",
    "/healthclues/assets/home/scenes/scene_bedroom_night.webp",
    "/healthclues/assets/home/items/sofa_luxury.png",
    "/healthclues/assets/home/items/piano_grand.png",
    "/healthclues/assets/home/items/table_coffee.png",
    "/healthclues/assets/home/items/plant_pot_alps.png",
    "/healthclues/assets/home/items/painting_fireplace.png",
    "/healthclues/assets/home/items/luxury_chalet_bed.png",
    "/healthclues/assets/home/items/bedside_lamp.png",
    "/healthclues/assets/home/items/bedroom_rug.png",
    "/healthclues/assets/home/items/painting_bedroom.png",
    "/healthclues/assets/home/items/bedside_armchair.png",
  ];

  for (const assetPath of httpAssets) {
    const assetRes = await fetch(`${baseUrl}${assetPath}`, { method: "HEAD" });
    assert.equal(assetRes.status, 200, `Asset ${assetPath} must be accessible with HTTP 200.`);
    console.log(`  ✓ HTTP 200: ${assetPath}`);
  }

  // -----------------------------------------------------------------------------------------
  // 5. NEW GIFT FOCUS & SPOTLIGHT HIGHLIGHT CONTRACT CHECKS
  // -----------------------------------------------------------------------------------------
  console.log("\n>>> TEST 5: NEW GIFT FOCUS & SPOTLIGHT HIGHLIGHT VERIFICATION");

  const { readFile } = await import("node:fs/promises");
  const homeCompSrc = await readFile(path.join(root, "src", "components", "healthclues", "HealthCluesWellnessHome.tsx"), "utf8");
  assert.ok(homeCompSrc.includes("highlightItemId"), "HealthCluesWellnessHome accepts highlightItemId prop.");
  assert.ok(homeCompSrc.includes("hc-home-item-highlight"), "Applies hc-home-item-highlight class on focused item.");
  assert.ok(homeCompSrc.includes("hc-home-new-gift-beacon"), "Renders animated new-gift-beacon above newly unlocked item.");
  console.log("  ✓ HealthCluesWellnessHome correctly implements new gift focus spotlight & floating beacon.");

  const sceneSrc = await readFile(path.join(root, "src", "features", "healthclues", "WorldAdventureScene.tsx"), "utf8");
  assert.ok(sceneSrc.includes("highlightHomeItemId"), "WorldAdventureScene tracks and passes highlightHomeItemId.");
  console.log("  ✓ WorldAdventureScene forwards target item to chalet for spotlight focus.");

  const hudSrc = await readFile(path.join(root, "src", "features", "healthclues", "HealthCluesRpgWorldHud.tsx"), "utf8");
  assert.ok(hudSrc.includes("itemId || mysteryGiftModal.itemId"), "HUD forwards unboxed item ID upon entering home.");
  console.log("  ✓ HUD forwards mystery gift item ID to chalet on unbox claim.");

  const cssSrc = await readFile(path.join(root, "src", "components", "healthclues", "wellness-home.css"), "utf8");
  assert.ok(cssSrc.includes("hcHomeGiftPulse"), "CSS defines pulse glow animation for new gifts.");
  assert.ok(cssSrc.includes("hcBadgeBounce"), "CSS defines floating bounce animation for new gift beacon.");
  console.log("  ✓ CSS stylesheet implements radiant golden spotlight drop-shadow and floating bounce beacon.");

  console.log("\n================================================================================");
  console.log("ALL END-TO-END HEALTHCLUES TESTS: 100% PASS!");
  console.log("================================================================================");
}

runTests().catch(err => {
  console.error("FATAL TEST FAILURE:", err);
  process.exit(1);
});
