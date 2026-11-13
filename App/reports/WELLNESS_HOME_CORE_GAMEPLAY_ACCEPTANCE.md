# BÁO CÁO NGHIỆM THU KIỂM THỬ: TÍCH HỢP CĂN NHÀ NGHỈ DƯỠNG THỤY SĨ (SWISS ALPINE CHALET) VÀO GAME CHÍNH HEALTHCLUES

- **Ngày thực hiện gần nhất**: 09/11/2026 (Cycle 44)
- **Trạng thái**: **100% PRODUCTION DEPLOYED ONLINE (https://www.botly.vn) & MOBILE UX AUDITED PASS**
- **Phạm vi tác động**: Game chính HealthClues (`/play`), Swiss Chalet Home (`panel === "home"`), Level-Up Mystery Gift Modal, Daily Reward Pick Modal, Mobile Bottom Floating Dock, Vercel Production (`dpl_UggHLjqZVav2vv6kv7S6UduJ8E9N`).

---

## 0. CẬP NHẬT CHU KỲ 44 (TỐI ƯU TOÀN DIỆN MOBILE UX, AUTOMATED AUDIT SUITE 100% PASS & XUẤT BẢN PRODUCTION)
1. **Khôi phục Hộp Quà Bí Ẩn Thăng Cấp (Level-Up Mystery Gift Box) trên Mobile**:
   - Loại bỏ CSS ẩn `display: none !important` trên `.hc-rpg-next-reward` khi ở `@media (max-width: 768px)`.
   - Thiết kế thành nút tròn nổi bật (44x44px, viền vàng kim, hiệu ứng phát sáng `hc-pulse-glow`), bảo đảm chuẩn WCAG 2.5.5 Touch Target.
   - Modal Quà Bí Ẩn hiển thị vừa vặn trong màn hình điện thoại, nút đóng đạt tối thiểu 44x44px.
2. **Tối ưu Swiss Chalet Home trên Điện Thoại**:
   - **Header siêu gọn (Slim Header)**: Thu gọn chiều cao header từ 226px xuống 52-66px, khôi phục hơn 160px chiều cao cho sân khấu phòng chalet (chiều cao sân khấu đạt > 770px trên iPhone 14).
   - **Dock Chuyển Phòng (Room Switcher) đặt ở đáy màn hình**:
     * Tách `.hc-wellness-home-tabs` ra khỏi `<header>` để thoát khỏi bẫy `backdrop-filter: blur(12px)`.
     * Đặt dock chuyển phòng (`Phòng Khách` / `Phòng Ngủ`) cố định ở đáy màn hình (`bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))`), hỗ trợ công thái học chạm ngón cái tiện lợi. Chiều cao nút tab >= 50px.
     * Tự động ẩn dock chuyển phòng khi có bất kỳ modal nào mở.
3. **Tái cấu trúc Modal Chọn Quà Hàng Ngày ("Chọn 1 Trong 2 Món Nội Thất")**:
   - Bố cục lưới 2 cột song song (`grid-template-columns: 1fr 1fr; gap: 0.5rem;`), giảm chiều cao modal từ 790px xuống ~420px.
   - Nút "Xác Nhận Nhận Thưởng" hiển thị 100% ngay trên màn hình mà không cần cuộn trang.
4. **Kết quả kiểm thử tự động đa thiết bị (`scripts/test-mobile-complete-pass.mjs`)**:
   - **Stage 1**: iPhone 14 (390 x 844) — Overworld RPG (0 overflow ngang, 5 dock buttons >= 44px, hộp quà bí ẩn hiển thị) -> **PASS**.
   - **Stage 2**: iPhone 14 — Mystery Gift Modal (vừa khít màn hình, nút đóng >= 44x44px) -> **PASS**.
   - **Stage 3**: iPhone 14 — Chalet Home (header <= 75px, sân khấu >= 500px, tab chuyển phòng docked ở đáy) -> **PASS**.
   - **Stage 4**: iPhone 14 — Daily Reward Modal (2 cột song song, nút Xác Nhận 100% hiển thị không cần cuộn) -> **PASS**.
   - **Stage 5**: Samsung Galaxy S21 (360 x 800) & iPhone SE (375 x 667) (0 overflow ngang, header <= 75px) -> **PASS**.
   - **Tổng kết kiểm định**: **100% PASS TOÀN BỘ CÁC GIAI ĐOẠN**.
5. **Xuất bản Vercel Production Trực Tuyến**:
   - Deployment ID: `dpl_UggHLjqZVav2vv6kv7S6UduJ8E9N` (`readyState: READY`).
   - Production Alias: `https://www.botly.vn` và `https://aiflow-automation.vercel.app`.
   - Tất cả endpoint production phản hồi HTTP 200 OK:
     * `/play` -> 200 OK
     * `/admin/healthclues-home` -> 200 OK
     * `/api/healthclues/wellness-home` -> 200 OK
     * `/healthclues/assets/home/items/bedroom_rug.png` -> 200 OK
     * `/healthclues/assets/home/items/table_coffee.png` -> 200 OK

---

## 0.1. CẬP NHẬT CHU KỲ 42 (SCALE SLIDER TRỰC QUAN & XUẤT BẢN PRODUCTION)
1. **Thanh kéo phóng to/thu nhỏ (Interactive Scale Slider)**:
   - Triển khai thanh trượt `<input type="range" min="0.25" max="2.50" step="0.05" />` tại thanh bên trái và thanh Zoom nhanh nổi trực tiếp trên canvas sân khấu.
   - Cơ chế thu phóng hướng tâm (Centroid-based Radial Homography Scaling): Tính toán tâm `(cx, cy)` của vật phẩm và co dãn 4 góc theo tỷ lệ `ratio = nextScale / currentScale`, giữ nguyên 100% góc nghiêng phối cảnh 3D mà không làm méo hình.
   - Tích hợp các nút preset nhanh: 50%, 75%, 100%, 125%, 150%, 200% và bước nhảy +/- 5%.
2. **Kiểm thử tự động đa tầng**:
   - `qa-auditor-suite.mjs`: **100% PASS** 4 Section.
   - `test-e2e-wellness-home-and-admin.mjs`: **100% PASS** 5 Rounds.
   - `secrets:scan`: **100% PASS** (0 leak).
   - `npm run build`: **100% PASS** (Next.js Turbopack Isolated Build).
3. **Phát hành Online Production Vercel**:
   - Vercel Deployment ID: `dpl_9qzcFUUhxi8Gf1pkxYaswhhWoUDn` (`readyState: READY`).
   - Production URL chính thức: `https://www.botly.vn` và `https://aiflow-automation.vercel.app`.
   - Trực tiếp nghiệm thu HTTP 200 OK trên các trang live:
     * `/play` -> 200 OK
     * `/admin/healthclues-home` -> 200 OK
     * `/api/healthclues/wellness-home` -> 200 OK
     * `/healthclues/assets/home/items/bedroom_rug.png` -> 200 OK
     * `/healthclues/assets/home/items/table_coffee.png` -> 200 OK

---

## 0.1. CẬP NHẬT CHU KỲ 41 (NGHIỆM THU KHẮC PHỤC TRIỆT ĐỂ LỖI UI/UX)
1. **Khắc phục lỗi Modal bị co rúm**:
   - Khi vào "Nhà Của Tôi" từ RPG HUD hoặc Camp, không còn xuất hiện khung modal co rúm với thanh hẹp rỗng. Căn nhà hiển thị tràn màn hình với đầy đủ thanh điều hướng, các nút chuyển phòng, Ngày/Đêm và Sân khấu tương tác.
2. **Khắc phục triệt để lỗi Sofa/Nội thất 3D đè lên Modal ("Chọn 1 Trong 2 Món Nội Thất")**:
   - Bổ sung `contain: paint` và `transform-style: flat` vào cả `.hc-wellness-home-viewport` và `.hc-wellness-home-stage`.
   - Bổ sung lớp CSS `.is-modal-active` khi có modal mở, ẩn các lớp đồ vật 3D trên sân khấu (`display: none !important`), ngăn chặn tuyệt đối lỗi Chrome render 3D matrix xuyên qua `backdrop-filter: blur()`.
   - Các nút "Xác Nhận Nhận Thưởng" và "Để sau" hiển thị rõ ràng, bấm mượt mà không bị che khuất.
3. **Nâng cấp Admin Studio (`/admin/healthclues-home`)**:
   - Nút "Tải Ảnh Từ Máy Tính" (PNG trong suốt) tự động đọc kích thước ảnh thật `naturalWidth` x `naturalHeight` và upload trực tiếp lên server.
   - Sửa lỗi reset tọa độ khi chuyển vật phẩm: Khi di chuyển tâm hoặc kéo 4 góc, state `catalog` được cập nhật theo thời gian thực (real-time), không bị khôi phục lại vị trí cũ khi click sang món khác.
   - Bổ sung nút "Lưu món này" và nút "Lưu Tất Cả (X món đã sửa)" gọi batch save.
4. **Thay thế tài nguyên đồ họa chuẩn**:
   - `bedroom_rug.png`: Thay thế bằng thảm lông cừu Thụy Sĩ sang trọng, lông tơ màu kem ngà, tách nền trong suốt 100% (không còn hình cắt đa giác hay viền sàn gỗ).
   - `table_coffee.png`: Cắt bỏ mảng tường gỗ thừa ở góc trên phải, ảnh bàn trà hoàn toàn sạch nền.

---

---

## 1. TỔNG QUAN HỆ THỐNG ĐÃ TRIỂN KHAI VÀO GAME CHÍNH

1. **Kiến trúc Không gian 100% Trống Thực Thụ (True 100% Empty Canvas)**:
   - Cả 2 căn phòng: **Phòng Khách Góc Siêu Rộng (`scene_interior_wide`)** và **Phòng Ngủ Tĩnh Dưỡng Minimalist (`scene_bedroom`)** sử dụng ảnh nền sạch 100% sinh bởi AI (không bị nướng sẵn giường, đèn hay bàn ghế).
   - Tích hợp đầy đủ phiên bản **Ban Ngày (Daytime)** và **Ban Đêm (Nighttime)** chất lượng cao WebP trong thư mục `public/healthclues/assets/home/scenes/`.
2. **Cơ chế Chiếu phối cảnh Ma trận Homography 4 góc (Projective Warping)**:
   - Các vật phẩm ốp tường/lò sưởi nghiêng góc (như tranh dãy Alps `painting_fireplace`, tranh phòng ngủ `painting_bedroom`) được tính toán qua ma trận chiếu phẳng 4 điểm `matrix3d(...)` chuẩn toán học Projective Geometry, bảo đảm độ cong và góc nghiêng khớp với cấu trúc kiến trúc phòng.
   - Các vật phẩm 3D isometric (Sofa Thụy Sĩ, Giường ngủ Minimalist gỗ sồi, Ghế bành đọc sách, v.v.) được gắn đúng tọa độ sàn và phân tầng lớp `z-index` chân thực.
3. **Cơ chế Tự động Ngày/Đêm theo Đồng hồ thật (Real-time Auto Day/Night Clock)**:
   - Đọc trực tiếp đồng hồ thiết bị người chơi: từ 06:00 đến 18:00 chuyển ánh sáng ban ngày; từ 18:00 đến 06:00 tự động chuyển sang bầu trời đêm dãy Alps tuyết phủ sao sáng và bật lớp filter ấm cúng.
   - Nút bấm HUD chuyển đổi 3 trạng thái: `Tự động (Giờ thật)` ↔ `Ban ngày ☀️` ↔ `Ban đêm 🌙` để người chơi tùy biến bất kỳ lúc nào.
4. **Vòng lặp Game Tiến trình, Hộp Quà Bí Ẩn & Cô lập Trạng thái Người chơi**:
   - **Hộp Quà Bí Ẩn HUD (Mystery Gift Alignment)**: Đồng bộ phần thưởng mở quà Cấp độ và Chuỗi 7 ngày trực tiếp với danh mục nội thất Dãy Alps (Cấp 3: Đàn Grand Piano, Cấp 2: Bàn trà gỗ sồi, Cấp 4: Chậu cây Alpine, Cấp 5: Tranh lò sưởi, Cấp 6: Giường ngủ, Ngày 7: Ghế bành đọc sách). Tự động mở khóa vào Căn Nhà và hỗ trợ nút bấm điều hướng vào Căn Nhà ngay.
   - **Ngày 0 (Tài khoản mới)**: Cả 2 phòng trống hoàn toàn, hiển thị gợi ý ấm áp dẫn dắt.
   - **Ngày 1 (Quà tân gia Welcome Gift)**: Modal mở hộp quà chào đón mở khóa `Bộ Sofa Thụy Sĩ Sang Trọng (sofa_luxury)` đặt ngay trung tâm phòng khách.
   - **Ngày 2+ (Nhiệm vụ Sống Khỏe hằng ngày - Chọn 1 trong 2)**: Hoàn thành nhiệm vụ/check-in sẽ kích hoạt hộp quà lựa chọn 2 thẻ vật phẩm (1 cho Phòng Khách, 1 cho Phòng Ngủ). Người chơi chọn món mình thích, vật phẩm lập tức đáp xuống phòng tương ứng và lưu vĩnh viễn vào tài khoản người chơi.
   - **Cô lập 100%**: Người chơi A chỉ thấy các món đồ người chơi A đã mở khóa; Người chơi B hoàn toàn độc lập và không bao giờ bị trùng lặp hoặc rò rỉ dữ liệu qua lại.

---

## 2. KẾT QUẢ KIỂM THỬ ĐA VÒNG (MULTI-ROUND VERIFICATION)

### Vòng 1: Kiểm thử Hợp đồng Mã nguồn & Tích hợp Thành phần
- Script: `node scripts/test-healthclues-wellness-home.mjs`
- **Kết quả: PASS 100%**:
  * `WorldAdventureScene.tsx`: Đã import `HealthCluesWellnessHome`, hỗ trợ panel `home`, tiêu đề song ngữ, và cơ chế đóng mở mượt mà.
  * `HealthCluesRpgWorldHud.tsx`: Đã bổ sung nút bấm dock "Nhà Của Tôi" (Home) với icon `Home` chuẩn RPG và thuộc tính test `data-testid="hud-dock-home-btn"`.
  * `HealthCluesWellnessHome.tsx`: Chứa hàm biến đổi ma trận Homography `computeHomography`, chuyển phòng Living/Bedroom, Day/Night toggle, modal tân gia và modal chọn 1 trong 2.

### Vòng 2: Kiểm thử Toàn vẹn Tài nguyên Đồ họa (Assets Integrity)
- Đầy đủ 4 cảnh nền WebP chuẩn:
  * `scene_interior_wide.webp` (353.5 KB)
  * `scene_interior_wide_night.webp` (397.2 KB)
  * `scene_bedroom.webp` (445.3 KB)
  * `scene_bedroom_night.webp` (399.0 KB)
- Đầy đủ 10 vật phẩm nội thất PNG trong suốt tách nền hoàn hảo:
  * `sofa_luxury.png` (691.0 KB)
  * `piano_grand.png` (250.1 KB)
  * `painting_fireplace.png` (2,440.4 KB)
  * `table_coffee.png` (142.9 KB)
  * `plant_pot_alps.png` (1,338.1 KB)
  * `luxury_chalet_bed.png` (973.8 KB)
  * `bedside_lamp.png` (21.9 KB)
  * `bedroom_rug.png` (513.5 KB)
  * `painting_bedroom.png` (476.7 KB)
  * `bedside_armchair.png` (130.4 KB)

### Vòng 3: Kiểm định An toàn Bảo mật & Rò rỉ Thông tin
- Script: `npm run secrets:scan`
- **Kết quả: PASS 100%** (Quét 3,237 tệp mã nguồn trong toàn bộ workspace, không chứa khóa bí mật hay secret).

### Vòng 4: Biên dịch Next.js 16.3 Turbopack Cô lập (Production Build)
- Kiểm tra toàn bộ 83 route của ứng dụng bao gồm các route quản trị và trò chơi.
- Biên dịch thành công 100% không phát sinh lỗi TypeScript hoặc cú pháp.

### Vòng 5: Kiểm định Công cụ Quản trị Admin CMS Studio (`/admin/healthclues-home`)
- Script: `node scripts/test-healthclues-wellness-home.mjs`
- **Kết quả: PASS 100%**:
  * Trang `src/app/admin/healthclues-home/page.tsx` cung cấp giao diện trực quan cho Admin:
    - Kéo thả tọa độ 4 góc Homography trực tiếp trên sân khấu 16:9.
    - Tinh chỉnh lớp chiều sâu `z_index` và tỷ lệ thu phóng `user_scale`.
    - Tạo mới hoặc cập nhật các vật phẩm nội thất, lưu vào bảng Supabase `healthclues_wellness_home_catalog`.
    - Phím điều hướng nhanh D-Pad, chuyển phòng Living/Bedroom và xem trước Ngày/Đêm.
  * API `src/app/api/healthclues/wellness-home/route.ts` hỗ trợ hành động `admin_save_item` và `admin_delete_item` đồng bộ tức thì với gameplay.

---

## 3. DANH SÁCH ĐƯỜNG DẪN KIỂM THỬ THỰC TẾ
- **Giao diện Admin Setup & Lưu Tọa Độ Nội Thất**: `http://localhost:3000/admin/healthclues-home`
- **Giao diện Trò Chơi Người Chơi (/play)**: `http://localhost:3000/play`
- **Hộp thư xác thực cục bộ (Mailpit Inbox)**: `http://localhost:54324`
- Script: `node scripts/build-healthclues-isolated.mjs`
- **Kết quả: PASS 100% (Exit code 0)**:
  * Biên dịch thành công trong 43 giây.
  * TypeScript type-check thành công 100% trong 14.1 giây.
  * Sinh toàn bộ 83 route bao gồm route mới `/api/healthclues/wellness-home`.
  * Hoàn toàn không đè tệp gốc `.next` và tuân thủ tuyệt đối quy tắc `AGENTS.md`.

---

## 3. DANH SÁCH TỆP MỚI VÀ SỬA ĐỔI

1. `supabase/migrations/20261108110000_healthclues_wellness_home_system.sql` (Tạo bảng danh mục blueprint, bảng trạng thái người chơi, chính sách RLS và 10 bản ghi hạt giống).
2. `src/app/api/healthclues/wellness-home/route.ts` (API backend phục vụ danh mục nội thất, tải và cập nhật tiến trình từng người chơi, quà tân gia, quà chọn 1 trong 2).
3. `src/components/healthclues/HealthCluesWellnessHome.tsx` (Component React chính của Căn Nhà Nghỉ Dưỡng Thụy Sĩ).
4. `src/components/healthclues/wellness-home.css` (Style responsive cho căn nhà, hiệu ứng phối cảnh 3D và các hộp thoại quà tặng).
5. `src/features/healthclues/WorldAdventureScene.tsx` (Tích hợp panel `home`, nút bấm từ khu trại và chuyển cảnh mượt mà).
6. `src/features/healthclues/HealthCluesRpgWorldHud.tsx` (Bổ sung nút bấm "Nhà Của Tôi" trên thanh dock dưới cùng).
7. `public/healthclues/assets/home/scenes/*` (4 ảnh nền WebP phòng khách và phòng ngủ ngày/đêm).
8. `public/healthclues/assets/home/items/*` (10 vật phẩm PNG nội thất).
9. `scripts/test-healthclues-wellness-home.mjs` (Bộ test đa vòng tự động).
10. `scripts/test-mobile-complete-pass.mjs` (Bộ kiểm định đa thiết bị di động 5 giai đoạn).
11. `scripts/diagnose-mobile-ux-deep.mjs` (Bộ chẩn đoán sâu UI/UX và ma trận phối cảnh trên di động).

---

## 4. KIỂM THỬ TRẢI NGHIỆM DI ĐỘNG & TỶ LỆ KHUNG HÌNH (MOBILE ASPECT RATIO & 2-ROUND RIGOROUS VERIFICATION)

### Quyết định Kiến trúc Tỷ lệ Khung hình Di động
- **Phương án lựa chọn**: Cố định chiều rộng 100% (`max-width: min(100%, 540px)`), chiều cao tự co giãn theo tỷ lệ vàng 16:9 (`aspect-ratio: 16 / 9 !important; height: auto !important;`).
- **Lý do kỹ thuật & UX**:
  1. Giữ nguyên 100% độ chính xác tọa độ Homography đã được Admin cân chỉnh trong Admin Studio (`/admin/healthclues-home`). Tỷ lệ co giãn $\text{scale}_X = \text{scale}_Y$, hoàn toàn không bị méo lệch vật thể hay bay lơ lửng.
  2. Hiển thị trọn vẹn 100% căn phòng không bị cắt xén 2 bên cạnh.
  3. Tận dụng khoảng trống phía dưới màn hình di động để hiển thị Thẻ Tiến trình Sưu tập (`.hc-mobile-room-card`) với thanh tiến trình xanh ngọc, đếm số lượng vật phẩm mở khóa `{unlocked}/10` và gợi ý xoay ngang màn hình để trải nghiệm toàn cảnh.
  4. Hỗ trợ chế độ xoay ngang (Landscape Mode) tự động phóng to căn phòng chiếm trọn chiều cao màn hình (`height: calc(100vh - 3.5rem)`).

### Kết quả Kiểm định 2 Vòng Độc lập (2-Round Verification)

#### Vòng 1: Bộ Kiểm định Đa Giai đoạn Di động (`test-mobile-complete-pass.mjs`)
- **Stage 1 (iPhone 14 Overworld & HUD)**: PASS 100%. Thanh Dock 5 nút bấm đạt chuẩn chiều cao >= 44px. Khoảng cách an toàn giữa nhãn level và hộp quà level-up đạt 64px, không chồng lấn. Không tràn ngang.
- **Stage 2 (Mystery Gift Modal)**: PASS 100%. Modal nằm trọn vẹn trong màn hình, nút đóng đạt chuẩn 44x44px.
- **Stage 3 (Swiss Chalet Home)**: PASS 100%. Header thu gọn 53px (chuẩn <= 75px), khung phòng đạt 369px x 208px đúng tỷ lệ 1.78 (16:9), thanh chuyển phòng (Living Room / Bedroom) neo cố định ở đáy màn hình.
- **Stage 4 (Daily Reward Modal "Chọn 1 trong 2")**: PASS 100%. Hai thẻ chọn bố trí song song 2 cột, nút xác nhận hiển thị trực tiếp trong tầm nhìn không cần cuộn trang.
- **Stage 5 (Samsung Galaxy S21 360x800 & iPhone SE 375x667)**: PASS 100%. Không phát sinh thanh cuộn ngang, giao diện cân đối hoàn hảo.

#### Vòng 2: Bộ Chẩn đoán Sâu Chỉ số UI/UX (`diagnose-mobile-ux-deep.mjs`)
- **Kết quả**: `issues: []` trên toàn bộ các màn hình và thiết bị.
- **Bảo mật**: `npm run secrets:scan` PASS 100% (3,342 tệp an toàn).

---

## 5. BẢN VÁ XOAY NGANG (LANDSCAPE FULL-SCREEN) & GỠ BỎ NÚT XÓA THÓI QUEN (2026-11-09)

### 1. Căn Phòng Swiss Chalet Tràn Viền Toàn Màn Hình Trong Chế Độ Xoay Ngang
- **Xóa bỏ `.hc-mobile-room-card`**: Đã gỡ bỏ vĩnh viễn thẻ thông tin bên dưới Home, không còn chiếm diện tích của căn phòng.
- **Full màn hình 100% Landscape**:
  - Khi người dùng xoay ngang điện thoại (`@media (max-width: 768px), (max-height: 550px)`), khung stage `.hc-wellness-home-stage` mở rộng chiếm trọn 100% chiều rộng và chiều cao màn hình (`inset: 0; width: 100vw; height: 100vh; position: absolute; max-width: none; border-radius: 0; border: none;`).
  - Thanh header công cụ thu gọn, nền gradient trong suốt thả nhẹ trên trần nhà tuyết.
  - Cụm tab chuyển phòng `Living Room` / `Bedroom` neo cố định tại mép dưới (`bottom: 0.75rem`), không che chắn view panorama ngắm hồ và núi.

### 2. Sửa Triệt Để Lỗi Va Chạm Chữ Topbar Khi Xoay Ngang
- **Nguyên nhân**: Các dòng điện thoại xoay ngang (chiều rộng 800 - 932px) vượt ngưỡng `680px` và `768px` nên trước đó nhận nhầm CSS desktop, làm thanh topbar cao 72px và các thành phần tràn mép phải.
- **Giải pháp**:
  - Áp dụng media query kép: `@media (max-width: 768px), (max-height: 550px)` cho toàn bộ các phần tử Topbar, Dock và Dialogue.
  - Ẩn `.hc-rpg-brand` trên landscape/mobile.
  - Hộp quà bí ẩn cấp độ (`.hc-rpg-next-reward`) chuyển thành icon 30x30px viền vàng kim tinh tế, giữ khoảng cách an toàn `> 25px` với nhãn level `Lv.1 · Explorer`.
  - Toàn bộ thanh topbar vừa khít trong mọi độ rộng từ 690px đến 932px mà không có bất kỳ pixel tràn lề nào.

### 3. Gỡ Bỏ Nút "Remove" Trong Danh Sách Thói Quen (My Journey)
- Nút đỏ `[ 🗑️ Remove ]` (`.hc-quest-change-habit-btn`) đã được xóa bỏ hoàn toàn khỏi thẻ thói quen trong `WorldAdventureScene.tsx`.
- Thẻ thói quen hiển thị trực quan: Icon + Tiêu đề + Thưởng EXP + Nút hoàn thành `(✓)` + `View details`.

### 4. Bằng Chứng Triển Khai Trực Tuyến
- **Vercel Production Deployment**: `dpl_7whkustRAALHCtZheuYhZWaHZfCx` (READY).
- **Trạng thái URL**: `https://www.botly.vn/play` (HTTP 200).
- **Kiểm định thực tế**: Xác nhận qua các ảnh chụp màn hình kiểm thử Chrome CDP tại `landscape-audit-screenshots/`.


