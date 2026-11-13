import fs from 'fs';
import path from 'path';

const NIEOBIE_RAW = 'https://raw.githubusercontent.com/Nieobie/game-icon-pack/main/svg/no-padding/';
const GAME_ICONS_RAW = 'https://raw.githubusercontent.com/game-icons/icons/master/';
const KENNEY_RAW = 'https://raw.githubusercontent.com/bevyengine/bevy/main/assets/textures/fantasy_ui_borders/';

const TARGET_DIRS = [
  'd:/botly/public/assets/game/icons/navigation',
  'd:/botly/public/assets/game/icons/quests',
  'd:/botly/public/assets/game/icons/inventory',
  'd:/botly/public/assets/game/icons/knowledge',
  'd:/botly/public/assets/game/icons/achievements',
  'd:/botly/public/assets/game/ui/borders',
  'd:/botly/public/healthclues/assets/game/icons/navigation',
  'd:/botly/public/healthclues/assets/game/icons/quests',
  'd:/botly/public/healthclues/assets/game/icons/inventory',
  'd:/botly/public/healthclues/assets/game/icons/knowledge',
  'd:/botly/public/healthclues/assets/game/icons/achievements',
  'd:/botly/public/healthclues/assets/game/ui/borders',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/icons/navigation',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/icons/quests',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/icons/inventory',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/icons/knowledge',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/icons/achievements',
  'd:/botly/App/app-build-rpg-ui/public/assets/game/ui/borders',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/navigation',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/quests',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/inventory',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/knowledge',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/icons/achievements',
  'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/ui/borders',
];

for (const dir of TARGET_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeGameIconSvg(svgText) {
  // Remove dark background rectangle (512x512)
  let cleaned = svgText.replace(/<path[^>]*d="M0 0h512v512H0z"[^>]*\/>/i, '');
  cleaned = cleaned.replace(/<rect[^>]*width="512"[^>]*height="512"[^>]*\/>/i, '');
  // Make fill currentColor
  cleaned = cleaned.replace(/fill="#fff"/gi, 'fill="currentColor"');
  cleaned = cleaned.replace(/fill="#ffffff"/gi, 'fill="currentColor"');
  cleaned = cleaned.replace(/fill="white"/gi, 'fill="currentColor"');
  if (!cleaned.includes('fill="currentColor"') && !cleaned.includes('fill="none"')) {
    cleaned = cleaned.replace('<svg ', '<svg fill="currentColor" ');
  }
  return cleaned;
}

function sanitizeNieobieSvg(svgText) {
  // Ensure fill="currentColor"
  let cleaned = svgText;
  if (!cleaned.includes('fill="currentColor"')) {
    cleaned = cleaned.replace('<svg ', '<svg fill="currentColor" ');
  }
  return cleaned;
}

const ASSET_MANIFEST = [
  // Navigation
  { type: 'svg', source: 'nieobie', remote: '2-items/compass.svg', localName: 'icons/navigation/compass.svg' },
  { type: 'svg', source: 'nieobie', remote: '2-items/map.svg', localName: 'icons/navigation/map.svg' },
  { type: 'svg', source: 'nieobie', remote: '8-ui/zoom-in.svg', localName: 'icons/navigation/zoom-in.svg' },
  { type: 'svg', source: 'nieobie', remote: '8-ui/zoom-out.svg', localName: 'icons/navigation/zoom-out.svg' },
  { type: 'svg', source: 'nieobie', remote: '8-ui/lock.svg', localName: 'icons/navigation/lock.svg' },
  { type: 'svg', source: 'nieobie', remote: '6-buildings/tent.svg', localName: 'icons/navigation/camp-tent.svg' },
  { type: 'svg', source: 'nieobie', remote: '4-nature/mountain.svg', localName: 'icons/navigation/trail-mountain.svg' },
  { type: 'svg', source: 'game-icons', remote: 'lorc/moon.svg', localName: 'icons/navigation/trail-moon.svg' },
  { type: 'svg', source: 'nieobie', remote: '4-nature/sun.svg', localName: 'icons/navigation/trail-sun.svg' },
  { type: 'svg', source: 'nieobie', remote: '4-nature/wind.svg', localName: 'icons/navigation/trail-wind.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/solid-leaf.svg', localName: 'icons/navigation/trail-leaf.svg' },
  { type: 'svg', source: 'nieobie', remote: '4-nature/flower.svg', localName: 'icons/navigation/trail-flower.svg' },

  // Quests & Journey
  { type: 'svg', source: 'game-icons', remote: 'lorc/scroll-unfurled.svg', localName: 'icons/quests/quest-scroll.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/checklist.svg', localName: 'icons/quests/checklist.svg' },
  { type: 'svg', source: 'nieobie', remote: '9-media/bookmark.svg', localName: 'icons/quests/bookmark.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/scroll-quill.svg', localName: 'icons/quests/quill-note.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/check-mark.svg', localName: 'icons/quests/check-mark.svg' },
  { type: 'svg', source: 'nieobie', remote: '12-misc/five-pointed-star.svg', localName: 'icons/quests/star-exp.svg' },

  // Inventory & Equipment
  { type: 'svg', source: 'nieobie', remote: '2-items/backpack.svg', localName: 'icons/inventory/backpack.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/herbs-bundle.svg', localName: 'icons/inventory/herbs-bundle.svg' },
  { type: 'svg', source: 'nieobie', remote: '5-food/bowl.svg', localName: 'icons/inventory/food-bowl.svg' },
  { type: 'svg', source: 'nieobie', remote: '5-food/apple.svg', localName: 'icons/inventory/fruit-apple.svg' },
  { type: 'svg', source: 'nieobie', remote: '5-food/a-bottle-of-water.svg', localName: 'icons/inventory/water-bottle.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/running-shoe.svg', localName: 'icons/inventory/running-shoe.svg' },
  { type: 'svg', source: 'game-icons', remote: 'lorc/lotus.svg', localName: 'icons/inventory/lotus-flower.svg' },
  { type: 'svg', source: 'nieobie', remote: '2-items/book.svg', localName: 'icons/inventory/book-lore.svg' },
  { type: 'svg', source: 'nieobie', remote: '2-items/chest.svg', localName: 'icons/inventory/chest.svg' },

  // Knowledge & Skills & Boss
  { type: 'svg', source: 'game-icons', remote: 'lorc/magnifying-glass.svg', localName: 'icons/knowledge/detective-glass.svg' },
  { type: 'svg', source: 'game-icons', remote: 'lorc/sprout.svg', localName: 'icons/knowledge/garden-sprout.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/running-shoe.svg', localName: 'icons/knowledge/movement-runner.svg' },
  { type: 'svg', source: 'game-icons', remote: 'lorc/meditation.svg', localName: 'icons/knowledge/mind-meditation.svg' },
  { type: 'svg', source: 'nieobie', remote: '1-game/controller.svg', localName: 'icons/knowledge/gamepad.svg' },
  { type: 'svg', source: 'game-icons', remote: 'lorc/crossed-swords.svg', localName: 'icons/knowledge/boss-swords.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/boss-key.svg', localName: 'icons/knowledge/boss-key.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/attached-shield.svg', localName: 'icons/knowledge/shield-guard.svg' },
  { type: 'svg', source: 'game-icons', remote: 'delapouite/trophy-cup.svg', localName: 'icons/achievements/trophy-reward.svg' },
  { type: 'svg', source: 'nieobie', remote: '12-misc/four-pointed-star.svg', localName: 'icons/achievements/sparkles.svg' },

  // Kenney Fantasy UI Borders (Binary PNG)
  { type: 'png', source: 'kenney', remote: 'border_sheet.png', localName: 'ui/borders/border_sheet.png' },
  { type: 'png', source: 'kenney', remote: 'panel-border-010.png', localName: 'ui/borders/panel-border-010.png' },
  { type: 'png', source: 'kenney', remote: 'panel-border-015.png', localName: 'ui/borders/panel-border-015.png' },
];

async function run() {
  console.log(`Starting asset integration download for ${ASSET_MANIFEST.length} items...`);
  let successCount = 0;

  for (const item of ASSET_MANIFEST) {
    let url = '';
    if (item.source === 'nieobie') url = NIEOBIE_RAW + item.remote;
    else if (item.source === 'game-icons') url = GAME_ICONS_RAW + item.remote;
    else if (item.source === 'kenney') url = KENNEY_RAW + item.remote;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      let data;
      if (item.type === 'svg') {
        const text = await res.text();
        data = item.source === 'game-icons' ? sanitizeGameIconSvg(text) : sanitizeNieobieSvg(text);
      } else {
        const buf = await res.arrayBuffer();
        data = Buffer.from(buf);
      }

      // Save to all target base directories
      const bases = [
        'd:/botly/public/assets/game/',
        'd:/botly/public/healthclues/assets/game/',
        'd:/botly/App/app-build-rpg-ui/public/assets/game/',
        'd:/botly/App/app-build-rpg-ui/public/healthclues/assets/game/',
      ];

      for (const base of bases) {
        const fullPath = path.join(base, item.localName);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        if (typeof data === 'string') {
          fs.writeFileSync(fullPath, data, 'utf8');
        } else {
          fs.writeFileSync(fullPath, data);
        }
      }

      successCount++;
      console.log(`[OK] ${item.localName} (${item.source})`);
    } catch (err) {
      console.error(`[FAIL] ${item.localName} from ${url}:`, err.message);
    }
  }

  console.log(`Asset download complete: ${successCount}/${ASSET_MANIFEST.length} items saved.`);
}

run();
