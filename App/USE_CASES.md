## UC-HC-CYCLE87 — Condition-Matched Gout Recommendations & RPG Game Audio Customization — 2026-11-12

Actor: Player selecting Gout (or other health concerns) during Onboarding and customizing RPG audio.
Trigger: Player completes Step 1–2 Discovery for `Gút / axit uric cao`, enters the game, and opens `Âm thanh & Nhạc nền game` in `Cá Nhân`.
Main flow:
1. Wellness Advisor returns Gout-specific habits (`Giảm thịt đỏ & hải sản giàu purine trong bữa ăn`, `Thay bia rượu & nước ngọt bằng nước lọc đều đặn`, vitamin-C greens, low-impact joint mobility).
2. Tapping buttons/tabs/Check Seals/EXP rewards triggers tactile RPG SFX alongside looping ambient BGM; player opens `Cá Nhân` -> `Âm thanh & Nhạc nền game`, switches to `Thung Lũng Thụy Sĩ`, previews SFX, and verifies setting persists across reload (or toggles mute anytime from `TopHud`).

---

## UC-HC-CYCLE86 — Adaptive Onboarding Concern Entry, AI Solution Suggestions & Custom Habit Entry — 2026-11-12

Actor: New Mobile / Web Player completing HealthClues onboarding.
Trigger: App opens `/(onboarding)/quiz` when `healthclues-onboarding-completed !== "true"`.
Main flow:
1. Player advances past Welcome and Quest Selection (`Vương Quốc HealthClues`) to 2-screen Discovery, selects concerns (e.g., `Căng thẳng`) plus `Vấn đề khác` typing a custom issue, selects matching lifestyle factors and optional note, and taps `AI Phân Tích & Gợi Ý`.
2. App invokes `POST /api/healthclues/wellness-advisor`, renders personalized suggestions with rationale, and player switches Option A/B, edits an inline `Tự điều chỉnh` goal, toggles suggestions, adds a new custom habit, and enters `/(game)/world` with chosen habits synced immediately across `Nhiệm Vụ` and `Hành Trình`.

---

## UC-HC-CYCLE85 — Configure Mobile Habit Reminders, Preview Notification & Persist Schedule — 2026-11-12

Actor: Mobile / Web Player configuring daily habit reminders on `Cá Nhân`.
Trigger: Player taps `Nhắc nhở hằng ngày` in `Cài Đặt Hệ Thống`.
Main flow:
1. Modal opens showing opt-in toggle (`Tắt` -> `Bật`), non-clinical disclosure, quick time presets (`07:30`/`12:30`/`20:30`/`21:30` + `-30p`/`+30p`), and frequency selector (`Hằng ngày` / `Thứ 2–6` / `Hằng tuần`).
2. Player taps `Gửi thông báo thử` to verify sample delivery/preview and taps `Lưu Lịch Nhắc Nhở`; `Cá Nhân` displays `Bật · 20:30` (`Thứ 2 – Thứ 6`), persists across `Page.reload`, reschedules OS triggers on iOS/Android, and syncs `/api/healthclues/reminders` when signed in.

---

## UC-HC-CYCLE84 — One-Tap RPG Daily Quest Check-in & Winding 7-Day Adventure Scroll — 2026-11-12

Actor: Mobile / Web Player completing daily habits and reviewing weekly streak trail.
Trigger: Player switches to `Nhiệm Vụ` or `Hành Trình`.
Main flow:
1. On `Nhiệm Vụ`, player sees all active missions on one compact screen, taps `(i)` if desired to peek medical evidence, and taps each right-edge Check Seal (`✓`) to toggle completion while watching Lumi's progress gauge reach `100%`.
2. Player taps hero button `XÁC NHẬN HOÀN THÀNH (+35 EXP)`, triggers 5-star celebration (`85 EXP` synced across tabs, `Nhiệm Vụ` red badge `1` cleared), and duplicate resubmits confirm safely without inflating EXP.
3. On `Hành Trình`, player views the curved 7-day stone rune streak trail, toggles `Lưu sau` -> auto-expanded `Đã Lưu Xem Sau` -> `Kích hoạt`, and verifies clean readability at `360x800`, `390x844`, `640x360`, and `1280x800`.

---

## UC-HC-CYCLE83 — Real-Time Station Sheet Navigation, Live Tab Sync & Cross-Platform Confirmation Dialogs — 2026-11-12

Actor: Mobile / Web Player using HealthClues app.
Trigger: Player walks to stations in `Thế Giới`, switches locked regions, finishes `Nhiệm Vụ`, or triggers account confirmation in `Cá Nhân`.
Main flow:
1. Player taps `Viện Nghiên Cứu Chuyển Hóa`; pathfinding guides character along the extended NW stone stair path (`pt(276, 225)`), reliably displaying bottom `active-talk-hud` upon arrival.
2. Player taps `Khám Phá →` in `active-talk-hud` to open the rich NPC portrait, medical evidence, and CTA sheet (or answers the 2-option quiz when visiting `Đấu Trường Thói Quen Lành Mạnh`).
3. Player taps locked `Thung Lũng` or locked biomes on `8 Vùng` and immediately sees a floating toast explanation (`Thung Lũng Giấc Ngủ đang tạm khóa...`).
4. Completing Daily Care check-in immediately removes the red `1` badge on `Nhiệm Vụ` and syncs the updated `xpTotal` across all open tabs (`Thế Giới`, `Ngôi Nhà`, `Túi Đồ`, `Cá Nhân`).
5. On Web or mobile, tapping `Đăng xuất` / `Xóa tài khoản` opens an in-app confirmation modal (`profile-confirm-modal`), and modals across `Home`, `World`, `Inventory`, and Celebration scroll safely within `90%–92%` height on `640x360` landscape viewports.

---

## UC-HC-CYCLE66 — Mobile Wellness Habits Management, Add Habit Modal & Daily 5-Star Check-in — 2026-11-10

Actor: Mobile Player using React Native / Expo app.
Trigger: Player completes onboarding quiz or navigates to Journey / Daily Care tabs.
Main flow:
1. Player completes onboarding quiz; 3 starter medical habits (Hydration 2000ml, Tart Cherry, Joint Movement) are saved to active goals and +50 EXP is awarded.
2. Player taps single-line 3D Gold button "VÀO VƯƠNG QUỐC HEALTHCLUES (+50 EXP)" without text wrapping.
3. In Journey tab, player reviews active habits with PubMed citations and no session errors.
4. Player taps "➕ Thêm Thói Quen", chooses a quick preset from Lumi (e.g. Warm water morning +10 EXP) or enters custom routine, taps "LƯU THÓI QUEN VÀO HÀNH TRÌNH (+20 EXP)", immediately increasing active goals count from 3 to 4.
5. In Daily Care tab, player reviews today's checklist of 4 habits, taps "Đã làm" on each, and watches the live Star Rating HUD illuminate all 5 golden stars (5/5 sao).
6. Player inputs personal reflection note and taps "LƯU ĐIỂM DANH HÔM NAY (+EXP)", receiving streak celebration and EXP without duplicates.
7. Outcome: 100% logic and process parity with Web Game `/play` daily care experience.

---

## UC-HC-CYCLE64 — Mobile Web Parity Onboarding, Realm Default & Sleep Valley Lock Guard — 2026-11-09

Actor: Mobile Player using React Native / Expo app.
Trigger: Player launches mobile app or logs in.
Main flow:
1. Navigation Guard checks onboarding status; if incomplete, player is automatically routed to `/quiz`.
2. Player experiences Welcome Screen matching 100% of the Web Game `/play` layout, selecting language and tapping "Bắt Đầu Hành Trình (+50 EXP)".
3. In Quest Selection, HealthClues Realm is active by default with Lumi Fox; Sleep Valley displays a temporary lock pill with toast notice.
4. Player completes 3 adaptive questions regarding physical vitality and uric acid metabolism.
5. Lumi synthesizes a 3-habit evidence-based wellness plan (PMID: 18174899, PMID: 23023818, BMJ 2020).
6. Player enters HealthClues Realm at Central Camp `[320, 540]`, moves in real-time, interacts with Botanist NPC, engages in 4-7-8 breathing at the Sanctuary, and views their 3-slot Inventory.
7. Outcome: 100% seamless parity with web game aesthetics and guaranteed onboarding before gameplay.

---

## UC-HC-CYCLE62 — Mobile RPG Visual Engine, Onboarding Quiz & Real-time World Exploration — 2026-11-09

Actor: Mobile Player using React Native / Expo app.
Trigger: Player starts on mobile `/quiz` or enters the RPG World `/(game)/world`.
Main flow:
1. Player takes the 4-step Health Quiz, receiving +50 EXP and a personalized starter habit plan backed by PubMed evidence.
2. Player taps "BƯỚC VÀO THẾ GIỚI RPG", entering the 16:9 widescreen blueprint world matching the web game.
3. Player taps on the map to walk; character steps smoothly at 60 FPS while the Floating HUD updates real-time coordinates `X, Y` and current zone name.
4. Player approaches an NPC (< 75 px); the Active Talk HUD slides up with dialogue, and tapping "Khám Phá" opens the station sheet.
5. Player conquers the Night Owl challenge, triggering the `RewardReveal` component with golden glow and claiming the Sleep Valley Ancient Key into the 3-slot Inventory.
6. Outcome: Player experiences an immersive 2D RPG mobile game that educates and rewards healthy habits.

---

## UC-HC-CYCLE39 — Swiss Alpine Chalet Admin CMS & Setup Studio — 2026-11-08

Actor: System Administrator / Content Author.
Trigger: Admin navigates to `/admin/healthclues-home` to configure furniture items and visual placement in the Swiss Alpine Chalet.
Main flow:
1. Admin opens `/admin/healthclues-home`.
2. Admin selects the room (`Phòng Khách` or `Phòng Ngủ`) and lighting (`Ban Ngày` or `Ban Đêm`).
3. Admin selects an existing item or creates a new one (`[+ Thêm Vật Phẩm Mới]`).
4. Admin drags the center anchor or 4 corner handles (`TL`, `TR`, `BR`, `BL`) on the 16:9 canvas to calibrate perspective.
5. Admin adjusts depth layer (`z_index`), scale, names, and description.
6. Admin clicks `[💾 Lưu Vị Trí & Cấu Hình]`:
   - System sends `POST /api/healthclues/wellness-home` with `action: "admin_save_item"`.
   - Data persists to Supabase DB `healthclues_wellness_home_catalog`.
7. Outcome: The item and its calibrated 3D coordinates become immediately available as rewards in the game and render accurately in the player's chalet.

---

## UC-HC-CYCLE36 — Full Modal Windows & Panels Bilingual Localization — 2026-11-08

Actor: Player interacting with dialogs, popovers, or drawer panels in English (`locale === "en"`) or Vietnamese (`locale === "vi"`).
Trigger: Player clicks Reminder Settings, Companion Add-Habit, Day Detail Popover, or chats with Living Village visitors.
Main flow:
1. When in English:
   - Reminder Settings renders purely in English: `Lumi daily reminder companion`, `Daily send time`, `Your timezone`, `Preview companion email sample`, and `Done & Close window`.
   - Email preview sample dialog renders subject, from, schedule, friendly companion greeting, and CTA in English.
   - Companion Add-Habit modal presents `Companion Guide`, `Hello Wayfinder! What healthy habit would you like to build together?`, quick suggestions (`3-minute deep breathing`, `Drink a warm glass of water`, `Screens off before bed`, `15-minute gentle walk`), and celebration card with EXP reward in English.
   - Village chibi characters speak in English speech bubbles.
2. When in Vietnamese:
   - All modal windows, preview dialogues, suggestion pills, and village speech bubbles render purely in Vietnamese.
3. Outcome: Zero cross-language leakage across all modal windows and dialogues.

---

## UC-HC-CYCLE35 — Bilingual Knowledge & Boss Empty-State Presentation — 2026-11-08

Actor: Player exploring Knowledge Library or Knowledge Boss landmark.
Trigger: Player clicks the Knowledge Library dock button or walks to the Knowledge Boss checkpoint for a topic without reviewed clues.
Main flow:
1. Client fetches `/api/healthclues/knowledge` or `/api/healthclues/boss`.
2. When the backend has no reviewed clues for the user's specific health concern, it returns `emptyReason` (English) and `emptyReasonVi` (Vietnamese).
3. The UI checks `locale`:
   - In Vietnamese (`vi`): Renders `"Hiện chưa có manh mối kiến thức đã thẩm định y tế riêng cho chủ đề này. HealthClues không thay thế bằng các chủ đề chưa liên quan để bảo đảm tính chuẩn xác."` and provides a one-click shortcut `[Xem các bài viết thảo mộc đã lưu]`.
   - In English (`en`): Renders `"No reviewed Knowledge is currently available for this topic. HealthClues will not substitute unrelated topics."`.
4. Zero English leakage occurs in Vietnamese sessions; zero Vietnamese leakage occurs in English sessions.

---

## UC-HC-CYCLE32 — Synchronous Multiplayer Village Presence — 2026-11-08

Actor: Multiple players active in the same regional village.
Trigger: Player arrives in HealthClues Realm or Sleep Valley.
Main flow:
1. Client starts background presence heartbeat broadcasting coordinates, direction, walking state, and chosen nickname.
2. Client queries active peers in the region and renders remote adventurers as animated chibi characters with pulsing online pills (`🟢 {nickname}`).
3. Player clicks on an online peer to open the interaction menu:
   - "👋 Vẫy tay chào"
   - "✨ Cổ vũ sống khỏe"
   - "🍵 Mời tách trà ấm"
4. Triggering an interaction sends a speech payload, rendering a speech bubble above the sender's avatar visible to both players.
5. Inactive players (>15s without heartbeat) are removed from the map automatically.

---

## UC-HC-CYCLE31 — Full Real-User Habit & Reminder Management Flow — 2026-11-07

Actor: Authenticated HealthClues Player.
Main flow:
1. Player adds custom habit via Companion (`+ Thêm thói quen`).
2. Player manages active habits and removes unwanted habits via 1-click `[Xóa]` with confirmation prompt.
3. Player sets timezone from dropdown (`Asia/Ho_Chi_Minh`) and configures default morning reminder (`07:30`).
4. Automated dispatcher sends morning reminder with yesterday's check-in prompt and link to re-enter `/play`.
5. Player accesses Knowledge Book to view and unsave bookmarked articles via `[Bỏ lưu]`.

---

## UC-HC-BOTANICAL-LIBRARY — Scientific Herbal Knowledge Exploration & Bookmarking — 2026-11-07

Actor: Player visiting the Botanist Garden (Vườn Thảo Mộc) in HealthClues Realm.
Trigger: Player travels to Botanist landmark and clicks "Trò chuyện".
Main flow:
1. Botanist modal opens with prominent educational disclaimer and 4 tabs: "Dành cho bạn", "Thư viện khám phá", "Đã lưu", and search input.
2. If player has Gout topic, "Dành cho bạn" recommends Tía tô (XO enzyme inhibition) and Atiso đỏ (uricosuric excretion).
3. Each herb is presented as an RPG collectible card featuring high-resolution botanical plate artwork, active bioactives (e.g. Rosmarinic acid, Luteolin, Apigenin), and studied mechanisms/effects bullet highlights, without walls of text.
4. Search bar filters by Vietnamese name, English name, scientific Latin name, or active compounds (e.g. "Tía tô", "Perilla", "Hibiscus").
5. Player clicks `[📖 Đọc chi tiết]`: modal opens displaying botanical illustration, 12 scientific fields, evidence level badge (in vitro / animal / human observational / human clinical trial / systematic review), limitations, and authentic PubMed citations (PMID).
6. Absolutely no medical treatment or equip buttons are present.
7. Player clicks "Lưu kiến thức" (Bookmark). Button updates to "Đã lưu".
8. Player opens Sổ Tay Kiến Thức (`Kiến Thức` on bottom dock): saved article appears under "Bài viết đã lưu" with thumbnail artwork, full reading modal, and unsave action.
9. Unsaving from either Botanist or Knowledge Book synchronizes both ways and persists across browser reload.

## UC-HC-ACCEPTANCE-ROUND-FIXES — Authentic Auth, Region Binding & Arrival Interaction — 2026-11-05

Actor: Player exploring Sleep Valley or HealthClues Realm across desktop and mobile viewports.
Trigger: Player visits `/play`, selects a region, completes 2-question quiz, authenticates via email, and plays.
Main flow:
1. Region selection prioritizes playable regions (Sleep Valley, HealthClues Realm).
2. Sleep Valley pairs permanently with Luna; HealthClues Realm with Lumi.
3. If Advisor is slow or loading, player can click "Skip plan and preview World" immediately.
4. Player requests activation; local Supabase Auth issues magic link to local Mailpit (quick-activate returns 410).
5. Following magic link completes authentication and restores the verified region and companion.
6. Player enters World at Level 1, 0 / 50 EXP. Daily Care displays real confirmed goals or honest empty state.
7. Clicking an NPC or landmark starts stone path walking; panel opens strictly on arrival after clicking "Talk" or "Interact".
8. Reloading or re-logging in retains the exact region, companion, and progress.
9. Mobile dock presents 3 focused buttons (`Bản đồ · Hôm nay · Túi đồ`).

## UC-HC-MOBILE-VIEWPORT-REVIEW — Mobile Viewport (320px–430px) Responsive Experience — 2026-11-05

Actor: Mobile player taking the Discovery Quiz and exploring World Preview on devices from 320px to 430px wide.
Trigger: Player visits `/play` on a smartphone.
Main flow:
1. Question 1 displays a compact top character rail and readable concern options without pushing the card down.
2. Question 2 renders non-duplicate region breadcrumb (`✦ HEALTHCLUES REALM`), unchecked age confirmation checkbox, and sticky bottom action tray with safe area padding.
3. Player cannot advance until explicitly checking the age confirmation box.
4. "Continue to account activation" CTA wraps text gracefully on up to 2 lines without horizontal overflow on screens as narrow as 320px.
5. In World Preview, the companion Lumi bubble sits safely at the bottom-left with a one-click collapse button, leaving map markers, labels, and the "START YOUR JOURNEY" button at the bottom-right completely unobstructed.
6. The shared bottom navigation dock scrolls horizontally with full 11.5px pill labels without force-squeezing 6 items into one cramped row.
Postconditions: Fully accessible, non-overlapping mobile gameplay matching all ergonomic and safety requirements.

## UC-HC-PLAN-SIGNED-TITLE — Persist a selected generated action — 2026-11-05

Actor: Authenticated player choosing an Advisor-generated Plan goal. The selected A/B action is shown verbatim as the active goal title and check-in label. The existing signed proof validates either this exact action title or the historical localized umbrella title while continuing to reject unrelated client title/action changes. No new schema or account boundary is introduced.

## UC-HC-REMINDERS-DAILY-COMPANION — Daily Companion Email Reminder & Preview — 2026-11-04
Actor: Authenticated player in "Hành trình của tôi" (My Journey).
Trigger: Player views top reminder schedule banner, toggles daily reminder, changes send hour/timezone, or taps "Xem trước email mẫu".
Main flow: The player sees `.hc-journey-reminder-banner` at the top of My Journey. Player can enable daily reminder with 1 click, choose their daily hour (default `20:00 (Buổi tối - Khuyên dùng) ⭐`), and select their country timezone (detected from browser with international options). Changes immediately persist to `healthclues_email_preferences`. Tapping `[ Xem trước email mẫu ]` opens a realistic email client mockup displaying the companion header (Lumi / Luna), active habits checklist, daily bite-sized knowledge tip, return-to-game CTA button, and non-sensitive medical privacy guarantee.
Postconditions: 1 email/day reminder configured in player's local timezone with zero notification spam and verifiable email layout.

## UC-HC-CHECKIN-2CHOICE-STARS — 2-Choice Daily Habit Check-in & Proportional Day Node Stars — 2026-11-04
Actor: Authenticated player in World or My Journey.
Trigger: Clicking `[✓ Ghi nhận]`, today's node in the Journey Map, or the HUD Check-in button.
Main flow: The player opens the daily check-in dialog. All questionnaire fluff and confusing 5-option statuses are bypassed. The player directly views their active habits, each equipped with exactly 2 binary choices: `[✓ Hoàn thành]` (`status: "done"`) and `[✕ Không hoàn thành]` (`status: "not_yet"`). Tapping `Không hoàn thành` reveals an inline input for typing the reason. The dialog header displays a live 5-star preview reflecting the ratio of completed habits. On save, the uncompleted reasons and star rating are persisted into the private check-in note. On the 30-Day Monthly Journey Map trail, completed day nodes render 5 small stars on top: 100% completed days display 5 golden stars (`★★★★★`) + `✔` badge, while partial days display proportional golden stars (e.g. `★★★☆☆`) without the checkmark. Clicking a day node surfaces the star rating and any uncompleted reasons.
Postconditions: Truthful, proportional historical tracking with actionable feedback.

## UC-HC-COMPACT-GOAL-CARDS — Ultra-Compact Habit Outcome Cards & Progressive Disclosure — 2026-11-04
Actor: Authenticated or onboarding player viewing My Journey or Wellness Plan.
Trigger: Opening My Journey or viewing confirmed plan goals.
Main flow: The system renders habit cards in an ultra-compact, high-density format (~85px-95px height). The card header displays the concrete habit outcome (e.g. "Đọc sách 10 phút trước khi ngủ", "Uống ít nhất 6–8 cốc nước (≈ 1,5 – 2 lít) trong ngày") instead of generic umbrella titles ("Thói quen đọc sách trước khi ngủ", "Uống đủ nước"). Redundant amber action boxes and verbose filler descriptions are omitted from the default view. The action row displays `⭐ +20 EXP`, a deduplicated schedule pill, a quick `[✓ Ghi nhận]` button, and a `Xem chi tiết` disclosure toggle. Tapping `Xem chi tiết` smoothly reveals the parent topic rationale, relevance focus, exact tracking instructions, and personal notes.
Postconditions: Multiple cards fit cleanly on screen without endless vertical scrolling across both mobile and desktop viewports.

## UC-HC-CHECKIN-LOCALIZATION — Localized Daily Check-in & Mobile Usability — 2026-11-03
Actor: Authenticated player in World. Trigger: Clicking "Ghi nhận" or "Ghi nhận hằng ngày".
Main flow: Player opens check-in dialog in their chosen language (EN or VI). Dialog presents localized companion reflection prompts, options, and actions. Player can answer reflection, choose to add to private note (with localized prefix), or skip directly to tool tracking. On mobile viewports, the modal and goal cards adapt cleanly without cramped text wrapping or button clipping. Daily check-in saves to private world records.

## UC — Xem và xác nhận Wellness Plan sau Quiz (Phase 10A, 2026-10-30)

Actor: guest hoặc người chơi mới. Preconditions: hoàn thành Quiz. Main flow: xem gợi ý Catalog phù hợp → chọn/đổi lịch/để dành/bỏ qua → tùy chọn tạo mục tiêu cá nhân có cách tự báo cáo → review → xác nhận → World Preview và activation consent. Alternate: bỏ qua plan hoặc tiếp tục với 0 mục tiêu. Safety: server kiểm tra lại owner, World, phiên bản/review Catalog, demo boundary và điều kiện vận động; goal cá nhân không được human-reviewed. Postcondition dự kiến: revision riêng được gắn World sau xác thực. Postcondition persistence vẫn cần browser/database verification.

## Local companion privacy and use cases — 2026-10-30
Nickname, Journey context, recommendation rationale and NPC questions remain private and authenticated; profile reads/updates are scoped through the owned World, and public Community projections do not receive these fields. NPC external processing is opt-in per question and disabled in the isolated Owner Demo. The current use cases reuse profile, World, Collection, Backpack, Care Plan and existing daily check-in. Browser verification and unverified reminder/provider limits are documented in `CURRENT_STATE.md` and the final acceptance report.
# Use Cases

## UC-HC-PLAN-ACTIVATION-HANDOFF — confirm Plan and resume after email verification — 2026-10-31

The new player completes the Quiz and confirms configured goals plus an optional personal-note draft. After explicit consent, the existing encrypted HttpOnly pending Journey binds this Plan and its `originalNote` to the entered email. The user verifies the local Mailpit link, returns to the same app origin, and activates a World; the Plan is saved to that account/World and survives reload. Chromium browser acceptance on build 3269 verified the entire local flow, same callback origin, World/Plan persistence and owner isolation. No schema addition or production email is implied.

## UC-HC-PLAN-UNKNOWN-TOPIC — fail-closed checklist and coverage gap — 2026-10-31

An unsupported self-reported Quiz topic must not retrieve generic Catalog entries whose topic tags are also unknown. The Plan Builder returns no suggested cards, explains the coverage gap and still allows the player to continue with no Plan. The original self-reported topic remains in the authenticated private profile independently of the selected playable region. Chromium verified Digestion & Gut Health on the isolated Owner Demo. This does not indicate supported or reviewed Digestion advice; see `reports/HEALTHCLUES_END_TO_END_PLAYER_EXPERIENCE_ACCEPTANCE.md`.

## UC-HC-PLAN-UNIVERSAL — universal post-Quiz wellness plan clarification — 2026-10-30

Actor: Quiz guest/member. Preconditions: existing Discovery Quiz submitted. Main flow: build the structured existing profile → resolve a configured topic → retrieve only applicable habit-library/eligible exact-topic Catalog items → apply deterministic safety/target gates → rank using saved interests/goals → user adds/adjusts/saves/skips or creates a personal goal → review and explicitly confirm → reuse encrypted activation handoff and existing World/profile plan revisions. An unsupported topic returns a coverage gap. Botanicals, supplements and therapies stay in NPC discovery, outside onboarding. Current checklist is rules-based; no live LLM call. Acceptance: `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md`. Browser round-trip/account-isolation acceptance remains blocked for this revision.

## UC-HC-RECOMMEND — personalized educational discovery implementation addendum — 2026-10-30

After the existing Quiz, the authenticated player receives deterministic suggestions from their private profile, current reviewed Catalog versions, safety eligibility and selected World state. Luna/Lumi and the three NPC discovery categories share the same result service. The player can Explore, Save, request an alternative, track or Equip only when the server validates eligibility. Existing Backpack, Collection, active Care Plan IDs and explicit private history affect explanation/order. The system does not diagnose, prescribe or infer unknown safety answers. Browser/unit evidence and remaining same-topic browser comparison are bounded in the final acceptance report.

## UC — Optional daily Pet reflection (2026-10-29)

An authenticated player may choose a brief two-prompt reflection from the Pet during Daily Check-in, skip the conversation, or go directly to existing tool-status tracking. Answers are transient until the player explicitly copies them into the editable private note and saves the check-in. The flow does not interpret symptoms, diagnose, make adherence claims, or advise medication changes. See `USER_FLOWS.md` and `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

Các use case áp dụng guest/member permissions; full rule/field constraints tham chiếu `BUSINESS_RULES.md`. “Main flow” và ngoại lệ được ghi cho từng ca.

## HC-UC01 — Complete adaptive quiz
- **Actor:** Guest/Member. **Preconditions:** quiz active; consent shown. **Trigger:** chọn Start Quiz.
- **Main Flow:** xác nhận 18+; chọn topic/preferences; engine chọn câu nhánh liên quan; hiển thị skip/prefer-not-to-say; lưu tiến độ theo guest session hoặc member; review answers; submit.
- **Alternative:** guest bỏ qua câu nhạy cảm; member resume phiên chưa xong; user đổi câu trước submit.
- **Exceptions:** dưới 18 dừng cá nhân hóa; quiz config lỗi → nội dung chung; session hết hạn → xóa draft theo retention.
- **Postconditions:** consent/version/response snapshot được ghi theo scope đã đồng ý; không chẩn đoán.
- **Rules:** BR01–04. **Data:** quiz session/answers/consent. **AC:** adaptive, skip, resume, no-condition label.

## HC-UC02 — Convert ebook visit to quiz
- **Actor:** Guest/Member. **Preconditions:** ebook page valid. **Trigger:** ebook CTA.
- **Main Flow:** CTA giải thích quiz optional; preserve approved campaign/source IDs; mở quiz; không đưa email/health data vào URL.
- **Alternative:** user đọc/tải ebook mà không quiz.
- **Exceptions:** invalid attribution bị drop; consent analytics denied thì không lưu tracking cookie.
- **Postconditions:** referral source tối thiểu, không chia sẻ profile với ebook subsystem.
- **Rules:** BR02, BR37. **Data:** opaque attribution. **AC:** download consent độc lập.

## HC-UC03 — View personalized plan and recommendations
- **Actor:** Member hoặc guest session. **Preconditions:** quiz submitted; consent phù hợp.
- **Trigger:** kết quả quiz.
- **Main Flow:** tạo profile preview; query eligible reviewed items; rank/filter; hiển thị tối đa 3, “why”, source, evidence, duration, warning; cho save/skip/alternative.
- **Alternative:** chỉ 1–2 result; no matches → guides/library.
- **Exceptions:** catalog 503 → explain temporary unavailable; never fill with unreviewed AI content.
- **Postconditions:** result snapshot/version; user chooses whether to create account/save.
- **Rules:** BR03,05–08. **Data:** profile, recommendation event (metadata only). **AC:** all surfaced items current/eligible.

## HC-UC04 — Explore knowledge resource
- **Actor:** Guest/Member. **Preconditions:** resource public/current.
- **Trigger:** open card.
- **Main Flow:** view educational framing, evidence grade, reviewed date, sources, safety/contraindication, author/version; external link opens safely.
- **Alternative:** related resources or alternative format.
- **Exceptions:** expired/retracted → suppress and show unavailable; source link broken → report link.
- **Postconditions:** optional completion event, no treatment inference.
- **Rules:** BR05,07,34. **Data:** content/version, minimal event. **AC:** personal story visibly distinct from knowledge.

## HC-UC05 — Discover related community journeys
- **Actor:** Guest/Member. **Preconditions:** active public projection consented.
- **Trigger:** plan or explorer.
- **Main Flow:** view cards with alias, declared topic, elapsed span, selected activity summaries, self-reported frequency/milestones, moderated public reflection; warning experience ≠ evidence.
- **Alternative:** filter topic or hide card.
- **Exceptions:** revoked/deleted projection → 404/no cached content; no matching public journeys → empty state.
- **Postconditions:** view event not health profile copy.
- **Rules:** BR08,21–25. **Data:** public projection. **AC:** no private fields.

## HC-UC06 — Create/continue My Wellness World
- **Actor:** Member. **Preconditions:** authenticated, profile consent, eligible chosen activities.
- **Trigger:** Start My Journey.
- **Main Flow:** show reviewable draft branch/journey/activity/schedule; confirm; create World if absent or add branch/journey to existing World; map opens at new node.
- **Alternative:** start from community inspiration → re-match and edit before confirm; create blank path.
- **Exceptions:** concurrent World creation resolves unique conflict then continues; unreviewed activity rejected from recommended path.
- **Postconditions:** persistent World and independent journey; no prior history reset.
- **Rules:** BR09–12. **Data:** world/branch/journey/activity. **AC:** one World, multiple journeys.

## HC-UC07 — Daily check-in multiple activities
- **Actor:** Member. **Preconditions:** World exists; local date determined.
- **Trigger:** map Quick Check-in.
- **Main Flow:** show today’s planned/active activities; each defaults unset/Not Yet without implying not done; choose Done/Not Yet/Skipped/Not Suitable; optional habit-to-reduce status and note; save once; update map and award eligible XP.
- **Alternative:** save partial check-in; no activities → reflect-only quick check-in.
- **Exceptions:** duplicate request upserts same local day; network fail retains local draft without claiming saved; DST duplicate rejected safely.
- **Postconditions:** one truthful event/day, timeline reflects selected data.
- **Rules:** BR13–17,26–27,40. **Data:** check-in, activity state, XP ledger. **AC:** no synthetic data or duplicate reward.

## HC-UC08 — Add private journal note/reflection
- **Actor:** Member. **Preconditions:** owned World/journey.
- **Trigger:** add note from today/timeline.
- **Main Flow:** type optional note; show Private label; save encrypted transport/storage controls; edit/delete; not shown in community/email/analytics.
- **Alternative:** journal-only check-in.
- **Exceptions:** forbidden access → 404; size/moderation constraints; delete retry idempotent.
- **Postconditions:** owner-only note revision.
- **Rules:** BR17,38. **Data:** journal entry/revision. **AC:** member B cannot read A’s note.

## HC-UC09 — Edit check-in
- **Actor:** Member. **Preconditions:** owns check-in.
- **Trigger:** Edit entry.
- **Main Flow:** load prior values; revise statuses/note; preview; save revision with timestamp; recalculate projections, never replay XP award.
- **Alternative:** delete note but retain status event.
- **Exceptions:** stale revision conflict → compare/reload; deleted journey permits export/history policy only.
- **Postconditions:** latest state + auditable prior version.
- **Rules:** BR16–17,26. **Data:** check-in revision/audit. **AC:** retry does not award duplicate XP.

## HC-UC10 — Add activity on day 14
- **Actor:** Member. **Preconditions:** active World; user can edit branch.
- **Trigger:** Add Activity.
- **Main Flow:** select reviewed template or self-created; check safety/preferences; select date/schedule; preview effect; append activity without backfilling past days.
- **Alternative:** add second branch or start future journey.
- **Exceptions:** template expired → block and suggest reviewed alternative; allergy unknown → do not recommend recipe.
- **Postconditions:** new activity starts at chosen effective date.
- **Rules:** BR09,12,18. **Data:** activity/version/schedule. **AC:** day 1–13 unchanged.

## HC-UC11 — Pause/resume journey or activity
- **Actor:** Member. **Preconditions:** owner; active item.
- **Trigger:** Pause.
- **Main Flow:** choose item, optional reason/date; pause schedule/reminders; history retained; resume chooses new start/schedule.
- **Alternative:** archive instead.
- **Exceptions:** notification queued → cancel if not sent; pause concurrent check-in safely.
- **Postconditions:** paused state no penalty.
- **Rules:** BR10–11,19,30. **Data:** status history/notification jobs. **AC:** no lost entries.

## HC-UC12 — Replace activity
- **Actor:** Member. **Preconditions:** owner; replacement selected.
- **Trigger:** Replace.
- **Main Flow:** inspect current and alternative; end current at time T; create linked replacement; keep previous check-in entries and provenance.
- **Alternative:** no replacement, simply pause/archive.
- **Exceptions:** old template withdrawn → preserve historic label, prevent new activation.
- **Postconditions:** new activity not backdated.
- **Rules:** BR18,20. **Data:** activity lineage/version. **AC:** old-day history unchanged.

## HC-UC13 — View milestone and claim reward
- **Actor:** Member. **Preconditions:** journey elapsed threshold.
- **Trigger:** map milestone popup.
- **Main Flow:** show elapsed day, optional reflection and summary; claim eligible cosmetic/knowledge reward; ledger/reward grant idempotent.
- **Alternative:** dismiss and return later.
- **Exceptions:** offline → pending claim sync; already claimed → show owned state.
- **Postconditions:** milestone state reached once; no mandatory check-in that day.
- **Rules:** BR28–29. **Data:** milestone/reward claim. **AC:** day 7 event separate from check-in.

## HC-UC14 — Enable public sharing
- **Actor:** Journey Owner. **Preconditions:** member, public guidelines accepted.
- **Trigger:** Share Journey.
- **Main Flow:** choose alias; field-by-field preview; exclude private notes by default; confirm explicit consent/version; publish projection; show public URL/revoke controls.
- **Alternative:** share one milestone/reflection only.
- **Exceptions:** risky claim detected → redact/review queue; alias conflict not identity leak.
- **Postconditions:** only allowed fields public.
- **Rules:** BR21–23,25. **Data:** consent/projection/version. **AC:** public endpoint never reads journal table.

## HC-UC15 — Follow Journey A
- **Actor:** Member. **Preconditions:** public journey active.
- **Trigger:** Follow.
- **Main Flow:** follow in app; choose update types/frequency; default no email; display following list.
- **Alternative:** follow anonymously as guest not supported (proposed); bookmark public page.
- **Exceptions:** owner revokes/block → unfollow and hide; notification delivery failure no follow loss.
- **Postconditions:** independent follow record.
- **Rules:** BR22,24,30. **Data:** follow/preferences. **AC:** no access to private journal.

## HC-UC16 — Start own journey inspired by A
- **Actor:** Member B. **Preconditions:** A projection public; B has profile consent.
- **Trigger:** Start My Own Journey.
- **Main Flow:** select inspiration; catalog-map eligible template IDs; discard unsafe/unreviewed personal activities; personalize schedule/preferences; show provenance and draft; B confirms; add to B’s World.
- **Alternative:** copy themes only/no item, or start blank.
- **Exceptions:** A revokes during process → cancel source read; already-created B journey remains B’s data; withdrawn template flagged for review.
- **Postconditions:** independent data/XP/progress; no raw note copied.
- **Rules:** BR05–08,12,23,33. **Data:** source link optional, rematched activity IDs. **AC:** no direct duplication of A regimen.

## HC-UC17 — Earn XP
- **Actor:** Member/system. **Preconditions:** eligible event.
- **Trigger:** save check-in/learning/reflection.
- **Main Flow:** validate event uniqueness; append ledger transaction; update cached balance; show reason.
- **Alternative:** async award queued.
- **Exceptions:** duplicate event key → existing transaction returned; failed ledger write → no optimistic permanent balance.
- **Postconditions:** auditable balance.
- **Rules:** BR26–27. **Data:** XP ledger. **AC:** client cannot set XP.

## HC-UC18 — Unlock map region/achievement
- **Actor:** Member/system. **Preconditions:** eligible non-health-outcome threshold.
- **Trigger:** award threshold reached.
- **Main Flow:** evaluate deterministic rule, create idempotent achievement, reveal map decoration/knowledge item; user may dismiss.
- **Alternative:** no reward chosen → continue without.
- **Exceptions:** config disabled → retain XP and no error.
- **Postconditions:** no wellness activity intensification requirement.
- **Rules:** BR27–29. **Data:** achievement/reward catalog/version. **AC:** never reward herbs, overexercise, cure claim, public disclosure.

## HC-UC19 — Receive daily reminder email
- **Actor:** Member/scheduler. **Preconditions:** explicit email opt-in, active journey, schedule valid.
- **Trigger:** due local reminder.
- **Main Flow:** dedupe; compute local date, safe generic subject, map preview without sensitive data; send signed Continue link; record provider result.
- **Alternative:** pause/snooze reminder.
- **Exceptions:** DST, bounce, provider outage, invalid token → bounded retry/error state; no journey mutation.
- **Postconditions:** delivery log and next occurrence.
- **Rules:** BR30–32. **Data:** preference/job/delivery. **AC:** no note/topic in subject.

## HC-UC20 — Pause/unsubscribe reminder
- **Actor:** Member or recipient. **Preconditions:** reminder preference exists.
- **Trigger:** manage settings/unsubscribe link.
- **Main Flow:** verify signed token; pause/unsubscribe immediately; cancel queued jobs; confirm.
- **Alternative:** change cadence/timezone then resume.
- **Exceptions:** expired token → authenticated settings route; repeated request idempotent.
- **Postconditions:** no future send.
- **Rules:** BR30–32. **Data:** preference/status. **AC:** unsubscribe does not delete member/World.

## HC-UC21 — Ask AI Journey Companion
- **Actor:** Member. **Preconditions:** phase 5 active, explicit feature consent, allowed context.
- **Trigger:** ask question or weekly reflection.
- **Main Flow:** retrieve approved sources and user-authorized summaries; constrain output; cite source; clarify uncertainty; allow feedback.
- **Alternative:** manual reflection template.
- **Exceptions:** urgent symptom/medical advice/unsupported claim → safe boundary response and seek qualified care; model unavailable → fallback.
- **Postconditions:** no unapproved treatment saved as activity.
- **Rules:** BR33–34. **Data:** minimal request metadata, retention decision open. **AC:** no community note ingestion by default.

## HC-UC22 — Admin reviews/activates knowledge candidate
- **Actor:** Reviewer/Admin. **Preconditions:** authorized role, candidate and sources.
- **Trigger:** queue candidate.
- **Main Flow:** inspect claim-source mapping, safety, audience, evidence/date; approve/request changes/reject; record reason/version; activate only after required checks.
- **Alternative:** assign clinical reviewer.
- **Exceptions:** unsupported or high-risk claim stays suppressed; concurrency uses version check.
- **Postconditions:** audit and status transition.
- **Rules:** BR34–35. **Data:** content/review audit. **AC:** no approval solely from URL existence.

## HC-UC23 — Report and moderate community content
- **Actor:** Member, Moderator, Admin. **Preconditions:** content visible/reporter eligible.
- **Trigger:** Report.
- **Main Flow:** choose reason, submit privately; severity rules may temporarily hide risk claim; moderator reviews evidence/context; redact/remove/restore/appeal; audit action.
- **Alternative:** block owner, mute comments.
- **Exceptions:** report abuse rate limit; emergency threat escalation policy approved separately.
- **Postconditions:** reporter sees status without private moderation notes.
- **Rules:** BR24–25,35. **Data:** report/moderation audit. **AC:** moderator cannot see unrelated private journal.

## HC-UC24 — Update profile, export or delete account
- **Actor:** Member. **Preconditions:** authenticated.
- **Trigger:** profile settings/data rights.
- **Main Flow:** edit optional interests/constraints/consent; view active shares; request export or deletion; reconfirm; revoke projection/cancel reminder; queue purge and provide status.
- **Alternative:** revoke one purpose only.
- **Exceptions:** auth recovery, legal hold, pending export failure → explain status and retry.
- **Postconditions:** deletion state and audit according to retention.
- **Rules:** BR02–03,21–22,38–39. **Data:** profile history, deletion jobs. **AC:** public data removed promptly.

## HC-UC25 — Return after long inactivity
- **Actor:** Member. **Preconditions:** existing World, no recent activity.
- **Trigger:** sign-in/email link.
- **Main Flow:** show current map, last event date, quiet welcome; offer continue/resume/review/archive branches; never frame gap as failure.
- **Alternative:** user starts new branch or exports.
- **Exceptions:** expired template → preserve history, offer current reviewed alternatives; timezone changed → explain today.
- **Postconditions:** explicit user choice; no synthetic streak.
- **Rules:** BR10–11,19,40. **Data:** world status/history. **AC:** no reset/loss.

## HC-UC26 — Maintain reviewed catalog
- **Actor:** Reviewer/Admin. **Preconditions:** review permissions.
- **Trigger:** new source, expiry, safety signal.
- **Main Flow:** create candidate/version, classify evidence, assign reviewer/date, approve/activate or reject; expiry suppresses recommender.
- **Alternative:** deprecate with replacement link.
- **Exceptions:** source unavailable/material new evidence → deactivate and queue re-review.
- **Postconditions:** active catalog consistent.
- **Rules:** BR05,34–35. **Data:** template/version/source/review. **AC:** immutable prior versions.

## HC-UC27 — Revoke or delete shared Journey A
- **Actor:** Journey Owner. **Preconditions:** existing public projection.
- **Trigger:** stop sharing/delete.
- **Main Flow:** immediate deactivation; invalidate feed/cache; stop follower notifications; remove comments/projection according to policy; confirm consequence.
- **Alternative:** redact selected field instead.
- **Exceptions:** downstream search cache pending purge is blocked from serving on authorization check; compliance retention is private.
- **Postconditions:** B cannot reopen A public content; B’s independently started journey remains.
- **Rules:** BR22–23,38–39. **Data:** projection/consent/revocation audit. **AC:** no read via old URL.

## HC-UC28 — Comment and manage interaction
- **Actor:** Member/Owner/Moderator. **Preconditions:** comments enabled by owner, authenticated.
- **Trigger:** comment/owner update.
- **Main Flow:** post within limits; owner hides/deletes own comments, blocks/reports; moderator handles abuse; updates use preference.
- **Alternative:** owner disables comments.
- **Exceptions:** rate limit/spam/withdrawal → hide pending review.
- **Postconditions:** no public access to private messages/journal.
- **Rules:** BR21–25,35. **Data:** comment/report/audit. **AC:** comments opt-in and deletable.

## HC-UC29 — Record daily habit-to-reduce and reflection
- **Actor:** Member. **Preconditions:** member has declared habit optionally.
- **Trigger:** daily check-in/reflection.
- **Main Flow:** choose “not today / happened / prefer not to say”; optional neutral note; no shame copy; award only valid first check-in, not abstinence outcome.
- **Alternative:** skip field entirely.
- **Exceptions:** field removed → historical event retained under privacy controls.
- **Postconditions:** self-report only.
- **Rules:** BR13–17,27. **Data:** check-in response. **AC:** no penalty for lapse.

## HC-UC30 — Navigate multi-year World/map
- **Actor:** Member. **Preconditions:** long history.
- **Trigger:** open World.
- **Main Flow:** overview regions and active branch; search/filter by date/status; zoom or list view; open timeline node; pagination/virtualization.
- **Alternative:** jump to Today or milestone.
- **Exceptions:** map rendering unavailable → accessible list/timeline.
- **Postconditions:** no history truncation.

## HC-UC31 — Find a canonical Wellness Catalog Item
- **Actor:** Guest/Member. **Preconditions:** catalog read available; private results require member auth.
- **Trigger:** search/filter Catalog or Add Tool.
- **Main Flow:** search canonical name, alias, category/type; view item ID, current version, review/evidence/safety and related methods/items; select item or continue to a method.
- **Alternative:** no exact result → show related items and “Suggest a catalog addition”; do not create canonical item from text.
- **Exceptions:** item inactive/expired → historical view only, cannot equip as reviewed recommendation; search outage → retry/private tool option.
- **Postconditions:** selected canonical ID preserved.
- **Rules:** BR41–43,51. **Data:** catalog item/version/aliases/relations. **AC:** selection refers to stable ID; item and method are distinct.

## HC-UC32 — Add canonical item/method to My Toolkit
- **Actor:** Member. **Preconditions:** auth and World/branch; selected item or eligible method.
- **Trigger:** Add to My Toolkit.
- **Main Flow:** choose In Collection or Equip; select branch/journey, personal start date, optional schedule; review exact item vs method; confirm.
- **Alternative:** save in collection without schedule; add method with multiple related items.
- **Exceptions:** method becomes inactive before confirmation → block reviewed status and offer safe alternatives; existing entry → open/update instead of duplicate.
- **Postconditions:** user-scoped toolkit entry linked to canonical ID/method ID, no check-in backfill.
- **Rules:** BR42–45. **Data:** toolkit entry, schedule version, history. **AC:** item/method IDs retained separately and entry is private.

## HC-UC33 — Record structured daily tool usage
- **Actor:** Member. **Preconditions:** own toolkit entry; current local date.
- **Trigger:** check-in tool card or usage timeline.
- **Main Flow:** select tool and optional method; set status; optionally add occurrence/time/count; optional private note; save usage record; reflect summary on World.
- **Alternative:** mark Not Yet/Skipped/Not Suitable; enter status without count/time; edit existing record.
- **Exceptions:** duplicate same occurrence request is idempotent; conflicting edit creates revision; no record for a day remains unknown, not “unused”.
- **Postconditions:** structured record directly queryable by item ID and method ID.
- **Rules:** BR13–17,46–48,52. **Data:** usage record/occurrence/revision. **AC:** no XP based on amount/frequency; notes remain private.

## HC-UC34 — Equip, pause, replace, or archive a tool
- **Actor:** Member. **Preconditions:** owns toolkit entry.
- **Trigger:** manage tool card.
- **Main Flow:** choose state/effective date; optionally move to branch; confirm; append history; existing usage records remain attached to original entry/method.
- **Alternative:** keep item in collection while replacing the active method.
- **Exceptions:** target branch archived → choose another branch; reviewed template withdrawn → preserve historic data, prevent new use as reviewed.
- **Postconditions:** state and effective schedule reflect new choice, prior history unchanged.
- **Rules:** BR44–45. **Data:** toolkit state history, schedule versions, replacement link. **AC:** collection/equipped/paused/archived distinct.

## HC-UC35 — Create a personal unreviewed tool
- **Actor:** Member. **Preconditions:** authenticated; self-created tool feature enabled.
- **Trigger:** Create Personal Tool.
- **Main Flow:** enter name/category/type and optional private description; system assigns user-scoped ID, labels Personal / Unreviewed; optionally attach to branch and schedule.
- **Alternative:** user saves draft or cancels.
- **Exceptions:** text includes dose/unsafe claim → warn/limit; duplicate-like name suggests existing canonical item; no public recommendation route.
- **Postconditions:** private tool can be tracked without becoming a Catalog item.
- **Rules:** BR50–51. **Data:** personal tool and owner-scoped aliases. **AC:** no global canonical ID; other users cannot discover it absent explicit reviewed proposal/consent.

## HC-UC36 — Propose personal tool for Catalog normalization
- **Actor:** Member and Reviewer. **Preconditions:** personal tool exists; user chooses Suggest for Catalog.
- **Trigger:** submit proposal.
- **Main Flow:** show consent and stripped proposal fields; normalize name/category/type, search exact/near duplicates and synonyms; create pending proposal; reviewer links to existing item, creates canonical ID/version, requests info or rejects; notify proposer.
- **Alternative:** link synonym/alias to existing canonical ID without creating a duplicate.
- **Exceptions:** ambiguous duplicate → queue manual review; proposal withdrawn → cancel if not decided; sensitive note never enters proposal.
- **Postconditions:** private tool remains private; only reviewer-approved catalog object becomes global.
- **Rules:** BR41,43,50–51. **Data:** catalog proposal, duplicate candidates, audit. **AC:** user input cannot set reviewed status or canonical ID.

## HC-UC37 — Discover journeys using same item or method
- **Actor:** Guest/Member. **Preconditions:** journey owner has consented to active projection with IDs/fields.
- **Trigger:** open item detail or Community Explorer filter.
- **Main Flow:** choose “same catalog item” or “same usage method”; optionally filter by explicitly public goal/preference; show only matching active public journeys and experience disclaimer.
- **Alternative:** broaden from method to item, then related item/category; no results gives safe empty state.
- **Exceptions:** revoked consent immediately removes projection; small aggregate counts/facets are suppressed. An individually published item/method timeline is shown only when the owner explicitly selected that match scope; cohort size is never exposed.
- **Postconditions:** aggregate/discovery event contains no private profile/usage notes.
- **Rules:** BR21–25,48–49. **Data:** public projection IDs and consented filter facets. **AC:** item match and method match are distinct; no private health profile leak.

## HC-UC38 — Start a personalized Toolkit from a public journey
- **Actor:** Member. **Preconditions:** active public journey; B has consented profile and own World or can create one.
- **Trigger:** Start My Own from a tool/method timeline.
- **Main Flow:** map active canonical IDs and approved method versions; display A’s consented timeline as self-report; filter through B’s safety/preferences; let B choose items/methods and schedule; confirm independent toolkit entries and journey.
- **Alternative:** select item only and choose another reviewed method; start blank.
- **Exceptions:** self-created/unreviewed item or withdrawn method is omitted, not copied; A revokes during creation → stop fetching projection; after creation B’s own records remain.
- **Postconditions:** B has independent tool IDs/records/schedule; no outcome claim or private note copied.
- **Rules:** BR05–08,23,43,45,49–52. **Data:** B toolkit entries, source provenance, profile match event. **AC:** system never proposes A’s amount/frequency as a recommended dose.
- **Rules:** BR09–10,40. **Data:** paginated journey/check-ins. **AC:** keyboard/list equivalent.
## HC-UC39 — Complete game onboarding and adaptive quiz
- **Actor:** Guest/Member. **Preconditions:** active question bank and disclosures.
- **Trigger:** Create Your Wellness Journey.
- **Main Flow:** traverse seven onboarding stages; answer 8–10 core target with adaptive branches; reveal map gradually; Back/Skip/Resume; view result as guest before account prompt.
- **Alternative:** resume guest session, skip optional deep questions, choose zero tools.
- **Exceptions:** under-18 stops personalization; insufficient safety data filters affected tools; expired session restarts without fabricated answers.
- **Postconditions:** guest sees result; persistence follows consent/auth.
- **Rules:** BR01–04,53–54. **Data:** quiz session/question version/profile preview. **AC:** question bank retained; no registration wall.

## HC-UC40 — Equip starting tools in three slots
- **Actor:** Guest/Member. **Preconditions:** result preview and available catalog.
- **Trigger:** Equip Your Tools.
- **Main Flow:** inspect Consume/Eat, Reduce/Avoid, Do/Practice; view Why, details and safety; select at most one per slot; explicitly confirm any subset 0–3.
- **Alternative:** Explore More, replace selection, skip one/all.
- **Exceptions:** wrong type rejected; stale review rechecked; no eligible item leaves slot blank.
- **Postconditions:** explicit selection draft, no automatic equipment.
- **Rules:** BR54–55,58–60. **Data:** slot assignment and Toolkit Entry draft. **AC:** zero-tool path works.

## HC-UC41 — Accept or customize a Recipe Combo
- **Actor:** Guest/Member. **Preconditions:** Recipe Combo approved and active.
- **Trigger:** open recipe or select in Consume/Eat.
- **Main Flow:** show recipe ID/version, ingredient IDs, reviewed method, allergy/safety notes and sources; inspect and confirm.
- **Alternative:** remove a component only when reviewed rules allow; decline and pick individual items.
- **Exceptions:** required component ineligible blocks combo; never silently substitute.
- **Postconditions:** recipe remains a distinct item linked to multiple ingredients.
- **Rules:** BR42–43,56,58–59. **Data:** recipe/method/component versions. **AC:** many-to-many IDs persist.

## HC-UC42 — Partially accept a Journey Combo
- **Actor:** Guest/Member. **Preconditions:** approved combo and slot-compatible components.
- **Trigger:** select preset.
- **Main Flow:** inspect slot assignments/reasons; remove/replace/accept subset/all or skip; recheck profile/safety/version; confirm; create an entry per accepted component.
- **Alternative:** choose individual recommendations.
- **Exceptions:** required item ineligible and no partial rule blocks; stale version refreshes; timeout never equips.
- **Postconditions:** separate independently editable Toolkit Entries.
- **Rules:** BR55,57–60. **Data:** combo decision/components/entries. **AC:** combo is never monolithic.
# Use cases được duyệt bổ sung — 2026-10-28

## HC-UC39 — Enter one of the currently playable regions

- **Actor:** guest/member. **Trigger:** chọn một marker trên Overworld.
- **Main flow:** cho phép Sleep Valley hoặc HealthClues Realm; hiển thị tám vùng, sáu vùng chưa phát hành là Coming Soon và không tạo Journey.
- **Rules/data:** dùng availability config trung tâm, giữ region ID/database tương thích. Region marker không cấp XP.
- **Status:** global map/browser availability đã kiểm tra; detailed region scenes chưa triển khai.

## HC-UC40 — Continue Quiz-selected Journey

- **Actor:** eligible player. **Main flow:** lưu concern/goal từ Quiz làm self-reported Journey context; pet và reviewed content theo context; không hỏi lại cùng concern khi vào HealthClues Realm.
- **Safety:** không chẩn đoán; chỉ hiển thị nội dung đã review và phù hợp safety/consent.
- **Status:** BLOCKED/PARTIAL; current branch key lưu region ID, không bảo đảm lưu concern riêng. See `QUIZ_TO_JOURNEY_PERSONALIZATION.md`.


## 09B use-case implementation evidence — 2026-10-29

The owner-browser build now supports the authenticated player opening the saved World scene, selecting either available detailed region, interacting with landmarks, opening contextual feature panels and returning/reloading the same World. Sleep uses Luna; a Health/Gout Quiz profile entered HealthClues Realm with Lumi without a repeated concern prompt. Six other Overworld regions remain locked. This does not complete the use cases for reviewed learning activity, Journey switching/loadouts, daily Pet dialogue, Skills, mini-games or full reward loops. See `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## UC09B First-time player meets Pet and prepares Backpack — implementation slice

An authenticated first-time player enters the region selected by the original Quiz, receives a short Pet welcome, and may inspect topic-matched reviewed Catalog tools in the existing three slots or skip. Guide stage is stored per owner and World without duplicating Quiz/profile data. The player can then visit the current map's Knowledge Library or explore. No matching reviewed content is an honest non-blocking empty state. Actual reviewed-item detail/equip remains unverified until suitable reviewed Catalog data exists in the isolated demo. See `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md`.

## HC-UC43 ? Inspect a region discovery entry and manage private Care Plan data (09C)
- **Actor:** Authenticated owner of the active World. **Preconditions:** verified session, owner-scoped World, applicable consent; Catalog entries must be current and editorially reviewed.
- **Main flow:** enter one of the three in-region discovery stations; inspect matched encyclopedia entries and evidence/safety details; choose independently to save to Collection, request eligible Backpack equip, self-report use, or continue without action. At Camp, optionally add/edit/pause/delete a private user method or medication record and save a separate self-report.
- **Alternative:** no tag-matched reviewed content ? truthful empty state; player can skip and continue.
- **Rules:** no medical diagnosis, efficacy inference, dose calculation, public sharing, rewards for medication/herb use, or recommendation from user-created records.
- **Data/API:** `healthclues_personal_care_records`, `healthclues_personal_care_events`; authenticated `/api/healthclues/care-plan`; service API scopes every query to authenticated owner and owned World.
- **Acceptance:** refresh preserves Care Plan; another account cannot access; user-created record is not in published Catalog.

## UC09C TEST ONLY local learning interactions — implementation status

The isolated owner demo has source fixtures for Catalog, Knowledge and Boss mechanics, marked `test-fixture` / `hc-demo-*`; these are not human-reviewed health content. API filtering and topic-scoped Knowledge RPC logic are implemented in source. Browser acceptance is still BLOCKED because the next isolated build failed with `ENOSPC`; the current a1 app must not serve fixture rows, so seeded rows are inactive/unpublished. No test-fixture gameplay is claimed as verified. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

## UC-HC-KNOWLEDGE-GAME — Optional learning activity and shared Skills

An authenticated player in an active Region Map can start an optional short learning activity from the Knowledge Library, answer or retry without penalty, close it, and return to the same region. A correct unique completion is owner-scoped and can award the fixed demo learning reward once. Four Skill counts are derived from the player's unique saved Knowledge clue discoveries and learning-game completions and rendered as five named levels. No symptom, medication, supplement, or adherence data affects progress. Isolated synthetic games are unavailable outside the local owner-demo gate and are explicitly labeled TEST ONLY / NOT HUMAN-REVIEWED. Current browser acceptance is pending Docker/local Supabase startup.

### Local owner-demo evidence update — 2026-10-30

The prior pending-browser status is superseded for the tested isolated scope. Fresh E2E on `app-build-final-a7` verifies the Quiz-selected region, no repeated Health concern prompt, Luna/Lumi, reachable NPC stations, Encyclopedia, Collection/Backpack, private Care Plan isolation, optional Pet check-in, all four TEST ONLY learning games, saved early Skill counts, Boss key/unlock, Rewards and same-World reload for synthetic accounts. All five Skill threshold mappings have focused source-test coverage; the browser fixture itself reached early progress only. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md` for evidence and review limitations.

## UC-HC-BACKPACK — Discover, save, equip and privately track tools — verified local demo scope

- **Actor:** authenticated owner of the active World. **Flow:** walk to a Journey-matched NPC; inspect a preview and full details; save/unsave independent Collection entries; optionally equip an eligible entry into any of three flexible positions; confirm replacement if full; later remove/pause or replace while retaining Collection/history; optionally report a private Daily Companion status.
- The three pre-world positions begin open. A player may proceed with zero tools. Action category remains metadata on the item and does not constrain slot position. A fourth item requires an explicit chosen replacement.
- Equipment is server-validated against the authenticated owner, World, current catalog version and eligibility. TEST ONLY equipment eligibility is limited to the isolated local Owner Demo and is distinct from editorial review. Fixtures remain explicitly NOT HUMAN-REVIEWED; food examples do not imply clinical efficacy.
- Collection may contain non-equipment-eligible learning entries. A saved Tomato can be opened with source/safety information, remains unequippable, can be unsaved, and can later be saved again from the Gout Botanist. Personal tools/medication records remain private self-reports and do not become Catalog entries or automatic Backpack equipment.
- Daily reports are optional, item-specific `done`, `not_yet`, `skipped`, `unsure` or `not_suitable`; no record is not inferred as skipped/adherence. Private notes are owner-scoped. E2E evidence and exact limitations are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.
# UC-HC-RECOMMEND — personalized educational discovery (implemented source update 2026-10-30)

An authenticated owner optionally views up to three ranked existing Catalog items in Camp or station-scoped NPC panels. Ranking uses only stored self-reported Journey context and explicit Catalog tags/eligibility. Each item explains its supported reason, evidence state and caution. The player may explore by walking, save independently, dismiss, provide optional feedback, or equip only after the server rechecks personal eligibility. General education remains browsable when suitability is unknown. Events remain private to the owner and World. See the latest final-game acceptance report for which browser/security cases have actual evidence.

# Current Post-Quiz Wellness Plan acceptance evidence — 2026-10-30

The existing Discovery Quiz may lead to a user-controlled everyday-habit checklist. Gout and Sleep flows were locally browser-tested on `http://127.0.0.1:3261/play`; separate synthetic authenticated users confirmed different Plans into separate existing Worlds, retained them after reload and were denied cross-owner Plan read/write (404). The current checklist is deterministic, not live AI; all available templates are TEST ONLY / not human-reviewed. Email callback on this new port remains unverified. Full steps/screenshots and status: `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md`.

# UC-HC-WORLD-ENTRY — Meet the Pet and find the saved Wellness Plan (implemented and browser verified, 2026-10-30)

- **Actor/precondition:** owner of an email-verified persistent World with a selected playable region. The guest preview never records permanent tutorial completion.
- **Main flow:** matching Luna/Lumi welcomes the player over the existing Region scene; the four short stages preview actual goal records, open My Wellness Plan from Quests, then highlight the reachable Botanist and return the player to free exploration.
- **Alternates:** no confirmed goals receives a truthful free-exploration message; Back, Skip, refresh/resume and voluntary replay are supported. No goal is fabricated or marked completed by being selected.
- **Plan actions:** the Quests top nav, tutorial CTA and Adventure Camp link address the same owner/World Plan. Edit/configure, pause/resume and confirmed removal create a new revision via the existing authenticated Plan API; a user-entered one-line goal is saved as self-reported/inactive until measurably configured and explicitly resumed.
- **Postcondition:** tutorial state remains attached to the existing World; closing the Plan or NPC dialogue returns to the same region/player position. Browser evidence and limitations: `reports/HEALTHCLUES_WORLD_EXPERIENCE_ACCEPTANCE.md`.


## UC — Xem My Journey RPG inventory (2026-10-31)

Actor: người chơi đã vào World đã xác thực. Trigger: mở nút persistent `My Journey`. Main flow: xem Quiz focus → xem goal trong Confirmed Plan (Active/Saved for later) → xem herbs equipped thực sự từ Botanist → xem practices equipped thực sự từ Wellness Guide → mở Quests để xem/chỉnh Plan chuẩn. Alternate: chưa có Plan hoặc section equipment rỗng thì hiển thị hướng dẫn đúng, không tạo dữ liệu. Invariants: Collection không phải equipment; plan không phải completion log; không thêm item vượt qua NPC/eligibility flow. Cross-account read/write bị API từ chối.

## UC — Theo hướng dẫn focus trong My Journey (2026-10-31)

Actor: người chơi mới hoặc người chủ động replay tour Luna/Lumi trong playable World. Main flow: mở My Journey thật rồi xem bốn lời giới thiệu theo thứ tự Wellness Focus, Daily Checklist, Herbs Equipped, Practices Equipped. Mỗi bước chỉ nhấn sáng đúng một mục, làm mờ ba mục kia và phủ tối/khóa map; Pet nói ngay cạnh section mà không che chữ. Back/Next đổi target mà không đóng các section. Trên 390×844, Pet và target phải cùng nằm trọn trong viewport cuộn, kể cả sau resize. Complete/Skip dùng tiến trình tutorial có sẵn; không ghi thêm profile, Plan, inventory hay goal. Acceptance: `reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md`.

## UC ? HealthClues player language choice ? 2026-10-31

**Actor:** first-time or returning HealthClues player.

**Trigger:** player enters the existing Welcome screen or changes language in the player shell/settings.

**Expected:** English is selected by default; the player can choose Ti?ng Vi?t without an extra onboarding route. The same Quiz uses canonical question and answer identifiers, and locale switching does not alter responses or progression. Guest preference is device-local; authenticated preference uses the existing private profile and is owner-scoped. Missing reviewed Vietnamese knowledge must be disclosed, while source and safety meaning stay intact.

**Current implementation/acceptance:** Welcome, core Quiz questions/options and the guest mid-Quiz switch are browser-verified. Complete authenticated locale handoff, Plan/AI/reveal/game/NPC coverage and account-isolation acceptance remain open; see reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md.
# Use case — localized Plan Builder with a truthful Advisor failure state

**Actor:** HealthClues player. **Precondition:** shared Quiz profile is available and locale is `en` or `vi`.

The player opens Reveal and Plan Builder. The UI displays canonical Quiz topic, selected interests and focus in the active locale without changing stored values or scoring. The server receives the locale but only selects from validated reviewed candidates under the unchanged JSON schema. If source or billing validation blocks generation, the player sees a localized, nontechnical explanation and no unsupported checklist. A player may still add a personal draft or continue without choosing a goal. Account and World data remain owner-scoped.
# UC — select a personalized Wellness Plan (Master Prompt 16)

**Actor:** authenticated or pending-activation player with a completed Quiz. **Main flow:** request a locale-specific AI plan using the minimized Quiz profile; receive only schema-valid, source-mapped and independently safety-checked everyday habits; choose one of two AI alternatives, enter one custom text option, or skip each goal; confirm selected goals using existing private owner/World Plan persistence. **Constraints:** no auto-selection/activation, no fabricated baseline or source, no medical treatment/herb/supplement advice, no alternate inventory. If Gemini fails billing, show localized unavailability; do not substitute the local TEST ONLY habit library as AI. **Acceptance:** unit safety/schema tests, authenticated Chromium A/B/custom/skip/confirm/reload/isolation in EN/VI, plus real Gemini response before marking inference accepted.

## UC-MP17 — Begin a concern-first personalized World journey (2026-11-01, source partial)

New player selects a self-reported focus, answers a few adaptive choice questions, verifies an account through the existing activation path, enters the selected existing playable World, and may review an optional Pet-introduced Plan. The player can include or exclude goals independently from A/B/custom implementation choices, confirm any number including zero, or postpone. The authenticated Plan remains authoritative and My Journey reads only its persisted selections. Gemini 402 leaves a localized unavailable state and a playable World. Full browser account/Plan/reload acceptance remains pending; this record specifies the implemented path and intended use case, not a PASS claim.
## UC-MP19 — Choose a world before wellness discovery

Actor: new `/play` player. Main flow: choose EN/VI at Welcome; choose one of the two playable worlds from the intact eight-region set; answer no more than three adaptive questions relevant to that world; optionally receive the existing account activation link; resume the same selected world and answers; open that region directly after the authenticated World is created. Luna owns Sleep Valley and Lumi owns HealthClues Realm. Alternate: if adaptive discovery or Gemini is unavailable, show a truthful localized retry/postpone/continue option without test recommendations. Existing accounts skip onboarding and return to their persisted World. Invariants: never derive a new player's selected world from the concern; Sleep focus does not prompt for the concern again; zero goals are valid; the other six regions remain Coming Soon.
# MP20 use case — choose a health focus in two screens (2026-11-02)

Activation handoff detail: preserve 0?12 canonical factor IDs/labels (`a-<id>`, plus explicit `none`/`unsure`) in the encrypted pending journey. If validation/storage/network fails, retain the preview and submitted answers for retry; do not send the verification email until secure context save succeeds.

**Actor:** new HealthClues player. **Preconditions:** player has selected English or Vietnamese and one of the two playable Worlds. **Main path:** choose a single topic from the selected World’s local concern bank; optionally type a short Other concern; choose any matching factor options or none/unsure on the second screen; confirm adult eligibility; continue through the existing account handoff. The World selection and canonical factor IDs/labels travel through the existing profile contract. Gemini may later use this context for optional lifestyle suggestions. **Alternate paths:** skip all second-screen factors, add an optional note, or use neutral context options for an unsupported/custom concern. **Safety:** answers do not diagnose or identify causal factors; no medication/fluid prescription; safety unknown remains unknown. **Not covered:** account activation continuity and persistent 96-question legacy answers still require separate authenticated fixtures.

### 2026-11-12 — Cycle 88: Mobile Phone Onboarding Accessibility & Immediate Fallback Path

In `healthclues-mobile`, the onboarding wizard provides `>=38–48px` touch targets across `360x800` viewports, keeps step navigation sticky inside the thumb zone on multi-select screens, auto-scrolls newly revealed free-text fields (`concernNote`, custom extra habit input) into view, and lets users trigger `buildLocalPersonalizedGoals` immediately if they prefer not to wait for remote AI latency. Verified via 2-round Chrome CDP phone audit (`360x800`) and full multi-viewport UX acceptance suite (`exit 0`).

### 2026-11-12 — Cycle 89: Mobile Custom Font Readability & Interactive 2.5D Diorama Exploration

Players experience branded Vietnamese-diacritic typography (`Be Vietnam Pro` + `Spectral`), consistent Lucide vector icons, readable badge/tab sizing on narrow `360x800` phones, and an interactive 2.5D diorama World with perspective depth scaling, Y-sorted landmarks/actors, animated crystal fountain ripples, multi-depth ambient fireflies, and toggleable Day/Sunset/Night lighting. Verified across `360x800`, `390x844`, `430x932`, `768x1024`, `1280x800`, and `640x360`.
