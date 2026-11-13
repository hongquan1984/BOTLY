# Acceptance Report: RPG World HUD Redesign & AI Botanical Advisor

**Date:** 2026-11-05  
**Status:** PASS — REBUILT, E2E VERIFIED VIA CHROME CDP & LIVE ON PORT 3329

---

## 1. Overview & Objectives

Addressed two user requests:
1. Recreate the complete RPG UI from reference image (`media_1793844909012_080a8bd8.jpg`):
   - **Top Experience Bar HUD**: Adventurer avatar circle with golden decorative ring, level & title (`Cấp 2 · Nhà Thám Hiểm Sức Khỏe (?)`), glowing golden progress bar (`57 / 250 EXP`), and next reward pill (`🏮 Phần thưởng Cấp 3 / Đèn lồng Ánh Sao / Trang trí thế giới của bạn >`). Right action buttons: Bell with red notification dot, Mail, Language dropdown (`VI ⌵`), and Profile button.
   - **Two Floating Right Panels**:
     - *Card 1: Nhiệm Care / Nhiệm vụ hôm nay*: Calendar icon, completion badge (`2/3 đã hoàn thành`), 3 habits with icons (Drink water 1.5–2L `✓ +10 EXP`, Healthy meal `✓ +10 EXP`, Gentle walk 10 min `⭕ +10 EXP` clickable).
     - *Card 2: Hành trình 7 ngày*: 7-day track (`N1`–`N7` with `N1..N3` checked, `☀️N4` golden radiant sun today, `N5..N7` locked), and Day 7 milestone chest preview (`Phần thưởng ngày 7: Huy hiệu Người Kiên Trì + tháo khóa thử thách đặc biệt cùng Lumi >`).
   - **Center Scene Celebration**: Adventurer cheering with `✨ +20 EXP ✨` floating sunburst badge.
   - **Bottom-Left Lumi Speech Bubble**: Cute Lumi avatar head, green name tag `Lumi`, speech text: *"Tuyệt vời! Bạn đã hoàn thành nhiệm vụ hôm nay! +20 EXP! Chúng ta chỉ còn 193 EXP nữa để lên Cấp 3 và nhận Đèn lồng Ánh Sao nhé! ✨"*.
   - **Bottom Navigation Dock**: 6 stylized RPG buttons (`Thế Giới`, `Daily Care`, `Hành Trình của Tôi`, `Hành Trang`, `Kiến Thức`, `Cài Đặt`).
   - **World Landmark Pills**: Floating rounded 2-line RPG badges (`📖 Knowledge / Hall Kho Tri Thức`, `🍃 Wellness Guide / Cẩm Nang Sống Khỏe`, `🌱 Botanist / Nhà Thảo Mộc`).
2. Implement AI Botanical Advisor for user's specific health condition (`media_1793844484687_d9e6458c.jpg`):
   - Replaced empty state box (`data-botanist-empty`) with AI-driven, evidence-based herbal recommendations.
   - Tailored to condition (e.g. Gout / uric acid clearance, Sleep, General Wellness).

---

## 2. Key Implementations

- **`src/app/api/healthclues/botanical-advisor/route.ts`**:
  - GET and POST endpoints generating condition-specific botanical herbs using Gemini AI (`@google/genai`) with rich evidence-based fallback knowledge base.
  - Returns structured herbal entities with Latin binomials, precise biological mechanisms, safe preparation instructions, evidence classes, and contraindications.
- **`src/features/healthclues/HealthCluesRpgWorldHud.tsx`**:
  - Implements the complete topbar, right panels, center celebration badge, Lumi dialogue bubble, and bottom navigation dock.
- **`src/features/healthclues/RegionMapScene.tsx`**:
  - Landmark pills upgraded to 2-line floating badges.
  - Landmark pill clicks trigger instant travel and open station modals (`beginLandmarkTravel(id); onLandmark(id);`).
- **`src/features/healthclues/WorldAdventureScene.tsx` & `world-adventure.css`**:
  - Connected `HealthCluesRpgWorldHud` to world state.
  - Added `.hc-game-root.has-rpg-hud` CSS rules suppressing legacy overlapping HUD items (`.hc-region-hud`, `.hc-region-companion`, `.hc-rpg-help`, `.hc-game-currency`).

---

## 3. Verification Artifacts & Close/Minimize Interactive Evidence

Addressed user request: *"có các mịc hiện lên mà đan gko tắt đi được là sao"*:
- Added explicit `(×)` close buttons to Card 1, Card 2, Center EXP Burst, and Lumi Speech Bubble.
- Added discreet minimized pills (`📋 Nhiệm Care (2/3)`, `📅 Hành trình (3/7 ngày)`) and a cute circular mini Lumi avatar with a green pulse ring that restore panels on click.
- Added topbar Eye button (`<Eye />` / `<EyeOff />`) to toggle all floating panels on/off at once for panoramic scenery viewing.
- Verified suppression of peeking legacy HUD text (`hasLegacyHud: false, hasLegacyCompanion: false, hasLegacyHelp: false`).

1. `verified-rpg-hud-reference.png`: Full open HUD matching reference design with close `(×)` buttons visible.
2. `verified-rpg-closed-cards.png`: All cards, burst, and speech bubble closed, demonstrating discreet minimized pills and mini Lumi avatar.
3. `verified-rpg-reexpanded.png`: Re-expanding Card 1 and Lumi dialogue on pill click.
4. `verified-rpg-clean-scenery.png`: Panoramic Eye toggle activated (0 floating panels obstructing world).
5. `verified-botanist-ai-garden.png`: Botanist Garden modal displaying 4 AI-recommended herbs with 0 empty boxes.
6. `verified-e2e-rpg-desktop.png`: 1280px desktop My Journey view with 0 overflow.
7. `verified-e2e-rpg-tablet.png`: 768px tablet viewport with 0 overflow.
8. `verified-e2e-rpg-mobile.png`: 390px mobile viewport with 0 overflow.
