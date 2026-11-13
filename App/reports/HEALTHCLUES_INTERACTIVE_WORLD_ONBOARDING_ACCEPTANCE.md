# Nghiệm thu Master Prompt 12 — Interactive World Onboarding

**Ngày:** 2026-10-31  
**Kết quả:** PASS trên Owner Demo local cho guided tour, trạng thái có/không có Plan, replay/resume, browser responsive và RPG regression trong script hiện hành.  
**Build:** [http://127.0.0.1:3273/play](http://127.0.0.1:3273/play)  
**Supabase:** project cô lập `healthclues-owner-demo`, API `127.0.0.1:54321`; Mailpit `127.0.0.1:54324`. Không truy cập production, không reset volume.

## Trải nghiệm đã kiểm tra

- Tour dùng trạng thái guide hiện có, phiên bản 2; không thêm kho Plan hay bảng tutorial mới. Welcome → My Journey → Botanist → Wellness Guide → Start Exploring. Luna đi với Sleep Valley, Lumi với HealthClues Realm.
- Spotlight đo bounds của control/NPC DOM thật, cập nhật theo resize/scroll và đảm bảo target nằm trong viewport. Khi spotlight map, camera chỉ focus landmark; avatar không bị teleport và quy tắc proximity Talk vẫn bắt buộc đi tới NPC.
- Ở My Journey, `Show My Goals` mở panel thật và yêu cầu người chơi xem panel trước khi Continue. Panel đọc Quiz focus cùng Plan của World hiện tại; Active, Saved for Later và Personal goals được tách riêng. Người chưa xác nhận Plan thấy thông báo thật và có thể mở lại Quiz suggestions mà không làm Quiz lại hay biến suggestions thành goals.
- Botanist và Wellness Guide chỉ được highlight nếu NPC thật có trong region. Dialogue giải thích đây là khu khám phá tự chọn; không tự thêm hoặc kê sản phẩm. Tour có Back, Skip Tour, nút Start Exploring, focus management, Escape-to-skip và reduced-motion styling.
- API giữ trạng thái theo tài khoản/World. Skip/completion là terminal; reload tour đang chạy resume, còn người chơi đã hoàn tất không bị buộc xem lại. Replay Guide mở lại tour.

## Browser E2E thực tế

Chạy `node scripts/test-healthclues-owner-auth-demo.mjs` trên build 3273, Chromium. Kết quả đầu ra: `result: PASS`, `runtimeErrors: 0`.

- Sleep Valley không Plan: auto welcome, mở My Journey, xác minh Quiz focus và empty state, mở saved Quiz suggestions, hoàn tất Botanist/Wellness/finish trên desktop và mobile.
- Sleep Valley có Plan: xác minh goal đã lưu trong My Journey; replay, reload giữa tour và resume; mở Full Plan; hoàn tất tour.
- HealthClues Realm: xác minh Journey Gout và Lumi; cùng các spotlight desktop/mobile; cả hai maps duy trì NPC riêng và movement/Talk.
- Regression: tám vùng Overworld (sáu Coming Soon), đi tới ba NPC ở mỗi playable region, Collection, Care Plan và cross-account denial, Backpack/replace/remove, Daily Companion, Knowledge Skills, bốn mini-game, Boss/Rewards, World persistence/account isolation. Local reminder gửi một thư Mailpit, retry không gửi trùng.
- Kết quả chi tiết trong JSON cuối của script: World ID ổn định sau reload; guest World request 401; cross-account Care Plan 404; path đến NPC hợp lệ, Talk chỉ sau arrival; runtime errors 0.

## Visual QA

Đã mở và kiểm tra ảnh thật từ build 3273; desktop 1440×900, mobile Chromium emulation 390×844. Spotlight bao quanh My Journey và từng NPC thật; dialogue mobile không che target; My Journey panel cuộn dọc và không tràn ngang; confirmed Plan hiển thị goal thực, no-plan state không bịa goal. Ảnh:

- Welcome: `reports/previews/master-prompt-12-20261031-run2/no-plan-sleep-tutorial-welcome-desktop.jpg` và `...-mobile.jpg`.
- My Journey spotlight: `no-plan-sleep-my-journey-spotlight-desktop.jpg`, `...-mobile.jpg`.
- No-plan panel và saved suggestions: `no-plan-sleep-my-journey-actual-goals-desktop.jpg`, `...-mobile.jpg`, `no-plan-sleep-saved-quiz-suggestions-desktop.jpg`, `...-mobile.jpg`.
- Botanist: `no-plan-sleep-botanist-spotlight-desktop.jpg`, `...-mobile.jpg`.
- Wellness practice: `no-plan-sleep-wellness-practice-spotlight-desktop.jpg`, `...-mobile.jpg`.
- Confirmed goals: `confirmed-plan-sleep-replay-my-journey-actual-goals-desktop.jpg`, `...-mobile.jpg`; full Plan `confirmed-plan-sleep-replay-full-wellness-plan-desktop.jpg`.
- Lumi/Gout equivalents: `no-plan-gout-tutorial-welcome-desktop.jpg`, `no-plan-gout-my-journey-spotlight-desktop.jpg`, `no-plan-gout-botanist-spotlight-desktop.jpg`, `no-plan-gout-wellness-practice-spotlight-desktop.jpg`, cùng bản `-mobile.jpg`.
- Kết tour: `no-plan-sleep-tutorial-finish-desktop.jpg`, `...-mobile.jpg`.
- Gameplay/reload regression: các ảnh `owner-two-region-*`, `final-nav-*`, `owner-backpack-*`, `09c-care-plan-*`, `final-companion-checkin-*` cùng thư mục.

## Thay đổi và kiểm tra mã

- `src/features/healthclues/WorldAdventureScene.tsx`: tour tương tác version 2, spotlight DOM, panel My Journey thật, resume/replay/accessibility.
- `src/features/healthclues/RegionMapScene.tsx`: focus camera vào landmark tour, không di chuyển player.
- `src/app/api/healthclues/guide/route.ts`: trả version guide và giữ semantics owner/World.
- `src/features/healthclues/world-adventure.css`: overlay, spotlight, dialogue, responsive và reduced motion.
- `supabase/migrations/20261031100000_healthclues_interactive_world_tour.sql`: migration có sẵn và được xác nhận đã áp dụng ở local inventory; lượt này không chạy migration.
- `scripts/test-healthclues-owner-auth-demo.mjs`: assertion cập nhật cho năm bước thực tế, geometry/visibility, no-plan recovery, confirmed Plan, desktop/mobile và resume.
- Focused ESLint: PASS, không lỗi; còn hai warning `<img>` có sẵn trong RegionMapScene. `node --check` cho E2E script: PASS.

## Giới hạn

Mobile được kiểm tra bằng Chromium emulation, chưa kiểm tra thiết bị vật lý. Nội dung demo hiển thị TEST ONLY/NOT HUMAN-REVIEWED; nghiệm thu gameplay không phải nghiệm thu y khoa hoặc production. Build không triển khai production; local Mailpit không chứng minh delivery cloud.
