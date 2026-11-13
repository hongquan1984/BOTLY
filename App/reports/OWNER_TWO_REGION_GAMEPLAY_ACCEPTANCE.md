# HealthClues — Owner Two-Region Gameplay Acceptance

**Mốc:** 09B + addendum RPG navigation  
**Ngày kiểm tra:** 2026-10-29  
**Kết quả tổng thể:** PARTIAL — authenticated game loop and two region scenes are browser-verified; reviewed topic content and several deeper gameplay systems remain incomplete.

## Owner demo và isolation

- **Game:** [http://127.0.0.1:3238/play](http://127.0.0.1:3238/play)
- **Mailpit inbox:** [http://127.0.0.1:54324](http://127.0.0.1:54324)
- **Local Auth/API and PostgreSQL:** `127.0.0.1:54321` and `127.0.0.1:54322`.
- **Verified isolated project/volume:** `healthclues-owner-demo` / `supabase_db_healthclues-owner-demo`; not the E2E fixture volume. `.env.local` was not used. Browser signup messages were captured by local Mailpit. No production writes, external email, or deployment occurred.
- The 3238 build remains running for owner review. It is a separate isolated build; the existing 3235 process was not terminated or overwritten.

Start/restart from PowerShell:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_PORT='3238'
$env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME='app-build-09b3'
node scripts/start-healthclues-owner-demo.mjs
```

Rebuild current source (preserves the demo DB volume):

```powershell
$env:HEALTHCLUES_OWNER_DEMO_PORT='3238'
$env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME='app-build-09b3'
node scripts/start-healthclues-owner-demo.mjs --rebuild
```

Stop this named app/local Supabase project while preserving its volume:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_PORT='3238'
$env:HEALTHCLUES_OWNER_DEMO_BUILD_NAME='app-build-09b3'
node scripts/start-healthclues-owner-demo.mjs --stop
```

`App/start-game-demo.bat` sets the same demo port/build name. These commands require local Docker Desktop. Do not use `.env.local` or point this demo at production.

## Acceptance matrix

| Hạng mục | Implemented | Browser verified | Persistence verified | Visual QA | Result / giới hạn |
|---|---|---|---|---|---|
| Existing Auth/email activation and Backpack | Yes; existing flow reused | Chromium + local Mailpit/real local Supabase confirmation | Yes; saved World reload | Desktop capture | PASS for isolated local provider |
| Authenticated World no longer renders scrolling V1 dashboard | Yes; dedicated `WorldAdventureScene` branch | Old active-trail/timeline/community sections absent | Existing APIs retained | Desktop/mobile captures | PASS for tested route |
| Eight global regions, two playable, six Coming Soon | Yes; current World renderer and stable IDs reused | Eight markers; two open/six locked; locked click stays in scene | No new World writes from locked interaction | Desktop/mobile | PASS |
| Sleep Valley detailed scene + Luna | Yes, shared region renderer | Sleep account entered map, Luna, Camp, Collection and Knowledge | World ID and branch unchanged on reload | Desktop/mobile | PARTIAL: interactive scene works; illustration is code-drawn SVG, not final hand-painted art |
| HealthClues Realm + Lumi | Yes, same renderer | Health Quiz Gout context led directly to Realm/Lumi; no repeat concern selector | Quiz profile topic is read from the verified owner profile | Desktop/mobile | PARTIAL: journey context is derived from existing profile, not a new normalized Journey model |
| Health discovery stations | Yes, clickable in-map locations | Herbal & Nutrition opens; empty state is topic-scoped | No unsupported item was equipped | Desktop | PARTIAL: no eligible reviewed Gout items exist in the local catalog |
| Journey-relevant Knowledge | Strict topic matching added | Gout library showed truthful “no reviewed Knowledge” state, not unrelated content | Existing Knowledge APIs retained | Desktop | PARTIAL: no reviewed Gout article/quiz content available to play |
| Sleep-specific selected Quiz interest | Available when present in profile | Browser test recorded Sleep & rest; no repeated Quiz | Profile read owner-scoped | Desktop | PARTIAL: deeper sleep answer was not reached in current adaptive path |
| Toolkit/Collection/Check-in/Journal/Knowledge/Boss/Rewards/Community presentation | Existing components connected through scene panels/modals where present | Toolkit/Collection/Knowledge and Check-in navigation checked; regression route guard | Existing owner-scoped APIs remain | Some captures only | PARTIAL: not every contextual panel/feature in the detailed map was exercised manually |
| One shared Collection; loadout by Journey | Existing Collection component reused | Toolkit slots displayed | No separate per-Journey loadout persistence introduced | Toolkit capture | PARTIAL: per-Journey saved loadout switching is not implemented/verified |
| Pet daily companion, Knowledge mini-games, Skills, full Boss/reward loop in each map | Not complete | Not verified end to end in this milestone | Not verified | Not captured as complete | PARTIAL / NOT DONE |
| Guest and account isolation | Existing gates retained | Guest World request denied; second account could not read first user's private check-in | Two synthetic local accounts | Runtime errors: 0 | PASS for exercised API paths |

## Browser journeys and evidence

Actual Chromium test against the same owner build intended for the owner:

```powershell
$env:HEALTHCLUES_OWNER_DEMO_URL='http://127.0.0.1:3238'
node scripts/test-healthclues-owner-auth-demo.mjs
```

The test created synthetic local accounts and used genuine local Supabase Auth confirmation messages from Mailpit. Sleep and Health/Gout journeys passed onboarding with the ten-question maximum. Gout was preserved into HealthClues Realm and Lumi; it was not asked again. Both saved Worlds resumed on reload with their existing IDs. Guest World API access was denied, and cross-account private check-in access returned no data. Browser uncaught runtime errors: 0.

Additional checks:

- `node scripts/test-healthclues-quiz-safety.mjs` — PASS, 38 assertions.
- `node scripts/test-healthclues-quiz-branches.mjs` — PASS, eight Quest/topic mappings and fallback.
- Focused ESLint on changed TS/TSX/scripts — PASS.
- `node --check` on changed browser scripts — PASS.
- Isolated owner launcher `--rebuild` — PASS; `/play` compiled from current source.
- Existing full `scripts/run-healthclues-game-e2e.mjs` was not rerun for this 09B change; it is historical regression evidence only.
- Hosted email delivery, expired/replayed real provider tokens, browser-close/reopen and the full post-restart journey were not newly verified in this run.

## Screenshots from final 3238 owner build

All paths are under `App/reports/previews/`; desktop is 1440×960 and mobile is 390×844 where listed. The captured outputs were opened and visually inspected.

- [Authenticated World desktop](previews/owner-auth-persistent-world-desktop.png)
- [Authenticated World mobile](previews/owner-auth-persistent-world-mobile.png)
- [Sleep Valley desktop](previews/owner-two-region-sleep-map-desktop.png)
- [Sleep Valley mobile](previews/owner-two-region-sleep-map-mobile.png)
- [Sleep Valley Adventure Camp](previews/owner-two-region-sleep-camp-desktop.png)
- [Sleep Valley Knowledge state](previews/owner-two-region-sleep-knowledge-desktop.png)
- [HealthClues Realm / Gout desktop](previews/owner-two-region-health-gout-desktop.png)
- [HealthClues Realm / Gout mobile](previews/owner-two-region-health-gout-mobile.png)
- [Gout Herbal & Nutrition station](previews/owner-two-region-health-gout-station-desktop.png)
- [Gout Knowledge empty state](previews/owner-two-region-health-gout-knowledge-desktop.png)
- [Activation overlay](previews/owner-auth-activation-overlay-desktop.png)
- [Backpack](previews/owner-auth-backpack-desktop.png)

The two region compositions are distinct and interactive, with their Pet and selected Journey visible. They use a programmatic SVG environment; approved World map artwork remains unchanged, but authored detailed hand-painted region assets are still an art dependency. The Knowledge screenshots intentionally show an honest empty state because no reviewed, topic-matched Sleep/Gout article was available; they are not evidence of completed lessons or quizzes.

## Source changes

- `src/features/healthclues/WorldAdventureScene.tsx` — replaces the saved authenticated V1 scrolling page with the global map/game HUD and in-scene feature panels.
- `src/features/healthclues/RegionMapScene.tsx` — shared detailed region scene and working landmark/return interactions.
- `src/features/healthclues/HealthCluesPet.tsx` — shared Luna/Lumi presentation.
- `src/features/healthclues/DailyCheckinDialog.tsx`, `src/features/healthclues/world-adventure.css` — in-game check-in presentation and viewport/overlay styles.
- `src/features/healthclues/WellnessWorldGame.tsx` — route into authenticated RPG presentation and owner-scoped profile context.
- `src/features/healthclues/world-map.tsx`, `src/features/healthclues/world-map-immersive.css`, `src/components/healthclues/HealthCluesGameShell.module.css` — retain the existing eight-region map and viewport layout.
- `src/app/api/healthclues/knowledge/route.ts`, `supabase/migrations/20261029100000_healthclues_quiz_topic_knowledge.sql` — strict owner Journey topic match for Knowledge eligibility.
- `scripts/start-healthclues-owner-demo.mjs`, `scripts/test-healthclues-owner-auth-demo.mjs`, `scripts/verify-healthclues-owner-resume-after-restart.mjs`, `App/start-game-demo.bat` — isolated named owner build, actual browser checks and launcher configuration.

## Next milestone / remaining work

1. Provide qualified-reviewed, topic-tagged Sleep and supported Health Knowledge/Catalog content in the isolated demo before claiming playable educational content.
2. Replace programmatic region environment drawings with approved production-quality region assets while retaining current renderer and interactions.
3. Implement/verify explicit canonical Journey records and per-Journey Toolkit loadout switching rather than deriving the displayed topic from existing discovery profile data.
4. Complete and browser-test Daily Companion's optional two-to-three-question behavior, Knowledge Quick Quiz/mini-games, Skill progression, Boss and persisted map rewards inside both scenes.
5. Run the existing full isolated E2E and a dedicated restart/resume browser scenario on the final 3238 build; expand mobile interaction and keyboard/accessibility coverage.

Product/content/privacy/security release gates remain open. This milestone does not claim production readiness.
