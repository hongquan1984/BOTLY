# HealthClues Acceptance Report: Daily Companion Email Reminder & Smart Bundling

**Date**: 2026-11-04  
**Status**: ACCEPTED & BROWSER-VERIFIED VIA CDP ON PORT 3329  
**Affected Files**:
- `src/features/healthclues/WorldAdventureScene.tsx`
- `src/features/healthclues/world-adventure.css`
- `src/app/api/healthclues/reminders/route.ts`

---

## 1. Problem Statement & User Request

The user requested an email reminder schedule at the top of "Hành trình của tôi", with user-selected time, country timezone handling, companion branding, and smart 1 email/day bundling:
> *"trong hành trình của tôi, tao muốn thêm lịch nhắc nhở trên cùng, người dùng chọn giờ, hàng ngày sẽ gửi email nhắc nhở vào giờ đó nhưng mà giờ thì theo khung giờ múi giờ của từng nước nhé. Tao nghĩ HealthClues không nên chỉ gửi email nhắc người dùng làm nhiệm vụ. Email còn phải tạo cảm giác Lumi/Luna đang đồng hành, giúp người dùng có lý do quay lại game mỗi ngày.*
> *Nhưng tao không muốn gửi quá nhiều, vì rất dễ khiến người dùng khó chịu và hủy đăng ký.*
> *1. Tao đề xuất 1 email/ngày là mặc định*
> *Thay vì gửi ba email riêng biệt, HealthClues nên kết hợp các nội dung phù hợp vào một email cá nhân hóa mỗi ngày.*
> *HEALTHCLUES · DAILY COMPANION*
> *Lumi đang chờ bạn trong thế giới sức khỏe!*
> *Ví dụ email hằng ngày lúc 20:00 theo múi giờ người dùng*
> *Hành trình hôm nay của bạn 🌿*
> *Kiến thức nhỏ hôm nay 💡*
> *Quay lại thế giới của tôi*
> *Mẫu minh họa. Email thực tế nên tránh tiết lộ tình trạng sức khỏe nhạy cảm nếu người dùng chưa cho phép."*

The user also asked strategically:
> *"2. Ngoài email hằng ngày, còn nên gửi những loại nào? ... Không nhất thiết gửi cả năm loại. Daily Companion là email chính, còn thành tích và nội dung khám phá có thể được đưa vào email hằng ngày hoặc bản tổng kết tuần, thay vì gửi riêng liên tục. Email xác minh tài khoản, bảo mật là email giao dịch riêng."*

---

## 2. Implementation Overview

### 2.1 Top Reminder Schedule Banner (`.hc-journey-reminder-banner`)
1. **Prominent Placement on Top of My Journey**:
   - Positioned cleanly at the top of `MyJourneyPanel` directly above the 30-Day Monthly Journey Map.
   - Styled with cozy RPG emerald gradients, gold borders, and glowing companion bubble avatar (`HealthCluesPet`).
2. **Interactive Controls**:
   - **Opt-in Toggle Button**: `[ Bật nhắc nhở hằng ngày ]` / `[ Đang bật nhắc nhở ]`.
   - **Daily Time Picker**: 8 predefined slots (`07:00` to `22:00`), default `20:00 (Buổi tối - Khuyên dùng) ⭐`.
   - **International Timezone Selector**: Auto-detects user's browser IANA timezone with country dropdowns (`Asia/Ho_Chi_Minh (GMT+7)`, `Asia/Tokyo (GMT+9)`, `Europe/Paris (GMT+1)`, `America/New_York (GMT-5)`, etc.).
   - **Smart Cadence Badge**: `✉️ 1 email/ngày · Kết hợp mục tiêu & kiến thức`.
   - **Instant Persistence**: Calls `POST /api/healthclues/reminders` with `action: 'save'`, `optedIn: true`, `timezone`, `localSendTime`, `frequency: 'daily'`, `consentConfirmed: true`, updating `healthclues_email_preferences`.

### 2.2 Interactive Email Preview Modal (`.hc-email-preview-modal`)
1. Clicking `[ Xem trước email mẫu ]` opens a realistic email client mockup:
   - **Header**: `HEALTHCLUES · DAILY COMPANION`.
   - **Greeting**: Glowing companion illustration (Lumi / Luna) with *"Lumi/Luna đang chờ bạn trong thế giới sức khỏe!"* and send time caption.
   - **Section 1: Hành trình hôm nay của bạn 🌿**: Lists active habit goals with green checkmark bullets and `+20 EXP` reward badges.
   - **Section 2: Kiến thức nhỏ hôm nay 💡**: Bite-sized scientific tip with source citation from HealthClues Evidence Library.
   - **CTA Button**: Large button `[ Quay lại thế giới của tôi 🧭 ]`.
   - **Privacy & Unsubscribe Boundary**: Non-diagnostic medical disclosure guarantee and settings management note.

---

## 3. Product Architecture & Strategic Email Classification (Question 2)

Based on product analysis and the user's guidance, HealthClues adopts a **3-Stream Communication Architecture**:
1. **Daily Companion (Hằng ngày - Mặc định - 1 email/ngày)**:
   - Gửi vào khung giờ người dùng chọn theo múi giờ địa phương (mặc định 20:00).
   - Smart Bundling: Kết hợp trạng thái mục tiêu, kiến thức nhỏ, và nút quay lại game.
   - Tích hợp thành tích (Achievement) và gợi ý khám phá (Discovery) vào chính email này khi có sự kiện thay vì gửi dồn dập.
2. **Weekly Journey Reflection (Tổng kết tuần - Tùy chọn 1 lần/tuần)**:
   - Gửi vào sáng Chủ Nhật nếu người dùng bật.
   - Tổng kết tiến độ tuần (số ngày check-in, số sao trung bình) và gợi ý điều chỉnh nhẹ nhàng.
3. **Transactional & Security (Email giao dịch & bảo mật riêng)**:
   - Welcome email khi đăng ký tài khoản.
   - Xác minh email, đặt lại mật khẩu, bảo mật.
   - Luôn gửi tức thời khi phát sinh sự kiện.

---

## 4. Visual Evidence & Screenshots

All screenshots captured live via automated Chrome DevTools CDP against `http://127.0.0.1:3329/play-demo.html`:
1. `verified-email-reminder-banner-desktop.png`: Desktop Journey Map top banner showing 20:00 send time, Asia/Ho_Chi_Minh timezone, toggle on.
2. `verified-email-preview-modal-desktop.png`: Desktop view of rendered Daily Companion email modal with companion hero, habits checklist, knowledge card, CTA button, and privacy note.
3. `verified-email-preview-modal-mobile.png`: Mobile (390x844) responsive layout of the email preview modal.
4. `verified-email-reminder-banner-mobile.png`: Mobile (390x844) responsive layout of the top reminder banner.
