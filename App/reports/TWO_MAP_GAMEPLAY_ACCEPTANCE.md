# Two Map Gameplay Acceptance

Ngày: 2026-10-28 — **PARTIAL**.

| Yêu cầu | Bằng chứng | Trạng thái |
|---|---|---|
| Overworld còn đủ 8 vùng/ID | `src/features/healthclues/world-map.tsx` + ảnh `previews/healthclues-fullscreen-world-preview-desktop.png` | PASS |
| Chỉ Sleep Valley và HealthClues Realm mở | `src/features/healthclues/region-availability.ts`; browser verifier báo 2 open, 6 Coming Soon | PASS |
| Sáu vùng khóa không thể tạo Journey qua API | API route và sáu regression cases trong scripts/run-healthclues-game-e2e.mjs | PASS, full isolated E2E cuối cùng đã chạy thành công |
| Detailed Sleep Valley / HealthClues Realm renderer | Chỉ có Overworld art `public/healthclues/assets/world/healthclues-world-overworld.webp` | BLOCKED |
| Landmarks/region camera, Pet, return-to-overworld | Không có region map engine/assets trong source hiện tại | BLOCKED |
| Health Quiz goal → saved Journey topic | Current POST saves `topicKey` as region ID; no canonical goal/Journey schema | BLOCKED |

Không tạo map art giả hoặc thay map approved. Các thao tác chỉ xác nhận được là global map preview và khóa sáu lựa chọn.


## E2E final result addendum — 2026-10-28

Final isolated game E2E: **PASS**. It first exposed two assertions left over from the former multi-region flow; they now test Sleep-specific reviewed fixtures and ensure Nutrition Garden stays disabled. The passing run reached the end of the existing suite and verified cleanup. See owner acceptance for the scope limitations.
