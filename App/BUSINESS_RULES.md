## 2026-11-17 — Cycle 135: 3 Ngôi Nhà Thực Trong Làng 3D & Quy Tắc Lưu Trữ Túi Đồ Động (Pick-to-Bag Rules)

- **Quy Tắc Định Danh Ngôi Nhà Kiến Trúc Chức Năng (`cozyVillageLayoutLoader.ts`, `landmarkCatalog.ts`):**
  - Chỉ các công trình kiến trúc nhà ở thực thụ mới được gán làm Landmark chức năng sức khỏe.
  - Tuyệt đối không gán chức năng thư viện/sức khỏe vào đạo cụ cảnh quan (guồng nước `bld_watermill`, giếng nước, đài phun, cây cối).
  - 3 ngôi nhà chính thức:
    * `bld_potion_shop` $\rightarrow$ Nhà Thảo Mộc (Flora).
    * `bld_bookshop` $\rightarrow$ Nhà Âm Thanh (Lyra).
    * `bld_great_hall` $\rightarrow$ Thiền Đường - Hơi Thở (Aura).
- **Quy Tắc Lưu Trữ Túi Đồ Động (Aligned with HC-BR44 & HC-BR59):**
  - Túi Đồ của người chơi mới mặc định hoàn toàn trống (`[]`). Không tự động nhét sẵn toàn bộ danh mục vào túi.
  - Thư viện trong nhà là nơi tham khảo toàn diện; vật phẩm chỉ được thêm vào Túi Đồ khi người chơi nhấn chủ động nút `[ + Lưu Vào Túi Đồ ]` hoặc `[ Cất vào Túi ]`.
  - Mỗi lần lưu vật phẩm mới vào túi thưởng cố định +10 EXP (thưởng khám phá học tập một lần theo HC-BR52).
  - Túi Đồ hỗ trợ người chơi loại bỏ vật phẩm đã lưu bằng nút `[ ✕ Bỏ Khỏi Túi Đồ ]`, cập nhật tức thì trạng thái giao diện và bộ nhớ lưu trữ.

---

## 2026-11-16 — Cycle 114: World 3D Cinematic Overview, Floating Lumi Mascot Tour & Pulsing Building Beacons Rules

- **Cinematic Overview Tour Rule (`VillageCinematicTourModal.tsx`, `world.tsx`):**
  - First-time entry into the 3D World must display the 7-step village tour in Overview camera mode (`overview`), introducing the functional houses before revealing full gameplay HUD.
  - The top toolbar (`floatingToolbarOverlay`) must remain hidden until the tour is completed or explicitly skipped, ensuring the 3D village scene remains completely unobstructed.
  - When the tour completes or is skipped, the camera must smoothly transition to close view (`close`) behind the player character, and the top toolbar must unveil with `[ 3D Làng Nổi ]`, `[ Toàn Cảnh ]`, `[ 🔍 Giải Mã ]`, `[ 8 Vùng ]`, and `[ ✨ Tour ]`.
- **Dynamic Pulsing Landmark Beacon Rule (`SmartLandmarkOverlay.tsx`, `cozyVillageLayoutLoader.ts`):**
  - Highlighting a landmark during tour steps triggers both high-distance badge name visibility and continuous CSS pulsing beacon animations (`pulseGlowBeacon` and `pulseBeaconRing`).
  - Active highlights must safely de-assert (`null`) when the tour ends or skips.
- **Narrative Terminology & Button Naming Rule:**
  - The former "Phá Án" action is officially renamed to **"Giải Mã"** across all user-facing UI and accessibility labels (`"Văn phòng giải mã hồ sơ bí ẩn"`).
  - Detective case solving is strictly framed as educating and investigating lifestyle clues from the human world to help people regain health balance.
- **Non-Blocking Spotlight Tour Sequencing Rule (`(game)\_layout.tsx`):**
  - The legacy interactive spotlight tour (`InteractiveTourCard`) must never overlay simultaneously while the cinematic village tour is active (`cinematicTourDone === true` constraint).

---

## 2026-11-15 — Cycle 113: Video Onboarding Responsive Layout & HealthClues-Only Default Rules

- **Zero-Overlap Vertical Flex Rule for Story Intro (`IntroStoryPlayer.tsx`):**
  - In portrait mode, the video player and narrative dialogue card must inhabit distinct vertical layout flex containers. The dialogue card must NEVER float over or obscure the video area.
  - Video dimensions must adhere strictly to `width: "100%"` and `aspectRatio: 16 / 9`, preventing vertical squishing or letterboxing artifacts while allowing fluid height scaling across different screen sizes.
  - In landscape/desktop mode, the video expands to full-screen cinematic proportions, and the dialogue card transitions to an anchored bottom overlay with frosted-glass background.
- **Default HealthClues Realm Invariant (`quiz.tsx`, `world.tsx`):**
  - All new player onboarding flows default directly to the canonical HealthClues Realm. Sleep Valley (`sleep-valley`) is removed from new onboarding flow; players are not prompted with a region choice step during onboarding.
  - The Onboarding Step Trail is strictly 2 steps: `1. Khám phá` → `2. Kế hoạch`.
  - In the World view, the active region defaults to `"healthclues-realm"` and the `[ 🌙 Thung Lũng ]` region toggle button is removed from the primary toolbar.

---

## 2026-11-15 — Cycle 111: Master Narrative & 3-Video Onboarding Business Rules

- **Strict Player-Driven Progression Invariant (`IntroStoryPlayer.tsx`):**
  - The 3-scene narrative intro NEVER auto-advances. The player must explicitly tap "Tiếp tục →" to proceed to the next scene.
  - Video and dialogue must remain strictly separated: The visual viewport handles video playback / poster art, while the bottom narrative card handles dialogue display and character attribution.
- **Dual-Tier Asset Fallback Invariant:**
  - If MP4 video files (`assets/videos/story_intro_*.mp4`) are missing, loading, or fail to play, the player automatically falls back to static high-resolution Ghibli-style story poster art. Under no circumstance should a blank screen, missing texture icon, or broken video placeholder be displayed to the user.
- **Story State Persistence & Skip Behavior (`storyState.ts`):**
  - Completing Scene 3 or tapping "Bỏ qua câu chuyện" writes `hasSeenIntro: true` to AsyncStorage (`healthclues_story_state_v1`). Returning users or players resuming sessions bypass the story intro automatically.
  - Replaying the story from Profile or the Mascot action sheet does NOT reset player progress, level, goals, or inventory.
- **Questionnaire & Auth Integrity Preservation:**
  - Narrative framing by Lumi across `quiz.tsx` (`quest_choice`, `discovery`, `plan`, `mascot_ready`) must not alter question schemas, option IDs, risk factor matching, AI advisor payloads, Supabase authentication, or local plan storage.

---

## 2026-11-12 — Cycle 87: Condition Routing Parity & Audio Persistence Contract

- **Deterministic & Offline Concern Matching (`wellness-advisor/route.ts`, `onboarding.ts`):** `getDeterministicWellnessGoals` and `buildLocalPersonalizedGoals` match `gout`, `weight`, `glucose`, `blood-pressure`, `digestion`, `migraine`, `stress`, and `sleep` signals from both `topic` and `adaptiveDiscovery` fields (`focusId`, `focusLabel`, `concernDetail`, and factor answers) and prioritize relevant goals when specific risk factors (`a-red-meat`, `a-seafood`, `a-alcohol`, `a-sweet-drinks`, `a-activity`) are selected.
- **Audio Preference Sync (`src/services/gameAudio.ts`):** Audio preferences (`bgmTrack`, `sfxEnabled`, `muted`) persist under `healthclues-audio-settings` and synchronize across `TopHud`, Onboarding Welcome, and `profile.tsx` via `AUDIO_STATE_EVENT`.

---

## 2026-11-14 — Cycle 94: Mobile companion onboarding presentation rule

- Mầm Nhỏ is a presentation-only guide for the mobile HealthClues Realm onboarding sequence. Its optional tap reaction must not create, change, infer, persist, transmit or disclose a health answer, Plan item, profile field, progression, region selection, reward, account state or consent.
- The new presentation preserves the approved mobile contract: one explicit selected focus and an optional typed issue after region selection, explicit confirmation, and the existing `completeMobileOnboarding` persistence boundary. It does not replace Lumi as the HealthClues Realm in-World companion.
- Native haptic feedback is optional. Web preview haptics must safely no-op; an unavailable browser haptics API must never block onboarding or raise an unhandled runtime error.

## 2026-11-12 — Cycle 86: Mobile Onboarding Request Contract, Advisor Fallback & Local Plan Precedence

- **Wellness Advisor Request Matching (`src/services/onboarding.ts`):** Onboarding requests to `/api/healthclues/wellness-advisor` send matching `"X-Request-Id"` header and `body.requestId` UUID, omit `worldId` during pre-world onboarding so guest flows remain functional, map `focusId === "sleep"` to `questId: "sleep-better"`, and fall back to concern-specific `buildLocalPersonalizedGoals(profile)` only when the network/endpoint returns empty or fails.
- **Local Plan Precedence (`src/hooks/useWorld.ts`):** When `healthclues-local-plan-updated-at` or `healthclues-user-goals` is present from completed onboarding/edits, `loadWorld` retains the user's selected/customized goals instead of overwriting them with stale backend demo `wellnessPlan.goals`.

---

## 2026-11-12 — Cycle 85: Mobile Reminder Local-First Persistence, Permission Guard & Backend Sync Contract

- **Authenticated Sync vs Guest/Offline Resilience (`src/services/reminders.ts`):** Preferences persist locally under `healthclues-reminder-settings` and only call `GET`/`POST /api/healthclues/reminders` (passing `consentConfirmed: enabled`, `localSendTime`, `frequency`, `timezone`) when `getStoredSession()?.access_token` is present, preventing unauthenticated `401` errors in guest mode.
- **Native Trigger & Platform Guard:** Calling `Notifications.cancelAllScheduledNotificationsAsync()` and rescheduling `DAILY` or `WEEKLY` triggers executes strictly when `Platform.OS !== "web"` and permission is granted; Web contexts safely fall back to `window.Notification` (when permitted in secure contexts/localhost) or inline preview feedback without runtime crashes.

---

## 2026-11-12 — Cycle 84: Daily Care Binary Tick Invariant & Dynamic Streak/Drawer Presentation

- **Binary Tick Rule (`daily-care.tsx`):** Each active habit toggles between `done` (ticked right-edge seal) and `not_yet` (unticked rune ring); total previewed reward sums `expValue` of currently ticked quests (`submitHabitCheckin` remains idempotent per local day so re-confirming updates statuses without duplicating EXP).
- **Journey Drawer Auto-Reveal (`journey.tsx`):** Moving an active habit via `Lưu sau` automatically expands the bottom `Đã Lưu Xem Sau` wooden drawer so reactivation (`Kích hoạt`) stays immediately accessible without extra clicks.

---

## 2026-11-12 — Cycle 83: Cross-Tab Progression Event Invariant, Daily Badge Reset & Arena Gate

- **Cross-Tab Event Sync (`WORLD_STATE_EVENT` & `LOCALE_CHANGE_EVENT`):**
  - Any state mutation in `useWorld.ts` (`submitHabitCheckin`, `checkin`, `addHabit`, `removeHabit`, `toggleGoalStatus`) emits `WORLD_STATE_EVENT` via `DeviceEventEmitter`, updating `xpTotal`, active goals, and today's check-in status across all already-mounted tabs without requiring a reload.
  - Submitting daily check-in (`healthclues-checkin-<today>.submitted === true`) immediately clears the pending red badge (`1`) on the `Nhiệm Vụ` bottom tab in `_layout.tsx`.
  - Toggling `VI` / `EN` via `setLocale` emits `LOCALE_CHANGE_EVENT` to update tab bar labels dynamically.
- **World Station Gating & Locked Region Notice:**
  - Opening `Đấu Trường Thói Quen Lành Mạnh` (`boss`) requires selecting the correct educational mechanism answer before claiming the Arena reward sheet; tapping locked `Thung Lũng` or locked Overworld biomes shows a visible auto-dismissing floating toast (`floatingWorldToast`).
- **Web Modal Parity Rule:**
  - Account actions (`Đăng xuất`, `Xóa tài khoản của tôi`) and empty-habit validation use in-app React Native `<Modal>` dialogs or inline form errors instead of `Alert.alert` callback buttons so destructive actions work identically on Web and mobile.

---

## 2026-11-10 — Cycle 66: Mobile Habits System, Add Habit Invariant & Daily Star Calculation Rules

- **Mobile Habits vs Equipment Invariant**:
  - Tính năng cốt lõi của Daily Care là **Thói quen sống khỏe (Wellness Habits / Goals)**, không phải trang bị 3 slot công cụ MMORPG.
  - Người chơi sau Quiz bắt buộc được khởi tạo 3 thói quen y khoa vàng (2000ml nước, Tart Cherry, Đi bộ 15 phút) trong Kế Hoạch Sống Khỏe (`healthclues-user-goals`).
- **Quy Tắc Tính Sao Điểm Danh Chuẩn (`calculateStars`)**:
  - Số sao đánh giá ngày (1 - 5 Sao) tính theo tỷ lệ thói quen hoàn thành:
    * Hoàn thành 0 thói quen = 0 sao.
    * Hoàn thành toàn bộ thói quen (done === total) = 5 sao ⭐⭐⭐⭐⭐.
    * Hoàn thành một phần: `Math.min(4, Math.max(1, Math.round((done / total) * 5)))`.
- **Thêm Thói Quen & Thưởng EXP Bền Vững**:
  - Người chơi được quyền thêm thói quen mới thông qua Add Habit Modal. Mỗi thói quen mới thêm thành công sẽ được thưởng ngay +20 EXP vào tổng điểm và tăng biến đếm mục tiêu active.
  - Điểm danh hôm nay mang tính lũy tiến (idempotent), người chơi có thể cập nhật trạng thái trong ngày mà không bị nhân trùng điểm EXP bất hợp lệ.
- **Triệt Tiêu Session Expired & Tự Động Xác Thực Token**:
  - Mobile client và proxy server tự động duy trì session xác thực Supabase JWT hợp lệ; cấm hiển thị thông báo lỗi kỹ thuật `"Your sign-in session is invalid or expired."` đối với luồng trải nghiệm của người chơi.

---

## 2026-11-09 — Cycle 64: Mobile Onboarding Guard, Default Realm & Region Availability Rules

- **Mobile Onboarding Completion Invariant**:
  - Người dùng mới hoặc tài khoản đăng nhập chưa hoàn thành Quiz (`healthclues-onboarding-completed !== "true"`) khi truy cập app hoặc bất kỳ route con nào của `/(game)/*` đều bắt buộc phải được điều hướng sang `/(onboarding)/quiz`.
  - Không cho phép bỏ qua (bypass) Quiz Onboarding vào Game World mà không có sự xác nhận hoàn thành kế hoạch khởi đầu hợp lệ.
- **Vương Quốc HealthClues Mặc Định & Tạm Khóa Thung Lũng Giấc Ngủ**:
  - Vùng đất hoạt động ban đầu mặc định là Vương Quốc HealthClues (`healthclues-realm`), linh vật đồng hành là Bé Cáo Lumi.
  - Thung Lũng Giấc Ngủ (`sleep-valley`) được tạm khóa phục vụ bảo trì nâng cấp. Khi người chơi cố gắng kích hoạt, hệ thống chỉ hiển thị thông báo phản hồi (Toast), tuyệt đối không chuyển đổi cảnh quan hoặc ghi đè toạ độ không hợp lệ.
- **Hệ Thống Tọa Độ RPG 16:9 & Bảo Toàn Landmark Blueprint**:
  - Toàn bộ 7 landmark của HealthClues Realm (`camp`, `botanical`, `sanctuary`, `movement`, `library`, `boss`, `observatory`) tuân thủ tuyệt đối tọa độ 1600x900 của web game.
  - Toàn bộ EXP và vật phẩm thử thách chỉ ghi nhận qua session layer an toàn, không ghi dữ liệu giả mạo vào Supabase production.

---

## 2026-11-09 — Cycle 62: HealthClues Mobile RPG Visual Engine & Coordinate Boundaries

- **Widescreen 16:9 Coordinate Space & Blueprint Invariant**:
  - The mobile game world operates strictly on a 1600x900 coordinate space mirroring the web game `RegionMapScene.tsx`.
  - Coordinates for all interactive landmarks (Camp `[288, 423]`, Botanist `[1088, 414]`, Trail `[384, 648]`, Sanctuary `[1216, 648]`, Library `[384, 216]`, Boss `[784, 252]`, Observatory `[1344, 702]`, Central Hub `[768, 693]`) must align identically to preserve player spatial familiarity across platforms.
- **Real-Time Coordinate HUD & Proximity Threshold**:
  - The real-time coordinates HUD displays the player's exact position `X, Y` and dynamically calculates the current named zone using a 220px influence radius.
  - Active Talk HUD triggers automatically when distance to an NPC approach waypoint is less than 75px, preventing dialogue clutter when far away.
- **Reward Safety & Progression Isolation Boundary**:
  - EXP gained in onboarding quiz and interactive boss trivia is stored locally or proxied via the dedicated mock/session layer; under no circumstance may automated visual test scripts mutate production Supabase databases.

---

## 2026-11-08 — Cycle 39: Swiss Alpine Chalet Wellness Home & Admin Setup Positioning Rules

- **Admin-Authored Furniture Positioning & Homography Matrix Invariant**:
  - All furniture items in the player's Swiss Alpine Chalet must originate from the Admin CMS (`/admin/healthclues-home`) or the canonical catalog table `healthclues_wellness_home_catalog`.
  - Admin sets and saves the projective Homography 4 corners (`tl`, `tr`, `br`, `bl`), `user_scale`, and `z_index` depth layer. Client game views (`/play` and `HealthCluesWellnessHome`) must strictly apply these exact transformations via CSS `matrix3d(...)` to maintain flawless perspective alignment against room walls and floors.
- **Reward Catalog Synchronization Boundary**:
  - The RPG HUD Mystery Gift Box (`MysteryGiftModal`) and Daily Habit Pick 1 of 2 rewards award exclusively authenticated decorative items registered in the Admin-managed catalog.
  - When Admin saves or updates an item's position or metadata, changes persist in the database and dynamic catalog cache, instantly reflecting in player rewards without client app reinstall or code modifications.
  - Player state remains strictly isolated per user ID (`healthclues_wellness_home_player_state`); saving an admin position does not alter individual player unlock history.

---

## 2026-11-08 — Cycle 36: Modal Windows & Panels Bilingual Invariant Rules

- **Zero Cross-Language UI Leakage Invariant**:
  - All modal windows, popovers, and drawer panels (including Reminder Settings, Companion Email Preview, Companion Add-Habit, Player Profile Nickname, Region Entry, Day Detail Popover, and Living Village Chibi speech bubbles) must strictly respect the active session locale (`en` or `vi`).
  - No hardcoded Vietnamese string may appear when `locale === "en"`, and no hardcoded English string may appear when `locale === "vi"`.
- **Bilingual Check-in Metadata Invariant**:
  - The check-in note serializer and parser (`parseCheckinStars`) must symmetrically recognize both English (`[Daily rating: X/5 stars]`, `[Goal status: ...]`, `Reason not completed:`) and Vietnamese (`[Đánh giá ngày: X/5 sao]`, `[Trạng thái mục tiêu: ...]`, `Lý do chưa hoàn thành:`) tags without data corruption or loss of stars across language switches.

---

## 2026-11-08 — Cycle 35: Bilingual Knowledge & Checkpoint Empty-State Rule

- **Strict Bilingual Localization for Unreviewed Health Topics**:
  - When the Knowledge API (`/api/healthclues/knowledge`) encounters a topic or Quest without reviewed content rows, it must return explicit bilingual keys: `emptyReason` (English) and `emptyReasonVi` (Vietnamese).
  - The client UI (`KnowledgeJourneyPanel`) must evaluate `locale` and present solely the user's selected language. Displaying English fallback text to Vietnamese users or Vietnamese text to English users is prohibited.
  - The Boss checkpoint (`BossBattlePanel`) must localize all challenge prompts, cleared statuses, rewards, and empty states through `useHealthCluesLocale` and `tx()`.

---

## 2026-11-08 — Cycle 32: Synchronous Village Presence & Healthcare Privacy Boundaries

- **Strict Health Data Isolation over Realtime Channels**:
  - The presence channel transmits strictly cosmetic and spatial data: `user_id`, `nickname`, `avatar_key`, coordinates `x`/`y`, `facing`, `walking`, and transient `speech`.
  - Absolutely forbidden: Any transmission of quiz answers, medical concerns, medication names, personal care plans, adherence scores, or check-in reflections over presence channels.
- **Session Auto-Expiry & Presence Minimization**:
  - Presence heartbeats carry a 15-second TTL. Sessions inactive for longer than 15 seconds are automatically evicted from active queries.
  - On page unload (`beforeunload`), clients dispatch a beacon to immediately remove presence from the village.
- **Benign Social Interactions Only**:
  - In-village peer interactions are restricted to safe, pre-defined positive social gestures (`👋 Vẫy tay chào`, `✨ Cổ vũ sống khỏe`, `🍵 Mời tách trà ấm`). Arbitrary free-text chat between players is prohibited to prevent medical misinformation or harassment.

---

## 2026-11-07 — Cycle 31: Habit Management, Timezone Selection & Morning Reminder Rules

- **Universal Habit Customization (`+ Thêm thói quen`)**:
  - All authenticated players can add custom daily habits at any time via the companion dialogue interface, regardless of initial onboarding state or plan origin.
- **1-Click Habit Deletion & Confirmation Integrity**:
  - Players can remove any followed habit directly from My Journey via the `[Xóa]` pill action.
  - A browser confirmation prompt ensures against accidental deletion before persisting the update.
- **Timezone Standardization & Default Morning Reminders**:
  - Reminder preferences must present a standard timezone `<select>` dropdown with `Asia/Ho_Chi_Minh (Việt Nam UTC+7)` as the default.
  - Morning reminders default to `07:30`, explicitly labeled as the recommended time for morning habit kickoff and yesterday's check-in reflection.
  - Emails dispatched must feature personalized morning greetings and a direct action button linking to `/play` without bounce or authentication barriers.
- **Medical Disclaimer for Unreviewed Topics**:
  - The Knowledge API must strictly return fully localized Vietnamese notices when no peer-reviewed clues exist for a topic, explicitly stating that HealthClues does not substitute unrelated content to preserve clinical integrity.

---

## 2026-11-07 — Botanist Scientific Knowledge Library & RPG Card Presentation Rules

- **Two-Step Information Architecture & Visual Integrity**:
  - Overview cards in `WellnessEncyclopediaStation` must present high-level, scannable summaries: plant illustration, active bioactives, and studied mechanisms/effects with zero walls of dense text.
  - Deep-dive scientific information (full biological mechanisms, study limitations, safety/contraindications, PubMed citations) is strictly revealed inside `BotanicalArticleModal` upon user clicking `[📖 Đọc chi tiết]`.
- **Educational Scientific Integrity & Non-Prescription Invariant**:
  - The Botanist Garden (`WellnessEncyclopediaStation`) is strictly an educational library of peer-reviewed scientific studies with genuine PubMed PMIDs.
  - Absolutely forbidden: Any "Equip Herbal Remedy", "Bắt đầu điều trị", "Uống mỗi ngày", or adding herbs as tracked daily habits.
  - Every botanical article must feature a mandatory educational disclaimer banner, 12 standardized scientific fields, explicit evidence levels, and working PubMed external links.
- **Knowledge Book ("Sổ Tay Kiến Thức") Bidirectional Synchronization**:
  - Bookmarking an article from Botanist saves it to the user's saved list via `/api/healthclues/knowledge`.
  - Saved articles appear in the "Bài viết đã lưu / Saved Articles" tab in the Knowledge Book (`KnowledgeJourneyPanel`) with "Đọc lại" and "Bỏ lưu" actions.
  - Unsaving from either panel immediately synchronizes state across both panels and persists across reloads/sessions.
  - Bookmarked articles are separated from daily quiz clues ("Manh mối đã học") to preserve gameplay progression semantics.

## 2026-11-06 — Dual Auth (Google 1-Click + Email) & World Preview Map Invariants

- **World Preview Authentication Parity**:
  - The World Preview modal (`HealthCluesWorldPreview.tsx`) must provide identical authentication parity with `/play`: offering Google 1-Click (`signInWithOAuth("google", locale, "/play?activation=complete")`) and Email Magic Link (`sendMagicLink`).
  - Google 1-Click must be placed at the top of the modal with authentic Google 4-color branding for instant, zero-email-wait entry.
  - Consent checkbox in the modal defaults to `true` (`useState(true)`), eliminating button-disabling friction while preserving policy transparency.
- **Top Status Bar Quick Sign-In Invariant**:
  - The World Preview map must surface a `[Đăng nhập]` button in the top status bar so unauthenticated users can sign in directly without having to start from the beginning.
- **Guest `/play` Landing Preservation**:
  - Unauthenticated guests directly opening `/play` must not be auto-bounced to `/quiz?from=play`. `hasResumableQuizDraft` excludes `world_preview`, ensuring the HealthClues Welcome landing hero is displayed.

## 2026-11-05 — Authentication, Progression, Region Binding & Interaction Rules

- **Decommission of Quick-Activate Session Bypass**:
  - The `/api/healthclues/account/quick-activate` endpoint must permanently return HTTP 410 Gone.
  - Client DOM must contain zero instant activation shortcuts (`data-instant-activate-btn`, "⚡ Instant Activate & Enter World").
  - All account activations, E2E tests, and demonstrations must authenticate through genuine Supabase Auth magic links delivered via local Mailpit (`127.0.0.1:54324`).
- **Region & Companion Permanent Binding**:
  - Sleep Valley (`sleep-better`) is permanently paired with companion Luna; HealthClues Realm (`health-concern`) is paired with companion Lumi.
  - Region ID and Companion must persist across pending journey verification, magic link callback redirect (`/play?activation=complete&quest=...`), re-login, and browser reload.
- **Truthful Progression & Level Baseline**:
  - Brand new accounts must initialize at Level 1 with 0 / 50 EXP. Fabricating Level 4 or 180 EXP baselines is strictly prohibited.
  - Card 1 (Daily Care) must read confirmed goals from `wellnessGoals` and display `{completedCount}/{totalGoals} đã hoàn thành` or an honest empty state when no plan was confirmed. Hardcoded tasks (water, meal, walking) are banned.
  - The 7-day timeline strictly reflects daily check-in streak status, not distinct tasks.
- **Landmark and NPC Interaction Boundary**:
  - Clicking an NPC or landmark strictly triggers character pathfinding along designated walkable paths (`beginLandmarkTravel`).
  - No dialogue or interaction modal may open upon initial click (`modalImmediatelyAfterClick === false`).
  - Interaction panels open strictly when the character arrives at the destination and the player explicitly clicks the arrival action button ("Talk" for NPCs, "Interact" for landmarks).
- **Non-Blocking Advisor**:
  - AI Advisor generation must never block game progression. If the Advisor is loading, slow, or unavailable, a prominent "Skip plan and preview World" button must remain accessible so the player can immediately proceed into the World.

## 2026-11-06 — Zero-Friction Age Flow & Direct Authenticated Entry Rules

- **Zero-Friction Age Eligibility Invariant**:
  - The manual 13yo confirmation checkbox on Question 2 of Discovery Quiz is removed to eliminate user friction. Youth/adult eligibility is accepted implicitly by submitting account activation, while the educational safety disclaimer remains clearly visible.
- **Direct Authenticated Entry Invariant**:
  - Users returning with an authenticated session (from magic link or OAuth) must NEVER be routed to `goToResume` or prompted to retake the Quiz.
  - An authenticated session guarantees direct routing into the player's active World scene (`/wellness/healthclues/world`).

## 2026-11-05 — Discovery Quiz Age Confirmation Opt-in & Mobile Layout Rules (Superseded by 2026-11-06)
- **Breadcrumb Hierarchy Invariant**:
  - Region breadcrumb headers must not repeat product brand titles (e.g. `✦ HEALTHCLUES REALM`, never `✦ HEALTHCLUES · HEALTHCLUES REALM`).
- **Mobile Navigation Integrity**:
  - The shared 6-item game navigation must never truncate or squeeze text/icons to fit on narrow mobile screens. It must support horizontal scrolling with readable pill labels and ensure safe area bottom clearance for all page content.

## 2026-11-05 — Signed generated-goal title compatibility

For a generated goal with a verified Advisor proof, the displayed title may be either the localized model goal title (historical saved form) or the exact localized action selected from the proof. The selected `trackingDefinition`, option identity, goal ID, category, explanation, profile digest and HMAC must still match the signed claims. This allows concrete action titles without weakening ownership or tamper checks.

## Daily Companion Email Reminder & Smart Bundling Rules — 2026-11-04

- **Top Reminder Scheduler Invariant (`.hc-journey-reminder-banner`)**:
  - Located on top of "Hành trình của tôi" (`MyJourneyPanel`), immediately above the 30-Day Monthly Journey Map.
  - Integrates companion avatar (Lumi / Luna) with explicit opt-in toggle button (`[ Bật nhắc nhở hằng ngày ]` / `[ Đang bật nhắc nhở ]`).
  - Allows selecting local send time (e.g. `20:00 (Buổi tối - Khuyên dùng)`) and country timezone (e.g. `Asia/Ho_Chi_Minh (GMT+7)`, `Asia/Tokyo (GMT+9)`, `Europe/Paris (GMT+1)`).
- **1 Email/Day Smart Bundling Invariant**:
  - Daily Companion is the primary notification email, defaulting to exactly 1 email/day sent at the user's selected hour in their local timezone.
  - Smart Bundling combines:
    1. Active habit goals checklist (`Hôm nay bạn có N mục tiêu đang theo dõi`).
    2. Daily bite-sized knowledge tip from verified HealthClues Evidence Library.
    3. Return to game CTA button (`Quay lại thế giới của tôi 🧭`).
  - Milestone achievements and new discoveries are bundled into the daily email or optional weekly summary, preventing notification fatigue and unsubscriptions.
- **Privacy & Safety Boundary**:
  - Email reminders never reveal sensitive health conditions, clinical diagnoses, or private medical notes in subject lines or unconsented body copy.
  - Users can change their schedule, pause, or unsubscribe at any time directly in "Hành trình của tôi".

## 2-Choice Daily Check-in & Proportional Day Node Stars Rules — 2026-11-04

- **2 Binary Options Invariant**:
  - Daily habit check-in (`DailyCheckinDialog`) presents active habits directly with strictly 2 binary choices:
    1. `Hoàn thành` (`done`)
    2. `Không hoàn thành` (`not_yet`)
  - Intermediate mood surveys and 5-status tool options ("Skipped", "Don't Remember", "Not Suitable") are prohibited from the check-in modal.
- **Uncompleted Reason Note**:
  - When `Không hoàn thành` is selected on any habit, an inline text input must appear (`+ Lý do chưa hoàn thành:`).
  - The reason text is compiled into the check-in note upon save and displayed in the day detail popover.
- **Proportional 5 Stars Rating**:
  - Daily rating scales from 0 to 5 stars proportional to completed habits:
    - `done === total`: 5 stars ("Hoàn thiện hết (5 sao nhỏ)").
    - Partial completion: `Math.min(4, Math.max(1, Math.round((done / total) * 5)))`.
    - 0 completed: 0 stars.
- **Map Trail Day Node Stars**:
  - Completed day nodes render 5 small stars on top (`.hc-day-node-stars`).
  - Days with 5 stars render 5 golden stars + completion checkmark badge (`✔`).
  - Days with < 5 stars render proportional golden stars without the 100% checkmark badge.
  - Clicking any day node displays the star rating row, score caption, and any uncompleted reasons from that day's check-in.

## Daily Check-in Localization & Mobile Card Presentation Rules — 2026-11-03

- **Complete Localization Invariant**:
  - The Daily Check-in Dialog (`DailyCheckinDialog`) must strictly respect the player's active locale (`useHealthCluesLocale()`).
  - When `locale === "vi"`, all prompts, choices, headers, buttons, status options, and note labels must render in Vietnamese. No untranslated English strings may appear in the check-in modal.
  - Adding companion reflection to note must use localized prefix (`Chia sẻ cùng bạn đồng hành:` vs `Companion reflection:`).
- **Goal Details Redundancy Prevention**:
  - `goalDetails` must not duplicate duration/target values. If `targetValue` and `durationMinutes` represent the same time quantity (e.g. `20 phút`), it must be displayed only once in the badge row (`⏱ 20 phút · Hằng ngày · 30 ngày`).
- **Mobile Responsive Layout Standards (<= 640px)**:
  - Habit title and status badge stack vertically (`flex-direction: column`) so titles have 100% column width and wrap naturally without squashing into single-word lines.
  - Auxiliary station cards (`.hc-station-pill-card`) must flex-wrap gracefully across lines on mobile without harsh text ellipsis truncation (`text-overflow: ellipsis; white-space: nowrap;` prohibited on small screens).

## Interactive Monthly Wellness Journey Map Rules — 2026-11-03

- **Dynamic Month Computation**:
  - The monthly journey road dynamically computes total days via `new Date(year, month + 1, 0).getDate()`, correctly handling 28, 29, 30, and 31-day months.
  - Days are grouped into 4 week rows: Row 1 (days 1..7), Row 2 (days 8..14), Row 3 (days 15..21), Row 4 (day 22 to end of month).
- **Timezone Localization**:
  - Current date and "Today" determination strictly use player timezone (`Intl.DateTimeFormat("en-CA", { timeZone })`) to prevent misidentifying today across UTC boundaries.
- **Check-in History & Progress Math**:
  - Check-in dates are read from `worldData.checkins` using formatted local dates (`YYYY-MM-DD`).
  - Completed count is the intersection of days in the currently viewed month with player's actual check-in records.
  - Progress percentage is strictly calculated as `Math.min(100, Math.round((completedDays / daysInMonth) * 100))`. Never hardcode progress numbers or completed days.
- **Day Node States**:
  - `completed`: Local date exists in player checkin records (`✔` badge, green glow).
  - `today`: Date matches current player day (pulsing gold halo, direct check-in CTA in popover).
  - `future`: Date is chronologically ahead of today (dashed ring, upcoming status).
  - `unrecorded`: Past date without checkin record (neutral dark ring).
- **Active Goals Separation**:
  - Active goals section displays only player's actual chosen goals (`goals.filter(g => g.choice === 'active' || g.choice === 'saved')`).
  - Active habits feature 3D illustration or semantic icon, title, active status badge, and warm amber daily action box (`Cách thực hiện hôm nay:`).
- **Continuous Section Invariant**:
  - `document.querySelectorAll('[data-inventory-section]')` must strictly return `["checklist", "herbs", "practices"]`.
  - `checklist` = Active Goals section.
  - `herbs` = Equipped Herbs card.
  - `practices` = Equipped Practices card.

## Wayfinder's Quest Journal (My Journey UX Rules) — 2026-11-03

- **Quest Journal vs Daily Completion Distinction**: My Journey is an active goal tracker and quest journal, *not* a completion log or medical record. Confirming or displaying a goal does not mark it as completed or missed for the day. Daily completion recording is strictly isolated to the Daily Check-in system.
- **Continuous Section Invariant**: `document.querySelectorAll('[data-inventory-section]')` must strictly return `["checklist", "herbs", "practices"]`. All three sections coexist in a continuous scrollable canvas without tab splitting (`role="tab"` is prohibited inside My Journey).
- **Concrete Chosen Habit Outcome Display**: In active goal cards and followed goals lists, the card header displays the player's concrete chosen habit outcome (option title or tracking definition) directly (e.g. "Đọc sách 10 phút trước khi ngủ", "Uống ít nhất 6–8 cốc nước (≈ 1,5 – 2 lít) trong ngày") rather than generic umbrella titles ("Uống đủ nước", "Thói quen đọc sách trước khi ngủ").
- **High-Density Compact Presentation**: Active goal cards maintain an ultra-compact single-tier structure (~85px-95px height) with bottom action bar (`⭐ +20 EXP`, deduplicated cadence pill, `[✓ Ghi nhận]`, `Xem chi tiết`). Redundant action boxes and verbose descriptive text are kept in collapsible progressive disclosure to eliminate unnecessary vertical scrolling.
- **Non-Diagnostic Safety Footnote**: Every focus header and goal card must present honest non-clinical disclaimers ("Self-reported interest, not a diagnosis", "Your planned habits, not a completion log").
- **Honest Station State & Actionable Navigation**: Empty herb and practice stations must never fabricate fictitious recommendations or auto-equip catalog items. Instead, they present honest empty states with direct navigation buttons to their respective in-world NPC stations (Botanist and Wellness Guide).
- **Persistence Across Session Lifecycle**: Active and saved goals, including their semantic `iconKey`, custom notes, and duration metrics, are strictly preserved across page reloads, session reconnects, and locale toggling.

## Dynamic AI Habit Icon Mapping & Structured Schema Rules — 2026-11-03

- **Zero-Image-Gen & Zero-Network-Call Invariant**: Icons for AI-generated habits must strictly resolve from the pre-bundled, commercially licensed local asset registry (`gameIconRegistry.ts`). Never call external image generation APIs, web scraping, or remote icon CDNs at user login, habit generation, or goal activation time.
- **Single-Turn Structured Generation**: Gemini outputs the canonical `icon_key` and `category` in the exact same structured generation call as `title`, `relevanceReason`, `optionA`, and `optionB`. No secondary LLM calls are permitted to locate icons.
- **Server Validation & 4-Tier Fallback**:
  - The server strictly validates `icon_key` against `VALID_AI_HABIT_ICON_KEYS`. Hallucinated or malformed keys fall back immediately to the deterministic category fallback (`AI_CATEGORY_FALLBACK_ICONS[category]`).
  - Unmapped or unknown categories trigger client/server semantic text analysis.
  - Gibberish or unmatchable inputs safely fall back to `quests.target`. No broken image or missing icon may ever crash the client interface.
- **Client-Side Autonomy for User-Created Goals**: Player notes and custom goals are mapped via client-side semantic matching at moment of input without making any external Gemini API call.
- **Persistence Stability**: `iconKey` is permanently stored alongside the goal in `WellnessPlanGoal` and included in signed HMAC claims. Reloading or switching views retains the exact same icon key without re-evaluating or re-fetching.
- **Bilingual Identity**: Dot-notation canonical keys (`movement.walking`, `nutrition.fish`, `wellness.meditation`) serve both English and Vietnamese interfaces identically without translation-dependent icon divergence.

## Botanist player-facing content and UI state — 2026-11-02

- Botanist recommendations contain only botanical entries reviewed and eligible for the current Journey. Filter `demoOnly`/TEST ONLY and ineligible rows, including the legacy generic `PersonalizedSuggestions` nutrition fixtures. Do not re-label fixtures as reviewed recommendations or substitute unrelated nutrition items into this station.
- Empty eligibility is valid. Show an honest localized message; do not invent an item or enable Save/Equip controls. Discovery, saving to Collection and equipment remain separate state transitions under existing authenticated APIs and NPC-origin rules.
- UI locale is presentation only. A goal keeps its canonical ID, active/saved state, A/B choice and numeric target. Validated bilingual AI content uses its existing snapshot; user-authored Custom text stays exactly as entered.
- My Journey displays current confirmed goals and real equipped herbs/practices. Do not infer daily completion, mutate inventory on locale changes, or expose unsupported targets as player-facing state.

## Bảo toàn ghi chú mục tiêu qua xác minh email (2026-10-31)

- Handoff mã hóa hiện có phải giữ nguyên `originalNote` tùy chọn của mục tiêu tự tạo (tối đa 180 ký tự) sau kiểm tra kiểu/độ dài. Ghi chú là dữ liệu riêng của người chơi và không phải bằng chứng đã hoàn thành.
- Không suy ra target/lịch chưa được cung cấp, không tự kích hoạt goal từ ghi chú; chỉ Plan được người chơi xác nhận mới được lưu gắn với World. Callback yêu cầu email được xác minh phải trùng email nhận link.

## Quy tắc Wellness Plan Phase 10A (2026-10-30)

### Bổ sung kiểm soát topic chưa hỗ trợ — 2026-10-31

- Nếu Quiz topic không ánh xạ chính xác sang topic cấu hình, không lấy habit library hay Catalog để bù bằng mục tổng quát/không nhận diện. Trả danh sách rỗng và hiển thị coverage gap trung thực.
- Demo local có thể hiển thị một disclosure TEST ONLY chung; trạng thái review/evidence/safety/source chi tiết vẫn gắn theo từng mục trong phần mở rộng. Không xem source-grounded demo template là human-reviewed.
- Mục tiêu do người chơi tự viết dưới dạng một ghi chú ngôn ngữ tự nhiên vẫn là draft riêng tư nếu chưa có cấu hình tracking cần thiết; không suy diễn target/schedule và không kích hoạt từ ghi chú đơn thuần.

- Gợi ý không tự trở thành mục tiêu; chỉ lựa chọn Active do người chơi xác nhận mới vào plan. Save for later, skip, Collection, Backpack và Care Plan vẫn là trạng thái riêng.
- Không bịa gợi ý khi Catalog thiếu dữ liệu; nội dung demo phải giữ TEST ONLY / NOT HUMAN-REVIEWED. Không đặt mặc định 2.000 mL, giờ ngủ hay thời lượng đi bộ phổ quát.
- Cổng an toàn là hard gate: acute painful joint chặn mục tiêu vận động; restriction đã khai báo không thể bị checkbox xác nhận ghi đè; thiếu thông tin không được coi là an toàn; mục tiêu nước cần cá nhân tự xác nhận hướng dẫn phù hợp; không nhận mục tiêu đổi thuốc/ngừng rượu đột ngột. Không chẩn đoán hoặc thay thế chăm sóc chuyên môn.
- Mục tiêu tự tạo luôn USER-CREATED / NOT REVIEWED, private, không vào Catalog và không được quảng bá thành khuyến nghị đã duyệt. Tiến độ là self-report; ngày trống không phải thành công/thất bại và không tạo XP.
- Chỉ lưu sau consent, email xác minh và owner/World authorization. Không auto-equip.

Local reminder delivery in Owner Demo may target only the isolated Mailpit loopback endpoint, after explicit verified-account consent and atomic delivery claim. It uses a generic message, not health topic/method data. Production delivery must not be enabled by the demo flag and remains unconfigured.

## Current guide, profile and provider boundaries — 2026-10-30
Nicknames are optional, private, editable and do not require a legal name. Guide state resumes per authenticated World; skipping does not require equipment. Toolkit Summary must reflect actual saved Backpack (0–3), Collection (unlimited) and Care Plan state independently. Reminder consent is explicit and defaults off. Gout playbook context is self-reported and never diagnostic; acute painful-joint context must not surface activity as personally suitable. External NPC AI may only run after explicit user consent and server configuration/approval; missing provider configuration returns an honest unavailable state. Isolated fixtures stay TEST ONLY and never receive human-review status. Production delivery and real AI remain unverified; see the final acceptance report.
# Business Rules

## Universal wellness plan retrieval and scope (2026-10-30)

Acceptance evidence update: actual local Chromium testing on build 3260 confirmed that only explicitly configured/confirmed goals persist to separate authenticated Worlds; reload preserves revisions and cross-owner read/write attempts return 404. This does not upgrade TEST ONLY templates to reviewed content or establish production readiness.

One shared topic-configured habit library serves all supported topics; topic names do not imply content approval. Only applicable templates or exact-topic Catalog records may be retrieved. Unknown or missing review/content coverage must not be filled by unrelated habits. Demo templates are isolated TEST ONLY and are rejected outside Owner Demo. Safety and target validation are deterministic server gates; personalization in the current checklist is rules-based, not a live AI model. No herbs, supplements or detailed therapies appear in onboarding. Such in-game NPC discoveries require explicit user confirmation to create a new plan revision.

## Personalized recommendation rules implementation — 2026-10-30

Use only the authenticated owner World, existing Quiz/profile fields and active version of the RPG Catalog. Ranking is deterministic, versioned, explainable and does not fill a target count with unsupported content. Missing topic tags never match all Journeys. Safety is a hard eligibility gate; unknown is not “no”, and equipment validation repeats on the server. Distinguish reviewed editorial state, evidence class, Journey relevance, personal suitability, equipment eligibility and local TEST ONLY status. General education can remain browseable without claiming condition relevance. Daily feedback is self-reported and does not auto-change Backpack tools or grant health-related rewards.

## Region movement scope — 2026-10-29

The two playable region scenes use a small connected authored path graph. All clickable destinations must have a reachable approach point on that graph; failed routes never fall back to direct movement. Bridges are not required for gameplay. Quiz Journey context, content review/safety gates, owner-scoped persistence and server-authoritative rewards are unaffected.

### Shared scene layout — implemented and browser verified 2026-10-30

Sleep Valley and HealthClues Realm share one 16:9 world blueprint and logical landmark anchors: Camp 12/69, Garden 34/69, Activity 58/69, Sanctuary 86/69, Library 29/28, Boss 66/28, Rewards 90/28 (percent x/y). Foreground and branch routes are connected on walkable ground. For the three upper landmarks, actors approach from open ground at y=45%; landmark targets remain at y=28% so sprites do not walk over buildings. Their visible artwork remains region-specific. Exactly one selected compact context label may be open at once. Gameplay collision remains the authored route/path graph and is not pixel-accurate obstacle collision.

The Camp map button is a visual interaction target on the open foreground at 18.25%/75%; the player spawn and arrival approach remain at Camp 12%/69%. This separates its clickable surface from the player/Pet ground anchors while retaining the Camp landmark destination. The renderer must still be visually inspected at steady Pet-follow state; position-only tests are insufficient to approve sprite/background alignment.

## Local demonstration content boundary — 2026-10-29

- Rows authored as `test-fixture` / `hc-demo-*` are synthetic interface fixtures, not HealthClues-reviewed education or recommendations.
- Only the explicitly isolated owner demo may expose them, with a prominent TEST ONLY / NOT HUMAN-REVIEWED label. Other application environments filter them from reads and reject fixture IDs on learning/equipment writes.
- Their local Boss/Knowledge rewards may exercise mechanics only inside the isolated demo; they do not establish production content approval or validate health outcomes. Do not copy the fixture seed to hosted databases.

## 2026-10-30 owner-browser evidence update

On isolated build `app-build-final-a7`, the two playable scenes satisfy the current short-path rule in Chromium: seven valid approaches per region, Sleep path 564 / Health path 579 world units, successful no-bridge travel, rejected water destination without player displacement, and NPC interaction only after arrival. The local TEST ONLY Boss grants its server-validated Knowledge Key and World unlock once; the Rewards station displays the persisted `Sleep Valley Lantern`. This is test-fixture evidence only and leaves all reviewed-content and production gates unchanged.

Các số định lượng chưa được chủ sản phẩm chốt được gắn **Proposed**. Mọi ngày logic dùng local date theo IANA timezone của user; database timestamp lưu UTC.

## Quiz, profile và tri thức
| ID | Quy tắc | Ví dụ |
|---|---|---|
| HC-BR01 | V1 cá nhân hóa chỉ cho người xác nhận ≥18; trả lời No dừng, không lưu profile nhạy cảm. Skip với câu nhạy cảm không chặn quiz. | Tuổi chưa trả lời: cho xem nội dung chung, không tạo recommendation cá nhân. |
| HC-BR02 | Consent mục đích riêng: profile, analytics, community, email. Không suy ra một consent từ consent khác. | Tạo profile không bật email. |
| HC-BR03 | Profile là sở thích/tự khai; không gán bệnh/chẩn đoán. Lưu phiên bản và lịch sử thay đổi, cho sửa/xóa. | “Interested in gout information” không thành “has gout”. |
| HC-BR04 | Quiz thích ứng chỉ hỏi nhánh liên quan, tối đa 7 câu chuyên sâu và khoảng 12–20 tổng theo đề xuất quiz bank; skip/save progress không ghi câu trả lời giả. | Food allergy hold bật khi user khai dị ứng. |
| HC-BR05 | Recommendation chỉ từ content `reviewed + published/active + current version + not expired`; tối đa 3 ban đầu (confirmed). | Tạm lỗi catalog → không sinh nội dung thay thế bằng AI. |
| HC-BR06 | Matching lọc topic, preference, schedule, declared exclusions/safety flags; xung đột không rõ → loại khỏi gợi ý và báo “not enough information”. | Recipe có thành phần allergy conflict bị loại. |
| HC-BR07 | Mỗi đề xuất nêu “why”, content version, source/evidence, duration nếu xác minh, safety note, alternative/skip. | Không có match: library links và empty state. |
| HC-BR08 | Community narrative không phải knowledge source để chứng minh hiệu quả; không tự promote thành approved activity. | A ghi “felt better” vẫn là personal experience. |

## World, journey, activity, check-in
| ID | Quy tắc | Ví dụ |
|---|---|---|
| HC-BR09 | Một World chính/member; nhánh/journey nhiều và tồn tại lâu dài. Unique active world per user. | Thêm Sleep branch không reset Nutrition branch. |
| HC-BR10 | Journey status `draft, active, paused, completed, archived`; completion không xóa/edit lịch sử. Có thể tạo journey kế tiếp cùng branch. | 30-day challenge hoàn thành, World vẫn mở. |
| HC-BR11 | Activity states `planned, active, paused, completed, skipped, not_suitable, replaced, archived`; status đổi có actor/reason/time. | Not Suitable không kéo completion xuống. |
| HC-BR12 | Mọi user activity gắn source template/version hoặc `self_created`; self-created không mang approved badge, không vào auto-recommendation. | “Drink tea” do A tạo hiện nhãn personal. |
| HC-BR13 | Mỗi user tối đa một check-in/day/world/local date; check-in có thể chứa trạng thái nhiều activity và habit-to-reduce. Upsert/update giữ ID và revision. | UTC 17:00 vẫn cùng ngày địa phương theo timezone. |
| HC-BR14 | Không có check-in ≠ Not Done; hệ thống không tự sinh check-in. “Not Yet”, “Skipped”, “Not Suitable” là lựa chọn riêng. | Bận một ngày: timeline để trống. |
| HC-BR15 | Check-in tối thiểu khoảng 30–60 giây (Proposed): status một chạm, note/feelings tùy chọn, không bắt buộc đo lường. | Quick check-in chỉ đổi activity status. |
| HC-BR16 | Check-in có thể sửa; giữ audit/revision. Earn XP chỉ cho eligible transition đầu tiên/event key; sửa không thưởng lại. | Sửa Done thành Skipped không tạo XP mới. |
| HC-BR17 | Journal/check-in note mặc định private, không truyền qua public API/analytics/email. | Email chỉ deep-link, không quote note. |
| HC-BR18 | Schedule là đề xuất cho ngày/tuần; đổi schedule không viết lại lịch sử check-in. | Dời hoạt động Thứ 2 sang Thứ 4. |
| HC-BR19 | Pause giữ dữ liệu; hoàn thành hay bỏ giữa chừng không phạt, không tự gắn thất bại. | Return sau 6 tuần tiếp tục hoặc archive. |
| HC-BR20 | Activity replacement đóng version cũ tại thời điểm T, tạo activity mới; lịch cũ không đổi. | Thay bài thở bằng đi bộ nhẹ. |

## Community, rewards, notifications, operations
| ID | Quy tắc | Ví dụ |
|---|---|---|
| HC-BR21 | Journey mặc định private. Public projection field allowlist và consent/version explicit; alias không cam kết ẩn danh. | Không share medical context/raw notes. |
| HC-BR22 | Revocation gỡ khỏi public feed/search/cache và dừng notification; retained snapshots chỉ khi cần audit/legal, hạn chế truy cập/retention. | B đã follow vẫn không xem được sau revoke. |
| HC-BR23 | Share status tách khỏi journey. Xóa share không xóa journey owner hoặc B’s copied personalized journey. | B giữ bản cá nhân, attribution hủy/opaque theo lựa chọn. |
| HC-BR24 | Follow chỉ nhận update theo preference; không tự bật email/push. Block/report có hiệu lực ngay ở public interaction. | Follow in-app only. |
| HC-BR25 | Report risk claim “cured” → tạm ẩn pending triage; moderator giữ audit, không biến nội dung thành evidence. | Reviewer có thể redact/remove/appeal. |
| HC-BR26 | XP ledger append-only, unique `(user_id, source_event_id, award_type)`; balance là tổng ledger hoặc cache kiểm tra được. | Request retry không cộng lần hai. |
| HC-BR27 | Proposed XP: valid first check-in +10/day; learning card +2/resource/day cap 2; reflection +5/week; accepted milestone reward one-time bonus. Không thưởng mức hoạt động/tần suất thảo mộc, health outcome, public share. | 4 activities trong 1 check-in vẫn +10. |
| HC-BR28 | Day 7/14/30/60/90 milestone (confirmed examples) dựa elapsed local calendar day từ journey start; ngày đến hạn không bắt check-in. | Day 7 reward có thể nhận dù không check-in ngày 7, nếu eligibility khác được đáp ứng. |
| HC-BR29 | Milestone eligibility đề xuất: milestone reached theo elapsed time; reward chỉ claim once, không yêu cầu streak; daily check-in count chỉ phản ánh ngày có check-in. | Check-in 5/7 vẫn tới ngày 7, không bị reset. |
| HC-BR30 | Email phải opt-in riêng; frequency/timezone/local send window tùy user. Proposed default once/day enabled only after opt-in. | Không email khi unsubscribed/paused. |
| HC-BR31 | Job idempotency theo `(user, local_date, template)`; quiet hours và DST xử lý bằng IANA zone, xử lý ambiguous/nonexistent time theo policy gửi lần hợp lệ kế tiếp. | DST skip 02:30 → 03:00 local. |
| HC-BR32 | Unsubscribe token signed, scope reminder; delivery bounce/failure retry giới hạn; failure không ảnh hưởng journey. | 3 transient retries proposed, sau đó pause + status. |
| HC-BR33 | AI trả lời bằng approved library + user-owned history có quyền; nguồn/caveat hiển thị. Không chẩn đoán, liều lượng, kê đơn, suy diễn outcome; uncertainty → từ chối an toàn/đưa nguồn. | Không đề nghị copy A’s frequency. |
| HC-BR34 | Reviewer publish phải xác minh claim↔source, population, safety, conflicts, version/review date; material edit làm mất eligibility cho tới review lại. | Đổi title claim cũng re-review. |
| HC-BR35 | Admin privilege tách reviewer/moderator/operator; audit actor, action, reason, old/new state. Không dùng shared secret như user identity tương lai. | Moderator không sửa reward config. |
| HC-BR36 | Aggregate analytics chỉ dữ liệu tối thiểu; ngưỡng cell suppression Proposed n<10; không dùng sensitive data để quảng cáo. | Không hiển thị topic nhỏ có thể nhận diện. |
| HC-BR37 | Ebook funnel chỉ truyền source/referral attribution cần thiết và có consent; download/email consent không tự bật HealthClues reminders. | Ebook lead tự opt-in newsletter độc lập. |
| HC-BR38 | Deletion khóa account access ngay; xóa/anonymize profile, private journal, reminders, follow, share theo policy; giữ audit tối thiểu đã khử nhận dạng khi pháp lý cần. | Public projection takedown ngay, backup TTL công bố trước. |
| HC-BR39 | Retention Proposed: soft-delete 30 ngày recovery, hard purge primary data trong 30 ngày sau, encrypted backup expiry ≤90 ngày; pháp lý/security hold tách riêng. | Chốt policy/privacy review trước release. |
| HC-BR40 | Timestamps UTC, business date theo user timezone snapshot tại thời điểm check-in; timezone change không đổi ngày quá khứ. | User bay múi giờ mới: check-in ngày mới theo zone hiện tại, duplicate rule vẫn rõ. |

## Wellness Toolkit — HC-F016
| ID | Quy tắc | Ví dụ |
|---|---|---|
| HC-BR41 | Mọi catalog object được chuẩn hóa có canonical `catalog_item_id`; identity không suy ra từ journal text. Item version bất biến; sửa nội dung tạo version mới, ID chỉ đổi nếu khái niệm thực sự khác. | Rau diếp cá là một item; không gộp với recipe cụ thể. |
| HC-BR42 | `Wellness Catalog Item` mô tả cái gì (ingredient/food/tool/topic); `Usage Method / Activity Template` mô tả cách làm (recipe/routine/movement/breathing/lifestyle). Method liên kết một/nhiều item; item có thể có nhiều method. | Ingredient và món recipe có IDs riêng và relation `uses_item`. |
| HC-BR43 | Review status, evidence, safety, provenance, version và expiry thuộc catalog/method version. Chỉ approved+active+unexpired method đủ điều kiện recommendation hoặc “reviewed” badge. | Item thông tin chung không tự duyệt mọi recipe sử dụng nó. |
| HC-BR44 | `My Toolkit` entry là lựa chọn riêng theo user và có state `in_collection`, `equipped`, `paused`, `archived`; một tool có thể ở collection mà chưa trang bị. | User lưu breathing method nhưng chưa schedule. |
| HC-BR45 | Toolkit entry gắn optional branch/journey, schedule version, start/effective dates và change history. Equip/replace không xóa hoặc viết lại usage records quá khứ. | Đổi lịch walk từ 2 slot xuống 1 không sửa ngày trước. |
| HC-BR46 | Daily usage record tham chiếu toolkit entry + Catalog Item ID/version và optional method/activity-template ID/version; ngày local bắt buộc, time/occurrence/count lượt thực hiện tùy chọn tự khai, status tách khỏi count. Count là số lượt/repetition, không phải khối lượng nguyên liệu/liều. Nếu lưu nhiều occurrence, không đồng thời cộng thêm total count cho cùng lượt. Không có record ≠ không sử dụng. | Một ngày user có thể log 0/1/2 lượt đi bộ hoặc chỉ “done”; không tự suy ra lượng rau. |
| HC-BR47 | Usage count không bắt buộc; không thu liều/khối lượng như một mục tiêu gamification; không giới hạn XP/reward theo số lượt/repetition/frequency hoặc claimed efficacy. UI nói rõ count là tự báo cáo; không gợi ý tăng dùng. | 2 walks/day không nhận XP hơn 1 walk/day. |
| HC-BR48 | Notes tùy chọn private; structured usage chỉ có thể thành public khi owner chọn cụ thể item/method, timeline range/status/date granularity và consent version. Exact timestamp/count không public mặc định; không public location/health outcome. | A share selected item + monthly timeline, giữ note private. |
| HC-BR49 | Community matching dùng canonical item IDs; method ID match riêng; filter mục tiêu/sở thích chỉ dùng public facets consented. Aggregate counts/facets dưới ngưỡng bị suppression; một journey được owner chủ động publish rõ item/method có thể hiện qua public link/card nhưng không kèm số lượng nhóm. Không truy vấn private profile. | “Same ingredient” không đồng nghĩa “same recipe”; không hiện “1 người dùng” nếu cohort nhỏ. |
| HC-BR50 | Self-created tool có user-scoped ID, `source=personal`, `review_state=unreviewed`; chỉ xuất hiện trong chính Toolkit/World và private usage. Không được quảng bá thành catalog item hoặc recommendation công khai trước review. | User tự tạo “evening stretch” để ghi riêng. |
| HC-BR51 | Catalog proposal bắt buộc normalize name/category/type, tìm exact/near duplicates, so synonyms/locale/related IDs; reviewer chọn link existing, create new canonical ID, merge alias hoặc reject. Không cấp ID chuẩn tự động từ user text. | Tên khác địa phương được link synonym nếu cùng khái niệm. |
| HC-BR52 | Toolkit XP chỉ thưởng một lần cho eligible check-in, học tập hoặc reflection event theo BR26–29; không thưởng số tools equipped, số lượt/count/amount, hiệu quả, công khai hay tăng cường độ. | 2 lần đi bộ trong ngày vẫn cùng một eligible daily check-in award. |

## Onboarding Slots & Combo System — HC-F017
| ID | Rule | Example |
|---|---|---|
| HC-BR53 | Core onboarding target 8–10 questions, roughly six foundational plus 2–4 adaptive. Preserve existing bank; later relevant triggers may ask more. | Skip sensitive answer; filter affected tools. |
| HC-BR54 | Exactly three slots: consume_eat, reduce_avoid, do_practice. Max one initial tool per slot; zero through three valid. No auto-equip or required herb. | Skip all and create World. |
| HC-BR55 | Validate item/method compatibility with slot at preview and save. Reduce/Avoid is a neutral self-chosen target, not medical instruction or moral score. | Recipe cannot enter do_practice. |
| HC-BR56 | Recipe Combo is a recipe Catalog Item plus reviewed versioned method and many ingredient item/version relations. | Recipe retains every canonical ingredient ID. |
| HC-BR57 | Journey Combo is a versioned preset of distinct components assigned to typed slots, not a single tool. | One component may fill each slot. |
| HC-BR58 | Review/evidence/safety applies to exact component and combo versions. Recheck at preview/confirmation; stale/ineligible items follow reviewed partial policy. Unreviewed treatment/herbal combos are not recommended. | Expired item omitted only if partial acceptance approved. |
| HC-BR59 | User explicitly confirms components; support accept all/partial, replace, skip component and skip combo. Accepted items create separate Toolkit Entries. | Accept recipe and walking, skip reduce/avoid. |
| HC-BR60 | Match only consented profile fields and slot-eligible reviewed items; show reason per component. Never infer efficacy or force herbs. | Explain time fit, no treatment claim.

## Owner demo authentication — 2026-10-29

| ID | Rule | Example |
|---|---|---|
| HC-BR61 | Demo Auth and player-data writes must use a verified isolated local/test Supabase project; never inherit production endpoints or credentials. Account activation requires provider-confirmed email, explicit consent remains separate, pending onboarding is short-lived/encrypted and bound to the confirmed account, and World creation is idempotent per owner. | A local Mailpit confirmation resumes the matching Quest; a second account cannot read or adopt the first account's World. |
# Quy tắc sản phẩm được chốt — 2026-10-28

- Overworld giữ tám vùng/ID ổn định; chỉ `sleep-better` (Sleep Valley) và `health-concern` (HealthClues Realm) được bắt đầu Journey. Sáu vùng còn lại hiển thị Coming Soon; API cũng phải từ chối tạo Journey mới ở đó. Availability nguồn: `src/features/healthclues/region-availability.ts`.
- Sleep dùng Pet Luna; HealthClues Realm dùng Lumi. Quiz ban đầu (tối đa 10 câu theo release đã duyệt) là nơi xác lập Journey. Health topic là self-reported interest/goal, không phải xác nhận diagnosis và không được hỏi lại khi vào Realm.
- Tools chỉ từ Catalog đã review, phù hợp consent/safety; slot hiện giữ Consume/Eat, Reduce/Avoid, Do/Practice; equip 0–3 là tùy chọn, không tự trang bị.
- Duyệt nội dung y tế/thảo dược, XP/rewards phía server, owner scoping, consent, private Journal và release gates vẫn là bắt buộc. Kiểm tra dữ liệu hiện có tại `CURRENT_STATE.md`; schema chưa có Journey context riêng cho concern như Gout.


### Milestone 09B implementation evidence — 2026-10-29

The isolated owner browser shows all eight Overworld regions, with only Sleep Valley and HealthClues Realm enterable. HealthClues Knowledge selection now requires an exact normalized match to the authenticated owner's saved profile topic; unrelated reviewed content is not used as fallback. If no matching reviewed content exists, the map shows an unavailable/empty state. Local Gout journey testing confirmed this behavior. This does not establish diagnosis, recommendation eligibility, or production-reviewed content availability. Evidence: `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## BR09B First-time Guide and Backpack presentation — 2026-10-29

The Pet guide is optional; skip/close never blocks exploration or safety information. The active region is derived from the saved Quiz/Journey context. Tutorial persistence contains only a version and stage, scoped to the authenticated owner and their World; it must not copy health answers into tutorial state. Only active, reviewed Catalog item versions whose reviewed provenance topic tags match the current Journey can appear in personalized tool discovery. Existing eligibility, contraindication, interaction, consent and equipment-slot checks continue to apply. A client Equip action is a request only; the existing server validates and records the equipment. No eligible reviewed item means zero items and no blocking requirement. No automatic equip, fixed herb count, cure claim, fabricated reference or unreviewed usage instruction is allowed.

## 09C ? private care records and station discovery

- Encyclopedia publication status, evidence classification, personal suitability and player-reported use are distinct fields/concepts. The station list uses only active, current, editorially reviewed Catalog records with tags matching the saved Journey; a review label does not claim efficacy.
- Save to Collection is not use or equipment. Track My Use requires explicit player confirmation and is stored as USER-REPORTED. Adding to Backpack calls the existing server-side equip validator; a client cannot grant eligibility.
- User-created method and medication records remain private Care Plan data, separate from Collection/Backpack/Journal. Every create requires an acknowledgement. Medication records only transcribe what the user enters; HealthClues does not calculate doses, infer timing, recommend medicines, or award XP for logging.
- Care Plan self-reports create no game rewards and do not assert adherence or treatment effect. Pausing/deleting records is available to the owner. Data access requires a verified account and a World owned by that account.
- No reviewed matching entry means an honest empty state; unreviewed or unrelated entries must not be substituted.

## 09D-R region navigation boundary (2026-10-29)

Region movement is presentation/navigation only. It must not grant XP, unlocks, equipment or saved progression. A landmark interaction is available only after reaching its configured approach point. An unreachable destination must fail closed; never teleport or use a straight-line fallback through terrain. Existing server-side authorization and reward rules remain authoritative.

## Optional Pet reflection boundary (2026-10-29)

Daily Pet reflection prompts are optional and limited to two in this implementation. Skipping is neutral. Prompt answers are transient in the interface and are copied into the private check-in note only after an explicit player action; the note remains editable before save. Do not infer a health outcome, medication adherence, or causal effect from these answers. Existing check-in reward rules are unchanged and must never reward medication use, herb consumption, or reported symptom improvement.


## Region movement and interaction note — 2026-10-29

Movement is not a reward action: walking, viewing, or opening a navigation debug overlay awards no XP, Keys, or World progress. A destination must be reachable within the authored region walk network; route failure must never fall back to straight-line traversal or teleportation. NPC Talk is available only at its validated approach point. Navigation changes do not alter Journey, consent, equipment, reward, or account ownership rules. The local browser regression also exercises same-World reload and cross-account privacy; see the latest final-game report.

## Learning Skills and owner-demo mini-games — 2026-10-29

- Four shared learning Skills use keys `health_knowledge`, `natural_nutrition`, `movement`, and `mind_sleep`; labels are Novice, Explorer, Learner, Scholar, Master. A Skill point comes from a unique persisted learning completion (a reviewed clue discovery or a unique learning-game completion). Health outcomes, medication/supplement use, check-in frequency, and repeated attempts never grant Skill progress.
- Current level thresholds are derived from the persisted unique-completion count: Novice 0, Explorer 1, Learner 3, Scholar 5, Master 8. Level is computed on read; completion rows are the durable source of truth. Levels are game progression only and do not indicate clinical knowledge or competence.
- Four non-clinical mini-games are available only in the isolated owner demo and visibly labeled TEST ONLY / NOT HUMAN-REVIEWED. The server allowlists IDs and answer sequences and awards at most one +3 XP completion per user/game through the existing idempotent XP ledger. Wrong answers do not persist or award XP. These fixtures are not editorially approved and must not be enabled in production.
- The local-only migration adds a constrained Skill key to Knowledge clues and owner-readable completion rows. Never apply this migration outside isolated local Supabase.


## Backpack and demo eligibility addendum — 2026-10-30

- Each World has three independent equipment positions. `slot_key` remains the action category; multiple tools of one category may occupy distinct positions. Replacement requires an explicit position and confirmation. Equip awards no XP.
- TEST ONLY demo eligibility is enabled only by isolated owner-demo server logic and service-role RPC. `test-fixture`/`demo_only` provenance remains distinct from human review/evidence status. Production eligibility is unchanged.
- Private item tracking accepts `unsure` as a distinct report. Missing entries remain missing; they do not mean skipped.
# Personalized suggestion rules — 2026-10-30

- Rank the existing active reviewed Catalog deterministically by saved topic, explicitly selected goals/preferences, practical time, current selections and explicit dismissals. Reasons must name only those stored inputs and Catalog metadata.
- Safety is a hard gate. Quiz safety answers are stored as `yes`, `no` or `unknown`; missing answers and legacy profiles stay `unknown`. Acute painful-joint context blocks a personal movement suggestion for a Gout Journey. Unresolved medication context blocks botanicals marked as requiring it. General education may remain visible with limits.
- An editorially reviewed item is not proof of efficacy. TEST ONLY demo status does not confer review or personal suitability. Tomato and other ordinary-food entries remain education-only. A player chooses; no automatic equipment or XP is granted for selecting/using a suggestion.
- Server routes verify the authenticated owner and World. The toolkit endpoint re-evaluates explicit personalization metadata and safety before demo recommendation equipment; the demo flag is derived server-side from loopback configuration, never a client parameter.

## World entry and Plan visibility — Master Prompt 11 (2026-10-30)

- First-entry guide state belongs to the already authenticated World and uses the existing guide endpoint/stages. A guest preview must not complete or mutate the permanent World tutorial; returning/skipped players are not forced through it again.
- The tutorial may display only goals from the current saved Plan. A self-reported Journey is not a diagnosis, and selected goals are not evidence of action, completion, efficacy or clinical improvement. When the Plan is empty, the Pet offers free exploration.
- Quests, the tutorial CTA and Adventure Camp link to one canonical Plan. Edits append a revision; removal is explicit; a newly entered personal note is user-created/unreviewed and saved inactive. Configuration alone does not activate it; the user must explicitly resume it. No new collection, daily-care or goal table is created.
- World navigation stays on the existing authored safe route graph. NPC interaction requires arrival; closing an interaction does not teleport or otherwise change the player's World position. Tutorial/objective guidance is optional after onboarding and grants no XP.

## Quests read and recovery boundary — 2026-10-31

- The canonical Plan is the highest confirmed revision in the authenticated profile whose `worldId` equals the current owned World. A Plan from another World or an unconfirmed Quiz draft is not active for Quests.
- A completed Quiz profile without a confirmed Plan may be reused to present suggestions. Suggestion retrieval, viewing, skipping, or closing creates no goal and no Plan revision. Only goals explicitly confirmed by the player are persisted; `active`, `saved`, and `skipped` remain distinct choices.
- During Plan loading or a load error, do not present a false “no Plan” state. The existing authenticated Plan API continues to enforce owner and World authorization; no schema migration is required.

## Gemini Advisor provider boundary — 2026-10-31

- Gemini receives the selected concern and short Discovery answers only through the server. The adapter is enabled only in loopback Owner Demo and reads `GEMINI_API_KEY` server-side.
- The current simplified response is up to six relevant bilingual goals. Each has title, short reason, and two distinct implementation options A/B. Gemini does not author IDs, database/catalog references, target columns, or safety declarations. The server assigns stable goal IDs, maps selected options into the existing Plan contract and revalidates before persistence.
- Recommendations should connect to reported habits, be practical and meaningfully different at A/B levels, and use modest quantities only when context supports them. Everyday low-risk experiments may include reasonable numbers; do not treat them as universal medical thresholds. Reject dangerous actions and unsupported high-risk medical quantities.
- The UI supplies the include checkbox, Custom option and confirmation. Viewing, skipping or deselecting suggestions does not persist them. Only explicitly confirmed selections enter the owned World's Plan; zero goals are valid.
- No provider configuration, provider failure, malformed JSON or failed validation means `AI_UNAVAILABLE` with no hidden fallback. A test fixture stays visibly `SYNTHETIC TEST ONLY`, cannot be described as Gemini output, and may persist only through the isolated Owner Demo's signed test path. The simplified live Gemini request is configured for one SDK attempt.
- The integration is not production enabled. Fixture tests prove contract compatibility only; they do not establish live inference success or recommendation quality.

## My Journey summary — 2026-10-31

- The region-level My Journey control is navigation to a read-only summary of the signed-in owner’s current World, Quiz profile and latest confirmed Plan revision; it is not a second Plan store.
- Quiz focus may be shown without a confirmed Plan. Suggested goals, drafts and skipped suggestions must never be presented as active or saved goals. The empty state may link to reuse saved Quiz suggestions without requiring another Quiz.
- Active, saved-for-later and user-created personal goals remain distinct. User-created goal text is private and shown only from that World’s confirmed Plan. View Full Plan routes to existing Quests and uses its existing owner/World authorization.


## World tour truth and state — 2026-10-31

Tutorial content is descriptive navigation, not a wellness recommendation or Plan mutation. Only current authenticated World data may appear in My Journey. Quiz suggestions and drafts are not active goals; no-plan recovery must not fabricate or confirm goals. Tour skip/completion is persisted for the account/World and current guide version. Replay is explicit. Spotlighting an NPC cannot teleport the player, open a proximity-gated interaction remotely, or mark the NPC visited. The optional Botanist introduction must not imply treatment efficacy or automatic equipment.

## My Journey inventory invariants (2026-10-31)

- Chỉ goal đã lưu trong Confirmed Plan mới hiện như goal; active/saved giữ đúng trạng thái. Không tạo checkmark, streak hay hành vi đã hoàn thành từ kế hoạch.
- Chỉ status `equipped` xuất hiện trong inventory. Save/Collection không tự trang bị.
- Herb cần record được chọn từ Botanist và catalog phân loại herb/botanical; practice cần nguồn Wellness Guide và phân loại practice hợp lệ. Server giữ eligibility, owner, capacity và station checks.
- Demo fixture luôn có `TEST ONLY`; không tuyên bố human review. Thiếu thông tin an toàn thì không nới điều kiện để lấp inventory.
- Không có herb hợp lệ thì hiển thị empty state, không bịa item.

## My Journey guided-section copy — Prompt 14 (2026-10-31)

- Khi tutorial đang mở My Journey, Luna/Lumi giải thích lần lượt Wellness Focus, Daily Checklist, Herbs Equipped và Practices Equipped. Mỗi bước chỉ nhấn sáng đúng một section; ba section còn lại và World map được dim, nhưng không section inventory nào bị ẩn/thu gọn.
- Pet bubble phải liền trước section target và không che chữ. Khi viewport thay đổi, cuộn để Pet bubble cùng toàn bộ target nằm trong vùng panel nhìn thấy trên mobile. Lớp phủ World khóa tương tác map trong lúc focus; đóng/tiếp tục tour trả lại điều khiển bình thường.
- Không có Confirmed Plan thì không gọi Quiz suggestions là goals. Không mô tả herbs/practices như treatment, prescribed use, hoặc completed care.
- Các lời thoại chỉ trình bày dữ liệu Quiz/Plan/equipment vốn đã được phép hiển thị cho owner của World hiện hành; không thêm persistence, public projection hay analytics.

## Player locale is presentation-only ? 2026-10-31

English and Vietnamese must use identical Quiz question IDs, answer IDs, scoring, branching, safety gates and profile persistence. Translated labels never replace canonical stored answer values or goal identifiers. Changing locale must not clear or create a Plan, World, equipment, progression or tutorial state. Locale is not inferred from IP/browser locale. AI requests receive an explicit locale; response schema and canonical IDs remain language-independent. Clinical evidence, source citations and safety meaning must not be inaccurately translated.

### Region navigation and NPC shell localization — 2026-11-02

Region landmark labels, NPC names and authored greetings, NPC approach aria-labels, proximity Talk/Interact controls, and movement help may use the selected player locale. This is presentation-only. Catalog names/descriptions, evidence/source records and NPC provider responses are not implicitly translated or approved by translating the shell; preserve their source-language and review disclosures. Do not change region IDs, safe-path/proximity checks, Quiz values or saved World state when locale changes.

## Locale-safe Advisor and Plan display — 2026-10-31

The Quiz and goal identifiers are language-independent. Locale affects display and the server-side Advisor prompt only. A player preference must remain owner-scoped and cannot be changed by another account through a World ID. Technical provider categories are diagnostics, not UI text. No confirmed goal is created by localization.

## Personalized Wellness Plan — Master Prompt 16 (2026-11-01)

- Gemini may propose ordinary lifestyle habits without a pre-existing Catalog row. This supersedes the earlier all-Catalog source gate for this post-Quiz plan only; it does not make TEST ONLY Catalog entries approved or eligible.
- The server supplies an allow-listed set of public guidance references. The model may return source IDs only, never arbitrary citations. Server schema, topic, and safety validation runs per goal and may omit one invalid goal without discarding valid siblings.
- Each accepted goal has exactly two distinct options. Neither is preselected. The player may select A/B, enter one custom goal, or skip. Only explicit selections enter the existing Confirm Plan request; alternatives are not persisted as goals.
- Current Quiz profile has no structured food/activity/sleep/hydration quantity baseline. Numeric targets and unverified target metadata are rejected. Do not infer red-meat frequency, inactivity, or fluid needs from a topic alone.
- Medication changes, treatment, herbal/supplement claims or doses, restrictive diets, fasting/dehydration, alcohol-withdrawal plans, and movement with unresolved acute pain/restriction are excluded from ordinary generation. Sources and model self-declarations do not replace server safety checks.
- Suggestions are optional and are not diagnoses, treatment, or proof of benefit. Custom goals remain user-authored and pass the existing independent risk assessment.
- HTTP 402/BILLING_REQUIRED is a provider blocker. Do not retry it automatically, substitute fixtures as AI, or claim inference/schema acceptance without a real response. Any test fixture must be explicitly marked synthetic/test-only and never emitted as genuine AI output.
## Master Prompt 17 — new-player guided discovery and plan selection (approved, implementation PARTIAL, 2026-11-01)

- New players choose one self-reported concern/focus, then receive a small number of concern-relevant, adaptive multiple-choice questions. Do not show the fixed 96-question bank on the new-player path; retain it for legacy profiles and rollback. Do not infer diagnosis or invent answers.
- Existing verified email activation remains mandatory where account activation is required. The journey profile is bound to the authenticated account/World; no preference or health-profile cross-account reads/writes are allowed.
- Enter the selected existing playable World before displaying generated Plan recommendations. Keep region IDs/artwork and the six Coming Soon regions unchanged. Plan presentation must not overlap the existing Pet/My Journey tour.
- Every generated suggestion has an independent unchecked-by-default include checkbox, two alternative implementation radio options and one custom option. Checkbox state and implementation mode are independent; no goal is active until the user confirms. Zero selections, skip, and continue without a Plan are valid.
- Do not render synthetic fixtures as live Gemini output. On provider failure, preserve World access and show a localized unavailable state. Persist only selected, validated, explicitly confirmed goals through the existing owner/World Plan API. Keep user-authored custom text unchanged and subject to existing safety validation.
- Specialized/herbal/treatment/medication/supplement claims remain outside ordinary goal generation and subject to their stricter existing gates.
## MP17 new-player profile and plan rules — implementation delta (2026-11-01)

- A new journey requires the explicit 13+ confirmation and one canonical focus ID. A specific concern is user-reported detail, not a diagnosis.
- Adaptive answer IDs/labels are stored together in the optional `adaptiveDiscovery` profile extension; they do not populate the legacy 96-question keys.
- The existing verified-email and owner-scoped profile/World boundary remains authoritative. Pending journey data stays in the existing short-lived encrypted handoff.
- AI-generated goals are not auto-selected. Existing Plan Builder include-checkbox and A/B/custom mode are independent. Only explicit confirmation can persist selected goals; zero selection is allowed. The current provider 402 does not justify serving synthetic recommendations.
- These are code-level changes with full authenticated lifecycle verification still pending. Do not treat this paragraph as a PASS claim.

## Simplified Gemini Wellness Checklist — 2026-11-02

- Send the selected self-reported concern and short onboarding answers as structured input. Gemini may return zero to six suggestions, each containing bilingual title, short reason, and two distinct implementation options (A/B). It must not return IDs, category, targets, schedules, citations, checkboxes, safety declarations, or the Custom choice.
- The server assigns a UUID-backed goal ID and concern-derived Plan category, applies schema/relevance/safety checks, and signs the selected option. The ID is independent of displayed language and is retained by the existing Plan persistence contract.
- The UI owns the include checkbox and optional Custom text. Nothing is saved until the player confirms; deselected alternatives are not persisted. Ordinary lifestyle ideas do not need a catalog entry or source ID.
- One response includes EN and VI wording for the same recommendations. Language changes select the existing wording and do not invoke Gemini again; the local server reuses the signed response for up to 25 minutes, while explicit retry can request a fresh response.
- No fixed habit list, universal quantity, or inferred target is accepted. Clearly dangerous actions, medication/treatment instructions, supplements/herbs, fasting/dehydration and similar unsafe content are rejected. Keep the concise disclaimer that this is not diagnosis or medical advice.
- This rule supersedes the earlier source-registry requirement for ordinary Gemini checklist suggestions only. Existing Quiz compatibility, World/region rules, Pets, My Journey ownership and confirmation/persistence boundaries remain unchanged. Offline synthetic verification is recorded in `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`; no live inference was made for this contract change.

## MP17 persisted AI locale display and legacy preservation — 2026-11-02

- A newly confirmed AI goal retains one canonical ID and its validated bilingual title, relevance reason, Option A and Option B title/action in its existing Plan JSONB snapshot. Display the selected locale from that snapshot; locale switching must not regenerate recommendations, change the ID, selected level, target value/unit, active/saved choice or create duplicate Plan records.
- Display only the chosen A/B implementation in My Journey for that AI goal. Custom inside an AI card persists as a separate `user_created` goal with a new UUID and exact user-authored text; the Plan contract does not currently link it back to its source recommendation. Standalone Add My Own Goal remains a distinct user-authored operation.
- Never translate user-authored Custom text or personal notes without consent. For historical AI records missing the original bilingual snapshot, preserve and display the stored content unchanged; do not fabricate translation or regenerate a new recommendation.
- Legacy World reads must tolerate stored check-ins and usage rows matching the actual database table schemas. An existing `slot_key=practice` can preserve a legacy Practice presentation if the optional `discovery_station` is absent; do not rewrite the saved entry just to render it.

## AI-generated lifestyle quantities — 2026-11-02

Practical modest numbers are allowed for low-risk everyday habit experiments; a numeric value is not unsafe by itself. Suggestions must connect to the player's reported concern/answers, offer feasible distinct A/B levels, and preserve the same numeric choices in EN and VI. Avoid presenting experiments as medical thresholds or copying one arbitrary quantity across unrelated goals. Reject unsupported medical/dietary quantities such as fluid prescriptions, calorie limits, weight-loss rates and doses; higher-risk amounts need relevant context. The player may include or remove each goal and may choose Custom.
## New-player world-first onboarding — approved 2026-11-02

- For `/play` new-player onboarding, Welcome/language is followed by selection of one of the eight visible Overworld regions. Sleep Valley (`sleep-better`) and HealthClues Realm (`health-concern`) are the only playable selections; the other six remain visible as Coming Soon. Preserve the selected region in the adaptive discovery profile, activation handoff and World creation. Do not ask the same concern again in Sleep Valley; HealthClues Realm asks a short concern/goal selection followed by adaptive questions.
- This world-first rule supersedes the historical concern-first rule for new `/play` users. Legacy Quiz entry and returning authenticated account behavior remain supported.
# MP20 — two-screen discovery and inventory constraints (2026-11-02)

- New-player discovery has exactly two question screens after World selection. Screen 1 chooses one concern; Sleep Valley uses sleep-only choices, while HealthClues Realm uses health concerns. Screen 2 is a concern-specific multi-select and optional note. No question is required to advance except the concern selection, age confirmation already required by the product, and a short description for Other.
- Concern/factor bank entries are self-reported circumstances or experiences; they are not all causes, diagnoses, or clinical risk classifications. No new diagnosis, medication, hydration, or activity safety state may be inferred from absence of a selected answer. A report of recurrent painful/swollen joints does not establish a current acute flare; `acutePainfulJoint` remains unknown unless directly assessed through its existing safety checkpoint. `none`/`unsure` are mutually exclusive with other factor selections.
- Gemini context must include selected World, concern, selected factors and optional note, locale and known safety context. It must not claim a user reported an unselected factor. Provider failure must not block onboarding or show fabricated AI output.
- A recommendation preview never equips a practice or botanical. Existing proximity, reviewed content and account-scoped NPC equipment APIs remain authoritative. A botanical suggestion does not imply safe use or efficacy.
- Existing authenticated Plan persistence remains the source of truth. No activation or daily completion is inferred from a Quiz answer or preview.


### MP20 factor serialization compatibility
The optional Q2 factor answer is zero to twelve matched choices. Persist canonical a-<factor> IDs; preserve none and unsure as their explicit states. Activation, Advisor context validation and World profile hydration must accept that same bounded contract. Do not infer a factor that the player left unchecked.
- Pending journey encryption requires a minimum 32-character secret (`HEALTHCLUES_PENDING_JOURNEY_SECRET`). In local development / test environments where this variable is unset, fallback to `SUPABASE_SECRET_KEY` is permitted to prevent artificial HTTP 503 failures while maintaining AES-256-GCM encryption integrity. Error messages displayed during activation handoff must be cleanly localized in Vietnamese without character encoding corruption.

### Owner acceptance — Advisor lifecycle and persistent checklist

The authenticated World Plan panel must open saved recommendations when a Quiz profile exists, including through the permanent My Plan navigation. It must expose request lifecycle states (not started, generating, success with goals, provider failure, validation failure, no recommendations) and a sanitized request reference on errors. Advisor logs correlate by request ID and may record stage/provider status/counts only; never log Quiz answers, prompt or credentials. The Advisor keeps request-ID dedupe, in-flight reuse and short completed-result caching so opening an existing recommendation panel does not trigger a new paid inference unless the player explicitly retries after failure/expiry.

In live World selection mode, ticking a goal after choosing valid A/B/Custom saves immediately. Keep recommendations visible after save beside the authenticated Plan's currently following goals. Persistence errors retain the same idempotency request key and offer Retry. Reopening My Journey/My Plan shows the same saved goals; botanical/practice discovery continues through its NPC.


### 2026-11-03: onboarding context integrity for Advisor Plans

A verified two-question onboarding handoff is the source of truth for the active discovery profile. Save it for the verified account even when an older profile exists; preserve account preferences and historical Plan revisions. The active World, concern and canonical Q2 factor IDs must agree before the Advisor runs. Missing, contradictory or stale context fails closed with a retryable localized error. Advisor caches are scoped to account, World and canonical discovery/safety context. A Plan revision is current only when its stored context key matches the current Quiz context; history remains stored. No database migration is needed because the key is an optional field in the existing profile JSONB Plan snapshot.

### 2026-11-12: Cycle 88 Mobile Onboarding Immediate Local Fallback Invariant

During mobile AI advisor loading (`advisorLoading === true`), triggering `Dùng gợi ý nhanh ngay →` (`handleQuickFallbackPlan`) increments `advisorRequestIdRef` so any in-flight remote Gemini response cannot overwrite the player's local selection after transition, assigns explicit status `LOCAL_FALLBACK` (never mislabeled `GEMINI_AI`), and preserves non-diagnostic safety messaging and optional habit editing.

### 2026-11-12: Cycle 89 World 2.5D Diorama & Typography Preservation Rules

The 2.5D Painterly Diorama layer (`worldDiorama25D.ts`) and custom typography upgrade only enhance visual presentation, depth scaling, lighting ambiance, and touch accessibility; they preserve all 8 Overworld region IDs/artwork (`Sleep Valley` & `HealthClues Realm` playable; 6 Coming Soon locked), road-snapped navigation bounds, and all non-clinical habit/safety copy unchanged.
## Mobile Toolkit Bag persistence boundary — 2026-11-22

- The mobile herb, sound and breath Toolkit Bag is account data, not device-only UI state. Reads and mutations must go through the authenticated `/api/healthclues/mobile-toolkit` API and be stored in `healthclues_mobile_toolkit_items` keyed by the authenticated `user_id`.
- `AsyncStorage`, `localStorage`, `sessionStorage` and in-memory arrays may not be the persistence source of truth for these three bag item types. Client event emitters are presentation refresh signals only.
- API reads and writes are user-scoped and must fail closed when the authenticated session is absent or invalid. A local fixture or browser-seeded bag is not persistence evidence.

## Mobile Journey, Check-in and Detective persistence boundary — 2026-11-24

- Mobile Journey goals and their active/saved status are account-owned state stored through the authenticated `mobile-progress` route; AsyncStorage/localStorage is not a source of truth.
- Mobile daily check-in status is private account state. The server stores one record per user/local date and awards XP through the append-only XP ledger with an idempotency key; retrying or switching devices must not duplicate the reward.
- Detective solved-case progress and rewards are server-authoritative through the mobile detective campaign/solve APIs. Legacy launcher UI must not persist solved IDs or rewards locally.
