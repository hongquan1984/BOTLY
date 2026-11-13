# HEALTHCLUES — FINAL COMPLETE GAME DELIVERY

This file preserves the owner-approved final delivery directive from the project handoff. It supersedes earlier unexecuted milestones where they conflict. Keep this assignment resumable through `CURRENT_STATE.md` and `reports/FINAL_GAME_DELIVERY_CHECKLIST.md`.

## Mission and safety

Finish the integrated local playable HealthClues RPG in the existing Botly Next.js application. Do not deploy, modify production data, use production Supabase for tests, stage/commit/push, or replace working systems. Keep consumer UI English and owner reports Vietnamese. Preserve local Supabase/Auth, Mailpit, secure Quiz handoff, persistent single World, Quiz/Journey context, Care Plan, Collection, Backpack, Knowledge/Boss engines, RLS, global Overworld, and existing movement/browser tests. Do not ask for information already in project documentation. Read applicable `AGENTS.md`, `HEALTHCLUES_CONTEXT.md`, `CURRENT_STATE.md`, canonical specs, reports, source, assets, migrations, test infrastructure, and Git status before coding. Save incremental state after meaningful stages.

## Product architecture

- One account, one adventurer, one persistent My Wellness World.
- Global map retains all eight approved regions and identifiers. Sleep Valley and HealthClues Realm are playable; the other six are visible Coming Soon.
- Sleep Valley uses Luna. HealthClues Realm uses Lumi and the self-reported topic/goal from the original Discovery Quiz. Never ask the same concern again or present it as a diagnosis.
- Knowledge, lessons, educational quizzes, mini-games, Boss and rewards happen inside the active detailed region. No Knowledge land, Quiz land, or generic long scrolling dashboard.
- Keep all production review, evidence, suitability and safety gates. Local synthetic fixtures must be visibly TEST ONLY, isolated, and never represented as human-reviewed or clinically approved.

## Final player experience

The player completes the original Quiz (maximum ten questions), verifies a synthetic account using local Mailpit, resumes the saved Journey, enters the corresponding detailed region, meets the correct Pet, explores by walking, approaches distinct NPCs, reads relevant educational entries, saves or privately tracks choices, optionally adds their own methods or medication records, reviews a three-slot Backpack, begins the Journey, learns through optional Knowledge activities, optionally attempts a Boss, sees only legitimate persisted progress, checks in privately, and resumes the same World after reload/restart. Returning players do not repeat onboarding. One clear suggested action at a time; Follow Guide, Explore Freely, Skip Guide.

## Region gameplay

Sleep Valley contains Adventure Camp/Care Records Desk, Food & Botanical Garden, Activity Trail, Wellness Sanctuary, Knowledge Library, Boss Challenge, and Rewards/Dream Observatory. HealthClues Realm contains equivalent Journey-specific locations. Both are explorable illustrated scenes using the same renderer. Player movement, walking animation, bounds/navigation, smooth camera, Pet follow, NPC approach radius, Talk only when nearby, overlay close/resume position, desktop/mobile controls, keyboard alternatives and reduced-motion behavior must be verified. No teleporting or walking through water/buildings/trees/cliffs. Preserve the existing React renderer unless measured evidence requires a small isolated engine prototype.

## Educational discovery and personal records

The shared NPC system includes Botanist, Explorer, Wellness Guide, and optional Care Records Keeper. All use one canonical owner-scoped Journey Context. The encyclopedia covers food/botanicals, activities and wellness practices, with search/filter, Quick Preview, Full Details, source links, evidence limitations and essential safety information. Separate editorial publication status, evidence quality, personal suitability and player selection. Provide distinct actions: Save to Collection, Track My Use (USER-REPORTED), and Add to Backpack only when existing server-side eligibility permits. Allow private user-added methods labelled USER ADDED — NOT VERIFIED BY HEALTHCLUES, with edit/pause/resume/remove. Optional medication records copy user-entered prescription/label information; never infer doses, alter prescriptions, award adherence XP, or put medications in Backpack slots. Keep Care Plan, Collection, Backpack and Journal separate and private.

## Backpack, daily companion, learning and progression

Backpack is a compact RPG inventory for up to three player-chosen eligible tools in existing Consume/Eat, Reduce/Avoid, Do/Practice slots; zero tools is valid. No auto-equip. Daily Pet interaction is optional, normally two questions and at most three, with private self-reported tracking/notes; no missed-dose advice, adherence rewards, symptom-efficacy inference, or punishment for skips. Knowledge remains in-region, offers short lessons, optional Quick Quiz, mini-games, four learning Skills (Health Knowledge, Natural & Nutrition, Movement, Mind & Sleep), five levels (Novice, Explorer, Learner, Scholar, Master), and deduplicated existing progression only. Boss and cosmetic rewards reuse server-authoritative APIs. No new spendable currency. If approved content is absent, use clearly labelled isolated TEST ONLY fixtures or honest empty states; never fake approved content/rewards.

## Art, map and technology

Preserve approved Overworld art. Inspect current assets/licensing before changes. Region art should be coherent hand-painted fantasy, with separate background/foreground/collision/sprite/hotspot/UI layers and stable normalized coordinates. No flat polygon/dotted schematic or unrelated stock characters as final art. Do not claim placeholder art is complete. Measure existing movement/rendering before considering Phaser/Pixi. Do not install competing engines. Optimize local assets; no hotlinks; respect reduced motion and mobile safe areas.

## Isolation, tests and delivery

Use only the existing isolated local Supabase/Auth/Postgres and Mailpit; never print credentials or use production `.env.local`. Do not reset/delete unrelated data, processes, Docker volumes or build artifacts. Verify two synthetic accounts, private record isolation, anonymous read-only state, Auth/consent/age gates, unique World, reload/restart, health-topic continuity, equipment validation, self-added methods, medication privacy, daily check-in, Knowledge/Boss idempotency, map movement/proximity, desktop 1440×960 and mobile 390×844. Browser emulation is not physical-device QA; report honestly. Capture actual screenshots and inspect them. Fix failures and rerun focused tests. Never claim full local demo PASS from mocks or static screenshots.

## Completion handoff

Update existing canonical specifications, `CURRENT_STATE.md`, `HEALTHCLUES_CONTEXT.md`, implementation plan and acceptance tests. Create `App/reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`. Report actual game/inbox URLs and commands, code/assets/migrations, engine choice, fixture provenance, tests, screenshots, performance, isolation/privacy and remaining blockers. Distinguish implemented, automated-tested, browser-verified, owner verification pending, and blocked. Production readiness is separate from isolated demo completion. Do not create another milestone-planning cycle; continue implementation until accepted local gameplay passes or a real external blocker prevents completion.


## Backpack & Toolkit final execution — 2026-10-30

The integrated discovery → Collection → flexible three-position Backpack → private Daily Companion flow is implemented in the existing scene and passed authenticated Chromium E2E on the isolated local Owner Demo at http://127.0.0.1:3249/play. The current dated section in eports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md records exact tests, local DB readback, screenshots and the remaining owner/content/device-review blockers. No production data or deployment was used.
