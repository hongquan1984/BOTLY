# Cycle 20 Acceptance Report: Streamlined Quiz-to-Game Handoff, 13yo Checkbox Removal, Smart Stress Intent Mapping & Production Auth Verification

**Date**: 2026-11-06  
**Environment**: Production Vercel (`https://www.botly.vn`) & Supabase (`rswmadukvegraxfcdbcb.supabase.co`)  
**Status**: 100% VERIFIED LIVE ON PRODUCTION

---

## 1. Verified Key Outcomes

### A. Direct Sign-In on `/play` Landing Page
- **Evidence**: `verified-live-play-landing.png`, `verified-live-play-auth-modal.png`
- Top-right `[Đăng nhập / Sign in]` button and secondary link below `Start Journey`.
- Clicking opens Auth Modal with:
  1. **Google 1-Click**: `signInWithOAuth("google", locale, "/play")` -> HTTP 302 directly to Google Accounts with Client ID `560822841654-v9vbrn2fogq6175h8irvhal571bd63km.apps.googleusercontent.com`.
  2. **Email Magic Link**: Enter email -> dispatches magic link from `noreply@botly.vn` with instant confirmation.

### B. 13-Year-Old Checkbox Elimination
- **Evidence**: `verified-live-quiz-screen2-no-13yo.png`
- Removed mandatory checkbox `[ ] Tôi xác nhận mình từ 13 tuổi trở lên` from Quiz Screen 2.
- `Tiếp tục kích hoạt tài khoản` button is immediately active (dark emerald) without requiring any checkbox click.

### C. Smart Intent Mapping for "Vấn đề khác"
- **Evidence**: `verified-live-quiz-screen1-stress.png`, `verified-live-plan-builder-tailored.png`
- When user selects "Vấn đề khác" and types "stress" / "căng thẳng":
  * System maps `canonicalFocus = "stress"`.
  * Plan proposals load 4 tailored stress-relief habits:
    1. **Thở sâu 4-7-8 giải tỏa căng thẳng** (+20 EXP)
    2. **Đi dạo giải tỏa căng thẳng** (+20 EXP)
    3. **Khoảng lặng không màn hình** (+20 EXP)
    4. **Thưởng thức tách trà ấm an yên** (+20 EXP)
  * Eliminates generic hydration/vegetables defaults.

### D. Zero-Loss Email Handoff & Loop Elimination
- When user enters email in World Preview:
  * Profile and confirmed goals are saved to `localStorage` (`healthclues-pending-journey-local`) and encrypted cookie.
  * Quiz drafts (`healthclues-quiz-draft-v1`) are purged.
- When clicking email link:
  * `WorldAuthCallback` saves session token to `localStorage` (`botly-cloud-session`).
  * Direct navigation to `/wellness/healthclues/world?onboarding=backpack&quest=...`.
  * User lands directly in game world; NEVER redirected back to Quiz.
