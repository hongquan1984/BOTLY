# HealthClues Landing Page V1 Acceptance Report
**Date:** 2026-11-08  
**Scope:** Integration of the Premium Cozy Fantasy RPG & Swiss Alpine Wellness Landing Page into Next.js App Router (`/` and `/landing`).

---

## 1. Executive Summary
- **Target Deliverable:** High-converting, visual-first RPG Wellness Landing Page based on Master Prompt V1 specifications.
- **Routes Served in Next.js:**
  - Primary Homepage: `/` (`src/app/page.tsx`) — Bảo toàn 100% cổng thông tin `WellnessHome` phục vụ bài viết, ebook và hướng dẫn sức khỏe.
  - Official Dedicated Landing Route: `/healthclues` (`src/app/healthclues/page.tsx`) — Phục vụ trang đích game RPG HealthClues (`HealthCluesLandingPage`).
  - Friendly Alias Redirects: `/healthclue` và `/landing` tự động chuyển hướng 307 về `/healthclues`.
  - Isolated Local Prototype: `http://localhost:3360` (`D:\botly\LADIPAGE`) với no-cache header.
- **Primary Game Route Integration:** Direct routing to authentic onboarding route `/play` (`src/app/play/page.tsx`).
- **Static Assets Staged:** Staged to `public/landing/` with high-resolution Swiss Alpine key art, mobile-optimized visual crop, 7 doors artwork, and chibi companion sprites.

---

## 2. Key Architecture & Features

### 2.1 Hero Section
- **Positioning:** Clear RPG Wellness Adventure in Swiss Alpine setting, eliminating any impression of a generic AI chat assistant.
- **Eyebrow:** `HEALTHCLUES · CUỘC PHIÊU LƯU SỨC KHỎE`.
- **Headline:**
  - Gold: `Vượt qua nỗi lo sức khỏe.`
  - White: `Mở khóa hành trình của bạn!`
- **Description:** Concise 3-line copy without long paragraphs.
- **Mobile Dedicated Visual Card:**
  - Displays smiling adventurer and glowing white spirit fox Lumi in front of Swiss Alpine chalets, waterfalls, and mountain castle.
  - Zero occlusion by text boxes.
  - Perfectly positioned above-the-fold (fits within 812px height viewports).
- **Primary CTA:** `🎮 Bắt đầu cuộc phiêu lưu →` (large gold button with shine effect, routes to `/play`).
- **3 Compact RPG Pillars:**
  - 🧭 Khám phá — Cơ thể & kiến thức
  - 📜 Nhiệm vụ — Phù hợp với bạn
  - 🎁 Phần thưởng — Thành tựu trong game
- **Microcopy:** `⚡ Khởi đầu nhẹ nhàng · Tự chọn mục tiêu · Không áp lực phải hoàn hảo`.

### 2.2 3D Revolving Carousel (7 Cánh Cửa)
- CoverFlow 3D carousel with dynamic perspective transforms (`rotateY`, `translateZ`, `scale`).
- Automatic rotation every 3 seconds with auto-pause on user interaction and 3s idle resume.
- Touch-swipe support on mobile and keyboard arrow keys on desktop.
- 7 distinct realms: Phòng Tuyến Sức Khỏe, Dược Liệu & Bằng Chứng, Khoa Học Sự Sống, Vận Động Vi Mô, Thung Lũng Giấc Ngủ, Thế Giới Của Bạn, Làng Đồng Hành.

### 2.3 5-Step Journey Pipeline (Giải quyết triệt để lỗi cuộn ngang)
- **Vấn đề trước đây:** Container 5 bước dùng hàng ngang `overflow-x: auto`, gây thanh cuộn ngang khó nhìn trên điện thoại và máy tính bảng ("đoạn này bị cuộn").
- **Kiến trúc mới:**
  - **Màn hình <= 1024px (Mobile & Tablet):** Tự động chuyển thành Vertical Quest Roadmap (`flex-direction: column`). Mỗi cột mốc là một thẻ riêng rộng từ 296px–646px, huy hiệu `01`–`05`, biểu tượng và mũi tên dọc liên kết. Ép cứng `overflow-x: hidden !important;`, cam kết 100% không cuộn ngang.
  - **Màn hình > 1024px (Desktop):** Hiển thị thanh tiến trình 5 bước nằm ngang cân đối, chiều cao đồng đều, không tràn viền.
- **Cột mốc 5:** `Không gian mơ ước và cộng đồng`.

### 2.4 Medical Safety Compliance
- Prominent disclaimer in footer: Game companion for lifestyle habits, not a diagnostic or curative medical software.

---

## 3. Automated & Browser Verification Evidence
- Kiểm thử tự động bằng Chrome DevTools CDP trên 6 độ phân giải chuẩn của Vercel Production (`https://www.botly.vn/healthclues`):
  1. Desktop 1440 × 900: `flexDirection: row`, `isHorizontallyScrolling: false` (`PASS`)
  2. Tablet 1024 × 768: `flexDirection: column`, `isHorizontallyScrolling: false` (`PASS`)
  3. Tablet 820 × 1180: `flexDirection: column`, `isHorizontallyScrolling: false` (`PASS`)
  4. Mobile 430 × 932: `flexDirection: column`, `isHorizontallyScrolling: false` (`PASS`)
  5. Mobile 390 × 844: `flexDirection: column`, `isHorizontallyScrolling: false` (`PASS`)
  6. Mobile 375 × 812: `flexDirection: column`, `isHorizontallyScrolling: false` (`PASS`)
- CTA verification: `Runtime.evaluate` confirmed CTA button exists, renders with computed display `flex`, and links to authentic `/play` route.

---

## 4. File Manifest
- `src/components/healthclues/HealthCluesLandingPage.tsx`: React client component with 3D carousel and particle canvas.
- `src/components/healthclues/healthclues-landing.css`: Scoped stylesheet for the landing page.
- `src/app/landing/page.tsx`: Dedicated App Router route for `/landing`.
- `src/app/page.tsx`: Updated root route to render `HealthCluesLandingPage`.
- `public/landing/*`: High-res image assets.
- `D:\botly\LADIPAGE/*`: Independent standalone local test server and preview suite.

---

## 5. 2026-11-09 — Cycle 45: Vietnamese Diacritics & 3D Carousel Mobile Pass

### 5.1 Lỗi Tách Dấu Tiếng Việt (Diacritics Separation Bug)
- **Hiện tượng**: Tiêu đề thẻ 3D bị tách rời dấu: `Đô ` ng Hành Chiê ´ n Thă ´ ng Bệnh Tật`.
- **Nguyên nhân**: Font `Playfair Display` thiếu các glyph precomposed cho nguyên âm kép tiếng Việt (`ồ`, `ế`, `ắ`), khiến engine hệ điều hành tách thành chữ cái gốc và dấu rời có khoảng cách.
- **Khắc phục**: Thay thế `--font-serif` bằng `Plus Jakarta Sans` (`subsets: ["vietnamese"]`). Đảm bảo 100% nguyên âm tiếng Việt hiển thị liền mạch, sắc nét và không bao giờ bị tách dấu.

### 5.2 Lỗi Lệch Phải Thẻ 3D Trên Mobile Safari/WebKit
- **Hiện tượng**: Thẻ active bị lệch sang mép phải, chữ `"Thắng"` bị cắt mất, lộ lề trái lớn.
- **Nguyên nhân**: `.carousel-3d-track` dùng `display: flex; justify-content: center;`. WebKit định vị phần tử con `position: absolute;` tại static position của flex (`left: 50% = 195px`), khiến thẻ rộng 270px kéo dài từ 195px đến 465px.
- **Khắc phục**: Bỏ `display: flex` trên track. Cố định thẻ bằng tọa độ tuyệt đối trung tâm: `top: 50%; left: 50%; margin-top: -175px; margin-left: -135px;` (mobile). Thẻ active luôn nằm tại tâm toán học: $left = 60px, right = 330px$ trên viewport 390px.
- **Kiểm thử**: Isolated build thành công 100%, 0 lỗi Turbopack, 0 horizontal scrollbar.

### 5.3 Thu Gọn Header Mobile 3D Carousel (Cycle 46)
- **Vấn đề**: Tiêu đề to 1.45rem ngắt 4 dòng và mô tả dài chiếm ~230px màn hình mobile, đẩy các thẻ 3D xuống dưới nếp gấp.
- **Khắc phục**:
  - Giảm font-size tiêu đề mobile xuống 1.05rem (16.8px), ẩn `<br>` ép dòng, gom gọn còn 2 dòng.
  - Tinh giản mô tả thành: *"Vuốt ngang để khám phá cánh cửa của bạn:"* (1 dòng).
  - Giảm padding section từ 40px xuống 16px.
  - Chiều cao header giảm từ 230px xuống 91px (tiết kiệm ~140px). Thẻ 3D xuất hiện ngay trong tầm mắt (`activeCardBottom = 472px <= 844px`).
- **Production Deployment**: Vercel `dpl_CPvcwiw9q7Kz29iaJ13BXZcRkeTa` (READY).
