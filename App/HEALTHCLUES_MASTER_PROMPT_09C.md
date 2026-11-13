# HEALTHCLUES ? MASTER PROMPT 09C
# LIVING RPG WORLD, NPC WELLNESS ENCYCLOPEDIA AND PRIVATE CARE PLAN

Project: `D:\botly` ? documentation: `D:\botly\App`. Consumer-facing content remains English; owner reports are Vietnamese. This brief preserves Milestones 09A/09B and the existing Next.js/Supabase app. Do not use production Supabase, send external email or deploy.

## Approved product scope

- One player, adventurer and persistent World. Keep all eight existing Overworld regions visible; only Sleep Valley/Luna and HealthClues Realm/Lumi have detailed playable maps. The other six remain Coming Soon.
- Reuse the original Discovery Quiz Journey context. Health concerns are self-reported interests, not diagnoses. Knowledge remains inside the active Region Map.
- Enter the region before equipment decisions. The Pet optionally guides the player to Herbal & Nutrition, Activity Trail, Wellness Sanctuary, Backpack and in-map Knowledge. Free exploration and Skip remain available.
- Provide distinct Botanist, Explorer, Wellness Guide and optional Care Records Keeper interactions through shared components, not unrestricted medical chatbots.
- Show only active current editorially reviewed Catalog items matched to the saved Journey. Editorial review, evidence quality, individual suitability and personal tracking are separate. Empty state is honest; never invent evidence, citations, dosing, efficacy or a recommendation.
- Keep Collection (saved for learning), Backpack (eligible game tools), Care Plan (user-reported methods and medication records) and Journal distinct. Care Plan is private, explicit, editable, pausable and removable. It does not publish user entries, auto-equip, prescribe, advise dose changes, infer adherence or grant XP.
- Daily Companion remains optional (two short prompts by default, up to three when useful); no mandatory survey or medication adherence reward.

## Implementation and verification requirements

Inspect specs/source/status before edits. Reuse existing renderer unless measured shortcomings justify a library. Preserve map geometry and stable IDs. Add owner-scoped API validation, no-store responses, database constraints/RLS and explicit user/World ownership checks for any private record. Never place health records in browser storage, URLs, email, analytics or logs. Use only isolated local Auth/DB/Mailpit for writes. Run focused tests and actual owner-browser desktop/mobile checks; distinguish implemented, automated, browser and persistent verification.

Record sources, migrations, license/asset evidence, screenshots and blockers in canonical specs, `CURRENT_STATE.md` and the 09C reports. Do not imply content review, daily dialogue, mini-games, Skills, production security, or final art is complete without evidence.
