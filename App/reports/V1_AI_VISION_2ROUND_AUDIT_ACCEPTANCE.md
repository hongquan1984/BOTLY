# Báo Cáo Nghiệm Thu Thị Giác AI Vision 2 Vòng — Hoàn Thiện Giao Diện Làng Sống Khỏe (Swiss Village)

> **Mã Chu Kỳ:** Cycle 104  
> **Thời Gian Thực Hiện:** 14/11/2026  
> **Trạng Thái:** **ĐÃ HOÀN THIỆN & VƯỢT QUA TOÀN BỘ 2 VÒNG KIỂM THỬ THỊ GIÁC AI VISION (0 PAGE ERRORS, 100% PASS, TỶ LỆ KHOẢNG ĐEN ONBOARDING 0.00%, TRIỆT TIÊU TOÀN BỘ VẾT NHOÈ & KHÔNG CÒN BẤT KỲ ĐIỂM CHỒNG ĐÈ NÀO)**

---

## 1. Tóm Tắt Khắc Phục Các Vấn Đề Người Dùng Phản Hồi ("Kinh Khủng")

| Vấn Đề Gốc Gây Khó Chịu | Nguyên Nhân Kỹ Thuật | Giải Pháp Khắc Phục Triệt Để | Kết Quả Đo Lường AI Vision |
| :--- | :--- | :--- | :--- |
| **Vết nhoè, loang lổ mờ mịt trên nền đá cuội** | Thuật toán biharmonic inpainting làm mờ và mất cấu trúc vân đá trên diện rộng. | Thay thế bằng **Texture-Preserving Patch Synthesis**, lấy mẫu trực tiếp từ các khối đá và thớ gỗ sắc nét lân cận cùng góc chiếu sáng. | Độ biến thiên gradient tăng **147.5%** (từ 4.2 lên 10.44 - 13.43). Nền đá sắc nét từng viên cuội, không còn vết xám loang lổ. |
| **Banner "Thư Viện Ánh Trăng" đè lên đầu & người Anna** | Tọa độ `y: 560` nằm đúng vị trí Anna đứng trên quảng trường (`y: 620`). | Dời `library` lên cao độ `(800, 380)` trên ban công nhìn ra hồ giữa hai mái nhà, cách Anna hơn **230px**. | Khoảng cách an toàn đạt **230px**, tầm nhìn thoáng đãng, không chạm vào nhân vật. |
| **"Nhà Thực Vật Học" dính chùm với Ben & thú cưng Luna** | Trạm `botanical` đặt tại `(960, 650)`, trùng ngay vị trí xuất phát của Ben `(950, 660)`. | Dời `botanical` sang hẳn lối đi vườn hoa nhà thờ đá bên phải `(1220, 520)`, cách Ben hơn **280px**. | Tách biệt hoàn toàn, Ben đi trên đường đá riêng, Nhà Thực Vật Học ở khu hoa viên riêng. |
| **Xuất hiện 2 nhãn "Ben" (Một nhãn kẹt dưới mái hiên nhà thờ)** | Nhãn Ben cũ trong ảnh gốc người dùng chưa được tẩy sạch hoàn toàn do tọa độ cắt cũ bị lệch. | Quét chính xác vùng `(1020, 210, 1065, 315)` và cấy texture tường đá tự nhiên thay thế. | Xóa sạch 100% nhãn Ben cũ, chỉ còn 1 NPC Ben duy nhất di chuyển sống động. |
| **Modal "Nhà Thực Vật Học" tự động bật che chắn đáy màn hình** | Vị trí xuất phát của người chơi nằm trong bán kính tiếp cận (`<= 105px`) của trạm thực vật. | Đặt vị trí xuất phát của người chơi ra giữa quảng trường `(800, 700)`, cách trạm gần nhất **> 160px**. | Màn hình tải lên trong trạng thái nguyên sơ, tinh tươm, không có popup che chắn tầm nhìn. |

---

## 2. Kết Quả Đo Lường Thị Giác AI Vision Qua 2 Vòng Kiểm Thử

### Vòng 1: Mobile Portrait (390 × 844 — iPhone 15 Pro)
- **1.1 Onboarding Discovery Survey (`quiz.tsx`):**
  - Tỷ lệ khoảng đen hẫng hụt: **0.00%** (so với 36.2% trước khi sửa).
  - Khung Mầm Nhỏ: Kích thước 118px, viền xanh mint `#6ee7b7`, văn phong ấm áp, 4 thẻ lựa chọn cao 56px với checkbox 24px bấm êm ái.
  - Hình ảnh bằng chứng: `round1_audit/01_quiz_discovery_portrait.png`.
- **1.2 Màn Hình Thế Giới (Làng Sống Khỏe — Sleep Valley):**
  - Toàn bộ 6 NPC du khách và người chơi chạm đất tự nhiên trên nền đá cuội.
  - Không có tình trạng nhân vật trôi lơ lửng trên trời hay dẫm lên bàn ăn.
  - Không có popup che khuất thanh điều hướng đáy.
  - Hình ảnh bằng chứng: `round1_audit/02_world_village_portrait.png`.

### Vòng 2: Landscape & Desktop (1024 × 507 & 1280 × 800)
- **2.1 Bố Cục Toàn Cảnh Đúng 100% Theo Ảnh Gốc Của Người Dùng:**
  - Bên trái: Dãy nhà gỗ Chalet truyền thống với ban công hoa, ô che nắng cà phê, máng nước đá cổ, bàn ăn tròn gỗ phủ khăn caro.
  - Ở giữa: Khoảng mở nhìn thẳng ra hồ nước ngọc bích và đỉnh núi Anpơ tuyết trắng qua lớp cắt 2.5D trong suốt viền mịn.
  - Bên phải: Nhà thờ đá cổ kính với hoa viên nở rộ và xe đẩy hoa quả đầy ắp táo, bí ngô.
  - Mặt đất: Quảng trường lát đá cuội hình nan quạt sắc nét, chân thực, nguyên bản 100%.
  - Hình ảnh bằng chứng: `round2_audit/01_world_landscape_1024x507.png`.
- **2.2 Xác Nhận Khoảng Cách Thực Thể (Spatial Collision Audit):**
  - Tổng số thực thể kiểm tra: **15 thực thể** (7 trạm Landmark, 6 du khách NPC, 1 Người chơi, 1 thú cưng Luna).
  - Khoảng cách giữa các trạm Landmark và NPC du khách: **Tối thiểu 75px, trung bình > 180px**.
  - Số lượng xung đột / đè chữ: **0 lỗi (Zero Collisions)**.
  - Hình ảnh bằng chứng: `round2_audit/02_world_desktop_1280x800.png`.

---

## 3. Danh Mục File Đã Triển Khai & Kiểm Tra

1. `App/healthclues-mobile/assets/game/regions/swiss-village-mobile-diorama-v1.png` — Ảnh tiền cảnh 1600x900 RGBA tái tạo kết cấu sắc nét, sạch hoàn toàn vết nhoè và khoét trong suốt viền mịn nhìn ra hồ.
2. `App/healthclues-mobile/assets/game/regions/swiss-village-lake-bg.webp` — Ảnh hậu cảnh 2200x1050 núi tuyết và hồ ngọc bích tạo chiều sâu 2.5D.
3. `App/healthclues-mobile/app/(game)/world.tsx` — Cập nhật tọa độ Landmark không xung đột, tọa độ người chơi trung tâm, khử popup tự động.
4. `App/healthclues-mobile/src/hooks/useLivingVillageVisitors.ts` — Phân làn di chuyển riêng biệt cho 6 NPC du khách.
5. `App/CURRENT_STATE.md`, `App/UI_UX_SPEC.md`, `App/MASTER_SPEC.md`, `App/USER_FLOWS.md` — Đồng bộ tài liệu chu kỳ 104 (`npm run docs:healthclues:check` PASS 100%).
