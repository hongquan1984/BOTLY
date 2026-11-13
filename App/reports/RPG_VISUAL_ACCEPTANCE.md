# HealthClues RPG Visual Acceptance — Master Prompt 05

Date: 2026-10-28
Preview: http://127.0.0.1:3210/play (guest visual preview; HTTP 200)
Browser captures: Chromium, 1440×960 desktop and 390×844 mobile viewports.

## Summary

This milestone is **PARTIAL**, not complete. The accepted eight-biome World artwork and Welcome are retained. The shared Game Shell, `/play` entry, responsive HUD, Quest/Quiz, Companion, World, Toolkit, Knowledge, Boss, Check-in, Journal, Community and reward presentation all render in the existing game. We captured and inspected the previously missing major screens on desktop and mobile. The end-to-end flow and saved-world resume were verified on the isolated E2E database. Several feature panels still look like conventional forms/cards rather than bespoke RPG scenes; those screens are explicitly PARTIAL below. The local preview intentionally has no production Supabase credentials, so it is a guest preview and not a browser-login demo.

## Screen-by-screen visual acceptance

| Screen | Status | Evidence and visual finding |
|---|---|---|
| Welcome | PASS | `previews/healthclues-welcome-desktop.png`, `...-mobile.png`. Existing map remains dominant, title/action and shared adventurer render, no Botly site chrome. |
| Choose Your Quest | PASS | `previews/healthclues-quest-desktop.png`, `...-mobile.png`. Eight actual choices remain; cards crop the approved map instead of using eight bespoke biome illustrations. |
| Eligibility | PASS | `previews/healthclues-eligibility-desktop.png`, `...-mobile.png`. Checkpoint is legible and retains Yes/No/Skip behavior. |
| Discovery Quiz | PASS | `previews/healthclues-quiz-desktop.png`, `...-mobile.png`. Selected-region scene, companion and parchment question panel; existing answer/progress logic retained. |
| Discovery Results | PARTIAL | `previews/healthclues-results-desktop.png`, `...-mobile.png`. Real discovery data and disclaimer render over the game scene with companion. Profile values remain a conventional grid of information cards rather than an authored discovery reveal. |
| Toolkit | PARTIAL | `previews/healthclues-toolkit-desktop.png`, `...-mobile.png`. Three real wellness slots and safety text are visible and functional; catalog/selection area still reads as a web form/card grid, not a finished inventory scene. |
| My Collection | PARTIAL | `previews/healthclues-toolkit-collection-desktop.png`, `...-mobile.png`. Saved vs equipped distinction and companion are visible; Combo forms dominate and need a stronger inventory presentation. |
| My Wellness World | PASS | `previews/healthclues-game-shell-world-desktop.png`, `...-mobile.png`. Approved interactive map remains the focus; map, regions, compact HUD, trail and responsive map controls render. |
| Daily Check-in | PARTIAL | `previews/healthclues-checkin-desktop.png`, `...-mobile.png`. Correct modal/bottom-sheet, status choices, private note and non-punitive copy work; panel still resembles a standard form. |
| Private Journal | PARTIAL | `previews/healthclues-journal-desktop.png`, `...-mobile.png`. Private note/list/save state renders in the same shell; editor and entries are conventional form cards. The latest desktop crop includes the panel heading; the mobile crop starts inside the editor and does not verify the mobile panel heading composition. |
| Knowledge Library | PARTIAL | `previews/healthclues-knowledge-desktop.png`, `...-mobile.png`. Reviewed content/source, discovery action, challenge and companion render. It lacks a distinctive illustrated library environment and uses plain content cards. The E2E fixture is explicitly synthetic and isolated. |
| Boss Battle | PASS | `previews/healthclues-boss-desktop.png`, `...-mobile.png`. Dark encounter panel, companion, challenge, answer feedback and server-confirmed reward/unlock are visible. Boss identity currently reuses the adventurer artwork; dedicated Boss art is still needed. |
| Rewards / World Evolution | PASS | `previews/healthclues-rewards-world-evolution-desktop.png`, `...-mobile.png`. Captured after isolated persisted reward/unlock state; the unlocked landmark and saved reward connect back to the same World. Screenshot includes test-only synthetic fixture labels, not production content. |
| Community Journeys | PARTIAL | `previews/healthclues-community-desktop.png`, `...-mobile.png`. Guild heading/companion, consent, sharing controls and journeys render. Sharing/search are still conventional form panels rather than a finished guild-board scene. |

All listed images are actual Chromium screenshots opened for visual inspection. The capture helper asserts no document-level horizontal overflow and no `<footer>` on each captured view. These assertions do not replace assistive-technology or broad browser QA.

## Functional and environment verification

- `node scripts/run-healthclues-game-e2e.mjs` — **PASS**, latest run after screenshot-capture adjustment. It exercised Welcome ? Quest (all 8 choices) ? 10-question onboarding/resume ? Toolkit/Collection ? World ? Check-in ? Knowledge ? Boss retry/victory ? persisted reward and unlock. It also covered Community/admin/moderation, reminders, deletion, mobile interactions and reload.
- The runner verified an existing player resumes the same saved World ID through `/play` and that the owner still has one World row (no duplicate generated). This is isolated synthetic test identity coverage; account-switching UI/browser privacy is not independently established by this assertion.
- E2E cleanup reported no generated content fixture remained in its isolated database.
- The runner's DB is the local isolated Docker E2E database (`botly_restore_verification`, PostgREST loopback port 3001), not `.env.local`. `.env.local` points to production and was not loaded by the test app. No production data, credential, migration or deployment was changed. Synthetic fixtures are used only by the isolated runner and removed in cleanup.
- `/play` development preview is served from `.tmp/healthclues-prompt04-dev` and has no production `.env.local`; it supports safe guest visual preview but cannot provide authenticated persisted demo play. Authenticated persistence is exercised only by the isolated E2E runner.
- Latest `node --check scripts/run-healthclues-game-e2e.mjs` and focused ESLint for the modified game components and runner — **PASS**.

## Next.js “1 Issue” investigation

The earlier development badge appeared while `src` was being copied with `Copy-Item` into the live watched preview directory. The dev-server log at that time reported an early-closed destination stream and a transient compile marker in `HealthCluesQuiz.tsx`; the source copy was not atomic, so Next could observe an incomplete intermediate file. Once the copy completed and the page recompiled, the marker disappeared. On the latest fresh Chromium run against the preview, DevTools reported no browser exception, console error, or Next portal issue text (`nextjs-portal` was empty); the dev log shows successful `/play` and Quiz 200 responses. The only message was Motion's informational reduced-motion notice. This was a source-sync/HMR race, not a persistent CSS parse error. Do not copy source into a running watched preview; finish sync before starting/reloading it. No badge was hidden and no stylesheet was rewritten to suppress it.

## Remaining work / limitations

- Results, Toolkit/Collection, Check-in/Journal, Knowledge and Community need a visual-design pass to replace form-like layouts with authored RPG panels/scenes while preserving their existing handlers and APIs.
- Quest destinations use crops from the existing map; no unique biome illustrations were added. Dedicated Boss artwork and distinct character pose assets remain art dependencies; current sprite sheet is reused.
- The guest preview does not support sign-in or persisted saves. No synthetic data may be pointed at production. A locally accessible isolated browser-auth demo remains unconfigured; the automated isolated test is the current persistence proof.
- Account switching/private stale-cache isolation was not separately browser-tested in this run. Returning-player same-world/no-duplicate behavior was.
- Community member blocking/muting, analytics small-cell suppression/retention review, and independent human content/security/privacy approvals remain release blockers. This report does not declare production readiness.
## Master Prompt 07 â€” World-first onboarding update (2026-10-28)

The current onboarding presentation is updated; see the authoritative per-requirement status and evidence in [SEAMLESS_GAME_FLOW_ACCEPTANCE.md](SEAMLESS_GAME_FLOW_ACCEPTANCE.md). Isolated browser E2E passes the 10-question cap, short Reveal, read-only eight-region map before activation, existing Toolkit/Backpack, persisted World and same-ID /play resume. Desktop/mobile Chromium screenshots were captured and inspected under previews/ for Reveal, World Preview, activation overlay, Backpack and persistent World. The source build, focused ESLint and full isolated game E2E pass.

This does not close real guest OTP/callback, pending-link recovery, account-switch, or plaintext localStorage handoff review. The successful E2E browser used a pre-verified isolated fixture; authenticated World persistence was never pointed at .env.local. Mobile Backpack scrolls internally to reach lower controls. Human content, security and privacy approvals remain open. Milestone PARTIAL; V1 NOT READY.
### Latest guest-first callback verification

The latest full E2E now starts with an anonymous browser session, captures the pending-email state at desktop/mobile, accepts OTP through a loopback-only mock Auth route, then exercises the real HealthClues callback route with a synthetic signed test identity. It confirms the same Quest reaches Backpack and the E2E creates one persistent World. New evidence: healthclues-verification-pending-desktop.png and healthclues-verification-pending-mobile.png. This supersedes the earlier note that the flow began with a pre-verified browser session; provider email delivery, expiring/used link recovery, new-tab handoff and account switching remain unverified.
### Preview availability correction â€” 2026-10-28

The live URL state in earlier Master Prompt 05 sections is stale for this continuation. Current probe: http://127.0.0.1:3210/play returns HTTP 200 with a Next not-found page, so it is not a working preview. A temporary isolated source/build server on 3211 also returned not-found and was stopped. Port 3210''s existing process was not stopped. Current source does render correctly in the isolated 3220 browser E2E run, but that server is stopped during cleanup. Owner-facing /play preview status is BLOCKED pending resolution of the standalone Next routing mismatch.


### Master Prompt 07B - live preview recovery (2026-10-28)

- PASS: owner URL http://127.0.0.1:3222/play was opened in Chromium and the actual UI was exercised. Detached isolated server remains available after E2E cleanup.
- PASS: screenshots from that URL: live-preview Welcome desktop/mobile, Quest desktop, Reveal desktop, World Preview desktop/mobile, Activation desktop/mobile; files are under previews/ and were inspected.
- PASS: Welcome, Start Adventure, eight Quest destinations, Sleep Better Quiz (10-question maximum), Reveal, read-only World Preview and activation overlay rendered with zero uncaught runtime exceptions.
- PARTIAL: live owner preview intentionally has no Supabase/Auth; activation is read-only and does not send email or save a World. Backpack and active World were verified in isolated authenticated E2E screenshots.
- Root route issue: 3210 root dev manifest lacked /play/page; isolated Next build resolves it. Previous raw Flight HTML not-found probe was not sufficient. See LIVE_PREVIEW_RECOVERY.md.

## Master Prompt 07C â€” owner-visible Reveal fix (2026-10-28)

- PASS: The tested owner URL is http://127.0.0.1:3222/play. Chromium recorded the post-Quiz URL `/en/wellness/healthclues/quiz?from=play&step=reveal` and confirmed the old profile subtree is not mounted (`details=0`).
- PASS: Profile copy, six detail cards, Update/Clear controls, First Discoveries, external Guides/Ebooks and the old Toolkit CTA are absent from all eight canonical game Quest branches, even with `view=profile` in a stale URL.
- PASS: Refresh at Reveal resumes the same selected Quest. Selecting a Quest changes the route state to `step=onboarding`; explicit `step=quest` clears a stale World Preview draft.
- PASS: clicking ENTER MY WELLNESS WORLD opens the actual eight-region read-only map; no activation appears until START YOUR JOURNEY. Activation close returns to Preview. Result/Preview scenes reset scroll to the top.
- PASS: final owner-preview browser verification: eight branches, maximum 10 questions, desktop/mobile overflow/footer checks, 0 uncaught runtime errors. Actual screenshots captured and visually inspected under previews/.
- PASS: full isolated Docker game E2E after integration, including mock verification callback, Backpack, one persistent World, same-ID reload, Toolkit, Knowledge, Boss/rewards and Community privacy. Synthetic fixture cleanup passed.
- Root cause: the Quiz result component always mounted an expandable six-field Discovery Profile and external discovery dashboard under the short Reveal. Previous E2E only asserted the visible Reveal/action, not absence of the collapsed `<details>` subtree; its clean browser also missed stale `world_preview` draft overriding explicit Quest selection.
- PARTIAL: owner preview is intentionally guest/read-only with Auth/Supabase excluded. Real provider email, expired/replayed links and real account switching remain unverified. No production data, email or deployment used.
- Detailed evidence and before/after screenshots: OWNER_EXPERIENCE_FIX_ACCEPTANCE.md. Preview restart: `node scripts/start-healthclues-owner-preview.mjs`; rebuild after source changes with `node scripts/start-healthclues-owner-preview.mjs --rebuild`.

## Master Prompt 07D â€” fullscreen World (2026-10-28)

- PASS: focused fullscreen World visual change completed and verified from the same isolated owner preview build at http://127.0.0.1:3232/play.
- PASS: Chromium checked desktop 1440Ã—960 and mobile 390Ã—844, one interactive map, visible CTA, mobile fit, no horizontal overflow or wheel scrolling, region selection, pan, zoom and activation overlay. Screenshots were captured and inspected; see FULLSCREEN_WORLD_ACCEPTANCE.md.
- PASS: isolated Next.js 16.3 build, focused ESLint, browser verification across eight Quest branches and full isolated Docker game E2E passed. Synthetic fixture cleanup passed.
- PARTIAL: owner preview is guest-only. Live provider email/auth lifecycle is not covered. No production data or services were changed; release gates remain NOT READY.
### Master Prompt 07D final build correction

The final keyboard-accessibility build supersedes the earlier 3232 snapshot. Owner URL: http://127.0.0.1:3233/play (detached isolated process 32728). The final Chromium run and screenshots came from this 3233 build; focus enters activation, Escape closes it and focus returns to Start Your Journey. The final isolated game E2E passed and cleaned its synthetic fixtures. Restart/rebuild with `HEALTHCLUES_PREVIEW_PORT=3233` and `node scripts/start-healthclues-owner-preview.mjs --rebuild` after the port is free. Ports 3210 and 3222 remain untouched.
## Shared-source change after final verification â€” status PARTIAL

After the 3233 browser run and final isolated E2E passed, the shared working tree changed again: `world-map.tsx` now adds `playable` flags, companion names and a â€œCOMING SOONâ€� state, while `verify-healthclues-owner-preview.mjs` now expects only Sleep Valley and HealthClues Realm to be selectable and six regions to be disabled. Those file timestamps are later than the verified 3233 build. I left these newer changes untouched. The still-running 3233 URL is a verified detached snapshot of the 07D build, but it no longer represents the latest shared source. The new region restrictions may conflict with 07Dâ€™s requirement to inspect other regions. Reconcile that shared-source decision, then rebuild/retest before treating current source as accepted.


## Mobile 30-Day Roadmap (Week 4 & Final Stage) Zero-Cutoff Acceptance (2026-11-06)

- **PASS**: Audited at exact mobile device viewport (378 x 622px, matching user report).
- **PASS**: Week 1 (days 1-7), Week 2 (days 8-14), Week 3 (days 15-21), Week 4 (days 22-28), and Chặng cuối / Week 5 (days 29-30) are 100% visible on the initial screen without clipping (`allNodesInWindow: true`).
- **PASS**: Circular day nodes scaled to 1.55rem / 25px with strict 1:1 aspect ratio, eliminating the previous oval stretching caused by unoverridden `min-height: 2.25rem`.
- **PASS**: Container height reduced by 196px; Week 4 finishes at Y=500px, Week 5 finishes at Y=551px (71px clearance above screen bottom).
- **PASS**: `padding-bottom: 2.5rem` added to `.hc-game-modal-body` ensuring smooth scrolling with generous bottom margin.
- **PASS**: Automated test script `scripts/verify-week4-week5-roadmap.mjs` executed and passed; screenshot evidence saved to `verified-week4-week5-378x622.png` and `verified-week4-week5-scrolled.png`.
- **PASS**: Vercel production deployment verified: `https://www.botly.vn` and `https://aiflow-automation-f0rxiygmk-hong-quans-projects-99fb0586.vercel.app` (HTTP 200).
