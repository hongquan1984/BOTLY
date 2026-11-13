## D-2026-11-05 — Deprecate quick-activate session bypass and enforce genuine Mailpit magic links

The `/api/healthclues/account/quick-activate` endpoint is permanently decommissioned with HTTP 410 Gone. All client-side instant activation buttons (`data-instant-activate-btn`, "⚡ Instant Activate & Enter World") have been completely removed from `HealthCluesWorldPreview`. Both manual demo and automated E2E tests must go through real Supabase Auth magic link delivery via local Mailpit (`http://127.0.0.1:54324`). Instant session bypass can no longer be used as evidence of passing login flows.

## D-2026-11-05 — Shared Blueprint Artwork for Sleep Valley and HealthClues Realm

Both `healthclues-realm-scene-blueprint.webp` and `sleep-valley-scene-blueprint.webp` intentionally share identical high-resolution painted scene blueprint artwork (approved owner reference asset). This decision was audited and confirmed: the visual blueprint provides the stone pathways, landmark positions (Camp, Nutrition/Botanist, Sanctuary/Wellness Guide, Knowledge Hall), and central fountain across both playable regions while region-specific companions (Luna vs. Lumi), lighting tones, and goal tracks distinguish the two experiences. No file replacement occurs without explicit owner instructions.

## D-2026-11-05 — Region and Companion persistence contract (Sleep Valley ↔ Luna, Realm ↔ Lumi)

Selecting Sleep Valley and completing the Sleep Quiz permanently preserves `questId === "sleep-better"` and companion Luna across pending journey serialization, Supabase magic link callback redirect (`/play?activation=complete&quest=sleep-better`), and page reload. Selecting HealthClues Realm preserves `questId === "health-concern"` and companion Lumi. HealthCluesRealm does not re-prompt for concerns when primary focus has already been selected.

## D-2026-11-05 — Landmark & NPC interaction: Walk first, then Talk

Clicking an NPC, building, or landmark label now initiates character pathfinding along designated walkable stone paths (`beginLandmarkTravel`). No modal or panel opens upon click. A modal opens strictly when the player reaches the landmark approach coordinate and explicitly clicks the arrival action button ("Talk" for NPCs, "Interact" for buildings).

## D-2026-11-05 — Truthful Progression & Daily Care HUD

New accounts start strictly at Level 1 with 0 / 50 EXP (no fabricated Level 4 or 180 EXP baseline). Card 1 (Daily Care) dynamically reads confirmed goals from `wellnessGoals` and displays `{completedCount}/{totalGoals} đã hoàn thành` with an honest empty state when the user skipped plan creation. The 7-day timeline explicitly represents daily check-in streak progress rather than distinct task lists. Floating dialogue and celebration bursts are suppressed during active modal interactions. Mobile viewports (<= 680px) render a clean 3-button dock (`Bản đồ · Hôm nay · Túi đồ`).

## D-2026-11-05 — Separate independent Tester from the existing Manager queue

The owner requested a repeatable `tester.bat` handoff between Antigravity and Codex. Use a dedicated persisted Codex Tester thread rather than `--last` or the existing Manager audit queue. Antigravity stays in its task, invokes the batch synchronously, and consumes only the new run-specific review after exit 0. The Tester reviews local playable scope without editing product code or using production/real provider data. It may create fresh synthetic account/progress records only after independently verifying the isolated loopback Owner Demo identity; preserve existing demo accounts. Tester evidence files and screenshots stay inside `D:\botly`. A fresh review may be REWORK or BLOCKED; batch success alone does not approve the game. Desktop Antigravity cannot be awakened by writing a file after its task has ended. The first Codex run completed with REWORK; second-run resume and the complete Antigravity repair loop remain unverified.

## D-2026-11-05 — Preserve proof verification when showing a concrete action title

The selected generated action is now the goal title in the Plan and check-in UI. Keep proof verification compatible with historical records by accepting exactly the signed localized model title or the signed selected action as `title`. Continue requiring the signed action as `trackingDefinition` and validating every existing owner, profile, option, category, explanation and signature field. This is a bounded compatibility rule, not acceptance of arbitrary client-authored title text. Automated contract coverage must exercise both the new concrete title and the historical title.

## 2026-11-02 — Keep Botanist content truthful and reduce duplicate Plan chrome

The Botanist is a botanical station, not a generic Nutrition catalog. Filter TEST ONLY/demo and currently ineligible content; when no reviewed botanical entry qualifies, show the friendly empty state rather than substituting unrelated fixtures. Existing discovery, Collection and NPC-based equipment APIs remain authoritative.

The Plan Builder already receives a concise in-World Luna/Lumi introduction. Remove the repeated companion block inside the builder and the duplicate exit control above it while retaining existing Back/Skip/Confirm actions. Put selected count before the card list. Reuse the existing 12 SVG assets, bilingual snapshots and exact user-authored Custom text. No schema or account-data changes.

## 2026-11-02 — Keep local synthetic Plan provenance explicit

Decision: allow a correctly signed synthetic Advisor fixture to pass through the actual Plan API only in the isolated Owner Demo while retaining the exact evidence label `SYNTHETIC TEST ONLY · NOT PERSONALIZED ADVICE`. The server still verifies the normal signed-goal proof and safety/schema contract. In every other runtime, a client-supplied fixture label is overwritten with the standard AI-generated disclaimer. This supports authenticated UI-to-persistence acceptance while preventing fixture success from being presented as real Gemini output or approved advice. No schema migration or change to user/account ownership is involved.

## 2026-10-30 — Phase 10A plan persistence and safety boundary

## 2026-10-31 — Fail closed for unsupported Plan topics

Decision: `buildWellnessPlanSuggestions` returns no suggestions when the Quiz topic has no exact supported mapping. Do not permit two unknown/null tag resolutions to count as a match. Show an honest coverage gap; preserve the user's self-reported topic separately from the playable region identifier. This prevents unrelated catalog filler and is covered by an explicit regression candidate.

Verification boundary: build 3267 uses isolated local Owner Demo. Chromium verified Gout/Sleep plan persistence, Digestion no-content behavior, World entry and full RPG regression. The checklist remains deterministic (`liveLlm: false`); no claim of Codex/LLM invocation or human review is made.
Decision: reuse the existing owner-scoped healthclues_profiles.profile JSONB for versioned Wellness Plan revisions keyed by the existing World ID; do not add a duplicate Plan table or migration in Phase 10A. Carry guest-confirmed selection only in the existing short-lived AES-GCM HttpOnly pending-journey cookie, then save after verified auth and explicit consent. Catalog suggestions are deterministic and server-validated against the active reviewed Catalog version; personal goals remain private USER-CREATED / NOT REVIEWED.
Assumption/limitation: sequential retries use a request key, but profile JSONB PATCH is not an atomic multi-request revision append; concurrent duplicate POSTs have not been proven idempotent. This local implementation is not browser/database accepted because Docker identity verification was denied. Keep production untouched; assess a transactional RPC only if concurrency acceptance requires it.

## 2026-10-30 — Isolated reminder delivery adapter
Decision: allow the existing authenticated internal reminder worker to use a hard-coded loopback Mailpit API only when `HEALTHCLUES_OWNER_DEMO=1` and provider is explicitly `mailpit`; other environments cannot select this branch. An additive migration claims queued rows atomically and records provider result. Existing `mock` path remains intact. E2E demonstrated one local send and zero on repeat. Stale-claim recovery remains pending because re-sending an ambiguously accepted message can duplicate reminders. No production provider or scheduler is activated.


## 2026-10-30 — Reuse current private profile and guide persistence
Decision: store an optional nickname in the existing owner-scoped profile JSON and extend the existing guide-state stage constraint additively for summary/reminder flow. Keep Reminder settings and tables unchanged; keep AI provider configuration disabled in isolated demo unless consent, feature flag and explicit paid-provider approval are present. Rationale: avoid duplicate profile/tutorial/reminder stores and protect existing World data. The local backup was made before applying the additive guide-stage migration. No production schema or provider was changed.
# Decisions & Assumptions

## D-2026-10-30-04 — không đưa hồ sơ Quiz vào Codex SDK khi thread còn lưu bền

- Đã khảo sát Codex SDK 0.166.0 cho yêu cầu tạo checklist lúc Quiz hoàn tất. SDK lưu thread ở `~/.codex/sessions`, không cung cấp tùy chọn ephemeral công khai, và source không chuyển tiếp CLI `--ephemeral`.
- Không gửi dữ liệu Quiz/sức khỏe vào Codex SDK hoặc né SDK bằng runner khác trong phạm vi này. Smoke chỉ dùng input tổng hợp; không được xem là tích hợp browser.
- Giữ deterministic fallback được gắn nhãn rõ ràng. Tiếp tục chỉ sau khi có inference worker local không lưu prompt/session hoặc retention control được SDK hỗ trợ, giới hạn cách ly/tool rõ ràng, cùng quyết định consent nếu dữ liệu rời máy.
- Không thay schema/persistence/World. Không production write/deploy. Bằng chứng ở `reports/HEALTHCLUES_REALTIME_CODEX_ADVISOR_BLOCKER.md`.

## D-2026-10-30-03 — deterministic recommendation history and collection awareness

- Use one versioned deterministic matcher; current scored factors are explicit topic, goal, preference, time, and existing Backpack/Care Plan/Collection/history state. Saved and previously shown candidates receive small repeat-avoidance penalties; alternative requests move that item lower while offering another eligible option where available; explicit dismissals/practical difficulty receive stronger penalties. Ties resolve by catalog ID.
- The saved/read history changes ranking only; it does not create clinical efficacy, override safety, or automatically equip/replace a tool. TEST ONLY remains isolated and unreviewed.
- Evidence is restricted to local synthetic owner accounts and the retained demo volume. No production writes/deploy. Current authenticated browser and unit evidence, plus incomplete synthetic two-Gout browser comparison, are distinguished in the final acceptance report.

## CONFIRMED — character identity and region composition lock, 2026-10-30

- Use four separate original transparent assets for the blue-cloaked player, Botanist, Trail Explorer and Wellness Guide. NPC identity and role remain consistent across Sleep Valley and HealthClues Realm; do not simulate distinct identities by reusing/recoloring the player sprite. Keep feet anchors, shadows and role-specific idle rendering. The current implementation represents a Knowledge Guardian only where that station/NPC exists; it does not invent a fifth NPC.
- Preserve both already-approved scenery plates, world coordinates, NPC station positions and route graph. Lock map composition/artwork to avoid repeated layout changes; further changes need an explicit owner correction. Visual evidence and verified scope are in the latest final acceptance section.
- Assets are original generated prototypes for owner demo; generated art has no external stock license claim and remains subject to owner art approval. This is a presentation-only change; no schema, auth, security, API or business-rule boundary changes.

## CONFIRMED — shared playable-region layout, 2026-10-30

- Keep the existing renderer and a shared 1600×900 route graph for Sleep Valley and HealthClues Realm. Preserve seven approved landmark target percentages; place upper approaches on open ground below structures, connected without mandatory bridges. Both maps use the same navigation logic but distinct hand-painted scenery plates with no embedded people; NPCs remain separate world sprites.
- Render one contextual landmark label at a time and preserve the same world coordinates across viewports. Desktop contains the complete 16:9 map; portrait uses bounded player-focused camera framing. Existing World, Quiz-selected Journey (including self-reported Gout context), and server persistence boundaries do not change.
- The generated scenery is implementation artwork for owner review, not final human-approved art. No schema, migration, RLS or production content decision changes in this layout correction.
- Visual QA of the actual Camp spawn screenshots showed the Camp marker too close to the following Pet while returning from a station, so the marker was moved to open ground below the Camp approach point; the NPC keyboard highlight now marks the feet/ground rather than boxing in the full sprite. This changes presentation only; arrival coordinates and route ownership do not change.

## CONFIRMED — đã được yêu cầu chốt
- Tên: HealthClues — Your Personal Wellness Journey; định hướng Personalized Wellness Discovery & Community Journey Platform.
- Một My Wellness World chính cho mỗi người, nhiều nhánh/journey tồn tại lâu dài; không reset journey cũ.
- Check-in có thể hàng ngày; milestone 7/14/30/60/90 là mốc tổng kết/thưởng, không thay thế check-in.
- Check-in có nhiều hoạt động; unset không đồng nghĩa không làm; không ghi giả, không thưởng trùng, không phạt khai thật.
- Activity có thể thêm/đổi/pause/replace/remove; giữ lịch sử.
- Notes mặc định private; share hoàn toàn opt-in, chọn trường; Public Journey là projection, không phải quyền đọc journal.
- Phân biệt Reviewed Knowledge, Personal Experience, Personalized Recommendation; không suy diễn chữa bệnh/khuyên bỏ điều trị.
- Rewards không khuyến khích thảo mộc, quá sức, công khai nhạy cảm hoặc tuyên bố khỏi bệnh.
- Email reminder có opt-in, giờ/múi giờ/tần suất/stop controls; tránh lộ sức khỏe trong subject.
- Giai đoạn web responsive; dùng Next.js/Supabase/Vercel Botly hiện tại; Supabase project hiện tại `rswmadukvegraxfcdbcb`; không tạo backend/database/project riêng.
- Website consumer English; Admin và tài liệu Vietnamese.
- Giai đoạn này chỉ tài liệu Markdown trong `D:\botly\APP`; không code, migration, deploy, chỉnh env/data/production.

## PROPOSED — đề xuất, chưa phê duyệt
- Eligibility V1 age gate 18+ (đã có trong quiz bank source, cần xác nhận policy hiện hành).
- Check-in 30–60 giây; XP +10 first valid daily check-in, +2 learning resource capped 2/day, +5 weekly reflection; tránh điểm theo số activity.
- Milestone calendar elapsed day 7/14/30/60/90; không cần check-in đúng ngày; claim one-time.
- Email reminder default off; sau opt-in có thể tối đa daily, quiet hours, generic subject; bounded retry 3 lần.
- Public projection takedown at read endpoint immediate, cache purge target 15 phút.
- Retention: 30 ngày recovery, primary purge 30 ngày kế tiếp, backup TTL tối đa 90 ngày; cần privacy/legal approval.
- Analytics minimum cell suppression n<10.
- Guest quiz session expires; exact duration to choose after privacy review.
- Community guest read-only/rate-limited; follow requires member.
- Evidence classes E0–E4 are internal taxonomy, not a medical grading displayed as certainty.
- Profile versioning and separate consent rows; proposed database names/columns require schema/security review.
- North-star engagement metric measures product engagement, never health outcome.
- Community revocation does not delete another member’s independently created journey; attribution removed/neutralized.

## OPEN DECISIONS — chốt trước phase phù hợp

### Blocker trước Phase 1
1. **Auth & guest conversion:** guest quiz answers persist how long, and how are they attached to account only after explicit confirmation?
2. **Meaning of “one World”:** enforce one non-deleted lifetime row or one active World plus archive/restore behavior? Current proposal: one persistent World row, archivable but not silently recreated.
3. **Sensitive profile schema:** exact fields needed for exclusions/health context and whether any are collected in V1; minimize by default.
4. **Quiz scope:** reconcile existing quiz bank’s 12–20 total/≤7 deep branch questions with new goals/time/food/movement/sleep/habit requirements.
5. **Existing deployment state:** which current quiz/profile/discovery/admin components and migrations are deployed and tested? Files alone cannot confirm.
6. **Production migration/release owner and rollback:** approval and maintenance window.

### Blocker before Phase 2
7. XP quantities, caps, level curve, and whether any redemption has monetary value.
8. Timezone changes around one-check-in-per-day rule; policy for travel, DST and repeated local dates.
9. Reminder vendor/provider, exact data in map preview, send window, retry/bounce policy and retention.
10. Note retention, export formats, backups and deletion/legal hold policy.

### Blocker before Phase 3
11. Public field allowlist, share defaults, alias generation and disclosure about re-identification/screenshots.
12. Comment enablement, community age/access policy, reporting SLA, escalation and appeals/staffing.
13. Revocation cache SLA and handling of replies/comments after journey removal.
14. Jurisdiction-specific privacy/health-data obligations and consent wording; legal review required.

### Blocker before Phase 4–5
15. Reward economy and mini-game content approval.
16. AI provider, prompt/data retention, model training policy, eligible context, opt-in and safety benchmark.
17. Whether AI can store summaries or only produce on demand; user deletion/export behavior.

## Repository evidence and limits
Read-only review of `src` showed HealthClues quiz, dashboard, profile/discovery libraries, discovery and admin routes; Botly ebook/articles/admin features; baseline and HealthClues migration files. This supports “found in source/files,” not production deployment or successful test claims. Existing HealthClues docs describe discovery candidates and safety review as pending; candidate imports or patches are not proof of a live approved catalog. The workspace contained no prior documents in `D:\botly\App` at inspection time. No credentials were inspected or copied into these documents.

## Confirmed by Build HealthClues V1 prompt (supersedes prior proposals)
- Seven-stage game onboarding and 8–10 initial-question target with adaptive follow-up; preserve current question bank.
- Guest can view result before registration; member auth required for long-term World persistence.
- Three slots: Consume/Eat, Reduce/Avoid, Do/Practice; 0–3 tools, max one per slot, no auto-equip and no required herb.
- My Collection is distinct from My Equipped Toolkit.
- Recipe Combo is a recipe item with multiple canonical ingredient IDs. Journey Combo is a reviewed preset with typed slot assignments and partial acceptance.
- Implementation and isolated test validation are authorized. Production writes/migrations, real emails and public deployment remain unapproved.
- Core community, reminders and basic gamification are V1. Advanced AI Companion and mini-games are post-V1.
# Decision record — 2026-10-28 (supersedes conflicting map-count proposals)

## D-2026-10-28-01 — Eight visible, two playable

- **Decision:** Giữ tám region hiện có trên global map. Mở Sleep Valley + HealthClues Realm; sáu vùng còn lại hiển thị Coming Soon và không playable.
- **Rationale:** Giữ approved World artwork/IDs và giới hạn release scope trong hai gameplay maps.
- **Supersedes:** Đề xuất trước đó loại/hide sáu vùng hoặc làm tám playable. Không xóa legacy IDs/code/data.
- **Status:** Availability config + API lock có trong source; detailed region maps chưa làm. Evidence: `TWO_MAP_GAMEPLAY_ACCEPTANCE.md`.

## D-2026-10-28-02 — Quiz-selected personal Journey

- **Decision:** Initial Discovery Quiz là nguồn chọn concern/goal; HealthClues Realm dùng context đã chọn, không hỏi lại. Sleep vào Sleep Valley/Luna, Health vào Realm/Lumi. Self-report không phải diagnosis.
- **Status:** Approved, chưa được persisted end-to-end; current `branch.topic_key` là region ID. No claim of personalization until schema/browser evidence exists.

## D-2026-10-28-03 — Learning lives in the region

- **Decision:** Knowledge, educational Quick Quiz, mini-games and Boss remain inside the active detailed map; no third Knowledge land. Four shared Skills/five levels, one featured daily Tip and optional 2–3 question Daily Companion. Community Village is deferred.
- **Status:** Requirements approved; integrated implementation incomplete. See canonical Knowledge/UI specs and `CURRENT_STATE.md`.

# Decision record ? 2026-10-29 (09C)

## D-2026-10-29-04 ? Existing SVG/DOM renderer retained
- **Decision:** Keep the current React/SVG/DOM map and normalized landmark layout; add a shared transform camera rather than adopting a second rendering engine.
- **Reason:** Existing maps are point-and-click illustrated regions with accessible HTML landmarks; observed deficiencies were pan/zoom capability, not scene graph capacity. No new dependency or engine migration is justified. A future adoption requires a measured interaction/performance case. See `reports/HEALTHCLUES_MAP_TECHNOLOGY_RESEARCH.md`.
- **Status:** Implemented in source; final owner-build browser gesture QA is tracked separately.

## D-2026-10-29-05 ? Private Care Plan stays outside game equipment and rewards
- **Decision:** User-added practices and prescription records live in separate owner-scoped Care Plan relations; not Collection, Backpack, Journal or public Catalog.
- **Reason:** A user log is not a reviewed recommendation or equipment assignment. Medication/self-report activity must not grant XP or assert adherence.
- **Status:** Additive local-demo schema/API/UI implemented; production privacy/security review remains open.

## 2026-10-29 — 09D-R region renderer

- **Decision:** Retain the existing React/DOM/CSS renderer for the current two detailed maps; add movement, follow camera, corridor graph routing and separate actor sprites. Do not add Phaser/PixiJS without a measured renderer limitation.
- **Reason:** A real Chromium slice now demonstrates continuous movement, camera/Pet follow and proximity-gated NPC Talk while preserving React API and accessibility overlays; no engine migration is required for this scope.
- **Limits:** Authored corridor graph is not pixel-accurate collision; generated art is prototype art awaiting human review; frame rate and physical mobile gestures remain unverified.
- **Evidence:** `reports/REGION_ENGINE_IMPLEMENTATION_DECISION.md`, `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

## D-2026-10-30-01 — Keep both region maps compact and readable

- **Decision:** Keep all playable stations on one short, connected path near camp; space the Garden, Activity Trail, Wellness Sanctuary and Boss anchors far enough apart to keep NPC names and location labels readable at the default landscape scale. Reset framing must contain the entire scene in the landscape viewport; portrait may use bounded cover framing with camera follow.
- **Reason:** Chromium inspection of the first simplified-map capture showed readable travel but overlapping station names and a zoomed screenshot that did not represent the default map. The update changes authored station coordinates and acceptance checks without adding another renderer or altering the eight-region Overworld.
- **Status:** Implemented in `RegionMapScene.tsx` and `region-navigation-data.ts`; isolated build `app-build-final-a7` and the authenticated owner browser flow passed on 2026-10-30. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

## CONFIRMED — character identity and region composition lock, 2026-10-30

- Use separate original transparent assets for the blue-cloaked player, Botanist, Trail Explorer and Wellness Guide. Keep NPC identity and role consistent across Sleep Valley and HealthClues Realm; do not recolor/reuse the player as an NPC. Keep feet anchors, ground shadows, role-specific rendering and player walk/direction frames. Do not invent a Knowledge Guardian sprite where the corresponding NPC is not represented.
- Preserve both existing scenery plates, world coordinates, NPC station positions and route graph. Lock map composition/artwork against repeated adjustment; reopen only for explicit owner correction.
- Art is generated prototype material for owner review, not externally licensed stock and not final approval. Presentation only; no schema, auth/security, API or business-rule boundary changed.


## Decision — flexible equipment position separate from tool category (2026-10-30)

Retain legacy `slot_key` as action category and add independent positions 1–3. This supports any eligible combination without rewriting history. Replacement is transactional and explicit. TEST ONLY fixture authorization is a separate local-demo server condition and never satisfies human-review status. Private check-in adds `unsure` so “Don't Remember” is not stored as “Not Yet.”
# D-2026-10-30 — deterministic explainable RPG recommendations

- Use one shared rules engine over the current reviewed Catalog; no LLM/paid API, duplicate catalogue, added mandatory Quiz questions or inferred health history.
- Absent/legacy safety answers are unknown, never “no”. Personalized suitability and server-side equipment require explicit eligible metadata plus the existing review/demo boundary. General education may still be browsed.
- Store only minimal private recommendation events, owner/World/item references, reason codes and rules version. Never snapshot Quiz answers or medication/private notes into the history.
- This is source implementation plus local isolated migration/fixture seed; browser acceptance is reported only after the current run completes. No production writes/deployment.

## D-2026-10-30-02 — general education is not condition relevance

Demo food/movement fixtures have no Gout/Sleep relationship unless a qualified reviewed source supports it. Generic fixture topics are `general-education`; they remain browsable and receive a general-education reason, never a fabricated condition match. Ordinary food entries stay education-only and do not become equipment through topic interest. Missing allergy, dietary/fluid restriction, medication, or activity-safety context remains unknown.



## D-2026-10-30-03 — Keep pending journey in the existing encrypted cookie, compress to fit browser limits

- **Decision:** Continue using the existing short-lived HttpOnly AES-GCM pending-journey cookie; deflate the serialized JSON before encryption, prefix the envelope version, and keep the reader compatible with previously issued uncompressed cookies. Reject an encoded value above a conservative 3500-character ceiling.
- **Reason:** Chromium rejected the confirmed Gout Plan handoff as `NameValuePairExceedsMaxSize`; the route had returned success despite the browser dropping its Set-Cookie. Compression preserves the approved no-URL/no-plaintext-storage boundary without adding a database table or persistent pending record.
- **Evidence:** Local Chromium verified that the cookie is retained through Mailpit email confirmation and the confirmed Plan persists in the same World. 20-minute expiry and deliberate network-fault injection remain unverified.

## D-2026-10-30-04 — World tutorial and Quest Plan reuse

- **Decision:** The World-entry tutorial maps onto the already migrated, authenticated World guide stages. The saved Wellness Plan stays in the existing World-linked profile JSON and is surfaced through Quests/Camp/tutorial using the existing Plan API; no duplicate table or migration is introduced.
- **Behavior:** The four tutorial steps present the actual saved goal list (or a no-goals message), require the player to open the real Plan in step three, and then point to an authored reachable landmark before free exploration. Completed and skipped tutorials remain non-repeating by default; replay is voluntary.
- **Plan updates:** Edit/pause/resume/remove append versions through the existing server API. A short personal goal note stays private, USER-CREATED / NOT REVIEWED, inactive and unmeasurable until the player configures it; only explicit resume activates it.
- **Evidence boundary:** Local authenticated Chromium on isolated `healthclues-owner-demo` port 3265 verifies Gout/Sleep, plan revisions, reload, Quests/tutorial access, NPC arrival/Talk, mobile emulation and 404 cross-owner read/write. This does not establish full current-build Backpack/Knowledge/Boss regression; the legacy full-game browser script currently stops at an obsolete first-guide text assertion. No production test/deployment.
## Decision — Gemini is a constrained local selector, not content author — 2026-10-31

Use the official `@google/genai` server SDK only within an explicitly enabled loopback Owner Demo. The model ranks exact current reviewed Catalog candidates and chooses a supported Quiz fact reference. The application, not the model, supplies the title, summary, source, caveats and explanation wording after validation. Unreviewed TEST ONLY habit templates are excluded. A missing key/provider or rejected output returns no generated list; deterministic behavior is available only under an explicitly selected `deterministic_demo` mode. This avoids fabricated claims/citations while retaining real-time AI personalization. No production enablement or schema migration is authorized by this decision.

## D-2026-10-31 ? HealthClues player locale persistence

Decision: use a HealthClues-only browser preference before account activation and the existing private HealthClues profile JSON after authentication. Do not add schema or alter BOTLY site/admin locale settings. Use /en/wellness/healthclues/... and /vi/wellness/healthclues/... counterparts for the same components and canonical Quiz engine. The browser may show English source wording only where reviewed Vietnamese content is absent, with an explicit disclosure; medical evidence/sources are not silently rewritten.

Status: route and preference implementation exists, but complete account-switch / returning-player browser verification and content fallback UX remain open. No completion decision is implied by this record.

## 2026-10-31 — Vietnamese Plan copy and Gemini failure boundary

Decision: translate Quiz-derived Plan/Reveal display values using the canonical Quiz option translator plus the existing UI dictionary; persisted answers and goal identifiers remain unchanged. Keep provider status codes out of player copy and localize the human-readable error. With no reviewed candidate eligible for the profile, stop before model invocation and display a truthful source-coverage gap.

Verified provider fact: the private Owner Demo environment loaded the configured server-side Gemini key/model; two synthetic-profile requests to gemini-3.8-flash received HTTP 402 and produced no JSON. This is a billing/configuration failure, not a schema or safety rejection. Later application requests failed source eligibility before reaching Gemini. Do not claim model output validation or recommendation success.

## D-2026-10-31 — My Journey tutorial focus mode

Decision: reuse the existing local tutorial step state and My Journey panel; add a fourth section stop for Wellness Focus and apply one active highlight with three muted sections. A separate World dimmer covers the map while the actual panel remains above it, preventing map gestures during the explanation. Keep existing profile, Plan, inventory and tutorial completion persistence unchanged. Pet dialogue stays adjacent to its real target, and reduced-motion/mobile scrolling behavior remains supported. Rationale: make the current explanation unambiguous without creating a parallel tutorial or inventory system. Verification is limited to the isolated local Owner Demo and synthetic accounts; production is not tested.


## D-2026-11-01 — Focus overlay belongs to the Journey modal backdrop

Decision: remove the body portal used to dim World during inside-panel My Journey steps. The browser showed that it could composite above the modal panel because those elements occupy different stacking contexts, dimming the Pet and active section too. Apply the viewport dim and pointer shield to the existing modal backdrop instead; keep the Journey panel as its child above the backdrop, and use a full viewport inset in desktop and mobile guided mode. Ignore outside-click dismissal while the guide is active; explicit close/Skip/Continue remains available. This preserves the existing tutorial, Plan and inventory data contracts. Verified by real Chromium paint-order/hit testing and inspected desktop/mobile screenshots on isolated build http://127.0.0.1:3296/play. No production verification.
## D-2026-11-01-16 — allow ordinary lifestyle generation outside TEST ONLY Catalog

- **Decision:** For the optional post-Quiz Plan only, allow Gemini to author low-risk everyday habit candidates grounded in an allow-listed public guidance registry, instead of requiring every wording to exist in the reviewed NPC Catalog. Validate structure, source/topic alignment, profile relevance and safety on the server for each goal. Keep the existing owner/World Plan persistence and explicit player confirmation.
- **Reason:** The current eligible Catalog has no approved recommendation records, which blocked generation before Gemini could be invoked. The owner explicitly approved this changed direction in Master Prompt 16; this does not upgrade TEST ONLY records or relax separate herb, supplement or treatment controls.
- **Limits:** Existing Quiz profile has no structured quantities/frequencies, so quantitative targets are omitted/rejected. Inactivity, red-meat frequency and hydration needs cannot be inferred from topic alone. Each goal needs exactly two distinct options and one client-only custom text path; only confirmed choices persist.
- **Provider evidence:** Latest prior genuine Gemini call returned HTTP 402/BILLING_REQUIRED. This session did not call Gemini again and has no response/schema acceptance evidence. The selected project/key are configured locally, but current inference status is blocked pending billing/provider availability.
- **Implementation/evidence:** `src/features/healthclues/personalized-wellness-plan.ts`, Advisor route, Builder and Plan persistence validation; see `reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md`. Focused contract tests and isolated build passed. Browser A/B/custom/skip/confirmed persistence remains unverified; status is PARTIAL.

## D-2026-11-01 — MP17 supersedes fixed first-time Quiz and pre-World Plan order

Approved direction: new players use concern-first short adaptive questions, enter World after existing email activation, and then see optional Pet-led personalized goals in World. Existing onboarded users and their stored answers/Plans remain compatible; the 96-question bank is retained for legacy/rollback. Goal inclusion is a separate unchecked-by-default checkbox from A/B/custom implementation selection; only confirmed selections are persisted, including valid zero-goal Plans. The earlier MP16 pre-World Plan sequence is superseded for the new-player path. No flow or Gemini success is implied until E2E evidence exists. Existing real Gemini billing blocker remains HTTP 402; do not retry or represent fixtures as live output.
## 2026-11-01 — Goal-card art assets

- The plan mockup is art direction only; the actual checkbox, A/B/custom controls remain live UI. Do not embed the mockup as the screen or copy its example medical claims/targets.
- Existing map, player and Pet artwork stay unchanged. Because the current licensed My Journey set did not cover all goal categories, add compact project-authored SVG silhouettes under `public/healthclues/assets/ui/goal-icons/` and document provenance. This avoids adding an uncertain third-party pack or a paid image API. Existing Lucide remains for ordinary actions; existing Game-icons assets retain their separate CC BY 3.0 attribution.
- Reuse the existing Luna/Lumi SVG Pet in a concise localized bubble on the current Plan Builder, keyed by the already-selected playable region. Keep it inside the same panel so it does not stack a modal or claim that recommendations exist when generation is unavailable.
- This original asset checkpoint was superseded by the later MP17 source implementation: the Discovery cards now use the category icons, and the existing Plan Builder opens after account activation inside the actual World. The visual slice plus that flow still does not establish MP17 acceptance; selected-goal persistence, isolation, full localization and live inference remain separate acceptance items.

## MP17 implementation decision and checkpoint — 2026-11-01

The new-player experience is implemented as an additive branch, not a destructive replacement: existing 96-question Quiz answers/routes remain for returning/resumed users, while the Welcome Start action opens the canonical concern-first discovery UI. The optional `adaptiveDiscovery` profile field carries stable IDs and explicit age confirmation across the existing encrypted activation handoff. Sleep focus maps to the existing Sleep Valley trail; other current focuses map to HealthClues Realm. Post-entry Plan presentation reuses the current Plan API and My Journey rather than introducing parallel storage. The latest isolated Chromium checkpoint verifies one Vietnamese synthetic-account activation through the real World, zero-goal Plan confirmation and My Journey reload. Selected-goal persistence, second-account isolation and full EN/VI browser coverage remain pending. Genuine Gemini remains blocked by HTTP 402, and synthetic question intercepts are QA-only.

### Region NPC locale boundary — 2026-11-02

The selected Vietnamese locale translates authored region-navigation shell text: landmark labels, NPC role names and greetings, Talk/Interact actions, and movement instructions. Dynamic Catalog text and optional NPC/provider responses are not machine-translated or thereby considered reviewed. Their original wording and source/review labels remain authoritative. This improves navigation access without changing canonical content, safety evaluation, region IDs, or stored player values.
### Gemini failure observability boundary — 2026-11-02

- Application HTTP 503 must never be treated as Gemini provider HTTP 503. Preserve separate `applicationStatus` and nullable `providerStatus`; set provider status only when the SDK exposes an actual upstream status or a successful provider response is received.
- Server diagnostics use stage events and sanitized metadata only. Never log prompts, credentials, profile/health answers, or full generated recommendations. Local PowerShell callers must read `HttpWebResponse` bodies from `WebException` on non-2xx responses and whitelist response fields.
- Do not retry real inference solely to debug response handling. Verify capture and classification with a local mock first.


## D-2026-11-02 — simplified bilingual Gemini checklist

- **Decision:** For the optional lifestyle checklist, Gemini returns up to six bilingual suggestions with title, short reason, and two A/B implementation options only. It does not produce IDs or persistence metadata, and no catalog row/source ID is required for an ordinary suggestion.
- **Server ownership:** Assign UUID-backed `ai:` goal IDs and concern-derived categories after model validation. Keep the existing signed Advisor proof and confirmed owner/World Plan persistence. EN/VI wording is returned together; locale switching reuses the same generated plan and IDs. The server keeps completed signed plans in memory for up to 25 minutes; explicit retry bypasses this cache.
- **Safety:** Preserve no-target/no-universal-quantity behavior, dangerous-action rejection, explicit player confirmation, UI-owned checkbox/Custom choice, and the short not-medical-advice disclaimer.
- **Scope:** This changes only the generated checklist contract. It does not alter the legacy Quiz, World regions, Pet, My Journey ownership, or existing user data. Offline synthetic tests and isolated build are recorded in the latest MP17 acceptance section. No live Gemini request was made; real inference readiness is not established.

## 2026-11-02 — measurable AI choices and risk-aware quantities

Owner direction: do not reject AI suggestions solely because they contain numbers. For low-risk daily habits, modest durations/frequencies may be useful adjustable experiments, including without an exact baseline, if not framed as proven thresholds. Tie goals/reasons to actual discovery answers; make A/B feasible and meaningfully distinct; keep bilingual numbers equivalent. Reject unsupported higher-risk quantitative prescriptions (including fluid amounts, calorie limits, weight-loss rates and medication/supplement doses), dangerous actions, and implausible everyday values. Keep IDs and Plan metadata server-owned, checkbox/Custom UI-owned, and do not regenerate recommendations on locale switch. No live inference was authorized for this refinement.

## 2026-11-02 — preserve bilingual AI copy in current Plan JSON

Decision: retain the complete validated EN/VI title, relevance reason and A/B title/action in each signed AI goal's `localizedRecommendation` snapshot inside the existing profile JSONB Plan. Attach it only after server-side signature and profile/selection proof verification; no new DB column or migration. The UI selects the copy matching locale while preserving canonical ID, selected option, numeric target and status. User-created text is never automatically translated. If an old record lacks a snapshot, preserve its saved wording unchanged. The current AI-card Custom path creates a separate `user_created` UUID; it has no origin recommendation link, and unselected A/B options do not persist as active actions. Legacy practice slots without a discovery-station field remain visible under Practices. The fixture-backed test does not establish live Gemini quality or original 96-answer preservation.
## 2026-11-02 — MP19 approved world-first onboarding override

The owner explicitly corrected the earlier concern-first new-player flow: Welcome/language → choose one of the eight worlds → short world-relevant adaptive Quiz → email activation → direct entry into the chosen playable region. Only Sleep Valley and HealthClues Realm are playable; six others stay visible as Coming Soon. The selected HealthClues Realm concern is asked once during its Quiz. Sleep Valley asks sleep-specific context without a duplicate concern picker. Keep the legacy Quiz for existing entry paths and route returning accounts to their stored World. Plan selection remains optional, allows zero goals and requires explicit confirmation. AI availability failures must remain visible; never label synthetic fixtures as Gemini output. This decision supersedes the 2026-11-01 concern-first direction for new `/play` onboarding only.
# D-2026-11-02 — MP20 two-question contextual discovery

The owner supersedes MP17 concern-first and MP19 adaptive multi-question details for new onboarding: after world-first selection, ask exactly two screens: one concern, then optional concern-specific multi-select factors. Retain MP19 world-first selection, direct selected-region entry, eight visible regions/two playable, and returning-player compatibility. Question bank renders deterministically without Gemini. Extend existing profile answer bounds to 12 labels/IDs so one multi-select answer can be preserved; this is backward-compatible and does not add database columns. The existing account-scoped Plan API and NPC eligibility/proximity remain authoritative.

My Journey is the combined suggestions-and-selected inventory hub. Goal suggestion cards remain optional; user choice is required. Botanical/practice previews are non-equipping links to the real NPC. Empty reviewed Botanist catalog stays CONTENT_BLOCKED; do not seed or upgrade demo records. This decision does not grant live Gemini inference authorization. Medical topic wording is aligned to NIAMS/NHLBI/NIDDK source topics noted in KNOWLEDGE_AND_SAFETY_SPEC; localized editorial review and full clinical sign-off remain open.

Safety implementation note: recurrent painful/swollen joint history is stored as a reported factor only. It must not be translated into “currently acute painful joint”; that separate existing safety field stays `unknown` absent a direct current-symptom answer.

My Journey-only interaction update: when the player checks a recommendation and has already chosen a valid A/B or completed Custom option, that checkbox is the explicit confirmation and the current Plan revision is saved immediately through the existing signed, account-scoped Plan API. Unchecking removes the item from the current revision while API version history preserves earlier revisions. Existing unrelated goals are merged forward; saved choices for the same generated suggestion are rehydrated. The separate standalone Builder retains its explicit Confirm Plan flow. This implementation is source/build verified but still needs authenticated API/browser acceptance before calling it functionally verified.


### Decision 2026-11-03: bind current recommendation state to verified discovery context

Use the verified account's saved Quiz profile as the authoritative Advisor input. Preserve the two-question onboarding context through activation, require it to match the selected World, bind recommendation cache entries to account + World + canonical concern/factor/safety context, and prevent a stale Plan revision from being presented as current. Keep prior Plan history and profile preferences. Use the current JSONB contract with an optional hashed context key; do not add a migration. Gemini live inference remains an owner action and is not run by implementation tests.
