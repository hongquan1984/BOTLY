# HealthClues Agent Task Board (Live Dashboard)

> Bảng theo dõi tiến độ thời gian thực giữa Lead Agent và các Chuyên viên Subagent.
> Cập nhật tự động: Mỗi khi Agent nhận việc, đang code hoặc test xong.

---

## 📌 Trạng thái hiện tại (Overview)

| Tổng số Task | Cần làm (To Do) | Đang thực hiện (In Progress) | Đang kiểm thử (Testing) | Đã hoàn thành (Done) |
| :---: | :---: | :---: | :---: | :---: |
| **18** | 0 | 0 | 0 | 18 |

---

## 📋 Danh sách công việc chi tiết

| ID | Tính năng / Hạng mục | Người phụ trách | Phạm vi file | Trạng thái | Tiến độ | Ghi chú & Kế hoạch kiểm thử |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **TASK-01** | Kiểm tra hiện trạng & Chạy Test Regression V1 | **`qa`** | `scripts/test-*.mjs` | 🟢 DONE | 100% | Cổng 3329 & 54324 ONLINE. Toàn bộ test regression PASS |
| **TASK-02** | Sửa lỗi bilingual context mismatch (Sleep & Gout EN/VI) | **`quiz`** | `src/features/healthclues/onboarding-context.ts` | 🟢 DONE | 100% | Đã sửa `discoveryContextMatchesWorld`, test 100% PASS |
| **TASK-03** | Khảo sát UI/UX End-User & Kiểm thử toàn diện Web + Mobile | **`qa`** | `scripts/test-*.mjs`, Chromium CDP | 🟢 DONE | 100% | WCAG AAA touch targets, 320/390/430px pass, Luna vs Lumi pass, Điểm: 9.5/10 |
| **TASK-04** | Cookie Chunking 7KB & Giải quyết lỗi 413 Onboarding | **`quiz`** | `src/app/api/healthclues/pending-journey/route.ts` | 🟢 DONE (VERIFIED) | 100% | Phân mảnh Cookie (hc-pending-journey, hc-pending-journey-1, max 7KB) & Deflate Raw PASS 100% |
| **TASK-05** | Refactor HUD Nhiệm Care & Menu Mobile 3 nút | **`daily`** | `HealthCluesRpgWorldHud.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Bottom Dock chuẩn [Bản đồ - Hành Trình - Hôm nay], không va chạm nút tím/Lumi; font thanh mảnh. |
| **TASK-06** | Checklist Ghi nhận hôm nay & Quản lý Thói quen Hành trình | **`daily`** | `DailyCheckinDialog.tsx`, `WorldAdventureScene.tsx` | 🟢 DONE (VERIFIED) | 100% | Check-in tối giản: gỡ hộp 0/5 sao, bộ lọc chống trùng subtitle/title, tick chọn 1 chạm; tách tab Lộ trình 30 ngày. |
| **TASK-07** | Đóng vai Người dùng cuối kiểm thử Mobile 390px/320px | **`qa`** | Chromium CDP, `scripts/test-*.mjs` | 🟢 DONE (VERIFIED) | 100% | Kiểm thử toàn diện Mobile 390px (iPhone) & 320px (Compact) đạt chuẩn 100%. |
| **TASK-08** | Bóc tách Lịch nhắc nhở (Email Reminder) ra cửa sổ độc lập | **`daily`** | `WorldAdventureScene.tsx`, `HealthCluesRpgWorldHud.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Đã bóc tách cửa sổ độc lập `.hc-daily-reminder-panel-view`. |
| **TASK-09** | Tối ưu Tab Bar Hành trình (Grid 50/50), sửa double `+ +`, nút Đổi/Bỏ | **`daily`** | `WorldAdventureScene.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Tab Bar Responsive 50/50 grid, nút `+ Thêm thói quen` chuẩn, tách hàng `.hc-goal-card-actions-row` [Đổi / Bỏ] & [Xem chi tiết]. |
| **TASK-10** | Trợ lý đồng hành thêm thói quen (Companion Habit Dialog - 1 màn hình) | **`daily`** | `WorldAdventureScene.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Modal Trợ lý Luna/Lumi 2 step hoàn chỉnh, KHÔNG CUỘN (Zero vertical scroll, max-height: 90vh, overflow: hidden). |
| **TASK-11** | Xử lý triệt để dấu `...` trong HUD Nhiệm Care ngoài Thế Giới | **`daily`** | `HealthCluesRpgWorldHud.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Tiêu đề thói quen cho phép xuống dòng (2 dòng), font nhỏ thanh mảnh không bị cắt chữ; nút +10 EXP thu nhỏ gọn gàng. |
| **TASK-12** | Nâng cấp tiêu chuẩn kiểm thử trực quan trên Mobile | **`qa`** | `scripts/verify-mobile-enduser-uiux.mjs` | 🟢 DONE (VERIFIED) | 100% | Đã kiểm tra visual: First fold không bị banner che, không bị `...`, không tràn ngang, test tương tác Trợ lý thêm thói quen. |
| **TASK-13** | Đưa nút [Nhắc nhở] (🔔) xuống Bottom Dock phong cách Native App (Web & Mobile) | **`daily`** | `HealthCluesRpgWorldHud.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Đã thêm nút [Nhắc nhở] (🔔) vào Bottom Dock; gỡ hoàn toàn dải nhắc nhở khỏi modal Hành trình. |
| **TASK-14** | Tối ưu First Fold modal Hành trình Mobile: Thói quen hiển thị ngay không cần cuộn | **`daily`** | `WorldAdventureScene.tsx`, `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Ẩn dialogue bubble Luna & khối tiêu đề trùng lặp trên mobile; First Goal Card xuất hiện ngay tại Y=242.8px. |
| **TASK-15** | Chống trùng lặp thói quen: Deduplicate theo Normalized Title | **`daily`** | `WorldAdventureScene.tsx` | 🟢 DONE (VERIFIED) | 100% | Deduplicate `selectedGoals` theo normalized title và chặn thêm thói quen đã tồn tại. Duplicate count = 0. |
| **TASK-16** | Nâng cấp kiểm thử CDP: Assert First Fold (Y < 250px), Assert 0 Duplicate, Test mở Nhắc nhở từ Dock | **`qa`** | `scripts/verify-mobile-enduser-uiux.mjs` | 🟢 DONE (VERIFIED) | 100% | Kiểm thử tự động trên Chrome CDP thực tế: Dock 4 nút pass, mở Nhắc nhở từ dock pass, first fold Y=242.8px pass, 0 duplicates pass. |
| **TASK-17** | Nâng cấp Tester Agent `healthclues_qa`: Bắt buộc đo BoundingBox, Touch Target (>=40px), Overflow Boundary & Collision | **`qa`** | `scripts/verify-mobile-enduser-uiux.mjs`, `healthclues_qa/agent.md` | 🟢 DONE (VERIFIED) | 100% | Loại bỏ hoàn toàn kiểu test "mù DOM" (chỉ check thẻ tồn tại). Bắt buộc đo kích thước thực, bắt ngay lập tức lỗi tab 11px và card 437px. |
| **TASK-18** | Sửa dứt điểm Flexbox ép dẹp Tab Bar 11px & Card phình 437px chém cụt nút checkmark trên Mobile | **`daily`** | `world-adventure.css` | 🟢 DONE (VERIFIED) | 100% | Tab Bar khóa cứng `flex-shrink: 0`, cao chuẩn 44px; Grid và Card khóa `minmax(0, 1fr)` và `max-width: 100%`, card co gọn 291px trong modal 350px, nút checkmark hiển thị trọn vẹn 100%. |

---

## 🤖 Đội ngũ Subagents chuyên trách (Đang hoạt động)

| Agent ID | Tên chuyên môn | ID Phiên làm việc (Conversation) | Trạng thái hiện tại |
| :--- | :--- | :--- | :---: |
| **`lead`** | **Tech Lead & Orchestrator** | `abff8161-8d04-4588-8fd8-ca4619ccaf85` | 🟢 Điều phối & Giám sát |
| **`daily`** | **Daily Routine & UI Specialist** | `b20ce45b-4474-47ca-ada4-3722f93f3dcc` | 🟢 Hoàn thành nhiệm vụ |
| **`qa`** | **End-User UI/UX Auditor** | `f12658cb-4c4b-4005-ae69-ab0042733481` | 🟢 Hoàn thành kiểm thử |
| **`quiz`** | **Onboarding & Bilingual Specialist** | `c0a17ac5-148d-4487-9a81-88af0868ead6` | 🟢 Sẵn sàng |

---

## 🔄 Quy ước cập nhật trạng thái (Workflow Rules)
1. **Lead giao việc:** Thêm dòng task mới $\rightarrow$ Chuyển trạng thái sang `🟡 IN_PROGRESS`.
2. **Subagent code xong:** Cập nhật tiến độ $\rightarrow$ Chuyển sang `🟣 TESTING` và báo cho QA.
3. **QA test pass 100%:** Chuyển sang `🟢 DONE (VERIFIED)` kèm link log và ảnh screenshot.
4. **Lead báo cáo Owner:** Cập nhật bảng và xuất tóm tắt cho Owner.
