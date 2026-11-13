<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## HealthClues project navigation

- Read `App/MASTER_SPEC.md`, `App/UI_UX_SPEC.md`, `App/USER_FLOWS.md`, `App/BUSINESS_RULES.md` and the latest `App/reports/V1_*` before changing HealthClues behavior.
- Route `/play` and the shared game presentation live in `src/app/play` and `src/components/healthclues`; existing feature logic remains under `src/features/healthclues` and `src/components/healthclues`.
- Master Prompt 04 implementation and current evidence: `App/HEALTHCLUES_MASTER_PROMPT_04.md` and `App/reports/GAME_SHELL_ACCEPTANCE.md`.
- Master Prompt 05 visual work and evidence: `App/MASTER_PROMPT_05_RPG_VISUAL.md` and `App/reports/RPG_VISUAL_ACCEPTANCE.md`. Reuse `HealthCluesAdventurer` for the shared character sprite; keep player-state logic in existing feature components and APIs.
- On Windows, avoid running Next from the repository root while sibling `App` and `src/app` coexist; use the guarded isolated build or an isolated local dev copy. Never overwrite root `.next` baselines.

## Required HealthClues memory workflow

For every HealthClues task, first read `App/HEALTHCLUES_CONTEXT.md`, `App/CURRENT_STATE.md`, this file, and the relevant canonical documents under `App/`. Inspect actual source and Git status; reports are evidence snapshots and may be superseded by newer dated sections.

Before coding, name the affected user flow, business rule, use case, UI, schema/security boundary and acceptance case. Keep product-approved, planned, implemented, automated-test verified and browser-verified states distinct. Preserve all eight Overworld IDs/artwork; only Sleep Valley and HealthClues Realm are currently playable. Do not treat approved requirements as shipped behavior.

After a material change, update only affected canonical specs, implementation/progress/test evidence and `App/CURRENT_STATE.md`. Run focused relevant tests and `npm run docs:healthclues:check -- --files <changed paths> --docs <documents actually updated>`. The guard only detects likely omissions; review content manually. Never stage, commit, push, deploy or touch production automatically. Do not record secrets or use production Supabase for test data.
