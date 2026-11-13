# HealthClues live preview recovery — 2026-10-28

## Status

- **Owner preview: PASS.** Open [http://127.0.0.1:3222/play](http://127.0.0.1:3222/play). It is a detached, isolated Next.js production server and remained listening after browser verification.
- **Guest journey on owner URL: PASS.** Chromium rendered Welcome, Start Adventure, all eight Quest destination choices, a 10-question Sleep Better discovery, Discovery Reveal, the read-only eight-region World Preview and the in-World activation overlay. The preview browser recorded zero uncaught runtime errors and asserted no visible not-found content.
- **Live email activation / persistent guest account in owner preview: PARTIAL.** This owner preview deliberately has no Supabase environment and does not send email or save a World. The activation overlay explains that this is a read-only guest preview. Full authenticated continuation is covered by the separate isolated mock Auth + Docker E2E below, not by the live owner URL.

## Root cause and evidence

The existing process on 3210 (PID 3120, a root `next dev --webpack` process) was not stopped or modified. Its root `.next/server/app-paths-manifest.json` lacks `/play/page`, while the isolated project build manifest contains `/play/page` mapped to `app/play/page.js`. The root project contains a case-insensitive Windows collision between documentation directory `App` and Next's route directory `app`; the project's guarded isolated-build strategy avoids that collision by building from a separate project directory. The observed root dev server therefore does not have the HealthClues route in the manifest it is serving.

An earlier raw-response check used the serialized string `This page could not be found.` as a detector. That string can occur inside Next Flight HTML even when the hydrated route works, so that probe did not establish a rendered 404. The browser verification here checks visible DOM text and actual interactions. The definitive owner URL is the isolated preview at port 3222.

## Reproduction and preview lifecycle

The preview source is copied into `App/.tmp/healthclues-owner-preview`, built in isolation and started with an explicit Next project directory. The launcher strips Supabase, database, email-provider and admin-token environment values before building/starting.

Start/restart the existing verified build:

```powershell
node scripts/start-healthclues-owner-preview.mjs
```

After source changes, build a new isolated snapshot:

```powershell
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

If 3222 is occupied, the launcher leaves its owner untouched; select an available port:

```powershell
$env:HEALTHCLUES_PREVIEW_PORT = "3223"
node scripts/start-healthclues-owner-preview.mjs --rebuild
```

Then run the browser verification against that exact URL:

```powershell
node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3223/play
```

The current 3222 server is detached from E2E cleanup and listening as PID 33236 after the final rebuild and browser check. Logs are at `App/.tmp/healthclues-owner-preview.log`. Port 3210 remains untouched. The prior 3212 server started by this work was stopped after the independent preview passed.

## Browser evidence

`node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3222/play` — **PASS**. Chromium waited for hydration and clicked through the actual application. Title: `HealthClues · Your Wellness Adventure | Botly`; `HEALTHCLUES` and `START ADVENTURE` visible; not-found text absent; selected Quest `Sleep Better`; maximum question count shown as 10; no uncaught runtime exceptions. It also asserted no `pending-journey` key exists in localStorage or sessionStorage, and closed the activation overlay back to the same World Preview.

Captured from this exact live preview URL:

- [Welcome desktop](previews/healthclues-live-preview-welcome-desktop.png)
- [Welcome mobile](previews/healthclues-live-preview-welcome-mobile.png)
- [Quest desktop](previews/healthclues-live-preview-quest-desktop.png)
- [Discovery Reveal desktop](previews/healthclues-live-preview-reveal-desktop.png)
- [World Preview desktop](previews/healthclues-live-preview-world-desktop.png)
- [World Preview mobile](previews/healthclues-live-preview-world-mobile.png)
- [Activation overlay desktop](previews/healthclues-live-preview-activation-desktop.png)
- [Activation overlay mobile](previews/healthclues-live-preview-activation-mobile.png)

These images were visually inspected. The welcome art and companion render correctly at both viewport sizes, the eight-region map is visible in preview, and the parchment activation overlay fits mobile. The auth-disabled notice is expected for this isolated guest preview.

The separate isolated E2E also captured the real in-game Backpack and authenticated World, e.g. [Backpack](previews/healthclues-toolkit-desktop.png), [World](previews/healthclues-world-preview-desktop.png), and [Boss](previews/healthclues-boss-desktop.png). Those are isolated test-fixture screenshots, not claims that the guest-only live server can persist a player.

## Pending activation privacy correction

The prior `healthclues-pending-journey-v1` localStorage object held normalized email, Quest ID, consent timestamp, expiry and a derived HealthClues profile (wellness concern/interests and preference inferences). It did not contain the raw answer history, but the derived profile still revealed sensitive health-related information.

That plaintext browser storage is removed. The browser now POSTs the pending context only after explicit consent to `/api/healthclues/pending-journey`. The server stores it in an AES-256-GCM encrypted, 20-minute HttpOnly, SameSite=Lax cookie; Secure is enabled on HTTPS. The response is no-store. Retrieval requires a valid bearer session from the existing Supabase Auth provider, a verified email, and exact email match. The existing legacy localStorage key is deleted on `/play` entry. Closing/canceling activation and send errors clear the cookie; invalid/expired payloads are rejected and expired cookies cleared. No profile or answer fields are put into URLs or email callback parameters.

The cookie is encrypted and HttpOnly but is client-held ciphertext rather than a server-side one-time opaque reference. It is same-site and short-lived; its encryption key must be configured as a server-only secret in any deployed environment. The isolated owner preview uses a random process secret and has cloud activation disabled. Production key management and provider-level replay behavior were not tested or changed here.

## Regression and remaining limits

- `npm run lint -- ...` over changed API, auth, preview and game files — **PASS**.
- `npm run build:healthclues:isolated` — **PASS**; `/play` and `/api/healthclues/pending-journey` are present in generated route output.
- `node scripts/run-healthclues-game-e2e.mjs` — **PASS** on isolated Docker test database with loopback mock Auth and mock email. Covers guest preview before activation, synthetic verification callback, Quest continuation, Toolkit, single World creation, same World ID after reload, Knowledge, Boss, reward/unlock, community privacy and fixture cleanup. No production Supabase or real email was used.
- Mock OTP/Auth verifies application callback behavior, not real provider email delivery, new-tab provider semantics, invalid/expired/replayed provider links or account switching across real Auth sessions. Those remain **PARTIAL**.
- The live preview's activation screen is visual/read-only; its auth submission is intentionally disabled because no isolated auth service is wired to the owner preview. Use the isolated E2E for authenticated gameplay verification.
- The older Next.js development “1 Issue” badge was not separately re-opened in the 3210 process. This recovery established and fixed the owner-access route problem through a separate isolated preview; no badge was hidden or suppressed.
- No production data, credentials, deployment or unrelated process was changed. Production content review, privacy/security approval and existing release gates remain outstanding.
