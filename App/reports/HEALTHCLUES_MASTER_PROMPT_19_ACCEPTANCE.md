# HealthClues Master Prompt 19 — acceptance report

Date: 2026-11-02  
Verdict: **PARTIAL** — world-first and short-Quiz behavior is implemented and locally browser-verified with synthetic fixtures. Real Gemini output, Sleep activation, Wellness Guide action coverage, and approved Botanist herb content remain unverified or blocked.

## Changes

- `/play` now leads from Welcome/language to the existing eight-region selection. Six regions remain Coming Soon; only Sleep Valley (`sleep-better`) and HealthClues Realm (`health-concern`) can be chosen.
- New `/play` keeps the selected region through adaptive discovery. Sleep Valley uses a sleep focus and does not show the concern selector. HealthClues Realm asks for the concern after world selection. Adaptive discovery is capped at three questions. Legacy Quiz entry retains its old path.
- The existing encrypted activation handoff retains selected quest/profile. After verified activation and profile save, the app creates the World and opens the selected regional map automatically. The global map remains available from the region HUD; optional nickname no longer blocks entry.
- Gemini's personalized-plan prompt receives selected World context in addition to localized Quiz answers. Existing server-side validation, optional Plan confirmation and explicit failure state remain in place.
- Botanist filtering and equipment eligibility were not relaxed. No unreviewed content was promoted.

## Evidence

- **Build:** isolated authenticated owner-demo production build completed from current onboarding/direct-entry source as `app-build-mp19-world-first`.
- **Exact local URL:** [http://127.0.0.1:3323/play](http://127.0.0.1:3323/play). It uses only local `healthclues-owner-demo` Supabase/Auth/Mailpit (`127.0.0.1:54321/54324`); owner-demo reuse verification reported no migration or fixture seed. Port 3322 was left running.
- **Chromium:** `HEALTHCLUES_OWNER_DEMO_URL=http://127.0.0.1:3323` with `scripts/test-healthclues-mp17-goal-first-browser.mjs` returned `PASS_SYNTHETIC_FIXTURE_UI_TO_PLAN_API_PERSISTENCE_LOCALE_ACCOUNT_ISOLATION_AND_ZERO_PLAN`; 0 browser runtime exceptions. The suite intercepted adaptive Quiz and Wellness Advisor calls. It verified:
  - Sleep Valley selected before Quiz; sleep focus preserved; two adaptive questions completed; no repeated general concern selector; activation preview remains Sleep Valley.
  - Vietnamese and English HealthClues Realm selection before Quiz; local Mailpit verification; direct HealthClues Realm/Lumi entry; Plan A, B and Custom selections persisted through the authenticated Plan API; reload/My Journey; two-account isolation; zero-goal and saved-for-later behavior; Botanist proximity/Talk; honest eligible-content empty state.
  - Desktop 1440×900 and mobile 390×844 flows with no uncaught browser exceptions.
- **Offline tests:** `test-healthclues-adaptive-discovery.mjs` PASS (13 assertions); `test-healthclues-wellness-plan.mjs` PASS (42 assertions); `test-healthclues-gemini-plan-pipeline.mjs` PASS (mocked/offline contract only).
- **Screenshots:** `reports/previews/mp19-world-first-fixture/`. The Welcome, world selection (desktop/mobile), Sleep Quiz (desktop/mobile), selected synthetic Plan, My Journey and Botanist empty-state captures were opened for visual inspection. Example: [World selection desktop](previews/mp19-world-first-fixture/mp19-world-selection-desktop.png), [World selection mobile](previews/mp19-world-first-fixture/mp19-world-selection-mobile.png), [Sleep Quiz mobile](previews/mp19-world-first-fixture/sleep-quiz-mobile.png), [HealthClues Plan mobile](previews/mp19-world-first-fixture/account-a-vi-plan-builder-vi-mobile.png), [Botanist empty state](previews/mp19-world-first-fixture/account-b-en-gout-botanist-empty-desktop.png).

## Verdict matrix

| Area | Status | Evidence and remaining gap |
|---|---|---|
| WORLD_FIRST_SELECTION | PASS | Browser asserts six disabled and two playable region cards; Sleep and Health flows select first. |
| SHORT_QUIZ_FLOW | PASS | Sleep and Realm synthetic adaptive flows each answer two questions; no more than three are allowed. Real adaptive Gemini questions were intercepted. |
| ACCOUNT_ACTIVATION_CONTINUITY | PASS for HealthClues Realm | Two synthetic users verified through local Mailpit and resumed the same HealthClues Realm. Sleep activation was not run. |
| DIRECT_REGION_ENTRY | PASS for HealthClues Realm | Verified callback auto-created/loaded the World and showed the HealthClues Realm scene/Lumi without another map-selection step. Sleep direct entry remains untested. |
| LUNA_LUMI_PLAN_INTRODUCTION | PARTIAL | Lumi and in-world Plan are visible and fixture labels are explicit. Sleep/Luna activation and real Gemini-ready introduction were not tested; wording still begins before provider success. |
| REAL_GEMINI_ADVISOR_INTEGRATION | PARTIAL | Server prompt includes selected World, concern, structured answers and locale; offline contract tests pass. No real inference was sent, so real response quality/Plan persistence is unverified. |
| PERSONALIZED_ACTIVITY_DISCOVERY | PARTIAL | Existing region landmarks and practice discovery remain accessible; no newly verified personalized activity recommendation list was exercised. |
| WELLNESS_GUIDE_FUNCTIONALITY | PARTIAL | Existing station API/proximity implementation remains. This MP19 browser run verified Botanist proximity, not Wellness Guide Save/Equip or practice persistence. |
| BOTANIST_CONTENT_DISCOVERY | BLOCKED | Actual local catalog has no eligible reviewed botanical entry; only TEST ONLY Ginger is present and excluded. Honest empty state shown. |
| BOTANIST_SAVE_EQUIP | BLOCKED | No qualifying approved item exists to exercise real Save/Equip. No fake success asserted. |
| MY_JOURNEY_PERSISTENCE | PASS for tested synthetic Plan | Confirmed A/B/Custom and zero-goal state read back through local Plan API and survive reload; account isolation passed. |
| EN_VI_LOCALIZATION | PASS for tested onboarding/Plan path | EN and VI Welcome, selection, Quiz and Plan UI exercised; switching language preserved canonical goal IDs and values. Broader game content coverage is outside this run. |
| LEGACY_ACCOUNT_REGRESSION | PARTIAL | Returning authenticated HealthClues Realm resumes without new onboarding and retains Plan; legacy 96-question answer retention was not tested. |
| FULL_PLAYER_E2E | PARTIAL | Full fixture-backed HealthClues Realm activation/Plan journey passed; Sleep reached activation preview only. No real Gemini and no approved eligible botanical content. |

## Known blockers / next task

1. Run authenticated Sleep Valley activation → direct regional entry → Luna Plan → My Journey persistence using a new local synthetic account. No production data is needed.
2. Exercise the real Wellness Guide NPC proximity, details and supported practice Save/Equip behavior without relaxing server eligibility.
3. Obtain editorial/qualified review of a botanical record, provenance, localization and complete safety metadata before personalized Botanist display or equipment acceptance.
4. Real Gemini inference requires explicit owner authorization for a bounded test. Until then, keep Gemini status **not live-verified**; synthetic fixtures are not AI evidence.
5. Continue with authenticated local Sleep Valley activation/direct entry/Plan persistence, then test supported Wellness Guide proximity and actions. Preserve synthetic/live-AI and unreviewed/reviewed-content boundaries.

