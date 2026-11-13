# HealthClues — Full Project Progress Audit

**Audit date:** 2026-10-29 (Asia/Bangkok)  
**Repository root:** `D:\botly`  
**Git revision:** `3761b52`  
**Worktree:** dirty; many pre-existing modified and untracked Botly/HealthClues files. This audit did not stage, commit, deploy, change gameplay, or access production data.

## Executive finding

HealthClues has a working guest-only RPG entry and read-only World preview. On 2026-10-29, Chromium verified `http://127.0.0.1:3234/play` through Welcome → Quest → ten-question Quiz → short Reveal → World Preview → activation overlay. The live owner-preview verifier reported zero runtime exceptions and checked eight visible map regions, two playable and six Coming Soon.

This is **not yet a manually playable authenticated game**. There is no isolated Auth/email inbox, and the owner preview deliberately removes Supabase environment variables. Existing V1 World, Toolkit, Collection, Knowledge, Boss, reward, Check-in, Journal and Community APIs have isolated test coverage, mostly through a simulated identity; they are not connected to the requested two detailed region-map experience. Health concern continuity (for example, selecting Gout and opening that saved Journey) is not implemented end-to-end.

## Repository structure and source locations

| Area | Actual path | Audit finding |
|---|---|---|
| Next.js project root | `D:\botly` | `package.json`, `next.config.ts`, `src`, `public`, `supabase`, `scripts`; the `App` directory is documentation/build workspace, not a second Next app. |
| `/play` route | `D:\botly\src\app\play\page.tsx` | Canonical app route. |
| Shared player shell/entry | `D:\botly\src\components\healthclues\HealthCluesPlayEntry.tsx`, `HealthCluesGameShell.tsx`, `HealthCluesWelcome.tsx`, `HealthCluesWorldPreview.tsx` | Guest onboarding, game presentation and World preview. |
| Quiz UI and engine | `D:\botly\src\components\healthclues\HealthCluesQuiz.tsx`; `D:\botly\src\lib\healthclues-quiz.ts`; `D:\botly\src\features\healthclues\quiz-bank.ts`; `D:\botly\src\data\healthclues-quiz-bank.json` | 96-question bank; initial core onboarding selects C01–C10 (10 records). |
| Global map renderer | `D:\botly\src\features\healthclues\world-map.tsx`; `world-map-immersive.css`; availability in `region-availability.ts` | One shared Overworld renderer with eight map markers, pan/zoom, locked labels and saved unlock decor. No separate detailed Sleep Valley or HealthClues Realm scene renderer found. |
| Existing V1 game/panels | `D:\botly\src\features\healthclues\WellnessWorldGame.tsx`, `ToolkitCollection.tsx`, `KnowledgeJourneyPanel.tsx`, `PrivateJournalPanel.tsx`, `BossBattlePanel.tsx`, `CommunityJourneysPanel.tsx`, `ComboJourneyPanel.tsx`, `ReminderPreferencesPanel.tsx` | Existing V1 feature UI, not a unified pair of detailed region maps. |
| Companion art | `D:\botly\src\components\healthclues\HealthCluesAdventurer.tsx`; `D:\botly\public\healthclues\assets\characters\adventurer-poses.webp` | Generic adventurer sprite. No Luna owl/Lumi firefly sprite or shared Pet engine found. Luna/Lumi appear as labels/dialogue in preview. |
| HealthClues API | `D:\botly\src\app\api\healthclues` | World, Toolkit, Collection, Knowledge, Journal, Boss, Community, Quiz bank, pending journey and other API routes exist. |
| Auth/data helpers | `D:\botly\src\lib\wellness-cloud.ts`, `healthclues-pending-journey.ts`; `D:\botly\src\features\healthclues\server.ts`, `WorldAuthCallback.tsx` | Reuses existing Botly/Supabase integration. No local Auth/email catcher was verified. |
| Schema source | `D:\botly\supabase\migrations` | Versioned SQL source only; migration files do not prove production schema/application status. |
| Owner preview launcher | `D:\botly\scripts\start-healthclues-owner-preview.mjs` | Builds a copied isolated guest preview; strips Supabase/Auth/email environment variables. Default port 3222; configurable through `HEALTHCLUES_PREVIEW_PORT`. |
| Browser verification | `D:\botly\scripts\verify-healthclues-owner-preview.mjs` | Chromium CDP guest-flow assertions and screenshot capture. |
| Isolated full game E2E | `D:\botly\scripts\run-healthclues-game-e2e.mjs` | Dedicated E2E DB/PostgREST containers, generated synthetic fixtures/tokens and mock callback; not real email Auth. |
| Other test scripts | `D:\botly\scripts\test-healthclues-*.mjs` | Quiz, safety, discovery matching, DB, dashboard/profile and review checks. |
| Documentation | `D:\botly\App` | Existing canonical specs and evidence reports. |
| Operational notes | `D:\botly\docs\healthclues` | Supplementary environment/review/runbook material; does not replace `App` canonical specifications. |

## Documentation and AI handoff audit

- Root instructions exist at `D:\botly\AGENTS.md`. HealthClues rules are scoped in a dedicated section and point to `App` specs. They preserve the Next.js-specific warning and require current source/Git inspection, evidence distinctions, selective doc updates and the guard.
- `D:\botly\App\HEALTHCLUES_CONTEXT.md` and `CURRENT_STATE.md` exist. Context links to the canonical set rather than duplicating the specifications.
- Canonical documents remain in `D:\botly\App`: `MASTER_SPEC.md`, `BUSINESS_RULES.md`, `USER_FLOWS.md`, `USE_CASES.md`, `DATABASE_DESIGN.md`, `UI_UX_SPEC.md`, `KNOWLEDGE_AND_SAFETY_SPEC.md`, `COMMUNITY_AND_PRIVACY_SPEC.md`, `DECISIONS_AND_ASSUMPTIONS.md`, `IMPLEMENTATION_PLAN.md`, `ACCEPTANCE_TESTS.md`, and `README.md`.
- The eight-visible/two-playable decision is in specs and source. Detailed map/Pet/Journey requirements are correctly marked approved but incomplete in current handoff/report evidence.
- Documentation guard: `D:\botly\scripts\check-healthclues-docs.mjs`, npm command `npm run docs:healthclues:check`; `.githooks\pre-commit` runs it after the secret scan. It detects likely missing docs; it does not update docs automatically or prove semantic accuracy.
- Startup BAT: `D:\botly\App\HealthClues_start_auto.bat`. It changes directory to its own `App` folder (`-C`), adds its parent `D:\botly` as a writable directory (`--add-dir`), and embeds the approved product direction in a prompt. Current `codex.cmd --help` supports `--ask-for-approval never`, `--sandbox workspace-write`, `--add-dir`, `-C`, and the config form used. The BAT was not launched in this audit, so end-to-end execution/quoting and successful Codex startup are **NOT VERIFIED**. It sets approval policy to `never` (requests are not presented; failed/blocked commands return to the model) while selecting `workspace-write`; it does not use the CLI's dangerous sandbox-bypass flag. It also enables network access in that workspace sandbox. These are material owner settings; this audit did not change them.
- BAT caveat: its warning text refers to `D:\botly\App\start.bat`, but the actual filename is `HealthClues_start_auto.bat`. This is an outdated warning only; the script sets its working directory from its own location.

## Approved product direction checked against source

| Requirement | Source evidence | Finding |
|---|---|---|
| One player, one persistent World | World creation/load APIs and DB functions in `src/app/api/healthclues/world/route.ts`, `src/features/healthclues/server.ts`, `20261027130000_healthclues_wellness_world.sql` | Idempotent V1 World creation exists and has isolated E2E evidence. Real owner Auth/resume was not verified. |
| Eight visible regions | `src/features/healthclues/world-map.tsx`, `region-availability.ts` | Implemented and Chromium verified on global map. |
| Two playable; six Coming Soon | `region-availability.ts`; `src/app/api/healthclues/world/route.ts` | Implemented and verified in live guest browser plus reported isolated API-lock regression. |
| Sleep Valley/Luna and HealthClues Realm/Lumi | Quest labels, availability config, preview dialogue; generic adventurer asset | Labels/dialogue present; distinct Pets and detailed regional gameplay are absent. |
| Quiz-selected health concern starts the same Health Journey | Quiz profile stores the answered interest, but World create sends `topicKey` as region ID (`sleep-better` / `health-concern`); no account-owned health Journey context was found | Not implemented end-to-end. Selecting Gout does not yet prove entry into a saved Gout Journey. |
| Knowledge, learning quiz, mini-games and Boss inside region maps | Existing V1 Knowledge/Boss panels are integrated in `WellnessWorldGame`; no detailed region renderer/landmark engine | V1 Knowledge/Boss exist, but required in-region composition is not implemented. No mini-game engine found. |
| Four shared Skills/five levels; one daily tip; optional 2–3 Daily Companion questions | No matching Skills/level system or Pet conversation engine found. Existing check-in/journal panels are not that Companion model. | Approved requirements, not implemented/verified. |
| Community Village is future scope | Latest decision docs and current plan | Not part of this milestone; existing V1 Community panel/API is separate functionality. |

## Feature acceptance matrix

“Persistence verified” means isolated database/browser evidence, not production state. `PARTIAL` means related code exists but the requested complete behavior is missing or not verified.

| Feature | Implemented | Tested | Browser verified | Persistence verified | Status | Missing work |
|---|---|---|---|---|---|---|
| A. Welcome and Quest selection | Yes | Preview verifier | Yes, desktop/mobile; two quests enabled | N/A guest | PASS | None for the guest visual slice; do not imply all eight are playable. |
| B. Initial adaptive Quiz, ≤10 | Core selects 10 IDs from 96-question bank | Quiz branch + safety scripts; preview flow | Sleep path, exactly through 10 questions | Session draft only in guest flow | PARTIAL | Run full browser paths for both playable tracks and confirm any optional deep flow is outside the initial 10. Health concern continuation remains unpersisted. |
| C. Short Discovery Reveal | Yes | Preview verifier | Yes, URL `...?from=play&step=reveal`, refresh | Session state only | PASS | No known gap in guest reveal; no authenticated Journey restoration. |
| D. Fullscreen World Preview | Yes, uses global map | Preview verifier | Yes, desktop/mobile; pan/zoom, selection and CTA | Correctly read-only for guest; no World write | PASS | Preview is not a playable region map. |
| E. Test email activation | Form/overlay and provider call code exist | Mock callback only in historical isolated E2E | Overlay shown; no delivery/verification | No isolated Auth persistence | BLOCKED | Isolated Supabase Auth + local inbox, callback and account recovery tests. No verified inbox URL. |
| F. Persistent authenticated World | API and SQL idempotency exist | Historical isolated E2E with simulated identity | No real owner-authenticated browser test | Isolated E2E World ID persistence reported PASS; owner persistence unverified | PARTIAL | Safe local Auth/email and manual owner save/reload with same World ID. |
| G. Eight visible regions, six Coming Soon | Yes | Availability/API lock checks | Yes, actual map screenshot and verifier | API rejects locked region creation in reported isolated E2E | PASS | None for global map gate. |
| H. Sleep Valley detailed map | No separate renderer found | None for region map | No | No | NOT STARTED | Dedicated scene/art, landmarks, map interactions and saved region state. |
| I. HealthClues Realm detailed map | No separate renderer found | None for region map | No | No | NOT STARTED | Dedicated scene/art and shared region-map engine. |
| J. Pet Luna | Text/preview label only; generic adventurer asset | No Pet-engine tests | Preview dialogue says Luna; no Luna sprite | No | PARTIAL | Luna companion sprite, shared engine and regional interactions. |
| K. Pet Lumi | Text/preview label only; generic adventurer asset | No Pet-engine tests | Region label/selection only; no Lumi-specific scene verified | No | PARTIAL | Lumi sprite, shared engine and Health journey dialogue. |
| L. Original Quiz-to-Journey personalization | Quiz profile and pending journey support exist; region `topicKey` is persisted instead of goal/concern | General discovery-matching tests; no Gout resume test | No Gout Journey entry test | No per-concern Journey persistence evidence | BLOCKED | Canonical owner-scoped Journey context, Gout test fixture/content and no-reselection end-to-end flow. |
| M. Relevant herbal/nutrition discovery | Catalog/discovery matching infrastructure exists | 37 discovery matching assertions; synthetic fixtures | Not inside a Health region | No Journey-scoped evidence | PARTIAL | Reviewed, concern-filtered category station and safety/eligibility verification. |
| N. Relevant wellness-practice discovery | Catalog/discovery matching infrastructure exists | Some V1 Catalog checks | Not inside a Health region | No Journey-scoped evidence | PARTIAL | In-map relevant discovery with verified active Journey and review gates. |
| O. Relevant movement discovery | Catalog and profile safety holds exist | Quiz safety checks | No region category interaction | No Journey-scoped evidence | PARTIAL | In-map movement discovery gated by relevant safety and selected Journey. |
| P. Journey-specific Toolkit loadouts | Toolkit entries associate with journeys; switching behavior not found/verified | V1 Toolkit persistence checks | Existing Toolkit panel only | Individual V1 entries covered; per-journey switching not verified | BLOCKED | Preserve/load separate active loadouts on explicit Journey switch. |
| Q. Shared Collection | Yes | Historical isolated game E2E | Existing panel in game UI, not Region Map | Isolated E2E persistence reported PASS | PASS | Integrate as region backpack overlay. |
| R. Daily Companion (2 default, max 3) | Existing Check-in/Journal, no matching Pet Companion flow | No 2–3 turn tests | No | No Companion conversation persistence | NOT STARTED | Optional Pet conversation, private storage, skip/end and conditional third question. |
| S. One Daily Knowledge Tip | Knowledge panel/API exists; one-tip-per-local-day rule not found as complete behavior | Knowledge API/reward tests in historical suite | No in-region daily-tip scene | General Knowledge persistence only | PARTIAL | Enforce/verify one relevant reviewed featured tip per user-local day. |
| T. Knowledge learning inside each region | Knowledge panel/API exists, no detailed region scenes | Historical Knowledge E2E | Existing panel, not inside separate region map | Isolated Knowledge persistence reported PASS | PARTIAL | Integrate library landmarks and Journey-specific content inside both maps. |
| U. Optional educational Quick Quiz | Knowledge discovery answer API and Boss question flows exist | Historical Knowledge/Boss E2E | No standalone optional in-region Quick Quiz verified | Some answer/reward persistence in V1 suite | PARTIAL | Grounded optional quiz, retry/skip, deduplicated learning rewards inside map. |
| V. Educational mini-games | No implementation found | None | No | No | NOT STARTED | Reusable short mini-game engine using reviewed Journey content. |
| W. Four Knowledge Skills | No implementation found | None | No | No | NOT STARTED | Four shared skill categories and learning-only progress. |
| X. Five Skill Levels | No implementation found | None | No | No | NOT STARTED | Novice → Master thresholds, persistence and reward reconciliation. |
| Y. Boss challenges | Boss component/API/reward engine exist | Historical isolated E2E | Boss screenshot/V1 panel evidence; not regional | Isolated reward/claim persistence reported PASS | PARTIAL | Put the supported Boss inside each region, filter by active Journey and verify per-region content. |
| Z. Persisted World rewards/evolution | Reward ledger, unlock API/map decorations exist | Historical isolated E2E and idempotency checks | World/Boss reward screenshots exist | Isolated reload persistence reported PASS | PARTIAL | Tie regional rewards to the two detail maps and ensure only legitimate saved progression. |
| AA. Returning player save/resume | World API/load and idempotent create exist | Historical simulated-auth E2E | No real Auth owner return test | Same World ID in simulated isolated E2E, per reports | PARTIAL | Real isolated verified account, reload/reopen and account-switch isolation. |
| AB. Mobile usability | Responsive game shell/map styles | Preview verifier and historical E2E | 390×844 preview verified; screenshots captured | N/A for guest; full authenticated map not verified | PARTIAL | Verify detailed maps, inventory and authenticated screens once implemented. |
| AC. Security and privacy | Owner-scoped APIs/RLS, consent and encrypted pending context code exist | Isolated RLS/profile/safety suites reported; current pure safety test PASS | Guest is read-only; no real Auth cross-account browser check | Isolated policy tests only | PARTIAL | Real local Auth account-switch tests, complete consent matrix and independent security/privacy review. |
| AD. Documentation update workflow | Specs/context/current state/guard/pre-commit hook exist | Guard CLI PASS (no staged files); prior positive/negative cases documented | N/A | N/A | PARTIAL | Guard flags omissions but cannot update docs; BAT execution is not verified. |

### Status totals

- **PASS:** 5
- **PARTIAL:** 16
- **BLOCKED:** 3
- **NOT STARTED:** 6
- **NOT VERIFIED:** 0 (unverified parts are explicitly marked PARTIAL/BLOCKED above)

## Owner playability and live services

| Owner action | Current finding |
|---|---|
| Open game in ordinary browser | **YES, guest preview only:** `http://127.0.0.1:3234/play` returned live HealthClues and passed Chromium verification on 2026-10-29. Ports 3222 and 3234 were served by isolated `next start` processes. Port 3210 is a separate process; it was not used for this browser acceptance run. |
| Register isolated test account / receive local email / verify | **NO.** No local test inbox URL is configured or verified. Ports/services 8025/Mailpit and 54321/local Supabase Auth were unavailable during this audit. The owner preview explicitly strips all Supabase/Auth/email variables. |
| Open Backpack and enter persistent World as owner | **NO, not through the current owner preview.** Historical E2E covers a mock authenticated callback and isolated API persistence, not owner-accessible email verification. |
| Enter detailed region map and meet Luna/Lumi | **NO.** Current preview has the global Overworld and generic adventurer; dedicated detail scenes and Pets are missing. |
| Complete in-map Knowledge Quiz/challenge and resume earned progress | **NO as the requested region experience.** Existing Knowledge/Boss/reward systems have V1 isolated test evidence but are not integrated into detail maps. |

The preview process for port 3234 was observed as Node/Next started with build directory `D:\botly\App\.tmp\healthclues-owner-preview-1793203073581`, matching the prior owner acceptance report. The verification run opened that exact URL and saved screenshots in `App\reports\previews`. Visual inspection in this audit confirms the Welcome fantasy art and the single global map composition with eight labels. The screenshots do **not** prove Auth, persistence or detailed maps.

### Safe commands

Current verified URL: `http://127.0.0.1:3234/play` (guest/read-only, currently responds). No inbox URL exists.

For a fresh isolated preview on an unused port from PowerShell:

```powershell
Set-Location D:\botly
$env:HEALTHCLUES_PREVIEW_PORT = "3235"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

Restart without rebuilding by using the same command and omitting `--rebuild`, once that chosen port is free and the expected preview build exists. The launcher writes `App\.tmp\healthclues-owner-preview.log` and detaches the server. No inbox startup command exists. Do not point Auth to `.env.local`: its Supabase host is `rswmadukvegraxfcdbcb.supabase.co` (production). That file was not used for writes.

## Tests actually run in this audit

| Command | Result | Scope / limit |
|---|---|---|
| `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3234/play` | **PASS, 2026-10-29** | Actual Chromium against owner URL. Welcome, Quest, Sleep path, 10 question cap, Reveal URL/refresh, 8 region labels, 2 playable/6 locked, World Preview, pan/zoom/selection, activation overlay, mobile/desktop screenshots, 0 runtime exceptions. Guest only. |
| `node scripts/test-healthclues-quiz-branches.mjs` | **PASS** | Eight legacy topic/Quest mapping unit assertions. Does not prove all 8 are playable under current release gate or Gout Journey persistence. |
| `node scripts/test-healthclues-quiz-safety.mjs` | **PASS (38 assertions)** | Age eligibility, skip and conservative safety holds. |
| `node scripts/test-healthclues-discovery-matching.mjs` | **PASS (37 assertions)** | Matching/time-label helper behavior; not approved content or region integration. |
| `npm run docs:healthclues:check -- --staged` | **PASS** | No HealthClues staged changes detected. Positive/negative explicit-path guard scenarios are recorded in prior documentation-workflow handoff; this audit itself did not stage files. |
| `node scripts/run-healthclues-game-e2e.mjs` | **NOT RUN in this audit** | Latest report records PASS on 2026-10-28 with dedicated Docker PostgreSQL/PostgREST and mock identity. During this audit Docker API later returned access denied, so it was not restarted/recreated or rerun. |
| `npm run build` / `npm run lint` | **NOT RUN in this audit** | Build would load `.env.local` (production Supabase host) into build environment and create a new isolated build; lint is broad Botly scope. Prior isolated build evidence is historical (2026-10-28), not a fresh audit result. |
| Real Supabase Auth, email provider, local inbox | **BLOCKED / NOT VERIFIED** | No isolated Auth/inbox is running/configured; no real emails sent. |

### Screenshot evidence

Actual browser captures from the `3234` run:

- `D:\botly\App\reports\previews\healthclues-live-preview-welcome-desktop.png`
- `D:\botly\App\reports\previews\healthclues-live-preview-welcome-mobile.png`
- `D:\botly\App\reports\previews\healthclues-fullscreen-world-preview-desktop.png`
- `D:\botly\App\reports\previews\healthclues-fullscreen-world-preview-mobile.png`
- `D:\botly\App\reports\previews\healthclues-fullscreen-world-activation-desktop.png`
- `D:\botly\App\reports\previews\healthclues-fullscreen-world-activation-mobile.png`

The verifier generated further Quest, Quiz last-question, Reveal, region-selection and activation captures. Welcome and map preview desktop/mobile were opened and visually inspected in this audit. Historical screenshots are not assumed to prove missing region screens.

## Documentation contradictions and correction

1. `CURRENT_STATE.md` and dated final acceptance reports said the guest preview was verified on 2026-10-28 and that local Auth/inbox was absent. Today’s live check confirms the guest preview still works at 3234 and still cannot authenticate; this report updates the date and explicitly says Auth remains blocked.
2. Older `ACCEPTANCE_TESTS.md` and test descriptions mention eight Quest choices/branches. Current accepted release policy still keeps all eight visible on the Overworld but enables only Sleep and Health; older eight-branch unit assertions are not evidence that all eight are playable.
3. Older implementation plans describe post-V1 mini-games/Companion and broader maps. The 2026-10-28 owner decision overlay supersedes conflicts: two detailed maps only; other six Coming Soon. This audit keeps that approved design fixed and marks feature implementation accurately.
4. Some reports use “PASS” for the isolated V1 subsystem suite. That is retained as subsystem evidence only and does not mean the complete two-map owner game or provider Auth is done.
5. The BAT’s static Codex flags are supported by the installed CLI help, but the launcher itself was not executed. Treat runtime as not verified.

## Critical blockers

1. **No safe owner Auth demo:** create/configure isolated Supabase Auth plus local email capture; verify the actual callback and owner continuation. Keep production `.env.local` out of demo runtime.
2. **No two detailed playable maps or Pets:** build one reusable map engine and a verified Sleep Valley slice with Luna first; then HealthClues Realm/Lumi. The approved global Overworld must remain eight visible regions (two open, six Coming Soon).
3. **No persisted Quiz-selected health Journey:** create a single account-owned Journey context that captures topic/goal from the original Quiz and drives Realm, Knowledge, safety and Toolkit. Prove Health → Gout resumes the same Gout context without asking again.

Other blockers: per-Journey loadouts, daily Pet Companion, one-per-day relevant Knowledge Tip, in-map Quick Quiz/mini-games/Skills, and full regional Boss/reward presentation; content review and privacy/security release approvals remain independent gates.

## Recommended next milestone

**Milestone A — isolated owner activation, before visual expansion.** Establish a separate local Auth and email-capture service without touching `.env.local`; add a safe persistent synthetic test identity; verify activation/callback, consent binding, account switching, one-World idempotency, and same-World reload from the actual owner preview. Record an actual inbox URL only after testing it. Then implement and test a complete Sleep Valley slice with Luna against the existing persistence/reward systems, followed by HealthClues Realm driven directly by the saved Quiz-selected concern. Keep the eight-region Overworld and its six locked statuses unchanged.

## Revision and working-tree limitations

Audit baseline revision is `3761b52`, but the working tree has numerous modified and untracked source, migrations, assets, scripts and documentation; the running preview is an isolated build snapshot. The audit did not compare each working-tree file to an owner-approved commit or certify reproducibility from Git alone. No changes were staged. No production read/write, migration, email, deploy or process termination was performed.
