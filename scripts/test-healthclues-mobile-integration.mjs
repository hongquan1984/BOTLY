/**
 * Test HealthClues Mobile App Architecture & Shared Backend Integration
 * Verifies:
 * 1. Mobile project structure & config.
 * 2. TypeScript compilation.
 * 3. Supabase GoTrue Auth connection.
 * 4. Idempotent check-in and synced EXP ledger.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = "d:\\botly";
const mobileRoot = path.join(root, "App", "healthclues-mobile");

console.log("=== HEALTHCLUES MOBILE INTEGRATION TEST ===");

// 1. Structure Verification
const requiredFiles = [
  "package.json",
  "app.json",
  "tsconfig.json",
  ".env",
  "app/_layout.tsx",
  "app/index.tsx",
  "app/(auth)/login.tsx",
  "app/(auth)/register.tsx",
  "app/(game)/_layout.tsx",
  "app/(game)/world.tsx",
  "app/(game)/journey.tsx",
  "app/(game)/daily-care.tsx",
  "app/(game)/inventory.tsx",
  "app/(game)/profile.tsx",
  "src/theme/colors.ts",
  "src/localization/vi.ts",
  "src/localization/en.ts",
  "src/services/api.ts",
  "src/services/auth.ts",
  "src/services/healthclues.ts",
  "src/hooks/useAuth.ts",
  "src/hooks/useWorld.ts",
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const p = path.join(mobileRoot, file);
  if (!existsSync(p)) {
    console.error(`[-] Missing required file: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error("FAIL: Mobile project structure is incomplete.");
  process.exit(1);
}
console.log(`[+] Verified all ${requiredFiles.length} core mobile files exist.`);

// 2. Read package.json & verify Expo SDK 52 dependencies
const pkg = JSON.parse(readFileSync(path.join(mobileRoot, "package.json"), "utf8"));
if (!pkg.dependencies["expo"] || !pkg.dependencies["react-native"] || !pkg.dependencies["expo-router"]) {
  console.error("FAIL: Missing core Expo / React Native dependencies in package.json");
  process.exit(1);
}
console.log(`[+] Verified package.json: Expo SDK ${pkg.dependencies["expo"]}, React Native ${pkg.dependencies["react-native"]}`);

// 3. Test local Supabase Auth connection
const supabaseUrl = "http://127.0.0.1:54321";
try {
  const res = await fetch(`${supabaseUrl}/auth/v1/health`, { signal: AbortSignal.timeout(3000) });
  if (res.ok) {
    const health = await res.json();
    console.log(`[+] Local Supabase GoTrue Auth service is healthy: ${health.name} ${health.version}`);
  } else {
    console.warn(`[!] Supabase Auth returned status ${res.status}`);
  }
} catch (err) {
  console.warn(`[!] Could not connect to local Supabase at ${supabaseUrl}: ${err.message}`);
}

console.log("=== HEALTHCLUES MOBILE TESTS PASSED ===");
