## Realtime Multiplayer Presence & Clinical Privacy Boundary — 2026-11-08

Synchronous village presence (`healthclues_online_presence` / `/api/healthclues/world/presence`) is strictly separated from private medical data, personal habit lists, check-in journals, and quiz profiles. Only ephemeral presentation fields (`nickname`, `avatar_key`, coordinates, direction, and predefined social greetings) are transmitted. Presence heartbeats auto-expire after 15 seconds. Players cannot view another user's health concerns or private daily care plans through presence interactions.

## Google OAuth & Privacy Handoff Boundary — 2026-11-06

Pending journey profiles, chosen quests, and confirmed Wellness Plans created during guest preview are held transiently in client `localStorage` (`healthclues-pending-journey-local`) and encrypted session context solely during the OAuth/Magic Link authentication transition. Upon verified sign-in callback, the authenticated user identity is bound to the payload, merged into private `healthclues_profiles`, and synced to their owned World. Full quiz answer sets and marketing consent are not joined.

## Quick-activate deprecation & Auth Boundary — 2026-11-05

The session bypass route `/api/healthclues/account/quick-activate` is permanently shut down with HTTP 410 Gone. All account activation and sign-in requires authentic email magic link verification via local Supabase Auth and Mailpit. Cross-account isolation was verified in CDP: Account 2 cannot read Account 1's private World or check-in state.

## Phase 10A — private Wellness Plan data (2026-10-30)

Plan selections and personal goals are private owner/World data. Guest plan choices remain transient in component memory and the existing short-lived encrypted HttpOnly pending-journey cookie; no URL or browser localStorage storage. A confirmed plan is saved only after verified authentication and explicit activation consent. Personal free-text goals are user-created and unreviewed, never promoted to shared Catalog or Community content. The Phase 10A.2 authenticated local Chromium E2E verified owner isolation for the plan API: guest access returned 401 and cross-account reads/writes returned 404. This is scoped isolated-demo evidence, not production security certification; see `reports/HEALTHCLUES_PHASE_10A_ACCEPTANCE.md`.

## Local companion privacy and use cases — 2026-10-30
Nickname, Journey context, recommendation rationale and NPC questions remain private and authenticated; profile reads/updates are scoped through the owned World, and public Community projections do not receive these fields. NPC external processing is opt-in per question and disabled in the isolated Owner Demo. The current use cases reuse profile, World, Collection, Backpack, Care Plan and existing daily check-in. Browser verification and unverified reminder/provider limits are documented in `CURRENT_STATE.md` and the final acceptance report.
# Community & Privacy Specification

## Pending personal-goal note handling — 2026-10-31

The short-lived activation handoff may carry the player's exact bounded `originalNote` within the confirmed Plan. It remains inside the encrypted HttpOnly cookie, bound to the destination email, and is not copied to URLs, localStorage, Community projections, analytics, or email content. Wrong type or notes over 180 characters are rejected. Local Chromium verified preservation through same-build Mailpit verification and owner-scoped World Plan storage; this is not a production security certification.

## Recommendation profile/history minimization — implementation 2026-10-30

Personalized recommendation profile stays in the existing owner-only Quiz profile/World boundary. The private event history stores only event codes and Catalog references; it does not duplicate health answers, medication names, narrative notes or preference snapshots. Recommendation APIs validate World ownership server-side; no recommendation or Journey data is added to public Community profile, notification or share payloads. TEST ONLY fixture exposure is guarded to the loopback Owner Demo.

## Region scene privacy boundary — updated 2026-10-30

The shared two-region route, NPC stations and contextual labels are presentation/navigation only. Opening a map, moving or meeting an NPC does not publish movement/route data or enable Community sharing. The active health topic, Care Plan, Journal, check-ins and Toolkit remain private under the existing owner-scoped APIs. This UI change adds no schema/API authorization, analytics-consent or RLS behavior.

## 1. Data boundary
Private `journey/check-in/journal` is owner-only. Public experience is a separately materialized `Public Journey` projection with explicit consent/version and allowlisted fields. Public API/service reads the projection only; it must not accept a public journey ID then join private notes. Alias helps presentation but cannot promise anonymity: dates, details and writing style can identify people.

## 2. Public Journey lifecycle
Private by default → owner chooses scope/alias → preview exact fields → explicit confirm → safety/moderation checks → active projection → editable/revocable → revoked/taken down. Owner can share a whole journey, selected milestone or selected reflection, never entire journal by default. Public fields may include chosen topic label, elapsed time bucket, chosen activity summary if template approved, self-reported frequency with timeframe, milestone, challenge, edited reflection, and selected check-in count. Exclude exact health status unless deliberately reviewed/consented; notes, measurements, email, location, raw quiz/profile, medication, allergy, private activity data and unselected dates are always excluded.

## 3. A → B workflow
1. A creates private journey and check-ins; nothing is public.
2. A explicitly enables projection and selects fields/alias. “Real People, Real Wellness Journeys” displays the personal-experience disclaimer.
3. B discovers and reads only active projection. Follow stores a relation, not permission to A’s private rows.
4. B selects Start My Own Journey. System maps safe reviewed template IDs/themes, re-runs B’s profile, preference and safety filters, drops self-created/unreviewed or risky activities, creates an editable draft and explains what was adapted.
5. B confirms; B receives own activity IDs, schedule, progress, XP and private journal. Provenance to A is optional and revocable; no A raw note copied.
6. If A revokes, A projection and cached copy become inaccessible. B’s independent journey stays; any embedded A text is removed or replaced with neutral attribution marker according to B’s choice and policy.

## 4. Follow, comments and updates
Follow is explicit, per-journal and adjustable by event type/frequency/channel. Default no email. Owner can disable comments, block a member and report abuse. Comments must not be interpreted as clinical advice; prohibit prescriptions, diagnosis, cure assertions, harassment, selling and requests for private contact/medical records. Rate limit, spam filtering, report, hide pending review and appeal. Public updates publish only from explicit selected events; check-in never auto-publishes.

## 5. Permission matrix
| Capability | Guest | Member | Journey Owner | Moderator | Admin |
|---|---:|---:|---:|---:|---:|
| View approved Knowledge | Yes | Yes | Yes | Yes | Yes |
| View active public projection | Yes, limited/rate-limited | Yes | Yes | Yes | Yes |
| Read own private journey/journal | No | Own only | Own only | No by default | No by default |
| Edit own World/check-in | No | Own only | Own only | No | No |
| Follow/comment/report | Report/view; no follow proposed | Yes | Yes; manage own interactions | Yes | Yes |
| Enable/revoke own sharing | No | Yes | Yes | No | No |
| Review community reports | No | No | No | Assigned queue | Oversight, audited |
| Review/activate knowledge | No | No | No | Not by default | Reviewer role only |
| Configure rewards/analytics | No | No | No | No | Explicit operator/admin role |
| Read global private notes | No | No | No | No | No, except narrowly approved incident process with audit and user/legal basis |

Role separation: journey owner status is resource-specific, not global privilege. Admin role must be split by reviewer/moderator/operator. Access to rare private-data incident workflow requires separately approved policy, justification, time-limited access and audit.

## 6. Moderation protocol
Reports include misinformation/medical claim, harassment, privacy/identification, spam, dangerous regimen, other. High-risk treatment/cure/dosing claim can be hidden pending review; moderator examines public material only, preserves minimum evidence in restricted audit, chooses restore/redact/remove/owner warning/escalate, records reason. Provide reporter status and owner appeal. Do not treat report volume as truth score. Reporters cannot see private moderation notes.

## 7. Revocation, removal and deletion
Revoke is immediately enforced at read endpoint and stops new notifications; purge feed/search caches and public metadata by proposed SLA ≤15 minutes. Search engine recrawl may lag; return noindex/unavailable immediately. Comments can be removed/anonymized per owner deletion policy. Downloaded screenshots by third parties cannot be technically recalled; communicate this before sharing. Account deletion revokes all projection consent and removes public surface; retained safety/legal audit is minimized, access restricted and time-limited.

## 8. Abuse prevention and privacy controls
TLS, RLS, server-side authorization, rate limits, CSRF/session controls as applicable, signed share-management links with expiry, no sequential IDs exposed, no public search of private profiles, minimal analytics, no sensitive content in logs/URLs/email subjects, download/export safeguards, user block/mute, report throttle with abuse review. Public content moderation cannot guarantee anonymity.

## 9. Wellness Toolkit community matching
Community matching uses `catalog_item_id` and `usage_method_id` as distinct typed keys, never text similarity over journal notes. A visitor can select **Same catalog item** (e.g. same ingredient, without implying same preparation) or **Same usage method** (e.g. same reviewed recipe/activity version). Related-item browsing is a separate relation and must not masquerade as exact match. Search may filter by owner-selected public goal/preference facets only; sensitive profile, quiz answers, allergy/medical context and private routine stay out of query predicates and response details.

Public tool timeline rows are a separate allowlisted projection with consent version, including individually projected timeline events so visitors can see the actual sequence A chose to share. Owner selects the item/method and date range; chooses date granularity (day/week/month) and which statuses/frequency buckets are visible. Exact time, count/amount, location and notes are off by default; exact date or occurrence count requires distinct explicit consent, and therapeutic dose/amount is not a shareable toolkit metric. The public timeline labels all usage/outcomes as self-reported, not verified or evidence of treatment effect. Never advertise “people using X improved/cured Y” or rank catalog items by outcome. Suppress aggregate counts/facets for small cohorts. A deliberately published individual journey may still be reachable by its public card/link, but the interface must not reveal cohort size or imply that the owner represents a group.

Personal tools remain private and unreviewed. The owner may submit a normalized proposal; proposal processing strips journal notes, checks duplicates/synonyms, and sends only minimal proposed name/type/description for review. A reviewer can map it to an existing canonical item, add an alias, create a new ID after duplicate checks, request changes or reject. Consent to propose does not consent to public sharing. Approval does not publish that owner’s usage or experience.

## 10. Toolkit privacy threat cases
- **A shares ingredient but not method:** B sees an ingredient match only; no inference that A cooked a particular recipe.
- **A shares method but later revokes:** item/method projection and search cache become unavailable; B’s already-created independent entry remains and does not retain A’s private usage rows.
- **Rare item or goal reveals identity:** suppress aggregate counts/facets and offer broaden-match; do not disclose exact number of matching people below threshold. A direct individual public journey is shown only if its owner explicitly consented to that item/method projection.
- **User enters sensitive note as a personal tool description:** mark private; warn against entering medical/dosing data; never feed to global catalog normalizer or community query without explicit redacted proposal consent.

## Combo journeys in Community
A public journey may show selected canonical item IDs, method IDs and owner-selected slot assignments only with explicit consent. Combo name alone does not disclose hidden components. Recipe ingredient relations appear only when owner selected those fields and content is active/reviewed. Matching separates ingredient, recipe item, method and public goal; it never reads private profile/journal rows.

When a member starts from a public Journey Combo, rematch each component against their consented profile and active reviewed versions. Drop unsafe/unreviewed components, show per-component rationale, allow reviewed partial acceptance, and require confirmation. Never copy private notes, exact counts/dose, medical context or outcomes. Community combo history is not efficacy evidence.
# Current product boundary — 2026-10-28

Community Village/Guild/chat/multiplayer là future scope trong Master Prompt 08 V2; không đưa vào hai playable region maps. Public journey remains explicit, field-scoped consent projection; Quiz concern, private Toolkit/Check-in/Journal và pet dialogue nhạy cảm không tự công khai. Community code/API có tồn tại nhưng không đồng nghĩa với Village game scene hoặc release approval. Xem `CURRENT_STATE.md` và release readiness mới nhất.

## Local owner-demo privacy boundary — 2026-10-29

The authenticated owner demo is isolated from production: its app receives only local Supabase endpoints/keys confirmed by the dedicated local project, and email is captured by local Mailpit. Never load production `.env.local` values for demo writes or send real email from test flows. Pending pre-registration context remains in the existing encrypted, short-lived, HttpOnly cookie; do not copy Quiz answers or derived health profiles into localStorage, URLs, email, analytics or logs. The confirmed Auth identity must match the pending email before resuming. See `reports/OWNER_PLAYABLE_AUTH_ACCEPTANCE.md` for verified scope and limitations.


## 09B Community presentation note — 2026-10-29

The authenticated World scene no longer stacks Community Journeys as a section in the scrolling World page; the current game HUD opens Community as a contextual interface. Existing consent, owner scoping, moderation and privacy rules remain authoritative and were not relaxed. This visual entry-point change is not a new Community feature or a full Community regression claim; see `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md` for tested scope.

## 09B first-time guide privacy note — 2026-10-29

Guide persistence is limited to the authenticated user's owned World and a non-sensitive version/stage value. The guide row contains no discovery answers, health concern, tool selection or dialogue content. Its API checks ownership and disables caching; the database enables RLS and revokes direct client-role access. See `DATABASE_DESIGN.md` and `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md`.


## Master Prompt 09C — dữ liệu Care Plan riêng tư (2026-10-29)

Các method do người dùng tự nhập, medication record chép từ nhãn/prescription và self-report của Care Plan là dữ liệu riêng tư theo account + World. Nội dung không được xuất bản vào Encyclopedia/Community, không tự equip, không cấp XP/reward và không được phân tích thành chẩn đoán hay hiệu quả điều trị. API yêu cầu user đã email-confirmed, xác minh World thuộc user cho mỗi thao tác, trả response no-store, và không log giá trị record. Bảng local mới bật RLS, thu hồi quyền truy cập trực tiếp của anon/authenticated, chỉ cấp service role; foreign key ràng buộc cả user/world/record. Xóa user/World cascade theo schema hiện tại. Các kiểm tra này đã chạy trên local owner-demo synthetic accounts, không phải security certification.

Medication records chỉ phản ánh văn bản do user nhập; HealthClues không suy ra liều/timing hay khuyên dừng/thay đổi thuốc. Khi đồng thời có herbal record và medication record, UI hiển thị notice tương tác chưa được kiểm tra. Chưa có clinical interaction-checking, encrypted-field design, retention/export/legal/privacy review hoặc production RLS/Auth validation; vì vậy các record này chưa sẵn sàng cho production.


## 09D-R privacy boundary note — 2026-10-29

The Region Map movement/camera refactor is presentation-only. It adds no new persistence, analytics, public profile fields or sharing behavior; existing Auth, owner-scoped APIs/RLS, Care Plan and privacy boundaries remain unchanged. Isolated account-isolation regression is recorded in `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md`.

The optional Daily Pet reflection introduced in the final delivery slice is transient unless a player explicitly copies it into their private Check-in note and saves it. It is never sent to Community, public profile, or analytics. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.


## Regression evidence note — 2026-10-29

The isolated owner-demo E2E was rerun after region-navigation changes. It confirmed private Care Plan access isolation between two synthetic local accounts and confirmed that the map/HUD do not publish Journey or Care Plan answers. This is local regression evidence only; it changes no sharing defaults and is not a production security certification. Full scope and limitations are recorded in reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md.

## Learning game records — 2026-10-29

Mini-game completions are private, owner-scoped learning activity records. They store only the allowed game ID, Skill key, owner World reference and completion timestamp; no Quiz answer, health concern, symptom, medication or free-text response is stored. Local demo games are synthetic and gated to the isolated owner build. RLS restricts reads to the owning account; the validated service RPC creates a unique completion. Do not publish these records to Community or external analytics.

## Local owner-demo account-isolation evidence — 2026-10-30

The fresh authenticated browser run on `app-build-final-a7` verified that the second synthetic account did not inherit the first account's World or Care Plan: owner lookup for the first account's private Care Plan returned 404, and the second account initially had no World. The Daily Companion answer was copied into the private note only after explicit opt-in. These tests use the existing isolated local project and do not certify production privacy/security, retention or access controls.

## Local demo equipment and Daily Companion boundary — 2026-10-30

The isolated owner demo's `hc-demo-*` catalog rows are test fixtures, not reviewed/published content. Their demo equipment eligibility is an explicit separate flag and the API only accepts it in the isolated Owner Demo runtime; deployment/production eligibility remains closed. Collection and toolkit operations resolve through the authenticated user and owned World. Additive slot-position migration keeps legacy action-category values and backfills existing equipped positions without deleting rows. Private daily status includes `unsure`, distinct from no report; notes and usage records do not flow to Community or public profiles. The final Chromium run confirmed the second synthetic user cannot read the first user's equipment/Collection/Care Plan/check-in data. This is local demo evidence, not production security certification.
# Recommendation privacy implementation — 2026-10-30

Personal recommendations are returned only from an authenticated request for a World owned by that user. Community projections do not include profile, Quiz, medication, check-in, feedback or recommendation history. The new history stores only private item/version references, constrained event/reason codes and rules version; direct client table grants are revoked and RLS is enabled. Active medication presence can gate explicitly marked catalog options, but the recommender receives only an owner-scoped boolean and never reads/returns the medication name or instructions. Production privacy/security review remains required.



## Phase 10A.2 pending onboarding boundary ? 2026-10-30

The existing encrypted short-lived HttpOnly pending-journey cookie now compresses the serialized payload before AES-GCM encryption to remain within browser cookie limits. The versioned `z1.` envelope is read alongside the legacy envelope for compatibility; new cookie payloads are size-limited. Quiz/Plan data remains out of URLs, localStorage and logs. Browser activation verification was exercised against the isolated local Auth/Mailpit stack. This does not change persistence consent or production security approval. See `reports/HEALTHCLUES_PHASE_10A_ACCEPTANCE.md`.

## My Journey private projection — 2026-10-31

The in-region My Journey panel reads the current owner’s Quiz focus and Plan from the same authenticated World bootstrap already used by Quests. It does not add storage or send personal goal text to community projections. Access to the full editable Plan remains through the existing owner- and World-authorized Plan API. Empty-state recovery may reuse a saved profile but must not persist or activate suggestions without explicit confirmation. Two-account isolation is included in the acceptance regression; this does not replace production privacy review.

## World onboarding data boundary — 2026-10-31

The first-entry tour and My Journey summary remain private and owner/World scoped. The tutorial may read the authenticated user's existing Quiz focus and confirmed Plan through current authorized APIs, but does not copy goals into public Community data, send them to analytics, or persist new health data. A missing Plan must not be inferred from suggestions. Cross-account denial and guest access are covered by the local Owner Demo regression; this does not substitute for production security review.
## Local Gemini secret handling — 2026-10-31

The Owner Demo loads Gemini configuration only after build into the server process from the ignored `App/secrets/healthclues-owner-demo.env`; Gemini variables are excluded from the build environment and no `NEXT_PUBLIC_*` key is used. The env file is outside public assets and is not tracked. One diagnostic accidentally emitted the current key in tool output; treat it as exposed and rotate before any provider request. Never log the secret value. Gemini/browser acceptance remains blocked until rotation and a fresh synthetic-only inference test.


## My Journey privacy boundary — 2026-10-31

My Journey đọc Quiz focus, Confirmed Plan và equipment qua World của session đã xác thực; ownership do backend xác minh, không tin World ID do client tự chọn. Goal note, wellness focus, equipment và hoạt động không được đăng công khai từ panel này. API cross-account Plan/inventory mutations được kiểm tra trong Chromium local; đây không phải chứng nhận production. Local fixture tiếp tục gắn nhãn TEST ONLY.

## Guided My Journey Pet copy — privacy note (2026-10-31)

Luna/Lumi's three inventory explanations are rendered from existing authenticated World/profile state and static explanatory copy. This change adds no new health-data storage, public Community projection, analytics event or cross-account read. Existing owner/World access boundaries remain unchanged; local E2E evidence is not production security certification.

The four-step My Journey focus presentation likewise reads only the already-authorized World payload and local tutorial step. Its full-map dimmer is presentation-only; it blocks player map gestures while active and adds no storage, analytics, Community projection or identity/profile fields. The English auth-callback locale provider is presentation context only and does not alter tokens or authorization. Owner-auth and account-isolation checks ran only on the isolated local demo.
## MP17 discovery handoff privacy delta — 2026-11-01 (implementation partial)

The new-player branch carries only the selected canonical focus and short structured discovery answers in the existing encrypted, short-lived pending-journey activation payload. Account activation remains an explicit verified-email flow; only authenticated profile/World APIs may persist the profile. The browser stores temporary progress in session storage until handoff. Do not log raw health answers or put provider credentials in the client. Two-account privacy/isolation for the new profile extension still requires dedicated Chromium verification; no production data or provider inference is part of this checkpoint.
# MP20 profile data boundary — 2026-11-02

The two-screen discovery context uses existing bounded `adaptiveDiscovery` profile data: selected concern label/detail and at most 12 selected factor IDs/labels, plus one bounded optional note. It is carried through the existing encrypted pending-journey handoff; no new table or production data access is authorized. Do not put Quiz answers in community posts, logs, analytics or client-visible provider credentials. Gemini context remains server-side and receives only submitted factors, selected World, locale and known safety fields. Existing consent, account-isolation and authenticated Plan boundaries remain unchanged.


### MP20 handoff boundary
The two-question profile remains in the existing short-lived encrypted HttpOnly handoff after explicit consent, then moves only through authenticated profile/World APIs. A Quiz answer may be empty; canonical selected IDs/labels are bounded to twelve. Do not write the temporary profile into localStorage, URLs, community content, analytics or logs.


### 2026-11-03: verified discovery profile and recommendation cache boundary

The pending onboarding handoff remains encrypted and bound to the verified account email. After activation, merge the selected Quiz profile into that account's existing HealthClues profile; preserve preferences and previous Plan history. World Advisor requests require authenticated ownership of the World and use the account's stored Quiz context. Cache fingerprints are opaque hashes scoped to account, World and discovery/safety context. Logs contain only sanitized request IDs, lifecycle stages and bounded status/count metadata, never concern answers, free-text notes, prompts, model output or credentials.

### 2026-11-03: Pending encryption key resilience
Pending journey encryption requires a secure AES-256-GCM key derived from `HEALTHCLUES_PENDING_JOURNEY_SECRET` (falling back to `SUPABASE_SECRET_KEY` in local development/test runtimes). No unencrypted Quiz profiles or raw health concerns are stored in client cookies, local storage, or URLs.
