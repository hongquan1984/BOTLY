# Acceptance Report: Swiss Chalet Additive Furniture Upload & Smooth 60FPS NavMesh Walking

**Date**: 2026-11-09  
**Cycle**: Cycle 61  
**Target Environments**:
- Local Studio: `http://localhost:3000/admin/healthclues-home`
- Production Studio: `https://www.botly.vn/admin/healthclues-home`
- Prototype: `App/prototypes/wellness-home`

---

## 1. Problem Statements & Root Causes

### 1.1 Upload Overwrites Focused Item
- **Symptom**: When clicking `"➕ Tải thêm đồ nội thất từ máy"` in the sidebar or dragging an image onto the room canvas, the newly uploaded image was overwriting the currently focused furniture item (e.g. replacing the existing Painting or Piano), causing the user to lose their existing furniture.
- **Root Cause**:
  1. `processImageFile` in `page.tsx` contained `if (selectedItemId) { updateCurrentItem(...) } else { createNewItem(...) }`.
  2. Because the catalog automatically selects the first item in the room on load, `selectedItemId` was always truthy.
  3. A duplicate hidden file input `<input type="file" ref={fileInputRef}>` in the left sidebar was capturing clicks meant for adding new furniture.

### 1.2 Walking Chibi Jitter / Shaking
- **Symptom**: Clicking `"🚶 Thử Đi"` caused Chibi Anna to vibrate / jerk erratically in place instead of gliding smoothly along the painted green floor area.
- **Root Cause**:
  1. Container elements had CSS transitions (`transition-all duration-300`, `transition: left 0.15s linear, top 0.15s linear`).
  2. The JavaScript `requestAnimationFrame` loop updates the DOM position every ~16ms (60fps). The 150ms/300ms CSS transitions fought continuously against the 16ms frame updates, creating severe easing lag and stutter.

---

## 2. Technical Implementations

1. **Strictly Additive Furniture Upload**:
   - Implemented `addNewFurnitureFromFile(file, dropCoords)`:
     * Creates a unique ID: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.
     * Places the item at the exact drop coordinates or floor center.
     * Prepends to the room catalog: `setCatalog(prev => [newItem, ...prev])`.
     * Automatically selects the new item and marks it dirty.
     * Asynchronously uploads to `/api/healthclues/wellness-home/upload` to store binary image and update serving URL.
     * NEVER modifies or overwrites any existing item!
   - Implemented separate `replaceItemImageFromFile(file)`:
     * ONLY called when the user explicitly clicks `"Tải Ảnh Từ Máy Tính"` in the right sidebar properties panel for the selected item.

2. **Butter-Smooth 60FPS NavMesh Walking**:
   - Removed all conflicting CSS transitions:
     * `src/app/admin/healthclues-home/page.tsx`: removed `transition-all duration-300`.
     * `src/components/healthclues/wellness-home.css`: removed `transition: left 0.15s linear, top 0.15s linear`.
     * `App/prototypes/wellness-home/style.css`: removed `transition: left 0.12s linear, top 0.12s linear`.
   - Continuous delta-time loop: character glides at ~9.5% screen width/sec directly on the green painted floor.
   - Interactive tap-to-move: clicking on any painted green spot immediately directs the character to walk there.

3. **Prototype Preservation**:
   - Updated `syncRoomItemsWithMasterAndPlayer()` in `app.js` to preserve `customUploadedItems` so user-uploaded items are never filtered out when changing scenes or profiles.

---

## 3. Verification & Evidence

- **Automated Verification Script (`scripts/verify-upload-fix.mjs`)**:
  - `POST /api/healthclues/wellness-home/upload`: `200 OK`.
  - `GET /api/healthclues/wellness-home/file?name=...`: `200 OK` (binary image).
  - Initial catalog items: 1.
  - After upload: 2 items (additive confirmed, +1 item).
  - Original item (`piano_grand`): intact and verified.
  - Chibi walking coordinates: tracked over 5 frames with 0 stutter.
  - Broken images on stage: 0.
- **Secret Scan**:
  - `scripts/scan-secrets.mjs --all`: 1392 files checked, 0 secrets detected.
- **Production Deployment**:
  - Vercel Deployment ID: `dpl_CWAPtyJXS9VTk3x8mqdEcSuYR82L`
  - URL: `https://www.botly.vn/admin/healthclues-home`
