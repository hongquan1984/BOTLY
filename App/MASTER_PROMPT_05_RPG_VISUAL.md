# HealthClues Master Prompt 05 — RPG Visual Experience

## Objective

Continue the existing HealthClues V1 inside the Botly Next.js application. Keep the database, APIs, safety rules, eight-biome World map, and existing gameplay. Make `/play` a coherent premium cozy-fantasy web-game experience. Do not rebuild the application, deploy production, or write synthetic data to production.

## Product and visual direction

HealthClues is a browser game, not a marketing site, blog, SaaS dashboard, or questionnaire. Preserve the accepted Welcome and World artwork as the visual baseline: hand-painted natural biomes, forests, rivers, waterfalls, mountains, villages, atmospheric lighting, midnight blue/forest green/teal, parchment, and warm gold. Maintain accessible reading and controls. Player screens must not show Botly marketing chrome, SEO sections, promotions, or footer.

Use one reusable, recognizable adventurer companion across appropriate game scenes. Prefer existing licensed project assets; create only missing assets and document any remaining art dependencies. Keep artwork separate from interactive controls and preserve reduced-motion support. Never imply that the companion is a medical professional.

## Canonical routes and gameplay

- `/play` remains the canonical entry and uses the existing Game Shell.
- New players: Welcome → existing eight Quest choices → existing eligibility/adaptive Discovery Quiz → results → existing Toolkit → existing persistent World.
- Returning players resume their saved World; incomplete onboarding resumes without losing answers. Do not leak stale account data after account switches.
- Keep existing Quiz bank, mappings, persistence, age/consent gates, reviewed-content restrictions, guest discovery, server-authoritative rewards, and all existing API contracts.
- The World map remains the primary home. Toolkit/Collection, Check-in/Journal, Knowledge, Boss, Rewards, Community, and Profile must continue using existing models and actions.
- Never fabricate XP, findings, reviewed content, unlocked structures, or rewards. Do not bypass content review, privacy, consent, RLS, or account ownership checks.

## Visual work priority

1. Audit existing screens, routes, assets, tests, and specifications before editing.
2. Reuse the existing Welcome illustration and eight-biome World. Establish shared colors, panels, controls, character poses, and motion.
3. Replace the plain white Quiz presentation with an illustrated Quest scene, one question at a time, progress, answer states, navigation, loading/error feedback, and mobile layout. Keep the eligibility checkpoint clear and preserve its original behavior.
4. Bring Quest selection and Results into the same fantasy presentation.
5. Present the existing Toolkit and Collection as equipment/inventory while preserving three wellness slots, reviewed catalog eligibility, opt-in equipment, collection separation, safety notes, and owner-scoped persistence.
6. Keep the map dominant; present Check-in, Knowledge, Boss/rewards, and Community as in-world scenes while retaining their actual data and rules.
7. Reuse a consistent character where suitable, then capture and inspect desktop/mobile visual evidence.

## Technical and safety constraints

- Work in the existing Next.js App Router project; do not add another application or Supabase project.
- Read applicable local Next.js guides before source edits. Preserve the guarded isolated Windows build/dev strategy for the sibling `App` and `src/app` case collision.
- Prefer the existing Motion/rendering stack. Respect `prefers-reduced-motion`, touch, keyboard focus, screen-reader labels, safe areas, and viewport sizing.
- Inspect `.env.local` before authenticated tests or writes. It has previously pointed to production; do not use it for this demo. Use an isolated database or read-only/guest preview. Never send real emails or alter production.
- Check port/process ownership before starting servers. Do not remove build baselines, demo progress, Docker state, or unowned files.
- Run focused validation; bound test timeouts. Do not claim a test or visual inspection passed unless it actually ran and was inspected.

## Visual and regression acceptance

Capture Welcome, Quest, Eligibility, Quiz, Results, Toolkit, World, Check-in, Knowledge, Boss, Rewards, and Community on desktop and 390px mobile where the available safe state permits. Inspect for consistent art direction, legibility, working controls, selected Quest, character consistency, no Botly chrome, overflow, and state correctness. Mark inaccessible authenticated states or missing art as PARTIAL/BLOCKED. Keep production content/security/privacy approvals separate from visual completion.

## Handoff

Update `App/reports/V1_PROGRESS.md`, `App/reports/V1_TEST_RESULTS.md`, and `App/reports/V1_RELEASE_READINESS.md`; create `App/reports/RPG_VISUAL_ACCEPTANCE.md`; record changed files, reused/created assets, tested routes, screenshots actually captured and inspected, preview URL, environment isolation, limitations, and outstanding release blockers. Keep AGENTS.md navigation guidance current. No production deploy.
