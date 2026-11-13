# HealthClues Phase 10A — nghiệm thu Wellness Plan Builder

Ngày: 2026-10-30  |  Consumer UI: English  |  Báo cáo: Vietnamese

## Kết quả tổng quan

**Trạng thái: PARTIAL / BLOCKED cho browser và database acceptance.** Source đã nối plan sau Quiz vào flow hiện hữu; quy tắc thuần và isolated build đã có bằng chứng. Chưa xác minh persistence thực tế hoặc gameplay browser, nên chưa đáp ứng định nghĩa hoàn tất end-to-end. Không dùng Supabase production, không deploy, không áp migration và không ghi dữ liệu trong lượt này.

## Thay đổi source

- New: src/features/healthclues/wellness-plan.ts — lọc/rank deterministic từ Catalog, giải thích dựa tag/profile, cổng safety cho urgent/acute movement/unknown movement/fluid restrictions và custom goal.
- New: src/components/healthclues/WellnessPlanBuilder.tsx — card gợi ý, I can do this, Save for later, Skip, chọn lịch, Add My Own Goal với tiêu chí tiến độ, review/confirm/skip. Catalog thiếu thì empty/error state rõ ràng.
- Updated: src/components/healthclues/HealthCluesQuiz.tsx — mở bước builder từ reveal, bỏ qua được, trạng thái plan truyền sang Preview.
- Updated: src/components/healthclues/HealthCluesWorldPreview.tsx và src/lib/healthclues-pending-journey.ts — gói plan đã confirm trong pending handoff hiện có.
- Updated: src/app/api/healthclues/pending-journey/route.ts — xác thực/chuẩn hóa payload plan trong cookie AES-GCM HttpOnly; plan không ghi localStorage/URL.
- New: src/app/api/healthclues/plan/route.ts — GET/POST auth, verified email, owner World, Catalog current-version/review/demo/safety gates, idempotency tuần tự và lưu version vào profile JSONB hiện hữu.
- Updated: src/app/api/healthclues/world/route.ts, src/features/healthclues/WellnessWorldGame.tsx, src/features/healthclues/WorldAdventureScene.tsx — tải plan trong cùng World và hiển thị Daily Care preview ở Camp; ngày chưa ghi nhận ghi đúng là Not recorded, không suy ra thất bại.
- New: scripts/test-healthclues-wellness-plan.mjs — unit test an toàn/lọc/ranking.

## Dữ liệu, quyền và quyết định

Không thêm migration/bảng. Dùng profile JSONB hiện tại với revision gắn worldId, requestKey, version, confirmedAt và danh sách goal. History giữ tối đa 40 revision. Tài khoản guest chỉ có state trong React; pending auth giữ cookie mã hóa đã có. API lấy owner từ phiên, kiểm tra World thuộc owner và xác nhận email. Catalog goal active phải còn reviewed/active/recommendationEligible/personalizationEligibility eligible, loại nội dung cho phép, evidence version đúng; fixture demo bị chặn ngoài Owner Demo. Custom goal được đánh dấu USER-CREATED / NOT REVIEWED, không vào Catalog.

**Rủi ro còn mở:** JSONB PATCH chưa transaction hóa cho hai POST đồng thời; request key xử lý retry tuần tự nhưng race đồng thời chưa test. Không có target nước/giờ ngủ/thời lượng phổ quát. Không auto-equip. Movement active bị chặn ở acute joint pain hoặc restriction; thiếu thông tin cần self-report xác nhận, không phải medical clearance. Hồ sơ cũ thiếu safetyContext được coi là unknown.

## Ma trận bằng chứng

| Hạng mục | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| Recommendation filtering, ranking, reason | PASS — unit | Chỉ candidate catalog hợp điều kiện; không fallback bịa nội dung. |
| Safety/personal-goal gates | PASS — unit | 13 assertions gồm acute joint, urgent, unknown restriction, fluid target, medication change, abrupt alcohol cessation. |
| Gout playbook | PASS — unit | 8 assertions hiện có. |
| Personalized recommendation regression | PASS — unit | Existing script PASS; là rule suite, không browser. |
| Isolated Next production build | PASS | Isolated Next production build sau các thay đổi API cuối PASS: compile, TypeScript, static generation và toàn bộ routes. |
| TypeScript root command | NOT PASS / stale tooling | Root .next/types/validator.ts báo Route union “never”; isolated build TypeScript phase thành công ở build cuối. |
| ESLint | PASS | Focused ESLint trên các source Phase 10A đúng path PASS, 0 lỗi. |
| Quiz → Builder UI browser | NOT VERIFIED | Không chạy trên source mới. |
| Confirm → authenticated World → reload | BLOCKED | Không được ghi DB cho đến khi local Supabase identity xác minh. |
| Two-account isolation / DB readback | BLOCKED | Chưa thực hiện. |
| Desktop/mobile screenshots | NOT CAPTURED | Không có browser run trên source mới. |
| Production | NOT TESTED / untouched | Không deploy, không credentials production. |

## Chính xác blocker và môi trường

Các Owner Demo listener hiện có lúc audit: 3249, 3254, 3257; Supabase local/Mailpit listener 54321–54325. Read-only GET tới catalog trên 3249/3254/3257 trả HTTP 200 và 14 mục mỗi endpoint (fixture local hiện có); điều này xác nhận catalog phục vụ được nhưng không xác nhận DB project/volume identity. Không thay/kill các process. Lệnh Docker inspect/exec bị từ chối quyền truy cập Docker named pipe (permission denied); do đó không thể kiểm tra service/database identity như yêu cầu safety. Không tiến hành write-enabled browser flow, migration, reset hay bypass permission. Đây là blocker của môi trường, không phải bằng chứng DB bị hỏng.

URL được ghi nhận trong CURRENT_STATE trước lượt này là http://127.0.0.1:3257/play; ports hiện hoạt động nhưng đang dùng build có sẵn và không xác minh source Phase 10A mới. Vì vậy không giao URL đó như bản demo Phase 10A đã nghiệm thu.

## Phase 10B/10C — thiết kế בלבד

- Phase 10B: My Wellness Home đọc goal revision đang active, Daily Care đọc lịch/target/progress từ plan nhưng historical events vẫn thuộc check-in hiện tại; Pet/house cosmetic chỉ phản ánh user-confirmed records.
- Phase 10C: Personal Challenges dùng goal definition/version, flexible schedule, không phạt ngày nghỉ; XP chỉ cho Knowledge, không cho medication/hydration/symptom outcomes. Thử thách và Boss reset chưa được thực hiện.

## Việc tiếp theo chính xác

1. Có quyền đọc Docker engine local để xác nhận project id healthclues-owner-demo, volume/database identity, loopback ports — không xóa/reset volume.
2. Rebuild source cuối, chạy browser Chromium flow mới: Sleep + Gout; accept/adjust/skip/custom/empty plan; verified email qua Mailpit; POST/GET cùng World sau reload; guest skip; hai owner không đọc chéo; desktop 1440×900 và mobile 390×844 screenshot.
3. Nếu đồng thời write race là tiêu chí production, chuyển lưu revision JSONB sang RPC transaction/additive migration sau local backup và isolation test; chưa thực hiện trong phiên này.

Không tuyên bố Phase 10A FULL PASS cho tới khi các acceptance browser/database bị chặn ở trên được thực hiện.

## Cập nhật Phase 10A.1 — phục hồi Docker/local DB — 2026-10-30

### Owner Demo đang chạy — giữ nguyên

- 3249 — PID 24968 — app-build-final-a10.
- 3254 — PID 25768 — app-build-personalized-delivery.
- 3257 — PID 26508 — app-build-lumi-mailpit.

Không process nào bị dừng/ghi đè. Chưa khởi động build 10A mới vì cấu hình DB chưa được xác minh.

### Docker chỉ đọc: kết quả và giới hạn

- docker context ls: Access denied khi mở C:\Users\Admin\.docker\config.json và context metadata.
- docker --context desktop-linux info/ps: không đọc được contexts/meta/.../meta.json.
- docker --context default ps / compose ls: permission denied khi kết nối npipe:////./pipe/docker_engine.
- Một lần docker info ghi Docker Desktop 29.3.1; lần chạy lại cho trường rỗng. Không dùng kết quả chập chờn để xác nhận daemon/container.
- com.docker.backend.exe tồn tại; com.docker.service Stopped/Manual; WSL liệt kê Ubuntu và docker-desktop. ACL của docker config liệt kê SYSTEM, Administrators và ADMIN-PC\Admin FullControl; tuy nhiên lệnh Docker trong Codex báo Access denied. Có dấu hiệu bị giới hạn bởi execution context hoặc Docker context/pipe; chưa xác nhận terminal owner thông thường có hoạt động.
- Không đổi ACL/context, không bypass sandbox và không yêu cầu quyền rộng.

### Nhận diện Supabase/email

Cấu hình không bí mật App/.tmp/healthclues-owner-demo/supabase/config.toml ghi project id healthclues-owner-demo, Auth/REST 54321, DB 54322, Mailpit 54324, SMTP 54325. Nhưng Docker compose labels, container project identity, mapped volume và database identity chưa đọc được. Listener/HTTP Catalog không thay cho xác minh DB. Chưa xác minh runtime Mailpit/Auth cho lượt này. Do đó chưa chạy E2E có ghi dữ liệu.

### Lệnh read-only tối thiểu cần owner chạy

Chạy từ PowerShell thường khi Docker Desktop hoạt động; chỉ gửi output của các lệnh dưới đây. Chúng không in biến môi trường, secret, JWT hay database rows:

```powershell
docker context ls
docker --context desktop-linux info --format 'Name={{.Name}} Version={{.ServerVersion}} OS={{.OperatingSystem}}'
docker --context desktop-linux ps -a --format 'table {{.Names}}`t{{.Image}}`t{{.Ports}}`t{{.Labels}}'
docker --context desktop-linux compose ls
$ids = docker --context desktop-linux ps -aq --filter 'name=supabase_db_healthclues-owner-demo'
if ($ids) { docker --context desktop-linux inspect $ids --format '{{.Name}} project={{index .Config.Labels "com.docker.compose.project"}} service={{index .Config.Labels "com.docker.compose.service"}} ports={{json .NetworkSettings.Ports}} mounts={{range .Mounts}}{{.Name}}:{{.Destination}};{{end}}' }
docker --context desktop-linux volume ls --filter 'label=com.docker.compose.project=healthclues-owner-demo' --format 'table {{.Name}}`t{{.Labels}}'
```

Không gửi docker inspect Env, docker compose config hoặc bất kỳ output có credential nào. Nếu context trên máy owner có tên khác, gửi tên context và kết quả lệnh tương đương chỉ đọc bằng context đó.

### Ma trận acceptance cập nhật

| Hạng mục | 10A.1 |
|---|---|
| Docker root cause | PARTIAL — backend/WSL tồn tại; CLI từ Codex bị deny đọc config/context/named pipe; terminal thường chưa xác minh |
| Local DB identity/volume preservation | BLOCKED — compose labels, DB container và mounts chưa inspect |
| Updated build URL | BLOCKED — chưa start để tránh nhắm DB sai hoặc ghi đè process |
| Gout/Sleep authenticated E2E | BLOCKED — không chạy write-enabled flow trước identity verification |
| Persistence/two-account/expired/retry | BLOCKED — chưa thực hiện |
| Desktop/mobile screenshots | NOT CAPTURED cho Phase 10A |
| RPG regression trên build mới | NOT RUN; kết quả cũ là evidence lịch sử |

Owner action nhỏ nhất: chạy các lệnh read-only ở trên và gửi context, Docker daemon version, project/service labels, ports, volume name và mount destinations. Không cần gửi secret. Sau khi identity khớp Owner Demo cô lập, mới tiếp tục browser E2E. Phase 10A chưa ACCEPTED; không bắt đầu Phase 10B.


## Phase 10A.2 — Browser acceptance trên Owner Demo mới — 2026-10-30

### Kết luận

**ACCEPTED cho hành trình Phase 10A chính trong môi trường local cô lập.** Không đồng nghĩa production-ready: fixtures vẫn TEST ONLY/not human-reviewed; không deployment hoặc production write.

### Môi trường được xác minh

- Owner cung cấp Docker read-only evidence: context `desktop-linux`, Docker Engine `docker-desktop`, compose/Supabase project `healthclues-owner-demo`, DB container healthy, volume `supabase_db_healthclues-owner-demo` mount tại `/var/lib/postgresql/data`.
- Launcher `--reuse-existing-supabase` lấy runtime config từ Supabase CLI nhưng chỉ in trạng thái không nhạy cảm. Lượt này xác nhận API `http://127.0.0.1:54321`, Auth health/settings, REST Catalog, Mailpit `http://127.0.0.1:54324` đều phản hồi. Không ghi cấu hình production; không thay đổi container/volume.
- Build source mới: `app-build-phase10a-20261030`, [http://127.0.0.1:3258/play](http://127.0.0.1:3258/play). Port 3249, 3254, 3257 và PID tương ứng không bị thay thế. Không chạy migration hoặc seed trong lần launch này.

### Kết quả chạy thật

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Gout Quiz → Plan | PASS | Chromium: giữ topic Gout/Uric Acid; hiển thị 5 candidate hiện có, lý do/evidence TEST ONLY; không đặt target 2L/11PM/15 phút mặc định. |
| Nhận/chỉnh/bỏ | PASS | Chọn 2 mục tiêu; lịch một mục được chỉnh thành 3 ngày/tuần; bỏ qua một mục; custom goal “Reduce sugary drinks for three days”. |
| Safety/custom | PASS | “Drink 2 liters of water every day” bị từ chối do fluid restriction chưa biết; sau đó mục tiêu tự chọn an toàn được thêm, xem Review và xác nhận. |
| Auth và Plan persistence | PASS | Local OTP được nhận qua Mailpit; callback khớp pending handoff; World/Plan API đọc được; cùng World ID và Plan version sau reload. |
| Idempotency | PASS | Gửi lại cùng requestKey và goals trả `reused=true`, không tạo revision thứ hai. |
| Sleep | PASS | Topic Sleep & rest chọn wind-down; candidate khác Gout; local email verification; Plan/World cùng tồn tại sau reload. |
| Account isolation | PASS | Hai user và World ID khác nhau; Guest Plan GET=401; account A đọc World B=404; account B đọc/ghi World A=404. |
| Daily Care handoff | PASS | Camp hiển thị 3 goal đã xác nhận với trạng thái “Not recorded today”; ảnh desktop/mobile. |
| RPG regression | PASS | `node scripts/test-healthclues-owner-auth-demo.mjs` trên URL 3258: hai Region, NPC, Collection, Backpack/replace, Care Plan, Daily Companion, Knowledge, mini-games, Skills, Boss, Rewards, persistence và reminder/Mailpit dedupe. |
| Visual/mobile | PASS | 1440×900 và 390×844 screenshots được mở xem; không tràn ngang; runtime exception=0. |
| Unit/build/lint | PASS | Wellness Plan rules 13 assertions; isolated production build thành công; focused ESLint không lỗi. |

### Phát hiện đã sửa

1. **Pending handoff cookie quá lớn:** Chromium báo `NameValuePairExceedsMaxSize`; API trước đó trả 200 nhưng browser không lưu cookie, làm callback báo account mismatch. Payload giờ được deflate rồi AES-256-GCM; có prefix version `z1.`, backward-compatible reader cho cookie cũ và giới hạn cookie mới 3500 ký tự. Browser xác nhận cookie lưu được và cả hai email callback hoàn tất.
2. **Catalog category không thuộc enum Plan:** các category chi tiết như “Breathing Awareness” không qua server validator. WellnessPlanBuilder ánh xạ category sang nutrition/movement/sleep/relaxation/mindfulness/general routine trước khi gửi; category gốc vẫn nguyên trong Catalog.

### Ảnh browser mới

- Gout Plan desktop: [phase10a-gout-plan-builder-desktop.png](previews/phase10a-gout-plan-builder-desktop.png)
- Gout Plan mobile: [phase10a-gout-plan-builder-mobile.png](previews/phase10a-gout-plan-builder-mobile.png)
- Plan Review: [phase10a-gout-plan-review-desktop.png](previews/phase10a-gout-plan-review-desktop.png)
- Custom goal: [phase10a-custom-goal-added-desktop.png](previews/phase10a-custom-goal-added-desktop.png)
- Daily Care desktop/mobile: [desktop](previews/phase10a-daily-care-preview-desktop.png), [mobile](previews/phase10a-daily-care-preview-mobile.png)
- Sleep Plan desktop/mobile: [desktop](previews/phase10a-sleep-plan-builder-desktop.png), [mobile](previews/phase10a-sleep-plan-builder-mobile.png)
- Gout World mobile: [phase10a-health-realm-world-mobile.png](previews/phase10a-health-realm-world-mobile.png)
- Sleep Valley mobile: [phase10a-sleep-valley-world-mobile.png](previews/phase10a-sleep-valley-world-mobile.png)
- Quiz Reveal, World Preview, activation overlay and corresponding desktop shots are in the same `previews` directory using the `phase10a-*` prefix.

### Files changed / evidence

- Runtime: `src/app/api/healthclues/pending-journey/route.ts`; `src/components/healthclues/WellnessPlanBuilder.tsx`.
- Safe owner-demo launcher: `scripts/start-healthclues-owner-demo.mjs` adds read-only `--reuse-existing-supabase`, skipping workspace migration, service start and fixture seed.
- Browser QA: new `scripts/test-healthclues-phase10a-browser.mjs`; updated `scripts/test-healthclues-owner-auth-demo.mjs` to continue via optional-plan skip and await each mini-game answer before the next click.
- No migration/schema/volume change. Plan continues to use owner-scoped profile JSONB revisions keyed by World ID.
- Canonical follow-up: `CURRENT_STATE.md`, `USER_FLOWS.md`, `DATABASE_DESIGN.md`, `DECISIONS_AND_ASSUMPTIONS.md`.

### Matrix and remaining limits

- **PASS:** required Gout and Sleep onboarding, real local activation, selected Plan persistence after reload, different account/World ownership, cross-account read/write denial, no core RPG regression, desktop/mobile usability.
- **NOT VERIFIED:** waiting the full 20-minute expiry period or using a synthetic expired cookie; offline/network fault injection during Plan POST; separate all-suggestions-skipped plus zero-goal persisted account case. Entire Plan skip is exercised by the RPG regression; zero-goal confirmation is not.
- Local TEST ONLY catalog is not clinical/editorial approval. Hosted email, deployed scheduler, physical-device QA, production RLS/security/release review remain outside this acceptance.
- No production data or deployment. Existing synthetic local Auth accounts/Worlds were preserved after E2E.

**Phase 10A status:** accepted for defined primary journey and browser acceptance criteria, with the above extended edge cases explicitly unverified. Phase 10B was not started.
