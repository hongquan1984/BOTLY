# HealthClues — Owner Playable Auth Acceptance

**Milestone:** 09A  
**Status:** PASS for isolated local owner Auth + one persistent V1 World flow; PARTIAL for the wider game and hosted-provider lifecycle.  
**Verified:** 2026-10-29

## Owner endpoints

- **Game:** [http://127.0.0.1:3235/play](http://127.0.0.1:3235/play)
- **Local test email inbox:** [http://127.0.0.1:54324](http://127.0.0.1:54324)
- Supabase local API/Auth: `http://127.0.0.1:54321`
- Isolated Postgres: `127.0.0.1:54322`
- Local SMTP capture: `127.0.0.1:54325`

The owner URL and inbox were reachable after the browser verification. The game server and local Supabase project were left running for review. If the machine restarts or the services are stopped, use the commands below.

## Windows commands

Start or restart the already-built demo:

```bat
App\start-game-demo.bat
```

Equivalent command:

```powershell
node scripts\start-healthclues-owner-demo.mjs
```

Rebuild from the latest source before starting:

```powershell
node scripts\start-healthclues-owner-demo.mjs --rebuild
```

Stop only this HealthClues app and local Supabase project. The dedicated database volume is preserved:

```powershell
node scripts\start-healthclues-owner-demo.mjs --stop
```

The launcher checks for occupied ports and refuses to stop an unverified process. Docker Desktop must be running. It uses the active Docker Desktop pipe with a demo-local Docker config directory and disables Supabase CLI telemetry. It does not alter the existing Codex launcher `App\HealthClues_start_auto.bat`.

The browser test is optional evidence collection, not needed to play:

```powershell
node scripts\test-healthclues-owner-auth-demo.mjs
```

That test creates additional synthetic accounts and leaves their rows/email messages in the persistent owner-demo volume/inbox intentionally; it does not run fixture cleanup against owner data.

## Isolation evidence

- The isolated project ID is `healthclues-owner-demo`; its active containers use that project name.
- Database volume is `supabase_db_healthclues-owner-demo`, separate from the pre-existing `botly-healthclues-db-e2e` test database/volume.
- Read-only container inspection confirmed the named owner-demo volume is mounted at PostgreSQL data storage.
- Read-only Postgres check found **28** applied entries in `supabase_migrations.schema_migrations`.
- Local Auth, PostgREST, Kong, Mailpit and Postgres were healthy. Realtime, storage, Studio and other non-required Supabase services were excluded.
- `.env.local` was not loaded, changed or used for writes. The launcher filters inherited Supabase/DB/email credentials, and supplies only `127.0.0.1` endpoints and keys returned by `supabase status` for this local project. Email is captured by local Mailpit; no external mail provider is configured for the demo.
- Repository migrations were applied to a new local volume, not a hosted project. The schema-only baseline contains cloud-owner default-ACL statements for `supabase_admin`; the isolated copy omits those 12 role-specific statements because the local migration role cannot change that cloud role's defaults. Source migrations remain unchanged. No production rows were copied.
- The app's pending Quiz/Journey context is retained for the existing 20-minute window in its encrypted, HttpOnly, SameSite=Lax cookie. Its stable random encryption key is stored only in ignored `App/.tmp/healthclues-owner-demo/`. Email is matched to the confirmed Auth user before resuming.

## Implementation changes

- Added `scripts/start-healthclues-owner-demo.mjs`: creates/validates the ignored local Supabase workspace, snapshots current migrations, safely starts only the named project, checks local endpoints, applies pending migrations without resetting data, builds the isolated Next source copy and starts the app on loopback port 3235.
- Added `App/start-game-demo.bat`; the existing Codex launcher was left alone.
- Added `scripts/test-healthclues-owner-auth-demo.mjs` for real Chromium and local Mailpit/Auth coverage.
- Fixed `sendMagicLink` in `src/lib/wellness-cloud.ts`: GoTrue's REST endpoint needs the redirect in the `redirect_to` query parameter. The previous SDK-shaped `options.email_redirect_to` JSON was ignored, so a real confirmation link fell back to the project `site_url` (Botly root) instead of the HealthClues callback. The corrected callback completed the actual verification flow.
- No database migration, product schema, production credential, production setting, or deployment changed.

## Browser verification

The tests used the same owner-accessible application build at `http://127.0.0.1:3235/play`, not the guest E2E server.

| Check | Result | Evidence |
|---|---|---|
| Welcome renders; Start Adventure works | PASS | Chromium visual regression; no not-found page |
| Quest, maximum-ten-question Quiz, Reveal and World Preview | PASS | Chromium walked Sleep Valley; existing preview verifier also checked both available Quest paths and six locked regions |
| Guest remains read-only before activation | PASS | unauthenticated `GET /api/healthclues/world` returned 401 |
| Email reaches test inbox; confirmation is real local Supabase Auth | PASS | Chromium submitted a synthetic address; test followed the captured Mailpit confirmation URL; callback session had confirmed email state |
| Quest continuation and Backpack | PASS | confirmed callback returned into same Sleep Quest; three equipment slots were present and all were skipped |
| Persistent World creation and reload | PASS | authenticated API returned one World/one branch; navigating to `/play` restored the same World ID |
| Account isolation | PASS | second confirmed synthetic account had no World and its request for the first account's private check-in returned null |
| Invalid callback recovery | PASS | callback without a token showed invalid/expired recovery |
| Runtime errors | PASS | zero uncaught browser exceptions in the Auth flow |
| Desktop/mobile evidence | PASS | owner-build screenshots captured; mobile 390×844 active World and 1440×960 Welcome/World reviewed |

The application screenshot files are:

- [`healthclues-live-preview-welcome-desktop.png`](previews/healthclues-live-preview-welcome-desktop.png)
- [`healthclues-live-preview-welcome-mobile.png`](previews/healthclues-live-preview-welcome-mobile.png)
- [`healthclues-fullscreen-world-preview-desktop.png`](previews/healthclues-fullscreen-world-preview-desktop.png)
- [`healthclues-fullscreen-world-preview-mobile.png`](previews/healthclues-fullscreen-world-preview-mobile.png)
- [`owner-auth-activation-overlay-desktop.png`](previews/owner-auth-activation-overlay-desktop.png)
- [`owner-auth-backpack-desktop.png`](previews/owner-auth-backpack-desktop.png)
- [`owner-auth-persistent-world-desktop.png`](previews/owner-auth-persistent-world-desktop.png)
- [`owner-auth-persistent-world-mobile.png`](previews/owner-auth-persistent-world-mobile.png)

All were captured from the owner build. Welcome, World Preview, Activation, Backpack and persistent World captures were visually inspected. The active V1 World screen still uses its existing map/panel composition; this milestone made Auth and saved gameplay reachable rather than redesigning that screen.

## Kiểm tra giữ dữ liệu qua lần khởi động lại

- **PASS:** Trước/sau khi dừng và khởi động lại demo, số liệu trong volume cô lập giữ nguyên: 4 tài khoản Auth, 2 Wellness World và 2 nhánh. Dùng Chrome profile đã xác minh trước đó, `/play` tự tiếp tục World hiện có; tải lại trang vẫn giữ nguyên World ID.
- Lệnh kiểm tra: `node scripts/verify-healthclues-owner-resume-after-restart.mjs`. Báo cáo kiểm thử không ghi email hoặc thông tin đăng nhập.

## Giới hạn xác minh còn lại

- This proves the **local Supabase Auth + Mailpit** provider path. Hosted/production email delivery was neither configured nor tested; no external email was sent.
- Invalid callback was tested. OTP expiration timing and replay of an already-consumed provider token were not independently tested.
- A second account was verified for owner scoping. Account deletion and closing/reopening the entire browser were not tested. Local service stop/start and retained Chrome profile resume are verified as described above.
- Authenticated mobile Activation/Backpack was not separately captured; the active World was captured at 390×844.
- This does not complete detailed Sleep Valley/HealthClues Realm maps, Pet systems, health-concern Journey persistence, reviewed Catalog availability, Knowledge mini-games/Skills, or human content/privacy/security gates. Product release remains NOT READY.
