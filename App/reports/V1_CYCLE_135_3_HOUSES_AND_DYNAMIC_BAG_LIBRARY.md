# Acceptance Report — Cycle 135: 3 Real Houses Identification & Dynamic Toolkit Bag Library

**Date:** 2026-11-17  
**Scope:** 3D Village Houses Configuration, Dynamic Toolkit Storage (`toolkitStorage.ts`), House Popups (Flora, Lyra, Aura), and Dynamic Bag Management (`inventory.tsx`).  
**Status:** 100% COMPLETE & PASSING AUTOMATED TESTS ON PORT 8081 & PORT 5173.

---

## 1. Executive Summary

In response to the user's explicit directives:
1. **"Chỉ chọn nhà, không chọn các mô hình khác (ví dụ âm thanh lại đang chọn cái guồng quay)":**
   - Eliminated all functional interactions from the scenic water wheel (`bld_watermill`).
   - Mapped **Nhà Âm Thanh** to `bld_bookshop` — an authentic red-roof timber cottage located across the stone bridge beneath the autumn maple trees.
   - Preserved **Nhà Thảo Mộc** at `bld_potion_shop` (Timber apothecary) and **Thiền Đường - Hơi Thở** at `bld_great_hall` (Stately two-story hall).
2. **"Vào nhà có danh sách như thư viện, ấn lưu vào túi đồ thì mới trong túi đồ, không phải mặc định có sẵn":**
   - Transformed all 3 house popups into full educational libraries where players can preview and test sounds/breathing techniques.
   - Added `[ + Lưu Vào Túi Đồ (+10 EXP) ]` / `[ Cất vào Túi ]` buttons to cards across all 3 houses.
   - Refactored Túi Đồ (`inventory.tsx`) to start 100% empty (`[]`) by default, rendering specialized Empty States with direct CTAs back to the village.
   - Collected items in the bag display full player controls and `[ ✕ Bỏ Khỏi Túi Đồ ]` buttons.

---

## 2. Verified House Mapping in 3D Village (`word3d`)

| Ngôi Nhà | Model Instance | Vị Trí Toạ Độ | Tiên Nữ Đại Diện | Popup Modal & Chức Năng |
| :--- | :--- | :--- | :--- | :--- |
| **Nhà Thảo Mộc** | `bld_potion_shop` | `[-11.56, 1.80, 8.91]` | **Tiên Dược Liệu Flora** | `HerbalGardenModal`: Thảo mộc, công thức pha trà y khoa, đối tượng phù hợp |
| **Nhà Âm Thanh** | `bld_bookshop` | `[10.78, 1.80, -11.17]` | **Tiên Âm Thanh Lyra** | `SoundGardenModal`: Thư viện 12 âm thanh thiên nhiên & sóng não Delta 432Hz |
| **Thiền Đường - Hơi Thở** | `bld_great_hall` | `[-3.31, 1.82, 13.88]` | **Tiên Khí Tức Aura** | `ZenBreathModal`: 4 kỹ thuật thở y khoa Harvard & thôi miên thư giãn |
| *Guồng Nước* | `bld_watermill` | `[-17.61, 1.80, 1.15]` | *Không có* | Đạo cụ cảnh quan thuần túy bên suối (`hasFunction: false`) |

---

## 3. Dynamic Toolkit Bag Mechanism (`toolkitStorage.ts`)

- **Storage Keys:**
  - `hc_mobile_toolkit_sounds`
  - `hc_mobile_toolkit_breaths`
  - `hc_mobile_botanical_bookmarks`
- **Default State:** Empty array `[]`.
- **Saving / Removal:**
  - `saveSound(id)`, `removeSound(id)`
  - `saveBreath(id)`, `removeBreath(id)`
  - `saveHerb(id)`, `removeHerb(id)`
- **Event Broadcasting:**
  - `DeviceEventEmitter.emit("HEALTHCLUES_TOOLKIT_CHANGED", { type, ids })` ensures real-time reactivity across mounted tabs without page reloads.

---

## 4. Automated Verification Results (`test_verify_3_houses_and_bag_library.mjs`)

| Step | Action | Assertion | Result |
| :--- | :--- | :--- | :--- |
| **1** | Open Túi Đồ (`inventory.tsx`) with empty storage | Tab 2 & Tab 3 display empty state banners and CTAs | **PASS** |
| **2** | Enter 3D Village | Village scene loads 8 registered buildings and 30 meshes | **PASS** |
| **3** | Interact with `bld_bookshop` (Nhà Âm Thanh) | `SoundGardenModal` opens with Lyra avatar and 12 sound tracks | **PASS** |
| **4** | Click `Lưu Vào Túi Đồ (+10 EXP)` on 2 tracks | Tracks saved, +10 EXP awarded, button updates to `Đã Có Trong Túi Đồ ✓` | **PASS** |
| **5** | Interact with `bld_great_hall` (Thiền Đường) | `ZenBreathModal` opens with Aura avatar and Harvard 4-7-8 exercise | **PASS** |
| **6** | Click `Lưu Vào Túi Đồ (+10 EXP)` on Harvard 4-7-8 | Breath exercise saved, button updates to `Đã Có Trong Túi Đồ ✓` | **PASS** |
| **7** | Interact with `bld_potion_shop` (Nhà Thảo Mộc) | `HerbalGardenModal` opens with Flora avatar and herbal library | **PASS** |
| **8** | Click `Cất vào Túi` on Cúc La Mã | Herb saved to bag, button updates to `Trong Túi Đồ` | **PASS** |
| **9** | Return to Túi Đồ (`inventory.tsx`) | Tab 2 renders exactly 2 saved sounds; audio plays in mixer | **PASS** |
| **10** | Switch to Tab 3 (Hơi Thở) in Túi Đồ | Renders Harvard 4-7-8 with `BẮT ĐẦU TẬP THỞ` button | **PASS** |
| **11** | Switch to Tab 1 (Thảo Mộc) in Túi Đồ | Renders saved Cúc La Mã herb card with tea brewing guide | **PASS** |

---

## 5. Artifact Screenshots

1. [qa_inventory_tab2_empty_state.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab2_empty_state.png) — Empty sound bag state with village visit CTA.
2. [qa_inventory_tab3_empty_state.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab3_empty_state.png) — Empty breath bag state with village visit CTA.
3. [qa_modal_nha_am_thanh_library.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_nha_am_thanh_library.png) — Thư viện Nhà Âm Thanh (`bld_bookshop`) với Tiên Nữ Lyra.
4. [qa_modal_nha_am_thanh_saved_tracks.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_nha_am_thanh_saved_tracks.png) — Sound tracks saved to bag with `Đã Có Trong Túi Đồ ✓`.
5. [qa_modal_thien_duong_library.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_thien_duong_library.png) — Thư viện Thiền Đường (`bld_great_hall`) với Tiên Nữ Aura.
6. [qa_modal_thien_duong_saved_breath.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_thien_duong_saved_breath.png) — Harvard 4-7-8 breath saved to bag.
7. [qa_modal_nha_thao_moc_library.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_nha_thao_moc_library.png) — Thư viện Nhà Thảo Mộc (`bld_potion_shop`) với Tiên Nữ Flora.
8. [qa_modal_nha_thao_moc_saved_herb.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_modal_nha_thao_moc_saved_herb.png) — Cúc La Mã saved to bag.
9. [qa_inventory_tab2_with_saved_sounds.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab2_with_saved_sounds.png) — Túi Đồ Tab 2 displaying exactly the 2 saved sounds with mixer controls.
10. [qa_inventory_tab2_playing_in_bag.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab2_playing_in_bag.png) — Multi-track audio mixer active inside the player's bag.
11. [qa_inventory_tab3_with_saved_breath.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab3_with_saved_breath.png) — Túi Đồ Tab 3 displaying the saved Harvard breath exercise.
12. [qa_inventory_tab1_with_saved_herb.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_inventory_tab1_with_saved_herb.png) — Túi Đồ Tab 1 displaying the saved Cúc La Mã herb card.
13. [qa_fixed_thien_duong_buttons_scrolled.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_fixed_thien_duong_buttons_scrolled.png) — Thiền Đường với Header Tiên Nữ Aura ghim cố định ở trên, nút `[ ▶ Luyện Thở Ngay ]` to rõ không còn bị cắt lẹm, hàng nút phụ dưới thẳng hàng đẹp mắt.
14. [qa_fixed_nha_am_thanh_sticky_lyra.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_fixed_nha_am_thanh_sticky_lyra.png) — Nhà Âm Thanh với Tiên Nữ Lyra ghim cố định ở đầu, công cụ hẹn giờ và bộ lọc thẻ âm thanh rõ nét.
15. [qa_fixed_inventory_playback_with_master_bar.png](file:///C:/Users/Admin/.gemini/antigravity/brain/657e9da8-7551-4202-bc28-ecfcfda170bb/qa_fixed_inventory_playback_with_master_bar.png) — Túi Đồ khi đang phát nhạc sóng não Delta 432Hz: Thanh trượt âm lượng và nút Bỏ Khỏi Túi Đồ hoàn toàn lộ rõ, thanh Master Player nổi phía dưới bên cạnh Bé Cáo Lumi mà không đè lên bất kỳ nội dung nào.
