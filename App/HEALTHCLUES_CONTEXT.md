## Latest handoff — RPG Quest Board Game UI Redesign & Verification — 2026-11-03

Giao diện tạo kế hoạch (`WellnessPlanBuilder.tsx`) được thiết kế lại thành Bảng Giao Ước / Quest Selection Board chuẩn RPG: tích hợp thú cưng Luna/Lumi qua lời thoại dẫn dắt (`HealthCluesPet`), thanh hiển thị 3 ô trang bị nhiệm vụ ma thuật (`Quest Slots HUD`), thẻ thử thách có cấp độ [Khởi Động] / [Bứt Phá] và phần thưởng EXP, tự động trang bị vào slot khi chọn độ khó, đồng thời loại bỏ các banner hành chính gây ngợp màn hình và bản địa hóa 100% tiếng Việt. Đã sửa lỗi mojibake tiếng Việt hiển thị dấu hỏi (`?`) trong các thông báo lỗi lưu hành trình tại `HealthCluesWorldPreview.tsx` và bổ sung secret fallback ngăn lỗi 503 trong môi trường preview cục bộ. Tạo mới bộ test tự động `scripts/test-healthclues-rpg-quest-board.mjs` (PASS). Toàn bộ 4 test suites đều PASS. Đã chụp ảnh thực tế desktop/mobile trên live server cổng 3329. Chưa chạy live Gemini; dữ liệu kiểm thử giữ nguyên nhãn an toàn.

## Latest continuation — continuous Quiz/Plan/email/World handoff — 2026-10-31

Current isolated build is `http://127.0.0.1:3269/play` against local `healthclues-owner-demo`. Chromium verified a new Gout Quiz, configured/saved Plan, exact self-written note, local Mailpit confirmation, same-build callback, World creation, Lumi tutorial and Plan persistence. Fix: pending encrypted handoff had omitted optional `originalNote`; validator now retains it with a 180-character limit. Full owner-auth RPG regression on 3269 passed (Backpack, Collection, Care Plan/privacy, Daily Companion, Knowledge/four games/Skills, Boss/Rewards, movement/NPC, reload; runtime errors 0). Earlier ports and local data were preserved. Real-time Codex/LLM remains absent; recommendation rules are deterministic and source candidates remain TEST ONLY, so the broader product is PARTIAL. See `reports/HEALTHCLUES_END_TO_END_PLAYER_EXPERIENCE_ACCEPTANCE.md` and `reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md`.

## Latest handoff — integrated Quiz → Plan → World continuation — 2026-10-31

Build `app-build-complete-journey-visual-fix-20261031` runs at `http://127.0.0.1:3268/play` against the verified isolated local project `healthclues-owner-demo` (API loopback 54321; CLI 2.122.0). Full Plan Chromium E2E includes a Digestion & Gut Health coverage-gap account; unsupported topics return no recommendations, can skip into the selected playable region with no fabricated Plan, preserve the private Quiz topic, and receive Lumi's actual four-step tutorial. A fail-closed `topic === null` guard fixes an unrecognized-topic/Catalog-null tag collision; regression test includes a generic unrelated Catalog candidate. Gout/Sleep persistence and cross-account 404 checks pass. Full owner-auth RPG regression on 3268 returned PASS with zero runtime errors, including Mailpit, movement/NPC Talk, Backpack, Collection, Care Plan, Daily Companion, Knowledge/mini-games/Skills, Boss/Rewards and World persistence. Desktop and mobile browser screenshots were opened and inspected; the mobile tutorial Pet was enlarged and its rendered width asserted. Live Codex/LLM remains unavailable; Gout/Sleep templates are TEST ONLY / not human-reviewed, and Digestion has no supported content. Overall continuous journey with realtime AI is therefore PARTIAL, not accepted. Details: `reports/HEALTHCLUES_END_TO_END_PLAYER_EXPERIENCE_ACCEPTANCE.md`.

## Latest handoff — Master Prompt 11 World experience — 2026-10-30

Luồng vào World có xác thực dùng tutorial bốn bước dạng cinematic trên artwork Sleep Valley/HealthClues Realm hiện hữu. Tutorial đọc goal thực từ World Plan, mở đúng Plan qua Quests rồi đánh dấu Botanist là mục tiêu đầu tiên. Chromium E2E trên build local cô lập `http://127.0.0.1:3265/play` xác nhận Gout/Lumi và Sleep/Luna, sửa/pause/resume/remove Plan, thêm/cấu hình/kích hoạt personal goal, reload World/Plan, replay/skip tutorial, đi bộ tới NPC và Talk, mobile emulation, cùng cross-owner 404. Ảnh: `reports/previews/post-quiz-gout-*` và `post-quiz-sleep-*`. Tổng trạng thái PARTIAL vì regression RPG cũ dùng assertion Pet guide đã lỗi thời và dừng trước Backpack/Knowledge/Boss; cần cập nhật, chạy lại các suite đó. Nhánh Plan rỗng chưa được browser kiểm thử riêng. Không dùng production/deploy; nội dung fixture vẫn TEST ONLY. Xem `reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md` và `CURRENT_STATE.md`.

## Latest handoff — Post-Quiz Wellness Plan browser acceptance (2026-10-30)

The updated isolated build at `http://127.0.0.1:3261/play` completed authenticated local Chromium flows for Gout and Sleep using separate synthetic accounts. Each account configured, adjusted, skipped and added goals, confirmed a Plan, activated its own World and retained the same plan revision/World after reload. Cross-account plan read and write returned 404. Desktop/mobile screenshots were captured and visually inspected. Local runtime identity is `healthclues-owner-demo` (CLI 2.122.0; API 127.0.0.1:54321); the launcher used ignored `.tmp/healthclues-owner-demo/owner-demo-runtime.json`, never `.env.local`. Exact evidence and blockers are at the top of `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md` and `CURRENT_STATE.md`.

The checklist is deterministic; no live LLM is connected. Six Gout and four Sleep habit templates are TEST ONLY / not human-reviewed. Other topic identifiers do not imply content coverage. Email verification callback on the new port 3261 remains unverified because local Auth's allowlist currently targets 3257. A follow-up UI/E2E fix also removed the misleading no-fluid-restriction checkbox for unknown hydration context and blocks adding that goal. No Home/Phase 10B work is authorized by this handoff; production and existing demo services were not changed.

## Continuation: Phase 10A Wellness Plan Builder (historical snapshot; browser status superseded below)

Source changes are in Quiz/WorldPreview, a new shared Wellness Plan rules/UI module, authenticated plan API, pending handoff validator, World payload and Camp Daily Care preview. No separate plan table or duplicate daily tracker was added. Full status and exact next task: CURRENT_STATE.md; evidence matrix: reports/HEALTHCLUES_PHASE_10A_ACCEPTANCE.md. Local database writes/browser persistence verification are intentionally paused until isolated database identity can be read; production untouched.

## 2026-10-30 handoff — Lumi-guided Journey update
The local implementation now has private nickname editing, a structured Gout context helper, persisted guided-tour stages through Toolkit Summary/reminder choice, and optional provider-gated NPC chat. Authenticated Chromium E2E passed on isolated `http://127.0.0.1:3257/play`, with local Supabase/Mailpit only and no runtime browser errors. AI is deliberately disabled in Owner Demo and local Owner Demo now has an isolated Mailpit reminder path; the production scheduler/provider remains unavailable. See the newest section in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` for evidence, screenshot paths and exact remaining blockers. The browser verified one generic opted-in Mailpit reminder and zero duplicates after repeat. Do not interpret TEST ONLY catalog entries as reviewed recommendations or the mock worker as email delivery.
# HealthClues Context

## Handoff — personalized recommendation engine — 2026-10-30

Bản source hiện có deterministic RPG recommendation service `hc-personalized-rules-v1` dùng Quiz profile + catalog version + Collection/Backpack/Care Plan/history, safety yes/no/unknown và reason giải thích được. Owner Demo mới nhất: [http://127.0.0.1:3254/play](http://127.0.0.1:3254/play); local Auth/DB `54321`, Mailpit `54324`, persistent demo volume được giữ. Migration `20261030120000` đã áp local. Authenticated Chromium E2E, engine unit, Quiz safety và discovery matching PASS trong scope local; E2E kiểm tra alternative ranking và preference/time PATCH + GET mà không thay Backpack. Chi tiết build, ảnh, lệnh test và giới hạn nằm ở đầu `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` và `CURRENT_STATE.md`. Catalog fixtures là TEST ONLY, không human-reviewed. Chưa browser-test hai account cùng Gout hoặc click-path preference editor/reload; chưa production sign-off.

## Backpack & Toolkit final integration — 2026-10-30 — authenticated local browser PASS; release remains PARTIAL

- Rebuilt and launched the isolated production-mode Owner Demo from current source as `app-build-final-a10` at [http://127.0.0.1:3249/play](http://127.0.0.1:3249/play). Local Supabase/Auth uses `127.0.0.1:54321`; Mailpit uses `127.0.0.1:54324`. The dedicated local database volume was retained. No production endpoint/data or deployment was used.
- Replaced the pre-world fixed Consume/Reduce/Practice selection UI with an empty, three-position flexible Backpack. First entry now leads into the Journey and NPC discovery; selection is voluntary and uses the existing in-world Backpack. Corrected dashboard replacement to select any eligible tool and explicitly confirm the target position. Collection now receives educational entries even when they cannot be equipped, preserving a saved non-eligible Tomato as learning content.
- Food & Botanical Garden, Activity Trail and Wellness Sanctuary show populated, Journey-matched fixture cards with evidence/safety limitations. Fixtures (Tomato, Potato, Cherries, Ginger, water/hydration, movement and relaxation examples) are local `TEST ONLY`, `NOT HUMAN-REVIEWED`, evidence-not-assessed; the product never presents them as clinically effective. Demo equipment eligibility is server-validated and disabled outside the isolated owner demo. Tomato is intentionally not equipment-eligible.
- **Browser E2E PASS on the rebuilt URL:** `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs`. Auth used local Mailpit. Sleep/Luna and Quiz-selected Health/Gout/Lumi routes, player/Pet movement, all NPC arrivals/Talk, content preview/full details, source links, Collection save/browse/details/unsave/resave, equipment, fourth-item explicit replacement, removal while preserving Collection, reload, private Care Plan, Daily Companion and account isolation passed. All four Knowledge mini-games, four Skill progression counters, Boss/key/reward and Rewards station passed; repeated mini-game completion granted no repeat XP. Browser runtime errors: 0.
- Equipment browser flow filled three independent positions, equipped two tools of the same action category, attempted a fourth and explicitly replaced position 2, removed one entry, and reloaded the same World. Local PostgreSQL readback for World `9cfeefbf-703c-40e6-a734-2c7463ec65e5` showed two remaining active entries at two positions after removal; the E2E replacement snapshot showed all three positions and the replaced Ginger entry. Local daily records read back `done:1` and `unsure:1`; Tomato remained saved after the Gout Journey re-save. Both new additive migration versions `20261030100000` and `20261030110000` are present locally.
- Additional checks: shared region route/layout script PASS (7 approaches per region, 11 connected route nodes, no required bridge); Skill thresholds PASS (five levels, 11 boundary assertions); E2E syntax PASS; focused ESLint PASS with 0 errors and one existing `<img>` optimization warning. This E2E demonstrates early persisted Skill progression; it does not claim the browser account reached all five levels.
- **New final browser captures:** [Sleep Botanist populated catalog](reports/previews/owner-botanist-populated-cards.jpg), [Activity Trail](reports/previews/owner-activity-trail-populated-cards.jpg), [Wellness Sanctuary](reports/previews/owner-wellness-sanctuary-populated-cards.jpg), [three-slot Backpack and replacement](reports/previews/owner-backpack-three-tools-replacement.jpg), [Collection with saved Tomato](reports/previews/owner-collection-tomato-search-details.jpg), [Daily Companion check-in](reports/previews/owner-daily-companion-equipped-tools.jpg). Whole maps: [Sleep Valley desktop](reports/previews/owner-two-region-sleep-map-desktop.jpg), [Sleep Valley mobile](reports/previews/owner-two-region-sleep-map-mobile.jpg), [HealthClues Realm desktop](reports/previews/owner-two-region-health-gout-desktop.jpg), [HealthClues Realm mobile](reports/previews/owner-two-region-health-gout-mobile.jpg). Realm 1920×1080 and Sleep 1920×1080 captures are linked in the previous region acceptance section.
- **Remaining release blockers:** learning examples are synthetic/not human-reviewed and must not be shipped as approved content; owner approval of generated map/character artwork remains outstanding; mobile verification is browser emulation, with physical-device touch/performance unverified. Production security/release review is not part of this local demo acceptance. Keep the demo isolated and do not claim clinical or production readiness.

## Screenshot-driven follow-up — 2026-10-30

Owner demo now serves `app-build-final-a10` at `http://127.0.0.1:3249/play`; local Supabase/Mailpit remain at `127.0.0.1:54321`/`54324` with demo volume retained. A visual review of the actual a9 desktop/mobile/arrival/path screenshots led to three changes: Camp marker moved below the return Pet lane, first Lumi greeting compacted for mobile, NPC keyboard focus marked at the ground. The three station NPC positions, two hand-painted prototype plates, seven shared landmark targets and connected routes matched the scene art, so they were retained. Full a10 Chromium E2E and route QA passed again on exact port 3249. Side-by-side same-viewport before/after files and analysis are in the first section of `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

Overall remains PARTIAL for owner art review, real-device QA/performance and human-reviewed health learning content; test fixtures stay TEST ONLY. See the top of `CURRENT_STATE.md` for exact evidence and next task.

- **Exact next task:** preserve the playable demo and fixture boundary while the owner reviews the art and qualified editors review real learning content; afterward run physical-device interaction/performance QA before production review.

## Final shared-map handoff — 2026-10-30

Current owner demo is [http://127.0.0.1:3249/play](http://127.0.0.1:3249/play) on isolated `app-build-final-a9`; Mailpit is [http://127.0.0.1:54324](http://127.0.0.1:54324); Supabase is the retained local `healthclues-owner-demo` project at `127.0.0.1:54321`. The two region scenes use the same roomy 16:9 anchors/path logic and distinct scenery-only backgrounds. Full browser E2E passed on the final 3249 URL, including real routes in both Sleep/Luna and Quiz-selected Health/Gout/Lumi, UI/games/Skills/Boss/Rewards/World persistence and screenshot overlap checks. See the top of `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` for actual results and screenshot links.

Overall remains PARTIAL: generated map art needs owner approval, mobile is emulated (no physical touch/FPS verification), the fixture content is TEST ONLY/not human reviewed, and the browser player only reached early Skill levels. Keep all tests local; preserve the existing Supabase volume; no production/deploy.

## Latest handoff — final local owner demo — 2026-10-30

Current authenticated owner game is serving isolated build `app-build-final-a7` at `http://127.0.0.1:3249/play`; local Mailpit is `http://127.0.0.1:54324`. Source build and full Chromium owner E2E passed on that exact build. Coverage includes both maps, Luna/Lumi, safe short movement and NPC proximity, Encyclopedia/Collection/Backpack, Care Plan isolation, optional Daily Companion, four TEST ONLY learning games, persisted Skill counts, Boss/key/unlock, Rewards station and World reload. Fresh captures and bounded PASS scope are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` and `reports/previews/`.

All eight Overworld regions remain visible; only Sleep Valley and HealthClues Realm are playable. The second Journey uses the original Quiz-selected self-reported topic. TEST ONLY fixtures are synthetic and not human-reviewed. Five Skill threshold mappings are unit-tested; browser fixture data reached early levels only. Prototype art, precise collision, physical-device gestures, measured FPS and production review remain open.

Local Supabase is `healthclues-owner-demo`, API `127.0.0.1:54321`, Mailpit `127.0.0.1:54324`; its existing persistent volume was preserved. The `start-game-demo.bat` build target now says `app-build-final-a7`, but the standard launcher returned nested Docker API permission errors in this tool process despite direct read-only Docker/container and local status checks succeeding. The game server remains up. Do not touch Docker ACLs, use `.env.local` production, reset data or deploy. Read the latest `CURRENT_STATE.md` for exact tests and next task.

## Handoff mới nhất — simplified region scenes — 29-10-2026

Source navigation now gathers each region's stations onto a short connected path near camp; bridge crossing is no longer required. Desktop uses whole-scene contain framing and portrait uses bounded cover framing. The 3249 owner process was stopped for an authorized rebuild; startup is currently blocked because Windows Docker service is stopped, so Auth/Mailpit and the game URL are temporarily unavailable. No Docker containers/volumes were removed and no data reset. Read CURRENT_STATE.md and the latest final-game report before continuing. Overall remains PARTIAL; mini-game and persisted Skills remain unfinished.

## Handoff mới nhất — navigation/grounding — 29-10-2026

Owner demo thật đã được kiểm tra tại [http://127.0.0.1:3249/play](http://127.0.0.1:3249/play); local Mailpit [http://127.0.0.1:54324](http://127.0.0.1:54324). Dùng `App/start-game-demo.bat` để mở build isolated `app-build-final-a5` và giữ dữ liệu demo Supabase local. Chromium E2E mới nhất PASS cho water/roof/keyboard block, Sleep/Health route tới bridge và NPC, Gout continuity, Auth, same World ID, account isolation, Boss TEST ONLY, Care Plan và 0 browser runtime errors. Ảnh nav debug ở `reports/previews/final-nav-*.jpg`. Overall vẫn PARTIAL: corridor graph chưa là collider chính xác; không có physical mobile/FPS QA; mini-game/Skills và art/content review còn thiếu. Đọc `CURRENT_STATE.md` và phần mới nhất trong `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` trước khi code.



## Latest final-delivery handoff — 2026-10-29

Guest preview recheck after service restart passed on this exact owner build: reveal refresh, legacy-result absence, 10-question cap, 2 playable/6 Coming Soon regions, activation gating and zero browser runtime errors. Stop/restart and authenticated same-World resume also passed. Current details and screenshots are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

Current verified owner build: `http://127.0.0.1:3249/play`; local Mailpit: `http://127.0.0.1:54324`; launch/restart using `App/start-game-demo.bat`. Current source build `app-build-final-a2` is staged in `%TEMP%\healthclues-owner-demo-builds` on C: because D: exhausted space; persistent isolated Supabase remains in its own local volume. Actual Chromium E2E on 3249 passed the tested Sleep/Gout flows, TEST ONLY Catalog/Knowledge/Boss fixture interactions, Auth/Mailpit, account isolation, stable World and optional private Pet check-in. Screenshots are in `reports/previews/`. Overall remains PARTIAL: mini-games/Skills, full Health movement, production-reviewed content, art/physical-device/performance QA and other full acceptance cases remain. See `CURRENT_STATE.md`, `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`, and `reports/FINAL_GAME_DELIVERY_CHECKLIST.md`.

## Final delivery handoff — 2026-10-29

Current owner game: http://127.0.0.1:3248/play; Mailpit: http://127.0.0.1:54324; run `App/start-game-demo.bat` to launch/reuse isolated build `app-build-final-a1`. Current authenticated browser evidence after the optional Daily Pet reflection change is in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Overall remains PARTIAL; the durable task and exact remaining stage list are `HEALTHCLUES_FINAL_COMPLETE.md` and `reports/FINAL_GAME_DELIVERY_CHECKLIST.md`.

Tài liệu này là điểm vào ngắn cho các phiên AI/Codex. **Quyết định được duyệt không đồng nghĩa tính năng đã triển khai**: đọc [CURRENT_STATE.md](CURRENT_STATE.md) và acceptance evidence mới nhất trước khi tiếp tục.

## Sản phẩm và kiến trúc

HealthClues là game RPG wellness chạy trên web trong Botly. Dùng Next.js App Router, tích hợp Supabase hiện có, một World thuộc người chơi, nội dung có review/version và progression do server xác thực. Không tạo app, identity system hoặc database thứ hai. Nội dung cho người chơi bằng tiếng Anh; báo cáo cho owner bằng tiếng Việt.

Overworld được duyệt giữ đủ tám vùng và ID hiện có. Chỉ **Sleep Valley** (Luna; hành trình về giấc ngủ) và **HealthClues Realm** (Lumi; mục tiêu/quan tâm sức khỏe đã chọn trong Quiz) mở gameplay. Sáu vùng còn lại hiển thị Coming Soon. Quiz ban đầu xác lập Journey; concern là tự khai, không phải chẩn đoán. Toolkit/Knowledge theo Journey, bốn Knowledge Skills, năm cấp độ, một Knowledge Tip nổi bật/ngày và Daily Companion tự chọn 2–3 câu là yêu cầu sản phẩm, không mặc định đã hoàn thành. Community Village thuộc tương lai.

## Tài liệu canonical

- [README và chỉ mục tài liệu](README.md)
- [Master architecture/product scope](MASTER_SPEC.md)
- [Business rules](BUSINESS_RULES.md) · [User flows](USER_FLOWS.md) · [Use cases](USE_CASES.md)
- [Database design và bằng chứng schema](DATABASE_DESIGN.md)
- [UI, map và game scenes](UI_UX_SPEC.md)
- [Knowledge/safety](KNOWLEDGE_AND_SAFETY_SPEC.md) · [Community/privacy](COMMUNITY_AND_PRIVACY_SPEC.md)
- [Decisions/assumptions](DECISIONS_AND_ASSUMPTIONS.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md) · [Acceptance tests](ACCEPTANCE_TESTS.md)
- Tiến độ: [V1_PROGRESS](reports/V1_PROGRESS.md), [V1_TEST_RESULTS](reports/V1_TEST_RESULTS.md), [V1_RELEASE_READINESS](reports/V1_RELEASE_READINESS.md)
- [Ma trận playable demo và blockers mới nhất](reports/OWNER_PLAYABLE_FINAL_ACCEPTANCE.md)
- Runbook bổ trợ trong `docs/healthclues/`: `FINAL_INTEGRATION_RUNBOOK.md`, `ENVIRONMENT_STATE.md`, checklist review và migration map. Đây là tài liệu vận hành, không thay thế spec canonical trong `App/`.

## Bản đồ source

- App Router: `src/app/play`, `src/app/en/wellness/healthclues`, `src/app/api/healthclues`
- Presentation: `src/components/healthclues`
- Feature/gameplay: `src/features/healthclues`
- Quiz/profile/session: `src/lib/healthclues-quiz.ts`, `src/lib/healthclues-pending-journey.ts`, `src/lib/wellness-cloud.ts`
- Quiz/content data: `src/data/healthclues-*`
- Migrations: `supabase/migrations`
- Preview/test scripts: `scripts/*healthclues*`

## Cách làm việc

Trước khi sửa HealthClues, đọc file này, `CURRENT_STATE.md`, root `AGENTS.md`, spec liên quan, source và `git status`. Trước khi thay đổi Next.js, đọc guide phù hợp trong `node_modules/next/dist/docs/`. Phân biệt rõ approved/planned/implemented/tested. Không dùng Supabase production để ghi test data hoặc gửi email thật. Sau thay đổi có ý nghĩa, chỉ cập nhật spec bị ảnh hưởng, evidence/tiến độ và `CURRENT_STATE.md`; chạy test phù hợp cùng `npm run docs:healthclues:check -- --files <changed paths> --docs <updated docs>`. Không tự stage, commit, push hay deploy.

## Chạy preview guest cô lập

```powershell
$env:HEALTHCLUES_PREVIEW_PORT = "3234"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

Preview này chỉ đọc, không có Auth/email thật và không lưu World.

## Milestone 09D-R handoff — 2026-10-29

Current owner-authenticated isolated preview: [http://127.0.0.1:3247/play](http://127.0.0.1:3247/play); local Mailpit: [http://127.0.0.1:54324](http://127.0.0.1:54324). It uses the persistent local `healthclues-owner-demo` stack; do not connect this milestone to production. The scene now has player walking, follow camera/Pet, path-constrained destinations and NPC approach-before-Talk. Latest browser evidence, screenshots and PARTIAL limitations: [REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md](reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md). Renderer decision and art gaps: [REGION_ENGINE_IMPLEMENTATION_DECISION.md](reports/REGION_ENGINE_IMPLEMENTATION_DECISION.md), [REGION_GAME_ART_REQUIREMENTS.md](reports/REGION_GAME_ART_REQUIREMENTS.md). Read `CURRENT_STATE.md` before starting; approved specs are not proof of implementation.


## 09C handoff update — 2026-10-29

Current state is PARTIAL; see [CURRENT_STATE.md](CURRENT_STATE.md) and [09C gameplay acceptance](reports/HEALTHCLUES_09C_GAMEPLAY_ACCEPTANCE.md). Owner demo target: http://127.0.0.1:3241/play, local Mailpit: http://127.0.0.1:54324, launcher: App/start-game-demo.bat (build app-build-09c6). Private Care Plan migrations have only been applied to the isolated local HealthClues owner demo. No reviewed topic-matched catalog/knowledge content is available there. The art, Daily Companion, educational mini-games/Skills, and content-gated Boss remain incomplete/unverified.

## Current handoff — Docker service up, Engine control API unresponsive — 2026-10-30

Windows `com.docker.service` and WSL report Running. Local Auth health and Mailpit root respond HTTP 200; the isolated Supabase config names project `healthclues-owner-demo`. However `docker info`/`supabase status` do not return and Docker Engine `/_ping` over the expected named pipe times out. Container identity cannot be confirmed, so the owner demo rebuild, migrations and write tests are intentionally not started. No volumes/resources were reset. See the latest dated section in `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Next: verify Docker Desktop Engine/filtered `docker ps`, then use `App\start-game-demo.bat --rebuild` and execute the browser suite.

## 2026-10-30 Docker diagnosis update

Docker service and WSL are Running; context is `desktop-linux` with the expected Docker Desktop Linux named pipe. Docker CLI 29.3.1 cannot access its default user-profile context files from this tool, and an isolated config with an explicit named pipe returns `permission denied` to the Engine API. Auth/Mailpit ports are served by Docker/WSL forwarding and return HTTP 200, but `docker ps`/Supabase CLI cannot prove project/container identity. Game port 3249 is down. Under the safety gate no rebuild, migration, account write, or E2E is run. Continue only after an out-of-sandbox Windows terminal can read `docker info` and lists the exact `supabase_db_healthclues-owner-demo` container. See latest dated evidence in `CURRENT_STATE.md` and final acceptance report.

## Latest handoff — distinct character identity — 2026-10-30

Owner demo: `http://127.0.0.1:3249/play` (`app-build-final-a10`) on retained local Supabase/Mailpit. Player, Botanist, Trail Explorer and Wellness Guide use separate original transparent assets; browser E2E and names-hidden actual screenshots verify distinct roles and existing gameplay flow in both maps. Map art/layout, NPC coordinates and navigation are preserved and locked pending an explicit owner correction. See latest `CURRENT_STATE.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Overall remains PARTIAL for owner art approval, real-device/performance QA, reviewed content and production gates.
# Personalized discovery implementation handoff — 2026-10-30

Source now adds an explainable deterministic recommender over the existing RPG Catalog (`src/features/healthclues/personalized-recommendations.ts`), tri-state Quiz safety metadata, owner/World-authorized recommendation and event APIs, and Luna/Lumi suggestion cards in Adventure Camp and each NPC station. Catalog fixture metadata is TEST ONLY; Tomato/ordinary foods remain education-only, Ginger is gated when medication context is unresolved, movement fixtures require known activity safety, and only explicit harmless demo fixtures exercise equipment. Daily Companion can record optional “No time / Too difficult / Offer an alternative” feedback without auto-changing the Backpack. Additive migration `20261030120000_healthclues_recommendation_history.sql` stores minimal private owner/World/item events and versioned reasons.

Current verification: pure recommendation tests passed; focused ESLint passed before the final additions; isolated owner build `app-build-personalized-a1` runs at `http://127.0.0.1:3250/play`, local Supabase/Mailpit `54321/54324`. Migration and idempotent fixtures applied to the existing local demo volume only. Current authenticated Chromium E2E is being rerun after correcting a fixture display-name mismatch; do not report browser acceptance until it exits successfully. `tsc --noEmit` remains blocked by stale root `.next/types/validator.ts`; the isolated Next production build is the relevant compile evidence. See newest final acceptance report/current state after run completes.

## Gemini Wellness Advisor — implementation status 2026-10-31

Quiz Plan Builder now calls a server-only local Owner Demo endpoint. The selected provider is `gemini` only when `HEALTHCLUES_ADVISOR_PROVIDER=gemini` and a private `GEMINI_API_KEY` are available at server runtime. The official `@google/genai` SDK returns only candidate IDs and bounded profile-fact references; server filtering uses current reviewed Catalog rows, exact topic tags, source URLs and safety metadata before presentation. AI does not author clinical text, sources or targets. Errors are `AI_UNAVAILABLE`, with no deterministic fallback. `DETERMINISTIC_DEMO` requires an explicit provider selection and is visibly labeled.

The isolated launcher loads `D:\botly\secrets\healthclues-owner-demo.env` after building, server side only. It never forwards Gemini credentials to the build or browser. The requested file was absent at the last check, so real inference/browser Plan persistence are NOT VERIFIED. Existing habit templates are TEST ONLY and are excluded from Gemini candidates. See `reports/HEALTHCLUES_GEMINI_REALTIME_ADVISOR_ACCEPTANCE.md`.


## Interactive World Onboarding v2 — 2026-10-31

The World tutorial now has five player-facing states: welcome, actual My Journey spotlight, Botanist, Wellness Guide and Start Exploring. One shared implementation serves Luna/Sleep Valley and Lumi/HealthClues Realm. Spotlight bounds come from visible DOM targets and refresh on resize/scroll; map steps focus the camera without moving the player. My Journey opens the authenticated current-World summary; active, saved-for-later and personal goals remain distinct. A missing confirmed Plan links to saved Quiz suggestions without creating goals. Replay, skip, and reload resume are supported. Current local acceptance and screenshots are in `reports/HEALTHCLUES_INTERACTIVE_WORLD_ONBOARDING_ACCEPTANCE.md`; build 3273 full Chromium regression passed, runtime errors 0.
## Gemini local config path — cập nhật 2026-10-31

File owner cung cấp hiện ở `D:\botly\App\secrets\healthclues-owner-demo.env`; launcher cũ trỏ sai sang `D:\botly\secrets`. Đường dẫn launcher đã được sửa và `App/secrets` được ignore trong Git. API inference chưa chạy: credential hiện tại cần rotate sau khi vô tình xuất hiện trong output của lệnh dò tìm. Xem `reports/HEALTHCLUES_GEMINI_REALTIME_ADVISOR_ACCEPTANCE.md`; không coi port/build cũ là Gemini-enabled.


## My Journey inventory state — 2026-10-31

WorldAdventureScene dùng ba nguồn hiện có, không tạo inventory/goal store trùng lặp: confirmed Plan goals; equipment entries; Quiz wellness focus. `discovery_station` nullable chỉ được ghi khi equip từ NPC đã qua server eligibility. Existing/legacy equipment không có nguồn được để null, không suy đoán. E2E chứng minh practice TEST ONLY từ Wellness Guide hiện ở My Journey và persist qua reload; Botanist herb chưa có item đủ điều kiện trong demo, hiển thị empty state. Ba section Daily Checklist / Herbs Equipped / Practices Equipped mở đồng thời, no completion inference. Icon inventory mới lấy từ Game-icons.net và có attribution: `public/healthclues/assets/ui/my-journey/ATTRIBUTION.md`; action icons vẫn dùng Lucide. Báo cáo icon mới: `reports/HEALTHCLUES_MY_JOURNEY_ICON_ASSETS_ACCEPTANCE.md`; regression build `http://127.0.0.1:3276/play`.
