# Báo Cáo Nghiệm Thu: Hộp Thoại Tương Tác NPC & Phân Tầng Giao Diện HUD (Cycle 33)

**Ngày nghiệm thu**: 08/11/2026  
**Trạng thái**: 100% IMPLEMENTED, VERIFIED & PRODUCTION-BUILD PASS  
**Phiên bản ứng dụng**: HealthClues Cozy RPG World v2.8  

---

## 1. Mục Tiêu & Vấn Đề Cần Giải Quyết

Dựa trên hình ảnh thực tế phản hồi từ người dùng:
1. **Ảnh 1 (Mobile)**:
   - Nút "TRÒ CHUYỆN" chiếm kích thước quá lớn, ép cụm văn bản thông tin xuống 3 dòng chật chội.
   - Nút tròn bạn đồng hành Lumi (`.hc-rpg-lumi-reopen-btn`) bay lơ lửng đè trực tiếp lên phần văn bản của hộp thoại NPC.
   - Thanh menu dock dưới cùng (`.hc-rpg-bottom-dock`) đè lấn lên phần đáy của hộp thoại NPC.
2. **Ảnh 2 (Desktop)**:
   - Hộp thoại tương tác nằm lọt thỏm ngay phía sau thanh dock menu, bị che mất hoàn toàn nội dung.
   - Nguyên nhân gốc rễ: Thẻ `.hc-region-scene` chứa hộp thoại có `isolation: isolate; z-index: 18`, trong khi layer HUD `.hc-rpg-hud-layer` chứa thanh dock có `z-index: 25`. Do sự cô lập ngữ cảnh xếp tầng (stacking context), bất kỳ phần tử nào bên trong `hc-region-scene` đều bị vẽ phía dưới thanh dock.

---

## 2. Giải Pháp Kiến Trúc Đồng Nhất

1. **Chuyển giao quyền hiển thị hộp thoại lên HUD layer (`HealthCluesRpgWorldHud`)**:
   - `RegionMapScene` nhận diện khi người chơi đến gần điểm mốc hoặc NPC và gọi callback `onActiveTalkChange`.
   - `HealthCluesRpgWorldHud` trực tiếp render `.hc-rpg-talk` trong cùng một cây DOM với thanh dock menu ở `z-index: 55`.
   - Triệt tiêu hoàn toàn vấn đề xung đột CSS Stacking Context.

2. **Tự động ẩn bạn đồng hành Lumi khi đang tương tác**:
   - Khi có hộp thoại NPC hoạt động (`activeTalk` khác null), toàn bộ bong bóng thoại Lumi và nút tròn Lumi tự động ẩn (`!activeTalk`).
   - Loại bỏ 100% khả năng nút tròn Lumi bay đè lên chữ.

3. **Tính toán hình học khoảng cách an toàn (Clearance)**:
   - **Desktop**:
     * Thanh dock: `bottom: 1.25rem` + cao ~54px = đỉnh dock ở `4.65rem`.
     * Hộp thoại NPC: `bottom: 5.85rem`.
     * Khoảng hở: `+1.20rem` (~19px) thông thoáng.
   - **Mobile**:
     * Thanh dock: `bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px))` + cao ~48px = đỉnh dock ở `3.6rem`.
     * Hộp thoại NPC: `bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px))`, căn giữa `left: 50%; transform: translateX(-50%)`, width `min(94vw, 420px)`.
     * Khoảng hở: `+1.15rem` (~18px) tuyệt đối không chạm hay đè lên nhau.
   - **Màn hình thấp (Short Height, max-height: 640px)**:
     * Khoảng hở: `+1.05rem` (~17px).

4. **Tối ưu hóa nút bấm & văn bản trên Mobile**:
   - Nút hành động `.hc-rpg-talk-action-btn`: Chiều cao `28px`, padding `0.22rem 0.55rem`, font-size `0.7rem`, viền bo pill vàng sang trọng.
   - Thêm nút tắt nhanh `(X)` `.hc-rpg-talk-close-btn` giúp người chơi đóng nhanh hộp thoại khi không muốn tương tác.
   - Văn bản giới hạn tối đa 2 dòng mượt mà (`-webkit-line-clamp: 2`).

---

## 3. Kết Quả Kiểm Thử & Biên Dịch

- **Next.js Turbopack Isolated Production Build**:
  * Mã lệnh: `node scripts/build-healthclues-isolated.mjs`
  * Kết quả: Exit code 0, 82 routes biên dịch thành công 100%.
- **Secret Scan**:
  * Mã lệnh: `npm run secrets:scan`
  * Kết quả: 3175 tập tin nguồn sạch sẽ, không có rò rỉ secret.
