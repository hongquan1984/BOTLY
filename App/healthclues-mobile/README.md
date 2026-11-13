# HealthClues Mobile App — React Native & Expo

Ứng dụng di động độc lập của **HealthClues**, xây dựng bằng **React Native + Expo SDK 52 + TypeScript + Expo Router**, kết nối chung cơ sở dữ liệu và hệ thống xác thực Supabase với Web Next.js.

---

## 1. Nguyên tắc cốt lõi: Một Hệ Sinh Thái — Nhiều Thiết Bị

- **Chung Supabase Auth**: Người chơi dùng cùng 1 tài khoản (email / password hoặc magic link) để đăng nhập trên cả Web và Mobile.
- **Chung Dữ liệu World & Tiến trình**:
  - Khi check-in thói quen trên Mobile, Web tự động đồng bộ.
  - EXP và cấp độ được tính toán và bảo vệ bằng Stored Procedure phía máy chủ Supabase (`healthclues_save_daily_checkin_v1`), đảm bảo **Idempotency tuyệt đối (không bị cộng trùng EXP)**.
  - Túi đồ 3 slot trang bị nhiệm vụ và bộ sưu tập thảo mộc đồng bộ 100%.

---

## 2. Cấu trúc thư mục

```text
App/healthclues-mobile/
├── app/
│   ├── _layout.tsx           # Root layout với SafeAreaProvider & Status bar
│   ├── index.tsx             # Auth gate điều hướng phiên đăng nhập
│   ├── (auth)/
│   │   ├── _layout.tsx       # Stack điều hướng Auth
│   │   ├── login.tsx         # Màn hình Đăng nhập (Email/Pass & Magic Link)
│   │   └── register.tsx      # Màn hình Đăng ký tài khoản mới
│   └── (game)/
│       ├── _layout.tsx       # RPG Bottom Dock HUD với 5 Tabs
│       ├── world.tsx         # Bản đồ 2D tương tác NPC & Thú cưng Lumi/Luna
│       ├── journey.tsx       # Hành trình sống khỏe, mục tiêu Active & Saved
│       ├── daily-care.tsx    # Điểm danh thói quen hằng ngày & nhận EXP
│       ├── inventory.tsx     # Túi đồ 3 slot trang bị & Thư viện thảo mộc
│       └── profile.tsx       # Hồ sơ cá nhân, đổi ngôn ngữ & xóa tài khoản
├── src/
│   ├── theme/                # Bảng màu Cozy Fantasy RPG, typography, spacing
│   ├── localization/         # Bộ từ điển song ngữ Tiếng Việt - English
│   ├── services/             # API Client, Supabase GoTrue Auth, HealthClues APIs
│   ├── hooks/                # useAuth, useWorld
│   └── components/           # TopHud (EXP, Level, Currencies, Online)
├── assets/
│   ├── game/
│   │   ├── regions/          # Sleep Valley, HealthClues Realm, NPCs
│   │   ├── characters/       # Chibi Adventurer, Anna, Walk cycle
│   │   └── ui/               # Lumi Fox, Icons
│   └── icon.png, splash-icon.png
├── app.json
├── tsconfig.json
└── package.json
```

---

## 3. Cấu hình biến môi trường (`.env`)

Tạo file `.env` tại `App/healthclues-mobile/.env`:

```env
# Chạy trên Android Emulator (10.0.2.2 trỏ về localhost máy tính)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3329
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Hoặc khi test máy thật qua mạng LAN WiFi:
# EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3329
# EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.xxx:54321

# Hoặc khi kết nối Cloud Production:
# EXPO_PUBLIC_API_URL=https://www.botly.vn
# EXPO_PUBLIC_SUPABASE_URL=https://rswmadukvegraxfcdbcb.supabase.co
```

---

## 4. Hướng dẫn chạy & kiểm thử

### Kiểm tra TypeScript:
```bash
npx tsc --noEmit
```

### Khởi động môi trường phát triển Expo:
```bash
npx expo start
```
- Bấm `a` để mở trên Android Emulator hoặc quét mã QR bằng app **Expo Go** trên điện thoại Android thật.
- Bấm `i` để mở trên iOS Simulator (nếu chạy trên macOS).

### Build APK Android nội bộ:
```bash
npx eas build -p android --profile preview
```
