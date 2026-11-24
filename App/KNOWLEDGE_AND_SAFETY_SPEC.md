## 3D Floating Village & World Exploration Safety Boundary — 2026-11-24 (Cycle 148)
The Three.js Cozy Fantasy Floating Village (`word3d`, port 5173 embedded into HealthClues Mobile `app/(game)/world.tsx`) functions strictly as an interactive lifestyle gamification and wellness habit discovery space. Station landmarks (Nhà Thảo Mộc, Nhà Âm Thanh, Thiền Đường Hơi Thở, Quảng Trường Nhiệm Vụ) provide non-clinical relaxation activities, mindfulness exercises, and habit-tracking awareness. Interactions do not provide clinical diagnoses, medical treatments, or pharmacologic prescriptions. All health-tracking metrics maintain user privacy and comply with non-diagnostic wellness disclaimers.

## Dynamic Toolkit Library & Lifestyle Wellness Safety Boundary — 2026-11-17 (Cycle 135)
The 3 village sanctuaries (Nhà Thảo Mộc - Flora, Nhà Âm Thanh - Lyra, Thiền Đường - Hơi Thở - Aura) operate strictly as educational and experiential lifestyle relaxation resources. Saving sounds, breathwork exercises, or herbal tea recipes into the player's personal Toolkit Bag (`toolkitStorage.ts`) represents self-directed lifestyle exploration (+10 EXP cosmetic reward), never medical prescription, disease diagnosis, or clinical dosing. All breathing exercises disclose physiological mechanisms (Harvard 4-7-8 parasympathetic activation via vagus nerve stimulation, Box Breathing sympathetic down-regulation) alongside safety notices. Herbal recipes specify educational preparation parameters (water temperature, steeping time, contraindications) with peer-reviewed PubMed citations and mandatory non-diagnostic disclaimers.

## Condition-Matched Deterministic Advisor Goals Safety Boundary — 2026-11-12 (Cycle 87)
Condition-matched deterministic habit suggestions added in `src/app/api/healthclues/wellness-advisor/route.ts` and `App/healthclues-mobile/src/services/onboarding.ts` (Gout/uric acid, weight balance, blood pressure, digestion, migraine) enforce all `personalized-wellness-plan.ts` `dangerous` and `unsupportedHighRiskQuantity` safety constraints—avoiding clinical prescriptions, fixed fluid liter/mL prescriptions, herbal/weight-loss claims, and advising joint rest during acute joint pain.

## Mobile Adaptive Onboarding Free-Text Concern & AI Habit Safety Parity — 2026-11-12 (Cycle 86)
Mobile onboarding (`src/services/onboarding.ts` & `app/(onboarding)/quiz.tsx`) routes user-selected concerns and free-text problem descriptions into the Web-aligned `adaptiveDiscovery` profile (`safetyContext` defaulted `"unknown"`, non-diagnostic safety disclosure displayed on Screen 2) and queries `/api/healthclues/wellness-advisor` (preserving server Gemini/catalog safety validation); offline fallback suggestions (`buildLocalPersonalizedGoals`) avoid clinical prescriptions, medication directives, or ungrounded fixed-liter fluid/clinical targets.

## Mobile Daily Habit Reminder Explicit Opt-in & Non-Clinical Copy Boundary — 2026-11-12 (Cycle 85)
The Mobile Reminder Settings UI (`app/(game)/profile.tsx` & `src/services/reminders.ts`) enforces strict opt-in consent (`enabled` defaults to `false`, `consentConfirmed: true` required when opted in) alongside explicit non-clinical copy ("Lumi chỉ nhắc nhẹ giờ điểm danh lối sống, hoàn toàn không thay thế tư vấn y khoa") and scheduled notification payloads prompting general healthy-habit check-ins without clinical diagnosis or medication dosing instructions.

## Binary One-Tap Quest Check Seal & Medical Lore Disclosure Alignment — 2026-11-12 (Cycle 84)
Redesigned mobile `Nhiệm Vụ` (`daily-care.tsx`) strictly enforces the canonical binary self-report model: ticked emerald-gold Check Seal (`done`) vs unticked rune socket (`not_yet`), removing redundant "Bỏ qua" penalty buttons while retaining collapsible `(i)` non-diagnostic PubMed lifestyle evidence drawers and existing proportional 1–5 star encouragement.

## Arena Metabolic Trivia & Non-Diagnostic Educational Prompts — 2026-11-12 (Cycle 83)
The Mobile RPG Habit Arena station (`world.tsx` — `boss`) presents an educational 2-choice metabolic lifestyle quiz ("Thử thách: Đồ uống có cồn ức chế bài tiết acid uric qua thận như thế nào?", highlighting competitive renal tubular excretion via lactic acid accumulation) alongside non-diagnostic metabolic and joint-comfort tips in the Research Institute and Trail stations. These interactions provide educational wellness awareness only, do not diagnose or prescribe treatment, and reward cosmetic gamification (`RewardReveal` + visual `+15 EXP` badge) without altering clinical plans or medical goals.

## Swiss Alpine Chalet Wellness Home Admin Positioning & Reward Boundary — 2026-11-08 (Cycle 39)
The Swiss Alpine Chalet and Admin CMS Studio (`/admin/healthclues-home`) govern purely cosmetic, lifestyle-affirming gamification furniture pieces (sofas, rugs, plants, lamps, pianos, wall art) intended to create a cozy, restorative personal space for players. Decorative furniture awards do not claim clinical efficacy, diagnostic capability, or disease treatment. Visual transformations (homography 4 corners, z-index depth, and scale) are calculated client-side and authenticated through Supabase RLS policies (`healthclues_wellness_home_catalog` and `healthclues_wellness_home_player_state`) with strict service-role validation, guaranteeing that cosmetic gamification remains completely isolated from medical care plans, medication tracking, and clinical safety boundaries.

## Bilingual Modal Windows, Check-in Notes & Safety Integrity — 2026-11-08 (Cycle 36)
All modal windows and interactive popovers—including Daily Reminder Settings, Companion Email Preview, Companion Add-Habit, Day Detail reflections, and Village Visitor dialogues—must strictly enforce zero cross-language leakage. Check-in reflection notes stored in `note_private` support bilingual serialization and parsing (`[Daily rating: X/5 stars]` / `[Đánh giá ngày: X/5 sao]`), ensuring non-clinical adherence reflections and star ratings maintain strict patient privacy, accurate non-diagnostic self-reporting, and consistency regardless of player locale switches.

## Bilingual Knowledge & Boss Empty State Contract — 2026-11-08 (Cycle 35)
When a user's personal journey or World does not have active reviewed clues or boss challenges, the backend API (`/api/healthclues/knowledge` and `/api/healthclues/boss`) returns both canonical language strings (`emptyReason` in English and `emptyReasonVi` in Vietnamese). Front-end panels (`KnowledgeJourneyPanel` and `BossBattlePanel`) strictly resolve copy according to the active `locale`, ensuring that Vietnamese users never receive English fallback text and English users never receive Vietnamese copy, maintaining clinical accuracy and linguistic consistency.

## Unreviewed Topic Notice & Botanical Knowledge Management — 2026-11-07
When no medically reviewed clues exist for a user's selected health topic, the system presents a strictly localized Vietnamese notice explaining that HealthClues does not substitute unrelated topics to preserve clinical veracity and patient safety. Users can bookmark researched botanical articles into their Knowledge Book and unsave them at will without modifying active habits, medications, or clinical treatment plans.

## Botanical Scientific Knowledge Library & PubMed Verification Boundary — 2026-11-07
The Botanist Garden (Vườn Thảo Mộc) operates strictly as an educational scientific reference library with peer-reviewed PubMed citations (PMIDs). It explicitly forbids any therapeutic prescription, medical diagnosis, daily dosing regimens, or equipment mechanics (No "Equip Herbal Remedy", No "Bắt đầu điều trị", No daily care tracking). The interface uses two-step progressive disclosure: the overview card provides high-level scannable scientific summaries (botanical illustration, key bioactives, studied mechanisms highlights) without dense text walls or medical cure claims; all deep scientific details (full mechanisms, study limitations, safety contraindications, and verified PubMed links) are accessed via [Đọc chi tiết]. All articles display 12 standardized scientific fields including explicit evidence level badges (`in_vitro`, `animal`, `human_observational`, `human_clinical_trial`, `systematic_review`), biological mechanisms, study limitations, safety contraindications, and mandatory educational disclaimers. Bookmarks are purely personal reading lists ("Sổ Tay Kiến Thức") and do not alter clinical or wellness care plans.

## 2-Choice Daily Habit Check-in & Proportional Rating Safety Boundary — 2026-11-04
Daily habit check-in presents active lifestyle goals with strictly 2 binary choices: "Hoàn thành" (`done`) and "Không hoàn thành" (`not_yet`). When a habit is not completed, an inline reason note can be entered by the user. Star ratings (0-5 stars) and uncompleted reasons are strictly self-reported, non-diagnostic reflections. Missing a habit or earning fewer stars is never penalized, judged, or treated as medical non-adherence or clinical failure.

## Daily Reflection Language & Non-Clinical Integrity — 2026-11-03
The Daily Check-in Dialog provides gentle, non-clinical lifestyle reflections presented entirely in the user's chosen language (English or Vietnamese). Reflection answers remain non-diagnostic and private by default; they are not used to assess symptoms or change care plans.

## Gout playbook and NPC response gates — 2026-10-30
The deterministic Gout helper differentiates acute painful/inflamed joint reports, long-term management interest and general education. It treats the Journey as self-reported, avoids suggesting exertion on an acutely painful joint, and states that lifestyle education does not replace clinician-directed care. It does not issue treatment, diagnosis or medication advice. NPC chat can retrieve only existing active reviewed catalog material for sources and is off in Owner Demo; TEST ONLY entries are not represented as reviewed evidence. Real-provider safety evaluation remains unverified.
# Knowledge Engine & Safety Specification

## Universal Post-Quiz habit retrieval (2026-10-30)

Current content status: local browser testing exercised six Gout and four Sleep templates, all explicitly TEST ONLY and not human-reviewed. Type 2 Diabetes, Migraine, Weight Management and General Wellness currently have no approved habit-template coverage. Topic registration is not evidence of clinical/editorial support. No live LLM provides suggestions.

The checklist currently uses deterministic rules; no live LLM generates candidate content or clinical claims. Shared topic configuration includes Gout, Type 2 Diabetes, Sleep/Insomnia, Migraine, Weight Management and General Wellness, but topic registration alone does not imply supported/reviewed content. Retrieval requires explicit topic mapping; safety eligibility and target validation are hard server-side gates. If content/review coverage is missing, show a coverage gap. Owner-demo habit templates remain visibly TEST ONLY / not human-reviewed and are unavailable outside that isolated mode. No botanicals, supplements or detailed therapies are introduced in Post-Quiz onboarding.

## Personalized discovery engine implementation — 2026-10-30

Ranking uses evidence/review provenance separately from topic tags and safety metadata. Missing topic tags do not imply a condition match. Unknown allergy, restrictions, medication/supplement or acute-joint context is never treated as safe; metadata requiring resolution prevents personal-practice/equipment eligibility. Acute painful Gout joint prevents movement practice eligibility. Urgent symptoms return a professional-assessment notice and no eligible personal tools. General educational reading may remain available when correctly labeled. Demo fixtures are synthetic, TEST ONLY, not human-reviewed, evidence-not-assessed and excluded outside the isolated owner demo. A report of improvement or tracking is not efficacy evidence. See the dated report for tested scope.

## Daily reflection boundary (2026-10-29)

The optional Pet check-in asks no more than two short non-clinical reflection questions in this implementation. Responses are not sent to the server or persisted unless the player explicitly adds them to the private note and saves. They must not be interpreted as a symptom measure, treatment effect, adherence record or medication instruction. Skipping has no penalty. This interaction is not an AI medical chatbot.

## 1. Mục đích và nguồn
Knowledge Engine chọn và trình bày tài nguyên có provenance, không tự sáng chế liệu pháp. Nguồn có thể gồm Botly articles/ebooks, reviewed activity catalog, authoritative research (guidelines/reviews/primary research phù hợp), admin-curated material và community-discovered knowledge gaps. Community chỉ gợi ý câu hỏi cần nghiên cứu, không phải nguồn xác nhận hiệu quả.

## 2. Kiểu tài nguyên
- **Reviewed Knowledge:** nội dung giáo dục đã có reviewer, nguồn kiểm tra, claim mapping, evidence class, safety review, version và ngày review/expiry.
- **Personal Experience:** tự khai, góc nhìn cá nhân; luôn gắn nhãn, không suy rộng nhân quả/hiệu quả.
- **Personalized Recommendation:** quyết định matching từ profile consented + template version đủ điều kiện; không phải điều trị.
- **Medical treatment information:** chỉ giáo dục tổng quát với review chặt; không tạo regimen, liều, ngừng thuốc hoặc thay bác sĩ.
- **Everyday wellness activity:** thở/nhật ký/vận động nhẹ/thói quen; vẫn cần hướng dẫn, mức độ và contraindication phù hợp.

## 3. Source provenance fields
Mỗi source: canonical URL, title/publisher/authors, source type, publication/update date, retrieved/verified date, DOI/identifier nếu có, license/use rights, locale/population, claim refs, reviewer notes, URL status, expiry. URL tồn tại không đồng nghĩa source hỗ trợ claim. Material claim phải liên kết trực tiếp tới passage/section và status `supports | partially_supports | context_only | contradicts | unverified`.

## 4. Evidence classification (proposed)
`E0` no substantiation/experience only; `E1` indirect/mechanistic or preliminary; `E2` observational/small studies; `E3` consistent controlled/review-level support for narrow claim; `E4` authoritative guideline/strong synthesis for defined context. Labels describe source strength for specific claim, not certainty or personal outcome. Reviewer can set “insufficient” and suppress. Never rank a food/herb as disease cure.

## 5. Review workflow
1. Candidate imported from Botly remains `needs_review`, not automatically HealthClues eligible.
2. Editorial reviewer checks phrasing, translation, claim inventory, source validity/rights and audience.
3. Qualified wellness/clinical reviewer checks health claims and foreseeable harm; nutrition/herbal/movement expertise as topic requires.
4. Record each claim→source, evidence class, population limits, conflicts/uncertainty, contraindications, allergies/interactions, vulnerable groups, safe use boundaries, expiry/review date.
5. Reviewer approves exact immutable content version; separate activation action can publish only after gates.
6. Material text/instructions/source changes increment version and return to review. Retraction, new safety signal or expired source immediately deactivates recommendation eligibility and queues review.
7. Audit captures individual actor ID, decision, rationale, timestamp and old/new version. Existing shared token audit identity is not adequate for expanded reviewer workflow; future design should use individual roles.

## 6. Safety filters and recommendation eligibility
Eligibility predicate requires `review_state=approved`, `status=active`, `reviewed_at` present, `expires_at` in future/approved periodic review policy, required sources for claim type, complete instructions/duration where applicable, audience/locale match, no user-declared allergy/restriction conflict, no unresolved safety hold. Missing/unknown safety info is not interpreted as safe. For high-risk/medical-claim materials require domain reviewer and stronger evidence thresholds. AI may explain approved item but cannot override eligibility.

Question-level profile fields are optional. Allergy and medication interaction data are sensitive; collect only if justified, never require medication list for basic quiz, never infer allergies. When a user reports allergy, exclude matching ingredient templates conservatively and provide edit/false-positive path. For pregnancy, chronic condition, medications, child, severe symptoms or uncertainty, avoid individualized supplement/herb advice and direct to qualified clinician/pharmacist. No emergency triage claims.

## 7. Activity and recipe content contract
Title and non-promissory summary; category; steps; verified estimated time or explicitly “not estimated”; needed equipment; effort/intensity and adaptation; contraindications/stop conditions; ingredient/allergen list; source(s); evidence class; source date; reviewer; content version. Recipes cannot imply treatment; exact ingredient amounts from source are educational culinary details, not a therapeutic dose. Activity with no safe instructions/time where needed is not activatable.

## 8. AI generation boundary
- Retrieval only from active approved catalog and allowed user’s own data; cite source labels/URLs and content version.
- No invented citations, remedies, herbs, quantities, protocols, contraindication clearance, diagnosis, prognosis or cure language.
- User asks “what cured A?” → explain anecdote cannot establish causality, show no medical endorsement, offer reviewed general information.
- AI-generated draft remains unreviewed and hidden from recommendation/public catalog until human review.
- For action creation, show exact activity/schedule and require user confirmation; never silently add or edit.
- Log minimal model/version, cited IDs, safety outcome; do not log raw sensitive prompts by default. Retention/model vendor processing remains open decision.

## 9. Example: gout and rau diếp cá
Person A may report that rau diếp cá was part of their food choices and that they felt better after 30 days. This is displayed only as A’s self-reported experience if A explicitly shares it. HealthClues must not say the herb treats gout, prescribe quantity/frequency, or recommend B copy A’s regimen. B can use the topic as a discovery cue; recommendations are independently drawn from currently reviewed knowledge, with safety review and clinician boundary for disease management. No recommendation to stop prescribed treatment.

## 10. Admin reviewer UI and acceptance
Queue shows candidate origin, prior version, claim list, source links, source check date, risk flags and required reviewer role. Decision requires reason; activation requires each required field and no unresolved safety flag. Tests: unsupported claim remains ineligible; source expiry removes from matching; reported cure claim gets hidden/reviewed; community experience never upgrades evidence class; stale AI retrieval cannot resurrect deactivated version.

## Recipe and Journey Combo review requirements
Review Recipe Combo against exact recipe item/version, ingredient component IDs/versions, preparation method/version, source provenance, allergens, instructions and safety. Ingredient change creates a new recipe version and re-review; never silently substitute.

Journey Combo needs reviewer-defined slot compatibility, eligibility for each component, explicit partial acceptance policy, combined safety assessment where relevant, evidence and rationale per component, version and expiry. User-generated sets and community combos are not reviewed and cannot auto-recommend. At runtime a stale, expired, withdrawn or incompatible component is removed or blocks under approved policy; no invented substitute.
# Approved learning/Journey rules — 2026-10-28

- Discovery Quiz trước tiên tạo context ban đầu (≤10 câu theo release decision); Knowledge Quick Quiz là hoạt động giáo dục riêng, optional và nằm trong map active. Không dùng quiz giáo dục để chẩn đoán.
- Journey context điều khiển reviewed Knowledge, daily Tip (tối đa một featured Tip/ngày theo ngày địa phương), toolkit discovery và optional Boss. Không có nội dung phù hợp đã review thì hiển thị empty/unavailable state, không tạo nội dung để lấp chỗ.
- Bốn Skill: Health Knowledge, Natural & Nutrition, Movement, Mind & Sleep; năm level: Novice, Explorer, Learner, Scholar, Master. Chỉ learning completions duy nhất/đã xác minh mới có thể đóng góp; không dựa trên triệu chứng, biomarker, cân nặng, tiêu thụ thảo dược hay lượng vận động. Đây là requirement đã duyệt, chưa phải implementation claim.
- Daily Companion: mặc định hai câu hỏi tự chọn, tối đa ba khi follow-up hữu ích; riêng tư, có Skip, không phạt ngày vắng. Hiện Daily Check-in/Journal có, companion dialogue flow chưa verified.


## 09B topic filtering evidence — 2026-10-29

The in-map HealthClues Knowledge interaction now uses the authenticated owner's saved Quiz topic for strict matching; it does not fall back to unrelated topic content. Browser-tested Gout currently returns a truthful no-reviewed-content state. This proves safe topic exclusion, not the existence of reviewed Gout lessons, a playable Knowledge Quick Quiz, mini-games, four Skill categories, five Skill levels, or a daily featured Tip. Those approved features remain incomplete/unverified. See `reports/OWNER_TWO_REGION_GAMEPLAY_ACCEPTANCE.md`.

## 09B Backpack discovery safety note — 2026-10-29

Personalized Backpack discovery is limited to active, reviewed Catalog item versions with reviewer-maintained topic tags matching the player's current saved Journey. The current item version, associated reviewed Usage Method version, evidence, safety notes, contraindications and source references are read from the server Catalog API. Missing tags/content produce an empty state; they do not authorize inference or substitution. Eligibility remains server-validated on equip. Demo status and missing reviewed data are tracked in `reports/FIRST_TIME_PLAYER_UX_ACCEPTANCE.md`.

## 09C station content boundaries

A Catalog station must keep four dimensions distinct: editorial publication/review status; scientific evidence class; suitability/safety for an individual; and the player's own save/use/equipment state. ?Editorially reviewed? does not mean proven effective. Personal topics are self-reported, not diagnoses. Only active/current reviewed records with matching topic tags are shown; descriptions, evidence summaries, safety and references come from that version. User-added methods and medication records never become Catalog content automatically. Missing supporting detail is displayed as unavailable rather than generated. Medication tracking is descriptive only and has no dosing, adherence judgment or rewards.

The implementation currently exercises truthful empty states because the isolated catalog contains no topic-matched approved rows. Human medical review and the end-to-end reviewed-content interaction remain unverified; see 09C acceptance.

## Skill progression and isolated learning games — 2026-10-29

The local owner demo now has a source implementation for four short non-clinical TEST ONLY mini-games and persisted unique game-completion records. Four Skills derive progress from unique saved Knowledge clue discoveries and unique game completions. Five displayed levels use 0/1/3/5/8 completion thresholds. The feature and migration have not yet been applied or browser-verified in the current demo because the local Docker daemon is stopped. Mini-games are not human-reviewed HealthClues education and are unavailable outside the isolated owner-demo gate. See `reports/HEALTHCLUES_FINAL_GAME_ACCEPTANCE.md`.

### 2026-10-30 owner-demo evidence update

On isolated `app-build-final-a7`, authenticated Chromium completed all four TEST ONLY activities, retried an incorrect answer without penalty, verified no duplicate reward on replay, and confirmed the four Skill counts persisted after reload. `scripts/test-healthclues-skill-levels.mjs` separately verifies Novice/Explorer/Learner/Scholar/Master at the approved 0/1/3/5/8 thresholds, including invalid/negative input handling. Browser fixtures exercised early progress only; they do not establish that a player has reached all five levels. No human-reviewed educational content or clinical claim was introduced. The old Docker-blocked note above is historical and is superseded by the 2026-10-30 evidence.


## Catalog demo fixture boundary — 2026-10-30

Local educational cards (Tomato, Potato, Cherries, Ginger, hydration, movement and wellness literacy) explicitly state TEST ONLY / NOT HUMAN-REVIEWED, use `not_assessed`, and make no condition-treatment claim. General-information links do not imply clinical efficacy or editorial approval. Demo equipment eligibility requires the isolated owner-demo server condition and private RPC. Never infer human review from `review_status='reviewed'` alone or enable these fixtures in production. Self-reports are not adherence or outcome evidence.
# Deterministic personalized discovery and safety gates — 2026-10-30

The RPG Catalog is the single candidate source. The shared rule module uses explicit Catalog metadata (`personalization_eligibility`, goal/preference tags, time and structured caution flags) and saved Quiz context. It distinguishes `eligible_for_personalized_discovery`, `educational_only`, `requires_caution`, and `insufficient_information`; none means medical clearance. Evidence class/summary and editorial review are displayed independently. Missing suitability inputs remain unknown. Acute Gout-related painful-joint context blocks movement suitability; a marked unresolved medication-context requirement blocks botanicals; explicit ingredient conflicts block the candidate. General education may remain available. TEST ONLY synthetic fixtures are loopback-demo-only, not human reviewed and carry no efficacy claim. Production-reviewed items without explicit personalization metadata do not become recommendations by inference.

## Gemini checklist selection boundary — 2026-10-31

The local Gemini adapter is a constrained selector/ranker, not a clinical content generator. Its input candidates come from the Catalog route's `active=true`, `review_status=reviewed`, current version; demo fixtures, non-eligible items, unmatched topics, items with unresolved required safety context, invalid or missing source URLs are excluded. The output schema limits results to supplied candidate IDs and allowed profile-fact references. Server validation rejects unknown/duplicate IDs, unsupported fact references and safety failures; explanations are rendered from Quiz facts by application code. The model cannot add sources, claims, targets or clinical advice. Existing habit templates remain TEST ONLY and are not eligible grounding for Gemini.

Current real-inference state is NOT VERIFIED because `D:\botly\secrets\healthclues-owner-demo.env` was absent. Local provider responses must not be described as human-reviewed output. Production privacy/legal review and approved content coverage remain required.


## Inventory presentation and provenance — 2026-10-31

My Journey hiển thị item đã equipped chứ không phải lời khuyên y khoa: herb phải xuất phát từ Botanist, practice từ Wellness Guide và mọi catalog caution/TEST ONLY status vẫn được giữ. Trạng thái equipped không chứng minh an toàn, hiệu quả, sử dụng hay kê toa. Item không đạt safety/eligibility không được thêm để lấp chỗ; empty state được ưu tiên. E2E hiện chỉ có practice fixture TEST ONLY đủ điều kiện; Botanist herb chưa đủ điều kiện, do vậy herb equip test còn PARTIAL. Local demo không tạo human review.

## Advisor source gate and language coverage — 2026-10-31

Before invoking Gemini, the server must retrieve source-validated, topic-matched, reviewed and safety-eligible candidates. An empty eligible set fails closed with SOURCE_VALIDATION_FAILED; never call the model with fake/TEST ONLY candidates, and never fill the checklist with invented knowledge. The model receives the selected locale but can only select canonical IDs from the same reviewed candidate set; evidence references and safety content remain source-authored. If approved Vietnamese rendering is unavailable, do not display English health claims as Vietnamese suggestions.

## Companion Reflection & Daily Check-in Privacy — 2026-11-04

The companion check-in dialog (`Khoảnh khắc cùng bạn đồng hành`) is fully localized in Vietnamese (`Bỏ qua trò chuyện`, `Khá tốt`, `Bình thường`, `Hơi mệt / thử thách`, `Bỏ qua câu này`). Reflections are strictly private, browser-held unless explicitly added to private notes, and never published. Unrecorded days or uncompleted goals are never treated as medical failure or lack of adherence.
# MP20 quiz-bank safety review — 2026-11-02

Question wording treats selected values as self-reported context, not a cause or diagnosis. The current Gout bank asks about food/alcohol/sweetened drinks, personal context (including kidney condition or medication question), family history, recurrent joint symptoms and an unconfirmed high-urate test. It does not prescribe water, advise changing medication, equate high urate with Gout, or recommend activity during an acute painful joint episode. New/severe joint pain or swelling is accompanied by a prompt to seek professional assessment. The current sleep bank asks about schedule, caffeine timing, screens, shifts, sleep environment and stress as experiences/habits, not diagnoses. Blood glucose questions distinguish diagnosed care, an abnormal test needing follow-up and uncertainty. For custom concerns, the fallback is neutral context only.

Authoritative basis for review: [NIAMS Gout](https://www.niams.nih.gov/health-topics/gout) describes flare triggers, family history, alcohol, sweetened drinks, diet, kidney disease and associated conditions/medicines; [NHLBI Healthy Sleep Habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) covers schedule, screens/light, caffeine and shift work; [NIDDK Type 2 Diabetes Risk Factors](https://www.niddk.nih.gov/health-information/diabetes/overview/risk-factors-type-2-diabetes) covers inactivity and prolonged sitting. These references support cautious question topics, not automated diagnosis or individualized advice. Editorial review of all localized wording remains required before public release.
