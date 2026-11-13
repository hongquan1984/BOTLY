# HEALTHCLUES — Nghiệm thu trải nghiệm Thế giới

## Bổ sung mới nhất: khôi phục Plan trong Quests — 2026-10-31

- **Nguyên nhân:** Quests chỉ đọc revision đã xác nhận có `worldId` trùng World hiện tại. Quiz profile được lưu riêng; gợi ý chưa Confirm không phải Plan và không được chuyển thành goal. Empty state cũ không giải thích điều này, cũng không cho mở lại gợi ý. DB local có cả Sleep World có/không có Plan; không có session để nhận diện bản ghi của owner nên không gán nhầm tài khoản. Không sửa dữ liệu hiện hữu.
- **Đã sửa:** Quests tải lại Plan qua API owner-scoped khi mở. Loading/lỗi tách khỏi trạng thái rỗng. Nếu Quiz profile còn, người chơi có thể xem lại gợi ý mà không làm Quiz lại. Back/Skip không ghi dữ liệu; chỉ Confirm tạo revision. `saved` vẫn là Saved for later. Safety context thiếu giữ `unknown`; `safetyLevel: none` được bảo toàn.
- **Persistence/quyền riêng tư:** Dùng lại `profile.wellnessPlans` và API hiện có; không đổi schema/migration. Tài khoản thứ hai thử GET Plan và POST revision vào World của tài khoản thứ nhất đều nhận 404.
- **Chromium:** Build `app-build-quests-plan-recovery-20261031`, [http://127.0.0.1:3270/play](http://127.0.0.1:3270/play), Supabase local `healthclues-owner-demo`. Full owner-auth E2E: PASS, `runtimeErrors: 0`. Sleep Quiz → bỏ qua Plan → xác minh Mailpit → vào World → Quests báo chưa có Plan → xem lại gợi ý từ Quiz đã lưu → bỏ qua và API vẫn trả `null` → chọn một mục “Save for later” và Confirm → revision 1 có đúng goal đã chọn, `choice=saved` → Quests hiển thị chính xác goal/trạng thái → reload giữ cùng World ID và goal. Gout/Lumi no-plan cũng mở được recovery; skip không tạo goal.
- **Hồi quy:** Hai Region, movement/Talk tới NPC, Backpack, Collection, Care Plan, Daily Companion, Knowledge/4 mini-game/Skills, Boss/Rewards, persistence, account isolation, Mailpit delivery/dedupe đều PASS; runtime errors 0. Không reset volume, không migration/seed, không production/deploy.
- **Ảnh đã mở kiểm tra:** `reports/previews/no-plan-sleep-wellness-plan-desktop.jpg`, `no-plan-sleep-wellness-plan-mobile.jpg`, `no-plan-sleep-recovered-suggestions-desktop.jpg`, `no-plan-sleep-recovered-suggestions-mobile.jpg`, `no-plan-sleep-quests-confirmed-plan-desktop.jpg`. Mobile là Chromium emulation, không phải thiết bị vật lý; checklist cuộn trong panel.
- **Giới hạn:** Chưa thể xác nhận trạng thái của chính tài khoản owner đang mở build 3265 vì không có session/token nhận diện. Đăng nhập tài khoản đó tại build 3270 để đối chiếu trực tiếp, không cần làm lại Quiz. Nội dung demo vẫn TEST ONLY, không phải human review hay AI thật.

**Ngày:** 2026-10-30  
**Phạm vi:** Master Prompt 11 — hướng dẫn Pet khi vào World lần đầu, hiển thị Wellness Plan trong Quests và tương tác Region hiện có.  
**Kết luận cập nhật 2026-10-31:** **ACCEPTED cho nghiệm thu Master Prompt 11 trên Owner Demo local**. Lượt full Chromium regression cũ trên 3265 đã được chạy lại thành công trên build mới 3269; xem phần bổ sung mới nhất ngay dưới đây. Đây không phải chứng nhận production readiness; fixture nội dung vẫn TEST ONLY và mobile là browser emulation.

## Bổ sung xác minh build mới nhất — 2026-10-31

Full regression đã được chạy lại trên source build riêng `app-build-complete-journey-note-handoff-20261031` (`http://127.0.0.1:3269/play`), kết quả `PASS`, `runtimeErrors: 0`. Bản chạy này xác nhận tutorial bốn bước, empty Plan, cả hai region, đi bộ/Talk, Backpack, Collection, Care Plan/privacy, Daily Companion, Knowledge/four mini-games/Skills, Boss/Rewards, World reload và Mailpit local. Đồng thời luồng Quiz→Plan→Mailpit verification→World trên cùng build giữ nguyên Plan/original note. Do đó acceptance local Master Prompt 11 vẫn ACCEPTED và có bằng chứng mới hơn build 3265; điều này không thay đổi giới hạn production, real-time AI hay review nội dung.

## Cập nhật nghiệm thu cuối — 2026-10-31

- **Build và môi trường:** `app-build-world-experience-20261030d`, [http://127.0.0.1:3265/play](http://127.0.0.1:3265/play). Preflight lại PASS: Supabase local project `healthclues-owner-demo`, CLI 2.122.0, API `127.0.0.1:54321`, Auth/REST/Mailpit local reachable; không có remote Supabase env kế thừa và không in secret. Các build cũ/containers/volume được giữ nguyên.
- **Sửa test đã lỗi thời:** `scripts/test-healthclues-owner-auth-demo.mjs` trước đây đòi text `LUNA IS YOUR COMPANION`, rồi đi theo flow cũ có ba trạm bắt buộc, Toolkit Summary và Reminder Setup trong tutorial. Thay bằng assertion bốn bước theo `data-world-entry-tutorial` (Welcome → actual/no Plan goals → mở Plan từ Quests → Start Exploring), kiểm tra liên kết Quests thật/highlight, đóng Plan quay lại cùng step. Sau khi hoàn tất mới kiểm tra tự do mở trạm/World Map; không bỏ các kiểm tra gameplay phía sau. Bổ sung ca browser dedicated không có confirmed Plan cho Sleep/Luna và Gout/Lumi; cả hai xác nhận API trả `wellnessPlan: null`, không có goal card giả, và hiện lời mời khám phá tự do.
- **Hồi quy thực thi:** lệnh `node scripts/test-healthclues-owner-auth-demo.mjs` với `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3265` trả JSON `result: PASS`; `runtimeErrors: 0`. Chạy Chromium thật, Auth xác minh email qua Mailpit local. Bằng chứng gồm World ID giữ nguyên sau reload, ba NPC phải đi tới mới Talk, hai Region, Backpack ba slot/equip/replace/remove, Collection độc lập, Care Plan riêng tư, Daily Companion ghi nhận đúng báo cáo tự nguyện, Knowledge và đủ bốn mini-game/Skills, Boss server-authoritative, Rewards khớp World, Coming Soon, World persistence và cross-account isolation.
- **Persistence/privacy:** Sleep World sau reload có cùng ID, 2 trang bị còn lại và Collection giữ mục đã bỏ Backpack. Hai user local synthetic tách biệt; user thứ hai không đọc được recommendation/Care Plan của user đầu (HTTP 404) và không thấy check-in riêng. Không xóa hoặc reset tài khoản/World đã có. Các tài khoản synthetic mới của các lần test được giữ trong local DB.
- **Daily Companion/nhắc giờ:** check-in lưu đúng hai trạng thái người chơi chọn và private note; reload xác nhận. Reminder UI edit/pause/resume/unsubscribe PASS trên mobile emulation. Worker test dùng Mailpit local: tài khoản hiện tại nhận đúng một mail privacy-preserving; lần chạy lặp gửi `0`; không gọi email ngoài.
- **Di chuyển/hiển thị:** cả Sleep Valley và HealthClues Realm đi được đến Botanist, Trail Explorer, Wellness Guide và các landmark được test; NPC Talk chỉ mở khi đã tới, đóng panel giữ tọa độ. Route graph không phụ thuộc cầu; click vào hồ Sleep bị chặn và không teleport. Screen checks desktop 1440×900/1920×1080 và mobile emulation 390×844 không có lỗi horizontal overflow trong các panel/assertions. Đã mở xem trực quan ảnh tutorial Luna/Lumi, empty Plan mobile, hai map desktop/mobile, NPC panel, Backpack, Knowledge mini-game và Daily Companion mobile; không thấy label/controls chồng hoặc bị cắt ở các ảnh đó.
- **Ảnh browser mới:** `reports/previews/no-plan-sleep-tutorial-step-1-desktop.jpg`, `no-plan-sleep-tutorial-step-1-mobile.jpg`, `no-plan-sleep-tutorial-step-2-desktop.jpg`, `no-plan-sleep-wellness-plan-desktop.jpg`, `no-plan-sleep-wellness-plan-mobile.jpg`, `no-plan-sleep-tutorial-step-4-desktop.jpg`, `no-plan-sleep-world-entry-ready-desktop.jpg`; cùng các ảnh prefix `no-plan-gout-`. Ảnh gameplay/regression: `owner-two-region-sleep-map-desktop.jpg`, `owner-two-region-sleep-map-1920x1080.jpg`, `owner-two-region-sleep-map-mobile.jpg`, `owner-two-region-health-gout-mobile.jpg`, `owner-two-region-health-gout-station-desktop.jpg`, `owner-backpack-three-tools-replacement.jpg`, `owner-test-only-evidence-mini-game-mobile.jpg`, `final-companion-checkin-mobile.jpg`, `owner-reminder-settings-edit-pause-resume-unsubscribe-mobile.jpg` trong `reports/previews/`.
- **Kết quả:** Master Prompt 11 **ACCEPTED cho local authenticated gameplay regression**. Production remains **NOT VERIFIED / NOT APPROVED**; synthetic learning/equipment fixtures không phải human-reviewed content, Mailpit không chứng minh hosted scheduler/email, thiết bị di động thật/FPS/physical gestures chưa kiểm tra.

### Ma trận nghiệm thu hiện hành

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Tutorial 4 bước và no-Plan | PASS | Chromium; Sleep tự mở với Luna; Health/Gout tự mở với Lumi; goal list rỗng đúng, CTA Quests/Plan hoạt động |
| Backpack / Collection / Care Plan | PASS | Browser actions, API reload, local Postgres xác nhận ba slot và replacement; các kho dữ liệu tách riêng |
| Daily Companion / Knowledge / mini-games / Skills | PASS | Check-in tự nguyện lưu sau reload; đủ 4 game hoàn thành, Skills giữ nguyên và duplicate reward bị chặn |
| NPC, movement, Boss, Rewards, hai map | PASS | Browser routes/Talk và state persistence; Boss/reward API; 8 vùng hiện diện, 6 Coming Soon |
| Auth, World persistence, account isolation | PASS | Hai local synthetic users; cùng World sau reload; cross-owner private reads bị chặn |
| Desktop/mobile visual QA | PASS trong browser emulation | Screenshot 1440×900/1920×1080/390×844 đã được kiểm tra trực quan; không thay thế thiết bị thật |
| Local email worker | PASS local-only | Mailpit; current account nhận đúng một thư, retry không gửi trùng; production delivery chưa xác minh |
| Production readiness | NOT VERIFIED | Không production access/write/deploy; content, hosting scheduler/provider, security review và thiết bị thật còn ngoài phạm vi |

Lượt chạy đầu với test cũ đã dừng ở assertion Pet đời trước; sau khi sửa script, lượt chạy cuối cùng full suite trả `PASS`. Một lượt trung gian phát hiện worker trả tổng số lịch local đang đến hạn (không chỉ một), vì Owner Demo giữ các lịch synthetic cũ; assertion được sửa để kiểm tra trạng thái tổng hợp hợp lệ và xác nhận riêng tài khoản hiện tại nhận đúng một email, không chỉnh/xóa lịch cũ.

## Môi trường local an toàn

- Build source hiện hành chạy độc lập với tên `app-build-world-experience-20261030d`: [http://127.0.0.1:3265/play](http://127.0.0.1:3265/play). Các build trước trên 3249, 3254, 3257, 3258, 3261–3264 được giữ nguyên.
- Kiểm tra read-only **PASS**: Supabase project `healthclues-owner-demo`, CLI 2.122.0, API `http://127.0.0.1:54321`; Auth health/settings, REST và Mailpit loopback phản hồi; runtime config thuộc đúng project; không nhận biến Supabase remote từ môi trường cha. Không in secret/key.
- Launcher dùng `--reuse-existing-supabase`; không start/stop container, migrate, seed hoặc reset. Browser tạo tài khoản/World tổng hợp mới trong DB local đang lưu bền; dữ liệu đó được giữ nguyên. Không đụng production/deploy.

## Đã triển khai

- **Hướng dẫn lần đầu:** bốn bước dạng dialog toàn màn hình trên nền Region thật, có dim/blur nhẹ, đúng Pet theo vùng (Lumi/HealthClues Realm, Luna/Sleep Valley), tên đã lưu, lời thoại ngắn, tiến độ, Back/Continue/Skip. Focus được đưa vào dialog và phím Tab bị giữ trong dialog; có hỗ trợ reduced-motion.
- **Goals thật:** bước 2 lấy goal từ Plan hiện hành của đúng World; source có lời nhắn khám phá tự do khi không có goal. Không chèn ví dụ làm dữ liệu giả. Ca no-Plan đã browser-verified riêng cho Sleep/Luna và Gout/Lumi.
- **Quests:** nút Quests và CTA tutorial mở cùng Plan đã lưu; Adventure Camp có thêm lối vào. Đóng Plan ở bước 3 trở lại dialog đó, không làm đổi vị trí người chơi.
- **Thao tác Plan:** đọc revision hiện hành và hiển thị mục tiêu, loại, nguồn, target, lịch, trạng thái ghi nhận. Sửa target/đơn vị/lịch/định nghĩa tracking, pause/resume và remove có xác nhận đều tạo revision mới qua API xác thực hiện có. Personal note mới được gắn USER-CREATED / NOT REVIEWED và để dành; chỉ sau khi cấu hình mục tiêu đo được và bấm Resume thì mới active. Không sinh dữ liệu Daily Care.
- **Region:** giữ nguyên hình, vị trí NPC, đồ họa và route graph. Bước cuối đánh dấu Botanist làm mục tiêu đầu tiên không bắt buộc. Browser xác nhận người chơi đi tới điểm tiếp cận trước Talk; đóng hội thoại giữ nguyên vị trí.

## Kết quả kiểm thử

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Định danh local runtime | PASS | Đúng project, API loopback, Auth/REST/Mailpit; không có remote env |
| Chromium Gout → HealthClues Realm | PASS | Lumi, goal thật, Quests/Plan, chỉnh sửa Plan và World reload |
| Chromium Sleep → Sleep Valley | PASS | Luna, goal thật, Quests/Plan và World reload |
| Sửa / tạm dừng / tiếp tục / gỡ goal | PASS | Gout revision 8; remove có xác nhận; trạng thái pause không active |
| Personal note → cấu hình → kích hoạt | PASS | Note mới ban đầu để dành; đặt target `3 days`, rồi bấm Resume; còn lưu ở revision 8 |
| Hoàn tất tutorial / reload / replay / skip | PASS | Không tự lặp sau reload; Help replay; Skip cũng được lưu |
| Đường đi và NPC Talk | PASS | Cả hai vùng: đi theo đường đã soạn tới Botanist; chỉ Talk sau khi tới; đóng panel giữ vị trí |
| Cách ly tài khoản | PASS | Hai tài khoản/World khác nhau; đọc và ghi Plan chéo đều HTTP 404 |
| Browser mobile | PASS trong phạm vi đã chạy | Emulation 390×844: tutorial, Quests, Plan, NPC và Region; không tràn ngang |
| Lỗi JavaScript runtime | PASS | 0 uncaught errors trong E2E mục tiêu |
| Kiểm tra source | PASS | Region layout (2 vùng, 11 nút đường, không phụ thuộc cầu), wellness plan 41 assertions, Quiz safety 38 assertions, `node --check`; ESLint 0 lỗi/2 cảnh báo `<img>` có sẵn |
| Hồi quy toàn bộ RPG build hiện tại | PASS (cập nhật 2026-10-31) | Lịch sử tại thời điểm 2026-10-30 dừng vì assertion Pet cũ; assertion đã được cập nhật. Full Chromium run mới trên build 3265 thực hiện Backpack/Collection/Check-in/Knowledge/4 mini-games/Skills/Boss/Rewards, account isolation và persistence, kết quả `result: PASS`, runtime errors 0. |

Lệnh E2E mục tiêu:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3265'
node scripts/test-healthclues-post-quiz-plan-browser.mjs
```

Kết quả script: `PASS_LOCAL_AUTHENTICATED_PLAN_PERSISTENCE`; project `healthclues-owner-demo`; Gout revision 8/3 goals, Sleep revision 1/3 goals; đọc/ghi chéo 404; runtime errors 0.

## Ảnh Chromium đã mở kiểm tra

- Pet: [Lumi desktop](previews/post-quiz-gout-world-tutorial-welcome-desktop.png), [Lumi mobile](previews/post-quiz-gout-world-tutorial-welcome-mobile.png), [Luna desktop](previews/post-quiz-sleep-world-tutorial-welcome-desktop.png).
- Goals/Quests: [goal đã lưu](previews/post-quiz-gout-world-tutorial-saved-goals.png), [Quests desktop](previews/post-quiz-gout-world-tutorial-quests-highlight.png), [Quests mobile](previews/post-quiz-gout-world-tutorial-quests-highlight-mobile.png).
- Plan: [desktop](previews/post-quiz-gout-world-my-wellness-plan.png), [mobile sau chỉnh sửa](previews/post-quiz-gout-world-plan-revised-mobile.png). Gợi ý hiện TEST ONLY; personal note có nhãn SELF-REPORTED.
- Region: [desktop](previews/post-quiz-gout-world-free-exploration-desktop.png), [mobile](previews/post-quiz-gout-world-free-exploration-mobile.png).
- NPC: [Botanist Talk desktop](previews/post-quiz-gout-world-botanist-talk-desktop.png), [mobile](previews/post-quiz-gout-world-botanist-talk-mobile.png).

Tutorial giữ được hình nền Region có thể nhận diện. Plan mobile cuộn dọc, không tràn ngang. NPC panel trên mobile cần cuộn dọc nhưng các nút Explore/Save/Not interested nhìn thấy. Mô phỏng Chromium không thay thế thiết bị thật.

## Files thay đổi

- Source: `src/components/healthclues/HealthCluesGameShell.tsx`, `src/components/healthclues/HealthCluesGameShell.module.css`, `src/features/healthclues/WorldAdventureScene.tsx`, `src/features/healthclues/WellnessWorldGame.tsx`, `src/features/healthclues/RegionMapScene.tsx`, `src/features/healthclues/world-adventure.css`.
- E2E: `scripts/test-healthclues-post-quiz-plan-browser.mjs`.
- Tài liệu: `App/CURRENT_STATE.md`, `App/HEALTHCLUES_CONTEXT.md`, `App/MASTER_SPEC.md`, `App/UI_UX_SPEC.md`, `App/USER_FLOWS.md`, `App/USE_CASES.md`, `App/BUSINESS_RULES.md`, `App/DATABASE_DESIGN.md`, `App/DECISIONS_AND_ASSUMPTIONS.md`, report này.
- DB: không có migration/table mới; dùng guide state và profile JSON revisions hiện hữu.

## Giới hạn ngoài acceptance local

- Full local acceptance đã hoàn tất theo cập nhật 2026-10-31 ở đầu báo cáo. Các ảnh/World synthetic cũ được giữ nguyên; không reset data.
- Kiểm thử thao tác/performance trên thiết bị thật, human review nội dung và đánh giá bảo mật/production chưa thực hiện. Nội dung demo là TEST ONLY / NOT HUMAN-REVIEWED; Mailpit local không xác nhận email production.
- Không bắt đầu Phase 10B, Home, Pet Evolution, Challenge Chapter hoặc cơ chế Boss mới.
