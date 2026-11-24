# HealthClues Acceptance Report — Cycle 147: Authenticated Mobile Toolkit Persistence

## QA retest checkpoint — 2026-11-24

- Hardened Mobile API routing/auth: web uses configured backend origin, proxy forwards the caller's authorization unchanged, and client login no longer creates demo/fallback sessions.
- Detective solve contract now requires bounded `selectedConclusionIds`, `wrongConclusionAttempts`, and `puzzleStates`, passes them as separate RPC arguments, and persists them via migration `20261124130000_healthclues_detective_solve_state.sql`.
- `3329` rebuild and readiness: PASS. Direct and proxy `8082` checks returned JSON `401` for unauthenticated mobile progress/toolkit/campaign/solve; no SPA HTML fallback observed.
- `3339` local fixture contract: PASS (`7 cases`, `9 Case 007 assets`), explicitly not accepted as production/runtime evidence.
- Fresh Expo export: PASS at `healthclues-mobile/dist-mobile-runtime-retest-20261124`.
- **Release BLOCK:** Supabase `127.0.0.1:54321` is connection-refused and Docker Linux engine is unavailable, so no authenticated campaign → solve → reload/cross-device persistence proof was possible. No synthetic credential or mock was used to claim it.

## Runtime recovery checkpoint — 2026-11-24

- **Backend/API runtime:** PASS on isolated `http://127.0.0.1:3329`. `node scripts/rebuild-and-restart-3329.mjs` completed a webpack production build, generated the full App Router route table (including `/play`, `/api/healthclues/mobile-toolkit`, and mobile detective routes), and reached the script's readiness probe.
- **Build fixes:** the isolated launcher now copies the current `next.config.ts`, points `turbopack.root` at the copied build directory, removes stale `App/` and `.next/` only inside that owned proof directory, and avoids the Windows `App`/`app` case collision. A narrowly scoped Node 24/Windows `readlink` compatibility shim is used only by this launcher. The isolated runtime explicitly skips type validation because existing detective fixtures still have known TypeScript errors; the regular config remains strict.
- **Smoke evidence:** `/play` returned HTTP 200; unauthenticated `/api/healthclues/mobile-toolkit` and `/api/healthclues/mobile-detective/campaign` returned HTTP 401.
- **Mobile evidence:** `node scripts/test-healthclues-mobile-toolkit-contract.mjs` PASS; `node healthclues-mobile/Gametrinhtham/tests/test-mobile-detective-contract.mjs` PASS; `npx tsc --noEmit -p healthclues-mobile/tsconfig.json` PASS.
- **Still blocked:** live authenticated DB/API save → reload → readback → remove is not verified because `127.0.0.1:54321` refuses connections and Docker's `dockerDesktopLinuxEngine` pipe is unavailable. No production endpoint or data was touched.

## Round 6 checkpoint — authenticated detective API boundary

- **Status: WORKING, not complete.** The mobile detective campaign endpoint now requires `requireUser`, returns only the authenticated user's DB progress, and reports `totalSolved` from that progress. A new authenticated mobile solve endpoint validates the payload and delegates completion to `healthclues_solve_detective_case_v1`; no browser/device storage is used for progress or inventory.
- Added source contract assertions for authenticated campaign loading, DB progress rehydration, authenticated solve RPC, and absence of local/session storage in the solve route.
- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: **PASS**.
- `node Gametrinhtham/tests/test-mobile-detective-contract.mjs`: **PASS**.
- Root `npx tsc --noEmit -p tsconfig.json`: **FAIL, pre-existing broader catalog/build errors** in `.next/types/validator.ts` and `App/gametrinhtham/src/data/case-007.ts` / `cases-chapter3.ts`; no new route error was isolated from the aggregate output.
- Live API test: **BLOCKED**; `127.0.0.1:3329` refused the connection. `npx supabase status` is still **BLOCKED** by `ECOMPROMISED / Lock compromised`, with Docker's Linux engine unavailable.
- Authenticated toolkit save → reload → API/database readback → remove for herb, sound and breath, migration application, 390×844 touch/browser QA, and the independent all-round QA pass remain open. No completion claim is made.

**Date:** 2026-11-22  
**Status:** WORKING — source implementation corrected; isolated database and authenticated browser/mobile QA remain outstanding.
**Control Tower task:** `task-1795150614583-uhb6nq` · worker round 19

## Round 7 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Added `scripts/test-healthclues-mobile-toolkit-contract.mjs` to verify the authenticated Toolkit API boundary, user scoping, allowed herb/sound/breath types, idempotent save/remove behavior, RLS migration controls, and no local/browser storage for Bag item persistence.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: **PASS**.
- Targeted ESLint: **NOT VERIFIED** because `npx` failed closed with `ECOMPROMISED / Lock compromised`.
- Live migration, authenticated save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and independent full-round/web-mobile parity QA remain **NOT RUN/BLOCKED** because Docker's Linux engine and local Supabase/runtime are unavailable. Overall status remains WORKING.

## Round 8 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Strengthened `scripts/test-healthclues-mobile-toolkit-contract.mjs` to recursively scan every mobile Bag/station source path (`app/(game)`, Herbal, Sound, Breath and `toolkitStorage`) and fail if any legacy device-storage item key returns.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: **PASS**.
- `npx supabase status`: **BLOCKED** by the existing local CLI state (`ECOMPROMISED / Lock compromised`); no local Supabase/Docker runtime was available for migration or authenticated API verification.
- Authenticated save -> reload -> API/database readback -> remove for herb, sound and breath; 390x844 touch/browser QA; and the separate all-round QA pass remain **NOT RUN/BLOCKED**. No completion claim is made.

## Scope

The mobile Toolkit Bag previously used `AsyncStorage` keys (`hc_mobile_toolkit_sounds`, `hc_mobile_toolkit_breaths`, and `hc_mobile_botanical_bookmarks`) as its source of truth. That did not satisfy the product rule that inventory/bag state must be persisted through the authenticated API in the database.

## Implemented

- Round 4 hardening: added `toolkitStorage.getState()` so the Bag performs one authenticated state read instead of three sequential reads.
- Added explicit Bag loading and retryable error UI in `healthclues-mobile/app/(game)/inventory.tsx`; API failures are no longer rendered as a misleading empty Bag. Herb, sound and breath removal mutations now surface an actionable error instead of an unhandled rejection.

- Added `healthclues_mobile_toolkit_items`, keyed by authenticated `user_id`, item type (`herb`, `sound`, `breath`) and item ID.
- Added authenticated `GET/POST /api/healthclues/mobile-toolkit`; the route calls `requireUser` and reads/writes only the authenticated user’s rows.
- Reworked `healthclues-mobile/src/services/toolkitStorage.ts` to use `apiFetch` for load/save/remove/toggle operations. `AsyncStorage` is no longer used for toolkit items; it remains available for the login session in the existing API client.
- Preserved the existing `HEALTHCLUES_TOOLKIT_CHANGED` event so the three bag views refresh without a reload.
- Corrected `healthclues-mobile/src/modules/herbal/HerbalGardenModal.tsx`, which still bypassed the new storage service: herb load, toggle and add-to-journey now use `toolkitStorage`, while unrelated profile, tea-date and goal data remain unchanged.

## Verification

- Source inspection: inventory refresh uses `toolkitStorage.getState()` and contains explicit loading/error/retry states: PASS.

- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: PASS.
- `npx eslint src/app/api/healthclues/mobile-toolkit/route.ts`: PASS (no diagnostics).
- Source inspection: toolkit storage has no `AsyncStorage` read/write calls and all mutations call the authenticated API client: PASS.
- Source inspection: Herbal, Sound and Breath bag paths all call `toolkitStorage`; the Herbal bag path no longer reads/writes `hc_mobile_botanical_bookmarks`: PASS.

## Not yet accepted

- Targeted ESLint was started for the changed route/storage/inventory files but hung without diagnostics and was stopped; therefore lint is NOT VERIFIED for this round.

- The migration has not been applied to an isolated local database in this round.
- Local DB verification is blocked: `npx supabase status` reports `ECOMPROMISED / Lock compromised`; Docker reports that the Docker Desktop Linux engine pipe is missing; direct checks to `127.0.0.1:54321` and `127.0.0.1:3329` are closed. The remote migration helper was not used because it targets the configured Supabase pooler and production must not be touched.
- No authenticated browser/mobile run has yet proven save → reload → database/API readback → remove for herb, sound and breath items.
- Existing legacy scripts that seed bag state through browser `localStorage` are not valid evidence for this requirement and need replacement with API-backed setup.
- Full separate QA across every game round, web/mobile parity, touch flow and loading/error states remains outstanding.

## Round 5 checkpoint - 2026-11-22

- Removed the unused legacy `AsyncStorage` import and botanical bookmark key from the player Bag screen. Toolkit item persistence remains exclusively through `toolkitStorage` and the authenticated API.
- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json` - **PASS**.
- Targeted ESLint over route, storage, Bag, and station modal files - **NOT VERIFIED**: the process produced no diagnostics for 60 seconds and was stopped.
- `npx supabase status` - **BLOCKED** by the existing local CLI state (`ECOMPROMISED / Lock compromised`); Docker still cannot connect to `dockerDesktopLinuxEngine`.
- No authenticated browser/mobile or database readback was claimed. The full QA gate remains open.

## Next action

## Round 9 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Hardened the mobile Toolkit API's PostgREST filters by URL-encoding the authenticated user ID for GET and DELETE operations. This preserves the existing authenticated user boundary while avoiding unsafe raw interpolation.
- Updated `scripts/test-healthclues-mobile-toolkit-contract.mjs` to require the encoded user filter and continue scanning all player-facing Bag/station paths for legacy device-storage item keys.
- Verification: `node scripts/test-healthclues-mobile-toolkit-contract.mjs` **PASS**; `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json` **PASS**.
- Local targeted ESLint on `src/app/api/healthclues/mobile-toolkit/route.ts`: **PASS** using the existing repository binary.
- `npm run docs:healthclues:check ...`: **REVIEW WARNING**, not a product failure; it recommended `app/knowledge_and_safety_spec.md`, `app/business_rules.md`, and `app/use_cases.md`. Semantic review found no business-rule or use-case change from this URL-encoding hardening, so those canonical docs were not altered.
- `npx supabase status` remains **BLOCKED** by `ECOMPROMISED / Lock compromised`; no Docker Linux engine, local Supabase, or app runtime is available. Live authenticated save -> reload -> API/database readback -> remove is therefore not verified.
- The separate QA pass for every game round, web/mobile parity, 390x844 touch flow, loading/error states, and usability remains open. No completion claim is made.

## Round 10 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Hardened the player-facing Herbal, Sound and Breath station modals so authenticated Toolkit loads expose loading/error state and save/toggle failures surface an actionable Bag error instead of silently presenting an empty state or an unhandled rejection.
- Extended `scripts/test-healthclues-mobile-toolkit-contract.mjs` to require those station loading/error guarantees while preserving the no-device-storage Bag guard.
- Verification: `node scripts/test-healthclues-mobile-toolkit-contract.mjs` **PASS**; `tsc --noEmit -p healthclues-mobile/tsconfig.json` **PASS**.
- Focused ESLint ran against the changed Toolkit/Bag/station sources but remains **NOT VERIFIED**: the repository reports 28 existing errors/47 warnings across those legacy files, including pre-existing hook/state and `any` issues; no production lint claim is made. The new code type-checks.
- Live isolated migration, authenticated save -> reload -> API/database readback -> remove for herb/sound/breath, 390x844 touch/browser QA, and separate full-round web/mobile parity QA remain **NOT RUN/BLOCKED** because ports 3329/54321 are closed and Docker/Supabase remains `ECOMPROMISED / Lock compromised`.

## Round 11 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Fixed a station error-state gap in `healthclues-mobile/src/services/toolkitStorage.ts`: the three `getSaved*Ids` methods no longer convert authenticated API failures into empty arrays. Herbal, Sound, and Breath station callers can now surface the existing retryable Bag error instead of falsely showing no saved items.
- Extended `scripts/test-healthclues-mobile-toolkit-contract.mjs` to reject this misleading-empty fallback in future changes.
- Verification: `node scripts/test-healthclues-mobile-toolkit-contract.mjs` **PASS**; `npx tsc --noEmit -p healthclues-mobile/tsconfig.json` **PASS**. A global `eslint` executable was unavailable in this shell, so lint is **NOT VERIFIED** for the changed mobile service.
- Isolated migration application, authenticated save -> reload -> API/database readback -> remove for herb/sound/breath, 390x844 touch/browser QA, and the separate full-round web/mobile parity/usability QA remain **NOT RUN/BLOCKED** because ports 3329/54321 are closed and Docker/Supabase remains `ECOMPROMISED / Lock compromised`.

The next action remains restoring the isolated local runtime without touching production, then proving the authenticated database round trip and independent QA gate. No completion claim is made.

## Round 17 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Strengthened the authenticated Toolkit contract regression test to verify that remove filters URL-encode item type and ID, malformed mutation payloads return structured 400 errors, and database/API failures return retryable 503 errors. No persistence implementation or storage boundary changed.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p healthclues-mobile/tsconfig.json`: **PASS**.
- Focused ESLint using the repository binary on the Toolkit route and contract script: **PASS**.
- Runtime recheck remains **BLOCKED**: Docker cannot connect to `dockerDesktopLinuxEngine`; `npx supabase status` exits `ECOMPROMISED / Lock compromised`; TCP ports `127.0.0.1:54321` and `127.0.0.1:3329` are closed.
- Migration application, authenticated herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and the independent all-round web/mobile parity/usability pass remain **NOT RUN/BLOCKED**. No production access was attempted and no completion claim is made.

Next action: restore the isolated local Docker/Supabase/app runtime, apply the migration locally, then execute the two-account authenticated round trip and separate QA pass before any completion claim.

## Round 16 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Hardened `healthclues-mobile/app/(game)/inventory.tsx` so the Bag's authenticated Toolkit load cannot update item, error, or loading state after unmount or locale-triggered effect cleanup. This matches the late-load safety contract already used by Herbal, Sound, and Breath stations.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p healthclues-mobile/tsconfig.json`: **PASS**.
- `git diff --check` on the changed Bag and contract files: **PASS** apart from the repository's existing LF/CRLF warning.
- `npm run docs:healthclues:check -- --files "App/healthclues-mobile/app/(game)/inventory.tsx" App/scripts/test-healthclues-mobile-toolkit-contract.mjs --docs App/CURRENT_STATE.md App/reports/V1_CYCLE_147_MOBILE_TOOLKIT_DB_PERSISTENCE.md`: **REVIEW WARNING**, recommending broader canonical targets; no new business-rule or use-case change was introduced.
- Runtime recheck: `npx supabase status` is **BLOCKED** with `ECOMPROMISED / Lock compromised`; TCP probes to `127.0.0.1:54321` and `127.0.0.1:3329` both failed. No production access was attempted.
- Live migration/application, authenticated herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and the independent all-round web/mobile parity/usability pass remain **NOT RUN/BLOCKED** because local Docker/Supabase/runtime is unavailable. No production access was attempted and no completion claim is made.

## Round 13 checkpoint - 2026-11-22

## Round 14 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Guarded Herbal Garden Toolkit load error/loading state updates with the existing `isMounted` flag and rerun the load when locale changes (`healthclues-mobile/src/modules/herbal/HerbalGardenModal.tsx`).
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit` from `healthclues-mobile`: **PASS**, exit 0 with no diagnostics.
- Targeted ESLint: **UNVERIFIED/FAIL**. It reports 28 errors and 46 warnings across the touched legacy screens; no clean lint claim is made.
- Authenticated runtime/API/browser QA: **BLOCKED**. No isolated app server was available; `GET http://127.0.0.1:3000/api/healthclues/mobile-toolkit` returned 404. Source contract still proves independent auth, per-user DB keying, no-store responses, and no local item persistence.
- Next action: start an isolated local app + Supabase/Auth fixture and run two-account API/browser/mobile-emulation QA for save, reload, remove, error/retry, touch flow, and web/mobile parity, followed by separate all-round QA.

- **Status: WORKING, not complete.** Strengthened the mobile Toolkit contract evidence to require independent authentication checks for GET and POST, `no-store` response caching, bounded item-ID validation matching the database limit, and preservation of the exact herb/sound/breath type boundary. No product persistence path was changed.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: **PASS**.
- Focused ESLint using the repository binary on the Toolkit route and contract script: **PASS**.
- Runtime recovery was rechecked without touching production: Docker client is present but `dockerDesktopLinuxEngine` is missing; `npx supabase status` exits `ECOMPROMISED / Lock compromised`; ports `127.0.0.1:54321` and `127.0.0.1:3329` both refuse connections.
- Migration application, authenticated herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and the independent all-round game/web/mobile parity/usability QA remain **NOT RUN/BLOCKED**. No completion claim is made.

Restore the isolated local HealthClues database/runtime without touching production, apply the migration, then run a new authenticated 390×844 mobile flow plus desktop API/database readback for herb, sound and breath save → reload → remove. Follow with the separate QA pass covering every game round, web/mobile parity, usability, loading/error states and touch flow. Do not claim completion before every acceptance criterion is proven PASS.
## Round 12 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Runtime recovery was rechecked without changing production: Docker client is present but the Linux engine named pipe is missing; `npx supabase status` exits `ECOMPROMISED / Lock compromised`; TCP ports `127.0.0.1:54321` and `127.0.0.1:3329` both refuse connections.
- Hardened Sound Garden and Zen Breath Toolkit loads against late promise resolution after modal unmount. Their authenticated Bag loading/error states now use an `isMounted` guard, and locale changes retrigger the load with the current message language. Added contract assertions for this cancellation behavior.
- Verification: `node scripts/test-healthclues-mobile-toolkit-contract.mjs` **PASS**; `npx tsc --noEmit -p healthclues-mobile/tsconfig.json` **PASS**; `git diff --check` found only pre-existing LF/CRLF and EOF blank-line warnings. Repository-local ESLint binary was unavailable, so lint is **NOT VERIFIED**.
- Migration application, authenticated herb/sound/breath save â†’ reload â†’ API/database readback â†’ remove, 390Ã—844 touch/browser QA, and the independent all-round game/web/mobile parity/usability pass remain **NOT RUN/BLOCKED**. No completion claim is made.
## Round 15 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Extended the Toolkit acceptance contract so Herbal Garden is held to the same late-async-load cancellation guarantee already required for Sound Garden and Zen Breath. This is a regression guard only; no inventory persistence path was changed.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p healthclues-mobile/tsconfig.json`: **PASS** (no diagnostics).
- The docs consistency check completed with a semantic-review warning for broader canonical targets; no business-rule change was introduced.
- Local ESLint binary was not present in this shell; lint is **NOT VERIFIED** for this round. `npx supabase status` remains **BLOCKED** by `ECOMPROMISED / Lock compromised`; TCP probes to `127.0.0.1:54321` and `127.0.0.1:3329` both failed. No production access was attempted.
- Authenticated migration application, herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and the independent all-round web/mobile parity/usability pass remain **NOT RUN/BLOCKED**. Next action: restore the isolated local Docker/Supabase/app runtime, apply the migration locally, then execute the two-account authenticated round trip and separate QA pass before any completion claim.

## Round 18 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Added `scripts/test-healthclues-mobile-toolkit-roundtrip.mjs` as the executable local-runtime gate for the missing persistence proof. It uses two confirmed synthetic accounts in the isolated Owner Demo, authenticated API save for herb/sound/breath, API reload, service-role PostgREST readback, cross-account isolation, malformed-input 400 verification, authenticated remove, and final API/database emptiness. It does not use browser/device storage for setup or persistence.
- Extended the source contract test to require the round-trip harness's account creation, database readback, isolation check, and no-local-storage boundary.
- `node --check scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **PASS**.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `npx tsc --noEmit -p healthclues-mobile/tsconfig.json`: **PASS**.
- Live `node scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **BLOCKED** before account creation by `fetch failed ECONNREFUSED 127.0.0.1:54321`; the isolated Auth/PostgREST service is down. Docker cannot connect to `dockerDesktopLinuxEngine`, `npx supabase status` returns `ECOMPROMISED / Lock compromised`, and 3329 is closed. No production access was attempted.
- Migration application, authenticated database round-trip, 390x844 touch/mobile browser QA, and the independent all-round web/mobile parity, loading/error, and usability QA remain **NOT RUN/BLOCKED**. No completion claim is made.

## Round 19 checkpoint - 2026-11-22

- **Status: WORKING, not complete.** Re-ran the static and runtime gates for the authenticated database-backed Toolkit Bag; no persistence implementation or storage boundary was changed this round.
- `node scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**.
- `node --check scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **PASS**.
- `npx tsc --noEmit -p healthclues-mobile/tsconfig.json`: **PASS**.
- `git diff --check` on the Toolkit files: **PASS** apart from the repository's existing LF/CRLF warnings.
- Live `node scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **BLOCKED** before account creation by `fetch failed ECONNREFUSED 127.0.0.1:54321`. `npx supabase status` remains blocked with `ECOMPROMISED / Lock compromised`; TCP probes to `127.0.0.1:54321` and `127.0.0.1:3329` both failed. No production access was attempted.
- Migration application, authenticated herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/mobile browser QA, and the independent all-round web/mobile parity, loading/error, and usability QA remain **NOT RUN/BLOCKED**. No completion claim is made.

Next action: restore only the isolated local Docker/Supabase/app runtime, run this two-account round-trip harness, then complete the separate QA pass before any completion claim.

## 2026-11-22 - Control Tower Round 20: recheck source gates and isolated runtime recovery

- **Status: WORKING, not complete.** An isolated Docker Desktop launch was requested, but the runtime did not recover: Docker reported the missing `dockerDesktopLinuxEngine` pipe and then permission denied for `docker_engine`; `npx supabase status` still exits with `ECOMPROMISED / Lock compromised`.
- Static verification remains green: `node App/scripts/test-healthclues-mobile-toolkit-contract.mjs` **PASS**; `node --check App/scripts/test-healthclues-mobile-toolkit-roundtrip.mjs` **PASS**; `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json` **PASS**; `git diff --check` reports only existing LF/CRLF conversion warnings.
- The authenticated round-trip harness remains blocked before local account creation because the isolated Auth/API at `127.0.0.1:54321` is unavailable. App port `127.0.0.1:3329` is also unavailable. No production endpoint, remote migration helper, or production data was touched.
- Migration application, authenticated herb/sound/breath save -> reload -> API/database readback -> remove, 390x844 touch/browser QA, and the independent all-round web/mobile parity/loading-error/usability QA remain **NOT RUN/BLOCKED**. No completion claim is made.
- **Next action:** restore only the isolated Docker/Supabase/app runtime, apply `20261122120000_healthclues_mobile_toolkit.sql` locally, run `test-healthclues-mobile-toolkit-roundtrip.mjs`, then execute the separate web/mobile QA pass before any completion claim.

## 2026-11-22 - Control Tower Round 21: authenticated Toolkit round trip recovered

- **Status: WORKING, not complete.** The isolated `healthclues-owner-demo` Supabase stack was reachable. The new migration was missing from the retained demo migration snapshot, so only `20261122120000_healthclues_mobile_toolkit.sql` was copied into that isolated project and applied locally; no production endpoint or data was touched. Postgres readback confirmed `healthclues_mobile_toolkit_items` exists and migration `20261122120000` is recorded.
- The guarded production build could not complete because unrelated detective alias files are outside the copied build scope. A development server was started from the isolated source copy on `http://127.0.0.1:3329` with the verified local Supabase keys and `HEALTHCLUES_TURBOPACK_ROOT`; only the requested Toolkit API route was exercised.
- Fixed a test-harness ordering defect in `App/scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: database readback is ordered alphabetically by `item_type`, so expected rows are now sorted before comparison. Product persistence behavior was unchanged.
- `node App/scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **PASS** at `http://127.0.0.1:3329`. Evidence covers unauthenticated 401, authenticated save for herb/sound/breath, API reload, Postgres readback, cross-account empty state, malformed-ID 400, authenticated removal, and final API/database emptiness.
- `node App/scripts/test-healthclues-mobile-toolkit-contract.mjs`: **PASS**; `node --check App/scripts/test-healthclues-mobile-toolkit-roundtrip.mjs`: **PASS**; `node scripts/test-healthclues-mobile-integration.mjs`: **PASS**; `npx tsc --noEmit -p App/healthclues-mobile/tsconfig.json`: **PASS**; `git diff --check` on the changed harness: **PASS**.
- The separate QA gate remains open: authenticated 390x844 touch/browser verification of all three station save/reload/remove flows, web/mobile parity, loading/error/retry states, and the independent every-round usability pass have not been run. Overall remains **WORKING**, with no completion claim.

## 2026-11-22 - Control Tower Round 22: UI QA attempted, stale bundle blocked

- **Status: WORKING, not complete.** The isolated Supabase/API runtime remained available and the authenticated Toolkit round-trip harness **PASS**; contract, harness syntax, and mobile TypeScript gates also **PASS**.
- The independent mobile QA harness reached the Bag at 390x844 and confirmed the empty three-category UI, but the available exported web bundle is stale relative to the current authenticated Toolkit implementation: after intercepting the Toolkit GET as HTTP 503, the Bag still rendered the empty state and did not show the current error/retry UI. The run therefore **FAILED/BLOCKED** before station save/remove and parity claims.
- The mobile checkout lacks the web bundler dependencies needed to produce a fresh Expo web bundle. No persistence code or production endpoint was changed.
- **Next action:** restore/build the approved isolated mobile web runtime from current source, rerun the full 390x844 touch flow through Herbal/Sound/Breath save -> reload -> UI remove, then verify desktop parity and Postgres emptiness. Keep overall status WORKING until every round and UX criterion is PASS.
