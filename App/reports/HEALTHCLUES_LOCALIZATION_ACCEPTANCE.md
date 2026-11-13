# HealthClues localization acceptance ? 2026-10-31

## Status

**PARTIAL ? full player localization is not complete.** The current owner demo is a production-mode isolated build at http://127.0.0.1:3289/play, backed only by the existing local healthclues-owner-demo Supabase project at 127.0.0.1:54321. Build used read-only reuse; no migrations, seeding, reset, production request, Gemini inference, or secret display occurred.

## Implemented and verified

- English is the first-entry default. The existing Welcome screen offers English / Ti?ng Vi?t and localizes its primary copy and Start Journey action.
- Added shared locale context, HealthClues-only device preference, private profile preferredLocale read/write support, shell/settings language controls, and English/Vietnamese route counterparts: /en/wellness/healthclues/{quiz,world,dashboard} and /vi/wellness/healthclues/{quiz,world,dashboard}.
- Both Quiz routes use the same bank and canonical answer values. Source coverage test found Vietnamese labels for all 96 current question IDs and every bundled option label; 1, 2, 3 and English are deliberately language-independent.
- Chromium confirmed Vietnamese C01 and C02 question/answer controls, localized quiz progress/navigation, switch to English at C02, canonical C01 answer and step persistence through locale navigation and refresh, and guest locale persistence in localStorage.
- Mobile 390?844 test confirmed Welcome and Quiz fit without horizontal overflow; the language control is visible and reachable in the Quiz header. Desktop was 1440?900.
- Existing Quiz safety suite passed 38 assertions; adaptive Quest branch checks passed across eight Quest/topic mappings and the general fallback. Isolated Next production build and `node --check scripts/test-healthclues-localization.mjs` passed. Focused ESLint completed without output/errors.

## Incomplete / unverified

- The browser journey did not authenticate a synthetic account. Profile preference read/write, account activation, returning-player locale, two-account locale isolation and preservation of confirmed Plan/World/inventory were not browser-verified. No account-level PASS is claimed.
- The full Quiz reveal, profile save/consent, Wellness Plan builder, AI Advisor messages/errors, dashboard and all remaining game surfaces are not fully translated.
- My Journey has selected Vietnamese labels/empty-state copy, and several World tutorial strings have translations, but there is no Vietnamese authenticated Pet-tour or My Journey screenshot and no browser verification of those flows.
- NPC dialogue, reviewed content/catalog details, Toolkit/Collection/Backpack, knowledge, minigames, settings/errors and dynamic goal/content names are not fully localized. Approved Vietnamese medical/knowledge coverage is not established; Gemini was not invoked. Existing localized UI currently may fall back to English strings where a dictionary entry is missing.
- Current screenshot set covers Welcome, Quiz intro, C01/C02 and responsive English Quiz only. It does not prove full Vietnamese journey completion.

## Chromium screenshots

Stored under `reports/previews/healthclues-localization-20261031/:

- `english-welcome-desktop.png`
- `vietnamese-welcome-desktop.png`
- `vietnamese-welcome-mobile.png`
- `vietnamese-quiz-intro-desktop.png`
- `vietnamese-quiz-question-desktop.png`
- `vietnamese-quiz-question-mobile.png`
- `vietnamese-quiz-c02-desktop.png`
- `english-quiz-mid-progress-desktop.png`
- `english-quiz-mobile.png`

Each screenshot was opened and visually inspected.

## Exact next task

Complete Vietnamese coverage for Quiz reveal/profile/Plan, Advisor UI and truthful unavailable states, all My Journey/Pet/NPC/navigation/content/game surfaces; add a clear reviewed-content language-gap fallback. Then run two synthetic local accounts through locale preference activation/return/isolation and full English/Vietnamese Quiz ? Plan/Advisor ? World ? Pet tutorial ? My Journey ? NPC journeys on desktop and mobile. Keep canonical IDs and safety rules unchanged.

## Plan Builder / Gemini diagnostic continuation — 2026-10-31

**Acceptance remains PARTIAL.** Isolated build target: http://127.0.0.1:3292/play (recheck process before opening). Runtime was launched with the private secrets/healthclues-owner-demo.env by the guarded owner-demo launcher; values were never printed. Requested Gemini model: gemini-3.8-flash. Two genuine requests using synthetic Gout and Sleep Quiz profiles returned HTTP 402 (billing required), with no model JSON/response ID; therefore schema, knowledge-source and model-output safety validation did not execute. Subsequent current-app requests were blocked earlier because the local candidate catalog has no eligible reviewed source content, and logged sanitized category SOURCE_VALIDATION_FAILED.

Updated the Plan Builder and Reveal to localize Quiz-derived topic, selected interest and focus through the canonical option translator, localize fallback region labels, keep technical status codes out of user UI, and avoid rendering unlocalized/test-only candidate cards in Vietnamese. The exact state shown is an honest source gap; no recommendation is invented. The advisor API continues to receive locale and retains the same canonical response schema.

Chromium 1440x900 and 390x844 synthetic Reveal/Plan views were captured and visually inspected; no horizontal overflow and zero runtime exceptions. Files: reports/previews/healthclues-plan-vi-gemini-20261031/vi-reveal-desktop.png, vi-plan-desktop.png, vi-plan-mobile.png, en-reveal-desktop.png, en-plan-desktop.png, en-plan-mobile.png (all under that directory). This browser fixture is not evidence of a completed real Quiz or confirmed Plan.

Two separate synthetic accounts in local healthclues-owner-demo retained vi/en in profile preference after a fresh sign-in; attempted cross-account World update returned 404. No deletion was performed. Focused test results: Quiz safety 38 assertions; Plan rules 42; eight Quest mappings plus fallback; ESLint clean. A pre-existing general localization E2E harness timed out at CDP Page.enable; the dedicated Chromium harness ran successfully.

**Still missing:** approved, reviewed topic-matched checklist source (including Vietnamese copy); a successful authenticated Quiz → confirm Plan → World/My Journey → reload journey in both locales; activation/callback browser lifecycle; complete localized game/NPC surfaces. Exact next action: supply/review bilingual safe candidate content, then rerun authenticated E2E on the isolated demo. No production actions were taken.
# Final verification addendum — 2026-10-31

The final isolated build completed at http://127.0.0.1:3292/play. Catalog API returned 14 entries: all 14 have `demoOnly=true`, with 0 reviewed/eligible candidates. This is why the current Plan Builder reports a localized source gap and the app does not call Gemini on those profile requests.

The exact Vietnamese Gout label is “Gút và axit uric”. Final screenshot set was regenerated after the last source change: `reports/previews/healthclues-plan-vi-gemini-20261031/vi-reveal-desktop.png`, `vi-plan-desktop.png`, `vi-plan-mobile.png`, `vi-plan-mobile-actions.png`, `en-reveal-desktop.png`, `en-plan-desktop.png`, `en-plan-mobile.png`, `en-plan-mobile-actions.png`. Chromium reported zero runtime exceptions and no horizontal overflow at 1440x900/390x844 for the tested Plan views; both mobile pages scroll and the Continue action can be scrolled into the viewport. The screenshots were opened and inspected.

The final build and documentation guard completed successfully. Overall remains **PARTIAL** because neither an authenticated confirmed-Plan → World/My Journey reload journey nor a successful source-valid Gemini JSON response was demonstrated. The two-account locale check was an authenticated local profile API test, not a browser activation test.

