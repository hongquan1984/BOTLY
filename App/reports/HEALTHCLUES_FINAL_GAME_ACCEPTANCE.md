# Nghiệm thu tích hợp cuối — Lumi, cá nhân hóa Journey và reminder — 2026-10-30

## Kết quả: phần triển khai local PASS; tổng thể sản phẩm PARTIAL

**Demo đã xác minh:** [http://127.0.0.1:3257/play](http://127.0.0.1:3257/play), build `app-build-lumi-mailpit`. Supabase local `127.0.0.1:54321`; Mailpit `127.0.0.1:54324`. Giữ nguyên volume hiện có. Không ghi production, không deploy.

### Đã triển khai và dùng lại

- Nickname Unicode tùy chọn, riêng tư, qua API `/api/healthclues/profile` có xác thực; lưu trong profile Quiz hiện tại, không yêu cầu tên thật.
- Gout playbook xác định ba bối cảnh tự khai: cấp tính, quan tâm dài hạn, tìm hiểu chung. Không coi đây là chẩn đoán.
- Guide state hiện có thêm `toolkit_summary`, `reminder_setup` bằng migration additive `20261030130000_healthclues_guided_summary_reminders.sql`. Dùng lại Region Map, NPC, World, Catalog, Collection, Backpack, Care Plan, Daily Companion, Knowledge và Rewards.
- Toolkit Summary đọc dữ liệu owner hiện tại; phân biệt Backpack 0–3 món, Collection không giới hạn, và Care Plan tự khai báo. Người chơi được bỏ trạm, để trống Toolkit và bỏ reminder.
- NPC chat có UI và adapter server-side dùng Catalog retrieval, allowlist vai trò, giới hạn input/timeout và consent. Provider trả phí chỉ chạy khi có cờ feature, key/model server-only và phê duyệt chi phí. Owner Demo tắt AI; browser thấy trạng thái chưa cấu hình. Không gọi AI thật, không giả nội dung mock là AI. Rate/cost metering bền vững chưa hoàn thiện.
- Reminder dùng migration `20261030140000_healthclues_mailpit_reminder_delivery.sql` và queue có sẵn. Chỉ `HEALTHCLUES_OWNER_DEMO=1` cùng provider `mailpit` mới bật; đích gửi hard-code `127.0.0.1:54324`, có local random worker token. Nhánh `mock` hiện hữu giữ nguyên; không có production provider/scheduler nào được bật.

### Browser và test có bằng chứng

Lệnh `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3257 node --experimental-strip-types scripts/test-healthclues-owner-auth-demo.mjs` trả **`result: PASS`**, `runtimeErrors: 0`. Chromium xác minh Auth email qua Mailpit; Sleep/Gout Worlds; nickname; guide resume khi reload; tuyến đi/Talk tới NPC; nội dung TEST ONLY, detail và nguồn; Collection; Care Plan riêng tư; ba Backpack slots, replace và DB readback; Knowledge, mini-games, Skills, Boss/Rewards, Pet follow, World persistence và chặn đọc chéo account. Tài khoản synthetic đã đồng ý reminder; mô phỏng thời điểm đến hạn cho kết quả `queued: 1`, `claimed: 1`, `sent: 1`; thư Mailpit generic không lộ Journey/Care Plan; chạy worker lại `sent: 0`, chỉ có một reminder; pause được lưu và trạng thái delivery đọc lại từ API. Worker không xác thực trả 401.

Test tập trung: playbook PASS (8 assertions); personalization PASS; E2E syntax PASS; ESLint 0 lỗi và 3 cảnh báo `<img>`; isolated Next build PASS. Các lần chạy đầu phát hiện assertion text trạm cũ, đếm chung email Auth với reminder, và nickname test chứa chữ “Gout”; đã chỉnh test rồi chạy lại full E2E PASS.

### Ảnh chụp

- [Nickname prompt](previews/first-time-player-nickname-prompt.jpg)
- [Toolkit Summary desktop](previews/owner-guided-toolkit-summary.jpg) — đã mở kiểm tra, ba cột phản ánh Backpack/Collection/Care Plan thật
- [Toolkit Summary mobile 390×844](previews/owner-guided-toolkit-summary-mobile.jpg) và [Reminder Setup mobile 390×844](previews/owner-reminder-setup-mobile.jpg) — nội dung cuộn trong panel, không tràn ngang
- [HealthClues Realm desktop](previews/owner-two-region-health-gout-desktop.jpg), [1920×1080](previews/owner-two-region-health-gout-map-1920x1080.jpg), [390×844](previews/owner-two-region-health-gout-mobile.jpg)
- [Botanist](previews/owner-botanist-populated-cards.jpg), [Activity Trail](previews/owner-activity-trail-populated-cards.jpg), [Wellness Sanctuary](previews/owner-wellness-sanctuary-populated-cards.jpg)
- [Backpack/replacement](previews/owner-backpack-three-tools-replacement.jpg), [Daily Companion desktop](previews/final-companion-checkin-desktop.jpg), [mobile](previews/final-companion-checkin-mobile.jpg)

### Chưa xác minh / giới hạn
- Weekly Reflection aggregation and Weight/Migraine playbooks are not implemented in this continuation.

- UI reminder chưa browser-click test đầy đủ edit/resume/disable; E2E xác minh opt-in, pause và readback qua API. Screenshot mobile dùng viewport emulation, chưa phải thiết bị vật lý.
- Nếu worker dừng sau khi queue row được claim nhưng trước cập nhật trạng thái, có thể còn `claimed`. Chưa có stale-claim recovery vì kết quả gửi ngoài DB có thể chưa rõ; không tuyên bố exactly-once qua crash. Lần chạy worker lặp sau ghi nhận `sent` không gửi trùng.
- Cloud scheduler độc lập máy cá nhân và provider email production chưa triển khai/cấu hình/xác minh. AI provider thật, cost/abuse reporting bền vững, chuyên gia review content, physical-device/performance và production security/release review đều NOT VERIFIED. Fixture TEST ONLY không phải phê duyệt y khoa/editorial.
- Tổng trạng thái vẫn **PARTIAL, không FULL PASS và chưa sẵn sàng production**. Không deploy production.

## Việc tiếp theo chính xác

Tiếp tục cùng assignment: kiểm tra browser toàn bộ guide/Summary/reminder controls ở 390×844, gồm edit/pause/resume/disable; xác định cách xử lý stale claim tránh gửi trùng; giữ scheduler/provider production tắt đến khi chủ dự án cấu hình và phê duyệt.
# HEALTHCLUES FINAL GAME ACCEPTANCE — Backpack & Toolkit integrated run — 2026-10-30

## Personalized wellness engine — nghiệm thu local cuối — 2026-10-30 — PASS phạm vi demo / tổng thể PARTIAL

### Kết quả triển khai

- Dùng chung Quiz/profile và Catalog RPG hiện có; không thêm recommender thứ hai, LLM hoặc câu Quiz bắt buộc. Engine xác định `hc-personalized-rules-v1` đọc topic/goals/preferences/time, safety context ba trạng thái, thiết bị Backpack, Collection, phương thức người dùng track trong Care Plan và lịch sử/feedback. Candidate đến từ Catalog item đang active/current-version; ranking giải thích được, có tie-break ổn định, giảm lặp cho mục đã equip/track/save/shown/dismissed; không cố lấp ba slot.
- Safety là hard gate: unknown không đồng nghĩa “không”; acute painful Gout không cho eligible movement; Ginger cần medication context không đủ điều kiện khi thông tin unknown; Tomato là giáo dục chung, không gắn Gout và không Equip. Catalog thiếu topic tag không được hiểu là khớp mọi Journey. Urgent answer đưa thông báo tìm đánh giá chuyên môn. Không có chẩn đoán, liều lượng hay tuyên bố điều trị.
- API GET/POST/PATCH xác thực owner + World, server reads và no-store. PATCH chỉ nhận preference/time whitelist. Migration additive `20261030120000_healthclues_recommendation_history.sql` tạo `healthclues_recommendation_events`, bật RLS và thu hồi client grants. Lịch sử tối thiểu gồm owner/World/item version/event/reason/feedback/rules version/idempotency; không snapshot Quiz/safety, tên thuốc hay note.
- Luna/Lumi và 3 NPC dùng chung service. Panel có card optional với reason/evidence/safety/TEST ONLY, Explore-to-walk, Save, Not interested, feedback khó khăn/thiếu thời gian/yêu cầu phương án khác, Equip chỉ theo server eligibility. Collection không tự equip; Daily Companion không tự thay Backpack.

### Browser, DB và ảnh kiểm chứng

- Isolated production-mode Owner Demo build `app-build-personalized-delivery` được dựng và chạy tại [http://127.0.0.1:3254/play](http://127.0.0.1:3254/play). Supabase `healthclues-owner-demo` local API `54321`/DB `54322`, Mailpit `54324`. Giữ volume hiện tại; chỉ tạo synthetic accounts/event và seed idempotent TEST ONLY. Port `3249` thuộc tiến trình không có demo PID record nên không đụng tới. Không production, deploy, reset hoặc email external.
- `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3254 node scripts/test-healthclues-owner-auth-demo.mjs` — **PASS đúng build**. Auth qua Mailpit; Sleep và Quiz-selected Gout; recommendation lấy từ Catalog thật; assertion sau Save rằng Tomato có `already_saved`; Tomato explanation không nhắc Gout và không Equip; Ginger không Equip khi medication unknown; Walking không Equip khi Gout movement safety unknown; preference/time PATCH sau đó GET xác nhận giá trị đã lưu và reason `preference` trên Walking; feedback riêng tư; account 2 không đọc được first World/recommendations/Collection/Care Plan. Companion “Offer an alternative” được kiểm tra tới API: mục cũ có `alternative_requested`, API trả option eligible khác khi có và Backpack giữ nguyên. Cùng suite PASS NPC routes/Talk, Pet follow, 2 map + viewport/layout, Encyclopedia details, Collection, 3 Backpack slots/explicit replace/remove/reload, Care Plan/Companion check-in, 4 mini-games/Skill progress, Boss/Rewards/World ID persistence. Chromium `runtimeErrors: 0`.
- Local Postgres readback xác nhận migration `20261030120000`, events `shown`, `equipped`, feedback `no_time` và `want_alternative`; 14 active `hc-demo-*` items. Các fixture đều TEST ONLY.
- Sau lần restart cuối, kiểm tra service hiện tại: `/play` HTTP 200, Supabase Auth health HTTP 200, Mailpit API HTTP 200; recommendation GET/PATCH không token đều HTTP 401. PostgreSQL xác nhận vẫn còn World/event cũ sau restart, migration `20261030120000` còn áp dụng, 14 fixture active và 0 grants bảng event cho `anon`/`authenticated`.
- `node --experimental-strip-types scripts/test-healthclues-personalized-recommendations.mjs` — **PASS**: cùng Gout nhưng goal/preference khác làm đổi thứ tự; reasons; safety unknown/acute/allergy/urgent/medication; Tomato education-only; missing topic tag no-match; dismiss/save/history/alternative; demo boundary. Quiz safety: **38 assertions PASS**. Discovery matching: **37 assertions PASS**. E2E `node --check` PASS. Isolated Next build PASS. Focused ESLint: **0 errors / 4 warnings** (3 screenshot test vars và 1 `<img>` optimization).
- Ảnh sau E2E đã mở kiểm tra trực quan: [Luna tại Camp](previews/owner-two-region-sleep-camp-desktop.jpg), [Gout Botanist](previews/owner-two-region-health-gout-station-desktop.jpg), [Backpack replacement](previews/owner-backpack-three-tools-replacement.jpg), [Daily Companion](previews/final-companion-checkin-desktop.jpg). Các map mobile/desktop hiện có: [Sleep mobile](previews/owner-two-region-sleep-map-mobile.jpg), [Health mobile](previews/owner-two-region-health-gout-mobile.jpg), [Activity Trail](previews/owner-activity-trail-populated-cards.jpg), [Wellness](previews/owner-wellness-sanctuary-populated-cards.jpg). UI card spacing đã sửa và ảnh sau xác nhận không gắn Tomato với Gout.

### Phạm vi chưa chứng minh

- Khác biệt cùng một concern hiện được chứng minh bằng deterministic unit test trên hai profile Gout. Browser full-auth chạy một Sleep và một Gout account, chưa chạy hai account browser cùng Gout với profile khác nhau.
- Preference/time PATCH và kết quả profile/reason được browser xác nhận; click-path riêng của preference editor và reload sau khi đổi chưa assert. Allergy/acute/medication safety matrix chủ yếu unit test, không phải browser multi-account matrix.
- Catalog hiện là TEST ONLY / NOT HUMAN-REVIEWED / evidence-not-assessed. Không nội dung nào được coi là bằng chứng lâm sàng. Chưa có qualified editorial content, owner art approval, physical-device/performance QA, comprehensive production security/privacy review hay production release approval. **Kết quả tổng thể PARTIAL, không phải FULL PASS.**
- Việc tiếp theo: browser test hai profile cùng Gout + preference edit/reload + synthetic safety contexts; tiếp tục giữ fixture gate. Nội dung thật phải qua reviewer và kiểm chứng nguồn; sau đó đánh giá device/security/release. Không tạo milestone mới.

## Personalized wellness recommendation engine — final integrated verification 2026-10-30

### Source and behavior

- Reused the existing Discovery Quiz profile (`healthclues_profiles.profile`) and RPG Catalog; no duplicate recommender/catalog or extra required Quiz question was added. `createDiscoveryProfile` now keeps relevant safety responses tri-state (`yes/no/unknown`), including food allergy/restriction, activity restriction, medication/supplement, acute painful joint, urgent symptoms and fluid restriction. Old profiles with no structured context remain unknown.
- Shared deterministic rules live in `src/features/healthclues/personalized-recommendations.ts`. Candidate metadata is read from the active Catalog item version: supported topic/goal/preference tags, estimated time, explicit personalization eligibility and structured safety flags. Results use fixed tie-break ordering, up to three World suggestions/five station entries, and explainable reason codes. Existing active Backpack, Collection dismissals/feedback and linked private Care Plan method state influence ranking. A demo fixture is never enough by itself to make an item relevant or eligible.
- The authenticated, no-store `/api/healthclues/recommendations` endpoint verifies the owner’s World, retrieves the owner’s profile and Catalog through service role after auth, filters `TEST ONLY` by a server-computed loopback Owner Demo flag, and returns a concise profile summary plus ranked items. POST records minimized shown/save/equip/dismiss/feedback events; PATCH allows the owner to update only whitelisted optional preference/time values without a new health intake. Personal eligibility and demo equipment are revalidated server-side. An active private medication record contributes only an internal boolean safety gate; its name/notes are not read into recommendations.
- Luna/Lumi suggestions appear in Camp and at the relevant NPC station, explain why/evidence/safety, and link Explore to an actual authored destination walk. Collection remains separate. The player may ask to change preferences, dismiss or request alternatives; no automatic equipment replacement occurs. Daily Companion records optional per-equipped-item alternative feedback separately from self-reported usage.
- Additive migration `20261030120000_healthclues_recommendation_history.sql` creates owner/World-bound private event history with RLS and direct client grants revoked. It stores item/version, constrained event/reason codes, feedback kind, rules version and idempotency key—not raw Quiz answers, profile snapshots, medication names or private notes. It was applied only to the retained local Owner Demo DB.
- Demo fixtures are explicitly synthetic, `NOT HUMAN-REVIEWED`, evidence `not_assessed`; disease relationships unsupported by a source have been removed. Tomato/Potato/Cherries remain general food education and are never equipment eligible; Ginger is held when medication context is unknown; walking is held unless relevant activity context is established. Harmless interface fixtures are eligible only where their user-selected profile tags match and are never presented as HealthClues clinical recommendations.

### Verification on current isolated build

The final rerun evidence for the latest source is recorded in the dated section above. Earlier build results below are historical and do not extend that result. The exact test URL/build, private local-Postgres readback, screenshots and remaining gaps are stated there. Synthetic browser users exist only in the retained local `healthclues-owner-demo` project.

Screenshots to inspect from the latest run: [Camp suggestions](previews/owner-two-region-sleep-camp-desktop.jpg), [Sleep Wellness station mobile](previews/09c-sleep-wellness-station-mobile.jpg), [Health/Gout Botanist station](previews/owner-two-region-health-gout-station-desktop.jpg), [Backpack replacement](previews/owner-backpack-three-tools-replacement.jpg), and [Daily Companion](previews/final-companion-checkin-desktop.jpg).

## Backpack & Toolkit final integration — 2026-10-30 — authenticated local browser PASS; release remains PARTIAL

- Rebuilt and launched the isolated production-mode Owner Demo from current source as `app-build-final-a10` at [http://127.0.0.1:3249/play](http://127.0.0.1:3249/play). Local Supabase/Auth uses `127.0.0.1:54321`; Mailpit uses `127.0.0.1:54324`. The dedicated local database volume was retained. No production endpoint/data or deployment was used.
- Replaced the pre-world fixed Consume/Reduce/Practice selection UI with an empty, three-position flexible Backpack. First entry now leads into the Journey and NPC discovery; selection is voluntary and uses the existing in-world Backpack. Corrected dashboard replacement to select any eligible tool and explicitly confirm the target position. Collection now receives educational entries even when they cannot be equipped, preserving a saved non-eligible Tomato as learning content.
- Food & Botanical Garden, Activity Trail and Wellness Sanctuary show populated, Journey-matched fixture cards with evidence/safety limitations. Fixtures (Tomato, Potato, Cherries, Ginger, water/hydration, movement and relaxation examples) are local `TEST ONLY`, `NOT HUMAN-REVIEWED`, evidence-not-assessed; the product never presents them as clinically effective. Demo equipment eligibility is server-validated and disabled outside the isolated owner demo. Tomato is intentionally not equipment-eligible.
- **Browser E2E PASS on the rebuilt URL:** `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs`. Auth used local Mailpit. Sleep/Luna and Quiz-selected Health/Gout/Lumi routes, player/Pet movement, all NPC arrivals/Talk, content preview/full details, source links, Collection save/browse/details/unsave/resave, equipment, fourth-item explicit replacement, removal while preserving Collection, reload, private Care Plan, Daily Companion and account isolation passed. All four Knowledge mini-games, four Skill progression counters, Boss/key/reward and Rewards station passed; repeated mini-game completion granted no repeat XP. Browser runtime errors: 0.
- Equipment browser flow filled three independent positions, equipped two tools of the same action category, attempted a fourth and explicitly replaced position 2, removed one entry, and reloaded the same World. Local PostgreSQL readback for World `9cfeefbf-703c-40e6-a734-2c7463ec65e5` showed two remaining active entries at two positions after removal; the E2E replacement snapshot showed all three positions and the replaced Ginger entry. Local daily records read back `done:1` and `unsure:1`; Tomato remained saved after the Gout Journey re-save. Both new additive migration versions `20261030100000` and `20261030110000` are present locally.
- Additional checks: shared region route/layout script PASS (7 approaches per region, 11 connected route nodes, no required bridge); Skill thresholds PASS (five levels, 11 boundary assertions); E2E syntax PASS; focused ESLint PASS with 0 errors and one existing `<img>` optimization warning. This E2E demonstrates early persisted Skill progression; it does not claim the browser account reached all five levels.
- **New final browser captures:** [Sleep Botanist populated catalog](reports/previews/owner-botanist-populated-cards.jpg), [Activity Trail](reports/previews/owner-activity-trail-populated-cards.jpg), [Wellness Sanctuary](reports/previews/owner-wellness-sanctuary-populated-cards.jpg), [three-slot Backpack and replacement](reports/previews/owner-backpack-three-tools-replacement.jpg), [Collection with saved Tomato](reports/previews/owner-collection-tomato-search-details.jpg), [Daily Companion check-in](reports/previews/owner-daily-companion-equipped-tools.jpg). Whole maps: [Sleep Valley desktop](reports/previews/owner-two-region-sleep-map-desktop.jpg), [Sleep Valley mobile](reports/previews/owner-two-region-sleep-map-mobile.jpg), [HealthClues Realm desktop](reports/previews/owner-two-region-health-gout-desktop.jpg), [HealthClues Realm mobile](reports/previews/owner-two-region-health-gout-mobile.jpg). Realm 1920×1080 and Sleep 1920×1080 captures are linked in the previous region acceptance section.
- **Remaining release blockers:** learning examples are synthetic/not human-reviewed and must not be shipped as approved content; owner approval of generated map/character artwork remains outstanding; mobile verification is browser emulation, with physical-device touch/performance unverified. Production security/release review is not part of this local demo acceptance. Keep the demo isolated and do not claim clinical or production readiness.
- **Exact next task:** preserve the playable demo and TEST ONLY gate while awaiting owner art approval and editorial review; then perform physical-device QA before production release review.

# HealthClues — Báo cáo bàn giao game cuối

## Screenshot-driven visual QA follow-up — 2026-10-30 — isolated E2E PASS / overall PARTIAL

### Đọc ảnh trước khi đổi

Đã mở trực tiếp 10 ảnh a9 mới nhất: cả hai map desktop 1440×900/1920×1080/mobile 390×844, hai cảnh đến Botanist/Wellness, và hai ảnh navigation debug có route overlay. So sánh ảnh nền với sprite DOM và landmark anchors:

- NPC Botanist, Explorer và Wellness Guide không chồng nhau; mỗi người đứng riêng tại đúng garden/activity/sanctuary. Chân NPC/player nằm trên dải đường đất phía trước công trình, không trên mái hoặc nước. Camp→Garden→Activity→Sanctuary và nhánh Library/Boss/Rewards bám theo nền đất liên tục. Do ảnh thật khớp vị trí và không có khoảng cách di chuyển thiếu chỗ, giữ các landmark targets/artwork; không tạo lại art chỉ để đổi màu hoặc rải sprite.
- Lỗi nhìn thấy ở Sleep Camp: khi Pet đang theo player quay về camp, marker tại khoảng (18.25%,64.1%) trùng với vùng Pet đi qua; ảnh Sleep desktop/mobile cho thấy marker chìm sát dưới Pet. Panel chào Lumi chiếm gần 300 px chiều rộng trên mobile và che nhiều scenery dưới trái. Ảnh Health map 1920×1080 ở trạng thái focus Botanist có khung trắng bao sprite, trông như một hotspot chữ nhật phụ.
- Không có nhiều label mở đồng thời trong ảnh. Khi tập trung Botanist chỉ một label xuất hiện; nó đứng cạnh NPC và marker chứ không che tuyến chính. Water/roof block giữ nguyên.

### Sửa dựa trên ảnh và kết quả so sánh

- Dời riêng nút Camp ra ground phía trước tại (18.25%,75%); spawn/approach vẫn (12%,69%). Ảnh sau cho thấy nút và `Camp · Talk` tách khỏi player/Pet, vẫn nằm trên phần đất/path có thể đi qua.
- Thu nhỏ lời chào Lumi và rút gọn bản đầu, giữ nguyên Gout context và câu “self-reported, not a diagnosis”. Mobile giữ nhân vật/map rõ hơn.
- Đổi focus NPC từ khung quanh toàn thân thành halo vàng sát mặt đất, vẫn giữ focus state nhìn thấy cho keyboard.
- Không đổi bảy landmark anchors, route graph hay hai background plates vì screenshot/route-debug cho thấy chúng đã khớp nhau. E2E sau rebuild xác nhận đi tới đúng approach (Sleep path 70 nodes, Realm path 55; không bridge).

### Ảnh cùng viewport — trước / sau

| Scene / viewport | Trước (build a9) | Sau (build a10) |
|---|---|---|
| Sleep Valley desktop 1440×900 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-sleep-map-desktop.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-sleep-map-desktop.jpg) |
| Sleep Valley desktop 1920×1080 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-sleep-map-1920x1080.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-sleep-map-1920x1080.jpg) |
| Sleep Valley mobile 390×844 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-sleep-map-mobile.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-sleep-map-mobile.jpg) |
| HealthClues Realm desktop 1440×900 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-health-gout-desktop.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-health-gout-desktop.jpg) |
| HealthClues Realm desktop 1920×1080 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-health-gout-map-1920x1080.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-health-gout-map-1920x1080.jpg) |
| HealthClues Realm mobile 390×844 | [Screenshot](previews/region-layout-before-20261030/owner-two-region-health-gout-mobile.jpg) | [Screenshot](previews/region-layout-after-20261030/owner-two-region-health-gout-mobile.jpg) |

Walk-path overlays were also opened after change: [Sleep Valley](previews/region-layout-after-20261030/final-nav-sleep-short-path.jpg) and [HealthClues Realm](previews/region-layout-after-20261030/final-nav-healthclues-routed-walk.jpg). NPC arrival/feet screenshots: [Sleep Botanist](previews/region-layout-after-20261030/09dr-sleep-botanist-arrival-desktop.jpg) and [HealthClues Wellness Guide](previews/region-layout-after-20261030/owner-two-region-health-gout-arrival-desktop.jpg).

### Verification of a10

- Rebuilt and started isolated owner build `app-build-final-a10` at `http://127.0.0.1:3249/play`; reran the full Chromium owner E2E on that exact URL — **PASS**. It exercised both Journey routes, NPC Talk arrival, mobile touch walk to the Realm Botanist, Pet follow back to Camp (waited until the Pet reached follow distance before taking the steady-state map capture), World reload, all four mini-games/Skills, Boss, Rewards, private Care Plan and account isolation; runtime errors 0.
- The browser helper asserts no visible label/label, label/landmark hotspot, label/player/Pet, station/station, or station/player/Pet rectangle overlap. Its Pet/Camp wait prevents a transient follow animation from becoming the “resting map” screenshot. Visual review also checked sprite feet against the visible paths/art; coordinate assertions alone are not used as visual approval.
- Focused route test: 7 valid landmark approaches per region, 11 connected route nodes, no bridge dependency. Focused lint: 0 errors, 2 existing `<img>` warnings. `git diff --check` and HealthClues docs guard PASS.
- Overall remains **PARTIAL** for generated-art owner review, physical-device QA/performance, and human-reviewed health content/production gates. Mobile screenshot is browser emulation, not physical-device evidence.

## Earlier shared-region correction — 2026-10-30 — a9 browser PASS (superseded by screenshot-driven a10 follow-up above)

### Bản demo và ranh giới dữ liệu

- **URL bàn giao:** [http://127.0.0.1:3249/play](http://127.0.0.1:3249/play), isolated build `app-build-final-a9`. **Mailpit:** [http://127.0.0.1:54324](http://127.0.0.1:54324); **local Supabase:** API `127.0.0.1:54321`, project `healthclues-owner-demo`.
- Rebuild dùng source hiện tại và hai WebP cảnh mới; E2E đầy đủ được chạy lại trên đúng URL 3249 sau khi chuyển build. Chỉ local synthetic TEST ONLY accounts/fixtures được ghi; dữ liệu volume demo hiện hữu được giữ. Không production, deploy, reset volume hay gửi email ngoài.
- Assets `sleep-valley-scene-blueprint.webp` và `healthclues-realm-scene-blueprint.webp` là artwork AI tạo/chỉnh để không có người nền. Đã xem ảnh trực tiếp; đây là prototype cần owner art review, không phải production artwork.

### Shared layout và kiểm tra bằng Chromium thật

- Cùng renderer/route graph, logical world 1600×900 (16:9), 11 route nodes: Camp (12,69), Garden (34,69), Activity (58,69), Sanctuary (86,69), Library (29,28), Boss (66,28), Rewards/Observatory (90,28). Upper NPC approach points ở y=45% trên open ground dưới landmark; path test chứng minh không phụ thuộc cầu. Sleep Valley là rừng trăng và làng đèn lồng; HealthClues Realm là vườn/nhà kính nắng riêng biệt.
- Test E2E cuối cùng: `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs` — **PASS**. Chromium đi Sleep route qua các NPC/landmark với 70 route nodes và Health/Gout qua 55 nodes; kiểm tra arrival, Talk gate, Pet follow, water click không di chuyển, hai map valid approaches/no bridge, và zero runtime errors. Journey Health vẫn dùng topic Gout từ Quiz.
- Labels use compact landmark names and sit beyond the actor hit area. Automated checks report no visible label/label, label/landmark interaction surface, label/player/Pet, landmark/landmark or player/Pet bounding-box overlaps at the tested map states.
- Desktop captures 1440×900 và 1920×1080 cho thấy toàn map; mobile 390×844 giữ world coordinates và camera theo người chơi. Automated screenshot QA kiểm tra collision bounding boxes của label, landmark interaction surfaces, actors và player/Pet. Visual inspection xác nhận không còn nhân vật được bake vào background; NPC là world sprites riêng tại station. Mobile là Chromium emulation, không phải thiết bị vật lý.

### Ảnh nghiệm thu cuối

| Vùng | Desktop 1440×900 | Desktop 1920×1080 | Mobile 390×844 |
|---|---|---|---|
| Sleep Valley / Luna | [Ảnh map](previews/owner-two-region-sleep-map-desktop.jpg) | [Ảnh map](previews/owner-two-region-sleep-map-1920x1080.jpg) | [Ảnh map](previews/owner-two-region-sleep-map-mobile.jpg) |
| HealthClues Realm / Lumi, Gout | [Ảnh map](previews/owner-two-region-health-gout-desktop.jpg) | [Ảnh map](previews/owner-two-region-health-gout-map-1920x1080.jpg) | [Ảnh map](previews/owner-two-region-health-gout-mobile.jpg) |

Screenshots of actual walking/arrival: [Sleep Botanist](previews/09dr-sleep-botanist-arrival-desktop.jpg), [Sleep Sanctuary](previews/09dr-sleep-sanctuary-arrival-desktop.jpg), [Health Botanist](previews/owner-two-region-health-gout-arrival-desktop.jpg), [Health Knowledge](previews/owner-two-region-health-gout-knowledge-desktop.jpg).

### Phạm vi gameplay được xác minh và giới hạn

- Full owner E2E also verified local Auth/Mailpit, stable World ID through reload, all eight regions (2 playable, 6 Coming Soon), Encyclopedia/Collection/Backpack, private Care Plan and cross-account isolation, optional Daily Companion opt-in, all four TEST ONLY mini-games, persisted progress for all four Skills, Boss clear/key/unlocks, Rewards (`Sleep Valley Lantern`), and exact Gout-topic continuity. Skill counts after reload: `health_knowledge: 1`, `natural_nutrition: 1`, `movement: 1`, `mind_sleep: 2`; `scripts/test-healthclues-skill-levels.mjs` separately passes all five thresholds and 11 boundary assertions. The browser fixture reaches early levels only; it does not earn all five levels on one account.
- **Overall PARTIAL:** owner review of generated art/content, physical-device touch/performance/FPS, human-reviewed health education and production security/privacy/release are outstanding. Prototype art and local fixtures are not medical or production approval. These limits are not part of the isolated-browser PASS.

## Final owner demo acceptance — 2026-10-30 — PASS for isolated browser scope; overall PARTIAL

### Demo and local data boundary

- **Game:** `http://127.0.0.1:3249/play` — isolated build `app-build-final-a7`.
- **Local inbox:** `http://127.0.0.1:54324` (Mailpit); **Supabase API:** `http://127.0.0.1:54321`; **local project/database:** `healthclues-owner-demo` / `supabase_db_healthclues-owner-demo`.
- The build used local status-confirmed loopback settings. The prior persistent local volume and records were kept. This source-only build did not apply migrations, seed/reseed fixtures, reset data, use production `.env.local`, send external email, deploy or publish.
- `App/start-game-demo.bat` now points to `app-build-final-a7`. In this restricted Windows tool process, the standard launcher still intermittently fails its nested Supabase status check with Docker API `permission denied`; direct read-only Docker context/container and Supabase status calls succeeded. The current game server was launched from the isolated build and is serving. Do not work around this by changing Docker ACLs.

### Current browser evidence

Command on the exact running build: `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs` (PowerShell equivalent: `$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3249'; node scripts/test-healthclues-owner-auth-demo.mjs`). **PASS**. Chromium completed local Mailpit email verification, both regions, Sleep/Gout Quiz-to-Journey continuity without a repeated Health concern question, persistent World reload, account isolation, current Catalog/Encyclopedia fixtures, Collection/Backpack, Care Plan, optional Pet check-in/private-note consent, all four learning games, Boss and the Rewards station. `runtimeErrors: 0`.

Specific assertions/evidence:

- All eight stable Overworld regions render; Sleep Valley and HealthClues Realm are playable and six remain Coming Soon. Sleep uses Luna; Health/Gout uses Lumi and retains the Quiz-selected topic.
- Both map scenes have seven valid approaches on one short connected path (Sleep 564 world units, Health 579), no gameplay bridge dependency, NPC Talk only after arrival, blocked water does not move the player, and player/camera/Pet movement is exercised. After reset, the landscape world bounds fit the viewport. The mobile capture uses bounded cover framing and Chromium touch emulation.
- All four mini-games completed; wrong answer retry is penalty-free; duplicate replay grants no additional reward. Four owner-scoped Skill values persisted after reload (`health_knowledge: 1`, `natural_nutrition: 1`, `movement: 1`, `mind_sleep: 2`). A separate threshold test covers all five levels at 0/1/3/5/8; browser data reached early levels only.
- Boss state persisted as cleared. Local World API returned one Knowledge Key, two `boss_clear` unlock rows and one listed reward; the in-map Rewards screen displayed `Sleep Valley Lantern`. Reward remains server-authoritative.
- Care Plan was read back on the owning account and returned 404 to the second account; optional Daily Companion text entered the private note only after explicit opt-in. Guest World API returned 401. No external email was sent.

### Focused test/build results

- **PASS:** isolated current-source Next build `app-build-final-a7` (output staged under `%TEMP%\healthclues-owner-demo-builds`).
- **PASS:** `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs` — seven valid approaches per region; compact single connected path; 564 / 579 world units; no bridge.
- **PASS:** `node --experimental-strip-types scripts/test-healthclues-skill-levels.mjs` — all five named levels, 0/1/3/5/8 thresholds and 11 boundary assertions.
- **PASS:** `node scripts/test-healthclues-quiz-safety.mjs` (38 assertions), `node scripts/test-healthclues-discovery-matching.mjs` (37 assertions), `node scripts/test-healthclues-quiz-branches.mjs`, and JavaScript syntax checks.
- **PASS:** focused ESLint on changed game/API/test files: zero errors; two existing `@next/next/no-img-element` warnings in `RegionMapScene.tsx`.
- **PASS:** `npm.cmd run docs:healthclues:check -- --files <current source/test paths> --docs <updated canonical docs and this report>`; every recommended target was named and the changed documentation was reviewed manually.
- Fresh inspected screenshots: [Sleep map desktop](previews/owner-two-region-sleep-map-desktop.jpg), [Sleep map mobile emulation](previews/owner-two-region-sleep-map-mobile.jpg), [Health/Gout map desktop](previews/owner-two-region-health-gout-desktop.jpg), [Health/Gout map mobile emulation](previews/owner-two-region-health-gout-mobile.jpg), [four-game Knowledge screen](previews/owner-test-only-evidence-mini-game.jpg), [Boss](previews/owner-two-region-sleep-boss-test-only.jpg), [Rewards](previews/owner-two-region-sleep-rewards-desktop.jpg), [Care Plan desktop](previews/09c-care-plan-desktop.jpg), [Companion check-in](previews/final-companion-checkin-desktop.jpg).

### Acceptance limits and remaining work

**Overall is PARTIAL; this is a PASS for the listed isolated owner-browser scope only.** Four activities and persisted early Skill progression are playable. The browser fixture does not earn every Skill level; five-level thresholds are verified by a focused source test. Content/art fixtures remain TEST ONLY / NOT HUMAN-REVIEWED, and prototype art is not production-approved. Corridor movement is not pixel-accurate collision. Physical-device touch/pinch, measured FPS/performance, full editorial/scientific review, production privacy/security review and production release are not verified. Owner-demo launcher reliability from this restricted Windows process remains the exact operational next task; see `CURRENT_STATE.md`.

## Simplified Region Map travel — source update 2026-10-29

Yêu cầu spatial được giản lược: mỗi vùng chơi là một cảnh gọn với các địa điểm chính trên một lối vườn liên thông ngắn gần Adventure Camp. Source hiện bỏ các tuyến dài qua bờ đối diện và không còn phụ thuộc vào cầu. Hồ, vách đá, thác và cầu giữ làm artwork nền. Sleep stations tập trung quanh lối vào làng/vườn; HealthClues stations nằm dọc lối vườn phía trại. Bộ route A* corridor hiện có được giữ như kiểm tra đường đi nhẹ; không thêm navmesh hay engine. Landscape dùng contain để thấy trọn cảnh; portrait dùng cover và camera follow có giới hạn.

**Kiểm tra source:** ESLint tập trung hoàn tất với 0 lỗi (2 cảnh báo `next/no-img-element`); `node --check` cho browser test PASS; `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs` PASS (7 điểm tiếp cận/vùng; 1 đường/vùng; 512 world units Sleep, 474 Health; không cần bridge). Browser verification cho source mới BLOCKED: owner PID 33080 được xác minh và dừng để rebuild; isolated launcher bị kẹt lúc khởi động Supabase local vì Windows `com.docker.service` đang Stopped. Port 3249 và Auth/Mailpit hiện không lắng nghe. Không xóa Docker container/volume hay build khác. Còn khoảng 165 MB trống ở C: so với `.next` khoảng 152 MB; D: khoảng 18 MB. Vì vậy tuyến/điểm mới, no-bridge route, framing desktop/mobile CHƯA được xác minh trong browser. Bridge test cũ chỉ áp dụng cho a5 và bị thay bởi yêu cầu đường ngắn.

**Các phần cuối game còn thiếu:** mini-game giáo dục độc lập, bốn Knowledge Skills với năm cấp lưu bền, một số quy tắc Knowledge hằng ngày, human art/content approval, gesture trên thiết bị thật và đo FPS vẫn PARTIAL/NOT VERIFIED. Các slice Auth/Mailpit, World persistence, Care Plan riêng tư, check-in hai prompt tùy chọn, Knowledge Quick Quiz và Boss TEST ONLY có bằng chứng browser trước đó; không đồng nghĩa full acceptance. Không có nội dung sức khỏe production được phê duyệt hoặc triển khai production.

## Cập nhật tiếp tục giao game — 2026-10-29

### Kết quả mới nhất: PARTIAL — các đường fixture được kiểm thử trên browser

### Xác minh bổ sung sau restart — 2026-10-29

- **URL owner chính xác:** `http://127.0.0.1:3249/play`; inbox local `http://127.0.0.1:54324`. Sau restart qua launcher, Chromium chạy `scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3249/play` trên đúng build đang phục vụ owner.
- **Kết quả:** PASS cho verifier guest: Game Shell thật; Quiz → Reveal đúng; refresh giữ Reveal/Quest; khối hồ sơ cũ không mount (`legacyDetailsMounted: 0`, `oldProfileVisible: false`); tối đa 10 câu; 2 vùng playable/6 Coming Soon; World Preview trước activation; activation chỉ mở sau CTA; `runtimeErrors: 0`. Ảnh desktop/mobile cùng build nằm trong `reports/previews/healthclues-live-preview-*`, `healthclues-owner-07c-*`, `healthclues-fullscreen-world-*`.
- **Restart/persistence:** PASS. Owner launcher stop/start app và isolated local services mà vẫn giữ volume; `scripts/verify-healthclues-owner-resume-after-restart.mjs` xác nhận browser session đã xác thực tiếp tục cùng World ID. Đây là kiểm chứng local demo, không phải production.
- **Kiểm tra chất lượng:** `npm.cmd run docs:healthclues:check -- --files ... --docs ...` PASS. ESLint mục tiêu và `git diff --check` PASS; cảnh báo Git về line ending CRLF không phải whitespace lỗi. Game và Mailpit đã được mở qua trình duyệt sau restart.

Kết luận vẫn **PARTIAL**. Các lần kiểm tra này không bổ sung mini-game riêng, bốn Skill/năm cấp độ, full Health-map traversal, art đã được người duyệt, thiết bị mobile thật/FPS hay phê duyệt nội dung sức khỏe production.

- **Demo đang chạy:** `http://127.0.0.1:3249/play`, build `app-build-final-a2`; Mailpit `http://127.0.0.1:54324`. `App/start-game-demo.bat` trỏ đúng bản này. Build staging trên `%TEMP%\healthclues-owner-demo-builds` ở C: do D: đã hết chỗ; database/Auth vẫn nằm trên volume Supabase cục bộ cô lập.
- **Browser E2E PASS cho phạm vi đã chạy:** `scripts/test-healthclues-owner-auth-demo.mjs` dùng Chromium thật và local Mailpit/Auth tại chính URL 3249. Sleep path đã kiểm thử di chuyển/camera/Luna/proximity, TEST ONLY Catalog preview/full detail/save Collection/self-report/equip, Knowledge discover+quiz, in-map Boss và persisted challenge reward. Health/Gout path xác nhận Lumi giữ topic Quiz, hiện đúng TEST ONLY topic-matched Catalog/Knowledge, hoàn tất Knowledge quiz mà không hỏi lại concern. Cùng test xác nhận auth, cùng World sau reload, 8 vùng/6 Coming Soon, Care Plan/cross-account isolation, private Pet Check-in opt-in và 0 runtime errors.
- **Fixture boundary:** toàn bộ fixture được gắn `test-fixture` / TEST ONLY / NOT HUMAN-REVIEWED, không có efficacy claims hoặc nguồn nghiên cứu giả. Chỉ được bật trong isolated owner demo. Đây không phải nội dung đã được biên tập/y khoa phê duyệt.
- **Ảnh:** 31 ảnh browser thực được ghi vào `reports/previews/` sau khi dọn thư mục build a2 dở do chính lượt này tạo (không xóa baseline); ảnh movement, Wellness mobile, Gout Knowledge và Boss đã được mở/kiểm tra. Chromium mobile là giả lập, không phải thiết bị thật.
- **Build recovery:** lần đầu Next build trên D: bị `ENOSPC`. Sau đó launcher được mở rộng cho build-root trong temp, giữ node dependency resolution an toàn qua local Tailwind + directory junctions; build C: thành công. Các build 3247/3248 cũ chỉ được dừng sau xác minh command line đúng HealthClues; 3249 đang hoạt động.
- **Vẫn PARTIAL:** mini-game riêng, bốn Knowledge Skills/năm levels, full Health map movement, Daily knowledge limit, production human-reviewed content, final hand-painted art approval, physical mobile gesture/FPS, full all-eight Quiz/safety cases và mọi yêu cầu dài hạn chưa được xác nhận. Không tuyên bố full local acceptance hay production readiness.

**Ngày:** 29-10-2026 · **Kết luận tổng thể: PARTIAL**

## Demo cô lập

- **Game:** http://127.0.0.1:3248/play
- **Inbox Mailpit:** http://127.0.0.1:54324
- **Khởi động/rebuild:** chạy `App\start-game-demo.bat`; PowerShell tương đương: `$env:HEALTHCLUES_OWNER_DEMO_PORT='3248'; $env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME='app-build-final-a1'; node scripts/start-healthclues-owner-demo.mjs --rebuild`.
- **Restart không build lại:** cùng lệnh bỏ `--rebuild`, hoặc chạy BAT sau khi process Next đã dừng.
- Launcher xác minh API Supabase `http://127.0.0.1:54321`, Postgres `54322`, Mailpit `54324`, project cô lập `healthclues-owner-demo` trước khi bật app. Build mới giữ volume demo; không đọc `.env.local`, không gửi email ngoài, không dùng production và không dừng owner process cổng 3247.

## Thay đổi trong phiên này

- `src/features/healthclues/DailyCheckinDialog.tsx`: thêm hai lời hỏi Companion tùy chọn, một câu mỗi bước; có bỏ qua. Câu trả lời chỉ được chép vào ghi chú riêng khi người chơi bấm **Add to private note**. Nội dung ghi chú vẫn sửa được trước khi lưu qua API check-in đang có. Không thêm schema/API, phân tích triệu chứng hay gợi ý thuốc.
- `src/features/healthclues/world-adventure.css`: kiểu game gọn cho tương tác check-in.
- `scripts/test-healthclues-owner-auth-demo.mjs`: mở rộng browser flow để kiểm tra hai câu, quyền đồng ý riêng, lưu và đọc lại ghi chú, chụp desktop/mobile.
- `App/start-game-demo.bat`: chuyển launcher mặc định sang build `app-build-final-a1`, cổng 3248; phiên bản đang chạy 3247 không bị dừng.
- Lưu task tại `App/HEALTHCLUES_FINAL_COMPLETE.md`; checklist phục hồi tại `App/reports/FINAL_GAME_DELIVERY_CHECKLIST.md`.

## Ma trận nghiệm thu hiện tại

| Tính năng | Đã triển khai | Automated test | Browser thật | Persistence | Kết quả |
|---|---|---|---|---|---|
| Auth/email local + xác minh Mailpit | Có | Có | PASS ở build trước và build mới đang kiểm tra | Có | PASS slice |
| World duy nhất, tám vùng/2 playable/6 Coming Soon | Có | Có | PASS ở build trước | Có | PASS slice |
| Quiz → Sleep/Gout Journey, Lumi nhận topic đã chọn | Có | Có | PASS ở build trước | Có | PASS slice |
| Đi bộ, camera/Pet follow, Talk khi tới gần | Có | Có | PASS Sleep Valley ở build trước và regression build mới | Chặng map không ghi từng frame | PASS slice |
| Care Plan riêng tư / hai tài khoản | Có | Có | PASS local synthetic accounts | Có | PASS slice |
| Daily Companion: 2 prompt + opt-in private note | Có, phiên này | Browser script đã thêm; kết quả đang chạy/chưa được ghi | PARTIAL tới khi test kết thúc | Dùng API Journal hiện có | PARTIAL |
| Catalog theo Journey, Quick Preview, Save, Equip | UI/API có | Một phần | Không thể test entry phù hợp | Không xác nhận | BLOCKED bởi thiếu nội dung đã review phù hợp |
| Knowledge lessons / Quick Quiz / Skills | Engine có | Một phần | API trả empty-state trung thực | Chưa có nội dung tiến độ | PARTIAL/BLOCKED bởi thiếu clue theo topic đã review |
| Mini-game / skill progression | Chưa đủ trải nghiệm | Chưa có | Chưa | Chưa | NOT STARTED |
| Boss / reward / cosmetic evolution | API và UI có, nội dung bị gate | Chưa với nội dung phù hợp | Chưa | Chưa | BLOCKED bởi thiếu challenge đã review |
| Hai map, art direction, collision/performance | Map/art/movement slice có | Một phần | Sleep walk slice; Health full route chưa | World giữ | PARTIAL; art cần duyệt, va chạm thô, FPS/thiết bị thật chưa đo |
| Full local acceptance Sleep + Health | Một phần | Script bao phủ Auth, NPC, context, isolation | Chưa hoàn thành trọn mọi màn chơi | Một phần | PARTIAL |

## Kiểm thử và screenshots

Build cô lập `app-build-final-a1` đã build xong và phục vụ `/play` trên `3248`. Browser regression thực tế chạy bằng:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3248'
node scripts/test-healthclues-owner-auth-demo.mjs
```

Kết quả: **PASS cho các assertion trong script.** Local Mailpit/Auth, movement/camera/Pet follow, Talk gating, 8 vùng/6 Coming Soon, Gout continuity, World ổn định, hai tài khoản cách ly, Care Plan riêng tư, companion note opt-in/persistence và `runtimeErrors: 0`. Browser test dùng hai synthetic account mới trong local demo; không gửi email ngoài. Screenshot check-in thật: `reports/previews/final-companion-checkin-desktop.png` và `reports/previews/final-companion-checkin-mobile.png`; cả hai đã mở và xem. Desktop hiển thị lời hỏi đầu; mobile hiển thị tracker/note cuối sau opt-in. Map còn thấy phía sau overlay, không thấy tràn ngang. Chromium mobile emulation không thay thế thiết bị vật lý.

Bằng chứng movement trước đó nằm trong `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md` và `reports/previews/09dr-*`.

## Giới hạn và quyết định an toàn

Local Catalog/Knowledge không có bản ghi đã review phù hợp cho Sleep/Gout. Do đó UI hiện không tạo recommendations, bài học, câu trả lời Boss hay phần thưởng giả. Synthetic content có thể dùng trong demo khi ghi rõ TEST ONLY, nhưng không được gắn nhãn human-reviewed hoặc dùng để mở khóa production reward/equipment gates. Cần nội dung giáo dục/source phù hợp cùng phê duyệt biên tập thật, hoặc một thiết kế test-fixture riêng được cô lập và hiển thị rõ ràng trước khi hoàn tất các vòng Catalog/Knowledge/Boss.

Ảnh môi trường và sprite hiện tại là asset prototype được sinh theo phong cách fantasy; chưa được con người duyệt như art sản xuất. Walkability dựa trên corridor graph/A*, chưa phải collision đa giác chi tiết. Chromium mobile emulation không thay thế thiết bị thật. Không có đo FPS.

**FULL LOCAL DEMO PASS chưa đạt.** Phần còn thiếu chính là nội dung/loop Knowledge–mini-game–Boss–reward có thể chơi an toàn, Catalog tương ứng với Journey, và QA hoàn chỉnh của hai vùng/thiết bị. Production readiness không được khẳng định.


## Cập nhật sửa navigation và grounding — 29-10-2026

### Walkable area, collision và pathfinding

Artwork vẫn là lớp thị giác; navigation riêng tại `src/features/healthclues/region-navigation-data.ts` là allow-list của các đường đi, nhánh tiếp cận và bridge deck đã author. Điểm ngoài corridor, ngoài map hoặc mất kết nối bị từ chối. A* chạy trên lưới 16px; kiểm tra clearance 12px, corridor effective 31px từ centerline, lấy mẫu segment mỗi 4px; chặn chéo góc qua corner không walkable. Cùng route solver phục vụ pointer/touch, phím mũi tên/WASD và Pet. Runtime không còn fallback lerp/đi thẳng khi route fail; nếu segment runtime vi phạm guard thì dừng và báo trạng thái. Bridge deck là đoạn riêng được vẽ cyan trong debug và được xét trong browser route assertion.

### Grounding/depth/camera

Nguyên nhân CSS cụ thể: component player sprite dùng class CSS Module, nhưng selector cũ nhắm literal `.character`, vì vậy absolute-bottom anchoring không áp dụng. Đã gắn class game tường minh `.hc-rpg-adventurer-sprite`; sprite bottom và soft shadow dùng world feet anchor, tên nhân vật đặt trên sprite. Root player/Pet sử dụng world coordinates trong cùng transform với artwork, camera follow/bounds giữ tọa độ ổn định. Bản đồ vẫn là một artwork phẳng; chưa có lớp foreground tách riêng để occlude actor theo cây/tòa nhà.

### Debug overlay

Local-only `?navDebug=1`/phím N, mặc định off: vùng ngoài network màu đỏ, corridor xanh, grid nodes, bridge deck cyan, route magenta, landmark approach points, player feet anchor, destination. Overlay ở trong cùng transformed world để theo map khi camera pan/zoom. Visual screenshots đã mở và kiểm tra; xem liên kết dưới.

### Browser acceptance evidence

Owner build thật tại `http://127.0.0.1:3249/play`, Mailpit `http://127.0.0.1:54324`. Local Auth/Postgres/Mailpit do `healthclues-owner-demo` Supabase quản lý, không dùng production. Lệnh kiểm thử:

`$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3249'; node scripts/test-healthclues-owner-auth-demo.mjs`

Lượt Chromium gần nhất PASS cho assertions của script: Mailpit verify; Sleep water click và building/roof click bị chặn; cùng tọa độ sau blocked click; keyboard blocked input; Sleep route tới bridge (75 nodes), đứng deck, đi tới Wellness/NPC; Health/Gout route (72 nodes), Lumi giữ Journey, đi tới Wellness và Botanist, touch emulation di chuyển; Talk chỉ sau khi đến; vị trí không đổi khi đóng interaction; camera/Pet follow; same World ID sau reload; tám Overworld region/sáu Coming Soon; second account isolation; Care Plan; TEST ONLY Knowledge/Boss/equipment; invalid callback; 0 uncaught browser runtime errors. Một lượt chạy trước đó từng gặp dừng đường Health sau mobile touch, nên collision toàn map chưa được nâng lên PASS production; lượt mới nhất sau instrumentation đã PASS. Build được giữ ở `%TEMP%\healthclues-owner-demo-builds\app-build-final-a5`; BAT trỏ đúng build. Không gửi email ra ngoài.

Ảnh browser JPEG đã kiểm tra tại `reports/previews/`: [Sleep walkability debug](previews/final-nav-sleep-walkability-debug.jpg), [water destination rejected](previews/final-nav-sleep-water-blocked.jpg), [Sleep route](previews/final-nav-sleep-bridge-route.jpg), [player on Sleep bridge](previews/final-nav-sleep-player-on-bridge.jpg), [Health debug](previews/final-nav-healthclues-realm-debug.jpg), [Health route](previews/final-nav-healthclues-routed-walk.jpg), [Health NPC arrival](previews/final-nav-healthclues-wellness-arrival.jpg). Desktop 1440×960. Mobile map/touch QA in the script is Chromium device emulation, not a physical phone.

### Kết quả và giới hạn còn lại

Navigation code + latest owner-browser assertions: PASS for exercised destinations/routes. Overall final game: PARTIAL. Path authoring is centerline-corridor based rather than a detailed walkable polygon/navmesh or raster collision mask. The blue bridge annotation is not a source-art collision mask, so full human spatial audit of every lake/cliff/road remains. Region art is generated prototype and not human approved; flattened artwork lacks foreground occlusion layers. Physical mobile pinch/touch and measured FPS have not been verified. Separate mini-game, four shared Skill categories with five persisted levels, reminder maturity, and other required unfinished progression remain PARTIAL/NOT STARTED. No production clinical content approval or deployment claim.

## 2026-10-29 continuation — mini-game and Skill source implementation; demo blocked

### Implemented in source, not yet demo-verified

- Added `src/app/api/healthclues/learning-games/route.ts`: four fixed, non-clinical TEST ONLY activities. The authenticated owner is required; the endpoint is disabled unless the isolated owner-demo environment flag is active. The route validates the submitted activity and complete answer sequence server-side, then calls a service-only owner-checked RPC. Incorrect answers do not create a record. XP is capped at one +3 award per user/game by a unique completion and the existing idempotency ledger.
- Added `supabase/migrations/20261029150000_healthclues_learning_skills_games.sql`: constrained Skill taxonomy, `healthclues_learning_game_completions` with owner RLS/read policy and unique completion, and service-only RPC. The migration was reviewed statically but NOT applied in this session.
- Updated `src/app/api/healthclues/knowledge/route.ts` to aggregate Skills across saved unique clue discoveries and game completions for the same authenticated player, while keeping the featured clue filtered to the saved active Journey. Progress response is owner-scoped and retains the current Journey content filter.
- Updated `src/features/healthclues/KnowledgeJourneyPanel.tsx` with four in-map TEST ONLY mini-games and four Skill cards using five derived levels: Novice / Explorer / Learner / Scholar / Master at 0 / 1 / 3 / 5 / 8 unique learning completions. Wrong answers retry without penalty. Levels are derived from durable unique completion records rather than an independently mutable level field.
- Extended `scripts/test-healthclues-owner-auth-demo.mjs` to play all four activities, assert Skill progress, and verify repeat completion does not grant XP again.

### Verification in this session

- PASS: focused ESLint on the three changed TypeScript files.
- PASS: focused TypeScript check with a temporary config that excluded the stale `.next` generated route types.
- PASS: `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs` (Sleep and Health each have seven valid approaches on one short path, without a bridge dependency).
- PASS: `node --check scripts/test-healthclues-owner-auth-demo.mjs`.
- PARTIAL: default `tsc --noEmit` reports existing stale `.next/types/validator.ts` errors (`Route` does not satisfy `never`, including `/`). No current build was generated.
- BLOCKED: real browser E2E, Auth/Mailpit/Postgres verification, migration application, persistence and screenshot inspection for this source revision. Docker daemon remains stopped and non-elevated `Start-Service com.docker.service` returned access denied. The exact previously owned HealthClues preview PID was stopped for the requested rebuild; owner URL `http://127.0.0.1:3249/play` is therefore not currently serving. Mailpit `http://127.0.0.1:54324` is not confirmed healthy.

### Required safe restart

Minimum Windows action: run PowerShell as Administrator and execute `Start-Service com.docker.service`; verify `Get-Service com.docker.service` says `Running`. Then return to the project shell and run `App\start-game-demo.bat --rebuild`. Before any migration or write, confirm the selected Docker context and local Supabase endpoint point to loopback and the isolated `healthclues-owner-demo` project. Do not reset/prune Docker resources or change `.env.local`.

### Current result

**Overall PARTIAL.** The simplified-map layout regression is source-tested, and a new isolated learning progression slice is implemented in source. Neither is browser-verified on the current build. The owner-playable URL and local inbox are BLOCKED pending Docker Desktop service startup. No production data, external email, deployment, volume reset or unrelated process termination occurred. Mobile physical-device gestures, final art/content approval, production safety review, complete Health journey traversal and performance measurement remain open.

## 2026-10-30 — Docker service started; Engine verification still blocked

- **Docker service / WSL:** `com.docker.service` reports Running; WSL Ubuntu and docker-desktop report Running.
- **Docker Engine:** NOT VERIFIED. `docker version` / `docker info` using the isolated demo Docker config and `npipe:////./pipe/dockerDesktopLinuxEngine` did not return. A read-only HTTP `/_ping` over that named pipe connected but received no response within 3 seconds. `supabase status --workdir App/.tmp/healthclues-owner-demo --output json` also did not return. No container was stopped/restarted.
- **Local service probes:** HTTP 200 from `http://127.0.0.1:54321/auth/v1/health` (GoTrue reports v2.197.0) and `http://127.0.0.1:54324/` (Mailpit). The local config declares project `healthclues-owner-demo`, API `127.0.0.1:54321`, DB `54322`, Mailpit `54324`, app callback port `3249`. Since Docker CLI/status cannot enumerate the project, those listeners are not yet proven to belong to the configured demo containers.
- **Guarded action:** did NOT run `App\start-game-demo.bat --rebuild`, database migration, Auth registration, or browser E2E. The launcher applies migrations after its service preflight; proceeding without confirming the Engine and exact local containers would violate the requested write-safety check. Current owner game port 3249 is unavailable.
- **Next:** confirm Docker Desktop UI reports the engine ready and run read-only `docker info` plus `docker ps --filter name=supabase_db_healthclues-owner-demo`. If these identify the expected local stack, run the prescribed BAT rebuild, verify it prints the loopback Supabase endpoint, then run the full Chromium owner E2E on that same build. Current status remains **PARTIAL / BLOCKED**; no production operation or resource cleanup occurred.

### Kiểm tra chỉ đọc bổ sung — 2026-10-30

- `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs`: PASS; 7 approaches cho mỗi vùng, một đường ngắn, Sleep 512 / Health 474 world units, không cần bridge.
- `node --check scripts/test-healthclues-owner-auth-demo.mjs`: PASS (cú pháp, không phải browser E2E).
- HTTP health: Auth `54321` = 200; Mailpit `54324` = 200; game `3249` = timeout/không phục vụ.
- Chromium E2E chưa chạy; không chụp screenshot build mới. Docker Engine API vẫn chưa xác nhận và không migration/test ghi dữ liệu nào được chạy.

## 2026-10-30 — Giai đoạn 1 Docker diagnosis; dừng theo safety gate

### Bằng chứng

- Windows service `com.docker.service`: Running / Manual. WSL: Ubuntu và docker-desktop Running.
- Docker context: `desktop-linux`; configured Docker API endpoint: `npipe:////./pipe/dockerDesktopLinuxEngine`. Launcher uses that same `DOCKER_HOST` and isolated config directory `App/.tmp/healthclues-owner-demo/docker-config`.
- Docker client version 29.3.1. Default-profile lookup fails with Windows Access denied for `C:\Users\Admin\.docker\config.json` / context metadata. Using explicit isolated config and explicit host avoids that profile read, but Docker returns `permission denied while trying to connect to the docker API`. Attempted read-only elevated `docker version/info/ps`; it did not return within timeout. Supabase CLI status also did not return.
- Ports 54321, 54322, 54324 are forwarded by `com.docker.backend` and `wslrelay`; Auth health `127.0.0.1:54321/auth/v1/health` and Mailpit root `127.0.0.1:54324/` each return HTTP 200. These responses establish reachable local forwarding only; without Engine/API enumeration they do not establish that the active listener belongs to the named owner-demo project/container.
- `127.0.0.1:3249/play` is unavailable (no listener; HTTP request timed out). No current-build screenshot exists.

### Decision / safety

**Phase 1 BLOCKED.** Exact container `supabase_db_healthclues-owner-demo` could not be verified with `docker ps`; configured Supabase database identity could not be confirmed. Per requested gate, did NOT execute `App\start-game-demo.bat --rebuild`, any migration, Auth/signup, or write-enabled browser E2E. Did not stop/restart Docker Desktop, edit ACLs/groups, stop other processes, reset/delete/prune any volume, use production Supabase, send email, or deploy.

### Exact unblock

Run from a normal Windows terminal outside the Codex sandbox (same Windows user, or an administrator terminal already authorized by the system): `docker --context desktop-linux info` and `docker --context desktop-linux ps --filter "name=supabase_db_healthclues-owner-demo"`. Require successful engine response and the exact project containers before resuming. If the same access denial occurs there, a Windows/Docker Desktop administrator must resolve supported named-pipe access; the project agent must not modify its ACL or bypass permissions.

After that proof, continue in order: run `App\start-game-demo.bat --rebuild`, inspect the launcher’s loopback preflight before migrations, verify Auth/Mailpit/DB and current game build, then execute the actual Chromium Sleep and Health/Gout E2E and inspect screenshots. Current outcome remains **PARTIAL / BLOCKED**, not FULL LOCAL DEMO PASS.

## Character identity correction and final region QA — 2026-10-30 — browser PASS for exercised scope / overall PARTIAL

### Scope and visual evidence

Preserved both scenery images, world positions, NPC station anchors and path/navigation logic. Replaced only character rendering: original transparent blue-cloak player with satchel and four-frame idle/walk strip; separate broad-brimmed Botanist with basket/apron; athletic Trail Explorer with hiking kit/staff; calm cream/lavender Wellness Guide with lantern. Stable NPC identity assets are shared across both maps. Characters remain separate world objects with feet anchors, shadows and idle animation. The background art SHA256 values still match the before-change values, confirming no map art changed. Map composition/artwork is now locked unless owner explicitly requests a correction.

Fresh full-map captures: [Sleep 1440×900](previews/owner-two-region-sleep-map-desktop.jpg), [Sleep 1920×1080](previews/owner-two-region-sleep-map-1920x1080.jpg), [Sleep mobile 390×844](previews/owner-two-region-sleep-map-mobile.jpg), [Realm 1440×900](previews/owner-two-region-health-gout-desktop.jpg), [Realm 1920×1080](previews/owner-two-region-health-gout-map-1920x1080.jpg), [Realm mobile 390×844](previews/owner-two-region-health-gout-mobile.jpg). Names-hidden close-ups: [Sleep player](previews/character-sleep-player-labels-hidden.jpg), [Botanist](previews/character-sleep-botanist-labels-hidden.jpg), [Trail Explorer](previews/character-sleep-explorer-labels-hidden.jpg), [Wellness Guide](previews/character-sleep-wellness-labels-hidden.jpg), [Realm player](previews/character-health-player-labels-hidden.jpg), [Botanist](previews/character-health-botanist-labels-hidden.jpg), [Trail Explorer](previews/character-health-explorer-labels-hidden.jpg), [Wellness Guide](previews/character-health-wellness-labels-hidden.jpg). Route images: [Sleep mid-route](previews/09dr-sleep-walk-mid-route-desktop.jpg), [Sleep Botanist arrival](previews/09dr-sleep-botanist-arrival-desktop.jpg), [Health Guide arrival](previews/owner-two-region-health-gout-arrival-desktop.jpg).

Visual review of actual browser images: roles remain readily distinguishable with labels hidden; NPCs occupy separate stations; feet appear grounded on authored path/open station ground. Desktop shows the foreground route and branches; mobile keeps world coordinates and follows the player. This does not certify pixel-perfect terrain collision or physical-device behavior.

### Browser and focused test evidence

- Rebuilt isolated `app-build-final-a10`, served at `http://127.0.0.1:3249/play`; local Supabase `127.0.0.1:54321` and Mailpit `127.0.0.1:54324`; local volume retained, no production data/deploy.
- `node scripts/test-healthclues-owner-auth-demo.mjs` — PASS against exact 3249 build. Both authenticated routes (Sleep/Luna; Quiz-selected Health/Gout/Lumi), loaded distinct assets and stable NPC identity, hidden-label close-up assertions, player walk cycle/direction reversal, both route sets/NPC Talk after arrival, Pet following and settling, close dialogue/continue, World ID reload, Care Plan isolation, Daily Companion, four mini-games/early persisted Skills, Boss and Rewards; runtime errors 0. Automated screenshot geometry checks cover visible labels/important surfaces; visual inspection supplements geometry.
- `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs` — PASS (7 approaches each, 11 connected nodes, no bridge dependency). `node --check scripts/test-healthclues-owner-auth-demo.mjs` — PASS. Focused ESLint — 0 errors/two existing `<img>` warnings.
- Overall **PARTIAL**, not full production acceptance: generated art awaits owner approval; mobile is emulated; physical touch/FPS unverified; learning content TEST ONLY/not human-reviewed; browser fixture reached early Skill levels though thresholds are source-tested; pixel collision and production privacy/security/release are not certified. See `CURRENT_STATE.md` for exact next task.
# Addendum — reminder settings UI regression — 2026-10-30

**Trạng thái tổng thể: PARTIAL; không phải production-ready.** Tiếp nối build local đang chạy, không thay schema/source gameplay, không chạm production.

- Browser E2E thật: `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3257 node --experimental-strip-types scripts/test-healthclues-owner-auth-demo.mjs` — **PASS** sau khi thêm UI path. Tài khoản Supabase local đã xác minh; local Mailpit.
- Ở 390×844, từ Backpack → Journey settings, người chơi đổi timezone thành `America/New_York`, local time thành `20:15`, đồng ý reminder rồi lưu. API GET cùng owner xác nhận hai giá trị. Click Pause → Resume → Unsubscribe; GET sau mỗi thao tác xác nhận `paused=true` → `paused=false` → `opted_in=false`. UI không tràn ngang; `runtimeErrors=0`.
- Worker local: một delivery `queued=1, claimed=1, sent=1, failed=0`; nội dung generic không có Journey/Care Plan; worker chạy lại không gửi thư trùng (`sent=0`, Mailpit vẫn có đúng một reminder). Không có external email.
- Ảnh mới: `reports/previews/owner-reminder-settings-edit-pause-resume-unsubscribe-mobile.jpg`, chụp từ browser E2E trên mobile emulation và đã kiểm tra trực quan.
- **Chưa xác minh / còn thiếu:** recovery cho worker chết sau khi Mailpit nhận thư nhưng trước khi trạng thái DB cập nhật (stale `claimed`); weekly reflection riêng; scheduler cloud chạy khi máy owner tắt; gửi production; thiết bị mobile vật lý; provider AI thật; human editorial review và production security/release review. Không tự khẳng định các phần này PASS.
- **Phân loại:** IMPLEMENTED — existing reminder preferences UI/API và local Mailpit worker; BROWSER VERIFIED — UI edit/pause/resume/unsubscribe, local delivery và dedupe bình thường; LOCAL EMAIL VERIFIED — Mailpit duy nhất; PRODUCTION DELIVERY NOT VERIFIED. Demo URL `http://127.0.0.1:3257/play`.
