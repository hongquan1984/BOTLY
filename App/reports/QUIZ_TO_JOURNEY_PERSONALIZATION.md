# Quiz to Journey Personalization

Ngày: 2026-10-28 — **PARTIAL/BLOCKED**.

- `/play` mở Welcome; Quest picker giới hạn Sleep Valley/HealthClues Realm; quiz onboarding lấy tối đa 10 ID từ question bank (`HealthCluesQuiz.tsx`). Browser xác nhận 10 câu với Sleep.
- Câu hỏi hiện dùng C04 để chọn topic và `createDiscoveryProfile` giữ `profile.topic` cùng các sở thích/safety flags. Health branch trong JSON có câu về gout và uric acid; chưa có browser journey test chứng minh câu này luôn nằm trong giới hạn ban đầu cho Health.
- `WellnessWorldGame.enterWorld()` gửi `topicKey: questId`; API lưu giá trị này thành `healthclues_branches.topic_key`. Do đó Sleep/Gout không được biểu diễn thành Journey Context riêng, và API Knowledge chọn Clues theo topic key này. Gout-specific relevance không thể được khẳng định.
- Pending journey được bảo vệ qua encrypted HttpOnly cookie trong 07B implementation, nhưng demo current preview loại mọi Supabase env và chỉ là guest. Email verification thực tế chưa kiểm thử.
- Không có account-bound schema/API để lưu map, self-identified concern, consented context, active Journey/loadout reference và topic-specific progression thành một nguồn chuẩn. Không thêm bảng dư thừa trước khi đối chiếu schema/consent.

Kết quả: Sleep teaser/Reveal/World Preview browser flow PASS; persisted Sleep/Gout Journey, concern continuity, account-bound activation và switching BLOCKED.

