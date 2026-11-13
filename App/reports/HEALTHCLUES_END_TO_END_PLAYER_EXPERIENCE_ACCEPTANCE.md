# HealthClues — Nghiệm thu hành trình Quiz → Plan → World

## Bổ sung cuối — verified email handoff và full regression build 3269 (2026-10-31)

- **Build:** `app-build-complete-journey-note-handoff-20261031` tại [http://127.0.0.1:3269/play](http://127.0.0.1:3269/play). Preflight trước ghi test xác nhận local project `healthclues-owner-demo`, Supabase API loopback `127.0.0.1:54321`, CLI 2.122.0, Auth/REST/Mailpit reachable; không có remote Supabase environment. Reuse mode không chạy migrations/seed/reset hoặc thao tác container.
- **Lỗi được phát hiện khi test:** xác nhận email thật qua Mailpit làm rơi trường `originalNote` trong validator pending-journey; tiêu đề ghi chú còn nhưng thuộc tính gốc mất. Đã thêm validation kiểu/giới hạn 180 ký tự và bảo toàn note qua cookie mã hóa HttpOnly. Không sửa schema.
- **Quiz → World qua Mailpit:** PASS Chromium trên build 3269. Tài khoản synthetic mới hoàn tất Gout Quiz, cấu hình 2 goal, bỏ qua 1, tạo ghi chú cá nhân, review/xác nhận, đồng ý lưu, nhận link Mailpit, xác minh email, quay lại cùng origin/build 3269, tạo World HealthClues Realm và mở Lumi tutorial. API readback cho World/Plan cho thấy revision 1, 4 dòng goal (2 active đã cấu hình, 1 skipped, 1 saved draft); `originalNote` còn nguyên. Callback email khớp đúng địa chỉ synthetic. World ID khác với các tài khoản test trước. Không bypass verification.
- **Plan/coverage E2E:** PASS trên build 3269: Gout và Sleep có danh sách TEST ONLY riêng; Digestion có 0 filler và thông báo thiếu coverage; no-plan tiếp tục vào đúng playable region, không tạo Plan giả; World reload, owner-specific profile và cross-read/write Plan bị từ chối HTTP 404; runtime errors 0.
- **Full RPG regression:** PASS trên build 3269, runtime errors 0. Đã chạy hai map, 8 vùng/6 Coming Soon, avatar/Pet và đường đi an toàn, Talk tại 3 NPC từng map, Backpack equip/replace/remove, Collection, Care Plan cùng cross-account 404, Daily Companion, Knowledge, 4 mini-games/Skills sau reload, Boss/Rewards, persistent World, local Mailpit reminder sent 1/retry duplicate 0. Nhánh không có Plan hiển thị tutorial trung thực và cho phép chơi.
- **Visual QA:** các ảnh mới nhất đã mở xem: `reports/previews/post-quiz-gout-plan-mobile.png`, `post-quiz-email-activation-activation-mobile.png`, `post-quiz-email-activation-lumi-tutorial-mobile.png`; UI 390×844 không thấy cắt nút, tràn ngang hay overlay lặp. Suite lưu ảnh desktop/mobile checklist, activation, tutorial và các ảnh regression map/NPC/game. Đây là Chromium emulation; chưa kiểm tra thiết bị thật.
- **Phân loại tổng thể:** continuous local deterministic journey và RPG hiện hành browser-verified. **Sản phẩm vẫn PARTIAL** vì Codex/LLM thật chưa tích hợp (`liveLlm:false`), Gout/Sleep library còn TEST ONLY / chưa human-reviewed, Digestion chưa có coverage. Không được mô tả checklist deterministic là AI realtime, không claim production readiness.

Chi tiết lịch sử các lần chạy bên dưới vẫn là snapshot; nội dung này là bằng chứng mới nhất cho flow/acceptance local.

**Ngày:** 2026-10-31  
**Build local:** `app-build-complete-journey-visual-fix-20261031`  
**URL đã xác minh:** [http://127.0.0.1:3268/play](http://127.0.0.1:3268/play)  
**Trạng thái tổng:** **PARTIAL** — luồng local và hồi quy RPG đã browser-verified; yêu cầu Codex/LLM tạo checklist thật theo từng Quiz chưa được triển khai/kết nối, vì vậy không thể nghiệm thu đầy đủ theo yêu cầu sản phẩm.

## Môi trường và an toàn dữ liệu

- Preflight trước các test ghi dữ liệu trả `PASS`: project `healthclues-owner-demo`, Supabase CLI `2.122.0`, API `http://127.0.0.1:54321`, Auth/REST/Mailpit reachable, không phát hiện remote Supabase env kế thừa. Preflight báo có cấu hình local publishable/server key nhưng không in giá trị.
- Dùng launcher Owner Demo với `--reuse-existing-supabase`, dedicated ignored runtime config và cổng mới `3267`. Không đọc/ghi `.env.local`, không thay build cũ (3265/3266 và trước đó), không restart/reset container, migration, seed, deploy hay production write. Các thao tác dữ liệu là account/World tổng hợp mới trong project local cô lập.
- Mailpit UI: `http://127.0.0.1:54324`. Full regression xác minh email test ở Mailpit, không gửi email ngoài.

## Hiện trạng AI và nguồn nội dung

- Checklist hiện tại **không gọi Codex, LLM hay AI provider nào**. Runtime E2E JSON ghi `liveLlm: false`; màn hình nói rõ cá nhân hóa đang dùng deterministic rules và Live AI chưa cấu hình. Đây không phải “real-time AI generation”.
- Flow hiện hữu: Quiz answer → `HealthCluesProfile` có topic/preferences/goals/safety context → `hc-wellness-habits-v1`/Catalog retrieval → topic mapping + eligibility/safety filters → deterministic ranking/reason → người chơi cấu hình, chọn/bỏ qua → review/confirm → handoff mã hóa ngắn hạn → verified account + existing World → profile JSON plan revisions. Không thêm schema/migration.
- Gout: 6 template; Sleep: 4 template. Tất cả trong Owner Demo là `TEST ONLY`, source-grounded candidate, **chưa human-reviewed/approved**. Type 2 Diabetes, Migraine, Weight Management và unsupported topics không được gán nội dung lâm sàng giả; khi chưa có mapping/eligible knowledge thì hiển thị gap.
- **Lỗi đã sửa:** với Digestion không được nhận diện, `topic=null`; tag Catalog không được nhận diện cũng trả `null`, khiến điều kiện `resolve(tag) === topic` vô tình trả true. `buildWellnessPlanSuggestions` giờ fail-closed ngay nếu topic không nhận diện. Regression kiểm thử trường hợp Digestion cùng một Catalog candidate generic không liên quan.

## Vì sao URL cũ không mở Pet Tutorial

URL owner cung cấp là `/en/wellness/healthclues/quiz?from=play&step=reveal#wellness-plan`: đây vẫn là route Quiz/Reveal; `from=play` chỉ ghi attribution, không kích hoạt World. Quiz profile trước đó được giữ theo browser session, nên mở deep link trong tab mới không khôi phục được profile và component cũ không render checkpoint để đi tiếp. Không có bằng chứng một World đã được activate nhưng tutorial state tự đánh dấu hoàn tất. Đã sửa trạng thái thiếu profile thành recovery screen, không tạo checklist/plan giả, và thêm thao tác Start the Quiz. Actual Pet Tutorial được xác minh sau World activation trong Chromium trên 3268 cho Lumi/HealthClues Realm, Luna/Sleep Valley và nhánh không Plan.

## Kết quả Chromium E2E — Plan Builder

| Ca | Kết quả | Bằng chứng |
|---|---|---|
| Deep link Reveal/Plan thiếu session profile | PASS | Recovery desktop/mobile không tạo checklist giả; Start Quiz hoạt động. |
| Gout | PASS local | Quiz → checklist → cấu hình/điều chỉnh/lưu/bỏ qua → personal note → review → activation/world → Quests/Plan → reload; plan revision `8`, 4 goal, World ổn định. Fixture vẫn TEST ONLY. |
| Sleep | PASS local | Quiz tạo danh sách khác Gout → xác nhận → Sleep Valley/Luna → reload; plan revision `1`, 4 goal, World ổn định. Fixture vẫn TEST ONLY. |
| Digestion & Gut Health | PASS coverage behavior | Không có card; hiện gap trung thực; Skip tiếp tục activation với `plan: null`; profile topic được giữ qua owner-scoped REST; vào HealthClues Realm, Lumi xuất hiện. |
| Chủ sở hữu/cách ly | PASS local | Synthetic users/Worlds khác nhau; đọc chéo plan `404`, ghi chéo `404`. |
| LLM/provider | BLOCKED | Không có invocation thật; không sử dụng static fallback để giả làm AI. |
| Xác minh email cho cùng Quiz E2E | PARTIAL | Plan E2E dùng synthetic session đã xác minh sẵn để kiểm thử activation/World; xác minh email local/Mailpit được chạy riêng trong full RPG regression. Không khẳng định một tài khoản đã đi trọn Quiz-to-Mailpit trong cùng test. |

Log E2E xác nhận `runtimeErrors: 0`. User-generated note là draft giữ nguyên original note, không bịa target/lịch hay tự active. Hydration không gán mặc định 2 lít; nếu thiếu thông tin, safety giữ trạng thái chưa đủ điều kiện.

## Kết quả full RPG regression

`HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3267 node scripts/test-healthclues-owner-auth-demo.mjs` trả `result: PASS`, `runtimeErrors: 0`.

- Local Auth/Mailpit; welcome/tutorial có plan rỗng cho Luna và Lumi; hai region playable; tám region vẫn hiển thị, sáu Coming Soon.
- Đi bộ theo path và NPC Talk sau khi đến gần; Pet follow; Backpack equip/replace/remove; Collection; Care Plan và chặn truy cập account khác (`404`); Daily Companion/check-in.
- Knowledge, bốn mini-game và Skills giữ XP sau reload; Boss và Rewards; World ID ổn định.
- Reminder local được gửi một lần tới Mailpit (`sent: 1`, lần lặp gửi `0`); không có email ngoài.

Đây là E2E full regression trên build mới; không chứng minh production delivery, review lâm sàng hay physical-device QA.

## Ảnh đã mở và kiểm tra

- Checklist Gout: `reports/previews/post-quiz-gout-plan-desktop.png`, `post-quiz-gout-plan-mobile.png`.
- Coverage gap Digestion: `reports/previews/post-quiz-digestion-coverage-gap-desktop.png`, `post-quiz-digestion-coverage-gap-mobile.png`.
- Lumi first-entry, no plan: `reports/previews/post-quiz-digestion-world-tutorial-desktop.png`, `post-quiz-digestion-world-tutorial-mobile.png`.
- Bộ ảnh gồm Reveal, review, activation, plan, tutorial, map, NPC và mobile regression: `reports/previews/post-quiz-gout-*`, `post-quiz-sleep-*`, `no-plan-gout-*`, `no-plan-sleep-*`.

Đã mở ảnh desktop `1440×900` và mobile emulation `390×844`: card/layout không tràn ngang; coverage gap/action controls rõ khi cuộn; game scene và Pet thấy phía sau tutorial. Review ảnh cho thấy Pet mobile ban đầu hơi nhỏ; đã tăng khung Pet tutorial lên khoảng 96 px, assertion Chromium kiểm tra rendered width ≥90 px, và ảnh mới được mở lại để xác nhận overlay vẫn vừa màn hình. Mobile screenshot là Chromium emulation, không phải thiết bị vật lý. Không có lỗi vỡ giao diện nghiêm trọng được thấy trong các ảnh đã kiểm tra.

## Trạng thái nghiệm thu

| Hạng mục | Trạng thái |
|---|---|
| Build source mới, local Supabase preflight | PASS |
| Wellness-plan rules/safety tests | PASS — 42 assertions |
| E2E Quiz/Plan/World và Digestion fail-closed | PASS — Chromium build 3268, 3 synthetic journeys, errors 0 |
| Full RPG regression | PASS — Chromium build 3268, errors 0 |
| Desktop/mobile visual check | PASS cho ảnh đã kiểm tra; physical mobile NOT RUN |
| RLS/account isolation | PASS trong test local: cross-read/write 404 |
| Codex/LLM real-time generation | BLOCKED / NOT IMPLEMENTED |
| Human-reviewed recommendation coverage | BLOCKED; fixtures TEST ONLY |
| Toàn bộ yêu cầu Continuous Experience | **PARTIAL** |

## File source/spec đã cập nhật trong lượt này

- Source: `src/features/healthclues/wellness-plan.ts` (fail-closed topic guard); `src/features/healthclues/world-adventure.css` (Pet tutorial mobile framing); `src/components/healthclues/WellnessPlanBuilder.tsx`, `src/components/healthclues/HealthCluesQuiz.tsx`, `src/app/api/healthclues/plan/route.ts` (compact disclosure, note draft, recovery/continue behavior đã có trong integrated build).
- Tests: `scripts/test-healthclues-wellness-plan.mjs`; `scripts/test-healthclues-post-quiz-plan-browser.mjs`.
- Docs: `CURRENT_STATE.md`, `HEALTHCLUES_CONTEXT.md`, `BUSINESS_RULES.md`, `UI_UX_SPEC.md`, `USER_FLOWS.md`, `DECISIONS_AND_ASSUMPTIONS.md`, báo cáo này.

## Việc còn lại chính xác

1. Cung cấp provider AI thật có adapter server-only, privacy/consent phù hợp và được an toàn giới hạn; mỗi Quiz request phải có invocation evidence và lỗi provider phải hiện lỗi thật, không fallback giả danh AI.
2. Bổ sung và có editorial approval cho wellness knowledge theo từng topic trước khi bỏ nhãn TEST ONLY. Digestion hiện chưa có nội dung nên không hiển thị gợi ý.
3. Chạy lại cùng flow sau khi có provider và nội dung được duyệt; kiểm thử trọn email verification trong cùng một Quiz-to-World journey và thử thiết bị mobile vật lý.

Không bắt đầu My Wellness Home, challenge/Boss mới hoặc deploy production.
