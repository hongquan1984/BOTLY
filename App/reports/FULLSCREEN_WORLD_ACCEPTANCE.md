# HealthClues — Fullscreen World Acceptance (Master Prompt 07D)

Date: 2026-10-28  
Scope status: **PARTIAL on the current shared source**; the fullscreen refactor and guest journey passed on the detached 3233 build before later source edits.  
Product/release status: **PARTIAL / NOT READY**; this does not approve production Auth, reviewed wellness content, or privacy/security release gates.

## Finding and change

The owner-facing route was using `HealthCluesWorldPreview`. It placed that component in a centered `max-w-6xl` section with a separate companion banner, a `WellnessWorldMap` card, and a large cream CTA card below it. The map renderer itself added its own title/status header, region-chip list and footer. The shared Game Shell also painted the same World image as a full-page backdrop. That produced the repeated map artwork and website-like composition.

The refactor keeps the existing SVG renderer and its original `healthclues-world-overworld.webp`, coordinates, eight biome markers, paths, unlock landmarks, map hit handlers, keyboard region selection and zoom state. An `immersive` mode suppresses only the renderer's standalone card chrome. A 16:9 scene camera covers the available game viewport without stretching the approved artwork; mobile initially centers the chosen starting region and uses the actual crop bounds for pan. The home marker continues to indicate the chosen Quest while inspecting a different region updates only the preview summary.

The Preview now uses one fixed World canvas beneath a compact Quest/read-only HUD, region summary, the existing `HealthCluesAdventurer` sprite and dismissible companion speech, map zoom controls, and a floating `START YOUR JOURNEY` action. Activation continues to use the existing consent/email overlay over that same map. Shell artwork is hidden only while this Preview is mounted. The document viewport is locked during the fullscreen scene and restored on unmount. No map artwork, database model, reward formula, authentication provider, eligibility rule, or persistent gameplay API was changed.

## Files changed

- `src/components/healthclues/HealthCluesWorldPreview.tsx` — replaces the detached page/card composition with fullscreen contextual overlays; retains activation behavior.
- `src/components/healthclues/HealthCluesWorldPreview.module.css` — viewport, HUD, speech, CTA, mobile safe-area and responsive composition.
- `src/features/healthclues/world-map.tsx` — adds the immersive presentation mode, responsive aspect-ratio camera, mobile starting-region centering, camera bounds and overlay zoom controls; existing non-immersive World rendering remains intact.
- `src/features/healthclues/world-map-immersive.css` — hides standalone renderer chrome only in immersive mode and sizes the existing canvas to the scene.
- `src/components/healthclues/HealthCluesGameShell.module.css` — suppresses the duplicate shell backdrop and locks the shell only for World Preview.
- `scripts/verify-healthclues-owner-preview.mjs` — browser assertions for one full-scene canvas, mobile layout, CTA placement, wheel-scroll prevention, zoom, pan, region selection, activation, all eight Quest branches and screenshots.
- `scripts/run-healthclues-game-e2e.mjs` — updates the guest preview assertions to the current read-only label/canvas.
- `App/HEALTHCLUES_MASTER_PROMPT_07D.md` — saved milestone prompt.

## Browser verification

**Final owner-preview URL:** [http://127.0.0.1:3233/play](http://127.0.0.1:3233/play)  
This is a detached isolated Next.js build with Supabase/database/email credentials stripped. It is guest-only. Process 32728 was verified to run the final isolated build at port 3233 and remained listening after QA. Port 3210 and the earlier 3222 preview were not changed by this milestone.

Restart the existing isolated build:

```powershell
$env:HEALTHCLUES_PREVIEW_PORT = "3233"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

Rebuild after source changes:

```powershell
$env:HEALTHCLUES_PREVIEW_PORT = "3233"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

Exact final browser verification command:

```powershell
node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3233/play
```

Result: **PASS**. Chromium opened the exact final URL, traversed Start Adventure, selected Sleep Better, answered/skipped no more than 10 questions, saw the short Reveal, opened World Preview before activation, then opened and closed activation over the same map. All eight Quest branches completed within the 10-question cap and avoided the legacy profile dashboard. The browser asserted exactly one `data-world-canvas="immersive"`, full available map width/height, visible CTA above mobile navigation, no mobile horizontal overflow, hidden page overflow and no wheel-driven page scroll. Zoom changed the SVG camera transform; drag changed its pan; selecting Calm Forest changed the region summary while the starting Quest remained Sleep Valley. Activation retained one map canvas, received keyboard focus, closed on Escape and restored focus to the CTA. No uncaught browser runtime exceptions were observed.

The guest preview has Auth disabled by design. It does not send email or persist a World. Activation showed the honest read-only guest-preview notice. The isolated E2E below covers persistent gameplay with synthetic fixtures; real Supabase email delivery, link lifecycle, and account switching remain **PARTIAL**.

## Visual evidence

Screenshots are actual Chromium captures from the final 3232 application build, at desktop 1440×960 and mobile 390×844. They were opened and inspected after capture.

- World Preview: `App/reports/previews/healthclues-fullscreen-world-preview-desktop.png`, `healthclues-fullscreen-world-preview-mobile.png`.
- Companion dialogue: `healthclues-fullscreen-world-companion-desktop.png`, `healthclues-fullscreen-world-companion-mobile.png`.
- Region inspection: `healthclues-fullscreen-world-region-selected-desktop.png`, `healthclues-fullscreen-world-region-selected-mobile.png`.
- Activation over the World: `healthclues-fullscreen-world-activation-desktop.png`, `healthclues-fullscreen-world-activation-mobile.png`.

Inspection confirms one continuous illustrated World with the original paths and landmarks, floating controls, the same companion, and no inset map card or large below-map form. The mobile view crops the preserved 16:9 artwork through the pannable camera rather than distorting it; the starting marker, region panel, dialogue and CTA remain visible. The activation overlay retains the World behind it. These are visual acceptance checks for the requested World scene, not a claim that every other game screen has bespoke finished art.

## Regression and safety

- Focused ESLint for the changed React/game shell files — **PASS**.
- `node --check scripts/verify-healthclues-owner-preview.mjs` and `node --check scripts/run-healthclues-game-e2e.mjs` — **PASS**.
- `git diff --check` — **PASS** (only standard line-ending warnings for existing repository files).
- Isolated Next.js 16.3 owner-preview build — **PASS**; `/play` route generated. Existing middleware deprecation notice remains.
- `node scripts/run-healthclues-game-e2e.mjs` — **PASS after the final source changes**, using the isolated Docker E2E database. It exercised the full existing gameplay including World persistence/reload, Check-in, Knowledge, private Journal, Boss retry/victory/reward/unlock persistence, Toolkit/Collection, Community privacy/moderation, desktop/mobile interactions and cleanup. The test expectation was updated to assert the new read-only World scene copy; no production Auth, data, email or deploy was used.
- Guest World Preview writes — **PASS (browser path)**: preview displays read-only state; isolated E2E asserts no World row exists before activation.
- Returning-player stable World ID — **PASS in existing isolated E2E coverage**; no duplicate World was generated.
- Existing Botly routes, production Supabase, real email delivery, and production deployment — not modified.

## Remaining limitations

- Owner preview is guest-only; live signup/email verification and persistent authenticated owner play cannot be tested safely there.
- The isolated E2E Auth/mail harness verifies application orchestration, not the real Supabase provider's link delivery, expiration/replay, new-tab recovery, or account-switch lifecycle.
- Full assistive-technology/focus-trap testing and broad device/browser coverage remain outside this focused visual pass.
- Existing wellness content review and privacy/security release gates remain open. No production readiness claim is made.

## Shared-source change after final verification — status PARTIAL

After the 3233 browser run and final isolated E2E passed, the shared working tree changed again: `world-map.tsx` now adds `playable` flags, companion names and a “COMING SOON” state, while `verify-healthclues-owner-preview.mjs` now expects only Sleep Valley and HealthClues Realm to be selectable and six regions to be disabled. Those file timestamps are later than the verified 3233 build. I left these newer changes untouched. The still-running 3233 URL is a verified detached snapshot of the 07D build, but it no longer represents the latest shared source. The new region restrictions may conflict with 07D’s requirement to inspect other regions. Reconcile that shared-source decision, then rebuild/retest before treating current source as accepted.
