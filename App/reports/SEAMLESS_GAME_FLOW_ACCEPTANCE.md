# HealthClues Master Prompt 07 — Seamless Game Flow Acceptance

Date: 2026-10-28  
Overall: **PARTIAL** — main onboarding presentation and isolated browser path implemented; live preview route is currently blocked. Production readiness is **NOT READY**.  
Preview status: **PASS** at `http://127.0.0.1:3222/play` (detached isolated guest preview, browser verified). Historical 3210/3211 findings below are superseded by the Master Prompt 07B correction.

## Before / after

Before: Quiz completion produced a six-field report and the primary path moved to a World route that showed Toolkit/account setup before the player could see the map. This interrupted the game and registration timing was too early.

After: Quiz completion produces a short companion-led reveal, then the existing interactive eight-region map appears in read-only preview. Starting a persistent journey opens a consent/email overlay over the map; a confirmed matching account continues to the existing Toolkit setup as a backpack overlay, then enters the existing idempotent World route. Returning owners are still routed by `/play` to their saved World.

## Status

| Requirement | Status | Evidence / limitation |
|---|---|---|
| Short companion-led Discovery Reveal | PASS | Real selected Quest/topic and non-diagnostic copy; screenshots below. Detailed old profile fields/actions remain behind “More about your profile and discoveries.” |
| World shown before activation | PASS | Existing interactive `WellnessWorldMap` and eight regions; `previewMode` clearly labels it read-only and no saved progress. Browser E2E confirmed no World row after preview. |
| Safe preview behavior | PASS (tested path) | E2E starts as an anonymous browser, explores the map, confirms read-only labeling and verifies no World row exists before activation. Direct API misuse/auth bypass was not newly probed for every gameplay endpoint. |
| Activation overlay and consent | PASS (isolated mock) | Explicit unchecked consent, email form, resend/status/error/close and verified-account continuation are implemented. A loopback mock OTP captured the request without delivering email; screenshot captured the pending state. Real Supabase email delivery remains untested. |
| Same-adventure verification recovery | PASS (isolated mock path) | E2E exercised the actual callback route with a synthetic signed test token, verified user endpoint and matching pending email; callback returned to the same Quest's Backpack. No raw answers appeared in the OTP body. Cross-tab, link expiration/reuse and real provider behavior remain untested. |
| Pending-data minimization | PARTIAL | Raw answers/answer history are not copied to the URL or OTP request. After consent, pending context stores email, Quest, derived profile, consent timestamp and expiry in plaintext `localStorage` for cross-tab continuation. This storage is same-origin script-readable, not encrypted; sensitive-state exposure hardening and cleanup/browser threat review remain open. |
| Backpack | PASS | Existing catalog/equip/collection logic reused in an inventory overlay above the same map; no auto-equipping, zero slots allowed, “Skip for now” controls, safety copy and “START EXPLORING.” Browser used isolated reviewed fixtures and reached persistent World. Mobile inventory is a vertically scrollable overlay; its lower action sits below the first viewport but remains reachable by scrolling. |
| Persistent World and idempotency | PASS | E2E created one World, reopened `/play`, and asserted identical World ID and exactly one owner World row. Existing World creation API/RPC retained. |
| Ten-question cap | PASS (tested branch) | `onboardingIds` selects at most 10 core onboarding IDs, with C01 first; E2E answered/skipped Questions 1–10 and transitioned directly to Reveal. All eight Quest choices remained selectable and switching branches resets previous answers except eligibility/topic. |
| Safety / unknown age | PASS (regression) | E2E underage path created no profile; age Skip ended in general content with no profile. Mandatory age logic was retained. Other optional safety answers remain available only where the selected initial questions include them; no additional safety gate was weakened. |
| Authenticated returning-player resume | PASS (existing E2E) | Saved World resumed with stable ID and no duplicate. Does not test account switching or live owner authentication against production. |
| Desktop/mobile screenshots | PASS (capture + visual inspection) | Actual Chromium screenshots at 1440×960 and 390×844 listed below. Capture helper asserted document width ≤ viewport + 2 and no `<footer>` for captured views. |
| Real email provider / expiration / account switching | PARTIAL | The browser E2E uses a local mock OTP and synthetic test token through the real app callback route; no actual Supabase Auth/email-capture service or real email was available. Cross-account switching is not covered. |
| Persistent local preview at `/play` | BLOCKED | Existing 3210 Next dev process responds with a not-found page. An isolated temporary start on 3211 also rendered not-found despite the isolated production route manifest listing `/play`; that owned test process was stopped. Root cause of standalone preview discrepancy remains unresolved. |
| Production changes | PASS | No production Supabase write, deployment, production credential change or migration was performed. E2E used the isolated `botly_restore_verification` DB and mock email/reminder provider. |

## Source changes

- `src/components/healthclues/HealthCluesQuiz.tsx` — cap initial question selection at 10; reset branch answers; direct completion to reveal; reveal uses actual data; retain detailed profile features under a disclosure; add World Preview state/history; defer browser session/draft restoration until after hydration.
- `src/components/healthclues/HealthCluesWorldPreview.tsx` — new read-only map scene and consent-first activation overlay.
- `src/features/healthclues/world-map.tsx` — explicit preview mode labels/state; persistent map mode remains unchanged.
- `src/lib/healthclues-pending-journey.ts` — consent-time pending context with email match, Quest allowlist and 20-minute expiry.
- `src/lib/wellness-cloud.ts` — email-confirmation fields, activation callback destination and profile read helper.
- `src/components/healthclues/HealthCluesPlayEntry.tsx`, `src/features/healthclues/WorldAuthCallback.tsx`, `src/app/en/wellness/auth/callback/page.tsx`, `src/app/en/wellness/healthclues/world/page.tsx` — resume/callback context and account matching.
- `src/features/healthclues/WellnessWorldGame.tsx` — activation-context validation, no-overwrite profile save, and existing Backpack presented as an overlay over the map before using existing World creation.
- `scripts/run-healthclues-game-e2e.mjs` — updated onboarding assertions and screenshots for reveal, preview, activation and backpack.

No schema, migration, new account database, game engine, World map replacement or reward formula change was made.

## Visual evidence

Files are actual rendered Chromium UI under `App/reports/previews/`; desktop/mobile suffixes indicate 1440×960 / 390×844.

- Reveal: `healthclues-results-desktop.png`, `healthclues-results-mobile.png` — inspected; fantasy scene, companion, concise copy, actual Quest/topic and one CTA.
- Read-only World preview: `healthclues-world-preview-desktop.png`, `healthclues-world-preview-mobile.png` — inspected; approved map remains dominant, eight regions present, preview/read-only labeling and starting Quest marker. Mobile region chips scroll horizontally within the map panel; document has no horizontal overflow.
- Activation overlay: `healthclues-activation-overlay-desktop.png`, `healthclues-activation-overlay-mobile.png` — inspected; parchment modal and companion over blurred World, with unchecked consent.
- Verification pending: `healthclues-verification-pending-desktop.png`, `healthclues-verification-pending-mobile.png` — inspected; sent status, same Quest confirmation, resend and return actions remain inside the World overlay.
- Backpack: `healthclues-toolkit-desktop.png`, `healthclues-toolkit-mobile.png` — inspected; three actual equipment slots and existing Quest shown as an overlay over map. Mobile lower controls require internal vertical scroll.
- Persistent World: `healthclues-game-shell-world-desktop.png`, `healthclues-game-shell-world-mobile.png` — inspected; real saved fixture and map HUD. It includes synthetic-only tool fixture labels.
- Existing screen: `healthclues-boss-desktop.png`, `healthclues-boss-mobile.png`, `healthclues-rewards-world-evolution-desktop.png`, `healthclues-rewards-world-evolution-mobile.png` — captured in prior Master Prompt 05 continuation and inspected; isolated synthetic reward state.

An explicit email-pending screenshot pair was not captured in the successful E2E run because the test started with a pre-verified fixture account; do not infer OTP/callback visual acceptance from the activation screenshot.

## Verification

- `node scripts/build-healthclues-isolated.mjs` — **PASS**, isolated Next.js 16.3 production build, TypeScript and route generation; root `.next` and saved baseline preserved.
- Focused `npm exec -- eslint -- ...` over changed HealthClues components/routes/libraries — **PASS**.
- `node --check scripts/run-healthclues-game-e2e.mjs` — **PASS**.
- `node scripts/run-healthclues-game-e2e.mjs` — **PASS**, isolated Docker DB. Full existing game E2E covered 8 Quests, 10-question flow/resume, existing auth fixture, profile/toolkit/Collection, one World, `/play` same-ID resume, Check-in, Knowledge, Boss retry/victory, persisted Rewards/unlock, Community privacy/moderation, reminders and cleanup. Latest output: “HealthClues game E2E passed … Synthetic rows are cleaned in finally”; cleanup verified no generated content fixture remained.
- The successful test began without a browser session. OTP delivery was a local mock; the verification callback itself was the real app route and accepted a synthetic signed test identity from the mock auth endpoint. This verifies app handoff logic, not Supabase's actual email/token provider.
- Browser observed no React exception during the successful rerun. The prior React #418 hydration mismatch was traced to browser storage/auth values read in Quiz state initializers before hydration; these reads now happen after initial server/client render. No current Next.js “1 Issue” badge was specifically re-probed on the long-lived port 3210 preview during this milestone.

## Live preview and safety

- `/play` is not currently available as an owner-facing persistent preview. Port 3210 is occupied by an existing Next process returning not-found; 3211 was tested with an isolated production build and also returned not-found. The 3220 E2E server rendered the current source and was stopped by runner cleanup. No process on 3210 was stopped or modified.
- `.env.local` is production-configured, so it was excluded. The E2E runner uses isolated Postgres database `botly_restore_verification`, a loopback PostgREST proxy and mock email/reminder settings. No real email was sent.
- No production data, credentials, deployment or migration changed.

## Not verified / remaining blockers

- Actual Supabase OTP delivery, expired/invalid/already-used links, provider resend semantics, browser reload/new-tab handoff, duplicate-click and account-switch isolation require an isolated Supabase Auth + approved email-capture environment.
- Pending context uses plaintext localStorage because callback may open in a different tab. It is short-lived and consent-gated but not encrypted; review whether a server-side temporary handoff/opaque nonce is required before production.
- Mobile backpack contents extend beyond first viewport; internal scrolling was visible and document-level overflow check passed, but sticky bottom action/focus-trap and software-keyboard behavior were not tested.
- Full screen-reader/keyboard accessibility, every safety permutation, all eight branches through complete 10-question flow, and direct API guest-isolation matrix were not newly covered here.

## Master Prompt 07D — fullscreen World correction (2026-10-28)

- **PASS:** Canonical World Preview now uses one full-scene instance of the existing interactive map renderer. The nested card, separate banner, standalone map chrome and below-map CTA composition are removed from this scene.
- **PASS:** Existing World artwork, coordinates, eight biome markers, paths, map handlers and unlock landmarks are retained. Mobile centers the starting Quest without stretching the 16:9 artwork; inspecting another region does not replace the chosen Quest.
- **PASS:** The duplicate shell backdrop is suppressed only during World Preview. Companion speech, read-only/starting-Quest HUD, map zoom and `START YOUR JOURNEY` float over the map. Mobile CTA stays above fixed navigation and a wheel gesture does not scroll the document.
- **PASS:** Chromium tested `http://127.0.0.1:3232/play`, all eight Quest branches (maximum 10 questions), Reveal, World Preview, pan/zoom/region selection, CTA and activation overlay. Zero uncaught browser runtime exceptions.
- **PASS:** Full isolated Docker game E2E passed after updating its Preview text assertions; World persistence/resume, Check-in, Knowledge, Boss/rewards, Community privacy and fixture cleanup passed.
- **PARTIAL:** Owner preview has no Supabase/Auth and remains guest-only. Real provider email/link lifecycle and account-switch recovery remain unverified. Production readiness remains NOT READY.
- Detailed evidence: `App/reports/FULLSCREEN_WORLD_ACCEPTANCE.md`; screenshots: `App/reports/previews/healthclues-fullscreen-world-*`.

## Master Prompt 07D — fullscreen World correction (2026-10-28)

- **PASS:** Canonical World Preview now uses one full-scene instance of the existing interactive map renderer; the nested card, separate large banner, map's standalone region/footer chrome, and below-map CTA composition are removed from this scene.
- **PASS:** Existing World artwork/coordinates/eight regions and marker handlers are retained. The mobile camera centers the starting Quest without stretching the 16:9 artwork; region inspection does not replace the selected starting Quest.
- **PASS:** The duplicate shell backdrop is suppressed only for World Preview. Companion speech, read-only/starting-Quest HUD, map zoom, and `START YOUR JOURNEY` float over the World. The CTA stays above mobile navigation without document scrolling.
- **PASS:** Owner browser verification and screenshots are from `http://127.0.0.1:3232/play`; browser exercised all eight Quest branches (maximum 10 questions), the reveal, map preview, zoom/pan/region selection, CTA, and activation overlay. Zero uncaught runtime exceptions.
- **PASS:** Full isolated Docker game E2E passed after updating its assertions to the current fullscreen read-only Preview. World persistence/resume, Check-in, Knowledge, Boss/rewards, Community privacy and fixture cleanup passed.
- **PARTIAL:** Owner preview has no Supabase/Auth and remains guest-only. Real provider email/link lifecycle and account-switch recovery are not verified. Production readiness remains NOT READY.
- Detailed evidence: `App/reports/FULLSCREEN_WORLD_ACCEPTANCE.md`; screenshots: `App/reports/previews/healthclues-fullscreen-world-*`.
- Human health-content review, privacy/retention approval, full authorization review, community member block/mute, and analytics suppression/retention remain independent release gates. **Not production-ready.**
## Master Prompt 07B correction — live owner preview and pending privacy (2026-10-28)

See [LIVE_PREVIEW_RECOVERY.md](LIVE_PREVIEW_RECOVERY.md) for commands, route-manifest evidence, screenshot links and remaining limits.

- PASS: owner can open **http://127.0.0.1:3222/play**. Detached isolated server remains listening; browser verification followed Welcome → Quest → 10-question Quiz → Reveal → read-only World Preview → activation overlay on that exact URL.
- PASS: Welcome desktop/mobile, Quest, Reveal, World Preview desktop/mobile, and activation overlay desktop/mobile were captured from the live URL and inspected. Browser reported 0 uncaught runtime exceptions.
- PASS: full isolated Docker game E2E after the pending-context change; mock Auth callback continues the same Quest into Backpack, creates one World, reload resumes the same World ID; cleanup verified.
- PASS: sensitive pending profile removed from plaintext localStorage/sessionStorage. It now uses a short-lived encrypted HttpOnly SameSite cookie and authenticated, verified-email-matched API retrieval. Existing legacy key is removed at `/play` entry.
- PARTIAL: the owner preview is guest/read-only and has no Auth/Supabase configured by design; it shows the activation overlay but cannot send email or persist a player. Authenticated Backpack/World are verified in isolated E2E only.
- PARTIAL: actual Supabase email provider, cross-tab live verification, invalid/expired/replayed links and real account switching were not tested. The “1 Issue” dev badge itself was not re-probed; no badge was hidden.

Root cause: the 3210 root dev process used a `.next` route manifest without `/play/page` under the Windows App/app collision; the isolated project build includes the route. A previous 3211 raw-HTML check was not a reliable rendered-route test because Next Flight may serialize not-found boundary text. No process on 3210 was terminated. Previous statements that no stable preview existed are superseded by the tested detached 3222 preview.

### Pending activation privacy correction (2026-10-28)

- PASS: removed pending derived profile/email from localStorage. The legacy key is cleared on /play entry. New pending context is AES-GCM encrypted in a 20-minute HttpOnly SameSite cookie; retrieval requires a valid bearer session, verified email, and exact email match. No sensitive profile or Quiz data is placed in URLs.
- PASS: lint, isolated Next build, and full isolated game E2E passed after the change; no production Auth or data used.
- PARTIAL: real provider email delivery, link replay/expiration, cross-tab behavior and account switching remain to verify. The owner preview is guest-only and cannot persist.
- See LIVE_PREVIEW_RECOVERY.md for full details, tested URL, commands, and visual evidence.

## Master Prompt 07C — owner-visible Reveal fix (2026-10-28)

- PASS: The tested owner URL is http://127.0.0.1:3222/play. Chromium recorded the post-Quiz URL `/en/wellness/healthclues/quiz?from=play&step=reveal` and confirmed the old profile subtree is not mounted (`details=0`).
- PASS: Profile copy, six detail cards, Update/Clear controls, First Discoveries, external Guides/Ebooks and the old Toolkit CTA are absent from all eight canonical game Quest branches, even with `view=profile` in a stale URL.
- PASS: Refresh at Reveal resumes the same selected Quest. Selecting a Quest changes the route state to `step=onboarding`; explicit `step=quest` clears a stale World Preview draft.
- PASS: clicking ENTER MY WELLNESS WORLD opens the actual eight-region read-only map; no activation appears until START YOUR JOURNEY. Activation close returns to Preview. Result/Preview scenes reset scroll to the top.
- PASS: final owner-preview browser verification: eight branches, maximum 10 questions, desktop/mobile overflow/footer checks, 0 uncaught runtime errors. Actual screenshots captured and visually inspected under previews/.
- PASS: full isolated Docker game E2E after integration, including mock verification callback, Backpack, one persistent World, same-ID reload, Toolkit, Knowledge, Boss/rewards and Community privacy. Synthetic fixture cleanup passed.
- Root cause: the Quiz result component always mounted an expandable six-field Discovery Profile and external discovery dashboard under the short Reveal. Previous E2E only asserted the visible Reveal/action, not absence of the collapsed `<details>` subtree; its clean browser also missed stale `world_preview` draft overriding explicit Quest selection.
- PARTIAL: owner preview is intentionally guest/read-only with Auth/Supabase excluded. Real provider email, expired/replayed links and real account switching remain unverified. No production data, email or deployment used.
- Detailed evidence and before/after screenshots: OWNER_EXPERIENCE_FIX_ACCEPTANCE.md. Preview restart: `node scripts/start-healthclues-owner-preview.mjs`; rebuild after source changes with `node scripts/start-healthclues-owner-preview.mjs --rebuild`.

### Master Prompt 07D final build correction

The final keyboard-accessibility build supersedes the earlier 3232 snapshot. Owner URL: http://127.0.0.1:3233/play (detached isolated process 32728). The final Chromium run and screenshots came from this 3233 build; focus enters activation, Escape closes it and focus returns to Start Your Journey. The final isolated game E2E passed and cleaned its synthetic fixtures. Restart/rebuild with `HEALTHCLUES_PREVIEW_PORT=3233` and `node scripts/start-healthclues-owner-preview.mjs --rebuild` after the port is free. Ports 3210 and 3222 remain untouched.
## Shared-source change after final verification — status PARTIAL

After the 3233 browser run and final isolated E2E passed, the shared working tree changed again: `world-map.tsx` now adds `playable` flags, companion names and a “COMING SOON” state, while `verify-healthclues-owner-preview.mjs` now expects only Sleep Valley and HealthClues Realm to be selectable and six regions to be disabled. Those file timestamps are later than the verified 3233 build. I left these newer changes untouched. The still-running 3233 URL is a verified detached snapshot of the 07D build, but it no longer represents the latest shared source. The new region restrictions may conflict with 07D’s requirement to inspect other regions. Reconcile that shared-source decision, then rebuild/retest before treating current source as accepted.