# Acceptance Report — Cycle 23: Fresh User Onboarding & Returning User Session Direct Entry Verification

## Executive Summary
- **Target**: Rigorously test two fundamental end-user lifecycles on the live production website `https://www.botly.vn`:
  1. Fresh User (new email): Quiz completion, stress intent mapping, zero age-checkbox friction, magic link auth, automatic world creation, zero loss of quiz progress.
  2. Returning User (cookie/session persisted): Direct entry ("vào thẳng") from `/play` or `/vi/wellness/healthclues/world` without repetitive login prompts or email requests, preserving level, EXP, and 7-day streak.
- **Execution**: Two specialized subagents (`new_user_tester` and `returning_user_tester`) independently executed automated live tests with headless Chromium and captured screenshots.
- **Status**: PASSED 100% on live production `https://www.botly.vn`.

---

## 1. Agent 1: Fresh User Onboarding & Activation (`new_user_tester`)
- **Test User**: `fresh-user-1793977997325@example.invalid`
- **Execution Summary**:
  1. Started at `https://www.botly.vn/play` -> clicked "Bắt đầu hành trình".
  2. Answered Question 1 with focus "Căng thẳng" (`stress`).
  3. Answered Question 2 with factors; confirmed no blocking 13yo checkbox.
  4. Plan Builder generated 3 stress-tailored goals (+20 EXP each).
  5. World Preview modal accepted new email; saved pending journey into local storage.
  6. Authenticated via Supabase Auth API; navigated callback URL.
  7. Supabase automatically persisted profile and created World `68c183b0-2d66-40de-a775-b86595cf542f`.
  8. Frontend rendered World Game Scene with Lumi companion and quiz focus without prompting to retake quiz.
- **Evidence Artifacts**:
  - `verified-live-fresh-user-onboarding.png`
  - `verified-live-fresh-user-world.png`

---

## 2. Agent 2: Returning User & Session Persistence (`returning_user_tester`)
- **Test User**: `hongquan0508@gmail.com` (Existing World `6677e8b9-...`)
- **Execution Summary**:
  1. Case 1 (`/play`): Navigating to `/play` detected session and existing world, automatically executing `router.replace` to `/vi/wellness/healthclues/world?quest=health-concern`. Zero login modal shown.
  2. Case 2 (`/vi/wellness/healthclues/world`): Directly loading the World URL opened the interactive RPG map immediately with HUD ("Cấp 1 · Nhà Khám Phá Sức Khỏe", 10/50 EXP), 3/3 daily care items complete, 7-day streak active, and Lumi companion.
  3. Case 3 (Browser Restart): Chromium instance closed and reopened with saved user profile; directly opened World without re-authentication.
- **Evidence Artifacts**:
  - `verified-live-returning-play-redirect.png`
  - `verified-live-returning-direct-world.png`
  - `verified-live-returning-reopened-browser.png`
