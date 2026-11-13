# HealthClues Game Shell Acceptance — 2026-10-28

Scope: Master Prompt 04 implementation against the current working tree. This is a local guest preview only. `.env.local` points at the production Supabase project, so no player login, writes, migration, real email or production operation was performed. The isolated preview intentionally omits `.env.local`.

## Requested status checks

| Requirement | Status | Evidence / notes |
|---|---|---|
| Canonical `/play` route | DONE | `src/app/play/page.tsx`; browser GET returned 200. |
| Welcome RPG and Start Adventure | DONE | `src/components/healthclues/HealthCluesWelcome.tsx`; button routes into the existing Quiz Quest view. Desktop/mobile screenshots captured and inspected. |
| Full-screen Game Shell without Botly marketing chrome | DONE | `src/components/healthclues/HealthCluesGameShell.tsx` wraps Welcome, Quiz, World and Dashboard. These are all current HealthClues player routes; no Botly marketing header/footer appeared in captured views. |
| Welcome → Quest → Quiz → Toolkit → World | PARTIAL | A real browser click from Welcome reached the existing Quest view, exposing all 8 options at 390px with no footer and no horizontal overflow. Quiz result links to existing Toolkit setup in `HealthCluesQuiz.tsx`; World setup and guest World are in `WellnessWorldGame.tsx`. Full personalized Quiz completion was not exercised because it requires safety answers and persistence. |
| Existing player resumes saved World | PARTIAL | `/play` checks the current authenticated session against `GET /api/healthclues/world` and redirects when `payload.world.id` exists (`HealthCluesPlayEntry.tsx`). Not exercised with a real authenticated account. |
| Live Preview works | DONE (guest/local) | Isolated Next webpack dev server at `http://127.0.0.1:3210/play`; HTTP 200 and real browser render. Root Turbopack dev is still affected by Windows `App`/`app` discovery; root-scoped `.next` was preserved. |
| Welcome/Game Shell desktop and mobile evidence | DONE (Welcome/World) | Welcome desktop/mobile and Game Shell World desktop/mobile were captured and inspected under `App/reports/previews/`; Toolkit desktop was also captured. The additional Boss screenshot is not captured because Boss requires an authenticated saved World; no synthetic state was written to production. |

## Implementation details

- Added `/play`, `HealthCluesPlayEntry`, `HealthCluesWelcome`, `HealthCluesGameShell` and scoped CSS modules. The Welcome reuses the existing eight-biome artwork at `/healthclues/assets/world/healthclues-world-overworld.webp`.
- Reused the existing Quiz and World routes/components. The Quiz route accepts `step=quest` for the real existing Quest selection. Dashboard uses the Game Shell. World still uses the existing map, Toolkit, Collection, Knowledge, Community and Boss panels.
- `/play` validates a saved World using the authenticated API and resumes the existing World; it routes to a Quiz draft only when its stored owner matches the current session. Stale/invalid sessions are cleared. World rendering waits for the new owner data before displaying private progression.
- Updated the Process section's problematic arbitrary Tailwind variant to a normal responsive utility after Next's generated stylesheet exposed the true CSS parser failure. Adjusted Welcome mobile title/button sizing after screenshot inspection. Replaced animated Quest motion buttons with ordinary accessible buttons to remove the reduced-motion hydration mismatch.

## Verification

- Next 16.3 webpack dev server in an isolated project copy compiled `/play`, Quiz and World. `/play` responded HTTP 200. The former CSS parse error was reproduced at `globals.css` generated line 9094 and disappeared after removing `md:[&>*:first-child]:order-2` from `src/components/sections/Process.tsx`.
- Focused real-browser interaction: clicking `START ADVENTURE` on `/play` navigated to `/en/wellness/healthclues/quiz?from=play&step=quest`; all eight Quest buttons were present, `scrollWidth` equaled the 390px viewport and no footer was rendered.
- Browser screenshots captured at 1440×960 and 390×844 (Welcome/Quest) and 1440×960 and 390×844 (guest World). World had `scrollWidth === viewportWidth` at 390px. The toolkit setup desktop view was also captured. Images were visually inspected; Welcome mobile overflow was found and fixed, then recaptured.
- Quest interaction uses eight existing quest definitions; a full personalized Quiz and saved World resume were not submitted against any account.
- No new E2E suite or database test was run. Existing full game E2E and isolated database tests remain as recorded in `V1_TEST_RESULTS.md`; this change does not claim to reverify them.
- Targeted ESLint over changed routes/components and the Process section: PASS (exit 0).

## Preview command

The live preview is running from `.tmp/healthclues-prompt04-dev`, an isolated copy created to avoid the case-insensitive root `App`/`app` collision. To start the same copy when port 3210 is free:

```powershell
Set-Location D:\botly\.tmp\healthclues-prompt04-dev
npm run dev -- --webpack --hostname 127.0.0.1 --port 3210
```

Then open `http://127.0.0.1:3210/play`. This copy does not load `.env.local`, so authenticated persistence is intentionally unavailable in this preview.

## Remaining work and release gates

- Run targeted automated entry/state tests for new guest, valid returning account, resumable Quiz, account switching, Back/Forward, reduced motion and route navigation against isolated fixtures.
- Capture/inspect authenticated Boss and rewards views using a non-production fixture only; capture the additional required acceptance states after test fixtures are available.
- Expand the Game Shell consistently across every player-facing profile/settings and related subroute; verify all nav anchors and data preservation on mobile.
- Confirm age/consent restrictions across direct routes and run the existing game E2E plus isolated database suite after the isolated Docker control plane is available.
- Human review of Catalog, Knowledge and Boss content, community blocking/muting and the existing documented privacy/analytics gaps remain separate release blockers. **This work does not establish production readiness.**
