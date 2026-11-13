# HealthClues 09C — Gameplay Acceptance

**Ngày kiểm tra:** 29-10-2026  
**Trạng thái milestone:** PARTIAL — lát cắt khám phá và Care Plan đã chạy được trên demo cô lập; encyclopedia hiện chưa có mục được duyệt để mở chi tiết hoặc equip.

## Môi trường và bằng chứng

- Game build được xác minh bằng Chromium: [http://127.0.0.1:3241/play](http://127.0.0.1:3241/play)
- Hộp thư xác minh cục bộ: [http://127.0.0.1:54324](http://127.0.0.1:54324)
- Auth/DB là Supabase local project `healthclues-owner-demo` trên loopback; migration `20261029120000` và `20261029130000` đã áp dụng vào volume demo hiện hữu. Không đọc `.env.local`, không gọi production, không gửi email ngoài, không deploy.
- Launcher khởi động: `App\start-game-demo.bat`. Rebuild có kiểm soát: đặt `HEALTHCLUES_OWNER_DEMO_PORT=3241`, `HEALTHCLUES_OWNER_DEMO_BUILD_NAME=app-build-09c5`, rồi `node scripts/start-healthclues-owner-demo.mjs --rebuild` (chỉ khi cổng 3241 đã trống). Dừng riêng demo bằng cùng biến môi trường và `--stop`; volume dữ liệu được giữ.
- Lệnh browser acceptance cuối: `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3241'; node scripts/test-healthclues-owner-auth-demo.mjs` — **PASS**, Chromium + Mailpit, 0 runtime exception.

## Ma trận

| Hạng mục | Đã triển khai | Browser thật | Persistence | Visual QA | Kết quả |
|---|---|---|---|---|---|
| Sleep Valley: Luna, camp, Garden, Activity Trail, Wellness Sanctuary | Có; cùng Region Map engine | Vào map, đi qua ba station và Camp | World ID giữ sau reload | Desktop/mobile đã chụp | PASS cho flow và empty state |
| HealthClues Realm: Lumi và concern Gout từ Quiz | Có; sử dụng topic đã lưu, không hỏi lại | Local Auth callback khôi phục Gout & uric acid | World/profile owner-scoped, reload cùng World | Desktop/mobile và station đã chụp | PASS cho continuity |
| Encyclopedia theo topic/review | Có: catalog active/current/reviewed, lọc topic/category, search, Preview/Details/actions | Hai map cho empty state đúng; Gout không thấy nội dung không liên quan | Save/equip tiếp tục qua API hiện hữu | Empty state được kiểm tra | PARTIAL — local Catalog không có mục phù hợp để thử entry/details/save/equip |
| User-defined method | Có, ghi riêng trong Care Plan; đánh nhãn user-added-unverified | Tạo bằng UI, tự report `used`, sửa private note, pause | Read sau reload; SQL local xác nhận note + trạng thái; không lọt Catalog | Care Plan populated desktop/mobile đã chụp | PASS trong local synthetic demo |
| Medication record | Có, chỉ chép thông tin người dùng cung cấp; không kê toa/tính liều/equip/reward | Tạo từ UI với schedule `journal_only` | Đọc lại sau reload; riêng khỏi Backpack | Screenshot populated desktop/mobile | PASS cho lưu/riêng tư trong demo; không phải thử nghiệm tương tác thuốc |
| My Collection / Backpack | Component/API V1 được tái sử dụng | Ba slot hiển thị, cho phép skip | Auth E2E hiện có tiếp tục PASS | Backpack desktop/mobile chụp | PARTIAL — chưa có reviewed Catalog để chứng minh equip |
| World, 8 vùng | Overworld hiện hành giữ 8 vùng, 2 playable / 6 Coming Soon | Kiểm tra cả 8, vùng locked không đi route; World ID ổn định | Reload giữ cùng World và một branch | World và map desktop/mobile | PASS cho kiểm tra này |
| Knowledge trong vùng | Landmark mở Knowledge Book theo journey | Gout/Sleep mở empty state trung thực, không đổi sang chủ đề khác | API V1 dùng chung | Screenshot desktop | PARTIAL — không có reviewed lesson nên chưa thể kiểm tra Quick Quiz/reward |
| Guide Pet | Stage lưu qua API owner-scoped; chuyển `done` đúng thành API stage `completed` | Refresh/resume, skip và không còn lỗi guide state | Trạng thái guide lưu trong DB local | Luna/Lumi desktop, guide mobile | PASS cho guide slice |
| Private boundaries | API yêu cầu user đã xác minh, kiểm tra World ownership mỗi request; bảng mới không cấp quyền trực tiếp `anon`/`authenticated`; không gọi XP API | Guest World 401; user B đọc Care Plan của A nhận 404; invalid callback recovery | user/world FK và local DB query | Không thay đổi privacy UI của các hệ thống cũ | PASS trong hai synthetic local account; chưa phải security review |
| Camera / map | Giữ SVG/DOM renderer; có pan pointer, wheel/zoom controls và keyboard | Zoom control và hotspot được test trước đó; test 09C không đo FPS | Không thêm persistence ngoài vùng/guide hiện có | Mobile screenshot được kiểm tra | PARTIAL — pinch, drag QA định lượng và FPS chưa đo |
| NPC artwork, final region art | Chưa có portrait NPC riêng; Pet là sprite React/SVG; region maps còn SVG hình học | Không áp dụng | Không áp dụng | Bố cục xem được nhưng chưa phải hand-painted final art | PARTIAL — cần asset production |
| Daily Companion/reminders | Check-in V1 mở được từ Camp; chưa có hội thoại Pet 2 câu / adaptive câu 3 | Không kiểm tra flow hội thoại | Check-in V1 tồn tại riêng | Chưa có screenshot hội thoại 09C | PARTIAL |
| Knowledge mini-games, Skills, Boss và World reward | Thành phần V1 được giữ; milestone này không xây engine mới | Không hoàn thành hoạt động do thiếu reviewed content | Reward chưa được cấp giả | Chưa kiểm chứng encounter/unlock | PARTIAL |

## Files đã thay đổi

- `src/app/api/healthclues/care-plan/route.ts`
- `src/features/healthclues/PrivateCarePlanPanel.tsx`
- `src/features/healthclues/WellnessEncyclopediaStation.tsx`
- `src/features/healthclues/WorldAdventureScene.tsx`
- `src/features/healthclues/RegionMapScene.tsx`
- `src/features/healthclues/world-adventure.css`
- `scripts/test-healthclues-owner-auth-demo.mjs`
- `supabase/migrations/20261029120000_healthclues_private_care_plan.sql`
- `supabase/migrations/20261029130000_healthclues_region_guide_and_care_plan.sql`
- Specs: `MASTER_SPEC.md`, `USER_FLOWS.md`, `BUSINESS_RULES.md`, `USE_CASES.md`, `UI_UX_SPEC.md`, `DATABASE_DESIGN.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `DECISIONS_AND_ASSUMPTIONS.md`, `IMPLEMENTATION_PLAN.md`, `ACCEPTANCE_TESTS.md`.
- Owner runbook: `start-game-demo.bat` dùng build `app-build-09c5`.

## Screenshot từ build owner 3241

Các ảnh bên dưới được tạo bởi browser script trên cùng build, không phải mockup:

- Guide và region: `reports/previews/first-guide-luna-desktop.png`, `first-guide-luna-mobile.png`, `first-guide-lumi-desktop.png`, `owner-two-region-sleep-map-desktop.png`, `owner-two-region-sleep-map-mobile.png`, `owner-two-region-health-gout-desktop.png`, `owner-two-region-health-gout-mobile.png`.
- Station/Knowledge: `09c-sleep-herbal-station-desktop.png`, `09c-sleep-wellness-station-mobile.png`, `owner-two-region-health-gout-station-desktop.png`, `owner-two-region-health-gout-knowledge-desktop.png`, `owner-two-region-sleep-knowledge-desktop.png`.
- Care Plan: `09c-care-plan-desktop.png`, `09c-care-plan-mobile.png`, `09c-care-plan-records-desktop.png`, `09c-care-plan-records-mobile.png`.
- World/Auth/Backpack: `owner-auth-persistent-world-desktop.png`, `owner-auth-persistent-world-mobile.png`, `owner-auth-activation-overlay-desktop.png`, `owner-auth-backpack-desktop.png`.

Đã mở kiểm tra trực quan map Sleep mobile/desktop, station Sleep desktop/mobile, station Gout, Knowledge Gout và Care Plan có dữ liệu desktop/mobile. Bản cuối đã sửa lỗi guide stage và thêm chiều cao map mobile theo đúng offset HUD. Bản populated Care Plan dùng dữ liệu synthetic của demo.

## Kết quả test cuối

- Owner Auth Browser E2E: **PASS** — Sleep onboarding tối đa 10 câu, local email capture/verify, Backpack, Guide refresh, World; Health → Gout → Lumi; station/Knowledge empty state; user method + medication; self-report event; sửa note và pause; reload; hai account; Care Plan của account khác trả 404; guest World trả 401; invalid callback; tám vùng (sáu Coming Soon); 0 runtime exception.
- Isolated Next production-style build: **PASS** — `/play` có trong route output.
- ESLint trên code/test liên quan 09C: **PASS**.
- `node --check scripts/test-healthclues-owner-auth-demo.mjs`: **PASS**.
- `git diff --check`: **PASS** (chỉ cảnh báo CRLF của nhiều file đã tồn tại ngoài scope).
- Full game E2E, production integration, external provider email, cross-browser Safari/Firefox, pinch gesture/FPS: **NOT VERIFIED**.

## Blockers / next slice

1. Cần nội dung Encyclopedia/Knowledge được editorial + safety review và fixture demo được gắn nhãn rõ để kiểm tra preview/details/save/equip, Knowledge Quick Quiz, mini-game và Boss mà không giả làm nội dung đã duyệt.
2. Cần hoàn thiện Care Plan accessibility/mobile polish và rà soát retention/export/account-deletion/privacy; medication data chưa có encryption-field design hoặc external medical safety validation trong milestone này.
3. Cần artwork hand-painted riêng cho hai map và NPCs, Daily Companion hội thoại 2–3 câu, learning Skills/rewards và xác minh drag/pinch trên thiết bị thật.

Milestone không làm HealthClues production-ready. Không có dữ liệu production hoặc migration production nào được sửa.


## Cập nhật xác minh cuối trên build app-build-09c6

Sau khi sửa scene mobile để tính đúng chiều cao HUD và đưa modal tới safe-area thật, browser acceptance trên build cùng URL 3241 chạy lại PASS. Lệnh chạy: `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3241'; node scripts/test-healthclues-owner-auth-demo.mjs`. Chromium trả runtimeErrors: 0. Ảnh owner-two-region-sleep-map-mobile.png xác nhận map lấp đầy phần viewport dưới HUD; 09c-care-plan-records-mobile.png xác nhận modal phủ scene phía sau và record list còn cuộn được. Hai ảnh desktop tương ứng cũng đã xem. Mobile dialogue vẫn phủ một phần nhãn ở vùng thấp khi map ở scale mặc định; pinch thực địa và hiệu năng thiết bị chưa kiểm tra.

