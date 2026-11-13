# Acceptance Report: HealthClues RPG Scene Blueprint Replacement & Stone Path Navigation Tracing

- **Date**: 2026-11-05
- **Reference Artwork**: User uploaded `media_1793858483481_d1785343.jpg` (1024×576, 16:9)
- **Deployment Status**: Live and verified on local loopback daemon `http://127.0.0.1:3329`
- **Related Specs**: [CURRENT_STATE.md](file:///d:/botly/App/CURRENT_STATE.md), [MASTER_SPEC.md](file:///d:/botly/App/MASTER_SPEC.md), [UI_UX_SPEC.md](file:///d:/botly/App/UI_UX_SPEC.md)

---

## 1. Overview & Requirements Addressed

The user requested:
> *"thay cái background game bằng cái này, lưu ý đường đi chuẩn . ví trí của nhân vật, npc"* (attached: `media_1793858483481_d1785343.jpg`).

Key objectives:
1. Replace the existing background scene blueprint with the new artwork without quality degradation.
2. Tracing exact walking paths (*"đường đi chuẩn"*) so the player character and Pet companion move strictly along the visible stone roads and cobblestone plazas.
3. Position player, Pet companion, and all NPCs (*"vị trí của nhân vật, npc"*) in alignment with the buildings and architectural features.
4. Harmonize the HUD and floating landmark pills to match the approved reference presentation.

---

## 2. Implementation Details

### A. Asset Conversion & Deployment
- Converted high-res 16:9 source image (`media_1793858483481_d1785343.jpg`) to crisp, lossless-scale WebP at `1600×900` (`lanczos3` kernel, 92 quality, 429KB).
- Deployed to:
  - `public/healthclues/assets/regions/healthclues-realm-scene-blueprint.webp`
  - `public/healthclues/assets/regions/sleep-valley-scene-blueprint.webp`

### B. Accurate 12-Corridor Stone Navigation Graph
In [`region-navigation-data.ts`](file:///d:/botly/src/features/healthclues/region-navigation-data.ts), all stone roads were modeled as 12 interconnected path corridors:
1. **Central Circular Plaza**: 12-point outer ellipse matching the stone ring with radial spokes crossing the carved leaf emblem.
2. **West Road**: From Central Plaza rim (`325, 442`) west to the Camp Cottage entrance (`185, 415`).
3. **North-West Road**: From Central Plaza (`420, 395`) curving NW to the Knowledge Library stairs (`280, 275`).
4. **North Road**: From Central Plaza North (`490, 388`) straight north to the Stone Fountain apron (`504, 265`).
5. **Stone Fountain Basin Loop**: Circular apron around the glowing leaf crystal and archway.
6. **North-East Road**: From Central Plaza (`560, 395`) curving NE to the Glass Greenhouse entrance stairs (`735, 265`).
7. **East Road**: From Central Plaza East (`655, 442`) east to the Lotus Pavilion steps (`815, 415`).
8. **Pier / Dock Branch**: From East road down to the lake shore (`805, 470`) onto the wooden pier (`885, 490`).
9. **Cross-Connector NW**: Direct path connecting Knowledge Library <-> Stone Fountain.
10. **Cross-Connector NE**: Direct path connecting Stone Fountain <-> Glass Greenhouse.
11. **South-West Exit**: Connecting Central Plaza SW towards the lower-left landscape.
12. **Center Hub Crossing**: Radial spokes ensuring player can traverse any diameter of the central circle.

### C. Character, NPC & Landmark Pill Placement
In [`RegionMapScene.tsx`](file:///d:/botly/src/features/healthclues/RegionMapScene.tsx) and [`world-adventure.css`](file:///d:/botly/src/features/healthclues/world-adventure.css):
- **Player & Pet**: Spawn in the Center Hub Plaza on the carved leaf emblem (`x: 48%, y: 77%`), facing into the world with Lumi Pet at their side and the `+20 EXP` celebration sunburst floating directly overhead.
- **Botanist NPC**: Standing in front of the Glass Greenhouse on the stone path (`x: 68%, y: 46%`). Approach point at `(72%, 46%)`.
- **Trail Explorer NPC**: Standing in front of the Camp Cottage on the stone path (`x: 24%, y: 72%`). Approach point at `(27%, 72%)`.
- **Wellness Guide NPC**: Standing in front of the Lotus Pavilion on the stone path (`x: 76%, y: 72%`). Approach point at `(80%, 72%)`.
- **Floating Landmark Pills**:
  - Permanently visible for the three signature landmarks:
    - `Knowledge / Hall Kho Tri Thức` (above lodge roof)
    - `Botanist / Nhà Thảo Mộc` (above greenhouse / Botanist)
    - `Wellness Guide / Cẩm Nang Sống Khỏe` (above lotus pavilion)
  - Non-signature landmarks (`Camp`, `Activity Trail`, `Boss`, `Rewards`) appear cleanly on hover/focus.
  - Obstructive square icon seals (`.hc-rpg-building-seal`) previously covering building facades have been removed (`display: none !important;`).

---

## 3. Test & Verification Evidence

1. **Path Alignment & Graph Validation (`scripts/test-healthclues-region-layout.mjs`)**:
   - `sleep-better`: verified connected stone paths across 17 routes, 0 bridges.
   - `health-concern`: verified connected stone paths across 17 routes, 0 bridges.
   - All 8 landmark approach points lie within `< 31px` clearance of a stone path corridor.
2. **Pairwise Route Verification (`scripts/test-new-paths.mjs`)**:
   - Tested 28 unique origin-destination pairs across all landmarks.
   - 100% passed `findPath()` with 0 blocked routes.
3. **End-to-End Browser Journey (`scripts/test-full-user-journey-rpg.mjs`)**:
   - Successfully completed Quiz -> Goal Selection -> Instant Activation -> RPG World scene.
   - Navigated player from Center Hub to Botanist Garden.
   - Verified Botanist AI Herbal modal opens with rich condition-tailored recommendations.
4. **Visual Evidence Screenshot**:
   - `verified-rpg-hud-reference.png`: Live scene showing the new background, player & pet on the central circular plaza, Botanist NPC at greenhouse, Trail Explorer at cottage, and floating pills.
