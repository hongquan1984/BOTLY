# HealthClues Master Prompt 07 — Seamless RPG Onboarding

Date: 2026-10-28  
Project: `D:\botly`

## Mission

Continue the existing HealthClues RPG without rebuilding its Next.js app, database, gameplay, approved map, or art direction. Make `/play` one continuous player journey:

**WELCOME → QUEST → DISCOVERY (maximum 10 initial questions) → SHORT REVEAL → READ-ONLY WORLD PREVIEW → CONSENTED EMAIL ACTIVATION → IN-GAME BACKPACK → PERSISTENT WORLD.**

The player must see and explore the actual eight-region World before registration. Preview must not create a private World, award XP, record check-ins, equip tools, or expose private data. Starting a persistent journey requires eligibility, explicit profile/World consent, and a verified account. Reuse the existing auth provider, Quiz/profile APIs, toolkit/catalog, idempotent World creation, and game shell.

## Required implementation behavior

- Preserve the accepted Welcome, Quest, Quiz, companion, World map, Boss/Rewards art, safety checks, RLS and existing routes.
- Limit the initial Discovery interaction to at most ten unique questions including the age checkpoint. Underage and unknown-age users do not enter personalized progression. Do not append another question set or repeat the Quiz.
- Replace the onboarding report with a brief companion-led reveal using actual answers; keep detailed profile controls in a secondary contextual area.
- Show the actual map as a clearly labeled read-only preview. Open activation as a consent-first parchment overlay over that map; email submission alone is not account verification.
- Bind pending context to the verified email and selected Quest, expire it, avoid putting answers in URLs/email/analytics, preserve an existing profile/World, and use the existing idempotent World creation path.
- After verification, remain in the Game Shell and open the existing Toolkit as an optional backpack. Allow zero to three tools; no automatic equipment and no blocking on an empty reviewed catalog.
- Returning verified players resume the same saved World. Preserve Back/Forward and account-owner isolation.
- Use isolated test infrastructure only. Never write demo data to production or deploy.

## Acceptance and evidence

Capture and inspect actual desktop (1440×960) and mobile (390×844) browser screenshots for Reveal, World Preview, activation, verification-pending, Backpack and persistent/returning World. Run focused browser regression against the isolated DB and mock email provider. Mark unsupported real-provider auth, cross-account or safety cases PARTIAL/BLOCKED; do not claim production readiness. Record screenshots, test commands/results, preview URL, limitations, and independent content/privacy/security release gates in `App/reports/SEAMLESS_GAME_FLOW_ACCEPTANCE.md` and the current V1 reports.

## Non-goals

No game/map/database rewrite, second account system, new game engine, production write/deploy, changes to age/safety/consent/reward rules, or fake reviewed wellness content.
