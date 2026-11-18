## Follow-up — Cycle 94: Mầm Nhỏ companion onboarding (2026-11-14)

Scope: local Expo React Native Web preview at `390×844`; no production deployment or persistent test submission.

- Added six transparent Mầm Nhỏ states (`idle`, `talk`, `sad`, `wave`, `laugh`, `sulk`), a Reanimated continuous float/breathe and a tap response to mobile onboarding. Local CC0 `mascot-giggle.mp3` and `mascot-grumble.mp3` provide the laugh and sulk reactions. The asset is a 2D animated companion, not the supplied unrigged PLY Gaussian Splat.
- Realm selection now routes through a welcome before one focus selection and optional typed issue. The compact horizontal guide, four choices, note and continue action fit the reference phone viewport without scroll; it returns for explicit World entry and does not infer or alter persistence beyond the selected data.
- First browser pass exposed web `expo-haptics` runtime errors. The onboarding Haptics adapter was made a web no-op, then the complete browser pass was re-run.
- Final browser result: PASS. The scripted route verifies welcome, sprite-load completion, giggle audio fetch, compact discovery controls all inside `390×844`, finale, and zero `pageerror`. Visual captures: `qa-mascot-onboarding.png`, `qa-mascot-quiz.png`, `qa-mascot-finale.png`.

# HealthClues Mobile — Swiss Village scene integration acceptance

**Date:** 2026-11-13  
**Scope:** Local Expo React Native Web preview only; no production deployment or database write.

## Follow-up — Cycle 93: full-screen World and live overview (2026-11-14)

The World tab keeps the established bottom tab bar. Its close camera uses three compact controls only: current region, `Toàn Cảnh`/`Cận Cảnh`, and `8 Vùng`; ambient visitor speech bubbles and extra scene-option pills no longer compete with the map.

The overview is now a live tactical map rather than a static, scrollable map plus station list:

- A full panorama fits above a fixed, non-scrolling legend of seven named landmarks.
- On narrow mobile screens, map pins use numbers `1–7` and the matching numbered legend supplies the full place name; on wider screens the place name also appears directly beside its pin. This preserves the map-to-name relationship without overlapping labels.
- All six simulated visitors remain visible.
- Tapping the overview map or a landmark legend starts movement without leaving overview; the compact player marker updates during the walk.
- Free taps in Sleep Valley are constrained to the paved plaza. Lake, fountain and façade/edge taps are redirected to a safe ground band (`x: 330..1270`, `y: 520..760`), with a circular exclusion around the fountain.

### Three sequential browser rounds

1. **Round 1 — live overview and lake safety:** PASS. At `720×844`, the map exposed all six visitors and all seven named destinations. A lake tap first failed (`y=0.379`); after the safe-ground correction it ended at `y=0.746`, while the player marker moved live and no runtime error occurred.
2. **Round 2 — narrow mobile layout:** PASS. At `390×844`, the existing bottom menu remains visible, overview and its legend fit without scrolling, Talk HUD is absent in overview, and selecting `Đường Mòn Vận Động` moves the player without closing overview.
3. **Round 3 — desktop route sampling and final vision review:** PASS. At `1280×800`, all legend rows fit within the viewport. Samples during lake, fountain and building-edge taps stayed in the safe plaza band; six visitors and seven named landmarks remained visible, with zero browser `pageerror`.

Vision captures: `qa-r1-overview-fixed.png`, `qa-r2-mobile-overview.png`, and `qa-r3-desktop-final.png` in `App/healthclues-mobile/`.

## What changed

- Added `swiss-village-mobile-diorama-v1.png` as the Sleep Valley mobile scene art.
- Kept the existing 1600×900 actor, pet, NPC, landmark, camera, overview and HUD layers in `app/(game)/world.tsx`; the Three.js demo is not embedded.
- Made the already-approved playable Sleep Valley route reachable from the mobile region controls and eight-region map.
- Hid landmark labels until the whole marker is inside the camera frame, avoiding half-cropped pills at the viewport edge.
- Added a Web-safe haptics adapter so map actions do not create unhandled `Haptic.impactAsync` errors in browser preview.

## Round 1 — visual and UX review

Screens reviewed with vision at `390×844` and `1280×800`:

- `qa-swiss-village-round1-mobile.png`
- `qa-swiss-village-round1-desktop.png`

Result: PASS after one correction. The first preview exposed a black scene because the local static preview served HTML at the new image URL. The correct exported PNG was placed at the preview path and the scene was re-captured. A second review found cropped landmark labels at the camera edge; those are now hidden until fully visible. Final captures show a readable mobile HUD, unobscured player/Luna, legible central landmark, and no cropped landmark labels.

## Round 2 — local browser behavior

Chrome local preview at `390×844` passed all assertions:

1. Swiss Village scene is present.
2. Eight-region map opens.
3. Sleep Valley is reachable and returns to the Swiss Village scene.
4. Overview and close view both work.
5. The 2D/2.5D toggle preserves the scene in both directions.
6. Selecting Moonlight Library moves to the landmark and opens the Talk HUD.
7. No browser `pageerror` occurs during the flow.

Checkpoint: `qa-swiss-village-round2-functional.png`.

## Build evidence and limits

- `npx tsc --noEmit`: PASS.
- `npx expo export --platform web --max-workers 1`: PASS; exported bundle includes the new PNG.
- Validation uses browser-local onboarding state and does not submit a check-in, reward, or other persistent action. The isolated preview had no API backend on this run, so unrelated `/api` calls returned local `502`; this does not represent a production/API acceptance.
- This scene uses one authored panorama plus real gameplay layers and depth-sorted actors. It is not a replacement for a future multi-plane, physical-device performance approval.
