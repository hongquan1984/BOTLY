## 2026-11-12 — Cycle 87: Gout-Specific Advisor Copy, HUD Quick Sound Toggle & Profile RPG Audio Picker Modal

- **`TopHud` & Onboarding Welcome Audio Controls (`TopHud.tsx`, `quiz.tsx`):** Added compact speaker toggle (`hud-audio-toggle-btn`, `welcome-audio-toggle-btn`) synced live via `AUDIO_STATE_EVENT` so players can mute/unmute game sound from any tab without leaving gameplay.
- **`Cá Nhân` RPG Audio Picker Modal (`profile.tsx`):** Added `Âm thanh & Nhạc nền game` row (`audio-settings-row`) opening scrollable `audio-settings-modal` with SFX toggle (`toggle-sfx-enabled`), 4 selectable ambient BGM cards (`forest`, `alpine`, `night`, `off`), and `Nghe thử hiệu ứng nút & EXP` preview button.

## 2026-11-12 — Cycle 86: Mobile Goal-First Onboarding Discovery & Interactive AI Plan Builder

- **Step 3 (`quiz.tsx` Discovery Screen 1–2):** Cream parchment card (`#fbf8f0`) matching Web `HealthCluesGoalFirstDiscovery` — Screen 1 renders multi-select `HEALTH_CONCERNS`, conditional primary-focus star pill selector when >1 selected, and inline `TextInput` (`onboarding-custom-concern-input`) when `"Vấn đề khác"` is selected; Screen 2 renders concern-mapped lifestyle factors plus optional `TextInput` (`onboarding-factor-note-input`) and non-diagnostic safety disclosure.
- **Step 4 (`quiz.tsx` AI Plan Builder):** Renders provider status pill (`PHÂN TÍCH AI GEMINI` / `GỢI Ý TỪ HỒ SƠ KHÁM PHÁ` / `GỢI Ý CÁ NHÂN HÓA (NGOẠI TUYẾN)`), loading state while contacting `/api/healthclues/wellness-advisor`, per-card checkbox seals, `Khởi Động` (`A`) / `Bứt Phá` (`B`) / inline `Tự điều chỉnh` (`custom`) editor, expandable `+ Tự thêm thói quen riêng của bạn`, live selected count, and `Sửa vấn đề` / `Gợi ý lại` actions; `journey.tsx` `+ Thêm Mới` modal adds `Lấy gợi ý AI theo vấn đề của bạn`.

## 2026-11-12 — Cycle 85: Profile Daily Habit Reminder Settings & Notification Preview Modal

- **`Cá Nhân` (`profile.tsx`) Settings Row & Interactive Reminder Modal:**
  - Under `Cài Đặt Hệ Thống`, `reminder-settings-row` shows `Nhắc nhở hằng ngày`, selected cadence subtitle (`Mỗi ngày`, `Thứ 2 – Thứ 6`, `Mỗi tuần (Thứ 2)`), and live status pill (`Tắt` or `Bật · HH:MM`).
  - Tapping opens `reminder-settings-modal` (Dark RPG Gold surface with `maxHeight: "90%"` scrollable body for portrait and short landscape viewports), featuring an opt-in toggle with `BẬT`/`TẮT` badge, yellow explicit opt-in consent box + non-clinical Lumi lifestyle disclosure, quick time presets (`07:30`, `12:30`, `20:30`, `21:30`) plus `-30p`/`+30p` steppers, frequency chips (`Hằng ngày`, `Thứ 2–6`, `Hằng tuần`), `Gửi thông báo thử` button with inline preview feedback banner (`reminder-preview-feedback`), and primary `Lưu Lịch Nhắc Nhở` CTA.

## 2026-11-12 — Cycle 84: Compact 1-Tick RPG Quest Board (`Nhiệm Vụ`) & Winding Rune Trail (`Hành Trình`)

- **`Nhiệm Vụ` (`daily-care.tsx`) Single-Action Quest Card Pattern:**
  - Compact top signboard combines Lumi Fox golden rune crest, Streak badge, dynamic `+earned/total EXP` counter, and illuminated progress bar into one unified RPG frame (`maxWidth: 520` centered on tablet/desktop, compact sizing for `height < 480`).
  - Eliminate bottom 3-button rows per card (`Đã làm` / `Chưa làm` / `Bỏ qua`). Place one `44x44` circular Check Seal (`tickSealBtn`) cleanly in the right socket (lit gold/emerald ✓ when done, dashed dark rune socket via `react-native-svg` when unticked), keep `(i)` evidence drawer toggle cleanly in the top meta chip row (no nested buttons), and wrap titles cleanly (`numberOfLines={2}`) so all 3 quests + primary hero CTA (`XÁC NHẬN HOÀN THÀNH`) fit within a single portrait phone viewport (`360x800` / `390x844`) without vertical scroll.
- **`Hành Trình` (`journey.tsx`) Guild Scroll & Smooth S-Spline Trail:**
  - Wooden-brass Lumi signboard + curved `<Svg><Path>` S-spline `Nhật Ký 7 Ngày` milestone trail (`buildSmoothTrailPath` aligning dashed timber/gold path and emerald streak highlight through exact orb centers).
  - Compact guild charters display floating `+EXP` medallion badge, 2-line title/frequency subtitle, `(i)` lore toggle, and brass `Lưu sau` chip; `Đã Lưu Xem Sau` docks into a single collapsible wooden drawer bar when empty and auto-expands when populated.

## 2026-11-12 — Cycle 83: Cross-Tab Sync, Floating Toast Feedback, Two-Line Slot Typography & Landscape Scrollable Modals

- **Live State & Tab Chrome Sync (`_layout.tsx`, `useWorld.ts`, `localization/index.ts`):**
  - Remove duplicate `notificationPulseDot` over `tabBarBadge` on `Nhiệm Vụ` and immediately clear the red `1` badge once today's check-in is saved via `WORLD_STATE_EVENT` (`DeviceEventEmitter`). Sync EXP and goal updates live across all mounted tabs, and propagate `LOCALE_CHANGE_EVENT` to tab labels.
- **World Toast & Modal Accessibility (`world.tsx`, `home.tsx`, `inventory.tsx`, `profile.tsx`, `journey.tsx`, `CheckinCelebrationModal.tsx`, `RewardReveal.tsx`):**
  - Surface transient World actions and locked biome clicks via a `3.5s` auto-dismissing top-center `floatingWorldToast` pill rather than modal-only banners.
  - Wrap modal card bodies (`home`, `world`, `inventory`, `CheckinCelebrationModal`, `RewardReveal`) with `maxHeight: "90%"–"92%"` + `<ScrollView showsVerticalScrollIndicator={false}>` so primary CTAs stay accessible on `640x360` landscape screens.
  - Replace Web-broken `Alert.alert` actions with cross-platform in-app confirmation modal (`profile-confirm-modal`) and inline form validation (`habitFormError`), allow 2-line equipped slot names in `inventory.tsx` (`numberOfLines={2}`), and strip duplicate toast emojis in `home.tsx`.

## 2026-11-11 — Cycle 82: Edge-to-Edge World Map Scaling, Visual-Midpoint Camera & Unobstructed Top-Left Canvas

- **Zero Black Band & `coverScale` Contract (`world.tsx`):**
  - World `vScrollContent` must NEVER add `paddingBottom` outside the `1600x900` map bounds (`#05110e` void). On viewports exceeding `1600px` wide or `900px` tall (e.g., `768x1024`), scale uniformly via `coverScale = Math.max(1, viewportWidth / 1600, viewportHeight / 900)` while preserving `0..1600 x 0..900` landmark coordinates and ratio-mapped `handleMapPress` clicks.
- **Visual-Midpoint Avatar Framing & Tab-Focus Persistence (`centerCameraOn`):**
  - Frame the character sprite's visual center (`targetY - 18`) at exact screen midpoint (`50%` X, `50%` Y) when roaming freely, shifting only modestly (`45%` Y) on `< 420px` short landscape screens while the slim bottom `activeTalkFloatingHud` capsule is open. Re-center via `useFocusEffect` when switching back to `Thế Giới`.
- **Clean Top-Left Corner & Root Overflow Rule:**
  - Omit `floatingZonePill` in `exploration` close-up mode so top-left NPC markers remain unoccluded; enforce `html, body, #root { overflow: hidden !important }` separately from `*::-webkit-scrollbar` in `_layout.tsx`.

## 2026-11-11 — Cycle 81: Mobile Game UI Layout Principles (Floating HUD, Upper-Mid Framing & Slim Contextual Talk Capsule)

- **Maximizing Playable Viewport (`world.tsx` & `_layout.tsx`):**
  - Remove solid header stacking during `mode === "exploration"`: `topToolbar` renders as a translucent overlay (`styles.floatingToolbarOverlay`, `top: 6`) inside `gameViewport`, maximizing open sky/courtyard canvas height on short/landscape viewports (`640x360`). Only `mode === "overworld"` retains the dedicated top strip, while `overviewScrollContent` adds `paddingTop: 42` so overview pins clear floating top controls.
  - Suppress clunky web grey scrollbar tracks globally via `<style id="hc-hide-web-scrollbars">` (`scrollbar-width: none !important`, `::-webkit-scrollbar { display: none }`) while preserving native wheel/touch pan gestures.
- **Anti-Occlusion Camera & Zone Indicator Hierarchy (`centerCameraOn` & `floatingZonePill`):**
  - Measure real layout dimensions (`onLayout={handleViewportLayout}` -> `vpSize`) and frame characters in the upper-middle safe zone (`ratioY = 0.36` when `viewportHeight < 420`, `0.44` taller) with `extraBottomPad = 76` on `vScrollContent`, preventing south landmarks (`Đấu Trường Thói Quen Lành Mạnh`) from positioning behind bottom UI.
  - Hide `floatingZonePill` whenever `activeTalkLandmark` or `zoomMode === "overview"` is visible to eliminate duplicate station labels.
- **Progressive Disclosure Contextual Action Pill (`activeTalkFloatingHud`):**
  - Replace full-width multi-line dialogue box (`~88px` tall) with a compact single-row rounded capsule (`bottom: 6`, `maxWidth: 460`, `borderRadius: 999`, `<= 54px` height in landscape CDP check) containing `30x30` icon/avatar, single-line title + role, `Khám Phá →` CTA, and an explicit `dismiss-talk-hud` `×` button.

## 2026-11-11 — Cycle 80: Steady Interactive 2.5D Parallax & `360px` Top HUD Pill Fit

- **2.5D Depth Layers (`app/(game)/home.tsx`):** Applied `110%` overscan backdrop (`bgOverscanLayer`), wall depth `0.12`, back-to-front floor depth (`0.35..1.08`), and matching Chibi depth offset purely driven by user horizontal panning (`onScroll`) or pointer drag (`beginWebDrag`) — zero continuous ambient boat-rocking.
- **`360px` Top Floating HUD Row:** Compacted light/reward pill copy below `385px` (`Auto`/`Ngày`/`Đêm`, `Nhận Quà`) with `4px` cluster gap so all 5 top controls (`Ban ngày/Auto`, `↻`, `2.5D`, `Toàn cảnh`, `Nhận Quà`) fit cleanly within `360px` (`topHud360Audit` PASS).

---

## 2026-11-11 — Cycle 78: 2.5D Companion Perspective Scaling & Lakeside Balcony Access

- **Proportional Chibi Scale (`app/(game)/home.tsx`):** Tuned foreground Chibi width cap to `72px` (`~0.095 * stageHeight`, down from `104px`) so characters no longer dwarf Sofa/Bed props on narrow phones.
- **Depth-Matched Shrinking & Occlusion:** Rendered dimensions (`chibiRenderW`, `chibiRenderH`) scale smoothly from `0.48x` outdoors on the wooden lakeside balcony (`y = 56.5%..62.4%`) up to `1.02x` in foreground (`y = 82%`) anchored at feet; `zIndex` drops to `500` behind Sofa/Bed when outdoors or walking past the back sofa line (`y < 63%`) and rises to `1050` in foreground.
- **Outdoor Balcony Deck:** Opened center slider threshold (`x = 42.5..57.5`) so companions roam naturally both indoors around furniture and outdoors along the lakeside glass railing (`home-10-balcony-perspective-390x844.png`).

---

## 2026-11-11 — Cycle 77: Slim Safe-Area Bottom Navigation & Auto-Compact Landscape Dock

- **6-Tab Bottom Navigation (`app/(game)/_layout.tsx`):** Dynamic height using `useSafeAreaInsets()`: **`58px + insets.bottom`** (`iconSize: 18`, `paddingTop: 3`, `paddingBottom: 5`) on portrait/desktop (`height >= 520`) and **`40px + insets.bottom`** with `beside-icon` layout (`iconSize: 15`, `fontSize: 9` on widths `< 760` so `"Hành Trình"` never ellipsizes at `640px`) on short landscape screens (`height < 520`).
- **Slimmer Home Dock & Scrollbar Removal (`app/(game)/home.tsx`):** Reduced item tray card height from `48px` to `36px`, lighter `0.78` opacity capsule, auto-collapsed horizontal shelf when `screenHeight < 480`, and Web `overflowX`/`overflowY` hiding when full-bleed stage fits viewport width.

---

## 2026-11-11 — Cycle 76: Full-Screen Chalet Stage & Non-Clipping Bottom Floating Dock (`360px+` to `1280px`)

- **Edge-to-Edge Full-Screen Chalet Stage (`app/(game)/home.tsx`):** Eliminated stacked header/room-tab/grid dashboard chrome around the stage so the 16:9 Swiss Chalet occupies the entire vertical & horizontal viewport (`flex: 1`) between `TopHud` and the 6-tab bottom navigation bar, matching the full-screen immersion of `world.tsx`.
- **Floating Overlays:** Placed lightweight translucent action pills (`Tự động`/`Ban ngày`/`Ban đêm`, `↻`, `Toàn cảnh`/`Full màn`, `Nhận Quà (1/2)`) over the top timber beams and floating centered toast/empty callouts clear of the bottom dock.
- **Bottom Floating Dock (`wellness-home-bottom-dock`):** Compact rounded card anchored above the 6-tab bar combining `Phòng Khách | Phòng Ngủ` room pills, `Đã nhận (X)`, `Kho (10)`, `Chibi`, collapse button (`▾`/`▴`), and a single 48px horizontal card tray; uses responsive compact 2-bar header stacking below `600px` width so zero buttons or text truncate at `360x800`, and centers as a single compact bar (`maxWidth: 700`) on `1280x800` desktop.
- **Sprite Polish:** Cropped stray sheet edge artifact from `chibi-lily.png` (`100x144` -> `100x127`) and removed redundant CSS oval floor shadow under all 5 Chibi sprites.

---

## 2026-11-11 — Cycle 75: 6-Tab Mobile Navigation (`Ngôi Nhà`), Swiss Chalet Home Screen & Web-Parity Polish

- **6-Tab Bottom Bar (`app/(game)/_layout.tsx`):** Added **Ngôi Nhà** (`Home` icon from `lucide-react-native`, right after `Thế Giới`). Tuned mobile tab bar layout (`tabBarItemStyle: { paddingHorizontal: 0, minWidth: 0 }`, `tabBarAllowFontScaling: false`, `fontSize: 9`, `letterSpacing: -0.1`) so all 6 Vietnamese tab labels (`Thế Giới`, `Ngôi Nhà`, `Hành Trình`, `Nhiệm Vụ`, `Túi Đồ`, `Cá Nhân`) render cleanly with zero truncation from `360px` Android upward.
- **Alpine Chalet Wellness Home Stage (`app/(game)/home.tsx`):**
  - Responsive 16:9 panoramic room stage (`maxWidth: 920` on desktop web, optional `Phóng to` / `Vừa khung` zoom on mobile viewports), smooth Day/Night switching (`Tự động`, `Ban ngày`, `Ban đêm`), and 2-room pill switcher (`Phòng Khách` / `Phòng Ngủ`).
  - Foreground depth sorting places Chibi companions (`{ x: 75, y: 81 }` default spawn) cleanly in front of placed `Sofa` / `Bed` items; clean full-body companion sprites replace sticker-labeled PNG crops; Web uses `animationType="none"` on Home modals (`Welcome`, `Daily Pick 1/2`, `Item Detail`, `Reset Confirm`) to avoid `react-native-web` mid-fade opacity ghosts.
  - Bottom controls include interactive 5-Chibi switcher strip (`Mia`, `Anna`, `Leo`, `Ben`, `Lily`), 10-item collection grid showing unlocked vs locked status per room, in-app Reset modal, and daily `Nhận Quà (1/2)` picker.
- **Browser-Verified Status:** Verified across `360x800`, `390x844`, and `1280x800` in Chrome CDP (`run-full-ux-player-acceptance.mjs` Round 3 PASS).

---

## 2026-11-10 — Cycle 73: Zero-Clip World Toolbar, Overview Station Navigator, Duplicate-EXP Guard Feedback & Journey 7-Day Timeline

- **Toolbar Chống Cắt Chữ & Plaque Nổi (`world.tsx`)**: Bốn nút điều hướng (`Vương Quốc`, `Thung Lũng`, `Toàn Cảnh`, `8 Vùng`) vừa khít bề rộng `360px+` không bị cắt ngang mép phải; Plaque vùng đất `🧭 ...` đặt nổi góc trên trái bản đồ thay cho tọa độ debug. Chế độ `Toàn Cảnh` tỷ lệ chính xác tọa độ 7 điểm chạm kèm danh sách điều hướng nhanh bên dưới.
- **Nhật Ký 7 Ngày & Tách Active / Saved (`journey.tsx`)**: Dải lịch 7 ngày đặt phía trên danh sách thói quen; tách rõ `Mục tiêu đang theo dõi` và `Đã lưu xem sau` thông qua nút `Lưu sau` / `Kích hoạt`.
- **Khóa Cộng Trùng EXP (`daily-care.tsx`)**: Sau lần lưu đầu tiên nhận đúng tổng EXP (`+35 EXP`), nút CTA đổi thành `CẬP NHẬT ĐIỂM DANH HÔM NAY ✓`, các lần lưu lại giữ nguyên EXP ngày và hiển thị thông báo rõ ràng.

---

## 2026-11-10 — Cycle 72: Mobile Cozy Fantasy RPG Transformation, Clean World Map (No Debug Coordinates/Dots), Daily Quest Board & Inventory Architecture

- **World RPG Clean Screen (`world.tsx`)**:
  - Loại bỏ 100% tọa độ debug X/Y (`X: 430 | Y: 660`), thay thế bằng Plaque Vùng Đất RPG `🧭 Đường Mòn Vận Động Khớp`.
  - Xóa bỏ 100% các điểm chấm vàng `walkableTrailDot` gây rối mắt.
  - Cố định nhân vật đứng vững chãi trên mặt đường đá sỏi `(430, 660)` cạnh NPC Trail Explorer; Bé Cáo Lumi đồng hành bay lượn tự nhiên.
  - Xóa bỏ tuyên bố lâm sàng 35% gout trên landmark thực vật, chuyển thành tri thức dinh dưỡng lối sống.
- **Bảng Nhiệm Vụ Hôm Nay (`daily-care.tsx`)**:
  - Giao diện RPG Quest Board với Streak Badge (`🔥 Chuỗi 3 Ngày`), Progress Bar (`3/3 Nhiệm vụ`), và `+35 EXP tối đa`.
  - Quest Card tối giản: Icon tròn, tiêu đề ngắn, mục tiêu an toàn cá nhân hóa, EXP reward, 3 nút segmented `[✓ Đã làm]`, `[○ Chưa làm]`, `[⊗ Bỏ qua]`.
  - Ngăn kéo gập mở y khoa `[ℹ️ Xem cơ chế & bằng chứng y khoa]` ẩn trích dẫn PubMed và chi tiết dài.
  - Modal chúc mừng 5 sao vàng kèm Bé Cáo Lumi khi lưu điểm danh.
- **Túi Đồ & Sổ Tay Tri Thức (`inventory.tsx`)**:
  - Tách bạch 2 Tab riêng biệt: `[Vật Phẩm & Trang Bị (3)]` vs `[Sổ Tay Tri Thức (4)]`.
  - 3 Ô Trang Bị Nhiệm Vụ hiển thị trực quan ở đầu màn hình.
  - Chuẩn hóa nút bấm: Nếu đang trang bị hiển thị `Tháo Khỏi Ô X`, nếu chưa dùng hiển thị `Trang bị Ô 1/2/3`.
  - Thẻ tri thức y khoa: Hiển thị badge kiểm định `Tri thức y khoa lối sống • Đã lưu vào Sổ Tay`, tuyệt đối không có nút trang bị.

---

## 2026-11-10 — Cycle 66: Mobile Habits Management, Add Habit Modal, Daily Check-in 5-Star HUD & Single-line 3D CTA

- **Single-Line 3D Gold CTA Button (Chống Vỡ Dòng Quiz)**:
  - Nút CTA bước vào vương quốc: `VÀO VƯƠNG QUỐC HEALTHCLUES (+50 EXP)`.
  - Thiết kế: Bo góc `radius.xl`, viền vàng kim `#fde047` nổi 2px, nền ngọc lục bảo `#10b981`, đổ bóng 3D cao cấp.
  - Typography: Kích thước 13px, font weight `800`, thuộc tính `numberOfLines={1}` đảm bảo hiển thị hoàn hảo trên 1 dòng duy nhất trên mọi màn hình di động 360px - 430px.
- **Tab Hành Trình — Companion Guidance & Add Habit Modal (`journey.tsx`)**:
  - Banner Bé Cáo Lumi: Avatar 44x44px, viền xanh ngọc, dòng trích dẫn truyền cảm hứng sống khỏe dịu mắt.
  - Thẻ thói quen y khoa: Nền ngọc sẫm `#0d2620`, viền sáng mờ, huy hiệu danh mục & EXP nổi bật, nhãn bằng chứng y khoa PubMed.
  - Modal Thêm Thói Quen (Glassmorphism):
    * Gợi ý nhanh từ Lumi: 5 thẻ con nhộng tương tác (Uống nước ấm, Thở 4-7-8, Đi bộ, Tắt màn hình, Rau xanh).
    * Bộ chọn danh mục & tần suất dạng pill bấm chuyển trạng thái tức thì.
    * Nút hành động: `[LƯU THÓI QUEN VÀO HÀNH TRÌNH (+20 EXP)]` với icon Check xanh ngọc.
- **Tab Nhiệm Vụ — Daily Habits Check-in & 5-Star Rating HUD (`daily-care.tsx`)**:
  - Streak HUD: Huy hiệu ngọn lửa cam phát sáng `[🔥 Chuỗi 3 Ngày Liên Tiếp]` và chứng nhận an toàn dữ liệu.
  - Star Rating HUD: Hàng 5 sao vàng ⭐⭐⭐⭐⭐ co giãn, tự động sáng vàng theo tỷ lệ hoàn thành (`calculateStars`).
  - Thẻ thói quen hàng ngày: Tích hợp 3 nút trạng thái trực quan:
    * `[✅ Đã làm]`: Nền ngọc sáng `#10b981`, viền vàng `#fde047`, chữ màu lục sẫm nổi bật.
    * `[⏳ Chưa làm]`: Nền kính mờ, chữ vàng kem.
    * `[⏭️ Bỏ qua]`: Nền đỏ mờ, chữ đỏ cảnh báo.
  - Nút xác nhận: `[LƯU ĐIỂM DANH HÔM NAY (+EXP)]` bo tròn 3D viền vàng kim rực rỡ.
- **Tab Túi Đồ — Bộ Sưu Tập & Tri Thức (`inventory.tsx`)**:
  - Tiêu đề "Bộ Sưu Tập & Tri Thức", bổ sung banner hướng dẫn điều hướng người chơi đến tab Nhiệm Vụ và Hành Trình để điểm danh thói quen.

---

## 2026-11-09 — Cycle 64: Mobile Welcome & Quiz Parity with Web Game `/play` & Optimized Landmark Pin Hierarchy

- **Mobile Welcome Screen Replica (100% Web Parity)**:
  - Ảnh nền toàn màn hình `healthclues-world-overworld.webp` với hiệu ứng vignette tối êm dịu.
  - Top Bar: Huy hiệu la bàn RPG vàng kim "HEALTHCLUES WELLNESS ADVENTURE" góc trái; Nút "Đăng nhập" góc phải.
  - Khối Hero Trung Tâm:
    * Chibi Adventurer Anna nổi bật với hiệu ứng hào quang đom đóm mờ ảo.
    * Eyebrow: "HÀNH TRÌNH SỐNG KHỎE ẤM ÁP" (hoặc "A COZY ADVENTURE FOR YOUR WELLNESS").
    * Typography phân cấp: Tiêu đề lớn "HEALTHCLUES", Subtitle serif ấm áp, dòng mô tả triết lý sống khỏe.
    * Nút chọn ngôn ngữ con nhộng: [English] [Tiếng Việt].
    * Nút 3D Gold Action CTA: "Bắt Đầu Hành Trình (+50 EXP) →" với hiệu ứng đổ bóng nổi 3D và font chữ đậm màu hổ phách sẫm.
    * Liên kết phụ: "Đã có tài khoản? Đăng nhập để tiếp tục →".
- **Parchment Quest Selection UI**:
  - Phong cách giấy da cổ điển: Header nhân vật Chibi Anna "CHƯƠNG HIỆN TẠI: Chọn hành trình khởi đầu của bạn".
  - Thẻ bài Vương Quốc HealthClues: Huy hiệu [✦ ĐANG MỞ (PLAYABLE)], hình ảnh cảnh quan Realm và linh vật Bé Cáo Lumi.
  - Thẻ bài Thung Lũng Giấc Ngủ: Huy hiệu [🔒 TẠM KHÓA (SẮP MỞ)] màu vàng hổ phách, khi chạm vào hiển thị Toast thông báo đang bảo trì & nâng cấp trải nghiệm giấc ngủ sâu.
- **Optimized RPG Landmark Pin Hierarchy (Chống Vỡ Chữ/Cắt Cụt)**:
  - Container mở rộng 120x64px căn giữa tâm toạ độ tuyệt đối, loại bỏ hoàn toàn hiện tượng container 44px ép ngắt dòng từng từ thành các khối tròn đen thùi lùi.
  - Huy hiệu Building Pin: Vòng tròn 36x36px kính mờ sẫm `rgba(6, 26, 21, 0.95)`, viền vàng kim `#f59e0b` nổi 1.5px, icon bên trong màu vàng kem `#fef08a`.
  - Bảng tên Landmark: Bảng con nhộng bo tròn `rgba(6, 24, 19, 0.95)`, viền mỏng vàng hổ phách, chữ vàng kem `#fef08a` căn giữa, không bao giờ bị cắt chữ hay vỡ dòng.
  - NPC Pin: Sprite nhân vật 44x52px đứng vững chãi có bóng đổ mặt đất, nhãn tên kèm chấm xanh online phát sáng.
- **Lumi Fox Companion Display**:
  - Khi ở Vương Quốc HealthClues, linh vật đồng hành là Bé Cáo Lumi (`lumi_fox_clean.png`) với nhãn tên "Lumi".

---

## 2026-11-09 — Cycle 62: HealthClues Mobile RPG Visual Engine & Expansive World UI

- **16:9 Widescreen Mobile Canvas & Dynamic Viewport Modes**:
  - Full-screen immersion using 1600x900 region blueprints (`sleep-valley-scene-blueprint.webp` and `healthclues-realm-scene-blueprint.webp`).
  - Dual-mode camera control:
    * `Toàn Cảnh` (Overview Mode): Downscales the entire 1600x900 map cleanly into the mobile screen width with aspect ratio preservation. All 7 landmarks and NPCs are visible simultaneously.
    * `Cận Cảnh 1x` (Panoramic 1x Mode): 1:1 pixel rendering with automatic camera follow tracking the player's real-time position.
- **Floating Coordinates & Status HUD**:
  - Compact glassmorphism pill docked below the top toolbar.
  - Displays live coordinates `X: {playerPos.x} | Y: {playerPos.y}` alongside current zone badge.
  - Displays real-time movement waypoint `Đang bước tới [ X: ... | Y: ... ]` while walking.
- **Active Talk HUD (Bottom Floating Overlay)**:
  - Slide-up bottom card anchored above the navigation dock when player is near an NPC (< 75px).
  - Displays NPC avatar, distinct role badge, dialogue snippet in quotes, and emerald CTA "Khám Phá".
- **RewardReveal & ExpGain Components**:
  - Modal with golden radial glow, pulsing ring, and spring scale animation.
  - Floating EXP text indicators with smooth upward translation and fade-out.

---

## 2026-11-09 — Cycle 60: Resilient Furniture Image Upload & Stage Canvas Drag-and-Drop

- **Admin Studio Sidebar Quick Upload Banner (`/admin/healthclues-home`)**:
  - Direct visual card at the top of the furniture inventory list: "➕ Tải thêm đồ nội thất từ máy".
  - One-click trigger for system file dialog, supporting PNG, WebP, JPG, JPEG, and SVG.
  - Displays instant loading indicator and dimension feedback upon image ingestion.
- **Stage Canvas Drag & Drop Overlay**:
  - Dragging an image from the operating system directly over the 16:9 chalet canvas triggers an emerald pulsing overlay ("Thả Ảnh Vào Đây Để Đặt Đồ Nội Thất!").
  - On drop, the item is centered at the exact drop coordinates `(xPct, yPct)`, selected, and wrapped in 4-corner perspective handles.
- **Instant Zero-Flicker Previews**:
  - Image preview renders instantly via browser Data URL before background synchronization completes, eliminating loading delay or broken image states.

---

## 2026-11-09 — Cycle 59: Swiss Chalet Walkable Mask Painter & Compact Journey Real Estate

- **Admin NavMesh Painter Toolbar (`/admin/healthclues-home`)**:
  - Direct canvas overlay over the 16:9 chalet stage with high-contrast semi-transparent emerald brush (`rgba(16, 185, 129, 0.50)`).
  - Floating pill toolbar featuring:
    * 🟢 Cọ Vẽ (Brush) / ⚪ Cọ Tẩy (Eraser with `destination-out`).
    * Three brush sizes: Nhỏ (20px), Vừa (45px), Lớn (80px).
    * 🎯 Mẫu Chuẩn (One-click default floor polygon for Living Room and Bedroom).
    * 🧹 Xóa (Clear all mask).
    * 🚶 Thử Đi Lại (Interactive live movement mode with animated Chibi Anna).
    * 💾 Lưu Mặt Sàn (Immediate server and local persistence).
- **In-Game Obstacle Avoidance (`HealthCluesWellnessHome.tsx`)**:
  - Chibi Anna checks the collision mask before moving, ensuring she stays strictly within the painted floor area and avoids walking over furniture, fireplaces, or out of bounds.
- **Ultra-Compact Journey Modal Header (`world-adventure.css`)**:
  - Saved >60% vertical space in the "Hành trình của tôi" modal by hiding the kicker (`HEALTHCLUES · HEALTHCLUES REALM`) and redundant habit counter strip.
  - Active habits render immediately beneath the action chips.
- **Clean Chalet Header & Persistent State**:
  - Removed `2/10` badge from Chalet title header.
  - Permanently suppressed housewarming gift modal on subsequent visits.

---

## 2026-11-09 — Cycle 52: Restored & Ultra-Compact RPG Bottom Dock in Landscape Mode

- **Compact Bottom Dock in Landscape (`world-adventure.css`)**:
  - Re-enabled bottom navigation menu on horizontal screens (`orientation: landscape` / `max-height: 600px`).
  - Styled as an ultra-slim, floating capsule dock with 34px buttons, 15px SVG icons, and 0.58rem bold labels.
  - Floating safely above bottom safe area: `bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px))`.
  - Occupies less than 9% of total screen height, maintaining over 91% screen area for the edge-to-edge game canvas.
  - Full 5-button functionality: Map, Journey, Reminders, Today, Home.
- **Collision Prevention for Floating Overlays**:
  - Companion button (`.hc-rpg-lumi-reopen-btn`) floats above dock at `bottom: 2.8rem`.
  - NPC talk banner (`.hc-rpg-talk`) and Lumi dialogue box float at `bottom: 3.4rem`.
- **Topbar Level HUD Stability in Landscape**:
  - Hid mystery reward gift box on landscape/short viewports, preventing overlap with the level progress indicator.

---

## 2026-11-09 — Cycle 51: Chalet Header Badge 2/10 Elimination & Seamless Re-entry Experience

- **Header Simplification (`HealthCluesWellnessHome.tsx`, `wellness-home.css`)**:
  - Removed green counter badge `.hc-wellness-home-badge` (`2/10`) adjacent to chalet title.
  - The top navigation bar displays only the clean home icon and title ("Căn Nhà Thụy Sĩ"), eliminating visual noise.
- **Persistent Chalet Experience**:
  - On returning to the chalet, the room immediately renders with previously unlocked furniture (e.g. the starter Luxury Sofa) without modal interruptions.
  - Welcome gift dialog is permanently suppressed once claimed.

---

## 2026-11-09 — Cycle 50: Compact Mobile Journey Header & Habit Real Estate Optimization

- **Ultra-Slim Journey Modal Header (`world-adventure.css`)**:
  - Hid redundant header kicker (`HEALTHCLUES · HEALTHCLUES REALM`) on mobile viewports.
  - Reduced modal header height to 36px with 26px close button and 0.95rem title font size.
- **Segmented Control Navigation**:
  - Replaced bulky 44px pill tabs with a modern, compact segmented control (`height: 30px`, `padding: 2px`, `border-radius: 8px`).
- **Compact Action Toolbar**:
  - Slimmed `.hc-add-habit-btn` and `.hc-view-all-plan-btn` to 28px chips with crisp padding.
- **Hidden Redundant Summary Strip**:
  - Hid `.hc-habits-summary-strip` (`🎯 Đang theo dõi {N} thói quen · ↓ Cuộn xem tất cả`) on mobile (`display: none !important;`).
- **Habit Tracking Immediate Visibility**:
  - Saved **100px+ of vertical screen space**, allowing active habit cards to appear immediately in view without requiring scrolling.

---

## 2026-11-09 — Cycle 47: Swiss Alpine Chalet Landscape Full-Screen & Mobile Journey Refinements

- **Landscape Mode Full-Screen Immersion (`HealthCluesWellnessHome.tsx`, `wellness-home.css`)**:
  - Entire stage expands to 100% viewport width and height (`100vw x 100vh`) with zero margins, borders, or box-shadows.
  - Removed bottom room card (`.hc-mobile-room-card`); panoramic mountain and lake views are 100% unobstructed.
  - Header controls float with a subtle dark-to-transparent linear gradient at the top ceiling.
  - Room switching tabs (`Living Room` / `Bedroom`) are anchored at `bottom: 0.75rem`, perfectly reachable by thumbs.
- **Mobile RPG HUD Topbar Stability (`world-adventure.css`)**:
  - Scoped media queries to `@media (max-width: 768px), (max-height: 550px)` ensuring landscape smartphones (height 360-430px) trigger compact mobile styles rather than desktop layout.
  - Eliminated level title overlap with next reward mystery gift box (`.hc-rpg-next-reward`); safety margin > 25px strictly maintained.
  - Hidden desktop-only controls (`.is-mobile-hidden`) to avoid horizontal overflow on landscape screens.
- **Habit Tracking Simplification (`WorldAdventureScene.tsx`)**:
  - Removed the red `[ 🗑️ Remove ]` button from player habit cards to eliminate clutter and prevent accidental deletions.

---

## 2026-11-08 — Cycle 39: Swiss Alpine Chalet Admin CMS & Setup Studio UI/UX

- **Admin Studio Visual Placement Interface (`/admin/healthclues-home`)**:
  - Dark Alpine luxury studio aesthetic (`#071311` deep spruce, `#0d221e` jade containers, `#f59e0b` amber accents, `#f7f4e9` warm text).
  - **16:9 Interactive Responsive Stage**:
    * Clean rendering of the authentic chalet room background (`scene_interior_wide` / `scene_bedroom`) with Day/Night toggle preview.
    * Real-time CSS `matrix3d` homography transformation for each piece of furniture.
    * Selected item overlay: SVG quadrilateral dotted bounding box (`#f59e0b`), central move anchor (`Move` icon) for whole-object dragging, and 4 corner handles (`TL`, `TR`, `BR`, `BL`) with cursor resize indicators.
  - **D-Pad & Scale Toolbar**:
    * 4-direction nudger for precise 1% coordinate nudging.
    * Zoom presets (-5%, +5%) to scale furniture proportionally.
  - **Inspector & Form Drawer**:
    * Item selection grid with thumbnails, Vietnamese/English name, room, and ID.
    * Full metadata inputs: Name, Room, Category, Image source, Vietnamese description, Starter item toggle.
    * Precise numerical inputs for `z_index` slider (100-1500) and 4-corner coordinates (`TL`, `TR`, `BR`, `BL`).
    * Direct Save button with visual loading spinner and animated success/error toast alerts.
  - **Instant Cross-Navigation**:
    * Direct link `[Vào Game Test (/play)]` opening the player client in a new tab.

---

## 2026-11-08 — Cycle 37: Swiss Alpine Chalet Wellness Home UI/UX System

- **Full-Screen Immersive Chalet Experience (`HealthCluesWellnessHome.tsx`)**:
  - Direct 1-tap entry from the RPG HUD bottom dock ("Nhà Của Tôi" / "Home") and Camp landmark.
  - Interactive top control bar: Room switcher tabs (`🛋️ Phòng Khách` vs `🛏️ Phòng Ngủ`), furniture counter badge (`X/10 nội thất`), Day/Night 3-state toggle (`Auto Clock` / `Day ☀️` / `Night 🌙`), Daily Reward trigger (`Nhận Thưởng (1 trong 2) 🎁`), and instant Return button (`← Bản đồ`).
  - **4-Corner Homography Projective Geometry (`computeHomography`)**:
    * Dynamically transforms tilted wall paintings and chimney mantle art with CSS `matrix3d(...)` based on 4 bounding corner coordinates in percent.
    * Adapts smoothly across desktop wide-screens and mobile portrait viewports with zero clipping or distortion.
  - **Day 1 Starter Unboxing Dialog (`data-testid="welcome-gift-modal"`)**:
    * Celebratory dark jade modal card with golden gift badge, 3D sofa preview with drop shadow, and unboxing action button.
  - **Mystery Gift Box Integration with Chalet Furniture (`MysteryGiftModal.tsx`)**:
    * Mystery Gift Box modals (Level Milestones on EXP bar and 7-Day Streak milestone) feature realistic transparent PNG previews of authentic Chalet furniture pieces (e.g. Level 3 Classic Grand Piano, Level 2 Oak Table, Level 4 Alpine Planter, Level 5 Fireplace Wall Art, Level 6 Oak Bed, Day 7 Reading Armchair).
    * Includes room badges (`🏡 Nội Thất Phòng Khách` / `🏡 Nội Thất Phòng Ngủ`), radial burst particle animations, automatic unlocking to `/api/healthclues/wellness-home`, and direct 1-click navigation `[🏡 Vào Căn Nhà Trang Trí Ngay]`.
  - **Daily Habit Reward Pick 1 of 2 Modal (`data-testid="daily-reward-modal"`)**:
    * Two interactive 3D cards displaying furniture options (1 Living room, 1 Bedroom) with room badges and hover lift effect. Clicking selects card with an emerald checkmark badge; confirming unlocks item into the respective room with celebratory notification toast.
  - **Multi-Player Visual Isolation**:
    * Fresh accounts start in a pristine empty room with warm guidance hints; each player's unlocked furniture is rendered strictly according to that player's authenticated state.

---

## 2026-11-08 — Cycle 36: Full Modal Windows & Panels Bilingual Localization

- **Zero Vietnamese Leakage in English Mode Across All Modal Windows**:
  - **Reminder Settings Modal (`WorldAdventureScene.tsx`)**:
    - When `locale === "en"`, the modal card renders purely in English:
      * Kicker: `HEALTHCLUES · LUMI REMINDERS` (or `LUNA REMINDERS`).
      * Title: `Lumi daily reminder companion`.
      * Subtitle: `Gentle morning reminder email to start today's wellness habits and reflect on yesterday's check-in. Supportive and zero spam.`
      * Toggle: `🔔 Daily reminder is ON` / `🔕 Daily reminder is OFF`.
      * Fields: `Daily send time`, `Your timezone`.
      * Time slots: `06:30 - Early morning (Fresh start)`, `07:30 - Morning (Recommended: Habits & yesterday's check-in) ⭐`, `08:30 - Workday start`, etc.
      * Timezones: `Asia/Ho_Chi_Minh (Vietnam UTC+7)`, `Europe/Paris (France CET)`, `UTC (Universal Standard Time)`, etc.
      * Actions: `Preview companion email sample`, `Done & Close window`.
      * Footer badge: `✨ 1 email/day · Goals & knowledge · Turn on/off anytime`.
  - **Email Preview Dialog (`showEmailPreview`)**:
    - Complete bilingual localization for email header, metadata labels (`Subject:`, `From:`, `Send time:`), hero title, body copy, gift card, and companion sign-off.
  - **Companion Add-Habit Modal (`CompanionAddHabitModal`)**:
    - Bilingual badge (`Companion Guide`), 1-tap quick suggestion pills (`3-minute deep breathing`, `Drink a warm glass of water`, `Screens off before bed`, `15-minute gentle walk`), success card, and done button.
  - **Player Nickname & Region Entry Dialogs**:
    - Bilingual modal prompts, placeholders, and action buttons.
  - **Living Village Chibi Visitors (`AmbientVillageVisitors.tsx`)**:
    - Added comprehensive English speech pool (`CHIBI_GREETINGS_EN`) for all 5 autonomous chibi characters (Anna, Leo, Mia, Ben, Lily) across NPC encounters, square visits, peer meetings, and player clicks.

---

## 2026-11-08 — Cycle 35: Bilingual Knowledge & Boss Empty State Localization

- **Zero English Leakage in Vietnamese Knowledge View (`KnowledgeJourneyPanel.tsx`)**:
  - The Knowledge Library empty-state box guarantees pure Vietnamese text whenever `locale === "vi"`:
    - Main message: `"Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề này. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác."`
    - Subtitle note: `"HealthClues chỉ hiển thị kiến thức có dẫn nguồn sau khi đã qua kiểm duyệt y tế. Bạn có thể ghé thăm Vườn Thảo Mộc để khám phá và lưu các bài viết khoa học có đối chứng."`
    - Action shortcut button: `[Xem các bài viết thảo mộc đã lưu]` with bookmark icon smoothly toggles the sidebar to saved botanical references.
  - When in English mode (`locale === "en"`), copy cleanly displays:
    `"No reviewed Knowledge is currently available for this topic. HealthClues will not substitute unrelated topics."`
- **Bilingual Knowledge Boss Checkpoint (`BossBattlePanel.tsx`)**:
  - Integrated `useHealthCluesLocale` so that challenge titles, status badges ("Checkpoint cleared" / "Đã vượt qua thử thách"), answer feedback ("Correct answer" / "Đáp án chính xác"), XP rewards, and empty checkpoint messages adapt to the active locale without English leaks.

## 2026-11-08 — Cycle 33: Unified HUD NPC Talk Layer & Dialogue Stacking Overlap Resolution

- **Unified HUD Talk Prompt Layer (`HealthCluesRpgWorldHud.tsx`)**:
  - Moved `.hc-rpg-talk` from the isolated map scene (`.hc-region-scene`, z-index 18) directly into the RPG HUD layer (`.hc-rpg-hud-layer`, z-index 55).
  - Both `.hc-rpg-talk` and `.hc-rpg-bottom-dock` now share the identical HUD DOM tree, permanently resolving CSS Stacking Context entrapment on Desktop (Image 2).
- **Guaranteed Vertical Clearance Across All Breakpoints**:
  - **Desktop**: `.hc-rpg-talk` sits at `bottom: calc(5.85rem + env(safe-area-inset-bottom, 0px))`, providing `+19px` clear air space above the bottom dock (`bottom: 1.25rem` + height ~54px = 4.65rem).
  - **Mobile (<=680px)**: `.hc-rpg-talk` sits at `bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px))`, width `min(94vw, 420px)`, providing `+18px` clear air space above the dock (`bottom: 0.6rem` + height ~48px = 3.6rem).
  - **Short Screen (<=640px height)**: `.hc-rpg-talk` sits at `bottom: calc(4.2rem + env(safe-area-inset-bottom, 0px))`, maintaining `+17px` clear air space.
- **Mutual Exclusivity State Suppression**:
  - When `activeTalk` is truthy, `HealthCluesRpgWorldHud` programmatically unmounts both `.hc-rpg-lumi-dialogue` and `.hc-rpg-lumi-reopen-btn` (`!activeTalk`).
  - Completely eliminates the issue where the circular pet button hovered over the NPC text on mobile (Image 1).
- **Streamlined Mobile Action Buttons**:
  - Replaced oversized button with a sleek pill button (`min-height: 28px; padding: 0.22rem 0.55rem; font-size: 0.7rem`) with `<MessageCircle size={14} />` or `<Compass size={14} />`.
  - Added quick-dismiss close button `(X)` (`.hc-rpg-talk-close-btn`) to easily dismiss prompts when walking past.
  - Text clamped to 2 lines (`-webkit-line-clamp: 2`) preventing vertical card expansion.

---

## 2026-11-08 — Cycle 32: Synchronous Online Adventurers & Multiplayer Village UI

- **Live Adventurer Sprites & Visual Presence (`OnlineAdventurers.tsx`)**:
  - Remote players are rendered on the map canvas using high-fidelity chibi sprites (`chibi-anna`, `chibi-leo`, `chibi-mia`, `chibi-ben`, `chibi-lily`).
  - Online Name Pill: Placed above each player's head, styled with emerald backdrop (`rgba(14, 38, 28, 0.94)`), golden/emerald border, and a pulsing green dot (`🟢 {nickname}`).
  - Smooth Movement Transitions: Coordinate changes animate smoothly with `transition: transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)` and directional walk animations.
- **Peer Interaction Card (`.hc-peer-interact-modal`)**:
  - Clicking on a remote adventurer displays a modal card displaying their chibi avatar thumbnail, nickname, and 3 quick positive actions:
    * `[👋 Vẫy tay chào]`
    * `[✨ Cổ vũ sống khỏe]`
    * `[🍵 Mời tách trà ấm]`
  - Triggering an action spawns a parchment speech bubble (`.hc-chibi-speech-bubble`) above the sender's character for 4.5 seconds.
- **Top HUD Online Counter (`.hc-rpg-online-pill`)**:
  - Top action bar features an online status badge with pulsing green light (`🟢 X online`).
  - Responsive on mobile viewports without overcrowding header controls.

---

## 2026-11-07 — Cycle 31: Habit Management Controls, Timezone Selector & Knowledge UI Polish

- **1-Click Habit Deletion (`WorldAdventureScene.tsx`)**:
  - Each active habit card displays a subtle danger pill button `[Xóa]` on the right.
  - Clicking triggers an instant confirmation dialog, and upon agreement, updates the state and persists the removal.
- **Timezone Selection Dropdown (`ReminderPreferencesPanel.tsx`)**:
  - Replaced manual text input with a styled `<select>` dropdown populated with standard international and regional timezones, preselected to `Asia/Ho_Chi_Minh (Việt Nam UTC+7)`.
  - Added dedicated option `07:30 - Buổi sáng (Khuyên dùng: Nhắc thói quen & check-in hôm qua) ⭐`.
- **Knowledge Book Unsave & Empty State Polish (`KnowledgeJourneyPanel.tsx`)**:
  - Saved articles list includes a direct `[Bỏ lưu]` button with `<Trash2 size={12}/>` icon.
  - Empty clue placeholder displays fully localized Vietnamese notice explaining evidence-based guidelines.

---

## 2026-11-07 — Cycle 30: End-to-End User Experience Polish & Mobile Responsive Refinement

- **Responsive Level Badge Architecture (`HealthCluesRpgWorldHud.tsx`)**:
  - Implemented dual-render title elements with CSS-based visibility:
    * Desktop (`.is-desktop-title`): Displays full role name e.g. `Cấp 1 - Nhà Khám Phá Cõi Sống Khỏe`.
    * Mobile (`.is-mobile-title`): Displays concise role badge e.g. `Cấp 1 · Khám Phá` (`shortTitle`).
  - Completely eliminates mid-word truncation (`Cấp 1 - Nhà Khám P...`) on 390px mobile viewports while preserving complete EXP progress.
- **HUD Consistency & Quest Drawer Terminology**:
  - Standardized right rail heading and floating minimized button label to **"Nhiệm vụ Sống Khỏe"** (with subtitle *"Mục tiêu hôm nay"*), replacing the unnatural hybrid term *"Nhiệm Care"*.
- **Mystery Gift Modal Polish (`MysteryGiftModal.tsx`)**:
  - Refined primary CTA button label to **"✨ Khám Phá Quà Tặng"**, removing redundant `(Khám Phá)` parenthesis text.
  - Ensured reliable dismissibility through three distinct triggers: top-right "×" button, secondary "Đã hiểu" action, and outside backdrop overlay taps.
- **Modal Stacking Context & Tutorial De-confliction (`WorldAdventureScene.tsx`)**:
  - Added strict `!panel` gate to `WorldEntryTutorial`, ensuring first-time onboarding spotlight dialogues never render over active dock drawer panels (Journey, Reminders, Today, Knowledge, Settings).
- **Legibility & Typography Contrast Standards**:
  - Overhauled Journey panel empty state habit recommendations from washed-out `text-amber-200` to high-contrast `#173f33` (heading) and `#38594b` (subtext), exceeding WCAG AAA contrast ratio on parchment backgrounds.
  - Replaced Windows-unfriendly `Georgia, serif` on World Tour heading with system font stack `var(--font-heading, "Segoe UI", -apple-system, system-ui, Roboto, sans-serif)` to eliminate diacritic splitting bug on Vietnamese vowels.
- **Settings Drawer Localization & Layout**:
  - Replaced wide black flex container on language selector with refined `inline-flex` styling.
  - Full Vietnamese localization across all settings drawer options and helper descriptions.

---

## 2026-11-07 — Cycle 29: Botanist RPG Collectible Cards & Visual Plant Artwork

- **Botanist Collectible Card Design (`WellnessEncyclopediaStation.tsx`)**:
  - **Fantasy Storybook / Herbalist Frame**: Replaced the previous generic white document cards with collectible fantasy herb cards featuring a double border (`border-2 border-[#d8cfbe] hover:border-[#b89552]`), warm parchment gradient background (`from-[#fffefc] via-[#fbf8f0] to-[#f6f0e2]`), and subtle elevation shadows on hover.
  - **Hero Botanical Illustration Window**:
    * Rendered at the top of each card (`height: 11rem / 176px - 192px`) featuring authentic antique/scientific botanical plates (Tía tô, Atiso đỏ, Cúc La Mã, Lạc tiên tây).
    * Smooth hover scale transition (`group-hover:scale-105 duration-500`).
    * Layered frosted floating badges: Evidence tier (top-left), Herb category (top-right), and PubMed citations counter with Latin binomial (bottom bar).
- **Concise, Scannable Card Architecture (Zero Wall-of-Text)**:
  - Removed the long 5-line academic paragraph (`shortIntro`) from the overview card, deferring full textual explanations to the detail modal.
  - **🧪 Hoạt chất sinh học chính (Key Bioactives)**: Highlighted in a dedicated amber-toned container (`#f7f3e8`) with rounded white pill tags (e.g. `Rosmarinic acid`, `Luteolin`, `Apigenin`).
  - **🔬 Tác dụng & cơ chế nghiên cứu (Research Highlights)**: Highlighted in a dedicated herbal-green container (`#f2f7f1`) displaying 2-3 concise bullet points with star icons (`✦ Ức chế enzyme XO...`, `✦ Giảm phản ứng viêm & đau khớp...`).
- **Two-Step Information Exploration Flow**:
  - **Step 1 (Overview Card)**: High-level visual discovery with plant illustration, key compounds, and studied effects.
  - **Step 2 (`BotanicalArticleModal.tsx`)**: Clicking `[📖 Đọc chi tiết]` opens the modal with botanical artwork, Latin binomial, verified date, and the complete 12-section scientific breakdown with direct PubMed links.

---

## 2026-11-07 — Cycle 28: NPC Talk Card Mobile Text Overlap & Desktop Dock Clearance Refinement

- **NPC Talk Card (`.hc-rpg-talk`) Layout & Spacing Integrity**:
  - **Desktop Viewport Elevation**: Positioned at `bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px))` with `z-index: 55`, establishing a positive vertical clearance of `+21.2px` strictly above the bottom navigation dock (`.hc-rpg-bottom-dock` at `bottom: 1.25rem`, `z-index: 30`).
  - **Intermediate 1024px Laptop Screens**: Handled via `@media (max-width: 1200px) and (min-width: 681px)` with `left: calc(50% - 60px)` and width clamped to `min(28rem, calc(100vw - 340px))`, guaranteeing `+14.5px` vertical clearance above the dock and zero collision with right-rail quest cards.
  - **Mobile 390×844 Anchoring**: Anchored at `bottom: calc(6.0rem)`, `left: 0.65rem`, `right: 0.65rem`, yielding `+17.3px` vertical clearance above the dock.
- **Mutual Exclusivity Suppression Rule (No More Text Obstruction)**:
  - When an NPC or Landmark talk prompt is active (`body.hc-has-active-talk` or `.has-rpg-hud:has(.hc-rpg-talk)`), the floating circular Lumi companion button (`.hc-rpg-lumi-reopen-btn`) and Lumi dialogue bubble (`.hc-rpg-lumi-dialogue`) are completely suppressed with `opacity: 0 !important; pointer-events: none !important; transform: scale(0.85) !important`.
  - Completely eliminates the issue where the circular button overlapped dialogue copy (`...ng bạn đến đường mòn. Hãy khám...`).
- **Sleek Pill Action Button (`.hc-rpg-talk-action-btn`)**:
  - Replaced oversized uppercase `[TRÒ CHUYỆN]` button with a compact pill button featuring a dedicated `<MessageCircle size={14} />` icon and title-case `"Trò chuyện"` text.
  - Height: `30px - 34px`, width: `~105px` (compact, leaves >70% of card width for readable dialogue text).
- **Integrated NPC Thumbnail Avatar (`.hc-rpg-talk-avatar`)**:
  - Placed inside `.hc-rpg-talk` as a standard flex child, displaying NPC artwork (or landmark icon fallback) inside a circular border, ensuring avatar graphics cannot decouple or float erratically over copy.

---

## 2026-11-07 — Cycle 27: Expired Session UI/UX Recovery & Auto Sign-In Modal

- **Session Expiration Guard & Instant Recovery UI**:
  - Replaced the confusing fallback loading view on `/vi/wellness/healthclues/world` (which showed `"✨ Đang mở Cõi Sống Khỏe của bạn..."` with a non-working `[Vào ngay Cõi Sống Khỏe ->]` button) with an explicit session-expired state.
  - Expired UI presents a distinct warning card with a clean lock icon 🔒, amber message `"Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ"`, and a clear action button `[Đăng nhập lại ngay ->]` linking to `/play?signin=1&expired=1`.
- **Automatic Sign-In Modal (`HealthCluesWelcome.tsx`)**:
  - Intercepts query params `?signin=1&expired=1` on `/play` to automatically launch the sign-in modal on mount without requiring the user to locate or click the "Đăng nhập" header button.
  - Injected an amber notification banner above the auth choices:
    * Background: `rgb(254 243 199)` (amber-50), border: `rgb(245 158 11)` (amber-400), text: `rgb(180 83 9)` (amber-700).
    * Clear informative text: *"Phiên đăng nhập trước đã hết hạn. Vui lòng đăng nhập lại để tiếp tục hành trình."*
  - Dual 1-click re-authentication options displayed with high contrast:
    * Google 1-Click (`Tiếp tục với Google`) button with authentic 4-color Google logo.
    * Email magic link option with input field and `[Gửi liên kết đăng nhập]` button.

---

## 2026-11-06 — Cycle 24: NPC/Lumi Dialogue Clearance & Mystery Gift Box Unboxing Visuals

- **NPC / Lumi Dialogue Box Clearance & Zero Dock Clipping**:
  - Elevated `.hc-rpg-lumi-dialogue` and `.hc-rpg-lumi-reopen-btn` to `z-index: 50` (well above `.hc-rpg-bottom-dock` `z-index: 30`), ensuring dialogue never renders behind the dock.
  - Increased bottom spacing clearance across all breakpoints:
    * Desktop: `bottom: calc(7.8rem + env(safe-area-inset-bottom, 0px))` (clearance: +31px).
    * Tablet (<=1024px): `bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px))` (clearance: +26px).
    * Mobile (<=768px): `bottom: calc(6.8rem + env(safe-area-inset-bottom, 0px))` (clearance: +48px).
    * Mobile compact (<=680px): `bottom: calc(6.2rem + env(safe-area-inset-bottom, 0px))`.
  - Added dedicated `@media (max-height: 640px)` rule for mobile landscape and short laptop window heights:
    * Dialogue is clamped to `max-width: min(360px, 42vw)`, padding is streamlined, and `bottom: calc(5.4rem)`.
    * Bottom dock menu is anchored to `bottom: calc(0.35rem)` with compact padding.
    * Clearance is verified at +24px on 1024×581, eliminating all vertical and horizontal collision between dialogue bubbles and the dock.

- **Mystery Gift Box (`MysteryGiftModal`) Pointer Events & Dismissal Safety**:
  - `MysteryGiftModal` is rendered in HUD layer (`.hc-rpg-hud-layer` which specifies `pointer-events: none`).
  - Added explicit `pointer-events: auto;` in CSS and defensive inline style on the backdrop, modal card, close button `(X)`, secondary button `"Đã hiểu"`, and primary claim buttons.
  - Added `e.stopPropagation()` on all dismiss triggers to prevent pointer events leaking or bubbling to world canvas beneath.
  - Verified across real mouse click interactions: close button `(X)`, secondary action button `"Đã hiểu"`, and clicking outside the modal card (backdrop) cleanly dismiss the modal.
  - **Top HUD Reward Pill (`.hc-rpg-next-reward`)**:
    * Secrets preserved: Does not reveal secret reward names prior to unboxing.
    * Icon: Animated Mystery Gift Box 🎁 (`.hc-rpg-mystery-icon`) with golden gradient aura, sparkling star (`✨`), and smooth hover bounce.
    * Kicker: `Phần thưởng Cấp 2` / `Level 2 Reward`.
    * Title: `Hộp Quà Bí Ẩn 🎁` / `Mystery Gift Box 🎁`.
    * Description: `Đạt Cấp 2 để mở quà bất ngờ!` / `Reach Level 2 to unlock surprise gift!`.
  - **7-Day Streak Reward Card (`.hc-rpg-day7-box`)**:
    * Icon: Bouncing Day 7 Mystery Gift Box 🎁 with golden shimmer border.
    * Title: `Hộp Quà Bí Ẩn Ngày 7 🎁` / `Day 7 Mystery Gift Box 🎁`.
    * Description: `Hoàn thành 7 ngày để mở quà bất ngờ!` / `Complete 7 days to reveal surprise gift!`.
  - **Unboxing Modal Sequence (`MysteryGiftModal.tsx`)**:
    * **Stage 1 (Sealed / Idle)**: Centered in screen with radial backdrop blur (`rgba(6, 21, 18, 0.88)`). 3D-styled golden ribboned mystery box floats with orbiting stars. Clear milestone requirement status pill with lock/check states, plus direct `[✨ Chạm Để Mở Quà]` button for instant excitement and testing.
    * **Stage 2 (Opening / Unboxing)**:
      - 1400ms choreographed sequence:
      - Box anticipation wobble (`hcBoxOpenSequence`) with increasing shake and scale up to 1.4x zoom.
      - Box lid pops up and tilts away (`hcLidPop`) while glowing radiant light beam erupts from within.
      - 360-degree rotating sunburst rays (`hcSunburstSpin`) and 28 radial confetti/emoji particles (`✨⭐🎉`) burst outward.
    * **Stage 3 (Revealed)**:
      - Mystery reward levitates into view with glowing golden halo.
      - Starlight Lantern (`🏮 Đèn Lồng Ánh Sao Kỳ Diệu`) or Perseverance Badge (`🏅 Huy Hiệu Người Kiên Trì`) is unveiled with rarity banner, lore description, and EXP bonus badges (`+50 EXP` / `+150 EXP`).
      - High-impact CTA: `[ 🌟 Nhận Quà & Khám Phá Tiếp 🌟 ]` + `[ Mở lại hiệu ứng 🔄 ]`.

---

## 2026-11-06 — Cycle 21: World Preview Modal Google 1-Click + Email Auth, Map Header Sign-In, & Zero-Bounce Landing

- **World Preview Map Authentication Integration**:
  - Modal "Tạo hành trình của bạn" (`HealthCluesWorldPreview.tsx`) now features a prominent **[ Tiếp tục với Google (1 chạm vào game) ]** button at the top, styled with an authentic Google 4-color SVG logo, `#173f36` border, and instant hover effects.
  - Centered divider: `─── Hoặc tiếp tục bằng email ───`.
  - Streamlined email form with primary submit button `[ Gửi liên kết đăng nhập qua Email ]` with `ShieldCheck` icon.
  - Consent checkbox defaults to checked (`consent = true`), removing button-disabling friction while preserving transparency.
  - Added top status bar `[ Đăng nhập ]` button with `LogIn` icon on the World Preview map for direct modal access.

- **Landing Page `/play` Preservation**:
  - Direct visits to `/play` always render the HealthClues Welcome landing page with top-right `[ Đăng nhập ]` button and hero `[ Bắt đầu hành trình ]` CTA, preventing guests from being unexpectedly bounced into the map preview.

---

## 2026-11-06 — Cycle 20: Zero-Friction Quiz Onboarding, Direct Game Entry & Landing Page Sign-In Modal

- **Zero-Friction Discovery Quiz & Age Checkbox Removal**:
  - Removed mandatory youth gating checkbox from Question 2 (`HealthCluesGoalFirstDiscovery.tsx`).
  - Screen 2 now presents factor cards and optional notes with the primary CTA `[Tiếp tục kích hoạt tài khoản]` directly enabled.
  - Safe usage notice remains rendered with clear medical disclaimer icon.
  - Free-text input in "Vấn đề khác" parses keywords (e.g. `stress`, `căng thẳng`, `áp lực`, `lo âu`) and surfaces 4 tailored stress-reduction habit quests in the Plan Builder.

- **Dual-Method Auth Modal on Landing Page (`/play`)**:
  - Positioned top-right quick sign-in pill button with gold border, dark background, and LogIn icon.
  - Secondary accessible text link placed underneath the primary `[Bắt đầu hành trình]` hero CTA.
  - Modal features:
    * **Google 1-Click**: Branded Google button triggering Supabase OAuth.
    * **Email Magic Link**: Email input field with immediate inline dispatch feedback and validation.
    * Dark-gold parchment aesthetic consistent with HealthClues RPG theme.

- **Direct Game Entry & Zero-Loop Navigation**:
  - Magic link callback automatically parses access tokens, saves session to `localStorage`, and routes players directly into `/wellness/healthclues/world`, completely eliminating the landing hero and quiz draft restart loops.

---

## 2026-11-06 — Cycle 17: Living Village V1 & Chibi Adventurer Visual Architecture

- **Chibi Adventurer Visual Style & Sprite Replacement**:
  - Extracted transparent 2.5D chibi sprites from `App/references/charactor.png`:
    * Player Character & Anna: Green cloak with golden leaf brooch (`chibi-anna.png`).
    * Leo: Deep blue/teal cloak with beret (`chibi-leo.png`).
    * Mia: Cream cloak with white flower (`chibi-mia.png`).
    * Ben: Navy crescent cloak with round glasses (`chibi-ben.png`).
    * Lily: Purple cloak with white flower (`chibi-lily.png`).
  - Cloaks cover feet, giving a gentle gliding step and subtle bobbing idle motion.
  - Soft radial ellipse ground shadow beneath every chibi (`.hc-chibi-shadow`).
  - High-visibility name pills: Dark emerald background (`rgba(14, 30, 24, 0.9)`), gold border, white text above head. Player character gets a gold-bordered `You` tag with a warm golden aura.

- **Living Village Simulation (`AmbientVillageVisitors`)**:
  - 5 autonomous visitors roaming along authored cobblestone paths in HealthClues Realm.
  - Waypoint navigation guarantees characters never walk across water, buildings, or fences.
  - Interactive speech bubbles: Clicking on a visitor triggers a friendly voice quote. Visitors reaching NPCs trigger brief dialogue with dynamic NPC reply bubbles.

## 2026-11-06 — Cycle 15: Post-Quiz Plan Proposals Pipeline & Immediate Personalized Plan Transition

- **Immediate Post-Quiz Transition**:
  - Eliminates the previous interstitial English barrier ("BUILD MY WELLNESS PLAN").
  - On completing the onboarding quiz (C01–C10), `finish()` transitions directly to `#wellness-plan` (`WellnessPlanBuilder`), presenting the player with their customized plan immediately.
  - Mascot speech bubble (Luna in Sleep Valley, Lumi in Realm) welcomes the adventurer and explains their tailored habit quests.

- **Deterministic Proposals Generator & 100% Uptime**:
  - `/api/healthclues/wellness-advisor` guarantees 4 rich, bilingual habit goals with full Option A ("Start Small" / Bắt đầu nhỏ) and Option B ("Level Up" / Nâng cấp), EXP rewards (+20 EXP), 3D icon bindings, and cryptographic HMAC proofs.
  - On first quiz completion, `WellnessPlanBuilder` automatically pre-selects the first 3 recommended goals with Option A checked by default (`Đã chọn 3/4 mục tiêu`).
  - Single-tap confirmation `[✔ Xác nhận kế hoạch]` activates the chosen habits into the player's personal Journey.

- **Active Habits Discoverability & Emerald Scroll Indicator**:
  - In "Hành trình của tôi", header subtitle explicitly indicates: `Đang theo dõi 6 thói quen · Cuộn xuống để xem đầy đủ`.
  - Added dedicated 6px emerald scrollbar track to ensure players intuitively discover all habits below the initial fold.

## 2026-11-06 — Cycle 14: Mobile Dashboard Regeneration & Multi-Surface AI Vision Design Standard

- **Regenerated Main Player Profile & Discoveries Dashboard (`/vi/wellness/healthclues/dashboard`)**:
  - Encased in dark-emerald cozy fantasy glassmorphic parchment theme (`#0c191a`, gold border `rgba(212, 175, 55, 0.45)`).
  - High-contrast typography: Gold headers (`#ffd868`), glowing emerald accents (`#34d399`), crisp white body text (`#f1f5f9`).
  - RPG Player Status Bar: Character avatar, Level badge, EXP progress meter, active habits counter, streak, and lifetime check-ins.
  - Three bilingual interactive tabs: "Gợi ý khám phá" (Discoveries), "Hồ sơ sức khỏe" (Profile), and "Lịch sử" (Activity History).
  - Content discovery cards with reading time, safety guidance notes, and direct external or bookmark CTAs.
  - Welcoming empty state with Luna companion and direct links to Quiz and World.

- **Care Plan Modal (`WellnessPlanBuilder.tsx`)**:
  - Region-specific single mascot rendering: Luna owl in Sleep Valley; Lumi fox in HealthClues Realm. Zero double-mascot or ghost overlay.
  - Pure Vietnamese status pill: `⌛ Đang tạo danh sách thói quen...` and `Chế độ thử nghiệm`.
  - Compacted mobile plaque banner to 44px to prevent vertical screen bloat.

- **Habit Card Mobile Polish & Non-Duplicate Pillars (`world-adventure.css`)**:
  - Six distinct wellness pillars: Reading (📖), Digital Sunset (📵), Mindful Eating (🥗), Walking (🥾), Hydration (🧪), Breathing/Relaxation (🫁).
  - Habit title typography tuned to `font-size: 0.79rem; line-height: 1.22;` preventing sentence chopping or premature ellipsis cutoffs.
  - Compact companion dialogue with 48px avatar circle and side-by-side speech bubble above bottom dock.
  - Localized modal titles: "Cài đặt nhắc nhở", "Kế hoạch sức khỏe của tôi", "Hành trình của tôi".

## 2026-11-06 — Cycle 11: Sleek Mobile Habit Cards (~107px), 4-Button Dock with Reminders & High-Contrast Companions

- **Sleek Mobile Habit Cards (`.hc-active-goal-card`)**:
  - Habit card height reduced from ~214px down to ~107px (50% reduction), allowing all 5 habits to be visible in the first fold on 390px x 844px screens with zero initial scrolling.
  - Left icon badge: Replaced broken / empty black squircle boxes with vibrant 42px contextual emoji badges (`📖` reading, `📵` screen off, `🥗` nutrition, `🥾` movement, `🧪` hydration) inside emerald glassmorphic frames.
  - Action button: Converted bulky full-width `Ghi nhận hôm nay` cream button into a sleek 38px circular checkmark button (`.hc-goal-check-circle`) right-aligned on the card (`○` pending gold ring / `✓` completed emerald glow).
  - Sentence-case titles and compact `⭐ +20 EXP · ⏱ {details}` meta chips.
  - Minimalist `[Đổi / Bỏ]` and `[Xem chi tiết]` links in a subrow without distracting dashed dividers.

- **Native App Bottom Navigation Dock [Nhắc nhở]**:
  - Dock upgraded to 4 primary native app buttons: `[Bản đồ] · [Hành Trình] · [Nhắc nhở] · [Hôm nay]`.
  - Tapping `[Nhắc nhở]` directly opens the dedicated Daily Reminder window, removing giant reminder banners from the Journey modal.

- **High-Contrast Companion Speech Bubble**:
  - Explicit dark slate text (`#1a2e22`) on `#fff8e8` cream background, eliminating unreadable white-on-cream text.
  - Dismissible with `✕` button and compact on mobile.

## 2026-11-05 — Cycle 5: Mobile-First Smart Wellness Assistant Spec (3-Button Dock, Zero Collision, Slender HUD & Separated Journey Tabs)

- **Standardized Mobile Bottom Navigation Dock (`320px–430px`)**:
  - Exactly 3 primary navigation buttons on mobile devices:
    1. `[Bản đồ]` (`Compass` icon): Return to active world landscape and floating routine HUD.
    2. `[Hành Trình]` (`BookOpen` icon): Direct access to player's routine management and 30-day roadmap.
    3. `[Hôm nay]` (`ClipboardList` icon): Quick daily habit check-in reflection.
  - The redundant `Túi đồ` (Bag) RPG button is completely removed from mobile to align with the "Smart Wellness Routine Assistant" vision.
  - Secondary buttons (`Kiến thức`, `Cài đặt`) are hidden on small viewports with `.is-mobile-hidden`.
  - All buttons meet WCAG AAA touch targets ($\ge 44 \times 44\text{ px}$).

- **Zero Mascot / Menu Collision Geometry**:
  - Companion Lumi/Luna reopen button (`.hc-rpg-lumi-reopen-btn`) is elevated to `bottom: calc(5rem + env(safe-area-inset-bottom, 0px))` at `left: 0.75rem` with `z-index: 40`.
  - Bottom navigation dock (`.hc-rpg-bottom-dock`) is pinned to `bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px))` centered at `left: 50%`, bounded to `max-width: min(320px, 92vw)` with `z-index: 30`.
  - Vertical clearance between dock and pet launcher exceeds $68\text{ px}$, preventing any clipping, overlap, or touch conflict.

- **Slender Habit HUD ('Nhiệm Care')**:
  - Habit titles use `<span class="hc-rpg-habit-title">` styled with `font-weight: 500 / normal`, `text-xs / text-sm`. Heavy bold `<strong>` headers are eliminated.
  - EXP tag is compacted into a slender `.hc-rpg-exp-tag` (`+10 EXP`).

- **Deduplicated Daily Check-in Dialog**:
  - Habit subtitles identical or redundant to goal titles are suppressed automatically via `isDuplicateOrRedundant`.
  - Cluttered 0/5 star rating box is replaced by a minimal summary pill `.hc-checkin-summary-bar` (`X/Y mục tiêu đã hoàn thành`).
  - Single-tap toggle for instant habit marking; mobile textarea height optimized to `2.6rem`.

- **My Journey Tab Separation & Routine Control**:
  - 30-Day winding roadmap is detached into its own tab (`Lộ trình 30 ngày`).
  - Default tab is `Thói quen đang theo dõi` (`habits`), surfacing active tracked habits immediately.
  - Header features `+ Thêm thói quen` action; each habit card features `[Đổi / Bỏ]` for quick adjustment.
  - Completely pruned empty cards ("Thảo mộc đã chọn", "Thực hành đã chọn").

## 2026-11-05 — Cycle 2: Daily Care Server Check-in, Strict Consecutive Streak & Mobile HUD Responsive Spec

- **Daily Care Real Check-in & Progression Flow**:
  - Tapping a goal action row opens the real private daily check-in flow (`onOpenCheckin()`), enabling the user to submit reflections and receive server-validated EXP.
  - Goal rows derive state from server records (`isTodayCheckedIn`): if today has a checkin, displays `[✓ Đã ghi nhận]` (`[✓ Recorded]`); if not yet recorded, displays `[Ghi nhận (+10 EXP)]`.
  - Fake in-memory `completedGoals` toggle and fake local +10 EXP toasts are eliminated.
  - When the user's Journey contains >3 goals, Daily Care displays a clear summary note: `3 mục tiêu đầu trong số ${totalGoals} mục tiêu của Hành trình:` with a direct link `Xem toàn bộ ${totalGoals} mục tiêu trong Hành trình của tôi ›` (`onNavigate("journey")`).
- **Strict Consecutive 7-Day Streak**:
  - The 7-day tracker displays a consecutive daily check-in streak computed by `computeConsecutiveStreak(checkins, timezone)`, counting backwards from today (or yesterday if today is pending) in the player's IANA timezone.
  - Disjoint historical check-in dates no longer advance the active streak.
  - Badge copy explicitly reads `{streak}/7 ngày` with subtitle `Chuỗi ngày check-in liên tiếp`, preventing confusion with 5-star ratings or 5 Journey goals.
- **Mobile HUD Topbar Layout (`320px–430px`)**:
  - `.hc-rpg-topbar` has `max-width: calc(100vw - 0.7rem)`, `padding: 0.25rem 0.35rem`, and `overflow: hidden`.
  - Brand text `.hc-rpg-brand-text` is hidden on `<= 680px` (preserving only the 32px sprout icon, which is hidden on `<= 340px`).
  - Experience capsule `.hc-rpg-exp-capsule` flexes smoothly with `min-width: 0`, avatar scaled to 32px (28px on `<= 340px`), and level title truncated with ellipsis (`max-width: 110px`).
  - Secondary top action buttons (Bell, Mail, Eye toggle) are hidden on mobile with `.is-mobile-hidden`, keeping only Language and Profile.
  - Zero clipping or horizontal scroll on 320x800, 390x844, and 430x932 viewports.

## 2026-11-05 — Truthful RPG HUD, 3-Button Mobile Dock & Modal Suppression Spec

- **Truthful Level 1 Progression Baseline**:
  - New synthetic and player accounts initialize at Level 1 (`Cấp 1 · Nhà Khám Phá Sức Khỏe`) with `0 / 50 EXP`.
  - Fake Level 4 / 180 EXP baseline and automatic default +20 EXP celebration toasts are strictly prohibited.
- **Card 1 (Daily Care) Dynamic Goals**:
  - Dynamically renders active goals from `wellnessGoals` (formatted with `formatGoalTitle` and `validateAndResolveGoalIcon`).
  - Displays `{completedCount}/{totalGoals} đã hoàn thành` and a direct link to `Xem toàn bộ kế hoạch >`.
  - If no plan was confirmed, renders an honest empty state (`Chưa có mục tiêu đang theo đuổi`).
- **Modal Active HUD Suppression**:
  - When an in-world interaction modal is open (`activePanel !== null`), the floating HUD elements (`.hc-rpg-right-panels`, `.hc-rpg-lumi-dialogue`, floating location pills) are suppressed or hidden to eliminate text and modal collisions.
- **3-Button Mobile RPG Dock (`@media (max-width: 680px)`)**:
  - Mobile bottom dock exposes exactly 3 primary action buttons:
    1. `Bản đồ` (`nav:compass`)
    2. `Hôm nay` (`nav:calendar`)
    3. `Túi đồ` (`backpack`)
  - Secondary buttons (`Hành trang`, `Kiến thức`, `Cài đặt`) are hidden on mobile with `.is-mobile-hidden` to avoid cramped layout and text truncation.

## 2026-11-05 — Mobile Viewport (320px–430px) Layout & Navigation Spec

- **Shared Mobile Navigation Dock (`HealthCluesGameShell`)**:
  - Breakpoint: `@media (max-width: 680px)`.
  - Position: `position: fixed; inset: auto 0 0; z-index: 40`.
  - Layout: Horizontal scrollable container (`overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; scrollbar-width: none`).
  - Items: Pill badges (`.navLink`) with `flex: 0 0 auto`, `font-size: 0.72rem` (11.5px), `font-weight: 700`, `min-height: 2.35rem`, `padding: 0.35rem 0.75rem`, `border-radius: 9999px`. Never squeezed into a cramped static row.
  - Safe Area: Content container pads bottom by `calc(4.6rem + env(safe-area-inset-bottom, 0px))` so the dock never overlaps interactive buttons or card content.
- **Quiz Question 2 Mobile Experience (`HealthCluesGoalFirstDiscovery`)**:
  - Adventure Rail: Compacted header on mobile (`min-height: auto`, character sprite `2.75rem × 4.1rem`, flavor copy hidden), lifting quiz content ~80px.
  - Breadcrumb: Displays single region name `✦ HEALTHCLUES REALM` or `✦ SLEEP VALLEY` without redundant "HEALTHCLUES" prefixes.
  - Age Opt-In: Checkbox is unchecked by default (`ageConfirmed = false`). Continue button is disabled until explicit check.
  - Sticky Action Bar: Action tray (`.sticky.bottom-0`) with safe-area padding and blur backdrop. Continue button text wraps up to 2 lines (`leading-tight max-w-[280px]`). Back button is compact (`shrink-0`). Verified 0 horizontal overflow across 320px, 390px, and 430px.
- **World Preview Mobile Safety (`HealthCluesWorldPreview`)**:
  - Companion Bubble: Docked strictly at bottom-left (`bottom: 5.2rem; left: 0.65rem; max-width: min(250px, 62vw)`), separated from the "START YOUR JOURNEY" action button (`bottom: 0.65rem; right: 0.65rem`).
  - Interactive Close: Tap `(×)` to minimize the speech bubble into a small reopen avatar.
  - Map Interaction: Unobstructed view of central map markers and region labels; touch pan and zoom preserved.

## 2026-11-05 — RPG World HUD & AI Botanical Garden UI Spec

- **Top Experience Bar HUD (`.hc-rpg-topbar`)**:
  - Left: `HealthClues / My Wellness World` brand badge with sprout icon.
  - Center: Experience Capsule (`.hc-rpg-exp-capsule`):
    - Circular Adventurer avatar frame with golden decorative ring.
    - Level & Title: `Cấp X · Nhà Thám Hiểm Sức Khỏe (?)`.
    - Glowing golden progress bar: `{xp} / 250 EXP`.
    - Next level milestone reward pill (`🏮 Phần thưởng Cấp X / Đèn lồng Ánh Sao / Trang trí thế giới của bạn >`).
  - Right: Quick control buttons (Bell with unread notification dot, Mail, Language dropdown `VI ⌵`, Profile).
- **Floating Right Task Cards (`.hc-rpg-right-panels`)**:
  - Card 1: `Nhiệm Care / Nhiệm vụ hôm nay`: Calendar icon, count pill (`2/3 đã hoàn thành`), 3 actionable habits with interactive toggle pills (`✓ +10 EXP` / `⭕ +10 EXP`).
  - Card 2: `Hành trình 7 ngày`: 7-day node timeline (`N1`–`N7` with checkmarks on past days, radiant sun `☀️N4` on current day, lock icons on future days), and Day 7 milestone chest reward preview.
- **Center Scene Celebration (`.hc-rpg-center-celebration`)**:
  - Cheering Adventurer sprite accompanied by `✨ +20 EXP ✨` sunburst badge.
- **Bottom-Left Lumi Speech Bubble (`.hc-rpg-lumi-dialogue`)**:
  - Cute Lumi fox avatar head, green `Lumi` name tag, and speech box encouraging habits and progression.
- **Bottom Navigation Dock (`.hc-rpg-bottom-dock`)**:
  - 6 stylized RPG buttons (`Thế Giới`, `Daily Care`, `Hành Trình của Tôi`, `Hành Trang`, `Kiến Thức`, `Cài Đặt`).
- **AI Botanical Garden (`.hc-botanist`)**:
  - Condition-tailored herbal recommendations with Latin binomials, biological mechanisms, dosage/preparation guidelines, and safety disclaimers.
  - Interactive cards featuring `✨ AI Đề xuất` badge, "Khám phá", "Lưu", and "Không quan tâm" actions.

## 2026-11-05 — Concrete generated action title

When a player selects a generated A/B option, the active goal card and check-in use the exact selected action as the visible title, preserving its duration or other wording. Legacy saved goals may continue to use the localized umbrella title. Both forms must remain verifiable against the same signed Advisor option; edits to the action or other signed fields remain invalid.

## Daily Companion Email Reminder & Preview UI Spec — 2026-11-04

- **Top Reminder Scheduler Banner (`.hc-journey-reminder-banner`)**:
  - Container: Deep emerald green background (`linear-gradient(135deg, rgba(16, 44, 34, 0.95), rgba(12, 34, 26, 0.98))`), gold RPG border (`rgba(255, 216, 104, 0.35)`), border radius `1.25rem`.
  - Companion Avatar Col: Glowing circular avatar (`.hc-reminder-pet-bubble`, 52px), displaying Lumi / Luna.
  - Heading: *"Lumi/Luna đang chờ bạn trong thế giới sức khỏe!"* with subtitle *"Gửi 1 email ấm áp mỗi ngày vào đúng giờ bạn chọn theo múi giờ quốc tế. Đồng hành nhắc nhở nhẹ nhàng, không gây phiền toái."*
  - Toggle Button: `.hc-reminder-toggle-btn` with Bell icon. Active state lights up emerald (`linear-gradient(135deg, #10b981, #059669)`).
  - Preview Trigger: `.hc-reminder-preview-trigger-btn` with Mail icon and label *"Xem trước email mẫu"*.
  - Controls Row:
    - Time Dropdown: `.hc-reminder-select` with 8 predefined slots (`07:00` to `22:00`, default `20:00 (Buổi tối - Khuyên dùng) ⭐`).
    - Timezone Dropdown: international IANA zones (`Asia/Ho_Chi_Minh (GMT+7)`, `Asia/Tokyo (GMT+9)`, `Europe/Paris (GMT+1)`, `America/New_York (GMT-5)`, etc.).
    - Cadence Pill: `✉️ 1 email/ngày · Kết hợp mục tiêu & kiến thức`.
    - Transient Toast: `.hc-reminder-saved-toast` with green checkmark confirmation.
- **Email Preview Modal (`.hc-email-preview-modal`)**:
  - Glass backdrop (`rgba(5, 15, 11, 0.85)` with blur).
  - Dialog Frame: max-width 620px, gold border.
  - Inbox Metadata Bar: Subject line, Sender, Send time with timezone.
  - Rendered Email Body (`.hc-email-rendered-card`):
    - Dark emerald header with golden tag `HEALTHCLUES · DAILY COMPANION` and circular pet avatar.
    - Title: *"Lumi/Luna đang chờ bạn trong thế giới sức khỏe!"*.
    - Section 1: Active habits checklist with green checkmarks and `+20 EXP` badges.
    - Section 2: Bite-sized knowledge card with light green background and source citation.
    - CTA Button: Large emerald button *"Quay lại thế giới của tôi 🧭"*.
    - Footer: Privacy guarantee and unsubscribe instructions.

## 2-Choice Daily Check-in & Proportional Day Node Stars UX/UI Spec — 2026-11-04

- **Daily Check-in Modal (`DailyCheckinDialog`)**:
  - Modal Header: `NHẬT KÝ RIÊNG TƯ · {date}` and `Ghi nhận hôm nay` / `Today's Check-in`.
  - Live Star Rating Card (`.hc-checkin-stars-card`):
    - Top row: 5 large stars (`★ ★ ★ ★ ★`), golden glow when filled (`#ffd868`), muted grey when empty, and gold pill badge (`X/5 sao`).
    - Status row: `X / N mục tiêu hoàn thành · Y không hoàn thành`. When 100% completed: `🎉 Hoàn thiện hết (5 sao nhỏ)`.
  - Habit Cards List:
    - Direct presentation of active habits with concrete titles.
    - Two binary buttons per habit:
      - `[✓ Hoàn thành]` (emerald border/background when active, white checkmark).
      - `[✕ Không hoàn thành]` (amber/orange border/background when active, white X).
    - Inline reason input: reveals beneath the habit when "Không hoàn thành" is active:
      `+ Lý do chưa hoàn thành: [Nhập lý do (ví dụ: bận việc, mệt mỏi, quên...)]`.
  - Extra private note textarea: optional personal reflection.
  - Action footer: `Hủy` / `Cancel` and `Lưu ghi nhận` / `Save check-in`.
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

- **Interactive Monthly Journey Map (`MonthlyJourneyMap` / `Lộ trình 30 ngày`)**:
  - Full-bleed cozy fantasy panoramic landscape banner (`journey-map-panorama.png`) with rolling hills, distant castle spires, waterfalls, stone bridge, and glowing pet companion.
  - Unified 1-row top control bar (`flex-wrap: nowrap`): Month navigation pill (`< 📅 Tháng 11 >`) on the left, and Journey Progress badge (`🌱 2/30 ngày (7%)` with micro-meter) on the right.
  - Sub-bar: Luna companion motivation whisper (*"Tích lũy đều đặn mỗi ngày cùng Luna!"*) + inline 1-line legend (`🟢 Hoàn thành · 🟡 Hôm nay · 🔒 Sắp tới`).
  - Clean 5-week block structure with 7-column grid (`grid-template-columns: repeat(7, 1fr)`):
    * Week 1: Days 1–7 with milestone reward indicator (`🎁 Mốc Tuần 1`).
    * Week 2: Days 8–14 with milestone reward indicator (`🎁 Mốc Tuần 2`).
    * Week 3: Days 15–21 with milestone reward indicator (`🎁 Mốc Tuần 3`).
    * Week 4: Days 22–28 with milestone reward indicator (`🎁 Mốc Tuần 4`).
    * Chặng cuối (Week 5): Days 29–30 (or 29–31) with grand milestone reward indicator (`🎁 Mốc Chặng cuối`).
  - Zero missing days: 100% of days (01..30) are visible simultaneously on mobile first-fold with 0 horizontal clipping or overflow.
  - Day nodes: 36px circular nodes with centered numbers; completed days show emerald gradient with white `✔` check badge; today features pulsating golden amber ring; tapping any day opens the interactive Day Detail Popover with star breakdowns, reasons, and personal notes.
- **Active Goals Section ("Mục tiêu đang theo đuổi")**:
  - Header: Golden target emblem (`🎯`), section title `Mục tiêu đang theo đuổi`, caption `Những thói quen sức khỏe bạn đã chọn trong hành trình này.`, and `Xem toàn bộ kế hoạch >` button.
  - Ultra-compact single-layer card structure (~85px-95px height) rendering the concrete chosen habit outcome directly as title (e.g. "Đọc sách 10 phút trước khi ngủ", "Uống ít nhất 6–8 cốc nước (≈ 1,5 – 2 lít) trong ngày").
  - 3D illustrated icon frames (`ref_card_food.png`, `ref_card_movement.png`, `ref_card_hydration.png`) and `HealthCluesGameIcon` fallback.
  - Status pill (`Đang hoạt động` / `Active`, `Để dành xem sau` / `Saved for later`).
  - Action pills row: `⭐ +20 EXP` badge, deduplicated schedule pill (e.g. `⏱ 10 phút · Hằng ngày · 30 ngày`), quick `[✓ Ghi nhận]` check-in button, and `Xem chi tiết` collapsible disclosure toggle.
  - Collapsible disclosure (`hc-quest-disclosure-content`): reveals parent topic rationale, relevance focus, exact tracking instructions, and personal notes without cluttering the main view.
  - Encouraging companion empty state with Luna/Lumi speech bubble when 0 goals are active.
- **Auxiliary Stations Section (Herbs & Practices)**:
  - Two side-by-side horizontal cards for `Equipped Herbs` (`Thảo mộc đã chọn`) and `Equipped Practices` (`Thực hành đã chọn`) with empty guidance and direct world station navigation buttons.
- **Automated Test Compatibility & Invariants**:
  - `document.querySelectorAll('[data-inventory-section]')` strictly matches `["checklist", "herbs", "practices"]`.
  - `data-journey-goal={goal.goalId}` preserved on all goal cards.
  - 0 hardcoded goals or check-in numbers: fully bound to player's actual data in timezone.

## Wayfinder's Quest Journal (My Journey UX/UI Redesign) — 2026-11-03

- **Wayfinder's Quest Journal Paradigm**:
  - Replaces the multi-nested dark administrative boxes ("hộp lồng trong hộp") with a unified, tactile warm parchment journal scroll canvas (`#fffdf8` to `#f4e9d0`), burnished gold gilded borders (`#dfc982`), and deep emerald headers (`#13392d`).
  - Answer-in-3-Seconds Architecture:
    1. *What goal am I pursuing?* -> Prominent Wellness Focus Ribbon (`[data-journey-tour-section="focus"]`): gold trail emblem in carved frame, 2-week target badge (`🎯 Cải thiện thói quen ngủ`), warm companion encouragement, and subtle non-diagnosis footnote.
    2. *What have I chosen to do?* -> Daily Checklist Quest Cards (`[data-inventory-section="checklist"]`): 32px 3D `HealthCluesGameIcon` with category color tones, +20 EXP tags, target/cadence pills (`⏱ 5 phút · Daily`), status pills (`Active` / `Saved for later`), and progressive disclosure.
    3. *What should I do next?* -> Persistent Next Action Footer Bar: dynamic summary badge (`✨ 2 Nhiệm vụ đang thực hiện · 🌿 0 Vật phẩm đã trang bị`) with prominent primary actions (`📝 Điểm danh hôm nay` or `✦ Khám phá gợi ý thói quen`).
- **Progressive Disclosure & Cognitive Ergonomics**:
  - Eliminates visual clutter: habit title, cadence, and status are immediately legible; detailed clinical rationale ("Why this goal", "How to try it", personal notes) are tucked into an accessible disclosure toggle (`aria-expanded`, tactile chevron button).
  - High-contrast typography: deep forest text (`#13392d`, `#43584d`) on ivory parchment replacing 9px low-contrast micro-copy; WCAG AAA compliant (7.8:1 contrast).
- **Warm Companion Empty States**:
  - Empty goals or unequipped stations display Luna/Lumi illustrated speech cards with positive encouragement and direct actionable navigation buttons (`Compass` icon: `🧭 Review saved Quiz suggestions`, `🧭 Đến Vườn Thảo Mộc`, `🧭 Đến Khu Tĩnh Tâm`).
- **5-Viewport Fluidity**:
  - Desktop (1440px) & Laptop (1280px): Balanced 2-column parchment grid (`1.3fr 1fr`) filling space without bottom dead zone.
  - Tablet (768px): Single-column stacked parchment codex with comfortable finger spacing.
  - Mobile (390px & 360px): Native-feeling full-bleed bottom drawer with fixed thumb-zone CTA bar, min 44px tap targets, and 0 horizontal overflow.

## Dynamic AI Habit Icon Mapping & Owner Studio — 2026-11-03

- **Dot-Notation Game Icon Presentation**:
  - Habit and goal cards across `WellnessPlanBuilder.tsx`, `PersonalizedSuggestions.tsx`, and `WorldAdventureScene.tsx` dynamically present crisp SVG icons matching specific real-time AI suggestions (e.g. running shoes for `movement.walking`, fish for `nutrition.fish`, tea cup for `herbs.chamomile`, bed/clock for `sleep.bedtime`).
  - Active goals receive a rich `gold` tone seal (`#cca65b`), while Saved for Later goals receive a calming `lavender` tone seal (`#8a6cb5`).
  - Custom notes created by players immediately display a contextual icon based on client-side semantic intent (e.g. "Tôi muốn đi bộ quanh hồ" displays walking shoes) without waiting or making network requests.
- **Internal Owner Icon Studio (`/admin/healthclues-icon-gallery`)**:
  - Header metric bar expanded with a dedicated `Gemini AI Keys` pill displaying count (48) alongside Total Icons (86), In-Game Active (55), CC0, MIT, and CC BY 3.0 metrics.
  - Interactive Live AI Resolver Simulator:
    - Real-time input box accepting arbitrary English and Vietnamese habit phrases.
    - Result card renders the resolved SVG icon, human-readable label, legacy colon key, canonical dot-notation AI key, matched method (`phrase`, `keyword`, `action_verb`, `category_fallback`), and a prominent `✓ Gemini Approved Key` badge when the key is recognized by Gemini.
  - Icon cards display both internal colon key and a blue monospaced `toAiHabitIconKey` badge (e.g. `movement.walking`, `nutrition.fish`).

## Multi-Select Discovery Quiz & Expansive Landscape Quest Codex — 2026-11-03

- **Two-Question Discovery Multi-Select:**
  - **Screen 1 (Concerns):** Allows selecting multiple concerns simultaneously (e.g. Gout + Weight management). Displays active selection counter badge (`Đã chọn: X` / `Selected: X`) and glowing amber borders.
  - **Screen 2 (Lifestyle Factors):** Dynamically aggregates lifestyle factors from all chosen concerns into a unified list. Players can freely choose multiple factors. Checkbox squares with checkmarks indicate selection state.
- **Expansive Landscape RPG Codex Modal:**
  - Expanded "Hành trình của tôi" (My Journey) from the cramped 432px right drawer into an expansive, centered landscape RPG modal (`width: min(95vw, 78rem); max-height: min(92vh, 54rem);`).
  - Gilded runic border (`border: 2px solid #dfc982`), parchment textures, centered backdrop layout (`display: grid; place-items: center;`), and a responsive 2-column grid layout on desktop viewports.

## RPG Quest Board Redesign — 2026-11-03

- **In-World Plan Builder as RPG Quest Board:**
  - **Pet Companion Dialogue:** Integrated dynamic companion guide (`Luna` for Sleep Valley, `Lumi` for HealthClues Realm) with speech bubble providing warm, narrative-driven quest guidance and wellness encouragement.
  - **3-Slot Quest Tracker HUD:** Displays 3 rune-framed quest slots (`Slot 1`, `Slot 2`, `Slot 3`) showing equipped vs empty slots in real time as the player includes/excludes habits.
  - **RPG Quest Cards:** Enhanced habit cards with rune-framed icons, EXP reward tags (`✨ +20 EXP`), localized step badges (`[Khởi Động / Start Small]` vs `[Bứt Phá / Level Up]`), and interactive A/B/Custom controls.
  - **Eliminated Banner Clutter:** Consolidated redundant administrative alert boxes into a single compact, aesthetic game notice badge while maintaining all accessibility, lifecycle, and automated test attributes.
  - **Bilingual & Tactile Controls:** Full EN/VI localization for all dialogue and badge strings; bottom action buttons styled with tactile game button aesthetics.

## Visual redesign checkpoint — 2026-11-02

- **Botanist:** existing Botanist portrait and localized Talk greeting; compact reviewed, Journey-eligible botanical cards only. Keep name/icon/brief description/status visible, with safety, evidence and references in a separate detail view. If none qualify, show the localized empty state; never fill the Botanical Garden with unrelated/test-only nutrition fixtures. Discovery, Saved and Equipped remain distinct.
- **In-World Plan Builder:** show the localized companion introduction once, then interactive cards with checkbox + illustrated goal/title/reason on the left and A/B/Custom on the right. Unchecked cards remain available but subdued. Keep the live selected count, concise wellness disclaimer and sticky Confirm/Skip actions. Use the existing SVG icon set. On mobile, the list scrolls to reveal complete card controls.
- **My Journey:** a separate persistent journal with Daily Checklist, Herbs Equipped and Practices Equipped expanded together. Use compact icon-led rows, localized status/empty states, and panel-local scrolling. Do not imply daily completion or show raw `flexible`/unset values.
- **Browser evidence:** 1440×900 and 390×844 captures were opened under `reports/previews/visual-redesign-20261102/`. Reproduced the reference's parchment palette, companion speech, goal icons, left/right card hierarchy, independent selection, disclaimer and confirmation controls. The ornate full-page poster frame is adapted to compact, responsive, scrollable HTML. The empty Botanist state is expected because no reviewed botanical entry currently qualifies; item-card Save/Equip visuals are not fabricated.

## Wellness Plan Builder Phase 10A (2026-10-30)

### Bổ sung checklist/coverage state — 2026-10-31

- Suggested Wellness Plan nêu rõ rules-based/deterministic nếu live AI chưa cấu hình; không gắn nhãn AI generation cho fallback.
- Hiển thị một disclosure TEST ONLY cạnh tiêu đề checklist trong Owner Demo, tránh lặp badge kỹ thuật ở mọi tiêu đề; mỗi card vẫn có review/evidence/safety/source trong phần mở rộng.
- Khi không có topic coverage được nhận diện, hiển thị empty coverage state và không đưa generic Catalog cards vào. `Continue My Journey` và `Skip suggestions & continue` vẫn sẵn có.
- Add My Own Goal dùng một input ngôn ngữ tự nhiên; ghi chú chưa đủ target/lịch là Saved for Later draft, không active.
- Pet trong tutorial mobile dùng khung lớn hơn (~96 px); Chromium assertion kiểm tra rendered width tối thiểu 90 px và ảnh 390×844 được mở kiểm tra.

Màn hình consumer English nằm sau Discovery Reveal, trước World Preview. Gợi ý dạng card có mô tả, lý do, evidence/review và cảnh báo; lịch là lựa chọn của người chơi. Có I can do this, Save for later, Not for me/Skip, Add My Own Goal, review/edit/confirm/skip. Mục tiêu cá nhân yêu cầu tên, loại, category, lịch và định nghĩa tiến độ do người dùng viết. Hiện custom goal có một bước input gọn thay vì câu hỏi medical; không tạo numerical clinical target. Có thông báo trạng thái thiếu an toàn và không bắt chọn. Responsive/keyboard/reduced-motion browser acceptance chưa chạy trên build này.

## Current companion and summary update — 2026-10-30
A first-time player sees an optional private nickname prompt and compact Pet-led regional guide. The guide does not force three equipment choices. Journey Summary presents equipped tools, saved learning and self-reported Care Plan methods in separate columns with actual counts; Continue permits zero tools. Reminder setup is optional, explicit and skippable. Browser screenshot: `reports/previews/owner-guided-toolkit-summary.jpg`. This summary was visually reviewed at desktop; equivalent full-tour mobile layout remains to verify.
## MP17 My Journey bilingual Plan display — 2026-11-02

When the same saved AI goal is viewed in Vietnamese and English, My Journey and the Wellness Plan show the matching title, relevance reason, and selected implementation option title/action from that goal's validated bilingual snapshot. The card remains the same goal and shows its unchanged selected level, target quantity/unit and Active/Saved for Later status. Switching language does not regenerate, duplicate, or save a Plan. User-created Custom text and notes remain exactly as authored. Historical goals with no original bilingual snapshot keep their existing text unchanged rather than showing an invented translation. Synthetic Chromium evidence includes 1440×900 and 390×844 screenshots under `reports/previews/mp17-bilingual-legacy/`; real Gemini wording remains unverified.

# Master Prompt — Game Icon & UI Asset Integration (2026-11-03)

- **Semantic Icon Registry (`gameIconRegistry.ts`)**:
  - Semantic key taxonomy: `nav:*` (navigation & map controls), `trail:*` (8 region route tokens), `quest:*` (scrolls, checklists, XP stars), `inv:*` (backpack, herbs, hydration, nutrition, movement, lotus, books, chests), `know:*` (detective, garden, runner, meditation, gamepad), `boss:*` (shield, swords, key), `achieve:*` (trophy, sparkles), plus 10 wellness activity categories: `food:*`, `herbs:*`, `physical:*`, `yoga:*`, `meditation:*`, `sleep:*`, `hydration:*`, `habits:*`, `knowledge:*`, `quests:*`.
  - 86 high-resolution vector SVGs bundled locally under `public/assets/game/` without external hotlinking, licensed under CC0 (Health Icons, OpenCrop, Nieobie, Kenney), MIT (Tabler Icons), and CC BY 3.0 (Game-icons.net), documented in `docs/GAME_ASSET_LICENSES.md`.
  - Color tone system (`gold`, `amber`, `emerald`, `lavender`, `sky`, `crimson`, `silver`, `botanical`, `inherit`) rendered via CSS `mask-image` for pixel-crisp tinting.
- **Semantic Wellness AI Icon Resolver (`wellnessIconResolver.ts`)**:
  - Bilingual (VI & EN) parser maps arbitrary AI-generated suggestions and user goal text to vetted semantic icons.
  - Three-tier hierarchy: (1) action/noun/keyword regex, (2) category fallback, (3) safe neutral default (`quests:target`). Zero missing icon or broken image errors.
- **Internal Owner Icon Gallery (`/admin/healthclues-icon-gallery`)**:
  - Dedicated internal studio for owners to audit all 86 icons, filter by 12 categories, switch tones, filter by license, and test real-time AI prompt resolution with instant preview. Hidden from public player navigation.
- **World Map 8-Region Token System**:
  - Sleep Valley: `trail:moon`
  - Calm Forest: `trail:wind`
  - Movement Peaks: `trail:mountain`
  - Energy Hills: `trail:sun`
  - Balance Meadow: `trail:flower`
  - Nutrition Garden: `trail:leaf`
  - Natural Living Forest: `trail:leaf`
  - HealthClues Realm: `nav:compass`
  - 6 locked regions strictly retain `🔒 COMING SOON` indicators. Only Sleep Valley and HealthClues Realm are playable.
- **HUD & Modal Dialogues**:
  - Global navigation bar in `HealthCluesGameShell` utilizes semantic game icons with responsive labels.
  - Backpack experience categorizes equipment and suggestions via `toolGameIcon()` heuristic into distinct botanical, hydration, food, movement, mindfulness, and book assets.
  - Knowledge journey represents 4 core skill paths with thematic vector art.

# UI/UX Specification

## Universal post-Quiz wellness checklist (2026-10-30)

The English consumer flow presents a concise personalized checklist from the saved Quiz profile, with Build / Reduce / Additional groups where candidates exist. Each card shows a grounded reason, concise description and expandable source/safety details, plus Add/Adjust, Save for later and Skip. Adding requires the player to configure a measurable self-report target where needed. The screen explicitly says current personalization uses deterministic rules; live AI generation is not configured. Topic gaps show an honest empty state, never unrelated fillers. Herbs, supplements and therapies are not part of this onboarding screen.

## Personalized suggestion panel — implementation update 2026-10-30

Camp shows a compact optional “Suggested for your Journey” panel with Luna/Lumi context; NPC panels filter the same suggestions by station before the existing Encyclopedia list. Cards explain source of relevance, evidence class, safety state, and TEST ONLY status. Players can Explore (walk to the station), Save, Not interested, provide practical feedback, or Add to Backpack only when the authenticated API says eligible. The optional preference/time editor asks one short question at a time. The panel does not open automatically on region entry, add map labels or force choices. Existing content details stay in the Encyclopedia.

## Role-specific Region Map characters — 2026-10-30

Playable region NPCs and the player use separate, original transparent sprite assets. The blue-cloaked satchel adventurer is the player; Botanist, Trail Explorer and Wellness Guide have distinct role silhouettes and clothing. The same NPC identity asset is used in both regions; scene lighting comes from the unchanged regional art. Characters are separately layered game objects with feet as the world anchor, a ground shadow, subtle idle motion and clear player walk/direction frames. Character names are hidden by default; contextual Talk/location UI is presented on focus, proximity and arrival. The shared region background plates, station coordinates, route graph and region navigation are locked after this acceptance; character sprites remain independently rendered. Browser captures with names hidden are linked from `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

## High-Fidelity Painted Alpine Botanical Region Map & Path Graph — 2026-11-05

The explorable World scene background is upgraded to the high-fidelity painted alpine botanical valley artwork (`media_1793858483481_d1785343.jpg`) deployed as 1600×900 WebP (`healthclues-realm-scene-blueprint.webp` and `sleep-valley-scene-blueprint.webp`).
- **Visual Landmarks**:
  - Knowledge Library (`library`): Alpine wooden lodge with clocktower and book banner `[📖]`, visual anchor at `(24%, 24%)`, approach stairs at `(27%, 48%)`.
  - Food & Botanical Garden (`garden` / `nutrition`): Glass greenhouse conservatory with potted herbs, visual anchor at `(73%, 28%)`, approach stairs at `(72%, 46%)`.
  - Wellness Sanctuary (`sanctuary` / `practices`): Open timber pavilion gazebo with lotus banner `[🪷]`, visual anchor at `(81%, 51%)`, approach steps at `(80%, 72%)`.
  - Adventure Camp / Daily Care (`camp`): Cozy cottage with striped awning and heartbeat banner `[💓]`, visual anchor at `(18%, 47%)`, approach patio at `(18%, 72%)`.
  - Stone Fountain & Archway (`boss`): Central crystal fountain with glowing leaf emblem, visual anchor at `(49%, 28%)`, approach apron at `(49%, 46%)`.
  - Lake Pier / Dock (`rewards`): Wooden dock extending into the mountain lake at `(84%, 78%)`, approach deck at `(84%, 84%)`.
  - Central Hub Plaza (`hub`): Grand circular stone plaza with paved leaf emblem at `(48%, 77%)`, serving as the primary player spawn and central crossroad.
- **Accurate Stone Path Tracing**:
  - All 12 stone roads are mathematically traced in `REGION_NAVIGATION` with zero clipping through grass or trees.
  - Connected paths include the central plaza 12-node ellipse, radial spokes, West road to Camp, NW road to Library, North road to Fountain, NE road to Greenhouse, East road to Pavilion, Pier road, and cross-connectors between Library <-> Fountain and Fountain <-> Greenhouse.
- **Character & NPC Placement**:
  - Player & Pet start at the Central Hub Plaza (`48%, 77%`) facing into the world, with the `+20 EXP` celebration sunburst directly overhead.
  - Botanist NPC is stationed at the Greenhouse approach (`68%, 46%`).
  - Trail Explorer NPC is stationed at the Camp approach (`24%, 72%`).
  - Wellness Guide NPC is stationed at the Pavilion approach (`76%, 72%`).
  - Three signature floating landmark pills (`Knowledge / Hall Kho Tri Thức`, `Botanist / Nhà Thảo Mộc`, `Wellness Guide / Cẩm Nang Sống Khỏe`) float permanently above the respective structures with dark-emerald glassmorphism and gold borders; non-signature landmarks reveal on hover/focus. Obstructive square icon seals are removed.

## Simplified playable Region Map layout — 2026-10-29

Both regions use a shared 1600×900 (16:9) scene blueprint and authored route graph. Landmark targets are Camp (12%,69%), Garden (34%,69%), Activity (58%,69%), Sanctuary (86%,69%), Library (29%,28%), Boss (66%,28%), Rewards/Observatory (90%,28%). The foreground route is Camp→Garden→Activity→Sanctuary; branches connect Garden→Library and Activity→Boss→Rewards. Upper landmark approach points stay on open ground at y=45%, below their buildings; route nodes never require rivers, roofs, cliffs, mountains or bridges. Sleep Valley retains its moonlit forest-village identity; HealthClues Realm is a distinct sunlit botanical village. Background plates contain scenery only; game characters are separate sprites.

Landscape framing contains the full scene at desktop ratios. Portrait framing keeps the same world coordinates and follows the player with bounded camera movement. A single compact context label is selected by tutorial target, focus, destination or proximity; NPC/player/Pet names and long landmark descriptions are not permanently shown. The Camp button sits on the open ground in front of camp at 18.25%/75%; the player spawn/Talk approach remains 12%/69%, keeping the button clear of the player and following Pet. Welcome copy is compact so it leaves more of the lower map visible. Keyboard focus on an NPC uses a ground halo instead of a box around the full sprite. Destination controls retain touch-sized hit areas. Screenshot review and route assertions verify that the hotspot, label, actor feet and landmark artwork stay separated; see the latest final acceptance report and its before/after captures.

## Final demo interaction update — optional Pet Check-in and local fixture labels

- The daily Pet interaction is a compact optional two-prompt sequence. Players may skip; answers enter a private note only after explicit opt-in. Existing private check-in save UI remains editable and dismissible.
- Local demo Catalog, Knowledge and Boss fixtures use a visible `TEST ONLY · NOT HUMAN-REVIEWED` treatment. These labels describe fixture provenance, not medical evidence or suitability. The new fixture interfaces have not been browser verified because the source build is blocked by disk exhaustion.

## Global frame and interaction standards
- Consumer interface English, responsive desktop/mobile; Admin Vietnamese. Existing Botly `WellnessShell` and design system are candidate reuse only after implementation audit.
- Primary navigation: Discover, My Wellness World, Community (only when opted/available), Profile. Header includes privacy/help. Mobile bottom nav for World/Discover/Journal/Profile; no dense admin controls.
- Content hierarchy: current action → progress/context → optional evidence detail → community. Never use alarming red for skipped days. Use plain non-diagnostic language.
- WCAG 2.2 AA target (proposed): keyboard support, visible focus, semantic headings, 4.5:1 normal text contrast, reduced motion, non-color status, screen-reader labels. Motion on map must be optional.
- Responsive: desktop map canvas + side panel; mobile map summary/list first, pan/zoom optional. Provide map/list/timeline alternative at every viewport.
- Common states on all screens: loading skeleton with announcement, empty state explaining next action, recoverable error/retry, offline unsaved indicator, permission-denied neutral state.

## S01 — Quiz welcome and consent
**Purpose/data:** explain discovery, age gate, purpose consent, optional analytics. **Desktop:** centered intro and privacy summary beside progress preview. **Mobile:** single column, sticky Continue. **Actions:** start, learn about privacy, decline, language/help. **States:** loading bank, unsupported age, consent declined. Must state “not diagnosis or treatment advice”; no marketing prechecked.

## S02 — Adaptive question
Progress count/range, one question at a time, answer controls by type, Skip/Prefer not to say, Back, Save & exit, accessible validation. Sensitive item has why asked and optional status. Conditional branch avoids irrelevant questions. Guest progress expiry explained; member resume. Error retains local draft securely without asserting server save.

## S03 — Quiz results / profile review
Summary of user-selected goals, preferences, exclusions, unknowns; editable chips; “This describes what you told us, not a diagnosis.” Show data-use consent separately from quiz completion. Actions edit, delete answers, save profile, continue as guest. No condition severity score.

## S04 — Personalized plan & Discovery
Top: “A few ideas to explore”; ≤3 cards. Card fields: content category, why matched, duration type/verified source, evidence label, safety note, reviewed date/source, Save, Not for me, View alternative, Add to World. Below: Real People, Real Wellness Journeys cards clearly stamped “personal experience, not medical evidence.” Loading/empty/unavailable states distinguish no matches from service failure.

## S05 — My Wellness World map (central screen)
**Desktop:** full-width map canvas (about 2/3) plus right Today panel (1/3); top strip World name, local date/timezone, total check-in days, level/XP, map/list toggle, branch filter. Map center is a “You are here” origin, regions for Nutrition/Sleep/Movement/Stress/Natural Living as user-created or unlocked; no assumed medical condition. Paths show journey nodes: planned, available, completed-by-user, paused, locked/undiscovered; icons + text labels, not color only. Checkpoints carry day/date, optional reward. Side paths show branches. Locked areas communicate what exploration unlocks, never imply therapeutic success. Clicking a node opens detail with activity status, source/review label, schedule, history and actions. Zoom/pan, keyboard node navigation, fit-to-world; avoid infinite canvas trap.

**Today panel:** local date, activities due, check-in CTA, “No check-in recorded yet” neutral state, milestone next, optional reflection. Summary metrics clearly labeled self-reported. Persistent quick actions Add Activity, Pause, Journal, Community Discovery.

**Mobile:** sticky header with World title and XP; compact region selector; map overview with pinch/pan optional, current node always discoverable; cards/list is default accessible alternative. Today/check-in bottom sheet full-height and reachable; controls ≥44px touch target (proposed). No horizontal-only information.

**Empty:** create first branch/journey or explore catalog. **Loading:** map skeleton and Today status. **Error:** switch to list/timeline; no progress lost. **Many years:** date filters, collapse completed journeys, search, pagination/virtualized list; never render every node on one canvas.

## S06 — Daily check-in sheet
Header local date and “About a minute”; activity list with four states Done/Not Yet/Skipped/Not Suitable plus unset until user chooses. Habit-to-reduce response optional and neutral. Notes/reflection collapsed optional. Save, cancel, edit existing. Show XP preview only if eligible and explain reason; do not incentivize amount. Duplicate day opens existing record. Offline saves as pending, sync state visible; no fake “saved”.

## S07 — Journal timeline/detail
Chronological list grouped by local date, filters branch/activity, pagination and search. Each entry has private lock label, user-owned statuses, note visibility, revision/edit/delete menu. Optional measurements require user-defined label/unit and are excluded from public. Mobile detail full screen. No public share affordance on private note without explicit separate share flow.

## S08 — Activity detail & management
Template title/version, source/evidence/safety, estimated vs source-provided duration, personal vs reviewed label, schedule. Actions add/change schedule, pause/resume, replace, mark not suitable, archive, note. Confirm only destructive/meaningful transitions with consequence; status history visible. Self-created activity builder states not medically reviewed and warns not to enter medication/dose or emergency guidance.

## S09 — Community Explorer
Search/filter topic, content type, journey elapsed range; cards only from active projection. Card shows alias (not anonymity guarantee), selected milestones, self-reported check-in frequency with denominator/period, selected public activity and reflection; hide if source owner revokes. Banner says outcomes are individual and not proof. Guest can view limited public content; follow/start requires member. Report and block accessible.

## S10 — Public journey page
Public projection independent renderer/data contract. Header alias, chosen topic/context, share updated date, personal-experience disclaimer. Timeline includes only explicit public events; no raw journal. Field-specific owner control not exposed to viewer. Buttons Follow, Start my own, Report. Owner view adds Edit sharing/Stop sharing. Removed share URL returns neutral unavailable page and `noindex`.

## S11 — Follow management/feed
Following list, per-journey notification controls (in-app/email opt-in separate), mute/unfollow, latest permitted public updates. Empty state suggests discovery. Revoked source disappears; no stale cached detail. Feed avoids algorithmic health claim ranking.

## S12 — Milestone & reward
Celebratory but low-pressure modal: elapsed time, what user logged (self-report, optional), reflection prompts, earned cosmetic/learning reward, claim/close. No guilt language or comparative rank. Accessible focus trap, reduced-motion fallback, no forced confetti. Duplicate claim shows already collected.

## S13 — Reminder preferences
Explicit toggle default off, destination email, IANA timezone and local time, frequency, quiet hours, preview generic subject, pause/unsubscribe. Explain email may include safe map preview but no sensitive details. Delivery state/last error. Invalid zone fallback asks user rather than silently changing.

## S14 — AI Companion (Phase 5)
Explain-recommendation, summarize own journey, alternative, weekly reflection, community search with separate source panes. Shows citations and “educational, not medical care”. User selects allowed context; journal not included by default. Feedback, clear chat and controls. Urgent symptom/medication/diagnosis prompt receives bounded safe response and care-seeking direction; no auto-create activity without user confirmation.

## S15 — Admin (Vietnamese)
Separate modules: Quiz content preview; Discovery candidate list; evidence/source/version detail; review decision/reason; activation eligibility; review audit; community reports queue; user/content safety actions; reward config; aggregate metrics. Permissions displayed, sensitive fields masked. Candidate statuses, reviewer and expiry visible. Confirm destructive moderation; no private journal browsing by default. Audit export access logged. Review changes invalidate recommendation cache/version.

## Shared screen map
| Screen ID | Route concept | Main data/actions |
|---|---|---|
| S01 | `/en/wellness/healthclues/quiz` intro | consent, age confirmation |
| S02 | quiz step | adaptive answer session |
| S03 | quiz results/profile review | profile preview/update |
| S04 | discoveries/plan | recommendations, community teaser |
| S05 | `/en/wellness/healthclues/world` | World/branch/journey map |
| S06 | check-in sheet/dialog | daily activity states |
| S07 | journal/timeline | private entries |
| S08 | activity detail/editor | activity lifecycle |
| S09 | community explorer | public projections |
| S10 | community journey page | public projection/share controls |
| S11 | following | follows/preferences |
| S12 | milestone dialog | milestone/reward |
| S13 | reminder settings | opt-in/schedule |
| S14 | companion | retrieval-backed conversation |
| S15 | `/admin/healthclues/*` | review/moderation/config |
| S16 | `/en/wellness/healthclues/toolkit/catalog` | canonical item/method search and detail |
| S17 | `/en/wellness/healthclues/toolkit` | personal collection/equipped/paused/archived tools |
| S18 | `/en/wellness/healthclues/toolkit/timeline` | structured item/method usage timeline |

## S16 — Wellness Catalog picker & item detail
Search by canonical name, reviewed aliases, category and type (ingredient, recipe, movement, breathing, lifestyle, etc.). Ingredients, recipes and activities each have their own Catalog Item ID; a reviewed Usage Method/Activity Template is a separate versioned instruction linked to one or more items. Result cards show stable Catalog ID internally, clear item-vs-method label, version, review/evidence/safety summary, expiry/review date, related items and available methods. The item page must not imply an ingredient itself prescribes a method. Actions: view method, add item to collection, equip a reviewed method, suggest missing item, report duplicate/source issue. Empty state offers private Personal Tool creation or proposal; never silently creates a canonical item from free text. Inactive versions remain historical and cannot be newly equipped as approved.

## S17 — My Wellness Toolkit collection & equipment
Tabs/filters: In Collection, Equipped, Paused, Archived, Personal Tools. Each card has item icon/type, item name, selected method (if any), branch/journey, state, start date and schedule summary. Actions: equip to branch, add/change schedule, select a different method, pause, replace, archive, view usage timeline. Change confirmation explains previous usage stays attached to its original entry. Collection items can exist without being equipped or scheduled. Personal tools are visibly labeled “Personal · Unreviewed”; never display approved badge. List-first layout; drag/reorder has button alternative and keyboard support.

## S18 — Structured Usage timeline
Chronological local-date groups; filters by canonical item, method, branch, status and timeframe. Quick log selects a Toolkit entry (not free-text-only), then optional method, status, time/occurrence/count and private note. Count label says self-reported number of uses/repetitions, never ingredient amount or dose; no suggested count or “increase” prompt. Multiple occurrences are explicit rows or a declared count, not both for the same use; no inferred frequency from missing records. Edit/revise/delete with audit; schedule changes do not rewrite history. Public-share preview is separate and shows selected timeline entries with day/week/month granularity, status and any explicitly consented count before publishing. Empty state says “No record entered,” never “Not used.”

## Toolkit integration with existing screens
- **S04 Discovery:** cards offer Add to Toolkit; when recipe has ingredient identity, show distinct ingredient item and method links.
- **S05 World map:** equipped tools appear as cards/nodes within branch; map represents exploration/participation, not clinical progress. Collection/list view remains available.
- **S06 Check-in:** show due equipped tools, status and optional occurrence shortcut; multiple usage records never increase reward.
- **S09–10 Community:** filters distinguish same item from same method and show consented projection only.
- **S15 Admin:** Catalog normalization queue includes exact/near duplicates, aliases, type/category, provenance, reviewer decision and canonical ID create/link controls.

## Game Onboarding V1
### Implemented first-playable UI checkpoint (2026-10-27)

The route `/en/wellness/healthclues/world?quest={questId}` currently renders a responsive equipment reveal and, after confirmation, the persistent World view. The reveal has a 4-step progress strip, quest/region intro, three Consume/Eat, Reduce/Avoid and Do/Practice slots, reviewed item details and safety/evidence text, replace/unequip/skip, zero-tool support, and an explicit enter-world action. No item is preselected. When no reviewed Catalog items exist, the slot can be skipped and the map remains available.

The World screen uses a real inline SVG map with eight selectable regions, a highlighted current quest, dotted route, checkpoint markers, map/list alternative, active trail panel, Today/check-in action, next elapsed-day milestone, journey history and collection summary. Equipped tools expose pause/resume, schedule and same-slot replacement; replacement confirmation states that old usage stays on the prior Tool Entry. The check-in is a modal/bottom sheet with Done, Not Yet, Skipped, Not Suitable, optional occurrence count for practice tools, and a private note. Mobile stacks the map and panels without requiring zoom to find Today. Quiz drafts (answers, quest and step index) resume from the current browser tab's session storage after refresh; they are not sent to the server unless the user separately consents to save a profile.

Visual validation on 1440×1000 desktop and 390×844 mobile is recorded at `App/reports/healthclues-equipment-desktop.png`, `App/reports/healthclues-world-desktop.png` and `App/reports/healthclues-world-mobile.png`. These show the current implementation, including synthetic test copy; they are not approved product artwork. The named reference image was not present at test time, so no claim of a visual match is made. The current map uses vector terrain, paths and symbols, not a final authored fantasy illustration.

Seven stages: Welcome to Your Wellness World; Choose Your Quest; Discover Your Lifestyle; Personalized Safety & Preferences; Unlock Your Wellness Toolkit; Equip Your Starting Tools; Enter Your Wellness World. Use warm adult RPG and premium wellness styling, gentle transitions, map reveal, progress, Back/Skip/Resume and keyboard support. Mobile-first cards; reduced motion disables transitions. No account wall before result. Target 8–10 initial questions using the existing bank; retain deeper questions for relevant future triggers.

## S19 — Combo detail and slot assignment
Show combo type, ID/version, review status, why recommended and safety. Recipe Combo shows its own recipe item separately from each ingredient item and reviewed method. Journey Combo shows three slot columns and independent component cards, reason, safety, View Details, Replace, Skip and partial acceptance summary. Allow accept all eligible, accept selected, replace, skip combo. No prechecked/auto-equipped selection. Stale versions require refresh and re-evaluation.

S04 recommendations have per-slot Explore More, Why This Tool, Details, Safety Notes, Equip, Replace and Skip for Now. S05 map shows equipped item cards within branch and separate Collection access. S06 records selected Toolkit Entry and optional occurrences; reward never scales with count.

### Collection save interaction — implementation note (2026-10-27)

Catalog tool cards include **Add to My Collection** independently of **Equip this tool**. Saving does not equip or schedule an item. A signed-in member gets a server-validated save and the returned World payload refreshes collection state; a guest gets temporary session-only state, with no server write. This remains an item-level collection; method selection and Combo UI are not yet implemented.
# Approved RPG map and companion decisions — 2026-10-28

- Global Overworld art/coordinate system giữ đủ tám vùng. Hai vùng mở: Sleep Valley (Luna) và HealthClues Realm (Lumi); sáu vùng còn lại có marker Coming Soon, không route/gameplay.
- Hai detailed region maps và landmark scene (Camp, Library, optional Knowledge Challenge/Boss, Rewards) là yêu cầu approved nhưng **chưa có art/renderer riêng** theo `CURRENT_STATE.md`. Không phóng/crop Overworld thành ảnh bản đồ chi tiết giả, không thay artwork đã duyệt.
- Knowledge Quiz/mini-games/Boss là overlay hoặc scene trong active Region Map, không phải land thứ ba. Toolkit/Collection và Daily Companion là contextual game UI; mobile safe area, reduced motion, keyboard/focus và contrast phải giữ.
- Dùng một character, hai regional Pets; hiện sprite source chỉ chứng minh adventurer chung, chưa chứng minh Luna/Lumi asset/engine.


## 09B authenticated scene implementation evidence — 2026-10-29

`WorldAdventureScene` now replaces the saved authenticated V1 scrolling page with a viewport game scene. It reuses the existing eight-region `WellnessWorldMap`, surfaces two playable destinations and six Coming Soon states, and opens `RegionMapScene` for Sleep Valley or HealthClues Realm. A shared `HealthCluesPet` renders Luna/Lumi in the corresponding scene; landmarks open contextual in-game panels. Detailed environments are programmatic SVG artwork and are provisional, not final hand-painted assets. Browser evidence and visual limitations are in `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## UX addendum — Pet-led first-time guide (Milestone 09B, 2026-10-29)

For a newly activated World, open the appropriate detailed region map from the saved Quiz choice and show its Pet with one short action at a time. The optional guide stages are welcome, backpack, then knowledge; NEXT, SKIP GUIDE and close/minimize remain available. Hide the global game destinations while a guide stage is active. During the Backpack introduction, show only the three equipment slots and Backpack actions; defer Daily Check-in, Private Journal and settings shortcuts until the player has completed or skipped that step. Persist only tutorial stage/version, scoped to the authenticated owner and World. Tool discovery must filter to active reviewed Catalog entries with matching topic tags; if none exist, say so and allow continuing with empty slots. Quick Preview and full details may expose only reviewed version fields, attached reviewed Usage Methods, evidence, references and safety information; server equip validation remains authoritative. See `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md` for implementation evidence and limitations.

## 09C ? NPC discovery stations, Care Plan and region camera

Both playable Region Maps now show landmarks for Herbal & Nutrition, Activity Trail/Movement, Wellness Sanctuary/Practices, Camp, Knowledge, optional challenge and Rewards. A shared station component names Botanist, Explorer or Wellness Guide, gives concise educational framing, search/details and separate save/use/equip actions. Catalog rows are current editorially reviewed versions only; filtering is by the saved topic tag and item category. Editorial status, evidence classification and suitability remain separately labeled. The content list is intentionally empty when there is no match.

Adventure Camp opens a separate Care Records Keeper desk. It distinguishes My Collection, Backpack, Care Plan and Journal. Care Plan includes optional user methods and medicines with user-entered information, private self-report history, pause/delete and explicit acknowledgement. Medication UI warns that it does not prescribe or change medicines; it does not calculate or reward doses. Private notes are not stored in browser storage.

The existing React/SVG/DOM scene remains the renderer. Camera controls use bounded scale, pointer drag, wheel zoom, accessible zoom/reset buttons and arrow-key pan; hotspots are transformed with the same layer. Browser-specific gesture, focus and reduced-motion QA status is listed in the 09C report; do not infer 60 FPS without measurement.

## 09D-R — explorable Region scene (implementation evidence, 2026-10-29)

The detailed Sleep Valley and HealthClues Realm presentation uses the existing React/DOM scene renderer, not the old static polygon/dotted-line map. World coordinates are 1536×1024; the background and landmark controls share one transformed camera layer. Player destinations are snapped to the authored walkable corridor graph and routed with A*. The player walks continuously; camera easing follows the player, and the existing Pet actor follows at a short offset. A failed route does not fall back to a straight line through scenery. Landmark/NPC selection starts travel; Talk/Interact is offered only after arrival. Opening a React gameplay panel pauses scene movement; closing it resumes the same actor/camera state.

The environment image, landmark controls, player/Pet/NPC sprites and UI are separate layers. Current limitations: corridors are coarse authored walkability, not pixel-accurate obstacle collision; art requires human approval; mobile pinch needs physical-device QA and FPS has not been measured. Evidence: `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

## Daily companion reflection (implementation slice, 2026-10-29)

The existing private Check-in modal begins with one optional Pet prompt at a time, up to two. The player may skip directly to the private check-in. A second screen asks before copying the selected answers into the private note; the player can edit or clear that text before saving. No answer is transmitted until the player saves the check-in. Keep the interaction compact, touch-friendly, keyboard-accessible and free of medical advice. This does not replace the existing private usage/status form.


## Navigation collision and grounded sprite update — 2026-10-29

Detailed Region Maps use the existing React world renderer and separate authored data in `region-navigation-data.ts`. A* searches a 16px grid over narrow centerline corridors; player-clearance and bounds are applied, diagonal corner cuts are rejected, and each route/animated segment is continuously sampled. Roads/approaches are the only walkable areas; all other background is rejected. Bridge deck segments are separately highlighted in local-only navigation debug. The player transform marks the feet; the companion's navigation anchor stays on walkable ground while its sprite has a visual flight offset. Dialogue overlays do not pan/walk and close without changing scene position. Debug stays off unless local `?navDebug=1` or N is used. This is a corridor network, not a polygon navmesh or pixel-perfect collision mask; art occlusion layers and physical mobile gesture QA remain incomplete. See current acceptance report and actual debug screenshots.

## Learning Skills and mini-game presentation — 2026-10-29

Within the active Region Map's Knowledge Library, the Knowledge Book shows four shared Skills (Health Knowledge, Natural & Nutrition, Movement, Mind & Sleep) and five derived levels (Novice, Explorer, Learner, Scholar, Master). Progress bars derive from unique, persisted learning completions at thresholds 0/1/3/5/8. The isolated owner demo may expose four short step-based activities, each marked TEST ONLY / NOT HUMAN-REVIEWED. They are educational interface fixtures, not medical advice. A wrong answer can be retried without penalty; replay does not duplicate completion or XP. No new map or separate gameplay route is introduced.

## Final owner-demo visual verification — 2026-10-30

The default landscape Sleep Valley and HealthClues Realm views contain the complete 1536×1024 illustration in one scene viewport. Portrait uses bounded cover framing with a follow camera. The player, Pet, and station/NPC approaches follow one short connected authored garden path near the entrance; station labels have additional spacing to avoid the previous NPC-name overlap. Blocked scenery feedback clears after a successful safe route. Owner-browser checks assert the reset landscape world bounds fit the scene viewport and inspect current desktop/mobile captures. This remains corridor-based navigation, not pixel-accurate collision; generated prototype art still needs human approval and mobile emulation is not physical-device QA.


## NPC discovery and flexible Backpack — 2026-10-30

NPC panels use portrait/greeting/Journey context, illustrated educational cards, search/category controls, quick preview and full details. TEST ONLY cards are labeled and show no Equip action unless the isolated-demo eligibility flag is present. Backpack presents three peer equipment positions with action category as metadata; open positions remain open and replacement is explicit. Collection is independent. Daily Companion provides optional item-level statuses and a private note.
# Personalized suggestion presentation — 2026-10-30

The existing Camp and NPC panels host a compact “Suggested for your Journey” card stack (up to three, fewer when supported candidates are absent). It shows a concise reason, evidence/review status, caution, and destination. Explore requests a walk to the authored station; Save does not equip; Equip appears only for server-computed eligible items and requests explicit replacement if all three positions are full. NPC Encyclopedia remains separately browsable. No health recommendation labels are added to the map itself.

## Master Prompt 11 — first World entry and Quests Plan surface (2026-10-30)

For an authenticated first-time World entry, retain the selected region scene as a visible, softly dimmed/blurred backdrop and present a four-step modal with the matching Luna/Lumi Pet, concise dialogue, progress, Back/Continue/Skip and reduced-motion behavior. Focus moves into the modal and Tab navigation is contained while it is open. Step two shows only actual saved goals or a truthful no-goals message; step three spotlights the real Quests control and opens the same authenticated World Plan; step four identifies the reachable Botanist as a subtle first optional objective. Completing, skipping, refreshing and voluntarily replaying are supported through the existing guide state.

Quests opens **My Wellness Plan**, reading the current revision from the existing World data. Goal cards distinguish suggested TEST ONLY content from self-reported user goals and show configured target, schedule and actual record status; “Not recorded today” is not completion or failure. Edit, pause/resume and confirmed remove save a new Plan revision. One-note custom goals remain self-reported and inactive until configured and explicitly resumed. Plan UI is distinct from Today's Care/Daily Check-in. The panel is scrollable at 390×844; see the current acceptance report for screenshots and scope.

## Quests: confirmed Plan and Quiz recovery — 2026-10-31

- Show the saved, confirmed goals and revision for the current World. While loading, show progress; on failure, show a retryable error rather than an empty Plan.
- When there are no confirmed goals but a saved Quiz profile exists, explain that the Quiz is already saved and provide “Review my Quiz suggestions”. Reuse the profile; do not ask the Quiz again. The recovery view replaces the empty-state content and offers Back/Skip without writing. The Builder’s own explicit confirmation is the only action that saves a Plan revision.
- When no Quiz profile exists, state that separately and keep the ordinary personal-note option. Never show suggestions as chosen or active goals.

## Post-Quiz Advisor provider states — 2026-10-31

Plan Builder exposes truthful `GEMINI_AI`, `DETERMINISTIC_DEMO`, and `AI_UNAVAILABLE` states. Gemini status is shown only after a successful model response and server validation; a concise model label/request metadata is attached for QA. The unavailable UI states that no deterministic list was substituted and offers Retry Gemini while preserving Add My Own Goal and Skip/Continue. TEST ONLY templates are never relabeled as reviewed AI suggestions.

## My Journey navigation — 2026-10-31

Inside either playable Region, a persistent left-side `My Journey` button with a route icon sits directly below `World Map`. On narrow/mobile layouts it becomes a compact, touch-sized `Journey` control while retaining the accessible name `My Journey`; it stays above the map content and does not reposition world objects. Selecting it opens a compact owner/World-scoped summary, not a second Plan editor: Quiz focus, active confirmed goals, saved-for-later goals and personal goals are read from the existing World/profile payload. `View Full Plan` opens the canonical Quests Plan panel. When there is no confirmed Plan, the summary says so and offers saved-Quiz recovery without converting suggestions into goals. During first-entry tutorial step three, the same navigation button is highlighted and the Pet CTA opens that same summary. Visual/browser acceptance evidence is recorded in `reports/HEALTHCLUES_MY_JOURNEY_ACCEPTANCE.md`.


## Master Prompt 12 — contextual first-entry tour (2026-10-31)

Use a shared tour overlay over the existing region artwork. Each step has one live DOM target with measured spotlight bounds; resize/scroll updates placement. Darken and softly blur the rest of the scene, preserve a legible highlighted target, and place the Pet dialogue outside its bounds. On mobile, dialogue and target must remain visible with touch-safe controls. Keyboard focus stays within the dialogue while active; Escape skips; reduced-motion disables nonessential movement. Steps: Pet welcome/Start Tour; My Journey/Show My Goals; Botanist; Wellness Guide where present; Start Exploring. The My Journey step is only complete after opening the real authenticated panel or skipping. Never fabricate goals. Replay remains accessible after completion.

## My Journey inventory presentation (2026-10-31)

Panel dùng forest green, muted gold, icon inventory Game-icons.net kiểu silhouette đơn sắc, đồng thời giữ bản đồ nhìn thấy cạnh drawer. Desktop drawer khoảng 430px; mobile dùng sheet cuộn độc lập/safe-area. Wellness Focus hiển thị rõ self-reported, không phải chẩn đoán. Ba section Checklist, Herbs Equipped, Practices Equipped luôn nằm trong cùng DOM và expanded; không đổi sang tab trên mobile. Planned habits được gắn chú thích không phải completion log. Empty state hướng người chơi đến NPC đúng nguồn; không có Add Herb/Practice từ xa. My Journey dùng Backpack; checklist dùng Checklist; thảo mộc dùng Herbs bundle; practice dùng Lotus với tông vàng dịu/xanh lá/tím nhạt. Lucide hiện hữu tiếp tục phục vụ các điều khiển chức năng; giấy phép và tác giả Game-icons được ghi tại `public/healthclues/assets/ui/my-journey/ATTRIBUTION.md`. Không tạo/thay artwork vùng.

Trong bốn bước hướng dẫn bên trong panel (Wellness Focus, Daily Checklist, Herbs Equipped, Practices Equipped), Luna/Lumi nhỏ xuất hiện ngay trước section đang nói. Chỉ một section có viền/glow tại mỗi bước; ba section còn lại giảm sáng nhưng vẫn nằm mở đồng thời. Lớp phủ bao toàn bộ World map và chặn thao tác map trong lúc hướng dẫn; drawer vẫn nằm trên lớp phủ. Bong bóng không đè lên section được nhấn. Nội dung Checklist phân biệt Confirmed Plan với Quiz đã lưu nhưng chưa xác nhận; không gọi gợi ý là mục tiêu. Giải thích Herbs nêu rõ Botanist, Collection và equipment là các trạng thái khác nhau; giải thích Practices nêu Wellness Guide và không coi trang bị là đã sử dụng. Nút Back/Next chỉ chuyển focus/lời thoại, không thu gọn nội dung. Trên mobile, focus và Pet luôn cuộn tới vùng nhìn thấy được; giảm chuyển động tôn trọng `prefers-reduced-motion`.

## Player language selection ? 2026-10-31

### Region map and NPC interaction copy — 2026-11-02

The shared region scene resolves landmark labels, NPC names and greetings, approach labels, Talk/Interact actions, and movement help through the HealthClues locale dictionary. Locale changes affect presentation only; landmark IDs, routes, arrival requirements, and the underlying content remain unchanged. Vietnamese translations cover the navigation and greeting shell, not the catalog's editorial content or NPC-generated responses; those retain their own language and review disclosures. Full in-game localization remains partial until station content, guide copy, accessible labels, and account journeys are covered.

The existing HealthClues Welcome screen contains a clear English (default) / Tiếng Việt choice and a localized Start Journey action. An English / Tiếng Việt control is available in the player shell and existing Journey Settings. Keep locale changes within the HealthClues experience and preserve the current in-progress flow. Quiz questions and answer labels use the selected locale while keeping canonical values internally. Any approved knowledge material missing Vietnamese review must be clearly disclosed; do not present machine-translated medical content as approved.

### RPG HUD Language Switcher & Bilingual Dialogue Consistency — 2026-11-08 (Cycle 34)

The HUD top action control `.hc-rpg-lang-btn` toggles the entire game world between Vietnamese (`VI`) and English (`EN`):
1. **Instant UI & Dialogue Adaptation**: Switching language immediately translates:
   - NPC Talk Dialogue prompt (`.hc-rpg-talk`): NPC title, landmark title, greeting text, and action buttons (`Talk` / `Trò chuyện`, `Explore` / `Khám phá`).
   - Landmark Pills on the 2.5D Map: dynamically renders English (`Botanist / Botanical Garden`, `Knowledge Library / Research Library`, `Wellness Guide / Sanctuary`, `Activity Trail / Movement Discovery`) or Vietnamese (`Nhà Thực Vật Học / Vườn Dược Thảo`, `Kho Tri Thức / Thư Viện Nghiên Cứu`, `Người Hướng Dẫn / Khu Tĩnh Tâm`, `Đường Mòn Vận Động / Khám phá vận động`) without mixing languages.
   - Companion Lumi/Luna speech bubble, streak milestone cards, daily care goal titles, and bottom dock navigation tabs.
2. **Persistence Guarantee**: Language toggling dispatches an asynchronous `PATCH /api/healthclues/profile` with `{ preferredLocale }` and updates client cookies and localStorage, ensuring reloads and subsequent sessions honor the chosen language without reverting.
3. **No Feedback Loops**: Profile fetch on mount excludes `locale` from its dependency array to prevent race conditions that previously forced locale back to Vietnamese.

## Plan Builder localization and Advisor diagnostics — 2026-10-31

When locale is Vietnamese, translate Quiz-derived topic, selected interests, format and focus through the same canonical Quiz option labels; never translate or mutate stored IDs/answers. Technical status codes stay in server diagnostics. Player-facing failure text is localized, while source gaps explain that no checklist is shown. If reviewed Vietnamese candidate copy is unavailable, hide English/test-only health cards and show the honest language/content coverage gap. Preserve the Add My Own Goal and continue actions.


## Master Prompt 15 — guided My Journey spotlight behavior (2026-11-01)

The existing My Journey tutorial keeps all four real sections expanded and introduces Wellness Focus, Daily Checklist, Herbs Equipped and Practices Equipped in sequence. At each stop exactly one section receives the primary outline/glow; the other three are subdued. The real World is softly darkened and blocked behind the active dialog. Use the modal backdrop as the World dim layer so the actual Journey panel paints above it; do not use a body-level overlay that can out-stack the target content. Keep dialogue adjacent in normal panel flow. Auto-scroll within the Journey body to show the dialogue and target, preserve scrolling for long targets, and recalculate geometry when content or viewport changes. English/Vietnamese dialogue is presentation-only. No Quiz, Plan, inventory, World or tutorial persistence semantics change.

Implementation/browser evidence: reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md (isolated local Chromium, final build http://127.0.0.1:3296/play). Overall broader player localization remains PARTIAL.
# Master Prompt 16 — Plan Builder option presentation (2026-11-01)

Use compact goal cards showing a localized goal title, one relevance sentence, exactly two single-select AI action alternatives and a third “Customize” affordance that reveals one text input. Skip is available per card. Do not preselect a suggestion; selected draft choices remain inactive until the player confirms the existing Plan. Show a short non-prescriptive disclosure and expandable trusted source links. Do not show raw source IDs, provider failure codes, or mock output as genuine Gemini. Preserve no-goal/AI-unavailable states. Current profile lacks structured quantitative baselines, so target numbers are not displayed unless future reviewed profile data actually supports them.

## MP17 guided discovery and RPG goal selection — approved direction, not accepted end-to-end (2026-11-01)

New-player discovery uses one concern picker and short tap-first adaptive prompts, not the long legacy Quiz. AI recommendations appear in the actual World after the existing Pet welcome, without stacking the My Journey tutorial. Cards contain an unchecked goal checkbox, two action radio levels, and one custom radio that reveals one text field. Selection count updates immediately; zero-goal confirmation and postpone/continue are visible. A single concise disclaimer follows the list. In-world display, adaptive questions, and EN/VI browser acceptance are not implemented yet; do not mistake requirements for shipped behavior.

The existing pre-World Builder remains for legacy/rollback during migration. In that current Builder, the checkbox now controls inclusion independently from the A/B/custom mode. This UI change is source-implemented but awaits current-build Chromium verification.
## Master Prompt 17 — cozy fantasy goal-category visuals (2026-11-01)

The existing optional Wellness Plan cards render a small, tinted original SVG category illustration in a warm botanical medallion. Selection adds a restrained muted-gold ring; goal checkbox, A/B/custom options and text stay independent and fully interactive. A compact localized companion bubble reuses the existing region Pet art (Luna/Lumi), without an extra modal or claim of AI success. The seven canonical discovery-category icon keys are exported for the future concern-first chooser, while the five goal-category icons cover hydration, nutrition, movement, relaxation and everyday habits. These are lightweight monochrome silhouettes, not the hand-painted item illustrations in the reference. Existing HealthClues World art, HealthCluesAdventurer, Pet artwork, navigation and world maps remain unchanged. The proposed concern-first Discovery screen and in-World plan selection are still not implemented; this icon set does not imply those screens exist.

## MP17 new-player interaction delta — 2026-11-01 (implemented; acceptance pending)

New players start with an EN/VI concern picker and adaptive choice flow rather than the fixed Quiz view. The question screen supports multi-select where returned by the contract, optional detail, back/skip, retry, honest unavailable messaging, and continue-to-activation when the provider is unavailable. The new goal-first branch uses the existing category SVGs. After authenticated entry, the actual World can open the existing Plan panel with the correct Pet introduction before the normal guide. No fixture recommendations are exposed as real AI output. The activation/preview shell now has bilingual core labels, while region content and some surrounding World chrome still need localization audit. Browser acceptance for the full journey is pending; see MP17 report.

## Simplified bilingual AI goal card — 2026-11-02

Each generated card presents the same goal in the selected EN/VI language: short title, relevance reason, and two distinct implementation levels. The include checkbox remains independent from A/B/custom mode; Custom reveals a user-authored text field. The card list is optional and nothing is active until explicit Plan confirmation. The generated content is bilingual in one server response so language switching preserves the same recommendation IDs and does not request another inference. Keep one concise “not diagnosis or medical advice” disclosure; remove source-link UI for these ordinary generated suggestions because no catalog citation is required. No preset habit quantities or target values are shown.
## World-first new-player flow — approved 2026-11-02

After Welcome and locale choice, show all eight selectable region cards with only Sleep Valley/Luna and HealthClues Realm/Lumi playable. The selected region remains visually and functionally persistent through the short adaptive Quiz and account activation. The first authenticated view is the selected region scene, not an intermediate world choice. Present the Plan panel on first entry with truthful provider status; its companion copy must not claim recommendations exist before the Advisor succeeds. Keep the global map reachable in navigation. Reuse existing region art, map, NPCs and Plan Builder.
# MP20 Quiz and Hành trang UX override — 2026-11-02

The new-player Quiz has two numbered screens, with visible “1 of 2” / “2 of 2” progress. Use single-select concern cards first and checkable multi-select factor cards second. Sleep Valley uses sleep-specific concerns; HealthClues Realm uses health topics. Optional `None`, `Unsure`, and short notes must remain available. Do not present an AI loading state to render question two. The second screen must permit continuing with zero factors.

My Journey should expose recommendations and followed/equipped state in one screen. Distinguish a suggestion from an Active goal and from daily completion. Discovery previews for Botanist and Wellness Guide must communicate that selection happens at the NPC and must not offer direct Equip actions.


### MP20 activation save errors
When saving the consented pending journey fails, retain the preview and answers. Use localized, truthful error copy for invalid details, oversized context, unavailable secure storage and network failure; do not attribute server validation failures to browser storage.

### Owner checklist visibility refinement — 2026-11-02
In the first-entry My Journey panel, place “Recommendations for you” first, above Wellness Focus and the Daily Checklist/Herbs/Practices sections. This ensures a new player sees the real Advisor state and goal choices without scrolling. Keep the pet’s existing welcome introduction visible above the panel and retain My Journey as the re-open control. A provider error must remain visible with the actual Retry action; do not substitute fixture cards or claim UX acceptance from source order alone.

### Owner acceptance — checklist request lifecycle

When the owner opens the recommendation view, show the live state and distinguish `REQUEST_NOT_STARTED`, `GENERATING`, `SUCCESS_WITH_GOALS`, `PROVIDER_ERROR`, `VALIDATION_ERROR` and `NO_RECOMMENDATIONS`. Error status carries a sanitized request ID usable to correlate server-stage logs; no health answers are logged. My Plan navigation opens the recommendation panel when a saved Quiz profile exists. Keep the recommendation cards visible after immediate per-goal save and display active following goals in the same view. Plan API failure displays `PERSISTENCE_ERROR` and retries with the original idempotency key.


### 2026-11-03: show the actual Quiz concern in the World Plan

Display the player's selected concern and selected Q2 factors above generated goal cards, localized from stable concern/factor IDs where available. Identify whether a Gemini result came from the live provider or a reused saved response. Deterministic demos and synthetic test fixtures retain separate explicit labels. A concern/World mismatch must not render a stale Plan and must expose Retry. Keep the existing A/B/Custom selection and independent follow checkbox behavior.

### 2026-11-03: Faithful Plan Reference & Asymmetric Void Elimination

Personalized Wellness Plan UI adheres to the canonical `healthclues-plan-reference`:
1. **Header & Companion**: Lumi character cutout on the left with radiant leaf aura; speech bubble with golden `Lumi` badge delivering tailored welcoming dialogue.
2. **Plaque**: Centered embossed metallic emerald plaque with golden filigree and stars `✦ Kế hoạch dành cho bạn ✦` / `✦ Plan for you ✦`.
3. **Parchment Card Frame**: Warm cream/ivory background (`#fcf8ee` to `#f6edd7`) framed with golden borders (`#cca65b`).
4. **Goal Cards**: Horizontal white cards with vibrant green checkbox square (`✓`), high-resolution 3D illustrated icons (`ref_icon_drink.png`, `ref_icon_movement.png`, `ref_icon_nutrition.png`, `ref_icon_sleep.png`), bold title, and right-hand option box with green ring-dot radios for Option A (`[Khởi Động]`), Option B (`[Bứt Phá]`), and Custom (`Tự điều chỉnh`) with an inline pencil input box (`✏️ Nhập mục tiêu của bạn...`).
5. **Notice & Footer**: Golden parchment disclaimer banner with circular `ⓘ` icon. Footer action bar features left counter pill `📋 Đã chọn X/Y mục tiêu 🍃` and right juicy 3D emerald pill button `✔ Xác nhận kế hoạch`.

### 2026-11-12 — Cycle 88: Mobile Onboarding Ergonomics & Sticky Thumb Action Bar (`healthclues-mobile`)

On narrow mobile screens (`360x800` & `390x844`), the Expo mobile onboarding flow in `healthclues-mobile/app/(onboarding)/quiz.tsx` uses:
- Single-row 3-step RPG progress indicator (`1. Vùng` → `2. Khám phá` → `3. Kế hoạch`) instead of wrapping static world navigation pills.
- Compact header spacing on Welcome (`40x40` audio toggle, `minHeight: 40` language & sign-in controls, `minHeight: 52` primary CTA).
- Sticky bottom thumb action bars pinned within the `800px` fold on Discovery (`Quay lại` + `Tiếp tục` / `AI Phân Tích & Gợi Ý`) and Plan (`Đã chọn X thói quen`, `Sửa vấn đề`, `Gợi ý lại` + `Bắt Đầu Hành Trình (+50 EXP)`), plus a `44x44` checkbox hitbox (`goalToggleHitbox`), calm reassurance pill, and quick-fallback action (`plan-quick-fallback-btn`) during AI loading.

### 2026-11-12 — Cycle 89: Mobile Custom Typography, Vector Icons & 2.5D World Diorama (`healthclues-mobile`)

- **Typography & Iconography**: Bundles `BeVietnamPro` (`Regular`..`ExtraBold`) and `Spectral` (`SemiBold`/`Bold`) via `expo-font`; raises tiny label floors (`>= 10–11px`, `9.8px` tight-tracking for `360px` 6-tab bar so `"Hành Trình"` stays single-line); replaces chrome emojis across onboarding/game cards/modals with `lucide-react-native` vector icons; adds `10px` `hitSlop` on `(i)` info buttons.
- **World 2.5D Painterly Diorama (Ultra-Light Mobile) + Multiplayer & Simulated Villagers**: [`worldDiorama25D.ts`](file:///D:/botly/App/healthclues-mobile/src/utils/worldDiorama25D.ts), [`useWorldPresence.ts`](file:///D:/botly/App/healthclues-mobile/src/hooks/useWorldPresence.ts), [`useLivingVillageVisitors.ts`](file:///D:/botly/App/healthclues-mobile/src/hooks/useLivingVillageVisitors.ts) & [`world.tsx`](file:///D:/botly/App/healthclues-mobile/app/(game)/world.tsx) preserve the hand-painted 1600×900 region artwork as a 60fps GPU-animated (`Animated.Value` + `requestAnimationFrame`) 2.5D diorama with perspective Y-depth actor/landmark scaling (`0.76x–1.14x`), dynamic `zIndex` Y-sorting, decoupled floor shadows, real-time online peer rendering (`🟢 {nickname}`, coordinate sync, greeting modal, TopHud `onlineCount`), and 6 simulated village visitors (`Anna`, `Leo`, `Mia`, `Ben`, `Lily`, `Lucas`) walking along `AUTHORED_PATHS` with pause-on-unfocus energy saving.
6. **Modal Grid Layout**: Eliminates the asymmetrical dark green empty space in "Hành trình của tôi"; `data-inventory-section="suggestions"` spans full width `grid-column: 1 / -1`.
