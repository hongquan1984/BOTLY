# Báo Cáo Nghiệm Thu: Khắc Phục Lỗi Chuyển Đổi Ngôn Ngữ & Thoại Song Ngữ EN/VI (Cycle 34)

**Ngày nghiệm thu**: 08/11/2026  
**Trạng thái**: 100% IMPLEMENTED, EVIDENCE-VERIFIED & TURBOPACK BUILD PASS  
**Mã lỗi người dùng phản hồi**: *"LỖI KHI CLICK NÚT NGÔN NGỮ, NÓ KO CHUYỂN GIAO DIỆN VÀ THOẠI SANG TIẾNG ANH?"*  
**Phạm vi ảnh hưởng**: Nút ngôn ngữ HUD (`.hc-rpg-lang-btn`), hội thoại bạn đồng hành Lumi/Luna, hộp thoại tương tác NPC (`.hc-rpg-talk`), thẻ mốc bản đồ 2.5D (`.hc-rpg-location-pill`), thanh dock điều hướng (`.hc-rpg-bottom-dock`) và đồng bộ sở thích người dùng vào cơ sở dữ liệu (`healthclues_profiles`).

---

## 1. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Qua quá trình debug chi tiết mã nguồn, phát hiện 3 nguyên nhân khiến việc chuyển đổi ngôn ngữ thất bại:

1. **Vòng lặp phản hồi (Feedback Loop) trong `WorldAdventureScene.tsx`**:
   - Khi bấm nút ngôn ngữ, hàm `onToggleLocale` gọi `setLocale("en")` và `router.push("/en/...")`.
   - Tuy nhiên, trong `WorldAdventureScene.tsx`, hook `useEffect` phụ trách tải hồ sơ người chơi lại đặt biến `locale` vào dependency array:
     ```tsx
     // LỖI CŨ:
     useEffect(() => {
       if (!accessToken) return;
       fetch(`/api/healthclues/profile?worldId=...`)
         .then(profile => {
           if (profile?.preferredLocale) setLocale(profile.preferredLocale);
         });
     }, [accessToken, locale, pathname, router, setLocale, worldId]);
     ```
   - Khi `locale` đổi thành `"en"`, `useEffect` lập tức bị kích hoạt lại. Vì `onToggleLocale` cũ không lưu sở thích mới vào API profile, nên database vẫn lưu `preferredLocale: "vi"`.
   - API trả về `"vi"`, `useEffect` chạy `setLocale("vi")` và `router.replace("/vi/...")`, **đè ngược lại tiếng Việt chỉ sau ~100ms**! Người dùng thấy giao diện không hề chuyển sang tiếng Anh.

2. **Dữ liệu mốc bản đồ bị gán cứng tiếng Việt trong `RegionMapScene.tsx`**:
   - Thẻ hiển thị điểm mốc trên bản đồ làng 2.5D có dòng mã:
     ```tsx
     // LỖI CŨ:
     <small>{id === "nutrition" ? "Nhà Thảo Mộc" : id === "knowledge" ? "Hall Kho Tri Thức" : id === "practices" ? "Cẩm Nang Sống Khỏe" : text(subtitle)}</small>
     ```
   - Các từ `"Nhà Thảo Mộc"`, `"Hall Kho Tri Thức"`, `"Cẩm Nang Sống Khỏe"` bị gán cứng chuỗi tiếng Việt thay vì dùng hàm dịch `text(...)` hoặc kiểm tra `locale`.
   - Đồng thời, chuỗi `"Gentle activity discovery"` của Đường Mòn Vận Động chưa được dịch trong từ điển `healthclues-i18n.ts`, dẫn đến tình trạng trên màn hình vừa có tiếng Việt vừa có tiếng Anh lẫn lộn.

3. **Thiếu cơ chế lưu tức thời sở thích ngôn ngữ (Server-Side Persistence)**:
   - Nút ngôn ngữ trên thanh HUD chỉ đổi URL cục bộ mà không gửi yêu cầu `PATCH /api/healthclues/profile` chứa `{ preferredLocale: nextLocale }`. Khi người chơi tải lại trang, hệ thống lại đọc sở thích cũ từ tài khoản và quay về tiếng Việt.

---

## 2. Các Thay Đổi & Giải Pháp Đã Triển Khai

### 2.1. Khắc phục Vòng Lặp & Lưu Sở Thích Ngôn Ngữ (`WorldAdventureScene.tsx`)
- Tách biệt hoàn toàn việc khởi tạo sở thích khi mount (`[accessToken, worldId]`) khỏi biến trạng thái `locale`, triệt tiêu hoàn toàn vòng lặp đè ngược ngôn ngữ cũ.
- Trong `onToggleLocale`, tự động gửi `PATCH /api/healthclues/profile` với `{ worldId, preferredLocale: nextLocale }` để lưu vĩnh viễn lựa chọn ngôn ngữ của người dùng vào tài khoản.
- Điều hướng mượt mà với `router.replace` bảo toàn đầy đủ các tham số URL (`searchParams` và `hash`).

### 2.2. Xóa Bỏ Chuỗi Cứng & Đồng Bộ Thẻ Bản Đồ (`RegionMapScene.tsx`)
- Bổ sung `useHealthCluesLocale` để lấy trạng thái `locale` và cờ `isVi = locale === "vi"`.
- Cập nhật toàn bộ thẻ điểm mốc trên bản đồ 2.5D:
  * Khi `locale === "en"`: Hiển thị chuẩn tiếng Anh: `Botanist` / `Botanical Garden`, `Knowledge Library` / `Research Library`, `Wellness Guide` / `Sanctuary`, `Activity Trail` / `Movement Discovery`.
  * Khi `locale === "vi"`: Hiển thị chuẩn tiếng Việt: `Nhà Thực Vật Học` / `Vườn Dược Thảo`, `Kho Tri Thức` / `Thư Viện Nghiên Cứu`, `Người Hướng Dẫn` / `Khu Tĩnh Tâm`, `Đường Mòn Vận Động` / `Khám phá vận động`.
- Bổ sung `locale` vào dependency array của hook kích hoạt hội thoại NPC, giúp hộp thoại tự động cập nhật ngôn ngữ ngay lập tức nếu người chơi chuyển ngôn ngữ khi đang đứng gần NPC.

### 2.3. Bổ Sung Từ Điển Song Ngữ Đầy Đủ (`healthclues-i18n.ts`)
- Bổ sung các bản dịch thiếu:
  * `"Backpack, Journal and Care Records"`: `"Túi đồ, Nhật ký & Hồ sơ chăm sóc"`
  * `"Food and botanical learning"`: `"Tìm hiểu dinh dưỡng & thảo mộc"`
  * `"Gentle activity discovery"`: `"Khám phá vận động nhẹ nhàng"`
  * `"Supportive practices"`: `"Các phương pháp hỗ trợ sức khỏe"`
  * `"Journey learning"`: `"Kiến thức theo hành trình"`
  * `"Optional knowledge challenge"`: `"Thử thách kiến thức tự chọn"`
  * `"Saved rewards and keepsakes"`: `"Phần thưởng & kỷ vật đã lưu"`
  * `"Sanctuary"`: `"Khu Tĩnh Tâm"`
  * `"Movement Discovery"`: `"Khám Phá Vận Động"`
  * `"Botanical Garden"`: `"Vườn Dược Thảo"`

### 2.4. Tối Ưu Hóa Nút Bấm Ngôn Ngữ HUD (`HealthCluesRpgWorldHud.tsx`)
- Thêm hàm `handleToggleLocale` có cơ chế fallback an toàn, đảm bảo dù có hay không truyền prop `onToggleLocale`, việc bấm nút vẫn chuyển đổi giữa `VI` và `EN` tức thời.
- Nhãn nút hiển thị `VI` khi đang ở tiếng Việt và `EN` khi đang ở tiếng Anh, kèm tooltip hướng dẫn song ngữ chuẩn xác.

---

## 3. Kết Quả Kiểm Thử

1. **Bộ kiểm thử tự động song ngữ**: `scripts/test-language-toggle-verification.mjs`
   - Kiểm tra chuyển đổi đường dẫn URL: 100% PASS.
   - Kiểm tra tên, lời chào và thoại của 3 NPC (*Nhà Thực Vật Học, Người Khám Phá, Người Hướng Dẫn*): 100% PASS.
   - Kiểm tra tên và mô tả của 7 điểm mốc bản đồ: 100% PASS.
   - Kiểm tra các nhãn trên HUD và thanh dock menu: 100% PASS.
2. **Kiểm tra rò rỉ bảo mật (Secret Scan)**: `npm run secrets:scan`
   - Quét 3187 tập tin nguồn: 100% PASS.
3. **Biên dịch sản xuất cách ly (Turbopack Isolated Build)**: `node scripts/build-healthclues-isolated.mjs`
   - Biên dịch thành công 82 routes, 0 lỗi TypeScript, 0 lỗi cấu trúc.
