## AT-HC-TESTER-HANDOFF — Independent local review lifecycle (2026-11-05)

- Starting `tester.bat --check` must validate prerequisites without launching Codex or claiming product acceptance.
- A real first run creates one dedicated Tester thread; later runs use its stored ID rather than `--last`. Each run snapshots any Antigravity handoff, re-reads current docs/source, and writes a unique review plus current run pointer.
- Batch exit 0 means a fresh, schema-valid review exists. Verdict is independently normalized from ten required checks: FAIL → REWORK, any UNVERIFIED/external blocker → BLOCKED, otherwise PASS. A PASS without specific current-run evidence must be rejected.
- On a failed Codex run or malformed review, batch exits nonzero, `LATEST.json` reports `ERROR`, and Antigravity must not read a stale prompt as new work. No source/data/production writes or live AI health calls are authorized by this tester.
- Evidence so far: launcher `--check` and three focused review-contract/process tests passed. End-to-end Codex resume, browser/mobile review and Antigravity repair loop are NOT VERIFIED; see `reports/TESTER_RUNNER_ACCEPTANCE.md`.
- First real run `20261105074323264-26508` completed with `REWORK`, proving first launch and result handoff. It left auth/new-player checks UNVERIFIED after interpreting an ambiguous data-read-only brief, and cited mobile captures outside the allowed workspace. The brief now requires verified local demo identity before any fresh synthetic test-account write and workspace-local visual evidence. A second real resume and complete flow remain unverified.

## AT-HC-PLAN-SIGNED-TITLE — Generated option persistence compatibility

- Given a valid signed A/B recommendation, the exact selected action may be used as the visible Plan title and must pass proof verification when the remaining signed fields match.
- The historical localized recommendation title remains verifiable for already-saved goals.
- A title unrelated to either signed value, a changed tracking action, or mismatched option metadata must fail verification.
- Verify offline with the existing personalized Plan contract suite; do not call Gemini or write account data for this test.

## 2026-11-02 Plan contract source assertion

The offline personalized-plan contract checks that the AI-goal checkbox binds to its `included` state and exposes the localized accessible “Include goal” label. This is a source contract only; interactive checkbox/A/B/Custom behavior is covered by the separate Chromium cases.

## HC-UI-REDESIGN-2026-11-02 — Botanist, Plan Builder and My Journey

Use isolated Owner Demo `http://127.0.0.1:3322/play`, local Supabase reused read-only, and authenticated synthetic accounts. Intercept all Advisor responses locally; this case must not call Gemini.

- At desktop 1440×900 and mobile 390×844, approach Botanist and choose Talk. Verify localized greeting and open station. Current fixture set has no reviewed botanical entry eligible for this Journey, so verify an honest empty state and absence of TEST ONLY nutrition fixtures. **PASS** for Talk and localized greeting/empty-state visuals. Item details/Save/Equip are not claimed because the eligible catalog is empty.
- Open Plan Builder in VI and EN. Verify localized content, independent checkbox per goal, subdued unchecked cards, live selected count, A/B/Custom controls, disclaimer, Confirm and Skip. Capture the initial mobile viewport and a scrolled goal-card viewport. **PASS** for reference structure and interaction; fixture content remains explicitly synthetic.
- Select goal 1/A, goal 2/B, goal 3/Custom, leave goal 4 unchecked, confirm via Plan API, open My Journey and reload. Verify exactly three Active goals, unique IDs, exact Custom text, and absence of goal 4 and the Custom card's A/B alternatives. Verify zero-selection confirmation, standalone Add My Own Goal and cross-account Plan/profile read/write denial. Synthetic fixture Chromium run: **PASS**, two Advisor requests intercepted, zero runtime exceptions.
- Switch Account A's same Plan EN→VI→reload. Compare saved IDs, active state, A/B levels and numeric values, and visually inspect localized My Journey. Custom authored text remains unchanged. **PASS** with bilingual synthetic fixture.
- Capture and open Botanist greeting/empty desktop/mobile; Plan VI/EN, selected/unselected, Custom desktop and mobile; My Journey desktop/mobile top and lower scroll. Evidence: `reports/previews/visual-redesign-20261102/`. Compare screenshots directly with `references/healthclues-plan-reference.png`; source-level rendering alone is not visual acceptance.

# MP17-FINAL-2 — actual Plan persistence with explicit synthetic fixture — 2026-11-02

Run `node scripts/test-healthclues-mp17-goal-first-browser.mjs` against the current isolated reuse-only Owner Demo at `http://127.0.0.1:3316/play`. The test intercepts all Advisor/adaptive requests in Chromium; it must not call Gemini. With two new synthetic local accounts verify concern-first onboarding, local Mailpit confirmation, region entry, three selected A/B/Custom goals with the fourth omitted, actual authenticated Plan API save/read, My Journey, reload, same IDs/choices/numeric values across EN/VI API snapshots, an empty confirmed Plan, a separate unchanged user-authored goal, and cross-account profile/Plan read/write denial. Count only the final successful run as acceptance evidence. Expected result: `PASS_SYNTHETIC_FIXTURE_UI_TO_PLAN_API_PERSISTENCE_LOCALE_ACCOUNT_ISOLATION_AND_ZERO_PLAN`, zero browser runtime exceptions. Fixture success is not live Gemini inference or AI recommendation quality evidence. Screenshots are in `reports/previews/mp17-goal-first-fixture/`; inspected acceptance captures include `account-a-vi-synthetic-recommendations-desktop.png`, `account-a-vi-confirmed-plan-desktop.png`, `account-a-vi-custom-goal-my-journey-desktop.png`, and `account-b-en-sleep-zero-goal-plan-confirm-desktop.png`.

The confirmed account's visible My Journey is verified before locale switching and after reload. Locale switches return to the World surface; the same authenticated Plan API snapshot is used to compare canonical IDs, active choices, A/B levels, numeric actions and exact custom text after each switch. This test does not assert that My Journey stays open across locale navigation. Real Gemini is not called; no recommendation-quality PASS is implied.

# MP17-FINAL — authenticated goal selection persistence, locale isolation and re-login — 2026-11-01

On the isolated Owner Demo `http://127.0.0.1:3310/play`, use two new synthetic accounts (VI/HealthClues Realm and EN/Sleep Valley). Run `node scripts/test-healthclues-mp17-goal-first-browser.mjs` with synthetic adaptive replies explicitly disclosed. Verify Mailpit activation, correct World/Pet, zero-goal confirmation, actual Add My Own Goal UI → authenticated Plan API persistence, three simultaneously visible My Journey sections, reload, logout/new magic-link login, same user/World/locale/goals, RLS profile isolation and cross-account Plan GET/POST denial. The harness also validates and signs synthetic A/B goal contracts server-side and sends exactly selected A, selected B and selected custom note through the real Plan API, omitting a fourth deselected goal; API readback and idempotent request-key replay must preserve exact option/action, exact custom text, active selection and three-goal count. This synthetic signing/API path is not genuine Gemini output and is not the same as an actual recommendation-card click-through. Latest run: PASS, 0 browser runtime exceptions. Screenshots: `reports/previews/mp17-goal-first-fixture/account-a-vi-after-logout-login-mobile.png` and `account-b-en-sleep-after-logout-login-mobile.png` (plus desktop captures in the directory). Full original-96-question returning-profile regression, broad NPC localization and real Gemini inference are still open; overall MP17 remains PARTIAL.

## AT — Wellness Plan Phase 10A (2026-10-30)

Đã chạy unit selection/safety 13 assertions, playbook 8 assertions, personalization rules suite; kết quả chi tiết ở reports/HEALTHCLUES_PHASE_10A_ACCEPTANCE.md. Build isolated thành công trước lần cập nhật cuối của API gate; build cuối đang chạy. Chưa chạy browser acceptance, DB persistence/authorization, desktop/mobile screenshot hay two-account isolation do chưa xác minh được local DB identity (Docker named-pipe permission denied). Root tsc bị ảnh hưởng bởi .next/types/validator stale route union; cần dùng isolated build, không xóa baseline. Không đánh dấu end-to-end acceptance PASS.

## Local reminder and mobile surface evidence — 2026-10-30
The latest authenticated browser run opted in a verified synthetic account, simulated the due time, verified one generic Mailpit reminder and zero duplicate sends after repeating the worker, paused the setting and read back the saved delivery state. The same run captured Toolkit Summary and Reminder Setup at 390×844 and checked no horizontal overflow. Reminder preference UI editing/resume/disable, physical devices, worker crash recovery, production email/scheduler and real AI remain unverified. See `CURRENT_STATE.md` and the final Vietnamese acceptance report.

## 2026-10-30 local guide and companion acceptance evidence
The updated owner-auth browser E2E passed on `http://127.0.0.1:3257/play`: nickname write/read, saved Gout Journey and NPC arrival, three independent Journey summary sections, guide resume after reload through optional reminder skip, authenticated owner data, existing learning/reward regressions, and zero runtime errors. Gout playbook unit test passed 8 assertions. Provider-disabled chat returned an honest unavailable state. The latest reminder-specific acceptance additionally verifies one opted-in local Mailpit delivery and dedupe, plus mobile Summary/Reminder screenshots; it does not verify real AI, cloud scheduling or production behavior. See `CURRENT_STATE.md` for screenshot links and exact scope. Do not report these as PASS.
# Acceptance Test Specification

### One controlled live Gemini request — 2026-11-02

- **Provider reached:** yes; current runtime had no mock/preload, `ADVISOR_STARTED` reported the Gemini adapter and `PROVIDER_RESPONSE_RECEIVED` reported provider status 200.
- **Application response:** HTTP 503 JSON `AI_UNAVAILABLE`, diagnostic `RESPONSE_SCHEMA_MISMATCH`, correlation ID `dfc91e62-8e4a-44a8-894f-ae4b62e5803b`; PowerShell 5.1 captured status/body/request ID. Duration 12,827 ms client / 12,562 ms server.
- **Pipeline:** request received, input validated, advisor started, provider request and response, JSON extraction and JSON parsing passed; failed schema validation at `SCHEMA_VALIDATED`. Last completed stage: `JSON_PARSED`.
- **Schema paths:** `goals[0-3].goalId`; each must match `^[a-z][a-z0-9-]{2,59}$`. Four invalid candidate IDs, zero valid goals. Sanitized logging does not preserve actual values or Zod issue codes/types, so missing vs wrong type vs pattern mismatch cannot be distinguished. Safety validation and Plan mapping did not run.
- Exactly one real inference was made; SDK attempts configured to one total attempt. No repeat, persistence, or real-user data. Recommendation quality and EN/VI goal localization are **NOT ASSESSED**.
- **Result: REAL_GEMINI_PARTIAL.** No live success claim. A new inference requires new authorization.

### Gemini diagnostic runtime activation — 2026-11-02

- **PASS:** fresh isolated current-source build `gemini-diagnostics-20261102` runs at `http://127.0.0.1:3312`; route artifact is present; prior 3311 server remains untouched.
- **PASS:** read-only local Supabase Auth/REST/Mailpit preflight. No migrations/seeds; `.env.local` was not modified.
- **PASS:** server-only Gemini env file parses; configured key/model/provider are present and valid without printing values. Runtime correlated events confirm provider configuration. Scan of 67 client JS chunks found neither API key value nor `NEXT_PUBLIC_GEMINI_API_KEY` identifier.
- **PASS (HTTP mock):** valid synthetic A/B -> HTTP 200 / one accepted goal; mocked provider 503 -> captured as provider status 503, app 503 `PROVIDER_UNAVAILABLE`; missing `optionB` -> app 503 `RESPONSE_SCHEMA_MISMATCH`, failed stage `SCHEMA_VALIDATED`. PowerShell 5.1 captured sanitized non-2xx JSON, content type and correlation ID. Matching IDs exist in server logs.
- Mock preload is external to built application, tightly guarded to this loopback diagnostic build and removed from the final running process. No real Gemini inference occurred.
- **READY:** `READY_FOR_ONE_LIVE_SYNTHETIC_TEST`; the live test remains unrun.

## AT64 — Quiz Plan original-note email handoff and current-build regression — 2026-10-31

Use the isolated Owner Demo build 3269. Complete a new Gout Quiz, explicitly configure/skip goals, add a natural-language goal draft, confirm the Plan, request activation consent, verify through local Mailpit, and ensure callback stays on the tested build. After creating the World, assert the same World ID/profile/Journey and confirmed Plan persist, including both the exact `originalNote` and its saved/inactive state. Then reload and check owner isolation. Run `test-healthclues-post-quiz-plan-browser.mjs` and full `test-healthclues-owner-auth-demo.mjs`; require zero browser runtime errors. Current run PASS local; does not claim live AI, human editorial approval, production email, or physical-device QA.

## AT62 — Real-time Codex Quiz advisor — BLOCKED pending ephemeral/provider privacy control

Before any browser test can send a Quiz profile, verify the server-only provider supports a non-persistent session or a dedicated local inference worker. Then use two synthetic accounts and prove: a fresh provider invocation per Quiz completion, minimized profile input, strict structured output validation, server-side safety/evidence filtering, honest provider failure, user selection/confirmation, same-World reload persistence and cross-owner denial. Confirm no raw health payload appears in app/provider logs or persisted AI session files. Until that gate passes, this case is **BLOCKED / NOT RUN**; the current deterministic fallback must remain labeled as such and must not be claimed as live AI.

## AT63 — Integrated onboarding, unsupported-topic fail-closed and RPG regression — 2026-10-31

Run `scripts/test-healthclues-post-quiz-plan-browser.mjs` and `scripts/test-healthclues-owner-auth-demo.mjs` against the isolated Owner Demo build `http://127.0.0.1:3269`. Verify Gout/Sleep plan persistence and account isolation, Digestion returns zero unrelated suggestions even when a generic unknown Catalog-tag candidate exists, empty-plan World activation/Lumi and mobile Pet framing, verified Mailpit activation on the same build with confirmed Plan/originalNote, then run all existing RPG regression. Latest local Chromium runs passed with zero runtime errors. This case does not pass AT62: no real Codex/LLM call is present, and Gout/Sleep templates remain TEST ONLY. See `reports/HEALTHCLUES_END_TO_END_PLAYER_EXPERIENCE_ACCEPTANCE.md`.

## AT61 — Post-Quiz Plan Builder local authenticated acceptance — 2026-10-30

On the verified isolated `healthclues-owner-demo` runtime and source build `http://127.0.0.1:3261/play`, run `node scripts/test-healthclues-post-quiz-plan-browser.mjs`. Chromium verifies Quiz → Gout and Sleep TEST ONLY suggestions → add/configure/adjust/skip/custom goal → review/confirm → activation consent → separate World creation → reload persistence. Assert same World/Plan revision per owner; second owner cannot read or write first owner's Plan (404). Capture and inspect 1440×900 and 390×844 screenshots and assert no horizontal overflow. This test uses already-confirmed synthetic local Auth users; it does not verify email/Magic Link callback on port 3261. Templates are not human-reviewed. Evidence and exact screenshots: `reports/HEALTHCLUES_UNIVERSAL_WELLNESS_ADVISOR_ACCEPTANCE.md`. Do not infer production readiness or other RPG acceptance from this scenario.

## AT60 — Personalized recommendation engine, owner local browser run — 2026-10-30

Implemented/tested: deterministic same-topic ranking divergence is covered by a focused test; unknown/acute/allergy/urgent/medication and demo gates are unit-tested. Latest isolated authenticated Chromium run exercises real Quiz-selected Sleep and Gout profiles, server Catalog recommendations and station filtering, Tomato general-education wording/equipment gate, Ginger unknown-medication gate, Gout movement gate, saved-state ranking, Daily Companion alternative feedback through the recommendation API, owner World persistence and cross-owner recommendation denial. Engine event migration is verified in local Supabase. Exact build URL/result and limitations are in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. This is local demonstration evidence, not approval of fixtures or production security/release acceptance.

## AT58 — Distinct character identity in both playable regions

Run the isolated authenticated owner-browser suite at desktop and mobile-emulated sizes for Sleep Valley and HealthClues Realm. Assert each role maps to its own loaded asset, both regions reuse stable NPC identities, the player walking strip advances and reverses direction, and capture role close-ups with all name labels hidden. Visually inspect player/NPC silhouettes, feet placement and separation from interaction surfaces. Evidence: latest dated section of `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`; physical device behavior is outside browser-emulation evidence.

## AT57 — Short connected Region Map exploration

For both Sleep Valley and HealthClues Realm: verify all landmark approaches lie on the authored connected route; spawn near Camp; walk to each NPC on a short route; Talk is absent before arrival and appears after arrival; closing returns to the same location; a rejected off-path/water click leaves coordinates unchanged; keyboard and touch use the same route; desktop contains the complete scene; portrait emulation keeps the scene framed and controls usable. River crossings are optional and are not a pass criterion. Rebuild the isolated owner demo before browser acceptance; source-only lint is not browser evidence.

The scenarios below remain test specifications unless explicitly listed in execution evidence. Priority: P0 release blocker, P1 core, P2 follow-up. Requirement links reference `HC-F`, `HC-UC`, `HC-BR`.

## Local execution evidence — 2026-10-27

The isolated local DB scenario and browser-backed first-playable API/UI scenario passed using `scripts/test-healthclues-world-db.mjs` and `scripts/run-healthclues-game-e2e.mjs`. Verified: guest intro, eight quest cards, the ten-question onboarding path with age confirmation, optional skips and refresh/resume, result-to-tools navigation, guest/private API boundary, reviewed synthetic Catalog fixtures, three-slot typing and eligibility, one-World idempotency, structured daily usage with two occurrences, check-in edit without duplicate XP, private-note owner isolation, persisted local-time schedule, pause/resume/replacement, history retention, cross-user Toolkit denial, desktop/mobile map and equipment interactions, and state reload. DB fixture tests roll back; browser fixtures are deleted. This evidence does not cover all scenarios below or production deployment.

## Functional and journey tests
| Test ID | Covers | Preconditions | Steps | Expected | Priority |
|---|---|---|---|---|---|
| HC-AT01 | F001/UC01/BR01–04 | quiz active | complete relevant branches, skip sensitive question | adaptive flow; skip retained; result not diagnosis | P0 |
| HC-AT02 | F015/UC02/BR37 | ebook page | click quiz CTA; inspect URL/storage | opaque attribution only; download/email consent unaffected | P1 |
| HC-AT03 | F002/UC01,24/BR02–03 | member profile | change preference/revoke consent/delete field | versioned history, no unrelated consent change | P0 |
| HC-AT04 | F003/UC04,26/BR05,34 | candidate catalog | mark source expired/retracted | item suppressed from public recommendation and admin audit updated | P0 |
| HC-AT05 | F004/UC03/BR05–07 | active approved items and profile | calculate plan | ≤3, reason/source/safety/version shown; no ineligible content | P0 |
| HC-AT06 | F004/UC03/BR06 | allergy conflict and uncertain safety | request recommendation | conflict excluded; uncertainty not considered safe; no-match fallback | P0 |
| HC-AT07 | F005/UC06,30/BR09–10 | authenticated member | create World, add another branch, revisit | one World, multiple branches; history retained | P0 |
| HC-AT08 | F006/UC07,29/BR13–15 | World with 2 activities | record statuses for each | one local-day check-in with distinct states; quick flow; no implicit unchecked state | P0 |
| HC-AT09 | F006/UC07/BR14 | date without check-in | inspect timeline after date passes | no fabricated check-in, no automatic failure/penalty | P0 |
| HC-AT10 | F007/UC08–09/BR16–17 | private note exists | member A reads/edits; member B requests same ID | A sees revision; B gets denied/not-found; note absent from public/email/analytics | P0 |
| HC-AT11 | F008/UC10–12/BR18–20 | journey started 14 days ago | add, reschedule, replace, pause activity | past state preserved; new effective date; pause no penalty | P0 |
| HC-AT12 | F009/UC05,14–16/BR21–24 | A opt-in projection | guest B views/follows/starts own | only selected fields; B gets independently rematched draft, no private note/regimen | P0 |
| HC-AT13 | F010/UC23,27/BR22,25 | public risky post | report “herb cured” statement | hide/queue; moderator audit; no knowledge-catalog promotion | P0 |
| HC-AT14 | F010/UC14,27/BR22–23 | projection active and cached | A revokes; B opens old URL | immediate access denied, cache invalidated, notifications stop; B’s independent data remains | P0 |
| HC-AT15 | F011/UC17–18/BR26–29 | eligible event | retry same check-in/reward claim concurrently | one ledger award and one claim; balance explainable | P0 |
| HC-AT16 | F005/UC06,25,30 | long history | add branch then inspect old journey | no reset; overview/filter/list supports large history | P1 |
| HC-AT17 | F006–07/UC07–09/BR13,16 | timezone with DST transition | save around midnight and repeat request | one local-day entry; timestamp UTC; no duplicate; historical date timezone preserved | P0 |
| HC-AT18 | F011/UC13,18/BR27–29 | journey elapsed 7/14/30 day | advance milestone evaluator without check-in that day | milestone appears by elapsed local day; no check-in required; no streak failure | P1 |

## Permission, privacy, RLS, community
| Test ID | Covers | Preconditions | Steps | Expected | Priority |
|---|---|---|---|---|---|
| HC-AT19 | F012/UC19–20/BR30–32 | opt-in member + worker | schedule/send/pause/unsubscribe; simulate failure | generic subject; dedupe; bounded retry; unsubscribe cancels queued job; failure does not mutate World | P0 |
| HC-AT20 | F013/UC21/BR33 | approved sources and own data | ask for diagnosis, cure, dosage, or summary | no unsupported claim; citations; cannot read community/private unauthorized context; no silent write | P0 |
| HC-AT21 | F014/UC22,26/BR34–35 | reviewer/operator roles | reviewer approves; nonreviewer activates; inspect audit | least privilege, source/claim gates, individual audit; nonreviewer denied | P0 |
| HC-AT22 | F001–02/UC01,24/BR01–03 | under-18 / consent revoked | submit age No, then attempt profile read | personalization stops; consent revocation blocks relevant processing | P0 |
| HC-AT23 | F009–10/UC14–16,23,27–28 | owner, follower, moderator | exercise matrix, report, block, delete share | each role sees only allowed resource; moderator no global journal access | P0 |

## UI, map, analytics and deletion
| Test ID | Covers | Preconditions | Steps | Expected | Priority |
|---|---|---|---|---|---|
| HC-AT24 | F005/UC30 | desktop + keyboard/screen reader | navigate map nodes, switch list, zoom/reduced motion | equivalent list available; focus/labels/status understandable without color | P1 |
| HC-AT25 | F005–08 | narrow mobile viewport | navigate map, open check-in, save/edit | no horizontal-only task; touch controls usable; draft/error state visible | P1 |
| HC-AT26 | F014/UC22–23 | admin users | review item and moderate report | Vietnamese labels; reason mandatory; every state transition audited | P1 |
| HC-AT27 | F002/UC24/BR38–39 | member with share, notes, reminder | request deletion then query endpoints/jobs | share revoked and reminder canceled immediately; purge follows approved SLA; restricted audit remains only if justified | P0 |
| HC-AT28 | F003–04/BR05,08 | community story and approved catalog | use story in matching/AI retrieval | story cannot upgrade evidence or become automatic recommendation | P0 |
| HC-AT29 | F006/BR13–17 | idle user | never open check-in for several days | no synthetic activity, missed count, shame prompt or XP deduction | P0 |
| HC-AT30 | F014/BR36 | analytics enabled | inspect events/dashboard | no note, exact diagnosis, answer payload or small identifiable cell; aggregate suppression applied | P1 |

## Integration and reliability additions
- Concurrency: two World create requests for one user resolve to same World.
- RLS: cross-user reads denied for every private child relation, including FK substitution and RPC paths.
- Check-in outbox: DB failure does not show permanent XP success; retry is idempotent.
- Email timezone change: pending job recomputed safely, with no duplicate same local date.
- Public cache: revoked projection cannot be served via CDN, feed, sitemap or API stale copy.
- Template update: material edit invalidates active recommendation version until review.
- Journey A deletion after B copied: A’s public content removed; B’s user-created records remain, attribution follows policy.
- Self-created activity: appears with personal/unreviewed label; cannot enter approved catalog without reviewer flow.
- Admin audit: attempted unauthorized action recorded where appropriate, no credential/token value logged.

## Wellness Toolkit tests — HC-F016
| Test ID | Covers | Preconditions | Steps | Expected | Priority |
|---|---|---|---|---|---|
| HC-AT31 | F016/UC31/BR41–43 | Catalog has item + two methods | search/select item, inspect method cards | canonical item ID differs from method IDs; each has version/review/safety; item alone does not imply method | P0 |
| HC-AT32 | F016/UC32/BR42,44–45 | member World with branch | add same item to Collection, then equip one method to branch | state transitions preserved, item/method references distinct, schedule versioned; prior records untouched | P0 |
| HC-AT33 | F016/UC33/BR46–48,52 | equipped item/method | log one day with status only, another with optional two occurrences/count/time | rows query by canonical item and method IDs; optional fields remain optional; notes private | P0 |
| HC-AT34 | F016/UC33/BR47,52 | XP enabled | compare one and multiple self-reported uses/counts; replay usage request | no quantity/frequency-scaled XP; idempotent eligible participation award only | P0 |
| HC-AT35 | F016/UC35/BR50 | member creates private tool | create, equip, log usage, query public catalog as other user | user-scoped unreviewed object appears only to owner; never in public recommendation/catalog | P0 |
| HC-AT36 | F016/UC36/BR41,50–51 | personal tool and canonical near-duplicate | submit proposal | exact/near duplicate candidates found; user cannot assign canonical ID/review status; reviewer can link alias/create/reject with audit | P0 |
| HC-AT37 | F016/UC37/BR48–49 | A consented public projection contains item but not method | search “same item”, then “same method” | first returns item-consenting journeys only; method search excludes A; private notes/profile never queried | P0 |
| HC-AT38 | F016/UC37/BR49 | public journeys with consented public facets | filter by goal/preference and rare item | only explicitly public facets used; aggregate count/facets suppressed for small cohort; individually published item/method timelines appear only with explicit match consent; no health profile fields leaked | P0 |
| HC-AT39 | F016/UC38/BR05–08,43,49–52 | A public timeline; B profile; mixed active/inactive and personal tools | B starts own from A | reviewed active methods rematched to B; unreviewed/inactive methods omitted; B confirms schedule; no A dose/count/outcome copied | P0 |
| HC-AT40 | F016/UC33–38/BR41–52 | A uses rau diếp cá ingredient, reviewed recipe item, and walking activity/template for 30 days | A logs structured records; shares selected item/method timeline; B finds same item and starts own | data links stable IDs and versions; community distinguishes ingredient, recipe/activity item and method; A notes private; B records/XP independent; occurrence count is not a dose and no treatment efficacy claim | P0 |

## Onboarding and Combo scenarios — HC-F017
| Test ID | Covers | Preconditions | Steps | Expected | Priority |
|---|---|---|---|---|---|
| HC-AT41 | F001/UC39/BR53 | existing question bank | complete adaptive onboarding | 8–10 core target; relevant branches; bank IDs retained | P0 |
| HC-AT42 | F001/UC39/BR01,53 | guest quiz | skip sensitive item, back, resume | no fake answer; safety uncertainty filters affected item; guest sees result | P0 |
| HC-AT43 | F004/F016/UC40/BR54–55 | reviewed tools of varied types | equip all slots and try invalid slot | 0–3 accepted; max one per slot; incompatible type denied; no auto-equip | P0 |
| HC-AT44 | F017/UC41/BR56,58 | approved recipe with ingredients | inspect recipe combo | distinct recipe ID and each ingredient ID/method version retained; no substitution | P0 |
| HC-AT45 | F017/UC42/BR57,59 | approved Journey Combo | accept two, replace one, skip one | separate slot decisions persist as independent entries | P0 |
| HC-AT46 | F017/UC42/BR58 | combo contains stale/unreviewed item | preview and confirm | exact versions rechecked; no unsafe equip; partial rule enforced | P0 |
| HC-AT47 | F017/UC42/BR59 | combo shown | timeout then skip | no auto-equip; skip-all works | P0 |
| HC-AT48 | F017/UC38,42/BR60 | public combo journey and B profile | Start My Own | only consented active items rematched; reasons shown; no private data/outcome copied | P0

## Executed local evidence — 2026-10-27

- **HC-AT-E2E-01 (P0):** `node scripts/run-healthclues-game-e2e.mjs` — PASS on an isolated Docker PostgreSQL/PostgREST test database and local browser. Covers guest intro, eight Quest choices, 10-question onboarding and resume, Catalog eligibility, authenticated create/restore World, pre-World Collection save, three typed slots, daily check-in/edit, no duplicate XP, private note owner isolation, schedule, pause/resume/replacement history, cross-user denial, desktop/mobile and reload.
- **HC-AT-DB-01 (P0):** `node scripts/test-healthclues-world-db.mjs` — PASS with transaction rollback; validates World idempotency, reviewed equipment, repeat daily usage, private notes, XP dedupe, elapsed milestone and RLS isolation.
- The Collection endpoint's successful empty PostgREST response is handled without attempting JSON parsing. The full browser E2E was rerun after the fix.
- Evidence demonstrates only the listed scenarios on the local isolated test setup. It does not validate production, Community, email, Combo behavior, catalog reviewer workflow, or broad accessibility/compatibility coverage.


## Additional executed acceptance evidence - 2026-10-28

- **HC-AT04 source retraction:** `node scripts/run-healthclues-game-e2e.mjs` - PASS. A synthetic item is visible while active/reviewed/recommended; reviewer deactivation with a source-withdrawal reason removes it from public Catalog results, creates an audit event with the reason, and causes subsequent World creation with that item to be rejected. Fixture cleanup was verified. This validates the review-driven retraction path only; the fixture is not approved health content.

- **HC-AT15 concurrent check-in:** `node scripts/run-healthclues-game-e2e.mjs` - PASS. Two same-owner, same-local-date check-in POSTs run concurrently; both succeed with the same check-in ID and final XP total, and exactly one response reports an XP award. Synthetic fixtures are cleaned after the run.

## Concurrent Boss reward idempotency and E2E cleanup repair - 2026-10-28

- Expanded the full local game E2E to submit two simultaneous correct Boss answers using one idempotency key. The test verifies both requests succeed with a correct answer, one response grants the first-clear reward, one reuses the recorded result, exactly one attempt row exists in the isolated test database, and a fresh Boss read confirms the clear persisted.
- The first run exposed cleanup ordering: deleting synthetic auth users before their canceled deletion-audit rows caused the existing ON DELETE SET NULL FK to violate the canceled-row check. Cleanup now deletes only those synthetic deletion rows before synthetic auth users. Startup stale-fixture cleanup repaired the failed run; the subsequent complete run ended with zero generated content fixtures.
- The replay response intentionally omits the original cleared/reward fields, so verification checks the replay contract and persisted state instead of assuming both response bodies repeat first-answer fields.
- node scripts/run-healthclues-game-e2e.mjs - PASS; node --check, targeted ESLint, and focused git diff --check - PASS. Screenshots: App/reports. This used only the isolated local test database; no production systems or real email. V1 remains NOT COMPLETE.


## Game-renderer dependency and map accessibility QA - 2026-10-28

- Evaluated the current stack: Next.js/React map renderer is a shared 1600×900 SVG coordinate layer over the generated overworld artwork; the same SVG contains routes, region interaction, persisted unlock decorations, and pointer pan/zoom. The current installed animation dependency is framer-motion 12.43.0 (MIT, React 18/19 peer support), used in Quiz and Boss effects. PixiJS, @pixi/react, pixi-viewport, Motion for React, Phaser, Howler, and Lottie are not installed. A second canvas/game engine has no demonstrated benefit for the current map and would duplicate the working renderer, so no additional engine/dependency was added.
- Added reduced-motion handling to disable map pan/zoom transitions when the system preference is reduce. Added a high-contrast SVG focus ring for keyboard-focused region markers.
- The full isolated game browser E2E now checks keyboard focus visibility and emulates reduced motion to assert the map transition is disabled; both passed. The run also passed Boss/check-in concurrency, community, reminder/mock dispatch, account deletion, admin review, desktop/mobile scenarios, isolated build, and fixture cleanup. Screenshots refreshed in App/reports, including desktop, mobile, selected region and Boss victory.
- First focus styling experiments exposed selector behavior that failed at runtime; the final SVG React focus-state implementation passed the browser assertion. The quiz-preview browser auth test now dispatches the controlled input event and confirms the API accepts the token before UI submit. No production database, external email, deployment, or new game-engine package was used. V1 remains NOT COMPLETE pending qualified content review, privacy/retention approvals, and outstanding acceptance sign-offs.


## Map accessibility browser verification and profile REST regression - 2026-10-28

- Added useReducedMotion handling in src/features/healthclues/world-map.tsx so the map disables its zoom/pan transition when reduce is preferred. Keyboard focus now sets a React SVG focus state and renders a high-contrast ring on the selected region marker.
- node scripts/run-healthclues-game-e2e.mjs - PASS after the final adjustment. The real browser asserted the focused SVG ring, emulated prefers-reduced-motion and confirmed transition:none, then continued through the full game/admin/reminder/security/mobile suite; generated test content cleanup passed. Isolated production build and screenshots ran as part of the E2E.
- node scripts/test-healthclues-profile-activity-rest-e2e.mjs - PASS: versioned consented profile revisions, private history ownership, deletion cascade, check-in rationale, skipped actions, anonymous denial, cross-user isolation, and no authenticated UPDATE.
- Targeted ESLint, node --check and focused diff checks - PASS. Current evidence still does not replace qualified medical-content review or privacy/retention approval. No production database, deployment, or real email was used.


## Check-in timezone ownership integrity - 2026-10-28

- The authenticated check-in route previously trusted any valid timezone supplied in the request, even when it differed from the owner's saved Wellness World. It now reads the timezone from that owner's World, returns 409 for a mismatch, and uses the saved timezone for future-date validation and RPC persistence. Unknown World verification returns a safe 503; a non-owned/missing World returns 409.
- Expanded the real browser/API E2E to attempt a spoofed America/Los_Angeles zone against an Asia/Bangkok World and assert rejection, then save duplicate concurrent check-ins and inspect the isolated DB to confirm the persisted local-date row retains Asia/Bangkok. The full E2E passed, including one XP award only and fixture cleanup.
- node --check, targeted ESLint and diff check - PASS. No schema migration was needed; no production data or service was accessed. This closes one local authorization/timezone integrity case but does not complete the full authorization/consent matrix. V1 remains NOT COMPLETE.


## DST-local-date check-ins and reviewer form state - 2026-10-28

- Extended the isolated no-equipment World E2E with an America/New_York World starting before the fall-back transition. The test verifies two distinct UTC instants in the repeated 01:00 hour share the same local date, and the spring-forward 01:00-to-03:00 jump also shares its local date.
- Concurrent and sequential API saves for 2025-11-02 and 2026-03-08 each resolve to one persisted check-in per local date, retain America/New_York, and grant fixed XP once. Full browser/API E2E passed; generated content fixtures were cleaned.
- The same run reproduced a reviewer Quiz form bug: the DOM contained the entered credential and a direct API request returned 200, while the form request used stale React state and returned 401. The form now reads the submitted input value and passes it explicitly to the fetch; full admin browser flow passed afterward.
- node scripts/run-healthclues-game-e2e.mjs - PASS with isolated production build, gameplay, DST and timezone checks, reminder mock, community, admin, auth/RLS probes, map accessibility, mobile screenshots and cleanup. Targeted ESLint, node --check and git diff --check - PASS. No production systems or real mail used.
- Release remains NOT READY: qualified approval for real Catalog/Clue/Boss health content, privacy/retention approval, and residual acceptance coverage remain outstanding. V1 is NOT COMPLETE.


## Analytics consent transition and fail-closed revocation - 2026-10-28

- AnalyticsTracker now subscribes to the existing HealthClues analytics-consent event. A HealthClues/ebook page-view tracking key changes from denied to granted on the same route, so explicit opt-in starts current-page analytics without waiting for navigation; revocation changes the key and the event path exits before creating visitor/session IDs or sending requests. Unrelated routes do not retrack on these consent events.
- Consent revocation now stays denied in page memory if localStorage removal fails, and failed storage writes cannot grant consent over a prior stored value. Consent events still notify the tracker on storage errors.
- Expanded scripts/test-healthclues-analytics-consent.mjs for same-route grant/revoke keys, no unrelated-route retrack, failed remove, failed write, storage read failure, and server-side denial. Focused tests and targeted ESLint passed.
- node scripts/run-healthclues-review-http-e2e.mjs - PASS: isolated Next.js 16.3 production build, TypeScript, 79 routes, ebook funnel, HealthClues browser, review/dashboard browser, and fixture restoration. Only the known middleware-to-proxy deprecation warning was emitted. No production services or real email used.
- Existing full game E2E and DST check-in work remain verified. V1 is NOT COMPLETE: qualified review of real Catalog/Clue/Boss content, privacy/retention sign-off, and residual acceptance coverage remain release gates.
# Acceptance delta — Master Prompt 08 Final V2 (2026-10-28)

These cases supplement (do not replace) the older acceptance matrix. Requirement and result must remain separate.

| ID | Acceptance | Current evidence/status |
|---|---|---|
| HC-AT08-01 | Eight Overworld regions visible; Sleep/Health playable, other six Coming Soon and cannot create a Journey | Browser availability PASS; API lock tested in full isolated game E2E PASS |
| HC-AT08-02 | Sleep Quiz ≤10 → Reveal → read-only World Preview; no guest World write | Chromium at 3234 PASS; isolated E2E PASS |
| HC-AT08-03 | Health topic is saved to owner Journey and Realm does not ask again | BLOCKED; persistence schema/context missing |
| HC-AT08-04 | Verified email through local Auth/mail, same Journey resumes to Backpack/World | BLOCKED; current mock callback is not provider verification |
| HC-AT08-05 | Detailed Sleep Valley/Luna and HealthClues Realm/Lumi, in-map Toolkit/Knowledge/Quick Quiz/mini-games/Boss/Rewards | BLOCKED/PARTIAL; current components/APIs exist, not integrated as detailed region scenes |
| HC-AT08-06 | Journey switching preserves one World, individual loadouts and shared Skills | NOT VERIFIED |

Run `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3234/play` for the current guest flow and `node scripts/run-healthclues-game-e2e.mjs` for isolated existing V1 regressions. Never interpret mock activation as live email verification. Full matrix: `reports/OWNER_PLAYABLE_FINAL_ACCEPTANCE.md`.

## Acceptance delta — Milestone 09A owner Auth demo (2026-10-29)

| ID | Acceptance | Evidence/status |
|---|---|---|
| HC-AT09A-01 | Actual owner URL renders HealthClues in Chromium; no Next not-found | PASS — `http://127.0.0.1:3235/play` on current isolated production-mode build |
| HC-AT09A-02 | New player completes Sleep Quiz within ten questions and sees Reveal/World Preview before Auth | PASS — actual Chromium flow; screenshot evidence in `reports/previews/` |
| HC-AT09A-03 | Guest cannot read/create private World state before activation | PASS — unauthenticated `GET /api/healthclues/world` returned 401 in browser test |
| HC-AT09A-04 | Confirmation email is captured locally and genuinely confirms Auth account | PASS — Mailpit message/link, local Supabase Auth callback, confirmed user |
| HC-AT09A-05 | Verified pending Journey resumes at Backpack; all three slots may be skipped | PASS — authenticated browser UI |
| HC-AT09A-06 | One World is created and `/play` reload resumes same ID/one branch | PASS — API World ID stable across reload; no duplicate branch |
| HC-AT09A-07 | A second confirmed synthetic account cannot read first account's World/private check-in | PASS — second account had no World; cross-owner check-in query returned null |
| HC-AT09A-08 | Invalid callback has a recovery state | PASS — callback without a valid token displayed invalid/expired recovery |
| HC-AT09A-09 | Expired/replayed provider token, hosted email provider/new-tab callback, account deletion | NOT VERIFIED — local invalid callback was tested; provider expiration/replay and hosted lifecycle were not |
| HC-AT09A-10 | Restart local services while retaining the same owner World | PASS — launcher stop/start preserved 4 Auth users/2 Worlds/2 branches; retained confirmed browser session resumed World from `/play` and retained its ID after reload |

Run: `node scripts/test-healthclues-owner-auth-demo.mjs` (creates additional persistent synthetic test accounts; it does not clean those demo rows) and `node scripts/verify-healthclues-owner-resume-after-restart.mjs` after a demo stop/start. Start/restart: `App/start-game-demo.bat`; stop only this demo: `node scripts/start-healthclues-owner-demo.mjs --stop`. Do not use `.env.local` or production Supabase. Full details: `reports/OWNER_PLAYABLE_AUTH_ACCEPTANCE.md`.


## 09B owner-browser acceptance delta — 2026-10-29

The current isolated build `http://127.0.0.1:3238/play` was tested in Chromium with local Mailpit/Supabase. PASS: authenticated `/play` uses the RPG scene rather than the V1 scrolling dashboard; 8 global regions remain visible (2 playable, 6 Coming Soon); Sleep enters Sleep Valley/Luna; Quiz-selected Gout enters HealthClues Realm/Lumi without repeat selection; matching Knowledge does not fall back to unrelated topics; reload retains World ID; guest and cross-account access checks passed. PARTIAL: no reviewed Gout/Sleep Knowledge content means no completed learning quiz; full game E2E and a fresh service restart run were not repeated for 09B. Screenshots and detailed results: `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## HC-AT09B-UX — Pet-led first-time guide (2026-10-29)

- New Sleep World opens Sleep Valley with Luna; Health World opens HealthClues Realm with Lumi and the Quiz-selected topic. PASS in local Chromium.
- During an active guide, the global Game Shell navigation is absent; the Backpack step does not show Check-in, Journal or Settings shortcuts. PASS in browser assertions.
- Welcome → NEXT → Backpack; refresh resumes Backpack; close/reopen returns to the same guided step. PASS.
- Backpack displays CONSUME / EAT, REDUCE / AVOID, DO / PRACTICE; Skip and continue are available with zero tools. PASS.
- Skip/continue → Pet points to the in-region Knowledge Library; opening and returning to the map works. PASS.
- Guide progress is per authenticated owner and World, and stores only a small stage/version row. Owner-scoped browser API behavior was exercised as part of the local auth flow.
- Empty reviewed Catalog and Knowledge states are truthful and do not block play. PASS. Quick Preview, full details and equip with an actual matching reviewed tool: NOT VERIFIED because this isolated Catalog has no topic-matched eligible item. A reviewed lesson/Quick Quiz is similarly NOT VERIFIED because no matching reviewed content is available.
- Desktop 1440×960 and mobile 390×844 guide and Backpack empty-state screenshots were captured from owner build `app-build-09b5` and inspected. See the acceptance report for paths.

## 09C focused acceptance additions (execution evidence in dated report)

- **HC-AT49 ? Region camera:** detailed map provides bounded zoom/reset, drag/wheel pan, keyboard alternative, stable hotspot hit testing and desktop/mobile layout.
- **HC-AT50 ? Reviewed station:** stations show only current active editorially reviewed Catalog items with matching Journey tags; editorial review and evidence classification are labeled separately; empty match does not block play.
- **HC-AT51 ? Entry actions:** save-to-Collection and eligible Backpack equip use existing server validators; tracking requires explicit self-report and never awards XP.
- **HC-AT52 ? Private Care Plan:** owner can create, edit/pause and delete user methods/medication records; medication instructions are user-entered only; tracking is private/self-reported and reload persists.
- **HC-AT53 ? Isolation:** guest/unverified user denied; another account cannot read private records or event notes; user-added records never appear as reviewed Catalog content; medication and herb logging does not grant rewards.
- **HC-AT54 ? Guide:** new optional path shows Garden ? Activity Trail ? Wellness Sanctuary ? Backpack ? Knowledge; skip, refresh/resume, desktop and mobile work.

These are specifications until the corresponding command/browser evidence is recorded as PASS/PARTIAL/BLOCKED.

## 09D-R — Region movement acceptance

- Verify player world coordinates change during travel; the walking state is visible; camera follows; Pet position follows.
- A distant NPC must not expose Talk or its panel; Talk becomes available at the approach location; closing the panel preserves scene position/camera.
- Verify an unreachable route cannot move the player through the environment; there is no straight-line fallback.
- Run the above on the isolated authenticated owner build; separately record that mobile emulation does not replace physical-device gesture QA and that FPS requires measurement.
- Current result/evidence: `reports/REAL_RPG_REGION_GAMEPLAY_ACCEPTANCE.md` (PARTIAL overall).

## AT55 — Optional Pet reflection

- Open authenticated Check-in; verify two short optional prompts appear one at a time and Skip is available.
- Verify prompt answers are not appended to the private note until the explicit Add to private note action.
- Edit/save the note and verify owner-scoped reload persistence; ensure no health outcome or adherence reward is inferred.
- Desktop/mobile browser result: see `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`; broader daily/retention behavior remains PARTIAL.

## AT56 — Local TEST ONLY playable content and final demo handoff

- Start actual `app-build-final-a2` at `http://127.0.0.1:3249/play`; confirm local Mailpit `http://127.0.0.1:54324`, local Auth/Postgres loopback only.
- In Chromium, verify TEST ONLY label, no fabricated sources, full details, Collection save, explicit USER-REPORTED tracking, server-validated demo-only equip, Sleep and saved Gout Knowledge discovery/Quick Quiz, and persisted Sleep Boss result.
- Verify local TEST ONLY fixture IDs are filtered/rejected outside the owner-demo gate; never use the fixture SQL against production. These fixtures are synthetic, not human-reviewed content.
- Verify World ID persists after browser reload and local Supabase stop/start; verify second synthetic account cannot read first account Care Plan/World.
- Latest result: PASS for assertions above in `scripts/test-healthclues-owner-auth-demo.mjs` and `scripts/verify-healthclues-owner-resume-after-restart.mjs`; the mini-game, Skills, complete Quest/safety matrix, physical mobile QA and production review remain PARTIAL/NOT VERIFIED.
- Browser screenshot set is in `reports/previews/`; generated by real Chromium. Mobile views use emulation, not a physical device.

## AT57 — Final owner demo, compact maps and persistent learning/rewards — 2026-10-30

- Run `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3249 node scripts/test-healthclues-owner-auth-demo.mjs` against the current isolated build and local Auth/Mailpit. Verify 8 visible regions, 2 playable/6 Coming Soon, verified synthetic email, one saved World, Quiz topic continuity, Luna/Lumi, short safe movement, water/scenery rejection, NPC approach-before-Talk, Encyclopedia, Collection/Backpack, Care Plan isolation, optional Daily Companion note opt-in, four TEST ONLY mini-games, deduplicated persisted Skill counts, Boss clear/key/unlock, Rewards station, reload persistence and zero browser runtime errors.
- After the camera reset, assert the complete landscape world dimensions fit the Region Map viewport; capture and inspect desktop/mobile map views and Knowledge, Boss, Rewards, Care Plan and Companion screens. Touch is Chromium mobile emulation, not physical-device verification.
- `node --experimental-strip-types scripts/test-healthclues-region-layout.mjs`: verify seven valid approaches per region on one short connected path with no bridge dependency. `node --experimental-strip-types scripts/test-healthclues-skill-levels.mjs`: verify all five derived Skill thresholds and input bounds.
- **2026-10-30 result:** PASS for this isolated local test scope on `app-build-final-a7`; source/route checks and fresh Chromium evidence are recorded in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Fixture content remains TEST ONLY / NOT HUMAN-REVIEWED. Art/content human review, physical device gestures, measured FPS, production security/privacy review and production release are outside this PASS.

## AT58 — Shared spacious two-region layout and real route QA — 2026-10-30

- Verify both Sleep Valley/Luna and HealthClues Realm/Lumi use the shared 16:9 route blueprint and landmark targets at Camp 12/69, Garden 34/69, Activity 58/69, Sanctuary 86/69, Library 29/28, Boss 66/28, Rewards 90/28 (x/y percent). Upper approaches must end on open ground below the building anchors; all foreground/branch paths are connected and require no bridge crossing.
- In real browser journeys, walk from camp through Garden/Botanist to Activity and Sanctuary, and visit Library, Boss and Rewards by their safe authored routes. Verify feet/ground anchors, separated NPCs, Pet follow, Talk only near destination, and closing interaction preserves player position. Invalid water/scenery destinations must leave position unchanged.
- At 1440×900 and 1920×1080 assert the full landscape scene fits; at 390×844 assert world coordinates remain unchanged and camera frames the player. Assert no overlapping visible context labels, important landmark interaction surfaces, or player/Pet/NPC bounds where the fixture exposes them. Capture and visually inspect both region screenshots at each viewport.
- After walking back to Camp, wait for the Pet to settle, then visually/automatically confirm the Camp hotspot remains visible and clear of actor feet. On focused NPC arrival, inspect the ground-level focus halo and the compact context label. Verify the first welcome dialogue leaves the main foreground route and actors visible on mobile.
- Result: browser assertions and captures are recorded in `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Emulated mobile is not a physical device; generated art still needs owner approval.


## Final correction: region navigation / grounding — 2026-10-29

Run the owner isolated demo E2E against `http://127.0.0.1:3249` with local Auth/Mailpit. Verify: (1) water click is rejected and coordinates remain unchanged; (2) building/roof scenery click is rejected; (3) keyboard input into blocked terrain is rejected with unchanged coordinates; (4) long Sleep Valley destination produces a multi-node route through the marked bridge and the player reaches the deck; (5) changing destination during motion recalculates safely; (6) approach/Talk gating and exact position after modal close; (7) Health/Gout Journey can route to Wellness and then across its map to Botanist/Activity/Knowledge; (8) avatar feet/shadow grounding CSS bounds; (9) camera and Pet follow; (10) mobile-emulated CDP touch moves on the safe network; (11) reload preserves authenticated World ID. Physical touch/pinch, FPS and pixel-perfect collider QA are explicitly NOT VERIFIED.

## Mini-games and Skills verification added — 2026-10-29

- Static/browser E2E now contains assertions for each of four owner-demo learning activities, wrong-answer retry without penalty, persisted four-Skill counts, and duplicate completion with no repeat XP.
- Migration `20261029150000_healthclues_learning_skills_games.sql` remains unapplied in this work session. Docker daemon is stopped; do not run these database assertions until the isolated local project has been identified and started.
- Source checks performed: focused ESLint PASS; focused TypeScript check PASS (temporary config excluded stale `.next` route types); short connected-region layout test PASS; E2E JavaScript syntax PASS. Full default TypeScript check still reports stale `.next/types/validator.ts` route-type errors. Current browser verification for this changed source is NOT VERIFIED.

## AT58 — Distinct character identity in both playable regions

Run the isolated authenticated owner-browser suite at desktop and mobile-emulated sizes for Sleep Valley and HealthClues Realm. Assert each role has a unique loaded asset, both regions reuse stable NPC identities, player walk frames advance/reverse, and close-up captures hide all name labels. Visually inspect silhouette, feet placement and separation from interaction surfaces. Evidence is in the latest final acceptance report. Physical-device interaction is outside browser-emulation evidence.


## HC-AT59 — discovery, flexible Backpack and private daily tracking

On isolated owner demo, verify Journey-filtered content at all three NPCs, full-details sources/safety, Collection save/browse/search/details/unsave independently from equipment, server eligibility, three flexible positions, same-category multi-equip, explicit fourth-item replacement, remove without unsaving, and same-World reload. Confirm another account sees no first-owner equipment or Collection IDs. In optional Daily Companion, persist `done` and `unsure` as distinct item-level reports and retain the private note. TEST ONLY fixtures remain visibly non-reviewed and unavailable outside owner demo. Record browser and local DB evidence; PASS is limited to the exercised build.
# Personalized recommendation acceptance cases — 2026-10-30

- Unit: same self-reported topic with different goals/preferences produces different deterministic ordering and supported reasons.
- Unit: acute painful Gout joint blocks movement equipment; missing activity/food/medication context remains unknown; ordinary food is educational-only; dismissed suggestions rank lower; demo-only items do not enter a non-demo candidate set.
- API/browser: anonymous access is rejected; an authenticated user can read only their own World; second owner cannot read or write another World history; equipment is revalidated server-side.
- Browser: Camp Pet suggestion cards and station-filtered cards render with evidence/safety labels; Explore walks to that landmark; save/dismiss persist; eligible equipment persists through reload; no unsupported suggestion is shown when Catalog metadata does not support it.
- These are requirements. Mark only cases with actual executed evidence as PASS in the dated final acceptance report; production and physical-device acceptance remain separate.

# Reminder preferences — owner-demo browser evidence (2026-10-30)

- [x] Authenticated mobile-emulated UI edits local reminder timezone/time; saved preference reads back from the owner-scoped API.
- [x] UI Pause, Resume and Unsubscribe each update persisted state; E2E verifies API readback after each control.
- [x] Reminder worker sends one privacy-preserving message to local Mailpit; repeated run sends none; unauthenticated worker is rejected.
- [x] Browser E2E completed on `http://127.0.0.1:3257/play`; 390×844 reminder screenshot inspected; no horizontal overflow; zero runtime errors.
- [ ] Recover a stale claimed row after process interruption while guaranteeing no duplicate Mailpit send.
- [ ] Cloud scheduler and production email delivery; disabled/unconfigured in this demo and not verified.
- [ ] Weekly reflection aggregation from user-confirmed records.

## AT65 — Gemini realtime Quiz Wellness Advisor — PARTIAL / BLOCKED pending key and browser inference

Use only the isolated Owner Demo and synthetic profiles. Verify a unique request ID and actual Gemini response ID for each Quiz completion; confirm the exact minimized profile fields, JSON schema, reviewed Catalog candidate IDs, safety filtering and `GEMINI_AI` browser state. Confirm explicit Plan persistence and same-World Quests reload, plus second-account isolation. Test Gout with/without sugary drinks, shift-work Sleep and Digestion. Also test missing key/provider error and ensure no deterministic fallback. Current source includes the server route, official SDK and error UI; real inference is not run because the requested private env file was absent. No result is PASS until actual Gemini and authenticated browser evidence is recorded.


## My Journey Inventory acceptance — 2026-10-31

Chạy Chromium script `scripts/test-healthclues-owner-auth-demo.mjs` với `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3275`, project local `healthclues-owner-demo`: PASS, runtimeErrors 0. Kiểm tra cùng lúc ba section/no tabs, confirmed Plan và no-plan empty state, My Journey/tutorial spotlight, replay/returning behavior, di chuyển/talk tới NPC, equip practice từ Wellness Guide, API `discovery_station` và persistence sau reload, cross-account mutations, cùng đầy đủ game regression, Auth/Mailpit. Desktop 1440×900 và mobile 390×844 đã inspect. Botanist herb eligible equip: PARTIAL do không có fixture qua safety gate; empty state PASS. Screenshots và danh sách chi tiết trong `reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md`.

## AT ? HealthClues English / Vietnamese player locale ? 2026-10-31

Required: English selected by default on Welcome; Vietnamese selection localizes Welcome and full Quiz; all canonical bundled question and answer IDs have Vietnamese labels; mid-Quiz switch preserves answers and current step; guest preference survives refresh; authenticated preference is owner-scoped and survives returning sessions; Plan/World/Inventory/tutorial state stays intact; AI receives explicit locale and keeps the same schema; reviewed content gaps are disclosed; locale UI fits desktop and 390?844 mobile; no mixed-language core navigation or untranslated keys.

Current execution status is recorded in HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md. Do not mark this acceptance PASS until full authenticated desktop/mobile browser journeys, locale persistence/account isolation, Pet tutorial, My Journey and approved-content fallback are verified.

## My Journey guided focus mode — 2026-10-31

Run `scripts/test-healthclues-owner-auth-demo.mjs` against the isolated `healthclues-owner-demo` build. For each of `focus`, `checklist`, `herbs`, and `practices`, assert the actual DOM target is active, exactly one section is emphasized, the other three have opacity below 0.7 after transition, and the Pet note is adjacent without overlapping target content. Assert the separate dimmer spans the map, the panel backdrop is active, map interaction is blocked, and mobile 390×844 can scroll the target and dialogue into view. Inspect 1440×900 and mobile Chromium screenshots. Keep all three inventory sections expanded and verify no runtime errors.

Status: **PASS for the guided focus behavior on local Chromium**, build `http://127.0.0.1:3293/play`, full owner-auth suite result PASS/runtimeErrors 0. Four targets each had one active + three dimmed sections, a non-overlapping adjacent Pet dialogue, actual full-map dimmer coverage, and full Pet/target visibility together on 390×844. Desktop 1440×900 and mobile screenshots are recorded in `reports/HEALTHCLUES_MY_JOURNEY_INVENTORY_ACCEPTANCE.md`. This does not prove physical-device behavior; eligible Botanist herb equip remains partial because the isolated catalog lacks a safe eligible item.

## AT ? Localization partial Chromium result ? 2026-10-31

On isolated build http://127.0.0.1:3289/play, focused real-Chromium scope PASS: English default, Vietnamese Welcome, /vi Quiz route, translated C01/C02 and quiz navigation, all 96 current canonical question IDs/all bundled option labels present in source translation resources, switch to English at C02 preserving canonical C01 answer/current step after refresh, local guest preference persistence, visible mobile locale switch and no horizontal overflow at 390?844, desktop 1440?900 screenshot inspection. Existing Quiz safety (38 assertions) and adaptive branch regression passed; latest isolated build passed. Overall localization acceptance remains **PARTIAL**, not PASS; authenticated accounts, full Plan/game/NPC translation, content-gap fallback and account isolation remain unverified.

## AT — Vietnamese Plan Builder and Gemini diagnosis — 2026-10-31

- Render Vietnamese Reveal and Plan using canonical Gout/interest/focus values; no English values from Quiz, no technical codes, no mutation of stored answers.
- Without an approved, translated candidate set: localized source-coverage error, no candidate cards and no generated checklist. With approved content: provider locale may change only localized rationale; schema and candidate IDs remain canonical and safety/source checks must pass.
- Provider diagnostics distinguish configuration/auth/model/rate/billing/timeout/schema/source/safety failures without logging credentials or health answers. HTTP 402 is BILLING_REQUIRED; no output means schema/source/safety validation did not run.
- Desktop 1440x900 and mobile 390x844 Plan builder screenshots; assert no horizontal overflow and no client runtime exceptions.
- Two synthetic accounts retain independent preferredLocale through fresh sign-in; cross-account World preference write is denied/not found. This API check does not substitute for a complete activation/browser persistence E2E.

Latest evidence: Chromium synthetic Reveal/Plan fixture inspected in both locales; Quiz safety 38 assertions; Wellness Plan 42; adaptive Quest 8 + fallback; ESLint clean; two-account local locale preference check passes. Full authenticated Quiz-to-My-Journey journey remains PARTIAL.


## AT-2026-11-01 — My Journey guided focus, final build

- On desktop 1440×900 and Chromium mobile emulation 390×844, run each of the four actual section steps. Assert exactly one active section, three dimmed sections, the Pet note adjacent/non-overlapping, target inside the scroll viewport, and the modal backdrop covering the World and blocking hit-testing behind it. Assert the active target paints above the backdrop.
- Include real Quiz topic, no-confirmed-Plan empty state, confirmed Plan, long synthetic list scrolling, empty Herbs/Practices states, English/Vietnamese copy, Back/Next/Skip, replay, and normal section opacity/World interaction after completion.
- Regression includes local Auth/Mailpit, both playable region identities, NPC proximity/equipment rules, movement, World/Plan persistence and account isolation. External AI requests are explicitly skipped.
- Final isolated local build http://127.0.0.1:3296/play: production build succeeded; scripts/test-healthclues-owner-auth-demo.mjs returned result PASS, runtimeErrors 0; see reports/previews/mp15-focus-layerfix-final-20261101/. Physical mobile devices and production are NOT TESTED. Reviewed Botanist herb equipment remains BLOCKED by catalog eligibility; no herbs were fabricated. Broader HealthClues localization remains PARTIAL.
## AT16 — AI Personalized Wellness Plan — PARTIAL

- [x] Pure contract validator: exact two distinct implementation options per goal; canonical ID schema; allow-listed source IDs; source/topic mismatch; unsupported numeric baseline; irrelevant red-meat inference; urgent safety and high-risk exclusion.
- [x] Existing Plan safety/persistence unit suite remains green; isolated local Owner Demo identity/Auth/REST/Mailpit preflight passes; isolated Next build passes.
- [ ] Real Gemini invocation in EN and VI, with actual provider response, schema/source/safety validation and model/status evidence. Prior real synthetic requests returned HTTP 402/BILLING_REQUIRED; no retry made in this session.
- [ ] Chromium desktop 1440x900 and mobile 390x844: A/B/custom/skip, explicit Confirm, World → My Journey, reload persistence and two-account isolation. No browser PASS is claimed for this change.
- [ ] Screenshots and full runtime-error/layout inspection for the actual personalized Builder.
- [ ] Add structured Quiz habit baselines only if approved product questions/persistence are designed; until then, do not infer or output numeric targets.

## AT17 — guided onboarding and personalized post-entry Plan (not yet accepted)

- [ ] New player chooses locale and self-reported concern; fixed 96-question Quiz does not appear. Legacy account resumes unchanged.
- [x] Adaptive response contract unit tests reject mismatched locale, malformed IDs, duplicate choices/repeated questions, over-four answers, and completion before two questions (11 assertions). This does not verify a real Gemini call or player journey.
- [ ] Adaptive Gemini questions are client-wired, relevant, choice-based, and retain canonical IDs across locale switching; no missing legacy answers are fabricated.
- [x] Synthetic UI-only Chromium check verifies unchecked defaults, radio/checkbox independence, selection-count updates, Custom, non-persistable fixture, Vietnamese labels, mobile width and zero runtime exceptions. Screenshots: `reports/previews/mp17-plan-selection-fixture/`. Not genuine AI output or Plan persistence.
- [ ] Existing email verification remains enforced; account activation persists the minimized structured profile to the correct owner/World only.
- [ ] After entering either playable region, correct Pet welcomes player, then optional goal suggestions show without overlapping the existing guide.
- [ ] For each genuine generated goal, verify checkbox starts unchecked; A/B/custom selection does not auto-check it; unchecking removes it from Plan; selected count changes in real time; zero-goal confirm and skip preserve gameplay.
- [ ] Confirm persists only checked goals with one validated implementation through existing Plan API; reload/My Journey/account isolation pass. EN/VI, 1440x900 and 390x844.
- [ ] With actual Gemini unavailable, localized no-recommendations state allows play; no test fixture is described as live AI. Capture/inspect actual Chromium screenshots and runtime errors.

Checkpoint: checkbox/implementation separation and adaptive server contract are source-implemented; only the expressly synthetic UI interaction case is browser-verified. All new-player/full-journey browser cases remain unchecked. Prior live Gemini status is HTTP 402/BILLING_REQUIRED.
## AT65 — MP17 concern-first verified World Plan lifecycle — PARTIAL (2026-11-01)

Use isolated `healthclues-owner-demo` only. A current-source synthetic browser fixture may intercept only `/api/healthclues/adaptive-discovery`, must be visibly marked `SYNTHETIC TEST FIXTURE`, and must not be represented as Gemini output. Verify EN and VI new-player path, focus/answer stable IDs, locale switching, short choice questions, optional concern detail and age gate; then use a unique synthetic email and local Mailpit to verify activation. Assert the real authenticated World and correct Pet appear, recommendation Plan opens without tutorial stacking, one account can check/uncheck goals independently from A/B/custom, confirm selected-only goals or zero, and read exactly the confirmed goals in My Journey after reload. Repeat a second account with a different locale and verify owner isolation. Include 1440×900 and 390×844, zero runtime errors, actual screenshots opened/inspected, and legacy Quiz/account regression. No live-Gemini PASS while provider returns HTTP 402/BILLING_REQUIRED. Current evidence covers source contracts and focused discovery UI only; the authenticated lifecycle is NOT YET PASS.

**Latest execution delta:** the user journey through local Mailpit activation, actual HealthClues Realm/Lumi, explicit zero-goal confirmation and the three-section My Journey reload now passes for one synthetic VI account at `http://127.0.0.1:3310/play`, with zero browser runtime exceptions. English and Vietnamese concern/questions ran with an explicit synthetic question interceptor; the separate non-persistable Plan UI fixture passed 16 assertions for independent checkbox and A/B/custom controls. Thus the statement above about the authenticated lifecycle being wholly untested is historical and superseded for this exercised zero-goal slice. Selected-goal persistence, second-account isolation, full game localization and legacy-account regression remain NOT TESTED/PARTIAL. See `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md`.

### AT locale region/NPC presentation delta — 2026-11-02

On isolated reuse-only local build `http://127.0.0.1:3311/play`, confirm both EN and VI accounts keep canonical Quiz/Profile/World values while region landmark labels, NPC name/greeting, NPC aria-label, Talk/Interact and movement help use the selected locale. Walk through the real safe path and require arrival before Talk; assert Talk opens the existing station. At 1440×900 and 390×844, verify no horizontal overflow and the Talk control remains visible. Keep dynamic Catalog and NPC/provider content in its original source language and preserve its review/source disclosure. Do not call the app fully localized from this slice.

**Result:** PASS for the exercised EN/VI Botanist interaction on two new synthetic local Mailpit accounts; safe arrival, Talk, station opening and mobile visibility passed with 0 runtime exceptions. Production/current real Gemini content was not used. Legacy 96Q route + canonical answer/step/locale refresh compatibility also passed in the separate guest harness; an existing authenticated legacy account remains unverified. Overall locale and MP17 acceptance: **PARTIAL**. Evidence: `reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md` and `reports/previews/mp17-npc-locale-20261102/`.

## Gemini INVALID_SCHEMA diagnostic coverage — 2026-11-01

- [x] Offline classify local request-schema, upstream HTTP, empty body, JSON parse, response-schema, semantic and safety failures without logging sensitive payloads.
- [x] Assert missing Level B and wrong `target.unit` report precise schema paths.
- [x] Assert unsafe and duplicate/equivalent options are rejected; a separate valid goal survives a neighboring rejected goal.
- [x] Assert Level A and Level B values survive the canonical Plan transformation.
- [ ] Real provider call and exact cause of historical `INVALID_SCHEMA`: not verified; current credentials/billing state is not inferred, and this pass made no provider request.
### Gemini diagnostics / PowerShell response capture — 2026-11-02

- **PASS (mocked):** Windows PowerShell 5.1 captures application status, content type, request ID and a sanitized JSON body from a mocked HTTP 503; test fixture proves API key/profile/prompt fields are omitted.
- **PASS (mocked pipeline):** provider 402, 429, 503 and network failure produce distinct categories; valid JSON with Level A/B traverses the production parser/semantic validator and A/B mapper; malformed JSON and missing `optionB` fail distinctly; invalid request schema is rejected before mocked provider invocation.
- **NOT TESTED:** updated route stage logs have not yet run in a newly built local server. The isolated build and TypeScript checks passed. No live Gemini inference occurred in this diagnostic task.
- **Historical request:** the 2026-11-02 PowerShell 5.1 call to local Advisor returned application HTTP 503, but its error body and request ID were not captured and cannot be recovered. Whether the provider was reached is unknown.
- **Status at this earlier checkpoint:** live acceptance remained PARTIAL/BLOCKED pending local server/runtime verification. Superseded by the later “Gemini diagnostic runtime activation” results above; live inference remains unrun.


## Simplified Gemini Wellness Checklist — offline synthetic acceptance — 2026-11-02

- The strict response schema accepts up to six goals with bilingual title, reason, and A/B title/action; it does not require model IDs, category, sources, safety declarations, or target fields.
- Server assigns unique UUID-backed `ai:` IDs and concern-derived Plan categories. EN and VI map from the same goal ID and bilingual content; signed A/B choices verify in either language.
- Plan mapping preserves selected A/B action and existing nonnumeric target semantics; no source/catalog row is needed. Dangerous medication/herb instruction is rejected. Missing option B, malformed JSON, semantically identical options, provider 402/429/503 and network failure are covered offline.
- Evidence: personalized plan contract 19 assertions PASS; Gemini pipeline offline suite PASS; isolated production build and TypeScript/static generation PASS. These checks do not verify actual provider output quality, a real HTTP route cache hit, or a new authenticated Plan API write. No live Gemini request was made.

## One live simplified-contract smoke — 2026-11-02

Exactly one authorized synthetic Vietnamese Sleep request reached Gemini: provider HTTP 200, application HTTP 200, request ID `8daba742-033f-499e-b55e-e3e658dd2d28`; four goals passed parse/schema/safety validation with distinct A/B, unique server UUID IDs and bilingual EN/VI mappings. No Plan was persisted. **Partial product acceptance:** generated action text included several fixed durations/frequencies and a bedtime target phrase despite no structured target values. No retry was sent. See the MP17 report for stages and exact next task.

## AI wellness goal quality and numeric choices — offline evidence, 2026-11-02

- Synthetic Sleep: 15/30-minute phone wind-down actions pass as modest, adjustable everyday experiments; EN/VI numbers must match.
- Synthetic Gout: meal-pattern observation passes; unsupported quantified fluid advice is rejected.
- Synthetic Weight Management: 10/20-minute walking options pass; calorie restriction is rejected.
- Across profiles, A/B actions must be distinct, relevanceReason must explain the selected concern, IDs remain backend-assigned, Plan mappings retain null structured targets, and EN/VI selects the same goal/option. Checkbox and Custom are UI-owned.
- Evidence: `scripts/test-healthclues-personalized-plan-contract.mjs` PASS (30+ assertions); `scripts/test-healthclues-gemini-plan-pipeline.mjs` PASS with mocked provider cases. These are offline checks, not live Gemini or browser persistence evidence.

## 2026-11-02 — bilingual persistence and authenticated legacy acceptance

**Bilingual AI display: PASS for new signed recommendation snapshots. Historical translated content: PARTIAL. Legacy authenticated account: PARTIAL.** Current Owner Demo URL: `http://127.0.0.1:3319/play`.

In Chromium, one synthetic confirmed Plan with three goals was opened in VI, switched to EN, reloaded, and switched back. AI title, relevance reason, and selected A/B option copy followed locale; IDs, choice, numeric target, active status and Plan history were identical. A user-authored Custom action remained verbatim. Desktop 1440x900 and mobile 390x844 screenshots were captured and visually inspected under `reports/previews/mp17-bilingual-legacy/`. No Gemini call was made; this is a validated signed fixture.

Authenticated synthetic legacy account `c1b5cb` retained the same World ID and ten Plan versions across locale/reload; the selected World exposes its existing My Journey without new onboarding and displays its two legacy practices. No herbs existed. No duplicate goal IDs appeared. The source had no persisted `answers` or `quizAnswers` for the original 96-question Quiz, so historical authenticated answer preservation is not verifiable. Locale checks compared saved Plans, World ID and equipped count; World GET also runs existing milestone reconciliation, so XP baseline preservation was not assessed.

An old persisted goal with no `localizedRecommendation` keeps its stored wording in both locales; no translation is fabricated. Custom within an AI card is persisted as a new `user_created` UUID goal without an origin-recommendation link; its A/B alternatives are not active. Standalone Add My Own Goal was separately verified. Fixture and legacy evidence do not prove actual Gemini quality.
## MP19 world-first acceptance (2026-11-02)

- New `/play`: Welcome and locale selection precede the eight-region selection; only Sleep Valley and HealthClues Realm accept selection, and six others remain Coming Soon.
- Each selected world remains unchanged across 0–3 adaptive questions, email activation, callback and first World API creation. Sleep questions do not ask for a second wellness concern; HealthClues Realm asks the concern once.
- After activation the player sees the selected regional scene directly with Luna/Lumi, and the global map remains reachable. Returning accounts skip onboarding and keep World/Plan.
- Plan Builder truthfully shows Gemini success or localized unavailable/retry/postpone; fixture output is labeled synthetic. Zero goals and postpone remain valid.
- Discovery/NPC actions must use current catalog/recommendation APIs and preserve proximity, editorial review, safety and equipment rules. Empty reviewed Botanist catalog is CONTENT_BLOCKED; it cannot pass Save/Equip.
- Report separately synthetic E2E, real Gemini inference, approved botanical availability, and full player journey; a fixture run cannot imply live AI or content PASS.
# MP20 two-question discovery acceptance — 2026-11-02

- **Automated/browser required:** New `/play` path preserves world-first choice and renders exactly two screens with progress 1/2 then 2/2. Sleep concern list is sleep-only; Health Realm list includes Gout, weight, glucose and Other. The factor list changes by concern (Gout vs weight vs sleep), supports multiple selection, none/unsure, optional note and zero factors, and proceeds without any adaptive/Gemini question request. Other concern uses only neutral fallback. Verify authenticated activation preserves IDs/labels and direct region entry.
- **Activation handoff contract:** Submit the real Q2-generated profile after explicit consent. Factor IDs must use canonical a-<id> format; none and unsure are permitted; zero selected factors must remain a valid empty paired array. The encrypted pending-journey API must return success, set its HttpOnly cookie and preserve at most 12 paired IDs/labels. UI errors distinguish validation/service/size/network failures and leave the preview available.
- **Plan/inventory required:** My Journey displays recommendations and selected state together. Exercise one valid selected choice, an unchecked goal, unchecking/deactivation, zero goals, persistence after reload and consistent My Journey status. Distinguish fixture recommendations from real Gemini. Preview routes must not offer equip; actual NPC proximity and catalog eligibility must be checked before selection. Botanist content acceptance remains blocked if no reviewed eligible items exist.
- **Immediate selection:** In central My Journey only, a checked goal with valid A/B or completed Custom implementation must POST to the existing account-scoped Plan API immediately; uncheck removes it from the current goals while previous Plan versions remain. Test rehydrating prior selections, preserving unrelated saved goals, zero goals, and API rejection without false success. The standalone legacy Builder retains global confirmation.
- **Current implementation status:** Quiz source is changed; server answer bounds were raised compatibly to 12. Focused offline suites passed. TypeScript project-wide command is currently blocked by pre-existing stale `.next/types/validator.ts` route union; a clean isolated build and browser E2E are pending. Do not mark the new end-to-end flow PASS based on older MP19 evidence.

### MP20.1 owner checklist acceptance

- Open the World Plan entry with an authenticated saved Quiz profile; recommendations are visible without searching another NPC or hidden control.
- Observe lifecycle by status: request not started, generating, success with goals, provider error, validation error, or no recommendations. Error includes a request ID, and a working explicit Retry is shown. No fixture is passed as Gemini output.
- Server diagnostics use the same request ID and record only bounded stage/status/count/category metadata, never health answers, prompt, credentials, or recommendation text.
- Select valid A/B or completed Custom and tick a goal: it writes through authenticated `/api/healthclues/plan`; the same view shows it as Active/Following. Unchecking removes it from current Plan without duplicating goal identity. Reload and verify the account-scoped Plan.
- A Plan write failure is visible as `PERSISTENCE_ERROR`; retry reuses that write's request key. Reopening My Plan reuses cached/in-flight Advisor output when valid and does not force provider refresh. Retry after failure is explicit.
- Do not call real Gemini in development tests. Use mocked pipeline/contract verification; owner separately verifies provider success and recommendation quality.


### 2026-11-03: Gout context regression (synthetic offline)

- A/B: verified activation retains HealthClues Realm, canonical Gout concern and all selected factor IDs while replacing the active discovery profile.
- C/E: a Sleep profile, contradictory topic, or missing concern cannot be used for the wrong World; a Sleep-only generated set is rejected for Gout.
- D: Advisor cache identities differ across accounts and concern/factor contexts.
- F: valid synthetic Gout output passes the existing bilingual goal contract and maps through A/B Plan selection; the Plan UI shows the selected concern.
- G: prior confirmed Plan revisions remain in history and are scoped out of the current view when their Quiz context differs.
- H: EN/VI labels localize without changing canonical concern/factor IDs.

Offline regression covers helper/contract behavior and source wiring only. It does not establish live Gemini quality, actual database persistence, or browser UX acceptance.
