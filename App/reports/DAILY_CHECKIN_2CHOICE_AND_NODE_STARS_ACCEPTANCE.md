# HealthClues Acceptance Report: 2-Choice Daily Check-in & Proportional Day Node Stars

**Date**: 2026-11-04  
**Status**: ACCEPTED & BROWSER-VERIFIED VIA CDP ON PORT 3329  
**Affected Files**:
- `src/features/healthclues/DailyCheckinDialog.tsx`
- `src/features/healthclues/WellnessWorldGame.tsx`
- `src/features/healthclues/WorldAdventureScene.tsx`
- `src/features/healthclues/world-adventure.css`
- `src/app/api/healthclues/world/route.ts`
- `src/lib/healthclues-i18n.ts`
- `scripts/launch-owner-journey.mjs`

---

## 1. Problem Statement & User Request

The user requested an immediate simplification and enhancement of the daily habit recording experience:
> *"phần này chỉ có 2 cái thôi, 1 là hoàn thành, 2 là ko hoàn thành, + note lý do , ngoài ra nếu hôm nào hoàn thiện hết thì 5 sao nhỏ ở trên ít thì giảm đi theo tỷ lệ sao, ko phải cái gì cũng haonf thành hết"*

Attached images:
1. Modal survey ("A moment with your companion" / "Welcome back. This is optional... Pretty good / A mixed day..."): User pointed out that multi-step surveys and 5 confusing tool statuses ("Tried/Used", "Not Yet", "Skipped", "Don't Remember", "Not Suitable") cause cognitive friction and obscure the primary task of recording habits.
2. 30-Day Monthly Journey Map trail: User circled Day `01`, `02`, `03` where all recorded nodes unconditionally displayed identical green checkmark badges `✔`. In reality, users do not complete 100% of their habits every single day ("ko phải cái gì cũng hoàn thành hết").

---

## 2. Redesign Implementation

### 2.1 2-Choice Daily Check-in Dialog (`DailyCheckinDialog.tsx`)
1. **Removed All Extraneous Steps**:
   - Removed companion mood survey steps (`step 0`, `step 1`), prompts ("How did today feel?"), and intermediate reflection save dialogues.
   - User immediately sees today's active habits upon opening the dialog.
2. **Strictly 2 Binary Choices per Habit**:
   - `[✓ Hoàn thành]` (`status: "done"`)
   - `[✕ Không hoàn thành]` (`status: "not_yet"`)
   - Removed "Skipped", "Don't Remember", and "Not Suitable".
3. **Inline Uncompleted Reason Note (`+ note lý do`)**:
   - When `[✕ Không hoàn thành]` is selected on any habit, an inline input appears:
     `+ Lý do chưa hoàn thành: [Nhập lý do (ví dụ: bận việc, mệt mỏi, quên...)]`
   - User's reasons are compiled and saved into the private note.
4. **Live 5-Star Preview Banner**:
   - Displays 5 star icons (`★ ★ ★ ★ ★`), score badge (e.g. `4/5 sao`), and completion progress:
     `4 / 5 mục tiêu hoàn thành · 1 không hoàn thành`.
   - When all goals are completed (`done === total`): `🎉 Hoàn thiện hết (5 sao nhỏ)`.
   - Proportional formula: `calculateStars(done, total) = done === total ? 5 : Math.min(4, Math.max(1, Math.round((done / total) * 5)))`.

### 2.2 Proportional 5 Stars on Monthly Journey Map (`WorldAdventureScene.tsx` & `world-adventure.css`)
1. **5 Small Stars on Top of Completed Nodes (`.hc-day-node-stars`)**:
   - Positioned cleanly above each completed day node on the winding golden road.
   - If that day completed 100% of habits:
     - 5 golden filled stars (`★★★★★`) + checkmark badge `✔`.
   - If that day completed fewer habits (e.g. 3 of 5):
     - 3 golden filled stars + 2 subtle empty stars (`★★★☆☆`).
     - No misleading 100% checkmark badge.
2. **Interactive Day Popover Feedback**:
   - Clicking a day node opens its detail card showing:
     - Localized date header + status badge (`3/5 sao`).
     - 5-star row with score caption.
     - Specific uncompleted reasons from that day's check-in:
       `Lý do chưa hoàn thành: • Vận động nhẹ sau khi ăn: Bận việc gia đình, về nhà muộn`.
     - Personal journal comment (e.g. `"Hôm nay khá mệt"`).
3. **Data Retrieval & Persistence**:
   - `/api/healthclues/world` selects `note_private` from `healthclues_daily_checkins`.
   - `parseCheckinStars(checkin, usageHistory)` reads `[Đánh giá ngày: X/5 sao]` and reasons from `note_private` or derives from `healthclues_daily_usage_records`.

---

## 3. Visual Evidence & Screenshots

All screenshots were captured live via automated Chrome DevTools CDP against `http://127.0.0.1:3329/play-demo.html`:
1. `verified-day-node-stars-desktop.png`: Desktop Journey Map showing Day 01 with 5 stars (`★★★★★`) + `✔`, Day 02 with 3 stars (`★★★☆☆`) and no checkmark, and Day 04 glowing as today.
2. `verified-day02-popover-stars-reasons.png`: Clicking Day 02 displays the popover with `★★★☆☆ 3/5 sao`, and the reason `• Vận động nhẹ sau khi ăn: Bận việc gia đình, về nhà muộn`.
3. `verified-checkin-with-reason-input.png`: Checkin modal with 4 Completed and 1 Not Completed habit showing `4/5 sao`, inline reason input, and typed reason.
4. `verified-2choice-checkin-modal.png`: Checkin modal with 5 habits showing the 2 binary buttons `[✓ Hoàn thành]` and `[✕ Không hoàn thành]`.
5. `verified-day-node-stars-mobile.png`: Mobile 390x844 responsive Journey Map showing small stars on top of day nodes.
6. `verified-2choice-checkin-mobile.png`: Mobile 390x844 responsive 2-choice checkin modal with live 3/5 stars card and reason input.

---

## 4. Verification Check

- TypeScript: zero errors across all 82 Turbopack routes.
- Backend API `/api/healthclues/world/checkin` and `/api/healthclues/world` verified with `note_private`.
- UI/UX completely in Vietnamese and responsive across Desktop and Mobile viewports.
