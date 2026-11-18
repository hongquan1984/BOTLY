# HealthClues Mobile — Cozy Fantasy 3D World Integration Audit (Phase 0)

**Date:** 2026-11-15  
**Architect:** Senior React Native / Three.js Architect & Game Integration Lead  
**Scope:** Phase 0 Mandatory Discovery, Safety Audit & Integration Architecture  
**Status:** COMPLETE & VALIDATED

---

## 1. Project Identification & Structure Audit

### 1.1 Source Project: Cozy Fantasy 3D Village (`word3d`)
- **Location:** `D:\botly\App\word3d`
- **Framework & Tooling:** Vite 6.4 + React 18 + Three.js 0.170 + TypeScript.
- **Port / Server:** Running on port 5173 (`PID 25524`).
- **3D World Components:**
  - `CozyIslandBase`: Organic floating island terrain geometry (`cozyVillageBuilder.ts`) with river canyon depression, grassy slopes, and cobblestone pathways.
  - `CozyVillage`: Medieval Village Pack diorama featuring 5 distinct landmark structures (Potion Shop, Watermill with rotating wheel & waterfall, Sunspire Guild Hall, Arcane Library, Starfall Fountain & Well).
  - `SkyEnvironment`: Atmospheric dome with animated 2.5D clouds, day/night lighting, and distant sky archipelago (`skyEnvironment.ts`).
  - `CharacterController`: Rigged 3D humanoid (`/assets/characters/humanoid.glb`) with Idle, Walk, and Run animation mixer actions.
  - `IslandNavMesh`: A* grid pathfinder (`0.5m` cell resolution, `0.6m` clearance buffer) with building & river obstacle colliders.
  - `CameraController`: Mobile-friendly touch drag orbit, pinch-to-zoom, and smooth target tracking.

### 1.2 Target Project: HealthClues Mobile (`healthclues-mobile`)
- **Location:** `D:\botly\App\healthclues-mobile`
- **Framework & Tooling:** React Native + Expo 51 + Expo Router 3.5 + React Native Reanimated.
- **Port / Server:** Running on port 8081 (`PID 13636`).
- **Core Architecture & Screens:**
  - Navigation: Expo Router with bottom tab bar (`app/(game)/_layout.tsx`).
  - World screen: `app/(game)/world.tsx` (the central game exploration hub).
  - Onboarding & Profile: `app/(onboarding)/quiz.tsx` (Mầm Nhỏ dialogue & health focus selection).
  - Feature Destinations:
    * My Journey & Goals: `app/(game)/journey.tsx`.
    * Daily Care & Check-ins: `app/(game)/daily-care.tsx`.
    * 3D Chalet Home Interior: `app/(game)/home.tsx`.
    * Mystery Body Detective: `src/modules/detective/DetectiveWebViewModal.tsx` (port 3329).
    * Inventory & Items: `app/(game)/inventory.tsx`.
    * Profile & Stats: `app/(game)/profile.tsx`.

---

## 2. Feature-to-Scene Integration Map

| Landmark in 3D Village | 3D Position (`[X, Y, Z]`) | Assigned Fairy NPC | HealthClues Mobile Feature Destination |
|---|---|---|---|
| **Herbal Garden** (`potion-shop`) | `[-8.5, 1.8, 5.0]` | **Flora** (Green/gold) | Vườn Thảo Mộc — Herbal medicine, apigenin, chamomile & natural sleep hygiene. |
| **Cloud Therapy House** (`watermill`) | `[-8.5, 2.8, -7.5]` | **Aura** (White/blue) | Nhà Thư Giãn — Parasympathetic 4-7-8 breathing, soundscapes & meditation. |
| **Knowledge Library** (`arcane-library`) | `[8.5, 1.8, -5.5]` | **Lyra** (Violet/gold) | Thư Viện Tri Thức — Medical chapters & Mystery Body Detective (`DetectiveWebViewModal`). |
| **Journey House** (`guild-hall`) | `[0.0, 2.2, -9.5]` | **Mira** (Orange/cream) | Nhà Hành Trình — Active health goals & Daily Care check-in routine. |
| **Village Square** (`central-fountain`) | `[2.2, 1.8, -0.8]` | **Nova** (Gold/pink) | Quảng Trường — Quests, achievements, EXP progression & coin rewards. |
| **Lumi & Mầm Nhỏ Companion** | Floating beside player | **Lumi** (Sprout/Fox) | Primary travel guide, tutorial tips & companion reactions. |

---

## 3. Architecture: WebView-First Hybrid Bridge

```
┌────────────────────────────────────────────────────────┐
│             HealthClues React Native App               │
│  - TopHUD (EXP, Coins, Audio, Online Presence)         │
│  - Bottom Tab Navigation & Safe Area Insets            │
│  - Native Modals (Detective, Daily Care, Journey, etc) │
│  - Auth & State Persistence (AsyncStorage/Supabase)    │
└──────────────────────────▲─────────────────────────────┘
                           │ postMessage Protocol
                           │ (Allowlisted, Validated Events)
┌──────────────────────────▼─────────────────────────────┐
│                 Word3D Player Runtime                  │
│  - Pure Three.js Cozy Fantasy Floating Village Scene   │
│  - 3D Humanoid Player (humanoid.glb) + A* NavMesh      │
│  - 5 Animated Fairy NPCs (Flora, Aura, Lyra, Mira,...) │
│  - Waterfall, Turning Watermill, Clouds, Ambient Birds │
│  - Mobile Touch Controls (Tap-to-walk, Orbit, Pinch)   │
│  - Standalone (No Editor / No Asset Studio UI)         │
└────────────────────────────────────────────────────────┘
```

### Event Protocol:
- **WebView → Native:**
  - `WORLD_READY`: 3D scene fully loaded and ready for interaction.
  - `INTERACT_LANDMARK`: Player reached landmark trigger radius (`{ landmarkId, targetName }`).
  - `INTERACT_NPC`: Player tapped or reached NPC (`{ npcId, npcName, role }`).
  - `PLAYER_MOVEMENT_STATE`: `{ isMoving: boolean, posX, posZ }`.
  - `WORLD_ERROR`: Scene rendering error or asset loading failure.
- **Native → WebView:**
  - `INIT_WORLD`: Passes player info, nickname, selected region, and graphics preset.
  - `SET_LANGUAGE`: Updates NPC speech and landmark names (`vi` / `en`).
  - `PAUSE_WORLD`: Halts WebGL render loop when tab is backgrounded.
  - `RESUME_WORLD`: Resumes WebGL render loop.
  - `TELEPORT_OR_FOCUS`: Focuses camera or teleports to specific landmark.

---

## 4. Safety & Rollback Guarantee
- The existing 2D/2.5D World screen logic in `app/(game)/world.tsx` remains completely preserved.
- A seamless mode toggle (`3D Làng Nổi` vs `2D Toàn Cảnh`) allows instant switching and fallback.
- No production database, user accounts, or external services are modified.
