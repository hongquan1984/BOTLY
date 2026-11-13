# HealthClues Living Village V1 & Chibi Adventurers Acceptance Report

- **Date**: 2026-11-06
- **Feature**: Living Village V1 (5 Autonomous Chibi Visitors & Character Sprite Replacement)
- **Status**: Verified 100% via Chrome CDP automated tests and multimodal AI vision scan.
- **Port / Server**: `http://127.0.0.1:3329` (Next.js server PID 26304, isolated build `app-build-rpg-ui`)

---

## 1. Scope & Design Implementation

### 1.1 Character Artwork Extraction (`App/references/charactor.png`)
5 distinct chibi characters were cleanly extracted from the concept artwork sheet with 0.5px Gaussian edge smoothing:
- **Anna** (`/healthclues/assets/characters/chibi-anna.png`): Green cloak, clean idle frame (80x108px).
- **Leo** (`/healthclues/assets/characters/chibi-leo.png`): Deep blue/teal cloak with beret (99x132px).
- **Mia** (`/healthclues/assets/characters/chibi-mia.png`): Cream cloak with flower accessory (102x130px).
- **Ben** (`/healthclues/assets/characters/chibi-ben.png`): Navy crescent cloak with round glasses (105x129px).
- **Lily** (`/healthclues/assets/characters/chibi-lily.png`): Purple cloak with white flower (100x144px).
- **Bonus Reaction Sprites**: `chibi-anna-wave.png`, `chibi-lily-heart.png`, `chibi-ben-chao.png`.

### 1.2 Main Player Character Replacement
- Player in HealthClues Realm (`!sleep`) now uses `.is-chibi-adventurer` displaying the chibi adventurer sprite (`chibi-anna.png`) with an idle bobbing animation and walk-gliding.
- High-visibility gold-bordered player pill `You` (or user nickname) with ambient gold aura distinguishes the player from village visitors.

### 1.3 Autonomous Behavior Loop
Each visitor runs an independent state loop:
`IDLE / RESTING` → `CHOOSE DESTINATION` → `MOVE ALONG WAYPOINTS` → `INTERACT (NPC or PEER)` → `REST` → `REPEAT`.
- **Destinations**: Botanist (Greenhouse), Wellness Guide (Lotus Sanctuary), Knowledge Library, Central Plaza (3 spots), Fountain (2 spots), Lake Dock, Activity Trail, Camp.
- **NPC Greetings**: When reaching Botanist or Wellness Guide, visitor stops, faces NPC, and displays a friendly dialogue bubble. The NPC dynamically responds with an emerald reply bubble.
- **Peer Rendezvous**: Pairs occasionally rendezvous at the Central Plaza or Fountain, face each other, and exchange greetings.
- **Player Interaction**: Clicking on any visitor triggers a friendly voice quote.

### 1.4 Pathfinding & Collision Safety
- Movement strictly follows the authored graph topology (`REGION_NAVIGATION['health-concern'].walkablePaths`, 51 connected nodes).
- Characters never cross water, houses, trees, or fences.
- 2.5D depth sorting: `zIndex: Math.round(y)` ensures natural layering with the environment.

---

## 2. Verification Evidence

### 2.1 Automated Test Execution (`scripts/verify-living-village.mjs`)
- **Visitors Rendered**: Exactly 5 chibi visitors (`Anna`, `Leo`, `Mia`, `Ben`, `Lily`) with name pills and soft shadows.
- **Player State**: `isChibi: true`, sprite background `chibi-anna.png`, name tag visible.
- **Autonomous Motion**: Position changes confirmed over 4.5s:
  - Anna: `(786, 334)` -> `(983, 431)` (`state: moving`)
  - Leo: `(409, 365)` -> `(490, 403)` (`state: moving`)
  - Ben: `(1031, 365)` -> `(916, 498)` (`state: moving`)
  - Lily: `(1166, 583)` -> `(1148, 585)` (`state: moving`)
- **Speech Bubble Triggered**: Clicking Anna popped: `"Chào bạn đồng hành! Chúc bạn ngày an lành ✨"`.

### 2.2 Multimodal AI Vision Inspection
- `vision-check-living-village-world.png`: Desktop world (1280x800) showing all 5 chibis naturally positioned on cobblestone paths, soft shadows, name tags, and main player at front.
- `vision-check-living-village-speech.png`: Speech bubble rendered with elegant cream card styling and directional pointer.
- `vision-check-living-village-mobile-world.png`: Mobile portrait view (390x844) displaying the lively village scene, bottom navigation dock, and zero UI collisions.

---

## 3. Boundaries & Rollback
- **Safety Boundary**: Pure client-side simulation. No Supabase records created, no DB writes, no Gemini API usage.
- **Regional Isolation**: Only HealthClues Realm (`health-concern`) is enhanced. Sleep Valley (`sleep-better`) remains 100% untouched.
- **Feature Flag**: `ENABLE_LIVING_VILLAGE_V1 = true` in `AmbientVillageVisitors.tsx` for immediate toggle/rollback.
