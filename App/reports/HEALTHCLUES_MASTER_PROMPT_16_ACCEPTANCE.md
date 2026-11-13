# HealthClues Master Prompt 16 — implementation checkpoint

Date: 2026-11-01  
Overall: **PARTIAL**. Source contract and Plan Builder work are implemented, but genuine Gemini output, browser option-selection/persistence, screenshots and account isolation for generated goals are not accepted yet.

## Starting state recovered

- The repository already contained extensive uncommitted modifications and untracked files. They were preserved; no reset, clean, restore, stage or commit was run.
- Existing Wellness Advisor was a Gemini selector over existing reviewed Catalog candidates. The source gate rejected all candidates before the model call because available habit templates were TEST ONLY. `WellnessPlanBuilder` configured one candidate at a time with numeric targets; it did not have two AI options per goal.
- The current Quiz profile exposes topic, interests/preferences, two-week goal and safety context, but has no structured baseline fields for red-meat frequency, hydration, sleep timing, or physical activity. The new path therefore cannot safely infer quantitative targets.
- Previous genuine synthetic-profile requests to `gemini-3.8-flash` returned HTTP 402/BILLING_REQUIRED. This session did not retry or call the provider. No response was available for JSON/source/safety validation.
- Read Next 16.3 route handler guidance from `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` before editing the route handler.

## Implemented in this session

- Added `src/features/healthclues/personalized-wellness-plan.ts`: strict locale-aware plan schema, allow-listed NIAMS/NHLBI/CDC references, goal-by-goal source/relevance/safety screening, no ungrounded numeric or target metadata, and conversion of an explicitly selected A/B option to the existing Plan goal shape. Added an expiring server HMAC proof bound to the selected option and Quiz profile; the authenticated Plan API rejects client-edited or cross-profile replayed AI output.
- Added the Gemini authoring path in `/api/healthclues/wellness-advisor`. Gemini receives the explicit locale, minimized self-reported Quiz fields, source IDs and prompt constraints; it can return up to six goals and two distinct alternatives per goal. This path no longer depends on an eligible Catalog row. Existing deterministic demo path remains explicitly labeled and separate.
- Updated `WellnessPlanBuilder` to display Gemini goals, select A or B, show one custom-text field on request, allow Skip, and include only selected draft goals in the existing review/confirmation flow. Custom goals use the existing assessment, with additional Vietnamese treatment/medication/herb/supplement/fasting terms blocked.
- Extended the existing Plan goal provenance and authenticated Plan API to validate AI-generated goal shape, source URLs, profile relevance, risk constraints and selected-option metadata before storing it with the existing authenticated World Plan revision. No DB migration was added.
- Added Vietnamese UI labels and disclosure for the new selection flow.

## Verified evidence

- `node --experimental-strip-types --experimental-specifier-resolution=node scripts/test-healthclues-personalized-plan-contract.mjs`: PASS, 14 assertions (schema/safety/source mismatch/unsupported target/relevance/urgent state, no caffeine/red-meat inference when unreported/already avoided, signed-option integrity and profile binding).
- `node --experimental-strip-types --experimental-specifier-resolution=node scripts/test-healthclues-wellness-plan.mjs`: PASS, 42 assertions.
- Focused ESLint across changed TS/TSX and test files: PASS.
- `npm run build:healthclues:isolated`: PASS; Next 16.3 production compilation and its TypeScript pass completed in an isolated build workspace. Existing root `.next` was not used/overwritten.
- Direct repository `tsc --noEmit`: not clean because the existing `.next/types/validator.ts` reports two `Route` vs `never` errors. Isolated production build's own TypeScript pass passed.
- Owner Demo preflight: PASS for local project `healthclues-owner-demo`, `127.0.0.1:54321`, Auth/REST/Mailpit reachable, no inherited remote Supabase URL.
- Newest isolated Owner Demo build: ready at `http://127.0.0.1:3299/play`; server reports Gemini configured, but this is configuration evidence only, not inference evidence. No Gemini request was made. No AI plan screenshot was captured.

## Acceptance not yet verified

- Real Gemini invocation, model response ID, schema response from provider, goal/source/safety acceptance, and Vietnamese Gemini output: **BLOCKED** by prior HTTP 402/BILLING_REQUIRED; no retry made.
- Chromium end-to-end A/B/custom/skip/confirm into World → My Journey → reload: **NOT RUN** on this change. No browser PASS is claimed.
- EN/VI full flow, two-account generated-goal isolation, desktop/mobile layout screenshots and runtime-error check: **NOT RUN** for this change.
- Distinct synthetic Gout/Sleep profiles with and without the specific reported baseline: pure validator coverage is partial; real model behavior was not exercised. Numeric baselines are deliberately not inferred from the existing profile.
- Custom input uses current server-side deterministic text risk assessment; this is a conservative keyword safety gate, not a clinical classifier. It cannot promise detection of every unsafe paraphrase.
- Gemini schema/provider compatibility for nullable nested target fields remains unverified without a provider response. Current server validation rejects any quantitative or ungrounded target metadata until structured baselines exist.

## Actual sources

- NIAMS Gout: https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take
- NHLBI Healthy Sleep Habits: https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits
- CDC Adult Activity: https://www.cdc.gov/physical-activity-basics/guidelines/adults.html

## Exact next task

On the isolated local build, add a clearly `SYNTHETIC TEST FIXTURE · NOT GEMINI` browser-only interception to exercise the new card choice UI, then persist selected goals using disposable local accounts and verify My Journey/reload/account isolation on desktop and mobile without invoking Gemini. After provider billing is available, run one synthetic real request and record its actual model/status/schema/source/safety result. Do not claim overall acceptance before these steps.
