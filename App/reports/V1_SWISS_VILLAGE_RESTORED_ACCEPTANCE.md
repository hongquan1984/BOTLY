# HealthClues Mobile — Swiss Village Clean Interface Restoration Acceptance

**Date:** 2026-11-14  
**Scope:** Revert to stable baseline interface ("Quay lại giao diện cũ") on local Expo React Native Web (port 8081).  
**Result:** 100% PASS (0 page errors, 0 console errors, verified via Playwright & AI Vision across Portrait, Overview, and Desktop Landscape).

---

## 1. Summary of Actions
- Discarded experimental AI image replacements, distorted compositions, and inpainting cutouts that introduced blur smudges.
- Restored pristine original Swiss Alpine village background (`swiss-village-mobile-diorama-v1.png`, 1672×941) featuring the central stone fountain, turquoise lake vista, chalets, and cobblestone square.
- Restored standard Chibi character sprites (`chibi-anna`, `chibi-leo`, `chibi-mia`, `chibi-ben`, `chibi-lily`) with proportional 44px scaling and grounded oval shadows.
- Restored walkable plaza bounds (`snapSwissVillageGround`) to `x: 340-1320, y: 480-840`.
- Preserved the approved 0% black void Onboarding Survey fix (`quiz.tsx`) and Mầm Nhỏ interactive mascot dialogue.
- Re-exported React Native Web bundle (`npx expo export --platform web`) and updated `dist-web`.

---

## 2. Verification Evidence
1. **Mobile Portrait View (`390×844`):**
   - File: `restored_world_portrait.png`
   - Verification: Central fountain, turquoise lake, and church rendered cleanly; Chibi characters Bạn, Anna, Leo, Mia, Luna pet positioned with grounded shadows; TopHud pills and Mầm Nhỏ button intact; 0 console errors.
2. **Mobile Overview Tactical Map (`390×844`):**
   - File: `restored_world_overview.png`
   - Verification: Live tactical map with 7 numbered pins and non-overlapping bottom legend cards; toggles smoothly to and from close view.
3. **Desktop Landscape View (`1024×600`):**
   - File: `restored_world_desktop.png`
   - Verification: Wide panoramic vista of the village with unobstructed cobblestone plaza, chalets, and fountain.
