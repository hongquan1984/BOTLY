# Pet, Toolkit and Knowledge Acceptance

Ngày: 2026-10-28 — **PARTIAL**.

- Overworld/Welcome dùng một adventurer pose sprite tổng quát (`HealthCluesAdventurer.tsx`, `public/healthclues/assets/characters/adventurer-poses.webp`). Không tìm thấy Luna owl/Lumi firefly sprite asset hoặc shared Pet Engine. Tên companion trên vùng là nhãn UI hiện có.
- `ToolkitCollection.tsx` và API collection/toolkit/world đã tồn tại; schema hiện có `journey_id` trên entries, nhưng UI/game onboarding chưa chứng minh saved loadout switching theo Journey. Reviewed-content/eligibility gates giữ nguyên.
- `KnowledgeJourneyPanel.tsx` và `/api/healthclues/knowledge` hỗ trợ reviewed Clues, discovery, quiz answers, idempotency/XP. API lấy topic key đầu tiên từ branch. Topic branch hiện region-scoped, không concern-scoped; empty reviewed content phải được giữ nguyên, không seed content yên lặng.
- `BossBattlePanel.tsx`, `/api/healthclues/boss`, reward ledger/world unlocks hiện có. Chưa kiểm tra boss theo từng playable region/personalized concern.
- Daily Check-in và Private Journal hiện có; Daily Companion chỉ là check-in UI, chưa xác minh giới hạn 2–3 câu hội thoại optional.
- Skills (4 danh mục / 5 cấp), learning mini-games trong region map, Gout-relevant reviewed knowledge và Pet-led map navigation chưa được implement/xác minh trong milestone này.

