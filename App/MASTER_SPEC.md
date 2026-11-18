## Implementation traceability update — 2026-11-17 (Cycle 135: 3 Real Houses Identification & Dynamic Toolkit Library)

- Identified and mapped 3 authentic architectural houses in the 3D Village (`word3d` & `landmarkCatalog.ts`):
  * **🌿 Nhà Thảo Mộc (Tiên Nữ Flora):** Timber apothecary `bld_potion_shop` (`[-11.56, 1.80, 8.91]`) $\rightarrow$ opens `HerbalGardenModal`.
  * **🎵 Nhà Âm Thanh (Tiên Nữ Lyra):** Red-roof timber cottage `bld_bookshop` across stone bridge (`[10.78, 1.80, -11.17]`) $\rightarrow$ opens `SoundGardenModal`. Removed interaction from water wheel `bld_watermill` (restored to non-functional scenic river prop).
  * **🌬️ Thiền Đường - Hơi Thở (Tiên Nữ Aura):** Two-story timber hall `bld_great_hall` (`[-3.31, 1.82, 13.88]`) $\rightarrow$ opens `ZenBreathModal`.
- Implemented Dynamic Toolkit Library & Pick-to-Bag Architecture:
  * Entering each house presents a full catalog/library of healing sounds, breathing exercises, and herbs with preview and practice capabilities.
  * Players click `[ + Lưu Vào Túi Đồ (+10 EXP) ]` / `[ Cất vào Túi ]` to explicitly collect items into their bag (`toolkitStorage.ts`).
  * Túi Đồ (Inventory) starts clean/empty (`[]`) by default, rendering rich Empty States with CTAs to explore the village.
  * Collected items in Túi Đồ feature full interactive players/coaches and `[ ✕ Bỏ Khỏi Túi Đồ ]` buttons.
- Fully verified via automated test `test_verify_3_houses_and_bag_library.mjs` (PASS 100%).

---

## Implementation traceability update — 2026-11-17 (Cycle 131: Healing Toolkit Transformation & Free-Form Habit Input)

- Transformed "Túi Đồ" (Inventory) into a 3-Sanctuary Personal Healing Toolkit (`inventory.tsx`):
  * **Tab 1: 🌿 Nhà Thảo Mộc (Tiên Nữ Flora):** Botanical tea recipes, temperature/steeping guidelines, PubMed clinical citations, and direct `+ Đưa vào Hành Trình` habit bridge.
  * **Tab 2: 🎵 Vườn Âm Thanh (Tiên Nữ Lyra):** Multi-Track Web Audio Engine (`soundscapeEngine.ts`) with 6 offline synthesized ambient tracks (Rain, Stream, Forest Birds, Campfire, Delta 432Hz, Hypnosis Ocean Waves). Allows concurrent multi-track playback, individual volume sliders, sleep timer, and floating master bar.
  * **Tab 3: 🌬️ Thiền Đường - Hơi Thở (Tiên Nữ Aura):** Clinical breathwork & mindfulness catalog (`breathworkData.ts`) with interactive animated breathing circle (Inhale $\rightarrow$ Hold $\rightarrow$ Exhale) and daily habit integration.
- Integrated the 3 village sanctuaries in `world.tsx`:
  * Botanical sanctuary opens Herbal Garden Modal.
  * Sound garden navigates to Toolkit tab Âm Thanh (`inventory?tab=sounds`).
  * Zen Breath sanctuary navigates to Toolkit tab Hơi Thở (`inventory?tab=breath`).
- Simplified Habit Creation form in `journey.tsx`:
  * Removed rigid mechanical constraints ("15 phút định mức", "7 ngày/tuần").
  * Enabled 1-field free-form text input allowing lifestyle habits like "Không uống rượu bia" and quick 1-tap category selection.
- Verified 100% PASS via automated Playwright test suite (`test_verify_toolkit_and_houses.mjs` and `test_verify_simplified_habit_and_hud.mjs`).

---

## Implementation traceability update — 2026-11-16 (Cycle 114: World 3D Cinematic Overview, Floating Lumi Mascot Tour & Pulsing Building Beacons)

- Implemented the official 3D village entry sequence:
  * Camera initializes in high-altitude Overview mode (`overview`), presenting the floating fantasy village in full scenic scope.
  * The top toolbar (`floatingToolbarOverlay`) is hidden to preserve an uncluttered cinematic presentation.
- Developed `VillageCinematicTourModal.tsx` in `src/modules/tour`:
  * Floating Lumi mascot with continuous vertical hover loop (`Animated.loop`, -10px, 1.4s).
  * 7 sequential narrative stops: Overview $\rightarrow$ Ngôi Nhà Của Bạn $\rightarrow$ Nhà Thảo Mộc $\rightarrow$ Nhà Cơ Thể $\rightarrow$ Văn Phòng Giải Mã $\rightarrow$ Quảng Trường & Giếng Ước $\rightarrow$ Sẵn Sàng Khám Phá.
  * Bidirectional synchronization with Three.js via `HIGHLIGHT_LANDMARK` postMessage.
- Upgraded `SmartLandmarkOverlay.tsx` with dynamic glowing beacons (`@keyframes pulseGlowBeacon` and `@keyframes pulseBeaconRing`) that pulse when a building is introduced.
- Renamed "Phá Án" to **"Giải Mã"** across all user-facing UI, accessibility labels, and dialogues.
- Added replay button `[ ✨ Tour ]` on the primary toolbar to allow players to re-experience the village overview tour at any time.
- De-conflicted with legacy spotlight tour via `cinematicTourDone` guard in `(game)\_layout.tsx`.
- Verified 100% PASS via Playwright automated browser test on port 8081. Evidence: `App/reports/V1_CYCLE_114_CINEMATIC_OVERVIEW_TOUR.md`.

---

## Implementation traceability update — 2026-11-15 (Cycle 111: Master Narrative & 3-Video Cinematic Onboarding V1)

- Integrated the official narrative lore: A normal human accidentally crosses a radiant dimensional portal in the clouds into "Xứ Sở Sức Khỏe" (HealthClues Realm) and meets Lumi, a winged rabbit companion prophesied by The Seer.
- Built the Three-Video Onboarding Shell (`IntroStoryPlayer.tsx`) triggered immediately after language selection on Welcome:
  * Video 1: "Cánh Cổng Bí Ẩn" (The Mystery Portal).
  * Video 2: "Người Bạn Đã Chờ Đợi" (The Awaited Friend - Lumi).
  * Video 3: "Xứ Sở Sức Khỏe" (The Cloud Floating Village Realm).
- Implemented a resilient dual-tier engine: plays native/web MP4 video when present and falls back gracefully to custom Ghibli-style high-resolution storyboard art (`story_poster_1_portal.jpg`, `story_poster_2_lumi.jpg`, `story_poster_3_realm.jpg`) with zero blank screens or broken layout bugs.
- Preserved strict player agency: scenes never auto-advance; player controls playback with "Phát / Dừng", progresses via "Tiếp tục →", or skips via "Bỏ qua câu chuyện".
- Wove Lumi's narrative framing throughout the Quiz steps (`quest_choice`, `discovery`, `plan`, `mascot_ready`), preserving 100% of underlying schemas, risk factors, AI logic, and Supabase auth.
- Persisted story state in AsyncStorage (`healthclues_story_state_v1`) to prevent re-forcing on returning users while adding permanent "Xem lại cốt truyện mở đầu" replay options in Profile settings and the Lumi Mascot menu.

## Implementation traceability update — 2026-11-15 (Cycle 106: Cozy Fantasy 3D World Integration & Dual-Mode Presentation)

- Integrated the Three.js Cozy Fantasy Village 3D world from `D:\botly\App\word3d` into HealthClues Mobile (`app/(game)/world.tsx`) via standalone player runtime `PlayerApp.tsx` (`?mode=player`).
- Maintained a clean presentation layer: zero editor components, zero debug counters, mobile-friendly orbit/pinch touch controls, animated waterfall/watermill, and rigged 3D humanoid character.
- Created the 5-member fairy NPC family (`Flora`, `Aura`, `Lyra`, `Mira`, `Nova`) and Lumi floating companion with hovering animations and proximity responsiveness.
- Established a bidirectional postMessage communication bridge to trigger native HealthClues features (Herbal sheet, 4-7-8 Breathing, Body Detective modal, Daily Care check-in, Quests).
- Preserved pristine 2D Swiss Village baseline with unblurred photographic panorama and human RPG sprites, providing an instant subheader toggle button (`3D Làng Nổi` / `2D Làng Núi`) with zero state loss and zero re-renders.

## Implementation traceability update — 2026-11-14 (Cycle 104: Crisp Swiss Village Texture Synthesis, Zero-Smudge 2.5D Lake/Mountain Diorama & Strict Collision De-confliction)

- Replaced biharmonic inpainting blur with Texture-Preserving Patch Synthesis on `swiss-village-mobile-diorama-v1.png`, eliminating all gray smudge blemishes across cobblestones and chalets (gradient 10.44 - 13.43).
- Separated pristine alpine turquoise lake and snow-capped mountain vista into `swiss-village-lake-bg.webp` (2200x1050), exposed through an anti-aliased alpha transparency window for 2.5D parallax.
- De-conflicted all 7 landmark stations and 6 living visitors in `world.tsx` and `useLivingVillageVisitors.ts`, achieving mathematical zero-overlap (closest pair > 75px) and eliminating unwanted station talk popups on initial screen load.
- Verified via 2-round AI-Vision audit across Mobile Portrait (390x844) and Landscape/Desktop (1024x507 & 1280x800) with 0 page errors and 0.00% black void ratio.

## Implementation traceability update — 2026-11-14 (Cycle 98: Mobile Game FTUE — Full-Screen Dark Scrim Spotlight, Anti-Overlap Layout, Glowing Focus Frames & Mascot Lifecycle)

- Implemented a full-screen dark scrim spotlight system (`darkBackdrop`: `rgba(3, 10, 8, 0.74)` with backdrop blur) replacing cluttered floating cards and preventing overlapping card messes (`InteractiveTourCard.tsx`).
- Created dynamic glowing focus frames (`#fbbf24`), animated pulse, radar crosshairs, directional pointer arrows (`▲`/`▼`), and contextual labels (`✨ ĐANG FOCUS: NHẬT KÝ 7 NGÀY`, `TỰ LẬP MỤC TIÊU`, `ĐÓNG DẤU NHẬN XU`, `BIỆT THỰ GỖ 3D CHALET`, `PHÁ ÁN KIẾM XU`).
- Structured a granular interactive sub-step progression through World, Journey (7-day streak & + Thêm Mới), Daily Care (check-in seals), Home (Golden Key & 3D Chalet lore), and World (Phá Án button & doctorless lore).
- Strictly de-conflicted `PermanentMascotHelper`: unmounted during the active tour (`{!tourStep && <PermanentMascotHelper />}`) and mounted at `bottom: 74, left: 14` only after tour completion or skip.
- Verified across 12 sequential Playwright AI Vision audit steps with 0 page errors and 100% PASS rate. Evidence: `App/reports/V1_MOBILE_MASCOT_DETECTIVE_HOME3D_ACCEPTANCE.md`.

## Implementation traceability update — 2026-11-14 (Cycle 97: Authentic Sprout Sprites, Glowing Tab Spotlight Tour, Helper Drawer & Full D:\botly\App\gametrinhtham WebView Integration)

- Integrated authentic pre-generated Sprout Rabbit sprites (`healthclues-sprout-rabbit-{idle,talk,sad,wave,laugh,sulk}.png`) from the welcome screen through onboarding and celebration modals with breathing pulse and dolphin audio.
- Implemented an interactive spotlight walkthrough where each introduced menu tab glows with golden borders, neon effects, and sparkle badges (`_layout.tsx`, `villageTourService.ts`, `InteractiveTourCard.tsx`).
- Pinned a permanent mascot helper button at bottom-left (`PermanentMascotHelper.tsx`) with a contextual guidance drawer.
- Embedded the authentic `D:\botly\App\gametrinhtham` detective package via full-screen `DetectiveWebViewModal.tsx` on `http://localhost:3329/detective`, supporting 6 medical cases, SVG scan hotspots, clue notebook, deduction board, and bidirectional coin sync.
- Replaced all "Thụy Sĩ" / "Alps" naming with "Làng Sống Khỏe (Wellness Village)".
- Verified across 18 automated Playwright AI Vision audit steps with 0 page errors. Evidence: `App/reports/V1_MOBILE_MASCOT_DETECTIVE_HOME3D_ACCEPTANCE.md`.

## Implementation traceability update — 2026-11-14 (Cycle 95: Mascot Guide, Unified Economy, Body Detective & 3D Chalet Shop)

- Synchronized mascot Mầm Nhỏ with float/breathe micro-animations and Web Audio API dolphin chirps/whistles (`src/modules/audio/dolphinAudio.ts`, `MascotSprout.tsx`).
- Standardized 5-step Village tutorial modal without robotic "AI" talk, guiding the player through personalized recommendations, Journey, Daily Care, House Gift celebration popup (`HouseGiftCelebration.tsx`), and Body Detective lore.
- Integrated Body Detective launcher into World HUD with high-contrast glowing pills (`world.tsx`, `DetectiveMobileLauncher.tsx`), scene clues inspection, diagnosis deduction, and 120–150 Xu payout.
- Embedded Three.js 3D Chalet into Tab Ngôi Nhà with 5-room perspective switcher and an in-game furniture catalog shop using Xu Coins.
- Integrated 3D humanoid avatar with skeletal walk cycle into 3D Wellness Village (`3DHOME/src/world/PlayerController.ts`, `village.ts`).
- Verified across 2 full AI Vision audit rounds with 0 page errors and thumb-friendly touch targets (`44x44px`). Evidence: `App/reports/V1_MOBILE_MASCOT_DETECTIVE_HOME3D_ACCEPTANCE.md`.

## Implementation traceability update — 2026-11-14 (Cycle 94: Mobile companion onboarding)

- Selecting the already-playable HealthClues Realm now leads first to a concise Mầm Nhỏ companion welcome, then one explicit focus choice with an optional free-text issue, and a final companion confirmation before entering the existing World.
- The companion is visual/on-device presentation only: it neither collects additional health data nor modifies canonical discovery IDs, selected goals, onboarding completion, region availability, APIs, authorization, schema or rewards. Lumi remains the in-World companion for HealthClues Realm.
- The mobile guide offers a decorative float/breathe loop and optional laugh, sad and sulk tap reactions with local CC0 effects; it does not present health advice, diagnosis or treatment. Browser evidence remains local only; physical-device review is still open.

## Implementation traceability update — 2026-11-14 (Cycle 93: Full-screen mobile World and live tactical overview)

- The Mobile World tab preserves its established bottom tab bar. The overview keeps the 1600×900 scene interactive: player marker movement, six visitors and seven named landmarks remain visible and tappable without a scrollable station list.
- Sleep Valley tap-to-walk is presentation-bounded to the Swiss Village paved plaza and excludes the lake/fountain/building edge. This is a client scene/navigation presentation constraint only; no server progression, schema, reward or authorization behavior changes.
- Three local Chrome rounds passed at `720×844`, `390×844` and `1280×800`; evidence and known local-only limits are in `App/reports/V1_MOBILE_SWISS_VILLAGE_INTEGRATION_ACCEPTANCE.md`.

## Implementation traceability update — 2026-11-14 (Cycle 102: Photorealistic Alpine Village Square, Separated 2.5D Parallax Horizon, 3D CGI Adventurer Walk Cycle & Harmonious NPC Sizing)

- `App/healthclues-mobile/app/(game)/world.tsx` separates Sleep Valley into 2 distinct layers for true 2.5D diorama parallax: horizon background (`swiss-village-lake-bg.webp`) with mountains and turquoise lake, and foreground diorama (`swiss-village-mobile-diorama-v1.png`) with aged timber chalets, red geranium window boxes, cobblestone dorfplatz plaza, and transparent alpha cutout on the lake/sky window. Zero flags of any country exist in the scene.
- Integrates mature volumetric 3D CGI adventurer walk cycle (`player-human-idle.png`, `player-human-walk{1,2,3}.png`) with realistic lighting, linen tunic, blue cape, satchel, and boots.
- Standardizes all NPCs (Anna, Ben, Mia, Nhà Thám Hiểm Trail) to 48x76px (matching the player's 76px height) with ground contact drop shadows and balanced `getWorldDepthScale` perspective scale (0.92x to 1.08x).
- Verified via Playwright automation captures (`01_world_photorealistic_scene.png` through `06_parallax_panned.png` in `photorealistic_25d_audit/`), TypeScript zero errors, and clean Expo web export.

## Implementation traceability update — 2026-11-13 (Cycle 92: Mobile Swiss Village scene integration)

- `App/healthclues-mobile/app/(game)/world.tsx` now renders a dedicated Swiss Village panorama for Sleep Valley while retaining the current 1600×900 gameplay coordinate system, player/Luna/NPC/landmark layers, HUD, camera and overview. The standalone 3DHOME demo is not part of the mobile runtime.
- The two product-approved playable destinations remain Sleep Valley/Luna and HealthClues Realm/Lumi. This change is presentation-only: no new World/region schema, API, authorization, progression or reward write path was added.
- Local evidence is in `App/reports/V1_MOBILE_SWISS_VILLAGE_INTEGRATION_ACCEPTANCE.md`: TypeScript and Expo web export pass; visual review at mobile/desktop and functional browser Round 2 pass. This is not a physical-device or production acceptance.

## Implementation traceability update — 2026-11-12 (Cycle 87: Condition-Specific Advisor Coverage & RPG Game Audio System)

- Updated `src/app/api/healthclues/wellness-advisor/route.ts` and `App/healthclues-mobile/src/services/onboarding.ts` so Gout (`gút / axit uric cao`), Weight Management, Blood Pressure, Digestion, and Migraine produce condition-tailored habits ordered by selected Step 2 factors instead of falling back to generic digestion/hydration copy.
- Added cross-platform RPG game audio (`expo-av` for Native iOS/Android + Web Audio API for instant Web button clicks/chimes/BGM) in `src/services/gameAudio.ts` with 8 bundled WAV assets (`assets/audio/`), global tap/tab/seal/success SFX wiring (`app/_layout.tsx`, `app/(game)/_layout.tsx`, `daily-care.tsx`, `quiz.tsx`), `TopHud` quick toggle, and `Cá Nhân` track picker modal (`profile.tsx`).
- Verified via `npx tsc --noEmit` (`exit 0`), isolated server `3329` rebuild (`exit 0`), `npx expo export --platform web --clear` (`exit 0`), Chrome CDP `scripts/run-full-ux-player-acceptance.mjs` (`exit 0`, asserting Gout purine/uric recommendations and BGM persistence across reload), and visual inspection of `onboarding-03-gout-plan-390x844.png`, `profile-03-audio-modal-390x844.png`, and `profile-01-settings-390x844.png`.

## Implementation traceability update — 2026-11-12 (Cycle 86: Mobile Adaptive Onboarding, `/api/healthclues/wellness-advisor` Integration & Interactive Habit Selection)

- Replaced static mobile quiz questions and hardcoded 3-habit preview in `App/healthclues-mobile/app/(onboarding)/quiz.tsx` with Web-aligned `src/services/onboarding.ts`, supporting multi-concern & free-text issue entry, `POST /api/healthclues/wellness-advisor` personalization (with concern-specific offline fallback), Option A/B/Custom per-card choices, inline custom habit creation, local persistence (`useWorld.ts` guard against stale server overwrites), and in-game AI re-suggestions in `app/(game)/journey.tsx`.
- Verified via `npx tsc --noEmit` (`exit 0`), `npx expo export --platform web --clear` (`exit 0`), Chrome CDP `scripts/run-full-ux-player-acceptance.mjs` (`exit 0`, including `TEST F` dynamic habits & `95 EXP` cross-tab sync), and visual review of `onboarding-01-discovery-custom-390x844.png`, `onboarding-02-ai-plan-390x844.png`, `daily-care-01-checked-390x844.png`, and `journey-01-habits-390x844.png`.

## Implementation traceability update — 2026-11-12 (Cycle 85: Mobile Notification Scheduling, Profile Reminder Settings UI & `/api/healthclues/reminders` Sync)

- Integrated `expo-notifications` (`~0.29.14`) into `App/healthclues-mobile` (`package.json`, `app.json`, `src/services/reminders.ts`, `app/_layout.tsx`, `app/(game)/profile.tsx`) for opt-in daily (`DAILY`), weekday (`WEEKLY` Mon–Fri), and weekly (`WEEKLY` Mon) local reminders with Android notification channel (`daily-habits`), notification response deep-linking to `/(game)/daily-care`, `AsyncStorage` persistence (`healthclues-reminder-settings`), authenticated `/api/healthclues/reminders` GET/POST sync, and safe Web preview fallback (`window.Notification` / inline message).
- Verified via `npx tsc --noEmit` (`exit 0`), `npx expo export --platform web --clear` (`exit 0`), Chrome CDP `scripts/run-full-ux-player-acceptance.mjs` (`exit 0`, including `Page.reload` persistence), and visual inspection of `profile-01-settings-390x844.png` and `profile-02-reminder-modal-390x844.png`.

## Implementation traceability update — 2026-11-12 (Cycle 84: RPG Redesign of `daily-care.tsx` & `journey.tsx` — Verified 3 Rounds)

- Rebuilt `App/healthclues-mobile/app/(game)/daily-care.tsx` from 3-button multi-row checklist cards into an Alpine wooden-gold RPG Quest Board with 1-tap right-edge Check Seals (`tick-quest-*`), inline `(i)` medical evidence drawers, SVG rune idle rings, and 1-screen confirmation CTA fitting cleanly above the bottom tab bar on `360x800` and `390x844`.
- Rebuilt `App/healthclues-mobile/app/(game)/journey.tsx` with brass-cornered Lumi signboard, SVG cubic S-curve 7-day rune trail (`buildSmoothTrailPath`), compact `+EXP` medallion charters, and auto-expanding `Đã Lưu Xem Sau` wooden drawer.
- Verified across 3 full build + Chrome CDP (`scripts/run-full-ux-player-acceptance.mjs`) + visual inspection rounds (all exiting `0`, `dist-web` bundle `entry-38a62ed47962dcb3ff63720cd89bbc53.js`).

## Implementation traceability update — 2026-11-12 (Cycle 83: Self-Audit UX & Functional Hardening Across World, Home, Care, Journey, Inventory & Profile)

- Added real-time cross-tab `WORLD_STATE_EVENT` / `LOCALE_CHANGE_EVENT` syncing (`useWorld.ts`, `localization/index.ts`, `_layout.tsx`), extended Library stairs waypoint (`navigation.ts`) + `pendingLandmarkRef` + `open-station-sheet` + `boss` 2-option trivia + `floatingWorldToast` (`world.tsx`), and replaced broken Web multi-button `Alert.alert` confirmation/validation dialogs with cross-platform modals/inline validation (`profile.tsx`, `journey.tsx`).
- Hardened mobile ergonomics across viewports with scrollable `90%–92%` max-height modal wrappers (`home.tsx`, `world.tsx`, `inventory.tsx`, `CheckinCelebrationModal.tsx`, `RewardReveal.tsx`), `numberOfLines={2}` equipped slot titles (`inventory.tsx`), CTA bottom margin (`daily-care.tsx`), and expanded Chrome CDP assertions in `scripts/run-full-ux-player-acceptance.mjs` (ALL PASS, exit 0).

## Implementation traceability update — 2026-11-11 (Cycle 82: World Bottom Black-Gap Elimination, Visual-Center Camera & Clean Top-Left Map HUD)

- Updated `App/healthclues-mobile/app/(game)/world.tsx` and `App/healthclues-mobile/app/_layout.tsx` to remove `vScrollContent.paddingBottom: 76` / `extraBottomPad`, introduce uniform `coverScale` + ratio-scaled `handleMapPress`, recenter `centerCameraOn` on sprite midpoint `(targetY - 18)` (`ratioY = 0.50` / `0.45` with `activeTalkLandmark` on `<420px`), decouple `playerPosRef` from `setPlayerPos` tick side-effects, restore scroll on `useFocusEffect`, remove `floatingZonePill`, and split root Web CSS lock cleanly in `_layout.tsx`.
- Verified end-to-end via `scripts/run-full-ux-player-acceptance.mjs` (CDP exit 0, asserting zero bottom gap `<=1px` on all 6 viewports and `<=16px` center alignment in `world-09-landscape-centered-640x360.png`).

## Implementation traceability update — 2026-11-11 (Cycle 81: Mobile Game UI Floating World HUD & Anti-Occlusion Camera Framing)

- Refactored `App/healthclues-mobile/app/(game)/world.tsx` and `App/healthclues-mobile/app/_layout.tsx` to align HealthClues Mobile RPG viewport hierarchy with mobile-first HUD ergonomics across portrait (`360px`–`430px`), tablet (`768px`), landscape (`640x360`), and desktop (`1280x800`) bounds without modifying health-logic rules or Overworld state.
- Replaced solid exploration header chrome with `styles.floatingToolbarOverlay` (`mode === "exploration"`), added measured `handleViewportLayout` (`vpSize`) with `0.36`/`0.44` vertical camera centering + `vScrollContent.paddingBottom: 76`, hid duplicate `floatingZonePill` during active talk/overview, redesigned `activeTalkFloatingHud` into a dismissible (`dismiss-talk-hud`) single-row capsule, and added `hc-hide-web-scrollbars` CSS in `_layout.tsx`.
- Browser-verified end-to-end via `scripts/run-full-ux-player-acceptance.mjs` (CDP exit 0, including strict `640x360` avatar-vs-HUD bounding-box check `world-08-landscape-talk-hud-640x360.png`).

## Implementation traceability update — 2026-11-11 (Cycle 80: Mobile-First Interactive 2.5D Parallax Depth Hook)

- Implemented `App/healthclues-mobile/src/hooks/useMobileHomeParallax.ts` (`getChaletItemDepthFactor`, `getChaletFloorDepthFactor`, `handleScroll`, `beginWebDrag`, `cycleStrength`, on-demand `requestAnimationFrame` interpolation with zero idle drift) and connected it across `bgOverscanLayer`, furniture boxes, Chibi GPU transform wrapper, and `parallax-toggle` in `App/healthclues-mobile/app/(game)/home.tsx`.
- Added strict idle stillness (`<= 0.5px`), multi-plane drag depth separation (`sofaDelta > bgDelta + 8`), and `360x800` `topHud360Audit` checks to `scripts/run-full-ux-player-acceptance.mjs` (ALL PASS).

---

## Implementation traceability update — 2026-11-11 (Cycle 78: 2.5D Companion Perspective Depth Scaling & Outdoor Balcony Walkways)

- Added `getCompanionDepthScale(yPct, room)` and `buildHomeWalkWaypoints(from, to, room)` in `App/healthclues-mobile/src/hooks/useWellnessHome.ts`, expanding Living Room walkable bounds into the center lakeside balcony terrace (`x: 42.5..57.5, y: 56.8..62.4`) and routing cross-threshold paths cleanly through the open glass sliding doors.
- Updated `App/healthclues-mobile/app/(game)/home.tsx` to size Chibi cleanly at `0.095 * stageHeight` (capped `72px`), compute depth-scaled feet-anchored dimensions, drop `zIndex` behind foreground furniture (`500 < 734`) outdoors, walk queued doorway waypoints smoothly, and verified perspective shrinking + balcony stroll (`home-10-balcony-perspective-390x844.png`) via `scripts/run-full-ux-player-acceptance.mjs`.

---

## Implementation traceability update — 2026-11-11 (Cycle 77: Slim Bottom Menu Height Optimization & Landscape Compact Chrome)

- Updated `App/healthclues-mobile/app/(game)/_layout.tsx` and `App/healthclues-mobile/src/components/common/TopHud.tsx` to adapt chrome height dynamically with `useSafeAreaInsets()` and `useWindowDimensions()` (`58px` base portrait/desktop tab bar down from `76px`; `40px` `beside-icon` tab bar and slim `4px` `TopHud` vertical padding on viewports with `height < 520`).
- Streamlined the Home floating dock in `App/healthclues-mobile/app/(game)/home.tsx` (`36px` item strip, `4.5px` vertical dock padding, auto-collapse tray for `screenHeight < 480`, native web scrollbar hiding when width fits), adding vertical label bounds + `640x360` landscape checks in `scripts/run-full-ux-player-acceptance.mjs` (ALL PASS).

---

## Implementation traceability update — 2026-11-11 (Cycle 76: Full-Screen Wellness Home Stage, Compact Bottom Dock & Zero-Clip Responsive Polish)

- Refactored `App/healthclues-mobile/app/(game)/home.tsx` from a dashboard-style vertical `ScrollView` into a true full-screen `stageViewport` (`flex: 1` `cover`-scaled 16:9 panoramic room with horizontal touch panning and optional `Toàn cảnh` overview toggle), pinning lightweight HUD pills at the top corners and a collapsible compact glass dock (`Phòng Khách | Phòng Ngủ`, `Đã nhận (X)`, `Kho (10)`, `Chibi`) neatly above the 6-tab bottom bar.
- Clamped walkable floor max Y bounds (`82` Living Room / `80` Bedroom) in `App/healthclues-mobile/src/hooks/useWellnessHome.ts` so autonomous/tap-to-walk Chibi paths remain cleanly visible above the bottom floating dock, anchored initial Chibi spawn at `{ x: 60, y: 77 }` with centered camera (`51%` Living Room, `50%` Bedroom), cleaned `chibi-lily.png` (`100x127`), and expanded `scripts/run-full-ux-player-acceptance.mjs` with full-screen geometry (`homeGeo`), `chibiVisible`, and `360x800` `dock360Audit` assertions.

---

## Implementation traceability update — 2026-11-11 (Cycle 75: Wellness Home Mobile Tab, Chalet Feature Parity & 3-Round Player Acceptance)

- Added the **`Ngôi Nhà` (`Home`)** bottom navigation tab in `App/healthclues-mobile/app/(game)/_layout.tsx` (`Home` icon, zero-clip 6-tab sizing down to `360x800`, localized `nav.home` in `vi.ts`/`en.ts`).
- Implemented the **Swiss Chalet Wellness Home** experience in `App/healthclues-mobile/app/(game)/home.tsx` and `App/healthclues-mobile/src/hooks/useWellnessHome.ts` with canonical 10-item Living Room & Bedroom furniture catalog, Welcome Gift (`sofa_luxury`), Pick 1-of-2 Daily Reward priority logic (`LIVING_PRIORITY` / `BEDROOM_PRIORITY`), `auto`/`day`/`night` backdrop switching, 5 autonomous/tap-to-walk Chibi companions constrained to trapezoid floor bounds, reset flow, stage zoom (`Phóng to`/`Vừa khung`), and `AsyncStorage` persistence (`healthclues-home-state-v1`) syncing with `/api/healthclues/wellness-home` only when `isAuthenticated === true` (preventing local proxy `player@botly.vn` fallback state leakage into guest sessions).
- Distinguished remaining Web-exclusive authoring/visual extras in `src/components/healthclues/HealthCluesWellnessHome.tsx` (`matrix3d` 4-corner perspective homography, server-saved admin canvas `walkableMasks` + admin CRUD editor, and experimental parallax controls) from the mobile runtime feature set.
- Browser-verified end-to-end across 3 Chrome CDP test-and-fix rounds in `scripts/run-full-ux-player-acceptance.mjs` and documented in `App/reports/mobile-ux-acceptance/MOBILE_UX_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-10 (Cycle 73: Real-Player Re-Audit — Responsive Camera Framing, Cross-Platform Walk, Duplicate-EXP Guard & Journey Active/Saved Separation)

- **Responsive World & Overview Scaling (`healthclues-mobile/app/(game)/world.tsx`)**: Replaced static `Dimensions.get("window")` with `useWindowDimensions()`, fixed Web synthetic coordinate extraction in `handleMapPress`, fitted all 4 toolbar buttons cleanly in `>=360px` viewports, repositioned `camp` (`x: 280, y: 465`) and `library` (`y: 256`), and scaled overview minimap pins dynamically with a 7-station quick jump list.
- **Confirmed EXP Parity & Duplicate Guard (`healthclues-mobile/src/hooks/useWorld.ts`, `app/(game)/daily-care.tsx`)**: `submitHabitCheckin` awards exact completed quest EXP (`10 + 15 + 10 = +35 EXP`), sets `alreadySubmitted` to prevent duplicate EXP inflation on re-saves, and synchronizes UI feedback.
- **Journey 7-Day Timeline & Active/Saved Split (`healthclues-mobile/app/(game)/journey.tsx`)**: Added read-only 7-day timeline strip above goals, implemented `toggleGoalStatus` (`active` vs `saved_for_later`), replaced fixed volume `cốc (300ml)` with `cốc ấm`.
- **Clean Player Copy (`healthclues-mobile/app/(game)/profile.tsx`)**: Removed developer jargon `"RLS"` from legal notice.

---

## Implementation traceability update — 2026-11-10 (Cycle 72: Mobile UI/UX Redesign & Real Player Acceptance — World Clean RPG, Daily Quest Board & Inventory Separation)

- **World RPG Screen Clean Visuals (`healthclues-mobile/app/(game)/world.tsx`)**: Removed developer X/Y coordinates and 100% of yellow debug trail dots. Repositioned player spawn to cobblestone ground `(430, 660)` next to Trail Explorer NPC, eliminating the rooftop/awning clipping bug. Replaced unverified 35% gout clinical claim on the botanical landmark with lifestyle nutrition lore.
- **Daily Care RPG Quest Board (`healthclues-mobile/app/(game)/daily-care.tsx`)**: Transformed into "Bảng Nhiệm Vụ Hôm Nay" with a 3-day streak badge, emerald progress bar (`3/3 Nhiệm vụ`), and maximum EXP indicator. Compact quest cards feature personalized, safe hydration ("Duy Trì Uống Đủ Nước Hàng Ngày"), antioxidant nutrition, and joint-friendly movement. Medical citations are hidden in an expandable drawer. Check-in submission triggers a 5-star celebration modal with Lumi companion feedback.
- **Inventory & Knowledge Separation (`healthclues-mobile/app/(game)/inventory.tsx`)**: Re-architected into two isolated tabs: `[Vật Phẩm & Trang Bị (3)]` for equippable quest items and `[Sổ Tay Tri Thức (4)]` for medical exploration lorebooks without equip buttons. Top 3 equipment slots display active items with unambiguous "Đang trang bị tại Ô X" and "Tháo Khỏi Ô X" actions.
- **Health Content Safety Boundary**: Disallowed hardcoded 2000ml water targets, mandatory daily herbal supplements, and unverified clinical therapeutic claims.
- **Real Player Acceptance Across 5 Viewports**: Automated CDP acceptance test script `run-full-ux-player-acceptance.mjs` verified 360x800, 390x844, 430x932, 768x1024, and 1280x800 viewports with 100% PASS rate. Detailed evidence report at `App/reports/mobile-ux-acceptance/MOBILE_UX_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-10 (Cycle 66: Mobile Habits System, Add Habit Modal, Daily Check-in 5-Star HUD & Auth Session Resilience)

- **Mobile Wellness Habits Parity (`healthclues-mobile/app/(game)/journey.tsx`, `daily-care.tsx`, `inventory.tsx`)**: Aligned mobile gameplay 100% with Web Game `/play` architecture (`DailyCheckinDialog.tsx` & `daily-care-domain.ts`). Converted daily care from tool slot equipment to true medical wellness habit management (Active Goals).
- **Add Habit Interactive Modal with Lumi Mascot**: Integrated the "➕ Thêm Thói Quen" flow in Journey (`journey.tsx`), allowing players to choose from 5 verified medical habit presets or input custom routines (+20 EXP).
- **Daily Care Real-time 5-Star Rating HUD (`daily-care.tsx`)**: Check-in directly marks active habits as [Done], [Not yet], or [Skipped], dynamically updating the 1-5 Star Rating HUD via `calculateStars`, with personal reflection input and EXP reward.
- **Single-Line 3D Gold CTA Button (`healthclues-mobile/app/(onboarding)/quiz.tsx`)**: Redesigned quiz entry button "VÀO VƯƠNG QUỐC HEALTHCLUES (+50 EXP)" with gold border `#fde047`, single-line layout (`numberOfLines={1}`), and elevated 3D shadow.
- **Authentication Session Resilience (`services/auth.ts`, `services/api.ts`, `serve-mobile.mjs`)**: Eliminated red 401 session expired errors using automatic Supabase token caching and offline-first AsyncStorage fallback.
- **Two-Tester Automated Verification (8/8 PASS)**: Automated Chrome CDP loop verified all 8 functional test cases and 8 visual artifacts.

---

## Implementation traceability update — 2026-11-09 (Cycle 64: Mobile Welcome & Quiz Web Parity, Realm Default & Two-Tester Automated Loop)

- **Mobile Welcome Screen Replica & Navigation Guard (`healthclues-mobile/app/(onboarding)/quiz.tsx`, `app/(game)/_layout.tsx`)**: Replicated 100% of the Web Game `/play` welcome screen aesthetics (widescreen RPG background, gold compass crest, bilingual pill, 3D Gold action CTA). Enforced a strict navigation guard: non-onboarded players are automatically redirected to the quiz before entering any game route.
- **HealthClues Realm Default & Sleep Valley Lock Guard (`healthclues-mobile/app/(game)/world.tsx`)**: Set HealthClues Realm as the default active region paired with the Lumi Fox companion (`lumi_fox_clean.png`) starting at Central Camp `[320, 540]`. Temporarily locked Sleep Valley with an amber lock pill and user-friendly toast notice.
- **Landmark Pin Visual Hierarchy Optimization**: Redesigned landmark anchors with a spacious 120x64px centered container, 36x36px golden-bordered crests, and dark frosted rounded plaques, preventing text truncation or awkward single-word wrapping.
- **Automated Two-Tester Quality & Vision Loop (8/8 PASS)**: Executed headless Chrome CDP verification across mobile viewport (390x844 @2x), generating comprehensive visual proof (`vision-01` to `vision-08`) in `App/reports/TWO_TESTER_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-09 (Cycle 62: HealthClues Mobile RPG Visual Engine & Quiz Onboarding Integration)

- **Mobile RPG Visual Engine & Web Scene Blueprint Parity (`healthclues-mobile/app/(game)/world.tsx`)**: Replaced constrained card layout with an expansive 16:9 widescreen canvas operating on 1600x900 scene blueprints copied directly from the web game (`sleep-valley-scene-blueprint.webp` and `healthclues-realm-scene-blueprint.webp`).
- **Real-Time Tap-to-Walk Movement Loop & Floating Coordinates HUD**: Implemented a 16ms delta-time movement tick loop executing at 60 FPS, with directional sprite flipping (`scaleX: -1 / 1`), Luna companion floating animation, and a real-time HUD displaying exact coordinates `X, Y`, current zone name, and waypoint destination.
- **Interactive Proximity & Active Talk HUD**: Dynamically tracks player distance to landmarks and living NPCs (Trail Explorer, Botanist); approaching within 75px triggers a bottom slide-up Active Talk HUD with character portrait, role badge, medical advice quote, and action trigger.
- **Onboarding Health Quiz Flow (`healthclues-mobile/app/(onboarding)/quiz.tsx`)**: Developed a 4-step interactive quiz guiding players from avatar greeting -> region selection -> adaptive questions -> evidence-backed wellness plan -> +50 EXP and RPG world entry.
- **Dual-Tester Independent Automated Verification (10/10 PASS)**: Conducted automated end-to-end tests via Chrome DevTools Protocol across mobile viewport (390x844 @2x), generating comprehensive visual proof captured in `App/reports/TWO_TESTER_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-09 (Cycle 60: Resilient Furniture Image Upload & Dynamic Serving Engine)

- **Dynamic Image Serving & In-Memory Storage Engine (`src/lib/wellness-home-image-store.ts`, `src/app/api/healthclues/wellness-home/file/route.ts`)**: Resolved Vercel Serverless read-only filesystem errors (`EROFS`) and Next.js standalone dynamic static file 404s by routing uploaded furniture images through a dynamic endpoint `/api/healthclues/wellness-home/file?name=...` powered by global in-memory caching and `/tmp` fallback storage.
- **Resilient Upload API (`/api/healthclues/wellness-home/upload` & `/api/upload`)**: Supports both `multipart/form-data` and JSON `dataUrl` payloads, returning safe, sanitized filenames under 255 characters to strictly satisfy Supabase `VARCHAR(255)` schema boundaries.
- **Direct Drag & Drop Stage Placement (`src/app/admin/healthclues-home/page.tsx`)**: Administrators can drag and drop PNG/JPG/WebP files directly onto the 16:9 stage canvas; the editor automatically detects natural image dimensions, calculates drop coordinates, creates a new catalog item, and renders an instant zero-latency Data URL preview.
- **Sidebar Quick Upload Card**: Added an explicit upload box at the top of the sidebar item list, enabling quick one-click uploads even when no item was previously selected.

---

## Implementation traceability update — 2026-11-09 (Cycle 59: Swiss Chalet Walkable NavMesh Painter & Journey Header Real Estate)

- **Swiss Chalet Walkable NavMesh Painter Tool (`/admin/healthclues-home`)**: Developed an interactive collision/NavMesh mask painter in the furniture studio (`src/components/healthclues/wellnessHomeWalkable.ts`, `src/app/admin/healthclues-home/page.tsx`). Enables administrators to paint walkable zones with a semi-transparent green brush, erase obstacle areas (e.g. fireplace, sofa, walls), auto-apply standard room floor polygons, test walkability live with Chibi Anna, and save mask data to the server (`/api/healthclues/wellness-home`).
- **In-Game Walkable Movement Constraints (`HealthCluesWellnessHome.tsx`)**: In the in-game Swiss Chalet, character patrol paths and user tap-to-move destinations check the walkable binary mask via `isPointWalkable`, preventing Anna from walking on top of furniture, walls, or fireplaces.
- **Ultra-Compact Journey Modal Header (`WorldAdventureScene.tsx`, `world-adventure.css`)**: Slimmed down "Hành trình của tôi" (My Journey) header by >60% (from ~250px down to ~96px), removing redundant subtitle kickers and summary strips so habit tracking cards are immediately visible without scrolling.
- **Housewarming Gift Persistence & Badge 2/10 Removal**: Permanently eliminated the `2/10` badge next to the Swiss Chalet title and implemented global persistent storage keys (`healthclues_chalet_welcome_claimed` and `healthclues_chalet_unlocked_items`), ensuring returning players never re-trigger the housewarming gift modal and their placed furniture remains persistent across sessions.

---

## Implementation traceability update — 2026-11-09 (Cycle 52: Restored & Compact Bottom Navigation Dock in Landscape Mode)

- **Restored Landscape Navigation Dock**: Re-enabled `.hc-rpg-bottom-dock` in horizontal/landscape viewports (`orientation: landscape` / `max-height: 600px`), replacing legacy `display: none` with a sleek, compact capsule dock (`display: flex !important; height: 34px buttons; max-width: min(440px, 92vw); background: rgba(8, 24, 18, 0.94); border: 1px solid rgba(212, 175, 55, 0.5)`).
- **Preserved All 5 Navigation Destinations**: Users rotating their smartphones horizontally retain complete thumb-friendly access to all core actions: **Map** (`Bản đồ`), **Journey** (`Hành Trình`), **Reminders** (`Nhắc nhở`), **Today** (`Hôm nay`), and **Home** (`Nhà Của Tôi`).
- **Vertical Clearance Polish**: Re-positioned floating companion button (`.hc-rpg-lumi-reopen-btn`) to `bottom: 2.8rem` and dialogue banners (`.hc-rpg-talk`, `.hc-rpg-lumi-dialogue`) to `bottom: 3.4rem`, preventing collisions above the landscape dock.
- **Topbar Squeeze Resolution**: Suppressed `.hc-rpg-next-reward` on short/landscape displays, ensuring the avatar, `Lv.1 · Explorer` title, and full EXP bar remain crystal clear without clipping or gift box collisions.

---

## Implementation traceability update — 2026-11-09 (Cycle 51: Chalet Badge "2/10" Removal & Client-Side Housewarming Gift Persistence)

- **Chalet 2/10 Badge Removal**: Eliminated `<span className="hc-wellness-home-badge">{unlockedItems.length}/10</span>` and hid `.hc-wellness-home-badge` via CSS, providing a clean title header for the Swiss Chalet without redundant item ratio counters.
- **Client-Side Chalet Persistence Architecture**: Implemented dual-layer persistence for `HealthCluesWellnessHome` using `localStorage` keyed by player/world identity (`healthclues_chalet_state_v1_{id}`).
- **Zero-Flicker Pre-Hydration**: Initialized `unlockedItems`, `hasClaimedWelcome`, and `activeRoom` synchronously from local storage on mount. Unlocked items (such as the Day 1 Luxury Sofa) render immediately without waiting for server response or showing empty rooms.
- **Welcome Gift Claim Protection**: Ensured `hasClaimedWelcome` is never overwritten by cold-started serverless API responses. Once claimed, the welcome gift modal is permanently suppressed on all subsequent visits, and the chalet loads with the player's earned furniture automatically in place.
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified multi-session CDP capture (`chalet_03_second_visit_auto_loaded.png`).

---

## Implementation traceability update — 2026-11-09 (Cycle 50: Streamlined Journey Modal Header & Mobile Habit Real Estate Optimization)

- **Slim Journey Modal Header Bar**: Hidden the redundant uppercase kicker (`HEALTHCLUES · HEALTHCLUES REALM`) on mobile and desktop viewports, streamlining the modal header into a single sleek row with a 26px close button (`height: 36px`), saving ~25px vertical space.
- **Segmented Control Navigation**: Redesigned `.hc-journey-nav-tabs` (`Thói quen` / `Lộ trình 30 ngày`) into a compact iOS/Material-style segmented control container (`height: 30px`, `padding: 2px`, `border-radius: 8px`), saving ~20px vertical space compared to legacy bulky pills.
- **Compact Action Chips**: Slimmed down `.hc-add-habit-btn` and `.hc-view-all-plan-btn` to sleek 28px action chips with concise typography and subtle borders.
- **Removed Duplicate Summary Strip**: Hidden `.hc-habits-summary-strip` (`🎯 Đang theo dõi {N} thói quen · ↓ Cuộn xem tất cả`) on mobile (`display: none !important;`), as habit counts are already displayed in the tab badge, eliminating redundant visual clutter and reclaiming 32px vertical height.
- **Combined Impact**: Reclaimed **100px+ of vertical screen space**, ensuring habit tracking cards ("mục theo dõi") start immediately beneath the compact toolbar without being pushed offscreen or requiring scrolling on mobile devices.
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified CDP captures (`portrait_02_journey_signedin.png`, `portrait_02_journey_with_3_habits.png`).

---

## Implementation traceability update — 2026-11-09 (Cycle 48: Mobile Zero Top Gap, Full-Screen Landscape World & Streamlined HUD)

- **Zero Top Gap Across Orientations**: Eliminated the legacy 59–68px shell top margin by applying strict resets (`position: absolute !important; inset: 0 !important; width: 100% !important; height: 100dvh !important; margin: 0 !important; padding: 0 !important; top: 0 !important;`) on `.hc-game-root.has-rpg-hud` and `.shell:has([data-hc-game-canvas]) .content`. The game begins at `top: 0` with zero blank space.
- **Full-Screen Landscape Game Canvas**: In landscape mode on smartphones (`@media (max-height: 550px), (orientation: landscape) and (max-width: 950px)`), automatically hide `.hc-rpg-bottom-dock` (`display: none !important;`) and scale the map via `responsiveSceneScale(width, height) = Math.max(widthScale, heightScale)`. This allows the world map and Chalet stage to expand 100% edge-to-edge with zero letterboxing black bars.
- **Streamlined Topbar HUD on Mobile**: Hid the redundant next-reward mystery gift button on mobile viewports (`.hc-rpg-next-reward { display: none !important; }`), permanently resolving level label clipping/overlap (`Lv.1 · Explorer` and `0/50 EXP`).
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified CDP captures for both portrait and landscape viewports.

---

## Implementation traceability update — 2026-11-08 (Cycle 39: Swiss Alpine Chalet Admin CMS Studio & Reward Visual Placement Setup)

- **Admin CMS Visual Setup Tool (`/admin/healthclues-home`)**: Developed a dedicated, interactive Admin Visual Studio enabling administrators to upload, customize, and visually calibrate 3D perspective homography 4-corner coordinates (`tl`, `tr`, `br`, `bl`), `user_scale`, and `z_index` for all chalet furniture.
- **Dynamic Catalog API & In-Memory Synchronization**: Upgraded `/api/healthclues/wellness-home` to support `admin_save_item` and `admin_delete_item` actions. Changes persist to Supabase `healthclues_wellness_home_catalog` with RLS service-role permissions and immediately synchronize into memory.
- **Dynamic Reward Resolution for Game Clients**: The player game client (`/play`) and Mystery Gift modals dynamically read from this admin-managed catalog, guaranteeing that rewards unlocked through Level Milestones or Daily Quests match the exact visual placement and attributes configured by the Admin.
- **Reusable Homography Mathematical Engine**: Extracted `getSquareToQuadTransform` into `src/components/healthclues/wellnessHomeHomography.ts`, shared between client gameplay and the admin studio canvas.

---

## Implementation traceability update — 2026-11-08 (Cycle 37: Swiss Alpine Chalet Wellness Home Core Integration & Mystery Gift Alignment)

- **Swiss Alpine Chalet Wellness Home Core System**: Integrated the personal Chalet (`HealthCluesWellnessHome`) directly into the main HealthClues game (`/play`). Accessible via the RPG HUD bottom dock ("Nhà Của Tôi" / "Home") and the Camp landmark.
- **Full Screen Overlay Separation & Z-Index Polish**: Isolated `HealthCluesWellnessHome` with `z-[80]` and strictly guarded the generic `hc-game-modal` from rendering when `panel === "home"`, preventing empty headers or backdrops from obstructing the Chalet.
- **Mystery Gift Alignment to Chalet Furniture**: Connected Level Milestones (e.g. Level 3 Grand Piano, Level 2 Oak Table, Level 4 Alpine Planter, Level 5 Fireplace Wall Art, Level 6 Oak Bed) and the 7-Day Streak Milestone (Reading Armchair) directly to Swiss Alpine Chalet decorative items with transparent PNG graphics and direct unlock into the player's chalet.
- **100% Empty Canvas Architecture**: Both the Alps Living Room (`scene_interior_wide`) and Restorative Bedroom (`scene_bedroom`) start as 100% empty canvas rooms (authentic AI backgrounds with no baked-in furniture).
- **Homography Projective Warping Engine**: Integrated 4-corner homography perspective warp calculation (`matrix3d(...)`) anchoring wall canvases and chimney paintings onto realistic tilted 3D architectural surfaces.
- **Real-Time Day / Night Auto Clock**: Automatically synchronizes lighting to player's device clock (`new Date().getHours()`, 06:00-18:00 Day, 18:00-06:00 Night) with a manual 3-state toggle button.
- **Progressive Gameplay & Multi-Player Isolation**: Day 1 Welcome Gift Unboxing Modal unlocks the Luxury Sofa into the living room center. Daily Quest / Check-in rewards offer Pick 1 of 2 deduplicated furniture cards. Player progress is persisted in Supabase with strict RLS isolation (`healthclues_wellness_home_player_state`).
- **Turbopack Build & Verification**: Passed isolated Turbopack build with 83/83 routes and zero errors.

---

## Implementation traceability update — 2026-11-08 (Cycle 36: Full Modal Windows & Panels Bilingual Localization)

- **Comprehensive Modal & Dialog Bilingual Localization**: Unified all modal windows, dialogs, popovers, and drawer panels across HealthClues so that when switched to English (`locale === "en"`), zero Vietnamese leaks into the interface, and when in Vietnamese (`locale === "vi"`), zero English leaks into the interface.
- **Reminder Settings & Email Sample**: Fully localized `DailyReminderPanel` and `showEmailPreview` across all titles, field labels, dropdown options, and email template previews.
- **Companion Add-Habit Modal**: Localized all quick suggestion pills, companion celebration cards, and custom habit saving flows.
- **Living Village Autonomous Characters**: Expanded `AmbientVillageVisitors.tsx` with `CHIBI_GREETINGS_EN` for all 5 chibi villagers across 6 situational interaction contexts.

---

## Implementation traceability update — 2026-11-08 (Cycle 33: Unified HUD NPC Talk Layer & Dialogue Stacking Overlap Resolution)

- **Unified HUD Architecture for NPC Dialogues**: Re-architected `.hc-rpg-talk` to be managed directly by `HealthCluesRpgWorldHud` rather than inside the isolated `RegionMapScene` (`isolation: isolate; z-index: 18`). This unifies the talk banner and the bottom navigation dock in the same HUD stacking tree, permanently eliminating the desktop dock overlap bug.
- **Mutual Exclusivity State Suppression**: Programmatically suppressed Lumi's companion speech bubble and circular mini-head button whenever an NPC or Landmark talk prompt is active (`!activeTalk`), preventing floating elements from obstructing dialogue text on mobile.
- **Guaranteed Geometric Separation**: Positioned `.hc-rpg-talk` at `bottom: calc(5.85rem + env(safe-area-inset-bottom, 0px))` on desktop (+19px clearance) and `bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px))` on mobile (+18px clearance), guaranteeing zero collision with the bottom dock across all resolutions.
- **Streamlined Mobile Action Controls**: Resized the mobile talk action button (`min-height: 28px; padding: 0.22rem 0.55rem; font-size: 0.7rem`) and added a dedicated close button `(X)` (`.hc-rpg-talk-close-btn`). Clamped copy to 2 lines (`-webkit-line-clamp: 2`).

---

## Implementation traceability update — 2026-11-08 (Cycle 32: Realtime Synchronous Multiplayer Presence & Online Adventurers)

- **Synchronous Multiplayer Village Presence**: Implemented real-time presence synchronization enabling multiple players in the same regional village (`HealthClues Realm` or `Sleep Valley`) to see each other moving, standing, and interacting.
- **Presence Storage Architecture**: Created Supabase table `healthclues_online_presence` with RLS policies and spatial index, supplemented with an in-memory fallback layer in `/api/healthclues/world/presence` for low-latency heartbeats.
- **Live Adventurer Rendering & Social Interactions**: Built `OnlineAdventurers.tsx` rendering remote players as animated chibi characters with pulsing green online badges (`🟢 {nickname}`). Added peer interaction cards supporting friendly non-clinical gestures (`👋 Vẫy tay chào`, `✨ Cổ vũ sống khỏe`, `🍵 Mời tách trà ấm`) with in-world speech bubbles. Added top HUD online count badge (`🟢 X online`).
- **Healthcare Privacy Invariant**: Strictly prohibited the broadcast of health topics, care plans, or private check-in records over presence channels.
- **Multi-Client Verification**: Automated test `scripts/test-realtime-presence-multiplayer.mjs` verified simultaneous presence, spatial movement tracking, and speech greetings between multiple simulated clients with 100% PASS.

---

## Implementation traceability update — 2026-11-07 (Cycle 31: Real-User End-to-End Walkthrough & Feature Verification)

- **Complete End-to-End Human User Simulation**: Automated an exhaustive 11-step walkthrough simulating a fresh user journey from Supabase registration, initial habit plan generation and confirmation, adding custom habits via companion dialogue, deleting habits with 1-click confirmation, daily check-in with private notes, leveling up to Level 2 (50 EXP), unboxing milestone mystery gifts, saving and unsaving peer-reviewed botanical research, timezone and morning reminder scheduling, email receipt in Mailpit, direct re-entry to the game without bounce, and a full mobile viewport audit.
- **Habit Management Capabilities**: Removed role gates on adding custom habits via Lumi (`+ Thêm thói quen`); added a direct 1-click `[Xóa]` pill action on active habit cards in My Journey.
- **Timezone Standardization & Morning Reminders**: Added standard timezone `<select>` dropdown (`Asia/Ho_Chi_Minh` default) and morning reminder slot `07:30` (recommended for morning habits & yesterday check-in). Dispatched reminder emails via internal API to local Mailpit with personalized morning greetings and `/play` action link.
- **Scientific Knowledge Management**: Implemented `[Bỏ lưu]` in Knowledge Book and updated Knowledge API to return localized Vietnamese clinical guidelines when unreviewed topics are queried.
- **Automated Verification**: Verified 100% PASS across all 11 steps and 21 visual evidence screenshots via `scripts/test-comprehensive-real-user-flow.mjs` on native Chromium CDP.

---

## Implementation traceability update — 2026-11-07 (Cycle 30: End-to-End User Experience & UI/UX Polish Audit)

- **Comprehensive End-to-End Walkthrough Polish**: Conducted an exhaustive walkthrough audit covering user landing, authentication, RPG world HUD, mystery gift unboxing, landmark/NPC interactions, botanical cards, and all 5 dock drawer panels.
- **NPC Dialogue Spacing & Layer Clearance**: Elevated `.hc-rpg-talk` to `bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px))` on desktop and `bottom: calc(6.0rem)` on mobile with `z-index: 55`, establishing +21.17px desktop and +17.31px mobile clearance strictly above the bottom navigation dock (`z-index: 30`). Added body class `body.hc-has-active-talk` to suppress Lumi companion prompts (`opacity: 0 !important`) during active talk interactions. Replaced bulky uppercase buttons with sleek 30px pill action buttons (`.hc-rpg-talk-action-btn`).
- **Responsive Mobile Level Badge**: Implemented dual-render title tags (`.is-desktop-title` vs `.is-mobile-title`). On 390px mobile viewports, the badge cleanly renders `Cấp 1 · Khám Phá` (`shortTitle`) with zero ellipsis truncation dots.
- **Consistent Right Rail & Mystery Gift Copy**: Replaced awkward hybrid term "Nhiệm Care" with "Nhiệm vụ Sống Khỏe" (subtitle "Mục tiêu hôm nay"). Cleaned Mystery Gift button copy to "✨ Khám Phá Quà Tặng" and verified 3-way modal dismissal.
- **De-Conflicted Modal Stacking**: Added `!panel` check to `WorldEntryTutorial` preventing tutorial overlays from rendering on top of active drawer panels.
- **WCAG Legibility & Font Rendering Fix**: Corrected Journey panel empty state habit recommendations from `text-amber-200` to `#173f33` and `#38594b`. Replaced `Georgia, serif` with system font stack on tour headers to fix Windows Vietnamese diacritic separation bugs.
- **Automated Verification**: End-to-end verified via `scripts/audit-full-user-walkthrough.mjs` and `scripts/test-session-expired-redirect.mjs` on Chromium CDP with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 29: Botanist RPG Botanical Cards, Visual Artwork & Highlights Redesign)

- **Botanist Visual Assets & WebP Optimization**: Added 4 authentic public-domain botanical plates (`perilla-frutescens.webp`, `hibiscus-sabdariffa.webp`, `matricaria-chamomilla.webp`, `passiflora-incarnata.webp`) under `public/healthclues/assets/botanical/`.
- **Botanical Library Schema Expansion**: Added `imageUrl`, `categoryBadge`, and `keyHighlights` to `BotanicalArticle` in `src/data/healthclues-botanical-library.ts`. Structured 3 key bioactives and 3 concise research highlights per herb.
- **RPG Collectible Card Presentation (`WellnessEncyclopediaStation.tsx`)**: Transformed the previous dense academic layout into a fantasy collectible herb card. Eliminated the long textbook paragraph from the initial card. Highlighted active bioactives in an amber tag container and studied mechanisms in an emerald container. Added floating evidence tier badges and PubMed citation counters directly on the plant illustration frame.
- **Two-Step Progressive Disclosure**: Initial card acts as an inviting scannable RPG herb entry; clicking `[📖 Đọc chi tiết]` opens the modal with the complete 12-section scientific breakdown and PubMed links.
- **Automated Verification**: End-to-end verified via `scripts/test-botanist-rpg-cards.mjs` on Chromium CDP across Desktop (1280×800) and Mobile (390×844) with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 28: NPC Talk Card Mobile Text Overlap & Desktop Dock Clearance Refinement)

- **NPC Talk Card Spacing & Layer Elevation**: Positioned `.hc-rpg-talk` at `bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px))` on desktop with `z-index: 55`, establishing a positive vertical clearance of `+21.2px` above the bottom navigation dock (`z-index: 30`). Added intermediate laptop rule for 1024px screens with `+14.5px` clearance and no right-rail collision. Anchored mobile at `bottom: calc(6.0rem)` with `+17.3px` clearance.
- **Mutual Exclusivity (Zero Overlap with Lumi Helper)**: Implemented CSS mutual exclusivity suppressing `.hc-rpg-lumi-reopen-btn` and `.hc-rpg-lumi-dialogue` with `opacity: 0 !important; pointer-events: none !important` whenever an NPC/landmark talk prompt is open (`body.hc-has-active-talk`). Eliminates the mobile defect where Lumi's circular icon overlapped the dialogue text.
- **Pill Action Button & Integrated Avatar**: Replaced oversized uppercase `[TRÒ CHUYỆN]` button with a compact pill button (`.hc-rpg-talk-action-btn`) featuring `<MessageCircle size={14} />` and title-case `"Trò chuyện"` (height: 30px-34px, width: ~105px). Integrated portrait avatar `.hc-rpg-talk-avatar` as an in-flow flex child.
- **Automated Verification**: End-to-end verified via `scripts/test-npc-talk-layout.mjs` on Chromium CDP across Desktop (1280×800), Short Laptop (1024×581), and Mobile (390×844) with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 27: Expired Session Auto-Redirect & Sign-In Modal Recovery)

- **Session Expiration Auto-Redirect to Sign-In Screen**: Implemented `isCloudSessionExpired`, `refreshCloudSession`, and `handleSessionExpired` in `src/lib/wellness-cloud.ts`. When an expired token or HTTP 401/403 is encountered during authenticated requests, stale session storage is cleared and the player is automatically redirected to `/play?signin=1&expired=1`.
- **Automatic Sign-In Modal & Amber Alert Banner**: `HealthCluesWelcome.tsx` auto-detects `signin=1` and `expired=1`, triggering the Sign-In modal to open automatically with an informative amber notification banner explaining the session expiration and presenting Google 1-Click and Email sign-in options.
- **Elimination of Stuck Intro State**: `WellnessWorldGame.tsx` eliminates the stranded `"✨ Đang mở Cõi Sống Khỏe của bạn..."` state when unauthenticated or expired, replacing it with an explicit session-expired notification card and direct re-login CTA button.
- **Automated Chromium Verification**: End-to-end verified via `scripts/test-session-expired-redirect.mjs`.

## Implementation traceability update — 2026-11-07 (Cycle 26: NPC Dialogue Clearance & Mystery Gift Modal Dismissal Resolution)

- **NPC / Lumi Dialogue Clearance & Z-Index Elevation**: Raised `.hc-rpg-lumi-dialogue` z-index to `50` (higher than bottom navigation dock `30`), preventing any clipping under the bottom dock. Raised desktop bottom clearance to `7.8rem` (+31px), tablet `7.5rem` (+26px), mobile `6.8rem` (+48px). Added responsive media query `@media (max-height: 640px)` for short viewports (dock at `0.35rem`, dialogue at `5.4rem`, width `min(360px, 42vw)`), achieving verified +24px clearance on 1024×581 with 0 collision across 7 tested viewports.
- **Mystery Gift Modal Pointer Events & Real Mouse Dismissal**: Added explicit `pointer-events: auto;` in CSS and inline React JSX to `.hc-mystery-modal-backdrop`, `.hc-mystery-modal-card`, `.hc-mystery-close-btn`, and `.hc-mystery-secondary-btn`, overcoming inherited `pointer-events: none` from parent `.hc-rpg-hud-layer`. Added `e.stopPropagation()` on close handlers. Verified via real Chromium CDP mouse clicks (`Input.dispatchMouseEvent`): close button `(X)`, `"Đã hiểu"` secondary button, and backdrop clicks reliably dismiss the modal.

## Implementation traceability update — 2026-11-06 (Cycle 24: NPC Dialogue Clearance & Mystery Gift Box Unboxing System)

- **NPC / Lumi Dialogue Non-Overlapping Clearance**: Fixed `.hc-rpg-lumi-dialogue` z-index (raised to 35) and responsive bottom clearance above the bottom navigation dock across all viewports (`bottom: 6.5rem` desktop/tablet, `6.2rem` mobile <=768px, `5.8rem` mobile <=680px, and `@media (max-height: 540px)` for mobile landscape). Verified positive clearance on Chromium across 1280px (+9.98px), 768px (+21.20px), 390px (+14.11px), 375px (+14.11px).
- **Mystery Gift Box Unboxing System**: Replaced upfront reward names on Top HUD and Day 7 Card with interactive Mystery Gift Boxes (`Hộp Quà Bí Ẩn 🎁`). Integrated `MysteryGiftModal` featuring 3 visual stages: idle hovering box with mystery lock badge and orbiting sparkles, 1.4s unboxing transition with shake anticipation, zoom-in (scale up 1.4x), lid popping off, golden vertical light beam, spinning sunburst rays, and 28 radial confetti particles, concluding in the revealed reward presentation with rarity badges and bonus EXP chips.

## Implementation traceability update — 2026-11-06 (Google 1-Click + Email Auth on World Preview & /play Zero Bouncing)

- **World Preview Modal Dual Authentication**: The "Tạo hành trình của bạn" modal triggered by `[BẮT ĐẦU HÀNH TRÌNH]` features a prominent top **[ Tiếp tục với Google (1 chạm vào game) ]** button with authentic 4-color Google logo SVG. Pending journey details (questId, profile, wellness plan) are cached in `localStorage` (`healthclues-pending-journey-local`) and restored seamlessly via `signInWithOAuth("google", locale, "/play?activation=complete")`. Also offers Email Magic Link option with pre-checked consent.
- **Top Status Bar Quick Sign-In**: World Preview map (`HealthCluesWorldPreview.tsx`) includes a top status bar `[Đăng nhập]` button, enabling players to sign in at any time.
- **Zero Auto-Redirecting on /play**: `hasResumableQuizDraft` excludes `view === "world_preview"`. Guests navigating directly to `/play` see the HealthClues Welcome landing page with `[Đăng nhập]` and `[Bắt đầu hành trình]` buttons.
- **Dynamic Google Email Linking**: `WorldAuthCallback` and `WellnessWorldGame` dynamically match and associate empty-email OAuth pending journeys, persisting the user's discovery profile and unlocking their backpack directly upon return.

## Implementation traceability update — 2026-11-05 (Mobile-First Smart Routine Assistant Overhaul)

- **Dedicated Daily Reminder Modal & Quick Strip**: The bulky 450px reminder banner on the first fold of "Hành trình của tôi" is removed from the habit list. It is replaced by a sleek 32px quick strip (`.hc-journey-reminder-quick-strip`) with direct access to a dedicated standalone Daily Reminder modal (`DailyReminderPanel`).
- **Interactive Companion Add Habit Dialog (Zero Scroll)**: Modal dialog for adding habits with the Companion (`<CompanionAddHabitModal />`) is strictly constrained to a single mobile screen (`max-height: min(90vh, 520px); overflow: hidden;`) with zero vertical scrollbars. Supports 4 one-tap quick suggestion pills, custom text input, and an interactive celebration step awarding +20 EXP upon persistence to Supabase via `POST /api/healthclues/plan`.
- **My Journey Responsive 50/50 Grid Tabs & Clean Typography**: Tab bar (`.hc-journey-nav-tabs`) uses an equal 50%/50% grid (`[🌱 Thói quen (N)]` | `[🗺️ Lộ trình 30 ngày]`). Add habit button text is standardized to `Thêm thói quen` (no duplicate `+`). Goal actions (`[Đổi / Bỏ]` and `[Xem chi tiết]`) are placed in a dedicated separate row.
- **Nhiệm Care HUD Multi-line Typography**: Goal titles wrap up to 2 lines without ellipsis (`...`) clipping, using compact `font-weight: 500` and slender `+10 EXP` badges.
- **Mobile Bottom Navigation Dock**: Mobile dock is streamlined to exactly 3 primary actions: `[Bản đồ]`, `[Hành Trình]`, `[Hôm nay]`.

## Implementation traceability update — 2026-11-05 (Comprehensive Acceptance Round)

- **Quick-Activate Session Bypass Decommissioned**: `/api/healthclues/account/quick-activate` permanently disabled with HTTP 410 Gone. All client instant activation buttons removed. E2E and owner demo authentication strictly verified via local Supabase Auth + local Mailpit.
- **Sleep Valley & Luna Persistence**: Bound Sleep Valley permanently to `questId === "sleep-better"` and companion Luna. Preserved across magic link redirect and reload.
- **Non-Blocking Advisor**: Immediate "Skip plan and preview World" button available during Advisor loading; skip leads to clean World Preview without auto-invoking failed plan modals.
- **Walk First, Then Talk**: NPC/landmark clicks initiate pathfinding walk animation only. Modal opens strictly upon arrival and clicking the "Talk" or "Interact" banner.
- **Truthful Level Progression & Dynamic Daily Care**: Level 1 with 0 / 50 EXP for new accounts; Card 1 dynamically renders active goals from `wellnessGoals` or honest empty state.
- **Mobile Viewports (320px, 390px, 430px)**: 3-button bottom dock (`Bản đồ · Hôm nay · Túi đồ`), card ellipsis overflow, and suppressed HUD during active modal dialogs.

## Implementation traceability update — 2026-11-05 (Mobile Viewport Adaptation)

- **Mobile Navigation Dock**: Bottom navigation transforms on mobile (`<= 680px`) into a fluid horizontal-scrolling dock with readable pill labels (`font-size: 0.72rem` / 11.5px) without force-squeezing 6 items into one fixed cramped row. Content area retains safe-area bottom clearance.
- **Quiz Question 2 Mobile Streamlining**: Compacted top adventure rail height, fixed duplicate breadcrumbs (`✦ HEALTHCLUES REALM`), changed age confirmation to default unchecked (`ageConfirmed = false`), and introduced a sticky bottom CTA tray supporting 2-line wrapped text with zero horizontal overflow across 320px–430px viewports.
- **World Preview Mobile Isolation**: Repositioned companion Lumi speech bubble to bottom-left with interactive one-click collapse/reopen, avoiding collisions with map markers and the bottom-right "START YOUR JOURNEY" action button.

## Implementation traceability update — 2026-11-05

- **RPG World HUD & Experience Bar**: Complete RPG HUD recreation aligned with reference image, featuring topbar level title and glowing golden EXP bar, two floating right panels for daily care habits and 7-day milestone track, bottom-left Lumi companion speech bubble, and bottom 6-button navigation dock.
- **AI Botanical Advisor**: Replaced empty botanical state with dynamic AI-generated and evidence-curated herbal cards tailored to the user's specific health condition (Gout, Sleep, Digestive, etc.), detailing Latin names, biological mechanisms, dosage/preparation guidelines, safety boundaries, and contraindications.

## Implementation traceability update — 2026-11-10 (Cycle 73: Real-Player Re-Audit — Responsive Camera Framing, Cross-Platform Walk, Duplicate-EXP Guard & Journey Active/Saved Separation)

- **Responsive World & Overview Scaling (`healthclues-mobile/app/(game)/world.tsx`)**: Replaced static `Dimensions.get("window")` with `useWindowDimensions()`, fixed Web synthetic coordinate extraction in `handleMapPress`, fitted all 4 toolbar buttons cleanly in `>=360px` viewports, repositioned `camp` (`x: 280, y: 465`) and `library` (`y: 256`), and scaled overview minimap pins dynamically with a 7-station quick jump list.
- **Confirmed EXP Parity & Duplicate Guard (`healthclues-mobile/src/hooks/useWorld.ts`, `app/(game)/daily-care.tsx`)**: `submitHabitCheckin` awards exact completed quest EXP (`10 + 15 + 10 = +35 EXP`), sets `alreadySubmitted` to prevent duplicate EXP inflation on re-saves, and synchronizes UI feedback.
- **Journey 7-Day Timeline & Active/Saved Split (`healthclues-mobile/app/(game)/journey.tsx`)**: Added read-only 7-day timeline strip above goals, implemented `toggleGoalStatus` (`active` vs `saved_for_later`), replaced fixed volume `cốc (300ml)` with `cốc ấm`.
- **Clean Player Copy (`healthclues-mobile/app/(game)/profile.tsx`)**: Removed developer jargon `"RLS"` from legal notice.

---

## Implementation traceability update — 2026-11-10 (Cycle 72: Mobile UI/UX Redesign & Real Player Acceptance — World Clean RPG, Daily Quest Board & Inventory Separation)

- **World RPG Screen Clean Visuals (`healthclues-mobile/app/(game)/world.tsx`)**: Removed developer X/Y coordinates and 100% of yellow debug trail dots. Repositioned player spawn to cobblestone ground `(430, 660)` next to Trail Explorer NPC, eliminating the rooftop/awning clipping bug. Replaced unverified 35% gout clinical claim on the botanical landmark with lifestyle nutrition lore.
- **Daily Care RPG Quest Board (`healthclues-mobile/app/(game)/daily-care.tsx`)**: Transformed into "Bảng Nhiệm Vụ Hôm Nay" with a 3-day streak badge, emerald progress bar (`3/3 Nhiệm vụ`), and maximum EXP indicator. Compact quest cards feature personalized, safe hydration ("Duy Trì Uống Đủ Nước Hàng Ngày"), antioxidant nutrition, and joint-friendly movement. Medical citations are hidden in an expandable drawer. Check-in submission triggers a 5-star celebration modal with Lumi companion feedback.
- **Inventory & Knowledge Separation (`healthclues-mobile/app/(game)/inventory.tsx`)**: Re-architected into two isolated tabs: `[Vật Phẩm & Trang Bị (3)]` for equippable quest items and `[Sổ Tay Tri Thức (4)]` for medical exploration lorebooks without equip buttons. Top 3 equipment slots display active items with unambiguous "Đang trang bị tại Ô X" and "Tháo Khỏi Ô X" actions.
- **Health Content Safety Boundary**: Disallowed hardcoded 2000ml water targets, mandatory daily herbal supplements, and unverified clinical therapeutic claims.
- **Real Player Acceptance Across 5 Viewports**: Automated CDP acceptance test script `run-full-ux-player-acceptance.mjs` verified 360x800, 390x844, 430x932, 768x1024, and 1280x800 viewports with 100% PASS rate. Detailed evidence report at `App/reports/mobile-ux-acceptance/MOBILE_UX_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-10 (Cycle 66: Mobile Habits System, Add Habit Modal, Daily Check-in 5-Star HUD & Auth Session Resilience)

- **Mobile Wellness Habits Parity (`healthclues-mobile/app/(game)/journey.tsx`, `daily-care.tsx`, `inventory.tsx`)**: Aligned mobile gameplay 100% with Web Game `/play` architecture (`DailyCheckinDialog.tsx` & `daily-care-domain.ts`). Converted daily care from tool slot equipment to true medical wellness habit management (Active Goals).
- **Add Habit Interactive Modal with Lumi Mascot**: Integrated the "➕ Thêm Thói Quen" flow in Journey (`journey.tsx`), allowing players to choose from 5 verified medical habit presets or input custom routines (+20 EXP).
- **Daily Care Real-time 5-Star Rating HUD (`daily-care.tsx`)**: Check-in directly marks active habits as [Done], [Not yet], or [Skipped], dynamically updating the 1-5 Star Rating HUD via `calculateStars`, with personal reflection input and EXP reward.
- **Single-Line 3D Gold CTA Button (`healthclues-mobile/app/(onboarding)/quiz.tsx`)**: Redesigned quiz entry button "VÀO VƯƠNG QUỐC HEALTHCLUES (+50 EXP)" with gold border `#fde047`, single-line layout (`numberOfLines={1}`), and elevated 3D shadow.
- **Authentication Session Resilience (`services/auth.ts`, `services/api.ts`, `serve-mobile.mjs`)**: Eliminated red 401 session expired errors using automatic Supabase token caching and offline-first AsyncStorage fallback.
- **Two-Tester Automated Verification (8/8 PASS)**: Automated Chrome CDP loop verified all 8 functional test cases and 8 visual artifacts.

---

## Implementation traceability update — 2026-11-09 (Cycle 64: Mobile Welcome & Quiz Web Parity, Realm Default & Two-Tester Automated Loop)

- **Mobile Welcome Screen Replica & Navigation Guard (`healthclues-mobile/app/(onboarding)/quiz.tsx`, `app/(game)/_layout.tsx`)**: Replicated 100% of the Web Game `/play` welcome screen aesthetics (widescreen RPG background, gold compass crest, bilingual pill, 3D Gold action CTA). Enforced a strict navigation guard: non-onboarded players are automatically redirected to the quiz before entering any game route.
- **HealthClues Realm Default & Sleep Valley Lock Guard (`healthclues-mobile/app/(game)/world.tsx`)**: Set HealthClues Realm as the default active region paired with the Lumi Fox companion (`lumi_fox_clean.png`) starting at Central Camp `[320, 540]`. Temporarily locked Sleep Valley with an amber lock pill and user-friendly toast notice.
- **Landmark Pin Visual Hierarchy Optimization**: Redesigned landmark anchors with a spacious 120x64px centered container, 36x36px golden-bordered crests, and dark frosted rounded plaques, preventing text truncation or awkward single-word wrapping.
- **Automated Two-Tester Quality & Vision Loop (8/8 PASS)**: Executed headless Chrome CDP verification across mobile viewport (390x844 @2x), generating comprehensive visual proof (`vision-01` to `vision-08`) in `App/reports/TWO_TESTER_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-09 (Cycle 62: HealthClues Mobile RPG Visual Engine & Quiz Onboarding Integration)

- **Mobile RPG Visual Engine & Web Scene Blueprint Parity (`healthclues-mobile/app/(game)/world.tsx`)**: Replaced constrained card layout with an expansive 16:9 widescreen canvas operating on 1600x900 scene blueprints copied directly from the web game (`sleep-valley-scene-blueprint.webp` and `healthclues-realm-scene-blueprint.webp`).
- **Real-Time Tap-to-Walk Movement Loop & Floating Coordinates HUD**: Implemented a 16ms delta-time movement tick loop executing at 60 FPS, with directional sprite flipping (`scaleX: -1 / 1`), Luna companion floating animation, and a real-time HUD displaying exact coordinates `X, Y`, current zone name, and waypoint destination.
- **Interactive Proximity & Active Talk HUD**: Dynamically tracks player distance to landmarks and living NPCs (Trail Explorer, Botanist); approaching within 75px triggers a bottom slide-up Active Talk HUD with character portrait, role badge, medical advice quote, and action trigger.
- **Onboarding Health Quiz Flow (`healthclues-mobile/app/(onboarding)/quiz.tsx`)**: Developed a 4-step interactive quiz guiding players from avatar greeting -> region selection -> adaptive questions -> evidence-backed wellness plan -> +50 EXP and RPG world entry.
- **Dual-Tester Independent Automated Verification (10/10 PASS)**: Conducted automated end-to-end tests via Chrome DevTools Protocol across mobile viewport (390x844 @2x), generating comprehensive visual proof captured in `App/reports/TWO_TESTER_ACCEPTANCE.md`.

---

## Implementation traceability update — 2026-11-09 (Cycle 60: Resilient Furniture Image Upload & Dynamic Serving Engine)

- **Dynamic Image Serving & In-Memory Storage Engine (`src/lib/wellness-home-image-store.ts`, `src/app/api/healthclues/wellness-home/file/route.ts`)**: Resolved Vercel Serverless read-only filesystem errors (`EROFS`) and Next.js standalone dynamic static file 404s by routing uploaded furniture images through a dynamic endpoint `/api/healthclues/wellness-home/file?name=...` powered by global in-memory caching and `/tmp` fallback storage.
- **Resilient Upload API (`/api/healthclues/wellness-home/upload` & `/api/upload`)**: Supports both `multipart/form-data` and JSON `dataUrl` payloads, returning safe, sanitized filenames under 255 characters to strictly satisfy Supabase `VARCHAR(255)` schema boundaries.
- **Direct Drag & Drop Stage Placement (`src/app/admin/healthclues-home/page.tsx`)**: Administrators can drag and drop PNG/JPG/WebP files directly onto the 16:9 stage canvas; the editor automatically detects natural image dimensions, calculates drop coordinates, creates a new catalog item, and renders an instant zero-latency Data URL preview.
- **Sidebar Quick Upload Card**: Added an explicit upload box at the top of the sidebar item list, enabling quick one-click uploads even when no item was previously selected.

---

## Implementation traceability update — 2026-11-09 (Cycle 59: Swiss Chalet Walkable NavMesh Painter & Journey Header Real Estate)

- **Swiss Chalet Walkable NavMesh Painter Tool (`/admin/healthclues-home`)**: Developed an interactive collision/NavMesh mask painter in the furniture studio (`src/components/healthclues/wellnessHomeWalkable.ts`, `src/app/admin/healthclues-home/page.tsx`). Enables administrators to paint walkable zones with a semi-transparent green brush, erase obstacle areas (e.g. fireplace, sofa, walls), auto-apply standard room floor polygons, test walkability live with Chibi Anna, and save mask data to the server (`/api/healthclues/wellness-home`).
- **In-Game Walkable Movement Constraints (`HealthCluesWellnessHome.tsx`)**: In the in-game Swiss Chalet, character patrol paths and user tap-to-move destinations check the walkable binary mask via `isPointWalkable`, preventing Anna from walking on top of furniture, walls, or fireplaces.
- **Ultra-Compact Journey Modal Header (`WorldAdventureScene.tsx`, `world-adventure.css`)**: Slimmed down "Hành trình của tôi" (My Journey) header by >60% (from ~250px down to ~96px), removing redundant subtitle kickers and summary strips so habit tracking cards are immediately visible without scrolling.
- **Housewarming Gift Persistence & Badge 2/10 Removal**: Permanently eliminated the `2/10` badge next to the Swiss Chalet title and implemented global persistent storage keys (`healthclues_chalet_welcome_claimed` and `healthclues_chalet_unlocked_items`), ensuring returning players never re-trigger the housewarming gift modal and their placed furniture remains persistent across sessions.

---

## Implementation traceability update — 2026-11-09 (Cycle 52: Restored & Compact Bottom Navigation Dock in Landscape Mode)

- **Restored Landscape Navigation Dock**: Re-enabled `.hc-rpg-bottom-dock` in horizontal/landscape viewports (`orientation: landscape` / `max-height: 600px`), replacing legacy `display: none` with a sleek, compact capsule dock (`display: flex !important; height: 34px buttons; max-width: min(440px, 92vw); background: rgba(8, 24, 18, 0.94); border: 1px solid rgba(212, 175, 55, 0.5)`).
- **Preserved All 5 Navigation Destinations**: Users rotating their smartphones horizontally retain complete thumb-friendly access to all core actions: **Map** (`Bản đồ`), **Journey** (`Hành Trình`), **Reminders** (`Nhắc nhở`), **Today** (`Hôm nay`), and **Home** (`Nhà Của Tôi`).
- **Vertical Clearance Polish**: Re-positioned floating companion button (`.hc-rpg-lumi-reopen-btn`) to `bottom: 2.8rem` and dialogue banners (`.hc-rpg-talk`, `.hc-rpg-lumi-dialogue`) to `bottom: 3.4rem`, preventing collisions above the landscape dock.
- **Topbar Squeeze Resolution**: Suppressed `.hc-rpg-next-reward` on short/landscape displays, ensuring the avatar, `Lv.1 · Explorer` title, and full EXP bar remain crystal clear without clipping or gift box collisions.

---

## Implementation traceability update — 2026-11-09 (Cycle 51: Chalet Badge "2/10" Removal & Client-Side Housewarming Gift Persistence)

- **Chalet 2/10 Badge Removal**: Eliminated `<span className="hc-wellness-home-badge">{unlockedItems.length}/10</span>` and hid `.hc-wellness-home-badge` via CSS, providing a clean title header for the Swiss Chalet without redundant item ratio counters.
- **Client-Side Chalet Persistence Architecture**: Implemented dual-layer persistence for `HealthCluesWellnessHome` using `localStorage` keyed by player/world identity (`healthclues_chalet_state_v1_{id}`).
- **Zero-Flicker Pre-Hydration**: Initialized `unlockedItems`, `hasClaimedWelcome`, and `activeRoom` synchronously from local storage on mount. Unlocked items (such as the Day 1 Luxury Sofa) render immediately without waiting for server response or showing empty rooms.
- **Welcome Gift Claim Protection**: Ensured `hasClaimedWelcome` is never overwritten by cold-started serverless API responses. Once claimed, the welcome gift modal is permanently suppressed on all subsequent visits, and the chalet loads with the player's earned furniture automatically in place.
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified multi-session CDP capture (`chalet_03_second_visit_auto_loaded.png`).

---

## Implementation traceability update — 2026-11-09 (Cycle 50: Streamlined Journey Modal Header & Mobile Habit Real Estate Optimization)

- **Slim Journey Modal Header Bar**: Hidden the redundant uppercase kicker (`HEALTHCLUES · HEALTHCLUES REALM`) on mobile and desktop viewports, streamlining the modal header into a single sleek row with a 26px close button (`height: 36px`), saving ~25px vertical space.
- **Segmented Control Navigation**: Redesigned `.hc-journey-nav-tabs` (`Thói quen` / `Lộ trình 30 ngày`) into a compact iOS/Material-style segmented control container (`height: 30px`, `padding: 2px`, `border-radius: 8px`), saving ~20px vertical space compared to legacy bulky pills.
- **Compact Action Chips**: Slimmed down `.hc-add-habit-btn` and `.hc-view-all-plan-btn` to sleek 28px action chips with concise typography and subtle borders.
- **Removed Duplicate Summary Strip**: Hidden `.hc-habits-summary-strip` (`🎯 Đang theo dõi {N} thói quen · ↓ Cuộn xem tất cả`) on mobile (`display: none !important;`), as habit counts are already displayed in the tab badge, eliminating redundant visual clutter and reclaiming 32px vertical height.
- **Combined Impact**: Reclaimed **100px+ of vertical screen space**, ensuring habit tracking cards ("mục theo dõi") start immediately beneath the compact toolbar without being pushed offscreen or requiring scrolling on mobile devices.
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified CDP captures (`portrait_02_journey_signedin.png`, `portrait_02_journey_with_3_habits.png`).

---

## Implementation traceability update — 2026-11-09 (Cycle 48: Mobile Zero Top Gap, Full-Screen Landscape World & Streamlined HUD)

- **Zero Top Gap Across Orientations**: Eliminated the legacy 59–68px shell top margin by applying strict resets (`position: absolute !important; inset: 0 !important; width: 100% !important; height: 100dvh !important; margin: 0 !important; padding: 0 !important; top: 0 !important;`) on `.hc-game-root.has-rpg-hud` and `.shell:has([data-hc-game-canvas]) .content`. The game begins at `top: 0` with zero blank space.
- **Full-Screen Landscape Game Canvas**: In landscape mode on smartphones (`@media (max-height: 550px), (orientation: landscape) and (max-width: 950px)`), automatically hide `.hc-rpg-bottom-dock` (`display: none !important;`) and scale the map via `responsiveSceneScale(width, height) = Math.max(widthScale, heightScale)`. This allows the world map and Chalet stage to expand 100% edge-to-edge with zero letterboxing black bars.
- **Streamlined Topbar HUD on Mobile**: Hid the redundant next-reward mystery gift button on mobile viewports (`.hc-rpg-next-reward { display: none !important; }`), permanently resolving level label clipping/overlap (`Lv.1 · Explorer` and `0/50 EXP`).
- **Production Deployment & Verification**: Audited on live Vercel production (`https://www.botly.vn/play`) with verified CDP captures for both portrait and landscape viewports.

---

## Implementation traceability update — 2026-11-08 (Cycle 39: Swiss Alpine Chalet Admin CMS Studio & Reward Visual Placement Setup)

- **Admin CMS Visual Setup Tool (`/admin/healthclues-home`)**: Developed a dedicated, interactive Admin Visual Studio enabling administrators to upload, customize, and visually calibrate 3D perspective homography 4-corner coordinates (`tl`, `tr`, `br`, `bl`), `user_scale`, and `z_index` for all chalet furniture.
- **Dynamic Catalog API & In-Memory Synchronization**: Upgraded `/api/healthclues/wellness-home` to support `admin_save_item` and `admin_delete_item` actions. Changes persist to Supabase `healthclues_wellness_home_catalog` with RLS service-role permissions and immediately synchronize into memory.
- **Dynamic Reward Resolution for Game Clients**: The player game client (`/play`) and Mystery Gift modals dynamically read from this admin-managed catalog, guaranteeing that rewards unlocked through Level Milestones or Daily Quests match the exact visual placement and attributes configured by the Admin.
- **Reusable Homography Mathematical Engine**: Extracted `getSquareToQuadTransform` into `src/components/healthclues/wellnessHomeHomography.ts`, shared between client gameplay and the admin studio canvas.

---

## Implementation traceability update — 2026-11-08 (Cycle 37: Swiss Alpine Chalet Wellness Home Core Integration & Mystery Gift Alignment)

- **Swiss Alpine Chalet Wellness Home Core System**: Integrated the personal Chalet (`HealthCluesWellnessHome`) directly into the main HealthClues game (`/play`). Accessible via the RPG HUD bottom dock ("Nhà Của Tôi" / "Home") and the Camp landmark.
- **Full Screen Overlay Separation & Z-Index Polish**: Isolated `HealthCluesWellnessHome` with `z-[80]` and strictly guarded the generic `hc-game-modal` from rendering when `panel === "home"`, preventing empty headers or backdrops from obstructing the Chalet.
- **Mystery Gift Alignment to Chalet Furniture**: Connected Level Milestones (e.g. Level 3 Grand Piano, Level 2 Oak Table, Level 4 Alpine Planter, Level 5 Fireplace Wall Art, Level 6 Oak Bed) and the 7-Day Streak Milestone (Reading Armchair) directly to Swiss Alpine Chalet decorative items with transparent PNG graphics and direct unlock into the player's chalet.
- **100% Empty Canvas Architecture**: Both the Alps Living Room (`scene_interior_wide`) and Restorative Bedroom (`scene_bedroom`) start as 100% empty canvas rooms (authentic AI backgrounds with no baked-in furniture).
- **Homography Projective Warping Engine**: Integrated 4-corner homography perspective warp calculation (`matrix3d(...)`) anchoring wall canvases and chimney paintings onto realistic tilted 3D architectural surfaces.
- **Real-Time Day / Night Auto Clock**: Automatically synchronizes lighting to player's device clock (`new Date().getHours()`, 06:00-18:00 Day, 18:00-06:00 Night) with a manual 3-state toggle button.
- **Progressive Gameplay & Multi-Player Isolation**: Day 1 Welcome Gift Unboxing Modal unlocks the Luxury Sofa into the living room center. Daily Quest / Check-in rewards offer Pick 1 of 2 deduplicated furniture cards. Player progress is persisted in Supabase with strict RLS isolation (`healthclues_wellness_home_player_state`).
- **Turbopack Build & Verification**: Passed isolated Turbopack build with 83/83 routes and zero errors.

---

## Implementation traceability update — 2026-11-08 (Cycle 36: Full Modal Windows & Panels Bilingual Localization)

- **Comprehensive Modal & Dialog Bilingual Localization**: Unified all modal windows, dialogs, popovers, and drawer panels across HealthClues so that when switched to English (`locale === "en"`), zero Vietnamese leaks into the interface, and when in Vietnamese (`locale === "vi"`), zero English leaks into the interface.
- **Reminder Settings & Email Sample**: Fully localized `DailyReminderPanel` and `showEmailPreview` across all titles, field labels, dropdown options, and email template previews.
- **Companion Add-Habit Modal**: Localized all quick suggestion pills, companion celebration cards, and custom habit saving flows.
- **Living Village Autonomous Characters**: Expanded `AmbientVillageVisitors.tsx` with `CHIBI_GREETINGS_EN` for all 5 chibi villagers across 6 situational interaction contexts.

---

## Implementation traceability update — 2026-11-08 (Cycle 33: Unified HUD NPC Talk Layer & Dialogue Stacking Overlap Resolution)

- **Unified HUD Architecture for NPC Dialogues**: Re-architected `.hc-rpg-talk` to be managed directly by `HealthCluesRpgWorldHud` rather than inside the isolated `RegionMapScene` (`isolation: isolate; z-index: 18`). This unifies the talk banner and the bottom navigation dock in the same HUD stacking tree, permanently eliminating the desktop dock overlap bug.
- **Mutual Exclusivity State Suppression**: Programmatically suppressed Lumi's companion speech bubble and circular mini-head button whenever an NPC or Landmark talk prompt is active (`!activeTalk`), preventing floating elements from obstructing dialogue text on mobile.
- **Guaranteed Geometric Separation**: Positioned `.hc-rpg-talk` at `bottom: calc(5.85rem + env(safe-area-inset-bottom, 0px))` on desktop (+19px clearance) and `bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px))` on mobile (+18px clearance), guaranteeing zero collision with the bottom dock across all resolutions.
- **Streamlined Mobile Action Controls**: Resized the mobile talk action button (`min-height: 28px; padding: 0.22rem 0.55rem; font-size: 0.7rem`) and added a dedicated close button `(X)` (`.hc-rpg-talk-close-btn`). Clamped copy to 2 lines (`-webkit-line-clamp: 2`).

---

## Implementation traceability update — 2026-11-08 (Cycle 32: Realtime Synchronous Multiplayer Presence & Online Adventurers)

- **Synchronous Multiplayer Village Presence**: Implemented real-time presence synchronization enabling multiple players in the same regional village (`HealthClues Realm` or `Sleep Valley`) to see each other moving, standing, and interacting.
- **Presence Storage Architecture**: Created Supabase table `healthclues_online_presence` with RLS policies and spatial index, supplemented with an in-memory fallback layer in `/api/healthclues/world/presence` for low-latency heartbeats.
- **Live Adventurer Rendering & Social Interactions**: Built `OnlineAdventurers.tsx` rendering remote players as animated chibi characters with pulsing green online badges (`🟢 {nickname}`). Added peer interaction cards supporting friendly non-clinical gestures (`👋 Vẫy tay chào`, `✨ Cổ vũ sống khỏe`, `🍵 Mời tách trà ấm`) with in-world speech bubbles. Added top HUD online count badge (`🟢 X online`).
- **Healthcare Privacy Invariant**: Strictly prohibited the broadcast of health topics, care plans, or private check-in records over presence channels.
- **Multi-Client Verification**: Automated test `scripts/test-realtime-presence-multiplayer.mjs` verified simultaneous presence, spatial movement tracking, and speech greetings between multiple simulated clients with 100% PASS.

---

## Implementation traceability update — 2026-11-07 (Cycle 31: Real-User End-to-End Walkthrough & Feature Verification)

- **Complete End-to-End Human User Simulation**: Automated an exhaustive 11-step walkthrough simulating a fresh user journey from Supabase registration, initial habit plan generation and confirmation, adding custom habits via companion dialogue, deleting habits with 1-click confirmation, daily check-in with private notes, leveling up to Level 2 (50 EXP), unboxing milestone mystery gifts, saving and unsaving peer-reviewed botanical research, timezone and morning reminder scheduling, email receipt in Mailpit, direct re-entry to the game without bounce, and a full mobile viewport audit.
- **Habit Management Capabilities**: Removed role gates on adding custom habits via Lumi (`+ Thêm thói quen`); added a direct 1-click `[Xóa]` pill action on active habit cards in My Journey.
- **Timezone Standardization & Morning Reminders**: Added standard timezone `<select>` dropdown (`Asia/Ho_Chi_Minh` default) and morning reminder slot `07:30` (recommended for morning habits & yesterday check-in). Dispatched reminder emails via internal API to local Mailpit with personalized morning greetings and `/play` action link.
- **Scientific Knowledge Management**: Implemented `[Bỏ lưu]` in Knowledge Book and updated Knowledge API to return localized Vietnamese clinical guidelines when unreviewed topics are queried.
- **Automated Verification**: Verified 100% PASS across all 11 steps and 21 visual evidence screenshots via `scripts/test-comprehensive-real-user-flow.mjs` on native Chromium CDP.

---

## Implementation traceability update — 2026-11-07 (Cycle 30: End-to-End User Experience & UI/UX Polish Audit)

- **Comprehensive End-to-End Walkthrough Polish**: Conducted an exhaustive walkthrough audit covering user landing, authentication, RPG world HUD, mystery gift unboxing, landmark/NPC interactions, botanical cards, and all 5 dock drawer panels.
- **NPC Dialogue Spacing & Layer Clearance**: Elevated `.hc-rpg-talk` to `bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px))` on desktop and `bottom: calc(6.0rem)` on mobile with `z-index: 55`, establishing +21.17px desktop and +17.31px mobile clearance strictly above the bottom navigation dock (`z-index: 30`). Added body class `body.hc-has-active-talk` to suppress Lumi companion prompts (`opacity: 0 !important`) during active talk interactions. Replaced bulky uppercase buttons with sleek 30px pill action buttons (`.hc-rpg-talk-action-btn`).
- **Responsive Mobile Level Badge**: Implemented dual-render title tags (`.is-desktop-title` vs `.is-mobile-title`). On 390px mobile viewports, the badge cleanly renders `Cấp 1 · Khám Phá` (`shortTitle`) with zero ellipsis truncation dots.
- **Consistent Right Rail & Mystery Gift Copy**: Replaced awkward hybrid term "Nhiệm Care" with "Nhiệm vụ Sống Khỏe" (subtitle "Mục tiêu hôm nay"). Cleaned Mystery Gift button copy to "✨ Khám Phá Quà Tặng" and verified 3-way modal dismissal.
- **De-Conflicted Modal Stacking**: Added `!panel` check to `WorldEntryTutorial` preventing tutorial overlays from rendering on top of active drawer panels.
- **WCAG Legibility & Font Rendering Fix**: Corrected Journey panel empty state habit recommendations from `text-amber-200` to `#173f33` and `#38594b`. Replaced `Georgia, serif` with system font stack on tour headers to fix Windows Vietnamese diacritic separation bugs.
- **Automated Verification**: End-to-end verified via `scripts/audit-full-user-walkthrough.mjs` and `scripts/test-session-expired-redirect.mjs` on Chromium CDP with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 29: Botanist RPG Botanical Cards, Visual Artwork & Highlights Redesign)

- **Botanist Visual Assets & WebP Optimization**: Added 4 authentic public-domain botanical plates (`perilla-frutescens.webp`, `hibiscus-sabdariffa.webp`, `matricaria-chamomilla.webp`, `passiflora-incarnata.webp`) under `public/healthclues/assets/botanical/`.
- **Botanical Library Schema Expansion**: Added `imageUrl`, `categoryBadge`, and `keyHighlights` to `BotanicalArticle` in `src/data/healthclues-botanical-library.ts`. Structured 3 key bioactives and 3 concise research highlights per herb.
- **RPG Collectible Card Presentation (`WellnessEncyclopediaStation.tsx`)**: Transformed the previous dense academic layout into a fantasy collectible herb card. Eliminated the long textbook paragraph from the initial card. Highlighted active bioactives in an amber tag container and studied mechanisms in an emerald container. Added floating evidence tier badges and PubMed citation counters directly on the plant illustration frame.
- **Two-Step Progressive Disclosure**: Initial card acts as an inviting scannable RPG herb entry; clicking `[📖 Đọc chi tiết]` opens the modal with the complete 12-section scientific breakdown and PubMed links.
- **Automated Verification**: End-to-end verified via `scripts/test-botanist-rpg-cards.mjs` on Chromium CDP across Desktop (1280×800) and Mobile (390×844) with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 28: NPC Talk Card Mobile Text Overlap & Desktop Dock Clearance Refinement)

- **NPC Talk Card Spacing & Layer Elevation**: Positioned `.hc-rpg-talk` at `bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px))` on desktop with `z-index: 55`, establishing a positive vertical clearance of `+21.2px` above the bottom navigation dock (`z-index: 30`). Added intermediate laptop rule for 1024px screens with `+14.5px` clearance and no right-rail collision. Anchored mobile at `bottom: calc(6.0rem)` with `+17.3px` clearance.
- **Mutual Exclusivity (Zero Overlap with Lumi Helper)**: Implemented CSS mutual exclusivity suppressing `.hc-rpg-lumi-reopen-btn` and `.hc-rpg-lumi-dialogue` with `opacity: 0 !important; pointer-events: none !important` whenever an NPC/landmark talk prompt is open (`body.hc-has-active-talk`). Eliminates the mobile defect where Lumi's circular icon overlapped the dialogue text.
- **Pill Action Button & Integrated Avatar**: Replaced oversized uppercase `[TRÒ CHUYỆN]` button with a compact pill button (`.hc-rpg-talk-action-btn`) featuring `<MessageCircle size={14} />` and title-case `"Trò chuyện"` (height: 30px-34px, width: ~105px). Integrated portrait avatar `.hc-rpg-talk-avatar` as an in-flow flex child.
- **Automated Verification**: End-to-end verified via `scripts/test-npc-talk-layout.mjs` on Chromium CDP across Desktop (1280×800), Short Laptop (1024×581), and Mobile (390×844) with 100% assertions passing.

## Implementation traceability update — 2026-11-07 (Cycle 27: Expired Session Auto-Redirect & Sign-In Modal Recovery)

- **Session Expiration Auto-Redirect to Sign-In Screen**: Implemented `isCloudSessionExpired`, `refreshCloudSession`, and `handleSessionExpired` in `src/lib/wellness-cloud.ts`. When an expired token or HTTP 401/403 is encountered during authenticated requests, stale session storage is cleared and the player is automatically redirected to `/play?signin=1&expired=1`.
- **Automatic Sign-In Modal & Amber Alert Banner**: `HealthCluesWelcome.tsx` auto-detects `signin=1` and `expired=1`, triggering the Sign-In modal to open automatically with an informative amber notification banner explaining the session expiration and presenting Google 1-Click and Email sign-in options.
- **Elimination of Stuck Intro State**: `WellnessWorldGame.tsx` eliminates the stranded `"✨ Đang mở Cõi Sống Khỏe của bạn..."` state when unauthenticated or expired, replacing it with an explicit session-expired notification card and direct re-login CTA button.
- **Automated Chromium Verification**: End-to-end verified via `scripts/test-session-expired-redirect.mjs`.

## Implementation traceability update — 2026-11-07 (Cycle 26: NPC Dialogue Clearance & Mystery Gift Modal Dismissal Resolution)

- **NPC / Lumi Dialogue Clearance & Z-Index Elevation**: Raised `.hc-rpg-lumi-dialogue` z-index to `50` (higher than bottom navigation dock `30`), preventing any clipping under the bottom dock. Raised desktop bottom clearance to `7.8rem` (+31px), tablet `7.5rem` (+26px), mobile `6.8rem` (+48px). Added responsive media query `@media (max-height: 640px)` for short viewports (dock at `0.35rem`, dialogue at `5.4rem`, width `min(360px, 42vw)`), achieving verified +24px clearance on 1024×581 with 0 collision across 7 tested viewports.
- **Mystery Gift Modal Pointer Events & Real Mouse Dismissal**: Added explicit `pointer-events: auto;` in CSS and inline React JSX to `.hc-mystery-modal-backdrop`, `.hc-mystery-modal-card`, `.hc-mystery-close-btn`, and `.hc-mystery-secondary-btn`, overcoming inherited `pointer-events: none` from parent `.hc-rpg-hud-layer`. Added `e.stopPropagation()` on close handlers. Verified via real Chromium CDP mouse clicks (`Input.dispatchMouseEvent`): close button `(X)`, `"Đã hiểu"` secondary button, and backdrop clicks reliably dismiss the modal.

## Implementation traceability update — 2026-11-06 (Cycle 24: NPC Dialogue Clearance & Mystery Gift Box Unboxing System)

- **NPC / Lumi Dialogue Non-Overlapping Clearance**: Fixed `.hc-rpg-lumi-dialogue` z-index (raised to 35) and responsive bottom clearance above the bottom navigation dock across all viewports (`bottom: 6.5rem` desktop/tablet, `6.2rem` mobile <=768px, `5.8rem` mobile <=680px, and `@media (max-height: 540px)` for mobile landscape). Verified positive clearance on Chromium across 1280px (+9.98px), 768px (+21.20px), 390px (+14.11px), 375px (+14.11px).
- **Mystery Gift Box Unboxing System**: Replaced upfront reward names on Top HUD and Day 7 Card with interactive Mystery Gift Boxes (`Hộp Quà Bí Ẩn 🎁`). Integrated `MysteryGiftModal` featuring 3 visual stages: idle hovering box with mystery lock badge and orbiting sparkles, 1.4s unboxing transition with shake anticipation, zoom-in (scale up 1.4x), lid popping off, golden vertical light beam, spinning sunburst rays, and 28 radial confetti particles, concluding in the revealed reward presentation with rarity badges and bonus EXP chips.

## Implementation traceability update — 2026-11-06 (Google 1-Click + Email Auth on World Preview & /play Zero Bouncing)

- **World Preview Modal Dual Authentication**: The "Tạo hành trình của bạn" modal triggered by `[BẮT ĐẦU HÀNH TRÌNH]` features a prominent top **[ Tiếp tục với Google (1 chạm vào game) ]** button with authentic 4-color Google logo SVG. Pending journey details (questId, profile, wellness plan) are cached in `localStorage` (`healthclues-pending-journey-local`) and restored seamlessly via `signInWithOAuth("google", locale, "/play?activation=complete")`. Also offers Email Magic Link option with pre-checked consent.
- **Top Status Bar Quick Sign-In**: World Preview map (`HealthCluesWorldPreview.tsx`) includes a top status bar `[Đăng nhập]` button, enabling players to sign in at any time.
- **Zero Auto-Redirecting on /play**: `hasResumableQuizDraft` excludes `view === "world_preview"`. Guests navigating directly to `/play` see the HealthClues Welcome landing page with `[Đăng nhập]` and `[Bắt đầu hành trình]` buttons.
- **Dynamic Google Email Linking**: `WorldAuthCallback` and `WellnessWorldGame` dynamically match and associate empty-email OAuth pending journeys, persisting the user's discovery profile and unlocking their backpack directly upon return.

## Implementation traceability update — 2026-11-05 (Mobile-First Smart Routine Assistant Overhaul)

- **Dedicated Daily Reminder Modal & Quick Strip**: The bulky 450px reminder banner on the first fold of "Hành trình của tôi" is removed from the habit list. It is replaced by a sleek 32px quick strip (`.hc-journey-reminder-quick-strip`) with direct access to a dedicated standalone Daily Reminder modal (`DailyReminderPanel`).
- **Interactive Companion Add Habit Dialog (Zero Scroll)**: Modal dialog for adding habits with the Companion (`<CompanionAddHabitModal />`) is strictly constrained to a single mobile screen (`max-height: min(90vh, 520px); overflow: hidden;`) with zero vertical scrollbars. Supports 4 one-tap quick suggestion pills, custom text input, and an interactive celebration step awarding +20 EXP upon persistence to Supabase via `POST /api/healthclues/plan`.
- **My Journey Responsive 50/50 Grid Tabs & Clean Typography**: Tab bar (`.hc-journey-nav-tabs`) uses an equal 50%/50% grid (`[🌱 Thói quen (N)]` | `[🗺️ Lộ trình 30 ngày]`). Add habit button text is standardized to `Thêm thói quen` (no duplicate `+`). Goal actions (`[Đổi / Bỏ]` and `[Xem chi tiết]`) are placed in a dedicated separate row.
- **Nhiệm Care HUD Multi-line Typography**: Goal titles wrap up to 2 lines without ellipsis (`...`) clipping, using compact `font-weight: 500` and slender `+10 EXP` badges.
- **Mobile Bottom Navigation Dock**: Mobile dock is streamlined to exactly 3 primary actions: `[Bản đồ]`, `[Hành Trình]`, `[Hôm nay]`.

## Implementation traceability update — 2026-11-05 (Comprehensive Acceptance Round)

- **Quick-Activate Session Bypass Decommissioned**: `/api/healthclues/account/quick-activate` permanently disabled with HTTP 410 Gone. All client instant activation buttons removed. E2E and owner demo authentication strictly verified via local Supabase Auth + local Mailpit.
- **Sleep Valley & Luna Persistence**: Bound Sleep Valley permanently to `questId === "sleep-better"` and companion Luna. Preserved across magic link redirect and reload.
- **Non-Blocking Advisor**: Immediate "Skip plan and preview World" button available during Advisor loading; skip leads to clean World Preview without auto-invoking failed plan modals.
- **Walk First, Then Talk**: NPC/landmark clicks initiate pathfinding walk animation only. Modal opens strictly upon arrival and clicking the "Talk" or "Interact" banner.
- **Truthful Level Progression & Dynamic Daily Care**: Level 1 with 0 / 50 EXP for new accounts; Card 1 dynamically renders active goals from `wellnessGoals` or honest empty state.
- **Mobile Viewports (320px, 390px, 430px)**: 3-button bottom dock (`Bản đồ · Hôm nay · Túi đồ`), card ellipsis overflow, and suppressed HUD during active modal dialogs.

## Implementation traceability update — 2026-11-05 (Mobile Viewport Adaptation)

- **Mobile Navigation Dock**: Bottom navigation transforms on mobile (`<= 680px`) into a fluid horizontal-scrolling dock with readable pill labels (`font-size: 0.72rem` / 11.5px) without force-squeezing 6 items into one fixed cramped row. Content area retains safe-area bottom clearance.
- **Quiz Question 2 Mobile Streamlining**: Compacted top adventure rail height, fixed duplicate breadcrumbs (`✦ HEALTHCLUES REALM`), changed age confirmation to default unchecked (`ageConfirmed = false`), and introduced a sticky bottom CTA tray supporting 2-line wrapped text with zero horizontal overflow across 320px–430px viewports.
- **World Preview Mobile Isolation**: Repositioned companion Lumi speech bubble to bottom-left with interactive one-click collapse/reopen, avoiding collisions with map markers and the bottom-right "START YOUR JOURNEY" action button.

## Implementation traceability update — 2026-11-05 (Concrete Action Titles)

Concrete generated action titles are supported by the existing signed Advisor goal contract with bounded legacy-title compatibility. This is presentation/proof compatibility only: no database schema, World identity, or account authorization boundary changes. Detailed behavior and evidence are recorded in `BUSINESS_RULES.md`, `UI_UX_SPEC.md`, `DECISIONS_AND_ASSUMPTIONS.md`, `ACCEPTANCE_TESTS.md`, `IMPLEMENTATION_PLAN.md`, and the dated V1 report.

## Daily Companion Email Reminder & Smart Bundling Specification — 2026-11-04

- **Top Reminder Scheduler Invariant (`.hc-journey-reminder-banner`)**:
  - Located on top of "Hành trình của tôi" (`MyJourneyPanel`), immediately above the 30-Day Monthly Journey Map.
  - Integrates companion avatar (Lumi / Luna) with explicit opt-in toggle button (`[ Bật nhắc nhở hằng ngày ]` / `[ Đang bật nhắc nhở ]`).
  - Supports user-selected daily send time (default `20:00 (Buổi tối - Khuyên dùng) ⭐`) and browser/international IANA timezone selector.
  - Changes immediately persist to `healthclues_email_preferences` via `/api/healthclues/reminders`.
- **1 Email/Day Smart Bundling Specification**:
  - Daily Companion is the primary communication vehicle, defaulting to exactly 1 email/day sent at the user's selected hour in their country timezone.
  - Smart Bundling combines:
    1. Active habit goals checklist (`Hôm nay bạn có N mục tiêu đang theo dõi`).
    2. Daily bite-sized knowledge tip from verified HealthClues Evidence Library.
    3. Return to game CTA button (`Quay lại thế giới của tôi 🧭`).
  - Milestone achievements and new discoveries are bundled into the daily email or optional weekly summary, preventing notification fatigue and unsubscriptions.
- **Rendered Email Preview Invariant (`.hc-email-preview-modal`)**:
  - Tapping `[ Xem trước email mẫu ]` renders a realistic email client mockup displaying the companion header, active habits checklist, daily bite-sized knowledge tip, return-to-game CTA button, and non-sensitive medical privacy guarantee.

## 2-Choice Daily Check-in & Proportional Day Node Stars Specification — 2026-11-04

- **2 Binary Options Invariant (`DailyCheckinDialog`)**:
  - Daily habit check-in presents active habits directly with strictly 2 binary choices:
    1. `Hoàn thành` (`status: "done"`)
    2. `Không hoàn thành` (`status: "not_yet"`)
  - Intermediate mood surveys and 5-status tool options ("Skipped", "Don't Remember", "Not Suitable") are prohibited from the check-in modal.
- **Inline Uncompleted Reason Note**:
  - When `Không hoàn thành` is selected on any habit, an inline text input appears: `+ Lý do chưa hoàn thành: [Nhập lý do...]`.
  - The reason text is compiled into the check-in note upon save and displayed in the day detail popover.
- **Proportional 5-Star Rating Preview**:
  - Top card displays 5 stars and live rating (`X/5 sao · X/N mục tiêu hoàn thành`).
  - Proportional star formula: `calculateStars(done, total) = done === total ? 5 : Math.min(4, Math.max(1, Math.round((done / total) * 5)))`.
  - 100% completed: `🎉 Hoàn thiện hết (5 sao nhỏ)`.
- **Monthly Journey Map Trail Day Node Stars (`.hc-day-node-stars`)**:
  - Positioned directly above completed day nodes on the golden road.
  - 5 small stars row: golden stars for completed ratio, empty stars for remainder.
  - 5-star days retain the green checkmark badge `✔`. Partial-star days omit the checkmark.
  - Interactive day detail popover displays:
    - Date and status pill (`3/5 sao`).
    - 5-star row with score caption.
    - Uncompleted reasons block: `Lý do chưa hoàn thành: • {Habit}: {Reason}`.
    - Personal reflection quote.

## Interactive Monthly Wellness Journey Map & Goals Redesign — 2026-11-03

- **Core Paradigm Shift — Interactive Cozy Fantasy Journey Map**:
  - Re-engineers the Quest Journal into a two-tier interactive experience matching the user reference design:
    1. **Upper Tier: Interactive Monthly Journey Map (`MonthlyJourneyMap`)**:
       - Full-bleed panoramic cozy landscape banner (`journey-map-panorama.png`) with rolling hills, distant castle spires, waterfalls, stone bridge, glowing pet companion, and stone archway portal.
       - Floating top control bar: Month navigation pill (`< [icon] Tháng 11 >` / `< [icon] November >`) and visual legend pill (`✔ Đã hoàn thành`, `⭐ Hôm nay`, `◯ Sắp tới` / `Completed`, `Today`, `Upcoming`).
       - Left floating info card: `Lộ trình 30 ngày`, description, and dark glass progress box with leaf icon, bold progress percentage (`40%`), completed count (`12 / 30 ngày đã hoàn thành`), and golden progress bar.
       - Serpentine road trail: 4 week rows labeled with carved wooden signs (`Tuần 1`..`Tuần 4`), connected by an organic continuous SVG golden road with drop-shadow glow filter (`#trail-glow-fx`).
       - 30 day nodes with state transitions (`completed`, `today`, `future`, `unrecorded`) and interactive detail popover on click with date, status, and direct `[📝 Điểm danh hôm nay]` CTA.
       - Destination Gateway: Glowing stone portal arch on the right marking the 30-day destination milestone.
    2. **Lower Tier: Active Goals Section ("Mục tiêu đang theo đuổi")**:
       - Header: Golden target emblem (`🎯`), section title `Mục tiêu đang theo đuổi`, caption `Những thói quen sức khỏe bạn đã chọn trong hành trình này.`, and `Xem toàn bộ kế hoạch >` button.
       - Ultra-compact single-layer card structure (~85px-95px height) rendering the concrete chosen habit outcome directly as title (e.g. "Đọc sách 10 phút trước khi ngủ", "Uống ít nhất 6–8 cốc nước (≈ 1,5 – 2 lít) trong ngày").
       - 3D illustrated icon frames (`ref_card_food.png`, `ref_card_movement.png`, `ref_card_hydration.png`) and `HealthCluesGameIcon` fallback.
       - Status pill (`Đang hoạt động` / `Active`, `Để dành xem sau` / `Saved for later`).
       - Bottom action row: `⭐ +20 EXP` badge, deduplicated schedule pill (e.g. `⏱ 10 phút · Hằng ngày · 30 ngày`), quick `[✓ Ghi nhận]` check-in button, and `Xem chi tiết` collapsible disclosure toggle.
       - Collapsible disclosure (`hc-quest-disclosure-content`): reveals parent topic rationale, relevance focus, exact tracking instructions, and personal notes on-demand.
       - Encouraging companion empty state with Luna/Lumi speech bubble when 0 goals are active.
    3. **Auxiliary Section: Equipped Herbs & Practices**:
       - Two side-by-side horizontal cards for `Equipped Herbs` (`Thảo mộc đã chọn`) and `Equipped Practices` (`Thực hành đã chọn`) with empty guidance and direct world station navigation buttons.
- **Invariants & Safety**:
  - `document.querySelectorAll('[data-inventory-section]')` strictly matches `["checklist", "herbs", "practices"]`.
  - `data-journey-goal={goal.goalId}` preserved on all goal cards.
  - 0 hardcoded goals or check-in numbers: fully bound to player's actual data in timezone.

## Wayfinder's Quest Journal (My Journey UX/UI Redesign) — 2026-11-03

- **Core Paradigm Shift — Cozy Fantasy Quest Journal**:
  - Replaces nested dark boxes and dashed borders ("hộp lồng trong hộp") with a unified, high-contrast warm parchment scroll canvas (`#fffdf8` to `#f4e9d0`), burnished gold gilded borders (`#dfc982`), and deep emerald headers (`#13392d`).
  - Answer-in-3-Seconds Architecture:
    1. *Pursuing Goal*: Prominent Wellness Focus Ribbon (`[data-journey-tour-section="focus"]`) with carved gold emblem, Quiz focus label, 2-week target badge, and companion encouragement.
    2. *Selected Habits*: Daily Checklist Quest Cards (`[data-inventory-section="checklist"]`) with 32px 3D game icons, category color tones, +20 EXP tags, target/cadence pills, and progressive disclosure toggles.
    3. *Next Action*: Persistent Action Footer Bar with live summary badges (`✨ 2 Nhiệm vụ đang thực hiện · 🌿 0 Vật phẩm đã trang bị`) and prominent primary CTA (`📝 Điểm danh hôm nay` or `✦ Khám phá gợi ý thói quen`).
- **Progressive Disclosure & Cognitive Overload Reduction**:
  - Vital information (habit title, cadence, EXP, status) is visible up-front; detailed clinical rationale ("Why this goal", "How to try it", personal notes) is tucked into an accessible disclosure toggle (`aria-expanded`, tactile chevron button).
  - High-contrast typography: deep forest text (`#13392d`, `#43584d`) on ivory parchment replacing 9px low-contrast micro-copy; WCAG AAA compliant (7.8:1 contrast).
- **Warm Companion Empty States**:
  - When the player has 0 active goals or unequipped stations, Luna/Lumi provides warm, narrative-driven guidance with direct one-click exploration buttons (`🧭 Review saved Quiz suggestions`, `🧭 Đến Vườn Thảo Mộc`, `🧭 Đến Khu Tĩnh Tâm`).
- **5-Viewport Responsiveness & Accessibility**:
  - Fluidly scales across Desktop (1440px), Laptop (1280px), Tablet (768px), Mobile (390px), and Mobile Small (360px).
  - Retains all automated test invariants: `data-inventory-section` strictly equals `["checklist", "herbs", "practices"]`, 0 horizontal overflow, no tab splitting.

## HealthClues Dynamic AI Habit Icon Mapping & Structured Gemini Architecture — 2026-11-03

- **Core Architecture & Zero-Image-Gen Invariant:**
  - Implements dynamic mapping of icons for real-time Gemini-generated habits and player-authored goals without AI image generation, without secondary LLM lookups, and without external icon downloads at runtime.
  - Canonical taxonomy of 48 dot-notation keys mapped to local, sanitized, commercially licensed vector SVGs across 8 primary domains: `movement.*`, `nutrition.*`, `wellness.*`, `sleep.*`, `hydration.*`, `lifestyle.*`, `herbs.*`, `knowledge.*`, and `quests.*`.
- **Single-Turn Structured AI Output:**
  - `buildGeminiWellnessPlanResponseSchema()` enforces strict structured output returning `category` (from `VALID_AI_HABIT_CATEGORIES`) and `icon_key` (from `VALID_AI_HABIT_ICON_KEYS`) in the exact same response as habit titles and A/B options.
  - Supported plan capacity extended up to 12 items, enabling up to 10 habits returned in a single inference without triggering schema mismatches.
- **Deterministic 4-Tier Icon Fallback Engine:**
  - Tier 1: Exact matching against `VALID_AI_HABIT_ICON_KEYS`.
  - Tier 2: Category fallback mapping unknown/hallucinated keys to deterministic category fallbacks (`AI_CATEGORY_FALLBACK_ICONS`).
  - Tier 3: Semantic keyword & action-verb matching for bilingual titles/reasons/notes.
  - Tier 4: Safe universal fallback `quests.target`. Prevents UI crashes and broken images under any condition.
- **Client-Side Autonomy & Persistence Contract:**
  - Player custom notes are mapped client-side at creation time without calling Gemini.
  - `iconKey` is persisted in `WellnessPlanGoal` and HMAC-signed in `SignedClaims`. Page refreshes and revisits preserve identical icons.
- **Internal Owner Studio (`/admin/healthclues-icon-gallery`):**
  - Owner-exclusive studio displaying 86 total icons, 55 active in-game icons, and 48 Gemini AI dot keys.
  - Includes a real-time Live AI Resolver Simulator with instant badge verification (`✓ Gemini Approved Key`).

## HealthClues Personalized Plan Reference Overhaul & Void Elimination — 2026-11-03

- **Reference-Accurate Plan Layout (`healthclues-plan-reference`):** Transformed the Personalized Wellness Plan into a warm parchment scroll (`#fcf8ee` to `#f6edd7`) featuring magical companion Lumi (`lumi_fox_clean.png`) with a welcoming speech bubble, ornate emerald-gold plaque header (`✦ Kế hoạch dành cho bạn ✦`), high-resolution 3D category artwork (`ref_icon_drink.png`, `ref_icon_movement.png`, `ref_icon_nutrition.png`, `ref_icon_sleep.png`), custom green checkboxes with checkmark (`✓`), and right-side interactive Option A (`[Khởi Động]`) / Option B (`[Bứt Phá]`) / Custom (`Tự điều chỉnh`) options.
- **In-Game Void Elimination:** Resolved the asymmetrical grid void in the "Hành trình của tôi" (My Journey) modal by making the suggestions section span full-width (`grid-column: 1 / -1; width: 100%`) on a clean parchment canvas, removing dead space while retaining full RPG HUD and contract compatibility.
- **Contract & Test Continuity:** Preserved automated test attributes (`data-healthclues-plan-builder`, `data-ai-goal`, `data-selected-goal-count`, `data-advisor-status`, `.hc-game-icon` inside goal items).

## Multi-Select Discovery Quiz & Expansive Landscape Quest Codex — 2026-11-03

- **Two-Question Discovery Multi-Select:** Screen 1 supports multi-selection of primary health concerns. Screen 2 combines lifestyle factors across all chosen concerns into an aggregated list, allowing multi-select for self-reported lifestyle circumstances.
- **Expansive Landscape RPG Codex ("Hành trình của tôi"):** Replaced the narrow 432px drawer with an expansive 78rem landscape RPG modal (`width: min(95vw, 78rem); max-height: min(92vh, 54rem);`) with runic gold borders and 2-column desktop layout.
- **Quest Slots HUD (3 Slots) & Live Gemini Advisor:** Integrates live `gemini-3.8-flash` recommendations with 3-slot HUD (`Slot 1`, `Slot 2`, `Slot 3`), EXP badges (`+20 EXP`), localized difficulty badges (`[Start Small] / [Khởi Động]`, `[Level Up] / [Bứt Phá]`), and interactive auto-equipping.

## Quiz-to-World handoff verification update — 2026-10-31

The existing encrypted activation handoff must preserve the user's bounded `originalNote` on a saved personal-goal draft. Build 3269 Chromium E2E verified the full Quiz → confirmed Plan → same-origin Mailpit email verification → authenticated World → same Plan/original note flow. No new schema is introduced. Current local gameplay is verified, but real-time Codex/LLM generation and human-reviewed recommendation coverage remain unavailable; overall product/production readiness is not accepted.

## Phase 10A — Post-Quiz Wellness Plan (2026-10-30)

Owner-approved flow extends Quiz Reveal with optional recommendation review and user-confirmed plan before World activation. It reuses existing recommendation-eligible Catalog, authenticated World/profile and encrypted pending journey. Plan is private, optional, non-prescriptive; goals are self-reported definitions. No Home Evolution/Challenge/Boss changes are included in Phase 10A. Source is implemented; browser persistence acceptance is pending.

## Local reminder implementation update — 2026-10-30
The existing reminder queue now has an isolated Owner Demo Mailpit delivery mode, guarded by demo flag, loopback endpoint, random internal worker token, active consent and atomic row claim. A synthetic authenticated browser acceptance observed one generic message, then no duplicate on worker repeat. This is local proof only; stale-claim crash recovery and production/cloud scheduling/provider are not implemented. See the Vietnamese final acceptance report.
## Lumi-guided journey and Gout playbook — 2026-10-30
The authenticated local game now stores a private optional nickname in the existing profile JSON and adds a resumable guide through discovery, Toolkit Summary and optional reminder setup using the existing guide state. Summary data is read from existing Backpack, Collection and Care Plan systems and remains separated. A deterministic Gout playbook distinguishes acute symptoms, long-term interest and general education; it consumes existing Quiz context and makes no diagnosis. Optional NPC free-text chat uses a server-only provider adapter gated by consent, feature flag and explicit paid-provider approval; Owner Demo forces it off and shows a truthful unavailable state. Local browser status and limitations are in `CURRENT_STATE.md` and the final acceptance report. This is not production AI or reminder-email delivery.
# HealthClues — Master Product Specification

## MP20 approved discovery update — 2026-11-02

For new `/play` onboarding, keep the MP19 order Welcome/language → choose a playable World → discovery → existing account activation → direct regional entry. Discovery is exactly two screens: select one concern (Sleep Valley shows only sleep concerns; HealthClues Realm shows health topics including Gout, weight, glucose, pressure and Other), then optionally multi-select context factors that vary by concern. This deterministic reviewed question bank must render without waiting for Gemini. “None” and “Unsure” are valid, and the second screen may be left empty. Custom concerns use neutral context options and optional note, never improvised medical assertions. The legacy 96-question Quiz is retained for returning users.

The onboarding context stores stable concern/factor IDs and labels through the existing encrypted handoff and profile JSON. Gemini may use only this reported context plus selected World, locale and explicit safety state; do not infer diagnosis, habits, medication changes or fluid targets. The selected concern is represented through the existing adaptiveDiscovery contract; no separate health-data table is introduced.

My Journey is the central inventory surface for recommendations and chosen items. Recommendations are suggestions, not active goals until the player explicitly chooses a valid implementation. Herb and practice previews may link to the Botanist/Wellness Guide but may not equip directly; NPC proximity, content eligibility and existing authenticated equipment API remain required. No approved eligible Botanist record is implied by this design.

## Universal Post-Quiz Wellness Plan clarification (2026-10-30)

### Real-time Codex adapter safety gate (2026-10-30)

Master Prompt 11 requests Codex-backed dynamic checklist generation at Quiz completion. Current implementation remains deterministic; no live model is wired into Quiz or Plan Builder. The inspected Codex SDK 0.166.0 persists threads under `~/.codex/sessions` and exposes no ephemeral Thread option, while its CLI `--ephemeral` flag is not forwarded by the SDK. Do not submit player Quiz/health data through this SDK configuration. A separate non-persistent local inference worker or a supported SDK retention control plus explicit external-processing consent is required before implementation/acceptance. See `reports/HEALTHCLUES_REALTIME_CODEX_ADVISOR_BLOCKER.md`.

Latest acceptance status: the selected everyday-habit checklist and user-confirmed Plan were browser-verified in local synthetic Gout and Sleep accounts on `http://127.0.0.1:3261/play`, including same-World reload persistence and cross-account 404 protection. This demonstrates the flow only; no live LLM is connected, all current templates are TEST ONLY / not human-reviewed, and email verification callback on the new port remains unverified. See the dated acceptance report.

Post-Quiz planning uses one topic-configured habit library and one deterministic retrieval, ranking and safety pipeline. Gout and Sleep are sample topic configurations, not application boundaries. Configuration recognizes Gout, Type 2 Diabetes, Sleep/Insomnia, Migraine, Weight Management and General Wellness; missing appropriately reviewed content produces a truthful coverage gap. The current checklist does not call a live LLM: the UI identifies deterministic personalization. It excludes botanicals, supplements and detailed therapies; those remain in-game NPC discovery and require explicit confirmation before becoming a new plan revision. Owner-demo habit candidates are TEST ONLY and are not editorially approved. See `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md`.

## Personalized discovery engine implementation — 2026-10-30

The RPG now uses the existing Quiz profile and versioned Catalog through one shared deterministic recommendation service (`hc-personalized-rules-v1`). Candidates are retrieved from reviewed Catalog versions; isolated TEST ONLY fixtures are permitted only in the loopback Owner Demo. Reasons come from saved topic/goals/preferences/time plus Catalog tags. Unknown safety context is not a negative answer and cannot establish equipment eligibility. Luna/Lumi and each NPC use the same server API. Suggestions are optional; the player controls save, dismiss, track and equip. Full behavior, local-browser results and release limits are in the latest dated final acceptance report. This implementation is not a diagnosis, prescribing or efficacy engine.

## High-fidelity scene blueprint and stone path navigation — 2026-11-05

The shared explorable 16:9 Region Map scene is upgraded to the high-fidelity painted alpine valley scene (`media_1793858483481_d1785343.jpg`) deployed as 1600×900 WebP (`healthclues-realm-scene-blueprint.webp` and `sleep-valley-scene-blueprint.webp`).
- Landmark and approach anchors are updated in `REGION_ANCHORS` and `REGION_APPROACHES`:
  - Knowledge Library: Alpine wooden lodge with clocktower and book banner `[📖]` (anchor: `24%, 24%`, approach: `27%, 48%`).
  - Food & Botanical Garden: Glass greenhouse with potted herbs (anchor: `73%, 28%`, approach: `72%, 46%`).
  - Wellness Sanctuary: Open wooden pavilion gazebo with lotus banner `[🪷]` (anchor: `81%, 51%`, approach: `80%, 72%`).
  - Adventure Camp / Daily Care: Cottage with striped awning and heartbeat banner `[💓]` (anchor: `18%, 47%`, approach: `18%, 72%`).
  - Central Stone Fountain: Fountain basin with glowing leaf crystal (anchor: `49%, 28%`, approach: `49%, 46%`).
  - Wooden Pier / Dock: Lake dock (anchor: `84%, 78%`, approach: `84%, 84%`).
  - Central Hub Plaza: Paved leaf circle serving as initial player spawn and central road junction (`48%, 77%`).
- Walkable route network (`REGION_NAVIGATION`) accurately traces all 12 stone paths visible in the image, eliminating terrain clipping.
- Player character and Pet spawn at the Central Hub Plaza facing forward into the world, with the `+20 EXP` celebration sunburst overhead.
- NPCs are stationed at their respective buildings: Botanist at Greenhouse, Trail Explorer at Camp, and Wellness Guide at Pavilion.
- Three signature floating landmark pills (`Knowledge`, `Botanist`, `Wellness Guide`) float prominently above the buildings; decorative square icon badges on building walls are removed.

## Current playable-region scene update — 2026-10-30

The current renderer presents Sleep Valley and HealthClues Realm on a shared 16:9 scene blueprint and connected authored routes. Landmark targets remain stable across viewport sizes; desktop shows the entire scene while portrait camera framing follows the player. Screenshot QA moved the Camp hotspot onto the clear foreground without changing its arrival point, compacted the first Lumi greeting and moved NPC keyboard focus to a ground halo. Scenes keep distinct artwork; navigation never requires bridge crossings. This is implemented and browser-tested on isolated owner build a10, with art review and physical-device QA still pending. It does not change the eight-region Overworld, the two playable region policy, or the Quiz-selected Journey.

## Region scene scope — 2026-10-29

The two currently playable detailed regions use a compact shared scene layout: primary stations sit on one short connected walkable area near camp. River and bridge traversal is decorative/optional, not a required gameplay gate. Six other Overworld regions remain visible Coming Soon. This is an implementation direction for scene navigation; it does not imply completion of the remaining Knowledge mini-game/Skill features.

## Isolated final-demo evidence update — 2026-10-30

Fresh authenticated Chromium evidence on owner build `app-build-final-a7` verifies the approved two-map flow and the current TEST ONLY learning/reward slice. Four unique mini-games and four persisted Skill aggregates are implemented and browser-verified; a focused source test covers all five Skill thresholds. Boss key/unlock and the in-region Rewards station persist in the local World. These synthetic fixtures are not reviewed HealthClues education, and this evidence does not imply production readiness or completion of human art/content, physical-device, performance or release review. See `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

## Local demo evidence update — 2026-10-29

Current local evidence and blocking status are maintained in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. The isolated owner build is still available at 3248; optional Pet Check-in with explicit private-note opt-in is browser verified. Local synthetic Catalog/Knowledge/Boss fixtures are not human-reviewed content. New API labels/filtering and a topic-matching migration are source-only until the isolated build succeeds; D: exhaustion currently blocks that build. This does not change product scope or imply production readiness.

## 1. Tóm tắt
HealthClues là nền tảng web-first khám phá wellness có cá nhân hóa, tri thức được review, hành trình dài hạn và cộng đồng có opt-in. Cốt lõi là **một My Wellness World bền vững cho mỗi thành viên**, gồm các nhánh chủ đề, hành trình và hoạt động. Discovery → Choose → Experience → Track → Reflect → Share → Inspire. Nội dung và trải nghiệm cá nhân không phải chẩn đoán hoặc chứng cứ điều trị.

## 2. Tầm nhìn và nguyên tắc
1. Hỗ trợ khám phá và lựa chọn tự nguyện; không hứa hẹn kết quả sức khỏe.
2. Một World chính, nhiều nhánh và journey có thể cùng tồn tại; tạo mới không xóa lịch sử.
3. Check-in là lựa chọn hàng ngày; milestone là phần thưởng/tổng kết chứ không phải lịch check-in.
4. Thừa nhận “Not Yet”, “Skipped”, “Not Suitable”; không phạt sự trung thực và không suy diễn bỏ check-in là thất bại.
5. Riêng tư mặc định; public là projection được chọn trường và có thể thu hồi.
6. Chỉ nội dung đã qua review và đang hiệu lực mới đủ điều kiện đề xuất tự động.
7. XP ghi nhận học hỏi, phản ánh và tham gia; không khuyến khích rủi ro hay công khai dữ liệu nhạy cảm.
8. Tiếng Anh cho giao diện người dùng; tiếng Việt cho Admin và tài liệu.

## 3. Người dùng mục tiêu
- Guest: SEO, ebook, tìm kiếm, social, email hoặc link giới thiệu; xem quiz/discovery công khai hạn chế.
- Member: người trưởng thành muốn tìm hiểu thói quen, tổ chức hành trình và tự phản ánh.
- Journey Owner: member kiểm soát journey và từng trường chia sẻ.
- Moderator/Reviewer/Admin: review tri thức, xử lý báo cáo, vận hành cấu hình và kiểm tra audit theo quyền tách biệt.
V1 cá nhân hóa cho người từ 18 tuổi; quiz không chẩn đoán, không dành cho khẩn cấp.

## 4. Hành trình sản phẩm
1. Đến từ Botly/SEO/ebook/referral → quiz tiếng Anh có consent và skip.
2. Quiz thích ứng thu mục tiêu, sở thích, lịch rảnh, thói quen, ưu tiên/giới hạn tự nguyện.
3. Tạo Wellness Profile mô tả sở thích, không nhãn bệnh hay chẩn đoán.
4. Đề xuất tối đa 3 hoạt động/tài nguyên đã review, nêu lý do, thời lượng, nguồn, evidence, safety note và lựa chọn thay thế.
5. Hiển thị “Real People, Real Wellness Journeys” chỉ khi chủ sở hữu bật chia sẻ.
6. Chọn hoạt động để tạo/tiếp tục một World, nhánh và journey; cá nhân hóa lịch.
7. Check-in hằng ngày trong 30–60 giây; ghi trạng thái nhiều hoạt động, habit-to-reduce và ghi chú riêng tư.
8. Cập nhật map, reflection, XP và milestone chống trùng.
9. Email reminder chỉ sau opt-in, theo múi giờ/tần suất và có unsubscribe.
10. Tiếp tục, thêm/đổi/tạm dừng hoạt động hoặc nhánh; lưu lịch sử; chia sẻ từng phần tự nguyện.

## 5. Danh mục feature
| ID | Feature | Nội dung / trạng thái hiện tại trong source |
|---|---|---|
| HC-F001 | Adaptive Quiz & consent | Quiz HealthClues và bank JSON hiện có; nhánh thích ứng một phần; chưa chứng minh guest progress/account resume hoàn chỉnh |
| HC-F002 | Wellness Profile | profile JSONB migration và cloud client hiện có; chưa phải profile history/field-level consent hoàn chỉnh |
| HC-F003 | Knowledge Library | Botly articles/ebooks/candidate catalog có; trạng thái HealthClues reviewed phải kiểm tra dữ liệu live |
| HC-F004 | Recommendation Engine | discovery matching/reviewed filtering có trong source; tối đa 3; chưa journey-aware personalization |
| HC-F005 | My Wellness World | đề xuất mới: persistent map/branches/journeys |
| HC-F006 | Daily Check-in | đề xuất mới |
| HC-F007 | Personal Journal | đề xuất mới; note mặc định private |
| HC-F008 | Activity Management | đề xuất mới; giữ lịch sử khi đổi/pause |
| HC-F009 | Community Journeys | đề xuất mới |
| HC-F010 | Moderation & Privacy | admin review tri thức hiện có không đồng nghĩa community moderation; phần community mới |
| HC-F011 | XP & Rewards | đề xuất mới |
| HC-F012 | Email Notifications | Botly có email/newsletter và Night Companion scheduler; reminder HealthClues là mới/tái dùng nền tảng cần kiểm chứng |
| HC-F013 | AI Journey Companion | đề xuất tương lai có giới hạn retrieval và safety |
| HC-F014 | Admin & Reviewer | discovery review page/API/audit hiện có trong source; community moderation, reward admin và analytics mới |
| HC-F015 | Ebook & Growth Integration | ebook catalog/funnel/download capture hiện có; journey conversion mới |
| HC-F016 | Wellness Toolkit — Personal Wellness Equipment | Đề xuất mới: chuẩn hóa Catalog, Usage Method, My Toolkit, usage history và community matching theo ID |

## 6. Phạm vi triển khai theo giai đoạn
- Phase 1: quiz → plan → one Wellness World (foundation + map, profile migration evolution).
- Phase 2: daily check-in, private journal, reminder, milestone, XP ledger.
- Phase 3: community public projection, follow, report/moderation.
- Phase 4: regions, map unlocks, knowledge mini-games, reward catalog.
- Phase 5: AI companion và continuous personalization.
Chi tiết deliverables/gates trong `IMPLEMENTATION_PLAN.md`. Không phase nào được tự động triển khai.

## 7. Tích hợp Botly
Tái sử dụng website/app router, Supabase project hiện tại `rswmadukvegraxfcdbcb`, Vercel hiện tại, auth/session hiện có (khả năng và RLS cần xác nhận), wellness articles/translations, ebook catalog/lead flow, newsletter/email service và admin shell nếu review kỹ thuật xác nhận phù hợp. Không tạo backend/project riêng. File baseline migration là snapshot/repository artifact, không phải bằng chứng production. Không tác động schema Growth ngoài cơ chế release được phê duyệt.

## 8. Metrics (proposed)
North star: tỷ lệ thành viên có ít nhất 3 ngày active check-in trong 14 ngày đầu sau khi tạo World, phân tích theo cohort; không dùng như health outcome. Funnel: quiz start/completion, profile consent, recommendation view/save/start, World creation, D1/D7/D30 return, check-in completion/time, activity pause/change, opt-in email delivered/unsubscribed, public share opt-in/revocation, report response time, recommendation safety incident. Chỉ thu analytics tối thiểu, không gửi nội dung sức khỏe/ghi chú.

## 9. Ngoài phạm vi
Chẩn đoán, kê đơn/liều dùng, theo dõi điều trị, emergency triage, tuyên bố khỏi bệnh, bắt buộc công khai, native mobile app, tự động duyệt y khoa, tự động copy journey, standalone Supabase/backend, Botly Growth changes.

## 10. Product acceptance
- Mỗi member có tối đa một World active chính; nhiều nhánh/journeys.
- Check-in ngày độc lập với milestone; thiếu ngày không sinh dữ liệu giả hoặc “missed” check-in.
- Notes private, public projection tách vật lý/logic và chỉ phát hành allowlisted fields.
- XP/idempotency và mọi milestone chống cộng trùng.
- Chỉ approved, active, unexpired content đủ điều kiện recommendation.
- A→B discovery không cấp quyền đọc private journal và không sao chép hoạt động rủi ro.
- User có thể export/delete theo retention policy được chốt; delete share không xóa journey đã cá nhân hóa của B.
- Không yêu cầu Supabase mới; mọi thay đổi tương lai qua approval gate.

## 11. Traceability
| Feature | Use cases | Rules | UI | Data | Tests |
|---|---|---|---|---|---|
| F001–002 | UC01–03, UC24 | BR01–04 | S01–03 | Profile, quiz response/consent | AT01–03, AT22 |
| F003–004 | UC04–05, UC26 | BR05–08 | S03–04, S15 | Knowledge, source, recommendation | AT04–06, AT20 |
| F005 | UC06, UC25, UC30 | BR09–12 | S05 | World/branch/journey | AT07, AT16 |
| F006–007 | UC07–09, UC29 | BR13–17 | S06–07 | Check-in/activity state/journal | AT08–10, AT17 |
| F008 | UC10–12 | BR18–20 | S08 | User activity/version | AT11 |
| F009–010 | UC13–16, UC27–28 | BR21–25 | S09–11 | Public projection/follow/report/audit | AT12–14, AT23 |
| F011 | UC17–18 | BR26–29 | S12 | XP ledger/reward/milestone | AT15, AT18 |
| F012 | UC19–20 | BR30–32 | S13 | Notification preference/job/delivery | AT19 |
| F013 | UC21 | BR33 | S14 | AI interaction metadata (no journal content analytics) | AT20 |
| F014 | UC22–23 | BR34–36 | S15 | Review/moderation/audit | AT21, AT23 |
| F015 | UC02, UC03, UC24 | BR37 | S02–04 | Attribution/ebook refs | AT02 |
| F016 | UC31–38 | BR41–52 | S04, S05, S08, S16–18 | Catalog item/method/toolkit entry/usage record/projection | AT31–40 |

## 12. Ví dụ xuyên suốt 30 ngày
Person A chọn chủ đề gout/uric acid, khai báo muốn khám phá dinh dưỡng và vận động phù hợp, tự chọn theo dõi rau diếp cá như một thực phẩm trong khẩu phần, ghi nhận habit-to-reduce. Hệ thống chỉ trình bày nguồn đã được reviewer xác minh; không gán hiệu quả điều trị, không khuyên liều/tần suất. A tự chọn hoạt động phù hợp và check-in từng ngày nếu muốn. Ngày 7 reflection; ngày 14 thêm hoạt động đã duyệt hoặc self-created rõ nhãn; ngày 30 tổng kết hành vi tự báo cáo. A bật share chọn alias, milestone, tần suất và reflection đã biên tập; notes vẫn private. B tìm public projection, follow, rồi Start My Own Journey: matcher tạo draft riêng, safety-filter lại, B xác nhận; World/progress/note/XP riêng. Khi A thu hồi share, B giữ bản journey đã tạo và provenance “inspired by” nếu B đồng ý, nhưng nội dung A biến mất khỏi public surface/cache theo SLA.

## 13. Module contracts (17 modules)
Các hợp đồng dưới đây nêu input, flow/state/action, quyền riêng tư, UI/data/API dự kiến, acceptance và dependency; chi tiết từng màn hình/rule/schema ở tài liệu chuyên đề.

### M01 — Wellness Quiz Engine (F001)
- **Actor/input:** Guest hoặc Member; quiz version, consent, age confirmation, optional answers/attribution.
- **Flow/state/actions:** `not_started → in_progress → completed | abandoned | expired`; adaptive next-question, skip, back, save/resume, submit/delete.
- **Logic/exceptions:** chỉ hỏi nhánh liên quan; optional/sensitive skip; dưới 18 dừng personalization; catalog/quiz unavailable dẫn generic library; guest expiry không giữ vô hạn.
- **Permission/privacy:** guest session isolated, member own session; marketing/analytics consent tách riêng; không ghi answer vào URL/log.
- **UI/data/API:** S01–03; quiz session/response/consent; thiết kế `POST/PATCH /quiz/sessions`, `POST /quiz/sessions/{id}/submit`.
- **Acceptance/relations:** skip/resume/adaptive/age gate đúng; feeds M02, M04, F015 attribution.

### M02 — Wellness Profile (F002)
- **Input:** consented quiz answers and explicit edits.
- **Flow/states/actions:** preview → active version → superseded/revoked/deletion-pending; view/edit/export/delete/revoke purpose.
- **Logic/exceptions:** descriptive preferences only; field unknown remains unknown; conflicting edits use version check.
- **Permissions/privacy:** owner-only, least collection, no public projection by default.
- **UI/data/API:** S03/profile settings; profile versions + consent history; `GET/PUT /profile`, `DELETE /profile/fields/{key}` (design only).
- **Acceptance/relations:** no diagnosis labels; drives M04 and M13 only where user authorizes; deletion cascades per BR38.

### M03 — Wellness Knowledge Library (F003)
- **Input:** Botly article/ebook, curated candidate, external source and reviewed template.
- **Flow/states/actions:** candidate → review → approved → active → expired/deactivated/rejected; search/filter/read/report broken source.
- **Logic/exceptions:** provenance/claim-level support; missing source or safety flag suppresses; stale link does not imply support.
- **Permissions/privacy:** public read only active fields; reviewer actions audited; no member private data.
- **UI/data/API:** S04/S08/S15; source/template versions/review audit; `GET /knowledge`, admin review endpoints.
- **Acceptance/relations:** only active reviewed versions can feed M04/M13; links to Botly existing articles/ebooks.

### M04 — Recommendation Engine (F004)
- **Input:** consented profile version, active template versions, exclusions and schedule preferences.
- **Flow/states/actions:** requested → matched/empty/unavailable; explain, save, alternative, dismiss, start.
- **Logic/exceptions:** safety filter precedes ranking; max three initial items; no AI-generated fallback; stale version invalidates result.
- **Permissions/privacy:** profile owner request; public endpoint never returns profile reasoning from another user.
- **UI/data/API:** S04; recommendation event stores minimal reason codes; `GET /discoveries?profileVersion=...` server-side auth.
- **Acceptance/relations:** every item has why/source/safety; consumes M02/M03, links M09 public cards.

### M05 — My Wellness World (F005)
- **Input:** authenticated member and confirmed plan/draft.
- **Flow/states/actions:** absent → created → active/archived; create branch/journey, focus, map/list, filter, open node.
- **Logic/exceptions:** one World per user; concurrent create idempotent; multi-year map collapses/paginates.
- **Permissions/privacy:** owner-only map; share is separate consent.
- **UI/data/API:** S05; world/branch/journey; `GET/POST /world`, `POST /branches`, `POST /journeys`.
- **Acceptance/relations:** create new branch never resets history; contains M08 activities and M06 records.

### M06 — Daily Check-in (F006)
- **Input:** local date, chosen activity states, optional habit response/note.
- **Flow/states/actions:** absent → draft → saved → edited; skip day leaves absent; set Done/Not Yet/Skipped/Not Suitable.
- **Logic/exceptions:** one per user/local date; duplicate upsert; revision does not replay XP; DST boundary explicit.
- **Permissions/privacy:** owner only; no public auto-publish.
- **UI/data/API:** S06; check-in/state/revision; `PUT /world/check-ins/{localDate}`.
- **Acceptance/relations:** no fabricated record/penalty; updates M05, M07 and eligible M11 ledger only.

### M07 — Personal Journal (F007)
- **Input:** optional daily/activity reflection and optional user-defined measurement.
- **Flow/states/actions:** private entry active → edited revisions → deleted; timeline/filter/search/export.
- **Logic/exceptions:** deletion/revision follows retention; long timeline paginated; conflict prompts reload.
- **Permissions/privacy:** owner-only; inaccessible to public, routine admin and analytics.
- **UI/data/API:** S07; entries/revisions; `GET/POST/PATCH /journal`.
- **Acceptance/relations:** no note leaks to email/community/AI without explicit scoped consent; linked to M06/08.

### M08 — Dynamic Activity Management (F008)
- **Input:** active reviewed template/version or user-created activity, schedule, effective date.
- **Flow/states/actions:** planned/active/paused/completed/skipped/not_suitable/replaced/archived; add/reschedule/pause/replace/remove.
- **Logic/exceptions:** replacement creates new version, preserves old; withdrawn template stays historical but not selectable; self-created visibly unreviewed.
- **Permissions/privacy:** owner only; reviewer controls template status.
- **UI/data/API:** S08; user activity/schedule versions; `POST/PATCH /journeys/{id}/activities`.
- **Acceptance/relations:** edits do not backfill check-in; feeds M05/M06 and safe templates M03.

### M09 — Real Community Journeys (F009)
- **Input:** active explicit public projection.
- **Flow/states/actions:** discover → view → follow → receive permitted update → start personalized copy.
- **Logic/exceptions:** no matches/revocation/empty timeline states; B flow rematches rather than cloning regimen.
- **Permissions/privacy:** guest limited public; member follow; owner controls projection; no private joins.
- **UI/data/API:** S09–11; public projections/follows/comments; `GET /community/journeys`, `POST /follow`, `POST /start-from`.
- **Acceptance/relations:** A story never acts as evidence; depends on M10 and M04.

### M10 — Community Moderation & Privacy (F010)
- **Input:** owner consent, public fields, report/comment.
- **Flow/states/actions:** private → preview → active → edited/revoked; report → queued/hidden → decision/appeal.
- **Logic/exceptions:** high-risk claims hide pending review; revocation invalidates cache; appeal records separate decision.
- **Permissions/privacy:** roles per matrix; moderator sees public target only by default; access audited.
- **UI/data/API:** S10/S15; projection/consent/report/moderation audit; share/revoke/report/moderator endpoints.
- **Acceptance/relations:** no raw journal access; governs M09 and member deletion M02.

### M11 — Gamification (F011)
- **Input:** validated events and versioned rules/reward catalog.
- **Flow/states/actions:** eligible event → ledger award → level/achievement → optional claim.
- **Logic/exceptions:** idempotency key; no reward for health outcome/herb quantity/overexercise/public disclosure; async failures show pending.
- **Permissions/privacy:** server evaluates; user reads own balance; admin config role audited.
- **UI/data/API:** S05/S12; append-only XP/reward ledger; `GET /rewards`, claim endpoint.
- **Acceptance/relations:** duplicate requests one grant; consumes M06/M03 learning event/Milestone M05.

### M12 — Email Notification System (F012)
- **Input:** separate opt-in, destination, IANA zone, cadence/local time.
- **Flow/states/actions:** off → active → paused/unsubscribed/bounced; schedule/send/retry/manage.
- **Logic/exceptions:** dedupe, DST, quiet hours, unsubscribe cancels pending, safe generic content.
- **Permissions/privacy:** recipient-managed preference; worker service least privilege.
- **UI/data/API:** S13; prefs/jobs/delivery log; `PUT /notification-preferences`, signed manage link.
- **Acceptance/relations:** email failure cannot change journey; connects return to M05 and respects M02 deletion.

### M13 — AI Journey Companion (F013)
- **Input:** explicit request, approved knowledge and user-authorized journey summary.
- **Flow/states/actions:** consented question → retrieval → cited response/refusal → optional user-confirmed action.
- **Logic/exceptions:** unsupported/high-risk → safe boundary; stale source excluded; no auto-write.
- **Permissions/privacy:** opt-in, context scope; never reads others’ private data; vendor retention open decision.
- **UI/data/API:** S14; minimal interaction audit; `/companion` endpoints (Phase 5).
- **Acceptance/relations:** no unsupported claims; reads M03/M05–07 only with user scope.

### M14 — Admin & Reviewer (F014)
- **Input:** content candidate, community report, config change, aggregate analytics request.
- **Flow/states/actions:** queue → inspect → approve/request changes/reject/activate; report moderation; reward config.
- **Logic/exceptions:** role separation, version conflict, reason required, safety expiry deactivates.
- **Permissions/privacy:** reviewer, moderator, operator roles separate; no broad note browsing.
- **UI/data/API:** Vietnamese S15; review/moderation/audit/config; scoped admin APIs.
- **Acceptance/relations:** all privileged actions audited; supports M03/M10/M11, aggregate only.

### M15 — Ebook & Growth Integration (F015)
- **Input:** existing Botly ebook route, download/lead event, optional CTA attribution.
- **Flow/states/actions:** ebook → optional quiz → plan → journey invitation; share card → organic visit.
- **Logic/exceptions:** valid minimal attribution only; ebook delivery failure separate; no contact/health data in URL.
- **Permissions/privacy:** existing marketing consent remains independent; public share generated only from M10 projection.
- **UI/data/API:** ebook cards/lead capture + S01; existing tables plus opaque attribution; route links and event contract.
- **Acceptance/relations:** quiz CTA optional, no surprise newsletter/reminder opt-in; links F001/F009.

### M16 — Wellness Toolkit (F016)
- **Mục tiêu/actor/input:** Member lưu và dùng các đối tượng wellness có danh tính ổn định; Reviewer quản lý Catalog; guest chỉ xem nội dung công khai được phép. Input là `catalog_item_id` hoặc private self-created tool, usage method/activity template ID, branch/journey và lịch cá nhân.
- **Luồng/trạng thái/hành động:** Catalog item → chọn Usage Method (nếu có) → Add to My Toolkit → equip vào branch/journey → đặt lịch/ngày bắt đầu → ghi Daily Usage Record → pause/replace/archive. Toolkit state: `in_collection`, `equipped`, `paused`, `archived`; usage record: `done`, `not_yet`, `skipped`, `not_suitable`, `partial` (proposed; trạng thái không tự suy ra từ số lần).
- **Business logic/ngoại lệ:** Ingredient, recipe và activity đều là Catalog Item type khác nhau, mỗi loại có ID riêng; Usage Method/Activity Template là hướng dẫn/version gắn với một hoặc nhiều Catalog Item. Một recipe item có thể liên kết ingredient items và template riêng; một item có thể có nhiều reviewed methods. Nhiều local usage trong một ngày có thể ghi từng occurrence hoặc count tự khai; không thưởng theo amount/count. Missing item → private tool; trùng/near-duplicate submit → đề xuất liên kết item hiện có thay vì tạo catalog ID mới. Unreviewed/private tool không vào public recommendations/catalog matching như reviewed template.
- **Permissions/privacy:** Toolkit và usage riêng tư theo mặc định. Public projection chỉ dùng IDs/fields đã consent; community search có thể match cùng catalog ID và method ID riêng biệt, nhưng không trả profile/quiz/private outcome. Trải nghiệm tự khai không phải efficacy evidence.
- **UI/data/API:** S04 catalog picker; S05 equipped tool slots on map; S06 daily usage controls; S16 Catalog detail/picker; S17 My Toolkit collection/equipment; S18 tool usage timeline. Data: canonical catalog item/version, usage method/template/version, user toolkit entry, schedule history, structured usage records, private tool and duplicate proposals. API concepts: `GET /toolkit/catalog`, `POST /toolkit/entries`, `POST /toolkit/personal-tools`, `PUT /toolkit/entries/{id}/schedule`, `POST /toolkit/usage-records`, `POST /toolkit/catalog-proposals`. Members cannot create canonical catalog items directly.
- **Acceptance/relations:** Structured item/method IDs truy vấn được xuyên suốt; không dựa vào free-text note để nhận diện công cụ; state/history owner-only; XP chỉ cho eligible participation/learning, không theo lượng dùng; nối F003/004 knowledge, F005 World, F006 check-in, F008 activity, F009/010 community, F011 reward và F014 review.

## 14. Wellness Toolkit — product model
**Wellness Toolkit — Personal Wellness Equipment** là lớp trung tâm giữa tri thức và hành trình: người dùng sở hữu một bộ sưu tập công cụ đã chọn, trang bị một số công cụ vào nhánh/journey, xếp lịch riêng và ghi nhận lần sử dụng có cấu trúc. Hệ thống giữ riêng ba lớp: (1) canonical `Wellness Catalog Item` — ingredient, recipe, movement, breathing, lifestyle item; (2) `Usage Method / Activity Template` — hướng dẫn/version kiểm duyệt gắn với một hoặc nhiều catalog items; (3) user-specific `Toolkit Entry` — lựa chọn item/method, schedule, trạng thái và lịch sử.

Canonical identity ổn định qua versioning: `catalog_item_id` không tái sử dụng cho khái niệm khác; material changes tạo version. Catalog item có type như ingredient, recipe, movement, breathing hoặc lifestyle; recipe/walk/technique đều có ID riêng như ingredient. `method_id` nhận diện reviewed hướng dẫn/template cụ thể gắn với một hoặc nhiều Catalog Item. Match cộng đồng trả hai kết quả riêng: same item (ví dụ cùng ingredient hoặc cùng recipe item) và same method (cùng cách thực hiện/version). Người dùng có thể tự tạo personal tool (`source=personal`, `review_state=unreviewed`) để theo dõi; không xuất hiện thành approved recommendation. Đề xuất chuẩn hóa đi qua duplicate search + reviewer queue trước khi tạo/ghép canonical ID.

### Example — A 30 days, B starts independently
A chọn Catalog Item rau diếp cá (`type=ingredient`), một Catalog Item recipe (`type=recipe`, liên kết ingredient qua relation; có Usage Method version riêng), và một Catalog Item đi bộ (`type=movement`, có Activity Template version riêng) hai slot/ngày theo schedule cá nhân. Mỗi lần thực hiện, A ghi tool/item ID cùng method/template ID nếu có, local date/time (nếu muốn), status và optional self-reported count; không yêu cầu lượng dùng, và không cộng XP theo count. Daily total/habit summary không diễn giải tác dụng điều trị. Ngày 7 reflection, ngày 14 thêm công cụ mới, ngày 30 tổng kết; share chỉ công khai những item/method/timeline fields A chọn.

B tìm cùng canonical ingredient. Explorer phân biệt “same ingredient”, “same recipe/activity item” và “same usage method/template”; xem timeline A đã consent. B nhấn Start My Own, hệ thống khởi tạo draft từ các canonical IDs/method versions còn active/reviewed, lọc theo profile B, bỏ self-created/unreviewed hoặc safety-ineligible tools, cho B chọn lịch và xác nhận. B có toolkit entries, World, timeline, notes và XP riêng; không sao chép outcome hoặc regimen A. A’s self-report không quảng cáo hiệu quả điều trị rau diếp cá.
## Build V1 addendum

Current Build HealthClues V1 prompt supersedes documentation-only scope. Game onboarding targets 8–10 initial questions; retain the existing bank. Guest sees result before registration. Starting equipment has three typed slots: Consume/Eat, Reduce/Avoid, Do/Practice; users may equip zero to three tools, at most one per slot. No auto-equip or required herb.

Recipe Combo is a recipe Catalog Item with multiple ingredient IDs and a reviewed method. Journey Combo is a reviewed preset that assigns separate components to slots and supports per-component review, safety, partial acceptance, replace and skip. Each accepted component becomes its own Toolkit Entry.

V1 includes core World/check-in, community, opt-in reminder and basic rewards. Advanced AI Companion and mini-games are post-V1.


## F017 / M17 — Recipe Combo & Journey Combo
**Purpose and actors:** Guest/Member discovers reviewed combinations; Reviewer/Admin reviews and activates exact versions. **Inputs:** Recipe Catalog Item and ingredient components, or Journey Combo components with slot assignments, profile match and safety constraints.
**Flow/states/actions:** draft → review → approved → active/retired; member previews → inspects component → accepts all/part, replaces or skips → confirms. Each accepted component creates a separate Toolkit Entry.
**Business logic/exceptions:** Recipe Combo is a recipe item with many ingredients and a reviewed method version. Journey Combo is a preset across typed slots, never one item replacing the slots. Recheck component/version/slot compatibility at commit; no silent substitution or auto-equip. Stale/ineligible components follow reviewed partial policy.
**Permissions/privacy:** only approved active versions can be recommended; member choices private; admin review audited; matching uses only consented profile fields.
**UI/data/API:** S19 and onboarding S02–05; combo/version/component/slot/reason/safety data; catalog-combo browse/preview and toolkit-entry APIs.
**Acceptance/relations:** Recipe Combo preserves ingredient IDs; Journey Combo supports per-component inspect/partial acceptance/replace/skip; connects F001/F004/F016 and World/check-in. Trace: F017 → UC39–42 → BR53–60 → S19 → combo/component entities → AT41–48.

# Approved product direction — 2026-10-28 (current)

Giữ một player character và một persistent My Wellness World. Overworld hiện hành giữ đủ tám region ID; chỉ Sleep Valley và HealthClues Realm được mở gameplay, sáu vùng còn lại là Coming Soon. Đây là quyết định sản phẩm; không đồng nghĩa các region map/pet/gameplay đã hoàn thành. Discovery Quiz xác định Journey ban đầu; concern là tự khai, không phải chẩn đoán. Các chức năng Knowledge/Toolkit/Boss diễn ra trong map Journey tương ứng; không có Knowledge Land. Community Village là future scope.

Phân công chi tiết theo nguồn canonical: `BUSINESS_RULES.md`, `USER_FLOWS.md`, `DATABASE_DESIGN.md`, `UI_UX_SPEC.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `COMMUNITY_AND_PRIVACY_SPEC.md`. Hiện trạng triển khai/kiểm chứng nằm ở `CURRENT_STATE.md` và acceptance/test reports, không suy ra từ mục tiêu trong spec.


## 09B implementation status note — 2026-10-29

The architecture remains the existing Next.js/Supabase application and one persisted owner World. The current authenticated `/play` experience now branches into a shared RPG scene using the approved Overworld renderer plus two detailed interactive region views; this is a presentation integration over existing World/profile APIs, not a second game/database. Only two regions are playable. Current implementation evidence and gaps are tracked in `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`; approved Skills, reviewed content, Journey loadouts and production gates are not implied complete.

## Implementation note — first-time guide slice (2026-10-29)

The authenticated owner build now offers a resumable, optional Pet-led first-time guide inside the already selected Region Map. This records the implementation evidence in `CURRENT_STATE.md`; it does not change the approved one-World/two-playable-region product scope and does not imply that reviewed tools or Knowledge lessons are available. Detailed UX and acceptance scope: `UI_UX_SPEC.md` and `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md`.

## Milestone 09C implementation note ? 2026-10-29

The current implementation adds three in-region discovery stations in both playable maps, a reusable reviewed-catalog station UI, owner-scoped private Care Plan records and map camera controls. It reuses the existing Next.js/Supabase application, eight-region Overworld and SVG/DOM RegionMapScene. These code changes do not imply that topic-matched medical content, NPC character art, conversational Daily Companion, mini-games or Skills are available. Current test/browser evidence and blockers are in `CURRENT_STATE.md` and `reports/HEALTHCLUES_09C_GAMEPLAY_ACCEPTANCE.md`.

## 09D-R renderer implementation note — 2026-10-29

The detailed region-scene implementation now supports continuous avatar movement on authored walk corridors, follow camera/Pet and NPC proximity interactions through the existing React scene layer. This is implementation evidence, not a product-scope change or production acceptance. Human art review, detailed collision validation and mobile/performance QA remain open. See `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

## Final delivery implementation note — optional Daily Pet reflection (2026-10-29)

The private Daily Check-in now offers up to two optional Pet-led non-clinical reflection prompts and an explicit opt-in before copying answers into the editable private note. This is an implemented slice of the approved Companion model; it is not the complete daily tracking, reminder, Knowledge or broader game acceptance. Current browser evidence and remaining gaps: `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.


## Region movement acceptance note — 2026-10-29

The two current detailed regions reuse the same React scene and authored walk-corridor navigation data. Player input must route only on connected, clearance-checked walkable corridors; map art alone is not walkable. Water/scenery destinations without an authored road/deck are rejected, and landmark interaction follows physical arrival. This is an implementation status note, not a claim that the full game or a precision collision mesh is complete. Current evidence/limitations are in reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md.


## Flexible Backpack implementation addendum — 2026-10-30

The owner demo separates legacy `slot_key` action category from three persisted Backpack positions. Owners may equip zero to three eligible tools, choose any open position, and explicitly replace an occupied one. Collection remains independent. TEST ONLY fixture eligibility is isolated to owner demo and never represents human-reviewed publication. See CURRENT_STATE.md and reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md.
# Personalized discovery implementation update — 2026-10-30

Current source now includes a shared deterministic Catalog recommender at `src/features/healthclues/personalized-recommendations.ts`, an authenticated private World endpoint, and an optional Luna/Lumi suggestion surface in Camp and each NPC station. This is an implemented source state; automated/browser evidence and bounds are recorded in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. It is not a diagnosis, treatment or efficacy engine. Older product sections below remain scope/architecture unless specifically updated here.

## Master Prompt 11 — World entry and regional play (2026-10-30)

On first entry to an authenticated persistent World, the selected Region opens with the existing scene and the correct Pet behind a four-step, full-viewport tutorial. The tutorial previews the actual current World Plan, directs the player to open the canonical Plan from Quests, and highlights a reachable first station before free exploration. Guide completion/skip/replay use the existing owner/World-scoped guide state. The two playable regions, other six Coming Soon regions, artwork, route graph and NPCs are reused; no new engine or Plan store is introduced. See `reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md` for build-specific browser evidence and limitations.

## Integrated Quiz → Plan → World acceptance update (2026-10-31)

The local experience has current-build Chromium evidence on isolated Owner Demo build `app-build-complete-journey-visual-fix-20261031` (`127.0.0.1:3268`): Quiz/Plan persistence for Gout and Sleep, an honest empty coverage state for unsupported Digestion, activation into the selected existing Region, the four-step Luna/Lumi tutorial, Quests plan visibility, and full RPG regression. Unknown Quiz topics now fail closed before Catalog matching to prevent unrelated entries whose tags are also unknown. Mobile tutorial Pet framing has a ≥90px rendered-width browser check. **This does not pass the real-time AI requirement:** `liveLlm: false`, no Codex/LLM invocation; current Gout/Sleep plan templates are TEST ONLY and not human-reviewed. Overall integrated experience remains PARTIAL pending a privacy-safe AI provider and approved content. Evidence: `reports/HEALTHCLUES_END_TO_END_PLAYER_EXPERIENCE_ACCEPTANCE.md`.

## Quiz Wellness Advisor provider update — 2026-10-31

The Post-Quiz checklist uses a server-only provider contract in the local isolated Owner Demo. `gemini` invokes `@google/genai` with minimized Quiz profile data and knowledge candidates retrieved from the reviewed Catalog. The model can choose/rank existing candidate IDs and grounded profile-fact references only; server code enforces topic, review, source, safety and schema constraints. A missing/failing provider returns a truthful unavailable state, never silently using deterministic suggestions. This implementation is local-only and does not make clinical recommendations or confer human review. Real inference and end-to-end acceptance remain pending private-key configuration and browser proof.

## My Journey World navigation — 2026-10-31

Both playable Region Maps expose one persistent `My Journey` route control below `World Map`. It provides an authenticated, World-specific read view of the self-reported Quiz focus and the latest confirmed Wellness Plan, separated into active, saved-for-later and personal goals. It links to the existing Quests Plan for edits and full details. A missing confirmed Plan remains an explicit empty state with saved-Quiz recovery; recommendations are not promoted to goals. The first-entry Luna/Lumi tutorial highlights and opens this same surface. The implementation reuses the existing World payload and Plan persistence, with no new data model. Acceptance evidence: `reports/HEALTHCLUES_MY_JOURNEY_ACCEPTANCE.md`.


## Interactive World Onboarding v2 — 2026-10-31

First authenticated entry into a persistent playable Region launches a shared Luna/Lumi tour over the actual scene. The tour introduces My Journey (real profile/Plan data), the real Botanist and Wellness Guide landmarks, then Start Exploring. Target bounds are measured from the visible UI/landmark and reflow with the viewport; map focus does not move or teleport the player. Tour state reuses the existing owner/World guide record. See the dated acceptance report for local Chromium evidence and known device/content limitations.

## My Journey — persistent RPG inventory (2026-10-31)

World HUD cung cấp một lối vào My Journey dưới World Map. Inventory chỉ tổng hợp Quiz wellness focus, các goal thật của Confirmed Plan, các herb thực sự equipped từ Botanist và các practice thực sự equipped từ Wellness Guide. Ba phần luôn expanded trên một panel cuộn; không tab/accordion. Dữ liệu rỗng vẫn rỗng và selection/Collection không đồng nghĩa với equipment. Checklist phản ánh kế hoạch, không phải log hoàn thành. My Wellness Plan trong Quests vẫn là nơi chỉnh sửa chi tiết chuẩn. Icon Backpack/Checklist/Herbs bundle/Lotus dùng cùng bộ silhouette Game-icons.net CC BY 3.0; attribution và source revision được lưu cùng asset. Lucide tiếp tục dùng cho các action controls. Xem `reports/HEALTHCLUES_MY_JOURNEY_ICON_ASSETS_ACCEPTANCE.md` để biết ảnh visual QA và giới hạn fixture Botanist.

## My Journey tour detail — Prompt 14 clarification (2026-10-31)

Trong panel My Journey, tour gồm Wellness Focus, Daily Checklist, Herbs Equipped và Practices Equipped; Luna/Lumi giải thích mục thật đang được spotlight. Chỉ một mục sáng viền/glow tại một thời điểm; ba mục còn lại được làm mờ nhưng inventory vẫn expanded. Toàn bộ World map phía sau bị tối và không nhận thao tác trong lúc hướng dẫn. Bong bóng Pet đặt liền trước section, không che nội dung; mobile căn cuộn để cả bubble và target hiển thị trọn cùng lúc. Back/Next chỉ chuyển focus, không đổi inventory state. Khi chưa có Confirmed Plan, Pet chỉ nhắc Quiz focus và đường dẫn review suggestions, không ám chỉ goal đã tồn tại. Herbs và Practices được mô tả theo NPC nguồn, không ngụ ý sử dụng hoặc kết quả sức khỏe. Local Chromium evidence: `reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md`.

## Owner-approved English / Vietnamese player locale ? 2026-10-31

On first entry, HealthClues offers English (default) and Ti?ng Vi?t on the existing Welcome screen. Locale choice is scoped to the HealthClues player, persists temporarily on the device before activation, and is stored as a private profile preference after authentication. Locale changes must preserve Quiz answers, canonical IDs, Plan, World, equipment, tutorial and game state. English and Vietnamese use the same Quiz/scoring engine. Do not force a locale from IP or browser language.

This requirement is approved product direction; implementation remains partial until the complete player journey and reviewed-content coverage pass browser acceptance in both languages.

### Cycle 34 — Dynamic In-Game Language Switcher & Realtime Dialogue Localization (2026-11-08)

The player HUD language toggle (`.hc-rpg-lang-btn`) switches all in-game presentation between English and Vietnamese:
- **Zero-Feedback Loop Persistence**: Switching locale sends `PATCH /api/healthclues/profile` with `{ preferredLocale }` to persist to Postgres while simultaneously updating cookies, `localStorage`, and React state. Profile-load effects exclude `locale` from dependencies to prevent server responses from overriding the user's manual selection.
- **Synchronous Map & Dialogue Translation**: All map landmark pins, NPC talk prompts (`.hc-rpg-talk`), Lumi/Luna dialogue, Level badges, and bottom dock buttons dynamically resolve their text through `healthCluesText` according to the active `locale` without hardcoded language fallbacks. Target test evidence in `App/reports/LANGUAGE_TOGGLE_BILINGUAL_ACCEPTANCE.md`.


## Master Prompt 15 — guided My Journey spotlight behavior (2026-11-01)

The existing My Journey tutorial keeps all four real sections expanded and introduces Wellness Focus, Daily Checklist, Herbs Equipped and Practices Equipped in sequence. At each stop exactly one section receives the primary outline/glow; the other three are subdued. The real World is softly darkened and blocked behind the active dialog. Use the modal backdrop as the World dim layer so the actual Journey panel paints above it; do not use a body-level overlay that can out-stack the target content. Keep dialogue adjacent in normal panel flow. Auto-scroll within the Journey body to show the dialogue and target, preserve scrolling for long targets, and recalculate geometry when content or viewport changes. English/Vietnamese dialogue is presentation-only. No Quiz, Plan, inventory, World or tutorial persistence semantics change.

Implementation/browser evidence: reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md (isolated local Chromium, final build http://127.0.0.1:3296/play). Overall broader player localization remains PARTIAL.
## Master Prompt 16 — personalized wellness plan contract (2026-11-01)

After Quiz Reveal, the server-side Advisor may generate relevant everyday lifestyle goals and exactly two distinct action alternatives per accepted goal, in the selected locale. It uses the existing Quiz/profile, stable canonical goal IDs and the existing confirmed Plan persistence. The player may choose A, B, one custom goal, or skip; nothing becomes active before explicit confirmation. My Journey continues reading only the confirmed Plan.

The model receives a minimized, self-reported profile and server-owned public-source references. It cannot invent citations. Independent server validation checks schema, source/topic match, relevance and risk goal by goal. The current Quiz schema contains no structured habit quantity baseline; numeric targets are therefore omitted/rejected until that baseline is actually collected. High-risk treatment, medication, supplement/herbal, fasting/dehydration, restrictive-diet, withdrawal and unsafe-exercise suggestions are excluded. Gemini billing failure yields a truthful localized unavailable state; synthetic test data must never be presented as genuine inference.

Implementation in progress; see `reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md`. Real Gemini inference remains unverified after the previously observed HTTP 402/BILLING_REQUIRED. Do not treat this requirement text as evidence of end-to-end acceptance.
## Master Prompt — Game Asset & Wellness Activity Icon Integration (2026-11-03)

HealthClues integrates an expansive local vector game asset and semantic wellness activity icon library:
- **Zero External Hotlinks**: 86 vector SVGs bundled locally under `public/assets/game/icons/` plus Kenney Fantasy UI Borders under `public/assets/game/ui/borders/`.
- **Licensing Compliance**: Documented in `docs/GAME_ASSET_LICENSES.md`. CC0 (Health Icons, OpenCrop, Nieobie, Kenney), MIT (Tabler Icons), and CC BY 3.0 with attribution (Game-icons.net).
- **10 Wellness Domains**: Food & Nutrition, Herbs & Plants, Physical Activities, Yoga & Stretching, Meditation & Breathing, Sleep & Relaxation, Hydration, Daily Lifestyle Habits, Knowledge & Learning, Quests & Achievements.
- **Dynamic Semantic AI Resolver (`wellnessIconResolver.ts`)**: Automatically resolves arbitrary AI goals, player personal notes, and backpack items to contextual icons without hardcoding fixed lists. Fallback to `quests:target` ensures 0 broken images and 0 UI crashes.
- **Internal Owner Icon Gallery (`/admin/healthclues-icon-gallery`)**: Dedicated internal review dashboard with interactive AI simulation, tone switcher, and category filters (hidden from player navigation).
- Acceptance and evidence: `reports/WELLNESS_ICON_ASSETS_ACCEPTANCE.md`.

## Master Prompt 17 — AI-guided onboarding decision (2026-11-01)

**Approved product direction; current status PARTIAL.** For new players, the sequence supersedes the historical fixed-bank Quiz and pre-World Plan Builder: choose one self-reported focus, answer a few short adaptive choice questions, complete the existing account/email verification, enter one of the two already playable regions, then receive optional personalized goal suggestions from the Pet in the World. Existing accounts and their Quiz/Plan/World data remain on the legacy-compatible path. Preserve the shared 96-question bank for returning users and rollback; never fabricate legacy answers.

Each generated suggestion must have a separate unchecked-by-default goal checkbox and exactly two implementation levels plus one custom choice. Selecting an implementation does not check the goal. Zero goals and postponement remain valid. Only explicitly confirmed selections enter the existing owner/World-scoped Plan and My Journey. Gemini unavailable means a truthful localized empty state and a playable World, never fixture content presented as live inference. The later implementation delta adds the concern-first client, API invocation, account handoff and post-entry Plan sequencing. One synthetic local account has passed activation, real World/Lumi entry, zero-goal confirmation and My Journey reload; selected-goal persistence, owner isolation and complete EN/VI coverage remain unaccepted. Known provider state is HTTP 402/BILLING_REQUIRED. See the latest status in `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`.
## Goal-selection RPG visuals — Master Prompt 17 addendum (2026-11-01)

Goal categories use small, distinct HealthClues SVG illustrations within interactive cards; images are decoration and do not carry selection state or AI advice. The existing region Pet (Luna for Sleep Valley, Lumi for HealthClues Realm) appears in localized guidance. Existing original World/Pet/player artwork and the separately attributed CC BY 3.0 My Journey icons remain unchanged. This initial visual addendum was followed by the concern-first onboarding and post-entry Plan implementation described below; this visual work alone is not full MP17 acceptance.

## MP17 implementation delta — 2026-11-01 (source implemented; E2E pending)

The new-player route now branches from Welcome into goal-first discovery and bypasses the legacy fixed Quiz/Plan prelude. It uses a stable focus ID and answer IDs, an optional self-reported concern detail, an age-13+ confirmation, and the existing adaptive-discovery endpoint. Legacy `?step=quest`, the 96-question bank, and existing saved profiles remain available. Adaptive answers are represented in the profile's optional `adaptiveDiscovery` object rather than fabricated legacy answer keys.

After existing email verification and authenticated World entry, the new-profile path can open the existing owner/World-scoped Wellness Plan panel with a short localized Luna/Lumi introduction before the normal World tour. The current Gemini 402 must remain an honest unavailable state; the World stays playable. This implementation delta is **not** end-to-end acceptance: authenticated Chromium Plan selection, persistence, reload, and account isolation remain pending. See `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`.


## Simplified Gemini checklist contract — 2026-11-02

For ordinary lifestyle checklist generation, Gemini receives the self-reported selected concern and concise onboarding answers and returns up to six bilingual suggestions containing only title, short reason, and two A/B implementation options. Model-owned IDs, category, fixed catalog/source IDs, targets and safety declarations are not part of the output. The server assigns stable UUID-backed `ai:` IDs, validates relevance and dangerous content, signs A/B choices, and persists only player-confirmed selections through the existing Plan contract. The UI owns checkbox and Custom. EN/VI draws from the same bilingual recommendation, without regeneration; a short in-memory reuse window prevents another inference on locale route changes. No fixed habit lists or universal quantities. The concise disclaimer and explicit-confirmation boundary remain. This rule supersedes prior source-registry requirements for this ordinary checklist only; separate medical/herbal features, legacy Quiz, World, Pet, My Journey, and user data remain unchanged. Offline/build evidence only; real Gemini acceptance is pending authorization.

## 2026-11-02 — MP17 persisted bilingual recommendation display

For newly confirmed AI-generated wellness goals, preserve the server-verified bilingual title, relevance reason, and A/B option copy inside the existing owner-scoped Plan JSONB snapshot. My Journey renders that same canonical goal in the selected EN/VI locale without another Advisor request or Plan mutation. Goal ID, selected implementation, numeric target and Active/Saved for Later state remain stable. User-authored text is displayed exactly as written. Historical records without their original validated bilingual snapshot retain the stored wording; do not invent a translation or regenerate a recommendation. This is a display/persistence compatibility update, not evidence of live Gemini quality. See the latest MP17 acceptance report for Chromium evidence and the remaining original 96-question answer-data limitation.
## Owner-approved MP19 onboarding correction — 2026-11-02

New-player `/play` begins with Welcome and language, then presents all eight existing Overworld regions. Only Sleep Valley with Luna and HealthClues Realm with Lumi are playable; six remain visibly Coming Soon. The player chooses the World before the short adaptive Quiz. Sleep Valley asks sleep-specific habits without a duplicate concern picker; HealthClues Realm asks the concern once and then relevant habits. Existing authenticated activation continuity persists the selected world and quiz context, then opens the chosen regional map directly. The global World Map remains accessible. Returning players keep their existing World and progress, and the legacy Quiz remains available through its existing path. This approved direction supersedes earlier concern-first new-player text.


### MP20 activation handoff contract correction ? 2026-11-02
The two-screen Quiz serializes selected factor IDs in the established canonical a-<factor> form and preserves none/unsure explicitly. The encrypted pending-journey and Advisor profile boundaries accept zero through twelve matched IDs/labels, because factor selection is optional and the Gout checklist contains twelve choices. World profile hydration must retain that supported range. A failed activation handoff keeps the current read-only preview and answers available for retry; an HTTP validation error must not be described as a browser-storage failure. This compatibility fix introduces no schema or storage-boundary change.

### 2026-11-03: Pending-journey secret fallback & clean localization
Pending journey encryption accepts `SUPABASE_SECRET_KEY` when `HEALTHCLUES_PENDING_JOURNEY_SECRET` is unset in local runtime to avoid artificial 503 errors during guest preview activation. User-facing handoff errors in `HealthCluesWorldPreview.tsx` are fully verified against mojibake corruption.

### Owner checklist visibility refinement — 2026-11-02
When first-entry opens My Journey for a player with a saved Quiz profile and no confirmed Plan, render “Recommendations for you” as the first section in the panel so the real Advisor loading/result/unavailable-and-Retry state is immediately visible without scrolling past empty inventory. Keep it in the same panel as followed goals, herbs and practices. The Backpack/My Journey entry remains the re-open path. This layout rule does not imply Gemini availability or UX acceptance.

### Advisor checklist state and Plan follow-through

A saved Quiz profile opens the real Wellness Advisor checklist from the first-entry My Journey and the permanent My Plan navigation. Show an explicit generation, accepted-goals, provider/validation failure, or no-recommendations state and correlate failures through a sanitized request ID. Do not log Quiz answers or credentials. The live World Builder immediately saves each valid checked A/B/Custom choice through the existing owner-scoped Plan API; keep recommendations visible alongside the current Following list. Retry a failed Plan write with its idempotency key and never report a failed write as active.


### 2026-11-03: verified discovery context is the active Plan identity

The selected two-question Quiz profile must survive verified-account activation even when that account has a prior HealthClues profile. Preserve the selected World through direct region entry. The World Advisor uses the authenticated saved concern/factors and validates World/context alignment before generation; cached output and current Plan snapshots are scoped to that account and discovery context. Mismatched context is recoverable and never silently replaced with Sleep or a demo list. Previous confirmed Plan revisions remain in history.

### 2026-11-12: Cycle 89 Mobile 2.5D Painterly Diorama & Typography Preservation (`healthclues-mobile`)

In the Expo mobile client (`healthclues-mobile`), the World screen renders the canonical 1600×900 region artwork using an ultra-light 60fps GPU-animated 2.5D diorama layer (`src/utils/worldDiorama25D.ts` & `app/(game)/world.tsx`) with perspective depth scaling (`0.76x–1.14x`), dynamic `zIndex` Y-sorting, decoupled floor contact shadows, `requestAnimationFrame` + `Animated.Value` movement (`0` mid-walk React re-renders), `useFocusEffect` animation pause when unfocused, zero Daytime alpha overdraw or continuous background timers, Sunset/Night `radial-gradient` halos + 4 static ambient motes, toggleable Day/Sunset/Night/Auto lighting, real-time multiplayer presence (`useWorldPresence.ts` syncing live player coordinates and displaying remote adventurers with `onlineCount`), 6 simulated village adventurers (`useLivingVillageVisitors.ts`), and bundled Vietnamese-diacritic custom fonts (`BeVietnamPro` + `Spectral`). All 8 Overworld region IDs and 2 playable/6 locked rules remain unchanged.
