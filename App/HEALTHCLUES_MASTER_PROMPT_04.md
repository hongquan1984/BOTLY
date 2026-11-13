# HealthClues Master Prompt 04 — Immersive RPG Web Game App

## Mission

Continue the existing HealthClues V1 in `D:\botly`. Make HealthClues feel like a premium, cozy fantasy RPG web application while preserving the existing Next.js host, Supabase data model, reviewed content and working Botly routes. Do not rebuild V1, duplicate game logic or create another database.

## Product requirements

- `/play` is the canonical entry. New visitors see the RPG Welcome; returning players with a saved World resume it; unfinished Quiz drafts resume only for the same account.
- Use one full-screen HealthClues Game Shell without Botly marketing navigation, website footer, SEO sections or ebook promotion. Preserve the website layout for all unrelated routes.
- New player path: Welcome → existing eight Quest choices → existing adaptive/safe Quiz → existing Toolkit → existing persistent World.
- Preserve guest discovery, age/consent restrictions, safe general-information path, owner-scoped persistence, RLS, server-authoritative rewards, reviewed wellness content and all current deletion/community protections.
- Keep the existing eight-biome World map and existing Quest, Quiz, Toolkit, Collection, Knowledge, Community, Check-in, Boss, reward and profile logic. Connect navigation to real routes/state; no decorative dead controls.
- Use mobile-first responsive layout, keyboard/touch access, visible focus, reduced-motion support, safe areas and no horizontal overflow. Do not auto-play sound or force fullscreen.
- Keep the World as one persistent player journey. Never fabricate XP or progression, reward excessive use, imply medical outcomes, bypass safety gates, or write demo fixtures to production.

## Preview and safety

- Maintain local preview at `http://127.0.0.1:3210/play` and verify the actual Next development server.
- Diagnose source causes of compilation failures; preserve existing styles and guarded isolated build strategy. On Windows, `D:\botly\App` collides case-insensitively with Next's `app` convention; run the preview from an isolated copy of `src` and configuration.
- Inspect `.env.local` before any persistence. Localhost does not imply a test database. Do not sign in, write synthetic content, run production migrations, deploy, send real email or disturb unrelated processes/containers.
- Do not delete root `.next` or preserved build baselines.

## Visual and engineering acceptance

Verify `/play`; Welcome and Start Adventure; all eight Quests; existing Quiz safety; Toolkit/Collection/World; returning and incomplete onboarding state; account-switch privacy; game navigation; Boss/rewards and persisted unlocks; no website chrome; desktop 1440px and mobile 390px; overflow, touch, keyboard, reduced motion and browser history; dev CSS compilation; existing game/database regression where safe. Capture and inspect desktop/mobile Welcome, Quest and World, plus Toolkit and Boss. Never claim unexecuted checks or production readiness.

## Handoff

Update `App/reports/V1_PROGRESS.md`, `V1_TEST_RESULTS.md`, `V1_RELEASE_READINESS.md` and create `App/reports/GAME_SHELL_ACCEPTANCE.md`. Record code/routes reused, tests and screenshots actually verified, exact local preview command/URL, limitations and independent content/security/privacy release blockers. This prompt extends Master Prompt 03 and does not replace it.
