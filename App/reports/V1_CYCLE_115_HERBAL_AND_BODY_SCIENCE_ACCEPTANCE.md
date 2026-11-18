# HealthClues Acceptance Report — Cycle 115: Personalized Herbal Garden & Body Science Library Connected to Quiz Data

**Date:** 2026-11-16  
**Status:** 100% IMPLEMENTED, VERIFIED & PASS  
**Test Harness:** Playwright Core on Port 8081 (Mobile Web Dist) & Port 3329 (Detective Backend)

---

## 1. Problem Statement & Audit Findings
Following strict user scrutiny ("đừng dễ tính, hãy khó tính hơn đi"):
1. **Unpersonalized Herbal Station:** Previously, tapping `bld_potion_shop` opened a generic 2-line placeholder about Chamomile, ignoring all onboarding quiz answers (Sleep vs Weight/Gout vs Stress vs Digestion).
2. **Missing Body Science Library:** Tapping `bld_bookshop` mistakenly launched `setShowDetectiveGame(true)` directly, hijacking the role of the Detective Office (`bld_watermill`) and offering no physiological educational content.
3. **Mismatched Building Routing:** In `world.tsx`, building clicks were cross-wired (`bld_great_hall` opened movement trail instead of 3D Home; `bld_watermill` opened breathing instead of detective).
4. **Lack of Daily Retention Loops:** Neither building offered a daily interactive ritual to encourage returning players.
5. **UI Button Collision:** Mascot helper bubble on `world.tsx` overlapped the Tour dialog.

---

## 2. Implemented Solutions

### A. Authentic Building Interaction Disentanglement (`world.tsx`)
| Building Instance | Landmark ID | Assigned Role | Target Action |
| :--- | :--- | :--- | :--- |
| `bld_potion_shop` | `herbal_garden` | Nhà Thảo Mộc | Opens `HerbalGardenModal` |
| `bld_bookshop` | `knowledge_library` | Nhà Cơ Thể (Thư Viện) | Opens `BodyScienceLibraryModal` |
| `bld_watermill` | `cloud_therapy` | Văn Phòng Giải Mã | Opens `DetectiveWebViewModal` |
| `bld_great_hall` | `journey_house` | Ngôi Nhà Của Bạn | Navigates to `/(game)/home` |
| `bld_plaza_well` | `village_square` | Quảng Trường & Giếng Làng | Opens Daily Check-in / Well Wish |

### B. Personalized Herbal Garden (`HerbalGardenModal.tsx` & `herbalData.ts`)
- Automatically reads `healthclues-starter-profile` (`quest`, `topic`, `twoWeekGoal`, `concernNote`).
- Dynamic banner quoting the user's specific 2-week goal.
- Tailored recommendations:
  * **Sleep / Insomnia:** Cúc La Mã (German Chamomile) & Lạc Tiên Tây (Passionflower) targeting GABA-A receptors and slow-wave sleep N3.
  * **Weight / Gout / Uric Acid:** Tía Tô Tươi (Perilla) & Bụp Giấm (Hibiscus) targeting Xanthine Oxidase inhibition and urinary uric acid clearance.
  * **Stress:** Passionflower, Perilla & Chamomile for HPA axis regulation.
- Evidence-based scientific deep-dive: Bioactive compounds, biological mechanisms, PubMed PMIDs with clickable links, practical tea brewing parameters, and clinical safety cautions.
- **Daily Retention Mechanic:** "Nghi Thức Pha Trà Thảo Mộc Hằng Ngày" awarding **+15 EXP** with date-based cooldown and toast feedback.

### C. Dedicated Body Science Library (`BodyScienceLibraryModal.tsx` & `bodyScienceData.ts`)
- Deep physiological modules:
  * Sleep: Homeostatic Adenosine sleep pressure, Circadian SCN Melatonin rhythm, Slow-wave sleep N3 Glymphatic brain waste clearance.
  * Stress: HPA axis Cortisol spikes, Vagus nerve activation via 4-7-8 breathing.
  * Metabolism: Insulin sensitivity & glucose curves, Purine metabolism.
- **Daily Retention Mechanic:** "Câu Đố Manh Mối Sinh Học Hôm Nay" awarding **+20 EXP** and unlocking a **Manh Mối Sinh Học** with a direct CTA to use the clue in the Detective Office.

### D. Zero-Overlap Visual Polish
- `PermanentMascotHelper` listens to `CINEMATIC_TOUR_VISIBILITY` and hides completely while Tour or fullscreen dialogs are active.

---

## 3. Automated Test Evidence Snapshots

All snapshots captured via Playwright automation:
- `audit_01_herbal_garden_sleep.png`: Herbal Garden with Sleep profile, personalized goal banner, Cúc La Mã & Lạc Tiên Tây recommendations.
- `audit_02_tea_brewed.png`: Daily Tea Brewing completion with +15 EXP feedback.
- `audit_03_herbal_expanded_evidence.png`: Expanded compounds, mechanisms, and PubMed references.
- `audit_04_body_science_sleep.png`: Body Science Library with physiological chapters tailored to sleep.
- `audit_05_body_science_quiz_solved.png`: Daily Biology Clue Quiz section.
- `audit_06_herbal_garden_weight.png`: Dynamic adaptation to Weight & Gout profile, recommending Tía Tô & Bụp Giấm.
- `audit_07_detective_opened_from_watermill.png`: Watermill click successfully opening the Detective Office casefiles.

---

## 4. Verification Check
- TypeScript compilation: `npx tsc --noEmit` $\rightarrow$ **0 errors**.
- Web export: `npx expo export -p web` $\rightarrow$ **Clean build to dist-web**.
- End-to-end automated run: **100% PASS**.
