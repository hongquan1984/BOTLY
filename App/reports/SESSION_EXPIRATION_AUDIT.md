# HealthClues Session Expiration & Auto-Redirect Recovery Audit

**Date:** 2026-11-07  
**Scope:** Client session expiration handling, automatic redirect to sign-in screen, elimination of stuck intro loading state on World game page.  
**Tested Viewports:** 1280×800 Desktop (Chromium CDP), 390×844 Mobile Viewport.  
**Production Target:** `https://www.botly.vn` / `/play?signin=1&expired=1`

---

## 1. Problem Definition & Root Cause Analysis

### User Defect Reported
- When a user's session expires or an invalid JWT token is stored, navigating to or refreshing `/vi/wellness/healthclues/world` resulted in:
  1. A pink/red warning banner: `"Your sign-in session is invalid or expired."`
  2. The World page remained stuck on the initial intro loading state: `"✨ Đang mở Cõi Sống Khỏe của bạn..."` with companion Lumi image.
  3. A non-functional call-to-action button: `[Vào ngay Cõi Sống Khỏe ->]`, which clicked to re-fetch the world and repeatedly failed with 401 Unauthorized.
  4. The user was stranded with no sign-in or recovery path.

### Root Cause
1. `WellnessWorldGame.tsx` caught 401/403 errors from `/api/healthclues/world` and populated `pageError: "Your sign-in session is invalid or expired."`.
2. However, because `session` was still held in React memory/state while `worldData.world` was null, the component fell through into the fallback template:
   ```tsx
   {!loading && (
     <section>
       <h2>✨ Đang mở Cõi Sống Khỏe của bạn...</h2>
       <button onClick={() => loadWorld()}>Vào ngay Cõi Sống Khỏe -></button>
     </section>
   )}
   ```
3. Stale session tokens in `localStorage` (`botly-cloud-session`) were never cleared upon 401, causing repeated authorization failures.
4. There was no automatic redirect hook routing expired players back to the sign-in modal on `/play`.

---

## 2. Architecture & Implementation Resolution

### A. Centralized Session Lifecycle in `src/lib/wellness-cloud.ts`
1. Added helper `isCloudSessionExpired(session)`:
   - Compares current Unix timestamp against `session.expires_at` with a 30-second leeway buffer.
2. Added `refreshCloudSession()`:
   - Makes a refresh request to GoTrue endpoint `/auth/v1/token?grant_type=refresh_token`.
   - If refreshed successfully, updates `botly-cloud-session` in `localStorage`.
   - If refresh fails, cleans storage via `clearCloudSession()`.
3. Added `handleSessionExpired(locale)`:
   - Clears stale `botly-cloud-session` and cached profile data.
   - Redirects cleanly using `window.location.replace("/play?signin=1&expired=1")`.

### B. Sign-In Modal Auto-Open in `src/components/healthclues/HealthCluesWelcome.tsx`
1. Added `useEffect` listening to query parameters on `/play`:
   - Checks if `signin=1` or `auth=signin`: automatically triggers `setSignInOpen(true)` on mount.
   - Checks if `expired=1`: sets `isExpiredSession(true)`.
2. Added visual alert banner inside the Sign-In modal:
   - An amber notification pill: `"Phiên đăng nhập trước đã hết hạn. Vui lòng đăng nhập lại để tiếp tục hành trình."` (or EN: `"Your previous session has expired. Please sign in again to continue your journey."`).
   - Retains Google 1-Click (`Tiếp tục với Google`) and Email magic link options with zero friction.

### C. Direct Fallback UI & Clean Redirect in `src/features/healthclues/WellnessWorldGame.tsx`
1. Added `sessionExpired` state.
2. In `authorizedFetch`, on HTTP 401 or 403, immediately calls `refreshCloudSession()`. If refresh fails, invokes `handleSessionExpired(locale)` and marks `setSessionExpired(true)`.
3. In `loadWorld`, if 401 occurs or error indicates expired session, automatically triggers `handleSessionExpired(locale)`.
4. Replaced the stuck intro template with an explicit expired screen fallback:
   - Displays a clean lock icon 🔒 with notification: `"Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ."`
   - Primary action button: `[Đăng nhập lại ngay ->]` directly pointing to `/play?signin=1&expired=1`.
   - Completely eliminates `"✨ Đang mở Cõi Sống Khỏe của bạn..."` when unauthenticated.

---

## 3. Automated Browser Verification (CDP Test Suite)

- **Test Script**: `scripts/test-session-expired-redirect.mjs`
- **Execution Evidence**:
  ```
  === STEP 1: Restarting local server on port 3329 ===
  === STEP 2: Navigating to World page with EXPIRED session ===
  Current URL after expired session detection: http://127.0.0.1:3329/play?signin=1&expired=1
  MODAL CHECK AUDIT: {
    hasModal: true,
    hasGoogle: true,
    hasEmail: true,
    hasExpiredAlert: true,
    hasStuckWorldText: false
  }
  Saved screenshot: C:\Users\Admin\.gemini\antigravity\brain\abff8161-8d04-4588-8fd8-ca4619ccaf85\verified-expired-session-redirect-to-login.png

  🎉 EXPIRED SESSION REDIRECT TO LOGIN SCREEN TEST 100% PASSED!
  ```
- **Visual Artifact Verified**: `verified-expired-session-redirect-to-login.png`
  - URL: `/play?signin=1&expired=1`
  - Sign-in modal opened automatically.
  - Warning banner visible: `"Phiên đăng nhập trước đã hết hạn. Vui lòng đăng nhập lại để tiếp tục hành trình."`
  - Google 1-Click button present and active.
  - Email sign-in input field present and active.
  - Stuck `"Đang mở Cõi Sống Khỏe"` text completely eliminated.

---

## 4. Acceptance Criteria Checklist

| ID | Requirement | Result | Evidence |
|---|---|---|---|
| AC-EXP-01 | Automatic expired session detection via token & 401 API response | PASS | `isCloudSessionExpired`, `authorizedFetch` refresh fallback |
| AC-EXP-02 | Clear expired credentials from localStorage | PASS | `clearCloudSession()` removes `botly-cloud-session` |
| AC-EXP-03 | Clean redirect to `/play?signin=1&expired=1` | PASS | Verified in real Chromium CDP navigation |
| AC-EXP-04 | Sign-in modal opens automatically on arrival | PASS | `hasModal: true` |
| AC-EXP-05 | Prominent warning banner explaining session expiration | PASS | `hasExpiredAlert: true` |
| AC-EXP-06 | Dual login options available (Google 1-Click + Email) | PASS | `hasGoogle: true, hasEmail: true` |
| AC-EXP-07 | Stuck "Đang mở Cõi Sống Khỏe" UI completely absent | PASS | `hasStuckWorldText: false` |
