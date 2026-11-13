# NPC Dialogue Clearance & Mystery Gift Modal Dismissal Audit — 2026-11-07

## 1. Issue Analysis: NPC Dialogue Obscured Under Bottom Dock
- **Observed Behavior**: In user viewport (desktop aspect 1024×581), the companion speech bubble (`.hc-rpg-lumi-dialogue`) was partially clipped or obscured by the centered bottom navigation dock (`.hc-rpg-bottom-dock`).
- **Root Causes**:
  1. On live production (`www.botly.vn`), the dialogue had legacy `z-index: 28` while `.hc-rpg-bottom-dock` had `z-index: 30`, causing the dock to render in front of the dialogue.
  2. The vertical clearance was previously set to `bottom: calc(6.5rem)` (104px), leaving only a fragile 10px buffer above the 94px dock. Any minor viewport height reduction (e.g. 581px height) or text wrap reduced clearance to negative or near-zero.

### Resolution
1. **Dominant Z-Index Elevation**:
   - Elevated `.hc-rpg-lumi-dialogue` and `.hc-rpg-lumi-reopen-btn` to `z-index: 50` across all breakpoints.
   - Guaranteed: The dialogue will ALWAYS render on top of the dock (`z-index: 50 > 30`), never underneath.
2. **Generous Vertical Elevation**:
   - Desktop (default): `bottom: calc(7.8rem + env(safe-area-inset-bottom, 0px))` (+31px clearance above dock).
   - Tablet (<=1024px): `bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px))` (+26px clearance).
   - Mobile (<=768px): `bottom: calc(6.8rem + env(safe-area-inset-bottom, 0px))` (+48px clearance).
   - Short windows / laptops (`@media (max-height: 640px)`):
     * Bottom dock anchored to `bottom: calc(0.35rem)` with streamlined padding.
     * Dialogue anchored to `bottom: calc(5.4rem)` with `max-width: min(360px, 42vw)`.
     * Measured clearance on 1024×581: **+24px** (> 0px, zero collision).

### Real Chromium CDP Verification (7 Viewports)
All 7 tested viewports passed with 0 collisions and positive vertical clearance:
- `1024x581` (User screenshot aspect): Clearance = **+24px**, Collision = **false**, zIndex = **50**
- `1280x800` (Standard Desktop): Clearance = **+31px**, Collision = **false**, zIndex = **50**
- `1366x768` (Standard Laptop): Clearance = **+31px**, Collision = **false**, zIndex = **50**
- `1024x768` (Compact Desktop): Clearance = **+26px**, Collision = **false**, zIndex = **50**
- `900x600` (Small Window): Clearance = **+24px**, Collision = **false**, zIndex = **50**
- `1280x550` (Short Window): Clearance = **+24px**, Collision = **false**, zIndex = **50**
- `1024x500` (Very Short Window): Clearance = **+24px**, Collision = **false**, zIndex = **50**

---

## 2. Issue Analysis: Mystery Gift Modal Unclosable by Click
- **Observed Behavior**: In `MysteryGiftModal`, clicking the close button `(X)` or `"Đã hiểu"` secondary button did not dismiss the modal; the modal remained permanently open on screen.
- **Root Cause**:
  1. `<MysteryGiftModal>` is rendered inside `<div className="hc-rpg-hud-layer" data-rpg-hud>` in `HealthCluesRpgWorldHud.tsx`.
  2. `.hc-rpg-hud-layer` has CSS property `pointer-events: none;` to allow canvas mouse interactions underneath the HUD overlay.
  3. `pointer-events` in CSS is inherited by default by child elements unless explicitly overridden with `pointer-events: auto;`.
  4. Neither `.hc-mystery-modal-backdrop`, `.hc-mystery-modal-card`, `.hc-mystery-close-btn`, nor `.hc-mystery-secondary-btn` had `pointer-events: auto;` declared.
  5. As a result, all real user mouse and touch clicks passed straight through the buttons without triggering their React `onClick` event handlers.
  6. Synthetic programmatic JS calls (such as `element.click()`) bypass CSS pointer-events hit-testing, which explains why unit tests passed while real human browser interaction failed.

### Resolution
1. **Explicit CSS Pointer-Events Activation**:
   - Added `pointer-events: auto;` to:
     * `.hc-mystery-modal-backdrop`
     * `.hc-mystery-modal-card`
     * `.hc-mystery-close-btn`
     * `.hc-mystery-primary-btn`
     * `.hc-mystery-secondary-btn`
     * `.hc-mystery-claim-btn`
     * `.hc-mystery-replay-btn`
     * `.hc-mystery-box-container`
2. **Defensive Inline JSX Fallbacks**:
   - Added `style={{ pointerEvents: "auto" }}` directly onto the backdrop container, modal card, close button, and secondary action button in `MysteryGiftModal.tsx`.
   - Added `e.stopPropagation()` on all click dismiss handlers to prevent unwanted event bubbling up to parent HUD elements.

### Real Chromium CDP Mouse Click Verification
Verified via `node scripts/test-mystery-click.mjs` using `Input.dispatchMouseEvent` (true browser input simulation):
1. **Pointer-Events Computed Styles**:
   - `backdropPE: 'auto'`
   - `cardPE: 'auto'`
   - `closeBtnPE: 'auto'`
   - `secBtnPE: 'auto'`
   - `primBtnPE: 'auto'`
2. **Close Button `(X)` Test**:
   - Click dispatched to `(834, 169.09)`.
   - Result: `Modal still open? false` (**PASS**).
3. **Secondary Button `"Đã hiểu"` Test**:
   - Reopened modal, click dispatched to `(780.37, 529.48)`.
   - Result: `Modal still open? false` (**PASS**).
4. **Backdrop Click Test**:
   - Reopened modal, click dispatched to `(10, 10)` outside modal card.
   - Result: `Modal still open? false` (**PASS**).

- **Artifact Screenshots**:
  - `verified-mystery-modal-open-pointerevents-auto.png`
  - `verified-mystery-modal-closed-by-x.png`
  - `verified-mystery-modal-closed-by-secondary.png`
