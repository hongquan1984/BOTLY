# PHASE 0 — DISCOVERY & ARCHITECTURE AUDIT: HEALTHCLUES MOBILE APP

**Date:** 2026-11-09  
**Target Platform:** Android (Priority 1), iOS-ready (Priority 2)  
**Framework:** React Native + Expo SDK 52 + TypeScript + Expo Router  
**Backend:** Shared Next.js HealthClues APIs + Supabase (PostgreSQL / GoTrue / RLS / Realtime)

---

## 1. Hệ thống & Kiến trúc hiện tại

### A. Next.js Web Application
- **Vị trí source web:** `src/app/play`, `src/components/healthclues/`, `src/features/healthclues/`.
- **Cơ chế xác thực API:** `src/features/healthclues/server.ts` sử dụng hàm `requireUser(request)` kiểm tra trực tiếp header `Authorization: Bearer <access_token>`.
  - **Khẳng định kiến trúc:** Các API `/api/healthclues/*` **KHÔNG** phụ thuộc vào browser-only cookie! Toàn bộ endpoint chấp nhận Bearer JWT token của Supabase GoTrue Auth.
- **Trạng thái Session phía Web Client:** `src/lib/wellness-cloud.ts` lưu `CloudSession` vào `localStorage` (key `botly-cloud-session`). Trên Mobile React Native, cơ chế này được thay thế bằng `@react-native-async-storage/async-storage` hoặc `expo-secure-store`, đảm bảo 100% độc lập và không phụ thuộc web.

### B. Cơ sở dữ liệu & Quy tắc Idempotency (Supabase)
- **Tài khoản người dùng:** GoTrue User (`auth.users`), liên kết `healthclues_profiles`.
- **World & Journey State:** 
  - `healthclues_wellness_worlds` (Mỗi user sở hữu 1 world duy nhất, có timezone, title, creation date).
  - `healthclues_branches` & `healthclues_journeys` (Hành trình Gout, Giấc ngủ, Sức khỏe đường ruột...).
  - `healthclues_toolkit_entries` (Kho 3 slot trang bị Active).
  - `healthclues_toolkit_collection` (Thư viện thẻ đã lưu).
- **Daily Care & EXP:**
  - Điểm danh lưu qua PostgreSQL RPC `healthclues_save_daily_checkin_v1(p_user_id, p_world_id, p_local_date, p_timezone, p_usage, p_note, p_reflection)`.
  - Stored procedure này đảm bảo **Idempotency tuyệt đối**: cùng 1 ngày, cùng 1 hành động check-in sẽ không bao giờ bị cộng EXP 2 lần!
  - `healthclues_xp_ledger` lưu chi tiết lịch sử EXP.

---

## 2. Phân loại thành phần (Component Matrix)

| Thành phần | Phân loại | Giải pháp cho Mobile App |
| :--- | :--- | :--- |
| **Supabase Auth (Login/Signup/Session)** | **REUSE API** | Kết nối trực tiếp GoTrue Auth REST qua cùng Supabase URL & Anon Key. Lưu session vào AsyncStorage. |
| **Lấy dữ liệu World (`/api/healthclues/world`)** | **REUSE API** | Mobile gọi HTTP GET kèm Bearer Token. Trả về World, Quests, 3 Slots, EXP, Currencies, Check-ins. |
| **Điểm danh Daily Care (`/api/healthclues/world/checkin`)** | **REUSE API** | Mobile gọi HTTP POST kèm payload `{ worldId, localDate, timezone, usages, note }`. Đồng bộ ngay với web. |
| **Trang bị / Đổi slot túi đồ (`/api/healthclues/world/toolkit`)** | **REUSE API** | Gọi POST / DELETE tương tự web. Tự động kiểm tra slot 1, 2, 3. |
| **Lưu / Bỏ lưu thảo mộc (`/api/healthclues/world/collection`)** | **REUSE API** | Gọi POST / DELETE với catalogItemId. |
| **Cá nhân hóa & Profile (`/api/healthclues/profile`)** | **REUSE API** | Đọc & cập nhật nickname, avatar, preferredLocale. |
| **Domain Validation & Rules** | **REUSE SHARED LOGIC** | Port các rule kiểm tra slot, trạng thái thói quen (`done`, `not_yet`, `skipped`), định dạng ngày từ `toolkit-domain.ts` & `daily-care-domain.ts`. |
| **Bản địa hóa (Tiếng Việt / English)** | **REUSE SHARED LOGIC** | Đồng bộ bộ từ điển song ngữ chuẩn từ `healthclues-i18n.ts`. |
| **Giao diện Người dùng (HUD, My Journey, Daily Care, Profile)** | **NATIVE UI** | Xây dựng Native Components (React Native + Safe Area + Theme Cozy Fantasy RPG). Tối ưu vuốt chạm mobile. |
| **Bản đồ RPG Khám phá Vùng Đất** | **GAME RENDERER** | Native 2D Map Canvas (Image/Animated/GestureHandler) hiển thị Sleep Valley & HealthClues Realm, nhân vật Chibi và NPC tương tác. |
| **Swiss Alpine Chalet Wellness Home** | **FUTURE / V2** | Giai đoạn 1 tập trung M1 - M3 (Auth, Journey, Daily Care, RPG Map). Màn hình Chalet sẽ được đưa vào ở Milestone M4. |
| **6 Vùng Overworld Chưa Mở** | **NOT READY** | Giữ nhãn "Coming Soon" đúng theo đặc tả hệ thống. |

---

## 3. Hợp đồng API giữa Mobile và Backend

* **Base URL**: Cấu hình linh hoạt qua biến môi trường `EXPO_PUBLIC_API_URL` (local dev: `http://10.0.2.2:3329` cho Android Emulator hoặc IP LAN máy tính; production: `https://www.botly.vn`).
* **Supabase URL**: `EXPO_PUBLIC_SUPABASE_URL`.
* **Headers chuẩn**:
  ```typescript
  {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    "apikey": anonKey
  }
  ```
* **Không lưu trữ Secret Key**: Không nhúng `service_role_key` vào Mobile App. Mọi quyền truy cập tuân thủ Supabase RLS.
