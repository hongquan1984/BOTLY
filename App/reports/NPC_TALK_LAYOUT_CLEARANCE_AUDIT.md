# NPC Talk Layout & Responsive Clearance Verification Audit

**Audit Date**: 2026-11-07  
**Platform**: HealthClues Web & Mobile Viewports  
**Tested On**: Real Chromium CDP (port 3329)  
**Status**: 100% PASSED & VERIFIED  

---

## 1. Problem Statement & User Bug Reports

The user provided photographic evidence identifying three layout defects in the NPC interaction card (`.hc-rpg-talk`):
1. **Mobile Text Obstruction**: The circular Lumi companion reopen button (`.hc-rpg-lumi-reopen-btn`) was floating at `left: 0.75rem; bottom: calc(6.2rem)` with `z-index: 50`, landing directly on top of the dialogue text inside the `.hc-rpg-talk` card (covering "...ng bạn đến đường mòn. Hãy khám...").
2. **Mobile Action Button Sizing**: The action button `[TRÒ CHUYỆN]` was rendered with full-width uppercase block formatting, consuming over 40% of the entire card width and overwhelming the card copy.
3. **Desktop Dock Collision**: On desktop viewports (1280×800 and short laptop 1024×581), `.hc-rpg-talk` was anchored at `bottom: 1rem` behind the bottom navigation dock (`.hc-rpg-bottom-dock` at `bottom: 1.25rem`), completely smothered with only tiny letters peeking out from underneath the dock.

---

## 2. Root Cause Analysis

1. **Layer Mutual Exclusivity Gap**: Both Lumi's companion UI (`.hc-rpg-lumi-reopen-btn`) and the Landmark/NPC interaction prompt (`.hc-rpg-talk`) were active simultaneously without CSS mutual exclusivity suppression. When a player approached an NPC landmark, the persistent Lumi helper remained rendered at the same screen coordinates.
2. **Desktop Stacking and Clearance Deficit**: `.hc-rpg-talk` used `bottom: 1rem` and `isolation: isolate` with `z-index: 18`, whereas `.hc-rpg-bottom-dock` resided in the global HUD layer at `z-index: 30` with `bottom: 1.25rem`. The dock physically occluded the talk card.
3. **Lack of Compact Pill Hierarchy**: The talk button lacked dedicated sizing classes, falling back to generic primary button styles with uppercase typography and excessive padding.

---

## 3. Engineering Implementation

### A. Code Changes in `src/features/healthclues/RegionMapScene.tsx`
- Imported `MessageCircle` from `lucide-react`.
- Added body class management:
  ```tsx
  useEffect(() => {
    if (activeLandmark) {
      document.body.classList.add("hc-has-active-talk");
    } else {
      document.body.classList.remove("hc-has-active-talk");
    }
    return () => {
      document.body.classList.remove("hc-has-active-talk");
    };
  }, [activeLandmark]);
  ```
- Added integrated avatar thumbnail `.hc-rpg-talk-avatar` as a first flex child in `.hc-rpg-talk`, ensuring portrait images live inside the document flow and cannot float over text.
- Replaced uppercase button with sleek pill button:
  ```tsx
  <button
    type="button"
    className="hc-rpg-talk-action-btn"
    onClick={() => handleStationInteract(activeLandmark)}
  >
    <MessageCircle size={14} className="shrink-0" />
    <span>{text("Talk")}</span>
  </button>
  ```

### B. Styling Changes in `src/features/healthclues/world-adventure.css`
- **Desktop Base Elevation**:
  ```css
  .hc-rpg-talk {
    position: absolute;
    bottom: calc(7.2rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: 55;
    background: rgba(255, 248, 230, 0.96);
    border: 1.5px solid #d4a742;
    border-radius: 1.25rem;
    box-shadow: 0 14px 34px rgba(26, 47, 35, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    backdrop-filter: blur(8px);
  }
  ```
- **1024px Laptop Intermediate Viewport Rule**:
  ```css
  @media (max-width: 1200px) and (min-width: 681px) {
    .hc-rpg-talk {
      left: calc(50% - 60px);
      width: min(28rem, calc(100vw - 340px));
    }
  }
  ```
- **Mobile Responsive Anchoring**:
  ```css
  @media (max-width: 680px) {
    .hc-rpg-talk {
      left: 0.65rem;
      right: 0.65rem;
      bottom: calc(6.0rem + env(safe-area-inset-bottom, 0px));
      width: auto;
      transform: none;
      padding: 0.55rem 0.75rem;
    }
  }
  ```
- **Mutual Exclusivity Suppression Rule**:
  ```css
  body.hc-has-active-talk .hc-rpg-lumi-dialogue,
  body.hc-has-active-talk .hc-rpg-lumi-reopen-btn,
  .has-rpg-hud:has(.hc-rpg-talk) .hc-rpg-lumi-dialogue,
  .has-rpg-hud:has(.hc-rpg-talk) .hc-rpg-lumi-reopen-btn {
    opacity: 0 !important;
    pointer-events: none !important;
    transform: scale(0.85) !important;
    transition: opacity 0.18s ease, transform 0.18s ease !important;
  }
  ```
- **Pill Action Button**:
  ```css
  .hc-rpg-talk-action-btn,
  .hc-rpg-talk > button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.65rem;
    min-height: 30px;
    font-size: 0.74rem;
    font-weight: 700;
    border-radius: 9999px;
    text-transform: none;
    letter-spacing: normal;
  }
  ```

---

## 4. Quantitative Automated Test Results (Chromium CDP)

| Viewport | Test Parameter | Expected | Measured Result | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop 1280×800** | Talk Card Visibility | `true` | `true` | **PASS** |
| | Collision with Bottom Dock | `false` | `false` | **PASS** |
| | Vertical Clearance Above Dock | `> 10px` | `+21.17px` | **PASS** |
| | Talk Card Bounding Rect | — | `top: 518px, bottom: 590px` | **PASS** |
| | Dock Bounding Rect | — | `top: 611px, bottom: 685px` | **PASS** |
| | Integrated NPC Avatar | `true` | `true` | **PASS** |
| | Action Button Height | `≤ 40px` | `34px` | **PASS** |
| | Action Button Text | `'Trò chuyện'` | `'Trò chuyện'` | **PASS** |
| **Short Laptop 1024×581** | Collision with Bottom Dock | `false` | `false` | **PASS** |
| | Vertical Clearance Above Dock | `> 5px` | `+14.47px` | **PASS** |
| | Talk Card Bounding Rect | — | `top: 443px, bottom: 504px` | **PASS** |
| | Dock Bounding Rect | — | `top: 519px, bottom: 575px` | **PASS** |
| **Mobile 390×844** | Talk Card Visibility | `true` | `true` | **PASS** |
| | Collision with Bottom Dock | `false` | `false` | **PASS** |
| | Vertical Clearance Above Dock | `> 10px` | `+17.31px` | **PASS** |
| | Talk Card Bounding Rect | — | `top: 670px, bottom: 748px` | **PASS** |
| | Dock Bounding Rect | — | `top: 765px, bottom: 832px` | **PASS** |
| | Lumi Reopen Button Opacity | `'0'` | `'0'` | **PASS** |
| | Lumi Button Pointer Events | `'none'` | `'none'` | **PASS** |
| | Action Button Height | `≤ 36px` | `30px` | **PASS** |
| | Action Button Width | Compact | `105.45px` | **PASS** |

---

## 5. Artifact Evidence

- Desktop 1280×800 Screenshot: `verified-desktop-npc-talk-above-dock.png`
- Short Laptop 1024×581 Screenshot: `verified-short-desktop-npc-talk-above-dock.png`
- Mobile 390×844 Screenshot: `verified-mobile-npc-talk-compact-no-overlap.png`
