# HealthClues — Universal Wellness Advisor / Plan Builder

Ngày: 2026-10-30 · Owner report: tiếng Việt · Consumer UI: English

## Trạng thái

## Cập nhật nghiệm thu mới nhất — 2026-10-30

**PARTIAL — luồng checklist, xác nhận và lưu plan đã được browser-verified trên hai tài khoản tổng hợp local; callback email của build mới và nội dung được human-review vẫn chưa nghiệm thu.** Đây là deterministic personalization, không phải live AI generation. Phạm vi chỉ là Post-Quiz checklist → lựa chọn/cấu hình → plan được người chơi xác nhận → lưu vào World; không triển khai Home, Pet progression, herbs/supplements/therapies trong onboarding, Challenge hoặc Boss mới.

### Môi trường và build

- Supabase CLI `2.122.0`; project ID `healthclues-owner-demo`; API `http://127.0.0.1:54321`; DB port `54322`; Mailpit `54324`. Định danh project khớp CLI status, `App/.tmp/healthclues-owner-demo/supabase/config.toml` và bằng chứng Docker owner đã cung cấp. Auth health/settings, REST Catalog và Mailpit trả HTTP 200 trước khi tạo dữ liệu test.
- `.env.local` không được dùng hoặc sửa. Launcher đọc key từ CLI vào file git-ignored `App/.tmp/healthclues-owner-demo/owner-demo-runtime.json`, kiểm tra đúng project ID/loopback URL, rồi dùng cùng cấu hình local cho isolated build-time/runtime. Secret không được in.
- Build source mới nhất: `http://127.0.0.1:3261/play` (`app-build-postquiz-safety-20261030`); build trước đó của lượt này vẫn còn nguyên tại `3260`. Các demo cũ 3249/3254/3257/3258 không bị dừng/ghi đè. Reuse mode không chạy migration, reset, seed hay sửa Docker volume.
- Docker ban đầu không truy cập được qua môi trường thực thi Node với cấu hình mặc định. Đọc-only `supabase status` chạy được sau khi đặt `DOCKER_HOST` vào Docker Desktop Linux named pipe và dùng Docker config riêng của Owner Demo; containers không bị restart. Năm service đã xác nhận vẫn chạy. Không có bằng chứng containers bị thiếu.

### Browser E2E thật và bằng chứng

`HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3261 node scripts/test-healthclues-post-quiz-plan-browser.mjs` chạy Chromium headless trực tiếp vào build mới nhất. Script tự fail-close nếu runtime JSON không khớp project, API không phải loopback, service local không phản hồi hoặc port nằm ngoài danh sách port mới được phép. Auth users là synthetic `@example.invalid`, được tạo/đăng nhập bằng local Supabase Auth; không có production request.

- **Gout:** Quiz 10 câu → Reveal → checklist 6 candidate TEST ONLY → cấu hình, sau đó Adjust một goal → Skip một candidate → thêm personal goal có target/frequency/self-report definition → Review → Confirm → World Preview → verified local test account → activation consent → tạo HealthClues Realm → reload. Plan revision `1` và các goal đọc lại từ đúng World sau reload.
- **Sleep:** cùng luồng với checklist Sleep riêng (4 candidate TEST ONLY), goal cấu hình được, World Sleep Valley riêng và revision `1` sau reload.
- Không hiện water volume chung; candidate hydration chỉ là “follow existing personal guidance”. Khi Quiz không xác nhận fluid restriction là absent, hộp thoại không còn checkbox xác nhận sai và Add bị disable; browser kiểm tra lại cảnh báo/disable trên build 3261. Không hiện target bedtime phổ quát. Các goal cá nhân trong thử nghiệm được đánh dấu `USER-CREATED · NOT REVIEWED`.
- Hai synthetic account có owner và World riêng. Tài khoản B đọc plan của World A: HTTP `404`; ghi plan vào World A: HTTP `404`. Cả hai trình duyệt tải lại cùng World ID và plan version. Browser runtime exceptions: `0`. Latest focused checks: wellness-plan unit suite PASS (41 assertions), Quiz safety PASS (38 assertions), browser E2E script syntax PASS, focused ESLint PASS with 0 errors, and documentation consistency guard PASS.
- Đây không phải kiểm thử callback xác minh email: tài khoản synthetic được đánh dấu confirmed bằng local Auth admin fixture để cô lập kiểm thử persistence. Cấu hình local Auth hiện allowlist callback cho cổng `3257`, không phải `3260`; vì vậy Magic Link callback trên build mới **NOT VERIFIED**. Luồng activation consent / tạo World sau phiên đã xác nhận được browser-test.
  - Ảnh desktop 1440×900, mobile 390×844, form cấu hình, review và World được tạo từ browser build 3261, đã mở kiểm tra trực quan. Plan không tràn ngang trên mobile; card và nút thao tác xếp theo cột; screenshot World desktop được chụp sau khi ảnh artwork tải xong:
  - Gout: `reports/previews/post-quiz-gout-reveal-desktop.png`, `post-quiz-gout-reveal-mobile.png`, `post-quiz-gout-plan-desktop.png`, `post-quiz-gout-plan-mobile.png`, `post-quiz-gout-goal-adjust.png`, `post-quiz-gout-custom-goal.png`, `post-quiz-gout-hydration-safety.png` (latest capture: unknown restriction shows no confirmation checkbox; Add is disabled), `post-quiz-gout-review-desktop.png`, `post-quiz-gout-review-mobile.png`, `post-quiz-gout-world-preview.png`, `post-quiz-gout-activation-backpack.png`, `post-quiz-gout-world-desktop.png`, `post-quiz-gout-world-mobile.png`.
  - Sleep: cùng bộ `post-quiz-sleep-*` (Reveal, Plan, Review, preview, activation/backpack, World desktop/mobile).
- Script test mới: `scripts/test-healthclues-post-quiz-plan-browser.mjs`. Một script browser cũ dừng sớm do assertion chờ trạng thái tải Catalog đã lỗi thời; script kiểm thử mới chờ đúng API state và đã hoàn tất PASS.
- Files changed in this continuation: `src/components/healthclues/WellnessPlanBuilder.tsx` (hydration safety control is shown only for confirmed no-restriction Quiz context; unknown/reported context has an alert and disabled Add), `scripts/test-healthclues-post-quiz-plan-browser.mjs` (adds unknown-hydration browser assertions and removes an unused variable); `App/CURRENT_STATE.md`, `HEALTHCLUES_CONTEXT.md`, `MASTER_SPEC.md`, `USER_FLOWS.md`, `USE_CASES.md`, `BUSINESS_RULES.md`, `DATABASE_DESIGN.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `ACCEPTANCE_TESTS.md`; this report; and the listed Chromium screenshots. No database migration.

### AI, nguồn và giới hạn sản phẩm

- Không có LLM được gọi: UI nói rõ “Personalized from your Quiz with deterministic rules. Live AI generation is not configured.” Pipeline hiện tại: Quiz → structured profile → exact-topic habit templates/Catalog retrieval → deterministic safety/eligibility → ranking/explanations → checklist. Server API là nguồn quyết định cuối cho goal validation và plan save.
- Gout: 6 template; Sleep: 4 template. Cả 10 đều `TEST ONLY`, có reference URL và giới hạn bằng chứng, nhưng **không human-reviewed/approved** và không được coi là medical recommendations. Không có approved habit template hiện tại.
- Type 2 Diabetes, Migraine, Weight Management và General Wellness: identifier/config hỗ trợ kiến trúc nhưng chưa có template đủ review; không được tự sinh condition-specific advice. “Other/unsupported” cần coverage gap hoặc reviewed general item phù hợp, không filler.
- Herbs, botanicals, supplements, medication changes, therapies bị loại khỏi checklist onboarding; vẫn thuộc NPC discovery trong game, ngoài phạm vi lần này.
- `.env.local`, production data, deployment, repository secrets và existing World data không bị đụng tới. Local test đã tạo synthetic Auth accounts/Worlds/plan; không xóa volume hoặc user.

### Ma trận trạng thái

| Nội dung | Trạng thái |
|---|---|
| Isolated runtime identity/API preflight | **PASS** — project ID/key/API loopback và health routes đã kiểm chứng trước writes |
| Quiz → personalized TEST ONLY checklist | **BROWSER VERIFIED** — Gout và Sleep; không phải nội dung được duyệt |
| Add / Adjust / Skip / custom goal / review | **BROWSER VERIFIED** — Gout; cấu hình riêng Sleep cũng được lưu |
| Confirm → owner/World plan → reload | **BROWSER VERIFIED** — hai user, revision và World giữ nguyên |
| Cross-account plan read/write | **PASS** — cả hai bị từ chối HTTP 404 |
| Desktop/mobile visual QA | **PASS trong Chromium emulation** — screenshots đã mở; plan horizontal overflow = false |
| RPG regression | **PARTIAL** — hai playable World vào được, artwork hiển thị, Gout/Sleep Journey giữ nguyên; hệ thống gameplay khác không được retest trong suite này |
| Email verification trên build 3261 | **NOT VERIFIED / BLOCKED** — callback allowlist local chỉ có 3257; không sửa Auth config để tránh ảnh hưởng demo hiện hữu |
| Live AI | **NOT IMPLEMENTED / NOT USED** — deterministic fallback được công khai trong UI |
| Diabetes/Migraine/Weight/General content | **PARTIAL** — chưa có bộ habit được editorial review |
| Production readiness | **NOT CLAIMED** — local demo fixtures chưa human-reviewed; không deploy |

**Kết luận:** Post-Quiz selection → configured user-confirmed plan → authenticated World persistence hoạt động trên isolated local demo. Chưa thể gọi toàn bộ onboarding FULL PASS: cần approved/reviewed content library và xác minh Magic Link callback trên cùng build. Không bắt đầu Home/Phase 10B.

---

### Historical status snapshot — trước browser retest

**PARTIAL — deterministic source implementation và focused unit tests; browser/DB acceptance chưa chạy ở thời điểm snapshot này.** Đây không phải live AI generation. Snapshot được supersede bởi nghiệm thu mới nhất ở trên.

## Kiến trúc hiện tại

- Quiz profile hiện có (`topic`, mục tiêu hai tuần, sở thích/nội dung, thời gian và safety answers) là đầu vào; không thêm quiz bắt buộc.
- `WELLNESS_TOPIC_CONFIG` chuẩn hóa sáu topic: Gout, Type 2 Diabetes, Sleep/Insomnia, Migraine, Weight Management và General Wellness. `WELLNESS_HABIT_LIBRARY` là dữ liệu template dùng chung với topic applicability, nhóm Build/Reduce/Additional, tags, ưu tiên, nguồn, provenance, target kind, safety rule và yêu cầu định nghĩa đo lường.
- Pipeline xác định topic → lấy template áp dụng và Catalog item có topic tag khớp chính xác → xếp hạng tất định theo ưu tiên, câu trả lời sở thích/mục tiêu → kiểm tra an toàn. Safety là gate; ranking không thể vượt qua gate. Giải thích chỉ dẫn lại Quiz hoặc topic/tag đã lưu.
- Hành động Add/Adjust yêu cầu cấu hình target, tần suất và rule tự báo cáo; server tiếp tục xác thực template, trạng thái demo, safety, owner, World và revision bằng API Plan hiện có. Plan ở profile JSONB có lịch sử revision; không thêm bảng/migration.
- Không có LLM được gọi trong việc tạo checklist. UI nêu rõ “Personalized from your Quiz with deterministic rules. Live AI generation is not configured.” NPC chat/provider là tính năng tách biệt.
- Onboarding không đề xuất herbs, supplements hoặc therapies. Khám phá chúng vẫn thuộc NPC trong game và chỉ thêm vào Plan thành revision mới qua xác nhận rõ ràng.

## Nội dung và độ phủ

| Topic | Hiện có | Kết luận |
|---|---|---|
| Gout / uric acid | 6 habit candidates source-grounded, gắn NIAMS/ACR; TEST ONLY, không human-reviewed | Chỉ test UX/safety, chưa phải nội dung được duyệt |
| Sleep / Insomnia | 4 routine candidates gắn NHLBI; TEST ONLY, không human-reviewed | Chỉ test UX, chưa phải nội dung được duyệt |
| Type 2 Diabetes | Không có habit template đã duyệt/test trong thư viện hiện tại; Catalog exact-topic được dùng nếu hợp lệ | Coverage gap; không tự sinh lời khuyên |
| Migraine | Không có item phù hợp hiện tại | Coverage gap |
| Weight Management | Không có item phù hợp hiện tại | Coverage gap |
| General Wellness | Không có template mặc định; chỉ lấy Catalog có topic mapping phù hợp | Coverage gap trừ khi Catalog có nguồn/review hợp lệ |

Tham chiếu trong fixtures: [NIAMS Gout](https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take), [ACR 2020 Gout Guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC10563586/), [NHLBI Healthy Sleep Habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits). Nguồn tham khảo không đồng nghĩa với phê duyệt biên tập HealthClues.

## Safety và dữ liệu

- Quiz G06 là hạn chế đồ ăn/đồ uống, không phải đánh giá hạn chế dịch; `fluidRestriction` hiện được đặt `unknown`. Không có target 2 L hay target dịch mặc định.
- Movement bị chặn khi có đau cấp/hạn chế đã báo; nếu chưa biết, không thể kích hoạt từ template. Alcohol reduction yêu cầu làm rõ nguy cơ; không có gợi ý ngừng đột ngột.
- Candidate source-grounded chỉ khả dụng trong Owner Demo và hiển thị TEST ONLY. Production API trả về editorial-review-required/rỗng. Không đổi nội dung thành reviewed.
- Candidate chung không chứa thảo dược, thực phẩm chức năng hay phác đồ điều trị; bộ lọc Catalog và validator mục tiêu cá nhân chặn các mục có nhãn này trong onboarding. Personal goal khác vẫn tự tạo, riêng tư và unreviewed.
- Profile/World ownership, encrypted pending handoff và revision persistence được tái sử dụng; không ghi production, không migration.

## Kiểm thử thực thi

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Wellness Plan unit | PASS | `node --experimental-strip-types scripts/test-healthclues-wellness-plan.mjs` — 41 assertions gồm sáu topic, exact-topic retrieval/Journey mismatch, cá nhân hóa, coverage gaps, goal target, safety gates và chặn herbal/therapy trong onboarding |
| Isolated Next production build | PASS | `npm run build:healthclues:isolated` exited 0; compile, TypeScript, 79 static pages and route table succeeded. Build ran in a guarded isolated temp directory; baseline/root `.next` artifacts were preserved. |
| Focused ESLint | PASS | ESLint trực tiếp bằng Node trên 6 file nguồn/API liên quan; 0 lỗi/cảnh báo sau khi sửa `prefer-const` và unused import. Shim `npx.ps1` ban đầu bị Execution Policy chặn; không bypass. |
| Quiz safety regression | PASS | `node scripts/test-healthclues-quiz-safety.mjs` — 38 assertions. |
| Documentation guard | PASS | `npm run docs:healthclues:check -- --files ... --docs ...` after adding the required universal plan use case. |
| Authenticated browser / persistence / account isolation | BLOCKED | Không chạy trên build mới. Read-only owner-demo preflight thất bại tại `supabase status` do Codex Docker API access denied. Ngoài ra `.env.local` cấu hình Supabase non-loopback; không dùng để ghi. |
| Screenshots desktop/mobile | NOT CAPTURED | Cần browser QA trên build mới |
| Live AI | NOT USED | Không có provider call/credential được bật |
| Production | UNTOUCHED | Không deploy, không ghi production. Các demo cũ trên 3249/3254/3257/3258 không bị dừng/ghi đè; 3259 đang trống nhưng không khởi chạy do không chứng minh được runtime local Auth key/config an toàn. |

## Xác minh môi trường trước ghi

Owner đã cung cấp bằng chứng Docker trước đó về project `healthclues-owner-demo`, container DB healthy, volume persistent, API `127.0.0.1:54321`, Mailpit `127.0.0.1:54324`. Trong lượt này, HTTP Auth health và Mailpit trả 200, nhưng đây chỉ chứng minh endpoint có phản hồi, không gắn ứng dụng với đúng project. Preflight read-only hiện trả `dockerAccessDenied=true` cho `supabase status`. Kiểm tra tên biến không in secret cho thấy `.env.local` trỏ tới Supabase non-loopback, vì vậy không bật browser write tests bằng cấu hình này. Không đọc/hiển thị credentials, không reset volume, không tạo user/World.

## Files đã sửa

- `src/features/healthclues/wellness-plan.ts`
- `src/components/healthclues/WellnessPlanBuilder.tsx`
- `src/lib/healthclues-quiz.ts`
- `scripts/test-healthclues-wellness-plan.mjs`

API Plan, pending handoff và wellness-habits API hiện có được giữ nguyên; cần E2E xác nhận lại.

## Việc còn lại

1. Owner chạy launcher đã được duyệt trong terminal thông thường hoặc cấp quyền read-only Docker phù hợp cho Codex; xác minh effective app Supabase origin là loopback 54321 và local Auth key thuộc đúng project trước khi tạo tài khoản.
2. Khởi chạy build mới trên port chưa dùng, không chạm 3249/3254/3257/3258; thực hiện browser E2E cho Gout, Sleep, exact-topic Catalog, unsupported topic, Plan save/reload, hai account và desktop/mobile.
3. Capture/inspect screenshot desktop/mobile từ build mới và thêm paths cùng kết quả thật vào báo cáo.
4. Diabetes, Migraine, Weight Management và General Wellness cần content/source/review thích hợp trước khi được trình bày như recommendation đã duyệt.

Không đánh dấu Phase 10A universal advisor ACCEPTED cho tới khi browser persistence/isolation/visual tests thực sự chạy và các candidate production được review. Hiện không có URL demo build mới hoặc screenshot trong lượt này.
