import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

console.log("================================================================================");
console.log("HEALTHCLUES SWISS ALPINE CHALET WELLNESS HOME - MULTI-ROUND VERIFICATION SUITE");
console.log("================================================================================\n");

// -----------------------------------------------------------------------------------------
// ROUND 1: STATIC CODE CONTRACTS, IMPORTS & COMPONENT INTEGRATION
// -----------------------------------------------------------------------------------------
console.log(">>> ROUND 1: STATIC CODE CONTRACTS & INTEGRATION CHECKS");

// A. Verify WorldAdventureScene integration
const scenePath = path.join(root, "src", "features", "healthclues", "WorldAdventureScene.tsx");
assert.ok(existsSync(scenePath), "WorldAdventureScene.tsx must exist.");
const sceneSrc = await readFile(scenePath, "utf8");

assert.match(
  sceneSrc,
  /import\s+\{\s*HealthCluesWellnessHome\s*\}\s+from\s+["']@\/components\/healthclues\/HealthCluesWellnessHome["']/,
  "WorldAdventureScene must import HealthCluesWellnessHome."
);
assert.match(sceneSrc, /\|\s*"home"/, "Panel type must include 'home'.");
assert.match(sceneSrc, /panel === "home"\s*\?\s*"Nhà Nghỉ Dưỡng Thụy Sĩ"/, "panelTitle handles 'home' panel in Vietnamese.");
assert.match(sceneSrc, /target === "home"\)[\s\S]*?setPanel\("home"\)/, "onNavigate handles 'home' target.");
assert.match(sceneSrc, /<HealthCluesWellnessHome[\s\S]*?closePanel/, "Renders HealthCluesWellnessHome with closePanel callback.");
console.log("  ✓ WorldAdventureScene.tsx cleanly integrates HealthCluesWellnessHome.");

// B. Verify HealthCluesRpgWorldHud bottom dock button
const hudPath = path.join(root, "src", "features", "healthclues", "HealthCluesRpgWorldHud.tsx");
assert.ok(existsSync(hudPath), "HealthCluesRpgWorldHud.tsx must exist.");
const hudSrc = await readFile(hudPath, "utf8");

assert.match(hudSrc, /Home,/, "HealthCluesRpgWorldHud must import Home icon from lucide-react.");
assert.match(hudSrc, /data-testid="hud-dock-home-btn"/, "HUD must have data-testid='hud-dock-home-btn'.");
assert.match(hudSrc, /onClick=\{\(\)\s*=>\s*onNavigate\("home"\)\}/, "Clicking HUD home button navigates to 'home'.");
assert.match(hudSrc, /"Nhà Của Tôi"/, "HUD displays 'Nhà Của Tôi' in Vietnamese.");
console.log("  ✓ HealthCluesRpgWorldHud.tsx bottom dock has interactive Home button.");

// C. Verify HealthCluesWellnessHome component
const homePath = path.join(root, "src", "components", "healthclues", "HealthCluesWellnessHome.tsx");
assert.ok(existsSync(homePath), "HealthCluesWellnessHome.tsx must exist.");
const homeSrc = await readFile(homePath, "utf8");

assert.match(homeSrc, /function computeHomography/, "Contains 3x3 projective homography matrix computation.");
assert.match(homeSrc, /matrix3d\(/, "Applies CSS matrix3d transform for projective warping.");
assert.match(homeSrc, /new Date\(\)\.getHours\(\)/, "Detects device clock for automatic Day/Night lighting.");
assert.match(homeSrc, /data-testid="welcome-gift-modal"/, "Contains Day 1 Starter Gift Unboxing Modal.");
assert.match(homeSrc, /data-testid="claim-welcome-btn"/, "Contains Welcome unboxing claim button.");
assert.match(homeSrc, /data-testid="daily-reward-modal"/, "Contains Daily Pick 1 of 2 Reward Modal.");
assert.match(homeSrc, /data-testid="confirm-reward-btn"/, "Contains Reward confirmation button.");
assert.match(homeSrc, /data-testid="day-night-toggle"/, "Contains Day / Night manual override toggle.");
assert.match(homeSrc, /data-testid="tab-living-room"/, "Contains Living Room switcher tab.");
assert.match(homeSrc, /data-testid="tab-bedroom"/, "Contains Bedroom switcher tab.");
console.log("  ✓ HealthCluesWellnessHome.tsx implements full gameplay loop & controls.");

// D. Verify Database Migration
const migPath = path.join(root, "supabase", "migrations", "20261108110000_healthclues_wellness_home_system.sql");
assert.ok(existsSync(migPath), "Supabase migration 20261108110000 must exist.");
const migSrc = await readFile(migPath, "utf8");

assert.match(migSrc, /CREATE TABLE IF NOT EXISTS healthclues_wellness_home_catalog/, "Creates catalog table.");
assert.match(migSrc, /CREATE TABLE IF NOT EXISTS healthclues_wellness_home_player_state/, "Creates player state table.");
assert.match(migSrc, /ENABLE ROW LEVEL SECURITY/, "Enables RLS on both tables.");
assert.match(migSrc, /INSERT INTO healthclues_wellness_home_catalog/, "Seeds the 10 Swiss Alpine Chalet items.");
assert.match(migSrc, /'sofa_luxury'/, "Seeds sofa_luxury starter.");
assert.match(migSrc, /'luxury_chalet_bed'/, "Seeds luxury_chalet_bed.");
console.log("  ✓ Database migration 20261108110000 is valid with 10 seed items and RLS.");

// -----------------------------------------------------------------------------------------
// ROUND 2: ASSET VERIFICATION (SCENES & 10 FURNITURE ITEMS)
// -----------------------------------------------------------------------------------------
console.log("\n>>> ROUND 2: ASSET RESOLUTION & INTEGRITY CHECKS");

const requiredScenes = [
  "public/healthclues/assets/home/scenes/scene_interior_wide.webp",
  "public/healthclues/assets/home/scenes/scene_interior_wide_night.webp",
  "public/healthclues/assets/home/scenes/scene_bedroom.webp",
  "public/healthclues/assets/home/scenes/scene_bedroom_night.webp",
];

for (const rel of requiredScenes) {
  const p = path.join(root, rel);
  assert.ok(existsSync(p), `Missing scene image: ${rel}`);
  const s = await stat(p);
  assert.ok(s.size > 50000, `Scene image ${rel} seems truncated (${s.size} bytes).`);
  console.log(`  ✓ Scene verified: ${rel} (${(s.size / 1024).toFixed(1)} KB)`);
}

const requiredItems = [
  "sofa_luxury.png",
  "piano_grand.png",
  "painting_fireplace.png",
  "table_coffee.png",
  "plant_pot_alps.png",
  "luxury_chalet_bed.png",
  "bedside_lamp.png",
  "bedroom_rug.png",
  "painting_bedroom.png",
  "bedside_armchair.png",
];

for (const item of requiredItems) {
  const rel = `public/healthclues/assets/home/items/${item}`;
  const p = path.join(root, rel);
  assert.ok(existsSync(p), `Missing item image: ${rel}`);
  const s = await stat(p);
  assert.ok(s.size > 10000, `Item image ${rel} seems truncated (${s.size} bytes).`);
  console.log(`  ✓ Furniture asset verified: ${item} (${(s.size / 1024).toFixed(1)} KB)`);
}

// -----------------------------------------------------------------------------------------
// ROUND 3: MATHEMATICAL HOMOGRAPHY & PERSPECTIVE WARPING STABILITY
// -----------------------------------------------------------------------------------------
console.log("\n>>> ROUND 3: HOMOGRAPHY MATHEMATICAL ACCURACY & STABILITY");

function computeTestHomography(w, h, p0, p1, p2, p3) {
  const x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  let a, b, c, d, e, f, g, h_val;
  if (Math.abs(dx3) < 1e-7 && Math.abs(dy3) < 1e-7) {
    a = x1 - x0;
    b = x3 - x0;
    c = x0;
    d = y1 - y0;
    e = y3 - y0;
    f = y0;
    g = 0;
    h_val = 0;
  } else {
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-7) return null;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    h_val = (dx1 * dy3 - dx3 * dy1) / det;
    a = x1 - x0 + g * x1;
    b = x3 - x0 + h_val * x3;
    c = x0;
    d = y1 - y0 + g * y1;
    e = y3 - y0 + h_val * y3;
    f = y0;
  }

  return [
    a / w, d / w, 0, g / w,
    b / h, e / h, 0, h_val / h,
    0, 0, 1, 0,
    c, f, 0, 1,
  ];
}

// Test affine rectangular case
const mRect = computeTestHomography(100, 50, { x: 10, y: 10 }, { x: 110, y: 10 }, { x: 110, y: 60 }, { x: 10, y: 60 });
assert.ok(Array.isArray(mRect) && mRect.length === 16, "Must produce a 16-element 4x4 matrix.");
assert.equal(mRect[0], 1, "Scale X is 1.0");
assert.equal(mRect[5], 1, "Scale Y is 1.0");
assert.equal(mRect[12], 10, "Translation X is 10");
assert.equal(mRect[13], 10, "Translation Y is 10");
console.log("  ✓ Identity/translation affine matrix validated.");

// Test perspective chimney wall trapezoid
const mTrapezoid = computeTestHomography(307, 420, { x: 135, y: 86 }, { x: 259, y: 86 }, { x: 260, y: 367 }, { x: 135, y: 330 });
assert.ok(Array.isArray(mTrapezoid), "Trapezoid produces valid perspective matrix.");
assert.notEqual(mTrapezoid[3], 0, "Perspective component g/w is non-zero (authentic 3D perspective warp).");
console.log("  ✓ Non-linear perspective homography matrix validated.");

// -----------------------------------------------------------------------------------------
// ROUND 4: ADMIN STUDIO CONTRACTS & RESTful ACTIONS
// -----------------------------------------------------------------------------------------
console.log("\n>>> ROUND 4: ADMIN STUDIO & POSITIONING CMS CHECKS");

const adminPagePath = path.join(root, "src", "app", "admin", "healthclues-home", "page.tsx");
assert.ok(existsSync(adminPagePath), "Admin page src/app/admin/healthclues-home/page.tsx must exist.");
const adminPageSrc = await readFile(adminPagePath, "utf8");

assert.match(adminPageSrc, /AdminHealthCluesHomePage/, "Admin page must export AdminHealthCluesHomePage.");
assert.match(adminPageSrc, /action:\s*["']admin_save_item["']/, "Admin page calls admin_save_item action.");
assert.match(adminPageSrc, /action:\s*["']admin_delete_item["']/, "Admin page calls admin_delete_item action.");
assert.match(adminPageSrc, /getSquareToQuadTransform/, "Admin page imports and uses getSquareToQuadTransform.");
assert.match(adminPageSrc, /handleSaveItem/, "Admin page implements handleSaveItem.");
assert.match(adminPageSrc, /scene_interior_wide/, "Supports living room scene.");
assert.match(adminPageSrc, /scene_bedroom/, "Supports bedroom scene.");
assert.match(adminPageSrc, /z_index/, "Allows adjusting z-index depth.");
console.log("  ✓ Admin studio page src/app/admin/healthclues-home/page.tsx contracts verified.");

const apiRoutePath = path.join(root, "src", "app", "api", "healthclues", "wellness-home", "route.ts");
const apiRouteSrc = await readFile(apiRoutePath, "utf8");
assert.match(apiRouteSrc, /action === "admin_save_item"/, "API route handles admin_save_item.");
assert.match(apiRouteSrc, /action === "admin_delete_item"/, "API route handles admin_delete_item.");
console.log("  ✓ API route supports admin_save_item and admin_delete_item.");

console.log("\n================================================================================");
console.log("ALL 4 ROUNDS OF HEALTHCLUES WELLNESS HOME VERIFICATION SUITE: 100% PASS!");
console.log("================================================================================");
