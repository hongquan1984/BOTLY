# Swiss Village 3D — Two-Round Acceptance

Date: 2026-11-13

## Fixes

- Added generated assets `glb_public/assets/bg/village_alpine_panorama_v2.png` (continuous lake/Alps hero backdrop) and `glb_public/assets/bg/village_foreground_meadow_v1.png` (top-down grass/shrub/stone meadow plate).
- Split presentation into a DOM 2.5D hero diorama layer plus a WebGL 3D player/camera layer; the 3D village blockout remains available for future asset replacement but is hidden from the visual acceptance presentation.
- Reduced imported building scale to `0.62` and moved the overview camera to an elevated `40° / 56m` civic-plaza composition.
- Repositioned the personal chalet and knowledge hall to the east/west flanks so the central fountain square remains open in the hero view.
- Replaced the floating circular terrace with a rectangular civic plaza and kept the 3D ground layer bounded/faded so the lake/mountain plate remains visible without a hard ground rectangle.
- Promoted the generated hero diorama to the presentation layer for all camera modes; the player/camera/movement remain WebGL 3D over the plate, while the old low-poly building blockout is hidden from the visual acceptance path.
- Removed the rear Alps panorama's 2.5x texture repeat, which caused a visible vertical tile seam from the archway viewpoint.
- Added a wider alpha feather at the lake/forest sector boundary.
- Reworked the mobile HUD into two bounded horizontal rows instead of desktop-style wrapping.
- Reset HUD scroll offsets on resize and after Reset View so the first mobile camera button cannot remain clipped after a desktop-to-mobile viewport change.

## Round 1 — Desktop functional pass

`node scripts/test_village_two_rounds.mjs`

- `window.villageReady === true` after all 10 buildings/props loaded.
- Overview, Archway, Fountain, Overlook and Character camera modes activated.
- Character movement input accepted in Character mode.
- 0 page errors and 0 console errors.

Result: **PASS**

## Visual review

Fresh desktop and mobile captures were inspected after the two rounds. The current composition is a coherent 2.5D village diorama with a true 3D player/camera layer and consistent HUD. The imported chalet GLBs remain stylized/low-poly in the hidden blockout path and require a separate asset replacement pass before claiming fully 3D architectural quality.

## Round 2 — Mobile visual/layout pass

- Viewport: `393x852`.
- Camera/action HUD containers remained inside the viewport.
- Mobile HUD height stayed below the gameplay area threshold.
- Final screenshot: `reports/shots/06_village_mobile_overview.png`.
- 0 page errors and 0 console errors.

Result: **PASS**

## Build

`npm run build` — **PASS** (`vite build`).

This validates the standalone Three.js village demo only; it does not claim production `/play` integration or physical-device performance acceptance.
