# HealthClues owner experience fix — 2026-10-28

## Status

- **Canonical post-Quiz reveal and World Preview: PASS** on the same owner-accessible, detached preview build at [http://127.0.0.1:3222/play](http://127.0.0.1:3222/play).
- **All eight Quest branches: PASS** through the 10-question cap. A forced/stale `view=profile` query on `from=play` is ignored; each branch reaches the short Reveal without mounting the old profile report.
- **Refresh after completion: PASS.** After Quiz, URL is `/en/wellness/healthclues/quiz?from=play&step=reveal`. Browser refresh preserves the same short Reveal and selected Quest. `step=quest` starts a fresh Quest choice and clears the old draft.
- **Authenticated email/Backpack/persistent World on owner preview: PARTIAL.** The preview deliberately has no Supabase/Auth environment. Existing isolated mock Auth + game E2E is the proof for Backpack, one persistent World, and same-ID reload. No real provider email was sent.

## Exact diagnosis

The rejected strings were in `src/components/healthclues/HealthCluesQuiz.tsx`, inside the `activeView === "result"` render. The short RPG reveal and the legacy six-field profile/report were both mounted under the same result state; the old report lived in a `<details>` panel and contained the six profile cards, Update/Clear controls, `DiscoveryResults`, external Guides/Ebooks links and a second continuation CTA. It was collapsed by default, which is why a normal screenshot of the new Reveal looked acceptable while the legacy experience was still in the DOM and could be opened.

On the owner preview before the fix, completing the Quiz reached:

```text
http://127.0.0.1:3222/en/wellness/healthclues/quiz?from=play&step=quest
```

The visible screen was the short companion Reveal, but the browser assertion found `legacyDetailsMounted: 1`. Expanding “More about your profile and discoveries” exposed the rejected profile report. The owner screenshot had no address bar, so its exact browser route cannot be conclusively inferred from that image alone. The reproduction above confirms the legacy profile UI was reachable from the canonical `/play` journey itself.

The exact label `NEXT · UNLOCK YOUR TOOLKIT` is not present in current source or the owner build inspected. It appears to have come from a different legacy/stale rendering; the screenshot alone cannot identify which one. The profile cards, however, match the legacy details block in the canonical Quiz result.

There were two additional state defects. First, `validateQuizAttribution` allowed `?view=profile` even with `from=play`. Second, explicit `step=quest` could be overridden by a saved session draft whose view was `world_preview`. These route/session disagreements explain why old tests could follow the happy path while stale browser state still selected a different scene.

After the fix, selecting a Quest records `step=onboarding`, so a refresh resumes the question draft. Completing the last question changes the canonical route to `?from=play&step=reveal`; refreshing there restores the short reveal and the selected Quest. Clicking its only primary action changes the scene to World Preview (`#world-preview`) without routing through Toolkit.

## Changes

- `src/components/healthclues/HealthCluesQuiz.tsx`: legacy profile/report subtree now mounts only for the explicit non-game profile view; canonical `from=play` Reveal contains no profile `<details>` subtree. Removed duplicate World Preview render. A scene transition resets scroll to the top so content is not left behind game navigation. Completing the Quiz updates the route state to `step=reveal`; an explicit `step=quest` clears the stale quiz draft, while other resumable states keep their existing behavior.
- `src/lib/healthclues-quiz.ts`: `from=play` overrides `view=profile`/`view=save` to keep those legacy/profile modes out of canonical gameplay.
- `src/app/en/wellness/healthclues/quiz/page.tsx`: recognizes `step=reveal` for refresh recovery.
- `scripts/verify-healthclues-owner-preview.mjs`: actual Chromium assertions now reject the old profile strings and any mounted `<details>` block after Quiz; check route state, refresh, selected Quest, 10-question limit, World Preview before activation, activation only after player action, top scroll position, no horizontal overflow/footer, close-to-preview, and every one of the eight branches. Branch runs deliberately include `view=profile` to catch stale query leakage.

The detailed profile and Discovery management remain available through the existing Profile/Dashboard route and the explicit non-game profile path. No profile data was deleted.

## Why the previous E2E passed

The prior test waited for “Your adventure is ready!” and clicked “ENTER MY WELLNESS WORLD.” It did not assert that the old report subtree was absent, and the `<details>` block was closed by default. It also used a fresh browser profile, so it did not cover stale `world_preview` draft overriding an explicit `step=quest` URL. The previous test therefore verified the forward button but not that the owner-visible post-Quiz scene was exclusive or robust to stale state.

## Actual owner preview verification

Command:

```powershell
node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3222/play
```

Latest result: **PASS**. The exact final run logged:

- post-Quiz URL: `/en/wellness/healthclues/quiz?from=play&step=reveal`
- legacy details mounted: `0`
- rejected profile copy present: `false`
- after-refresh URL/state: same `step=reveal` and same selected `Sleep Better` Quest
- Quest branches checked: `8`
- maximum initial questions: `10`
- uncaught browser runtime errors: `0`
- activation opened only after `START YOUR JOURNEY`; close returned to the preview

Actual rendered screenshots from this same 3222 build, visually inspected:

- Before: [pre-fix Reveal with expandable legacy panel](previews/healthclues-owner-07c-before-reveal-desktop.png), and [expanded six-card Discovery Profile from the pre-fix owner build](previews/healthclues-owner-07c-before-legacy-profile-expanded-desktop.png)
- Last Quiz question: [desktop](previews/healthclues-owner-07c-last-question-desktop.png), [mobile](previews/healthclues-owner-07c-last-question-mobile.png)
- After: [Reveal desktop](previews/healthclues-live-preview-reveal-desktop.png), [Reveal mobile](previews/healthclues-live-preview-reveal-mobile.png), [Reveal after refresh](previews/healthclues-live-preview-reveal-after-refresh-desktop.png)
- [World Preview desktop](previews/healthclues-live-preview-world-desktop.png), [World Preview mobile](previews/healthclues-live-preview-world-mobile.png)
- [Activation desktop](previews/healthclues-live-preview-activation-desktop.png), [Activation mobile](previews/healthclues-live-preview-activation-mobile.png)

Visual inspection confirms the Reveal is short, uses the companion and selected Quest, has one primary World action, and no profile dashboard/guide links. Mobile Reveal and last question fit the 390×844 viewport without horizontal overflow; the screen begins below the compact game HUD. The mobile World map remains scrollable to its lower controls.

## Tests and limits

- Focused ESLint on touched files: **PASS**.
- `node scripts/verify-healthclues-owner-preview.mjs http://127.0.0.1:3222/play`: **PASS**, including eight full 10-question branches and refresh.
- Full isolated `node scripts/run-healthclues-game-e2e.mjs`: **PASS** after the UI/route-state changes. It covered 8-Quest selection, 10-question onboarding and reload resume, guest preview with no World row, mock verification callback, Backpack, toolkit persistence, exactly one World and same-ID reload, Knowledge, Boss retry/victory/rewards/unlock persistence, Community privacy/moderation, and fixture cleanup. Cleanup verified synthetic rows were removed from the isolated test database.
- Owner preview is guest-only/read-only; no production Supabase, real member data or real email is configured. Authenticated Toolkit/World persistence uses the existing isolated test Auth/database E2E, not the owner preview.
- Real Supabase email provider, invalid/expired/replayed links and real account switching remain outside this visual-route verification. Existing human content/security/privacy release blockers remain.
- No production changes or deployment.
