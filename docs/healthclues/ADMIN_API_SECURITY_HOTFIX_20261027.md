# Botly admin API security hotfix — 2026-10-27

Status: prepared, not deployed. This is an existing Botly security repair, separate from the HealthClues release.

Reviewable patch: [`BOTLY_ADMIN_API_SECURITY_HOTFIX_20261027.patch`](BOTLY_ADMIN_API_SECURITY_HOTFIX_20261027.patch), generated against stable source commit `3761b5210ae8faa7cf6cc9e0958351ebcef75b8e`. It contains four admin route changes and adds the shared `src/lib/admin-auth.ts` helper; `git apply --reverse --check` passed against the current working tree.

## Evidence

- Stable production deployment before the Phase A key redeploy: `dpl_GfRUpcTzMXLEjJzBBqStCX5xxUr7`, source commit `3761b5210ae8faa7cf6cc9e0958351ebcef75b8e`.
- On the current production alias `https://www.botly.vn`, anonymous GETs to `/api/admin/analytics` and `/api/admin/night-companion-funnel` both returned HTTP 200.
- A response-shape-only inspection found subscriber `email` fields in analytics and `answers` fields in the Night Companion funnel. Response values were not printed, recorded, or copied.
- The same stable commit's `/api/admin/night-companion-dispatch` POST has no authentication guard and calls `processDueReminders`, which can mutate reminder rows and send email. The endpoint was not invoked on production because of those side effects.
- The deployed commit's Ebook Library admin route has a hard-coded fallback token.
- Current working-tree admin routes require `EBOOK_ADMIN_TOKEN` and use timing-safe Bearer comparison. With the token absent they fail closed; with no valid token they return 401. Local HTTP E2E now checks every admin GET endpoint and unauthenticated reminder-dispatch POST. The test runner blanks production credentials discovered in `.env*` and explicitly disables real email dispatch. No hotfix was deployed.
- The isolated stable-base archive, with only the reviewed hotfix patch applied, passed `next build` and TypeScript. Anonymous HTTP requests returned 401 for analytics, funnel, Ebook Library and dispatch POST; dispatch GET returned 405. Targeted ESLint on the four modified routes and shared auth helper passed; the main working tree's `tsc --noEmit` passed. Secret scan also passed across 350 workspace source files.

## Minimal patch payload

- `src/app/api/admin/analytics/route.ts`: require configured server-side admin token before querying aggregate and quiz data.
- `src/app/api/admin/night-companion-funnel/route.ts`: require the same auth before returning funnel answers.
- `src/app/api/admin/ebook-library/route.ts`: remove the default token and fail closed when the environment token is absent.
- `src/app/api/admin/night-companion-dispatch/route.ts`: require the same server-side admin credential before reminder processing.
- `src/lib/admin-auth.ts`: add the shared timing-safe Bearer-token check required by the analytics, funnel and dispatch route changes.

These files contain no HealthClues routes or UI. The production deployment must be assembled from the stable production commit plus only these files; do not deploy the current HealthClues working tree for this hotfix.

## Deployment and verification plan

1. Configure a high-entropy `EBOOK_ADMIN_TOKEN` as a Sensitive Production variable. Do not use `NEXT_PUBLIC_*`, source code, a build argument, or the old hard-coded fallback.
2. Deploy only the isolated Botly hotfix based on the stable production commit.
3. Verify anonymous GET requests to analytics, funnel, Ebook Library, HealthClues quiz preview and Discovery Review return 401 (or 503 when the token is intentionally absent). Verify unauthenticated POST to reminder dispatch returns 401 before any work runs. Do not invoke authenticated dispatch as a smoke test because it may send real email.
4. With the owner-held token, verify the read-only analytics, funnel, Ebook Library and quiz-preview surfaces. Smoke test homepage, RSS, Ebook Library and download flow. Confirm public output contains no admin analytics or quiz-answer data.
5. Keep a known-good patched deployment for rollback. Do not roll back to the vulnerable deployment. If the patched deployment fails and no patched rollback is available, disable the affected endpoints rather than restoring public access.

Production deployment and token configuration require the owner's grouped approval. The existing HealthClues release gates (schema comparison, fresh restorable database + Storage checkpoint, qualified content review, and HealthClues migrations/import/deploy) remain separate and unresolved.
