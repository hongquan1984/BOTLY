# HealthClues — My Journey navigation acceptance

**Ngày:** 2026-10-31  
**Build kiểm tra:** `app-build-my-journey-20261031`  
**URL local:** [http://127.0.0.1:3272/play](http://127.0.0.1:3272/play)  
**Supabase:** isolated local `healthclues-owner-demo`, API `127.0.0.1:54321`; không truy cập production.

## Phạm vi thay đổi

- Thêm điều hướng cố định `My Journey` (biểu tượng route) ngay dưới `World Map` trong HUD dùng chung của Sleep Valley và HealthClues Realm. Mobile hiển thị nút gọn `Journey`, có accessible name `My Journey` và vùng chạm tối thiểu 42 px.
- Panel tóm tắt đọc Quiz focus và confirmed goals từ dữ liệu World/profile đã tải qua phiên authenticated hiện hữu. Nhóm riêng active goals, saved-for-later goals và personal goals; hiển thị target/schedule/note có thật khi có, không suy diễn target hoặc completion.
- Plan chưa xác nhận: thông báo rõ, cho mở lại Quiz suggestions đã lưu và không biến suggestion thành goal. `View Full Plan` mở panel Quests hiện tại, cùng API/chủ sở hữu/World/revision; không thêm bảng/schema hoặc bản sao Plan.
- Tutorial Luna/Lumi bước ba highlight điều hướng và nút `Open My Journey` mở panel thật. Không đổi map, movement, NPC, Auth hay gameplay data.

## Bằng chứng browser

Ảnh được chụp từ Chromium trên build `3272`; desktop 1440×900 và mobile emulation 390×844. Đã mở và xem trực quan các ảnh sau:

- Tutorial highlight, desktop: `previews/no-plan-sleep-my-journey-highlight-desktop.jpg`
- Tutorial highlight, mobile: `previews/no-plan-sleep-my-journey-highlight-mobile.jpg`
- Empty Plan, desktop/mobile: `previews/no-plan-sleep-my-journey-desktop.jpg`, `previews/no-plan-sleep-my-journey-mobile.jpg`
- Confirmed Plan, desktop/mobile: `previews/owner-my-journey-confirmed-desktop.jpg`, `previews/owner-my-journey-confirmed-mobile.jpg`
- Personal goals, desktop: `previews/owner-my-journey-personal-goal-desktop.jpg`
- Region HUD button, desktop/mobile: `previews/owner-my-journey-navigation-desktop.jpg`, `previews/owner-my-journey-navigation-mobile.jpg`

Quan sát: nút desktop nằm dưới World Map; trên mobile nút rút gọn còn `Journey`, nằm trong vùng HUD góc trái, chữ đọc được và không phủ marker/gameplay point. Panel My Journey hiển thị đúng Quiz focus/empty state hoặc goal đã xác nhận. Tutorial giữ cảnh Region nhìn thấy, Pet đúng vùng, và luồng mở Plan dùng CTA thật. Ảnh mobile là Chromium emulation; chưa có kiểm tra thiết bị vật lý.

## Kết quả E2E và tình trạng

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Empty Plan, dùng Quiz focus đã lưu, không lặp Quiz | PASS | Chromium xác nhận empty state và recovery; không phát sinh Plan từ suggestion |
| Nút tồn tại/visible, đặt dưới World Map, được spotlight tutorial | PASS | DOM assertions trong `scripts/test-healthclues-owner-auth-demo.mjs` và ảnh tutorial/HUD |
| View Full Plan mở Quests canonical | PASS | Chromium xác nhận cùng goal title trong hai panel |
| Confirmed Plan sau reload và cùng World | PASS | E2E đọc lại World ID và Plan API |
| My Journey trên mobile/desktop | PASS | Chromium desktop/mobile screenshots đã xem |
| Toàn bộ RPG regression | PASS | `node scripts/test-healthclues-owner-auth-demo.mjs` trên `3272`: `result: PASS`, `runtimeErrors: 0`; movement + Pet follow + arrival-gated Talk, cả Sleep/Realm, Collection, Care Plan và cô lập tài khoản, Backpack/replace/remove, Daily Companion, Knowledge/4 mini-games/Skills persistence, Boss/Rewards và World reload. Local Mailpit: 1 thư, retry gửi trùng 0. |

Trong lần chạy đầu, script đóng Plan ngay sau khi goal text xuất hiện trong input, trước khi chờ API hoàn tất. Đã sửa test để đợi `Saved as Plan version 2`, xác minh GET Plan trả đúng revision/goal rồi mới kiểm tra My Journey. Đây là sửa điều kiện đồng bộ của test, không hạ assertion sản phẩm. Lần chạy Chromium sau sửa hoàn tất PASS: My Journey hiển thị hai personal goals đã lưu, Plan revision/World giữ nguyên sau reload; toàn bộ RPG regression cùng chạy PASS, không có uncaught runtime error.

## Ma trận nghiệm thu

| Ca kiểm tra | Trạng thái | Ghi chú |
|---|---|---|
| First-entry, tutorial mở My Journey và không có Plan | PASS | Sleep/Luna và HealthClues Realm/Lumi; empty state không bịa goal; tutorial CTA mở summary thật |
| Returning player và Plan đã xác nhận | PASS | Reload cùng World ID; confirmed Plan và revision còn nguyên; tutorial không tự chạy lại |
| My Journey → Quests | PASS | View Full Plan mở chính panel/API Plan hiện có |
| Hai viewport | PASS | Chromium desktop 1440×900 và mobile emulation 390×844; ảnh đã mở kiểm tra trực quan |
| RPG/browser regression | PASS | Toàn bộ script hiện hành: PASS, runtimeErrors 0 |
| Provider Gemini/AI | NOT IN SCOPE / chưa cấu hình | Build đang trả `AI_UNAVAILABLE`; E2E không giả lập nội dung AI |
| Thiết bị di động vật lý | NOT VERIFIED | Chỉ Chromium mobile emulation |

## Files

- `src/features/healthclues/RegionMapScene.tsx`
- `src/features/healthclues/WorldAdventureScene.tsx`
- `src/features/healthclues/world-adventure.css`
- `scripts/test-healthclues-owner-auth-demo.mjs`
- `App/CURRENT_STATE.md`
- `App/UI_UX_SPEC.md`
- `App/USER_FLOWS.md`
- `App/BUSINESS_RULES.md`
- `App/MASTER_SPEC.md`
- `App/COMMUNITY_AND_PRIVACY_SPEC.md`
- `App/reports/HEALTHCLUES_MY_JOURNEY_ACCEPTANCE.md`

**Kiểm tra tĩnh:** `node --check scripts/test-healthclues-owner-auth-demo.mjs` PASS; focused ESLint exit 0, không error (5 warning hiện hữu về 3 biến screenshot chưa dùng và 2 `<img>` trong RegionMapScene; CSS bị ESLint bỏ qua theo cấu hình); docs consistency guard PASS sau khi liệt kê mọi tài liệu đích đã cập nhật; HTTP GET `/play` trả 200.

Không có migration/schema mới. Các lệnh chỉ dùng local isolated demo; không reset volume, xóa World, deploy hoặc ghi production. E2E tạo tài khoản synthetic mới, không tái sử dụng/ghi đè World của người dùng.
