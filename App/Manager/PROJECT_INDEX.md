# HealthClues Project Index

Generated 2026-11-02T16:04:16.022Z. This is a navigation index, not requirements authority.

## Actual layout

- Git checkout and application source: `D:\botly`
- HealthClues specifications and owner launcher: `D:\botly\App`
- Manager: `D:\botly\App\Manager`
- The launcher at `D:\botly\App\HealthClues_start_auto.bat` changes into docsRoot, not the checkout root.

## Project objective

HealthClues is a bilingual, safety-oriented wellness learning game. Its player flow connects Discovery Quiz, a personalized Wellness Plan, authenticated World/regions, lessons and activities, My Journey, NPC/Pet guidance, and private persistence. The actual app is a Next.js project pinned to version 16.3.0 with React 19.2.8 and Node 24.16.0 in this checkout. Its build script is the guarded isolated HealthClues build. No direct Playwright/Puppeteer dependency is listed; browser evidence comes from existing project scripts and local Chromium/CDP infrastructure. Shared game presentation lives in src/components/healthclues; the route is src/app/play; feature logic is under src/features/healthclues; API boundaries are under src/app/api/healthclues; local Supabase migrations are under supabase/migrations; browser and focused acceptance harnesses are under scripts.

## Factual baseline from latest dated sources (2026-11-02)

- MP17 Plan browser and persistence acceptance passed with explicitly synthetic fixtures and two isolated local accounts. This does not prove live AI recommendation quality or provider-generated persistence.
- A documented live Gemini request reached provider HTTP 200, while the app returned 503 RESPONSE_SCHEMA_MISMATCH before safety validation or Plan persistence. Reports say no more provider calls are authorized; recommendation quality remains unverified.
- EN/VI localization remains PARTIAL. Latest MP17 visual evidence showed Vietnamese AI goal titles on English My Journey. The NPC shell locale slice passed, while broader player localization and populated legacy 96-question account regression remain open.
- Latest MP17 acceptance says the current profile does not provide a persisted original 96-answer history source; do not claim retention proof without finding a real source.
- Evidence: App/reports/HEALTHCLUES_MASTER_PROMPT_17_ACCEPTANCE.md, App/reports/HEALTHCLUES_LOCALIZATION_ACCEPTANCE.md, App/reports/HEALTHCLUES_MASTER_PROMPT_16_ACCEPTANCE.md, and latest dated sections in App/CURRENT_STATE.md, App/IMPLEMENTATION_PLAN.md, and App/ACCEPTANCE_TESTS.md. These are dated evidence with stated limits, not blanket completion claims.


HealthClues is a bilingual, safety-oriented wellness learning game. Treat approved source specifications as authority; historical prompts and HEALTHCLUES_FINAL_COMPLETE.md are context only. Verify all status claims against source, tests, and dated reports. Never inspect secrets.

## Source documents

- MASTER_SPEC.md — 60399 bytes; SHA-256 3d0248dd05eca0f6d5035d2c1d0847ecfaceb1c5aa28bb4564a5686f4c46dde7; modified 2026-11-02T15:52:24.000Z
  - Quiz-to-World handoff verification update — 2026-10-31; Phase 10A — Post-Quiz Wellness Plan (2026-10-30); Local reminder implementation update — 2026-10-30; Lumi-guided journey and Gout playbook — 2026-10-30; HealthClues — Master Product Specification; MP20 approved discovery update — 2026-11-02
- BUSINESS_RULES.md — 53502 bytes; SHA-256 99838d7e688b16a46f98c548dd79b374fd345d544cff509100c8d76cdc3bab68; modified 2026-11-02T15:52:24.000Z
  - Botanist player-facing content and UI state — 2026-11-02; Bảo toàn ghi chú mục tiêu qua xác minh email (2026-10-31); Quy tắc Wellness Plan Phase 10A (2026-10-30); Bổ sung kiểm soát topic chưa hỗ trợ — 2026-10-31; Current guide, profile and provider boundaries — 2026-10-30; Business Rules
- DECISIONS_AND_ASSUMPTIONS.md — 41714 bytes; SHA-256 28dc440abeb83cf665030e2847d6ceee2dda8ee46eca5489500f2ba5dc64e4fb; modified 2026-11-02T15:32:56.000Z
  - 2026-11-02 — Keep Botanist content truthful and reduce duplicate Plan chrome; 2026-11-02 — Keep local synthetic Plan provenance explicit; 2026-10-30 — Phase 10A plan persistence and safety boundary; 2026-10-31 — Fail closed for unsupported Plan topics; 2026-10-30 — Isolated reminder delivery adapter; 2026-10-30 — Reuse current private profile and guide persistence
- IMPLEMENTATION_PLAN.md — 65853 bytes; SHA-256 63a5635d265b71b2c2f0661dd07c309a77c1195c5fcabcd3bfa6461919767a97; modified 2026-11-02T15:24:12.000Z
  - 2026-11-02 — Plan contract test maintenance; 2026-11-02 — UI redesign checkpoint complete (fixture evidence); 2026-11-02 — MP17 final functional Plan acceptance; 2026-11-01 — Master Prompt 15 guided focus completed; Localization verification delta ? 2026-10-31; Highest-priority continuation ? complete player localization (2026-10-31)
- ACCEPTANCE_TESTS.md — 81481 bytes; SHA-256 e2eb248ef60dc51efce9e624c85d96a1d6e6a5781680992f6c57916a97e8fcb3; modified 2026-11-02T15:51:54.000Z
  - 2026-11-02 Plan contract source assertion; HC-UI-REDESIGN-2026-11-02 — Botanist, Plan Builder and My Journey; MP17-FINAL-2 — actual Plan persistence with explicit synthetic fixture — 2026-11-02; MP17-FINAL — authenticated goal selection persistence, locale isolation and re-login — 2026-11-01; AT — Wellness Plan Phase 10A (2026-10-30); Local reminder and mobile surface evidence — 2026-10-30
- CURRENT_STATE.md — 227143 bytes; SHA-256 84deba53fe1649b29698e4c574842049fb17cb019c848532ba0890bd9a233d1a; modified 2026-11-02T15:51:54.000Z
  - Latest regression fix ? two-question Quiz activation handoff ? 2026-11-02; Continuation — repair stale Plan contract assertion — 2026-11-02; Latest task — Complete unfinished UI redesign — 2026-11-02; Latest task — MP17 bilingual display and authenticated legacy regression — 2026-11-02; Latest task ? MP17 legacy, AI-card Custom, and EN/VI regression ? 2026-11-02; Latest task — refine AI goal quality and numeric recommendations — 2026-11-02
- UI_UX_SPEC.md — 51681 bytes; SHA-256 4e06cf00b6fa1fc0318dc60e904ed32033c2dd2c31f39abc4f9606c087db75dd; modified 2026-11-02T15:52:24.000Z
  - Visual redesign checkpoint — 2026-11-02; Wellness Plan Builder Phase 10A (2026-10-30); Bổ sung checklist/coverage state — 2026-10-31; Current companion and summary update — 2026-10-30; MP17 My Journey bilingual Plan display — 2026-11-02; UI/UX Specification
- KNOWLEDGE_AND_SAFETY_SPEC.md — 21247 bytes; SHA-256 140a676386903f7209e0926b7f72fc333093297fd436cb05744f3e06dafe6e0f; modified 2026-11-02T14:53:04.000Z
  - Gout playbook and NPC response gates — 2026-10-30; Knowledge Engine & Safety Specification; Universal Post-Quiz habit retrieval (2026-10-30); Personalized discovery engine implementation — 2026-10-30; Daily reflection boundary (2026-10-29); 1. Mục đích và nguồn
- DATABASE_DESIGN.md — 42474 bytes; SHA-256 6807b90defc1f805a24cef2de24e6908dda1332e0a6cf5ff01f2801ce3604c52; modified 2026-11-02T11:24:24.000Z
  - MP17 bilingual recommendation snapshot and legacy World read compatibility — 2026-11-02; Handoff note preservation clarification (2026-10-31); Wellness Plan Phase 10A — mô hình dữ liệu (2026-10-30); Current additive persistence mapping — 2026-10-30; Database Design (logical proposal; dated addenda record actual local migrations); Universal Wellness Plan storage clarification (2026-10-30)
- USE_CASES.md — 52492 bytes; SHA-256 8010d0b40ca311182241ae67ba836f1d1b4eff54ec3ea2159927f576d0644a2b; modified 2026-11-02T15:06:18.000Z
  - UC — Xem và xác nhận Wellness Plan sau Quiz (Phase 10A, 2026-10-30); Local companion privacy and use cases — 2026-10-30; Use Cases; UC-HC-PLAN-ACTIVATION-HANDOFF — confirm Plan and resume after email verification — 2026-10-31; UC-HC-PLAN-UNKNOWN-TOPIC — fail-closed checklist and coverage gap — 2026-10-31; UC-HC-PLAN-UNIVERSAL — universal post-Quiz wellness plan clarification — 2026-10-30
- COMMUNITY_AND_PRIVACY_SPEC.md — 25196 bytes; SHA-256 c9baca3c430365f09eef2086cb14cbedff723e119e9f65085f729cda57e0aa3c; modified 2026-11-02T15:52:24.000Z
  - Phase 10A — private Wellness Plan data (2026-10-30); Local companion privacy and use cases — 2026-10-30; Community & Privacy Specification; Pending personal-goal note handling — 2026-10-31; Recommendation profile/history minimization — implementation 2026-10-30; Region scene privacy boundary — updated 2026-10-30
- HEALTHCLUES_CONTEXT.md — 32200 bytes; SHA-256 e2eebcc129a55c149d054cfc7b6b068f7f29341393aa71f571d4831d5c81d643; modified 2026-10-31T08:08:50.000Z
  - Latest continuation — continuous Quiz/Plan/email/World handoff — 2026-10-31; Latest handoff — integrated Quiz → Plan → World continuation — 2026-10-31; Latest handoff — Master Prompt 11 World experience — 2026-10-30; Latest handoff — Post-Quiz Wellness Plan browser acceptance (2026-10-30); Continuation: Phase 10A Wellness Plan Builder (historical snapshot; browser status superseded below); 2026-10-30 handoff — Lumi-guided Journey update
- README.md — 3798 bytes; SHA-256 b76287362802bf13c19558bc3d020b162b148a36eda65b1286fddd12a08d643b; modified 2026-10-28T16:21:42.000Z
  - HealthClues — bộ tài liệu sản phẩm; Mục đích; Thứ tự đọc; Danh mục; Phiên bản và thay đổi; Quy tắc giai đoạn

## Navigation / discovered implementation

### src/app/play
- `src/app/play/page.tsx`
### src/components/healthclues
- `src/components/healthclues/HealthCluesQuiz.tsx`
- `src/components/healthclues/AnalyticsConsent.tsx`
- `src/components/healthclues/HealthCluesDashboard.tsx`
- `src/components/healthclues/HealthCluesGameShell.module.css`
- `src/components/healthclues/HealthCluesGameShell.tsx`
- `src/components/healthclues/HealthCluesWelcome.tsx`
- `src/components/healthclues/HealthCluesWelcome.module.css`
- `src/components/healthclues/HealthCluesPlayEntry.tsx`
- `src/components/healthclues/HealthCluesAdventurer.tsx`
- `src/components/healthclues/HealthCluesAdventurer.module.css`
- `src/components/healthclues/HealthCluesQuiz.module.css`
- `src/components/healthclues/HealthCluesWorldPreview.tsx`
- `src/components/healthclues/HealthCluesWorldPreview.module.css`
- `src/components/healthclues/WellnessPlanBuilder.tsx`
- `src/components/healthclues/HealthCluesGameIcon.tsx`
- `src/components/healthclues/HealthCluesLocaleProvider.tsx`
- `src/components/healthclues/WellnessPlanBuilder.module.css`
- `src/components/healthclues/HealthCluesGoalFirstDiscovery.tsx`
### src/features/healthclues
- `src/features/healthclues/toolkit-domain.ts`
- `src/features/healthclues/server.ts`
- `src/features/healthclues/WellnessWorldGame.tsx`
- `src/features/healthclues/WorldAuthCallback.tsx`
- `src/features/healthclues/world-map.tsx`
- `src/features/healthclues/ToolkitCollection.tsx`
- `src/features/healthclues/KnowledgeJourneyPanel.tsx`
- `src/features/healthclues/PrivateJournalPanel.tsx`
- `src/features/healthclues/BossBattlePanel.tsx`
- `src/features/healthclues/ComboJourneyPanel.tsx`
- `src/features/healthclues/CommunityJourneysPanel.tsx`
- `src/features/healthclues/ReminderPreferencesPanel.tsx`
- `src/features/healthclues/quiz-bank.ts`
- `src/features/healthclues/world-map-immersive.css`
- `src/features/healthclues/region-availability.ts`
- `src/features/healthclues/HealthCluesPet.tsx`
- `src/features/healthclues/WorldAdventureScene.tsx`
- `src/features/healthclues/world-adventure.css`
- `src/features/healthclues/BackpackExperience.tsx`
- `src/features/healthclues/WellnessEncyclopediaStation.tsx`
- `src/features/healthclues/PrivateCarePlanPanel.tsx`
- `src/features/healthclues/RegionMapScene.tsx`
- `src/features/healthclues/DailyCheckinDialog.tsx`
- `src/features/healthclues/knowledge-skill-progress.ts`
- `src/features/healthclues/region-navigation-data.ts`
- `src/features/healthclues/personalized-recommendations.ts`
- `src/features/healthclues/PersonalizedSuggestions.tsx`
- `src/features/healthclues/gout-playbook.ts`
- `src/features/healthclues/JourneyToolkitSummary.tsx`
- `src/features/healthclues/wellness-plan.ts`
- `src/features/healthclues/server/wellness-plan-proof.ts`
- `src/features/healthclues/adaptive-discovery.ts`
- `src/features/healthclues/gemini-wellness-plan.ts`
- `src/features/healthclues/personalized-wellness-plan.ts`
### scripts
- `scripts/setup-publishing-channel.mjs`
- `scripts/check-supabase.mjs`
- `scripts/test-article-payload.mjs`
- `scripts/test-article-api.mjs`
- `scripts/sync-vercel-env.mjs`
- `scripts/update-fatty-liver.mjs`
- `scripts/setup-analytics-db.mjs`
- `scripts/seed-analytics.mjs`
- `scripts/setup-analytics-rpc.mjs`
- `scripts/test-mindful-article.mjs`
- `scripts/check-all-recent-articles.mjs`
- `scripts/deploy-analytics-rpc.mjs`
- `scripts/test-night-pattern.mjs`
- `scripts/test-night-companion.mjs`
- `scripts/test-night-companion-content.mjs`
- `scripts/upload-night-companion-voices.mjs`
- `scripts/test-night-companion-refresh.mjs`
- `scripts/audit-night-companion-e2e.mjs`
- `scripts/audit-night-companion-player.mjs`
- `scripts/generate-intro-audio.py`
- `scripts/test-night1-browser-verification.mjs`
- `scripts/check-audio-info.mjs`
- `scripts/analyze-voice-f0.py`
- `scripts/transcribe.ps1`
- `scripts/transcribe_guided.ps1`
- `scripts/test-comprehensive-night1-audit.mjs`
- `scripts/generate-chime-pacers.py`
- `scripts/test-chime-pacer-option-b.mjs`
- `scripts/capture-full-player.mjs`
- `scripts/generate-sleep-frequency-pacers.py`
- `scripts/check-view.mjs`
- `scripts/check-modal.mjs`
- `scripts/check-player.mjs`
- `scripts/verify-views.mjs`
- `scripts/capture-all-screens.mjs`
- `scripts/capture-player.mjs`
- `scripts/inspect-screen.mjs`
- `scripts/go-to-player.mjs`
- `scripts/verify-clean-player.mjs`
- `scripts/test-quiz-events.mjs`
- `scripts/capture-admin-quiz.mjs`
- `scripts/seed-and-capture-player.mjs`
- `scripts/generate-60min-sleep-audio.py`
- `scripts/test-60min-sleep-engine.mjs`
- `scripts/test_whisper_style.py`
- `scripts/test_whisper_voices.py`
- `scripts/test_luxurious_whisper.py`
- `scripts/generate-cloned-techniques-vieneu.py`
- `scripts/verify-cloned-player.mjs`
- `scripts/test-playback-start.mjs`
- `scripts/test-audio-elements.mjs`
- `scripts/test-trusted-click.mjs`
- `scripts/verify-live-production.mjs`
- `scripts/inspect-tab.mjs`
- `scripts/play-pivot-in-browser.mjs`
- `scripts/check-time.mjs`
- `scripts/strip-vietnamese.py`
- `scripts/generate-delta-cocoon-music.py`
- `scripts/verify-delta-cocoon-live.mjs`
- `scripts/test-transition.mjs`
### supabase/migrations
- `supabase/migrations/20261027080000_healthclues_profiles.sql`
- `supabase/migrations/20261027080300_healthclues_review_audit.sql`
- `supabase/migrations/20261027080100_healthclues_discovery_content.sql`
- `supabase/migrations/20261027080200_healthclues_review_workflow.sql`
- `supabase/migrations/20261027070000_botly_existing_schema_baseline.sql`
- `supabase/migrations/20261027100000_healthclues_discovery_activity.sql`
- `supabase/migrations/20261027110000_healthclues_discovery_activity_privileges.sql`
- `supabase/migrations/20261027120000_healthclues_discovery_skipped_action.sql`
- `supabase/migrations/20261027130000_healthclues_wellness_world.sql`
- `supabase/migrations/20261027140000_healthclues_toolkit_lifecycle.sql`
- `supabase/migrations/20261028100000_healthclues_toolkit_equip.sql`
- `supabase/migrations/20261028110000_healthclues_knowledge_journey.sql`
- `supabase/migrations/20261028120000_healthclues_boss_world_evolution.sql`
- `supabase/migrations/20261028130000_healthclues_reminder_queue.sql`
- `supabase/migrations/20261028140000_healthclues_reminder_retry.sql`
- `supabase/migrations/20261028150000_healthclues_admin_drafts.sql`
- `supabase/migrations/20261028160000_healthclues_reward_configuration.sql`
- `supabase/migrations/20261028170000_healthclues_discovery_reviewer_boundary.sql`
- `supabase/migrations/20261028180000_healthclues_quiz_bank_review.sql`
- `supabase/migrations/20261028190000_healthclues_boss_source_references.sql`
- `supabase/migrations/20261028200000_healthclues_milestone_world_evolution.sql`
- `supabase/migrations/20261028210000_healthclues_boss_cosmetic_rewards.sql`
- `supabase/migrations/20261028220000_healthclues_cosmetic_reward_configuration.sql`
- `supabase/migrations/20261028230000_healthclues_knowledge_currency_ledger.sql`
- `supabase/migrations/20261028240000_healthclues_data_deletion.sql`
- `supabase/migrations/20261028250000_healthclues_profile_history.sql`
- `supabase/migrations/20261028260000_analytics_service_ingestion_only.sql`
- `supabase/migrations/20261028270000_admin_analytics_service_only.sql`
- `supabase/migrations/20261029100000_healthclues_quiz_topic_knowledge.sql`
- `supabase/migrations/20261029110000_healthclues_first_time_guide.sql`
- `supabase/migrations/20261029120000_healthclues_private_care_plan.sql`
- `supabase/migrations/20261029130000_healthclues_region_guide_and_care_plan.sql`
- `supabase/migrations/20261029140000_healthclues_personal_topic_learning.sql`
- `supabase/migrations/20261029150000_healthclues_learning_skills_games.sql`
- `supabase/migrations/20261030100000_healthclues_flexible_backpack.sql`
- `supabase/migrations/20261030110000_healthclues_unsure_checkin_status.sql`
- `supabase/migrations/20261030120000_healthclues_recommendation_history.sql`
- `supabase/migrations/20261030130000_healthclues_guided_summary_reminders.sql`
- `supabase/migrations/20261030140000_healthclues_mailpit_reminder_delivery.sql`
- `supabase/migrations/20261031100000_healthclues_interactive_world_tour.sql`
- `supabase/migrations/20261031110000_healthclues_inventory_discovery_source.sql`
### App/reports
- `reports/healthclues-equipment-desktop.png`
- `reports/healthclues-world-desktop.png`
- `reports/healthclues-world-mobile.png`
- `reports/healthclues-quiz-intro-desktop.png`
- `reports/healthclues-quest-picker-desktop.png`
- `reports/healthclues-world-sleep-region-desktop.png`
- `reports/V1_PROGRESS.md`
- `reports/healthclues-browser-failure.png`
- `reports/V1_TEST_RESULTS.md`
- `reports/V1_RELEASE_READINESS.md`
- `reports/healthclues-boss-victory-desktop.png`
- `reports/healthclues-community-public-desktop.png`
- `reports/healthclues-reminders-desktop.png`
- `reports/healthclues-admin-moderation-desktop.png`
- `reports/healthclues-admin-content-review-desktop.png`
- `reports/healthclues-admin-diagnostics-desktop.png`
- `reports/healthclues-admin-authoring-desktop.png`
- `reports/healthclues-admin-rewards-desktop.png`
- `reports/healthclues-admin-quiz-preview-desktop.png`
- `reports/healthclues-account-privacy-desktop.png`
- `reports/healthclues-account-privacy-mobile.png`
- `reports/healthclues-general-content-age-skip-desktop.png`
- `reports/healthclues-general-content-age-skip-mobile.png`
- `reports/healthclues-profile-history-desktop.png`
- `reports/healthclues-profile-history-mobile.png`
- `reports/previews/healthclues-welcome-desktop.png`
- `reports/previews/healthclues-welcome-mobile.png`
- `reports/previews/healthclues-quest-mobile.png`
- `reports/previews/healthclues-quest-desktop.png`
- `reports/previews/healthclues-game-shell-toolkit.png`
- `reports/previews/healthclues-game-shell-world-desktop.png`
- `reports/previews/healthclues-game-shell-world-mobile.png`
- `reports/previews/healthclues-eligibility-desktop.png`
- `reports/previews/healthclues-quiz-desktop.png`
- `reports/previews/healthclues-eligibility-mobile.png`
- `reports/previews/healthclues-quiz-mobile.png`
- `reports/previews/healthclues-issue-investigation.png`
- `reports/previews/healthclues-quiz-intro-desktop.png`
- `reports/previews/healthclues-quiz-intro-mobile.png`
- `reports/previews/healthclues-results-desktop.png`
- `reports/previews/healthclues-results-mobile.png`
- `reports/previews/healthclues-toolkit-desktop.png`
- `reports/previews/healthclues-toolkit-mobile.png`
- `reports/previews/healthclues-toolkit-collection-desktop.png`
- `reports/previews/healthclues-toolkit-collection-mobile.png`
- `reports/previews/healthclues-knowledge-desktop.png`
- `reports/previews/healthclues-knowledge-mobile.png`
- `reports/previews/healthclues-community-desktop.png`
- `reports/previews/healthclues-community-mobile.png`
- `reports/previews/healthclues-journal-desktop.png`
- `reports/previews/healthclues-journal-mobile.png`
- `reports/previews/healthclues-boss-desktop.png`
- `reports/previews/healthclues-boss-mobile.png`
- `reports/previews/healthclues-checkin-desktop.png`
- `reports/previews/healthclues-checkin-mobile.png`
- `reports/previews/healthclues-rewards-world-evolution-fullpage-desktop.png`
- `reports/previews/healthclues-rewards-world-evolution-fullpage-mobile.png`
- `reports/previews/healthclues-rewards-world-evolution-desktop.png`
- `reports/previews/healthclues-rewards-world-evolution-mobile.png`
- `reports/previews/healthclues-world-preview-desktop.png`
### App/references
- `references/healthclues_game_ui_reference.png`
- `references/healthclues-game-ui.PNG`
- `references/healthclues-ui-storyboard.png`
- `references/HEALTHCLUES_MY_JOURNEY_REFERENCE.png`
- `references/healthclues-plan-reference.png`

## Known review leads (not yet asserted as defects)

Audit personalized recommendation quality, EN/VI consistency, legacy account regression, In-World Plan acceptance, Botanist RPG presentation, My Journey visual quality, pet guided spotlight, NPC equipment behavior, and other current acceptance requirements. Establish evidence per task before scheduling implementation.

## Phase order and dependencies

First establish a factual acceptance baseline; then prioritize safety/security and data boundaries; resolve functional/data integrations; address localization and visual acceptance; run regression and full acceptance. Use IMPLEMENTATION_PLAN.md and ACCEPTANCE_TESTS.md for actual dependency order.
