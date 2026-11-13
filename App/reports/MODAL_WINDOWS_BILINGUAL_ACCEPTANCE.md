# HealthClues Modal Windows & Panels Bilingual Localization Acceptance Report (Cycle 36)

## 1. Context & User Evidence
- **User Attachment / Screenshot**:
  The user provided a live screenshot of the **Reminder Settings modal window** in HealthClues where the outer header was in English (`Reminder Settings`), but the inner modal card was completely hardcoded in Vietnamese:
  - Header: `"HEALTHCLUES · LUMI NHẮC LỊCH"`, `"Lumi đồng hành nhắc nhở bạn mỗi ngày"`
  - Description: `"Mặc định gửi 1 email ấm áp vào mỗi buổi sáng. Đồng hành nhắc nhở thói quen hôm nay và mời bạn điểm danh ngày hôm qua, nhẹ nhàng và không gây phiền toái."`
  - Toggle: `"🔔 Đang bật nhắc nhở hằng ngày"`
  - Labels & Options: `"Giờ gửi hằng ngày"`, `"07:30 - Buổi sáng (Khuyên dùng: Nhắc thói quen & check-in hôm qua) ⭐"`, `"Múi giờ của bạn"`, `"Asia/Ho_Chi_Minh (Việt Nam UTC+7)"`
  - Actions & Badges: `"👁 Xem trước thư mẫu bạn đồng hành"`, `"Xong & Đóng cửa sổ"`, `"✨ 1 email/ngày · Kết hợp mục tiêu & kiến thức · Tự do bật tắt bất kỳ lúc nào"`
- **User Request**: `"KIỂM TRA CÁC CỬA SỐ, SANG TIẾNG ANH VẪN BỊ LẪN TIẾNG VIỆT"` (Inspect all windows/modals, switching to English still leaves Vietnamese mixed in).

## 2. Root Cause Analysis
1. **Inlined `DailyReminderPanel` in `WorldAdventureScene.tsx`**:
   `WorldAdventureScene.tsx` inlines `DailyReminderPanel` (rendered when `panel === "reminder"`). While `useHealthCluesLocale` was hooked in, all JSX literals, option descriptions, preview templates, and button texts were hardcoded Vietnamese literals.
2. **`CompanionAddHabitModal`**:
   The interactive companion add-habit dialog had hardcoded Vietnamese pill suggestions (`"Thở sâu thư giãn 3 phút"`, `"Uống 1 cốc nước ấm"`, `"Tắt màn hình trước khi ngủ"`, `"Đi bộ nhẹ 15 phút"`), modal tag (`"Trợ lý đồng hành"`), and celebration messages.
3. **`userName` Fallback**:
   Line 551 defaulted `userName` to `"anh Quân"` instead of respecting `locale === "vi" ? "anh Quân" : "Wayfinder"`, causing English users to be addressed in Vietnamese.
4. **Day Detail Popover & Private Checkin Parser**:
   Popover messages in `MyJourneyPanel` had hardcoded Vietnamese strings for reason headers and success status. Note serialization in `DailyCheckinDialog.tsx` also generated Vietnamese-only tag formats.
5. **Autonomous Village Visitors (`AmbientVillageVisitors.tsx`)**:
   Speech bubbles for the 5 chibi characters (Anna, Leo, Mia, Ben, Lily) only drew from a Vietnamese quotes pool.

## 3. Implemented Changes
1. **`src/features/healthclues/WorldAdventureScene.tsx`**:
   - Localized `DailyReminderPanel`:
     - Kicker: `HEALTHCLUES · ${pet} ${locale === "vi" ? "NHẮC LỊCH" : "REMINDERS"}`
     - Title: `${pet} ${locale === "vi" ? "đồng hành nhắc nhở bạn mỗi ngày" : "daily reminder companion"}`
     - Subtitle, toggle button (`🔔 Daily reminder is ON` / `🔕 Daily reminder is OFF`), labels, dropdown time/timezone options, action buttons, and footer badges.
   - Localized `showEmailPreview` modal dialog:
     - Header title, close button aria-label, email metadata (`Subject:`, `From:`, `Send time:`), hero title, body paragraphs, knowledge gift, sign-off, and CTA button.
   - Localized `CompanionAddHabitModal`:
     - Badge tag (`Companion Guide`), quick 1-tap suggestion pills (breathing, water, screens, walk), greeting bubble, input labels/placeholders, success celebration card, and done button.
   - Localized `userName` fallback:
     - `const userName = nickname?.trim() || (locale === "vi" ? "anh Quân" : "Wayfinder");`
   - Localized Day Detail Popover in `MyJourneyPanel`:
     - Today prompt, completed state notes, uncompleted reason header, missed day notes.
   - Localized `nicknameOpen` and `regionChoice` dialogs:
     - Prompts, labels, buttons, and enter world CTA.
   - Updated `parseCheckinStars`:
     - Supports both English (`[Daily rating: X/5 stars]`, `[Goal status: ...]`, `Reason not completed:`) and Vietnamese formats.
2. **`src/features/healthclues/AmbientVillageVisitors.tsx`**:
   - Added `CHIBI_GREETINGS_EN` covering all 5 chibi visitors across 6 interaction contexts (`npcBotanist`, `npcWellness`, `npcLibrary`, `plaza`, `meetPeer`, `playerClick`).
   - Integrated `getVisitorQuotes(cfg, category, locale)` ensuring speech bubbles match player language.
3. **`src/features/healthclues/OnlineAdventurers.tsx`**:
   - Updated close button aria-label to bilingual: `locale === "vi" ? "Đóng" : "Close"`.
4. **`src/features/healthclues/ReminderPreferencesPanel.tsx`**:
   - Localized timezone options cleanly in English when `locale === "en"`.
5. **`src/features/healthclues/DailyCheckinDialog.tsx`**:
   - Bilingual serialization for `note_private` tags based on active locale.

## 4. Verification & Evidence
- **Automated Bilingual Assertion Suite**:
  - `scripts/test-all-modals-bilingual.mjs` passed 100% across all modals, dropdowns, and speech bubbles.
- **Secrets Scan**:
  - `npm run secrets:scan` passed with 0 leaks across 3,214 files.
- **Isolated Turbopack Build**:
  - Verified with 82 compiled routes without regressions.
