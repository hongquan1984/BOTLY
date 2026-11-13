# HealthClues My Journey Inventory — nghiệm thu 2026-10-31

## Master Prompt 14 continuation — build 3282

- Isolated rebuild: `HEALTHCLUES_OWNER_DEMO_BUILD_NAME=mp14-my-journey-tour-20261031`, port `3282`, existing isolated Supabase reused only after preflight. No migration, seed, volume reset or production access.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3282 node scripts/test-healthclues-owner-auth-demo.mjs` returned `result: PASS`, `runtimeErrors: 0`. It exercised no-Plan Sleep and Gout, confirmed Plan, Luna/Lumi guide identity, each real highlighted Checklist/Herbs/Practices section on desktop and mobile, tour resume/replay, NPC arrival/Talk, actual Wellness Guide practice equipment and persistence, account isolation and the broader World/RPG/Mailpit regression.
- `node --check scripts/test-healthclues-owner-auth-demo.mjs` passed. The first E2E attempt failed only at a stale test assertion expecting the previous “personal home” phrase. The assertion now checks the current approved “personal goals and selected wellness tools” copy; only the rerun is counted as PASS.
- Focused ESLint on `WorldAdventureScene.tsx` and the E2E script exited 0 with 0 errors and 3 unused-variable warnings in the existing test script (lines 438, 457, 462). The docs consistency guard passed after updating/reviewing all recommended targets. Node `fetch` verified the newest demo URL responds HTTP 200.
- Opened real Chromium images at 1440×900 and 390×844. The highlighted section remains visible in the mobile scroll sheet; all three sections remain expanded in the same panel. Samples: `reports/previews/master-prompt-14-tour-20261031/no-plan-sleep-my-journey-checklist-spotlight-desktop.jpg`; corresponding `...-mobile.jpg` for `checklist`, `herbs`, `practices`; and `no-plan-gout-my-journey-practices-spotlight-mobile.jpg`.
- No-plan narrator says no goal appears until the player confirms a Plan. Herbs narrator references Botanist and distinguishes Collection; Practices narrator references Wellness Guide and distinguishes equipping from use. Practice equipment test uses the catalog's TEST ONLY local entry; it is not reviewed health content. The Herb section remains safely empty because no eligible reviewed Botanist catalog item was available; herb equip/reload is not claimed.
- Security boundary: test script reports account isolation; tests used synthetic local accounts and local Mailpit only. Gemini inference was not attempted. Provider configured status was printed by the demo launcher, but credentials were neither inspected nor used.

## Earlier recovery evidence

## Recovery verification after PC shutdown — build 3281

- The prior build on `3275` was no longer listening. A new isolated current-source owner build was started at `http://127.0.0.1:3281/play` using `--reuse-existing-supabase --rebuild` and a unique build directory `App/.tmp/healthclues-owner-demo/my-journey-shutdown-recovery-20261031`.
- Read-only local preflight passed for project `healthclues-owner-demo`; Auth/REST/Mailpit remained on loopback (`127.0.0.1:54321` / `127.0.0.1:54324`). No migration, seed, volume reset, remote environment or production access was used.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3281 node scripts/test-healthclues-owner-auth-demo.mjs` completed `result: PASS`, `runtimeErrors: 0`. The owner-auth browser suite covered My Journey and its three non-tab sections, actual no-Plan state, guided spotlight/replay/resume for both companions, the Wellness Guide practice path, owner-scoped equip and source metadata, reload persistence, and the broader RPG/account-isolation regression. It intentionally did not invoke NPC free-text AI.
- The initial post-shutdown suite run exposed an invalid test setup: it saved `Gentle movement` then expected a Relaxation/Mindfulness fixture to be equip-eligible. The E2E now explicitly saves `Relaxation` and asserts the owner-scoped recommendations API marks the exact TEST ONLY practice eligible before clicking Equip. Product eligibility rules and server gates were not changed. `node --check scripts/test-healthclues-owner-auth-demo.mjs` and `git diff --check` passed after the test correction.
- Fresh screenshots from the passing Chromium run were opened and inspected: desktop/mobile equipped-Practices panel, My Journey spotlight, and mobile no-Plan panel. The three sections stay in one scrollable panel with no tabs; the test practice retains the visible TEST ONLY label and appears in Practices Equipped. Files: `reports/previews/owner-my-journey-npc-practice-equipped-desktop.jpg`, `reports/previews/owner-my-journey-npc-practice-equipped-mobile.jpg`, `reports/previews/no-plan-gout-my-journey-spotlight-desktop.jpg`, `reports/previews/no-plan-gout-my-journey-actual-goals-mobile.jpg`.
- Herbs remain **PARTIAL**: empty state is truthful and visible; no Botanist item passes the current safety/eligibility gate, so actual herb equip/reload persistence is not tested. No synthetic herb was added to the persistent local Catalog.
- Fantasy icon sources survived shutdown: four adapted Game-icons.net SVGs with pinned revision and CC BY 3.0 attribution. The exact requested `design/references/HEALTHCLUES_MY_JOURNEY_REFERENCE.png` path is absent. The same-named `App/references/HEALTHCLUES_MY_JOURNEY_REFERENCE.png` was opened for visual comparison; it is not represented as the missing exact-path file.
- Exact URL for this local build: `http://127.0.0.1:3281/play`. Local browser evidence only; no production/deploy claim.

## Kết quả

**Browser acceptance: PASS cho panel, tutorial, practices inventory, dữ liệu Plan, quyền riêng tư và hồi quy RPG trên Owner Demo cô lập.** Phạm vi ghi nhận riêng: chưa có Botanist herb nào đủ điều kiện trang bị trong Catalog demo hiện tại, vì vậy đã xác minh trạng thái trống đúng sự thật nhưng chưa thể nghiệm thu thao tác trang bị herb end-to-end. Không hạ thấp safety gate để làm test xanh.

- URL build đã kiểm thử: `http://127.0.0.1:3275/play`
- Supabase: `healthclues-owner-demo`, API `127.0.0.1:54321`; preflight PASS. Mailpit local `127.0.0.1:54324`.
- Fixture trang bị trong E2E mang nhãn `TEST ONLY — not human-reviewed`. Không sử dụng production, không deploy, không reset Docker volume.
- Chromium E2E: `scripts/test-healthclues-owner-auth-demo.mjs` kết thúc `result: PASS`, `runtimeErrors: 0`. Đã kiểm tra email verify qua Mailpit, hai tài khoản synthetic, World persistence, tutorial first entry/replay, điều hướng an toàn, NPC Talk, Collection, Care Plan và isolation, Backpack equip/replace/remove, Knowledge, bốn mini-game/Skills, Boss/Rewards, Daily Companion và reminder dedupe.
- NPC free-text AI bị bỏ qua có chủ đích trong E2E để không gửi hồ sơ sức khỏe ra Gemini. Không có Gemini request từ bài test này.
- Desktop 1440×900 và Chromium mobile emulation 390×844 đã chụp và mở kiểm tra. Mobile dùng một sheet cuộn độc lập; ba section cùng tồn tại, không tab/accordion; nội dung section cuối nằm dưới fold và truy cập bằng cuộn dọc.

## Dữ liệu và bảo mật

- `Daily Checklist` chỉ đọc các goal `active`/`saved` từ Confirmed Wellness Plan của World đang xác thực. Bản panel gọi rõ đây là kế hoạch, không phải nhật ký hoàn thành; không sinh streak hay completion tick.
- `Herbs Equipped` chỉ lấy record có `status=equipped`, nguồn station `nutrition` và Catalog nhận diện là herb/botanical. `Practices Equipped` chỉ lấy record equipped từ `practices` station hoặc loại practice. Collection không tự biến thành equipment.
- E2E xác minh `TEST ONLY: Mindfulness note` được chọn từ Wellness Guide, hiện trong section Practices, API trả `discovery_station=practices`, rồi vẫn còn sau reload và mở lại cùng World.
- Tomato chỉ được lưu Collection; không được trang bị như liệu pháp. Ginger còn bị eligibility gate do thiếu thông tin an toàn, nên panel herb hiển thị empty state thay vì bịa item.
- Legacy equipment không có nguồn NPC được giữ nguyên `discovery_station=null`; không backfill/suy đoán nguồn.
- Cross-account Plan read/write, inventory equip write, Care Plan/check-in isolation qua API bị từ chối; toàn bộ dữ liệu synthetic thuộc tài khoản/World cục bộ.

## UI và ảnh nghiệm thu

Ảnh được tạo từ build 3275 và được mở kiểm tra bằng công cụ ảnh:

- Desktop, ba section và goal thật: `reports/previews/my-journey-inventory-verified-final5-20261031/owner-my-journey-confirmed-desktop.jpg`
- Mobile, cùng một sheet cuộn, không tab: `reports/previews/my-journey-inventory-verified-final5-20261031/owner-my-journey-confirmed-mobile.jpg`
- Lumi spotlight nút My Journey: `reports/previews/my-journey-inventory-verified-final5-20261031/no-plan-gout-my-journey-spotlight-desktop.jpg`
- No-plan, dữ liệu rỗng chính xác: `reports/previews/my-journey-inventory-verified-final5-20261031/no-plan-gout-my-journey-actual-goals-mobile.jpg`
- Practice thực được trang bị ở Wellness Guide: `reports/previews/my-journey-inventory-verified-final5-20261031/owner-my-journey-npc-practice-equipped-desktop.jpg`
- Practice sau reload: E2E đọc lại cùng World/API và thấy `discovery_station=practices`; ảnh inventory tương ứng được lưu trước reload ở đường dẫn trên.
- Tutorial Botanist/Wellness Guide: `reports/previews/my-journey-inventory-verified-final5-20261031/no-plan-gout-botanist-spotlight-desktop.jpg` và `.../no-plan-gout-wellness-practice-spotlight-desktop.jpg`.

Ảnh desktop cho thấy World map vẫn nhận diện được cạnh drawer xanh rừng/vàng dịu; mobile hiển thị tuần tự Wellness Focus, Daily Checklist, Herbs, Practices trong cùng sheet. Không thấy tràn ngang, nút bị cắt hoặc lớp UI che drawer. My Journey icon là Lucide `Backpack`, các section dùng `ScrollText`, `Leaf`, `Flower2`/`Moon`; không tạo ảnh mới và không thay artwork map. Đường dẫn chính owner nêu `design/references/...` không tồn tại trong checkout này; ảnh đúng tên ở `App/references/HEALTHCLUES_MY_JOURNEY_REFERENCE.png` đã được mở và dùng để đối chiếu art direction.

## Thay đổi triển khai

- Dùng lại `WorldAdventureScene`, `RegionMapScene`, `WellnessWorldGame`, `BackpackExperience`, `WellnessEncyclopediaStation` và artwork hiện có.
- Panel My Journey hiển thị ba section mở liên tục, status thật, các empty state, đường dẫn View Full Plan và no-plan recovery.
- Backpack record có `discovery_station` nullable để chỉ rõ nơi người chơi thực sự chọn item. Migration additive: `supabase/migrations/20261031110000_healthclues_inventory_discovery_source.sql`; đã áp dụng từng lệnh DDL riêng trong Supabase local sau preflight. Không sửa migration lịch sử, không thay đổi record cũ.
- API toolkit xác thực station/category/slot phía server và gọi flow equipment hiện có; quyền sở hữu World và eligibility/capacity hiện hữu vẫn bắt buộc.
- Sửa E2E lỗi thời để kiểm tra rằng tutorial hoàn tất không tự chạy lại khi quay lại, đồng thời Replay guide chủ động mở lại; reload phải quay về Overworld rồi vào lại Region trước khi kiểm tra equipment.

## Ma trận

| Hạng mục | Kết quả | Bằng chứng / giới hạn |
|---|---|---|
| My Journey goal thật + đúng World | PASS | Plan/goal hiển thị theo tài khoản, có reload và account boundary |
| Ba section luôn hiện, không tab | PASS | DOM + ảnh desktop/mobile; mobile dùng cuộn dọc |
| Herbs empty state không bịa | PASS | Ginger không đủ eligibility; không có Botanist herb hợp lệ trong fixture hiện tại |
| Equip practice từ Wellness Guide | PASS | E2E + API source metadata + reload |
| Tutorial My Journey/Botanist/Wellness | PASS | Spotlight thực, target và replay được kiểm tra |
| Account isolation / gameplay regression | PASS | Full Chromium suite, runtime errors 0 |
| Trang bị herb hợp lệ end-to-end | PARTIAL | Bị chặn bởi không có Botanist fixture eligible; không nới safety để tạo PASS giả |
| Production | NOT TESTED / không triển khai | Chỉ local Owner Demo |

## Ghi chú vận hành

Build kiểm thử mới ở `3275`, không ghi đè các process cũ. Trong thao tác trước đó, launcher `--rebuild` đã ghi lại thư mục build cũ tên `app-build-my-journey-20261031`; server cũ tại `3272` không bị dừng hoặc ghi đè process. Build nghiệm thu cuối sử dụng thư mục riêng `app-build-my-journey-inventory-final-20261031`.

## My Journey guided focus mode — acceptance 2026-10-31

### Kết quả triển khai

- Tour trong panel có đúng bốn điểm theo thứ tự: Wellness Focus → Daily Checklist → Herbs Equipped → Practices Equipped. Wellness Focus được thêm vào tour mà không thay đổi Quiz/Plan hoặc trạng thái tutorial đã lưu.
- Mỗi bước đánh dấu đúng một section DOM bằng `is-tour-active`/`data-journey-tour-active`; ba mục còn lại mang `is-tour-muted` và opacity 0.38 sau transition. Mục hoạt động có viền vàng dịu/glow; ba section inventory vẫn luôn mở trong cùng panel.
- Lời Luna/Lumi được đặt liền trước target thật và test đo xác nhận không giao nhau với vùng section. Wellness Focus giải thích dữ liệu Quiz là self-reported, không phải chẩn đoán.
- Ảnh đầu tiên phát hiện map desktop bên trái drawer chưa bị làm tối. Đã thêm lớp phủ riêng trên toàn World map, phía dưới panel và chặn thao tác map khi tour panel đang chạy.
- Trên mobile, cuộn được căn theo nhóm Pet + section. ResizeObserver căn lại khi viewport đổi; E2E yêu cầu cả bubble lẫn section nằm trọn trong vùng scroll panel ở 390×844.
- Chromium E2E phát hiện callback Auth trả HTTP 500 vì `WorldAuthCallback` render `HealthCluesGameShell` không có locale provider. Route callback English nay dùng provider HealthClues hiện hữu. Đây là lỗi runtime mà suite cần để khởi tạo synthetic account; không đổi schema hay Auth policy.

### Kiểm thử và bằng chứng

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Build isolated Owner Demo | PASS | `focus-mode-myjourney-20261031`, `http://127.0.0.1:3293/play`; chỉ reuse `healthclues-owner-demo` tại loopback, không migration/seed/reset |
| Chromium owner-auth/game regression | PASS | Script `scripts/test-healthclues-owner-auth-demo.mjs`, `result: PASS`, `runtimeErrors: 0`; bao gồm hai region, no-plan/confirmed Plan, replay/resume, NPC proximity/equipment, gameplay và account-isolation checks |
| Bốn focus step | PASS | Mỗi bước đúng một active; ba inactive opacity <0.7 sau transition; Pet sát target, không overlap; map dimmer phủ map thật |
| Desktop 1440×900 | PASS | Chromium capture đã mở/kiểm tra: `reports/previews/no-plan-sleep-my-journey-focus-spotlight-desktop.jpg`, `...checklist-spotlight-desktop.jpg` |
| Mobile 390×844 | PASS | Chromium capture đã mở/kiểm tra: `reports/previews/no-plan-sleep-my-journey-herbs-spotlight-mobile.jpg`, `...practices-spotlight-mobile.jpg`; Pet và target Practices cùng nằm trọn trong panel |
| Persistence/game data | PASS | Cùng suite xác nhận world/plan/inventory persistence và account boundary; focus mode không ghi thêm trạng thái hay đổi Plan |
| Herbal item equip | PARTIAL | Demo không có Botanist herb qua safety/eligibility gate; empty state đúng, không bịa fixture |
| Thiết bị vật lý | NOT TESTED | Chỉ Chromium desktop và mobile emulation |
| Production/deployment | NOT TESTED | Chỉ loopback Owner Demo |

Các ảnh cho cả bốn focus step ở desktop/mobile, confirmed Plan/Sleep và no-Plan Gout/Lumi được tạo trong `reports/previews/` với prefix `no-plan-sleep-my-journey-`, `confirmed-plan-sleep-replay-my-journey-`, và `no-plan-gout-my-journey-`. Chỉ các đường dẫn cụ thể liệt kê ở trên đã được mở kiểm tra trực quan; không tuyên bố kiểm tra vật lý.



## Master Prompt 15 — final guided-focus acceptance — 2026-11-01

### Result

**PASS — scoped My Journey spotlight tutorial**, latest current-source local build http://127.0.0.1:3296/play, build name mp15-focus-layerfix-final-20261101.

The browser showed the defect: a body-portal shade crossed stacking contexts and visibly darkened the active section and Pet bubble. Replaced it with the existing modal backdrop as a full-viewport World shade/input shield. The Journey dialog and target now render above the shade; on mobile the shade fills the area above the bottom sheet too. Outside taps cannot dismiss the active tutorial or reach the map. Explicit close, Skip and Continue retain their existing controls.

The tour still uses the one real My Journey panel and four real sections. Every step has exactly one active warm outline and three muted sections. The real panel scroll container reveals the Pet note and target together; ResizeObserver follows target/dialogue/content resize. Long checklists scroll within the panel. The three inventory sections remain expanded in normal mode. No underlying data or persistence changed.

### Verification evidence

- Final isolated production build completed and server responds at http://127.0.0.1:3296/play.
- Reused only local Supabase project healthclues-owner-demo at 127.0.0.1:54321 via --reuse-existing-supabase for final builds; no migration/reset/volume deletion/production access/deployment.
- Final real Chromium owner-auth regression: scripts/test-healthclues-owner-auth-demo.mjs; output result PASS, runtimeErrors 0, app URL http://127.0.0.1:3296/play. Includes no Plan, confirmed Plan/replay, 10 synthetic long goals, EN/VI, Sleep Valley/Luna and HealthClues Realm/Lumi, desktop/mobile, Back/Next/Skip, map input shield, panel restoration, local Auth/Mailpit, account isolation, NPC proximity, World movement, gameplay regression.
- External Gemini/NPC free-text inference was skipped. Test-only local fixtures were not represented as human-reviewed health evidence.
- Focused ESLint: zero errors; five warnings remain (two existing img-usage warnings in RegionMapScene.tsx, three unused-variable warnings in the broad E2E harness). Production build and browser E2E passed.
- Opened and visually inspected desktop Focus, Checklist, Herbs, Practices; mobile Checklist, Herbs, Practices; Vietnamese Checklist/Herbs; and World-after-tour screenshots in reports/previews/mp15-focus-layerfix-final-20261101/. The active target and Pet text remain readable, inactive sections subdued, World dim, no overlap or unintended panel clipping.

Screenshot paths (same folder):
- no-plan-sleep-my-journey-focus-spotlight-desktop.jpg
- no-plan-sleep-my-journey-checklist-spotlight-desktop.jpg
- no-plan-sleep-my-journey-herbs-spotlight-desktop.jpg
- no-plan-sleep-my-journey-practices-spotlight-desktop.jpg
- no-plan-sleep-my-journey-checklist-spotlight-mobile.jpg
- no-plan-sleep-my-journey-herbs-spotlight-mobile.jpg
- no-plan-sleep-my-journey-practices-spotlight-mobile.jpg
- vi-sleep-my-journey-checklist-spotlight-mobile.jpg
- no-plan-sleep-world-entry-ready-desktop.jpg

### Explicit limits

- **NOT TESTED:** physical phones/tablets and production.
- **BLOCKED (separate content acceptance):** no eligible human-reviewed Botanist herb fixture exists in the local catalog. Empty state was verified; no herb was invented.
- **PARTIAL:** full HealthClues Vietnamese localization outside the guided tour is still incomplete.
- A launcher call with unsupported --help started its default isolated demo on port 3235 and reported idempotent TEST ONLY fixture seeding. No production/reset/deletion occurred. Final builds explicitly reused the already-running local Supabase without migrations or new fixture seed.
- Final demo URL: http://127.0.0.1:3296/play.