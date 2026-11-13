# Cycle 21 Acceptance Report: World Preview Modal Google 1-Click + Email Auth, Zero Auto-Bouncing on /play, & Seamless World Onboarding

**Date**: 2026-11-06  
**Environment**: Production (`https://www.botly.vn`), Vercel Deployment `dpl_7U2o4ebR93NoRs7ApMwC7Jt4L93z`  
**Status**: 100% PASSED & VERIFIED LIVE

---

## 1. User Problem Statement
User feedback on `https://www.botly.vn`:
1. *"vào play thì nó vào thẳng bản đồ"* (Visiting `/play` bypassed the Welcome landing screen and forced the user into the preview map).
2. *"vào bắt đầu hành trình thì nó lại bắt điền Email, ko thấy nút aut hoặc điền email đâu cả"* (On the World Preview map, clicking "BẮT ĐẦU HÀNH TRÌNH" opened a modal with ONLY an email input and checkbox, lacking Google Auth and quick sign-in).

---

## 2. Root Cause Analysis
1. In `HealthCluesPlayEntry.tsx`, `hasResumableQuizDraft` included `"world_preview"` in `resumableView`. When a guest previously finished the quiz, `sessionStorage` kept `draft.view === "world_preview"`, causing `/play` to automatically replace URL to `/vi/wellness/healthclues/quiz?from=play`.
2. In `HealthCluesWorldPreview.tsx`, the modal `activationOpen` only rendered an email form with an unchecked consent checkbox and lacked any Google OAuth button.
3. In `WorldAuthCallback.tsx` and `WellnessWorldGame.tsx`, pending journey matching required `localPending.email === user.email`. For Google 1-Click login, `email` is unknown prior to OAuth redirect and needed dynamic email linking upon auth return.

---

## 3. Implemented Changes
1. **Google 1-Click Auth in World Preview Modal (`HealthCluesWorldPreview.tsx`)**:
   - Added prominent **[ Tiếp tục với Google (1 chạm vào game) ]** button with Google 4-color SVG.
   - Saves pending journey payload (`questId`, `profile`, `wellnessPlan`) into `localStorage` (`healthclues-pending-journey-local`) and triggers `signInWithOAuth("google", locale, "/play?activation=complete")`.
   - Added divider `─── Hoặc tiếp tục bằng email ───`.
   - Defaulted consent to `true` (`useState(true)`).
   - Added top status bar `[ Đăng nhập ]` button on the World Preview map.
2. **Prevented `/play` Auto-Redirect for Guests (`HealthCluesPlayEntry.tsx`)**:
   - Removed `"world_preview"` from `resumableView` in `hasResumableQuizDraft`.
   - Direct visits to `/play` now always show the HealthClues Welcome landing hero with `[ Đăng nhập ]` button unless authenticated.
3. **Seamless Google OAuth Onboarding (`WorldAuthCallback.tsx`, `WellnessWorldGame.tsx`, `HealthCluesPlayEntry.tsx`)**:
   - Handled empty-email pending journey matching from Google OAuth, associating `user.email` dynamically and persisting it to `localStorage`.

---

## 4. Live Verification Evidence on www.botly.vn
Ran `scripts/verify-live-world-preview-google-auth.mjs` against production `https://www.botly.vn`:
- **Step 1**: `/play` landing screen loads with top `[Đăng nhập]` button. Clicking opens modal with Google and Email. Screenshot: `verified-live-play-landing-modal.png`.
- **Step 2**: Advances through Quest selection (`HealthClues Realm`).
- **Step 3**: Screen 1 selects "Vấn đề khác" -> types "stress" -> smart intent parser routes to stress focus.
- **Step 4**: Screen 2 verifies 13yo checkbox is completely absent.
- **Step 5**: Plan Builder loads with tailored stress-relief habits -> advances to World Preview Map.
- **Step 6**: World Preview Map displays `[Đăng nhập]` in top status bar and `[BẮT ĐẦU HÀNH TRÌNH]` at bottom right.
- **Step 7**: Clicking `[BẮT ĐẦU HÀNH TRÌNH]` opens modal:
  * Google 1-Click button: enabled, has SVG logo, text: *"Tiếp tục với Google (1 chạm vào game)"*.
  * Email form: input ready, consent checked by default, submit button: *"Gửi liên kết đăng nhập qua Email"*.
  * Screenshot: `verified-live-world-preview-google-auth-modal.png`.
- **Result**: **100% PASSED**.
