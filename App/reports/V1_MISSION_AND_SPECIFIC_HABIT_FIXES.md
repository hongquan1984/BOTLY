# Evidence Report: Mission Context Mismatch Fix & Concrete Habit Action Titles

## 2026-11-05 regression follow-up — signed action title compatibility

The concrete-title change made `toAiPlanGoal` store the selected action as `title`, while signed Advisor proof verification still required the model's umbrella title. This could reject an otherwise valid selected generated goal at persistence. Proof verification now accepts only either the signed localized model title (legacy records) or the signed localized selected action (current records); `trackingDefinition`, selected option, goal identity, profile digest, signature and other checks remain enforced.

- Added a contract assertion for the historical title alongside the existing current action-title proof assertion.
- A stale Gout context source assertion that looked for removed `data-discovery-concern` markup now checks the actual Pet guidance binding, `<strong>{displayFocus}</strong>`.
- Automated scope: personalized-plan contract PASS (40+ assertions); Wellness Plan safety PASS (42 assertions); adaptive discovery PASS (13 assertions); discovery/time-label PASS (37 assertions); Gout context regression PASS (synthetic offline only). Isolated Next.js 16.3 production build PASS (TypeScript and 82 static pages complete). Focused ESLint did not finish and was stopped, so lint is NOT VERIFIED. Docs guard PASS; full evidence is in `CURRENT_STATE.md`.
- Current-source MP20 browser UI PASS on isolated `http://127.0.0.1:3330/play`: Gout, Weight and Sleep discovery paths, zero adaptive/Gemini/API requests, screenshots captured to `.tmp/mp20-two-question-final-20261105-run5`. This is UI-only; activation/account/Plan persistence are outside this suite. An older MP17 authenticated harness timed out on obsolete component selectors and did not make an account or Plan write; it must be adapted before persistence acceptance.
- **Artifact correction:** the first MP20 test invocation still used legacy output paths and replaced `reports/previews/mp20-two-question-concern-desktop.png` before its stale selector failed. The file now contains a current-source capture; the original untracked image was not recoverable. The harness now writes all later captures to an isolated `.tmp` root.
- No Gemini request, local account write, migration, production access or deployment occurred. Browser UI evidence here does not prove the new signed-title proof has been exercised through authenticated Plan persistence; previous Nov 4 browser evidence applies to the earlier build and does not verify this proof fix.

- **Date**: 2026-11-04
- **Environment**: Local Demo on Port 3329 (`http://127.0.0.1:3329`)
- **Verified Account**: `hongquan0508@gmail.com`

---

## 1. Issues Addressed
1. **Red Context Mismatch Error in Mission Panel (`[📜 NHIỆM VỤ]`)**:
   - Error: *"Mối quan tâm trong Quiz đã lưu không khớp với Thế giới này. Chưa tạo gợi ý nào. Mã tham chiếu hỗ trợ: 4d26ab9e-..."*.
   - Root Cause: Visiting Sleep Valley (`questId="sleep-better"`) when user's Quiz focus was nutrition/digestion caused `discoveryContextMatchesWorld` to fail and block Gemini recommendations.
   - Resolution: Dynamically resolved `effectiveQuestId` based on user's profile topic, ensuring Gemini recommendations and plan viewing proceed seamlessly without errors.
2. **Generic Umbrella Headings on Habit Cards & "Đang theo dõi"**:
   - Problem: Displayed vague titles (*"Tạm dừng giữa các miếng ăn"*, *"Đi dạo ngắn sau bữa ăn"*) instead of the concrete action chosen by the player (e.g. 20 minutes duration or specific walking time).
   - Resolution: Prioritized `copy.trackingDefinition` and `goal.originalNote` across `getDisplayGoalTitle` and initialized `toAiPlanGoal` with `specificAction`.
   - Results: Cards now display:
     - *"Đặt đũa hoặc thìa xuống giữa các lần nhai trong bữa chính để nhai kỹ và kéo dài bữa ăn lên khoảng 20 phút"*
     - *"Đi bộ thong thả từ 5 đến 10 phút sau bữa ăn chính trong ngày"*
3. **Timeline Day Stars Display**:
   - Problem: Nodes only showed a green checkmark circle without prominent stars.
   - Resolution: Restyled `.hc-day-node-stars` into a prominent high-contrast badge (`background: rgba(8, 28, 19, 0.92); border: 1px solid rgba(255, 216, 104, 0.45)`) positioned cleanly on top of completed day nodes with gold glowing stars `★★★★★` or proportional ratings.
4. **Daily Check-in 2-Choice Structure**:
   - Form: Only 2 binary states per habit: "Hoàn thành" vs "Chưa hoàn thành" (+ lý do).
   - Stars rating: Proportional calculation (5 stars when all goals completed; reduced when goals missed).

---

## 2. Browser Verification Artifacts
- `verified-active-goals-specific-habits.png`
- `verified-mission-panel-no-mismatch.png`
- `verified-2choice-checkin-with-reason.png`
- `verified-day-node-stars-proportional.png`
