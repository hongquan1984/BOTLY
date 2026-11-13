# HealthClues Check-in EXP Fireworks Acceptance Report

**Date**: 2026-11-10  
**Status**: PASSED (100%)  
**Feature**: Real-time Firework Particle Effects & Energy Aura on Experience Bar upon Daily Check-in Save

---

## 1. Scope & Implementation

- **Interactive Canvas Particle System**:
  - `src/features/healthclues/ExpFireworksEffect.tsx`: HTML5 Canvas (700x320px) bắn liên tiếp 6 đợt pháo hoa tên lửa nhiều màu sắc (Gold, Emerald, Sunset, Celestial, Rainbow) nổ tung thành 40–65 tia hạt sao với trọng lực, ma sát, vệt khói và nhấp nháy.
- **Visual Feedback on EXP Bar**:
  - `.hc-rpg-exp-capsule.is-exp-celebrating`: Hào quang năng lượng vàng kim (`box-shadow: 0 0 35px rgba(245, 158, 11, 0.95), 0 0 70px rgba(16, 185, 129, 0.75)`), viền vàng sáng `#fde047`, phóng to nhẹ `scale(1.05)`.
  - `.hc-rpg-bar-fill`: Vệt sáng năng lượng chạy quét qua thanh tiến trình (`hcExpBarSheen`).
  - `.hc-exp-float-badge`: Huy hiệu nổi 3D `+10 EXP ✨` bay lên từ thanh kinh nghiệm và tan biến nhẹ nhàng.
- **Trigger Points**:
  - Khi lưu Điểm Danh (`submitCheckin` trong `WellnessWorldGame.tsx`).
  - Khi prop `xp` tăng trong `HealthCluesRpgWorldHud.tsx`.
  - Custom Event `healthclues:exp-fireworks`.
  - Nhấn vào icon trợ giúp kinh nghiệm hoặc hàm `window.__triggerHealthCluesExpFireworks()`.

---

## 2. Browser CDP Test Evidence

| Test Step | Description | Result | Artifact Screenshot |
|---|---|---|---|
| **1. Check-in Save & First Burst** | Nhấn "Lưu ghi nhận", modal đóng lại và chùm pháo hoa vàng kim bùng nổ trên thanh kinh nghiệm | **PASS** | `fireworks-verified/01_exp_fireworks_exploding.png` |
| **2. Staggered Bursts & Energy Aura** | Đợt pháo hoa thứ hai ngũ sắc tỏa rộng cùng hào quang bao quanh capsule, EXP tăng từ 10 lên 20 | **PASS** | `fireworks-verified/02_exp_badge_floating.png` |
| **3. Fireworks Close-up & Progression** | Cận cảnh chùm pháo hoa bắn từ hai bên tháp chuông và thanh kinh nghiệm | **PASS** | `fireworks-verified/03_exp_fireworks_closeup.png` |
