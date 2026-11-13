# HealthClues Ebook → Quiz Funnel — Phase 1 specification

> **Current handoff (2026-10-27):** This document preserves the original Phase 1 design and dated implementation notes below. Later work added account-backed profile save/restore/delete, the HealthClues Dashboard, persistent check-ins/history, and real HTTP/browser E2E; use [`ENVIRONMENT_STATE.md`](./ENVIRONMENT_STATE.md) and [`RELEASE_PACKAGE_20261027.md`](./RELEASE_PACKAGE_20261027.md) for the current verified state. The older statements below that account persistence or the Dashboard do not exist describe the earlier 2026-10-26 checkpoint and are historical. Latest isolated E2E passed, including Ebook → Quiz, profile consent/save/restore/delete, Dashboard, check-in/history, mobile/desktop, public Discovery and RSS regression. Production remains unchanged and is not release-ready: no HealthClues production deploy, no production import, and no content activation have occurred. AI content review notes are in [`CONTENT_REVIEW_TRIAGE_20261027.md`](./CONTENT_REVIEW_TRIAGE_20261027.md); they are not qualified clinical approvals.

## Audit findings (2026-10-26)

- Public library: `/en/wellness/ebooks` renders `EbookCatalogPage` inside the shared `WellnessShell`; category/search and original-source links are existing functionality.
- Detail pages: `/en/wellness/ebooks/[slug]`; verified downloadable files use `EbookLeadCapture` and `/api/ebooks/lead`. The server calls `capture_ebook_lead` (or a temporary signed-token fallback), and responds with a signed file URL only after success. Client then shows the URL and starts download. Errors have no success state.
- Two special detail routes (`blood-sugar-pairings`, `antioxidants`) have separate hub components and lead capture use; outside-source ebooks link to the original provider and Botly cannot confirm provider download completion.
- Existing quiz code found: insomnia quiz only. There is no HealthClues quiz route/engine or Personal Discovery Profile persistence. `HEALTHCLUES_QUIZ_BANK_V1.md` and `HEALTHCLUES_CODEX_MASTER_PROMPT.md` are present in the repository root. No prior `docs/healthclues/` documents were present.
- The quiz URL reserved for this funnel is `/en/wellness/healthclues/quiz`. It is now served by the HealthClues engine built from the supplied question bank; it is separate from the insomnia quiz.
- Existing analytics sends events to `/api/event-ping` and `/api/analytics/track` without a consent check. Funnel analytics must be gated on explicit analytics consent; do not transmit funnel events until the reader explicitly opts in. Never send answers, symptoms, conditions, medicines, emails, or names.

## Intended page structure

Keep the shared header/navigation and footer. On the library route, render the HealthClues hero first, then the existing library heading, search, filters, cards, source notes and footer. This remains an ebook library, not a quiz landing page. The hero has two columns on wide screens and one column on mobile, no popup and no fixed overlay. Its primary action is the quiz CTA; the secondary action scrolls to `#ebook-library`.

Hero copy (English):
- Eyebrow: `HEALTHCLUES · YOUR PERSONAL WELLNESS COMPANION`
- Headline: `Discover Wellness Ideas Tailored to You`
- Description: `Everyone's lifestyle is different. Tell us about your wellness interests, everyday habits, and preferences. HealthClues helps you discover recipes, practical activities, and evidence-informed resources that fit your life.`
- Primary: `Start My Free Wellness Quiz`
- Secondary: `Explore Free Ebooks`
- Support: `Free to explore · Personalized to your interests · No diagnosis or medical advice`

## Download completion and invitation

For email-gated hosted files only, treat the API response as success only when HTTP is successful and contains a valid download URL. Keep the existing automatic download and links intact. Following that confirmed state, show exactly one dismissible invitation for that component instance/event. Dismissal does not affect ebook delivery. No auto-navigation, repeat email prompt, or default marketing opt-in. The email-only delivery consent remains separate from marketing consent.

Copy (English): `Your Free Ebook Is Ready!` / `Your guide is on its way. Thank you for exploring HealthClues.`; invitation: `Want Wellness Ideas That Fit Your Lifestyle?` / `Your ebook is just the beginning. Take our free discovery quiz and explore everyday recipes, wellness activities, and educational resources matched to your interests.`; CTA `Create My Wellness Profile`; dismiss `Maybe Later`; support `Your answers help personalize your experience. You're always in control of your preferences.`

For link-out items there is no Botly-controlled success signal, so do not display a false success invitation. For direct static links, a click is not proof of successful transfer; only add an invitation if the delivery handler can confirm completion. Email provider acceptance is not currently used by the library flow; the current success signal is successful lead capture plus issuance of a working signed download URL, not email-send confirmation.

The completion signal and profile summary persist in `sessionStorage` for the current browser tab only. When that summary exists, the download state links to the profile instead of inviting the reader to repeat the quiz. Full quiz answers are not stored.

## Quiz attribution and topics

Both hero and post-download CTA target the same quiz route. Pass only allowlisted attribution: `source=ebook`, `entry=hero|post_download`, and an allowlisted opaque `ebook_id`. Never pass email, answers, conditions, symptoms, medicine, or user-entered values. The quiz must validate every parameter and treat topic as a suggestion that the user may change. Topic mapping uses reviewed catalog IDs only: gout-support, better-sleep, weight-management, blood-sugar, and antioxidants. Other ebook IDs have no preselection. A download indicates interest only, not diagnosis.

## Funnel events

Required event names: `ebook_library_view`, `quiz_hero_view`, `quiz_hero_click`, `ebook_download_success`, `post_download_quiz_view`, `post_download_quiz_click`, `quiz_started`, `quiz_completed`, `profile_created`.

Funnel metadata contains only event, entry point, and allowlisted ebook ID. After opt-in, the existing first-party analytics transport also attaches its pseudonymous visitor/session IDs, device type, page and referrer. Never send email, name, quiz answers, symptoms, diagnosis, or medicines. Reports group starts/completions by entry and ebook ID, and calculate stage conversion and invitation dismissal. Consent is stored as an explicit local browser preference.

## Privacy and safety

Wellness discovery only, no diagnosis, prescribing, or treatment decisions. Do not join ebook email records to quiz answers or accounts absent separate informed consent. Do not enroll ebook recipients in marketing by default. Before saving optional health-related answers to an account, present purpose, obtain appropriate separate consent, record consent version, and provide edit/delete controls. Guest answers stay in browser memory/local state only if the quiz's approved design supports this safely.

## Acceptance criteria

1. Library hero is above the existing library; its primary CTA reaches the shared HealthClues quiz and secondary CTA scrolls to the library.
2. Desktop/mobile layout preserves navigation, filters, ebook cards and footer.
3. Email-gated flow shows invitation only after a successful server response containing download URL; errors never show success. Invite appears once per completion, can be dismissed, and does not block links/download.
4. Link-out click is not counted as download success. Direct downloads only qualify after a real completion signal.
5. Both CTA sources use the same quiz engine; attribution values are allowlisted; suggested topics remain editable.
6. Funnel events are consent-gated; they contain no answers or sensitive health details, and the consent control explains the pseudonymous transport metadata.
7. Quiz completion/profile events require actual quiz/profile signals.
8. Preserve SEO metadata, ebook delivery, and marketing consent behavior.
9. No production deployment.

## Implementation status

The public funnel and HealthClues quiz engine are implemented. Analytics event transmission is off by default and enabled only when the reader opts in. A minimal Discovery Profile summary is stored in the current tab's `sessionStorage`; account persistence is not implemented.

### Work completed in this checkout (2026-10-26)

- Added the HealthClues hero before the existing library hero/title, preserving the library and adding the `#ebook-library` scroll target.
- Added the optional post-download invitation inside the shared email-gated capture flow. It only appears after a successful lead API response with one or more returned download URLs; links remain available when the invitation is dismissed. External-source items do not use this success state.
- Added funnel events with a default-deny consent gate using `botly_analytics_consent=granted`. The ebook hero and quiz intro offer an unchecked opt-in; event metadata includes entry and allowlisted ebook ID only, and the control discloses the existing transport metadata.
- Both CTAs reach the same quiz route with validated `source`, `entry`, and optional ebook ID. Reviewed mappings preselect gout, sleep, healthy weight, or balanced nutrition as an editable interest. Other ebook IDs have no suggested topic.
- Implemented the 10-question onboarding, optional 20-question adaptive deep section (13 common + up to 7 topic branch), skip/back/progress, adult gate, safety notices, and session-only Discovery Profile. No answers are persisted or sent to analytics.
- Added an authenticated admin preview at `/admin/healthclues-quiz-preview`; Vietnamese notes are served only from the token-protected `/api/admin/healthclues-quiz` endpoint. The endpoint returns 503 until `EBOOK_ADMIN_TOKEN` is configured.
- No database migration, account profile persistence, external email integration, or deployment was added. The email-gated ebook flow still returns signed URLs in the browser; it does not send an email in the current implementation.

Validation: `npm run build`, targeted ESLint, and `npm exec tsc -- --noEmit` passed. The built route table includes `/en/wellness/healthclues/quiz`. Local HTTP checks returned 200 for the library and quiz routes; the ebook-sourced quiz rendered the gout suggestion, and the Vietnamese note sentinel was absent from its public response. The admin notes endpoint returned 503 without its required server token. Repo-wide `npm run lint` still fails on unrelated existing errors and `.tmp` browser data (77 errors, thousands of warnings). No browser automation endpoint was available for interaction/viewport tests, and the live download backend was not exercised.

## Result page, Discovery Cards, and Phase 2 handoff (2026-10-26)

### Current implementation audit

- The HealthClues result is rendered by `src/components/healthclues/HealthCluesQuiz.tsx`. It shows topic/preferences, current safety alerts, update and clear actions. A summary is held in tab `sessionStorage`; quiz answers are not retained.
- Existing account sign-in uses a Supabase magic link in `src/components/wellness/WellnessAccount.tsx` and `src/lib/wellness-cloud.ts`. Cloud sync currently covers only `wellness_plans`; there is no HealthClues profile table or save/delete flow.
- The existing wellness dashboard is not a HealthClues daily discovery dashboard. Do not route the new CTA to it as if that feature existed.
- The reviewed source available for a result card in this checkout is the HealthClues “Blood Sugar & Everyday Pairings” hub. It includes “Lentils + Rice” and a reference to Moravek et al., *Journal of Nutrition* (2018). The hub source URL is `/en/wellness/ebooks/blood-sugar-pairings`; the cited study URL is `https://jn.nutrition.org/article/S0022-3166(22)10813-8/fulltext`.
- No reviewed, sourced activity content was found that is suitable for a personalized Everyday Wellness Activity card. Keep that slot in an explicit empty state. Do not invent instructions or estimates.

### Results page additions

Keep the existing profile summary and its safety alert, update, clear and session-only behavior. Add a “Your First Discoveries” section immediately below it with at most three typed slots:

1. Food or Recipe Discovery.
2. Everyday Wellness Activity.
3. Research & Learn.

A card is eligible only if its source item is in the reviewed local discovery catalog and matches the profile’s interest/content preferences. Phase 1 catalog seed: for a Balanced nutrition profile with an applicable food/research preference, show the Lentils + Rice guide card and/or its named study card, using the exact existing source links. Do not generalize the study outcome into a treatment or guaranteed result. For other combinations without a reviewed match, show a clear “No reviewed discovery is available for this topic yet” state. The Everyday Wellness Activity slot remains empty until editorially approved content and a source are added.

Each card data record contains stable ID, title, description, category, source label/URL, `whyAmISeeingThis`, `estimatedTime`, optional `safetyNotes`, and status (`New`, `Tried`, `Not tried`, `Saved`, `Not interested`). Status interactions are session-only in Phase 1; do not persist them or send them to analytics. Use “Not estimated” where the source does not establish a duration.

### Dashboard preview

Add “Explore My Daily Dashboard” as an in-page preview action only. It opens a clearly labeled Phase 2 preview/introduction state. It must not link to the general wellness planner or imply that a HealthClues dashboard, daily AI selection, or live content feed exists.

### Save My Profile and privacy

- Keep guest results visible without registration.
- Add an unchecked, separate consent before uploading the minimized Discovery Profile summary. Explain that it includes the selected wellness interest/preferences and safety level, is saved to the signed-in Botly account for HealthClues personalization, and is not joined to ebook delivery email or marketing consent.
- Use the existing magic-link account/session. The email field is user-entered for authentication; never prefill it from ebook delivery. After sign-in, resume the explicit save action.
- Add a dedicated `healthclues_profiles` table keyed only by `auth.users.id`, with profile JSON, consent copy version/time and timestamps. Enforce owner-only select/insert/update/delete with RLS. Do not include email or ebook ID. The full quiz answer set is not saved.
- Provide delete access from account settings and the result/profile screen. Without consent, do not upload. If the migration is not applied or cloud auth is unavailable, keep the guest profile usable and show a truthful save-unavailable message.

### Safety and scope

All public result UI is English. Admin notes and implementation reporting remain Vietnamese. No AI diagnosis, prescription, dosing, treatment recommendation, fabricated source, or unsourced activity is allowed. No Daily AI Engine, subscriptions, or production deployment in this change.

### Acceptance checks

1. Profile summary, safety messages and edit/delete options remain present.
2. “Your First Discoveries” has at most three slots, with the reviewed food/research source linked and unmatched categories clearly empty.
3. Card source, why shown, time, optional safety note and constrained status are represented in data; status is local only.
4. Dashboard CTA opens only the labeled Phase 2 preview.
5. Guest can view results without account.
6. Server save requires an explicit unchecked consent and signed-in account; the save payload contains no ebook email/ID or full answer set.
7. Account can delete the saved profile; RLS prevents cross-user access.
8. Public UI contains no Vietnamese notes and does not invent content or medical claims.

### Implementation update (2026-10-26)

- The result page now retains its profile summary, safety state, update action, and clear action. A minimized safety level is included in the session profile so safety messages remain visible when the result is reopened from the same tab.
- Added the three fixed discovery slots. The only eligible material is the existing Blood Sugar & Everyday Pairings guide for Balanced nutrition + Food & recipes, and its cited Moravek et al. paper for Balanced nutrition + Research explained. Everyday activity and unmatched topics show an explicit no-reviewed-content message. Card status choices remain in component memory only.
- Added the Daily Dashboard CTA as an in-page Phase 2 preview; it does not navigate to an unbuilt feature.
- Added optional profile save with an unchecked consent, account magic-link entry, safe allowlisted callback return, and a second explicit save action after sign-in. The profile payload is the minimized profile summary, with no ebook ID, ebook delivery email, or raw answer set. Clear on the result and delete in account settings invoke the dedicated delete operation.
- Added `supabase/migrations/20261027080000_healthclues_profiles.sql`, with owner-only RLS for select/insert/update/delete. It is applied only to isolated test databases; production remains unchanged. Until approved and applied there, a cloud save attempt returns the truthful unavailable message; guest results continue to work.
- No discovery statuses or answer data are sent to analytics. The daily engine, payment, and deployment remain out of scope.

Validation for this update: `npm exec tsc -- --noEmit`, targeted ESLint for the changed TypeScript files, and `npm run build` passed. The build route table includes `/en/wellness/healthclues/quiz`; the local route returned HTTP 200. No browser automation was available, so interactive viewport and authenticated database tests were not run. No production deploy or remote migration was performed.
