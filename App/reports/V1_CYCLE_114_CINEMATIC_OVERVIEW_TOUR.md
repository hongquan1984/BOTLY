# HealthClues Acceptance Report — Cycle 114: World 3D Cinematic Overview, Floating Lumi Mascot Tour & Pulsing Building Beacons

**Date:** 2026-11-16  
**Status:** PASS (100% Automated Browser & Integration Verified on Port 8081)  
**Author:** Senior Narrative Game Designer, Mobile Game UX Architect & Expo Developer  

---

## 1. Executive Summary

In accordance with the Master Narrative & Onboarding V1 direction and the user's explicit design requirements:
1. **Giai Đoạn 1 (Toàn Cảnh — Overview Mode):** Khi vào màn hình World 3D, hệ thống tự động khởi đầu bằng góc quay **Toàn Cảnh (Overview)** bao quát toàn bộ Làng Mây trên các tầng trời. Thanh công cụ phía trên được ẩn đi để khung cảnh điện ảnh hoàn toàn sạch sẽ, không bị che khuất.
2. **Giai Đoạn 2 (Lumi Lơ Lửng & Công Trình Nhấp Nháy Phát Sáng):** Linh vật Lumi bay lơ lửng phía trên thẻ hội thoại với hoạt ảnh nảy phập phồng nhẹ nhàng (`Animated.loop`). Lumi giới thiệu từng công trình; nói đến đâu thì ngôi nhà đó nhấp nháy phát sáng với vầng hào quang rực rỡ và vòng sáng lan tỏa (`pulseGlowBeacon` & `pulseBeaconRing`).
3. **Chuyển Đổi Sang Cận Cảnh & Lộ Diện HUD:** Khi hoàn thành tour ("Bắt đầu khám phá ✨"), camera chuyển mượt mà về **Cận Cảnh (`close`)** sau lưng nhân vật. Thanh công cụ lộ diện với các nút chức năng chuẩn hóa: `[ 3D Làng Nổi ]`, `[ Toàn Cảnh ]`, `[ 🔍 Giải Mã ]`, `[ 8 Vùng ]`, và nút `[ ✨ Tour ]` để xem lại bất cứ lúc nào.
4. **Chuẩn Hóa Danh Xưng:** Đổi tên nút từ **"Phá Án"** thành **"Giải Mã"** với icon `<Search size={12} color="#38bdf8" />` và nhãn hỗ trợ accessibility `"Văn phòng giải mã hồ sơ bí ẩn"`. Toàn bộ lời thoại được chuẩn hóa theo mạch truyện khám phá manh mối thói quen xấu.

---

## 2. Technical Architecture & File Changes

| Component / File | Changes Made |
| :--- | :--- |
| `D:\botly\App\word3d\src\PlayerApp.tsx` | Added `HIGHLIGHT_LANDMARK` / `HIGHLIGHT_BUILDING` postMessage handler to set `selectedLandmarkId` and optionally focus camera. |
| `D:\botly\App\word3d\src\components\landmarks\SmartLandmarkOverlay.tsx` | Injected CSS keyframes `@keyframes pulseGlowBeacon` & `@keyframes pulseBeaconRing`. Badge pill pulses with dynamic scale (1.04 $\rightarrow$ 1.20) and radial beacon glow ring when `isFocused` is active. |
| `D:\botly\App\word3d\src\systems\cozyVillageLayoutLoader.ts` | Standardized building display names in `BUILDING_REGISTRY`: "Ngôi Nhà Của Bạn", "Nhà Thảo Mộc", "Nhà Cơ Thể", "Quảng Trường & Giếng Ước". |
| `D:\botly\App\healthclues-mobile\src\components\game\World3DView.tsx` | Added `highlightLandmark` prop and automated postMessage synchronization to Three.js iframe. |
| `D:\botly\App\healthclues-mobile\src\modules\tour\VillageCinematicTourModal.tsx` | Created 7-step cinematic tour with floating hovering Lumi mascot (`Animated.View`), step progress segments, dialogue cards, and skip controls. |
| `D:\botly\App\healthclues-mobile\app\(game)\world.tsx` | Integrated `VillageCinematicTourModal`, hid top toolbar while tour is active, added `[ ✨ Tour ]` replay button, and renamed "Phá Án" $\rightarrow$ "Giải Mã". |
| `D:\botly\App\healthclues-mobile\app\(game)\_layout.tsx` | De-conflicted legacy spotlight tour with `cinematicTourDone` guard, preventing double overlays. |
| `PermanentMascotHelper.tsx`, `InteractiveTourCard.tsx`, `HomeFurnitureShopModal.tsx`, `DetectiveMobileLauncher.tsx`, `VillageTutorialModal.tsx` | Standardized "phá án" $\rightarrow$ "giải mã hồ sơ / manh mối sức khỏe". |

---

## 3. Tour Stops Sequence & Narrative Content

| Stop | ID & Building Target | Badge | Lumi Title & Narrative Dialogue |
| :--- | :--- | :--- | :--- |
| **0** | `village_overview` (None) | `TOÀN CẢNH LÀNG MÂY` | "Chào mừng bạn đến với Xứ Sở Sức Khỏe! Làng Mây lơ lửng giữa những tầng trời này là nơi Nhà Tiên Tri đã dặn mình đón bạn! Toàn cảnh ngôi làng thật thanh bình đúng không? Hãy cùng mình dạo một vòng ngắm nhìn những ngôi nhà đặc biệt nơi đây nhé!" |
| **1** | `journey_house` (`bld_great_hall`) | `NGÔI NHÀ CỦA BẠN` | "Ngôi nhà gỗ ấm áp phía trước là Ngôi Nhà Của Bạn — chốn bình yên riêng tư sau mỗi ngày khám phá. Bạn có thể trở về thắp đèn, nghỉ ngơi, trang trí nội thất và tận hưởng không gian ấm cúng của riêng mình." |
| **2** | `herbal_house` (`bld_potion_shop`) | `NHÀ THẢO MỘC` | "Ngôi nhà ngát hương hoa kia là Nhà Thảo Mộc — nơi cất giữ bí mật của hoa Cúc La Mã, Bạc Hà, Lạc Tiên và các loại thảo mộc tự nhiên giúp thanh lọc cơ thể, xoa dịu thần kinh và nuôi dưỡng giấc ngủ an lành." |
| **3** | `body_science_house` (`bld_bookshop`) | `NHÀ CƠ THỂ` | "Ngôi nhà mái xanh và kính thiên văn là Nhà Cơ Thể — nơi giải mã cơ chế tim mạch, chu kỳ giấc ngủ sâu, nhịp sinh học và nguyên lý vận hành kỳ diệu của chính cơ thể bạn." |
| **4** | `detective_office` (`bld_watermill`) | `VĂN PHÒNG GIẢI MÃ` | "Nút [ 🔍 Giải Mã ] trên cùng dẫn tới Văn Phòng Giải Mã Manh Mối. Nơi đây tiếp nhận những Hồ Sơ Sức Khỏe từ thế giới con người để truy tìm manh mối thói quen xấu và tìm ra giải pháp cải thiện sức khỏe!" |
| **5** | `plaza_well` (`bld_plaza_well`) | `QUẢNG TRƯỜNG & GIẾNG ƯỚC` | "Giữa trung tâm làng là Quảng Trường & Giếng Ước. Mỗi ngày ghé thăm, bạn có thể uống ngụm nước trong lành, điểm danh nhịp sống để nhận năng lượng EXP, xu may mắn và gặp gỡ bạn bè!" |
| **6** | `ready_to_explore` (None) | `SẴN SÀNG KHÁM PHÁ` | "Ngôi làng đã mở cửa đón chào bạn! Bạn có thể chạm vào mặt đất để bước đi, hoặc chạm trực tiếp vào bất kỳ ngôi nhà nào để ghé thăm. Hãy bắt đầu hành trình ngay thôi!" |

---

## 4. Test Evidence & Verified Artifacts

All screenshots captured live via Playwright Chromium on Android mobile viewport (`390x844`):

1. `tour_01_overview.png`: Stop 0 Overview (Toàn Cảnh Làng Mây) — Floating Lumi hovering above narrative card, top toolbar clean and hidden.
2. `tour_02_home.png`: Stop 1 Ngôi Nhà Của Bạn — Great Hall badge and structure pulse radiant green-gold beacon.
3. `tour_03_herbal.png`: Stop 2 Nhà Thảo Mộc — Herbal Shop badge pulses radiant beacon.
4. `tour_04_body.png`: Stop 3 Nhà Cơ Thể — Body Science House badge pulses radiant beacon.
5. `tour_05_detective.png`: Stop 4 Văn Phòng Giải Mã — Dialogue explains the Detective office and dossier solving.
6. `tour_06_plaza.png`: Stop 5 Quảng Trường & Giếng Ước — Plaza Well badge pulses radiant beacon.
7. `tour_07_ready.png`: Stop 6 Sẵn Sàng Khám Phá — Call to action with "Bắt đầu khám phá ✨".
8. `tour_08_world_unveiled.png`: Completed tour, camera smoothly transitioned to close view.
9. `test_completed_world.png`: World 3D screen fully active with unveiled HUD: `[ 3D Làng Nổi ]`, `[ Toàn Cảnh ]`, `[ 🔍 Giải Mã ]`, `[ 8 Vùng ]`, `[ ✨ Tour ]`, `[ Lumi 🌱 ]`.
10. `test_detective_opened.png`: Tapping `[ 🔍 Giải Mã ]` opens the Detective Modal smoothly with back button `Về Làng`.

---

## 5. Post-Review Visual & Interaction Polishing (Cycle 114 Hotfix)

Following user review of the tour in live mobile testing, four critical visual and interaction items were addressed and fully verified:

1. **"Bắt đầu khám phá" Button Click Reliability:**
   - *Problem:* Modal did not dismiss when tapping the finish button due to a missing `DeviceEventEmitter` import throwing a ReferenceError right before `onFinish()`.
   - *Fix:* Imported `DeviceEventEmitter` from `react-native`, made `onFinish()` fire synchronously and immediately upon button press, and moved persistence and event emitting into safe try/catch blocks. Added `hitSlop` and `activeOpacity` for responsive mobile touch feedback.
2. **3D Light Pillar Beacons & Building Blinking:**
   - *Problem:* Buildings did not visibly glow or flash in 3D overview distance when introduced by Lumi.
   - *Fix:*
     * Added a 3D **Highlight Light Pillar Beacon** (`THREE.CylinderGeometry`) in Three.js with additive blending (`THREE.AdditiveBlending`), an inner golden beam, a ground ripple ring, and a dynamic point light descending directly onto the focused building.
     * In the render loop, animated the beacon rotation and pulse, and cycled the building meshes' `emissiveIntensity` so the actual 3D house blinks and flashes in real time.
     * Enriched `SmartLandmarkOverlay.tsx` with larger badges (`scale(1.24)`), pulsing gold/emerald glow (`pulseGlowBeacon`), and a bouncing downward indicator arrow pointing directly to the house.
3. **Detective Button Highlight ("Giải Mã"):**
   - *Problem:* On Stop 4, the user could not see the `[ 🔍 Giải Mã ]` button glowing.
   - *Fix:*
     * Kept the top toolbar visible during the tour with `pointerEvents="box-none"`.
     * On Stop 4, applied an animated cyan glowing halo (`#38bdf8`), scale expansion (`1.15`), and a bright golden `✨ ĐÂY!` badge hovering over the `[ 🔍 Giải Mã ]` button.
     * Added a dedicated callout banner inside the dialogue card on Stop 4 directing player attention to the button.
4. **Duplicate Mascot Badge Removal:**
   - *Problem:* A circular `Lumi 🌱` badge overlapped the bottom-left corner of the narrative card.
   - *Fix:* Updated `(game)/_layout.tsx` to hide `PermanentMascotHelper` whenever the cinematic tour is active (`!tourStep && cinematicTourDone && !isCinematicTourActive`). Adjusted dialogue card bottom padding (`marginBottom: 64-76`) to sit cleanly above the navigation tab bar.

All items verified passing 100% via Playwright automation (`step0_overview.png` through `step7_world_after_finish.png`).
