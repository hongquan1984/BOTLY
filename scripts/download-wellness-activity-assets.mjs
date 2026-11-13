import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const targetDirs = [
  "d:/botly/public/assets/game/icons/wellness",
  "d:/botly/public/healthclues/assets/game/icons/wellness",
  "d:/botly/App/app-build-rpg-ui/public/assets/game/icons/wellness",
  "d:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/wellness",
  "d:/botly/App/.tmp/healthclues-owner-demo/app-build-rpg-ui/public/assets/game/icons/wellness",
  "d:/botly/App/.tmp/healthclues-owner-demo/app-build-rpg-ui/public/healthclues/assets/game/icons/wellness",
];

const subdirs = [
  "food",
  "herbs",
  "physical",
  "yoga",
  "meditation",
  "sleep",
  "hydration",
  "habits",
  "knowledge",
  "quests",
];

for (const base of targetDirs) {
  for (const sub of subdirs) {
    mkdirSync(path.join(base, sub), { recursive: true });
  }
}

// Helper to sanitize SVG: ensures standard viewBox, width, height, and fill/stroke currentColor for seamless CSS mask & SVG tinting
function sanitizeSvg(content) {
  let cleaned = content.trim();
  // Ensure xmlns
  if (!cleaned.includes('xmlns="http://www.w3.org/2000/svg"')) {
    cleaned = cleaned.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  // If it's a stroke icon (like Tabler), ensure stroke="currentColor" and fill="none"
  if (cleaned.includes('stroke="currentColor"') || cleaned.includes("stroke=")) {
    cleaned = cleaned.replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
    if (!cleaned.includes("stroke-width")) {
      cleaned = cleaned.replace("<svg", '<svg stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
    }
  } else {
    // Fill icon
    cleaned = cleaned.replace(/fill="[^"]*"/g, 'fill="currentColor"');
  }
  return cleaned;
}

// Manifest of wellness assets to download
const assets = [
  // --- 1. Food & Nutrition ---
  {
    category: "food",
    id: "fish",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/fish.svg",
  },
  {
    category: "food",
    id: "red-meat",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/meat.svg",
  },
  {
    category: "food",
    id: "egg",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/egg.svg",
  },
  {
    category: "food",
    id: "vegetables",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/vegetables.svg",
  },
  {
    category: "food",
    id: "carrot",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/carrot.svg",
  },
  {
    category: "food",
    id: "apple",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/apple.svg",
  },
  {
    category: "food",
    id: "fruits",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/fruits.svg",
  },
  {
    category: "food",
    id: "dairy",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/dairy.svg",
  },
  {
    category: "food",
    id: "salt-off",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/sodium-free.svg",
  },
  {
    category: "food",
    id: "sugar-off",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/sugar-free.svg",
  },
  {
    category: "food",
    id: "hot-meal",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/hot-meal.svg",
  },
  {
    category: "food",
    id: "beans",
    source: "OpenCrop (CC0)",
    url: "https://raw.githubusercontent.com/openfarmcc/open-crop-icons/mainline/icons/blue-lake-bean/blue-lake-bean.svg",
  },
  {
    category: "food",
    id: "berries",
    source: "OpenCrop (CC0)",
    url: "https://raw.githubusercontent.com/openfarmcc/open-crop-icons/mainline/icons/blueberry/blueberry.svg",
  },

  // --- 2. Herbs & Plants ---
  {
    category: "herbs",
    id: "basil",
    source: "OpenCrop (CC0)",
    url: "https://raw.githubusercontent.com/openfarmcc/open-crop-icons/mainline/icons/basil/basil.svg",
  },
  {
    category: "herbs",
    id: "flower-chamomile",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/flower.svg",
  },
  {
    category: "herbs",
    id: "leaf-mint",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/leaf.svg",
  },
  {
    category: "herbs",
    id: "herbs-bundle",
    source: "Game-icons.net (CC BY 3.0)",
    url: "https://raw.githubusercontent.com/game-icons/icons/master/all-svg/herbs-bundle.svg",
  },
  {
    category: "herbs",
    id: "green-tea",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/cup.svg",
  },

  // --- 3. Physical Activities ---
  {
    category: "physical",
    id: "walking",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/walking.svg",
  },
  {
    category: "physical",
    id: "running",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/running.svg",
  },
  {
    category: "physical",
    id: "cycling",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/exercise-bicycle.svg",
  },
  {
    category: "physical",
    id: "swimming",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/swim.svg",
  },
  {
    category: "physical",
    id: "strength",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/weights.svg",
  },
  {
    category: "physical",
    id: "exercise",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/exercise/exercise.svg",
  },
  {
    category: "physical",
    id: "stairs",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/stairs.svg",
  },

  // --- 4. Yoga & Stretching ---
  {
    category: "yoga",
    id: "yoga-lotus",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/yoga.svg",
  },
  {
    category: "yoga",
    id: "stretching",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/stretching.svg",
  },

  // --- 5. Meditation & Breathing ---
  {
    category: "meditation",
    id: "breathing",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/wind.svg",
  },
  {
    category: "meditation",
    id: "mindfulness",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/brain.svg",
  },
  {
    category: "meditation",
    id: "bell",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/bell.svg",
  },
  {
    category: "meditation",
    id: "lotus",
    source: "Game-icons.net (CC BY 3.0)",
    url: "https://raw.githubusercontent.com/game-icons/icons/master/all-svg/lotus.svg",
  },

  // --- 6. Sleep & Relaxation ---
  {
    category: "sleep",
    id: "moon-stars",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/moon-stars.svg",
  },
  {
    category: "sleep",
    id: "bed",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/bed.svg",
  },
  {
    category: "sleep",
    id: "clock-routine",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/alarm.svg",
  },

  // --- 7. Hydration ---
  {
    category: "hydration",
    id: "glass-water",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/glass-full.svg",
  },
  {
    category: "hydration",
    id: "water-bottle",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/bottle.svg",
  },
  {
    category: "hydration",
    id: "droplet",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/droplet.svg",
  },

  // --- 8. Daily Lifestyle Habits ---
  {
    category: "habits",
    id: "sunlight",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/sun.svg",
  },
  {
    category: "habits",
    id: "screen-off",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/device-mobile-off.svg",
  },
  {
    category: "habits",
    id: "journaling",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/notebook.svg",
  },
  {
    category: "habits",
    id: "checklist",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/list-check.svg",
  },
  {
    category: "habits",
    id: "alcohol-cessation",
    source: "Health Icons (CC0)",
    url: "https://raw.githubusercontent.com/resolvetosavelives/healthicons/main/public/icons/svg/outline/nutrition/alcohol-cessation.svg",
  },

  // --- 9. Knowledge & Learning ---
  {
    category: "knowledge",
    id: "book-study",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/book.svg",
  },
  {
    category: "knowledge",
    id: "bulb-learning",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/bulb.svg",
  },

  // --- 10. Quests & Achievements ---
  {
    category: "quests",
    id: "trophy",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/trophy.svg",
  },
  {
    category: "quests",
    id: "sparkles",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/sparkles.svg",
  },
  {
    category: "quests",
    id: "target-goal",
    source: "Tabler (MIT)",
    url: "https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/target.svg",
  },
];

console.log(`Downloading ${assets.length} wellness activity icons...`);

let downloaded = 0;
for (const item of assets) {
  try {
    const res = await fetch(item.url);
    if (!res.ok) {
      console.error(`Failed ${item.id} from ${item.url}: HTTP ${res.status}`);
      continue;
    }
    const raw = await res.text();
    const sanitized = sanitizeSvg(raw);

    const filename = `${item.id}.svg`;
    for (const base of targetDirs) {
      const dest = path.join(base, item.category, filename);
      writeFileSync(dest, sanitized, "utf8");
    }
    downloaded++;
    console.log(` ✓ [${item.category}] ${item.id}.svg (${item.source})`);
  } catch (err) {
    console.error(`Error downloading ${item.id}:`, err.message);
  }
}

console.log(`\nSuccessfully downloaded and synchronized ${downloaded}/${assets.length} wellness activity icons across all project locations!`);
