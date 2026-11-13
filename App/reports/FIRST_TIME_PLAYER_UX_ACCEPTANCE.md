# Chấp nhận UX người chơi lần đầu — Milestone 09B

**Ngày:** 2026-10-29  
**Kết quả tổng thể:** PARTIAL — guide theo Pet, Backpack tinh gọn và lưu trạng thái đã được triển khai, build và kiểm tra trong demo cô lập. Chưa có reviewed Catalog tool/Knowledge phù hợp để kiểm tra chi tiết tool, equip, lesson hoặc Quick Quiz thật.

## Demo và môi trường

- Game: http://127.0.0.1:3241/play
- Hộp thư test cục bộ: http://127.0.0.1:54324
- Build hiện hành: `App/.tmp/healthclues-owner-demo/app-build-09b6`; tiến trình đang chạy độc lập với E2E.
- Auth/DB là Supabase cục bộ trên loopback và Mailpit cục bộ. Launcher xác minh endpoint `127.0.0.1:54321`/`54324` và dùng key do CLI local cung cấp. Không tải `.env.local`, không dùng production Supabase, không gửi email bên ngoài, không deploy.
- Mở/restart build đã dựng: `App\start-game-demo.bat`. Dừng riêng demo và giữ nguyên volume: `App\start-game-demo.bat --stop`, sau đó chạy BAT để mở lại. BAT chọn PID/build `app-build-09b6`; tránh lệnh `node ... --stop` mặc định vì nó sẽ chọn PID mặc định khác. Launcher từ chối an toàn nếu cổng 3241 đang bận.
- Rebuild source hiện hành:
  ```powershell
  $env:HEALTHCLUES_OWNER_DEMO_PORT='3241'
  $env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME='app-build-09b6'
  node scripts/start-healthclues-owner-demo.mjs --rebuild
  ```

## Thay đổi

- `src/features/healthclues/RegionMapScene.tsx`: hướng dẫn ngắn bằng Pet hiện có (Luna/Lumi), NEXT, SKIP GUIDE, thu nhỏ/đóng; bước Backpack và gợi ý Knowledge Library; landmark hiện tại được làm nổi bật.
- `src/features/healthclues/WorldAdventureScene.tsx`: tự mở đúng region theo Journey đã lưu; tải/lưu guide stage; Backpack tập trung trong bước hướng dẫn; các lối Check-in, Journal, Settings chỉ xuất hiện sau khi Backpack stage kết thúc.
- `src/components/healthclues/HealthCluesGameShell.tsx`: ẩn thanh điều hướng game trong mọi stage guide còn hoạt động, kể cả khi người chơi thu nhỏ guide.
- `src/features/healthclues/BackpackExperience.tsx`: inventory dạng game, ba slot hiện có, Explore tools, My Collection, Skip/Continue; chỉ hiển thị tool có tag topic tương ứng từ Catalog version hiện hành đã review. Quick Preview/Full Details dùng thông tin mô tả, Usage Method, evidence, safety, contraindication và reference đã review; Equip gọi API hiện có.
- `src/app/api/healthclues/catalog/route.ts`: trả topic tags/evidence/Usage Method chỉ từ phiên bản hiện hành đã review.
- `src/app/api/healthclues/guide/route.ts` + `supabase/migrations/20261029110000_healthclues_first_time_guide.sql`: stage/version không nhạy cảm, khóa theo user + World; API kiểm tra quyền sở hữu; RLS bật và quyền trực tiếp của client role bị thu hồi. Existing Worlds được backfill `skipped` để không ép người chơi cũ học guide mới.
- `scripts/test-healthclues-owner-auth-demo.mjs`: assertions nav/shortcut bị ẩn trong guide, refresh resume, local Auth/email và Sleep + Health/Gout journey.
- `App/start-game-demo.bat`: trỏ build owner mới nhất ở port 3241.

## Ma trận nghiệm thu

| Hạng mục | Implemented | Browser verified | Persistence verified | Visual QA | Kết quả |
|---|---|---|---|---|---|
| Sleep → Sleep Valley/Luna; Health/Gout → Realm/Lumi và topic đã lưu | Có | Có, Chromium local | Có trong flow Auth/World hiện tại | Ảnh desktop/mobile guide | PASS |
| Một bước rõ ràng; nav toàn game ẩn; Camp không liệt kê Check-in/Journal/Settings ở Backpack guide | Có | Assertions PASS | Guide stage được tải lại sau refresh | Ảnh guide và Backpack empty state | PASS |
| NEXT → Backpack; close/reopen và refresh giữ đúng bước | Có | Có | Có, API/DB local owner-scoped | Desktop/mobile | PASS |
| Ba slot có thể để trống; Skip/Continue không bắt buộc equip | Có | Có | Không phát sinh item giả | Desktop/mobile | PASS |
| Skip/continue → Knowledge Library trong cùng Region Map | Có | Có | Guide stage được cập nhật | Knowledge empty state đã capture | PASS cho điều hướng |
| Tool filtering chỉ dùng active/reviewed version và tag khớp; empty state không chặn chơi | Có | Empty state Sleep/Gout PASS | Không có ghi tool giả | Ảnh Backpack | PASS cho empty state; PARTIAL nội dung |
| Quick Preview, Full Details, equip một tool đủ điều kiện thật | Có trong source | Chưa test được: demo Catalog không có tool topic-tagged eligible | Endpoint equip hiện có được giữ nguyên | Chưa có tool screenshot | PARTIAL |
| Lesson/Quick Quiz thật có nội dung reviewed liên quan Journey | Tích hợp Knowledge hiện hữu | Chưa có nội dung Sleep/Gout reviewed để hoàn tất | Không grant reward giả | Empty state được kiểm tra | PARTIAL |
| Auth, account isolation, guest restriction, World resume | Hệ thống hiện có | Local email/Auth Chromium PASS; guest API 401; account thứ hai cô lập; invalid callback recovery; 0 uncaught runtime error | World ID ổn định reload; không tạo thêm branch trong flow kiểm tra | Ảnh active World | PASS trong phạm vi test |
| Desktop 1440×960 và mobile 390×844 | Có | Cả hai kích thước chạy qua Chromium | N/A | Guide/Backpack captures đã mở xem | PASS cho guide/empty state |

## Kiểm thử thực thi

- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3241 node scripts/test-healthclues-owner-auth-demo.mjs` (trên PowerShell dùng `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3241'; node scripts/test-healthclues-owner-auth-demo.mjs`): PASS. Hai tài khoản tổng hợp được xác minh qua email local thật trong Mailpit/Auth cô lập. Sleep guide/refresh/skip/Knowledge, Health → Gout/Lumi, World ID giữ nguyên, guest 401, 8 region (2 mở/6 Coming Soon), cross-account private check-in null, invalid callback recovery, 0 runtime errors. Script thêm tài khoản tổng hợp vào demo volume và không xóa demo data.
- Build isolated owner mới nhất `app-build-09b6`: PASS; route `/play` được launcher xác nhận trước khi sẵn sàng.
- ESLint các component/API/test đã sửa: PASS. `node --check scripts/test-healthclues-owner-auth-demo.mjs`: PASS. `git diff --check`: PASS (chỉ có cảnh báo CRLF trên nhiều file có sẵn trong worktree).
- `npm run docs:healthclues:check -- --files ... --docs ...`: PASS; checker đề xuất 7 target docs, tất cả đã được cập nhật/khai báo. Nội dung cũng được rà soát thủ công.
- Hosted email provider, email expiry/replay, production integration và các release gate chưa được kiểm tra; không ghi production.

## Ảnh browser thật và visual QA

Chụp từ build owner 3241 qua Chromium, không dùng concept art:

- Pet guide: `reports/previews/first-guide-luna-desktop.png`, `reports/previews/first-guide-luna-mobile.png`.
- Backpack ba slot/empty reviewed catalog: `reports/previews/first-guide-backpack-desktop.png`, `reports/previews/first-guide-backpack-mobile.png`.
- Knowledge Library entry: `reports/previews/first-guide-knowledge-desktop.png`.
- Lumi nhận topic Gout từ Quiz: `reports/previews/first-guide-lumi-desktop.png`.
- Region regression: `reports/previews/owner-two-region-sleep-map-desktop.png`, `owner-two-region-sleep-map-mobile.png`, `owner-two-region-health-gout-desktop.png`, `owner-two-region-health-gout-mobile.png`.

Đã mở xem các ảnh Luna, Backpack desktop/mobile và Knowledge. Thanh điều hướng game ẩn trong các guide stage; ảnh Backpack chỉ có inventory cùng map mờ phía sau và không hiện các shortcut ngoài bước này. Knowledge image là empty state trung thực, không phải bằng chứng có lesson đã review.

## Giới hạn còn lại

1. Chưa có Catalog item version được review, có topic tag phù hợp Sleep/Gout và đủ điều kiện trong demo. Do đó chưa xác nhận click tool → Quick Preview → Full Details → Equip hoặc Usage Method thực.
2. Demo không có Sleep/Gout Knowledge đã review; chưa thể hoàn tất Tip, lesson, optional Quick Quiz hay reward học tập.
3. Guide này không hoàn tất Daily Companion 2–3 câu, Knowledge Skills, authoring/reviewer workflow hoặc production release gates.
4. Feature completeness tổng thể HealthClues vẫn PARTIAL. Không xem việc chụp empty state là nội dung gameplay đã hoàn tất.
