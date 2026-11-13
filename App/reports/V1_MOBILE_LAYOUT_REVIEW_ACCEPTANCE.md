# HealthClues Mobile Layout Review & Viewport Adaptation Acceptance

**Date:** 2026-11-05  
**Review Target:** Mobile viewports (`320×800`, `390×844`, `430×932`) across Quiz Question 2, Shared Navigation Dock, and World Preview.  
**Tested URLs:** `http://127.0.0.1:3329/play`, `http://127.0.0.1:3329/en/wellness/healthclues/quiz?from=play&step=quest`  
**Execution Runtime:** Production Next.js daemon (PID on port 3329), local Supabase (`54321`), Gemini AI (`gemini-3.8-flash`).  
**Automated Verification:**
- `scripts/verify-mobile-review-20261105.mjs` (PASS 100%)
- `scripts/test-healthclues-mp20-two-question-browser.mjs` (PASS 100%)

---

## 1. Scope & Resolved Issues

### A. Shared Mobile Navigation Dock (`HealthCluesGameShell.module.css`)
- **Prior Issue:** At 390px, the 6 items (`WORLD`, `QUEST`, `GEAR`, `LORE`, `COMM`, `PROFILE` / `THẾ GIỚI`, `NHIỆM VỤ`, `TÚI ĐỒ`, `KIẾN THỨC`, `CỘNG ĐỒNG`, `HỒ SƠ`) were squeezed into a single cramped row with tiny text (`0.49rem` / 7.8px), making Vietnamese/English labels illegible and prone to overlap.
- **Resolution:** Redesigned `.nav` on mobile (`max-width: 680px`) into a fluid horizontal-scrolling bottom dock:
  - `overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; scrollbar-width: none;`
  - `.navLink`: Comfortable pill buttons (`min-height: 2.35rem`, `padding: 0.35rem 0.75rem`, `border-radius: 9999px`, `font-size: 0.72rem` / 11.5px, `font-weight: 700`).
  - `.content`: Ensured adequate bottom padding `calc(4.6rem + env(safe-area-inset-bottom, 0px))` so the dock never obscures content or actions.

### B. Quiz Question 2 Redesign & Safety Checkbox (`HealthCluesGoalFirstDiscovery.tsx`, `HealthCluesQuiz.module.css`)
- **Top Vertical Occupancy:**
  - Compacted `.adventureRail` on mobile (`max-width: 760px`): reduced sprite size to `2.75rem × 4.1rem`, hid long decorative flavor text (`.railCopy { display: none; }`), and styled with a neat glassmorphic badge. This lifted the question card up by ~80px, making Question 2 immediately visible above the fold.
- **Breadcrumb Deduplication:**
  - Fixed duplicate label `✦ HEALTHCLUES · HEALTHCLUES REALM` to cleanly display `✦ HEALTHCLUES REALM` (or `✦ SLEEP VALLEY`).
- **Age Confirmation Opt-In Default:**
  - Initial state changed to `const [ageConfirmed, setAgeConfirmed] = useState(false)` (unchecked by default).
  - "Continue to account activation" CTA button is strictly disabled (`disabled={(screen === 1 && !hasSelection) || (screen === 2 && !ageConfirmed)}`) until the player explicitly checks the confirmation checkbox.
  - No conflict with safety specifications; strengthens opt-in compliance.
- **Sticky CTA Footer & Dynamic Button Wrapping:**
  - Back and Continue buttons docked into a sticky mobile footer tray (`sticky bottom-0 z-20 -mx-4 -mb-4 mt-6 bg-[#f4ede0]/95 backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]`).
  - Back button is compact (`shrink-0 px-3 py-2`).
  - Continue CTA button text is allowed to wrap up to 2 lines (`leading-tight max-w-[280px]`).
  - Verified across 320px, 390px, and 430px: 0 horizontal overflow, 0 clipping, and choices/safety disclaimer are fully accessible above the sticky bar.

### C. World Preview Mobile Layout (`HealthCluesWorldPreview.module.css`, `HealthCluesWorldPreview.tsx`)
- **Lumi Dialogue Collision:**
  - Positioned companion speech bubble at `bottom: 5.2rem; left: 0.65rem; max-width: min(250px, 62vw); z-index: 25;` to strictly isolate it on the bottom-left.
  - Positioned "START YOUR JOURNEY" CTA button at `bottom: 0.65rem; right: 0.65rem; z-index: 26;` on the bottom-right.
  - Zero collision between the speech bubble, map markers, and the START action button.
- **One-Click Minimize/Close & Pan/Zoom:**
  - One-click close button `(×)` on the bubble collapses it into `.companionReopen` (mini pill avatar `bottom: 5.2rem; left: 0.65rem`).
  - Map pan and zoom remain fully functional with touch gestures, and region labels remain unobstructed.

---

## 2. Quantitative Verification Metrics

| Viewport | Element / Check | Metric / Expected | Measured Actual | Result |
| :--- | :--- | :--- | :--- | :--- |
| **320×800** | Quiz Q2 Breadcrumb | No "HEALTHCLUES · HEALTHCLUES" | `✦ HEALTHCLUES REALM` | PASS |
| **320×800** | Quiz Q2 Age Checkbox | Default unchecked | `checked === false` | PASS |
| **320×800** | Quiz Q2 Continue CTA | Disabled when unchecked | `disabled === true` | PASS |
| **320×800** | Quiz Q2 CTA Widths | Back ~78px, Next ~175px | Back 78.2px, Next 175.0px | PASS (0 overflow) |
| **320×800** | World Preview Bubble | Does not overlap START | Speech bottom 643px < Start top 670px | PASS (no overlap) |
| **390×844** | Quiz Q2 CTA Widths | Back ~78px, Next ~245px | Back 78.2px, Next 245.0px | PASS (0 overflow) |
| **390×844** | Nav Dock Typography | Font size >= 11px (0.7rem) | `11.52px` (0.72rem), scrollable (591px/430px) | PASS |
| **390×844** | World Preview Bubble | Does not overlap START | Speech bottom 687px < Start top 714px | PASS (no overlap) |
| **430×932** | Quiz Q2 CTA Widths | Back ~78px, Next ~285px | Back 78.2px, Next 285.0px | PASS (0 overflow) |
| **430×932** | World Preview Bubble | Does not overlap START | Speech bottom 775px < Start top 802px | PASS (no overlap) |

---

## 3. Evidence Screenshots

1. **Before Images (User Reproduction)**:
   - `before-quiz-q2-390x844.png`: Cramped nav with tiny text, huge chapter rail pushing Question 2 down, age checkbox pre-checked, breadcrumb duplicated.
   - `before-world-preview-390x844.png`: Companion bubble covering bottom map markers and crowding START button.
2. **After Images (Automated Multi-Viewport Verification)**:
   - `quiz-q2-320x800.png`: 320px compact viewport, Question 2 sticky CTA with 2-line wrapped text, 0 overflow.
   - `quiz-q2-390x844.png`: 390px viewport with unchecked age checkbox, disabled Continue CTA, clean single breadcrumb.
   - `quiz-q2-390x844-confirmed.png`: 390px viewport after explicit age opt-in, Continue CTA enabled.
   - `quiz-q2-430x932.png`: 430px viewport showing roomy question card and accessible sticky actions.
   - `world-preview-320x800-dialogue-open.png`: 320px World Preview with compact companion bubble safe from START button.
   - `world-preview-320x800-dialogue-closed.png`: 320px World Preview with dialogue collapsed to mini reopen pill.
   - `world-preview-390x844-dialogue-open.png`: 390px World Preview showing clear map markers and unobstructed START button.
   - `world-preview-390x844-dialogue-closed.png`: 390px World Preview with dialogue collapsed.
   - `world-preview-430x932-dialogue-open.png`: 430px World Preview with open dialogue.
   - `world-preview-430x932-dialogue-closed.png`: 430px World Preview with collapsed dialogue.
