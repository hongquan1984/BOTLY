# Báo Cáo Triển Khai: Banner Toàn Hệ Thống HealthClues & Khôi Phục Trang Thống Kê Quản Trị

**Thời gian thực hiện**: 2026-11-09  
**Mục tiêu**:
1. Khôi phục quyền truy cập trang thống kê `/admin/thong-ke` do thiếu token cấu hình môi trường.
2. Thiết kế và bố trí Banner nhận diện thương hiệu game HealthClues chuyên nghiệp trên toàn bộ các trang, điều hướng người dùng tới Landing Page `/healthclues` trước khi vào game `/play`.

---

## 1. Khắc Phục Trang Thống Kê Quản Trị (`/admin/thong-ke`)
- **Phân tích nguyên nhân**:
  - `src/app/api/admin/analytics/route.ts` yêu cầu biến môi trường `process.env.EBOOK_ADMIN_TOKEN`.
  - Trên Vercel Production và `.env.local`, biến này chưa được khởi tạo, khiến API luôn trả về HTTP 503 (`Admin analytics is not configured`).
  - Giao diện đăng nhập không hiển thị phản hồi lỗi rõ ràng và không cho phép người dùng đăng xuất / reset session.
- **Giải pháp**:
  - Đã thêm biến bí mật `EBOOK_ADMIN_TOKEN` lên môi trường Production của Vercel và `.env.local`.
  - Nâng cấp giao diện đăng nhập tại `src/app/admin/thong-ke/page.tsx`:
    - Thông báo lỗi chi tiết khi token không đúng (HTTP 401) hoặc máy chủ chưa sẵn sàng.
    - Tự động xóa token lưu trong session khi gặp lỗi xác thực 401 để người dùng nhập lại ngay.
    - Bổ sung nút **Đăng xuất** tiện lợi trên thanh công cụ Header quản trị.

---

## 2. Bố Trí Banner Game HealthClues Toàn Hệ Thống
- **Component**: `src/components/layout/HealthCluesBanner.tsx`
- **Tích hợp**: `src/app/layout.tsx` (hiển thị trên tất cả các trang công khai).
- **Quy tắc hiển thị thông minh**:
  - Tự động ẩn hoàn toàn khi người dùng đang ở trong game (`/play`, `/vi/wellness/healthclues/*`, `/en/wellness/healthclues/*`), Landing Page `/healthclues`, hoặc các trang quản trị `/admin/*`. Đảm bảo trải nghiệm chơi game không bị bất kỳ banner nào che khuất hay làm phiền.
  - Hỗ trợ nút đóng (Dismiss) lưu trạng thái theo phiên làm việc (`sessionStorage`).
- **Giao diện & Mỹ thuật**:
  - Tông màu: Xanh ngọc lục bảo (Emerald) & Vàng kim (Amber) đậm chất Thần thoại Alpine Thụy Sĩ.
  - Linh vật: Icon Bé Cáo Lumi phát sáng cùng huy hiệu `✨ GAME MỚI`.
  - Nút kêu gọi hành động (CTA): `Khám phá ngay →` trỏ chuẩn xác về `/healthclues` (Landing Page).
- **Hỗ trợ bổ sung**:
  - Thêm thẻ Banner nổi bật trên Trang Chủ (`src/components/wellness/PortalLanding.tsx`).
  - Bổ sung mục `HealthClues 🎮` trên thanh điều hướng Menu (`src/data/wellness.ts`).
